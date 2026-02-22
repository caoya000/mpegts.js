import EventEmitter from "node:events";
import type { MediaConfig } from "../config";
import Browser from "../utils/browser";
import { IllegalStateException } from "../utils/exception";
import Log from "../utils/logger";
import MSEEvents from "./mse-events";

export interface MediaElementProxy {
	getCurrentTime(): number;
	getReadyState(): number;
}

interface InitSegment {
	type: string;
	container: string;
	codec?: string;
	data?: ArrayBuffer;
	mediaDuration?: number;
	timestampOffset?: number;
	[key: string]: unknown;
}

interface MediaSegment {
	type: string;
	data?: ArrayBuffer;
	timestampOffset?: number;
	info?: unknown;
	[key: string]: unknown;
}

interface RemoveRange {
	start: number;
	end: number;
}

interface SourceBufferMap {
	video: SourceBuffer | null;
	audio: SourceBuffer | null;
	[key: string]: SourceBuffer | null;
}

interface PendingSegmentsMap {
	video: (InitSegment | MediaSegment)[];
	audio: (InitSegment | MediaSegment)[];
	[key: string]: (InitSegment | MediaSegment)[];
}

interface PendingRemoveRangesMap {
	video: RemoveRange[];
	audio: RemoveRange[];
	[key: string]: RemoveRange[];
}

interface MimeTypesMap {
	video: string | null;
	audio: string | null;
	[key: string]: string | null;
}

interface LastInitSegmentsMap {
	video: InitSegment | null;
	audio: InitSegment | null;
	[key: string]: InitSegment | null;
}

interface EventHandlers {
	onSourceOpen: () => void;
	onSourceEnded: () => void;
	onSourceClose: () => void;
	onStartStreaming: () => void;
	onEndStreaming: () => void;
	onQualityChange: () => void;
	onSourceBufferError: (e: Event) => void;
	onSourceBufferUpdateEnd: () => void;
}

interface MSEMediaSource {
	readyState: string;
	duration: number;
	streaming?: boolean;
	handle?: unknown;
	addSourceBuffer(mimeType: string): SourceBuffer;
	removeSourceBuffer(sb: SourceBuffer): void;
	endOfStream(): void;
	addEventListener(type: string, listener: unknown): void;
	removeEventListener(type: string, listener: unknown): void;
}

// Media Source Extensions controller
class MSEController {
	TAG: string;

	_config: MediaConfig;
	_emitter: EventEmitter;

	e: EventHandlers | null;

	_useManagedMediaSource: boolean;

	_mediaSource: MSEMediaSource | null;
	_mediaSourceObjectURL: string | null;

	_mediaElementProxy: MediaElementProxy | null;

	_isBufferFull: boolean;
	_hasPendingEos: boolean;

	_requireSetMediaDuration: boolean;
	_pendingMediaDuration: number;

	_pendingSourceBufferInit: InitSegment[];
	_mimeTypes: MimeTypesMap;
	_sourceBuffers: SourceBufferMap;
	_lastInitSegments: LastInitSegmentsMap;
	_pendingSegments: PendingSegmentsMap;
	_pendingRemoveRanges: PendingRemoveRangesMap;

