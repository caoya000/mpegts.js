import EventEmitter from "node:events";
import type { MediaConfig } from "../config";
import { createDefaultConfig } from "../config";
import type MediaInfo from "../core/media-info";
import MSEEvents from "../core/mse-events";
import TransmuxingEvents from "../core/transmuxing-events";
import Log from "../utils/logger";
import LoggingControl from "../utils/logging-control";
import LiveLatencyChaser from "./live-latency-chaser";
import LiveLatencySynchronizer from "./live-latency-synchronizer";
import LoadingController from "./loading-controller";
import type PlayerEngine from "./player-engine";
import PlayerEngineWorker from "./player-engine-worker?worker&inline";
import type {
	WorkerCommandPacket,
	WorkerCommandPacketInit,
	WorkerCommandPacketLoggingConfig,
	WorkerCommandPacketReadyStateChange,
	WorkerCommandPacketTimeUpdate,
	WorkerCommandPacketUnbufferedSeek,
} from "./player-engine-worker-cmd-def";
import type {
	WorkerMessagePacket,
	WorkerMessagePacketBufferedPositionChanged,
	WorkerMessagePacketLogcatCallback,
	WorkerMessagePacketMSEEvent,
	WorkerMessagePacketMSEInit,
	WorkerMessagePacketPlayerEvent,
	WorkerMessagePacketPlayerEventError,
	WorkerMessagePacketPlayerEventExtraData,
	WorkerMessagePacketTransmuxingEvent,
	WorkerMessagePacketTransmuxingEventInfo,
	WorkerMessagePacketTransmuxingEventRecommendSeekpoint,
} from "./player-engine-worker-msg-def";
import PlayerEvents from "./player-events";
import SeekingHandler from "./seeking-handler";
import StartupStallJumper from "./startup-stall-jumper";

interface DedicatedThreadEventHandlers {
	onLoggingConfigChanged: (config: unknown) => void;
	onMediaLoadedMetadata: (e: Event) => void;
	onMediaTimeUpdate: (e: Event) => void;
	onMediaReadyStateChanged: (e: Event) => void;
}

class PlayerEngineDedicatedThread implements PlayerEngine {
	private readonly TAG: string = "PlayerEngineDedicatedThread";

	private _emitter: EventEmitter | null = new EventEmitter();
	private _media_data_source: Record<string, unknown> | null;
	private _config: MediaConfig & Record<string, unknown>;

	private _media_element: HTMLMediaElement | null = null;

	private _worker: Worker | null;
	private _worker_destroying: boolean = false;

	private _seeking_handler: SeekingHandler | null = null;
	private _loading_controller: LoadingController | null = null;
	private _startup_stall_jumper: StartupStallJumper | null = null;
	private _live_latency_chaser: LiveLatencyChaser | null = null;
	private _live_latency_synchronizer: LiveLatencySynchronizer | null = null;

	private _pending_seek_time: number | null = null;

	private _media_info: MediaInfo | null = null;
	private _statistics_info: Record<string, unknown> | null = null;

	private e: DedicatedThreadEventHandlers | null = null;

	public static isSupported(): boolean {
		if (!self.Worker) {
			return false;
		}
		if (
			self.MediaSource &&
			"canConstructInDedicatedWorker" in self.MediaSource &&
			self.MediaSource.canConstructInDedicatedWorker === true
		) {
			return true;
		}
		const selfRecord = self as unknown as Record<string, unknown>;
		if (
			selfRecord.ManagedMediaSource &&
			"canConstructInDedicatedWorker" in (selfRecord.ManagedMediaSource as object) &&
			(selfRecord.ManagedMediaSource as Record<string, unknown>).canConstructInDedicatedWorker === true
		) {
			return true;
		}
		return false;
	}

