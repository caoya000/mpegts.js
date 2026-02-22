import type { MediaConfig } from "../config";
import { createDefaultConfig } from "../config";
import MediaInfo from "../core/media-info";
import DemuxErrors from "../demux/demux-errors";
import TSDemuxer from "../demux/ts-demuxer";
import FetchLoader from "../io/fetch-loader";
import MP4Remuxer from "../remux/mp4-remuxer";
import type { PlayerConfig, PlayerSegment } from "../types";
import Browser from "../utils/browser";
import Log from "../utils/logger";

export interface PipelineCallbacks {
	onInitSegment: (
		type: string,
		initSegment: {
			type: string;
			container: string;
			codec?: string;
			data?: ArrayBuffer;
			[key: string]: unknown;
		},
	) => void;
	onMediaSegment: (
		type: string,
		mediaSegment: {
			type: string;
			data?: ArrayBuffer;
			[key: string]: unknown;
		},
	) => void;
	onLoadingComplete: () => void;
	onRecoveredEarlyEof: () => void;
	onMediaInfo: (mediaInfo: unknown) => void;
	onIOError: (type: string, info: { code: number; msg: string }) => void;
	onDemuxError: (type: string, info: string) => void;
	onRecommendSeekpoint: (milliseconds: number) => void;
	onHLSDetected: () => void;
}

interface InternalSegment {
	duration: number;
	url: string;
	timestampBase: number;
	cors: boolean;
	withCredentials: boolean;
	filesize?: number;
	redirectedURL?: string;
	referrerPolicy?: ReferrerPolicy;
}

class Pipeline {
	private readonly TAG = "Pipeline";

	private _config: MediaConfig;
	private _callbacks: PipelineCallbacks;

	private _segments: InternalSegment[];
	private _currentSegmentIndex: number;

	private _mediaInfo: MediaInfo | null;
	private _demuxer: TSDemuxer | null;
	private _remuxer: MP4Remuxer | null;
	private _ioctl: FetchLoader | null;

	private _pendingSeekTime: number | null;
	private _pendingResolveSeekPoint: number | null;

	constructor(segments: PlayerSegment[], config: PlayerConfig, callbacks: PipelineCallbacks) {
		this._callbacks = callbacks;

		// Build full MediaConfig by merging PlayerConfig into defaults
		const mediaConfig = createDefaultConfig();
		mediaConfig.isLive = config.isLive;
		mediaConfig.liveSync = config.liveSync;
		mediaConfig.liveSyncMaxLatency = config.liveSyncMaxLatency;
		mediaConfig.liveSyncTargetLatency = config.liveSyncTargetLatency;
		mediaConfig.liveSyncPlaybackRate = config.liveSyncPlaybackRate;
		mediaConfig.enableStashBuffer = config.enableStashBuffer;
		this._config = mediaConfig;

		this._segments = this._buildSegments(segments);
		this._currentSegmentIndex = 0;

		this._mediaInfo = null;
		this._demuxer = null;
		this._remuxer = null;
		this._ioctl = null;

		this._pendingSeekTime = null;
		this._pendingResolveSeekPoint = null;
	}

	private _buildSegments(playerSegments: PlayerSegment[]): InternalSegment[] {
		let totalDuration = 0;
		const segments: InternalSegment[] = playerSegments.map((seg) => {
			const duration = seg.duration ?? 0;
			const internal: InternalSegment = {
				duration,
				url: seg.url,
				timestampBase: totalDuration,
				cors: true,
				withCredentials: false,
			};
			if (this._config.referrerPolicy) {
				internal.referrerPolicy = this._config.referrerPolicy as ReferrerPolicy;
			}
			totalDuration += duration;
			return internal;
		});
		return segments;
	}

	start(): void {
		this._loadSegment(0);
	}

	stop(): void {
		this._internalAbort();
	}

	pause(): void {
		if (this._ioctl?.isWorking()) {
			this._ioctl.pause();
		}
	}

	resume(): void {
		if (this._ioctl?.isPaused()) {
			this._ioctl.resume();
		}
	}

