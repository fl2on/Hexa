// Text analysis engine
window.TextAnalyzer = {
    analyze(text) {
        const chars = text.length;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const lines = text === '' ? 0 : text.split('\n').length;
        const sentences = text === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const paragraphs = text === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
        const readingTime = Math.ceil(words / 200);
        
    // Advanced metrics
        const avgWordsPerSentence = sentences > 0 ? (words / sentences).toFixed(1) : 0;
        const avgCharsPerWord = words > 0 ? (chars / words).toFixed(1) : 0;
        const readabilityScore = this.calculateReadability(text, words, sentences);
        
        return {
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
        // Flesch Reading Ease score
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
    }
};

window.TextFormatter = {
    formatText(text, format) {
        switch(format) {
            case 'uppercase':
                return text.toUpperCase();
            case 'lowercase':
                return text.toLowerCase();
            case 'titlecase':
                return text.replace(/\w\S*/g, (txt) => 
                    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            case 'sentencecase':
                return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            case 'camelcase':
                return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
                    index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '');
            case 'snakecase':
                return text.toLowerCase().replace(/\s+/g, '_');
            case 'kebabcase':
                return text.toLowerCase().replace(/\s+/g, '-');
            case 'reverse':
                return text.split('').reverse().join('');
            case 'removeextraspaces':
                return text.replace(/\s+/g, ' ').trim();
            case 'removenewlines':
                return text.replace(/\n+/g, ' ').trim();
            case 'addnumbers':
                return text.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
            case 'removenumbers':
                return text.replace(/^\d+\.\s*/gm, '');
            case 'sortlines':
                return text.split('\n').sort().join('\n');
            case 'shufflelines':
                const lines = text.split('\n');
                for (let i = lines.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [lines[i], lines[j]] = [lines[j], lines[i]];
                }
                return lines.join('\n');
            case 'duplicatelines':
                return text.split('\n').map(line => line + '\n' + line).join('\n');
            case 'removeduplicates':
                return [...new Set(text.split('\n'))].join('\n');
            case 'extractemails':
                const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
                return emails ? emails.join('\n') : 'No emails found';
            case 'extracturls':
                const urls = text.match(/https?:\/\/[^\s]+/g);
                return urls ? urls.join('\n') : 'No URLs found';
            case 'wordcount':
                const wordCounts = {};
                const words = text.toLowerCase().match(/\b\w+\b/g) || [];
                words.forEach(word => wordCounts[word] = (wordCounts[word] || 0) + 1);
                return Object.entries(wordCounts)
                    .sort(([,a], [,b]) => b - a)
                    .map(([word, count]) => `${word}: ${count}`)
                    .join('\n');
            default:
                return text;
        }
    }
};

// Lua Processor (Obfuscator/Deobfuscator)

// Hash and encoding utilities
window.HashUtils = {
    async md5(text) {
        // Using Web Crypto API for real MD5
        return this.simpleHash(text, 'md5');
    },

    async sha256(text) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            return this.simpleHash(text, 'sha256');
        }
    },

    base64Encode(text) {
        try {
            return btoa(unescape(encodeURIComponent(text)));
        } catch (e) {
            return 'Error: Invalid characters for Base64 encoding';
        }
    },

    base64Decode(text) {
        try {
            return decodeURIComponent(escape(atob(text)));
        } catch (e) {
            return 'Error: Invalid Base64 string';
        }
    },

    urlEncode(text) {
        return encodeURIComponent(text);
    },

    urlDecode(text) {
        try {
            return decodeURIComponent(text);
        } catch (e) {
            return 'Error: Invalid URL encoded string';
        }
    },

    htmlEncode(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    htmlDecode(text) {
        const div = document.createElement('div');
        div.innerHTML = text;
        return div.textContent || div.innerText || '';
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
    }
};

// Writing tracker
window.writingTracker = {
    sessions: JSON.parse(localStorage.getItem('writingSessions') || '[]'),
    currentSession: null,

    startSession() {
        this.currentSession = {
            start: Date.now(),
            words: 0,
            chars: 0
        };
    },

    endSession(finalWords, finalChars) {
        if (this.currentSession) {
            this.currentSession.end = Date.now();
            this.currentSession.duration = this.currentSession.end - this.currentSession.start;
            this.currentSession.words = finalWords;
            this.currentSession.chars = finalChars;
            
            this.sessions.push(this.currentSession);
            try { localStorage.setItem('writingSessions', JSON.stringify(this.sessions)); } catch {}
            this.currentSession = null;
        }
    },

    getStats() {
        const today = new Date().toDateString();
        const todaySessions = this.sessions.filter(s => 
            new Date(s.start).toDateString() === today
        );
        
        return {
            totalSessions: this.sessions.length,
            todayTime: todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
            todayWords: todaySessions.reduce((sum, s) => sum + (s.words || 0), 0),
            avgSessionTime: this.sessions.length > 0 ? 
                this.sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / this.sessions.length : 0
        };
    }
};