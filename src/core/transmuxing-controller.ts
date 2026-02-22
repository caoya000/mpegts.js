import EventEmitter from "node:events";
import type { MediaConfig } from "../config";
import DemuxErrors from "../demux/demux-errors";
import TSDemuxer from "../demux/ts-demuxer";
import IOController from "../io/io-controller";
import MP4Remuxer from "../remux/mp4-remuxer";
import Browser from "../utils/browser";
import Log from "../utils/logger";
import MediaInfo from "./media-info";
import TransmuxingEvents from "./transmuxing-events";

interface MediaDataSourceSegment {
	duration?: number;
	filesize?: number;
	url?: string;
	timestampBase?: number;
	cors?: boolean;
	withCredentials?: boolean;
	referrerPolicy?: string;
	redirectedURL?: string;
}

interface MediaDataSource {
	duration?: number;
	filesize?: number;
	url?: string;
	segments?: MediaDataSourceSegment[];
	cors?: boolean;
	withCredentials?: boolean;
	isLive?: boolean;
}

// Transmuxing (IO, Demuxing, Remuxing) controller, with multipart support
class TransmuxingController {
	TAG: string;
	_emitter: EventEmitter;

	_config: MediaConfig & Record<string, unknown>;

	_mediaDataSource: MediaDataSource | null;
	_currentSegmentIndex: number;

	_mediaInfo: MediaInfo | null;
	_demuxer: TSDemuxer | null;
	_remuxer: MP4Remuxer | null;
	_ioctl: IOController | null;

	_pendingSeekTime: number | null;
	_pendingResolveSeekPoint: number | null;

	_statisticsReporter: number | ReturnType<typeof setInterval> | null;

	constructor(mediaDataSource: MediaDataSource, config: MediaConfig & Record<string, unknown>) {
		this.TAG = "TransmuxingController";
		this._emitter = new EventEmitter();

		this._config = config;

		// treat single part media as multipart media, which has only one segment
		if (!mediaDataSource.segments) {
			mediaDataSource.segments = [
				{
					duration: mediaDataSource.duration,
					filesize: mediaDataSource.filesize,
					url: mediaDataSource.url,
				},
			];
		}

		// fill in default IO params if not exists
		if (typeof mediaDataSource.cors !== "boolean") {
			mediaDataSource.cors = true;
		}
		if (typeof mediaDataSource.withCredentials !== "boolean") {
			mediaDataSource.withCredentials = false;
		}

		this._mediaDataSource = mediaDataSource;
		this._currentSegmentIndex = 0;
		let totalDuration = 0;

		(this._mediaDataSource.segments as MediaDataSourceSegment[]).forEach((segment: MediaDataSourceSegment) => {
			// timestampBase for each segment, and calculate total duration
			segment.timestampBase = totalDuration;
			totalDuration += segment.duration ?? 0;
			// params needed by IOController
			segment.cors = mediaDataSource.cors;
			segment.withCredentials = mediaDataSource.withCredentials;
			// referrer policy control, if exist
			if ((config as Record<string, unknown>).referrerPolicy) {
				segment.referrerPolicy = (config as Record<string, unknown>).referrerPolicy as string;
			}
		});

		if (!Number.isNaN(totalDuration) && this._mediaDataSource.duration !== totalDuration) {
			this._mediaDataSource.duration = totalDuration;
		}

		this._mediaInfo = null;
		this._demuxer = null;
		this._remuxer = null;
		this._ioctl = null;

		this._pendingSeekTime = null;
		this._pendingResolveSeekPoint = null;

		this._statisticsReporter = null;
	}

	destroy(): void {
		this._mediaInfo = null;
		this._mediaDataSource = null;

		if (this._statisticsReporter) {
			this._disableStatisticsReporter();
		}
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

		this._emitter.removeAllListeners();
		this._emitter = null as unknown as EventEmitter;
	}

	on(event: string, listener: (...args: unknown[]) => void): void {
		this._emitter.addListener(event, listener);
	}

	off(event: string, listener: (...args: unknown[]) => void): void {
		this._emitter.removeListener(event, listener);
	}

	start(): void {
		this._loadSegment(0);
		this._enableStatisticsReporter();
	}

