/*
 * PCM Audio Player
 *
 * Plays decoded PCM audio using Web Audio API with video synchronization support
 */

import type { PlayerConfig } from "../config";
import Log from "../utils/logger";

const TAG = "PCMAudioPlayer";

interface AudioChunk {
	samples: Float32Array;
	channels: number;
	sampleRate: number;
	pts: number; // presentation timestamp in seconds
}

interface BufferedAudioChunk {
	samples: Float32Array;
	channels: number;
	sampleRate: number;
	pts: number;
	duration: number;
	endPts: number;
}

interface ScheduledSource {
	source: AudioBufferSourceNode;
	startTime: number;
	endTime: number;
	chunkPts: number;
}

export class PCMAudioPlayer {
	private config: PlayerConfig;
	private context: AudioContext | null = null;
	private gainNode: GainNode | null = null;
	private pendingChunks: AudioChunk[] = [];
	private isPaused: boolean = false;
	private volume: number = 1.0;
	private muted: boolean = false;

	// Sync state
	private videoElement: HTMLVideoElement | null = null;
	private basePtsOffset: number = 0;
	private basePtsEstablished: boolean = false;
	private lastScheduledEndTime: number = 0;

	// iOS Silent Mode bypass
	private audioElement: HTMLAudioElement | null = null;
	private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;

	// Buffer management for seek support
	private audioBuffer: BufferedAudioChunk[] = [];

	// Track scheduled sources for cancellation
	private scheduledSources: ScheduledSource[] = [];

	// Seek state
	private isSeeking: boolean = false;

	constructor(config: PlayerConfig) {
		this.config = config;
	}

	// Bound event handlers for cleanup
	private boundOnVideoSeeking: (() => void) | null = null;
	private boundOnVideoSeeked: (() => void) | null = null;
	private boundOnVideoPlay: (() => void) | null = null;
	private boundOnVideoPause: (() => void) | null = null;
	private boundOnVolumeChange: (() => void) | null = null;

	async init(): Promise<void> {
		if (this.context) {
			return;
		}

		this.context = new AudioContext();
		this.gainNode = this.context.createGain();

		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

		if (isIOS) {
			try {
				this.mediaStreamDestination = this.context.createMediaStreamDestination();
				this.gainNode.connect(this.mediaStreamDestination);

				this.audioElement = document.createElement("audio");
				this.audioElement.srcObject = this.mediaStreamDestination.stream;
				this.audioElement.autoplay = true;
				this.audioElement.setAttribute("playsinline", "");
				this.audioElement.setAttribute("webkit-playsinline", "");

				Log.v(TAG, "iOS detected: using MediaStream bypass for Silent Mode");
			} catch (_e) {
				Log.w(TAG, "Failed to create MediaStream destination, falling back to default output");
				this.gainNode.connect(this.context.destination);
			}
		} else {
			this.gainNode.connect(this.context.destination);
		}

		this.updateGain();

		this.context.onstatechange = () => {
			Log.v(TAG, `AudioContext state changed to: ${this.context?.state}`);
			if (this.context?.state === "running") {
				// Discard all stale chunks accumulated while suspended,
				// reset sync state — new chunks from feed() will re-establish basePtsOffset
				this.pendingChunks = [];
				this.basePtsEstablished = false;
				this.lastScheduledEndTime = 0;
			}
		};

		if (this.context.state === "suspended") {
			try {
				await this.context.resume();
			} catch (_e) {
				Log.w(TAG, "Failed to resume AudioContext, will retry on user interaction");
			}
		}

		Log.v(TAG, `AudioContext initialized, sampleRate: ${this.context.sampleRate}, state: ${this.context.state}`);
	}

	attachVideo(video: HTMLVideoElement): void {
		this.videoElement = video;

		// Sync initial volume state
		this.setVolume(video.volume);
		this.setMuted(video.muted);

		this.boundOnVideoSeeking = this.onVideoSeeking.bind(this);
		this.boundOnVideoSeeked = this.onVideoSeeked.bind(this);
		this.boundOnVideoPlay = () => this.play();
		this.boundOnVideoPause = () => this.pause();
		this.boundOnVolumeChange = () => {
			this.setVolume(video.volume);
			this.setMuted(video.muted);
		};

		video.addEventListener("seeking", this.boundOnVideoSeeking);
		video.addEventListener("seeked", this.boundOnVideoSeeked);
		video.addEventListener("play", this.boundOnVideoPlay);
		video.addEventListener("pause", this.boundOnVideoPause);
		video.addEventListener("volumechange", this.boundOnVolumeChange);
	}

