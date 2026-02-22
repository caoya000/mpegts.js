import type { MediaConfig } from "../config";
import Browser from "../utils/browser";
import { IllegalStateException, RuntimeException } from "../utils/exception";
import Log from "../utils/logger";
import SpeedSampler from "./speed-sampler";

/**
 * Simplified, self-contained fetch loader that combines the responsibilities of
 * IOController (stash buffering, speed sampling, data dispatching),
 * FetchStreamLoader (fetch + ReadableStream pump loop), and
 * RangeSeekHandler (Range header construction) into a single class.
 *
 * Designed to be used as a data source for TSDemuxer via:
 *     source.onDataArrival = demuxer.parseChunks.bind(this);
 */

// ---- exported types --------------------------------------------------------

export interface DataSource {
	url: string;
	filesize?: number;
	cors?: boolean;
	withCredentials?: boolean;
	redirectedURL?: string;
	referrerPolicy?: ReferrerPolicy;
}

export const LoaderErrors = {
	OK: "OK",
	EXCEPTION: "Exception",
	HTTP_STATUS_CODE_INVALID: "HttpStatusCodeInvalid",
	CONNECTING_TIMEOUT: "ConnectingTimeout",
	EARLY_EOF: "EarlyEof",
	UNRECOVERABLE_EARLY_EOF: "UnrecoverableEarlyEof",
} as const;

export interface LoaderErrorInfo {
	code: number;
	msg: string;
}

// ---- internal types --------------------------------------------------------

interface LoaderRange {
	from: number;
	to: number;
}

enum LoaderStatus {
	kIdle = 0,
	kConnecting = 1,
	kBuffering = 2,
	kError = 3,
	kComplete = 4,
}

// ---- FetchLoader -----------------------------------------------------------

class FetchLoader {
	TAG = "FetchLoader";

	// --- public callbacks (set by consumer, e.g. TSDemuxer) ---
	onDataArrival: ((data: ArrayBuffer, byteStart: number) => number) | null;
	onSeeked: (() => void) | null;
	onError: ((type: string, info: LoaderErrorInfo) => void) | null;
	onComplete: ((extraData: unknown) => void) | null;
	onRedirect: ((redirectedURL: string) => void) | null;
	onRecoveredEarlyEof: (() => void) | null;
	onHLSDetected: (() => void) | null;

	// --- config / data source ---
	private _config: MediaConfig;
	private _dataSource: DataSource | null;
	private _extraData: unknown;

	// --- stash buffer ---
	private _stashInitialSize: number;
	private _stashUsed: number;
	private _stashSize: number;
	private _bufferSize: number;
	private _stashBuffer: ArrayBuffer | null;
	private _stashByteStart: number;
	private _enableStash: boolean;

	// --- range / length tracking ---
	private _currentRange: LoaderRange | null;
	private _refTotalLength: number | null;
	private _totalLength: number | null;
	private _fullRequestFlag: boolean;
	private _redirectedURL: string | null;

	// --- speed sampling ---
	private _speedSampler: SpeedSampler | null;
	private _speedNormalized: number;
	private _speedNormalizeList: number[];

	// --- reconnect ---
	private _isEarlyEofReconnecting: boolean;

	// --- pause / resume ---
	private _paused: boolean;
	private _resumeFrom: number;

	// --- fetch internals ---
	private _status: LoaderStatus;
	private _requestAbort: boolean;
	private _abortController: AbortController | null;
	private _contentLength: number | null;
	private _receivedLength: number;

	constructor(dataSource: DataSource, config: MediaConfig, extraData?: unknown) {
		this._config = config;
		this._dataSource = dataSource;
		this._extraData = extraData;

		// stash buffer setup
		this._stashInitialSize = 64 * 1024; // 64 KB default
		if (config.stashInitialSize !== undefined && config.stashInitialSize > 0) {
			this._stashInitialSize = config.stashInitialSize;
		}

		this._stashUsed = 0;
		this._stashSize = this._stashInitialSize;
		this._bufferSize = Math.max(this._stashSize, 1024 * 1024 * 3); // at least 3 MB
		this._stashBuffer = new ArrayBuffer(this._bufferSize);
		this._stashByteStart = 0;
		this._enableStash = config.enableStashBuffer !== false;

		// range / length
		this._currentRange = null;
		this._refTotalLength = dataSource.filesize ? dataSource.filesize : null;
		this._totalLength = this._refTotalLength;
		this._fullRequestFlag = false;
		this._redirectedURL = null;

		// speed
		this._speedSampler = new SpeedSampler();
		this._speedNormalized = 0;
		this._speedNormalizeList = [32, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096];

		// reconnect
		this._isEarlyEofReconnecting = false;

		// pause
		this._paused = false;
		this._resumeFrom = 0;

		// fetch state
		this._status = LoaderStatus.kIdle;
		this._requestAbort = false;
		this._abortController = null;
		this._contentLength = null;
		this._receivedLength = 0;

		// callbacks
		this.onDataArrival = null;
		this.onSeeked = null;
		this.onError = null;
		this.onComplete = null;
		this.onRedirect = null;
		this.onRecoveredEarlyEof = null;
		this.onHLSDetected = null;
	}

