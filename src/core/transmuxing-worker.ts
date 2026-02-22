import LoggingControl from "../utils/logging-control";
import TransmuxingController from "./transmuxing-controller";
import TransmuxingEvents from "./transmuxing-events";

/* post message to worker:
   data: {
       cmd: string
       param: unknown
   }

   receive message from worker:
   data: {
       msg: string,
       data: unknown
   }
 */

const _TAG: string = "TransmuxingWorker";
let controller: TransmuxingController | null = null;
const logcatListener: (type: string, str: string) => void = onLogcatCallback.bind(self);

self.addEventListener("message", (e: MessageEvent) => {
	switch (e.data.cmd) {
		case "init":
			controller = new TransmuxingController(e.data.param[0], e.data.param[1]);
			controller.on(TransmuxingEvents.IO_ERROR, onIOError.bind(self) as (...args: unknown[]) => void);
			controller.on(TransmuxingEvents.DEMUX_ERROR, onDemuxError.bind(self) as (...args: unknown[]) => void);
			controller.on(TransmuxingEvents.INIT_SEGMENT, onInitSegment.bind(self) as (...args: unknown[]) => void);
			controller.on(TransmuxingEvents.MEDIA_SEGMENT, onMediaSegment.bind(self) as (...args: unknown[]) => void);
			controller.on(TransmuxingEvents.LOADING_COMPLETE, onLoadingComplete.bind(self));
			controller.on(TransmuxingEvents.RECOVERED_EARLY_EOF, onRecoveredEarlyEof.bind(self));
			controller.on(TransmuxingEvents.MEDIA_INFO, onMediaInfo.bind(self));
			controller.on(TransmuxingEvents.TIMED_ID3_METADATA_ARRIVED, onTimedID3MetadataArrived.bind(self));
			controller.on(TransmuxingEvents.PGS_SUBTITLE_ARRIVED, onPGSSubtitleDataArrived.bind(self));
			controller.on(TransmuxingEvents.SYNCHRONOUS_KLV_METADATA_ARRIVED, onSynchronousKLVMetadataArrived.bind(self));
			controller.on(TransmuxingEvents.ASYNCHRONOUS_KLV_METADATA_ARRIVED, onAsynchronousKLVMetadataArrived.bind(self));
			controller.on(TransmuxingEvents.SMPTE2038_METADATA_ARRIVED, onSMPTE2038MetadataArrived.bind(self));
			controller.on(TransmuxingEvents.SCTE35_METADATA_ARRIVED, onSCTE35MetadataArrived.bind(self));
			controller.on(TransmuxingEvents.PES_PRIVATE_DATA_DESCRIPTOR, onPESPrivateDataDescriptor.bind(self));
			controller.on(TransmuxingEvents.PES_PRIVATE_DATA_ARRIVED, onPESPrivateDataArrived.bind(self));
			controller.on(TransmuxingEvents.STATISTICS_INFO, onStatisticsInfo.bind(self));
			controller.on(
				TransmuxingEvents.RECOMMEND_SEEKPOINT,
				onRecommendSeekpoint.bind(self) as (...args: unknown[]) => void,
			);
			break;
		case "destroy":
			if (controller) {
				controller.destroy();
				controller = null;
			}
			(self as unknown as { postMessage(msg: unknown): void }).postMessage({ msg: "destroyed" });
			break;
		case "start":
			controller?.start();
			break;
		case "stop":
			controller?.stop();
			break;
		case "seek":
			controller?.seek(e.data.param);
			break;
		case "pause":
			controller?.pause();
			break;
		case "resume":
			controller?.resume();
			break;
		case "logging_config": {
			const config = e.data.param;
			LoggingControl.applyConfig(config);

			if (config.enableCallback === true) {
				LoggingControl.addLogListener(logcatListener);
			} else {
				LoggingControl.removeLogListener(logcatListener);
			}
			break;
		}
	}
});

function postWorkerMessage(msg: unknown, transfer?: Transferable[]): void {
	if (transfer) {
		(self as unknown as { postMessage(msg: unknown, transfer: Transferable[]): void }).postMessage(msg, transfer);
	} else {
		(self as unknown as { postMessage(msg: unknown): void }).postMessage(msg);
	}
}