	public constructor(mediaDataSource: Record<string, unknown>, config?: Record<string, unknown>) {
		this._media_data_source = mediaDataSource;
		this._config = createDefaultConfig() as MediaConfig & Record<string, unknown>;

		if (typeof config === "object") {
			Object.assign(this._config, config);
		}

		if (mediaDataSource.isLive === true) {
			this._config.isLive = true;
		}

		this.e = {
			onLoggingConfigChanged: this._onLoggingConfigChanged.bind(this),
			onMediaLoadedMetadata: this._onMediaLoadedMetadata.bind(this),
			onMediaTimeUpdate: this._onMediaTimeUpdate.bind(this),
			onMediaReadyStateChanged: this._onMediaReadyStateChange.bind(this),
		};

		LoggingControl.registerListener(
			this.e.onLoggingConfigChanged as import("../utils/logging-control").LoggingConfigChangeListener,
		);

		this._worker = new PlayerEngineWorker();
		this._worker.addEventListener("message", this._onWorkerMessage.bind(this));

		this._worker?.postMessage({
			cmd: "init",
			media_data_source: this._media_data_source,
			config: this._config,
		} as WorkerCommandPacketInit);

		this._worker?.postMessage({
			cmd: "logging_config",
			logging_config: LoggingControl.getConfig(),
		} as WorkerCommandPacketLoggingConfig);
	}

	public destroy(): void {
		this._emitter?.emit(PlayerEvents.DESTROYING);
		this.unload();
		this.detachMediaElement();

		this._worker_destroying = true;
		this._worker?.postMessage({
			cmd: "destroy",
		} as WorkerCommandPacket);

		LoggingControl.removeListener(
			this.e?.onLoggingConfigChanged as import("../utils/logging-control").LoggingConfigChangeListener,
		);
		this.e = null;
		this._media_data_source = null;

		this._emitter?.removeAllListeners();
		this._emitter = null;
	}

	public on(event: string, listener: (...args: unknown[]) => void): void {
		this._emitter?.addListener(event, listener);
		// For media_info / statistics_info event, trigger it immediately
		if (event === PlayerEvents.MEDIA_INFO && this._media_info) {
			Promise.resolve().then(() => this._emitter?.emit(PlayerEvents.MEDIA_INFO, this.mediaInfo));
		} else if (event === PlayerEvents.STATISTICS_INFO && this._statistics_info) {
			Promise.resolve().then(() => this._emitter?.emit(PlayerEvents.STATISTICS_INFO, this.statisticsInfo));
		}
	}

	public off(event: string, listener: (...args: unknown[]) => void): void {
		this._emitter?.removeListener(event, listener);
	}

	public attachMediaElement(mediaElement: HTMLMediaElement): void {
		this._media_element = mediaElement;

		// Remove src / srcObject of HTMLMediaElement for cleanup
		this._media_element.src = "";
		this._media_element.removeAttribute("src");
		this._media_element.srcObject = null;
		this._media_element.load();

		this._media_element.addEventListener("loadedmetadata", this.e?.onMediaLoadedMetadata as EventListener);
		this._media_element.addEventListener("timeupdate", this.e?.onMediaTimeUpdate as EventListener);
		this._media_element.addEventListener("readystatechange", this.e?.onMediaReadyStateChanged as EventListener);

		this._worker?.postMessage({
			cmd: "initialize_mse",
		});

		// Then wait for 'mse_init' message from worker to receive MediaSource handle
	}

	public detachMediaElement(): void {
		this._worker?.postMessage({
			cmd: "shutdown_mse",
		});

		if (this._media_element) {
			// Remove all appended event listeners
			this._media_element.removeEventListener("loadedmetadata", this.e?.onMediaLoadedMetadata as EventListener);
			this._media_element.removeEventListener("timeupdate", this.e?.onMediaTimeUpdate as EventListener);
			this._media_element.removeEventListener("readystatechange", this.e?.onMediaReadyStateChanged as EventListener);

			// Detach media source from media element
			this._media_element.src = "";
			this._media_element.removeAttribute("src");
			this._media_element.srcObject = null;
			this._media_element.load();
			this._media_element = null;
		}
	}

	public load(): void {
		this._worker?.postMessage({
			cmd: "load",
		});

		if (!this._media_element) return;

		this._seeking_handler = new SeekingHandler(
			this._config,
			this._media_element,
			this._onRequiredUnbufferedSeek.bind(this),
		);

		this._loading_controller = new LoadingController(
			this._config,
			this._media_element,
			this._onRequestPauseTransmuxer.bind(this),
			this._onRequestResumeTransmuxer.bind(this),
		);

		this._startup_stall_jumper = new StartupStallJumper(this._media_element, this._onRequestDirectSeek.bind(this));

		if (this._config.isLive && this._config.liveBufferLatencyChasing) {
			this._live_latency_chaser = new LiveLatencyChaser(
				this._config,
				this._media_element,
				this._onRequestDirectSeek.bind(this),
			);
		}

		if (this._config.isLive && this._config.liveSync) {
			this._live_latency_synchronizer = new LiveLatencySynchronizer(this._config, this._media_element);
		}

		// Reset currentTime to 0
		if ((this._media_element?.readyState ?? 0) > 0) {
			// IE11 may throw InvalidStateError if readyState === 0
			this._seeking_handler.directSeek(0);
		}
	}

