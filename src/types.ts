export interface PlayerSegment {
	url: string;
	duration?: number;
}

export interface PlayerConfig {
	isLive: boolean;
	liveSync: boolean;
	liveSyncMaxLatency: number;
	liveSyncTargetLatency: number;
	liveSyncPlaybackRate: number;
	enableStashBuffer: boolean;
}

export const defaultPlayerConfig: PlayerConfig = {
	isLive: false,
	liveSync: false,
	liveSyncMaxLatency: 1.2,
	liveSyncTargetLatency: 0.8,
	liveSyncPlaybackRate: 1.2,
	enableStashBuffer: true,
};

export interface PlayerError {
	category: "io" | "demux" | "media";
	detail: string;
	info?: string;
}

export interface PlayerEventMap {
	error: (error: PlayerError) => void;
	"seek-needed": (seconds: number) => void;
}

export interface Player {
	loadSegments(segments: PlayerSegment[]): void;
	seek(seconds: number): void;
	setLiveSync(enabled: boolean): void;
	destroy(): void;
	on<K extends keyof PlayerEventMap>(event: K, handler: PlayerEventMap[K]): void;
	off<K extends keyof PlayerEventMap>(event: K, handler: PlayerEventMap[K]): void;
}

/** Internal player implementation interface */
export interface PlayerImpl {
	onError: ((error: PlayerError) => void) | null;
	onHLSDetected?: (() => void) | null;
	loadSegments(segments: PlayerSegment[]): void;
	seek(seconds: number): void;
	setLiveSync(enabled: boolean): void;
	/** Release the video element (stop feeding, detach source) but keep reusable resources (worker) alive. */
	suspend(): void;
	destroy(): void;
}
