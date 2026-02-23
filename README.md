# @rtp2httpd/mpegts.js

HTML5 MPEG2-TS stream player written in TypeScript & JavaScript.

This is a fork of [mpegts.js](https://github.com/xqq/mpegts.js) tailored for [rtp2httpd](https://github.com/stackia/rtp2httpd), with a focus on smaller bundle size and modern tooling.

## Changes from upstream

### Full TypeScript rewrite

All source code has been migrated from JavaScript to TypeScript with strict type checking. Type declarations are auto-generated via `vite-plugin-dts`.

### MP2 software decoding

Added MP2 (MPEG Audio Layer 2) software decoding pipeline for broadcast streams (e.g. DVB, ISDB) that use MP2 audio — which browsers do not natively support via MSE.

- **minimp3 WASM decoder**: Custom Emscripten build of [minimp3](https://github.com/lieff/minimp3) (CC0 license), ~18KB binary with Layer 3 stripped
- **Web Worker decoding**: MP2 frames are decoded in a Web Worker to avoid blocking the main thread
- **PCMAudioPlayer**: Web Audio API based player with drift-based A/V sync, seek support, discontinuity handling, and iOS Silent Mode bypass
- Configuration: set `config.wasmDecoders.mp2` to the URL of `mp2_decoder.wasm`

### HLS support

- Auto-detects HLS streams via Content-Type header inspection (M3U8)
- Sequential multi-segment playback with seamless segment switching
- Unified `createPlayer()` API handles both MPEG-TS (MSE) and HLS (native) transparently

### Build & tooling modernization

- **Build system**: Migrated from webpack to Vite
- **Linting**: Migrated from Prettier to Biome
- **Package manager**: Migrated from npm to pnpm
- **ESM-first**: `type: "module"` in package.json, named exports instead of namespace
- **Worker inline embedding**: Transmux worker embedded as inline blob, no separate file needed

### Simplified API

- Single-instance player lifecycle with cached mpegts/HLS implementations
- `PlayerConfig` unified (removed separate `MediaConfig` and `isLive` flag)
- Multi-segment playback via `player.loadSegments()`
- Configurable live latency chasing (`liveSync`, `liveSyncTargetLatency`, etc.)

### Removed features (for smaller bundle size)

- FLV demuxer and `NativePlayer`
- AV1 over MPEG-TS
- Legacy IO loaders (`MozChunkedLoader`, `MSStreamLoader`, `RangeLoader`, `WebSocketLoader`) — only `FetchStreamLoader` is kept
- Dead code: unused seek chain, VOD reconnection, stash buffer, speed sampler

## Overview

mpegts.js works by transmuxing MPEG2-TS stream into ISO BMFF (Fragmented MP4) segments, followed by feeding mp4 segments into an HTML5 `<video>` element through [Media Source Extensions][] API. For MP2 audio, frames are diverted to a WASM software decoder and played back via Web Audio API.

[Media Source Extensions]: https://w3c.github.io/media-source/

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

```js
import { createPlayer, isSupported } from "@rtp2httpd/mpegts.js";

if (isSupported()) {
  const video = document.getElementById("videoElement");
  const player = createPlayer(video, {
    // Optional: enable MP2 software decoding
    // wasmDecoders: { mp2: "/path/to/mp2_decoder.wasm" },
  });

  player.loadSegments([
    { url: "http://example.com/live/livestream.ts" },
  ]);

  player.on("error", (e) => console.error(e));

  video.play();
}
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
