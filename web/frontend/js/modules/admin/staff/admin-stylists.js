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
            <button class="btn-submit-terracotta" style="height: 38px; padding: 0 18px; font-size: 12.5px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.25);" onclick="AdminWeb.openAddStylistModal()">
              <span>+ Thêm Nhân Viên Mới</span>
            </button>
          </div>
        </div>

        <div id="adminStylistsContentContainer">
          ${this._renderStylistsCardsContent(filteredStylists, user, bMap, allBookings)}
        </div>
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
                        <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">${this.escapeHtml(st.CapBac || st.level || (isCashier ? 'Chuyên viên thu ngân • POS' : (st.role?.toLowerCase().includes('quản lý') ? 'Quản lý' : (isAssis ? 'Junior Barber' : 'Master Barber'))))}</span>
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
                    <button class="pill-btn-outline" style="flex: 1; padding: 6px; font-size: 12px; font-weight: 700;" onclick="AdminWeb.openAddStylistModal('${st.id}')">
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

    openAddStylistModal(stylistId = null) {
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
                  <select id="stRole" class="form-control-custom" disabled title="Chỉ Quản trị tối cao mới có quyền thay đổi vai trò Quản lý chi nhánh" style="opacity: 0.75; cursor: not-allowed;">
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
                  <option value="Quản lý" ${level === 'Quản lý' ? 'selected' : ''}>Quản lý</option>
                  <option value="Master Barber" ${level === 'Master Barber' ? 'selected' : ''}>Master Barber</option>
                  <option value="Senior Barber" ${level === 'Senior Barber' ? 'selected' : ''}>Senior Barber</option>
                  <option value="Junior Barber" ${level === 'Junior Barber' ? 'selected' : ''}>Junior Barber</option>
                  <option value="Chuyên viên thu ngân" ${level === 'Chuyên viên thu ngân' ? 'selected' : ''}>Chuyên viên thu ngân</option>
                  <option value="Nhân viên" ${level === 'Nhân viên' ? 'selected' : ''}>Nhân Viên</option>
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
        levelSelect.value = 'Chuyên viên thu ngân';
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
          if (oldRole.includes('Quản lý')) {
            role = oldRole;
          } else if (role.includes('Quản lý')) {
            if (window.UICommon) window.UICommon.showToast('Chỉ Quản trị tối cao mới có quyền bổ nhiệm Quản lý chi nhánh!', 'error');
            return;
          }
        } else {
          if (role.includes('Quản lý')) {
            if (window.UICommon) window.UICommon.showToast('Chỉ Quản trị tối cao mới có quyền tạo Quản lý chi nhánh!', 'error');
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
