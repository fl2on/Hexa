function hexaApp() {
    return {
        darkMode: (window.Utils && window.Utils.SafeStorage ? window.Utils.SafeStorage.local.get('darkMode', true) !== false : (localStorage.getItem('darkMode') !== 'false')),
        title: 'Hexa',
        showNotificationToast: false,
        notificationMessage: '',
        notificationType: 'success',
        stats: {
            chars: 0,
            words: 0,
            readingTime: 0,
            sentences: 0,
            paragraphs: 0,
            avgWordsPerSentence: 0,
            avgCharsPerWord: 0,
            readabilityScore: 0
        },
        isOpen: false,
        shareURL: '',
        text: (() => {
            if (typeof window.__HEXA_BOOT_TEXT === 'string')
                return window.__HEXA_BOOT_TEXT;
            return String(window.TextStore ? window.TextStore.get() : (localStorage.getItem('text') || ''));
        })(),
        history: [],
        historyIndex: -1,
        maxHistory: 50,
        focusMode: false,
        searchOpen: false,
        searchTerm: '',
        replaceTerm: '',
        writingTime: 0,
        writingTimer: null,
        lastSaveTime: Date.now(),
        autoSaveInterval: null,
        statsUpdateTimeout: null,
        storageUpdateTimeout: null,
        historyUpdateTimeout: null,
        scrollTimeout: null,
        statsCache: {
            lastText: '',
            lastHash: '',
            cachedStats: null
        },
        formatOpen: false,
        devToolsOpen: false,
        writingStats: {
            totalSessions: 0,
            todayTime: 0,
            todayWords: 0
        },
        utilsOpen: false,
        selectedText: '',
        syntaxHighlight: false,
        currentTheme: 'default',
        telemetryView: '',
        aiOpen: false,
        aiFromLanguage: 'javascript',
        aiToLanguage: 'csharp',
        aiTargetLanguage: 'Spanish',
        aiContentTopic: '',
        aiContentType: 'article',
        aiContentLength: 'medium',
        aiChatMessage: '',
        aiChatHistory: [],
        aiProcessing: false,
        aiAbortController: null,
        aiHTMLDescription: '',
        aiSEOKeywords: '',
        aiRegexDescription: '',
        aiSQLDescription: '',
        aiEmailPurpose: '',
        aiEmailTone: 'professional',
        authMenuOpen: false,
        showBlockerDetails: false,
        puterAuth: {
            isAuthenticated: false,
            userInfo: null,
            isLoading: false,
            error: null,
            initialized: false,
            fallbackMode: true
        },
        lastNotificationTime: {},
        isBrave: navigator.userAgentData?.brands?.some(brand => brand.brand === 'Brave') || navigator.brave,
        updateStats() {
            if (typeof this.text !== 'string') {
                this.text = String(this.text || '');
            }
            const text = this.text || '';
            const textHash = this.simpleHash(text);
            if (this.statsCache.lastHash === textHash && this.statsCache.cachedStats) {
                this.stats = this.statsCache.cachedStats;
                return;
            }
            if (window.PerformanceOptimizer) {
                const optimizedStats = window.PerformanceOptimizer.getOptimizedStats(text);
                if (optimizedStats) {
                    this.stats = optimizedStats;
                    this.statsCache.lastText = text;
                    this.statsCache.lastHash = textHash;
                    this.statsCache.cachedStats = optimizedStats;
                    return;
                }
            }
            this.updateStatsLegacy(text);
            this.statsCache.lastText = text;
            this.statsCache.lastHash = textHash;
            this.statsCache.cachedStats = this.stats;
        },
        simpleHash(text) {
            let hash = 0;
            if (text.length === 0)
                return hash;
            for (let i = 0; i < text.length; i++) {
                const char = text.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash;
        },
        updateStatsLegacy(text) {
            const chars = text.length;
            if (chars > 10000) {
                this.updateStatsForLargeText(text, chars);
                return;
            }
            const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(word => word.length > 0).length;
            const lines = text === '' ? 0 : text.split('\n').length;
            const sentences = text === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
            const paragraphs = text === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
            const readingTime = Math.ceil(words / 200);
            const avgWordsPerSentence = sentences > 0 ? parseFloat((words / sentences).toFixed(1)) : 0;
            const avgCharsPerWord = words > 0 ? parseFloat((chars / words).toFixed(1)) : 0;
            const readabilityScore = this.calculateReadability(text, words, sentences);
            this.stats = {
                chars,
                words,
                lines,
                sentences,
                paragraphs,
                readingTime,
                avgWordsPerSentence,
                avgCharsPerWord,
                readabilityScore
            };
        },
        updateStatsForLargeText(text, chars) {
            const sampleSize = Math.min(5000, chars);
            const sample = text.substring(0, sampleSize);
            const ratio = chars / sampleSize;
            const sampleWords = sample.trim() === '' ? 0 : sample.trim().split(/\s+/).filter(word => word.length > 0).length;
            const sampleSentences = sample === '' ? 0 : sample.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
            const sampleParagraphs = sample === '' ? 0 : sample.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
            const words = Math.round(sampleWords * ratio);
            const sentences = Math.round(sampleSentences * ratio);
            const paragraphs = Math.round(sampleParagraphs * ratio);
            const lines = text.split('\n').length;
            const readingTime = Math.ceil(words / 200);
            this.stats = {
                chars,
                words,
                lines,
                sentences,
                paragraphs,
                readingTime,
                avgWordsPerSentence: sentences > 0 ? parseFloat((words / sentences).toFixed(1)) : 0,
                avgCharsPerWord: words > 0 ? parseFloat((chars / words).toFixed(1)) : 0,
                readabilityScore: 50
            };
        },
        calculateReadability(text, words, sentences) {
            if (sentences === 0 || words === 0)
                return 0;
            const syllables = this.countSyllables(text);
            const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
            return Math.max(0, Math.min(100, Math.round(score)));
        },
        countSyllables(text) {
            const words = text.toLowerCase().match(/\b\w+\b/g) || [];
            return words.reduce((count, word) => {
                word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
                word = word.replace(/^y/, '');
                const matches = word.match(/[aeiouy]{1,2}/g);
                return count + (matches ? matches.length : 1);
            }, 0);
        },
        formatText(format) {
            if (!this.text.trim()) {
                this.showNotification('❌ No text to format', 'error');
                return;
            }
            this.saveToHistory();
            try {
                let result = this.text;
                switch (format) {
                    case 'uppercase':
                        result = this.text.toUpperCase();
                        break;
                    case 'lowercase':
                        result = this.text.toLowerCase();
                        break;
                    case 'titlecase':
                        result = this.text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                        break;
                    case 'sentencecase':
                        result = this.text.charAt(0).toUpperCase() + this.text.slice(1).toLowerCase();
                        break;
                    case 'camelcase':
                        result = this.text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '');
                        break;
                    case 'snakecase':
                        result = this.text.toLowerCase().replace(/\s+/g, '_');
                        break;
                    case 'kebabcase':
                        result = this.text.toLowerCase().replace(/\s+/g, '-');
                        break;
                    case 'reverse':
                        result = this.text.split('').reverse().join('');
                        break;
                    case 'removeextraspaces':
                        result = this.text.replace(/\s+/g, ' ').trim();
                        break;
                    case 'removenewlines':
                        result = this.text.replace(/\n+/g, ' ').trim();
                        break;
                    case 'addnumbers':
                        result = this.text.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
                        break;
                    case 'removenumbers':
                        result = this.text.replace(/^\d+\.\s*/gm, '');
                        break;
                    case 'sortlines': {
                        const lines = this.text.split('\n');
                        const sorted = (window.Algos && Algos.quicksort3) ? Algos.quicksort3(lines) : lines.sort();
                        result = sorted.join('\n');
                        break;
                    }
                    case 'shufflelines':
                        const lines = this.text.split('\n');
                        for (let i = lines.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [lines[i], lines[j]] = [lines[j], lines[i]];
                        }
                        result = lines.join('\n');
                        break;
                    case 'removeduplicates':
                        result = [...new Set(this.text.split('\n'))].join('\n');
                        break;
                    case 'extractemails':
                        const emails = this.text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
                        result = emails ? emails.join('\n') : 'No emails found';
                        break;
                    case 'extracturls':
                        const urls = this.text.match(/https?:\/\/[^\s]+/g);
                        result = urls ? urls.join('\n') : 'No URLs found';
                        break;
                    case 'wordcount': {
                        const words = this.text.trim().split(/\s+/).filter(Boolean);
                        const freq = words.reduce((acc, w) => { const k = w.toLowerCase(); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
                        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
                        result = sorted.map(([w, c]) => `${w}: ${c}`).join('\n') || 'No words';
                        break;
                    }
                    default:
                        this.showNotification('❌ Unknown format', 'error');
                        return;
                }
                this.text = result;
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                }
                else {
                    try {
                        localStorage.setItem('text', this.text);
                    }
                    catch { }
                }
                this.updateStats();
                this.showNotification(`✨ Text formatted: ${format}`, 'success');
            }
            catch (error) {
                this.showNotification('❌ Formatting failed', 'error');
                console.error('Format error:', error);
            }
        },
        formatTime(milliseconds) {
            const seconds = Math.floor(milliseconds / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            if (hours > 0) {
                return `${hours}h ${minutes % 60}m`;
            }
            else if (minutes > 0) {
                return `${minutes}m ${seconds % 60}s`;
            }
            else {
                return `${seconds}s`;
            }
        },
        updateWritingStats() {
            if (window.writingTracker) {
                this.writingStats = window.writingTracker.getStats();
            }
        },
        handleOptimizedInput(event) {
            const textLength = this.text.length;
            const isLargeText = textLength > 10000;
            if (isLargeText) {
                this.debouncedUpdateStats();
                this.debouncedSaveToStorage();
                this.debouncedSaveToHistory();
            }
            else {
                this.updateStats();
                localStorage.setItem('text', this.text);
                this.saveToHistory();
            }
            this.startWritingTimer();
            this.applyPerformanceOptimizations(textLength);
        },
        applyPerformanceOptimizations(textLength) {
            const textarea = document.getElementById('textInput');
            if (!textarea)
                return;
            const isLargeText = textLength > 10000;
            const isHugeText = textLength > 50000;
            if (isHugeText) {
                textarea.classList.add('large-text', 'performance-optimized');
                textarea.style.contentVisibility = 'auto';
            }
            else if (isLargeText) {
                textarea.classList.add('large-text');
                textarea.classList.remove('performance-optimized');
                textarea.style.contentVisibility = 'visible';
            }
            else {
                textarea.classList.remove('large-text', 'performance-optimized');
                textarea.style.contentVisibility = 'visible';
            }
            const lineContainer = document.querySelector('.line-numbers-container');
            if (lineContainer) {
                if (this.stats.lines > 1000) {
                    lineContainer.classList.add('optimized');
                }
                else {
                    lineContainer.classList.remove('optimized');
                }
            }
        },
        debouncedUpdateStats() {
            if (this.statsUpdateTimeout) {
                clearTimeout(this.statsUpdateTimeout);
            }
            this.statsUpdateTimeout = setTimeout(() => {
                this.updateStats();
            }, 200);
        },
        debouncedSaveToStorage() {
            if (this.storageUpdateTimeout) {
                clearTimeout(this.storageUpdateTimeout);
            }
            this.storageUpdateTimeout = setTimeout(() => {
                localStorage.setItem('text', this.text);
            }, 500);
        },
        debouncedSaveToHistory() {
            if (this.historyUpdateTimeout) {
                clearTimeout(this.historyUpdateTimeout);
            }
            this.historyUpdateTimeout = setTimeout(() => {
                this.saveToHistory();
            }, 1000);
        },
        initPerformanceOptimizations() {
            const textarea = document.getElementById('textInput');
            if (textarea) {
                this.applyPerformanceOptimizations(this.text.length);
                textarea.addEventListener('scroll', this.throttleScrollHandler.bind(this), { passive: true });
                textarea.style.contain = 'layout style paint';
            }
            document.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.altKey && event.key === 'M') {
                    event.preventDefault();
                    this.showPerformanceMetrics();
                }
                if (event.key === 'F11') {
                    event.preventDefault();
                    this.toggleFocusMode();
                }
                else if (event.key === 'Escape' && this.focusMode) {
                    event.preventDefault();
                    this.exitFocusMode();
                }
            });
            document.addEventListener('fullscreenchange', () => {
                if (!document.fullscreenElement && this.focusMode) {
                    this.focusMode = false;
                    document.body.classList.remove('focus-mode-active');
                    this.showNotification('Focus mode disabled', 'success');
                }
            });
            document.addEventListener('webkitfullscreenchange', () => {
                if (!document.webkitFullscreenElement && this.focusMode) {
                    this.focusMode = false;
                    document.body.classList.remove('focus-mode-active');
                    this.showNotification('Focus mode disabled', 'success');
                }
            });
            document.addEventListener('msfullscreenchange', () => {
                if (!document.msFullscreenElement && this.focusMode) {
                    this.focusMode = false;
                    document.body.classList.remove('focus-mode-active');
                    this.showNotification('Focus mode disabled', 'success');
                }
            });
        },
        throttleScrollHandler() {
            if (this.scrollTimeout)
                return;
            this.scrollTimeout = setTimeout(() => {
                this.updateVisibleLineNumbers();
                this.scrollTimeout = null;
            }, 16);
        },
        updateVisibleLineNumbers() {
            const textarea = document.getElementById('textInput');
            const lineContainer = document.querySelector('.line-numbers-container');
            if (!textarea || !lineContainer || this.stats.lines <= 1000)
                return;
            if (window.PerformanceOptimizer) {
                window.PerformanceOptimizer.updateVirtualLineNumbers();
            }
        },
        showPerformanceMetrics() {
            if (window.PerformanceOptimizer) {
                window.PerformanceOptimizer.showPerformanceDialog();
            }
            else {
                const textLength = this.text.length;
                const isLargeText = textLength > 10000;
                this.showNotification(`📊 Text: ${textLength.toLocaleString()} chars ${isLargeText ? '(Large Text Mode)' : '(Normal Mode)'} - Press Ctrl+Alt+M for details`, 'info', { duration: 5000 });
            }
        },
        handleKeyDown(event) {
            const textarea = event.target;
            const cursorPos = textarea.selectionStart;
            const textBefore = this.text.substring(0, cursorPos);
            const textAfter = this.text.substring(cursorPos);
            if (event.key === 'Tab' && !event.shiftKey) {
                event.preventDefault();
                const suggestions = window.CodeFeatures?.getAutocomplete(this.text, cursorPos) || [];
                if (suggestions.length > 0) {
                    const currentWord = textBefore.split(/\s/).pop();
                    const suggestion = suggestions[0];
                    const replacement = suggestion.substring(currentWord.length);
                    this.text = textBefore + replacement + textAfter;
                    this.$nextTick(() => {
                        textarea.selectionStart = textarea.selectionEnd = cursorPos + replacement.length;
                    });
                }
                else {
                    this.text = textBefore + '  ' + textAfter;
                    this.$nextTick(() => {
                        textarea.selectionStart = textarea.selectionEnd = cursorPos + 2;
                    });
                }
            }
        },
        saveToHistory() {
            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            this.history.push(this.text);
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
            else {
                this.historyIndex++;
            }
        },
        undo() {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.text = this.history[this.historyIndex];
                this.updateStats();
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                }
                else {
                    try {
                        localStorage.setItem('text', this.text);
                    }
                    catch { }
                }
                this.showNotification('↶ Undone', 'success');
            }
        },
        redo() {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.text = this.history[this.historyIndex];
                this.updateStats();
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                }
                else {
                    try {
                        localStorage.setItem('text', this.text);
                    }
                    catch { }
                }
                this.showNotification('↷ Redone', 'success');
            }
        },
        toggleFocusMode() {
            if (this.focusMode) {
                this.exitFocusMode();
                return;
            }
            this.focusMode = true;
            document.body.classList.add('focus-mode-active');
            const root = document.documentElement;
            try {
                const request = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen || root.mozRequestFullScreen;
                if (request) {
                    const result = request.call(root);
                    if (result && typeof result.catch === 'function') {
                        result.catch(() => { });
                    }
                }
            }
            catch { }
            this.showNotification('Focus mode enabled. Press Escape or the top-right X to exit.', 'success');
            if (window.UXBrain) {
                try {
                    window.UXBrain.trackPanel('focus', true);
                    window.UXBrain.tick(this);
                }
                catch { }
            }
            this.$nextTick(() => {
                if (window.lucide)
                    lucide.createIcons({ attrs: { 'stroke-width': 1.85 } });
                const textarea = document.getElementById('textInput');
                if (textarea)
                    textarea.focus({ preventScroll: true });
            });
        },
        exitFocusMode() {
            this.focusMode = false;
            document.body.classList.remove('focus-mode-active');
            try {
                const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || document.mozFullScreenElement;
                if (fullscreenElement) {
                    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen;
                    if (exit) {
                        const result = exit.call(document);
                        if (result && typeof result.catch === 'function') {
                            result.catch(() => { });
                        }
                    }
                }
            }
            catch { }
            this.showNotification('Focus mode disabled', 'success');
            if (window.UXBrain) {
                try {
                    window.UXBrain.trackPanel('focus', false);
                }
                catch { }
            }
        },
        startWritingTimer() {
            if (!this.writingTimer) {
                this.writingTimer = setInterval(() => {
                    this.writingTime++;
                }, 1000);
            }
        },
        setupAutoSave() {
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
            }
            this.autoSaveInterval = setInterval(() => {
                this.saveToStorage();
            }, 30000);
        },
        saveToStorage() {
            try {
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                }
                else {
                    localStorage.setItem('text', this.text);
                }
                this.lastSaveTime = Date.now();
            }
            catch (error) {
                console.warn('Failed to save text:', error);
            }
        },
        stopWritingTimer() {
            if (this.writingTimer) {
                clearInterval(this.writingTimer);
                this.writingTimer = null;
            }
        },
        formatWritingTime() {
            const hours = Math.floor(this.writingTime / 3600);
            const minutes = Math.floor((this.writingTime % 3600) / 60);
            const seconds = this.writingTime % 60;
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            else if (minutes > 0) {
                return `${minutes}m ${seconds}s`;
            }
            else {
                return `${seconds}s`;
            }
        },
        exportText(format) {
            if (!this.text.trim()) {
                this.showNotification('❌ No text to export', 'error');
                return;
            }
            const blob = new Blob([this.text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showNotification(`📥 Exported as ${format.toUpperCase()}`, 'success');
        },
        searchAndReplace() {
            if (!this.searchTerm) {
                this.showNotification('❌ Enter search term', 'error');
                return;
            }
            const regex = new RegExp(this.searchTerm, 'gi');
            const matches = this.text.match(regex);
            if (!matches) {
                this.showNotification('❌ No matches found', 'error');
                return;
            }
            if (this.replaceTerm !== '') {
                this.saveToHistory();
                this.text = this.text.replace(regex, this.replaceTerm);
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                }
                else {
                    try {
                        localStorage.setItem('text', this.text);
                    }
                    catch { }
                }
                this.updateStats();
                this.showNotification(`🔄 Replaced ${matches.length} occurrence(s)`, 'success');
            }
            else {
                this.showNotification(`🔍 Found ${matches.length} occurrence(s)`, 'success');
            }
        },
        getTextAnalysis() {
            if (!this.text.trim()) {
                this.showNotification('❌ No text to analyze', 'error');
                return;
            }
            const words = this.text.trim().split(/\s+/);
            const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
            const longWords = words.filter(word => word.length > 6).length;
            const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
            this.showNotification(`📊 Avg word length: ${avgWordLength.toFixed(1)} | Long words: ${longWords} | Unique: ${uniqueWords}`, 'success');
        },
        clearText() {
            this.text = '';
            localStorage.removeItem('text');
            this.updateStats();
            this.showNotification('🗑️ Text cleared!', 'success');
        },
        async copyToClipboard() {
            try {
                await navigator.clipboard.writeText(this.text);
                this.showNotification('✨ Copied to clipboard!', 'success');
            }
            catch (err) {
                this.showNotification('❌ Failed to copy text', 'error');
            }
        },
        async generateShareURL(forceBest = false) {
            if (!String(this.text || '').trim()) {
                this.showNotification('No text to share', 'error');
                return;
            }
            try {
                let result = null;
                if (window.ShareOptimizer) {
                    result = await window.ShareOptimizer.build(this.text, this.title || 'Hexa');
                    this.shareURL = result.url;
                }
                else {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('text');
                    url.searchParams.delete('t');
                    url.searchParams.delete('c');
                    url.searchParams.delete('s');
                    url.searchParams.delete('title');
                    url.hash = '';
                    let payload = encodeURIComponent(this.text);
                    let scheme = 'r';
                    let gain = 0;
                    if (window.SmartCompress) {
                        const chosen = window.SmartCompress.compress(this.text);
                        if (chosen?.payload && chosen.payload.length < payload.length) {
                            payload = chosen.payload;
                            scheme = chosen.scheme;
                            gain = 1 - (payload.length / encodeURIComponent(this.text).length);
                        }
                    }
                    else if (window.LZString) {
                        const compressed = LZString.compressToEncodedURIComponent(this.text) || '';
                        if (compressed && compressed.length < payload.length) {
                            payload = compressed;
                            scheme = 'lu';
                            gain = 1 - (payload.length / encodeURIComponent(this.text).length);
                        }
                    }
                    url.hash = `h2=${scheme}.${payload}`;
                    this.shareURL = url.toString();
                    result = { scheme, gain, urlLength: this.shareURL.length, tooLong: this.shareURL.length > 7600, overHardLimit: this.shareURL.length > 16000 };
                }
                this.isOpen = true;
                this.$nextTick(() => { if (window.lucide)
                    lucide.createIcons({ attrs: { 'stroke-width': 1.85 } }); });
                const ratio = result?.gain > 0 ? ` (${(result.gain * 100).toFixed(1)}% smaller)` : '';
                const mode = result?.isFragment ? 'private fragment link' : 'share link';
                this.showNotification(`${mode} generated${ratio}`, 'success');
                if (result?.overHardLimit) {
                    setTimeout(() => this.showNotification('Link is extremely long. Use export or configure a backend short-link endpoint.', 'warning', { duration: 7000 }), 500);
                }
                else if (result?.tooLong) {
                    setTimeout(() => this.showNotification('Long private link. It should work in modern browsers, but chat apps may truncate it.', 'warning', { duration: 6500 }), 500);
                }
            }
            catch (error) {
                console.error('Error generating share URL:', error);
                this.showNotification('Failed to generate share URL', 'error');
            }
        },
        async copyShareURL() {
            try {
                await navigator.clipboard.writeText(this.shareURL);
                this.showNotification('Share URL copied', 'success');
                setTimeout(() => this.isOpen = false, 1000);
            }
            catch (err) {
                this.showNotification('Failed to copy URL', 'error');
            }
        },
        async shareNativeOrCopy() {
            try {
                const payload = { title: this.title || 'Hexa', text: 'Hexa share link', url: this.shareURL };
                if (navigator.share && (!navigator.canShare || navigator.canShare(payload))) {
                    await navigator.share(payload);
                    this.showNotification('Share sheet opened', 'success');
                    return;
                }
            }
            catch (error) {
                if (error?.name === 'AbortError')
                    return;
            }
            await this.copyShareURL();
        },
        getShareLinkStats() {
            if (!this.shareURL) {
                this.showNotification('No share link generated yet', 'error');
                return;
            }
            try {
                const url = new URL(this.shareURL);
                const fragment = url.hash ? url.hash.slice(1) : '';
                const isFragment = fragment.includes('h2=');
                const packed = isFragment ? fragment.split('&').find(p => p.startsWith('h2='))?.slice(3) : '';
                const scheme = packed && packed.includes('.') ? packed.slice(0, packed.indexOf('.')) : 'server/raw';
                const payloadLength = packed && packed.includes('.') ? packed.slice(packed.indexOf('.') + 1).length : 0;
                const rawLen = encodeURIComponent(this.text || '').length;
                const gain = payloadLength && rawLen ? Math.max(0, 1 - (payloadLength / rawLen)) : 0;
                const mode = isFragment ? 'Private fragment' : (url.searchParams.get('id') ? 'Public short ID' : 'Legacy query');
                const message = `${mode} link | ${this.shareURL.length} chars | codec: ${scheme}${gain ? ` | ${(gain * 100).toFixed(1)}% smaller` : ''}`;
                this.showNotification(message, this.shareURL.length > 7600 ? 'warning' : 'info', { duration: 6500 });
            }
            catch (error) {
                console.error('Error analyzing share link:', error);
                this.showNotification('Failed to analyze share link', 'error');
            }
        },
        detectSyntax() {
            if (!this.text.trim()) {
                this.showNotification('❌ No text to analyze', 'error');
                return;
            }
            window.detectSyntax();
        },
        handleDrop(event) {
            const file = event.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                this.text = e.target.result;
                this.updateStats();
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                }
                else {
                    try {
                        localStorage.setItem('text', this.text);
                    }
                    catch { }
                }
            };
            reader.readAsText(file);
        },
        showNotification(message, type = 'success') {
            const now = Date.now();
            const messageKey = `${message}_${type}`;
            if (this.isBrave && message.includes('Authentication cancelled')) {
                if (this.lastNotificationTime[messageKey] && now - this.lastNotificationTime[messageKey] < 5000) {
                    console.log('Suppressing repeated auth notification in Brave');
                    return;
                }
            }
            else if (this.lastNotificationTime[messageKey] && now - this.lastNotificationTime[messageKey] < 1000) {
                return;
            }
            this.lastNotificationTime[messageKey] = now;
            if (window.showNotification && typeof window.showNotification === 'function') {
                window.showNotification(message, type);
            }
            else {
                this.notificationMessage = message;
                this.notificationType = type;
                this.showNotificationToast = true;
                setTimeout(() => {
                    this.showNotificationToast = false;
                }, 3000);
            }
        },
        showTelemetry() {
            try {
                if (!window.SmartCompress) {
                    this.telemetryView = 'SmartCompress not available.';
                    return;
                }
                const raw = localStorage.getItem('SC.telemetry.v1');
                if (!raw) {
                    this.telemetryView = 'No telemetry yet. Generate a few Share URLs first.';
                    return;
                }
                const st = JSON.parse(raw);
                const parts = [];
                for (const [type, rec] of Object.entries(st.data || {})) {
                    const dom = Object.entries(rec.best || {}).sort((a, b) => b[1] - a[1])[0];
                    const domStr = dom ? `${dom[0]} (${dom[1]})` : 'n/a';
                    parts.push(`${type}: total=${rec.total}, dominant=${domStr}, avgGain=${(rec.avgGain * 100).toFixed(1)}%`);
                }
                this.telemetryView = parts.length ? parts.join('\n') : 'No telemetry data stored yet.';
            }
            catch (e) {
                console.error('Telemetry view failed', e);
                this.telemetryView = 'Failed to load telemetry.';
            }
        },
        analyzeCompression() {
            if (!this.text.trim()) {
                this.showNotification('❌ No text to analyze', 'error');
                return;
            }
            try {
                const originalSize = this.text.length;
                if (window.SmartCompress) {
                    const { rawSize, variants, lu } = window.SmartCompress.evaluate(this.text);
                    const type = window.SmartCompress.detectType(this.text);
                    const thr = window.SmartCompress.getAdaptiveThreshold(rawSize, type);
                    let message = `📊 Smart Compression Analysis:\n`;
                    message += `Raw: ${rawSize} chars | type: ${type} | adaptive thr: ${(thr * 100).toFixed(1)}%\n`;
                    if (variants.length === 0) {
                        message += `No compression variant available`;
                    }
                    else {
                        for (const v of variants) {
                            const gainVsLU = (lu && lu.size > 0) ? ((lu.size - v.size) / lu.size) : v.gain;
                            const pct = (gainVsLU * 100).toFixed(1);
                            const meta = v.scheme === 'w1' && v.meta ? ` (dict:${v.meta.dictSize}, repl:${v.meta.replaced}${v.meta.suffixDictSize != null ? `, suf:${v.meta.suffixDictSize}, sufRepl:${v.meta.suffixReplaced}` : ''})` : '';
                            message += `- ${v.scheme}: ${v.size} chars (gain vs LU: ${pct}%)${meta}\n`;
                        }
                    }
                    const best = variants[0];
                    if (best) {
                        const gainVsLU = (lu && lu.size > 0) ? ((lu.size - best.size) / lu.size) : best.gain;
                        message += `Best: ${best.scheme} → ${best.size} chars (${(gainVsLU * 100).toFixed(1)}%)\n`;
                    }
                    this.showNotification(message.trim(), 'info');
                }
                else {
                    const compressed = LZString.compressToEncodedURIComponent(this.text);
                    const compressedSize = compressed.length;
                    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
                    let message = `📊 Compression Analysis:\nOriginal: ${originalSize} chars\nCompressed: ${compressedSize} chars\nRatio: ${ratio}% reduction`;
                    this.showNotification(message, 'info');
                }
            }
            catch (error) {
                console.error('Compression analysis failed:', error);
                this.showNotification('❌ Compression analysis failed', 'error');
            }
        },
        minifyCode(type) {
            if (!this.text.trim()) {
                this.showNotification('❌ No code to minify', 'error');
                return;
            }
            this.saveToHistory();
            try {
                let result = this.text;
                switch (type) {
                    case 'js':
                        result = this.text
                            .replace(/\/\*[\s\S]*?\*\//g, '')
                            .replace(/\/\/.*$/gm, '')
                            .replace(/\s+/g, ' ')
                            .replace(/;\s*}/g, '}')
                            .replace(/\s*{\s*/g, '{')
                            .replace(/\s*;\s*/g, ';')
                            .trim();
                        break;
                    case 'css':
                        result = this.text
                            .replace(/\/\*[\s\S]*?\*\//g, '')
                            .replace(/\s+/g, ' ')
                            .replace(/;\s*}/g, '}')
                            .replace(/\s*{\s*/g, '{')
                            .replace(/;\s*/g, ';')
                            .replace(/:\s*/g, ':')
                            .trim();
                        break;
                    case 'html':
                        result = this.text
                            .replace(/<!--[\s\S]*?-->/g, '')
                            .replace(/\s+/g, ' ')
                            .replace(/>\s+</g, '><')
                            .replace(/\s+>/g, '>')
                            .trim();
                        break;
                    default:
                        this.showNotification('❌ Unknown minification type', 'error');
                        return;
                }
                this.text = result;
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                }
                else {
                    try {
                        localStorage.setItem('text', this.text);
                    }
                    catch { }
                }
                this.updateStats();
                this.showNotification(`🗜️ ${type.toUpperCase()} minified!`, 'success');
            }
            catch (error) {
                this.showNotification('❌ Minification failed', 'error');
                console.error('Minify error:', error);
            }
        },
        beautifyCode() {
            if (!this.text.trim()) {
                this.showNotification('❌ No code to beautify', 'error');
                return;
            }
            this.saveToHistory();
            try {
                let beautified = '';
                const text = this.text.trim();
                const codeType = this.detectCodeType(text);
                switch (codeType) {
                    case 'json':
                        beautified = this.beautifyJSON(text);
                        break;
                    case 'html':
                        beautified = this.beautifyHTML(text);
                        break;
                    case 'css':
                        beautified = this.beautifyCSS(text);
                        break;
                    case 'javascript':
                        beautified = this.beautifyJavaScript(text);
                        break;
                    case 'xml':
                        beautified = this.beautifyXML(text);
                        break;
                    default:
                        beautified = this.beautifyGeneric(text);
                }
                this.text = beautified;
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                }
                else {
                    try {
                        localStorage.setItem('text', this.text);
                    }
                    catch { }
                }
                this.updateStats();
                this.showNotification('✨ Code beautified!', 'success');
            }
            catch (error) {
                this.showNotification('❌ Beautification failed', 'error');
                console.error('Beautify error:', error);
            }
        },
        detectCodeType(text) {
            if ((text.startsWith('{') && text.endsWith('}')) ||
                (text.startsWith('[') && text.endsWith(']'))) {
                try {
                    JSON.parse(text);
                    return 'json';
                }
                catch (e) {
                }
            }
            if (text.includes('<!DOCTYPE') || text.includes('<html') ||
                /<\/?[a-z][\s\S]*>/i.test(text)) {
                return 'html';
            }
            if (text.startsWith('<?xml') || /<\?xml.*\?>/i.test(text)) {
                return 'xml';
            }
            if (text.includes('{') && text.includes('}') &&
                (text.includes(':') && text.includes(';')) ||
                /@[a-z-]+/.test(text)) {
                return 'css';
            }
            if (text.includes('function') || text.includes('=>') ||
                text.includes('const ') || text.includes('let ') ||
                text.includes('var ') || text.includes('class ')) {
                return 'javascript';
            }
            return 'generic';
        },
        beautifyJSON(text) {
            try {
                const parsed = JSON.parse(text);
                return JSON.stringify(parsed, null, 4);
            }
            catch (e) {
                throw new Error('Invalid JSON format');
            }
        },
        beautifyHTML(text) {
            let formatted = text;
            let indentLevel = 0;
            const indent = '    ';
            formatted = formatted.replace(/>\s+</g, '><');
            formatted = formatted.replace(/</g, '\n<');
            const lines = formatted.split('\n');
            const result = [];
            lines.forEach(line => {
                line = line.trim();
                if (!line)
                    return;
                if (line.startsWith('</')) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }
                result.push(indent.repeat(indentLevel) + line);
                if (line.startsWith('<') && !line.startsWith('</') &&
                    !line.endsWith('/>') && !line.includes('<!')) {
                    indentLevel++;
                }
            });
            return result.join('\n');
        },
        beautifyCSS(text) {
            let formatted = text;
            formatted = formatted.replace(/:\s*/g, ': ');
            formatted = formatted.replace(/;\s*/g, ';\n    ');
            formatted = formatted.replace(/\{\s*/g, ' {\n    ');
            formatted = formatted.replace(/\s*\}/g, '\n}');
            formatted = formatted.replace(/\}/g, '}\n\n');
            formatted = formatted.replace(/\n{3,}/g, '\n\n');
            return formatted.trim();
        },
        beautifyJavaScript(text) {
            let formatted = text;
            let indentLevel = 0;
            const indent = '    ';
            formatted = formatted.replace(/([=+\-*/<>!&|])\s*/g, ' $1 ');
            formatted = formatted.replace(/\s+([=+\-*/<>!&|])\s+/g, ' $1 ');
            formatted = formatted.replace(/,\s*/g, ', ');
            formatted = formatted.replace(/;\s*/g, ';\n');
            formatted = formatted.replace(/\{\s*/g, ' {\n');
            formatted = formatted.replace(/\s*\}/g, '\n}');
            const lines = formatted.split('\n');
            const result = [];
            lines.forEach(line => {
                line = line.trim();
                if (!line)
                    return;
                if (line.startsWith('}')) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }
                result.push(indent.repeat(indentLevel) + line);
                if (line.endsWith('{')) {
                    indentLevel++;
                }
            });
            return result.join('\n');
        },
        beautifyXML(text) {
            return this.beautifyHTML(text);
        },
        beautifyGeneric(text) {
            let indentLevel = 0;
            const lines = text.split('\n');
            const formattedLines = [];
            const indent = '    ';
            lines.forEach(line => {
                line = line.trim();
                if (!line) {
                    formattedLines.push('');
                    return;
                }
                if (/^[}\])]/.test(line)) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }
                formattedLines.push(indent.repeat(indentLevel) + line);
                if (/[{\[(]\s*$/.test(line)) {
                    indentLevel++;
                }
            });
            return formattedLines.join('\n');
        },
        generateCode(type) {
            this.saveToHistory();
            let generated = '';
            try {
                switch (type) {
                    case 'uuid':
                        generated = CodeGenerator.generateUUID();
                        break;
                    case 'password':
                        generated = CodeGenerator.generatePassword(16);
                        break;
                    case 'lorem':
                        generated = CodeGenerator.generateLoremIpsum(3);
                        break;
                    case 'json':
                        generated = CodeGenerator.generateSampleJSON();
                        break;
                    case 'html':
                        generated = CodeGenerator.generateHTML();
                        break;
                    case 'css':
                        generated = CodeGenerator.generateCSS();
                        break;
                    case 'javascript':
                        generated = CodeGenerator.generateJavaScript();
                        break;
                    case 'python':
                        generated = CodeGenerator.generatePython();
                        break;
                    case 'sql':
                        generated = CodeGenerator.generateSQL();
                        break;
                    default:
                        this.showNotification('❌ Code type not recognized', 'error');
                        return;
                }
                this.text = generated;
                this.updateStats();
                this.showNotification(`✨ ${type.toUpperCase()} generado exitosamente!`, 'success');
            }
            catch (error) {
                this.showNotification('❌ Error generating code', 'error');
                console.error('Generate code error:', error);
            }
        },
        processUtils(type, action) {
            if (!this.text.trim()
                && !['uuid', 'diff'].includes(type)
                && !(type === 'social' && ['waLink', 'discordTimeNow'].includes(action))) {
                this.showNotification('❌ No text to process', 'error');
                return;
            }
            this.saveToHistory();
            let result = this.text;
            try {
                switch (type) {
                    case 'social':
                        {
                            const t = this.text || '';
                            if (action === 'waLink') {
                                const phone = (this.searchTerm || '').replace(/\D+/g, '');
                                const msg = encodeURIComponent(t.trim());
                                result = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
                                this.showNotification('📲 WhatsApp link generated', 'success');
                            }
                            else if (action === 'waBold') {
                                result = `*${t}*`;
                            }
                            else if (action === 'waItalic') {
                                result = `_${t}_`;
                            }
                            else if (action === 'waMono') {
                                result = '`' + t + '`';
                            }
                            else if (action === 'xSplit') {
                                const chunks = [];
                                const max = 280;
                                const words = t.split(/\s+/);
                                let cur = '';
                                for (const w of words) {
                                    if ((cur + (cur ? ' ' : '') + w).length > max) {
                                        chunks.push(cur);
                                        cur = w;
                                    }
                                    else {
                                        cur = cur ? cur + ' ' + w : w;
                                    }
                                }
                                if (cur)
                                    chunks.push(cur);
                                result = chunks.map((c, i) => `(${i + 1}/${chunks.length}) ${c}`).join('\n\n');
                            }
                            else if (action === 'tweetLink') {
                                const msg = encodeURIComponent(t.trim());
                                if (!msg) {
                                    this.showNotification('Write a message to share', 'warning');
                                    return;
                                }
                                result = `https://twitter.com/intent/tweet?text=${msg}`;
                                this.showNotification('🐦 Twitter intent link', 'success');
                            }
                            else if (action === 'tgShare') {
                                const msg = encodeURIComponent(t.trim());
                                if (!msg) {
                                    this.showNotification('Write a message to share', 'warning');
                                    return;
                                }
                                result = `https://t.me/share/url?url=&text=${msg}`;
                                this.showNotification('✈️ Telegram share link', 'success');
                            }
                            else if (action === 'discordTimeNow') {
                                const now = Math.floor(Date.now() / 1000);
                                result = `<t:${now}:F>`;
                                this.showNotification('🕒 Discord time tag', 'success');
                            }
                            else if (action === 'slackLinkify') {
                                result = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');
                            }
                            else if (action === 'slackFormat') {
                                result = t.replace(/\*\*(.*?)\*\*/g, '*$1*').replace(/_(.*?)_/g, '_$1_').replace(/`([^`]+)`/g, '```$1```');
                            }
                            else if (action === 'tgEscape') {
                                result = t.replace(/([_\*\[\]\(\)~`>#+\-=\|{}\.\!])/g, '\\$1');
                            }
                            else if (action === 'tgCodeBlock') {
                                result = '```\n' + t + '\n```';
                            }
                            else if (action === 'redditSpoiler') {
                                result = '>!' + t + '!<';
                            }
                            else if (action === 'ytTimestamps') {
                                const lines = t.split(/\r?\n/).filter(Boolean);
                                const norm = (s) => {
                                    const m = s.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
                                    if (!m)
                                        return s;
                                    const h = parseInt(m[1], 10), mi = parseInt(m[2], 10), se = m[3] ? parseInt(m[3], 10) : 0;
                                    return (h ? h + ':' : '') + String(mi).padStart(h ? 2 : 1, '0') + ':' + String(se).padStart(2, '0');
                                };
                                result = lines.map(l => {
                                    const parts = l.split(/\s+-\s+|\s+\|\s+|\s+/);
                                    const ts = norm(parts[0]);
                                    const title = l.slice(l.indexOf(parts[1] || '') >= 0 ? l.indexOf(parts[1]) : (ts.length)).trim();
                                    return ts + ' - ' + (title || '');
                                }).join('\n');
                            }
                            else {
                                this.showNotification('❌ Unknown social action', 'error');
                                return;
                            }
                            break;
                        }
                        if (window.AutoOpt)
                            try {
                                window.AutoOpt.trackUsage({ group: type, action });
                            }
                            catch { }
                    case 'fancy': {
                        if (action === 'bold') {
                            result = (window.Utils && window.Utils.Text) ? window.Utils.Text.toBoldUnicode(this.text) : this.text;
                            this.showNotification('✨ Bold Unicode applied', 'success');
                        }
                        else if (action === 'mono') {
                            result = (window.Utils && window.Utils.Text) ? window.Utils.Text.toMonospace(this.text) : this.text;
                            this.showNotification('✨ Monospace Unicode applied', 'success');
                        }
                        else {
                            this.showNotification('❌ Unknown fancy action', 'error');
                            return;
                        }
                        break;
                    }
                    case 'regex': {
                        const pattern = this.searchTerm || '';
                        if (!pattern) {
                            this.showNotification('❌ Enter a regex in Find panel', 'error');
                            return;
                        }
                        let flags = 'gmi';
                        let re;
                        try {
                            re = new RegExp(pattern, flags);
                        }
                        catch (e) {
                            this.showNotification('❌ Invalid regex: ' + e.message, 'error');
                            return;
                        }
                        if (action === 'test') {
                            const matched = re.test(this.text);
                            result = `Regex: /${pattern}/${flags}\nMatched: ${matched}`;
                            this.showNotification('🧩 Regex tested', 'success');
                        }
                        else if (action === 'extract') {
                            const matches = [...this.text.matchAll(re)];
                            if (matches.length === 0) {
                                result = 'No matches found';
                            }
                            else {
                                result = matches.map((m, i) => `#${i + 1}: ${m[0]}${m.length > 1 ? '\n' + m.slice(1).map((g, gi) => `  ($${gi + 1}): ${g}`).join('\n') : ''}`).join('\n');
                            }
                            this.showNotification('🧩 Groups extracted', 'success');
                        }
                        break;
                    }
                    case 'convert': {
                        if (action === 'csvtojson') {
                            const lines = this.text.split(/\r?\n/).filter(Boolean);
                            if (lines.length === 0) {
                                result = '[]';
                                break;
                            }
                            const headers = lines[0].split(',').map(h => h.trim());
                            const rows = lines.slice(1).map(line => {
                                const cells = line.split(',');
                                const obj = {};
                                headers.forEach((h, idx) => obj[h] = (cells[idx] || '').trim());
                                return obj;
                            });
                            result = JSON.stringify(rows, null, 2);
                            this.showNotification('🔁 CSV → JSON', 'success');
                        }
                        else if (action === 'jsontocsv') {
                            try {
                                const arr = JSON.parse(this.text);
                                if (!Array.isArray(arr) || arr.length === 0) {
                                    result = '';
                                    break;
                                }
                                const headers = Array.from(new Set(arr.flatMap(o => Object.keys(o))));
                                const csv = [headers.join(',')].concat(arr.map(o => headers.map(h => (o[h] ?? '').toString().replace(/"/g, '""')).join(','))).join('\n');
                                result = csv;
                                this.showNotification('🔁 JSON → CSV', 'success');
                            }
                            catch (e) {
                                this.showNotification('❌ Invalid JSON', 'error');
                                return;
                            }
                        }
                        break;
                    }
                    case 'time': {
                        if (action === 'epoch2date') {
                            const num = Number(this.text.trim());
                            const ms = ('' + num).length <= 10 ? num * 1000 : num;
                            const d = new Date(ms);
                            result = isNaN(d.getTime()) ? 'Invalid epoch' : d.toISOString();
                            this.showNotification('⏱️ Epoch → Date', 'success');
                        }
                        else if (action === 'date2epoch') {
                            const d = new Date(this.text.trim());
                            result = isNaN(d.getTime()) ? 'Invalid date' : Math.floor(d.getTime() / 1000).toString();
                            this.showNotification('⏱️ Date → Epoch', 'success');
                        }
                        break;
                    }
                    case 'unicode': {
                        if (action === 'removediacritics') {
                            result = this.text.normalize('NFD').replace(/[\u0300-\u036f]+/g, '');
                            this.showNotification('🌐 Removed diacritics', 'success');
                        }
                        else if (action === 'normalize') {
                            result = this.text.normalize('NFKC');
                            this.showNotification('🌐 Normalized (NFKC)', 'success');
                        }
                        else if (action === 'slugify') {
                            result = this.text.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
                                .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                            this.showNotification('🌐 Slugified', 'success');
                        }
                        break;
                    }
                    case 'jwt': {
                        if (action === 'decode') {
                            try {
                                const [h, p, s] = this.text.split('.');
                                const dec = (v) => JSON.parse(decodeURIComponent(escape(atob(v.replace(/-/g, '+').replace(/_/g, '/')))));
                                const out = { header: dec(h), payload: dec(p), signature: s || '' };
                                result = JSON.stringify(out, null, 2);
                                this.showNotification('🧾 JWT decoded', 'success');
                            }
                            catch (e) {
                                this.showNotification('❌ Invalid JWT', 'error');
                                return;
                            }
                        }
                        break;
                    }
                    case 'url': {
                        if (!this._memoURL) {
                            this._memoURL = {
                                q2j: window.Utils?.memoizeByInput((q) => {
                                    const params = new URLSearchParams(q);
                                    const obj = {};
                                    for (const [k, v] of params.entries()) {
                                        if (obj[k])
                                            obj[k] = [].concat(obj[k], v);
                                        else
                                            obj[k] = v;
                                    }
                                    return obj;
                                }, { max: 300 }),
                                j2q: window.Utils?.memoizeByInput((obj) => {
                                    const params = new URLSearchParams();
                                    Object.entries(obj).forEach(([k, v]) => { if (Array.isArray(v))
                                        v.forEach(x => params.append(k, x));
                                    else
                                        params.set(k, v); });
                                    return '?' + params.toString();
                                }, { max: 300 })
                            };
                        }
                        if (action === 'querytojson') {
                            const q = this.text.trim().replace(/^\?/, '');
                            const obj = this._memoURL.q2j(q);
                            result = JSON.stringify(obj, null, 2);
                            this.showNotification('🔗 Query → JSON', 'success');
                        }
                        else if (action === 'jsontoquery') {
                            try {
                                const obj = JSON.parse(this.text);
                                result = this._memoURL.j2q(obj);
                                this.showNotification('🔗 JSON → Query', 'success');
                            }
                            catch (e) {
                                this.showNotification('❌ Invalid JSON', 'error');
                                return;
                            }
                        }
                        break;
                    }
                    case 'diff': {
                        const prev = this.historyIndex > 0 ? this.history[this.historyIndex - 1] : '';
                        const a = (prev || '').split('\n');
                        const b = this.text.split('\n');
                        function unifiedDiff(a, b) {
                            const out = [];
                            const max = Math.max(a.length, b.length);
                            for (let i = 0; i < max; i++) {
                                const la = a[i] ?? '', lb = b[i] ?? '';
                                if (la === lb) {
                                    out.push(' ' + lb);
                                }
                                else {
                                    if (la)
                                        out.push('-' + la);
                                    if (lb)
                                        out.push('+' + lb);
                                }
                            }
                            return out.join('\n');
                        }
                        if (action === 'summary') {
                            const setA = new Set(a);
                            const setB = new Set(b);
                            let added = 0, removed = 0;
                            for (const line of b)
                                if (!setA.has(line))
                                    added++;
                            for (const line of a)
                                if (!setB.has(line))
                                    removed++;
                            result = `Diff summary:\n+ Added: ${added}\n- Removed: ${removed}`;
                            this.showNotification('🧪 Diff summary created', 'success');
                        }
                        else if (action === 'insert') {
                            result = unifiedDiff(a, b);
                            this.showNotification('🧪 Unified diff inserted', 'success');
                        }
                        break;
                    }
                    case 'uuid': {
                        if (action === 'batch') {
                            const gen = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                                return v.toString(16);
                            });
                            result = Array.from({ length: 10 }, gen).join('\n');
                            this.showNotification('🆔 UUIDs generated', 'success');
                        }
                        break;
                    }
                    case 'discord':
                        switch (action) {
                            case 'bold':
                                result = `**${this.text}**`;
                                break;
                            case 'italic':
                                result = `*${this.text}*`;
                                break;
                            case 'underline':
                                result = `__${this.text}__`;
                                break;
                            case 'strikethrough':
                                result = `~~${this.text}~~`;
                                break;
                            case 'code':
                                result = `\`${this.text}\``;
                                break;
                            case 'spoiler':
                                result = `||${this.text}||`;
                                break;
                            case 'codeblock':
                                result = `\`\`\`\n${this.text}\n\`\`\``;
                                break;
                            case 'embed':
                                const lines = this.text.split('\n');
                                const title = lines[0] || 'Embed Title';
                                const description = lines.slice(1).join('\n') || 'Embed Description';
                                result = JSON.stringify({
                                    embeds: [{
                                            title: title,
                                            description: description,
                                            color: 0x00ff00,
                                            timestamp: new Date().toISOString(),
                                            footer: { text: "Generated by Hexa" }
                                        }]
                                }, null, 2);
                                break;
                            default:
                                this.showNotification('❌ Unknown Discord action', 'error');
                                return;
                        }
                        this.showNotification(`💬 Discord: ${action}`, 'success');
                        break;
                    case 'hash':
                        switch (action) {
                            case 'md5':
                                result = window.HashUtils ? window.HashUtils.simpleHash(this.text, 'md5') : this.simpleHash(this.text, 'md5');
                                break;
                            case 'sha256':
                                if (window.HashUtils && window.HashUtils.sha256) {
                                    window.HashUtils.sha256(this.text).then(hash => {
                                        this.text = hash;
                                        this.updateStats();
                                        this.showNotification('🔐 SHA256 hash generated!', 'success');
                                    });
                                    return;
                                }
                                else {
                                    result = this.simpleHash(this.text, 'sha256');
                                }
                                break;
                            case 'base64encode':
                                result = window.HashUtils ? window.HashUtils.base64Encode(this.text) : btoa(unescape(encodeURIComponent(this.text)));
                                break;
                            case 'base64decode':
                                result = window.HashUtils ? window.HashUtils.base64Decode(this.text) : (() => {
                                    try {
                                        return decodeURIComponent(escape(atob(this.text)));
                                    }
                                    catch (e) {
                                        return 'Invalid Base64';
                                    }
                                })();
                                break;
                            case 'urlencode':
                                result = window.HashUtils ? window.HashUtils.urlEncode(this.text) : encodeURIComponent(this.text);
                                break;
                            case 'urldecode':
                                result = window.HashUtils ? window.HashUtils.urlDecode(this.text) : (() => {
                                    try {
                                        return decodeURIComponent(this.text);
                                    }
                                    catch (e) {
                                        return 'Invalid URL encoding';
                                    }
                                })();
                                break;
                            case 'htmlencode':
                                result = window.HashUtils ? window.HashUtils.htmlEncode(this.text) : (() => {
                                    const div = document.createElement('div');
                                    div.textContent = this.text;
                                    return div.innerHTML;
                                })();
                                break;
                            case 'htmldecode':
                                result = window.HashUtils ? window.HashUtils.htmlDecode(this.text) : (() => {
                                    const div2 = document.createElement('div');
                                    div2.innerHTML = this.text;
                                    return div2.textContent || div2.innerText || '';
                                })();
                                break;
                            default:
                                this.showNotification('❌ Unknown hash action', 'error');
                                return;
                        }
                        this.showNotification(`🔐 ${action}`, 'success');
                        break;
                    default:
                        this.showNotification('❌ Unknown utility type', 'error');
                        return;
                }
                this.text = result;
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                }
                else {
                    try {
                        localStorage.setItem('text', this.text);
                    }
                    catch { }
                }
                this.updateStats();
                if (window.AutoOpt) {
                    try {
                        window.AutoOpt.trackUsage({ group: type, action });
                    }
                    catch { }
                }
            }
            catch (error) {
                this.showNotification('❌ Processing failed: ' + error.message, 'error');
                console.error('Process error:', error);
            }
        },
        simpleHash(text, type) {
            let hash = 0;
            if (text.length === 0)
                return hash.toString();
            for (let i = 0; i < text.length; i++) {
                const char = text.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(16) + '_' + type;
        },
        processLua(action) {
            if (!this.text.trim()) {
                this.showNotification('❌ No Lua code to process', 'error');
                return;
            }
            this.saveToHistory();
            try {
                let result = this.text;
                if (action === 'obfuscate') {
                    const variables = this.text.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
                    const uniqueVars = [...new Set(variables)];
                    const luaKeywords = ['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while'];
                    uniqueVars.forEach((variable) => {
                        if (!luaKeywords.includes(variable)) {
                            const obfuscatedVar = '_' + Math.random().toString(36).substr(2, 8);
                            result = result.replace(new RegExp('\\b' + variable + '\\b', 'g'), obfuscatedVar);
                        }
                    });
                    result = result.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
                    this.showNotification('🔒 Lua code obfuscated', 'success');
                }
                else if (action === 'deobfuscate') {
                    let indentLevel = 0;
                    const lines = result.split(/\s*\n\s*/);
                    const formattedLines = [];
                    lines.forEach(line => {
                        line = line.trim();
                        if (!line)
                            return;
                        if (/^(end|else|elseif|until)/.test(line)) {
                            indentLevel = Math.max(0, indentLevel - 1);
                        }
                        formattedLines.push('  '.repeat(indentLevel) + line);
                        if (/(function|if|for|while|repeat|do)/.test(line) && !line.includes('end')) {
                            indentLevel++;
                        }
                    });
                    result = formattedLines.join('\n');
                    this.showNotification('🔓 Lua code formatted', 'success');
                }
                this.text = result;
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                }
                else {
                    try {
                        localStorage.setItem('text', this.text);
                    }
                    catch { }
                }
                this.updateStats();
            }
            catch (error) {
                this.showNotification('❌ Lua processing failed', 'error');
                console.error('Lua error:', error);
            }
        },
        closeOtherPanels(keepOpen = null) {
            if (keepOpen !== 'format')
                this.formatOpen = false;
            if (keepOpen !== 'utils')
                this.utilsOpen = false;
            if (keepOpen !== 'dev')
                this.devToolsOpen = false;
            if (keepOpen !== 'search')
                this.searchOpen = false;
            if (keepOpen !== 'ai')
                this.aiOpen = false;
        },
        togglePanel(panel) {
            switch (panel) {
                case 'format':
                    this.closeOtherPanels('format');
                    this.formatOpen = !this.formatOpen;
                    if (window.AutoOpt) {
                        try {
                            window.AutoOpt.trackPanel('format', this.formatOpen);
                        }
                        catch { }
                    }
                    if (window.UXBrain) {
                        try {
                            window.UXBrain.trackPanel('format', this.formatOpen);
                        }
                        catch { }
                    }
                    break;
                case 'utils':
                    this.closeOtherPanels('utils');
                    this.utilsOpen = !this.utilsOpen;
                    if (window.AutoOpt) {
                        try {
                            window.AutoOpt.trackPanel('utils', this.utilsOpen);
                        }
                        catch { }
                    }
                    if (window.UXBrain) {
                        try {
                            window.UXBrain.trackPanel('utils', this.utilsOpen);
                        }
                        catch { }
                    }
                    break;
                case 'dev':
                    this.closeOtherPanels('dev');
                    this.devToolsOpen = !this.devToolsOpen;
                    if (window.AutoOpt) {
                        try {
                            window.AutoOpt.trackPanel('dev', this.devToolsOpen);
                        }
                        catch { }
                    }
                    if (window.UXBrain) {
                        try {
                            window.UXBrain.trackPanel('dev', this.devToolsOpen);
                        }
                        catch { }
                    }
                    break;
                case 'search':
                    this.closeOtherPanels('search');
                    this.searchOpen = !this.searchOpen;
                    if (window.AutoOpt) {
                        try {
                            window.AutoOpt.trackPanel('search', this.searchOpen);
                        }
                        catch { }
                    }
                    if (window.UXBrain) {
                        try {
                            window.UXBrain.trackPanel('search', this.searchOpen);
                        }
                        catch { }
                    }
                    break;
                case 'ai':
                    this.closeOtherPanels('ai');
                    this.aiOpen = !this.aiOpen;
                    if (window.AutoOpt) {
                        try {
                            window.AutoOpt.trackPanel('ai', this.aiOpen);
                        }
                        catch { }
                    }
                    if (window.UXBrain) {
                        try {
                            window.UXBrain.trackPanel('ai', this.aiOpen);
                        }
                        catch { }
                    }
                    break;
            }
        },
        getSelectedText() {
            const textarea = document.getElementById('textInput');
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                this.selectedText = this.text.substring(start, end);
                return this.selectedText;
            }
            return '';
        },
        formatSelectedText(format) {
            const textarea = document.getElementById('textInput');
            if (!textarea)
                return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            if (start === end) {
                this.showNotification('❌ No text selected', 'error');
                return;
            }
            this.saveToHistory();
            const selectedText = this.text.substring(start, end);
            const formattedText = window.TextFormatter && window.TextFormatter.formatText
                ? window.TextFormatter.formatText(selectedText, format)
                : selectedText;
            this.text = this.text.substring(0, start) + formattedText + this.text.substring(end);
            if (window.TextStore) {
                window.TextStore.set(this.text);
            }
            else {
                try {
                    localStorage.setItem('text', this.text);
                }
                catch { }
            }
            this.updateStats();
            this.$nextTick(() => {
                textarea.selectionStart = start;
                textarea.selectionEnd = start + formattedText.length;
                textarea.focus();
            });
            this.showNotification(`✨ Selected text formatted: ${format}`, 'success');
        },
        waitForDependencies() {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 50;
                const checkDependencies = () => {
                    attempts++;
                    const hasLZString = !!window.LZString;
                    const hasSmartCompress = !!window.SmartCompress;
                    console.log(`Dependency check attempt ${attempts}:`, { hasLZString, hasSmartCompress });
                    if (hasLZString && hasSmartCompress) {
                        console.log('All dependencies loaded successfully');
                        resolve();
                    }
                    else if (attempts >= maxAttempts) {
                        console.warn('Timeout waiting for dependencies. Proceeding anyway.', { hasLZString, hasSmartCompress });
                        resolve();
                    }
                    else {
                        setTimeout(checkDependencies, 100);
                    }
                };
                checkDependencies();
            });
        },
        async loadFromURL() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const fragmentShare = window.ShareOptimizer ? window.ShareOptimizer.readFromLocation(window.location) : null;
                const serverShareId = urlParams.get('id');
                const isCompressed = urlParams.get('c') === '1';
                const scheme = urlParams.get('s') || 'lu';
                const plainText = urlParams.get('text') || (urlParams.get('share-target') && urlParams.get('url') ? urlParams.get('url') : null);
                const compressedText = urlParams.get('t');
                const titleParam = (fragmentShare && fragmentShare.title) || urlParams.get('title');
                let textToLoad = null;
                let checksumOk = null;
                if (fragmentShare) {
                    const decoded = await window.ShareOptimizer.decode(fragmentShare);
                    textToLoad = decoded.text;
                    checksumOk = decoded.checksumOk;
                    if (!textToLoad)
                        throw new Error('Fragment share decode failed');
                }
                else if (serverShareId && window.ShareOptimizer) {
                    const decoded = await window.ShareOptimizer.fetchServerShare(serverShareId);
                    if (decoded) {
                        textToLoad = decoded.text;
                        if (decoded.title)
                            this.title = decoded.title;
                    }
                    if (!textToLoad)
                        throw new Error('Server share decode failed');
                }
                else if (isCompressed && compressedText) {
                    if (window.SmartCompress && scheme !== 'raw') {
                        textToLoad = window.SmartCompress.decompress(scheme, compressedText);
                    }
                    if (!textToLoad && window.LZString) {
                        textToLoad = window.LZString.decompressFromEncodedURIComponent(compressedText);
                    }
                    if (!textToLoad)
                        throw new Error('Compressed query decode failed');
                }
                else if (plainText) {
                    textToLoad = plainText;
                }
                if (textToLoad) {
                    this.text = textToLoad;
                    const textarea = document.getElementById('textInput');
                    if (textarea)
                        textarea.value = textToLoad;
                    if (window.TextStore) {
                        window.TextStore.set(textToLoad);
                    }
                    else {
                        try {
                            localStorage.setItem('text', textToLoad);
                        }
                        catch { }
                    }
                    if (titleParam) {
                        this.title = String(titleParam).substring(0, 80);
                        document.title = this.title + ' - Hexa';
                    }
                    this.updateStats();
                    if (window.ShareOptimizer)
                        window.ShareOptimizer.cleanAddressBar(document.title);
                    else {
                        const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }
                    if (checksumOk === false) {
                        this.showNotification('Shared text loaded, but integrity check failed', 'warning');
                    }
                    else {
                        this.showNotification(fragmentShare ? 'Private share loaded' : (serverShareId ? 'Public share loaded' : 'Shared text loaded'), 'success');
                    }
                    return;
                }
                if (titleParam) {
                    this.title = String(titleParam).substring(0, 80);
                    document.title = this.title + ' - Hexa';
                }
            }
            catch (error) {
                console.error('Error loading from URL:', error);
                this.showNotification('Failed to load shared text', 'error');
            }
        },
        debugDecompression() {
            const urlParams = new URLSearchParams(window.location.search);
            const compressedText = urlParams.get('t');
            const isCompressed = urlParams.get('c') === '1';
            const scheme = urlParams.get('s') || 'lu';
            console.log('=== DEBUG DECOMPRESSION ===');
            console.log('URL params:', { isCompressed, scheme, hasCompressed: !!compressedText });
            console.log('Dependencies:', { LZString: !!window.LZString, SmartCompress: !!window.SmartCompress });
            console.log('Current text length:', this.text.length);
            if (compressedText && isCompressed) {
                try {
                    const decompressed = window.LZString.decompressFromEncodedURIComponent(compressedText);
                    console.log('Decompression result:', decompressed ? `${decompressed.length} chars` : 'null');
                    if (decompressed) {
                        console.log('Setting text manually...');
                        this.text = decompressed;
                        const textarea = document.getElementById('textInput');
                        if (textarea) {
                            textarea.value = decompressed;
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            console.log('Textarea updated manually');
                        }
                        this.updateStats();
                        console.log('Manual decompression complete');
                        return decompressed;
                    }
                }
                catch (error) {
                    console.error('Manual decompression failed:', error);
                }
            }
            return null;
        },
        init() {
            this.aiProcessing = false;
            if (typeof this.text !== 'string') {
                this.text = String(this.text || '');
            }
            this.waitForDependencies().then(async () => {
                await this.loadFromURL();
                this.saveToHistory();
                this.updateWritingStats();
                this.initPerformanceOptimizations();
            }).catch(async (error) => {
                console.warn('Failed to wait for dependencies:', error);
                await this.loadFromURL();
                this.saveToHistory();
                this.updateWritingStats();
                this.initPerformanceOptimizations();
            });
            window.debugDecompression = () => this.debugDecompression();
            setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const hasFragmentShare = window.location.hash && window.location.hash.includes('h2=');
                if (((urlParams.get('c') === '1' && urlParams.get('t')) || hasFragmentShare) && this.text.length === 0) {
                    console.log('Backup share loading triggered...');
                    this.loadFromURL();
                }
            }, 2000);
            if (window.puterAI) {
                window.puterAI.refreshAuthState();
            }
            window.addEventListener('puterAuthStateChange', (event) => {
                const { isAuthenticated, user, fallbackMode, initialized } = event.detail;
                this.puterAuth.isAuthenticated = isAuthenticated;
                this.puterAuth.initialized = initialized;
                this.puterAuth.fallbackMode = fallbackMode;
                this.puterAuth.userInfo = user;
                if (isAuthenticated && !fallbackMode) {
                    this.showNotification('✅ Puter.js connected - AI features available!', 'success');
                }
                else if (!isAuthenticated) {
                    this.showNotification('🔵 Offline Mode - Using local fallback', 'info');
                }
                this.$nextTick(() => {
                });
            });
            window.addEventListener('showNotification', (event) => {
                const { message, type } = event.detail;
                this.showNotification(message, type || 'info');
            });
            setInterval(() => {
                if (window.puterAI) {
                    window.puterAI.refreshAuthState();
                }
            }, 5000);
            document.addEventListener('fullscreenchange', () => {
                if (!document.fullscreenElement && this.focusMode) {
                    this.focusMode = false;
                    document.body.classList.remove('focus-mode-active');
                    this.showNotification('Focus mode disabled', 'success');
                }
            });
            document.addEventListener('webkitfullscreenchange', () => {
                if (!document.webkitFullscreenElement && this.focusMode) {
                    this.focusMode = false;
                    document.body.classList.remove('focus-mode-active');
                    this.showNotification('Focus mode disabled', 'success');
                }
            });
            this.autoSaveInterval = setInterval(() => {
                const last = (typeof window.__hexaLastSavedText === 'string')
                    ? window.__hexaLastSavedText
                    : (window.TextStore ? window.TextStore.get() : localStorage.getItem('text'));
                if (this.text !== last) {
                    if (window.TextStore) {
                        window.TextStore.set(this.text);
                    }
                    else {
                        try {
                            localStorage.setItem('text', this.text);
                        }
                        catch { }
                    }
                    this.lastSaveTime = Date.now();
                }
            }, 30000);
            setInterval(() => {
                this.updateWritingStats();
            }, 60000);
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'z':
                            if (e.shiftKey) {
                                e.preventDefault();
                                this.redo();
                            }
                            else {
                                e.preventDefault();
                                this.undo();
                            }
                            break;
                        case 's':
                            e.preventDefault();
                            if (window.TextStore) {
                                window.TextStore.set(this.text);
                            }
                            else {
                                try {
                                    localStorage.setItem('text', this.text);
                                }
                                catch { }
                            }
                            this.showNotification('💾 Saved!', 'success');
                            break;
                        case 'e':
                            e.preventDefault();
                            this.exportText('txt');
                            break;
                        case 't':
                            e.preventDefault();
                            this.formatOpen = !this.formatOpen;
                            break;
                        case 'r':
                            e.preventDefault();
                            this.devToolsOpen = !this.devToolsOpen;
                            break;
                        case 'Enter':
                            if (e.altKey) {
                                e.preventDefault();
                                this.toggleFocusMode();
                            }
                            break;
                        case 'b':
                            if (e.shiftKey) {
                                e.preventDefault();
                                this.formatSelectedText('bold');
                            }
                            break;
                        case 'i':
                            if (e.shiftKey) {
                                e.preventDefault();
                                this.formatSelectedText('italic');
                            }
                            break;
                    }
                }
                if (e.key === 'Escape') {
                    this.searchOpen = false;
                    this.formatOpen = false;
                    this.devToolsOpen = false;
                    this.utilsOpen = false;
                    if (this.focusMode)
                        this.exitFocusMode();
                }
            });
            this.$watch('darkMode', value => {
                localStorage.setItem('darkMode', value);
                if (value) {
                    document.documentElement.classList.add('dark');
                }
                else {
                    document.documentElement.classList.remove('dark');
                }
                if (window.AutoOpt) {
                    try {
                        window.AutoOpt.trackThemeChange(value);
                    }
                    catch { }
                }
            });
            const params = new URLSearchParams(window.location.search);
            const textParam = params.get('text');
            const compressedParam = params.get('t');
            const isCompressed = params.get('c') === '1';
            const schemeParam = params.get('s');
            const titleParam = params.get('title');
            if (textParam || compressedParam) {
                let finalText = '';
                try {
                    if (compressedParam && isCompressed) {
                        if (window.SmartCompress && schemeParam) {
                            finalText = window.SmartCompress.decompress(schemeParam, compressedParam);
                        }
                        else {
                            finalText = LZString.decompressFromEncodedURIComponent(compressedParam);
                        }
                        if (!finalText) {
                            throw new Error('Decompression failed');
                        }
                    }
                    else if (textParam) {
                        finalText = textParam;
                    }
                    else if (compressedParam) {
                        try {
                            if (window.SmartCompress && schemeParam) {
                                finalText = window.SmartCompress.decompress(schemeParam, compressedParam);
                            }
                            else {
                                finalText = LZString.decompressFromEncodedURIComponent(compressedParam);
                            }
                            if (!finalText) {
                                finalText = compressedParam;
                            }
                        }
                        catch (e) {
                            finalText = compressedParam;
                        }
                    }
                    if (finalText) {
                        this.text = finalText;
                        if (window.TextStore) {
                            window.TextStore.set(finalText);
                        }
                        else {
                            try {
                                localStorage.setItem('text', finalText);
                            }
                            catch { }
                        }
                        setTimeout(() => {
                            if (isCompressed && compressedParam) {
                                const compressionRatio = ((1 - compressedParam.length / finalText.length) * 100).toFixed(1);
                                this.showNotification(`📄 Text loaded from URL (${compressionRatio}% compressed)`, 'success');
                            }
                            else {
                                this.showNotification('📄 Text loaded from URL', 'success');
                            }
                        }, 500);
                    }
                }
                catch (error) {
                    console.error('Error processing text from URL:', error);
                    const fallbackText = compressedParam || textParam;
                    if (fallbackText) {
                        this.text = fallbackText;
                        if (window.TextStore) {
                            window.TextStore.set(fallbackText);
                        }
                        else {
                            try {
                                localStorage.setItem('text', fallbackText);
                            }
                            catch { }
                        }
                        this.showNotification('📄 Text loaded (compression failed, using fallback)', 'warning');
                    }
                }
            }
            if (titleParam) {
                this.title = titleParam.substring(0, 18);
            }
            this.updateStats();
            setTimeout(() => {
                this.showNotification('🚀 Hexa ready!', 'success');
            }, 500);
            setTimeout(() => { if (window.AutoOpt) {
                try {
                    window.AutoOpt.applyOptimizations(this);
                }
                catch { }
            } }, 1200);
            setInterval(() => { if (window.AutoOpt) {
                try {
                    window.AutoOpt.applyOptimizations(this);
                }
                catch { }
            } }, 90000);
            setInterval(() => { if (window.UXBrain) {
                try {
                    window.UXBrain.tick(this);
                }
                catch { }
            } }, 60000);
            try {
                const ta = document.getElementById('textInput');
                if (ta && window.Utils && Utils.debounce) {
                    const trackInput = Utils.debounce(() => {
                        if (window.AutoOpt)
                            window.AutoOpt.trackUsage({ group: 'editor', action: 'input' });
                        try {
                            const minutes = Math.max(1 / 60, (this.writingTime || 1) / 60);
                            const cpm = (this.text || '').length / minutes;
                            if (window.UXBrain)
                                window.UXBrain.trackTyping(cpm, 0);
                        }
                        catch { }
                    }, 1500);
                    ta.addEventListener('input', trackInput);
                }
            }
            catch { }
        },
        codeFeature(action) {
            const allowWithoutText = new Set(['nowIsoEpoch', 'uuidBatch', 'passwords', 'httpFetchSnippet', 'axiosSnippet']);
            if (!allowWithoutText.has(action) && !this.text.trim()) {
                this.showNotification('❌ Add text to use smart functions', 'warning');
                return;
            }
            this.saveToHistory();
            try {
                let result = '';
                const txt = this.text || '';
                if (!this._memo) {
                    this._memo = {
                        parseJSON: window.Utils?.memoizeByInput((s) => JSON.parse(s), { max: 200 }),
                        stringifySorted: window.Utils?.memoizeByInput((o) => JSON.stringify(o, null, 2), { max: 200 }),
                        hex2rgb: window.Utils?.memoizeByInput((h) => {
                            let m = h.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
                            if (!m)
                                return null;
                            let hh = m[1];
                            if (hh.length === 3)
                                hh = hh.split('').map(c => c + c).join('');
                            const r = parseInt(hh.slice(0, 2), 16), g = parseInt(hh.slice(2, 4), 16), b = parseInt(hh.slice(4, 6), 16);
                            return `rgb(${r}, ${g}, ${b})`;
                        }, { max: 500 }),
                        rgb2hex: window.Utils?.memoizeByInput((rgbstr) => {
                            const m = rgbstr.match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
                            if (!m)
                                return null;
                            const toHex = (n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, '0');
                            return '#' + toHex(m[1]) + toHex(m[2]) + toHex(m[3]);
                        }, { max: 500 })
                    };
                }
                switch (action) {
                    case 'jsonValidate': {
                        try {
                            JSON.parse(txt);
                            this.showNotification('Valid JSON ✅', 'success');
                        }
                        catch (e) {
                            this.showNotification('Invalid JSON: ' + e.message, 'error');
                        }
                        return;
                    }
                    case 'jsonPretty': {
                        try {
                            const obj = this._memo.parseJSON(txt);
                            result = JSON.stringify(obj, null, 2);
                        }
                        catch (e) {
                            this.showNotification('Invalid JSON: ' + e.message, 'error');
                            return;
                        }
                        break;
                    }
                    case 'jsonMinify': {
                        try {
                            const obj = this._memo.parseJSON(txt);
                            result = JSON.stringify(obj);
                        }
                        catch (e) {
                            this.showNotification('Invalid JSON: ' + e.message, 'error');
                            return;
                        }
                        break;
                    }
                    case 'jsonSortKeys': {
                        try {
                            const obj = this._memo.parseJSON(txt);
                            const sortObj = (o) => Array.isArray(o) ? o.map(sortObj) : (o && typeof o === 'object') ? Object.keys(o).sort().reduce((acc, k) => { acc[k] = sortObj(o[k]); return acc; }, {}) : o;
                            result = JSON.stringify(sortObj(obj), null, 2);
                        }
                        catch (e) {
                            this.showNotification('Invalid JSON: ' + e.message, 'error');
                            return;
                        }
                        break;
                    }
                    case 'textToBinary': {
                        result = Array.from(txt).map(ch => ch.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
                        break;
                    }
                    case 'binaryToText': {
                        result = txt.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
                        break;
                    }
                    case 'decToHex': {
                        result = txt.trim().split(/\s+/).map(n => { const v = Number(n); return Number.isFinite(v) ? '0x' + v.toString(16) : n; }).join(' ');
                        break;
                    }
                    case 'hexToDec': {
                        result = txt.trim().split(/\s+/).map(n => { const m = n.match(/^0x?[0-9a-fA-F]+$/); return m ? parseInt(n.replace(/^0x/i, ''), 16).toString(10) : n; }).join(' ');
                        break;
                    }
                    case 'hexToRgb': {
                        const rgb = this._memo.hex2rgb(txt);
                        if (!rgb) {
                            this.showNotification('Provide HEX like #ff00aa', 'warning');
                            return;
                        }
                        result = rgb;
                        break;
                    }
                    case 'rgbToHex': {
                        const hex = this._memo.rgb2hex(txt);
                        if (!hex) {
                            this.showNotification('Provide RGB like rgb(255, 0, 170)', 'warning');
                            return;
                        }
                        result = hex;
                        break;
                    }
                    case 'palette': {
                        const src = (this.searchTerm || txt || '').trim();
                        const m = src.match(/#?[0-9a-fA-F]{6}/);
                        if (!m) {
                            this.showNotification('Provide a HEX color in the editor or search', 'warning');
                            return;
                        }
                        const base = m[0].replace('#', '');
                        const toRgb = (h) => ({ r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) });
                        const toHex = ({ r, g, b }) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
                        const { r, g, b } = toRgb(base);
                        const variants = [{ r: r * 0.9, g: g * 0.9, b: b * 0.9 }, { r: r * 0.75, g: g * 0.75, b: b * 0.75 }, { r: r * 1.1, g: g * 1.1, b: b * 1.1 }, { r: r * 1.25, g: g * 1.25, b: b * 1.25 }].map(toHex);
                        result = ['#' + base, ...variants].join('\n');
                        break;
                    }
                    case 'extractIPs': {
                        const ips = Array.from(txt.matchAll(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g)).map(m => m[0]);
                        result = ips.join('\n');
                        break;
                    }
                    case 'extractDomains': {
                        const domains = Array.from(txt.matchAll(/\b([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi)).map(m => m[0].toLowerCase());
                        result = Array.from(new Set(domains)).join('\n');
                        break;
                    }
                    case 'extractHashtags': {
                        const tags = Array.from(txt.matchAll(/#(\w+)/g)).map(m => m[0]);
                        result = Array.from(new Set(tags)).join(' ');
                        break;
                    }
                    case 'extractMentions': {
                        const at = Array.from(txt.matchAll(/@(\w+)/g)).map(m => m[0]);
                        result = Array.from(new Set(at)).join(' ');
                        break;
                    }
                    case 'parseURL': {
                        try {
                            const src = (this.searchTerm || txt).trim();
                            const u = new URL(src);
                            const out = { href: u.href, protocol: u.protocol, host: u.host, hostname: u.hostname, port: u.port, pathname: u.pathname, hash: u.hash, query: Object.fromEntries(u.searchParams.entries()) };
                            result = JSON.stringify(out, null, 2);
                        }
                        catch (e) {
                            this.showNotification('Invalid URL', 'warning');
                            return;
                        }
                        break;
                    }
                    case 'nowIsoEpoch': {
                        const now = new Date();
                        result = JSON.stringify({ iso: now.toISOString(), epoch: Math.floor(now.getTime() / 1000) }, null, 2);
                        break;
                    }
                    case 'httpFetchSnippet': {
                        result = `// fetch example\nfetch('https://api.example.com/data', {\n  method: 'GET',\n  headers: { 'Accept': 'application/json' }\n})\n  .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })\n  .then(console.log)\n  .catch(console.error);`;
                        break;
                    }
                    case 'axiosSnippet': {
                        result = `// Axios in Node.js\nconst axios = require('axios');\n(async ()=>{\n  try {\n    const { data } = await axios.get('https://api.example.com/data');\n    console.log(data);\n  } catch (err) {\n    console.error(err.message);\n  }\n})();`;
                        break;
                    }
                    case 'uuidBatch': {
                        const u = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });
                        result = Array.from({ length: 10 }, u).join('\n');
                        break;
                    }
                    case 'passwords': {
                        const gen = (len = 14) => { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+'; return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); };
                        result = Array.from({ length: 5 }, () => gen(14)).join('\n');
                        break;
                    }
                    case 'validateCode':
                        const language = this.detectLanguage(this.text);
                        const validation = CodeFeatures.validateCode(this.text, language);
                        result = `🔍 Code validation (${language}):\n\n`;
                        if (validation.isValid) {
                            result += '✅ Valid code\n\n';
                        }
                        else {
                            result += '❌ Se encontraron errores:\n';
                            result += validation.errors.join('\n') + '\n\n';
                        }
                        if (validation.warnings.length > 0) {
                            result += 'Advertencias:\n' + validation.warnings.join('\n') + '\n\n';
                        }
                        if (validation.suggestions.length > 0) {
                            result += 'Sugerencias:\n' + validation.suggestions.join('\n');
                        }
                        break;
                    case 'analyzeSentiment':
                        result = CodeFeatures.analyzeSentiment(this.text);
                        break;
                    case 'generateSnippet':
                        const lang = this.detectLanguage(this.text);
                        result = CodeFeatures.generateCodeSnippet('function', lang);
                        break;
                    default:
                        this.showNotification('❌ Function not recognized', 'error');
                        return;
                }
                this.text = result;
                this.updateStats();
                this.showNotification(`🧠 ${action} ejecutado exitosamente!`, 'success');
                if (window.AutoOpt) {
                    try {
                        window.AutoOpt.trackUsage({ group: 'codeFeature', action });
                    }
                    catch { }
                }
            }
            catch (error) {
                this.showNotification('❌ Error in smart function', 'error');
                console.error('Feature error:', error);
            }
        },
        detectLanguage(code) {
            if (/(?:function|const|let|var|class|if|for|while|=>|\{|\})/i.test(code)) {
                return 'javascript';
            }
            if (/(?:def |import |class |if |for |while |:)/i.test(code)) {
                return 'python';
            }
            if (/<[^>]+>/i.test(code)) {
                return 'html';
            }
            if (/(?:\{[^}]*\}|[a-zA-Z-]+\s*:[^;]+;)/i.test(code)) {
                return 'css';
            }
            try {
                JSON.parse(code);
                return 'json';
            }
            catch {
                return 'javascript';
            }
        },
        forceUnlockAI() {
            this.aiProcessing = false;
            this.showNotification('🔓 AI processing unlocked manually', 'success');
        },
        cancelAIRequest() {
            if (this.aiAbortController) {
                this.aiAbortController.abort();
                this.aiAbortController = null;
            }
            this.aiProcessing = false;
            this.showNotification('❌ AI request cancelled', 'info');
        },
        checkAIAuthentication() {
            if (!this.puterAuth.isAuthenticated) {
                this.showNotification('🔒 Please sign in with your Puter account to use AI features', 'warning');
                this.aiOpen = false;
                setTimeout(() => {
                    this.toggleAuthMenu();
                }, 300);
                return false;
            }
            return true;
        },
        async aiSummarize(length) {
            if (!this.checkAIAuthentication()) {
                return;
            }
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No text to summarize', 'error');
                return;
            }
            this.aiProcessing = true;
            this.aiAbortController = new AbortController();
            let timeoutId = setTimeout(() => {
                if (this.aiAbortController) {
                    this.aiAbortController.abort();
                }
                this.aiProcessing = false;
                this.showNotification('⏰ AI request timed out', 'error');
            }, 30000);
            try {
                const result = await window.puterAI.summarizeText(this.text, length, this.aiAbortController.signal);
                clearTimeout(timeoutId);
                if (this.aiAbortController?.signal.aborted) {
                    return;
                }
                this.text = result;
                this.updateStats();
                this.showNotification(`✨ Text summarized (${length})`, 'success');
            }
            catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    return;
                }
                this.showNotification('❌ Summarization failed', 'error');
                console.error('AI Summarization error:', error);
            }
            finally {
                this.aiProcessing = false;
                this.aiAbortController = null;
            }
        },
        async aiConvertCode() {
            if (!this.checkAIAuthentication()) {
                return;
            }
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No code to convert', 'error');
                return;
            }
            this.aiProcessing = true;
            let timeoutId = setTimeout(() => {
                this.aiProcessing = false;
                this.showNotification('⏰ AI request timed out', 'error');
            }, 30000);
            try {
                const result = await window.puterAI.convertCode(this.text, this.aiFromLanguage, this.aiToLanguage);
                clearTimeout(timeoutId);
                this.text = result;
                this.updateStats();
                this.showNotification(`🔄 Code converted: ${this.aiFromLanguage} → ${this.aiToLanguage}`, 'success');
            }
            catch (error) {
                clearTimeout(timeoutId);
                this.showNotification('❌ Code conversion failed', 'error');
                console.error('AI Code conversion error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiEnhanceText(enhancement) {
            if (!this.checkAIAuthentication()) {
                return;
            }
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No text to enhance', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.enhanceText(this.text, enhancement);
                this.text = result;
                this.updateStats();
                this.showNotification(`✨ Text enhanced (${enhancement})`, 'success');
            }
            catch (error) {
                this.showNotification('❌ Text enhancement failed', 'error');
                console.error('AI Text enhancement error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiTranslateText() {
            if (!this.checkAIAuthentication()) {
                return;
            }
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No text to translate', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.translateText(this.text, this.aiTargetLanguage);
                this.text = result;
                this.updateStats();
                this.showNotification(`🌍 Text translated to ${this.aiTargetLanguage}`, 'success');
            }
            catch (error) {
                this.showNotification('❌ Translation failed', 'error');
                console.error('AI Translation error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiCheckGrammar() {
            if (!this.checkAIAuthentication()) {
                return;
            }
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No text to check', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.checkGrammar(this.text);
                this.text = result;
                this.updateStats();
                this.showNotification('📝 Grammar checked and corrected', 'success');
            }
            catch (error) {
                this.showNotification('❌ Grammar check failed', 'error');
                console.error('AI Grammar check error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiGenerateContent() {
            if (!this.checkAIAuthentication()) {
                return;
            }
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.aiContentTopic.trim()) {
                this.showNotification('❌ Please enter a topic', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.generateContent(this.aiContentTopic, this.aiContentType, this.aiContentLength);
                this.text = result;
                this.updateStats();
                this.showNotification(`🎨 Content generated: ${this.aiContentType} about "${this.aiContentTopic}"`, 'success');
                this.aiContentTopic = '';
            }
            catch (error) {
                this.showNotification('❌ Content generation failed', 'error');
                console.error('AI Content generation error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiSendMessage() {
            if (!this.checkAIAuthentication()) {
                return;
            }
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.aiChatMessage.trim()) {
                return;
            }
            const userMessage = this.aiChatMessage;
            this.aiChatMessage = '';
            this.aiChatHistory.push({
                id: Date.now(),
                role: 'user',
                content: userMessage
            });
            this.aiProcessing = true;
            try {
                if (!window.puterAI || !window.puterAI.chatWithAI) {
                    throw new Error('PuterAI or chatWithAI method not available');
                }
                const response = await window.puterAI.chatWithAI(userMessage);
                this.aiChatHistory.push({
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: response
                });
                if (this.aiChatHistory.length > 20) {
                    this.aiChatHistory = this.aiChatHistory.slice(-20);
                }
            }
            catch (error) {
                this.showNotification('❌ AI chat failed', 'error');
                console.error('AI Chat error:', error);
                this.aiChatHistory.push({
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please try again.'
                });
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async init() {
            this.aiProcessing = false;
            if (typeof window.__HEXA_BOOT_TEXT === 'string' && window.__HEXA_BOOT_TEXT.length > 0) {
                this.text = window.__HEXA_BOOT_TEXT;
            }
            if (typeof this.text !== 'string')
                this.text = String(this.text || '');
            try {
                if (typeof this.waitForDependencies === 'function') {
                    await this.waitForDependencies();
                }
                if (typeof this.loadFromURL === 'function') {
                    await this.loadFromURL();
                }
            }
            catch (error) {
                console.warn('Share URL init load failed, trying fallback:', error);
                try {
                    if (typeof this.loadFromURL === 'function')
                        await this.loadFromURL();
                }
                catch { }
            }
            if ((!this.text || this.text.length === 0) && typeof window.__HEXA_BOOT_TEXT === 'string') {
                this.text = window.__HEXA_BOOT_TEXT;
            }
            const textarea = document.getElementById('textInput');
            if (textarea && this.text) {
                textarea.value = this.text;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
            this.updateStats();
            this.setupAutoSave();
            this.startWritingTimer();
            await this.checkPuterAuth();
        },
        async checkPuterAuth() {
            try {
                if (window.puterAI && window.puterAI.initialized) {
                    console.log('PuterAI ready for authentication when needed');
                }
            }
            catch (error) {
                console.warn('Auth check failed:', error);
            }
        },
        async aiGenerateDocumentation() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No code to document', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.generateDocumentation(this.text);
                this.text = result;
                this.updateStats();
                this.showNotification('📚 Code documentation generated', 'success');
            }
            catch (error) {
                this.showNotification('❌ Documentation generation failed', 'error');
                console.error('AI Documentation error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiOptimizeCode() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No code to optimize', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.optimizeCode(this.text);
                this.text = result;
                this.updateStats();
                this.showNotification('⚡ Code optimized', 'success');
            }
            catch (error) {
                this.showNotification('❌ Code optimization failed', 'error');
                console.error('AI Optimization error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiExplainCode() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No code to explain', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.explainCode(this.text);
                this.text = result;
                this.updateStats();
                this.showNotification('🔍 Code explanation generated', 'success');
            }
            catch (error) {
                this.showNotification('❌ Code explanation failed', 'error');
                console.error('AI Explanation error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiFindBugs() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No code to analyze', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.findBugs(this.text);
                this.text = result;
                this.updateStats();
                this.showNotification('🐛 Bug analysis completed', 'success');
            }
            catch (error) {
                this.showNotification('❌ Bug analysis failed', 'error');
                console.error('AI Bug analysis error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiGenerateTests() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No code to test', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.generateTests(this.text);
                this.text = result;
                this.updateStats();
                this.showNotification('🧪 Unit tests generated', 'success');
            }
            catch (error) {
                this.showNotification('❌ Test generation failed', 'error');
                console.error('AI Test generation error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiGenerateHTML() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.aiHTMLDescription.trim()) {
                this.showNotification('❌ Please describe the HTML you want', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.generateHTML(this.aiHTMLDescription);
                this.text = result;
                this.updateStats();
                this.showNotification('🌐 HTML generated successfully', 'success');
                this.aiHTMLDescription = '';
            }
            catch (error) {
                this.showNotification('❌ HTML generation failed', 'error');
                console.error('AI HTML generation error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiOptimizeSEO() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No content to optimize', 'error');
                return;
            }
            if (!this.aiSEOKeywords.trim()) {
                this.showNotification('❌ Please provide SEO keywords', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.optimizeSEO(this.text, this.aiSEOKeywords);
                this.text = result;
                this.updateStats();
                this.showNotification('📈 Content optimized for SEO', 'success');
                this.aiSEOKeywords = '';
            }
            catch (error) {
                this.showNotification('❌ SEO optimization failed', 'error');
                console.error('AI SEO optimization error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiGenerateRegex() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.aiRegexDescription.trim()) {
                this.showNotification('❌ Please describe the pattern you need', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.generateRegex(this.aiRegexDescription);
                this.text = result;
                this.updateStats();
                this.showNotification('🎯 Regex pattern generated', 'success');
                this.aiRegexDescription = '';
            }
            catch (error) {
                this.showNotification('❌ Regex generation failed', 'error');
                console.error('AI Regex generation error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiGenerateSQL() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.aiSQLDescription.trim()) {
                this.showNotification('❌ Please describe the SQL query needed', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.generateSQL(this.aiSQLDescription);
                this.text = result;
                this.updateStats();
                this.showNotification('🗃️ SQL query generated', 'success');
                this.aiSQLDescription = '';
            }
            catch (error) {
                this.showNotification('❌ SQL generation failed', 'error');
                console.error('AI SQL generation error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiAnalyzeData() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.text.trim()) {
                this.showNotification('❌ No data to analyze', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.analyzeData(this.text);
                this.text = result;
                this.updateStats();
                this.showNotification('📊 Data analysis completed', 'success');
            }
            catch (error) {
                this.showNotification('❌ Data analysis failed', 'error');
                console.error('AI Data analysis error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        async aiGenerateEmail() {
            if (!this.checkAIAuthentication())
                return;
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }
            if (!this.aiEmailPurpose.trim()) {
                this.showNotification('❌ Please describe the email purpose', 'error');
                return;
            }
            this.aiProcessing = true;
            try {
                const result = await window.puterAI.generateEmail(this.aiEmailPurpose, this.aiEmailTone);
                this.text = result;
                this.updateStats();
                this.showNotification('📧 Email generated successfully', 'success');
                this.aiEmailPurpose = '';
            }
            catch (error) {
                this.showNotification('❌ Email generation failed', 'error');
                console.error('AI Email generation error:', error);
            }
            finally {
                this.aiProcessing = false;
            }
        },
        toggleAuthMenu() {
            if (this.aiOpen) {
                this.aiOpen = false;
                setTimeout(() => {
                    this.authMenuOpen = !this.authMenuOpen;
                }, 200);
            }
            else {
                this.authMenuOpen = !this.authMenuOpen;
            }
        },
        testPopupBlocked() {
            try {
                const popup = window.open('', '_blank', 'width=1,height=1');
                if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                    return true;
                }
                setTimeout(() => {
                    try {
                        if (popup && !popup.closed) {
                            popup.close();
                        }
                    }
                    catch (e) {
                    }
                }, 100);
                return false;
            }
            catch (e) {
                return true;
            }
        },
        async signInToPuter() {
            try {
                if (window.EnvironmentDetector && !window.EnvironmentDetector.shouldMakeAPIRequests()) {
                    this.showNotification('📄 Sign-in not available when opening file directly', 'info');
                    return;
                }
                this.puterAuth.isLoading = true;
                this.puterAuth.error = null;
                if (!window.puterAI) {
                    throw new Error('PuterAI not available');
                }
                this.showNotification('🔐 Opening authentication popup...', 'info');
                await new Promise(resolve => setTimeout(resolve, 100));
                try {
                    let user = await window.puterAI.signIn();
                    if (user) {
                        this.puterAuth.isAuthenticated = true;
                        this.puterAuth.userInfo = user;
                        this.puterAuth.fallbackMode = false;
                        this.showNotification('✅ Successfully signed in to Hexa!', 'success');
                        this.$nextTick(() => {
                        });
                        setTimeout(() => {
                            this.authMenuOpen = false;
                        }, 1500);
                    }
                    else {
                        if (this.isBrave) {
                            console.log('🟠 Brave browser: No user returned, checking auth state...');
                            this.showNotification('⏳ Checking authentication status...', 'info');
                            setTimeout(async () => {
                                if (window.puterAI) {
                                    await window.puterAI.refreshAuthState();
                                    const authStatus = window.puterAI.getAuthStatus();
                                    if (authStatus.isAuthenticated) {
                                        this.puterAuth.isAuthenticated = true;
                                        this.puterAuth.userInfo = authStatus.userInfo;
                                        this.puterAuth.fallbackMode = false;
                                        this.showNotification('✅ Authentication successful!', 'success');
                                        this.authMenuOpen = false;
                                    }
                                    else {
                                        this.showNotification('⚠️ Authentication incomplete. Please try again.', 'warning');
                                    }
                                }
                            }, 2000);
                            return;
                        }
                        else {
                            throw new Error('Sign in failed - no user returned');
                        }
                    }
                }
                catch (error) {
                    const errorMessage = error?.message || error?.toString() || 'Unknown error';
                    const errorObj = error?.error || error;
                    const isLocalhost = window.EnvironmentDetector && window.EnvironmentDetector.isLocalhost;
                    const hasBlockers = isLocalhost ? false : window.BlockerDetector?.hasHighImpactBlockers?.();
                    const blockerInfo = hasBlockers ? window.BlockerDetector?.getDetectedBlockers?.()?.[0] : null;
                    if (this.isBrave && (errorObj === 'auth_window_closed' || errorMessage.includes('auth_window_closed'))) {
                        console.log('🟠 Brave authentication window closed - attempting status check...');
                        if (hasBlockers && blockerInfo) {
                            this.showNotification(`⚠️ ${blockerInfo.name} is blocking authentication popups. ${blockerInfo.suggestion}`, 'warning', { duration: 10000 });
                        }
                        else {
                            this.showNotification('⏳ Brave detected. Checking authentication...', 'info');
                        }
                        setTimeout(async () => {
                            try {
                                if (window.puterAI) {
                                    await window.puterAI.refreshAuthState();
                                    const authStatus = window.puterAI.getAuthStatus();
                                    if (authStatus.isAuthenticated) {
                                        this.puterAuth.isAuthenticated = true;
                                        this.puterAuth.userInfo = authStatus.userInfo;
                                        this.puterAuth.fallbackMode = false;
                                        this.showNotification('✅ Authentication successful in Brave!', 'success');
                                        this.authMenuOpen = false;
                                    }
                                    else {
                                        if (hasBlockers) {
                                            this.showNotification(`❌ ${blockerInfo.name} prevented authentication. Please check browser settings.`, 'error');
                                        }
                                        else {
                                            this.showNotification('❌ Authentication failed. Window was closed.', 'error');
                                        }
                                    }
                                }
                            }
                            catch (checkError) {
                                console.error('Auth status check failed:', checkError);
                                this.showNotification('❌ Authentication check failed.', 'error');
                            }
                        }, 1500);
                        return;
                    }
                    this.puterAuth.error = errorMessage;
                    this.puterAuth.isAuthenticated = false;
                    this.puterAuth.userInfo = null;
                    if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
                        this.showNotification('🚫 Popup was blocked. Try "Direct Sign In" option.', 'warning');
                    }
                    else if (errorMessage.includes('cancelled')) {
                        this.showNotification('🔄 Authentication cancelled. Please try again.', 'info');
                    }
                    else {
                        this.showNotification('❌ Sign in failed. Please try again or use Direct Sign In.', 'error');
                        if (hasBlockers && blockerInfo) {
                            console.warn(`🔍 Blocker detected (${blockerInfo.name}) - this might affect sign-in`);
                        }
                    }
                    console.error('Sign in failed:', error);
                }
            }
            catch (error) {
                const errorMessage = error?.message || error?.toString() || 'Unknown error';
                this.puterAuth.error = errorMessage;
                this.showNotification('❌ Sign in error: ' + errorMessage, 'error');
                console.error('Sign in error:', error);
            }
            finally {
                this.puterAuth.isLoading = false;
            }
        },
        async directSignInToPuter() {
            try {
                if (window.EnvironmentDetector && !window.EnvironmentDetector.shouldMakeAPIRequests()) {
                    this.showNotification('📄 Sign-in not available when opening file directly', 'info');
                    return;
                }
                this.puterAuth.isLoading = true;
                this.puterAuth.error = null;
                if (!window.puterAI) {
                    throw new Error('PuterAI not available');
                }
                this.showNotification('🔗 Redirecting to Puter authentication...', 'info');
                await window.puterAI.directSignIn();
            }
            catch (error) {
                this.puterAuth.error = error.message;
                this.showNotification('❌ Direct sign in failed. Please try again.', 'error');
                console.error('Direct sign in failed:', error);
            }
            finally {
                this.puterAuth.isLoading = false;
            }
        },
        async quickSignInToPuter() {
            try {
                if (window.EnvironmentDetector && !window.EnvironmentDetector.shouldMakeAPIRequests()) {
                    this.showNotification('📄 Sign-in not available when opening file directly', 'info');
                    return;
                }
                this.puterAuth.isLoading = true;
                this.puterAuth.error = null;
                if (!window.puterAI) {
                    throw new Error('PuterAI not available');
                }
                await window.puterAI.quickSignIn();
                this.puterAuth.isAuthenticated = true;
                this.puterAuth.userInfo = await window.puterAI.getUser();
                this.showNotification('🚀 Quick sign in successful!', 'success');
                setTimeout(() => {
                    this.authMenuOpen = false;
                }, 1500);
            }
            catch (error) {
                this.puterAuth.error = error.message;
                this.showNotification('❌ Quick sign in failed. Please try again.', 'error');
                console.error('Quick sign in failed:', error);
            }
            finally {
                this.puterAuth.isLoading = false;
            }
        },
        async signOutFromPuter() {
            try {
                this.puterAuth.isLoading = true;
                this.puterAuth.error = null;
                if (!window.puterAI) {
                    throw new Error('PuterAI not available');
                }
                await window.puterAI.signOut();
                this.puterAuth.isAuthenticated = false;
                this.puterAuth.userInfo = null;
                this.showNotification('👋 Successfully signed out', 'success');
                this.authMenuOpen = false;
            }
            catch (error) {
                this.puterAuth.error = error.message;
                this.showNotification('❌ Sign out failed: ' + error.message, 'error');
                console.error('Sign out failed:', error);
            }
            finally {
                this.puterAuth.isLoading = false;
            }
        },
    };
}
window.detectSyntax = () => {
    const textArea = document.querySelector("textarea");
    if (!textArea || !textArea.value.trim()) {
        showNotification("ℹ️ No text to analyze", "error");
        return;
    }
    const text = textArea.value;
    const syntaxPatterns = {
        html: {
            pattern: /<[^>]+>/,
            keywords: ["<div", "<p", "<html", "class=", "<body", "<!DOCTYPE", "<head>", "<title>"]
        },
        javascript: {
            pattern: /function|const|let|var|=>|class/,
            keywords: ["function", "const", "let", "var", "if", "for", "console.log", "document.", "window."]
        },
        css: {
            pattern: /{[^}]*}/,
            keywords: ["{", "}", ":", ";", "@media", "px", "rem", "color:", "background:"]
        },
        python: {
            pattern: /def |class |import |if __/,
            keywords: ["def", "class", "import", "if", "print", "from", "elif", "while"]
        },
        sql: {
            pattern: /SELECT|INSERT|UPDATE|DELETE|CREATE TABLE/i,
            keywords: ["SELECT", "FROM", "WHERE", "INSERT", "DELETE", "UPDATE", "CREATE", "ALTER"]
        },
        json: {
            pattern: /^\s*[\{\[][\s\S]*[\}\]]\s*$/,
            keywords: ['":', '": ', '",', '"}', '"]']
        },
        markdown: {
            pattern: /^#{1,6}\s|^\*\s|\*\*.*\*\*|__.*__|^\-\s/m,
            keywords: ["# ", "## ", "### ", "**", "__", "- ", "* ", "[", "]("]
        },
        xml: {
            pattern: /<\?xml|<\/\w+>/,
            keywords: ["<?xml", "</", "/>", "xmlns"]
        }
    };
    const detectedLanguages = [];
    for (const [lang, syntax] of Object.entries(syntaxPatterns)) {
        if (syntax.pattern.test(text) || syntax.keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
            detectedLanguages.push(lang.toUpperCase());
        }
    }
    if (detectedLanguages.length > 0) {
        showNotification(`🔍 Detected: ${detectedLanguages.join(', ')}`, "success");
    }
    else {
        showNotification("📝 Plain text detected", "success");
    }
};
