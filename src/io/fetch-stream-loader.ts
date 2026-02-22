import type { MediaConfig } from "../config";
import Browser from "../utils/browser";
import { RuntimeException } from "../utils/exception";
import type { DataSource, LoaderRange, SeekHandler } from "./loader";
import { BaseLoader, LoaderErrors, LoaderStatus } from "./loader";

/* fetch + stream IO loader. Currently working on chrome 43+.
 * fetch provides a better alternative http API to XMLHttpRequest
 *
 * fetch spec   https://fetch.spec.whatwg.org/
 * stream spec  https://streams.spec.whatwg.org/
 */
class FetchStreamLoader extends BaseLoader {
	TAG: string;

	private _seekHandler: SeekHandler;
	private _config: MediaConfig;
	private _requestAbort: boolean;
	private _abortController: AbortController | null;
	private _contentLength: number | null;
	private _receivedLength: number;
	private _range!: LoaderRange;

	static isSupported(): boolean {
		try {
			// fetch + stream is broken on Microsoft Edge. Disable before build 15048.
			// see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8196907/
			// Fixed in Jan 10, 2017. Build 15048+ removed from blacklist.
			const isMsEdge = !!Browser.msedge;
			const isWorkWellEdge = isMsEdge && (Browser.version?.minor ?? 0) >= 15048;
			const browserNotBlacklisted = isMsEdge ? isWorkWellEdge : true;
			return typeof self.fetch === "function" && typeof self.ReadableStream === "function" && browserNotBlacklisted;
		} catch (_e) {
			return false;
		}
	}

	constructor(seekHandler: SeekHandler, config: MediaConfig) {
		super("fetch-stream-loader");
		this.TAG = "FetchStreamLoader";

		this._seekHandler = seekHandler;
		this._config = config;
		this._needStash = true;

		this._requestAbort = false;
		this._abortController = null;
		this._contentLength = null;
		this._receivedLength = 0;
	}

	destroy(): void {
		if (this.isWorking()) {
			this.abort();
		}
		super.destroy();
	}

	open(dataSource: DataSource, range: LoaderRange): void {
		this._range = range;

		let sourceURL = dataSource.url;
		if (this._config.reuseRedirectedURL && dataSource.redirectedURL !== undefined) {
			sourceURL = dataSource.redirectedURL;
		}

		const seekConfig = this._seekHandler.getConfig(sourceURL, range);

		const headers = new self.Headers();

		if (typeof seekConfig.headers === "object") {
			const configHeaders = seekConfig.headers;
			for (const key in configHeaders) {
				if (Object.hasOwn(configHeaders, key)) {
					headers.append(key, configHeaders[key]);
				}
			}
		}

		const params: RequestInit = {
			method: "GET",
			headers: headers,
			mode: "cors",
			cache: "default",
			// The default policy of Fetch API in the whatwg standard
			// Safari incorrectly indicates 'no-referrer' as default policy, fuck it
			referrerPolicy: "no-referrer-when-downgrade",
		};

		// add additional headers
		if (typeof this._config.headers === "object") {
			for (const key in this._config.headers) {
				headers.append(key, this._config.headers[key]);
			}
		}

		// cors is enabled by default
		if (dataSource.cors === false) {
			// no-cors means 'disregard cors policy', which can only be used in ServiceWorker
			params.mode = "same-origin";
		}

		// withCredentials is disabled by default
		if (dataSource.withCredentials) {
			params.credentials = "include";
		}

		// referrerPolicy from config
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
					if (res.url !== seekConfig.url) {
						if (this._onURLRedirect) {
							const redirectedURL = this._seekHandler.removeURLParameters(res.url);
							this._onURLRedirect(redirectedURL);
						}
					}

					const lengthHeader = res.headers.get("Content-Length");
					if (lengthHeader != null) {
						this._contentLength = parseInt(lengthHeader, 10);
						if (this._contentLength !== 0) {
							if (this._onContentLengthKnown) {
								this._onContentLengthKnown(this._contentLength);
							}
						}
					}

					return this._pump.call(this, (res.body as ReadableStream<Uint8Array>).getReader());
				} else {
					this._status = LoaderStatus.kError;
					if (this._onError) {
						this._onError(LoaderErrors.HTTP_STATUS_CODE_INVALID, {
							code: res.status,
							msg: res.statusText,
						});
					} else {
						throw new RuntimeException(`FetchStreamLoader: Http code invalid, ${res.status} ${res.statusText}`);
					}
				}
			})
			.catch((e: unknown) => {
				if (this._abortController?.signal.aborted) {
					return;
				}

				this._status = LoaderStatus.kError;
				const err = e as Record<string, unknown>;
				if (this._onError) {
					this._onError(LoaderErrors.EXCEPTION, { code: -1, msg: String(err.message ?? "") });
				} else {
					throw e;
				}
			});
	}

	abort(): void {
		this._requestAbort = true;

		if (this._status !== LoaderStatus.kBuffering || !Browser.chrome) {
			// Chrome may throw Exception-like things here, avoid using if is buffering
			if (this._abortController) {
				try {
					this._abortController.abort();
				} catch (_e) {}
			}
		}
	}

	private _pump(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
		// ReadableStreamReader
		return reader
			.read()
			.then((result: ReadableStreamReadResult<Uint8Array>) => {
				if (result.done) {
					// First check received length
					if (this._contentLength !== null && this._receivedLength < this._contentLength) {
						// Report Early-EOF
						this._status = LoaderStatus.kError;
						const type = LoaderErrors.EARLY_EOF;
						const info = { code: -1, msg: "Fetch stream meet Early-EOF" };
						if (this._onError) {
							this._onError(type, info);
						} else {
							throw new RuntimeException(info.msg);
						}
					} else {
						// OK. Download complete
						this._status = LoaderStatus.kComplete;
						if (this._onComplete) {
							this._onComplete(this._range.from, this._range.from + this._receivedLength - 1);
						}
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
					const byteStart = this._range.from + this._receivedLength;
					this._receivedLength += chunk.byteLength;

					if (this._onDataArrival) {
						this._onDataArrival(chunk, byteStart, this._receivedLength);
					}

					this._pump(reader);
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
					// InvalidStateError on Microsoft Edge
					// Workaround: Edge may throw InvalidStateError after ReadableStreamReader.cancel() call
					// Ignore the unknown exception.
					// Related issue: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11265202/
					return;
				}

				this._status = LoaderStatus.kError;
				let type: string = "";
				let info: { code: number; msg: string } | null = null;

				if (
					(errCode === 19 || errMsg === "network error") && // NETWORK_ERR
					(this._contentLength === null || (this._contentLength !== null && this._receivedLength < this._contentLength))
				) {
					type = LoaderErrors.EARLY_EOF;
					info = { code: errCode, msg: "Fetch stream meet Early-EOF" };
				} else {
					type = LoaderErrors.EXCEPTION;
					info = { code: errCode, msg: errMsg };
				}

				if (this._onError) {
					this._onError(type, info);
				} else {
					throw new RuntimeException(info.msg);
				}
			});
	}
}

export default FetchStreamLoader;
