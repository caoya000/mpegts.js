import type { FeatureList } from "./core/features";
import Features from "./core/features";
import MediaInfo from "./core/media-info";
import type {
	DataSource,
	LoaderErrorInfo,
	LoaderRange,
	OnCompleteCallback,
	OnContentLengthKnownCallback,
	OnDataArrivalCallback,
	OnLoaderErrorCallback,
	OnURLRedirectCallback,
} from "./io/loader";
import { BaseLoader, LoaderErrors, LoaderStatus } from "./io/loader";
import MSEPlayer from "./player/mse-player";
import { ErrorDetails, ErrorTypes } from "./player/player-errors";
import PlayerEvents from "./player/player-events";
import { InvalidArgumentException } from "./utils/exception";
import type { LoggingConfig } from "./utils/logging-control";
import LoggingControl from "./utils/logging-control";

/**
 * Create a player instance according to `type` field in `mediaDataSource`.
 * @param mediaDataSource - Media data source descriptor. Must contain a `type` field (`'mse'`, `'mpegts'`, or `'m2ts'`).
 * @param optionalConfig - Optional player configuration. See {@link MediaConfig} for available options.
 */
function createPlayer(mediaDataSource: Record<string, unknown>, optionalConfig?: Record<string, unknown>): MSEPlayer {
	const mds = mediaDataSource;
	if (mds == null || typeof mds !== "object") {
		throw new InvalidArgumentException("MediaDataSource must be an javascript object!");
	}

	if (!Object.hasOwn(mds, "type")) {
		throw new InvalidArgumentException("MediaDataSource must has type field to indicate video file type!");
	}

	switch (mds.type) {
		case "mse":
		case "mpegts":
		case "m2ts":
			return new MSEPlayer(mds, optionalConfig);
		default:
			throw new Error("NativePlayer is explicitly disabled");
	}
}

/** Return `true` if basic MSE playback is supported in the current browser. */
function isSupported(): boolean {
	return Features.supportMSEH264Playback();
}

/** Return a {@link FeatureList} describing browser capabilities for media playback. */
function getFeatureList(): FeatureList {
	return Features.getFeatureList();
}

/** Library version string, injected at build time. */
const version: string = __VERSION__;

/** Player events enum. Use with `player.on()` / `player.off()`. */
const Events = PlayerEvents;

export {
	createPlayer,
	isSupported,
	getFeatureList,
	version,
	BaseLoader,
	LoaderStatus,
	LoaderErrors,
	Events,
	ErrorTypes,
	ErrorDetails,
	MSEPlayer,
	LoggingControl,
	MediaInfo,
};

export type {
	FeatureList,
	LoggingConfig,
	DataSource,
	LoaderRange,
	LoaderErrorInfo,
	OnContentLengthKnownCallback,
	OnURLRedirectCallback,
	OnDataArrivalCallback,
	OnLoaderErrorCallback,
	OnCompleteCallback,
};
