import { createHlsPlayer } from "./player/hls-player";
import { createMpegtsPlayer } from "./player/mpegts-player";
import {
	defaultPlayerConfig,
	type Player,
	type PlayerConfig,
	type PlayerError,
	type PlayerEventMap,
	type PlayerImpl,
	type PlayerSegment,
} from "./types";

export type { Player, PlayerConfig, PlayerError, PlayerEventMap, PlayerSegment };

export function createPlayer(video: HTMLVideoElement, config?: Partial<PlayerConfig>): Player {
	const fullConfig: PlayerConfig = { ...defaultPlayerConfig, ...config };
	let destroyed = false;

	const errorHandlers = new Set<(e: PlayerError) => void>();
	const seekHandlers = new Set<(s: number) => void>();

	// Cached impls — created on demand, kept alive across type switches
	const cache: Record<string, PlayerImpl> = {};
	let activeType: string | null = null;
	let lastSegments: PlayerSegment[] = [];

	function setErrorHandler(impl: PlayerImpl): void {
		impl.onError = (e) => {
			for (const h of errorHandlers) {
				h(e);
			}
		};
	}

	function getOrCreateImpl(type: "mpegts" | "hls"): PlayerImpl {
		if (!cache[type]) {
			const impl =
				type === "hls"
					? createHlsPlayer(video, fullConfig, seekHandlers)
					: createMpegtsPlayer(video, fullConfig, seekHandlers);
			setErrorHandler(impl);
			cache[type] = impl;
		}
		return cache[type];
	}

	function switchTo(type: "mpegts" | "hls"): PlayerImpl {
		if (activeType === type && cache[type]) {
			return cache[type];
		}

		// Suspend current active impl (release video element, keep resources)
		if (activeType && cache[activeType]) {
			cache[activeType].suspend();
		}

		activeType = type;
		return getOrCreateImpl(type);
	}

	function setupHLSDetection(impl: PlayerImpl): void {
		impl.onHLSDetected = () => {
			if (destroyed || !lastSegments.length) return;
			const hlsImpl = switchTo("hls");
			hlsImpl.loadSegments(lastSegments);
		};
	}

	return {
		loadSegments(segments: PlayerSegment[]) {
			if (destroyed || !segments.length) return;
			lastSegments = segments;
			const impl = switchTo("mpegts");
			setupHLSDetection(impl);
			impl.loadSegments(segments);
		},

		seek(seconds: number) {
			if (activeType) cache[activeType]?.seek(seconds);
		},

		setLiveSync(enabled: boolean) {
			for (const impl of Object.values(cache)) {
				impl.setLiveSync(enabled);
			}
		},

		destroy() {
			destroyed = true;
			for (const impl of Object.values(cache)) {
				impl.destroy();
			}
			activeType = null;
		},

		on<K extends keyof PlayerEventMap>(event: K, handler: PlayerEventMap[K]) {
			if (event === "error") errorHandlers.add(handler as (e: PlayerError) => void);
			if (event === "seek-needed") seekHandlers.add(handler as (s: number) => void);
		},

		off<K extends keyof PlayerEventMap>(event: K, handler: PlayerEventMap[K]) {
			if (event === "error") errorHandlers.delete(handler as (e: PlayerError) => void);
			if (event === "seek-needed") seekHandlers.delete(handler as (s: number) => void);
		},
	};
}

export function isSupported(): boolean {
	const avcMime = 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"';
	const mse = (self as unknown as Record<string, unknown>).MediaSource as
		| { isTypeSupported?: (t: string) => boolean }
		| undefined;
	const mms = (self as unknown as Record<string, unknown>).ManagedMediaSource as
		| { isTypeSupported?: (t: string) => boolean }
		| undefined;
	return !!(mse?.isTypeSupported?.(avcMime) || mms?.isTypeSupported?.(avcMime));
}
