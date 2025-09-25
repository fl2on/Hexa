// Puter.js AI Utilities Integration
class PuterAI {
    constructor() {
        this.initialized = false;
        this.isAuthenticated = false;
        this.userInfo = null;
        this.fallbackMode = true;
    }

    // Initialize Puter.js AI integration
    async init() {
        try {
            // Skip Puter.js initialization in file:// protocol
            if (window.EnvironmentDetector && !window.EnvironmentDetector.shouldMakeAPIRequests()) {
                console.log('📄 Skipping Puter.js initialization - file:// protocol detected');
                this.setOfflineMode();
                return;
            }
            
            // Check if Puter.js is loaded
            if (typeof puter === 'undefined') {
                throw new Error('Puter.js not loaded');
            }

            // Try to initialize Puter with timeout
            const initPromise = this.tryPuterInit();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Puter init timeout')), 10000)
            );

            await Promise.race([initPromise, timeoutPromise]);
            
        } catch (error) {
            this.fallbackMode = true;
            this.initialized = true; // Still mark as initialized even in fallback mode
        }
    }

    async tryPuterInit() {
        try {
            // Check if puter object exists and has required methods
            if (puter && puter.ai && puter.auth) {
                const isSignedIn = puter.auth.isSignedIn();
                
                // Double-check with a more thorough test if initial check says false
                if (!isSignedIn) {
                    try {
                        // Try to get user info as a secondary check
                        await puter.auth.getUser();
                        // If we get here, session is active despite isSignedIn() saying false
                        this.handleActiveSession(await puter.auth.getUser());
                        return;
                    } catch (secondaryError) {
                        // Secondary check confirmed: no active session
                        // Suppress 401 errors as they're expected when not authenticated
                        if (secondaryError.status !== 401) {
                            console.warn('Puter auth secondary check failed:', secondaryError);
                        }
                    }
                }

                // If signed in, handle active session
                if (isSignedIn) {
                    const userData = await puter.auth.getUser();
                    this.handleActiveSession(userData);
                    return;
                }

                // If not signed in, setup offline mode
                this.setOfflineMode();
                
            } else {
                throw new Error('Puter.js not properly loaded');
            }
        } catch (error) {
            console.warn('Puter initialization error:', error);
            this.setOfflineMode();
        }
    }

    handleActiveSession(userData) {
        this.isAuthenticated = true;
        this.userInfo = userData;
        this.fallbackMode = false;
        this.initialized = true;
        console.log('✅ Puter.js AI ready - authenticated as:', userData.username);
    }

    setOfflineMode() {
        this.isAuthenticated = false;
        this.userInfo = null;
        this.fallbackMode = true;
        this.initialized = true;
        console.log('� Puter.js AI in offline mode (file:// protocol)');
    }

    // Auth state management
    getAuthStatus() {
        return {
            initialized: this.initialized,
            isAuthenticated: this.isAuthenticated,
            userInfo: this.userInfo,
            fallbackMode: this.fallbackMode
        };
    }

    async refreshAuthState() {
        try {
            if (typeof puter !== 'undefined' && puter.auth) {
                // First check: isSignedIn()
                let isSignedIn = puter.auth.isSignedIn();
                
                // Second check: try to get user data (more reliable)
                let userData = null;
                try {
                    userData = await puter.auth.getUser();
                    if (userData) {
                        isSignedIn = true; // Override if we got valid user data
                    }
                } catch (getUserError) {
                    // If getUser fails, isSignedIn is likely correct
                    if (getUserError.status !== 401) {
                        console.warn('getUser check failed:', getUserError);
                    }
                }
                
                if (isSignedIn && userData) {
                    console.log('🟢 Puter auth verified - user authenticated');
                    this.handleActiveSession(userData);
                } else {
                    this.setOfflineMode();
                }
            }
        } catch (error) {
            // Suppress 401 errors as they're expected when not authenticated
            if (error.status !== 401) {
                console.warn('Auth state refresh failed:', error);
            }
            this.setOfflineMode();
        }
    }

    // ===== CORE AI FUNCTIONS =====

    async summarizeText(text, length = 'medium', abortSignal = null) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            let lengthInstruction;
            switch(length) {
                case 'short': lengthInstruction = 'in 1-2 sentences'; break;
                case 'long': lengthInstruction = 'in detailed paragraphs'; break;
                default: lengthInstruction = 'in 2-3 sentences'; break;
            }

            const prompt = `Please summarize the following text ${lengthInstruction}:\n\n${text}`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.3,
                max_tokens: length === 'long' ? 800 : length === 'short' ? 200 : 400
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async convertCode(code, fromLanguage, toLanguage) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Convert this ${fromLanguage} code to ${toLanguage}. Only return the converted code:\n\n${code}`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.1,
                max_tokens: 1500
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async enhanceText(text, enhancement) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Please make this text more ${enhancement}:\n\n${text}`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.4,
                max_tokens: 1000
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async translateText(text, targetLanguage) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Translate this text to ${targetLanguage}:\n\n${text}`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.2,
                max_tokens: 1000
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async checkGrammar(text) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Please check and correct the grammar in this text, return only the corrected version:\n\n${text}`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.1,
                max_tokens: 1200
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async generateContent(topic, type = 'article', length = 'medium') {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Write a ${length} ${type} about "${topic}". Make it engaging and informative.`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.7,
                max_tokens: length === 'long' ? 1500 : length === 'short' ? 500 : 1000
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async chatWithAI(message) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const response = await puter.ai.chat(message, {
                temperature: 0.7,
                max_tokens: 1000
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    // ===== ADVANCED AI UTILITIES =====

    async generateDocumentation(code) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Generate comprehensive documentation for this code. Include JSDoc comments or appropriate documentation format:

${code}

Please provide:
1. Clear function/class descriptions
2. Parameter explanations
3. Return value documentation  
4. Usage examples if helpful
5. Any important notes or warnings`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.2,
                max_tokens: 1500
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async optimizeCode(code) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Optimize this code for better performance, readability, and best practices:

${code}

Please provide:
1. The optimized code
2. A brief explanation of improvements made
3. Any performance benefits gained
4. Best practice recommendations applied`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.1,
                max_tokens: 2000
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async explainCode(code) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Explain what this code does in simple, clear terms:

${code}

Please provide:
1. Overall purpose of the code
2. Step-by-step breakdown of main logic
3. Key variables and their purposes
4. Any algorithms or patterns used
5. Potential use cases or context

Keep the explanation clear and accessible.`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.3,
                max_tokens: 800
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async findBugs(code) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Analyze this code for potential bugs, errors, and issues:

${code}

Please identify:
1. Syntax errors if any
2. Logic bugs or potential issues
3. Security vulnerabilities
4. Performance problems
5. Code quality concerns
6. Suggested fixes for each issue found`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.2,
                max_tokens: 1200
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async generateTests(code) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Generate unit tests for this code:

${code}

Please provide:
1. Complete test cases with assertions
2. Edge case testing
3. Error condition testing
4. Mock data where needed
5. Clear test descriptions`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.2,
                max_tokens: 1500
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async generateHTML(description) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Generate clean, semantic HTML for: "${description}"

Please provide:
1. Well-structured HTML markup
2. Appropriate semantic tags
3. Basic accessibility considerations
4. Clean, readable formatting
5. No inline styles (use class names)`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.3,
                max_tokens: 1200
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async optimizeSEO(text, keywords) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Optimize this content for SEO using these keywords: "${keywords}"

Original content:
${text}

Please provide:
1. SEO-optimized version of the content
2. Natural keyword integration
3. Better structure for readability
4. Meta description suggestions
5. Title tag recommendations`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.4,
                max_tokens: 1200
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async generateRegex(description) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Generate a regular expression pattern for: "${description}". 

Please provide:
1. The regex pattern itself
2. A brief explanation of what it matches
3. Example matches if applicable
4. Any important notes about usage

Keep the response concise and practical.`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.1,
                max_tokens: 800
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async generateSQL(description) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Generate a SQL query for: "${description}". 

Please provide:
1. The complete SQL query
2. Comments explaining the main parts
3. Example of expected results
4. Any assumptions made about table structure

Keep the response practical and well-formatted.`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.1,
                max_tokens: 800
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async generateEmail(purpose, tone = 'professional') {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Write a ${tone} email for the following purpose: "${purpose}".

Please provide:
1. A clear and appropriate subject line
2. A well-structured email body
3. Proper greeting and closing
4. Professional formatting

The tone should be ${tone}. Keep the email concise but complete.`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.3,
                max_tokens: 1000
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    async analyzeData(data) {
        if (!this.initialized) throw new Error('PuterAI not initialized');
        
        try {
            if (this.fallbackMode || !this.isAuthenticated) {
                throw new Error('Authentication required for AI features');
            }

            const prompt = `Analyze the following data and provide insights:

${data}

Please provide:
1. Data summary and overview
2. Key patterns and trends identified
3. Statistical insights if applicable
4. Potential implications or recommendations
5. Any data quality observations

Keep the analysis clear and actionable.`;
            
            const response = await puter.ai.chat(prompt, {
                temperature: 0.2,
                max_tokens: 1200
            });

            return response;
        } catch (error) {
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                throw new Error('Please sign in with Puter to use AI features');
            }
            throw new Error(`AI service error: ${error.message}`);
        }
    }

    // ===== AUTHENTICATION FUNCTIONS =====

    async signIn() {
        try {
            // Check if we're using file:// protocol first
            if (window.EnvironmentDetector && !window.EnvironmentDetector.shouldMakeAPIRequests()) {
                throw new Error('Sign-in not available when opening file directly');
            }
            
            if (typeof puter === 'undefined') {
                throw new Error('Puter.js not loaded');
            }

            if (!puter.auth || !puter.auth.signIn) {
                throw new Error('Puter.js authentication not available');
            }

            // Special handling for Brave browser
            const isBrave = navigator.userAgentData?.brands?.some(brand => brand.brand === 'Brave') || 
                           window.navigator.brave;

            if (isBrave) {
                // For Brave, try with different approach but keep it simple
                console.log('🟠 Brave browser detected - using enhanced auth flow');
                
                try {
                    // Try standard sign in first
                    const user = await puter.auth.signIn();
                    
                    if (user) {
                        this.handleActiveSession(user);
                        return user;
                    } else {
                        console.log('🟠 No user returned, checking authentication status...');
                        // Wait and check authentication status
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await this.refreshAuthState();
                        
                        if (this.isAuthenticated) {
                            console.log('✅ Authentication successful in Brave!');
                            return this.userInfo;
                        } else {
                            throw new Error('Brave authentication incomplete');
                        }
                    }
                } catch (braveError) {
                    console.log('🟠 Brave auth failed (possibly AdGuard/popup blocker):', braveError.error);
                    
                    // If it's just the popup being closed, don't treat as fatal error
                    if (braveError.error === 'auth_window_closed') {
                        console.log('🟠 Popup was closed - this may be due to AdGuard or popup blocker');
                        // Check if we might have actually authenticated
                        setTimeout(async () => {
                            await this.refreshAuthState();
                            if (this.isAuthenticated) {
                                console.log('✅ Authentication succeeded despite popup closure');
                            }
                        }, 2000);
                        
                        // Don't throw error immediately for Brave
                        return null;
                    }
                    
                    throw braveError;
                }
            } else {
                // Standard sign in for other browsers
                const user = await puter.auth.signIn();
                
                if (user) {
                    this.handleActiveSession(user);
                    return user;
                } else {
                    throw new Error('Authentication failed - no user data returned');
                }
            }
        } catch (error) {
            console.error('PuterAI signIn error:', error);
            
            // Special handling for auth_window_closed in Brave
            if (error.error === 'auth_window_closed' && 
                (navigator.userAgentData?.brands?.some(brand => brand.brand === 'Brave') || 
                 window.navigator.brave)) {
                console.log('🟠 Brave authentication window closed - likely due to AdGuard or popup blocker');
                
                // Don't set offline mode for Brave popup issues
                return null;
            }
            
            this.setOfflineMode();
            throw error;
        }
    }

    async directSignIn() {
        try {
            if (typeof puter === 'undefined') {
                throw new Error('Puter.js not loaded');
            }

            if (!puter.auth) {
                throw new Error('Puter.js authentication not available');
            }

            // Check if there's a direct sign in method available
            if (puter.auth.directSignIn) {
                await puter.auth.directSignIn();
            } else {
                // Fallback to regular sign in
                return await this.signIn();
            }
        } catch (error) {
            console.error('PuterAI directSignIn error:', error);
            this.setOfflineMode();
            throw error;
        }
    }

    async signOut() {
        try {
            if (typeof puter !== 'undefined' && puter.auth && puter.auth.signOut) {
                await puter.auth.signOut();
            }
        } catch (error) {
            console.warn('Sign out error:', error);
        } finally {
            this.setOfflineMode();
        }
    }
}

// Create global instance
window.puterAI = new PuterAI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuterAI;
}