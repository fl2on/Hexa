(function () {
    const HASH_KEY = 'h2';
    const URL_SOFT_LIMIT = 7600;
    const URL_HARD_LIMIT = 16000;
    const CHECKSUM_LEN = 8;
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    function bytesToBase64Url(bytes) {
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(bin).replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    function base64UrlToBytes(value) {
        const pad = value.length % 4 === 2 ? '==' : value.length % 4 === 3 ? '=' : value.length % 4 === 1 ? '===' : '';
        const b64 = String(value || '').replace(/-/g, '+').replace(/_/g, '/') + pad;
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++)
            bytes[i] = bin.charCodeAt(i);
        return bytes;
    }
    function b64ToBase64Url(b64) {
        return String(b64 || '').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    function base64UrlToB64(value) {
        const pad = value.length % 4 === 2 ? '==' : value.length % 4 === 3 ? '=' : value.length % 4 === 1 ? '===' : '';
        return String(value || '').replace(/-/g, '+').replace(/_/g, '/') + pad;
    }
    async function digestShort(text, length = CHECKSUM_LEN) {
        try {
            if (!window.crypto || !crypto.subtle)
                return '';
            const hash = await crypto.subtle.digest('SHA-256', enc.encode(text));
            return bytesToBase64Url(new Uint8Array(hash)).slice(0, Math.max(1, length || CHECKSUM_LEN));
        }
        catch {
            return '';
        }
    }
    function getBaseUrl() {
        const url = new URL(window.location.href);
        for (const key of ['text', 't', 'c', 's', 'title', 'id'])
            url.searchParams.delete(key);
        url.hash = '';
        return url;
    }
    function splitPacked(value) {
        const dot = String(value || '').indexOf('.');
        if (dot < 0)
            return { scheme: 'r', payload: value || '' };
        return { scheme: value.slice(0, dot), payload: value.slice(dot + 1) };
    }
    function pack(scheme, payload) {
        return `${scheme}.${payload}`;
    }
    function normalizeTitle(title) {
        return String(title || '').trim().slice(0, 80);
    }
    function findRepeatUnit(text) {
        text = String(text || '');
        const n = text.length;
        if (n < 4)
            return null;
        const pi = new Array(n).fill(0);
        for (let i = 1; i < n; i++) {
            let j = pi[i - 1];
            while (j > 0 && text[i] !== text[j])
                j = pi[j - 1];
            if (text[i] === text[j])
                j++;
            pi[i] = j;
        }
        const period = n - pi[n - 1];
        if (period > 0 && period < n && n % period === 0) {
            const count = n / period;
            if (count >= 3)
                return { unit: text.slice(0, period), count };
        }
        return null;
    }
    function encodeRepeat(text) {
        const rep = findRepeatUnit(text);
        if (!rep)
            return '';
        try {
            const unit = bytesToBase64Url(enc.encode(rep.unit));
            const count = rep.count.toString(36);
            const payload = `${unit}.${count}`;
            return payload.length + 3 < encodeURIComponent(text).length ? payload : '';
        }
        catch {
            return '';
        }
    }
    function decodeRepeat(payload) {
        const value = String(payload || '');
        const dot = value.lastIndexOf('.');
        if (dot <= 0)
            return '';
        try {
            const unit = dec.decode(base64UrlToBytes(value.slice(0, dot)));
            const count = parseInt(value.slice(dot + 1), 36);
            if (!unit || !Number.isFinite(count) || count < 0 || count > 2000000)
                return '';
            return unit.repeat(count);
        }
        catch {
            return '';
        }
    }
    function makeUrl(candidate, checksum, title) {
        const url = getBaseUrl();
        const parts = [`${HASH_KEY}=${pack(candidate.scheme, candidate.payload)}`];
        if (checksum)
            parts.push(`k=${checksum}`);
        const safeTitle = normalizeTitle(title);
        if (safeTitle && safeTitle !== 'Hexa')
            parts.push(`ti=${encodeURIComponent(safeTitle)}`);
        url.hash = parts.join('&');
        return url.toString();
    }
    function gzipDeflateBody(bytes) {
        if (!bytes || bytes.length < 18 || bytes[0] !== 0x1f || bytes[1] !== 0x8b)
            return null;
        let i = 10;
        const flags = bytes[3] || 0;
        if (flags & 0x04) {
            if (i + 2 > bytes.length)
                return null;
            const xlen = bytes[i] | (bytes[i + 1] << 8);
            i += 2 + xlen;
        }
        if (flags & 0x08)
            while (i < bytes.length && bytes[i++] !== 0) { }
        if (flags & 0x10)
            while (i < bytes.length && bytes[i++] !== 0) { }
        if (flags & 0x02)
            i += 2;
        if (i >= bytes.length - 8)
            return null;
        return bytes.subarray(i, bytes.length - 8);
    }
    function decompressGzipWithPako(payload) {
        if (!window.pako)
            return '';
        try {
            return window.pako.ungzip(base64UrlToBytes(payload), { to: 'string' }) || '';
        }
        catch { }
        try {
            const body = gzipDeflateBody(base64UrlToBytes(payload));
            return body ? (window.pako.inflateRaw(body, { to: 'string' }) || '') : '';
        }
        catch { }
        return '';
    }
    async function decompressStreamFromBase64Url(payload, format) {
        if (typeof DecompressionStream === 'undefined')
            return '';
        try {
            const bytes = base64UrlToBytes(payload);
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
            const buffer = await new Response(stream).arrayBuffer();
            return dec.decode(buffer);
        }
        catch {
            return '';
        }
    }
    function decodeSync(scheme, payload) {
        try {
            if (scheme === 'r')
                return decodeURIComponent(payload);
            if (scheme === 'rs')
                return decodeRepeat(payload);
            if (scheme === 'u')
                return dec.decode(base64UrlToBytes(payload));
            if (scheme === 'lu' && window.LZString)
                return LZString.decompressFromEncodedURIComponent(payload) || '';
            if (scheme === 'lb' && window.LZString)
                return LZString.decompressFromBase64(base64UrlToB64(payload)) || '';
            if (scheme === 'gz')
                return decompressGzipWithPako(payload);
            if (window.SmartCompress)
                return window.SmartCompress.decompress(scheme, payload) || '';
            if (window.LZString)
                return LZString.decompressFromEncodedURIComponent(payload) || '';
        }
        catch { }
        return '';
    }
    function addCandidate(candidates, seen, scheme, payload, label) {
        if (!payload)
            return;
        const key = `${scheme}.${payload}`;
        if (seen.has(key))
            return;
        seen.add(key);
        candidates.push({ scheme, payload, size: payload.length, label: label || scheme });
    }
    async function build(text, title) {
        text = String(text || '');
        const candidates = [];
        const seen = new Set();
        addCandidate(candidates, seen, 'r', encodeURIComponent(text), 'raw-uri');
        try {
            addCandidate(candidates, seen, 'rs', encodeRepeat(text), 'repeat-struct');
        }
        catch { }
        try {
            addCandidate(candidates, seen, 'u', bytesToBase64Url(enc.encode(text)), 'utf8-b64url');
        }
        catch { }
        if (window.LZString) {
            try {
                addCandidate(candidates, seen, 'lu', LZString.compressToEncodedURIComponent(text), 'lz-uri');
            }
            catch { }
            try {
                addCandidate(candidates, seen, 'lb', b64ToBase64Url(LZString.compressToBase64(text)), 'lz-base64url');
            }
            catch { }
        }
        if (window.SmartCompress) {
            try {
                const evaluated = window.SmartCompress.evaluate(text);
                for (const item of evaluated?.variants || [])
                    addCandidate(candidates, seen, item.scheme, item.payload, item.scheme);
            }
            catch { }
        }
        const checksum = await digestShort(text);
        const safeTitle = normalizeTitle(title);
        const valid = [];
        for (const candidate of candidates) {
            const decoded = decodeSync(candidate.scheme, candidate.payload);
            if (decoded !== text)
                continue;
            const useChecksum = checksum && !['r', 'rs'].includes(candidate.scheme);
            const url = makeUrl(candidate, useChecksum ? checksum : '', safeTitle);
            valid.push({ ...candidate, url, urlLength: url.length, checksum: useChecksum ? checksum : '' });
        }
        valid.sort((a, b) => a.urlLength - b.urlLength || a.size - b.size);
        const best = valid[0] || {
            scheme: 'r',
            payload: encodeURIComponent(text),
            label: 'raw-uri',
            url: makeUrl({ scheme: 'r', payload: encodeURIComponent(text) }, '', safeTitle),
            urlLength: 0,
            checksum: ''
        };
        if (!best.urlLength)
            best.urlLength = best.url.length;
        const rawUrl = makeUrl({ scheme: 'r', payload: encodeURIComponent(text) }, '', safeTitle);
        const gain = rawUrl.length > 0 ? Math.max(0, 1 - (best.url.length / rawUrl.length)) : 0;
        return {
            url: best.url,
            scheme: best.scheme,
            codec: best.label,
            payloadLength: best.payload.length,
            urlLength: best.url.length,
            gain,
            isFragment: true,
            tooLong: best.url.length > URL_SOFT_LIMIT,
            overHardLimit: best.url.length > URL_HARD_LIMIT,
            verified: true
        };
    }
    function readFromLocation(locationObj = window.location) {
        const hash = String(locationObj.hash || '').replace(/^#/, '');
        if (!hash)
            return null;
        const raw = Object.create(null);
        for (const part of hash.split('&')) {
            const eq = part.indexOf('=');
            if (eq <= 0)
                continue;
            raw[part.slice(0, eq)] = part.slice(eq + 1);
        }
        const packed = raw[HASH_KEY];
        if (!packed)
            return null;
        const { scheme, payload } = splitPacked(packed);
        return { scheme, payload, checksum: raw.k || '', title: raw.ti ? decodeURIComponent(raw.ti) : '' };
    }
    async function decodeShare(share) {
        if (!share?.payload)
            return { text: '', checksumOk: null, title: share?.title || '' };
        let text = '';
        if (share.scheme === 'gz') {
            text = await decompressStreamFromBase64Url(share.payload, 'gzip');
            if (!text)
                text = decompressGzipWithPako(share.payload);
        }
        else {
            text = decodeSync(share.scheme, share.payload);
        }
        let checksumOk = null;
        if (text && share.checksum) {
            const actual = await digestShort(text, String(share.checksum).length);
            checksumOk = actual ? actual === share.checksum : null;
        }
        return { text, checksumOk, title: share.title || '' };
    }
    async function fetchServerShare() {
        return null;
    }
    function cleanAddressBar(title) {
        try {
            const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
            window.history.replaceState({}, title || document.title, cleanUrl);
        }
        catch { }
    }
    window.ShareOptimizer = {
        URL_SOFT_LIMIT,
        URL_HARD_LIMIT,
        build,
        readFromLocation,
        decode: decodeShare,
        fetchServerShare,
        cleanAddressBar,
        bytesToBase64Url,
        base64UrlToBytes,
        encodeRepeat,
        decodeRepeat,
        decodeSync
    };
})();
