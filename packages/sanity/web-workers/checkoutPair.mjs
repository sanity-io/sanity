var Y1 = Object.defineProperty;
var V1 = (r, e, n) => e in r ? Y1(r, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[e] = n;
var W = (r, e, n) => (V1(r, typeof e != "symbol" ? e + "" : e, n), n);
const Nl = typeof navigator > "u" ? !1 : navigator.product === "ReactNative", ql = { timeout: Nl ? 6e4 : 12e4 }, Z1 = function(r) {
  const e = {
    ...ql,
    ...typeof r == "string" ? { url: r } : r
  };
  if (e.timeout = Wl(e.timeout), e.query) {
    const { url: n, searchParams: s } = Q1(e.url);
    for (const [u, a] of Object.entries(e.query)) {
      if (a !== void 0)
        if (Array.isArray(a))
          for (const l of a)
            s.append(u, l);
        else
          s.append(u, a);
      const f = s.toString();
      f && (e.url = `${n}?${f}`);
    }
  }
  return e.method = e.body && !e.method ? "POST" : (e.method || "GET").toUpperCase(), e;
};
function Q1(r) {
  const e = r.indexOf("?");
  if (e === -1)
    return { url: r, searchParams: new URLSearchParams() };
  const n = r.slice(0, e), s = r.slice(e + 1);
  if (!Nl)
    return { url: n, searchParams: new URLSearchParams(s) };
  if (typeof decodeURIComponent != "function")
    throw new Error(
      "Broken `URLSearchParams` implementation, and `decodeURIComponent` is not defined"
    );
  const u = new URLSearchParams();
  for (const a of s.split("&")) {
    const [f, l] = a.split("=");
    f && u.append(jf(f), jf(l || ""));
  }
  return { url: n, searchParams: u };
}
function jf(r) {
  return decodeURIComponent(r.replace(/\+/g, " "));
}
function Wl(r) {
  if (r === !1 || r === 0)
    return !1;
  if (r.connect || r.socket)
    return r;
  const e = Number(r);
  return isNaN(e) ? Wl(ql.timeout) : { connect: e, socket: e };
}
const tw = /^https?:\/\//i, ew = function(r) {
  if (!tw.test(r.url))
    throw new Error(`"${r.url}" is not a valid URL`);
};
function nw(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
const rw = (r) => function(e, n, ...s) {
  const u = e === "onError";
  let a = n;
  for (let f = 0; f < r[e].length; f++) {
    const l = r[e][f];
    if (a = l(a, ...s), u && !a)
      break;
  }
  return a;
};
function iw() {
  const r = /* @__PURE__ */ Object.create(null);
  let e = 0;
  function n(u) {
    const a = e++;
    return r[a] = u, function() {
      delete r[a];
    };
  }
  function s(u) {
    for (const a in r)
      r[a](u);
  }
  return {
    publish: s,
    subscribe: n
  };
}
const sw = [
  "request",
  "response",
  "progress",
  "error",
  "abort"
], zf = [
  "processOptions",
  "validateOptions",
  "interceptRequest",
  "finalizeOptions",
  "onRequest",
  "onResponse",
  "onError",
  "onReturn",
  "onHeaders"
];
function Bl(r, e) {
  const n = [], s = zf.reduce(
    (a, f) => (a[f] = a[f] || [], a),
    {
      processOptions: [Z1],
      validateOptions: [ew]
    }
  );
  function u(a) {
    const f = (I, O, R) => {
      let x = I, D = O;
      if (!x)
        try {
          D = d("onResponse", O, R);
        } catch (U) {
          D = null, x = U;
        }
      x = x && d("onError", x, R), x ? l.error.publish(x) : D && l.response.publish(D);
    }, l = sw.reduce((I, O) => (I[O] = iw(), I), {}), d = rw(s), y = d("processOptions", a);
    d("validateOptions", y);
    const p = { options: y, channels: l, applyMiddleware: d };
    let m;
    const b = l.request.subscribe((I) => {
      m = e(I, (O, R) => f(O, R, I));
    });
    l.abort.subscribe(() => {
      b(), m && m.abort();
    });
    const C = d("onReturn", l, p);
    return C === l && l.request.publish(p), C;
  }
  return u.use = function(a) {
    if (!a)
      throw new Error("Tried to add middleware that resolved to falsey value");
    if (typeof a == "function")
      throw new Error(
        "Tried to add middleware that was a function. It probably expects you to pass options to it."
      );
    if (a.onReturn && s.onReturn.length > 0)
      throw new Error(
        "Tried to add new middleware with `onReturn` handler, but another handler has already been registered for this event"
      );
    return zf.forEach((f) => {
      a[f] && s[f].push(a[f]);
    }), n.push(a), u;
  }, u.clone = () => Bl(n, e), r.forEach(u.use), u;
}
var Lu = function(r) {
  return r.replace(/^\s+|\s+$/g, "");
}, ow = function(r) {
  return Object.prototype.toString.call(r) === "[object Array]";
}, uw = function(r) {
  if (!r)
    return {};
  for (var e = {}, n = Lu(r).split(`
`), s = 0; s < n.length; s++) {
    var u = n[s], a = u.indexOf(":"), f = Lu(u.slice(0, a)).toLowerCase(), l = Lu(u.slice(a + 1));
    typeof e[f] > "u" ? e[f] = l : ow(e[f]) ? e[f].push(l) : e[f] = [e[f], l];
  }
  return e;
}, aw = /* @__PURE__ */ nw(uw), cw = Object.defineProperty, Hl = (r) => {
  throw TypeError(r);
}, fw = (r, e, n) => e in r ? cw(r, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[e] = n, Ke = (r, e, n) => fw(r, typeof e != "symbol" ? e + "" : e, n), Gl = (r, e, n) => e.has(r) || Hl("Cannot " + n), Ne = (r, e, n) => (Gl(r, e, "read from private field"), n ? n.call(r) : e.get(r)), ur = (r, e, n) => e.has(r) ? Hl("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(r) : e.set(r, n), Nn = (r, e, n, s) => (Gl(r, e, "write to private field"), e.set(r, n), n), Fs, Ms, Mr, Ds, qn, Us, ks;
class ju {
  constructor() {
    Ke(this, "onabort"), Ke(this, "onerror"), Ke(this, "onreadystatechange"), Ke(this, "ontimeout"), Ke(this, "readyState", 0), Ke(this, "response"), Ke(this, "responseText", ""), Ke(this, "responseType", ""), Ke(this, "status"), Ke(this, "statusText"), Ke(this, "withCredentials"), ur(this, Fs), ur(this, Ms), ur(this, Mr), ur(this, Ds, {}), ur(this, qn), ur(this, Us, {}), ur(this, ks);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- _async is only declared for typings compatibility
  open(e, n, s) {
    var u;
    Nn(this, Fs, e), Nn(this, Ms, n), Nn(this, Mr, ""), this.readyState = 1, (u = this.onreadystatechange) == null || u.call(this), Nn(this, qn, void 0);
  }
  abort() {
    Ne(this, qn) && Ne(this, qn).abort();
  }
  getAllResponseHeaders() {
    return Ne(this, Mr);
  }
  setRequestHeader(e, n) {
    Ne(this, Ds)[e] = n;
  }
  // Allow setting extra fetch init options, needed for runtimes such as Vercel Edge to set `cache` and other options in React Server Components
  setInit(e, n = !0) {
    Nn(this, Us, e), Nn(this, ks, n);
  }
  send(e) {
    const n = this.responseType !== "arraybuffer", s = {
      ...Ne(this, Us),
      method: Ne(this, Fs),
      headers: Ne(this, Ds),
      body: e
    };
    typeof AbortController == "function" && Ne(this, ks) && (Nn(this, qn, new AbortController()), typeof EventTarget < "u" && Ne(this, qn).signal instanceof EventTarget && (s.signal = Ne(this, qn).signal)), typeof document < "u" && (s.credentials = this.withCredentials ? "include" : "omit"), fetch(Ne(this, Ms), s).then((u) => {
      var a;
      return u.headers.forEach((f, l) => {
        Nn(this, Mr, Ne(this, Mr) + `${l}: ${f}\r
`);
      }), this.status = u.status, this.statusText = u.statusText, this.readyState = 3, (a = this.onreadystatechange) == null || a.call(this), n ? u.text() : u.arrayBuffer();
    }).then((u) => {
      var a;
      typeof u == "string" ? this.responseText = u : this.response = u, this.readyState = 4, (a = this.onreadystatechange) == null || a.call(this);
    }).catch((u) => {
      var a, f;
      if (u.name === "AbortError") {
        (a = this.onabort) == null || a.call(this);
        return;
      }
      (f = this.onerror) == null || f.call(this, u);
    });
  }
}
Fs = /* @__PURE__ */ new WeakMap(), Ms = /* @__PURE__ */ new WeakMap(), Mr = /* @__PURE__ */ new WeakMap(), Ds = /* @__PURE__ */ new WeakMap(), qn = /* @__PURE__ */ new WeakMap(), Us = /* @__PURE__ */ new WeakMap(), ks = /* @__PURE__ */ new WeakMap();
const zu = typeof XMLHttpRequest == "function" ? "xhr" : "fetch", lw = zu === "xhr" ? XMLHttpRequest : ju, hw = (r, e) => {
  var n;
  const s = r.options, u = r.applyMiddleware("finalizeOptions", s), a = {}, f = r.applyMiddleware("interceptRequest", void 0, {
    adapter: zu,
    context: r
  });
  if (f) {
    const M = setTimeout(e, 0, null, f);
    return { abort: () => clearTimeout(M) };
  }
  let l = new lw();
  l instanceof ju && typeof u.fetch == "object" && l.setInit(u.fetch, (n = u.useAbortSignal) != null ? n : !0);
  const d = u.headers, y = u.timeout;
  let p = !1, m = !1, b = !1;
  if (l.onerror = (M) => {
    l instanceof ju ? x(
      M instanceof Error ? M : new Error(`Request error while attempting to reach is ${u.url}`, { cause: M })
    ) : x(
      new Error(
        `Request error while attempting to reach is ${u.url}${M.lengthComputable ? `(${M.loaded} of ${M.total} bytes transferred)` : ""}`
      )
    );
  }, l.ontimeout = (M) => {
    x(
      new Error(
        `Request timeout while attempting to reach ${u.url}${M.lengthComputable ? `(${M.loaded} of ${M.total} bytes transferred)` : ""}`
      )
    );
  }, l.onabort = () => {
    R(!0), p = !0;
  }, l.onreadystatechange = () => {
    O(), !(p || l.readyState !== 4) && l.status !== 0 && U();
  }, l.open(
    u.method,
    u.url,
    !0
    // Always async
  ), l.withCredentials = !!u.withCredentials, d && l.setRequestHeader)
    for (const M in d)
      d.hasOwnProperty(M) && l.setRequestHeader(M, d[M]);
  return u.rawBody && (l.responseType = "arraybuffer"), r.applyMiddleware("onRequest", { options: u, adapter: zu, request: l, context: r }), l.send(u.body || null), y && (a.connect = setTimeout(() => I("ETIMEDOUT"), y.connect)), { abort: C };
  function C() {
    p = !0, l && l.abort();
  }
  function I(M) {
    b = !0, l.abort();
    const z = new Error(
      M === "ESOCKETTIMEDOUT" ? `Socket timed out on request to ${u.url}` : `Connection timed out on request to ${u.url}`
    );
    z.code = M, r.channels.error.publish(z);
  }
  function O() {
    y && (R(), a.socket = setTimeout(() => I("ESOCKETTIMEDOUT"), y.socket));
  }
  function R(M) {
    (M || p || l.readyState >= 2 && a.connect) && clearTimeout(a.connect), a.socket && clearTimeout(a.socket);
  }
  function x(M) {
    if (m)
      return;
    R(!0), m = !0, l = null;
    const z = M || new Error(`Network error while attempting to reach ${u.url}`);
    z.isNetworkError = !0, z.request = u, e(z);
  }
  function D() {
    return {
      body: l.response || (l.responseType === "" || l.responseType === "text" ? l.responseText : ""),
      url: u.url,
      method: u.method,
      headers: aw(l.getAllResponseHeaders()),
      statusCode: l.status,
      statusMessage: l.statusText
    };
  }
  function U() {
    if (!(p || m || b)) {
      if (l.status === 0) {
        x(new Error("Unknown XHR error"));
        return;
      }
      R(), m = !0, e(null, D());
    }
  }
}, dw = (r = [], e = hw) => Bl(r, e);
var Kf = { exports: {} }, $u, Jf;
function pw() {
  if (Jf)
    return $u;
  Jf = 1;
  var r = 1e3, e = r * 60, n = e * 60, s = n * 24, u = s * 7, a = s * 365.25;
  $u = function(p, m) {
    m = m || {};
    var b = typeof p;
    if (b === "string" && p.length > 0)
      return f(p);
    if (b === "number" && isFinite(p))
      return m.long ? d(p) : l(p);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(p)
    );
  };
  function f(p) {
    if (p = String(p), !(p.length > 100)) {
      var m = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        p
      );
      if (m) {
        var b = parseFloat(m[1]), C = (m[2] || "ms").toLowerCase();
        switch (C) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return b * a;
          case "weeks":
          case "week":
          case "w":
            return b * u;
          case "days":
          case "day":
          case "d":
            return b * s;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return b * n;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return b * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return b * r;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return b;
          default:
            return;
        }
      }
    }
  }
  function l(p) {
    var m = Math.abs(p);
    return m >= s ? Math.round(p / s) + "d" : m >= n ? Math.round(p / n) + "h" : m >= e ? Math.round(p / e) + "m" : m >= r ? Math.round(p / r) + "s" : p + "ms";
  }
  function d(p) {
    var m = Math.abs(p);
    return m >= s ? y(p, m, s, "day") : m >= n ? y(p, m, n, "hour") : m >= e ? y(p, m, e, "minute") : m >= r ? y(p, m, r, "second") : p + " ms";
  }
  function y(p, m, b, C) {
    var I = m >= b * 1.5;
    return Math.round(p / b) + " " + C + (I ? "s" : "");
  }
  return $u;
}
function gw(r) {
  n.debug = n, n.default = n, n.coerce = d, n.disable = a, n.enable = u, n.enabled = f, n.humanize = pw(), n.destroy = y, Object.keys(r).forEach((p) => {
    n[p] = r[p];
  }), n.names = [], n.skips = [], n.formatters = {};
  function e(p) {
    let m = 0;
    for (let b = 0; b < p.length; b++)
      m = (m << 5) - m + p.charCodeAt(b), m |= 0;
    return n.colors[Math.abs(m) % n.colors.length];
  }
  n.selectColor = e;
  function n(p) {
    let m, b = null, C, I;
    function O(...R) {
      if (!O.enabled)
        return;
      const x = O, D = Number(/* @__PURE__ */ new Date()), U = D - (m || D);
      x.diff = U, x.prev = m, x.curr = D, m = D, R[0] = n.coerce(R[0]), typeof R[0] != "string" && R.unshift("%O");
      let M = 0;
      R[0] = R[0].replace(/%([a-zA-Z%])/g, (z, ht) => {
        if (z === "%%")
          return "%";
        M++;
        const _t = n.formatters[ht];
        if (typeof _t == "function") {
          const xt = R[M];
          z = _t.call(x, xt), R.splice(M, 1), M--;
        }
        return z;
      }), n.formatArgs.call(x, R), (x.log || n.log).apply(x, R);
    }
    return O.namespace = p, O.useColors = n.useColors(), O.color = n.selectColor(p), O.extend = s, O.destroy = n.destroy, Object.defineProperty(O, "enabled", {
      enumerable: !0,
      configurable: !1,
      get: () => b !== null ? b : (C !== n.namespaces && (C = n.namespaces, I = n.enabled(p)), I),
      set: (R) => {
        b = R;
      }
    }), typeof n.init == "function" && n.init(O), O;
  }
  function s(p, m) {
    const b = n(this.namespace + (typeof m > "u" ? ":" : m) + p);
    return b.log = this.log, b;
  }
  function u(p) {
    n.save(p), n.namespaces = p, n.names = [], n.skips = [];
    let m;
    const b = (typeof p == "string" ? p : "").split(/[\s,]+/), C = b.length;
    for (m = 0; m < C; m++)
      b[m] && (p = b[m].replace(/\*/g, ".*?"), p[0] === "-" ? n.skips.push(new RegExp("^" + p.slice(1) + "$")) : n.names.push(new RegExp("^" + p + "$")));
  }
  function a() {
    const p = [
      ...n.names.map(l),
      ...n.skips.map(l).map((m) => "-" + m)
    ].join(",");
    return n.enable(""), p;
  }
  function f(p) {
    if (p[p.length - 1] === "*")
      return !0;
    let m, b;
    for (m = 0, b = n.skips.length; m < b; m++)
      if (n.skips[m].test(p))
        return !1;
    for (m = 0, b = n.names.length; m < b; m++)
      if (n.names[m].test(p))
        return !0;
    return !1;
  }
  function l(p) {
    return p.toString().substring(2, p.toString().length - 2).replace(/\.\*\?$/, "*");
  }
  function d(p) {
    return p instanceof Error ? p.stack || p.message : p;
  }
  function y() {
    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  }
  return n.enable(n.load()), n;
}
var vw = gw;
(function(r, e) {
  e.formatArgs = s, e.save = u, e.load = a, e.useColors = n, e.storage = f(), e.destroy = /* @__PURE__ */ (() => {
    let d = !1;
    return () => {
      d || (d = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
    };
  })(), e.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function n() {
    return typeof window < "u", typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/) ? !1 : typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
    typeof window < "u" && console && (console.firebug || console.exception && console.table) || // Is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
    typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function s(d) {
    if (d[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + d[0] + (this.useColors ? "%c " : " ") + "+" + r.exports.humanize(this.diff), !this.useColors)
      return;
    const y = "color: " + this.color;
    d.splice(1, 0, y, "color: inherit");
    let p = 0, m = 0;
    d[0].replace(/%[a-zA-Z%]/g, (b) => {
      b !== "%%" && (p++, b === "%c" && (m = p));
    }), d.splice(m, 0, y);
  }
  e.log = console.debug || console.log || (() => {
  });
  function u(d) {
    try {
      d ? e.storage.setItem("debug", d) : e.storage.removeItem("debug");
    } catch {
    }
  }
  function a() {
    let d;
    try {
      d = e.storage.getItem("debug");
    } catch {
    }
    return !d && typeof process < "u" && "env" in process && (d = {}.DEBUG), d;
  }
  function f() {
    try {
      return localStorage;
    } catch {
    }
  }
  r.exports = vw(e);
  const { formatters: l } = r.exports;
  l.j = function(d) {
    try {
      return JSON.stringify(d);
    } catch (y) {
      return "[UnexpectedJSONParseError]: " + y.message;
    }
  };
})(Kf, Kf.exports);
const mw = typeof Buffer > "u" ? () => !1 : (r) => Buffer.isBuffer(r);
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
function Xf(r) {
  return Object.prototype.toString.call(r) === "[object Object]";
}
function yw(r) {
  if (Xf(r) === !1)
    return !1;
  const e = r.constructor;
  if (e === void 0)
    return !0;
  const n = e.prototype;
  return !(Xf(n) === !1 || // eslint-disable-next-line no-prototype-builtins
  n.hasOwnProperty("isPrototypeOf") === !1);
}
const ww = ["boolean", "string", "number"];
function bw() {
  return {
    processOptions: (r) => {
      const e = r.body;
      return !e || !(typeof e.pipe != "function" && !mw(e) && (ww.indexOf(typeof e) !== -1 || Array.isArray(e) || yw(e))) ? r : Object.assign({}, r, {
        body: JSON.stringify(r.body),
        headers: Object.assign({}, r.headers, {
          "Content-Type": "application/json"
        })
      });
    }
  };
}
function _w(r) {
  return {
    onResponse: (n) => {
      const s = n.headers["content-type"] || "", u = r && r.force || s.indexOf("application/json") !== -1;
      return !n.body || !s || !u ? n : Object.assign({}, n, { body: e(n.body) });
    },
    processOptions: (n) => Object.assign({}, n, {
      headers: Object.assign({ Accept: "application/json" }, n.headers)
    })
  };
  function e(n) {
    try {
      return JSON.parse(n);
    } catch (s) {
      throw s.message = `Failed to parsed response body as JSON: ${s.message}`, s;
    }
  }
}
let vi = {};
typeof globalThis < "u" ? vi = globalThis : typeof window < "u" ? vi = window : typeof global < "u" ? vi = global : typeof self < "u" && (vi = self);
var Cw = vi;
function Ew(r = {}) {
  const e = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @TODO consider dropping checking for a global Observable since it's not on a standards track
    r.implementation || Cw.Observable
  );
  if (!e)
    throw new Error(
      "`Observable` is not available in global scope, and no implementation was passed"
    );
  return {
    onReturn: (n, s) => new e((u) => (n.error.subscribe((a) => u.error(a)), n.progress.subscribe(
      (a) => u.next(Object.assign({ type: "progress" }, a))
    ), n.response.subscribe((a) => {
      u.next(Object.assign({ type: "response" }, a)), u.complete();
    }), n.request.publish(s), () => n.abort.publish()))
  };
}
function Aw() {
  return {
    onRequest: (r) => {
      if (r.adapter !== "xhr")
        return;
      const e = r.request, n = r.context;
      "upload" in e && "onprogress" in e.upload && (e.upload.onprogress = s("upload")), "onprogress" in e && (e.onprogress = s("download"));
      function s(u) {
        return (a) => {
          const f = a.lengthComputable ? a.loaded / a.total * 100 : -1;
          n.channels.progress.publish({
            stage: u,
            percent: f,
            total: a.total,
            loaded: a.loaded,
            lengthComputable: a.lengthComputable
          });
        };
      }
    }
  };
}
var xw = Object.defineProperty, Sw = (r, e, n) => e in r ? xw(r, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[e] = n, Si = (r, e, n) => Sw(r, typeof e != "symbol" ? e + "" : e, n);
class Rw {
  constructor(e) {
    Si(this, "__CANCEL__", !0), Si(this, "message"), this.message = e;
  }
  toString() {
    return `Cancel${this.message ? `: ${this.message}` : ""}`;
  }
}
const Yf = class {
  constructor(r) {
    if (Si(this, "promise"), Si(this, "reason"), typeof r != "function")
      throw new TypeError("executor must be a function.");
    let e = null;
    this.promise = new Promise((n) => {
      e = n;
    }), r((n) => {
      this.reason || (this.reason = new Rw(n), e(this.reason));
    });
  }
};
Si(Yf, "source", () => {
  let r;
  return {
    token: new Yf((e) => {
      r = e;
    }),
    cancel: r
  };
});
var jl = (r, e, n) => n.method !== "GET" && n.method !== "HEAD" ? !1 : r.isNetworkError || !1;
const Iw = (r) => r !== null && typeof r == "object" && typeof r.pipe == "function";
var Ow = (r) => {
  const e = r.maxRetries || 5, n = r.retryDelay || Tw, s = r.shouldRetry;
  return {
    onError: (u, a) => {
      const f = a.options, l = f.maxRetries || e, d = f.retryDelay || n, y = f.shouldRetry || s, p = f.attemptNumber || 0;
      if (Iw(f.body) || !y(u, p, f) || p >= l)
        return u;
      const m = Object.assign({}, a, {
        options: Object.assign({}, f, { attemptNumber: p + 1 })
      });
      return setTimeout(() => a.channels.request.publish(m), d(p)), null;
    }
  };
};
function Tw(r) {
  return 100 * Math.pow(2, r) + Math.random() * 100;
}
const oa = (r = {}) => Ow({ shouldRetry: jl, ...r });
oa.shouldRetry = jl;
var Ku = function(r, e) {
  return Ku = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(n, s) {
    n.__proto__ = s;
  } || function(n, s) {
    for (var u in s)
      Object.prototype.hasOwnProperty.call(s, u) && (n[u] = s[u]);
  }, Ku(r, e);
};
function Jn(r, e) {
  if (typeof e != "function" && e !== null)
    throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
  Ku(r, e);
  function n() {
    this.constructor = r;
  }
  r.prototype = e === null ? Object.create(e) : (n.prototype = e.prototype, new n());
}
function Lw(r, e, n, s) {
  function u(a) {
    return a instanceof n ? a : new n(function(f) {
      f(a);
    });
  }
  return new (n || (n = Promise))(function(a, f) {
    function l(p) {
      try {
        y(s.next(p));
      } catch (m) {
        f(m);
      }
    }
    function d(p) {
      try {
        y(s.throw(p));
      } catch (m) {
        f(m);
      }
    }
    function y(p) {
      p.done ? a(p.value) : u(p.value).then(l, d);
    }
    y((s = s.apply(r, e || [])).next());
  });
}
function zl(r, e) {
  var n = { label: 0, sent: function() {
    if (a[0] & 1)
      throw a[1];
    return a[1];
  }, trys: [], ops: [] }, s, u, a, f;
  return f = { next: l(0), throw: l(1), return: l(2) }, typeof Symbol == "function" && (f[Symbol.iterator] = function() {
    return this;
  }), f;
  function l(y) {
    return function(p) {
      return d([y, p]);
    };
  }
  function d(y) {
    if (s)
      throw new TypeError("Generator is already executing.");
    for (; f && (f = 0, y[0] && (n = 0)), n; )
      try {
        if (s = 1, u && (a = y[0] & 2 ? u.return : y[0] ? u.throw || ((a = u.return) && a.call(u), 0) : u.next) && !(a = a.call(u, y[1])).done)
          return a;
        switch (u = 0, a && (y = [y[0] & 2, a.value]), y[0]) {
          case 0:
          case 1:
            a = y;
            break;
          case 4:
            return n.label++, { value: y[1], done: !1 };
          case 5:
            n.label++, u = y[1], y = [0];
            continue;
          case 7:
            y = n.ops.pop(), n.trys.pop();
            continue;
          default:
            if (a = n.trys, !(a = a.length > 0 && a[a.length - 1]) && (y[0] === 6 || y[0] === 2)) {
              n = 0;
              continue;
            }
            if (y[0] === 3 && (!a || y[1] > a[0] && y[1] < a[3])) {
              n.label = y[1];
              break;
            }
            if (y[0] === 6 && n.label < a[1]) {
              n.label = a[1], a = y;
              break;
            }
            if (a && n.label < a[2]) {
              n.label = a[2], n.ops.push(y);
              break;
            }
            a[2] && n.ops.pop(), n.trys.pop();
            continue;
        }
        y = e.call(r, n);
      } catch (p) {
        y = [6, p], u = 0;
      } finally {
        s = a = 0;
      }
    if (y[0] & 5)
      throw y[1];
    return { value: y[0] ? y[1] : void 0, done: !0 };
  }
}
function zr(r) {
  var e = typeof Symbol == "function" && Symbol.iterator, n = e && r[e], s = 0;
  if (n)
    return n.call(r);
  if (r && typeof r.length == "number")
    return {
      next: function() {
        return r && s >= r.length && (r = void 0), { value: r && r[s++], done: !r };
      }
    };
  throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function Ye(r, e) {
  var n = typeof Symbol == "function" && r[Symbol.iterator];
  if (!n)
    return r;
  var s = n.call(r), u, a = [], f;
  try {
    for (; (e === void 0 || e-- > 0) && !(u = s.next()).done; )
      a.push(u.value);
  } catch (l) {
    f = { error: l };
  } finally {
    try {
      u && !u.done && (n = s.return) && n.call(s);
    } finally {
      if (f)
        throw f.error;
    }
  }
  return a;
}
function Ve(r, e, n) {
  if (n || arguments.length === 2)
    for (var s = 0, u = e.length, a; s < u; s++)
      (a || !(s in e)) && (a || (a = Array.prototype.slice.call(e, 0, s)), a[s] = e[s]);
  return r.concat(a || Array.prototype.slice.call(e));
}
function Br(r) {
  return this instanceof Br ? (this.v = r, this) : new Br(r);
}
function $w(r, e, n) {
  if (!Symbol.asyncIterator)
    throw new TypeError("Symbol.asyncIterator is not defined.");
  var s = n.apply(r, e || []), u, a = [];
  return u = {}, l("next"), l("throw"), l("return", f), u[Symbol.asyncIterator] = function() {
    return this;
  }, u;
  function f(C) {
    return function(I) {
      return Promise.resolve(I).then(C, m);
    };
  }
  function l(C, I) {
    s[C] && (u[C] = function(O) {
      return new Promise(function(R, x) {
        a.push([C, O, R, x]) > 1 || d(C, O);
      });
    }, I && (u[C] = I(u[C])));
  }
  function d(C, I) {
    try {
      y(s[C](I));
    } catch (O) {
      b(a[0][3], O);
    }
  }
  function y(C) {
    C.value instanceof Br ? Promise.resolve(C.value.v).then(p, m) : b(a[0][2], C);
  }
  function p(C) {
    d("next", C);
  }
  function m(C) {
    d("throw", C);
  }
  function b(C, I) {
    C(I), a.shift(), a.length && d(a[0][0], a[0][1]);
  }
}
function Pw(r) {
  if (!Symbol.asyncIterator)
    throw new TypeError("Symbol.asyncIterator is not defined.");
  var e = r[Symbol.asyncIterator], n;
  return e ? e.call(r) : (r = typeof zr == "function" ? zr(r) : r[Symbol.iterator](), n = {}, s("next"), s("throw"), s("return"), n[Symbol.asyncIterator] = function() {
    return this;
  }, n);
  function s(a) {
    n[a] = r[a] && function(f) {
      return new Promise(function(l, d) {
        f = r[a](f), u(l, d, f.done, f.value);
      });
    };
  }
  function u(a, f, l, d) {
    Promise.resolve(d).then(function(y) {
      a({ value: y, done: l });
    }, f);
  }
}
function bt(r) {
  return typeof r == "function";
}
function ua(r) {
  var e = function(s) {
    Error.call(s), s.stack = new Error().stack;
  }, n = r(e);
  return n.prototype = Object.create(Error.prototype), n.prototype.constructor = n, n;
}
var Pu = ua(function(r) {
  return function(n) {
    r(this), this.message = n ? n.length + ` errors occurred during unsubscription:
` + n.map(function(s, u) {
      return u + 1 + ") " + s.toString();
    }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = n;
  };
});
function Ju(r, e) {
  if (r) {
    var n = r.indexOf(e);
    0 <= n && r.splice(n, 1);
  }
}
var Kr = function() {
  function r(e) {
    this.initialTeardown = e, this.closed = !1, this._parentage = null, this._finalizers = null;
  }
  return r.prototype.unsubscribe = function() {
    var e, n, s, u, a;
    if (!this.closed) {
      this.closed = !0;
      var f = this._parentage;
      if (f)
        if (this._parentage = null, Array.isArray(f))
          try {
            for (var l = zr(f), d = l.next(); !d.done; d = l.next()) {
              var y = d.value;
              y.remove(this);
            }
          } catch (O) {
            e = { error: O };
          } finally {
            try {
              d && !d.done && (n = l.return) && n.call(l);
            } finally {
              if (e)
                throw e.error;
            }
          }
        else
          f.remove(this);
      var p = this.initialTeardown;
      if (bt(p))
        try {
          p();
        } catch (O) {
          a = O instanceof Pu ? O.errors : [O];
        }
      var m = this._finalizers;
      if (m) {
        this._finalizers = null;
        try {
          for (var b = zr(m), C = b.next(); !C.done; C = b.next()) {
            var I = C.value;
            try {
              Vf(I);
            } catch (O) {
              a = a ?? [], O instanceof Pu ? a = Ve(Ve([], Ye(a)), Ye(O.errors)) : a.push(O);
            }
          }
        } catch (O) {
          s = { error: O };
        } finally {
          try {
            C && !C.done && (u = b.return) && u.call(b);
          } finally {
            if (s)
              throw s.error;
          }
        }
      }
      if (a)
        throw new Pu(a);
    }
  }, r.prototype.add = function(e) {
    var n;
    if (e && e !== this)
      if (this.closed)
        Vf(e);
      else {
        if (e instanceof r) {
          if (e.closed || e._hasParent(this))
            return;
          e._addParent(this);
        }
        (this._finalizers = (n = this._finalizers) !== null && n !== void 0 ? n : []).push(e);
      }
  }, r.prototype._hasParent = function(e) {
    var n = this._parentage;
    return n === e || Array.isArray(n) && n.includes(e);
  }, r.prototype._addParent = function(e) {
    var n = this._parentage;
    this._parentage = Array.isArray(n) ? (n.push(e), n) : n ? [n, e] : e;
  }, r.prototype._removeParent = function(e) {
    var n = this._parentage;
    n === e ? this._parentage = null : Array.isArray(n) && Ju(n, e);
  }, r.prototype.remove = function(e) {
    var n = this._finalizers;
    n && Ju(n, e), e instanceof r && e._removeParent(this);
  }, r.EMPTY = function() {
    var e = new r();
    return e.closed = !0, e;
  }(), r;
}(), Kl = Kr.EMPTY;
function Jl(r) {
  return r instanceof Kr || r && "closed" in r && bt(r.remove) && bt(r.add) && bt(r.unsubscribe);
}
function Vf(r) {
  bt(r) ? r() : r.unsubscribe();
}
var Xl = {
  onUnhandledError: null,
  onStoppedNotification: null,
  Promise: void 0,
  useDeprecatedSynchronousErrorHandling: !1,
  useDeprecatedNextContext: !1
}, Xu = {
  setTimeout: function(r, e) {
    for (var n = [], s = 2; s < arguments.length; s++)
      n[s - 2] = arguments[s];
    var u = Xu.delegate;
    return u != null && u.setTimeout ? u.setTimeout.apply(u, Ve([r, e], Ye(n))) : setTimeout.apply(void 0, Ve([r, e], Ye(n)));
  },
  clearTimeout: function(r) {
    var e = Xu.delegate;
    return ((e == null ? void 0 : e.clearTimeout) || clearTimeout)(r);
  },
  delegate: void 0
};
function Yl(r) {
  Xu.setTimeout(function() {
    throw r;
  });
}
function Yu() {
}
function Ns(r) {
  r();
}
var aa = function(r) {
  Jn(e, r);
  function e(n) {
    var s = r.call(this) || this;
    return s.isStopped = !1, n ? (s.destination = n, Jl(n) && n.add(s)) : s.destination = Uw, s;
  }
  return e.create = function(n, s, u) {
    return new Ri(n, s, u);
  }, e.prototype.next = function(n) {
    this.isStopped || this._next(n);
  }, e.prototype.error = function(n) {
    this.isStopped || (this.isStopped = !0, this._error(n));
  }, e.prototype.complete = function() {
    this.isStopped || (this.isStopped = !0, this._complete());
  }, e.prototype.unsubscribe = function() {
    this.closed || (this.isStopped = !0, r.prototype.unsubscribe.call(this), this.destination = null);
  }, e.prototype._next = function(n) {
    this.destination.next(n);
  }, e.prototype._error = function(n) {
    try {
      this.destination.error(n);
    } finally {
      this.unsubscribe();
    }
  }, e.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  }, e;
}(Kr), Fw = Function.prototype.bind;
function Fu(r, e) {
  return Fw.call(r, e);
}
var Mw = function() {
  function r(e) {
    this.partialObserver = e;
  }
  return r.prototype.next = function(e) {
    var n = this.partialObserver;
    if (n.next)
      try {
        n.next(e);
      } catch (s) {
        xs(s);
      }
  }, r.prototype.error = function(e) {
    var n = this.partialObserver;
    if (n.error)
      try {
        n.error(e);
      } catch (s) {
        xs(s);
      }
    else
      xs(e);
  }, r.prototype.complete = function() {
    var e = this.partialObserver;
    if (e.complete)
      try {
        e.complete();
      } catch (n) {
        xs(n);
      }
  }, r;
}(), Ri = function(r) {
  Jn(e, r);
  function e(n, s, u) {
    var a = r.call(this) || this, f;
    if (bt(n) || !n)
      f = {
        next: n ?? void 0,
        error: s ?? void 0,
        complete: u ?? void 0
      };
    else {
      var l;
      a && Xl.useDeprecatedNextContext ? (l = Object.create(n), l.unsubscribe = function() {
        return a.unsubscribe();
      }, f = {
        next: n.next && Fu(n.next, l),
        error: n.error && Fu(n.error, l),
        complete: n.complete && Fu(n.complete, l)
      }) : f = n;
    }
    return a.destination = new Mw(f), a;
  }
  return e;
}(aa);
function xs(r) {
  Yl(r);
}
function Dw(r) {
  throw r;
}
var Uw = {
  closed: !0,
  next: Yu,
  error: Dw,
  complete: Yu
}, ca = function() {
  return typeof Symbol == "function" && Symbol.observable || "@@observable";
}();
function Jr(r) {
  return r;
}
function kw() {
  for (var r = [], e = 0; e < arguments.length; e++)
    r[e] = arguments[e];
  return Vl(r);
}
function Vl(r) {
  return r.length === 0 ? Jr : r.length === 1 ? r[0] : function(n) {
    return r.reduce(function(s, u) {
      return u(s);
    }, n);
  };
}
var Mt = function() {
  function r(e) {
    e && (this._subscribe = e);
  }
  return r.prototype.lift = function(e) {
    var n = new r();
    return n.source = this, n.operator = e, n;
  }, r.prototype.subscribe = function(e, n, s) {
    var u = this, a = qw(e) ? e : new Ri(e, n, s);
    return Ns(function() {
      var f = u, l = f.operator, d = f.source;
      a.add(l ? l.call(a, d) : d ? u._subscribe(a) : u._trySubscribe(a));
    }), a;
  }, r.prototype._trySubscribe = function(e) {
    try {
      return this._subscribe(e);
    } catch (n) {
      e.error(n);
    }
  }, r.prototype.forEach = function(e, n) {
    var s = this;
    return n = Zf(n), new n(function(u, a) {
      var f = new Ri({
        next: function(l) {
          try {
            e(l);
          } catch (d) {
            a(d), f.unsubscribe();
          }
        },
        error: a,
        complete: u
      });
      s.subscribe(f);
    });
  }, r.prototype._subscribe = function(e) {
    var n;
    return (n = this.source) === null || n === void 0 ? void 0 : n.subscribe(e);
  }, r.prototype[ca] = function() {
    return this;
  }, r.prototype.pipe = function() {
    for (var e = [], n = 0; n < arguments.length; n++)
      e[n] = arguments[n];
    return Vl(e)(this);
  }, r.prototype.toPromise = function(e) {
    var n = this;
    return e = Zf(e), new e(function(s, u) {
      var a;
      n.subscribe(function(f) {
        return a = f;
      }, function(f) {
        return u(f);
      }, function() {
        return s(a);
      });
    });
  }, r.create = function(e) {
    return new r(e);
  }, r;
}();
function Zf(r) {
  var e;
  return (e = r ?? Xl.Promise) !== null && e !== void 0 ? e : Promise;
}
function Nw(r) {
  return r && bt(r.next) && bt(r.error) && bt(r.complete);
}
function qw(r) {
  return r && r instanceof aa || Nw(r) && Jl(r);
}
function Zl(r) {
  return bt(r == null ? void 0 : r.lift);
}
function me(r) {
  return function(e) {
    if (Zl(e))
      return e.lift(function(n) {
        try {
          return r(n, this);
        } catch (s) {
          this.error(s);
        }
      });
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
function ve(r, e, n, s, u) {
  return new Ww(r, e, n, s, u);
}
var Ww = function(r) {
  Jn(e, r);
  function e(n, s, u, a, f, l) {
    var d = r.call(this, n) || this;
    return d.onFinalize = f, d.shouldUnsubscribe = l, d._next = s ? function(y) {
      try {
        s(y);
      } catch (p) {
        n.error(p);
      }
    } : r.prototype._next, d._error = a ? function(y) {
      try {
        a(y);
      } catch (p) {
        n.error(p);
      } finally {
        this.unsubscribe();
      }
    } : r.prototype._error, d._complete = u ? function() {
      try {
        u();
      } catch (y) {
        n.error(y);
      } finally {
        this.unsubscribe();
      }
    } : r.prototype._complete, d;
  }
  return e.prototype.unsubscribe = function() {
    var n;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var s = this.closed;
      r.prototype.unsubscribe.call(this), !s && ((n = this.onFinalize) === null || n === void 0 || n.call(this));
    }
  }, e;
}(aa);
function mi() {
  return me(function(r, e) {
    var n = null;
    r._refCount++;
    var s = ve(e, void 0, void 0, void 0, function() {
      if (!r || r._refCount <= 0 || 0 < --r._refCount) {
        n = null;
        return;
      }
      var u = r._connection, a = n;
      n = null, u && (!a || u === a) && u.unsubscribe(), e.unsubscribe();
    });
    r.subscribe(s), s.closed || (n = r.connect());
  });
}
var Bw = function(r) {
  Jn(e, r);
  function e(n, s) {
    var u = r.call(this) || this;
    return u.source = n, u.subjectFactory = s, u._subject = null, u._refCount = 0, u._connection = null, Zl(n) && (u.lift = n.lift), u;
  }
  return e.prototype._subscribe = function(n) {
    return this.getSubject().subscribe(n);
  }, e.prototype.getSubject = function() {
    var n = this._subject;
    return (!n || n.isStopped) && (this._subject = this.subjectFactory()), this._subject;
  }, e.prototype._teardown = function() {
    this._refCount = 0;
    var n = this._connection;
    this._subject = this._connection = null, n == null || n.unsubscribe();
  }, e.prototype.connect = function() {
    var n = this, s = this._connection;
    if (!s) {
      s = this._connection = new Kr();
      var u = this.getSubject();
      s.add(this.source.subscribe(ve(u, void 0, function() {
        n._teardown(), u.complete();
      }, function(a) {
        n._teardown(), u.error(a);
      }, function() {
        return n._teardown();
      }))), s.closed && (this._connection = null, s = Kr.EMPTY);
    }
    return s;
  }, e.prototype.refCount = function() {
    return mi()(this);
  }, e;
}(Mt), Hw = ua(function(r) {
  return function() {
    r(this), this.name = "ObjectUnsubscribedError", this.message = "object unsubscribed";
  };
}), Je = function(r) {
  Jn(e, r);
  function e() {
    var n = r.call(this) || this;
    return n.closed = !1, n.currentObservers = null, n.observers = [], n.isStopped = !1, n.hasError = !1, n.thrownError = null, n;
  }
  return e.prototype.lift = function(n) {
    var s = new Qf(this, this);
    return s.operator = n, s;
  }, e.prototype._throwIfClosed = function() {
    if (this.closed)
      throw new Hw();
  }, e.prototype.next = function(n) {
    var s = this;
    Ns(function() {
      var u, a;
      if (s._throwIfClosed(), !s.isStopped) {
        s.currentObservers || (s.currentObservers = Array.from(s.observers));
        try {
          for (var f = zr(s.currentObservers), l = f.next(); !l.done; l = f.next()) {
            var d = l.value;
            d.next(n);
          }
        } catch (y) {
          u = { error: y };
        } finally {
          try {
            l && !l.done && (a = f.return) && a.call(f);
          } finally {
            if (u)
              throw u.error;
          }
        }
      }
    });
  }, e.prototype.error = function(n) {
    var s = this;
    Ns(function() {
      if (s._throwIfClosed(), !s.isStopped) {
        s.hasError = s.isStopped = !0, s.thrownError = n;
        for (var u = s.observers; u.length; )
          u.shift().error(n);
      }
    });
  }, e.prototype.complete = function() {
    var n = this;
    Ns(function() {
      if (n._throwIfClosed(), !n.isStopped) {
        n.isStopped = !0;
        for (var s = n.observers; s.length; )
          s.shift().complete();
      }
    });
  }, e.prototype.unsubscribe = function() {
    this.isStopped = this.closed = !0, this.observers = this.currentObservers = null;
  }, Object.defineProperty(e.prototype, "observed", {
    get: function() {
      var n;
      return ((n = this.observers) === null || n === void 0 ? void 0 : n.length) > 0;
    },
    enumerable: !1,
    configurable: !0
  }), e.prototype._trySubscribe = function(n) {
    return this._throwIfClosed(), r.prototype._trySubscribe.call(this, n);
  }, e.prototype._subscribe = function(n) {
    return this._throwIfClosed(), this._checkFinalizedStatuses(n), this._innerSubscribe(n);
  }, e.prototype._innerSubscribe = function(n) {
    var s = this, u = this, a = u.hasError, f = u.isStopped, l = u.observers;
    return a || f ? Kl : (this.currentObservers = null, l.push(n), new Kr(function() {
      s.currentObservers = null, Ju(l, n);
    }));
  }, e.prototype._checkFinalizedStatuses = function(n) {
    var s = this, u = s.hasError, a = s.thrownError, f = s.isStopped;
    u ? n.error(a) : f && n.complete();
  }, e.prototype.asObservable = function() {
    var n = new Mt();
    return n.source = this, n;
  }, e.create = function(n, s) {
    return new Qf(n, s);
  }, e;
}(Mt), Qf = function(r) {
  Jn(e, r);
  function e(n, s) {
    var u = r.call(this) || this;
    return u.destination = n, u.source = s, u;
  }
  return e.prototype.next = function(n) {
    var s, u;
    (u = (s = this.destination) === null || s === void 0 ? void 0 : s.next) === null || u === void 0 || u.call(s, n);
  }, e.prototype.error = function(n) {
    var s, u;
    (u = (s = this.destination) === null || s === void 0 ? void 0 : s.error) === null || u === void 0 || u.call(s, n);
  }, e.prototype.complete = function() {
    var n, s;
    (s = (n = this.destination) === null || n === void 0 ? void 0 : n.complete) === null || s === void 0 || s.call(n);
  }, e.prototype._subscribe = function(n) {
    var s, u;
    return (u = (s = this.source) === null || s === void 0 ? void 0 : s.subscribe(n)) !== null && u !== void 0 ? u : Kl;
  }, e;
}(Je), Gw = function(r) {
  Jn(e, r);
  function e(n) {
    var s = r.call(this) || this;
    return s._value = n, s;
  }
  return Object.defineProperty(e.prototype, "value", {
    get: function() {
      return this.getValue();
    },
    enumerable: !1,
    configurable: !0
  }), e.prototype._subscribe = function(n) {
    var s = r.prototype._subscribe.call(this, n);
    return !s.closed && n.next(this._value), s;
  }, e.prototype.getValue = function() {
    var n = this, s = n.hasError, u = n.thrownError, a = n._value;
    if (s)
      throw u;
    return this._throwIfClosed(), a;
  }, e.prototype.next = function(n) {
    r.prototype.next.call(this, this._value = n);
  }, e;
}(Je), Ql = {
  now: function() {
    return (Ql.delegate || Date).now();
  },
  delegate: void 0
}, jw = function(r) {
  Jn(e, r);
  function e(n, s, u) {
    n === void 0 && (n = 1 / 0), s === void 0 && (s = 1 / 0), u === void 0 && (u = Ql);
    var a = r.call(this) || this;
    return a._bufferSize = n, a._windowTime = s, a._timestampProvider = u, a._buffer = [], a._infiniteTimeWindow = !0, a._infiniteTimeWindow = s === 1 / 0, a._bufferSize = Math.max(1, n), a._windowTime = Math.max(1, s), a;
  }
  return e.prototype.next = function(n) {
    var s = this, u = s.isStopped, a = s._buffer, f = s._infiniteTimeWindow, l = s._timestampProvider, d = s._windowTime;
    u || (a.push(n), !f && a.push(l.now() + d)), this._trimBuffer(), r.prototype.next.call(this, n);
  }, e.prototype._subscribe = function(n) {
    this._throwIfClosed(), this._trimBuffer();
    for (var s = this._innerSubscribe(n), u = this, a = u._infiniteTimeWindow, f = u._buffer, l = f.slice(), d = 0; d < l.length && !n.closed; d += a ? 1 : 2)
      n.next(l[d]);
    return this._checkFinalizedStatuses(n), s;
  }, e.prototype._trimBuffer = function() {
    var n = this, s = n._bufferSize, u = n._timestampProvider, a = n._buffer, f = n._infiniteTimeWindow, l = (f ? 1 : 2) * s;
    if (s < 1 / 0 && l < a.length && a.splice(0, a.length - l), !f) {
      for (var d = u.now(), y = 0, p = 1; p < a.length && a[p] <= d; p += 2)
        y = p;
      y && a.splice(0, y + 1);
    }
  }, e;
}(Je), po = new Mt(function(r) {
  return r.complete();
});
function zw(r) {
  return r && bt(r.schedule);
}
function fa(r) {
  return r[r.length - 1];
}
function th(r) {
  return bt(fa(r)) ? r.pop() : void 0;
}
function eh(r) {
  return zw(fa(r)) ? r.pop() : void 0;
}
function Kw(r, e) {
  return typeof fa(r) == "number" ? r.pop() : e;
}
var nh = function(r) {
  return r && typeof r.length == "number" && typeof r != "function";
};
function rh(r) {
  return bt(r == null ? void 0 : r.then);
}
function ih(r) {
  return bt(r[ca]);
}
function sh(r) {
  return Symbol.asyncIterator && bt(r == null ? void 0 : r[Symbol.asyncIterator]);
}
function oh(r) {
  return new TypeError("You provided " + (r !== null && typeof r == "object" ? "an invalid object" : "'" + r + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
function Jw() {
  return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator;
}
var uh = Jw();
function ah(r) {
  return bt(r == null ? void 0 : r[uh]);
}
function ch(r) {
  return $w(this, arguments, function() {
    var n, s, u, a;
    return zl(this, function(f) {
      switch (f.label) {
        case 0:
          n = r.getReader(), f.label = 1;
        case 1:
          f.trys.push([1, , 9, 10]), f.label = 2;
        case 2:
          return [4, Br(n.read())];
        case 3:
          return s = f.sent(), u = s.value, a = s.done, a ? [4, Br(void 0)] : [3, 5];
        case 4:
          return [2, f.sent()];
        case 5:
          return [4, Br(u)];
        case 6:
          return [4, f.sent()];
        case 7:
          return f.sent(), [3, 2];
        case 8:
          return [3, 10];
        case 9:
          return n.releaseLock(), [7];
        case 10:
          return [2];
      }
    });
  });
}
function fh(r) {
  return bt(r == null ? void 0 : r.getReader);
}
function Qe(r) {
  if (r instanceof Mt)
    return r;
  if (r != null) {
    if (ih(r))
      return Xw(r);
    if (nh(r))
      return Yw(r);
    if (rh(r))
      return Vw(r);
    if (sh(r))
      return lh(r);
    if (ah(r))
      return Zw(r);
    if (fh(r))
      return Qw(r);
  }
  throw oh(r);
}
function Xw(r) {
  return new Mt(function(e) {
    var n = r[ca]();
    if (bt(n.subscribe))
      return n.subscribe(e);
    throw new TypeError("Provided object does not correctly implement Symbol.observable");
  });
}
function Yw(r) {
  return new Mt(function(e) {
    for (var n = 0; n < r.length && !e.closed; n++)
      e.next(r[n]);
    e.complete();
  });
}
function Vw(r) {
  return new Mt(function(e) {
    r.then(function(n) {
      e.closed || (e.next(n), e.complete());
    }, function(n) {
      return e.error(n);
    }).then(null, Yl);
  });
}
function Zw(r) {
  return new Mt(function(e) {
    var n, s;
    try {
      for (var u = zr(r), a = u.next(); !a.done; a = u.next()) {
        var f = a.value;
        if (e.next(f), e.closed)
          return;
      }
    } catch (l) {
      n = { error: l };
    } finally {
      try {
        a && !a.done && (s = u.return) && s.call(u);
      } finally {
        if (n)
          throw n.error;
      }
    }
    e.complete();
  });
}
function lh(r) {
  return new Mt(function(e) {
    tb(r, e).catch(function(n) {
      return e.error(n);
    });
  });
}
function Qw(r) {
  return lh(ch(r));
}
function tb(r, e) {
  var n, s, u, a;
  return Lw(this, void 0, void 0, function() {
    var f, l;
    return zl(this, function(d) {
      switch (d.label) {
        case 0:
          d.trys.push([0, 5, 6, 11]), n = Pw(r), d.label = 1;
        case 1:
          return [4, n.next()];
        case 2:
          if (s = d.sent(), !!s.done)
            return [3, 4];
          if (f = s.value, e.next(f), e.closed)
            return [2];
          d.label = 3;
        case 3:
          return [3, 1];
        case 4:
          return [3, 11];
        case 5:
          return l = d.sent(), u = { error: l }, [3, 11];
        case 6:
          return d.trys.push([6, , 9, 10]), s && !s.done && (a = n.return) ? [4, a.call(n)] : [3, 8];
        case 7:
          d.sent(), d.label = 8;
        case 8:
          return [3, 10];
        case 9:
          if (u)
            throw u.error;
          return [7];
        case 10:
          return [7];
        case 11:
          return e.complete(), [2];
      }
    });
  });
}
function Cn(r, e, n, s, u) {
  s === void 0 && (s = 0), u === void 0 && (u = !1);
  var a = e.schedule(function() {
    n(), u ? r.add(this.schedule(null, s)) : this.unsubscribe();
  }, s);
  if (r.add(a), !u)
    return a;
}
function hh(r, e) {
  return e === void 0 && (e = 0), me(function(n, s) {
    n.subscribe(ve(s, function(u) {
      return Cn(s, r, function() {
        return s.next(u);
      }, e);
    }, function() {
      return Cn(s, r, function() {
        return s.complete();
      }, e);
    }, function(u) {
      return Cn(s, r, function() {
        return s.error(u);
      }, e);
    }));
  });
}
function dh(r, e) {
  return e === void 0 && (e = 0), me(function(n, s) {
    s.add(r.schedule(function() {
      return n.subscribe(s);
    }, e));
  });
}
function eb(r, e) {
  return Qe(r).pipe(dh(e), hh(e));
}
function nb(r, e) {
  return Qe(r).pipe(dh(e), hh(e));
}
function rb(r, e) {
  return new Mt(function(n) {
    var s = 0;
    return e.schedule(function() {
      s === r.length ? n.complete() : (n.next(r[s++]), n.closed || this.schedule());
    });
  });
}
function ib(r, e) {
  return new Mt(function(n) {
    var s;
    return Cn(n, e, function() {
      s = r[uh](), Cn(n, e, function() {
        var u, a, f;
        try {
          u = s.next(), a = u.value, f = u.done;
        } catch (l) {
          n.error(l);
          return;
        }
        f ? n.complete() : n.next(a);
      }, 0, !0);
    }), function() {
      return bt(s == null ? void 0 : s.return) && s.return();
    };
  });
}
function ph(r, e) {
  if (!r)
    throw new Error("Iterable cannot be null");
  return new Mt(function(n) {
    Cn(n, e, function() {
      var s = r[Symbol.asyncIterator]();
      Cn(n, e, function() {
        s.next().then(function(u) {
          u.done ? n.complete() : n.next(u.value);
        });
      }, 0, !0);
    });
  });
}
function sb(r, e) {
  return ph(ch(r), e);
}
function ob(r, e) {
  if (r != null) {
    if (ih(r))
      return eb(r, e);
    if (nh(r))
      return rb(r, e);
    if (rh(r))
      return nb(r, e);
    if (sh(r))
      return ph(r, e);
    if (ah(r))
      return ib(r, e);
    if (fh(r))
      return sb(r, e);
  }
  throw oh(r);
}
function Ii(r, e) {
  return e ? ob(r, e) : Qe(r);
}
function gh() {
  for (var r = [], e = 0; e < arguments.length; e++)
    r[e] = arguments[e];
  var n = eh(r);
  return Ii(r, n);
}
var ub = ua(function(r) {
  return function() {
    r(this), this.name = "EmptyError", this.message = "no elements in sequence";
  };
});
function Ht(r, e) {
  var n = typeof e == "object";
  return new Promise(function(s, u) {
    var a = !1, f;
    r.subscribe({
      next: function(l) {
        f = l, a = !0;
      },
      error: u,
      complete: function() {
        a ? s(f) : n ? s(e.defaultValue) : u(new ub());
      }
    });
  });
}
function Lt(r, e) {
  return me(function(n, s) {
    var u = 0;
    n.subscribe(ve(s, function(a) {
      s.next(r.call(e, a, u++));
    }));
  });
}
var ab = Array.isArray;
function cb(r, e) {
  return ab(e) ? r.apply(void 0, Ve([], Ye(e))) : r(e);
}
function fb(r) {
  return Lt(function(e) {
    return cb(r, e);
  });
}
function lb(r, e, n) {
  return n === void 0 && (n = Jr), function(s) {
    tl(e, function() {
      for (var u = r.length, a = new Array(u), f = u, l = u, d = function(p) {
        tl(e, function() {
          var m = Ii(r[p], e), b = !1;
          m.subscribe(ve(s, function(C) {
            a[p] = C, b || (b = !0, l--), l || s.next(n(a.slice()));
          }, function() {
            --f || s.complete();
          }));
        }, s);
      }, y = 0; y < u; y++)
        d(y);
    }, s);
  };
}
function tl(r, e, n) {
  r ? Cn(n, r, e) : e();
}
function hb(r, e, n, s, u, a, f, l) {
  var d = [], y = 0, p = 0, m = !1, b = function() {
    m && !d.length && !y && e.complete();
  }, C = function(O) {
    return y < s ? I(O) : d.push(O);
  }, I = function(O) {
    a && e.next(O), y++;
    var R = !1;
    Qe(n(O, p++)).subscribe(ve(e, function(x) {
      u == null || u(x), a ? C(x) : e.next(x);
    }, function() {
      R = !0;
    }, void 0, function() {
      if (R)
        try {
          y--;
          for (var x = function() {
            var D = d.shift();
            f ? Cn(e, f, function() {
              return I(D);
            }) : I(D);
          }; d.length && y < s; )
            x();
          b();
        } catch (D) {
          e.error(D);
        }
    }));
  };
  return r.subscribe(ve(e, C, function() {
    m = !0, b();
  })), function() {
    l == null || l();
  };
}
function on(r, e, n) {
  return n === void 0 && (n = 1 / 0), bt(e) ? on(function(s, u) {
    return Lt(function(a, f) {
      return e(s, a, u, f);
    })(Qe(r(s, u)));
  }, n) : (typeof e == "number" && (n = e), me(function(s, u) {
    return hb(s, u, r, n);
  }));
}
function db(r) {
  return r === void 0 && (r = 1 / 0), on(Jr, r);
}
function pb(r) {
  return new Mt(function(e) {
    Qe(r()).subscribe(e);
  });
}
function Hr() {
  for (var r = [], e = 0; e < arguments.length; e++)
    r[e] = arguments[e];
  var n = eh(r), s = Kw(r, 1 / 0), u = r;
  return u.length ? u.length === 1 ? Qe(u[0]) : db(s)(Ii(u, n)) : po;
}
var gb = Array.isArray;
function vb(r) {
  return r.length === 1 && gb(r[0]) ? r[0] : r;
}
function Xe(r, e) {
  return me(function(n, s) {
    var u = 0;
    n.subscribe(ve(s, function(a) {
      return r.call(e, a, u++) && s.next(a);
    }));
  });
}
function mb(r, e, n, s, u) {
  return function(a, f) {
    var l = n, d = e, y = 0;
    a.subscribe(ve(f, function(p) {
      var m = y++;
      d = l ? r(d, p, m) : (l = !0, p), s && f.next(d);
    }, u && function() {
      l && f.next(d), f.complete();
    }));
  };
}
function vh() {
  for (var r = [], e = 0; e < arguments.length; e++)
    r[e] = arguments[e];
  var n = th(r);
  return n ? kw(vh.apply(void 0, Ve([], Ye(r))), fb(n)) : me(function(s, u) {
    lb(Ve([s], Ye(vb(r))))(u);
  });
}
function yb() {
  for (var r = [], e = 0; e < arguments.length; e++)
    r[e] = arguments[e];
  return vh.apply(void 0, Ve([], Ye(r)));
}
function el(r, e) {
  return bt(e) ? on(r, e, 1) : on(r, 1);
}
function wb(r) {
  return new Mt(function(e) {
    return r.subscribe(e);
  });
}
var bb = {
  connector: function() {
    return new Je();
  }
};
function _b(r, e) {
  e === void 0 && (e = bb);
  var n = e.connector;
  return me(function(s, u) {
    var a = n();
    Qe(r(wb(a))).subscribe(u), u.add(s.subscribe(a));
  });
}
function mh(r) {
  return r <= 0 ? function() {
    return po;
  } : me(function(e, n) {
    var s = 0;
    e.subscribe(ve(n, function(u) {
      ++s <= r && (n.next(u), r <= s && n.complete());
    }));
  });
}
function nl(r, e) {
  return e === void 0 && (e = Jr), r = r ?? Cb, me(function(n, s) {
    var u, a = !0;
    n.subscribe(ve(s, function(f) {
      var l = e(f);
      (a || !r(u, l)) && (a = !1, u = l, s.next(f));
    }));
  });
}
function Cb(r, e) {
  return r === e;
}
function Eb(r, e, n) {
  return n === void 0 && (n = 1 / 0), bt(e) ? on(function() {
    return r;
  }, e, n) : (typeof e == "number" && (n = e), on(function() {
    return r;
  }, n));
}
function Ab(r, e) {
  var n = bt(r) ? r : function() {
    return r;
  };
  return bt(e) ? _b(e, {
    connector: n
  }) : function(s) {
    return new Bw(s, n);
  };
}
function Ss(r, e, n, s) {
  n && !bt(n) && (s = n);
  var u = bt(n) ? n : void 0;
  return function(a) {
    return Ab(new jw(r, e, s), u)(a);
  };
}
function yh(r, e) {
  return me(mb(r, e, arguments.length >= 2, !0));
}
function Vu(r) {
  r === void 0 && (r = {});
  var e = r.connector, n = e === void 0 ? function() {
    return new Je();
  } : e, s = r.resetOnError, u = s === void 0 ? !0 : s, a = r.resetOnComplete, f = a === void 0 ? !0 : a, l = r.resetOnRefCountZero, d = l === void 0 ? !0 : l;
  return function(y) {
    var p, m, b, C = 0, I = !1, O = !1, R = function() {
      m == null || m.unsubscribe(), m = void 0;
    }, x = function() {
      R(), p = b = void 0, I = O = !1;
    }, D = function() {
      var U = p;
      x(), U == null || U.unsubscribe();
    };
    return me(function(U, M) {
      C++, !O && !I && R();
      var z = b = b ?? n();
      M.add(function() {
        C--, C === 0 && !O && !I && (m = Mu(D, d));
      }), z.subscribe(M), !p && C > 0 && (p = new Ri({
        next: function(ht) {
          return z.next(ht);
        },
        error: function(ht) {
          O = !0, R(), m = Mu(x, u, ht), z.error(ht);
        },
        complete: function() {
          I = !0, R(), m = Mu(x, f), z.complete();
        }
      }), Qe(U).subscribe(p));
    })(y);
  };
}
function Mu(r, e) {
  for (var n = [], s = 2; s < arguments.length; s++)
    n[s - 2] = arguments[s];
  if (e === !0) {
    r();
    return;
  }
  if (e !== !1) {
    var u = new Ri({
      next: function() {
        u.unsubscribe(), r();
      }
    });
    return Qe(e.apply(void 0, Ve([], Ye(n)))).subscribe(u);
  }
}
function Zu(r, e, n) {
  var s = bt(r) || e || n ? { next: r, error: e, complete: n } : r;
  return s ? me(function(u, a) {
    var f;
    (f = s.subscribe) === null || f === void 0 || f.call(s);
    var l = !0;
    u.subscribe(ve(a, function(d) {
      var y;
      (y = s.next) === null || y === void 0 || y.call(s, d), a.next(d);
    }, function() {
      var d;
      l = !1, (d = s.complete) === null || d === void 0 || d.call(s), a.complete();
    }, function(d) {
      var y;
      l = !1, (y = s.error) === null || y === void 0 || y.call(s, d), a.error(d);
    }, function() {
      var d, y;
      l && ((d = s.unsubscribe) === null || d === void 0 || d.call(s)), (y = s.finalize) === null || y === void 0 || y.call(s);
    }));
  }) : Jr;
}
function rl() {
  for (var r = [], e = 0; e < arguments.length; e++)
    r[e] = arguments[e];
  var n = th(r);
  return me(function(s, u) {
    for (var a = r.length, f = new Array(a), l = r.map(function() {
      return !1;
    }), d = !1, y = function(m) {
      Qe(r[m]).subscribe(ve(u, function(b) {
        f[m] = b, !d && !l[m] && (l[m] = !0, (d = l.every(Jr)) && (l = null));
      }, Yu));
    }, p = 0; p < a; p++)
      y(p);
    s.subscribe(ve(u, function(m) {
      if (d) {
        var b = Ve([m], Ye(f));
        u.next(n ? n.apply(void 0, Ve([], Ye(b))) : b);
      }
    }));
  });
}
var wh = { 0: 8203, 1: 8204, 2: 8205, 3: 8290, 4: 8291, 5: 8288, 6: 65279, 7: 8289, 8: 119155, 9: 119156, a: 119157, b: 119158, c: 119159, d: 119160, e: 119161, f: 119162 }, la = { 0: 8203, 1: 8204, 2: 8205, 3: 65279 }, xb = new Array(4).fill(String.fromCodePoint(la[0])).join("");
function Sb(r) {
  let e = JSON.stringify(r);
  return `${xb}${Array.from(e).map((n) => {
    let s = n.charCodeAt(0);
    if (s > 255)
      throw new Error(`Only ASCII edit info can be encoded. Error attempting to encode ${e} on character ${n} (${s})`);
    return Array.from(s.toString(4).padStart(4, "0")).map((u) => String.fromCodePoint(la[u])).join("");
  }).join("")}`;
}
function Rb(r) {
  return !Number.isNaN(Number(r)) || /[a-z]/i.test(r) && !/\d+(?:[-:\/]\d+){2}(?:T\d+(?:[-:\/]\d+){1,2}(\.\d+)?Z?)?/.test(r) ? !1 : !!Date.parse(r);
}
function Ib(r) {
  try {
    new URL(r, r.startsWith("/") ? "https://acme.com" : void 0);
  } catch {
    return !1;
  }
  return !0;
}
function Ob(r, e, n = "auto") {
  return n === !0 || n === "auto" && (Rb(r) || Ib(r)) ? r : `${r}${Sb(e)}`;
}
Object.fromEntries(Object.entries(la).map((r) => r.reverse()));
Object.fromEntries(Object.entries(wh).map((r) => r.reverse()));
var Tb = `${Object.values(wh).map((r) => `\\u{${r.toString(16)}}`).join("")}`, il = new RegExp(`[${Tb}]{4,}`, "gu");
function Lb(r) {
  var e;
  return { cleaned: r.replace(il, ""), encoded: ((e = r.match(il)) == null ? void 0 : e[0]) || "" };
}
function $b(r) {
  return r && JSON.parse(Lb(JSON.stringify(r)).cleaned);
}
function Pb(r) {
  return $b(r);
}
var Fb = Object.defineProperty, Mb = (r, e, n) => e in r ? Fb(r, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[e] = n, Gn = (r, e, n) => (Mb(r, typeof e != "symbol" ? e + "" : e, n), n);
class Db extends Error {
  constructor(e) {
    const n = bh(e);
    super(n.message), Gn(this, "response"), Gn(this, "statusCode", 400), Gn(this, "responseBody"), Gn(this, "details"), Object.assign(this, n);
  }
}
class Ub extends Error {
  constructor(e) {
    const n = bh(e);
    super(n.message), Gn(this, "response"), Gn(this, "statusCode", 500), Gn(this, "responseBody"), Gn(this, "details"), Object.assign(this, n);
  }
}
function bh(r) {
  const e = r.body, n = {
    response: r,
    statusCode: r.statusCode,
    responseBody: Wb(e, r),
    message: "",
    details: void 0
  };
  if (e.error && e.message)
    return n.message = `${e.error} - ${e.message}`, n;
  if (kb(e) || Nb(e)) {
    const s = e.error.items || [], u = s.slice(0, 5).map((f) => {
      var l;
      return (l = f.error) == null ? void 0 : l.description;
    }).filter(Boolean);
    let a = u.length ? `:
- ${u.join(`
- `)}` : "";
    return s.length > 5 && (a += `
...and ${s.length - 5} more`), n.message = `${e.error.description}${a}`, n.details = e.error, n;
  }
  return e.error && e.error.description ? (n.message = e.error.description, n.details = e.error, n) : (n.message = e.error || e.message || qb(r), n);
}
function kb(r) {
  return Ys(r) && Ys(r.error) && r.error.type === "mutationError" && typeof r.error.description == "string";
}
function Nb(r) {
  return Ys(r) && Ys(r.error) && r.error.type === "actionError" && typeof r.error.description == "string";
}
function Ys(r) {
  return typeof r == "object" && r !== null && !Array.isArray(r);
}
function qb(r) {
  const e = r.statusMessage ? ` ${r.statusMessage}` : "";
  return `${r.method}-request to ${r.url} resulted in HTTP ${r.statusCode}${e}`;
}
function Wb(r, e) {
  return (e.headers["content-type"] || "").toLowerCase().indexOf("application/json") !== -1 ? JSON.stringify(r, null, 2) : r;
}
const Bb = {
  onResponse: (r) => {
    if (r.statusCode >= 500)
      throw new Ub(r);
    if (r.statusCode >= 400)
      throw new Db(r);
    return r;
  }
}, Hb = {
  onResponse: (r) => {
    const e = r.headers["x-sanity-warning"];
    return (Array.isArray(e) ? e : [e]).filter(Boolean).forEach((n) => console.warn(n)), r;
  }
};
function Gb(r) {
  return dw([
    oa({ shouldRetry: jb }),
    ...r,
    Hb,
    bw(),
    _w(),
    Aw(),
    Bb,
    Ew({ implementation: Mt })
  ]);
}
function jb(r, e, n) {
  if (n.maxRetries === 0)
    return !1;
  const s = n.method === "GET" || n.method === "HEAD", u = (n.uri || n.url).startsWith("/data/query"), a = r.response && (r.response.statusCode === 429 || r.response.statusCode === 502 || r.response.statusCode === 503);
  return (s || u) && a ? !0 : oa.shouldRetry(r, e, n);
}
function _h(r) {
  if (typeof r == "string")
    return { id: r };
  if (Array.isArray(r))
    return { query: "*[_id in $ids]", params: { ids: r } };
  if (typeof r == "object" && r !== null && "query" in r && typeof r.query == "string")
    return "params" in r && typeof r.params == "object" && r.params !== null ? { query: r.query, params: r.params } : { query: r.query };
  const e = [
    "* Document ID (<docId>)",
    "* Array of document IDs",
    "* Object containing `query`"
  ].join(`
`);
  throw new Error(`Unknown selection - must be one of:

${e}`);
}
const sl = ["image", "file"], ol = ["before", "after", "replace"], Ch = (r) => {
  if (!/^(~[a-z0-9]{1}[-\w]{0,63}|[a-z0-9]{1}[-\w]{0,63})$/.test(r))
    throw new Error(
      "Datasets can only contain lowercase characters, numbers, underscores and dashes, and start with tilde, and be maximum 64 characters"
    );
}, zb = (r) => {
  if (!/^[-a-z0-9]+$/i.test(r))
    throw new Error("`projectId` can only contain only a-z, 0-9 and dashes");
}, Kb = (r) => {
  if (sl.indexOf(r) === -1)
    throw new Error(`Invalid asset type: ${r}. Must be one of ${sl.join(", ")}`);
}, Ci = (r, e) => {
  if (e === null || typeof e != "object" || Array.isArray(e))
    throw new Error(`${r}() takes an object of properties`);
}, Eh = (r, e) => {
  if (typeof e != "string" || !/^[a-z0-9_][a-z0-9_.-]{0,127}$/i.test(e) || e.includes(".."))
    throw new Error(`${r}(): "${e}" is not a valid document ID`);
}, Vs = (r, e) => {
  if (!e._id)
    throw new Error(`${r}() requires that the document contains an ID ("_id" property)`);
  Eh(r, e._id);
}, Jb = (r, e, n) => {
  const s = "insert(at, selector, items)";
  if (ol.indexOf(r) === -1) {
    const u = ol.map((a) => `"${a}"`).join(", ");
    throw new Error(`${s} takes an "at"-argument which is one of: ${u}`);
  }
  if (typeof e != "string")
    throw new Error(`${s} takes a "selector"-argument which must be a string`);
  if (!Array.isArray(n))
    throw new Error(`${s} takes an "items"-argument which must be an array`);
}, Ah = (r) => {
  if (!r.dataset)
    throw new Error("`dataset` must be provided to perform queries");
  return r.dataset || "";
}, xh = (r) => {
  if (typeof r != "string" || !/^[a-z0-9._-]{1,75}$/i.test(r))
    throw new Error(
      "Tag can only contain alphanumeric characters, underscores, dashes and dots, and be between one and 75 characters long."
    );
  return r;
};
var Xb = Object.defineProperty, Yb = (r, e, n) => e in r ? Xb(r, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[e] = n, ul = (r, e, n) => (Yb(r, typeof e != "symbol" ? e + "" : e, n), n), Sh = (r, e, n) => {
  if (!e.has(r))
    throw TypeError("Cannot " + n);
}, Gr = (r, e, n) => (Sh(r, e, "read from private field"), n ? n.call(r) : e.get(r)), Rh = (r, e, n) => {
  if (e.has(r))
    throw TypeError("Cannot add the same private member more than once");
  e instanceof WeakSet ? e.add(r) : e.set(r, n);
}, Ih = (r, e, n, s) => (Sh(r, e, "write to private field"), e.set(r, n), n);
class Oh {
  constructor(e, n = {}) {
    ul(this, "selection"), ul(this, "operations"), this.selection = e, this.operations = n;
  }
  /**
   * Sets the given attributes to the document. Does NOT merge objects.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attributes to set. To set a deep attribute, use JSONMatch, eg: \{"nested.prop": "value"\}
   */
  set(e) {
    return this._assign("set", e);
  }
  /**
   * Sets the given attributes to the document if they are not currently set. Does NOT merge objects.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attributes to set. To set a deep attribute, use JSONMatch, eg: \{"nested.prop": "value"\}
   */
  setIfMissing(e) {
    return this._assign("setIfMissing", e);
  }
  /**
   * Performs a "diff-match-patch" operation on the string attributes provided.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attributes to perform operation on. To set a deep attribute, use JSONMatch, eg: \{"nested.prop": "dmp"\}
   */
  diffMatchPatch(e) {
    return Ci("diffMatchPatch", e), this._assign("diffMatchPatch", e);
  }
  /**
   * Unsets the attribute paths provided.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs - Attribute paths to unset.
   */
  unset(e) {
    if (!Array.isArray(e))
      throw new Error("unset(attrs) takes an array of attributes to unset, non-array given");
    return this.operations = Object.assign({}, this.operations, { unset: e }), this;
  }
  /**
   * Increment a numeric value. Each entry in the argument is either an attribute or a JSON path. The value may be a positive or negative integer or floating-point value. The operation will fail if target value is not a numeric value, or doesn't exist.
   *
   * @param attrs - Object of attribute paths to increment, values representing the number to increment by.
   */
  inc(e) {
    return this._assign("inc", e);
  }
  /**
   * Decrement a numeric value. Each entry in the argument is either an attribute or a JSON path. The value may be a positive or negative integer or floating-point value. The operation will fail if target value is not a numeric value, or doesn't exist.
   *
   * @param attrs - Object of attribute paths to decrement, values representing the number to decrement by.
   */
  dec(e) {
    return this._assign("dec", e);
  }
  /**
   * Provides methods for modifying arrays, by inserting, appending and replacing elements via a JSONPath expression.
   *
   * @param at - Location to insert at, relative to the given selector, or 'replace' the matched path
   * @param selector - JSONPath expression, eg `comments[-1]` or `blocks[_key=="abc123"]`
   * @param items - Array of items to insert/replace
   */
  insert(e, n, s) {
    return Jb(e, n, s), this._assign("insert", { [e]: n, items: s });
  }
  /**
   * Append the given items to the array at the given JSONPath
   *
   * @param selector - Attribute/path to append to, eg `comments` or `person.hobbies`
   * @param items - Array of items to append to the array
   */
  append(e, n) {
    return this.insert("after", `${e}[-1]`, n);
  }
  /**
   * Prepend the given items to the array at the given JSONPath
   *
   * @param selector - Attribute/path to prepend to, eg `comments` or `person.hobbies`
   * @param items - Array of items to prepend to the array
   */
  prepend(e, n) {
    return this.insert("before", `${e}[0]`, n);
  }
  /**
   * Change the contents of an array by removing existing elements and/or adding new elements.
   *
   * @param selector - Attribute or JSONPath expression for array
   * @param start - Index at which to start changing the array (with origin 0). If greater than the length of the array, actual starting index will be set to the length of the array. If negative, will begin that many elements from the end of the array (with origin -1) and will be set to 0 if absolute value is greater than the length of the array.x
   * @param deleteCount - An integer indicating the number of old array elements to remove.
   * @param items - The elements to add to the array, beginning at the start index. If you don't specify any elements, splice() will only remove elements from the array.
   */
  splice(e, n, s, u) {
    const a = typeof s > "u" || s === -1, f = n < 0 ? n - 1 : n, l = a ? -1 : Math.max(0, n + s), d = f < 0 && l >= 0 ? "" : l, y = `${e}[${f}:${d}]`;
    return this.insert("replace", y, u || []);
  }
  /**
   * Adds a revision clause, preventing the document from being patched if the `_rev` property does not match the given value
   *
   * @param rev - Revision to lock the patch to
   */
  ifRevisionId(e) {
    return this.operations.ifRevisionID = e, this;
  }
  /**
   * Return a plain JSON representation of the patch
   */
  serialize() {
    return { ..._h(this.selection), ...this.operations };
  }
  /**
   * Return a plain JSON representation of the patch
   */
  toJSON() {
    return this.serialize();
  }
  /**
   * Clears the patch of all operations
   */
  reset() {
    return this.operations = {}, this;
  }
  _assign(e, n, s = !0) {
    return Ci(e, n), this.operations = Object.assign({}, this.operations, {
      [e]: Object.assign({}, s && this.operations[e] || {}, n)
    }), this;
  }
  _set(e, n) {
    return this._assign(e, n, !1);
  }
}
var Dr;
const Vb = class Th extends Oh {
  constructor(e, n, s) {
    super(e, n), Rh(this, Dr, void 0), Ih(this, Dr, s);
  }
  /**
   * Clones the patch
   */
  clone() {
    return new Th(this.selection, { ...this.operations }, Gr(this, Dr));
  }
  commit(e) {
    if (!Gr(this, Dr))
      throw new Error(
        "No `client` passed to patch, either provide one or pass the patch to a clients `mutate()` method"
      );
    const n = typeof this.selection == "string", s = Object.assign({ returnFirst: n, returnDocuments: !0 }, e);
    return Gr(this, Dr).mutate({ patch: this.serialize() }, s);
  }
};
Dr = /* @__PURE__ */ new WeakMap();
let Ei = Vb;
var Ur;
const Zb = class Lh extends Oh {
  constructor(e, n, s) {
    super(e, n), Rh(this, Ur, void 0), Ih(this, Ur, s);
  }
  /**
   * Clones the patch
   */
  clone() {
    return new Lh(this.selection, { ...this.operations }, Gr(this, Ur));
  }
  commit(e) {
    if (!Gr(this, Ur))
      throw new Error(
        "No `client` passed to patch, either provide one or pass the patch to a clients `mutate()` method"
      );
    const n = typeof this.selection == "string", s = Object.assign({ returnFirst: n, returnDocuments: !0 }, e);
    return Gr(this, Ur).mutate({ patch: this.serialize() }, s);
  }
};
Ur = /* @__PURE__ */ new WeakMap();
let Ai = Zb;
var Qb = Object.defineProperty, t_ = (r, e, n) => e in r ? Qb(r, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[e] = n, al = (r, e, n) => (t_(r, typeof e != "symbol" ? e + "" : e, n), n), $h = (r, e, n) => {
  if (!e.has(r))
    throw TypeError("Cannot " + n);
}, jn = (r, e, n) => ($h(r, e, "read from private field"), n ? n.call(r) : e.get(r)), Ph = (r, e, n) => {
  if (e.has(r))
    throw TypeError("Cannot add the same private member more than once");
  e instanceof WeakSet ? e.add(r) : e.set(r, n);
}, Fh = (r, e, n, s) => ($h(r, e, "write to private field"), e.set(r, n), n);
const Mh = { returnDocuments: !1 };
class Dh {
  constructor(e = [], n) {
    al(this, "operations"), al(this, "trxId"), this.operations = e, this.trxId = n;
  }
  /**
   * Creates a new Sanity document. If `_id` is provided and already exists, the mutation will fail. If no `_id` is given, one will automatically be generated by the database.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc - Document to create. Requires a `_type` property.
   */
  create(e) {
    return Ci("create", e), this._add({ create: e });
  }
  /**
   * Creates a new Sanity document. If a document with the same `_id` already exists, the create operation will be ignored.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc - Document to create if it does not already exist. Requires `_id` and `_type` properties.
   */
  createIfNotExists(e) {
    const n = "createIfNotExists";
    return Ci(n, e), Vs(n, e), this._add({ [n]: e });
  }
  /**
   * Creates a new Sanity document, or replaces an existing one if the same `_id` is already used.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc - Document to create or replace. Requires `_id` and `_type` properties.
   */
  createOrReplace(e) {
    const n = "createOrReplace";
    return Ci(n, e), Vs(n, e), this._add({ [n]: e });
  }
  /**
   * Deletes the document with the given document ID
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param documentId - Document ID to delete
   */
  delete(e) {
    return Eh("delete", e), this._add({ delete: { id: e } });
  }
  transactionId(e) {
    return e ? (this.trxId = e, this) : this.trxId;
  }
  /**
   * Return a plain JSON representation of the transaction
   */
  serialize() {
    return [...this.operations];
  }
  /**
   * Return a plain JSON representation of the transaction
   */
  toJSON() {
    return this.serialize();
  }
  /**
   * Clears the transaction of all operations
   */
  reset() {
    return this.operations = [], this;
  }
  _add(e) {
    return this.operations.push(e), this;
  }
}
var cr;
const e_ = class Uh extends Dh {
  constructor(e, n, s) {
    super(e, s), Ph(this, cr, void 0), Fh(this, cr, n);
  }
  /**
   * Clones the transaction
   */
  clone() {
    return new Uh([...this.operations], jn(this, cr), this.trxId);
  }
  commit(e) {
    if (!jn(this, cr))
      throw new Error(
        "No `client` passed to transaction, either provide one or pass the transaction to a clients `mutate()` method"
      );
    return jn(this, cr).mutate(
      this.serialize(),
      Object.assign({ transactionId: this.trxId }, Mh, e || {})
    );
  }
  patch(e, n) {
    const s = typeof n == "function";
    if (typeof e != "string" && e instanceof Ai)
      return this._add({ patch: e.serialize() });
    if (s) {
      const u = n(new Ai(e, {}, jn(this, cr)));
      if (!(u instanceof Ai))
        throw new Error("function passed to `patch()` must return the patch");
      return this._add({ patch: u.serialize() });
    }
    return this._add({ patch: { id: e, ...n } });
  }
};
cr = /* @__PURE__ */ new WeakMap();
let kh = e_;
var fr;
const n_ = class Nh extends Dh {
  constructor(e, n, s) {
    super(e, s), Ph(this, fr, void 0), Fh(this, fr, n);
  }
  /**
   * Clones the transaction
   */
  clone() {
    return new Nh([...this.operations], jn(this, fr), this.trxId);
  }
  commit(e) {
    if (!jn(this, fr))
      throw new Error(
        "No `client` passed to transaction, either provide one or pass the transaction to a clients `mutate()` method"
      );
    return jn(this, fr).mutate(
      this.serialize(),
      Object.assign({ transactionId: this.trxId }, Mh, e || {})
    );
  }
  patch(e, n) {
    const s = typeof n == "function";
    if (typeof e != "string" && e instanceof Ei)
      return this._add({ patch: e.serialize() });
    if (s) {
      const u = n(new Ei(e, {}, jn(this, fr)));
      if (!(u instanceof Ei))
        throw new Error("function passed to `patch()` must return the patch");
      return this._add({ patch: u.serialize() });
    }
    return this._add({ patch: { id: e, ...n } });
  }
};
fr = /* @__PURE__ */ new WeakMap();
let qh = n_;
const r_ = "https://www.sanity.io/help/";
function ha(r) {
  return r_ + r;
}
function i_(r) {
  let e = !1, n;
  return (...s) => (e || (n = r(...s), e = !0), n);
}
const Oi = (r) => (
  // eslint-disable-next-line no-console
  i_((...e) => console.warn(r.join(" "), ...e))
), s_ = Oi([
  "Because you set `withCredentials` to true, we will override your `useCdn`",
  "setting to be false since (cookie-based) credentials are never set on the CDN"
]), o_ = Oi([
  "Since you haven't set a value for `useCdn`, we will deliver content using our",
  "global, edge-cached API-CDN. If you wish to have content delivered faster, set",
  "`useCdn: false` to use the Live API. Note: You may incur higher costs using the live API."
]), u_ = Oi([
  "The Sanity client is configured with the `perspective` set to `previewDrafts`, which doesn't support the API-CDN.",
  "The Live API will be used instead. Set `useCdn: false` in your configuration to hide this warning."
]), a_ = Oi([
  "You have configured Sanity client to use a token in the browser. This may cause unintentional security issues.",
  `See ${ha(
    "js-client-browser-token"
  )} for more information and how to hide this warning.`
]), c_ = Oi([
  "Using the Sanity client without specifying an API version is deprecated.",
  `See ${ha("js-client-api-version")}`
]), f_ = "apicdn.sanity.io", xi = {
  apiHost: "https://api.sanity.io",
  apiVersion: "1",
  useProjectHostname: !0,
  stega: { enabled: !1 }
}, l_ = ["localhost", "127.0.0.1", "0.0.0.0"], h_ = (r) => l_.indexOf(r) !== -1;
function d_(r) {
  if (r === "1" || r === "X")
    return;
  const e = new Date(r);
  if (!(/^\d{4}-\d{2}-\d{2}$/.test(r) && e instanceof Date && e.getTime() > 0))
    throw new Error("Invalid API version string, expected `1` or date in format `YYYY-MM-DD`");
}
const Wh = function(r) {
  switch (r) {
    case "previewDrafts":
    case "published":
    case "raw":
      return;
    default:
      throw new TypeError(
        "Invalid API perspective string, expected `published`, `previewDrafts` or `raw`"
      );
  }
}, Bh = (r, e) => {
  const n = {
    ...e,
    ...r,
    stega: {
      ...typeof e.stega == "boolean" ? { enabled: e.stega } : e.stega || xi.stega,
      ...typeof r.stega == "boolean" ? { enabled: r.stega } : r.stega || {}
    }
  };
  n.apiVersion || c_();
  const s = {
    ...xi,
    ...n
  }, u = s.useProjectHostname;
  if (typeof Promise > "u") {
    const m = ha("js-client-promise-polyfill");
    throw new Error(`No native Promise-implementation found, polyfill needed - see ${m}`);
  }
  if (u && !s.projectId)
    throw new Error("Configuration must contain `projectId`");
  if (typeof s.perspective == "string" && Wh(s.perspective), "encodeSourceMap" in s)
    throw new Error(
      "It looks like you're using options meant for '@sanity/preview-kit/client'. 'encodeSourceMap' is not supported in '@sanity/client'. Did you mean 'stega.enabled'?"
    );
  if ("encodeSourceMapAtPath" in s)
    throw new Error(
      "It looks like you're using options meant for '@sanity/preview-kit/client'. 'encodeSourceMapAtPath' is not supported in '@sanity/client'. Did you mean 'stega.filter'?"
    );
  if (typeof s.stega.enabled != "boolean")
    throw new Error(`stega.enabled must be a boolean, received ${s.stega.enabled}`);
  if (s.stega.enabled && s.stega.studioUrl === void 0)
    throw new Error("stega.studioUrl must be defined when stega.enabled is true");
  if (s.stega.enabled && typeof s.stega.studioUrl != "string" && typeof s.stega.studioUrl != "function")
    throw new Error(
      `stega.studioUrl must be a string or a function, received ${s.stega.studioUrl}`
    );
  const a = typeof window < "u" && location && location.hostname, f = a && h_(location.hostname);
  a && f && s.token && s.ignoreBrowserTokenWarning !== !0 ? a_() : typeof s.useCdn > "u" && o_(), u && zb(s.projectId), s.dataset && Ch(s.dataset), "requestTagPrefix" in s && (s.requestTagPrefix = s.requestTagPrefix ? xh(s.requestTagPrefix).replace(/\.+$/, "") : void 0), s.apiVersion = `${s.apiVersion}`.replace(/^v/, ""), s.isDefaultApi = s.apiHost === xi.apiHost, s.useCdn === !0 && s.withCredentials && s_(), s.useCdn = s.useCdn !== !1 && !s.withCredentials, d_(s.apiVersion);
  const l = s.apiHost.split("://", 2), d = l[0], y = l[1], p = s.isDefaultApi ? f_ : y;
  return s.useProjectHostname ? (s.url = `${d}://${s.projectId}.${y}/v${s.apiVersion}`, s.cdnUrl = `${d}://${s.projectId}.${p}/v${s.apiVersion}`) : (s.url = `${s.apiHost}/v${s.apiVersion}`, s.cdnUrl = s.url), s;
}, p_ = "X-Sanity-Project-ID";
function g_(r, e = {}) {
  const n = {}, s = e.token || r.token;
  s && (n.Authorization = `Bearer ${s}`), !e.useGlobalApi && !r.useProjectHostname && r.projectId && (n[p_] = r.projectId);
  const u = !!(typeof e.withCredentials > "u" ? r.token || r.withCredentials : e.withCredentials), a = typeof e.timeout > "u" ? r.timeout : e.timeout;
  return Object.assign({}, e, {
    headers: Object.assign({}, n, e.headers || {}),
    timeout: typeof a > "u" ? 5 * 60 * 1e3 : a,
    proxy: e.proxy || r.proxy,
    json: !0,
    withCredentials: u,
    fetch: typeof e.fetch == "object" && typeof r.fetch == "object" ? { ...r.fetch, ...e.fetch } : e.fetch || r.fetch
  });
}
const Hh = ({
  query: r,
  params: e = {},
  options: n = {}
}) => {
  const s = new URLSearchParams(), { tag: u, returnQuery: a, ...f } = n;
  u && s.append("tag", u), s.append("query", r);
  for (const [l, d] of Object.entries(e))
    s.append(`$${l}`, JSON.stringify(d));
  for (const [l, d] of Object.entries(f))
    d && s.append(l, `${d}`);
  return a === !1 && s.append("returnQuery", "false"), `?${s}`;
}, v_ = (r, e) => r === !1 ? void 0 : typeof r > "u" ? e : r, m_ = (r = {}) => ({
  dryRun: r.dryRun,
  returnIds: !0,
  returnDocuments: v_(r.returnDocuments, !0),
  visibility: r.visibility || "sync",
  autoGenerateArrayKeys: r.autoGenerateArrayKeys,
  skipCrossDatasetReferenceValidation: r.skipCrossDatasetReferenceValidation
}), da = (r) => r.type === "response", y_ = (r) => r.body, w_ = (r, e) => r.reduce((n, s) => (n[e(s)] = s, n), /* @__PURE__ */ Object.create(null)), b_ = 11264;
function Gh(r, e, n, s, u = {}, a = {}) {
  const f = "stega" in a ? {
    ...n || {},
    ...typeof a.stega == "boolean" ? { enabled: a.stega } : a.stega || {}
  } : n, l = f.enabled ? Pb(u) : u, d = a.filterResponse === !1 ? (I) => I : (I) => I.result, { cache: y, next: p, ...m } = {
    // Opt out of setting a `signal` on an internal `fetch` if one isn't provided.
    // This is necessary in React Server Components to avoid opting out of Request Memoization.
    useAbortSignal: typeof a.signal < "u",
    // Set `resultSourceMap' when stega is enabled, as it's required for encoding.
    resultSourceMap: f.enabled ? "withKeyArraySelector" : a.resultSourceMap,
    ...a,
    // Default to not returning the query, unless `filterResponse` is `false`,
    // or `returnQuery` is explicitly set. `true` is the default in Content Lake, so skip if truthy
    returnQuery: a.filterResponse === !1 && a.returnQuery !== !1
  }, b = typeof y < "u" || typeof p < "u" ? { ...m, fetch: { cache: y, next: p } } : m, C = Xr(r, e, "query", { query: s, params: l }, b);
  return f.enabled ? C.pipe(
    yb(
      Ii(
        Promise.resolve().then(() => qE).then(function(I) {
          return I.stegaEncodeSourceMap$1;
        }).then(
          ({ stegaEncodeSourceMap: I }) => I
        )
      )
    ),
    Lt(
      ([I, O]) => {
        const R = O(I.result, I.resultSourceMap, f);
        return d({ ...I, result: R });
      }
    )
  ) : C.pipe(Lt(d));
}
function jh(r, e, n, s = {}) {
  const u = { uri: mr(r, "doc", n), json: !0, tag: s.tag };
  return Ti(r, e, u).pipe(
    Xe(da),
    Lt((a) => a.body.documents && a.body.documents[0])
  );
}
function zh(r, e, n, s = {}) {
  const u = { uri: mr(r, "doc", n.join(",")), json: !0, tag: s.tag };
  return Ti(r, e, u).pipe(
    Xe(da),
    Lt((a) => {
      const f = w_(a.body.documents || [], (l) => l._id);
      return n.map((l) => f[l] || null);
    })
  );
}
function Kh(r, e, n, s) {
  return Vs("createIfNotExists", n), go(r, e, n, "createIfNotExists", s);
}
function Jh(r, e, n, s) {
  return Vs("createOrReplace", n), go(r, e, n, "createOrReplace", s);
}
function Xh(r, e, n, s) {
  return Xr(
    r,
    e,
    "mutate",
    { mutations: [{ delete: _h(n) }] },
    s
  );
}
function Yh(r, e, n, s) {
  let u;
  n instanceof Ai || n instanceof Ei ? u = { patch: n.serialize() } : n instanceof kh || n instanceof qh ? u = n.serialize() : u = n;
  const a = Array.isArray(u) ? u : [u], f = s && s.transactionId || void 0;
  return Xr(r, e, "mutate", { mutations: a, transactionId: f }, s);
}
function Vh(r, e, n, s) {
  const u = Array.isArray(n) ? n : [n], a = s && s.transactionId || void 0, f = s && s.skipCrossDatasetReferenceValidation || void 0, l = s && s.dryRun || void 0;
  return Xr(
    r,
    e,
    "actions",
    { actions: u, transactionId: a, skipCrossDatasetReferenceValidation: f, dryRun: l },
    s
  );
}
function Xr(r, e, n, s, u = {}) {
  const a = n === "mutate", f = n === "actions", l = n === "query", d = a || f ? "" : Hh(s), y = !a && !f && d.length < b_, p = y ? d : "", m = u.returnFirst, { timeout: b, token: C, tag: I, headers: O, returnQuery: R, lastLiveEventId: x } = u, D = mr(r, n, p), U = {
    method: y ? "GET" : "POST",
    uri: D,
    json: !0,
    body: y ? void 0 : s,
    query: a && m_(u),
    timeout: b,
    headers: O,
    token: C,
    tag: I,
    returnQuery: R,
    perspective: u.perspective,
    resultSourceMap: u.resultSourceMap,
    lastLiveEventId: Array.isArray(x) ? x[0] : x,
    canUseCdn: l,
    signal: u.signal,
    fetch: u.fetch,
    useAbortSignal: u.useAbortSignal,
    useCdn: u.useCdn
  };
  return Ti(r, e, U).pipe(
    Xe(da),
    Lt(y_),
    Lt((M) => {
      if (!a)
        return M;
      const z = M.results || [];
      if (u.returnDocuments)
        return m ? z[0] && z[0].document : z.map((xt) => xt.document);
      const ht = m ? "documentId" : "documentIds", _t = m ? z[0] && z[0].id : z.map((xt) => xt.id);
      return {
        transactionId: M.transactionId,
        results: z,
        [ht]: _t
      };
    })
  );
}
function go(r, e, n, s, u = {}) {
  const a = { [s]: n }, f = Object.assign({ returnFirst: !0, returnDocuments: !0 }, u);
  return Xr(r, e, "mutate", { mutations: [a] }, f);
}
function Ti(r, e, n) {
  var s, u;
  const a = n.url || n.uri, f = r.config(), l = typeof n.canUseCdn > "u" ? ["GET", "HEAD"].indexOf(n.method || "GET") >= 0 && a.indexOf("/data/") === 0 : n.canUseCdn;
  let d = ((s = n.useCdn) != null ? s : f.useCdn) && l;
  const y = n.tag && f.requestTagPrefix ? [f.requestTagPrefix, n.tag].join(".") : n.tag || f.requestTagPrefix;
  if (y && n.tag !== null && (n.query = { tag: xh(y), ...n.query }), ["GET", "HEAD", "POST"].indexOf(n.method || "GET") >= 0 && a.indexOf("/data/query/") === 0) {
    const b = (u = n.resultSourceMap) != null ? u : f.resultSourceMap;
    b !== void 0 && b !== !1 && (n.query = { resultSourceMap: b, ...n.query });
    const C = n.perspective || f.perspective;
    typeof C == "string" && C !== "raw" && (Wh(C), n.query = { perspective: C, ...n.query }, C === "previewDrafts" && d && (d = !1, u_())), n.lastLiveEventId && (n.query = { ...n.query, lastLiveEventId: n.lastLiveEventId }), n.returnQuery === !1 && (n.query = { returnQuery: "false", ...n.query });
  }
  const p = g_(
    f,
    Object.assign({}, n, {
      url: pa(r, a, d)
    })
  ), m = new Mt(
    (b) => e(p, f.requester).subscribe(b)
  );
  return n.signal ? m.pipe(__(n.signal)) : m;
}
function Ze(r, e, n) {
  return Ti(r, e, n).pipe(
    Xe((s) => s.type === "response"),
    Lt((s) => s.body)
  );
}
function mr(r, e, n) {
  const s = r.config(), u = Ah(s), a = `/${e}/${u}`;
  return `/data${n ? `${a}/${n}` : a}`.replace(/\/($|\?)/, "$1");
}
function pa(r, e, n = !1) {
  const { url: s, cdnUrl: u } = r.config();
  return `${n ? u : s}/${e.replace(/^\//, "")}`;
}
function __(r) {
  return (e) => new Mt((n) => {
    const s = () => n.error(E_(r));
    if (r && r.aborted) {
      s();
      return;
    }
    const u = e.subscribe(n);
    return r.addEventListener("abort", s), () => {
      r.removeEventListener("abort", s), u.unsubscribe();
    };
  });
}
const C_ = !!globalThis.DOMException;
function E_(r) {
  var e, n;
  if (C_)
    return new DOMException((e = r == null ? void 0 : r.reason) != null ? e : "The operation was aborted.", "AbortError");
  const s = new Error((n = r == null ? void 0 : r.reason) != null ? n : "The operation was aborted.");
  return s.name = "AbortError", s;
}
var Zh = (r, e, n) => {
  if (!e.has(r))
    throw TypeError("Cannot " + n);
}, Zs = (r, e, n) => (Zh(r, e, "read from private field"), n ? n.call(r) : e.get(r)), Qs = (r, e, n) => {
  if (e.has(r))
    throw TypeError("Cannot add the same private member more than once");
  e instanceof WeakSet ? e.add(r) : e.set(r, n);
}, to = (r, e, n, s) => (Zh(r, e, "write to private field"), e.set(r, n), n), qs, Ws;
class A_ {
  constructor(e, n) {
    Qs(this, qs, void 0), Qs(this, Ws, void 0), to(this, qs, e), to(this, Ws, n);
  }
  upload(e, n, s) {
    return Qh(Zs(this, qs), Zs(this, Ws), e, n, s);
  }
}
qs = /* @__PURE__ */ new WeakMap(), Ws = /* @__PURE__ */ new WeakMap();
var Bs, Hs;
class x_ {
  constructor(e, n) {
    Qs(this, Bs, void 0), Qs(this, Hs, void 0), to(this, Bs, e), to(this, Hs, n);
  }
  upload(e, n, s) {
    const u = Qh(Zs(this, Bs), Zs(this, Hs), e, n, s);
    return Ht(
      u.pipe(
        Xe((a) => a.type === "response"),
        Lt(
          (a) => a.body.document
        )
      )
    );
  }
}
Bs = /* @__PURE__ */ new WeakMap(), Hs = /* @__PURE__ */ new WeakMap();
function Qh(r, e, n, s, u = {}) {
  Kb(n);
  let a = u.extract || void 0;
  a && !a.length && (a = ["none"]);
  const f = Ah(r.config()), l = n === "image" ? "images" : "files", d = S_(u, s), { tag: y, label: p, title: m, description: b, creditLine: C, filename: I, source: O } = d, R = {
    label: p,
    title: m,
    description: b,
    filename: I,
    meta: a,
    creditLine: C
  };
  return O && (R.sourceId = O.id, R.sourceName = O.name, R.sourceUrl = O.url), Ti(r, e, {
    tag: y,
    method: "POST",
    timeout: d.timeout || 0,
    uri: `/assets/${l}/${f}`,
    headers: d.contentType ? { "Content-Type": d.contentType } : {},
    query: R,
    body: s
  });
}
function S_(r, e) {
  return typeof File > "u" || !(e instanceof File) ? r : Object.assign(
    {
      filename: r.preserveFilename === !1 ? void 0 : e.name,
      contentType: e.type
    },
    r
  );
}
var R_ = (r, e) => Object.keys(e).concat(Object.keys(r)).reduce((n, s) => (n[s] = typeof r[s] > "u" ? e[s] : r[s], n), {});
const I_ = (r, e) => e.reduce((n, s) => (typeof r[s] > "u" || (n[s] = r[s]), n), {}), O_ = 14800, T_ = [
  "includePreviousRevision",
  "includeResult",
  "visibility",
  "effectFormat",
  "tag"
], L_ = {
  includeResult: !0
};
function td(r, e, n = {}) {
  const { url: s, token: u, withCredentials: a, requestTagPrefix: f } = this.config(), l = n.tag && f ? [f, n.tag].join(".") : n.tag, d = { ...R_(n, L_), tag: l }, y = I_(d, T_), p = Hh({ query: r, params: e, options: { tag: l, ...y } }), m = `${s}${mr(this, "listen", p)}`;
  if (m.length > O_)
    return new Mt((O) => O.error(new Error("Query too large for listener")));
  const b = d.events ? d.events : ["mutation"], C = b.indexOf("reconnect") !== -1, I = {};
  return (u || a) && (I.withCredentials = !0), u && (I.headers = {
    Authorization: `Bearer ${u}`
  }), new Mt((O) => {
    let R, x, D = !1, U = !1;
    an();
    function M() {
      D || (Te(), !D && R.readyState === R.CLOSED && (xt(), clearTimeout(x), x = setTimeout(an, 100)));
    }
    function z(zt) {
      O.error($_(zt));
    }
    function ht(zt) {
      const Qt = ed(zt);
      return Qt instanceof Error ? O.error(Qt) : O.next(Qt);
    }
    function _t() {
      D = !0, xt(), O.complete();
    }
    function xt() {
      R && (R.removeEventListener("error", M), R.removeEventListener("channelError", z), R.removeEventListener("disconnect", _t), b.forEach((zt) => R.removeEventListener(zt, ht)), R.close());
    }
    function Te() {
      C && O.next({ type: "reconnect" });
    }
    async function qe() {
      const { default: zt } = await Promise.resolve().then(() => Id);
      if (U)
        return;
      const Qt = new zt(m, I);
      return Qt.addEventListener("error", M), Qt.addEventListener("channelError", z), Qt.addEventListener("disconnect", _t), b.forEach((yr) => Qt.addEventListener(yr, ht)), Qt;
    }
    function an() {
      qe().then((zt) => {
        zt && (R = zt, U && xt());
      }).catch((zt) => {
        O.error(zt), We();
      });
    }
    function We() {
      D = !0, xt(), U = !0;
    }
    return We;
  });
}
function ed(r) {
  try {
    const e = r.data && JSON.parse(r.data) || {};
    return Object.assign({ type: r.type }, e);
  } catch (e) {
    return e;
  }
}
function $_(r) {
  if (r instanceof Error)
    return r;
  const e = ed(r);
  return e instanceof Error ? e : new Error(P_(e));
}
function P_(r) {
  return r.error ? r.error.description ? r.error.description : typeof r.error == "string" ? r.error : JSON.stringify(r.error, null, 2) : r.message || "Unknown listener error";
}
var nd = (r, e, n) => {
  if (!e.has(r))
    throw TypeError("Cannot " + n);
}, Du = (r, e, n) => (nd(r, e, "read from private field"), n ? n.call(r) : e.get(r)), F_ = (r, e, n) => {
  if (e.has(r))
    throw TypeError("Cannot add the same private member more than once");
  e instanceof WeakSet ? e.add(r) : e.set(r, n);
}, M_ = (r, e, n, s) => (nd(r, e, "write to private field"), e.set(r, n), n);
const cl = "2021-03-26";
var kr;
class rd {
  constructor(e) {
    F_(this, kr, void 0), M_(this, kr, e);
  }
  /**
   * Requires `apiVersion` to be `2021-03-26` or later.
   */
  events() {
    const e = Du(this, kr).config().apiVersion.replace(/^v/, "");
    if (e !== "X" && e < cl)
      throw new Error(
        `The live events API requires API version ${cl} or later. The current API version is ${e}. Please update your API version to use this feature.`
      );
    const n = mr(Du(this, kr), "live/events"), s = new URL(Du(this, kr).getUrl(n, !1)), u = ["restart", "message"];
    return new Mt((a) => {
      let f, l, d = !1, y = !1;
      I();
      function p(R) {
        if (!d) {
          if ("data" in R) {
            const x = fl(R);
            a.error(new Error(x.message, { cause: x }));
          }
          f.readyState === f.CLOSED && (b(), clearTimeout(l), l = setTimeout(I, 100));
        }
      }
      function m(R) {
        const x = fl(R);
        return x instanceof Error ? a.error(x) : a.next(x);
      }
      function b() {
        if (f) {
          f.removeEventListener("error", p);
          for (const R of u)
            f.removeEventListener(R, m);
          f.close();
        }
      }
      async function C() {
        const R = typeof EventSource > "u" ? (await Promise.resolve().then(() => Id)).default : EventSource;
        if (y)
          return;
        const x = new R(s.toString());
        x.addEventListener("error", p);
        for (const D of u)
          x.addEventListener(D, m);
        return x;
      }
      function I() {
        C().then((R) => {
          R && (f = R, y && b());
        }).catch((R) => {
          a.error(R), O();
        });
      }
      function O() {
        d = !0, b(), y = !0;
      }
      return O;
    });
  }
}
kr = /* @__PURE__ */ new WeakMap();
function fl(r) {
  try {
    const e = r.data && JSON.parse(r.data) || {};
    return { type: r.type, id: r.lastEventId, ...e };
  } catch (e) {
    return e;
  }
}
var id = (r, e, n) => {
  if (!e.has(r))
    throw TypeError("Cannot " + n);
}, ie = (r, e, n) => (id(r, e, "read from private field"), n ? n.call(r) : e.get(r)), eo = (r, e, n) => {
  if (e.has(r))
    throw TypeError("Cannot add the same private member more than once");
  e instanceof WeakSet ? e.add(r) : e.set(r, n);
}, no = (r, e, n, s) => (id(r, e, "write to private field"), e.set(r, n), n), lr, hr;
class D_ {
  constructor(e, n) {
    eo(this, lr, void 0), eo(this, hr, void 0), no(this, lr, e), no(this, hr, n);
  }
  /**
   * Create a new dataset with the given name
   *
   * @param name - Name of the dataset to create
   * @param options - Options for the dataset
   */
  create(e, n) {
    return jr(ie(this, lr), ie(this, hr), "PUT", e, n);
  }
  /**
   * Edit a dataset with the given name
   *
   * @param name - Name of the dataset to edit
   * @param options - New options for the dataset
   */
  edit(e, n) {
    return jr(ie(this, lr), ie(this, hr), "PATCH", e, n);
  }
  /**
   * Delete a dataset with the given name
   *
   * @param name - Name of the dataset to delete
   */
  delete(e) {
    return jr(ie(this, lr), ie(this, hr), "DELETE", e);
  }
  /**
   * Fetch a list of datasets for the configured project
   */
  list() {
    return Ze(ie(this, lr), ie(this, hr), {
      uri: "/datasets",
      tag: null
    });
  }
}
lr = /* @__PURE__ */ new WeakMap(), hr = /* @__PURE__ */ new WeakMap();
var dr, pr;
class U_ {
  constructor(e, n) {
    eo(this, dr, void 0), eo(this, pr, void 0), no(this, dr, e), no(this, pr, n);
  }
  /**
   * Create a new dataset with the given name
   *
   * @param name - Name of the dataset to create
   * @param options - Options for the dataset
   */
  create(e, n) {
    return Ht(
      jr(ie(this, dr), ie(this, pr), "PUT", e, n)
    );
  }
  /**
   * Edit a dataset with the given name
   *
   * @param name - Name of the dataset to edit
   * @param options - New options for the dataset
   */
  edit(e, n) {
    return Ht(
      jr(ie(this, dr), ie(this, pr), "PATCH", e, n)
    );
  }
  /**
   * Delete a dataset with the given name
   *
   * @param name - Name of the dataset to delete
   */
  delete(e) {
    return Ht(jr(ie(this, dr), ie(this, pr), "DELETE", e));
  }
  /**
   * Fetch a list of datasets for the configured project
   */
  list() {
    return Ht(
      Ze(ie(this, dr), ie(this, pr), { uri: "/datasets", tag: null })
    );
  }
}
dr = /* @__PURE__ */ new WeakMap(), pr = /* @__PURE__ */ new WeakMap();
function jr(r, e, n, s, u) {
  return Ch(s), Ze(r, e, {
    method: n,
    uri: `/datasets/${s}`,
    body: u,
    tag: null
  });
}
var sd = (r, e, n) => {
  if (!e.has(r))
    throw TypeError("Cannot " + n);
}, zn = (r, e, n) => (sd(r, e, "read from private field"), n ? n.call(r) : e.get(r)), ro = (r, e, n) => {
  if (e.has(r))
    throw TypeError("Cannot add the same private member more than once");
  e instanceof WeakSet ? e.add(r) : e.set(r, n);
}, io = (r, e, n, s) => (sd(r, e, "write to private field"), e.set(r, n), n), yi, wi;
class k_ {
  constructor(e, n) {
    ro(this, yi, void 0), ro(this, wi, void 0), io(this, yi, e), io(this, wi, n);
  }
  list(e) {
    const n = (e == null ? void 0 : e.includeMembers) === !1 ? "/projects?includeMembers=false" : "/projects";
    return Ze(zn(this, yi), zn(this, wi), { uri: n });
  }
  /**
   * Fetch a project by project ID
   *
   * @param projectId - ID of the project to fetch
   */
  getById(e) {
    return Ze(zn(this, yi), zn(this, wi), { uri: `/projects/${e}` });
  }
}
yi = /* @__PURE__ */ new WeakMap(), wi = /* @__PURE__ */ new WeakMap();
var bi, _i;
class N_ {
  constructor(e, n) {
    ro(this, bi, void 0), ro(this, _i, void 0), io(this, bi, e), io(this, _i, n);
  }
  list(e) {
    const n = (e == null ? void 0 : e.includeMembers) === !1 ? "/projects?includeMembers=false" : "/projects";
    return Ht(Ze(zn(this, bi), zn(this, _i), { uri: n }));
  }
  /**
   * Fetch a project by project ID
   *
   * @param projectId - ID of the project to fetch
   */
  getById(e) {
    return Ht(
      Ze(zn(this, bi), zn(this, _i), { uri: `/projects/${e}` })
    );
  }
}
bi = /* @__PURE__ */ new WeakMap(), _i = /* @__PURE__ */ new WeakMap();
var od = (r, e, n) => {
  if (!e.has(r))
    throw TypeError("Cannot " + n);
}, so = (r, e, n) => (od(r, e, "read from private field"), n ? n.call(r) : e.get(r)), oo = (r, e, n) => {
  if (e.has(r))
    throw TypeError("Cannot add the same private member more than once");
  e instanceof WeakSet ? e.add(r) : e.set(r, n);
}, uo = (r, e, n, s) => (od(r, e, "write to private field"), e.set(r, n), n), Gs, js;
class q_ {
  constructor(e, n) {
    oo(this, Gs, void 0), oo(this, js, void 0), uo(this, Gs, e), uo(this, js, n);
  }
  /**
   * Fetch a user by user ID
   *
   * @param id - User ID of the user to fetch. If `me` is provided, a minimal response including the users role is returned.
   */
  getById(e) {
    return Ze(
      so(this, Gs),
      so(this, js),
      { uri: `/users/${e}` }
    );
  }
}
Gs = /* @__PURE__ */ new WeakMap(), js = /* @__PURE__ */ new WeakMap();
var zs, Ks;
class W_ {
  constructor(e, n) {
    oo(this, zs, void 0), oo(this, Ks, void 0), uo(this, zs, e), uo(this, Ks, n);
  }
  /**
   * Fetch a user by user ID
   *
   * @param id - User ID of the user to fetch. If `me` is provided, a minimal response including the users role is returned.
   */
  getById(e) {
    return Ht(
      Ze(so(this, zs), so(this, Ks), {
        uri: `/users/${e}`
      })
    );
  }
}
zs = /* @__PURE__ */ new WeakMap(), Ks = /* @__PURE__ */ new WeakMap();
var B_ = Object.defineProperty, H_ = (r, e, n) => e in r ? B_(r, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[e] = n, Ie = (r, e, n) => (H_(r, typeof e != "symbol" ? e + "" : e, n), n), ud = (r, e, n) => {
  if (!e.has(r))
    throw TypeError("Cannot " + n);
}, et = (r, e, n) => (ud(r, e, "read from private field"), n ? n.call(r) : e.get(r)), ao = (r, e, n) => {
  if (e.has(r))
    throw TypeError("Cannot add the same private member more than once");
  e instanceof WeakSet ? e.add(r) : e.set(r, n);
}, co = (r, e, n, s) => (ud(r, e, "write to private field"), e.set(r, n), n), Wn, Bt;
const G_ = class Qu {
  constructor(e, n = xi) {
    Ie(this, "assets"), Ie(this, "datasets"), Ie(this, "live"), Ie(this, "projects"), Ie(this, "users"), ao(this, Wn, void 0), ao(this, Bt, void 0), Ie(this, "listen", td), this.config(n), co(this, Bt, e), this.assets = new A_(this, et(this, Bt)), this.datasets = new D_(this, et(this, Bt)), this.live = new rd(this), this.projects = new k_(this, et(this, Bt)), this.users = new q_(this, et(this, Bt));
  }
  /**
   * Clone the client - returns a new instance
   */
  clone() {
    return new Qu(et(this, Bt), this.config());
  }
  config(e) {
    if (e === void 0)
      return { ...et(this, Wn) };
    if (et(this, Wn) && et(this, Wn).allowReconfigure === !1)
      throw new Error(
        "Existing client instance cannot be reconfigured - use `withConfig(newConfig)` to return a new client"
      );
    return co(this, Wn, Bh(e, et(this, Wn) || {})), this;
  }
  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig - New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(e) {
    const n = this.config();
    return new Qu(et(this, Bt), {
      ...n,
      ...e,
      stega: {
        ...n.stega || {},
        ...typeof (e == null ? void 0 : e.stega) == "boolean" ? { enabled: e.stega } : (e == null ? void 0 : e.stega) || {}
      }
    });
  }
  fetch(e, n, s) {
    return Gh(
      this,
      et(this, Bt),
      et(this, Wn).stega,
      e,
      n,
      s
    );
  }
  /**
   * Fetch a single document with the given ID.
   *
   * @param id - Document ID to fetch
   * @param options - Request options
   */
  getDocument(e, n) {
    return jh(this, et(this, Bt), e, n);
  }
  /**
   * Fetch multiple documents in one request.
   * Should be used sparingly - performing a query is usually a better option.
   * The order/position of documents is preserved based on the original array of IDs.
   * If any of the documents are missing, they will be replaced by a `null` entry in the returned array
   *
   * @param ids - Document IDs to fetch
   * @param options - Request options
   */
  getDocuments(e, n) {
    return zh(this, et(this, Bt), e, n);
  }
  create(e, n) {
    return go(this, et(this, Bt), e, "create", n);
  }
  createIfNotExists(e, n) {
    return Kh(this, et(this, Bt), e, n);
  }
  createOrReplace(e, n) {
    return Jh(this, et(this, Bt), e, n);
  }
  delete(e, n) {
    return Xh(this, et(this, Bt), e, n);
  }
  mutate(e, n) {
    return Yh(this, et(this, Bt), e, n);
  }
  /**
   * Create a new buildable patch of operations to perform
   *
   * @param selection - Document ID, an array of document IDs, or an object with `query` and optional `params`, defining which document(s) to patch
   * @param operations - Optional object of patch operations to initialize the patch instance with
   * @returns Patch instance - call `.commit()` to perform the operations defined
   */
  patch(e, n) {
    return new Ei(e, n, this);
  }
  /**
   * Create a new transaction of mutations
   *
   * @param operations - Optional array of mutation operations to initialize the transaction instance with
   */
  transaction(e) {
    return new qh(e, this);
  }
  /**
   * Perform action operations against the configured dataset
   *
   * @param operations - Action operation(s) to execute
   * @param options - Action options
   */
  action(e, n) {
    return Vh(this, et(this, Bt), e, n);
  }
  /**
   * Perform an HTTP request against the Sanity API
   *
   * @param options - Request options
   */
  request(e) {
    return Ze(this, et(this, Bt), e);
  }
  /**
   * Get a Sanity API URL for the URI provided
   *
   * @param uri - URI/path to build URL for
   * @param canUseCdn - Whether or not to allow using the API CDN for this route
   */
  getUrl(e, n) {
    return pa(this, e, n);
  }
  /**
   * Get a Sanity API URL for the data operation and path provided
   *
   * @param operation - Data operation (eg `query`, `mutate`, `listen` or similar)
   * @param path - Path to append after the operation
   */
  getDataUrl(e, n) {
    return mr(this, e, n);
  }
};
Wn = /* @__PURE__ */ new WeakMap(), Bt = /* @__PURE__ */ new WeakMap();
let j_ = G_;
var Bn, Ut;
const z_ = class ta {
  constructor(e, n = xi) {
    Ie(this, "assets"), Ie(this, "datasets"), Ie(this, "live"), Ie(this, "projects"), Ie(this, "users"), Ie(this, "observable"), ao(this, Bn, void 0), ao(this, Ut, void 0), Ie(this, "listen", td), this.config(n), co(this, Ut, e), this.assets = new x_(this, et(this, Ut)), this.datasets = new U_(this, et(this, Ut)), this.live = new rd(this), this.projects = new N_(this, et(this, Ut)), this.users = new W_(this, et(this, Ut)), this.observable = new j_(e, n);
  }
  /**
   * Clone the client - returns a new instance
   */
  clone() {
    return new ta(et(this, Ut), this.config());
  }
  config(e) {
    if (e === void 0)
      return { ...et(this, Bn) };
    if (et(this, Bn) && et(this, Bn).allowReconfigure === !1)
      throw new Error(
        "Existing client instance cannot be reconfigured - use `withConfig(newConfig)` to return a new client"
      );
    return this.observable && this.observable.config(e), co(this, Bn, Bh(e, et(this, Bn) || {})), this;
  }
  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig - New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(e) {
    const n = this.config();
    return new ta(et(this, Ut), {
      ...n,
      ...e,
      stega: {
        ...n.stega || {},
        ...typeof (e == null ? void 0 : e.stega) == "boolean" ? { enabled: e.stega } : (e == null ? void 0 : e.stega) || {}
      }
    });
  }
  fetch(e, n, s) {
    return Ht(
      Gh(
        this,
        et(this, Ut),
        et(this, Bn).stega,
        e,
        n,
        s
      )
    );
  }
  /**
   * Fetch a single document with the given ID.
   *
   * @param id - Document ID to fetch
   * @param options - Request options
   */
  getDocument(e, n) {
    return Ht(jh(this, et(this, Ut), e, n));
  }
  /**
   * Fetch multiple documents in one request.
   * Should be used sparingly - performing a query is usually a better option.
   * The order/position of documents is preserved based on the original array of IDs.
   * If any of the documents are missing, they will be replaced by a `null` entry in the returned array
   *
   * @param ids - Document IDs to fetch
   * @param options - Request options
   */
  getDocuments(e, n) {
    return Ht(zh(this, et(this, Ut), e, n));
  }
  create(e, n) {
    return Ht(
      go(this, et(this, Ut), e, "create", n)
    );
  }
  createIfNotExists(e, n) {
    return Ht(
      Kh(this, et(this, Ut), e, n)
    );
  }
  createOrReplace(e, n) {
    return Ht(
      Jh(this, et(this, Ut), e, n)
    );
  }
  delete(e, n) {
    return Ht(Xh(this, et(this, Ut), e, n));
  }
  mutate(e, n) {
    return Ht(Yh(this, et(this, Ut), e, n));
  }
  /**
   * Create a new buildable patch of operations to perform
   *
   * @param selection - Document ID, an array of document IDs, or an object with `query` and optional `params`, defining which document(s) to patch
   * @param operations - Optional object of patch operations to initialize the patch instance with
   * @returns Patch instance - call `.commit()` to perform the operations defined
   */
  patch(e, n) {
    return new Ai(e, n, this);
  }
  /**
   * Create a new transaction of mutations
   *
   * @param operations - Optional array of mutation operations to initialize the transaction instance with
   */
  transaction(e) {
    return new kh(e, this);
  }
  /**
   * Perform action operations against the configured dataset
   * Returns a promise that resolves to the transaction result
   *
   * @param operations - Action operation(s) to execute
   * @param options - Action options
   */
  action(e, n) {
    return Ht(Vh(this, et(this, Ut), e, n));
  }
  /**
   * Perform a request against the Sanity API
   * NOTE: Only use this for Sanity API endpoints, not for your own APIs!
   *
   * @param options - Request options
   * @returns Promise resolving to the response body
   */
  request(e) {
    return Ht(Ze(this, et(this, Ut), e));
  }
  /**
   * Perform an HTTP request a `/data` sub-endpoint
   * NOTE: Considered internal, thus marked as deprecated. Use `request` instead.
   *
   * @deprecated - Use `request()` or your own HTTP library instead
   * @param endpoint - Endpoint to hit (mutate, query etc)
   * @param body - Request body
   * @param options - Request options
   * @internal
   */
  dataRequest(e, n, s) {
    return Ht(Xr(this, et(this, Ut), e, n, s));
  }
  /**
   * Get a Sanity API URL for the URI provided
   *
   * @param uri - URI/path to build URL for
   * @param canUseCdn - Whether or not to allow using the API CDN for this route
   */
  getUrl(e, n) {
    return pa(this, e, n);
  }
  /**
   * Get a Sanity API URL for the data operation and path provided
   *
   * @param operation - Data operation (eg `query`, `mutate`, `listen` or similar)
   * @param path - Path to append after the operation
   */
  getDataUrl(e, n) {
    return mr(this, e, n);
  }
};
Bn = /* @__PURE__ */ new WeakMap(), Ut = /* @__PURE__ */ new WeakMap();
let K_ = z_;
function J_(r, e) {
  const n = Gb(r);
  return { requester: n, createClient: (s) => new e(
    (u, a) => (a || n)({
      maxRedirects: 0,
      maxRetries: s.maxRetries,
      retryDelay: s.retryDelay,
      ...u
    }),
    s
  ) };
}
var X_ = [];
const Y_ = J_(X_, K_), V_ = Y_.createClient;
var Nr = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function ad(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var fo = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
fo.exports;
(function(r, e) {
  (function() {
    var n, s = "4.17.21", u = 200, a = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", f = "Expected a function", l = "Invalid `variable` option passed into `_.template`", d = "__lodash_hash_undefined__", y = 500, p = "__lodash_placeholder__", m = 1, b = 2, C = 4, I = 1, O = 2, R = 1, x = 2, D = 4, U = 8, M = 16, z = 32, ht = 64, _t = 128, xt = 256, Te = 512, qe = 30, an = "...", We = 800, zt = 16, Qt = 1, yr = 2, Yr = 3, te = 1 / 0, se = 9007199254740991, Yn = 17976931348623157e292, En = 0 / 0, kt = 4294967295, Vr = kt - 1, $i = kt >>> 1, wo = [
      ["ary", _t],
      ["bind", R],
      ["bindKey", x],
      ["curry", U],
      ["curryRight", M],
      ["flip", Te],
      ["partial", z],
      ["partialRight", ht],
      ["rearg", xt]
    ], An = "[object Arguments]", wr = "[object Array]", bo = "[object AsyncFunction]", cn = "[object Boolean]", fn = "[object Date]", xn = "[object DOMException]", ee = "[object Error]", br = "[object Function]", Pi = "[object GeneratorFunction]", ye = "[object Map]", Sn = "[object Number]", L = "[object Null]", k = "[object Object]", H = "[object Promise]", N = "[object Proxy]", Y = "[object RegExp]", G = "[object Set]", Q = "[object String]", mt = "[object Symbol]", ut = "[object Undefined]", ft = "[object WeakMap]", yt = "[object WeakSet]", V = "[object ArrayBuffer]", pt = "[object DataView]", we = "[object Float32Array]", ln = "[object Float64Array]", Kt = "[object Int8Array]", Nt = "[object Int16Array]", oe = "[object Int32Array]", tn = "[object Uint8Array]", Rn = "[object Uint8ClampedArray]", be = "[object Uint16Array]", In = "[object Uint32Array]", Jt = /\b__p \+= '';/g, Zr = /\b(__p \+=) '' \+/g, hn = /(__e\(.*?\)|\b__t\)) \+\n'';/g, Fi = /&(?:amp|lt|gt|quot|#39);/g, Mi = /[&<>"']/g, Di = RegExp(Fi.source), Qr = RegExp(Mi.source), Vn = /<%-([\s\S]+?)%>/g, Dt = /<%([\s\S]+?)%>/g, Ot = /<%=([\s\S]+?)%>/g, ue = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, ae = /^\w*$/, Xt = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, $t = /[\\^$.*+?()[\]{}|]/g, Be = RegExp($t.source), _e = /^\s+/, On = /\s/, Od = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, Td = /\{\n\/\* \[wrapped with (.+)\] \*/, Ld = /,? & /, $d = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, Pd = /[()=,{}\[\]\/\s]/, Fd = /\\(\\)?/g, Md = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, ya = /\w*$/, Dd = /^[-+]0x[0-9a-f]+$/i, Ud = /^0b[01]+$/i, kd = /^\[object .+?Constructor\]$/, Nd = /^0o[0-7]+$/i, qd = /^(?:0|[1-9]\d*)$/, Wd = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, Ui = /($^)/, Bd = /['\n\r\u2028\u2029\\]/g, ki = "\\ud800-\\udfff", Hd = "\\u0300-\\u036f", Gd = "\\ufe20-\\ufe2f", jd = "\\u20d0-\\u20ff", wa = Hd + Gd + jd, ba = "\\u2700-\\u27bf", _a = "a-z\\xdf-\\xf6\\xf8-\\xff", zd = "\\xac\\xb1\\xd7\\xf7", Kd = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", Jd = "\\u2000-\\u206f", Xd = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", Ca = "A-Z\\xc0-\\xd6\\xd8-\\xde", Ea = "\\ufe0e\\ufe0f", Aa = zd + Kd + Jd + Xd, _o = "['’]", Yd = "[" + ki + "]", xa = "[" + Aa + "]", Ni = "[" + wa + "]", Sa = "\\d+", Vd = "[" + ba + "]", Ra = "[" + _a + "]", Ia = "[^" + ki + Aa + Sa + ba + _a + Ca + "]", Co = "\\ud83c[\\udffb-\\udfff]", Zd = "(?:" + Ni + "|" + Co + ")", Oa = "[^" + ki + "]", Eo = "(?:\\ud83c[\\udde6-\\uddff]){2}", Ao = "[\\ud800-\\udbff][\\udc00-\\udfff]", _r = "[" + Ca + "]", Ta = "\\u200d", La = "(?:" + Ra + "|" + Ia + ")", Qd = "(?:" + _r + "|" + Ia + ")", $a = "(?:" + _o + "(?:d|ll|m|re|s|t|ve))?", Pa = "(?:" + _o + "(?:D|LL|M|RE|S|T|VE))?", Fa = Zd + "?", Ma = "[" + Ea + "]?", tp = "(?:" + Ta + "(?:" + [Oa, Eo, Ao].join("|") + ")" + Ma + Fa + ")*", ep = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", np = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", Da = Ma + Fa + tp, rp = "(?:" + [Vd, Eo, Ao].join("|") + ")" + Da, ip = "(?:" + [Oa + Ni + "?", Ni, Eo, Ao, Yd].join("|") + ")", sp = RegExp(_o, "g"), op = RegExp(Ni, "g"), xo = RegExp(Co + "(?=" + Co + ")|" + ip + Da, "g"), up = RegExp([
      _r + "?" + Ra + "+" + $a + "(?=" + [xa, _r, "$"].join("|") + ")",
      Qd + "+" + Pa + "(?=" + [xa, _r + La, "$"].join("|") + ")",
      _r + "?" + La + "+" + $a,
      _r + "+" + Pa,
      np,
      ep,
      Sa,
      rp
    ].join("|"), "g"), ap = RegExp("[" + Ta + ki + wa + Ea + "]"), cp = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, fp = [
      "Array",
      "Buffer",
      "DataView",
      "Date",
      "Error",
      "Float32Array",
      "Float64Array",
      "Function",
      "Int8Array",
      "Int16Array",
      "Int32Array",
      "Map",
      "Math",
      "Object",
      "Promise",
      "RegExp",
      "Set",
      "String",
      "Symbol",
      "TypeError",
      "Uint8Array",
      "Uint8ClampedArray",
      "Uint16Array",
      "Uint32Array",
      "WeakMap",
      "_",
      "clearTimeout",
      "isFinite",
      "parseInt",
      "setTimeout"
    ], lp = -1, At = {};
    At[we] = At[ln] = At[Kt] = At[Nt] = At[oe] = At[tn] = At[Rn] = At[be] = At[In] = !0, At[An] = At[wr] = At[V] = At[cn] = At[pt] = At[fn] = At[ee] = At[br] = At[ye] = At[Sn] = At[k] = At[Y] = At[G] = At[Q] = At[ft] = !1;
    var Ct = {};
    Ct[An] = Ct[wr] = Ct[V] = Ct[pt] = Ct[cn] = Ct[fn] = Ct[we] = Ct[ln] = Ct[Kt] = Ct[Nt] = Ct[oe] = Ct[ye] = Ct[Sn] = Ct[k] = Ct[Y] = Ct[G] = Ct[Q] = Ct[mt] = Ct[tn] = Ct[Rn] = Ct[be] = Ct[In] = !0, Ct[ee] = Ct[br] = Ct[ft] = !1;
    var hp = {
      // Latin-1 Supplement block.
      À: "A",
      Á: "A",
      Â: "A",
      Ã: "A",
      Ä: "A",
      Å: "A",
      à: "a",
      á: "a",
      â: "a",
      ã: "a",
      ä: "a",
      å: "a",
      Ç: "C",
      ç: "c",
      Ð: "D",
      ð: "d",
      È: "E",
      É: "E",
      Ê: "E",
      Ë: "E",
      è: "e",
      é: "e",
      ê: "e",
      ë: "e",
      Ì: "I",
      Í: "I",
      Î: "I",
      Ï: "I",
      ì: "i",
      í: "i",
      î: "i",
      ï: "i",
      Ñ: "N",
      ñ: "n",
      Ò: "O",
      Ó: "O",
      Ô: "O",
      Õ: "O",
      Ö: "O",
      Ø: "O",
      ò: "o",
      ó: "o",
      ô: "o",
      õ: "o",
      ö: "o",
      ø: "o",
      Ù: "U",
      Ú: "U",
      Û: "U",
      Ü: "U",
      ù: "u",
      ú: "u",
      û: "u",
      ü: "u",
      Ý: "Y",
      ý: "y",
      ÿ: "y",
      Æ: "Ae",
      æ: "ae",
      Þ: "Th",
      þ: "th",
      ß: "ss",
      // Latin Extended-A block.
      Ā: "A",
      Ă: "A",
      Ą: "A",
      ā: "a",
      ă: "a",
      ą: "a",
      Ć: "C",
      Ĉ: "C",
      Ċ: "C",
      Č: "C",
      ć: "c",
      ĉ: "c",
      ċ: "c",
      č: "c",
      Ď: "D",
      Đ: "D",
      ď: "d",
      đ: "d",
      Ē: "E",
      Ĕ: "E",
      Ė: "E",
      Ę: "E",
      Ě: "E",
      ē: "e",
      ĕ: "e",
      ė: "e",
      ę: "e",
      ě: "e",
      Ĝ: "G",
      Ğ: "G",
      Ġ: "G",
      Ģ: "G",
      ĝ: "g",
      ğ: "g",
      ġ: "g",
      ģ: "g",
      Ĥ: "H",
      Ħ: "H",
      ĥ: "h",
      ħ: "h",
      Ĩ: "I",
      Ī: "I",
      Ĭ: "I",
      Į: "I",
      İ: "I",
      ĩ: "i",
      ī: "i",
      ĭ: "i",
      į: "i",
      ı: "i",
      Ĵ: "J",
      ĵ: "j",
      Ķ: "K",
      ķ: "k",
      ĸ: "k",
      Ĺ: "L",
      Ļ: "L",
      Ľ: "L",
      Ŀ: "L",
      Ł: "L",
      ĺ: "l",
      ļ: "l",
      ľ: "l",
      ŀ: "l",
      ł: "l",
      Ń: "N",
      Ņ: "N",
      Ň: "N",
      Ŋ: "N",
      ń: "n",
      ņ: "n",
      ň: "n",
      ŋ: "n",
      Ō: "O",
      Ŏ: "O",
      Ő: "O",
      ō: "o",
      ŏ: "o",
      ő: "o",
      Ŕ: "R",
      Ŗ: "R",
      Ř: "R",
      ŕ: "r",
      ŗ: "r",
      ř: "r",
      Ś: "S",
      Ŝ: "S",
      Ş: "S",
      Š: "S",
      ś: "s",
      ŝ: "s",
      ş: "s",
      š: "s",
      Ţ: "T",
      Ť: "T",
      Ŧ: "T",
      ţ: "t",
      ť: "t",
      ŧ: "t",
      Ũ: "U",
      Ū: "U",
      Ŭ: "U",
      Ů: "U",
      Ű: "U",
      Ų: "U",
      ũ: "u",
      ū: "u",
      ŭ: "u",
      ů: "u",
      ű: "u",
      ų: "u",
      Ŵ: "W",
      ŵ: "w",
      Ŷ: "Y",
      ŷ: "y",
      Ÿ: "Y",
      Ź: "Z",
      Ż: "Z",
      Ž: "Z",
      ź: "z",
      ż: "z",
      ž: "z",
      Ĳ: "IJ",
      ĳ: "ij",
      Œ: "Oe",
      œ: "oe",
      ŉ: "'n",
      ſ: "s"
    }, dp = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }, pp = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'"
    }, gp = {
      "\\": "\\",
      "'": "'",
      "\n": "n",
      "\r": "r",
      "\u2028": "u2028",
      "\u2029": "u2029"
    }, vp = parseFloat, mp = parseInt, Ua = typeof Nr == "object" && Nr && Nr.Object === Object && Nr, yp = typeof self == "object" && self && self.Object === Object && self, Yt = Ua || yp || Function("return this")(), So = e && !e.nodeType && e, Zn = So && !0 && r && !r.nodeType && r, ka = Zn && Zn.exports === So, Ro = ka && Ua.process, Le = function() {
      try {
        var E = Zn && Zn.require && Zn.require("util").types;
        return E || Ro && Ro.binding && Ro.binding("util");
      } catch {
      }
    }(), Na = Le && Le.isArrayBuffer, qa = Le && Le.isDate, Wa = Le && Le.isMap, Ba = Le && Le.isRegExp, Ha = Le && Le.isSet, Ga = Le && Le.isTypedArray;
    function Ce(E, T, S) {
      switch (S.length) {
        case 0:
          return E.call(T);
        case 1:
          return E.call(T, S[0]);
        case 2:
          return E.call(T, S[0], S[1]);
        case 3:
          return E.call(T, S[0], S[1], S[2]);
      }
      return E.apply(T, S);
    }
    function wp(E, T, S, B) {
      for (var Z = -1, dt = E == null ? 0 : E.length; ++Z < dt; ) {
        var qt = E[Z];
        T(B, qt, S(qt), E);
      }
      return B;
    }
    function $e(E, T) {
      for (var S = -1, B = E == null ? 0 : E.length; ++S < B && T(E[S], S, E) !== !1; )
        ;
      return E;
    }
    function bp(E, T) {
      for (var S = E == null ? 0 : E.length; S-- && T(E[S], S, E) !== !1; )
        ;
      return E;
    }
    function ja(E, T) {
      for (var S = -1, B = E == null ? 0 : E.length; ++S < B; )
        if (!T(E[S], S, E))
          return !1;
      return !0;
    }
    function Tn(E, T) {
      for (var S = -1, B = E == null ? 0 : E.length, Z = 0, dt = []; ++S < B; ) {
        var qt = E[S];
        T(qt, S, E) && (dt[Z++] = qt);
      }
      return dt;
    }
    function qi(E, T) {
      var S = E == null ? 0 : E.length;
      return !!S && Cr(E, T, 0) > -1;
    }
    function Io(E, T, S) {
      for (var B = -1, Z = E == null ? 0 : E.length; ++B < Z; )
        if (S(T, E[B]))
          return !0;
      return !1;
    }
    function St(E, T) {
      for (var S = -1, B = E == null ? 0 : E.length, Z = Array(B); ++S < B; )
        Z[S] = T(E[S], S, E);
      return Z;
    }
    function Ln(E, T) {
      for (var S = -1, B = T.length, Z = E.length; ++S < B; )
        E[Z + S] = T[S];
      return E;
    }
    function Oo(E, T, S, B) {
      var Z = -1, dt = E == null ? 0 : E.length;
      for (B && dt && (S = E[++Z]); ++Z < dt; )
        S = T(S, E[Z], Z, E);
      return S;
    }
    function _p(E, T, S, B) {
      var Z = E == null ? 0 : E.length;
      for (B && Z && (S = E[--Z]); Z--; )
        S = T(S, E[Z], Z, E);
      return S;
    }
    function To(E, T) {
      for (var S = -1, B = E == null ? 0 : E.length; ++S < B; )
        if (T(E[S], S, E))
          return !0;
      return !1;
    }
    var Cp = Lo("length");
    function Ep(E) {
      return E.split("");
    }
    function Ap(E) {
      return E.match($d) || [];
    }
    function za(E, T, S) {
      var B;
      return S(E, function(Z, dt, qt) {
        if (T(Z, dt, qt))
          return B = dt, !1;
      }), B;
    }
    function Wi(E, T, S, B) {
      for (var Z = E.length, dt = S + (B ? 1 : -1); B ? dt-- : ++dt < Z; )
        if (T(E[dt], dt, E))
          return dt;
      return -1;
    }
    function Cr(E, T, S) {
      return T === T ? Dp(E, T, S) : Wi(E, Ka, S);
    }
    function xp(E, T, S, B) {
      for (var Z = S - 1, dt = E.length; ++Z < dt; )
        if (B(E[Z], T))
          return Z;
      return -1;
    }
    function Ka(E) {
      return E !== E;
    }
    function Ja(E, T) {
      var S = E == null ? 0 : E.length;
      return S ? Po(E, T) / S : En;
    }
    function Lo(E) {
      return function(T) {
        return T == null ? n : T[E];
      };
    }
    function $o(E) {
      return function(T) {
        return E == null ? n : E[T];
      };
    }
    function Xa(E, T, S, B, Z) {
      return Z(E, function(dt, qt, wt) {
        S = B ? (B = !1, dt) : T(S, dt, qt, wt);
      }), S;
    }
    function Sp(E, T) {
      var S = E.length;
      for (E.sort(T); S--; )
        E[S] = E[S].value;
      return E;
    }
    function Po(E, T) {
      for (var S, B = -1, Z = E.length; ++B < Z; ) {
        var dt = T(E[B]);
        dt !== n && (S = S === n ? dt : S + dt);
      }
      return S;
    }
    function Fo(E, T) {
      for (var S = -1, B = Array(E); ++S < E; )
        B[S] = T(S);
      return B;
    }
    function Rp(E, T) {
      return St(T, function(S) {
        return [S, E[S]];
      });
    }
    function Ya(E) {
      return E && E.slice(0, tc(E) + 1).replace(_e, "");
    }
    function Ee(E) {
      return function(T) {
        return E(T);
      };
    }
    function Mo(E, T) {
      return St(T, function(S) {
        return E[S];
      });
    }
    function ti(E, T) {
      return E.has(T);
    }
    function Va(E, T) {
      for (var S = -1, B = E.length; ++S < B && Cr(T, E[S], 0) > -1; )
        ;
      return S;
    }
    function Za(E, T) {
      for (var S = E.length; S-- && Cr(T, E[S], 0) > -1; )
        ;
      return S;
    }
    function Ip(E, T) {
      for (var S = E.length, B = 0; S--; )
        E[S] === T && ++B;
      return B;
    }
    var Op = $o(hp), Tp = $o(dp);
    function Lp(E) {
      return "\\" + gp[E];
    }
    function $p(E, T) {
      return E == null ? n : E[T];
    }
    function Er(E) {
      return ap.test(E);
    }
    function Pp(E) {
      return cp.test(E);
    }
    function Fp(E) {
      for (var T, S = []; !(T = E.next()).done; )
        S.push(T.value);
      return S;
    }
    function Do(E) {
      var T = -1, S = Array(E.size);
      return E.forEach(function(B, Z) {
        S[++T] = [Z, B];
      }), S;
    }
    function Qa(E, T) {
      return function(S) {
        return E(T(S));
      };
    }
    function $n(E, T) {
      for (var S = -1, B = E.length, Z = 0, dt = []; ++S < B; ) {
        var qt = E[S];
        (qt === T || qt === p) && (E[S] = p, dt[Z++] = S);
      }
      return dt;
    }
    function Bi(E) {
      var T = -1, S = Array(E.size);
      return E.forEach(function(B) {
        S[++T] = B;
      }), S;
    }
    function Mp(E) {
      var T = -1, S = Array(E.size);
      return E.forEach(function(B) {
        S[++T] = [B, B];
      }), S;
    }
    function Dp(E, T, S) {
      for (var B = S - 1, Z = E.length; ++B < Z; )
        if (E[B] === T)
          return B;
      return -1;
    }
    function Up(E, T, S) {
      for (var B = S + 1; B--; )
        if (E[B] === T)
          return B;
      return B;
    }
    function Ar(E) {
      return Er(E) ? Np(E) : Cp(E);
    }
    function He(E) {
      return Er(E) ? qp(E) : Ep(E);
    }
    function tc(E) {
      for (var T = E.length; T-- && On.test(E.charAt(T)); )
        ;
      return T;
    }
    var kp = $o(pp);
    function Np(E) {
      for (var T = xo.lastIndex = 0; xo.test(E); )
        ++T;
      return T;
    }
    function qp(E) {
      return E.match(xo) || [];
    }
    function Wp(E) {
      return E.match(up) || [];
    }
    var Bp = function E(T) {
      T = T == null ? Yt : xr.defaults(Yt.Object(), T, xr.pick(Yt, fp));
      var S = T.Array, B = T.Date, Z = T.Error, dt = T.Function, qt = T.Math, wt = T.Object, Uo = T.RegExp, Hp = T.String, Pe = T.TypeError, Hi = S.prototype, Gp = dt.prototype, Sr = wt.prototype, Gi = T["__core-js_shared__"], ji = Gp.toString, vt = Sr.hasOwnProperty, jp = 0, ec = function() {
        var t = /[^.]+$/.exec(Gi && Gi.keys && Gi.keys.IE_PROTO || "");
        return t ? "Symbol(src)_1." + t : "";
      }(), zi = Sr.toString, zp = ji.call(wt), Kp = Yt._, Jp = Uo(
        "^" + ji.call(vt).replace($t, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
      ), Ki = ka ? T.Buffer : n, Pn = T.Symbol, Ji = T.Uint8Array, nc = Ki ? Ki.allocUnsafe : n, Xi = Qa(wt.getPrototypeOf, wt), rc = wt.create, ic = Sr.propertyIsEnumerable, Yi = Hi.splice, sc = Pn ? Pn.isConcatSpreadable : n, ei = Pn ? Pn.iterator : n, Qn = Pn ? Pn.toStringTag : n, Vi = function() {
        try {
          var t = ir(wt, "defineProperty");
          return t({}, "", {}), t;
        } catch {
        }
      }(), Xp = T.clearTimeout !== Yt.clearTimeout && T.clearTimeout, Yp = B && B.now !== Yt.Date.now && B.now, Vp = T.setTimeout !== Yt.setTimeout && T.setTimeout, Zi = qt.ceil, Qi = qt.floor, ko = wt.getOwnPropertySymbols, Zp = Ki ? Ki.isBuffer : n, oc = T.isFinite, Qp = Hi.join, tg = Qa(wt.keys, wt), Wt = qt.max, ne = qt.min, eg = B.now, ng = T.parseInt, uc = qt.random, rg = Hi.reverse, No = ir(T, "DataView"), ni = ir(T, "Map"), qo = ir(T, "Promise"), Rr = ir(T, "Set"), ri = ir(T, "WeakMap"), ii = ir(wt, "create"), ts = ri && new ri(), Ir = {}, ig = sr(No), sg = sr(ni), og = sr(qo), ug = sr(Rr), ag = sr(ri), es = Pn ? Pn.prototype : n, si = es ? es.valueOf : n, ac = es ? es.toString : n;
      function g(t) {
        if (Tt(t) && !tt(t) && !(t instanceof at)) {
          if (t instanceof Fe)
            return t;
          if (vt.call(t, "__wrapped__"))
            return ff(t);
        }
        return new Fe(t);
      }
      var Or = function() {
        function t() {
        }
        return function(i) {
          if (!It(i))
            return {};
          if (rc)
            return rc(i);
          t.prototype = i;
          var o = new t();
          return t.prototype = n, o;
        };
      }();
      function ns() {
      }
      function Fe(t, i) {
        this.__wrapped__ = t, this.__actions__ = [], this.__chain__ = !!i, this.__index__ = 0, this.__values__ = n;
      }
      g.templateSettings = {
        /**
         * Used to detect `data` property values to be HTML-escaped.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        escape: Vn,
        /**
         * Used to detect code to be evaluated.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        evaluate: Dt,
        /**
         * Used to detect `data` property values to inject.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        interpolate: Ot,
        /**
         * Used to reference the data object in the template text.
         *
         * @memberOf _.templateSettings
         * @type {string}
         */
        variable: "",
        /**
         * Used to import variables into the compiled template.
         *
         * @memberOf _.templateSettings
         * @type {Object}
         */
        imports: {
          /**
           * A reference to the `lodash` function.
           *
           * @memberOf _.templateSettings.imports
           * @type {Function}
           */
          _: g
        }
      }, g.prototype = ns.prototype, g.prototype.constructor = g, Fe.prototype = Or(ns.prototype), Fe.prototype.constructor = Fe;
      function at(t) {
        this.__wrapped__ = t, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = kt, this.__views__ = [];
      }
      function cg() {
        var t = new at(this.__wrapped__);
        return t.__actions__ = he(this.__actions__), t.__dir__ = this.__dir__, t.__filtered__ = this.__filtered__, t.__iteratees__ = he(this.__iteratees__), t.__takeCount__ = this.__takeCount__, t.__views__ = he(this.__views__), t;
      }
      function fg() {
        if (this.__filtered__) {
          var t = new at(this);
          t.__dir__ = -1, t.__filtered__ = !0;
        } else
          t = this.clone(), t.__dir__ *= -1;
        return t;
      }
      function lg() {
        var t = this.__wrapped__.value(), i = this.__dir__, o = tt(t), c = i < 0, h = o ? t.length : 0, v = E0(0, h, this.__views__), w = v.start, _ = v.end, A = _ - w, $ = c ? _ : w - 1, P = this.__iteratees__, F = P.length, q = 0, j = ne(A, this.__takeCount__);
        if (!o || !c && h == A && j == A)
          return $c(t, this.__actions__);
        var J = [];
        t:
          for (; A-- && q < j; ) {
            $ += i;
            for (var rt = -1, X = t[$]; ++rt < F; ) {
              var ot = P[rt], lt = ot.iteratee, Se = ot.type, le = lt(X);
              if (Se == yr)
                X = le;
              else if (!le) {
                if (Se == Qt)
                  continue t;
                break t;
              }
            }
            J[q++] = X;
          }
        return J;
      }
      at.prototype = Or(ns.prototype), at.prototype.constructor = at;
      function tr(t) {
        var i = -1, o = t == null ? 0 : t.length;
        for (this.clear(); ++i < o; ) {
          var c = t[i];
          this.set(c[0], c[1]);
        }
      }
      function hg() {
        this.__data__ = ii ? ii(null) : {}, this.size = 0;
      }
      function dg(t) {
        var i = this.has(t) && delete this.__data__[t];
        return this.size -= i ? 1 : 0, i;
      }
      function pg(t) {
        var i = this.__data__;
        if (ii) {
          var o = i[t];
          return o === d ? n : o;
        }
        return vt.call(i, t) ? i[t] : n;
      }
      function gg(t) {
        var i = this.__data__;
        return ii ? i[t] !== n : vt.call(i, t);
      }
      function vg(t, i) {
        var o = this.__data__;
        return this.size += this.has(t) ? 0 : 1, o[t] = ii && i === n ? d : i, this;
      }
      tr.prototype.clear = hg, tr.prototype.delete = dg, tr.prototype.get = pg, tr.prototype.has = gg, tr.prototype.set = vg;
      function dn(t) {
        var i = -1, o = t == null ? 0 : t.length;
        for (this.clear(); ++i < o; ) {
          var c = t[i];
          this.set(c[0], c[1]);
        }
      }
      function mg() {
        this.__data__ = [], this.size = 0;
      }
      function yg(t) {
        var i = this.__data__, o = rs(i, t);
        if (o < 0)
          return !1;
        var c = i.length - 1;
        return o == c ? i.pop() : Yi.call(i, o, 1), --this.size, !0;
      }
      function wg(t) {
        var i = this.__data__, o = rs(i, t);
        return o < 0 ? n : i[o][1];
      }
      function bg(t) {
        return rs(this.__data__, t) > -1;
      }
      function _g(t, i) {
        var o = this.__data__, c = rs(o, t);
        return c < 0 ? (++this.size, o.push([t, i])) : o[c][1] = i, this;
      }
      dn.prototype.clear = mg, dn.prototype.delete = yg, dn.prototype.get = wg, dn.prototype.has = bg, dn.prototype.set = _g;
      function pn(t) {
        var i = -1, o = t == null ? 0 : t.length;
        for (this.clear(); ++i < o; ) {
          var c = t[i];
          this.set(c[0], c[1]);
        }
      }
      function Cg() {
        this.size = 0, this.__data__ = {
          hash: new tr(),
          map: new (ni || dn)(),
          string: new tr()
        };
      }
      function Eg(t) {
        var i = gs(this, t).delete(t);
        return this.size -= i ? 1 : 0, i;
      }
      function Ag(t) {
        return gs(this, t).get(t);
      }
      function xg(t) {
        return gs(this, t).has(t);
      }
      function Sg(t, i) {
        var o = gs(this, t), c = o.size;
        return o.set(t, i), this.size += o.size == c ? 0 : 1, this;
      }
      pn.prototype.clear = Cg, pn.prototype.delete = Eg, pn.prototype.get = Ag, pn.prototype.has = xg, pn.prototype.set = Sg;
      function er(t) {
        var i = -1, o = t == null ? 0 : t.length;
        for (this.__data__ = new pn(); ++i < o; )
          this.add(t[i]);
      }
      function Rg(t) {
        return this.__data__.set(t, d), this;
      }
      function Ig(t) {
        return this.__data__.has(t);
      }
      er.prototype.add = er.prototype.push = Rg, er.prototype.has = Ig;
      function Ge(t) {
        var i = this.__data__ = new dn(t);
        this.size = i.size;
      }
      function Og() {
        this.__data__ = new dn(), this.size = 0;
      }
      function Tg(t) {
        var i = this.__data__, o = i.delete(t);
        return this.size = i.size, o;
      }
      function Lg(t) {
        return this.__data__.get(t);
      }
      function $g(t) {
        return this.__data__.has(t);
      }
      function Pg(t, i) {
        var o = this.__data__;
        if (o instanceof dn) {
          var c = o.__data__;
          if (!ni || c.length < u - 1)
            return c.push([t, i]), this.size = ++o.size, this;
          o = this.__data__ = new pn(c);
        }
        return o.set(t, i), this.size = o.size, this;
      }
      Ge.prototype.clear = Og, Ge.prototype.delete = Tg, Ge.prototype.get = Lg, Ge.prototype.has = $g, Ge.prototype.set = Pg;
      function cc(t, i) {
        var o = tt(t), c = !o && or(t), h = !o && !c && kn(t), v = !o && !c && !h && Pr(t), w = o || c || h || v, _ = w ? Fo(t.length, Hp) : [], A = _.length;
        for (var $ in t)
          (i || vt.call(t, $)) && !(w && // Safari 9 has enumerable `arguments.length` in strict mode.
          ($ == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
          h && ($ == "offset" || $ == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
          v && ($ == "buffer" || $ == "byteLength" || $ == "byteOffset") || // Skip index properties.
          yn($, A))) && _.push($);
        return _;
      }
      function fc(t) {
        var i = t.length;
        return i ? t[Vo(0, i - 1)] : n;
      }
      function Fg(t, i) {
        return vs(he(t), nr(i, 0, t.length));
      }
      function Mg(t) {
        return vs(he(t));
      }
      function Wo(t, i, o) {
        (o !== n && !je(t[i], o) || o === n && !(i in t)) && gn(t, i, o);
      }
      function oi(t, i, o) {
        var c = t[i];
        (!(vt.call(t, i) && je(c, o)) || o === n && !(i in t)) && gn(t, i, o);
      }
      function rs(t, i) {
        for (var o = t.length; o--; )
          if (je(t[o][0], i))
            return o;
        return -1;
      }
      function Dg(t, i, o, c) {
        return Fn(t, function(h, v, w) {
          i(c, h, o(h), w);
        }), c;
      }
      function lc(t, i) {
        return t && nn(i, Gt(i), t);
      }
      function Ug(t, i) {
        return t && nn(i, pe(i), t);
      }
      function gn(t, i, o) {
        i == "__proto__" && Vi ? Vi(t, i, {
          configurable: !0,
          enumerable: !0,
          value: o,
          writable: !0
        }) : t[i] = o;
      }
      function Bo(t, i) {
        for (var o = -1, c = i.length, h = S(c), v = t == null; ++o < c; )
          h[o] = v ? n : Cu(t, i[o]);
        return h;
      }
      function nr(t, i, o) {
        return t === t && (o !== n && (t = t <= o ? t : o), i !== n && (t = t >= i ? t : i)), t;
      }
      function Me(t, i, o, c, h, v) {
        var w, _ = i & m, A = i & b, $ = i & C;
        if (o && (w = h ? o(t, c, h, v) : o(t)), w !== n)
          return w;
        if (!It(t))
          return t;
        var P = tt(t);
        if (P) {
          if (w = x0(t), !_)
            return he(t, w);
        } else {
          var F = re(t), q = F == br || F == Pi;
          if (kn(t))
            return Mc(t, _);
          if (F == k || F == An || q && !h) {
            if (w = A || q ? {} : tf(t), !_)
              return A ? p0(t, Ug(w, t)) : d0(t, lc(w, t));
          } else {
            if (!Ct[F])
              return h ? t : {};
            w = S0(t, F, _);
          }
        }
        v || (v = new Ge());
        var j = v.get(t);
        if (j)
          return j;
        v.set(t, w), Tf(t) ? t.forEach(function(X) {
          w.add(Me(X, i, o, X, t, v));
        }) : If(t) && t.forEach(function(X, ot) {
          w.set(ot, Me(X, i, o, ot, t, v));
        });
        var J = $ ? A ? au : uu : A ? pe : Gt, rt = P ? n : J(t);
        return $e(rt || t, function(X, ot) {
          rt && (ot = X, X = t[ot]), oi(w, ot, Me(X, i, o, ot, t, v));
        }), w;
      }
      function kg(t) {
        var i = Gt(t);
        return function(o) {
          return hc(o, t, i);
        };
      }
      function hc(t, i, o) {
        var c = o.length;
        if (t == null)
          return !c;
        for (t = wt(t); c--; ) {
          var h = o[c], v = i[h], w = t[h];
          if (w === n && !(h in t) || !v(w))
            return !1;
        }
        return !0;
      }
      function dc(t, i, o) {
        if (typeof t != "function")
          throw new Pe(f);
        return di(function() {
          t.apply(n, o);
        }, i);
      }
      function ui(t, i, o, c) {
        var h = -1, v = qi, w = !0, _ = t.length, A = [], $ = i.length;
        if (!_)
          return A;
        o && (i = St(i, Ee(o))), c ? (v = Io, w = !1) : i.length >= u && (v = ti, w = !1, i = new er(i));
        t:
          for (; ++h < _; ) {
            var P = t[h], F = o == null ? P : o(P);
            if (P = c || P !== 0 ? P : 0, w && F === F) {
              for (var q = $; q--; )
                if (i[q] === F)
                  continue t;
              A.push(P);
            } else
              v(i, F, c) || A.push(P);
          }
        return A;
      }
      var Fn = qc(en), pc = qc(Go, !0);
      function Ng(t, i) {
        var o = !0;
        return Fn(t, function(c, h, v) {
          return o = !!i(c, h, v), o;
        }), o;
      }
      function is(t, i, o) {
        for (var c = -1, h = t.length; ++c < h; ) {
          var v = t[c], w = i(v);
          if (w != null && (_ === n ? w === w && !xe(w) : o(w, _)))
            var _ = w, A = v;
        }
        return A;
      }
      function qg(t, i, o, c) {
        var h = t.length;
        for (o = nt(o), o < 0 && (o = -o > h ? 0 : h + o), c = c === n || c > h ? h : nt(c), c < 0 && (c += h), c = o > c ? 0 : $f(c); o < c; )
          t[o++] = i;
        return t;
      }
      function gc(t, i) {
        var o = [];
        return Fn(t, function(c, h, v) {
          i(c, h, v) && o.push(c);
        }), o;
      }
      function Vt(t, i, o, c, h) {
        var v = -1, w = t.length;
        for (o || (o = I0), h || (h = []); ++v < w; ) {
          var _ = t[v];
          i > 0 && o(_) ? i > 1 ? Vt(_, i - 1, o, c, h) : Ln(h, _) : c || (h[h.length] = _);
        }
        return h;
      }
      var Ho = Wc(), vc = Wc(!0);
      function en(t, i) {
        return t && Ho(t, i, Gt);
      }
      function Go(t, i) {
        return t && vc(t, i, Gt);
      }
      function ss(t, i) {
        return Tn(i, function(o) {
          return wn(t[o]);
        });
      }
      function rr(t, i) {
        i = Dn(i, t);
        for (var o = 0, c = i.length; t != null && o < c; )
          t = t[rn(i[o++])];
        return o && o == c ? t : n;
      }
      function mc(t, i, o) {
        var c = i(t);
        return tt(t) ? c : Ln(c, o(t));
      }
      function ce(t) {
        return t == null ? t === n ? ut : L : Qn && Qn in wt(t) ? C0(t) : M0(t);
      }
      function jo(t, i) {
        return t > i;
      }
      function Wg(t, i) {
        return t != null && vt.call(t, i);
      }
      function Bg(t, i) {
        return t != null && i in wt(t);
      }
      function Hg(t, i, o) {
        return t >= ne(i, o) && t < Wt(i, o);
      }
      function zo(t, i, o) {
        for (var c = o ? Io : qi, h = t[0].length, v = t.length, w = v, _ = S(v), A = 1 / 0, $ = []; w--; ) {
          var P = t[w];
          w && i && (P = St(P, Ee(i))), A = ne(P.length, A), _[w] = !o && (i || h >= 120 && P.length >= 120) ? new er(w && P) : n;
        }
        P = t[0];
        var F = -1, q = _[0];
        t:
          for (; ++F < h && $.length < A; ) {
            var j = P[F], J = i ? i(j) : j;
            if (j = o || j !== 0 ? j : 0, !(q ? ti(q, J) : c($, J, o))) {
              for (w = v; --w; ) {
                var rt = _[w];
                if (!(rt ? ti(rt, J) : c(t[w], J, o)))
                  continue t;
              }
              q && q.push(J), $.push(j);
            }
          }
        return $;
      }
      function Gg(t, i, o, c) {
        return en(t, function(h, v, w) {
          i(c, o(h), v, w);
        }), c;
      }
      function ai(t, i, o) {
        i = Dn(i, t), t = sf(t, i);
        var c = t == null ? t : t[rn(Ue(i))];
        return c == null ? n : Ce(c, t, o);
      }
      function yc(t) {
        return Tt(t) && ce(t) == An;
      }
      function jg(t) {
        return Tt(t) && ce(t) == V;
      }
      function zg(t) {
        return Tt(t) && ce(t) == fn;
      }
      function ci(t, i, o, c, h) {
        return t === i ? !0 : t == null || i == null || !Tt(t) && !Tt(i) ? t !== t && i !== i : Kg(t, i, o, c, ci, h);
      }
      function Kg(t, i, o, c, h, v) {
        var w = tt(t), _ = tt(i), A = w ? wr : re(t), $ = _ ? wr : re(i);
        A = A == An ? k : A, $ = $ == An ? k : $;
        var P = A == k, F = $ == k, q = A == $;
        if (q && kn(t)) {
          if (!kn(i))
            return !1;
          w = !0, P = !1;
        }
        if (q && !P)
          return v || (v = new Ge()), w || Pr(t) ? Vc(t, i, o, c, h, v) : b0(t, i, A, o, c, h, v);
        if (!(o & I)) {
          var j = P && vt.call(t, "__wrapped__"), J = F && vt.call(i, "__wrapped__");
          if (j || J) {
            var rt = j ? t.value() : t, X = J ? i.value() : i;
            return v || (v = new Ge()), h(rt, X, o, c, v);
          }
        }
        return q ? (v || (v = new Ge()), _0(t, i, o, c, h, v)) : !1;
      }
      function Jg(t) {
        return Tt(t) && re(t) == ye;
      }
      function Ko(t, i, o, c) {
        var h = o.length, v = h, w = !c;
        if (t == null)
          return !v;
        for (t = wt(t); h--; ) {
          var _ = o[h];
          if (w && _[2] ? _[1] !== t[_[0]] : !(_[0] in t))
            return !1;
        }
        for (; ++h < v; ) {
          _ = o[h];
          var A = _[0], $ = t[A], P = _[1];
          if (w && _[2]) {
            if ($ === n && !(A in t))
              return !1;
          } else {
            var F = new Ge();
            if (c)
              var q = c($, P, A, t, i, F);
            if (!(q === n ? ci(P, $, I | O, c, F) : q))
              return !1;
          }
        }
        return !0;
      }
      function wc(t) {
        if (!It(t) || T0(t))
          return !1;
        var i = wn(t) ? Jp : kd;
        return i.test(sr(t));
      }
      function Xg(t) {
        return Tt(t) && ce(t) == Y;
      }
      function Yg(t) {
        return Tt(t) && re(t) == G;
      }
      function Vg(t) {
        return Tt(t) && Cs(t.length) && !!At[ce(t)];
      }
      function bc(t) {
        return typeof t == "function" ? t : t == null ? ge : typeof t == "object" ? tt(t) ? Ec(t[0], t[1]) : Cc(t) : Hf(t);
      }
      function Jo(t) {
        if (!hi(t))
          return tg(t);
        var i = [];
        for (var o in wt(t))
          vt.call(t, o) && o != "constructor" && i.push(o);
        return i;
      }
      function Zg(t) {
        if (!It(t))
          return F0(t);
        var i = hi(t), o = [];
        for (var c in t)
          c == "constructor" && (i || !vt.call(t, c)) || o.push(c);
        return o;
      }
      function Xo(t, i) {
        return t < i;
      }
      function _c(t, i) {
        var o = -1, c = de(t) ? S(t.length) : [];
        return Fn(t, function(h, v, w) {
          c[++o] = i(h, v, w);
        }), c;
      }
      function Cc(t) {
        var i = fu(t);
        return i.length == 1 && i[0][2] ? nf(i[0][0], i[0][1]) : function(o) {
          return o === t || Ko(o, t, i);
        };
      }
      function Ec(t, i) {
        return hu(t) && ef(i) ? nf(rn(t), i) : function(o) {
          var c = Cu(o, t);
          return c === n && c === i ? Eu(o, t) : ci(i, c, I | O);
        };
      }
      function os(t, i, o, c, h) {
        t !== i && Ho(i, function(v, w) {
          if (h || (h = new Ge()), It(v))
            Qg(t, i, w, o, os, c, h);
          else {
            var _ = c ? c(pu(t, w), v, w + "", t, i, h) : n;
            _ === n && (_ = v), Wo(t, w, _);
          }
        }, pe);
      }
      function Qg(t, i, o, c, h, v, w) {
        var _ = pu(t, o), A = pu(i, o), $ = w.get(A);
        if ($) {
          Wo(t, o, $);
          return;
        }
        var P = v ? v(_, A, o + "", t, i, w) : n, F = P === n;
        if (F) {
          var q = tt(A), j = !q && kn(A), J = !q && !j && Pr(A);
          P = A, q || j || J ? tt(_) ? P = _ : Pt(_) ? P = he(_) : j ? (F = !1, P = Mc(A, !0)) : J ? (F = !1, P = Dc(A, !0)) : P = [] : pi(A) || or(A) ? (P = _, or(_) ? P = Pf(_) : (!It(_) || wn(_)) && (P = tf(A))) : F = !1;
        }
        F && (w.set(A, P), h(P, A, c, v, w), w.delete(A)), Wo(t, o, P);
      }
      function Ac(t, i) {
        var o = t.length;
        if (o)
          return i += i < 0 ? o : 0, yn(i, o) ? t[i] : n;
      }
      function xc(t, i, o) {
        i.length ? i = St(i, function(v) {
          return tt(v) ? function(w) {
            return rr(w, v.length === 1 ? v[0] : v);
          } : v;
        }) : i = [ge];
        var c = -1;
        i = St(i, Ee(K()));
        var h = _c(t, function(v, w, _) {
          var A = St(i, function($) {
            return $(v);
          });
          return { criteria: A, index: ++c, value: v };
        });
        return Sp(h, function(v, w) {
          return h0(v, w, o);
        });
      }
      function t0(t, i) {
        return Sc(t, i, function(o, c) {
          return Eu(t, c);
        });
      }
      function Sc(t, i, o) {
        for (var c = -1, h = i.length, v = {}; ++c < h; ) {
          var w = i[c], _ = rr(t, w);
          o(_, w) && fi(v, Dn(w, t), _);
        }
        return v;
      }
      function e0(t) {
        return function(i) {
          return rr(i, t);
        };
      }
      function Yo(t, i, o, c) {
        var h = c ? xp : Cr, v = -1, w = i.length, _ = t;
        for (t === i && (i = he(i)), o && (_ = St(t, Ee(o))); ++v < w; )
          for (var A = 0, $ = i[v], P = o ? o($) : $; (A = h(_, P, A, c)) > -1; )
            _ !== t && Yi.call(_, A, 1), Yi.call(t, A, 1);
        return t;
      }
      function Rc(t, i) {
        for (var o = t ? i.length : 0, c = o - 1; o--; ) {
          var h = i[o];
          if (o == c || h !== v) {
            var v = h;
            yn(h) ? Yi.call(t, h, 1) : tu(t, h);
          }
        }
        return t;
      }
      function Vo(t, i) {
        return t + Qi(uc() * (i - t + 1));
      }
      function n0(t, i, o, c) {
        for (var h = -1, v = Wt(Zi((i - t) / (o || 1)), 0), w = S(v); v--; )
          w[c ? v : ++h] = t, t += o;
        return w;
      }
      function Zo(t, i) {
        var o = "";
        if (!t || i < 1 || i > se)
          return o;
        do
          i % 2 && (o += t), i = Qi(i / 2), i && (t += t);
        while (i);
        return o;
      }
      function st(t, i) {
        return gu(rf(t, i, ge), t + "");
      }
      function r0(t) {
        return fc(Fr(t));
      }
      function i0(t, i) {
        var o = Fr(t);
        return vs(o, nr(i, 0, o.length));
      }
      function fi(t, i, o, c) {
        if (!It(t))
          return t;
        i = Dn(i, t);
        for (var h = -1, v = i.length, w = v - 1, _ = t; _ != null && ++h < v; ) {
          var A = rn(i[h]), $ = o;
          if (A === "__proto__" || A === "constructor" || A === "prototype")
            return t;
          if (h != w) {
            var P = _[A];
            $ = c ? c(P, A, _) : n, $ === n && ($ = It(P) ? P : yn(i[h + 1]) ? [] : {});
          }
          oi(_, A, $), _ = _[A];
        }
        return t;
      }
      var Ic = ts ? function(t, i) {
        return ts.set(t, i), t;
      } : ge, s0 = Vi ? function(t, i) {
        return Vi(t, "toString", {
          configurable: !0,
          enumerable: !1,
          value: xu(i),
          writable: !0
        });
      } : ge;
      function o0(t) {
        return vs(Fr(t));
      }
      function De(t, i, o) {
        var c = -1, h = t.length;
        i < 0 && (i = -i > h ? 0 : h + i), o = o > h ? h : o, o < 0 && (o += h), h = i > o ? 0 : o - i >>> 0, i >>>= 0;
        for (var v = S(h); ++c < h; )
          v[c] = t[c + i];
        return v;
      }
      function u0(t, i) {
        var o;
        return Fn(t, function(c, h, v) {
          return o = i(c, h, v), !o;
        }), !!o;
      }
      function us(t, i, o) {
        var c = 0, h = t == null ? c : t.length;
        if (typeof i == "number" && i === i && h <= $i) {
          for (; c < h; ) {
            var v = c + h >>> 1, w = t[v];
            w !== null && !xe(w) && (o ? w <= i : w < i) ? c = v + 1 : h = v;
          }
          return h;
        }
        return Qo(t, i, ge, o);
      }
      function Qo(t, i, o, c) {
        var h = 0, v = t == null ? 0 : t.length;
        if (v === 0)
          return 0;
        i = o(i);
        for (var w = i !== i, _ = i === null, A = xe(i), $ = i === n; h < v; ) {
          var P = Qi((h + v) / 2), F = o(t[P]), q = F !== n, j = F === null, J = F === F, rt = xe(F);
          if (w)
            var X = c || J;
          else
            $ ? X = J && (c || q) : _ ? X = J && q && (c || !j) : A ? X = J && q && !j && (c || !rt) : j || rt ? X = !1 : X = c ? F <= i : F < i;
          X ? h = P + 1 : v = P;
        }
        return ne(v, Vr);
      }
      function Oc(t, i) {
        for (var o = -1, c = t.length, h = 0, v = []; ++o < c; ) {
          var w = t[o], _ = i ? i(w) : w;
          if (!o || !je(_, A)) {
            var A = _;
            v[h++] = w === 0 ? 0 : w;
          }
        }
        return v;
      }
      function Tc(t) {
        return typeof t == "number" ? t : xe(t) ? En : +t;
      }
      function Ae(t) {
        if (typeof t == "string")
          return t;
        if (tt(t))
          return St(t, Ae) + "";
        if (xe(t))
          return ac ? ac.call(t) : "";
        var i = t + "";
        return i == "0" && 1 / t == -te ? "-0" : i;
      }
      function Mn(t, i, o) {
        var c = -1, h = qi, v = t.length, w = !0, _ = [], A = _;
        if (o)
          w = !1, h = Io;
        else if (v >= u) {
          var $ = i ? null : y0(t);
          if ($)
            return Bi($);
          w = !1, h = ti, A = new er();
        } else
          A = i ? [] : _;
        t:
          for (; ++c < v; ) {
            var P = t[c], F = i ? i(P) : P;
            if (P = o || P !== 0 ? P : 0, w && F === F) {
              for (var q = A.length; q--; )
                if (A[q] === F)
                  continue t;
              i && A.push(F), _.push(P);
            } else
              h(A, F, o) || (A !== _ && A.push(F), _.push(P));
          }
        return _;
      }
      function tu(t, i) {
        return i = Dn(i, t), t = sf(t, i), t == null || delete t[rn(Ue(i))];
      }
      function Lc(t, i, o, c) {
        return fi(t, i, o(rr(t, i)), c);
      }
      function as(t, i, o, c) {
        for (var h = t.length, v = c ? h : -1; (c ? v-- : ++v < h) && i(t[v], v, t); )
          ;
        return o ? De(t, c ? 0 : v, c ? v + 1 : h) : De(t, c ? v + 1 : 0, c ? h : v);
      }
      function $c(t, i) {
        var o = t;
        return o instanceof at && (o = o.value()), Oo(i, function(c, h) {
          return h.func.apply(h.thisArg, Ln([c], h.args));
        }, o);
      }
      function eu(t, i, o) {
        var c = t.length;
        if (c < 2)
          return c ? Mn(t[0]) : [];
        for (var h = -1, v = S(c); ++h < c; )
          for (var w = t[h], _ = -1; ++_ < c; )
            _ != h && (v[h] = ui(v[h] || w, t[_], i, o));
        return Mn(Vt(v, 1), i, o);
      }
      function Pc(t, i, o) {
        for (var c = -1, h = t.length, v = i.length, w = {}; ++c < h; ) {
          var _ = c < v ? i[c] : n;
          o(w, t[c], _);
        }
        return w;
      }
      function nu(t) {
        return Pt(t) ? t : [];
      }
      function ru(t) {
        return typeof t == "function" ? t : ge;
      }
      function Dn(t, i) {
        return tt(t) ? t : hu(t, i) ? [t] : cf(gt(t));
      }
      var a0 = st;
      function Un(t, i, o) {
        var c = t.length;
        return o = o === n ? c : o, !i && o >= c ? t : De(t, i, o);
      }
      var Fc = Xp || function(t) {
        return Yt.clearTimeout(t);
      };
      function Mc(t, i) {
        if (i)
          return t.slice();
        var o = t.length, c = nc ? nc(o) : new t.constructor(o);
        return t.copy(c), c;
      }
      function iu(t) {
        var i = new t.constructor(t.byteLength);
        return new Ji(i).set(new Ji(t)), i;
      }
      function c0(t, i) {
        var o = i ? iu(t.buffer) : t.buffer;
        return new t.constructor(o, t.byteOffset, t.byteLength);
      }
      function f0(t) {
        var i = new t.constructor(t.source, ya.exec(t));
        return i.lastIndex = t.lastIndex, i;
      }
      function l0(t) {
        return si ? wt(si.call(t)) : {};
      }
      function Dc(t, i) {
        var o = i ? iu(t.buffer) : t.buffer;
        return new t.constructor(o, t.byteOffset, t.length);
      }
      function Uc(t, i) {
        if (t !== i) {
          var o = t !== n, c = t === null, h = t === t, v = xe(t), w = i !== n, _ = i === null, A = i === i, $ = xe(i);
          if (!_ && !$ && !v && t > i || v && w && A && !_ && !$ || c && w && A || !o && A || !h)
            return 1;
          if (!c && !v && !$ && t < i || $ && o && h && !c && !v || _ && o && h || !w && h || !A)
            return -1;
        }
        return 0;
      }
      function h0(t, i, o) {
        for (var c = -1, h = t.criteria, v = i.criteria, w = h.length, _ = o.length; ++c < w; ) {
          var A = Uc(h[c], v[c]);
          if (A) {
            if (c >= _)
              return A;
            var $ = o[c];
            return A * ($ == "desc" ? -1 : 1);
          }
        }
        return t.index - i.index;
      }
      function kc(t, i, o, c) {
        for (var h = -1, v = t.length, w = o.length, _ = -1, A = i.length, $ = Wt(v - w, 0), P = S(A + $), F = !c; ++_ < A; )
          P[_] = i[_];
        for (; ++h < w; )
          (F || h < v) && (P[o[h]] = t[h]);
        for (; $--; )
          P[_++] = t[h++];
        return P;
      }
      function Nc(t, i, o, c) {
        for (var h = -1, v = t.length, w = -1, _ = o.length, A = -1, $ = i.length, P = Wt(v - _, 0), F = S(P + $), q = !c; ++h < P; )
          F[h] = t[h];
        for (var j = h; ++A < $; )
          F[j + A] = i[A];
        for (; ++w < _; )
          (q || h < v) && (F[j + o[w]] = t[h++]);
        return F;
      }
      function he(t, i) {
        var o = -1, c = t.length;
        for (i || (i = S(c)); ++o < c; )
          i[o] = t[o];
        return i;
      }
      function nn(t, i, o, c) {
        var h = !o;
        o || (o = {});
        for (var v = -1, w = i.length; ++v < w; ) {
          var _ = i[v], A = c ? c(o[_], t[_], _, o, t) : n;
          A === n && (A = t[_]), h ? gn(o, _, A) : oi(o, _, A);
        }
        return o;
      }
      function d0(t, i) {
        return nn(t, lu(t), i);
      }
      function p0(t, i) {
        return nn(t, Zc(t), i);
      }
      function cs(t, i) {
        return function(o, c) {
          var h = tt(o) ? wp : Dg, v = i ? i() : {};
          return h(o, t, K(c, 2), v);
        };
      }
      function Tr(t) {
        return st(function(i, o) {
          var c = -1, h = o.length, v = h > 1 ? o[h - 1] : n, w = h > 2 ? o[2] : n;
          for (v = t.length > 3 && typeof v == "function" ? (h--, v) : n, w && fe(o[0], o[1], w) && (v = h < 3 ? n : v, h = 1), i = wt(i); ++c < h; ) {
            var _ = o[c];
            _ && t(i, _, c, v);
          }
          return i;
        });
      }
      function qc(t, i) {
        return function(o, c) {
          if (o == null)
            return o;
          if (!de(o))
            return t(o, c);
          for (var h = o.length, v = i ? h : -1, w = wt(o); (i ? v-- : ++v < h) && c(w[v], v, w) !== !1; )
            ;
          return o;
        };
      }
      function Wc(t) {
        return function(i, o, c) {
          for (var h = -1, v = wt(i), w = c(i), _ = w.length; _--; ) {
            var A = w[t ? _ : ++h];
            if (o(v[A], A, v) === !1)
              break;
          }
          return i;
        };
      }
      function g0(t, i, o) {
        var c = i & R, h = li(t);
        function v() {
          var w = this && this !== Yt && this instanceof v ? h : t;
          return w.apply(c ? o : this, arguments);
        }
        return v;
      }
      function Bc(t) {
        return function(i) {
          i = gt(i);
          var o = Er(i) ? He(i) : n, c = o ? o[0] : i.charAt(0), h = o ? Un(o, 1).join("") : i.slice(1);
          return c[t]() + h;
        };
      }
      function Lr(t) {
        return function(i) {
          return Oo(Wf(qf(i).replace(sp, "")), t, "");
        };
      }
      function li(t) {
        return function() {
          var i = arguments;
          switch (i.length) {
            case 0:
              return new t();
            case 1:
              return new t(i[0]);
            case 2:
              return new t(i[0], i[1]);
            case 3:
              return new t(i[0], i[1], i[2]);
            case 4:
              return new t(i[0], i[1], i[2], i[3]);
            case 5:
              return new t(i[0], i[1], i[2], i[3], i[4]);
            case 6:
              return new t(i[0], i[1], i[2], i[3], i[4], i[5]);
            case 7:
              return new t(i[0], i[1], i[2], i[3], i[4], i[5], i[6]);
          }
          var o = Or(t.prototype), c = t.apply(o, i);
          return It(c) ? c : o;
        };
      }
      function v0(t, i, o) {
        var c = li(t);
        function h() {
          for (var v = arguments.length, w = S(v), _ = v, A = $r(h); _--; )
            w[_] = arguments[_];
          var $ = v < 3 && w[0] !== A && w[v - 1] !== A ? [] : $n(w, A);
          if (v -= $.length, v < o)
            return Kc(
              t,
              i,
              fs,
              h.placeholder,
              n,
              w,
              $,
              n,
              n,
              o - v
            );
          var P = this && this !== Yt && this instanceof h ? c : t;
          return Ce(P, this, w);
        }
        return h;
      }
      function Hc(t) {
        return function(i, o, c) {
          var h = wt(i);
          if (!de(i)) {
            var v = K(o, 3);
            i = Gt(i), o = function(_) {
              return v(h[_], _, h);
            };
          }
          var w = t(i, o, c);
          return w > -1 ? h[v ? i[w] : w] : n;
        };
      }
      function Gc(t) {
        return mn(function(i) {
          var o = i.length, c = o, h = Fe.prototype.thru;
          for (t && i.reverse(); c--; ) {
            var v = i[c];
            if (typeof v != "function")
              throw new Pe(f);
            if (h && !w && ps(v) == "wrapper")
              var w = new Fe([], !0);
          }
          for (c = w ? c : o; ++c < o; ) {
            v = i[c];
            var _ = ps(v), A = _ == "wrapper" ? cu(v) : n;
            A && du(A[0]) && A[1] == (_t | U | z | xt) && !A[4].length && A[9] == 1 ? w = w[ps(A[0])].apply(w, A[3]) : w = v.length == 1 && du(v) ? w[_]() : w.thru(v);
          }
          return function() {
            var $ = arguments, P = $[0];
            if (w && $.length == 1 && tt(P))
              return w.plant(P).value();
            for (var F = 0, q = o ? i[F].apply(this, $) : P; ++F < o; )
              q = i[F].call(this, q);
            return q;
          };
        });
      }
      function fs(t, i, o, c, h, v, w, _, A, $) {
        var P = i & _t, F = i & R, q = i & x, j = i & (U | M), J = i & Te, rt = q ? n : li(t);
        function X() {
          for (var ot = arguments.length, lt = S(ot), Se = ot; Se--; )
            lt[Se] = arguments[Se];
          if (j)
            var le = $r(X), Re = Ip(lt, le);
          if (c && (lt = kc(lt, c, h, j)), v && (lt = Nc(lt, v, w, j)), ot -= Re, j && ot < $) {
            var Ft = $n(lt, le);
            return Kc(
              t,
              i,
              fs,
              X.placeholder,
              o,
              lt,
              Ft,
              _,
              A,
              $ - ot
            );
          }
          var ze = F ? o : this, _n = q ? ze[t] : t;
          return ot = lt.length, _ ? lt = D0(lt, _) : J && ot > 1 && lt.reverse(), P && A < ot && (lt.length = A), this && this !== Yt && this instanceof X && (_n = rt || li(_n)), _n.apply(ze, lt);
        }
        return X;
      }
      function jc(t, i) {
        return function(o, c) {
          return Gg(o, t, i(c), {});
        };
      }
      function ls(t, i) {
        return function(o, c) {
          var h;
          if (o === n && c === n)
            return i;
          if (o !== n && (h = o), c !== n) {
            if (h === n)
              return c;
            typeof o == "string" || typeof c == "string" ? (o = Ae(o), c = Ae(c)) : (o = Tc(o), c = Tc(c)), h = t(o, c);
          }
          return h;
        };
      }
      function su(t) {
        return mn(function(i) {
          return i = St(i, Ee(K())), st(function(o) {
            var c = this;
            return t(i, function(h) {
              return Ce(h, c, o);
            });
          });
        });
      }
      function hs(t, i) {
        i = i === n ? " " : Ae(i);
        var o = i.length;
        if (o < 2)
          return o ? Zo(i, t) : i;
        var c = Zo(i, Zi(t / Ar(i)));
        return Er(i) ? Un(He(c), 0, t).join("") : c.slice(0, t);
      }
      function m0(t, i, o, c) {
        var h = i & R, v = li(t);
        function w() {
          for (var _ = -1, A = arguments.length, $ = -1, P = c.length, F = S(P + A), q = this && this !== Yt && this instanceof w ? v : t; ++$ < P; )
            F[$] = c[$];
          for (; A--; )
            F[$++] = arguments[++_];
          return Ce(q, h ? o : this, F);
        }
        return w;
      }
      function zc(t) {
        return function(i, o, c) {
          return c && typeof c != "number" && fe(i, o, c) && (o = c = n), i = bn(i), o === n ? (o = i, i = 0) : o = bn(o), c = c === n ? i < o ? 1 : -1 : bn(c), n0(i, o, c, t);
        };
      }
      function ds(t) {
        return function(i, o) {
          return typeof i == "string" && typeof o == "string" || (i = ke(i), o = ke(o)), t(i, o);
        };
      }
      function Kc(t, i, o, c, h, v, w, _, A, $) {
        var P = i & U, F = P ? w : n, q = P ? n : w, j = P ? v : n, J = P ? n : v;
        i |= P ? z : ht, i &= ~(P ? ht : z), i & D || (i &= ~(R | x));
        var rt = [
          t,
          i,
          h,
          j,
          F,
          J,
          q,
          _,
          A,
          $
        ], X = o.apply(n, rt);
        return du(t) && of(X, rt), X.placeholder = c, uf(X, t, i);
      }
      function ou(t) {
        var i = qt[t];
        return function(o, c) {
          if (o = ke(o), c = c == null ? 0 : ne(nt(c), 292), c && oc(o)) {
            var h = (gt(o) + "e").split("e"), v = i(h[0] + "e" + (+h[1] + c));
            return h = (gt(v) + "e").split("e"), +(h[0] + "e" + (+h[1] - c));
          }
          return i(o);
        };
      }
      var y0 = Rr && 1 / Bi(new Rr([, -0]))[1] == te ? function(t) {
        return new Rr(t);
      } : Iu;
      function Jc(t) {
        return function(i) {
          var o = re(i);
          return o == ye ? Do(i) : o == G ? Mp(i) : Rp(i, t(i));
        };
      }
      function vn(t, i, o, c, h, v, w, _) {
        var A = i & x;
        if (!A && typeof t != "function")
          throw new Pe(f);
        var $ = c ? c.length : 0;
        if ($ || (i &= ~(z | ht), c = h = n), w = w === n ? w : Wt(nt(w), 0), _ = _ === n ? _ : nt(_), $ -= h ? h.length : 0, i & ht) {
          var P = c, F = h;
          c = h = n;
        }
        var q = A ? n : cu(t), j = [
          t,
          i,
          o,
          c,
          h,
          P,
          F,
          v,
          w,
          _
        ];
        if (q && P0(j, q), t = j[0], i = j[1], o = j[2], c = j[3], h = j[4], _ = j[9] = j[9] === n ? A ? 0 : t.length : Wt(j[9] - $, 0), !_ && i & (U | M) && (i &= ~(U | M)), !i || i == R)
          var J = g0(t, i, o);
        else
          i == U || i == M ? J = v0(t, i, _) : (i == z || i == (R | z)) && !h.length ? J = m0(t, i, o, c) : J = fs.apply(n, j);
        var rt = q ? Ic : of;
        return uf(rt(J, j), t, i);
      }
      function Xc(t, i, o, c) {
        return t === n || je(t, Sr[o]) && !vt.call(c, o) ? i : t;
      }
      function Yc(t, i, o, c, h, v) {
        return It(t) && It(i) && (v.set(i, t), os(t, i, n, Yc, v), v.delete(i)), t;
      }
      function w0(t) {
        return pi(t) ? n : t;
      }
      function Vc(t, i, o, c, h, v) {
        var w = o & I, _ = t.length, A = i.length;
        if (_ != A && !(w && A > _))
          return !1;
        var $ = v.get(t), P = v.get(i);
        if ($ && P)
          return $ == i && P == t;
        var F = -1, q = !0, j = o & O ? new er() : n;
        for (v.set(t, i), v.set(i, t); ++F < _; ) {
          var J = t[F], rt = i[F];
          if (c)
            var X = w ? c(rt, J, F, i, t, v) : c(J, rt, F, t, i, v);
          if (X !== n) {
            if (X)
              continue;
            q = !1;
            break;
          }
          if (j) {
            if (!To(i, function(ot, lt) {
              if (!ti(j, lt) && (J === ot || h(J, ot, o, c, v)))
                return j.push(lt);
            })) {
              q = !1;
              break;
            }
          } else if (!(J === rt || h(J, rt, o, c, v))) {
            q = !1;
            break;
          }
        }
        return v.delete(t), v.delete(i), q;
      }
      function b0(t, i, o, c, h, v, w) {
        switch (o) {
          case pt:
            if (t.byteLength != i.byteLength || t.byteOffset != i.byteOffset)
              return !1;
            t = t.buffer, i = i.buffer;
          case V:
            return !(t.byteLength != i.byteLength || !v(new Ji(t), new Ji(i)));
          case cn:
          case fn:
          case Sn:
            return je(+t, +i);
          case ee:
            return t.name == i.name && t.message == i.message;
          case Y:
          case Q:
            return t == i + "";
          case ye:
            var _ = Do;
          case G:
            var A = c & I;
            if (_ || (_ = Bi), t.size != i.size && !A)
              return !1;
            var $ = w.get(t);
            if ($)
              return $ == i;
            c |= O, w.set(t, i);
            var P = Vc(_(t), _(i), c, h, v, w);
            return w.delete(t), P;
          case mt:
            if (si)
              return si.call(t) == si.call(i);
        }
        return !1;
      }
      function _0(t, i, o, c, h, v) {
        var w = o & I, _ = uu(t), A = _.length, $ = uu(i), P = $.length;
        if (A != P && !w)
          return !1;
        for (var F = A; F--; ) {
          var q = _[F];
          if (!(w ? q in i : vt.call(i, q)))
            return !1;
        }
        var j = v.get(t), J = v.get(i);
        if (j && J)
          return j == i && J == t;
        var rt = !0;
        v.set(t, i), v.set(i, t);
        for (var X = w; ++F < A; ) {
          q = _[F];
          var ot = t[q], lt = i[q];
          if (c)
            var Se = w ? c(lt, ot, q, i, t, v) : c(ot, lt, q, t, i, v);
          if (!(Se === n ? ot === lt || h(ot, lt, o, c, v) : Se)) {
            rt = !1;
            break;
          }
          X || (X = q == "constructor");
        }
        if (rt && !X) {
          var le = t.constructor, Re = i.constructor;
          le != Re && "constructor" in t && "constructor" in i && !(typeof le == "function" && le instanceof le && typeof Re == "function" && Re instanceof Re) && (rt = !1);
        }
        return v.delete(t), v.delete(i), rt;
      }
      function mn(t) {
        return gu(rf(t, n, df), t + "");
      }
      function uu(t) {
        return mc(t, Gt, lu);
      }
      function au(t) {
        return mc(t, pe, Zc);
      }
      var cu = ts ? function(t) {
        return ts.get(t);
      } : Iu;
      function ps(t) {
        for (var i = t.name + "", o = Ir[i], c = vt.call(Ir, i) ? o.length : 0; c--; ) {
          var h = o[c], v = h.func;
          if (v == null || v == t)
            return h.name;
        }
        return i;
      }
      function $r(t) {
        var i = vt.call(g, "placeholder") ? g : t;
        return i.placeholder;
      }
      function K() {
        var t = g.iteratee || Su;
        return t = t === Su ? bc : t, arguments.length ? t(arguments[0], arguments[1]) : t;
      }
      function gs(t, i) {
        var o = t.__data__;
        return O0(i) ? o[typeof i == "string" ? "string" : "hash"] : o.map;
      }
      function fu(t) {
        for (var i = Gt(t), o = i.length; o--; ) {
          var c = i[o], h = t[c];
          i[o] = [c, h, ef(h)];
        }
        return i;
      }
      function ir(t, i) {
        var o = $p(t, i);
        return wc(o) ? o : n;
      }
      function C0(t) {
        var i = vt.call(t, Qn), o = t[Qn];
        try {
          t[Qn] = n;
          var c = !0;
        } catch {
        }
        var h = zi.call(t);
        return c && (i ? t[Qn] = o : delete t[Qn]), h;
      }
      var lu = ko ? function(t) {
        return t == null ? [] : (t = wt(t), Tn(ko(t), function(i) {
          return ic.call(t, i);
        }));
      } : Ou, Zc = ko ? function(t) {
        for (var i = []; t; )
          Ln(i, lu(t)), t = Xi(t);
        return i;
      } : Ou, re = ce;
      (No && re(new No(new ArrayBuffer(1))) != pt || ni && re(new ni()) != ye || qo && re(qo.resolve()) != H || Rr && re(new Rr()) != G || ri && re(new ri()) != ft) && (re = function(t) {
        var i = ce(t), o = i == k ? t.constructor : n, c = o ? sr(o) : "";
        if (c)
          switch (c) {
            case ig:
              return pt;
            case sg:
              return ye;
            case og:
              return H;
            case ug:
              return G;
            case ag:
              return ft;
          }
        return i;
      });
      function E0(t, i, o) {
        for (var c = -1, h = o.length; ++c < h; ) {
          var v = o[c], w = v.size;
          switch (v.type) {
            case "drop":
              t += w;
              break;
            case "dropRight":
              i -= w;
              break;
            case "take":
              i = ne(i, t + w);
              break;
            case "takeRight":
              t = Wt(t, i - w);
              break;
          }
        }
        return { start: t, end: i };
      }
      function A0(t) {
        var i = t.match(Td);
        return i ? i[1].split(Ld) : [];
      }
      function Qc(t, i, o) {
        i = Dn(i, t);
        for (var c = -1, h = i.length, v = !1; ++c < h; ) {
          var w = rn(i[c]);
          if (!(v = t != null && o(t, w)))
            break;
          t = t[w];
        }
        return v || ++c != h ? v : (h = t == null ? 0 : t.length, !!h && Cs(h) && yn(w, h) && (tt(t) || or(t)));
      }
      function x0(t) {
        var i = t.length, o = new t.constructor(i);
        return i && typeof t[0] == "string" && vt.call(t, "index") && (o.index = t.index, o.input = t.input), o;
      }
      function tf(t) {
        return typeof t.constructor == "function" && !hi(t) ? Or(Xi(t)) : {};
      }
      function S0(t, i, o) {
        var c = t.constructor;
        switch (i) {
          case V:
            return iu(t);
          case cn:
          case fn:
            return new c(+t);
          case pt:
            return c0(t, o);
          case we:
          case ln:
          case Kt:
          case Nt:
          case oe:
          case tn:
          case Rn:
          case be:
          case In:
            return Dc(t, o);
          case ye:
            return new c();
          case Sn:
          case Q:
            return new c(t);
          case Y:
            return f0(t);
          case G:
            return new c();
          case mt:
            return l0(t);
        }
      }
      function R0(t, i) {
        var o = i.length;
        if (!o)
          return t;
        var c = o - 1;
        return i[c] = (o > 1 ? "& " : "") + i[c], i = i.join(o > 2 ? ", " : " "), t.replace(Od, `{
/* [wrapped with ` + i + `] */
`);
      }
      function I0(t) {
        return tt(t) || or(t) || !!(sc && t && t[sc]);
      }
      function yn(t, i) {
        var o = typeof t;
        return i = i ?? se, !!i && (o == "number" || o != "symbol" && qd.test(t)) && t > -1 && t % 1 == 0 && t < i;
      }
      function fe(t, i, o) {
        if (!It(o))
          return !1;
        var c = typeof i;
        return (c == "number" ? de(o) && yn(i, o.length) : c == "string" && i in o) ? je(o[i], t) : !1;
      }
      function hu(t, i) {
        if (tt(t))
          return !1;
        var o = typeof t;
        return o == "number" || o == "symbol" || o == "boolean" || t == null || xe(t) ? !0 : ae.test(t) || !ue.test(t) || i != null && t in wt(i);
      }
      function O0(t) {
        var i = typeof t;
        return i == "string" || i == "number" || i == "symbol" || i == "boolean" ? t !== "__proto__" : t === null;
      }
      function du(t) {
        var i = ps(t), o = g[i];
        if (typeof o != "function" || !(i in at.prototype))
          return !1;
        if (t === o)
          return !0;
        var c = cu(o);
        return !!c && t === c[0];
      }
      function T0(t) {
        return !!ec && ec in t;
      }
      var L0 = Gi ? wn : Tu;
      function hi(t) {
        var i = t && t.constructor, o = typeof i == "function" && i.prototype || Sr;
        return t === o;
      }
      function ef(t) {
        return t === t && !It(t);
      }
      function nf(t, i) {
        return function(o) {
          return o == null ? !1 : o[t] === i && (i !== n || t in wt(o));
        };
      }
      function $0(t) {
        var i = bs(t, function(c) {
          return o.size === y && o.clear(), c;
        }), o = i.cache;
        return i;
      }
      function P0(t, i) {
        var o = t[1], c = i[1], h = o | c, v = h < (R | x | _t), w = c == _t && o == U || c == _t && o == xt && t[7].length <= i[8] || c == (_t | xt) && i[7].length <= i[8] && o == U;
        if (!(v || w))
          return t;
        c & R && (t[2] = i[2], h |= o & R ? 0 : D);
        var _ = i[3];
        if (_) {
          var A = t[3];
          t[3] = A ? kc(A, _, i[4]) : _, t[4] = A ? $n(t[3], p) : i[4];
        }
        return _ = i[5], _ && (A = t[5], t[5] = A ? Nc(A, _, i[6]) : _, t[6] = A ? $n(t[5], p) : i[6]), _ = i[7], _ && (t[7] = _), c & _t && (t[8] = t[8] == null ? i[8] : ne(t[8], i[8])), t[9] == null && (t[9] = i[9]), t[0] = i[0], t[1] = h, t;
      }
      function F0(t) {
        var i = [];
        if (t != null)
          for (var o in wt(t))
            i.push(o);
        return i;
      }
      function M0(t) {
        return zi.call(t);
      }
      function rf(t, i, o) {
        return i = Wt(i === n ? t.length - 1 : i, 0), function() {
          for (var c = arguments, h = -1, v = Wt(c.length - i, 0), w = S(v); ++h < v; )
            w[h] = c[i + h];
          h = -1;
          for (var _ = S(i + 1); ++h < i; )
            _[h] = c[h];
          return _[i] = o(w), Ce(t, this, _);
        };
      }
      function sf(t, i) {
        return i.length < 2 ? t : rr(t, De(i, 0, -1));
      }
      function D0(t, i) {
        for (var o = t.length, c = ne(i.length, o), h = he(t); c--; ) {
          var v = i[c];
          t[c] = yn(v, o) ? h[v] : n;
        }
        return t;
      }
      function pu(t, i) {
        if (!(i === "constructor" && typeof t[i] == "function") && i != "__proto__")
          return t[i];
      }
      var of = af(Ic), di = Vp || function(t, i) {
        return Yt.setTimeout(t, i);
      }, gu = af(s0);
      function uf(t, i, o) {
        var c = i + "";
        return gu(t, R0(c, U0(A0(c), o)));
      }
      function af(t) {
        var i = 0, o = 0;
        return function() {
          var c = eg(), h = zt - (c - o);
          if (o = c, h > 0) {
            if (++i >= We)
              return arguments[0];
          } else
            i = 0;
          return t.apply(n, arguments);
        };
      }
      function vs(t, i) {
        var o = -1, c = t.length, h = c - 1;
        for (i = i === n ? c : i; ++o < i; ) {
          var v = Vo(o, h), w = t[v];
          t[v] = t[o], t[o] = w;
        }
        return t.length = i, t;
      }
      var cf = $0(function(t) {
        var i = [];
        return t.charCodeAt(0) === 46 && i.push(""), t.replace(Xt, function(o, c, h, v) {
          i.push(h ? v.replace(Fd, "$1") : c || o);
        }), i;
      });
      function rn(t) {
        if (typeof t == "string" || xe(t))
          return t;
        var i = t + "";
        return i == "0" && 1 / t == -te ? "-0" : i;
      }
      function sr(t) {
        if (t != null) {
          try {
            return ji.call(t);
          } catch {
          }
          try {
            return t + "";
          } catch {
          }
        }
        return "";
      }
      function U0(t, i) {
        return $e(wo, function(o) {
          var c = "_." + o[0];
          i & o[1] && !qi(t, c) && t.push(c);
        }), t.sort();
      }
      function ff(t) {
        if (t instanceof at)
          return t.clone();
        var i = new Fe(t.__wrapped__, t.__chain__);
        return i.__actions__ = he(t.__actions__), i.__index__ = t.__index__, i.__values__ = t.__values__, i;
      }
      function k0(t, i, o) {
        (o ? fe(t, i, o) : i === n) ? i = 1 : i = Wt(nt(i), 0);
        var c = t == null ? 0 : t.length;
        if (!c || i < 1)
          return [];
        for (var h = 0, v = 0, w = S(Zi(c / i)); h < c; )
          w[v++] = De(t, h, h += i);
        return w;
      }
      function N0(t) {
        for (var i = -1, o = t == null ? 0 : t.length, c = 0, h = []; ++i < o; ) {
          var v = t[i];
          v && (h[c++] = v);
        }
        return h;
      }
      function q0() {
        var t = arguments.length;
        if (!t)
          return [];
        for (var i = S(t - 1), o = arguments[0], c = t; c--; )
          i[c - 1] = arguments[c];
        return Ln(tt(o) ? he(o) : [o], Vt(i, 1));
      }
      var W0 = st(function(t, i) {
        return Pt(t) ? ui(t, Vt(i, 1, Pt, !0)) : [];
      }), B0 = st(function(t, i) {
        var o = Ue(i);
        return Pt(o) && (o = n), Pt(t) ? ui(t, Vt(i, 1, Pt, !0), K(o, 2)) : [];
      }), H0 = st(function(t, i) {
        var o = Ue(i);
        return Pt(o) && (o = n), Pt(t) ? ui(t, Vt(i, 1, Pt, !0), n, o) : [];
      });
      function G0(t, i, o) {
        var c = t == null ? 0 : t.length;
        return c ? (i = o || i === n ? 1 : nt(i), De(t, i < 0 ? 0 : i, c)) : [];
      }
      function j0(t, i, o) {
        var c = t == null ? 0 : t.length;
        return c ? (i = o || i === n ? 1 : nt(i), i = c - i, De(t, 0, i < 0 ? 0 : i)) : [];
      }
      function z0(t, i) {
        return t && t.length ? as(t, K(i, 3), !0, !0) : [];
      }
      function K0(t, i) {
        return t && t.length ? as(t, K(i, 3), !0) : [];
      }
      function J0(t, i, o, c) {
        var h = t == null ? 0 : t.length;
        return h ? (o && typeof o != "number" && fe(t, i, o) && (o = 0, c = h), qg(t, i, o, c)) : [];
      }
      function lf(t, i, o) {
        var c = t == null ? 0 : t.length;
        if (!c)
          return -1;
        var h = o == null ? 0 : nt(o);
        return h < 0 && (h = Wt(c + h, 0)), Wi(t, K(i, 3), h);
      }
      function hf(t, i, o) {
        var c = t == null ? 0 : t.length;
        if (!c)
          return -1;
        var h = c - 1;
        return o !== n && (h = nt(o), h = o < 0 ? Wt(c + h, 0) : ne(h, c - 1)), Wi(t, K(i, 3), h, !0);
      }
      function df(t) {
        var i = t == null ? 0 : t.length;
        return i ? Vt(t, 1) : [];
      }
      function X0(t) {
        var i = t == null ? 0 : t.length;
        return i ? Vt(t, te) : [];
      }
      function Y0(t, i) {
        var o = t == null ? 0 : t.length;
        return o ? (i = i === n ? 1 : nt(i), Vt(t, i)) : [];
      }
      function V0(t) {
        for (var i = -1, o = t == null ? 0 : t.length, c = {}; ++i < o; ) {
          var h = t[i];
          c[h[0]] = h[1];
        }
        return c;
      }
      function pf(t) {
        return t && t.length ? t[0] : n;
      }
      function Z0(t, i, o) {
        var c = t == null ? 0 : t.length;
        if (!c)
          return -1;
        var h = o == null ? 0 : nt(o);
        return h < 0 && (h = Wt(c + h, 0)), Cr(t, i, h);
      }
      function Q0(t) {
        var i = t == null ? 0 : t.length;
        return i ? De(t, 0, -1) : [];
      }
      var tv = st(function(t) {
        var i = St(t, nu);
        return i.length && i[0] === t[0] ? zo(i) : [];
      }), ev = st(function(t) {
        var i = Ue(t), o = St(t, nu);
        return i === Ue(o) ? i = n : o.pop(), o.length && o[0] === t[0] ? zo(o, K(i, 2)) : [];
      }), nv = st(function(t) {
        var i = Ue(t), o = St(t, nu);
        return i = typeof i == "function" ? i : n, i && o.pop(), o.length && o[0] === t[0] ? zo(o, n, i) : [];
      });
      function rv(t, i) {
        return t == null ? "" : Qp.call(t, i);
      }
      function Ue(t) {
        var i = t == null ? 0 : t.length;
        return i ? t[i - 1] : n;
      }
      function iv(t, i, o) {
        var c = t == null ? 0 : t.length;
        if (!c)
          return -1;
        var h = c;
        return o !== n && (h = nt(o), h = h < 0 ? Wt(c + h, 0) : ne(h, c - 1)), i === i ? Up(t, i, h) : Wi(t, Ka, h, !0);
      }
      function sv(t, i) {
        return t && t.length ? Ac(t, nt(i)) : n;
      }
      var ov = st(gf);
      function gf(t, i) {
        return t && t.length && i && i.length ? Yo(t, i) : t;
      }
      function uv(t, i, o) {
        return t && t.length && i && i.length ? Yo(t, i, K(o, 2)) : t;
      }
      function av(t, i, o) {
        return t && t.length && i && i.length ? Yo(t, i, n, o) : t;
      }
      var cv = mn(function(t, i) {
        var o = t == null ? 0 : t.length, c = Bo(t, i);
        return Rc(t, St(i, function(h) {
          return yn(h, o) ? +h : h;
        }).sort(Uc)), c;
      });
      function fv(t, i) {
        var o = [];
        if (!(t && t.length))
          return o;
        var c = -1, h = [], v = t.length;
        for (i = K(i, 3); ++c < v; ) {
          var w = t[c];
          i(w, c, t) && (o.push(w), h.push(c));
        }
        return Rc(t, h), o;
      }
      function vu(t) {
        return t == null ? t : rg.call(t);
      }
      function lv(t, i, o) {
        var c = t == null ? 0 : t.length;
        return c ? (o && typeof o != "number" && fe(t, i, o) ? (i = 0, o = c) : (i = i == null ? 0 : nt(i), o = o === n ? c : nt(o)), De(t, i, o)) : [];
      }
      function hv(t, i) {
        return us(t, i);
      }
      function dv(t, i, o) {
        return Qo(t, i, K(o, 2));
      }
      function pv(t, i) {
        var o = t == null ? 0 : t.length;
        if (o) {
          var c = us(t, i);
          if (c < o && je(t[c], i))
            return c;
        }
        return -1;
      }
      function gv(t, i) {
        return us(t, i, !0);
      }
      function vv(t, i, o) {
        return Qo(t, i, K(o, 2), !0);
      }
      function mv(t, i) {
        var o = t == null ? 0 : t.length;
        if (o) {
          var c = us(t, i, !0) - 1;
          if (je(t[c], i))
            return c;
        }
        return -1;
      }
      function yv(t) {
        return t && t.length ? Oc(t) : [];
      }
      function wv(t, i) {
        return t && t.length ? Oc(t, K(i, 2)) : [];
      }
      function bv(t) {
        var i = t == null ? 0 : t.length;
        return i ? De(t, 1, i) : [];
      }
      function _v(t, i, o) {
        return t && t.length ? (i = o || i === n ? 1 : nt(i), De(t, 0, i < 0 ? 0 : i)) : [];
      }
      function Cv(t, i, o) {
        var c = t == null ? 0 : t.length;
        return c ? (i = o || i === n ? 1 : nt(i), i = c - i, De(t, i < 0 ? 0 : i, c)) : [];
      }
      function Ev(t, i) {
        return t && t.length ? as(t, K(i, 3), !1, !0) : [];
      }
      function Av(t, i) {
        return t && t.length ? as(t, K(i, 3)) : [];
      }
      var xv = st(function(t) {
        return Mn(Vt(t, 1, Pt, !0));
      }), Sv = st(function(t) {
        var i = Ue(t);
        return Pt(i) && (i = n), Mn(Vt(t, 1, Pt, !0), K(i, 2));
      }), Rv = st(function(t) {
        var i = Ue(t);
        return i = typeof i == "function" ? i : n, Mn(Vt(t, 1, Pt, !0), n, i);
      });
      function Iv(t) {
        return t && t.length ? Mn(t) : [];
      }
      function Ov(t, i) {
        return t && t.length ? Mn(t, K(i, 2)) : [];
      }
      function Tv(t, i) {
        return i = typeof i == "function" ? i : n, t && t.length ? Mn(t, n, i) : [];
      }
      function mu(t) {
        if (!(t && t.length))
          return [];
        var i = 0;
        return t = Tn(t, function(o) {
          if (Pt(o))
            return i = Wt(o.length, i), !0;
        }), Fo(i, function(o) {
          return St(t, Lo(o));
        });
      }
      function vf(t, i) {
        if (!(t && t.length))
          return [];
        var o = mu(t);
        return i == null ? o : St(o, function(c) {
          return Ce(i, n, c);
        });
      }
      var Lv = st(function(t, i) {
        return Pt(t) ? ui(t, i) : [];
      }), $v = st(function(t) {
        return eu(Tn(t, Pt));
      }), Pv = st(function(t) {
        var i = Ue(t);
        return Pt(i) && (i = n), eu(Tn(t, Pt), K(i, 2));
      }), Fv = st(function(t) {
        var i = Ue(t);
        return i = typeof i == "function" ? i : n, eu(Tn(t, Pt), n, i);
      }), Mv = st(mu);
      function Dv(t, i) {
        return Pc(t || [], i || [], oi);
      }
      function Uv(t, i) {
        return Pc(t || [], i || [], fi);
      }
      var kv = st(function(t) {
        var i = t.length, o = i > 1 ? t[i - 1] : n;
        return o = typeof o == "function" ? (t.pop(), o) : n, vf(t, o);
      });
      function mf(t) {
        var i = g(t);
        return i.__chain__ = !0, i;
      }
      function Nv(t, i) {
        return i(t), t;
      }
      function ms(t, i) {
        return i(t);
      }
      var qv = mn(function(t) {
        var i = t.length, o = i ? t[0] : 0, c = this.__wrapped__, h = function(v) {
          return Bo(v, t);
        };
        return i > 1 || this.__actions__.length || !(c instanceof at) || !yn(o) ? this.thru(h) : (c = c.slice(o, +o + (i ? 1 : 0)), c.__actions__.push({
          func: ms,
          args: [h],
          thisArg: n
        }), new Fe(c, this.__chain__).thru(function(v) {
          return i && !v.length && v.push(n), v;
        }));
      });
      function Wv() {
        return mf(this);
      }
      function Bv() {
        return new Fe(this.value(), this.__chain__);
      }
      function Hv() {
        this.__values__ === n && (this.__values__ = Lf(this.value()));
        var t = this.__index__ >= this.__values__.length, i = t ? n : this.__values__[this.__index__++];
        return { done: t, value: i };
      }
      function Gv() {
        return this;
      }
      function jv(t) {
        for (var i, o = this; o instanceof ns; ) {
          var c = ff(o);
          c.__index__ = 0, c.__values__ = n, i ? h.__wrapped__ = c : i = c;
          var h = c;
          o = o.__wrapped__;
        }
        return h.__wrapped__ = t, i;
      }
      function zv() {
        var t = this.__wrapped__;
        if (t instanceof at) {
          var i = t;
          return this.__actions__.length && (i = new at(this)), i = i.reverse(), i.__actions__.push({
            func: ms,
            args: [vu],
            thisArg: n
          }), new Fe(i, this.__chain__);
        }
        return this.thru(vu);
      }
      function Kv() {
        return $c(this.__wrapped__, this.__actions__);
      }
      var Jv = cs(function(t, i, o) {
        vt.call(t, o) ? ++t[o] : gn(t, o, 1);
      });
      function Xv(t, i, o) {
        var c = tt(t) ? ja : Ng;
        return o && fe(t, i, o) && (i = n), c(t, K(i, 3));
      }
      function Yv(t, i) {
        var o = tt(t) ? Tn : gc;
        return o(t, K(i, 3));
      }
      var Vv = Hc(lf), Zv = Hc(hf);
      function Qv(t, i) {
        return Vt(ys(t, i), 1);
      }
      function tm(t, i) {
        return Vt(ys(t, i), te);
      }
      function em(t, i, o) {
        return o = o === n ? 1 : nt(o), Vt(ys(t, i), o);
      }
      function yf(t, i) {
        var o = tt(t) ? $e : Fn;
        return o(t, K(i, 3));
      }
      function wf(t, i) {
        var o = tt(t) ? bp : pc;
        return o(t, K(i, 3));
      }
      var nm = cs(function(t, i, o) {
        vt.call(t, o) ? t[o].push(i) : gn(t, o, [i]);
      });
      function rm(t, i, o, c) {
        t = de(t) ? t : Fr(t), o = o && !c ? nt(o) : 0;
        var h = t.length;
        return o < 0 && (o = Wt(h + o, 0)), Es(t) ? o <= h && t.indexOf(i, o) > -1 : !!h && Cr(t, i, o) > -1;
      }
      var im = st(function(t, i, o) {
        var c = -1, h = typeof i == "function", v = de(t) ? S(t.length) : [];
        return Fn(t, function(w) {
          v[++c] = h ? Ce(i, w, o) : ai(w, i, o);
        }), v;
      }), sm = cs(function(t, i, o) {
        gn(t, o, i);
      });
      function ys(t, i) {
        var o = tt(t) ? St : _c;
        return o(t, K(i, 3));
      }
      function om(t, i, o, c) {
        return t == null ? [] : (tt(i) || (i = i == null ? [] : [i]), o = c ? n : o, tt(o) || (o = o == null ? [] : [o]), xc(t, i, o));
      }
      var um = cs(function(t, i, o) {
        t[o ? 0 : 1].push(i);
      }, function() {
        return [[], []];
      });
      function am(t, i, o) {
        var c = tt(t) ? Oo : Xa, h = arguments.length < 3;
        return c(t, K(i, 4), o, h, Fn);
      }
      function cm(t, i, o) {
        var c = tt(t) ? _p : Xa, h = arguments.length < 3;
        return c(t, K(i, 4), o, h, pc);
      }
      function fm(t, i) {
        var o = tt(t) ? Tn : gc;
        return o(t, _s(K(i, 3)));
      }
      function lm(t) {
        var i = tt(t) ? fc : r0;
        return i(t);
      }
      function hm(t, i, o) {
        (o ? fe(t, i, o) : i === n) ? i = 1 : i = nt(i);
        var c = tt(t) ? Fg : i0;
        return c(t, i);
      }
      function dm(t) {
        var i = tt(t) ? Mg : o0;
        return i(t);
      }
      function pm(t) {
        if (t == null)
          return 0;
        if (de(t))
          return Es(t) ? Ar(t) : t.length;
        var i = re(t);
        return i == ye || i == G ? t.size : Jo(t).length;
      }
      function gm(t, i, o) {
        var c = tt(t) ? To : u0;
        return o && fe(t, i, o) && (i = n), c(t, K(i, 3));
      }
      var vm = st(function(t, i) {
        if (t == null)
          return [];
        var o = i.length;
        return o > 1 && fe(t, i[0], i[1]) ? i = [] : o > 2 && fe(i[0], i[1], i[2]) && (i = [i[0]]), xc(t, Vt(i, 1), []);
      }), ws = Yp || function() {
        return Yt.Date.now();
      };
      function mm(t, i) {
        if (typeof i != "function")
          throw new Pe(f);
        return t = nt(t), function() {
          if (--t < 1)
            return i.apply(this, arguments);
        };
      }
      function bf(t, i, o) {
        return i = o ? n : i, i = t && i == null ? t.length : i, vn(t, _t, n, n, n, n, i);
      }
      function _f(t, i) {
        var o;
        if (typeof i != "function")
          throw new Pe(f);
        return t = nt(t), function() {
          return --t > 0 && (o = i.apply(this, arguments)), t <= 1 && (i = n), o;
        };
      }
      var yu = st(function(t, i, o) {
        var c = R;
        if (o.length) {
          var h = $n(o, $r(yu));
          c |= z;
        }
        return vn(t, c, i, o, h);
      }), Cf = st(function(t, i, o) {
        var c = R | x;
        if (o.length) {
          var h = $n(o, $r(Cf));
          c |= z;
        }
        return vn(i, c, t, o, h);
      });
      function Ef(t, i, o) {
        i = o ? n : i;
        var c = vn(t, U, n, n, n, n, n, i);
        return c.placeholder = Ef.placeholder, c;
      }
      function Af(t, i, o) {
        i = o ? n : i;
        var c = vn(t, M, n, n, n, n, n, i);
        return c.placeholder = Af.placeholder, c;
      }
      function xf(t, i, o) {
        var c, h, v, w, _, A, $ = 0, P = !1, F = !1, q = !0;
        if (typeof t != "function")
          throw new Pe(f);
        i = ke(i) || 0, It(o) && (P = !!o.leading, F = "maxWait" in o, v = F ? Wt(ke(o.maxWait) || 0, i) : v, q = "trailing" in o ? !!o.trailing : q);
        function j(Ft) {
          var ze = c, _n = h;
          return c = h = n, $ = Ft, w = t.apply(_n, ze), w;
        }
        function J(Ft) {
          return $ = Ft, _ = di(ot, i), P ? j(Ft) : w;
        }
        function rt(Ft) {
          var ze = Ft - A, _n = Ft - $, Gf = i - ze;
          return F ? ne(Gf, v - _n) : Gf;
        }
        function X(Ft) {
          var ze = Ft - A, _n = Ft - $;
          return A === n || ze >= i || ze < 0 || F && _n >= v;
        }
        function ot() {
          var Ft = ws();
          if (X(Ft))
            return lt(Ft);
          _ = di(ot, rt(Ft));
        }
        function lt(Ft) {
          return _ = n, q && c ? j(Ft) : (c = h = n, w);
        }
        function Se() {
          _ !== n && Fc(_), $ = 0, c = A = h = _ = n;
        }
        function le() {
          return _ === n ? w : lt(ws());
        }
        function Re() {
          var Ft = ws(), ze = X(Ft);
          if (c = arguments, h = this, A = Ft, ze) {
            if (_ === n)
              return J(A);
            if (F)
              return Fc(_), _ = di(ot, i), j(A);
          }
          return _ === n && (_ = di(ot, i)), w;
        }
        return Re.cancel = Se, Re.flush = le, Re;
      }
      var ym = st(function(t, i) {
        return dc(t, 1, i);
      }), wm = st(function(t, i, o) {
        return dc(t, ke(i) || 0, o);
      });
      function bm(t) {
        return vn(t, Te);
      }
      function bs(t, i) {
        if (typeof t != "function" || i != null && typeof i != "function")
          throw new Pe(f);
        var o = function() {
          var c = arguments, h = i ? i.apply(this, c) : c[0], v = o.cache;
          if (v.has(h))
            return v.get(h);
          var w = t.apply(this, c);
          return o.cache = v.set(h, w) || v, w;
        };
        return o.cache = new (bs.Cache || pn)(), o;
      }
      bs.Cache = pn;
      function _s(t) {
        if (typeof t != "function")
          throw new Pe(f);
        return function() {
          var i = arguments;
          switch (i.length) {
            case 0:
              return !t.call(this);
            case 1:
              return !t.call(this, i[0]);
            case 2:
              return !t.call(this, i[0], i[1]);
            case 3:
              return !t.call(this, i[0], i[1], i[2]);
          }
          return !t.apply(this, i);
        };
      }
      function _m(t) {
        return _f(2, t);
      }
      var Cm = a0(function(t, i) {
        i = i.length == 1 && tt(i[0]) ? St(i[0], Ee(K())) : St(Vt(i, 1), Ee(K()));
        var o = i.length;
        return st(function(c) {
          for (var h = -1, v = ne(c.length, o); ++h < v; )
            c[h] = i[h].call(this, c[h]);
          return Ce(t, this, c);
        });
      }), wu = st(function(t, i) {
        var o = $n(i, $r(wu));
        return vn(t, z, n, i, o);
      }), Sf = st(function(t, i) {
        var o = $n(i, $r(Sf));
        return vn(t, ht, n, i, o);
      }), Em = mn(function(t, i) {
        return vn(t, xt, n, n, n, i);
      });
      function Am(t, i) {
        if (typeof t != "function")
          throw new Pe(f);
        return i = i === n ? i : nt(i), st(t, i);
      }
      function xm(t, i) {
        if (typeof t != "function")
          throw new Pe(f);
        return i = i == null ? 0 : Wt(nt(i), 0), st(function(o) {
          var c = o[i], h = Un(o, 0, i);
          return c && Ln(h, c), Ce(t, this, h);
        });
      }
      function Sm(t, i, o) {
        var c = !0, h = !0;
        if (typeof t != "function")
          throw new Pe(f);
        return It(o) && (c = "leading" in o ? !!o.leading : c, h = "trailing" in o ? !!o.trailing : h), xf(t, i, {
          leading: c,
          maxWait: i,
          trailing: h
        });
      }
      function Rm(t) {
        return bf(t, 1);
      }
      function Im(t, i) {
        return wu(ru(i), t);
      }
      function Om() {
        if (!arguments.length)
          return [];
        var t = arguments[0];
        return tt(t) ? t : [t];
      }
      function Tm(t) {
        return Me(t, C);
      }
      function Lm(t, i) {
        return i = typeof i == "function" ? i : n, Me(t, C, i);
      }
      function $m(t) {
        return Me(t, m | C);
      }
      function Pm(t, i) {
        return i = typeof i == "function" ? i : n, Me(t, m | C, i);
      }
      function Fm(t, i) {
        return i == null || hc(t, i, Gt(i));
      }
      function je(t, i) {
        return t === i || t !== t && i !== i;
      }
      var Mm = ds(jo), Dm = ds(function(t, i) {
        return t >= i;
      }), or = yc(function() {
        return arguments;
      }()) ? yc : function(t) {
        return Tt(t) && vt.call(t, "callee") && !ic.call(t, "callee");
      }, tt = S.isArray, Um = Na ? Ee(Na) : jg;
      function de(t) {
        return t != null && Cs(t.length) && !wn(t);
      }
      function Pt(t) {
        return Tt(t) && de(t);
      }
      function km(t) {
        return t === !0 || t === !1 || Tt(t) && ce(t) == cn;
      }
      var kn = Zp || Tu, Nm = qa ? Ee(qa) : zg;
      function qm(t) {
        return Tt(t) && t.nodeType === 1 && !pi(t);
      }
      function Wm(t) {
        if (t == null)
          return !0;
        if (de(t) && (tt(t) || typeof t == "string" || typeof t.splice == "function" || kn(t) || Pr(t) || or(t)))
          return !t.length;
        var i = re(t);
        if (i == ye || i == G)
          return !t.size;
        if (hi(t))
          return !Jo(t).length;
        for (var o in t)
          if (vt.call(t, o))
            return !1;
        return !0;
      }
      function Bm(t, i) {
        return ci(t, i);
      }
      function Hm(t, i, o) {
        o = typeof o == "function" ? o : n;
        var c = o ? o(t, i) : n;
        return c === n ? ci(t, i, n, o) : !!c;
      }
      function bu(t) {
        if (!Tt(t))
          return !1;
        var i = ce(t);
        return i == ee || i == xn || typeof t.message == "string" && typeof t.name == "string" && !pi(t);
      }
      function Gm(t) {
        return typeof t == "number" && oc(t);
      }
      function wn(t) {
        if (!It(t))
          return !1;
        var i = ce(t);
        return i == br || i == Pi || i == bo || i == N;
      }
      function Rf(t) {
        return typeof t == "number" && t == nt(t);
      }
      function Cs(t) {
        return typeof t == "number" && t > -1 && t % 1 == 0 && t <= se;
      }
      function It(t) {
        var i = typeof t;
        return t != null && (i == "object" || i == "function");
      }
      function Tt(t) {
        return t != null && typeof t == "object";
      }
      var If = Wa ? Ee(Wa) : Jg;
      function jm(t, i) {
        return t === i || Ko(t, i, fu(i));
      }
      function zm(t, i, o) {
        return o = typeof o == "function" ? o : n, Ko(t, i, fu(i), o);
      }
      function Km(t) {
        return Of(t) && t != +t;
      }
      function Jm(t) {
        if (L0(t))
          throw new Z(a);
        return wc(t);
      }
      function Xm(t) {
        return t === null;
      }
      function Ym(t) {
        return t == null;
      }
      function Of(t) {
        return typeof t == "number" || Tt(t) && ce(t) == Sn;
      }
      function pi(t) {
        if (!Tt(t) || ce(t) != k)
          return !1;
        var i = Xi(t);
        if (i === null)
          return !0;
        var o = vt.call(i, "constructor") && i.constructor;
        return typeof o == "function" && o instanceof o && ji.call(o) == zp;
      }
      var _u = Ba ? Ee(Ba) : Xg;
      function Vm(t) {
        return Rf(t) && t >= -se && t <= se;
      }
      var Tf = Ha ? Ee(Ha) : Yg;
      function Es(t) {
        return typeof t == "string" || !tt(t) && Tt(t) && ce(t) == Q;
      }
      function xe(t) {
        return typeof t == "symbol" || Tt(t) && ce(t) == mt;
      }
      var Pr = Ga ? Ee(Ga) : Vg;
      function Zm(t) {
        return t === n;
      }
      function Qm(t) {
        return Tt(t) && re(t) == ft;
      }
      function ty(t) {
        return Tt(t) && ce(t) == yt;
      }
      var ey = ds(Xo), ny = ds(function(t, i) {
        return t <= i;
      });
      function Lf(t) {
        if (!t)
          return [];
        if (de(t))
          return Es(t) ? He(t) : he(t);
        if (ei && t[ei])
          return Fp(t[ei]());
        var i = re(t), o = i == ye ? Do : i == G ? Bi : Fr;
        return o(t);
      }
      function bn(t) {
        if (!t)
          return t === 0 ? t : 0;
        if (t = ke(t), t === te || t === -te) {
          var i = t < 0 ? -1 : 1;
          return i * Yn;
        }
        return t === t ? t : 0;
      }
      function nt(t) {
        var i = bn(t), o = i % 1;
        return i === i ? o ? i - o : i : 0;
      }
      function $f(t) {
        return t ? nr(nt(t), 0, kt) : 0;
      }
      function ke(t) {
        if (typeof t == "number")
          return t;
        if (xe(t))
          return En;
        if (It(t)) {
          var i = typeof t.valueOf == "function" ? t.valueOf() : t;
          t = It(i) ? i + "" : i;
        }
        if (typeof t != "string")
          return t === 0 ? t : +t;
        t = Ya(t);
        var o = Ud.test(t);
        return o || Nd.test(t) ? mp(t.slice(2), o ? 2 : 8) : Dd.test(t) ? En : +t;
      }
      function Pf(t) {
        return nn(t, pe(t));
      }
      function ry(t) {
        return t ? nr(nt(t), -se, se) : t === 0 ? t : 0;
      }
      function gt(t) {
        return t == null ? "" : Ae(t);
      }
      var iy = Tr(function(t, i) {
        if (hi(i) || de(i)) {
          nn(i, Gt(i), t);
          return;
        }
        for (var o in i)
          vt.call(i, o) && oi(t, o, i[o]);
      }), Ff = Tr(function(t, i) {
        nn(i, pe(i), t);
      }), As = Tr(function(t, i, o, c) {
        nn(i, pe(i), t, c);
      }), sy = Tr(function(t, i, o, c) {
        nn(i, Gt(i), t, c);
      }), oy = mn(Bo);
      function uy(t, i) {
        var o = Or(t);
        return i == null ? o : lc(o, i);
      }
      var ay = st(function(t, i) {
        t = wt(t);
        var o = -1, c = i.length, h = c > 2 ? i[2] : n;
        for (h && fe(i[0], i[1], h) && (c = 1); ++o < c; )
          for (var v = i[o], w = pe(v), _ = -1, A = w.length; ++_ < A; ) {
            var $ = w[_], P = t[$];
            (P === n || je(P, Sr[$]) && !vt.call(t, $)) && (t[$] = v[$]);
          }
        return t;
      }), cy = st(function(t) {
        return t.push(n, Yc), Ce(Mf, n, t);
      });
      function fy(t, i) {
        return za(t, K(i, 3), en);
      }
      function ly(t, i) {
        return za(t, K(i, 3), Go);
      }
      function hy(t, i) {
        return t == null ? t : Ho(t, K(i, 3), pe);
      }
      function dy(t, i) {
        return t == null ? t : vc(t, K(i, 3), pe);
      }
      function py(t, i) {
        return t && en(t, K(i, 3));
      }
      function gy(t, i) {
        return t && Go(t, K(i, 3));
      }
      function vy(t) {
        return t == null ? [] : ss(t, Gt(t));
      }
      function my(t) {
        return t == null ? [] : ss(t, pe(t));
      }
      function Cu(t, i, o) {
        var c = t == null ? n : rr(t, i);
        return c === n ? o : c;
      }
      function yy(t, i) {
        return t != null && Qc(t, i, Wg);
      }
      function Eu(t, i) {
        return t != null && Qc(t, i, Bg);
      }
      var wy = jc(function(t, i, o) {
        i != null && typeof i.toString != "function" && (i = zi.call(i)), t[i] = o;
      }, xu(ge)), by = jc(function(t, i, o) {
        i != null && typeof i.toString != "function" && (i = zi.call(i)), vt.call(t, i) ? t[i].push(o) : t[i] = [o];
      }, K), _y = st(ai);
      function Gt(t) {
        return de(t) ? cc(t) : Jo(t);
      }
      function pe(t) {
        return de(t) ? cc(t, !0) : Zg(t);
      }
      function Cy(t, i) {
        var o = {};
        return i = K(i, 3), en(t, function(c, h, v) {
          gn(o, i(c, h, v), c);
        }), o;
      }
      function Ey(t, i) {
        var o = {};
        return i = K(i, 3), en(t, function(c, h, v) {
          gn(o, h, i(c, h, v));
        }), o;
      }
      var Ay = Tr(function(t, i, o) {
        os(t, i, o);
      }), Mf = Tr(function(t, i, o, c) {
        os(t, i, o, c);
      }), xy = mn(function(t, i) {
        var o = {};
        if (t == null)
          return o;
        var c = !1;
        i = St(i, function(v) {
          return v = Dn(v, t), c || (c = v.length > 1), v;
        }), nn(t, au(t), o), c && (o = Me(o, m | b | C, w0));
        for (var h = i.length; h--; )
          tu(o, i[h]);
        return o;
      });
      function Sy(t, i) {
        return Df(t, _s(K(i)));
      }
      var Ry = mn(function(t, i) {
        return t == null ? {} : t0(t, i);
      });
      function Df(t, i) {
        if (t == null)
          return {};
        var o = St(au(t), function(c) {
          return [c];
        });
        return i = K(i), Sc(t, o, function(c, h) {
          return i(c, h[0]);
        });
      }
      function Iy(t, i, o) {
        i = Dn(i, t);
        var c = -1, h = i.length;
        for (h || (h = 1, t = n); ++c < h; ) {
          var v = t == null ? n : t[rn(i[c])];
          v === n && (c = h, v = o), t = wn(v) ? v.call(t) : v;
        }
        return t;
      }
      function Oy(t, i, o) {
        return t == null ? t : fi(t, i, o);
      }
      function Ty(t, i, o, c) {
        return c = typeof c == "function" ? c : n, t == null ? t : fi(t, i, o, c);
      }
      var Uf = Jc(Gt), kf = Jc(pe);
      function Ly(t, i, o) {
        var c = tt(t), h = c || kn(t) || Pr(t);
        if (i = K(i, 4), o == null) {
          var v = t && t.constructor;
          h ? o = c ? new v() : [] : It(t) ? o = wn(v) ? Or(Xi(t)) : {} : o = {};
        }
        return (h ? $e : en)(t, function(w, _, A) {
          return i(o, w, _, A);
        }), o;
      }
      function $y(t, i) {
        return t == null ? !0 : tu(t, i);
      }
      function Py(t, i, o) {
        return t == null ? t : Lc(t, i, ru(o));
      }
      function Fy(t, i, o, c) {
        return c = typeof c == "function" ? c : n, t == null ? t : Lc(t, i, ru(o), c);
      }
      function Fr(t) {
        return t == null ? [] : Mo(t, Gt(t));
      }
      function My(t) {
        return t == null ? [] : Mo(t, pe(t));
      }
      function Dy(t, i, o) {
        return o === n && (o = i, i = n), o !== n && (o = ke(o), o = o === o ? o : 0), i !== n && (i = ke(i), i = i === i ? i : 0), nr(ke(t), i, o);
      }
      function Uy(t, i, o) {
        return i = bn(i), o === n ? (o = i, i = 0) : o = bn(o), t = ke(t), Hg(t, i, o);
      }
      function ky(t, i, o) {
        if (o && typeof o != "boolean" && fe(t, i, o) && (i = o = n), o === n && (typeof i == "boolean" ? (o = i, i = n) : typeof t == "boolean" && (o = t, t = n)), t === n && i === n ? (t = 0, i = 1) : (t = bn(t), i === n ? (i = t, t = 0) : i = bn(i)), t > i) {
          var c = t;
          t = i, i = c;
        }
        if (o || t % 1 || i % 1) {
          var h = uc();
          return ne(t + h * (i - t + vp("1e-" + ((h + "").length - 1))), i);
        }
        return Vo(t, i);
      }
      var Ny = Lr(function(t, i, o) {
        return i = i.toLowerCase(), t + (o ? Nf(i) : i);
      });
      function Nf(t) {
        return Au(gt(t).toLowerCase());
      }
      function qf(t) {
        return t = gt(t), t && t.replace(Wd, Op).replace(op, "");
      }
      function qy(t, i, o) {
        t = gt(t), i = Ae(i);
        var c = t.length;
        o = o === n ? c : nr(nt(o), 0, c);
        var h = o;
        return o -= i.length, o >= 0 && t.slice(o, h) == i;
      }
      function Wy(t) {
        return t = gt(t), t && Qr.test(t) ? t.replace(Mi, Tp) : t;
      }
      function By(t) {
        return t = gt(t), t && Be.test(t) ? t.replace($t, "\\$&") : t;
      }
      var Hy = Lr(function(t, i, o) {
        return t + (o ? "-" : "") + i.toLowerCase();
      }), Gy = Lr(function(t, i, o) {
        return t + (o ? " " : "") + i.toLowerCase();
      }), jy = Bc("toLowerCase");
      function zy(t, i, o) {
        t = gt(t), i = nt(i);
        var c = i ? Ar(t) : 0;
        if (!i || c >= i)
          return t;
        var h = (i - c) / 2;
        return hs(Qi(h), o) + t + hs(Zi(h), o);
      }
      function Ky(t, i, o) {
        t = gt(t), i = nt(i);
        var c = i ? Ar(t) : 0;
        return i && c < i ? t + hs(i - c, o) : t;
      }
      function Jy(t, i, o) {
        t = gt(t), i = nt(i);
        var c = i ? Ar(t) : 0;
        return i && c < i ? hs(i - c, o) + t : t;
      }
      function Xy(t, i, o) {
        return o || i == null ? i = 0 : i && (i = +i), ng(gt(t).replace(_e, ""), i || 0);
      }
      function Yy(t, i, o) {
        return (o ? fe(t, i, o) : i === n) ? i = 1 : i = nt(i), Zo(gt(t), i);
      }
      function Vy() {
        var t = arguments, i = gt(t[0]);
        return t.length < 3 ? i : i.replace(t[1], t[2]);
      }
      var Zy = Lr(function(t, i, o) {
        return t + (o ? "_" : "") + i.toLowerCase();
      });
      function Qy(t, i, o) {
        return o && typeof o != "number" && fe(t, i, o) && (i = o = n), o = o === n ? kt : o >>> 0, o ? (t = gt(t), t && (typeof i == "string" || i != null && !_u(i)) && (i = Ae(i), !i && Er(t)) ? Un(He(t), 0, o) : t.split(i, o)) : [];
      }
      var t1 = Lr(function(t, i, o) {
        return t + (o ? " " : "") + Au(i);
      });
      function e1(t, i, o) {
        return t = gt(t), o = o == null ? 0 : nr(nt(o), 0, t.length), i = Ae(i), t.slice(o, o + i.length) == i;
      }
      function n1(t, i, o) {
        var c = g.templateSettings;
        o && fe(t, i, o) && (i = n), t = gt(t), i = As({}, i, c, Xc);
        var h = As({}, i.imports, c.imports, Xc), v = Gt(h), w = Mo(h, v), _, A, $ = 0, P = i.interpolate || Ui, F = "__p += '", q = Uo(
          (i.escape || Ui).source + "|" + P.source + "|" + (P === Ot ? Md : Ui).source + "|" + (i.evaluate || Ui).source + "|$",
          "g"
        ), j = "//# sourceURL=" + (vt.call(i, "sourceURL") ? (i.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++lp + "]") + `
`;
        t.replace(q, function(X, ot, lt, Se, le, Re) {
          return lt || (lt = Se), F += t.slice($, Re).replace(Bd, Lp), ot && (_ = !0, F += `' +
__e(` + ot + `) +
'`), le && (A = !0, F += `';
` + le + `;
__p += '`), lt && (F += `' +
((__t = (` + lt + `)) == null ? '' : __t) +
'`), $ = Re + X.length, X;
        }), F += `';
`;
        var J = vt.call(i, "variable") && i.variable;
        if (!J)
          F = `with (obj) {
` + F + `
}
`;
        else if (Pd.test(J))
          throw new Z(l);
        F = (A ? F.replace(Jt, "") : F).replace(Zr, "$1").replace(hn, "$1;"), F = "function(" + (J || "obj") + `) {
` + (J ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (_ ? ", __e = _.escape" : "") + (A ? `, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
` : `;
`) + F + `return __p
}`;
        var rt = Bf(function() {
          return dt(v, j + "return " + F).apply(n, w);
        });
        if (rt.source = F, bu(rt))
          throw rt;
        return rt;
      }
      function r1(t) {
        return gt(t).toLowerCase();
      }
      function i1(t) {
        return gt(t).toUpperCase();
      }
      function s1(t, i, o) {
        if (t = gt(t), t && (o || i === n))
          return Ya(t);
        if (!t || !(i = Ae(i)))
          return t;
        var c = He(t), h = He(i), v = Va(c, h), w = Za(c, h) + 1;
        return Un(c, v, w).join("");
      }
      function o1(t, i, o) {
        if (t = gt(t), t && (o || i === n))
          return t.slice(0, tc(t) + 1);
        if (!t || !(i = Ae(i)))
          return t;
        var c = He(t), h = Za(c, He(i)) + 1;
        return Un(c, 0, h).join("");
      }
      function u1(t, i, o) {
        if (t = gt(t), t && (o || i === n))
          return t.replace(_e, "");
        if (!t || !(i = Ae(i)))
          return t;
        var c = He(t), h = Va(c, He(i));
        return Un(c, h).join("");
      }
      function a1(t, i) {
        var o = qe, c = an;
        if (It(i)) {
          var h = "separator" in i ? i.separator : h;
          o = "length" in i ? nt(i.length) : o, c = "omission" in i ? Ae(i.omission) : c;
        }
        t = gt(t);
        var v = t.length;
        if (Er(t)) {
          var w = He(t);
          v = w.length;
        }
        if (o >= v)
          return t;
        var _ = o - Ar(c);
        if (_ < 1)
          return c;
        var A = w ? Un(w, 0, _).join("") : t.slice(0, _);
        if (h === n)
          return A + c;
        if (w && (_ += A.length - _), _u(h)) {
          if (t.slice(_).search(h)) {
            var $, P = A;
            for (h.global || (h = Uo(h.source, gt(ya.exec(h)) + "g")), h.lastIndex = 0; $ = h.exec(P); )
              var F = $.index;
            A = A.slice(0, F === n ? _ : F);
          }
        } else if (t.indexOf(Ae(h), _) != _) {
          var q = A.lastIndexOf(h);
          q > -1 && (A = A.slice(0, q));
        }
        return A + c;
      }
      function c1(t) {
        return t = gt(t), t && Di.test(t) ? t.replace(Fi, kp) : t;
      }
      var f1 = Lr(function(t, i, o) {
        return t + (o ? " " : "") + i.toUpperCase();
      }), Au = Bc("toUpperCase");
      function Wf(t, i, o) {
        return t = gt(t), i = o ? n : i, i === n ? Pp(t) ? Wp(t) : Ap(t) : t.match(i) || [];
      }
      var Bf = st(function(t, i) {
        try {
          return Ce(t, n, i);
        } catch (o) {
          return bu(o) ? o : new Z(o);
        }
      }), l1 = mn(function(t, i) {
        return $e(i, function(o) {
          o = rn(o), gn(t, o, yu(t[o], t));
        }), t;
      });
      function h1(t) {
        var i = t == null ? 0 : t.length, o = K();
        return t = i ? St(t, function(c) {
          if (typeof c[1] != "function")
            throw new Pe(f);
          return [o(c[0]), c[1]];
        }) : [], st(function(c) {
          for (var h = -1; ++h < i; ) {
            var v = t[h];
            if (Ce(v[0], this, c))
              return Ce(v[1], this, c);
          }
        });
      }
      function d1(t) {
        return kg(Me(t, m));
      }
      function xu(t) {
        return function() {
          return t;
        };
      }
      function p1(t, i) {
        return t == null || t !== t ? i : t;
      }
      var g1 = Gc(), v1 = Gc(!0);
      function ge(t) {
        return t;
      }
      function Su(t) {
        return bc(typeof t == "function" ? t : Me(t, m));
      }
      function m1(t) {
        return Cc(Me(t, m));
      }
      function y1(t, i) {
        return Ec(t, Me(i, m));
      }
      var w1 = st(function(t, i) {
        return function(o) {
          return ai(o, t, i);
        };
      }), b1 = st(function(t, i) {
        return function(o) {
          return ai(t, o, i);
        };
      });
      function Ru(t, i, o) {
        var c = Gt(i), h = ss(i, c);
        o == null && !(It(i) && (h.length || !c.length)) && (o = i, i = t, t = this, h = ss(i, Gt(i)));
        var v = !(It(o) && "chain" in o) || !!o.chain, w = wn(t);
        return $e(h, function(_) {
          var A = i[_];
          t[_] = A, w && (t.prototype[_] = function() {
            var $ = this.__chain__;
            if (v || $) {
              var P = t(this.__wrapped__), F = P.__actions__ = he(this.__actions__);
              return F.push({ func: A, args: arguments, thisArg: t }), P.__chain__ = $, P;
            }
            return A.apply(t, Ln([this.value()], arguments));
          });
        }), t;
      }
      function _1() {
        return Yt._ === this && (Yt._ = Kp), this;
      }
      function Iu() {
      }
      function C1(t) {
        return t = nt(t), st(function(i) {
          return Ac(i, t);
        });
      }
      var E1 = su(St), A1 = su(ja), x1 = su(To);
      function Hf(t) {
        return hu(t) ? Lo(rn(t)) : e0(t);
      }
      function S1(t) {
        return function(i) {
          return t == null ? n : rr(t, i);
        };
      }
      var R1 = zc(), I1 = zc(!0);
      function Ou() {
        return [];
      }
      function Tu() {
        return !1;
      }
      function O1() {
        return {};
      }
      function T1() {
        return "";
      }
      function L1() {
        return !0;
      }
      function $1(t, i) {
        if (t = nt(t), t < 1 || t > se)
          return [];
        var o = kt, c = ne(t, kt);
        i = K(i), t -= kt;
        for (var h = Fo(c, i); ++o < t; )
          i(o);
        return h;
      }
      function P1(t) {
        return tt(t) ? St(t, rn) : xe(t) ? [t] : he(cf(gt(t)));
      }
      function F1(t) {
        var i = ++jp;
        return gt(t) + i;
      }
      var M1 = ls(function(t, i) {
        return t + i;
      }, 0), D1 = ou("ceil"), U1 = ls(function(t, i) {
        return t / i;
      }, 1), k1 = ou("floor");
      function N1(t) {
        return t && t.length ? is(t, ge, jo) : n;
      }
      function q1(t, i) {
        return t && t.length ? is(t, K(i, 2), jo) : n;
      }
      function W1(t) {
        return Ja(t, ge);
      }
      function B1(t, i) {
        return Ja(t, K(i, 2));
      }
      function H1(t) {
        return t && t.length ? is(t, ge, Xo) : n;
      }
      function G1(t, i) {
        return t && t.length ? is(t, K(i, 2), Xo) : n;
      }
      var j1 = ls(function(t, i) {
        return t * i;
      }, 1), z1 = ou("round"), K1 = ls(function(t, i) {
        return t - i;
      }, 0);
      function J1(t) {
        return t && t.length ? Po(t, ge) : 0;
      }
      function X1(t, i) {
        return t && t.length ? Po(t, K(i, 2)) : 0;
      }
      return g.after = mm, g.ary = bf, g.assign = iy, g.assignIn = Ff, g.assignInWith = As, g.assignWith = sy, g.at = oy, g.before = _f, g.bind = yu, g.bindAll = l1, g.bindKey = Cf, g.castArray = Om, g.chain = mf, g.chunk = k0, g.compact = N0, g.concat = q0, g.cond = h1, g.conforms = d1, g.constant = xu, g.countBy = Jv, g.create = uy, g.curry = Ef, g.curryRight = Af, g.debounce = xf, g.defaults = ay, g.defaultsDeep = cy, g.defer = ym, g.delay = wm, g.difference = W0, g.differenceBy = B0, g.differenceWith = H0, g.drop = G0, g.dropRight = j0, g.dropRightWhile = z0, g.dropWhile = K0, g.fill = J0, g.filter = Yv, g.flatMap = Qv, g.flatMapDeep = tm, g.flatMapDepth = em, g.flatten = df, g.flattenDeep = X0, g.flattenDepth = Y0, g.flip = bm, g.flow = g1, g.flowRight = v1, g.fromPairs = V0, g.functions = vy, g.functionsIn = my, g.groupBy = nm, g.initial = Q0, g.intersection = tv, g.intersectionBy = ev, g.intersectionWith = nv, g.invert = wy, g.invertBy = by, g.invokeMap = im, g.iteratee = Su, g.keyBy = sm, g.keys = Gt, g.keysIn = pe, g.map = ys, g.mapKeys = Cy, g.mapValues = Ey, g.matches = m1, g.matchesProperty = y1, g.memoize = bs, g.merge = Ay, g.mergeWith = Mf, g.method = w1, g.methodOf = b1, g.mixin = Ru, g.negate = _s, g.nthArg = C1, g.omit = xy, g.omitBy = Sy, g.once = _m, g.orderBy = om, g.over = E1, g.overArgs = Cm, g.overEvery = A1, g.overSome = x1, g.partial = wu, g.partialRight = Sf, g.partition = um, g.pick = Ry, g.pickBy = Df, g.property = Hf, g.propertyOf = S1, g.pull = ov, g.pullAll = gf, g.pullAllBy = uv, g.pullAllWith = av, g.pullAt = cv, g.range = R1, g.rangeRight = I1, g.rearg = Em, g.reject = fm, g.remove = fv, g.rest = Am, g.reverse = vu, g.sampleSize = hm, g.set = Oy, g.setWith = Ty, g.shuffle = dm, g.slice = lv, g.sortBy = vm, g.sortedUniq = yv, g.sortedUniqBy = wv, g.split = Qy, g.spread = xm, g.tail = bv, g.take = _v, g.takeRight = Cv, g.takeRightWhile = Ev, g.takeWhile = Av, g.tap = Nv, g.throttle = Sm, g.thru = ms, g.toArray = Lf, g.toPairs = Uf, g.toPairsIn = kf, g.toPath = P1, g.toPlainObject = Pf, g.transform = Ly, g.unary = Rm, g.union = xv, g.unionBy = Sv, g.unionWith = Rv, g.uniq = Iv, g.uniqBy = Ov, g.uniqWith = Tv, g.unset = $y, g.unzip = mu, g.unzipWith = vf, g.update = Py, g.updateWith = Fy, g.values = Fr, g.valuesIn = My, g.without = Lv, g.words = Wf, g.wrap = Im, g.xor = $v, g.xorBy = Pv, g.xorWith = Fv, g.zip = Mv, g.zipObject = Dv, g.zipObjectDeep = Uv, g.zipWith = kv, g.entries = Uf, g.entriesIn = kf, g.extend = Ff, g.extendWith = As, Ru(g, g), g.add = M1, g.attempt = Bf, g.camelCase = Ny, g.capitalize = Nf, g.ceil = D1, g.clamp = Dy, g.clone = Tm, g.cloneDeep = $m, g.cloneDeepWith = Pm, g.cloneWith = Lm, g.conformsTo = Fm, g.deburr = qf, g.defaultTo = p1, g.divide = U1, g.endsWith = qy, g.eq = je, g.escape = Wy, g.escapeRegExp = By, g.every = Xv, g.find = Vv, g.findIndex = lf, g.findKey = fy, g.findLast = Zv, g.findLastIndex = hf, g.findLastKey = ly, g.floor = k1, g.forEach = yf, g.forEachRight = wf, g.forIn = hy, g.forInRight = dy, g.forOwn = py, g.forOwnRight = gy, g.get = Cu, g.gt = Mm, g.gte = Dm, g.has = yy, g.hasIn = Eu, g.head = pf, g.identity = ge, g.includes = rm, g.indexOf = Z0, g.inRange = Uy, g.invoke = _y, g.isArguments = or, g.isArray = tt, g.isArrayBuffer = Um, g.isArrayLike = de, g.isArrayLikeObject = Pt, g.isBoolean = km, g.isBuffer = kn, g.isDate = Nm, g.isElement = qm, g.isEmpty = Wm, g.isEqual = Bm, g.isEqualWith = Hm, g.isError = bu, g.isFinite = Gm, g.isFunction = wn, g.isInteger = Rf, g.isLength = Cs, g.isMap = If, g.isMatch = jm, g.isMatchWith = zm, g.isNaN = Km, g.isNative = Jm, g.isNil = Ym, g.isNull = Xm, g.isNumber = Of, g.isObject = It, g.isObjectLike = Tt, g.isPlainObject = pi, g.isRegExp = _u, g.isSafeInteger = Vm, g.isSet = Tf, g.isString = Es, g.isSymbol = xe, g.isTypedArray = Pr, g.isUndefined = Zm, g.isWeakMap = Qm, g.isWeakSet = ty, g.join = rv, g.kebabCase = Hy, g.last = Ue, g.lastIndexOf = iv, g.lowerCase = Gy, g.lowerFirst = jy, g.lt = ey, g.lte = ny, g.max = N1, g.maxBy = q1, g.mean = W1, g.meanBy = B1, g.min = H1, g.minBy = G1, g.stubArray = Ou, g.stubFalse = Tu, g.stubObject = O1, g.stubString = T1, g.stubTrue = L1, g.multiply = j1, g.nth = sv, g.noConflict = _1, g.noop = Iu, g.now = ws, g.pad = zy, g.padEnd = Ky, g.padStart = Jy, g.parseInt = Xy, g.random = ky, g.reduce = am, g.reduceRight = cm, g.repeat = Yy, g.replace = Vy, g.result = Iy, g.round = z1, g.runInContext = E, g.sample = lm, g.size = pm, g.snakeCase = Zy, g.some = gm, g.sortedIndex = hv, g.sortedIndexBy = dv, g.sortedIndexOf = pv, g.sortedLastIndex = gv, g.sortedLastIndexBy = vv, g.sortedLastIndexOf = mv, g.startCase = t1, g.startsWith = e1, g.subtract = K1, g.sum = J1, g.sumBy = X1, g.template = n1, g.times = $1, g.toFinite = bn, g.toInteger = nt, g.toLength = $f, g.toLower = r1, g.toNumber = ke, g.toSafeInteger = ry, g.toString = gt, g.toUpper = i1, g.trim = s1, g.trimEnd = o1, g.trimStart = u1, g.truncate = a1, g.unescape = c1, g.uniqueId = F1, g.upperCase = f1, g.upperFirst = Au, g.each = yf, g.eachRight = wf, g.first = pf, Ru(g, function() {
        var t = {};
        return en(g, function(i, o) {
          vt.call(g.prototype, o) || (t[o] = i);
        }), t;
      }(), { chain: !1 }), g.VERSION = s, $e(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(t) {
        g[t].placeholder = g;
      }), $e(["drop", "take"], function(t, i) {
        at.prototype[t] = function(o) {
          o = o === n ? 1 : Wt(nt(o), 0);
          var c = this.__filtered__ && !i ? new at(this) : this.clone();
          return c.__filtered__ ? c.__takeCount__ = ne(o, c.__takeCount__) : c.__views__.push({
            size: ne(o, kt),
            type: t + (c.__dir__ < 0 ? "Right" : "")
          }), c;
        }, at.prototype[t + "Right"] = function(o) {
          return this.reverse()[t](o).reverse();
        };
      }), $e(["filter", "map", "takeWhile"], function(t, i) {
        var o = i + 1, c = o == Qt || o == Yr;
        at.prototype[t] = function(h) {
          var v = this.clone();
          return v.__iteratees__.push({
            iteratee: K(h, 3),
            type: o
          }), v.__filtered__ = v.__filtered__ || c, v;
        };
      }), $e(["head", "last"], function(t, i) {
        var o = "take" + (i ? "Right" : "");
        at.prototype[t] = function() {
          return this[o](1).value()[0];
        };
      }), $e(["initial", "tail"], function(t, i) {
        var o = "drop" + (i ? "" : "Right");
        at.prototype[t] = function() {
          return this.__filtered__ ? new at(this) : this[o](1);
        };
      }), at.prototype.compact = function() {
        return this.filter(ge);
      }, at.prototype.find = function(t) {
        return this.filter(t).head();
      }, at.prototype.findLast = function(t) {
        return this.reverse().find(t);
      }, at.prototype.invokeMap = st(function(t, i) {
        return typeof t == "function" ? new at(this) : this.map(function(o) {
          return ai(o, t, i);
        });
      }), at.prototype.reject = function(t) {
        return this.filter(_s(K(t)));
      }, at.prototype.slice = function(t, i) {
        t = nt(t);
        var o = this;
        return o.__filtered__ && (t > 0 || i < 0) ? new at(o) : (t < 0 ? o = o.takeRight(-t) : t && (o = o.drop(t)), i !== n && (i = nt(i), o = i < 0 ? o.dropRight(-i) : o.take(i - t)), o);
      }, at.prototype.takeRightWhile = function(t) {
        return this.reverse().takeWhile(t).reverse();
      }, at.prototype.toArray = function() {
        return this.take(kt);
      }, en(at.prototype, function(t, i) {
        var o = /^(?:filter|find|map|reject)|While$/.test(i), c = /^(?:head|last)$/.test(i), h = g[c ? "take" + (i == "last" ? "Right" : "") : i], v = c || /^find/.test(i);
        h && (g.prototype[i] = function() {
          var w = this.__wrapped__, _ = c ? [1] : arguments, A = w instanceof at, $ = _[0], P = A || tt(w), F = function(ot) {
            var lt = h.apply(g, Ln([ot], _));
            return c && q ? lt[0] : lt;
          };
          P && o && typeof $ == "function" && $.length != 1 && (A = P = !1);
          var q = this.__chain__, j = !!this.__actions__.length, J = v && !q, rt = A && !j;
          if (!v && P) {
            w = rt ? w : new at(this);
            var X = t.apply(w, _);
            return X.__actions__.push({ func: ms, args: [F], thisArg: n }), new Fe(X, q);
          }
          return J && rt ? t.apply(this, _) : (X = this.thru(F), J ? c ? X.value()[0] : X.value() : X);
        });
      }), $e(["pop", "push", "shift", "sort", "splice", "unshift"], function(t) {
        var i = Hi[t], o = /^(?:push|sort|unshift)$/.test(t) ? "tap" : "thru", c = /^(?:pop|shift)$/.test(t);
        g.prototype[t] = function() {
          var h = arguments;
          if (c && !this.__chain__) {
            var v = this.value();
            return i.apply(tt(v) ? v : [], h);
          }
          return this[o](function(w) {
            return i.apply(tt(w) ? w : [], h);
          });
        };
      }), en(at.prototype, function(t, i) {
        var o = g[i];
        if (o) {
          var c = o.name + "";
          vt.call(Ir, c) || (Ir[c] = []), Ir[c].push({ name: i, func: o });
        }
      }), Ir[fs(n, x).name] = [{
        name: "wrapper",
        func: n
      }], at.prototype.clone = cg, at.prototype.reverse = fg, at.prototype.value = lg, g.prototype.at = qv, g.prototype.chain = Wv, g.prototype.commit = Bv, g.prototype.next = Hv, g.prototype.plant = jv, g.prototype.reverse = zv, g.prototype.toJSON = g.prototype.valueOf = g.prototype.value = Kv, g.prototype.first = g.prototype.head, ei && (g.prototype[ei] = Gv), g;
    }, xr = Bp();
    Zn ? ((Zn.exports = xr)._ = xr, So._ = xr) : Yt._ = xr;
  }).call(Nr);
})(fo, fo.exports);
var Xn = fo.exports, ea = { exports: {} }, Uu, ll;
function Z_() {
  if (ll)
    return Uu;
  ll = 1;
  var r = 1e3, e = r * 60, n = e * 60, s = n * 24, u = s * 7, a = s * 365.25;
  Uu = function(p, m) {
    m = m || {};
    var b = typeof p;
    if (b === "string" && p.length > 0)
      return f(p);
    if (b === "number" && isFinite(p))
      return m.long ? d(p) : l(p);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(p)
    );
  };
  function f(p) {
    if (p = String(p), !(p.length > 100)) {
      var m = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        p
      );
      if (m) {
        var b = parseFloat(m[1]), C = (m[2] || "ms").toLowerCase();
        switch (C) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return b * a;
          case "weeks":
          case "week":
          case "w":
            return b * u;
          case "days":
          case "day":
          case "d":
            return b * s;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return b * n;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return b * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return b * r;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return b;
          default:
            return;
        }
      }
    }
  }
  function l(p) {
    var m = Math.abs(p);
    return m >= s ? Math.round(p / s) + "d" : m >= n ? Math.round(p / n) + "h" : m >= e ? Math.round(p / e) + "m" : m >= r ? Math.round(p / r) + "s" : p + "ms";
  }
  function d(p) {
    var m = Math.abs(p);
    return m >= s ? y(p, m, s, "day") : m >= n ? y(p, m, n, "hour") : m >= e ? y(p, m, e, "minute") : m >= r ? y(p, m, r, "second") : p + " ms";
  }
  function y(p, m, b, C) {
    var I = m >= b * 1.5;
    return Math.round(p / b) + " " + C + (I ? "s" : "");
  }
  return Uu;
}
function Q_(r) {
  n.debug = n, n.default = n, n.coerce = d, n.disable = a, n.enable = u, n.enabled = f, n.humanize = Z_(), n.destroy = y, Object.keys(r).forEach((p) => {
    n[p] = r[p];
  }), n.names = [], n.skips = [], n.formatters = {};
  function e(p) {
    let m = 0;
    for (let b = 0; b < p.length; b++)
      m = (m << 5) - m + p.charCodeAt(b), m |= 0;
    return n.colors[Math.abs(m) % n.colors.length];
  }
  n.selectColor = e;
  function n(p) {
    let m, b = null, C, I;
    function O(...R) {
      if (!O.enabled)
        return;
      const x = O, D = Number(/* @__PURE__ */ new Date()), U = D - (m || D);
      x.diff = U, x.prev = m, x.curr = D, m = D, R[0] = n.coerce(R[0]), typeof R[0] != "string" && R.unshift("%O");
      let M = 0;
      R[0] = R[0].replace(/%([a-zA-Z%])/g, (ht, _t) => {
        if (ht === "%%")
          return "%";
        M++;
        const xt = n.formatters[_t];
        if (typeof xt == "function") {
          const Te = R[M];
          ht = xt.call(x, Te), R.splice(M, 1), M--;
        }
        return ht;
      }), n.formatArgs.call(x, R), (x.log || n.log).apply(x, R);
    }
    return O.namespace = p, O.useColors = n.useColors(), O.color = n.selectColor(p), O.extend = s, O.destroy = n.destroy, Object.defineProperty(O, "enabled", {
      enumerable: !0,
      configurable: !1,
      get: () => b !== null ? b : (C !== n.namespaces && (C = n.namespaces, I = n.enabled(p)), I),
      set: (R) => {
        b = R;
      }
    }), typeof n.init == "function" && n.init(O), O;
  }
  function s(p, m) {
    const b = n(this.namespace + (typeof m > "u" ? ":" : m) + p);
    return b.log = this.log, b;
  }
  function u(p) {
    n.save(p), n.namespaces = p, n.names = [], n.skips = [];
    let m;
    const b = (typeof p == "string" ? p : "").split(/[\s,]+/), C = b.length;
    for (m = 0; m < C; m++)
      b[m] && (p = b[m].replace(/\*/g, ".*?"), p[0] === "-" ? n.skips.push(new RegExp("^" + p.slice(1) + "$")) : n.names.push(new RegExp("^" + p + "$")));
  }
  function a() {
    const p = [
      ...n.names.map(l),
      ...n.skips.map(l).map((m) => "-" + m)
    ].join(",");
    return n.enable(""), p;
  }
  function f(p) {
    if (p[p.length - 1] === "*")
      return !0;
    let m, b;
    for (m = 0, b = n.skips.length; m < b; m++)
      if (n.skips[m].test(p))
        return !1;
    for (m = 0, b = n.names.length; m < b; m++)
      if (n.names[m].test(p))
        return !0;
    return !1;
  }
  function l(p) {
    return p.toString().substring(2, p.toString().length - 2).replace(/\.\*\?$/, "*");
  }
  function d(p) {
    return p instanceof Error ? p.stack || p.message : p;
  }
  function y() {
    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  }
  return n.enable(n.load()), n;
}
var tC = Q_;
(function(r, e) {
  e.formatArgs = s, e.save = u, e.load = a, e.useColors = n, e.storage = f(), e.destroy = (() => {
    let d = !1;
    return () => {
      d || (d = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
    };
  })(), e.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function n() {
    return typeof window < "u", typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/) ? !1 : typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
    typeof window < "u" && console && (console.firebug || console.exception && console.table) || // Is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
    typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function s(d) {
    if (d[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + d[0] + (this.useColors ? "%c " : " ") + "+" + r.exports.humanize(this.diff), !this.useColors)
      return;
    const y = "color: " + this.color;
    d.splice(1, 0, y, "color: inherit");
    let p = 0, m = 0;
    d[0].replace(/%[a-zA-Z%]/g, (b) => {
      b !== "%%" && (p++, b === "%c" && (m = p));
    }), d.splice(m, 0, y);
  }
  e.log = console.debug || console.log || (() => {
  });
  function u(d) {
    try {
      d ? e.storage.setItem("debug", d) : e.storage.removeItem("debug");
    } catch {
    }
  }
  function a() {
    let d;
    try {
      d = e.storage.getItem("debug");
    } catch {
    }
    return !d && typeof process < "u" && "env" in process && (d = {}.DEBUG), d;
  }
  function f() {
    try {
      return localStorage;
    } catch {
    }
  }
  r.exports = tC(e);
  const { formatters: l } = r.exports;
  l.j = function(d) {
    try {
      return JSON.stringify(d);
    } catch (y) {
      return "[UnexpectedJSONParseError]: " + y.message;
    }
  };
})(ea, ea.exports);
var eC = ea.exports;
const nC = /* @__PURE__ */ ad(eC), ct = nC("mutator-document");
class sn {
  constructor(e, n) {
    W(this, "_value");
    W(this, "path");
    this._value = e, this.path = n || [];
  }
  containerType() {
    return Array.isArray(this._value) ? "array" : this._value !== null && typeof this._value == "object" ? "object" : "primitive";
  }
  // Common reader, supported by all containers
  get() {
    return this._value;
  }
  // Array reader
  length() {
    if (!Array.isArray(this._value))
      throw new Error("Won't return length of non-indexable _value");
    return this._value.length;
  }
  getIndex(e) {
    return Array.isArray(this._value) ? e >= this.length() ? null : new sn(this._value[e], this.path.concat(e)) : !1;
  }
  // Object reader
  hasAttribute(e) {
    return gi(this._value) ? this._value.hasOwnProperty(e) : !1;
  }
  attributeKeys() {
    return gi(this._value) ? Object.keys(this._value) : [];
  }
  getAttribute(e) {
    if (!gi(this._value))
      throw new Error("getAttribute only applies to plain objects");
    return this.hasAttribute(e) ? new sn(this._value[e], this.path.concat(e)) : null;
  }
  // Common writer, supported by all containers
  set(e) {
    return e === this._value ? this : new sn(e, this.path);
  }
  // array writer interface
  setIndex(e, n) {
    if (!Array.isArray(this._value))
      throw new Error("setIndex only applies to arrays");
    if (Object.is(n, this._value[e]))
      return this;
    const s = this._value.slice();
    return s[e] = n, new sn(s, this.path);
  }
  setIndexAccessor(e, n) {
    return this.setIndex(e, n.get());
  }
  unsetIndices(e) {
    if (!Array.isArray(this._value))
      throw new Error("unsetIndices only applies to arrays");
    const n = this._value.length, s = [];
    for (let u = 0; u < n; u++)
      e.indexOf(u) === -1 && s.push(this._value[u]);
    return new sn(s, this.path);
  }
  insertItemsAt(e, n) {
    if (!Array.isArray(this._value))
      throw new Error("insertItemsAt only applies to arrays");
    let s;
    return this._value.length === 0 && e === 0 ? s = n : s = this._value.slice(0, e).concat(n).concat(this._value.slice(e)), new sn(s, this.path);
  }
  // Object writer interface
  setAttribute(e, n) {
    if (!gi(this._value))
      throw new Error("Unable to set attribute of non-object container");
    if (Object.is(n, this._value[e]))
      return this;
    const s = Object.assign({}, this._value, { [e]: n });
    return new sn(s, this.path);
  }
  setAttributeAccessor(e, n) {
    return this.setAttribute(e, n.get());
  }
  unsetAttribute(e) {
    if (!gi(this._value))
      throw new Error("Unable to unset attribute of non-object container");
    const n = Object.assign({}, this._value);
    return delete n[e], new sn(n, this.path);
  }
}
function gi(r) {
  return r !== null && typeof r == "object";
}
function Js(r) {
  return r !== null && typeof r == "object";
}
const rC = /^[a-z_$]+/;
function iC(r) {
  let e = "";
  return r.forEach((n, s) => {
    e += sC(n, s === 0);
  }), e;
}
function sC(r, e) {
  if (typeof r == "number")
    return `[${r}]`;
  if (Js(r)) {
    const n = r;
    return Object.keys(r).map((s) => oC(n[s]) ? `[${s}=="${n[s]}"]` : "").join("");
  }
  return typeof r == "string" && rC.test(r) ? e ? r : `.${r}` : `['${r}']`;
}
function oC(r) {
  switch (typeof r) {
    case "number":
    case "string":
    case "boolean":
      return !0;
    default:
      return !1;
  }
}
function uC(r) {
  const [e, n] = cd(r);
  if (!e)
    throw new Error("Head cannot be null");
  return cC(e, n);
}
function cd(r) {
  if (r.type !== "path")
    return [r, null];
  const e = r.nodes;
  return e.length === 0 ? [null, null] : e.length === 1 ? [e[0], null] : [e[0], { type: "path", nodes: e.slice(1) }];
}
function aC(r, e) {
  if (!r && !e)
    return null;
  const n = r ? r.nodes : [], s = e ? e.nodes : [];
  return {
    type: "path",
    nodes: n.concat(s)
  };
}
function cC(r, e) {
  return r.type !== "union" ? [[r, e]] : r.nodes.map((n) => {
    if (n.type === "path") {
      const [s, u] = cd(n);
      return [s, aC(u, e)];
    }
    return [n, e];
  });
}
const fC = /[0-9]/, ku = /^[a-zA-Z0-9_]$/, lC = /^[a-zA-Z_]$/, fd = {
  // NOTE: These are compared against in order of definition,
  // thus '==' must come before '=', '>=' before '>', etc.
  operator: ["..", ".", ",", ":", "?"],
  comparator: [">=", "<=", "<", ">", "==", "!="],
  keyword: ["$", "@"],
  boolean: ["true", "false"],
  paren: ["[", "]"]
}, hC = Object.keys(fd);
class dC {
  constructor(e) {
    W(this, "source");
    W(this, "i");
    W(this, "length");
    W(this, "tokenizers");
    this.source = e, this.length = e.length, this.i = 0, this.tokenizers = [
      this.tokenizeSymbol,
      this.tokenizeIdentifier,
      this.tokenizeNumber,
      this.tokenizeQuoted
    ].map((n) => n.bind(this));
  }
  tokenize() {
    const e = [];
    for (; !this.EOF(); ) {
      this.chompWhitespace();
      let n = null;
      if (!this.tokenizers.some((u) => (n = u(), !!n)) || !n)
        throw new Error(`Invalid tokens in jsonpath '${this.source}' @ ${this.i}`);
      e.push(n);
    }
    return e;
  }
  takeWhile(e) {
    const n = this.i;
    let s = "";
    for (; !this.EOF(); ) {
      const u = e(this.source[this.i]);
      if (u === null)
        break;
      s += u, this.i++;
    }
    return this.i === n ? null : s;
  }
  EOF() {
    return this.i >= this.length;
  }
  peek() {
    return this.EOF() ? null : this.source[this.i];
  }
  consume(e) {
    if (this.i + e.length > this.length)
      throw new Error(`Expected ${e} at end of jsonpath`);
    if (e === this.source.slice(this.i, this.i + e.length))
      this.i += e.length;
    else
      throw new Error(`Expected "${e}", but source contained "${this.source.slice()}`);
  }
  // Tries to match the upcoming bit of string with the provided string. If it matches, returns
  // the string, then advances the read pointer to the next bit. If not, returns null and nothing
  // happens.
  tryConsume(e) {
    if (this.i + e.length > this.length)
      return null;
    if (e === this.source.slice(this.i, this.i + e.length)) {
      if (e[0].match(ku) && this.length > this.i + e.length) {
        const n = this.source[this.i + e.length];
        if (n && n.match(ku))
          return null;
      }
      return this.i += e.length, e;
    }
    return null;
  }
  chompWhitespace() {
    this.takeWhile((e) => e === " " ? "" : null);
  }
  tokenizeQuoted() {
    const e = this.peek();
    if (e === "'" || e === '"') {
      this.consume(e);
      let n = !1;
      const s = this.takeWhile((u) => n ? (n = !1, u) : u === "\\" ? (n = !0, "") : u != e ? u : null);
      return this.consume(e), {
        type: "quoted",
        value: s,
        quote: e === '"' ? "double" : "single"
      };
    }
    return null;
  }
  tokenizeIdentifier() {
    let e = !0;
    const n = this.takeWhile((s) => e ? (e = !1, s.match(lC) ? s : null) : s.match(ku) ? s : null);
    return n !== null ? {
      type: "identifier",
      name: n
    } : null;
  }
  tokenizeNumber() {
    const e = this.i;
    let n = !1, s = !1, u = !1;
    this.peek() === "-" && (u = !0, this.consume("-"));
    const a = this.takeWhile((f) => f === "." && !n && s ? (n = !0, f) : (s = !0, f.match(fC) ? f : null));
    return a !== null ? {
      type: "number",
      value: u ? -a : +a,
      raw: u ? `-${a}` : a
    } : (this.i = e, null);
  }
  tokenizeSymbol() {
    for (const e of hC) {
      const s = fd[e].find((u) => this.tryConsume(u));
      if (s)
        return {
          type: e,
          symbol: s
        };
    }
    return null;
  }
}
function pC(r) {
  return new dC(r).tokenize();
}
class gC {
  constructor(e) {
    W(this, "tokens");
    W(this, "length");
    W(this, "i");
    this.tokens = pC(e), this.length = this.tokens.length, this.i = 0;
  }
  parse() {
    return this.parsePath();
  }
  EOF() {
    return this.i >= this.length;
  }
  // Look at upcoming token
  peek() {
    return this.EOF() ? null : this.tokens[this.i];
  }
  consume() {
    const e = this.peek();
    return this.i += 1, e;
  }
  // Return next token if it matches the pattern
  probe(e) {
    const n = this.peek();
    if (!n)
      return null;
    const s = n;
    return Object.keys(e).every((a) => a in n && e[a] === s[a]) ? n : null;
  }
  // Return and consume next token if it matches the pattern
  match(e) {
    return this.probe(e) ? this.consume() : null;
  }
  parseAttribute() {
    const e = this.match({ type: "identifier" });
    if (e && e.type === "identifier")
      return {
        type: "attribute",
        name: e.name
      };
    const n = this.match({ type: "quoted", quote: "single" });
    return n && n.type === "quoted" ? {
      type: "attribute",
      name: n.value || ""
    } : null;
  }
  parseAlias() {
    return this.match({ type: "keyword", symbol: "@" }) || this.match({ type: "keyword", symbol: "$" }) ? {
      type: "alias",
      target: "self"
    } : null;
  }
  parseNumber() {
    const e = this.match({ type: "number" });
    return e && e.type === "number" ? {
      type: "number",
      value: e.value
    } : null;
  }
  parseNumberValue() {
    const e = this.parseNumber();
    return e ? e.value : null;
  }
  parseSliceSelector() {
    const e = this.i, n = this.parseNumberValue();
    if (!this.match({ type: "operator", symbol: ":" }))
      return n === null ? (this.i = e, null) : { type: "index", value: n };
    const u = {
      type: "range",
      start: n,
      end: this.parseNumberValue()
    };
    return this.match({ type: "operator", symbol: ":" }) && (u.step = this.parseNumberValue()), u.start === null && u.end === null ? (this.i = e, null) : u;
  }
  parseValueReference() {
    return this.parseAttribute() || this.parseSliceSelector();
  }
  parseLiteralValue() {
    const e = this.match({ type: "quoted", quote: "double" });
    if (e && e.type === "quoted")
      return {
        type: "string",
        value: e.value || ""
      };
    const n = this.match({ type: "boolean" });
    return n && n.type === "boolean" ? {
      type: "boolean",
      value: n.symbol === "true"
    } : this.parseNumber();
  }
  // TODO: Reorder constraints so that literal value is always on rhs, and variable is always
  // on lhs.
  parseFilterExpression() {
    const e = this.i, n = this.parseAttribute() || this.parseAlias();
    if (!n)
      return null;
    if (this.match({ type: "operator", symbol: "?" }))
      return {
        type: "constraint",
        operator: "?",
        lhs: n
      };
    const s = this.match({ type: "comparator" });
    if (!s || s.type !== "comparator")
      return this.i = e, null;
    const u = n, a = this.parseLiteralValue();
    if (!a)
      throw new Error(`Operator ${s.symbol} needs a literal value at the right hand side`);
    return {
      type: "constraint",
      operator: s.symbol,
      lhs: u,
      rhs: a
    };
  }
  parseExpression() {
    return this.parseFilterExpression() || this.parseValueReference();
  }
  parseUnion() {
    if (!this.match({ type: "paren", symbol: "[" }))
      return null;
    const e = [];
    let n = this.parseFilterExpression() || this.parsePath() || this.parseValueReference();
    for (; n && (e.push(n), !this.match({ type: "paren", symbol: "]" })); ) {
      if (!this.match({ type: "operator", symbol: "," }))
        throw new Error("Expected ]");
      if (n = this.parseFilterExpression() || this.parsePath() || this.parseValueReference(), !n)
        throw new Error("Expected expression following ','");
    }
    return {
      type: "union",
      nodes: e
    };
  }
  parseRecursive() {
    if (!this.match({ type: "operator", symbol: ".." }))
      return null;
    const e = this.parsePath();
    if (!e)
      throw new Error("Expected path following '..' operator");
    return {
      type: "recursive",
      term: e
    };
  }
  parsePath() {
    const e = [], n = this.parseAttribute() || this.parseUnion() || this.parseRecursive();
    if (!n)
      return null;
    for (e.push(n); !this.EOF(); )
      if (this.match({ type: "operator", symbol: "." })) {
        const s = this.parseAttribute();
        if (!s)
          throw new Error("Expected attribute name following '.");
        e.push(s);
        continue;
      } else if (this.probe({ type: "paren", symbol: "[" })) {
        const s = this.parseUnion();
        if (!s)
          throw new Error("Expected union following '['");
        e.push(s);
      } else {
        const s = this.parseRecursive();
        s && e.push(s);
        break;
      }
    return e.length === 1 ? e[0] : {
      type: "path",
      nodes: e
    };
  }
}
function ld(r) {
  const e = new gC(r).parse();
  if (!e)
    throw new Error(`Failed to parse JSON path "${r}"`);
  return e;
}
function hd(r) {
  return qr(r, !1);
}
function qr(r, e) {
  switch (r.type) {
    case "attribute":
      return r.name;
    case "alias":
      return r.target === "self" ? "@" : "$";
    case "number":
      return `${r.value}`;
    case "range": {
      const n = [];
      return e || n.push("["), r.start && n.push(`${r.start}`), n.push(":"), r.end && n.push(`${r.end}`), r.step && n.push(`:${r.step}`), e || n.push("]"), n.join("");
    }
    case "index":
      return e ? `${r.value}` : `[${r.value}]`;
    case "constraint": {
      const n = r.rhs ? ` ${qr(r.rhs, !1)}` : "", s = `${qr(r.lhs, !1)} ${r.operator}${n}`;
      return e ? s : `[${s}]`;
    }
    case "string":
      return JSON.stringify(r.value);
    case "path": {
      const n = [], s = r.nodes.slice();
      for (; s.length > 0; ) {
        const u = s.shift();
        u && n.push(hd(u));
        const a = s[0];
        a && qr(a, !1)[0] !== "[" && n.push(".");
      }
      return n.join("");
    }
    case "union":
      return `[${r.nodes.map((n) => qr(n, !0)).join(",")}]`;
    default:
      throw new Error(`Unknown node type ${r.type}`);
    case "recursive":
      return `..${qr(r.term, !1)}`;
  }
}
class Oe {
  constructor(e) {
    W(this, "expr");
    if (!e)
      throw new Error("Attempted to create Expression from null-value");
    if ("expr" in e ? this.expr = e.expr : this.expr = e, !("type" in this.expr))
      throw new Error("Attempt to create Expression for expression with no type");
  }
  isPath() {
    return this.expr.type === "path";
  }
  isUnion() {
    return this.expr.type === "union";
  }
  isCollection() {
    return this.isPath() || this.isUnion();
  }
  isConstraint() {
    return this.expr.type === "constraint";
  }
  isRecursive() {
    return this.expr.type === "recursive";
  }
  isExistenceConstraint() {
    return this.expr.type === "constraint" && this.expr.operator === "?";
  }
  isIndex() {
    return this.expr.type === "index";
  }
  isRange() {
    return this.expr.type === "range";
  }
  expandRange(e) {
    const n = () => {
      if (!e)
        throw new Error("expandRange() required a probe that was not passed");
      return e.length();
    };
    let s = "start" in this.expr && this.expr.start || 0;
    s = Nu(s, e);
    let u = "end" in this.expr && this.expr.end || n();
    u = Nu(u, e);
    const a = "step" in this.expr && this.expr.step || 1;
    return { start: s, end: u, step: a };
  }
  isAttributeReference() {
    return this.expr.type === "attribute";
  }
  // Is a range or index -> something referencing indexes
  isIndexReference() {
    return this.isIndex() || this.isRange();
  }
  name() {
    return "name" in this.expr ? this.expr.name : "";
  }
  isSelfReference() {
    return this.expr.type === "alias" && this.expr.target === "self";
  }
  constraintTargetIsSelf() {
    return this.expr.type === "constraint" && this.expr.lhs.type === "alias" && this.expr.lhs.target === "self";
  }
  constraintTargetIsAttribute() {
    return this.expr.type === "constraint" && this.expr.lhs.type === "attribute";
  }
  testConstraint(e) {
    const n = this.expr;
    if (n.type === "constraint" && n.lhs.type === "alias" && n.lhs.target === "self") {
      if (e.containerType() !== "primitive")
        return !1;
      if (n.type === "constraint" && n.operator === "?")
        return !0;
      const f = e.get(), l = n.rhs && "value" in n.rhs ? n.rhs.value : void 0;
      return hl(f, n.operator, l);
    }
    if (n.type !== "constraint")
      return !1;
    const s = n.lhs;
    if (!s)
      throw new Error("No LHS of expression");
    if (s.type !== "attribute")
      throw new Error(`Constraint target ${s.type} not supported`);
    if (e.containerType() !== "object")
      return !1;
    const u = e.getAttribute(s.name);
    if (u == null || u.containerType() !== "primitive")
      return !1;
    if (this.isExistenceConstraint())
      return !0;
    const a = n.rhs && "value" in n.rhs ? n.rhs.value : void 0;
    return hl(u.get(), n.operator, a);
  }
  pathNodes() {
    return this.expr.type === "path" ? this.expr.nodes : [this.expr];
  }
  prepend(e) {
    return e ? new Oe({
      type: "path",
      nodes: e.pathNodes().concat(this.pathNodes())
    }) : this;
  }
  concat(e) {
    return e ? e.prepend(this) : this;
  }
  descend() {
    return uC(this.expr).map((e) => {
      const [n, s] = e;
      return {
        head: n ? new Oe(n) : null,
        tail: s ? new Oe(s) : null
      };
    });
  }
  unwrapRecursive() {
    if (this.expr.type !== "recursive")
      throw new Error(`Attempt to unwrap recursive on type ${this.expr.type}`);
    return new Oe(this.expr.term);
  }
  toIndicies(e) {
    if (this.expr.type !== "index" && this.expr.type !== "range")
      throw new Error("Node cannot be converted to indexes");
    if (this.expr.type === "index")
      return [Nu(this.expr.value, e)];
    const n = [], s = this.expandRange(e);
    let { start: u, end: a } = s;
    s.step < 0 && ([u, a] = [a, u]);
    for (let f = u; f < a; f++)
      n.push(f);
    return n;
  }
  toFieldReferences() {
    if (this.isIndexReference())
      return this.toIndicies();
    if (this.expr.type === "attribute")
      return [this.expr.name];
    throw new Error(`Can't convert ${this.expr.type} to field references`);
  }
  toString() {
    return hd(this.expr);
  }
  static fromPath(e) {
    const n = ld(e);
    if (!n)
      throw new Error(`Failed to parse path "${e}"`);
    return new Oe(n);
  }
  static attributeReference(e) {
    return new Oe({
      type: "attribute",
      name: e
    });
  }
  static indexReference(e) {
    return new Oe({
      type: "index",
      value: e
    });
  }
}
function hl(r, e, n) {
  switch (e) {
    case ">":
      return r > n;
    case ">=":
      return r >= n;
    case "<":
      return r < n;
    case "<=":
      return r <= n;
    case "==":
      return r === n;
    case "!=":
      return r !== n;
    default:
      throw new Error(`Unsupported binary operator ${e}`);
  }
}
function Nu(r, e) {
  if (r >= 0)
    return r;
  if (!e)
    throw new Error("interpretNegativeIndex() must have a probe when < 0");
  return r + e.length();
}
class Wr {
  constructor(e, n) {
    W(this, "head");
    W(this, "tail");
    this.head = e, this.tail = n;
  }
  // Iterate this descender once processing any constraints that are
  // resolvable on the current value. Returns an array of new descenders
  // that are guaranteed to be without constraints in the head
  iterate(e) {
    let n = [this];
    if (this.head && this.head.isConstraint()) {
      let s = !0;
      for (; s; )
        n = Xn.flatten(
          n.map((u) => u.iterateConstraints(e))
        ), s = n.some((u) => u.head && u.head.isConstraint());
    }
    return n;
  }
  isRecursive() {
    return !!(this.head && this.head.isRecursive());
  }
  hasArrived() {
    return this.head === null && this.tail === null;
  }
  extractRecursives() {
    if (this.head && this.head.isRecursive()) {
      const e = this.head.unwrapRecursive();
      return new Wr(null, e.concat(this.tail)).descend();
    }
    return [];
  }
  iterateConstraints(e) {
    const n = this.head;
    if (n === null || !n.isConstraint())
      return [this];
    const s = [];
    if (e.containerType() === "primitive" && n.constraintTargetIsSelf())
      return n.testConstraint(e) && s.push(...this.descend()), s;
    if (e.containerType() === "array") {
      const u = e.length();
      for (let a = 0; a < u; a++) {
        const f = e.getIndex(a);
        f && n.testConstraint(f) && s.push(new Wr(new Oe({ type: "index", value: a }), this.tail));
      }
      return s;
    }
    return e.containerType() === "object" ? n.constraintTargetIsSelf() ? [] : n.testConstraint(e) ? this.descend() : s : s;
  }
  descend() {
    return this.tail ? this.tail.descend().map((e) => new Wr(e.head, e.tail)) : [new Wr(null, null)];
  }
  toString() {
    const e = ["<"];
    return this.head && e.push(this.head.toString()), e.push("|"), this.tail && e.push(this.tail.toString()), e.push(">"), e.join("");
  }
}
class gr {
  constructor(e, n) {
    W(this, "active");
    W(this, "recursives");
    W(this, "payload");
    this.active = e || [], n ? (this.recursives = n.recursives, this.payload = n.payload) : this.recursives = [], this.extractRecursives();
  }
  setPayload(e) {
    return this.payload = e, this;
  }
  // Moves any recursive descenders onto the recursive track, removing them from
  // the active set
  extractRecursives() {
    this.active = this.active.filter((e) => e.isRecursive() ? (this.recursives.push(...e.extractRecursives()), !1) : !0);
  }
  // Find recursives that are relevant now and should be considered part of the active set
  activeRecursives(e) {
    return this.recursives.filter((n) => {
      const s = n.head;
      return s ? s.isConstraint() || e.containerType() === "array" && s.isIndexReference() ? !0 : e.containerType() === "object" ? s.isAttributeReference() && e.hasAttribute(s.name()) : !1 : !1;
    });
  }
  match(e) {
    return this.iterate(e).extractMatches(e);
  }
  iterate(e) {
    const n = [];
    return this.active.concat(this.activeRecursives(e)).forEach((s) => {
      n.push(...s.iterate(e));
    }), new gr(n, this);
  }
  // Returns true if any of the descenders in the active or recursive set
  // consider the current state a final destination
  isDestination() {
    return this.active.some((e) => e.hasArrived());
  }
  hasRecursives() {
    return this.recursives.length > 0;
  }
  // Returns any payload delivieries and leads that needs to be followed to complete
  // the process.
  extractMatches(e) {
    const n = [], s = [];
    if (this.active.forEach((u) => {
      if (u.hasArrived()) {
        s.push(
          new Oe({
            type: "alias",
            target: "self"
          })
        );
        return;
      }
      const a = u.head;
      if (a && !(e.containerType() === "array" && !a.isIndexReference()) && !(e.containerType() === "object" && !a.isAttributeReference()))
        if (u.tail) {
          const f = new gr(u.descend(), this);
          a.toFieldReferences().forEach(() => {
            n.push({
              target: a,
              matcher: f
            });
          });
        } else
          s.push(a);
    }), this.hasRecursives()) {
      const u = new gr([], this);
      if (e.containerType() === "array") {
        const a = e.length();
        for (let f = 0; f < a; f++)
          n.push({
            target: Oe.indexReference(f),
            matcher: u
          });
      } else
        e.containerType() === "object" && e.attributeKeys().forEach((a) => {
          n.push({
            target: Oe.attributeReference(a),
            matcher: u
          });
        });
    }
    return s.length > 0 ? { leads: n, delivery: { targets: s, payload: this.payload } } : { leads: n };
  }
  static fromPath(e) {
    const n = ld(e);
    if (!n)
      throw new Error(`Failed to parse path from "${e}"`);
    const s = new Wr(null, new Oe(n));
    return new gr(s.descend());
  }
}
class lo {
  constructor(e, n) {
    W(this, "_value");
    W(this, "path");
    this._value = e, this.path = n || [];
  }
  containerType() {
    return Array.isArray(this._value) ? "array" : this._value !== null && typeof this._value == "object" ? "object" : "primitive";
  }
  length() {
    if (!Array.isArray(this._value))
      throw new Error("Won't return length of non-indexable _value");
    return this._value.length;
  }
  getIndex(e) {
    return Array.isArray(this._value) ? e >= this.length() ? null : new lo(this._value[e], this.path.concat(e)) : !1;
  }
  hasAttribute(e) {
    return Js(this._value) ? this._value.hasOwnProperty(e) : !1;
  }
  attributeKeys() {
    return Js(this._value) ? Object.keys(this._value) : [];
  }
  getAttribute(e) {
    if (!Js(this._value))
      throw new Error("getAttribute only applies to plain objects");
    return this.hasAttribute(e) ? new lo(this._value[e], this.path.concat(e)) : null;
  }
  get() {
    return this._value;
  }
}
function vC(r, e) {
  const n = [], s = gr.fromPath(r).setPayload(function(f) {
    n.push(...f);
  }), u = new lo(e);
  return dd(s, u), n;
}
function dd(r, e) {
  const { leads: n, delivery: s } = r.match(e);
  n.forEach((u) => {
    dl(u.target, e).forEach((a) => {
      dd(u.matcher, a);
    });
  }), s && s.targets.forEach((u) => {
    typeof s.payload == "function" && s.payload(dl(u, e));
  });
}
function dl(r, e) {
  const n = [];
  if (r.isIndexReference())
    r.toIndicies(e).forEach((s) => {
      n.push(e.getIndex(s));
    });
  else if (r.isAttributeReference())
    n.push(e.getAttribute(r.name()));
  else if (r.isSelfReference())
    n.push(e);
  else
    throw new Error(`Unable to derive accessor for target ${r.toString()}`);
  return Xn.compact(n);
}
function mC(r, e) {
  return vC(r, e).map((s) => ({ path: s.path, value: s.get() }));
}
function yC(r) {
  const e = r.charCodeAt(0);
  return e >= 55296 && e <= 56319;
}
function na(r) {
  const e = r.charCodeAt(0);
  return e >= 56320 && e <= 57343;
}
function Li(r) {
  const [e, n] = r;
  return [e, n];
}
function pl(r, e) {
  let n = r, s = e;
  const u = n.length, a = s.length;
  if (u === 0 || a === 0)
    return 0;
  u > a ? n = n.substring(u - a) : u < a && (s = s.substring(0, u));
  const f = Math.min(u, a);
  if (n === s)
    return f;
  let l = 0, d = 1;
  for (let y = 0; y !== -1; ) {
    const p = n.substring(f - d);
    if (y = s.indexOf(p), y === -1)
      return l;
    d += y, (y === 0 || n.substring(f - d) === s.substring(0, d)) && (l = d, d++);
  }
  return l;
}
function ga(r, e) {
  if (!r || !e || r[0] !== e[0])
    return 0;
  let n = 0, s = Math.min(r.length, e.length), u = s, a = 0;
  for (; n < u; )
    r.substring(a, u) === e.substring(a, u) ? (n = u, a = n) : s = u, u = Math.floor((s - n) / 2 + n);
  return u;
}
function vo(r, e) {
  if (!r || !e || r[r.length - 1] !== e[e.length - 1])
    return 0;
  let n = 0, s = Math.min(r.length, e.length), u = s, a = 0;
  for (; n < u; )
    r.substring(r.length - u, r.length - a) === e.substring(e.length - u, e.length - a) ? (n = u, a = n) : s = u, u = Math.floor((s - n) / 2 + n);
  return u;
}
function pd(r) {
  let e = r.map((m) => Li(m)), n = !1;
  const s = [];
  let u = 0, a = null, f = 0, l = 0, d = 0, y = 0, p = 0;
  for (; f < e.length; )
    e[f][0] === it ? (s[u++] = f, l = y, d = p, y = 0, p = 0, a = e[f][1]) : (e[f][0] === Rt ? y += e[f][1].length : p += e[f][1].length, a && a.length <= Math.max(l, d) && a.length <= Math.max(y, p) && (e.splice(s[u - 1], 0, [Et, a]), e[s[u - 1] + 1][0] = Rt, u--, u--, f = u > 0 ? s[u - 1] : -1, l = 0, d = 0, y = 0, p = 0, a = null, n = !0)), f++;
  for (n && (e = mo(e)), e = gd(e), f = 1; f < e.length; ) {
    if (e[f - 1][0] === Et && e[f][0] === Rt) {
      const m = e[f - 1][1], b = e[f][1], C = pl(m, b), I = pl(b, m);
      C >= I ? (C >= m.length / 2 || C >= b.length / 2) && (e.splice(f, 0, [it, b.substring(0, C)]), e[f - 1][1] = m.substring(0, m.length - C), e[f + 1][1] = b.substring(C), f++) : (I >= m.length / 2 || I >= b.length / 2) && (e.splice(f, 0, [it, m.substring(0, I)]), e[f - 1][0] = Rt, e[f - 1][1] = b.substring(0, b.length - I), e[f + 1][0] = Et, e[f + 1][1] = m.substring(I), f++), f++;
    }
    f++;
  }
  return e;
}
const gl = /[^a-zA-Z0-9]/, vl = /\s/, ml = /[\r\n]/, wC = /\n\r?\n$/, bC = /^\r?\n\r?\n/;
function gd(r) {
  const e = r.map((u) => Li(u));
  function n(u, a) {
    if (!u || !a)
      return 6;
    const f = u.charAt(u.length - 1), l = a.charAt(0), d = f.match(gl), y = l.match(gl), p = d && f.match(vl), m = y && l.match(vl), b = p && f.match(ml), C = m && l.match(ml), I = b && u.match(wC), O = C && a.match(bC);
    return I || O ? 5 : b || C ? 4 : d && !p && m ? 3 : p || m ? 2 : d || y ? 1 : 0;
  }
  let s = 1;
  for (; s < e.length - 1; ) {
    if (e[s - 1][0] === it && e[s + 1][0] === it) {
      let u = e[s - 1][1], a = e[s][1], f = e[s + 1][1];
      const l = vo(u, a);
      if (l) {
        const b = a.substring(a.length - l);
        u = u.substring(0, u.length - l), a = b + a.substring(0, a.length - l), f = b + f;
      }
      let d = u, y = a, p = f, m = n(u, a) + n(a, f);
      for (; a.charAt(0) === f.charAt(0); ) {
        u += a.charAt(0), a = a.substring(1) + f.charAt(0), f = f.substring(1);
        const b = n(u, a) + n(a, f);
        b >= m && (m = b, d = u, y = a, p = f);
      }
      e[s - 1][1] !== d && (d ? e[s - 1][1] = d : (e.splice(s - 1, 1), s--), e[s][1] = y, p ? e[s + 1][1] = p : (e.splice(s + 1, 1), s--));
    }
    s++;
  }
  return e;
}
function mo(r) {
  let e = r.map((y) => Li(y));
  e.push([it, ""]);
  let n = 0, s = 0, u = 0, a = "", f = "", l;
  for (; n < e.length; )
    switch (e[n][0]) {
      case Rt:
        u++, f += e[n][1], n++;
        break;
      case Et:
        s++, a += e[n][1], n++;
        break;
      case it:
        s + u > 1 ? (s !== 0 && u !== 0 && (l = ga(f, a), l !== 0 && (n - s - u > 0 && e[n - s - u - 1][0] === it ? e[n - s - u - 1][1] += f.substring(0, l) : (e.splice(0, 0, [it, f.substring(0, l)]), n++), f = f.substring(l), a = a.substring(l)), l = vo(f, a), l !== 0 && (e[n][1] = f.substring(f.length - l) + e[n][1], f = f.substring(0, f.length - l), a = a.substring(0, a.length - l))), n -= s + u, e.splice(n, s + u), a.length && (e.splice(n, 0, [Et, a]), n++), f.length && (e.splice(n, 0, [Rt, f]), n++), n++) : n !== 0 && e[n - 1][0] === it ? (e[n - 1][1] += e[n][1], e.splice(n, 1)) : n++, u = 0, s = 0, a = "", f = "";
        break;
      default:
        throw new Error("Unknown diff operation");
    }
  e[e.length - 1][1] === "" && e.pop();
  let d = !1;
  for (n = 1; n < e.length - 1; )
    e[n - 1][0] === it && e[n + 1][0] === it && (e[n][1].substring(e[n][1].length - e[n - 1][1].length) === e[n - 1][1] ? (e[n][1] = e[n - 1][1] + e[n][1].substring(0, e[n][1].length - e[n - 1][1].length), e[n + 1][1] = e[n - 1][1] + e[n + 1][1], e.splice(n - 1, 1), d = !0) : e[n][1].substring(0, e[n + 1][1].length) === e[n + 1][1] && (e[n - 1][1] += e[n + 1][1], e[n][1] = e[n][1].substring(e[n + 1][1].length) + e[n + 1][1], e.splice(n + 1, 1), d = !0)), n++;
  return d && (e = mo(e)), e;
}
function _C() {
  for (var r = arguments.length, e = new Array(r), n = 0; n < r; n++)
    e[n] = arguments[n];
  return e.reduce((s, u) => s + (u ? 1 : 0), 0);
}
function CC(r) {
  let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 4, n = r.map((b) => Li(b)), s = !1;
  const u = [];
  let a = 0, f = null, l = 0, d = !1, y = !1, p = !1, m = !1;
  for (; l < n.length; )
    n[l][0] === it ? (n[l][1].length < e && (p || m) ? (u[a++] = l, d = p, y = m, f = n[l][1]) : (a = 0, f = null), p = !1, m = !1) : (n[l][0] === Et ? m = !0 : p = !0, f && (d && y && p && m || f.length < e / 2 && _C(d, y, p, m) === 3) && (n.splice(u[a - 1], 0, [Et, f]), n[u[a - 1] + 1][0] = Rt, a--, f = null, d && y ? (p = !0, m = !0, a = 0) : (a--, l = a > 0 ? u[a - 1] : -1, p = !1, m = !1), s = !0)), l++;
  return s && (n = mo(n)), n;
}
function EC(r, e, n) {
  const s = r.length, u = e.length, a = Math.ceil((s + u) / 2), f = a, l = 2 * a, d = new Array(l), y = new Array(l);
  for (let R = 0; R < l; R++)
    d[R] = -1, y[R] = -1;
  d[f + 1] = 0, y[f + 1] = 0;
  const p = s - u, m = p % 2 !== 0;
  let b = 0, C = 0, I = 0, O = 0;
  for (let R = 0; R < a && !(Date.now() > n); R++) {
    for (let x = -R + b; x <= R - C; x += 2) {
      const D = f + x;
      let U;
      x === -R || x !== R && d[D - 1] < d[D + 1] ? U = d[D + 1] : U = d[D - 1] + 1;
      let M = U - x;
      for (; U < s && M < u && r.charAt(U) === e.charAt(M); )
        U++, M++;
      if (d[D] = U, U > s)
        C += 2;
      else if (M > u)
        b += 2;
      else if (m) {
        const z = f + p - x;
        if (z >= 0 && z < l && y[z] !== -1) {
          const ht = s - y[z];
          if (U >= ht)
            return yl(r, e, U, M, n);
        }
      }
    }
    for (let x = -R + I; x <= R - O; x += 2) {
      const D = f + x;
      let U;
      x === -R || x !== R && y[D - 1] < y[D + 1] ? U = y[D + 1] : U = y[D - 1] + 1;
      let M = U - x;
      for (; U < s && M < u && r.charAt(s - U - 1) === e.charAt(u - M - 1); )
        U++, M++;
      if (y[D] = U, U > s)
        O += 2;
      else if (M > u)
        I += 2;
      else if (!m) {
        const z = f + p - x;
        if (z >= 0 && z < l && d[z] !== -1) {
          const ht = d[z], _t = f + ht - z;
          if (U = s - U, ht >= U)
            return yl(r, e, ht, _t, n);
        }
      }
    }
  }
  return [[Et, r], [Rt, e]];
}
function yl(r, e, n, s, u) {
  const a = r.substring(0, n), f = e.substring(0, s), l = r.substring(n), d = e.substring(s), y = vr(a, f, {
    checkLines: !1,
    deadline: u
  }), p = vr(l, d, {
    checkLines: !1,
    deadline: u
  });
  return y.concat(p);
}
function AC(r, e) {
  if ((arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1) <= 0)
    return null;
  const s = r.length > e.length ? r : e, u = r.length > e.length ? e : r;
  if (s.length < 4 || u.length * 2 < s.length)
    return null;
  const a = wl(s, u, Math.ceil(s.length / 4)), f = wl(s, u, Math.ceil(s.length / 2));
  let l;
  if (a && f)
    l = a[4].length > f[4].length ? a : f;
  else {
    if (!a && !f)
      return null;
    f ? a || (l = f) : l = a;
  }
  if (!l)
    throw new Error("Unable to find a half match.");
  let d, y, p, m;
  r.length > e.length ? (d = l[0], y = l[1], p = l[2], m = l[3]) : (p = l[0], m = l[1], d = l[2], y = l[3]);
  const b = l[4];
  return [d, y, p, m, b];
}
function wl(r, e, n) {
  const s = r.slice(n, n + Math.floor(r.length / 4));
  let u = -1, a = "", f, l, d, y;
  for (; (u = e.indexOf(s, u + 1)) !== -1; ) {
    const p = ga(r.slice(n), e.slice(u)), m = vo(r.slice(0, n), e.slice(0, u));
    a.length < m + p && (a = e.slice(u - m, u) + e.slice(u, u + p), f = r.slice(0, n - m), l = r.slice(n + p), d = e.slice(0, u - m), y = e.slice(u + p));
  }
  return a.length * 2 >= r.length ? [f || "", l || "", d || "", y || "", a || ""] : null;
}
function xC(r, e) {
  for (let n = 0; n < r.length; n++) {
    const s = r[n][1], u = [];
    for (let a = 0; a < s.length; a++)
      u[a] = e[s.charCodeAt(a)];
    r[n][1] = u.join("");
  }
}
function SC(r, e) {
  const n = [], s = {};
  n[0] = "";
  function u(d) {
    let y = "", p = 0, m = -1, b = n.length;
    for (; m < d.length - 1; ) {
      m = d.indexOf(`
`, p), m === -1 && (m = d.length - 1);
      let C = d.slice(p, m + 1);
      (s.hasOwnProperty ? s.hasOwnProperty(C) : s[C] !== void 0) ? y += String.fromCharCode(s[C]) : (b === a && (C = d.slice(p), m = d.length), y += String.fromCharCode(b), s[C] = b, n[b++] = C), p = m + 1;
    }
    return y;
  }
  let a = 4e4;
  const f = u(r);
  a = 65535;
  const l = u(e);
  return {
    chars1: f,
    chars2: l,
    lineArray: n
  };
}
function RC(r, e, n) {
  let s = r, u = e;
  const a = SC(s, u);
  s = a.chars1, u = a.chars2;
  const f = a.lineArray;
  let l = vr(s, u, {
    checkLines: !1,
    deadline: n.deadline
  });
  xC(l, f), l = pd(l), l.push([it, ""]);
  let d = 0, y = 0, p = 0, m = "", b = "";
  for (; d < l.length; ) {
    switch (l[d][0]) {
      case Rt:
        p++, b += l[d][1];
        break;
      case Et:
        y++, m += l[d][1];
        break;
      case it:
        if (y >= 1 && p >= 1) {
          l.splice(d - y - p, y + p), d = d - y - p;
          const C = vr(m, b, {
            checkLines: !1,
            deadline: n.deadline
          });
          for (let I = C.length - 1; I >= 0; I--)
            l.splice(d, 0, C[I]);
          d += C.length;
        }
        p = 0, y = 0, m = "", b = "";
        break;
      default:
        throw new Error("Unknown diff operation.");
    }
    d++;
  }
  return l.pop(), l;
}
function IC(r, e, n) {
  let s;
  if (!r)
    return [[Rt, e]];
  if (!e)
    return [[Et, r]];
  const u = r.length > e.length ? r : e, a = r.length > e.length ? e : r, f = u.indexOf(a);
  if (f !== -1)
    return s = [[Rt, u.substring(0, f)], [it, a], [Rt, u.substring(f + a.length)]], r.length > e.length && (s[0][0] = Et, s[2][0] = Et), s;
  if (a.length === 1)
    return [[Et, r], [Rt, e]];
  const l = AC(r, e);
  if (l) {
    const d = l[0], y = l[1], p = l[2], m = l[3], b = l[4], C = vr(d, p, n), I = vr(y, m, n);
    return C.concat([[it, b]], I);
  }
  return n.checkLines && r.length > 100 && e.length > 100 ? RC(r, e, n) : EC(r, e, n.deadline);
}
const Et = -1, Rt = 1, it = 0;
function vd(r, e, n) {
  if (r === null || e === null)
    throw new Error("Null input. (diff)");
  const s = vr(r, e, TC(n || {}));
  return $C(s), s;
}
function vr(r, e, n) {
  let s = r, u = e;
  if (s === u)
    return s ? [[it, s]] : [];
  let a = ga(s, u);
  const f = s.substring(0, a);
  s = s.substring(a), u = u.substring(a), a = vo(s, u);
  const l = s.substring(s.length - a);
  s = s.substring(0, s.length - a), u = u.substring(0, u.length - a);
  let d = IC(s, u, n);
  return f && d.unshift([it, f]), l && d.push([it, l]), d = mo(d), d;
}
function OC(r) {
  let e = 1;
  return typeof r < "u" && (e = r <= 0 ? Number.MAX_VALUE : r), Date.now() + e * 1e3;
}
function TC(r) {
  return {
    checkLines: !0,
    deadline: OC(r.timeout || 1),
    ...r
  };
}
function Rs(r, e, n) {
  return n === 1 ? r + e : e + r;
}
function Is(r, e) {
  return e === 1 ? [r.substring(0, r.length - 1), r[r.length - 1]] : [r.substring(1), r[0]];
}
function LC(r, e, n, s) {
  return s === 1 ? r[e][1][r[e][1].length - 1] === r[n][1][r[n][1].length - 1] : r[e][1][0] === r[n][1][0];
}
function bl(r, e, n) {
  const s = n === 1 ? -1 : 1;
  let u = null, a = null, f = e + n;
  for (; f >= 0 && f < r.length && (u === null || a === null); f += n) {
    const [y, p] = r[f];
    if (p.length !== 0) {
      if (y === Rt) {
        u === null && (u = f);
        continue;
      } else if (y === Et) {
        a === null && (a = f);
        continue;
      } else if (y === it) {
        if (u === null && a === null) {
          const [m, b] = Is(r[e][1], n);
          r[e][1] = m, r[f][1] = Rs(r[f][1], b, s);
          return;
        }
        break;
      }
    }
  }
  if (u !== null && a !== null && LC(r, u, a, n)) {
    const [y, p] = Is(r[u][1], s), [m] = Is(r[a][1], s);
    r[u][1] = y, r[a][1] = m, r[e][1] = Rs(r[e][1], p, n);
    return;
  }
  const [l, d] = Is(r[e][1], n);
  r[e][1] = l, u === null ? (r.splice(f, 0, [Rt, d]), a !== null && a >= f && a++) : r[u][1] = Rs(r[u][1], d, s), a === null ? r.splice(f, 0, [Et, d]) : r[a][1] = Rs(r[a][1], d, s);
}
function $C(r) {
  for (let e = 0; e < r.length; e++) {
    const [n, s] = r[e];
    if (s.length === 0)
      continue;
    const u = s[0], a = s[s.length - 1];
    yC(a) && n === it && bl(r, e, 1), na(u) && n === it && bl(r, e, -1);
  }
  for (let e = 0; e < r.length; e++)
    r[e][1].length === 0 && r.splice(e, 1);
}
const PC = {
  /**
   * At what point is no match declared (0.0 = perfection, 1.0 = very loose).
   */
  threshold: 0.5,
  /**
   * How far to search for a match (0 = exact location, 1000+ = broad match).
   * A match this many characters away from the expected location will add
   * 1.0 to the score (0.0 is a perfect match).
   */
  distance: 1e3
};
function FC(r) {
  return {
    ...PC,
    ...r
  };
}
const MC = 32;
function DC(r, e, n) {
  let s = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
  if (e.length > MC)
    throw new Error("Pattern too long for this browser.");
  const u = FC(s), a = UC(e);
  function f(I, O) {
    const R = I / e.length, x = Math.abs(n - O);
    return u.distance ? R + x / u.distance : x ? 1 : R;
  }
  let l = u.threshold, d = r.indexOf(e, n);
  d !== -1 && (l = Math.min(f(0, d), l), d = r.lastIndexOf(e, n + e.length), d !== -1 && (l = Math.min(f(0, d), l)));
  const y = 1 << e.length - 1;
  d = -1;
  let p, m, b = e.length + r.length, C = [];
  for (let I = 0; I < e.length; I++) {
    for (p = 0, m = b; p < m; )
      f(I, n + m) <= l ? p = m : b = m, m = Math.floor((b - p) / 2 + p);
    b = m;
    let O = Math.max(1, n - m + 1);
    const R = Math.min(n + m, r.length) + e.length, x = new Array(R + 2);
    x[R + 1] = (1 << I) - 1;
    for (let D = R; D >= O; D--) {
      const U = a[r.charAt(D - 1)];
      if (I === 0 ? x[D] = (x[D + 1] << 1 | 1) & U : x[D] = (x[D + 1] << 1 | 1) & U | ((C[D + 1] | C[D]) << 1 | 1) | C[D + 1], x[D] & y) {
        const M = f(I, D - 1);
        if (M <= l)
          if (l = M, d = D - 1, d > n)
            O = Math.max(1, 2 * n - d);
          else
            break;
      }
    }
    if (f(I + 1, n) > l)
      break;
    C = x;
  }
  return d;
}
function UC(r) {
  const e = {};
  for (let n = 0; n < r.length; n++)
    e[r.charAt(n)] = 0;
  for (let n = 0; n < r.length; n++)
    e[r.charAt(n)] |= 1 << r.length - n - 1;
  return e;
}
function qu(r, e, n) {
  if (r === null || e === null || n === null)
    throw new Error("Null input. (match())");
  const s = Math.max(0, Math.min(n, r.length));
  if (r === e)
    return 0;
  if (r.length) {
    if (r.substring(s, s + e.length) === e)
      return s;
  } else
    return -1;
  return DC(r, e, s);
}
function ho(r, e) {
  return {
    diffs: [],
    start1: r,
    start2: e,
    utf8Start1: r,
    utf8Start2: e,
    length1: 0,
    length2: 0,
    utf8Length1: 0,
    utf8Length2: 0
  };
}
function va(r) {
  const e = [];
  for (let n = 0; n < r.length; n++)
    r[n][0] !== Rt && (e[n] = r[n][1]);
  return e.join("");
}
function md(r) {
  const e = [];
  for (let n = 0; n < r.length; n++)
    r[n][0] !== Et && (e[n] = r[n][1]);
  return e.join("");
}
function Kn(r) {
  let e = 0;
  for (let n = 0; n < r.length; n++) {
    const s = r.codePointAt(n);
    if (typeof s > "u")
      throw new Error("Failed to get codepoint");
    e += yd(s);
  }
  return e;
}
function kC(r, e) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, s = 0, u = 0;
  function a(l) {
    for (; s < l; ) {
      const d = e.codePointAt(u);
      if (typeof d > "u")
        return u;
      s += yd(d), d > 65535 ? u += 2 : u += 1;
    }
    if (!n.allowExceedingIndices && s !== l)
      throw new Error("Failed to determine byte offset");
    return u;
  }
  const f = [];
  for (const l of r)
    f.push({
      diffs: l.diffs.map((d) => Li(d)),
      start1: a(l.start1),
      start2: a(l.start2),
      utf8Start1: l.utf8Start1,
      utf8Start2: l.utf8Start2,
      length1: l.length1,
      length2: l.length2,
      utf8Length1: l.utf8Length1,
      utf8Length2: l.utf8Length2
    });
  return f;
}
function yd(r) {
  return r <= 127 ? 1 : r <= 2047 ? 2 : r <= 65535 ? 3 : 4;
}
const Hn = 32, ma = 4, NC = {
  margin: 4
};
function Wu() {
  let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  return {
    ...NC,
    ...r
  };
}
function qC(r, e, n) {
  if (typeof r == "string" && typeof e == "string") {
    let s = vd(r, e, {
      checkLines: !0
    });
    return s.length > 2 && (s = pd(s), s = CC(s)), Bu(r, s, Wu(n));
  }
  if (r && Array.isArray(r) && typeof e > "u")
    return Bu(va(r), r, Wu(n));
  if (typeof r == "string" && e && Array.isArray(e))
    return Bu(r, e, Wu(n));
  throw new Error("Unknown call format to make()");
}
function Bu(r, e, n) {
  if (e.length === 0)
    return [];
  const s = [];
  let u = ho(0, 0), a = 0, f = 0, l = 0, d = 0, y = 0, p = r, m = r;
  for (let b = 0; b < e.length; b++) {
    const C = e[b], [I, O] = C, R = O.length, x = Kn(O);
    switch (!a && I !== it && (u.start1 = f, u.start2 = l, u.utf8Start1 = d, u.utf8Start2 = y), I) {
      case Rt:
        u.diffs[a++] = C, u.length2 += R, u.utf8Length2 += x, m = m.substring(0, l) + O + m.substring(l);
        break;
      case Et:
        u.length1 += R, u.utf8Length1 += x, u.diffs[a++] = C, m = m.substring(0, l) + m.substring(l + R);
        break;
      case it:
        R <= 2 * n.margin && a && e.length !== b + 1 ? (u.diffs[a++] = C, u.length1 += R, u.length2 += R, u.utf8Length1 += x, u.utf8Length2 += x) : R >= 2 * n.margin && a && (_l(u, p, n), s.push(u), u = ho(-1, -1), a = 0, p = m, f = l, d = y);
        break;
      default:
        throw new Error("Unknown diff type");
    }
    I !== Rt && (f += R, d += x), I !== Et && (l += R, y += x);
  }
  return a && (_l(u, p, n), s.push(u)), s;
}
function _l(r, e, n) {
  if (e.length === 0)
    return;
  let s = e.substring(r.start2, r.start2 + r.length1), u = 0;
  for (; e.indexOf(s) !== e.lastIndexOf(s) && s.length < Hn - n.margin - n.margin; )
    u += n.margin, s = e.substring(r.start2 - u, r.start2 + r.length1 + u);
  u += n.margin;
  let a = r.start2 - u;
  a >= 1 && na(e[a]) && a--;
  const f = e.substring(a, r.start2);
  f && r.diffs.unshift([it, f]);
  const l = f.length, d = Kn(f);
  let y = r.start2 + r.length1 + u;
  y < e.length && na(e[y]) && y++;
  const p = e.substring(r.start2 + r.length1, y);
  p && r.diffs.push([it, p]);
  const m = p.length, b = Kn(p);
  r.start1 -= l, r.start2 -= l, r.utf8Start1 -= d, r.utf8Start2 -= d, r.length1 += l + m, r.length2 += l + m, r.utf8Length1 += d + b, r.utf8Length2 += d + b;
}
function WC(r) {
  let e = 0, n = 0, s = 0;
  for (let u = 0; u < r.length; u++) {
    const a = r[u][0], f = r[u][1];
    switch (a) {
      case Rt:
        n += f.length;
        break;
      case Et:
        s += f.length;
        break;
      case it:
        e += Math.max(n, s), n = 0, s = 0;
        break;
      default:
        throw new Error("Unknown diff operation.");
    }
  }
  return e += Math.max(n, s), e;
}
function Cl(r, e) {
  let n = 0, s = 0, u = 0, a = 0, f;
  for (f = 0; f < r.length && (r[f][0] !== Rt && (n += r[f][1].length), r[f][0] !== Et && (s += r[f][1].length), !(n > e)); f++)
    u = n, a = s;
  return r.length !== f && r[f][0] === Et ? a : a + (e - u);
}
function BC(r) {
  const n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : ma;
  let s = "";
  for (let f = 1; f <= n; f++)
    s += String.fromCharCode(f);
  for (const f of r)
    f.start1 += n, f.start2 += n, f.utf8Start1 += n, f.utf8Start2 += n;
  let u = r[0], a = u.diffs;
  if (a.length === 0 || a[0][0] !== it)
    a.unshift([it, s]), u.start1 -= n, u.start2 -= n, u.utf8Start1 -= n, u.utf8Start2 -= n, u.length1 += n, u.length2 += n, u.utf8Length1 += n, u.utf8Length2 += n;
  else if (n > a[0][1].length) {
    const f = a[0][1].length, l = n - f;
    a[0][1] = s.substring(f) + a[0][1], u.start1 -= l, u.start2 -= l, u.utf8Start1 -= l, u.utf8Start2 -= l, u.length1 += l, u.length2 += l, u.utf8Length1 += l, u.utf8Length2 += l;
  }
  if (u = r[r.length - 1], a = u.diffs, a.length === 0 || a[a.length - 1][0] !== it)
    a.push([it, s]), u.length1 += n, u.length2 += n, u.utf8Length1 += n, u.utf8Length2 += n;
  else if (n > a[a.length - 1][1].length) {
    const f = n - a[a.length - 1][1].length;
    a[a.length - 1][1] += s.substring(0, f), u.length1 += f, u.length2 += f, u.utf8Length1 += f, u.utf8Length2 += f;
  }
  return s;
}
function HC(r) {
  let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : ma;
  const n = Hn;
  for (let s = 0; s < r.length; s++) {
    if (r[s].length1 <= n)
      continue;
    const u = r[s];
    r.splice(s--, 1);
    let a = u.start1, f = u.start2, l = "";
    for (; u.diffs.length !== 0; ) {
      const d = ho(a - l.length, f - l.length);
      let y = !0;
      if (l !== "") {
        const b = Kn(l);
        d.length1 = l.length, d.utf8Length1 = b, d.length2 = l.length, d.utf8Length2 = b, d.diffs.push([it, l]);
      }
      for (; u.diffs.length !== 0 && d.length1 < n - e; ) {
        const b = u.diffs[0][0];
        let C = u.diffs[0][1], I = Kn(C);
        if (b === Rt) {
          d.length2 += C.length, d.utf8Length2 += I, f += C.length;
          const O = u.diffs.shift();
          O && d.diffs.push(O), y = !1;
        } else
          b === Et && d.diffs.length === 1 && d.diffs[0][0] === it && C.length > 2 * n ? (d.length1 += C.length, d.utf8Length1 += I, a += C.length, y = !1, d.diffs.push([b, C]), u.diffs.shift()) : (C = C.substring(0, n - d.length1 - e), I = Kn(C), d.length1 += C.length, d.utf8Length1 += I, a += C.length, b === it ? (d.length2 += C.length, d.utf8Length2 += I, f += C.length) : y = !1, d.diffs.push([b, C]), C === u.diffs[0][1] ? u.diffs.shift() : u.diffs[0][1] = u.diffs[0][1].substring(C.length));
      }
      l = md(d.diffs), l = l.substring(l.length - e);
      const p = va(u.diffs).substring(0, e), m = Kn(p);
      p !== "" && (d.length1 += p.length, d.length2 += p.length, d.utf8Length1 += m, d.utf8Length2 += m, d.diffs.length !== 0 && d.diffs[d.diffs.length - 1][0] === it ? d.diffs[d.diffs.length - 1][1] += p : d.diffs.push([it, p])), y || r.splice(++s, 0, d);
    }
  }
}
function GC(r, e) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof r == "string")
    throw new Error("Patches must be an array - pass the patch to `parsePatch()` first");
  let s = e;
  if (r.length === 0)
    return [s, []];
  const u = kC(r, s, {
    allowExceedingIndices: n.allowExceedingIndices
  }), a = n.margin || ma, f = n.deleteThreshold || 0.4, l = BC(u, a);
  s = l + s + l, HC(u, a);
  let d = 0;
  const y = [];
  for (let p = 0; p < u.length; p++) {
    const m = u[p].start2 + d, b = va(u[p].diffs);
    let C, I = -1;
    if (b.length > Hn ? (C = qu(s, b.substring(0, Hn), m), C !== -1 && (I = qu(s, b.substring(b.length - Hn), m + b.length - Hn), (I === -1 || C >= I) && (C = -1))) : C = qu(s, b, m), C === -1)
      y[p] = !1, d -= u[p].length2 - u[p].length1;
    else {
      y[p] = !0, d = C - m;
      let O;
      if (I === -1 ? O = s.substring(C, C + b.length) : O = s.substring(C, I + Hn), b === O)
        s = s.substring(0, C) + md(u[p].diffs) + s.substring(C + b.length);
      else {
        let R = vd(b, O, {
          checkLines: !1
        });
        if (b.length > Hn && WC(R) / b.length > f)
          y[p] = !1;
        else {
          R = gd(R);
          let x = 0, D = 0;
          for (let U = 0; U < u[p].diffs.length; U++) {
            const M = u[p].diffs[U];
            M[0] !== it && (D = Cl(R, x)), M[0] === Rt ? s = s.substring(0, C + D) + M[1] + s.substring(C + D) : M[0] === Et && (s = s.substring(0, C + D) + s.substring(C + Cl(R, x + M[1].length))), M[0] !== Et && (x += M[1].length);
          }
        }
      }
    }
  }
  return s = s.substring(l.length, s.length - l.length), [s, y];
}
function jC(r) {
  return r.map(zC).join("");
}
function zC(r) {
  const {
    utf8Length1: e,
    utf8Length2: n,
    utf8Start1: s,
    utf8Start2: u,
    diffs: a
  } = r;
  let f;
  e === 0 ? f = "".concat(s, ",0") : e === 1 ? f = "".concat(s + 1) : f = "".concat(s + 1, ",").concat(e);
  let l;
  n === 0 ? l = "".concat(u, ",0") : n === 1 ? l = "".concat(u + 1) : l = "".concat(u + 1, ",").concat(n);
  const d = ["@@ -".concat(f, " +").concat(l, ` @@
`)];
  let y;
  for (let p = 0; p < a.length; p++) {
    switch (a[p][0]) {
      case Rt:
        y = "+";
        break;
      case Et:
        y = "-";
        break;
      case it:
        y = " ";
        break;
      default:
        throw new Error("Unknown patch operation.");
    }
    d[p + 1] = "".concat(y + encodeURI(a[p][1]), `
`);
  }
  return d.join("").replace(/%20/g, " ");
}
const KC = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
function JC(r) {
  if (!r)
    return [];
  const e = [], n = r.split(`
`);
  let s = 0;
  for (; s < n.length; ) {
    const u = n[s].match(KC);
    if (!u)
      throw new Error("Invalid patch string: ".concat(n[s]));
    const a = ho(Os(u[1]), Os(u[3]));
    for (e.push(a), u[2] === "" ? (a.start1--, a.utf8Start1--, a.length1 = 1, a.utf8Length1 = 1) : u[2] === "0" ? (a.length1 = 0, a.utf8Length1 = 0) : (a.start1--, a.utf8Start1--, a.utf8Length1 = Os(u[2]), a.length1 = a.utf8Length1), u[4] === "" ? (a.start2--, a.utf8Start2--, a.length2 = 1, a.utf8Length2 = 1) : u[4] === "0" ? (a.length2 = 0, a.utf8Length2 = 0) : (a.start2--, a.utf8Start2--, a.utf8Length2 = Os(u[4]), a.length2 = a.utf8Length2), s++; s < n.length; ) {
      const f = n[s], l = f.charAt(0);
      if (l === "@")
        break;
      if (l === "") {
        s++;
        continue;
      }
      let d;
      try {
        d = decodeURI(f.slice(1));
      } catch {
        throw new Error("Illegal escape in parse: ".concat(f));
      }
      const y = Kn(d) - d.length;
      if (l === "-")
        a.diffs.push([Et, d]), a.length1 -= y;
      else if (l === "+")
        a.diffs.push([Rt, d]), a.length2 -= y;
      else if (l === " ")
        a.diffs.push([it, d]), a.length1 -= y, a.length2 -= y;
      else
        throw new Error('Invalid patch mode "'.concat(l, '" in: ').concat(d));
      s++;
    }
  }
  return e;
}
function Os(r) {
  return parseInt(r, 10);
}
function El(r, e) {
  if (typeof e != "string")
    return e;
  const [n] = GC(r, e, { allowExceedingIndices: !0 });
  return n;
}
class XC {
  constructor(e, n, s) {
    W(this, "path");
    W(this, "dmpPatch");
    W(this, "id");
    this.id = e, this.path = n, this.dmpPatch = JC(s);
  }
  apply(e, n) {
    let s = n;
    if (s.containerType() === "primitive")
      return s;
    for (const u of e) {
      if (u.isIndexReference()) {
        for (const a of u.toIndicies(n)) {
          const f = s.getIndex(a);
          if (!f)
            continue;
          const l = f.get(), d = El(this.dmpPatch, l);
          s = s.setIndex(a, d);
        }
        continue;
      }
      if (u.isAttributeReference() && s.hasAttribute(u.name())) {
        const a = s.getAttribute(u.name());
        if (!a)
          continue;
        const f = a.get(), l = El(this.dmpPatch, f);
        s = s.setAttribute(u.name(), l);
        continue;
      }
      throw new Error(`Unable to apply diffMatchPatch to target ${u.toString()}`);
    }
    return s;
  }
}
function Al(r, e) {
  return typeof r != "number" || !Number.isFinite(r) ? r : r + e;
}
class xl {
  constructor(e, n, s) {
    W(this, "path");
    W(this, "value");
    W(this, "id");
    this.path = n, this.value = s, this.id = e;
  }
  apply(e, n) {
    let s = n;
    if (s.containerType() === "primitive")
      return s;
    for (const u of e) {
      if (u.isIndexReference()) {
        for (const a of u.toIndicies(n)) {
          const f = s.getIndex(a);
          if (!f)
            continue;
          const l = f.get();
          s = s.setIndex(a, Al(l, this.value));
        }
        continue;
      }
      if (u.isAttributeReference()) {
        const a = s.getAttribute(u.name());
        if (!a)
          continue;
        const f = a.get();
        s = s.setAttribute(u.name(), Al(f, this.value));
        continue;
      }
      throw new Error(`Unable to apply to target ${u.toString()}`);
    }
    return s;
  }
}
function yo(r, e) {
  const n = [];
  return r.forEach((s) => {
    s.isIndexReference() && n.push(...s.toIndicies(e));
  }), n.sort();
}
class YC {
  constructor(e, n, s, u) {
    W(this, "location");
    W(this, "path");
    W(this, "items");
    W(this, "id");
    this.id = e, this.location = n, this.path = s, this.items = u;
  }
  apply(e, n) {
    let s = n;
    if (n.containerType() !== "array")
      throw new Error("Attempt to apply insert patch to non-array value");
    switch (this.location) {
      case "before": {
        const u = VC(e, n);
        s = s.insertItemsAt(u, this.items);
        break;
      }
      case "after": {
        const u = ZC(e, n);
        s = s.insertItemsAt(u + 1, this.items);
        break;
      }
      case "replace": {
        const u = yo(e, n);
        s = s.unsetIndices(u), s = s.insertItemsAt(u[0], this.items);
        break;
      }
      default:
        throw new Error(`Unsupported location atm: ${this.location}`);
    }
    return s;
  }
}
function VC(r, e) {
  let n = Xn.min(yo(r, e)) || 0;
  return r.forEach((s) => {
    if (s.isRange()) {
      const { start: u } = s.expandRange();
      u < n && (n = u);
    }
  }), n;
}
function ZC(r, e) {
  let n = Xn.max(yo(r, e)) || 0;
  return r.forEach((s) => {
    if (s.isRange()) {
      const { end: u } = s.expandRange();
      u > n && (n = u);
    }
  }), n;
}
class wd {
  constructor(e, n, s) {
    W(this, "id");
    W(this, "path");
    W(this, "value");
    this.id = e, this.path = n, this.value = s;
  }
  apply(e, n) {
    let s = n;
    return e.forEach((u) => {
      if (!u.isIndexReference())
        if (u.isAttributeReference())
          s.containerType() === "primitive" ? s = s.set({ [u.name()]: this.value }) : s.hasAttribute(u.name()) || (s = n.setAttribute(u.name(), this.value));
        else
          throw new Error(`Unable to apply to target ${u.toString()}`);
    }), s;
  }
}
class bd {
  constructor(e, n, s) {
    W(this, "id");
    W(this, "path");
    W(this, "value");
    this.id = e, this.path = n, this.value = s;
  }
  apply(e, n) {
    let s = n;
    return e.forEach((u) => {
      if (u.isSelfReference())
        s = s.set(this.value);
      else if (u.isIndexReference())
        u.toIndicies(n).forEach((a) => {
          s = s.setIndex(a, this.value);
        });
      else if (u.isAttributeReference())
        s.containerType() === "primitive" ? s = s.set({ [u.name()]: this.value }) : s = s.setAttribute(u.name(), this.value);
      else
        throw new Error(`Unable to apply to target ${u.toString()}`);
    }), s;
  }
}
class QC {
  constructor(e, n) {
    W(this, "id");
    W(this, "path");
    W(this, "value");
    this.id = e, this.path = n;
  }
  // eslint-disable-next-line class-methods-use-this
  apply(e, n) {
    let s = n;
    switch (n.containerType()) {
      case "array":
        s = s.unsetIndices(yo(e, n));
        break;
      case "object":
        e.forEach((u) => {
          s = s.unsetAttribute(u.name());
        });
        break;
      default:
        throw new Error(
          "Target value is neither indexable or an object. This error should potentially just be silently ignored?"
        );
    }
    return s;
  }
}
function _d(r) {
  const e = [];
  if (Array.isArray(r))
    return r.reduce((y, p) => y.concat(_d(p)), e);
  const { set: n, setIfMissing: s, unset: u, diffMatchPatch: a, inc: f, dec: l, insert: d } = r;
  if (s && Object.keys(s).forEach((y) => {
    e.push(new wd(r.id, y, s[y]));
  }), n && Object.keys(n).forEach((y) => {
    e.push(new bd(r.id, y, n[y]));
  }), u && u.forEach((y) => {
    e.push(new QC(r.id, y));
  }), a && Object.keys(a).forEach((y) => {
    e.push(new XC(r.id, y, a[y]));
  }), f && Object.keys(f).forEach((y) => {
    e.push(new xl(r.id, y, f[y]));
  }), l && Object.keys(l).forEach((y) => {
    e.push(new xl(r.id, y, -l[y]));
  }), d) {
    let y, p;
    const m = d;
    if ("before" in m)
      y = "before", p = m.before;
    else if ("after" in m)
      y = "after", p = m.after;
    else if ("replace" in m)
      y = "replace", p = m.replace;
    else
      throw new Error("Invalid insert patch");
    e.push(new YC(r.id, y, p, m.items));
  }
  return e;
}
class tE {
  constructor(e) {
    W(this, "patches");
    this.patches = _d(e);
  }
  apply(e) {
    const n = new sn(e);
    return this.applyViaAccessor(n).get();
  }
  // If you want to use your own accessor implementation, you can use this method
  // to invoke the patcher. Since all subsequent accessors for children of this accessor
  // are obtained through the methods in the accessors, you retain full control of the
  // implementation throguhgout the application. Have a look in ImmutableAccessor
  // to see an example of how accessors are implemented.
  applyViaAccessor(e) {
    let n = e;
    const s = e.getAttribute("_id");
    if (!s)
      throw new Error("Cannot apply patch to document with no _id");
    const u = s.get();
    for (const a of this.patches) {
      if (a.id !== u)
        continue;
      const f = gr.fromPath(a.path).setPayload(a);
      n = ra(f, n);
    }
    return n;
  }
}
function ra(r, e) {
  const n = r.payload instanceof bd || r.payload instanceof wd;
  let s = e;
  const { leads: u, delivery: a } = r.match(e);
  return u.forEach((f) => {
    if (f.target.isIndexReference())
      f.target.toIndicies().forEach((l) => {
        const d = s.getIndex(l);
        if (!d)
          throw new Error("Index out of bounds");
        s = s.setIndexAccessor(l, ra(f.matcher, d));
      });
    else if (f.target.isAttributeReference()) {
      n && s.containerType() === "primitive" && (s = s.set({}));
      let l = s.getAttribute(f.target.name());
      if (!l && n && (s = s.setAttribute(f.target.name(), {}), l = s.getAttribute(f.target.name())), !l)
        return;
      const d = ra(f.matcher, l);
      l !== d && (s = s.setAttributeAccessor(f.target.name(), d));
    } else
      throw new Error(`Unable to handle target ${f.target.toString()}`);
  }), a && eE(a.payload) && (s = a.payload.apply(a.targets, s)), s;
}
function eE(r) {
  return !!(r && typeof r == "object" && r !== null && "apply" in r && typeof r.apply == "function");
}
var Ts, nE = new Uint8Array(16);
function rE() {
  if (!Ts && (Ts = typeof crypto < "u" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto < "u" && typeof msCrypto.getRandomValues == "function" && msCrypto.getRandomValues.bind(msCrypto), !Ts))
    throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
  return Ts(nE);
}
const iE = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
function sE(r) {
  return typeof r == "string" && iE.test(r);
}
var Zt = [];
for (var Hu = 0; Hu < 256; ++Hu)
  Zt.push((Hu + 256).toString(16).substr(1));
function oE(r) {
  var e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0, n = (Zt[r[e + 0]] + Zt[r[e + 1]] + Zt[r[e + 2]] + Zt[r[e + 3]] + "-" + Zt[r[e + 4]] + Zt[r[e + 5]] + "-" + Zt[r[e + 6]] + Zt[r[e + 7]] + "-" + Zt[r[e + 8]] + Zt[r[e + 9]] + "-" + Zt[r[e + 10]] + Zt[r[e + 11]] + Zt[r[e + 12]] + Zt[r[e + 13]] + Zt[r[e + 14]] + Zt[r[e + 15]]).toLowerCase();
  if (!sE(n))
    throw TypeError("Stringified UUID is invalid");
  return n;
}
function uE(r, e, n) {
  r = r || {};
  var s = r.random || (r.rng || rE)();
  if (s[6] = s[6] & 15 | 64, s[8] = s[8] & 63 | 128, e) {
    n = n || 0;
    for (var u = 0; u < 16; ++u)
      e[n + u] = s[u];
    return e;
  }
  return oE(s);
}
const aE = uE;
class un {
  constructor(e) {
    W(this, "params");
    W(this, "compiled");
    W(this, "_appliesToMissingDocument");
    this.params = e;
  }
  get transactionId() {
    return this.params.transactionId;
  }
  get transition() {
    return this.params.transition;
  }
  get identity() {
    return this.params.identity;
  }
  get previousRev() {
    return this.params.previousRev;
  }
  get resultRev() {
    return this.params.resultRev;
  }
  get mutations() {
    return this.params.mutations;
  }
  get timestamp() {
    if (typeof this.params.timestamp == "string")
      return new Date(this.params.timestamp);
  }
  get effects() {
    return this.params.effects;
  }
  assignRandomTransactionId() {
    this.params.transactionId = aE(), this.params.resultRev = this.params.transactionId;
  }
  appliesToMissingDocument() {
    if (typeof this._appliesToMissingDocument < "u")
      return this._appliesToMissingDocument;
    const e = this.mutations[0];
    return e ? this._appliesToMissingDocument = !!(e.create || e.createIfNotExists || e.createOrReplace) : this._appliesToMissingDocument = !0, this._appliesToMissingDocument;
  }
  // Compiles all mutations into a handy function
  compile() {
    const e = [];
    this.mutations.forEach((u) => {
      if (u.create) {
        const a = u.create || {};
        e.push((f) => f || Object.assign(a, {
          _createdAt: a._createdAt || this.params.timestamp
        }));
        return;
      }
      if (u.createIfNotExists) {
        const a = u.createIfNotExists || {};
        e.push(
          (f) => f === null ? Object.assign(a, {
            _createdAt: a._createdAt || this.params.timestamp
          }) : f
        );
        return;
      }
      if (u.createOrReplace) {
        const a = u.createOrReplace || {};
        e.push(
          () => Object.assign(a, {
            _createdAt: a._createdAt || this.params.timestamp
          })
        );
        return;
      }
      if (u.delete) {
        e.push(() => null);
        return;
      }
      if (u.patch) {
        if ("query" in u.patch)
          return;
        const a = new tE(u.patch);
        e.push((f) => a.apply(f));
        return;
      }
      throw new Error(`Unsupported mutation ${JSON.stringify(u, null, 2)}`);
    }), typeof this.params.timestamp == "string" && e.push((u) => u ? Object.assign(u, { _updatedAt: this.params.timestamp }) : null);
    const n = this.previousRev, s = this.resultRev || this.transactionId;
    this.compiled = (u) => {
      if (n && u && n !== u._rev)
        throw new Error(
          `Previous revision for this mutation was ${n}, but the document revision is ${u._rev}`
        );
      let a = u;
      for (const f of e)
        a = f(a);
      return a && s && (a === u && (a = Object.assign({}, u)), a._rev = s), a;
    };
  }
  apply(e) {
    ct("Applying mutation %O to document %O", this.mutations, e), this.compiled || this.compile();
    const n = this.compiled(e);
    return ct("  => %O", n), n;
  }
  static applyAll(e, n) {
    return n.reduce((s, u) => u.apply(s), e);
  }
  // Given a number of yet-to-be-committed mutation objects, collects them into one big mutation
  // any metadata like transactionId is ignored and must be submitted by the client. It is assumed
  // that all mutations are on the same document.
  // TOOO: Optimize mutations, eliminating mutations that overwrite themselves!
  static squash(e, n) {
    const s = n.reduce(
      (u, a) => u.concat(...a.mutations),
      []
    );
    return new un({ mutations: s });
  }
}
class cE {
  constructor(e) {
    /**
     * Incoming patches from the server waiting to be applied to HEAD
     */
    W(this, "incoming", []);
    /**
     * Patches we know has been subitted to the server, but has not been seen yet in the return channel
     * so we can't be sure about the ordering yet (someone else might have slipped something between them)
     */
    W(this, "submitted", []);
    /**
     * Pending mutations
     */
    W(this, "pending", []);
    /**
     * Our model of the document according to the incoming patches from the server
     */
    W(this, "HEAD");
    /**
     * Our optimistic model of what the document will probably look like as soon as all our patches
     * have been processed. Updated every time we stage a new mutation, but also might revert back
     * to previous states if our mutations fail, or could change if unexpected mutations arrive
     * between our own. The `onRebase` callback will be called when EDGE changes in this manner.
     */
    W(this, "EDGE");
    /**
     * Called with the EDGE document when that document changes for a reason other than us staging
     * a new patch or receiving a mutation from the server while our EDGE is in sync with HEAD:
     * I.e. when EDGE changes because the order of mutations has changed in relation to our
     * optimistic predictions.
     */
    W(this, "onRebase");
    /**
     * Called when we receive a patch in the normal order of things, but the mutation is not ours
     */
    W(this, "onMutation");
    /**
     * Called when consistency state changes with the boolean value of the current consistency state
     */
    W(this, "onConsistencyChanged");
    /**
     * Called whenever a new incoming mutation comes in. These are always ordered correctly.
     */
    W(this, "onRemoteMutation");
    /**
     * We are consistent when there are no unresolved mutations of our own, and no un-applicable
     * incoming mutations. When this has been going on for too long, and there has been a while
     * since we staged a new mutation, it is time to reset your state.
     */
    W(this, "inconsistentAt", null);
    /**
     * The last time we staged a patch of our own. If we have been inconsistent for a while, but it
     * hasn't been long since we staged a new mutation, the reason is probably just because the user
     * is typing or something.
     *
     * Should be used as a guard against resetting state for inconsistency reasons.
     */
    W(this, "lastStagedAt", null);
    this.reset(e), this.HEAD = e, this.EDGE = e;
  }
  // Reset the state of the Document, used to recover from unsavory states by reloading the document
  reset(e) {
    this.incoming = [], this.submitted = [], this.pending = [], this.inconsistentAt = null, this.HEAD = e, this.EDGE = e, this.considerIncoming(), this.updateConsistencyFlag();
  }
  // Call when a mutation arrives from Sanity
  arrive(e) {
    this.incoming.push(e), this.considerIncoming(), this.updateConsistencyFlag();
  }
  // Call to signal that we are submitting a mutation. Returns a callback object with a
  // success and failure handler that must be called according to the outcome of our
  // submission.
  stage(e, n) {
    if (!e.transactionId)
      throw new Error("Mutations _must_ have transactionId when submitted");
    this.lastStagedAt = /* @__PURE__ */ new Date(), ct("Staging mutation %s (pushed to pending)", e.transactionId), this.pending.push(e), this.EDGE = e.apply(this.EDGE), this.onMutation && !n && this.onMutation({
      mutation: e,
      document: this.EDGE,
      remote: !1
    });
    const s = e.transactionId;
    return this.updateConsistencyFlag(), {
      success: () => {
        this.pendingSuccessfullySubmitted(s), this.updateConsistencyFlag();
      },
      failure: () => {
        this.pendingFailed(s), this.updateConsistencyFlag();
      }
    };
  }
  // Call to check if everything is nice and quiet and there are no unresolved mutations.
  // Means this model thinks both HEAD and EDGE is up to date with what the server sees.
  isConsistent() {
    return !this.inconsistentAt;
  }
  // Private
  // Attempts to apply any resolvable incoming patches to HEAD. Will keep patching as long as there
  // are applicable patches to be applied
  considerIncoming() {
    let e = !1, n;
    const s = [];
    if (this.HEAD && this.HEAD._updatedAt) {
      const a = new Date(this.HEAD._updatedAt);
      this.incoming.find((f) => f.timestamp && f.timestamp < a) && (this.incoming = this.incoming.filter((f) => f.timestamp && f.timestamp < a));
    }
    let u = 0;
    do {
      if (this.HEAD) {
        const a = this.HEAD;
        n = a._rev ? this.incoming.find((f) => f.previousRev === a._rev) : void 0;
      } else
        n = this.incoming.find((a) => a.appliesToMissingDocument());
      if (n) {
        const a = this.applyIncoming(n);
        if (e = e || a, e && s.push(n), u++ > 10)
          throw new Error(
            `Mutator stuck flushing incoming mutations. Probably stuck here: ${JSON.stringify(
              n
            )}`
          );
      }
    } while (n);
    this.incoming.length > 0 && ct.enabled && ct(
      "Unable to apply mutations %s",
      this.incoming.map((a) => a.transactionId).join(", ")
    ), e && this.rebase(s);
  }
  // check current consistency state, update flag and invoke callback if needed
  updateConsistencyFlag() {
    const e = this.isConsistent(), n = this.pending.length === 0 && this.submitted.length === 0 && this.incoming.length === 0;
    n ? this.inconsistentAt = null : this.inconsistentAt || (this.inconsistentAt = /* @__PURE__ */ new Date()), e != n && this.onConsistencyChanged && (ct(n ? "Buffered document is inconsistent" : "Buffered document is consistent"), this.onConsistencyChanged(n));
  }
  // apply an incoming patch that has been prequalified as the next in line for this document
  applyIncoming(e) {
    if (!e)
      return !1;
    if (!e.transactionId)
      throw new Error("Received incoming mutation without a transaction ID");
    if (ct(
      "Applying mutation %s -> %s to rev %s",
      e.previousRev,
      e.resultRev,
      this.HEAD && this.HEAD._rev
    ), this.HEAD = e.apply(this.HEAD), this.onRemoteMutation && this.onRemoteMutation(e), this.incoming = this.incoming.filter((n) => n.transactionId !== e.transactionId), this.hasUnresolvedMutations()) {
      const n = this.consumeUnresolved(e.transactionId);
      return ct.enabled && (ct(
        `Incoming mutation ${e.transactionId} appeared while there were pending or submitted local mutations`
      ), ct(`Submitted txnIds: ${this.submitted.map((s) => s.transactionId).join(", ")}`), ct(`Pending txnIds: ${this.pending.map((s) => s.transactionId).join(", ")}`), ct("needRebase === %s", n)), n;
    }
    return ct(
      "Remote mutation %s arrived w/o any pending or submitted local mutations",
      e.transactionId
    ), this.EDGE = this.HEAD, this.onMutation && this.onMutation({
      mutation: e,
      document: this.EDGE,
      remote: !0
    }), !1;
  }
  /**
   * Returns true if there are unresolved mutations between HEAD and EDGE, meaning we have
   * mutations that are still waiting to be either submitted, or to be confirmed by the server.
   *
   * @returns true if there are unresolved mutations between HEAD and EDGE, false otherwise
   */
  hasUnresolvedMutations() {
    return this.submitted.length > 0 || this.pending.length > 0;
  }
  /**
   * When an incoming mutation is applied to HEAD, this is called to remove the mutation from
   * the unresolved state. If the newly applied patch is the next upcoming unresolved mutation,
   * no rebase is needed, but we might have the wrong idea about the ordering of mutations, so in
   * that case we are given the flag `needRebase` to tell us that this mutation arrived out of
   * order in terms of our optimistic version, so a rebase is needed.
   *
   * @param txnId - Transaction ID of the remote mutation
   * @returns true if rebase is needed, false otherwise
   */
  consumeUnresolved(e) {
    if (this.submitted.length === 0 && this.pending.length === 0)
      return !1;
    if (this.submitted.length !== 0) {
      if (this.submitted[0].transactionId === e)
        return ct(
          "Remote mutation %s matches upcoming submitted mutation, consumed from 'submitted' buffer",
          e
        ), this.submitted.shift(), !1;
    } else if (this.pending.length > 0 && this.pending[0].transactionId === e)
      return ct(
        "Remote mutation %s matches upcoming pending mutation, consumed from 'pending' buffer",
        e
      ), this.pending.shift(), !1;
    return ct(
      "The mutation was not the upcoming mutation, scrubbing. Pending: %d, Submitted: %d",
      this.pending.length,
      this.submitted.length
    ), this.submitted = this.submitted.filter((n) => n.transactionId !== e), this.pending = this.pending.filter((n) => n.transactionId !== e), ct("After scrubbing: Pending: %d, Submitted: %d", this.pending.length, this.submitted.length), !0;
  }
  pendingSuccessfullySubmitted(e) {
    if (this.pending.length === 0)
      return;
    const n = this.pending[0];
    if (n.transactionId === e) {
      this.pending.shift(), this.submitted.push(n);
      return;
    }
    let s;
    const u = [];
    this.pending.forEach((a) => {
      if (a.transactionId === e) {
        s = a;
        return;
      }
      u.push(a);
    }), s && this.submitted.push(s), this.pending = u, this.rebase([]);
  }
  pendingFailed(e) {
    this.pending = this.pending.filter((n) => n.transactionId !== e), this.rebase([]);
  }
  rebase(e) {
    const n = this.EDGE;
    this.EDGE = un.applyAll(this.HEAD, this.submitted.concat(this.pending)), n !== null && this.EDGE !== null && (n._rev = this.EDGE._rev), !Xn.isEqual(this.EDGE, n) && this.onRebase && this.onRebase(this.EDGE, e, this.pending);
  }
}
class Ls {
  constructor(e) {
    /**
     * The document forming the basis of this squash
     */
    W(this, "BASIS");
    /**
     * The document after the out-Mutation has been applied, but before the staged
     * operations are committed.
     */
    W(this, "PRESTAGE");
    /**
     * setOperations contain the latest set operation by path. If the set-operations are
     * updating strings to new strings, they are rewritten as diffMatchPatch operations,
     * any new set operations on the same paths overwrites any older set operations.
     * Only set-operations assigning plain values to plain values gets optimized like this.
     */
    W(this, "setOperations");
    /**
     * `documentPresent` is true whenever we know that the document must be present due
     * to preceeding mutations. `false` implies that it may or may not already exist.
     */
    W(this, "documentPresent");
    /**
     * The operations in the out-Mutation are not able to be optimized any further
     */
    W(this, "out", []);
    /**
     * Staged mutation operations
     */
    W(this, "staged");
    e ? ct("Reset mutation buffer to rev %s", e._rev) : ct("Reset mutation buffer state to document being deleted"), this.staged = [], this.setOperations = {}, this.documentPresent = !1, this.BASIS = e, this.PRESTAGE = e;
  }
  add(e) {
    e.mutations.forEach((n) => this.addOperation(n));
  }
  hasChanges() {
    return this.out.length > 0 || Object.keys(this.setOperations).length > 0;
  }
  /**
   * Extracts the mutations in this buffer.
   * After this is done, the buffer lifecycle is over and the client should
   * create an new one with the new, updated BASIS.
   *
   * @param txnId - Transaction ID
   * @returns A `Mutation` instance if we had outgoing mutations pending, null otherwise
   */
  purge(e) {
    this.stashStagedOperations();
    let n = null;
    return this.out.length > 0 && (ct("Purged mutation buffer"), n = new un({
      mutations: this.out,
      resultRev: e,
      transactionId: e
    })), this.out = [], this.documentPresent = !1, n;
  }
  addOperation(e) {
    var n;
    if (e.patch && e.patch.set && "id" in e.patch && e.patch.id === ((n = this.PRESTAGE) == null ? void 0 : n._id) && Object.keys(e.patch).length === 2) {
      const s = e.patch.set, u = {};
      for (const a of Object.keys(s))
        s.hasOwnProperty(a) && (this.optimiseSetOperation(a, s[a]) || (u[a] = s[a]));
      Object.keys(u).length > 0 && (ct("Unoptimizable set-operation detected, purging optimization buffer"), this.staged.push({ patch: { id: this.PRESTAGE._id, set: u } }), this.stashStagedOperations());
      return;
    }
    if (e.createIfNotExists && this.PRESTAGE && e.createIfNotExists._id === this.PRESTAGE._id) {
      this.documentPresent || (this.staged.push(e), this.documentPresent = !0, this.stashStagedOperations());
      return;
    }
    ct("Unoptimizable mutation detected, purging optimization buffer"), this.staged.push(e), this.stashStagedOperations();
  }
  /**
     * Attempt to perform one single set operation in an optimised manner, return value
     * reflects whether or not the operation could be performed.
  
     * @param path - The JSONPath to the set operation in question
     * @param nextValue - The value to be set
     * @returns True of optimized, false otherwise
     */
  optimiseSetOperation(e, n) {
    if (typeof n == "object")
      return !1;
    const s = mC(e, this.PRESTAGE);
    if (s.length !== 1)
      return !1;
    const u = s[0];
    if (typeof u.value == "object" || !this.PRESTAGE)
      return !1;
    let a = null;
    if (u.value === n)
      a = null;
    else if (typeof u.value == "string" && typeof n == "string")
      try {
        const l = jC(qC(u.value, n));
        a = { patch: { id: this.PRESTAGE._id, diffMatchPatch: { [e]: l } } };
      } catch {
        return !1;
      }
    else
      a = { patch: { id: this.PRESTAGE._id, set: { [e]: n } } };
    const f = iC(u.path);
    return a ? this.setOperations[f] = a : delete this.setOperations[f], !0;
  }
  stashStagedOperations() {
    const e = [];
    Object.keys(this.setOperations).forEach((n) => {
      const s = this.setOperations[n];
      s && e.push(s);
    }), e.push(...this.staged), e.length > 0 && (this.PRESTAGE = new un({ mutations: e }).apply(this.PRESTAGE), this.staged = [], this.setOperations = {}), this.out.push(...e);
  }
  /**
   * Rebases given the new base-document
   *
   * @param newBasis - New base document to rebase on
   * @returns New "edge" document with buffered changes integrated
   */
  rebase(e) {
    return this.stashStagedOperations(), e === null ? (this.out = [], this.BASIS = e, this.PRESTAGE = e, this.documentPresent = !1) : (this.BASIS = e, this.out ? this.PRESTAGE = new un({ mutations: this.out }).apply(this.BASIS) : this.PRESTAGE = this.BASIS), this.PRESTAGE;
  }
}
const fE = 1e3 * 60;
class lE {
  constructor(e, { resolve: n, reject: s }) {
    W(this, "mutations");
    W(this, "tries");
    W(this, "resolve");
    W(this, "reject");
    this.mutations = e, this.tries = 0, this.resolve = n, this.reject = s;
  }
  apply(e) {
    return un.applyAll(e, this.mutations);
  }
  squash(e) {
    const n = un.squash(e, this.mutations);
    return n.assignRandomTransactionId(), n;
  }
}
const Sl = (r, e) => r.concat(e.mutations);
class hE {
  constructor(e) {
    W(this, "mutations");
    /**
     * The Document we are wrapping
     */
    W(this, "document");
    /**
     * The Document with local changes applied
     */
    W(this, "LOCAL");
    /**
     * Commits that are waiting to be delivered to the server
     */
    W(this, "commits");
    /**
     * Local mutations that are not scheduled to be committed yet
     */
    W(this, "buffer");
    /**
     * Assignable event handler for when the buffered document applies a mutation
     */
    W(this, "onMutation");
    /**
     * Assignable event handler for when a remote mutation happened
     */
    W(this, "onRemoteMutation");
    /**
     * Assignable event handler for when the buffered document rebased
     */
    W(this, "onRebase");
    /**
     * Assignable event handler for when the document is deleted
     */
    W(this, "onDelete");
    /**
     * Assignable event handler for when the state of consistency changed
     */
    W(this, "onConsistencyChanged");
    /**
     * Assignable event handler for when the buffered document should commit changes
     */
    W(this, "commitHandler");
    /**
     * Whether or not we are currently commiting
     */
    W(this, "committerRunning", !1);
    this.buffer = new Ls(e), this.document = new cE(e), this.document.onMutation = (n) => this.handleDocMutation(n), this.document.onRemoteMutation = (n) => this.onRemoteMutation && this.onRemoteMutation(n), this.document.onRebase = (n, s, u) => this.handleDocRebase(n, s, u), this.document.onConsistencyChanged = (n) => this.handleDocConsistencyChanged(n), this.LOCAL = e, this.mutations = [], this.commits = [];
  }
  // Used to reset the state of the local document model. If the model has been inconsistent
  // for too long, it has probably missed a notification, and should reload the document from the server
  reset(e) {
    e ? ct("Document state reset to revision %s", e._rev) : ct("Document state reset to being deleted"), this.document.reset(e), this.rebase([], []), this.handleDocConsistencyChanged(this.document.isConsistent());
  }
  // Add a change to the buffer
  add(e) {
    this.onConsistencyChanged && this.onConsistencyChanged(!1), ct("Staged local mutation"), this.buffer.add(e);
    const n = this.LOCAL;
    this.LOCAL = e.apply(this.LOCAL), this.onMutation && n !== this.LOCAL && (ct("onMutation fired"), this.onMutation({
      mutation: e,
      document: this.LOCAL,
      remote: !1
    }), this.LOCAL === null && this.onDelete && this.onDelete(this.LOCAL));
  }
  // Call when a mutation arrives from Sanity
  arrive(e) {
    if (ct("Remote mutation arrived %s -> %s", e.previousRev, e.resultRev), e.previousRev === e.resultRev)
      throw new Error(
        `Mutation ${e.transactionId} has previousRev === resultRev (${e.previousRev})`
      );
    return this.document.arrive(e);
  }
  // Submit all mutations in the buffer to be committed
  commit() {
    return new Promise((e, n) => {
      if (!this.buffer.hasChanges()) {
        e();
        return;
      }
      ct("Committing local changes");
      const s = this.buffer.purge();
      this.commits.push(new lE(s ? [s] : [], { resolve: e, reject: n })), this.buffer = new Ls(this.LOCAL), this.performCommits();
    });
  }
  // Starts the committer that will try to committ all staged commits to the database
  // by calling the commitHandler. Will keep running until all commits are successfully
  // committed.
  performCommits() {
    if (!this.commitHandler)
      throw new Error("No commitHandler configured for this BufferedDocument");
    this.committerRunning || this._cycleCommitter();
  }
  // TODO: Error handling, right now retries after every error
  _cycleCommitter() {
    const e = this.commits.shift();
    if (!e) {
      this.committerRunning = !1;
      return;
    }
    this.committerRunning = !0;
    const n = e.squash(this.LOCAL), s = this.document.stage(n, !0), u = {
      success: () => {
        ct("Commit succeeded"), s.success(), e.resolve(), this._cycleCommitter();
      },
      failure: () => {
        ct("Commit failed"), e.tries += 1, this.LOCAL !== null && this.commits.unshift(e), s.failure(), e.tries < 200 && setTimeout(() => this._cycleCommitter(), Math.min(e.tries * 1e3, fE));
      },
      cancel: (a) => {
        this.commits.forEach((f) => f.reject(a)), this.commits = [], this.reset(this.document.HEAD), this.buffer = new Ls(this.LOCAL), this.committerRunning = !1;
      }
    };
    ct("Posting commit"), this.commitHandler && this.commitHandler({
      mutation: n,
      success: u.success,
      failure: u.failure,
      cancel: u.cancel
    });
  }
  handleDocRebase(e, n, s) {
    this.rebase(n, s);
  }
  handleDocumentDeleted() {
    ct("Document deleted"), this.LOCAL !== null && this.onDelete && this.onDelete(this.LOCAL), this.commits = [], this.mutations = [];
  }
  handleDocMutation(e) {
    if (this.commits.length === 0 && !this.buffer.hasChanges()) {
      ct("Document mutated from remote with no local changes"), this.LOCAL = this.document.EDGE, this.buffer = new Ls(this.LOCAL), this.onMutation && this.onMutation(e);
      return;
    }
    ct("Document mutated from remote with local changes"), this.document.EDGE === null && this.handleDocumentDeleted(), this.rebase([e.mutation], []);
  }
  rebase(e, n) {
    ct("Rebasing document"), this.document.EDGE === null && this.handleDocumentDeleted();
    const s = this.LOCAL;
    this.LOCAL = this.commits.reduce((a, f) => f.apply(a), this.document.EDGE), this.LOCAL = this.buffer.rebase(this.LOCAL), s !== null && this.LOCAL !== null && (s._rev = this.LOCAL._rev), !Xn.isEqual(this.LOCAL, s) && this.onRebase && this.onRebase(
      this.LOCAL,
      e.reduce(Sl, []),
      n.reduce(Sl, [])
    );
  }
  handleDocConsistencyChanged(e) {
    if (!this.onConsistencyChanged)
      return;
    const n = this.commits.length > 0 || this.buffer.hasChanges();
    e && !n && this.onConsistencyChanged(!0), e || this.onConsistencyChanged(!1);
  }
}
const Rl = (r) => {
  const e = r.LOCAL, n = r.document.HEAD;
  return e && {
    ...e,
    _type: (n || e)._type,
    _rev: (n || e)._rev,
    _updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}, Il = (r) => ({ type: "snapshot", document: r }), Ol = (r) => r.document, dE = (r) => {
  const e = new Je(), n = new Gw(!0), s = new Je(), u = new Je(), a = new Je(), f = new Je(), l = (x) => {
    const D = new hE(x);
    return D.onMutation = ({ mutation: U, remote: M }) => {
      s.next({
        type: "mutation",
        document: Rl(D),
        mutations: U.mutations,
        origin: M ? "remote" : "local"
      });
    }, D.onRemoteMutation = (U) => {
      a.next({
        type: "remoteMutation",
        head: D.document.HEAD,
        transactionId: U.transactionId,
        timestamp: U.timestamp,
        author: U.identity,
        effects: U.effects
      });
    }, D.onRebase = (U, M, z) => {
      u.next({
        type: "rebase",
        document: U,
        remoteMutations: M,
        localMutations: z
      });
    }, D.onConsistencyChanged = (U) => {
      n.next(U);
    }, D.commitHandler = (U) => f.next(U), D;
  }, d = r.pipe(
    yh((x, D) => D.type === "snapshot" ? (x && x.commit(), l(D.document || null)) : x === null ? (console.warn(
      'Ignoring event of type "%s" since buffered document has not yet been set up with snapshot',
      D.type
    ), null) : x, null),
    Xe(
      (x) => x !== null
    ),
    nl(),
    Ss(1),
    mi()
  ), y = r.pipe(
    Xe((x) => x.type === "mutation"),
    rl(d),
    Lt(([x, D]) => (D.arrive(new un(x)), Rl(D)))
  ), p = e.pipe(
    rl(d),
    Zu(([x, D]) => {
      x.type === "mutation" && D.add(new un({ mutations: x.mutations })), x.type === "commit" && D.commit();
    }),
    // We subscribe to this only for the side effects
    Eb(po),
    Vu()
  ), m = (x) => e.next(x), b = (x) => m({ type: "mutation", mutations: x }), C = (x) => b([x]), I = () => {
    d.pipe(
      mh(1),
      Zu((x) => x.commit())
    ).subscribe();
  }, O = Hr(
    d.pipe(Lt((x) => x.LOCAL)),
    s.pipe(Lt(Ol)),
    u.pipe(Lt(Ol)),
    y
  ).pipe(Lt(Il), Ss(1), mi()), R = Hr(
    d.pipe(
      Lt((x) => x.document.HEAD),
      Lt(Il)
    ),
    a
  ).pipe(Ss(1), mi());
  return {
    updates$: Hr(O, p, s, u),
    consistency$: n.pipe(nl(), Ss(1), mi()),
    remoteSnapshot$: R,
    commitRequest$: f,
    addMutation: C,
    addMutations: b,
    commit: I
  };
}, pE = (r) => (e) => {
  const { _id: n, _rev: s, _updatedAt: u, ...a } = e;
  return { _id: r, ...a };
}, Tl = (r, e) => {
  const n = dE(e), s = pE(r), u = { delete: { id: r } };
  return {
    events: n.updates$,
    consistency$: n.consistency$,
    remoteSnapshot$: n.remoteSnapshot$,
    commitRequest$: n.commitRequest$,
    // @TODO make these easier to access? Worker related
    patch: (a) => a.map((f) => ({ patch: { ...f, id: r } })),
    create: (a) => ({ create: s(a) }),
    createIfNotExists: (a) => ({ createIfNotExists: s(a) }),
    createOrReplace: (a) => ({ createOrReplace: s(a) }),
    delete: () => u,
    mutate: (a) => n.addMutations(a),
    commit: () => n.commit()
  };
}, gE = { type: "pending", phase: "begin" }, vE = { type: "pending", phase: "end" };
function mE(r) {
  return r.type === "mutation";
}
function yE(r) {
  return r.transactionTotalEvents > 1;
}
function wE(r) {
  const e = Xn.groupBy(
    r.filter((n) => n.type === "mutation"),
    (n) => n.transactionId
  );
  return Object.values(e).every(
    (n) => n.length === n[0].transactionTotalEvents
  );
}
function bE(r, e, n = {}) {
  const { publishedId: s, draftId: u } = e;
  return pb(
    () => r.observable.listen(
      "*[_id == $publishedId || _id == $draftId]",
      {
        publishedId: s,
        draftId: u
      },
      {
        includeResult: !1,
        events: ["welcome", "mutation", "reconnect"],
        effectFormat: "mendoza",
        tag: n.tag || "document.pair-listener"
      }
    )
  ).pipe(
    el(
      (f) => f.type === "welcome" ? a().pipe(
        el((l) => [
          Ll(u, l.draft),
          Ll(s, l.published)
        ])
      ) : gh(f)
    ),
    yh(
      (f, l) => {
        if (!mE(l))
          return { next: [l], buffer: [] };
        const d = f.buffer.length > 0, y = yE(l);
        if (!y && !d)
          return { next: [l], buffer: [] };
        if (!y)
          return { next: [], buffer: f.buffer.concat(l) };
        const p = f.buffer.concat(l);
        return wE(p) ? { next: p.concat(vE), buffer: [] } : { next: p.length === 1 ? [gE] : [], buffer: p };
      },
      { next: [], buffer: [] }
    ),
    // note: this flattens the array, and in the case of an empty array, no event will be pushed downstream
    on((f) => f.next)
  );
  function a() {
    return r.observable.getDocuments([u, s], { tag: "document.snapshots" }).pipe(
      Lt(([f, l]) => ({
        draft: f,
        published: l
      }))
    );
  }
}
function Ll(r, e) {
  return {
    type: "snapshot",
    documentId: r,
    document: e
  };
}
const $l = (r) => (e) => e.type !== "reconnect" && e.type !== "pending" && e.documentId === r;
function $s(r) {
  return (e) => ({ ...e, version: r });
}
function _E(r) {
  if (!r._id)
    throw new Error("Expected document to have an _id");
}
function CE(r, e) {
  const { resultRev: n, ...s } = r;
  return s.mutations.flatMap((a) => {
    const f = Object.values(a);
    if (f.length > 1)
      throw new Error("Did not expect multiple mutations in the same payload");
    return f[0].id || f[0]._id;
  }).every((a) => a === e);
}
function EE(r, e) {
  return e.mutations.flatMap((n) => {
    if (n.createIfNotExists)
      return [];
    if (n.create)
      return _E(n.create), {
        actionType: "sanity.action.document.create",
        publishedId: r.publishedId,
        attributes: n.create,
        ifExists: "fail"
      };
    if (n.patch)
      return {
        actionType: "sanity.action.document.edit",
        draftId: r.draftId,
        publishedId: r.publishedId,
        patch: Xn.omit(n.patch, "id")
      };
    throw new Error("Cannot map mutation to action");
  });
}
function AE(r, e, n) {
  return CE(n, e.publishedId) ? Cd(r, n) : r.observable.action(EE(e, n), {
    tag: "document.commit",
    transactionId: n.transactionId
  });
}
function Cd(r, e) {
  const { resultRev: n, ...s } = e;
  return r.dataRequest("mutate", s, {
    visibility: "async",
    returnDocuments: !1,
    tag: "document.commit",
    // This makes sure the studio doesn't crash when a draft is crated
    // because someone deleted a referenced document in the target dataset
    skipCrossDatasetReferenceValidation: !0
  });
}
function xE(r, e, n, s) {
  return Ii(
    s ? AE(r, e, n.mutation.params) : Cd(r, n.mutation.params)
  ).pipe(
    Zu({
      error: (u) => {
        "statusCode" in u && typeof u.statusCode == "number" && u.statusCode >= 400 && u.statusCode <= 500 ? n.cancel(u) : n.failure(u);
      },
      next: () => n.success()
    })
  );
}
function SE(r, e, n) {
  const { publishedId: s, draftId: u } = e, a = new Je(), f = bE(r, e).pipe(
    // @TODO figure out how to schedule updates the same way react does for input change: scheduleCallback(NormalPriority, () => schedule)
    // observeOn(asapScheduler, 10000),
    Vu({ connector: () => a })
  ), l = f.pipe(
    Xe((b) => b.type === "reconnect")
  ), d = Tl(
    u,
    f.pipe(Xe($l(u)))
  ), y = Tl(
    s,
    f.pipe(Xe($l(s)))
  ), p = f.pipe(
    Xe((b) => b.type === "pending")
  ), m = Hr(d.commitRequest$, y.commitRequest$).pipe(
    on(
      (b) => n.pipe(
        mh(1),
        on(
          (C) => xE(r, e, b, C)
        )
      )
    ),
    on(() => po),
    Vu()
  );
  return {
    transactionsPendingEvents$: p,
    draft: {
      ...d,
      events: Hr(m, l, d.events).pipe(Lt($s("draft"))),
      consistency$: d.consistency$,
      remoteSnapshot$: d.remoteSnapshot$.pipe(Lt($s("draft")))
    },
    published: {
      ...y,
      events: Hr(m, l, y.events).pipe(Lt($s("published"))),
      consistency$: y.consistency$,
      remoteSnapshot$: y.remoteSnapshot$.pipe(Lt($s("published")))
    },
    complete: () => a.complete()
  };
}
let jt = null;
self.addEventListener("message", (r) => {
  if (RE(r.data))
    if (r.data.type === "construct") {
      jt && (jt.complete(), jt = null);
      const { clientConfig: e, idPair: n, serverActionsEnabled: s } = r.data, u = V_(e);
      jt = SE(u, n, gh(s));
      const { complete: a } = jt, f = [];
      f.push(
        jt.transactionsPendingEvents$.subscribe((l) => {
          ar({ type: "transactionsPendingEvents$", payload: l });
        }),
        jt.draft.consistency$.subscribe((l) => {
          ar({ type: "draft.consistency$", payload: l });
        }),
        jt.draft.events.subscribe((l) => {
          ar({ type: "draft.events", payload: l });
        }),
        jt.draft.remoteSnapshot$.subscribe((l) => {
          ar({ type: "draft.remoteSnapshot$", payload: l });
        }),
        jt.published.consistency$.subscribe((l) => {
          ar({ type: "published.consistency$", payload: l });
        }),
        jt.published.events.subscribe((l) => {
          ar({ type: "published.events", payload: l });
        }),
        jt.published.remoteSnapshot$.subscribe((l) => {
          ar({ type: "published.remoteSnapshot$", payload: l });
        })
      ), jt.complete = () => {
        for (const l of f)
          l.unsubscribe();
        f.length = 0, a();
      };
    } else if (jt)
      switch (r.data.type) {
        case "draft.commit":
          jt.draft.commit();
          break;
        case "draft.mutate":
          jt.draft.mutate(r.data.payload);
          break;
        case "published.commit":
          jt.published.commit();
          break;
        case "published.mutate":
          jt.published.mutate(r.data.payload);
          break;
        default:
          throw new TypeError(`Unknown event type: ${r.data.type}`, { cause: r });
      }
    else
      throw new Error("Received message before instance was constructed", { cause: r });
});
function ar(r) {
  self.postMessage(r);
}
function RE(r) {
  return typeof r == "object" && r && "type" in r && typeof r.type == "string";
}
const Ed = /_key\s*==\s*['"](.*)['"]/;
function IE(r) {
  return typeof r == "string" ? Ed.test(r.trim()) : typeof r == "object" && "_key" in r;
}
function Ad(r) {
  if (!Array.isArray(r))
    throw new Error("Path is not an array");
  return r.reduce((e, n, s) => {
    const u = typeof n;
    if (u === "number")
      return `${e}[${n}]`;
    if (u === "string")
      return `${e}${s === 0 ? "" : "."}${n}`;
    if (IE(n) && n._key)
      return `${e}[_key=="${n._key}"]`;
    if (Array.isArray(n)) {
      const [a, f] = n;
      return `${e}[${a}:${f}]`;
    }
    throw new Error(`Unsupported path segment \`${JSON.stringify(n)}\``);
  }, "");
}
const Pl = {
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "'": "\\'",
  "\\": "\\\\"
}, Fl = {
  "\\f": "\f",
  "\\n": `
`,
  "\\r": "\r",
  "\\t": "	",
  "\\'": "'",
  "\\\\": "\\"
};
function OE(r) {
  return `$${r.map((e) => typeof e == "string" ? `['${e.replace(/[\f\n\r\t'\\]/g, (n) => Pl[n])}']` : typeof e == "number" ? `[${e}]` : e._key !== "" ? `[?(@._key=='${e._key.replace(/['\\]/g, (n) => Pl[n])}')]` : `[${e._index}]`).join("")}`;
}
function Ml(r) {
  const e = [], n = /\['(.*?)'\]|\[(\d+)\]|\[\?\(@\._key=='(.*?)'\)\]/g;
  let s;
  for (; (s = n.exec(r)) !== null; ) {
    if (s[1] !== void 0) {
      const u = s[1].replace(/\\(\\|f|n|r|t|')/g, (a) => Fl[a]);
      e.push(u);
      continue;
    }
    if (s[2] !== void 0) {
      e.push(parseInt(s[2], 10));
      continue;
    }
    if (s[3] !== void 0) {
      const u = s[3].replace(/\\(\\')/g, (a) => Fl[a]);
      e.push({
        _key: u,
        _index: -1
      });
      continue;
    }
  }
  return e;
}
function xd(r) {
  return r.map((e) => {
    if (typeof e == "string" || typeof e == "number")
      return e;
    if (e._key !== "")
      return { _key: e._key };
    if (e._index !== -1)
      return e._index;
    throw new Error(`invalid segment:${JSON.stringify(e)}`);
  });
}
function TE(r) {
  return r.map((e) => {
    if (typeof e == "string" || typeof e == "number")
      return e;
    if (e._index !== -1)
      return e._index;
    throw new Error(`invalid segment:${JSON.stringify(e)}`);
  });
}
function LE(r, e) {
  if (!(e != null && e.mappings))
    return;
  const n = OE(TE(r));
  if (e.mappings[n] !== void 0)
    return {
      mapping: e.mappings[n],
      matchedPath: n,
      pathSuffix: ""
    };
  const s = Object.entries(e.mappings).filter(([l]) => n.startsWith(l)).sort(([l], [d]) => d.length - l.length);
  if (s.length == 0)
    return;
  const [u, a] = s[0], f = n.substring(u.length);
  return { mapping: a, matchedPath: u, pathSuffix: f };
}
function $E(r) {
  return r !== null && Array.isArray(r);
}
function Dl(r) {
  return typeof r == "object" && r !== null;
}
function Xs(r, e, n = []) {
  return $E(r) ? r.map((s, u) => {
    if (Dl(s)) {
      const a = s._key;
      if (typeof a == "string")
        return Xs(s, e, n.concat({ _key: a, _index: u }));
    }
    return Xs(s, e, n.concat(u));
  }) : Dl(r) ? Object.fromEntries(
    Object.entries(r).map(([s, u]) => [s, Xs(u, e, n.concat(s))])
  ) : e(r, n);
}
function Sd(r, e, n) {
  return Xs(r, (s, u) => {
    if (typeof s != "string")
      return s;
    const a = LE(u, e);
    if (!a)
      return s;
    const { mapping: f, matchedPath: l } = a;
    if (f.type !== "value" || f.source.type !== "documentValue")
      return s;
    const d = e.documents[f.source.document], y = e.paths[f.source.path], p = Ml(l), m = Ml(y).concat(u.slice(p.length));
    return n({
      sourcePath: m,
      sourceDocument: d,
      resultPath: u,
      value: s
    });
  });
}
const ia = "drafts.";
function PE(r) {
  return r.startsWith(ia) ? r.slice(ia.length) : r;
}
function FE(r) {
  const {
    baseUrl: e,
    workspace: n = "default",
    tool: s = "default",
    id: u,
    type: a,
    path: f,
    projectId: l,
    dataset: d
  } = r;
  if (!e)
    throw new Error("baseUrl is required");
  if (!f)
    throw new Error("path is required");
  if (!u)
    throw new Error("id is required");
  if (e !== "/" && e.endsWith("/"))
    throw new Error("baseUrl must not end with a slash");
  const y = n === "default" ? void 0 : n, p = s === "default" ? void 0 : s, m = PE(u), b = Array.isArray(f) ? Ad(xd(f)) : f, C = new URLSearchParams({
    baseUrl: e,
    id: m,
    type: a,
    path: b
  });
  y && C.set("workspace", y), p && C.set("tool", p), l && C.set("projectId", l), d && C.set("dataset", d), u.startsWith(ia) && C.set("isDraft", "");
  const I = [e === "/" ? "" : e];
  y && I.push(y);
  const O = [
    "mode=presentation",
    `id=${m}`,
    `type=${a}`,
    `path=${encodeURIComponent(b)}`
  ];
  return p && O.push(`tool=${p}`), I.push("intent", "edit", `${O.join(";")}?${C}`), I.join("/");
}
function ME(r) {
  let e = typeof r == "string" ? r : r.baseUrl;
  return e !== "/" && (e = e.replace(/\/$/, "")), typeof r == "string" ? { baseUrl: e } : { ...r, baseUrl: e };
}
const Gu = ({ sourcePath: r, resultPath: e, value: n }) => {
  if (UE(n) || kE(n))
    return !1;
  const s = r.at(-1);
  return !(r.at(-2) === "slug" && s === "current" || typeof s == "string" && s.startsWith("_") || typeof s == "number" && r.at(-2) === "marks" || s === "href" && typeof r.at(-2) == "number" && r.at(-3) === "markDefs" || s === "style" || s === "listItem" || r.some(
    (u) => u === "meta" || u === "metadata" || u === "openGraph" || u === "seo"
  ) || Ul(r) || Ul(e) || typeof s == "string" && DE.has(s));
}, DE = /* @__PURE__ */ new Set([
  "color",
  "colour",
  "currency",
  "email",
  "format",
  "gid",
  "hex",
  "href",
  "hsl",
  "hsla",
  "icon",
  "id",
  "index",
  "key",
  "language",
  "layout",
  "link",
  "linkAction",
  "locale",
  "lqip",
  "page",
  "path",
  "ref",
  "rgb",
  "rgba",
  "route",
  "secret",
  "slug",
  "status",
  "tag",
  "template",
  "theme",
  "type",
  "unit",
  "url",
  "username",
  "variant",
  "website"
]);
function UE(r) {
  return /^\d{4}-\d{2}-\d{2}/.test(r) ? !!Date.parse(r) : !1;
}
function kE(r) {
  try {
    new URL(r, r.startsWith("/") ? "https://acme.com" : void 0);
  } catch {
    return !1;
  }
  return !0;
}
function Ul(r) {
  return r.some((e) => typeof e == "string" && e.match(/type/i) !== null);
}
const Ps = 20;
function Rd(r, e, n) {
  var s, u, a, f, l, d, y, p, m;
  const { filter: b, logger: C, enabled: I } = n;
  if (!I) {
    const x = "config.enabled must be true, don't call this function otherwise";
    throw (s = C == null ? void 0 : C.error) == null || s.call(C, `[@sanity/client]: ${x}`, { result: r, resultSourceMap: e, config: n }), new TypeError(x);
  }
  if (!e)
    return (u = C == null ? void 0 : C.error) == null || u.call(C, "[@sanity/client]: Missing Content Source Map from response body", {
      result: r,
      resultSourceMap: e,
      config: n
    }), r;
  if (!n.studioUrl) {
    const x = "config.studioUrl must be defined";
    throw (a = C == null ? void 0 : C.error) == null || a.call(C, `[@sanity/client]: ${x}`, { result: r, resultSourceMap: e, config: n }), new TypeError(x);
  }
  const O = {
    encoded: [],
    skipped: []
  }, R = Sd(
    r,
    e,
    ({ sourcePath: x, sourceDocument: D, resultPath: U, value: M }) => {
      if ((typeof b == "function" ? b({ sourcePath: x, resultPath: U, filterDefault: Gu, sourceDocument: D, value: M }) : Gu({ sourcePath: x, resultPath: U, filterDefault: Gu, sourceDocument: D, value: M })) === !1)
        return C && O.skipped.push({
          path: kl(x),
          value: `${M.slice(0, Ps)}${M.length > Ps ? "..." : ""}`,
          length: M.length
        }), M;
      C && O.encoded.push({
        path: kl(x),
        value: `${M.slice(0, Ps)}${M.length > Ps ? "..." : ""}`,
        length: M.length
      });
      const { baseUrl: z, workspace: ht, tool: _t } = ME(
        typeof n.studioUrl == "function" ? n.studioUrl(D) : n.studioUrl
      );
      if (!z)
        return M;
      const { _id: xt, _type: Te, _projectId: qe, _dataset: an } = D;
      return Ob(
        M,
        {
          origin: "sanity.io",
          href: FE({
            baseUrl: z,
            workspace: ht,
            tool: _t,
            id: xt,
            type: Te,
            path: x,
            ...!n.omitCrossDatasetReferenceData && { dataset: an, projectId: qe }
          })
        },
        // We use custom logic to determine if we should skip encoding
        !1
      );
    }
  );
  if (C) {
    const x = O.skipped.length, D = O.encoded.length;
    if ((x || D) && ((f = (C == null ? void 0 : C.groupCollapsed) || C.log) == null || f("[@sanity/client]: Encoding source map into result"), (l = C.log) == null || l.call(
      C,
      `[@sanity/client]: Paths encoded: ${O.encoded.length}, skipped: ${O.skipped.length}`
    )), O.encoded.length > 0 && ((d = C == null ? void 0 : C.log) == null || d.call(C, "[@sanity/client]: Table of encoded paths"), (y = (C == null ? void 0 : C.table) || C.log) == null || y(O.encoded)), O.skipped.length > 0) {
      const U = /* @__PURE__ */ new Set();
      for (const { path: M } of O.skipped)
        U.add(M.replace(Ed, "0").replace(/\[\d+\]/g, "[]"));
      (p = C == null ? void 0 : C.log) == null || p.call(C, "[@sanity/client]: List of skipped paths", [...U.values()]);
    }
    (x || D) && ((m = C == null ? void 0 : C.groupEnd) == null || m.call(C));
  }
  return R;
}
function kl(r) {
  return Ad(xd(r));
}
var NE = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  stegaEncodeSourceMap: Rd
});
const qE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  encodeIntoResult: Sd,
  stegaEncodeSourceMap: Rd,
  stegaEncodeSourceMap$1: NE
}, Symbol.toStringTag, { value: "Module" }));
var sa = { exports: {} };
/** @license
 * eventsource.js
 * Available under MIT License (MIT)
 * https://github.com/Yaffle/EventSource/
 */
(function(r, e) {
  (function(n) {
    var s = n.setTimeout, u = n.clearTimeout, a = n.XMLHttpRequest, f = n.XDomainRequest, l = n.ActiveXObject, d = n.EventSource, y = n.document, p = n.Promise, m = n.fetch, b = n.Response, C = n.TextDecoder, I = n.TextEncoder, O = n.AbortController;
    if (typeof window < "u" && typeof y < "u" && !("readyState" in y) && y.body == null && (y.readyState = "loading", addEventListener("load", function(L) {
      y.readyState = "complete";
    }, !1)), a == null && l != null && (a = function() {
      return new l("Microsoft.XMLHTTP");
    }), Object.create == null && (Object.create = function(L) {
      function k() {
      }
      return k.prototype = L, new k();
    }), Date.now || (Date.now = function() {
      return (/* @__PURE__ */ new Date()).getTime();
    }), O == null) {
      var R = m;
      m = function(L, k) {
        var H = k.signal;
        return R(L, { headers: k.headers, credentials: k.credentials, cache: k.cache }).then(function(N) {
          var Y = N.body.getReader();
          return H._reader = Y, H._aborted && H._reader.cancel(), {
            status: N.status,
            statusText: N.statusText,
            headers: N.headers,
            body: {
              getReader: function() {
                return Y;
              }
            }
          };
        });
      }, O = function() {
        this.signal = {
          _reader: null,
          _aborted: !1
        }, this.abort = function() {
          this.signal._reader != null && this.signal._reader.cancel(), this.signal._aborted = !0;
        };
      };
    }
    function x() {
      this.bitsNeeded = 0, this.codePoint = 0;
    }
    x.prototype.decode = function(L) {
      function k(ft, yt, V) {
        if (V === 1)
          return ft >= 128 >> yt && ft << yt <= 2047;
        if (V === 2)
          return ft >= 2048 >> yt && ft << yt <= 55295 || ft >= 57344 >> yt && ft << yt <= 65535;
        if (V === 3)
          return ft >= 65536 >> yt && ft << yt <= 1114111;
        throw new Error();
      }
      function H(ft, yt) {
        if (ft === 6 * 1)
          return yt >> 6 > 15 ? 3 : yt > 31 ? 2 : 1;
        if (ft === 6 * 2)
          return yt > 15 ? 3 : 2;
        if (ft === 6 * 3)
          return 3;
        throw new Error();
      }
      for (var N = 65533, Y = "", G = this.bitsNeeded, Q = this.codePoint, mt = 0; mt < L.length; mt += 1) {
        var ut = L[mt];
        G !== 0 && (ut < 128 || ut > 191 || !k(Q << 6 | ut & 63, G - 6, H(G, Q))) && (G = 0, Q = N, Y += String.fromCharCode(Q)), G === 0 ? (ut >= 0 && ut <= 127 ? (G = 0, Q = ut) : ut >= 192 && ut <= 223 ? (G = 6 * 1, Q = ut & 31) : ut >= 224 && ut <= 239 ? (G = 6 * 2, Q = ut & 15) : ut >= 240 && ut <= 247 ? (G = 6 * 3, Q = ut & 7) : (G = 0, Q = N), G !== 0 && !k(Q, G, H(G, Q)) && (G = 0, Q = N)) : (G -= 6, Q = Q << 6 | ut & 63), G === 0 && (Q <= 65535 ? Y += String.fromCharCode(Q) : (Y += String.fromCharCode(55296 + (Q - 65535 - 1 >> 10)), Y += String.fromCharCode(56320 + (Q - 65535 - 1 & 1023))));
      }
      return this.bitsNeeded = G, this.codePoint = Q, Y;
    };
    var D = function() {
      try {
        return new C().decode(new I().encode("test"), { stream: !0 }) === "test";
      } catch (L) {
        console.debug("TextDecoder does not support streaming option. Using polyfill instead: " + L);
      }
      return !1;
    };
    (C == null || I == null || !D()) && (C = x);
    var U = function() {
    };
    function M(L) {
      this.withCredentials = !1, this.readyState = 0, this.status = 0, this.statusText = "", this.responseText = "", this.onprogress = U, this.onload = U, this.onerror = U, this.onreadystatechange = U, this._contentType = "", this._xhr = L, this._sendTimeout = 0, this._abort = U;
    }
    M.prototype.open = function(L, k) {
      this._abort(!0);
      var H = this, N = this._xhr, Y = 1, G = 0;
      this._abort = function(V) {
        H._sendTimeout !== 0 && (u(H._sendTimeout), H._sendTimeout = 0), (Y === 1 || Y === 2 || Y === 3) && (Y = 4, N.onload = U, N.onerror = U, N.onabort = U, N.onprogress = U, N.onreadystatechange = U, N.abort(), G !== 0 && (u(G), G = 0), V || (H.readyState = 4, H.onabort(null), H.onreadystatechange())), Y = 0;
      };
      var Q = function() {
        if (Y === 1) {
          var V = 0, pt = "", we = void 0;
          if ("contentType" in N)
            V = 200, pt = "OK", we = N.contentType;
          else
            try {
              V = N.status, pt = N.statusText, we = N.getResponseHeader("Content-Type");
            } catch {
              V = 0, pt = "", we = void 0;
            }
          V !== 0 && (Y = 2, H.readyState = 2, H.status = V, H.statusText = pt, H._contentType = we, H.onreadystatechange());
        }
      }, mt = function() {
        if (Q(), Y === 2 || Y === 3) {
          Y = 3;
          var V = "";
          try {
            V = N.responseText;
          } catch {
          }
          H.readyState = 3, H.responseText = V, H.onprogress();
        }
      }, ut = function(V, pt) {
        if ((pt == null || pt.preventDefault == null) && (pt = {
          preventDefault: U
        }), mt(), Y === 1 || Y === 2 || Y === 3) {
          if (Y = 4, G !== 0 && (u(G), G = 0), H.readyState = 4, V === "load")
            H.onload(pt);
          else if (V === "error")
            H.onerror(pt);
          else if (V === "abort")
            H.onabort(pt);
          else
            throw new TypeError();
          H.onreadystatechange();
        }
      }, ft = function(V) {
        N != null && (N.readyState === 4 ? (!("onload" in N) || !("onerror" in N) || !("onabort" in N)) && ut(N.responseText === "" ? "error" : "load", V) : N.readyState === 3 ? "onprogress" in N || mt() : N.readyState === 2 && Q());
      }, yt = function() {
        G = s(function() {
          yt();
        }, 500), N.readyState === 3 && mt();
      };
      "onload" in N && (N.onload = function(V) {
        ut("load", V);
      }), "onerror" in N && (N.onerror = function(V) {
        ut("error", V);
      }), "onabort" in N && (N.onabort = function(V) {
        ut("abort", V);
      }), "onprogress" in N && (N.onprogress = mt), "onreadystatechange" in N && (N.onreadystatechange = function(V) {
        ft(V);
      }), ("contentType" in N || !("ontimeout" in a.prototype)) && (k += (k.indexOf("?") === -1 ? "?" : "&") + "padding=true"), N.open(L, k, !0), "readyState" in N && (G = s(function() {
        yt();
      }, 0));
    }, M.prototype.abort = function() {
      this._abort(!1);
    }, M.prototype.getResponseHeader = function(L) {
      return this._contentType;
    }, M.prototype.setRequestHeader = function(L, k) {
      var H = this._xhr;
      "setRequestHeader" in H && H.setRequestHeader(L, k);
    }, M.prototype.getAllResponseHeaders = function() {
      return this._xhr.getAllResponseHeaders != null && this._xhr.getAllResponseHeaders() || "";
    }, M.prototype.send = function() {
      if ((!("ontimeout" in a.prototype) || !("sendAsBinary" in a.prototype) && !("mozAnon" in a.prototype)) && y != null && y.readyState != null && y.readyState !== "complete") {
        var L = this;
        L._sendTimeout = s(function() {
          L._sendTimeout = 0, L.send();
        }, 4);
        return;
      }
      var k = this._xhr;
      "withCredentials" in k && (k.withCredentials = this.withCredentials);
      try {
        k.send(void 0);
      } catch (H) {
        throw H;
      }
    };
    function z(L) {
      return L.replace(/[A-Z]/g, function(k) {
        return String.fromCharCode(k.charCodeAt(0) + 32);
      });
    }
    function ht(L) {
      for (var k = /* @__PURE__ */ Object.create(null), H = L.split(`\r
`), N = 0; N < H.length; N += 1) {
        var Y = H[N], G = Y.split(": "), Q = G.shift(), mt = G.join(": ");
        k[z(Q)] = mt;
      }
      this._map = k;
    }
    ht.prototype.get = function(L) {
      return this._map[z(L)];
    }, a != null && a.HEADERS_RECEIVED == null && (a.HEADERS_RECEIVED = 2);
    function _t() {
    }
    _t.prototype.open = function(L, k, H, N, Y, G, Q) {
      L.open("GET", Y);
      var mt = 0;
      L.onprogress = function() {
        var ft = L.responseText, yt = ft.slice(mt);
        mt += yt.length, H(yt);
      }, L.onerror = function(ft) {
        ft.preventDefault(), N(new Error("NetworkError"));
      }, L.onload = function() {
        N(null);
      }, L.onabort = function() {
        N(null);
      }, L.onreadystatechange = function() {
        if (L.readyState === a.HEADERS_RECEIVED) {
          var ft = L.status, yt = L.statusText, V = L.getResponseHeader("Content-Type"), pt = L.getAllResponseHeaders();
          k(ft, yt, V, new ht(pt));
        }
      }, L.withCredentials = G;
      for (var ut in Q)
        Object.prototype.hasOwnProperty.call(Q, ut) && L.setRequestHeader(ut, Q[ut]);
      return L.send(), L;
    };
    function xt(L) {
      this._headers = L;
    }
    xt.prototype.get = function(L) {
      return this._headers.get(L);
    };
    function Te() {
    }
    Te.prototype.open = function(L, k, H, N, Y, G, Q) {
      var mt = null, ut = new O(), ft = ut.signal, yt = new C();
      return m(Y, {
        headers: Q,
        credentials: G ? "include" : "same-origin",
        signal: ft,
        cache: "no-store"
      }).then(function(V) {
        return mt = V.body.getReader(), k(V.status, V.statusText, V.headers.get("Content-Type"), new xt(V.headers)), new p(function(pt, we) {
          var ln = function() {
            mt.read().then(function(Kt) {
              if (Kt.done)
                pt(void 0);
              else {
                var Nt = yt.decode(Kt.value, { stream: !0 });
                H(Nt), ln();
              }
            }).catch(function(Kt) {
              we(Kt);
            });
          };
          ln();
        });
      }).catch(function(V) {
        if (V.name !== "AbortError")
          return V;
      }).then(function(V) {
        N(V);
      }), {
        abort: function() {
          mt != null && mt.cancel(), ut.abort();
        }
      };
    };
    function qe() {
      this._listeners = /* @__PURE__ */ Object.create(null);
    }
    function an(L) {
      s(function() {
        throw L;
      }, 0);
    }
    qe.prototype.dispatchEvent = function(L) {
      L.target = this;
      var k = this._listeners[L.type];
      if (k != null)
        for (var H = k.length, N = 0; N < H; N += 1) {
          var Y = k[N];
          try {
            typeof Y.handleEvent == "function" ? Y.handleEvent(L) : Y.call(this, L);
          } catch (G) {
            an(G);
          }
        }
    }, qe.prototype.addEventListener = function(L, k) {
      L = String(L);
      var H = this._listeners, N = H[L];
      N == null && (N = [], H[L] = N);
      for (var Y = !1, G = 0; G < N.length; G += 1)
        N[G] === k && (Y = !0);
      Y || N.push(k);
    }, qe.prototype.removeEventListener = function(L, k) {
      L = String(L);
      var H = this._listeners, N = H[L];
      if (N != null) {
        for (var Y = [], G = 0; G < N.length; G += 1)
          N[G] !== k && Y.push(N[G]);
        Y.length === 0 ? delete H[L] : H[L] = Y;
      }
    };
    function We(L) {
      this.type = L, this.target = void 0;
    }
    function zt(L, k) {
      We.call(this, L), this.data = k.data, this.lastEventId = k.lastEventId;
    }
    zt.prototype = Object.create(We.prototype);
    function Qt(L, k) {
      We.call(this, L), this.status = k.status, this.statusText = k.statusText, this.headers = k.headers;
    }
    Qt.prototype = Object.create(We.prototype);
    function yr(L, k) {
      We.call(this, L), this.error = k.error;
    }
    yr.prototype = Object.create(We.prototype);
    var Yr = -1, te = 0, se = 1, Yn = 2, En = -1, kt = 0, Vr = 1, $i = 2, wo = 3, An = /^text\/event\-stream(;.*)?$/i, wr = 1e3, bo = 18e6, cn = function(L, k) {
      var H = L == null ? k : parseInt(L, 10);
      return H !== H && (H = k), fn(H);
    }, fn = function(L) {
      return Math.min(Math.max(L, wr), bo);
    }, xn = function(L, k, H) {
      try {
        typeof k == "function" && k.call(L, H);
      } catch (N) {
        an(N);
      }
    };
    function ee(L, k) {
      qe.call(this), k = k || {}, this.onopen = void 0, this.onmessage = void 0, this.onerror = void 0, this.url = void 0, this.readyState = void 0, this.withCredentials = void 0, this.headers = void 0, this._close = void 0, ye(this, L, k);
    }
    function br() {
      return a != null && "withCredentials" in a.prototype || f == null ? new a() : new f();
    }
    var Pi = m != null && b != null && "body" in b.prototype;
    function ye(L, k, H) {
      k = String(k);
      var N = !!H.withCredentials, Y = H.lastEventIdQueryParameterName || "lastEventId", G = fn(1e3), Q = cn(H.heartbeatTimeout, 45e3), mt = "", ut = G, ft = !1, yt = 0, V = H.headers || {}, pt = H.Transport, we = Pi && pt == null ? void 0 : new M(pt != null ? new pt() : br()), ln = pt != null && typeof pt != "string" ? new pt() : we == null ? new Te() : new _t(), Kt = void 0, Nt = 0, oe = Yr, tn = "", Rn = "", be = "", In = "", Jt = kt, Zr = 0, hn = 0, Fi = function(Dt, Ot, ue, ae) {
        if (oe === te)
          if (Dt === 200 && ue != null && An.test(ue)) {
            oe = se, ft = Date.now(), ut = G, L.readyState = se;
            var Xt = new Qt("open", {
              status: Dt,
              statusText: Ot,
              headers: ae
            });
            L.dispatchEvent(Xt), xn(L, L.onopen, Xt);
          } else {
            var $t = "";
            Dt !== 200 ? (Ot && (Ot = Ot.replace(/\s+/g, " ")), $t = "EventSource's response has a status " + Dt + " " + Ot + " that is not 200. Aborting the connection.") : $t = "EventSource's response has a Content-Type specifying an unsupported type: " + (ue == null ? "-" : ue.replace(/\s+/g, " ")) + ". Aborting the connection.", Qr();
            var Xt = new Qt("error", {
              status: Dt,
              statusText: Ot,
              headers: ae
            });
            L.dispatchEvent(Xt), xn(L, L.onerror, Xt), console.error($t);
          }
      }, Mi = function(Dt) {
        if (oe === se) {
          for (var Ot = -1, ue = 0; ue < Dt.length; ue += 1) {
            var ae = Dt.charCodeAt(ue);
            (ae === `
`.charCodeAt(0) || ae === "\r".charCodeAt(0)) && (Ot = ue);
          }
          var Xt = (Ot !== -1 ? In : "") + Dt.slice(0, Ot + 1);
          In = (Ot === -1 ? In : "") + Dt.slice(Ot + 1), Dt !== "" && (ft = Date.now(), yt += Dt.length);
          for (var $t = 0; $t < Xt.length; $t += 1) {
            var ae = Xt.charCodeAt($t);
            if (Jt === En && ae === `
`.charCodeAt(0))
              Jt = kt;
            else if (Jt === En && (Jt = kt), ae === "\r".charCodeAt(0) || ae === `
`.charCodeAt(0)) {
              if (Jt !== kt) {
                Jt === Vr && (hn = $t + 1);
                var Be = Xt.slice(Zr, hn - 1), _e = Xt.slice(hn + (hn < $t && Xt.charCodeAt(hn) === " ".charCodeAt(0) ? 1 : 0), $t);
                Be === "data" ? (tn += `
`, tn += _e) : Be === "id" ? Rn = _e : Be === "event" ? be = _e : Be === "retry" ? (G = cn(_e, G), ut = G) : Be === "heartbeatTimeout" && (Q = cn(_e, Q), Nt !== 0 && (u(Nt), Nt = s(function() {
                  Vn();
                }, Q)));
              }
              if (Jt === kt) {
                if (tn !== "") {
                  mt = Rn, be === "" && (be = "message");
                  var On = new zt(be, {
                    data: tn.slice(1),
                    lastEventId: Rn
                  });
                  if (L.dispatchEvent(On), be === "open" ? xn(L, L.onopen, On) : be === "message" ? xn(L, L.onmessage, On) : be === "error" && xn(L, L.onerror, On), oe === Yn)
                    return;
                }
                tn = "", be = "";
              }
              Jt = ae === "\r".charCodeAt(0) ? En : kt;
            } else
              Jt === kt && (Zr = $t, Jt = Vr), Jt === Vr ? ae === ":".charCodeAt(0) && (hn = $t + 1, Jt = $i) : Jt === $i && (Jt = wo);
          }
        }
      }, Di = function(Dt) {
        if (oe === se || oe === te) {
          oe = Yr, Nt !== 0 && (u(Nt), Nt = 0), Nt = s(function() {
            Vn();
          }, ut), ut = fn(Math.min(G * 16, ut * 2)), L.readyState = te;
          var Ot = new yr("error", { error: Dt });
          L.dispatchEvent(Ot), xn(L, L.onerror, Ot), Dt != null && console.error(Dt);
        }
      }, Qr = function() {
        oe = Yn, Kt != null && (Kt.abort(), Kt = void 0), Nt !== 0 && (u(Nt), Nt = 0), L.readyState = Yn;
      }, Vn = function() {
        if (Nt = 0, oe !== Yr) {
          if (!ft && Kt != null)
            Di(new Error("No activity within " + Q + " milliseconds. " + (oe === te ? "No response received." : yt + " chars received.") + " Reconnecting.")), Kt != null && (Kt.abort(), Kt = void 0);
          else {
            var Dt = Math.max((ft || Date.now()) + Q - Date.now(), 1);
            ft = !1, Nt = s(function() {
              Vn();
            }, Dt);
          }
          return;
        }
        ft = !1, yt = 0, Nt = s(function() {
          Vn();
        }, Q), oe = te, tn = "", be = "", Rn = mt, In = "", Zr = 0, hn = 0, Jt = kt;
        var Ot = k;
        if (k.slice(0, 5) !== "data:" && k.slice(0, 5) !== "blob:" && mt !== "") {
          var ue = k.indexOf("?");
          Ot = ue === -1 ? k : k.slice(0, ue + 1) + k.slice(ue + 1).replace(/(?:^|&)([^=&]*)(?:=[^&]*)?/g, function(_e, On) {
            return On === Y ? "" : _e;
          }), Ot += (k.indexOf("?") === -1 ? "?" : "&") + Y + "=" + encodeURIComponent(mt);
        }
        var ae = L.withCredentials, Xt = {};
        Xt.Accept = "text/event-stream";
        var $t = L.headers;
        if ($t != null)
          for (var Be in $t)
            Object.prototype.hasOwnProperty.call($t, Be) && (Xt[Be] = $t[Be]);
        try {
          Kt = ln.open(we, Fi, Mi, Di, Ot, ae, Xt);
        } catch (_e) {
          throw Qr(), _e;
        }
      };
      L.url = k, L.readyState = te, L.withCredentials = N, L.headers = V, L._close = Qr, Vn();
    }
    ee.prototype = Object.create(qe.prototype), ee.prototype.CONNECTING = te, ee.prototype.OPEN = se, ee.prototype.CLOSED = Yn, ee.prototype.close = function() {
      this._close();
    }, ee.CONNECTING = te, ee.OPEN = se, ee.CLOSED = Yn, ee.prototype.withCredentials = void 0;
    var Sn = d;
    a != null && (d == null || !("withCredentials" in d.prototype)) && (Sn = ee), function(L) {
      {
        var k = L(e);
        k !== void 0 && (r.exports = k);
      }
    }(function(L) {
      L.EventSourcePolyfill = ee, L.NativeEventSource = d, L.EventSource = Sn;
    });
  })(typeof globalThis > "u" ? typeof window < "u" ? window : typeof self < "u" ? self : Nr : globalThis);
})(sa, sa.exports);
var WE = sa.exports, BE = WE.EventSourcePolyfill;
const HE = /* @__PURE__ */ ad(BE), Id = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: HE
}, Symbol.toStringTag, { value: "Module" }));
