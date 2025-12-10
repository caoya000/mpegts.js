function re(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var I = { exports: {} }, K;
function oe() {
  if (K) return I.exports;
  K = 1;
  var r = typeof Reflect == "object" ? Reflect : null, e = r && typeof r.apply == "function" ? r.apply : function(o, h, u) {
    return Function.prototype.apply.call(o, h, u);
  }, t;
  r && typeof r.ownKeys == "function" ? t = r.ownKeys : Object.getOwnPropertySymbols ? t = function(o) {
    return Object.getOwnPropertyNames(o).concat(Object.getOwnPropertySymbols(o));
  } : t = function(o) {
    return Object.getOwnPropertyNames(o);
  };
  function i(l) {
    console && console.warn && console.warn(l);
  }
  var s = Number.isNaN || function(o) {
    return o !== o;
  };
  function a() {
    a.init.call(this);
  }
  I.exports = a, I.exports.once = se, a.EventEmitter = a, a.prototype._events = void 0, a.prototype._eventsCount = 0, a.prototype._maxListeners = void 0;
  var d = 10;
  function c(l) {
    if (typeof l != "function")
      throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof l);
  }
  Object.defineProperty(a, "defaultMaxListeners", {
    enumerable: !0,
    get: function() {
      return d;
    },
    set: function(l) {
      if (typeof l != "number" || l < 0 || s(l))
        throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + l + ".");
      d = l;
    }
  }), a.init = function() {
    (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
  }, a.prototype.setMaxListeners = function(o) {
    if (typeof o != "number" || o < 0 || s(o))
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + o + ".");
    return this._maxListeners = o, this;
  };
  function S(l) {
    return l._maxListeners === void 0 ? a.defaultMaxListeners : l._maxListeners;
  }
  a.prototype.getMaxListeners = function() {
    return S(this);
  }, a.prototype.emit = function(o) {
    for (var h = [], u = 1; u < arguments.length; u++) h.push(arguments[u]);
    var f = o === "error", p = this._events;
    if (p !== void 0)
      f = f && p.error === void 0;
    else if (!f)
      return !1;
    if (f) {
      var m;
      if (h.length > 0 && (m = h[0]), m instanceof Error)
        throw m;
      var B = new Error("Unhandled error." + (m ? " (" + m.message + ")" : ""));
      throw B.context = m, B;
    }
    var k = p[o];
    if (k === void 0)
      return !1;
    if (typeof k == "function")
      e(k, this, h);
    else
      for (var q = k.length, ne = F(k, q), u = 0; u < q; ++u)
        e(ne[u], this, h);
    return !0;
  };
  function T(l, o, h, u) {
    var f, p, m;
    if (c(h), p = l._events, p === void 0 ? (p = l._events = /* @__PURE__ */ Object.create(null), l._eventsCount = 0) : (p.newListener !== void 0 && (l.emit(
      "newListener",
      o,
      h.listener ? h.listener : h
    ), p = l._events), m = p[o]), m === void 0)
      m = p[o] = h, ++l._eventsCount;
    else if (typeof m == "function" ? m = p[o] = u ? [h, m] : [m, h] : u ? m.unshift(h) : m.push(h), f = S(l), f > 0 && m.length > f && !m.warned) {
      m.warned = !0;
      var B = new Error("Possible EventEmitter memory leak detected. " + m.length + " " + String(o) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      B.name = "MaxListenersExceededWarning", B.emitter = l, B.type = o, B.count = m.length, i(B);
    }
    return l;
  }
  a.prototype.addListener = function(o, h) {
    return T(this, o, h, !1);
  }, a.prototype.on = a.prototype.addListener, a.prototype.prependListener = function(o, h) {
    return T(this, o, h, !0);
  };
  function ee() {
    if (!this.fired)
      return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
  }
  function N(l, o, h) {
    var u = { fired: !1, wrapFn: void 0, target: l, type: o, listener: h }, f = ee.bind(u);
    return f.listener = h, u.wrapFn = f, f;
  }
  a.prototype.once = function(o, h) {
    return c(h), this.on(o, N(this, o, h)), this;
  }, a.prototype.prependOnceListener = function(o, h) {
    return c(h), this.prependListener(o, N(this, o, h)), this;
  }, a.prototype.removeListener = function(o, h) {
    var u, f, p, m, B;
    if (c(h), f = this._events, f === void 0)
      return this;
    if (u = f[o], u === void 0)
      return this;
    if (u === h || u.listener === h)
      --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete f[o], f.removeListener && this.emit("removeListener", o, u.listener || h));
    else if (typeof u != "function") {
      for (p = -1, m = u.length - 1; m >= 0; m--)
        if (u[m] === h || u[m].listener === h) {
          B = u[m].listener, p = m;
          break;
        }
      if (p < 0)
        return this;
      p === 0 ? u.shift() : te(u, p), u.length === 1 && (f[o] = u[0]), f.removeListener !== void 0 && this.emit("removeListener", o, B || h);
    }
    return this;
  }, a.prototype.off = a.prototype.removeListener, a.prototype.removeAllListeners = function(o) {
    var h, u, f;
    if (u = this._events, u === void 0)
      return this;
    if (u.removeListener === void 0)
      return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : u[o] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete u[o]), this;
    if (arguments.length === 0) {
      var p = Object.keys(u), m;
      for (f = 0; f < p.length; ++f)
        m = p[f], m !== "removeListener" && this.removeAllListeners(m);
      return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
    }
    if (h = u[o], typeof h == "function")
      this.removeListener(o, h);
    else if (h !== void 0)
      for (f = h.length - 1; f >= 0; f--)
        this.removeListener(o, h[f]);
    return this;
  };
  function G(l, o, h) {
    var u = l._events;
    if (u === void 0)
      return [];
    var f = u[o];
    return f === void 0 ? [] : typeof f == "function" ? h ? [f.listener || f] : [f] : h ? ie(f) : F(f, f.length);
  }
  a.prototype.listeners = function(o) {
    return G(this, o, !0);
  }, a.prototype.rawListeners = function(o) {
    return G(this, o, !1);
  }, a.listenerCount = function(l, o) {
    return typeof l.listenerCount == "function" ? l.listenerCount(o) : V.call(l, o);
  }, a.prototype.listenerCount = V;
  function V(l) {
    var o = this._events;
    if (o !== void 0) {
      var h = o[l];
      if (typeof h == "function")
        return 1;
      if (h !== void 0)
        return h.length;
    }
    return 0;
  }
  a.prototype.eventNames = function() {
    return this._eventsCount > 0 ? t(this._events) : [];
  };
  function F(l, o) {
    for (var h = new Array(o), u = 0; u < o; ++u)
      h[u] = l[u];
    return h;
  }
  function te(l, o) {
    for (; o + 1 < l.length; o++)
      l[o] = l[o + 1];
    l.pop();
  }
  function ie(l) {
    for (var o = new Array(l.length), h = 0; h < o.length; ++h)
      o[h] = l[h].listener || l[h];
    return o;
  }
  function se(l, o) {
    return new Promise(function(h, u) {
      function f(m) {
        l.removeListener(o, p), u(m);
      }
      function p() {
        typeof l.removeListener == "function" && l.removeListener("error", f), h([].slice.call(arguments));
      }
      z(l, o, p, { once: !0 }), o !== "error" && ae(l, f, { once: !0 });
    });
  }
  function ae(l, o, h) {
    typeof l.on == "function" && z(l, "error", o, h);
  }
  function z(l, o, h, u) {
    if (typeof l.on == "function")
      u.once ? l.once(o, h) : l.on(o, h);
    else if (typeof l.addEventListener == "function")
      l.addEventListener(o, function f(p) {
        u.once && l.removeEventListener(o, f), h(p);
      });
    else
      throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof l);
  }
  return I.exports;
}
var le = oe();
const M = /* @__PURE__ */ re(le);
class n {
  static e(e, t) {
    (!e || n.FORCE_GLOBAL_TAG) && (e = n.GLOBAL_TAG);
    let i = `[${e}] > ${t}`;
    n.ENABLE_CALLBACK && n.emitter.emit("log", "error", i), n.ENABLE_ERROR && (console.error ? console.error(i) : console.warn ? console.warn(i) : console.log(i));
  }
  static i(e, t) {
    (!e || n.FORCE_GLOBAL_TAG) && (e = n.GLOBAL_TAG);
    let i = `[${e}] > ${t}`;
    n.ENABLE_CALLBACK && n.emitter.emit("log", "info", i), n.ENABLE_INFO && (console.info ? console.info(i) : console.log(i));
  }
  static w(e, t) {
    (!e || n.FORCE_GLOBAL_TAG) && (e = n.GLOBAL_TAG);
    let i = `[${e}] > ${t}`;
    n.ENABLE_CALLBACK && n.emitter.emit("log", "warn", i), n.ENABLE_WARN && (console.warn ? console.warn(i) : console.log(i));
  }
  static d(e, t) {
    (!e || n.FORCE_GLOBAL_TAG) && (e = n.GLOBAL_TAG);
    let i = `[${e}] > ${t}`;
    n.ENABLE_CALLBACK && n.emitter.emit("log", "debug", i), n.ENABLE_DEBUG && (console.debug ? console.debug(i) : console.log(i));
  }
  static v(e, t) {
    (!e || n.FORCE_GLOBAL_TAG) && (e = n.GLOBAL_TAG);
    let i = `[${e}] > ${t}`;
    n.ENABLE_CALLBACK && n.emitter.emit("log", "verbose", i), n.ENABLE_VERBOSE && console.log(i);
  }
}
n.GLOBAL_TAG = "mpegts.js";
n.FORCE_GLOBAL_TAG = !1;
n.ENABLE_ERROR = !0;
n.ENABLE_INFO = !0;
n.ENABLE_WARN = !0;
n.ENABLE_DEBUG = !0;
n.ENABLE_VERBOSE = !0;
n.ENABLE_CALLBACK = !1;
n.emitter = new M();
class _e {
  constructor() {
    this._firstCheckpoint = 0, this._lastCheckpoint = 0, this._intervalBytes = 0, this._totalBytes = 0, this._lastSecondBytes = 0, self.performance && self.performance.now ? this._now = self.performance.now.bind(self.performance) : this._now = Date.now;
  }
  reset() {
    this._firstCheckpoint = this._lastCheckpoint = 0, this._totalBytes = this._intervalBytes = 0, this._lastSecondBytes = 0;
  }
  addBytes(e) {
    this._firstCheckpoint === 0 ? (this._firstCheckpoint = this._now(), this._lastCheckpoint = this._firstCheckpoint, this._intervalBytes += e, this._totalBytes += e) : this._now() - this._lastCheckpoint < 1e3 ? (this._intervalBytes += e, this._totalBytes += e) : (this._lastSecondBytes = this._intervalBytes, this._intervalBytes = e, this._totalBytes += e, this._lastCheckpoint = this._now());
  }
  get currentKBps() {
    this.addBytes(0);
    let e = (this._now() - this._lastCheckpoint) / 1e3;
    return e == 0 && (e = 1), this._intervalBytes / e / 1024;
  }
  get lastSecondKBps() {
    return this.addBytes(0), this._lastSecondBytes !== 0 ? this._lastSecondBytes / 1024 : this._now() - this._lastCheckpoint >= 500 ? this.currentKBps : 0;
  }
  get averageKBps() {
    let e = (this._now() - this._firstCheckpoint) / 1e3;
    return this._totalBytes / e / 1024;
  }
}
class C {
  constructor(e) {
    this._message = e;
  }
  get name() {
    return "RuntimeException";
  }
  get message() {
    return this._message;
  }
  toString() {
    return this.name + ": " + this.message;
  }
}
class w extends C {
  constructor(e) {
    super(e);
  }
  get name() {
    return "IllegalStateException";
  }
}
class D extends C {
  constructor(e) {
    super(e);
  }
  get name() {
    return "InvalidArgumentException";
  }
}
class $ extends C {
  constructor(e) {
    super(e);
  }
  get name() {
    return "NotImplementedException";
  }
}
const A = {
  kIdle: 0,
  kConnecting: 1,
  kBuffering: 2,
  kError: 3,
  kComplete: 4
}, b = {
  OK: "OK",
  EXCEPTION: "Exception",
  HTTP_STATUS_CODE_INVALID: "HttpStatusCodeInvalid",
  CONNECTING_TIMEOUT: "ConnectingTimeout",
  EARLY_EOF: "EarlyEof",
  UNRECOVERABLE_EARLY_EOF: "UnrecoverableEarlyEof"
};
class X {
  constructor(e) {
    this._type = e || "undefined", this._status = A.kIdle, this._needStash = !1, this._onContentLengthKnown = null, this._onURLRedirect = null, this._onDataArrival = null, this._onError = null, this._onComplete = null;
  }
  destroy() {
    this._status = A.kIdle, this._onContentLengthKnown = null, this._onURLRedirect = null, this._onDataArrival = null, this._onError = null, this._onComplete = null;
  }
  isWorking() {
    return this._status === A.kConnecting || this._status === A.kBuffering;
  }
  get type() {
    return this._type;
  }
  get status() {
    return this._status;
  }
  get needStashBuffer() {
    return this._needStash;
  }
  get onContentLengthKnown() {
    return this._onContentLengthKnown;
  }
  set onContentLengthKnown(e) {
    this._onContentLengthKnown = e;
  }
  get onURLRedirect() {
    return this._onURLRedirect;
  }
  set onURLRedirect(e) {
    this._onURLRedirect = e;
  }
  get onDataArrival() {
    return this._onDataArrival;
  }
  set onDataArrival(e) {
    this._onDataArrival = e;
  }
  get onError() {
    return this._onError;
  }
  set onError(e) {
    this._onError = e;
  }
  get onComplete() {
    return this._onComplete;
  }
  set onComplete(e) {
    this._onComplete = e;
  }
  // pure virtual
  open(e, t) {
    throw new $("Unimplemented abstract function!");
  }
  abort() {
    throw new $("Unimplemented abstract function!");
  }
}
let y = {};
function de() {
  let r = self.navigator.userAgent.toLowerCase(), e = /(edge)\/([\w.]+)/.exec(r) || /(opr)[\/]([\w.]+)/.exec(r) || /(chrome)[ \/]([\w.]+)/.exec(r) || /(iemobile)[\/]([\w.]+)/.exec(r) || /(version)(applewebkit)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(r) || /(webkit)[ \/]([\w.]+).*(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(
    r
  ) || /(webkit)[ \/]([\w.]+)/.exec(r) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(r) || /(msie) ([\w.]+)/.exec(r) || r.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec(r) || r.indexOf("compatible") < 0 && /(firefox)[ \/]([\w.]+)/.exec(r) || [], t = /(ipad)/.exec(r) || /(ipod)/.exec(r) || /(windows phone)/.exec(r) || /(iphone)/.exec(r) || /(kindle)/.exec(r) || /(android)/.exec(r) || /(windows)/.exec(r) || /(mac)/.exec(r) || /(linux)/.exec(r) || /(cros)/.exec(r) || [], i = {
    browser: e[5] || e[3] || e[1] || "",
    version: e[2] || e[4] || "0",
    majorVersion: e[4] || e[2] || "0",
    platform: t[0] || ""
  }, s = {};
  if (i.browser) {
    s[i.browser] = !0;
    let a = i.majorVersion.split(".");
    s.version = {
      major: parseInt(i.majorVersion, 10),
      string: i.version
    }, a.length > 1 && (s.version.minor = parseInt(a[1], 10)), a.length > 2 && (s.version.build = parseInt(a[2], 10));
  }
  if (i.platform && (s[i.platform] = !0), (s.chrome || s.opr || s.safari) && (s.webkit = !0), s.rv || s.iemobile) {
    s.rv && delete s.rv;
    let a = "msie";
    i.browser = a, s[a] = !0;
  }
  if (s.edge) {
    delete s.edge;
    let a = "msedge";
    i.browser = a, s[a] = !0;
  }
  if (s.opr) {
    let a = "opera";
    i.browser = a, s[a] = !0;
  }
  if (s.safari && s.android) {
    let a = "android";
    i.browser = a, s[a] = !0;
  }
  s.name = i.browser, s.platform = i.platform;
  for (let a in y)
    y.hasOwnProperty(a) && delete y[a];
  Object.assign(y, s);
}
de();
class j extends X {
  static isSupported() {
    try {
      let e = y.msedge && y.version.minor >= 15048, t = y.msedge ? e : !0;
      return self.fetch && self.ReadableStream && t;
    } catch {
      return !1;
    }
  }
  constructor(e, t) {
    super("fetch-stream-loader"), this.TAG = "FetchStreamLoader", this._seekHandler = e, this._config = t, this._needStash = !0, this._requestAbort = !1, this._abortController = null, this._contentLength = null, this._receivedLength = 0;
  }
  destroy() {
    this.isWorking() && this.abort(), super.destroy();
  }
  open(e, t) {
    this._dataSource = e, this._range = t;
    let i = e.url;
    this._config.reuseRedirectedURL && e.redirectedURL != null && (i = e.redirectedURL);
    let s = this._seekHandler.getConfig(i, t), a = new self.Headers();
    if (typeof s.headers == "object") {
      let c = s.headers;
      for (let S in c)
        c.hasOwnProperty(S) && a.append(S, c[S]);
    }
    let d = {
      method: "GET",
      headers: a,
      mode: "cors",
      cache: "default",
      // The default policy of Fetch API in the whatwg standard
      // Safari incorrectly indicates 'no-referrer' as default policy, fuck it
      referrerPolicy: "no-referrer-when-downgrade"
    };
    if (typeof this._config.headers == "object")
      for (let c in this._config.headers)
        a.append(c, this._config.headers[c]);
    e.cors === !1 && (d.mode = "same-origin"), e.withCredentials && (d.credentials = "include"), e.referrerPolicy && (d.referrerPolicy = e.referrerPolicy), self.AbortController && (this._abortController = new self.AbortController(), d.signal = this._abortController.signal), this._status = A.kConnecting, self.fetch(s.url, d).then((c) => {
      if (this._requestAbort) {
        this._status = A.kIdle, c.body.cancel();
        return;
      }
      if (c.ok && c.status >= 200 && c.status <= 299) {
        if (c.url !== s.url && this._onURLRedirect) {
          let T = this._seekHandler.removeURLParameters(
            c.url
          );
          this._onURLRedirect(T);
        }
        let S = c.headers.get("Content-Length");
        return S != null && (this._contentLength = parseInt(S), this._contentLength !== 0 && this._onContentLengthKnown && this._onContentLengthKnown(this._contentLength)), this._pump.call(this, c.body.getReader());
      } else if (this._status = A.kError, this._onError)
        this._onError(b.HTTP_STATUS_CODE_INVALID, {
          code: c.status,
          msg: c.statusText
        });
      else
        throw new C(
          "FetchStreamLoader: Http code invalid, " + c.status + " " + c.statusText
        );
    }).catch((c) => {
      if (!(this._abortController && this._abortController.signal.aborted))
        if (this._status = A.kError, this._onError)
          this._onError(b.EXCEPTION, { code: -1, msg: c.message });
        else
          throw c;
    });
  }
  abort() {
    if (this._requestAbort = !0, (this._status !== A.kBuffering || !y.chrome) && this._abortController)
      try {
        this._abortController.abort();
      } catch {
      }
  }
  _pump(e) {
    return e.read().then((t) => {
      if (t.done)
        if (this._contentLength !== null && this._receivedLength < this._contentLength) {
          this._status = A.kError;
          let i = b.EARLY_EOF, s = { code: -1, msg: "Fetch stream meet Early-EOF" };
          if (this._onError)
            this._onError(i, s);
          else
            throw new C(s.msg);
        } else
          this._status = A.kComplete, this._onComplete && this._onComplete(
            this._range.from,
            this._range.from + this._receivedLength - 1
          );
      else {
        if (this._abortController && this._abortController.signal.aborted) {
          this._status = A.kComplete;
          return;
        } else if (this._requestAbort === !0)
          return this._status = A.kComplete, e.cancel();
        this._status = A.kBuffering;
        let i = t.value.buffer, s = this._range.from + this._receivedLength;
        this._receivedLength += i.byteLength, this._onDataArrival && this._onDataArrival(i, s, this._receivedLength), this._pump(e);
      }
    }).catch((t) => {
      if (this._abortController && this._abortController.signal.aborted) {
        this._status = A.kComplete;
        return;
      }
      if (t.code === 11 && y.msedge)
        return;
      this._status = A.kError;
      let i = 0, s = null;
      if ((t.code === 19 || t.message === "network error") && // NETWORK_ERR
      (this._contentLength === null || this._contentLength !== null && this._receivedLength < this._contentLength) ? (i = b.EARLY_EOF, s = { code: t.code, msg: "Fetch stream meet Early-EOF" }) : (i = b.EXCEPTION, s = { code: t.code, msg: t.message }), this._onError)
        this._onError(i, s);
      else
        throw new C(s.msg);
    });
  }
}
class he {
  constructor(e) {
    this._zeroStart = e || !1;
  }
  getConfig(e, t) {
    let i = {};
    if (t.from !== 0 || t.to !== -1) {
      let s;
      t.to !== -1 ? s = `bytes=${t.from.toString()}-${t.to.toString()}` : s = `bytes=${t.from.toString()}-`, i.Range = s;
    } else this._zeroStart && (i.Range = "bytes=0-");
    return {
      url: e,
      headers: i
    };
  }
  removeURLParameters(e) {
    return e;
  }
}
class ce {
  constructor(e, t) {
    this._startName = e, this._endName = t;
  }
  getConfig(e, t) {
    let i = e;
    if (t.from !== 0 || t.to !== -1) {
      let s = !0;
      i.indexOf("?") === -1 && (i += "?", s = !1), s && (i += "&"), i += `${this._startName}=${t.from.toString()}`, t.to !== -1 && (i += `&${this._endName}=${t.to.toString()}`);
    }
    return {
      url: i,
      headers: {}
    };
  }
  removeURLParameters(e) {
    let t = e.split("?")[0], i, s = e.indexOf("?");
    s !== -1 && (i = e.substring(s + 1));
    let a = "";
    if (i != null && i.length > 0) {
      let d = i.split("&");
      for (let c = 0; c < d.length; c++) {
        let S = d[c].split("="), T = c > 0;
        S[0] !== this._startName && S[0] !== this._endName && (T && (a += "&"), a += d[c]);
      }
    }
    return a.length === 0 ? t : t + "?" + a;
  }
}
class H {
  constructor(e, t, i) {
    this.TAG = "IOController", this._config = t, this._extraData = i, this._stashInitialSize = 64 * 1024, t.stashInitialSize != null && t.stashInitialSize > 0 && (this._stashInitialSize = t.stashInitialSize), this._stashUsed = 0, this._stashSize = this._stashInitialSize, this._bufferSize = Math.max(this._stashSize, 1024 * 1024 * 3), this._stashBuffer = new ArrayBuffer(this._bufferSize), this._stashByteStart = 0, this._enableStash = !0, t.enableStashBuffer === !1 && (this._enableStash = !1), this._loader = null, this._loaderClass = null, this._seekHandler = null, this._dataSource = e, this._isWebSocketURL = /wss?:\/\/(.+?)/.test(e.url), this._refTotalLength = e.filesize ? e.filesize : null, this._totalLength = this._refTotalLength, this._fullRequestFlag = !1, this._currentRange = null, this._redirectedURL = null, this._speedNormalized = 0, this._speedSampler = new _e(), this._speedNormalizeList = [
      32,
      64,
      96,
      128,
      192,
      256,
      384,
      512,
      768,
      1024,
      1536,
      2048,
      3072,
      4096
    ], this._isEarlyEofReconnecting = !1, this._paused = !1, this._resumeFrom = 0, this._onDataArrival = null, this._onSeeked = null, this._onError = null, this._onComplete = null, this._onRedirect = null, this._onRecoveredEarlyEof = null, this._selectSeekHandler(), this._selectLoader(), this._createLoader();
  }
  destroy() {
    this._loader.isWorking() && this._loader.abort(), this._loader.destroy(), this._loader = null, this._loaderClass = null, this._dataSource = null, this._stashBuffer = null, this._stashUsed = this._stashSize = this._bufferSize = this._stashByteStart = 0, this._currentRange = null, this._speedSampler = null, this._isEarlyEofReconnecting = !1, this._onDataArrival = null, this._onSeeked = null, this._onError = null, this._onComplete = null, this._onRedirect = null, this._onRecoveredEarlyEof = null, this._extraData = null;
  }
  isWorking() {
    return this._loader && this._loader.isWorking() && !this._paused;
  }
  isPaused() {
    return this._paused;
  }
  get status() {
    return this._loader.status;
  }
  get extraData() {
    return this._extraData;
  }
  set extraData(e) {
    this._extraData = e;
  }
  // prototype: function onDataArrival(chunks: ArrayBuffer, byteStart: number): number
  get onDataArrival() {
    return this._onDataArrival;
  }
  set onDataArrival(e) {
    this._onDataArrival = e;
  }
  get onSeeked() {
    return this._onSeeked;
  }
  set onSeeked(e) {
    this._onSeeked = e;
  }
  // prototype: function onError(type: number, info: {code: number, msg: string}): void
  get onError() {
    return this._onError;
  }
  set onError(e) {
    this._onError = e;
  }
  get onComplete() {
    return this._onComplete;
  }
  set onComplete(e) {
    this._onComplete = e;
  }
  get onRedirect() {
    return this._onRedirect;
  }
  set onRedirect(e) {
    this._onRedirect = e;
  }
  get onRecoveredEarlyEof() {
    return this._onRecoveredEarlyEof;
  }
  set onRecoveredEarlyEof(e) {
    this._onRecoveredEarlyEof = e;
  }
  get currentURL() {
    return this._dataSource.url;
  }
  get hasRedirect() {
    return this._redirectedURL != null || this._dataSource.redirectedURL != null;
  }
  get currentRedirectedURL() {
    return this._redirectedURL || this._dataSource.redirectedURL;
  }
  // in KB/s
  get currentSpeed() {
    return this._speedSampler.lastSecondKBps;
  }
  get loaderType() {
    return this._loader.type;
  }
  _selectSeekHandler() {
    let e = this._config;
    if (e.seekType === "range")
      this._seekHandler = new he(this._config.rangeLoadZeroStart);
    else if (e.seekType === "param") {
      let t = e.seekParamStart || "bstart", i = e.seekParamEnd || "bend";
      this._seekHandler = new ce(t, i);
    } else if (e.seekType === "custom") {
      if (typeof e.customSeekHandler != "function")
        throw new D(
          "Custom seekType specified in config but invalid customSeekHandler!"
        );
      this._seekHandler = new e.customSeekHandler();
    } else
      throw new D(
        `Invalid seekType in config: ${e.seekType}`
      );
  }
  _selectLoader() {
    if (this._config.customLoader != null)
      this._loaderClass = this._config.customLoader;
    else {
      if (this._isWebSocketURL)
        throw new Error("WebSocketLoader is explicitly disabled");
      if (j.isSupported())
        this._loaderClass = j;
      else
        throw new C(
          "Your browser doesn't support xhr with arraybuffer responseType!"
        );
    }
  }
  _createLoader() {
    this._loader = new this._loaderClass(this._seekHandler, this._config), this._loader.needStashBuffer === !1 && (this._enableStash = !1), this._loader.onContentLengthKnown = this._onContentLengthKnown.bind(this), this._loader.onURLRedirect = this._onURLRedirect.bind(this), this._loader.onDataArrival = this._onLoaderChunkArrival.bind(this), this._loader.onComplete = this._onLoaderComplete.bind(this), this._loader.onError = this._onLoaderError.bind(this);
  }
  open(e) {
    this._currentRange = { from: 0, to: -1 }, e && (this._currentRange.from = e), this._speedSampler.reset(), e || (this._fullRequestFlag = !0), this._loader.open(this._dataSource, Object.assign({}, this._currentRange));
  }
  abort() {
    this._loader.abort(), this._paused && (this._paused = !1, this._resumeFrom = 0);
  }
  pause() {
    this.isWorking() && (this._loader.abort(), this._stashUsed !== 0 ? (this._resumeFrom = this._stashByteStart, this._currentRange.to = this._stashByteStart - 1) : this._resumeFrom = this._currentRange.to + 1, this._stashUsed = 0, this._stashByteStart = 0, this._paused = !0);
  }
  resume() {
    if (this._paused) {
      this._paused = !1;
      let e = this._resumeFrom;
      this._resumeFrom = 0, this._internalSeek(e, !0);
    }
  }
  seek(e) {
    this._paused = !1, this._stashUsed = 0, this._stashByteStart = 0, this._internalSeek(e, !0);
  }
  /**
   * When seeking request is from media seeking, unconsumed stash data should be dropped
   * However, stash data shouldn't be dropped if seeking requested from http reconnection
   *
   * @dropUnconsumed: Ignore and discard all unconsumed data in stash buffer
   */
  _internalSeek(e, t) {
    this._loader.isWorking() && this._loader.abort(), this._flushStashBuffer(t), this._loader.destroy(), this._loader = null;
    let i = { from: e, to: -1 };
    this._currentRange = { from: i.from, to: -1 }, this._speedSampler.reset(), this._stashSize = this._stashInitialSize, this._createLoader(), this._loader.open(this._dataSource, i), this._onSeeked && this._onSeeked();
  }
  updateUrl(e) {
    if (!e || typeof e != "string" || e.length === 0)
      throw new D("Url must be a non-empty string!");
    this._dataSource.url = e;
  }
  _expandBuffer(e) {
    let t = this._stashSize;
    for (; t + 1024 * 1024 * 1 < e; )
      t *= 2;
    if (t += 1024 * 1024 * 1, t === this._bufferSize)
      return;
    let i = new ArrayBuffer(t);
    if (this._stashUsed > 0) {
      let s = new Uint8Array(this._stashBuffer, 0, this._stashUsed);
      new Uint8Array(i, 0, t).set(s, 0);
    }
    this._stashBuffer = i, this._bufferSize = t;
  }
  _normalizeSpeed(e) {
    let t = this._speedNormalizeList, i = t.length - 1, s = 0, a = 0, d = i;
    if (e < t[0])
      return t[0];
    for (; a <= d; ) {
      if (s = a + Math.floor((d - a) / 2), s === i || e >= t[s] && e < t[s + 1])
        return t[s];
      t[s] < e ? a = s + 1 : d = s - 1;
    }
  }
  _adjustStashSize(e) {
    let t = 0;
    this._config.isLive ? t = e / 8 : e < 512 ? t = e : e >= 512 && e <= 1024 ? t = Math.floor(e * 1.5) : t = e * 2, t > 8192 && (t = 8192);
    let i = t * 1024 + 1024 * 1024 * 1;
    this._bufferSize < i && this._expandBuffer(i), this._stashSize = t * 1024;
  }
  _dispatchChunks(e, t) {
    return this._currentRange.to = t + e.byteLength - 1, this._onDataArrival(e, t);
  }
  _onURLRedirect(e) {
    this._redirectedURL = e, this._onRedirect && this._onRedirect(e);
  }
  _onContentLengthKnown(e) {
    e && this._fullRequestFlag && (this._totalLength = e, this._fullRequestFlag = !1);
  }
  _onLoaderChunkArrival(e, t, i) {
    if (!this._onDataArrival)
      throw new w(
        "IOController: No existing consumer (onDataArrival) callback!"
      );
    if (this._paused)
      return;
    this._isEarlyEofReconnecting && (this._isEarlyEofReconnecting = !1, this._onRecoveredEarlyEof && this._onRecoveredEarlyEof()), this._speedSampler.addBytes(e.byteLength);
    let s = this._speedSampler.lastSecondKBps;
    if (s !== 0) {
      let a = this._normalizeSpeed(s);
      this._speedNormalized !== a && (this._speedNormalized = a, this._adjustStashSize(a));
    }
    if (this._enableStash)
      if (this._stashUsed === 0 && this._stashByteStart === 0 && (this._stashByteStart = t), this._stashUsed + e.byteLength <= this._stashSize)
        new Uint8Array(this._stashBuffer, 0, this._stashSize).set(new Uint8Array(e), this._stashUsed), this._stashUsed += e.byteLength;
      else {
        let a = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
        if (this._stashUsed > 0) {
          let d = this._stashBuffer.slice(0, this._stashUsed), c = this._dispatchChunks(d, this._stashByteStart);
          if (c < d.byteLength) {
            if (c > 0) {
              let S = new Uint8Array(d, c);
              a.set(S, 0), this._stashUsed = S.byteLength, this._stashByteStart += c;
            }
          } else
            this._stashUsed = 0, this._stashByteStart += c;
          this._stashUsed + e.byteLength > this._bufferSize && (this._expandBuffer(this._stashUsed + e.byteLength), a = new Uint8Array(this._stashBuffer, 0, this._bufferSize)), a.set(new Uint8Array(e), this._stashUsed), this._stashUsed += e.byteLength;
        } else {
          let d = this._dispatchChunks(e, t);
          if (d < e.byteLength) {
            let c = e.byteLength - d;
            c > this._bufferSize && (this._expandBuffer(c), a = new Uint8Array(
              this._stashBuffer,
              0,
              this._bufferSize
            )), a.set(new Uint8Array(e, d), 0), this._stashUsed += c, this._stashByteStart = t + d;
          }
        }
      }
    else if (this._stashUsed === 0) {
      let a = this._dispatchChunks(e, t);
      if (a < e.byteLength) {
        let d = e.byteLength - a;
        d > this._bufferSize && this._expandBuffer(d), new Uint8Array(
          this._stashBuffer,
          0,
          this._bufferSize
        ).set(new Uint8Array(e, a), 0), this._stashUsed += d, this._stashByteStart = t + a;
      }
    } else {
      this._stashUsed + e.byteLength > this._bufferSize && this._expandBuffer(this._stashUsed + e.byteLength);
      let a = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
      a.set(new Uint8Array(e), this._stashUsed), this._stashUsed += e.byteLength;
      let d = this._dispatchChunks(
        this._stashBuffer.slice(0, this._stashUsed),
        this._stashByteStart
      );
      if (d < this._stashUsed && d > 0) {
        let c = new Uint8Array(this._stashBuffer, d);
        a.set(c, 0);
      }
      this._stashUsed -= d, this._stashByteStart += d;
    }
  }
  _flushStashBuffer(e) {
    if (this._stashUsed > 0) {
      let t = this._stashBuffer.slice(0, this._stashUsed), i = this._dispatchChunks(t, this._stashByteStart), s = t.byteLength - i;
      if (i < t.byteLength)
        if (e)
          n.w(
            this.TAG,
            `${s} bytes unconsumed data remain when flush buffer, dropped`
          );
        else {
          if (i > 0) {
            let a = new Uint8Array(
              this._stashBuffer,
              0,
              this._bufferSize
            ), d = new Uint8Array(t, i);
            a.set(d, 0), this._stashUsed = d.byteLength, this._stashByteStart += i;
          }
          return 0;
        }
      return this._stashUsed = 0, this._stashByteStart = 0, s;
    }
    return 0;
  }
  _onLoaderComplete(e, t) {
    this._flushStashBuffer(!0), this._onComplete && this._onComplete(this._extraData);
  }
  _onLoaderError(e, t) {
    switch (n.e(this.TAG, `Loader error, code = ${t.code}, msg = ${t.msg}`), this._flushStashBuffer(!1), this._isEarlyEofReconnecting && (this._isEarlyEofReconnecting = !1, e = b.UNRECOVERABLE_EARLY_EOF), e) {
      case b.EARLY_EOF: {
        if (!this._config.isLive && this._totalLength) {
          let i = this._currentRange.to + 1;
          i < this._totalLength && (n.w(this.TAG, "Connection lost, trying reconnect..."), this._isEarlyEofReconnecting = !0, this._internalSeek(i, !1));
          return;
        }
        e = b.UNRECOVERABLE_EARLY_EOF;
        break;
      }
      case b.UNRECOVERABLE_EARLY_EOF:
      case b.CONNECTING_TIMEOUT:
      case b.HTTP_STATUS_CODE_INVALID:
      case b.EXCEPTION:
        break;
    }
    if (this._onError)
      this._onError(e, t);
    else
      throw new C("IOException: " + t.msg);
  }
}
const ue = {
  enableWorker: !1,
  enableWorkerForMSE: !1,
  enableStashBuffer: !0,
  stashInitialSize: void 0,
  isLive: !1,
  liveBufferLatencyChasing: !1,
  liveBufferLatencyChasingOnPaused: !1,
  liveBufferLatencyMaxLatency: 1.5,
  liveBufferLatencyMinRemain: 0.5,
  liveSync: !1,
  liveSyncMaxLatency: 1.2,
  liveSyncTargetLatency: 0.8,
  liveSyncPlaybackRate: 1.2,
  lazyLoad: !0,
  lazyLoadMaxDuration: 180,
  lazyLoadRecoverDuration: 30,
  deferLoadAfterSourceOpen: !0,
  // autoCleanupSourceBuffer: default as false, leave unspecified
  autoCleanupMaxBackwardDuration: 180,
  autoCleanupMinBackwardDuration: 120,
  statisticsInfoReportInterval: 600,
  fixAudioTimestampGap: !0,
  accurateSeek: !1,
  seekType: "range",
  // [range, param, custom]
  seekParamStart: "bstart",
  seekParamEnd: "bend",
  rangeLoadZeroStart: !1,
  customSeekHandler: void 0,
  reuseRedirectedURL: !1,
  // referrerPolicy: leave as unspecified
  headers: void 0,
  customLoader: void 0
};
function U() {
  return Object.assign({}, ue);
}
class v {
  static supportMSEH264Playback() {
    const e = 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"', t = self.MediaSource && self.MediaSource.isTypeSupported(e), i = self.ManagedMediaSource && self.ManagedMediaSource.isTypeSupported(e);
    return t || i;
  }
  static supportMSEH265Playback() {
    const e = 'video/mp4; codecs="hvc1.1.6.L93.B0"', t = self.MediaSource && self.MediaSource.isTypeSupported(e), i = self.ManagedMediaSource && self.ManagedMediaSource.isTypeSupported(e);
    return t || i;
  }
  static supportNetworkStreamIO() {
    let e = new H({}, U()), t = e.loaderType;
    return e.destroy(), t == "fetch-stream-loader" || t == "xhr-moz-chunked-loader";
  }
  static getNetworkLoaderTypeName() {
    let e = new H({}, U()), t = e.loaderType;
    return e.destroy(), t;
  }
  static supportNativeMediaPlayback(e) {
    v.videoElement == null && (v.videoElement = window.document.createElement("video"));
    let t = v.videoElement.canPlayType(e);
    return t === "probably" || t == "maybe";
  }
  static getFeatureList() {
    let e = {
      msePlayback: !1,
      mseLivePlayback: !1,
      mseH265Playback: !1,
      networkStreamIO: !1,
      networkLoaderName: "",
      nativeMP4H264Playback: !1,
      nativeMP4H265Playback: !1,
      nativeWebmVP8Playback: !1,
      nativeWebmVP9Playback: !1
    };
    return e.msePlayback = v.supportMSEH264Playback(), e.networkStreamIO = v.supportNetworkStreamIO(), e.networkLoaderName = v.getNetworkLoaderTypeName(), e.mseLivePlayback = e.msePlayback && e.networkStreamIO, e.mseH265Playback = v.supportMSEH265Playback(), e.nativeMP4H264Playback = v.supportNativeMediaPlayback(
      'video/mp4; codecs="avc1.42001E, mp4a.40.2"'
    ), e.nativeMP4H265Playback = v.supportNativeMediaPlayback(
      'video/mp4; codecs="hvc1.1.6.L93.B0"'
    ), e.nativeWebmVP8Playback = v.supportNativeMediaPlayback(
      'video/webm; codecs="vp8.0, vorbis"'
    ), e.nativeWebmVP9Playback = v.supportNativeMediaPlayback(
      'video/webm; codecs="vp9"'
    ), e;
  }
}
var L = /* @__PURE__ */ ((r) => (r.ERROR = "error", r.SOURCE_OPEN = "source_open", r.UPDATE_END = "update_end", r.BUFFER_FULL = "buffer_full", r.START_STREAMING = "start_streaming", r.END_STREAMING = "end_streaming", r))(L || {});
class fe {
  constructor(e) {
    this.TAG = "MSEController", this._config = e, this._emitter = new M(), this._config.isLive && this._config.autoCleanupSourceBuffer == null && (this._config.autoCleanupSourceBuffer = !0), this.e = {
      onSourceOpen: this._onSourceOpen.bind(this),
      onSourceEnded: this._onSourceEnded.bind(this),
      onSourceClose: this._onSourceClose.bind(this),
      onStartStreaming: this._onStartStreaming.bind(this),
      onEndStreaming: this._onEndStreaming.bind(this),
      onQualityChange: this._onQualityChange.bind(this),
      onSourceBufferError: this._onSourceBufferError.bind(this),
      onSourceBufferUpdateEnd: this._onSourceBufferUpdateEnd.bind(this)
    }, this._useManagedMediaSource = "ManagedMediaSource" in self && !("MediaSource" in self), this._mediaSource = null, this._mediaSourceObjectURL = null, this._mediaElementProxy = null, this._isBufferFull = !1, this._hasPendingEos = !1, this._requireSetMediaDuration = !1, this._pendingMediaDuration = 0, this._pendingSourceBufferInit = [], this._mimeTypes = {
      video: null,
      audio: null
    }, this._sourceBuffers = {
      video: null,
      audio: null
    }, this._lastInitSegments = {
      video: null,
      audio: null
    }, this._pendingSegments = {
      video: [],
      audio: []
    }, this._pendingRemoveRanges = {
      video: [],
      audio: []
    };
  }
  destroy() {
    this._mediaSource && this.shutdown(), this._mediaSourceObjectURL && this.revokeObjectURL(), this.e = null, this._emitter.removeAllListeners(), this._emitter = null;
  }
  on(e, t) {
    this._emitter.addListener(e, t);
  }
  off(e, t) {
    this._emitter.removeListener(e, t);
  }
  initialize(e) {
    if (this._mediaSource)
      throw new w(
        "MediaSource has been attached to an HTMLMediaElement!"
      );
    this._useManagedMediaSource && n.v(this.TAG, "Using ManagedMediaSource");
    let t = this._mediaSource = this._useManagedMediaSource ? new self.ManagedMediaSource() : new self.MediaSource();
    t.addEventListener("sourceopen", this.e.onSourceOpen), t.addEventListener("sourceended", this.e.onSourceEnded), t.addEventListener("sourceclose", this.e.onSourceClose), this._useManagedMediaSource && (t.addEventListener("startstreaming", this.e.onStartStreaming), t.addEventListener("endstreaming", this.e.onEndStreaming), t.addEventListener("qualitychange", this.e.onQualityChange)), this._mediaElementProxy = e;
  }
  shutdown() {
    if (this._mediaSource) {
      let e = this._mediaSource;
      for (let t in this._sourceBuffers) {
        let i = this._pendingSegments[t];
        i.splice(0, i.length), this._pendingSegments[t] = null, this._pendingRemoveRanges[t] = null, this._lastInitSegments[t] = null;
        let s = this._sourceBuffers[t];
        if (s) {
          if (e.readyState !== "closed") {
            try {
              e.removeSourceBuffer(s);
            } catch (a) {
              n.e(this.TAG, a.message);
            }
            s.removeEventListener("error", this.e.onSourceBufferError), s.removeEventListener("updateend", this.e.onSourceBufferUpdateEnd);
          }
          this._mimeTypes[t] = null, this._sourceBuffers[t] = null;
        }
      }
      if (e.readyState === "open")
        try {
          e.endOfStream();
        } catch (t) {
          n.e(this.TAG, t.message);
        }
      this._mediaElementProxy = null, e.removeEventListener("sourceopen", this.e.onSourceOpen), e.removeEventListener("sourceended", this.e.onSourceEnded), e.removeEventListener("sourceclose", this.e.onSourceClose), this._useManagedMediaSource && (e.removeEventListener("startstreaming", this.e.onStartStreaming), e.removeEventListener("endstreaming", this.e.onEndStreaming), e.removeEventListener("qualitychange", this.e.onQualityChange)), this._pendingSourceBufferInit = [], this._isBufferFull = !1, this._mediaSource = null;
    }
  }
  isManagedMediaSource() {
    return this._useManagedMediaSource;
  }
  getObject() {
    if (!this._mediaSource)
      throw new w(
        "MediaSource has not been initialized yet!"
      );
    return this._mediaSource;
  }
  getHandle() {
    if (!this._mediaSource)
      throw new w(
        "MediaSource has not been initialized yet!"
      );
    return this._mediaSource.handle;
  }
  getObjectURL() {
    if (!this._mediaSource)
      throw new w(
        "MediaSource has not been initialized yet!"
      );
    return this._mediaSourceObjectURL == null && (this._mediaSourceObjectURL = URL.createObjectURL(this._mediaSource)), this._mediaSourceObjectURL;
  }
  revokeObjectURL() {
    this._mediaSourceObjectURL && (URL.revokeObjectURL(this._mediaSourceObjectURL), this._mediaSourceObjectURL = null);
  }
  appendInitSegment(e, t = void 0) {
    if (!this._mediaSource || this._mediaSource.readyState !== "open" || this._mediaSource.streaming === !1) {
      this._pendingSourceBufferInit.push(e), this._pendingSegments[e.type].push(e);
      return;
    }
    let i = e, s = `${i.container}`;
    i.codec && i.codec.length > 0 && (i.codec === "opus" && y.safari && (i.codec = "Opus"), s += `;codecs=${i.codec}`);
    let a = !1;
    if (n.v(this.TAG, "Received Initialization Segment, mimeType: " + s), this._lastInitSegments[i.type] = i, s !== this._mimeTypes[i.type]) {
      if (this._mimeTypes[i.type])
        n.v(
          this.TAG,
          `Notice: ${i.type} mimeType changed, origin: ${this._mimeTypes[i.type]}, target: ${s}`
        );
      else {
        a = !0;
        try {
          let d = this._sourceBuffers[i.type] = this._mediaSource.addSourceBuffer(s);
          d.addEventListener("error", this.e.onSourceBufferError), d.addEventListener("updateend", this.e.onSourceBufferUpdateEnd);
        } catch (d) {
          if (n.e(this.TAG, d.message), d.name !== "NotSupportedError") {
            this._emitter.emit(L.ERROR, {
              code: d.code,
              msg: d.message
            });
            return;
          }
        }
      }
      this._mimeTypes[i.type] = s;
    }
    t || this._pendingSegments[i.type].push(i), a || this._sourceBuffers[i.type] && !this._sourceBuffers[i.type].updating && this._doAppendSegments(), y.safari && i.container === "audio/mpeg" && i.mediaDuration > 0 && (this._requireSetMediaDuration = !0, this._pendingMediaDuration = i.mediaDuration / 1e3, this._updateMediaSourceDuration());
  }
  appendMediaSegment(e) {
    let t = e;
    this._pendingSegments[t.type].push(t), this._config.autoCleanupSourceBuffer && this._needCleanupSourceBuffer() && this._doCleanupSourceBuffer();
    let i = this._sourceBuffers[t.type];
    i && !i.updating && !this._hasPendingRemoveRanges() && this._doAppendSegments();
  }
  flush() {
    for (let e in this._sourceBuffers) {
      if (!this._sourceBuffers[e])
        continue;
      let t = this._sourceBuffers[e];
      if (this._mediaSource.readyState === "open")
        try {
          t.abort();
        } catch (s) {
          n.e(this.TAG, s.message);
        }
      let i = this._pendingSegments[e];
      if (i.splice(0, i.length), this._mediaSource.readyState !== "closed") {
        for (let s = 0; s < t.buffered.length; s++) {
          let a = t.buffered.start(s), d = t.buffered.end(s);
          this._pendingRemoveRanges[e].push({ start: a, end: d });
        }
        if (t.updating || this._doRemoveRanges(), y.safari) {
          let s = this._lastInitSegments[e];
          s && (this._pendingSegments[e].push(s), t.updating || this._doAppendSegments());
        }
      }
    }
  }
  endOfStream() {
    let e = this._mediaSource, t = this._sourceBuffers;
    if (!e || e.readyState !== "open") {
      e && e.readyState === "closed" && this._hasPendingSegments() && (this._hasPendingEos = !0);
      return;
    }
    t.video && t.video.updating || t.audio && t.audio.updating ? this._hasPendingEos = !0 : (this._hasPendingEos = !1, e.endOfStream());
  }
  _needCleanupSourceBuffer() {
    if (!this._config.autoCleanupSourceBuffer)
      return !1;
    let e = this._mediaElementProxy.getCurrentTime();
    for (let t in this._sourceBuffers) {
      let i = this._sourceBuffers[t];
      if (i) {
        let s = i.buffered;
        if (s.length >= 1 && e - s.start(0) >= this._config.autoCleanupMaxBackwardDuration)
          return !0;
      }
    }
    return !1;
  }
  _doCleanupSourceBuffer() {
    let e = this._mediaElementProxy.getCurrentTime();
    for (let t in this._sourceBuffers) {
      let i = this._sourceBuffers[t];
      if (i) {
        let s = i.buffered, a = !1;
        for (let d = 0; d < s.length; d++) {
          let c = s.start(d), S = s.end(d);
          if (c <= e && e < S + 3) {
            if (e - c >= this._config.autoCleanupMaxBackwardDuration) {
              a = !0;
              let T = e - this._config.autoCleanupMinBackwardDuration;
              this._pendingRemoveRanges[t].push({
                start: c,
                end: T
              });
            }
          } else S < e && (a = !0, this._pendingRemoveRanges[t].push({ start: c, end: S }));
        }
        a && !i.updating && this._doRemoveRanges();
      }
    }
  }
  _updateMediaSourceDuration() {
    let e = this._sourceBuffers;
    if (this._mediaElementProxy.getReadyState() === 0 || this._mediaSource.readyState !== "open" || e.video && e.video.updating || e.audio && e.audio.updating)
      return;
    let t = this._mediaSource.duration, i = this._pendingMediaDuration;
    i > 0 && (isNaN(t) || i > t) && (n.v(
      this.TAG,
      `Update MediaSource duration from ${t} to ${i}`
    ), this._mediaSource.duration = i), this._requireSetMediaDuration = !1, this._pendingMediaDuration = 0;
  }
  _doRemoveRanges() {
    for (let e in this._pendingRemoveRanges) {
      if (!this._sourceBuffers[e] || this._sourceBuffers[e].updating)
        continue;
      let t = this._sourceBuffers[e], i = this._pendingRemoveRanges[e];
      for (; i.length && !t.updating; ) {
        let s = i.shift();
        t.remove(s.start, s.end);
      }
    }
  }
  _doAppendSegments() {
    let e = this._pendingSegments;
    for (let t in e)
      if (!(!this._sourceBuffers[t] || this._sourceBuffers[t].updating || this._mediaSource.streaming === !1) && e[t].length > 0) {
        let i = e[t].shift();
        if (typeof i.timestampOffset == "number" && isFinite(i.timestampOffset)) {
          let s = this._sourceBuffers[t].timestampOffset, a = i.timestampOffset / 1e3;
          Math.abs(s - a) > 0.1 && (n.v(
            this.TAG,
            `Update MPEG audio timestampOffset from ${s} to ${a}`
          ), this._sourceBuffers[t].timestampOffset = a), delete i.timestampOffset;
        }
        if (!i.data || i.data.byteLength === 0)
          continue;
        try {
          this._sourceBuffers[t].appendBuffer(i.data), this._isBufferFull = !1;
        } catch (s) {
          this._pendingSegments[t].unshift(i), s.code === 22 ? (this._isBufferFull || this._emitter.emit(L.BUFFER_FULL), this._isBufferFull = !0) : (n.e(this.TAG, s.message), this._emitter.emit(L.ERROR, {
            code: s.code,
            msg: s.message
          }));
        }
      }
  }
  _onSourceOpen() {
    if (n.v(this.TAG, "MediaSource onSourceOpen"), this._mediaSource.removeEventListener("sourceopen", this.e.onSourceOpen), this._pendingSourceBufferInit.length > 0) {
      let e = this._pendingSourceBufferInit;
      for (; e.length; ) {
        let t = e.shift();
        this.appendInitSegment(t, !0);
      }
    }
    this._hasPendingSegments() && this._doAppendSegments(), this._emitter.emit(L.SOURCE_OPEN);
  }
  _onStartStreaming() {
    n.v(this.TAG, "ManagedMediaSource onStartStreaming"), this._emitter.emit(L.START_STREAMING);
  }
  _onEndStreaming() {
    n.v(this.TAG, "ManagedMediaSource onEndStreaming"), this._emitter.emit(L.END_STREAMING);
  }
  _onQualityChange() {
    n.v(this.TAG, "ManagedMediaSource onQualityChange");
  }
  _onSourceEnded() {
    n.v(this.TAG, "MediaSource onSourceEnded");
  }
  _onSourceClose() {
    n.v(this.TAG, "MediaSource onSourceClose"), this._mediaSource && this.e != null && (this._mediaSource.removeEventListener("sourceopen", this.e.onSourceOpen), this._mediaSource.removeEventListener(
      "sourceended",
      this.e.onSourceEnded
    ), this._mediaSource.removeEventListener(
      "sourceclose",
      this.e.onSourceClose
    ), this._useManagedMediaSource && (this._mediaSource.removeEventListener(
      "startstreaming",
      this.e.onStartStreaming
    ), this._mediaSource.removeEventListener(
      "endstreaming",
      this.e.onEndStreaming
    ), this._mediaSource.removeEventListener(
      "qualitychange",
      this.e.onQualityChange
    )));
  }
  _hasPendingSegments() {
    let e = this._pendingSegments;
    return e.video.length > 0 || e.audio.length > 0;
  }
  _hasPendingRemoveRanges() {
    let e = this._pendingRemoveRanges;
    return e.video.length > 0 || e.audio.length > 0;
  }
  _onSourceBufferUpdateEnd() {
    this._requireSetMediaDuration ? this._updateMediaSourceDuration() : this._hasPendingRemoveRanges() ? this._doRemoveRanges() : this._hasPendingSegments() ? this._doAppendSegments() : this._hasPendingEos && this.endOfStream(), this._emitter.emit(L.UPDATE_END);
  }
  _onSourceBufferError(e) {
    n.e(this.TAG, `SourceBuffer Error: ${e}`);
  }
}
var g = /* @__PURE__ */ ((r) => (r.ERROR = "error", r.LOADING_COMPLETE = "loading_complete", r.RECOVERED_EARLY_EOF = "recovered_early_eof", r.MEDIA_INFO = "media_info", r.METADATA_ARRIVED = "metadata_arrived", r.SCRIPTDATA_ARRIVED = "scriptdata_arrived", r.TIMED_ID3_METADATA_ARRIVED = "timed_id3_metadata_arrived", r.PGS_SUBTITLE_ARRIVED = "pgs_subtitle_arrived", r.SYNCHRONOUS_KLV_METADATA_ARRIVED = "synchronous_klv_metadata_arrived", r.ASYNCHRONOUS_KLV_METADATA_ARRIVED = "asynchronous_klv_metadata_arrived", r.SMPTE2038_METADATA_ARRIVED = "smpte2038_metadata_arrived", r.SCTE35_METADATA_ARRIVED = "scte35_metadata_arrived", r.PES_PRIVATE_DATA_DESCRIPTOR = "pes_private_data_descriptor", r.PES_PRIVATE_DATA_ARRIVED = "pes_private_data_arrived", r.STATISTICS_INFO = "statistics_info", r.DESTROYING = "destroying", r))(g || {});
const Q = '(function(){"use strict";function We(r){return r&&r.__esModule&&Object.prototype.hasOwnProperty.call(r,"default")?r.default:r}var me={exports:{}},we;function He(){if(we)return me.exports;we=1;var r=typeof Reflect=="object"?Reflect:null,e=r&&typeof r.apply=="function"?r.apply:function(u,c,g){return Function.prototype.apply.call(u,c,g)},t;r&&typeof r.ownKeys=="function"?t=r.ownKeys:Object.getOwnPropertySymbols?t=function(u){return Object.getOwnPropertyNames(u).concat(Object.getOwnPropertySymbols(u))}:t=function(u){return Object.getOwnPropertyNames(u)};function i(f){console&&console.warn&&console.warn(f)}var s=Number.isNaN||function(u){return u!==u};function a(){a.init.call(this)}me.exports=a,me.exports.once=L,a.EventEmitter=a,a.prototype._events=void 0,a.prototype._eventsCount=0,a.prototype._maxListeners=void 0;var n=10;function o(f){if(typeof f!="function")throw new TypeError(\'The "listener" argument must be of type Function. Received type \'+typeof f)}Object.defineProperty(a,"defaultMaxListeners",{enumerable:!0,get:function(){return n},set:function(f){if(typeof f!="number"||f<0||s(f))throw new RangeError(\'The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received \'+f+".");n=f}}),a.init=function(){(this._events===void 0||this._events===Object.getPrototypeOf(this)._events)&&(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},a.prototype.setMaxListeners=function(u){if(typeof u!="number"||u<0||s(u))throw new RangeError(\'The value of "n" is out of range. It must be a non-negative number. Received \'+u+".");return this._maxListeners=u,this};function l(f){return f._maxListeners===void 0?a.defaultMaxListeners:f._maxListeners}a.prototype.getMaxListeners=function(){return l(this)},a.prototype.emit=function(u){for(var c=[],g=1;g<arguments.length;g++)c.push(arguments[g]);var E=u==="error",b=this._events;if(b!==void 0)E=E&&b.error===void 0;else if(!E)return!1;if(E){var v;if(c.length>0&&(v=c[0]),v instanceof Error)throw v;var I=new Error("Unhandled error."+(v?" ("+v.message+")":""));throw I.context=v,I}var F=b[u];if(F===void 0)return!1;if(typeof F=="function")e(F,this,c);else for(var P=F.length,T=x(F,P),g=0;g<P;++g)e(T[g],this,c);return!0};function h(f,u,c,g){var E,b,v;if(o(c),b=f._events,b===void 0?(b=f._events=Object.create(null),f._eventsCount=0):(b.newListener!==void 0&&(f.emit("newListener",u,c.listener?c.listener:c),b=f._events),v=b[u]),v===void 0)v=b[u]=c,++f._eventsCount;else if(typeof v=="function"?v=b[u]=g?[c,v]:[v,c]:g?v.unshift(c):v.push(c),E=l(f),E>0&&v.length>E&&!v.warned){v.warned=!0;var I=new Error("Possible EventEmitter memory leak detected. "+v.length+" "+String(u)+" listeners added. Use emitter.setMaxListeners() to increase limit");I.name="MaxListenersExceededWarning",I.emitter=f,I.type=u,I.count=v.length,i(I)}return f}a.prototype.addListener=function(u,c){return h(this,u,c,!1)},a.prototype.on=a.prototype.addListener,a.prototype.prependListener=function(u,c){return h(this,u,c,!0)};function y(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,arguments.length===0?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function S(f,u,c){var g={fired:!1,wrapFn:void 0,target:f,type:u,listener:c},E=y.bind(g);return E.listener=c,g.wrapFn=E,E}a.prototype.once=function(u,c){return o(c),this.on(u,S(this,u,c)),this},a.prototype.prependOnceListener=function(u,c){return o(c),this.prependListener(u,S(this,u,c)),this},a.prototype.removeListener=function(u,c){var g,E,b,v,I;if(o(c),E=this._events,E===void 0)return this;if(g=E[u],g===void 0)return this;if(g===c||g.listener===c)--this._eventsCount===0?this._events=Object.create(null):(delete E[u],E.removeListener&&this.emit("removeListener",u,g.listener||c));else if(typeof g!="function"){for(b=-1,v=g.length-1;v>=0;v--)if(g[v]===c||g[v].listener===c){I=g[v].listener,b=v;break}if(b<0)return this;b===0?g.shift():w(g,b),g.length===1&&(E[u]=g[0]),E.removeListener!==void 0&&this.emit("removeListener",u,I||c)}return this},a.prototype.off=a.prototype.removeListener,a.prototype.removeAllListeners=function(u){var c,g,E;if(g=this._events,g===void 0)return this;if(g.removeListener===void 0)return arguments.length===0?(this._events=Object.create(null),this._eventsCount=0):g[u]!==void 0&&(--this._eventsCount===0?this._events=Object.create(null):delete g[u]),this;if(arguments.length===0){var b=Object.keys(g),v;for(E=0;E<b.length;++E)v=b[E],v!=="removeListener"&&this.removeAllListeners(v);return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if(c=g[u],typeof c=="function")this.removeListener(u,c);else if(c!==void 0)for(E=c.length-1;E>=0;E--)this.removeListener(u,c[E]);return this};function p(f,u,c){var g=f._events;if(g===void 0)return[];var E=g[u];return E===void 0?[]:typeof E=="function"?c?[E.listener||E]:[E]:c?D(E):x(E,E.length)}a.prototype.listeners=function(u){return p(this,u,!0)},a.prototype.rawListeners=function(u){return p(this,u,!1)},a.listenerCount=function(f,u){return typeof f.listenerCount=="function"?f.listenerCount(u):m.call(f,u)},a.prototype.listenerCount=m;function m(f){var u=this._events;if(u!==void 0){var c=u[f];if(typeof c=="function")return 1;if(c!==void 0)return c.length}return 0}a.prototype.eventNames=function(){return this._eventsCount>0?t(this._events):[]};function x(f,u){for(var c=new Array(u),g=0;g<u;++g)c[g]=f[g];return c}function w(f,u){for(;u+1<f.length;u++)f[u]=f[u+1];f.pop()}function D(f){for(var u=new Array(f.length),c=0;c<u.length;++c)u[c]=f[c].listener||f[c];return u}function L(f,u){return new Promise(function(c,g){function E(v){f.removeListener(u,b),g(v)}function b(){typeof f.removeListener=="function"&&f.removeListener("error",E),c([].slice.call(arguments))}A(f,u,b,{once:!0}),u!=="error"&&C(f,E,{once:!0})})}function C(f,u,c){typeof f.on=="function"&&A(f,"error",u,c)}function A(f,u,c,g){if(typeof f.on=="function")g.once?f.once(u,c):f.on(u,c);else if(typeof f.addEventListener=="function")f.addEventListener(u,function E(b){g.once&&f.removeEventListener(u,E),c(b)});else throw new TypeError(\'The "emitter" argument must be of type EventEmitter. Received type \'+typeof f)}return me.exports}var Ye=He(),ye=We(Ye);class d{static e(e,t){(!e||d.FORCE_GLOBAL_TAG)&&(e=d.GLOBAL_TAG);let i=`[${e}] > ${t}`;d.ENABLE_CALLBACK&&d.emitter.emit("log","error",i),d.ENABLE_ERROR&&(console.error?console.error(i):console.warn?console.warn(i):console.log(i))}static i(e,t){(!e||d.FORCE_GLOBAL_TAG)&&(e=d.GLOBAL_TAG);let i=`[${e}] > ${t}`;d.ENABLE_CALLBACK&&d.emitter.emit("log","info",i),d.ENABLE_INFO&&(console.info?console.info(i):console.log(i))}static w(e,t){(!e||d.FORCE_GLOBAL_TAG)&&(e=d.GLOBAL_TAG);let i=`[${e}] > ${t}`;d.ENABLE_CALLBACK&&d.emitter.emit("log","warn",i),d.ENABLE_WARN&&(console.warn?console.warn(i):console.log(i))}static d(e,t){(!e||d.FORCE_GLOBAL_TAG)&&(e=d.GLOBAL_TAG);let i=`[${e}] > ${t}`;d.ENABLE_CALLBACK&&d.emitter.emit("log","debug",i),d.ENABLE_DEBUG&&(console.debug?console.debug(i):console.log(i))}static v(e,t){(!e||d.FORCE_GLOBAL_TAG)&&(e=d.GLOBAL_TAG);let i=`[${e}] > ${t}`;d.ENABLE_CALLBACK&&d.emitter.emit("log","verbose",i),d.ENABLE_VERBOSE&&console.log(i)}}d.GLOBAL_TAG="mpegts.js",d.FORCE_GLOBAL_TAG=!1,d.ENABLE_ERROR=!0,d.ENABLE_INFO=!0,d.ENABLE_WARN=!0,d.ENABLE_DEBUG=!0,d.ENABLE_VERBOSE=!0,d.ENABLE_CALLBACK=!1,d.emitter=new ye;class N{static get forceGlobalTag(){return d.FORCE_GLOBAL_TAG}static set forceGlobalTag(e){d.FORCE_GLOBAL_TAG=e,N._notifyChange()}static get globalTag(){return d.GLOBAL_TAG}static set globalTag(e){d.GLOBAL_TAG=e,N._notifyChange()}static get enableAll(){return d.ENABLE_VERBOSE&&d.ENABLE_DEBUG&&d.ENABLE_INFO&&d.ENABLE_WARN&&d.ENABLE_ERROR}static set enableAll(e){d.ENABLE_VERBOSE=e,d.ENABLE_DEBUG=e,d.ENABLE_INFO=e,d.ENABLE_WARN=e,d.ENABLE_ERROR=e,N._notifyChange()}static get enableDebug(){return d.ENABLE_DEBUG}static set enableDebug(e){d.ENABLE_DEBUG=e,N._notifyChange()}static get enableVerbose(){return d.ENABLE_VERBOSE}static set enableVerbose(e){d.ENABLE_VERBOSE=e,N._notifyChange()}static get enableInfo(){return d.ENABLE_INFO}static set enableInfo(e){d.ENABLE_INFO=e,N._notifyChange()}static get enableWarn(){return d.ENABLE_WARN}static set enableWarn(e){d.ENABLE_WARN=e,N._notifyChange()}static get enableError(){return d.ENABLE_ERROR}static set enableError(e){d.ENABLE_ERROR=e,N._notifyChange()}static getConfig(){return{globalTag:d.GLOBAL_TAG,forceGlobalTag:d.FORCE_GLOBAL_TAG,enableVerbose:d.ENABLE_VERBOSE,enableDebug:d.ENABLE_DEBUG,enableInfo:d.ENABLE_INFO,enableWarn:d.ENABLE_WARN,enableError:d.ENABLE_ERROR,enableCallback:d.ENABLE_CALLBACK}}static applyConfig(e){d.GLOBAL_TAG=e.globalTag,d.FORCE_GLOBAL_TAG=e.forceGlobalTag,d.ENABLE_VERBOSE=e.enableVerbose,d.ENABLE_DEBUG=e.enableDebug,d.ENABLE_INFO=e.enableInfo,d.ENABLE_WARN=e.enableWarn,d.ENABLE_ERROR=e.enableError,d.ENABLE_CALLBACK=e.enableCallback}static _notifyChange(){let e=N.emitter;if(e.listenerCount("change")>0){let t=N.getConfig();e.emit("change",t)}}static registerListener(e){N.emitter.addListener("change",e)}static removeListener(e){N.emitter.removeListener("change",e)}static addLogListener(e){d.emitter.addListener("log",e),d.emitter.listenerCount("log")>0&&(d.ENABLE_CALLBACK=!0,N._notifyChange())}static removeLogListener(e){d.emitter.removeListener("log",e),d.emitter.listenerCount("log")===0&&(d.ENABLE_CALLBACK=!1,N._notifyChange())}}N.emitter=new ye;let M={};function Xe(){let r=self.navigator.userAgent.toLowerCase(),e=/(edge)\\/([\\w.]+)/.exec(r)||/(opr)[\\/]([\\w.]+)/.exec(r)||/(chrome)[ \\/]([\\w.]+)/.exec(r)||/(iemobile)[\\/]([\\w.]+)/.exec(r)||/(version)(applewebkit)[ \\/]([\\w.]+).*(safari)[ \\/]([\\w.]+)/.exec(r)||/(webkit)[ \\/]([\\w.]+).*(version)[ \\/]([\\w.]+).*(safari)[ \\/]([\\w.]+)/.exec(r)||/(webkit)[ \\/]([\\w.]+)/.exec(r)||/(opera)(?:.*version|)[ \\/]([\\w.]+)/.exec(r)||/(msie) ([\\w.]+)/.exec(r)||r.indexOf("trident")>=0&&/(rv)(?::| )([\\w.]+)/.exec(r)||r.indexOf("compatible")<0&&/(firefox)[ \\/]([\\w.]+)/.exec(r)||[],t=/(ipad)/.exec(r)||/(ipod)/.exec(r)||/(windows phone)/.exec(r)||/(iphone)/.exec(r)||/(kindle)/.exec(r)||/(android)/.exec(r)||/(windows)/.exec(r)||/(mac)/.exec(r)||/(linux)/.exec(r)||/(cros)/.exec(r)||[],i={browser:e[5]||e[3]||e[1]||"",version:e[2]||e[4]||"0",majorVersion:e[4]||e[2]||"0",platform:t[0]||""},s={};if(i.browser){s[i.browser]=!0;let a=i.majorVersion.split(".");s.version={major:parseInt(i.majorVersion,10),string:i.version},a.length>1&&(s.version.minor=parseInt(a[1],10)),a.length>2&&(s.version.build=parseInt(a[2],10))}if(i.platform&&(s[i.platform]=!0),(s.chrome||s.opr||s.safari)&&(s.webkit=!0),s.rv||s.iemobile){s.rv&&delete s.rv;let a="msie";i.browser=a,s[a]=!0}if(s.edge){delete s.edge;let a="msedge";i.browser=a,s[a]=!0}if(s.opr){let a="opera";i.browser=a,s[a]=!0}if(s.safari&&s.android){let a="android";i.browser=a,s[a]=!0}s.name=i.browser,s.platform=i.platform;for(let a in M)M.hasOwnProperty(a)&&delete M[a];Object.assign(M,s)}Xe();class pe{constructor(){this.mimeType=null,this.duration=null,this.hasAudio=null,this.hasVideo=null,this.audioCodec=null,this.videoCodec=null,this.audioDataRate=null,this.videoDataRate=null,this.audioSampleRate=null,this.audioChannelCount=null,this.width=null,this.height=null,this.fps=null,this.profile=null,this.level=null,this.refFrames=null,this.chromaFormat=null,this.sarNum=null,this.sarDen=null,this.metadata=null,this.segments=null,this.segmentCount=null,this.hasKeyframesIndex=null,this.keyframesIndex=null}isComplete(){let e=this.hasAudio===!1||this.hasAudio===!0&&this.audioCodec!=null&&this.audioSampleRate!=null&&this.audioChannelCount!=null,t=this.hasVideo===!1||this.hasVideo===!0&&this.videoCodec!=null&&this.width!=null&&this.height!=null&&this.fps!=null&&this.profile!=null&&this.level!=null&&this.refFrames!=null&&this.chromaFormat!=null&&this.sarNum!=null&&this.sarDen!=null;return this.mimeType!=null&&e&&t}isSeekable(){return this.hasKeyframesIndex===!0}getNearestKeyframe(e){if(this.keyframesIndex==null)return null;let t=this.keyframesIndex,i=this._search(t.times,e);return{index:i,milliseconds:t.times[i],fileposition:t.filepositions[i]}}_search(e,t){let i=0,s=e.length-1,a=0,n=0,o=s;for(t<e[0]&&(i=0,n=o+1);n<=o;)if(a=n+Math.floor((o-n)/2),a===s||t>=e[a]&&t<e[a+1]){i=a;break}else e[a]<t?n=a+1:o=a-1;return i}}class Y{constructor(e){this._message=e}get name(){return"RuntimeException"}get message(){return this._message}toString(){return this.name+": "+this.message}}class re extends Y{constructor(e){super(e)}get name(){return"IllegalStateException"}}class xe extends Y{constructor(e){super(e)}get name(){return"InvalidArgumentException"}}class Le extends Y{constructor(e){super(e)}get name(){return"NotImplementedException"}}class Ze{constructor(){}destroy(){this.onError=null,this.onMediaInfo=null,this.onMetaDataArrived=null,this.onTrackMetadata=null,this.onDataAvailable=null,this.onTimedID3Metadata=null,this.onPGSSubtitleData=null,this.onSynchronousKLVMetadata=null,this.onAsynchronousKLVMetadata=null,this.onSMPTE2038Metadata=null,this.onSCTE35Metadata=null,this.onPESPrivateData=null,this.onPESPrivateDataDescriptor=null}}class Je{constructor(){this.program_pmt_pid={}}}var k=(r=>(r[r.kMPEG1Audio=3]="kMPEG1Audio",r[r.kMPEG2Audio=4]="kMPEG2Audio",r[r.kPESPrivateData=6]="kPESPrivateData",r[r.kADTSAAC=15]="kADTSAAC",r[r.kLOASAAC=17]="kLOASAAC",r[r.kAC3=129]="kAC3",r[r.kEAC3=135]="kEAC3",r[r.kMetadata=21]="kMetadata",r[r.kSCTE35=134]="kSCTE35",r[r.kPGS=144]="kPGS",r[r.kH264=27]="kH264",r[r.kH265=36]="kH265",r))(k||{});class Qe{constructor(){this.pid_stream_type={},this.common_pids={h264:void 0,h265:void 0,av1:void 0,adts_aac:void 0,loas_aac:void 0,opus:void 0,ac3:void 0,eac3:void 0,mp3:void 0},this.pes_private_data_pids={},this.timed_id3_pids={},this.pgs_pids={},this.pgs_langs={},this.synchronous_klv_pids={},this.asynchronous_klv_pids={},this.scte_35_pids={},this.smpte2038_pids={}}}class et{}class tt{}class Ce{constructor(){this.slices=[],this.total_length=0,this.expected_length=0,this.file_position=0}}var oe=(r=>(r[r.kUnspecified=0]="kUnspecified",r[r.kSliceNonIDR=1]="kSliceNonIDR",r[r.kSliceDPA=2]="kSliceDPA",r[r.kSliceDPB=3]="kSliceDPB",r[r.kSliceDPC=4]="kSliceDPC",r[r.kSliceIDR=5]="kSliceIDR",r[r.kSliceSEI=6]="kSliceSEI",r[r.kSliceSPS=7]="kSliceSPS",r[r.kSlicePPS=8]="kSlicePPS",r[r.kSliceAUD=9]="kSliceAUD",r[r.kEndOfSequence=10]="kEndOfSequence",r[r.kEndOfStream=11]="kEndOfStream",r[r.kFiller=12]="kFiller",r[r.kSPSExt=13]="kSPSExt",r[r.kReserved0=14]="kReserved0",r))(oe||{});class it{}class st{constructor(e){let t=e.data.byteLength;this.type=e.type,this.data=new Uint8Array(4+t),new DataView(this.data.buffer).setUint32(0,t),this.data.set(e.data,4)}}class at{constructor(e){this.TAG="H264AnnexBParser",this.current_startcode_offset_=0,this.eof_flag_=!1,this.data_=e,this.current_startcode_offset_=this.findNextStartCodeOffset(0),this.eof_flag_&&d.e(this.TAG,"Could not find H264 startcode until payload end!")}findNextStartCodeOffset(e){let t=e,i=this.data_;for(;;){if(t+3>=i.byteLength)return this.eof_flag_=!0,i.byteLength;let s=i[t+0]<<24|i[t+1]<<16|i[t+2]<<8|i[t+3],a=i[t+0]<<16|i[t+1]<<8|i[t+2];if(s===1||a===1)return t;t++}}readNextNaluPayload(){let e=this.data_,t=null;for(;t==null&&!this.eof_flag_;){let s=this.current_startcode_offset_;(e[s]<<24|e[s+1]<<16|e[s+2]<<8|e[s+3])===1?s+=4:s+=3;let n=e[s]&31,o=(e[s]&128)>>>7,l=this.findNextStartCodeOffset(s);if(this.current_startcode_offset_=l,n>=14||o!==0)continue;let h=e.subarray(s,l);t=new it,t.type=n,t.data=h}return t}}class nt{constructor(e,t,i){let s=8+e.byteLength+1+2+t.byteLength,a=!1;e[3]!==66&&e[3]!==77&&e[3]!==88&&(a=!0,s+=4);let n=this.data=new Uint8Array(s);n[0]=1,n[1]=e[1],n[2]=e[2],n[3]=e[3],n[4]=255,n[5]=225;let o=e.byteLength;n[6]=o>>>8,n[7]=o&255;let l=8;n.set(e,8),l+=o,n[l]=1;let h=t.byteLength;n[l+1]=h>>>8,n[l+2]=h&255,n.set(t,l+3),l+=3+h,a&&(n[l]=252|i.chroma_format_idc,n[l+1]=248|i.bit_depth_luma-8,n[l+2]=248|i.bit_depth_chroma-8,n[l+3]=0,l+=4)}getData(){return this.data}}class X{constructor(e){this.TAG="ExpGolomb",this._buffer=e,this._buffer_index=0,this._total_bytes=e.byteLength,this._total_bits=e.byteLength*8,this._current_word=0,this._current_word_bits_left=0}destroy(){this._buffer=null}_fillCurrentWord(){let e=this._total_bytes-this._buffer_index;if(e<=0)throw new re("ExpGolomb: _fillCurrentWord() but no bytes available");let t=Math.min(4,e),i=new Uint8Array(4);i.set(this._buffer.subarray(this._buffer_index,this._buffer_index+t)),this._current_word=new DataView(i.buffer).getUint32(0,!1),this._buffer_index+=t,this._current_word_bits_left=t*8}readBits(e){if(e>32)throw new xe("ExpGolomb: readBits() bits exceeded max 32bits!");if(e<=this._current_word_bits_left){let n=this._current_word>>>32-e;return this._current_word<<=e,this._current_word_bits_left-=e,n}let t=this._current_word_bits_left?this._current_word:0;t=t>>>32-this._current_word_bits_left;let i=e-this._current_word_bits_left;this._fillCurrentWord();let s=Math.min(i,this._current_word_bits_left),a=this._current_word>>>32-s;return this._current_word<<=s,this._current_word_bits_left-=s,t=t<<s|a,t}readBool(){return this.readBits(1)===1}readByte(){return this.readBits(8)}_skipLeadingZero(){let e;for(e=0;e<this._current_word_bits_left;e++)if((this._current_word&2147483648>>>e)!==0)return this._current_word<<=e,this._current_word_bits_left-=e,e;return this._fillCurrentWord(),e+this._skipLeadingZero()}readUEG(){let e=this._skipLeadingZero();return this.readBits(e+1)-1}readSEG(){let e=this.readUEG();return e&1?e+1>>>1:-1*(e>>>1)}}class Z{static _ebsp2rbsp(e){let t=e,i=t.byteLength,s=new Uint8Array(i),a=0;for(let n=0;n<i;n++)n>=2&&t[n]===3&&t[n-1]===0&&t[n-2]===0||(s[a]=t[n],a++);return new Uint8Array(s.buffer,0,a)}static parseSPS(e){let t=e.subarray(1,4),i="avc1.";for(let O=0;O<3;O++){let G=t[O].toString(16);G.length<2&&(G="0"+G),i+=G}let s=Z._ebsp2rbsp(e),a=new X(s);a.readByte();let n=a.readByte();a.readByte();let o=a.readByte();a.readUEG();let l=Z.getProfileString(n),h=Z.getLevelString(o),y=1,S=420,p=[0,420,422,444],m=8,x=8;if((n===100||n===110||n===122||n===244||n===44||n===83||n===86||n===118||n===128||n===138||n===144)&&(y=a.readUEG(),y===3&&a.readBits(1),y<=3&&(S=p[y]),m=a.readUEG()+8,x=a.readUEG()+8,a.readBits(1),a.readBool())){let O=y!==3?8:12;for(let G=0;G<O;G++)a.readBool()&&(G<6?Z._skipScalingList(a,16):Z._skipScalingList(a,64))}a.readUEG();let w=a.readUEG();if(w===0)a.readUEG();else if(w===1){a.readBits(1),a.readSEG(),a.readSEG();let O=a.readUEG();for(let G=0;G<O;G++)a.readSEG()}let D=a.readUEG();a.readBits(1);let L=a.readUEG(),C=a.readUEG(),A=a.readBits(1);A===0&&a.readBits(1),a.readBits(1);let f=0,u=0,c=0,g=0;a.readBool()&&(f=a.readUEG(),u=a.readUEG(),c=a.readUEG(),g=a.readUEG());let b=1,v=1,I=0,F=!0,P=0,T=0;if(a.readBool()){if(a.readBool()){let O=a.readByte(),G=[1,12,10,16,40,24,20,32,80,18,15,64,160,4,3,2],ie=[1,11,11,11,33,11,11,11,33,11,11,33,99,3,2,1];O>0&&O<16?(b=G[O-1],v=ie[O-1]):O===255&&(b=a.readByte()<<8|a.readByte(),v=a.readByte()<<8|a.readByte())}if(a.readBool()&&a.readBool(),a.readBool()&&(a.readBits(4),a.readBool()&&a.readBits(24)),a.readBool()&&(a.readUEG(),a.readUEG()),a.readBool()){let O=a.readBits(32),G=a.readBits(32);F=a.readBool(),P=G,T=O*2,I=P/T}}let ee=1;(b!==1||v!==1)&&(ee=b/v);let W=0,te=0;if(y===0)W=1,te=2-A;else{let O=y===3?1:2,G=y===1?2:1;W=O,te=G*(2-A)}let K=(L+1)*16,H=(2-A)*((C+1)*16);K-=(f+u)*W,H-=(c+g)*te;let de=Math.ceil(K*ee);return a.destroy(),a=null,{codec_mimetype:i,profile_idc:n,level_idc:o,profile_string:l,level_string:h,chroma_format_idc:y,bit_depth:m,bit_depth_luma:m,bit_depth_chroma:x,ref_frames:D,chroma_format:S,chroma_format_string:Z.getChromaFormatString(S),frame_rate:{fixed:F,fps:I,fps_den:T,fps_num:P},sar_ratio:{width:b,height:v},codec_size:{width:K,height:H},present_size:{width:de,height:H}}}static _skipScalingList(e,t){let i=8,s=8,a=0;for(let n=0;n<t;n++)s!==0&&(a=e.readSEG(),s=(i+a+256)%256),i=s===0?i:s}static getProfileString(e){switch(e){case 66:return"Baseline";case 77:return"Main";case 88:return"Extended";case 100:return"High";case 110:return"High10";case 122:return"High422";case 244:return"High444";default:return"Unknown"}}static getLevelString(e){return(e/10).toFixed(1)}static getChromaFormatString(e){switch(e){case 420:return"4:2:0";case 422:return"4:2:2";case 444:return"4:4:4";default:return"Unknown"}}}const ge=[96e3,88200,64e3,48e3,44100,32e3,24e3,22050,16e3,12e3,11025,8e3,7350];class De{}class Re extends De{}class rt{constructor(e){this.TAG="AACADTSParser",this.data_=e,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&d.e(this.TAG,"Could not found ADTS syncword until payload end")}findNextSyncwordOffset(e){let t=e,i=this.data_;for(;;){if(t+7>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[t+0]<<8|i[t+1])>>>4===4095)return t;t++}}readNextAACFrame(){let e=this.data_,t=null;for(;t==null&&!this.eof_flag_;){let s=this.current_syncword_offset_,a=(e[s+1]&8)>>>3,n=(e[s+1]&6)>>>1,o=e[s+1]&1,l=(e[s+2]&192)>>>6,h=(e[s+2]&60)>>>2,y=(e[s+2]&1)<<2|(e[s+3]&192)>>>6,S=(e[s+3]&3)<<11|e[s+4]<<3|(e[s+5]&224)>>>5;if(e[s+6]&3,s+S>this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}let p=o===1?7:9,m=S-p;s+=p;let x=this.findNextSyncwordOffset(s+m);if(this.current_syncword_offset_=x,a!==0&&a!==1||n!==0)continue;let w=e.subarray(s,s+m);t=new De,t.audio_object_type=l+1,t.sampling_freq_index=h,t.sampling_frequency=ge[h],t.channel_config=y,t.data=w}return t}hasIncompleteData(){return this.has_last_incomplete_data}getIncompleteData(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null}}class ot{constructor(e){this.TAG="AACLOASParser",this.data_=e,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&d.e(this.TAG,"Could not found LOAS syncword until payload end")}findNextSyncwordOffset(e){let t=e,i=this.data_;for(;;){if(t+1>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[t+0]<<3|i[t+1]>>>5)===695)return t;t++}}getLATMValue(e){let t=e.readBits(2),i=0;for(let s=0;s<=t;s++)i=i<<8,i=i|e.readByte();return i}readNextAACFrame(e){let t=this.data_,i=null;for(;i==null&&!this.eof_flag_;){let a=this.current_syncword_offset_,n=(t[a+1]&31)<<8|t[a+2];if(a+3+n>=this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}let o=new X(t.subarray(a+3,a+3+n)),l=o.readBool(),h=null;if(l)if(e==null){d.w(this.TAG,"StreamMuxConfig Missing"),this.current_syncword_offset_=this.findNextSyncwordOffset(a+3+n),o.destroy();continue}else h=e;else{let p=o.readBool();if(p&&o.readBool()){d.e(this.TAG,"audioMuxVersionA is Not Supported"),o.destroy();break}if(p&&this.getLATMValue(o),!o.readBool()){d.e(this.TAG,"allStreamsSameTimeFraming zero is Not Supported"),o.destroy();break}if(o.readBits(6)!==0){d.e(this.TAG,"more than 2 numSubFrames Not Supported"),o.destroy();break}if(o.readBits(4)!==0){d.e(this.TAG,"more than 2 numProgram Not Supported"),o.destroy();break}if(o.readBits(3)!==0){d.e(this.TAG,"more than 2 numLayer Not Supported"),o.destroy();break}let C=p?this.getLATMValue(o):0,A=o.readBits(5);C-=5;let f=o.readBits(4);C-=4;let u=o.readBits(4);C-=4,o.readBits(3),C-=3,C>0&&o.readBits(C);let c=o.readBits(3);if(c===0)o.readByte();else{d.e(this.TAG,`frameLengthType = ${c}. Only frameLengthType = 0 Supported`),o.destroy();break}let g=o.readBool();if(g)if(p)this.getLATMValue(o);else{let b=0;for(;;){b=b<<8;let v=o.readBool(),I=o.readByte();if(b+=I,!v)break}console.log(b)}o.readBool()&&o.readByte(),h=new Re,h.audio_object_type=A,h.sampling_freq_index=f,h.sampling_frequency=ge[h.sampling_freq_index],h.channel_config=u,h.other_data_present=g}let y=0;for(;;){let p=o.readByte();if(y+=p,p!==255)break}let S=new Uint8Array(y);for(let p=0;p<y;p++)S[p]=o.readByte();i=new Re,i.audio_object_type=h.audio_object_type,i.sampling_freq_index=h.sampling_freq_index,i.sampling_frequency=ge[h.sampling_freq_index],i.channel_config=h.channel_config,i.other_data_present=h.other_data_present,i.data=S,this.current_syncword_offset_=this.findNextSyncwordOffset(a+3+n)}return i}hasIncompleteData(){return this.has_last_incomplete_data}getIncompleteData(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null}}class lt{constructor(e){let t=null,i=e.audio_object_type,s=e.audio_object_type,a=e.sampling_freq_index,n=e.channel_config,o=0,l=navigator.userAgent.toLowerCase();l.indexOf("firefox")!==-1?a>=6?(s=5,t=new Array(4),o=a-3):(s=2,t=new Array(2),o=a):l.indexOf("android")!==-1?(s=2,t=new Array(2),o=a):(s=5,o=a,t=new Array(4),a>=6?o=a-3:n===1&&(s=2,t=new Array(2),o=a)),t[0]=s<<3,t[0]|=(a&15)>>>1,t[1]=(a&15)<<7,t[1]|=(n&15)<<3,s===5&&(t[1]|=(o&15)>>>1,t[2]=(o&1)<<7,t[2]|=8,t[3]=0),this.config=t,this.sampling_rate=ge[a],this.channel_count=n,this.codec_mimetype="mp4a.40."+s,this.original_codec_mimetype="mp4a.40."+i}}class Se{}class _t{}const be=r=>{const e=r.readBool();if(e){r.readBits(6);const t=r.readBits(31)*4+r.readBits(2);return{time_specified_flag:e,pts_time:t}}else return r.readBits(7),{time_specified_flag:e}},ke=r=>{const e=r.readBool();r.readBits(6);const t=r.readBits(31)*4+r.readBits(2);return{auto_return:e,duration:t}},dt=(r,e)=>{const t=e.readBits(8);if(r)return{component_tag:t};const i=be(e);return{component_tag:t,splice_time:i}},ht=r=>{const e=r.readBits(8),t=r.readBits(32);return{component_tag:e,utc_splice_time:t}},ft=r=>{const e=r.readBits(32),t=r.readBool();r.readBits(7);const i={splice_event_id:e,splice_event_cancel_indicator:t};if(t)return i;if(i.out_of_network_indicator=r.readBool(),i.program_splice_flag=r.readBool(),i.duration_flag=r.readBool(),r.readBits(5),i.program_splice_flag)i.utc_splice_time=r.readBits(32);else{i.component_count=r.readBits(8),i.components=[];for(let s=0;s<i.component_count;s++)i.components.push(ht(r))}return i.duration_flag&&(i.break_duration=ke(r)),i.unique_program_id=r.readBits(16),i.avail_num=r.readBits(8),i.avails_expected=r.readBits(8),i},ct=()=>({}),ut=r=>{const e=r.readBits(8),t=[];for(let i=0;i<e;i++)t.push(ft(r));return{splice_count:e,events:t}},mt=r=>{const e=r.readBits(32),t=r.readBool();r.readBits(7);const i={splice_event_id:e,splice_event_cancel_indicator:t};if(t)return i;if(i.out_of_network_indicator=r.readBool(),i.program_splice_flag=r.readBool(),i.duration_flag=r.readBool(),i.splice_immediate_flag=r.readBool(),r.readBits(4),i.program_splice_flag&&!i.splice_immediate_flag&&(i.splice_time=be(r)),!i.program_splice_flag){i.component_count=r.readBits(8),i.components=[];for(let s=0;s<i.component_count;s++)i.components.push(dt(i.splice_immediate_flag,r))}return i.duration_flag&&(i.break_duration=ke(r)),i.unique_program_id=r.readBits(16),i.avail_num=r.readBits(8),i.avails_expected=r.readBits(8),i},pt=r=>({splice_time:be(r)}),xt=()=>({}),gt=(r,e)=>{const t=String.fromCharCode(e.readBits(8),e.readBits(8),e.readBits(8),e.readBits(8)),i=new Uint8Array(r-4);for(let s=0;s<r-4;s++)i[s]=e.readBits(8);return{identifier:t,private_data:i.buffer}},yt=(r,e,t,i)=>{const s=i.readBits(32);return{descriptor_tag:r,descriptor_length:e,identifier:t,provider_avail_id:s}},St=(r,e,t,i)=>{const s=i.readBits(8),a=i.readBits(3);i.readBits(5);let n="";for(let o=0;o<a;o++)n+=String.fromCharCode(i.readBits(8));return{descriptor_tag:r,descriptor_length:e,identifier:t,preroll:s,dtmf_count:a,DTMF_char:n}},bt=r=>{const e=r.readBits(8);r.readBits(7);const t=r.readBits(31)*4+r.readBits(2);return{component_tag:e,pts_offset:t}},At=(r,e,t,i)=>{const s=i.readBits(32),a=i.readBool();i.readBits(7);const n={descriptor_tag:r,descriptor_length:e,identifier:t,segmentation_event_id:s,segmentation_event_cancel_indicator:a};if(a)return n;if(n.program_segmentation_flag=i.readBool(),n.segmentation_duration_flag=i.readBool(),n.delivery_not_restricted_flag=i.readBool(),n.delivery_not_restricted_flag?i.readBits(5):(n.web_delivery_allowed_flag=i.readBool(),n.no_regional_blackout_flag=i.readBool(),n.archive_allowed_flag=i.readBool(),n.device_restrictions=i.readBits(2)),!n.program_segmentation_flag){n.component_count=i.readBits(8),n.components=[];for(let o=0;o<n.component_count;o++)n.components.push(bt(i))}n.segmentation_duration_flag&&(n.segmentation_duration=i.readBits(40)),n.segmentation_upid_type=i.readBits(8),n.segmentation_upid_length=i.readBits(8);{const o=new Uint8Array(n.segmentation_upid_length);for(let l=0;l<n.segmentation_upid_length;l++)o[l]=i.readBits(8);n.segmentation_upid=o.buffer}return n.segmentation_type_id=i.readBits(8),n.segment_num=i.readBits(8),n.segments_expected=i.readBits(8),(n.segmentation_type_id===52||n.segmentation_type_id===54||n.segmentation_type_id===56||n.segmentation_type_id===58)&&(n.sub_segment_num=i.readBits(8),n.sub_segments_expected=i.readBits(8)),n},Et=(r,e,t,i)=>{const s=i.readBits(48),a=i.readBits(32),n=i.readBits(16);return{descriptor_tag:r,descriptor_length:e,identifier:t,TAI_seconds:s,TAI_ns:a,UTC_offset:n}},vt=r=>{const e=r.readBits(8),t=String.fromCharCode(r.readBits(8),r.readBits(8),r.readBits(8)),i=r.readBits(3),s=r.readBits(4),a=r.readBool();return{component_tag:e,ISO_code:t,Bit_Stream_Mode:i,Num_Channels:s,Full_Srvc_Audio:a}},Bt=(r,e,t,i)=>{const s=i.readBits(4),a=[];for(let n=0;n<s;n++)a.push(vt(i));return{descriptor_tag:r,descriptor_length:e,identifier:t,audio_count:s,components:a}},wt=r=>{const e=new X(r),t=e.readBits(8),i=e.readBool(),s=e.readBool();e.readBits(2);const a=e.readBits(12),n=e.readBits(8),o=e.readBool(),l=e.readBits(6),h=e.readBits(31)*4+e.readBits(2),y=e.readBits(8),S=e.readBits(12),p=e.readBits(12),m=e.readBits(8);let x=null;m===0?x=ct():m===4?x=ut(e):m===5?x=mt(e):m===6?x=pt(e):m===7?x=xt():m===255?x=gt(p,e):e.readBits(p*8);const w=[],D=e.readBits(16);for(let f=0;f<D;){const u=e.readBits(8),c=e.readBits(8),g=String.fromCharCode(e.readBits(8),e.readBits(8),e.readBits(8),e.readBits(8));u===0?w.push(yt(u,c,g,e)):u===1?w.push(St(u,c,g,e)):u===2?w.push(At(u,c,g,e)):u===3?w.push(Et(u,c,g,e)):u===4?w.push(Bt(u,c,g,e)):e.readBits((c-4)*8),f+=2+c}const L=o?e.readBits(32):void 0,C=e.readBits(32),A={table_id:t,section_syntax_indicator:i,private_indicator:s,section_length:a,protocol_version:n,encrypted_packet:o,encryption_algorithm:l,pts_adjustment:h,cw_index:y,tier:S,splice_command_length:p,splice_command_type:m,splice_command:x,descriptor_loop_length:D,splice_descriptors:w,E_CRC32:L,CRC32:C};if(m===5){const f=x;if(f.splice_event_cancel_indicator)return{splice_command_type:m,detail:A,data:r};if(f.program_splice_flag&&!f.splice_immediate_flag){const u=f.duration_flag?f.break_duration.auto_return:void 0,c=f.duration_flag?f.break_duration.duration/90:void 0;return f.splice_time.time_specified_flag?{splice_command_type:m,pts:(h+f.splice_time.pts_time)%2**33,auto_return:u,duraiton:c,detail:A,data:r}:{splice_command_type:m,auto_return:u,duraiton:c,detail:A,data:r}}else{const u=f.duration_flag?f.break_duration.auto_return:void 0,c=f.duration_flag?f.break_duration.duration/90:void 0;return{splice_command_type:m,auto_return:u,duraiton:c,detail:A,data:r}}}else if(m===6){const f=x;return f.splice_time.time_specified_flag?{splice_command_type:m,pts:(h+f.splice_time.pts_time)%2**33,detail:A,data:r}:{splice_command_type:m,detail:A,data:r}}else return{splice_command_type:m,detail:A,data:r}};var Q=(r=>(r[r.kSliceIDR_W_RADL=19]="kSliceIDR_W_RADL",r[r.kSliceIDR_N_LP=20]="kSliceIDR_N_LP",r[r.kSliceCRA_NUT=21]="kSliceCRA_NUT",r[r.kSliceVPS=32]="kSliceVPS",r[r.kSliceSPS=33]="kSliceSPS",r[r.kSlicePPS=34]="kSlicePPS",r[r.kSliceAUD=35]="kSliceAUD",r))(Q||{});class Lt{}class Ct{constructor(e){let t=e.data.byteLength;this.type=e.type,this.data=new Uint8Array(4+t),new DataView(this.data.buffer).setUint32(0,t),this.data.set(e.data,4)}}class Dt{constructor(e){this.TAG="H265AnnexBParser",this.current_startcode_offset_=0,this.eof_flag_=!1,this.data_=e,this.current_startcode_offset_=this.findNextStartCodeOffset(0),this.eof_flag_&&d.e(this.TAG,"Could not find H265 startcode until payload end!")}findNextStartCodeOffset(e){let t=e,i=this.data_;for(;;){if(t+3>=i.byteLength)return this.eof_flag_=!0,i.byteLength;let s=i[t+0]<<24|i[t+1]<<16|i[t+2]<<8|i[t+3],a=i[t+0]<<16|i[t+1]<<8|i[t+2];if(s===1||a===1)return t;t++}}readNextNaluPayload(){let e=this.data_,t=null;for(;t==null&&!this.eof_flag_;){let s=this.current_startcode_offset_;(e[s]<<24|e[s+1]<<16|e[s+2]<<8|e[s+3])===1?s+=4:s+=3;let n=e[s]>>1&63,o=(e[s]&128)>>>7,l=this.findNextStartCodeOffset(s);if(this.current_startcode_offset_=l,o!==0)continue;let h=e.subarray(s,l);t=new Lt,t.type=n,t.data=h}return t}}class Rt{constructor(e,t,i,s){let a=23+(5+e.byteLength)+(5+t.byteLength)+(5+i.byteLength),n=this.data=new Uint8Array(a);n[0]=1,n[1]=(s.general_profile_space&3)<<6|(s.general_tier_flag?1:0)<<5|s.general_profile_idc&31,n[2]=s.general_profile_compatibility_flags_1,n[3]=s.general_profile_compatibility_flags_2,n[4]=s.general_profile_compatibility_flags_3,n[5]=s.general_profile_compatibility_flags_4,n[6]=s.general_constraint_indicator_flags_1,n[7]=s.general_constraint_indicator_flags_2,n[8]=s.general_constraint_indicator_flags_3,n[9]=s.general_constraint_indicator_flags_4,n[10]=s.general_constraint_indicator_flags_5,n[11]=s.general_constraint_indicator_flags_6,n[12]=s.general_level_idc,n[13]=240|(s.min_spatial_segmentation_idc&3840)>>8,n[14]=s.min_spatial_segmentation_idc&255,n[15]=252|s.parallelismType&3,n[16]=252|s.chroma_format_idc&3,n[17]=248|s.bit_depth_luma_minus8&7,n[18]=248|s.bit_depth_chroma_minus8&7,n[19]=0,n[20]=0,n[21]=(s.constant_frame_rate&3)<<6|(s.num_temporal_layers&7)<<3|(s.temporal_id_nested?1:0)<<2|3,n[22]=3,n[23]=160,n[24]=0,n[25]=1,n[26]=(e.byteLength&65280)>>8,n[27]=(e.byteLength&255)>>0,n.set(e,28),n[23+(5+e.byteLength)+0]=161,n[23+(5+e.byteLength)+1]=0,n[23+(5+e.byteLength)+2]=1,n[23+(5+e.byteLength)+3]=(t.byteLength&65280)>>8,n[23+(5+e.byteLength)+4]=(t.byteLength&255)>>0,n.set(t,23+(5+e.byteLength)+5),n[23+(5+e.byteLength+5+t.byteLength)+0]=162,n[23+(5+e.byteLength+5+t.byteLength)+1]=0,n[23+(5+e.byteLength+5+t.byteLength)+2]=1,n[23+(5+e.byteLength+5+t.byteLength)+3]=(i.byteLength&65280)>>8,n[23+(5+e.byteLength+5+t.byteLength)+4]=(i.byteLength&255)>>0,n.set(i,23+(5+e.byteLength+5+t.byteLength)+5)}getData(){return this.data}}class j{static _ebsp2rbsp(e){let t=e,i=t.byteLength,s=new Uint8Array(i),a=0;for(let n=0;n<i;n++)n>=2&&t[n]===3&&t[n-1]===0&&t[n-2]===0||(s[a]=t[n],a++);return new Uint8Array(s.buffer,0,a)}static parseVPS(e){let t=j._ebsp2rbsp(e),i=new X(t);i.readByte(),i.readByte(),i.readBits(4),i.readBits(2),i.readBits(6);let s=i.readBits(3),a=i.readBool();return{num_temporal_layers:s+1,temporal_id_nested:a}}static parseSPS(e){let t=j._ebsp2rbsp(e),i=new X(t);i.readByte(),i.readByte();let s=0,a=0,n=0,o=0;i.readBits(4);let l=i.readBits(3);i.readBool();let h=i.readBits(2),y=i.readBool(),S=i.readBits(5),p=i.readByte(),m=i.readByte(),x=i.readByte(),w=i.readByte(),D=i.readByte(),L=i.readByte(),C=i.readByte(),A=i.readByte(),f=i.readByte(),u=i.readByte(),c=i.readByte(),g=[],E=[];for(let U=0;U<l;U++)g.push(i.readBool()),E.push(i.readBool());if(l>0)for(let U=l;U<8;U++)i.readBits(2);for(let U=0;U<l;U++)g[U]&&(i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte(),i.readByte()),E[U]&&i.readByte();i.readUEG();let b=i.readUEG();b==3&&i.readBits(1);let v=i.readUEG(),I=i.readUEG();i.readBool()&&(s+=i.readUEG(),a+=i.readUEG(),n+=i.readUEG(),o+=i.readUEG());let P=i.readUEG(),T=i.readUEG(),_e=i.readUEG(),ee=i.readBool();for(let U=ee?0:l;U<=l;U++)i.readUEG(),i.readUEG(),i.readUEG();if(i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG(),i.readBool()&&i.readBool())for(let z=0;z<4;z++)for(let q=0;q<(z===3?2:6);q++)if(!i.readBool())i.readUEG();else{let $=Math.min(64,1<<4+(z<<1));z>1&&i.readSEG();for(let ne=0;ne<$;ne++)i.readSEG()}i.readBool(),i.readBool(),i.readBool()&&(i.readByte(),i.readUEG(),i.readUEG(),i.readBool());let K=i.readUEG(),H=0;for(let U=0;U<K;U++){let z=!1;if(U!==0&&(z=i.readBool()),z){U===K&&i.readUEG(),i.readBool(),i.readUEG();let q=0;for(let se=0;se<=H;se++){let $=i.readBool(),ne=!1;$||(ne=i.readBool()),($||ne)&&q++}H=q}else{let q=i.readUEG(),se=i.readUEG();H=q+se;for(let $=0;$<q;$++)i.readUEG(),i.readBool();for(let $=0;$<se;$++)i.readUEG(),i.readBool()}}if(i.readBool()){let U=i.readUEG();for(let z=0;z<U;z++){for(let q=0;q<_e+4;q++)i.readBits(1);i.readBits(1)}}let O=!1,G=0,ie=1,he=1,Me=!1,Ae=1,Ee=1;if(i.readBool(),i.readBool(),i.readBool()){if(i.readBool()){let ae=i.readByte(),ze=[1,12,10,16,40,24,20,32,80,18,15,64,160,4,3,2],fe=[1,11,11,11,33,11,11,11,33,11,11,33,99,3,2,1];ae>0&&ae<=16?(ie=ze[ae-1],he=fe[ae-1]):ae===255&&(ie=i.readBits(16),he=i.readBits(16))}if(i.readBool()&&i.readBool(),i.readBool()&&(i.readBits(3),i.readBool(),i.readBool()&&(i.readByte(),i.readByte(),i.readByte())),i.readBool()&&(i.readUEG(),i.readUEG()),i.readBool(),i.readBool(),i.readBool(),O=i.readBool(),O&&(i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG()),i.readBool()&&(Ae=i.readBits(32),Ee=i.readBits(32),i.readBool()&&i.readUEG(),i.readBool())){let fe=!1,ve=!1,ce=!1;fe=i.readBool(),ve=i.readBool(),(fe||ve)&&(ce=i.readBool(),ce&&(i.readByte(),i.readBits(5),i.readBool(),i.readBits(5)),i.readBits(4),i.readBits(4),ce&&i.readBits(4),i.readBits(5),i.readBits(5),i.readBits(5));for(let qe=0;qe<=l;qe++){let $e=i.readBool();Me=$e;let je=!0,Be=1;$e||(je=i.readBool());let Ke=!1;if(je?i.readUEG():Ke=i.readBool(),Ke||(Be=i.readUEG()+1),fe){for(let ue=0;ue<Be;ue++)i.readUEG(),i.readUEG(),ce&&(i.readUEG(),i.readUEG());i.readBool()}if(ve){for(let ue=0;ue<Be;ue++)i.readUEG(),i.readUEG(),ce&&(i.readUEG(),i.readUEG());i.readBool()}}}i.readBool()&&(i.readBool(),i.readBool(),i.readBool(),G=i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG(),i.readUEG())}i.readBool();let gi=`hvc1.${S}.1.L${c}.B0`,yi=b===1||b===2?2:1,Si=b===1?2:1,Pe=v-(s+a)*yi,Ve=I-(n+o)*Si,Fe=1;return ie!==1&&he!==1&&(Fe=ie/he),i.destroy(),i=null,{codec_mimetype:gi,profile_string:j.getProfileString(S),level_string:j.getLevelString(c),profile_idc:S,bit_depth:P+8,ref_frames:1,chroma_format:b,chroma_format_string:j.getChromaFormatString(b),general_level_idc:c,general_profile_space:h,general_tier_flag:y,general_profile_idc:S,general_profile_compatibility_flags_1:p,general_profile_compatibility_flags_2:m,general_profile_compatibility_flags_3:x,general_profile_compatibility_flags_4:w,general_constraint_indicator_flags_1:D,general_constraint_indicator_flags_2:L,general_constraint_indicator_flags_3:C,general_constraint_indicator_flags_4:A,general_constraint_indicator_flags_5:f,general_constraint_indicator_flags_6:u,min_spatial_segmentation_idc:G,constant_frame_rate:0,chroma_format_idc:b,bit_depth_luma_minus8:P,bit_depth_chroma_minus8:T,frame_rate:{fixed:Me,fps:Ee/Ae,fps_den:Ae,fps_num:Ee},sar_ratio:{width:ie,height:he},codec_size:{width:Pe,height:Ve},present_size:{width:Pe*Fe,height:Ve}}}static parsePPS(e){let t=j._ebsp2rbsp(e),i=new X(t);i.readByte(),i.readByte(),i.readUEG(),i.readUEG(),i.readBool(),i.readBool(),i.readBits(3),i.readBool(),i.readBool(),i.readUEG(),i.readUEG(),i.readSEG(),i.readBool(),i.readBool(),i.readBool()&&i.readUEG(),i.readSEG(),i.readSEG(),i.readBool(),i.readBool(),i.readBool(),i.readBool();let a=i.readBool(),n=i.readBool(),o=1;return n&&a?o=0:n?o=3:a&&(o=2),{parallelismType:o}}static getChromaFormatString(e){switch(e){case 0:return"4:0:0";case 1:return"4:2:0";case 2:return"4:2:2";case 3:return"4:4:4";default:return"Unknown"}}static getProfileString(e){switch(e){case 1:return"Main";case 2:return"Main10";case 3:return"MainSP";case 4:return"Rext";case 9:return"SCC";default:return"Unknown"}}static getLevelString(e){return(e/30).toFixed(1)}}class kt{}const It=r=>{let e=new X(r),t=0,i=[];for(;;){let s=e.readBits(6);if(t+=6,s!==0)break;let a=e.readBool();t+=1;let n=e.readBits(11);t+=11;let o=e.readBits(12);t+=12;let l=e.readBits(10)&255;t+=10;let h=e.readBits(10)&255;t+=10;let y=e.readBits(10)&255;t+=10;let S=new Uint8Array(y);for(let x=0;x<y;x++){let w=e.readBits(10)&255;t+=10,S[x]=w}e.readBits(10),t+=10;let p="User Defined",m={};l===65?h===7&&(p="SCTE-104"):l===95?h===220?p="ARIB STD-B37 (1SEG)":h===221?p="ARIB STD-B37 (ANALOG)":h===222?p="ARIB STD-B37 (SD)":h===223&&(p="ARIB STD-B37 (HD)"):l===97&&(h===1?p="EIA-708":h===2&&(p="EIA-608")),i.push({yc_indicator:a,line_number:n,horizontal_offset:o,did:l,sdid:h,user_data:S,description:p,information:m}),e.readBits(8-(t-Math.floor(t/8))%8),t+=(8-(t-Math.floor(t/8)))%8}return e.destroy(),e=null,i};class Tt{}class Ut{}const Ot=[[64,64,80,80,96,96,112,112,128,128,160,160,192,192,224,224,256,256,320,320,384,384,448,448,512,512,640,640,768,768,896,896,1024,1024,1152,1152,1280,1280],[69,70,87,88,104,105,121,122,139,140,174,175,208,209,243,244,278,279,348,349,417,418,487,488,557,558,696,697,835,836,975,976,1114,1115,1253,1254,1393,1394],[96,96,120,120,144,144,168,168,192,192,240,240,288,288,336,336,384,384,480,480,576,576,672,672,768,768,960,960,1152,1152,1344,1344,1536,1536,1728,1728,1920,1920]];class Gt{constructor(e){this.TAG="AC3Parser",this.data_=e,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&d.e(this.TAG,"Could not found AC3 syncword until payload end")}findNextSyncwordOffset(e){let t=e,i=this.data_;for(;;){if(t+7>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[t+0]<<8|i[t+1]<<0)===2935)return t;t++}}readNextAC3Frame(){let e=this.data_,t=null;for(;t==null&&!this.eof_flag_;){let s=this.current_syncword_offset_,a=e[s+4]>>6,n=[48e3,44200,33e3][a],o=e[s+4]&63,l=Ot[a][o]*2;if(isNaN(l)||s+l>this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}let h=this.findNextSyncwordOffset(s+l);this.current_syncword_offset_=h;let y=e[s+5]>>3,S=e[s+5]&7,p=e[s+6]>>5,m=0;(p&1)!==0&&p!==1&&(m+=2),(p&4)!==0&&(m+=2),p===2&&(m+=2);let x=(e[s+6]<<8|e[s+7]<<0)>>12-m&1,w=[2,1,2,3,3,4,4,5][p]+x;t=new Ut,t.sampling_frequency=n,t.channel_count=w,t.channel_mode=p,t.bit_stream_identification=y,t.low_frequency_effects_channel_on=x,t.bit_stream_mode=S,t.frame_size_code=o,t.data=e.subarray(s,s+l)}return t}hasIncompleteData(){return this.has_last_incomplete_data}getIncompleteData(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null}}class Nt{constructor(e){let t=null;t=[e.sampling_rate_code<<6|e.bit_stream_identification<<1|e.bit_stream_mode>>2,(e.bit_stream_mode&3)<<6|e.channel_mode<<3|e.low_frequency_effects_channel_on<<2|e.frame_size_code>>4,e.frame_size_code<<4&224],this.config=t,this.sampling_rate=e.sampling_frequency,this.bit_stream_identification=e.bit_stream_identification,this.bit_stream_mode=e.bit_stream_mode,this.low_frequency_effects_channel_on=e.low_frequency_effects_channel_on,this.channel_count=e.channel_count,this.channel_mode=e.channel_mode,this.codec_mimetype="ac-3",this.original_codec_mimetype="ac-3"}}class Mt{}class Pt{constructor(e){this.TAG="EAC3Parser",this.data_=e,this.current_syncword_offset_=this.findNextSyncwordOffset(0),this.eof_flag_&&d.e(this.TAG,"Could not found AC3 syncword until payload end")}findNextSyncwordOffset(e){let t=e,i=this.data_;for(;;){if(t+7>=i.byteLength)return this.eof_flag_=!0,i.byteLength;if((i[t+0]<<8|i[t+1]<<0)===2935)return t;t++}}readNextEAC3Frame(){let e=this.data_,t=null;for(;t==null&&!this.eof_flag_;){let s=this.current_syncword_offset_,a=new X(e.subarray(s+2));a.readBits(2),a.readBits(3);let n=a.readBits(11)+1<<1,o=a.readBits(2),l=null,h=null;o===3?(o=a.readBits(2),l=[24e3,22060,16e3][o],h=3):(l=[48e3,44100,32e3][o],h=a.readBits(2));let y=a.readBits(3),S=a.readBits(1),p=a.readBits(5);if(s+n>this.data_.byteLength){this.eof_flag_=!0,this.has_last_incomplete_data=!0;break}let m=this.findNextSyncwordOffset(s+n);this.current_syncword_offset_=m;let x=[2,1,2,3,3,4,4,5][y]+S;a.destroy(),t=new Mt,t.sampling_frequency=l,t.channel_count=x,t.channel_mode=y,t.bit_stream_identification=p,t.low_frequency_effects_channel_on=S,t.frame_size=n,t.num_blks=[1,2,3,6][h],t.data=e.subarray(s,s+n)}return t}hasIncompleteData(){return this.has_last_incomplete_data}getIncompleteData(){return this.has_last_incomplete_data?this.data_.subarray(this.current_syncword_offset_):null}}class Vt{constructor(e){let t=null;const i=Math.floor(e.frame_size*e.sampling_frequency/(e.num_blks*16));t=[i&255,i&248,e.sampling_rate_code<<6|e.bit_stream_identification<<1|0,0|e.channel_mode<<1|e.low_frequency_effects_channel_on<<0,0],this.config=t,this.sampling_rate=e.sampling_frequency,this.bit_stream_identification=e.bit_stream_identification,this.num_blks=e.num_blks,this.low_frequency_effects_channel_on=e.low_frequency_effects_channel_on,this.channel_count=e.channel_count,this.channel_mode=e.channel_mode,this.codec_mimetype="ec-3",this.original_codec_mimetype="ec-3"}}class Ft{}const zt=r=>{let e=[],t=0;for(;t+5<r.byteLength;){let i=r[t+0],s=r[t+1],a=r[t+2],n=r[t+3]<<8|r[t+4]<<0,o=r.slice(t+5,t+5+n);e.push({service_id:i,sequence_number:s,flags:a,data:o}),t+=5+n}return e};class qt{}class Ie extends Ze{constructor(e,t){super(),this.TAG="TSDemuxer",this.first_parse_=!0,this.media_info_=new pe,this.timescale_=90,this.duration_=0,this.current_pmt_pid_=-1,this.program_pmt_map_={},this.pes_slice_queues_={},this.section_slice_queues_={},this.video_metadata_={vps:void 0,sps:void 0,pps:void 0,av1c:void 0,details:void 0},this.audio_metadata_={codec:void 0,audio_object_type:void 0,sampling_freq_index:void 0,sampling_frequency:void 0,channel_config:void 0},this.last_pcr_base_=NaN,this.timestamp_offset_=0,this.audio_last_sample_pts_=void 0,this.aac_last_incomplete_data_=null,this.has_video_=!1,this.has_audio_=!1,this.video_init_segment_dispatched_=!1,this.audio_init_segment_dispatched_=!1,this.video_metadata_changed_=!1,this.audio_metadata_changed_=!1,this.loas_previous_frame=null,this.video_track_={type:"video",id:1,sequenceNumber:0,samples:[],length:0},this.audio_track_={type:"audio",id:2,sequenceNumber:0,samples:[],length:0},this.ts_packet_size_=e.ts_packet_size,this.sync_offset_=e.sync_offset,this.config_=t}destroy(){this.media_info_=null,this.pes_slice_queues_=null,this.section_slice_queues_=null,this.video_metadata_=null,this.audio_metadata_=null,this.aac_last_incomplete_data_=null,this.video_track_=null,this.audio_track_=null,super.destroy()}static probe(e){let t=new Uint8Array(e),i=-1,s=188;if(t.byteLength<=3*s)return{needMoreData:!0};for(;i===-1;){let a=Math.min(1e3,t.byteLength-3*s);for(let n=0;n<a;)if(t[n]===71&&t[n+s]===71&&t[n+2*s]===71){i=n;break}else n++;if(i===-1)if(s===188)s=192;else if(s===192)s=204;else break}return i===-1?{match:!1}:(s===192&&i>=4?(d.v("TSDemuxer","ts_packet_size = 192, m2ts mode"),i-=4):s===204&&d.v("TSDemuxer","ts_packet_size = 204, RS encoded MPEG2-TS stream"),{match:!0,consumed:0,ts_packet_size:s,sync_offset:i})}bindDataSource(e){return e.onDataArrival=this.parseChunks.bind(this),this}resetMediaInfo(){this.media_info_=new pe}parseChunks(e,t){if(!this.onError||!this.onMediaInfo||!this.onTrackMetadata||!this.onDataAvailable)throw new re("onError & onMediaInfo & onTrackMetadata & onDataAvailable callback must be specified");let i=0;for(this.first_parse_&&(this.first_parse_=!1,i=this.sync_offset_);i+this.ts_packet_size_<=e.byteLength;){let s=t+i;this.ts_packet_size_===192&&(i+=4);let a=new Uint8Array(e,i,188),n=a[0];if(n!==71){d.e(this.TAG,`sync_byte = ${n}, not 0x47`);break}let o=(a[1]&64)>>>6;(a[1]&32)>>>5;let l=(a[1]&31)<<8|a[2],h=(a[3]&48)>>>4,y=a[3]&15,S=!!(this.pmt_&&this.pmt_.pcr_pid===l),p={},m=4;if(h==2||h==3){let x=a[4];if(x>0&&(S||h==3)&&(p.discontinuity_indicator=(a[5]&128)>>>7,p.random_access_indicator=(a[5]&64)>>>6,p.elementary_stream_priority_indicator=(a[5]&32)>>>5,(a[5]&16)>>>4)){let D=this.getPcrBase(a),L=(a[10]&1)<<8|a[11],C=D*300+L;this.last_pcr_=C}if(h==2||5+x===188){i+=188,this.ts_packet_size_===204&&(i+=16);continue}else m=5+x}if(h==1||h==3){if(l===0||l===this.current_pmt_pid_||this.pmt_!=null&&this.pmt_.pid_stream_type[l]===k.kSCTE35){let x=188-m;this.handleSectionSlice(e,i+m,x,{pid:l,file_position:s,payload_unit_start_indicator:o,continuity_conunter:y,random_access_indicator:p.random_access_indicator})}else if(this.pmt_!=null&&this.pmt_.pid_stream_type[l]!=null){let x=188-m,w=this.pmt_.pid_stream_type[l];(l===this.pmt_.common_pids.h264||l===this.pmt_.common_pids.h265||l===this.pmt_.common_pids.av1||l===this.pmt_.common_pids.adts_aac||l===this.pmt_.common_pids.loas_aac||l===this.pmt_.common_pids.ac3||l===this.pmt_.common_pids.eac3||l===this.pmt_.common_pids.opus||l===this.pmt_.common_pids.mp3||this.pmt_.pes_private_data_pids[l]===!0||this.pmt_.timed_id3_pids[l]===!0||this.pmt_.pgs_pids[l]===!0||this.pmt_.synchronous_klv_pids[l]===!0||this.pmt_.asynchronous_klv_pids[l]===!0)&&this.handlePESSlice(e,i+m,x,{pid:l,stream_type:w,file_position:s,payload_unit_start_indicator:o,continuity_conunter:y,random_access_indicator:p.random_access_indicator})}}i+=188,this.ts_packet_size_===204&&(i+=16)}return this.dispatchAudioVideoMediaSegment(),i}handleSectionSlice(e,t,i,s){let a=new Uint8Array(e,t,i),n=this.section_slice_queues_[s.pid];if(s.payload_unit_start_indicator){let o=a[0];if(n!=null&&n.total_length!==0){let l=new Uint8Array(e,t+1,Math.min(i,o));n.slices.push(l),n.total_length+=l.byteLength,n.total_length===n.expected_length?this.emitSectionSlices(n,s):this.clearSlices(n,s)}for(let l=1+o;l<a.byteLength&&a[l+0]!==255;){let y=(a[l+1]&15)<<8|a[l+2];this.section_slice_queues_[s.pid]=new Ce,n=this.section_slice_queues_[s.pid],n.expected_length=y+3,n.file_position=s.file_position,n.random_access_indicator=s.random_access_indicator;let S=new Uint8Array(e,t+l,Math.min(i-l,n.expected_length-n.total_length));n.slices.push(S),n.total_length+=S.byteLength,n.total_length===n.expected_length?this.emitSectionSlices(n,s):n.total_length>=n.expected_length&&this.clearSlices(n,s),l+=S.byteLength}}else if(n!=null&&n.total_length!==0){let o=new Uint8Array(e,t,Math.min(i,n.expected_length-n.total_length));n.slices.push(o),n.total_length+=o.byteLength,n.total_length===n.expected_length?this.emitSectionSlices(n,s):n.total_length>=n.expected_length&&this.clearSlices(n,s)}}handlePESSlice(e,t,i,s){let a=new Uint8Array(e,t,i),n=a[0]<<16|a[1]<<8|a[2];a[3];let o=a[4]<<8|a[5];if(s.payload_unit_start_indicator){if(n!==1){d.e(this.TAG,`handlePESSlice: packet_start_code_prefix should be 1 but with value ${n}`);return}let h=this.pes_slice_queues_[s.pid];h&&(h.expected_length===0||h.expected_length===h.total_length?this.emitPESSlices(h,s):this.clearSlices(h,s)),this.pes_slice_queues_[s.pid]=new Ce,this.pes_slice_queues_[s.pid].file_position=s.file_position,this.pes_slice_queues_[s.pid].random_access_indicator=s.random_access_indicator}if(this.pes_slice_queues_[s.pid]==null)return;let l=this.pes_slice_queues_[s.pid];l.slices.push(a),s.payload_unit_start_indicator&&(l.expected_length=o===0?0:o+6),l.total_length+=a.byteLength,l.expected_length>0&&l.expected_length===l.total_length?this.emitPESSlices(l,s):l.expected_length>0&&l.expected_length<l.total_length&&this.clearSlices(l,s)}emitSectionSlices(e,t){let i=new Uint8Array(e.total_length);for(let a=0,n=0;a<e.slices.length;a++){let o=e.slices[a];i.set(o,n),n+=o.byteLength}e.slices=[],e.expected_length=-1,e.total_length=0;let s=new tt;s.pid=t.pid,s.data=i,s.file_position=e.file_position,s.random_access_indicator=e.random_access_indicator,this.parseSection(s)}emitPESSlices(e,t){let i=new Uint8Array(e.total_length);for(let a=0,n=0;a<e.slices.length;a++){let o=e.slices[a];i.set(o,n),n+=o.byteLength}e.slices=[],e.expected_length=-1,e.total_length=0;let s=new et;s.pid=t.pid,s.data=i,s.stream_type=t.stream_type,s.file_position=e.file_position,s.random_access_indicator=e.random_access_indicator,this.parsePES(s)}clearSlices(e,t){e.slices=[],e.expected_length=-1,e.total_length=0}parseSection(e){let t=e.data,i=e.pid;i===0?this.parsePAT(t):i===this.current_pmt_pid_?this.parsePMT(t):this.pmt_!=null&&this.pmt_.scte_35_pids[i]&&this.parseSCTE35(t)}parsePES(e){let t=e.data,i=t[0]<<16|t[1]<<8|t[2],s=t[3],a=t[4]<<8|t[5];if(i!==1){d.e(this.TAG,`parsePES: packet_start_code_prefix should be 1 but with value ${i}`);return}if(s!==188&&s!==190&&s!==191&&s!==240&&s!==241&&s!==255&&s!==242&&s!==248){(t[6]&48)>>>4;let n=(t[7]&192)>>>6,o=t[8],l,h;(n===2||n===3)&&(l=this.getTimestamp(t,9),h=n===3?this.getTimestamp(t,14):l);let y=9+o,S;if(a!==0){if(a<3+o){d.v(this.TAG,"Malformed PES: PES_packet_length < 3 + PES_header_data_length");return}S=a-3-o}else S=t.byteLength-y;let p=t.subarray(y,y+S);switch(e.stream_type){case k.kMPEG1Audio:case k.kMPEG2Audio:this.parseMP3Payload(p,l);break;case k.kPESPrivateData:this.pmt_.common_pids.av1===e.pid||(this.pmt_.common_pids.opus===e.pid?this.parseOpusPayload(p,l):this.pmt_.common_pids.ac3===e.pid?this.parseAC3Payload(p,l):this.pmt_.common_pids.eac3===e.pid?this.parseEAC3Payload(p,l):this.pmt_.asynchronous_klv_pids[e.pid]?this.parseAsynchronousKLVMetadataPayload(p,e.pid,s):this.pmt_.smpte2038_pids[e.pid]?this.parseSMPTE2038MetadataPayload(p,l,h,e.pid,s):this.parsePESPrivateDataPayload(p,l,h,e.pid,s));break;case k.kADTSAAC:this.parseADTSAACPayload(p,l);break;case k.kLOASAAC:this.parseLOASAACPayload(p,l);break;case k.kAC3:this.parseAC3Payload(p,l);break;case k.kEAC3:this.parseEAC3Payload(p,l);break;case k.kMetadata:this.pmt_.timed_id3_pids[e.pid]?this.parseTimedID3MetadataPayload(p,l,h,e.pid,s):this.pmt_.synchronous_klv_pids[e.pid]&&this.parseSynchronousKLVMetadataPayload(p,l,h,e.pid,s);break;case k.kPGS:this.parsePGSPayload(p,l,h,e.pid,s,this.pmt_.pgs_langs[e.pid]);break;case k.kH264:this.parseH264Payload(p,l,h,e.file_position,e.random_access_indicator);break;case k.kH265:this.parseH265Payload(p,l,h,e.file_position,e.random_access_indicator);break}}else if((s===188||s===191||s===240||s===241||s===255||s===242||s===248)&&e.stream_type===k.kPESPrivateData){let n=6,o;a!==0?o=a:o=t.byteLength-n;let l=t.subarray(n,n+o);this.parsePESPrivateDataPayload(l,void 0,void 0,e.pid,s)}}parsePAT(e){let t=e[0];if(t!==0){d.e(this.TAG,`parsePAT: table_id ${t} is not corresponded to PAT!`);return}let i=(e[1]&15)<<8|e[2];e[3]<<8|e[4];let s=(e[5]&62)>>>1,a=e[5]&1,n=e[6];e[7];let o=null;if(a===1&&n===0)o=new Je,o.version_number=s;else if(o=this.pat_,o==null)return;let l=8,h=i-5-4,y=-1,S=-1;for(let p=l;p<l+h;p+=4){let m=e[p]<<8|e[p+1],x=(e[p+2]&31)<<8|e[p+3];m===0?o.network_pid=x:(o.program_pmt_pid[m]=x,y===-1&&(y=m),S===-1&&(S=x))}a===1&&n===0&&(this.pat_==null&&d.v(this.TAG,`Parsed first PAT: ${JSON.stringify(o)}`),this.pat_=o,this.current_program_=y,this.current_pmt_pid_=S)}parsePMT(e){let t=e[0];if(t!==2){d.e(this.TAG,`parsePMT: table_id ${t} is not corresponded to PMT!`);return}let i=(e[1]&15)<<8|e[2],s=e[3]<<8|e[4],a=(e[5]&62)>>>1,n=e[5]&1,o=e[6];e[7];let l=null;if(n===1&&o===0)l=new Qe,l.program_number=s,l.version_number=a,this.program_pmt_map_[s]=l;else if(l=this.program_pmt_map_[s],l==null)return;l.pcr_pid=(e[8]&31)<<8|e[9];let h=(e[10]&15)<<8|e[11],y=12+h,S=i-9-h-4;for(let p=y;p<y+S;){let m=e[p],x=(e[p+1]&31)<<8|e[p+2],w=(e[p+3]&15)<<8|e[p+4];l.pid_stream_type[x]=m;let D=l.common_pids.h264||l.common_pids.h265,L=l.common_pids.adts_aac||l.common_pids.loas_aac||l.common_pids.ac3||l.common_pids.eac3||l.common_pids.opus||l.common_pids.mp3;if(m===k.kH264&&!D)l.common_pids.h264=x;else if(m===k.kH265&&!D)l.common_pids.h265=x;else if(m===k.kADTSAAC&&!L)l.common_pids.adts_aac=x;else if(m===k.kLOASAAC&&!L)l.common_pids.loas_aac=x;else if(m===k.kAC3&&!L)l.common_pids.ac3=x;else if(m===k.kEAC3&&!L)l.common_pids.eac3=x;else if((m===k.kMPEG1Audio||m===k.kMPEG2Audio)&&!L)l.common_pids.mp3=x;else if(m===k.kPESPrivateData){if(l.pes_private_data_pids[x]=!0,w>0){for(let A=p+5;A<p+5+w;){let f=e[A+0],u=e[A+1];if(f===5){let c=u>=4?4:u,g=String.fromCharCode(...Array.from(e.subarray(A+2,A+2+c)));g==="VANC"?l.smpte2038_pids[x]=!0:g==="AC-3"&&!L||g==="BSSD"&&!L?l.common_pids.ac3=x:g==="EC-3"&&!L?l.common_pids.eac3=x:g==="AV01"?l.common_pids.av1=x:g==="Opus"?l.common_pids.opus=x:g==="KLVA"&&(l.asynchronous_klv_pids[x]=!0)}else if(f===127){if(x===l.common_pids.opus){let c=e[A+2],g=null;if(c===128&&(g=e[A+3]),g==null){d.e(this.TAG,"Not Supported Opus channel count.");continue}const E={codec:"opus",channel_count:(g&15)===0?2:g&15,channel_config_code:g,sample_rate:48e3},b={codec:"opus",meta:E};this.audio_init_segment_dispatched_==!1?(this.audio_metadata_=E,this.dispatchAudioInitSegment(b)):this.detectAudioMetadataChange(b)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(b))}}else f===128?x===l.common_pids.av1&&(this.video_metadata_.av1c=e.subarray(A+2,A+2+u)):f===130||f===106||f===129?l.common_pids.ac3=x:f===122&&(l.common_pids.eac3=x);A+=2+u}let C=e.subarray(p+5,p+5+w);this.dispatchPESPrivateDataDescriptor(x,m,C)}w===0&&!L&&(d.w(this.TAG,`PID ${x} is PrivateData(0x06) without descriptors. Fallback to AC-3.`),l.common_pids.ac3=x,delete l.pes_private_data_pids[x])}else if(m===k.kMetadata){if(w>0)for(let C=p+5;C<p+5+w;){let A=e[C+0],f=e[C+1];if(A===38){let u=e[C+2]<<8|e[C+3]<<0,c=null;u===65535&&(c=String.fromCharCode(...Array.from(e.subarray(C+4,C+4+4))));let g=e[C+4+(u===65535?4:0)],E=null;if(g===255){let b=4+(u===65535?4:0)+1;E=String.fromCharCode(...Array.from(e.subarray(C+b,C+b+4)))}c==="ID3 "&&E==="ID3 "?l.timed_id3_pids[x]=!0:E==="KLVA"&&(l.synchronous_klv_pids[x]=!0)}C+=2+f}}else if(m===k.kSCTE35)l.scte_35_pids[x]=!0;else if(m===k.kPGS){if(l.pgs_langs[x]="und",w>0)for(let C=p+5;C<p+5+w;){let A=e[C+0],f=e[C+1];if(A===10){const u=String.fromCharCode(...Array.from(e.slice(C+2,C+5)));l.pgs_langs[x]=u}C+=2+f}l.pgs_pids[x]=!0}p+=5+w}s===this.current_program_&&(this.pmt_==null&&d.v(this.TAG,`Parsed first PMT: ${JSON.stringify(l)}`),this.pmt_=l,(l.common_pids.h264||l.common_pids.h265||l.common_pids.av1)&&(this.has_video_=!0),(l.common_pids.adts_aac||l.common_pids.loas_aac||l.common_pids.ac3||l.common_pids.opus||l.common_pids.mp3)&&(this.has_audio_=!0))}parseSCTE35(e){const t=wt(e);if(t.pts!=null){let i=Math.floor(t.pts/this.timescale_);t.pts=i}else t.nearest_pts=this.getNearestTimestampMilliseconds();this.onSCTE35Metadata&&this.onSCTE35Metadata(t)}parseH264Payload(e,t,i,s,a){let n=new at(e),o=null,l=[],h=0,y=!1;for(;(o=n.readNextNaluPayload())!=null;){let m=new st(o);if(m.type===oe.kSliceSPS){let x=Z.parseSPS(o.data);this.video_init_segment_dispatched_?this.detectVideoMetadataChange(m,x)===!0&&(d.v(this.TAG,"H264: Critical h264 metadata has been changed, attempt to re-generate InitSegment"),this.video_metadata_changed_=!0,this.video_metadata_={vps:void 0,sps:m,pps:void 0,av1c:void 0,details:x}):(this.video_metadata_.sps=m,this.video_metadata_.details=x)}else m.type===oe.kSlicePPS?(!this.video_init_segment_dispatched_||this.video_metadata_changed_)&&(this.video_metadata_.pps=m,this.video_metadata_.sps&&this.video_metadata_.pps&&(this.video_metadata_changed_&&this.dispatchVideoMediaSegment(),this.dispatchVideoInitSegment())):(m.type===oe.kSliceIDR||m.type===oe.kSliceNonIDR&&a===1)&&(y=!0);this.video_init_segment_dispatched_&&(l.push(m),h+=m.data.byteLength)}let S=Math.floor(t/this.timescale_),p=Math.floor(i/this.timescale_);if(l.length){let m=this.video_track_,x={units:l,length:h,isKeyframe:y,dts:p,pts:S,cts:S-p,file_position:s};m.samples.push(x),m.length+=h}}parseH265Payload(e,t,i,s,a){let n=new Dt(e),o=null,l=[],h=0,y=!1;for(;(o=n.readNextNaluPayload())!=null;){let m=new Ct(o);if(m.type===Q.kSliceVPS){if(!this.video_init_segment_dispatched_){let x=j.parseVPS(o.data);this.video_metadata_.vps=m,this.video_metadata_.details={...this.video_metadata_.details,...x}}}else if(m.type===Q.kSliceSPS){let x=j.parseSPS(o.data);this.video_init_segment_dispatched_?this.detectVideoMetadataChange(m,x)===!0&&(d.v(this.TAG,"H265: Critical h265 metadata has been changed, attempt to re-generate InitSegment"),this.video_metadata_changed_=!0,this.video_metadata_={vps:void 0,sps:m,pps:void 0,av1c:void 0,details:x}):(this.video_metadata_.sps=m,this.video_metadata_.details={...this.video_metadata_.details,...x})}else if(m.type===Q.kSlicePPS){if(!this.video_init_segment_dispatched_||this.video_metadata_changed_){let x=j.parsePPS(o.data);this.video_metadata_.pps=m,this.video_metadata_.details={...this.video_metadata_.details,...x},this.video_metadata_.vps&&this.video_metadata_.sps&&this.video_metadata_.pps&&(this.video_metadata_changed_&&this.dispatchVideoMediaSegment(),this.dispatchVideoInitSegment())}}else(m.type===Q.kSliceIDR_W_RADL||m.type===Q.kSliceIDR_N_LP||m.type===Q.kSliceCRA_NUT)&&(y=!0);this.video_init_segment_dispatched_&&(l.push(m),h+=m.data.byteLength)}let S=Math.floor(t/this.timescale_),p=Math.floor(i/this.timescale_);if(l.length){let m=this.video_track_,x={units:l,length:h,isKeyframe:y,dts:p,pts:S,cts:S-p,file_position:s};m.samples.push(x),m.length+=h}}detectVideoMetadataChange(e,t){if(t.codec_mimetype!==this.video_metadata_.details.codec_mimetype)return d.v(this.TAG,`Video: Codec mimeType changed from ${this.video_metadata_.details.codec_mimetype} to ${t.codec_mimetype}`),!0;if(t.codec_size.width!==this.video_metadata_.details.codec_size.width||t.codec_size.height!==this.video_metadata_.details.codec_size.height){let i=this.video_metadata_.details.codec_size,s=t.codec_size;return d.v(this.TAG,`Video: Coded Resolution changed from ${i.width}x${i.height} to ${s.width}x${s.height}`),!0}return t.present_size.width!==this.video_metadata_.details.present_size.width?(d.v(this.TAG,`Video: Present resolution width changed from ${this.video_metadata_.details.present_size.width} to ${t.present_size.width}`),!0):!1}isInitSegmentDispatched(){return this.has_video_&&this.has_audio_?this.video_init_segment_dispatched_&&this.audio_init_segment_dispatched_:this.has_video_&&!this.has_audio_?this.video_init_segment_dispatched_:!this.has_video_&&this.has_audio_?this.audio_init_segment_dispatched_:!1}dispatchVideoInitSegment(){let e=this.video_metadata_.details,t={};t.type="video",t.id=this.video_track_.id,t.timescale=1e3,t.duration=this.duration_,t.codecWidth=e.codec_size.width,t.codecHeight=e.codec_size.height,t.presentWidth=e.present_size.width,t.presentHeight=e.present_size.height,t.profile=e.profile_string,t.level=e.level_string,t.bitDepth=e.bit_depth,t.chromaFormat=e.chroma_format,t.sarRatio=e.sar_ratio,t.frameRate=e.frame_rate;let i=t.frameRate.fps_den,s=t.frameRate.fps_num;if(t.refSampleDuration=1e3*(i/s),t.codec=e.codec_mimetype,this.video_metadata_.av1c)t.av1c=this.video_metadata_.av1c,this.video_init_segment_dispatched_==!1&&d.v(this.TAG,`Generated first AV1 for mimeType: ${t.codec}`);else if(this.video_metadata_.vps){let n=this.video_metadata_.vps.data.subarray(4),o=this.video_metadata_.sps.data.subarray(4),l=this.video_metadata_.pps.data.subarray(4),h=new Rt(n,o,l,e);t.hvcc=h.getData(),this.video_init_segment_dispatched_==!1&&d.v(this.TAG,`Generated first HEVCDecoderConfigurationRecord for mimeType: ${t.codec}`)}else{let n=this.video_metadata_.sps.data.subarray(4),o=this.video_metadata_.pps.data.subarray(4),l=new nt(n,o,e);t.avcc=l.getData(),this.video_init_segment_dispatched_==!1&&d.v(this.TAG,`Generated first AVCDecoderConfigurationRecord for mimeType: ${t.codec}`)}this.onTrackMetadata("video",t),this.video_init_segment_dispatched_=!0,this.video_metadata_changed_=!1;let a=this.media_info_;a.hasVideo=!0,a.width=t.codecWidth,a.height=t.codecHeight,a.fps=t.frameRate.fps,a.profile=t.profile,a.level=t.level,a.refFrames=e.ref_frames,a.chromaFormat=e.chroma_format_string,a.sarNum=t.sarRatio.width,a.sarDen=t.sarRatio.height,a.videoCodec=t.codec,a.hasAudio&&a.audioCodec?a.mimeType=`video/mp2t; codecs="${a.videoCodec},${a.audioCodec}"`:a.mimeType=`video/mp2t; codecs="${a.videoCodec}"`,a.isComplete()&&this.onMediaInfo(a)}dispatchVideoMediaSegment(){this.isInitSegmentDispatched()&&this.video_track_.length&&this.onDataAvailable(null,this.video_track_)}dispatchAudioMediaSegment(){this.isInitSegmentDispatched()&&this.audio_track_.length&&this.onDataAvailable(this.audio_track_,null)}dispatchAudioVideoMediaSegment(){this.isInitSegmentDispatched()&&(this.audio_track_.length||this.video_track_.length)&&this.onDataAvailable(this.audio_track_,this.video_track_)}parseADTSAACPayload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;if(this.aac_last_incomplete_data_){let h=new Uint8Array(e.byteLength+this.aac_last_incomplete_data_.byteLength);h.set(this.aac_last_incomplete_data_,0),h.set(e,this.aac_last_incomplete_data_.byteLength),e=h}let i,s;if(t!=null&&(s=t/this.timescale_),this.audio_metadata_.codec==="aac"){if(t==null&&this.audio_last_sample_pts_!=null)i=1024/this.audio_metadata_.sampling_frequency*1e3,s=this.audio_last_sample_pts_+i;else if(t==null){d.w(this.TAG,"AAC: Unknown pts");return}if(this.aac_last_incomplete_data_&&this.audio_last_sample_pts_){i=1024/this.audio_metadata_.sampling_frequency*1e3;let h=this.audio_last_sample_pts_+i;Math.abs(h-s)>1&&(d.w(this.TAG,`AAC: Detected pts overlapped, expected: ${h}ms, PES pts: ${s}ms`),s=h)}}let a=new rt(e),n=null,o=s,l;for(;(n=a.readNextAACFrame())!=null;){i=1024/n.sampling_frequency*1e3;const h={codec:"aac",data:n};this.audio_init_segment_dispatched_==!1?(this.audio_metadata_={codec:"aac",audio_object_type:n.audio_object_type,sampling_freq_index:n.sampling_freq_index,sampling_frequency:n.sampling_frequency,channel_config:n.channel_config},this.dispatchAudioInitSegment(h)):this.detectAudioMetadataChange(h)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(h)),l=o;let y=Math.floor(o),S={unit:n.data,length:n.data.byteLength,pts:y,dts:y};this.audio_track_.samples.push(S),this.audio_track_.length+=n.data.byteLength,o+=i}a.hasIncompleteData()&&(this.aac_last_incomplete_data_=a.getIncompleteData()),l&&(this.audio_last_sample_pts_=l)}parseLOASAACPayload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;if(this.aac_last_incomplete_data_){let h=new Uint8Array(e.byteLength+this.aac_last_incomplete_data_.byteLength);h.set(this.aac_last_incomplete_data_,0),h.set(e,this.aac_last_incomplete_data_.byteLength),e=h}let i,s;if(t!=null&&(s=t/this.timescale_),this.audio_metadata_.codec==="aac"){if(t==null&&this.audio_last_sample_pts_!=null)i=1024/this.audio_metadata_.sampling_frequency*1e3,s=this.audio_last_sample_pts_+i;else if(t==null){d.w(this.TAG,"AAC: Unknown pts");return}if(this.aac_last_incomplete_data_&&this.audio_last_sample_pts_){i=1024/this.audio_metadata_.sampling_frequency*1e3;let h=this.audio_last_sample_pts_+i;Math.abs(h-s)>1&&(d.w(this.TAG,`AAC: Detected pts overlapped, expected: ${h}ms, PES pts: ${s}ms`),s=h)}}let a=new ot(e),n=null,o=s,l;for(;(n=a.readNextAACFrame(this.loas_previous_frame??void 0))!=null;){this.loas_previous_frame=n,i=1024/n.sampling_frequency*1e3;const h={codec:"aac",data:n};this.audio_init_segment_dispatched_==!1?(this.audio_metadata_={codec:"aac",audio_object_type:n.audio_object_type,sampling_freq_index:n.sampling_freq_index,sampling_frequency:n.sampling_frequency,channel_config:n.channel_config},this.dispatchAudioInitSegment(h)):this.detectAudioMetadataChange(h)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(h)),l=o;let y=Math.floor(o),S={unit:n.data,length:n.data.byteLength,pts:y,dts:y};this.audio_track_.samples.push(S),this.audio_track_.length+=n.data.byteLength,o+=i}a.hasIncompleteData()&&(this.aac_last_incomplete_data_=a.getIncompleteData()),l&&(this.audio_last_sample_pts_=l)}parseAC3Payload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;let i,s;if(t!=null&&(s=t/this.timescale_),this.audio_metadata_.codec==="ac-3"){if(t==null&&this.audio_last_sample_pts_!=null)i=1536/this.audio_metadata_.sampling_frequency*1e3,s=this.audio_last_sample_pts_+i;else if(t==null){d.w(this.TAG,"AC3: Unknown pts");return}}let a=new Gt(e),n=null,o=s,l;for(;(n=a.readNextAC3Frame())!=null;){i=1536/n.sampling_frequency*1e3;const h={codec:"ac-3",data:n};this.audio_init_segment_dispatched_==!1?(this.audio_metadata_={codec:"ac-3",sampling_frequency:n.sampling_frequency,bit_stream_identification:n.bit_stream_identification,bit_stream_mode:n.bit_stream_mode,low_frequency_effects_channel_on:n.low_frequency_effects_channel_on,channel_mode:n.channel_mode},this.dispatchAudioInitSegment(h)):this.detectAudioMetadataChange(h)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(h)),l=o;let y=Math.floor(o),S={unit:n.data,length:n.data.byteLength,pts:y,dts:y};this.audio_track_.samples.push(S),this.audio_track_.length+=n.data.byteLength,o+=i}l&&(this.audio_last_sample_pts_=l)}parseEAC3Payload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;let i,s;if(t!=null&&(s=t/this.timescale_),this.audio_metadata_.codec==="ec-3"){if(t==null&&this.audio_last_sample_pts_!=null)i=256*this.audio_metadata_.num_blks/this.audio_metadata_.sampling_frequency*1e3,s=this.audio_last_sample_pts_+i;else if(t==null){d.w(this.TAG,"EAC3: Unknown pts");return}}let a=new Pt(e),n=null,o=s,l;for(;(n=a.readNextEAC3Frame())!=null;){i=1536/n.sampling_frequency*1e3;const h={codec:"ec-3",data:n};this.audio_init_segment_dispatched_==!1?(this.audio_metadata_={codec:"ec-3",sampling_frequency:n.sampling_frequency,bit_stream_identification:n.bit_stream_identification,low_frequency_effects_channel_on:n.low_frequency_effects_channel_on,num_blks:n.num_blks,channel_mode:n.channel_mode},this.dispatchAudioInitSegment(h)):this.detectAudioMetadataChange(h)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(h)),l=o;let y=Math.floor(o),S={unit:n.data,length:n.data.byteLength,pts:y,dts:y};this.audio_track_.samples.push(S),this.audio_track_.length+=n.data.byteLength,o+=i}l&&(this.audio_last_sample_pts_=l)}parseOpusPayload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;let i,s;if(t!=null&&(s=t/this.timescale_),this.audio_metadata_.codec==="opus"){if(t==null&&this.audio_last_sample_pts_!=null)i=20,s=this.audio_last_sample_pts_+i;else if(t==null){d.w(this.TAG,"Opus: Unknown pts");return}}let a=s,n;for(let o=0;o<e.length;){i=20;const l=(e[o+1]&16)!==0,h=(e[o+1]&8)!==0;let y=o+2,S=0;for(;e[y]===255;)S+=255,y+=1;S+=e[y],y+=1,y+=l?2:0,y+=h?2:0,n=a;let p=Math.floor(a),m=e.slice(y,y+S),x={unit:m,length:m.byteLength,pts:p,dts:p};this.audio_track_.samples.push(x),this.audio_track_.length+=m.byteLength,a+=i,o=y+S}n&&(this.audio_last_sample_pts_=n)}parseMP3Payload(e,t){if(this.has_video_&&!this.video_init_segment_dispatched_)return;let i=[44100,48e3,32e3,0],s=[22050,24e3,16e3,0],a=[11025,12e3,8e3,0],n=e[1]>>>3&3,o=(e[1]&6)>>1;(e[2]&240)>>>4;let l=(e[2]&12)>>>2,y=(e[3]>>>6&3)!==3?2:1,S=0,p=34;switch(n){case 0:S=a[l];break;case 2:S=s[l];break;case 3:S=i[l];break}switch(o){case 1:p=34;break;case 2:p=33;break;case 3:p=32;break}const m=new Tt;m.object_type=p,m.sample_rate=S,m.channel_count=y,m.data=e;const x={codec:"mp3",data:m};this.audio_init_segment_dispatched_==!1?(this.audio_metadata_={codec:"mp3",object_type:p,sample_rate:S,channel_count:y},this.dispatchAudioInitSegment(x)):this.detectAudioMetadataChange(x)&&(this.dispatchAudioMediaSegment(),this.dispatchAudioInitSegment(x));let w={unit:e,length:e.byteLength,pts:t/this.timescale_,dts:t/this.timescale_};this.audio_track_.samples.push(w),this.audio_track_.length+=e.byteLength}detectAudioMetadataChange(e){if(e.codec!==this.audio_metadata_.codec)return d.v(this.TAG,`Audio: Audio Codecs changed from ${this.audio_metadata_.codec} to ${e.codec}`),!0;if(e.codec==="aac"&&this.audio_metadata_.codec==="aac"){const t=e.data;if(t.audio_object_type!==this.audio_metadata_.audio_object_type)return d.v(this.TAG,`AAC: AudioObjectType changed from ${this.audio_metadata_.audio_object_type} to ${t.audio_object_type}`),!0;if(t.sampling_freq_index!==this.audio_metadata_.sampling_freq_index)return d.v(this.TAG,`AAC: SamplingFrequencyIndex changed from ${this.audio_metadata_.sampling_freq_index} to ${t.sampling_freq_index}`),!0;if(t.channel_config!==this.audio_metadata_.channel_config)return d.v(this.TAG,`AAC: Channel configuration changed from ${this.audio_metadata_.channel_config} to ${t.channel_config}`),!0}else if(e.codec==="ac-3"&&this.audio_metadata_.codec==="ac-3"){const t=e.data;if(t.sampling_frequency!==this.audio_metadata_.sampling_frequency)return d.v(this.TAG,`AC3: Sampling Frequency changed from ${this.audio_metadata_.sampling_frequency} to ${t.sampling_frequency}`),!0;if(t.bit_stream_identification!==this.audio_metadata_.bit_stream_identification)return d.v(this.TAG,`AC3: Bit Stream Identification changed from ${this.audio_metadata_.bit_stream_identification} to ${t.bit_stream_identification}`),!0;if(t.bit_stream_mode!==this.audio_metadata_.bit_stream_mode)return d.v(this.TAG,`AC3: BitStream Mode changed from ${this.audio_metadata_.bit_stream_mode} to ${t.bit_stream_mode}`),!0;if(t.channel_mode!==this.audio_metadata_.channel_mode)return d.v(this.TAG,`AC3: Channel Mode changed from ${this.audio_metadata_.channel_mode} to ${t.channel_mode}`),!0;if(t.low_frequency_effects_channel_on!==this.audio_metadata_.low_frequency_effects_channel_on)return d.v(this.TAG,`AC3: Low Frequency Effects Channel On changed from ${this.audio_metadata_.low_frequency_effects_channel_on} to ${t.low_frequency_effects_channel_on}`),!0}else if(e.codec==="opus"&&this.audio_metadata_.codec==="opus"){const t=e.meta;if(t.sample_rate!==this.audio_metadata_.sample_rate)return d.v(this.TAG,`Opus: SamplingFrequencyIndex changed from ${this.audio_metadata_.sample_rate} to ${t.sample_rate}`),!0;if(t.channel_count!==this.audio_metadata_.channel_count)return d.v(this.TAG,`Opus: Channel count changed from ${this.audio_metadata_.channel_count} to ${t.channel_count}`),!0}else if(e.codec==="mp3"&&this.audio_metadata_.codec==="mp3"){const t=e.data;if(t.object_type!==this.audio_metadata_.object_type)return d.v(this.TAG,`MP3: AudioObjectType changed from ${this.audio_metadata_.object_type} to ${t.object_type}`),!0;if(t.sample_rate!==this.audio_metadata_.sample_rate)return d.v(this.TAG,`MP3: SamplingFrequencyIndex changed from ${this.audio_metadata_.sample_rate} to ${t.sample_rate}`),!0;if(t.channel_count!==this.audio_metadata_.channel_count)return d.v(this.TAG,`MP3: Channel count changed from ${this.audio_metadata_.channel_count} to ${t.channel_count}`),!0}return!1}dispatchAudioInitSegment(e){let t={};if(t.type="audio",t.id=this.audio_track_.id,t.timescale=1e3,t.duration=this.duration_,this.audio_metadata_.codec==="aac"){let s=e.codec==="aac"?e.data:null,a=new lt(s);t.audioSampleRate=a.sampling_rate,t.channelCount=a.channel_count,t.codec=a.codec_mimetype,t.originalCodec=a.original_codec_mimetype,t.config=a.config,t.refSampleDuration=1024/t.audioSampleRate*t.timescale}else if(this.audio_metadata_.codec==="ac-3"){let s=e.codec==="ac-3"?e.data:null,a=new Nt(s);t.audioSampleRate=a.sampling_rate,t.channelCount=a.channel_count,t.codec=a.codec_mimetype,t.originalCodec=a.original_codec_mimetype,t.config=a.config,t.refSampleDuration=1536/t.audioSampleRate*t.timescale}else if(this.audio_metadata_.codec==="ec-3"){let s=e.codec==="ec-3"?e.data:null,a=new Vt(s);t.audioSampleRate=a.sampling_rate,t.channelCount=a.channel_count,t.codec=a.codec_mimetype,t.originalCodec=a.original_codec_mimetype,t.config=a.config,t.refSampleDuration=256*a.num_blks/t.audioSampleRate*t.timescale}else this.audio_metadata_.codec==="opus"?(t.audioSampleRate=this.audio_metadata_.sample_rate,t.channelCount=this.audio_metadata_.channel_count,t.channelConfigCode=this.audio_metadata_.channel_config_code,t.codec="opus",t.originalCodec="opus",t.config=void 0,t.refSampleDuration=20):this.audio_metadata_.codec==="mp3"&&(t.audioSampleRate=this.audio_metadata_.sample_rate,t.channelCount=this.audio_metadata_.channel_count,t.codec="mp3",t.originalCodec="mp3",t.config=void 0);this.audio_init_segment_dispatched_==!1&&d.v(this.TAG,`Generated first AudioSpecificConfig for mimeType: ${t.codec}`),this.onTrackMetadata("audio",t),this.audio_init_segment_dispatched_=!0,this.video_metadata_changed_=!1;let i=this.media_info_;i.hasAudio=!0,i.audioCodec=t.originalCodec,i.audioSampleRate=t.audioSampleRate,i.audioChannelCount=t.channelCount,i.hasVideo&&i.videoCodec?i.mimeType=`video/mp2t; codecs="${i.videoCodec},${i.audioCodec}"`:i.mimeType=`video/mp2t; codecs="${i.audioCodec}"`,i.isComplete()&&this.onMediaInfo(i)}dispatchPESPrivateDataDescriptor(e,t,i){let s=new _t;s.pid=e,s.stream_type=t,s.descriptor=i,this.onPESPrivateDataDescriptor&&this.onPESPrivateDataDescriptor(s)}parsePESPrivateDataPayload(e,t,i,s,a){let n=new Se;if(n.pid=s,n.stream_id=a,n.len=e.byteLength,n.data=e,t!=null){let o=Math.floor(t/this.timescale_);n.pts=o}else n.nearest_pts=this.getNearestTimestampMilliseconds();if(i!=null){let o=Math.floor(i/this.timescale_);n.dts=o}this.onPESPrivateData&&this.onPESPrivateData(n)}parseTimedID3MetadataPayload(e,t,i,s,a){let n=new Se;if(n.pid=s,n.stream_id=a,n.len=e.byteLength,n.data=e,t!=null){let o=Math.floor(t/this.timescale_);n.pts=o}if(i!=null){let o=Math.floor(i/this.timescale_);n.dts=o}this.onTimedID3Metadata&&this.onTimedID3Metadata(n)}parsePGSPayload(e,t,i,s,a,n){let o=new qt;if(o.pid=s,o.lang=n,o.stream_id=a,o.len=e.byteLength,o.data=e,t!=null){let l=Math.floor(t/this.timescale_);o.pts=l}if(i!=null){let l=Math.floor(i/this.timescale_);o.dts=l}this.onPGSSubtitleData&&this.onPGSSubtitleData(o)}parseSynchronousKLVMetadataPayload(e,t,i,s,a){let n=new Ft;if(n.pid=s,n.stream_id=a,n.len=e.byteLength,n.data=e,t!=null){let o=Math.floor(t/this.timescale_);n.pts=o}if(i!=null){let o=Math.floor(i/this.timescale_);n.dts=o}n.access_units=zt(e),this.onSynchronousKLVMetadata&&this.onSynchronousKLVMetadata(n)}parseAsynchronousKLVMetadataPayload(e,t,i){let s=new Se;s.pid=t,s.stream_id=i,s.len=e.byteLength,s.data=e,this.onAsynchronousKLVMetadata&&this.onAsynchronousKLVMetadata(s)}parseSMPTE2038MetadataPayload(e,t,i,s,a){let n=new kt;if(n.pid=s,n.stream_id=a,n.len=e.byteLength,n.data=e,t!=null){let o=Math.floor(t/this.timescale_);n.pts=o}if(n.nearest_pts=this.getNearestTimestampMilliseconds(),i!=null){let o=Math.floor(i/this.timescale_);n.dts=o}n.ancillaries=It(e),this.onSMPTE2038Metadata&&this.onSMPTE2038Metadata(n)}getNearestTimestampMilliseconds(){if(this.audio_last_sample_pts_!=null)return Math.floor(this.audio_last_sample_pts_);if(this.last_pcr_!=null)return Math.floor(this.last_pcr_/300/this.timescale_)}getPcrBase(e){let t=e[6]*33554432+e[7]*131072+e[8]*512+e[9]*2+(e[10]&128)/128+this.timestamp_offset_;return t+4294967296<this.last_pcr_base_&&(t+=8589934592,this.timestamp_offset_+=8589934592),this.last_pcr_base_=t,t}getTimestamp(e,t){let i=(e[t]&14)*536870912+(e[t+1]&255)*4194304+(e[t+2]&254)*16384+(e[t+3]&255)*128+(e[t+4]&254)/2+this.timestamp_offset_;return i+4294967296<this.last_pcr_base_&&(i+=8589934592),i}}class _{static init(){_.types={avc1:[],avcC:[],btrt:[],dinf:[],dref:[],esds:[],ftyp:[],hdlr:[],hvc1:[],hvcC:[],av01:[],av1C:[],mdat:[],mdhd:[],mdia:[],mfhd:[],minf:[],moof:[],moov:[],mp4a:[],mvex:[],mvhd:[],sdtp:[],stbl:[],stco:[],stsc:[],stsd:[],stsz:[],stts:[],tfdt:[],tfhd:[],traf:[],trak:[],trun:[],trex:[],tkhd:[],vmhd:[],smhd:[],chnl:[],".mp3":[],Opus:[],dOps:[],fLaC:[],dfLa:[],ipcm:[],pcmC:[],"ac-3":[],dac3:[],"ec-3":[],dec3:[]};for(let t in _.types)_.types.hasOwnProperty(t)&&(_.types[t]=[t.charCodeAt(0),t.charCodeAt(1),t.charCodeAt(2),t.charCodeAt(3)]);let e=_.constants={};e.FTYP=new Uint8Array([105,115,111,109,0,0,0,1,105,115,111,109,97,118,99,49]),e.STSD_PREFIX=new Uint8Array([0,0,0,0,0,0,0,1]),e.STTS=new Uint8Array([0,0,0,0,0,0,0,0]),e.STSC=e.STCO=e.STTS,e.STSZ=new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0]),e.HDLR_VIDEO=new Uint8Array([0,0,0,0,0,0,0,0,118,105,100,101,0,0,0,0,0,0,0,0,0,0,0,0,86,105,100,101,111,72,97,110,100,108,101,114,0]),e.HDLR_AUDIO=new Uint8Array([0,0,0,0,0,0,0,0,115,111,117,110,0,0,0,0,0,0,0,0,0,0,0,0,83,111,117,110,100,72,97,110,100,108,101,114,0]),e.DREF=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,12,117,114,108,32,0,0,0,1]),e.SMHD=new Uint8Array([0,0,0,0,0,0,0,0]),e.VMHD=new Uint8Array([0,0,0,1,0,0,0,0,0,0,0,0])}static box(e){let t=8,i=null,s=Array.prototype.slice.call(arguments,1),a=s.length;for(let o=0;o<a;o++)t+=s[o].byteLength;i=new Uint8Array(t),i[0]=t>>>24&255,i[1]=t>>>16&255,i[2]=t>>>8&255,i[3]=t&255,i.set(e,4);let n=8;for(let o=0;o<a;o++)i.set(s[o],n),n+=s[o].byteLength;return i}static generateInitSegment(e){let t=_.box(_.types.ftyp,_.constants.FTYP),i=_.moov(e),s=new Uint8Array(t.byteLength+i.byteLength);return s.set(t,0),s.set(i,t.byteLength),s}static moov(e){let t=_.mvhd(e.timescale,e.duration),i=_.trak(e),s=_.mvex(e);return _.box(_.types.moov,t,i,s)}static mvhd(e,t){return _.box(_.types.mvhd,new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,e>>>24&255,e>>>16&255,e>>>8&255,e&255,t>>>24&255,t>>>16&255,t>>>8&255,t&255,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255]))}static trak(e){return _.box(_.types.trak,_.tkhd(e),_.mdia(e))}static tkhd(e){let t=e.id,i=e.duration,s=e.presentWidth,a=e.presentHeight;return _.box(_.types.tkhd,new Uint8Array([0,0,0,7,0,0,0,0,0,0,0,0,t>>>24&255,t>>>16&255,t>>>8&255,t&255,0,0,0,0,i>>>24&255,i>>>16&255,i>>>8&255,i&255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,s>>>8&255,s&255,0,0,a>>>8&255,a&255,0,0]))}static mdia(e){return _.box(_.types.mdia,_.mdhd(e),_.hdlr(e),_.minf(e))}static mdhd(e){let t=e.timescale,i=e.duration;return _.box(_.types.mdhd,new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,t>>>24&255,t>>>16&255,t>>>8&255,t&255,i>>>24&255,i>>>16&255,i>>>8&255,i&255,85,196,0,0]))}static hdlr(e){let t=null;return e.type==="audio"?t=_.constants.HDLR_AUDIO:t=_.constants.HDLR_VIDEO,_.box(_.types.hdlr,t)}static minf(e){let t=null;return e.type==="audio"?t=_.box(_.types.smhd,_.constants.SMHD):t=_.box(_.types.vmhd,_.constants.VMHD),_.box(_.types.minf,t,_.dinf(),_.stbl(e))}static dinf(){return _.box(_.types.dinf,_.box(_.types.dref,_.constants.DREF))}static stbl(e){return _.box(_.types.stbl,_.stsd(e),_.box(_.types.stts,_.constants.STTS),_.box(_.types.stsc,_.constants.STSC),_.box(_.types.stsz,_.constants.STSZ),_.box(_.types.stco,_.constants.STCO))}static stsd(e){return e.type==="audio"?e.codec==="mp3"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.mp3(e)):e.codec==="ac-3"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.ac3(e)):e.codec==="ec-3"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.ec3(e)):e.codec==="opus"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.Opus(e)):e.codec=="flac"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.fLaC(e)):e.codec=="ipcm"?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.ipcm(e)):_.box(_.types.stsd,_.constants.STSD_PREFIX,_.mp4a(e)):e.type==="video"&&e.codec.startsWith("hvc1")?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.hvc1(e)):e.type==="video"&&e.codec.startsWith("av01")?_.box(_.types.stsd,_.constants.STSD_PREFIX,_.av01(e)):_.box(_.types.stsd,_.constants.STSD_PREFIX,_.avc1(e))}static mp3(e){let t=e.channelCount,i=e.audioSampleRate,s=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,16,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types[".mp3"],s)}static mp4a(e){let t=e.channelCount,i=e.audioSampleRate,s=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,16,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types.mp4a,s,_.esds(e))}static ac3(e){let t=e.channelCount,i=e.audioSampleRate,s=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,16,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types["ac-3"],s,_.box(_.types.dac3,new Uint8Array(e.config)))}static ec3(e){let t=e.channelCount,i=e.audioSampleRate,s=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,16,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types["ec-3"],s,_.box(_.types.dec3,new Uint8Array(e.config)))}static esds(e){let t=e.config||[],i=t.length,s=new Uint8Array([0,0,0,0,3,23+i,0,1,0,4,15+i,64,21,0,0,0,0,0,0,0,0,0,0,0,5].concat([i]).concat(t).concat([6,1,2]));return _.box(_.types.esds,s)}static Opus(e){let t=e.channelCount,i=e.audioSampleRate,s=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,16,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types.Opus,s,_.dOps(e))}static dOps(e){let t=e.channelCount,i=e.channelConfigCode,s=e.audioSampleRate;if(e.config)return _.box(_.types.dOps,e.config);let a=[];switch(i){case 1:case 2:a=[0];break;case 0:a=[255,1,1,0,1];break;case 128:a=[255,2,0,0,1];break;case 3:a=[1,2,1,0,2,1];break;case 4:a=[1,2,2,0,1,2,3];break;case 5:a=[1,3,2,0,4,1,2,3];break;case 6:a=[1,4,2,0,4,1,2,3,5];break;case 7:a=[1,4,2,0,4,1,2,3,5,6];break;case 8:a=[1,5,3,0,6,1,2,3,4,5,7];break;case 130:a=[1,1,2,0,1];break;case 131:a=[1,1,3,0,1,2];break;case 132:a=[1,1,4,0,1,2,3];break;case 133:a=[1,1,5,0,1,2,3,4];break;case 134:a=[1,1,6,0,1,2,3,4,5];break;case 135:a=[1,1,7,0,1,2,3,4,5,6];break;case 136:a=[1,1,8,0,1,2,3,4,5,6,7];break}let n=new Uint8Array([0,t,0,0,s>>>24&255,s>>>17&255,s>>>8&255,s>>>0&255,0,0,...a]);return _.box(_.types.dOps,n)}static fLaC(e){let t=e.channelCount,i=Math.min(e.audioSampleRate,65535),s=e.sampleSize,a=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,s,0,0,0,0,i>>>8&255,i&255,0,0]);return _.box(_.types.fLaC,a,_.dfLa(e))}static dfLa(e){let t=new Uint8Array([0,0,0,0,...e.config]);return _.box(_.types.dfLa,t)}static ipcm(e){let t=e.channelCount,i=Math.min(e.audioSampleRate,65535),s=e.sampleSize,a=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,t,0,s,0,0,0,0,i>>>8&255,i&255,0,0]);return e.channelCount===1?_.box(_.types.ipcm,a,_.pcmC(e)):_.box(_.types.ipcm,a,_.chnl(e),_.pcmC(e))}static chnl(e){let t=new Uint8Array([0,0,0,0,1,e.channelCount,0,0,0,0,0,0,0,0]);return _.box(_.types.chnl,t)}static pcmC(e){let t=e.littleEndian?1:0,i=e.sampleSize,s=new Uint8Array([0,0,0,0,t,i]);return _.box(_.types.pcmC,s)}static avc1(e){let t=e.avcc,i=e.codecWidth,s=e.codecHeight,a=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,i>>>8&255,i&255,s>>>8&255,s&255,0,72,0,0,0,72,0,0,0,0,0,0,0,1,10,120,113,113,47,102,108,118,46,106,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,255,255]);return _.box(_.types.avc1,a,_.box(_.types.avcC,t))}static hvc1(e){let t=e.hvcc,i=e.codecWidth,s=e.codecHeight,a=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,i>>>8&255,i&255,s>>>8&255,s&255,0,72,0,0,0,72,0,0,0,0,0,0,0,1,10,120,113,113,47,102,108,118,46,106,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,255,255]);return _.box(_.types.hvc1,a,_.box(_.types.hvcC,t))}static av01(e){let t=e.av1c,i=e.codecWidth||192,s=e.codecHeight||108,a=new Uint8Array([0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,i>>>8&255,i&255,s>>>8&255,s&255,0,72,0,0,0,72,0,0,0,0,0,0,0,1,10,120,113,113,47,102,108,118,46,106,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,255,255]);return _.box(_.types.av01,a,_.box(_.types.av1C,t))}static mvex(e){return _.box(_.types.mvex,_.trex(e))}static trex(e){let t=e.id,i=new Uint8Array([0,0,0,0,t>>>24&255,t>>>16&255,t>>>8&255,t&255,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1]);return _.box(_.types.trex,i)}static moof(e,t){return _.box(_.types.moof,_.mfhd(e.sequenceNumber),_.traf(e,t))}static mfhd(e){let t=new Uint8Array([0,0,0,0,e>>>24&255,e>>>16&255,e>>>8&255,e&255]);return _.box(_.types.mfhd,t)}static traf(e,t){let i=e.id,s=_.box(_.types.tfhd,new Uint8Array([0,0,0,0,i>>>24&255,i>>>16&255,i>>>8&255,i&255])),a=_.box(_.types.tfdt,new Uint8Array([0,0,0,0,t>>>24&255,t>>>16&255,t>>>8&255,t&255])),n=_.sdtp(e),o=_.trun(e,n.byteLength+16+16+8+16+8+8);return _.box(_.types.traf,s,a,o,n)}static sdtp(e){let t=e.samples||[],i=t.length,s=new Uint8Array(4+i);for(let a=0;a<i;a++){let n=t[a].flags;s[a+4]=n.isLeading<<6|n.dependsOn<<4|n.isDependedOn<<2|n.hasRedundancy}return _.box(_.types.sdtp,s)}static trun(e,t){let i=e.samples||[],s=i.length,a=12+16*s,n=new Uint8Array(a);t+=8+a,n.set([0,0,15,1,s>>>24&255,s>>>16&255,s>>>8&255,s&255,t>>>24&255,t>>>16&255,t>>>8&255,t&255],0);for(let o=0;o<s;o++){let l=i[o].duration,h=i[o].size,y=i[o].flags,S=i[o].cts;n.set([l>>>24&255,l>>>16&255,l>>>8&255,l&255,h>>>24&255,h>>>16&255,h>>>8&255,h&255,y.isLeading<<2|y.dependsOn,y.isDependedOn<<6|y.hasRedundancy<<4|y.isNonSync,0,0,S>>>24&255,S>>>16&255,S>>>8&255,S&255],12+16*o)}return _.box(_.types.trun,n)}static mdat(e){return _.box(_.types.mdat,e)}}_.init();class Te{static getSilentFrame(e,t){if(e==="mp4a.40.2"){if(t===1)return new Uint8Array([0,200,0,128,35,128]);if(t===2)return new Uint8Array([33,0,73,144,2,25,0,35,128]);if(t===3)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,142]);if(t===4)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,128,44,128,8,2,56]);if(t===5)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,130,48,4,153,0,33,144,2,56]);if(t===6)return new Uint8Array([0,200,0,128,32,132,1,38,64,8,100,0,130,48,4,153,0,33,144,2,0,178,0,32,8,224])}else{if(t===1)return new Uint8Array([1,64,34,128,163,78,230,128,186,8,0,0,0,28,6,241,193,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94]);if(t===2)return new Uint8Array([1,64,34,128,163,94,230,128,186,8,0,0,0,0,149,0,6,241,161,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94]);if(t===3)return new Uint8Array([1,64,34,128,163,94,230,128,186,8,0,0,0,0,149,0,6,241,161,10,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,94])}return null}}class le{constructor(e,t,i,s,a){this.dts=e,this.pts=t,this.duration=i,this.originalDts=s,this.isSyncPoint=a,this.fileposition=null}}class Ue{constructor(){this.beginDts=0,this.endDts=0,this.beginPts=0,this.endPts=0,this.originalBeginDts=0,this.originalEndDts=0,this.syncPoints=[],this.firstSample=null,this.lastSample=null}appendSyncPoint(e){e.isSyncPoint=!0,this.syncPoints.push(e)}}class Oe{constructor(e){this._type=e,this._list=[],this._lastAppendLocation=-1}get type(){return this._type}get length(){return this._list.length}isEmpty(){return this._list.length===0}clear(){this._list=[],this._lastAppendLocation=-1}_searchNearestSegmentBefore(e){let t=this._list;if(t.length===0)return-2;let i=t.length-1,s=0,a=0,n=i,o=0;if(e<t[0].originalBeginDts)return o=-1,o;for(;a<=n;)if(s=a+Math.floor((n-a)/2),s===i||e>t[s].lastSample.originalDts&&e<t[s+1].originalBeginDts){o=s;break}else t[s].originalBeginDts<e?a=s+1:n=s-1;return o}_searchNearestSegmentAfter(e){return this._searchNearestSegmentBefore(e)+1}append(e){let t=this._list,i=e,s=this._lastAppendLocation,a=0;s!==-1&&s<t.length&&i.originalBeginDts>=t[s].lastSample.originalDts&&(s===t.length-1||s<t.length-1&&i.originalBeginDts<t[s+1].originalBeginDts)?a=s+1:t.length>0&&(a=this._searchNearestSegmentBefore(i.originalBeginDts)+1),this._lastAppendLocation=a,this._list.splice(a,0,i)}getLastSegmentBefore(e){let t=this._searchNearestSegmentBefore(e);return t>=0?this._list[t]:null}getLastSampleBefore(e){let t=this.getLastSegmentBefore(e);return t!=null?t.lastSample:null}getLastSyncPointBefore(e){let t=this._searchNearestSegmentBefore(e),i=this._list[t].syncPoints;for(;i.length===0&&t>0;)t--,i=this._list[t].syncPoints;return i.length>0?i[i.length-1]:null}}class $t{constructor(e){this.TAG="MP4Remuxer",this._config=e,this._isLive=e.isLive===!0,this._dtsBase=-1,this._dtsBaseInited=!1,this._audioDtsBase=1/0,this._videoDtsBase=1/0,this._audioNextDts=void 0,this._videoNextDts=void 0,this._audioStashedLastSample=null,this._videoStashedLastSample=null,this._audioMeta=null,this._videoMeta=null,this._audioSegmentInfoList=new Oe("audio"),this._videoSegmentInfoList=new Oe("video"),this._onInitSegment=null,this._onMediaSegment=null,this._forceFirstIDR=!!(M.chrome&&(M.version.major<50||M.version.major===50&&M.version.build<2661)),this._fillSilentAfterSeek=M.msedge||M.msie,this._mp3UseMpegAudio=!M.firefox,this._fillAudioTimestampGap=this._config.fixAudioTimestampGap}destroy(){this._dtsBase=-1,this._dtsBaseInited=!1,this._audioMeta=null,this._videoMeta=null,this._audioSegmentInfoList.clear(),this._audioSegmentInfoList=null,this._videoSegmentInfoList.clear(),this._videoSegmentInfoList=null,this._onInitSegment=null,this._onMediaSegment=null}bindDataSource(e){return e.onDataAvailable=this.remux.bind(this),e.onTrackMetadata=this._onTrackMetadataReceived.bind(this),this}get onInitSegment(){return this._onInitSegment}set onInitSegment(e){this._onInitSegment=e}get onMediaSegment(){return this._onMediaSegment}set onMediaSegment(e){this._onMediaSegment=e}insertDiscontinuity(){this._audioNextDts=this._videoNextDts=void 0}seek(e){this._audioStashedLastSample=null,this._videoStashedLastSample=null,this._videoSegmentInfoList.clear(),this._audioSegmentInfoList.clear()}remux(e,t){if(!this._onMediaSegment)throw new re("MP4Remuxer: onMediaSegment callback must be specificed!");this._dtsBaseInited||this._calculateDtsBase(e,t),t&&this._remuxVideo(t),e&&this._remuxAudio(e)}_onTrackMetadataReceived(e,t){let i=null,s="mp4",a=t.codec;if(e==="audio")this._audioMeta=t,t.codec==="mp3"&&this._mp3UseMpegAudio?(s="mpeg",a="",i=new Uint8Array):i=_.generateInitSegment(t);else if(e==="video")this._videoMeta=t,i=_.generateInitSegment(t);else return;if(!this._onInitSegment)throw new re("MP4Remuxer: onInitSegment callback must be specified!");this._onInitSegment(e,{type:e,data:i.buffer,codec:a,container:`${e}/${s}`,mediaDuration:t.duration})}_calculateDtsBase(e,t){this._dtsBaseInited||(e&&e.samples&&e.samples.length&&(this._audioDtsBase=e.samples[0].dts),t&&t.samples&&t.samples.length&&(this._videoDtsBase=t.samples[0].dts),this._dtsBase=Math.min(this._audioDtsBase,this._videoDtsBase),this._dtsBaseInited=!0)}getTimestampBase(){if(this._dtsBaseInited)return this._dtsBase}flushStashedSamples(){let e=this._videoStashedLastSample,t=this._audioStashedLastSample,i={type:"video",id:1,sequenceNumber:0,samples:[],length:0};e!=null&&(i.samples.push(e),i.length=e.length);let s={type:"audio",id:2,sequenceNumber:0,samples:[],length:0};t!=null&&(s.samples.push(t),s.length=t.length),this._videoStashedLastSample=null,this._audioStashedLastSample=null,this._remuxVideo(i,!0),this._remuxAudio(s,!0)}_remuxAudio(e,t){if(this._audioMeta==null)return;let i=e,s=i.samples,a,n=-1,o=-1,l=this._audioMeta.refSampleDuration,h=this._audioMeta.codec==="mp3"&&this._mp3UseMpegAudio,y=this._dtsBaseInited&&this._audioNextDts===void 0,S=!1;if(!s||s.length===0||s.length===1&&!t)return;let p=0,m=null,x=0;h?(p=0,x=i.length):(p=8,x=8+i.length);let w=null;if(s.length>1&&(w=s.pop(),x-=w.length),this._audioStashedLastSample!=null){let c=this._audioStashedLastSample;this._audioStashedLastSample=null,s.unshift(c),x+=c.length}w!=null&&(this._audioStashedLastSample=w);let D=s[0].dts-this._dtsBase;if(this._audioNextDts)a=D-this._audioNextDts;else if(this._audioSegmentInfoList.isEmpty())a=0,this._fillSilentAfterSeek&&!this._videoSegmentInfoList.isEmpty()&&this._audioMeta.originalCodec!=="mp3"&&(S=!0);else{let c=this._audioSegmentInfoList.getLastSampleBefore(D);if(c!=null){let g=D-(c.originalDts+c.duration);g<=3&&(g=0);let E=c.dts+c.duration+g;a=D-E}else a=0}if(S){let c=D-a,g=this._videoSegmentInfoList.getLastSegmentBefore(D);if(g!=null&&g.beginDts<c){let E=Te.getSilentFrame(this._audioMeta.originalCodec,this._audioMeta.channelCount);if(E){let b=g.beginDts,v=c-g.beginDts;d.v(this.TAG,`InsertPrefixSilentAudio: dts: ${b}, duration: ${v}`),s.unshift({unit:E,dts:b,pts:b}),x+=E.byteLength}}else S=!1}let L=[];for(let c=0;c<s.length;c++){let g=s[c],E=g.unit,b=g.dts-this._dtsBase,v=b,I=!1,F=null,P=0;if(!(b<-.001)){if(this._audioMeta.codec!=="mp3"&&l!=null){let T=b;const _e=3;if(this._audioNextDts&&(T=this._audioNextDts),a=b-T,a<=-_e*l){d.w(this.TAG,`Dropping 1 audio frame (originalDts: ${b} ms ,curRefDts: ${T} ms)  due to dtsCorrection: ${a} ms overlap.`);continue}else if(a>=_e*l&&this._fillAudioTimestampGap&&!M.safari){I=!0;let ee=Math.floor(a/l);d.w(this.TAG,`Large audio timestamp gap detected, may cause AV sync to drift. Silent frames will be generated to avoid unsync.\noriginalDts: ${b} ms, curRefDts: ${T} ms, dtsCorrection: ${Math.round(a)} ms, generate: ${ee} frames`),v=Math.floor(T),P=Math.floor(T+l)-v;let W=Te.getSilentFrame(this._audioMeta.originalCodec,this._audioMeta.channelCount);W==null&&(d.w(this.TAG,`Unable to generate silent frame for ${this._audioMeta.originalCodec} with ${this._audioMeta.channelCount} channels, repeat last frame`),W=E),F=[];for(let te=0;te<ee;te++){T=T+l;let K=Math.floor(T),H=Math.floor(T+l)-K,de={dts:K,pts:K,cts:0,unit:W,size:W.byteLength,duration:H,originalDts:b,flags:{isLeading:0,dependsOn:1,isDependedOn:0,hasRedundancy:0}};F.push(de),x+=de.size}this._audioNextDts=T+l}else v=Math.floor(T),P=Math.floor(T+l)-v,this._audioNextDts=T+l}else v=b-a,c!==s.length-1?P=s[c+1].dts-this._dtsBase-a-v:w!=null?P=w.dts-this._dtsBase-a-v:L.length>=1?P=L[L.length-1].duration:P=Math.floor(l),this._audioNextDts=v+P;n===-1&&(n=v),L.push({dts:v,pts:v,cts:0,unit:g.unit,size:g.unit.byteLength,duration:P,originalDts:b,flags:{isLeading:0,dependsOn:1,isDependedOn:0,hasRedundancy:0}}),I&&L.push.apply(L,F)}}if(L.length===0){i.samples=[],i.length=0;return}h?m=new Uint8Array(x):(m=new Uint8Array(x),m[0]=x>>>24&255,m[1]=x>>>16&255,m[2]=x>>>8&255,m[3]=x&255,m.set(_.types.mdat,4));for(let c=0;c<L.length;c++){let g=L[c].unit;m.set(g,p),p+=g.byteLength}let C=L[L.length-1];o=C.dts+C.duration;let A=new Ue;A.beginDts=n,A.endDts=o,A.beginPts=n,A.endPts=o,A.originalBeginDts=L[0].originalDts,A.originalEndDts=C.originalDts+C.duration,A.firstSample=new le(L[0].dts,L[0].pts,L[0].duration,L[0].originalDts,!1),A.lastSample=new le(C.dts,C.pts,C.duration,C.originalDts,!1),this._isLive||this._audioSegmentInfoList.append(A),i.samples=L,i.sequenceNumber++;let f=null;h?f=new Uint8Array:f=_.moof(i,n),i.samples=[],i.length=0;let u={type:"audio",data:this._mergeBoxes(f,m).buffer,sampleCount:L.length,info:A};h&&y&&(u.timestampOffset=n),this._onMediaSegment("audio",u)}_remuxVideo(e,t){if(this._videoMeta==null)return;let i=e,s=i.samples,a,n=-1,o=-1,l=-1,h=-1;if(!s||s.length===0||s.length===1&&!t)return;let y=8,S=null,p=8+e.length,m=null;if(s.length>1&&(m=s.pop(),p-=m.length),this._videoStashedLastSample!=null){let A=this._videoStashedLastSample;this._videoStashedLastSample=null,s.unshift(A),p+=A.length}m!=null&&(this._videoStashedLastSample=m);let x=s[0].dts-this._dtsBase;if(this._videoNextDts)a=x-this._videoNextDts;else if(this._videoSegmentInfoList.isEmpty())a=0;else{let A=this._videoSegmentInfoList.getLastSampleBefore(x);if(A!=null){let f=x-(A.originalDts+A.duration);f<=3&&(f=0);let u=A.dts+A.duration+f;a=x-u}else a=0}let w=new Ue,D=[];for(let A=0;A<s.length;A++){let f=s[A],u=f.dts-this._dtsBase,c=f.isKeyframe,g=u-a,E=f.cts,b=g+E;n===-1&&(n=g,l=b);let v=0;if(A!==s.length-1?v=s[A+1].dts-this._dtsBase-a-g:m!=null?v=m.dts-this._dtsBase-a-g:D.length>=1?v=D[D.length-1].duration:v=Math.floor(this._videoMeta.refSampleDuration),c){let I=new le(g,b,v,f.dts,!0);I.fileposition=f.fileposition,w.appendSyncPoint(I)}D.push({dts:g,pts:b,cts:E,units:f.units,size:f.length,isKeyframe:c,duration:v,originalDts:u,flags:{isLeading:0,dependsOn:c?2:1,isDependedOn:c?1:0,hasRedundancy:0,isNonSync:c?0:1}})}S=new Uint8Array(p),S[0]=p>>>24&255,S[1]=p>>>16&255,S[2]=p>>>8&255,S[3]=p&255,S.set(_.types.mdat,4);for(let A=0;A<D.length;A++){let f=D[A].units;for(;f.length;){let c=f.shift().data;S.set(c,y),y+=c.byteLength}}let L=D[D.length-1];if(o=L.dts+L.duration,h=L.pts+L.duration,this._videoNextDts=o,w.beginDts=n,w.endDts=o,w.beginPts=l,w.endPts=h,w.originalBeginDts=D[0].originalDts,w.originalEndDts=L.originalDts+L.duration,w.firstSample=new le(D[0].dts,D[0].pts,D[0].duration,D[0].originalDts,D[0].isKeyframe),w.lastSample=new le(L.dts,L.pts,L.duration,L.originalDts,L.isKeyframe),this._isLive||this._videoSegmentInfoList.append(w),i.samples=D,i.sequenceNumber++,this._forceFirstIDR){let A=D[0].flags;A.dependsOn=2,A.isNonSync=0}let C=_.moof(i,n);i.samples=[],i.length=0,this._onMediaSegment("video",{type:"video",data:this._mergeBoxes(C,S).buffer,sampleCount:D.length,info:w})}_mergeBoxes(e,t){let i=new Uint8Array(e.byteLength+t.byteLength);return i.set(e,0),i.set(t,e.byteLength),i}}const jt={FORMAT_UNSUPPORTED:"FormatUnsupported"};class Kt{constructor(){this._firstCheckpoint=0,this._lastCheckpoint=0,this._intervalBytes=0,this._totalBytes=0,this._lastSecondBytes=0,self.performance&&self.performance.now?this._now=self.performance.now.bind(self.performance):this._now=Date.now}reset(){this._firstCheckpoint=this._lastCheckpoint=0,this._totalBytes=this._intervalBytes=0,this._lastSecondBytes=0}addBytes(e){this._firstCheckpoint===0?(this._firstCheckpoint=this._now(),this._lastCheckpoint=this._firstCheckpoint,this._intervalBytes+=e,this._totalBytes+=e):this._now()-this._lastCheckpoint<1e3?(this._intervalBytes+=e,this._totalBytes+=e):(this._lastSecondBytes=this._intervalBytes,this._intervalBytes=e,this._totalBytes+=e,this._lastCheckpoint=this._now())}get currentKBps(){this.addBytes(0);let e=(this._now()-this._lastCheckpoint)/1e3;return e==0&&(e=1),this._intervalBytes/e/1024}get lastSecondKBps(){return this.addBytes(0),this._lastSecondBytes!==0?this._lastSecondBytes/1024:this._now()-this._lastCheckpoint>=500?this.currentKBps:0}get averageKBps(){let e=(this._now()-this._firstCheckpoint)/1e3;return this._totalBytes/e/1024}}const V={kIdle:0,kConnecting:1,kBuffering:2,kError:3,kComplete:4},J={EXCEPTION:"Exception",HTTP_STATUS_CODE_INVALID:"HttpStatusCodeInvalid",EARLY_EOF:"EarlyEof",UNRECOVERABLE_EARLY_EOF:"UnrecoverableEarlyEof"};class Wt{constructor(e){this._type=e||"undefined",this._status=V.kIdle,this._needStash=!1,this._onContentLengthKnown=null,this._onURLRedirect=null,this._onDataArrival=null,this._onError=null,this._onComplete=null}destroy(){this._status=V.kIdle,this._onContentLengthKnown=null,this._onURLRedirect=null,this._onDataArrival=null,this._onError=null,this._onComplete=null}isWorking(){return this._status===V.kConnecting||this._status===V.kBuffering}get type(){return this._type}get status(){return this._status}get needStashBuffer(){return this._needStash}get onContentLengthKnown(){return this._onContentLengthKnown}set onContentLengthKnown(e){this._onContentLengthKnown=e}get onURLRedirect(){return this._onURLRedirect}set onURLRedirect(e){this._onURLRedirect=e}get onDataArrival(){return this._onDataArrival}set onDataArrival(e){this._onDataArrival=e}get onError(){return this._onError}set onError(e){this._onError=e}get onComplete(){return this._onComplete}set onComplete(e){this._onComplete=e}open(e,t){throw new Le("Unimplemented abstract function!")}abort(){throw new Le("Unimplemented abstract function!")}}class Ge extends Wt{static isSupported(){try{let e=M.msedge&&M.version.minor>=15048,t=M.msedge?e:!0;return self.fetch&&self.ReadableStream&&t}catch{return!1}}constructor(e,t){super("fetch-stream-loader"),this.TAG="FetchStreamLoader",this._seekHandler=e,this._config=t,this._needStash=!0,this._requestAbort=!1,this._abortController=null,this._contentLength=null,this._receivedLength=0}destroy(){this.isWorking()&&this.abort(),super.destroy()}open(e,t){this._dataSource=e,this._range=t;let i=e.url;this._config.reuseRedirectedURL&&e.redirectedURL!=null&&(i=e.redirectedURL);let s=this._seekHandler.getConfig(i,t),a=new self.Headers;if(typeof s.headers=="object"){let o=s.headers;for(let l in o)o.hasOwnProperty(l)&&a.append(l,o[l])}let n={method:"GET",headers:a,mode:"cors",cache:"default",referrerPolicy:"no-referrer-when-downgrade"};if(typeof this._config.headers=="object")for(let o in this._config.headers)a.append(o,this._config.headers[o]);e.cors===!1&&(n.mode="same-origin"),e.withCredentials&&(n.credentials="include"),e.referrerPolicy&&(n.referrerPolicy=e.referrerPolicy),self.AbortController&&(this._abortController=new self.AbortController,n.signal=this._abortController.signal),this._status=V.kConnecting,self.fetch(s.url,n).then(o=>{if(this._requestAbort){this._status=V.kIdle,o.body.cancel();return}if(o.ok&&o.status>=200&&o.status<=299){if(o.url!==s.url&&this._onURLRedirect){let h=this._seekHandler.removeURLParameters(o.url);this._onURLRedirect(h)}let l=o.headers.get("Content-Length");return l!=null&&(this._contentLength=parseInt(l),this._contentLength!==0&&this._onContentLengthKnown&&this._onContentLengthKnown(this._contentLength)),this._pump.call(this,o.body.getReader())}else if(this._status=V.kError,this._onError)this._onError(J.HTTP_STATUS_CODE_INVALID,{code:o.status,msg:o.statusText});else throw new Y("FetchStreamLoader: Http code invalid, "+o.status+" "+o.statusText)}).catch(o=>{if(!(this._abortController&&this._abortController.signal.aborted))if(this._status=V.kError,this._onError)this._onError(J.EXCEPTION,{code:-1,msg:o.message});else throw o})}abort(){if(this._requestAbort=!0,(this._status!==V.kBuffering||!M.chrome)&&this._abortController)try{this._abortController.abort()}catch{}}_pump(e){return e.read().then(t=>{if(t.done)if(this._contentLength!==null&&this._receivedLength<this._contentLength){this._status=V.kError;let i=J.EARLY_EOF,s={code:-1,msg:"Fetch stream meet Early-EOF"};if(this._onError)this._onError(i,s);else throw new Y(s.msg)}else this._status=V.kComplete,this._onComplete&&this._onComplete(this._range.from,this._range.from+this._receivedLength-1);else{if(this._abortController&&this._abortController.signal.aborted){this._status=V.kComplete;return}else if(this._requestAbort===!0)return this._status=V.kComplete,e.cancel();this._status=V.kBuffering;let i=t.value.buffer,s=this._range.from+this._receivedLength;this._receivedLength+=i.byteLength,this._onDataArrival&&this._onDataArrival(i,s,this._receivedLength),this._pump(e)}}).catch(t=>{if(this._abortController&&this._abortController.signal.aborted){this._status=V.kComplete;return}if(t.code===11&&M.msedge)return;this._status=V.kError;let i=0,s=null;if((t.code===19||t.message==="network error")&&(this._contentLength===null||this._contentLength!==null&&this._receivedLength<this._contentLength)?(i=J.EARLY_EOF,s={code:t.code,msg:"Fetch stream meet Early-EOF"}):(i=J.EXCEPTION,s={code:t.code,msg:t.message}),this._onError)this._onError(i,s);else throw new Y(s.msg)})}}class Ht{constructor(e){this._zeroStart=e||!1}getConfig(e,t){let i={};if(t.from!==0||t.to!==-1){let s;t.to!==-1?s=`bytes=${t.from.toString()}-${t.to.toString()}`:s=`bytes=${t.from.toString()}-`,i.Range=s}else this._zeroStart&&(i.Range="bytes=0-");return{url:e,headers:i}}removeURLParameters(e){return e}}class Yt{constructor(e,t){this._startName=e,this._endName=t}getConfig(e,t){let i=e;if(t.from!==0||t.to!==-1){let s=!0;i.indexOf("?")===-1&&(i+="?",s=!1),s&&(i+="&"),i+=`${this._startName}=${t.from.toString()}`,t.to!==-1&&(i+=`&${this._endName}=${t.to.toString()}`)}return{url:i,headers:{}}}removeURLParameters(e){let t=e.split("?")[0],i,s=e.indexOf("?");s!==-1&&(i=e.substring(s+1));let a="";if(i!=null&&i.length>0){let n=i.split("&");for(let o=0;o<n.length;o++){let l=n[o].split("="),h=o>0;l[0]!==this._startName&&l[0]!==this._endName&&(h&&(a+="&"),a+=n[o])}}return a.length===0?t:t+"?"+a}}class Xt{constructor(e,t,i){this.TAG="IOController",this._config=t,this._extraData=i,this._stashInitialSize=64*1024,t.stashInitialSize!=null&&t.stashInitialSize>0&&(this._stashInitialSize=t.stashInitialSize),this._stashUsed=0,this._stashSize=this._stashInitialSize,this._bufferSize=Math.max(this._stashSize,1024*1024*3),this._stashBuffer=new ArrayBuffer(this._bufferSize),this._stashByteStart=0,this._enableStash=!0,t.enableStashBuffer===!1&&(this._enableStash=!1),this._loader=null,this._loaderClass=null,this._seekHandler=null,this._dataSource=e,this._isWebSocketURL=/wss?:\\/\\/(.+?)/.test(e.url),this._refTotalLength=e.filesize?e.filesize:null,this._totalLength=this._refTotalLength,this._fullRequestFlag=!1,this._currentRange=null,this._redirectedURL=null,this._speedNormalized=0,this._speedSampler=new Kt,this._speedNormalizeList=[32,64,96,128,192,256,384,512,768,1024,1536,2048,3072,4096],this._isEarlyEofReconnecting=!1,this._paused=!1,this._resumeFrom=0,this._onDataArrival=null,this._onSeeked=null,this._onError=null,this._onComplete=null,this._onRedirect=null,this._onRecoveredEarlyEof=null,this._selectSeekHandler(),this._selectLoader(),this._createLoader()}destroy(){this._loader.isWorking()&&this._loader.abort(),this._loader.destroy(),this._loader=null,this._loaderClass=null,this._dataSource=null,this._stashBuffer=null,this._stashUsed=this._stashSize=this._bufferSize=this._stashByteStart=0,this._currentRange=null,this._speedSampler=null,this._isEarlyEofReconnecting=!1,this._onDataArrival=null,this._onSeeked=null,this._onError=null,this._onComplete=null,this._onRedirect=null,this._onRecoveredEarlyEof=null,this._extraData=null}isWorking(){return this._loader&&this._loader.isWorking()&&!this._paused}isPaused(){return this._paused}get status(){return this._loader.status}get extraData(){return this._extraData}set extraData(e){this._extraData=e}get onDataArrival(){return this._onDataArrival}set onDataArrival(e){this._onDataArrival=e}get onSeeked(){return this._onSeeked}set onSeeked(e){this._onSeeked=e}get onError(){return this._onError}set onError(e){this._onError=e}get onComplete(){return this._onComplete}set onComplete(e){this._onComplete=e}get onRedirect(){return this._onRedirect}set onRedirect(e){this._onRedirect=e}get onRecoveredEarlyEof(){return this._onRecoveredEarlyEof}set onRecoveredEarlyEof(e){this._onRecoveredEarlyEof=e}get currentURL(){return this._dataSource.url}get hasRedirect(){return this._redirectedURL!=null||this._dataSource.redirectedURL!=null}get currentRedirectedURL(){return this._redirectedURL||this._dataSource.redirectedURL}get currentSpeed(){return this._speedSampler.lastSecondKBps}get loaderType(){return this._loader.type}_selectSeekHandler(){let e=this._config;if(e.seekType==="range")this._seekHandler=new Ht(this._config.rangeLoadZeroStart);else if(e.seekType==="param"){let t=e.seekParamStart||"bstart",i=e.seekParamEnd||"bend";this._seekHandler=new Yt(t,i)}else if(e.seekType==="custom"){if(typeof e.customSeekHandler!="function")throw new xe("Custom seekType specified in config but invalid customSeekHandler!");this._seekHandler=new e.customSeekHandler}else throw new xe(`Invalid seekType in config: ${e.seekType}`)}_selectLoader(){if(this._config.customLoader!=null)this._loaderClass=this._config.customLoader;else{if(this._isWebSocketURL)throw new Error("WebSocketLoader is explicitly disabled");if(Ge.isSupported())this._loaderClass=Ge;else throw new Y("Your browser doesn\'t support xhr with arraybuffer responseType!")}}_createLoader(){this._loader=new this._loaderClass(this._seekHandler,this._config),this._loader.needStashBuffer===!1&&(this._enableStash=!1),this._loader.onContentLengthKnown=this._onContentLengthKnown.bind(this),this._loader.onURLRedirect=this._onURLRedirect.bind(this),this._loader.onDataArrival=this._onLoaderChunkArrival.bind(this),this._loader.onComplete=this._onLoaderComplete.bind(this),this._loader.onError=this._onLoaderError.bind(this)}open(e){this._currentRange={from:0,to:-1},e&&(this._currentRange.from=e),this._speedSampler.reset(),e||(this._fullRequestFlag=!0),this._loader.open(this._dataSource,Object.assign({},this._currentRange))}abort(){this._loader.abort(),this._paused&&(this._paused=!1,this._resumeFrom=0)}pause(){this.isWorking()&&(this._loader.abort(),this._stashUsed!==0?(this._resumeFrom=this._stashByteStart,this._currentRange.to=this._stashByteStart-1):this._resumeFrom=this._currentRange.to+1,this._stashUsed=0,this._stashByteStart=0,this._paused=!0)}resume(){if(this._paused){this._paused=!1;let e=this._resumeFrom;this._resumeFrom=0,this._internalSeek(e,!0)}}seek(e){this._paused=!1,this._stashUsed=0,this._stashByteStart=0,this._internalSeek(e,!0)}_internalSeek(e,t){this._loader.isWorking()&&this._loader.abort(),this._flushStashBuffer(t),this._loader.destroy(),this._loader=null;let i={from:e,to:-1};this._currentRange={from:i.from,to:-1},this._speedSampler.reset(),this._stashSize=this._stashInitialSize,this._createLoader(),this._loader.open(this._dataSource,i),this._onSeeked&&this._onSeeked()}updateUrl(e){if(!e||typeof e!="string"||e.length===0)throw new xe("Url must be a non-empty string!");this._dataSource.url=e}_expandBuffer(e){let t=this._stashSize;for(;t+1024*1024*1<e;)t*=2;if(t+=1024*1024*1,t===this._bufferSize)return;let i=new ArrayBuffer(t);if(this._stashUsed>0){let s=new Uint8Array(this._stashBuffer,0,this._stashUsed);new Uint8Array(i,0,t).set(s,0)}this._stashBuffer=i,this._bufferSize=t}_normalizeSpeed(e){let t=this._speedNormalizeList,i=t.length-1,s=0,a=0,n=i;if(e<t[0])return t[0];for(;a<=n;){if(s=a+Math.floor((n-a)/2),s===i||e>=t[s]&&e<t[s+1])return t[s];t[s]<e?a=s+1:n=s-1}}_adjustStashSize(e){let t=0;this._config.isLive?t=e/8:e<512?t=e:e>=512&&e<=1024?t=Math.floor(e*1.5):t=e*2,t>8192&&(t=8192);let i=t*1024+1024*1024*1;this._bufferSize<i&&this._expandBuffer(i),this._stashSize=t*1024}_dispatchChunks(e,t){return this._currentRange.to=t+e.byteLength-1,this._onDataArrival(e,t)}_onURLRedirect(e){this._redirectedURL=e,this._onRedirect&&this._onRedirect(e)}_onContentLengthKnown(e){e&&this._fullRequestFlag&&(this._totalLength=e,this._fullRequestFlag=!1)}_onLoaderChunkArrival(e,t,i){if(!this._onDataArrival)throw new re("IOController: No existing consumer (onDataArrival) callback!");if(this._paused)return;this._isEarlyEofReconnecting&&(this._isEarlyEofReconnecting=!1,this._onRecoveredEarlyEof&&this._onRecoveredEarlyEof()),this._speedSampler.addBytes(e.byteLength);let s=this._speedSampler.lastSecondKBps;if(s!==0){let a=this._normalizeSpeed(s);this._speedNormalized!==a&&(this._speedNormalized=a,this._adjustStashSize(a))}if(this._enableStash)if(this._stashUsed===0&&this._stashByteStart===0&&(this._stashByteStart=t),this._stashUsed+e.byteLength<=this._stashSize)new Uint8Array(this._stashBuffer,0,this._stashSize).set(new Uint8Array(e),this._stashUsed),this._stashUsed+=e.byteLength;else{let a=new Uint8Array(this._stashBuffer,0,this._bufferSize);if(this._stashUsed>0){let n=this._stashBuffer.slice(0,this._stashUsed),o=this._dispatchChunks(n,this._stashByteStart);if(o<n.byteLength){if(o>0){let l=new Uint8Array(n,o);a.set(l,0),this._stashUsed=l.byteLength,this._stashByteStart+=o}}else this._stashUsed=0,this._stashByteStart+=o;this._stashUsed+e.byteLength>this._bufferSize&&(this._expandBuffer(this._stashUsed+e.byteLength),a=new Uint8Array(this._stashBuffer,0,this._bufferSize)),a.set(new Uint8Array(e),this._stashUsed),this._stashUsed+=e.byteLength}else{let n=this._dispatchChunks(e,t);if(n<e.byteLength){let o=e.byteLength-n;o>this._bufferSize&&(this._expandBuffer(o),a=new Uint8Array(this._stashBuffer,0,this._bufferSize)),a.set(new Uint8Array(e,n),0),this._stashUsed+=o,this._stashByteStart=t+n}}}else if(this._stashUsed===0){let a=this._dispatchChunks(e,t);if(a<e.byteLength){let n=e.byteLength-a;n>this._bufferSize&&this._expandBuffer(n),new Uint8Array(this._stashBuffer,0,this._bufferSize).set(new Uint8Array(e,a),0),this._stashUsed+=n,this._stashByteStart=t+a}}else{this._stashUsed+e.byteLength>this._bufferSize&&this._expandBuffer(this._stashUsed+e.byteLength);let a=new Uint8Array(this._stashBuffer,0,this._bufferSize);a.set(new Uint8Array(e),this._stashUsed),this._stashUsed+=e.byteLength;let n=this._dispatchChunks(this._stashBuffer.slice(0,this._stashUsed),this._stashByteStart);if(n<this._stashUsed&&n>0){let o=new Uint8Array(this._stashBuffer,n);a.set(o,0)}this._stashUsed-=n,this._stashByteStart+=n}}_flushStashBuffer(e){if(this._stashUsed>0){let t=this._stashBuffer.slice(0,this._stashUsed),i=this._dispatchChunks(t,this._stashByteStart),s=t.byteLength-i;if(i<t.byteLength)if(e)d.w(this.TAG,`${s} bytes unconsumed data remain when flush buffer, dropped`);else{if(i>0){let a=new Uint8Array(this._stashBuffer,0,this._bufferSize),n=new Uint8Array(t,i);a.set(n,0),this._stashUsed=n.byteLength,this._stashByteStart+=i}return 0}return this._stashUsed=0,this._stashByteStart=0,s}return 0}_onLoaderComplete(e,t){this._flushStashBuffer(!0),this._onComplete&&this._onComplete(this._extraData)}_onLoaderError(e,t){switch(d.e(this.TAG,`Loader error, code = ${t.code}, msg = ${t.msg}`),this._flushStashBuffer(!1),this._isEarlyEofReconnecting&&(this._isEarlyEofReconnecting=!1,e=J.UNRECOVERABLE_EARLY_EOF),e){case J.EARLY_EOF:{if(!this._config.isLive&&this._totalLength){let i=this._currentRange.to+1;i<this._totalLength&&(d.w(this.TAG,"Connection lost, trying reconnect..."),this._isEarlyEofReconnecting=!0,this._internalSeek(i,!1));return}e=J.UNRECOVERABLE_EARLY_EOF;break}}if(this._onError)this._onError(e,t);else throw new Y("IOException: "+t.msg)}}var B=(r=>(r.IO_ERROR="io_error",r.DEMUX_ERROR="demux_error",r.INIT_SEGMENT="init_segment",r.MEDIA_SEGMENT="media_segment",r.LOADING_COMPLETE="loading_complete",r.RECOVERED_EARLY_EOF="recovered_early_eof",r.MEDIA_INFO="media_info",r.METADATA_ARRIVED="metadata_arrived",r.SCRIPTDATA_ARRIVED="scriptdata_arrived",r.TIMED_ID3_METADATA_ARRIVED="timed_id3_metadata_arrived",r.PGS_SUBTITLE_ARRIVED="pgs_subtitle_arrived",r.SYNCHRONOUS_KLV_METADATA_ARRIVED="synchronous_klv_metadata_arrived",r.ASYNCHRONOUS_KLV_METADATA_ARRIVED="asynchronous_klv_metadata_arrived",r.SMPTE2038_METADATA_ARRIVED="smpte2038_metadata_arrived",r.SCTE35_METADATA_ARRIVED="scte35_metadata_arrived",r.PES_PRIVATE_DATA_DESCRIPTOR="pes_private_data_descriptor",r.PES_PRIVATE_DATA_ARRIVED="pes_private_data_arrived",r.STATISTICS_INFO="statistics_info",r.RECOMMEND_SEEKPOINT="recommend_seekpoint",r))(B||{});class Zt{constructor(e,t){this.TAG="TransmuxingController",this._emitter=new ye,this._config=t,e.segments||(e.segments=[{duration:e.duration,filesize:e.filesize,url:e.url}]),typeof e.cors!="boolean"&&(e.cors=!0),typeof e.withCredentials!="boolean"&&(e.withCredentials=!1),this._mediaDataSource=e,this._currentSegmentIndex=0;let i=0;this._mediaDataSource.segments.forEach(s=>{s.timestampBase=i,i+=s.duration,s.cors=e.cors,s.withCredentials=e.withCredentials,t.referrerPolicy&&(s.referrerPolicy=t.referrerPolicy)}),!isNaN(i)&&this._mediaDataSource.duration!==i&&(this._mediaDataSource.duration=i),this._mediaInfo=null,this._demuxer=null,this._remuxer=null,this._ioctl=null,this._pendingSeekTime=null,this._pendingResolveSeekPoint=null,this._statisticsReporter=null}destroy(){this._mediaInfo=null,this._mediaDataSource=null,this._statisticsReporter&&this._disableStatisticsReporter(),this._ioctl&&(this._ioctl.destroy(),this._ioctl=null),this._demuxer&&(this._demuxer.destroy(),this._demuxer=null),this._remuxer&&(this._remuxer.destroy(),this._remuxer=null),this._emitter.removeAllListeners(),this._emitter=null}on(e,t){this._emitter.addListener(e,t)}off(e,t){this._emitter.removeListener(e,t)}start(){this._loadSegment(0),this._enableStatisticsReporter()}_loadSegment(e,t){this._currentSegmentIndex=e;let i=this._mediaDataSource.segments[e],s=this._ioctl=new Xt(i,this._config,e);s.onError=this._onIOException.bind(this),s.onSeeked=this._onIOSeeked.bind(this),s.onComplete=this._onIOComplete.bind(this),s.onRedirect=this._onIORedirect.bind(this),s.onRecoveredEarlyEof=this._onIORecoveredEarlyEof.bind(this),t?this._demuxer.bindDataSource(this._ioctl):s.onDataArrival=this._onInitChunkArrival.bind(this),s.open(t)}stop(){this._internalAbort(),this._disableStatisticsReporter()}_internalAbort(){this._ioctl&&(this._ioctl.destroy(),this._ioctl=null)}pause(){this._ioctl&&this._ioctl.isWorking()&&(this._ioctl.pause(),this._disableStatisticsReporter())}resume(){this._ioctl&&this._ioctl.isPaused()&&(this._ioctl.resume(),this._enableStatisticsReporter())}seek(e){if(this._mediaInfo==null||!this._mediaInfo.isSeekable())return;let t=this._searchSegmentIndexContains(e);if(t===this._currentSegmentIndex){let i=this._mediaInfo.segments[t];if(i==null)this._pendingSeekTime=e;else{let s=i.getNearestKeyframe(e);this._remuxer.seek(s.milliseconds),this._ioctl.seek(s.fileposition),this._pendingResolveSeekPoint=s.milliseconds}}else{let i=this._mediaInfo.segments[t];if(i==null)this._pendingSeekTime=e,this._internalAbort(),this._remuxer.seek(),this._remuxer.insertDiscontinuity(),this._loadSegment(t);else{let s=i.getNearestKeyframe(e);this._internalAbort(),this._remuxer.seek(e),this._remuxer.insertDiscontinuity(),this._demuxer.resetMediaInfo(),this._demuxer.timestampBase=this._mediaDataSource.segments[t].timestampBase,this._loadSegment(t,s.fileposition),this._pendingResolveSeekPoint=s.milliseconds,this._reportSegmentMediaInfo(t)}}this._enableStatisticsReporter()}_searchSegmentIndexContains(e){let t=this._mediaDataSource.segments,i=t.length-1;for(let s=0;s<t.length;s++)if(e<t[s].timestampBase){i=s-1;break}return i}_onInitChunkArrival(e,t){let i=0;if(t>0)this._demuxer.bindDataSource(this._ioctl),this._demuxer.timestampBase=this._mediaDataSource.segments[this._currentSegmentIndex].timestampBase,i=this._demuxer.parseChunks(e,t);else{let s=null;s=Ie.probe(e),s.match&&(this._setupTSDemuxerRemuxer(s),i=this._demuxer.parseChunks(e,t)),!s.match&&!s.needMoreData&&(s=null,d.e(this.TAG,"Non MPEG-TS/FLV, Unsupported media type!"),Promise.resolve().then(()=>{this._internalAbort()}),this._emitter.emit(B.DEMUX_ERROR,jt.FORMAT_UNSUPPORTED,"Non MPEG-TS/FLV, Unsupported media type!"))}return i}_setupTSDemuxerRemuxer(e){let t=this._demuxer=new Ie(e,this._config);this._remuxer||(this._remuxer=new $t(this._config)),t.onError=this._onDemuxException.bind(this),t.onMediaInfo=this._onMediaInfo.bind(this),t.onMetaDataArrived=this._onMetaDataArrived.bind(this),t.onTimedID3Metadata=this._onTimedID3Metadata.bind(this),t.onPGSSubtitleData=this._onPGSSubtitle.bind(this),t.onSynchronousKLVMetadata=this._onSynchronousKLVMetadata.bind(this),t.onAsynchronousKLVMetadata=this._onAsynchronousKLVMetadata.bind(this),t.onSMPTE2038Metadata=this._onSMPTE2038Metadata.bind(this),t.onSCTE35Metadata=this._onSCTE35Metadata.bind(this),t.onPESPrivateDataDescriptor=this._onPESPrivateDataDescriptor.bind(this),t.onPESPrivateData=this._onPESPrivateData.bind(this),this._remuxer.bindDataSource(this._demuxer),this._demuxer.bindDataSource(this._ioctl),this._remuxer.onInitSegment=this._onRemuxerInitSegmentArrival.bind(this),this._remuxer.onMediaSegment=this._onRemuxerMediaSegmentArrival.bind(this)}_onMediaInfo(e){this._mediaInfo==null&&(this._mediaInfo=Object.assign({},e),this._mediaInfo.keyframesIndex=null,this._mediaInfo.segments=[],this._mediaInfo.segmentCount=this._mediaDataSource.segments.length,Object.setPrototypeOf(this._mediaInfo,pe.prototype));let t=Object.assign({},e);Object.setPrototypeOf(t,pe.prototype),this._mediaInfo.segments[this._currentSegmentIndex]=t,this._reportSegmentMediaInfo(this._currentSegmentIndex),this._pendingSeekTime!=null&&Promise.resolve().then(()=>{let i=this._pendingSeekTime;this._pendingSeekTime=null,this.seek(i)})}_onMetaDataArrived(e){this._emitter.emit(B.METADATA_ARRIVED,e)}_onScriptDataArrived(e){this._emitter.emit(B.SCRIPTDATA_ARRIVED,e)}_onTimedID3Metadata(e){let t=this._remuxer.getTimestampBase();t!=null&&(e.pts!=null&&(e.pts-=t),e.dts!=null&&(e.dts-=t),this._emitter.emit(B.TIMED_ID3_METADATA_ARRIVED,e))}_onPGSSubtitle(e){let t=this._remuxer.getTimestampBase();t!=null&&(e.pts!=null&&(e.pts-=t),e.dts!=null&&(e.dts-=t),this._emitter.emit(B.PGS_SUBTITLE_ARRIVED,e))}_onSynchronousKLVMetadata(e){let t=this._remuxer.getTimestampBase();t!=null&&(e.pts!=null&&(e.pts-=t),e.dts!=null&&(e.dts-=t),this._emitter.emit(B.SYNCHRONOUS_KLV_METADATA_ARRIVED,e))}_onAsynchronousKLVMetadata(e){this._emitter.emit(B.ASYNCHRONOUS_KLV_METADATA_ARRIVED,e)}_onSMPTE2038Metadata(e){let t=this._remuxer.getTimestampBase();t!=null&&(e.pts!=null&&(e.pts-=t),e.dts!=null&&(e.dts-=t),e.nearest_pts!=null&&(e.nearest_pts-=t),this._emitter.emit(B.SMPTE2038_METADATA_ARRIVED,e))}_onSCTE35Metadata(e){let t=this._remuxer.getTimestampBase();t!=null&&(e.pts!=null&&(e.pts-=t),e.nearest_pts!=null&&(e.nearest_pts-=t),this._emitter.emit(B.SCTE35_METADATA_ARRIVED,e))}_onPESPrivateDataDescriptor(e){this._emitter.emit(B.PES_PRIVATE_DATA_DESCRIPTOR,e)}_onPESPrivateData(e){let t=this._remuxer.getTimestampBase();t!=null&&(e.pts!=null&&(e.pts-=t),e.nearest_pts!=null&&(e.nearest_pts-=t),e.dts!=null&&(e.dts-=t),this._emitter.emit(B.PES_PRIVATE_DATA_ARRIVED,e))}_onIOSeeked(){this._remuxer.insertDiscontinuity()}_onIOComplete(e){let i=e+1;i<this._mediaDataSource.segments.length?(this._internalAbort(),this._remuxer&&this._remuxer.flushStashedSamples(),this._loadSegment(i)):(this._remuxer&&this._remuxer.flushStashedSamples(),this._emitter.emit(B.LOADING_COMPLETE),this._disableStatisticsReporter())}_onIORedirect(e){let t=this._ioctl.extraData;this._mediaDataSource.segments[t].redirectedURL=e}_onIORecoveredEarlyEof(){this._emitter.emit(B.RECOVERED_EARLY_EOF)}_onIOException(e,t){d.e(this.TAG,`IOException: type = ${e}, code = ${t.code}, msg = ${t.msg}`),this._emitter.emit(B.IO_ERROR,e,t),this._disableStatisticsReporter()}_onDemuxException(e,t){d.e(this.TAG,`DemuxException: type = ${e}, info = ${t}`),this._emitter.emit(B.DEMUX_ERROR,e,t)}_onRemuxerInitSegmentArrival(e,t){this._emitter.emit(B.INIT_SEGMENT,e,t)}_onRemuxerMediaSegmentArrival(e,t){if(this._pendingSeekTime==null&&(this._emitter.emit(B.MEDIA_SEGMENT,e,t),this._pendingResolveSeekPoint!=null&&e==="video")){let i=t.info.syncPoints,s=this._pendingResolveSeekPoint;this._pendingResolveSeekPoint=null,M.safari&&i.length>0&&i[0].originalDts===s&&(s=i[0].pts),this._emitter.emit(B.RECOMMEND_SEEKPOINT,s)}}_enableStatisticsReporter(){this._statisticsReporter==null&&(this._statisticsReporter=self.setInterval(this._reportStatisticsInfo.bind(this),this._config.statisticsInfoReportInterval))}_disableStatisticsReporter(){this._statisticsReporter&&(self.clearInterval(this._statisticsReporter),this._statisticsReporter=null)}_reportSegmentMediaInfo(e){let t=this._mediaInfo.segments[e],i=Object.assign({},t);i.duration=this._mediaInfo.duration,i.segmentCount=this._mediaInfo.segmentCount,delete i.segments,delete i.keyframesIndex,this._emitter.emit(B.MEDIA_INFO,i)}_reportStatisticsInfo(){let e={};e.url=this._ioctl.currentURL,e.hasRedirect=this._ioctl.hasRedirect,e.hasRedirect&&(e.redirectedURL=this._ioctl.currentRedirectedURL),e.speed=this._ioctl.currentSpeed,e.loaderType=this._ioctl.loaderType,e.currentSegmentIndex=this._currentSegmentIndex,e.totalSegmentCount=this._mediaDataSource.segments.length,this._emitter.emit(B.STATISTICS_INFO,e)}}let R=null,Ne=xi.bind(void 0);self.addEventListener("message",function(r){switch(r.data.cmd){case"init":R=new Zt(r.data.param[0],r.data.param[1]),R.on(B.IO_ERROR,ui.bind(this)),R.on(B.DEMUX_ERROR,mi.bind(this)),R.on(B.INIT_SEGMENT,Jt.bind(this)),R.on(B.MEDIA_SEGMENT,Qt.bind(this)),R.on(B.LOADING_COMPLETE,ei.bind(this)),R.on(B.RECOVERED_EARLY_EOF,ti.bind(this)),R.on(B.MEDIA_INFO,ii.bind(this)),R.on(B.METADATA_ARRIVED,si.bind(this)),R.on(B.SCRIPTDATA_ARRIVED,ai.bind(this)),R.on(B.TIMED_ID3_METADATA_ARRIVED,ni.bind(this)),R.on(B.PGS_SUBTITLE_ARRIVED,ri.bind(this)),R.on(B.SYNCHRONOUS_KLV_METADATA_ARRIVED,oi.bind(this)),R.on(B.ASYNCHRONOUS_KLV_METADATA_ARRIVED,li.bind(this)),R.on(B.SMPTE2038_METADATA_ARRIVED,_i.bind(this)),R.on(B.SCTE35_METADATA_ARRIVED,di.bind(this)),R.on(B.PES_PRIVATE_DATA_DESCRIPTOR,hi.bind(this)),R.on(B.PES_PRIVATE_DATA_ARRIVED,fi.bind(this)),R.on(B.STATISTICS_INFO,ci.bind(this)),R.on(B.RECOMMEND_SEEKPOINT,pi.bind(this));break;case"destroy":R&&(R.destroy(),R=null),self.postMessage({msg:"destroyed"});break;case"start":R.start();break;case"stop":R.stop();break;case"seek":R.seek(r.data.param);break;case"pause":R.pause();break;case"resume":R.resume();break;case"logging_config":{let e=r.data.param;N.applyConfig(e),e.enableCallback===!0?N.addLogListener(Ne):N.removeLogListener(Ne);break}}});function Jt(r,e){let t={msg:B.INIT_SEGMENT,data:{type:r,data:e}};self.postMessage(t,[e.data])}function Qt(r,e){let t={msg:B.MEDIA_SEGMENT,data:{type:r,data:e}};self.postMessage(t,[e.data])}function ei(){let r={msg:B.LOADING_COMPLETE};self.postMessage(r)}function ti(){let r={msg:B.RECOVERED_EARLY_EOF};self.postMessage(r)}function ii(r){let e={msg:B.MEDIA_INFO,data:r};self.postMessage(e)}function si(r){let e={msg:B.METADATA_ARRIVED,data:r};self.postMessage(e)}function ai(r){let e={msg:B.SCRIPTDATA_ARRIVED,data:r};self.postMessage(e)}function ni(r){let e={msg:B.TIMED_ID3_METADATA_ARRIVED,data:r};self.postMessage(e)}function ri(r){let e={msg:B.PGS_SUBTITLE_ARRIVED,data:r};self.postMessage(e)}function oi(r){let e={msg:B.SYNCHRONOUS_KLV_METADATA_ARRIVED,data:r};self.postMessage(e)}function li(r){let e={msg:B.ASYNCHRONOUS_KLV_METADATA_ARRIVED,data:r};self.postMessage(e)}function _i(r){let e={msg:B.SMPTE2038_METADATA_ARRIVED,data:r};self.postMessage(e)}function di(r){let e={msg:B.SCTE35_METADATA_ARRIVED,data:r};self.postMessage(e)}function hi(r){let e={msg:B.PES_PRIVATE_DATA_DESCRIPTOR,data:r};self.postMessage(e)}function fi(r){let e={msg:B.PES_PRIVATE_DATA_ARRIVED,data:r};self.postMessage(e)}function ci(r){let e={msg:B.STATISTICS_INFO,data:r};self.postMessage(e)}function ui(r,e){self.postMessage({msg:B.IO_ERROR,data:{type:r,info:e}})}function mi(r,e){self.postMessage({msg:B.DEMUX_ERROR,data:{type:r,info:e}})}function pi(r){self.postMessage({msg:B.RECOMMEND_SEEKPOINT,data:r})}function xi(r,e){self.postMessage({msg:"logcat_callback",data:{type:r,logcat:e}})}})();\n', W = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Q], { type: "text/javascript;charset=utf-8" });
function me(r) {
  let e;
  try {
    if (e = W && (self.URL || self.webkitURL).createObjectURL(W), !e) throw "";
    const t = new Worker(e, {
      name: r?.name
    });
    return t.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(e);
    }), t;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Q),
      {
        name: r?.name
      }
    );
  }
}
class E {
  static get forceGlobalTag() {
    return n.FORCE_GLOBAL_TAG;
  }
  static set forceGlobalTag(e) {
    n.FORCE_GLOBAL_TAG = e, E._notifyChange();
  }
  static get globalTag() {
    return n.GLOBAL_TAG;
  }
  static set globalTag(e) {
    n.GLOBAL_TAG = e, E._notifyChange();
  }
  static get enableAll() {
    return n.ENABLE_VERBOSE && n.ENABLE_DEBUG && n.ENABLE_INFO && n.ENABLE_WARN && n.ENABLE_ERROR;
  }
  static set enableAll(e) {
    n.ENABLE_VERBOSE = e, n.ENABLE_DEBUG = e, n.ENABLE_INFO = e, n.ENABLE_WARN = e, n.ENABLE_ERROR = e, E._notifyChange();
  }
  static get enableDebug() {
    return n.ENABLE_DEBUG;
  }
  static set enableDebug(e) {
    n.ENABLE_DEBUG = e, E._notifyChange();
  }
  static get enableVerbose() {
    return n.ENABLE_VERBOSE;
  }
  static set enableVerbose(e) {
    n.ENABLE_VERBOSE = e, E._notifyChange();
  }
  static get enableInfo() {
    return n.ENABLE_INFO;
  }
  static set enableInfo(e) {
    n.ENABLE_INFO = e, E._notifyChange();
  }
  static get enableWarn() {
    return n.ENABLE_WARN;
  }
  static set enableWarn(e) {
    n.ENABLE_WARN = e, E._notifyChange();
  }
  static get enableError() {
    return n.ENABLE_ERROR;
  }
  static set enableError(e) {
    n.ENABLE_ERROR = e, E._notifyChange();
  }
  static getConfig() {
    return {
      globalTag: n.GLOBAL_TAG,
      forceGlobalTag: n.FORCE_GLOBAL_TAG,
      enableVerbose: n.ENABLE_VERBOSE,
      enableDebug: n.ENABLE_DEBUG,
      enableInfo: n.ENABLE_INFO,
      enableWarn: n.ENABLE_WARN,
      enableError: n.ENABLE_ERROR,
      enableCallback: n.ENABLE_CALLBACK
    };
  }
  static applyConfig(e) {
    n.GLOBAL_TAG = e.globalTag, n.FORCE_GLOBAL_TAG = e.forceGlobalTag, n.ENABLE_VERBOSE = e.enableVerbose, n.ENABLE_DEBUG = e.enableDebug, n.ENABLE_INFO = e.enableInfo, n.ENABLE_WARN = e.enableWarn, n.ENABLE_ERROR = e.enableError, n.ENABLE_CALLBACK = e.enableCallback;
  }
  static _notifyChange() {
    let e = E.emitter;
    if (e.listenerCount("change") > 0) {
      let t = E.getConfig();
      e.emit("change", t);
    }
  }
  static registerListener(e) {
    E.emitter.addListener("change", e);
  }
  static removeListener(e) {
    E.emitter.removeListener("change", e);
  }
  static addLogListener(e) {
    n.emitter.addListener("log", e), n.emitter.listenerCount("log") > 0 && (n.ENABLE_CALLBACK = !0, E._notifyChange());
  }
  static removeLogListener(e) {
    n.emitter.removeListener("log", e), n.emitter.listenerCount("log") === 0 && (n.ENABLE_CALLBACK = !1, E._notifyChange());
  }
}
E.emitter = new M();
var _ = /* @__PURE__ */ ((r) => (r.IO_ERROR = "io_error", r.DEMUX_ERROR = "demux_error", r.INIT_SEGMENT = "init_segment", r.MEDIA_SEGMENT = "media_segment", r.LOADING_COMPLETE = "loading_complete", r.RECOVERED_EARLY_EOF = "recovered_early_eof", r.MEDIA_INFO = "media_info", r.METADATA_ARRIVED = "metadata_arrived", r.SCRIPTDATA_ARRIVED = "scriptdata_arrived", r.TIMED_ID3_METADATA_ARRIVED = "timed_id3_metadata_arrived", r.PGS_SUBTITLE_ARRIVED = "pgs_subtitle_arrived", r.SYNCHRONOUS_KLV_METADATA_ARRIVED = "synchronous_klv_metadata_arrived", r.ASYNCHRONOUS_KLV_METADATA_ARRIVED = "asynchronous_klv_metadata_arrived", r.SMPTE2038_METADATA_ARRIVED = "smpte2038_metadata_arrived", r.SCTE35_METADATA_ARRIVED = "scte35_metadata_arrived", r.PES_PRIVATE_DATA_DESCRIPTOR = "pes_private_data_descriptor", r.PES_PRIVATE_DATA_ARRIVED = "pes_private_data_arrived", r.STATISTICS_INFO = "statistics_info", r.RECOMMEND_SEEKPOINT = "recommend_seekpoint", r))(_ || {});
class pe {
  constructor() {
    this.mimeType = null, this.duration = null, this.hasAudio = null, this.hasVideo = null, this.audioCodec = null, this.videoCodec = null, this.audioDataRate = null, this.videoDataRate = null, this.audioSampleRate = null, this.audioChannelCount = null, this.width = null, this.height = null, this.fps = null, this.profile = null, this.level = null, this.refFrames = null, this.chromaFormat = null, this.sarNum = null, this.sarDen = null, this.metadata = null, this.segments = null, this.segmentCount = null, this.hasKeyframesIndex = null, this.keyframesIndex = null;
  }
  isComplete() {
    let e = this.hasAudio === !1 || this.hasAudio === !0 && this.audioCodec != null && this.audioSampleRate != null && this.audioChannelCount != null, t = this.hasVideo === !1 || this.hasVideo === !0 && this.videoCodec != null && this.width != null && this.height != null && this.fps != null && this.profile != null && this.level != null && this.refFrames != null && this.chromaFormat != null && this.sarNum != null && this.sarDen != null;
    return this.mimeType != null && e && t;
  }
  isSeekable() {
    return this.hasKeyframesIndex === !0;
  }
  getNearestKeyframe(e) {
    if (this.keyframesIndex == null)
      return null;
    let t = this.keyframesIndex, i = this._search(t.times, e);
    return {
      index: i,
      milliseconds: t.times[i],
      fileposition: t.filepositions[i]
    };
  }
  _search(e, t) {
    let i = 0, s = e.length - 1, a = 0, d = 0, c = s;
    for (t < e[0] && (i = 0, d = c + 1); d <= c; )
      if (a = d + Math.floor((c - d) / 2), a === s || t >= e[a] && t < e[a + 1]) {
        i = a;
        break;
      } else e[a] < t ? d = a + 1 : c = a - 1;
    return i;
  }
}
class ge {
  constructor(e, t) {
    if (this.TAG = "Transmuxer", this._emitter = new M(), t.enableWorker && typeof Worker < "u")
      try {
        this._worker = new me(), this._workerDestroying = !1, this._worker.addEventListener(
          "message",
          this._onWorkerMessage.bind(this)
        ), this._worker.postMessage({
          cmd: "init",
          param: [e, t]
        }), this.e = {
          onLoggingConfigChanged: this._onLoggingConfigChanged.bind(this)
        }, E.registerListener(this.e.onLoggingConfigChanged), this._worker.postMessage({
          cmd: "logging_config",
          param: E.getConfig()
        });
      } catch {
        throw n.e(
          this.TAG,
          "Error while initialize transmuxing worker, fallback to inline transmuxing"
        ), this._worker = null, new Error("Transmuxer without worker is explicitly disabled");
      }
    else
      throw new Error("Transmuxer without worker is explicitly disabled");
    if (this._controller) {
      let i = this._controller;
      i.on(_.IO_ERROR, this._onIOError.bind(this)), i.on(_.DEMUX_ERROR, this._onDemuxError.bind(this)), i.on(_.INIT_SEGMENT, this._onInitSegment.bind(this)), i.on(_.MEDIA_SEGMENT, this._onMediaSegment.bind(this)), i.on(
        _.LOADING_COMPLETE,
        this._onLoadingComplete.bind(this)
      ), i.on(
        _.RECOVERED_EARLY_EOF,
        this._onRecoveredEarlyEof.bind(this)
      ), i.on(_.MEDIA_INFO, this._onMediaInfo.bind(this)), i.on(
        _.METADATA_ARRIVED,
        this._onMetaDataArrived.bind(this)
      ), i.on(
        _.SCRIPTDATA_ARRIVED,
        this._onScriptDataArrived.bind(this)
      ), i.on(
        _.TIMED_ID3_METADATA_ARRIVED,
        this._onTimedID3MetadataArrived.bind(this)
      ), i.on(
        _.SYNCHRONOUS_KLV_METADATA_ARRIVED,
        this._onSynchronousKLVMetadataArrived.bind(this)
      ), i.on(
        _.ASYNCHRONOUS_KLV_METADATA_ARRIVED,
        this._onAsynchronousKLVMetadataArrived.bind(this)
      ), i.on(
        _.SMPTE2038_METADATA_ARRIVED,
        this._onSMPTE2038MetadataArrived.bind(this)
      ), i.on(
        _.SCTE35_METADATA_ARRIVED,
        this._onSCTE35MetadataArrived.bind(this)
      ), i.on(
        _.PES_PRIVATE_DATA_DESCRIPTOR,
        this._onPESPrivateDataDescriptor.bind(this)
      ), i.on(
        _.PES_PRIVATE_DATA_ARRIVED,
        this._onPESPrivateDataArrived.bind(this)
      ), i.on(
        _.STATISTICS_INFO,
        this._onStatisticsInfo.bind(this)
      ), i.on(
        _.RECOMMEND_SEEKPOINT,
        this._onRecommendSeekpoint.bind(this)
      );
    }
  }
  destroy() {
    this._worker ? this._workerDestroying || (this._workerDestroying = !0, this._worker.postMessage({ cmd: "destroy" }), E.removeListener(this.e.onLoggingConfigChanged), this.e = null) : (this._controller.destroy(), this._controller = null), this._emitter.removeAllListeners(), this._emitter = null;
  }
  on(e, t) {
    this._emitter.addListener(e, t);
  }
  off(e, t) {
    this._emitter.removeListener(e, t);
  }
  hasWorker() {
    return this._worker != null;
  }
  open() {
    this._worker ? this._worker.postMessage({ cmd: "start" }) : this._controller.start();
  }
  close() {
    this._worker ? this._worker.postMessage({ cmd: "stop" }) : this._controller.stop();
  }
  seek(e) {
    this._worker ? this._worker.postMessage({ cmd: "seek", param: e }) : this._controller.seek(e);
  }
  pause() {
    this._worker ? this._worker.postMessage({ cmd: "pause" }) : this._controller.pause();
  }
  resume() {
    this._worker ? this._worker.postMessage({ cmd: "resume" }) : this._controller.resume();
  }
  _onInitSegment(e, t) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.INIT_SEGMENT, e, t);
    });
  }
  _onMediaSegment(e, t) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.MEDIA_SEGMENT, e, t);
    });
  }
  _onLoadingComplete() {
    Promise.resolve().then(() => {
      this._emitter.emit(_.LOADING_COMPLETE);
    });
  }
  _onRecoveredEarlyEof() {
    Promise.resolve().then(() => {
      this._emitter.emit(_.RECOVERED_EARLY_EOF);
    });
  }
  _onMediaInfo(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.MEDIA_INFO, e);
    });
  }
  _onMetaDataArrived(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.METADATA_ARRIVED, e);
    });
  }
  _onScriptDataArrived(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.SCRIPTDATA_ARRIVED, e);
    });
  }
  _onTimedID3MetadataArrived(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.TIMED_ID3_METADATA_ARRIVED, e);
    });
  }
  _onPGSSubtitleArrived(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.PGS_SUBTITLE_ARRIVED, e);
    });
  }
  _onSynchronousKLVMetadataArrived(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(
        _.SYNCHRONOUS_KLV_METADATA_ARRIVED,
        e
      );
    });
  }
  _onAsynchronousKLVMetadataArrived(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(
        _.ASYNCHRONOUS_KLV_METADATA_ARRIVED,
        e
      );
    });
  }
  _onSMPTE2038MetadataArrived(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.SMPTE2038_METADATA_ARRIVED, e);
    });
  }
  _onSCTE35MetadataArrived(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.SCTE35_METADATA_ARRIVED, e);
    });
  }
  _onPESPrivateDataDescriptor(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.PES_PRIVATE_DATA_DESCRIPTOR, e);
    });
  }
  _onPESPrivateDataArrived(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.PES_PRIVATE_DATA_ARRIVED, e);
    });
  }
  _onStatisticsInfo(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.STATISTICS_INFO, e);
    });
  }
  _onIOError(e, t) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.IO_ERROR, e, t);
    });
  }
  _onDemuxError(e, t) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.DEMUX_ERROR, e, t);
    });
  }
  _onRecommendSeekpoint(e) {
    Promise.resolve().then(() => {
      this._emitter.emit(_.RECOMMEND_SEEKPOINT, e);
    });
  }
  _onLoggingConfigChanged(e) {
    this._worker && this._worker.postMessage({ cmd: "logging_config", param: e });
  }
  _onWorkerMessage(e) {
    let t = e.data, i = t.data;
    if (t.msg === "destroyed" || this._workerDestroying) {
      this._workerDestroying = !1, this._worker.terminate(), this._worker = null;
      return;
    }
    switch (t.msg) {
      case _.INIT_SEGMENT:
      case _.MEDIA_SEGMENT:
        this._emitter.emit(t.msg, i.type, i.data);
        break;
      case _.LOADING_COMPLETE:
      case _.RECOVERED_EARLY_EOF:
        this._emitter.emit(t.msg);
        break;
      case _.MEDIA_INFO:
        Object.setPrototypeOf(i, pe.prototype), this._emitter.emit(t.msg, i);
        break;
      case _.METADATA_ARRIVED:
      case _.SCRIPTDATA_ARRIVED:
      case _.TIMED_ID3_METADATA_ARRIVED:
      case _.PGS_SUBTITLE_ARRIVED:
      case _.SYNCHRONOUS_KLV_METADATA_ARRIVED:
      case _.ASYNCHRONOUS_KLV_METADATA_ARRIVED:
      case _.SMPTE2038_METADATA_ARRIVED:
      case _.SCTE35_METADATA_ARRIVED:
      case _.PES_PRIVATE_DATA_DESCRIPTOR:
      case _.PES_PRIVATE_DATA_ARRIVED:
      case _.STATISTICS_INFO:
        this._emitter.emit(t.msg, i);
        break;
      case _.IO_ERROR:
      case _.DEMUX_ERROR:
        this._emitter.emit(t.msg, i.type, i.info);
        break;
      case _.RECOMMEND_SEEKPOINT:
        this._emitter.emit(t.msg, i);
        break;
      case "logcat_callback":
        n.emitter.emit("log", i.type, i.logcat);
        break;
    }
  }
}
const P = {
  FORMAT_ERROR: "FormatError",
  FORMAT_UNSUPPORTED: "FormatUnsupported",
  CODEC_UNSUPPORTED: "CodecUnsupported"
}, x = {
  NETWORK_ERROR: "NetworkError",
  MEDIA_ERROR: "MediaError",
  OTHER_ERROR: "OtherError"
}, Z = {
  NETWORK_EXCEPTION: b.EXCEPTION,
  NETWORK_STATUS_CODE_INVALID: b.HTTP_STATUS_CODE_INVALID,
  NETWORK_TIMEOUT: b.CONNECTING_TIMEOUT,
  NETWORK_UNRECOVERABLE_EARLY_EOF: b.UNRECOVERABLE_EARLY_EOF,
  MEDIA_MSE_ERROR: "MediaMSEError",
  MEDIA_FORMAT_ERROR: P.FORMAT_ERROR,
  MEDIA_FORMAT_UNSUPPORTED: P.FORMAT_UNSUPPORTED,
  MEDIA_CODEC_UNSUPPORTED: P.CODEC_UNSUPPORTED
};
class ye {
  constructor() {
    this._list = [];
  }
  clear() {
    this._list = [];
  }
  appendArray(e) {
    let t = this._list;
    e.length !== 0 && (t.length > 0 && e[0].originalDts < t[t.length - 1].originalDts && this.clear(), Array.prototype.push.apply(t, e));
  }
  getLastSyncPointBeforeDts(e) {
    if (this._list.length == 0)
      return null;
    let t = this._list, i = 0, s = t.length - 1, a = 0, d = 0, c = s;
    for (e < t[0].dts && (i = 0, d = c + 1); d <= c; )
      if (a = d + Math.floor((c - d) / 2), a === s || e >= t[a].dts && e < t[a + 1].dts) {
        i = a;
        break;
      } else t[a].dts < e ? d = a + 1 : c = a - 1;
    return this._list[i];
  }
}
class O {
  constructor(e, t, i) {
    this.TAG = "SeekingHandler", this._config = null, this._media_element = null, this._always_seek_keyframe = !1, this._on_unbuffered_seek = null, this._request_set_current_time = !1, this._seek_request_record_clocktime = null, this._idr_sample_list = new ye(), this.e = null, this._config = e, this._media_element = t, this._on_unbuffered_seek = i, this.e = {
      onMediaSeeking: this._onMediaSeeking.bind(this)
    };
    let s = y.chrome && (y.version.major < 50 || y.version.major === 50 && y.version.build < 2661);
    this._always_seek_keyframe = !!(s || y.msedge || y.msie), this._always_seek_keyframe && (this._config.accurateSeek = !1), this._media_element.addEventListener("seeking", this.e.onMediaSeeking);
  }
  destroy() {
    this._idr_sample_list.clear(), this._idr_sample_list = null, this._media_element.removeEventListener("seeking", this.e.onMediaSeeking), this._media_element = null, this._on_unbuffered_seek = null;
  }
  seek(e) {
    const t = this._isPositionBuffered(e);
    let i = !1;
    if (e < 1 && this._media_element.buffered.length > 0) {
      const s = this._media_element.buffered.start(0);
      (s < 1 && e < s || y.safari) && (i = !0, e = y.safari ? 0.1 : s);
    }
    if (i)
      this.directSeek(e);
    else if (t)
      if (!this._always_seek_keyframe)
        this.directSeek(e);
      else {
        const s = this._getNearestKeyframe(Math.floor(e * 1e3));
        s != null && (e = s.dts / 1e3), this.directSeek(e);
      }
    else
      this._idr_sample_list.clear(), this._on_unbuffered_seek(Math.floor(e * 1e3)), this._config.accurateSeek && this.directSeek(e);
  }
  directSeek(e) {
    this._request_set_current_time = !0, this._media_element.currentTime = e;
  }
  appendSyncPoints(e) {
    this._idr_sample_list.appendArray(e);
  }
  // Handle seeking request from browser's progress bar or HTMLMediaElement.currentTime setter
  _onMediaSeeking(e) {
    if (this._request_set_current_time) {
      this._request_set_current_time = !1;
      return;
    }
    let t = this._media_element.currentTime;
    const i = this._media_element.buffered;
    if (t < 1 && i.length > 0) {
      let s = i.start(0);
      if (s < 1 && t < s || y.safari) {
        let a = y.safari ? 0.1 : s;
        this.directSeek(a);
        return;
      }
    }
    if (this._isPositionBuffered(t)) {
      if (this._always_seek_keyframe) {
        const s = this._getNearestKeyframe(Math.floor(t * 1e3));
        s != null && (t = s.dts / 1e3, this.directSeek(t));
      }
      return;
    }
    this._seek_request_record_clocktime = O._getClockTime(), window.setTimeout(this._pollAndApplyUnbufferedSeek.bind(this), 50);
  }
  _pollAndApplyUnbufferedSeek() {
    if (this._seek_request_record_clocktime == null)
      return;
    if (this._seek_request_record_clocktime <= O._getClockTime() - 100) {
      const t = this._media_element.currentTime;
      this._seek_request_record_clocktime = null, this._isPositionBuffered(t) || (this._idr_sample_list.clear(), this._on_unbuffered_seek(Math.floor(t * 1e3)), this._config.accurateSeek && this.directSeek(t));
    } else
      window.setTimeout(this._pollAndApplyUnbufferedSeek.bind(this), 50);
  }
  _isPositionBuffered(e) {
    const t = this._media_element.buffered;
    for (let i = 0; i < t.length; i++) {
      const s = t.start(i), a = t.end(i);
      if (e >= s && e < a)
        return !0;
    }
    return !1;
  }
  _getNearestKeyframe(e) {
    return this._idr_sample_list.getLastSyncPointBeforeDts(e);
  }
  static _getClockTime() {
    return self.performance && self.performance.now ? self.performance.now() : Date.now();
  }
}
class Ee {
  constructor(e, t, i, s) {
    this.TAG = "LoadingController", this._config = null, this._media_element = null, this._on_pause_transmuxer = null, this._on_resume_transmuxer = null, this._paused = !1, this.e = null, this._config = e, this._media_element = t, this._on_pause_transmuxer = i, this._on_resume_transmuxer = s, this.e = {
      onMediaTimeUpdate: this._onMediaTimeUpdate.bind(this)
    };
  }
  destroy() {
    this._media_element.removeEventListener(
      "timeupdate",
      this.e.onMediaTimeUpdate
    ), this.e = null, this._media_element = null, this._config = null, this._on_pause_transmuxer = null, this._on_resume_transmuxer = null;
  }
  // buffered_position: in seconds
  notifyBufferedPositionChanged(e) {
    this._config.isLive || !this._config.lazyLoad || (e == null ? this._suspendTransmuxerIfNeeded() : this._suspendTransmuxerIfBufferedPositionExceeded(e));
  }
  _onMediaTimeUpdate(e) {
    this._paused && this._resumeTransmuxerIfNeeded();
  }
  _suspendTransmuxerIfNeeded() {
    const e = this._media_element.buffered, t = this._media_element.currentTime;
    let i = 0;
    for (let s = 0; s < e.length; s++) {
      const a = e.start(s), d = e.end(s);
      if (a <= t && t < d) {
        i = d;
        break;
      }
    }
    i > 0 && this._suspendTransmuxerIfBufferedPositionExceeded(i);
  }
  _suspendTransmuxerIfBufferedPositionExceeded(e) {
    const t = this._media_element.currentTime;
    e >= t + this._config.lazyLoadMaxDuration && !this._paused && (n.v(
      this.TAG,
      "Maximum buffering duration exceeded, suspend transmuxing task"
    ), this.suspendTransmuxer(), this._media_element.addEventListener(
      "timeupdate",
      this.e.onMediaTimeUpdate
    ));
  }
  suspendTransmuxer() {
    this._paused = !0, this._on_pause_transmuxer();
  }
  _resumeTransmuxerIfNeeded() {
    const e = this._media_element.buffered, t = this._media_element.currentTime, i = this._config.lazyLoadRecoverDuration;
    let s = !1;
    for (let a = 0; a < e.length; a++) {
      const d = e.start(a), c = e.end(a);
      if (t >= d && t < c) {
        t >= c - i && (s = !0);
        break;
      }
    }
    s && (n.v(this.TAG, "Continue loading from paused position"), this.resumeTransmuxer(), this._media_element.removeEventListener(
      "timeupdate",
      this.e.onMediaTimeUpdate
    ));
  }
  resumeTransmuxer() {
    this._paused = !1, this._on_resume_transmuxer();
  }
}
class Se {
  constructor(e, t) {
    this.TAG = "StartupStallJumper", this._media_element = null, this._on_direct_seek = null, this._canplay_received = !1, this.e = null, this._media_element = e, this._on_direct_seek = t, this.e = {
      onMediaCanPlay: this._onMediaCanPlay.bind(this),
      onMediaStalled: this._onMediaStalled.bind(this),
      onMediaProgress: this._onMediaProgress.bind(this)
    }, this._media_element.addEventListener("canplay", this.e.onMediaCanPlay), this._media_element.addEventListener("stalled", this.e.onMediaStalled), this._media_element.addEventListener("progress", this.e.onMediaProgress);
  }
  destroy() {
    this._media_element.removeEventListener("canplay", this.e.onMediaCanPlay), this._media_element.removeEventListener("stalled", this.e.onMediaStalled), this._media_element.removeEventListener("progress", this.e.onMediaProgress), this._media_element = null, this._on_direct_seek = null;
  }
  _onMediaCanPlay(e) {
    this._canplay_received = !0, this._media_element.removeEventListener("canplay", this.e.onMediaCanPlay);
  }
  _onMediaStalled(e) {
    this._detectAndFixStuckPlayback(!0);
  }
  _onMediaProgress(e) {
    this._detectAndFixStuckPlayback();
  }
  _detectAndFixStuckPlayback(e) {
    const t = this._media_element, i = t.buffered;
    e || !this._canplay_received || t.readyState < 2 ? i.length > 0 && t.currentTime < i.start(0) && (n.w(
      this.TAG,
      `Playback seems stuck at ${t.currentTime}, seek to ${i.start(0)}`
    ), this._on_direct_seek(i.start(0)), this._media_element.removeEventListener(
      "progress",
      this.e.onMediaProgress
    )) : this._media_element.removeEventListener(
      "progress",
      this.e.onMediaProgress
    );
  }
}
class Ae {
  constructor(e, t, i) {
    this._config = null, this._media_element = null, this._on_direct_seek = null, this._config = e, this._media_element = t, this._on_direct_seek = i;
  }
  destroy() {
    this._on_direct_seek = null, this._media_element = null, this._config = null;
  }
  notifyBufferedRangeUpdate() {
    this._chaseLiveLatency();
  }
  _chaseLiveLatency() {
    const e = this._media_element.buffered, t = this._media_element.currentTime, i = this._media_element.paused;
    if (!this._config.isLive || !this._config.liveBufferLatencyChasing || e.length == 0 || !this._config.liveBufferLatencyChasingOnPaused && i)
      return;
    const s = e.end(e.length - 1);
    if (s > this._config.liveBufferLatencyMaxLatency && s - t > this._config.liveBufferLatencyMaxLatency) {
      let a = s - this._config.liveBufferLatencyMinRemain;
      this._on_direct_seek(a);
    }
  }
}
class be {
  constructor(e, t) {
    this._config = null, this._media_element = null, this.e = null, this._config = e, this._media_element = t, this.e = {
      onMediaTimeUpdate: this._onMediaTimeUpdate.bind(this)
    }, this._media_element.addEventListener(
      "timeupdate",
      this.e.onMediaTimeUpdate
    );
  }
  destroy() {
    this._media_element.removeEventListener(
      "timeupdate",
      this.e.onMediaTimeUpdate
    ), this._media_element = null, this._config = null;
  }
  _onMediaTimeUpdate(e) {
    if (!this._config.isLive || !this._config.liveSync)
      return;
    const t = this._getCurrentLatency();
    if (t > this._config.liveSyncMaxLatency) {
      const i = Math.min(
        2,
        Math.max(1, this._config.liveSyncPlaybackRate)
      );
      this._media_element.playbackRate = i;
    } else t > this._config.liveSyncTargetLatency || this._media_element.playbackRate !== 1 && this._media_element.playbackRate !== 0 && (this._media_element.playbackRate = 1);
  }
  _getCurrentLatency() {
    if (!this._media_element)
      return 0;
    const e = this._media_element.buffered, t = this._media_element.currentTime;
    return e.length == 0 ? 0 : e.end(e.length - 1) - t;
  }
}
class Y {
  constructor(e, t) {
    this.TAG = "PlayerEngineMainThread", this._emitter = new M(), this._media_element = null, this._mse_controller = null, this._transmuxer = null, this._pending_seek_time = null, this._seeking_handler = null, this._loading_controller = null, this._startup_stall_jumper = null, this._live_latency_chaser = null, this._live_latency_synchronizer = null, this._mse_source_opened = !1, this._has_pending_load = !1, this._loaded_metadata_received = !1, this._media_info = null, this._statistics_info = null, this.e = null, this._media_data_source = e, this._config = U(), typeof t == "object" && Object.assign(this._config, t), e.isLive === !0 && (this._config.isLive = !0), this.e = {
      onMediaLoadedMetadata: this._onMediaLoadedMetadata.bind(this)
    };
  }
  destroy() {
    this._emitter.emit(g.DESTROYING), this._transmuxer && this.unload(), this._media_element && this.detachMediaElement(), this.e = null, this._media_data_source = null, this._emitter.removeAllListeners(), this._emitter = null;
  }
  on(e, t) {
    this._emitter.addListener(e, t), e === g.MEDIA_INFO && this._media_info ? Promise.resolve().then(
      () => this._emitter.emit(g.MEDIA_INFO, this.mediaInfo)
    ) : e == g.STATISTICS_INFO && this._statistics_info && Promise.resolve().then(
      () => this._emitter.emit(g.STATISTICS_INFO, this.statisticsInfo)
    );
  }
  off(e, t) {
    this._emitter.removeListener(e, t);
  }
  attachMediaElement(e) {
    this._media_element = e, e.src = "", e.removeAttribute("src"), e.srcObject = null, e.load(), e.addEventListener(
      "loadedmetadata",
      this.e.onMediaLoadedMetadata
    ), this._mse_controller = new fe(this._config), this._mse_controller.on(
      L.UPDATE_END,
      this._onMSEUpdateEnd.bind(this)
    ), this._mse_controller.on(
      L.BUFFER_FULL,
      this._onMSEBufferFull.bind(this)
    ), this._mse_controller.on(
      L.SOURCE_OPEN,
      this._onMSESourceOpen.bind(this)
    ), this._mse_controller.on(L.ERROR, this._onMSEError.bind(this)), this._mse_controller.on(
      L.START_STREAMING,
      this._onMSEStartStreaming.bind(this)
    ), this._mse_controller.on(
      L.END_STREAMING,
      this._onMSEEndStreaming.bind(this)
    ), this._mse_controller.initialize({
      getCurrentTime: () => this._media_element.currentTime,
      getReadyState: () => this._media_element.readyState
    }), this._mse_controller.isManagedMediaSource() ? (e.disableRemotePlayback = !0, e.srcObject = this._mse_controller.getObject()) : e.src = this._mse_controller.getObjectURL();
  }
  detachMediaElement() {
    this._media_element && (this._mse_controller.shutdown(), this._media_element.removeEventListener(
      "loadedmetadata",
      this.e.onMediaLoadedMetadata
    ), this._media_element.src = "", this._media_element.removeAttribute("src"), this._media_element.srcObject = null, this._media_element.load(), this._media_element = null, this._mse_controller.revokeObjectURL()), this._mse_controller && (this._mse_controller.destroy(), this._mse_controller = null);
  }
  load() {
    if (!this._media_element)
      throw new w(
        "HTMLMediaElement must be attached before load()!"
      );
    if (this._transmuxer)
      throw new w(
        "load() has been called, please call unload() first!"
      );
    if (!this._has_pending_load) {
      if (this._config.deferLoadAfterSourceOpen && !this._mse_source_opened) {
        this._has_pending_load = !0;
        return;
      }
      this._transmuxer = new ge(this._media_data_source, this._config), this._transmuxer.on(
        _.INIT_SEGMENT,
        (e, t) => {
          this._mse_controller.appendInitSegment(t);
        }
      ), this._transmuxer.on(
        _.MEDIA_SEGMENT,
        (e, t) => {
          this._mse_controller.appendMediaSegment(t), !this._config.isLive && e === "video" && t.data && t.data.byteLength > 0 && "info" in t && this._seeking_handler.appendSyncPoints(t.info.syncPoints), this._loading_controller.notifyBufferedPositionChanged(
            t.info.endDts / 1e3
          );
        }
      ), this._transmuxer.on(_.LOADING_COMPLETE, () => {
        this._mse_controller.endOfStream(), this._emitter.emit(g.LOADING_COMPLETE);
      }), this._transmuxer.on(_.RECOVERED_EARLY_EOF, () => {
        this._emitter.emit(g.RECOVERED_EARLY_EOF);
      }), this._transmuxer.on(
        _.IO_ERROR,
        (e, t) => {
          this._emitter.emit(
            g.ERROR,
            x.NETWORK_ERROR,
            e,
            t
          );
        }
      ), this._transmuxer.on(
        _.DEMUX_ERROR,
        (e, t) => {
          this._emitter.emit(
            g.ERROR,
            x.MEDIA_ERROR,
            e,
            t
          );
        }
      ), this._transmuxer.on(
        _.MEDIA_INFO,
        (e) => {
          this._media_info = e, this._emitter.emit(
            g.MEDIA_INFO,
            Object.assign({}, e)
          );
        }
      ), this._transmuxer.on(_.STATISTICS_INFO, (e) => {
        this._statistics_info = this._fillStatisticsInfo(e), this._emitter.emit(
          g.STATISTICS_INFO,
          Object.assign({}, e)
        );
      }), this._transmuxer.on(
        _.RECOMMEND_SEEKPOINT,
        (e) => {
          this._media_element && !this._config.accurateSeek && this._seeking_handler.directSeek(e / 1e3);
        }
      ), this._transmuxer.on(_.METADATA_ARRIVED, (e) => {
        this._emitter.emit(g.METADATA_ARRIVED, e);
      }), this._transmuxer.on(_.SCRIPTDATA_ARRIVED, (e) => {
        this._emitter.emit(g.SCRIPTDATA_ARRIVED, e);
      }), this._transmuxer.on(
        _.TIMED_ID3_METADATA_ARRIVED,
        (e) => {
          this._emitter.emit(
            g.TIMED_ID3_METADATA_ARRIVED,
            e
          );
        }
      ), this._transmuxer.on(
        _.PGS_SUBTITLE_ARRIVED,
        (e) => {
          this._emitter.emit(g.PGS_SUBTITLE_ARRIVED, e);
        }
      ), this._transmuxer.on(
        _.SYNCHRONOUS_KLV_METADATA_ARRIVED,
        (e) => {
          this._emitter.emit(
            g.SYNCHRONOUS_KLV_METADATA_ARRIVED,
            e
          );
        }
      ), this._transmuxer.on(
        _.ASYNCHRONOUS_KLV_METADATA_ARRIVED,
        (e) => {
          this._emitter.emit(
            g.ASYNCHRONOUS_KLV_METADATA_ARRIVED,
            e
          );
        }
      ), this._transmuxer.on(
        _.SMPTE2038_METADATA_ARRIVED,
        (e) => {
          this._emitter.emit(
            g.SMPTE2038_METADATA_ARRIVED,
            e
          );
        }
      ), this._transmuxer.on(
        _.SCTE35_METADATA_ARRIVED,
        (e) => {
          this._emitter.emit(
            g.SCTE35_METADATA_ARRIVED,
            e
          );
        }
      ), this._transmuxer.on(
        _.PES_PRIVATE_DATA_DESCRIPTOR,
        (e) => {
          this._emitter.emit(
            g.PES_PRIVATE_DATA_DESCRIPTOR,
            e
          );
        }
      ), this._transmuxer.on(
        _.PES_PRIVATE_DATA_ARRIVED,
        (e) => {
          this._emitter.emit(g.PES_PRIVATE_DATA_ARRIVED, e);
        }
      ), this._seeking_handler = new O(
        this._config,
        this._media_element,
        this._onRequiredUnbufferedSeek.bind(this)
      ), this._loading_controller = new Ee(
        this._config,
        this._media_element,
        this._onRequestPauseTransmuxer.bind(this),
        this._onRequestResumeTransmuxer.bind(this)
      ), this._startup_stall_jumper = new Se(
        this._media_element,
        this._onRequestDirectSeek.bind(this)
      ), this._config.isLive && this._config.liveBufferLatencyChasing && (this._live_latency_chaser = new Ae(
        this._config,
        this._media_element,
        this._onRequestDirectSeek.bind(this)
      )), this._config.isLive && this._config.liveSync && (this._live_latency_synchronizer = new be(
        this._config,
        this._media_element
      )), this._media_element.readyState > 0 && this._seeking_handler.directSeek(0), this._transmuxer.open();
    }
  }
  unload() {
    this._media_element?.pause(), this._live_latency_synchronizer?.destroy(), this._live_latency_synchronizer = null, this._live_latency_chaser?.destroy(), this._live_latency_chaser = null, this._startup_stall_jumper?.destroy(), this._startup_stall_jumper = null, this._loading_controller?.destroy(), this._loading_controller = null, this._seeking_handler?.destroy(), this._seeking_handler = null, this._mse_controller?.flush(), this._transmuxer?.close(), this._transmuxer?.destroy(), this._transmuxer = null;
  }
  play() {
    return this._media_element.play();
  }
  pause() {
    this._media_element.pause();
  }
  seek(e) {
    this._media_element && this._seeking_handler ? this._seeking_handler.seek(e) : this._pending_seek_time = e;
  }
  get mediaInfo() {
    return Object.assign({}, this._media_info);
  }
  get statisticsInfo() {
    return Object.assign({}, this._statistics_info);
  }
  _onMSESourceOpen() {
    this._mse_source_opened = !0, this._has_pending_load && (this._has_pending_load = !1, this.load());
  }
  _onMSEUpdateEnd() {
    this._config.isLive && this._config.liveBufferLatencyChasing && this._live_latency_chaser && this._live_latency_chaser.notifyBufferedRangeUpdate(), this._loading_controller.notifyBufferedPositionChanged();
  }
  _onMSEBufferFull() {
    n.v(this.TAG, "MSE SourceBuffer is full, suspend transmuxing task"), this._loading_controller.suspendTransmuxer();
  }
  _onMSEError(e) {
    this._emitter.emit(
      g.ERROR,
      x.MEDIA_ERROR,
      Z.MEDIA_MSE_ERROR,
      e
    );
  }
  _onMSEStartStreaming() {
    this._loaded_metadata_received && (this._config.isLive || (n.v(
      this.TAG,
      "Resume transmuxing task due to ManagedMediaSource onStartStreaming"
    ), this._loading_controller.resumeTransmuxer()));
  }
  _onMSEEndStreaming() {
    this._config.isLive || (n.v(
      this.TAG,
      "Suspend transmuxing task due to ManagedMediaSource onEndStreaming"
    ), this._loading_controller.suspendTransmuxer());
  }
  _onMediaLoadedMetadata(e) {
    this._loaded_metadata_received = !0, this._pending_seek_time != null && (this._seeking_handler.seek(this._pending_seek_time), this._pending_seek_time = null);
  }
  _onRequestDirectSeek(e) {
    this._seeking_handler.directSeek(e);
  }
  _onRequiredUnbufferedSeek(e) {
    this._mse_controller.flush(), this._transmuxer.seek(e);
  }
  _onRequestPauseTransmuxer() {
    this._transmuxer.pause();
  }
  _onRequestResumeTransmuxer() {
    this._transmuxer.resume();
  }
  _fillStatisticsInfo(e) {
    if (e.playerType = "MSEPlayer", !(this._media_element instanceof HTMLVideoElement))
      return e;
    let t = !0, i = 0, s = 0;
    if (this._media_element.getVideoPlaybackQuality) {
      const a = this._media_element.getVideoPlaybackQuality();
      i = a.totalVideoFrames, s = a.droppedVideoFrames;
    } else this._media_element.webkitDecodedFrameCount != null ? (i = this._media_element.webkitDecodedFrameCount, s = this._media_element.webkitDroppedFrameCount) : t = !1;
    return t && (e.decodedFrames = i, e.droppedFrames = s), e;
  }
}
class J {
  constructor(e, t) {
    this.TAG = "MSEPlayer", this._type = "MSEPlayer", this._media_element = null, this._player_engine = null;
    const i = e.type.toLowerCase();
    if (i !== "mse" && i !== "mpegts" && i !== "m2ts" && i !== "flv")
      throw new D(
        "MSEPlayer requires an mpegts/m2ts/flv MediaDataSource input!"
      );
    if (t && t.enableWorkerForMSE)
      try {
        throw new Error("PlayerEngineDedicatedThread is explicitly disabled");
      } catch {
        n.e(
          this.TAG,
          "Error while initializing PlayerEngineDedicatedThread, fallback to PlayerEngineMainThread"
        ), this._player_engine = new Y(
          e,
          t
        );
      }
    else
      this._player_engine = new Y(e, t);
  }
  destroy() {
    this._player_engine.destroy(), this._player_engine = null, this._media_element = null;
  }
  on(e, t) {
    this._player_engine.on(e, t);
  }
  off(e, t) {
    this._player_engine.off(e, t);
  }
  attachMediaElement(e) {
    this._media_element = e, this._player_engine.attachMediaElement(e);
  }
  detachMediaElement() {
    this._media_element = null, this._player_engine.detachMediaElement();
  }
  load() {
    this._player_engine.load();
  }
  unload() {
    this._player_engine.unload();
  }
  play() {
    return this._player_engine.play();
  }
  pause() {
    this._player_engine.pause();
  }
  get type() {
    return this._type;
  }
  get buffered() {
    return this._media_element.buffered;
  }
  get duration() {
    return this._media_element.duration;
  }
  get volume() {
    return this._media_element.volume;
  }
  set volume(e) {
    this._media_element.volume = e;
  }
  get muted() {
    return this._media_element.muted;
  }
  set muted(e) {
    this._media_element.muted = e;
  }
  get currentTime() {
    return this._media_element ? this._media_element.currentTime : 0;
  }
  set currentTime(e) {
    this._player_engine.seek(e);
  }
  get mediaInfo() {
    return this._player_engine.mediaInfo;
  }
  get statisticsInfo() {
    return this._player_engine.statisticsInfo;
  }
}
function ve(r, e) {
  let t = r;
  if (t == null || typeof t != "object")
    throw new D(
      "MediaDataSource must be an javascript object!"
    );
  if (!t.hasOwnProperty("type"))
    throw new D(
      "MediaDataSource must has type field to indicate video file type!"
    );
  switch (t.type) {
    case "mse":
    case "mpegts":
    case "m2ts":
      return new J(t, e);
    default:
      throw new Error("NativePlayer is explicitly disabled");
  }
}
function Le() {
  return v.supportMSEH264Playback();
}
function Re() {
  return v.getFeatureList();
}
let R = {};
R.createPlayer = ve;
R.isSupported = Le;
R.getFeatureList = Re;
R.BaseLoader = X;
R.LoaderStatus = A;
R.LoaderErrors = b;
R.Events = g;
R.ErrorTypes = x;
R.ErrorDetails = Z;
R.MSEPlayer = J;
R.LoggingControl = E;
Object.defineProperty(R, "version", {
  enumerable: !0,
  get: function() {
    return "2.0.0";
  }
});
export {
  R as default
};
