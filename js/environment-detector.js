window.EnvironmentDetector = {
    isLocal: false,
    isFile: false,
    isLocalhost: false,
    isProduction: false,
    init() {
        this.detectEnvironment();
        this.logEnvironment();
        return this;
    },
    detectEnvironment() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const origin = window.location.origin;
        this.isFile = protocol === 'file:';
        this.isLocalhost = hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0' ||
            hostname.endsWith('.local');
        this.isLocal = this.isFile;
        this.isProduction = !this.isLocal;
        window.IS_LOCAL_ENV = this.isLocal;
        window.IS_PRODUCTION_ENV = this.isProduction;
    },
    logEnvironment() {
        const env = this.isLocal ? '📄 FILE MODE' : '🌐 PRODUCTION';
        const details = [];
        if (this.isFile)
            details.push('file://');
        if (this.isLocalhost && !this.isLocal)
            details.push('localhost (production mode)');
        console.log(`${env} Environment detected${details.length ? ' (' + details.join(', ') + ')' : ''}`);
        if (this.isLocal) {
            console.log('🔇 External API calls and tracking will be disabled');
        }
        else if (this.isLocalhost) {
            console.log('🚀 Localhost detected - full functionality enabled');
        }
    },
    shouldLoadExternalAPIs() {
        return this.isProduction;
    },
    shouldRunBlockerDetection() {
        return this.isProduction;
    },
    shouldEnableAnalytics() {
        return this.isProduction && !this.isLocalhost;
    },
    shouldMakeAPIRequests() {
        return this.isProduction;
    },
    isFileProtocol() {
        return this.isFile;
    }
};
window.EnvironmentDetector.init();