	constructor(config: MediaConfig) {
		this.TAG = "MSEController";

		this._config = config;
		this._emitter = new EventEmitter();

		if (this._config.isLive && this._config.autoCleanupSourceBuffer === undefined) {
			// For live stream, do auto cleanup by default
			this._config.autoCleanupSourceBuffer = true;
		}

		this.e = {
			onSourceOpen: this._onSourceOpen.bind(this),
			onSourceEnded: this._onSourceEnded.bind(this),
			onSourceClose: this._onSourceClose.bind(this),
			onStartStreaming: this._onStartStreaming.bind(this),
			onEndStreaming: this._onEndStreaming.bind(this),
			onQualityChange: this._onQualityChange.bind(this),
			onSourceBufferError: this._onSourceBufferError.bind(this),
			onSourceBufferUpdateEnd: this._onSourceBufferUpdateEnd.bind(this),
		};

		// Use ManagedMediaSource only if w3c MediaSource is not available (e.g. iOS Safari)
		this._useManagedMediaSource = "ManagedMediaSource" in self && !("MediaSource" in self);

		this._mediaSource = null;
		this._mediaSourceObjectURL = null;

		this._mediaElementProxy = null;

		this._isBufferFull = false;
		this._hasPendingEos = false;

		this._requireSetMediaDuration = false;
		this._pendingMediaDuration = 0;

		this._pendingSourceBufferInit = [];
		this._mimeTypes = {
			video: null,
			audio: null,
		};
		this._sourceBuffers = {
			video: null,
			audio: null,
		};
		this._lastInitSegments = {
			video: null,
			audio: null,
		};
		this._pendingSegments = {
			video: [],
			audio: [],
		};
		this._pendingRemoveRanges = {
			video: [],
			audio: [],
		};
	}

	destroy(): void {
		if (this._mediaSource) {
			this.shutdown();
		}
		if (this._mediaSourceObjectURL) {
			this.revokeObjectURL();
		}
		this.e = null;
		this._emitter.removeAllListeners();
		this._emitter = null as unknown as EventEmitter;
	}

	on(event: string, listener: (...args: unknown[]) => void): void {
		this._emitter.addListener(event, listener);
	}

	off(event: string, listener: (...args: unknown[]) => void): void {
		this._emitter.removeListener(event, listener);
	}

	initialize(mediaElementProxy: MediaElementProxy): void {
		if (this._mediaSource) {
			throw new IllegalStateException("MediaSource has been attached to an HTMLMediaElement!");
		}

		if (this._useManagedMediaSource) {
			Log.v(this.TAG, "Using ManagedMediaSource");
		}

		const selfRecord = self as unknown as Record<string, unknown>;
		const MSEConstructor = (this._useManagedMediaSource ? selfRecord.ManagedMediaSource : selfRecord.MediaSource) as {
			new (): MSEMediaSource;
		};
		const ms = new MSEConstructor();
		this._mediaSource = ms;
		ms.addEventListener("sourceopen", this.e?.onSourceOpen);
		ms.addEventListener("sourceended", this.e?.onSourceEnded);
		ms.addEventListener("sourceclose", this.e?.onSourceClose);

		if (this._useManagedMediaSource) {
			ms.addEventListener("startstreaming", this.e?.onStartStreaming);
			ms.addEventListener("endstreaming", this.e?.onEndStreaming);
			ms.addEventListener("qualitychange", this.e?.onQualityChange);
		}

		this._mediaElementProxy = mediaElementProxy;
	}

	shutdown(): void {
		if (this._mediaSource) {
			const ms = this._mediaSource;
			for (const type in this._sourceBuffers) {
				// pending segments should be discard
				const ps = this._pendingSegments[type];
				ps.splice(0, ps.length);
				this._pendingSegments[type] = null as unknown as (InitSegment | MediaSegment)[];
				this._pendingRemoveRanges[type] = null as unknown as RemoveRange[];
				this._lastInitSegments[type] = null;

				// remove all sourcebuffers
				const sb = this._sourceBuffers[type];
				if (sb) {
					if (ms.readyState !== "closed") {
						// ms edge can throw an error: Unexpected call to method or property access
						try {
							ms.removeSourceBuffer(sb);
						} catch (error: unknown) {
							Log.e(this.TAG, (error as Error).message);
						}
						sb.removeEventListener("error", this.e?.onSourceBufferError as EventListener);
						sb.removeEventListener("updateend", this.e?.onSourceBufferUpdateEnd as EventListener);
					}
					this._mimeTypes[type] = null;
					this._sourceBuffers[type] = null;
				}
			}
			if (ms.readyState === "open") {
				try {
					ms.endOfStream();
				} catch (error: unknown) {
					Log.e(this.TAG, (error as Error).message);
				}
			}
			this._mediaElementProxy = null;
			ms.removeEventListener("sourceopen", this.e?.onSourceOpen);
			ms.removeEventListener("sourceended", this.e?.onSourceEnded);
			ms.removeEventListener("sourceclose", this.e?.onSourceClose);
			if (this._useManagedMediaSource) {
				ms.removeEventListener("startstreaming", this.e?.onStartStreaming);
				ms.removeEventListener("endstreaming", this.e?.onEndStreaming);
				ms.removeEventListener("qualitychange", this.e?.onQualityChange);
			}
			this._pendingSourceBufferInit = [];
			this._isBufferFull = false;
			this._mediaSource = null;
		}
	}

