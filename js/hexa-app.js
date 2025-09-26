// Hexa Application - Main Alpine.js component
function hexaApp() {
    return {
        // State variables
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
            // Always try to load from storage first (immediate-decompress.js might have set it)
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
        pythonExecuting: false,
        pythonOutput: '',
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
        // AI Utilities
        aiOpen: false,
        aiFromLanguage: 'javascript',
        aiToLanguage: 'python',
        aiTargetLanguage: 'Spanish',
        aiContentTopic: '',
        aiContentType: 'article',
        aiContentLength: 'medium',
        aiChatMessage: '',
        aiChatHistory: [],
        aiProcessing: false,
        aiAbortController: null,
        
        // Advanced AI Utilities Variables
        aiHTMLDescription: '',
        aiSEOKeywords: '',
        aiRegexDescription: '',
        aiSQLDescription: '',
        aiEmailPurpose: '',
        aiEmailTone: 'professional',

        // Puter.js Authentication
        authMenuOpen: false,
        showBlockerDetails: false,
        puterAuth: {
            isAuthenticated: false,
            userInfo: null,
            isLoading: false,
            error: null,
            initialized: false,
            fallbackMode: true  // Start in fallback mode until Puter.js is initialized
        },
        
        // Notification system improvements
        lastNotificationTime: {},
        isBrave: navigator.userAgentData?.brands?.some(brand => brand.brand === 'Brave') || navigator.brave,

    // Methods
        updateStats() {
            // Ensure text is always a string to prevent Alpine.js errors
            if (typeof this.text !== 'string') {
                this.text = String(this.text || '');
            }
            
            const text = this.text || '';
            
            // Sistema de caché: verificar si el texto ha cambiado
            const textHash = this.simpleHash(text);
            if (this.statsCache.lastHash === textHash && this.statsCache.cachedStats) {
                this.stats = this.statsCache.cachedStats;
                return;
            }
            
            if (window.PerformanceOptimizer) {
                const optimizedStats = window.PerformanceOptimizer.getOptimizedStats(text);
                if (optimizedStats) {
                    this.stats = optimizedStats;
                    // Actualizar caché
                    this.statsCache.lastText = text;
                    this.statsCache.lastHash = textHash;
                    this.statsCache.cachedStats = optimizedStats;
                    return;
                }
            }
            
            this.updateStatsLegacy(text);
            
            // Actualizar caché
            this.statsCache.lastText = text;
            this.statsCache.lastHash = textHash;
            this.statsCache.cachedStats = this.stats;
        },

        simpleHash(text) {
            // Hash rápido para detectar cambios en el texto
            let hash = 0;
            if (text.length === 0) return hash;
            for (let i = 0; i < text.length; i++) {
                const char = text.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convertir a 32bit integer
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
            
            // Metrics
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
            // Para textos grandes, usar sampling para mejor rendimiento
            const sampleSize = Math.min(5000, chars);
            const sample = text.substring(0, sampleSize);
            const ratio = chars / sampleSize;
            
            // Calcular en el sample
            const sampleWords = sample.trim() === '' ? 0 : sample.trim().split(/\s+/).filter(word => word.length > 0).length;
            const sampleSentences = sample === '' ? 0 : sample.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
            const sampleParagraphs = sample === '' ? 0 : sample.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
            
            // Extrapolar
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
                readabilityScore: 50 // Valor aproximado para textos largos
            };
        },

        calculateReadability(text, words, sentences) {
            if (sentences === 0 || words === 0) return 0;
            
            const syllables = this.countSyllables(text);
            // Flesch Reading Ease score
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
            
                switch(format) {
                    case 'uppercase':
                        result = this.text.toUpperCase();
                        break;
                    case 'lowercase':
                        result = this.text.toLowerCase();
                        break;
                    case 'titlecase':
                        result = this.text.replace(/\w\S*/g, (txt) => 
                            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                        break;
                    case 'sentencecase':
                        result = this.text.charAt(0).toUpperCase() + this.text.slice(1).toLowerCase();
                        break;
                    case 'camelcase':
                        result = this.text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
                            index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '');
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
                        const freq = words.reduce((acc,w)=>{ const k=w.toLowerCase(); acc[k]=(acc[k]||0)+1; return acc; },{});
                        const sorted = Object.entries(freq).sort((a,b)=>b[1]-a[1]);
                        result = sorted.map(([w,c])=>`${w}: ${c}`).join('\n') || 'No words';
                        break;
                    }
                    default:
                        this.showNotification('❌ Unknown format', 'error');
                        return;
                }
                
                this.text = result;
                if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
                this.updateStats();
                this.showNotification(`✨ Text formatted: ${format}`, 'success');
            } catch (error) {
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
            } else if (minutes > 0) {
                return `${minutes}m ${seconds % 60}s`;
            } else {
                return `${seconds}s`;
            }
        },

        updateWritingStats() {
            if (window.writingTracker) {
                this.writingStats = window.writingTracker.getStats();
            }
        },

        // ===== OPTIMIZACIÓN DE RENDIMIENTO =====
        
        handleOptimizedInput(event) {
            // Manejar input de forma optimizada para textos largos
            const textLength = this.text.length;
            const isLargeText = textLength > 10000;
            
            // Para textos grandes, usar debouncing más agresivo
            if (isLargeText) {
                this.debouncedUpdateStats();
                this.debouncedSaveToStorage();
                this.debouncedSaveToHistory();
            } else {
                // Para textos normales, usar la lógica original
                this.updateStats();
                localStorage.setItem('text', this.text);
                this.saveToHistory();
            }
            
            this.startWritingTimer();
            
            // Aplicar optimizaciones visuales dinámicamente
            this.applyPerformanceOptimizations(textLength);
        },

        applyPerformanceOptimizations(textLength) {
            const textarea = document.getElementById('textInput');
            if (!textarea) return;
            
            const isLargeText = textLength > 10000;
            const isHugeText = textLength > 50000;
            
            // Aplicar clases de optimización
            if (isHugeText) {
                textarea.classList.add('large-text', 'performance-optimized');
                // Para textos enormes, reducir la frecuencia de actualizaciones
                textarea.style.contentVisibility = 'auto';
            } else if (isLargeText) {
                textarea.classList.add('large-text');
                textarea.classList.remove('performance-optimized');
                textarea.style.contentVisibility = 'visible';
            } else {
                textarea.classList.remove('large-text', 'performance-optimized');
                textarea.style.contentVisibility = 'visible';
            }
            
            // Optimizar line numbers container
            const lineContainer = document.querySelector('.line-numbers-container');
            if (lineContainer) {
                if (this.stats.lines > 1000) {
                    lineContainer.classList.add('optimized');
                } else {
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

        // ===== FIN OPTIMIZACIÓN =====

        initPerformanceOptimizations() {
            // Configurar optimizaciones iniciales
            const textarea = document.getElementById('textInput');
            if (textarea) {
                // Aplicar optimizaciones según el tamaño inicial del texto
                this.applyPerformanceOptimizations(this.text.length);
                
                // Agregar listener para cambios de scroll (para virtualización)
                textarea.addEventListener('scroll', this.throttleScrollHandler.bind(this), { passive: true });
                
                // Optimizar composición para mejor performance
                textarea.style.contain = 'layout style paint';
            }
            
            // Agregar atajo de teclado para mostrar métricas de performance (Ctrl+Alt+M)
            document.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.altKey && event.key === 'M') {
                    event.preventDefault();
                    this.showPerformanceMetrics();
                }
                
                // Focus Mode shortcuts: F11 to toggle, Escape to exit
                if (event.key === 'F11') {
                    event.preventDefault();
                    this.toggleFocusMode();
                } else if (event.key === 'Escape' && this.focusMode) {
                    event.preventDefault();
                    this.focusMode = false;
                    this.exitFocusMode();
                }
            });
            
            // Listen for fullscreen changes to sync focus mode state
            document.addEventListener('fullscreenchange', () => {
                if (!document.fullscreenElement && this.focusMode) {
                    this.focusMode = false;
                    this.showNotification('🎯 Focus mode DISABLED', 'success');
                }
            });
            
            // Support for different browsers
            document.addEventListener('webkitfullscreenchange', () => {
                if (!document.webkitFullscreenElement && this.focusMode) {
                    this.focusMode = false;
                    this.showNotification('🎯 Focus mode DISABLED', 'success');
                }
            });
            
            document.addEventListener('msfullscreenchange', () => {
                if (!document.msFullscreenElement && this.focusMode) {
                    this.focusMode = false;
                    this.showNotification('🎯 Focus mode DISABLED', 'success');
                }
            });
        },

        throttleScrollHandler() {
            if (this.scrollTimeout) return;
            
            this.scrollTimeout = setTimeout(() => {
                // Actualizar números de línea visibles si es necesario
                this.updateVisibleLineNumbers();
                this.scrollTimeout = null;
            }, 16); // ~60fps
        },

        updateVisibleLineNumbers() {
            const textarea = document.getElementById('textInput');
            const lineContainer = document.querySelector('.line-numbers-container');
            
            if (!textarea || !lineContainer || this.stats.lines <= 1000) return;
            
            // Solo para textos con muchas líneas, implementar scroll virtual
            if (window.PerformanceOptimizer) {
                window.PerformanceOptimizer.updateVirtualLineNumbers();
            }
        },

        showPerformanceMetrics() {
            if (window.PerformanceOptimizer) {
                window.PerformanceOptimizer.showPerformanceDialog();
            } else {
                // Mostrar métricas básicas si el optimizador no está disponible
                const textLength = this.text.length;
                const isLargeText = textLength > 10000;
                
                this.showNotification(
                    `📊 Text: ${textLength.toLocaleString()} chars ${isLargeText ? '(Large Text Mode)' : '(Normal Mode)'} - Press Ctrl+Alt+M for details`,
                    'info',
                    { duration: 5000 }
                );
            }
        },

        // ===== FUNCIONES HEREDADAS =====

        handleKeyDown(event) {
            const textarea = event.target;
            const cursorPos = textarea.selectionStart;
            const textBefore = this.text.substring(0, cursorPos);
            const textAfter = this.text.substring(cursorPos);
            
            // Tab for auto-completion
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
                } else {
                    // Insert 2 spaces for indentation
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
            } else {
                this.historyIndex++;
            }
        },

        undo() {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.text = this.history[this.historyIndex];
                this.updateStats();
                if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
                this.showNotification('↶ Undone', 'success');
            }
        },

        redo() {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.text = this.history[this.historyIndex];
                this.updateStats();
                if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
                this.showNotification('↷ Redone', 'success');
            }
        },

        toggleFocusMode() {
            this.focusMode = !this.focusMode;
            
            if (this.focusMode) {
                // Enter fullscreen
                try {
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen();
                    } else if (document.documentElement.webkitRequestFullscreen) {
                        document.documentElement.webkitRequestFullscreen();
                    } else if (document.documentElement.msRequestFullscreen) {
                        document.documentElement.msRequestFullscreen();
                    }
                    this.showNotification('🎯 Focus mode ENABLED - Press F11 or Escape to exit', 'success');
                } catch (error) {
                    console.warn('🔍 [Hexa] Fullscreen request failed:', error.message);
                    this.showNotification('🎯 Focus mode ENABLED (fullscreen unavailable)', 'success');
                }
                if (window.UXBrain) { try { window.UXBrain.trackPanel('focus', true); window.UXBrain.tick(this); } catch {} }
            } else {
                // Exit fullscreen - check if document is in fullscreen and active
                try {
                    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || 
                                       document.msFullscreenElement || document.mozFullScreenElement;
                    
                    if (isFullscreen && document.hasFocus()) {
                        if (document.exitFullscreen) {
                            document.exitFullscreen().catch(e => console.warn('🔍 [Hexa] Fullscreen exit promise failed:', e.message));
                        } else if (document.webkitExitFullscreen) {
                            document.webkitExitFullscreen();
                        } else if (document.msExitFullscreen) {
                            document.msExitFullscreen();
                        }
                    }
                    this.showNotification('🎯 Focus mode DISABLED', 'success');
                } catch (error) {
                    console.warn('🔍 [Hexa] Fullscreen exit failed (document not active):', error.message);
                    this.showNotification('🎯 Focus mode DISABLED', 'success');
                }
                if (window.UXBrain) { try { window.UXBrain.trackPanel('focus', false); } catch {} }
            }
        },

        exitFocusMode() {
            // Exit fullscreen - check if document is in fullscreen and active
            try {
                const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || 
                                   document.msFullscreenElement || document.mozFullScreenElement;
                
                if (isFullscreen && document.hasFocus()) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(e => console.warn('🔍 [Hexa] Fullscreen exit promise failed:', e.message));
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                }
                this.showNotification('🎯 Focus mode DISABLED', 'success');
            } catch (error) {
                console.warn('🔍 [Hexa] Fullscreen exit failed (document not active):', error.message);
                this.showNotification('🎯 Focus mode DISABLED', 'success');
            }
            if (window.UXBrain) { try { window.UXBrain.trackPanel('focus', false); } catch {} }
        },

        startWritingTimer() {
            if (!this.writingTimer) {
                this.writingTimer = setInterval(() => {
                    this.writingTime++;
                }, 1000);
            }
        },

        setupAutoSave() {
            // Clear any existing auto-save interval
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
            }
            
            // Set up auto-save every 30 seconds
            this.autoSaveInterval = setInterval(() => {
                this.saveToStorage();
            }, 30000);
        },

        saveToStorage() {
            try {
                if (window.TextStore) {
                    window.TextStore.set(this.text);
                } else {
                    localStorage.setItem('text', this.text);
                }
                this.lastSaveTime = Date.now();
            } catch (error) {
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
            } else if (minutes > 0) {
                return `${minutes}m ${seconds}s`;
            } else {
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
                if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
                this.updateStats();
                this.showNotification(`🔄 Replaced ${matches.length} occurrence(s)`, 'success');
            } else {
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
            
            this.showNotification(
                `📊 Avg word length: ${avgWordLength.toFixed(1)} | Long words: ${longWords} | Unique: ${uniqueWords}`, 
                'success'
            );
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
            } catch (err) {
                this.showNotification('❌ Failed to copy text', 'error');
            }
        },

        generateShareURL(forceBest=false) {
            if (!this.text.trim()) {
                this.showNotification('❌ No text to share', 'error');
                return;
            }
            
            try {
                const url = new URL(window.location.href);
                
                // Smart compression with dynamic threshold and real evaluation
                let textToShare = this.text;
                let isCompressed = false;
                let scheme = 'raw';
                let gain = 0;
                if (window.SmartCompress) {
                    const { rawSize, variants, lu } = window.SmartCompress.evaluate(this.text);
                    const type = window.SmartCompress.detectType(this.text);
                    const dynThresh = window.SmartCompress.getAdaptiveThreshold(rawSize, type);
                    let chosen = variants[0];
                    if (!forceBest) {
                        // Apply threshold vs LU if available; else vs RAW
                        if (rawSize < window.SmartCompress.config.minTextLenForCompression || !chosen) {
                            chosen = null;
                        } else if (lu && lu.size > 0) {
                            const gainVsLU = (lu.size - chosen.size) / lu.size;
                            if (gainVsLU < dynThresh) {
                                // Fallback to LU compression instead of raw
                                chosen = lu;
                            }
                        } else {
                            // No LU variant (unlikely) → accept chosen only if clears threshold vs RAW
                            if (chosen.gain < dynThresh) {
                                // As last resort, still use chosen if it’s LU-equivalent; else null
                                // But since no LU, keep chosen to avoid raw
                            }
                        }
                    }
                    if (chosen) {
                        textToShare = chosen.payload;
                        isCompressed = true;
                        scheme = chosen.scheme;
                        // Prefer reporting gain vs LU when available
                        if (lu && lu.size > 0) {
                            gain = (lu.size - chosen.size) / lu.size;
                            try { window.SmartCompress.recordTelemetry(type, scheme, gain); } catch {}
                        } else {
                            gain = chosen.gain;
                        }
                        url.searchParams.set('c', '1');
                        url.searchParams.set('s', scheme);
                    }
                } else {
                    // Fallback to URI-safe LZ
                    if (this.text.length > 1000) {
                        try {
                            const compressed = LZString.compressToEncodedURIComponent(this.text);
                            if (compressed.length < this.text.length * 0.88) {
                                textToShare = compressed;
                                isCompressed = true;
                                scheme = 'lu';
                                url.searchParams.set('c', '1');
                                url.searchParams.set('s', scheme);
                                gain = 1 - (compressed.length/this.text.length);
                            }
                        } catch (error) { console.warn('Compression failed, using original text:', error); }
                    }
                }
                
                // Clear any previous params
                url.searchParams.delete('text');
                url.searchParams.delete('t');
                url.searchParams.delete('c');
                url.searchParams.delete('s');
                url.searchParams.delete('title');
                
                // Use shorter param name to save space
                url.searchParams.set(isCompressed ? 't' : 'text', textToShare);
                
                if (isCompressed) {
                    url.searchParams.set('c', '1');
                    if (scheme && scheme !== 'raw') url.searchParams.set('s', scheme);
                }
                
                // Only add title if different from default
                if (this.title && this.title !== 'Hexa') {
                    url.searchParams.set('title', this.title);
                }
                
                this.shareURL = url.toString();
                this.isOpen = true;
                
                // Show compression statistics
                if (isCompressed) {
                    const compressionRatio = (gain>0 ? (gain*100).toFixed(1) : ((1 - textToShare.length / this.text.length) * 100).toFixed(1));
                    this.showNotification(`🔗 Share URL generated! (${compressionRatio}% compressed)`, 'success');
                } else {
                    this.showNotification('🔗 Share URL generated!', 'success');
                }

                // Gentle one-time notice: very long URLs may not work in some browsers
                try {
                    if (!localStorage.getItem('hexa.longUrlNoticeShown')) {
                        setTimeout(() => {
                            this.showNotification('ℹ️ Very long URLs may not work in some browsers.', 'info');
                            try { localStorage.setItem('hexa.longUrlNoticeShown','1'); } catch {}
                        }, 1200);
                    }
                } catch {}
                
            } catch (error) {
                console.error('Error generating share URL:', error);
                this.showNotification('❌ Failed to generate share URL', 'error');
            }
        },

        async copyShareURL() {
            try {
                await navigator.clipboard.writeText(this.shareURL);
                this.showNotification('🔗 Share URL copied!', 'success');
                setTimeout(() => this.isOpen = false, 1000);
            } catch (err) {
                this.showNotification('❌ Failed to copy URL', 'error');
            }
        },

    // Get statistics for the generated share link
        getShareLinkStats() {
            if (!this.shareURL) {
                this.showNotification('❌ No share link generated yet', 'error');
                return;
            }
            
            try {
                const url = new URL(this.shareURL);
                const params = url.searchParams;
                const textParam = params.get('text');
                const compressedParam = params.get('t');
                const isCompressed = params.get('c') === '1';
                
                let stats = `🔗 Share Link Statistics:\n`;
                stats += `Total URL length: ${this.shareURL.length} chars\n`;
                
                if (isCompressed && compressedParam) {
                    stats += `Compression: ENABLED ✅\n`;
                    stats += `Compressed data: ${compressedParam.length} chars\n`;
                    stats += `Original text: ${this.text.length} chars\n`;
                    const ratio = ((1 - compressedParam.length / this.text.length) * 100).toFixed(1);
                    stats += `Compression ratio: ${ratio}%\n`;
                } else if (textParam) {
                    stats += `Compression: DISABLED ❌\n`;
                    stats += `Text data: ${textParam.length} chars\n`;
                }
                
                // Generic note
                stats += `ℹ️ Note: Very long URLs may not work in some browsers.\n`;
                
                this.showNotification(stats, 'info');
                
            } catch (error) {
                console.error('Error analyzing share link:', error);
                this.showNotification('❌ Failed to analyze share link', 'error');
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
                if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
            };
            reader.readAsText(file);
        },

        showNotification(message, type = 'success') {
            // Anti-spam system for repetitive notifications
            const now = Date.now();
            const messageKey = `${message}_${type}`;
            
            // In Brave browser, be more aggressive about preventing auth spam
            if (this.isBrave && message.includes('Authentication cancelled')) {
                if (this.lastNotificationTime[messageKey] && now - this.lastNotificationTime[messageKey] < 5000) {
                    console.log('Suppressing repeated auth notification in Brave');
                    return;
                }
            } else if (this.lastNotificationTime[messageKey] && now - this.lastNotificationTime[messageKey] < 1000) {
                // General anti-spam for all notifications
                return;
            }
            
            this.lastNotificationTime[messageKey] = now;
            
            // Usar el sistema de notificaciones personalizado
            if (window.showNotification && typeof window.showNotification === 'function') {
                window.showNotification(message, type);
            } else {
                // Fallback al sistema Alpine.js
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
                if (!window.SmartCompress) { this.telemetryView = 'SmartCompress not available.'; return; }
                const raw = localStorage.getItem('SC.telemetry.v1');
                if (!raw) { this.telemetryView = 'No telemetry yet. Generate a few Share URLs first.'; return; }
                const st = JSON.parse(raw);
                const parts = [];
                for (const [type, rec] of Object.entries(st.data || {})){
                    const dom = Object.entries(rec.best || {}).sort((a,b)=>b[1]-a[1])[0];
                    const domStr = dom ? `${dom[0]} (${dom[1]})` : 'n/a';
                    parts.push(`${type}: total=${rec.total}, dominant=${domStr}, avgGain=${(rec.avgGain*100).toFixed(1)}%`);
                }
                this.telemetryView = parts.length ? parts.join('\n') : 'No telemetry data stored yet.';
            } catch (e) {
                console.error('Telemetry view failed', e);
                this.telemetryView = 'Failed to load telemetry.';
            }
        },

    // Python execution
        async executePython() {
            if (!this.text.trim()) {
                this.showNotification('❌ No code to execute', 'error');
                return;
            }
            
            this.pythonExecuting = true;
            this.pythonOutput = '';
            
            try {
                this.pythonOutput = await window.executePython(this.text);
                this.showNotification('🐍 Python code executed!', 'success');
            } catch (error) {
                this.pythonOutput = '❌ Execution failed: ' + error.message;
                this.showNotification('❌ Execution failed', 'error');
            } finally {
                this.pythonExecuting = false;
            }
        },

    // Compression analysis
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
                    message += `Raw: ${rawSize} chars | type: ${type} | adaptive thr: ${(thr*100).toFixed(1)}%\n`;
                    if (variants.length === 0) {
                        message += `No compression variant available`;
                    } else {
                        for (const v of variants) {
                            const gainVsLU = (lu && lu.size>0) ? ((lu.size - v.size) / lu.size) : v.gain;
                            const pct = (gainVsLU*100).toFixed(1);
                            const meta = v.scheme==='w1' && v.meta ? ` (dict:${v.meta.dictSize}, repl:${v.meta.replaced}${v.meta.suffixDictSize!=null?`, suf:${v.meta.suffixDictSize}, sufRepl:${v.meta.suffixReplaced}`:''})` : '';
                            message += `- ${v.scheme}: ${v.size} chars (gain vs LU: ${pct}%)${meta}\n`;
                        }
                    }
                    const best = variants[0];
                    if (best) {
                        const gainVsLU = (lu && lu.size>0) ? ((lu.size - best.size) / lu.size) : best.gain;
                        message += `Best: ${best.scheme} → ${best.size} chars (${(gainVsLU*100).toFixed(1)}%)\n`;
                    }
                    this.showNotification(message.trim(), 'info');
                } else {
                    const compressed = LZString.compressToEncodedURIComponent(this.text);
                    const compressedSize = compressed.length;
                    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
                    let message = `📊 Compression Analysis:\nOriginal: ${originalSize} chars\nCompressed: ${compressedSize} chars\nRatio: ${ratio}% reduction`;
                    this.showNotification(message, 'info');
                }
                
                // Log omitido en producción
                // console.log('Compression Analysis:', { originalSize, smart: !!window.SmartCompress });
                
            } catch (error) {
                console.error('Compression analysis failed:', error);
                this.showNotification('❌ Compression analysis failed', 'error');
            }
        },

        

    // Code minification
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
                        // Simple JS minification
                        result = this.text
                            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
                            .replace(/\/\/.*$/gm, '') // Remove line comments
                            .replace(/\s+/g, ' ') // Collapse multiple spaces
                            .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
                            .replace(/\s*{\s*/g, '{') // Trim braces
                            .replace(/\s*;\s*/g, ';') // Trim semicolons
                            .trim();
                        break;
                    case 'css':
                        // Simple CSS minification
                        result = this.text
                            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                            .replace(/\s+/g, ' ') // Collapse multiple spaces
                            .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
                            .replace(/\s*{\s*/g, '{') // Trim around opening brace
                            .replace(/;\s*/g, ';') // Trim after semicolons
                            .replace(/:\s*/g, ':') // Trim after colon
                            .trim();
                        break;
                    case 'html':
                        // Simple HTML minification
                        result = this.text
                            .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
                            .replace(/\s+/g, ' ') // Collapse multiple spaces
                            .replace(/>\s+</g, '><') // Remove spaces between tags
                            .replace(/\s+>/g, '>') // Remove spaces before closing tag
                            .trim();
                        break;
                    default:
                        this.showNotification('❌ Unknown minification type', 'error');
                        return;
                }
                this.text = result;
                if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
                this.updateStats();
                this.showNotification(`🗜️ ${type.toUpperCase()} minified!`, 'success');
            } catch (error) {
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
                
                // Detect code type
                const codeType = this.detectCodeType(text);
                
                switch(codeType) {
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
                        // Generic beautification for other code types
                        beautified = this.beautifyGeneric(text);
                }

                this.text = beautified;
                if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
                this.updateStats();
                this.showNotification('✨ Code beautified!', 'success');
            } catch (error) {
                this.showNotification('❌ Beautification failed', 'error');
                console.error('Beautify error:', error);
            }
        },

        detectCodeType(text) {
            // Detect JSON
            if ((text.startsWith('{') && text.endsWith('}')) || 
                (text.startsWith('[') && text.endsWith(']'))) {
                try {
                    JSON.parse(text);
                    return 'json';
                } catch (e) {
                    // Not valid JSON; continue with other detections
                }
            }
            
            // Detect HTML
            if (text.includes('<!DOCTYPE') || text.includes('<html') || 
                /<\/?[a-z][\s\S]*>/i.test(text)) {
                return 'html';
            }
            
            // Detect XML
            if (text.startsWith('<?xml') || /<\?xml.*\?>/i.test(text)) {
                return 'xml';
            }
            
            // Detect CSS
            if (text.includes('{') && text.includes('}') && 
                (text.includes(':') && text.includes(';')) ||
                /@[a-z-]+/.test(text)) {
                return 'css';
            }
            
            // Detect JavaScript
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
            } catch (e) {
                throw new Error('Invalid JSON format');
            }
        },

        beautifyHTML(text) {
            let formatted = text;
            let indentLevel = 0;
            const indent = '    ';
            
            // Normalize whitespace
            formatted = formatted.replace(/>\s+</g, '><');
            
            // Add line breaks before tags
            formatted = formatted.replace(/</g, '\n<');
            
            const lines = formatted.split('\n');
            const result = [];
            
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;
                
                // Closing tags
                if (line.startsWith('</')) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }
                
                result.push(indent.repeat(indentLevel) + line);
                
                // Opening tags (not self-closed)
                if (line.startsWith('<') && !line.startsWith('</') && 
                    !line.endsWith('/>') && !line.includes('<!')) {
                    indentLevel++;
                }
            });
            
            return result.join('\n');
        },

        beautifyCSS(text) {
            let formatted = text;
            
            // Add spaces after colon
            formatted = formatted.replace(/:\s*/g, ': ');
            
            // Add line breaks after semicolons
            formatted = formatted.replace(/;\s*/g, ';\n    ');
            
            // Add line breaks around braces
            formatted = formatted.replace(/\{\s*/g, ' {\n    ');
            formatted = formatted.replace(/\s*\}/g, '\n}');
            
            // Add line breaks after closing braces
            formatted = formatted.replace(/\}/g, '}\n\n');
            
            // Collapse multiple line breaks
            formatted = formatted.replace(/\n{3,}/g, '\n\n');
            
            return formatted.trim();
        },

        beautifyJavaScript(text) {
            let formatted = text;
            let indentLevel = 0;
            const indent = '    ';
            
            // Add spaces around operators
            formatted = formatted.replace(/([=+\-*/<>!&|])\s*/g, ' $1 ');
            formatted = formatted.replace(/\s+([=+\-*/<>!&|])\s+/g, ' $1 ');
            
            // Add spaces after commas
            formatted = formatted.replace(/,\s*/g, ', ');
            
            // Add line breaks after semicolons
            formatted = formatted.replace(/;\s*/g, ';\n');
            
            // Add line breaks around braces
            formatted = formatted.replace(/\{\s*/g, ' {\n');
            formatted = formatted.replace(/\s*\}/g, '\n}');
            
            const lines = formatted.split('\n');
            const result = [];
            
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;
                
                // Decrease indent for closing braces
                if (line.startsWith('}')) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }
                
                result.push(indent.repeat(indentLevel) + line);
                
                // Increase indent for opening braces
                if (line.endsWith('{')) {
                    indentLevel++;
                }
            });
            
            return result.join('\n');
        },

        beautifyXML(text) {
            return this.beautifyHTML(text); // XML uses the same logic as HTML
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

                // Decrease indent for closing characters
                if (/^[}\])]/.test(line)) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }

                formattedLines.push(indent.repeat(indentLevel) + line);

                // Increase indent for opening characters
                if (/[{\[(]\s*$/.test(line)) {
                    indentLevel++;
                }
            });

            return formattedLines.join('\n');
        },

    // Code generators
        generateCode(type) {
            this.saveToHistory();
            
            let generated = '';
            try {
                switch(type) {
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
            } catch (error) {
                this.showNotification('❌ Error generating code', 'error');
                console.error('Generate code error:', error);
            }
        },

    // Utility functions
        processUtils(type, action) {
            if (!this.text.trim() 
                && !['uuid','diff'].includes(type) 
                && !(type==='social' && ['waLink','discordTimeNow'].includes(action))) {
                this.showNotification('❌ No text to process', 'error');
                return;
            }
            
            this.saveToHistory();
            let result = this.text;
            
            try {
                switch(type) {
                    case 'social': {
                        // Platform-specific helpers
                        const t = this.text || '';
                        if (action === 'waLink') {
                            const phone = (this.searchTerm || '').replace(/\D+/g,'');
                            const msg = encodeURIComponent(t.trim());
                            result = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
                            this.showNotification('📲 WhatsApp link generated', 'success');
                        } else if (action === 'waBold') {
                            result = `*${t}*`;
                        } else if (action === 'waItalic') {
                            result = `_${t}_`;
                        } else if (action === 'waMono') {
                            result = '`' + t + '`';
                        } else if (action === 'xSplit') {
                            const chunks = [];
                            const max = 280;
                            const words = t.split(/\s+/);
                            let cur = '';
                            for (const w of words) {
                                if ((cur + (cur? ' ':'') + w).length > max) { chunks.push(cur); cur = w; } else { cur = cur ? cur + ' ' + w : w; }
                            }
                            if (cur) chunks.push(cur);
                            result = chunks.map((c,i)=>`(${i+1}/${chunks.length}) ${c}`).join('\n\n');
                        } else if (action === 'tweetLink') {
                            const msg = encodeURIComponent(t.trim());
                            if (!msg) { this.showNotification('Write a message to share', 'warning'); return; }
                            result = `https://twitter.com/intent/tweet?text=${msg}`;
                            this.showNotification('🐦 Twitter intent link', 'success');
                        } else if (action === 'tgShare') {
                            const msg = encodeURIComponent(t.trim());
                            if (!msg) { this.showNotification('Write a message to share', 'warning'); return; }
                            result = `https://t.me/share/url?url=&text=${msg}`;
                            this.showNotification('✈️ Telegram share link', 'success');
                        } else if (action === 'discordTimeNow') {
                            const now = Math.floor(Date.now() / 1000);
                            result = `<t:${now}:F>`;
                            this.showNotification('🕒 Discord time tag', 'success');
                        } else if (action === 'slackLinkify') {
                            // Convert [text](url) markdown to <url|text>
                            result = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');
                        } else if (action === 'slackFormat') {
                            // Basic markdown to Slack: bold/italic/code
                            result = t.replace(/\*\*(.*?)\*\*/g, '*$1*').replace(/_(.*?)_/g, '_$1_').replace(/`([^`]+)`/g, '```$1```');
                        } else if (action === 'tgEscape') {
                            // Escape Telegram MarkdownV2 special chars
                            result = t.replace(/([_\*\[\]\(\)~`>#+\-=\|{}\.\!])/g, '\\$1');
                        } else if (action === 'tgCodeBlock') {
                            result = '```\n' + t + '\n```';
                        } else if (action === 'redditSpoiler') {
                            result = '>!' + t + '!<';
                        } else if (action === 'ytTimestamps') {
                            // Normalize HH:MM:SS to 0:00 style and align list
                            const lines = t.split(/\r?\n/).filter(Boolean);
                            const norm = (s)=>{
                                const m = s.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
                                if (!m) return s;
                                const h = parseInt(m[1],10), mi = parseInt(m[2],10), se = m[3]?parseInt(m[3],10):0;
                                return (h? h+':':'' ) + String(mi).padStart(h?2:1,'0') + ':' + String(se).padStart(2,'0');
                            };
                            result = lines.map(l=>{
                                const parts = l.split(/\s+-\s+|\s+\|\s+|\s+/);
                                const ts = norm(parts[0]);
                                const title = l.slice(l.indexOf(parts[1]||'')>=0? l.indexOf(parts[1]): (ts.length)).trim();
                                return ts + ' - ' + (title || '');
                            }).join('\n');
                        } else {
                            this.showNotification('❌ Unknown social action', 'error');
                            return;
                        }
                        break;
                    }
                    // Track successful utility usage
                    if (window.AutoOpt) try { window.AutoOpt.trackUsage({ group: type, action }); } catch {}

                    case 'fancy': {
                        if (action === 'bold') {
                            result = (window.Utils && window.Utils.Text) ? window.Utils.Text.toBoldUnicode(this.text) : this.text;
                            this.showNotification('✨ Bold Unicode applied', 'success');
                        } else if (action === 'mono') {
                            result = (window.Utils && window.Utils.Text) ? window.Utils.Text.toMonospace(this.text) : this.text;
                            this.showNotification('✨ Monospace Unicode applied', 'success');
                        } else {
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
                        } catch (e) {
                            this.showNotification('❌ Invalid regex: ' + e.message, 'error');
                            return;
                        }
                        if (action === 'test') {
                            const matched = re.test(this.text);
                            result = `Regex: /${pattern}/${flags}\nMatched: ${matched}`;
                            this.showNotification('🧩 Regex tested', 'success');
                        } else if (action === 'extract') {
                            const matches = [...this.text.matchAll(re)];
                            if (matches.length === 0) {
                                result = 'No matches found';
                            } else {
                                result = matches.map((m, i) => `#${i+1}: ${m[0]}${m.length>1 ? '\n' + m.slice(1).map((g,gi)=>`  ($${gi+1}): ${g}`).join('\n') : ''}`).join('\n');
                            }
                            this.showNotification('🧩 Groups extracted', 'success');
                        }
                        break;
                    }
                    case 'convert': {
                        if (action === 'csvtojson') {
                            const lines = this.text.split(/\r?\n/).filter(Boolean);
                            if (lines.length === 0) { result = '[]'; break; }
                            const headers = lines[0].split(',').map(h=>h.trim());
                            const rows = lines.slice(1).map(line=>{
                                const cells = line.split(',');
                                const obj = {};
                                headers.forEach((h, idx)=> obj[h] = (cells[idx]||'').trim());
                                return obj;
                            });
                            result = JSON.stringify(rows, null, 2);
                            this.showNotification('🔁 CSV → JSON', 'success');
                        } else if (action === 'jsontocsv') {
                            try {
                                const arr = JSON.parse(this.text);
                                if (!Array.isArray(arr) || arr.length === 0) { result = ''; break; }
                                const headers = Array.from(new Set(arr.flatMap(o => Object.keys(o))));
                                const csv = [headers.join(',')].concat(
                                    arr.map(o => headers.map(h => (o[h] ?? '').toString().replace(/"/g, '""')).join(','))
                                ).join('\n');
                                result = csv;
                                this.showNotification('🔁 JSON → CSV', 'success');
                            } catch (e) {
                                this.showNotification('❌ Invalid JSON', 'error');
                                return;
                            }
                        }
                        break;
                    }
                    case 'time': {
                        if (action === 'epoch2date') {
                            const num = Number(this.text.trim());
                            const ms = (''+num).length <= 10 ? num*1000 : num;
                            const d = new Date(ms);
                            result = isNaN(d.getTime()) ? 'Invalid epoch' : d.toISOString();
                            this.showNotification('⏱️ Epoch → Date', 'success');
                        } else if (action === 'date2epoch') {
                            const d = new Date(this.text.trim());
                            result = isNaN(d.getTime()) ? 'Invalid date' : Math.floor(d.getTime()/1000).toString();
                            this.showNotification('⏱️ Date → Epoch', 'success');
                        }
                        break;
                    }
                    case 'unicode': {
                        if (action === 'removediacritics') {
                            // Remove combining marks (universal)
                            result = this.text.normalize('NFD').replace(/[\u0300-\u036f]+/g, '');
                            this.showNotification('🌐 Removed diacritics', 'success');
                        } else if (action === 'normalize') {
                            result = this.text.normalize('NFKC');
                            this.showNotification('🌐 Normalized (NFKC)', 'success');
                        } else if (action === 'slugify') {
                            result = this.text.normalize('NFD').replace(/\p{Diacritic}+/gu,'')
                                .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
                            this.showNotification('🌐 Slugified', 'success');
                        }
                        break;
                    }
                    case 'jwt': {
                        if (action === 'decode') {
                            try {
                                const [h,p,s] = this.text.split('.');
                                const dec = (v)=> JSON.parse(decodeURIComponent(escape(atob(v.replace(/-/g,'+').replace(/_/g,'/')))));
                                const out = { header: dec(h), payload: dec(p), signature: s || '' };
                                result = JSON.stringify(out, null, 2);
                                this.showNotification('🧾 JWT decoded', 'success');
                            } catch (e) {
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
                                    for (const [k,v] of params.entries()) { if (obj[k]) obj[k] = [].concat(obj[k], v); else obj[k] = v; }
                                    return obj;
                                }, { max: 300 }),
                                j2q: window.Utils?.memoizeByInput((obj) => {
                                    const params = new URLSearchParams();
                                    Object.entries(obj).forEach(([k,v]) => { if (Array.isArray(v)) v.forEach(x => params.append(k, x)); else params.set(k, v); });
                                    return '?' + params.toString();
                                }, { max: 300 })
                            };
                        }
                        if (action === 'querytojson') {
                            const q = this.text.trim().replace(/^\?/, '');
                            const obj = this._memoURL.q2j(q);
                            result = JSON.stringify(obj, null, 2);
                            this.showNotification('🔗 Query → JSON', 'success');
                        } else if (action === 'jsontoquery') {
                            try {
                                const obj = JSON.parse(this.text);
                                result = this._memoURL.j2q(obj);
                                this.showNotification('🔗 JSON → Query', 'success');
                            } catch (e) { this.showNotification('❌ Invalid JSON', 'error'); return; }
                        }
                        break;
                    }
                    case 'diff': {
                        const prev = this.historyIndex > 0 ? this.history[this.historyIndex - 1] : '';
                        const a = (prev||'').split('\n');
                        const b = this.text.split('\n');
                        function unifiedDiff(a,b){
                            const out = [];
                            const max = Math.max(a.length,b.length);
                            for(let i=0;i<max;i++){
                                const la=a[i]??'', lb=b[i]??'';
                                if(la===lb){ out.push(' '+lb); }
                                else {
                                    if(la) out.push('-'+la);
                                    if(lb) out.push('+'+lb);
                                }
                            }
                            return out.join('\n');
                        }
                        if (action === 'summary') {
                            const setA = new Set(a);
                            const setB = new Set(b);
                            let added = 0, removed = 0;
                            for (const line of b) if (!setA.has(line)) added++;
                            for (const line of a) if (!setB.has(line)) removed++;
                            result = `Diff summary:\n+ Added: ${added}\n- Removed: ${removed}`;
                            this.showNotification('🧪 Diff summary created', 'success');
                        } else if (action === 'insert') {
                            result = unifiedDiff(a,b);
                            this.showNotification('🧪 Unified diff inserted', 'success');
                        }
                        break;
                    }
                    case 'uuid': {
                        if (action === 'batch') {
                            const gen = ( ) => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                                const r = Math.random()*16|0, v = c==='x'? r : (r&0x3|0x8); return v.toString(16);
                            });
                            result = Array.from({length:10}, gen).join('\n');
                            this.showNotification('🆔 UUIDs generated', 'success');
                        }
                        break;
                    }
                    case 'discord':
                        switch(action) {
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
                        switch(action) {
                            case 'md5':
                                result = window.HashUtils ? window.HashUtils.simpleHash(this.text, 'md5') : this.simpleHash(this.text, 'md5');
                                break;
                            case 'sha256':
                                if (window.HashUtils && window.HashUtils.sha256) {
                                    // Use async version if available
                                    window.HashUtils.sha256(this.text).then(hash => {
                                        this.text = hash;
                                        this.updateStats();
                                        this.showNotification('🔐 SHA256 hash generated!', 'success');
                                    });
                                    return; // Exit early for async operation
                                } else {
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
                                    } catch (e) {
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
                                    } catch (e) {
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
                if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
                this.updateStats();
                if (window.AutoOpt) { try { window.AutoOpt.trackUsage({ group: type, action }); } catch {} }
            } catch (error) {
                this.showNotification('❌ Processing failed: ' + error.message, 'error');
                console.error('Process error:', error);
            }
        },

        simpleHash(text, type) {
            let hash = 0;
            if (text.length === 0) return hash.toString();
            
            for (let i = 0; i < text.length; i++) {
                const char = text.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
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
                    
                } else if (action === 'deobfuscate') {
                    let indentLevel = 0;
                    const lines = result.split(/\s*\n\s*/);
                    const formattedLines = [];
                    
                    lines.forEach(line => {
                        line = line.trim();
                        if (!line) return;
                        
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
                if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
                this.updateStats();
            } catch (error) {
                this.showNotification('❌ Lua processing failed', 'error');
                console.error('Lua error:', error);
            }
        },

        closeOtherPanels(keepOpen = null) {
            if (keepOpen !== 'format') this.formatOpen = false;
            if (keepOpen !== 'utils') this.utilsOpen = false;
            if (keepOpen !== 'dev') this.devToolsOpen = false;
            if (keepOpen !== 'search') this.searchOpen = false;
            if (keepOpen !== 'ai') this.aiOpen = false;
        },

        togglePanel(panel) {
            switch(panel) {
                case 'format':
                    this.closeOtherPanels('format');
                    this.formatOpen = !this.formatOpen;
                    if (window.AutoOpt) { try { window.AutoOpt.trackPanel('format', this.formatOpen); } catch {} }
                    if (window.UXBrain) { try { window.UXBrain.trackPanel('format', this.formatOpen); } catch {} }
                    break;
                case 'utils':
                    this.closeOtherPanels('utils');
                    this.utilsOpen = !this.utilsOpen;
                    if (window.AutoOpt) { try { window.AutoOpt.trackPanel('utils', this.utilsOpen); } catch {} }
                    if (window.UXBrain) { try { window.UXBrain.trackPanel('utils', this.utilsOpen); } catch {} }
                    break;
                case 'dev':
                    this.closeOtherPanels('dev');
                    this.devToolsOpen = !this.devToolsOpen;
                    if (window.AutoOpt) { try { window.AutoOpt.trackPanel('dev', this.devToolsOpen); } catch {} }
                    if (window.UXBrain) { try { window.UXBrain.trackPanel('dev', this.devToolsOpen); } catch {} }
                    break;
                case 'search':
                    this.closeOtherPanels('search');
                    this.searchOpen = !this.searchOpen;
                    if (window.AutoOpt) { try { window.AutoOpt.trackPanel('search', this.searchOpen); } catch {} }
                    if (window.UXBrain) { try { window.UXBrain.trackPanel('search', this.searchOpen); } catch {} }
                    break;
                case 'ai':
                    this.closeOtherPanels('ai');
                    this.aiOpen = !this.aiOpen;
                    if (window.AutoOpt) { try { window.AutoOpt.trackPanel('ai', this.aiOpen); } catch {} }
                    if (window.UXBrain) { try { window.UXBrain.trackPanel('ai', this.aiOpen); } catch {} }
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
            if (!textarea) return;

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
            if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
            this.updateStats();

            // Restore selection
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
                const maxAttempts = 50; // 5 seconds max wait time
                
                const checkDependencies = () => {
                    attempts++;
                    
                    // Check if required dependencies are loaded
                    const hasLZString = !!window.LZString;
                    const hasSmartCompress = !!window.SmartCompress;
                    
                    console.log(`Dependency check attempt ${attempts}:`, { hasLZString, hasSmartCompress });
                    
                    if (hasLZString && hasSmartCompress) {
                        console.log('All dependencies loaded successfully');
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        console.warn('Timeout waiting for dependencies. Proceeding anyway.', { hasLZString, hasSmartCompress });
                        resolve(); // Resolve anyway to not block the app
                    } else {
                        // Wait 100ms and try again
                        setTimeout(checkDependencies, 100);
                    }
                };
                
                // Start checking
                checkDependencies();
            });
        },

        loadFromURL() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const isCompressed = urlParams.get('c') === '1';
                const scheme = urlParams.get('s') || 'lu';
                const plainText = urlParams.get('text');
                const titleParam = urlParams.get('title');
                
                console.log('LoadFromURL - checking params:', { isCompressed, hasPlainText: !!plainText, hasTitle: !!titleParam });
                
                // Check if immediate-decompress.js already handled this
                const currentTextLength = this.text.length;
                console.log('Current text length:', currentTextLength);
                
                // If we already have text loaded (by immediate script), skip URL processing
                if (currentTextLength > 0) {
                    console.log('Text already loaded by immediate script, skipping URL processing');
                    
                    // Just handle title if it exists and wasn't set yet
                    if (titleParam) {
                        this.title = titleParam;
                        document.title = titleParam + ' - Hexa';
                    }
                    
                    // Clean URL
                    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                    return;
                }
                
                console.log('No text loaded yet, processing URL parameters...');
                
                let textToLoad = null;
                
                if (isCompressed) {
                    // Load compressed text from 't' parameter
                    const compressedText = urlParams.get('t');
                    console.log('Compressed text parameter:', compressedText ? compressedText.substring(0, 50) + '...' : 'null');
                    
                    if (compressedText) {
                        try {
                            // Try LZString decompression directly (most reliable)
                            console.log('Attempting LZString decompression');
                            textToLoad = window.LZString ? window.LZString.decompressFromEncodedURIComponent(compressedText) : null;
                            
                            // Try SmartCompress as fallback if LZString fails
                            if (!textToLoad && window.SmartCompress && scheme !== 'raw') {
                                console.log('Attempting SmartCompress decompression with scheme:', scheme);
                                textToLoad = window.SmartCompress.decompress(scheme, compressedText);
                            }
                            
                            if (textToLoad) {
                                console.log('Setting decompressed text:', textToLoad.substring(0, 100) + '...');
                                
                                // IMMEDIATELY set the text - don't wait for nextTick
                                this.text = textToLoad;
                                
                                // Also directly update the textarea without waiting
                                const textarea = document.getElementById('textInput');
                                if (textarea) {
                                    textarea.value = textToLoad;
                                    console.log('Textarea updated directly');
                                }
                                
                                // Update storage immediately
                                if (window.TextStore) {
                                    window.TextStore.set(textToLoad);
                                } else {
                                    try {
                                        localStorage.setItem('text', textToLoad);
                                    } catch (error) {
                                        console.warn('Failed to save to localStorage:', error);
                                    }
                                }
                                
                                // Update stats
                                this.updateStats();
                                
                                this.showNotification('✨ Shared text loaded and decompressed!', 'success');
                                console.log('Successfully decompressed text, length:', textToLoad.length);
                            } else {
                                throw new Error('Decompression failed - no valid result');
                            }
                        } catch (error) {
                            console.error('Decompression error:', error);
                            this.showNotification('❌ Failed to load compressed text', 'error');
                        }
                    }
                } else if (plainText) {
                    // Load uncompressed text from 'text' parameter
                    console.log('Loading plain text from URL');
                    textToLoad = plainText;
                    this.text = textToLoad;
                    this.showNotification('✨ Shared text loaded!', 'success');
                }
                
                // Load title if provided (temporary, not saved)
                if (titleParam) {
                    this.title = titleParam;
                    document.title = titleParam + ' - Hexa';
                }
                
                // Clean URL after loading
                if (textToLoad || plainText) {
                    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }
                
            } catch (error) {
                console.error('Error loading from URL:', error);
                this.showNotification('❌ Failed to load from URL', 'error');
            }
        },

        // Debug function to manually test decompression
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
                        
                        // Force textarea update
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
                } catch (error) {
                    console.error('Manual decompression failed:', error);
                }
            }
            return null;
        },

        init() {
            // Explicitly set aiProcessing to false during initialization to prevent overlay flash
            this.aiProcessing = false;
            
            // Ensure text is always a string to prevent Alpine.js errors
            if (typeof this.text !== 'string') {
                this.text = String(this.text || '');
            }
            
            // Wait for dependencies to load before loading from URL
            this.waitForDependencies().then(() => {
                // Load text from URL parameters first, before other initialization
                this.loadFromURL();
                
                // Continue with other initialization after URL loading
                this.saveToHistory();
                this.updateWritingStats();
                this.initPerformanceOptimizations();
            }).catch(error => {
                console.warn('Failed to wait for dependencies:', error);
                // Try to load anyway
                this.loadFromURL();
                this.saveToHistory();
                this.updateWritingStats();
                this.initPerformanceOptimizations();
            });
            
            // Make debug function available globally
            window.debugDecompression = () => this.debugDecompression();
            
            // Backup: check URL params again after 2 seconds in case initial load failed
            setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('c') === '1' && urlParams.get('t') && this.text.length === 0) {
                    console.log('Backup URL loading triggered...');
                    this.loadFromURL();
                }
            }, 2000);
            
            // Check for external Puter auth state changes on startup
            if (window.puterAI) {
                window.puterAI.refreshAuthState();
            }
            
            // Listen for auth state changes from Puter
            window.addEventListener('puterAuthStateChange', (event) => {
                const { isAuthenticated, user, fallbackMode, initialized } = event.detail;
                
                // Update Alpine.js internal state
                this.puterAuth.isAuthenticated = isAuthenticated;
                this.puterAuth.initialized = initialized;
                this.puterAuth.fallbackMode = fallbackMode;
                this.puterAuth.userInfo = user; // This was missing!
                
                if (isAuthenticated && !fallbackMode) {
                    this.showNotification('✅ Puter.js connected - AI features available!', 'success');
                } else if (!isAuthenticated) {
                    this.showNotification('🔵 Offline Mode - Using local fallback', 'info');
                }
                
                // Force Alpine.js to update the UI
                this.$nextTick(() => {
                    // UI updated
                });
            });
            
            // Listen for custom notification events (e.g., session restoration)
            window.addEventListener('showNotification', (event) => {
                const { message, type } = event.detail;
                this.showNotification(message, type || 'info');
            });
            
            // Set up periodic auth state checking for external Puter sessions
            setInterval(() => {
                if (window.puterAI) {
                    window.puterAI.refreshAuthState();
                }
            }, 5000); // Check every 5 seconds
            
            // Listener to detect exit from fullscreen
            document.addEventListener('fullscreenchange', () => {
                if (!document.fullscreenElement && this.focusMode) {
                    this.focusMode = false;
                    this.showNotification('🎯 Focus mode OFF', 'success');
                }
            });
            
            document.addEventListener('webkitfullscreenchange', () => {
                if (!document.webkitFullscreenElement && this.focusMode) {
                    this.focusMode = false;
                    this.showNotification('🎯 Focus mode OFF', 'success');
                }
            });
            
            this.autoSaveInterval = setInterval(() => {
                const last = (typeof window.__hexaLastSavedText === 'string')
                  ? window.__hexaLastSavedText
                  : (window.TextStore ? window.TextStore.get() : localStorage.getItem('text'));
                if (this.text !== last) {
                    if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
                    this.lastSaveTime = Date.now();
                }
            }, 30000);
            
            setInterval(() => {
                this.updateWritingStats();
            }, 60000);
            
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case 'z':
                            if (e.shiftKey) {
                                e.preventDefault();
                                this.redo();
                            } else {
                                e.preventDefault();
                                this.undo();
                            }
                            break;
                        case 's':
                            e.preventDefault();
                            if (window.TextStore) { window.TextStore.set(this.text); } else { try { localStorage.setItem('text', this.text); } catch {} }
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
                    this.focusMode = false;
                }
            });

            this.$watch('darkMode', value => {
                localStorage.setItem('darkMode', value);
                if (value) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                if (window.AutoOpt) { try { window.AutoOpt.trackThemeChange(value); } catch {} }
            });

            const params = new URLSearchParams(window.location.search);
            const textParam = params.get('text');
            const compressedParam = params.get('t'); // payload (compressed when c=1)
            const isCompressed = params.get('c') === '1';
            const schemeParam = params.get('s'); // scheme: lu | lb | w1
            const titleParam = params.get('title');

            // Process text from URL
            if (textParam || compressedParam) {
                let finalText = '';
                
                try {
                    if (compressedParam && isCompressed) {
                        // Decompress text using scheme
                        if (window.SmartCompress && schemeParam) {
                            finalText = window.SmartCompress.decompress(schemeParam, compressedParam);
                        } else {
                            // Fallback to URI-safe
                            finalText = LZString.decompressFromEncodedURIComponent(compressedParam);
                        }
                        if (!finalText) { throw new Error('Decompression failed'); }
                    } else if (textParam) {
                        // Uncompressed text (traditional)
                        finalText = textParam;
                    } else if (compressedParam) {
                        // Fallback: try to decompress without flag
                        try {
                            if (window.SmartCompress && schemeParam) {
                                finalText = window.SmartCompress.decompress(schemeParam, compressedParam);
                            } else {
                                finalText = LZString.decompressFromEncodedURIComponent(compressedParam);
                            }
                            if (!finalText) {
                                finalText = compressedParam; // Use as plain text if it fails
                            }
                        } catch (e) {
                            finalText = compressedParam;
                        }
                    }
                    
                    if (finalText) {
                        this.text = finalText;
                        if (window.TextStore) { window.TextStore.set(finalText); } else { try { localStorage.setItem('text', finalText); } catch {} }
                        
                        // Show success notification for URL load
                        setTimeout(() => {
                            if (isCompressed && compressedParam) {
                                const compressionRatio = ((1 - compressedParam.length / finalText.length) * 100).toFixed(1);
                                this.showNotification(`📄 Text loaded from URL (${compressionRatio}% compressed)`, 'success');
                            } else {
                                this.showNotification('📄 Text loaded from URL', 'success');
                            }
                        }, 500);
                    }
                    
                } catch (error) {
                    console.error('Error processing text from URL:', error);
                    // Fallback: try using the parameter as plain text
                    const fallbackText = compressedParam || textParam;
                    if (fallbackText) {
                        this.text = fallbackText;
                        if (window.TextStore) { window.TextStore.set(fallbackText); } else { try { localStorage.setItem('text', fallbackText); } catch {} }
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

            // Apply subtle optimizations shortly after init and periodically
            setTimeout(() => { if (window.AutoOpt) { try { window.AutoOpt.applyOptimizations(this); } catch {} } }, 1200);
            setInterval(() => { if (window.AutoOpt) { try { window.AutoOpt.applyOptimizations(this); } catch {} } }, 90000);

            // Kick UXBrain periodic suggestions as well (safe if not present)
            setInterval(() => { if (window.UXBrain) { try { window.UXBrain.tick(this); } catch {} } }, 60000);

            // Track editor input behavior (debounced)
            try {
                const ta = document.getElementById('textInput');
                if (ta && window.Utils && Utils.debounce) {
                    const trackInput = Utils.debounce(() => {
                        if (window.AutoOpt) window.AutoOpt.trackUsage({ group: 'editor', action: 'input' });
                        try {
                            // Approximate CPM and idleMs for UXBrain
                            const minutes = Math.max(1/60, (this.writingTime||1)/60);
                            const cpm = (this.text||'').length / minutes;
                            if (window.UXBrain) window.UXBrain.trackTyping(cpm, 0);
                        } catch {}
                    }, 1500);
                    ta.addEventListener('input', trackInput);
                }
            } catch {}
        },

        codeFeature(action) {
            const allowWithoutText = new Set(['nowIsoEpoch','uuidBatch','passwords','httpFetchSnippet','axiosSnippet']);
            if (!allowWithoutText.has(action) && !this.text.trim()) {
                this.showNotification('❌ Add text to use smart functions', 'warning');
                return;
            }

            this.saveToHistory();
            
            try {
                let result = '';
                const txt = this.text || '';
                // Memoized helpers (created once per app instance)
                if (!this._memo) {
                    this._memo = {
                        parseJSON: window.Utils?.memoizeByInput((s) => JSON.parse(s), { max: 200 }),
                        stringifySorted: window.Utils?.memoizeByInput((o) => JSON.stringify(o, null, 2), { max: 200 }),
                        hex2rgb: window.Utils?.memoizeByInput((h) => {
                            let m = h.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
                            if (!m) return null;
                            let hh = m[1]; if (hh.length === 3) hh = hh.split('').map(c=>c+c).join('');
                            const r = parseInt(hh.slice(0,2),16), g = parseInt(hh.slice(2,4),16), b = parseInt(hh.slice(4,6),16);
                            return `rgb(${r}, ${g}, ${b})`;
                        }, { max: 500 }),
                        rgb2hex: window.Utils?.memoizeByInput((rgbstr) => {
                            const m = rgbstr.match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
                            if (!m) return null;
                            const toHex = (n) => Math.max(0, Math.min(255, parseInt(n,10))).toString(16).padStart(2,'0');
                            return '#' + toHex(m[1]) + toHex(m[2]) + toHex(m[3]);
                        }, { max: 500 })
                    };
                }
                switch(action) {
                    // JSON Toolkit
                    case 'jsonValidate': {
                        try { JSON.parse(txt); this.showNotification('Valid JSON ✅', 'success'); } catch (e) { this.showNotification('Invalid JSON: ' + e.message, 'error'); }
                        return;
                    }
                    case 'jsonPretty': {
                        try { const obj = this._memo.parseJSON(txt); result = JSON.stringify(obj, null, 2); } catch (e) { this.showNotification('Invalid JSON: ' + e.message, 'error'); return; }
                        break;
                    }
                    case 'jsonMinify': {
                        try { const obj = this._memo.parseJSON(txt); result = JSON.stringify(obj); } catch (e) { this.showNotification('Invalid JSON: ' + e.message, 'error'); return; }
                        break;
                    }
                    case 'jsonSortKeys': {
                        try {
                            const obj = this._memo.parseJSON(txt);
                            const sortObj = (o) => Array.isArray(o) ? o.map(sortObj) : (o && typeof o === 'object') ? Object.keys(o).sort().reduce((acc,k)=>{acc[k]=sortObj(o[k]);return acc;}, {}) : o;
                            result = JSON.stringify(sortObj(obj), null, 2);
                        } catch (e) { this.showNotification('Invalid JSON: ' + e.message, 'error'); return; }
                        break;
                    }

                    // Encoding & Base
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

                    // Color Tools
                    case 'hexToRgb': {
                        const rgb = this._memo.hex2rgb(txt);
                        if (!rgb) { this.showNotification('Provide HEX like #ff00aa', 'warning'); return; }
                        result = rgb;
                        break;
                    }
                    case 'rgbToHex': {
                        const hex = this._memo.rgb2hex(txt);
                        if (!hex) { this.showNotification('Provide RGB like rgb(255, 0, 170)', 'warning'); return; }
                        result = hex;
                        break;
                    }
                    case 'palette': {
                        const src = (this.searchTerm || txt || '').trim();
                        const m = src.match(/#?[0-9a-fA-F]{6}/);
                        if (!m) { this.showNotification('Provide a HEX color in the editor or search', 'warning'); return; }
                        const base = m[0].replace('#','');
                        const toRgb = (h)=>({ r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16) });
                        const toHex = ({r,g,b})=> '#' + [r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
                        const {r,g,b} = toRgb(base);
                        const variants = [ {r:r*0.9,g:g*0.9,b:b*0.9}, {r:r*0.75,g:g*0.75,b:b*0.75}, {r:r*1.1,g:g*1.1,b:b*1.1}, {r:r*1.25,g:g*1.25,b:b*1.25} ].map(toHex);
                        result = ['#'+base, ...variants].join('\n');
                        break;
                    }

                    // Extractors
                    case 'extractIPs': {
                        const ips = Array.from(txt.matchAll(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g)).map(m=>m[0]);
                        result = ips.join('\n');
                        break;
                    }
                    case 'extractDomains': {
                        const domains = Array.from(txt.matchAll(/\b([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi)).map(m=>m[0].toLowerCase());
                        result = Array.from(new Set(domains)).join('\n');
                        break;
                    }
                    case 'extractHashtags': {
                        const tags = Array.from(txt.matchAll(/#(\w+)/g)).map(m=>m[0]);
                        result = Array.from(new Set(tags)).join(' ');
                        break;
                    }
                    case 'extractMentions': {
                        const at = Array.from(txt.matchAll(/@(\w+)/g)).map(m=>m[0]);
                        result = Array.from(new Set(at)).join(' ');
                        break;
                    }

                    // URL & Time
                    case 'parseURL': {
                        try {
                            const src = (this.searchTerm || txt).trim();
                            const u = new URL(src);
                            const out = { href: u.href, protocol: u.protocol, host: u.host, hostname: u.hostname, port: u.port, pathname: u.pathname, hash: u.hash, query: Object.fromEntries(u.searchParams.entries()) };
                            result = JSON.stringify(out, null, 2);
                        } catch (e) { this.showNotification('Invalid URL', 'warning'); return; }
                        break;
                    }
                    case 'nowIsoEpoch': {
                        const now = new Date();
                        result = JSON.stringify({ iso: now.toISOString(), epoch: Math.floor(now.getTime()/1000) }, null, 2);
                        break;
                    }

                    // Snippets
                    case 'httpFetchSnippet': {
                        result = `// fetch example\nfetch('https://api.example.com/data', {\n  method: 'GET',\n  headers: { 'Accept': 'application/json' }\n})\n  .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })\n  .then(console.log)\n  .catch(console.error);`;
                        break;
                    }
                    case 'axiosSnippet': {
                        result = `// Axios in Node.js\nconst axios = require('axios');\n(async ()=>{\n  try {\n    const { data } = await axios.get('https://api.example.com/data');\n    console.log(data);\n  } catch (err) {\n    console.error(err.message);\n  }\n})();`;
                        break;
                    }
                    case 'uuidBatch': {
                        const u = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random()*16)|0, v = c === 'x' ? r : (r&0x3|0x8); return v.toString(16); });
                        result = Array.from({length:10}, u).join('\n');
                        break;
                    }
                    case 'passwords': {
                        const gen = (len=14)=>{ const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+'; return Array.from({length:len},()=>chars[Math.floor(Math.random()*chars.length)]).join(''); };
                        result = Array.from({length:5},()=>gen(14)).join('\n');
                        break;
                    }
                   
                    case 'validateCode':
                        const language = this.detectLanguage(this.text);
                        const validation = CodeFeatures.validateCode(this.text, language);
                        result = `🔍 Code validation (${language}):\n\n`;
                        if (validation.isValid) {
                            result += '✅ Valid code\n\n';
                        } else {
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
                if (window.AutoOpt) { try { window.AutoOpt.trackUsage({ group: 'codeFeature', action }); } catch {} }
            } catch (error) {
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
            } catch {
                return 'javascript';
            }
        },

        // Emergency unlock function
        forceUnlockAI() {
            this.aiProcessing = false;
            this.showNotification('🔓 AI processing unlocked manually', 'success');
        },

        // Cancel AI request function
        cancelAIRequest() {
            if (this.aiAbortController) {
                this.aiAbortController.abort();
                this.aiAbortController = null;
            }
            this.aiProcessing = false;
            this.showNotification('❌ AI request cancelled', 'info');
        },

        // Check authentication before AI operations
        checkAIAuthentication() {
            if (!this.puterAuth.isAuthenticated) {
                this.showNotification('🔒 Please sign in with your Puter account to use AI features', 'warning');
                // Close AI panel and redirect to main auth button
                this.aiOpen = false;
                setTimeout(() => {
                    this.toggleAuthMenu();
                }, 300); // Small delay to allow panel to close smoothly
                return false;
            }
            return true;
        },

        // AI Utility Methods
        async aiSummarize(length) {
            // Check authentication first
            if (!this.checkAIAuthentication()) {
                return;
            }

            // Prevent concurrent AI processing
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
            
            // Set a timeout to prevent hanging
            let timeoutId = setTimeout(() => {
                if (this.aiAbortController) {
                    this.aiAbortController.abort();
                }
                this.aiProcessing = false;
                this.showNotification('⏰ AI request timed out', 'error');
            }, 30000); // 30 seconds timeout
            
            try {
                const result = await window.puterAI.summarizeText(this.text, length, this.aiAbortController.signal);
                clearTimeout(timeoutId);
                
                if (this.aiAbortController?.signal.aborted) {
                    return; // Request was cancelled
                }
                
                this.text = result;
                this.updateStats();
                this.showNotification(`✨ Text summarized (${length})`, 'success');
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    return; // Request was cancelled, don't show error
                }
                this.showNotification('❌ Summarization failed', 'error');
                console.error('AI Summarization error:', error);
            } finally {
                this.aiProcessing = false;
                this.aiAbortController = null;
            }
        },

        async aiConvertCode() {
            // Check authentication first
            if (!this.checkAIAuthentication()) {
                return;
            }

            // Prevent concurrent AI processing
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }

            if (!this.text.trim()) {
                this.showNotification('❌ No code to convert', 'error');
                return;
            }

            this.aiProcessing = true;
            
            // Set a timeout to prevent hanging
            let timeoutId = setTimeout(() => {
                this.aiProcessing = false;
                this.showNotification('⏰ AI request timed out', 'error');
            }, 30000); // 30 seconds timeout
            
            try {
                const result = await window.puterAI.convertCode(
                    this.text, 
                    this.aiFromLanguage, 
                    this.aiToLanguage
                );
                clearTimeout(timeoutId);
                this.text = result;
                this.updateStats();
                this.showNotification(`🔄 Code converted: ${this.aiFromLanguage} → ${this.aiToLanguage}`, 'success');
            } catch (error) {
                clearTimeout(timeoutId);
                this.showNotification('❌ Code conversion failed', 'error');
                console.error('AI Code conversion error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiEnhanceText(enhancement) {
            // Check authentication first
            if (!this.checkAIAuthentication()) {
                return;
            }

            // Prevent concurrent AI processing
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
            } catch (error) {
                this.showNotification('❌ Text enhancement failed', 'error');
                console.error('AI Text enhancement error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiTranslateText() {
            // Check authentication first
            if (!this.checkAIAuthentication()) {
                return;
            }

            // Prevent concurrent AI processing
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
            } catch (error) {
                this.showNotification('❌ Translation failed', 'error');
                console.error('AI Translation error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiCheckGrammar() {
            // Check authentication first
            if (!this.checkAIAuthentication()) {
                return;
            }

            // Prevent concurrent AI processing
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
            } catch (error) {
                this.showNotification('❌ Grammar check failed', 'error');
                console.error('AI Grammar check error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiGenerateContent() {
            // Check authentication first
            if (!this.checkAIAuthentication()) {
                return;
            }

            // Prevent concurrent AI processing
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
                const result = await window.puterAI.generateContent(
                    this.aiContentTopic, 
                    this.aiContentType,
                    this.aiContentLength
                );
                this.text = result;
                this.updateStats();
                this.showNotification(`🎨 Content generated: ${this.aiContentType} about "${this.aiContentTopic}"`, 'success');
                this.aiContentTopic = ''; // Clear topic after generation
            } catch (error) {
                this.showNotification('❌ Content generation failed', 'error');
                console.error('AI Content generation error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiSendMessage() {
            // Check authentication first
            if (!this.checkAIAuthentication()) {
                return;
            }

            // Prevent concurrent AI processing
            if (this.aiProcessing) {
                this.showNotification('⏳ AI is already processing, please wait...', 'warning');
                return;
            }

            if (!this.aiChatMessage.trim()) {
                return;
            }

            const userMessage = this.aiChatMessage;
            this.aiChatMessage = '';

            // Add user message to history
            this.aiChatHistory.push({
                id: Date.now(),
                role: 'user',
                content: userMessage
            });

            this.aiProcessing = true;
            try {
                // Process chat with AI
                if (!window.puterAI || !window.puterAI.chatWithAI) {
                    throw new Error('PuterAI or chatWithAI method not available');
                }
                
                const response = await window.puterAI.chatWithAI(userMessage); // Remove history parameter for now
                
                // Add AI response to history
                this.aiChatHistory.push({
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: response
                });

                // Keep chat history manageable
                if (this.aiChatHistory.length > 20) {
                    this.aiChatHistory = this.aiChatHistory.slice(-20);
                }

            } catch (error) {
                this.showNotification('❌ AI chat failed', 'error');
                console.error('AI Chat error:', error);
                
                // Add error message to chat
                this.aiChatHistory.push({
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please try again.'
                });
            } finally {
                this.aiProcessing = false;
            }
        },

        // Puter.js Authentication Methods
        async init() {
            // Initialize application
            this.updateStats();
            this.setupAutoSave();
            this.startWritingTimer();
            await this.checkPuterAuth();
        },

        async checkPuterAuth() {
            try {
                // Wait for PuterAI to initialize
                if (window.puterAI && window.puterAI.initialized) {
                    // Only check authentication status when explicitly needed
                    // This prevents automatic 401 errors on page load
                    console.log('PuterAI ready for authentication when needed');
                }
            } catch (error) {
                console.warn('Auth check failed:', error);
            }
        },

        // Advanced AI Code Utilities
        async aiGenerateDocumentation() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ Documentation generation failed', 'error');
                console.error('AI Documentation error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiOptimizeCode() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ Code optimization failed', 'error');
                console.error('AI Optimization error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiExplainCode() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ Code explanation failed', 'error');
                console.error('AI Explanation error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiFindBugs() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ Bug analysis failed', 'error');
                console.error('AI Bug analysis error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiGenerateTests() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ Test generation failed', 'error');
                console.error('AI Test generation error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        // Advanced AI Content Utilities
        async aiGenerateHTML() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ HTML generation failed', 'error');
                console.error('AI HTML generation error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiOptimizeSEO() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ SEO optimization failed', 'error');
                console.error('AI SEO optimization error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        // Advanced AI Developer Tools
        async aiGenerateRegex() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ Regex generation failed', 'error');
                console.error('AI Regex generation error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiGenerateSQL() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ SQL generation failed', 'error');
                console.error('AI SQL generation error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiAnalyzeData() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ Data analysis failed', 'error');
                console.error('AI Data analysis error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        async aiGenerateEmail() {
            if (!this.checkAIAuthentication()) return;
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
            } catch (error) {
                this.showNotification('❌ Email generation failed', 'error');
                console.error('AI Email generation error:', error);
            } finally {
                this.aiProcessing = false;
            }
        },

        toggleAuthMenu() {
            // First close AI Utilities panel if it's open
            if (this.aiOpen) {
                this.aiOpen = false;
                // Small delay to allow the AI panel to close before opening auth menu
                setTimeout(() => {
                    this.authMenuOpen = !this.authMenuOpen;
                }, 200);
            } else {
                this.authMenuOpen = !this.authMenuOpen;
            }
        },

        // Helper method to check for popup blockers
        testPopupBlocked() {
            try {
                const popup = window.open('', '_blank', 'width=1,height=1');
                if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                    return true; // Popup blocked
                }
                // Close popup immediately to avoid leaving it open
                setTimeout(() => {
                    try {
                        if (popup && !popup.closed) {
                            popup.close();
                        }
                    } catch (e) {
                        // Ignore errors when closing popup
                    }
                }, 100);
                return false; // Popup not blocked
            } catch (e) {
                return true; // Popup blocked
            }
        },

        // Simplified sign in following official Puter.js pattern
        async signInToPuter() {
            try {
                // Check if we're using file:// protocol first
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
                
                // Add a small delay before attempting sign-in to ensure user interaction is complete
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Follow official pattern: simple signIn() call with user interaction
                try {
                    let user = await window.puterAI.signIn();
                    
                    if (user) {
                        // Update local state immediately
                        this.puterAuth.isAuthenticated = true;
                        this.puterAuth.userInfo = user;
                        this.puterAuth.fallbackMode = false;
                        
                        this.showNotification('✅ Successfully signed in to Hexa!', 'success');
                        
                        // Force Alpine.js to update
                        this.$nextTick(() => {
                            // UI will be updated
                        });
                        
                        // Only close the auth menu after successful authentication
                        // Add a small delay to ensure the user sees the success message
                        setTimeout(() => {
                            this.authMenuOpen = false;
                        }, 1500);
                    } else {
                        // Special handling for Brave browser - null user doesn't always mean failure
                        if (this.isBrave) {
                            console.log('🟠 Brave browser: No user returned, checking auth state...');
                            this.showNotification('⏳ Checking authentication status...', 'info');
                            
                            // Wait a moment and check if authentication actually succeeded
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
                                    } else {
                                        this.showNotification('⚠️ Authentication incomplete. Please try again.', 'warning');
                                    }
                                }
                            }, 2000);
                            return; // Exit early for Brave
                        } else {
                            throw new Error('Sign in failed - no user returned');
                        }
                    }
                } catch (error) {
                    // Handle specific error cases
                    const errorMessage = error?.message || error?.toString() || 'Unknown error';
                    const errorObj = error?.error || error;
                    
                    // Check for blocker-related issues - but ignore in localhost
                    const isLocalhost = window.EnvironmentDetector && window.EnvironmentDetector.isLocalhost;
                    const hasBlockers = isLocalhost ? false : window.BlockerDetector?.hasHighImpactBlockers?.();
                    const blockerInfo = hasBlockers ? window.BlockerDetector?.getDetectedBlockers?.()?.[0] : null;
                    
                    // Special handling for Brave browser errors
                    if (this.isBrave && (errorObj === 'auth_window_closed' || errorMessage.includes('auth_window_closed'))) {
                        console.log('🟠 Brave authentication window closed - attempting status check...');
                        
                        if (hasBlockers && blockerInfo) {
                            this.showNotification(`⚠️ ${blockerInfo.name} is blocking authentication popups. ${blockerInfo.suggestion}`, 'warning', { duration: 10000 });
                        } else {
                            this.showNotification('⏳ Brave detected. Checking authentication...', 'info');
                        }
                        
                        // In Brave, the window closing might still mean success
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
                                    } else {
                                        if (hasBlockers) {
                                            this.showNotification(`❌ ${blockerInfo.name} prevented authentication. Please check browser settings.`, 'error');
                                        } else {
                                            this.showNotification('❌ Authentication failed. Window was closed.', 'error');
                                        }
                                    }
                                }
                            } catch (checkError) {
                                console.error('Auth status check failed:', checkError);
                                this.showNotification('❌ Authentication check failed.', 'error');
                            }
                        }, 1500);
                        return; // Exit early for Brave
                    }
                    
                    // Standard error handling - simple and user-friendly
                    this.puterAuth.error = errorMessage;
                    this.puterAuth.isAuthenticated = false;
                    this.puterAuth.userInfo = null;
                    
                    // Simple, non-intrusive error messages
                    if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
                        this.showNotification('🚫 Popup was blocked. Try "Direct Sign In" option.', 'warning');
                    } else if (errorMessage.includes('cancelled')) {
                        this.showNotification('🔄 Authentication cancelled. Please try again.', 'info');
                    } else {
                        // Generic, simple error message - no blocker spam
                        this.showNotification('❌ Sign in failed. Please try again or use Direct Sign In.', 'error');
                        
                        // Only log technical details to console for debugging
                        if (hasBlockers && blockerInfo) {
                            console.warn(`🔍 Blocker detected (${blockerInfo.name}) - this might affect sign-in`);
                        }
                    }
                    
                    console.error('Sign in failed:', error);
                    // Keep auth menu open on error so user can try again
                }
                
            } catch (error) {
                const errorMessage = error?.message || error?.toString() || 'Unknown error';
                this.puterAuth.error = errorMessage;
                this.showNotification('❌ Sign in error: ' + errorMessage, 'error');
                console.error('Sign in error:', error);
                // Keep auth menu open on error so user can try again
            } finally {
                this.puterAuth.isLoading = false;
            }
        },

        async directSignInToPuter() {
            try {
                // Check if we're using file:// protocol first
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
                
                // Use direct sign in method (redirects to Puter.com)
                await window.puterAI.directSignIn();
                
            } catch (error) {
                this.puterAuth.error = error.message;
                this.showNotification('❌ Direct sign in failed. Please try again.', 'error');
                console.error('Direct sign in failed:', error);
            } finally {
                this.puterAuth.isLoading = false;
            }
        },

        async quickSignInToPuter() {
            try {
                // Check if we're in local environment first
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
                
                // Update auth state
                this.puterAuth.isAuthenticated = true;
                this.puterAuth.userInfo = await window.puterAI.getUser();
                
                this.showNotification('🚀 Quick sign in successful!', 'success');
                
                // Only close the auth menu after successful authentication
                // Add a small delay to ensure the user sees the success message
                setTimeout(() => {
                    this.authMenuOpen = false;
                }, 1500);
                
            } catch (error) {
                this.puterAuth.error = error.message;
                this.showNotification('❌ Quick sign in failed. Please try again.', 'error');
                console.error('Quick sign in failed:', error);
                // Keep auth menu open on error so user can try again
            } finally {
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
                
                // Update auth state
                this.puterAuth.isAuthenticated = false;
                this.puterAuth.userInfo = null;
                
                this.showNotification('👋 Successfully signed out', 'success');
                this.authMenuOpen = false;
                
            } catch (error) {
                this.puterAuth.error = error.message;
                this.showNotification('❌ Sign out failed: ' + error.message, 'error');
                console.error('Sign out failed:', error);
            } finally {
                this.puterAuth.isLoading = false;
            }
        },

    }
}

