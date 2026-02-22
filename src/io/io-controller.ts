import type { MediaConfig } from "../config";
import { IllegalStateException, InvalidArgumentException, RuntimeException } from "../utils/exception";
import Log from "../utils/logger";
import FetchStreamLoader from "./fetch-stream-loader";
import type { DataSource, LoaderErrorInfo, LoaderRange, SeekHandler } from "./loader";
import { type BaseLoader, LoaderErrors } from "./loader";
import ParamSeekHandler from "./param-seek-handler";
import RangeSeekHandler from "./range-seek-handler";
import SpeedSampler from "./speed-sampler";

/**
 * DataSource: {
 *     url: string,
 *     filesize: number,
 *     cors: boolean,
 *     withCredentials: boolean
 * }
 *
 */

export type OnIODataArrivalCallback = (chunks: ArrayBuffer, byteStart: number) => number;
export type OnIOSeekedCallback = () => void;
export type OnIOErrorCallback = (type: string, data: LoaderErrorInfo) => void;
export type OnIOCompleteCallback = (extraData: unknown) => void;
export type OnIORedirectCallback = (redirectedURL: string) => void;
export type OnIORecoveredEarlyEofCallback = () => void;

interface LoaderClass {
	new (seekHandler: SeekHandler, config: MediaConfig): BaseLoader;
	isSupported(): boolean;
}

// Manage IO Loaders
class IOController {
	TAG: string;

	private _config: MediaConfig;
	private _extraData: unknown;

	private _stashInitialSize: number;
	private _stashUsed: number;
	private _stashSize: number;
	private _bufferSize: number;
	private _stashBuffer: ArrayBuffer | null;
	private _stashByteStart: number;
	private _enableStash: boolean;

	private _loader: BaseLoader | null;
	private _loaderClass: LoaderClass | null;
	private _seekHandler: SeekHandler | null;

	private _dataSource: DataSource | null;
	private _refTotalLength: number | null;
	private _totalLength: number | null;
	private _fullRequestFlag: boolean;
	private _currentRange: LoaderRange | null;
	private _redirectedURL: string | null;

	private _speedNormalized: number;
	private _speedSampler: SpeedSampler | null;
	private _speedNormalizeList: number[];

	private _isEarlyEofReconnecting: boolean;

	private _paused: boolean;
	private _resumeFrom: number;

	private _onDataArrival: OnIODataArrivalCallback | null;
	private _onSeeked: OnIOSeekedCallback | null;
	private _onError: OnIOErrorCallback | null;
	private _onComplete: OnIOCompleteCallback | null;
	private _onRedirect: OnIORedirectCallback | null;
	private _onRecoveredEarlyEof: OnIORecoveredEarlyEofCallback | null;

	constructor(dataSource: DataSource, config: MediaConfig, extraData?: unknown) {
		this.TAG = "IOController";

		this._config = config;
		this._extraData = extraData;

		this._stashInitialSize = 64 * 1024; // default initial size: 64KB
		if (config.stashInitialSize !== undefined && config.stashInitialSize > 0) {
			// apply from config
			this._stashInitialSize = config.stashInitialSize;
		}

		this._stashUsed = 0;
		this._stashSize = this._stashInitialSize;
		this._bufferSize = Math.max(this._stashSize, 1024 * 1024 * 3); // initial size: 3MB at least
		this._stashBuffer = new ArrayBuffer(this._bufferSize);
		this._stashByteStart = 0;
		this._enableStash = true;
		if (config.enableStashBuffer === false) {
			this._enableStash = false;
		}

		this._loader = null;
		this._loaderClass = null;
		this._seekHandler = null;

		this._dataSource = dataSource;
		this._refTotalLength = dataSource.filesize ? dataSource.filesize : null;
		this._totalLength = this._refTotalLength;
		this._fullRequestFlag = false;
		this._currentRange = null;
		this._redirectedURL = null;

		this._speedNormalized = 0;
		this._speedSampler = new SpeedSampler();
		this._speedNormalizeList = [32, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096];

		this._isEarlyEofReconnecting = false;

		this._paused = false;
		this._resumeFrom = 0;

		this._onDataArrival = null;
		this._onSeeked = null;
		this._onError = null;
		this._onComplete = null;
		this._onRedirect = null;
		this._onRecoveredEarlyEof = null;

		this._selectSeekHandler();
		this._selectLoader();
		this._createLoader();
	}

