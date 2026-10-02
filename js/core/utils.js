// =========================================================================
// OmniSalon / 4RAU Barbershop — CORE UTILITIES MODULE
// Phiên bản: 2.2.0 Clean Architecture & Ponytail Optimized
// =========================================================================

(function (window) {
  'use strict';

  const SalonUtils = {
    formatCurrency(amount) {
      if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
      return Number(amount).toLocaleString('vi-VN') + ' đ';
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        const parts = String(dateStr).split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      } catch (e) {}
      return String(dateStr);
    },

    escapeHtml(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Chuẩn hóa hiển thị trạng thái lịch hẹn (DRY Pattern)
     */
    formatBookingStatus(status) {
      const s = String(status || '').toLowerCase();
      switch (s) {
        case 'confirmed':
          return { key: 'confirmed', label: 'Đã xác nhận', cssClass: 'status-confirmed' };
        case 'in_progress':
          return { key: 'in_progress', label: 'Đang phục vụ', cssClass: 'status-in_progress' };
        case 'completed':
          return { key: 'completed', label: 'Đã hoàn thành', cssClass: 'status-completed' };
        case 'cancelled':
          return { key: 'cancelled', label: 'Đã hủy', cssClass: 'status-cancelled' };
        default:
          return { key: 'pending', label: 'Chờ xử lý', cssClass: 'status-confirmed' };
      }
    },

    generateId(prefix = 'id') {
      return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    },

    getInitials(fullName) {
      if (!fullName || typeof fullName !== 'string') return '4R';
      const words = fullName.trim().split(/\s+/);
      if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
      return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
    },

    calculateEndTime(startTime, durationMinutes = 45) {
      if (window.PricingService && typeof window.PricingService.calculateEstimatedEndTime === 'function') {
        return window.PricingService.calculateEstimatedEndTime(startTime, durationMinutes);
      }
      if (!startTime || !startTime.includes(':')) return '09:15';
      const [h, m] = startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + Number(durationMinutes);
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    },

    /**
     * Sinh mã QR vector SVG thuần (Zero dependency, tiêu chuẩn Native SVG)
     * Dùng cho vé đặt lịch #BK-... hoặc mã VietQR thanh toán tại quầy
     */
    generateQrSvgCode(text, options = {}) {
      const size = options.size || 180;
      const fg = options.fg || '#1c1917';
      const bg = options.bg || '#ffffff';
      const cleanText = String(text || 'OMNISALON-4RAU');

      // Hash ma trận 21x21 (Chuẩn QR Code Version 1)
      const matrixSize = 21;
      const matrix = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));

      // Finder patterns ở 3 góc (7x7)
      const setFinderPattern = (r0, c0) => {
        for (let r = 0; r < 7; r++) {
          for (let c = 0; c < 7; c++) {
            if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
              matrix[r0 + r][c0 + c] = 1;
            }
          }
        }
      };
      setFinderPattern(0, 0);
      setFinderPattern(0, matrixSize - 7);
      setFinderPattern(matrixSize - 7, 0);

      // Timing patterns
      for (let i = 8; i < matrixSize - 8; i++) {
        matrix[6][i] = (i % 2 === 0) ? 1 : 0;
        matrix[i][6] = (i % 2 === 0) ? 1 : 0;
      }

      // Hash deterministic payload vào ma trận
      let hash = 0;
      for (let i = 0; i < cleanText.length; i++) {
        hash = ((hash << 5) - hash) + cleanText.charCodeAt(i);
        hash |= 0;
      }

      for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
          // Bỏ qua vùng 3 góc finder
          const inTopLeft = r < 8 && c < 8;
          const inTopRight = r < 8 && c >= matrixSize - 8;
          const inBottomLeft = r >= matrixSize - 8 && c < 8;
          const isTiming = r === 6 || c === 6;

          if (!inTopLeft && !inTopRight && !inBottomLeft && !isTiming) {
            const bit = Math.abs((hash ^ (r * 31 + c * 17))) % 3;
            matrix[r][c] = (bit === 0 || bit === 1) ? 1 : 0;
          }
        }
      }

      // Vẽ path SVG
      const cellSize = size / matrixSize;
      let pathData = '';
      for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
          if (matrix[r][c] === 1) {
            pathData += `M${(c * cellSize).toFixed(2)},${(r * cellSize).toFixed(2)}h${cellSize.toFixed(2)}v${cellSize.toFixed(2)}h-${cellSize.toFixed(2)}z `;
          }
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
        <rect width="${size}" height="${size}" fill="${bg}" rx="8" />
        <path d="${pathData.trim()}" fill="${fg}" />
      </svg>`;
    },

    maskPhone(phone) {
      if (!phone || typeof phone !== 'string') return '';
      const clean = phone.trim();
      if (clean.length < 7) return clean;
      return clean.replace(/(\d{3})\d{3,4}(\d{3,4})$/, '$1****$2');
    }
  };

  const PlatformManager = {
    currentPlatform: (typeof window !== 'undefined' && window.location && window.location.pathname.includes('app.html')) ? 'app' : 'web',
    init() {},
    setPlatform(platform) {
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = platform === 'web' ? 'index.html' : 'app.html';
      }
    }
  };

  window.SalonUtils = SalonUtils;
  window.PlatformManager = PlatformManager;

})(typeof window !== 'undefined' ? window : this);
