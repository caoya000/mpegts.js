/** Player configuration options. All fields are optional when passed to `createPlayer()`. */
export interface MediaConfig {
	/** Same as `isLive` in MediaDataSource. Ignored if already set in MediaDataSource. @default false */
	isLive: boolean;

	/** Chase live stream latency by changing playbackRate. Requires `isLive: true`. @default false */
	liveSync: boolean;
	/** Maximum acceptable buffer latency in seconds. Requires `isLive: true` and `liveSync: true`. @default 1.2 */
	liveSyncMaxLatency: number;
	/** Target latency in seconds to chase when latency exceeds `liveSyncMaxLatency`. Requires `isLive: true` and `liveSync: true`. @default 0.8 */
	liveSyncTargetLatency: number;
	/** PlaybackRate (clamped to [1, 2]) used for latency chasing. Requires `isLive: true` and `liveSync: true`. @default 1.2 */
	liveSyncPlaybackRate: number;

	/** Fill silent audio frames to avoid A/V desync on large audio timestamp gaps. @default true */
	fixAudioTimestampGap: boolean;

	/** Referrer policy for HTTP requests. Applied to each segment's `referrerPolicy` field. */
	referrerPolicy: string | undefined;
	/** Additional headers to add to HTTP requests. */
	headers: Record<string, string> | undefined;
}

export const defaultConfig: MediaConfig = {
	isLive: false,

	liveSync: false,
	liveSyncMaxLatency: 1.2,
	liveSyncTargetLatency: 0.8,
	liveSyncPlaybackRate: 1.2,

	fixAudioTimestampGap: true,

	referrerPolicy: undefined,
	headers: undefined,
};

export function createDefaultConfig(): MediaConfig {
	return Object.assign({}, defaultConfig);
}
