// =========================================================================
// Omni Salon — STYLISTS PAGE COMPONENT (ĐỘI NGŨ NGHỆ NHÂN TẠO MẪU)
// 100% Thuần Tiếng Việt • Full Sáng Dịu Mắt • Cân Bằng Thẻ Tuyệt Đối
// =========================================================================

(function (window) {
  'use strict';

  const StylistsPage = {
    selectedBranch: 'all',

    render(container, params = {}) {
      if (!container) return;

      if (params.branch) {
        this.selectedBranch = params.branch;
      }

      const branches = (window.store && typeof window.store.getBranches === 'function' && window.store.getBranches().length > 0)
        ? window.store.getBranches()
        : ((window.store && window.store.state && window.store.state.branches) || window.INITIAL_SALON_DATA?.branches || []);

      if (window.store && typeof window.store.subscribe === 'function' && !this._subscribed) {
        this._subscribed = true;
        window.store.subscribe((state, event) => {
          const container = document.getElementById('webMainContainer');
          if (container && (window.location.hash.includes('/stylists') || window.location.pathname.includes('/stylists'))) {
            StylistsPage.render(container);
          }
        });
      }

      const selectedBranchObj = branches.find(b => b.id === this.selectedBranch);
      const selectedBranchLabel = selectedBranchObj 
        ? (selectedBranchObj.TenChiNhanh || selectedBranchObj.name || '').replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '').replace(/^Q(\d+)\b/i, 'Quận $1').split('—')[0].trim()
        : 'Tất Cả Chi Nhánh';

      const allStylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const currentCount = this.selectedBranch === 'all' 
        ? allStylists.length 
        : allStylists.filter(s => s.branchId === this.selectedBranch || s.MaChiNhanh === this.selectedBranch).length;

      const oldModal = document.getElementById('branchBubblesModal');
      if (oldModal) oldModal.remove();

      container.innerHTML = `
        <div class="stylists-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 40px 0 80px;">
          <!-- Khung nội dung tràn viền 2 bên hiện đại -->
          <div style="max-width: 1640px; width: 100%; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); box-sizing: border-box;">
            <!-- Header Banner -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: clamp(28px, 4vw, 40px); font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin: 0 0 10px;">
                Đội Ngũ Stylist &amp; Thợ Cắt Tóc Chuyên Nghiệp
              </h1>
              <p style="font-size: 14.5px; color: var(--text-secondary); max-width: 720px; margin: 0 auto 24px; line-height: 1.6;">
                Đội ngũ thợ cắt tóc và stylist tay nghề cao, tận tâm tư vấn kiểu tóc chuẩn theo dáng mặt và phong cách riêng của từng khách hàng.
              </p>

              <!-- NÚT MỞ BONG BÓNG CHỌN CHI NHÁNH (POPUP BUBBLE SELECTOR) -->
              <div style="display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap;">
                <button type="button" class="btn-bubble-trigger" onclick="StylistsPage.openBubbleModal()"
                        style="display: inline-flex; align-items: center; gap: 10px; min-height: 42px; height: 42px; padding: 0 20px; border-radius: 10px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: none; transition: all 0.2s ease;">
                  <span>Chi Nhánh: <strong style="color: #D97706;">${selectedBranchLabel}</strong></span>
                  <span style="background: var(--surface-elevated); color: var(--text-primary); font-size: 11.5px; font-weight: 700; padding: 2px 8px; border-radius: 6px; border: 1px solid var(--border-color);">${currentCount} Thợ</span>
                  <span style="font-size: 11px; color: var(--text-secondary); margin-left: 2px;">▼ Chọn</span>
                </button>
                
                ${this.selectedBranch !== 'all' ? `
                  <button type="button" onclick="StylistsPage.filterBranch('all')"
                          style="display: inline-flex; align-items: center; gap: 6px; min-height: 42px; height: 42px; padding: 0 18px; border-radius: 10px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13.5px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;">
                    Xem Tất Cả Chi Nhánh
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Stylists Grid (Tràn viền 2 bên rộng thoáng, tự động lấp đầy 4-5 cột) -->
            <div id="stylistsProfilesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
              ${this.renderStylistCards()}
            </div>
          </div>
        </div>

        <!-- POPUP BONG BÓNG CHỌN CHI NHÁNH (BUBBLES MODAL) -->
        <div id="branchBubblesModal" onclick="if(event.target === this) StylistsPage.closeBubbleModal()" 
             style="display: none; position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 999999; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; max-width: 680px; width: 92%; padding: 28px 24px; box-shadow: none; position: relative; max-height: 85vh; overflow-y: auto; text-align: center; box-sizing: border-box; margin: auto;">
            <!-- Nút đóng -->
            <button onclick="StylistsPage.closeBubbleModal()" 
                    style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 6px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">
              ✕
            </button>

            <!-- Tiêu đề Popup -->
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px; border-radius: 9999px; background: var(--brand-accent-subtle); color: var(--brand-accent); font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">
              BẢNG BONG BÓNG KHU VỰC
            </div>
            <h3 style="font-size: 22px; font-weight: 900; color: var(--text-primary, #0f172a); margin: 0 0 8px;">
              Chọn Chi Nhánh Salon
            </h3>
            <p style="font-size: 14px; color: var(--text-secondary, #64748b); margin: 0 auto 24px; max-width: 520px; line-height: 1.5;">
              Nhấn vào bong bóng chi nhánh bất kỳ để lọc nhanh danh sách Stylist &amp; Thợ Cắt Tóc chuyên nghiệp tại cơ sở đó.
            </p>

            <!-- Lưới các bong bóng chi nhánh (Interactive Bubble Chips) -->
            <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; padding: 10px 0 20px;">
              <!-- Bong bóng 1: Tất Cả Chi Nhánh -->
              <button class="branch-bubble-item ${this.selectedBranch === 'all' ? 'active' : ''}" 
                      onclick="StylistsPage.selectBubbleBranch('all')"
                      style="padding: 12px 22px; border-radius: 9999px; font-size: 14px; font-weight: 800; cursor: pointer; border: 2px solid ${this.selectedBranch === 'all' ? 'var(--brand-accent, #b48312)' : 'var(--border-color, #cbd5e1)'}; background: ${this.selectedBranch === 'all' ? '#b48312' : 'var(--surface-elevated, #f8fafc)'}; color: ${this.selectedBranch === 'all' ? '#ffffff' : 'var(--text-primary, #0f172a)'}; box-shadow: none; display: inline-flex; align-items: center; gap: 6px;">
                Tất Cả Chi Nhánh (${branches.length})
              </button>

              <!-- Các bong bóng chi nhánh cụ thể -->
              ${branches.map(b => {
                const rawName = b.TenChiNhanh || b.name || '';
                const cleanBranch = rawName
                  .replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '')
                  .replace(/^Q(\d+)\b/i, 'Quận $1')
                  .split('—')[0]
                  .trim();
                const isSelected = this.selectedBranch === b.id;
                const stylistCountInBranch = allStylists.filter(s => s.branchId === b.id || s.MaChiNhanh === b.id).length;

                return `
                  <button class="branch-bubble-item ${isSelected ? 'active' : ''}" 
                          onclick="StylistsPage.selectBubbleBranch('${b.id}')"
                          style="padding: 11px 18px; border-radius: 9999px; font-size: 13.5px; font-weight: 700; cursor: pointer; border: 2px solid ${isSelected ? 'var(--brand-accent, #b48312)' : 'var(--border-color, #cbd5e1)'}; background: ${isSelected ? '#b48312' : 'var(--surface-elevated, #f8fafc)'}; color: ${isSelected ? '#ffffff' : 'var(--text-primary, #0f172a)'}; box-shadow: none; display: inline-flex; align-items: center; gap: 6px;">
                    <span>${cleanBranch}</span>
                    <span style="font-size: 11px; opacity: ${isSelected ? '1' : '0.8'}; font-weight: 800; background: ${isSelected ? 'rgba(255,255,255,0.25)' : 'var(--surface-card, #e2e8f0)'}; padding: 2px 7px; border-radius: 999px;">${stylistCountInBranch} thợ</span>
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Nút đóng nhanh dưới đáy -->
            <div style="margin-top: 14px; padding-top: 18px; border-top: 1px solid var(--border-color, #cbd5e1);">
              <button onclick="StylistsPage.closeBubbleModal()" 
                      style="padding: 10px 24px; border-radius: 12px; background: var(--surface-elevated, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); color: var(--text-primary, #0f172a); font-size: 13px; font-weight: 700; cursor: pointer;">
                Đóng Bảng Chọn
              </button>
            </div>
          </div>
        </div>
      `;
    },

    openBubbleModal() {
      let modal = document.getElementById('branchBubblesModal');
      if (modal) {
        if (modal.parentElement !== document.body) {
          document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    },

    closeBubbleModal() {
      const modal = document.getElementById('branchBubblesModal');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    },

    selectBubbleBranch(branchId) {
      this.closeBubbleModal();
      this.filterBranch(branchId);
    },

    filterBranch(branchId) {
      this.selectedBranch = branchId;
      const modal = document.getElementById('branchBubblesModal');
      if (modal) modal.remove();
      document.body.style.overflow = '';
      this.render(document.getElementById('webMainContainer'));
    },

    renderStylistCards() {
      const allStylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      let list = allStylists;
      if (this.selectedBranch !== 'all') {
        list = allStylists.filter(s => s.branchId === this.selectedBranch || s.MaChiNhanh === this.selectedBranch);
      }

      const portfolioSamples = [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
      ];

      return list.map((stylist, index) => {
        const rating = (stylist.rating !== undefined ? Number(stylist.rating) : 5.0).toFixed(1);
        const yearsExp = 6 + (index % 6);
        const specialties = Array.isArray(stylist.specialties) && stylist.specialties.length > 0
          ? stylist.specialties
          : ['Cắt Fade Nghệ Thuật', 'Uốn Textured Nam', 'Nhuộm Khói Nam', 'Tạo Kiểu Pomade'];

        const branchObj = (window.store && typeof window.store.getBranchById === 'function') 
          ? window.store.getBranchById(stylist.branchId) 
          : null;
        const branchName = branchObj 
          ? (branchObj.TenChiNhanh || branchObj.name).replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '').replace(/^Q(\d+)\b/i, 'Quận $1').split('—')[0].trim()
          : 'Omni Salon Flagship';

        const p1 = portfolioSamples[index % portfolioSamples.length];
        const p2 = portfolioSamples[(index + 1) % portfolioSamples.length];
        const p3 = portfolioSamples[(index + 2) % portfolioSamples.length];

        const cleanName = (stylist.name || stylist.HoTen || 'Stylist').trim();
        const isAssis = (stylist.role || '').toLowerCase().includes('phụ');
        const roleBadgeText = isAssis ? 'Thợ Phụ' : 'Thợ Chính';

        return `
          <div class="stylist-nordic-card" id="stylistCard_${stylist.id}">
            <div>
              <!-- Avatar Tròn Cân Đối Kèm Huy Hiệu Rating -->
              <div class="stylist-card-avatar-wrap">
                <img src="${stylist.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80'}"
                     class="stylist-card-avatar-img"
                     alt="${cleanName}"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';">
                <span class="stylist-card-rating-float">★ ${rating}</span>
              </div>

              <!-- Tên Stylist & Danh Hiệu -->
              <h3 class="stylist-card-name">${cleanName}</h3>

              <!-- Cấp Bậc & Chi Nhánh -->
              <div class="stylist-card-badge-row">
                <span class="stylist-card-role-pill">${roleBadgeText}</span>
                <span class="stylist-card-level-pill">${stylist.level || (isAssis ? 'Junior Barber' : 'Master Barber')}</span>
              </div>
              <div class="stylist-card-branch">
                <span>📍 ${branchName}</span>
              </div>

              <!-- Thanh Chỉ Số Hiệu Suất Cân Đối Giữa Card -->
              <div style="text-align: center;">
                <div class="stylist-card-metrics-pill">
                  <span>★ ${rating} (500+ lượt cắt)</span>
                  <span class="metric-sep">•</span>
                  <span>${yearsExp}+ năm kn</span>
                </div>
              </div>

              <!-- Thẻ Kỹ Thuật Chuyên Sâu Tinh Gọn -->
              <div class="stylist-card-tags-row">
                ${specialties.slice(0, 3).map(tag => `<span class="stylist-card-tag-pill">${tag}</span>`).join('')}
              </div>

              <!-- Bộ Sưu Tập Ảnh Tác Phẩm Cân Đối Đối Xứng -->
              <div class="stylist-card-portfolio-header">
                <span class="portfolio-line"></span>
                <span class="portfolio-title">MẪU TÓC TIÊU BIỂU</span>
                <span class="portfolio-line"></span>
              </div>
              <div class="stylist-card-gallery-grid">
                <img src="${p1}" class="stylist-card-gallery-img" alt="Mẫu tóc 1" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300';">
                <img src="${p2}" class="stylist-card-gallery-img" alt="Mẫu tóc 2" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300';">
                <img src="${p3}" class="stylist-card-gallery-img" alt="Mẫu tóc 3" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300';">
              </div>
            </div>

            <!-- Nút Đặt Lịch Trực Tiếp -->
            <button type="button" class="stylist-card-cta-btn" onclick="StylistsPage.bookWithStylist('${stylist.id}', '${stylist.branchId || ''}')">
              <span>✂️ Đặt Lịch Với ${cleanName.split(' ').pop()}</span>
            </button>
          </div>
        `;
      }).join('');
    },

    bookWithStylist(stylistId, branchId) {
      if (window.AppRouter) {
        window.AppRouter.navigate(`/booking?stylist=${stylistId}&branch=${branchId}`);
      } else if (window.BookingPage) {
        window.BookingPage.onSelectStylist(stylistId);
        window.location.hash = `#/booking?stylist=${stylistId}`;
      }
    }
  };

  window.StylistsPage = StylistsPage;

})(window);

