// Notification system
let notificationActive = false;

function showNotification(message, type = "success") {
  if (notificationActive) return;
  notificationActive = true;

  const container = document.getElementById("notification-container");
  const notification = document.createElement("div");
  notification.className = `px-4 py-2 rounded-lg shadow-lg m-2 transition-all duration-300 transform translate-y-0 opacity-100 ${type === "success" ? "bg-green-500" : "bg-red-500"} text-white`;
  notification.textContent = message;

  container.appendChild(notification);

  setTimeout(() => {
    notification.classList.replace("translate-y-0", "-translate-y-full");
    notification.classList.replace("opacity-100", "opacity-0");
  }, 2700);

  setTimeout(() => {
    container.removeChild(notification);
    notificationActive = false;
  }, 3000);
}

// Mouse glow effect
document.addEventListener("mousemove", (e) => {
  const glowEffect = document.getElementById("glow-effect");
  if (glowEffect) {
    glowEffect.style.setProperty("--mouse-x", `${e.clientX}px`);
    glowEffect.style.setProperty("--mouse-y", `${e.clientY}px`);
  }
});

// Enhanced syntax detection
window.detectSyntax = () => {
  const textArea = document.querySelector("textarea");
  if (!textArea || !textArea.value.trim()) {
    showNotification("ℹ️ Text cleared. No syntax detected.", "error");
    return;
  }

  const text = textArea.value;
  const syntaxPatterns = {
    html: { pattern: /<[^>]+>/, keywords: ["<div", "<p", "<html", "class=", "<body"] },
    javascript: { pattern: /function|const|let|var|=>|class/, keywords: ["function", "const", "let", "var", "if", "for"] },
    css: { pattern: /{[^}]*}/, keywords: ["{", "}", ":", ";", "@media", "px"] },
    python: { pattern: /def |class |import |if __/, keywords: ["def", "class", "import", "if", "print"] },
    sql: { pattern: /SELECT|INSERT|UPDATE|DELETE|CREATE TABLE/i, keywords: ["SELECT", "FROM", "WHERE", "INSERT", "DELETE"] }
  };

  for (const [lang, syntax] of Object.entries(syntaxPatterns)) {
    if (syntax.pattern.test(text) || syntax.keywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
      showNotification(`🔍 Detected ${lang.toUpperCase()} syntax!`, "success");
      return;
    }
  }
  showNotification("📝 No specific syntax detected", "success");
};

// File drag and drop
document.addEventListener("DOMContentLoaded", () => {
  const textArea = document.querySelector("textarea");
  if (!textArea) return;

  // Update copyright year
  document.getElementById("current-year").textContent = new Date().getFullYear();

  // Add event listener to button
  const detectButton = document.getElementById("detect-button");
  if (detectButton) {
    detectButton.addEventListener("click", detectSyntax);
  }

  // Drag and drop handlers
  textArea.addEventListener("dragenter", (e) => {
    e.preventDefault();
    textArea.classList.add("ring-2", "ring-blue-500/50");
  });

  textArea.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  textArea.addEventListener("dragleave", (e) => {
    e.preventDefault();
    textArea.classList.remove("ring-2", "ring-blue-500/50");
  });

  textArea.addEventListener("drop", (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    textArea.classList.remove("ring-2", "ring-blue-500/50");

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const appElement = document.querySelector("[x-data]");
        if (appElement && appElement.__x) {
          const appData = appElement.__x.$data;
          appData.text = e.target.result;
          localStorage.setItem("text", appData.text);
          appData.updateStats();
          showNotification(`📄 File "${file.name}" loaded!`, "success");
        }
      };
      reader.onerror = () => {
        showNotification("❌ Error reading file", "error");
      };
      reader.readAsText(file);
    }
  });
});