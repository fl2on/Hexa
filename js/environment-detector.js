// Environment Detection Utility
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
        
        // Check if running from file:// protocol (opening HTML file directly)
        this.isFile = protocol === 'file:';
        
        // Check if running on localhost/127.0.0.1 - but treat as PRODUCTION
        this.isLocalhost = hostname === 'localhost' || 
                          hostname === '127.0.0.1' || 
                          hostname === '0.0.0.0' ||
                          hostname.endsWith('.local');
        
        // Only file:// protocol is considered truly "local" for offline mode
        this.isLocal = this.isFile; // Only file:// protocol
        
        // Production includes localhost servers and everything else
        this.isProduction = !this.isLocal;
        
        // Set global flag for easy access
        window.IS_LOCAL_ENV = this.isLocal;
        window.IS_PRODUCTION_ENV = this.isProduction;
    },
    
    logEnvironment() {
        const env = this.isLocal ? '📄 FILE MODE' : '🌐 PRODUCTION';
        const details = [];
        
        if (this.isFile) details.push('file://');
        if (this.isLocalhost && !this.isLocal) details.push('localhost (production mode)');
        
        console.log(`${env} Environment detected${details.length ? ' (' + details.join(', ') + ')' : ''}`);
        
        if (this.isLocal) {
            console.log('🔇 External API calls and tracking will be disabled');
        } else if (this.isLocalhost) {
            console.log('🚀 Localhost detected - full functionality enabled');
        }
    },
    
    // Helper methods for common environment checks
    shouldLoadExternalAPIs() {
        return this.isProduction; // Load in production AND localhost
    },
    
    shouldRunBlockerDetection() {
        return this.isProduction; // Run in production AND localhost
    },
    
    shouldEnableAnalytics() {
        return this.isProduction && !this.isLocalhost; // Only in real production, not localhost
    },
    
    shouldMakeAPIRequests() {
        return this.isProduction; // Allow in production AND localhost
    },
    
    isFileProtocol() {
        return this.isFile; // Specific check for file:// protocol
    }
};

// Initialize immediately
window.EnvironmentDetector.init();