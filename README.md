![Hexa Logo](https://github.com/qzxtu/Hexa/assets/69091361/3f61e2b4-bd7e-43e3-8a63-1591c300647e)

# Welcome to **Hexa** ✨

Hexa is a modern and powerful text editor designed for productivity and a fluid writing experience. Built with cutting-edge web technologies, it offers advanced features while maintaining simplicity and performance. **Fully responsive and optimized for mobile devices.**

## 🎉 **Main Features**

### ✍️ **Advanced Text Editor**
- **🌙 Smart Dark/Light Mode:** Instant theme switching without loading flicker
- **🎯 Focus Mode:** Distraction-free writing environment (Alt+Enter)
- **📏 Line Numbers:** Clear visual reference for your text
- **🖱️ Enhanced Drag and Drop:** Support for multiple file types up to 10MB
- **📱 Responsive Design:** Fully optimized for mobile, tablet, and desktop

### 📊 **Intelligent Text Analysis**
- **📈 Real-time Statistics:** Characters, words, lines, sentences, and paragraphs
- **⏱️ Reading Time:** Accurate estimation based on 200 WPM
- **📖 Readability Score:** Flesch Reading Ease analysis for content quality
- **🔍 Advanced Syntax Detection:** HTML, CSS, JavaScript, Python, SQL, JSON, Markdown, XML
- **📝 Word Frequency:** Analysis of most common words
- **😊 Sentiment Analysis:** Detects emotional tone of text

### 🛠️ **Powerful Text Tools**
- **🔤 Text Formatting:** UPPERCASE, lowercase, Title Case, Sentence case
- **🧹 Text Cleaning:** Remove extra spaces, line breaks, smart formatting
- **🔍 Search and Replace:** Advanced search and replace with regex support
- **↶ Undo/Redo System:** Up to 50 states with complete history tracking
- **🎨 Smart Autocomplete:** Contextual suggestions for code

### ⏰ **Writing Session Tracking**
- **⏱️ Active Timer:** Tracks your real writing time
- **📊 Daily Statistics:** Words written and time spent today
- **📈 Session History:** Long-term productivity tracking

### 💾 **Export and Advanced Sharing**
- **📤 Multiple Formats:** Export as TXT, MD, HTML or JSON
- **🔗 Smart Sharing with Compression (SmartCompress):** URLs that support 5-10x more text with adaptive strategy selection
- **📊 Compression Analysis:** Detailed compression statistics (Dev Tools → Compression Analysis)
- **🧠 Strategies:** `lu` (LZ URI-safe), `lb` (LZ+base64url), `w1` (word-dictionary + reversible affixes + LZ)
- **📈 Adaptive Thresholds:** Picks best strategy and falls back to `lu` when gains are marginal; type-aware telemetry guides thresholds over time
- **  URL-Safe & Backward Compatible:** Legacy links continue to work; decoders maintain compatibility
- **💾 Auto-Save:** Smart saving every 30 seconds
- **🔒 Local Storage:** Secure and private data storage

### 🔧 **Advanced Developer Tools**
- **🐍 Python Executor:** Run Python code directly in the browser
- **✨ Smart Code Beautifier:** Automatic formatting for multiple languages:
  - 📄 **HTML:** Correct tag indentation
  - 🎨 **CSS:** Rule and property formatting
  - ⚡ **JavaScript:** Function spacing and structure
  - 🐍 **Python:** Indentation validation
  - 📋 **JSON:** Formatting with syntax validation
  - 🔧 **XML:** Hierarchical structure
- **🗜️ Code Minifier:** Minifies JS, CSS and HTML
- **✅ Code Validator:** Detects errors and suggests optimizations
- **🎨 Generators:** UUID, secure passwords, Lorem Ipsum, sample JSON
- **📝 Template Generators:** HTML, CSS, JavaScript and Python
- **🌙 Lua Processor:** Lua code obfuscation and formatting (optional tool)

### 🌐 **Complete Web Utilities**
- **💬 Discord Format:** Convert text to Discord format (bold, italic, code)
- **🔐 Hash and Encoding:** MD5, SHA-256, Base64, URL encoding/decoding
- **🔤 Text Analysis:** Advanced metrics and statistics
 - **🧩 Regex Tools:** Test regex and extract groups (uses Find panel pattern)
 - **🔁 Converters:** CSV ↔ JSON, Date ↔ Epoch
 - **🌐 Unicode:** Remove diacritics, Normalize NFKC, Slugify
 - **🧾 JWT & URL:** Decode JWT, Query ↔ JSON
 - **🧪 Diff & IDs:** Diff with previous text, insert unified diff, batch UUIDs

### 📱 **Mobile Features**
- **👆 Touch-Friendly:** Touch-optimized buttons (minimum 44px)
- **📱 Full-Screen Panels:** Side panels take full screen on mobile
- **🔤 Scalable Text:** Adaptive font sizes based on device
- **⚡ Optimized Performance:** Effects disabled on mobile for better performance
- **🌐 Responsive Navigation:** Adaptive interface for all screen sizes

## 🚀 **Getting Started**

1. Open [Hexa](https://fl2on.github.io/Hexa) in your browser (desktop or mobile).
2. Start writing in the enhanced text editor with line numbers.
3. Use **Query Parameters** for advanced configuration:
   - `?text=YOUR_TEXT` to pre-fill content (without compression)
   - `?t=COMPRESSED_TEXT&c=1` for compressed content
   - `?title=YOUR_TITLE` to set custom session title
   - Example: `https://fl2on.github.io/Hexa/?text=Hello%20World&title=My%20Session`
4. **Drag and Drop** supported files (TXT, HTML, CSS, JS, JSON, MD, PY, SQL, XML)
5. Use the **Text Tools** panel for formatting and analysis
6. **Find and Replace** with advanced pattern matching
7. **Export** your work in multiple formats
8. Track your **writing progress** with session statistics
9. **Share** long texts with automatic compression

## 🔗 **Advanced Sharing System**

### **Smart Compression:**
- **Short texts (<1000 chars):** Traditional method
- **Long texts (>1000 chars):** Automatic SmartCompress with URL-safe payloads
- **Compression ratio:** Typically 30-80% reduction depending on content type
- **Strategies:** Automatically evaluates `lu`, `lb`, and `w1`; chooses the smallest
- **Telemetry-aware:** Local telemetry improves choices over time; no network calls
- **Single Share Action:** One “Share URL” button; long-URL notice is gentle and shown once

### **Compatibility:**
- ✅ **Backward Compatible:** Old links continue to work
- ✅ **Universal:** Works on any device/browser
- ✅ **No time limits:** Links never expire
- ✅ **Automatic fallback:** If compression fails, uses original method

### **Compression Analysis:**
- 📊 **Dev Tools → Compression Analysis:** View compression statistics
- 🔗 **Share Link Statistics:** Analyze generated links
- 📈 **Typical ratios:** JavaScript 40-60%, JSON 50-80%, Markdown 25-45%

## 🎥 **Live Demo**

Check out the [live demo](https://fl2on.github.io/Hexa/?title=MyJavaScript&text=public%20class%20HelloWorld%20%7B%0A%20%20%20%20public%20static%20void%20main(String%5B%5D%20args)%20%7B%0A%20%20%20%20%20%20%20%20System.out.println(%22Hello,%20World!%22)%3B%0A%20%20%20%20%7D%0A%7D) to see Hexa in action!

<img width="2560" height="1334" alt="image" src="https://github.com/user-attachments/assets/3f8ffb22-785c-4ba2-8197-ead8b9033b5f" />

## 📱 **Responsive Design**

### **Breakpoints:**
- **📱 Mobile:** ≤768px (touch-optimized interface)
- **📋 Tablet:** 769px-1024px (hybrid navigation)
- **🖥️ Desktop:** ≥1025px (full interface)
- **🖥️ Ultra-wide:** ≥1440px (optimized space usage)

### **Mobile Optimizations:**
- **👆 Touch Buttons:** Minimum 44px for easy interaction
- **📱 Full-Screen Panels:** Better space usage on mobile
- **🔤 Scalable Fonts:** 16px minimum to avoid zoom on iOS
- **⚡ Performance:** Effects disabled on mobile devices

## 🛠️ **Performance Optimizations**

- **⚡ Hardware Acceleration:** GPU-optimized animations and transitions
- **🎯 Throttled Events:** Mouse tracking optimized with requestAnimationFrame and FPS capping to reduce jank (esp. Brave)
- **📦 Lazy Loading:** Advanced features load after initial render
- **♿ Accessibility:** Respects reduced motion preferences
- **🔄 Debounced Operations:** Smart auto-save and analysis timing
- **💾 Memory Management:** Efficient history and session tracking
- **📱 Mobile Optimization:** Lower battery and resource usage on mobile devices

### Storage Robustness
- **TextStore:** Large-text persistence with compression (UTF-16 via LZString) and localStorage→sessionStorage fallback
- **Quota Handling:** Prevents QuotaExceededError with graceful degradation and one-time notice

### On-Device Learning (No LLMs)
- **TensorFlow.js 4.x:** Learns typing behavior to suggest autosave intervals
- **Modern Persistence:** Uses official IndexedDB/LocalStorage IO handlers (no deprecated manual artifacts)
- **Private by Design:** All learning happens locally; no network calls

## 🧑‍💻 **Technologies Used**

- **Alpine.js 3.x:** Reactive functionality and state management
- **Tailwind CSS:** Modern utility-first styling framework with responsive system
- **LZ-String:** Compression library for URL optimization (also used by SmartCompress)
- **Vanilla JavaScript:** High-performance core features
- **Web APIs:** Clipboard, File Reader, Performance Observer
- **Local/Session Storage:** Secure client-side data persistence, with TextStore wrapper
- **CSS3:** Advanced animations and responsive design
- **Prism.js:** Syntax highlighting for multiple languages
- **TensorFlow.js:** On-device ML for adaptive autosave timing

## 📍 **Authors**
## 🔧 Utilities (window.Utils)

Built-in utility module exposed as `window.Utils` provides production-ready helpers:

- `debounce(fn, wait, {leading, trailing})` and `throttle(fn, wait)`
- `memoize(fn, keyFn)` for caching deterministic function calls
- `sleep(ms)`, `retry(asyncFn, {retries, delay, factor, onRetry})`, `withTimeout(promise, ms)`
- `EventBus` for decoupled pub/sub: `const bus = new Utils.EventBus()`
- `Logger(prefix)` with levels: `debug`, `info`, `warn`, `error`
- `SafeStorage.local|session.get/set(key, value, ttlMs)` with TTL support
- DOM helpers: `qs`, `qsa`, `on`, `delegate`
- Clipboard/Download: `copyText(text)`, `downloadText(filename, text)`
- Theme: `getTheme()`, `setTheme(bool)`, `toggleTheme()` (also bound to `Alt+D`)
- Formatters: `formatBytes(n)`, `formatDate(date)`, `formatDuration(ms)`
- `installGlobalErrorHandler(logger)` to capture errors and show a toast


- **fl2on**
  - GitHub: [fl2on](https://github.com/fl2on)
  - Twitter: [@nova_qzxtu](https://twitter.com/nova_qzxtu)
