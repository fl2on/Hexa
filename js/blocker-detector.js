window.BlockerDetector = {
    detectedBlockers: [],
    isDetectionComplete: false,
    async init() {
        if (window.EnvironmentDetector && !window.EnvironmentDetector.shouldRunBlockerDetection()) {
            console.log('📄 Skipping blocker detection - file:// protocol detected');
            this.isDetectionComplete = true;
            return;
        }
        console.log('🔍 Initializing blocker detection...');
        await this.detectBlockers();
        this.isDetectionComplete = true;
        if (this.detectedBlockers.length > 0) {
            console.log('� Blockers detected (for debugging):', this.detectedBlockers.map(b => b.name));
        }
        else {
            console.log('✅ No blockers detected');
        }
        window.testBlockerDetection = () => {
            console.log('🧪 Running manual blocker detection test...');
            this.detectedBlockers = [];
            return this.detectBlockers().then(() => {
                console.log('Test results:', this.detectedBlockers);
                return this.detectedBlockers;
            });
        };
    },
    async detectBlockers() {
        const isLocalhost = window.EnvironmentDetector && window.EnvironmentDetector.isLocalhost;
        if (isLocalhost) {
            console.log('🚀 Running minimal blocker detection for localhost...');
            this.detectUBlockOrigin();
            this.detectAdBlockPlus();
            await this.detectPopupBlocker();
        }
        else {
            console.log('🔍 Running full blocker detection...');
            await this.detectAdGuardHome();
            this.detectUBlockOrigin();
            this.detectAdBlockPlus();
            await this.detectBraveShields();
            await this.detectPopupBlocker();
            await this.detectDNSBlocking();
        }
    },
    async detectAdGuardHome() {
        try {
            const testUrls = [
                'https://doubleclick.net/favicon.ico',
                'https://googletagmanager.com/gtm.js',
                'https://google-analytics.com/analytics.js'
            ];
            let blockedCount = 0;
            const promises = testUrls.map(async (url) => {
                try {
                    const controller = new AbortController();
                    setTimeout(() => controller.abort(), 2000);
                    await fetch(url, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: controller.signal
                    });
                    return false;
                }
                catch (error) {
                    if (error.name === 'AbortError') {
                        return false;
                    }
                    return true;
                }
            });
            const results = await Promise.all(promises);
            blockedCount = results.filter(blocked => blocked).length;
            if (blockedCount >= 2) {
                this.detectedBlockers.push({
                    name: 'AdGuard Home / DNS Blocker',
                    type: 'dns',
                    confidence: 'high',
                    impact: 'May block authentication popups',
                    suggestion: 'Temporarily disable or whitelist js.puter.com'
                });
            }
        }
        catch (error) {
            console.log('AdGuard Home detection failed:', error);
        }
    },
    detectUBlockOrigin() {
        if (typeof window.uBlockOrigin !== 'undefined' ||
            document.querySelector('script[src*="ublock"]') ||
            window.chrome?.runtime?.getManifest?.()?.name?.includes('uBlock')) {
            this.detectedBlockers.push({
                name: 'uBlock Origin',
                type: 'extension',
                confidence: 'high',
                impact: 'Blocks popups and trackers',
                suggestion: 'Add js.puter.com to trusted sites'
            });
        }
        try {
            const div = document.createElement('div');
            div.innerHTML = '&nbsp;';
            div.className = 'adsbox';
            div.style.position = 'absolute';
            div.style.left = '-999px';
            document.body.appendChild(div);
            setTimeout(() => {
                if (div.offsetHeight === 0) {
                    if (!this.detectedBlockers.find(b => b.name === 'uBlock Origin')) {
                        this.detectedBlockers.push({
                            name: 'Ad Blocker (possibly uBlock)',
                            type: 'extension',
                            confidence: 'medium',
                            impact: 'May interfere with popups',
                            suggestion: 'Check browser extension settings'
                        });
                    }
                }
                document.body.removeChild(div);
            }, 100);
        }
        catch (e) {
        }
    },
    detectAdBlockPlus() {
        if (typeof window.adblockplus !== 'undefined' ||
            window.chrome?.runtime?.getManifest?.()?.name?.includes('Adblock')) {
            this.detectedBlockers.push({
                name: 'AdBlock Plus',
                type: 'extension',
                confidence: 'high',
                impact: 'Blocks ads and may block popups',
                suggestion: 'Add exception for authentication sites'
            });
        }
    },
    async detectBraveShields() {
        const isBrave = navigator.userAgentData?.brands?.some(brand => brand.brand === 'Brave') ||
            window.navigator.brave;
        if (!isBrave)
            return;
        let shieldsActive = false;
        let detectionMethod = '';
        try {
            const testUrls = [
                'https://googletagmanager.com/gtag/js',
                'https://google-analytics.com/analytics.js',
                'https://doubleclick.net/test'
            ];
            let blockedRequests = 0;
            for (const url of testUrls) {
                try {
                    const response = await fetch(url, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        cache: 'no-cache'
                    });
                }
                catch (error) {
                    blockedRequests++;
                }
            }
            if (blockedRequests >= 2) {
                shieldsActive = true;
                detectionMethod = 'blocked requests';
            }
            if (!shieldsActive) {
                try {
                    const testDiv = document.createElement('div');
                    testDiv.className = 'ads adsystem doubleclick googleads';
                    testDiv.style.position = 'absolute';
                    testDiv.style.left = '-999px';
                    testDiv.innerHTML = 'Advertisement';
                    document.body.appendChild(testDiv);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    if (testDiv.offsetHeight === 0 || testDiv.style.display === 'none') {
                        shieldsActive = true;
                        detectionMethod = 'element blocking';
                    }
                    document.body.removeChild(testDiv);
                }
                catch (e) {
                }
            }
            if (shieldsActive) {
                this.detectedBlockers.push({
                    name: 'Brave Shields',
                    type: 'browser',
                    confidence: 'high',
                    impact: 'Actively blocking ads, trackers, and may block popups',
                    suggestion: 'Temporarily disable Brave Shields for authentication',
                    details: `Detected via: ${detectionMethod}`
                });
            }
        }
        catch (error) {
            console.log('Brave Shields detection test failed:', error);
        }
    },
    async detectPopupBlocker() {
        try {
            const popup = window.open('', '_blank', 'width=1,height=1,left=99999,top=99999');
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                this.detectedBlockers.push({
                    name: 'Popup Blocker',
                    type: 'browser',
                    confidence: 'high',
                    impact: 'Prevents authentication popups from opening',
                    suggestion: 'Allow popups for this site'
                });
            }
            else {
                setTimeout(() => {
                    if (popup && !popup.closed) {
                        popup.close();
                    }
                }, 100);
            }
        }
        catch (error) {
            this.detectedBlockers.push({
                name: 'Popup Blocker (Strict)',
                type: 'browser',
                confidence: 'high',
                impact: 'Strict popup blocking detected',
                suggestion: 'Configure popup exceptions'
            });
        }
    },
    async detectDNSBlocking() {
        try {
            const dnsTestUrl = 'https://doubleclick.net';
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 1000);
            await fetch(dnsTestUrl, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
        }
        catch (error) {
            if (error.name !== 'AbortError') {
                const existing = this.detectedBlockers.find(b => b.type === 'dns');
                if (!existing) {
                    this.detectedBlockers.push({
                        name: 'DNS-level Blocker',
                        type: 'dns',
                        confidence: 'medium',
                        impact: 'May block authentication at DNS level',
                        suggestion: 'Check router/DNS settings (Pi-hole, AdGuard Home)'
                    });
                }
            }
        }
    },
    showBlockerWarning() {
        const highConfidenceBlockers = this.detectedBlockers.filter(b => b.confidence === 'high');
        if (highConfidenceBlockers.length > 0) {
            const blockerNames = highConfidenceBlockers.map(b => b.name).join(', ');
            console.log(`🔍 Blockers detected: ${blockerNames} (logged for debugging only)`);
        }
    },
    getDetectedBlockers() {
        return this.detectedBlockers;
    },
    hasHighImpactBlockers() {
        const isLocalhost = window.EnvironmentDetector && window.EnvironmentDetector.isLocalhost;
        if (isLocalhost) {
            return this.detectedBlockers.some(b => b.confidence === 'high' &&
                b.type === 'extension' &&
                b.impact.includes('popup'));
        }
        return this.detectedBlockers.some(b => b.confidence === 'high' &&
            (b.type === 'dns' || b.impact.includes('popup')));
    },
    getRecommendations() {
        return this.detectedBlockers.map(b => ({
            blocker: b.name,
            suggestion: b.suggestion,
            impact: b.impact
        }));
    }
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.BlockerDetector.init(), 1000);
    });
}
else {
    setTimeout(() => window.BlockerDetector.init(), 1000);
}