	isManagedMediaSource(): boolean {
		return this._useManagedMediaSource;
	}

	getObject(): MSEMediaSource {
		if (!this._mediaSource) {
			throw new IllegalStateException("MediaSource has not been initialized yet!");
		}
		return this._mediaSource;
	}

	getHandle(): unknown {
		if (!this._mediaSource) {
			throw new IllegalStateException("MediaSource has not been initialized yet!");
		}
		return this._mediaSource.handle;
	}

	getObjectURL(): string {
		if (!this._mediaSource) {
			throw new IllegalStateException("MediaSource has not been initialized yet!");
		}

		if (this._mediaSourceObjectURL === null) {
			this._mediaSourceObjectURL = URL.createObjectURL(this._mediaSource as unknown as MediaSource);
		}
		return this._mediaSourceObjectURL;
	}

	revokeObjectURL(): void {
		if (this._mediaSourceObjectURL) {
			URL.revokeObjectURL(this._mediaSourceObjectURL);
			this._mediaSourceObjectURL = null;
		}
	}

	appendInitSegment(initSegment: InitSegment, deferred: boolean = false): void {
		if (!this._mediaSource || this._mediaSource.readyState !== "open" || this._mediaSource.streaming === false) {
			// sourcebuffer creation requires mediaSource.readyState === 'open'
			// so we defer the sourcebuffer creation, until sourceopen event triggered
			this._pendingSourceBufferInit.push(initSegment);
			// make sure that this InitSegment is in the front of pending segments queue
			this._pendingSegments[initSegment.type].push(initSegment);
			return;
		}

		const is = initSegment;
		let mimeType = `${is.container}`;
		if (is.codec && is.codec.length > 0) {
			if (is.codec === "opus" && Browser.safari) {
				is.codec = "Opus";
			}
			mimeType += `;codecs=${is.codec}`;
		}

		let firstInitSegment = false;

		Log.v(this.TAG, `Received Initialization Segment, mimeType: ${mimeType}`);
		this._lastInitSegments[is.type] = is;

		if (mimeType !== this._mimeTypes[is.type]) {
			if (!this._mimeTypes[is.type]) {
				// empty, first chance create sourcebuffer
				firstInitSegment = true;
				try {
					const sb = this._mediaSource.addSourceBuffer(mimeType);
					this._sourceBuffers[is.type] = sb;
					sb.addEventListener("error", this.e?.onSourceBufferError as EventListener);
					sb.addEventListener("updateend", this.e?.onSourceBufferUpdateEnd as EventListener);
				} catch (error: unknown) {
					Log.e(this.TAG, (error as Error).message);
					if ((error as DOMException).name !== "NotSupportedError") {
						this._emitter.emit(MSEEvents.ERROR, {
							code: (error as DOMException).code,
							msg: (error as Error).message,
						});
						return;
					}
				}
			} else {
				Log.v(
					this.TAG,
					`Notice: ${is.type} mimeType changed, origin: ${this._mimeTypes[is.type]}, target: ${mimeType}`,
				);
			}
			this._mimeTypes[is.type] = mimeType;
		}

		if (!deferred) {
			// deferred means this InitSegment has been pushed to pendingSegments queue
			this._pendingSegments[is.type].push(is);
		}
		if (!firstInitSegment) {
			// append immediately only if init segment in subsequence
			if (this._sourceBuffers[is.type] && !this._sourceBuffers[is.type]?.updating) {
				this._doAppendSegments();
			}
		}
		if (Browser.safari && is.container === "audio/mpeg" && is.mediaDuration != null && is.mediaDuration > 0) {
			// 'audio/mpeg' track under Safari may cause MediaElement's duration to be NaN
			// Manually correct MediaSource.duration to make progress bar seekable, and report right duration
			this._requireSetMediaDuration = true;
			this._pendingMediaDuration = is.mediaDuration / 1000; // in seconds
			this._updateMediaSourceDuration();
		}
	}

