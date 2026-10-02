/**
 * =========================================================================
 * Omni Salon — THEME ENGINE (DARK / LIGHT MODE CONTROLLER)
 * Tuân thủ: .antigravity/rules/04_refactor.md, 07_ponytail.md
 * Quản lý tập trung 2 chế độ:
 *  - 'dark': Obsidian Gold (#0B0D13 / #131722 / #D4AF37)
 *  - 'light': Nordic Clean Cream (#F8F9FA / #FFFFFF / #C59B27)
 * =========================================================================
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'omni_salon_theme';

  const ThemeEngine = {
    currentTheme: 'dark',

    init() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          this.currentTheme = saved;
        } else {
          // Mặc định ban đầu: Dark Obsidian Gold
          this.currentTheme = 'dark';
        }
      } catch (e) {
        this.currentTheme = 'dark';
      }

      this.applyTheme(this.currentTheme, false);
      this._bindDomReady();
    },

    getTheme() {
      return this.currentTheme;
    },

    setTheme(theme) {
      if (theme !== 'dark' && theme !== 'light') return;
      this.currentTheme = theme;
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {
        // LocalStorage fallback
      }
      this.applyTheme(theme, true);
    },

    toggleTheme() {
      const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(nextTheme);
      return nextTheme;
    },

    applyTheme(theme, dispatchEvent = true) {
      if (document.documentElement) {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'light') {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        }
      }
      if (document.body) {
        document.body.setAttribute('data-theme', theme);
        if (theme === 'light') {
          document.body.classList.add('light');
          document.body.classList.remove('dark');
        } else {
          document.body.classList.add('dark');
          document.body.classList.remove('light');
        }
      }

      // Cập nhật tất cả các nút Toggle Switch trên giao diện
      this.updateTogglesUI(theme);

      if (dispatchEvent && typeof window.CustomEvent === 'function') {
        window.dispatchEvent(new CustomEvent('omni:themechange', { detail: { theme } }));
      }
    },

    updateTogglesUI(theme) {
      // Cập nhật trạng thái các nút toggle Web & Mobile
      const toggles = document.querySelectorAll('.theme-toggle-btn');
      toggles.forEach(btn => {
        btn.setAttribute('aria-label', theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối');
        btn.setAttribute('title', theme === 'dark' ? 'Chế độ Tối (Obsidian Gold) - Bấm để chuyển Sáng' : 'Chế độ Sáng (Nordic Cream) - Bấm để chuyển Tối');
      });

      // Cập nhật Segmented Control (nếu có trong Mobile Profile / Settings)
      const segmentBtns = document.querySelectorAll('.theme-segment-btn');
      segmentBtns.forEach(seg => {
        const targetTheme = seg.getAttribute('data-target-theme');
        if (targetTheme === theme) {
          seg.classList.add('active');
        } else {
          seg.classList.remove('active');
        }
      });
    },

    _bindDomReady() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.applyTheme(this.currentTheme, false);
        });
      } else {
        this.applyTheme(this.currentTheme, false);
      }
    }
  };

  // Khởi chạy ngay lập tức khi file được nạp để tránh chớp trắng (FOUC)
  ThemeEngine.init();

  // Export toàn cục
  window.ThemeEngine = ThemeEngine;
})();
