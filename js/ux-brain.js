/*
  ux-brain.js - Lightweight on-device AI for dynamic UX enhancements
  Goals:
  - Observe behavior (typing cadence, panel usage, errors) and derive small suggestions
  - Provide context-aware helpers (e.g., detect JSON/XML and offer pretty/minify; detect long session and suggest Focus)
  - No network calls, no LLMs, fully local. Uses simple heuristics, small Bayesian updates, and decay counters.
*/
(function(){
  const STORE_KEY = 'uxbrain_profile_v1';
  function load(){ try { return JSON.parse(localStorage.getItem(STORE_KEY)||'{}'); } catch { return {}; } }
  function save(p){ try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch {} }

  const prof = Object.assign({
    seenTips: {},          // { tipKey: count }
    lastSuggestTs: 0,
    usage: { format:0, search:0, utils:0, dev:0 },
    typing: { lastCpm: 0, idleMs: 0, lastInputTs: Date.now() },
    jsonOps: 0,
    focusAccepts: 0,
    sessionStart: Date.now(),
    theme: { toggles: 0, lastToggleTs: 0 }
  }, load());

  // Small helper to avoid spamming suggestions
  function canSuggest(key, cooldownMs=120000){ // 2 min cooldown per tip
    const now = Date.now();
    if (!prof.seenTips[key]) prof.seenTips[key] = 0;
    if (!prof['_last_'+key]) prof['_last_'+key] = 0;
    if (now - prof['_last_'+key] < cooldownMs) return false;
    prof['_last_'+key] = now;
    prof.seenTips[key]++;
    save(prof);
    return true;
  }

  // Heuristic detectors
  function detectLikelyJSON(text){
    if (!text) return false; const t = text.trim();
    if (!((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']')))) return false;
    try { JSON.parse(t); return true; } catch { return false; }
  }
  function detectLikelyXML(text){
    if (!text) return false; const t = text.trim();
    return /<\w+[\s\S]*>/.test(t) && /<\/\w+>/.test(t);
  }

  function detectCodeType(text){
    if (!text) return 'generic';
    const t = text.trim();
    // JSON
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try { JSON.parse(t); return 'json'; } catch {}
    }
    // HTML/XML
    if (t.includes('<!DOCTYPE') || /<\/?[a-z][\s\S]*>/i.test(t)) {
      return t.startsWith('<?xml') ? 'xml' : 'html';
    }
    // CSS
    if ((/{[\s\S]*}/.test(t) && /:[^;]+;/.test(t)) || /@[a-z-]+/.test(t)) return 'css';
  // JavaScript (simple heuristic)
    if (/\b(function|const|let|var|class|=>)\b/.test(t)) return 'javascript';
    return 'generic';
  }

  function countURLs(text){
    if (!text) return 0;
    return (text.match(/https?:\/\/[^\s)]+/g) || []).length;
  }

  function isLikelyMinified(text){
    if (!text) return false;
    const nl = (text.match(/\n/g) || []).length;
    const avgLine = text.length / Math.max(1, nl);
  return nl < 5 && text.length > 800 && avgLine > 200; // few lines, long lines
  }

  // Suggestion engine
  function maybeSuggest(app){
    if (!app || typeof window.showNotification !== 'function') return;
    const txt = app.text || '';
    const now = Date.now();

    // 1) Focus Mode suggestion: long session or high CPM
    const sessionMs = now - (prof.sessionStart || now);
    const longSession = sessionMs > 20*60*1000; // > 20 min
    const highCpm = (prof.typing.lastCpm||0) > 220;
    if (!app.focusMode && (longSession || highCpm) && canSuggest('focusMode', 10*60*1000)) { // 10 min cooldown
      showNotification('🎯 Sugerencia: Activa Focus Mode para escribir sin distracciones', 'success', {
        duration: 6000,
        onClick: () => {
          try { app.toggleFocusMode && app.toggleFocusMode(); } catch {}
        }
      });
      return;
    }

    // 2) JSON helpers: pretty/minify
    if (detectLikelyJSON(txt) && canSuggest('jsonHelper')) {
      showNotification('📦 JSON detectado: Click para formatear (Pretty)', 'success', {
        onClick: () => { try { app.codeFeature && app.codeFeature('jsonPretty'); } catch {} }
      });
      return;
    }

    // 3) XML/HTML pretty
    if (detectLikelyXML(txt) && canSuggest('xmlHelper')) {
      showNotification('🧩 XML/HTML detectado: Click para embellecer', 'success', {
        onClick: () => { try { app.beautifyCode && app.beautifyCode(); } catch {} }
      });
      return;
    }

  // 4) Suggest Find/Replace if there are duplicates
    const manyLines = (txt.match(/\n/g)||[]).length > 30;
  const repeated = /(.+)(?:[\s\S]*\1){2,}/.test(txt.slice(0, 3000)); // pattern repeated 3+ times in first 3k chars
    if (manyLines && repeated && canSuggest('searchReplace', 8*60*1000)) {
      showNotification('🔎 Veo patrones repetidos: prueba Find & Replace (Ctrl+F)', 'success', {
        onClick: () => { try { app.togglePanel && app.togglePanel('search'); } catch {} }
      });
      return;
    }

  // 5) Many URLs → suggest extractor
    const urlCount = countURLs(txt);
    if (urlCount >= 5 && canSuggest('extractURLs', 8*60*1000)) {
      showNotification(`🔗 Detecté ${urlCount} URLs: extraer enlaces`, 'success', {
        onClick: () => { try { app.processUtils && app.processUtils('extract','urls'); } catch {}
      }});
      return;
    }

  // 6) Idle with content → suggest Share URL
    const idleFor = now - (prof.typing.lastInputTs || now);
    if (txt.length > 200 && idleFor > 6*60*1000 && canSuggest('shareURL', 20*60*1000)) {
      showNotification('🔗 Comparte tu texto con un enlace (Click para generar)', 'success', {
        onClick: () => { try { app.generateShareURL && app.generateShareURL(); } catch {} }
      });
      return;
    }

  // 7) Minified or messy code → suggest Beautify
    const codeType = detectCodeType(txt);
    if (['javascript','css','html','xml','json'].includes(codeType)) {
      if (isLikelyMinified(txt) && canSuggest('beautifyMessy', 10*60*1000)) {
        showNotification('✨ Tu código parece minificado: Click para Beautify', 'success', {
          onClick: () => { try { app.beautifyCode && app.beautifyCode(); } catch {} }
        });
        return;
      }
    }

  // 8) Very large text → performance tip
    const lineCount = (txt.match(/\n/g)||[]).length;
    if ((txt.length > 200000 || lineCount > 5000) && canSuggest('perfTip', 30*60*1000)) {
      showNotification('🚀 Texto muy grande: usa Focus Mode y cierra paneles para fluidez', 'success', {
        onClick: () => { try { !app.focusMode && app.toggleFocusMode && app.toggleFocusMode(); } catch {} }
      });
      return;
    }

  // 9) Long plain text → Word Frequency
    if (codeType === 'generic' && txt.length > 3000 && canSuggest('wordfreq', 15*60*1000)) {
      showNotification('📊 Ver frecuencia de palabras (Click)', 'success', {
        onClick: () => { try { app.formatText && app.formatText('wordcount'); } catch {} }
      });
      return;
    }
  }

  // Public API to feed signals
  window.UXBrain = {
    trackPanel(panel, opened){
      if (prof.usage[panel] != null) prof.usage[panel] += opened ? 1 : 0;
      save(prof);
    },
    trackTyping(cpm, idleMs){
      prof.typing.lastCpm = Math.round(cpm||0);
      prof.typing.idleMs = Math.round(idleMs||0);
      save(prof);
    },
    tick(app){ // lightweight periodic check
      maybeSuggest(app);
    },
    resetSession(){ prof.sessionStart = Date.now(); save(prof); }
  };

  // Periodically run suggestion engine
  function attach(appResolver){
    const run = () => { try { const app = appResolver(); if (app) window.UXBrain.tick(app); } catch {} };
  setInterval(run, 45000); // every 45s check and suggest if applicable
  }

  // Find Alpine app instance lazily
  function getApp(){
    const root = document.querySelector('[x-data]');
    if (root && root.__x) return root.__x.$data;
    return null;
  }

  // Connect typing tracker using the editor
  (function wireTyping(){
    const ta = document.getElementById('textInput');
    if (!ta) { if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', wireTyping, { once:true }); return; }

    let startTs = Date.now();
    let lastTs = 0;
    let chars = 0;
    let idleTimer = null;

    const flush = () => {
      const minutes = Math.max(1/60, (Date.now()-startTs)/60000);
      const cpm = chars / minutes;
      const idleMs = idleTimer ? (Date.now()-lastTs) : 0;
      window.UXBrain.trackTyping(cpm, idleMs);
      startTs = Date.now(); chars = 0;
    };

    const debouncedFlush = (window.Utils && Utils.debounce) ? Utils.debounce(flush, 5000) : flush;

    ta.addEventListener('input', (e) => {
      const now = Date.now();
      lastTs = now;
      chars += Math.max(1, (e.data||'').length);
      prof.typing.lastInputTs = now; save(prof);
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(flush, 4000);
      debouncedFlush();
    }, { passive: true });

    // Track paste behavior and suggest actions
    ta.addEventListener('paste', (e) => {
      try {
        const pasted = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
        if (!pasted) return;
        prof.typing.lastInputTs = Date.now(); save(prof);
        const size = pasted.length;
        const isJSON = detectLikelyJSON(pasted);
        const isXML = detectLikelyXML(pasted);
        const urls = countURLs(pasted);
        if (size > 500 && isJSON && canSuggest('pasteJSON', 10*60*1000)) {
          showNotification('📦 Pegaste JSON grande: Pretty JSON (Click)', 'success', {
            onClick: () => { try {
              const root = document.querySelector('[x-data]');
              const app = root && root.__x ? root.__x.$data : null;
              app && app.codeFeature && app.codeFeature('jsonPretty');
            } catch {} }
          });
        } else if (size > 500 && isXML && canSuggest('pasteXML', 10*60*1000)) {
          showNotification('🧩 Pegaste XML/HTML grande: Beautify (Click)', 'success', {
            onClick: () => { try {
              const root = document.querySelector('[x-data]');
              const app = root && root.__x ? root.__x.$data : null;
              app && app.beautifyCode && app.beautifyCode();
            } catch {} }
          });
        } else if (urls >= 5 && canSuggest('pasteURLs', 10*60*1000)) {
          showNotification('🔗 Pegaste muchos links: extraer URLs (Click)', 'success', {
            onClick: () => { try {
              const root = document.querySelector('[x-data]');
              const app = root && root.__x ? root.__x.$data : null;
              app && app.formatText && app.formatText('extracturls');
            } catch {} }
          });
        }
      } catch {}
    });
  })();


  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded', () => { attach(getApp); }, { once:true });
  } else {
    attach(getApp);
  }
})();