	destroy(): void {
		if (this.isWorking()) {
			this.abort();
		}

		this._dataSource = null;
		this._stashBuffer = null;
		this._stashUsed = this._stashSize = this._bufferSize = this._stashByteStart = 0;
		this._currentRange = null;
		this._speedSampler = null;
		this._status = LoaderStatus.kIdle;
		this._isEarlyEofReconnecting = false;

		this.onDataArrival = null;
		this.onSeeked = null;
		this.onError = null;
		this.onComplete = null;
		this.onRedirect = null;
		this.onRecoveredEarlyEof = null;
		this.onHLSDetected = null;

		this._extraData = null;
	}

	// --- public API ----------------------------------------------------------

	isWorking(): boolean {
		return (this._status === LoaderStatus.kConnecting || this._status === LoaderStatus.kBuffering) && !this._paused;
	}

	isPaused(): boolean {
		return this._paused;
	}

	get extraData(): unknown {
		return this._extraData;
	}

	set extraData(data: unknown) {
		this._extraData = data;
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

	/** Current download speed in KB/s. */
	get currentSpeed(): number {
		return this._speedSampler?.lastSecondKBps ?? 0;
	}

	get loaderType(): string {
		return "fetch-stream-loader";
	}

	// --- open / abort / pause / resume / seek --------------------------------

	open(optionalFrom?: number): void {
		this._currentRange = { from: 0, to: -1 };
		if (optionalFrom) {
			this._currentRange.from = optionalFrom;
		}

		this._speedSampler?.reset();
		if (!optionalFrom) {
			this._fullRequestFlag = true;
		}

		this._startFetch(Object.assign({}, this._currentRange));
	}

	abort(): void {
		this._abortFetch();

		if (this._paused) {
			this._paused = false;
			this._resumeFrom = 0;
		}
	}

	pause(): void {
		if (this.isWorking()) {
			this._abortFetch();

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

	// --- Range header construction (inlined RangeSeekHandler) ----------------

	private _buildRangeHeaders(url: string, range: LoaderRange): { url: string; headers: Record<string, string> } {
		const headers: Record<string, string> = {};

		if (range.from !== 0 || range.to !== -1) {
			let param: string;
			if (range.to !== -1) {
				param = `bytes=${range.from.toString()}-${range.to.toString()}`;
			} else {
				param = `bytes=${range.from.toString()}-`;
			}
			headers.Range = param;
		} else if (this._config.rangeLoadZeroStart) {
			headers.Range = "bytes=0-";
		}

		return { url, headers };
	}

	// --- fetch + ReadableStream logic (inlined FetchStreamLoader) ------------

	private _startFetch(range: LoaderRange): void {
		this._requestAbort = false;
		this._contentLength = null;
		this._receivedLength = 0;

		const dataSource = this._dataSource as DataSource;
		let sourceURL = dataSource.url;
		if (this._config.reuseRedirectedURL && dataSource.redirectedURL !== undefined) {
			sourceURL = dataSource.redirectedURL;
		}

		const seekConfig = this._buildRangeHeaders(sourceURL, range);

		const headers = new self.Headers();
		for (const key in seekConfig.headers) {
			if (Object.hasOwn(seekConfig.headers, key)) {
				headers.append(key, seekConfig.headers[key]);
			}
		}

		// additional headers from config
		if (typeof this._config.headers === "object" && this._config.headers) {
			for (const key in this._config.headers) {
				headers.append(key, this._config.headers[key]);
			}
		}

		const params: RequestInit = {
			method: "GET",
			headers: headers,
			mode: "cors",
			cache: "default",
			referrerPolicy: "no-referrer-when-downgrade",
		};

		if (dataSource.cors === false) {
			params.mode = "same-origin";
		}

		if (dataSource.withCredentials) {
			params.credentials = "include";
		}

		if (dataSource.referrerPolicy) {
			params.referrerPolicy = dataSource.referrerPolicy;
		}

		if (self.AbortController) {
			this._abortController = new self.AbortController();
			params.signal = this._abortController.signal;
		}

		this._status = LoaderStatus.kConnecting;

		self
			.fetch(seekConfig.url, params)
			.then((res: Response) => {
				if (this._requestAbort) {
					this._status = LoaderStatus.kIdle;
					res.body?.cancel();
					return;
				}

				if (res.ok && res.status >= 200 && res.status <= 299) {
					// detect HLS content-type before processing body
					const ct = res.headers.get("Content-Type")?.toLowerCase() ?? "";
					if (ct.includes("mpegurl") || ct.includes("m3u")) {
						res.body?.cancel();
						this._status = LoaderStatus.kIdle;
						this.onHLSDetected?.();
						return;
					}

					// detect redirect
					if (res.url !== seekConfig.url) {
						this._redirectedURL = res.url;
						if (this.onRedirect) {
							this.onRedirect(res.url);
						}
					}

					// content-length
					const lengthHeader = res.headers.get("Content-Length");
					if (lengthHeader != null) {
						const cl = parseInt(lengthHeader, 10);
						if (cl !== 0) {
							this._contentLength = cl;
							if (cl && this._fullRequestFlag) {
								this._totalLength = cl;
								this._fullRequestFlag = false;
							}
						}
					}

					return this._pump((res.body as ReadableStream<Uint8Array>).getReader(), range);
				} else {
					this._status = LoaderStatus.kError;
					const errInfo: LoaderErrorInfo = { code: res.status, msg: res.statusText };
					if (this.onError) {
						this._handleLoaderError(LoaderErrors.HTTP_STATUS_CODE_INVALID, errInfo);
					} else {
						throw new RuntimeException(`FetchLoader: Http code invalid, ${res.status} ${res.statusText}`);
					}
				}
			})
			.catch((e: unknown) => {
				if (this._abortController?.signal.aborted) {
					return;
				}

				this._status = LoaderStatus.kError;
				const err = e as Record<string, unknown>;
				const errInfo: LoaderErrorInfo = { code: -1, msg: String(err.message ?? "") };
				if (this.onError) {
					this._handleLoaderError(LoaderErrors.EXCEPTION, errInfo);
				} else {
					throw e;
				}
			});
	}

	private _pump(reader: ReadableStreamDefaultReader<Uint8Array>, range: LoaderRange): Promise<void> {
		return reader
			.read()
			.then((result: ReadableStreamReadResult<Uint8Array>) => {
				if (result.done) {
					if (this._contentLength !== null && this._receivedLength < this._contentLength) {
						this._status = LoaderStatus.kError;
						const info: LoaderErrorInfo = { code: -1, msg: "Fetch stream meet Early-EOF" };
						this._handleLoaderError(LoaderErrors.EARLY_EOF, info);
					} else {
						this._status = LoaderStatus.kComplete;
						this._onFetchComplete(range.from, range.from + this._receivedLength - 1);
					}
				} else {
					if (this._abortController?.signal.aborted) {
						this._status = LoaderStatus.kComplete;
						return;
					} else if (this._requestAbort === true) {
						this._status = LoaderStatus.kComplete;
						return reader.cancel() as unknown as undefined;
					}

					this._status = LoaderStatus.kBuffering;

					const chunk = result.value?.buffer as ArrayBuffer;
					const byteStart = range.from + this._receivedLength;
					this._receivedLength += chunk.byteLength;

					this._onFetchChunkArrival(chunk, byteStart);

					this._pump(reader, range);
				}
			})
			.catch((e: unknown) => {
				if (this._abortController?.signal.aborted) {
					this._status = LoaderStatus.kComplete;
					return;
				}

				const err = e as Record<string, unknown>;
				const errCode = typeof err.code === "number" ? err.code : -1;
				const errMsg = typeof err.message === "string" ? err.message : "";

				if (errCode === 11 && Browser.msedge) {
					// InvalidStateError on Microsoft Edge – ignore
					return;
				}

				this._status = LoaderStatus.kError;
				let type: string;
				let info: LoaderErrorInfo;

				if (
					(errCode === 19 || errMsg === "network error") &&
					(this._contentLength === null || (this._contentLength !== null && this._receivedLength < this._contentLength))
				) {
					type = LoaderErrors.EARLY_EOF;
					info = { code: errCode, msg: "Fetch stream meet Early-EOF" };
				} else {
					type = LoaderErrors.EXCEPTION;
					info = { code: errCode, msg: errMsg };
				}

				this._handleLoaderError(type, info);
			});
	}

	private _abortFetch(): void {
		this._requestAbort = true;

		if (this._status !== LoaderStatus.kBuffering || !Browser.chrome) {
			if (this._abortController) {
				try {
					this._abortController.abort();
				} catch (_e) {
					/* swallow */
				}
			}
		}
	}

	// --- internal seek -------------------------------------------------------

	/**
	 * @param dropUnconsumed - When true, discard all unconsumed stash data (user seek).
	 *                         When false, keep unconsumed data (reconnect after EarlyEof).
	 */
	private _internalSeek(bytes: number, dropUnconsumed: boolean): void {
		if (this._status === LoaderStatus.kConnecting || this._status === LoaderStatus.kBuffering) {
			this._abortFetch();
		}

		// flush stash before seeking
		this._flushStashBuffer(dropUnconsumed);

		const requestRange: LoaderRange = { from: bytes, to: -1 };
		this._currentRange = { from: requestRange.from, to: -1 };

		this._speedSampler?.reset();
		this._stashSize = this._stashInitialSize;

		this._requestAbort = false;
		this._startFetch(requestRange);

		if (this.onSeeked) {
			this.onSeeked();
		}
	}

	// --- stash buffer management (from IOController) -------------------------

	private _expandBuffer(expectedBytes: number): void {
		let bufferNewSize = this._stashSize;
		while (bufferNewSize + 1024 * 1024 * 1 < expectedBytes) {
			bufferNewSize *= 2;
		}

		bufferNewSize += 1024 * 1024 * 1; // stashSize + 1 MB
		if (bufferNewSize === this._bufferSize) {
			return;
		}

		const newBuffer = new ArrayBuffer(bufferNewSize);

		if (this._stashUsed > 0) {
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

		return list[last];
	}

	private _adjustStashSize(normalized: number): void {
		let stashSizeKB = 0;

		if (this._config.isLive) {
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

		const bufferSize = stashSizeKB * 1024 + 1024 * 1024 * 1; // stashSize + 1 MB
		if (this._bufferSize < bufferSize) {
			this._expandBuffer(bufferSize);
		}
		this._stashSize = stashSizeKB * 1024;
	}

	private _dispatchChunks(chunks: ArrayBuffer, byteStart: number): number {
		(this._currentRange as LoaderRange).to = byteStart + chunks.byteLength - 1;
		return this.onDataArrival?.(chunks, byteStart) ?? 0;
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

	// --- loader event handlers (bridge between fetch and stash) ---------------

	private _onFetchChunkArrival(chunk: ArrayBuffer, byteStart: number): void {
		if (!this.onDataArrival) {
			throw new IllegalStateException("FetchLoader: No existing consumer (onDataArrival) callback!");
		}
		if (this._paused) {
			return;
		}
		if (this._isEarlyEofReconnecting) {
			this._isEarlyEofReconnecting = false;
			if (this.onRecoveredEarlyEof) {
				this.onRecoveredEarlyEof();
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
			// stash disabled: dispatch directly, buffer only unconsumed bytes
			if (this._stashUsed === 0) {
				const consumed = this._dispatchChunks(chunk, byteStart);
				if (consumed < chunk.byteLength) {
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
				// merge chunk into stash, then dispatch
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
					const remainArray = new Uint8Array(this._stashBuffer as ArrayBuffer, consumed);
					stashArray.set(remainArray, 0);
				}
				this._stashUsed -= consumed;
				this._stashByteStart += consumed;
			}
		} else {
			// stash enabled: buffer until stashSize exceeded, then dispatch
			if (this._stashUsed === 0 && this._stashByteStart === 0) {
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
					// stash buffer empty but chunkSize > stashSize
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

	private _onFetchComplete(_from: number, _to: number): void {
		// force-flush stash buffer, drop unconsumed data
		this._flushStashBuffer(true);

		if (this.onComplete) {
			this.onComplete(this._extraData);
		}
	}

	private _handleLoaderError(type: string, data: LoaderErrorInfo): void {
		Log.e(this.TAG, `Loader error, code = ${data.code}, msg = ${data.msg}`);

		this._flushStashBuffer(false);

		if (this._isEarlyEofReconnecting) {
			this._isEarlyEofReconnecting = false;
			type = LoaderErrors.UNRECOVERABLE_EARLY_EOF;
		}

		switch (type) {
			case LoaderErrors.EARLY_EOF: {
				if (!this._config.isLive) {
					if (this._totalLength) {
						const nextFrom = (this._currentRange?.to ?? 0) + 1;
						if (nextFrom < this._totalLength) {
							Log.w(this.TAG, "Connection lost, trying reconnect...");
							this._isEarlyEofReconnecting = true;
							this._internalSeek(nextFrom, false);
						}
						return;
					}
				}
				type = LoaderErrors.UNRECOVERABLE_EARLY_EOF;
				break;
			}
			case LoaderErrors.UNRECOVERABLE_EARLY_EOF:
			case LoaderErrors.CONNECTING_TIMEOUT:
			case LoaderErrors.HTTP_STATUS_CODE_INVALID:
			case LoaderErrors.EXCEPTION:
				break;
		}

		if (this.onError) {
			this.onError(type, data);
		} else {
			throw new RuntimeException(`IOException: ${data.msg}`);
		}
	}
}

export default FetchLoader;
