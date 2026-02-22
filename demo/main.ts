import {
	createPlayer,
	isSupported,
	LoggingControl,
	type MediaDataSource,
	type MSEPlayer,
	version,
} from "../src/mpegts";

const checkBoxFields = ["isLive", "withCredentials", "liveBufferLatencyChasing"];
let player: MSEPlayer | null = null;
let streamURL: HTMLElement;
let mediaSourceURL: HTMLElement;

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

function saveSettings(): void {
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

function playerLoadMds(mediaDataSource: MediaDataSource): void {
	const element = document.getElementsByName("videoElement")[0] as HTMLVideoElement;
	if (player != null) {
		player.unload();
		player.detachMediaElement();
		player.destroy();
		player = null;
	}
	player = createPlayer(mediaDataSource, {
		lazyLoadMaxDuration: 3 * 60,
		seekType: "range",
		liveBufferLatencyChasing: $input("liveBufferLatencyChasing").checked,
	});
	player.attachMediaElement(element);
	player.load();
}

function playerLoad(): void {
	console.log(`isSupported: ${isSupported()}`);
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

// Enter key handler for URL input
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
