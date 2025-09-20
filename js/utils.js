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

  window.Utils = Utils;
})();
