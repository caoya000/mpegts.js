import type { MediaConfig } from "../config";
import Log from "../utils/logger";

class LoadingController {
	private readonly TAG: string = "LoadingController";

	private _config: MediaConfig | null = null;
	private _media_element: HTMLMediaElement | null = null;
	private _on_pause_transmuxer: (() => void) | null = null;
	private _on_resume_transmuxer: (() => void) | null = null;

	private _paused: boolean = false;

	private e: { onMediaTimeUpdate: EventListener } | null = null;

	public constructor(
		config: MediaConfig,
		media_element: HTMLMediaElement,
		on_pause_transmuxer: () => void,
		on_resume_transmuxer: () => void,
	) {
		this._config = config;
		this._media_element = media_element;
		this._on_pause_transmuxer = on_pause_transmuxer;
		this._on_resume_transmuxer = on_resume_transmuxer;

		this.e = {
			onMediaTimeUpdate: this._onMediaTimeUpdate.bind(this),
		};
	}

	public destroy(): void {
		if (this.e) {
			this._media_element?.removeEventListener("timeupdate", this.e.onMediaTimeUpdate);
		}
		this.e = null;
		this._media_element = null;
		this._config = null;
		this._on_pause_transmuxer = null;
		this._on_resume_transmuxer = null;
	}

	// buffered_position: in seconds
	public notifyBufferedPositionChanged(buffered_position?: number): void {
		if (!this._config) return;
		if (this._config.isLive || !this._config.lazyLoad) {
			return;
		}

		if (buffered_position === undefined) {
			this._suspendTransmuxerIfNeeded();
		} else {
			this._suspendTransmuxerIfBufferedPositionExceeded(buffered_position);
		}
	}

	private _onMediaTimeUpdate(_e: Event): void {
		if (this._paused) {
			this._resumeTransmuxerIfNeeded();
		}
	}

	private _suspendTransmuxerIfNeeded() {
		if (!this._media_element) return;
		const buffered: TimeRanges = this._media_element.buffered;
		const current_time: number = this._media_element.currentTime;
		let current_range_end = 0;

		for (let i = 0; i < buffered.length; i++) {
			const start = buffered.start(i);
			const end = buffered.end(i);
			if (start <= current_time && current_time < end) {
				current_range_end = end;
				break;
			}
		}
		if (current_range_end > 0) {
			this._suspendTransmuxerIfBufferedPositionExceeded(current_range_end);
		}
	}

	private _suspendTransmuxerIfBufferedPositionExceeded(buffered_end: number): void {
		if (!this._config) return;
		const current_time = this._media_element?.currentTime ?? 0;
		if (buffered_end >= current_time + this._config.lazyLoadMaxDuration && !this._paused) {
			Log.v(this.TAG, "Maximum buffering duration exceeded, suspend transmuxing task");
			this.suspendTransmuxer();
			if (this.e) {
				this._media_element?.addEventListener("timeupdate", this.e.onMediaTimeUpdate);
			}
		}
	}

	public suspendTransmuxer(): void {
		this._paused = true;
		this._on_pause_transmuxer?.();
	}

	private _resumeTransmuxerIfNeeded(): void {
		if (!this._media_element || !this._config) return;
		const buffered: TimeRanges = this._media_element.buffered;
		const current_time: number = this._media_element.currentTime;

		const recover_duration = this._config.lazyLoadRecoverDuration;
		let should_resume = false;

		for (let i = 0; i < buffered.length; i++) {
			const from = buffered.start(i);
			const to = buffered.end(i);
			if (current_time >= from && current_time < to) {
				if (current_time >= to - recover_duration) {
					should_resume = true;
				}
				break;
			}
		}

		if (should_resume) {
			Log.v(this.TAG, "Continue loading from paused position");
			this.resumeTransmuxer();
			if (this.e) {
				this._media_element?.removeEventListener("timeupdate", this.e.onMediaTimeUpdate);
			}
		}
	}

	public resumeTransmuxer(): void {
		this._paused = false;
		this._on_resume_transmuxer?.();
	}
}

export default LoadingController;
