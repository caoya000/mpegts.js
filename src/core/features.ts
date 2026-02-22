import { createDefaultConfig } from "../config";
import IOController from "../io/io-controller";
import type { DataSource } from "../io/loader";

/** Browser feature detection results returned by `mpegts.getFeatureList()`. */
export interface FeatureList {
	/** Whether basic MSE playback works in this browser. Same as `mpegts.isSupported()`. */
	msePlayback: boolean;
	/** Whether HTTP MPEG2-TS live stream can work in this browser. */
	mseLivePlayback: boolean;
	/** Whether H.265 over MPEG2-TS stream can work in this browser. */
	mseH265Playback: boolean;
	/** Whether the network loader is streaming. */
	networkStreamIO: boolean;
	/** The network loader type name. */
	networkLoaderName: string;
	/** Whether this browser supports H.264 MP4 video natively. */
	nativeMP4H264Playback: boolean;
	/** Whether this browser supports H.265 MP4 video natively. */
	nativeMP4H265Playback: boolean;
	/** Whether this browser supports WebM VP8 video natively. */
	nativeWebmVP8Playback: boolean;
	/** Whether this browser supports WebM VP9 video natively. */
	nativeWebmVP9Playback: boolean;
}

let videoElement: HTMLVideoElement | undefined;

function supportMSEH264Playback(): boolean {
	const avc_aac_mime_type = 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"';
	const support_w3c_mse = (self as unknown as Record<string, unknown>).MediaSource as
		| { isTypeSupported?: (type: string) => boolean }
		| undefined;
	const support_apple_mme = (self as unknown as Record<string, unknown>).ManagedMediaSource as
		| { isTypeSupported?: (type: string) => boolean }
		| undefined;
	return !!(
		support_w3c_mse?.isTypeSupported?.(avc_aac_mime_type) || support_apple_mme?.isTypeSupported?.(avc_aac_mime_type)
	);
}

function supportMSEH265Playback(): boolean {
	const hevc_mime_type = 'video/mp4; codecs="hvc1.1.6.L93.B0"';
	const support_w3c_mse = (self as unknown as Record<string, unknown>).MediaSource as
		| { isTypeSupported?: (type: string) => boolean }
		| undefined;
	const support_apple_mme = (self as unknown as Record<string, unknown>).ManagedMediaSource as
		| { isTypeSupported?: (type: string) => boolean }
		| undefined;
	return !!(support_w3c_mse?.isTypeSupported?.(hevc_mime_type) || support_apple_mme?.isTypeSupported?.(hevc_mime_type));
}

function supportNetworkStreamIO(): boolean {
	const ioctl = new IOController({} as DataSource, createDefaultConfig());
	const loaderType = ioctl.loaderType;
	ioctl.destroy();
	return loaderType === "fetch-stream-loader" || loaderType === "xhr-moz-chunked-loader";
}

function getNetworkLoaderTypeName(): string {
	const ioctl = new IOController({} as DataSource, createDefaultConfig());
	const loaderType = ioctl.loaderType;
	ioctl.destroy();
	return loaderType;
}

function supportNativeMediaPlayback(mimeType: string): boolean {
	if (videoElement === undefined) {
		videoElement = window.document.createElement("video");
	}
	const canPlay = videoElement.canPlayType(mimeType);
	return canPlay === "probably" || canPlay === "maybe";
}

function getFeatureList(): FeatureList {
	const features: FeatureList = {
		msePlayback: false,
		mseLivePlayback: false,
		mseH265Playback: false,
		networkStreamIO: false,
		networkLoaderName: "",
		nativeMP4H264Playback: false,
		nativeMP4H265Playback: false,
		nativeWebmVP8Playback: false,
		nativeWebmVP9Playback: false,
	};

	features.msePlayback = supportMSEH264Playback();
	features.networkStreamIO = supportNetworkStreamIO();
	features.networkLoaderName = getNetworkLoaderTypeName();
	features.mseLivePlayback = features.msePlayback && features.networkStreamIO;
	features.mseH265Playback = supportMSEH265Playback();
	features.nativeMP4H264Playback = supportNativeMediaPlayback('video/mp4; codecs="avc1.42001E, mp4a.40.2"');
	features.nativeMP4H265Playback = supportNativeMediaPlayback('video/mp4; codecs="hvc1.1.6.L93.B0"');
	features.nativeWebmVP8Playback = supportNativeMediaPlayback('video/webm; codecs="vp8.0, vorbis"');
	features.nativeWebmVP9Playback = supportNativeMediaPlayback('video/webm; codecs="vp9"');

	return features;
}

const Features = {
	videoElement,
	supportMSEH264Playback,
	supportMSEH265Playback,
	supportNetworkStreamIO,
	getNetworkLoaderTypeName,
	supportNativeMediaPlayback,
	getFeatureList,
};

export default Features;