	detachVideo(): void {
		if (this.videoElement) {
			if (this.boundOnVideoSeeking) this.videoElement.removeEventListener("seeking", this.boundOnVideoSeeking);
			if (this.boundOnVideoSeeked) this.videoElement.removeEventListener("seeked", this.boundOnVideoSeeked);
			if (this.boundOnVideoPlay) this.videoElement.removeEventListener("play", this.boundOnVideoPlay);
			if (this.boundOnVideoPause) this.videoElement.removeEventListener("pause", this.boundOnVideoPause);
			if (this.boundOnVolumeChange) this.videoElement.removeEventListener("volumechange", this.boundOnVolumeChange);
		}
		this.boundOnVideoSeeking = null;
		this.boundOnVideoSeeked = null;
		this.boundOnVideoPlay = null;
		this.boundOnVideoPause = null;
		this.boundOnVolumeChange = null;
		this.videoElement = null;
	}

	feed(samples: Float32Array, channels: number, sampleRate: number, pts: number): void {
		if (!this.context || !this.gainNode) {
			Log.w(TAG, "AudioContext not initialized, dropping audio");
			return;
		}

		const samplesPerChannel = Math.floor(samples.length / channels);
		const duration = samplesPerChannel / sampleRate;

		const bufferedChunk: BufferedAudioChunk = {
			samples,
			channels,
			sampleRate,
			pts,
			duration,
			endPts: pts + duration,
		};
		this.insertToBuffer(bufferedChunk);
		this.cleanupBuffer();

		if (!this.isPaused && !this.isSeeking) {
			this.pendingChunks.push({ samples, channels, sampleRate, pts });
			this.scheduleChunks();
		}
	}

	/**
	 * All audio scheduling goes through this single method — drift-based sync
	 * is always active, whether chunks come from live feed() or buffer refill.
	 */
	private scheduleChunks(): void {
		if (!this.context || !this.gainNode || this.pendingChunks.length === 0) {
			return;
		}

		if (this.context.state === "suspended") {
			this.context.resume().catch(() => {});
			return;
		}

		const ctxTime = this.context.currentTime;
		const videoTime = this.videoElement?.currentTime ?? 0;

		if (!this.basePtsEstablished && this.videoElement && this.videoElement.readyState >= 2) {
			const firstChunk = this.pendingChunks[0];
			this.basePtsOffset = firstChunk.pts - videoTime;
			this.basePtsEstablished = true;

			Log.v(
				TAG,
				`Base PTS offset established: ${this.basePtsOffset.toFixed(3)}s (audioPTS=${firstChunk.pts.toFixed(3)}, videoTime=${videoTime.toFixed(3)})`,
			);
		}

		if (!this.basePtsEstablished) {
			return;
		}

		while (this.pendingChunks.length > 0) {
			const chunk = this.pendingChunks[0];

			const audioVideoTime = chunk.pts - this.basePtsOffset;
			const drift = audioVideoTime - videoTime;
			let scheduleTime = ctxTime + drift;

			if (this.lastScheduledEndTime > 0) {
				const gap = scheduleTime - this.lastScheduledEndTime;
				if (gap < 0 && gap > -0.05) {
					scheduleTime = this.lastScheduledEndTime;
				} else if (gap < -0.05) {
					this.lastScheduledEndTime = 0;
				}
			}

			if (scheduleTime < ctxTime - 0.01) {
				this.pendingChunks.shift();
				continue;
			}

			if (scheduleTime > ctxTime + 5.0) {
				break;
			}

			this.pendingChunks.shift();
			const actualScheduleTime = Math.max(scheduleTime, ctxTime);
			const duration = this.scheduleChunk(chunk, actualScheduleTime);
			this.lastScheduledEndTime = actualScheduleTime + duration;
		}
	}

