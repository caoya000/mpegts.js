# @rtp2httpd/mpegts.js

HTML5 MPEG2-TS stream player written in TypeScript & JavaScript.

This is a fork of [mpegts.js](https://github.com/xqq/mpegts.js) tailored for [rtp2httpd](https://github.com/stackia/rtp2httpd), with a focus on smaller bundle size and modern tooling.

## Changes from upstream

- **Build system**: Migrated from webpack to Vite
- **Removed FLV support**: FLV demuxer / `NativePlayer` removed (MPEG-TS only)
- **Removed legacy IO loaders**: `MozChunkedLoader`, `MSStreamLoader`, `RangeLoader`, `WebSocketLoader` removed — only `FetchStreamLoader` is kept
- **Removed AV1 over MPEG-TS support**
- **Code formatting**: Reformatted with Prettier, cleaned up polyfills
- **Package manager**: Migrated from npm to pnpm

## Overview

mpegts.js works by transmuxing MPEG2-TS stream into ISO BMFF (Fragmented MP4) segments, followed by feeding mp4 segments into an HTML5 `<video>` element through [Media Source Extensions][] API.

[Media Source Extensions]: https://w3c.github.io/media-source/

## Features

- Playback for MPEG2-TS stream with H.264/H.265 + AAC codec transported in http(s)
- Extremely low latency of less than 1 second in the best case
- Playback for `.m2ts` file like BDAV/BDMV with 192 bytes TS packet, or 204 bytes TS packet
- Support handling dynamic codec parameters change (e.g. video resolution change)
- Support Chrome, Firefox, Safari, Edge or any Chromium-based browsers
- Support chasing latency automatically for internal buffer of HTMLMediaElement
- Low CPU overhead and low memory usage
- Support extracting PES private data (stream_type=0x06) like ARIB B24 subtitles (with [aribb24.js][])
- Support Timed ID3 Metadata (stream_type=0x15) callback (TIMED_ID3_METADATA_ARRIVED)

[aribb24.js]: https://github.com/monyone/aribb24.js

## Installation

```bash
pnpm add @rtp2httpd/mpegts.js
```

## Build

```bash
pnpm install
pnpm build
```

## Getting Started

```html
<script src="mpegts.js"></script>
<video id="videoElement"></video>
<script>
  if (mpegts.getFeatureList().mseLivePlayback) {
    var videoElement = document.getElementById("videoElement");
    var player = mpegts.createPlayer({
      type: "mse", // could also be mpegts, m2ts
      isLive: true,
      url: "http://example.com/live/livestream.ts",
    });
    player.attachMediaElement(videoElement);
    player.load();
    player.play();
  }
</script>
```

## License

```
Copyright (C) 2021 magicxqq. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
