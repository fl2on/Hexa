/*
  tf-opt.js - On-device learning for adaptive autosave and UX tuning
  - Learns from typing behavior (keystroke cadence, burst length, idle gaps)
  - Predicts an autosave delay (ms) that balances frequency vs. safety
  - Runs entirely client-side via TensorFlow.js; no network calls
*/
(function(){
  if (!window.tf) {
    console.warn('[TF-Opt] TensorFlow.js not loaded; skipping ML optimizations');
    return;
  }

  // Initialize TensorFlow with CPU backend as fallback
  async function initTensorFlow() {
    try {
      // Try to set WebGL backend first
      await tf.setBackend('webgl');
      await tf.ready();
    } catch (webglError) {
      console.warn('[TF-Opt] WebGL backend failed, falling back to CPU:', webglError.message);
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('[TF-Opt] Successfully initialized with CPU backend');
      } catch (cpuError) {
        console.error('[TF-Opt] Both WebGL and CPU backends failed:', cpuError);
        return false;
      }
    }
    return true;
  }

  const STORAGE_KEY = 'tfopt_profile_v1';
  const MODEL_KEY = 'tfopt_model_v1'; // legacy (JSON stringified artifacts)
  const MODEL_ID = 'hexa_tfopt_v1';   // new storage id for tf.io handlers

  function loadProfile(){
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { return {}; }
  }
  function saveProfile(p){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
  }

  const profile = loadProfile();
  profile.samples = Array.isArray(profile.samples) ? profile.samples : [];

  // Feature extractor: turns typing session stats into a fixed-size vector
  function featuresFromStats(stats){
    // stats: { avgIntervalMs, burstLen, idleMs, charsPerMinute }
    const avgInt = Math.max(1, Math.min(1000, stats.avgIntervalMs||300));
    const burst = Math.max(1, Math.min(200, stats.burstLen||5));
    const idle  = Math.max(0, Math.min(10000, stats.idleMs||1000));
    const cpm   = Math.max(0, Math.min(2000, stats.charsPerMinute||180));
    // Normalize to ~0..1
    return [ avgInt/1000, burst/200, idle/10000, cpm/2000 ];
  }

  // Heuristic target: longer idle and slower typing -> longer autosave; bursts -> shorter autosave
  function targetAutosaveMs(stats){
    const base = 15000; // 15s base
    const slower = (stats.avgIntervalMs||300) / 300; // >1 => slower
    const idleF = (stats.idleMs||0) / 2000;          // >1 => idling more
    const burstF = Math.max(1, (stats.burstLen||1) / 8); // bursts reduce delay
    let ms = base * slower * (1 + idleF*0.5) / burstF;
    ms = Math.max(5000, Math.min(60000, ms));
    return ms;
  }

  async function buildModel(){
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [4] }));
    model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
    model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
    return model;
  }

  async function trainIfPossible(model){
    if (!profile.samples.length) return;
    const xs = tf.tensor2d(profile.samples.map(s => featuresFromStats(s.stats)));
    const ys = tf.tensor2d(profile.samples.map(s => [ s.targetMs / 60000 ])); // target in minutes
    try {
      await model.fit(xs, ys, { epochs: Math.min(30, 4 + Math.floor(profile.samples.length/3)), batchSize: 8, verbose: 0 });
      // Persist model using built-in IO handlers (prefer IndexedDB, fallback to localStorage)
      try {
        await model.save(`indexeddb://${MODEL_ID}`);
      } catch (e) {
        try { await model.save(`localstorage://${MODEL_ID}`); }
        catch (e2) { console.warn('[TF-Opt] model save failed (both stores)', e, e2); }
      }
    } finally {
      xs.dispose(); ys.dispose();
    }
  }

  async function loadModel(){
    // Prefer IndexedDB, then LocalStorage; else build fresh
    try { 
      const model = await tf.loadLayersModel(`indexeddb://${MODEL_ID}`);
      // Ensure the loaded model is compiled
      if (!model.compiled) {
        model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
      }
      return model;
    }
    catch (e) { /* try next */ }
    try { 
      const model = await tf.loadLayersModel(`localstorage://${MODEL_ID}`);
      // Ensure the loaded model is compiled
      if (!model.compiled) {
        model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
      }
      return model;
    }
    catch (e2) {
      // Clean up legacy JSON-artifacts to avoid future misuse and free space
      try { localStorage.removeItem(MODEL_KEY); } catch {}
      console.warn('[TF-Opt] load model failed (no persisted model). Building fresh.');
      return buildModel();
    }
  }

  let modelPromise = null;

  // Initialize TensorFlow and model
  initTensorFlow().then(async (success) => {
    if (success) {
      try {
        modelPromise = loadModel().then(async (m) => { 
          await trainIfPossible(m); 
          return m; 
        });
      } catch (error) {
        console.warn('[TF-Opt] Model initialization failed:', error);
        modelPromise = null;
      }
    }
  }).catch(error => {
    console.warn('[TF-Opt] TensorFlow initialization failed:', error);
  });

  // Public API
  window.TFOpt = {
    // Record a typing session snapshot to train later
    recordTypingStats(stats){
      const targetMs = targetAutosaveMs(stats);
      profile.samples.push({ ts: Date.now(), stats, targetMs });
      // Keep last 200 samples
      if (profile.samples.length > 200) profile.samples = profile.samples.slice(-200);
      saveProfile(profile);
    },

    // Predict autosave delay in ms from stats (falls back to heuristic)
    async predictAutosaveMs(stats){
      try {
        if (!modelPromise) {
          // Fallback to heuristic if model not available
          return targetAutosaveMs(stats);
        }
        
        const m = await modelPromise;
        const x = tf.tensor2d([ featuresFromStats(stats) ]);
        const y = m.predict(x);
        const outMin = (await y.data())[0] * 60000; // minutes -> ms
        x.dispose(); y.dispose();
        const ms = Math.max(5000, Math.min(60000, outMin || targetAutosaveMs(stats)));
        return Math.round(ms);
      } catch (e) {
        console.warn('[TF-Opt] Prediction failed, using heuristic:', e.message);
        return targetAutosaveMs(stats);
      }
    }
  };

  // Wire into editor to collect stats unobtrusively
  (function attachEditorTracker(){
    const ta = document.getElementById('textInput');
    if (!ta) { if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', attachEditorTracker, { once: true }); return; }

    let lastKeyTs = 0;
    let intervals = [];
    let burstLen = 0;
    let lastInputTs = 0;
    let charCounter = 0;

    function flushSample(){
      if (intervals.length === 0) return;
      const avg = intervals.reduce((a,b)=>a+b,0)/intervals.length;
      const idle = Date.now() - lastInputTs;
      const minutes = Math.max(1/60, (Date.now() - startSessionTs)/60000);
      const cpm = Math.round(charCounter / minutes);
      TFOpt.recordTypingStats({ avgIntervalMs: avg, burstLen, idleMs: idle, charsPerMinute: cpm });
      intervals = []; burstLen = 0; charCounter = 0; startSessionTs = Date.now();
    }

    let startSessionTs = Date.now();
    const flushDebounced = (window.Utils && Utils.debounce) ? Utils.debounce(flushSample, 4000) : flushSample;

    ta.addEventListener('input', (e) => {
      const now = Date.now();
      if (lastKeyTs) {
        const dt = now - lastKeyTs;
        if (dt < 1500) { intervals.push(dt); burstLen++; }
        else { // long gap breaks burst
          flushSample();
        }
      }
      lastKeyTs = now; lastInputTs = now; charCounter += Math.max(1, (e.data||'').length);
      flushDebounced();
    }, { passive: true });

    // Flush at unload
    window.addEventListener('beforeunload', flushSample);
  })();
})();
