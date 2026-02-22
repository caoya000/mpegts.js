import type { MediaConfig } from "../config";
import MSEController from "../core/mse-controller";
import MSEEvents from "../core/mse-events";
import Transmuxer from "../core/transmuxer";
import TransmuxingEvents from "../core/transmuxing-events";
import { IllegalStateException } from "../utils/exception";
import Log from "../utils/logger";
import LoggingControl from "../utils/logging-control";
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
	WorkerMessagePacketTransmuxingEventInfo,
	WorkerMessagePacketTransmuxingEventRecommendSeekpoint,
} from "./player-engine-worker-msg-def";
import { ErrorDetails, ErrorTypes } from "./player-errors";
import PlayerEvents from "./player-events";

const TAG: string = "PlayerEngineWorker";

const logcat_callback: (type: string, str: string) => void = onLogcatCallback;

let media_data_source: Record<string, unknown> | null = null;
let config: (MediaConfig & Record<string, unknown>) | null = null;

let mse_controller: MSEController | null = null;
let transmuxer: Transmuxer | null = null;

let mse_source_opened: boolean = false;
let has_pending_load: boolean = false;

let media_element_current_time: number = 0;
let media_element_ready_state: number = 0;

let destroyed = false;

self.addEventListener("message", (e: MessageEvent) => {
	if (destroyed) {
		return;
	}

	const command_packet = e.data as WorkerCommandPacket;
	const cmd = command_packet.cmd;

	switch (cmd) {
		case "logging_config": {
			const packet = command_packet as WorkerCommandPacketLoggingConfig;
			const loggingConfig = packet.logging_config as import("../utils/logging-control").LoggingConfig;
			LoggingControl.applyConfig(loggingConfig);

			if (loggingConfig.enableCallback === true) {
				LoggingControl.addLogListener(logcat_callback);
			} else {
				LoggingControl.removeLogListener(logcat_callback);
			}
			break;
		}
		case "init": {
			const packet = command_packet as WorkerCommandPacketInit;
			media_data_source = packet.media_data_source as Record<string, unknown>;
			config = packet.config as MediaConfig & Record<string, unknown>;
			break;
		}
		case "destroy":
			destroy();
			break;
		case "initialize_mse":
			initializeMSE();
			break;
		case "shutdown_mse":
			shutdownMSE();
			break;
		case "load":
			load();
			break;
		case "unload":
			unload();
			break;
		case "unbuffered_seek": {
			const packet = command_packet as WorkerCommandPacketUnbufferedSeek;
			mse_controller?.flush();
			transmuxer?.seek(packet.milliseconds);
			break;
		}
		case "timeupdate": {
			const packet = command_packet as WorkerCommandPacketTimeUpdate;
			media_element_current_time = packet.current_time;
			break;
		}
		case "readystatechange": {
			const packet = command_packet as WorkerCommandPacketReadyStateChange;
			media_element_ready_state = packet.ready_state;
			break;
		}
		case "pause_transmuxer":
			transmuxer?.pause();
			break;
		case "resume_transmuxer":
			transmuxer?.resume();
			break;
	}
});

function destroy(): void {
	if (transmuxer) {
		unload();
	}
	if (mse_controller) {
		shutdownMSE();
	}
	destroyed = true;

	self.postMessage({
		msg: "destroyed",
	} as WorkerMessagePacket);
}

function initializeMSE(): void {
	if (!config) {
		throw new IllegalStateException("Worker not initialized");
	}
	Log.v(TAG, "Initializing MediaSource in DedicatedWorker");
	mse_controller = new MSEController(config);
	mse_controller.on(MSEEvents.SOURCE_OPEN, onMSESourceOpen);
	mse_controller.on(MSEEvents.UPDATE_END, onMSEUpdateEnd);
	mse_controller.on(MSEEvents.BUFFER_FULL, onMSEBufferFull);
	mse_controller.on(MSEEvents.ERROR, onMSEError);
	mse_controller.initialize({
		getCurrentTime: () => media_element_current_time,
		getReadyState: () => media_element_ready_state,
	});

	const handle = mse_controller?.getHandle();
	(self as unknown as { postMessage(msg: unknown, transfer: unknown[]): void }).postMessage(
		{
			msg: "mse_init",
			handle: handle,
		} as WorkerMessagePacketMSEInit,
		[handle],
	);
}

