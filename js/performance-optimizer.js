/*
  performance-optimizer.js
  - Debouncing y throttling de funciones costosas
  - Virtualización inteligente
  - Gestión eficiente de memoria
  - Optimización de cálculos estadísticos
*/

(function() {
    'use strict';

    class PerformanceOptimizer {
        constructor() {
            this.debounceTimers = new Map();
            this.throttleTimers = new Map();
            this.lastResults = new Map();
            this.performanceMetrics = {
                inputEvents: 0,
                statsCalculations: 0,
                avgCalculationTime: 0
            };
            
            // Configuración de umbrales
            this.config = {
                LARGE_TEXT_THRESHOLD: 10000,    // 10k caracteres
                HUGE_TEXT_THRESHOLD: 50000,     // 50k caracteres
                DEBOUNCE_DELAY: 150,            // ms para funciones costosas
                THROTTLE_DELAY: 50,             // ms para eventos de input
                STATS_DEBOUNCE_DELAY: 300,      // ms para estadísticas
                CHUNK_SIZE: 1000,               // tamaño de chunk para procesamiento
                MAX_LINE_NUMBERS: 1000          // máximo números de línea visibles
            };
            
            this.init();
        }

        init() {
            this.setupTextareaOptimizations();
            this.setupPerformanceMonitoring();
        }

        // ===== DEBOUNCING Y THROTTLING =====
        
        debounce(func, delay, key) {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            const timeoutId = setTimeout(() => {
                func();
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timeoutId);
        }

        throttle(func, delay, key) {
            if (this.throttleTimers.has(key)) {
                return;
            }
            
            func();
            const timeoutId = setTimeout(() => {
                this.throttleTimers.delete(key);
            }, delay);
            
            this.throttleTimers.set(key, timeoutId);
        }

        // ===== OPTIMIZACIÓN DE ESTADÍSTICAS =====
        
        optimizedUpdateStats(text, forceUpdate = false) {
            const textLength = text.length;
            const isLargeText = textLength > this.config.LARGE_TEXT_THRESHOLD;
            const isHugeText = textLength > this.config.HUGE_TEXT_THRESHOLD;
            
            // Para textos grandes, usar debouncing
            if (isLargeText && !forceUpdate) {
                this.debounce(() => {
                    this.calculateStatsOptimized(text, isHugeText);
                }, this.config.STATS_DEBOUNCE_DELAY, 'updateStats');
                return;
            }
            
            // Para textos normales, calcular inmediatamente
            this.calculateStatsOptimized(text, isHugeText);
        }

        calculateStatsOptimized(text, isHugeText = false) {
            const startTime = performance.now();
            
            // Cálculos básicos optimizados
            const chars = text.length;
            
            // Para textos enormes, usar aproximaciones más rápidas
            if (isHugeText) {
                const stats = this.calculateHugeTextStats(text, chars);
                this.updatePerformanceMetrics(performance.now() - startTime);
                return stats;
            }
            
            // Cálculos normales pero optimizados
            const words = this.countWordsOptimized(text);
            const lines = this.countLines(text);
            const sentences = this.countSentencesOptimized(text);
            const paragraphs = this.countParagraphsOptimized(text);
            const readingTime = Math.ceil(words / 200);
            
            // Métricas derivadas
            const avgWordsPerSentence = sentences > 0 ? parseFloat((words / sentences).toFixed(1)) : 0;
            const avgCharsPerWord = words > 0 ? parseFloat((chars / words).toFixed(1)) : 0;
            const readabilityScore = this.calculateReadabilityOptimized(text, words, sentences);
            
            const stats = {
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
            
            this.updatePerformanceMetrics(performance.now() - startTime);
            return stats;
        }

        // ===== CÁLCULOS OPTIMIZADOS =====
        
        countWordsOptimized(text) {
            if (!text || text.trim() === '') return 0;
            
            // Usar expresión regular optimizada
            const matches = text.trim().match(/\S+/g);
            return matches ? matches.length : 0;
        }

        countLines(text) {
            return text === '' ? 1 : text.split('\n').length;
        }

        countSentencesOptimized(text) {
            if (!text || text.trim() === '') return 0;
            
            // Expresión regular optimizada para oraciones
            const matches = text.match(/[.!?]+/g);
            return matches ? matches.length : 1;
        }

        countParagraphsOptimized(text) {
            if (!text || text.trim() === '') return 0;
            
            // Split por párrafos y filtrar vacíos de forma eficiente
            return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
        }

        calculateReadabilityOptimized(text, words, sentences) {
            if (sentences === 0 || words === 0) return 0;
            
            // Simplificar el cálculo de sílabas para textos largos
            const syllables = this.countSyllablesOptimized(text, words);
            const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
            return Math.max(0, Math.min(100, Math.round(score)));
        }

        countSyllablesOptimized(text, words) {
            // Para textos largos, usar estimación rápida
            if (text.length > this.config.LARGE_TEXT_THRESHOLD) {
                return Math.round(words * 1.5); // Estimación promedio
            }
            
            // Cálculo más preciso para textos pequeños
            return this.countSyllables(text);
        }

        countSyllables(text) {
            const words = text.toLowerCase().match(/\b[a-z]+\b/g);
            if (!words) return 0;
            
            let totalSyllables = 0;
            for (const word of words) {
                totalSyllables += this.syllablesInWord(word);
            }
            return totalSyllables;
        }

        syllablesInWord(word) {
            if (word.length <= 3) return 1;
            
            const vowels = 'aeiouy';
            let syllables = 0;
            let lastWasVowel = false;
            
            for (let i = 0; i < word.length; i++) {
                const isVowel = vowels.includes(word[i]);
                if (isVowel && !lastWasVowel) {
                    syllables++;
                }
                lastWasVowel = isVowel;
            }
            
            // Ajustes para reglas del inglés
            if (word.endsWith('e')) syllables--;
            if (syllables === 0) syllables = 1;
            
            return syllables;
        }

        // ===== STATS PARA TEXTOS ENORMES =====
        
        calculateHugeTextStats(text, chars) {
            // Para textos enormes (>50k), usar sampling y estimaciones
            const sampleSize = 5000;
            const sample = text.substring(0, sampleSize);
            const ratio = chars / sampleSize;
            
            // Calcular stats en el sample
            const sampleWords = this.countWordsOptimized(sample);
            const sampleSentences = this.countSentencesOptimized(sample);
            const sampleParagraphs = this.countParagraphsOptimized(sample);
            
            // Extrapolar al texto completo
            const words = Math.round(sampleWords * ratio);
            const sentences = Math.round(sampleSentences * ratio);
            const paragraphs = Math.round(sampleParagraphs * ratio);
            const lines = this.countLines(text);
            const readingTime = Math.ceil(words / 200);
            
            return {
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
        }

        // ===== OPTIMIZACIÓN DEL TEXTAREA =====
        
        setupTextareaOptimizations() {
            const textarea = document.getElementById('textInput');
            if (!textarea) return;
            
            // Optimizar eventos de input
            let lastInputTime = 0;
            const originalInputHandler = textarea.oninput;
            
            textarea.oninput = (event) => {
                const currentTime = Date.now();
                this.performanceMetrics.inputEvents++;
                
                // Throttling para eventos muy frecuentes
                if (currentTime - lastInputTime < this.config.THROTTLE_DELAY) {
                    this.throttle(() => {
                        if (originalInputHandler) originalInputHandler.call(textarea, event);
                    }, this.config.THROTTLE_DELAY, 'inputHandler');
                } else {
                    if (originalInputHandler) originalInputHandler.call(textarea, event);
                }
                
                lastInputTime = currentTime;
            };
            
            // Optimizar scroll para números de línea
            this.setupVirtualLineNumbers();
        }

        setupVirtualLineNumbers() {
            const lineContainer = document.querySelector('.line-numbers-container');
            if (!lineContainer) return;
            
            // Observer para cambios en el texto
            const observer = new MutationObserver(() => {
                this.updateVirtualLineNumbers();
            });
            
            observer.observe(lineContainer, {
                childList: true,
                subtree: true
            });
        }

        updateVirtualLineNumbers() {
            const textarea = document.getElementById('textInput');
            const lineContainer = document.querySelector('.line-numbers-container');
            
            if (!textarea || !lineContainer) return;
            
            const text = textarea.value;
            const totalLines = text.split('\n').length;
            
            // Para textos con muchas líneas, mostrar solo las visibles
            if (totalLines > this.config.MAX_LINE_NUMBERS) {
                this.implementVirtualScrolling(lineContainer, totalLines);
            }
        }

        implementVirtualScrolling(container, totalLines) {
            const textarea = document.getElementById('textInput');
            if (!textarea) return;
            
            // Calcular líneas visibles basado en la posición del scroll
            const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
            const visibleLines = Math.ceil(textarea.clientHeight / lineHeight);
            const scrollTop = textarea.scrollTop;
            const startLine = Math.floor(scrollTop / lineHeight);
            const endLine = Math.min(totalLines, startLine + visibleLines + 10); // Buffer
            
            // Actualizar solo los números de línea visibles
            container.innerHTML = '';
            for (let i = startLine; i < endLine; i++) {
                const lineDiv = document.createElement('div');
                lineDiv.className = 'text-right pr-2';
                lineDiv.textContent = i + 1;
                lineDiv.style.transform = `translateY(${i * lineHeight}px)`;
                container.appendChild(lineDiv);
            }
        }

        // ===== MONITOREO DE RENDIMIENTO =====
        
        setupPerformanceMonitoring() {
            // Monitorear métricas cada 5 segundos
            setInterval(() => {
                this.logPerformanceMetrics();
            }, 5000);
        }

        updatePerformanceMetrics(calculationTime) {
            this.performanceMetrics.statsCalculations++;
            const totalTime = this.performanceMetrics.avgCalculationTime * (this.performanceMetrics.statsCalculations - 1);
            this.performanceMetrics.avgCalculationTime = (totalTime + calculationTime) / this.performanceMetrics.statsCalculations;
        }

        logPerformanceMetrics() {
            if (this.performanceMetrics.statsCalculations > 0) {
                console.log('📊 Performance Metrics:', {
                    inputEvents: this.performanceMetrics.inputEvents,
                    statsCalculations: this.performanceMetrics.statsCalculations,
                    avgCalculationTime: this.performanceMetrics.avgCalculationTime.toFixed(2) + 'ms'
                });
            }
        }

        // ===== API PÚBLICA =====
        
        getOptimizedStats(text, forceUpdate = false) {
            return this.optimizedUpdateStats(text, forceUpdate);
        }

        clearCaches() {
            this.debounceTimers.clear();
            this.throttleTimers.clear();
            this.lastResults.clear();
        }

        getPerformanceMetrics() {
            return { ...this.performanceMetrics };
        }

        // ===== UTILIDADES DE DEPURACIÓN =====
        
        showPerformanceDialog() {
            const metrics = this.getPerformanceMetrics();
            const textarea = document.getElementById('textInput');
            const textLength = textarea ? textarea.value.length : 0;
            
            const dialog = document.createElement('div');
            dialog.className = 'fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg text-sm z-[9999] max-w-sm';
            dialog.innerHTML = `
                <div class="font-bold mb-2">🚀 Performance Metrics</div>
                <div>Text Length: ${textLength.toLocaleString()} chars</div>
                <div>Input Events: ${metrics.inputEvents}</div>
                <div>Stats Calculations: ${metrics.statsCalculations}</div>
                <div>Avg Calculation Time: ${metrics.avgCalculationTime.toFixed(2)}ms</div>
                <div class="mt-2 text-xs opacity-70">
                    ${textLength > 50000 ? '🔴 Huge text mode' : 
                      textLength > 10000 ? '🟡 Large text mode' : 
                      '🟢 Normal mode'}
                </div>
                <button class="mt-2 px-2 py-1 bg-red-500 rounded text-xs" onclick="this.parentElement.remove()">Close</button>
            `;
            
            document.body.appendChild(dialog);
            
            // Auto-remove después de 10 segundos
            setTimeout(() => {
                if (dialog.parentElement) {
                    dialog.remove();
                }
            }, 10000);
        }
    }

    // Inicializar el optimizador cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.PerformanceOptimizer = new PerformanceOptimizer();
        });
    } else {
        window.PerformanceOptimizer = new PerformanceOptimizer();
    }

})();