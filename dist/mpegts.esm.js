const oe = {
  liveSync: !0,
  liveSyncMaxLatency: 1.2,
  liveSyncTargetLatency: 0.8,
  liveSyncPlaybackRate: 1.2,
  fixAudioTimestampGap: !0,
  wasmDecoders: {},
  bufferCleanupMaxBackward: 180,
  bufferCleanupMinBackward: 120,
  referrerPolicy: void 0,
  headers: void 0
};
let G = "mpegts.js", R = !1, q = !0, j = !0, H = !0, z = !0, W = !0;
function re(e, ...t) {
  q && ((!e || R) && (e = G), (console.error || console.log)(`[${e}] >`, ...t));
}
function de(e, ...t) {
  j && ((!e || R) && (e = G), (console.info || console.log)(`[${e}] >`, ...t));
}
function ce(e, ...t) {
  H && ((!e || R) && (e = G), (console.warn || console.log)(`[${e}] >`, ...t));
}
function le(e, ...t) {
  z && ((!e || R) && (e = G), (console.debug || console.log)(`[${e}] >`, ...t));
}
function _e(e, ...t) {
  W && ((!e || R) && (e = G), console.log(`[${e}] >`, ...t));
}
const m = {
  get GLOBAL_TAG() {
    return G;
  },
  set GLOBAL_TAG(e) {
    G = e;
  },
  get FORCE_GLOBAL_TAG() {
    return R;
  },
  set FORCE_GLOBAL_TAG(e) {
    R = e;
  },
  get ENABLE_ERROR() {
    return q;
  },
  set ENABLE_ERROR(e) {
    q = e;
  },
  get ENABLE_INFO() {
    return j;
  },
  set ENABLE_INFO(e) {
    j = e;
  },
  get ENABLE_WARN() {
    return H;
  },
  set ENABLE_WARN(e) {
    H = e;
  },
  get ENABLE_DEBUG() {
    return z;
  },
  set ENABLE_DEBUG(e) {
    z = e;
  },
  get ENABLE_VERBOSE() {
    return W;
  },
  set ENABLE_VERBOSE(e) {
    W = e;
  },
  // Kept for compatibility with internal modules that reference Log.ENABLE_CALLBACK
  ENABLE_CALLBACK: !1,
  e: re,
  i: de,
  w: ce,
  d: le,
  v: _e
}, w = "PCMAudioPlayer";
let J = !1;
class he {
  config;
  context = null;
  gainNode = null;
  pendingChunks = [];
  volume = 1;
  muted = !1;
  // Sync state
  videoElement = null;
  // basePtsOffset: rawAudioPTS - videoTime, used to normalize raw PTS to video timeline
  basePtsOffset = 0;
  basePtsEstablished = !1;
  lastScheduledEndTime = 0;
  lastFeedPts = -1;
  // last raw PTS from feed(), for discontinuity detection
  // iOS Silent Mode bypass
  audioElement = null;
  mediaStreamDestination = null;
  // Buffer management for seek support (all PTS values are in video timeline)
  audioBuffer = [];
  // Track scheduled sources for cancellation
  scheduledSources = [];
  // Seek state
  isSeeking = !1;
  // Bound event handlers for cleanup
  boundOnVideoSeeking = null;
  boundOnVideoSeeked = null;
  boundOnVideoPlay = null;
  boundOnVideoPause = null;
  boundOnVolumeChange = null;
  boundOnTimeUpdate = null;
  /** Called when AudioContext is blocked by autoplay policy (needs user interaction). */
  onSuspended = null;
  constructor(t) {
    this.config = t;
  }
  async init() {
    if (this.context)
      return;
    if (this.context = new AudioContext(), this.gainNode = this.context.createGain(), /iPad|iPhone|iPod/.test(navigator.userAgent))
      try {
        this.mediaStreamDestination = this.context.createMediaStreamDestination(), this.gainNode.connect(this.mediaStreamDestination), this.audioElement = document.createElement("audio"), this.audioElement.srcObject = this.mediaStreamDestination.stream, this.audioElement.autoplay = !0, this.audioElement.setAttribute("playsinline", ""), this.audioElement.setAttribute("webkit-playsinline", ""), m.v(w, "iOS detected: using MediaStream bypass for Silent Mode");
      } catch {
        m.w(w, "Failed to create MediaStream destination, falling back to default output"), this.gainNode.connect(this.context.destination);
      }
    else
      this.gainNode.connect(this.context.destination);
    this.updateGain(), this.context.onstatechange = () => {
      m.v(w, `AudioContext state changed to: ${this.context?.state}`), this.context?.state === "running" && this.seekToTime(this.videoElement?.currentTime ?? 0);
    }, m.v(w, `AudioContext initialized, sampleRate: ${this.context.sampleRate}, state: ${this.context.state}`);
  }
  attachVideo(t) {
    this.videoElement = t, this.setVolume(t.volume), this.setMuted(t.muted), this.boundOnVideoSeeking = this.onVideoSeeking.bind(this), this.boundOnVideoSeeked = this.onVideoSeeked.bind(this), this.boundOnVideoPlay = () => this.play(), this.boundOnVideoPause = () => this.pause(), this.boundOnVolumeChange = () => {
      this.setVolume(t.volume), this.setMuted(t.muted);
    }, this.boundOnTimeUpdate = () => {
      this.pendingChunks.length > 0 && this.scheduleChunks();
    }, t.addEventListener("seeking", this.boundOnVideoSeeking), t.addEventListener("seeked", this.boundOnVideoSeeked), t.addEventListener("play", this.boundOnVideoPlay), t.addEventListener("pause", this.boundOnVideoPause), t.addEventListener("volumechange", this.boundOnVolumeChange), t.addEventListener("timeupdate", this.boundOnTimeUpdate);
  }
  detachVideo() {
    this.videoElement && (this.boundOnVideoSeeking && this.videoElement.removeEventListener("seeking", this.boundOnVideoSeeking), this.boundOnVideoSeeked && this.videoElement.removeEventListener("seeked", this.boundOnVideoSeeked), this.boundOnVideoPlay && this.videoElement.removeEventListener("play", this.boundOnVideoPlay), this.boundOnVideoPause && this.videoElement.removeEventListener("pause", this.boundOnVideoPause), this.boundOnVolumeChange && this.videoElement.removeEventListener("volumechange", this.boundOnVolumeChange), this.boundOnTimeUpdate && this.videoElement.removeEventListener("timeupdate", this.boundOnTimeUpdate)), this.boundOnVideoSeeking = null, this.boundOnVideoSeeked = null, this.boundOnVideoPlay = null, this.boundOnVideoPause = null, this.boundOnVolumeChange = null, this.boundOnTimeUpdate = null, this.videoElement = null;
  }
  feed(t, a, i, s) {
    if (!this.context || !this.gainNode) {
      m.w(w, "AudioContext not initialized, dropping audio");
      return;
    }
    if (this.lastFeedPts >= 0 && this.basePtsEstablished) {
      const b = Math.abs(s - this.lastFeedPts);
      b > 1 && (this.basePtsOffset += s - this.lastFeedPts, m.v(
        w,
        `PTS discontinuity: jump=${b.toFixed(3)}s, basePtsOffset adjusted to ${this.basePtsOffset.toFixed(3)}s`
      ));
    }
    if (this.lastFeedPts = s, !this.basePtsEstablished && this.videoElement && this.videoElement.readyState >= 2) {
      const b = this.videoElement.buffered.end(this.videoElement.buffered.length - 1);
      this.basePtsOffset = s - b, this.basePtsEstablished = !0, m.v(
        w,
        `Base PTS offset established: ${this.basePtsOffset.toFixed(3)}s (rawPTS=${s.toFixed(3)}, videoTime=${b.toFixed(3)})`
      );
    }
    if (!this.basePtsEstablished)
      return;
    const n = s - this.basePtsOffset, r = Math.floor(t.length / a) / i, l = { samples: t, channels: a, sampleRate: i, time: n, duration: r, endTime: n + r };
    this.insertToBuffer(l), this.cleanupBuffer(), this.isSeeking || (this.pendingChunks.push(l), this.scheduleChunks());
  }
  /**
   * All audio scheduling goes through this single method — drift-based sync
   * is always active, whether chunks come from live feed() or buffer refill.
   * All PTS values here are in video timeline space.
   */
  scheduleChunks() {
    if (!this.context || !this.gainNode || this.pendingChunks.length === 0 || this.videoElement?.paused)
      return;
    if (this.context.state === "suspended") {
      this.context.resume(), J || (J = !0, m.w(w, "AudioContext blocked by autoplay policy, waiting for user interaction"), this.onSuspended?.(), this.videoElement?.pause());
      return;
    }
    const t = this.context.currentTime, a = this.videoElement?.currentTime ?? 0;
    for (; this.pendingChunks.length > 0; ) {
      const i = this.pendingChunks[0], s = i.time - a;
      let n = t + s;
      if (this.lastScheduledEndTime > 0) {
        const l = n - this.lastScheduledEndTime;
        l < 5e-3 && l > -0.05 ? n = this.lastScheduledEndTime : l < -0.05 && (this.lastScheduledEndTime = 0);
      }
      if (n < t - 0.1) {
        this.pendingChunks.shift();
        continue;
      }
      if (n > t + 1)
        break;
      this.pendingChunks.shift();
      const h = Math.max(n, t), r = this.scheduleChunk(i, h);
      this.lastScheduledEndTime = h + r;
    }
  }
  scheduleChunk(t, a) {
    if (!this.context || !this.gainNode)
      return 0;
    const { samples: i, channels: s, sampleRate: n } = t, h = Math.floor(i.length / s), r = this.context.createBuffer(s, h, n);
    for (let A = 0; A < s; A++) {
      const f = r.getChannelData(A);
      for (let v = 0; v < h; v++)
        f[v] = i[v * s + A];
    }
    const l = this.context.createBufferSource();
    l.buffer = r, l.connect(this.gainNode), l.start(a);
    const b = a + r.duration;
    return this.scheduledSources.push({ source: l, startTime: a, endTime: b }), this.cleanupCompletedSources(), r.duration;
  }
  // ==================== Buffer Management ====================
  insertToBuffer(t) {
    let a = 0, i = this.audioBuffer.length;
    for (; a < i; ) {
      const s = a + i >>> 1;
      this.audioBuffer[s].time < t.time ? a = s + 1 : i = s;
    }
    a < this.audioBuffer.length && Math.abs(this.audioBuffer[a].time - t.time) < 1e-3 ? this.audioBuffer[a] = t : this.audioBuffer.splice(a, 0, t);
  }
  /** Remove buffered audio that is too far behind the current playback position.
   *  Same strategy as MSE SourceBuffer cleanup: relative to currentTime. */
  cleanupBuffer() {
    if (this.audioBuffer.length === 0 || !this.videoElement) return;
    const t = this.videoElement.currentTime;
    if (t - this.audioBuffer[0].time < this.config.bufferCleanupMaxBackward) return;
    const a = t - this.config.bufferCleanupMinBackward;
    let i = 0;
    for (let s = 0; s < this.audioBuffer.length && this.audioBuffer[s].endTime < a; s++)
      i++;
    i > 0 && this.audioBuffer.splice(0, i);
  }
  findChunkIndexByTime(t) {
    if (this.audioBuffer.length === 0) return -1;
    let a = 0, i = this.audioBuffer.length - 1;
    for (; a <= i; ) {
      const s = a + i >>> 1, n = this.audioBuffer[s];
      if (t >= n.time && t < n.endTime)
        return s;
      t < n.time ? i = s - 1 : a = s + 1;
    }
    return a > 0 ? a - 1 : a < this.audioBuffer.length ? a : -1;
  }
  /**
   * Push all audioBuffer chunks from startIndex into pendingChunks.
   * Only references are copied (no PCM data duplication).
   * scheduleChunks() applies drift-based sync and only schedules up to 5s ahead.
   */
  refillFromBuffer(t) {
    for (let a = t; a < this.audioBuffer.length; a++)
      this.pendingChunks.push(this.audioBuffer[a]);
  }
  // ==================== Source Tracking ====================
  cancelScheduledAudio() {
    for (const t of this.scheduledSources)
      try {
        t.source.stop(), t.source.disconnect();
      } catch {
      }
    this.scheduledSources = [], this.lastScheduledEndTime = 0;
  }
  cleanupCompletedSources() {
    if (!this.context) return;
    const t = this.context.currentTime;
    this.scheduledSources = this.scheduledSources.filter((a) => {
      if (a.endTime < t - 0.1) {
        try {
          a.source.disconnect();
        } catch {
        }
        return !1;
      }
      return !0;
    });
  }
  // ==================== Seek Event Handlers ====================
  onVideoSeeking() {
    m.v(w, "Video seeking, canceling scheduled audio"), this.isSeeking = !0, this.cancelScheduledAudio(), this.pendingChunks = [];
  }
  onVideoSeeked() {
    if (!this.videoElement) return;
    const t = this.videoElement.currentTime;
    m.v(w, `Video seeked to ${t.toFixed(3)}`), this.isSeeking = !1, this.seekToTime(t);
  }
  /** Seek audio to a video timeline position. Buffer PTS is in video timeline, so
   *  targetTime can be used directly for buffer lookup — works across segments. */
  seekToTime(t) {
    this.cancelScheduledAudio(), this.pendingChunks = [];
    const a = this.findChunkIndexByTime(t);
    if (a >= 0) {
      m.v(w, `Seek hit buffer at chunk ${a}, refilling ${this.audioBuffer.length - a} chunks`), this.refillFromBuffer(a), this.scheduleChunks();
      return;
    }
    m.v(w, "Seek target not in buffer, waiting for new data");
  }
  // ==================== Playback Control ====================
  async play() {
    if (this.context?.state === "suspended")
      try {
        await this.context.resume();
      } catch {
        m.w(w, "Failed to resume AudioContext on play()");
      }
    if (this.audioElement)
      try {
        await this.audioElement.play();
      } catch {
        m.w(w, "Failed to play audio element");
      }
  }
  pause() {
    this.cancelScheduledAudio(), this.pendingChunks = [], this.context?.state === "running" && this.context.suspend(), this.audioElement && this.audioElement.pause();
  }
  stop() {
    this.cancelScheduledAudio(), this.pendingChunks = [], this.audioBuffer = [], this.isSeeking = !1, this.lastScheduledEndTime = 0, this.basePtsEstablished = !1, this.basePtsOffset = 0, this.lastFeedPts = -1;
  }
  setVolume(t) {
    this.volume = Math.max(0, Math.min(1, t)), this.updateGain();
  }
  setMuted(t) {
    this.muted = t, this.updateGain();
  }
  updateGain() {
    this.gainNode && (this.gainNode.gain.value = this.muted ? 0 : this.volume), this.audioElement && (this.audioElement.volume = this.muted ? 0 : this.volume);
  }
  async destroy() {
    this.stop(), this.detachVideo(), this.audioElement && (this.audioElement.pause(), this.audioElement.srcObject = null, this.audioElement = null), this.mediaStreamDestination && (this.mediaStreamDestination.disconnect(), this.mediaStreamDestination = null), this.gainNode && (this.gainNode.disconnect(), this.gainNode = null), this.context && (this.context.onstatechange = null, await this.context.close(), this.context = null);
  }
}
const Q = '(function(){"use strict";const Kt={liveSync:!0,liveSyncMaxLatency:1.2,liveSyncTargetLatency:.8,liveSyncPlaybackRate:1.2,fixAudioTimestampGap:!0,wasmDecoders:{},bufferCleanupMaxBackward:180,bufferCleanupMinBackward:120,referrerPolicy:void 0,headers:void 0};function Ht(){return{...Kt}}class ut{mimeType;duration;hasAudio;hasVideo;audioCodec;videoCodec;audioDataRate;videoDataRate;audioSampleRate;audioChannelCount;width;height;fps;profile;level;refFrames;chromaFormat;sarNum;sarDen;segments;segmentCount;constructor(){this.mimeType=null,this.duration=null,this.hasAudio=null,this.hasVideo=null,this.audioCodec=null,this.videoCodec=null,this.audioDataRate=null,this.videoDataRate=null,this.audioSampleRate=null,this.audioChannelCount=null,this.width=null,this.height=null,this.fps=null,this.profile=null,this.level=null,this.refFrames=null,this.chromaFormat=null,this.sarNum=null,this.sarDen=null,this.segments=null,this.segmentCount=null}isComplete(){const e=this.hasAudio===!1||this.hasAudio===!0&&this.audioCodec!=null&&this.audioSampleRate!=null&&this.audioChannelCount!=null,t=this.hasVideo===!1||this.hasVideo===!0&&this.videoCodec!=null&&this.width!=null&&this.height!=null&&this.fps!=null&&this.profile!=null&&this.level!=null&&this.refFrames!=null&&this.chromaFormat!=null&&this.sarNum!=null&&this.sarDen!=null;return this.mimeType!=null&&e&&t}}let X="mpegts.js",Y=!1,pt=!0,gt=!0,yt=!0,bt=!0,St=!0;function Xt(o,...e){pt&&((!o||Y)&&(o=X),(console.error||console.log)(`[${o}] >`,...e))}function Yt(o,...e){gt&&((!o||Y)&&(o=X),(console.info||console.log)(`[${o}] >`,...e))}function Zt(o,...e){yt&&((!o||Y)&&(o=X),(console.warn||console.log)(`[${o}] >`,...e))}function Jt(o,...e){bt&&((!o||Y)&&(o=X),(console.debug||console.log)(`[${o}] >`,...e))}function Qt(o,...e){St&&((!o||Y)&&(o=X),console.log(`[${o}] >`,...e))}const y={get GLOBAL_TAG(){return X},set GLOBAL_TAG(o){X=o},get FORCE_GLOBAL_TAG(){return Y},set FORCE_GLOBAL_TAG(o){Y=o},get ENABLE_ERROR(){return pt},set ENABLE_ERROR(o){pt=o},get ENABLE_INFO(){return gt},set ENABLE_INFO(o){gt=o},get ENABLE_WARN(){return yt},set ENABLE_WARN(o){yt=o},get ENABLE_DEBUG(){return bt},set ENABLE_DEBUG(o){bt=o},get ENABLE_VERBOSE(){return St},set ENABLE_VERBOSE(o){St=o},ENABLE_CALLBACK:!1,e:Xt,i:Yt,w:Zt,d:Jt,v:Qt},te=1152*2,ee=0,se=1,ie=2,ae=6;function ne(){return{env:{emscripten_notify_memory_growth:()=>{}}}}class oe{exports=null;memoryRef={memory:null};decoderPtr=0;inputPtr=0;outputPtr=0;infoPtr=0;inputBufSize=0;_ready;_isReady=!1;constructor(e){this._ready=this.init(e)}get ready(){return this._ready}get isReady(){return this._isReady}async init(e){const t=ne(),{instance:i}=await WebAssembly.instantiateStreaming(fetch(e),t),s=i.exports;this.memoryRef.memory=s.memory,this.exports=s,s._initialize();const n=s.mpeg_audio_decoder_create;if(this.decoderPtr=n(),!this.decoderPtr)throw new Error("Failed to create MPEG audio decoder");const a=s.malloc;this.outputPtr=a(te*2),this.infoPtr=a(ae*4),this._isReady=!0}decode(e){if(!this._isReady||!this.exports||!this.memoryRef.memory)return null;const t=this.exports.malloc,i=this.exports.free;e.length>this.inputBufSize&&(this.inputPtr&&i(this.inputPtr),this.inputBufSize=Math.max(e.length,4096),this.inputPtr=t(this.inputBufSize)),new Uint8Array(this.memoryRef.memory.buffer).set(e,this.inputPtr);const n=this.exports.mpeg_audio_decode_frame;if(n(this.decoderPtr,this.inputPtr,e.length,this.outputPtr,this.infoPtr)<=0)return null;const r=new Int32Array(this.memoryRef.memory.buffer),d=this.infoPtr>>2,c=r[d+ee],u=r[d+se],m=r[d+ie],l=c*m,h=new Int16Array(this.memoryRef.memory.buffer,this.outputPtr,l),f=new Float32Array(l),S=1/32768;for(let w=0;w<l;w++)f[w]=h[w]*S;return{pcm:f,samples:c,sampleRate:u,channels:m}}reset(){!this._isReady||!this.exports||this.exports.mpeg_audio_decoder_reset(this.decoderPtr)}destroy(){if(!this.exports)return;const e=this.exports.free,t=this.exports.mpeg_audio_decoder_destroy;this.decoderPtr&&(t(this.decoderPtr),this.decoderPtr=0),this.inputPtr&&(e(this.inputPtr),this.inputPtr=0),this.outputPtr&&(e(this.outputPtr),this.outputPtr=0),this.infoPtr&&(e(this.infoPtr),this.infoPtr=0),this.exports=null,this.memoryRef.memory=null,this._isReady=!1}}const At="WorkerAudioDecoder";class re{decoder=null;wasmUrl;constructor(e){this.wasmUrl=e}async initDecoder(){if(this.decoder?.isReady)return!0;this.destroyDecoder(),y.i(At,`Initializing MP2 decoder from ${this.wasmUrl}`);try{return this.decoder=new oe(this.wasmUrl),await this.decoder.ready,y.i(At,"MP2 decoder initialized successfully"),!0}catch(e){return y.e(At,`Failed to initialize MP2 decoder: ${e}`),this.destroyDecoder(),!1}}decode(e,t){if(!this.decoder?.isReady)return null;const i=this.decoder.decode(e);return i?{pcm:i.pcm,channels:i.channels,sampleRate:i.sampleRate,pts:t}:null}reset(){this.decoder?.reset()}destroyDecoder(){this.decoder&&(this.decoder.destroy(),this.decoder=null)}destroy(){this.destroyDecoder()}}const de={FORMAT_UNSUPPORTED:"FormatUnsupported"};class Lt extends Error{constructor(e){super(e),this.name="RuntimeException"}}class ot extends Error{constructor(e){super(e),this.name="IllegalStateException"}}class _e extends Error{constructor(e){super(e),this.name="InvalidArgumentException"}}class j{_buffer;_buffer_index;_total_bytes;_current_word;_current_word_bits_left;constructor(e){this._buffer=e,this._buffer_index=0,this._total_bytes=e.byteLength,this._current_word=0,this._current_word_bits_left=0}destroy(){this._buffer=null}_fillCurrentWord(){const e=this._total_bytes-this._buffer_index;if(e<=0)throw new ot("ExpGolomb: _fillCurrentWord() but no bytes available");const t=Math.min(4,e),i=new Uint8Array(4);i.set(this._buffer.subarray(this._buffer_index,this._buffer_index+t)),this._current_word=new DataView(i.buffer).getUint32(0,!1),this._buffer_index+=t,this._current_word_bits_left=t*8}readBits(e){if(e>32)throw new _e("ExpGolomb: readBits() bits exceeded max 32bits!");if(e<=this._current_word_bits_left){const a=this._current_word>>>32-e;return this._current_word<<=e,this._current_word_bits_left-=e,a}let t=this._current_word_bits_left?this._current_word:0;t=t>>>32-this._current_word_bits_left;const i=e-this._current_word_bits_left;this._fillCurrentWord();const s=Math.min(i,this._current_word_bits_left),n=this._current_word>>>32-s;return this._current_word<<=s,this._current_word_bits_left-=s,t=t<<s|n,t}readBool(){return this.readBits(1)===1}readByte(){return this.readBits(8)}_skipLeadingZero(){let e;for(e=0;e<this._current_word_bits_left;e++)if((this._current_word&2147483648>>>e)!==0)return this._current_word<<=e,this._current_word_bits_left-=e,e;return this._fillCurrentWord(),e+this._skipLeadingZero()}readUEG(){const e=this._skipLeadingZero();return this.readBits(e+1)-1}readSEG(){const e=this.readUEG();return e&1?e+1>>>1:-1*(e>>>1)}}const rt=[96e3,88200,64e3,48e3,44100,32e3,24e3,22050,16e3,12e3,11025,8e3,7350];class It{audio_object_type;sampling_freq_index;sampling_frequency;channel_config;data}class Ut extends It{other_data_present}class ce{TAG="AACADTSParser";data_;current_syncword_offset_;eof_flag_;has_last_incomplete_data;constructor(e){this.data_=e,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&y.e(this.TAG,"Could not found ADTS syncword until payload end")}findNextSyncwordOffset(e){let t=e;const i=this.data_;for(;;){if(t+7>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[t+0]<<8|i[t+1])>>>4===4095)return t;t++}}readNextAACFrame(){const e=this.data_;let t=null;for(;t==null&&!this.eof_flag_;){let s=this.current_syncword_offset_;const n=(e[s+1]&8)>>>3,a=(e[s+1]&6)>>>1,r=e[s+1]&1,d=(e[s+2]&192)>>>6,c=(e[s+2]&60)>>>2,u=(e[s+2]&1)<<2|(e[s+3]&192)>>>6,m=(e[s+3]&3)<<11|e[s+4]<<3|(e[s+5]&224)>>>5;if(e[s+6]&3,s+m>this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}const l=r===1?7:9,h=m-l;s+=l;const f=this.findNextSyncwordOffset(s+h);if(this.current_syncword_offset_=f,n!==0&&n!==1||a!==0)continue;const S=e.subarray(s,s+h);t=new It,t.audio_object_type=d+1,t.sampling_freq_index=c,t.sampling_frequency=rt[c],t.channel_config=u,t.data=S}return t}hasIncompleteData(){return this.has_last_incomplete_data}getIncompleteData(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null}}class le{TAG="AACLOASParser";data_;current_syncword_offset_;eof_flag_;has_last_incomplete_data;constructor(e){this.data_=e,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&y.e(this.TAG,"Could not found LOAS syncword until payload end")}findNextSyncwordOffset(e){let t=e;const i=this.data_;for(;;){if(t+1>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[t+0]<<3|i[t+1]>>>5)===695)return t;t++}}getLATMValue(e){const t=e.readBits(2);let i=0;for(let s=0;s<=t;s++)i=i<<8,i=i|e.readByte();return i}readNextAACFrame(e){const t=this.data_;let i=null;for(;i==null&&!this.eof_flag_;){const n=this.current_syncword_offset_,a=(t[n+1]&31)<<8|t[n+2];if(n+3+a>=this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}const r=new j(t.subarray(n+3,n+3+a)),d=r.readBool();let c=null;if(d)if(e==null){y.w(this.TAG,"StreamMuxConfig Missing"),this.current_syncword_offset_=this.findNextSyncwordOffset(n+3+a),r.destroy();continue}else c=e;else{const l=r.readBool();if(l&&r.readBool()){y.e(this.TAG,"audioMuxVersionA is Not Supported"),r.destroy();break}if(l&&this.getLATMValue(r),!r.readBool()){y.e(this.TAG,"allStreamsSameTimeFraming zero is Not Supported"),r.destroy();break}if(r.readBits(6)!==0){y.e(this.TAG,"more than 2 numSubFrames Not Supported"),r.destroy();break}if(r.readBits(4)!==0){y.e(this.TAG,"more than 2 numProgram Not Supported"),r.destroy();break}if(r.readBits(3)!==0){y.e(this.TAG,"more than 2 numLayer Not Supported"),r.destroy();break}let A=l?this.getLATMValue(r):0;const b=r.readBits(5);A-=5;const g=r.readBits(4);A-=4;const x=r.readBits(4);A-=4,r.readBits(3),A-=3,A>0&&r.readBits(A);const p=r.readBits(3);if(p===0)r.readByte();else{y.e(this.TAG,`frameLengthType = ${p}. Only frameLengthType = 0 Supported`),r.destroy();break}const B=r.readBool();if(B)if(l)this.getLATMValue(r);else{let D=0;for(;;){D=D<<8;const k=r.readBool(),T=r.readByte();if(D+=T,!k)break}console.log(D)}r.readBool()&&r.readByte(),c=new Ut,c.audio_object_type=b,c.sampling_freq_index=g,c.sampling_frequency=rt[c.sampling_freq_index],c.channel_config=x,c.other_data_present=B}let u=0;for(;;){const l=r.readByte();if(u+=l,l!==255)break}const m=new Uint8Array(u);for(let l=0;l<u;l++)m[l]=r.readByte();i=new Ut,i.audio_object_type=c.audio_object_type,i.sampling_freq_index=c.sampling_freq_index,i.sampling_frequency=rt[c.sampling_freq_index],i.channel_config=c.channel_config,i.other_data_present=c.other_data_present,i.data=m,this.current_syncword_offset_=this.findNextSyncwordOffset(n+3+a)}return i}hasIncompleteData(){return this.has_last_incomplete_data}getIncompleteData(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null}}class he{config;sampling_rate;channel_count;codec_mimetype;original_codec_mimetype;constructor(e){let t=null;const i=e.audio_object_type;let s=e.audio_object_type;const n=e.sampling_freq_index,a=e.channel_config;let r=0;const d=navigator.userAgent.toLowerCase();d.indexOf("firefox")!==-1?n>=6?(s=5,t=new Array(4),r=n-3):(s=2,t=new Array(2),r=n):d.indexOf("android")!==-1?(s=2,t=new Array(2),r=n):(s=5,r=n,t=new Array(4),n>=6?r=n-3:a===1&&(s=2,t=new Array(2),r=n)),t[0]=s<<3,t[0]|=(n&15)>>>1,t[1]=(n&15)<<7,t[1]|=(a&15)<<3,s===5&&(t[1]|=(r&15)>>>1,t[2]=(r&1)<<7,t[2]|=8,t[3]=0),this.config=t,this.sampling_rate=rt[n],this.channel_count=a,this.codec_mimetype=`mp4a.40.${s}`,this.original_codec_mimetype=`mp4a.40.${i}`}}class fe{sampling_frequency;sampling_rate_code;bit_stream_identification;bit_stream_mode;low_frequency_effects_channel_on;frame_size_code;channel_count;channel_mode;data}const ue=[[64,64,80,80,96,96,112,112,128,128,160,160,192,192,224,224,256,256,320,320,384,384,448,448,512,512,640,640,768,768,896,896,1024,1024,1152,1152,1280,1280],[69,70,87,88,104,105,121,122,139,140,174,175,208,209,243,244,278,279,348,349,417,418,487,488,557,558,696,697,835,836,975,976,1114,1115,1253,1254,1393,1394],[96,96,120,120,144,144,168,168,192,192,240,240,288,288,336,336,384,384,480,480,576,576,672,672,768,768,960,960,1152,1152,1344,1344,1536,1536,1728,1728,1920,1920]];class me{TAG="AC3Parser";data_;current_syncword_offset_;eof_flag_;has_last_incomplete_data;constructor(e){this.data_=e,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&y.e(this.TAG,"Could not found AC3 syncword until payload end")}findNextSyncwordOffset(e){let t=e;const i=this.data_;for(;;){if(t+7>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[t+0]<<8|i[t+1]<<0)===2935)return t;t++}}readNextAC3Frame(){const e=this.data_;let t=null;for(;t==null&&!this.eof_flag_;){const s=this.current_syncword_offset_,n=e[s+4]>>6,a=[48e3,44200,33e3][n],r=e[s+4]&63,d=ue[n][r]*2;if(Number.isNaN(d)||s+d>this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}const c=this.findNextSyncwordOffset(s+d);this.current_syncword_offset_=c;const u=e[s+5]>>3,m=e[s+5]&7,l=e[s+6]>>5;let h=0;(l&1)!==0&&l!==1&&(h+=2),(l&4)!==0&&(h+=2),l===2&&(h+=2);const f=(e[s+6]<<8|e[s+7]<<0)>>12-h&1,S=[2,1,2,3,3,4,4,5][l]+f;t=new fe,t.sampling_frequency=a,t.channel_count=S,t.channel_mode=l,t.bit_stream_identification=u,t.low_frequency_effects_channel_on=f,t.bit_stream_mode=m,t.frame_size_code=r,t.data=e.subarray(s,s+d)}return t}hasIncompleteData(){return this.has_last_incomplete_data}getIncompleteData(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null}}class pe{config;sampling_rate;bit_stream_identification;bit_stream_mode;low_frequency_effects_channel_on;channel_count;channel_mode;codec_mimetype;original_codec_mimetype;constructor(e){let t=null;t=[e.sampling_rate_code<<6|e.bit_stream_identification<<1|e.bit_stream_mode>>2,(e.bit_stream_mode&3)<<6|e.channel_mode<<3|e.low_frequency_effects_channel_on<<2|e.frame_size_code>>4,e.frame_size_code<<4&224],this.config=t,this.sampling_rate=e.sampling_frequency,this.bit_stream_identification=e.bit_stream_identification,this.bit_stream_mode=e.bit_stream_mode,this.low_frequency_effects_channel_on=e.low_frequency_effects_channel_on,this.channel_count=e.channel_count,this.channel_mode=e.channel_mode,this.codec_mimetype="ac-3",this.original_codec_mimetype="ac-3"}}class ge{sampling_frequency;sampling_rate_code;bit_stream_identification;low_frequency_effects_channel_on;num_blks;frame_size;channel_count;channel_mode;data}class ye{TAG="EAC3Parser";data_;current_syncword_offset_;eof_flag_;has_last_incomplete_data;constructor(e){this.data_=e,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&y.e(this.TAG,"Could not found AC3 syncword until payload end")}findNextSyncwordOffset(e){let t=e;const i=this.data_;for(;;){if(t+7>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[t+0]<<8|i[t+1]<<0)===2935)return t;t++}}readNextEAC3Frame(){const e=this.data_;let t=null;for(;t==null&&!this.eof_flag_;){const s=this.current_syncword_offset_,n=new j(e.subarray(s+2));n.readBits(2),n.readBits(3);const a=n.readBits(11)+1<<1;let r=n.readBits(2),d=null,c=null;r===3?(r=n.readBits(2),d=[24e3,22060,16e3][r],c=3):(d=[48e3,44100,32e3][r],c=n.readBits(2));const u=n.readBits(3),m=n.readBits(1),l=n.readBits(5);if(s+a>this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}const h=this.findNextSyncwordOffset(s+a);this.current_syncword_offset_=h;const f=[2,1,2,3,3,4,4,5][u]+m;n.destroy(),t=new ge,t.sampling_frequency=d,t.channel_count=f,t.channel_mode=u,t.bit_stream_identification=l,t.low_frequency_effects_channel_on=m,t.frame_size=a,t.num_blks=[1,2,3,6][c],t.data=e.subarray(s,s+a)}return t}hasIncompleteData(){return this.has_last_incomplete_data}getIncompleteData(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null}}class be{config;sampling_rate;bit_stream_identification;num_blks;low_frequency_effects_channel_on;channel_count;channel_mode;codec_mimetype;original_codec_mimetype;constructor(e){let t=null;const i=Math.floor(e.frame_size*e.sampling_frequency/(e.num_blks*16));t=[i&255,i&248,e.sampling_rate_code<<6|e.bit_stream_identification<<1|0,0|e.channel_mode<<1|e.low_frequency_effects_channel_on<<0,0],this.config=t,this.sampling_rate=e.sampling_frequency,this.bit_stream_identification=e.bit_stream_identification,this.num_blks=e.num_blks,this.low_frequency_effects_channel_on=e.low_frequency_effects_channel_on,this.channel_count=e.channel_count,this.channel_mode=e.channel_mode,this.codec_mimetype="ec-3",this.original_codec_mimetype="ec-3"}}class Se{onError=null;onMediaInfo=null;onTrackMetadata=null;onDataAvailable=null;onTimedID3Metadata=null;onPGSSubtitleData=null;onSynchronousKLVMetadata=null;onAsynchronousKLVMetadata=null;onSMPTE2038Metadata=null;onSCTE35Metadata=null;onPESPrivateData=null;onPESPrivateDataDescriptor=null;destroy(){this.onError=null,this.onMediaInfo=null,this.onTrackMetadata=null,this.onDataAvailable=null,this.onTimedID3Metadata=null,this.onPGSSubtitleData=null,this.onSynchronousKLVMetadata=null,this.onAsynchronousKLVMetadata=null,this.onSMPTE2038Metadata=null,this.onSCTE35Metadata=null,this.onPESPrivateData=null,this.onPESPrivateDataDescriptor=null}}var dt=(o=>(o[o.kUnspecified=0]="kUnspecified",o[o.kSliceNonIDR=1]="kSliceNonIDR",o[o.kSliceDPA=2]="kSliceDPA",o[o.kSliceDPB=3]="kSliceDPB",o[o.kSliceDPC=4]="kSliceDPC",o[o.kSliceIDR=5]="kSliceIDR",o[o.kSliceSEI=6]="kSliceSEI",o[o.kSliceSPS=7]="kSliceSPS",o[o.kSlicePPS=8]="kSlicePPS",o[o.kSliceAUD=9]="kSliceAUD",o[o.kEndOfSequence=10]="kEndOfSequence",o[o.kEndOfStream=11]="kEndOfStream",o[o.kFiller=12]="kFiller",o[o.kSPSExt=13]="kSPSExt",o[o.kReserved0=14]="kReserved0",o))(dt||{});class Ae{type;data}class ve{type;data;constructor(e){const t=e.data.byteLength;this.type=e.type,this.data=new Uint8Array(4+t),new DataView(this.data.buffer).setUint32(0,t),this.data.set(e.data,4)}}class we{TAG="H264AnnexBParser";data_;current_startcode_offset_=0;eof_flag_=!1;constructor(e){this.data_=e,this.current_startcode_offset_=this.findNextStartCodeOffset(0),this.eof_flag_&&y.e(this.TAG,"Could not find H264 startcode until payload end!")}findNextStartCodeOffset(e){let t=e;const i=this.data_;for(;;){if(t+3>=i.byteLength)return this.eof_flag_=!0,i.byteLength;const s=i[t+0]<<24|i[t+1]<<16|i[t+2]<<8|i[t+3],n=i[t+0]<<16|i[t+1]<<8|i[t+2];if(s===1||n===1)return t;t++}}readNextNaluPayload(){const e=this.data_;let t=null;for(;t==null&&!this.eof_flag_;){let s=this.current_startcode_offset_;(e[s]<<24|e[s+1]<<16|e[s+2]<<8|e[s+3])===1?s+=4:s+=3;const a=e[s]&31,r=(e[s]&128)>>>7,d=this.findNextStartCodeOffset(s);if(this.current_startcode_offset_=d,a>=14||r!==0)continue;const c=e.subarray(s,d);t=new Ae,t.type=a,t.data=c}return t}}class Be{data;constructor(e,t,i){let s=8+e.byteLength+1+2+t.byteLength,n=!1;e[3]!==66&&e[3]!==77&&e[3]!==88&&(n=!0,s+=4),this.data=new Uint8Array(s);const a=this.data;a[0]=1,a[1]=e[1],a[2]=e[2],a[3]=e[3],a[4]=255,a[5]=225;const r=e.byteLength;a[6]=r>>>8,a[7]=r&255;let d=8;a.set(e,8),d+=r,a[d]=1;const c=t.byteLength;a[d+1]=c>>>8,a[d+2]=c&255,a.set(t,d+3),d+=3+c,n&&(a[d]=252|i.chroma_format_idc,a[d+1]=248|i.bit_depth_luma-8,a[d+2]=248|i.bit_depth_chroma-8,a[d+3]=0,d+=4)}getData(){return this.data}}var Z=(o=>(o[o.kSliceIDR_W_RADL=19]="kSliceIDR_W_RADL",o[o.kSliceIDR_N_LP=20]="kSliceIDR_N_LP",o[o.kSliceCRA_NUT=21]="kSliceCRA_NUT",o[o.kSliceVPS=32]="kSliceVPS",o[o.kSliceSPS=33]="kSliceSPS",o[o.kSlicePPS=34]="kSlicePPS",o[o.kSliceAUD=35]="kSliceAUD",o))(Z||{});class xe{type;data}class De{type;data;constructor(e){const t=e.data.byteLength;this.type=e.type,this.data=new Uint8Array(4+t),new DataView(this.data.buffer).setUint32(0,t),this.data.set(e.data,4)}}class Ce{TAG="H265AnnexBParser";data_;current_startcode_offset_=0;eof_flag_=!1;constructor(e){this.data_=e,this.current_startcode_offset_=this.findNextStartCodeOffset(0),this.eof_flag_&&y.e(this.TAG,"Could not find H265 startcode until payload end!")}findNextStartCodeOffset(e){let t=e;const i=this.data_;for(;;){if(t+3>=i.byteLength)return this.eof_flag_=!0,i.byteLength;const s=i[t+0]<<24|i[t+1]<<16|i[t+2]<<8|i[t+3],n=i[t+0]<<16|i[t+1]<<8|i[t+2];if(s===1||n===1)return t;t++}}readNextNaluPayload(){const e=this.data_;let t=null;for(;t==null&&!this.eof_flag_;){let s=this.current_startcode_offset_;(e[s]<<24|e[s+1]<<16|e[s+2]<<8|e[s+3])===1?s+=4:s+=3;const a=e[s]>>1&63,r=(e[s]&128)>>>7,d=this.findNextStartCodeOffset(s);if(this.current_startcode_offset_=d,r!==0)continue;const c=e.subarray(s,d);t=new xe,t.type=a,t.data=c}return t}}class ke{data;constructor(e,t,i,s){const n=23+(5+e.byteLength)+(5+t.byteLength)+(5+i.byteLength);this.data=new Uint8Array(n);const a=this.data;a[0]=1,a[1]=(s.general_profile_space&3)<<6|(s.general_tier_flag?1:0)<<5|s.general_profile_idc&31,a[2]=s.general_profile_compatibility_flags_1,a[3]=s.general_profile_compatibility_flags_2,a[4]=s.general_profile_compatibility_flags_3,a[5]=s.general_profile_compatibility_flags_4,a[6]=s.general_constraint_indicator_flags_1,a[7]=s.general_constraint_indicator_flags_2,a[8]=s.general_constraint_indicator_flags_3,a[9]=s.general_constraint_indicator_flags_4,a[10]=s.general_constraint_indicator_flags_5,a[11]=s.general_constraint_indicator_flags_6,a[12]=s.general_level_idc,a[13]=240|(s.min_spatial_segmentation_idc&3840)>>8,a[14]=s.min_spatial_segmentation_idc&255,a[15]=252|s.parallelismType&3,a[16]=252|s.chroma_format_idc&3,a[17]=248|s.bit_depth_luma_minus8&7,a[18]=248|s.bit_depth_chroma_minus8&7,a[19]=0,a[20]=0,a[21]=(s.constant_frame_rate&3)<<6|(s.num_temporal_layers&7)<<3|(s.temporal_id_nested?1:0)<<2|3,a[22]=3,a[23]=160,a[24]=0,a[25]=1,a[26]=(e.byteLength&65280)>>8,a[27]=(e.byteLength&255)>>0,a.set(e,28),a[23+(5+e.byteLength)+0]=161,a[23+(5+e.byteLength)+1]=0,a[23+(5+e.byteLength)+2]=1,a[23+(5+e.byteLength)+3]=(t.byteLength&65280)>>8,a[23+(5+e.byteLength)+4]=(t.byteLength&255)>>0,a.set(t,23+(5+e.byteLength)+5),a[23+(5+e.byteLength+5+t.byteLength)+0]=162,a[23+(5+e.byteLength+5+t.byteLength)+1]=0,a[23+(5+e.byteLength+5+t.byteLength)+2]=1,a[23+(5+e.byteLength+5+t.byteLength)+3]=(i.byteLength&65280)>>8,a[23+(5+e.byteLength+5+t.byteLength)+4]=(i.byteLength&255)>>0,a.set(i,23+(5+e.byteLength+5+t.byteLength)+5)}getData(){return this.data}}const $={_ebsp2rbsp(o){const e=o,t=e.byteLength,i=new Uint8Array(t);let s=0;for(let n=0;n<t;n++)n>=2&&e[n]===3&&e[n-1]===0&&e[n-2]===0||(i[s]=e[n],s++);return new Uint8Array(i.buffer,0,s)},parseVPS(o){const e=$._ebsp2rbsp(o),t=new j(e);t.readByte(),t.readByte(),t.readBits(4),t.readBits(2),t.readBits(6);const i=t.readBits(3),s=t.readBool();return{num_temporal_layers:i+1,temporal_id_nested:s}},parseSPS(o){const e=$._ebsp2rbsp(o),t=new j(e);t.readByte(),t.readByte();let i=0,s=0,n=0,a=0;t.readBits(4);const r=t.readBits(3);t.readBool();const d=t.readBits(2),c=t.readBool(),u=t.readBits(5),m=t.readByte(),l=t.readByte(),h=t.readByte(),f=t.readByte(),S=t.readByte(),w=t.readByte(),v=t.readByte(),A=t.readByte(),b=t.readByte(),g=t.readByte(),x=t.readByte(),p=[],B=[];for(let I=0;I<r;I++)p.push(t.readBool()),B.push(t.readBool());if(r>0)for(let I=r;I<8;I++)t.readBits(2);for(let I=0;I<r;I++)p[I]&&(t.readByte(),t.readByte(),t.readByte(),t.readByte(),t.readByte(),t.readByte(),t.readByte(),t.readByte(),t.readByte(),t.readByte(),t.readByte()),B[I]&&t.readByte();t.readUEG();const C=t.readUEG();C===3&&t.readBits(1);const D=t.readUEG(),k=t.readUEG();t.readBool()&&(i+=t.readUEG(),s+=t.readUEG(),n+=t.readUEG(),a+=t.readUEG());const F=t.readUEG(),R=t.readUEG(),G=t.readUEG(),tt=t.readBool();for(let I=tt?0:r;I<=r;I++)t.readUEG(),t.readUEG(),t.readUEG();if(t.readUEG(),t.readUEG(),t.readUEG(),t.readUEG(),t.readUEG(),t.readUEG(),t.readBool()&&t.readBool())for(let P=0;P<4;P++)for(let O=0;O<(P===3?2:6);O++)if(!t.readBool())t.readUEG();else{const q=Math.min(64,1<<4+(P<<1));P>1&&t.readSEG();for(let nt=0;nt<q;nt++)t.readSEG()}t.readBool(),t.readBool(),t.readBool()&&(t.readByte(),t.readUEG(),t.readUEG(),t.readBool());const V=t.readUEG();let N=0;for(let I=0;I<V;I++){let P=!1;if(I!==0&&(P=t.readBool()),P){I===V&&t.readUEG(),t.readBool(),t.readUEG();let O=0;for(let it=0;it<=N;it++){const q=t.readBool();let nt=!1;q||(nt=t.readBool()),(q||nt)&&O++}N=O}else{const O=t.readUEG(),it=t.readUEG();N=O+it;for(let q=0;q<O;q++)t.readUEG(),t.readBool();for(let q=0;q<it;q++)t.readUEG(),t.readBool()}}if(t.readBool()){const I=t.readUEG();for(let P=0;P<I;P++){for(let O=0;O<G+4;O++)t.readBits(1);t.readBits(1)}}let L=!1,U=0,st=1,ct=1,Ft=!1,Dt=1,Ct=1;if(t.readBool(),t.readBool(),t.readBool()){if(t.readBool()){const at=t.readByte(),$t=[1,12,10,16,40,24,20,32,80,18,15,64,160,4,3,2],lt=[1,11,11,11,33,11,11,11,33,11,11,33,99,3,2,1];at>0&&at<=16?(st=$t[at-1],ct=lt[at-1]):at===255&&(st=t.readBits(16),ct=t.readBits(16))}if(t.readBool()&&t.readBool(),t.readBool()&&(t.readBits(3),t.readBool(),t.readBool()&&(t.readByte(),t.readByte(),t.readByte())),t.readBool()&&(t.readUEG(),t.readUEG()),t.readBool(),t.readBool(),t.readBool(),L=t.readBool(),L&&(t.readUEG(),t.readUEG(),t.readUEG(),t.readUEG()),t.readBool()&&(Dt=t.readBits(32),Ct=t.readBits(32),t.readBool()&&t.readUEG(),t.readBool())){let lt=!1,kt=!1,ht=!1;lt=t.readBool(),kt=t.readBool(),(lt||kt)&&(ht=t.readBool(),ht&&(t.readByte(),t.readBits(5),t.readBool(),t.readBits(5)),t.readBits(4),t.readBits(4),ht&&t.readBits(4),t.readBits(5),t.readBits(5),t.readBits(5));for(let zt=0;zt<=r;zt++){const Vt=t.readBool();Ft=Vt;let jt=!0,Et=1;Vt||(jt=t.readBool());let Wt=!1;if(jt?t.readUEG():Wt=t.readBool(),Wt||(Et=t.readUEG()+1),lt){for(let ft=0;ft<Et;ft++)t.readUEG(),t.readUEG(),ht&&(t.readUEG(),t.readUEG());t.readBool()}if(kt){for(let ft=0;ft<Et;ft++)t.readUEG(),t.readUEG(),ht&&(t.readUEG(),t.readUEG());t.readBool()}}}t.readBool()&&(t.readBool(),t.readBool(),t.readBool(),U=t.readUEG(),t.readUEG(),t.readUEG(),t.readUEG(),t.readUEG())}t.readBool();const ds=`hvc1.${u}.1.L${x}.B0`,_s=C===1||C===2?2:1,cs=C===1?2:1,Nt=D-(i+s)*_s,qt=k-(n+a)*cs;let Mt=1;return st!==1&&ct!==1&&(Mt=st/ct),t.destroy(),{codec_mimetype:ds,profile_string:$.getProfileString(u),level_string:$.getLevelString(x),profile_idc:u,bit_depth:F+8,ref_frames:1,chroma_format:C,chroma_format_string:$.getChromaFormatString(C),general_level_idc:x,general_profile_space:d,general_tier_flag:c,general_profile_idc:u,general_profile_compatibility_flags_1:m,general_profile_compatibility_flags_2:l,general_profile_compatibility_flags_3:h,general_profile_compatibility_flags_4:f,general_constraint_indicator_flags_1:S,general_constraint_indicator_flags_2:w,general_constraint_indicator_flags_3:v,general_constraint_indicator_flags_4:A,general_constraint_indicator_flags_5:b,general_constraint_indicator_flags_6:g,min_spatial_segmentation_idc:U,constant_frame_rate:0,chroma_format_idc:C,bit_depth_luma_minus8:F,bit_depth_chroma_minus8:R,frame_rate:{fixed:Ft,fps:Ct/Dt,fps_den:Dt,fps_num:Ct},sar_ratio:{width:st,height:ct},codec_size:{width:Nt,height:qt},present_size:{width:Nt*Mt,height:qt}}},parsePPS(o){const e=$._ebsp2rbsp(o),t=new j(e);t.readByte(),t.readByte(),t.readUEG(),t.readUEG(),t.readBool(),t.readBool(),t.readBits(3),t.readBool(),t.readBool(),t.readUEG(),t.readUEG(),t.readSEG(),t.readBool(),t.readBool(),t.readBool()&&t.readUEG(),t.readSEG(),t.readSEG(),t.readBool(),t.readBool(),t.readBool(),t.readBool();const s=t.readBool(),n=t.readBool();let a=1;return n&&s?a=0:n?a=3:s&&(a=2),{parallelismType:a}},getChromaFormatString(o){switch(o){case 0:return"4:0:0";case 1:return"4:2:0";case 2:return"4:2:2";case 3:return"4:4:4";default:return"Unknown"}},getProfileString(o){switch(o){case 1:return"Main";case 2:return"Main10";case 3:return"MainSP";case 4:return"Rext";case 9:return"SCC";default:return"Unknown"}},getLevelString(o){return(o/30).toFixed(1)}};class Ee{pid;stream_id;pts;dts;access_units;data;len}const Le=o=>{const e=[];let t=0;for(;t+5<o.byteLength;){const i=o[t+0],s=o[t+1],n=o[t+2],a=o[t+3]<<8|o[t+4]<<0,r=o.slice(t+5,t+5+a);e.push({service_id:i,sequence_number:s,flags:n,data:r}),t+=5+a}return e};class Gt{object_type;sample_rate;channel_count;data}class Ie{version_number;network_pid;program_pmt_pid={}}var E=(o=>(o[o.kMPEG1Audio=3]="kMPEG1Audio",o[o.kMPEG2Audio=4]="kMPEG2Audio",o[o.kPESPrivateData=6]="kPESPrivateData",o[o.kADTSAAC=15]="kADTSAAC",o[o.kLOASAAC=17]="kLOASAAC",o[o.kAC3=129]="kAC3",o[o.kEAC3=135]="kEAC3",o[o.kMetadata=21]="kMetadata",o[o.kSCTE35=134]="kSCTE35",o[o.kPGS=144]="kPGS",o[o.kH264=27]="kH264",o[o.kH265=36]="kH265",o))(E||{});class Ue{program_number;version_number;pcr_pid;pid_stream_type={};common_pids={h264:void 0,h265:void 0,av1:void 0,adts_aac:void 0,loas_aac:void 0,opus:void 0,ac3:void 0,eac3:void 0,mp3:void 0};pes_private_data_pids={};timed_id3_pids={};pgs_pids={};pgs_langs={};synchronous_klv_pids={};asynchronous_klv_pids={};scte_35_pids={};smpte2038_pids={}}class Ge{pid;data;stream_type;file_position;random_access_indicator}class Re{pid;data;file_position;random_access_indicator}class Rt{slices=[];total_length=0;expected_length=0;file_position=0;random_access_indicator=0}class vt{pid;stream_id;pts;dts;nearest_pts;data;len}class Te{pid;stream_type;descriptor}class Pe{pid;stream_id;pts;dts;lang;data;len}const wt=o=>{const e=o.readBool();if(e){o.readBits(6);const t=o.readBits(31)*4+o.readBits(2);return{time_specified_flag:e,pts_time:t}}else return o.readBits(7),{time_specified_flag:e}},Tt=o=>{const e=o.readBool();o.readBits(6);const t=o.readBits(31)*4+o.readBits(2);return{auto_return:e,duration:t}},Oe=(o,e)=>{const t=e.readBits(8);if(o)return{component_tag:t};const i=wt(e);return{component_tag:t,splice_time:i}},Fe=o=>{const e=o.readBits(8),t=o.readBits(32);return{component_tag:e,utc_splice_time:t}},Ne=o=>{const e=o.readBits(32),t=o.readBool();o.readBits(7);const i={splice_event_id:e,splice_event_cancel_indicator:t};if(t)return i;if(i.out_of_network_indicator=o.readBool(),i.program_splice_flag=o.readBool(),i.duration_flag=o.readBool(),o.readBits(5),i.program_splice_flag)i.utc_splice_time=o.readBits(32);else{i.component_count=o.readBits(8),i.components=[];for(let s=0;s<i.component_count;s++)i.components.push(Fe(o))}return i.duration_flag&&(i.break_duration=Tt(o)),i.unique_program_id=o.readBits(16),i.avail_num=o.readBits(8),i.avails_expected=o.readBits(8),i},qe=()=>({}),Me=o=>{const e=o.readBits(8),t=[];for(let i=0;i<e;i++)t.push(Ne(o));return{splice_count:e,events:t}},$e=o=>{const e=o.readBits(32),t=o.readBool();o.readBits(7);const i={splice_event_id:e,splice_event_cancel_indicator:t};if(t)return i;if(i.out_of_network_indicator=o.readBool(),i.program_splice_flag=o.readBool(),i.duration_flag=o.readBool(),i.splice_immediate_flag=o.readBool(),o.readBits(4),i.program_splice_flag&&!i.splice_immediate_flag&&(i.splice_time=wt(o)),!i.program_splice_flag){i.component_count=o.readBits(8),i.components=[];for(let s=0;s<i.component_count;s++)i.components.push(Oe(i.splice_immediate_flag,o))}return i.duration_flag&&(i.break_duration=Tt(o)),i.unique_program_id=o.readBits(16),i.avail_num=o.readBits(8),i.avails_expected=o.readBits(8),i},ze=o=>({splice_time:wt(o)}),Ve=()=>({}),je=(o,e)=>{const t=String.fromCharCode(e.readBits(8),e.readBits(8),e.readBits(8),e.readBits(8)),i=new Uint8Array(o-4);for(let s=0;s<o-4;s++)i[s]=e.readBits(8);return{identifier:t,private_data:i.buffer}},We=(o,e,t,i)=>{const s=i.readBits(32);return{descriptor_tag:o,descriptor_length:e,identifier:t,provider_avail_id:s}},Ke=(o,e,t,i)=>{const s=i.readBits(8),n=i.readBits(3);i.readBits(5);let a="";for(let r=0;r<n;r++)a+=String.fromCharCode(i.readBits(8));return{descriptor_tag:o,descriptor_length:e,identifier:t,preroll:s,dtmf_count:n,DTMF_char:a}},He=o=>{const e=o.readBits(8);o.readBits(7);const t=o.readBits(31)*4+o.readBits(2);return{component_tag:e,pts_offset:t}},Xe=(o,e,t,i)=>{const s=i.readBits(32),n=i.readBool();i.readBits(7);const a={descriptor_tag:o,descriptor_length:e,identifier:t,segmentation_event_id:s,segmentation_event_cancel_indicator:n};if(n)return a;if(a.program_segmentation_flag=i.readBool(),a.segmentation_duration_flag=i.readBool(),a.delivery_not_restricted_flag=i.readBool(),a.delivery_not_restricted_flag?i.readBits(5):(a.web_delivery_allowed_flag=i.readBool(),a.no_regional_blackout_flag=i.readBool(),a.archive_allowed_flag=i.readBool(),a.device_restrictions=i.readBits(2)),!a.program_segmentation_flag){a.component_count=i.readBits(8),a.components=[];for(let r=0;r<a.component_count;r++)a.components.push(He(i))}a.segmentation_duration_flag&&(a.segmentation_duration=i.readBits(40)),a.segmentation_upid_type=i.readBits(8),a.segmentation_upid_length=i.readBits(8);{const r=new Uint8Array(a.segmentation_upid_length);for(let d=0;d<a.segmentation_upid_length;d++)r[d]=i.readBits(8);a.segmentation_upid=r.buffer}return a.segmentation_type_id=i.readBits(8),a.segment_num=i.readBits(8),a.segments_expected=i.readBits(8),(a.segmentation_type_id===52||a.segmentation_type_id===54||a.segmentation_type_id===56||a.segmentation_type_id===58)&&(a.sub_segment_num=i.readBits(8),a.sub_segments_expected=i.readBits(8)),a},Ye=(o,e,t,i)=>{const s=i.readBits(48),n=i.readBits(32),a=i.readBits(16);return{descriptor_tag:o,descriptor_length:e,identifier:t,TAI_seconds:s,TAI_ns:n,UTC_offset:a}},Ze=o=>{const e=o.readBits(8),t=String.fromCharCode(o.readBits(8),o.readBits(8),o.readBits(8)),i=o.readBits(3),s=o.readBits(4),n=o.readBool();return{component_tag:e,ISO_code:t,Bit_Stream_Mode:i,Num_Channels:s,Full_Srvc_Audio:n}},Je=(o,e,t,i)=>{const s=i.readBits(4),n=[];for(let a=0;a<s;a++)n.push(Ze(i));return{descriptor_tag:o,descriptor_length:e,identifier:t,audio_count:s,components:n}},Qe=o=>{const e=new j(o),t=e.readBits(8),i=e.readBool(),s=e.readBool();e.readBits(2);const n=e.readBits(12),a=e.readBits(8),r=e.readBool(),d=e.readBits(6),c=e.readBits(31)*4+e.readBits(2),u=e.readBits(8),m=e.readBits(12),l=e.readBits(12),h=e.readBits(8);let f=null;h===0?f=qe():h===4?f=Me(e):h===5?f=$e(e):h===6?f=ze(e):h===7?f=Ve():h===255?f=je(l,e):e.readBits(l*8);const S=[],w=e.readBits(16);for(let g=0;g<w;){const x=e.readBits(8),p=e.readBits(8),B=String.fromCharCode(e.readBits(8),e.readBits(8),e.readBits(8),e.readBits(8));x===0?S.push(We(x,p,B,e)):x===1?S.push(Ke(x,p,B,e)):x===2?S.push(Xe(x,p,B,e)):x===3?S.push(Ye(x,p,B,e)):x===4?S.push(Je(x,p,B,e)):e.readBits((p-4)*8),g+=2+p}const v=r?e.readBits(32):void 0,A=e.readBits(32),b={table_id:t,section_syntax_indicator:i,private_indicator:s,section_length:n,protocol_version:a,encrypted_packet:r,encryption_algorithm:d,pts_adjustment:c,cw_index:u,tier:m,splice_command_length:l,splice_command_type:h,splice_command:f,descriptor_loop_length:w,splice_descriptors:S,E_CRC32:v,CRC32:A};if(h===5){const g=f;if(g.splice_event_cancel_indicator)return{splice_command_type:h,detail:b,data:o};if(g.program_splice_flag&&!g.splice_immediate_flag){const x=g.duration_flag?g.break_duration?.auto_return:void 0,p=g.duration_flag?(g.break_duration?.duration??0)/90:void 0;return g.splice_time?.time_specified_flag?{splice_command_type:h,pts:(c+(g.splice_time?.pts_time??0))%2**33,auto_return:x,duraiton:p,detail:b,data:o}:{splice_command_type:h,auto_return:x,duraiton:p,detail:b,data:o}}else{const x=g.duration_flag?g.break_duration?.auto_return:void 0,p=g.duration_flag?(g.break_duration?.duration??0)/90:void 0;return{splice_command_type:h,auto_return:x,duraiton:p,detail:b,data:o}}}else if(h===6){const g=f;return g.splice_time.time_specified_flag?{splice_command_type:h,pts:(c+(g.splice_time.pts_time??0))%2**33,detail:b,data:o}:{splice_command_type:h,detail:b,data:o}}else return{splice_command_type:h,pts:void 0,detail:b,data:o}};class ts{pid;stream_id;pts;dts;nearest_pts;ancillaries;data;len}const es=o=>{const e=new j(o);let t=0;const i=[];for(;;){const s=e.readBits(6);if(t+=6,s!==0)break;const n=e.readBool();t+=1;const a=e.readBits(11);t+=11;const r=e.readBits(12);t+=12;const d=e.readBits(10)&255;t+=10;const c=e.readBits(10)&255;t+=10;const u=e.readBits(10)&255;t+=10;const m=new Uint8Array(u);for(let f=0;f<u;f++){const S=e.readBits(10)&255;t+=10,m[f]=S}e.readBits(10),t+=10;let l="User Defined";const h={};d===65?c===7&&(l="SCTE-104"):d===95?c===220?l="ARIB STD-B37 (1SEG)":c===221?l="ARIB STD-B37 (ANALOG)":c===222?l="ARIB STD-B37 (SD)":c===223&&(l="ARIB STD-B37 (HD)"):d===97&&(c===1?l="EIA-708":c===2&&(l="EIA-608")),i.push({yc_indicator:n,line_number:a,horizontal_offset:r,did:d,sdid:c,user_data:m,description:l,information:h}),e.readBits(8-(t-Math.floor(t/8))%8),t+=(8-(t-Math.floor(t/8)))%8}return e.destroy(),i},J={_ebsp2rbsp(o){const e=o,t=e.byteLength,i=new Uint8Array(t);let s=0;for(let n=0;n<t;n++)n>=2&&e[n]===3&&e[n-1]===0&&e[n-2]===0||(i[s]=e[n],s++);return new Uint8Array(i.buffer,0,s)},parseSPS(o){const e=o.subarray(1,4);let t="avc1.";for(let L=0;L<3;L++){let U=e[L].toString(16);U.length<2&&(U=`0${U}`),t+=U}const i=J._ebsp2rbsp(o),s=new j(i);s.readByte();const n=s.readByte();s.readByte();const a=s.readByte();s.readUEG();const r=J.getProfileString(n),d=J.getLevelString(a);let c=1,u=420;const m=[0,420,422,444];let l=8,h=8;if((n===100||n===110||n===122||n===244||n===44||n===83||n===86||n===118||n===128||n===138||n===144)&&(c=s.readUEG(),c===3&&s.readBits(1),c<=3&&(u=m[c]),l=s.readUEG()+8,h=s.readUEG()+8,s.readBits(1),s.readBool())){const L=c!==3?8:12;for(let U=0;U<L;U++)s.readBool()&&(U<6?J._skipScalingList(s,16):J._skipScalingList(s,64))}s.readUEG();const f=s.readUEG();if(f===0)s.readUEG();else if(f===1){s.readBits(1),s.readSEG(),s.readSEG();const L=s.readUEG();for(let U=0;U<L;U++)s.readSEG()}const S=s.readUEG();s.readBits(1);const w=s.readUEG(),v=s.readUEG(),A=s.readBits(1);A===0&&s.readBits(1),s.readBits(1);let b=0,g=0,x=0,p=0;s.readBool()&&(b=s.readUEG(),g=s.readUEG(),x=s.readUEG(),p=s.readUEG());let C=1,D=1,k=0,T=!0,F=0,R=0;if(s.readBool()){if(s.readBool()){const L=s.readByte(),U=[1,12,10,16,40,24,20,32,80,18,15,64,160,4,3,2],st=[1,11,11,11,33,11,11,11,33,11,11,33,99,3,2,1];L>0&&L<16?(C=U[L-1],D=st[L-1]):L===255&&(C=s.readByte()<<8|s.readByte(),D=s.readByte()<<8|s.readByte())}if(s.readBool()&&s.readBool(),s.readBool()&&(s.readBits(4),s.readBool()&&s.readBits(24)),s.readBool()&&(s.readUEG(),s.readUEG()),s.readBool()){const L=s.readBits(32),U=s.readBits(32);T=s.readBool(),F=U,R=L*2,k=F/R}}let tt=1;(C!==1||D!==1)&&(tt=C/D);let et=0,z=0;if(c===0)et=1,z=2-A;else{const L=c===3?1:2,U=c===1?2:1;et=L,z=U*(2-A)}let V=(w+1)*16,N=(2-A)*((v+1)*16);V-=(b+g)*et,N-=(x+p)*z;const mt=Math.ceil(V*tt);return s.destroy(),{codec_mimetype:t,profile_idc:n,level_idc:a,profile_string:r,level_string:d,chroma_format_idc:c,bit_depth:l,bit_depth_luma:l,bit_depth_chroma:h,ref_frames:S,chroma_format:u,chroma_format_string:J.getChromaFormatString(u),frame_rate:{fixed:T,fps:k,fps_den:R,fps_num:F},sar_ratio:{width:C,height:D},codec_size:{width:V,height:N},present_size:{width:mt,height:N}}},_skipScalingList(o,e){let t=8,i=8,s=0;for(let n=0;n<e;n++)i!==0&&(s=o.readSEG(),i=(t+s+256)%256),t=i===0?t:i},getProfileString(o){switch(o){case 66:return"Baseline";case 77:return"Main";case 88:return"Extended";case 100:return"High";case 110:return"High10";case 122:return"High422";case 244:return"High444";default:return"Unknown"}},getLevelString(o){return(o/10).toFixed(1)},getChromaFormatString(o){switch(o){case 420:return"4:2:0";case 422:return"4:2:2";case 444:return"4:4:4";default:return"Unknown"}}};class Pt extends Se{TAG="TSDemuxer";ts_packet_size_;sync_offset_;first_parse_=!0;media_info_=new ut;timescale_=90;duration_=0;pat_;current_program_;current_pmt_pid_=-1;pmt_;program_pmt_map_={};pes_slice_queues_={};section_slice_queues_={};video_metadata_={vps:void 0,sps:void 0,pps:void 0,av1c:void 0,details:{}};audio_metadata_={codec:void 0,audio_object_type:void 0,sampling_freq_index:void 0,sampling_frequency:void 0,channel_config:void 0};last_pcr_;last_pcr_base_=NaN;timestamp_offset_=0;audio_last_sample_pts_=void 0;aac_last_incomplete_data_=null;has_video_=!1;has_audio_=!1;video_init_segment_dispatched_=!1;audio_init_segment_dispatched_=!1;video_metadata_changed_=!1;loas_previous_frame=null;onRawAudioData=null;soft_decode_audio_codec_=null;video_track_={type:"video",id:1,sequenceNumber:0,samples:[],length:0};audio_track_={type:"audio",id:2,sequenceNumber:0,samples:[],length:0};set timestampBase(e){this.timestamp_offset_=e}constructor(e,t){super(),this.ts_packet_size_=e.ts_packet_size,this.sync_offset_=e.sync_offset}destroy(){this.media_info_=null,this.pes_slice_queues_=null,this.section_slice_queues_=null,this.video_metadata_=null,this.audio_metadata_=null,this.aac_last_incomplete_data_=null,this.video_track_=null,this.audio_track_=null,this.onRawAudioData=null,this.soft_decode_audio_codec_=null,super.destroy()}static probe(e){const t=new Uint8Array(e);let i=-1,s=188;if(t.byteLength<=3*s)return{needMoreData:!0};for(;i===-1;){const n=Math.min(1e3,t.byteLength-3*s);for(let a=0;a<n;)if(t[a]===71&&t[a+s]===71&&t[a+2*s]===71){i=a;break}else a++;if(i===-1)if(s===188)s=192;else if(s===192)s=204;else break}return i===-1?{match:!1}:(s===192&&i>=4?(y.v("TSDemuxer","ts_packet_size = 192, m2ts mode"),i-=4):s===204&&y.v("TSDemuxer","ts_packet_size = 204, RS encoded MPEG2-TS stream"),{match:!0,consumed:0,ts_packet_size:s,sync_offset:i})}bindDataSource(e){return e.onDataArrival=this.parseChunks.bind(this),this}resetMediaInfo(){this.media_info_=new ut}parseChunks(e,t){if(!this.onError||!this.onMediaInfo||!this.onTrackMetadata||!this.onDataAvailable)throw new ot("onError & onMediaInfo & onTrackMetadata & onDataAvailable callback must be specified");let i=0;for(this.first_parse_&&(this.first_parse_=!1,i=this.sync_offset_);i+this.ts_packet_size_<=e.byteLength;){const s=t+i;this.ts_packet_size_===192&&(i+=4);const n=new Uint8Array(e,i,188),a=n[0];if(a!==71){y.e(this.TAG,`sync_byte = ${a}, not 0x47`);break}const r=(n[1]&64)>>>6;(n[1]&32)>>>5;const d=(n[1]&31)<<8|n[2],c=(n[3]&48)>>>4,u=n[3]&15,m=!!(this.pmt_&&this.pmt_.pcr_pid===d),l={};let h=4;if(c===2||c===3){const f=n[4];if(f>0&&(m||c===3)&&(l.discontinuity_indicator=(n[5]&128)>>>7,l.random_access_indicator=(n[5]&64)>>>6,l.elementary_stream_priority_indicator=(n[5]&32)>>>5,(n[5]&16)>>>4)){const w=this.getPcrBase(n),v=(n[10]&1)<<8|n[11],A=w*300+v;this.last_pcr_=A}if(c===2||5+f===188){i+=188,this.ts_packet_size_===204&&(i+=16);continue}else h=5+f}if(c===1||c===3){if(d===0||d===this.current_pmt_pid_||this.pmt_!==void 0&&this.pmt_.pid_stream_type[d]===E.kSCTE35){const f=188-h;this.handleSectionSlice(e,i+h,f,{pid:d,file_position:s,payload_unit_start_indicator:r,continuity_conunter:u,random_access_indicator:l.random_access_indicator})}else if(this.pmt_!==void 0&&this.pmt_.pid_stream_type[d]!==void 0){const f=188-h,S=this.pmt_.pid_stream_type[d];(d===this.pmt_.common_pids.h264||d===this.pmt_.common_pids.h265||d===this.pmt_.common_pids.av1||d===this.pmt_.common_pids.adts_aac||d===this.pmt_.common_pids.loas_aac||d===this.pmt_.common_pids.ac3||d===this.pmt_.common_pids.eac3||d===this.pmt_.common_pids.opus||d===this.pmt_.common_pids.mp3||this.pmt_.pes_private_data_pids[d]===!0||this.pmt_.timed_id3_pids[d]===!0||this.pmt_.pgs_pids[d]===!0||this.pmt_.synchronous_klv_pids[d]===!0||this.pmt_.asynchronous_klv_pids[d]===!0)&&this.handlePESSlice(e,i+h,f,{pid:d,stream_type:S,file_position:s,payload_unit_start_indicator:r,continuity_conunter:u,random_access_indicator:l.random_access_indicator})}}i+=188,this.ts_packet_size_===204&&(i+=16)}return this.dispatchAudioVideoMediaSegment(),i}handleSectionSlice(e,t,i,s){const n=new Uint8Array(e,t,i);let a=this.section_slice_queues_[s.pid];if(s.payload_unit_start_indicator){const r=n[0];if(a!==void 0&&a.total_length!==0){const d=new Uint8Array(e,t+1,Math.min(i,r));a.slices.push(d),a.total_length+=d.byteLength,a.total_length===a.expected_length?this.emitSectionSlices(a,s):this.clearSlices(a,s)}for(let d=1+r;d<n.byteLength&&n[d+0]!==255;){const u=(n[d+1]&15)<<8|n[d+2];this.section_slice_queues_[s.pid]=new Rt,a=this.section_slice_queues_[s.pid],a.expected_length=u+3,a.file_position=s.file_position,a.random_access_indicator=s.random_access_indicator??0;const m=new Uint8Array(e,t+d,Math.min(i-d,a.expected_length-a.total_length));a.slices.push(m),a.total_length+=m.byteLength,a.total_length===a.expected_length?this.emitSectionSlices(a,s):a.total_length>=a.expected_length&&this.clearSlices(a,s),d+=m.byteLength}}else if(a!==void 0&&a.total_length!==0){const r=new Uint8Array(e,t,Math.min(i,a.expected_length-a.total_length));a.slices.push(r),a.total_length+=r.byteLength,a.total_length===a.expected_length?this.emitSectionSlices(a,s):a.total_length>=a.expected_length&&this.clearSlices(a,s)}}handlePESSlice(e,t,i,s){const n=new Uint8Array(e,t,i),a=n[0]<<16|n[1]<<8|n[2];n[3];const r=n[4]<<8|n[5];if(s.payload_unit_start_indicator){if(a!==1){y.e(this.TAG,`handlePESSlice: packet_start_code_prefix should be 1 but with value ${a}`);return}const c=this.pes_slice_queues_[s.pid];c&&(c.expected_length===0||c.expected_length===c.total_length?this.emitPESSlices(c,s):this.clearSlices(c,s)),this.pes_slice_queues_[s.pid]=new Rt,this.pes_slice_queues_[s.pid].file_position=s.file_position,this.pes_slice_queues_[s.pid].random_access_indicator=s.random_access_indicator??0}if(this.pes_slice_queues_[s.pid]===void 0)return;const d=this.pes_slice_queues_[s.pid];d.slices.push(n),s.payload_unit_start_indicator&&(d.expected_length=r===0?0:r+6),d.total_length+=n.byteLength,d.expected_length>0&&d.expected_length===d.total_length?this.emitPESSlices(d,s):d.expected_length>0&&d.expected_length<d.total_length&&this.clearSlices(d,s)}emitSectionSlices(e,t){const i=new Uint8Array(e.total_length);for(let n=0,a=0;n<e.slices.length;n++){const r=e.slices[n];i.set(r,a),a+=r.byteLength}e.slices=[],e.expected_length=-1,e.total_length=0;const s=new Re;s.pid=t.pid,s.data=i,s.file_position=e.file_position,s.random_access_indicator=e.random_access_indicator,this.parseSection(s)}emitPESSlices(e,t){const i=new Uint8Array(e.total_length);for(let n=0,a=0;n<e.slices.length;n++){const r=e.slices[n];i.set(r,a),a+=r.byteLength}e.slices=[],e.expected_length=-1,e.total_length=0;const s=new Ge;s.pid=t.pid,s.data=i,s.stream_type=t.stream_type,s.file_position=e.file_position,s.random_access_indicator=e.random_access_indicator,this.parsePES(s)}clearSlices(e,t){e.slices=[],e.expected_length=-1,e.total_length=0}parseSection(e){const t=e.data,i=e.pid;i===0?this.parsePAT(t):i===this.current_pmt_pid_?this.parsePMT(t):this.pmt_?.scte_35_pids[i]&&this.parseSCTE35(t)}parsePES(e){const t=e.data,i=t[0]<<16|t[1]<<8|t[2],s=t[3],n=t[4]<<8|t[5];if(i!==1){y.e(this.TAG,`parsePES: packet_start_code_prefix should be 1 but with value ${i}`);return}if(s!==188&&s!==190&&s!==191&&s!==240&&s!==241&&s!==255&&s!==242&&s!==248){(t[6]&48)>>>4;const a=(t[7]&192)>>>6,r=t[8];let d,c;(a===2||a===3)&&(d=this.getTimestamp(t,9),c=a===3?this.getTimestamp(t,14):d);const u=9+r;let m;if(n!==0){if(n<3+r){y.v(this.TAG,"Malformed PES: PES_packet_length < 3 + PES_header_data_length");return}m=n-3-r}else m=t.byteLength-u;const l=t.subarray(u,u+m);switch(e.stream_type){case E.kMPEG1Audio:case E.kMPEG2Audio:this.parseMP3Payload(l,d);break;case E.kPESPrivateData:this.pmt_.common_pids.av1===e.pid||(this.pmt_.common_pids.opus===e.pid?this.parseOpusPayload(l,d):this.pmt_.common_pids.ac3===e.pid?this.parseAC3Payload(l,d):this.pmt_.common_pids.eac3===e.pid?this.parseEAC3Payload(l,d):this.pmt_.asynchronous_klv_pids[e.pid]?this.parseAsynchronousKLVMetadataPayload(l,e.pid,s):this.pmt_.smpte2038_pids[e.pid]?this.parseSMPTE2038MetadataPayload(l,d,c,e.pid,s):this.parsePESPrivateDataPayload(l,d,c,e.pid,s));break;case E.kADTSAAC:this.parseADTSAACPayload(l,d);break;case E.kLOASAAC:this.parseLOASAACPayload(l,d);break;case E.kAC3:this.parseAC3Payload(l,d);break;case E.kEAC3:this.parseEAC3Payload(l,d);break;case E.kMetadata:this.pmt_.timed_id3_pids[e.pid]?this.parseTimedID3MetadataPayload(l,d,c,e.pid,s):this.pmt_.synchronous_klv_pids[e.pid]&&this.parseSynchronousKLVMetadataPayload(l,d,c,e.pid,s);break;case E.kPGS:this.parsePGSPayload(l,d,c,e.pid,s,this.pmt_.pgs_langs[e.pid]);break;case E.kH264:this.parseH264Payload(l,d,c,e.file_position,e.random_access_indicator);break;case E.kH265:this.parseH265Payload(l,d,c,e.file_position,e.random_access_indicator);break}}else if((s===188||s===191||s===240||s===241||s===255||s===242||s===248)&&e.stream_type===E.kPESPrivateData){let r;n!==0?r=n:r=t.byteLength-6;const d=t.subarray(6,6+r);this.parsePESPrivateDataPayload(d,void 0,void 0,e.pid,s)}}parsePAT(e){const t=e[0];if(t!==0){y.e(this.TAG,`parsePAT: table_id ${t} is not corresponded to PAT!`);return}const i=(e[1]&15)<<8|e[2];e[3]<<8|e[4];const s=(e[5]&62)>>>1,n=e[5]&1,a=e[6];e[7];let r=null;if(n===1&&a===0)r=new Ie,r.version_number=s;else if(r=this.pat_,r===void 0)return;const d=8,c=i-5-4;let u=-1,m=-1;for(let l=d;l<d+c;l+=4){const h=e[l]<<8|e[l+1],f=(e[l+2]&31)<<8|e[l+3];h===0?r.network_pid=f:(r.program_pmt_pid[h]=f,u===-1&&(u=h),m===-1&&(m=f))}n===1&&a===0&&(this.pat_===void 0&&y.v(this.TAG,`Parsed first PAT: ${JSON.stringify(r)}`),this.pat_=r,this.current_program_=u,this.current_pmt_pid_=m)}parsePMT(e){const t=e[0];if(t!==2){y.e(this.TAG,`parsePMT: table_id ${t} is not corresponded to PMT!`);return}const i=(e[1]&15)<<8|e[2],s=e[3]<<8|e[4],n=(e[5]&62)>>>1,a=e[5]&1,r=e[6];e[7];let d=null;if(a===1&&r===0)d=new Ue,d.program_number=s,d.version_number=n,this.program_pmt_map_[s]=d;else if(d=this.program_pmt_map_[s],d===void 0)return;d.pcr_pid=(e[8]&31)<<8|e[9];const c=(e[10]&15)<<8|e[11],u=12+c,m=i-9-c-4;for(let l=u;l<u+m;){const h=e[l],f=(e[l+1]&31)<<8|e[l+2],S=(e[l+3]&15)<<8|e[l+4];d.pid_stream_type[f]=h;const w=d.common_pids.h264||d.common_pids.h265,v=d.common_pids.adts_aac||d.common_pids.loas_aac||d.common_pids.ac3||d.common_pids.eac3||d.common_pids.opus||d.common_pids.mp3;if(h===E.kH264&&!w)d.common_pids.h264=f;else if(h===E.kH265&&!w)d.common_pids.h265=f;else if(h===E.kADTSAAC&&!v)d.common_pids.adts_aac=f;else if(h===E.kLOASAAC&&!v)d.common_pids.loas_aac=f;else if(h===E.kAC3&&!v)d.common_pids.ac3=f;else if(h===E.kEAC3&&!v)d.common_pids.eac3=f;else if((h===E.kMPEG1Audio||h===E.kMPEG2Audio)&&!v)d.common_pids.mp3=f;else if(h===E.kPESPrivateData){if(d.pes_private_data_pids[f]=!0,S>0){for(let b=l+5;b<l+5+S;){const g=e[b+0],x=e[b+1];if(g===5){const p=String.fromCharCode(...Array.from(e.subarray(b+2,b+2+x)));p==="VANC"?d.smpte2038_pids[f]=!0:p==="AC-3"&&!v||p==="BSSD"&&!v?d.common_pids.ac3=f:p==="EC-3"&&!v?d.common_pids.eac3=f:p==="AV01"?d.common_pids.av1=f:p==="Opus"?d.common_pids.opus=f:p==="KLVA"&&(d.asynchronous_klv_pids[f]=!0)}else if(g===127){if(f===d.common_pids.opus){const p=e[b+2];let B=null;if(p===128&&(B=e[b+3]),B==null){y.e(this.TAG,"Not Supported Opus channel count.");continue}const C={codec:"opus",channel_count:(B&15)===0?2:B&15,channel_config_code:B,sample_rate:48e3},D={codec:"opus",meta:C};this.audio_init_segment_dispatched_===!1?(this.audio_metadata_=C,this.dispatchAudioInitSegment(D)):this.detectAudioMetadataChange(D)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(D))}}else g===128?f===d.common_pids.av1&&(this.video_metadata_.av1c=e.subarray(b+2,b+2+x)):g===130||g===106||g===129?d.common_pids.ac3=f:g===122&&(d.common_pids.eac3=f);b+=2+x}const A=e.subarray(l+5,l+5+S);this.dispatchPESPrivateDataDescriptor(f,h,A)}}else if(h===E.kMetadata){if(S>0)for(let A=l+5;A<l+5+S;){const b=e[A+0],g=e[A+1];if(b===38){const x=e[A+2]<<8|e[A+3]<<0;let p=null;x===65535&&(p=String.fromCharCode(...Array.from(e.subarray(A+4,A+4+4))));const B=e[A+4+(x===65535?4:0)];let C=null;if(B===255){const D=4+(x===65535?4:0)+1;C=String.fromCharCode(...Array.from(e.subarray(A+D,A+D+4)))}p==="ID3 "&&C==="ID3 "?d.timed_id3_pids[f]=!0:C==="KLVA"&&(d.synchronous_klv_pids[f]=!0)}A+=2+g}}else if(h===E.kSCTE35)d.scte_35_pids[f]=!0;else if(h===E.kPGS){if(d.pgs_langs[f]="und",S>0)for(let A=l+5;A<l+5+S;){const b=e[A+0],g=e[A+1];if(b===10){const x=String.fromCharCode(...Array.from(e.slice(A+2,A+5)));d.pgs_langs[f]=x}A+=2+g}d.pgs_pids[f]=!0}l+=5+S}s===this.current_program_&&(this.pmt_===void 0&&y.v(this.TAG,`Parsed first PMT: ${JSON.stringify(d)}`),this.pmt_=d,(d.common_pids.h264||d.common_pids.h265||d.common_pids.av1)&&(this.has_video_=!0),(d.common_pids.adts_aac||d.common_pids.loas_aac||d.common_pids.ac3||d.common_pids.opus||d.common_pids.mp3)&&(this.has_audio_=!0))}parseSCTE35(e){const t=Qe(e);if(t.pts!==void 0){const i=Math.floor(t.pts/this.timescale_);t.pts=i}else t.nearest_pts=this.getNearestTimestampMilliseconds();this.onSCTE35Metadata&&this.onSCTE35Metadata(t)}parseH264Payload(e,t,i,s,n){const a=new we(e);let r=null;const d=[];let c=0,u=!1;for(r=a.readNextNaluPayload();r!=null;){const h=new ve(r);if(h.type===dt.kSliceSPS){const f=J.parseSPS(r.data);this.video_init_segment_dispatched_?this.detectVideoMetadataChange(h,f)===!0&&(y.v(this.TAG,"H264: Critical h264 metadata has been changed, attempt to re-generate InitSegment"),this.video_metadata_changed_=!0,this.video_metadata_={vps:void 0,sps:h,pps:void 0,av1c:void 0,details:f}):(this.video_metadata_.sps=h,this.video_metadata_.details=f)}else h.type===dt.kSlicePPS?(!this.video_init_segment_dispatched_||this.video_metadata_changed_)&&(this.video_metadata_.pps=h,this.video_metadata_.sps&&this.video_metadata_.pps&&(this.video_metadata_changed_&&this.dispatchVideoMediaSegment(),this.dispatchVideoInitSegment())):(h.type===dt.kSliceIDR||h.type===dt.kSliceNonIDR&&n===1)&&(u=!0);this.video_init_segment_dispatched_&&(d.push(h),c+=h.data.byteLength),r=a.readNextNaluPayload()}if(t==null||i==null)return;const m=Math.floor(t/this.timescale_),l=Math.floor(i/this.timescale_);if(d.length){const h=this.video_track_,f={units:d,length:c,isKeyframe:u,dts:l,pts:m,cts:m-l,file_position:s};h.samples.push(f),h.length+=c}}parseH265Payload(e,t,i,s,n){const a=new Ce(e);let r=null;const d=[];let c=0,u=!1;for(r=a.readNextNaluPayload();r!=null;){const h=new De(r);if(h.type===Z.kSliceVPS){if(!this.video_init_segment_dispatched_){const f=$.parseVPS(r.data);this.video_metadata_.vps=h,this.video_metadata_.details={...this.video_metadata_.details,...f}}}else if(h.type===Z.kSliceSPS){const f=$.parseSPS(r.data);this.video_init_segment_dispatched_?this.detectVideoMetadataChange(h,f)===!0&&(y.v(this.TAG,"H265: Critical h265 metadata has been changed, attempt to re-generate InitSegment"),this.video_metadata_changed_=!0,this.video_metadata_={vps:void 0,sps:h,pps:void 0,av1c:void 0,details:f}):(this.video_metadata_.sps=h,this.video_metadata_.details={...this.video_metadata_.details,...f})}else if(h.type===Z.kSlicePPS){if(!this.video_init_segment_dispatched_||this.video_metadata_changed_){const f=$.parsePPS(r.data);this.video_metadata_.pps=h,this.video_metadata_.details={...this.video_metadata_.details,...f},this.video_metadata_.vps&&this.video_metadata_.sps&&this.video_metadata_.pps&&(this.video_metadata_changed_&&this.dispatchVideoMediaSegment(),this.dispatchVideoInitSegment())}}else(h.type===Z.kSliceIDR_W_RADL||h.type===Z.kSliceIDR_N_LP||h.type===Z.kSliceCRA_NUT)&&(u=!0);this.video_init_segment_dispatched_&&(d.push(h),c+=h.data.byteLength),r=a.readNextNaluPayload()}if(t==null||i==null)return;const m=Math.floor(t/this.timescale_),l=Math.floor(i/this.timescale_);if(d.length){const h=this.video_track_,f={units:d,length:c,isKeyframe:u,dts:l,pts:m,cts:m-l,file_position:s};h.samples.push(f),h.length+=c}}detectVideoMetadataChange(e,t){const i=this.video_metadata_.details;if(t.codec_mimetype!==i.codec_mimetype)return y.v(this.TAG,`Video: Codec mimeType changed from ${i.codec_mimetype} to ${t.codec_mimetype}`),!0;const s=t.codec_size,n=i.codec_size;if(s.width!==n.width||s.height!==n.height)return y.v(this.TAG,`Video: Coded Resolution changed from ${n.width}x${n.height} to ${s.width}x${s.height}`),!0;const a=t.present_size,r=i.present_size;return a.width!==r.width?(y.v(this.TAG,`Video: Present resolution width changed from ${r.width} to ${a.width}`),!0):!1}isInitSegmentDispatched(){return this.has_video_&&this.has_audio_?this.video_init_segment_dispatched_&&this.audio_init_segment_dispatched_:this.has_video_&&!this.has_audio_?this.video_init_segment_dispatched_:!this.has_video_&&this.has_audio_?this.audio_init_segment_dispatched_:!1}dispatchVideoInitSegment(){const e=this.video_metadata_.details,t={};t.type="video",t.id=this.video_track_.id,t.timescale=1e3,t.duration=this.duration_;const i=e.codec_size,s=e.present_size,n=e.frame_rate,a=e.sar_ratio;t.codecWidth=i.width,t.codecHeight=i.height,t.presentWidth=s.width,t.presentHeight=s.height,t.profile=e.profile_string,t.level=e.level_string,t.bitDepth=e.bit_depth,t.chromaFormat=e.chroma_format,t.sarRatio=a,t.frameRate=n;const r=n.fps_den,d=n.fps_num;if(t.refSampleDuration=1e3*(r/d),t.codec=e.codec_mimetype,this.video_metadata_.av1c)t.av1c=this.video_metadata_.av1c,this.video_init_segment_dispatched_===!1&&y.v(this.TAG,`Generated first AV1 for mimeType: ${t.codec}`);else if(this.video_metadata_.vps){const u=this.video_metadata_.vps.data.subarray(4),m=this.video_metadata_.sps?.data.subarray(4),l=this.video_metadata_.pps?.data.subarray(4);if(m==null||l==null)return;const h=new ke(u,m,l,e);t.hvcc=h.getData(),this.video_init_segment_dispatched_===!1&&y.v(this.TAG,`Generated first HEVCDecoderConfigurationRecord for mimeType: ${t.codec}`)}else{const u=this.video_metadata_.sps?.data.subarray(4),m=this.video_metadata_.pps?.data.subarray(4);if(u==null||m==null)return;const l=new Be(u,m,e);t.avcc=l.getData(),this.video_init_segment_dispatched_===!1&&y.v(this.TAG,`Generated first AVCDecoderConfigurationRecord for mimeType: ${t.codec}`)}this.onTrackMetadata?.("video",t),this.video_init_segment_dispatched_=!0,this.video_metadata_changed_=!1;const c=this.media_info_;c.hasVideo=!0,c.width=t.codecWidth,c.height=t.codecHeight,c.fps=n.fps,c.profile=t.profile,c.level=t.level,c.refFrames=e.ref_frames,c.chromaFormat=e.chroma_format_string,c.sarNum=a.width,c.sarDen=a.height,c.videoCodec=t.codec,c.hasAudio&&c.audioCodec?c.mimeType=`video/mp2t; codecs="${c.videoCodec},${c.audioCodec}"`:c.mimeType=`video/mp2t; codecs="${c.videoCodec}"`,c.isComplete()&&this.onMediaInfo?.(c)}dispatchVideoMediaSegment(){this.isInitSegmentDispatched()&&this.video_track_.length&&this.onDataAvailable?.(null,this.video_track_)}dispatchAudioMediaSegment(){this.isInitSegmentDispatched()&&this.audio_track_.length&&this.onDataAvailable?.(this.audio_track_,null)}dispatchAudioVideoMediaSegment(){this.isInitSegmentDispatched()&&(this.audio_track_.length||this.video_track_.length)&&this.onDataAvailable?.(this.audio_track_,this.video_track_)}parseADTSAACPayload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;if(this.aac_last_incomplete_data_){const c=new Uint8Array(e.byteLength+this.aac_last_incomplete_data_.byteLength);c.set(this.aac_last_incomplete_data_,0),c.set(e,this.aac_last_incomplete_data_.byteLength),e=c}let i,s;if(t!==void 0&&(s=t/this.timescale_),this.audio_metadata_.codec==="aac"){if(t===void 0&&this.audio_last_sample_pts_!==void 0)i=1024/this.audio_metadata_.sampling_frequency*1e3,s=this.audio_last_sample_pts_+i;else if(t===void 0){y.w(this.TAG,"AAC: Unknown pts");return}if(this.aac_last_incomplete_data_&&this.audio_last_sample_pts_){i=1024/this.audio_metadata_.sampling_frequency*1e3;const c=this.audio_last_sample_pts_+i;Math.abs(c-s)>1&&(y.w(this.TAG,`AAC: Detected pts overlapped, expected: ${c}ms, PES pts: ${s}ms`),s=c)}}const n=new ce(e);let a=null,r=s,d;for(a=n.readNextAACFrame();a!=null;){i=1024/a.sampling_frequency*1e3;const c={codec:"aac",data:a};this.audio_init_segment_dispatched_===!1?(this.audio_metadata_={codec:"aac",audio_object_type:a.audio_object_type,sampling_freq_index:a.sampling_freq_index,sampling_frequency:a.sampling_frequency,channel_config:a.channel_config},this.dispatchAudioInitSegment(c)):this.detectAudioMetadataChange(c)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(c)),d=r;const u=Math.floor(r),m={unit:a.data,length:a.data.byteLength,pts:u,dts:u};this.audio_track_.samples.push(m),this.audio_track_.length+=a.data.byteLength,r+=i,a=n.readNextAACFrame()}n.hasIncompleteData()&&(this.aac_last_incomplete_data_=n.getIncompleteData()),d&&(this.audio_last_sample_pts_=d)}parseLOASAACPayload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;if(this.aac_last_incomplete_data_){const c=new Uint8Array(e.byteLength+this.aac_last_incomplete_data_.byteLength);c.set(this.aac_last_incomplete_data_,0),c.set(e,this.aac_last_incomplete_data_.byteLength),e=c}let i,s;if(t!==void 0&&(s=t/this.timescale_),this.audio_metadata_.codec==="aac"){if(t===void 0&&this.audio_last_sample_pts_!==void 0)i=1024/this.audio_metadata_.sampling_frequency*1e3,s=this.audio_last_sample_pts_+i;else if(t===void 0){y.w(this.TAG,"AAC: Unknown pts");return}if(this.aac_last_incomplete_data_&&this.audio_last_sample_pts_){i=1024/this.audio_metadata_.sampling_frequency*1e3;const c=this.audio_last_sample_pts_+i;Math.abs(c-s)>1&&(y.w(this.TAG,`AAC: Detected pts overlapped, expected: ${c}ms, PES pts: ${s}ms`),s=c)}}const n=new le(e);let a=null,r=s,d;for(a=n.readNextAACFrame(this.loas_previous_frame??void 0);a!=null;){this.loas_previous_frame=a,i=1024/a.sampling_frequency*1e3;const c={codec:"aac",data:a};this.audio_init_segment_dispatched_===!1?(this.audio_metadata_={codec:"aac",audio_object_type:a.audio_object_type,sampling_freq_index:a.sampling_freq_index,sampling_frequency:a.sampling_frequency,channel_config:a.channel_config},this.dispatchAudioInitSegment(c)):this.detectAudioMetadataChange(c)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(c)),d=r;const u=Math.floor(r),m={unit:a.data,length:a.data.byteLength,pts:u,dts:u};this.audio_track_.samples.push(m),this.audio_track_.length+=a.data.byteLength,r+=i,a=n.readNextAACFrame(this.loas_previous_frame??void 0)}n.hasIncompleteData()&&(this.aac_last_incomplete_data_=n.getIncompleteData()),d&&(this.audio_last_sample_pts_=d)}parseAC3Payload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;let i,s;if(t!==void 0&&(s=t/this.timescale_),this.audio_metadata_.codec==="ac-3"){if(t===void 0&&this.audio_last_sample_pts_!==void 0)i=1536/this.audio_metadata_.sampling_frequency*1e3,s=this.audio_last_sample_pts_+i;else if(t===void 0){y.w(this.TAG,"AC3: Unknown pts");return}}const n=new me(e);let a=null,r=s,d;for(a=n.readNextAC3Frame();a!=null;){i=1536/a.sampling_frequency*1e3;const c={codec:"ac-3",data:a};this.audio_init_segment_dispatched_===!1?(this.audio_metadata_={codec:"ac-3",sampling_frequency:a.sampling_frequency,bit_stream_identification:a.bit_stream_identification,bit_stream_mode:a.bit_stream_mode,low_frequency_effects_channel_on:a.low_frequency_effects_channel_on,channel_mode:a.channel_mode},this.dispatchAudioInitSegment(c)):this.detectAudioMetadataChange(c)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(c)),d=r;const u=Math.floor(r),m={unit:a.data,length:a.data.byteLength,pts:u,dts:u};this.audio_track_.samples.push(m),this.audio_track_.length+=a.data.byteLength,r+=i,a=n.readNextAC3Frame()}d&&(this.audio_last_sample_pts_=d)}parseEAC3Payload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;let i,s;if(t!==void 0&&(s=t/this.timescale_),this.audio_metadata_.codec==="ec-3"){if(t===void 0&&this.audio_last_sample_pts_!==void 0)i=256*this.audio_metadata_.num_blks/this.audio_metadata_.sampling_frequency*1e3,s=this.audio_last_sample_pts_+i;else if(t===void 0){y.w(this.TAG,"EAC3: Unknown pts");return}}const n=new ye(e);let a=null,r=s,d;for(a=n.readNextEAC3Frame();a!=null;){i=1536/a.sampling_frequency*1e3;const c={codec:"ec-3",data:a};this.audio_init_segment_dispatched_===!1?(this.audio_metadata_={codec:"ec-3",sampling_frequency:a.sampling_frequency,bit_stream_identification:a.bit_stream_identification,low_frequency_effects_channel_on:a.low_frequency_effects_channel_on,num_blks:a.num_blks,channel_mode:a.channel_mode},this.dispatchAudioInitSegment(c)):this.detectAudioMetadataChange(c)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(c)),d=r;const u=Math.floor(r),m={unit:a.data,length:a.data.byteLength,pts:u,dts:u};this.audio_track_.samples.push(m),this.audio_track_.length+=a.data.byteLength,r+=i,a=n.readNextEAC3Frame()}d&&(this.audio_last_sample_pts_=d)}parseOpusPayload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;let i,s;if(t!==void 0&&(s=t/this.timescale_),this.audio_metadata_.codec==="opus"){if(t===void 0&&this.audio_last_sample_pts_!==void 0)i=20,s=this.audio_last_sample_pts_+i;else if(t===void 0){y.w(this.TAG,"Opus: Unknown pts");return}}let n=s,a;for(let r=0;r<e.length;){i=20;const d=(e[r+1]&16)!==0,c=(e[r+1]&8)!==0;let u=r+2,m=0;for(;e[u]===255;)m+=255,u+=1;m+=e[u],u+=1,u+=d?2:0,u+=c?2:0,a=n;const l=Math.floor(n),h=e.slice(u,u+m),f={unit:h,length:h.byteLength,pts:l,dts:l};this.audio_track_.samples.push(f),this.audio_track_.length+=h.byteLength,n+=i,r=u+m}a&&(this.audio_last_sample_pts_=a)}parseMP3Payload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;const i=[44100,48e3,32e3,0],s=[22050,24e3,16e3,0],n=[11025,12e3,8e3,0],a=e[1]>>>3&3,r=(e[1]&6)>>1;(e[2]&240)>>>4;const d=(e[2]&12)>>>2,u=(e[3]>>>6&3)!==3?2:1;let m=0,l=34;switch(a){case 0:m=n[d];break;case 2:m=s[d];break;case 3:m=i[d];break}switch(r){case 1:l=34;break;case 2:l=33;break;case 3:l=32;break}if(l===33&&this.onRawAudioData){this.soft_decode_audio_codec_||(this.soft_decode_audio_codec_="mp2",y.i(this.TAG,"MP2 audio detected, enabling software decode"));const w=new Gt;w.object_type=l,w.sample_rate=m,w.channel_count=u,w.data=e;const v={codec:"mp3",data:w};this.audio_init_segment_dispatched_===!1?(this.audio_metadata_={codec:"mp3",object_type:l,sample_rate:m,channel_count:u},this.dispatchAudioInitSegment(v)):this.detectAudioMetadataChange(v)&&(this.dispatchAudioMediaSegment(),this.audio_metadata_={codec:"mp3",object_type:l,sample_rate:m,channel_count:u},this.dispatchAudioInitSegment(v));const A=(t??0)/this.timescale_;this.onRawAudioData({codec:"mp2",data:e,pts:A});return}const h=new Gt;h.object_type=l,h.sample_rate=m,h.channel_count=u,h.data=e;const f={codec:"mp3",data:h};this.audio_init_segment_dispatched_===!1?(this.audio_metadata_={codec:"mp3",object_type:l,sample_rate:m,channel_count:u},this.dispatchAudioInitSegment(f)):this.detectAudioMetadataChange(f)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(f));const S={unit:e,length:e.byteLength,pts:(t??0)/this.timescale_,dts:(t??0)/this.timescale_};this.audio_track_.samples.push(S),this.audio_track_.length+=e.byteLength}detectAudioMetadataChange(e){if(e.codec!==this.audio_metadata_.codec)return y.v(this.TAG,`Audio: Audio Codecs changed from ${this.audio_metadata_.codec} to ${e.codec}`),!0;if(e.codec==="aac"&&this.audio_metadata_.codec==="aac"){const t=e.data;if(t.audio_object_type!==this.audio_metadata_.audio_object_type)return y.v(this.TAG,`AAC: AudioObjectType changed from ${this.audio_metadata_.audio_object_type} to ${t.audio_object_type}`),!0;if(t.sampling_freq_index!==this.audio_metadata_.sampling_freq_index)return y.v(this.TAG,`AAC: SamplingFrequencyIndex changed from ${this.audio_metadata_.sampling_freq_index} to ${t.sampling_freq_index}`),!0;if(t.channel_config!==this.audio_metadata_.channel_config)return y.v(this.TAG,`AAC: Channel configuration changed from ${this.audio_metadata_.channel_config} to ${t.channel_config}`),!0}else if(e.codec==="ac-3"&&this.audio_metadata_.codec==="ac-3"){const t=e.data;if(t.sampling_frequency!==this.audio_metadata_.sampling_frequency)return y.v(this.TAG,`AC3: Sampling Frequency changed from ${this.audio_metadata_.sampling_frequency} to ${t.sampling_frequency}`),!0;if(t.bit_stream_identification!==this.audio_metadata_.bit_stream_identification)return y.v(this.TAG,`AC3: Bit Stream Identification changed from ${this.audio_metadata_.bit_stream_identification} to ${t.bit_stream_identification}`),!0;if(t.bit_stream_mode!==this.audio_metadata_.bit_stream_mode)return y.v(this.TAG,`AC3: BitStream Mode changed from ${this.audio_metadata_.bit_stream_mode} to ${t.bit_stream_mode}`),!0;if(t.channel_mode!==this.audio_metadata_.channel_mode)return y.v(this.TAG,`AC3: Channel Mode changed from ${this.audio_metadata_.channel_mode} to ${t.channel_mode}`),!0;if(t.low_frequency_effects_channel_on!==this.audio_metadata_.low_frequency_effects_channel_on)return y.v(this.TAG,`AC3: Low Frequency Effects Channel On changed from ${this.audio_metadata_.low_frequency_effects_channel_on} to ${t.low_frequency_effects_channel_on}`),!0}else if(e.codec==="opus"&&this.audio_metadata_.codec==="opus"){const t=e.meta;if(t.sample_rate!==this.audio_metadata_.sample_rate)return y.v(this.TAG,`Opus: SamplingFrequencyIndex changed from ${this.audio_metadata_.sample_rate} to ${t.sample_rate}`),!0;if(t.channel_count!==this.audio_metadata_.channel_count)return y.v(this.TAG,`Opus: Channel count changed from ${this.audio_metadata_.channel_count} to ${t.channel_count}`),!0}else if(e.codec==="mp3"&&this.audio_metadata_.codec==="mp3"){const t=e.data;if(t.object_type!==this.audio_metadata_.object_type)return y.v(this.TAG,`MP3: AudioObjectType changed from ${this.audio_metadata_.object_type} to ${t.object_type}`),!0;if(t.sample_rate!==this.audio_metadata_.sample_rate)return y.v(this.TAG,`MP3: SamplingFrequencyIndex changed from ${this.audio_metadata_.sample_rate} to ${t.sample_rate}`),!0;if(t.channel_count!==this.audio_metadata_.channel_count)return y.v(this.TAG,`MP3: Channel count changed from ${this.audio_metadata_.channel_count} to ${t.channel_count}`),!0}return!1}dispatchAudioInitSegment(e){const t={};if(t.type="audio",t.id=this.audio_track_.id,t.timescale=1e3,t.duration=this.duration_,this.audio_metadata_.codec==="aac"){if(e.codec!=="aac")return;const s=new he(e.data);t.audioSampleRate=s.sampling_rate,t.channelCount=s.channel_count,t.codec=s.codec_mimetype,t.originalCodec=s.original_codec_mimetype,t.config=s.config,t.refSampleDuration=1024/t.audioSampleRate*t.timescale}else if(this.audio_metadata_.codec==="ac-3"){if(e.codec!=="ac-3")return;const s=new pe(e.data);t.audioSampleRate=s.sampling_rate,t.channelCount=s.channel_count,t.codec=s.codec_mimetype,t.originalCodec=s.original_codec_mimetype,t.config=s.config,t.refSampleDuration=1536/t.audioSampleRate*t.timescale}else if(this.audio_metadata_.codec==="ec-3"){if(e.codec!=="ec-3")return;const s=new be(e.data);t.audioSampleRate=s.sampling_rate,t.channelCount=s.channel_count,t.codec=s.codec_mimetype,t.originalCodec=s.original_codec_mimetype,t.config=s.config,t.refSampleDuration=256*s.num_blks/t.audioSampleRate*t.timescale}else this.audio_metadata_.codec==="opus"?(t.audioSampleRate=this.audio_metadata_.sample_rate,t.channelCount=this.audio_metadata_.channel_count,t.channelConfigCode=this.audio_metadata_.channel_config_code,t.codec="opus",t.originalCodec="opus",t.config=void 0,t.refSampleDuration=20):this.audio_metadata_.codec==="mp3"&&(t.audioSampleRate=this.audio_metadata_.sample_rate,t.channelCount=this.audio_metadata_.channel_count,t.codec="mp3",t.originalCodec="mp3",t.config=void 0);if(this.audio_init_segment_dispatched_===!1&&y.v(this.TAG,`Generated first AudioSpecificConfig for mimeType: ${t.codec}`),this.soft_decode_audio_codec_){const s=t.audioSampleRate||48e3,n=t.channelCount||2,a=rt.indexOf(s),r=a!==-1?a:3,d={type:"audio",id:this.audio_track_.id,timescale:1e3,duration:this.duration_,audioSampleRate:s,channelCount:n,codec:"mp4a.40.2",originalCodec:"mp4a.40.2",config:[16|(r&15)>>>1,(r&1)<<7|(n&15)<<3],refSampleDuration:1024/s*1e3,silentAudioMode:!0};this.onTrackMetadata?.("audio",d)}else this.onTrackMetadata?.("audio",t);this.audio_init_segment_dispatched_=!0,this.video_metadata_changed_=!1;const i=this.media_info_;i.hasAudio=!0,i.audioCodec=t.originalCodec,i.audioSampleRate=t.audioSampleRate,i.audioChannelCount=t.channelCount,i.hasVideo&&i.videoCodec?i.mimeType=`video/mp2t; codecs="${i.videoCodec},${i.audioCodec}"`:i.mimeType=`video/mp2t; codecs="${i.audioCodec}"`,i.isComplete()&&this.onMediaInfo?.(i)}dispatchPESPrivateDataDescriptor(e,t,i){const s=new Te;s.pid=e,s.stream_type=t,s.descriptor=i,this.onPESPrivateDataDescriptor&&this.onPESPrivateDataDescriptor(s)}parsePESPrivateDataPayload(e,t,i,s,n){const a=new vt;if(a.pid=s,a.stream_id=n,a.len=e.byteLength,a.data=e,t!==void 0){const r=Math.floor(t/this.timescale_);a.pts=r}else a.nearest_pts=this.getNearestTimestampMilliseconds();if(i!==void 0){const r=Math.floor(i/this.timescale_);a.dts=r}this.onPESPrivateData&&this.onPESPrivateData(a)}parseTimedID3MetadataPayload(e,t,i,s,n){const a=new vt;if(a.pid=s,a.stream_id=n,a.len=e.byteLength,a.data=e,t!==void 0){const r=Math.floor(t/this.timescale_);a.pts=r}if(i!==void 0){const r=Math.floor(i/this.timescale_);a.dts=r}this.onTimedID3Metadata&&this.onTimedID3Metadata(a)}parsePGSPayload(e,t,i,s,n,a){const r=new Pe;if(r.pid=s,r.lang=a,r.stream_id=n,r.len=e.byteLength,r.data=e,t!==void 0){const d=Math.floor(t/this.timescale_);r.pts=d}if(i!==void 0){const d=Math.floor(i/this.timescale_);r.dts=d}this.onPGSSubtitleData&&this.onPGSSubtitleData(r)}parseSynchronousKLVMetadataPayload(e,t,i,s,n){const a=new Ee;if(a.pid=s,a.stream_id=n,a.len=e.byteLength,a.data=e,t!==void 0){const r=Math.floor(t/this.timescale_);a.pts=r}if(i!==void 0){const r=Math.floor(i/this.timescale_);a.dts=r}a.access_units=Le(e),this.onSynchronousKLVMetadata&&this.onSynchronousKLVMetadata(a)}parseAsynchronousKLVMetadataPayload(e,t,i){const s=new vt;s.pid=t,s.stream_id=i,s.len=e.byteLength,s.data=e,this.onAsynchronousKLVMetadata&&this.onAsynchronousKLVMetadata(s)}parseSMPTE2038MetadataPayload(e,t,i,s,n){const a=new ts;if(a.pid=s,a.stream_id=n,a.len=e.byteLength,a.data=e,t!==void 0){const r=Math.floor(t/this.timescale_);a.pts=r}if(a.nearest_pts=this.getNearestTimestampMilliseconds(),i!==void 0){const r=Math.floor(i/this.timescale_);a.dts=r}a.ancillaries=es(e),this.onSMPTE2038Metadata&&this.onSMPTE2038Metadata(a)}getNearestTimestampMilliseconds(){if(this.audio_last_sample_pts_!==void 0)return Math.floor(this.audio_last_sample_pts_);if(this.last_pcr_!==void 0)return Math.floor(this.last_pcr_/300/this.timescale_)}getPcrBase(e){let t=e[6]*33554432+e[7]*131072+e[8]*512+e[9]*2+(e[10]&128)/128+this.timestamp_offset_;return t+4294967296<this.last_pcr_base_&&(t+=8589934592,this.timestamp_offset_+=8589934592),this.last_pcr_base_=t,t}getTimestamp(e,t){let i=(e[t]&14)*536870912+(e[t+1]&255)*4194304+(e[t+2]&254)*16384+(e[t+3]&255)*128+(e[t+4]&254)/2+this.timestamp_offset_;return i+4294967296<this.last_pcr_base_&&(i+=8589934592),i}}const W={};function ss(){const o=self.navigator.userAgent.toLowerCase(),e=/(edge)\\/([\\w.]+)/.exec(o)||/(opr)[/]([\\w.]+)/.exec(o)||/(chrome)[ /]([\\w.]+)/.exec(o)||/(iemobile)[/]([\\w.]+)/.exec(o)||/(version)(applewebkit)[ /]([\\w.]+).*(safari)[ /]([\\w.]+)/.exec(o)||/(webkit)[ /]([\\w.]+).*(version)[ /]([\\w.]+).*(safari)[ /]([\\w.]+)/.exec(o)||/(webkit)[ /]([\\w.]+)/.exec(o)||/(opera)(?:.*version|)[ /]([\\w.]+)/.exec(o)||/(msie) ([\\w.]+)/.exec(o)||o.indexOf("trident")>=0&&/(rv)(?::| )([\\w.]+)/.exec(o)||o.indexOf("compatible")<0&&/(firefox)[ /]([\\w.]+)/.exec(o)||[],t=/(ipad)/.exec(o)||/(ipod)/.exec(o)||/(windows phone)/.exec(o)||/(iphone)/.exec(o)||/(kindle)/.exec(o)||/(android)/.exec(o)||/(windows)/.exec(o)||/(mac)/.exec(o)||/(linux)/.exec(o)||/(cros)/.exec(o)||[],i={browser:e[5]||e[3]||e[1]||"",version:e[2]||e[4]||"0",majorVersion:e[4]||e[2]||"0",platform:t[0]||""},s={};if(i.browser){s[i.browser]=!0;const n=i.majorVersion.split(".");s.version={major:parseInt(i.majorVersion,10),string:i.version},n.length>1&&(s.version.minor=parseInt(n[1],10)),n.length>2&&(s.version.build=parseInt(n[2],10))}if(i.platform&&(s[i.platform]=!0),(s.chrome||s.opr||s.safari)&&(s.webkit=!0),s.rv||s.iemobile){s.rv&&delete s.rv;const n="msie";i.browser=n,s[n]=!0}if(s.edge){delete s.edge;const n="msedge";i.browser=n,s[n]=!0}if(s.opr){const n="opera";i.browser=n,s[n]=!0}if(s.safari&&s.android){const n="android";i.browser=n,s[n]=!0}s.name=i.browser,s.platform=i.platform;for(const n in W)Object.hasOwn(W,n)&&delete W[n];Object.assign(W,s)}ss();const _t={EXCEPTION:"Exception",HTTP_STATUS_CODE_INVALID:"HttpStatusCodeInvalid",EARLY_EOF:"EarlyEof"};class is{TAG="FetchLoader";onDataArrival;onSeeked;onError;onComplete;onHLSDetected;_config;_dataSource;_extraData;_stashUsed;_bufferSize;_stashBuffer;_stashByteStart;_currentRange;_paused;_resumeFrom;_status;_requestAbort;_abortController;_contentLength;_receivedLength;constructor(e,t,i){this._config=t,this._dataSource=e,this._extraData=i,this._stashUsed=0,this._bufferSize=1024*1024,this._stashBuffer=new ArrayBuffer(this._bufferSize),this._stashByteStart=0,this._currentRange=null,this._paused=!1,this._resumeFrom=0,this._status=0,this._requestAbort=!1,this._abortController=null,this._contentLength=null,this._receivedLength=0,this.onDataArrival=null,this.onSeeked=null,this.onError=null,this.onComplete=null,this.onHLSDetected=null}destroy(){this.isWorking()&&this.abort(),this._dataSource=null,this._stashBuffer=null,this._stashUsed=this._bufferSize=this._stashByteStart=0,this._currentRange=null,this._status=0,this.onDataArrival=null,this.onSeeked=null,this.onError=null,this.onComplete=null,this.onHLSDetected=null,this._extraData=null}isWorking(){return(this._status===1||this._status===2)&&!this._paused}isPaused(){return this._paused}get extraData(){return this._extraData}set extraData(e){this._extraData=e}get currentURL(){return this._dataSource?.url??""}open(){this._currentRange={from:0,to:-1},this._startFetch(Object.assign({},this._currentRange))}abort(){this._abortFetch(),this._paused&&(this._paused=!1,this._resumeFrom=0)}pause(){this.isWorking()&&(this._abortFetch(),this._stashUsed!==0?(this._resumeFrom=this._stashByteStart,this._currentRange.to=this._stashByteStart-1):this._resumeFrom=(this._currentRange?.to??0)+1,this._stashUsed=0,this._stashByteStart=0,this._paused=!0)}resume(){if(this._paused){this._paused=!1;const e=this._resumeFrom;this._resumeFrom=0,this._internalSeek(e)}}_buildRangeHeaders(e,t){const i={};if(t.from!==0||t.to!==-1){let s;t.to!==-1?s=`bytes=${t.from.toString()}-${t.to.toString()}`:s=`bytes=${t.from.toString()}-`,i.Range=s}return{url:e,headers:i}}_startFetch(e){this._requestAbort=!1,this._contentLength=null,this._receivedLength=0;const t=this._dataSource,i=t.url,s=this._buildRangeHeaders(i,e),n=new self.Headers;for(const r in s.headers)Object.hasOwn(s.headers,r)&&n.append(r,s.headers[r]);if(typeof this._config.headers=="object"&&this._config.headers)for(const r in this._config.headers)n.append(r,this._config.headers[r]);const a={method:"GET",headers:n,mode:"cors",cache:"default",referrerPolicy:"no-referrer-when-downgrade"};t.cors===!1&&(a.mode="same-origin"),t.withCredentials&&(a.credentials="include"),t.referrerPolicy&&(a.referrerPolicy=t.referrerPolicy),self.AbortController&&(this._abortController=new self.AbortController,a.signal=this._abortController.signal),this._status=1,self.fetch(s.url,a).then(r=>{if(this._requestAbort){this._status=0,r.body?.cancel();return}if(r.ok&&r.status>=200&&r.status<=299){const d=r.headers.get("Content-Type")?.toLowerCase()??"";if(d.includes("mpegurl")||d.includes("m3u")){r.body?.cancel(),this._status=0,this.onHLSDetected?.();return}const c=r.headers.get("Content-Length");if(c!=null){const u=parseInt(c,10);u!==0&&(this._contentLength=u)}return this._pump(r.body.getReader(),e)}else{this._status=3;const d={code:r.status,msg:r.statusText};if(this.onError)this._handleLoaderError(_t.HTTP_STATUS_CODE_INVALID,d);else throw new Lt(`FetchLoader: Http code invalid, ${r.status} ${r.statusText}`)}}).catch(r=>{if(this._abortController?.signal.aborted)return;this._status=3;const c={code:-1,msg:String(r.message??"")};if(this.onError)this._handleLoaderError(_t.EXCEPTION,c);else throw r})}_pump(e,t){return e.read().then(i=>{if(i.done)if(this._contentLength!==null&&this._receivedLength<this._contentLength){this._status=3;const s={code:-1,msg:"Fetch stream meet Early-EOF"};this._handleLoaderError(_t.EARLY_EOF,s)}else this._status=4,this._onFetchComplete(t.from,t.from+this._receivedLength-1);else{if(this._abortController?.signal.aborted){this._status=4;return}else if(this._requestAbort===!0)return this._status=4,e.cancel();this._status=2;const s=i.value?.buffer,n=t.from+this._receivedLength;this._receivedLength+=s.byteLength,this._onFetchChunkArrival(s,n),this._pump(e,t)}}).catch(i=>{if(this._abortController?.signal.aborted){this._status=4;return}const s=i,n=typeof s.code=="number"?s.code:-1,a=typeof s.message=="string"?s.message:"";if(n===11&&W.msedge)return;this._status=3;let r,d;(n===19||a==="network error")&&(this._contentLength===null||this._contentLength!==null&&this._receivedLength<this._contentLength)?(r=_t.EARLY_EOF,d={code:n,msg:"Fetch stream meet Early-EOF"}):(r=_t.EXCEPTION,d={code:n,msg:a}),this._handleLoaderError(r,d)})}_abortFetch(){if(this._requestAbort=!0,(this._status!==2||!W.chrome)&&this._abortController)try{this._abortController.abort()}catch{}}_internalSeek(e){(this._status===1||this._status===2)&&this._abortFetch(),this._flushStashBuffer(!0);const t={from:e,to:-1};this._currentRange={from:t.from,to:-1},this._requestAbort=!1,this._startFetch(t),this.onSeeked&&this.onSeeked()}_expandBuffer(e){let t=this._bufferSize;for(;t<e;)t*=2;if(t===this._bufferSize)return;const i=new ArrayBuffer(t);if(this._stashUsed>0){const s=new Uint8Array(this._stashBuffer,0,this._stashUsed);new Uint8Array(i,0,t).set(s,0)}this._stashBuffer=i,this._bufferSize=t}_dispatchChunks(e,t){return this._currentRange.to=t+e.byteLength-1,this.onDataArrival?.(e,t)??0}_flushStashBuffer(e){if(this._stashUsed>0){const t=this._stashBuffer.slice(0,this._stashUsed),i=this._dispatchChunks(t,this._stashByteStart),s=t.byteLength-i;if(i<t.byteLength)if(e)y.w(this.TAG,`${s} bytes unconsumed data remain when flush buffer, dropped`);else{if(i>0){const n=new Uint8Array(this._stashBuffer,0,this._bufferSize),a=new Uint8Array(t,i);n.set(a,0),this._stashUsed=a.byteLength,this._stashByteStart+=i}return 0}return this._stashUsed=0,this._stashByteStart=0,s}return 0}_onFetchChunkArrival(e,t){if(!this.onDataArrival)throw new ot("FetchLoader: No existing consumer (onDataArrival) callback!");if(!this._paused)if(this._stashUsed===0){const i=this._dispatchChunks(e,t);if(i<e.byteLength){const s=e.byteLength-i;s>this._bufferSize&&this._expandBuffer(s),new Uint8Array(this._stashBuffer,0,this._bufferSize).set(new Uint8Array(e,i),0),this._stashUsed+=s,this._stashByteStart=t+i}}else{this._stashUsed+e.byteLength>this._bufferSize&&this._expandBuffer(this._stashUsed+e.byteLength);const i=new Uint8Array(this._stashBuffer,0,this._bufferSize);i.set(new Uint8Array(e),this._stashUsed),this._stashUsed+=e.byteLength;const s=this._dispatchChunks(this._stashBuffer.slice(0,this._stashUsed),this._stashByteStart);if(s<this._stashUsed&&s>0){const n=new Uint8Array(this._stashBuffer,s);i.set(n,0)}this._stashUsed-=s,this._stashByteStart+=s}}_onFetchComplete(e,t){this._flushStashBuffer(!0),this.onComplete&&this.onComplete(this._extraData)}_handleLoaderError(e,t){if(y.e(this.TAG,`Loader error, code = ${t.code}, msg = ${t.msg}`),this._flushStashBuffer(!1),this.onError)this.onError(e,t);else throw new Lt(`IOException: ${t.msg}`)}}class Q{dts;pts;duration;originalDts;isSyncPoint;fileposition;constructor(e,t,i,s,n){this.dts=e,this.pts=t,this.duration=i,this.originalDts=s,this.isSyncPoint=n,this.fileposition=null}}class Bt{beginDts;endDts;beginPts;endPts;originalBeginDts;originalEndDts;syncPoints;firstSample;lastSample;constructor(){this.beginDts=0,this.endDts=0,this.beginPts=0,this.endPts=0,this.originalBeginDts=0,this.originalEndDts=0,this.syncPoints=[],this.firstSample=null,this.lastSample=null}appendSyncPoint(e){e.isSyncPoint=!0,this.syncPoints.push(e)}}class Ot{_type;_list;_lastAppendLocation;constructor(e){this._type=e,this._list=[],this._lastAppendLocation=-1}get type(){return this._type}get length(){return this._list.length}isEmpty(){return this._list.length===0}clear(){this._list=[],this._lastAppendLocation=-1}_searchNearestSegmentBefore(e){const t=this._list;if(t.length===0)return-2;const i=t.length-1;let s=0,n=0,a=i,r=0;if(e<t[0].originalBeginDts)return r=-1,r;for(;n<=a;)if(s=n+Math.floor((a-n)/2),s===i||e>(t[s].lastSample?.originalDts??0)&&e<t[s+1].originalBeginDts){r=s;break}else t[s].originalBeginDts<e?n=s+1:a=s-1;return r}_searchNearestSegmentAfter(e){return this._searchNearestSegmentBefore(e)+1}append(e){const t=this._list,i=e,s=this._lastAppendLocation;let n=0;s!==-1&&s<t.length&&i.originalBeginDts>=(t[s].lastSample?.originalDts??0)&&(s===t.length-1||s<t.length-1&&i.originalBeginDts<t[s+1].originalBeginDts)?n=s+1:t.length>0&&(n=this._searchNearestSegmentBefore(i.originalBeginDts)+1),this._lastAppendLocation=n,this._list.splice(n,0,i)}getLastSegmentBefore(e){const t=this._searchNearestSegmentBefore(e);return t>=0?this._list[t]:null}getLastSampleBefore(e){const t=this.getLastSegmentBefore(e);return t!=null?t.lastSample:null}getLastSyncPointBefore(e){let t=this._searchNearestSegmentBefore(e),i=this._list[t].syncPoints;for(;i.length===0&&t>0;)t--,i=this._list[t].syncPoints;return i.length>0?i[i.length-1]:null}}function as(o,e){if(o==="mp4a.40.2"){if(e===1)return new Uint8Array([0,200,0,128,35,128]);if(e===2)return new Uint8Array([33,0,73,144,2,25,0,35,128]);if(e===3)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,142]);if(e===4)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,128,44,128,8,2,56]);if(e===5)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,130,48,4,153,0,33,144,2,56]);if(e===6)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,130,48,4,153,0,33,144,2,0,178,0,32,8,224])}else{if(e===1)return new Uint8Array([1,64,34,128,163,78,230,128,186,8,0,0,0,28,6,241,193,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94]);if(e===2)return new Uint8Array([1,64,34,128,163,94,230,128,186,8,0,0,0,0,149,0,6,241,161,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94]);if(e===3)return new Uint8Array([1,64,34,128,163,94,230,128,186,8,0,0,0,0,149,0,6,241,161,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94])}return null}const xt={getSilentFrame:as};class _{static types;static constants;static init(){_.types={avc1:[],avcC:[],btrt:[],dinf:[],dref:[],esds:[],ftyp:[],hdlr:[],hvc1:[],hvcC:[],av01:[],av1C:[],mdat:[],mdhd:[],mdia:[],mfhd:[],minf:[],moof:[],moov:[],mp4a:[],mvex:[],mvhd:[],sdtp:[],stbl:[],stco:[],stsc:[],stsd:[],stsz:[],stts:[],tfdt:[],tfhd:[],traf:[],trak:[],trun:[],trex:[],tkhd:[],vmhd:[],smhd:[],chnl:[],".mp3":[],Opus:[],dOps:[],fLaC:[],dfLa:[],ipcm:[],pcmC:[],"ac-3":[],dac3:[],"ec-3":[],dec3:[]};for(const t in _.types)Object.hasOwn(_.types,t)&&(_.types[t]=[t.charCodeAt(0),t.charCodeAt(1),t.charCodeAt(2),t.charCodeAt(3)]);_.constants={};const e=_.constants;e.FTYP=new Uint8Array([105,115,111,109,0,0,0,1,105,115,111,109,97,118,99,49]),e.STSD_PREFIX=new Uint8Array([0,0,0,0,0,0,0,1]),e.STTS=new Uint8Array([0,0,0,0,0,0,0,0]),e.STSC=e.STCO=e.STTS,e.STSZ=new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0]),e.HDLR_VIDEO=new Uint8Array([0,0,0,0,0,0,0,0,118,105,100,101,0,0,0,0,0,0,0,0,0,0,0,0,86,105,100,101,111,72,97,110,100,108,101,114,0]),e.HDLR_AUDIO=new Uint8Array([0,0,0,0,0,0,0,0,115,111,117,110,0,0,0,0,0,0,0,0,0,0,0,0,83,111,117,110,100,72,97,110,100,108,101,114,0]),e.DREF=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,12,117,114,108,32,0,0,0,1]),e.SMHD=new Uint8Array([0,0,0,0,0,0,0,0]),e.VMHD=new Uint8Array([0,0,0,1,0,0,0,0,0,0,0,0])}static box(e,...t){let i=8,s;const n=t.length;for(let r=0;r<n;r++)i+=t[r].byteLength;s=new Uint8Array(i),s[0]=i>>>24&255,s[1]=i>>>16&255,s[2]=i>>>8&255,s[3]=i&255,s.set(e,4);let a=8;for(let r=0;r<n;r++)s.set(t[r],a),a+=t[r].byteLength;return s}static generateInitSegment(e){const t=_.box(_.types.ftyp,_.constants.FTYP),i=_.moov(e),s=new Uint8Array(t.byteLength+i.byteLength);return s.set(t,0),s.set(i,t.byteLength),s}static moov(e){const t=_.mvhd(e.timescale,e.duration),i=_.trak(e),s=_.mvex(e);return _.box(_.types.moov,t,i,s)}static mvhd(e,t){return _.box(_.types.mvhd,new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,e>>>24&255,e>>>16&255,e>>>8&255,e&255,t>>>24&255,t>>>16&255,t>>>8&255,t&255,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255]))}static trak(e){return _.box(_.types.trak,_.tkhd(e),_.mdia(e))}static tkhd(e){const t=e.id,i=e.duration,s=e.presentWidth||0,n=e.presentHeight||0;return _.box(_.types.tkhd,new Uint8Array([0,0,0,7,0,0,0,0,0,0,0,0,t>>>24&255,t>>>16&255,t>>>8&255,t&255,0,0,0,0,i>>>24&255,i>>>16&255,i>>>8&255,i&255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,s>>>8&255,s&255,0,0,n>>>8&255,n&255,0,0]))}static mdia(e){return _.box(_.types.mdia,_.mdhd(e),_.hdlr(e),_.minf(e))}static mdhd(e){const t=e.timescale,i=e.duration;return _.box(_.types.mdhd,new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,t>>>24&255,t>>>16&255,t>>>8&255,t&255,i>>>24&255,i>>>16&255,i>>>8&255,i&255,85,196,0,0]))}static hdlr(e){let t;return e.type==="audio"?t=_.constants.HDLR_AUDIO:t=_.constants.HDLR_VIDEO,_.box(_.types.hdlr,t)}static minf(e){let t;return e.type==="audio"?t=_.box(_.types.smhd,_.constants.SMHD):t=_.box(_.types.vmhd,_.constants.VMHD),_.box(_.types.minf,t,_.dinf(),_.stbl(e))}static dinf(){return _.box(_.types.dinf,_.box(_.types.dref,_.constants.DREF))}static stbl(e){return _.box(_.types.stbl,_.stsd(e),_.box(_.types.stts,_.constants.STTS),_.box(_.types.stsc,_.constants.STSC),_.box(_.types.stsz,_.constants.STSZ),_.box(_.types.stco,_.constants.STCO))}static stsd(e){return e.type==="audio"?e.codec==="mp3"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.mp3(e)):e.codec==="ac-3"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.ac3(e)):e.codec==="ec-3"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.ec3(e)):e.codec==="opus"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.Opus(e)):e.codec==="flac"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.fLaC(e)):e.codec==="ipcm"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.ipcm(e)):_.box(_.types.stsd,_.constants.STSD_PREFIX,_.mp4a(e)):e.type==="video"&&e.codec.startsWith("hvc1")?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.hvc1(e)):e.type==="video"&&e.codec.startsWith("av01")?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.av01(e)):_.box(_.types.stsd,_.constants.STSD_PREFIX,_.avc1(e))}static mp3(e){const t=e.channelCount||0,i=e.audioSampleRate||0,s=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,16,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types[".mp3"],s)}static mp4a(e){const t=e.channelCount||0,i=e.audioSampleRate||0,s=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,16,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types.mp4a,s,_.esds(e))}static ac3(e){const t=e.channelCount||0,i=e.audioSampleRate||0,s=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,16,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types["ac-3"],s,_.box(_.types.dac3,new Uint8Array(e.config)))}static ec3(e){const t=e.channelCount||0,i=e.audioSampleRate||0,s=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,16,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types["ec-3"],s,_.box(_.types.dec3,new Uint8Array(e.config)))}static esds(e){const t=e.config||[],i=t.length,s=new Uint8Array([0,0,0,0,3,23+i,0,1,0,4,15+i,64,21,0,0,0,0,0,0,0,0,0,0,0,5].concat([i]).concat(t).concat([6,1,2]));return _.box(_.types.esds,s)}static Opus(e){const t=e.channelCount||0,i=e.audioSampleRate||0,s=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,16,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types.Opus,s,_.dOps(e))}static dOps(e){const t=e.channelCount||0,i=e.channelConfigCode||0,s=e.audioSampleRate||0;if(e.config)return _.box(_.types.dOps,e.config);let n=[];switch(i){case 1:case 2:n=[0];break;case 0:n=[255,1,1,0,1];break;case 128:n=[255,2,0,0,1];break;case 3:n=[1,2,1,0,2,1];break;case 4:n=[1,2,2,0,1,2,3];break;case 5:n=[1,3,2,0,4,1,2,3];break;case 6:n=[1,4,2,0,4,1,2,3,5];break;case 7:n=[1,4,2,0,4,1,2,3,5,6];break;case 8:n=[1,5,3,0,6,1,2,3,4,5,7];break;case 130:n=[1,1,2,0,1];break;case 131:n=[1,1,3,0,1,2];break;case 132:n=[1,1,4,0,1,2,3];break;case 133:n=[1,1,5,0,1,2,3,4];break;case 134:n=[1,1,6,0,1,2,3,4,5];break;case 135:n=[1,1,7,0,1,2,3,4,5,6];break;case 136:n=[1,1,8,0,1,2,3,4,5,6,7];break}const a=new Uint8Array([0,t,0,0,s>>>24&255,s>>>17&255,s>>>8&255,s>>>0&255,0,0,...n]);return _.box(_.types.dOps,a)}static fLaC(e){const t=e.channelCount||0,i=Math.min(e.audioSampleRate||0,65535),s=e.sampleSize||0,n=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,s,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types.fLaC,n,_.dfLa(e))}static dfLa(e){const t=new Uint8Array([0,0,0,0,...e.config]);return _.box(_.types.dfLa,t)}static ipcm(e){const t=e.channelCount||0,i=Math.min(e.audioSampleRate||0,65535),s=e.sampleSize||0,n=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,s,0,0,0,0,i>>>8&255,i&255,0,0]);return e.channelCount===1?_.box(_.types.ipcm,n,_.pcmC(e)):_.box(_.types.ipcm,n,_.chnl(e),_.pcmC(e))}static chnl(e){const t=new Uint8Array([0,0,0,0,1,e.channelCount||0,0,0,0,0,0,0,0,0]);return _.box(_.types.chnl,t)}static pcmC(e){const t=e.littleEndian?1:0,i=e.sampleSize||0,s=new Uint8Array([0,0,0,0,t,i]);return _.box(_.types.pcmC,s)}static avc1(e){if(e.avcc==null)throw new Error("MP4: avcc is required for avc1 box");const t=e.avcc,i=e.codecWidth||0,s=e.codecHeight||0,n=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,i>>>8&255,i&255,s>>>8&255,s&255,0,72,0,0,0,72,0,0,0,0,0,0,0,1,10,120,113,113,47,102,108,118,46,106,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,255,255]);return _.box(_.types.avc1,n,_.box(_.types.avcC,t))}static hvc1(e){if(e.hvcc==null)throw new Error("MP4: hvcc is required for hvc1 box");const t=e.hvcc,i=e.codecWidth||0,s=e.codecHeight||0,n=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,i>>>8&255,i&255,s>>>8&255,s&255,0,72,0,0,0,72,0,0,0,0,0,0,0,1,10,120,113,113,47,102,108,118,46,106,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,255,255]);return _.box(_.types.hvc1,n,_.box(_.types.hvcC,t))}static av01(e){if(e.av1c==null)throw new Error("MP4: av1c is required for av01 box");const t=e.av1c,i=e.codecWidth||192,s=e.codecHeight||108,n=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,i>>>8&255,i&255,s>>>8&255,s&255,0,72,0,0,0,72,0,0,0,0,0,0,0,1,10,120,113,113,47,102,108,118,46,106,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,255,255]);return _.box(_.types.av01,n,_.box(_.types.av1C,t))}static mvex(e){return _.box(_.types.mvex,_.trex(e))}static trex(e){const t=e.id,i=new Uint8Array([0,0,0,0,t>>>24&255,t>>>16&255,t>>>8&255,t&255,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1]);return _.box(_.types.trex,i)}static moof(e,t){return _.box(_.types.moof,_.mfhd(e.sequenceNumber),_.traf(e,t))}static mfhd(e){const t=new Uint8Array([0,0,0,0,e>>>24&255,e>>>16&255,e>>>8&255,e&255]);return _.box(_.types.mfhd,t)}static traf(e,t){const i=e.id,s=_.box(_.types.tfhd,new Uint8Array([0,0,0,0,i>>>24&255,i>>>16&255,i>>>8&255,i&255])),n=_.box(_.types.tfdt,new Uint8Array([0,0,0,0,t>>>24&255,t>>>16&255,t>>>8&255,t&255])),a=_.sdtp(e),r=_.trun(e,a.byteLength+16+16+8+16+8+8);return _.box(_.types.traf,s,n,r,a)}static sdtp(e){const t=e.samples||[],i=t.length,s=new Uint8Array(4+i);for(let n=0;n<i;n++){const a=t[n].flags;s[n+4]=a.isLeading<<6|a.dependsOn<<4|a.isDependedOn<<2|a.hasRedundancy}return _.box(_.types.sdtp,s)}static trun(e,t){const i=e.samples||[],s=i.length,n=12+16*s,a=new Uint8Array(n);t+=8+n,a.set([0,0,15,1,s>>>24&255,s>>>16&255,s>>>8&255,s&255,t>>>24&255,t>>>16&255,t>>>8&255,t&255],0);for(let r=0;r<s;r++){const d=i[r].duration,c=i[r].size,u=i[r].flags,m=i[r].cts;a.set([d>>>24&255,d>>>16&255,d>>>8&255,d&255,c>>>24&255,c>>>16&255,c>>>8&255,c&255,u.isLeading<<2|u.dependsOn,u.isDependedOn<<6|u.hasRedundancy<<4|(u.isNonSync||0),0,0,m>>>24&255,m>>>16&255,m>>>8&255,m&255],12+16*r)}return _.box(_.types.trun,a)}static mdat(e){return _.box(_.types.mdat,e)}}_.init();class ns{TAG;_config;_dtsBase;_dtsBaseInited;_audioDtsBase;_videoDtsBase;_audioNextDts;_videoNextDts;_audioStashedLastSample;_videoStashedLastSample;_audioMeta;_videoMeta;_audioSegmentInfoList;_videoSegmentInfoList;_onInitSegment;_onMediaSegment;_forceFirstIDR;_fillSilentAfterSeek;_mp3UseMpegAudio;_fillAudioTimestampGap;_silentAudioMode;_silentAudioLastDts;constructor(e){this.TAG="MP4Remuxer",this._config=e,this._dtsBase=-1,this._dtsBaseInited=!1,this._audioDtsBase=1/0,this._videoDtsBase=1/0,this._audioNextDts=void 0,this._videoNextDts=void 0,this._audioStashedLastSample=null,this._videoStashedLastSample=null,this._audioMeta=null,this._videoMeta=null,this._audioSegmentInfoList=new Ot("audio"),this._videoSegmentInfoList=new Ot("video"),this._onInitSegment=null,this._onMediaSegment=null;const t=W,i=t.version;this._forceFirstIDR=!!(t.chrome&&i&&(i.major<50||i.major===50&&i.build<2661)),this._fillSilentAfterSeek=!!(t.msedge||t.msie),this._mp3UseMpegAudio=!t.firefox,this._fillAudioTimestampGap=this._config.fixAudioTimestampGap||!1,this._silentAudioMode=!1,this._silentAudioLastDts=void 0}destroy(){this._dtsBase=-1,this._dtsBaseInited=!1,this._silentAudioMode=!1,this._silentAudioLastDts=void 0,this._audioMeta=null,this._videoMeta=null,this._audioSegmentInfoList?.clear(),this._audioSegmentInfoList=null,this._videoSegmentInfoList?.clear(),this._videoSegmentInfoList=null,this._onInitSegment=null,this._onMediaSegment=null}bindDataSource(e){return e.onDataAvailable=this.remux.bind(this),e.onTrackMetadata=this._onTrackMetadataReceived.bind(this),this}get onInitSegment(){return this._onInitSegment}set onInitSegment(e){this._onInitSegment=e}get onMediaSegment(){return this._onMediaSegment}set onMediaSegment(e){this._onMediaSegment=e}insertDiscontinuity(){this._audioNextDts=this._videoNextDts=void 0,this._silentAudioLastDts=void 0}seek(e){this._audioStashedLastSample=null,this._videoStashedLastSample=null,this._videoSegmentInfoList?.clear(),this._audioSegmentInfoList?.clear(),this._silentAudioLastDts=void 0}remux(e,t){if(!this._onMediaSegment)throw new ot("MP4Remuxer: onMediaSegment callback must be specificed!");this._dtsBaseInited||this._calculateDtsBase(e,t),t&&this._remuxVideo(t),e&&this._remuxAudio(e),this._silentAudioMode&&t?.samples?.length&&this._generateSilentAudio(t)}_generateSilentAudio(e){if(!this._audioMeta||!this._onMediaSegment)return;const t=this._audioMeta.audioSampleRate||48e3,i=this._audioMeta.channelCount||2,s=1024/t*1e3,n=xt.getSilentFrame(this._audioMeta.originalCodec??"mp4a.40.2",i);if(!n)return;const a=e.samples,r=a[a.length-1].dts-this._dtsBase;this._silentAudioLastDts===void 0&&(this._silentAudioLastDts=a[0].dts-this._dtsBase);const d=[];let c=0,u=this._silentAudioLastDts;for(;u<r;)d.push({unit:n,dts:u,pts:u}),c+=n.byteLength,u+=s;if(this._silentAudioLastDts=u,d.length===0)return;const m=[];for(let p=0;p<d.length;p++){const B=d[p],C=p<d.length-1?d[p+1].dts-B.dts:s;m.push({dts:B.dts,pts:B.pts,cts:0,unit:B.unit,size:B.unit.byteLength,duration:C,originalDts:B.dts,flags:{isLeading:0,dependsOn:1,isDependedOn:0,hasRedundancy:0}})}const l=new Uint8Array(c+8);new DataView(l.buffer).setUint32(0,c+8),l.set(new Uint8Array(_.types.mdat),4);let f=8;for(const p of m)l.set(p.unit,f),f+=p.size;const S=m[0].dts,w=this._audioMeta.sequenceNumber??0;this._audioMeta.sequenceNumber=w+1;const v={type:"audio",id:this._audioMeta.id??2,sequenceNumber:w,samples:m},A=_.moof(v,S),b=new Uint8Array(A.byteLength+l.byteLength);b.set(A,0),b.set(l,A.byteLength);const g=new Bt;g.beginDts=S,g.endDts=m[m.length-1].dts+m[m.length-1].duration,g.beginPts=S,g.endPts=g.endDts,g.originalBeginDts=S,g.originalEndDts=g.endDts,g.syncPoints=[],g.firstSample=new Q(S,S,s,S,!0);const x=m[m.length-1];g.lastSample=new Q(x.dts,x.pts,x.duration,x.originalDts,!0),this._onMediaSegment("audio",{type:"audio",data:b.buffer,sampleCount:m.length,info:g})}_onTrackMetadataReceived(e,t){let i=null,s="mp4",n=t.codec;if(e==="audio")this._audioMeta=t,t.silentAudioMode===!0&&(this._silentAudioMode=!0),t.codec==="mp3"&&this._mp3UseMpegAudio?(s="mpeg",n="",i=new Uint8Array):i=_.generateInitSegment(t);else if(e==="video")this._videoMeta=t,i=_.generateInitSegment(t);else return;if(!this._onInitSegment)throw new ot("MP4Remuxer: onInitSegment callback must be specified!");this._onInitSegment(e,{type:e,data:i.buffer,codec:n,container:`${e}/${s}`,mediaDuration:t.duration})}_calculateDtsBase(e,t){this._dtsBaseInited||(e?.samples?.length&&(this._audioDtsBase=e.samples[0].dts),t?.samples?.length&&(this._videoDtsBase=t.samples[0].dts),this._silentAudioMode?this._dtsBase=this._videoDtsBase:this._dtsBase=Math.min(this._audioDtsBase,this._videoDtsBase),this._dtsBaseInited=!0)}getTimestampBase(){if(this._dtsBaseInited)return this._dtsBase}flushStashedSamples(){const e=this._videoStashedLastSample,t=this._audioStashedLastSample,i={type:"video",id:1,sequenceNumber:0,samples:[],length:0};e!=null&&(i.samples.push(e),i.length=e.length);const s={type:"audio",id:2,sequenceNumber:0,samples:[],length:0};t!=null&&(s.samples.push(t),s.length=t.length),this._videoStashedLastSample=null,this._audioStashedLastSample=null,this._remuxVideo(i,!0),this._remuxAudio(s,!0)}_remuxAudio(e,t){if(this._audioMeta==null)return;const i=e,s=i.samples;let n,a=-1,r=-1;const d=this._audioMeta.refSampleDuration,c=this._audioMeta.codec==="mp3"&&this._mp3UseMpegAudio,u=this._dtsBaseInited&&this._audioNextDts===void 0;let m=!1;if(!s||s.length===0||s.length===1&&!t)return;let l=0,h=null,f=0;c?(l=0,f=i.length):(l=8,f=8+i.length);let S=null;if(s.length>1&&(S=s.pop(),f-=S.length),this._audioStashedLastSample!=null){const p=this._audioStashedLastSample;this._audioStashedLastSample=null,s.unshift(p),f+=p.length}S!=null&&(this._audioStashedLastSample=S);const w=s[0].dts-this._dtsBase;if(this._audioNextDts)n=w-this._audioNextDts;else if(this._audioSegmentInfoList?.isEmpty())n=0,this._fillSilentAfterSeek&&!this._videoSegmentInfoList?.isEmpty()&&this._audioMeta.originalCodec!=="mp3"&&(m=!0);else{const p=this._audioSegmentInfoList?.getLastSampleBefore(w);if(p!=null){let B=w-(p.originalDts+p.duration);B<=3&&(B=0);const C=p.dts+p.duration+B;n=w-C}else n=0}if(m){const p=w-n,B=this._videoSegmentInfoList?.getLastSegmentBefore(w);if(B!=null&&B.beginDts<p){const C=xt.getSilentFrame(this._audioMeta.originalCodec??"",this._audioMeta.channelCount??0);if(C){const D=B.beginDts,k=p-B.beginDts;y.v(this.TAG,`InsertPrefixSilentAudio: dts: ${D}, duration: ${k}`),s.unshift({unit:C,dts:D,pts:D}),f+=C.byteLength}}else m=!1}const v=[];for(let p=0;p<s.length;p++){const B=s[p],C=B.unit,D=B.dts-this._dtsBase;let k=D,T=!1,F=null,R=0;if(!(D<-.001)){if(this._audioMeta?.codec!=="mp3"&&d!=null){let G=D;const tt=3;if(this._audioNextDts&&(G=this._audioNextDts),n=D-G,n<=-tt*d){y.w(this.TAG,`Dropping 1 audio frame (originalDts: ${D} ms ,curRefDts: ${G} ms)  due to dtsCorrection: ${n} ms overlap.`);continue}else if(n>=tt*d&&this._fillAudioTimestampGap&&!W.safari){T=!0;const et=Math.floor(n/d);y.w(this.TAG,`Large audio timestamp gap detected, may cause AV sync to drift. Silent frames will be generated to avoid unsync.\noriginalDts: ${D} ms, curRefDts: ${G} ms, dtsCorrection: ${Math.round(n)} ms, generate: ${et} frames`),k=Math.floor(G),R=Math.floor(G+d)-k;let z=xt.getSilentFrame(this._audioMeta?.originalCodec??"",this._audioMeta?.channelCount??0);z==null&&(y.w(this.TAG,`Unable to generate silent frame for ${this._audioMeta?.originalCodec} with ${this._audioMeta?.channelCount} channels, repeat last frame`),z=C),F=[];for(let V=0;V<et;V++){G=G+d;const N=Math.floor(G),mt=Math.floor(G+d)-N,L={dts:N,pts:N,cts:0,unit:z,size:z?.byteLength??0,duration:mt,originalDts:D,flags:{isLeading:0,dependsOn:1,isDependedOn:0,hasRedundancy:0}};F.push(L),f+=L.size}this._audioNextDts=G+d}else k=Math.floor(G),R=Math.floor(G+d)-k,this._audioNextDts=G+d}else k=D-n,p!==s.length-1?R=s[p+1].dts-this._dtsBase-n-k:S!=null?R=S.dts-this._dtsBase-n-k:v.length>=1?R=v[v.length-1].duration:R=Math.floor(d),this._audioNextDts=k+R;a===-1&&(a=k),v.push({dts:k,pts:k,cts:0,unit:B.unit,size:B.unit.byteLength,duration:R,originalDts:D,flags:{isLeading:0,dependsOn:1,isDependedOn:0,hasRedundancy:0}}),T&&F&&v.push.apply(v,F)}}if(v.length===0){i.samples=[],i.length=0;return}c?h=new Uint8Array(f):(h=new Uint8Array(f),h[0]=f>>>24&255,h[1]=f>>>16&255,h[2]=f>>>8&255,h[3]=f&255,h.set(_.types.mdat,4));for(let p=0;p<v.length;p++){const B=v[p].unit;h.set(B,l),l+=B.byteLength}const A=v[v.length-1];r=A.dts+A.duration;const b=new Bt;b.beginDts=a,b.endDts=r,b.beginPts=a,b.endPts=r,b.originalBeginDts=v[0].originalDts,b.originalEndDts=A.originalDts+A.duration,b.firstSample=new Q(v[0].dts,v[0].pts,v[0].duration,v[0].originalDts,!1),b.lastSample=new Q(A.dts,A.pts,A.duration,A.originalDts,!1),i.samples=v,i.sequenceNumber++;let g;c?g=new Uint8Array:g=_.moof(i,a),i.samples=[],i.length=0;const x={type:"audio",data:this._mergeBoxes(g,h).buffer,sampleCount:v.length,info:b};c&&u&&(x.timestampOffset=a),this._onMediaSegment?.("audio",x)}_remuxVideo(e,t){if(this._videoMeta==null)return;const i=e,s=i.samples;let n,a=-1,r=-1,d=-1,c=-1;if(!s||s.length===0||s.length===1&&!t)return;let u=8,m=null,l=8+e.length,h=null;if(s.length>1&&(h=s.pop(),l-=h.length),this._videoStashedLastSample!=null){const b=this._videoStashedLastSample;this._videoStashedLastSample=null,s.unshift(b),l+=b.length}h!=null&&(this._videoStashedLastSample=h);const f=s[0].dts-this._dtsBase;if(this._videoNextDts)n=f-this._videoNextDts;else if(this._videoSegmentInfoList?.isEmpty())n=0;else{const b=this._videoSegmentInfoList?.getLastSampleBefore(f);if(b!=null){let g=f-(b.originalDts+b.duration);g<=3&&(g=0);const x=b.dts+b.duration+g;n=f-x}else n=0}const S=new Bt,w=[];for(let b=0;b<s.length;b++){const g=s[b],x=g.dts-this._dtsBase,p=g.isKeyframe,B=x-n,C=g.cts,D=B+C;a===-1&&(a=B,d=D);let k=0;if(b!==s.length-1?k=s[b+1].dts-this._dtsBase-n-B:h!=null?k=h.dts-this._dtsBase-n-B:w.length>=1?k=w[w.length-1].duration:k=Math.floor(this._videoMeta?.refSampleDuration??0),p){const T=new Q(B,D,k,g.dts,!0);T.fileposition=g.fileposition??null,S.appendSyncPoint(T)}w.push({dts:B,pts:D,cts:C,units:g.units,size:g.length,isKeyframe:p,duration:k,originalDts:x,flags:{isLeading:0,dependsOn:p?2:1,isDependedOn:p?1:0,hasRedundancy:0,isNonSync:p?0:1}})}m=new Uint8Array(l),m[0]=l>>>24&255,m[1]=l>>>16&255,m[2]=l>>>8&255,m[3]=l&255,m.set(_.types.mdat,4);for(let b=0;b<w.length;b++){const g=w[b].units;for(;g.length;){const p=g.shift().data;m.set(p,u),u+=p.byteLength}}const v=w[w.length-1];if(r=v.dts+v.duration,c=v.pts+v.duration,this._videoNextDts=r,S.beginDts=a,S.endDts=r,S.beginPts=d,S.endPts=c,S.originalBeginDts=w[0].originalDts,S.originalEndDts=v.originalDts+v.duration,S.firstSample=new Q(w[0].dts,w[0].pts,w[0].duration,w[0].originalDts,w[0].isKeyframe??!1),S.lastSample=new Q(v.dts,v.pts,v.duration,v.originalDts,v.isKeyframe??!1),i.samples=w,i.sequenceNumber++,this._forceFirstIDR){const b=w[0].flags;b.dependsOn=2,b.isNonSync=0}const A=_.moof(i,a);i.samples=[],i.length=0,this._onMediaSegment?.("video",{type:"video",data:this._mergeBoxes(A,m).buffer,sampleCount:w.length,info:S})}_mergeBoxes(e,t){const i=new Uint8Array(e.byteLength+t.byteLength);return i.set(e,0),i.set(t,e.byteLength),i}}class os{TAG="Pipeline";_config;_callbacks;_segments;_currentSegmentIndex;_mediaInfo;_demuxer;_remuxer;_ioctl;_workerAudioDecoder=null;_workerAudioDecoderInitPromise=null;constructor(e,t,i){this._callbacks=i,this._config={...Ht(),...t},this._segments=this._buildSegments(e),this._currentSegmentIndex=0,this._mediaInfo=null,this._demuxer=null,this._remuxer=null,this._ioctl=null}_buildSegments(e){let t=0;return e.map(s=>{const n=s.duration??0,a={duration:n,url:s.url,timestampBase:t,cors:!0,withCredentials:!1};return this._config.referrerPolicy&&(a.referrerPolicy=this._config.referrerPolicy),t+=n,a})}start(){this._loadSegment(0)}stop(){this._internalAbort()}pause(){this._ioctl?.isWorking()&&this._ioctl.pause()}resume(){this._ioctl?.isPaused()&&this._ioctl.resume()}loadSegments(e){this._internalAbort(),this._mediaInfo=null,this._segments=this._buildSegments(e),this._currentSegmentIndex=0,this._demuxer&&(this._demuxer.destroy(),this._demuxer=null),this._remuxer&&(this._remuxer.destroy(),this._remuxer=null),this._workerAudioDecoder?.reset(),this._loadSegment(0)}destroy(){this._mediaInfo=null,this._ioctl&&(this._ioctl.destroy(),this._ioctl=null),this._demuxer&&(this._demuxer.destroy(),this._demuxer=null),this._remuxer&&(this._remuxer.destroy(),this._remuxer=null),this._workerAudioDecoder&&(this._workerAudioDecoder.destroy(),this._workerAudioDecoder=null),this._workerAudioDecoderInitPromise=null}_loadSegment(e){this._currentSegmentIndex=e;const t=this._segments[e],i={url:t.url,cors:t.cors,withCredentials:t.withCredentials,referrerPolicy:t.referrerPolicy},s=new is(i,this._config,e);this._ioctl=s,s.onError=this._onIOException.bind(this),s.onSeeked=this._onIOSeeked.bind(this),s.onComplete=this._onIOComplete.bind(this),s.onHLSDetected=()=>this._callbacks.onHLSDetected(),s.onDataArrival=this._onInitChunkArrival.bind(this),s.open()}_internalAbort(){this._ioctl&&(this._ioctl.destroy(),this._ioctl=null)}_onInitChunkArrival(e,t){const i=Pt.probe(e);if(!i.match)return i.needMoreData||(y.e(this.TAG,"Non MPEG-TS, Unsupported media type!"),Promise.resolve().then(()=>{this._internalAbort()}),this._callbacks.onDemuxError(de.FORMAT_UNSUPPORTED,"Non MPEG-TS, Unsupported media type!")),0;this._setupTSDemuxerRemuxer(i);const s=this._segments[this._currentSegmentIndex];return s&&this._demuxer&&(this._demuxer.timestampBase=s.timestampBase*9e4),this._ioctl&&this._demuxer&&(this._ioctl.onDataArrival=this._demuxer.parseChunks.bind(this._demuxer)),this._demuxer?.parseChunks(e,t)??0}_setupTSDemuxerRemuxer(e){this._demuxer&&this._demuxer.destroy();const t=new Pt(e,this._config);this._demuxer=t,this._remuxer||(this._remuxer=new ns(this._config)),t.onError=this._onDemuxException.bind(this),t.onMediaInfo=this._onMediaInfo.bind(this),t.onTimedID3Metadata=()=>{},t.onPGSSubtitleData=()=>{},t.onSynchronousKLVMetadata=()=>{},t.onAsynchronousKLVMetadata=()=>{},t.onSMPTE2038Metadata=()=>{},t.onSCTE35Metadata=()=>{},t.onPESPrivateDataDescriptor=()=>{},t.onPESPrivateData=()=>{},this._config.wasmDecoders.mp2&&(t.onRawAudioData=i=>{this._handleRawAudioFrame(i)}),this._remuxer.bindDataSource(this._demuxer),this._demuxer.bindDataSource(this._ioctl),this._remuxer.onInitSegment=this._onRemuxerInitSegmentArrival.bind(this),this._remuxer.onMediaSegment=this._onRemuxerMediaSegmentArrival.bind(this)}_onMediaInfo(e){this._mediaInfo==null&&(this._mediaInfo=Object.assign({},e),this._mediaInfo.segments=[],this._mediaInfo.segmentCount=this._segments.length,Object.setPrototypeOf(this._mediaInfo,ut.prototype));const t=Object.assign({},e);Object.setPrototypeOf(t,ut.prototype),this._mediaInfo.segments[this._currentSegmentIndex]=t,this._reportSegmentMediaInfo(this._currentSegmentIndex)}_onIOSeeked(){this._remuxer.insertDiscontinuity()}_onIOComplete(e){const i=e+1;i<this._segments.length?(this._internalAbort(),this._remuxer&&this._remuxer.flushStashedSamples(),this._loadSegment(i)):(this._remuxer&&this._remuxer.flushStashedSamples(),this._callbacks.onLoadingComplete())}_onIOException(e,t){y.e(this.TAG,`IOException: type = ${e}, code = ${t.code}, msg = ${t.msg}`),this._callbacks.onIOError(e,t)}_onDemuxException(e,t){y.e(this.TAG,`DemuxException: type = ${e}, info = ${t}`),this._callbacks.onDemuxError(e,t)}_onRemuxerInitSegmentArrival(e,t){this._callbacks.onInitSegment(e,t)}_onRemuxerMediaSegmentArrival(e,t){this._callbacks.onMediaSegment(e,t)}_reportSegmentMediaInfo(e){const t=this._mediaInfo?.segments?.[e],i=Object.assign({},t);i.duration=this._mediaInfo?.duration,i.segmentCount=this._mediaInfo?.segmentCount,delete i.segments,this._callbacks.onMediaInfo(i)}_handleRawAudioFrame(e){if(!this._workerAudioDecoder){const t=this._config.wasmDecoders.mp2;if(!t)return;this._workerAudioDecoder=new re(t),this._workerAudioDecoderInitPromise=this._workerAudioDecoder.initDecoder()}this._workerAudioDecoderInitPromise?.then(t=>{if(!t||!this._workerAudioDecoder)return;const i=this._workerAudioDecoder.decode(e.data,e.pts);i&&this._callbacks.onPCMAudioData(i.pcm,i.channels,i.sampleRate,i.pts)})}}let K=null,M=0;function H(o,e){e?self.postMessage(o,e):self.postMessage(o)}function rs(o,e){const t={onInitSegment(i,s){const n=s.data;H({type:"init-segment",track:i,data:n,codec:s.codec??"",container:s.container,gen:M},[n])},onMediaSegment(i,s){const n=s.data;H({type:"media-segment",track:i,data:n,gen:M},[n])},onLoadingComplete(){H({type:"complete",gen:M})},onMediaInfo(i){H({type:"media-info",info:i,gen:M})},onIOError(i,s){H({type:"error",category:"io",detail:i,info:s.msg,gen:M})},onDemuxError(i,s){H({type:"error",category:"demux",detail:i,info:s,gen:M})},onHLSDetected(){H({type:"hls-detected",gen:M})},onPCMAudioData(i,s,n,a){const r=i.buffer;H({type:"pcm-audio-data",pcm:r,channels:s,sampleRate:n,pts:a,gen:M},[r])}};return new os(o,e,t)}self.addEventListener("message",o=>{const e=o.data;switch(e.type){case"init":M=e.gen,K=rs(e.segments,e.config);break;case"start":K?.start();break;case"load-segments":M=e.gen,K?.loadSegments(e.segments);break;case"pause":K?.pause();break;case"resume":K?.resume();break;case"destroy":K&&(K.destroy(),K=null),self.postMessage({type:"destroyed"});break}})})();\n', Y = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Q], { type: "text/javascript;charset=utf-8" });
function ue(e) {
  let t;
  try {
    if (t = Y && (self.URL || self.webkitURL).createObjectURL(Y), !t) throw "";
    const a = new Worker(t, {
      name: e?.name
    });
    return a.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), a;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Q),
      {
        name: e?.name
      }
    );
  }
}
const V = "LiveSync";
function Z(e, t) {
  t.liveSync && m.v(
    V,
    "Live sync enabled, target latency:",
    t.liveSyncTargetLatency,
    "max latency:",
    t.liveSyncMaxLatency
  );
  function a() {
    if (!t.liveSync) return;
    const i = e.buffered;
    if (i.length === 0) return;
    const n = i.end(i.length - 1) - e.currentTime;
    if (n > t.liveSyncMaxLatency) {
      const h = Math.min(2, Math.max(1, t.liveSyncPlaybackRate));
      h !== e.playbackRate && (m.v(V, `Video playback rate set to ${h}`), e.playbackRate = Math.min(2, Math.max(1, t.liveSyncPlaybackRate)));
    } else n <= t.liveSyncTargetLatency && e.playbackRate !== 1 && e.playbackRate !== 0 && (e.playbackRate = 1, m.v(V, "Video playback rate reset to 1"));
  }
  return e.addEventListener("timeupdate", a), () => {
    m.v(V, "Video playback rate reset to 1, live sync disabled"), e.removeEventListener("timeupdate", a), e.playbackRate = 1;
  };
}
function me(e) {
  let t = !1;
  function a() {
    t = !0, e.removeEventListener("canplay", a);
  }
  function i(h) {
    const r = e.buffered;
    if (h || !t || e.readyState < 2) {
      if (r.length > 0 && e.currentTime < r.start(0)) {
        const l = r.start(0);
        m.w(V, `Playback stuck at ${e.currentTime}, seeking to ${l}`), e.currentTime = l, e.removeEventListener("progress", n);
      }
    } else
      e.removeEventListener("progress", n);
  }
  function s() {
    i(!0);
  }
  function n() {
    i();
  }
  return e.addEventListener("canplay", a), e.addEventListener("stalled", s), e.addEventListener("progress", n), () => {
    e.removeEventListener("canplay", a), e.removeEventListener("stalled", s), e.removeEventListener("progress", n);
  };
}
const N = {};
function fe() {
  const e = self.navigator.userAgent.toLowerCase(), t = /(edge)\/([\w.]+)/.exec(e) || /(opr)[/]([\w.]+)/.exec(e) || /(chrome)[ /]([\w.]+)/.exec(e) || /(iemobile)[/]([\w.]+)/.exec(e) || /(version)(applewebkit)[ /]([\w.]+).*(safari)[ /]([\w.]+)/.exec(e) || /(webkit)[ /]([\w.]+).*(version)[ /]([\w.]+).*(safari)[ /]([\w.]+)/.exec(e) || /(webkit)[ /]([\w.]+)/.exec(e) || /(opera)(?:.*version|)[ /]([\w.]+)/.exec(e) || /(msie) ([\w.]+)/.exec(e) || e.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec(e) || e.indexOf("compatible") < 0 && /(firefox)[ /]([\w.]+)/.exec(e) || [], a = /(ipad)/.exec(e) || /(ipod)/.exec(e) || /(windows phone)/.exec(e) || /(iphone)/.exec(e) || /(kindle)/.exec(e) || /(android)/.exec(e) || /(windows)/.exec(e) || /(mac)/.exec(e) || /(linux)/.exec(e) || /(cros)/.exec(e) || [], i = {
    browser: t[5] || t[3] || t[1] || "",
    version: t[2] || t[4] || "0",
    majorVersion: t[4] || t[2] || "0",
    platform: a[0] || ""
  }, s = {};
  if (i.browser) {
    s[i.browser] = !0;
    const n = i.majorVersion.split(".");
    s.version = {
      major: parseInt(i.majorVersion, 10),
      string: i.version
    }, n.length > 1 && (s.version.minor = parseInt(n[1], 10)), n.length > 2 && (s.version.build = parseInt(n[2], 10));
  }
  if (i.platform && (s[i.platform] = !0), (s.chrome || s.opr || s.safari) && (s.webkit = !0), s.rv || s.iemobile) {
    s.rv && delete s.rv;
    const n = "msie";
    i.browser = n, s[n] = !0;
  }
  if (s.edge) {
    delete s.edge;
    const n = "msedge";
    i.browser = n, s[n] = !0;
  }
  if (s.opr) {
    const n = "opera";
    i.browser = n, s[n] = !0;
  }
  if (s.safari && s.android) {
    const n = "android";
    i.browser = n, s[n] = !0;
  }
  s.name = i.browser, s.platform = i.platform;
  for (const n in N)
    Object.hasOwn(N, n) && delete N[n];
  Object.assign(N, s);
}
fe();
const E = "MSE";
function pe(e, t) {
  const a = self, i = "ManagedMediaSource" in self && !("MediaSource" in self);
  let s = null, n = null;
  const h = { video: null, audio: null }, r = { video: [], audio: [] }, l = { video: [], audio: [] }, b = { video: null, audio: null }, A = { video: null, audio: null };
  let f = !1, v = !1, L = [], c = null, p = null, C = null, M = null, T = null, U = null, x = null;
  const S = { video: null, audio: null }, g = { video: null, audio: null };
  function D() {
    return r.video.length > 0 || r.audio.length > 0;
  }
  function O() {
    return l.video.length > 0 || l.audio.length > 0;
  }
  function K() {
    const d = ["video", "audio"];
    for (const y of d) {
      const o = h[y];
      if (!o || o.updating)
        continue;
      const u = l[y];
      for (; u.length > 0 && !o.updating; ) {
        const _ = u.shift();
        o.remove(_.start, _.end);
      }
    }
  }
  function $() {
    const d = ["video", "audio"];
    for (const y of d) {
      const o = h[y];
      if (!(!o || o.updating) && s?.streaming !== !1 && r[y].length > 0) {
        const u = r[y].shift();
        if (!u || u.byteLength === 0)
          continue;
        try {
          o.appendBuffer(u), f = !1;
        } catch (_) {
          r[y].unshift(u), _.code === 22 ? (f || I.onBufferFull?.(), f = !0) : (m.e(E, _.message), I.onError?.({
            code: _.code,
            msg: _.message
          }));
        }
      }
    }
  }
  function te() {
    const d = e.currentTime, y = ["video", "audio"];
    for (const o of y) {
      const u = h[o];
      if (u) {
        const _ = u.buffered;
        if (_.length >= 1 && d - _.start(0) >= t.bufferCleanupMaxBackward)
          return !0;
      }
    }
    return !1;
  }
  function se() {
    const d = e.currentTime, y = ["video", "audio"];
    for (const o of y) {
      const u = h[o];
      if (u) {
        const _ = u.buffered;
        let B = !1;
        for (let P = 0; P < _.length; P++) {
          const k = _.start(P), F = _.end(P);
          if (k <= d && d < F + 3) {
            if (d - k >= t.bufferCleanupMaxBackward) {
              B = !0;
              const ne = d - t.bufferCleanupMinBackward;
              l[o].push({ start: k, end: ne });
            }
          } else F < d && (B = !0, l[o].push({ start: k, end: F }));
        }
        B && !u.updating && K();
      }
    }
  }
  function ie() {
    O() ? K() : D() ? $() : v && I.endOfStream();
  }
  function ae(d) {
    m.e(E, "SourceBuffer Error:", d);
  }
  function X(d, y, o) {
    if (!s || s.readyState !== "open")
      return;
    let u = y;
    u === "opus" && N.safari && (u = "Opus");
    let _ = o;
    if (u && u.length > 0 && (_ += `;codecs=${u}`), _ !== b[d]) {
      try {
        const B = s.addSourceBuffer(_);
        h[d] = B;
        const P = (F) => ae(F), k = () => ie();
        S[d] = P, g[d] = k, B.addEventListener("error", P), B.addEventListener("updateend", k);
      } catch (B) {
        if (m.e(E, B.message), B.name !== "NotSupportedError") {
          I.onError?.({
            code: B.code,
            msg: B.message
          });
          return;
        }
      }
      b[d] = _;
    }
  }
  const I = {
    onBufferFull: null,
    onError: null,
    open(d) {
      if (s) {
        m.e(E, "MediaSource has already been attached");
        return;
      }
      i && m.v(E, "Using ManagedMediaSource"), c = d;
      const y = i ? a.ManagedMediaSource : a.MediaSource, o = new y();
      s = o, p = () => {
        if (m.v(E, "MediaSource onSourceOpen"), o.removeEventListener("sourceopen", p), L.length > 0) {
          const u = L;
          L = [];
          for (const _ of u)
            X(_.track, _.codec, _.container), A[_.track] = {
              data: _.data,
              codec: _.codec,
              container: _.container
            };
        }
        D() && $(), c?.(), c = null;
      }, C = () => {
        m.v(E, "MediaSource onSourceEnded");
      }, M = () => {
        m.v(E, "MediaSource onSourceClose"), s && (s.removeEventListener("sourceopen", p), s.removeEventListener("sourceended", C), s.removeEventListener("sourceclose", M), i && (s.removeEventListener("startstreaming", T), s.removeEventListener("endstreaming", U), s.removeEventListener("qualitychange", x)));
      }, o.addEventListener("sourceopen", p), o.addEventListener("sourceended", C), o.addEventListener("sourceclose", M), i && (T = () => {
        m.v(E, "ManagedMediaSource onStartStreaming");
      }, U = () => {
        m.v(E, "ManagedMediaSource onEndStreaming");
      }, x = () => {
        m.v(E, "ManagedMediaSource onQualityChange");
      }, o.addEventListener("startstreaming", T), o.addEventListener("endstreaming", U), o.addEventListener("qualitychange", x)), i ? (e.disableRemotePlayback = !0, e.srcObject = o) : (n = URL.createObjectURL(o), e.src = n);
    },
    appendInit(d, y, o, u) {
      if (!s || s.readyState !== "open" || s.streaming === !1) {
        L.push({ track: d, data: y, codec: o, container: u }), r[d].push(y);
        return;
      }
      let _ = o;
      _ === "opus" && N.safari && (_ = "Opus");
      const B = _ ? `${u};codecs=${_}` : u;
      m.v(E, `Received Initialization Segment, mimeType: ${B}`), A[d] = { data: y, codec: _, container: u };
      const P = !b[d];
      if (X(d, _, u), r[d].push(y), !P) {
        const k = h[d];
        k && !k.updating && $();
      }
    },
    appendMedia(d, y) {
      r[d].push(y), te() && se();
      const o = h[d];
      o && !o.updating && !O() && $();
    },
    endOfStream() {
      if (!s || s.readyState !== "open") {
        s && s.readyState === "closed" && D() && (v = !0);
        return;
      }
      const d = h.video, y = h.audio;
      d?.updating || y?.updating ? v = !0 : (v = !1, s.endOfStream());
    },
    destroy() {
      if (s) {
        const d = s, y = ["video", "audio"];
        for (const o of y) {
          r[o].splice(0, r[o].length), l[o].splice(0, l[o].length), A[o] = null;
          const u = h[o];
          if (u) {
            if (d.readyState !== "closed") {
              try {
                d.removeSourceBuffer(u);
              } catch (_) {
                m.e(E, _.message);
              }
              S[o] && (u.removeEventListener("error", S[o]), S[o] = null), g[o] && (u.removeEventListener("updateend", g[o]), g[o] = null);
            }
            b[o] = null, h[o] = null;
          }
        }
        if (d.readyState === "open")
          try {
            d.endOfStream();
          } catch (o) {
            m.e(E, o.message);
          }
        d.removeEventListener("sourceopen", p), d.removeEventListener("sourceended", C), d.removeEventListener("sourceclose", M), i && (d.removeEventListener("startstreaming", T), d.removeEventListener("endstreaming", U), d.removeEventListener("qualitychange", x)), p = null, C = null, M = null, T = null, U = null, x = null, L = [], f = !1, v = !1, s = null;
      }
      n && (URL.revokeObjectURL(n), n = null), i ? e.srcObject = null : e.removeAttribute("src"), I.onBufferFull = null, I.onError = null, c = null;
    }
  };
  return I;
}
function ee(e, t) {
  const a = e.buffered;
  for (let i = 0; i < a.length; i++)
    if (t >= a.start(i) && t <= a.end(i))
      return !0;
  return !1;
}
function ge(e, t, a) {
  let i = null, s = null, n = !1, h = null, r = null, l = null, b = 0, A = t.liveSync, f = null, v = null;
  function L() {
    return f || (f = new he(t), f.onSuspended = () => x.onAudioSuspended?.(), v = f.init(), f.attachVideo(e)), f;
  }
  function c() {
    f && (f.destroy(), f = null, v = null);
  }
  function p(S) {
    const g = S.data;
    if (g.type !== "destroyed" && g.gen === b)
      switch (g.type) {
        case "init-segment":
          i?.appendInit(g.track, g.data, g.codec, g.container);
          break;
        case "media-segment":
          i?.appendMedia(g.track, g.data);
          break;
        case "error":
          x.onError?.({
            category: g.category === "io" ? "io" : "demux",
            detail: g.detail,
            info: g.info
          });
          break;
        case "complete":
          i?.endOfStream();
          break;
        case "media-info":
          break;
        case "hls-detected":
          x.onHLSDetected?.();
          break;
        case "pcm-audio-data": {
          const D = L(), O = new Float32Array(g.pcm);
          v?.then(() => {
            D.feed(O, g.channels, g.sampleRate, g.pts / 1e3);
          });
          break;
        }
      }
  }
  function C() {
    return s || (s = new ue(), s.onmessage = p, n = !1), s;
  }
  function M(S) {
    const g = C();
    if (n) {
      const D = { type: "load-segments", segments: S, gen: b };
      g.postMessage(D);
    } else {
      const D = { type: "init", segments: S, config: t, gen: b };
      g.postMessage(D);
      const O = { type: "start" };
      g.postMessage(O), n = !0;
    }
  }
  function T() {
    i = pe(e, t), i.open(() => {
      h && (M(h), h = null);
    }), i.onBufferFull = () => {
      const S = { type: "pause" };
      s?.postMessage(S);
    }, i.onError = (S) => {
      x.onError?.({
        category: "media",
        detail: "MediaMSEError",
        info: S.msg
      });
    };
  }
  function U() {
    !r && A && (r = Z(e, t)), l?.(), l = me(e);
  }
  const x = {
    onError: null,
    loadSegments(S) {
      b++, i && (i.destroy(), i = null), c(), T(), U(), h = S;
    },
    setLiveSync(S) {
      S && !r ? (A = !0, r = Z(e, t)) : !S && r && (A = !1, r(), r = null);
    },
    seek(S) {
      if (ee(e, S))
        e.currentTime = S;
      else
        for (const g of a)
          g(S);
    },
    suspend() {
      i && (i.destroy(), i = null), c(), r?.(), r = null, l?.(), l = null;
    },
    destroy() {
      if (x.suspend(), s) {
        const S = { type: "destroy" };
        s.postMessage(S), s.terminate(), s = null;
      }
      n = !1;
    }
  };
  return x;
}
function ye(e, t, a) {
  let i = [], s = 0, n = !1;
  function h() {
    A.onError?.({ category: "media", detail: e.error?.message ?? "Unknown HLS error" });
  }
  function r() {
    const f = s + 1;
    f < i.length && (s = f, e.src = i[f].url, e.play());
  }
  function l() {
    n || (e.addEventListener("error", h), e.addEventListener("ended", r), n = !0);
  }
  function b() {
    n && (e.removeEventListener("error", h), e.removeEventListener("ended", r), n = !1);
  }
  const A = {
    onError: null,
    loadSegments(f) {
      i = f, s = 0, l();
      const v = !e.paused;
      e.src = i[0].url, v && e.play();
    },
    setLiveSync(f) {
    },
    seek(f) {
      if (ee(e, f) || Se(e, f))
        e.currentTime = f;
      else
        for (const v of a)
          v(f);
    },
    suspend() {
      i = [], s = 0, e.removeAttribute("src"), e.load();
    },
    destroy() {
      A.suspend(), b();
    }
  };
  return A;
}
function Se(e, t) {
  const a = e.seekable;
  if (!a) return !1;
  for (let i = 0; i < a.length; i++)
    if (t >= a.start(i) && t <= a.end(i))
      return !0;
  return !1;
}
function be(e, t) {
  const a = { ...oe, ...t };
  a.wasmDecoders.mp2 && (a.wasmDecoders = {
    ...a.wasmDecoders,
    mp2: new URL(a.wasmDecoders.mp2, document.baseURI).href
  });
  let i = !1;
  const s = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), h = /* @__PURE__ */ new Set(), r = {};
  let l = null, b = [];
  function A(c) {
    c.onError = (p) => {
      for (const C of s)
        C(p);
    }, c.onAudioSuspended = () => {
      for (const p of h)
        p();
    };
  }
  function f(c) {
    if (!r[c]) {
      const p = c === "hls" ? ye(e, a, n) : ge(e, a, n);
      A(p), r[c] = p;
    }
    return r[c];
  }
  function v(c) {
    return l === c && r[c] ? r[c] : (l && r[l] && r[l].suspend(), l = c, f(c));
  }
  function L(c) {
    c.onHLSDetected = () => {
      if (i || !b.length) return;
      v("hls").loadSegments(b);
    };
  }
  return {
    loadSegments(c) {
      if (i || !c.length) return;
      b = c;
      const p = v("mpegts");
      L(p), p.loadSegments(c);
    },
    seek(c) {
      l && r[l]?.seek(c);
    },
    setLiveSync(c) {
      for (const p of Object.values(r))
        p.setLiveSync(c);
    },
    destroy() {
      i = !0;
      for (const c of Object.values(r))
        c.destroy();
      l = null;
    },
    on(c, p) {
      c === "error" && s.add(p), c === "seek-needed" && n.add(p), c === "audio-suspended" && h.add(p);
    },
    off(c, p) {
      c === "error" && s.delete(p), c === "seek-needed" && n.delete(p), c === "audio-suspended" && h.delete(p);
    }
  };
}
function ve() {
  const e = 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"', t = self.MediaSource, a = self.ManagedMediaSource;
  return !!(t?.isTypeSupported?.(e) || a?.isTypeSupported?.(e));
}
export {
  be as createPlayer,
  ve as isSupported
};
