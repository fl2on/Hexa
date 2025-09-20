// Aplicación Hexa - Componente principal de Alpine.js
function hexaApp() {
    return {
        // Variables de estado
        darkMode: localStorage.getItem('darkMode') !== 'false',
        title: 'Hexa',
        showNotification: false,
        notificationMessage: '',
        notificationType: 'success',
        stats: {
            chars: 0,
            words: 0,
            lines: 0,
            readingTime: 0,
            sentences: 0,
            paragraphs: 0,
            avgWordsPerSentence: 0,
            avgCharsPerWord: 0,
            readabilityScore: 0
        },
        isOpen: false,
        shareURL: '',
        text: localStorage.getItem('text') || '',
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

        // Métodos
        updateStats() {
            const text = this.text || '';
            const chars = text.length;
            const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(word => word.length > 0).length;
            const lines = text === '' ? 0 : text.split('\n').length;
            const sentences = text === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
            const paragraphs = text === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
            const readingTime = Math.ceil(words / 200);
            
            // Métricas
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

        calculateReadability(text, words, sentences) {
            if (sentences === 0 || words === 0) return 0;
            
            const syllables = this.countSyllables(text);
            // Puntuación de facilidad de lectura Flesch
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
                    case 'sortlines':
                        result = this.text.split('\n').sort().join('\n');
                        break;
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
                    default:
                        this.showNotification('❌ Unknown format', 'error');
                        return;
                }
                
                this.text = result;
                localStorage.setItem('text', this.text);
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

        handleKeyDown(event) {
            const textarea = event.target;
            const cursorPos = textarea.selectionStart;
            const textBefore = this.text.substring(0, cursorPos);
            const textAfter = this.text.substring(cursorPos);
            
            // Tab para auto-completado
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
                    // Insertar 2 espacios para indentación
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
                localStorage.setItem('text', this.text);
                this.showNotification('↶ Undone', 'success');
            }
        },

        redo() {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.text = this.history[this.historyIndex];
                this.updateStats();
                localStorage.setItem('text', this.text);
                this.showNotification('↷ Redone', 'success');
            }
        },

        toggleFocusMode() {
            this.focusMode = !this.focusMode;
            
            if (this.focusMode) {
                // Activar pantalla completa
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) {
                    document.documentElement.msRequestFullscreen();
                }
                this.showNotification('🎯 Focus mode ENABLED - Press F11 or Escape to exit', 'success');
            } else {
                // Salir de pantalla completa
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                this.showNotification('🎯 Focus mode DISABLED', 'success');
            }
        },

        startWritingTimer() {
            if (!this.writingTimer) {
                this.writingTimer = setInterval(() => {
                    this.writingTime++;
                }, 1000);
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
                localStorage.setItem('text', this.text);
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

        generateShareURL() {
            if (!this.text.trim()) {
                this.showNotification('❌ No text to share', 'error');
                return;
            }
            
            try {
                const url = new URL(window.location.href);
                
                // Intentar compresión primero para textos más largos
                let textToShare = this.text;
                let isCompressed = false;
                
                // Si el texto es largo, usar compresión
                if (this.text.length > 1000) {
                    try {
                        const compressed = LZString.compressToEncodedURIComponent(this.text);
                        // Solo usar compresión si realmente reduce el tamaño
                        if (compressed.length < this.text.length * 0.8) {
                            textToShare = compressed;
                            isCompressed = true;
                            url.searchParams.set('c', '1'); // Flag para indicar que está comprimido
                        }
                    } catch (error) {
                        console.warn('Compression failed, using original text:', error);
                    }
                }
                
                // Limpiar parámetros previos
                url.searchParams.delete('text');
                url.searchParams.delete('t');
                url.searchParams.delete('c');
                url.searchParams.delete('title');
                
                // Usar parámetro más corto para ahorrar espacio
                url.searchParams.set(isCompressed ? 't' : 'text', textToShare);
                
                if (isCompressed) {
                    url.searchParams.set('c', '1');
                }
                
                // Solo agregar título si es diferente del default
                if (this.title && this.title !== 'Hexa') {
                    url.searchParams.set('title', this.title);
                }
                
                this.shareURL = url.toString();
                this.isOpen = true;
                
                // Mostrar estadísticas de compresión
                if (isCompressed) {
                    const compressionRatio = ((1 - textToShare.length / this.text.length) * 100).toFixed(1);
                    this.showNotification(`🔗 Share URL generated! (${compressionRatio}% compressed)`, 'success');
                } else {
                    this.showNotification('🔗 Share URL generated!', 'success');
                }
                
                // Advertir si la URL es muy larga
                if (this.shareURL.length > 2000) {
                    setTimeout(() => {
                        this.showNotification('⚠️ URL is very long - some browsers may have issues', 'warning');
                    }, 1500);
                }
                
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

        // Obtener estadísticas del enlace compartido
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
                
                // Advertencias sobre límites de URL
                if (this.shareURL.length > 2048) {
                    stats += `⚠️ WARNING: URL exceeds 2048 chars (IE limit)\n`;
                }
                if (this.shareURL.length > 8192) {
                    stats += `🚨 CRITICAL: URL exceeds 8192 chars (server limits)\n`;
                }
                
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
                localStorage.setItem('text', this.text);
            };
            reader.readAsText(file);
        },

        showNotification(message, type = 'success') {
            if (window.showNotification && typeof window.showNotification === 'function') {
                window.showNotification(message, type);
            } else {
                console.warn('Global showNotification function not available');
                alert(message);
            }
        },

        // Ejecución de Python
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

        // Análisis de compresión
        analyzeCompression() {
            if (!this.text.trim()) {
                this.showNotification('❌ No text to analyze', 'error');
                return;
            }
            
            try {
                const originalSize = this.text.length;
                const compressed = LZString.compressToEncodedURIComponent(this.text);
                const compressedSize = compressed.length;
                const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
                
                let message = `📊 Compression Analysis:\n`;
                message += `Original: ${originalSize} chars\n`;
                message += `Compressed: ${compressedSize} chars\n`;
                message += `Ratio: ${ratio}% reduction\n`;
                
                if (ratio > 30) {
                    message += `✅ Great compression ratio!`;
                } else if (ratio > 10) {
                    message += `👍 Good compression ratio`;
                } else if (ratio > 0) {
                    message += `📈 Small compression gain`;
                } else {
                    message += `⚠️ Text doesn't compress well`;
                }
                
                this.showNotification(message, 'info');
                
                // También loguear en consola para debugging
                console.log('Compression Analysis:', {
                    originalSize,
                    compressedSize,
                    ratio: ratio + '%',
                    compressionEffective: ratio > 10
                });
                
            } catch (error) {
                console.error('Compression analysis failed:', error);
                this.showNotification('❌ Compression analysis failed', 'error');
            }
        },

        // Minificación de código
        minifyCode(type) {
            if (!this.text.trim()) {
                this.showNotification('❌ No code to minify', 'error');
                return;
            }
            
            this.saveToHistory();
            
            try {
                let result = this.text;
                
                switch(type) {
                    case 'js':
                        // Minificación simple de JS
                        result = this.text
                            .replace(/\/\*[\s\S]*?\*\//g, '') // Eliminar comentarios de bloque
                            .replace(/\/\/.*$/gm, '') // Eliminar comentarios de línea
                            .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
                            .replace(/;\s*}/g, '}') // Eliminar punto y coma antes de llave de cierre
                            .replace(/\s*{\s*/g, '{') // Limpiar llaves
                            .replace(/\s*;\s*/g, ';') // Limpiar puntos y comas
                            .trim();
                        break;
                    case 'css':
                        // Minificación simple de CSS
                        result = this.text
                            .replace(/\/\*[\s\S]*?\*\//g, '') // Eliminar comentarios
                            .replace(/\s+/g, ' ') // Reemplazar múltiples espacios
                            .replace(/;\s*}/g, '}') // Eliminar punto y coma antes de llave de cierre
                            .replace(/\s*{\s*/g, '{') // Eliminar espacios alrededor de llave de apertura
                            .replace(/;\s*/g, ';') // Eliminar espacios después de punto y coma
                            .replace(/:\s*/g, ':') // Eliminar espacios después de dos puntos
                            .trim();
                        break;
                    case 'html':
                        // Minificación simple de HTML
                        result = this.text
                            .replace(/<!--[\s\S]*?-->/g, '') // Eliminar comentarios
                            .replace(/\s+/g, ' ') // Reemplazar múltiples espacios
                            .replace(/>\s+</g, '><') // Eliminar espacios entre etiquetas
                            .replace(/\s+>/g, '>') // Eliminar espacios antes de etiqueta de cierre
                            .trim();
                        break;
                    default:
                        this.showNotification('❌ Unknown minification type', 'error');
                        return;
                }
                
                this.text = result;
                localStorage.setItem('text', this.text);
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
                
                // Detectar el tipo de código
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
                        // Beautificación genérica para otros tipos de código
                        beautified = this.beautifyGeneric(text);
                }

                this.text = beautified;
                localStorage.setItem('text', this.text);
                this.updateStats();
                this.showNotification('✨ Code beautified!', 'success');
            } catch (error) {
                this.showNotification('❌ Embellecimiento fallido', 'error');
                console.error('Beautify error:', error);
            }
        },

        detectCodeType(text) {
            // Detectar JSON
            if ((text.startsWith('{') && text.endsWith('}')) || 
                (text.startsWith('[') && text.endsWith(']'))) {
                try {
                    JSON.parse(text);
                    return 'json';
                } catch (e) {
                    // No es JSON válido, continuar con otras detecciones
                }
            }
            
            // Detectar HTML
            if (text.includes('<!DOCTYPE') || text.includes('<html') || 
                /<\/?[a-z][\s\S]*>/i.test(text)) {
                return 'html';
            }
            
            // Detectar XML
            if (text.startsWith('<?xml') || /<\?xml.*\?>/i.test(text)) {
                return 'xml';
            }
            
            // Detectar CSS
            if (text.includes('{') && text.includes('}') && 
                (text.includes(':') && text.includes(';')) ||
                /@[a-z-]+/.test(text)) {
                return 'css';
            }
            
            // Detectar JavaScript
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
            
            // Limpiar espacios en blanco
            formatted = formatted.replace(/>\s+</g, '><');
            
            // Agregar saltos de línea antes de las etiquetas
            formatted = formatted.replace(/</g, '\n<');
            
            const lines = formatted.split('\n');
            const result = [];
            
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;
                
                // Etiquetas de cierre
                if (line.startsWith('</')) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }
                
                result.push(indent.repeat(indentLevel) + line);
                
                // Etiquetas de apertura (no auto-cerradas)
                if (line.startsWith('<') && !line.startsWith('</') && 
                    !line.endsWith('/>') && !line.includes('<!')) {
                    indentLevel++;
                }
            });
            
            return result.join('\n');
        },

        beautifyCSS(text) {
            let formatted = text;
            
            // Agregar espacios después de dos puntos
            formatted = formatted.replace(/:\s*/g, ': ');
            
            // Agregar saltos de línea después de punto y coma
            formatted = formatted.replace(/;\s*/g, ';\n    ');
            
            // Agregar saltos de línea antes y después de llaves
            formatted = formatted.replace(/\{\s*/g, ' {\n    ');
            formatted = formatted.replace(/\s*\}/g, '\n}');
            
            // Agregar saltos de línea después de las llaves de cierre
            formatted = formatted.replace(/\}/g, '}\n\n');
            
            // Limpiar múltiples saltos de línea
            formatted = formatted.replace(/\n{3,}/g, '\n\n');
            
            return formatted.trim();
        },

        beautifyJavaScript(text) {
            let formatted = text;
            let indentLevel = 0;
            const indent = '    ';
            
            // Agregar espacios alrededor de operadores
            formatted = formatted.replace(/([=+\-*/<>!&|])\s*/g, ' $1 ');
            formatted = formatted.replace(/\s+([=+\-*/<>!&|])\s+/g, ' $1 ');
            
            // Agregar espacios después de comas
            formatted = formatted.replace(/,\s*/g, ', ');
            
            // Agregar saltos de línea después de punto y coma
            formatted = formatted.replace(/;\s*/g, ';\n');
            
            // Agregar saltos de línea antes y después de llaves
            formatted = formatted.replace(/\{\s*/g, ' {\n');
            formatted = formatted.replace(/\s*\}/g, '\n}');
            
            const lines = formatted.split('\n');
            const result = [];
            
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;
                
                // Disminuir indentación para llaves de cierre
                if (line.startsWith('}')) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }
                
                result.push(indent.repeat(indentLevel) + line);
                
                // Aumentar indentación para llaves de apertura
                if (line.endsWith('{')) {
                    indentLevel++;
                }
            });
            
            return result.join('\n');
        },

        beautifyXML(text) {
            return this.beautifyHTML(text); // XML usa la misma lógica que HTML
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

                // Disminuir indentación para caracteres de cierre
                if (/^[}\])]/.test(line)) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }

                formattedLines.push(indent.repeat(indentLevel) + line);

                // Aumentar indentación para caracteres de apertura
                if (/[{\[(]\s*$/.test(line)) {
                    indentLevel++;
                }
            });

            return formattedLines.join('\n');
        },

        // Generadores de código
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
                    case 'mockdata':
                        generated = JSON.stringify(CrazyFeatures.generateMockData('user'), null, 2);
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

        // Funciones de utilidades
        processUtils(type, action) {
            if (!this.text.trim()) {
                this.showNotification('❌ No text to process', 'error');
                return;
            }
            
            this.saveToHistory();
            let result = this.text;
            
            try {
                switch(type) {
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
                localStorage.setItem('text', this.text);
                this.updateStats();
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
                localStorage.setItem('text', this.text);
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
        },

        togglePanel(panel) {
            switch(panel) {
                case 'format':
                    this.closeOtherPanels('format');
                    this.formatOpen = !this.formatOpen;
                    break;
                case 'utils':
                    this.closeOtherPanels('utils');
                    this.utilsOpen = !this.utilsOpen;
                    break;
                case 'dev':
                    this.closeOtherPanels('dev');
                    this.devToolsOpen = !this.devToolsOpen;
                    break;
                case 'search':
                    this.closeOtherPanels('search');
                    this.searchOpen = !this.searchOpen;
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
            const formattedText = window.TextFormatter.formatText(selectedText, format);
            
            this.text = this.text.substring(0, start) + formattedText + this.text.substring(end);
            localStorage.setItem('text', this.text);
            this.updateStats();
            
            // Restore selection
            this.$nextTick(() => {
                textarea.selectionStart = start;
                textarea.selectionEnd = start + formattedText.length;
                textarea.focus();
            });
            
            this.showNotification(`✨ Selected text formatted: ${format}`, 'success');
        },

        init() {
            this.saveToHistory();
            
            this.updateWritingStats();
            
            // Listener para detectar salida de pantalla completa
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
                if (this.text !== localStorage.getItem('text')) {
                    localStorage.setItem('text', this.text);
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
                            localStorage.setItem('text', this.text);
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
            });

            const params = new URLSearchParams(window.location.search);
            const textParam = params.get('text');
            const compressedParam = params.get('t'); // Parámetro comprimido
            const isCompressed = params.get('c') === '1';
            const titleParam = params.get('title');

            // Procesar texto desde URL
            if (textParam || compressedParam) {
                let finalText = '';
                
                try {
                    if (compressedParam && isCompressed) {
                        // Descomprimir texto
                        finalText = LZString.decompressFromEncodedURIComponent(compressedParam);
                        if (!finalText) {
                            throw new Error('Decompression failed');
                        }
                        console.log('Successfully decompressed text from URL');
                    } else if (textParam) {
                        // Texto sin comprimir (método tradicional)
                        finalText = textParam;
                    } else if (compressedParam) {
                        // Fallback: intentar descomprimir sin flag
                        try {
                            finalText = LZString.decompressFromEncodedURIComponent(compressedParam);
                            if (!finalText) {
                                finalText = compressedParam; // Usar como texto plano si falla
                            }
                        } catch (e) {
                            finalText = compressedParam;
                        }
                    }
                    
                    if (finalText) {
                        this.text = finalText;
                        localStorage.setItem('text', finalText);
                        
                        // Mostrar notificación de carga exitosa
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
                    // Fallback: intentar usar el parámetro como texto plano
                    const fallbackText = compressedParam || textParam;
                    if (fallbackText) {
                        this.text = fallbackText;
                        localStorage.setItem('text', fallbackText);
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
        },

        codeFeature(action) {
            if (!this.text.trim()) {
                this.showNotification('❌ Add text to use smart functions', 'warning');
                return;
            }

            this.saveToHistory();
            
            try {
                let result = '';
                switch(action) {
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
                        
                    case 'explainCode':
                        result = AIAssistant.explainCode(this.text);
                        break;
                        
                    default:
                        this.showNotification('❌ Function not recognized', 'error');
                        return;
                }
                
                this.text = result;
                this.updateStats();
                this.showNotification(`🧠 ${action} ejecutado exitosamente!`, 'success');
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
        }
    }
}