	appendMediaSegment(mediaSegment: MediaSegment): void {
		const ms = mediaSegment;
		this._pendingSegments[ms.type].push(ms);

		if (this._config.autoCleanupSourceBuffer && this._needCleanupSourceBuffer()) {
			this._doCleanupSourceBuffer();
		}

		const sb = this._sourceBuffers[ms.type];
		if (sb && !sb.updating && !this._hasPendingRemoveRanges()) {
			this._doAppendSegments();
		}
	}

	flush(): void {
		// remove all appended buffers
		for (const type in this._sourceBuffers) {
			if (!this._sourceBuffers[type]) {
				continue;
			}

			// abort current buffer append algorithm
			const sb = this._sourceBuffers[type] as SourceBuffer;
			if (this._mediaSource?.readyState === "open") {
				try {
					// If range removal algorithm is running, InvalidStateError will be throwed
					// Ignore it.
					sb.abort();
				} catch (error: unknown) {
					Log.e(this.TAG, (error as Error).message);
				}
			}

			// pending segments should be discard
			const ps = this._pendingSegments[type];
			ps.splice(0, ps.length);

			if (this._mediaSource?.readyState === "closed") {
				// Parent MediaSource object has been detached from HTMLMediaElement
				continue;
			}

			// record ranges to be remove from SourceBuffer
			for (let i = 0; i < sb.buffered.length; i++) {
				const start = sb.buffered.start(i);
				const end = sb.buffered.end(i);
				this._pendingRemoveRanges[type].push({ start, end });
			}

			// if sb is not updating, let's remove ranges now!
			if (!sb.updating) {
				this._doRemoveRanges();
			}

			// Safari 10 may get InvalidStateError in the later appendBuffer() after SourceBuffer.remove() call
			// Internal parser's state may be invalid at this time. Re-append last InitSegment to workaround.
			// Related issue: https://bugs.webkit.org/show_bug.cgi?id=159230
			if (Browser.safari) {
				const lastInitSegment = this._lastInitSegments[type];
				if (lastInitSegment) {
					this._pendingSegments[type].push(lastInitSegment);
					if (!sb.updating) {
						this._doAppendSegments();
					}
				}
			}
		}
	}

	endOfStream(): void {
		const ms = this._mediaSource;
		const sb = this._sourceBuffers;
		if (!ms || ms.readyState !== "open") {
			if (ms && ms.readyState === "closed" && this._hasPendingSegments()) {
				// If MediaSource hasn't turned into open state, and there're pending segments
				// Mark pending endOfStream, defer call until all pending segments appended complete
				this._hasPendingEos = true;
			}
			return;
		}
		if (sb.video?.updating || sb.audio?.updating) {
			// If any sourcebuffer is updating, defer endOfStream operation
			// See _onSourceBufferUpdateEnd()
			this._hasPendingEos = true;
		} else {
			this._hasPendingEos = false;
			// Notify media data loading complete
			// This is helpful for correcting total duration to match last media segment
			// Otherwise MediaElement's ended event may not be triggered
			ms.endOfStream();
		}
	}

	_needCleanupSourceBuffer(): boolean {
		if (!this._config.autoCleanupSourceBuffer) {
			return false;
		}

		const currentTime = this._mediaElementProxy?.getCurrentTime();

		for (const type in this._sourceBuffers) {
			const sb = this._sourceBuffers[type];
			if (sb) {
				const buffered = sb.buffered;
				if (buffered.length >= 1) {
					if ((currentTime as number) - buffered.start(0) >= this._config.autoCleanupMaxBackwardDuration) {
						return true;
					}
				}
			}
		}

		return false;
	}

