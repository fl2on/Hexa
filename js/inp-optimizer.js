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
            avgPresentationDelay: 0
        },

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
            if (this.metrics.avgPresentationDelay > 600) {
                this.applyAggressiveOptimizations();
            }
        },

        // Apply more aggressive optimizations when INP is poor
        applyAggressiveOptimizations() {
            console.log('🚀 Applying conservative INP optimizations');

            // Apply minimal performance improvements without visual impact
            const style = document.createElement('style');
            style.textContent = `
                .transition-all { transition-duration: 100ms !important; }
                * { animation-duration: 0.15s !important; }
            `;
            document.head.appendChild(style);

            // Mark as optimized to avoid re-applying
            document.body.classList.add('inp-optimized');
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

        // Get current performance metrics
        getMetrics() {
            return { ...this.metrics };
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