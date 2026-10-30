// Thẻ hiển thị thông tin từng chi nhánh
(function (window) {
  'use strict';

  const BranchCard = {
    // ---------------------------------------------------------------------
    // CHUẨN HOÁ TRẠNG THÁI MỞ CỬA THEO THỜI GIAN THỰC
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
    // CHUẨN HOÁ DỮ LIỆU ĐẦU VÀO
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
        id === 'CN01'
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
      const rawImage = b.image || b.HinhAnh || '';
      const image = (typeof window.SalonUtils !== 'undefined' && typeof window.SalonUtils.formatImageUrl === 'function')
        ? window.SalonUtils.formatImageUrl(rawImage)
        : (rawImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80');

      const opStatus = this.getOperatingStatus(hours);

      // URL Google Maps tìm kiếm trực tiếp địa chỉ chính xác
      const mapQuery = `${shortName}, ${address}`;
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

      const cleanSubtitle = (subtitle && !subtitle.toLowerCase().includes('khu vực'))
        ? subtitle
        : 'Cơ Sở Barbershop';

      return {
        id,
        shortName,
        subtitle: cleanSubtitle,
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
    // RENDER BRANCH CARD
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
                 onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80');">
            
            <!-- Huy hiệu quận -->
            <div class="branch-badges-top">
              <span class="branch-district-tag">${data.district}</span>
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
              

              <h3 class="branch-name-title font-serif tracking-tight leading-tight" title="${data.shortName}">
                ${data.shortName}
              </h3>

              <!-- THÔNG TIN ĐỊA CHỈ & LIÊN HỆ (LUCIDE SVG STROKE 1.5) -->
              <div class="branch-info-list">
                <div class="branch-info-row">
                  <span class="info-icon" style="color: var(--brand-accent, #C59B27); display: inline-flex; align-items: center; margin-top: 2px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <span class="info-text branch-address-val">${data.address}</span>
                </div>

                <div class="branch-info-row">
                  <span class="info-icon" style="color: var(--brand-accent, #C59B27); display: inline-flex; align-items: center; margin-top: 2px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </span>
                  <span class="info-text">Giờ mở cửa: <strong>${data.hours}</strong></span>
                </div>

                <div class="branch-info-row">
                  <span class="info-icon" style="color: var(--brand-accent, #C59B27); display: inline-flex; align-items: center; margin-top: 2px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </span>
                  <span class="info-text">Hotline: <a href="tel:${data.phone}" class="branch-phone-link">${data.phone}</a></span>
                </div>
              </div>
            </div>

            <!-- HÀNH ĐỘNG THỰC TẾ: CHỈ ĐƯỜNG & ĐẶT LỊCH HẸN -->
            <div class="branch-actions-row">
              <a href="${data.mapUrl}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="branch-map-btn" 
                 title="Mở bản đồ Google Maps chỉ đường đến chi nhánh này">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                <span>Chỉ Đường</span>
              </a>

              <button type="button"
                      class="branch-book-btn"
                      onclick="${onBookClick}">
                <span>Đặt Lịch</span>
                <span>→</span>
              </button>
            </div>

          </div>

        </article>
      `;
    },

    // ---------------------------------------------------------------------
    // SKELETON LOADING STATE, Khớp 100% kích thước của Card Chi Nhánh
    // ---------------------------------------------------------------------
    renderSkeleton(count = 3) {
      const items = Array.from({ length: count });
      return items.map(() => `
        <div class="branch-clean-card skeleton-card" aria-hidden="true">
          <div class="branch-media-box skeleton-box" style="aspect-ratio: 16 / 10; height: auto;"></div>
          <div class="branch-content-body" style="gap: 12px;">
            <div class="skeleton-box" style="width: 80%; height: 22px; border-radius: 4px;"></div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin: 8px 0 16px;">
              <div class="skeleton-box" style="width: 95%; height: 14px; border-radius: 4px;"></div>
              <div class="skeleton-box" style="width: 60%; height: 14px; border-radius: 4px;"></div>
              <div class="skeleton-box" style="width: 50%; height: 14px; border-radius: 4px;"></div>
            </div>
            <div class="branch-actions-row">
              <div class="skeleton-box" style="height: 42px; border-radius: 8px;"></div>
              <div class="skeleton-box" style="height: 42px; border-radius: 8px;"></div>
            </div>
          </div>
        </div>
      `).join('');
    },

    // ---------------------------------------------------------------------
    // EMPTY STATE
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