	seek(milliseconds: number): void {
		if (this._mediaInfo == null || !this._mediaInfo.isSeekable()) {
			return;
		}

		const targetSegmentIndex = this._searchSegmentIndexContains(milliseconds);

		if (targetSegmentIndex === this._currentSegmentIndex) {
			// Intra-segment seeking
			const segmentInfo = this._mediaInfo.segments?.[targetSegmentIndex];

			if (segmentInfo === undefined) {
				// Current segment loading started but mediainfo not received yet.
				// Wait for metadata, then seek to expected position.
				this._pendingSeekTime = milliseconds;
			} else {
				const keyframe = segmentInfo.getNearestKeyframe(milliseconds);
				(this._remuxer as MP4Remuxer).seek(keyframe?.milliseconds ?? 0);
				(this._ioctl as FetchLoader).seek(keyframe?.fileposition ?? 0);
				// Will be resolved in _onRemuxerMediaSegmentArrival
				this._pendingResolveSeekPoint = keyframe?.milliseconds ?? null;
			}
		} else {
			// Cross-segment seeking
			const targetSegmentInfo = this._mediaInfo.segments?.[targetSegmentIndex];

			if (targetSegmentInfo === undefined) {
				// Target segment not loaded yet. Load it, then seek after metadata arrives.
				this._pendingSeekTime = milliseconds;
				this._internalAbort();
				(this._remuxer as MP4Remuxer).seek(0);
				(this._remuxer as MP4Remuxer).insertDiscontinuity();
				this._loadSegment(targetSegmentIndex);
			} else {
				// Target segment metadata available, seek directly.
				const keyframe = targetSegmentInfo.getNearestKeyframe(milliseconds);
				this._internalAbort();
				(this._remuxer as MP4Remuxer).seek(milliseconds);
				(this._remuxer as MP4Remuxer).insertDiscontinuity();
				(this._demuxer as TSDemuxer).resetMediaInfo();
				(this._demuxer as TSDemuxer).timestampBase = this._segments[targetSegmentIndex].timestampBase;
				this._loadSegment(targetSegmentIndex, keyframe?.fileposition);
				this._pendingResolveSeekPoint = keyframe?.milliseconds ?? null;
				this._reportSegmentMediaInfo(targetSegmentIndex);
			}
		}
	}

	loadSegments(newSegments: PlayerSegment[]): void {
		// Stop current loading
		this._internalAbort();

		// Reset internal state
		this._pendingSeekTime = null;
		this._pendingResolveSeekPoint = null;
		this._mediaInfo = null;

		// Setup new segments
		this._segments = this._buildSegments(newSegments);
		this._currentSegmentIndex = 0;

		// Destroy demuxer and remuxer for clean state (handles codec/container changes)
		if (this._demuxer) {
			this._demuxer.destroy();
			this._demuxer = null;
		}
		if (this._remuxer) {
			this._remuxer.destroy();
			this._remuxer = null;
		}

		// Start from segment 0 — will re-probe format and recreate demuxer+remuxer
		this._loadSegment(0);
	}

	destroy(): void {
		this._mediaInfo = null;

		if (this._ioctl) {
			this._ioctl.destroy();
			this._ioctl = null;
		}
		if (this._demuxer) {
			this._demuxer.destroy();
			this._demuxer = null;
		}
		if (this._remuxer) {
			this._remuxer.destroy();
			this._remuxer = null;
		}
	}

	// ---- Private methods ----

	private _loadSegment(segmentIndex: number, optionalFrom?: number): void {
		this._currentSegmentIndex = segmentIndex;
		const segment = this._segments[segmentIndex];

		const dataSource = {
			url: segment.url,
			cors: segment.cors,
			withCredentials: segment.withCredentials,
			filesize: segment.filesize,
			redirectedURL: segment.redirectedURL,
			referrerPolicy: segment.referrerPolicy,
		};

		const ioctl = new FetchLoader(dataSource, this._config, segmentIndex);
		this._ioctl = ioctl;

		ioctl.onError = this._onIOException.bind(this);
		ioctl.onSeeked = this._onIOSeeked.bind(this);
		ioctl.onComplete = this._onIOComplete.bind(this) as (extraData: unknown) => void;
		ioctl.onRedirect = this._onIORedirect.bind(this);
		ioctl.onRecoveredEarlyEof = this._onIORecoveredEarlyEof.bind(this);
		ioctl.onHLSDetected = () => this._callbacks.onHLSDetected();

		if (optionalFrom != null && this._demuxer) {
			// Seeking into an already-probed segment: bind demuxer directly
			(this._demuxer as TSDemuxer).bindDataSource(this._ioctl as unknown as Record<string, unknown>);
			(this._demuxer as TSDemuxer).timestampBase = this._segments[segmentIndex].timestampBase;
		} else {
			// Initial load or loadSegments reload: probe the format, create fresh demuxer+remuxer
			ioctl.onDataArrival = this._onInitChunkArrival.bind(this);
		}

		ioctl.open(optionalFrom);
	}

