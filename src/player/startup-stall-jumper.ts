import Log from "../utils/logger";

class StartupStallJumper {
	private readonly TAG: string = "StartupStallJumper";

	private _media_element: HTMLMediaElement | null = null;
	private _on_direct_seek: ((target: number) => void) | null = null;
	private _canplay_received: boolean = false;

	private e: { onMediaCanPlay: EventListener; onMediaStalled: EventListener; onMediaProgress: EventListener } | null =
		null;

	public constructor(media_element: HTMLMediaElement, on_direct_seek: (target: number) => void) {
		this._media_element = media_element;
		this._on_direct_seek = on_direct_seek;

		this.e = {
			onMediaCanPlay: this._onMediaCanPlay.bind(this),
			onMediaStalled: this._onMediaStalled.bind(this),
			onMediaProgress: this._onMediaProgress.bind(this),
		};

		this._media_element.addEventListener("canplay", this.e.onMediaCanPlay);
		this._media_element.addEventListener("stalled", this.e.onMediaStalled);
		this._media_element.addEventListener("progress", this.e.onMediaProgress);
	}

	public destroy(): void {
		if (this.e) {
			this._media_element?.removeEventListener("canplay", this.e.onMediaCanPlay);
			this._media_element?.removeEventListener("stalled", this.e.onMediaStalled);
			this._media_element?.removeEventListener("progress", this.e.onMediaProgress);
		}
		this._media_element = null;
		this._on_direct_seek = null;
	}

	private _onMediaCanPlay(_e: Event): void {
		this._canplay_received = true;
		// Remove canplay listener since it will be fired multiple times
		if (this.e) {
			this._media_element?.removeEventListener("canplay", this.e.onMediaCanPlay);
		}
	}

	private _onMediaStalled(_e: Event): void {
		this._detectAndFixStuckPlayback(true);
	}

	private _onMediaProgress(_e: Event): void {
		this._detectAndFixStuckPlayback();
	}

	private _detectAndFixStuckPlayback(is_stalled?: boolean): void {
		if (!this._media_element) return;
		const media = this._media_element;
		const buffered = media.buffered;

		if (is_stalled || !this._canplay_received || media.readyState < 2) {
			// HAVE_CURRENT_DATA
			if (buffered.length > 0 && media.currentTime < buffered.start(0)) {
				Log.w(this.TAG, `Playback seems stuck at ${media.currentTime}, seek to ${buffered.start(0)}`);
				this._on_direct_seek?.(buffered.start(0));
				if (this.e) {
					this._media_element?.removeEventListener("progress", this.e.onMediaProgress);
				}
			}
		} else {
			// Playback doesn't stuck, remove progress event listener
			if (this.e) {
				this._media_element?.removeEventListener("progress", this.e.onMediaProgress);
			}
		}
	}
}

export default StartupStallJumper;
