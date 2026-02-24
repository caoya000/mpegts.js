export declare function createPlayer(video: HTMLVideoElement, config?: Partial<PlayerConfig>): Player;

export declare function isSupported(): boolean;

export declare interface Player {
    loadSegments(segments: PlayerSegment[]): void;
    seek(seconds: number): void;
    setLiveSync(enabled: boolean): void;
    destroy(): void;
    on<K extends keyof PlayerEventMap>(event: K, handler: PlayerEventMap[K]): void;
    off<K extends keyof PlayerEventMap>(event: K, handler: PlayerEventMap[K]): void;
}

/** Player configuration options. All fields are optional when passed to `createPlayer()`. */
export declare interface PlayerConfig {
    /** Chase live stream latency by changing playbackRate. @default true */
    liveSync: boolean;
    /** Maximum acceptable buffer latency in seconds. Requires `liveSync: true`. @default 1.2 */
    liveSyncMaxLatency: number;
    /** Target latency in seconds to chase when latency exceeds `liveSyncMaxLatency`. Requires `liveSync: true`. @default 0.8 */
    liveSyncTargetLatency: number;
    /** PlaybackRate (clamped to [1, 2]) used for latency chasing. Requires `liveSync: true`. @default 1.2 */
    liveSyncPlaybackRate: number;
    /** Fill silent audio frames to avoid A/V desync on large audio timestamp gaps. @default true */
    fixAudioTimestampGap: boolean;
    /** URLs to WASM decoder files, keyed by codec. Omit to disable software decoding for that codec.
     *  e.g. `{ mp2: "/assets/mp2_decoder.wasm" }` */
    wasmDecoders: {
        mp2?: string;
    };
    /** Max backward buffer duration in seconds. Cleanup triggers when buffer exceeds this. @default 180 */
    bufferCleanupMaxBackward: number;
    /** Min backward buffer to retain after cleanup in seconds. @default 120 */
    bufferCleanupMinBackward: number;
    /** Referrer policy for HTTP requests. Applied to each segment's `referrerPolicy` field. */
    referrerPolicy: string | undefined;
    /** Additional headers to add to HTTP requests. */
    headers: Record<string, string> | undefined;
}

export declare interface PlayerError {
    category: "io" | "demux" | "media";
    detail: string;
    info?: string;
}

export declare interface PlayerEventMap {
    error: (error: PlayerError) => void;
    "seek-needed": (seconds: number) => void;
    /** Fired when audio playback is blocked by autoplay policy and requires user interaction. */
    "audio-suspended": () => void;
}

export declare interface PlayerSegment {
    url: string;
    duration?: number;
}

export { }
