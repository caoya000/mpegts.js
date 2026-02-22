export interface KeyframesIndex {
	times: number[];
	filepositions: number[];
}

export interface NearestKeyframe {
	index: number;
	milliseconds: number;
	fileposition: number;
}

class MediaInfo {
	mimeType: string | null;
	duration: number | null;

	hasAudio: boolean | null;
	hasVideo: boolean | null;
	audioCodec: string | null;
	videoCodec: string | null;
	audioDataRate: number | null;
	videoDataRate: number | null;

	audioSampleRate: number | null;
	audioChannelCount: number | null;

	width: number | null;
	height: number | null;
	fps: number | null;
	profile: string | null;
	level: string | null;
	refFrames: number | null;
	chromaFormat: string | null;
	sarNum: number | null;
	sarDen: number | null;

	metadata: unknown;
	segments: MediaInfo[] | null;
	segmentCount: number | null;
	hasKeyframesIndex: boolean | null;
	keyframesIndex: KeyframesIndex | null;

	constructor() {
		this.mimeType = null;
		this.duration = null;

		this.hasAudio = null;
		this.hasVideo = null;
		this.audioCodec = null;
		this.videoCodec = null;
		this.audioDataRate = null;
		this.videoDataRate = null;

		this.audioSampleRate = null;
		this.audioChannelCount = null;

		this.width = null;
		this.height = null;
		this.fps = null;
		this.profile = null;
		this.level = null;
		this.refFrames = null;
		this.chromaFormat = null;
		this.sarNum = null;
		this.sarDen = null;

		this.metadata = null;
		this.segments = null; // MediaInfo[]
		this.segmentCount = null;
		this.hasKeyframesIndex = null;
		this.keyframesIndex = null;
	}

	isComplete(): boolean {
		const audioInfoComplete =
			this.hasAudio === false ||
			(this.hasAudio === true &&
				this.audioCodec != null &&
				this.audioSampleRate != null &&
				this.audioChannelCount != null);

		const videoInfoComplete =
			this.hasVideo === false ||
			(this.hasVideo === true &&
				this.videoCodec != null &&
				this.width != null &&
				this.height != null &&
				this.fps != null &&
				this.profile != null &&
				this.level != null &&
				this.refFrames != null &&
				this.chromaFormat != null &&
				this.sarNum != null &&
				this.sarDen != null);

		// keyframesIndex may not be present
		return this.mimeType != null && audioInfoComplete && videoInfoComplete;
	}

	isSeekable(): boolean {
		return this.hasKeyframesIndex === true;
	}

	getNearestKeyframe(milliseconds: number): NearestKeyframe | null {
		if (this.keyframesIndex == null) {
			return null;
		}

		const table = this.keyframesIndex;
		const keyframeIdx = this._search(table.times, milliseconds);

		return {
			index: keyframeIdx,
			milliseconds: table.times[keyframeIdx],
			fileposition: table.filepositions[keyframeIdx],
		};
	}

	_search(list: number[], value: number): number {
		let idx = 0;

		const last = list.length - 1;
		let mid = 0;
		let lbound = 0;
		let ubound = last;

		if (value < list[0]) {
			idx = 0;
			lbound = ubound + 1; // skip search
		}

		while (lbound <= ubound) {
			mid = lbound + Math.floor((ubound - lbound) / 2);
			if (mid === last || (value >= list[mid] && value < list[mid + 1])) {
				idx = mid;
				break;
			} else if (list[mid] < value) {
				lbound = mid + 1;
			} else {
				ubound = mid - 1;
			}
		}

		return idx;
	}
}

export default MediaInfo;
