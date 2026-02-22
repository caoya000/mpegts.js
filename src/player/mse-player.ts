import type { MediaConfig } from "../config";
import type MediaInfo from "../core/media-info";
import type { MediaDataSource } from "../core/transmuxing-controller";
import type PlayerEngine from "./player-engine";
import PlayerEngineMainThread from "./player-engine-main-thread";

class MSEPlayer {
	private _type: string = "MSEPlayer";

	private _media_element: HTMLMediaElement | null = null;
	private _player_engine: PlayerEngine | null = null;

	public constructor(mediaDataSource: MediaDataSource, config?: Partial<MediaConfig>) {
		this._player_engine = new PlayerEngineMainThread(mediaDataSource, config);
	}

	public destroy(): void {
		this._player_engine?.destroy();
		this._player_engine = null;
		this._media_element = null;
	}

	public on(event: string, listener: (...args: unknown[]) => void): void {
		this._player_engine?.on(event, listener);
	}

	public off(event: string, listener: (...args: unknown[]) => void): void {
		this._player_engine?.off(event, listener);
	}

	public attachMediaElement(mediaElement: HTMLMediaElement): void {
		this._media_element = mediaElement;
		this._player_engine?.attachMediaElement(mediaElement);
	}

	public detachMediaElement(): void {
		this._media_element = null;
		this._player_engine?.detachMediaElement();
	}

	public load(): void {
		this._player_engine?.load();
	}

	public unload(): void {
		this._player_engine?.unload();
	}

	public play(): Promise<void> | undefined {
		return this._player_engine?.play();
	}

	public pause(): void {
		this._player_engine?.pause();
	}

	public get type(): string {
		return this._type;
	}

	public get buffered(): TimeRanges | undefined {
		return this._media_element?.buffered;
	}

	public get duration(): number | undefined {
		return this._media_element?.duration;
	}

	public get volume(): number | undefined {
		return this._media_element?.volume;
	}

	public set volume(value: number) {
		if (this._media_element) {
			this._media_element.volume = value;
		}
	}

	public get muted(): boolean | undefined {
		return this._media_element?.muted;
	}

	public set muted(muted: boolean) {
		if (this._media_element) {
			this._media_element.muted = muted;
		}
	}

	public get currentTime(): number {
		if (this._media_element) {
			return this._media_element.currentTime;
		}
		return 0;
	}

	public set currentTime(seconds: number) {
		this._player_engine?.seek(seconds);
	}

	public get mediaInfo(): MediaInfo | undefined {
		return this._player_engine?.mediaInfo;
	}

	public get statisticsInfo(): unknown {
		return this._player_engine?.statisticsInfo;
	}
}

export default MSEPlayer;
