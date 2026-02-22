import EventEmitter from "node:events";
import type { MediaConfig } from "../config";
import Log from "../utils/logger";
import LoggingControl from "../utils/logging-control";
import MediaInfo from "./media-info";
import TransmuxingEvents from "./transmuxing-events";
import TransmuxingWorker from "./transmuxing-worker.ts?worker&inline";

interface TransmuxerEventHandlers {
	onLoggingConfigChanged: (config: unknown) => void;
}

class Transmuxer {
	TAG: string;
	_emitter: EventEmitter;

	_worker: Worker | null;
	_workerDestroying: boolean;
	_controller: unknown;

	e: TransmuxerEventHandlers | null;

	constructor(mediaDataSource: unknown, config: MediaConfig & Record<string, unknown>) {
		this.TAG = "Transmuxer";
		this._emitter = new EventEmitter();
		this._worker = null;
		this._workerDestroying = false;
		this._controller = null;
		this.e = null;

		if (config.enableWorker && typeof Worker !== "undefined") {
			try {
				this._worker = new TransmuxingWorker();
				this._workerDestroying = false;
				this._worker.addEventListener("message", this._onWorkerMessage.bind(this));
				this._worker.postMessage({
					cmd: "init",
					param: [mediaDataSource, config],
				});
				this.e = {
					onLoggingConfigChanged: this._onLoggingConfigChanged.bind(this),
				};
				LoggingControl.registerListener(
					this.e.onLoggingConfigChanged as import("../utils/logging-control").LoggingConfigChangeListener,
				);
				this._worker.postMessage({
					cmd: "logging_config",
					param: LoggingControl.getConfig(),
				});
			} catch (_error) {
				Log.e(this.TAG, "Error while initialize transmuxing worker, fallback to inline transmuxing");
				this._worker = null;
				throw new Error("Transmuxer without worker is explicitly disabled");
			}
		} else {
			throw new Error("Transmuxer without worker is explicitly disabled");
		}
	}

	destroy(): void {
		if (this._worker) {
			if (!this._workerDestroying) {
				this._workerDestroying = true;
				this._worker.postMessage({ cmd: "destroy" });
				LoggingControl.removeListener(
					this.e?.onLoggingConfigChanged as import("../utils/logging-control").LoggingConfigChangeListener,
				);
				this.e = null;
			}
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

	hasWorker(): boolean {
		return this._worker != null;
	}

	open(): void {
		if (this._worker) {
			this._worker.postMessage({ cmd: "start" });
		}
	}

	close(): void {
		if (this._worker) {
			this._worker.postMessage({ cmd: "stop" });
		}
	}

	seek(milliseconds: number): void {
		if (this._worker) {
			this._worker.postMessage({ cmd: "seek", param: milliseconds });
		}
	}

	pause(): void {
		if (this._worker) {
			this._worker.postMessage({ cmd: "pause" });
		}
	}

	resume(): void {
		if (this._worker) {
			this._worker.postMessage({ cmd: "resume" });
		}
	}

	_onLoggingConfigChanged(config: unknown): void {
		if (this._worker) {
			this._worker.postMessage({ cmd: "logging_config", param: config });
		}
	}

	_onWorkerMessage(e: MessageEvent): void {
		const message = e.data;
		const data = message.data;

		if (message.msg === "destroyed" || this._workerDestroying) {
			this._workerDestroying = false;
			this._worker?.terminate();
			this._worker = null;
			return;
		}

		switch (message.msg) {
			case TransmuxingEvents.INIT_SEGMENT:
			case TransmuxingEvents.MEDIA_SEGMENT:
				this._emitter.emit(message.msg, data.type, data.data);
				break;
			case TransmuxingEvents.LOADING_COMPLETE:
			case TransmuxingEvents.RECOVERED_EARLY_EOF:
				this._emitter.emit(message.msg);
				break;
			case TransmuxingEvents.MEDIA_INFO:
				Object.setPrototypeOf(data, MediaInfo.prototype);
				this._emitter.emit(message.msg, data);
				break;
			case TransmuxingEvents.METADATA_ARRIVED:
			case TransmuxingEvents.SCRIPTDATA_ARRIVED:
			case TransmuxingEvents.TIMED_ID3_METADATA_ARRIVED:
			case TransmuxingEvents.PGS_SUBTITLE_ARRIVED:
			case TransmuxingEvents.SYNCHRONOUS_KLV_METADATA_ARRIVED:
			case TransmuxingEvents.ASYNCHRONOUS_KLV_METADATA_ARRIVED:
			case TransmuxingEvents.SMPTE2038_METADATA_ARRIVED:
			case TransmuxingEvents.SCTE35_METADATA_ARRIVED:
			case TransmuxingEvents.PES_PRIVATE_DATA_DESCRIPTOR:
			case TransmuxingEvents.PES_PRIVATE_DATA_ARRIVED:
			case TransmuxingEvents.STATISTICS_INFO:
				this._emitter.emit(message.msg, data);
				break;
			case TransmuxingEvents.IO_ERROR:
			case TransmuxingEvents.DEMUX_ERROR:
				this._emitter.emit(message.msg, data.type, data.info);
				break;
			case TransmuxingEvents.RECOMMEND_SEEKPOINT:
				this._emitter.emit(message.msg, data);
				break;
			case "logcat_callback":
				Log.emitter.emit("log", data.type, data.logcat);
				break;
			default:
				break;
		}
	}
}

export default Transmuxer;
