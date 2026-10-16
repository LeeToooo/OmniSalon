// =========================================================================
// Omni Salon — HỆ THỐNG DANH MỤC CHI NHÁNH TOÀN QUỐC
// Tuân thủ: Yêu cầu Thứ 7 (Hiện các chi nhánh trực quan)
// Tìm kiếm & Lọc theo Quận / Huyện TP.HCM • Thuần Tiếng Việt • Cân Bằng Thẻ
// =========================================================================

(function (window) {
  'use strict';

  const BranchesPage = {
    selectedFilter: 'all',
    searchQuery: '',

    // Danh sách 19 quận / huyện chính thức của 20 chi nhánh
    DISTRICT_ORDER: [
      'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 
      'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12', 
      'Bình Thạnh', 'Tân Bình', 'Gò Vấp', 'Phú Nhuận', 
      'TP. Thủ Đức', 'Tân Phú', 'Bình Tân', 'Bình Chánh', 'Hóc Môn'
    ],

    // Ánh xạ quận chuẩn từ địa chỉ chi nhánh
    getBranchDistrict(b) {
      if (!b) return 'TP. Hồ Chí Minh';
      const text = `${b.DiaChi || ''} ${b.address || ''} ${b.TenChiNhanh || ''} ${b.name || ''}`;
      
      // TP. Thủ Đức & Thảo Điền
      if (/Thủ\s*Đức|Thảo\s*Điền/i.test(text)) return 'TP. Thủ Đức';
      // Các quận / huyện có tên chữ
      if (/Bình\s*Thạnh/i.test(text)) return 'Bình Thạnh';
      if (/Tân\s*Bình/i.test(text)) return 'Tân Bình';
      if (/Phú\s*Nhuận/i.test(text)) return 'Phú Nhuận';
      if (/Gò\s*Vấp/i.test(text)) return 'Gò Vấp';
      if (/Tân\s*Phú/i.test(text)) return 'Tân Phú';
      if (/Bình\s*Tân/i.test(text)) return 'Bình Tân';
      if (/Bình\s*Chánh/i.test(text)) return 'Bình Chánh';
      if (/Hóc\s*Môn/i.test(text)) return 'Hóc Môn';
      // Các Quận theo số (ưu tiên 2 số trước)
      if (/Q\.?\s*10\b|Quận\s*10\b/i.test(text)) return 'Quận 10';
      if (/Q\.?\s*11\b|Quận\s*11\b/i.test(text)) return 'Quận 11';
      if (/Q\.?\s*12\b|Quận\s*12\b/i.test(text)) return 'Quận 12';
      // 1 số
      if (/Q\.?\s*1\b|Quận\s*1\b|Bến\s*Thành/i.test(text)) return 'Quận 1';
      if (/Q\.?\s*3\b|Quận\s*3\b/i.test(text)) return 'Quận 3';
      if (/Q\.?\s*4\b|Quận\s*4\b/i.test(text)) return 'Quận 4';
      if (/Q\.?\s*5\b|Quận\s*5\b/i.test(text)) return 'Quận 5';
      if (/Q\.?\s*6\b|Quận\s*6\b/i.test(text)) return 'Quận 6';
      if (/Q\.?\s*7\b|Quận\s*7\b/i.test(text)) return 'Quận 7';
      if (/Q\.?\s*8\b|Quận\s*8\b/i.test(text)) return 'Quận 8';

      return 'TP. Hồ Chí Minh';
    },

    // Xóa dấu tiếng Việt phục vụ tìm kiếm thông minh
    removeAccents(str) {
      if (!str) return '';
      return String(str).normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase().trim();
    },

    getDistrictList(branches) {
      const found = new Set(branches.map(b => this.getBranchDistrict(b)));
      return this.DISTRICT_ORDER.filter(d => found.has(d));
    },

    getDistrictCount(branches, district) {
      return branches.filter(b => this.getBranchDistrict(b) === district).length;
    },

    renderDistrictOptionsHTML(branches) {
      const districts = this.getDistrictList(branches);
      return districts.map(d => {
        const count = this.getDistrictCount(branches, d);
        return `<option value="${d}" ${this.selectedFilter === d ? 'selected' : ''}>${d} (${count} Chi Nhánh)</option>`;
      }).join('');
    },

    renderDistrictPillsHTML(branches) {
      const districts = this.getDistrictList(branches);
      const isAll = this.selectedFilter === 'all';
      let html = `
        <button class="clean-tab-btn district-tab-btn ${isAll ? 'active' : ''}" 
                data-district="all"
                onclick="BranchesPage.setDistrict('all')">
          Tất Cả <span class="clean-tab-badge">${branches.length}</span>
        </button>
      `;

      html += districts.map(d => {
        const isActive = this.selectedFilter === d;
        const count = this.getDistrictCount(branches, d);
        return `
          <button class="clean-tab-btn district-tab-btn ${isActive ? 'active' : ''}" 
                  data-district="${d}"
                  onclick="BranchesPage.setDistrict('${d}')">
            ${d} <span class="clean-tab-badge">${count}</span>
          </button>
        `;
      }).join('');

      return html;
    },

    renderResultSummaryHTML(branches) {
      const filtered = this.getFilteredBranches(branches);
      const filterLabel = this.selectedFilter !== 'all' ? `tại khu vực <strong>${this.selectedFilter}</strong>` : 'toàn thành phố';
      const searchLabel = this.searchQuery ? ` theo từ khóa "<em>${this.searchQuery}</em>"` : '';
      return `Đang hiển thị <strong style="color: var(--brand-accent);">${filtered.length}</strong> chi nhánh ${filterLabel}${searchLabel}`;
    },

    getFilteredBranches(branches) {
      let filtered = [...branches];

      // Lọc theo quận được chọn
      if (this.selectedFilter && this.selectedFilter !== 'all') {
        if (this.selectedFilter === 'flagship') {
          filtered = filtered.filter(b => (b.group && (b.group.includes('FLAGSHIP') || b.group.includes('PRESIDENTIAL'))) || b.id === 'br-dbp' || b.id === 'CN01');
        } else {
          filtered = filtered.filter(b => this.getBranchDistrict(b) === this.selectedFilter);
        }
      }

      // Tìm kiếm theo quận, tên viết tắt, tên đường, số điện thoại
      if (this.searchQuery) {
        const rawQ = this.searchQuery;
        const cleanQ = this.removeAccents(rawQ);

        const ALIASES = {
          'q1': 'Quận 1', 'q.1': 'Quận 1', 'quan 1': 'Quận 1', 'quan 01': 'Quận 1',
          'q3': 'Quận 3', 'q.3': 'Quận 3', 'quan 3': 'Quận 3',
          'q4': 'Quận 4', 'q.4': 'Quận 4', 'quan 4': 'Quận 4',
          'q5': 'Quận 5', 'q.5': 'Quận 5', 'quan 5': 'Quận 5',
          'q6': 'Quận 6', 'q.6': 'Quận 6', 'quan 6': 'Quận 6',
          'q7': 'Quận 7', 'q.7': 'Quận 7', 'quan 7': 'Quận 7',
          'q8': 'Quận 8', 'q.8': 'Quận 8', 'quan 8': 'Quận 8',
          'q10': 'Quận 10', 'q.10': 'Quận 10', 'quan 10': 'Quận 10',
          'q11': 'Quận 11', 'q.11': 'Quận 11', 'quan 11': 'Quận 11',
          'q12': 'Quận 12', 'q.12': 'Quận 12', 'quan 12': 'Quận 12',
          'bt': 'Bình Thạnh', 'binh thanh': 'Bình Thạnh',
          'tb': 'Tân Bình', 'tan binh': 'Tân Bình',
          'gv': 'Gò Vấp', 'go vap': 'Gò Vấp',
          'pn': 'Phú Nhuận', 'phu nhuan': 'Phú Nhuận',
          'td': 'TP. Thủ Đức', 'thu duc': 'TP. Thủ Đức', 'tp thu duc': 'TP. Thủ Đức',
          'tp': 'Tân Phú', 'tan phu': 'Tân Phú',
          'binh tan': 'Bình Tân',
          'bc': 'Bình Chánh', 'binh chanh': 'Bình Chánh',
          'hm': 'Hóc Môn', 'hoc mon': 'Hóc Môn'
        };

        filtered = filtered.filter(b => {
          const district = this.getBranchDistrict(b);
          if (ALIASES[cleanQ]) {
            return ALIASES[cleanQ] === district;
          }

          const cleanDistrict = this.removeAccents(district);
          const cleanName = this.removeAccents(b.TenChiNhanh || b.name || '');
          const cleanAddr = this.removeAccents(b.DiaChi || b.address || '');
          const phone = String(b.SoDienThoai || b.phone || '');

          return cleanDistrict.includes(cleanQ) || 
                 cleanName.includes(cleanQ) || 
                 cleanAddr.includes(cleanQ) || 
                 phone.includes(rawQ);
        });
      }

      return filtered;
    },

    render(container, queryParams = {}) {
      if (!container) return;

      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);

      container.innerHTML = `
        <div class="branches-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); width: 100%; padding: 32px 0 72px;">
          <!-- Khung nội dung tràn viền 2 bên hiện đại -->
          <div style="max-width: 1640px; width: 100%; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); box-sizing: border-box;">

            <!-- TIÊU ĐỀ TRANG (Visual Hierarchy rõ ràng) -->
            <div style="text-align: center; margin-bottom: 28px;">
              <h1 style="font-size: clamp(26px, 3.5vw, 36px); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; color: var(--text-primary);">
                Mạng Lưới Chi Nhánh <span style="color: var(--brand-accent);">Omni Salon</span>
              </h1>
              <p style="font-size: 14.5px; color: var(--text-secondary); max-width: 680px; margin: 0 auto 22px; line-height: 1.6;">
                Không gian sang trọng, sạch sẽ thoáng mát và đội ngũ thợ tận tâm sẵn sàng đón tiếp quý khách tại 20 chi nhánh TP. Hồ Chí Minh.
              </p>

              <!-- Ô TÌM KIẾM THEO QUẬN & DROPDOWN LỰA CHỌN (Radius 8px dứt khoát) -->
              <div style="display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; max-width: 780px; margin-left: auto; margin-right: auto;">
                <!-- Ô NHẬP TÌM KIẾM -->
                <div style="position: relative; flex: 1; min-width: 280px;">
                  <input type="text" id="branchSearchInput" placeholder="Tìm theo quận (Q.1, Bình Thạnh...), tên đường..." 
                         value="${this.searchQuery}"
                         oninput="BranchesPage.handleSearch(this.value)"
                         style="width: 100%; height: 44px; padding: 0 16px; border-radius: 8px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 500; outline: none; box-sizing: border-box; transition: border-color 0.15s ease;">
                </div>

                <!-- DROPDOWN CHỌN QUẬN NHANH -->
                <div style="position: relative; min-width: 240px;">
                  <select id="branchDistrictSelect" onchange="BranchesPage.setDistrict(this.value)"
                          style="width: 100%; height: 44px; padding: 0 32px 0 14px; border-radius: 8px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13.5px; font-weight: 700; cursor: pointer; outline: none; box-sizing: border-box; appearance: none; -webkit-appearance: none;">
                    <option value="all">Tất Cả Các Quận / Huyện (${branches.length})</option>
                    ${this.renderDistrictOptionsHTML(branches)}
                  </select>
                  <span style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 11px; pointer-events: none; color: var(--text-secondary);">▼</span>
                </div>
              </div>


              <!-- DÒNG THÔNG BÁO SỐ LƯỢNG KẾT QUẢ TÌM KIẾM -->
              <div id="branchResultsSummary" style="font-size: 13.5px; color: var(--text-secondary); margin-top: 10px;">
                ${this.renderResultSummaryHTML(branches)}
              </div>
            </div>

            <!-- LƯỚI CHI NHÁNH (Clean Grid) -->
            <div id="branchesCardsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px;">
              ${this.renderBranchCardsHTML(branches)}
            </div>

          </div>
        </div>
      `;
    },

    setDistrict(district) {
      this.selectedFilter = district || 'all';
      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);
      
      if (typeof document !== 'undefined') {
        const selectEl = document.getElementById('branchDistrictSelect');
        if (selectEl) selectEl.value = this.selectedFilter;

        document.querySelectorAll('.district-tab-btn').forEach(btn => {
          const d = btn.getAttribute('data-district');
          const isAct = d === this.selectedFilter;
          btn.classList.toggle('active', isAct);
        });

        const grid = document.getElementById('branchesCardsGrid');
        if (grid) {
          grid.innerHTML = this.renderBranchCardsHTML(branches);
        }
        const countEl = document.getElementById('branchResultsSummary');
        if (countEl) {
          countEl.innerHTML = this.renderResultSummaryHTML(branches);
        }
      }
    },

    setFilter(filter) {
      this.setDistrict(filter);
    },

    handleSearch(query) {
      this.searchQuery = (query || '').trim();
      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);
      
      if (typeof document !== 'undefined') {
        const grid = document.getElementById('branchesCardsGrid');
        if (grid) {
          grid.innerHTML = this.renderBranchCardsHTML(branches);
        }
        const countEl = document.getElementById('branchResultsSummary');
        if (countEl) {
          countEl.innerHTML = this.renderResultSummaryHTML(branches);
        }
      }
    },

    renderBranchCardsHTML(branches) {
      const filtered = this.getFilteredBranches(branches);

      if (filtered.length === 0) {
        if (typeof window.BranchCard !== 'undefined' && typeof window.BranchCard.renderEmptyState === 'function') {
          return window.BranchCard.renderEmptyState({
            onReset: "BranchesPage.setDistrict('all')"
          });
        }
        return `
          <div class="catalog-empty-state" style="grid-column: 1 / -1;">
            <h3 class="empty-state-title">Không tìm thấy chi nhánh phù hợp</h3>
            <p class="empty-state-desc">Vui lòng thử tìm kiếm với tên quận khác hoặc bấm 'Tất Cả'.</p>
            <button type="button" class="btn-flat-cta btn-flat-primary" onclick="BranchesPage.setDistrict('all')">
              Xem Tất Cả ${branches.length} Chi Nhánh
            </button>
          </div>
        `;
      }

      if (typeof window.BranchCard !== 'undefined' && typeof window.BranchCard.render === 'function') {
        return filtered.map(b => window.BranchCard.render(b, {
          onBookClick: `BranchesPage.selectBranchAndBook('${b.id}')`
        })).join('');
      }

      // Fallback
      return filtered.map(b => `
        <div class="branch-clean-card" id="branchCard_${b.id}">
          <div class="branch-content-body">
            <h3 class="branch-name-title">${b.TenChiNhanh || b.name}</h3>
            <p class="info-text">${b.DiaChi || b.address}</p>
          </div>
        </div>
      `).join('');
    },

    selectBranchAndBook(branchId) {
      if (window.store && typeof window.store.setSelectedBranch === 'function') {
        window.store.setSelectedBranch(branchId);
      }
      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate(`/booking?branch=${branchId}`);
      } else if (window.BookingPage) {
        window.BookingPage.changeBranch(branchId);
        window.location.hash = `#/booking?branch=${branchId}`;
      }
    }
  };

  // Export toàn cục
  window.BranchesPage = BranchesPage;

  // Tự động lắng nghe và cập nhật giao diện khi CSDL SQL tải xong
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const attachSyncListener = () => {
      if (window.store && typeof window.store.subscribe === 'function') {
        window.store.subscribe((state, event) => {
          if (event === 'LIVE_SERVER_SYNC' || event === 'STATE_CHANGE') {
            const container = document.getElementById('webMainContainer');
            if (container && window.AppRouter && window.AppRouter.currentRoute === '/branches') {
              BranchesPage.render(container);
            }
          }
        });
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachSyncListener);
    } else {
      attachSyncListener();
    }
  }

})(window);