	_loadSegment(segmentIndex: number, optionalFrom?: number): void {
		this._currentSegmentIndex = segmentIndex;
		const dataSource = (this._mediaDataSource as MediaDataSource).segments?.[segmentIndex];

		const ioctl = new IOController(
			dataSource as unknown as import("../io/loader").DataSource,
			this._config,
			segmentIndex,
		);
		this._ioctl = ioctl;
		ioctl.onError = this._onIOException.bind(this) as unknown as import("../io/io-controller").OnIOErrorCallback;
		ioctl.onSeeked = this._onIOSeeked.bind(this);
		ioctl.onComplete = this._onIOComplete.bind(this) as import("../io/io-controller").OnIOCompleteCallback;
		ioctl.onRedirect = this._onIORedirect.bind(this);
		ioctl.onRecoveredEarlyEof = this._onIORecoveredEarlyEof.bind(this);

		if (optionalFrom) {
			(this._demuxer as TSDemuxer).bindDataSource(this._ioctl as unknown as Record<string, unknown>);
		} else {
			ioctl.onDataArrival = this._onInitChunkArrival.bind(this);
		}

		ioctl.open(optionalFrom);
	}

	stop(): void {
		this._internalAbort();
		this._disableStatisticsReporter();
	}

	_internalAbort(): void {
		if (this._ioctl) {
			this._ioctl.destroy();
			this._ioctl = null;
		}
	}

	pause(): void {
		// take a rest
		if (this._ioctl?.isWorking()) {
			this._ioctl.pause();
			this._disableStatisticsReporter();
		}
	}

	resume(): void {
		if (this._ioctl?.isPaused()) {
			this._ioctl.resume();
			this._enableStatisticsReporter();
		}
	}

	seek(milliseconds: number): void {
		if (this._mediaInfo == null || !this._mediaInfo.isSeekable()) {
			return;
		}

		const targetSegmentIndex = this._searchSegmentIndexContains(milliseconds);

		if (targetSegmentIndex === this._currentSegmentIndex) {
			// intra-segment seeking
			const segmentInfo = this._mediaInfo.segments?.[targetSegmentIndex];

			if (segmentInfo === undefined) {
				// current segment loading started, but mediainfo hasn't received yet
				// wait for the metadata loaded, then seek to expected position
				this._pendingSeekTime = milliseconds;
			} else {
				const keyframe = segmentInfo.getNearestKeyframe(milliseconds);
				(this._remuxer as MP4Remuxer).seek(keyframe?.milliseconds ?? 0);
				(this._ioctl as IOController).seek(keyframe?.fileposition ?? 0);
				// Will be resolved in _onRemuxerMediaSegmentArrival()
				this._pendingResolveSeekPoint = keyframe?.milliseconds ?? null;
			}
		} else {
			// cross-segment seeking
			const targetSegmentInfo = this._mediaInfo.segments?.[targetSegmentIndex];

			if (targetSegmentInfo === undefined) {
				// target segment hasn't been loaded. We need metadata then seek to expected time
				this._pendingSeekTime = milliseconds;
				this._internalAbort();
				(this._remuxer as MP4Remuxer).seek(0);
				(this._remuxer as MP4Remuxer).insertDiscontinuity();
				this._loadSegment(targetSegmentIndex);
				// Here we wait for the metadata loaded, then seek to expected position
			} else {
				// We have target segment's metadata, direct seek to target position
				const keyframe = targetSegmentInfo.getNearestKeyframe(milliseconds);
				this._internalAbort();
				(this._remuxer as MP4Remuxer).seek(milliseconds);
				(this._remuxer as MP4Remuxer).insertDiscontinuity();
				(this._demuxer as TSDemuxer).resetMediaInfo();
				(this._demuxer as TSDemuxer).timestampBase = (
					(this._mediaDataSource as MediaDataSource).segments as MediaDataSourceSegment[]
				)[targetSegmentIndex].timestampBase as number;
				this._loadSegment(targetSegmentIndex, keyframe?.fileposition);
				this._pendingResolveSeekPoint = keyframe?.milliseconds ?? null;
				this._reportSegmentMediaInfo(targetSegmentIndex);
			}
		}

		this._enableStatisticsReporter();
	}

	_searchSegmentIndexContains(milliseconds: number): number {
		const segments = (this._mediaDataSource as MediaDataSource).segments as MediaDataSourceSegment[];
		let idx = segments.length - 1;

		for (let i = 0; i < segments.length; i++) {
			if (milliseconds < (segments[i].timestampBase ?? 0)) {
				idx = i - 1;
				break;
			}
		}
		return idx;
	}

