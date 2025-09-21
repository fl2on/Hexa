let activeNotifications = new Set();

function showNotification(message, type = "success", options = {}) {
  // Prevent duplicate notifications
  const notificationKey = `${message}-${type}`;
  if (activeNotifications.has(notificationKey)) {
    return;
  }
  
  activeNotifications.add(notificationKey);
  
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-none space-y-3 max-w-sm';
    document.body.appendChild(container);
  }

  const notification = document.createElement("div");
  
  // Styles with gradients
  let bgGradient, borderColor, iconBg, textColor;
  let icon = type === "success" ? "✨" : "⚠️";
  
  if (type === "success") {
    bgGradient = "bg-gradient-to-r from-emerald-500/90 to-green-500/90";
    borderColor = "border-emerald-400/50";
    iconBg = "bg-emerald-400/20";
    textColor = "text-white";
  } else {
    bgGradient = "bg-gradient-to-r from-red-500/90 to-rose-500/90";
    borderColor = "border-red-400/50";
    iconBg = "bg-red-400/20";
    textColor = "text-white";
  }
  
  notification.className = `
    ${bgGradient} ${borderColor} ${textColor}
    backdrop-blur-xl border rounded-xl shadow-2xl
    px-4 py-3 font-medium text-sm
    flex items-center gap-3 min-w-[280px]
    transform transition-all duration-500 ease-out
    pointer-events-auto cursor-pointer
    hover:scale-105 hover:shadow-3xl
  `;
  
  notification.innerHTML = `
    <div class="${iconBg} rounded-full p-2 flex-shrink-0">
      <span class="text-lg">${icon}</span>
    </div>
    <span class="flex-1 leading-relaxed">${message}</span>
    <button class="opacity-60 hover:opacity-100 transition-opacity ml-2 text-lg leading-none" onclick="this.parentElement.remove()">×</button>
  `;
  
  // Initial state
  notification.style.transform = 'translateX(100%) scale(0.8)';
  notification.style.opacity = '0';

  // Append to container
  container.appendChild(notification);
  
  // Animate entrance with bounce effect
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0) scale(1)';
    notification.style.opacity = '1';
  });

  // Click for optional action then dismiss
  notification.addEventListener('click', () => {
    try { if (typeof options.onClick === 'function') options.onClick(); } catch {}
    dismissNotification(notification, notificationKey);
  }, { passive: true });

  // Auto-remove after the delay
  const lifetime = Number.isFinite(options.duration) ? options.duration : 4000;
  setTimeout(() => {
    dismissNotification(notification, notificationKey);
  }, lifetime);
}

function dismissNotification(notification, notificationKey) {
  if (!notification.parentNode) return;
  
  notification.style.transform = 'translateX(100%) scale(0.8)';
  notification.style.opacity = '0';
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
    activeNotifications.delete(notificationKey);
  }, 300);
}

// Optimized spotlight effect (less jank in Brave/Chromium)
(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isBrave = !!(navigator.brave) || /Brave/i.test(navigator.userAgent || '');
  let glowEl = null;
  let lastTs = 0;
  // Limit to ~30fps to reduce paint work on Chromium
  const fpsInterval = 1000 / 30;
  let inactivityTimer = null;

  function ensureGlowEl() {
    if (!glowEl) glowEl = document.getElementById('glow-effect');
    return glowEl;
  }

  function setThemeClass() {
    const el = ensureGlowEl();
    if (!el) return;
    const dark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    el.classList.toggle('glow--dark', !!dark);
  }

  function onPointerMove(e) {
    const el = ensureGlowEl();
    if (!el) return;
    const now = performance.now();
    if (now - lastTs < fpsInterval) return;
    lastTs = now;

    el.style.setProperty('--mouse-x', e.clientX + 'px');
    el.style.setProperty('--mouse-y', e.clientY + 'px');
    el.style.opacity = '1';

    // Reiniciar temporizador de inactividad
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      const el2 = ensureGlowEl();
      if (el2) el2.style.opacity = '0.3';
    }, 3000);
  }

  function onEnter() {
    const el = ensureGlowEl();
    if (el) el.style.opacity = '1';
  }

  function onLeave() {
    const el = ensureGlowEl();
    if (el) el.style.opacity = '0';
  }

  function initGlow() {
    const el = ensureGlowEl();
    if (!el) return;

  // Brave-specific tweaks (reduce expensive composition)
    if (isBrave) {
      el.style.mixBlendMode = 'normal';
      el.style.opacity = '0.6';
    }

    setThemeClass();

    // Observar cambios de clase para modo oscuro
    const mo = new MutationObserver(setThemeClass);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // Pointer events with passive to avoid blocking main thread
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mouseenter', onEnter, { passive: true });
    window.addEventListener('mouseleave', onLeave, { passive: true });
  }

  // Disable if user prefers reduced motion
  if (!prefersReduced) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initGlow, { once: true });
    } else {
      initGlow();
    }
  } else {
    const el = ensureGlowEl();
    if (el) el.style.display = 'none';
  }
})();

// Syntax detection
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
    showNotification(`🔍 Detected: ${detectedLanguages.join(', ')}`, "success");
  } else {
    showNotification("📝 Plain text detected", "success");
  }
};

// Drag & drop files
document.addEventListener("DOMContentLoaded", () => {
  const textArea = document.querySelector("textarea");
  if (!textArea) return;

  // Drag & drop handlers
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
  // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showNotification("❌ File too large (max 10MB)", "error");
        return;
      }

  // Validate file type
      const allowedTypes = ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json', 'text/markdown'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|html|css|js|json|md|py|sql|xml)$/i)) {
        showNotification("❌ Unsupported file type", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const appElement = document.querySelector("[x-data]");
        if (appElement && appElement.__x) {
          const appData = appElement.__x.$data;
          appData.text = e.target.result;
          if (window.TextStore) { window.TextStore.set(appData.text); } else { try { localStorage.setItem("text", appData.text); } catch {} }
          appData.updateStats();
          appData.saveToHistory();
          showNotification(`📄 File "${file.name}" loaded!`, "success");
        }
      };
      reader.onerror = () => {
        showNotification("❌ Error reading file", "error");
      };
      reader.readAsText(file);
    }
  });
  
  setTimeout(() => {
    initFeatures();
  }, 100);
});

function initFeatures() {
  // Debounced auto-save
  let autoSaveTimeout;
  function debouncedAutoSave(text) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
  if (window.TextStore) { window.TextStore.set(text); } else { try { localStorage.setItem('text', text); } catch {} }
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
    // Prevent browser shortcuts that might interfere
    if ((e.ctrlKey || e.metaKey) && ['s', 'f', 'z', 'y'].includes(e.key)) {
      e.preventDefault();
    }
  });
}

// (Removed) Unused readability helper to keep bundle lean

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('notification-container')) {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-none space-y-3 max-w-sm';
    document.body.appendChild(container);
  }
});

// Set footer year on load
try {
  const y = document.getElementById('current-year');
  if (y) y.textContent = new Date().getFullYear();
} catch {}

// Keyboard: Ctrl/Cmd+F toggles search panel in-app
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

// Expose Utils for convenience
if (window.Utils) {
  window.debounce = window.Utils.debounce;
  window.throttle = window.Utils.throttle;
}

// Exportar funciones globales
window.showNotification = showNotification;
window.detectSyntax = detectSyntax;