	destroy(): void {
		if (this._loader?.isWorking()) {
			this._loader?.abort();
		}
		this._loader?.destroy();
		this._loader = null;
		this._loaderClass = null;
		this._dataSource = null;
		this._stashBuffer = null;
		this._stashUsed = this._stashSize = this._bufferSize = this._stashByteStart = 0;
		this._currentRange = null;
		this._speedSampler = null;

		this._isEarlyEofReconnecting = false;

		this._onDataArrival = null;
		this._onSeeked = null;
		this._onError = null;
		this._onComplete = null;
		this._onRedirect = null;
		this._onRecoveredEarlyEof = null;

		this._extraData = null;
	}

	isWorking(): boolean {
		return !!this._loader && this._loader.isWorking() && !this._paused;
	}

	isPaused(): boolean {
		return this._paused;
	}

	get status(): number {
		return this._loader?.status ?? 0;
	}

	get extraData(): unknown {
		return this._extraData;
	}

	set extraData(data: unknown) {
		this._extraData = data;
	}

	// prototype: function onDataArrival(chunks: ArrayBuffer, byteStart: number): number
	get onDataArrival(): OnIODataArrivalCallback | null {
		return this._onDataArrival;
	}

	set onDataArrival(callback: OnIODataArrivalCallback | null) {
		this._onDataArrival = callback;
	}

	get onSeeked(): OnIOSeekedCallback | null {
		return this._onSeeked;
	}

	set onSeeked(callback: OnIOSeekedCallback | null) {
		this._onSeeked = callback;
	}

	// prototype: function onError(type: string, info: {code: number, msg: string}): void
	get onError(): OnIOErrorCallback | null {
		return this._onError;
	}

	set onError(callback: OnIOErrorCallback | null) {
		this._onError = callback;
	}

	get onComplete(): OnIOCompleteCallback | null {
		return this._onComplete;
	}

	set onComplete(callback: OnIOCompleteCallback | null) {
		this._onComplete = callback;
	}

	get onRedirect(): OnIORedirectCallback | null {
		return this._onRedirect;
	}

	set onRedirect(callback: OnIORedirectCallback | null) {
		this._onRedirect = callback;
	}

	get onRecoveredEarlyEof(): OnIORecoveredEarlyEofCallback | null {
		return this._onRecoveredEarlyEof;
	}

	set onRecoveredEarlyEof(callback: OnIORecoveredEarlyEofCallback | null) {
		this._onRecoveredEarlyEof = callback;
	}

	get currentURL(): string {
		return this._dataSource?.url ?? "";
	}

	get hasRedirect(): boolean {
		return this._redirectedURL != null || this._dataSource?.redirectedURL !== undefined;
	}

	get currentRedirectedURL(): string | undefined {
		return this._redirectedURL || this._dataSource?.redirectedURL;
	}

	// in KB/s
	get currentSpeed(): number {
		return this._speedSampler?.lastSecondKBps ?? 0;
	}

	get loaderType(): string {
		return this._loader?.type ?? "";
	}

	private _selectSeekHandler(): void {
		const config = this._config;

		if (config.seekType === "range") {
			this._seekHandler = new RangeSeekHandler(this._config.rangeLoadZeroStart);
		} else if (config.seekType === "param") {
			const paramStart = config.seekParamStart || "bstart";
			const paramEnd = config.seekParamEnd || "bend";

			this._seekHandler = new ParamSeekHandler(paramStart, paramEnd);
		} else if (config.seekType === "custom") {
			if (typeof config.customSeekHandler !== "function") {
				throw new InvalidArgumentException("Custom seekType specified in config but invalid customSeekHandler!");
			}
			this._seekHandler = new (config.customSeekHandler as { new (): SeekHandler })();
		} else {
			throw new InvalidArgumentException(`Invalid seekType in config: ${config.seekType}`);
		}
	}

	private _selectLoader(): void {
		if (this._config.customLoader != null) {
			this._loaderClass = this._config.customLoader as LoaderClass;
		} else if (FetchStreamLoader.isSupported()) {
			this._loaderClass = FetchStreamLoader;
		} else {
			throw new RuntimeException("Your browser doesn't support xhr with arraybuffer responseType!");
		}
	}

	private _createLoader(): void {
		this._loader = new (this._loaderClass as LoaderClass)(this._seekHandler as SeekHandler, this._config);
		if (this._loader.needStashBuffer === false) {
			this._enableStash = false;
		}
		this._loader.onContentLengthKnown = this._onContentLengthKnown.bind(this);
		this._loader.onURLRedirect = this._onURLRedirect.bind(this);
		this._loader.onDataArrival = this._onLoaderChunkArrival.bind(this);
		this._loader.onComplete = this._onLoaderComplete.bind(this);
		this._loader.onError = this._onLoaderError.bind(this);
	}

