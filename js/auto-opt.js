// Auto Optimization Module (behaviour-driven, non-intrusive)
// No network calls, no external deps. TensorFlow backend is optional (stubbed).
(function () {
  const storeKey = 'autoopt_profile';
  const Safe = (window.Utils && window.Utils.SafeStorage) ? window.Utils.SafeStorage.local : {
    get: () => null, set: () => {}, remove: () => {}
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const Profile = {
    load() { return Safe.get(storeKey, { ver: 1, usage: {}, panels: {}, theme: { darkAtNight: 0, lightAtDay: 0 }, sessions: 0, suggestions: {} }); },
    save(p) { Safe.set(storeKey, p, /*ttl*/ 1000 * 60 * 60 * 24 * 30); }
  };

  const AutoOpt = {
    profile: null,
    _panelOpenSince: {},
    _backends: {},

    init() {
      this.profile = Profile.load();
      this.profile.sessions = (this.profile.sessions || 0) + 1;
      Profile.save(this.profile);
    },

    registerBackend(name, backend) { this._backends[name] = backend; },

    trackUsage(ev) {
      // ev: {group, action}
      try {
        if (!this.profile) this.init();
        const g = ev.group || 'unknown';
        const k = `${g}:${ev.action || 'any'}`;
        this.profile.usage[k] = (this.profile.usage[k] || 0) + 1;
        Profile.save(this.profile);
      } catch {}
    },

    trackPanel(panel, opened) {
      try {
        if (!this.profile) this.init();
        const now = Date.now();
        if (opened) {
          this._panelOpenSince[panel] = now;
        } else if (this._panelOpenSince[panel]) {
          const dt = now - this._panelOpenSince[panel];
          this._panelOpenSince[panel] = 0;
          const rec = this.profile.panels[panel] || { openMs: 0, opens: 0 };
          rec.openMs += dt; rec.opens += 1; this.profile.panels[panel] = rec;
          Profile.save(this.profile);
        }
      } catch {}
    },

    trackThemeChange(dark) {
      try {
        if (!this.profile) this.init();
        const hour = new Date().getHours();
        if (dark && (hour >= 19 || hour <= 6)) this.profile.theme.darkAtNight++;
        if (!dark && (hour >= 9 && hour <= 17)) this.profile.theme.lightAtDay++;
        Profile.save(this.profile);
      } catch {}
    },

    optimize() {
      // Simple rules + placeholder for ML backend
      const p = this.profile || Profile.load();
      const sugg = {};

      // Derive autosave: heavier use -> slower autosave to reduce churn
      const heavyOps = Object.entries(p.usage).filter(([k,v]) => /json|regex|diff|jwt|url|convert|codeFeature/.test(k)).reduce((a,[,v])=>a+v,0);
      sugg.autosaveMs = clamp(30000 + heavyOps * 200, 15000, 45000);

      // Prewarm: detect frequent json parsing
      const jsonOps = Object.entries(p.usage).filter(([k]) => /json/.test(k)).length;
      sugg.prewarmJSON = jsonOps >= 3;

      p.suggestions = sugg; Profile.save(p); this.profile = p;
      return sugg;
    },

    applyOptimizations(app) {
      try {
        const sugg = this.optimize();
        // Adjust autosave interval safely
        if (app && sugg.autosaveMs && typeof app.autoSaveInterval !== 'undefined') {
          try { if (app.autoSaveInterval) clearInterval(app.autoSaveInterval); } catch {}
          app.autoSaveInterval = setInterval(() => {
            try {
              const last = (typeof window.__hexaLastSavedText === 'string')
                ? window.__hexaLastSavedText
                : (window.TextStore ? window.TextStore.get() : localStorage.getItem('text'));
              if (app.text !== last) {
                if (window.TextStore) { window.TextStore.set(app.text); } else { try { localStorage.setItem('text', app.text); } catch {} }
                app.lastSaveTime = Date.now();
              }
            } catch {}
          }, sugg.autosaveMs);
        }
        // Prewarm JSON parse memo if applicable
        if (sugg.prewarmJSON && app && app.text && app._memo && app._memo.parseJSON) {
          try { app._memo.parseJSON(app.text); } catch {}
        }
      } catch {}
    }
  };

  // Optional TensorFlow backend (stub): will be used if available
  AutoOpt.registerBackend('tf', {
    enabled() { return !!(window.tf && window.tf.sequential); },
    // Dummy predict API for future extension
    predict(features) {
      return { autosaveMs: 30000, prewarmJSON: false };
    }
  });

  window.AutoOpt = AutoOpt;
})();