	private scheduleChunk(chunk: AudioChunk, startTime: number): number {
		if (!this.context || !this.gainNode) {
			return 0;
		}

		const { samples, channels, sampleRate } = chunk;
		const samplesPerChannel = Math.floor(samples.length / channels);

		const buffer = this.context.createBuffer(channels, samplesPerChannel, sampleRate);

		for (let ch = 0; ch < channels; ch++) {
			const channelData = buffer.getChannelData(ch);
			for (let i = 0; i < samplesPerChannel; i++) {
				channelData[i] = samples[i * channels + ch];
			}
		}

		const source = this.context.createBufferSource();
		source.buffer = buffer;
		source.connect(this.gainNode);
		source.start(startTime);

		const endTime = startTime + buffer.duration;
		this.scheduledSources.push({ source, startTime, endTime, chunkPts: chunk.pts });
		this.cleanupCompletedSources();

		return buffer.duration;
	}

	// ==================== Buffer Management ====================

	private insertToBuffer(chunk: BufferedAudioChunk): void {
		let low = 0;
		let high = this.audioBuffer.length;
		while (low < high) {
			const mid = (low + high) >>> 1;
			if (this.audioBuffer[mid].pts < chunk.pts) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}

		if (low < this.audioBuffer.length && Math.abs(this.audioBuffer[low].pts - chunk.pts) < 0.001) {
			this.audioBuffer[low] = chunk;
		} else {
			this.audioBuffer.splice(low, 0, chunk);
		}
	}

	/** Remove buffered audio that is too far behind the current playback position.
	 *  Same strategy as MSE SourceBuffer cleanup: relative to currentTime. */
	private cleanupBuffer(): void {
		if (this.audioBuffer.length === 0 || !this.videoElement || !this.basePtsEstablished) return;

		// Convert video currentTime to audio PTS space
		const currentAudioPts = this.videoElement.currentTime + this.basePtsOffset;

		if (currentAudioPts - this.audioBuffer[0].pts < this.config.bufferCleanupMaxBackward) return;

		const cutoffPts = currentAudioPts - this.config.bufferCleanupMinBackward;
		let removeCount = 0;
		for (let i = 0; i < this.audioBuffer.length; i++) {
			if (this.audioBuffer[i].endPts < cutoffPts) {
				removeCount++;
			} else {
				break;
			}
		}
		if (removeCount > 0) {
			this.audioBuffer.splice(0, removeCount);
		}
	}

	private findChunkIndexByTime(targetTime: number): number {
		if (this.audioBuffer.length === 0) return -1;

		let low = 0;
		let high = this.audioBuffer.length - 1;
		while (low <= high) {
			const mid = (low + high) >>> 1;
			const chunk = this.audioBuffer[mid];
			if (targetTime >= chunk.pts && targetTime < chunk.endPts) {
				return mid;
			} else if (targetTime < chunk.pts) {
				high = mid - 1;
			} else {
				low = mid + 1;
			}
		}

		if (low > 0) return low - 1;
		return low < this.audioBuffer.length ? low : -1;
	}

	private isTimeBuffered(time: number): boolean {
		if (this.audioBuffer.length === 0) return false;
		const index = this.findChunkIndexByTime(time);
		if (index < 0) return false;
		const chunk = this.audioBuffer[index];
		return time >= chunk.pts && time < chunk.endPts;
	}

	/**
	 * Push all audioBuffer chunks from startIndex into pendingChunks.
	 * Only references are copied (no PCM data duplication).
	 * scheduleChunks() applies drift-based sync and only schedules up to 5s ahead.
	 */
	private refillFromBuffer(startIndex: number): void {
		for (let i = startIndex; i < this.audioBuffer.length; i++) {
			const bc = this.audioBuffer[i];
			this.pendingChunks.push({
				samples: bc.samples,
				channels: bc.channels,
				sampleRate: bc.sampleRate,
				pts: bc.pts,
			});
		}
	}

	// ==================== Source Tracking ====================

	private cancelScheduledAudio(): void {
		for (const scheduled of this.scheduledSources) {
			try {
				scheduled.source.stop();
				scheduled.source.disconnect();
			} catch (_e) {}
		}
		this.scheduledSources = [];
		this.lastScheduledEndTime = 0;
	}

	private cleanupCompletedSources(): void {
		if (!this.context) return;
		const ctxTime = this.context.currentTime;
		this.scheduledSources = this.scheduledSources.filter((scheduled) => {
			if (scheduled.endTime < ctxTime - 0.1) {
				try {
					scheduled.source.disconnect();
				} catch (_e) {}
				return false;
			}
			return true;
		});
	}

