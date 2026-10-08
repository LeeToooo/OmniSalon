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
        return `<option value="${d}" ${this.selectedFilter === d ? 'selected' : ''}>📍 ${d} (${count} Chi Nhánh)</option>`;
      }).join('');
    },

    renderDistrictPillsHTML(branches) {
      const districts = this.getDistrictList(branches);
      const isAll = this.selectedFilter === 'all';
      let html = `
        <button class="pill-filter-btn district-pill-btn ${isAll ? 'active' : ''}" 
                data-district="all"
                onclick="BranchesPage.setDistrict('all')"
                style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${isAll ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${isAll ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${isAll ? '#ffffff' : 'var(--text-primary)'}; transition: all 0.2s ease;">
          Tất Cả (${branches.length})
        </button>
      `;

      html += districts.map(d => {
        const isActive = this.selectedFilter === d;
        const count = this.getDistrictCount(branches, d);
        return `
          <button class="pill-filter-btn district-pill-btn ${isActive ? 'active' : ''}" 
                  data-district="${d}"
                  onclick="BranchesPage.setDistrict('${d}')"
                  style="padding: 8px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${isActive ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${isActive ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${isActive ? '#ffffff' : 'var(--text-primary)'}; transition: all 0.2s ease;">
            ${d} <span style="font-size: 11px; opacity: 0.85; font-weight: 600;">(${count})</span>
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
        <div class="branches-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); width: 100%; padding: 40px 0 80px;">
          <div style="max-width: 1240px; margin: 0 auto; padding: 0 20px;">

            <!-- TIÊU ĐỀ TRANG -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; background: var(--brand-accent-subtle); border: 1px solid var(--brand-accent-border); color: var(--brand-accent); font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 14px;">
                <span>📍</span> HỆ THỐNG 20 CHI NHÁNH • PHỦ KHẮP TP. HỒ CHÍ MINH
              </div>
              <h1 style="font-size: clamp(30px, 4vw, 42px); font-weight: 900; letter-spacing: -0.02em; margin-bottom: 12px; color: var(--text-primary);">
                Tìm Kiếm Chi Nhánh Theo <span style="color: var(--brand-accent);">Quận / Khu Vực</span>
              </h1>
              <p style="font-size: 15px; color: var(--text-secondary); max-width: 680px; margin: 0 auto 24px; line-height: 1.6;">
                Không gian rộng rãi, sạch sẽ thoáng mát, phục vụ nước uống miễn phí và đội ngũ thợ thân thiện luôn sẵn sàng đón tiếp quý khách tại 20 quận huyện TP.HCM.
              </p>

              <!-- Ô TÌM KIẾM THEO QUẬN & DROPDOWN LỰA CHỌN -->
              <div style="display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; max-width: 780px; margin-left: auto; margin-right: auto;">
                <!-- Ô NHẬP TÌM KIẾM -->
                <div style="position: relative; flex: 1; min-width: 280px;">
                  <input type="text" id="branchSearchInput" placeholder="Tìm theo quận (Q.1, Bình Thạnh...), tên đường..." 
                         value="${this.searchQuery}"
                         oninput="BranchesPage.handleSearch(this.value)"
                         style="width: 100%; height: 48px; padding: 0 20px 0 44px; border-radius: 9999px; background: var(--surface-card); border: 1.5px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 600; outline: none; box-sizing: border-box; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                  <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 16px; color: var(--text-secondary);">🔍</span>
                </div>

                <!-- DROPDOWN CHỌN QUẬN NHANH -->
                <div style="position: relative; min-width: 250px;">
                  <select id="branchDistrictSelect" onchange="BranchesPage.setDistrict(this.value)"
                          style="width: 100%; height: 48px; padding: 0 36px 0 16px; border-radius: 9999px; background: var(--surface-card); border: 1.5px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 700; cursor: pointer; outline: none; box-sizing: border-box; appearance: none; -webkit-appearance: none; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                    <option value="all">🏢 Tất Cả Các Quận / Huyện (${branches.length})</option>
                    ${this.renderDistrictOptionsHTML(branches)}
                  </select>
                  <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 12px; pointer-events: none; color: var(--text-secondary);">▼</span>
                </div>
              </div>

              <!-- CÁC NÚT BẤM LỌC THEO QUẬN -->
              <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; max-width: 1040px; margin: 0 auto 16px;">
                ${this.renderDistrictPillsHTML(branches)}
              </div>

              <!-- DÒNG THÔNG BÁO SỐ LƯỢNG KẾT QUẢ TÌM KIẾM -->
              <div id="branchResultsSummary" style="font-size: 13.5px; color: var(--text-secondary); margin-top: 10px;">
                ${this.renderResultSummaryHTML(branches)}
              </div>
            </div>

            <!-- LƯỚI CHI NHÁNH (3 CỘT ĐỀU TĂM TẮP, CÂN BẰNG THẺ) -->
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

        document.querySelectorAll('.district-pill-btn').forEach(btn => {
          const d = btn.getAttribute('data-district');
          const isAct = d === this.selectedFilter;
          btn.classList.toggle('active', isAct);
          btn.style.borderColor = isAct ? 'var(--brand-accent)' : 'var(--border-color)';
          btn.style.background = isAct ? 'var(--brand-accent)' : 'var(--surface-card)';
          btn.style.color = isAct ? '#ffffff' : 'var(--text-primary)';
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
        return `
          <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: var(--surface-card); border-radius: 16px; border: 1px solid var(--border-color);">
            <span style="font-size: 36px; display: block; margin-bottom: 12px;">📍</span>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Không tìm thấy chi nhánh phù hợp</h3>
            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">Vui lòng thử tìm kiếm với tên quận khác (VD: Q.1, Bình Thạnh, Gò Vấp, Thủ Đức...) hoặc bấm 'Tất Cả'</p>
            <button onclick="BranchesPage.setDistrict('all')" style="padding: 9px 22px; border-radius: 9999px; background: var(--brand-accent); color: #ffffff; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(180,131,18,0.25);">
              Xem Tất Cả ${branches.length} Chi Nhánh
            </button>
          </div>
        `;
      }

      return filtered.map(b => {
        const district = this.getBranchDistrict(b);
        const isFlagship = b.group && (b.group.includes('FLAGSHIP') || b.group.includes('PRESIDENTIAL') || b.id === 'br-dbp' || b.id === 'CN01');
        const branchFullName = b.TenChiNhanh || b.name;
        const branchShortName = branchFullName.split('—')[0].trim();
        const branchSubtitle = branchFullName.split('—')[1] ? branchFullName.split('—')[1].trim() : `KHU VỰC ${district.toUpperCase()}`;
        const addressText = b.DiaChi || b.address;
        const phoneText = b.SoDienThoai || b.phone || '0901111222';
        const hoursText = b.hours || (b.GioMoCua && b.GioDongCua ? `${b.GioMoCua.substring(0,5)} - ${b.GioDongCua.substring(0,5)}` : '08:30 - 21:30');

        return `
          <div class="branch-card-item" id="branchCard_${b.id}"
               style="background: var(--surface-card); border-radius: 20px; border: 1px solid var(--border-color); overflow: hidden; display: flex; flex-direction: column; height: 100%; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
            
            <!-- ẢNH MẶT TIỀN SALON ĐỒNG NHẤT TỈ LỆ -->
            <div style="position: relative; width: 100%; height: 200px; overflow: hidden; background: var(--surface-elevated);">
              <img src="${b.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'}"
                   alt="${branchShortName}"
                   loading="lazy"
                   style="width: 100%; height: 100%; object-fit: cover;"
                   onerror="this.src='https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80';">
              
              <!-- HUY HIỆU QUẬN & TRẠNG THÁI -->
              <div style="position: absolute; top: 12px; left: 12px; display: flex; gap: 6px; flex-wrap: wrap;">
                <span style="font-size: 11px; font-weight: 800; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(6px); color: #f59e0b; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(245, 158, 11, 0.5); box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                  📍 ${district}
                </span>
                ${isFlagship ? `
                  <span style="font-size: 11px; font-weight: 800; background: var(--brand-accent); color: #ffffff; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 2px 8px rgba(180,131,18,0.3);">
                    👑 FLAGSHIP VIP
                  </span>
                ` : `
                  <span style="font-size: 11px; font-weight: 700; background: #059669; color: #ffffff; padding: 4px 10px; border-radius: 9999px;">
                    ✨ ĐANG MỞ CỬA
                  </span>
                `}
              </div>

              <div style="position: absolute; bottom: 10px; right: 10px; background: var(--surface-card); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 800; color: var(--text-primary); border: 1px solid var(--border-color);">
                💺 ${b.totalChairs || 16} Ghế Cắt
              </div>
            </div>

            <!-- NỘI DUNG CHI TIẾT CHI NHÁNH -->
            <div style="padding: 22px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-size: 11px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase; letter-spacing: 0.05em;">
                    ${branchSubtitle}
                  </span>
                  <span style="font-size: 11px; font-weight: 700; background: var(--brand-accent-subtle); color: var(--brand-accent); padding: 2px 8px; border-radius: 6px; border: 1px solid var(--brand-accent-border);">
                    ${district}
                  </span>
                </div>
                <h3 class="branch-card-title text-amber-400" style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 14px; line-height: 1.3;">
                  ${branchShortName}
                </h3>

                <!-- ĐỊA CHỈ & THỜI GIAN -->
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
                  <div style="display: flex; align-items: flex-start; gap: 8px;">
                    <span style="color: var(--brand-accent); font-size: 14px; line-height: 1.4;">📍</span>
                    <span class="branch-address-text text-slate-200" style="font-size: 13px; font-weight: 600; line-height: 1.4; color: var(--text-primary);">${addressText}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #059669; font-size: 14px;">⏱️</span>
                    <span>Giờ mở cửa: <strong>${hoursText}</strong></span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #2563eb; font-size: 14px;">📞</span>
                    <span>Hotline: <strong style="color: var(--brand-accent);">${phoneText}</strong></span>
                  </div>
                </div>
              </div>

              <!-- HÀNH ĐỘNG: CHỌN CHI NHÁNH & ĐẶT LỊCH -->
              <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-color);">
                <button onclick="BranchesPage.selectBranchAndBook('${b.id}')"
                        style="flex: 1; height: 44px; border-radius: 10px; background: var(--brand-accent); border: none; color: #ffffff; font-size: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(180,131,18,0.25);">
                  📅 Đặt Lịch Tại Chi Nhánh Này
                </button>
                <a href="https://maps.google.com/?q=${encodeURIComponent(addressText)}" 
                    target="_blank" 
                    rel="noopener" 
                    style="width: 44px; height: 44px; border-radius: 10px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 18px;"
                    title="Xem vị trí trên bản đồ">
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
