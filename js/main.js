let activeNotifications = new Set();
let currentNotification = null;
let currentNotificationTimer = null;
function sanitizeUiMessage(message = "") {
    return String(message)
        .replace(/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}
function showNotification(message, type = "success", options = {}) {
    const cleanMessage = sanitizeUiMessage(message);
    const notificationKey = `${cleanMessage}-${type}`;
    if (activeNotifications.has(notificationKey))
        return;
    let container = document.getElementById("notification-container");
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'hexa-toast-stack fixed bottom-5 left-1/2 z-[9999] flex flex-col items-center pointer-events-none';
        document.body.appendChild(container);
    }
    if (currentNotificationTimer) {
        clearTimeout(currentNotificationTimer);
        currentNotificationTimer = null;
    }
    if (currentNotification && currentNotification.parentNode) {
        currentNotification.parentNode.removeChild(currentNotification);
    }
    container.querySelectorAll('.hexa-toast').forEach((toast) => toast.remove());
    activeNotifications.clear();
    activeNotifications.add(notificationKey);
    const palette = {
        success: { icon: 'check', tint: 'rgba(16,185,129,0.16)', color: 'text-emerald-300', line: 'from-emerald-400 via-teal-400 to-cyan-400', label: 'Success' },
        error: { icon: 'circle-x', tint: 'rgba(244,63,94,0.16)', color: 'text-rose-300', line: 'from-rose-400 via-red-400 to-orange-400', label: 'Error' },
        warning: { icon: 'alert-triangle', tint: 'rgba(245,158,11,0.16)', color: 'text-amber-200', line: 'from-amber-300 via-yellow-300 to-orange-300', label: 'Warning' },
        info: { icon: 'info', tint: 'rgba(59,130,246,0.16)', color: 'text-sky-200', line: 'from-sky-300 via-blue-300 to-indigo-300', label: 'Info' }
    };
    const theme = palette[type] || palette.success;
    const notification = document.createElement("div");
    notification.className = 'hexa-toast pointer-events-auto';
    notification.innerHTML = `
    <div class="flex items-start gap-3 px-3.5 py-3">
      <div class="mt-0.5 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${theme.color}" style="background:${theme.tint}">
        <i data-lucide="${theme.icon}" class="h-5 w-5"></i>
      </div>
      <div class="min-w-0 flex-1">
        <div class="mb-1.5 flex items-center gap-2">
          <span class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">${theme.label}</span>
          <span class="inline-flex h-1.5 w-1.5 rounded-full bg-white/20"></span>
          <span class="text-[11px] text-white/35">now</span>
        </div>
        <p class="text-[14px] font-medium leading-5 text-white/90 break-words">${cleanMessage}</p>
      </div>
      <button type="button" aria-label="Dismiss" class="hexa-toast-close inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/5 hover:text-white">
        <i data-lucide="x" class="h-4 w-4"></i>
      </button>
    </div>
    <div class="h-[3px] bg-white/5">
      <div class="hexa-toast-progress h-full bg-gradient-to-r ${theme.line}"></div>
    </div>
  `;
    notification.style.transform = 'translateY(12px) scale(0.98)';
    notification.style.opacity = '0';
    notification.style.transition = 'transform 220ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease, box-shadow 220ms ease';
    container.appendChild(notification);
    currentNotification = notification;
    if (window.lucide)
        lucide.createIcons({ attrs: { 'stroke-width': 1.85 } });
    requestAnimationFrame(() => {
        notification.style.transform = 'translateY(0) scale(1)';
        notification.style.opacity = '1';
    });
    const lifetime = Number.isFinite(options.duration) ? options.duration : 3600;
    const progress = notification.querySelector('.hexa-toast-progress');
    if (progress) {
        progress.style.width = '100%';
        progress.style.transition = `width ${lifetime}ms linear`;
        requestAnimationFrame(() => { progress.style.width = '0%'; });
    }
    const dismiss = () => dismissNotification(notification, notificationKey);
    notification.querySelector('.hexa-toast-close')?.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });
    notification.addEventListener('click', () => { try {
        if (typeof options.onClick === 'function')
            options.onClick();
    }
    catch { } dismiss(); }, { passive: true });
    currentNotificationTimer = setTimeout(dismiss, lifetime);
}
function dismissNotification(notification, notificationKey) {
    if (!notification || !notification.parentNode) {
        activeNotifications.delete(notificationKey);
        if (currentNotification === notification)
            currentNotification = null;
        return;
    }
    if (currentNotification === notification) {
        currentNotification = null;
        if (currentNotificationTimer) {
            clearTimeout(currentNotificationTimer);
            currentNotificationTimer = null;
        }
    }
    notification.style.transform = 'translateY(10px) scale(0.96)';
    notification.style.opacity = '0';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        activeNotifications.delete(notificationKey);
    }, 220);
}
window.detectSyntax = () => {
    const textArea = document.querySelector("textarea");
    if (!textArea || !textArea.value.trim()) {
        showNotification("ℹ️ No text to analyze", "error");
        return;
    }
    const text = textArea.value;
    const syntaxPatterns = {
        html: {
            pattern: /<[^>]+>/,
            keywords: ["<div", "<p", "<html", "class=", "<body", "<!DOCTYPE", "<head>", "<title>"]
        },
        javascript: {
            pattern: /function|const|let|var|=>|class/,
            keywords: ["function", "const", "let", "var", "if", "for", "console.log", "document.", "window."]
        },
        css: {
            pattern: /{[^}]*}/,
            keywords: ["{", "}", ":", ";", "@media", "px", "rem", "color:", "background:"]
        },
        python: {
            pattern: /def |class |import |if __/,
            keywords: ["def", "class", "import", "if", "print", "from", "elif", "while"]
        },
        sql: {
            pattern: /SELECT|INSERT|UPDATE|DELETE|CREATE TABLE/i,
            keywords: ["SELECT", "FROM", "WHERE", "INSERT", "DELETE", "UPDATE", "CREATE", "ALTER"]
        },
        json: {
            pattern: /^\s*[\{\[][\s\S]*[\}\]]\s*$/,
            keywords: ['":', '": ', '",', '"}', '"]']
        },
        markdown: {
            pattern: /^#{1,6}\s|^\*\s|\*\*.*\*\*|__.*__|^\-\s/m,
            keywords: ["# ", "## ", "### ", "**", "__", "- ", "* ", "[", "]("]
        },
        xml: {
            pattern: /<\?xml|<\/\w+>/,
            keywords: ["<?xml", "</", "/>", "xmlns"]
        }
    };
    const detectedLanguages = [];
    for (const [lang, syntax] of Object.entries(syntaxPatterns)) {
        if (syntax.pattern.test(text) || syntax.keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
            detectedLanguages.push(lang.toUpperCase());
        }
    }
    if (detectedLanguages.length > 0) {
        showNotification(`Detected: ${detectedLanguages.join(', ')}`, "success");
    }
    else {
        showNotification("Plain text detected", "success");
    }
};
document.addEventListener("DOMContentLoaded", () => {
    const textArea = document.querySelector("textarea");
    if (!textArea)
        return;
    let dragCounter = 0;
    textArea.addEventListener("dragenter", (e) => {
        e.preventDefault();
        dragCounter++;
        if (dragCounter === 1) {
            textArea.classList.add("ring-2", "ring-blue-500/50");
        }
    });
    textArea.addEventListener("dragover", (e) => {
        e.preventDefault();
    });
    textArea.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            textArea.classList.remove("ring-2", "ring-blue-500/50");
        }
    });
    textArea.addEventListener("drop", (event) => {
        event.preventDefault();
        dragCounter = 0;
        const file = event.dataTransfer.files[0];
        textArea.classList.remove("ring-2", "ring-blue-500/50");
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showNotification("File too large (max 10MB)", "error");
                return;
            }
            const allowedTypes = ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json', 'text/markdown'];
            if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|html|css|js|json|md|py|sql|xml)$/i)) {
                showNotification("Unsupported file type", "error");
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const appElement = document.querySelector("[x-data]");
                if (appElement && appElement.__x) {
                    const appData = appElement.__x.$data;
                    appData.text = e.target.result;
                    if (window.TextStore) {
                        window.TextStore.set(appData.text);
                    }
                    else {
                        try {
                            localStorage.setItem("text", appData.text);
                        }
                        catch { }
                    }
                    appData.updateStats();
                    appData.saveToHistory();
                    showNotification(`File "${file.name}" loaded`, "success");
                }
            };
            reader.onerror = () => {
                showNotification("Error reading file", "error");
            };
            reader.readAsText(file);
        }
    });
    setTimeout(() => {
        initFeatures();
    }, 100);
});
function initFeatures() {
    let autoSaveTimeout;
    function debouncedAutoSave(text) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            if (window.TextStore) {
                window.TextStore.set(text);
            }
            else {
                try {
                    localStorage.setItem('text', text);
                }
                catch { }
            }
            localStorage.setItem('lastSave', Date.now());
        }, 2000);
    }
    const textArea = document.querySelector("textarea");
    if (textArea) {
        textArea.addEventListener('input', (e) => {
            debouncedAutoSave(e.target.value);
        });
    }
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && ['s', 'f', 'z', 'y'].includes(e.key)) {
            e.preventDefault();
        }
    });
}
document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'hexa-toast-stack fixed bottom-5 left-1/2 z-[9999] flex flex-col items-center pointer-events-none';
        document.body.appendChild(container);
    }
});
try {
    const y = document.getElementById('current-year');
    if (y)
        y.textContent = new Date().getFullYear();
}
catch { }
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const root = document.querySelector('[x-data]');
        if (root && root.__x) {
            const st = root.__x.$data;
            st.togglePanel && st.togglePanel('search');
        }
    }
});
if (window.Utils) {
    window.debounce = window.Utils.debounce;
    window.throttle = window.Utils.throttle;
}
window.showNotification = showNotification;
window.detectSyntax = detectSyntax;