	_doCleanupSourceBuffer(): void {
		const currentTime = this._mediaElementProxy?.getCurrentTime();

		for (const type in this._sourceBuffers) {
			const sb = this._sourceBuffers[type];
			if (sb) {
				const buffered = sb.buffered;
				let doRemove = false;

				for (let i = 0; i < buffered.length; i++) {
					const start = buffered.start(i);
					const end = buffered.end(i);

					if (start <= (currentTime as number) && (currentTime as number) < end + 3) {
						// padding 3 seconds
						if ((currentTime as number) - start >= this._config.autoCleanupMaxBackwardDuration) {
							doRemove = true;
							const removeEnd = (currentTime as number) - this._config.autoCleanupMinBackwardDuration;
							this._pendingRemoveRanges[type].push({
								start: start,
								end: removeEnd,
							});
						}
					} else if (end < (currentTime as number)) {
						doRemove = true;
						this._pendingRemoveRanges[type].push({ start: start, end: end });
					}
				}

				if (doRemove && !sb.updating) {
					this._doRemoveRanges();
				}
			}
		}
	}

	_updateMediaSourceDuration(): void {
		const sb = this._sourceBuffers;
		if (this._mediaElementProxy?.getReadyState() === 0 || this._mediaSource?.readyState !== "open") {
			return;
		}
		if (sb.video?.updating || sb.audio?.updating) {
			return;
		}

		const current = (this._mediaSource as MSEMediaSource).duration;
		const target = this._pendingMediaDuration;

		if (target > 0 && (Number.isNaN(current) || target > current)) {
			Log.v(this.TAG, `Update MediaSource duration from ${current} to ${target}`);
			(this._mediaSource as MSEMediaSource).duration = target;
		}

		this._requireSetMediaDuration = false;
		this._pendingMediaDuration = 0;
	}

	_doRemoveRanges(): void {
		for (const type in this._pendingRemoveRanges) {
			if (!this._sourceBuffers[type] || this._sourceBuffers[type]?.updating) {
				continue;
			}
			const sb = this._sourceBuffers[type] as SourceBuffer;
			const ranges = this._pendingRemoveRanges[type];
			while (ranges.length && !sb.updating) {
				const range = ranges.shift() as RemoveRange;
				sb.remove(range.start, range.end);
			}
		}
	}

	_doAppendSegments(): void {
		const pendingSegments = this._pendingSegments;

		for (const type in pendingSegments) {
			if (!this._sourceBuffers[type] || this._sourceBuffers[type]?.updating || this._mediaSource?.streaming === false) {
				continue;
			}

			if (pendingSegments[type].length > 0) {
				const segment = pendingSegments[type].shift() as InitSegment | MediaSegment;

				if (typeof segment.timestampOffset === "number" && Number.isFinite(segment.timestampOffset)) {
					// For MPEG audio stream in MSE, if unbuffered-seeking occurred
					// We need explicitly set timestampOffset to the desired point in timeline for mpeg SourceBuffer.
					const currentOffset = this._sourceBuffers[type]?.timestampOffset;
					const targetOffset = segment.timestampOffset / 1000; // in seconds

					const delta = Math.abs((currentOffset as number) - targetOffset);
					if (delta > 0.1) {
						// If time delta > 100ms
						Log.v(this.TAG, `Update MPEG audio timestampOffset from ${currentOffset} to ${targetOffset}`);
						(this._sourceBuffers[type] as SourceBuffer).timestampOffset = targetOffset;
					}
					delete segment.timestampOffset;
				}

				if (!segment.data || segment.data.byteLength === 0) {
					// Ignore empty buffer
					continue;
				}

				try {
					this._sourceBuffers[type]?.appendBuffer(segment.data);
					this._isBufferFull = false;
				} catch (error: unknown) {
					this._pendingSegments[type].unshift(segment);
					if ((error as DOMException).code === 22) {
						// QuotaExceededError
						/* Notice that FireFox may not throw QuotaExceededError if SourceBuffer is full
						 * Currently we can only do lazy-load to avoid SourceBuffer become scattered.
						 * SourceBuffer eviction policy may be changed in future version of FireFox.
						 *
						 * Related issues:
						 * https://bugzilla.mozilla.org/show_bug.cgi?id=1279885
						 * https://bugzilla.mozilla.org/show_bug.cgi?id=1280023
						 */

						// report buffer full, abort network IO
						if (!this._isBufferFull) {
							this._emitter.emit(MSEEvents.BUFFER_FULL);
						}
						this._isBufferFull = true;
					} else {
						Log.e(this.TAG, (error as Error).message);
						this._emitter.emit(MSEEvents.ERROR, {
							code: (error as DOMException).code,
							msg: (error as Error).message,
						});
					}
				}
			}
		}
	}

