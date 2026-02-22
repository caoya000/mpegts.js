import {
	createPlayer,
	Events,
	getFeatureList,
	LoggingControl,
	type MediaDataSource,
	type MSEPlayer,
	version,
} from "../src/mpegts";

// aribb24.js is loaded via CDN script tag
declare const aribb24js: {
	CanvasRenderer: new (options: Record<string, unknown>) => CanvasRendererInstance;
};

interface CanvasRendererInstance {
	attachMedia(element: HTMLVideoElement): void;
	show(): void;
	dispose(): void;
	pushData(pid: number, data: Uint8Array, pts: number): void;
	pushID3v2Data(pts: number, data: Uint8Array): void;
}

const checkBoxFields = ["isLive", "withCredentials", "liveSync"];
let player: MSEPlayer | null = null;
let captionRenderer: CanvasRendererInstance | null = null;
let superimposeRenderer: CanvasRendererInstance | null = null;
let streamURL: HTMLElement;
let mediaSourceURL: HTMLElement;
let aribCaptionTransmitMode: string;

function $(id: string): HTMLElement {
	return document.getElementById(id) as HTMLElement;
}

function $input(id: string): HTMLInputElement {
	return document.getElementById(id) as HTMLInputElement;
}

function lsGet(key: string, def: string): string {
	try {
		const ret = localStorage.getItem(`mpegts_demo.${key}`);
		if (ret !== null) return ret;
	} catch {}
	return def;
}

function lsSet(key: string, value: string): void {
	try {
		localStorage.setItem(`mpegts_demo.${key}`, value);
	} catch {}
}

function parseMalformedPES(data: Uint8Array): Uint8Array {
	const PES_header_data_length = data[2];
	const payload_start_index = 3 + PES_header_data_length;
	const payload_length = data.byteLength - payload_start_index;
	return data.subarray(payload_start_index, payload_start_index + payload_length);
}

function saveSettings(): void {
	if ($input("radio_private_stream_1").checked) {
		aribCaptionTransmitMode = "private_stream_1";
		lsSet("aribCaptionTransmitMode", "private_stream_1");
	} else if ($input("radio_timed_id3").checked) {
		aribCaptionTransmitMode = "timed_id3";
		lsSet("aribCaptionTransmitMode", "timed_id3");
	}

	if (mediaSourceURL.className === "") {
		lsSet("inputMode", "MediaDataSource");
	} else {
		lsSet("inputMode", "StreamURL");
	}
	for (const field of checkBoxFields) {
		lsSet(field, $input(field).checked ? "1" : "0");
	}
	lsSet("msURL", $input("msURL").value);
	lsSet("sURL", $input("sURL").value);
}

function loadSettings(): void {
	aribCaptionTransmitMode = lsGet("aribCaptionTransmitMode", "private_stream_1");
	if (aribCaptionTransmitMode === "timed_id3") {
		$input("radio_private_stream_1").checked = false;
		$input("radio_timed_id3").checked = true;
	}

	for (const field of checkBoxFields) {
		const checkbox = $input(field);
		checkbox.checked = lsGet(field, checkbox.checked ? "1" : "0") === "1";
	}
	$input("msURL").value = lsGet("msURL", $input("msURL").value);
	$input("sURL").value = lsGet("sURL", $input("sURL").value);
	if (lsGet("inputMode", "StreamURL") === "StreamURL") {
		switchToUrl();
	} else {
		switchToMds();
	}
}

function switchToUrl(): void {
	streamURL.className = "";
	mediaSourceURL.className = "hidden";
	saveSettings();
}

function switchToMds(): void {
	streamURL.className = "hidden";
	mediaSourceURL.className = "";
	saveSettings();
}

const aribRendererOptions = {
	forceStrokeColor: "black",
	normalFont: '"Windows TV MaruGothic", "Hiragino Maru Gothic Pro", "HGMaruGothicMPRO", "Yu Gothic Medium", sans-serif',
	gaijiFont: '"Windows TV MaruGothic", "Hiragino Maru Gothic Pro", "HGMaruGothicMPRO", "Yu Gothic Medium", sans-serif',
	drcsReplacement: true,
	useStrokeText: true,
};

interface PESPrivateData {
	stream_id: number;
	data: Uint8Array;
	pid: number;
	pts: number;
	nearest_pts: number;
}

interface TimedID3Data {
	pts: number;
	data: Uint8Array;
}

