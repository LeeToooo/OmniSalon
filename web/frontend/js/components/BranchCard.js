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
        imagePosition: b.imagePosition || 'center',
        imageZoom: Number(b.imageZoom || 1),
        imageFit: b.imageFit || 'cover',
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
        onBookClick = `BranchesPage.selectBranchAndBook ? BranchesPage.selectBranchAndBook('${data.id}') : null`,
        showAdminControls = false
      } = options;

      const adminFloatBarHtml = showAdminControls ? `
        <div class="branch-photo-float-bar">
          <button type="button" class="btn-float-ctrl" onclick="AdminWeb.nudgeBranchImage('left')" title="Dịch trái (X -5%)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button type="button" class="btn-float-ctrl" onclick="AdminWeb.nudgeBranchImage('up')" title="Dịch lên (Y -5%)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
          </button>
          <button type="button" class="btn-float-ctrl" onclick="AdminWeb.nudgeBranchImage('down')" title="Dịch xuống (Y +5%)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <button type="button" class="btn-float-ctrl" onclick="AdminWeb.nudgeBranchImage('right')" title="Dịch phải (X +5%)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          <span class="float-ctrl-sep"></span>

          <button type="button" class="btn-float-ctrl" onclick="AdminWeb.stepBranchZoom(-0.1)" title="Thu nhỏ (-10%)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button type="button" class="btn-float-ctrl" onclick="AdminWeb.stepBranchZoom(0.1)" title="Phóng to (+10%)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>

          <span class="float-ctrl-sep"></span>

          <button type="button" class="btn-float-ctrl" onclick="AdminWeb.resetBranchImageAdjustments()" title="Đặt lại mặc định">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      ` : '';

      return `
        <article class="branch-clean-card" id="branchCard_${data.id}" data-branch-id="${data.id}">
          
          <!-- HINH ANH MAT TIEN SALON O TREN -->
          <div class="branch-media-box">
            <img src="${data.image}" 
                 alt="${data.shortName}" 
                 loading="lazy" 
                 class="branch-cover-img"
                 style="object-position: ${data.imagePosition || 'center'}; transform-origin: ${data.imagePosition || '50% 50%'}; ${data.imageZoom && data.imageZoom !== 1 ? 'transform: scale(' + data.imageZoom + ') !important;' : ''} transition: transform 0.12s ease-out, object-position 0.12s ease-out;"
                 onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80');">
            
            <!-- Huy hieu quan -->
            <div class="branch-badges-top">
              <span class="branch-district-tag">${data.district}</span>
            </div>

            <!-- Trang thai hoat dong thoi gian thuc -->
            <div class="branch-status-floating ${data.opStatus.badgeClass}">
              <span class="status-indicator-dot"></span>
              <span>${data.opStatus.label} • ${data.opStatus.subtext}</span>
            </div>

            ${adminFloatBarHtml}
          </div>

          <!-- NOI DUNG CHI TIET CHI NHANH O DUOI (CHUAN TASTE-SKILL, KHONG DUNG ICON AI) -->
          <div class="branch-content-body">
            <div>
              <h3 class="branch-name-title font-serif tracking-tight leading-tight" title="${data.shortName}">
                ${data.shortName}
              </h3>

              <div class="branch-meta-specs">
                <div class="branch-meta-item">
                  <span class="meta-label">Địa chỉ</span>
                  <span class="meta-value branch-address-val">${data.address}</span>
                </div>

                <div class="branch-meta-item">
                  <span class="meta-label">Giờ mở cửa</span>
                  <span class="meta-value"><strong>${data.hours}</strong></span>
                </div>

                <div class="branch-meta-item">
                  <span class="meta-label">Hotline</span>
                  <span class="meta-value">
                    <a href="tel:${data.phone}" class="branch-phone-link">${data.phone}</a>
                  </span>
                </div>
              </div>
            </div>

            <!-- HANH DONG THUC TE: DAT LICH HEN & CHI DUONG (KHONG ICON AI THUA THAI) -->
            <div class="branch-actions-row">
              <button type="button"
                      class="branch-book-btn"
                      onclick="${onBookClick}">
                Đặt Lịch Hẹn
              </button>

              <a href="${data.mapUrl}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="branch-map-btn" 
                 title="Mở bản đồ Google Maps chỉ đường đến chi nhánh này">
                Chỉ Đường
              </a>
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