	// ==================== Seek Event Handlers ====================

	private onVideoSeeking(): void {
		Log.v(TAG, "Video seeking, canceling scheduled audio");
		this.isSeeking = true;

		this.cancelScheduledAudio();
		this.pendingChunks = [];
	}

	private onVideoSeeked(): void {
		if (!this.videoElement) return;
		const targetTime = this.videoElement.currentTime;
		Log.v(TAG, `Video seeked to ${targetTime.toFixed(3)}`);
		this.isSeeking = false;
		this.seekToTime(targetTime);
	}

	seekToTime(targetTime: number): void {
		this.cancelScheduledAudio();
		this.pendingChunks = [];
		this.basePtsEstablished = false;
		this.lastScheduledEndTime = 0;

		const audioPtsTarget = targetTime + this.basePtsOffset;

		if (this.basePtsOffset !== 0 && this.isTimeBuffered(audioPtsTarget)) {
			const startIndex = this.findChunkIndexByTime(audioPtsTarget);
			if (startIndex >= 0) {
				Log.v(
					TAG,
					`Seek to buffered position: videoTime=${targetTime.toFixed(3)}, audioPts=${audioPtsTarget.toFixed(3)}, chunk ${startIndex}`,
				);
				// Refill pendingChunks from buffer and schedule with drift sync
				this.refillFromBuffer(startIndex);
				this.scheduleChunks();
				return;
			}
		}

		Log.v(TAG, `Seek target ${targetTime.toFixed(3)} not in buffer, waiting for new data`);
		this.basePtsOffset = 0;
	}

	// ==================== Playback Control ====================

	async play(): Promise<void> {
		this.isPaused = false;

		if (this.context?.state === "suspended") {
			try {
				await this.context.resume();
			} catch (_e) {
				Log.w(TAG, "Failed to resume AudioContext on play()");
			}
		}

		if (this.audioElement) {
			try {
				await this.audioElement.play();
			} catch (_e) {
				Log.w(TAG, "Failed to play audio element");
			}
		}

		this.pendingChunks = [];
		this.lastScheduledEndTime = 0;
		this.basePtsEstablished = false;

		if (this.videoElement && this.basePtsOffset !== 0) {
			this.seekToTime(this.videoElement.currentTime);
		}
	}

	pause(): void {
		this.isPaused = true;

		this.cancelScheduledAudio();
		this.pendingChunks = [];

		if (this.context && this.context.state === "running") {
			this.context.suspend().catch(() => {});
		}

		if (this.audioElement) {
			this.audioElement.pause();
		}
	}

	stop(): void {
		this.cancelScheduledAudio();

		this.pendingChunks = [];
		this.audioBuffer = [];

		this.isPaused = false;
		this.isSeeking = false;
		this.lastScheduledEndTime = 0;
		this.basePtsEstablished = false;
		this.basePtsOffset = 0;
	}

	flush(): void {
		this.cancelScheduledAudio();

		this.pendingChunks = [];
		this.audioBuffer = [];

		this.lastScheduledEndTime = 0;
		this.basePtsEstablished = false;
		this.basePtsOffset = 0;
	}

	setVolume(volume: number): void {
		this.volume = Math.max(0, Math.min(1, volume));
		this.updateGain();
	}

	setMuted(muted: boolean): void {
		this.muted = muted;
		this.updateGain();
	}

	private updateGain(): void {
		if (this.gainNode) {
			this.gainNode.gain.value = this.muted ? 0 : this.volume;
		}
		if (this.audioElement) {
			this.audioElement.volume = this.muted ? 0 : this.volume;
		}
	}

	async destroy(): Promise<void> {
		this.stop();
		this.detachVideo();

		if (this.audioElement) {
			this.audioElement.pause();
			this.audioElement.srcObject = null;
			this.audioElement = null;
		}

		if (this.mediaStreamDestination) {
			this.mediaStreamDestination.disconnect();
			this.mediaStreamDestination = null;
		}

		if (this.gainNode) {
			this.gainNode.disconnect();
			this.gainNode = null;
		}

		if (this.context) {
			this.context.onstatechange = null;
			await this.context.close();
			this.context = null;
		}
	}
}
