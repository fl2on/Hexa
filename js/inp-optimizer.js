/*
  inp-optimizer.js - Runtime optimizations to improve Interaction to Next Paint (INP)
  - Reduces input delay, processing time, and presentation delay
  - Optimizes frequently interacted elements
  - Implements intelligent debouncing and throttling
*/

(function() {
    'use strict';

    const INPOptimizer = {
        // Track performance metrics
        metrics: {
            interactions: 0,
            avgInputDelay: 0,
            avgProcessingTime: 0,
            avgPresentationDelay: 0,
            slowInteractions: 0
        },
        
        // DevTools detection
        devToolsOpen: false,
        
        // Very conservative threshold - only trigger for really slow interactions
        threshold: 1000, // 1 second - much higher than before

        // Initialize optimizations
        init() {
            this.optimizeHighFrequencyElements();
            this.setupPerformanceObserver();
            this.optimizeScrolling();
            this.setupIntersectionObserver();
            this.debounceExpensiveOperations();
        },

        // Optimize elements that are frequently interacted with
        optimizeHighFrequencyElements() {
            // Optimize buttons with relative z-10 spans
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                // Pre-warm the button for interactions
                this.prepareElementForInteraction(button);
                
                // Optimize button click handlers
                this.optimizeButtonInteraction(button);
            });

            // Optimize text input
            const textInput = document.getElementById('textInput');
            if (textInput) {
                this.optimizeTextInput(textInput);
            }

            // Optimize dropdown menus and panels
            const panels = document.querySelectorAll('[x-show], .panel, .dropdown-menu');
            panels.forEach(panel => {
                this.prepareElementForInteraction(panel);
            });
        },

        // Prepare element for smooth interactions
        prepareElementForInteraction(element) {
            // Force compositor layer creation
            element.style.transform = 'translateZ(0)';
            element.style.willChange = 'transform, opacity';
            element.style.contain = 'layout paint';

            // Add performance class for CSS optimizations
            element.classList.add('performance-optimized');
        },

        // Optimize button interactions to reduce INP
        optimizeButtonInteraction(button) {
            const spans = button.querySelectorAll('span.relative.z-10');
            
            // Pre-optimize spans that are causing INP issues
            spans.forEach(span => {
                span.style.transform = 'translate3d(0, 0, 0)';
                span.style.backfaceVisibility = 'hidden';
                span.style.contain = 'layout paint';
            });

            // Use passive event listeners where possible
            button.addEventListener('mouseenter', () => {
                // Prepare for interaction
                button.style.willChange = 'transform, background-color';
            }, { passive: true });

            button.addEventListener('mouseleave', () => {
                // Clean up after interaction
                button.style.willChange = 'auto';
            }, { passive: true });
        },

        // Optimize text input to reduce input delay
        optimizeTextInput(textInput) {
            // Force GPU acceleration
            textInput.style.transform = 'translateZ(0)';
            textInput.style.contain = 'layout paint';
            textInput.style.willChange = 'contents';

            // Optimize input event handling
            let inputTimeout;
            const originalInputHandler = textInput.oninput;

            textInput.oninput = (event) => {
                // Clear previous timeout
                clearTimeout(inputTimeout);
                
                // Defer expensive operations
                inputTimeout = setTimeout(() => {
                    if (originalInputHandler) {
                        originalInputHandler.call(textInput, event);
                    }
                }, 16); // ~1 frame delay
            };
        },

        // Setup performance observer to monitor INP
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
                } catch (error) {
                    console.warn('INP Observer setup failed:', error.message);
                }
            }
        },

        // Track and analyze INP metrics
        trackINPMetric(entry) {
            this.metrics.interactions++;
            
            // Calculate delays (if available)
            const inputDelay = entry.processingStart - entry.startTime;
            const processingTime = entry.processingEnd - entry.processingStart;
            const presentationDelay = entry.startTime + entry.duration - entry.processingEnd;

            // Update running averages
            this.metrics.avgInputDelay = this.updateAverage(
                this.metrics.avgInputDelay,
                inputDelay,
                this.metrics.interactions
            );

            this.metrics.avgProcessingTime = this.updateAverage(
                this.metrics.avgProcessingTime,
                processingTime,
                this.metrics.interactions
            );

            this.metrics.avgPresentationDelay = this.updateAverage(
                this.metrics.avgPresentationDelay,
                presentationDelay,
                this.metrics.interactions
            );

            // Apply optimizations based on metrics (very conservative threshold)
            // Don't trigger optimizations if DevTools are open OR if window is small (mobile/tablet/small desktop)
            const isSmallWindow = window.innerWidth < 1200 || window.innerHeight < 900;
            const shouldSuppress = this.devToolsOpen || isSmallWindow;
            
            if (this.metrics.avgPresentationDelay > 1000 && !shouldSuppress) {
                this.applyAggressiveOptimizations();
            }
        },

        // Apply more aggressive optimizations when INP is poor
        applyAggressiveOptimizations() {
            console.log('🚀 INP optimizations would apply here (DISABLED for debugging)');
            
            // TEMPORARILY DISABLED - Not applying any optimizations to debug blue background
            console.log('⚠️ INP optimizations are temporarily disabled to prevent blue background issues');
            return;
            
            // Original optimization code (disabled)
            /*
            const style = document.createElement('style');
            style.textContent = `
                .transition-all { transition-duration: 100ms !important; }
                * { animation-duration: 0.15s !important; }
            `;
            document.head.appendChild(style);

            // Mark as optimized to avoid re-applying
            document.body.classList.add('inp-optimized');
            */
        },

        // Optimize scrolling performance
        optimizeScrolling() {
            const scrollableElements = document.querySelectorAll('.overflow-y-auto, .overflow-x-auto');
            
            scrollableElements.forEach(element => {
                // Use passive listeners for scroll events
                element.addEventListener('scroll', () => {
                    // Throttled scroll handling
                    requestAnimationFrame(() => {
                        // Any scroll-related updates here
                    });
                }, { passive: true });
            });
        },

        // Setup intersection observer for viewport optimization
        setupIntersectionObserver() {
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            // Element is visible, ensure it's optimized
                            this.prepareElementForInteraction(entry.target);
                        } else {
                            // Element is not visible, remove performance hints
                            entry.target.style.willChange = 'auto';
                        }
                    });
                }, {
                    rootMargin: '50px' // Optimize elements before they come into view
                });

                // Observe buttons and interactive elements
                document.querySelectorAll('button, input, textarea, [x-show]').forEach(el => {
                    observer.observe(el);
                });
            }
        },

        // Debounce expensive operations
        debounceExpensiveOperations() {
            // Debounce window resize
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    // Re-optimize elements after resize
                    this.optimizeHighFrequencyElements();
                }, 250);
            }, { passive: true });
        },

        // Utility function to update running averages
        updateAverage(currentAvg, newValue, count) {
            return (currentAvg * (count - 1) + newValue) / count;
        },

        // Detect if DevTools are open to avoid false INP triggers
        detectDevTools() {
            const checkDevTools = () => {
                // Ultra-conservative detection - only trigger for very clear DevTools patterns
                const heightDiff = window.outerHeight - window.innerHeight;
                const widthDiff = window.outerWidth - window.innerWidth;
                
                // Require both large viewport AND large difference for DevTools detection
                const isDesktopSize = window.innerWidth > 1200 && window.innerHeight > 800;
                
                // Only consider DevTools open if there's a massive difference
                // AND we're on a desktop-sized screen
                const isLikelyDevTools = isDesktopSize && (
                    (heightDiff > 400 && window.innerWidth > 1000) || // Docked bottom with huge difference
                    (widthDiff > 500 && window.innerHeight > 700)     // Docked side with huge difference
                );
                
                // Additional check: DevTools make viewport MUCH smaller than window
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
                } else if (!devToolsCurrentlyOpen && this.devToolsOpen) {
                    this.devToolsOpen = false;
                    console.log('🔧 DevTools closed - re-enabling INP monitoring');
                }
            };
            
            // Check on window resize and periodically, but less frequently
            window.addEventListener('resize', checkDevTools);
            setInterval(checkDevTools, 3000); // Every 3 seconds instead of 2
            checkDevTools(); // Initial check
        },

        // Initialize the optimizer
        init() {
            this.detectDevTools();
            this.optimizeHighFrequencyElements();
            this.optimizeScrolling();
            this.startMonitoring();
        },

        // Get current performance metrics
        getMetrics() {
            return { ...this.metrics };
        },

        // Start monitoring interactions for INP metrics
        startMonitoring() {
            // Monitor click events
            document.addEventListener('click', (event) => {
                this.measureInteraction(event, 'click');
            });
            
            // Monitor input events
            document.addEventListener('input', (event) => {
                this.measureInteraction(event, 'input');
            });
            
            // Monitor key presses
            document.addEventListener('keydown', (event) => {
                this.measureInteraction(event, 'keydown');
            });
            
            console.log('🎯 INP monitoring started');
        },

        // Measure interaction timing for INP optimization
        measureInteraction(event, type) {
            const startTime = performance.now();
            
            // Use requestIdleCallback to measure post-interaction work
            if (window.requestIdleCallback) {
                requestIdleCallback(() => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    if (duration > this.threshold) {
                        this.metrics.slowInteractions++;
                        console.log(`🐌 Slow ${type} interaction: ${duration.toFixed(2)}ms`);
                        
                        // Apply optimizations with size check
                        this.applySafeOptimizations();
                    }
                });
            } else {
                // Fallback for browsers without requestIdleCallback
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

        // Apply optimizations with window size protection
        applySafeOptimizations() {
            // Don't apply any visual optimizations in small windows or with DevTools open
            const isSmallWindow = window.innerWidth < 1200 || window.innerHeight < 900;
            const shouldSuppress = this.devToolsOpen || isSmallWindow;
            
            if (!shouldSuppress) {
                this.applyAggressiveOptimizations();
            } else {
                console.log('🔒 INP optimizations suppressed (small window or DevTools detected)', {
                    windowSize: `${window.innerWidth}x${window.innerHeight}`,
                    devToolsOpen: this.devToolsOpen,
                    reason: isSmallWindow ? 'Small window' : 'DevTools detected'
                });
            }
        },

        // Export optimized event handler wrapper
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            INPOptimizer.init();
        });
    } else {
        INPOptimizer.init();
    }

    // Export to global scope for debugging
    window.INPOptimizer = INPOptimizer;

    // Add performance monitoring CSS class
    document.documentElement.classList.add('inp-monitoring');

    console.log('🎯 INP Optimizer initialized');

})();