// Trang danh sách thợ cắt tóc
(function (window) {
  'use strict';

  const StylistsPage = {
    selectedBranch: 'all',
    currentPage: 1,
    pageSize: 8,

    render(container, params = {}) {
      if (!container) return;

      if (params.branch) {
        this.selectedBranch = params.branch;
      }
      if (params.page) {
        this.currentPage = parseInt(params.page, 10) || 1;
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
        ? (selectedBranchObj.TenChiNhanh || selectedBranchObj.name || '').replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '').replace(/^Q(\d+)\b/i, 'Quận $1').replace(/[–—]/g, '-').trim()
        : 'Tất Cả Chi Nhánh';

      const allStylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const filtered = this.selectedBranch === 'all'
        ? allStylists
        : allStylists.filter(s => s.branchId === this.selectedBranch || s.MaChiNhanh === this.selectedBranch);
      const currentCount = filtered.length;

      const oldModal = document.getElementById('branchBubblesModal');
      if (oldModal) oldModal.remove();

      container.innerHTML = `
        <div class="stylists-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 48px 0 88px;">
          <!-- Khung nội dung tràn viền toàn diện đồng bộ với Header -->
          <div class="services-fluid-container" style="width: 100%; max-width: 100%; margin: 0; padding: 0 clamp(20px, 3vw, 56px); box-sizing: border-box;">
            <!-- Header Banner -->
            <div style="text-align: center; margin-bottom: 40px;">
              <span class="tracking-widest" style="font-size: 11.5px; font-weight: 700; color: #C59B27; text-transform: uppercase; margin-bottom: 8px; display: inline-block;">
                ĐỘI NGŨ THỢ BARBER LÀNH NGHỀ
              </span>
              <h1 class="font-serif tracking-tight leading-tight" style="font-size: clamp(30px, 4.2vw, 44px); font-weight: 700; color: var(--text-primary); margin: 0 0 12px;">
                Thợ Cắt Tóc &amp; Chuyên Gia Tạo Mẫu
              </h1>
              <p style="font-size: 15px; color: var(--text-secondary); max-width: 680px; margin: 0 auto 28px; line-height: 1.6;">
                Tập hợp những tay kéo vững tay nghề, sắc sảo trong từng đường fade và thấu hiểu cấu trúc gương mặt để định hình phong cách riêng cho bạn.
              </p>

              <!-- NÚT MỞ BONG BÓNG CHỌN CHI NHÁNH (POPUP BUBBLE SELECTOR) -->
              <div style="display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap;">
                <button type="button" class="btn-bubble-trigger" onclick="StylistsPage.openBubbleModal()"
                        style="display: inline-flex; align-items: center; gap: 10px; min-height: 42px; height: 42px; padding: 0 20px; border-radius: 6px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: none; transition: all 0.2s ease;">
                  <span>Chi Nhánh: <strong style="color: #C59B27;">${selectedBranchLabel}</strong></span>
                  <span style="background: var(--surface-elevated); color: var(--text-primary); font-size: 11.5px; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-color);">${currentCount} Thợ</span>
                  <span style="font-size: 11px; color: var(--text-secondary); margin-left: 2px;">▼ Chọn</span>
                </button>
                
                ${this.selectedBranch !== 'all' ? `
                  <button type="button" onclick="StylistsPage.filterBranch('all')"
                          style="display: inline-flex; align-items: center; gap: 6px; min-height: 42px; height: 42px; padding: 0 18px; border-radius: 6px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13.5px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;">
                    Xem Tất Cả Chi Nhánh
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Stylists Grid (Khung hiển thị 4 cột tự kéo giãn đồng bộ trên mọi độ phân giải) -->
            <div id="stylistsProfilesGrid">
              ${this.renderStylistCards(filtered)}
            </div>

            <!-- PHÂN TRANG (COPY Y CHANG CỬA HÀNG - ĐỒNG BỘ 100%) -->
            <div id="stylistPaginationContainer">
              ${this.renderPagination(filtered)}
            </div>
          </div>
        </div>

        <!-- POPUP BONG BÓNG CHỌN CHI NHÁNH (BUBBLES MODAL) -->
        <div id="branchBubblesModal" onclick="if(event.target === this) StylistsPage.closeBubbleModal()" 
             style="display: none; position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); z-index: 999999; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; max-width: 680px; width: 92%; padding: 28px 24px; box-shadow: none; position: relative; max-height: 85vh; overflow-y: auto; text-align: center; box-sizing: border-box; margin: auto;">
            <!-- Nút đóng -->
            <button onclick="StylistsPage.closeBubbleModal()" 
                    style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 4px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">
              ✕
            </button>

            <!-- Tiêu đề Popup -->
            <div class="tracking-widest" style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 4px; background: rgba(197, 155, 39, 0.12); color: #C59B27; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">
              DANH SÁCH CHI NHÁNH
            </div>
            <h3 class="font-serif tracking-tight leading-tight" style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px;">
              Chọn Chi Nhánh Đặt Lịch
            </h3>
            <p style="font-size: 14px; color: var(--text-secondary); margin: 0 auto 24px; max-width: 520px; line-height: 1.5;">
              Nhấn vào chi nhánh bên dưới để lọc nhanh danh sách Barber &amp; Stylist trực tiếp phục vụ tại cơ sở đó.
            </p>

            <!-- Lưới các bong bóng chi nhánh (Interactive Bubble Chips) -->
            <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; padding: 10px 0 20px;">
              <!-- Bong bóng 1: Tất Cả Chi Nhánh -->
              <button class="branch-bubble-item ${this.selectedBranch === 'all' ? 'active' : ''}" 
                      onclick="StylistsPage.selectBubbleBranch('all')"
                      style="padding: 10px 20px; border-radius: 6px; font-size: 13.5px; font-weight: 700; cursor: pointer; border: 1px solid ${this.selectedBranch === 'all' ? '#C59B27' : 'var(--border-color)'}; background: ${this.selectedBranch === 'all' ? '#C59B27' : 'var(--surface-elevated)'}; color: ${this.selectedBranch === 'all' ? '#141413' : 'var(--text-primary)'}; box-shadow: none; display: inline-flex; align-items: center; gap: 6px;">
                Tất Cả Chi Nhánh (${branches.length})
              </button>

              <!-- Các bong bóng chi nhánh cụ thể -->
              ${branches.map(b => {
        const rawName = b.TenChiNhanh || b.name || '';
        const cleanBranch = rawName
          .replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '')
          .replace(/^Q(\d+)\b/i, 'Quận $1')
          .replace(/[–—]/g, '-')
          .trim();
        const isSelected = this.selectedBranch === b.id;
        const stylistCountInBranch = allStylists.filter(s => s.branchId === b.id || s.MaChiNhanh === b.id).length;

        return `
                  <button class="branch-bubble-item ${isSelected ? 'active' : ''}" 
                          onclick="StylistsPage.selectBubbleBranch('${b.id}')"
                          style="padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1px solid ${isSelected ? '#C59B27' : 'var(--border-color)'}; background: ${isSelected ? '#C59B27' : 'var(--surface-elevated)'}; color: ${isSelected ? '#141413' : 'var(--text-primary)'}; box-shadow: none; display: inline-flex; align-items: center; gap: 6px;">
                    <span>${cleanBranch}</span>
                    <span style="font-size: 11px; opacity: ${isSelected ? '1' : '0.85'}; font-weight: 800; background: ${isSelected ? 'rgba(20,20,19,0.15)' : 'var(--surface-card)'}; padding: 2px 6px; border-radius: 4px;">${stylistCountInBranch} thợ</span>
                  </button>
                `;
      }).join('')}
            </div>

            <!-- Nút đóng nhanh dưới đáy -->
            <div style="margin-top: 14px; padding-top: 18px; border-top: 1px solid var(--border-color);">
              <button onclick="StylistsPage.closeBubbleModal()" 
                      style="padding: 10px 24px; border-radius: 6px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13px; font-weight: 700; cursor: pointer;">
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
      this.currentPage = 1;
      const modal = document.getElementById('branchBubblesModal');
      if (modal) modal.remove();
      document.body.style.overflow = '';
      this.render(document.getElementById('webMainContainer'));
    },

    changePage(newPage) {
      const allStylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const filtered = this.selectedBranch === 'all'
        ? allStylists
        : allStylists.filter(s => s.branchId === this.selectedBranch || s.MaChiNhanh === this.selectedBranch);

      const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (newPage < 1 || newPage > totalPages) return;
      this.currentPage = newPage;
      this.refreshStylists();

      const grid = document.getElementById('stylistsProfilesGrid');
      if (grid) {
        const top = grid.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    },

    refreshStylists() {
      const allStylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const filtered = this.selectedBranch === 'all'
        ? allStylists
        : allStylists.filter(s => s.branchId === this.selectedBranch || s.MaChiNhanh === this.selectedBranch);

      const grid = document.getElementById('stylistsProfilesGrid');
      if (grid) {
        grid.innerHTML = this.renderStylistCards(filtered);
      }
      const pagination = document.getElementById('stylistPaginationContainer');
      if (pagination) {
        pagination.innerHTML = this.renderPagination(filtered);
      }
    },

    renderStylistCards(filtered) {
      if (!filtered) {
        const allStylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
        filtered = this.selectedBranch === 'all'
          ? allStylists
          : allStylists.filter(s => s.branchId === this.selectedBranch || s.MaChiNhanh === this.selectedBranch);
      }

      if (filtered.length === 0) {
        return `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--surface-card); border-radius: 8px; border: 1px solid var(--border-color);">
            <h3 class="font-serif" style="font-size: 20px; color: var(--text-primary); margin-bottom: 8px;">Không tìm thấy thợ tạo mẫu</h3>
            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">Chi nhánh này hiện chưa có thợ trong hệ thống hoặc đang cập nhật lịch làm việc.</p>
            <button type="button" class="btn-flat-cta btn-flat-outline" onclick="StylistsPage.filterBranch('all')">Xem Tất Cả Chi Nhánh</button>
          </div>
        `;
      }

      // Phân trang 8 thợ mỗi trang
      const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (this.currentPage > totalPages) this.currentPage = 1;
      const startIdx = (this.currentPage - 1) * this.pageSize;
      const paginated = filtered.slice(startIdx, startIdx + this.pageSize);

      const portfolioSamples = [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
      ];

      return paginated.map((stylist, index) => {
        const rating = (stylist.rating !== undefined ? Number(stylist.rating) : 5.0).toFixed(1);
        const yearsExp = 6 + (index % 6);
        const specialties = Array.isArray(stylist.specialties) && stylist.specialties.length > 0
          ? stylist.specialties
          : ['Fade Kỹ Thuật Cao', 'Tạo Kiểu Pomade', 'Cắt Kéo Texture', 'Cạo Khăn Nóng'];

        const branchObj = (window.store && typeof window.store.getBranchById === 'function')
          ? window.store.getBranchById(stylist.branchId)
          : null;
        const branchName = branchObj
          ? (branchObj.TenChiNhanh || branchObj.name).replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '').replace(/^Q(\d+)\b/i, 'Quận $1').replace(/[–—]/g, '-').trim()
          : 'Omni Salon Flagship';

        const p1 = portfolioSamples[index % portfolioSamples.length];
        const p2 = portfolioSamples[(index + 1) % portfolioSamples.length];
        const p3 = portfolioSamples[(index + 2) % portfolioSamples.length];

        const cleanName = (stylist.name || stylist.HoTen || 'Stylist').trim();
        const isAssis = (stylist.role || '').toLowerCase().includes('phụ');
        const roleBadgeText = isAssis ? 'Thợ Phụ' : 'Thợ Chính';

        return `
          <div class="stylist-nordic-card" id="stylistCard_${stylist.id}"
               style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 24px 20px 20px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; transition: transform 0.25s ease, border-color 0.25s ease;">
            <div>
              <!-- Avatar Tròn Cân Đối Kèm Huy Hiệu Rating -->
              <div class="stylist-card-avatar-wrap" style="position: relative; width: 96px; height: 96px; margin: 0 auto 14px;">
                <img src="${stylist.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80'}"
                     class="stylist-card-avatar-img"
                     style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);"
                     alt="${cleanName}"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';">
                <span class="stylist-card-rating-float" style="position: absolute; bottom: 0; right: 0; background: #C59B27; color: #141413; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 4px;">★ ${rating}</span>
              </div>

              <!-- Tên Stylist & Danh Hiệu -->
              <h3 class="font-serif tracking-tight leading-tight" style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px; text-align: center;">
                ${cleanName}
              </h3>

              <!-- Cấp Bậc & Chi Nhánh (Đã bỏ icon ghim 📍) -->
              <div class="stylist-card-badge-row" style="display: flex; gap: 6px; justify-content: center; margin-bottom: 8px;">
                <span class="stylist-card-role-pill" style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(197, 155, 39, 0.12); color: #C59B27;">${roleBadgeText}</span>
                <span class="stylist-card-level-pill" style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: var(--surface-elevated); color: var(--text-secondary); border: 1px solid var(--border-color);">${stylist.level || (isAssis ? 'Junior Barber' : 'Master Barber')}</span>
              </div>
              <div class="stylist-card-branch" style="font-size: 12.5px; color: var(--text-muted); text-align: center; margin-bottom: 12px;">
                <span>${branchName}</span>
              </div>

              <!-- Thanh Chỉ Số Hiệu Suất Cân Đối Giữa Card -->
              <div style="text-align: center; margin-bottom: 14px;">
                <div class="stylist-card-metrics-pill" style="display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); background: var(--surface-elevated); padding: 5px 12px; border-radius: 4px; border: 1px solid var(--border-color);">
                  <span style="color: #C59B27; font-weight: 700;">★ ${rating}</span>
                  <span style="opacity: 0.4;">•</span>
                  <span>500+ lượt cắt</span>
                  <span style="opacity: 0.4;">•</span>
                  <span>${yearsExp}+ năm kinh nghiệm</span>
                </div>
              </div>

              <!-- Thẻ Kỹ Thuật Chuyên Sâu Tinh Gọn -->
              <div class="stylist-card-tags-row" style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 16px;">
                ${specialties.slice(0, 3).map(tag => `<span class="stylist-card-tag-pill" style="font-size: 11.5px; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: var(--surface-elevated); color: var(--text-secondary); border: 1px solid var(--border-color);">${tag}</span>`).join('')}
              </div>

              <!-- Bộ Sưu Tập Ảnh Tác Phẩm Cân Đối Đối Xứng -->
              <div class="stylist-card-portfolio-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="flex: 1; height: 1px; background: var(--border-color);"></span>
                <span class="tracking-widest" style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">MẪU TÓC THỰC HIỆN</span>
                <span style="flex: 1; height: 1px; background: var(--border-color);"></span>
              </div>
              <div class="stylist-card-gallery-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 18px;">
                <img src="${p1}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px;" alt="Mẫu tóc 1" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300';">
                <img src="${p2}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px;" alt="Mẫu tóc 2" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300';">
                <img src="${p3}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px;" alt="Mẫu tóc 3" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300';">
              </div>
            </div>

            <!-- Nút Đặt Lịch Trực Tiếp -->
            <button type="button" class="stylist-card-cta-btn" onclick="StylistsPage.bookWithStylist('${stylist.id}', '${stylist.branchId || ''}')"
                    style="width: 100%; min-height: 40px; height: 40px; border-radius: 6px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease;">
              <span>Đặt Lịch Với ${cleanName.split(' ').pop()} →</span>
            </button>
          </div>
        `;
      }).join('');
    },

    renderPagination(filtered) {
      if (!filtered || filtered.length === 0) return '';
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
      if (totalPages <= 1) return '';

      const startIdx = (this.currentPage - 1) * this.pageSize;
      const endIdx = Math.min(startIdx + this.pageSize, total);

      const pages = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        const left = Math.max(2, this.currentPage - 1);
        const right = Math.min(totalPages - 1, this.currentPage + 1);
        if (left > 2) pages.push('...');
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }

      const prevDisabled = this.currentPage <= 1;
      const nextDisabled = this.currentPage >= totalPages;

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 36px; padding: 18px 24px; background: var(--surface-card); border-radius: 18px; border: 1px solid var(--border-color); flex-wrap: wrap; gap: 16px; box-shadow: 0 4px 18px rgba(0,0,0,0.03);">
          <div style="font-size: 14px; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
            <span>Hiển thị</span>
            <span style="color: var(--brand-accent); font-weight: 800; font-size: 15px;">${startIdx + 1}–${endIdx}</span>
            <span>trên tổng số</span>
            <span style="color: var(--text-primary); font-weight: 800; font-size: 15px;">${total}</span>
            <span>thợ (Trang ${this.currentPage}/${totalPages})</span>
          </div>

          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <button id="stylistPrevPageBtn"
                    onclick="StylistsPage.changePage(${this.currentPage - 1})"
                    ${prevDisabled ? 'disabled' : ''}
                    style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 42px; padding: 0 16px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: ${prevDisabled ? 'not-allowed' : 'pointer'}; opacity: ${prevDisabled ? '0.35' : '1'}; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); transition: all 0.2s ease;">
              <span style="font-size: 16px; line-height: 1;">←</span>
              <span>Trước</span>
            </button>

            <div style="display: inline-flex; align-items: center; gap: 6px;">
              ${pages.map(p => {
        if (p === '...') {
          return `<span style="padding: 0 6px; color: var(--text-secondary); font-weight: 800; font-size: 14px;">…</span>`;
        }
        const isActive = p === this.currentPage;
        return `
                  <button onclick="StylistsPage.changePage(${p})"
                          style="min-width: 42px; height: 42px; padding: 0 10px; border-radius: 10px; font-size: 13px; font-weight: ${isActive ? '800' : '600'}; cursor: pointer; transition: all 0.2s ease; ${isActive
            ? 'background: var(--brand-accent); color: #ffffff; border: 1.5px solid var(--brand-accent); box-shadow: 0 2px 10px rgba(180,131,18,0.3);'
            : 'background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color);'
          }">
                    ${p}
                  </button>
                `;
      }).join('')}
            </div>

            <button id="stylistNextPageBtn"
                    onclick="StylistsPage.changePage(${this.currentPage + 1})"
                    ${nextDisabled ? 'disabled' : ''}
                    style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 42px; padding: 0 18px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: ${nextDisabled ? 'not-allowed' : 'pointer'}; opacity: ${nextDisabled ? '0.35' : '1'}; background: var(--brand-accent); border: none; color: #ffffff; box-shadow: 0 4px 14px rgba(180,131,18,0.25); transition: all 0.2s ease;">
              <span>Sau</span>
              <span style="font-size: 16px; line-height: 1;">→</span>
            </button>
          </div>
        </div>
      `;
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
