// =========================================================================
// OmniSalon / 4RAU Barbershop — MOBILE ADMIN & STAFF CONSOLE
// Phiên bản: 2.3.0 Clean Architecture & Ponytail Optimized
// (Ca Hôm Nay Barber, Mobile POS Ghế Cắt, Kiểm Kho Nhanh, Ví Hoa Hồng 15%)
// Tuân thủ: docs/file_plan.json (TASK-09-MOBILE-ADMIN-STAFF) & 03_coder.md
// =========================================================================

(function (window) {
  'use strict';

  const AdminApp = {
    activeTab: 'queue', // 'queue' | 'pos' | 'inventory' | 'wallet'
    isActive: false,
    selectedDate: new Date().toISOString().split('T')[0],
    queueStatusFilter: 'all', // 'all' | 'Confirmed' | 'In_Progress' | 'Completed'
    selectedStylistId: null,
    activeBranchId: 'br-dbp',
    inventorySearchQuery: '',

    posState: {
      bookingId: null,
      customerName: '',
      customerPhone: '',
      serviceId: null,
      productId: null,
      paymentMethod: 'CASH', // 'CASH' | 'VIETQR'
      voucherCode: '',
      discountAmount: 0
    },

    // -----------------------------------------------------------------------
    // 1. RBAC, MODE INITIALIZATION & ROLE-SWITCHING
    // -----------------------------------------------------------------------
    getCurrentUser() {
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        return window.AuthEngine.getCurrentUser();
      }
      if (window.store && typeof window.store.getCurrentUser === 'function') {
        return window.store.getCurrentUser();
      }
      return null;
    },

    canAccess(user = null) {
      const u = user || this.getCurrentUser();
      if (!u || !u.role) return false;
      const staffRoles = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'STYLIST'];
      return staffRoles.includes(String(u.role).toUpperCase());
    },

    init(container = null) {
      const user = this.getCurrentUser();
      if (!this.canAccess(user)) {
        if (window.UICommon) {
          window.UICommon.showToast('⛔ [403 Forbidden] Tài khoản không có quyền truy cập Staff Console.', 'error');
          if (typeof window.UICommon.openAuthModal === 'function') {
            window.UICommon.openAuthModal();
          }
        }
        return false;
      }

      this.isActive = true;
      this.activeTab = 'queue';
      this.activeBranchId = user.branchId || (window.store ? window.store.getCurrentBranch()?.id : 'br-dbp');
      
      // Mặc định chọn stylist là chính thợ đang đăng nhập (nếu là STYLIST) hoặc 'all' cho Quản lý/Thu ngân
      if (user.role === 'STYLIST') {
        this.selectedStylistId = user.id;
      } else {
        this.selectedStylistId = 'all';
      }

      // Tích hợp đồng bộ với Vỏ máy UIApp
      if (window.UIApp) {
        window.UIApp.mode = 'staff';
        window.UIApp.renderAppFrame();
      } else if (container) {
        container.innerHTML = this.render();
      }

      if (window.UICommon) {
        window.UICommon.showToast(`⚡ Chào ${user.name || user.fullName}! Đã mở Staff Console (${user.role}).`, 'success');
      }
      return true;
    },

    exitStaffMode() {
      this.isActive = false;
      if (window.UIApp) {
        window.UIApp.mode = 'customer';
        window.UIApp.renderAppFrame();
        window.UIApp.switchTab('profile');
      }
      if (window.UICommon) {
        window.UICommon.showToast('🔄 Đã quay về Chế Độ Khách Hàng.', 'info');
      }
    },

    switchTab(tabName) {
      if (!['queue', 'pos', 'inventory', 'wallet'].includes(tabName)) return;
      this.activeTab = tabName;
      this.refreshCurrentView();
    },

    refreshCurrentView(preserveScroll = false) {
      const scrollContainer = document.getElementById('androidScrollContent');
      const prevScrollTop = (preserveScroll && scrollContainer) ? scrollContainer.scrollTop : 0;
      if (scrollContainer) {
        scrollContainer.innerHTML = this.renderActiveTabContent();
        scrollContainer.scrollTop = preserveScroll ? prevScrollTop : 0;
      }
      // Cập nhật trạng thái active của Staff Bottom Nav
      const navItems = document.querySelectorAll('.staff-bottom-nav-item');
      navItems.forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(this.activeTab)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    },

    // -----------------------------------------------------------------------
    // 2. DISPATCHER & GIAO DIỆN NỘI DUNG 4 MÀN HÌNH CHÍNH
    // -----------------------------------------------------------------------
    renderActiveTabContent() {
      switch (this.activeTab) {
        case 'queue':
          return this.renderQueueTab();
        case 'pos':
          return this.renderPosTab();
        case 'inventory':
          return this.renderInventoryTab();
        case 'wallet':
          return this.renderWalletTab();
        default:
          return this.renderQueueTab();
      }
    },

    // -----------------------------------------------------------------------
    // 3. MÀN HÌNH 1: CA LÀM HÔM NAY CỦA BARBER (STYLIST TODAY QUEUE)
    // -----------------------------------------------------------------------
    renderQueueTab() {
      const user = this.getCurrentUser();
      // Khử N+1 / redundant queries: Fetch 1 lần duy nhất
      const branchBookings = (window.store && typeof window.store.getBookings === 'function')
        ? window.store.getBookings(this.activeBranchId)
        : [];
      const allBookings = branchBookings.length > 0 ? branchBookings : (window.store?.getBookings() || []);
      
      const branchStylists = (window.store && typeof window.store.getStylists === 'function')
        ? window.store.getStylists(this.activeBranchId)
        : [];
      const stylists = branchStylists.length > 0 ? branchStylists : (window.store?.getStylists() || []);

      // Lọc danh sách ca theo ngày và theo thợ
      let list = allBookings.filter(b => {
        const matchDate = (this.selectedDate === 'all') || (b.date === this.selectedDate);
        let matchStylist = true;
        if (user && user.role === 'STYLIST') {
          matchStylist = (b.stylistId === user.id) || (b.stylistName && b.stylistName.includes(user.name));
        } else if (this.selectedStylistId && this.selectedStylistId !== 'all') {
          matchStylist = (b.stylistId === this.selectedStylistId);
        }
        return matchDate && matchStylist;
      });

      // Lọc theo trạng thái
      if (this.queueStatusFilter !== 'all') {
        list = list.filter(b => b.status === this.queueStatusFilter);
      }

      // Sắp xếp theo khung giờ
      list.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

      const todayStr = new Date().toISOString().split('T')[0];

      return `
        <div class="staff-console-page" style="padding: 14px 14px 30px;">
          <!-- Queue Header & Role Indicator -->
          <div class="staff-header-banner">
            <div>
              <div class="staff-badge-role">✨ OMNI SALON WORKSTATION</div>
              <h2 style="font-size: 18px; font-weight: 900; margin: 4px 0 2px; color: var(--text-primary);">Ca Phục Vụ Stylist</h2>
              <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">Điều phối ca One-Thumb Control & hoàn tất dịch vụ trực tiếp</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button type="button" class="theme-toggle-btn" onclick="window.ThemeEngine && window.ThemeEngine.toggleTheme()" title="Chuyển chế độ Sáng / Tối" style="width:34px;height:34px;">
                <span class="theme-icon icon-moon">🌙</span>
                <span class="theme-icon icon-sun">☀️</span>
              </button>
              <button type="button" class="btn-exit-staff" onclick="AdminApp.exitStaffMode()" title="Quay về khách hàng">
                🔄 Khách
              </button>
            </div>
          </div>

          <!-- Barber Switcher (Đối với Quản Lý / Thu Ngân) -->
          ${user && user.role !== 'STYLIST' && stylists.length > 0 ? `
            <div style="margin-bottom: 12px;">
              <label style="font-size: 11px; font-weight: 700; color: #4b5563; display: block; margin-bottom: 4px;">Xem Ca Theo Thợ:</label>
              <select class="staff-select-input" onchange="AdminApp.setStylistFilter(this.value)">
                <option value="all" ${this.selectedStylistId === 'all' ? 'selected' : ''}>-- Tất Cả Barber Chi Nhánh --</option>
                ${stylists.map(s => `
                  <option value="${s.id}" ${this.selectedStylistId === s.id ? 'selected' : ''}>✂️ ${this.escapeHtml(s.name)} (${s.level || 'Master'})</option>
                `).join('')}
              </select>
            </div>
          ` : ''}

          <!-- Quick Date Pills Filter -->
          <div class="staff-filter-pills-bar">
            <button type="button" class="staff-pill-btn ${this.selectedDate === todayStr ? 'active' : ''}" onclick="AdminApp.setDateFilter('${todayStr}')">
              Hôm Nay
            </button>
            <button type="button" class="staff-pill-btn ${this.selectedDate === 'all' ? 'active' : ''}" onclick="AdminApp.setDateFilter('all')">
              Tất Cả Ca
            </button>
          </div>

          <!-- Status Filter Tabs -->
          <div class="staff-status-subnav">
            <button type="button" class="subnav-pill ${this.queueStatusFilter === 'all' ? 'active' : ''}" onclick="AdminApp.setStatusFilter('all')">
              Tất Cả (${list.length})
            </button>
            <button type="button" class="subnav-pill ${this.queueStatusFilter === 'Confirmed' ? 'active' : ''}" onclick="AdminApp.setStatusFilter('Confirmed')">
              Chờ Cắt
            </button>
            <button type="button" class="subnav-pill ${this.queueStatusFilter === 'In_Progress' ? 'active' : ''}" onclick="AdminApp.setStatusFilter('In_Progress')">
              Đang Cắt
            </button>
            <button type="button" class="subnav-pill ${this.queueStatusFilter === 'Completed' ? 'active' : ''}" onclick="AdminApp.setStatusFilter('Completed')">
              Đã Xong
            </button>
          </div>

          <!-- Bookings List Cards -->
          <div class="staff-queue-list">
            ${list.length === 0 ? `
              <div class="staff-empty-card">
                <div style="font-size: 32px; margin-bottom: 6px;">✂️</div>
                <div style="font-weight: 800; font-size: 14px; color: #374151;">Không Có Ca Đặt Nào</div>
                <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Hiện chưa có khách đặt lịch trong khoảng thời gian đã chọn</div>
              </div>
            ` : list.map(b => this._renderQueueCard(b)).join('')}
          </div>
        </div>
      `;
    },

    _renderQueueCard(booking) {
      const statusMeta = this._getBookingStatusMeta(booking.status);
      const isConfirmed = booking.status === 'Confirmed';
      const isInProgress = booking.status === 'In_Progress';
      const isCompleted = booking.status === 'Completed';

      // One-Thumb Countdown calculation
      let countdownHtml = '';
      if (isConfirmed) {
        countdownHtml = `
          <div class="one-thumb-countdown" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.25); border-radius: 999px; font-size: 11px; font-weight: 800; color: var(--color-accent-gold, #D4AF37);">
            <span class="countdown-pulse" style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #D4AF37;"></span>
            ⏳ Khách đến sau: 15 phút
          </div>
        `;
      } else if (isInProgress) {
        countdownHtml = `
          <div class="one-thumb-countdown in-progress" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); border-radius: 999px; font-size: 11px; font-weight: 800; color: #10B981;">
            <span class="countdown-pulse" style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10B981;"></span>
            ⚡ Đang phục vụ: 25/${booking.durationMinutes || 45} phút
          </div>
        `;
      }

      return `
        <div class="staff-queue-card one-thumb-card ${isInProgress ? 'border-highlight-active' : ''}" style="border-radius: 18px; padding: 16px; margin-bottom: 14px; background: var(--surface-card, #131722); border: 1px solid ${isInProgress ? 'var(--color-accent-gold, #D4AF37)' : 'rgba(255,255,255,0.08)'}; box-shadow: 0 4px 14px rgba(0,0,0,0.12);">
          <div class="queue-card-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div class="queue-time-badge" style="font-weight: 800; font-size: 13.5px; color: #FFF;">
              ⏰ ${this.escapeHtml(booking.timeSlot || '09:00')}
              <span style="font-weight: 500; font-size: 11px; color: #94A3B8;">(${booking.durationMinutes || 45}p)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${countdownHtml}
              <span class="staff-status-badge ${statusMeta.cssClass}">${statusMeta.label}</span>
            </div>
          </div>

          <div class="queue-card-body" style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h4 style="font-size: 16px; font-weight: 900; margin: 0 0 4px; color: #FFF;">
                  ${this.escapeHtml(booking.customerName || 'Khách Hàng')}
                </h4>
                <a href="tel:${this.escapeHtml(booking.customerPhone || '')}" class="queue-customer-phone" style="font-size: 12.5px; font-weight: 700; color: #94A3B8; text-decoration: none;">
                  📞 ${this.escapeHtml(booking.customerPhone || '090-XXX-XXXX')}
                </a>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 16px; font-weight: 900; color: var(--color-accent-gold, #D4AF37);">
                  ${SalonUtils.formatCurrency(booking.totalPrice || 180000)}
                </div>
                <div style="font-size: 10px; color: #64748B;">#${this.escapeHtml(booking.bookingCode || booking.id)}</div>
              </div>
            </div>

            <div class="queue-service-detail" style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;">
              <span style="font-size: 13px; color: #E2E8F0;">✂️ <strong>${this.escapeHtml(booking.serviceName || 'Dịch Vụ Cắt Tóc')}</strong></span>
              ${booking.notes ? `<div class="queue-notes-box" style="margin-top: 6px; font-size: 12px; color: #F59E0B;">💡 <em>${this.escapeHtml(booking.notes)}</em></div>` : ''}
              <div style="font-size: 11.5px; color: #94A3B8; margin-top: 4px;">
                Barber phụ trách: <strong style="color: #FFF;">${this.escapeHtml(booking.stylistName || 'Barber')}</strong>
              </div>
            </div>
          </div>

          <!-- One-Thumb UI Action Controls (Thao tác nhanh 1 ngón tay cái) -->
          <div class="queue-card-actions one-thumb-actions">
            ${isConfirmed ? `
              <div style="display: flex; gap: 8px; width: 100%;">
                <button type="button" class="btn-queue-action btn-checkin" style="flex: 3; padding: 12px 14px; font-size: 13px; font-weight: 800; border-radius: 12px; background: var(--color-accent-gold, #D4AF37); color: #000; border: none; cursor: pointer;" onclick="AdminApp.updateBookingStatus('${booking.id}', 'In_Progress')" title="Vuốt / Chạm để nhận khách">
                  👉 Nhận Khách (Bắt Đầu Cắt)
                </button>
                <button type="button" class="btn-queue-action btn-cancel-thumb" style="flex: 1; padding: 12px 6px; font-size: 11px; font-weight: 700; border-radius: 12px; background: rgba(239,68,68,0.15); color: #EF4444; border: 1px solid rgba(239,68,68,0.3); cursor: pointer;" onclick="AdminApp.updateBookingStatus('${booking.id}', 'Cancelled')" title="Báo trễ hoặc hủy">
                  ✕ Báo Trễ
                </button>
              </div>
            ` : ''}

            ${isInProgress ? `
              <button type="button" class="btn-queue-action btn-complete" style="width: 100%; padding: 12px 14px; font-size: 13.5px; font-weight: 800; border-radius: 12px; background: #10B981; color: #FFF; border: none; cursor: pointer;" onclick="AdminApp.updateBookingStatus('${booking.id}', 'Completed')">
                ✂️ Hoàn Tất Ca Cắt Tóc
              </button>
            ` : ''}

            ${isCompleted ? `
              <div class="queue-completed-meta" style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 10px;">
                <span style="color: #10B981; font-weight: 800; font-size: 12.5px;">✅ Đã Phục Vụ Xong</span>
                <button type="button" class="btn-queue-action btn-mini-pos" style="padding: 10px 18px; font-size: 12.5px; font-weight: 800; border-radius: 10px; background: #D4AF37; color: #000; border: none; cursor: pointer;" onclick="AdminApp.loadBookingIntoPos('${booking.id}')">
                  💳 Thu Tiền POS →
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    updateBookingStatus(bookingId, newStatus) {
      if (!bookingId || !newStatus) return;
      if (!this.canAccess()) {
        if (window.UICommon) window.UICommon.showToast('⛔ Bạn không có quyền đổi trạng thái ca.', 'error');
        return;
      }

      if (window.store && typeof window.store.updateBookingStatus === 'function') {
        const success = window.store.updateBookingStatus(bookingId, newStatus);
        if (success) {
          const statusLabels = {
            'In_Progress': 'Đã nhận khách vào ghế cắt tóc',
            'Completed': 'Đã hoàn tất ca cắt tóc thành công',
            'Cancelled': 'Đã hủy lịch hẹn'
          };
          if (window.UICommon) {
            window.UICommon.showToast(`✅ ${statusLabels[newStatus] || 'Đã cập nhật trạng thái ca'}!`, 'success');
          }
          this.refreshCurrentView(true);
        }
      }
    },

    setDateFilter(dateStr) {
      this.selectedDate = dateStr;
      this.refreshCurrentView(true);
    },

    setStatusFilter(statusStr) {
      this.queueStatusFilter = statusStr;
      this.refreshCurrentView(true);
    },

    setStylistFilter(stylistId) {
      this.selectedStylistId = stylistId;
      this.refreshCurrentView(true);
    },

    // -----------------------------------------------------------------------
    // 4. MÀN HÌNH 2: MOBILE POS THU NGÂN TẠI GHẾ CẮT (CHAIR-SIDE POS)
    // -----------------------------------------------------------------------
    renderPosTab() {
      const services = (window.store && typeof window.store.getServices === 'function')
        ? window.store.getServices()
        : [];
      const products = (window.store && typeof window.store.getProducts === 'function')
        ? window.store.getProducts()
        : [];

      // Tính tổng hóa đơn hiện tại
      const selectedService = services.find(s => s.id === this.posState.serviceId);
      const selectedProduct = products.find(p => p.id === this.posState.productId);
      
      const servicePrice = selectedService ? Number(selectedService.price) : 0;
      const productPrice = selectedProduct ? Number(selectedProduct.price) : 0;
      const subtotal = servicePrice + productPrice;

      // Chiết khấu voucher
      let discount = this.posState.discountAmount || 0;
      let finalTotal = Math.max(0, subtotal - discount);

      return `
        <div class="staff-console-page" style="padding: 14px 14px 30px;">
          <!-- POS Header -->
          <div class="staff-header-banner">
            <div>
              <div class="staff-badge-role" style="background: #ecfdf5; color: #047857; border-color: #a7f3d0;">💳 MOBILE POS</div>
              <h2 style="font-size: 18px; font-weight: 900; margin: 4px 0 2px; color: #111;">Thu Ngân Ghế Cắt Tóc</h2>
              <p style="font-size: 11px; color: #6b7280; margin: 0;">Lập hóa đơn nhanh & Thu tiền mặt / VietQR động</p>
            </div>
            <button type="button" class="btn-clear-pos" onclick="AdminApp.resetPos()">
              🗑️ Xóa Bill
            </button>
          </div>

          <!-- Linked Booking Info (Nếu có gắn từ danh sách ca) -->
          ${this.posState.bookingId ? `
            <div class="pos-linked-booking-alert">
              <div>
                <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #047857;">ĐANG GẮN LỊCH HẸN:</span>
                <div style="font-size: 13px; font-weight: 900; color: #065f46;">#${this.escapeHtml(this.posState.bookingId)} — ${this.escapeHtml(this.posState.customerName)}</div>
              </div>
              <button type="button" class="btn-unlink-booking" onclick="AdminApp.unlinkBookingFromPos()">Gỡ Lịch</button>
            </div>
          ` : ''}

          <!-- Form Điền Thông Tin Khách -->
          <div class="staff-card-panel">
            <h4 style="font-size: 13px; font-weight: 800; margin: 0 0 10px; color: #111;">1. Thông Tin Khách Hàng</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <label style="font-size: 10px; font-weight: 700; color: #6b7280;">Tên Khách</label>
                <input type="text" class="staff-text-input" placeholder="Khách vãng lai" 
                  value="${this.escapeHtml(this.posState.customerName)}" 
                  oninput="AdminApp.posState.customerName = this.value">
              </div>
              <div>
                <label style="font-size: 10px; font-weight: 700; color: #6b7280;">Số Điện Thoại</label>
                <input type="tel" class="staff-text-input" placeholder="090..." 
                  value="${this.escapeHtml(this.posState.customerPhone)}" 
                  oninput="AdminApp.posState.customerPhone = this.value">
              </div>
            </div>
          </div>

          <!-- Chọn Dịch Vụ Cắt Tóc -->
          <div class="staff-card-panel">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <h4 style="font-size: 13px; font-weight: 800; margin: 0; color: #111;">2. Dịch Vụ Thực Hiện</h4>
              <span style="font-size: 12px; font-weight: 800; color: var(--color-terracotta);">
                ${SalonUtils.formatCurrency(servicePrice)}
              </span>
            </div>
            <select class="staff-select-input" onchange="AdminApp.setPosService(this.value)">
              <option value="">-- Chọn Dịch Vụ Cắt / Gội / Cạo --</option>
              ${services.map(s => `
                <option value="${s.id}" ${this.posState.serviceId === s.id ? 'selected' : ''}>
                  ✂️ ${this.escapeHtml(s.name)} (${SalonUtils.formatCurrency(s.price)})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Mua Kèm Sáp Pomade / Sản Phẩm -->
          <div class="staff-card-panel">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <h4 style="font-size: 13px; font-weight: 800; margin: 0; color: #111;">3. Sản Phẩm Bán Thêm (Pomade/Sáp)</h4>
              <span style="font-size: 12px; font-weight: 800; color: var(--color-terracotta);">
                ${SalonUtils.formatCurrency(productPrice)}
              </span>
            </div>
            <select class="staff-select-input" onchange="AdminApp.setPosProduct(this.value)">
              <option value="">-- Không mua kèm sản phẩm --</option>
              ${products.map(p => `
                <option value="${p.id}" ${this.posState.productId === p.id ? 'selected' : ''}>
                  💈 [${this.escapeHtml(p.brand || 'OMNI')}] ${this.escapeHtml(p.name)} (${SalonUtils.formatCurrency(p.price)})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Voucher Giảm Giá -->
          <div class="staff-card-panel">
            <h4 style="font-size: 13px; font-weight: 800; margin: 0 0 8px; color: #111;">4. Mã Ưu Đãi Voucher</h4>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="staff-text-input" placeholder="VD: 4RAUWELCOME" 
                value="${this.escapeHtml(this.posState.voucherCode)}" id="mobilePosVoucherInput">
              <button type="button" class="staff-btn-voucher" onclick="AdminApp.applyPosVoucher(document.getElementById('mobilePosVoucherInput').value)">
                Áp Dụng
              </button>
            </div>
            ${discount > 0 ? `
              <div style="margin-top: 6px; font-size: 12px; font-weight: 800; color: #059669;">
                ✅ Đã giảm: -${SalonUtils.formatCurrency(discount)}
              </div>
            ` : ''}
          </div>

          <!-- Phương Thức Thanh Toán (Tiền Mặt vs VietQR Động) -->
          <div class="staff-card-panel">
            <h4 style="font-size: 13px; font-weight: 800; margin: 0 0 10px; color: #111;">5. Phương Thức Thanh Toán</h4>
            <div class="pos-payment-toggle-grid">
              <button type="button" class="pos-pay-toggle-btn ${this.posState.paymentMethod === 'CASH' ? 'active' : ''}" 
                onclick="AdminApp.setPosPaymentMethod('CASH')">
                💵 Tiền Mặt
              </button>
              <button type="button" class="pos-pay-toggle-btn ${this.posState.paymentMethod === 'VIETQR' ? 'active' : ''}" 
                onclick="AdminApp.setPosPaymentMethod('VIETQR')">
                📲 VietQR Động
              </button>
            </div>

            ${this.posState.paymentMethod === 'VIETQR' && finalTotal > 0 ? `
              <div class="vietqr-display-shell">
                <div style="font-size: 11px; font-weight: 800; color: #1e3a8a; margin-bottom: 8px; text-transform: uppercase;">
                  QUÉT VIETQR ĐỂ CHUYỂN KHOẢN
                </div>
                <div class="vietqr-svg-wrap">
                  ${this._generateVietQrSvg(finalTotal, this.posState.bookingId || 'CHAIR_POS')}
                </div>
                <div style="font-size: 12px; font-weight: 900; color: #1e3a8a; margin-top: 6px;">
                  Số tiền: ${SalonUtils.formatCurrency(finalTotal)}
                </div>
                <div style="font-size: 10px; color: #6b7280;">Nội dung: OMNI POS ${this.posState.bookingId || 'BILL'}</div>
              </div>
            ` : ''}
          </div>

          <!-- Bill Summary & Checkout Button -->
          <div class="pos-checkout-sticky-footer">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <div>
                <span style="font-size: 10px; color: #9ca3af; text-transform: uppercase;">TỔNG THANH TOÁN:</span>
                <div style="font-size: 20px; font-weight: 900; color: #fff;">${SalonUtils.formatCurrency(finalTotal)}</div>
              </div>
              <div style="font-size: 11px; color: #d1d5db;">
                ${this.posState.paymentMethod === 'CASH' ? 'Tiền Mặt' : 'Chuyển Khoản QR'}
              </div>
            </div>
            <button type="button" class="btn-submit-terracotta" style="width: 100%; padding: 12px;" onclick="AdminApp.checkoutMobilePos()">
              ⚡ XÁC NHẬN THU TIỀN & XUẤT BILL →
            </button>
          </div>
        </div>
      `;
    },

    loadBookingIntoPos(bookingId) {
      const bookings = (window.store && typeof window.store.getBookings === 'function')
        ? window.store.getBookings()
        : [];
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      this.posState.bookingId = booking.id;
      this.posState.customerName = booking.customerName || '';
      this.posState.customerPhone = booking.customerPhone || '';
      this.posState.serviceId = booking.serviceId || null;
      this.posState.productId = null;
      this.posState.discountAmount = 0;
      this.posState.voucherCode = '';
      this.activeTab = 'pos';
      this.refreshCurrentView();
      if (window.UICommon) {
        window.UICommon.showToast(`💳 Đã nạp vé #${booking.bookingCode || booking.id} vào POS thu ngân!`, 'info');
      }
    },

    unlinkBookingFromPos() {
      this.posState.bookingId = null;
      this.refreshCurrentView();
    },

    resetPos() {
      this.posState = {
        bookingId: null,
        customerName: '',
        customerPhone: '',
        serviceId: null,
        productId: null,
        paymentMethod: 'CASH',
        voucherCode: '',
        discountAmount: 0
      };
      this.refreshCurrentView();
      if (window.UICommon) {
        window.UICommon.showToast('Đã làm mới bill thanh toán POS.', 'info');
      }
    },

    setPosService(serviceId) {
      this.posState.serviceId = serviceId;
      this.refreshCurrentView(true);
    },

    setPosProduct(productId) {
      this.posState.productId = productId;
      this.refreshCurrentView(true);
    },

    setPosPaymentMethod(method) {
      this.posState.paymentMethod = method;
      this.refreshCurrentView(true);
    },

    applyPosVoucher(code) {
      const cleanCode = (code || '').trim();
      if (!cleanCode) {
        this.posState.voucherCode = '';
        this.posState.discountAmount = 0;
        this.refreshCurrentView(true);
        return;
      }

      const services = window.store.getServices();
      const products = window.store.getProducts();
      const sPrice = (services.find(s => s.id === this.posState.serviceId)?.price || 0);
      const pPrice = (products.find(p => p.id === this.posState.productId)?.price || 0);
      const subtotal = sPrice + pPrice;

      if (window.PricingService && typeof window.PricingService.processVoucherCode === 'function') {
        const promotions = window.store.getPromotions ? window.store.getPromotions() : [];
        const res = window.PricingService.processVoucherCode(cleanCode, subtotal, promotions);
        if (res.isValid) {
          this.posState.voucherCode = cleanCode;
          this.posState.discountAmount = res.discountAmount;
          if (window.UICommon) window.UICommon.showToast(`✅ Đã áp dụng mã: ${cleanCode}!`, 'success');
        } else {
          this.posState.voucherCode = '';
          this.posState.discountAmount = 0;
          if (window.UICommon) window.UICommon.showToast(`❌ ${res.message || 'Mã không hợp lệ'}`, 'error');
        }
      }
      this.refreshCurrentView(true);
    },

    checkoutMobilePos() {
      const services = window.store.getServices();
      const products = window.store.getProducts();
      const selectedService = services.find(s => s.id === this.posState.serviceId);
      const selectedProduct = products.find(p => p.id === this.posState.productId);

      if (!selectedService && !selectedProduct) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng chọn ít nhất 1 dịch vụ hoặc sản phẩm để thu ngân.', 'warning');
        return;
      }

      const items = [];
      if (selectedService) {
        items.push({ id: selectedService.id, name: selectedService.name, price: selectedService.price, qty: 1, type: 'SERVICE' });
      }
      if (selectedProduct) {
        items.push({ id: selectedProduct.id, productId: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, qty: 1, type: 'PRODUCT' });
      }

      const subtotal = items.reduce((sum, it) => sum + it.price, 0);
      const discount = this.posState.discountAmount || 0;
      const totalAmount = Math.max(0, subtotal - discount);

      // Tạo Order POS lưu vào store
      const orderData = {
        branchId: this.activeBranchId,
        orderType: 'POS_COUNTER',
        customerName: this.posState.customerName || 'Khách Cắt Tóc',
        customerPhone: this.posState.customerPhone || '0900000000',
        items,
        totalAmount,
        discountAmount: discount,
        voucherCode: this.posState.voucherCode || null,
        paymentMethod: this.posState.paymentMethod === 'VIETQR' ? 'VietQR_Transfer' : 'Counter_Cash',
        paymentStatus: 'Paid',
        orderStatus: 'Completed'
      };

      const createdOrder = (window.store && typeof window.store.createOrder === 'function')
        ? window.store.createOrder(orderData)
        : null;

      // Trừ kho nguyên tử nếu có sản phẩm
      if (selectedProduct && window.store && typeof window.store.decrementStock === 'function') {
        window.store.decrementStock(this.activeBranchId, selectedProduct.id, 1);
      }

      // Nếu có liên kết lịch hẹn thì cập nhật trạng thái hoàn tất & đã thanh toán
      if (this.posState.bookingId && window.store && typeof window.store.updateBookingStatus === 'function') {
        window.store.updateBookingStatus(this.posState.bookingId, 'Completed', { paymentStatus: 'Paid' });
      }

      // Mở modal hóa đơn điện tử
      this._openReceiptModal(createdOrder || orderData);
      this.resetPos();
    },

    _generateVietQrSvg(amount, refCode) {
      const qrData = `VIETQR:OMNISALON:9999888877:TECHCOMBANK:AMOUNT=${amount}:NOTE=${refCode}`;
      if (window.SalonUtils && typeof window.SalonUtils.generateQrSvgCode === 'function') {
        return window.SalonUtils.generateQrSvgCode(qrData, { size: 160 });
      }
      return `<svg width="160" height="160" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/><rect x="15" y="15" width="70" height="70" fill="#1e3a8a"/></svg>`;
    },

    _openReceiptModal(order) {
      const modalHtml = `
        <div style="padding: 16px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 4px;">🧾</div>
          <div class="badge-terracotta" style="font-size: 10px;">HÓA ĐƠN ĐIỆN TỬ OMNI SALON</div>
          <h3 style="font-size: 18px; font-weight: 900; margin: 6px 0; color: var(--text-primary);">
            #${this.escapeHtml(order.orderCode || order.id || 'POS-RECEIPT')}
          </h3>
          <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 14px;">Thanh toán thành công tại ghế cắt tóc</p>

          <div style="background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 12px; padding: 12px; text-align: left; font-size: 12px; line-height: 1.6; margin-bottom: 14px;">
            <div><strong>Khách hàng:</strong> ${this.escapeHtml(order.customerName)} (${this.escapeHtml(order.customerPhone)})</div>
            <div><strong>Hình thức:</strong> ${this.escapeHtml(order.paymentMethod)}</div>
            <hr style="border: none; border-top: 1px dashed var(--border-color); margin: 8px 0;">
            ${(order.items || []).map(it => `
              <div style="display: flex; justify-content: space-between;">
                <span>${this.escapeHtml(it.name)} x${it.qty || 1}</span>
                <span>${SalonUtils.formatCurrency(it.price)}</span>
              </div>
            `).join('')}
            ${order.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; color: var(--color-status-emerald); font-weight: 700;">
                <span>Giảm giá voucher:</span>
                <span>-${SalonUtils.formatCurrency(order.discountAmount)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 14px; margin-top: 6px; border-top: 1px solid var(--border-color); padding-top: 6px;">
              <span>Tổng Cộng:</span>
              <span style="color: var(--brand-accent);">${SalonUtils.formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <button type="button" class="btn-submit-terracotta" style="width: 100%; padding: 10px; font-size: 13px;" onclick="AdminApp._closeModal()">
            Đóng Hóa Đơn
          </button>
        </div>
      `;
      this._openModal(modalHtml);
    },

    // -----------------------------------------------------------------------
    // 5. MÀN HÌNH 3: KIỂM KHO NHANH TRÊN KỆ (QUICK INVENTORY AUDIT)
    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------
    // 5. MÀN HÌNH 3: KIỂM KHO NHANH TRÊN KỆ (QUICK INVENTORY AUDIT)
    // -----------------------------------------------------------------------
    _getInventoryData() {
      const branchInv = (window.store && typeof window.store.getBranchInventory === 'function')
        ? window.store.getBranchInventory(this.activeBranchId)
        : [];
      return branchInv.length > 0 ? branchInv : (window.store?.getBranchInventory() || []);
    },

    renderInventoryTab() {
      const inventory = this._getInventoryData();
      const totalItemsCount = inventory.reduce((sum, i) => sum + Number(i.stock || 0), 0);
      const lowStockCount = inventory.filter(i => i.isLowStock || Number(i.stock || 0) <= 5).length;

      return `
        <div class="staff-console-page" style="padding: 14px 14px 30px;">
          <!-- Inventory Header -->
          <div class="staff-header-banner">
            <div>
              <div class="staff-badge-role" style="background: #fef3c7; color: #b45309; border-color: #fde68a;">📦 QUICK INVENTORY</div>
              <h2 style="font-size: 18px; font-weight: 900; margin: 4px 0 2px; color: #111;">Kiểm Kho Nhanh Kệ Hàng</h2>
              <p style="font-size: 11px; color: #6b7280; margin: 0;">Kiểm đếm tức thì sáp vuốt tóc & pomade chi nhánh</p>
            </div>
          </div>

          <!-- Inventory KPI Stats Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px;">
            <div class="inventory-stat-box">
              <span style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Mã Hàng</span>
              <div style="font-size: 18px; font-weight: 900; color: #111;">${inventory.length}</div>
            </div>
            <div class="inventory-stat-box">
              <span style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Tổng Hộp</span>
              <div style="font-size: 18px; font-weight: 900; color: #2563eb;">${totalItemsCount}</div>
            </div>
            <div class="inventory-stat-box">
              <span style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Sắp Hết</span>
              <div style="font-size: 18px; font-weight: 900; color: ${lowStockCount > 0 ? '#dc2626' : '#059669'};">
                ${lowStockCount}
              </div>
            </div>
          </div>

          <!-- Search Bar (Không re-render cả trang để tránh giật bàn phím) -->
          <div style="margin-bottom: 12px;">
            <input type="text" class="staff-text-input" placeholder="🔍 Tìm sáp Brosh, Omni, Reuzel..." 
              value="${this.escapeHtml(this.inventorySearchQuery)}"
              oninput="AdminApp.handleInventorySearch(this.value)">
          </div>

          <!-- Inventory Items List Container (Cập nhật cục bộ tránh giật giao diện) -->
          <div class="inventory-shelf-list" id="inventoryShelfList">
            ${this._renderInventoryListHtml(inventory)}
          </div>
        </div>
      `;
    },

    _renderInventoryListHtml(inventory = null) {
      const inv = inventory || this._getInventoryData();
      const query = (this.inventorySearchQuery || '').trim().toLowerCase();
      const filtered = inv.filter(item => {
        if (!query) return true;
        const name = (item.productName || '').toLowerCase();
        const brand = (item.brand || '').toLowerCase();
        return name.includes(query) || brand.includes(query);
      });

      if (filtered.length === 0) {
        return `
          <div class="staff-empty-card">
            <div style="font-size: 32px; margin-bottom: 6px;">📦</div>
            <div style="font-weight: 800; font-size: 14px; color: #374151;">Không Tìm Thấy Sản Phẩm</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Thử tìm theo từ khóa hoặc thương hiệu khác</div>
          </div>
        `;
      }
      return filtered.map(item => this._renderInventoryRow(item)).join('');
    },

    _renderInventoryRow(item) {
      const stock = Number(item.stock || 0);
      const isLow = item.isLowStock || stock <= 5;

      return `
        <div class="inventory-shelf-card ${isLow ? 'border-stock-warning' : ''}">
          <div style="display: flex; gap: 10px; align-items: center;">
            <img src="${this.escapeHtml(item.image || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=120&q=80')}" 
              class="inventory-thumb-img" alt="${this.escapeHtml(item.productName)}">
            <div style="flex: 1; min-width: 0;">
              <span class="inventory-brand-pill">${this.escapeHtml(item.brand || 'BROSH')}</span>
              <h4 style="font-size: 13px; font-weight: 800; margin: 2px 0; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${this.escapeHtml(item.productName || 'Sản Phẩm')}
              </h4>
              <div style="font-size: 11px; font-weight: 700; color: var(--color-terracotta);">
                ${SalonUtils.formatCurrency(item.price || 450000)}
              </div>
            </div>
          </div>

          <!-- Stepper 1-chạm & Nhập Trực Tiếp -->
          <div class="inventory-stepper-wrap">
            <div style="display: flex; align-items: center; gap: 6px;">
              <button type="button" class="btn-stepper" onclick="AdminApp.adjustStockQuick('${item.id}', -1)" title="Giảm 1">-</button>
              <div class="inventory-stock-num ${isLow ? 'text-low-stock' : ''}">
                ${stock}
              </div>
              <button type="button" class="btn-stepper" onclick="AdminApp.adjustStockQuick('${item.id}', 1)" title="Tăng 1">+</button>
            </div>
            <button type="button" class="btn-audit-direct" onclick="AdminApp.promptDirectStock('${item.id}', ${stock})">
              📝 Đếm Kệ
            </button>
          </div>
        </div>
      `;
    },

    handleInventorySearch(query) {
      this.inventorySearchQuery = query;
      const shelfList = document.getElementById('inventoryShelfList');
      if (shelfList) {
        shelfList.innerHTML = this._renderInventoryListHtml();
      } else {
        this.refreshCurrentView(true);
      }
    },

    adjustStockQuick(invId, delta) {
      const invList = (window.store && typeof window.store.getBranchInventory === 'function')
        ? window.store.getBranchInventory()
        : [];
      const item = invList.find(i => i.id === invId);
      if (!item) return;

      const currentStock = Number(item.stock || 0);
      const newStock = Math.max(0, currentStock + delta);

      if (window.store && typeof window.store.updateProductStock === 'function') {
        window.store.updateProductStock(invId, newStock);
        this.refreshCurrentView(true);
      }
    },

    promptDirectStock(invId, currentStock) {
      const input = window.prompt(`[KIỂM ĐẾM THỰC TẾ TRÊN KỆ]\nNhập số lượng hộp kiểm đếm thực tế:`, String(currentStock));
      if (input === null) return;
      const num = parseInt(input, 10);
      if (isNaN(num) || num < 0) {
        if (window.UICommon) window.UICommon.showToast('Số lượng kiểm kê phải là số dương hợp lệ.', 'warning');
        return;
      }

      if (window.store && typeof window.store.updateProductStock === 'function') {
        window.store.updateProductStock(invId, num);
        if (window.UICommon) {
          window.UICommon.showToast(`✅ Đã lưu kết quả kiểm kê kệ: ${num} hộp!`, 'success');
        }
        this.refreshCurrentView(true);
      }
    },

    // -----------------------------------------------------------------------
    // 6. MÀN HÌNH 4: THU NHẬP & HOA HỒNG THỢ (STYLIST WALLET & 15% COMMISSION)
    // -----------------------------------------------------------------------
    renderWalletTab() {
      const user = this.getCurrentUser();
      const allBookings = (window.store && typeof window.store.getBookings === 'function')
        ? window.store.getBookings()
        : [];

      // Xác định stylist được xem thu nhập
      let targetStylistId = user?.id;
      let targetStylistName = user?.name || 'Barber';

      if (user && user.role !== 'STYLIST') {
        targetStylistId = (this.selectedStylistId && this.selectedStylistId !== 'all') 
          ? this.selectedStylistId 
          : ((window.store && window.store.getStylists) ? window.store.getStylists()[0]?.id : 'st-01');
        const stylists = window.store.getStylists ? window.store.getStylists() : [];
        const found = stylists.find(s => s.id === targetStylistId);
        if (found) targetStylistName = found.name;
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Lọc các ca đã HOÀN TẤT của thợ này trong ngày hôm nay
      const completedToday = allBookings.filter(b => {
        const matchStylist = (b.stylistId === targetStylistId) || (b.stylistName && b.stylistName.includes(targetStylistName));
        const matchDate = (b.date === todayStr);
        return matchStylist && matchDate && (b.status === 'Completed');
      });

      // Doanh thu cắt tóc hôm nay
      const totalCutRevenue = completedToday.reduce((sum, b) => sum + Number(b.totalPrice || 180000), 0);
      
      // HOA HỒNG CHÍNH XÁC 15% (DRY QUA PRICING SERVICE)
      const haircutCommission = window.PricingService 
        ? window.PricingService.calculateStylistCommission(totalCutRevenue, 0.15)
        : Math.round(totalCutRevenue * 0.15);

      // Thưởng doanh số bán sản phẩm tạm tính (5% bonus sáp pomade)
      const pomadeBonus = completedToday.length > 0 ? (completedToday.length * 20000) : 0;
      const todayTotalPayout = haircutCommission + pomadeBonus;

      return `
        <div class="staff-console-page" style="padding: 14px 14px 30px;">
          <!-- Wallet Header Banner -->
          <div class="staff-header-banner">
            <div>
              <div class="staff-badge-role" style="background: #fdf2f8; color: #be185d; border-color: #fbcfe8;">💰 BARBER WALLET</div>
              <h2 style="font-size: 18px; font-weight: 900; margin: 4px 0 2px; color: #111;">Ví Thu Nhập & Hoa Hồng</h2>
              <p style="font-size: 11px; color: #6b7280; margin: 0;">Thợ: <strong>${this.escapeHtml(targetStylistName)}</strong> — Tỉ lệ hoa hồng chuẩn 15%</p>
            </div>
          </div>

          <!-- Main Wallet Balance Card -->
          <div class="stylist-wallet-card">
            <span style="font-size: 11px; font-weight: 800; color: #fef08a; text-transform: uppercase; letter-spacing: 0.05em;">
              HOA HỒNG TẠM TÍNH HÔM NAY
            </span>
            <div style="font-size: 26px; font-weight: 900; margin: 6px 0; color: #fff;">
              ${SalonUtils.formatCurrency(todayTotalPayout)}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #d1d5db; margin-top: 10px;">
              <span>Hoa hồng cắt tóc (15%): <strong>${SalonUtils.formatCurrency(haircutCommission)}</strong></span>
              <span>Thưởng sáp: <strong>${SalonUtils.formatCurrency(pomadeBonus)}</strong></span>
            </div>
          </div>

          <!-- 4 KPI Performance Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
            <div class="staff-kpi-box">
              <span style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Doanh Thu Ca Cắt</span>
              <div style="font-size: 17px; font-weight: 900; color: #111; margin-top: 2px;">
                ${SalonUtils.formatCurrency(totalCutRevenue)}
              </div>
            </div>
            <div class="staff-kpi-box">
              <span style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Khách Đã Hoàn Tất</span>
              <div style="font-size: 17px; font-weight: 900; color: #2563eb; margin-top: 2px;">
                ${completedToday.length} lượt
              </div>
            </div>
            <div class="staff-kpi-box">
              <span style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Tỉ Lệ Hoa Hồng</span>
              <div style="font-size: 17px; font-weight: 900; color: #059669; margin-top: 2px;">
                15.0%
              </div>
            </div>
            <div class="staff-kpi-box">
              <span style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Trạng Thái Ví</span>
              <div style="font-size: 17px; font-weight: 900; color: #b45309; margin-top: 2px;">
                Đang Mở Ca
              </div>
            </div>
          </div>

          <!-- Danh sách ca đã hoàn tất hưởng hoa hồng -->
          <div class="staff-card-panel">
            <h4 style="font-size: 13px; font-weight: 800; margin: 0 0 10px; color: #111;">
              Chi Tiết Ca Cắt Tính Hoa Hồng Hôm Nay (${completedToday.length})
            </h4>
            <div class="wallet-cuts-list">
              ${completedToday.length === 0 ? `
                <div style="text-align: center; padding: 20px 10px; color: #9ca3af; font-size: 12px;">
                  Chưa có ca cắt nào hoàn tất hôm nay. Hãy bắt đầu ca làm tại Tab "Ca Hôm Nay"!
                </div>
              ` : completedToday.map(b => {
                const cutPrice = Number(b.totalPrice || 180000);
                const cutComm = window.PricingService 
                  ? window.PricingService.calculateStylistCommission(cutPrice, 0.15)
                  : Math.round(cutPrice * 0.15);
                return `
                  <div class="wallet-cut-row">
                    <div>
                      <div style="font-weight: 800; font-size: 13px; color: #111;">${this.escapeHtml(b.customerName || 'Khách Hàng')}</div>
                      <div style="font-size: 11px; color: #6b7280;">⏰ ${this.escapeHtml(b.timeSlot)} — ${this.escapeHtml(b.serviceName || 'Cắt Tóc')}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 13px; font-weight: 900; color: #059669;">+${SalonUtils.formatCurrency(cutComm)}</div>
                      <div style="font-size: 10px; color: #9ca3af;">Giá ca: ${SalonUtils.formatCurrency(cutPrice)}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Nút Chốt Ca Hôm Nay -->
          <button type="button" class="btn-submit-terracotta" style="width: 100%; padding: 12px; margin-top: 8px;" onclick="AdminApp.closeTodayShift()">
            📊 CHỐT CA LÀM & ĐỒNG BỘ DOANH SỐ →
          </button>
        </div>
      `;
    },

    closeTodayShift() {
      const user = this.getCurrentUser();
      if (window.store && typeof window.store.logAudit === 'function') {
        window.store.logAudit('SHIFT_CLOSE', `Thợ: ${user?.name || 'Barber'}`, `Chốt ca ngày ${new Date().toLocaleDateString('vi-VN')}`);
      }
      if (window.UICommon) {
        window.UICommon.showToast('✅ Đã chốt ca làm việc thành công! Báo cáo đã gửi cho Quản lý chi nhánh.', 'success');
      }
      this.refreshCurrentView();
    },

    // -----------------------------------------------------------------------
    // 7. UTILITIES & MODAL HELPERS
    // -----------------------------------------------------------------------
    _getBookingStatusMeta(status) {
      const s = String(status || '').toLowerCase();
      if (s === 'confirmed') return { label: 'Chờ Cắt', cssClass: 'status-confirmed' };
      if (s === 'in_progress') return { label: 'Đang Cắt', cssClass: 'status-in_progress' };
      if (s === 'completed') return { label: 'Hoàn Tất', cssClass: 'status-completed' };
      if (s === 'cancelled') return { label: 'Đã Hủy', cssClass: 'status-cancelled' };
      return window.SalonUtils ? window.SalonUtils.formatBookingStatus(status) : { label: status || 'Chờ Duyệt', cssClass: 'status-confirmed' };
    },

    escapeHtml(str) {
      if (window.SalonUtils && typeof window.SalonUtils.escapeHtml === 'function') {
        return window.SalonUtils.escapeHtml(str);
      }
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    _openModal(htmlContent) {
      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;
      modalBody.innerHTML = htmlContent;
      modal.classList.add('active');
    },

    _closeModal() {
      if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
        window.UICommon.closeGlobalModal();
      } else {
        const modal = document.getElementById('globalModal');
        if (modal) modal.classList.remove('active');
      }
    }
  };

  window.AdminApp = AdminApp;

})(typeof window !== 'undefined' ? window : this);
