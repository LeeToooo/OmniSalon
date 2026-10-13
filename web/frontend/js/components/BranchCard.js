// =========================================================================
// Omni Salon — BRANCH CARD ATOMIC COMPONENT (Product Design Standard)
// Kiến trúc Clean Architecture: Tách rời UI, Micro-interactions & State
// Bố cục Thực Tế: Giờ mở cửa cụ thể, Nút chỉ đường Google Maps, CTA phẳng
// =========================================================================

(function (window) {
  'use strict';

  const BranchCard = {
    // ---------------------------------------------------------------------
    // 1. CHUẨN HOÁ TRẠNG THÁI MỞ CỬA THEO THỜI GIAN THỰC (Real-time Hours)
    // ---------------------------------------------------------------------
    getOperatingStatus(hoursString) {
      // Mặc định: 08:30 - 21:30
      let openHour = 8, openMin = 30;
      let closeHour = 21, closeMin = 30;

      if (hoursString && typeof hoursString === 'string' && hoursString.includes('-')) {
        const parts = hoursString.split('-').map(s => s.trim());
        if (parts[0]) {
          const [h, m] = parts[0].split(':').map(Number);
          if (!isNaN(h)) openHour = h;
          if (!isNaN(m)) openMin = m;
        }
        if (parts[1]) {
          const [h, m] = parts[1].split(':').map(Number);
          if (!isNaN(h)) closeHour = h;
          if (!isNaN(m)) closeMin = m;
        }
      }

      const now = new Date();
      const curMinutes = now.getHours() * 60 + now.getMinutes();
      const openTotal = openHour * 60 + openMin;
      const closeTotal = closeHour * 60 + closeMin;

      const pad = n => String(n).padStart(2, '0');
      const closeTimeFormatted = `${pad(closeHour)}:${pad(closeMin)}`;
      const openTimeFormatted = `${pad(openHour)}:${pad(openMin)}`;

      if (curMinutes >= openTotal && curMinutes < closeTotal) {
        return {
          isOpen: true,
          label: 'Đang mở cửa',
          subtext: `Đóng lúc ${closeTimeFormatted}`,
          badgeClass: 'status-open'
        };
      } else {
        return {
          isOpen: false,
          label: 'Tạm nghỉ',
          subtext: `Mở lúc ${openTimeFormatted}`,
          badgeClass: 'status-closed'
        };
      }
    },

    // ---------------------------------------------------------------------
    // 2. CHUẨN HOÁ DỮ LIỆU ĐẦU VÀO (Data Normalizer & Schema Safety)
    // ---------------------------------------------------------------------
    normalize(b) {
      if (!b) return null;

      const id = String(b.id || b.MaChiNhanh || '');
      const rawFullName = b.TenChiNhanh || b.name || 'Chi Nhánh Omni Salon';
      const parts = rawFullName.split('—');
      const shortName = (parts[0] || rawFullName).trim();
      const subtitle = parts[1] ? parts[1].trim() : '';

      const address = b.DiaChi || b.address || 'TP. Hồ Chí Minh';
      const phone = String(b.SoDienThoai || b.phone || '0901111222');
      const hours = b.hours || (b.GioMoCua && b.GioDongCua ? `${b.GioMoCua.substring(0, 5)} - ${b.GioDongCua.substring(0, 5)}` : '08:30 - 21:30');
      const totalChairs = Number(b.totalChairs || 16);
      const isFlagship = Boolean(
        (b.group && (b.group.includes('FLAGSHIP') || b.group.includes('PRESIDENTIAL'))) ||
        id === 'br-dbp' || id === 'CN01'
      );

      // Trích xuất quận
      let district = 'TP.HCM';
      if (typeof window.BranchesPage !== 'undefined' && typeof window.BranchesPage.getBranchDistrict === 'function') {
        district = window.BranchesPage.getBranchDistrict(b);
      } else {
        const m = address.match(/Quận\s*\d+|TP\.\s*Thủ\s*Đức|Bình\s*Thạnh|Gò\s*Vấp|Tân\s*Bình|Phú\s*Nhuận/i);
        if (m) district = m[0];
      }

      // Hình ảnh
      const image = (b.image && b.image.length > 5)
        ? b.image
        : 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';

      const opStatus = this.getOperatingStatus(hours);

      // URL Google Maps tìm kiếm trực tiếp địa chỉ chính xác
      const mapQuery = `${shortName}, ${address}`;
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

      return {
        id,
        shortName,
        subtitle: subtitle || `KHU VỰC ${district.toUpperCase()}`,
        address,
        district,
        phone,
        hours,
        totalChairs,
        isFlagship,
        image,
        opStatus,
        mapUrl
      };
    },

    // ---------------------------------------------------------------------
    // 3. RENDER BRANCH CARD (Clean Store Card — Flat CTA, No Glow)
    // ---------------------------------------------------------------------
    render(rawBranch, options = {}) {
      const data = this.normalize(rawBranch);
      if (!data) return '';

      const {
        onBookClick = `BranchesPage.selectBranchAndBook ? BranchesPage.selectBranchAndBook('${data.id}') : null`
      } = options;

      return `
        <article class="branch-clean-card" id="branchCard_${data.id}" data-branch-id="${data.id}">
          
          <!-- HÌNH ẢNH MẶT TIỀN SALON & HUY HIỆU TRẠNG THÁI -->
          <div class="branch-media-box">
            <img src="${data.image}" 
                 alt="${data.shortName}" 
                 loading="lazy" 
                 class="branch-cover-img"
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80';">
            
            <!-- Huy hiệu quận & Loại chi nhánh -->
            <div class="branch-badges-top">
              <span class="branch-district-tag">${data.district}</span>
              ${data.isFlagship ? `
                <span class="branch-flagship-tag">FLAGSHIP VIP</span>
              ` : ''}
            </div>

            <!-- Trạng thái hoạt động thời gian thực -->
            <div class="branch-status-floating ${data.opStatus.badgeClass}">
              <span class="status-indicator-dot"></span>
              <span>${data.opStatus.label} • ${data.opStatus.subtext}</span>
            </div>
          </div>

          <!-- NỘI DUNG CHI TIẾT CHI NHÁNH -->
          <div class="branch-content-body">
            <div>
              <div class="branch-eyebrow-row">
                <span class="branch-sub-label">${data.subtitle}</span>
                <span class="branch-chair-count">${data.totalChairs} Ghế cắt</span>
              </div>

              <h3 class="branch-name-title" title="${data.shortName}">
                ${data.shortName}
              </h3>

              <!-- THÔNG TIN ĐỊA CHỈ & LIÊN HỆ -->
              <div class="branch-info-list">
                <div class="branch-info-row">
                  <span class="info-text branch-address-val">${data.address}</span>
                </div>

                <div class="branch-info-row">
                  <span class="info-text">Giờ mở cửa: <strong>${data.hours}</strong></span>
                </div>

                <div class="branch-info-row">
                  <span class="info-text">Hotline: <a href="tel:${data.phone}" class="branch-phone-link">${data.phone}</a></span>
                </div>
              </div>
            </div>

            <!-- HÀNH ĐỘNG THỰC TẾ: CHỈ ĐƯỜNG & ĐẶT LỊCH HẸN -->
            <div class="branch-actions-row">
              <a href="${data.mapUrl}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="btn-flat-cta btn-flat-outline branch-map-btn" 
                 title="Mở bản đồ Google Maps chỉ đường đến chi nhánh này">
                <span>Chỉ Đường</span>
              </a>

              <button type="button"
                      class="btn-flat-cta btn-flat-primary branch-book-btn"
                      onclick="${onBookClick}">
                <span>Đặt Lịch Hẹn</span>
              </button>
            </div>

          </div>

        </article>
      `;
    },

    // ---------------------------------------------------------------------
    // 4. SKELETON LOADING STATE (Khớp 100% kích thước của Card Chi Nhánh)
    // ---------------------------------------------------------------------
    renderSkeleton(count = 3) {
      const items = Array.from({ length: count });
      return items.map(() => `
        <div class="branch-clean-card skeleton-card" aria-hidden="true">
          <div class="branch-media-box skeleton-box" style="height: 190px;"></div>
          <div class="branch-content-body" style="gap: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <div class="skeleton-box" style="width: 80px; height: 14px; border-radius: 4px;"></div>
              <div class="skeleton-box" style="width: 70px; height: 14px; border-radius: 4px;"></div>
            </div>
            <div class="skeleton-box" style="width: 80%; height: 22px; border-radius: 4px;"></div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin: 8px 0 16px;">
              <div class="skeleton-box" style="width: 95%; height: 14px; border-radius: 4px;"></div>
              <div class="skeleton-box" style="width: 60%; height: 14px; border-radius: 4px;"></div>
              <div class="skeleton-box" style="width: 50%; height: 14px; border-radius: 4px;"></div>
            </div>
            <div class="branch-actions-row">
              <div class="skeleton-box" style="width: 105px; height: 42px; border-radius: 8px;"></div>
              <div class="skeleton-box" style="flex: 1; height: 42px; border-radius: 8px;"></div>
            </div>
          </div>
        </div>
      `).join('');
    },

    // ---------------------------------------------------------------------
    // 5. EMPTY STATE
    // ---------------------------------------------------------------------
    renderEmptyState(options = {}) {
      const {
        title = 'Không tìm thấy chi nhánh phù hợp',
        description = 'Quý khách vui lòng thử tìm kiếm theo tên Quận khác (VD: Q.1, Bình Thạnh, Gò Vấp, Thủ Đức...) hoặc bấm "Tất Cả".',
        onReset = 'BranchesPage.setDistrict ? BranchesPage.setDistrict("all") : null'
      } = options;

      return `
        <div class="catalog-empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon-box">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <h3 class="empty-state-title">${title}</h3>
          <p class="empty-state-desc">${description}</p>
          <button type="button" class="btn-flat-cta btn-flat-primary" onclick="${onReset}">
            Xem Tất Cả Chi Nhánh
          </button>
        </div>
      `;
    }
  };

  // Xuất ra toàn cục
  window.BranchCard = BranchCard;

})(typeof window !== 'undefined' ? window : this);
