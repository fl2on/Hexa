let activeNotifications = new Set();

function showNotification(message, type = "success") {
  // Prevenir notificaciones duplicadas
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
  
  // Estilos con gradientes
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
  
  // Estado inicial
  notification.style.transform = 'translateX(100%) scale(0.8)';
  notification.style.opacity = '0';

  // Agregar al contenedor
  container.appendChild(notification);
  
  // Animar entrada con efecto rebote
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0) scale(1)';
    notification.style.opacity = '1';
  });

  // Clic para descartar
  notification.addEventListener('click', () => {
    dismissNotification(notification, notificationKey);
  });

  // Auto-eliminar después del retraso
  setTimeout(() => {
    dismissNotification(notification, notificationKey);
  }, 4000);
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

// Efecto de linterna que sigue el mouse
let mouseGlowRAF = null;
let isMouseMoving = false;

function updateGlowEffect(e) {
  const glowEffect = document.getElementById("glow-effect");
  if (!glowEffect) return;
  
  // Detectar si está en modo oscuro
  const isDarkMode = document.body.classList.contains('dark') || 
                     document.querySelector('[x-data]')?.style.getPropertyValue('background').includes('#0A0A0A') ||
                     document.documentElement.classList.contains('dark');
  
  glowEffect.style.setProperty("--mouse-x", `${e.clientX}px`);
  glowEffect.style.setProperty("--mouse-y", `${e.clientY}px`);
  
  // Ajustar intensidad según el modo - ahora con luz blanca
  if (isDarkMode) {
    glowEffect.style.background = `radial-gradient(
      500px circle at ${e.clientX}px ${e.clientY}px,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.18) 25%,
      rgba(255, 255, 255, 0.12) 50%,
      rgba(255, 255, 255, 0.06) 70%,
      transparent 85%
    )`;
    glowEffect.style.mixBlendMode = 'overlay';
  } else {
    glowEffect.style.background = `radial-gradient(
      600px circle at ${e.clientX}px ${e.clientY}px,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.06) 40%,
      rgba(255, 255, 255, 0.03) 60%,
      transparent 80%
    )`;
    glowEffect.style.mixBlendMode = 'overlay';
  }
  
  glowEffect.style.opacity = "1";
}

document.addEventListener("mousemove", (e) => {
  if (mouseGlowRAF) return;
  
  isMouseMoving = true;
  
  mouseGlowRAF = requestAnimationFrame(() => {
    updateGlowEffect(e);
    mouseGlowRAF = null;
  });
  
  // Limpiar el timeout anterior
  clearTimeout(window.mouseStopTimeout);
  
  // Ocultar el efecto después de inactividad
  window.mouseStopTimeout = setTimeout(() => {
    isMouseMoving = false;
    const glowEffect = document.getElementById("glow-effect");
    if (glowEffect && !isMouseMoving) {
      glowEffect.style.opacity = "0.3";
    }
  }, 3000);
});

// Mostrar el efecto cuando el mouse entra en la ventana
document.addEventListener("mouseenter", () => {
  const glowEffect = document.getElementById("glow-effect");
  if (glowEffect) {
    glowEffect.style.opacity = "1";
  }
});

// Ocultar el efecto cuando el mouse sale de la ventana
document.addEventListener("mouseleave", () => {
  const glowEffect = document.getElementById("glow-effect");
  if (glowEffect) {
    glowEffect.style.opacity = "0";
  }
});

// Detección de sintaxis
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

// Arrastrar y soltar archivos
document.addEventListener("DOMContentLoaded", () => {
  const textArea = document.querySelector("textarea");
  if (!textArea) return;

  // Controladores de arrastrar y soltar
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
      // Verificar tamaño del archivo (límite 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showNotification("❌ File too large (max 10MB)", "error");
        return;
      }

      // Verificar tipo de archivo
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
          localStorage.setItem("text", appData.text);
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
  // Auto-guardado con debouncing
  let autoSaveTimeout;
  function debouncedAutoSave(text) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      localStorage.setItem('text', text);
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
    // Prevenir atajos del navegador que puedan interferir
    if ((e.ctrlKey || e.metaKey) && ['s', 'f', 'z', 'y'].includes(e.key)) {
      e.preventDefault();
    }
  });
}

// Utilidades de análisis de texto
function getReadabilityScore(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  if (sentences === 0 || words === 0) return 0;
  
  // Use syllable counting from TextAnalyzer
  const syllables = window.TextAnalyzer ? window.TextAnalyzer.countSyllables(text) : words;
  
  // Puntuación de facilidad de lectura Flesch
  const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Inicializar cuando el DOM esté listo
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