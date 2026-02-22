/** Player configuration options. All fields are optional when passed to `createPlayer()`. */
export interface MediaConfig {
	/** Enable separated thread (DedicatedWorker) for transmuxing. @default false */
	enableWorker: boolean;
	/** Enable separated thread (DedicatedWorker) for MediaSource. @default false */
	enableWorkerForMSE: boolean;
	/** Enable IO stash buffer. Set to false for realtime (minimal latency) live stream playback, but may stall on network jitter. @default true */
	enableStashBuffer: boolean;
	/** IO stash buffer initial size in bytes. A suitable size can improve video load/seek time. @default 384KB */
	stashInitialSize: number | undefined;

	/** Same as `isLive` in MediaDataSource. Ignored if already set in MediaDataSource. @default false */
	isLive: boolean;

	/** Chase live stream latency caused by the internal buffer in HTMLMediaElement. Requires `isLive: true`. @default false */
	liveBufferLatencyChasing: boolean;
	/** Chase live stream latency even when HTMLMediaElement is paused. Requires `isLive: true` and `liveBufferLatencyChasing: true`. @default false */
	liveBufferLatencyChasingOnPaused: boolean;
	/** Maximum acceptable buffer latency in seconds. Requires `isLive: true` and `liveBufferLatencyChasing: true`. @default 1.5 */
	liveBufferLatencyMaxLatency: number;
	/** Minimum buffer latency to keep in seconds. Requires `isLive: true` and `liveBufferLatencyChasing: true`. @default 0.5 */
	liveBufferLatencyMinRemain: number;

	/** Chase live stream latency by changing playbackRate. Requires `isLive: true`. @default false */
	liveSync: boolean;
	/** Maximum acceptable buffer latency in seconds. Requires `isLive: true` and `liveSync: true`. @default 1.2 */
	liveSyncMaxLatency: number;
	/** Target latency in seconds to chase when latency exceeds `liveSyncMaxLatency`. Requires `isLive: true` and `liveSync: true`. @default 0.8 */
	liveSyncTargetLatency: number;
	/** PlaybackRate (clamped to [1, 2]) used for latency chasing. Requires `isLive: true` and `liveSync: true`. @default 1.2 */
	liveSyncPlaybackRate: number;

	/** Abort the HTTP connection if there's enough data for playback. @default true */
	lazyLoad: boolean;
	/** Seconds of data to keep for `lazyLoad`. @default 180 */
	lazyLoadMaxDuration: number;
	/** `lazyLoad` recover time boundary in seconds. @default 30 */
	lazyLoadRecoverDuration: number;
	/** Defer loading until MediaSource `sourceopen` event. On Chrome, background tabs may not trigger `sourceopen` until activated. @default true */
	deferLoadAfterSourceOpen: boolean;

	/** When backward buffer exceeds this value (seconds), auto cleanup SourceBuffer. @default 180 */
	autoCleanupMaxBackwardDuration: number;
	/** Seconds to reserve for backward buffer during auto cleanup. @default 120 */
	autoCleanupMinBackwardDuration: number;

	/** Interval in milliseconds for statistics info reporting. @default 600 */
	statisticsInfoReportInterval: number;

	/** Fill silent audio frames to avoid A/V desync on large audio timestamp gaps. @default true */
	fixAudioTimestampGap: boolean;

	/** Accurate seek to any frame, not limited to video IDR frame. May be slower. Available on Chrome > 50, Firefox, and Safari. @default false */
	accurateSeek: boolean;
	/** `'range'` uses Range request to seek; `'param'` adds params to URL; `'custom'` uses `customSeekHandler`. @default 'range' */
	seekType: "range" | "param" | "custom";
	/** Seek start parameter name for `seekType: 'param'`. @default 'bstart' */
	seekParamStart: string;
	/** Seek end parameter name for `seekType: 'param'`. @default 'bend' */
	seekParamEnd: string;
	/** Send `Range: bytes=0-` for first-time load when using Range seek. @default false */
	rangeLoadZeroStart: boolean;
	/** Custom seek handler. Should implement the `SeekHandler` interface. */
	customSeekHandler: unknown | undefined;
	/** Reuse 301/302 redirected URL for subsequent requests (seek, reconnect, etc.). @default false */
	reuseRedirectedURL: boolean;

	/** Additional headers to add to HTTP requests. */
	headers: Record<string, string> | undefined;
	/** Custom loader. Should implement the `BaseLoader` interface. */
	customLoader: unknown | undefined;
}

export const defaultConfig: MediaConfig = {
	enableWorker: false,
	enableWorkerForMSE: false,
	enableStashBuffer: true,
	stashInitialSize: undefined,

	isLive: false,

	liveBufferLatencyChasing: false,
	liveBufferLatencyChasingOnPaused: false,
	liveBufferLatencyMaxLatency: 1.5,
	liveBufferLatencyMinRemain: 0.5,

	liveSync: false,
	liveSyncMaxLatency: 1.2,
	liveSyncTargetLatency: 0.8,
	liveSyncPlaybackRate: 1.2,

	lazyLoad: true,
	lazyLoadMaxDuration: 3 * 60,
	lazyLoadRecoverDuration: 30,
	deferLoadAfterSourceOpen: true,

	autoCleanupMaxBackwardDuration: 3 * 60,
	autoCleanupMinBackwardDuration: 2 * 60,

	statisticsInfoReportInterval: 600,

	fixAudioTimestampGap: true,

	accurateSeek: false,
	seekType: "range",
	seekParamStart: "bstart",
	seekParamEnd: "bend",
	rangeLoadZeroStart: false,
	customSeekHandler: undefined,
	reuseRedirectedURL: false,

	headers: undefined,
	customLoader: undefined,
};

export function createDefaultConfig(): MediaConfig {
	return Object.assign({}, defaultConfig);
}
