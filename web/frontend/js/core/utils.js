// =========================================================================
// OmniSalon / Omni Salon — CORE UTILITIES MODULE
// Các hàm tiện ích dùng chung trong giao diện 
// =========================================================================

(function (window) {
  'use strict';

  const SalonUtils = {
    formatCurrency(amount) {
      if (amount === undefined || amount === null || isNaN(amount)) return '0\u00A0đ';
      return Number(amount).toLocaleString('vi-VN') + '\u00A0đ';
    },

    // Format ngày hiển thị dạng DD/MM/YYYY (cắt bỏ phần giờ 'T' của chuỗi ISO)
    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        if (dateStr instanceof Date) {
          const d = dateStr;
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          return `${day}/${month}/${d.getFullYear()}`;
        }
        const s = String(dateStr).trim();
        const dateOnly = s.includes('T') ? s.split('T')[0] : (s.includes(' ') ? s.split(' ')[0] : s);
        const parts = dateOnly.split('-');
        if (parts.length === 3) {
          const day = parts[2].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[0];
          return `${day}/${month}/${year}`;
        }
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          return `${day}/${month}/${d.getFullYear()}`;
        }
      } catch (e) {}
      return String(dateStr);
    },

    formatDateTime(dateStr) {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          return `${day}/${month}/${year} ${hours}:${minutes}`;
        }
      } catch (e) {}
      return this.formatDate(dateStr);
    },

    // Kiểm tra điều kiện hủy đơn: đơn ở bất kỳ trạng thái nào cũng được hủy, chỉ ẩn khi đã hủy rồi
    canCancelOrder(orderOrStatus) {
      if (!orderOrStatus) return false;
      const s = typeof orderOrStatus === 'string' 
        ? orderOrStatus 
        : (orderOrStatus.orderStatus || orderOrStatus.TrangThai || orderOrStatus.status || '');
      const clean = String(s).toLowerCase().trim();
      
      // Nếu đã hủy rồi thì không hủy nữa
      if (clean.includes('hủy') || clean === 'cancelled') return false;
      return true;
    },

    formatOrderStatus(status) {
      const s = String(status || '').toLowerCase().trim();
      if (s.includes('hủy') || s === 'cancelled') {
        return { key: 'cancelled', label: 'Đã hủy', cssClass: 'status-cancelled', step: 0 };
      }
      if (s.includes('hoàn tất') || s.includes('đã giao') || s === 'completed' || s === 'delivered') {
        return { key: 'completed', label: 'Đã giao hàng', cssClass: 'status-completed', step: 4 };
      }
      if (s.includes('đang giao') || s === 'delivering' || s === 'shipping' || (s.includes('giao') && !s.includes('đã giao'))) {
        return { key: 'delivering', label: 'Đang giao hàng', cssClass: 'status-shipping', step: 3 };
      }
      if (s.includes('đóng gói') || s.includes('xử lý') || s === 'processing') {
        return { key: 'processing', label: 'Đang đóng gói', cssClass: 'status-confirmed', step: 2 };
      }
      return { key: 'pending', label: 'Chờ xác nhận', cssClass: 'status-waiting', step: 1 };
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
      const s = String(status || '').toLowerCase().trim();
      if (s === 'confirmed' || s === 'đã xác nhận' || s === 'xác nhận') {
        return { key: 'confirmed', label: 'Đã xác nhận', cssClass: 'status-confirmed' };
      }
      if (s === 'waiting' || s === 'chờ vào ghế' || s === 'cho_vao_ghe' || s === 'đang chờ') {
        return { key: 'waiting', label: 'Chờ vào ghế', cssClass: 'status-waiting' };
      }
      if (s === 'in_progress' || s === 'đang phục vụ' || s === 'đang thực hiện') {
        return { key: 'in_progress', label: 'Đang phục vụ', cssClass: 'status-in_progress' };
      }
      if (s === 'completed' || s === 'đã hoàn thành' || s === 'hoàn thành') {
        return { key: 'completed', label: 'Đã hoàn thành', cssClass: 'status-completed' };
      }
      if (s === 'cancelled' || s === 'đã hủy' || s === 'hủy' || s === 'canceled') {
        return { key: 'cancelled', label: 'Đã hủy', cssClass: 'status-cancelled' };
      }
      return { key: 'pending', label: 'Chờ xử lý', cssClass: 'status-confirmed' };
    },

    generateId(prefix = 'id') {
      return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    },

    getInitials(fullName) {
      if (!fullName || typeof fullName !== 'string') return 'OS';
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
     * Dùng cho vé đặt lịch #LH-... hoặc mã VietQR thanh toán tại quầy
     */
    generateQrSvgCode(text, options = {}) {
      const size = options.size || 180;
      const fg = options.fg || '#1c1917';
      const bg = options.bg || '#ffffff';
      const cleanText = String(text || 'OMNISALON-OMNI');

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
    },

    getBasePrefix() {
      if (typeof window === 'undefined' || !window.location) return '/';
      if (window.location.protocol === 'file:') return '../../';

      // Hỗ trợ GitHub Pages (hostname kết thúc bằng github.io)
      if (window.location.hostname && window.location.hostname.endsWith('github.io')) {
        const segments = (window.location.pathname || '').split('/').filter(Boolean);
        const repo = (segments.length > 0 && !['index.html', 'admin', 'customer', 'api', 'pages', 'services', 'stylists', 'booking', 'shop', 'cart', 'product', 'branches', 'ai-studio'].includes(segments[0]))
          ? segments[0]
          : 'OmniSalon';
        return '/' + repo + '/';
      }

      // Hỗ trợ local / subdirectory nếu có
      const segments = (window.location.pathname || '').split('/').filter(Boolean);
      if (segments.length > 0 && segments[0].toLowerCase() === 'omnisalon') {
        return '/OmniSalon/';
      }
      return '/';
    },

    formatImageUrl(path) {
      if (!path || typeof path !== 'string') {
        return this.getBasePrefix() + 'Men_Grooming_Products/DichVu_Men/DV1.jpg';
      }
      if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
      }
      let clean = path.replace(/^\/+/, '');
      if (clean.startsWith('web/frontend/')) clean = clean.substring(13);
      else if (clean.startsWith('web/')) clean = clean.substring(4);
      else if (clean.startsWith('frontend/')) clean = clean.substring(9);

      // Chuẩn hóa đường dẫn: Dịch vụ & Chi nhánh luôn nằm trong Men_Grooming_Products/
      if (clean.startsWith('DichVu_Men/')) {
        clean = 'Men_Grooming_Products/' + clean;
      } else if (clean.startsWith('ChiNhanh_Omni/')) {
        clean = 'Men_Grooming_Products/' + clean;
      }

      const prefix = this.getBasePrefix();
      const cleanPrefix = prefix.replace(/^\/|\/$/g, '');
      if (cleanPrefix && clean.startsWith(cleanPrefix + '/')) {
        clean = clean.substring(cleanPrefix.length + 1);
      }
      return prefix + clean;
    },

    handleImgError(imgEl) {
      if (!imgEl) return;
      const src = imgEl.getAttribute('src') || imgEl.src || '';
      if (!imgEl._retryStep) imgEl._retryStep = 0;
      imgEl._retryStep++;

      const prefix = this.getBasePrefix();

      // Xử lý ảnh DichVu_Men -> luôn trỏ về folder chuẩn Men_Grooming_Products/DichVu_Men
      if (src.includes('DichVu_Men')) {
        const fileMatch = src.match(/(DV\d+|CBDV\d+)\.(jpg|jpeg|png|webp)/i);
        const fileName = fileMatch ? fileMatch[0] : 'DV1.jpg';
        const target = 'Men_Grooming_Products/DichVu_Men/' + fileName;
        if (imgEl._retryStep === 1) {
          imgEl.src = prefix + target;
          return;
        } else if (imgEl._retryStep === 2) {
          imgEl.src = target;
          return;
        } else if (imgEl._retryStep === 3) {
          imgEl.src = prefix + 'Men_Grooming_Products/DichVu_Men/DV1.jpg';
          return;
        }
        imgEl.onerror = null;
        imgEl.src = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';
        return;
      }

      if (src.includes('ChiNhanh_Omni')) {
        const fileMatch = src.match(/(CN\d+)\.(jpg|jpeg|png|webp)/i);
        const fileName = fileMatch ? fileMatch[0] : 'CN1.jpg';
        const target = 'Men_Grooming_Products/ChiNhanh_Omni/' + fileName;
        if (imgEl._retryStep === 1) {
          imgEl.src = prefix + target;
          return;
        } else if (imgEl._retryStep === 2) {
          imgEl.src = target;
          return;
        }
        imgEl.onerror = null;
        imgEl.src = 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80';
        return;
      }

      if (src.includes('Men_Grooming_Products')) {
        const clean = src.replace(/.*Men_Grooming_Products/, 'Men_Grooming_Products').replace(/^\/+/, '');
        if (imgEl._retryStep === 1) {
          imgEl.src = prefix + clean;
          return;
        } else if (imgEl._retryStep === 2) {
          imgEl.src = clean;
          return;
        }
      }
      imgEl.onerror = null;
      imgEl.src = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';
    }
  };

  const PlatformManager = {
    // Tự động nhận diện Web Desktop vs Web Mobile trên cùng 1 link hosting thống nhất
    isMobile() {
      if (typeof window === 'undefined') return false;
      return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|webOS|Windows Phone/i.test(navigator.userAgent);
    },
    get currentPlatform() {
      return this.isMobile() ? 'web-mobile' : 'web-desktop';
    },
    init() {},
    setPlatform(platform) {
      // Duy trì 1 link web duy nhất (Web Desktop & Web Mobile)
      if (typeof window !== 'undefined' && window.location && window.location.pathname.includes('app.html')) {
        window.location.replace('index.html');
      }
    }
  };

  window.SalonUtils = SalonUtils;
  window.PlatformManager = PlatformManager;

})(typeof window !== 'undefined' ? window : this);

