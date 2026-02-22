export const LoaderStatus = {
	kIdle: 0,
	kConnecting: 1,
	kBuffering: 2,
	kError: 3,
	kComplete: 4,
} as const;

export const LoaderErrors = {
	OK: "OK",
	EXCEPTION: "Exception",
	HTTP_STATUS_CODE_INVALID: "HttpStatusCodeInvalid",
	CONNECTING_TIMEOUT: "ConnectingTimeout",
	EARLY_EOF: "EarlyEof",
	UNRECOVERABLE_EARLY_EOF: "UnrecoverableEarlyEof",
} as const;

export interface LoaderRange {
	from: number;
	to: number;
}

export interface DataSource {
	url: string;
	filesize?: number;
	cors?: boolean;
	withCredentials?: boolean;
	redirectedURL?: string;
	referrerPolicy?: ReferrerPolicy;
}

export interface SeekConfig {
	url: string;
	headers: Record<string, string>;
}

export interface SeekHandler {
	getConfig(url: string, range: LoaderRange): SeekConfig;
	removeURLParameters(seekedURL: string): string;
}

export interface LoaderErrorInfo {
	code: number;
	msg: string;
}

export type OnContentLengthKnownCallback = (contentLength: number) => void;
export type OnURLRedirectCallback = (url: string) => void;
export type OnDataArrivalCallback = (chunk: ArrayBuffer, byteStart: number, receivedLength: number) => void;
export type OnLoaderErrorCallback = (errorType: string, errorInfo: LoaderErrorInfo) => void;
export type OnCompleteCallback = (rangeFrom: number, rangeTo: number) => void;

/* Loader has callbacks which have following prototypes:
 *     function onContentLengthKnown(contentLength: number): void
 *     function onURLRedirect(url: string): void
 *     function onDataArrival(chunk: ArrayBuffer, byteStart: number, receivedLength: number): void
 *     function onError(errorType: string, errorInfo: {code: number, msg: string}): void
 *     function onComplete(rangeFrom: number, rangeTo: number): void
 */
export abstract class BaseLoader {
	_type: string;
	_status: number;
	_needStash: boolean;
	_onContentLengthKnown: OnContentLengthKnownCallback | null;
	_onURLRedirect: OnURLRedirectCallback | null;
	_onDataArrival: OnDataArrivalCallback | null;
	_onError: OnLoaderErrorCallback | null;
	_onComplete: OnCompleteCallback | null;

	constructor(typeName: string) {
		this._type = typeName || "undefined";
		this._status = LoaderStatus.kIdle;
		this._needStash = false;
		// callbacks
		this._onContentLengthKnown = null;
		this._onURLRedirect = null;
		this._onDataArrival = null;
		this._onError = null;
		this._onComplete = null;
	}

	destroy(): void {
		this._status = LoaderStatus.kIdle;
		this._onContentLengthKnown = null;
		this._onURLRedirect = null;
		this._onDataArrival = null;
		this._onError = null;
		this._onComplete = null;
	}

	isWorking(): boolean {
		return this._status === LoaderStatus.kConnecting || this._status === LoaderStatus.kBuffering;
	}

	get type(): string {
		return this._type;
	}

	get status(): number {
		return this._status;
	}

	get needStashBuffer(): boolean {
		return this._needStash;
	}

	get onContentLengthKnown(): OnContentLengthKnownCallback | null {
		return this._onContentLengthKnown;
	}

	set onContentLengthKnown(callback: OnContentLengthKnownCallback | null) {
		this._onContentLengthKnown = callback;
	}

	get onURLRedirect(): OnURLRedirectCallback | null {
		return this._onURLRedirect;
	}

	set onURLRedirect(callback: OnURLRedirectCallback | null) {
		this._onURLRedirect = callback;
	}

	get onDataArrival(): OnDataArrivalCallback | null {
		return this._onDataArrival;
	}

	set onDataArrival(callback: OnDataArrivalCallback | null) {
		this._onDataArrival = callback;
	}

	get onError(): OnLoaderErrorCallback | null {
		return this._onError;
	}

	set onError(callback: OnLoaderErrorCallback | null) {
		this._onError = callback;
	}

	get onComplete(): OnCompleteCallback | null {
		return this._onComplete;
	}

	set onComplete(callback: OnCompleteCallback | null) {
		this._onComplete = callback;
	}

	// pure virtual
	abstract open(dataSource: DataSource, range: LoaderRange): void;

	abstract abort(): void;
}
