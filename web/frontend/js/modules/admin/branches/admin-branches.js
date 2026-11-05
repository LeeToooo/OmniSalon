// ============================================================================
// Omni Salon: PHÂN HỆ QUẢN TRỊ - QUẢN LÝ CHUỖI CHI NHÁNH (BRANCHES MANAGEMENT)
// File tách độc lập để tối ưu tốc độ và giảm tải IDE
// ============================================================================

(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  Object.assign(window.AdminWeb, {
    branchSearchQuery: '',
    branchCityFilter: 'all',
    branchesPage: 1,
    selectedBranchId: null,
    branchTransform: { zoom: 1.0, panX: 50, panY: 50 },

    // -----------------------------------------------------------------------
    // SUB-TAB: QUẢN LÝ CHI NHÁNH, BRANCHES MANAGEMENT
    // -----------------------------------------------------------------------
    renderBranchesTab(user, branches, stylists, bookings = null, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      let list = [...branches];

      if (this.branchCityFilter && this.branchCityFilter !== 'all') {
        list = list.filter(b =>
          b.id === this.branchCityFilter ||
          b.MaChiNhanh === this.branchCityFilter ||
          (b.name || '').toLowerCase().includes(this.branchCityFilter.toLowerCase()) ||
          (b.TenChiNhanh || '').toLowerCase().includes(this.branchCityFilter.toLowerCase()) ||
          (b.city || '').toLowerCase().includes(this.branchCityFilter.toLowerCase()) ||
          (b.address || '').toLowerCase().includes(this.branchCityFilter.toLowerCase())
        );
      }

      if (this.branchSearchQuery) {
        const q = this.branchSearchQuery.toLowerCase().trim();
        list = list.filter(b =>
          (b.name || b.TenChiNhanh || '').toLowerCase().includes(q) ||
          (b.address || b.DiaChi || '').toLowerCase().includes(q) ||
          (b.id || b.MaChiNhanh || '').toLowerCase().includes(q) ||
          (b.phone || b.SoDienThoai || '').includes(q)
        );
      }

      this.branchesPage = this.branchesPage || 1;
      const brTotalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
      if (this.branchesPage > brTotalPages) this.branchesPage = brTotalPages;

      return `
        <!-- Filter & Actions Toolbar Thẻ Độc Lập Giống Ảnh 3 -->
        <div class="admin-filter-bar" style="border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: var(--surface-card); border: 1px solid var(--border-color); box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex: 1;">
            <!-- Ô tìm kiếm chi nhánh có icon kính lúp và nút X rõ ràng -->
            <div style="position: relative; min-width: 260px; max-width: 380px; flex: 1;">
              <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; display: flex; align-items: center; color: var(--text-secondary);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input type="text" id="adminBranchSearchInput" class="form-control-custom"
                     style="padding-left: 38px !important; padding-right: 32px !important; height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated);"
                     placeholder="Tìm tên, địa chỉ, hotline, mã chi nhánh..."
                     value="${this.escapeHtml(this.branchSearchQuery || '')}"
                     oninput="AdminWeb.handleBranchSearch(this.value);">
              <button type="button" id="adminBranchSearchClear"
                      onclick="AdminWeb.clearBranchSearch();"
                      style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 14px; padding: 4px; display: ${this.branchSearchQuery ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; z-index: 2;"
                      title="Xóa tìm kiếm">✕</button>
            </div>

            <!-- Lọc theo Khu Vực / Chi Nhánh -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <select id="adminBranchCitySelect" class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; padding: 0 12px; border: 1px solid var(--border-color); background: var(--surface-elevated);"
                      onchange="AdminWeb.branchCityFilter = this.value; AdminWeb.branchesPage = 1; AdminWeb._updateBranchesContentOnly();">
                <option value="all" ${(!this.branchCityFilter || this.branchCityFilter === 'all') ? 'selected' : ''}>Tất cả khu vực</option>
                ${branches.map(b => `
                  <option value="${b.id}" ${this.branchCityFilter === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="btn-submit-terracotta" style="height: 38px; padding: 0 18px; font-size: 12.5px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.25);"
                    onclick="AdminWeb.prepareAddBranchBottom()">
              <span>+ Thêm Chi Nhánh Mới</span>
            </button>
          </div>
        </div>

        <!-- Khối Bảng Chi Nhánh Có ID Độc Lập Để Không Mất Focus Khi Gõ -->
        <div id="adminBranchesContentContainer">
          ${this._renderBranchesTableContent(list, user, stylists, bookings, bMap)}
        </div>
        ${this._renderBranchBottomEditor()}
      `;
    },

    _renderBranchesTableContent(list, user, stylists, bookings, bMap) {
      this.branchesPage = this.branchesPage || 1;
      const brTotalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
      if (this.branchesPage > brTotalPages) this.branchesPage = brTotalPages;
      const pagedBranches = list.slice((this.branchesPage - 1) * this.pageSize, this.branchesPage * this.pageSize);

      return `
        <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
          <div style="overflow-x: auto;">
            <table class="admin-enterprise-table" style="width: 100%;">
              <thead>
                <tr>
                  <th style="width: 80px; padding: 12px 14px;">MÃ</th>
                  <th style="padding: 12px 14px;">CHI NHÁNH &amp; CƠ SỞ</th>
                  <th style="padding: 12px 14px;">ĐỊA CHỈ CỤ THỂ</th>
                  <th style="padding: 12px 14px;">HOTLINE</th>
                  <th style="padding: 12px 14px;">GIỜ MỞ</th>
                  <th style="padding: 12px 14px;">ĐỘI NGŨ</th>
                  <th style="padding: 12px 14px;">DOANH THU</th>
                  <th style="padding: 12px 14px;">TRẠNG THÁI</th>
                  <th style="text-align: center; width: 140px; padding: 12px 14px;">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                ${pagedBranches.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                      Không tìm thấy chi nhánh nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                ` : pagedBranches.map(b => {
                  const bStylists = stylists.filter(s => s.branchId === b.id || s.MaChiNhanh === b.id);
                  const bAnalytics = (window.store && typeof window.store.getRevenueAnalytics === 'function')
                    ? window.store.getRevenueAnalytics(b.id)
                    : { totalRevenue: 0 };
                  const bRevenue = bAnalytics.totalRevenue;
                  const bImg = b.image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80';
                  const bName = b.name || b.TenChiNhanh || b.id;
                  const bAddr = b.address || b.DiaChi || 'TP. Hồ Chí Minh';
                  const bPhone = b.phone || b.SoDienThoai || '0901111000';
                  const bHours = b.openHours || (b.openTime && b.closeTime ? `${b.openTime.substring(0,5)} - ${b.closeTime.substring(0,5)}` : '08:30 - 21:30');
                  const bStatus = b.status || 'Hoạt động';

                  return `
                    <tr id="adminBranchRow_${b.id}"
                        class="admin-branch-table-row ${(this.selectedBranchId && this.selectedBranchId === b.id) ? 'is-selected' : ''}"
                        onclick="AdminWeb.onBranchRowClick('${b.id}', event)"
                        style="cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease; ${(this.selectedBranchId && this.selectedBranchId === b.id) ? 'background: rgba(197, 155, 39, 0.16); box-shadow: inset 3px 0 0 #C59B27;' : ''}">
                      <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--text-primary); padding: 12px 14px;">
                        ${this.escapeHtml(b.id)}
                      </td>
                      <td style="padding: 12px 14px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                          <div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0; background: #111; display: flex; align-items: center; justify-content: center;">
                            <img src="${bImg}" alt="${this.escapeHtml(bName)}"
                                 style="width: 100%; height: 100%; object-fit: cover; object-position: ${b.imagePosition || '50% 50%'}; transform: scale(${b.imageZoom || 1});"
                                 onerror="this.src='https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80';">
                          </div>
                          <div>
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 13.5px;">${this.escapeHtml(bName)}</div>
                            <div style="font-size: 11.5px; color: var(--brand-accent); font-weight: 700;">${this.escapeHtml(b.city || 'TP. Hồ Chí Minh')}</div>
                          </div>
                        </div>
                      </td>
                      <td style="color: var(--text-secondary); font-size: 12.5px; max-width: 240px; padding: 12px 14px;">
                        ${this.escapeHtml(bAddr)}
                      </td>
                      <td style="padding: 12px 14px;">
                        <a href="tel:${bPhone}" onclick="event.stopPropagation()" style="color: #f59e0b; font-weight: 700; text-decoration: none; font-size: 12.5px;">
                          ${this.escapeHtml(bPhone)}
                        </a>
                      </td>
                      <td style="font-size: 12px; color: var(--text-secondary); padding: 12px 14px;">
                        ${this.escapeHtml(bHours)}
                      </td>
                      <td style="padding: 12px 14px;">
                        <span style="font-weight: 800; color: var(--text-primary);">${bStylists.length}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);"> thợ</span>
                      </td>
                      <td style="padding: 12px 14px;">
                        <strong style="color: #10b981; font-size: 13px; font-weight: 800;">
                          ${SalonUtils.formatCurrency(bRevenue)}
                        </strong>
                      </td>
                      <td style="padding: 12px 14px;">
                        <span class="status-pill ${bStatus === 'Hoạt động' ? 'status-completed' : 'status-cancelled'}" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px;">
                          ${this.escapeHtml(bStatus)}
                        </span>
                      </td>
                      <td style="text-align: center; padding: 12px 14px;">
                        <div style="display: inline-flex; gap: 6px;">
                          <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;"
                                  onclick="event.stopPropagation(); AdminWeb.editBranchBottom('${b.id}')" title="Chỉnh sửa thông tin chi nhánh ở bảng dưới đáy">
                            Sửa
                          </button>
                          <button class="pill-btn-outline" style="padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 6px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" 
                                  onclick="event.stopPropagation(); AdminWeb.openUniversalDeleteModal('branches', '${b.id}')" title="Xóa chi nhánh">
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ${this._renderPaginationControls(this.branchesPage, brTotalPages, list.length, 'AdminWeb.setBranchesPage', 'chi nhánh')}
        </div>
      `;
    },

    handleBranchSearch(val) {
      this.branchSearchQuery = val;
      this.branchesPage = 1;
      const clearBtn = document.getElementById('adminBranchSearchClear');
      if (clearBtn) clearBtn.style.display = val ? 'inline-flex' : 'none';
      this._updateBranchesContentOnly();
    },

    clearBranchSearch() {
      this.branchSearchQuery = '';
      this.branchesPage = 1;
      const input = document.getElementById('adminBranchSearchInput');
      if (input) {
        input.value = '';
        input.focus();
      }
      const clearBtn = document.getElementById('adminBranchSearchClear');
      if (clearBtn) clearBtn.style.display = 'none';
      this._updateBranchesContentOnly();
    },

    refreshBranchesView() {
      const container = document.getElementById('adminBranchesContentContainer');
      if (container) {
        this._updateBranchesContentOnly();
      } else {
        const content = document.getElementById('adminSubTabContent');
        if (content && this.adminSubTab === 'branches') {
          const user = this.getCurrentUser();
          const branches = window.store.getBranches();
          const stylists = window.store.getStylists();
          const bookings = window.store.getBookings();
          content.innerHTML = this.renderBranchesTab(user, branches, stylists, bookings);
        }
      }
    },

    _updateBranchesContentOnly() {
      const container = document.getElementById('adminBranchesContentContainer');
      if (!container) {
        this.refreshBranchesView();
        return;
      }
      const branches = window.store.getBranches();
      const stylists = window.store.getStylists();
      const bookings = window.store.getBookings();
      const user = this.getCurrentUser();
      const bMap = new Map(branches.map(b => [b.id, b]));

      let list = [...branches];
      if (this.branchCityFilter && this.branchCityFilter !== 'all') {
        list = list.filter(b =>
          b.id === this.branchCityFilter ||
          b.MaChiNhanh === this.branchCityFilter ||
          (b.name || '').toLowerCase().includes(this.branchCityFilter.toLowerCase()) ||
          (b.TenChiNhanh || '').toLowerCase().includes(this.branchCityFilter.toLowerCase()) ||
          (b.city || '').toLowerCase().includes(this.branchCityFilter.toLowerCase()) ||
          (b.address || '').toLowerCase().includes(this.branchCityFilter.toLowerCase())
        );
      }
      if (this.branchSearchQuery) {
        const q = this.branchSearchQuery.toLowerCase().trim();
        list = list.filter(b =>
          (b.name || b.TenChiNhanh || '').toLowerCase().includes(q) ||
          (b.address || b.DiaChi || '').toLowerCase().includes(q) ||
          (b.id || b.MaChiNhanh || '').toLowerCase().includes(q) ||
          (b.phone || b.SoDienThoai || '').includes(q)
        );
      }
      container.innerHTML = this._renderBranchesTableContent(list, user, stylists, bookings, bMap);
    },

    setBranchesPage(p) {
      this.branchesPage = p;
      this._updateBranchesContentOnly();
    },

    // -----------------------------------------------------------------------
    // INLINE BOTTOM BRANCH EDITOR (CHỈNH SỬA & THÊM MỚI Ở ĐÁY TRANG + LIVE IMAGE ADJUSTER)
    // -----------------------------------------------------------------------
    _renderBranchBottomEditor() {
      const branchPresets = [
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
      ];

      return `
        <div id="adminBranchBottomEditor" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px 26px; margin-top: 24px; width: 100%; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08)); padding-bottom: 16px; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--brand-accent, #C59B27);"></span>
              <h3 id="branchEditorTitle" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">
                Thêm Chi Nhánh Mới
              </h3>
            </div>
            <div>
              <button type="button" class="pill-btn-outline" style="padding: 5px 14px; font-size: 12px; font-weight: 600;" onclick="AdminWeb.resetBranchBottomEditor()">
                Đặt Lại / Làm Trống
              </button>
            </div>
          </div>

          <form id="branchBottomForm" onsubmit="event.preventDefault(); AdminWeb.submitBranchBottomEditor();">
            <input type="hidden" id="branchEditorId" value="">
            <input type="hidden" id="branchImgZoomRange" value="1.0">
            <input type="hidden" id="branchImgPanXRange" value="50">
            <input type="hidden" id="branchImgPanYRange" value="50">

            <div style="display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(340px, 380px); gap: 28px; align-items: start;">
              
              <!-- CỘT TRÁI: FORM LIỀN MẠCH -->
              <div style="display: flex; flex-direction: column;">
                
                <!-- PHẦN 1: THÔNG TIN CƠ SỞ & LIÊN HỆ -->
                <div style="margin-bottom: 6px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27); margin-bottom: 14px;">
                    Thông tin cơ sở &amp; liên hệ
                  </div>

                  <!-- Hàng 1: Tên Chi Nhánh & Hotline -->
                  <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 14px;">
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Tên Chi Nhánh / Cơ Sở <span style="color: #ef4444;">*</span>
                      </label>
                      <input type="text" id="branchEditorName" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                             placeholder="VD: Omni Salon Barber Q2 - Thảo Điền" 
                             oninput="AdminWeb.syncBranchPreviewCard();" required>
                    </div>
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Số Điện Thoại Hotline <span style="color: #ef4444;">*</span>
                      </label>
                      <input type="tel" id="branchEditorPhone" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                             placeholder="0901111xxx" 
                             oninput="AdminWeb.syncBranchPreviewCard();" required>
                    </div>
                  </div>

                  <!-- Hàng 2: Địa chỉ cụ thể & Tỉnh/Thành phố -->
                  <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 14px;">
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Địa Chỉ Cụ Thể <span style="color: #ef4444;">*</span>
                      </label>
                      <input type="text" id="branchEditorAddress" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                             placeholder="VD: 15 Quốc Hương, P. Thảo Điền, TP. Thủ Đức" 
                             oninput="AdminWeb.syncBranchPreviewCard();" required>
                    </div>
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Tỉnh / Thành Phố <span style="color: #ef4444;">*</span>
                      </label>
                      <select id="branchEditorCity" class="admin-select-filter" 
                              style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                              onchange="AdminWeb.syncBranchPreviewCard();" required>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Bình Dương">Bình Dương</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                      </select>
                    </div>
                  </div>

                  <!-- Hàng 3: Giờ mở cửa, Giờ đóng cửa, Trạng thái (3 cột) -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                    <div>
                      <label class="sub-label" style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Giờ Mở Cửa</label>
                      <input type="time" id="branchEditorOpenTime" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 10px;" 
                             value="08:30" 
                             oninput="AdminWeb.syncBranchPreviewCard();">
                    </div>
                    <div>
                      <label class="sub-label" style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Giờ Đóng Cửa</label>
                      <input type="time" id="branchEditorCloseTime" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 10px;" 
                             value="21:30" 
                             oninput="AdminWeb.syncBranchPreviewCard();">
                    </div>
                    <div>
                      <label class="sub-label" style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Trạng Thái</label>
                      <select id="branchEditorStatus" class="admin-select-filter" 
                              style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 10px;" 
                              onchange="AdminWeb.syncBranchPreviewCard();">
                        <option value="Hoạt động">Hoạt động</option>
                        <option value="Tạm nghỉ">Tạm nghỉ</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style="height: 1px; background: var(--border-color, rgba(255, 255, 255, 0.08)); margin: 20px 0 18px;"></div>

                <!-- PHẦN 2: HÌNH ẢNH MẶT TIỀN SALON -->
                <div>
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27); margin-bottom: 12px;">
                    Hình ảnh mặt tiền salon
                  </div>

                  <div style="margin-bottom: 14px;">
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Đường Dẫn Ảnh Hoặc Tải Tệp Trực Tiếp
                    </label>
                    <div style="display: flex; width: 100%; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--surface-elevated); transition: border-color 0.15s ease;">
                      <input type="url" id="branchEditorImageUrl" 
                             style="flex: 1; height: 38px; font-size: 12.5px; border: none; background: transparent; color: var(--text-primary); padding: 0 12px; outline: none;" 
                             placeholder="https://images.unsplash.com/..." 
                             value="${branchPresets[0]}"
                             oninput="AdminWeb.onBranchImgUrlChange(this.value);">
                      <label style="display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; font-size: 12px; font-weight: 600; color: var(--brand-accent, #C59B27); background: rgba(197, 155, 39, 0.08); border-left: 1px solid var(--border-color); cursor: pointer; user-select: none; transition: background 0.15s ease; white-space: nowrap;"
                             onmouseover="this.style.background='rgba(197, 155, 39, 0.18)';" 
                             onmouseout="this.style.background='rgba(197, 155, 39, 0.08)';">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span>Tải từ máy</span>
                        <input type="file" accept="image/*" style="display: none;" onchange="AdminWeb.onBranchFileUpload(this)">
                      </label>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                    <span style="font-size: 11.5px; color: var(--text-secondary); font-weight: 500;">
                      Kho ảnh mẫu chất lượng cao (Click để áp dụng):
                    </span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                      ${branchPresets.map((img, idx) => `
                        <img src="${img}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover; cursor: pointer; border: 1.5px solid rgba(255, 255, 255, 0.12); transition: transform 0.15s ease, border-color 0.15s ease;"
                             onmouseover="this.style.transform='scale(1.1)'; this.style.borderColor='var(--brand-accent)';" 
                             onmouseout="this.style.transform='scale(1)'; this.style.borderColor='rgba(255, 255, 255, 0.12)';"
                             onclick="AdminWeb.setBranchPresetImage('${img}');" title="Chọn mẫu ảnh ${idx + 1}">
                      `).join('')}
                    </div>
                  </div>
                </div>

              </div>

              <!-- CỘT PHẢI: DEMO THỰC TẾ TRÊN TRANG KHÁCH HÀNG (LIVE PREVIEW CARD 1:1) -->
              <div style="position: sticky; top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27);">
                    Xem trước trên web khách hàng (1:1)
                  </span>
                  <button type="button" class="pill-btn-outline" style="padding: 3px 9px; font-size: 11px; font-weight: 600;" onclick="AdminWeb.resetBranchImgAdjustments()" title="Đặt lại góc ảnh 1.0x · 50% 50%">
                    Đặt lại góc ảnh
                  </button>
                </div>

                <div class="branch-clean-card" style="border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; background: var(--surface-card, #181816); width: 100%; max-width: 380px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
                  
                  <div id="branchEditorMediaContainer" class="branch-media-box" 
                       style="position: relative; width: 100%; aspect-ratio: 16 / 10; min-height: 190px; overflow: hidden; cursor: grab; user-select: none; touch-action: none; background: #0c0a09;"
                       title="Bấm giữ chuột và kéo trực tiếp trên ảnh để đổi góc · Cuộn chuột để Phóng to/Thu nhỏ (Zoom)">
                    
                    <img id="branchEditorImgPreview" 
                         src="${branchPresets[0]}" 
                         alt="Xem trước chi nhánh"
                         class="branch-cover-img"
                         style="width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; transform-origin: 50% 50%; transform: scale(1); pointer-events: none; transition: transform 0.12s ease-out, object-position 0.12s ease-out;"
                         onerror="this.src='https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80';">

                    <div class="branch-badges-top" style="pointer-events: none; z-index: 3;">
                      <span id="branchPreviewDistrictBadge" class="branch-district-tag">TP.HCM</span>
                    </div>

                    <!-- THANH ĐIỀU KHIỂN MŨI TÊN & ZOOM TRỰC TIẾP TRÊN ẢNH -->
                    <div class="branch-photo-float-bar" 
                         onclick="event.stopPropagation();" 
                         ondblclick="event.stopPropagation(); event.preventDefault();"
                         style="position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; align-items: center; gap: 3px; padding: 3px 6px; background: rgba(18, 18, 18, 0.88); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 9999px; pointer-events: auto;">
                      <button type="button" class="btn-float-ctrl" 
                              onclick="event.stopPropagation();" 
                              ondblclick="event.stopPropagation(); event.preventDefault();" 
                              onmousedown="AdminWeb.startHoldAction('pan-left', event)" 
                              onmouseup="AdminWeb.stopHoldAction()" 
                              onmouseleave="AdminWeb.stopHoldAction()" 
                              ontouchstart="AdminWeb.startHoldAction('pan-left', event)" 
                              ontouchend="AdminWeb.stopHoldAction()" 
                              title="Dịch sang trái (←)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                      </button>
                      <button type="button" class="btn-float-ctrl" 
                              onclick="event.stopPropagation();" 
                              ondblclick="event.stopPropagation(); event.preventDefault();" 
                              onmousedown="AdminWeb.startHoldAction('pan-up', event)" 
                              onmouseup="AdminWeb.stopHoldAction()" 
                              onmouseleave="AdminWeb.stopHoldAction()" 
                              ontouchstart="AdminWeb.startHoldAction('pan-up', event)" 
                              ontouchend="AdminWeb.stopHoldAction()" 
                              title="Dịch lên trên (↑)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                      </button>
                      <button type="button" class="btn-float-ctrl" 
                              onclick="event.stopPropagation();" 
                              ondblclick="event.stopPropagation(); event.preventDefault();" 
                              onmousedown="AdminWeb.startHoldAction('pan-down', event)" 
                              onmouseup="AdminWeb.stopHoldAction()" 
                              onmouseleave="AdminWeb.stopHoldAction()" 
                              ontouchstart="AdminWeb.startHoldAction('pan-down', event)" 
                              ontouchend="AdminWeb.stopHoldAction()" 
                              title="Dịch xuống dưới (↓)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                      <button type="button" class="btn-float-ctrl" 
                              onclick="event.stopPropagation();" 
                              ondblclick="event.stopPropagation(); event.preventDefault();" 
                              onmousedown="AdminWeb.startHoldAction('pan-right', event)" 
                              onmouseup="AdminWeb.stopHoldAction()" 
                              onmouseleave="AdminWeb.stopHoldAction()" 
                              ontouchstart="AdminWeb.startHoldAction('pan-right', event)" 
                              ontouchend="AdminWeb.stopHoldAction()" 
                              title="Dịch sang phải (→)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      </button>

                      <span class="float-ctrl-sep" style="width: 1px; height: 14px; background: rgba(255, 255, 255, 0.22); margin: 0 3px;"></span>

                      <button type="button" class="btn-float-ctrl" 
                              onclick="event.stopPropagation();" 
                              ondblclick="event.stopPropagation(); event.preventDefault();" 
                              onmousedown="AdminWeb.startHoldAction('zoom-out', event)" 
                              onmouseup="AdminWeb.stopHoldAction()" 
                              onmouseleave="AdminWeb.stopHoldAction()" 
                              ontouchstart="AdminWeb.startHoldAction('zoom-out', event)" 
                              ontouchend="AdminWeb.stopHoldAction()" 
                              title="Thu nhỏ / Zoom out (-)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                      <button type="button" class="btn-float-ctrl" 
                              onclick="event.stopPropagation();" 
                              ondblclick="event.stopPropagation(); event.preventDefault();" 
                              onmousedown="AdminWeb.startHoldAction('zoom-in', event)" 
                              onmouseup="AdminWeb.stopHoldAction()" 
                              onmouseleave="AdminWeb.stopHoldAction()" 
                              ontouchstart="AdminWeb.startHoldAction('zoom-in', event)" 
                              ontouchend="AdminWeb.stopHoldAction()" 
                              title="Phóng to / Zoom in (+)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>

                      <span class="float-ctrl-sep" style="width: 1px; height: 14px; background: rgba(255, 255, 255, 0.22); margin: 0 3px;"></span>

                      <button type="button" class="btn-float-ctrl" 
                              onclick="event.stopPropagation(); AdminWeb.resetBranchImgAdjustments();" 
                              ondblclick="event.stopPropagation(); event.preventDefault();" 
                              title="Đặt lại góc ảnh (1.0x · 50% 50%)">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      </button>
                    </div>

                    <div id="branchPreviewStatusBox" class="branch-status-floating status-open" style="pointer-events: none; z-index: 3;">
                      <span class="status-indicator-dot"></span>
                      <span id="branchPreviewHoursBadge">Đang mở cửa · Đóng lúc 21:30</span>
                    </div>

                    <div id="branchEditorImgBadge" 
                         style="position: absolute; bottom: 10px; right: 10px; z-index: 3; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); color: #FAF8F5; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.18); pointer-events: none;">
                      Zoom: 1.0x · Vị trí: 50% 50%
                    </div>
                  </div>

                  <div class="branch-content-body" style="padding: 14px 16px 16px; pointer-events: none;">
                    <div>
                      <h3 id="branchPreviewNameTitle" class="branch-name-title font-serif tracking-tight leading-tight" style="font-size: 16px; margin-bottom: 8px;">
                        Omni Salon Barber
                      </h3>

                      <div class="branch-meta-specs" style="gap: 5px;">
                        <div class="branch-meta-item">
                          <span class="meta-label">Địa chỉ</span>
                          <span id="branchPreviewAddressVal" class="meta-value branch-address-val" style="font-size: 12px; line-height: 1.4;">120 Lê Lợi, P. Bến Thành, Q.1, TP.HCM</span>
                        </div>
                        <div class="branch-meta-item">
                          <span class="meta-label">Giờ mở</span>
                          <span id="branchPreviewHoursVal" class="meta-value" style="font-size: 12px;"><strong>08:30 - 21:30</strong></span>
                        </div>
                        <div class="branch-meta-item">
                          <span class="meta-label">Hotline</span>
                          <span id="branchPreviewPhoneVal" class="meta-value branch-phone-link" style="font-size: 12px; font-weight: 700; color: var(--brand-accent);">0901111000</span>
                        </div>
                      </div>
                    </div>

                    <div class="branch-actions-row" style="padding-top: 10px; opacity: 0.85; gap: 8px;">
                      <button type="button" class="branch-book-btn" style="height: 34px; font-size: 12px; font-weight: 700;">
                        Đặt Lịch Hẹn
                      </button>
                      <button type="button" class="branch-map-btn" style="height: 34px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); border-radius: 8px;">
                        Chỉ Đường
                      </button>
                    </div>
                  </div>

                </div>

                <div style="margin-top: 10px; font-size: 11px; color: var(--text-secondary); line-height: 1.4; text-align: center;">
                  Giữ chuột để kéo góc nhìn · Bấm nút trên ảnh hoặc cuộn chuột để phóng to
                </div>

              </div>

            </div>

            <!-- NÚT HÀNH ĐỘNG DƯỚI ĐÁY BẢNG -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));">
              <button type="button" class="pill-btn-outline" style="height: 38px; padding: 0 18px; font-weight: 600; font-size: 13px;" onclick="AdminWeb.resetBranchBottomEditor()">
                Hủy Bỏ / Làm Mới
              </button>
              <button type="submit" id="btnSubmitBranchBottom" 
                      style="height: 38px; padding: 0 24px; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; background: var(--brand-accent, #C59B27); color: #141413; transition: opacity 0.15s ease;"
                      onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
                <span>Lưu Chi Nhánh Mới</span>
              </button>
            </div>
          </form>
        </div>
      `;
    },

    onBranchRowClick(branchId, event) {
      if (event && event.target && (event.target.closest('button') || event.target.closest('a') || event.target.closest('input') || event.target.closest('.pill-btn-outline') || event.target.closest('label'))) {
        return;
      }
      this.editBranchBottom(branchId);
    },

    editBranchBottom(branchId) {
      if (!branchId) return;
      this.selectedBranchId = branchId;
      const b = window.store.getBranchById(branchId);
      if (!b) return;

      const idInput = document.getElementById('branchEditorId');
      if (idInput) idInput.value = b.id || '';

      const title = document.getElementById('branchEditorTitle');
      if (title) title.innerHTML = `Chỉnh sửa chi nhánh [${b.id}] · ${this.escapeHtml(b.name || b.TenChiNhanh)}`;

      const submitBtn = document.getElementById('btnSubmitBranchBottom');
      if (submitBtn) submitBtn.innerHTML = `<span>Cập Nhật Chi Nhánh #${b.id}</span>`;

      const nameInp = document.getElementById('branchEditorName');
      if (nameInp) nameInp.value = b.name || b.TenChiNhanh || '';

      const addrInp = document.getElementById('branchEditorAddress');
      if (addrInp) addrInp.value = b.address || b.DiaChi || '';

      const phoneInp = document.getElementById('branchEditorPhone');
      if (phoneInp) phoneInp.value = b.phone || b.SoDienThoai || '';

      const citySel = document.getElementById('branchEditorCity');
      if (citySel) citySel.value = b.city || 'TP. Hồ Chí Minh';

      const openInp = document.getElementById('branchEditorOpenTime');
      if (openInp) openInp.value = (b.openTime || '08:30').substring(0, 5);

      const closeInp = document.getElementById('branchEditorCloseTime');
      if (closeInp) closeInp.value = (b.closeTime || '21:30').substring(0, 5);

      const statusSel = document.getElementById('branchEditorStatus');
      if (statusSel) statusSel.value = b.status || 'Hoạt động';

      const imgUrl = b.image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80';
      const urlInp = document.getElementById('branchEditorImageUrl');
      if (urlInp) urlInp.value = imgUrl;

      let zoom = Number(b.imageZoom || 1.0);
      let panX = b.imagePanX !== undefined ? Number(b.imagePanX) : 50;
      let panY = b.imagePanY !== undefined ? Number(b.imagePanY) : 50;
      if (b.imagePanX === undefined && b.imagePosition && b.imagePosition.includes('%')) {
        const parts = b.imagePosition.split(' ');
        if (parts.length === 2) {
          panX = parseFloat(parts[0]) || 50;
          panY = parseFloat(parts[1]) || 50;
        }
      }

      this._applyBranchImgTransform(imgUrl, zoom, panX, panY);

      document.querySelectorAll('[id^="adminBranchRow_"]').forEach(r => {
        r.style.background = '';
        r.style.boxShadow = '';
        r.classList.remove('is-selected');
      });
      const activeRow = document.getElementById(`adminBranchRow_${b.id}`);
      if (activeRow) {
        activeRow.style.background = 'rgba(197, 155, 39, 0.16)';
        activeRow.style.boxShadow = 'inset 3px 0 0 #C59B27';
        activeRow.classList.add('is-selected');
      }

      this.syncBranchPreviewCard();
      this.initBranchImageInteractions();

      const editor = document.getElementById('adminBranchBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },

    prepareAddBranchBottom() {
      this.selectedBranchId = null;
      this.resetBranchBottomEditor();
      const editor = document.getElementById('adminBranchBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const nameInp = document.getElementById('branchEditorName');
        if (nameInp) nameInp.focus();
      }
    },

    resetBranchBottomEditor() {
      this.selectedBranchId = null;
      const idInput = document.getElementById('branchEditorId');
      if (idInput) idInput.value = '';

      const title = document.getElementById('branchEditorTitle');
      if (title) title.innerHTML = `Thêm Chi Nhánh Mới`;

      const submitBtn = document.getElementById('btnSubmitBranchBottom');
      if (submitBtn) submitBtn.innerHTML = `<span>Lưu Chi Nhánh Mới</span>`;

      const nameInp = document.getElementById('branchEditorName');
      if (nameInp) nameInp.value = '';

      const addrInp = document.getElementById('branchEditorAddress');
      if (addrInp) addrInp.value = '';

      const phoneInp = document.getElementById('branchEditorPhone');
      if (phoneInp) phoneInp.value = '';

      const citySel = document.getElementById('branchEditorCity');
      if (citySel) citySel.value = 'TP. Hồ Chí Minh';

      const openInp = document.getElementById('branchEditorOpenTime');
      if (openInp) openInp.value = '08:30';

      const closeInp = document.getElementById('branchEditorCloseTime');
      if (closeInp) closeInp.value = '21:30';

      const statusSel = document.getElementById('branchEditorStatus');
      if (statusSel) statusSel.value = 'Hoạt động';

      const defaultImg = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80';
      const urlInp = document.getElementById('branchEditorImageUrl');
      if (urlInp) urlInp.value = defaultImg;

      this.resetBranchImgAdjustments();

      document.querySelectorAll('[id^="adminBranchRow_"]').forEach(r => {
        r.style.background = '';
        r.style.boxShadow = '';
        r.classList.remove('is-selected');
      });
      this.syncBranchPreviewCard();
      this.initBranchImageInteractions();
    },

    _applyBranchImgTransform(imgUrl, zoom, panX, panY, isDirectDrag = false) {
      if (!this.branchTransform) {
        this.branchTransform = { zoom: 1.0, panX: 50, panY: 50 };
      }
      const curZ = this.branchTransform.zoom !== undefined ? this.branchTransform.zoom : 1.0;
      const curX = this.branchTransform.panX !== undefined ? this.branchTransform.panX : 50;
      const curY = this.branchTransform.panY !== undefined ? this.branchTransform.panY : 50;

      const rawZ = (zoom !== null && zoom !== undefined && !isNaN(Number(zoom))) ? Number(zoom) : curZ;
      const rawX = (panX !== null && panX !== undefined && !isNaN(Number(panX))) ? Number(panX) : curX;
      const rawY = (panY !== null && panY !== undefined && !isNaN(Number(panY))) ? Number(panY) : curY;

      const z = Math.min(2.5, Math.max(0.8, Math.round(rawZ * 100) / 100));
      const px = Math.min(100, Math.max(0, Math.round(rawX)));
      const py = Math.min(100, Math.max(0, Math.round(rawY)));

      this.branchTransform = { zoom: z, panX: px, panY: py };

      const preview = document.getElementById('branchEditorImgPreview');
      if (preview) {
        if (imgUrl) preview.src = imgUrl;
        preview.style.transformOrigin = '50% 50%';
        preview.style.transform = `scale(${z})`;
        preview.style.objectPosition = `${px}% ${py}%`;
        if (isDirectDrag) {
          preview.style.transition = 'none';
        } else {
          preview.style.transition = 'transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1), object-position 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)';
        }
      }

      const zoomRange = document.getElementById('branchImgZoomRange');
      if (zoomRange) zoomRange.value = z;

      const panXRange = document.getElementById('branchImgPanXRange');
      if (panXRange) panXRange.value = px;

      const panYRange = document.getElementById('branchImgPanYRange');
      if (panYRange) panYRange.value = py;

      const badge = document.getElementById('branchEditorImgBadge');
      if (badge) {
        badge.textContent = `Zoom: ${z.toFixed(1)}x · Vị trí: ${px}% ${py}%`;
      }
    },

    onBranchImgZoomInput(val) {
      const zoom = Number(val);
      const panX = this.branchTransform?.panX ?? Number(document.getElementById('branchImgPanXRange')?.value || 50);
      const panY = this.branchTransform?.panY ?? Number(document.getElementById('branchImgPanYRange')?.value || 50);
      this._applyBranchImgTransform(null, zoom, panX, panY);
    },

    adjustBranchImgZoom(delta) {
      const current = this.branchTransform?.zoom ?? Number(document.getElementById('branchImgZoomRange')?.value || 1.0);
      const next = Math.min(2.5, Math.max(0.8, Math.round((current + delta) * 100) / 100));
      const panX = this.branchTransform?.panX ?? Number(document.getElementById('branchImgPanXRange')?.value || 50);
      const panY = this.branchTransform?.panY ?? Number(document.getElementById('branchImgPanYRange')?.value || 50);
      this._applyBranchImgTransform(null, next, panX, panY);
    },

    onBranchImgPanXInput(val) {
      const panX = Number(val);
      const zoom = this.branchTransform?.zoom ?? Number(document.getElementById('branchImgZoomRange')?.value || 1.0);
      const panY = this.branchTransform?.panY ?? Number(document.getElementById('branchImgPanYRange')?.value || 50);
      this._applyBranchImgTransform(null, zoom, panX, panY);
    },

    adjustBranchImgPanX(delta) {
      const current = this.branchTransform?.panX ?? Number(document.getElementById('branchImgPanXRange')?.value || 50);
      const next = Math.min(100, Math.max(0, Math.round(current + delta)));
      const zoom = this.branchTransform?.zoom ?? Number(document.getElementById('branchImgZoomRange')?.value || 1.0);
      const panY = this.branchTransform?.panY ?? Number(document.getElementById('branchImgPanYRange')?.value || 50);
      this._applyBranchImgTransform(null, zoom, next, panY);
    },

    onBranchImgPanYInput(val) {
      const panY = Number(val);
      const zoom = this.branchTransform?.zoom ?? Number(document.getElementById('branchImgZoomRange')?.value || 1.0);
      const panX = this.branchTransform?.panX ?? Number(document.getElementById('branchImgPanXRange')?.value || 50);
      this._applyBranchImgTransform(null, zoom, panX, panY);
    },

    adjustBranchImgPanY(delta) {
      const current = this.branchTransform?.panY ?? Number(document.getElementById('branchImgPanYRange')?.value || 50);
      const next = Math.min(100, Math.max(0, Math.round(current + delta)));
      const zoom = this.branchTransform?.zoom ?? Number(document.getElementById('branchImgZoomRange')?.value || 1.0);
      const panX = this.branchTransform?.panX ?? Number(document.getElementById('branchImgPanXRange')?.value || 50);
      this._applyBranchImgTransform(null, zoom, panX, next);
    },

    startHoldAction(action, e) {
      if (e) {
        if (e.stopPropagation) e.stopPropagation();
      }
      this.stopHoldAction();
      this._executeHoldAction(action, true);
      this._holdTimer = setTimeout(() => {
        this._holdInterval = setInterval(() => {
          this._executeHoldAction(action, false);
        }, 50);
      }, 220);
    },

    stopHoldAction() {
      if (this._holdTimer) {
        clearTimeout(this._holdTimer);
        this._holdTimer = null;
      }
      if (this._holdInterval) {
        clearInterval(this._holdInterval);
        this._holdInterval = null;
      }
    },

    _executeHoldAction(action, isSingleClick = false) {
      const stepPan = isSingleClick ? 4 : 2;
      const stepZoom = isSingleClick ? 0.08 : 0.03;
      if (action === 'pan-left') this.adjustBranchImgPanX(-stepPan);
      else if (action === 'pan-right') this.adjustBranchImgPanX(stepPan);
      else if (action === 'pan-up') this.adjustBranchImgPanY(-stepPan);
      else if (action === 'pan-down') this.adjustBranchImgPanY(stepPan);
      else if (action === 'zoom-in') this.adjustBranchImgZoom(stepZoom);
      else if (action === 'zoom-out') this.adjustBranchImgZoom(-stepZoom);
    },

    syncBranchPreviewCard() {
      const name = (document.getElementById('branchEditorName')?.value || '').trim() || 'Omni Salon Barber';
      const address = (document.getElementById('branchEditorAddress')?.value || '').trim() || 'TP. Hồ Chí Minh';
      const phone = (document.getElementById('branchEditorPhone')?.value || '').trim() || '0901111000';
      const city = document.getElementById('branchEditorCity')?.value || 'TP. Hồ Chí Minh';
      const openTime = (document.getElementById('branchEditorOpenTime')?.value || '08:30').substring(0, 5);
      const closeTime = (document.getElementById('branchEditorCloseTime')?.value || '21:30').substring(0, 5);
      const status = document.getElementById('branchEditorStatus')?.value || 'Hoạt động';

      const titleEl = document.getElementById('branchPreviewNameTitle');
      if (titleEl) titleEl.textContent = name;

      const addrEl = document.getElementById('branchPreviewAddressVal');
      if (addrEl) addrEl.textContent = address;

      let district = 'TP.HCM';
      const m = address.match(/Quận\s*\d+|TP\.\s*Thủ\s*Đức|Bình\s*Thạnh|Gò\s*Vấp|Tân\s*Bình|Phú\s*Nhuận|Ba\s*Đình|Hoàn\s*Kiếm|Cầu\s*Giấy|Hải\s*Châu/i);
      if (m) {
        district = m[0];
      } else if (city && city !== 'TP. Hồ Chí Minh') {
        district = city;
      }
      const distEl = document.getElementById('branchPreviewDistrictBadge');
      if (distEl) distEl.textContent = district;

      const hoursFormatted = `${openTime} - ${closeTime}`;
      const hoursValEl = document.getElementById('branchPreviewHoursVal');
      if (hoursValEl) hoursValEl.innerHTML = `<strong>${hoursFormatted}</strong>`;

      const hoursBadgeEl = document.getElementById('branchPreviewHoursBadge');
      const statusBox = document.getElementById('branchPreviewStatusBox');
      if (status === 'Tạm nghỉ') {
        if (hoursBadgeEl) hoursBadgeEl.textContent = `Tạm nghỉ · Mở lúc ${openTime}`;
        if (statusBox) statusBox.className = 'branch-status-floating status-closed';
      } else {
        if (hoursBadgeEl) hoursBadgeEl.textContent = `Đang mở cửa · Đóng lúc ${closeTime}`;
        if (statusBox) statusBox.className = 'branch-status-floating status-open';
      }

      const phoneEl = document.getElementById('branchPreviewPhoneVal');
      if (phoneEl) {
        phoneEl.textContent = phone;
        phoneEl.href = `tel:${phone}`;
      }
    },

    initBranchImageInteractions() {
      const container = document.getElementById('branchEditorMediaContainer');
      if (!container) return;
      if (container.dataset.interactionsAttached === 'true') return;
      container.dataset.interactionsAttached = 'true';

      let isDragging = false;
      let startX = 0, startY = 0;
      let startPanX = 50, startPanY = 50;
      let rafId = null;
      let curClientX = 0, curClientY = 0;

      const onStart = (clientX, clientY) => {
        isDragging = true;
        startX = clientX;
        startY = clientY;
        curClientX = clientX;
        curClientY = clientY;
        startPanX = AdminWeb.branchTransform?.panX ?? Number(document.getElementById('branchImgPanXRange')?.value || 50);
        startPanY = AdminWeb.branchTransform?.panY ?? Number(document.getElementById('branchImgPanYRange')?.value || 50);
        container.classList.add('is-dragging');
        container.style.cursor = 'grabbing';
      };

      const updateDrag = () => {
        if (!isDragging) return;
        const rect = container.getBoundingClientRect();
        if (rect.width && rect.height) {
          const deltaX = curClientX - startX;
          const deltaY = curClientY - startY;

          const shiftX = (deltaX / rect.width) * 100;
          const shiftY = (deltaY / rect.height) * 100;

          const newPanX = Math.min(100, Math.max(0, Math.round(startPanX - shiftX)));
          const newPanY = Math.min(100, Math.max(0, Math.round(startPanY - shiftY)));
          const zoom = AdminWeb.branchTransform?.zoom ?? Number(document.getElementById('branchImgZoomRange')?.value || 1.0);

          AdminWeb._applyBranchImgTransform(null, zoom, newPanX, newPanY, true);
        }
        rafId = null;
      };

      const onMove = (clientX, clientY) => {
        if (!isDragging) return;
        curClientX = clientX;
        curClientY = clientY;
        if (!rafId) {
          rafId = requestAnimationFrame(updateDrag);
        }
      };

      const onEnd = () => {
        if (isDragging) {
          isDragging = false;
          container.classList.remove('is-dragging');
          container.style.cursor = 'grab';
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          const zoom = AdminWeb.branchTransform?.zoom ?? Number(document.getElementById('branchImgZoomRange')?.value || 1.0);
          const panX = AdminWeb.branchTransform?.panX ?? Number(document.getElementById('branchImgPanXRange')?.value || 50);
          const panY = AdminWeb.branchTransform?.panY ?? Number(document.getElementById('branchImgPanYRange')?.value || 50);
          AdminWeb._applyBranchImgTransform(null, zoom, panX, panY, false);
        }
      };

      container.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('.branch-photo-float-bar') || e.target.closest('button')) return;
        e.preventDefault();
        onStart(e.clientX, e.clientY);
      });

      window.addEventListener('mousemove', (e) => {
        if (isDragging) {
          e.preventDefault();
          onMove(e.clientX, e.clientY);
        }
      });

      window.addEventListener('mouseup', () => {
        onEnd();
      });

      container.addEventListener('touchstart', (e) => {
        if (e.target.closest('.branch-photo-float-bar') || e.target.closest('button')) return;
        if (e.touches && e.touches.length === 1) {
          onStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches && e.touches.length === 1) {
          onMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        onEnd();
      });

      container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        AdminWeb.adjustBranchImgZoom(delta);
      }, { passive: false });

      container.tabIndex = 0;
      container.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-'].includes(e.key)) {
          e.preventDefault();
          if (e.key === 'ArrowLeft') AdminWeb.adjustBranchImgPanX(-3);
          if (e.key === 'ArrowRight') AdminWeb.adjustBranchImgPanX(3);
          if (e.key === 'ArrowUp') AdminWeb.adjustBranchImgPanY(-3);
          if (e.key === 'ArrowDown') AdminWeb.adjustBranchImgPanY(3);
          if (e.key === '+' || e.key === '=') AdminWeb.adjustBranchImgZoom(0.05);
          if (e.key === '-' || e.key === '_') AdminWeb.adjustBranchImgZoom(-0.05);
        }
      });
    },

    resetBranchImgAdjustments() {
      const url = document.getElementById('branchEditorImageUrl')?.value || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80';
      this._applyBranchImgTransform(url, 1.0, 50, 50);
    },

    onBranchImgUrlChange(url) {
      const zoom = Number(document.getElementById('branchImgZoomRange')?.value || 1.0);
      const panX = Number(document.getElementById('branchImgPanXRange')?.value || 50);
      const panY = Number(document.getElementById('branchImgPanYRange')?.value || 50);
      this._applyBranchImgTransform(url, zoom, panX, panY);
    },

    setBranchPresetImage(url) {
      const urlInp = document.getElementById('branchEditorImageUrl');
      if (urlInp) urlInp.value = url;
      this.onBranchImgUrlChange(url);
    },

    onBranchFileUpload(input) {
      if (!input || !input.files || !input.files[0]) return;
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        const urlInp = document.getElementById('branchEditorImageUrl');
        if (urlInp) urlInp.value = base64;
        this.onBranchImgUrlChange(base64);
        if (window.UICommon) window.UICommon.showToast('Đã tải ảnh lên! Bạn có thể căn chỉnh góc chụp trực tiếp trên ảnh.', 'info');
      };
      reader.readAsDataURL(file);
    },

    submitBranchBottomEditor() {
      const branchId = (document.getElementById('branchEditorId')?.value || '').trim();
      const name = (document.getElementById('branchEditorName')?.value || '').trim();
      const address = (document.getElementById('branchEditorAddress')?.value || '').trim();
      const phone = (document.getElementById('branchEditorPhone')?.value || '').trim();
      const city = document.getElementById('branchEditorCity')?.value || 'TP. Hồ Chí Minh';
      const openTime = document.getElementById('branchEditorOpenTime')?.value || '08:30';
      const closeTime = document.getElementById('branchEditorCloseTime')?.value || '21:30';
      const status = document.getElementById('branchEditorStatus')?.value || 'Hoạt động';
      const image = (document.getElementById('branchEditorImageUrl')?.value || '').trim();
      const imageZoom = this.branchTransform?.zoom ?? Number(document.getElementById('branchImgZoomRange')?.value || 1.0);
      const imagePanX = this.branchTransform?.panX ?? Number(document.getElementById('branchImgPanXRange')?.value || 50);
      const imagePanY = this.branchTransform?.panY ?? Number(document.getElementById('branchImgPanYRange')?.value || 50);
      const imagePosition = `${imagePanX}% ${imagePanY}%`;

      if (!name || !address || !phone) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng điền đầy đủ Tên, Địa chỉ và Số điện thoại chi nhánh!', 'warning');
        return;
      }

      const branchData = {
        name,
        TenChiNhanh: name,
        address,
        DiaChi: address,
        phone,
        SoDienThoai: phone,
        city,
        openTime: openTime.length === 5 ? `${openTime}:00` : openTime,
        closeTime: closeTime.length === 5 ? `${closeTime}:00` : closeTime,
        openHours: `${openTime.substring(0, 5)} - ${closeTime.substring(0, 5)}`,
        status,
        image: image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80',
        imageZoom,
        imagePanX,
        imagePanY,
        imagePosition
      };

      if (branchId) {
        window.store.updateBranch(branchId, branchData);
        if (window.UICommon) window.UICommon.showToast(`Đã cập nhật chi nhánh [${name}] thành công!`, 'success');
      } else {
        const created = window.store.addBranch(branchData);
        if (window.UICommon) window.UICommon.showToast(`Đã thêm mới chi nhánh [${name}] (#${created.id}) thành công!`, 'success');
      }

      this._updateBranchesContentOnly();
      this.resetBranchBottomEditor();

      const table = document.getElementById('adminBranchesContentContainer');
      if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    openAddBranchModal(branchId = null) {
      const br = branchId ? window.store.getBranchById(branchId) : null;
      const isEdit = !!br;
      const branchPresets = [
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=600&q=80'
      ];
      const currentImage = br?.image || branchPresets[0];

      this._openModal(`
        <div style="max-width: 540px; margin: 0 auto;">
          <div class="badge-terracotta">HỆ THỐNG CHI NHÁNH</div>
          <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0 6px; color: #FFFFFF;">
            ${isEdit ? 'CHỈNH SỬA CHI NHÁNH' : 'THÊM CHI NHÁNH MỚI'}
          </h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 16px;">
            Dữ liệu chi nhánh được đồng bộ trực tiếp vào hệ thống OmniSalon.
          </p>

          <form onsubmit="event.preventDefault(); AdminWeb.submitBranchForm('${branchId || ''}');">
            <div style="margin-bottom: 12px;">
              <label class="sub-label">Tên Chi Nhánh / Cơ Sở: <span style="color:#ef4444;">*</span></label>
              <input type="text" id="brName" class="form-control-custom" placeholder="VD: Men Salon Barber Q2 - Thảo Điền" value="${this.escapeHtml(br?.name || br?.TenChiNhanh || '')}" required>
            </div>

            <div style="margin-bottom: 12px;">
              <label class="sub-label">Địa Chỉ Cụ Thể: <span style="color:#ef4444;">*</span></label>
              <input type="text" id="brAddress" class="form-control-custom" placeholder="VD: 15 Quốc Hương, P. Thảo Điền, TP. Thủ Đức, TP.HCM" value="${this.escapeHtml(br?.address || br?.DiaChi || '')}" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Số Điện Thoại Hotline: <span style="color:#ef4444;">*</span></label>
                <input type="tel" id="brPhone" class="form-control-custom" placeholder="0901111xxx" value="${this.escapeHtml(br?.phone || br?.SoDienThoai || '')}" required>
              </div>
              <div>
                <label class="sub-label">Tỉnh / Thành Phố: <span style="color:#ef4444;">*</span></label>
                <select id="brCity" class="form-control-custom" required>
                  <option value="TP. Hồ Chí Minh" ${(br?.city === 'TP. Hồ Chí Minh' || !br?.city) ? 'selected' : ''}>TP. Hồ Chí Minh</option>
                  <option value="Hà Nội" ${br?.city === 'Hà Nội' ? 'selected' : ''}>Hà Nội</option>
                  <option value="Đà Nẵng" ${br?.city === 'Đà Nẵng' ? 'selected' : ''}>Đà Nẵng</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Giờ Mở Cửa:</label>
                <input type="time" id="brOpenTime" class="form-control-custom" value="${br?.openTime || '08:30'}">
              </div>
              <div>
                <label class="sub-label">Giờ Đóng Cửa:</label>
                <input type="time" id="brCloseTime" class="form-control-custom" value="${br?.closeTime || '21:30'}">
              </div>
              <div>
                <label class="sub-label">Trạng Thái:</label>
                <select id="brStatus" class="form-control-custom">
                  <option value="Hoạt động" ${(br?.status === 'Hoạt động' || !br?.status) ? 'selected' : ''}>Hoạt động</option>
                  <option value="Tạm nghỉ" ${br?.status === 'Tạm nghỉ' ? 'selected' : ''}>Tạm nghỉ</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label class="sub-label">Hình Ảnh Chi Nhánh (URL):</label>
              <input type="url" id="brImage" class="form-control-custom" placeholder="https://..." value="${this.escapeHtml(currentImage)}">
              <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center; flex-wrap: wrap;">
                <span style="font-size: 11px; color: var(--text-secondary);">Chọn mẫu không gian:</span>
                ${branchPresets.map((img, idx) => `
                  <img src="${img}" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover; cursor: pointer; border: 1px solid var(--border-color);"
                       onclick="document.getElementById('brImage').value='${img}';" title="Mẫu ${idx + 1}">
                `).join('')}
              </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="button" class="btn-cancel" style="flex: 1; min-height: 44px; font-weight: 700;" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
              <button type="submit" class="btn-submit-terracotta" style="flex: 1.3; min-height: 44px; font-weight: 800;">
                ${isEdit ? 'Cập Nhật Chi Nhánh' : 'Lưu Chi Nhánh Mới'}
              </button>
            </div>
          </form>
        </div>
      `);
    },

    submitBranchForm(branchId) {
      const name = (document.getElementById('brName')?.value || '').trim();
      const address = (document.getElementById('brAddress')?.value || '').trim();
      const phone = (document.getElementById('brPhone')?.value || '').trim();
      const city = document.getElementById('brCity')?.value || 'TP. Hồ Chí Minh';
      const openTime = document.getElementById('brOpenTime')?.value || '08:30';
      const closeTime = document.getElementById('brCloseTime')?.value || '21:30';
      const status = document.getElementById('brStatus')?.value || 'Hoạt động';
      const image = (document.getElementById('brImage')?.value || '').trim();

      if (!name || !address || !phone) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng điền đầy đủ tên, địa chỉ và số điện thoại chi nhánh!', 'warning');
        return;
      }

      const branchData = {
        name,
        TenChiNhanh: name,
        address,
        DiaChi: address,
        phone,
        SoDienThoai: phone,
        city,
        openTime: openTime.length === 5 ? `${openTime}:00` : openTime,
        closeTime: closeTime.length === 5 ? `${closeTime}:00` : closeTime,
        openHours: `${openTime.substring(0, 5)} - ${closeTime.substring(0, 5)}`,
        status,
        image: image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80'
      };

      if (branchId) {
        window.store.updateBranch(branchId, branchData);
        if (window.UICommon) window.UICommon.showToast(`Đã cập nhật chi nhánh [${name}] vào database SQL!`);
      } else {
        const created = window.store.addBranch(branchData);
        if (window.UICommon) window.UICommon.showToast(`Đã thêm mới chi nhánh [${name}] (#${created.id}) vào database SQL!`);
      }

      this._closeModal();
      this.refreshSubTab();
    }
  });

})(typeof window !== 'undefined' ? window : this);
