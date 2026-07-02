(function () {
    if (!window.tf) {
        console.warn('[TF-Opt] TensorFlow.js not loaded; skipping ML optimizations');
        return;
    }
    async function initTensorFlow() {
        try {
            await tf.setBackend('webgl');
            await tf.ready();
        }
        catch (webglError) {
            console.warn('[TF-Opt] WebGL backend failed, falling back to CPU:', webglError.message);
            try {
                await tf.setBackend('cpu');
                await tf.ready();
                console.log('[TF-Opt] Successfully initialized with CPU backend');
            }
            catch (cpuError) {
                console.error('[TF-Opt] Both WebGL and CPU backends failed:', cpuError);
                return false;
            }
        }
        return true;
    }
    const STORAGE_KEY = 'tfopt_profile_v1';
    const MODEL_KEY = 'tfopt_model_v1';
    const MODEL_ID = 'hexa_tfopt_v1';
    function loadProfile() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        }
        catch {
            return {};
        }
    }
    function saveProfile(p) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
        }
        catch { }
    }
    const profile = loadProfile();
    profile.samples = Array.isArray(profile.samples) ? profile.samples : [];
    function featuresFromStats(stats) {
        const avgInt = Math.max(1, Math.min(1000, stats.avgIntervalMs || 300));
        const burst = Math.max(1, Math.min(200, stats.burstLen || 5));
        const idle = Math.max(0, Math.min(10000, stats.idleMs || 1000));
        const cpm = Math.max(0, Math.min(2000, stats.charsPerMinute || 180));
        return [avgInt / 1000, burst / 200, idle / 10000, cpm / 2000];
    }
    function targetAutosaveMs(stats) {
        const base = 15000;
        const slower = (stats.avgIntervalMs || 300) / 300;
        const idleF = (stats.idleMs || 0) / 2000;
        const burstF = Math.max(1, (stats.burstLen || 1) / 8);
        let ms = base * slower * (1 + idleF * 0.5) / burstF;
        ms = Math.max(5000, Math.min(60000, ms));
        return ms;
    }
    async function buildModel() {
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [4] }));
        model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
        model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
        return model;
    }
    async function trainIfPossible(model) {
        if (!profile.samples.length)
            return;
        const xs = tf.tensor2d(profile.samples.map(s => featuresFromStats(s.stats)));
        const ys = tf.tensor2d(profile.samples.map(s => [s.targetMs / 60000]));
        try {
            await model.fit(xs, ys, { epochs: Math.min(30, 4 + Math.floor(profile.samples.length / 3)), batchSize: 8, verbose: 0 });
            try {
                await model.save(`indexeddb://${MODEL_ID}`);
            }
            catch (e) {
                try {
                    await model.save(`localstorage://${MODEL_ID}`);
                }
                catch (e2) {
                    console.warn('[TF-Opt] model save failed (both stores)', e, e2);
                }
            }
        }
        finally {
            xs.dispose();
            ys.dispose();
        }
    }
    async function loadModel() {
        try {
            const model = await tf.loadLayersModel(`indexeddb://${MODEL_ID}`);
            if (!model.compiled) {
                model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
            }
            return model;
        }
        catch (e) { }
        try {
            const model = await tf.loadLayersModel(`localstorage://${MODEL_ID}`);
            if (!model.compiled) {
                model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
            }
            return model;
        }
        catch (e2) {
            try {
                localStorage.removeItem(MODEL_KEY);
            }
            catch { }
            console.warn('[TF-Opt] load model failed (no persisted model). Building fresh.');
            return buildModel();
        }
    }
    let modelPromise = null;
    initTensorFlow().then(async (success) => {
        if (success) {
            try {
                modelPromise = loadModel().then(async (m) => {
                    await trainIfPossible(m);
                    return m;
                });
            }
            catch (error) {
                console.warn('[TF-Opt] Model initialization failed:', error);
                modelPromise = null;
            }
        }
    }).catch(error => {
        console.warn('[TF-Opt] TensorFlow initialization failed:', error);
    });
    window.TFOpt = {
        recordTypingStats(stats) {
            const targetMs = targetAutosaveMs(stats);
            profile.samples.push({ ts: Date.now(), stats, targetMs });
            if (profile.samples.length > 200)
                profile.samples = profile.samples.slice(-200);
            saveProfile(profile);
        },
        async predictAutosaveMs(stats) {
            try {
                if (!modelPromise) {
                    return targetAutosaveMs(stats);
                }
                const m = await modelPromise;
                const x = tf.tensor2d([featuresFromStats(stats)]);
                const y = m.predict(x);
                const outMin = (await y.data())[0] * 60000;
                x.dispose();
                y.dispose();
                const ms = Math.max(5000, Math.min(60000, outMin || targetAutosaveMs(stats)));
                return Math.round(ms);
            }
            catch (e) {
                console.warn('[TF-Opt] Prediction failed, using heuristic:', e.message);
                return targetAutosaveMs(stats);
            }
        }
    };
    (function attachEditorTracker() {
        const ta = document.getElementById('textInput');
        if (!ta) {
            if (document.readyState === 'loading')
                document.addEventListener('DOMContentLoaded', attachEditorTracker, { once: true });
            return;
        }
        let lastKeyTs = 0;
        let intervals = [];
        let burstLen = 0;
        let lastInputTs = 0;
        let charCounter = 0;
        function flushSample() {
            if (intervals.length === 0)
                return;
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const idle = Date.now() - lastInputTs;
            const minutes = Math.max(1 / 60, (Date.now() - startSessionTs) / 60000);
            const cpm = Math.round(charCounter / minutes);
            TFOpt.recordTypingStats({ avgIntervalMs: avg, burstLen, idleMs: idle, charsPerMinute: cpm });
            intervals = [];
            burstLen = 0;
            charCounter = 0;
            startSessionTs = Date.now();
        }
        let startSessionTs = Date.now();
        const flushDebounced = (window.Utils && Utils.debounce) ? Utils.debounce(flushSample, 4000) : flushSample;
        ta.addEventListener('input', (e) => {
            const now = Date.now();
            if (lastKeyTs) {
                const dt = now - lastKeyTs;
                if (dt < 1500) {
                    intervals.push(dt);
                    burstLen++;
                }
                else {
                    flushSample();
                }
            }
            lastKeyTs = now;
            lastInputTs = now;
            charCounter += Math.max(1, (e.data || '').length);
            flushDebounced();
        }, { passive: true });
        window.addEventListener('beforeunload', flushSample);
    })();
})();
