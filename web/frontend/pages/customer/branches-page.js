// Trang danh sách chi nhánh
(function (window) {
  'use strict';

  const BranchesPage = {
    selectedFilter: 'all',
    searchQuery: '',
    pageSize: 6,
    currentPage: 1,

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
      // Các Quận theo số
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
      return `Đang hiển thị <strong style="color: #C59B27;">${filtered.length}</strong> chi nhánh ${filterLabel}${searchLabel}`;
    },

    getFilteredBranches(branches) {
      let filtered = [...branches];

      // Lọc theo quận được chọn
      if (this.selectedFilter && this.selectedFilter !== 'all') {
        if (this.selectedFilter === 'flagship') {
          filtered = filtered.filter(b => (b.group && (b.group.includes('FLAGSHIP') || b.group.includes('PRESIDENTIAL'))) || b.id === 'CN01');
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

      if (queryParams && queryParams.district) {
        this.selectedFilter = queryParams.district;
      }
      this.currentPage = 1;
      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);
      const filtered = this.getFilteredBranches(branches);

      container.innerHTML = `
        <div class="branches-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); width: 100%; padding: 48px 0 88px;">
          <!-- Khung nội dung tràn viền toàn diện đồng bộ với Header -->
          <div class="services-fluid-container" style="width: 100%; max-width: 100%; margin: 0; padding: 0 clamp(20px, 3vw, 56px); box-sizing: border-box;">

            <!-- TIÊU ĐỀ TRANG EDITORIAL -->
            <div style="text-align: center; margin-bottom: 36px;">
              <span class="tracking-widest" style="font-size: 11.5px; font-weight: 700; color: #C59B27; text-transform: uppercase; margin-bottom: 8px; display: inline-block;">
                HỆ THỐNG CHI NHÁNH TOÀN THÀNH PHỐ
              </span>
              <h1 class="font-serif tracking-tight leading-tight" style="font-size: clamp(30px, 4.2vw, 44px); font-weight: 700; margin: 0 0 12px; color: var(--text-primary);">
                Không Gian Barbershop &amp; Vị Trí Chi Nhánh
              </h1>
              <p style="font-size: 15px; color: var(--text-secondary); max-width: 680px; margin: 0 auto 28px; line-height: 1.6;">
                Không gian thiết kế đĩnh đạc, ghế cắt bọc da cao cấp và đội ngũ barber luôn sẵn sàng phục vụ tại 20 chi nhánh khắp các quận.
              </p>

              <!-- Ô TÌM KIẾM THEO QUẬN & DROPDOWN LỰA CHỌN -->
              <div style="display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; max-width: 780px; margin-left: auto; margin-right: auto;">
                <!-- Ô NHẬP TÌM KIẾM -->
                <div style="position: relative; flex: 1; min-width: 280px;">
                  <input type="text" id="branchSearchInput" placeholder="Tìm theo quận (Q.1, Bình Thạnh...), tên đường..." 
                         value="${this.searchQuery}"
                         oninput="BranchesPage.handleSearch(this.value)"
                         style="width: 100%; height: 44px; padding: 0 16px; border-radius: 6px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 500; outline: none; box-sizing: border-box; transition: border-color 0.15s ease;">
                </div>

                <!-- DROPDOWN CHỌN QUẬN NHANH -->
                <div style="position: relative; min-width: 240px;">
                  <select id="branchDistrictSelect" onchange="BranchesPage.setDistrict(this.value)"
                          style="width: 100%; height: 44px; padding: 0 32px 0 14px; border-radius: 6px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13.5px; font-weight: 700; cursor: pointer; outline: none; box-sizing: border-box; appearance: none; -webkit-appearance: none;">
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

            <!-- LƯỚI CHI NHÁNH EDITORIAL (3 CỘT ĐỒNG BỘ TỰ KÉO GIÃN THEO MÀN HÌNH) -->
            <div id="branchesCardsGrid" style="width: 100%; max-width: 100%; margin: 0; box-sizing: border-box;">
              ${this.renderBranchCardsHTML(branches)}
            </div>

            <!-- THANH PHÂN TRANG CHUẨN CỬA HÀNG -->
            <div id="branchesPaginationContainer" style="width: 100%; max-width: 100%; margin: 36px 0 0; box-sizing: border-box;">
              ${this.renderPagination(filtered)}
            </div>

          </div>
        </div>
      `;
    },

    setDistrict(district) {
      this.selectedFilter = district || 'all';
      this.currentPage = 1;
      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);
      const filtered = this.getFilteredBranches(branches);

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
        const pagContainer = document.getElementById('branchesPaginationContainer');
        if (pagContainer) {
          pagContainer.innerHTML = this.renderPagination(filtered);
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
      this.currentPage = 1;
      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);
      const filtered = this.getFilteredBranches(branches);

      if (typeof document !== 'undefined') {
        const grid = document.getElementById('branchesCardsGrid');
        if (grid) {
          grid.innerHTML = this.renderBranchCardsHTML(branches);
        }
        const pagContainer = document.getElementById('branchesPaginationContainer');
        if (pagContainer) {
          pagContainer.innerHTML = this.renderPagination(filtered);
        }
        const countEl = document.getElementById('branchResultsSummary');
        if (countEl) {
          countEl.innerHTML = this.renderResultSummaryHTML(branches);
        }
      }
    },

    changePage(newPage) {
      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);
      const filtered = this.getFilteredBranches(branches);
      const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));

      if (newPage < 1 || newPage > totalPages) return;
      this.currentPage = newPage;

      if (typeof document !== 'undefined') {
        const grid = document.getElementById('branchesCardsGrid');
        if (grid) {
          grid.innerHTML = this.renderBranchCardsHTML(branches);
        }
        const pagContainer = document.getElementById('branchesPaginationContainer');
        if (pagContainer) {
          pagContainer.innerHTML = this.renderPagination(filtered);
        }

        const scrollTarget = document.getElementById('branchesCardsGrid') || document.querySelector('.branches-page-shell');
        if (scrollTarget && typeof scrollTarget.scrollIntoView === 'function') {
          scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      // Phân trang 6 chi nhánh mỗi trang
      const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (this.currentPage > totalPages) this.currentPage = 1;
      const startIdx = (this.currentPage - 1) * this.pageSize;
      const paginated = filtered.slice(startIdx, startIdx + this.pageSize);

      if (typeof window.BranchCard !== 'undefined' && typeof window.BranchCard.render === 'function') {
        return paginated.map(b => window.BranchCard.render(b, {
          onBookClick: `BranchesPage.selectBranchAndBook('${b.id}')`
        })).join('');
      }

      // Fallback
      return paginated.map(b => `
        <div class="branch-clean-card" id="branchCard_${b.id}">
          <div class="branch-content-body">
            <h3 class="branch-name-title">${b.TenChiNhanh || b.name}</h3>
            <p class="info-text">${b.DiaChi || b.address}</p>
          </div>
        </div>
      `).join('');
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
            <span>chi nhánh (Trang ${this.currentPage}/${totalPages})</span>
          </div>

          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <button id="branchPrevPageBtn"
                    onclick="BranchesPage.changePage(${this.currentPage - 1})"
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
                  <button onclick="BranchesPage.changePage(${p})"
                          style="min-width: 42px; height: 42px; padding: 0 10px; border-radius: 10px; font-size: 13px; font-weight: ${isActive ? '800' : '600'}; cursor: pointer; transition: all 0.2s ease; ${isActive
                    ? 'background: var(--brand-accent); color: #ffffff; border: 1.5px solid var(--brand-accent); box-shadow: 0 2px 10px rgba(180,131,18,0.3);'
                    : 'background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color);'
                  }">
                    ${p}
                  </button>
                `;
              }).join('')}
            </div>

            <button id="branchNextPageBtn"
                    onclick="BranchesPage.changePage(${this.currentPage + 1})"
                    ${nextDisabled ? 'disabled' : ''}
                    style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 42px; padding: 0 18px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: ${nextDisabled ? 'not-allowed' : 'pointer'}; opacity: ${nextDisabled ? '0.35' : '1'}; background: var(--brand-accent); border: none; color: #ffffff; box-shadow: 0 4px 14px rgba(180,131,18,0.25); transition: all 0.2s ease;">
              <span>Sau</span>
              <span style="font-size: 16px; line-height: 1;">→</span>
            </button>
          </div>
        </div>
      `;
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