	_onInitChunkArrival(data: ArrayBuffer, byteStart: number): number {
		let consumed = 0;

		if (byteStart > 0) {
			// IOController seeked immediately after opened, byteStart > 0 callback may received
			(this._demuxer as TSDemuxer).bindDataSource(this._ioctl as unknown as Record<string, unknown>);
			(this._demuxer as TSDemuxer).timestampBase = (
				(this._mediaDataSource as MediaDataSource).segments as MediaDataSourceSegment[]
			)[this._currentSegmentIndex].timestampBase as number;

			consumed = (this._demuxer as TSDemuxer).parseChunks(data, byteStart);
		} else {
			// byteStart == 0, Initial data, probe it first
			let probeData: unknown = null;

			// Non-FLV, try MPEG-TS probe
			probeData = TSDemuxer.probe(data);
			if ((probeData as Record<string, unknown>).match) {
				// Hit as MPEG-TS
				this._setupTSDemuxerRemuxer(probeData);
				consumed = (this._demuxer as TSDemuxer).parseChunks(data, byteStart);
			}

			if (!(probeData as Record<string, unknown>).match && !(probeData as Record<string, unknown>).needMoreData) {
				// Both probing as FLV / MPEG-TS failed, report error
				probeData = null;
				Log.e(this.TAG, "Non MPEG-TS/FLV, Unsupported media type!");
				Promise.resolve().then(() => {
					this._internalAbort();
				});
				this._emitter.emit(
					TransmuxingEvents.DEMUX_ERROR,
					DemuxErrors.FORMAT_UNSUPPORTED,
					"Non MPEG-TS/FLV, Unsupported media type!",
				);
				// Leave consumed as 0
			}
		}

		return consumed;
	}

