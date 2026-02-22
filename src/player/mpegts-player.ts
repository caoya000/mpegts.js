import type { PlayerConfig, PlayerImpl, PlayerSegment } from "../types";
import type { WorkerCommand, WorkerEvent } from "../worker/messages";
import TransmuxWorker from "../worker/transmux-worker.ts?worker&inline";
import { setupLiveSync, setupStartupStallJumper } from "./live-sync";
import { createMSE, type MSE } from "./mse";

/** Check if a given time position is within any buffered range of the video element. */
export function isBuffered(video: HTMLMediaElement, seconds: number): boolean {
	const buffered = video.buffered;
	for (let i = 0; i < buffered.length; i++) {
		if (seconds >= buffered.start(i) && seconds <= buffered.end(i)) {
			return true;
		}
	}
	return false;
}

export function createMpegtsPlayer(
	video: HTMLVideoElement,
	config: PlayerConfig,
	seekHandlers: Set<(s: number) => void>,
): PlayerImpl {
	let mse: MSE | null = null;
	let worker: Worker | null = null;
	let workerInitialized = false;
	let pendingSegments: PlayerSegment[] | null = null;
	let destroyLiveSync: (() => void) | null = null;
	let destroyStallJumper: (() => void) | null = null;
	let mseGeneration = 0;

	function handleWorkerMessage(e: MessageEvent): void {
		const msg = e.data as WorkerEvent | { type: "destroyed" };
		if (msg.type === "destroyed") return;
		// Discard stale messages from a previous load generation
		if (msg.gen !== mseGeneration) return;
		switch (msg.type) {
			case "init-segment":
				mse?.appendInit(msg.track, msg.data, msg.codec, msg.container);
				break;
			case "media-segment":
				mse?.appendMedia(msg.track, msg.data);
				break;
			case "error":
				impl.onError?.({
					category: msg.category === "io" ? "io" : "demux",
					detail: msg.detail,
					info: msg.info,
				});
				break;
			case "complete":
				mse?.endOfStream();
				break;
			case "media-info":
				break;
		}
	}

	function ensureWorker(): Worker {
		if (!worker) {
			worker = new TransmuxWorker();
			worker.onmessage = handleWorkerMessage;
			workerInitialized = false;
		}
		return worker;
	}

	function loadInWorker(segments: PlayerSegment[]): void {
		const w = ensureWorker();
		if (!workerInitialized) {
			const initCmd: WorkerCommand = { type: "init", segments, config, gen: mseGeneration };
			w.postMessage(initCmd);
			const startCmd: WorkerCommand = { type: "start" };
			w.postMessage(startCmd);
			workerInitialized = true;
		} else {
			const cmd: WorkerCommand = { type: "load-segments", segments, gen: mseGeneration };
			w.postMessage(cmd);
		}
	}

	/** Create (or recreate) MSE and attach to video element. */
	function initMSE(): void {
		mse = createMSE(video, { isLive: config.isLive });

		mse.open(() => {
			if (pendingSegments) {
				loadInWorker(pendingSegments);
				pendingSegments = null;
			}
		});

		mse.onBufferFull = () => {
			const cmd: WorkerCommand = { type: "pause" };
			worker?.postMessage(cmd);
		};

		mse.onError = (info) => {
			impl.onError?.({
				category: "media",
				detail: "MediaMSEError",
				info: info.msg,
			});
		};
	}

	function initLiveHelpers(): void {
		if (!destroyLiveSync && config.liveSync) {
			destroyLiveSync = setupLiveSync(video, config);
		}
		if (!destroyStallJumper) {
			destroyStallJumper = setupStartupStallJumper(video);
		}
	}

	const impl: PlayerImpl = {
		onError: null,

		loadSegments(segments: PlayerSegment[]) {
			mseGeneration++;
			if (mse) {
				mse.destroy();
				mse = null;
			}
			initMSE();
			initLiveHelpers();
			pendingSegments = segments;
		},

		setLiveSync(enabled: boolean) {
			if (enabled && !destroyLiveSync) {
				destroyLiveSync = setupLiveSync(video, config);
			} else if (!enabled && destroyLiveSync) {
				destroyLiveSync();
				destroyLiveSync = null;
			}
		},

		seek(seconds: number) {
			if (isBuffered(video, seconds)) {
				video.currentTime = seconds;
			} else {
				for (const h of seekHandlers) {
					h(seconds);
				}
			}
		},

		suspend() {
			if (mse) {
				mse.destroy();
				mse = null;
			}
			destroyLiveSync?.();
			destroyLiveSync = null;
			destroyStallJumper?.();
			destroyStallJumper = null;
		},

		destroy() {
			impl.suspend();
			if (worker) {
				const cmd: WorkerCommand = { type: "destroy" };
				worker.postMessage(cmd);
				worker.terminate();
				worker = null;
			}
			workerInitialized = false;
		},
	};

	return impl;
}