	private _internalAbort(): void {
		if (this._ioctl) {
			this._ioctl.destroy();
			this._ioctl = null;
		}
	}

	private _onInitChunkArrival(data: ArrayBuffer, byteStart: number): number {
		let consumed = 0;

		if (byteStart > 0) {
			// FetchLoader seeked immediately after open, byteStart > 0 callback received
			(this._demuxer as TSDemuxer).bindDataSource(this._ioctl as unknown as Record<string, unknown>);
			(this._demuxer as TSDemuxer).timestampBase = this._segments[this._currentSegmentIndex].timestampBase;

			consumed = (this._demuxer as TSDemuxer).parseChunks(data, byteStart);
		} else {
			// byteStart === 0: initial data, probe first
			let probeData: unknown = null;

			probeData = TSDemuxer.probe(data);
			if ((probeData as Record<string, unknown>).match) {
				this._setupTSDemuxerRemuxer(probeData);
				consumed = (this._demuxer as TSDemuxer).parseChunks(data, byteStart);
			}

			if (!(probeData as Record<string, unknown>).match && !(probeData as Record<string, unknown>).needMoreData) {
				probeData = null;
				Log.e(this.TAG, "Non MPEG-TS, Unsupported media type!");
				Promise.resolve().then(() => {
					this._internalAbort();
				});
				this._callbacks.onDemuxError(DemuxErrors.FORMAT_UNSUPPORTED, "Non MPEG-TS, Unsupported media type!");
			}
		}

		return consumed;
	}

	private _setupTSDemuxerRemuxer(probeData: unknown): void {
		const demuxer = new TSDemuxer(probeData as Record<string, unknown>, this._config);
		this._demuxer = demuxer;

		if (!this._remuxer) {
			this._remuxer = new MP4Remuxer(this._config);
		}

		demuxer.onError = this._onDemuxException.bind(this);
		demuxer.onMediaInfo = this._onMediaInfo.bind(this);

		// Metadata event callbacks: ignored (not forwarded to web-ui)
		demuxer.onTimedID3Metadata = () => {};
		demuxer.onPGSSubtitleData = () => {};
		demuxer.onSynchronousKLVMetadata = () => {};
		demuxer.onAsynchronousKLVMetadata = () => {};
		demuxer.onSMPTE2038Metadata = () => {};
		demuxer.onSCTE35Metadata = () => {};
		demuxer.onPESPrivateDataDescriptor = () => {};
		demuxer.onPESPrivateData = () => {};

		(this._remuxer as MP4Remuxer).bindDataSource(
			this._demuxer as unknown as {
				onDataAvailable: (...args: unknown[]) => void;
				onTrackMetadata: (...args: unknown[]) => void;
			},
		);
		(this._demuxer as TSDemuxer).bindDataSource(this._ioctl as unknown as Record<string, unknown>);

		this._remuxer.onInitSegment = this._onRemuxerInitSegmentArrival.bind(this);
		this._remuxer.onMediaSegment = this._onRemuxerMediaSegmentArrival.bind(
			this,
		) as unknown as typeof this._remuxer.onMediaSegment;
	}