	_setupTSDemuxerRemuxer(probeData: unknown): void {
		const demuxer = new TSDemuxer(probeData as Record<string, unknown>, this._config);
		this._demuxer = demuxer;

		if (!this._remuxer) {
			this._remuxer = new MP4Remuxer(this._config);
		}

		demuxer.onError = this._onDemuxException.bind(this);
		demuxer.onMediaInfo = this._onMediaInfo.bind(this);
		demuxer.onMetaDataArrived = this._onMetaDataArrived.bind(this);
		demuxer.onTimedID3Metadata = this._onTimedID3Metadata.bind(this) as unknown as typeof demuxer.onTimedID3Metadata;
		demuxer.onPGSSubtitleData = this._onPGSSubtitle.bind(this) as unknown as typeof demuxer.onPGSSubtitleData;
		demuxer.onSynchronousKLVMetadata = this._onSynchronousKLVMetadata.bind(
			this,
		) as unknown as typeof demuxer.onSynchronousKLVMetadata;
		demuxer.onAsynchronousKLVMetadata = this._onAsynchronousKLVMetadata.bind(this);
		demuxer.onSMPTE2038Metadata = this._onSMPTE2038Metadata.bind(this) as unknown as typeof demuxer.onSMPTE2038Metadata;
		demuxer.onSCTE35Metadata = this._onSCTE35Metadata.bind(this) as unknown as typeof demuxer.onSCTE35Metadata;
		demuxer.onPESPrivateDataDescriptor = this._onPESPrivateDataDescriptor.bind(this);
		demuxer.onPESPrivateData = this._onPESPrivateData.bind(this) as unknown as typeof demuxer.onPESPrivateData;

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

	_onMediaInfo(mediaInfo: MediaInfo): void {
		if (this._mediaInfo == null) {
			// Store first segment's mediainfo as global mediaInfo
			this._mediaInfo = Object.assign({}, mediaInfo) as MediaInfo;
			this._mediaInfo.keyframesIndex = null;
			this._mediaInfo.segments = [];
			this._mediaInfo.segmentCount = (
				(this._mediaDataSource as MediaDataSource).segments as MediaDataSourceSegment[]
			).length;
			Object.setPrototypeOf(this._mediaInfo, MediaInfo.prototype);
		}

		const segmentInfo = Object.assign({}, mediaInfo) as MediaInfo;
		Object.setPrototypeOf(segmentInfo, MediaInfo.prototype);
		(this._mediaInfo.segments as MediaInfo[])[this._currentSegmentIndex] = segmentInfo;

		// notify mediaInfo update
		this._reportSegmentMediaInfo(this._currentSegmentIndex);

		if (this._pendingSeekTime != null) {
			Promise.resolve().then(() => {
				const target = this._pendingSeekTime as number;
				this._pendingSeekTime = null;
				this.seek(target);
			});
		}
	}

	_onMetaDataArrived(metadata: unknown): void {
		this._emitter.emit(TransmuxingEvents.METADATA_ARRIVED, metadata);
	}

	_onScriptDataArrived(data: unknown): void {
		this._emitter.emit(TransmuxingEvents.SCRIPTDATA_ARRIVED, data);
	}

	_onTimedID3Metadata(timed_id3_metadata: Record<string, unknown>): void {
		const timestamp_base = (this._remuxer as MP4Remuxer).getTimestampBase();
		if (timestamp_base === undefined) {
			return;
		}

		if (timed_id3_metadata.pts !== undefined) {
			timed_id3_metadata.pts = (timed_id3_metadata.pts as number) - timestamp_base;
		}

		if (timed_id3_metadata.dts !== undefined) {
			timed_id3_metadata.dts = (timed_id3_metadata.dts as number) - timestamp_base;
		}

		this._emitter.emit(TransmuxingEvents.TIMED_ID3_METADATA_ARRIVED, timed_id3_metadata);
	}

	_onPGSSubtitle(pgs_data: Record<string, unknown>): void {
		const timestamp_base = (this._remuxer as MP4Remuxer).getTimestampBase();
		if (timestamp_base === undefined) {
			return;
		}

		if (pgs_data.pts !== undefined) {
			pgs_data.pts = (pgs_data.pts as number) - timestamp_base;
		}

		if (pgs_data.dts !== undefined) {
			pgs_data.dts = (pgs_data.dts as number) - timestamp_base;
		}

		this._emitter.emit(TransmuxingEvents.PGS_SUBTITLE_ARRIVED, pgs_data);
	}

	_onSynchronousKLVMetadata(synchronous_klv_metadata: Record<string, unknown>): void {
		const timestamp_base = (this._remuxer as MP4Remuxer).getTimestampBase();
		if (timestamp_base === undefined) {
			return;
		}

		if (synchronous_klv_metadata.pts !== undefined) {
			synchronous_klv_metadata.pts = (synchronous_klv_metadata.pts as number) - timestamp_base;
		}

		if (synchronous_klv_metadata.dts !== undefined) {
			synchronous_klv_metadata.dts = (synchronous_klv_metadata.dts as number) - timestamp_base;
		}

		this._emitter.emit(TransmuxingEvents.SYNCHRONOUS_KLV_METADATA_ARRIVED, synchronous_klv_metadata);
	}

	_onAsynchronousKLVMetadata(asynchronous_klv_metadata: unknown): void {
		this._emitter.emit(TransmuxingEvents.ASYNCHRONOUS_KLV_METADATA_ARRIVED, asynchronous_klv_metadata);
	}

	_onSMPTE2038Metadata(smpte2038_metadata: Record<string, unknown>): void {
		const timestamp_base = (this._remuxer as MP4Remuxer).getTimestampBase();
		if (timestamp_base === undefined) {
			return;
		}

		if (smpte2038_metadata.pts !== undefined) {
			smpte2038_metadata.pts = (smpte2038_metadata.pts as number) - timestamp_base;
		}

		if (smpte2038_metadata.dts !== undefined) {
			smpte2038_metadata.dts = (smpte2038_metadata.dts as number) - timestamp_base;
		}

		if (smpte2038_metadata.nearest_pts !== undefined) {
			smpte2038_metadata.nearest_pts = (smpte2038_metadata.nearest_pts as number) - timestamp_base;
		}

		this._emitter.emit(TransmuxingEvents.SMPTE2038_METADATA_ARRIVED, smpte2038_metadata);
	}

	_onSCTE35Metadata(scte35: Record<string, unknown>): void {
		const timestamp_base = (this._remuxer as MP4Remuxer).getTimestampBase();
		if (timestamp_base === undefined) {
			return;
		}

		if (scte35.pts !== undefined) {
			scte35.pts = (scte35.pts as number) - timestamp_base;
		}

		if (scte35.nearest_pts !== undefined) {
			scte35.nearest_pts = (scte35.nearest_pts as number) - timestamp_base;
		}

		this._emitter.emit(TransmuxingEvents.SCTE35_METADATA_ARRIVED, scte35);
	}

	_onPESPrivateDataDescriptor(descriptor: unknown): void {
		this._emitter.emit(TransmuxingEvents.PES_PRIVATE_DATA_DESCRIPTOR, descriptor);
	}

	_onPESPrivateData(private_data: Record<string, unknown>): void {
		const timestamp_base = (this._remuxer as MP4Remuxer).getTimestampBase();
		if (timestamp_base === undefined) {
			return;
		}

		if (private_data.pts !== undefined) {
			private_data.pts = (private_data.pts as number) - timestamp_base;
		}

		if (private_data.nearest_pts !== undefined) {
			private_data.nearest_pts = (private_data.nearest_pts as number) - timestamp_base;
		}

		if (private_data.dts !== undefined) {
			private_data.dts = (private_data.dts as number) - timestamp_base;
		}

		this._emitter.emit(TransmuxingEvents.PES_PRIVATE_DATA_ARRIVED, private_data);
	}

	_onIOSeeked(): void {
		(this._remuxer as MP4Remuxer).insertDiscontinuity();
	}

	_onIOComplete(extraData: number): void {
		const segmentIndex = extraData;
		const nextSegmentIndex = segmentIndex + 1;

		if (nextSegmentIndex < ((this._mediaDataSource as MediaDataSource).segments as MediaDataSourceSegment[]).length) {
			this._internalAbort();
			if (this._remuxer) {
				this._remuxer.flushStashedSamples();
			}
			this._loadSegment(nextSegmentIndex);
		} else {
			if (this._remuxer) {
				this._remuxer.flushStashedSamples();
			}
			this._emitter.emit(TransmuxingEvents.LOADING_COMPLETE);
			this._disableStatisticsReporter();
		}
	}

	_onIORedirect(redirectedURL: string): void {
		const segmentIndex = (this._ioctl as IOController).extraData as number;
		((this._mediaDataSource as MediaDataSource).segments as MediaDataSourceSegment[])[segmentIndex].redirectedURL =
			redirectedURL;
	}

	_onIORecoveredEarlyEof(): void {
		this._emitter.emit(TransmuxingEvents.RECOVERED_EARLY_EOF);
	}

	_onIOException(type: string, info: Record<string, unknown>): void {
		Log.e(this.TAG, `IOException: type = ${type}, code = ${info.code}, msg = ${info.msg}`);
		this._emitter.emit(TransmuxingEvents.IO_ERROR, type, info);
		this._disableStatisticsReporter();
	}

	_onDemuxException(type: string, info: string): void {
		Log.e(this.TAG, `DemuxException: type = ${type}, info = ${info}`);
		this._emitter.emit(TransmuxingEvents.DEMUX_ERROR, type, info);
	}

	_onRemuxerInitSegmentArrival(type: string, initSegment: unknown): void {
		this._emitter.emit(TransmuxingEvents.INIT_SEGMENT, type, initSegment);
	}

	_onRemuxerMediaSegmentArrival(type: string, mediaSegment: Record<string, unknown>): void {
		if (this._pendingSeekTime != null) {
			// Media segments after new-segment cross-seeking should be dropped.
			return;
		}
		this._emitter.emit(TransmuxingEvents.MEDIA_SEGMENT, type, mediaSegment);

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
			// else: use original DTS (keyframe.milliseconds)

			this._emitter.emit(TransmuxingEvents.RECOMMEND_SEEKPOINT, seekpoint);
		}
	}