function playerLoadMds(mediaDataSource: MediaDataSource): void {
	const element = document.getElementsByName("videoElement")[0] as HTMLVideoElement;
	if (player) {
		player.unload();
		player.detachMediaElement();
		player.destroy();
		player = null;
	}
	if (captionRenderer) {
		captionRenderer.dispose();
		captionRenderer = null;
	}
	if (superimposeRenderer) {
		superimposeRenderer.dispose();
		superimposeRenderer = null;
	}

	player = createPlayer(mediaDataSource, {
		liveSync: $input("liveSync").checked,
	});
	player.attachMediaElement(element);
	player.load();

	captionRenderer = new aribb24js.CanvasRenderer({
		data_identifer: 0x80,
		...aribRendererOptions,
	});
	captionRenderer.attachMedia(element);
	captionRenderer.show();

	superimposeRenderer = new aribb24js.CanvasRenderer({
		data_identifer: 0x81,
		...aribRendererOptions,
	});
	superimposeRenderer.attachMedia(element);
	superimposeRenderer.show();

	player.on(Events.PES_PRIVATE_DATA_ARRIVED, (data: unknown) => {
		if (aribCaptionTransmitMode !== "private_stream_1") return;
		const d = data as PESPrivateData;
		if (d.stream_id === 0xbd && d.data[0] === 0x80) {
			captionRenderer?.pushData(d.pid, d.data, d.pts / 1000);
		} else if (d.stream_id === 0xbf) {
			let payload = d.data;
			if (payload[0] !== 0x81) {
				payload = parseMalformedPES(d.data);
			}
			if (payload[0] !== 0x81) return;
			superimposeRenderer?.pushData(d.pid, payload, d.nearest_pts / 1000);
		}
	});

	player.on(Events.TIMED_ID3_METADATA_ARRIVED, (data: unknown) => {
		if (aribCaptionTransmitMode !== "timed_id3") return;
		const d = data as TimedID3Data;
		captionRenderer?.pushID3v2Data(d.pts / 1000, d.data);
	});

	player.on(Events.ASYNCHRONOUS_KLV_METADATA_ARRIVED, (data: unknown) => {
		console.log("sync", data);
	});

	player.on(Events.PES_PRIVATE_DATA_DESCRIPTOR, (_data: unknown) => {
		// reserved for future use
	});
}

function playerLoad(): void {
	const featureList = getFeatureList();
	console.log(`isSupported: ${featureList.mseLivePlayback}`);
	if (mediaSourceURL.className === "") {
		const url = $input("msURL").value;
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.onload = () => {
			const mediaDataSource = JSON.parse(xhr.response) as MediaDataSource;
			playerLoadMds(mediaDataSource);
		};
		xhr.send();
	} else {
		const mediaDataSource: MediaDataSource = {
			type: "mse",
			isLive: $input("isLive").checked,
			withCredentials: $input("withCredentials").checked,
			url: $input("sURL").value,
		};
		console.log("MediaDataSource", mediaDataSource);
		playerLoadMds(mediaDataSource);
	}
}

function playerStart(): void {
	player?.play();
}

function playerPause(): void {
	player?.pause();
}

function playerDestroy(): void {
	if (player) {
		player.pause();
		player.unload();
		player.detachMediaElement();
		player.destroy();
		player = null;
	}
}

function playerSeekTo(): void {
	const input = document.getElementsByName("seekpoint")[0] as HTMLInputElement;
	if (player) player.currentTime = parseFloat(input.value);
}

// Expose functions for HTML onclick handlers
Object.assign(window, {
	player_load: playerLoad,
	player_start: playerStart,
	player_pause: playerPause,
	player_destroy: playerDestroy,
	player_seekto: playerSeekTo,
	switch_url: switchToUrl,
	switch_mds: switchToMds,
	saveSettings,
});

// Set up logging
const logcatbox = document.getElementsByName("logcatbox")[0] as HTMLTextAreaElement;
LoggingControl.addLogListener((_type: string, str: string) => {
	logcatbox.value = `${logcatbox.value + str}\n`;
	logcatbox.scrollTop = logcatbox.scrollHeight;
});

// Enter key handler
$input("sURL").onkeyup = (event) => {
	if (event.key === "Enter") {
		saveSettings();
		if (player) {
			player.unload();
			player.detachMediaElement();
			player.destroy();
			player = null;
		}
		playerLoad();
	}
};

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
	streamURL = $("streamURL");
	mediaSourceURL = $("mediaSourceURL");
	loadSettings();
	document.title = `${document.title} (v${version})`;
	playerLoad();
});
