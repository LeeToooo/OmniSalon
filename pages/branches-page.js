// =========================================================================
// Omni Salon — BRANCHES DIRECTORY & SHOWCASE PAGE
// Tuân thủ: .antigravity/rules/03_coder.md, 04_refactor.md, 07_ponytail.md
// Hiển thị danh sách thẻ chi nhánh Omni Salon (ảnh mặt tiền sang trọng,
// địa chỉ chi tiết, hotline đặt lịch, giờ mở cửa và nút 'Chọn chi nhánh này').
// =========================================================================

(function (window) {
  'use strict';

  const BranchesPage = {
    selectedFilter: 'all',
    searchQuery: '',

    render(container, queryParams = {}) {
      if (!container) return;

      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);

      container.innerHTML = `
        <div class="branches-page-shell" style="background-color: var(--bg-primary, #0B0D13); min-height: 100vh; color: var(--text-primary, #FFFFFF); width: 100%; padding: 40px 0 80px;">
          <div style="max-width: 1280px; margin: 0 auto; padding: 0 24px;">

            <!-- HERO HEADER -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); color: #F59E0B; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;">
                <span>📍</span> MẠNG LƯỚI TOÀN QUỐC • 19+ CƠ SỞ ĐẲNG CẤP
              </div>
              <h1 style="font-size: 36px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 14px; color: var(--text-primary, #FFFFFF);">
                Hệ Thống Chi Nhánh <span style="background: linear-gradient(135deg, #F59E0B 0%, #E5B869 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Omni Salon</span>
              </h1>
              <p style="font-size: 16px; color: var(--text-secondary, #CBD5E1); max-width: 680px; margin: 0 auto 28px; line-height: 1.6;">
                Không gian thiết kế Bắc Âu tối giản, sang trọng, chuẩn mực vệ sinh y khoa, phục vụ thức uống hảo hạng và đội ngũ nghệ nhân tạo mẫu hàng đầu tại các vị trí đắc địa nhất.
              </p>

              <!-- SEARCH & FILTER CONTROLS -->
              <div style="display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 24px;">
                <div style="position: relative; width: 100%; max-width: 380px;">
                  <input type="text" id="branchSearchInput" placeholder="Tìm theo quận, tên đường, khu vực..." 
                         value="${this.searchQuery}"
                         oninput="BranchesPage.handleSearch(this.value)"
                         style="width: 100%; padding: 12px 16px 12px 40px; border-radius: 9999px; background: var(--surface-card, #131722); border: 1px solid var(--border-color, rgba(212, 175, 55, 0.2)); color: var(--text-primary, #FFFFFF); font-size: 14px; outline: none; box-sizing: border-box;">
                  <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 14px; color: #888;">🔍</span>
                </div>
              </div>

              <!-- REGION TABS -->
              <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                <button class="pill-filter-btn ${this.selectedFilter === 'all' ? 'active' : ''}" onclick="BranchesPage.setFilter('all')">
                  Tất Cả (${branches.length})
                </button>
                <button class="pill-filter-btn ${this.selectedFilter === 'flagship' ? 'active' : ''}" onclick="BranchesPage.setFilter('flagship')">
                  👑 Flagship &amp; VIP Suite
                </button>
                <button class="pill-filter-btn ${this.selectedFilter === 'hcm' ? 'active' : ''}" onclick="BranchesPage.setFilter('hcm')">
                  TP. Hồ Chí Minh
                </button>
                <button class="pill-filter-btn ${this.selectedFilter === 'hn' ? 'active' : ''}" onclick="BranchesPage.setFilter('hn')">
                  Hà Nội
                </button>
              </div>
            </div>

            <!-- BRANCHES GRID (3-COLUMNS RESPONSIVE) -->
            <div id="branchesCardsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px;">
              ${this.renderBranchCardsHTML(branches)}
            </div>

          </div>
        </div>
      `;
    },

    setFilter(filter) {
      this.selectedFilter = filter;
      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);
      const grid = document.getElementById('branchesCardsGrid');
      if (grid) {
        grid.innerHTML = this.renderBranchCardsHTML(branches);
      }
      // Update active button state
      document.querySelectorAll('.pill-filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      event?.target?.classList.add('active');
    },

    handleSearch(query) {
      this.searchQuery = (query || '').trim();
      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);
      const grid = document.getElementById('branchesCardsGrid');
      if (grid) {
        grid.innerHTML = this.renderBranchCardsHTML(branches);
      }
    },

    renderBranchCardsHTML(branches) {
      let filtered = [...branches];

      // Filter by category
      if (this.selectedFilter === 'flagship') {
        filtered = filtered.filter(b => (b.group && (b.group.includes('FLAGSHIP') || b.group.includes('PRESIDENTIAL'))) || b.id === 'br-dbp' || b.id === 'CN01');
      } else if (this.selectedFilter === 'hcm') {
        filtered = filtered.filter(b => (b.address && b.address.includes('TP.HCM')) || (b.DiaChi && b.DiaChi.includes('TP.HCM')) || (b.city && b.city.includes('HỒ CHÍ MINH')));
      } else if (this.selectedFilter === 'hn') {
        filtered = filtered.filter(b => (b.address && b.address.includes('Hà Nội')) || b.id === 'br-hn-hk');
      }

      // Filter by search query
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        filtered = filtered.filter(b => 
          ((b.name || b.TenChiNhanh) && (b.name || b.TenChiNhanh).toLowerCase().includes(q)) ||
          ((b.address || b.DiaChi) && (b.address || b.DiaChi).toLowerCase().includes(q)) ||
          ((b.phone || b.SoDienThoai) && (b.phone || b.SoDienThoai).toLowerCase().includes(q))
        );
      }

      if (filtered.length === 0) {
        return `
          <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: var(--surface-card, #131722); border-radius: 16px; border: 1px solid var(--border-color, rgba(255,255,255,0.1));">
            <span style="font-size: 36px; display: block; margin-bottom: 12px;">📍</span>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary, #FFFFFF); margin-bottom: 8px;">Không tìm thấy chi nhánh phù hợp</h3>
            <p style="font-size: 14px; color: var(--text-secondary, #CBD5E1);">Vui lòng thử tìm kiếm với từ khóa khác hoặc bấm 'Tất Cả'</p>
          </div>
        `;
      }

      return filtered.map(b => {
        const isFlagship = b.group && (b.group.includes('FLAGSHIP') || b.group.includes('PRESIDENTIAL') || b.id === 'br-dbp' || b.id === 'CN01');
        const branchFullName = b.TenChiNhanh || b.name;
        const branchShortName = branchFullName.split('—')[0].trim();
        const branchSubtitle = branchFullName.split('—')[1] ? branchFullName.split('—')[1].trim() : 'SALON & GROOMING SUITE';
        const addressText = b.DiaChi || b.address;
        const phoneText = b.SoDienThoai || b.phone || '0901111222';
        const hoursText = b.hours || (b.GioMoCua && b.GioDongCua ? `${b.GioMoCua.substring(0,5)} - ${b.GioDongCua.substring(0,5)}` : '08:30 - 21:30');

        return `
          <div class="branch-card-item" id="branchCard_${b.id}"
               style="background: var(--surface-card, #131722); border-radius: 20px; border: 1px solid var(--border-color, rgba(212, 175, 55, 0.15)); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.35);">
            
            <!-- ẢNH MẶT TIỀN SALON -->
            <div style="position: relative; width: 100%; height: 210px; overflow: hidden; background: #0B0D13;">
              <img src="${b.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'}"
                   alt="${branchShortName}"
                   loading="lazy"
                   style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;"
                   onmouseover="this.style.transform='scale(1.05)'"
                   onmouseout="this.style.transform='scale(1)'">
              
              <div style="position: absolute; top: 14px; left: 14px; display: flex; gap: 8px; flex-wrap: wrap;">
                ${isFlagship ? `
                  <span style="font-size: 11px; font-weight: 800; background: linear-gradient(135deg, #F59E0B, #D97706); color: #000; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(245,158,11,0.4);">
                    👑 FLAGSHIP SUITE
                  </span>
                ` : `
                  <span style="font-size: 11px; font-weight: 700; background: rgba(16, 185, 129, 0.9); color: #fff; padding: 4px 10px; border-radius: 9999px;">
                    ✨ OPENING NOW
                  </span>
                `}
              </div>

              <div style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; color: #F59E0B; border: 1px solid rgba(245,158,11,0.3);">
                💺 ${b.totalChairs || 16} Ghế Phục Vụ
              </div>
            </div>

            <!-- NỘI DUNG CHI TIẾT CHI NHÁNH -->
            <div style="padding: 24px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="font-size: 11px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                  ${branchSubtitle}
                </div>
                <h3 class="branch-card-title text-amber-400 font-bold text-base !important" style="font-size: 19px; font-weight: 800; color: #F59E0B !important; margin-bottom: 14px; line-height: 1.3;">
                  ${branchShortName}
                </h3>

                <!-- ĐỊA CHỈ & THỜI GIAN -->
                <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: #CBD5E1; margin-bottom: 20px;">
                  <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="color: #F59E0B; font-size: 15px; line-height: 1.2;">📍</span>
                    <span class="branch-address-text text-slate-200 text-sm font-medium" style="font-size: 14px; font-weight: 500; line-height: 1.4;">${addressText}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #10B981; font-size: 15px; line-height: 1;">⏱️</span>
                    <span>Giờ phục vụ: <strong>${hoursText}</strong> hàng ngày</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #38BDF8; font-size: 15px; line-height: 1;">📞</span>
                    <span>Hotline: <a href="tel:${phoneText.replace(/[^0-9]/g, '')}" style="color: #F59E0B; font-weight: 700; text-decoration: none;">${phoneText}</a></span>
                  </div>
                </div>
              </div>

              <!-- HÀNH ĐỘNG: CHỌN CHI NHÁNH NÀY -->
              <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="nordic-btn-primary" 
                        onclick="BranchesPage.selectBranchAndBook('${b.id}')"
                        style="flex: 1; padding: 12px 18px; font-size: 13px; font-weight: 800; border-radius: 12px;">
                  📅 Chọn Chi Nhánh Này
                </button>
                <a href="https://maps.google.com/?q=${encodeURIComponent(b.address)}" 
                   target="_blank" 
                   rel="noopener"
                   class="nordic-btn-secondary" 
                   style="padding: 12px 16px; font-size: 13px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none;"
                   title="Xem vị trí trên Google Maps">
                  🗺️
                </a>
              </div>

            </div>

          </div>
        `;
      }).join('');
    },

    selectBranchAndBook(branchId) {
      if (window.store && typeof window.store.setSelectedBranch === 'function') {
        window.store.setSelectedBranch(branchId);
      }
      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate(`/booking?branch=${branchId}`);
      } else if (window.BookingPage && typeof window.BookingPage.selectBranch === 'function') {
        window.BookingPage.selectBranch(branchId);
        window.location.hash = `#/booking?branch=${branchId}`;
      }
    }
  };

  // Export toàn cục
  window.BranchesPage = BranchesPage;

})(window);
