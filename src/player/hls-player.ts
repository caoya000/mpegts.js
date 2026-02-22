import type { PlayerConfig, PlayerImpl, PlayerSegment } from "../types";
import { isBuffered } from "./mpegts-player";

export function createHlsPlayer(
	video: HTMLVideoElement,
	_config: PlayerConfig,
	seekHandlers: Set<(s: number) => void>,
): PlayerImpl {
	let errorListenerAttached = false;

	function onVideoError(): void {
		impl.onError?.({ category: "media", detail: video.error?.message ?? "Unknown HLS error" });
	}

	const impl: PlayerImpl = {
		onError: null,

		loadSegments(segments: PlayerSegment[]) {
			if (!errorListenerAttached) {
				video.addEventListener("error", onVideoError);
				errorListenerAttached = true;
			}
			video.src = segments[0].url;
		},

		setLiveSync(_enabled: boolean) {
			// HLS live sync is handled natively by the browser
		},

		seek(seconds: number) {
			if (isBuffered(video, seconds) || isHLSSeekable(video, seconds)) {
				video.currentTime = seconds;
			} else {
				for (const h of seekHandlers) {
					h(seconds);
				}
			}
		},

		suspend() {
			// Release video source but keep impl alive for reuse
			video.removeAttribute("src");
			video.load();
		},

		destroy() {
			impl.suspend();
			if (errorListenerAttached) {
				video.removeEventListener("error", onVideoError);
				errorListenerAttached = false;
			}
		},
	};

	return impl;
}

function isHLSSeekable(video: HTMLVideoElement, seconds: number): boolean {
	const seekable = video.seekable;
	if (!seekable) return false;
	for (let i = 0; i < seekable.length; i++) {
		if (seconds >= seekable.start(i) && seconds <= seekable.end(i)) {
			return true;
		}
	}
	return false;
}