	_enableStatisticsReporter(): void {
		if (this._statisticsReporter == null) {
			this._statisticsReporter = self.setInterval(
				this._reportStatisticsInfo.bind(this),
				this._config.statisticsInfoReportInterval,
			);
		}
	}

	_disableStatisticsReporter(): void {
		if (this._statisticsReporter) {
			self.clearInterval(this._statisticsReporter);
			this._statisticsReporter = null;
		}
	}

	_reportSegmentMediaInfo(segmentIndex: number): void {
		const segmentInfo = this._mediaInfo?.segments?.[segmentIndex];
		const exportInfo: Record<string, unknown> = Object.assign({}, segmentInfo) as unknown as Record<string, unknown>;

		exportInfo.duration = this._mediaInfo?.duration;
		exportInfo.segmentCount = this._mediaInfo?.segmentCount;
		delete exportInfo.segments;
		delete exportInfo.keyframesIndex;

		this._emitter.emit(TransmuxingEvents.MEDIA_INFO, exportInfo);
	}

	_reportStatisticsInfo(): void {
		const ioctl = this._ioctl as IOController;
		const info: Record<string, unknown> = {};

		info.url = ioctl.currentURL;
		info.hasRedirect = ioctl.hasRedirect;
		if (info.hasRedirect) {
			info.redirectedURL = ioctl.currentRedirectedURL;
		}

		info.speed = ioctl.currentSpeed;
		info.loaderType = ioctl.loaderType;
		info.currentSegmentIndex = this._currentSegmentIndex;
		info.totalSegmentCount = ((this._mediaDataSource as MediaDataSource).segments as MediaDataSourceSegment[]).length;

		this._emitter.emit(TransmuxingEvents.STATISTICS_INFO, info);
	}
}

export default TransmuxingController;
