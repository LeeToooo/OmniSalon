// ============================================================================
// Omni Salon: PHÂN HỆ QUẢN TRỊ - ĐIỀU PHỐI LỊCH HẸN & SẢNH CHỜ (BOOKINGS)
// File tách độc lập để tối ưu tốc độ và giảm tải IDE
// ============================================================================

(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  Object.assign(window.AdminWeb, {
    bookingsPage: 1,
    dispatchPage: 1,
    dispatchBranchFilter: 'all',
    searchQuery: '',
    customerLookupQuery: '',
    bookingSubTab: 'dispatcher', // 'dispatcher' | 'list'

    _renderBookingServiceCell(b) {
      let services = [];
      if (Array.isArray(b.servicesList) && b.servicesList.length > 0) {
        services = b.servicesList.map(s => (typeof s === 'string' ? s : (s.name || s.TenDichVu || s.TenCombo || '')).trim()).filter(Boolean);
      }
      if (services.length <= 1 && b.serviceName && b.serviceName.includes('+')) {
        const parts = b.serviceName.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) {
          services = parts;
        }
      }
      if (services.length === 0) {
        services = [b.serviceName || 'Dịch vụ'];
      }

      const primary = services[0];
      const extraCount = services.length - 1;

      if (extraCount <= 0) {
        return `
          <td style="max-width: 220px; line-height: 1.35;">
            <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${this.escapeHtml(primary)}">
              ${this.escapeHtml(primary)}
            </strong>
          </td>
        `;
      }

      const tooltipItemsHtml = services.map((s, idx) => `
        <div class="service-tooltip-item">
          <span class="tooltip-num">${idx + 1}.</span>
          <span>${this.escapeHtml(s)}</span>
        </div>
      `).join('');

      const plainTooltipText = services.map((s, idx) => `${idx + 1}. ${s}`).join('\n');

      return `
        <td style="max-width: 240px; line-height: 1.35;">
          <div style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
            <strong style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 145px; font-size: 13px;" title="${this.escapeHtml(primary)}">
              ${this.escapeHtml(primary)}
            </strong>
            <span class="booking-service-badge has-service-tooltip" title="${this.escapeHtml(plainTooltipText)}">
              +${extraCount} dịch vụ
              <span class="service-tooltip-content">
                <div class="service-tooltip-title">Chi Tiết Dịch Vụ (${services.length})</div>
                <div class="service-tooltip-items">
                  ${tooltipItemsHtml}
                </div>
              </span>
            </span>
          </div>
        </td>
      `;
    },

    // -----------------------------------------------------------------------
    // SUB-TAB 2: ĐIỀU PHỐI LỊCH HẸN, BOOKINGS DISPATCHER REALTIME 4RAU
    // -----------------------------------------------------------------------
    renderBookingsTab(user, bookings, branches, stylists, branchMap = null, services = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      const allServices = (Array.isArray(services) && services.length > 0)
        ? services
        : ((window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : []);

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      const nowH = String(now.getHours()).padStart(2, '0');
      const nowM = String(now.getMinutes()).padStart(2, '0');
      const nowTime = `${nowH}:${nowM}`;
      const nowTimestamp = now.getTime();

      let nearestBookingId = null;
      let minFutureDiff = Infinity;
      bookings.forEach(b => {
        const st = (b.status || '').toLowerCase();
        if (st === 'completed' || st === 'cancelled') return;
        const bDate = b.date || b.bookingDate || todayStr;
        const bTime = (b.timeSlot || '00:00').trim();
        const dtStr = `${bDate}T${bTime.length === 5 ? bTime + ':00' : bTime}`;
        const bTimestamp = new Date(dtStr).getTime();
        if (!isNaN(bTimestamp)) {
          const diff = bTimestamp - nowTimestamp;
          if (diff >= -900000 && diff < minFutureDiff) {
            minFutureDiff = diff;
            nearestBookingId = b.id;
          }
        }
      });

      const lookupQ = (this.customerLookupQuery || '').toLowerCase().trim();
      let lookupResults = [];
      if (lookupQ) {
        lookupResults = bookings.filter(b =>
          (b.id && b.id.toLowerCase().includes(lookupQ)) ||
          (b.bookingCode && b.bookingCode.toLowerCase().includes(lookupQ)) ||
          (b.customerName && b.customerName.toLowerCase().includes(lookupQ)) ||
          (b.customerPhone && b.customerPhone.includes(lookupQ))
        );
      }

      let waitingBookings = bookings.filter(b => {
        const rawSt = (b.status || '').toLowerCase().trim();
        return rawSt === 'waiting' || rawSt === 'chờ vào ghế';
      });
      if (this.isBranchManager(user) && user.branchId) {
        waitingBookings = waitingBookings.filter(b => b.branchId === user.branchId);
      } else if (this.filterBranch !== 'all') {
        waitingBookings = waitingBookings.filter(b => b.branchId === this.filterBranch);
      }

      let filtered = [...bookings];
      if (this.isBranchManager(user) && user.branchId) {
        filtered = filtered.filter(b => b.branchId === user.branchId);
      } else if (this.filterBranch !== 'all') {
        filtered = filtered.filter(b => b.branchId === this.filterBranch);
      }

      if (this.filterStatus !== 'all') {
        filtered = filtered.filter(b => (b.status || '').toLowerCase() === this.filterStatus.toLowerCase());
      }

      if (this.filterDate) {
        filtered = filtered.filter(b => (b.date || b.bookingDate) === this.filterDate);
      }

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(b =>
          (b.id && b.id.toLowerCase().includes(q)) ||
          (b.bookingCode && b.bookingCode.toLowerCase().includes(q)) ||
          (b.customerName && b.customerName.toLowerCase().includes(q)) ||
          (b.customerPhone && b.customerPhone.includes(q)) ||
          (b.stylistName && b.stylistName.toLowerCase().includes(q))
        );
      }

      const workstationDate = this.filterDate || todayStr;
      const workstationBookings = bookings.filter(b => {
        const bDate = b.date || b.bookingDate;
        return bDate === workstationDate;
      });

      this.dispatchBranchFilter = this.dispatchBranchFilter || 'all';
      let scopedStylists = (this.isBranchManager(user) && user.branchId)
        ? stylists.filter(s => s.branchId === user.branchId || s.MaChiNhanh === user.branchId)
        : (this.dispatchBranchFilter !== 'all'
            ? stylists.filter(s => s.branchId === this.dispatchBranchFilter || s.MaChiNhanh === this.dispatchBranchFilter)
            : (this.filterBranch !== 'all' ? stylists.filter(s => s.branchId === this.filterBranch || s.MaChiNhanh === this.filterBranch) : stylists));
      scopedStylists = scopedStylists.filter(s => !(s.role || s.ChucVu || '').toLowerCase().includes('thu ngân'));
      if (scopedStylists.length === 0) {
        scopedStylists = stylists.filter(s => !(s.role || s.ChucVu || '').toLowerCase().includes('thu ngân')).slice(0, 6);
      }

      this.dispatchPage = this.dispatchPage || 1;
      const dispatchTotalPages = Math.max(1, Math.ceil(scopedStylists.length / this.pageSize));
      if (this.dispatchPage > dispatchTotalPages) this.dispatchPage = dispatchTotalPages;
      const pagedWorkstations = scopedStylists.slice((this.dispatchPage - 1) * this.pageSize, this.dispatchPage * this.pageSize);

      const customerSearchHtml = `
        <div class="quick-booking-search-panel" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <strong style="font-size: 15px; color: var(--text-primary);">Bàn Tiếp Nhận &amp; Check-in Khách Hàng Đặt Lịch</strong>
              <span style="font-size: 12.5px; color: var(--text-secondary);">Gõ Tên, SĐT hoặc Mã vé để kiểm tra ca hẹn</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="font-size: 12px; font-weight: 600; color: var(--brand-accent, #C59B27); background: rgba(197, 155, 39, 0.1); border: 1px solid rgba(197, 155, 39, 0.25); padding: 4px 10px; border-radius: 6px;">
                Hiện tại: ${nowTime} • Hôm Nay: ${SalonUtils.formatDate(todayStr)}
              </span>
            </div>
          </div>

          <div class="quick-search-input-wrap" style="position: relative; display: flex; align-items: center;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 14px; color: var(--text-muted, #94a3b8); pointer-events: none;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="adminCustomerLookupInput" placeholder="Nhập tên khách hàng, số điện thoại hoặc mã lịch hẹn để tiếp nhận..." 
                   value="${this.escapeHtml(this.customerLookupQuery || '')}"
                   oninput="AdminWeb.handleCustomerLookup(this.value);"
                   style="width: 100%; height: 40px; padding: 0 38px 0 38px; border-radius: 8px; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 13.5px; font-weight: 500; outline: none; box-sizing: border-box;">
            <button type="button" onclick="AdminWeb.handleCustomerLookup(''); const el = document.getElementById('adminCustomerLookupInput'); if (el) { el.value = ''; el.focus(); }" 
                    style="position: absolute; right: 12px; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 16px; line-height: 1; display: ${this.customerLookupQuery ? 'block' : 'none'};" title="Xóa tìm kiếm">&times;</button>
          </div>

          <div id="quickBookingSearchResultsContainer">
            ${this.renderLookupResultsHtml(lookupQ, lookupResults, todayStr)}
          </div>

          <div id="waitingLoungeContainer" style="margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 14px;">
            ${this.renderWaitingLoungeHtml(waitingBookings, todayStr, nowTime)}
          </div>
        </div>
      `;

      const timelineHtml = `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Bàn Điều Phối Ghế Cắt Theo Ca Hẹn</span>
              <span style="font-size: 12px; font-weight: 600; color: var(--brand-accent, #C59B27); background: rgba(197, 155, 39, 0.1); border: 1px solid rgba(197, 155, 39, 0.25); padding: 4px 10px; border-radius: 6px;">
                Ngày: ${workstationDate === todayStr ? 'Hôm Nay (' + SalonUtils.formatDate(todayStr) + ')' : SalonUtils.formatDate(workstationDate)}
              </span>

              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta" style="font-size: 11.5px;">${this.escapeHtml(this._getBranchShortName(user.branchId, bMap))}</span>
              ` : `
                <select class="admin-select-filter" style="height: 32px; font-size: 12px; border-radius: 6px; padding: 2px 10px;"
                        onchange="AdminWeb.dispatchBranchFilter = this.value; AdminWeb.dispatchPage = 1; AdminWeb.refreshBookingsTable();">
                  <option value="all" ${(!this.dispatchBranchFilter || this.dispatchBranchFilter === 'all') ? 'selected' : ''}>Toàn Bộ Chi Nhánh</option>
                  ${branches.map(b => `<option value="${b.id}" ${this.dispatchBranchFilter === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                </select>
              `}
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              Ca hẹn ngày <strong style="color: var(--brand-accent, #C59B27);">${SalonUtils.formatDate(workstationDate)}</strong> • Tự động highlight ca gần nhất
            </div>
          </div>

          <div class="admin-kanban-board stylist-timeline-board">
            ${pagedWorkstations.map((st, sIdx) => {
              const globalChairNum = (this.dispatchPage - 1) * this.pageSize + sIdx + 1;
              const stBookings = workstationBookings.filter(b => b.stylistId === st.id || (b.stylistName && b.stylistName.includes(st.name)));
              const hasInProgress = stBookings.some(b => (b.status || '').toLowerCase() === 'in_progress');
              const statusClass = hasInProgress ? 'stylist-status-busy' : 'stylist-status-available';
              const statusText = hasInProgress ? 'Đang Phục Vụ' : 'Ghế Rảnh';

              return `
                <div class="admin-workstation-column stylist-timeline-col" id="workstation-card-${st.id}">
                  <div class="workstation-column-header stylist-col-header">
                    <img src="${st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}" class="stylist-col-avatar" alt="${this.escapeHtml(st.name)}">
                    <div class="stylist-col-info">
                      <div class="stylist-col-name">Ghế #${globalChairNum} • ${this.escapeHtml(st.name)}</div>
                      <div class="stylist-col-badge">${st.rating || '5.0'} • ${this.escapeHtml(st.role || 'Master Barber')}</div>
                    </div>
                    <span class="stylist-col-status ${statusClass}">${statusText}</span>
                  </div>

                  <div class="workstation-cards-container stylist-col-cards-list">
                    ${stBookings.length === 0 ? `
                      <div class="timeline-empty-notice" style="padding: 24px 12px; text-align: center; color: var(--text-secondary); font-size: 12px; border: 1px dashed var(--border-color); border-radius: 12px; background: rgba(255,255,255,0.02);">
                        Ghế đang trống ca ${SalonUtils.formatDate(workstationDate)} • Sẵn sàng nhận khách Walk-in
                      </div>
                    ` : stBookings.map(b => {
                      const bDate = b.date || b.bookingDate;
                      const bTime = (b.timeSlot || '00:00').trim();
                      const isConf = (b.status || '').toLowerCase() === 'confirmed';
                      const isWaiting = (b.status || '').toLowerCase() === 'waiting' || (b.status || '').toLowerCase() === 'chờ vào ghế';
                      const isInProg = (b.status || '').toLowerCase() === 'in_progress';
                      const isDone = (b.status || '').toLowerCase() === 'completed';
                      const isNearest = (b.id === nearestBookingId);
                      const isPast = (bDate < todayStr) || (bDate === todayStr && bTime < nowTime && isConf);
                      const isToday = (bDate === todayStr);

                      let cardModifierClass = '';
                      if (isNearest) cardModifierClass = 'booking-nearest';
                      else if (isPast) cardModifierClass = 'booking-past';
                      else if (isToday) cardModifierClass = 'booking-today';

                      return `
                        <div class="kanban-booking-card timeline-booking-card ${cardModifierClass} ${isInProg ? 'in-progress' : ''} ${isWaiting ? 'booking-waiting' : ''}" style="margin-bottom: 10px; background: var(--surface-card); border: 1.5px solid ${isNearest ? '#f59e0b' : (isInProg ? '#f59e0b' : (isWaiting ? '#f59e0b' : 'var(--border-color)'))}; border-radius: 14px; padding: ${isToday ? '16px' : '13px'};">
                          <div class="timeline-card-time" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                              <span style="font-weight: 800; font-size: ${isToday ? '15px' : '13.5px'}; color: var(--text-primary, #FFFFFF);">
                                ${this.escapeHtml(b.timeSlot || '')}
                              </span>
                              ${isNearest ? `<span class="booking-nearest-tag">SẮP TỚI</span>` : ''}
                              ${isPast ? `<span class="booking-past-badge">Đã qua</span>` : ''}
                              ${isToday && !isNearest ? `<span style="font-size: 10px; font-weight: 800; background: #f59e0b; color: #000; padding: 2px 5px; border-radius: 4px;">HÔM NAY</span>` : ''}
                            </div>
                            <span style="font-size: 11px; font-weight: 800; color: ${isInProg ? '#f59e0b' : (isDone ? '#10B981' : (isWaiting ? '#f59e0b' : '#94A3B8'))};">
                              ${isDone ? 'Hoàn tất' : (isInProg ? 'Đang cắt' : (isWaiting ? 'Chờ ghế' : 'Chờ đến'))}
                            </span>
                          </div>
                          <div class="timeline-card-customer" style="font-size: ${isToday ? '15px' : '14px'}; font-weight: 800; color: var(--text-primary, #FFFFFF); margin-bottom: 4px;">
                            ${this.escapeHtml(b.customerName || 'Khách Hàng')} 
                            <span style="font-size: 12px; font-weight: 400; color: var(--text-secondary);">(${this.escapeHtml(b.customerPhone || '')})</span>
                          </div>
                          <div class="timeline-card-service" style="font-size: 13px; color: #f59e0b; font-weight: 700; margin-bottom: 10px;">
                            ${this.escapeHtml(b.serviceName || 'Dịch vụ')} • ${SalonUtils.formatCurrency(b.totalPrice || 0)}
                          </div>
                          <div class="timeline-card-actions" style="display: flex; gap: 6px; flex-wrap: wrap;">
                            ${isConf ? `
                              <button type="button" class="btn-submit-terracotta" style="padding: 6px 8px; font-size: 11px; flex: 1; background: #f59e0b; border-color: #f59e0b; color: #000; font-weight: 700;" 
                                      onclick="AdminWeb.checkinBookingWaiting('${b.id}')" title="Khách đã đến sảnh, xếp vào danh sách chờ ghế">
                                Chờ Vào Ghế
                              </button>
                              <button type="button" class="btn-submit-terracotta" style="padding: 6px 8px; font-size: 11px; flex: 1;" 
                                      onclick="AdminWeb.updateBookingStatus('${b.id}', 'In_Progress')" title="Khách đã tới, đưa vào ghế cắt ngay">
                                Vào Ghế
                              </button>
                            ` : ''}
                            ${isWaiting ? `
                              <button type="button" class="btn-submit-terracotta" style="padding: 6px 12px; font-size: 11.5px; flex: 1; background: #10B981; border-color: #10B981; color: #fff; font-weight: 700;" 
                                      onclick="AdminWeb.updateBookingStatus('${b.id}', 'In_Progress')" title="Đưa khách từ sảnh chờ vào ghế cắt">
                                Vào Ghế Làm Ngay
                              </button>
                            ` : ''}
                            ${isInProg ? `
                              <button type="button" class="btn-submit-terracotta" style="padding: 6px 12px; font-size: 11.5px; background: #10B981; border-color: #10B981; color: #fff; flex: 1;" 
                                      onclick="AdminWeb.updateBookingStatus('${b.id}', 'Completed')" title="Hoàn tất ca cắt tóc">
                                Hoàn Tất Ca Cắt
                              </button>
                            ` : ''}
                            ${isDone ? `
                              <div style="font-size: 11px; color: #10B981; font-weight: 700; text-align: center; width: 100%; padding: 4px;">
                                Đã xong ca phục vụ
                              </div>
                            ` : ''}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          ${this._renderPaginationControls(this.dispatchPage, dispatchTotalPages, scopedStylists.length, 'AdminWeb.setDispatchPage', 'ghế cắt / nhân viên')}
        </div>
      `;

      this.bookingsPage = this.bookingsPage || 1;
      const bookingsTotalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (this.bookingsPage > bookingsTotalPages) this.bookingsPage = bookingsTotalPages;
      const pagedBookings = filtered.slice((this.bookingsPage - 1) * this.pageSize, this.bookingsPage * this.pageSize);

      const activeBookingSubTab = this.bookingSubTab || 'dispatcher';

      return `
        <!-- Thanh Chuyển Đổi Phân Hệ Tiếp Nhận & Lịch Hẹn -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
          <button type="button" class="admin-tab-btn ${activeBookingSubTab === 'dispatcher' ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${activeBookingSubTab === 'dispatcher' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchBookingSubTab('dispatcher')">
            Sơ Đồ Ghế &amp; Tiếp Nhận Sảnh
          </button>
          <button type="button" class="admin-tab-btn ${activeBookingSubTab === 'list' ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${activeBookingSubTab === 'list' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchBookingSubTab('list')">
            Danh Sách Lịch Hẹn (${filtered.length})
          </button>
        </div>

        ${activeBookingSubTab === 'dispatcher' ? `
          ${customerSearchHtml}
          ${timelineHtml}
        ` : `
          <div class="admin-table-container">
          <!-- Toolbar Bộ Lọc & Tìm Kiếm Bảng -->
          <div class="admin-table-toolbar">
            <div class="table-filter-group">
              <div class="search-input-wrapper" style="position: relative; display: inline-flex; align-items: center;">
                <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; color: var(--text-muted, #94a3b8); pointer-events: none;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" class="table-search-input" id="adminBookingsTableSearchInput"
                       placeholder="Lọc bảng theo Mã, Tên, SĐT..." 
                       style="padding-left: 36px; padding-right: 32px;"
                       value="${this.escapeHtml(this.searchQuery || '')}"
                       oninput="AdminWeb.handleBookingsSearch(this.value);">
                <button type="button" id="adminBookingsTableSearchClear" onclick="AdminWeb.clearBookingsTableSearch()" 
                        style="position: absolute; right: 8px; border: none; background: transparent; cursor: pointer; color: var(--text-muted, #94a3b8); display: ${this.searchQuery ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; width: 20px; height: 20px; font-size: 14px; font-weight: bold; border-radius: 50%;" title="Xóa tìm kiếm">✕</button>
              </div>

              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta" style="font-size: 11px;">Chi nhánh của bạn</span>
              ` : `
                <select class="table-select-filter" onchange="AdminWeb.filterBranch = this.value; AdminWeb.bookingsPage = 1; AdminWeb.refreshBookingsTable();">
                  <option value="all">Tất cả chi nhánh</option>
                  ${branches.map(b => `<option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                </select>
              `}

              <select class="table-select-filter" onchange="AdminWeb.filterStatus = this.value; AdminWeb.bookingsPage = 1; AdminWeb.refreshBookingsTable();">
                <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
                <option value="waiting" ${this.filterStatus === 'waiting' ? 'selected' : ''}>Chờ vào ghế</option>
                <option value="confirmed" ${this.filterStatus === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
                <option value="in_progress" ${this.filterStatus === 'in_progress' ? 'selected' : ''}>Đang cắt / Đã Check-in</option>
                <option value="completed" ${this.filterStatus === 'completed' ? 'selected' : ''}>Đã hoàn thành</option>
                <option value="cancelled" ${this.filterStatus === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
              </select>

              <input type="date" class="table-select-filter" 
                     value="${this.filterDate}" 
                     onchange="AdminWeb.filterDate = this.value; AdminWeb.bookingsPage = 1; AdminWeb.refreshBookingsTable();" 
                     title="Lọc theo ngày hẹn">
            </div>
          </div>

          <!-- Bảng Dữ Liệu Enterprise -->
          <div style="overflow-x: auto;">
            <table class="admin-enterprise-table">
              <thead>
                <tr>
                  <th style="white-space: nowrap;">Mã Lịch</th>
                  <th style="white-space: nowrap;">Khách Hàng</th>
                  <th style="white-space: nowrap;">Số Điện Thoại</th>
                  <th style="white-space: nowrap;">Dịch Vụ Đã Đặt</th>
                  <th style="white-space: nowrap;">Chi Nhánh</th>
                  <th style="white-space: nowrap;">Barber Phục Vụ</th>
                  <th style="white-space: nowrap;">Ngày &amp; Giờ Hẹn</th>
                  <th style="white-space: nowrap;">Tổng Tiền</th>
                  <th style="white-space: nowrap; text-align: center;">Trạng Thái</th>
                  <th style="white-space: nowrap;">Chuyển Trạng Thái Nhanh</th>
                  <th style="white-space: nowrap;">Hành Động</th>
                </tr>
              </thead>
              <tbody id="adminBookingsTbody">
                ${pagedBookings.length > 0 ? pagedBookings.map(b => {
                  const bDate = b.date || b.bookingDate;
                  const bTime = (b.timeSlot || '00:00').trim();
                  const statusInfo = SalonUtils.formatBookingStatus(b.status);
                  const isConfirmed = (b.status || '').toLowerCase() === 'confirmed';
                  const isWaiting = (b.status || '').toLowerCase() === 'waiting' || (b.status || '').toLowerCase() === 'chờ vào ghế';
                  const isInProgress = (b.status || '').toLowerCase() === 'in_progress';
                  const isCompleted = (b.status || '').toLowerCase() === 'completed';
                  const isNearest = (b.id === nearestBookingId);
                  const isPast = (bDate < todayStr) || (bDate === todayStr && bTime < nowTime && isConfirmed);
                  const isToday = (bDate === todayStr);

                  let rowClass = '';
                  if (isNearest) rowClass = 'booking-row-nearest';
                  else if (isPast) rowClass = 'booking-row-past';
                  else if (isToday) rowClass = 'booking-row-today';
                  if (isWaiting) rowClass += ' booking-row-waiting';

                  return `
                    <tr class="${rowClass}">
                      <td style="white-space: nowrap;"><strong>${this.escapeHtml(b.bookingCode || b.id)}</strong></td>
                      <td style="font-weight: 700; white-space: nowrap;">
                        <div style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                          <span style="font-size: 13px; color: var(--text-primary, #FAF8F5);">${this.escapeHtml(b.customerName)}</span>
                          ${isNearest ? `<span class="booking-nearest-tag" style="white-space: nowrap; flex-shrink: 0; font-size: 10px; padding: 2px 6px; margin: 0;">GẦN NHẤT</span>` : (isToday ? `<span class="booking-today-badge" style="white-space: nowrap; flex-shrink: 0; font-size: 10px; padding: 2px 6px; margin: 0;">HÔM NAY</span>` : '')}
                        </div>
                      </td>
                      <td style="white-space: nowrap;">${this.escapeHtml(b.customerPhone)}</td>
                      ${this._renderBookingServiceCell(b)}
                      <td style="white-space: nowrap;">${this.escapeHtml(this._getBranchShortName(b.branchName || b.branchId, bMap))}</td>
                      <td style="white-space: nowrap;"><strong>${this.escapeHtml(b.stylistName || (window.store && window.store.getStylistById(b.stylistId)?.name) || 'Tự Động Xếp Barber')}</strong></td>
                      <td style="white-space: nowrap;">
                        <strong style="font-size: ${isToday ? '14px' : '13px'}; color: ${isNearest ? '#f59e0b' : 'inherit'};">
                          ${this.escapeHtml(b.timeSlot || '')}
                        </strong>
                        <div style="font-size: 11.5px; color: ${isToday ? '#f59e0b; font-weight: 800;' : '#888;'}">
                          ${isToday ? 'Hôm Nay' : SalonUtils.formatDate(bDate)}
                          ${isPast ? ' (Quá giờ)' : ''}
                        </div>
                      </td>
                      <td style="font-weight: 900; color: #f59e0b; white-space: nowrap; font-size: ${isToday ? '14px' : '13px'};">${SalonUtils.formatCurrency(b.totalPrice)}</td>
                      <td style="white-space: nowrap; text-align: center;">
                        <span class="status-pill-pulse ${statusInfo.cssClass}">
                          <span class="pulse-dot"></span> ${statusInfo.label}
                        </span>
                      </td>
                      <td style="white-space: nowrap;">
                        <div style="display: flex; gap: 4px; align-items: center; white-space: nowrap;">
                          ${!isToday && !isInProgress && !isCompleted && !isWaiting ? `
                            <button class="btn-submit-terracotta" style="padding: 3px 6px; font-size: 10px; background: #f59e0b; border-color: #f59e0b; color: #000; font-weight: 700; white-space: nowrap;" 
                                    onclick="AdminWeb.checkinWaitingEarlyToday('${b.id}')" title="Khách đặt ngày ${SalonUtils.formatDate(bDate)} nhưng hôm nay tới chờ ghế">
                              Chờ Hôm Nay
                            </button>
                            <button class="btn-submit-terracotta" style="padding: 3px 6px; font-size: 10px; background: #d97706; white-space: nowrap;" 
                                    onclick="AdminWeb.checkinEarlyToday('${b.id}')" title="Khách đặt ngày ${SalonUtils.formatDate(bDate)} nhưng hôm nay tới làm luôn">
                              Làm Hôm Nay
                            </button>
                          ` : ''}

                          ${isConfirmed && isToday ? `
                            <button class="btn-submit-terracotta" style="padding: 3px 7px; font-size: 10.5px; background: #f59e0b; border-color: #f59e0b; color: #000; font-weight: 800; white-space: nowrap;" 
                                    onclick="AdminWeb.checkinBookingWaiting('${b.id}')" title="Khách đã có mặt tại sảnh, xếp vào danh sách chờ ghế">
                              Chờ Ghế
                            </button>
                            <button class="btn-submit-terracotta" style="padding: 3px 7px; font-size: 10.5px; white-space: nowrap;" 
                                    onclick="AdminWeb.updateBookingStatus('${b.id}', 'In_Progress')" title="Nhận khách vào ghế cắt">
                              Vào Ghế
                            </button>
                          ` : ''}

                          ${isWaiting ? `
                            <button class="btn-submit-terracotta" style="padding: 3px 8px; font-size: 10.5px; background: #10B981; border-color: #10B981; color: #fff; font-weight: 800; white-space: nowrap;" 
                                    onclick="AdminWeb.updateBookingStatus('${b.id}', 'In_Progress')" title="Đưa khách từ sảnh chờ vào ghế cắt">
                              Vào Ghế
                            </button>
                          ` : ''}

                          ${isInProgress ? `
                            <button class="btn-submit-terracotta" style="padding: 3px 8px; font-size: 10.5px; background: #059669; white-space: nowrap;" 
                                    onclick="AdminWeb.updateBookingStatus('${b.id}', 'Completed')" title="Hoàn tất ca cắt tóc">
                              Xong Ca
                            </button>
                          ` : ''}

                          <select class="table-select-filter" style="padding: 3px 6px; font-size: 10.5px; white-space: nowrap; max-width: 110px;" 
                                  onchange="AdminWeb.updateBookingStatus('${b.id}', this.value)">
                            <option value="Confirmed" ${isConfirmed ? 'selected' : ''}>Đã xác nhận</option>
                            <option value="Waiting" ${isWaiting ? 'selected' : ''}>Chờ vào ghế</option>
                            <option value="In_Progress" ${isInProgress ? 'selected' : ''}>Đang phục vụ</option>
                            <option value="Completed" ${isCompleted ? 'selected' : ''}>Đã hoàn thành</option>
                            <option value="Cancelled" ${(b.status || '').toLowerCase() === 'cancelled' ? 'selected' : ''}>Hủy ca hẹn</option>
                          </select>
                        </div>
                      </td>
                      <td style="white-space: nowrap;">
                        <div style="display: flex; gap: 4px; align-items: center; white-space: nowrap;">
                          <button class="pill-btn-outline" style="padding: 3px 6px; font-size: 10px;" 
                                  onclick="AdminWeb.viewBookingQrTicket('${b.id}')" title="Xem mã QR vé">
                            QR
                          </button>
                          <button class="pill-btn-outline" style="padding: 3px 6px; font-size: 10px; color: #b91c1c; border-color: #fca5a5;" 
                                  onclick="AdminWeb.deleteBooking('${b.id}')" title="Xóa lịch hẹn">
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="11" style="text-align:center; padding: 32px; color: #888;">
                      Không tìm thấy lịch hẹn nào theo điều kiện lọc hiện tại.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
          ${this._renderPaginationControls(this.bookingsPage, bookingsTotalPages, filtered.length, 'AdminWeb.setBookingsPage', 'lịch hẹn')}
        </div>
        `}
      `;
    },

    renderLookupResultsHtml(lookupQ, lookupResults, todayStr) {
      if (!lookupQ) return '';
      return `
        <div style="margin-top: 14px;">
          <div style="font-size: 13px; font-weight: 800; color: #f59e0b; margin-bottom: 8px;">
            Kết quả tìm kiếm cho "${this.escapeHtml(lookupQ)}" (${lookupResults.length} khách):
          </div>
          ${lookupResults.length > 0 ? `
            <div class="quick-search-results-box" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px;">
              ${lookupResults.map(b => {
                const bDate = b.date || b.bookingDate;
                const isToday = (bDate === todayStr);
                const isTomorrow = (new Date(bDate).getDate() === new Date(todayStr).getDate() + 1);
                const isDone = (b.status || '').toLowerCase() === 'completed';
                const isInProg = (b.status || '').toLowerCase() === 'in_progress';
                const isWaiting = (b.status || '').toLowerCase() === 'waiting' || (b.status || '').toLowerCase() === 'chờ vào ghế';

                return `
                  <div class="quick-customer-card ${isToday ? 'today-card' : ''} ${isWaiting ? 'waiting-card' : ''}" style="background: var(--surface-card); border: 1.5px solid ${isToday ? '#f59e0b' : (isWaiting ? '#f59e0b' : 'var(--border-color)')}; border-radius: 12px; padding: 14px 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                      <div>
                        <strong style="font-size: 15px; color: var(--text-primary);">${this.escapeHtml(b.customerName)}</strong>
                        <div style="font-size: 13px; color: var(--text-secondary);">${this.escapeHtml(b.customerPhone)} • #${this.escapeHtml(b.bookingCode || b.id)}</div>
                      </div>
                      <span style="font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; ${isToday ? 'background: #f59e0b; color: #000;' : 'background: rgba(255,255,255,0.08); color: var(--text-secondary);'}">
                        ${isToday ? 'HÔM NAY' : (isTomorrow ? 'SÁNG MAI' : `${SalonUtils.formatDate(bDate)}`)}
                      </span>
                    </div>
                    <div style="font-size: 13px; color: var(--text-primary); margin: 6px 0;">
                      <strong>${this.escapeHtml(b.serviceName || 'Dịch vụ')}</strong> • <strong>${this.escapeHtml(b.timeSlot)}</strong> (${SalonUtils.formatDate(bDate)})
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 8px; margin-top: 8px; flex-wrap: wrap; gap: 8px;">
                      <span style="font-size: 14px; font-weight: 800; color: #f59e0b;">${SalonUtils.formatCurrency(b.totalPrice)}</span>
                      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        ${!isToday && !isDone && !isInProg && !isWaiting ? `
                          <button class="btn-submit-terracotta" style="padding: 5px 10px; font-size: 11px; background: #f59e0b; border-color: #f59e0b; color: #000; font-weight: 700;" 
                                  onclick="AdminWeb.checkinWaitingEarlyToday('${b.id}')" title="Khách đặt ngày ${SalonUtils.formatDate(bDate)} nhưng tới sớm hôm nay, đưa vào danh sách chờ">
                            Chờ Hôm Nay
                          </button>
                          <button class="btn-submit-terracotta" style="padding: 5px 10px; font-size: 11px; background: #d97706;" 
                                  onclick="AdminWeb.checkinEarlyToday('${b.id}')" title="Khách đặt ngày ${SalonUtils.formatDate(bDate)} nhưng hôm nay tới làm luôn">
                            Làm Hôm Nay
                          </button>
                        ` : ''}

                        ${isToday && !isInProg && !isDone && !isWaiting ? `
                          <button class="btn-submit-terracotta" style="padding: 5px 10px; font-size: 11px; background: #f59e0b; border-color: #f59e0b; color: #000; font-weight: 700;" 
                                  onclick="AdminWeb.checkinBookingWaiting('${b.id}')" title="Khách đã có mặt tại sảnh, xếp vào danh sách chờ ghế">
                            Chờ Vào Ghế
                          </button>
                          <button class="btn-submit-terracotta" style="padding: 5px 10px; font-size: 11px;" 
                                  onclick="AdminWeb.updateBookingStatus('${b.id}', 'In_Progress')" title="Đưa khách thẳng vào ghế cắt">
                            Vào Ghế Cắt
                          </button>
                        ` : ''}

                        ${isWaiting ? `
                          <span style="font-size: 11px; font-weight: 800; color: #f59e0b; padding: 4px 8px; background: rgba(245, 158, 11, 0.15); border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                            ĐANG CHỜ GHẾ
                          </span>
                          <button class="btn-submit-terracotta" style="padding: 5px 12px; font-size: 11px; background: #10b981; border-color: #10b981; color: #fff; font-weight: 700;" 
                                  onclick="AdminWeb.updateBookingStatus('${b.id}', 'In_Progress')" title="Gọi khách vào ghế cắt">
                            Vào Ghế Làm Ngay
                          </button>
                        ` : ''}

                        ${isInProg ? `
                          <button class="btn-submit-terracotta" style="padding: 5px 12px; font-size: 11px; background: #10b981;" 
                                  onclick="AdminWeb.updateBookingStatus('${b.id}', 'Completed')">
                            Hoàn Tất Ca
                          </button>
                        ` : ''}
                        ${isDone ? `<span style="font-size: 12px; color: #10b981; font-weight: 700;">Đã hoàn tất</span>` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div style="padding: 12px; background: rgba(0,0,0,0.03); border-radius: 8px; font-size: 13px; color: var(--text-secondary);">
              Không tìm thấy lịch hẹn nào của khách hàng với từ khóa "${this.escapeHtml(lookupQ)}".
            </div>
          `}
        </div>
      `;
    },

    handleCustomerLookup(val) {
      this.customerLookupQuery = val;
      const container = document.getElementById('quickBookingSearchResultsContainer');
      if (!container) return;
      const q = (val || '').toLowerCase().trim();
      const bookings = (window.store && window.store.getBookings()) || [];
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      let results = [];
      if (q) {
        results = bookings.filter(b =>
          (b.id && b.id.toLowerCase().includes(q)) ||
          (b.bookingCode && b.bookingCode.toLowerCase().includes(q)) ||
          (b.customerName && b.customerName.toLowerCase().includes(q)) ||
          (b.customerPhone && b.customerPhone.includes(q))
        );
      }
      container.innerHTML = this.renderLookupResultsHtml(q, results, todayStr);
    },

    handleBookingsSearch(val) {
      this.searchQuery = val;
      this.bookingsPage = 1;
      const clearBtn = document.getElementById('adminBookingsTableSearchClear');
      if (clearBtn) clearBtn.style.display = val ? 'inline-flex' : 'none';
      this.refreshBookingsTable();
    },

    clearBookingsTableSearch() {
      this.searchQuery = '';
      this.bookingsPage = 1;
      const inp = document.getElementById('adminBookingsTableSearchInput');
      if (inp) {
        inp.value = '';
        inp.focus();
      }
      const clearBtn = document.getElementById('adminBookingsTableSearchClear');
      if (clearBtn) clearBtn.style.display = 'none';
      this.refreshBookingsTable();
    },

    refreshBookingsTable() {
      const content = document.getElementById('adminSubTabContent');
      if (content && this.adminSubTab === 'bookings') {
        const activeEl = document.activeElement;
        const activeId = activeEl ? activeEl.id : null;
        const selStart = (activeEl && typeof activeEl.selectionStart === 'number') ? activeEl.selectionStart : null;
        const selEnd = (activeEl && typeof activeEl.selectionEnd === 'number') ? activeEl.selectionEnd : null;

        const user = this.getCurrentUser();
        const bookings = window.store.getBookings();
        const branches = window.store.getBranches();
        const stylists = window.store.getStylists();
        content.innerHTML = this.renderBookingsTab(user, bookings, branches, stylists);

        if (activeId) {
          const restored = document.getElementById(activeId);
          if (restored) {
            restored.focus();
            if (selStart !== null && selEnd !== null && typeof restored.setSelectionRange === 'function') {
              restored.setSelectionRange(selStart, selEnd);
            }
          }
        }
      }
    },

    checkinEarlyToday(bookingId) {
      if (!bookingId) return;
      if (window.store && typeof window.store.checkinBookingEarlyToday === 'function') {
        const b = window.store.checkinBookingEarlyToday(bookingId);
        if (b && window.UICommon) {
          window.UICommon.showToast(`Đã chuyển lịch khách ${b.customerName} sang phục vụ ngay hôm nay (${b.timeSlot})!`, 'success');
        }
      } else {
        window.store.updateBookingStatus(bookingId, 'In_Progress');
      }
      this.refreshBookingsTable();
    },

    checkinWaitingEarlyToday(bookingId) {
      if (!bookingId) return;
      if (window.store && typeof window.store.checkinWaitingEarlyToday === 'function') {
        const b = window.store.checkinWaitingEarlyToday(bookingId);
        if (b && window.UICommon) {
          window.UICommon.showToast(`Đã chuyển khách ${b.customerName} sang danh sách chờ hôm nay (${b.timeSlot})!`, 'success');
        }
      } else {
        this.updateBookingStatus(bookingId, 'Waiting');
      }
      this.refreshBookingsTable();
    },

    checkinBookingWaiting(bookingId) {
      if (!bookingId) return;
      if (window.store && typeof window.store.checkinBookingWaiting === 'function') {
        window.store.checkinBookingWaiting(bookingId);
      } else {
        this.updateBookingStatus(bookingId, 'Waiting');
        return;
      }
      const b = (window.store.getBookings() || []).find(item => item.id === bookingId || item.bookingCode === bookingId);
      if (window.UICommon) {
        window.UICommon.showToast(`Đã tiếp nhận khách ${b ? b.customerName : '#' + bookingId} vào sảnh chờ ghế!`, 'success');
      }
      this.refreshBookingsTable();
    },

    updateBookingStatus(bookingId, newStatus) {
      if (!bookingId || !newStatus) return;

      if (newStatus === 'Cancelled') {
        this.openCancelBookingModal(bookingId);
        return;
      }

      window.store.updateBookingStatus(bookingId, newStatus);

      if (window.UICommon) {
        const statusLabel = (newStatus === 'Waiting' || newStatus === 'waiting') ? 'Chờ vào ghế' : (newStatus === 'In_Progress' ? 'Đang phục vụ (Vào ghế)' : newStatus);
        window.UICommon.showToast(`Đã chuyển lịch #${bookingId} sang [${statusLabel}]!`, 'success');
      }
      this.refreshBookingsTable();
    },

    openCancelBookingModal(bookingId) {
      const b = (window.store && typeof window.store.getBookings === 'function')
        ? (window.store.getBookings() || []).find(item => item.id === bookingId || item.bookingCode === bookingId)
        : null;
      const customerName = b ? (b.customerName || b.HoTenKH || 'Khách Vãng Lai') : 'Khách Vãng Lai';
      const customerPhone = b ? (b.phone || b.customerPhone || b.SoDienThoai || '') : '';
      const serviceName = b ? (b.serviceName || b.TenDichVu || 'Dịch vụ Barber') : 'Dịch vụ Barber';
      const barberName = b ? (b.barberName || b.stylistName || 'Đỗ Đình Độ') : 'Đỗ Đình Độ';
      const timeSlot = b ? (b.timeSlot || b.GioHen || '08:30') : '08:30';
      const priceFormatted = b ? (typeof SalonUtils !== 'undefined' ? SalonUtils.formatCurrency(b.totalPrice || b.TongTien || 150000) : '150.000 đ') : '150.000 đ';

      const modalHtml = `
        <div style="padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; border-bottom: 1px solid var(--border-color); padding-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); display: flex; align-items: center; justify-content: center; color: #ef4444; flex-shrink: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              </div>
              <div>
                <h3 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0; letter-spacing: -0.01em;">Xác Nhận Hủy Lịch Hẹn #${this.escapeHtml(bookingId)}</h3>
                <div style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                  <span>Khách: <strong style="color: var(--text-primary);">${this.escapeHtml(customerName)}</strong></span>
                  ${customerPhone ? `<span>• ${this.escapeHtml(customerPhone)}</span>` : ''}
                </div>
              </div>
            </div>
            <button type="button" onclick="AdminWeb._closeModal()" style="background: none; border: none; font-size: 20px; color: var(--text-secondary); cursor: pointer; padding: 4px; line-height: 1;" title="Đóng">✕</button>
          </div>

          <div style="background: var(--surface-elevated, rgba(255,255,255,0.04)); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px 14px; margin-bottom: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12.5px;">
            <div>
              <span style="color: var(--text-secondary); display: block; font-size: 11px; margin-bottom: 2px;">Dịch vụ đã đặt</span>
              <strong style="color: var(--text-primary);">${this.escapeHtml(serviceName)}</strong>
              <span style="color: var(--brand-accent, #C59B27); font-weight: 700; margin-left: 6px;">${priceFormatted}</span>
            </div>
            <div>
              <span style="color: var(--text-secondary); display: block; font-size: 11px; margin-bottom: 2px;">Barber &amp; Khung giờ</span>
              <strong style="color: var(--text-primary);">${this.escapeHtml(barberName)}</strong>
              <span style="color: #f59e0b; font-weight: 700; margin-left: 6px;">${this.escapeHtml(timeSlot)}</span>
            </div>
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 12.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
              Lý do hủy lịch:
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="cancelQuickReasonGroup">
              ${[
                'Khách báo bận ca đột xuất',
                'Khách đổi lịch hẹn khác',
                'Khách không đến (No-show)',
                'Salon quá tải / Thợ bận',
                'Lý do cá nhân'
              ].map((r, idx) => `
                <button type="button" 
                        class="quick-cancel-pill" 
                        style="padding: 5px 12px; font-size: 12px; font-weight: 600; border-radius: 20px; cursor: pointer; transition: all 0.15s; ${idx === 0 
                          ? 'background: #ef4444; color: #fff; border: 1px solid #ef4444;' 
                          : 'background: var(--surface-card); color: var(--text-secondary); border: 1px solid var(--border-color);'}"
                        onclick="AdminWeb.selectCancelReason(this, '${this.escapeHtml(r)}')">
                  ${this.escapeHtml(r)}
                </button>
              `).join('')}
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label for="cancelBookingReasonInput" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
              Ghi chú lý do (lưu vào nhật ký kiểm toán hệ thống):
            </label>
            <textarea id="cancelBookingReasonInput" class="form-control-custom" rows="2" 
                      style="width: 100%; border-radius: 8px; padding: 8px 12px; font-size: 13px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); resize: vertical;"
                      placeholder="Nhập lý do chi tiết...">Khách báo bận ca đột xuất</textarea>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end; align-items: center; border-top: 1px solid var(--border-color); padding-top: 14px;">
            <button type="button" class="pill-btn-outline" style="padding: 8px 18px; font-size: 12.5px; font-weight: 700; border-radius: 8px;" onclick="AdminWeb._closeModal()">
              Giữ Lại Lịch Hẹn
            </button>
            <button type="button" class="btn-submit-terracotta" style="padding: 8px 22px; font-size: 12.5px; font-weight: 800; border-radius: 8px; background: #ef4444; border-color: #ef4444; color: #fff; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 10px rgba(239,68,68,0.3); cursor: pointer;" 
                    onclick="AdminWeb.confirmCancelBooking('${this.escapeHtml(bookingId)}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Xác Nhận Hủy Lịch
            </button>
          </div>
        </div>
      `;

      this._openModal(modalHtml, 'medium');
    },

    selectCancelReason(btn, text) {
      const container = document.getElementById('cancelQuickReasonGroup');
      if (container) {
        container.querySelectorAll('.quick-cancel-pill').forEach(b => {
          b.style.background = 'var(--surface-card)';
          b.style.color = 'var(--text-secondary)';
          b.style.borderColor = 'var(--border-color)';
        });
      }
      btn.style.background = '#ef4444';
      btn.style.color = '#fff';
      btn.style.borderColor = '#ef4444';
      const input = document.getElementById('cancelBookingReasonInput');
      if (input) {
        input.value = text;
        input.focus();
      }
    },

    confirmCancelBooking(bookingId) {
      const input = document.getElementById('cancelBookingReasonInput');
      const reason = (input && input.value.trim()) ? input.value.trim() : 'Khách báo bận ca đột xuất';
      if (window.store && typeof window.store.cancelBooking === 'function') {
        window.store.cancelBooking(bookingId, reason);
      }
      this._closeModal();
      if (window.UICommon) {
        window.UICommon.showToast(`Đã hủy lịch hẹn #${bookingId} (${reason})!`, 'info');
      }
      this.refreshBookingsTable();
      if (this.adminSubTab === 'overview') {
        this.refreshSubTab();
      }
    },

    renderWaitingLoungeHtml(waitingBookings = [], todayStr, nowTime) {
      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 15px; color: var(--text-primary);">Khu Vực Khách Đang Chờ Sảnh Tiếp Nhận &amp; Check-in</strong>
              <span class="status-pill-pulse status-waiting" style="font-size: 11px; padding: 2px 8px;">
                <span class="pulse-dot"></span> ${waitingBookings.length} Khách Đang Chờ
              </span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              Bấm <strong>"Vào Ghế Làm Ngay"</strong> khi ghế cắt đã sẵn sàng đón khách
            </div>
          </div>

          ${waitingBookings.length === 0 ? `
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed var(--border-color); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <span style="font-size: 12.5px; color: var(--text-secondary);">
                Sảnh chờ hiện đang trống. Chưa có khách nào đang chờ tại sảnh.
              </span>
              <span style="font-size: 12px; color: var(--text-muted, #71717a);">
                Khách đến quầy thanh toán hoặc đặt lịch tại tab "Thu Ngân POS & Hóa Đơn"
              </span>
            </div>
          ` : `
            <div class="waiting-lounge-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 12px;">
              ${waitingBookings.map((b, idx) => {
                const waitTimeDisplay = b.waitingAt ? new Date(b.waitingAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : (b.timeSlot || 'Vừa đến');

                return `
                  <div class="waiting-lounge-card" style="background: var(--surface-card, #1c1c1e); border: 1.5px solid #f59e0b; border-radius: 12px; padding: 14px 16px; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.12); position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: #f59e0b; color: #000; font-weight: 900; font-size: 11.5px;">
                          #${idx + 1}
                        </span>
                        <div>
                          <strong style="font-size: 14.5px; color: var(--text-primary); display: block;">${this.escapeHtml(b.customerName || 'Khách vãng lai')}</strong>
                          <span style="font-size: 12px; color: var(--text-secondary);">${this.escapeHtml(b.customerPhone || 'Không có SĐT')} • #${this.escapeHtml(b.bookingCode || b.id)}</span>
                        </div>
                      </div>
                      <span class="status-pill-pulse status-waiting" style="font-size: 10.5px; padding: 2px 7px;">
                        <span class="pulse-dot"></span> Chờ ghế
                      </span>
                    </div>

                    <div style="font-size: 12px; color: var(--text-secondary); background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border-color);">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Dịch vụ: <strong style="color: #f59e0b;">${this.escapeHtml(b.serviceName || 'Dịch vụ')}</strong></span>
                        <strong style="color: var(--text-primary);">${SalonUtils.formatCurrency(b.totalPrice || 0)}</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span>Barber: <strong style="color: var(--text-primary);">${this.escapeHtml(b.stylistName || 'Tự động xếp')}</strong></span>
                        <span style="color: #f59e0b;">Hẹn: ${this.escapeHtml(b.timeSlot || '')} (Chờ từ ${waitTimeDisplay})</span>
                      </div>
                    </div>

                    <div style="display: gap: 8px; align-items: center; display: flex;">
                      <button type="button" class="btn-submit-terracotta" style="padding: 7px 12px; font-size: 11.5px; flex: 1; background: #10B981; border-color: #10B981; color: #fff; font-weight: 800; border-radius: 8px; cursor: pointer;" 
                              onclick="AdminWeb.updateBookingStatus('${b.id}', 'In_Progress')" title="Đưa khách từ sảnh chờ vào ghế cắt">
                        Vào Ghế Làm Ngay
                      </button>
                      <button type="button" class="pill-btn-outline" style="padding: 7px 10px; font-size: 11.5px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4); border-radius: 8px; cursor: pointer;" 
                              onclick="AdminWeb.openCancelBookingModal('${b.id}')" title="Hủy ca / Khách rời khỏi sảnh">
                        Hủy
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // INLINE BOTTOM WALKIN EDITOR (ĐẶT NGAY DƯỚI ĐÁY TRANG GIỐNG CÁC PHÂN HỆ KHÁC)
    // -----------------------------------------------------------------------
    _renderWalkinBottomEditor(user, branches, stylists, services = []) {
      return '';
    },

    openQuickWalkinModal() {
      // Đã chuyển tính năng đặt lịch và bán hàng sang Quầy thu ngân POS
      if (typeof AdminWeb.switchTab === 'function') {
        AdminWeb.switchTab('pos');
      }
    },

    submitQuickWalkin(e) {
      if (e) e.preventDefault();
      const nameInput = document.getElementById('walkinCustomerName');
      const phoneInput = document.getElementById('walkinCustomerPhone');
      const branchSelect = document.getElementById('walkinBranchId');
      const stylistSelect = document.getElementById('walkinStylistId');
      const serviceSelect = document.getElementById('walkinServiceId');
      const notesInput = document.getElementById('walkinNotes');

      if (!nameInput || !phoneInput || !nameInput.value.trim() || !phoneInput.value.trim()) {
        alert('Vui lòng nhập Tên và Số điện thoại khách hàng!');
        return;
      }

      const branchId = branchSelect ? branchSelect.value : 'CN01';
      const stylistId = stylistSelect ? stylistSelect.value : null;
      const selectedOption = serviceSelect?.selectedOptions?.[0];
      const serviceId = serviceSelect ? serviceSelect.value : null;
      const serviceName = selectedOption ? selectedOption.getAttribute('data-name') : 'Combo Cắt Tóc Tiêu Chuẩn';
      const price = selectedOption ? Number(selectedOption.getAttribute('data-price') || 180000) : 180000;
      const notes = notesInput ? notesInput.value.trim() : '';

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const nowH = String(today.getHours()).padStart(2, '0');
      const nowM = String(today.getMinutes()).padStart(2, '0');
      const nowTime = `${nowH}:${nowM}`;

      const bookingData = {
        customerName: nameInput.value.trim(),
        customerPhone: phoneInput.value.trim(),
        branchId: branchId,
        stylistId: stylistId || null,
        serviceId: serviceId,
        serviceName: serviceName,
        serviceIds: serviceId ? [serviceId] : [],
        totalPrice: price,
        date: todayStr,
        timeSlot: nowTime,
        status: 'Waiting',
        paymentStatus: 'Unpaid',
        paymentMethod: 'Counter_Cash',
        notes: notes ? `[Walk-in] ${notes}` : '[Khách Vãng Lai Tiếp Nhận Tại Quầy]'
      };

      if (window.store && typeof window.store.createBooking === 'function') {
        const newB = window.store.createBooking(bookingData);
        if (newB && window.store.checkinBookingWaiting) {
          window.store.checkinBookingWaiting(newB.id);
        }
      }

      this._closeModal();
      if (window.UICommon) {
        window.UICommon.showToast(`Đã tiếp nhận khách vãng lai ${bookingData.customerName} vào sảnh chờ!`, 'success');
      }
      this.refreshBookingsTable();
    },

    deleteBooking(bookingId) {
      this.openUniversalDeleteModal('bookings', bookingId);
    },

    viewBookingQrTicket(bookingId) {
      const b = (window.store.getBookings() || []).find(item => item.id === bookingId || item.bookingCode === bookingId);
      if (!b) return;

      const qrCodeText = `OMNI-${b.bookingCode || b.id}-${b.customerPhone}`;
      const qrSvg = SalonUtils.generateQrSvgCode ? SalonUtils.generateQrSvgCode(qrCodeText) : '';

      this._openModal(`
        <div class="booking-wizard-wrapper" style="max-width: 460px; text-align: center; margin: 0 auto;">
          <div class="badge-terracotta">VÉ ĐIỆN TỬ VÉ QUẢN TRỊ</div>
          <h2 class="booking-title" style="font-size: 20px; margin-top: 6px;">${this.escapeHtml(b.bookingCode || b.id)}</h2>
          <p class="booking-subtitle">Mã xác thực tiếp nhận khách tại quầy thu ngân</p>

          <div style="background: #ffffff; padding: 18px; border-radius: 12px; display: inline-block; margin: 14px auto; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 2px dashed #c85a44;">
            ${qrSvg}
            <div style="font-size: 12px; font-weight: 800; color: #111; letter-spacing: 0.08em; margin-top: 6px;">
              MÃ CHECK-IN: ${this.escapeHtml(qrCodeText)}
            </div>
          </div>

          <div style="text-align: left; background: var(--surface-elevated); border-radius: 10px; padding: 12px 16px; font-size: 13px; line-height: 1.6; margin-bottom: 16px; border: 1px solid var(--border-color); color: var(--text-primary);">
            <div><strong>Khách hàng:</strong> ${this.escapeHtml(b.customerName)} (${this.escapeHtml(b.customerPhone)})</div>
            <div><strong>Dịch vụ:</strong> ${this.escapeHtml(b.serviceName || 'Dịch vụ')}</div>
            <div><strong>Thời gian:</strong> <span style="color:var(--color-accent-gold); font-weight:800;">${b.timeSlot} | ${SalonUtils.formatDate(b.date || b.bookingDate)}</span></div>
            <div><strong>Barber:</strong> ${this.escapeHtml(b.stylistName || 'Chỉ định')}</div>
            <div><strong>Chi nhánh:</strong> ${this.escapeHtml(b.branchName || b.branchId)}</div>
          </div>

          <button class="btn-submit-terracotta" style="width: 100%;" onclick="AdminWeb._closeModal()">
            Đóng Cửa Sổ →
          </button>
        </div>
      `);
    }
  });

})(typeof window !== 'undefined' ? window : this);
