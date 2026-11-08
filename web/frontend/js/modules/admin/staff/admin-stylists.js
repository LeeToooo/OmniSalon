// ============================================================================
// Omni Salon: PHÂN HỆ QUẢN TRỊ - ĐỘI NGŨ STYLIST & NHÂN VIÊN (STYLISTS)
// File tách độc lập để tối ưu tốc độ và giảm tải IDE
// ============================================================================

(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  Object.assign(window.AdminWeb, {
    stylistsPage: 1,
    stylistSearchQuery: '',
    filterStylistRole: 'all',

    // -----------------------------------------------------------------------
    // SUB-TAB 3: ĐỘI NGŨ BARBER & HOA HỒNG, ZERO N+1 WITH STATS MAP
    // -----------------------------------------------------------------------
    renderStylistsTab(user, stylists, branches, bookings = null, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      const allBookings = bookings || ((window.store && window.store.getBookings) ? window.store.getBookings() : []);

      let filteredStylists = [...stylists].filter(s => (s.id || s.MaNhanVien) !== 'NV00' && !String(s.name || s.HoTen || '').toLowerCase().includes('lê minh hoàng'));
      if (this.isBranchManager(user) && user.branchId && user.branchId !== 'ALL') {
        filteredStylists = filteredStylists.filter(s => (s.branchId === user.branchId || s.MaChiNhanh === user.branchId));
      } else if (this.filterBranch && this.filterBranch !== 'all') {
        filteredStylists = filteredStylists.filter(s => s.branchId === this.filterBranch);
      }

      if (this.filterStylistRole && this.filterStylistRole !== 'all') {
        filteredStylists = filteredStylists.filter(s => {
          const r = (s.role || s.ChucVu || '').toLowerCase();
          if (this.filterStylistRole === 'Thợ chính') return r.includes('chính');
          if (this.filterStylistRole === 'Thợ phụ') return r.includes('phụ');
          if (this.filterStylistRole === 'Quản lý chi nhánh') return r.includes('quản lý');
          if (this.filterStylistRole === 'Thu ngân') return r.includes('thu ngân') || r === 'cashier';
          return true;
        });
      }

      if (this.stylistSearchQuery) {
        const q = this.stylistSearchQuery.toLowerCase().trim();
        filteredStylists = filteredStylists.filter(s =>
          (s.name || s.HoTen || '').toLowerCase().includes(q) ||
          (s.id || s.MaNhanVien || '').toLowerCase().includes(q) ||
          (s.phone || s.SoDienThoai || '').includes(q) ||
          (s.specialty || '').toLowerCase().includes(q)
        );
      }

      return `
        <!-- Toolbar Dạng Thẻ Độc Lập -->
        <div class="admin-filter-bar" style="border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: var(--surface-card); border: 1px solid var(--border-color); box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex: 1;">
            <div style="position: relative; min-width: 260px; max-width: 380px; flex: 1;">
              <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; display: flex; align-items: center; color: var(--text-secondary);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input type="text" id="adminStylistSearchInput" class="form-control-custom"
                     style="padding-left: 38px !important; padding-right: 32px !important; height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated);"
                     placeholder="Tìm theo tên thợ, mã, SĐT..."
                     value="${this.escapeHtml(this.stylistSearchQuery || '')}"
                     oninput="AdminWeb.handleStylistSearch(this.value);">
              <button type="button" id="adminStylistSearchClear"
                      onclick="AdminWeb.clearStylistSearch();"
                      style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 14px; padding: 4px; display: ${this.stylistSearchQuery ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; z-index: 2;"
                      title="Xóa tìm kiếm">✕</button>
            </div>

            <!-- Lọc Chi Nhánh -->
            <div style="display: flex; align-items: center; gap: 6px;">
              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta" style="font-size: 11px;">Chi nhánh của bạn</span>
              ` : `
                <select class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; padding: 0 12px; border: 1px solid var(--border-color); background: var(--surface-elevated);"
                        onchange="AdminWeb.filterBranch = this.value; AdminWeb.stylistsPage = 1; AdminWeb._updateStylistsContentOnly();">
                  <option value="all" ${(!this.filterBranch || this.filterBranch === 'all') ? 'selected' : ''}>Tất cả chi nhánh</option>
                  ${branches.map(b => `<option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                </select>
              `}
            </div>

            <!-- Lọc Vai Trò Nhân Viên -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <select class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; padding: 0 12px; border: 1px solid var(--border-color); background: var(--surface-elevated);"
                      onchange="AdminWeb.filterStylistRole = this.value; AdminWeb.stylistsPage = 1; AdminWeb._updateStylistsContentOnly();">
                <option value="all" ${(!this.filterStylistRole || this.filterStylistRole === 'all') ? 'selected' : ''}>Tất cả vai trò</option>
                <option value="Thợ chính" ${this.filterStylistRole === 'Thợ chính' ? 'selected' : ''}>Thợ chính</option>
                <option value="Thợ phụ" ${this.filterStylistRole === 'Thợ phụ' ? 'selected' : ''}>Thợ phụ</option>
                <option value="Quản lý chi nhánh" ${this.filterStylistRole === 'Quản lý chi nhánh' ? 'selected' : ''}>Quản lý</option>
                <option value="Thu ngân" ${this.filterStylistRole === 'Thu ngân' ? 'selected' : ''}>Thu ngân</option>
              </select>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="btn-submit-terracotta" style="height: 38px; padding: 0 18px; font-size: 12.5px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.25);" onclick="AdminWeb.prepareAddStylistBottom()">
              <span>+ Thêm Nhân Viên Mới</span>
            </button>
          </div>
        </div>

        <div id="adminStylistsContentContainer">
          ${this._renderStylistsCardsContent(filteredStylists, user, bMap, allBookings)}
        </div>

        <!-- FORM THÊM / CHỈNH SỬA NHÂN VIÊN NẰM DƯỚI BẢNG -->
        ${this._renderStylistBottomEditor(user, branches)}
      `;
    },

    _renderStylistsCardsContent(filteredStylists, user, bMap, allBookings) {
      const stylistStatsMap = this._getStylistStatsMap ? this._getStylistStatsMap(filteredStylists, allBookings) : new Map();

      this.stylistsPage = this.stylistsPage || 1;
      const stylTotalPages = Math.max(1, Math.ceil(filteredStylists.length / this.pageSize));
      if (this.stylistsPage > stylTotalPages) this.stylistsPage = stylTotalPages;
      const pagedStylists = filteredStylists.slice((this.stylistsPage - 1) * this.pageSize, this.stylistsPage * this.pageSize);

      if (filteredStylists.length === 0) {
        return `
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 40px; text-align: center; color: var(--text-secondary);">
            Không tìm thấy thợ hoặc nhân viên nào khớp với điều kiện tìm kiếm.
          </div>
        `;
      }

      return `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px;">
          ${pagedStylists.map(st => {
            const brName = this._getBranchShortName(st.branchId, bMap);
            const comm = stylistStatsMap.get(st.id) || { completedCutsCount: 0, totalCutValue: 0, commissionAmount: 0, todayQueue: [] };
            const isAssis = (st.role || '').toLowerCase().includes('phụ');
            const isLead = (st.role || '').toLowerCase().includes('chính');
            const isCashier = (st.role || st.ChucVu || '').toLowerCase().includes('thu ngân') || (st.role || '').toUpperCase() === 'CASHIER';

            return `
              <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 14px;">
                    <img src="${st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}" 
                         style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid ${isCashier ? '#10b981' : isAssis ? '#0ea5e9' : '#f59e0b'};" alt="${this.escapeHtml(st.name)}">
                    <div style="flex: 1; min-width: 0;">
                      <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <h4 style="font-size: 15.5px; font-weight: 800; color: var(--text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${this.escapeHtml(st.name)}">${this.escapeHtml(st.name)}</h4>
                        <span style="font-size: 12px; font-weight: 800; color: #f59e0b; flex-shrink: 0; margin-left: 6px;">${st.rating ? Number(st.rating).toFixed(1) : '5.0'}</span>
                      </div>
                      <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        ${isCashier ? `
                          <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.35); padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800;">Thu ngân</span>
                        ` : isAssis ? `
                          <span style="background: rgba(14, 165, 233, 0.15); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.35); padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800;">Thợ phụ</span>
                        ` : isLead ? `
                          <span style="background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.35); padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800;">Thợ chính</span>
                        ` : `
                          <span style="background: rgba(168, 85, 247, 0.15); color: #9333ea; border: 1px solid rgba(168, 85, 247, 0.35); padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800;">Quản lý</span>
                        `}
                        <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">${this.escapeHtml(st.CapBac || st.level || (isCashier ? 'Nhân viên • POS' : (st.role?.toLowerCase().includes('quản lý') ? 'Quản lý' : (isAssis ? 'Junior Barber' : 'Master Barber'))))}</span>
                      </div>
                      <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">Cơ sở: <strong>${this.escapeHtml(brName)}</strong></div>
                    </div>
                  </div>

                  ${isCashier ? `
                    <div style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; margin-bottom: 14px;">
                      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                        <span style="color: var(--text-secondary);">Hình thức làm việc:</span>
                        <strong style="color: var(--text-primary);">Giờ hành chính / ca</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between; font-size: 12.5px; border-top: 1px dashed var(--border-color); padding-top: 6px; margin-top: 6px;">
                        <span style="font-weight: 700; color: #10b981;">Vị trí phân công:</span>
                        <strong style="color: #10b981;">Quầy Thu Ngân &amp; POS</strong>
                      </div>
                    </div>
                  ` : `
                    <div style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; margin-bottom: 14px;">
                      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                        <span style="color: var(--text-secondary);">Ca hoàn tất:</span>
                        <strong style="color: var(--text-primary);">${comm.completedCutsCount} lượt</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                        <span style="color: var(--text-secondary);">Doanh thu cắt:</span>
                        <strong style="color: var(--text-primary);">${SalonUtils.formatCurrency(comm.totalCutValue)}</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between; font-size: 12.5px; border-top: 1px dashed var(--border-color); padding-top: 6px; margin-top: 6px;">
                        <span style="font-weight: 700; color: #10b981;">Hoa hồng tạm tính (15%):</span>
                        <strong style="color: #10b981;">${SalonUtils.formatCurrency(comm.commissionAmount)}</strong>
                      </div>
                    </div>
                  `}
                </div>

                <div>
                  ${isCashier ? `
                    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                      <button type="button" class="pill-btn-outline" style="flex: 1; padding: 7px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" onclick="AdminWeb.switchSubTab('pos');">
                        <span>Quầy Thu Ngân &amp; POS →</span>
                      </button>
                    </div>
                  ` : `
                    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                      <button class="pill-btn-outline" style="flex: 1; padding: 7px; font-size: 12px; font-weight: 700;" onclick="AdminWeb.viewStylistQueueModal('${st.id}')">
                        Ca Hôm Nay (${comm.todayQueue.length})
                      </button>
                      <button class="btn-submit-terracotta" style="padding: 7px 12px; font-size: 12px; font-weight: 800;" 
                              onclick="AdminWeb.goToReceptionCheckin('${st.id}');">
                        + Xếp Khách
                      </button>
                    </div>
                  `}
                  <div style="display: flex; gap: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                    <button class="pill-btn-outline" style="flex: 1; padding: 6px; font-size: 12px; font-weight: 700;" onclick="AdminWeb.editStylistBottom('${st.id}')">
                      Sửa Thông Tin
                    </button>
                    <button class="pill-btn-outline" style="flex: 1; padding: 6px; font-size: 12px; font-weight: 700; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="AdminWeb.openUniversalDeleteModal('stylists', '${st.id}')">
                      Xóa Nhân Viên
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        ${this._renderPaginationControls(this.stylistsPage, stylTotalPages, filteredStylists.length, 'AdminWeb.setStylistsPage', 'nhân viên / thợ')}
      `;
    },

    handleStylistSearch(val) {
      this.stylistSearchQuery = val;
      this.stylistsPage = 1;
      const clearBtn = document.getElementById('adminStylistSearchClear');
      if (clearBtn) clearBtn.style.display = val ? 'inline-flex' : 'none';
      this._updateStylistsContentOnly();
    },

    clearStylistSearch() {
      this.stylistSearchQuery = '';
      this.stylistsPage = 1;
      const input = document.getElementById('adminStylistSearchInput');
      if (input) {
        input.value = '';
        input.focus();
      }
      const clearBtn = document.getElementById('adminStylistSearchClear');
      if (clearBtn) clearBtn.style.display = 'none';
      this._updateStylistsContentOnly();
    },

    refreshStylistsView() {
      const container = document.getElementById('adminStylistsContentContainer');
      if (container) {
        this._updateStylistsContentOnly();
      } else {
        const content = document.getElementById('adminSubTabContent');
        if (content && this.adminSubTab === 'stylists') {
          const user = this.getCurrentUser();
          const stylists = window.store.getStylists();
          const branches = window.store.getBranches();
          const bookings = window.store.getBookings();
          content.innerHTML = this.renderStylistsTab(user, stylists, branches, bookings);
        }
      }
    },

    _updateStylistsContentOnly() {
      const container = document.getElementById('adminStylistsContentContainer');
      if (!container) {
        this.refreshStylistsView();
        return;
      }
      const user = this.getCurrentUser();
      const stylists = window.store.getStylists();
      const branches = window.store.getBranches();
      const bookings = window.store.getBookings();
      const bMap = new Map(branches.map(b => [b.id, b]));

      let filteredStylists = [...stylists].filter(s => (s.id || s.MaNhanVien) !== 'NV00' && !String(s.name || s.HoTen || '').toLowerCase().includes('lê minh hoàng'));
      if (this.isBranchManager(user) && user.branchId && user.branchId !== 'ALL') {
        filteredStylists = filteredStylists.filter(s => (s.branchId === user.branchId || s.MaChiNhanh === user.branchId));
      } else if (this.filterBranch && this.filterBranch !== 'all') {
        filteredStylists = filteredStylists.filter(s => s.branchId === this.filterBranch);
      }

      if (this.filterStylistRole && this.filterStylistRole !== 'all') {
        filteredStylists = filteredStylists.filter(s => {
          const r = (s.role || s.ChucVu || '').toLowerCase();
          if (this.filterStylistRole === 'Thợ chính') return r.includes('chính');
          if (this.filterStylistRole === 'Thợ phụ') return r.includes('phụ');
          if (this.filterStylistRole === 'Quản lý chi nhánh') return r.includes('quản lý');
          if (this.filterStylistRole === 'Thu ngân') return r.includes('thu ngân') || r === 'cashier';
          return true;
        });
      }

      if (this.stylistSearchQuery) {
        const q = this.stylistSearchQuery.toLowerCase().trim();
        filteredStylists = filteredStylists.filter(s =>
          (s.name || s.HoTen || '').toLowerCase().includes(q) ||
          (s.id || s.MaNhanVien || '').toLowerCase().includes(q) ||
          (s.phone || s.SoDienThoai || '').includes(q) ||
          (s.specialty || '').toLowerCase().includes(q)
        );
      }

      container.innerHTML = this._renderStylistsCardsContent(filteredStylists, user, bMap, bookings);
    },

    setStylistsPage(p) {
      this.stylistsPage = p;
      this._updateStylistsContentOnly();
    },

    viewStylistQueueModal(stylistId) {
      const st = window.store.getStylistById(stylistId);
      if (!st) return;

      const queue = (window.store && typeof window.store.getStylistQueue === 'function')
        ? window.store.getStylistQueue(stylistId)
        : [];

      this._openModal(`
        <div class="booking-wizard-wrapper" style="max-width: 680px; width: 100%; margin: 0 auto; padding: 12px 6px;">
          <div class="booking-header" style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px; border-radius: 8px; background: rgba(245, 158, 11, 0.12); color: #d97706; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
              LỊCH TRỰC &amp; CA LÀM VIỆC
            </div>
            <h2 class="booking-title font-serif tracking-tight leading-tight" style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin: 10px 0 6px;">
              DANH SÁCH CA HÔM NAY: ${this.escapeHtml(st.name)}
            </h2>
            <p class="booking-subtitle" style="font-size: 14px; color: var(--text-secondary); margin: 0;">
              Theo dõi khách hàng đã đặt theo từng khung giờ trong ngày
            </p>
          </div>

          <div style="max-height: 480px; overflow-y: auto; margin-bottom: 24px; padding-right: 4px;">
            ${queue.length > 0 ? queue.map(b => {
              const statusInfo = SalonUtils.formatBookingStatus(b.status);
              return `
                <div style="border-bottom: 1px solid var(--border-color, #e5e7eb); padding: 16px 8px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 15.5px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                      <span style="color: #f59e0b; font-weight: 900;">${this.escapeHtml(b.timeSlot)}</span>
                      <span>—</span>
                      <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(b.customerName)}</span>
                    </div>
                    <div style="font-size: 13.5px; color: var(--text-secondary); margin-top: 5px;">
                      Dịch vụ: <strong style="color: var(--text-primary);">${this.escapeHtml(b.serviceName || 'Cắt tóc')}</strong> • SĐT: <strong style="color: var(--text-primary);">${this.escapeHtml(b.customerPhone)}</strong>
                    </div>
                  </div>
                  <div style="flex-shrink: 0;">
                    <span class="status-pill-pulse ${statusInfo.cssClass}" style="white-space: nowrap; padding: 7px 16px; font-size: 12.5px; font-weight: 700;">
                      <span class="pulse-dot"></span> ${statusInfo.label}
                    </span>
                  </div>
                </div>
              `;
            }).join('') : `
              <div style="text-align: center; padding: 36px 20px; color: var(--text-secondary); display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(245, 158, 11, 0.12); color: #f59e0b; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
                  Chưa có lịch hẹn trong ngày hôm nay
                </div>
                <p style="font-size: 13.5px; color: var(--text-secondary); max-width: 440px; margin: 0; line-height: 1.5;">
                  Hiện tại thợ <strong>${this.escapeHtml(st.name)}</strong> chưa có khách đặt chỗ trực tuyến. Bạn có thể xếp thêm khách vãng lai hoặc điều phối thợ sang ca tiếp theo.
                </p>
              </div>
            `}
          </div>

          <button type="button" class="btn-submit-terracotta" style="width: 100%; min-height: 48px; font-size: 15px; font-weight: 800; border-radius: 12px;" onclick="AdminWeb._closeModal()">
            Đóng Cửa Sổ
          </button>
        </div>
      `, 'queue');
    },

    
    // -----------------------------------------------------------------------
    // INLINE BOTTOM STYLIST EDITOR (FORM THÊM & SỬA NHÂN SỰ NẰM DƯỚI BẢNG)
    // -----------------------------------------------------------------------
    _renderStylistBottomEditor(user, branches) {
      const isSuper = this.isSuperAdmin(user);
      const isManager = this.isBranchManager(user);
      const defaultBranchId = (isManager && user?.branchId && user.branchId !== 'ALL') ? user.branchId : 'CN01';

      const avatarPresets = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
      ];

      return `
        <div id="adminStylistBottomEditor" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px 26px; margin-top: 24px; width: 100%; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08)); padding-bottom: 16px; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <h3 id="stylistEditorTitle" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">
                Thêm Nhân Viên / Thợ Mới
              </h3>
            </div>
            <div>
              <button type="button" class="pill-btn-outline" style="padding: 5px 14px; font-size: 12px; font-weight: 600;" onclick="AdminWeb.resetStylistBottomEditor()">
                Đặt Lại / Làm Trống
              </button>
            </div>
          </div>

          <form id="stylistBottomForm" onsubmit="event.preventDefault(); AdminWeb.submitStylistBottomEditor();">
            <input type="hidden" id="stylistEditorId" value="">

            <div style="display: flex; flex-direction: column; gap: 16px;">
              <!-- Hàng 1: Họ tên & Vai trò -->
              <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px;">
                <div>
                  <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                    Họ và Tên Nhân Sự <span style="color: #ef4444;">*</span>
                  </label>
                  <input type="text" id="stEditorName" class="form-control-custom" 
                         style="height: 38px; font-size: 13.5px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px; font-weight: 600;" 
                         placeholder="VD: Nguyễn Tuấn Kiệt" required>
                </div>
                <div>
                  <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                    Phân Loại Thợ / Vai Trò <span style="color: #ef4444;">*</span>
                  </label>
                  <select id="stEditorRole" class="admin-select-filter" 
                          style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                          onchange="AdminWeb.onStylistBottomRoleChange(this.value)" required>
                    <option value="Thợ chính">Thợ chính (Lead Barber)</option>
                    <option value="Thợ phụ">Thợ phụ (Assistant Barber)</option>
                    <option value="Thu ngân">Thu Ngân (Cashier)</option>
                    ${isSuper ? '<option value="Quản lý chi nhánh">Quản lý (Branch Manager)</option>' : ''}
                  </select>
                </div>
              </div>

              <!-- Hàng 2: Cấp bậc & Chi nhánh -->
              <div style="display: grid; grid-template-columns: 1fr 1.4fr; gap: 14px;">
                <div>
                  <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                    Cấp Bậc Chuyên Môn <span style="color: #ef4444;">*</span>
                  </label>
                  <select id="stEditorLevel" class="admin-select-filter" 
                          style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" required>
                    <option value="Master Barber">Master Barber (Thợ chính)</option>
                    <option value="Senior Barber">Senior Barber (Thợ chính)</option>
                    <option value="Junior Barber">Junior Barber (Thợ phụ)</option>
                    <option value="Nhân viên">Nhân Viên (Thu ngân)</option>
                    ${isSuper ? '<option value="Quản lý">Quản lý (Branch Manager)</option>' : ''}
                  </select>
                </div>
                <div>
                  <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                    Chi Nhánh / Cơ Sở Làm Việc <span style="color: #ef4444;">*</span>
                  </label>
                  <select id="stEditorBranch" class="admin-select-filter" 
                          style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                          ${!isSuper && isManager ? 'disabled style="opacity: 0.75; cursor: not-allowed;"' : ''} required>
                    ${branches.map(b => `<option value="${b.id}" ${defaultBranchId === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- Hàng 3: Điện thoại & Email -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div>
                  <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                    Số Điện Thoại Hotline / Zalo <span style="color: #ef4444;">*</span>
                  </label>
                  <input type="tel" id="stEditorPhone" class="form-control-custom" 
                         style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                         placeholder="0912xxxxxx" required>
                </div>
                <div>
                  <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                    Email Nhân Sự
                  </label>
                  <input type="email" id="stEditorEmail" class="form-control-custom" 
                         style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                         placeholder="nhansu@omnisalon.vn">
                </div>
              </div>

              <!-- Hàng 4: Kỹ thuật & Sở trường -->
              <div>
                <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                  Kỹ Thuật &amp; Sở Trường Nổi Bật
                </label>
                <input type="text" id="stEditorSpecialty" class="form-control-custom" 
                       style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                       placeholder="VD: Undercut &amp; Fade sắc nét, Uốn Texture Hàn Quốc, Cắt Layer Pompadour...">
              </div>

              <!-- Hàng 5: Avatar URL & Mẫu nhanh -->
              <div>
                <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                  Đường Dẫn Ảnh Đại Diện (Avatar URL)
                </label>
                <input type="url" id="stEditorAvatar" class="form-control-custom" 
                       style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                       placeholder="https://..." value="${avatarPresets[0]}">
                <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center; flex-wrap: wrap;">
                  <span style="font-size: 11.5px; color: var(--text-secondary);">Chọn nhanh ảnh đại diện mẫu:</span>
                  ${avatarPresets.map((av, idx) => `
                    <img src="${av}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 1px solid var(--border-color);" 
                         onclick="document.getElementById('stEditorAvatar').value='${av}';" title="Mẫu ${idx + 1}">
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- NÚT HÀNH ĐỘNG DƯỚI ĐÁY FORM: LUỒNG LƯU ĐƠN GIẢN -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));">
              <button type="button" class="pill-btn-outline" style="height: 38px; padding: 0 18px; font-weight: 600; font-size: 13px;" onclick="AdminWeb.resetStylistBottomEditor()">
                Hủy Bỏ / Làm Mới
              </button>
              <button type="submit" id="btnSubmitStylistBottom" 
                      style="height: 38px; padding: 0 28px; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; background: var(--brand-accent, #C59B27); color: #141413; transition: opacity 0.15s ease;"
                      onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
                <span>Lưu</span>
              </button>
            </div>

          </form>
        </div>
      `;
    },

    prepareAddStylistBottom() {
      this.resetStylistBottomEditor();
      const editor = document.getElementById('adminStylistBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          const nameInput = document.getElementById('stEditorName');
          if (nameInput) nameInput.focus();
        }, 300);
      }
    },

    editStylistBottom(stylistId) {
      const st = window.store ? window.store.getStylistById(stylistId) : null;
      if (!st) {
        if (window.UICommon) window.UICommon.showToast('Không tìm thấy thông tin nhân viên #' + stylistId, 'warning');
        return;
      }

      const idInput = document.getElementById('stylistEditorId');
      const nameInput = document.getElementById('stEditorName');
      const roleSelect = document.getElementById('stEditorRole');
      const levelSelect = document.getElementById('stEditorLevel');
      const branchSelect = document.getElementById('stEditorBranch');
      const phoneInput = document.getElementById('stEditorPhone');
      const emailInput = document.getElementById('stEditorEmail');
      const specialtyInput = document.getElementById('stEditorSpecialty');
      const avatarInput = document.getElementById('stEditorAvatar');
      const titleEl = document.getElementById('stylistEditorTitle');

      if (idInput) idInput.value = stylistId;
      if (nameInput) nameInput.value = st.name || st.HoTen || '';

      const rawRole = (st.role || st.ChucVu || '').toLowerCase();
      let roleVal = 'Thợ chính';
      if (rawRole.includes('phụ')) roleVal = 'Thợ phụ';
      else if (rawRole.includes('ngân')) roleVal = 'Thu ngân';
      else if (rawRole.includes('quản lý')) roleVal = 'Quản lý chi nhánh';
      else if (st.role) roleVal = st.role;

      if (roleSelect) {
        // Nếu nhân sự đang sửa có vai trò là Quản lý chi nhánh mà roleSelect chưa có option (do user không phải Super Admin)
        // thì bổ sung option hiển thị để user thấy vai trò hiện tại và có thể chọn phân bổ lại sang Thợ chính/Thợ phụ/Thu ngân
        let managerOpt = roleSelect.querySelector('option[value="Quản lý chi nhánh"]');
        if (roleVal === 'Quản lý chi nhánh') {
          if (!managerOpt) {
            managerOpt = document.createElement('option');
            managerOpt.value = 'Quản lý chi nhánh';
            managerOpt.textContent = 'Quản lý (Branch Manager) - [Hiện tại]';
            managerOpt.id = 'tempCurrentManagerOpt';
            roleSelect.appendChild(managerOpt);
          }
        } else {
          const tempOpt = document.getElementById('tempCurrentManagerOpt');
          if (tempOpt) tempOpt.remove();
        }
        roleSelect.value = roleVal;
      }

      if (levelSelect) {
        let managerLvlOpt = levelSelect.querySelector('option[value="Quản lý"]');
        if (roleVal === 'Quản lý chi nhánh' || (st.CapBac || st.level) === 'Quản lý') {
          if (!managerLvlOpt) {
            managerLvlOpt = document.createElement('option');
            managerLvlOpt.value = 'Quản lý';
            managerLvlOpt.textContent = 'Quản lý (Branch Manager) - [Hiện tại]';
            managerLvlOpt.id = 'tempCurrentManagerLvlOpt';
            levelSelect.appendChild(managerLvlOpt);
          }
        } else {
          const tempLvlOpt = document.getElementById('tempCurrentManagerLvlOpt');
          if (tempLvlOpt) tempLvlOpt.remove();
        }
        levelSelect.value = (st.CapBac || st.level || (roleVal === 'Thợ phụ' ? 'Junior Barber' : roleVal === 'Thu ngân' ? 'Nhân viên' : 'Master Barber')).trim();
      }

      if (branchSelect) {
        branchSelect.value = st.branchId || st.MaChiNhanh || 'CN01';
      }

      if (phoneInput) phoneInput.value = st.phone || st.SoDienThoai || '';
      if (emailInput) emailInput.value = st.email || '';
      if (specialtyInput) specialtyInput.value = st.specialty || '';
      if (avatarInput) avatarInput.value = st.avatar || '';

      if (titleEl) {
        titleEl.textContent = 'Chỉnh Sửa Nhân Sự: ' + (st.name || st.HoTen);
      }

      const editor = document.getElementById('adminStylistBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          if (nameInput) nameInput.focus();
        }, 300);
      }
    },

    resetStylistBottomEditor() {
      const tempOpt = document.getElementById('tempCurrentManagerOpt');
      if (tempOpt) tempOpt.remove();
      const tempLvlOpt = document.getElementById('tempCurrentManagerLvlOpt');
      if (tempLvlOpt) tempLvlOpt.remove();

      const idInput = document.getElementById('stylistEditorId');
      const nameInput = document.getElementById('stEditorName');
      const roleSelect = document.getElementById('stEditorRole');
      const levelSelect = document.getElementById('stEditorLevel');
      const phoneInput = document.getElementById('stEditorPhone');
      const emailInput = document.getElementById('stEditorEmail');
      const specialtyInput = document.getElementById('stEditorSpecialty');
      const avatarInput = document.getElementById('stEditorAvatar');
      const titleEl = document.getElementById('stylistEditorTitle');

      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      if (roleSelect) roleSelect.value = 'Thợ chính';
      if (levelSelect) levelSelect.value = 'Master Barber';
      if (phoneInput) phoneInput.value = '';
      if (emailInput) emailInput.value = '';
      if (specialtyInput) specialtyInput.value = '';
      if (avatarInput) avatarInput.value = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';

      if (titleEl) {
        titleEl.textContent = 'Thêm Nhân Viên / Thợ Mới';
      }
    },

    onStylistBottomRoleChange(role) {
      const levelSelect = document.getElementById('stEditorLevel');
      if (!levelSelect) return;
      if (role === 'Thợ phụ') {
        levelSelect.value = 'Junior Barber';
      } else if (role === 'Thợ chính') {
        levelSelect.value = 'Master Barber';
      } else if (role === 'Thu ngân') {
        levelSelect.value = 'Nhân viên';
      } else if (role === 'Quản lý chi nhánh' || role === 'Quản lý') {
        levelSelect.value = 'Quản lý';
      }
    },

    async submitStylistBottomEditor() {
      const user = this.getCurrentUser();
      const isSuper = this.isSuperAdmin(user);
      const isManager = this.isBranchManager(user);

      const stylistId = document.getElementById('stylistEditorId')?.value?.trim() || '';
      const name = (document.getElementById('stEditorName')?.value || '').trim();
      const roleElem = document.getElementById('stEditorRole');
      let role = roleElem ? roleElem.value : 'Thợ chính';
      const level = document.getElementById('stEditorLevel')?.value || 'Master Barber';
      let branchId = document.getElementById('stEditorBranch')?.value || 'CN01';
      if (!isSuper && isManager && user?.branchId && user.branchId !== 'ALL') {
        branchId = user.branchId;
      }
      const phone = (document.getElementById('stEditorPhone')?.value || '').trim();
      const email = (document.getElementById('stEditorEmail')?.value || '').trim();
      const specialty = (document.getElementById('stEditorSpecialty')?.value || '').trim();
      const avatar = (document.getElementById('stEditorAvatar')?.value || '').trim();

      if (!name) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập họ và tên của nhân sự!', 'warning');
        return;
      }

      if (!isSuper) {
        if (stylistId) {
          const curSt = window.store.getStylistById(stylistId);
          const oldRole = curSt?.role || curSt?.ChucVu || '';
          // Nếu nhân sự đang là Quản lý, Quản lý chi nhánh ĐƯỢC PHÉP hạ/bỏ quản lý xuống Thợ chính/Thợ phụ/Thu ngân
          // Nhưng KHÔNG ĐƯỢC phép nâng một thợ chưa phải Quản lý lên làm Quản lý (chỉ Quản trị viên mới được)
          if (!oldRole.includes('Quản lý') && role.includes('Quản lý')) {
            if (window.UICommon) window.UICommon.showToast('Chỉ Quản trị viên mới có quyền bổ nhiệm Quản lý chi nhánh!', 'error');
            return;
          }
        } else {
          if (role.includes('Quản lý')) {
            if (window.UICommon) window.UICommon.showToast('Chỉ Quản trị viên mới có quyền tạo Quản lý chi nhánh!', 'error');
            return;
          }
        }
      }

      const payload = {
        name,
        role,
        level,
        branchId,
        phone,
        email,
        specialty,
        avatar,
        requestUserRole: isSuper ? 'SUPER_ADMIN' : (isManager ? 'BRANCH_MANAGER' : 'STAFF')
      };

      if (stylistId) {
        await window.store.updateStylist(stylistId, payload);
        if (window.UICommon) window.UICommon.showToast(`Đã cập nhật ${role} [${name}] thành công!`, 'success');
      } else {
        const created = await window.store.addStylist(payload);
        if (window.UICommon) window.UICommon.showToast(`Đã thêm mới ${role} [${name}] (#${created?.id || ''}) thành công!`, 'success');
      }

      this.resetStylistBottomEditor();
      this._updateStylistsContentOnly();
      if (window.store && typeof window.store.syncWithLiveServer === 'function') {
        window.store.syncWithLiveServer();
      }

      // Cuộn nhẹ lên danh sách thợ
      const container = document.getElementById('adminStylistsContentContainer');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    openAddStylistModal(stylistId = null) {
      if (stylistId) {
        this.editStylistBottom(stylistId);
      } else {
        this.prepareAddStylistBottom();
      }
      return;
      const branches = window.store.getBranches() || [];
      const st = stylistId ? window.store.getStylistById(stylistId) : null;
      const isEdit = !!st;
      const rawRole = (st?.role || st?.ChucVu || '').toLowerCase();
      let role = 'Thợ chính';
      if (rawRole.includes('phụ')) role = 'Thợ phụ';
      else if (rawRole.includes('ngân')) role = 'Thu ngân';
      else if (rawRole.includes('quản lý')) role = 'Quản lý chi nhánh';
      else if (rawRole.includes('chính')) role = 'Thợ chính';
      else if (st?.role) role = st.role;

      const rawLevel = (st?.CapBac || st?.level || '').trim();
      let level = rawLevel;
      if (!level) {
        if (role === 'Thợ phụ') level = 'Junior Barber';
        else if (role === 'Thu ngân') level = 'Chuyên viên thu ngân';
        else if (role === 'Quản lý chi nhánh' || role === 'Quản lý') level = 'Quản lý';
        else level = 'Master Barber';
      }
      const user = this.getCurrentUser();
      const isSuper = this.isSuperAdmin(user);
      const isManager = this.isBranchManager(user);
      const branchId = st?.branchId || ((!isSuper && isManager && user?.branchId && user.branchId !== 'ALL') ? user.branchId : (this.filterBranch !== 'all' ? this.filterBranch : 'CN01'));

      const avatarPresets = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
      ];

      this._openModal(`
        <div style="max-width: 520px; margin: 0 auto;">
          <div class="badge-terracotta">QUẢN LÝ NHÂN SỰ</div>
          <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0 6px;">${isEdit ? 'SỬA THÔNG TIN NHÂN SỰ' : 'THÊM NHÂN VIÊN MỚI'}</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 16px;">Dữ liệu nhân sự được đồng bộ trực tiếp vào hệ thống OmniSalon.</p>

          <form onsubmit="event.preventDefault(); AdminWeb.submitStylistForm('${stylistId || ''}');">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Phân Loại Thợ / Vai Trò: <span style="color:#ef4444;">*</span></label>
                ${!isSuper && (role === 'Quản lý chi nhánh' || role === 'Quản lý') ? `
                  <select id="stRole" class="form-control-custom" disabled title="Chỉ Quản trị viên mới có quyền thay đổi vai trò Quản lý chi nhánh" style="opacity: 0.75; cursor: not-allowed;">
                    <option value="Quản lý chi nhánh" selected>Quản lý chi nhánh (Khóa)</option>
                  </select>
                ` : `
                  <select id="stRole" class="form-control-custom" required onchange="AdminWeb.onStylistRoleChange(this.value)">
                    <option value="Thợ chính" ${role === 'Thợ chính' ? 'selected' : ''}>Thợ chính (Lead Barber)</option>
                    <option value="Thợ phụ" ${role === 'Thợ phụ' ? 'selected' : ''}>Thợ phụ (Assistant Barber)</option>
                    <option value="Thu ngân" ${role === 'Thu ngân' ? 'selected' : ''}>Thu Ngân (Cashier)</option>
                    ${isSuper ? `<option value="Quản lý chi nhánh" ${role === 'Quản lý chi nhánh' || role === 'Quản lý' ? 'selected' : ''}>Quản lý (Branch Manager)</option>` : ''}
                  </select>
                `}
              </div>

              <div>
                <label class="sub-label">Cấp Bậc Chuyên Môn: <span style="color:#ef4444;">*</span></label>
                <select id="stLevel" class="form-control-custom" required>
                  <option value="Master Barber" ${level === 'Master Barber' ? 'selected' : ''}>Master Barber (Thợ chính)</option>
                  <option value="Senior Barber" ${level === 'Senior Barber' ? 'selected' : ''}>Senior Barber (Thợ chính)</option>
                  <option value="Junior Barber" ${level === 'Junior Barber' ? 'selected' : ''}>Junior Barber (Thợ phụ)</option>
                  <option value="Nhân viên" ${level === 'Nhân viên' ? 'selected' : ''}>Nhân Viên (Thu ngân)</option>
                  ${isSuper ? `<option value="Quản lý" ${level === 'Quản lý' ? 'selected' : ''}>Quản lý (Branch Manager)</option>` : ''}
                </select>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <label class="sub-label">Họ và Tên Nhân Sự: <span style="color:#ef4444;">*</span></label>
              <input type="text" id="stName" class="form-control-custom" placeholder="VD: Nguyễn Tuấn Kiệt" value="${this.escapeHtml(st?.name || st?.HoTen || '')}" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Chi Nhánh / Cơ Sở: <span style="color:#ef4444;">*</span></label>
                <select id="stBranch" class="form-control-custom" required ${!isSuper && isManager ? 'disabled style="opacity: 0.75; cursor: not-allowed;"' : ''}>
                  ${branches.map(b => `<option value="${b.id}" ${branchId === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="sub-label">Số Điện Thoại: <span style="color:#ef4444;">*</span></label>
                <input type="tel" id="stPhone" class="form-control-custom" placeholder="0912000xxx" value="${this.escapeHtml(st?.phone || st?.SoDienThoai || '')}" required>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <label class="sub-label">Email Nhân Sự:</label>
              <input type="email" id="stEmail" class="form-control-custom" placeholder="kiet.nt@salontoc.vn" value="${this.escapeHtml(st?.email || '')}">
            </div>

            <div style="margin-bottom: 12px;">
              <label class="sub-label">Kỹ Thuật &amp; Sở Trường Nổi Bật:</label>
              <input type="text" id="stSpecialty" class="form-control-custom" placeholder="VD: Undercut & Fade sắc nét, Uốn Texture Hàn Quốc, Cắt Layer..." value="${this.escapeHtml(st?.specialty || '')}">
            </div>

            <div style="margin-bottom: 12px;">
              <label class="sub-label">Ảnh Đại Diện (Avatar URL):</label>
              <input type="url" id="stAvatar" class="form-control-custom" placeholder="https://..." value="${this.escapeHtml(st?.avatar || avatarPresets[0])}">
              <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center; flex-wrap: wrap;">
                <span style="font-size: 11px; color: var(--text-secondary);">Chọn nhanh ảnh mẫu:</span>
                ${avatarPresets.map((av, idx) => `
                  <img src="${av}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 1px solid var(--border-color);" 
                       onclick="document.getElementById('stAvatar').value='${av}';" title="Mẫu ${idx + 1}">
                `).join('')}
              </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="button" class="btn-cancel" style="flex: 1; min-height: 44px; font-weight: 700;" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
              <button type="submit" class="btn-submit-terracotta" style="flex: 1.3; min-height: 44px; font-weight: 800;">
                ${isEdit ? 'Cập Nhật Thông Tin' : 'Lưu Thông Tin Nhân Viên'}
              </button>
            </div>
          </form>
        </div>
      `);
    },

    onStylistRoleChange(role) {
      const levelSelect = document.getElementById('stLevel');
      if (!levelSelect) return;
      if (role === 'Thợ phụ') {
        levelSelect.value = 'Junior Barber';
      } else if (role === 'Thợ chính') {
        levelSelect.value = 'Master Barber';
      } else if (role === 'Thu ngân') {
        levelSelect.value = 'Nhân viên';
      } else if (role === 'Quản lý chi nhánh' || role === 'Quản lý') {
        levelSelect.value = 'Quản lý';
      }
    },

    async submitStylistForm(stylistId) {
      const user = this.getCurrentUser();
      const isSuper = this.isSuperAdmin(user);
      const isManager = this.isBranchManager(user);

      const name = (document.getElementById('stName')?.value || '').trim();
      const roleElem = document.getElementById('stRole');
      let role = roleElem ? roleElem.value : 'Thợ chính';
      const level = document.getElementById('stLevel')?.value || 'Master Barber';
      let branchId = document.getElementById('stBranch')?.value || 'CN01';
      if (!isSuper && isManager && user?.branchId && user.branchId !== 'ALL') {
        branchId = user.branchId;
      }
      const phone = (document.getElementById('stPhone')?.value || '').trim();
      const email = (document.getElementById('stEmail')?.value || '').trim();
      const specialty = (document.getElementById('stSpecialty')?.value || '').trim();
      const avatar = (document.getElementById('stAvatar')?.value || '').trim();

      if (!name) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập họ và tên của nhân sự!', 'warning');
        return;
      }

      if (!isSuper) {
        if (stylistId) {
          const curSt = window.store.getStylistById(stylistId);
          const oldRole = curSt?.role || curSt?.ChucVu || '';
          // Nếu nhân sự đang là Quản lý, Quản lý chi nhánh ĐƯỢC PHÉP hạ/bỏ quản lý xuống Thợ chính/Thợ phụ/Thu ngân
          // Nhưng KHÔNG ĐƯỢC phép nâng một thợ chưa phải Quản lý lên làm Quản lý (chỉ Quản trị viên mới được)
          if (!oldRole.includes('Quản lý') && role.includes('Quản lý')) {
            if (window.UICommon) window.UICommon.showToast('Chỉ Quản trị viên mới có quyền bổ nhiệm Quản lý chi nhánh!', 'error');
            return;
          }
        } else {
          if (role.includes('Quản lý')) {
            if (window.UICommon) window.UICommon.showToast('Chỉ Quản trị viên mới có quyền tạo Quản lý chi nhánh!', 'error');
            return;
          }
        }
      }

      const payload = {
        name,
        role,
        level,
        branchId,
        phone,
        email,
        specialty,
        avatar,
        requestUserRole: isSuper ? 'SUPER_ADMIN' : (isManager ? 'BRANCH_MANAGER' : 'STAFF')
      };

      if (stylistId) {
        await window.store.updateStylist(stylistId, payload);
        if (window.UICommon) window.UICommon.showToast(`Đã cập nhật ${role} [${name}] thành công!`);
      } else {
        const created = await window.store.addStylist(payload);
        if (window.UICommon) window.UICommon.showToast(`Đã thêm mới ${role} [${name}] (#${created?.id || ''}) thành công!`);
      }

      this._closeModal();
      this.refreshSubTab();
      if (window.store && typeof window.store.syncWithLiveServer === 'function') {
        window.store.syncWithLiveServer();
      }
    }
  });

})(typeof window !== 'undefined' ? window : this);
