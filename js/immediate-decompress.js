(function () {
    console.log('Immediate share loader running...');
    function setTextEverywhere(text, title) {
        if (!text)
            return false;
        window.__HEXA_BOOT_TEXT = text;
        try {
            localStorage.setItem('text', text);
        }
        catch (error) {
            console.warn('Failed to save shared text:', error);
        }
        if (title) {
            try {
                document.title = String(title).slice(0, 80) + ' - Hexa';
            }
            catch { }
        }
        const setTextarea = () => {
            const textarea = document.getElementById('textInput');
            if (!textarea)
                return false;
            textarea.value = text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setTextarea, { once: true });
        }
        setTextarea();
        setTimeout(setTextarea, 50);
        setTimeout(setTextarea, 250);
        setTimeout(setTextarea, 1000);
        setTimeout(setTextarea, 2200);
        return true;
    }
    function parseHashShare() {
        const hash = String(window.location.hash || '').replace(/^#/, '');
        if (!hash || !hash.includes('h2='))
            return null;
        const raw = Object.create(null);
        for (const part of hash.split('&')) {
            const eq = part.indexOf('=');
            if (eq <= 0)
                continue;
            raw[part.slice(0, eq)] = part.slice(eq + 1);
        }
        const packed = raw.h2;
        if (!packed)
            return null;
        const dot = packed.indexOf('.');
        return {
            scheme: dot >= 0 ? packed.slice(0, dot) : 'r',
            payload: dot >= 0 ? packed.slice(dot + 1) : packed,
            checksum: raw.k || '',
            title: raw.ti ? decodeURIComponent(raw.ti) : ''
        };
    }
    function b64UrlToBytes(value) {
        const pad = value.length % 4 === 2 ? '==' : value.length % 4 === 3 ? '=' : value.length % 4 === 1 ? '===' : '';
        const b64 = value.replace(/-/g, '+').replace(/_/g, '/') + pad;
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++)
            bytes[i] = bin.charCodeAt(i);
        return bytes;
    }
    function decodeRepeat(payload) {
        const value = String(payload || '');
        const dot = value.lastIndexOf('.');
        if (dot <= 0)
            return '';
        try {
            const unit = new TextDecoder().decode(b64UrlToBytes(value.slice(0, dot)));
            const count = parseInt(value.slice(dot + 1), 36);
            if (!unit || !Number.isFinite(count) || count < 0 || count > 2000000)
                return '';
            return unit.repeat(count);
        }
        catch (error) {
            console.warn('Immediate repeat decode failed:', error);
            return '';
        }
    }
    function decodeFallback(share) {
        if (!share || !share.payload)
            return '';
        try {
            if (share.scheme === 'r')
                return decodeURIComponent(share.payload);
            if (share.scheme === 'rs')
                return decodeRepeat(share.payload);
            if (share.scheme === 'u')
                return new TextDecoder().decode(b64UrlToBytes(share.payload));
            if (share.scheme === 'lu' && window.LZString)
                return window.LZString.decompressFromEncodedURIComponent(share.payload) || '';
            if (share.scheme === 'lb' && window.LZString) {
                const pad = share.payload.length % 4 === 2 ? '==' : share.payload.length % 4 === 3 ? '=' : share.payload.length % 4 === 1 ? '===' : '';
                return window.LZString.decompressFromBase64(share.payload.replace(/-/g, '+').replace(/_/g, '/') + pad) || '';
            }
            if (window.SmartCompress)
                return window.SmartCompress.decompress(share.scheme, share.payload) || '';
            if (window.LZString)
                return window.LZString.decompressFromEncodedURIComponent(share.payload) || '';
        }
        catch (error) {
            console.warn('Immediate fallback decode failed:', error);
        }
        return '';
    }
    async function loadFragmentShare() {
        const share = parseHashShare();
        if (!share)
            return false;
        try {
            if (window.ShareOptimizer) {
                const decoded = await window.ShareOptimizer.decode(share);
                if (decoded && decoded.text)
                    return setTextEverywhere(decoded.text, decoded.title || share.title);
            }
        }
        catch (error) {
            console.warn('Immediate ShareOptimizer decode failed:', error);
        }
        const text = decodeFallback(share);
        if (text)
            return setTextEverywhere(text, share.title);
        return false;
    }
    async function loadLegacyQueryShare() {
        const urlParams = new URLSearchParams(window.location.search);
        const isCompressed = urlParams.get('c') === '1';
        const compressedText = urlParams.get('t');
        const plainText = urlParams.get('text');
        const titleParam = urlParams.get('title');
        if (titleParam) {
            try {
                document.title = titleParam + ' - Hexa';
            }
            catch { }
        }
        if (plainText && !isCompressed)
            return setTextEverywhere(plainText, titleParam);
        if (isCompressed && compressedText) {
            const scheme = urlParams.get('s') || 'lu';
            const text = decodeFallback({ scheme, payload: compressedText, title: titleParam });
            if (text)
                return setTextEverywhere(text, titleParam);
        }
        return false;
    }
    async function boot() {
        for (let attempt = 0; attempt < 30; attempt++) {
            const loadedFragment = await loadFragmentShare();
            if (loadedFragment)
                return;
            if (attempt === 0) {
                const loadedLegacy = await loadLegacyQueryShare();
                if (loadedLegacy)
                    return;
            }
            await new Promise(resolve => setTimeout(resolve, 80));
        }
    }
    boot();
})();