	public unload(): void {
		this._media_element?.pause();

		this._worker?.postMessage({
			cmd: "unload",
		} as WorkerCommandPacket);

		this._live_latency_synchronizer?.destroy();
		this._live_latency_synchronizer = null;

		this._live_latency_chaser?.destroy();
		this._live_latency_chaser = null;

		this._startup_stall_jumper?.destroy();
		this._startup_stall_jumper = null;

		this._loading_controller?.destroy();
		this._loading_controller = null;

		this._seeking_handler?.destroy();
		this._seeking_handler = null;
	}

	public play(): Promise<void> {
		return this._media_element?.play() ?? Promise.resolve();
	}

	public pause(): void {
		this._media_element?.pause();
	}

	public seek(seconds: number): void {
		if (this._media_element && this._seeking_handler) {
			this._seeking_handler.seek(seconds);
		} else {
			this._pending_seek_time = seconds;
		}
	}

	public get mediaInfo(): MediaInfo {
		return Object.assign({}, this._media_info);
	}

	public get statisticsInfo(): unknown {
		return Object.assign({}, this._statistics_info);
	}

	public _onLoggingConfigChanged(config: unknown): void {
		this._worker?.postMessage({
			cmd: "logging_config",
			logging_config: config,
		} as WorkerCommandPacketLoggingConfig);
	}

	private _onMSEUpdateEnd(): void {
		if (this._config.isLive && this._config.liveBufferLatencyChasing && this._live_latency_chaser) {
			this._live_latency_chaser.notifyBufferedRangeUpdate();
		}

		this._loading_controller?.notifyBufferedPositionChanged();
	}

	private _onMSEBufferFull(): void {
		Log.v(this.TAG, "MSE SourceBuffer is full, suspend transmuxing task");
		this._loading_controller?.suspendTransmuxer();
	}

	private _onMediaLoadedMetadata(_e: Event): void {
		if (this._pending_seek_time != null) {
			this._seeking_handler?.seek(this._pending_seek_time);
			this._pending_seek_time = null;
		}
	}

	private _onRequestDirectSeek(target: number): void {
		this._seeking_handler?.directSeek(target);
	}

	private _onRequiredUnbufferedSeek(milliseconds: number): void {
		this._worker?.postMessage({
			cmd: "unbuffered_seek",
			milliseconds: milliseconds,
		} as WorkerCommandPacketUnbufferedSeek);
	}

	private _onRequestPauseTransmuxer(): void {
		this._worker?.postMessage({
			cmd: "pause_transmuxer",
		} as WorkerCommandPacket);
	}

	private _onRequestResumeTransmuxer(): void {
		this._worker?.postMessage({
			cmd: "resume_transmuxer",
		} as WorkerCommandPacket);
	}

	private _onMediaTimeUpdate(e: Event): void {
		this._worker?.postMessage({
			cmd: "timeupdate",
			current_time: (e.target as HTMLMediaElement).currentTime,
		} as WorkerCommandPacketTimeUpdate);
	}

	private _onMediaReadyStateChange(e: Event): void {
		this._worker?.postMessage({
			cmd: "readystatechange",
			ready_state: (e.target as HTMLMediaElement).readyState,
		} as WorkerCommandPacketReadyStateChange);
	}

