import type { PlayerConfig } from "../types";

/** Sets up live latency synchronization by adjusting playbackRate on timeupdate events. */
export function setupLiveSync(video: HTMLMediaElement, config: PlayerConfig): () => void {
	function onTimeUpdate(): void {
		if (!config.isLive || !config.liveSync) return;

		const buffered = video.buffered;
		if (buffered.length === 0) return;

		const bufferedEnd = buffered.end(buffered.length - 1);
		const latency = bufferedEnd - video.currentTime;

		if (latency > config.liveSyncMaxLatency) {
			video.playbackRate = Math.min(2, Math.max(1, config.liveSyncPlaybackRate));
		} else if (latency <= config.liveSyncTargetLatency) {
			if (video.playbackRate !== 1 && video.playbackRate !== 0) {
				video.playbackRate = 1;
			}
		}
		// else: between target and max, keep current playbackRate
	}

	video.addEventListener("timeupdate", onTimeUpdate);

	return () => {
		video.removeEventListener("timeupdate", onTimeUpdate);
	};
}

/**
 * Detect and fix stuck playback at startup.
 * If the video is stalled or hasn't received canplay and the currentTime is before
 * the first buffered range, seek to the start of the buffered range.
 */
export function setupStartupStallJumper(video: HTMLMediaElement): () => void {
	let canplayReceived = false;

	function onCanPlay(): void {
		canplayReceived = true;
		video.removeEventListener("canplay", onCanPlay);
	}

	function detectAndFix(isStalled?: boolean): void {
		const buffered = video.buffered;
		if (isStalled || !canplayReceived || video.readyState < 2) {
			if (buffered.length > 0 && video.currentTime < buffered.start(0)) {
				video.currentTime = buffered.start(0);
				video.removeEventListener("progress", onProgress);
			}
		} else {
			video.removeEventListener("progress", onProgress);
		}
	}

	function onStalled(): void {
		detectAndFix(true);
	}

	function onProgress(): void {
		detectAndFix();
	}

	video.addEventListener("canplay", onCanPlay);
	video.addEventListener("stalled", onStalled);
	video.addEventListener("progress", onProgress);

	return () => {
		video.removeEventListener("canplay", onCanPlay);
		video.removeEventListener("stalled", onStalled);
		video.removeEventListener("progress", onProgress);
	};
}