function onInitSegment(type: string, initSegment: Record<string, unknown>): void {
	const obj = {
		msg: TransmuxingEvents.INIT_SEGMENT,
		data: {
			type: type,
			data: initSegment,
		},
	};
	postWorkerMessage(obj, [initSegment.data as ArrayBuffer]); // data: ArrayBuffer
}

function onMediaSegment(type: string, mediaSegment: Record<string, unknown>): void {
	const obj = {
		msg: TransmuxingEvents.MEDIA_SEGMENT,
		data: {
			type: type,
			data: mediaSegment,
		},
	};
	postWorkerMessage(obj, [mediaSegment.data as ArrayBuffer]); // data: ArrayBuffer
}

function onLoadingComplete(): void {
	const obj = {
		msg: TransmuxingEvents.LOADING_COMPLETE,
	};
	postWorkerMessage(obj);
}

function onRecoveredEarlyEof(): void {
	const obj = {
		msg: TransmuxingEvents.RECOVERED_EARLY_EOF,
	};
	postWorkerMessage(obj);
}

function onMediaInfo(mediaInfo: unknown): void {
	const obj = {
		msg: TransmuxingEvents.MEDIA_INFO,
		data: mediaInfo,
	};
	postWorkerMessage(obj);
}

function onTimedID3MetadataArrived(data: unknown): void {
	const obj = {
		msg: TransmuxingEvents.TIMED_ID3_METADATA_ARRIVED,
		data: data,
	};
	postWorkerMessage(obj);
}

function onPGSSubtitleDataArrived(data: unknown): void {
	const obj = {
		msg: TransmuxingEvents.PGS_SUBTITLE_ARRIVED,
		data: data,
	};
	postWorkerMessage(obj);
}

function onSynchronousKLVMetadataArrived(data: unknown): void {
	const obj = {
		msg: TransmuxingEvents.SYNCHRONOUS_KLV_METADATA_ARRIVED,
		data: data,
	};
	postWorkerMessage(obj);
}

function onAsynchronousKLVMetadataArrived(data: unknown): void {
	const obj = {
		msg: TransmuxingEvents.ASYNCHRONOUS_KLV_METADATA_ARRIVED,
		data: data,
	};
	postWorkerMessage(obj);
}

function onSMPTE2038MetadataArrived(data: unknown): void {
	const obj = {
		msg: TransmuxingEvents.SMPTE2038_METADATA_ARRIVED,
		data: data,
	};
	postWorkerMessage(obj);
}

function onSCTE35MetadataArrived(data: unknown): void {
	const obj = {
		msg: TransmuxingEvents.SCTE35_METADATA_ARRIVED,
		data: data,
	};
	postWorkerMessage(obj);
}

function onPESPrivateDataDescriptor(data: unknown): void {
	const obj = {
		msg: TransmuxingEvents.PES_PRIVATE_DATA_DESCRIPTOR,
		data: data,
	};
	postWorkerMessage(obj);
}

function onPESPrivateDataArrived(data: unknown): void {
	const obj = {
		msg: TransmuxingEvents.PES_PRIVATE_DATA_ARRIVED,
		data: data,
	};
	postWorkerMessage(obj);
}

function onStatisticsInfo(statInfo: unknown): void {
	const obj = {
		msg: TransmuxingEvents.STATISTICS_INFO,
		data: statInfo,
	};
	postWorkerMessage(obj);
}

function onIOError(type: string, info: unknown): void {
	postWorkerMessage({
		msg: TransmuxingEvents.IO_ERROR,
		data: {
			type: type,
			info: info,
		},
	});
}

function onDemuxError(type: string, info: unknown): void {
	postWorkerMessage({
		msg: TransmuxingEvents.DEMUX_ERROR,
		data: {
			type: type,
			info: info,
		},
	});
}

function onRecommendSeekpoint(milliseconds: number): void {
	postWorkerMessage({
		msg: TransmuxingEvents.RECOMMEND_SEEKPOINT,
		data: milliseconds,
	});
}

function onLogcatCallback(type: string, str: string): void {
	postWorkerMessage({
		msg: "logcat_callback",
		data: {
			type: type,
			logcat: str,
		},
	});
}