function shutdownMSE(): void {
	if (mse_controller) {
		mse_controller.shutdown();
		mse_controller.destroy();
		mse_controller = null;
	}
}

function load(): void {
	if (media_data_source == null || config == null) {
		throw new IllegalStateException("Worker not initialized");
	}
	if (transmuxer) {
		throw new IllegalStateException("Transmuxer has been initialized");
	}
	if (has_pending_load) {
		return;
	}
	if (config.deferLoadAfterSourceOpen && !mse_source_opened) {
		has_pending_load = true;
		return;
	}

	transmuxer = new Transmuxer(media_data_source, config);

	transmuxer.on(TransmuxingEvents.INIT_SEGMENT, ((_type: unknown, is: unknown) => {
		mse_controller?.appendInitSegment(is as { type: string; container: string; [key: string]: unknown });
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.MEDIA_SEGMENT, ((_type: unknown, ms: unknown) => {
		const segment = ms as Record<string, unknown>;
		mse_controller?.appendMediaSegment(ms as { type: string; [key: string]: unknown });
		self.postMessage({
			msg: "buffered_position_changed",
			buffered_position_milliseconds: (segment.info as Record<string, unknown>).endDts,
		} as WorkerMessagePacketBufferedPositionChanged);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.LOADING_COMPLETE, () => {
		mse_controller?.endOfStream();
		self.postMessage({
			msg: "player_event",
			event: PlayerEvents.LOADING_COMPLETE,
		} as WorkerMessagePacketPlayerEvent);
	});
	transmuxer.on(TransmuxingEvents.RECOVERED_EARLY_EOF, () => {
		self.postMessage({
			msg: "player_event",
			event: PlayerEvents.RECOVERED_EARLY_EOF,
		} as WorkerMessagePacketPlayerEvent);
	});
	transmuxer.on(TransmuxingEvents.IO_ERROR, ((detail: unknown, info: unknown) => {
		self.postMessage({
			msg: "player_event",
			event: PlayerEvents.ERROR,
			error_type: ErrorTypes.NETWORK_ERROR,
			error_detail: detail,
			info: info,
		} as WorkerMessagePacketPlayerEventError);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.DEMUX_ERROR, ((detail: unknown, info: unknown) => {
		self.postMessage({
			msg: "player_event",
			event: PlayerEvents.ERROR,
			error_type: ErrorTypes.MEDIA_ERROR,
			error_detail: detail,
			info: info,
		} as WorkerMessagePacketPlayerEventError);
	}) as (...args: unknown[]) => void);

	transmuxer.on(TransmuxingEvents.MEDIA_INFO, ((mediaInfo: unknown) => {
		emitTransmuxingEventsInfo(TransmuxingEvents.MEDIA_INFO, mediaInfo);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.STATISTICS_INFO, ((statInfo: unknown) => {
		emitTransmuxingEventsInfo(TransmuxingEvents.STATISTICS_INFO, statInfo);
	}) as (...args: unknown[]) => void);

	transmuxer.on(TransmuxingEvents.RECOMMEND_SEEKPOINT, ((milliseconds: unknown) => {
		emitTransmuxingEventsRecommendSeekpoint(milliseconds as number);
	}) as (...args: unknown[]) => void);

	transmuxer.on(TransmuxingEvents.METADATA_ARRIVED, ((metadata: unknown) => {
		emitPlayerEventsExtraData(PlayerEvents.METADATA_ARRIVED, metadata);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.SCRIPTDATA_ARRIVED, ((data: unknown) => {
		emitPlayerEventsExtraData(PlayerEvents.SCRIPTDATA_ARRIVED, data);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.TIMED_ID3_METADATA_ARRIVED, ((timed_id3_metadata: unknown) => {
		emitPlayerEventsExtraData(PlayerEvents.TIMED_ID3_METADATA_ARRIVED, timed_id3_metadata);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.PGS_SUBTITLE_ARRIVED, ((pgs_data: unknown) => {
		emitPlayerEventsExtraData(PlayerEvents.PGS_SUBTITLE_ARRIVED, pgs_data);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.SYNCHRONOUS_KLV_METADATA_ARRIVED, ((synchronous_klv_metadata: unknown) => {
		emitPlayerEventsExtraData(PlayerEvents.SYNCHRONOUS_KLV_METADATA_ARRIVED, synchronous_klv_metadata);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.ASYNCHRONOUS_KLV_METADATA_ARRIVED, ((asynchronous_klv_metadata: unknown) => {
		emitPlayerEventsExtraData(PlayerEvents.ASYNCHRONOUS_KLV_METADATA_ARRIVED, asynchronous_klv_metadata);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.SMPTE2038_METADATA_ARRIVED, ((smpte2038_metadata: unknown) => {
		emitPlayerEventsExtraData(PlayerEvents.SMPTE2038_METADATA_ARRIVED, smpte2038_metadata);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.SCTE35_METADATA_ARRIVED, ((scte35_metadata: unknown) => {
		emitPlayerEventsExtraData(PlayerEvents.SCTE35_METADATA_ARRIVED, scte35_metadata);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.PES_PRIVATE_DATA_DESCRIPTOR, ((descriptor: unknown) => {
		emitPlayerEventsExtraData(PlayerEvents.PES_PRIVATE_DATA_DESCRIPTOR, descriptor);
	}) as (...args: unknown[]) => void);
	transmuxer.on(TransmuxingEvents.PES_PRIVATE_DATA_ARRIVED, ((private_data: unknown) => {
		emitPlayerEventsExtraData(PlayerEvents.PES_PRIVATE_DATA_ARRIVED, private_data);
	}) as (...args: unknown[]) => void);

	transmuxer.open();
}

function unload(): void {
	if (mse_controller) {
		mse_controller.flush();
	}
	if (transmuxer) {
		transmuxer.close();
		transmuxer.destroy();
		transmuxer = null;
	}
}

function onMSESourceOpen(): void {
	mse_source_opened = true;
	if (has_pending_load) {
		has_pending_load = false;
		load();
	}
}

function onMSEUpdateEnd(): void {
	self.postMessage({
		msg: "mse_event",
		event: MSEEvents.UPDATE_END,
	} as WorkerMessagePacketMSEEvent);
}

function onMSEBufferFull(): void {
	Log.v(TAG, "MSE SourceBuffer is full, report to main thread");
	self.postMessage({
		msg: "mse_event",
		event: MSEEvents.BUFFER_FULL,
	} as WorkerMessagePacketMSEEvent);
}

function onMSEError(info: unknown): void {
	self.postMessage({
		msg: "player_event",
		event: PlayerEvents.ERROR,
		error_type: ErrorTypes.MEDIA_ERROR,
		error_detail: ErrorDetails.MEDIA_MSE_ERROR,
		info: info,
	} as WorkerMessagePacketPlayerEventError);
}

function emitTransmuxingEventsRecommendSeekpoint(milliseconds: number) {
	self.postMessage({
		msg: "transmuxing_event",
		event: TransmuxingEvents.RECOMMEND_SEEKPOINT,
		milliseconds: milliseconds,
	} as WorkerMessagePacketTransmuxingEventRecommendSeekpoint);
}

function emitTransmuxingEventsInfo(event: TransmuxingEvents, info: unknown) {
	self.postMessage({
		msg: "transmuxing_event",
		event: event,
		info: info,
	} as WorkerMessagePacketTransmuxingEventInfo);
}

function emitPlayerEventsExtraData(event: PlayerEvents, extraData: unknown) {
	self.postMessage({
		msg: "player_event",
		event: event,
		extraData: extraData,
	} as WorkerMessagePacketPlayerEventExtraData);
}

function onLogcatCallback(type: string, str: string): void {
	self.postMessage({
		msg: "logcat_callback",
		type: type,
		logcat: str,
	} as WorkerMessagePacketLogcatCallback);
}
