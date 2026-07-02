(function () {
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
            this.config = {
                LARGE_TEXT_THRESHOLD: 10000,
                HUGE_TEXT_THRESHOLD: 50000,
                DEBOUNCE_DELAY: 150,
                THROTTLE_DELAY: 50,
                STATS_DEBOUNCE_DELAY: 300,
                CHUNK_SIZE: 1000,
                MAX_LINE_NUMBERS: 1000
            };
            this.init();
        }
        init() {
            this.setupTextareaOptimizations();
            this.setupPerformanceMonitoring();
        }
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
        optimizedUpdateStats(text, forceUpdate = false) {
            const textLength = text.length;
            const isLargeText = textLength > this.config.LARGE_TEXT_THRESHOLD;
            const isHugeText = textLength > this.config.HUGE_TEXT_THRESHOLD;
            if (isLargeText && !forceUpdate) {
                this.debounce(() => {
                    this.calculateStatsOptimized(text, isHugeText);
                }, this.config.STATS_DEBOUNCE_DELAY, 'updateStats');
                return;
            }
            this.calculateStatsOptimized(text, isHugeText);
        }
        calculateStatsOptimized(text, isHugeText = false) {
            const startTime = performance.now();
            const chars = text.length;
            if (isHugeText) {
                const stats = this.calculateHugeTextStats(text, chars);
                this.updatePerformanceMetrics(performance.now() - startTime);
                return stats;
            }
            const words = this.countWordsOptimized(text);
            const lines = this.countLines(text);
            const sentences = this.countSentencesOptimized(text);
            const paragraphs = this.countParagraphsOptimized(text);
            const readingTime = Math.ceil(words / 200);
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
        countWordsOptimized(text) {
            if (!text || text.trim() === '')
                return 0;
            const matches = text.trim().match(/\S+/g);
            return matches ? matches.length : 0;
        }
        countLines(text) {
            return text === '' ? 1 : text.split('\n').length;
        }
        countSentencesOptimized(text) {
            if (!text || text.trim() === '')
                return 0;
            const matches = text.match(/[.!?]+/g);
            return matches ? matches.length : 1;
        }
        countParagraphsOptimized(text) {
            if (!text || text.trim() === '')
                return 0;
            return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
        }
        calculateReadabilityOptimized(text, words, sentences) {
            if (sentences === 0 || words === 0)
                return 0;
            const syllables = this.countSyllablesOptimized(text, words);
            const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
            return Math.max(0, Math.min(100, Math.round(score)));
        }
        countSyllablesOptimized(text, words) {
            if (text.length > this.config.LARGE_TEXT_THRESHOLD) {
                return Math.round(words * 1.5);
            }
            return this.countSyllables(text);
        }
        countSyllables(text) {
            const words = text.toLowerCase().match(/\b[a-z]+\b/g);
            if (!words)
                return 0;
            let totalSyllables = 0;
            for (const word of words) {
                totalSyllables += this.syllablesInWord(word);
            }
            return totalSyllables;
        }
        syllablesInWord(word) {
            if (word.length <= 3)
                return 1;
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
            if (word.endsWith('e'))
                syllables--;
            if (syllables === 0)
                syllables = 1;
            return syllables;
        }
        calculateHugeTextStats(text, chars) {
            const sampleSize = 5000;
            const sample = text.substring(0, sampleSize);
            const ratio = chars / sampleSize;
            const sampleWords = this.countWordsOptimized(sample);
            const sampleSentences = this.countSentencesOptimized(sample);
            const sampleParagraphs = this.countParagraphsOptimized(sample);
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
                readabilityScore: 50
            };
        }
        setupTextareaOptimizations() {
            const textarea = document.getElementById('textInput');
            if (!textarea)
                return;
            let lastInputTime = 0;
            const originalInputHandler = textarea.oninput;
            textarea.oninput = (event) => {
                const currentTime = Date.now();
                this.performanceMetrics.inputEvents++;
                if (currentTime - lastInputTime < this.config.THROTTLE_DELAY) {
                    this.throttle(() => {
                        if (originalInputHandler)
                            originalInputHandler.call(textarea, event);
                    }, this.config.THROTTLE_DELAY, 'inputHandler');
                }
                else {
                    if (originalInputHandler)
                        originalInputHandler.call(textarea, event);
                }
                lastInputTime = currentTime;
            };
            this.setupVirtualLineNumbers();
        }
        setupVirtualLineNumbers() {
            const lineContainer = document.querySelector('.line-numbers-container');
            if (!lineContainer)
                return;
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
            if (!textarea || !lineContainer)
                return;
            const text = textarea.value;
            const totalLines = text.split('\n').length;
            if (totalLines > this.config.MAX_LINE_NUMBERS) {
                this.implementVirtualScrolling(lineContainer, totalLines);
            }
        }
        implementVirtualScrolling(container, totalLines) {
            const textarea = document.getElementById('textInput');
            if (!textarea)
                return;
            const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
            const visibleLines = Math.ceil(textarea.clientHeight / lineHeight);
            const scrollTop = textarea.scrollTop;
            const startLine = Math.floor(scrollTop / lineHeight);
            const endLine = Math.min(totalLines, startLine + visibleLines + 10);
            container.innerHTML = '';
            for (let i = startLine; i < endLine; i++) {
                const lineDiv = document.createElement('div');
                lineDiv.className = 'text-right pr-2';
                lineDiv.textContent = i + 1;
                lineDiv.style.transform = `translateY(${i * lineHeight}px)`;
                container.appendChild(lineDiv);
            }
        }
        setupPerformanceMonitoring() {
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
            if (this.performanceMetrics.statsCalculations > 0 && this.performanceMetrics.statsCalculations % 100 === 0) {
                console.log('📊 Performance Metrics:', {
                    inputEvents: this.performanceMetrics.inputEvents,
                    statsCalculations: this.performanceMetrics.statsCalculations,
                    avgCalculationTime: this.performanceMetrics.avgCalculationTime.toFixed(2) + 'ms'
                });
            }
        }
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
            setTimeout(() => {
                if (dialog.parentElement) {
                    dialog.remove();
                }
            }, 10000);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.PerformanceOptimizer = new PerformanceOptimizer();
        });
    }
    else {
        window.PerformanceOptimizer = new PerformanceOptimizer();
    }
})();
