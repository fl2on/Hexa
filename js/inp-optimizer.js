(function () {
    'use strict';
    const INPOptimizer = {
        metrics: {
            interactions: 0,
            avgInputDelay: 0,
            avgProcessingTime: 0,
            avgPresentationDelay: 0,
            slowInteractions: 0
        },
        devToolsOpen: false,
        threshold: 1000,
        init() {
            this.optimizeHighFrequencyElements();
            this.setupPerformanceObserver();
            this.optimizeScrolling();
            this.setupIntersectionObserver();
            this.debounceExpensiveOperations();
        },
        optimizeHighFrequencyElements() {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                this.prepareElementForInteraction(button);
                this.optimizeButtonInteraction(button);
            });
            const textInput = document.getElementById('textInput');
            if (textInput) {
                this.optimizeTextInput(textInput);
            }
            const panels = document.querySelectorAll('[x-show], .panel, .dropdown-menu');
            panels.forEach(panel => {
                this.prepareElementForInteraction(panel);
            });
        },
        prepareElementForInteraction(element) {
            element.style.transform = 'translateZ(0)';
            element.style.willChange = 'transform, opacity';
            element.style.contain = 'layout paint';
            element.classList.add('performance-optimized');
        },
        optimizeButtonInteraction(button) {
            const spans = button.querySelectorAll('span.relative.z-10');
            spans.forEach(span => {
                span.style.transform = 'translate3d(0, 0, 0)';
                span.style.backfaceVisibility = 'hidden';
                span.style.contain = 'layout paint';
            });
            button.addEventListener('mouseenter', () => {
                button.style.willChange = 'transform, background-color';
            }, { passive: true });
            button.addEventListener('mouseleave', () => {
                button.style.willChange = 'auto';
            }, { passive: true });
        },
        optimizeTextInput(textInput) {
            textInput.style.transform = 'translateZ(0)';
            textInput.style.contain = 'layout paint';
            textInput.style.willChange = 'contents';
            let inputTimeout;
            const originalInputHandler = textInput.oninput;
            textInput.oninput = (event) => {
                clearTimeout(inputTimeout);
                inputTimeout = setTimeout(() => {
                    if (originalInputHandler) {
                        originalInputHandler.call(textInput, event);
                    }
                }, 16);
            };
        },
        setupPerformanceObserver() {
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        entries.forEach(entry => {
                            if (entry.entryType === 'event') {
                                this.trackINPMetric(entry);
                            }
                        });
                    });
                    observer.observe({
                        entryTypes: ['event']
                    });
                }
                catch (error) {
                    console.warn('INP Observer setup failed:', error.message);
                }
            }
        },
        trackINPMetric(entry) {
            this.metrics.interactions++;
            const inputDelay = entry.processingStart - entry.startTime;
            const processingTime = entry.processingEnd - entry.processingStart;
            const presentationDelay = entry.startTime + entry.duration - entry.processingEnd;
            this.metrics.avgInputDelay = this.updateAverage(this.metrics.avgInputDelay, inputDelay, this.metrics.interactions);
            this.metrics.avgProcessingTime = this.updateAverage(this.metrics.avgProcessingTime, processingTime, this.metrics.interactions);
            this.metrics.avgPresentationDelay = this.updateAverage(this.metrics.avgPresentationDelay, presentationDelay, this.metrics.interactions);
            const isSmallWindow = window.innerWidth < 1200 || window.innerHeight < 900;
            const shouldSuppress = this.devToolsOpen || isSmallWindow;
            if (this.metrics.avgPresentationDelay > 1000 && !shouldSuppress) {
                this.applyAggressiveOptimizations();
            }
        },
        applyAggressiveOptimizations() {
            console.log('🚀 INP optimizations would apply here (DISABLED for debugging)');
            console.log('⚠️ INP optimizations are temporarily disabled to prevent blue background issues');
            return;
        },
        optimizeScrolling() {
            const scrollableElements = document.querySelectorAll('.overflow-y-auto, .overflow-x-auto');
            scrollableElements.forEach(element => {
                element.addEventListener('scroll', () => {
                    requestAnimationFrame(() => {
                    });
                }, { passive: true });
            });
        },
        setupIntersectionObserver() {
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.prepareElementForInteraction(entry.target);
                        }
                        else {
                            entry.target.style.willChange = 'auto';
                        }
                    });
                }, {
                    rootMargin: '50px'
                });
                document.querySelectorAll('button, input, textarea, [x-show]').forEach(el => {
                    observer.observe(el);
                });
            }
        },
        debounceExpensiveOperations() {
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.optimizeHighFrequencyElements();
                }, 250);
            }, { passive: true });
        },
        updateAverage(currentAvg, newValue, count) {
            return (currentAvg * (count - 1) + newValue) / count;
        },
        detectDevTools() {
            const checkDevTools = () => {
                const heightDiff = window.outerHeight - window.innerHeight;
                const widthDiff = window.outerWidth - window.innerWidth;
                const isDesktopSize = window.innerWidth > 1200 && window.innerHeight > 800;
                const isLikelyDevTools = isDesktopSize && ((heightDiff > 400 && window.innerWidth > 1000) ||
                    (widthDiff > 500 && window.innerHeight > 700));
                const viewportRatio = (window.innerWidth * window.innerHeight) / (window.outerWidth * window.outerHeight);
                const hasDevToolsRatio = isDesktopSize && viewportRatio < 0.5 && window.outerWidth > 1400;
                const devToolsCurrentlyOpen = isLikelyDevTools || hasDevToolsRatio;
                if (devToolsCurrentlyOpen && !this.devToolsOpen) {
                    this.devToolsOpen = true;
                    console.log('🔧 DevTools detected - suppressing INP optimizations', {
                        heightDiff,
                        widthDiff,
                        innerSize: `${window.innerWidth}x${window.innerHeight}`,
                        outerSize: `${window.outerWidth}x${window.outerHeight}`,
                        ratio: viewportRatio.toFixed(2)
                    });
                }
                else if (!devToolsCurrentlyOpen && this.devToolsOpen) {
                    this.devToolsOpen = false;
                    console.log('🔧 DevTools closed - re-enabling INP monitoring');
                }
            };
            window.addEventListener('resize', checkDevTools);
            setInterval(checkDevTools, 3000);
            checkDevTools();
        },
        init() {
            this.detectDevTools();
            this.optimizeHighFrequencyElements();
            this.optimizeScrolling();
            this.startMonitoring();
        },
        getMetrics() {
            return { ...this.metrics };
        },
        startMonitoring() {
            document.addEventListener('click', (event) => {
                this.measureInteraction(event, 'click');
            });
            document.addEventListener('input', (event) => {
                this.measureInteraction(event, 'input');
            });
            document.addEventListener('keydown', (event) => {
                this.measureInteraction(event, 'keydown');
            });
            console.log('🎯 INP monitoring started');
        },
        measureInteraction(event, type) {
            const startTime = performance.now();
            if (window.requestIdleCallback) {
                requestIdleCallback(() => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    if (duration > this.threshold) {
                        this.metrics.slowInteractions++;
                        console.log(`🐌 Slow ${type} interaction: ${duration.toFixed(2)}ms`);
                        this.applySafeOptimizations();
                    }
                });
            }
            else {
                setTimeout(() => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    if (duration > this.threshold) {
                        this.metrics.slowInteractions++;
                        this.applySafeOptimizations();
                    }
                }, 0);
            }
        },
        applySafeOptimizations() {
            const isSmallWindow = window.innerWidth < 1200 || window.innerHeight < 900;
            const shouldSuppress = this.devToolsOpen || isSmallWindow;
            if (!shouldSuppress) {
                this.applyAggressiveOptimizations();
            }
            else {
                console.log('🔒 INP optimizations suppressed (small window or DevTools detected)', {
                    windowSize: `${window.innerWidth}x${window.innerHeight}`,
                    devToolsOpen: this.devToolsOpen,
                    reason: isSmallWindow ? 'Small window' : 'DevTools detected'
                });
            }
        },
        optimizeEventHandler(handler, delay = 16) {
            let timeout;
            return function optimizedHandler(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    handler.apply(this, args);
                }, delay);
            };
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            INPOptimizer.init();
        });
    }
    else {
        INPOptimizer.init();
    }
    window.INPOptimizer = INPOptimizer;
    document.documentElement.classList.add('inp-monitoring');
    console.log('🎯 INP Optimizer initialized');
})();