	private _onMediaInfo(mediaInfo: MediaInfo): void {
		if (this._mediaInfo == null) {
			// Store first segment's mediainfo as global mediaInfo
			this._mediaInfo = Object.assign({}, mediaInfo) as MediaInfo;
			this._mediaInfo.keyframesIndex = null;
			this._mediaInfo.segments = [];
			this._mediaInfo.segmentCount = this._segments.length;
			Object.setPrototypeOf(this._mediaInfo, MediaInfo.prototype);
		}

		const segmentInfo = Object.assign({}, mediaInfo) as MediaInfo;
		Object.setPrototypeOf(segmentInfo, MediaInfo.prototype);
		(this._mediaInfo.segments as MediaInfo[])[this._currentSegmentIndex] = segmentInfo;

		// Notify mediaInfo update
		this._reportSegmentMediaInfo(this._currentSegmentIndex);

		if (this._pendingSeekTime != null) {
			Promise.resolve().then(() => {
				const target = this._pendingSeekTime as number;
				this._pendingSeekTime = null;
				this.seek(target);
			});
		}
	}

	private _onIOSeeked(): void {
		(this._remuxer as MP4Remuxer).insertDiscontinuity();
	}

	private _onIOComplete(extraData: number): void {
		const segmentIndex = extraData;
		const nextSegmentIndex = segmentIndex + 1;

		if (nextSegmentIndex < this._segments.length) {
			this._internalAbort();
			if (this._remuxer) {
				this._remuxer.flushStashedSamples();
			}
			this._loadSegment(nextSegmentIndex);
		} else {
			if (this._remuxer) {
				this._remuxer.flushStashedSamples();
			}
			this._callbacks.onLoadingComplete();
		}
	}

	private _onIORedirect(redirectedURL: string): void {
		const segmentIndex = (this._ioctl as FetchLoader).extraData as number;
		this._segments[segmentIndex].redirectedURL = redirectedURL;
	}

	private _onIORecoveredEarlyEof(): void {
		this._callbacks.onRecoveredEarlyEof();
	}

	private _onIOException(type: string, info: { code: number; msg: string }): void {
		Log.e(this.TAG, `IOException: type = ${type}, code = ${info.code}, msg = ${info.msg}`);
		this._callbacks.onIOError(type, info);
	}

	private _onDemuxException(type: string, info: string): void {
		Log.e(this.TAG, `DemuxException: type = ${type}, info = ${info}`);
		this._callbacks.onDemuxError(type, info);
	}

	private _onRemuxerInitSegmentArrival(type: string, initSegment: unknown): void {
		this._callbacks.onInitSegment(
			type,
			initSegment as {
				type: string;
				container: string;
				codec?: string;
				data?: ArrayBuffer;
			},
		);
	}

	private _onRemuxerMediaSegmentArrival(type: string, mediaSegment: Record<string, unknown>): void {
		if (this._pendingSeekTime != null) {
			// Media segments after new-segment cross-seeking should be dropped.
			return;
		}
		this._callbacks.onMediaSegment(type, mediaSegment as { type: string; data?: ArrayBuffer });

		// Resolve pending seekPoint
		if (this._pendingResolveSeekPoint != null && type === "video") {
			const info = mediaSegment.info as Record<string, unknown>;
			const syncPoints = info.syncPoints as Array<Record<string, unknown>>;
			let seekpoint = this._pendingResolveSeekPoint;
			this._pendingResolveSeekPoint = null;

			// Safari: Pass PTS for recommend_seekpoint
			if (Browser.safari && syncPoints.length > 0 && syncPoints[0].originalDts === seekpoint) {
				seekpoint = syncPoints[0].pts as number;
			}

			this._callbacks.onRecommendSeekpoint(seekpoint);
		}
	}

	private _reportSegmentMediaInfo(segmentIndex: number): void {
		const segmentInfo = this._mediaInfo?.segments?.[segmentIndex];
		const exportInfo: Record<string, unknown> = Object.assign({}, segmentInfo) as unknown as Record<string, unknown>;

		exportInfo.duration = this._mediaInfo?.duration;
		exportInfo.segmentCount = this._mediaInfo?.segmentCount;
		delete exportInfo.segments;
		delete exportInfo.keyframesIndex;

		this._callbacks.onMediaInfo(exportInfo);
	}

	private _searchSegmentIndexContains(milliseconds: number): number {
		const segments = this._segments;
		let idx = segments.length - 1;

		for (let i = 0; i < segments.length; i++) {
			if (milliseconds < segments[i].timestampBase) {
				idx = i - 1;
				break;
			}
		}
		return idx;
	}
}

export default Pipeline;
