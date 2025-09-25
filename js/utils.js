/*
  Hexa Utilities - Lightweight helpers and patterns.
  Exposes `window.Utils` with:
  - debounce, throttle, memoize
  - sleep, retry, withTimeout
  - EventBus
  - Logger (levels, persists to console)
  - SafeStorage (local/session with TTL)
  - DOM helpers (qs, qsa, on, delegate)
  - Clipboard, download helpers
  - Theme helpers (get/set/persist)
  - Formatters (bytes, date, time)
*/
(function () {
  const now = () => Date.now();

  function debounce(fn, wait = 200, options = { leading: false, trailing: true }) {
    let t, lastArgs, lastThis, result, lastCallTime = 0;
    const later = () => {
      const shouldCall = options.trailing && lastArgs;
      t = null;
      if (shouldCall) {
        result = fn.apply(lastThis, lastArgs);
        lastArgs = lastThis = null;
      }
    };
    return function (...args) {
      const context = this;
      const callNow = options.leading && !t;
      lastArgs = args; lastThis = context; lastCallTime = now();
      clearTimeout(t);
      t = setTimeout(later, wait);
      if (callNow) {
        result = fn.apply(context, args);
        lastArgs = lastThis = null;
      }
      return result;
    };
  }

  function throttle(fn, wait = 200) {
    let inThrottle = false, lastArgs, lastThis;
    return function (...args) {
      if (!inThrottle) {
        inThrottle = true;
        fn.apply(this, args);
        setTimeout(() => {
          inThrottle = false;
          if (lastArgs) {
            fn.apply(lastThis, lastArgs);
            lastArgs = lastThis = null;
          }
        }, wait);
      } else {
        lastArgs = args; lastThis = this;
      }
    };
  }

  function memoize(fn, keyFn) {
    const cache = new Map();
    return function (...args) {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const val = fn.apply(this, args);
      cache.set(key, val);
      return val;
    };
  }

  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  async function retry(fn, { retries = 3, delay = 300, factor = 2, onRetry } = {}) {
    let attempt = 0; let lastErr;
    while (attempt <= retries) {
      try { return await fn(); } catch (err) {
        lastErr = err; if (attempt === retries) break;
        if (onRetry) try { onRetry(err, attempt); } catch {}
        await sleep(delay);
        delay *= factor; attempt++;
      }
    }
    throw lastErr;
  }

  function withTimeout(promise, ms, message = 'Operation timed out') {
    let t;
    const timeout = new Promise((_, rej) => t = setTimeout(() => rej(new Error(message)), ms));
    return Promise.race([
      promise.finally(() => clearTimeout(t)),
      timeout
    ]);
  }

  class EventBus {
    constructor() { this.evt = new Map(); }
    on(type, handler) {
      if (!this.evt.has(type)) this.evt.set(type, new Set());
      this.evt.get(type).add(handler);
      return () => this.off(type, handler);
    }
    once(type, handler) {
      const off = this.on(type, (...args) => { off(); handler(...args); });
      return off;
    }
    off(type, handler) {
      if (this.evt.has(type)) this.evt.get(type).delete(handler);
    }
    emit(type, payload) {
      if (!this.evt.has(type)) return;
      for (const h of this.evt.get(type)) try { h(payload); } catch (e) { console.error(e); }
    }
    clear() { this.evt.clear(); }
  }

  class Logger {
    constructor(prefix = 'Hexa') { this.prefix = prefix; this.level = 'info'; }
    setLevel(level) { this.level = level; }
    fmt(level, args) { return [`[%c${this.prefix}%c] ${level}:`, 'color:#60a5fa', 'color:inherit', ...args]; }
    debug(...a) { if (['debug'].includes(this.level)) console.debug(...this.fmt('debug', a)); }
    info(...a) { if (['debug','info'].includes(this.level)) console.info(...this.fmt('info', a)); }
    warn(...a) { console.warn(...this.fmt('warn', a)); }
    error(...a) { console.error(...this.fmt('error', a)); }
  }

  function createSafeStorage(storage) {
    return {
      get(key, fallback = null) {
        try {
          const raw = storage.getItem(key);
          if (!raw) return fallback;
          const data = JSON.parse(raw);
          if (data && typeof data === 'object' && 'v' in data) {
            if (data.e && now() > data.e) { storage.removeItem(key); return fallback; }
            return data.v;
          }
          return data;
        } catch { return fallback; }
      },
      set(key, value, ttlMs) {
        try {
          const payload = JSON.stringify({ v: value, e: ttlMs ? now() + ttlMs : 0 });
          storage.setItem(key, payload);
          return true;
        } catch { return false; }
      },
      remove(key) { try { storage.removeItem(key); } catch {} },
      clear() { try { storage.clear(); } catch {} }
    };
  }

  const SafeStorage = {
    local: createSafeStorage(window.localStorage),
    session: createSafeStorage(window.sessionStorage)
  };

  // DOM helpers
  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  function on(el, evt, handler, opts) { el.addEventListener(evt, handler, opts); return () => el.removeEventListener(evt, handler, opts); }
  function delegate(root, evt, selector, handler) {
    return on(root, evt, (e) => {
      const target = e.target.closest(selector);
      if (target && root.contains(target)) handler(e, target);
    });
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  }

  function downloadText(filename, text, type = 'text/plain') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // Theme helpers
  const THEME_KEY = 'darkMode';
  function getTheme() { return SafeStorage.local.get(THEME_KEY, true) !== false; }
  function setTheme(dark) {
    SafeStorage.local.set(THEME_KEY, dark);
    document.documentElement.classList.toggle('dark', !!dark);
  }
  function toggleTheme() { setTheme(!getTheme()); }

  // Formatters
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B','KB','MB','GB','TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString();
  }

  function formatDuration(ms) {
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
    if (h) return `${h}h ${m % 60}m`;
    if (m) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }

  // Global error handler (non-fatal)
  function installGlobalErrorHandler(logger) {
    window.addEventListener('error', (e) => {
      logger?.error('Unhandled error', e.error || e.message);
      if (window.showNotification) window.showNotification('⚠️ An error occurred. Check console.', 'error');
    });
    window.addEventListener('unhandledrejection', (e) => {
      logger?.error('Unhandled promise rejection', e.reason);
      if (window.showNotification) window.showNotification('⚠️ Async error. Check console.', 'error');
    });
  }

  const Utils = {
    debounce, throttle, memoize,
    sleep, retry, withTimeout,
    EventBus, Logger,
    SafeStorage,
    qs, qsa, on, delegate,
    copyText, downloadText,
    getTheme, setTheme, toggleTheme,
    formatBytes, formatDate, formatDuration,
    installGlobalErrorHandler
  };

  // Fancy text helpers
  const Text = {
    toBoldUnicode(str) {
      const offA = 0x1D400 - 0x41; // A
      const offa = 0x1D41A - 0x61; // a
      const off0 = 0x1D7CE - 0x30; // 0
      let out = '';
      for (const ch of str) {
        const code = ch.codePointAt(0);
        if (code >= 0x41 && code <= 0x5A) out += String.fromCodePoint(code + offA);
        else if (code >= 0x61 && code <= 0x7A) out += String.fromCodePoint(code + offa);
        else if (code >= 0x30 && code <= 0x39) out += String.fromCodePoint(code + off0);
        else out += ch;
      }
      return out;
    },
    toMonospace(str) {
      const offA = 0x1D670 - 0x41; // A
      const offa = 0x1D68A - 0x61; // a
      const off0 = 0x1D7F6 - 0x30; // 0
      let out = '';
      for (const ch of str) {
        const code = ch.codePointAt(0);
        if (code >= 0x41 && code <= 0x5A) out += String.fromCodePoint(code + offA);
        else if (code >= 0x61 && code <= 0x7A) out += String.fromCodePoint(code + offa);
        else if (code >= 0x30 && code <= 0x39) out += String.fromCodePoint(code + off0);
        else out += ch;
      }
      return out;
    }
  };

  const TEXT_KEY = 'text';
  const PREFIX_C16 = 'hxc:c16:'; // LZString.compressToUTF16 payload
  const NOTICE_KEY = 'hexa.textstore.notice';
  function canUseLS() { try { return !!window.localStorage; } catch { return false; } }
  function canUseSS() { try { return !!window.sessionStorage; } catch { return false; } }

  function decodeMaybeCompressed(val) {
    if (typeof val !== 'string' || !val) return '';
    if (val.startsWith(PREFIX_C16)) {
      try {
        const payload = val.slice(PREFIX_C16.length);
        const dec = (window.LZString && window.LZString.decompressFromUTF16)
          ? window.LZString.decompressFromUTF16(payload)
          : null;
        return dec != null ? dec : payload; // fallback to raw payload if lib missing
      } catch {
        return '';
      }
    }
    return val;
  }

  function encodeMaybeCompress(text) {
    // Heuristic threshold: compress when > 200k chars
    if (typeof text !== 'string') text = String(text ?? '');
    if (text.length > 200_000 && window.LZString && window.LZString.compressToUTF16) {
      try {
        const c = window.LZString.compressToUTF16(text);
        return PREFIX_C16 + c;
      } catch {
        // fallthrough to raw
      }
    }
    return text;
  }

  const TextStore = {
    get() {
      try {
        const ls = canUseLS() ? localStorage.getItem(TEXT_KEY) : null;
        const ss = (!ls && canUseSS()) ? sessionStorage.getItem(TEXT_KEY) : null;
        return decodeMaybeCompressed(ls ?? ss ?? '');
      } catch {
        return '';
      }
    },
    set(text) {
      const value = encodeMaybeCompress(text || '');
      let ok = false;
      // Try localStorage first
      if (canUseLS()) {
        try { localStorage.setItem(TEXT_KEY, value); ok = true; } catch {}
      }
      // Fallback to sessionStorage
      if (!ok && canUseSS()) {
        try { sessionStorage.setItem(TEXT_KEY, value); ok = true; } catch {}
      }
      if (!ok) {
        // Best-effort: show a one-time notice; keep content only in memory
        try {
          if (canUseLS() && !localStorage.getItem(NOTICE_KEY)) {
            localStorage.setItem(NOTICE_KEY, '1');
            if (window.showNotification) window.showNotification('⚠️ Storage full. Large text will not persist after refresh.', 'warning');
          }
        } catch {}
      }
      // Expose last saved snapshot for quick equality checks
      try { window.__hexaLastSavedText = text || ''; } catch {}
      return ok;
    }
  };

  Utils.TextStore = TextStore;
  window.TextStore = TextStore;

  Utils.Text = Text;

  // Lightweight hash and caching utilities
  function hashFNV1a(str) {
    // 32-bit FNV-1a hash for short strings/keys
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  class LRUCache {
    constructor(limit = 200) {
      this.limit = Math.max(10, limit);
      this.map = new Map(); // key -> {value}
    }
    get(key) {
      if (!this.map.has(key)) return undefined;
      const val = this.map.get(key);
      // refresh recentness
      this.map.delete(key);
      this.map.set(key, val);
      return val;
    }
    set(key, value) {
      if (this.map.has(key)) this.map.delete(key);
      this.map.set(key, value);
      if (this.map.size > this.limit) {
        const firstKey = this.map.keys().next().value;
        this.map.delete(firstKey);
      }
      return true;
    }
    has(key) { return this.map.has(key); }
    clear() { this.map.clear(); }
    size() { return this.map.size; }
  }

  function memoizeByInput(fn, { max = 200, keyFn } = {}) {
    const cache = new LRUCache(max);
    return function(...args) {
      const key = keyFn ? keyFn(...args) : `${args.length}|` + args.map(a => {
        if (typeof a === 'string') return `s:${a.length}:${a.slice(0,64)}`;
        if (typeof a === 'number' || typeof a === 'boolean') return String(a);
        try { return 'j:' + JSON.stringify(a).slice(0,128); } catch { return 'x'; }
      }).join('|');
      const hashedKey = hashFNV1a(key).toString(36);
      const hit = cache.get(hashedKey);
      if (hit !== undefined) return hit;
      const val = fn.apply(this, args);
      cache.set(hashedKey, val);
      return val;
    };
  }

  Utils.hashFNV1a = hashFNV1a;
  Utils.LRUCache = LRUCache;
  Utils.memoizeByInput = memoizeByInput;

  window.Utils = Utils;
})();
