import EventEmitter from "node:events";
import Log from "./logger";

/** Configuration for `mpegts.LoggingControl`. Retrieve with `getConfig()`, apply with `applyConfig()`. */
export interface LoggingConfig {
	/** Global log tag string. */
	globalTag: string;
	/** Force using the global tag for all log messages. */
	forceGlobalTag: boolean;
	/** Enable verbose level logging. */
	enableVerbose: boolean;
	/** Enable debug level logging. */
	enableDebug: boolean;
	/** Enable info level logging. */
	enableInfo: boolean;
	/** Enable warning level logging. */
	enableWarn: boolean;
	/** Enable error level logging. */
	enableError: boolean;
	/** Enable log callback (used internally by `addLogListener`). */
	enableCallback: boolean;
}

export type LoggingConfigChangeListener = (config: LoggingConfig) => void;
export type LogListener = (level: string, msg: string) => void;

const emitter: EventEmitter = new EventEmitter();

function _notifyChange(): void {
	if (emitter.listenerCount("change") > 0) {
		const config = getConfig();
		emitter.emit("change", config);
	}
}

function getConfig(): LoggingConfig {
	return {
		globalTag: Log.GLOBAL_TAG,
		forceGlobalTag: Log.FORCE_GLOBAL_TAG,
		enableVerbose: Log.ENABLE_VERBOSE,
		enableDebug: Log.ENABLE_DEBUG,
		enableInfo: Log.ENABLE_INFO,
		enableWarn: Log.ENABLE_WARN,
		enableError: Log.ENABLE_ERROR,
		enableCallback: Log.ENABLE_CALLBACK,
	};
}

function applyConfig(config: LoggingConfig): void {
	Log.GLOBAL_TAG = config.globalTag;
	Log.FORCE_GLOBAL_TAG = config.forceGlobalTag;
	Log.ENABLE_VERBOSE = config.enableVerbose;
	Log.ENABLE_DEBUG = config.enableDebug;
	Log.ENABLE_INFO = config.enableInfo;
	Log.ENABLE_WARN = config.enableWarn;
	Log.ENABLE_ERROR = config.enableError;
	Log.ENABLE_CALLBACK = config.enableCallback;
}

function registerListener(listener: LoggingConfigChangeListener): void {
	emitter.addListener("change", listener);
}

function removeListener(listener: LoggingConfigChangeListener): void {
	emitter.removeListener("change", listener);
}

function addLogListener(listener: LogListener): void {
	Log.emitter.addListener("log", listener);
	if (Log.emitter.listenerCount("log") > 0) {
		Log.ENABLE_CALLBACK = true;
		_notifyChange();
	}
}

function removeLogListener(listener: LogListener): void {
	Log.emitter.removeListener("log", listener);
	if (Log.emitter.listenerCount("log") === 0) {
		Log.ENABLE_CALLBACK = false;
		_notifyChange();
	}
}

const LoggingControl = {
	emitter,

	get forceGlobalTag(): boolean {
		return Log.FORCE_GLOBAL_TAG;
	},
	set forceGlobalTag(enable: boolean) {
		Log.FORCE_GLOBAL_TAG = enable;
		_notifyChange();
	},

	get globalTag(): string {
		return Log.GLOBAL_TAG;
	},
	set globalTag(tag: string) {
		Log.GLOBAL_TAG = tag;
		_notifyChange();
	},

	get enableAll(): boolean {
		return Log.ENABLE_VERBOSE && Log.ENABLE_DEBUG && Log.ENABLE_INFO && Log.ENABLE_WARN && Log.ENABLE_ERROR;
	},
	set enableAll(enable: boolean) {
		Log.ENABLE_VERBOSE = enable;
		Log.ENABLE_DEBUG = enable;
		Log.ENABLE_INFO = enable;
		Log.ENABLE_WARN = enable;
		Log.ENABLE_ERROR = enable;
		_notifyChange();
	},

	get enableDebug(): boolean {
		return Log.ENABLE_DEBUG;
	},
	set enableDebug(enable: boolean) {
		Log.ENABLE_DEBUG = enable;
		_notifyChange();
	},

	get enableVerbose(): boolean {
		return Log.ENABLE_VERBOSE;
	},
	set enableVerbose(enable: boolean) {
		Log.ENABLE_VERBOSE = enable;
		_notifyChange();
	},

	get enableInfo(): boolean {
		return Log.ENABLE_INFO;
	},
	set enableInfo(enable: boolean) {
		Log.ENABLE_INFO = enable;
		_notifyChange();
	},

	get enableWarn(): boolean {
		return Log.ENABLE_WARN;
	},
	set enableWarn(enable: boolean) {
		Log.ENABLE_WARN = enable;
		_notifyChange();
	},

	get enableError(): boolean {
		return Log.ENABLE_ERROR;
	},
	set enableError(enable: boolean) {
		Log.ENABLE_ERROR = enable;
		_notifyChange();
	},

	getConfig,
	applyConfig,
	_notifyChange,
	registerListener,
	removeListener,
	addLogListener,
	removeLogListener,
};

export default LoggingControl;