	open(optionalFrom?: number): void {
		this._currentRange = { from: 0, to: -1 };
		if (optionalFrom) {
			this._currentRange.from = optionalFrom;
		}

		this._speedSampler?.reset();
		if (!optionalFrom) {
			this._fullRequestFlag = true;
		}

		this._loader?.open(this._dataSource as DataSource, Object.assign({}, this._currentRange));
	}

	abort(): void {
		this._loader?.abort();

		if (this._paused) {
			this._paused = false;
			this._resumeFrom = 0;
		}
	}

	pause(): void {
		if (this.isWorking()) {
			this._loader?.abort();

			if (this._stashUsed !== 0) {
				this._resumeFrom = this._stashByteStart;
				(this._currentRange as LoaderRange).to = this._stashByteStart - 1;
			} else {
				this._resumeFrom = (this._currentRange?.to ?? 0) + 1;
			}
			this._stashUsed = 0;
			this._stashByteStart = 0;
			this._paused = true;
		}
	}

	resume(): void {
		if (this._paused) {
			this._paused = false;
			const bytes = this._resumeFrom;
			this._resumeFrom = 0;
			this._internalSeek(bytes, true);
		}
	}

	seek(bytes: number): void {
		this._paused = false;
		this._stashUsed = 0;
		this._stashByteStart = 0;
		this._internalSeek(bytes, true);
	}

	/**
	 * When seeking request is from media seeking, unconsumed stash data should be dropped
	 * However, stash data shouldn't be dropped if seeking requested from http reconnection
	 *
	 * @dropUnconsumed: Ignore and discard all unconsumed data in stash buffer
	 */
	private _internalSeek(bytes: number, dropUnconsumed: boolean): void {
		if (this._loader?.isWorking()) {
			this._loader?.abort();
		}

		// dispatch & flush stash buffer before seek
		this._flushStashBuffer(dropUnconsumed);

		this._loader?.destroy();
		this._loader = null;

		const requestRange: LoaderRange = { from: bytes, to: -1 };
		this._currentRange = { from: requestRange.from, to: -1 };

		this._speedSampler?.reset();
		this._stashSize = this._stashInitialSize;
		this._createLoader();
		const newLoader = this._loader as BaseLoader | null;
		if (newLoader) {
			newLoader.open(this._dataSource as DataSource, requestRange);
		}

		if (this._onSeeked) {
			this._onSeeked();
		}
	}

	updateUrl(url: string): void {
		if (!url || typeof url !== "string" || url.length === 0) {
			throw new InvalidArgumentException("Url must be a non-empty string!");
		}

		(this._dataSource as DataSource).url = url;

		// TODO: replace with new url
	}

	private _expandBuffer(expectedBytes: number): void {
		let bufferNewSize = this._stashSize;
		while (bufferNewSize + 1024 * 1024 * 1 < expectedBytes) {
			bufferNewSize *= 2;
		}

		bufferNewSize += 1024 * 1024 * 1; // bufferSize = stashSize + 1MB
		if (bufferNewSize === this._bufferSize) {
			return;
		}

		const newBuffer = new ArrayBuffer(bufferNewSize);

		if (this._stashUsed > 0) {
			// copy existing data into new buffer
			const stashOldArray = new Uint8Array(this._stashBuffer as ArrayBuffer, 0, this._stashUsed);
			const stashNewArray = new Uint8Array(newBuffer, 0, bufferNewSize);
			stashNewArray.set(stashOldArray, 0);
		}

		this._stashBuffer = newBuffer;
		this._bufferSize = bufferNewSize;
	}

	private _normalizeSpeed(input: number): number {
		const list = this._speedNormalizeList;
		const last = list.length - 1;
		let mid = 0;
		let lbound = 0;
		let ubound = last;

		if (input < list[0]) {
			return list[0];
		}

		// binary search
		while (lbound <= ubound) {
			mid = lbound + Math.floor((ubound - lbound) / 2);
			if (mid === last || (input >= list[mid] && input < list[mid + 1])) {
				return list[mid];
			} else if (list[mid] < input) {
				lbound = mid + 1;
			} else {
				ubound = mid - 1;
			}
		}

		// Fallback: return the last element if binary search doesn't return within the loop
		return list[last];
	}

	private _adjustStashSize(normalized: number): void {
		let stashSizeKB = 0;

		if (this._config.isLive) {
			// live stream: always use 1/8 normalized speed for size of stashSizeKB
			stashSizeKB = normalized / 8;
		} else {
			if (normalized < 512) {
				stashSizeKB = normalized;
			} else if (normalized >= 512 && normalized <= 1024) {
				stashSizeKB = Math.floor(normalized * 1.5);
			} else {
				stashSizeKB = normalized * 2;
			}
		}

		if (stashSizeKB > 8192) {
			stashSizeKB = 8192;
		}

		const bufferSize = stashSizeKB * 1024 + 1024 * 1024 * 1; // stashSize + 1MB
		if (this._bufferSize < bufferSize) {
			this._expandBuffer(bufferSize);
		}
		this._stashSize = stashSizeKB * 1024;
	}