	private _onWorkerMessage(e: MessageEvent): void {
		const message_packet = e.data as WorkerMessagePacket;
		const msg = message_packet.msg;

		if (msg === "destroyed" || this._worker_destroying) {
			this._worker_destroying = false;
			this._worker?.terminate();
			this._worker = null;
			return;
		}

		switch (msg) {
			case "mse_init": {
				const packet = message_packet as WorkerMessagePacketMSEInit;
				// Use ManagedMediaSource only if w3c MediaSource is not available (e.g. iOS Safari)
				const use_managed_media_source = "ManagedMediaSource" in self && !("MediaSource" in self);
				if (use_managed_media_source) {
					// When using ManagedMediaSource, MediaSource will not open unless disableRemotePlayback is set to true
					(this._media_element as HTMLMediaElement).disableRemotePlayback = true;
				}
				// Attach to HTMLMediaElement by using MediaSource Handle
				(this._media_element as HTMLMediaElement).srcObject = packet.handle as MediaProvider;
				break;
			}
			case "mse_event": {
				const packet = message_packet as WorkerMessagePacketMSEEvent;
				if (packet.event === MSEEvents.UPDATE_END) {
					this._onMSEUpdateEnd();
				} else if (packet.event === MSEEvents.BUFFER_FULL) {
					this._onMSEBufferFull();
				}
				break;
			}
			case "transmuxing_event": {
				const packet = message_packet as WorkerMessagePacketTransmuxingEvent;
				if (packet.event === TransmuxingEvents.MEDIA_INFO) {
					const infoPacket = message_packet as WorkerMessagePacketTransmuxingEventInfo;
					this._media_info = infoPacket.info as MediaInfo;
					this._emitter?.emit(PlayerEvents.MEDIA_INFO, Object.assign({}, infoPacket.info));
				} else if (packet.event === TransmuxingEvents.STATISTICS_INFO) {
					const infoPacket = message_packet as WorkerMessagePacketTransmuxingEventInfo;
					this._statistics_info = this._fillStatisticsInfo(infoPacket.info as Record<string, unknown>);
					this._emitter?.emit(PlayerEvents.STATISTICS_INFO, Object.assign({}, infoPacket.info));
				} else if (packet.event === TransmuxingEvents.RECOMMEND_SEEKPOINT) {
					const seekPacket = message_packet as WorkerMessagePacketTransmuxingEventRecommendSeekpoint;
					if (this._media_element && !this._config.accurateSeek) {
						this._seeking_handler?.directSeek(seekPacket.milliseconds / 1000);
					}
				}
				break;
			}
			case "player_event": {
				const packet = message_packet as WorkerMessagePacketPlayerEvent;
				if (packet.event === PlayerEvents.ERROR) {
					const errorPacket = message_packet as WorkerMessagePacketPlayerEventError;
					this._emitter?.emit(PlayerEvents.ERROR, errorPacket.error_type, errorPacket.error_detail, errorPacket.info);
				} else if ("extraData" in packet) {
					const extraPacket = message_packet as WorkerMessagePacketPlayerEventExtraData;
					this._emitter?.emit(extraPacket.event, extraPacket.extraData);
				}
				break;
			}
			case "logcat_callback": {
				const packet = message_packet as WorkerMessagePacketLogcatCallback;
				Log.emitter.emit("log", packet.type, packet.logcat);
				break;
			}
			case "buffered_position_changed": {
				const packet = message_packet as WorkerMessagePacketBufferedPositionChanged;
				this._loading_controller?.notifyBufferedPositionChanged(packet.buffered_position_milliseconds / 1000);
				break;
			}
		}
	}

	private _fillStatisticsInfo(stat_info: Record<string, unknown>): Record<string, unknown> {
		stat_info.playerType = "MSEPlayer";

		if (!(this._media_element instanceof HTMLVideoElement)) {
			return stat_info;
		}

		let has_quality_info = true;
		let decoded = 0;
		let dropped = 0;

		if (this._media_element.getVideoPlaybackQuality) {
			const quality = this._media_element.getVideoPlaybackQuality();
			decoded = quality.totalVideoFrames;
			dropped = quality.droppedVideoFrames;
		} else if ((this._media_element as unknown as Record<string, unknown>).webkitDecodedFrameCount !== undefined) {
			decoded = (this._media_element as unknown as Record<string, unknown>).webkitDecodedFrameCount as number;
			dropped = (this._media_element as unknown as Record<string, unknown>).webkitDroppedFrameCount as number;
		} else {
			has_quality_info = false;
		}

		if (has_quality_info) {
			stat_info.decodedFrames = decoded;
			stat_info.droppedFrames = dropped;
		}

		return stat_info;
	}
}

export default PlayerEngineDedicatedThread;
