import type { MediaConfig } from "../config";

// Live buffer latency chaser by directly adjusting HTMLMediaElement.currentTime (not recommended)
class LiveLatencyChaser {
	private _config: MediaConfig | null = null;
	private _media_element: HTMLMediaElement | null = null;
	private _on_direct_seek: ((target: number) => void) | null = null;

	public constructor(config: MediaConfig, media_element: HTMLMediaElement, on_direct_seek: (target: number) => void) {
		this._config = config;
		this._media_element = media_element;
		this._on_direct_seek = on_direct_seek;
	}

	public destroy(): void {
		this._on_direct_seek = null;
		this._media_element = null;
		this._config = null;
	}

	public notifyBufferedRangeUpdate(): void {
		this._chaseLiveLatency();
	}

	private _chaseLiveLatency(): void {
		if (!this._media_element || !this._config) return;
		const buffered: TimeRanges = this._media_element.buffered;
		const current_time: number = this._media_element.currentTime;

		const paused = this._media_element.paused;

		if (
			!this._config.isLive ||
			!this._config.liveBufferLatencyChasing ||
			buffered.length === 0 ||
			(!this._config.liveBufferLatencyChasingOnPaused && paused)
		) {
			return;
		}

		const buffered_end = buffered.end(buffered.length - 1);
		if (buffered_end > this._config.liveBufferLatencyMaxLatency) {
			if (buffered_end - current_time > this._config.liveBufferLatencyMaxLatency) {
				const target_time = buffered_end - this._config.liveBufferLatencyMinRemain;
				this._on_direct_seek?.(target_time);
			}
		}
	}
}

export default LiveLatencyChaser;