	private _dispatchChunks(chunks: ArrayBuffer, byteStart: number): number {
		(this._currentRange as LoaderRange).to = byteStart + chunks.byteLength - 1;
		return this._onDataArrival?.(chunks, byteStart) ?? 0;
	}

	private _onURLRedirect(redirectedURL: string): void {
		this._redirectedURL = redirectedURL;
		if (this._onRedirect) {
			this._onRedirect(redirectedURL);
		}
	}

	private _onContentLengthKnown(contentLength: number): void {
		if (contentLength && this._fullRequestFlag) {
			this._totalLength = contentLength;
			this._fullRequestFlag = false;
		}
	}

	private _onLoaderChunkArrival(chunk: ArrayBuffer, byteStart: number, _receivedLength: number): void {
		if (!this._onDataArrival) {
			throw new IllegalStateException("IOController: No existing consumer (onDataArrival) callback!");
		}
		if (this._paused) {
			return;
		}
		if (this._isEarlyEofReconnecting) {
			// Auto-reconnect for EarlyEof succeed, notify to upper-layer by callback
			this._isEarlyEofReconnecting = false;
			if (this._onRecoveredEarlyEof) {
				this._onRecoveredEarlyEof();
			}
		}

		this._speedSampler?.addBytes(chunk.byteLength);

		// adjust stash buffer size according to network speed dynamically
		const KBps = this._speedSampler?.lastSecondKBps ?? 0;
		if (KBps !== 0) {
			const normalized = this._normalizeSpeed(KBps);
			if (this._speedNormalized !== normalized) {
				this._speedNormalized = normalized;
				this._adjustStashSize(normalized);
			}
		}

		if (!this._enableStash) {
			// disable stash
			if (this._stashUsed === 0) {
				// dispatch chunk directly to consumer;
				// check ret value (consumed bytes) and stash unconsumed to stashBuffer
				const consumed = this._dispatchChunks(chunk, byteStart);
				if (consumed < chunk.byteLength) {
					// unconsumed data remain.
					const remain = chunk.byteLength - consumed;
					if (remain > this._bufferSize) {
						this._expandBuffer(remain);
					}
					const stashArray = new Uint8Array(this._stashBuffer as ArrayBuffer, 0, this._bufferSize);
					stashArray.set(new Uint8Array(chunk, consumed), 0);
					this._stashUsed += remain;
					this._stashByteStart = byteStart + consumed;
				}
			} else {
				// else: Merge chunk into stashBuffer, and dispatch stashBuffer to consumer.
				if (this._stashUsed + chunk.byteLength > this._bufferSize) {
					this._expandBuffer(this._stashUsed + chunk.byteLength);
				}
				const stashArray = new Uint8Array(this._stashBuffer as ArrayBuffer, 0, this._bufferSize);
				stashArray.set(new Uint8Array(chunk), this._stashUsed);
				this._stashUsed += chunk.byteLength;
				const consumed = this._dispatchChunks(
					(this._stashBuffer as ArrayBuffer).slice(0, this._stashUsed),
					this._stashByteStart,
				);
				if (consumed < this._stashUsed && consumed > 0) {
					// unconsumed data remain
					const remainArray = new Uint8Array(this._stashBuffer as ArrayBuffer, consumed);
					stashArray.set(remainArray, 0);
				}
				this._stashUsed -= consumed;
				this._stashByteStart += consumed;
			}
		} else {
			// enable stash
			if (this._stashUsed === 0 && this._stashByteStart === 0) {
				// seeked? or init chunk?
				// This is the first chunk after seek action
				this._stashByteStart = byteStart;
			}
			if (this._stashUsed + chunk.byteLength <= this._stashSize) {
				// just stash
				const stashArray = new Uint8Array(this._stashBuffer as ArrayBuffer, 0, this._stashSize);
				stashArray.set(new Uint8Array(chunk), this._stashUsed);
				this._stashUsed += chunk.byteLength;
			} else {
				// stashUsed + chunkSize > stashSize, size limit exceeded
				let stashArray = new Uint8Array(this._stashBuffer as ArrayBuffer, 0, this._bufferSize);
				if (this._stashUsed > 0) {
					// There're stash datas in buffer
					// dispatch the whole stashBuffer, and stash remain data
					// then append chunk to stashBuffer (stash)
					const buffer = (this._stashBuffer as ArrayBuffer).slice(0, this._stashUsed);
					const consumed = this._dispatchChunks(buffer, this._stashByteStart);
					if (consumed < buffer.byteLength) {
						if (consumed > 0) {
							const remainArray = new Uint8Array(buffer, consumed);
							stashArray.set(remainArray, 0);
							this._stashUsed = remainArray.byteLength;
							this._stashByteStart += consumed;
						}
					} else {
						this._stashUsed = 0;
						this._stashByteStart += consumed;
					}
					if (this._stashUsed + chunk.byteLength > this._bufferSize) {
						this._expandBuffer(this._stashUsed + chunk.byteLength);
						stashArray = new Uint8Array(this._stashBuffer as ArrayBuffer, 0, this._bufferSize);
					}
					stashArray.set(new Uint8Array(chunk), this._stashUsed);
					this._stashUsed += chunk.byteLength;
				} else {
					// stash buffer empty, but chunkSize > stashSize (oh, holy shit)
					// dispatch chunk directly and stash remain data
					const consumed = this._dispatchChunks(chunk, byteStart);
					if (consumed < chunk.byteLength) {
						const remain = chunk.byteLength - consumed;
						if (remain > this._bufferSize) {
							this._expandBuffer(remain);
							stashArray = new Uint8Array(this._stashBuffer as ArrayBuffer, 0, this._bufferSize);
						}
						stashArray.set(new Uint8Array(chunk, consumed), 0);
						this._stashUsed += remain;
						this._stashByteStart = byteStart + consumed;
					}
				}
			}
		}
	}

