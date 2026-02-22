import EventEmitter from "node:events";
import type { MediaConfig } from "../config";
import Log from "../utils/logger";
import type { LoggingConfigChangeListener } from "../utils/logging-control";
import LoggingControl from "../utils/logging-control";
import MediaInfo from "./media-info";
import type { MediaDataSource } from "./transmuxing-controller";
import TransmuxingEvents from "./transmuxing-events";
import TransmuxingWorker from "./transmuxing-worker.ts?worker&inline";

class Transmuxer {
	TAG: string;
	_emitter: EventEmitter;

	_worker: Worker;
	_workerDestroying: boolean;

	_onLoggingConfigChanged: LoggingConfigChangeListener;

	constructor(mediaDataSource: MediaDataSource, config: MediaConfig) {
		this.TAG = "Transmuxer";
		this._emitter = new EventEmitter();
		this._workerDestroying = false;

		this._worker = new TransmuxingWorker();
		this._worker.addEventListener("message", this._onWorkerMessage.bind(this));
		this._worker.postMessage({
			cmd: "init",
			param: [mediaDataSource, config],
		});
		this._onLoggingConfigChanged = ((config: unknown) => {
			this._worker.postMessage({ cmd: "logging_config", param: config });
		}) as LoggingConfigChangeListener;
		LoggingControl.registerListener(this._onLoggingConfigChanged);
		this._worker.postMessage({
			cmd: "logging_config",
			param: LoggingControl.getConfig(),
		});
	}

	destroy(): void {
		if (!this._workerDestroying) {
			this._workerDestroying = true;
			this._worker.postMessage({ cmd: "destroy" });
			LoggingControl.removeListener(this._onLoggingConfigChanged);
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

	open(): void {
		this._worker.postMessage({ cmd: "start" });
	}

	close(): void {
		this._worker.postMessage({ cmd: "stop" });
	}

	seek(milliseconds: number): void {
		this._worker.postMessage({ cmd: "seek", param: milliseconds });
	}

	pause(): void {
		this._worker.postMessage({ cmd: "pause" });
	}

	resume(): void {
		this._worker.postMessage({ cmd: "resume" });
	}

	_onWorkerMessage(e: MessageEvent): void {
		const message = e.data;
		const data = message.data;

		if (message.msg === "destroyed" || this._workerDestroying) {
			this._workerDestroying = false;
			this._worker.terminate();
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