	_onSourceOpen(): void {
		Log.v(this.TAG, "MediaSource onSourceOpen");
		this._mediaSource?.removeEventListener("sourceopen", this.e?.onSourceOpen);
		// deferred sourcebuffer creation / initialization
		if (this._pendingSourceBufferInit.length > 0) {
			const pendings = this._pendingSourceBufferInit;
			while (pendings.length) {
				const segment = pendings.shift() as InitSegment;
				this.appendInitSegment(segment, true);
			}
		}
		// there may be some pending media segments, append them
		if (this._hasPendingSegments()) {
			this._doAppendSegments();
		}
		this._emitter.emit(MSEEvents.SOURCE_OPEN);
	}

	_onStartStreaming(): void {
		Log.v(this.TAG, "ManagedMediaSource onStartStreaming");
		this._emitter.emit(MSEEvents.START_STREAMING);
	}

	_onEndStreaming(): void {
		Log.v(this.TAG, "ManagedMediaSource onEndStreaming");
		this._emitter.emit(MSEEvents.END_STREAMING);
	}

	_onQualityChange(): void {
		Log.v(this.TAG, "ManagedMediaSource onQualityChange");
	}

	_onSourceEnded(): void {
		// fired on endOfStream
		Log.v(this.TAG, "MediaSource onSourceEnded");
	}

	_onSourceClose(): void {
		// fired on detaching from media element
		Log.v(this.TAG, "MediaSource onSourceClose");
		if (this._mediaSource && this.e != null) {
			this._mediaSource.removeEventListener("sourceopen", this.e.onSourceOpen);
			this._mediaSource.removeEventListener("sourceended", this.e.onSourceEnded);
			this._mediaSource.removeEventListener("sourceclose", this.e.onSourceClose);
			if (this._useManagedMediaSource) {
				this._mediaSource.removeEventListener("startstreaming", this.e.onStartStreaming);
				this._mediaSource.removeEventListener("endstreaming", this.e.onEndStreaming);
				this._mediaSource.removeEventListener("qualitychange", this.e.onQualityChange);
			}
		}
	}

	_hasPendingSegments(): boolean {
		const ps = this._pendingSegments;
		return ps.video.length > 0 || ps.audio.length > 0;
	}

	_hasPendingRemoveRanges(): boolean {
		const prr = this._pendingRemoveRanges;
		return prr.video.length > 0 || prr.audio.length > 0;
	}

	_onSourceBufferUpdateEnd(): void {
		if (this._requireSetMediaDuration) {
			this._updateMediaSourceDuration();
		} else if (this._hasPendingRemoveRanges()) {
			this._doRemoveRanges();
		} else if (this._hasPendingSegments()) {
			this._doAppendSegments();
		} else if (this._hasPendingEos) {
			this.endOfStream();
		}
		this._emitter.emit(MSEEvents.UPDATE_END);
	}

	_onSourceBufferError(e: Event): void {
		Log.e(this.TAG, `SourceBuffer Error: ${e}`);
		// this error might not always be fatal, just ignore it
	}
}

export default MSEController;
