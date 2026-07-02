(function () {
    if (!window.LZString) {
        console.warn('SmartCompress: LZString not found');
        return;
    }
    function b64urlEncode(b64) {
        return b64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    function b64urlDecode(b64url) {
        const pad = b64url.length % 4 === 2 ? '==' : b64url.length % 4 === 3 ? '=' : b64url.length % 4 === 1 ? '===' : '';
        const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + pad;
        return b64;
    }
    function safeJsonParse(s) { try {
        return JSON.parse(s);
    }
    catch {
        return null;
    } }
    function buildWordDict(text, maxWords = 512) {
        const re = /[\p{L}\p{N}_]+/gu;
        let m, freq = new Map();
        while ((m = re.exec(text)) !== null) {
            const w = m[0];
            if (w.length < 4)
                continue;
            freq.set(w, (freq.get(w) || 0) + 1);
        }
        const entries = Array.from(freq.entries())
            .filter(([w, c]) => c >= 3)
            .sort((a, b) => b[1] * Math.max(4, a[0].length) - a[1] * Math.max(4, b[0].length));
        const dict = entries.slice(0, maxWords).map(e => e[0]);
        return dict;
    }
    function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function encodeWithDict(text, dict) {
        if (!dict || dict.length === 0)
            return { encoded: text, replaced: 0 };
        const index = new Map(dict.map((w, i) => [w, i]));
        const sorted = [...dict].sort((a, b) => b.length - a.length);
        const pattern = new RegExp('\\b(' + sorted.map(escapeRegex).join('|') + ')\\b', 'g');
        let replaced = 0;
        const encoded = text.replace(pattern, (match) => {
            const i = index.get(match);
            if (i === undefined)
                return match;
            const tok = '~' + i.toString(36) + '.';
            if (tok.length < match.length) {
                replaced++;
                return tok;
            }
            return match;
        });
        return { encoded, replaced };
    }
    function decodeWithDict(encoded, dict) {
        if (!dict || dict.length === 0)
            return encoded;
        return encoded.replace(/~([0-9a-z]+)\./g, (m, g1) => {
            const idx = parseInt(g1, 36);
            return (Number.isFinite(idx) && dict[idx] != null) ? dict[idx] : m;
        });
    }
    const CONFIG = {
        minTextLenForCompression: 1000,
        w1: { minTextLen: 1500, minReplaced: 80, minGainVsLU: 0.05 },
    };
    function detectType(text) {
        const t = text.trim();
        if (!t)
            return 'other';
        if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
            try {
                JSON.parse(t);
                return 'json';
            }
            catch { }
        }
        if (/<[a-zA-Z!\/?][\s\S]*>/m.test(t))
            return 'html';
        if (/(function|=>|const |let |var |class |;\s*$|\{[\s\S]*\}|:[^;]+;)/m.test(t))
            return 'code';
        if (/\b(?:el|la|de|que|and|the|para|con|por|you|este|esto)\b/i.test(t))
            return 'lang';
        return 'other';
    }
    const TELEMETRY_KEY = 'SC.telemetry.v1';
    function loadTelemetry() {
        try {
            const raw = localStorage.getItem(TELEMETRY_KEY);
            return raw ? JSON.parse(raw) : { data: {} };
        }
        catch {
            return { data: {} };
        }
    }
    function saveTelemetry(state) { try {
        localStorage.setItem(TELEMETRY_KEY, JSON.stringify(state));
    }
    catch { } }
    function recordTelemetry(type, bestScheme, gain) {
        const st = loadTelemetry();
        const rec = st.data[type] || { total: 0, best: { lu: 0, lb: 0, w1: 0 }, avgGain: 0, schemeAvg: { lu: 0, lb: 0, w1: 0 }, schemeCnt: { lu: 0, lb: 0, w1: 0 } };
        rec.total += 1;
        if (rec.best[bestScheme] != null)
            rec.best[bestScheme] += 1;
        rec.avgGain = ((rec.avgGain * (rec.total - 1)) + gain) / rec.total;
        if (rec.schemeCnt[bestScheme] != null) {
            const c = ++rec.schemeCnt[bestScheme];
            rec.schemeAvg[bestScheme] = ((rec.schemeAvg[bestScheme] * (c - 1)) + gain) / c;
        }
        st.data[type] = rec;
        saveTelemetry(st);
    }
    function getAdaptiveThreshold(rawSize, type) {
        let base = rawSize >= 12000 ? 0.05 : rawSize >= 6000 ? 0.08 : 0.12;
        const st = loadTelemetry();
        const rec = st.data[type];
        if (!rec)
            return base;
        const expected = rawSize >= 12000 ? 0.14 : rawSize >= 6000 ? 0.10 : 0.07;
        const delta = Math.max(-0.02, Math.min(0.02, (rec.avgGain - expected) * 0.3));
        base = base + (delta);
        const dom = Object.entries(rec.best).sort((a, b) => b[1] - a[1])[0];
        if (dom && dom[1] >= Math.max(5, rec.total * 0.4)) {
            if (dom[0] === 'w1')
                base -= 0.01;
            else if (dom[0] === 'lu')
                base -= 0.005;
        }
        return Math.max(0.03, Math.min(0.2, base));
    }
    function buildPrefixDict(text, max = 64) {
        const re = /[\p{L}\p{N}_]{5,}/gu;
        let m;
        const freq = new Map();
        while ((m = re.exec(text)) !== null) {
            const w = m[0];
            for (let len = 3; len <= 6 && len < w.length; len++) {
                const p = w.slice(0, len);
                freq.set(p, (freq.get(p) || 0) + 1);
            }
        }
        const entries = Array.from(freq.entries()).filter(([s, c]) => c >= 20 && s.match(/^[\p{L}]{3,6}$/u)).sort((a, b) => b[1] * Math.max(3, a[0].length) - a[1] * Math.max(3, b[0].length));
        return entries.slice(0, max).map(e => e[0]);
    }
    function encodeWithPrefix(text, prefixes) {
        if (!prefixes || prefixes.length === 0)
            return { encoded: text, replaced: 0 };
        const idx = new Map(prefixes.map((p, i) => [p, i]));
        const sorted = [...prefixes].sort((a, b) => b.length - a.length);
        const pat = new RegExp('(?<=\b)(' + sorted.map(escapeRegex).join('|') + ')([\p{L}]{3,})', 'gu');
        let replaced = 0;
        const out = text.replace(pat, (full, pre, stem) => {
            const i = idx.get(pre);
            const tok = '^' + i.toString(36) + '`';
            if (tok.length < pre.length) {
                replaced++;
                return tok + stem;
            }
            return full;
        });
        return { encoded: out, replaced };
    }
    function decodePrefix(encoded, prefixes) {
        if (!prefixes || prefixes.length === 0)
            return encoded;
        return encoded.replace(/\^([0-9a-z]+)`/g, (m, g1) => {
            const i = parseInt(g1, 36);
            return (Number.isFinite(i) && prefixes[i] != null) ? prefixes[i] : m;
        });
    }
    function buildSuffixDict(text, max = 64) {
        const re = /[\p{L}\p{N}_]{5,}/gu;
        let m;
        const freq = new Map();
        while ((m = re.exec(text)) !== null) {
            const w = m[0];
            for (let len = 3; len <= 6 && len < w.length; len++) {
                const suf = w.slice(-len);
                freq.set(suf, (freq.get(suf) || 0) + 1);
            }
        }
        const entries = Array.from(freq.entries()).filter(([s, c]) => c >= 20 && s.match(/^[\p{L}]{3,6}$/u)).sort((a, b) => b[1] * Math.max(3, a[0].length) - a[1] * Math.max(3, b[0].length));
        return entries.slice(0, max).map(e => e[0]);
    }
    function encodeWithSuffix(text, suffixes) {
        if (!suffixes || suffixes.length === 0)
            return { encoded: text, replaced: 0 };
        const idx = new Map(suffixes.map((s, i) => [s, i]));
        const sorted = [...suffixes].sort((a, b) => b.length - a.length);
        const pat = new RegExp('([\\p{L}]{3,})(' + sorted.map(escapeRegex).join('|') + ')(?=\\b)', 'gu');
        let replaced = 0;
        const out = text.replace(pat, (full, stem, suf) => {
            const i = idx.get(suf);
            const tok = '`' + i.toString(36) + '~';
            if (tok.length < suf.length) {
                replaced++;
                return stem + tok;
            }
            return full;
        });
        return { encoded: out, replaced };
    }
    function decodeSuffix(encoded, suffixes) {
        if (!suffixes || suffixes.length === 0)
            return encoded;
        return encoded.replace(/`([0-9a-z]+)~/g, (m, g1) => {
            const i = parseInt(g1, 36);
            return (Number.isFinite(i) && suffixes[i] != null) ? suffixes[i] : m;
        });
    }
    function evaluate(text) {
        const variants = [];
        const rawSize = text.length;
        let lu = null;
        try {
            const payload = LZString.compressToEncodedURIComponent(text) || '';
            lu = { scheme: 'lu', payload, size: payload.length };
            variants.push(lu);
        }
        catch { }
        try {
            const b64 = LZString.compressToBase64(text) || '';
            const payload = b64urlEncode(b64);
            variants.push({ scheme: 'lb', payload, size: payload.length });
        }
        catch { }
        try {
            if (text.length >= CONFIG.w1.minTextLen) {
                const dict = buildWordDict(text);
                const { encoded: afterWords, replaced } = encodeWithDict(text, dict);
                const prefixDict = buildPrefixDict(text);
                const { encoded: afterPrefix, replaced: preRepl } = encodeWithPrefix(afterWords, prefixDict);
                const suffixDict = buildSuffixDict(text);
                const { encoded: afterSuffix, replaced: sufRepl } = encodeWithSuffix(afterPrefix, suffixDict);
                const stemRulesEN = [/ing\b/i, /ed\b/i, /ers?\b/i, /ly\b/i];
                const stemRulesES = [/mente\b/i, /ciones?\b/i, /ando\b/i, /ados?\b/i, /idas?\b/i];
                let stemmed = afterSuffix;
                let stemRepl = 0;
                let stemDict = [];
                const applyStemming = (src) => {
                    const freq = new Map();
                    const re = /[\p{L}\p{N}_]{5,}/gu;
                    let m;
                    while ((m = re.exec(src)) !== null) {
                        const w = m[0];
                        let base = null, affix = null;
                        for (const r of stemRulesEN) {
                            if (r.test(w)) {
                                base = w.replace(r, '');
                                affix = w.slice(base.length);
                                break;
                            }
                        }
                        if (!base) {
                            for (const r of stemRulesES) {
                                if (r.test(w)) {
                                    base = w.replace(r, '');
                                    affix = w.slice(base.length);
                                    break;
                                }
                            }
                        }
                        if (base && base.length >= 3 && affix && affix.length >= 2) {
                            const key = affix.toLowerCase();
                            freq.set(key, (freq.get(key) || 0) + 1);
                        }
                    }
                    const stemAffixes = Array.from(freq.entries()).filter(([a, c]) => c >= 20).sort((a, b) => b[1] - a[1]).slice(0, 64).map(e => e[0]);
                    if (stemAffixes.length === 0)
                        return { out: src, replaced: 0, dict: [] };
                    const idx = new Map(stemAffixes.map((a, i) => [a, i]));
                    const pat = new RegExp('([\\p{L}]{3,})(' + stemAffixes.map(escapeRegex).join('|') + ')\\b', 'giu');
                    let replaced = 0;
                    const out = src.replace(pat, (full, base, aff) => {
                        const i = idx.get(aff.toLowerCase());
                        const tok = '%' + i.toString(36) + '!';
                        if (tok.length < aff.length) {
                            replaced++;
                            return base + tok;
                        }
                        return full;
                    });
                    return { out, replaced, dict: stemAffixes };
                };
                let allowStemming = true;
                const contentType = detectType(text);
                if (contentType === 'code' || contentType === 'html')
                    allowStemming = false;
                let stemRes = { out: afterSuffix, replaced: 0, dict: [] };
                if (allowStemming) {
                    stemRes = applyStemming(afterSuffix);
                    const beforeLen = afterSuffix.length;
                    const afterLen = stemRes.out.length;
                    const localGain = beforeLen > 0 ? (beforeLen - afterLen) / beforeLen : 0;
                    if (localGain < 0.02) {
                        stemRes = { out: afterSuffix, replaced: 0, dict: [] };
                    }
                }
                stemmed = stemRes.out;
                stemRepl = stemRes.replaced;
                stemDict = stemRes.dict;
                if (replaced + preRepl + sufRepl + stemRepl >= CONFIG.w1.minReplaced) {
                    const dictStr = dict.join('\u0001');
                    const preStr = prefixDict.join('\u0001');
                    const sufStr = suffixDict.join('\u0001');
                    const stmStr = stemDict.join('\u0001');
                    const head = 'W1|';
                    const composite = head
                        + b64urlEncode(btoa(unescape(encodeURIComponent(dictStr)))) + '|'
                        + b64urlEncode(btoa(unescape(encodeURIComponent(preStr)))) + '|'
                        + b64urlEncode(btoa(unescape(encodeURIComponent(sufStr)))) + '|'
                        + b64urlEncode(btoa(unescape(encodeURIComponent(stmStr)))) + '|'
                        + stemmed;
                    const payload = LZString.compressToEncodedURIComponent(composite) || '';
                    const w1 = { scheme: 'w1', payload, size: payload.length, meta: { dictSize: dict.length, replaced: replaced + preRepl + sufRepl + stemRepl, prefixDictSize: prefixDict.length, prefixReplaced: preRepl, suffixDictSize: suffixDict.length, suffixReplaced: sufRepl, stemDictSize: stemDict.length, stemReplaced: stemRepl } };
                    if (!lu || w1.size <= Math.floor(lu.size * (1 - CONFIG.w1.minGainVsLU))) {
                        variants.push(w1);
                    }
                }
            }
        }
        catch { }
        variants.forEach(v => v.gain = rawSize > 0 ? (rawSize - v.size) / rawSize : 0);
        const sorted = variants.filter(v => v.payload).sort((a, b) => a.size - b.size);
        return { rawSize, variants: sorted, lu };
    }
    function decompressByScheme(scheme, payload) {
        if (!payload)
            return '';
        try {
            if (scheme === 'lb') {
                const b64 = b64urlDecode(payload);
                return LZString.decompressFromBase64(b64) || '';
            }
            if (scheme === 'w1') {
                const composite = LZString.decompressFromEncodedURIComponent(payload) || '';
                const parts = composite.split('|');
                if (!parts[0].startsWith('W1'))
                    return composite;
                const wordB64u = parts[1];
                let prefixes = [], suffixes = [], stems = [];
                let encoded = '';
                if (parts.length >= 6) {
                    try {
                        const b64p = b64urlDecode(parts[2]);
                        const preStr = decodeURIComponent(escape(atob(b64p)));
                        prefixes = preStr ? preStr.split('\u0001') : [];
                    }
                    catch { }
                    try {
                        const b64s = b64urlDecode(parts[3]);
                        const sufStr = decodeURIComponent(escape(atob(b64s)));
                        suffixes = sufStr ? sufStr.split('\u0001') : [];
                    }
                    catch { }
                    try {
                        const b64t = b64urlDecode(parts[4]);
                        const stmStr = decodeURIComponent(escape(atob(b64t)));
                        stems = stmStr ? stmStr.split('\u0001') : [];
                    }
                    catch { }
                    encoded = parts.slice(5).join('|');
                }
                else if (parts.length >= 4) {
                    try {
                        const b64s = b64urlDecode(parts[2]);
                        const sufStr = decodeURIComponent(escape(atob(b64s)));
                        suffixes = sufStr ? sufStr.split('\u0001') : [];
                    }
                    catch { }
                    encoded = parts.slice(3).join('|');
                }
                else {
                    encoded = parts[2];
                }
                let dict = [];
                try {
                    const b64w = b64urlDecode(wordB64u);
                    const dictStr = decodeURIComponent(escape(atob(b64w)));
                    dict = dictStr ? dictStr.split('\u0001') : [];
                }
                catch { }
                const decodeStems = (s) => stems.length ? s.replace(/%([0-9a-z])!/g, (m, g) => { const i = parseInt(g, 36); return (Number.isFinite(i) && stems[i] != null) ? stems[i] : m; }) : s;
                const ds = decodeStems(encoded);
                const restoredSuf = decodeSuffix(ds, suffixes);
                const restoredPre = decodePrefix(restoredSuf, prefixes);
                return decodeWithDict(restoredPre, dict);
            }
            return LZString.decompressFromEncodedURIComponent(payload) || '';
        }
        catch (e) {
            console.warn('SmartCompress decompress failed', e);
            return '';
        }
    }
    const cache = (function () {
        const LRU = window.Algos && window.Algos.LRUCache ? window.Algos.LRUCache : null;
        if (LRU)
            return new LRU(20);
        const m = new Map();
        return {
            get(k) { return m.get(k); },
            set(k, v) { m.set(k, v); if (m.size > 20) {
                const it = m.keys().next().value;
                m.delete(it);
            } }
        };
    })();
    window.SmartCompress = {
        config: CONFIG,
        detectType,
        recordTelemetry,
        getAdaptiveThreshold,
        evaluate,
        compress(text) {
            const key = 'c:' + (text.length > 2048 ? text.slice(0, 1024) + '…' + text.slice(-256) : text);
            const hit = cache.get(key);
            if (hit)
                return hit;
            const { variants } = evaluate(text);
            const best = variants[0] || { scheme: 'lu', payload: LZString.compressToEncodedURIComponent(text) || '', size: 0 };
            cache.set(key, best);
            return best;
        },
        decompress(scheme, payload) {
            return decompressByScheme(scheme, payload);
        }
    };
})();