	private _flushStashBuffer(dropUnconsumed: boolean): number {
		if (this._stashUsed > 0) {
			const buffer = (this._stashBuffer as ArrayBuffer).slice(0, this._stashUsed);
			const consumed = this._dispatchChunks(buffer, this._stashByteStart);
			const remain = buffer.byteLength - consumed;

			if (consumed < buffer.byteLength) {
				if (dropUnconsumed) {
					Log.w(this.TAG, `${remain} bytes unconsumed data remain when flush buffer, dropped`);
				} else {
					if (consumed > 0) {
						const stashArray = new Uint8Array(this._stashBuffer as ArrayBuffer, 0, this._bufferSize);
						const remainArray = new Uint8Array(buffer, consumed);
						stashArray.set(remainArray, 0);
						this._stashUsed = remainArray.byteLength;
						this._stashByteStart += consumed;
					}
					return 0;
				}
			}
			this._stashUsed = 0;
			this._stashByteStart = 0;
			return remain;
		}
		return 0;
	}

	private _onLoaderComplete(_from: number, _to: number): void {
		// Force-flush stash buffer, and drop unconsumed data
		this._flushStashBuffer(true);

		if (this._onComplete) {
			this._onComplete(this._extraData);
		}
	}

	private _onLoaderError(type: string, data: LoaderErrorInfo): void {
		Log.e(this.TAG, `Loader error, code = ${data.code}, msg = ${data.msg}`);

		this._flushStashBuffer(false);

		if (this._isEarlyEofReconnecting) {
			// Auto-reconnect for EarlyEof failed, throw UnrecoverableEarlyEof error to upper-layer
			this._isEarlyEofReconnecting = false;
			type = LoaderErrors.UNRECOVERABLE_EARLY_EOF;
		}

		switch (type) {
			case LoaderErrors.EARLY_EOF: {
				if (!this._config.isLive) {
					// Do internal http reconnect if not live stream
					if (this._totalLength) {
						const nextFrom = (this._currentRange?.to ?? 0) + 1;
						if (nextFrom < this._totalLength) {
							Log.w(this.TAG, "Connection lost, trying reconnect...");
							this._isEarlyEofReconnecting = true;
							this._internalSeek(nextFrom, false);
						}
						return;
					}
					// else: We don't know totalLength, throw UnrecoverableEarlyEof
				}
				// live stream: throw UnrecoverableEarlyEof error to upper-layer
				type = LoaderErrors.UNRECOVERABLE_EARLY_EOF;
				break;
			}
			case LoaderErrors.UNRECOVERABLE_EARLY_EOF:
			case LoaderErrors.CONNECTING_TIMEOUT:
			case LoaderErrors.HTTP_STATUS_CODE_INVALID:
			case LoaderErrors.EXCEPTION:
				break;
		}

		if (this._onError) {
			this._onError(type, data);
		} else {
			throw new RuntimeException(`IOException: ${data.msg}`);
		}
	}
}

export default IOController;
