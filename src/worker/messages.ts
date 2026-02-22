import type { PlayerConfig, PlayerSegment } from "../types";

export type WorkerCommand =
	| { type: "init"; segments: PlayerSegment[]; config: PlayerConfig }
	| { type: "start" }
	| { type: "load-segments"; segments: PlayerSegment[] }
	| { type: "pause" }
	| { type: "resume" }
	| { type: "destroy" };

export type WorkerEvent =
	| { type: "init-segment"; track: "video" | "audio"; data: ArrayBuffer; codec: string; container: string }
	| { type: "media-segment"; track: "video" | "audio"; data: ArrayBuffer }
	| { type: "media-info"; info: unknown }
	| { type: "complete" }
	| { type: "error"; category: "io" | "demux"; detail: string; info?: string };
