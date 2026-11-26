(function (window) {
  'use strict';

  const SalonUtils = {
    formatCurrency(amount) {
      if (amount === undefined || amount === null || isNaN(amount)) return '0\u00A0đ';
      return Number(amount).toLocaleString('vi-VN') + '\u00A0đ';
    },

    getLocalIsoDate(offsetDays = 0) {
      const d = new Date(Date.now() + Number(offsetDays || 0) * 86400000);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },

    // Format ngày hiển thị dạng DD/MM/YYYY, cắt bỏ phần giờ 'T' của chuỗi ISO
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

    formatDateTime(dateStr, withSeconds = false) {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          const sec = String(d.getSeconds()).padStart(2, '0');
          return withSeconds
            ? `${day}/${month}/${year} ${hours}:${minutes}:${sec}`
            : `${day}/${month}/${year} ${hours}:${minutes}`;
        }
      } catch (e) {}
      return this.formatDate(dateStr);
    },

    // Kiểm tra điều kiện hủy đơn: cấm hủy khi đang giao hàng, sẵn sàng tại quầy, đã hoàn tất hoặc đã hủy
    canCancelOrder(orderOrStatus) {
      if (!orderOrStatus) return false;
      const s = typeof orderOrStatus === 'string'
        ? orderOrStatus
        : (orderOrStatus.orderStatus || orderOrStatus.TrangThai || orderOrStatus.status || '');
      const clean = String(s).toLowerCase().trim();

      if (clean.includes('hủy') || clean === 'cancelled') return false;
      if (clean.includes('hoàn tất') || clean.includes('đã giao') || clean.includes('đã nhận') || clean === 'completed' || clean === 'delivered') return false;
      if (clean.includes('đang giao') || clean.includes('vận chuyển') || clean.includes('sẵn sàng') || clean === 'delivering' || clean === 'shipping' || clean === 'ready_for_pickup') return false;
      return true;
    },

    isPickupOrder(order) {
      if (!order || typeof order !== 'object') return false;
      const dt = String(order.deliveryType || order.receiveMethod || order.HinhThucNhan || '').toLowerCase();
      const addr = String(order.shippingAddress || order.DiaChiGiaoHang || '').toLowerCase();
      return dt.includes('pickup') || dt.includes('quầy') || addr.includes('quầy');
    },

    formatOrderStatus(status, isPickup = false) {
      const s = String(status || '').toLowerCase().trim();
      if (s.includes('hủy') || s === 'cancelled') {
        return { key: 'cancelled', label: 'Đã hủy', cssClass: 'status-cancelled', step: 0 };
      }
      if (s.includes('đã nhận') || s.includes('hoàn tất') || s.includes('đã giao') || s === 'completed' || s === 'delivered') {
        return {
          key: 'completed',
          label: isPickup ? 'Đã nhận tại quầy' : 'Hoàn tất',
          cssClass: 'status-completed',
          step: 4
        };
      }
      if (s.includes('sẵn sàng') || s === 'ready_for_pickup' || s.includes('đang giao') || s === 'delivering' || s === 'shipping' || (s.includes('giao') && !s.includes('đã giao'))) {
        return {
          key: 'delivering',
          label: (isPickup || s.includes('sẵn sàng')) ? 'Sẵn sàng tại quầy' : 'Đang giao hàng',
          cssClass: 'status-shipping',
          step: 3
        };
      }
      if (s.includes('chuẩn bị') || s.includes('đóng gói') || s.includes('xử lý') || s === 'processing') {
        return {
          key: 'processing',
          label: (isPickup || s.includes('chuẩn bị')) ? 'Đang chuẩn bị' : 'Đang đóng gói',
          cssClass: 'status-confirmed',
          step: 2
        };
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
     * Định dạng hiển thị trạng thái lịch hẹn
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
     * Tạo mã QR Code SVG chuẩn ISO/IEC 18004 (Model 2, Byte mode, ECC Level L) quét được bằng camera thật
     */
    generateQrSvgCode(text, options = {}) {
      const size = typeof options === 'number' ? options : (options.size || 180);
      const fg = (typeof options === 'object' && options.fg) ? options.fg : '#1c1917';
      const bg = (typeof options === 'object' && options.bg) ? options.bg : '#ffffff';
      const cleanText = String(text || 'OMNISALON-OMNI');

      let rawBytes;
      if (typeof TextEncoder !== 'undefined') {
        rawBytes = Array.from(new TextEncoder().encode(cleanText));
      } else {
        rawBytes = Array.from(unescape(encodeURIComponent(cleanText))).map(c => c.charCodeAt(0));
      }
      if (rawBytes.length > 134) rawBytes = rawBytes.slice(0, 134);

      const SPECS = [
        [1, 26, 1, 7],
        [2, 44, 1, 10],
        [3, 70, 1, 15],
        [4, 100, 1, 20],
        [5, 134, 1, 26],
        [6, 172, 2, 18]
      ];
      let spec = SPECS[SPECS.length - 1];
      for (const sp of SPECS) {
        const dataCwCap = sp[1] - sp[2] * sp[3];
        if (rawBytes.length + 2 <= dataCwCap) { spec = sp; break; }
      }
      const [ver, totalCw, numBlocks, ecLen] = spec;
      const dim = 17 + ver * 4;
      const totalDataCw = totalCw - numBlocks * ecLen;

      const bits = [];
      const pushBits = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
      pushBits(4, 4); // Byte mode
      pushBits(rawBytes.length, 8);
      for (const b of rawBytes) pushBits(b, 8);
      pushBits(0, Math.min(4, totalDataCw * 8 - bits.length));
      while (bits.length % 8 !== 0) bits.push(0);
      const dataCw = [];
      for (let i = 0; i < bits.length; i += 8) {
        let v = 0;
        for (let b = 0; b < 8; b++) v = (v << 1) | bits[i + b];
        dataCw.push(v);
      }
      const padBytes = [0xEC, 0x11];
      for (let p = 0; dataCw.length < totalDataCw; p++) dataCw.push(padBytes[p & 1]);

      const gfMul = (x, y) => {
        let z = 0;
        for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); if ((y >>> i) & 1) z ^= x; }
        return z;
      };
      let poly = [1];
      let root = 1;
      for (let i = 0; i < ecLen; i++) {
        const next = new Array(poly.length + 1).fill(0);
        for (let k = 0; k < poly.length; k++) {
          next[k] ^= poly[k];
          next[k + 1] ^= gfMul(poly[k], root);
        }
        poly = next;
        root = gfMul(root, 0x02);
      }
      const genPoly = poly.slice(1);
      const rsRemainder = (block) => {
        const rem = new Array(ecLen).fill(0);
        for (const b of block) {
          const factor = b ^ rem.shift();
          rem.push(0);
          for (let j = 0; j < ecLen; j++) rem[j] ^= gfMul(genPoly[j], factor);
        }
        return rem;
      };

      const dataBlocks = [];
      const ecBlocks = [];
      const shortLen = Math.floor(totalDataCw / numBlocks);
      let off = 0;
      for (let i = 0; i < numBlocks; i++) {
        const blk = dataCw.slice(off, off + shortLen);
        off += shortLen;
        dataBlocks.push(blk);
        ecBlocks.push(rsRemainder(blk));
      }
      const codewords = [];
      for (let i = 0; i < shortLen; i++) for (let b = 0; b < numBlocks; b++) codewords.push(dataBlocks[b][i]);
      for (let i = 0; i < ecLen; i++) for (let b = 0; b < numBlocks; b++) codewords.push(ecBlocks[b][i]);

      const modules = Array.from({ length: dim }, () => new Array(dim).fill(false));
      const isFunc = Array.from({ length: dim }, () => new Array(dim).fill(false));
      const setFn = (r, c, dark) => {
        if (r >= 0 && r < dim && c >= 0 && c < dim) { modules[r][c] = Boolean(dark); isFunc[r][c] = true; }
      };
      const drawFinder = (tr, tc) => {
        for (let dr = -1; dr <= 7; dr++) {
          for (let dc = -1; dc <= 7; dc++) {
            const dist = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
            setFn(tr + dr, tc + dc, dist !== 2 && dist !== 4);
          }
        }
      };
      drawFinder(0, 0);
      drawFinder(0, dim - 7);
      drawFinder(dim - 7, 0);
      for (let i = 0; i < dim; i++) {
        if (!isFunc[6][i]) setFn(6, i, i % 2 === 0);
        if (!isFunc[i][6]) setFn(i, 6, i % 2 === 0);
      }
      const ALIGN_POS = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] };
      const ap = ALIGN_POS[ver] || [];
      for (const r of ap) {
        for (const c of ap) {
          if (isFunc[r][c]) continue;
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              setFn(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
            }
          }
        }
      }
      for (let i = 0; i <= 8; i++) {
        if (i !== 6) { isFunc[8][i] = true; isFunc[i][8] = true; }
      }
      for (let i = 0; i < 8; i++) isFunc[8][dim - 1 - i] = true;
      for (let i = 0; i < 7; i++) isFunc[dim - 1 - i][8] = true;
      setFn(dim - 8, 8, true);

      const allBits = [];
      for (const cw of codewords) for (let b = 7; b >= 0; b--) allBits.push((cw >>> b) & 1);
      let bi = 0;
      for (let right = dim - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < dim; vert++) {
          for (let j = 0; j < 2; j++) {
            const x = right - j;
            const upward = ((right + 1) & 2) === 0;
            const y = upward ? dim - 1 - vert : vert;
            if (!isFunc[y][x] && bi < allBits.length) {
              modules[y][x] = allBits[bi] === 1;
              bi++;
            }
          }
        }
      }

      const applyFormat = (mIdx) => {
        const data = (1 << 3) | mIdx; // ECC Level L = 01
        let rem = data;
        for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        const fmt = ((data << 10) | rem) ^ 0x5412;
        const c1 = [
          [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
          [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
        ];
        const c2 = [
          [dim - 1, 8], [dim - 2, 8], [dim - 3, 8], [dim - 4, 8], [dim - 5, 8], [dim - 6, 8], [dim - 7, 8],
          [8, dim - 8], [8, dim - 7], [8, dim - 6], [8, dim - 5], [8, dim - 4], [8, dim - 3], [8, dim - 2], [8, dim - 1]
        ];
        for (let i = 0; i < 15; i++) {
          const bit = ((fmt >>> (14 - i)) & 1) !== 0;
          modules[c1[i][0]][c1[i][1]] = bit;
          modules[c2[i][0]][c2[i][1]] = bit;
        }
      };
      const maskCond = (k, r, c) => {
        switch (k) {
          case 0: return (r + c) % 2 === 0;
          case 1: return r % 2 === 0;
          case 2: return c % 3 === 0;
          case 3: return (r + c) % 3 === 0;
          case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
          case 5: return ((r * c) % 2 + (r * c) % 3) === 0;
          case 6: return (((r * c) % 2 + (r * c) % 3) % 2) === 0;
          default: return (((r + c) % 2 + (r * c) % 3) % 2) === 0;
        }
      };
      const toggleMask = (k) => {
        for (let r = 0; r < dim; r++) for (let c = 0; c < dim; c++) if (!isFunc[r][c] && maskCond(k, r, c)) modules[r][c] = !modules[r][c];
      };
      const scoreMask = () => {
        let pen = 0, darkCount = 0;
        for (let r = 0; r < dim; r++) {
          let run = 0, last = false;
          for (let c = 0; c < dim; c++) {
            const cur = modules[r][c];
            if (cur) darkCount++;
            if (c === 0 || cur !== last) { if (run >= 5) pen += 3 + (run - 5); run = 1; last = cur; } else run++;
          }
          if (run >= 5) pen += 3 + (run - 5);
        }
        for (let c = 0; c < dim; c++) {
          let run = 0, last = false;
          for (let r = 0; r < dim; r++) {
            const cur = modules[r][c];
            if (r === 0 || cur !== last) { if (run >= 5) pen += 3 + (run - 5); run = 1; last = cur; } else run++;
          }
          if (run >= 5) pen += 3 + (run - 5);
        }
        for (let r = 0; r < dim - 1; r++) {
          for (let c = 0; c < dim - 1; c++) {
            const cur = modules[r][c];
            if (cur === modules[r][c + 1] && cur === modules[r + 1][c] && cur === modules[r + 1][c + 1]) pen += 3;
          }
        }
        const pct = Math.abs(darkCount * 20 / (dim * dim) - 10);
        pen += Math.floor(pct) * 10;
        return pen;
      };

      let bestMask = 0, minPen = Infinity;
      for (let m = 0; m < 8; m++) {
        toggleMask(m);
        applyFormat(m);
        const pen = scoreMask();
        if (pen < minPen) { minPen = pen; bestMask = m; }
        toggleMask(m);
      }
      toggleMask(bestMask);
      applyFormat(bestMask);

      const border = 4;
      const totalMod = dim + border * 2;
      let pathData = '';
      for (let r = 0; r < dim; r++) {
        for (let c = 0; c < dim; c++) {
          if (modules[r][c]) pathData += `M${c + border},${r + border}h1v1h-1z`;
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalMod} ${totalMod}" width="${size}" height="${size}" shape-rendering="crispEdges">
        <rect width="${totalMod}" height="${totalMod}" fill="${bg}" rx="1.5" />
        <path d="${pathData}" fill="${fg}" />
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

      // Hỗ trợ GitHub Pages, hostname kết thúc bằng github.io
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
        return this.getBasePrefix() + 'DataPicture/DichVu_Men/DV1.jpg';
      }
      if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
      }
      let clean = path.replace(/^\/+/, '');
      if (clean.startsWith('web/frontend/')) clean = clean.substring(13);
      else if (clean.startsWith('web/')) clean = clean.substring(4);
      else if (clean.startsWith('frontend/')) clean = clean.substring(9);

      if (!clean.startsWith('DataPicture/')) {
        clean = 'DataPicture/' + clean;
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
      imgEl.onerror = null;
      const src = imgEl.getAttribute('src') || imgEl.src || '';
      const prefix = this.getBasePrefix();
      const cls = String(imgEl.className || '');
      const isProductCtx = (
        src.includes('Men_Grooming_Products') ||
        src.includes('/SP') ||
        cls.includes('pdp-') ||
        cls.includes('mini-cart') ||
        cls.includes('pos-item') ||
        cls.includes('product-') ||
        cls.includes('shop-card') ||
        Boolean(imgEl.closest && imgEl.closest('.pdp-main-stage, .pdp-thumb-item, .pdp-related-card, .mini-cart-item, .pos-item-card, .shop-product-card, .cart-item-row'))
      );

      if (src.includes('ChanDungTho') || src.includes('/Tho')) {
        imgEl.src = prefix + 'DataPicture/ChanDungTho/Tho1.jpg';
      } else if (src.includes('ChiNhanh_Omni') || src.includes('/CN')) {
        imgEl.src = prefix + 'DataPicture/ChiNhanh_Omni/CN1.jpg';
      } else if (isProductCtx) {
        imgEl.src = prefix + 'DataPicture/Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg';
      } else {
        imgEl.src = prefix + 'DataPicture/DichVu_Men/DV1.jpg';
      }
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
      // Duy trì 1 link web duy nhất, Web Desktop & Web Mobile
      if (typeof window !== 'undefined' && window.location && window.location.pathname.includes('app.html')) {
        window.location.replace('index.html');
      }
    }
  };

  window.SalonUtils = SalonUtils;
  window.PlatformManager = PlatformManager;

})(typeof window !== 'undefined' ? window : this);