// Notification system is handled by main.js

// ===== OPTIMIZED SPOTLIGHT EFFECT =====
(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isBrave = !!(navigator.brave) || /Brave/i.test(navigator.userAgent || '');
  let glowEl = null;
  let lastTs = 0;
  // Limit to ~30fps to reduce paint work on Chromium
  const fpsInterval = 1000 / 30;
  let inactivityTimer = null;

  function ensureGlowEl() {
    if (!glowEl) glowEl = document.getElementById('glow-effect');
    return glowEl;
  }

  function setThemeClass() {
    const el = ensureGlowEl();
    if (!el) return;
    const dark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    el.classList.toggle('glow--dark', !!dark);
  }

  function onPointerMove(e) {
    const el = ensureGlowEl();
    if (!el) return;
    const now = performance.now();
    if (now - lastTs < fpsInterval) return;
    lastTs = now;

    el.style.setProperty('--mouse-x', e.clientX + 'px');
    el.style.setProperty('--mouse-y', e.clientY + 'px');
    el.style.opacity = '1';

    // Reiniciar temporizador de inactividad
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      const el2 = ensureGlowEl();
      if (el2) el2.style.opacity = '0.3';
    }, 3000);
  }

  function onEnter() {
    const el = ensureGlowEl();
    if (el) el.style.opacity = '1';
  }

  function onLeave() {
    const el = ensureGlowEl();
    if (el) el.style.opacity = '0';
  }

  function initGlow() {
    const el = ensureGlowEl();
    if (!el) return;

    // Brave-specific tweaks (reduce expensive composition)
    if (isBrave) {
      el.style.mixBlendMode = 'normal';
      el.style.opacity = '0.6';
    }

    setThemeClass();

    // Observar cambios de clase para modo oscuro
    const mo = new MutationObserver(setThemeClass);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Pointer events with passive to avoid blocking main thread
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mouseenter', onEnter, { passive: true });
    window.addEventListener('mouseleave', onLeave, { passive: true });
  }

  // Disable if user prefers reduced motion
  if (!prefersReduced) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initGlow, { once: true });
    } else {
      initGlow();
    }
  } else {
    const el = ensureGlowEl();
    if (el) el.style.display = 'none';
  }
})();

// ===== SYNTAX DETECTION =====
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
  } else {
    showNotification("📝 Plain text detected", "success");
  }
};
