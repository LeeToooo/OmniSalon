// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - TRANG CÁ NHÂN & PORTAL (CUSTOMER PORTAL)
// File: web/frontend/js/modules/customer/portal/customer-portal.js
// ============================================================================

(function (window) {
  'use strict';

  const STORAGE_KEY_AI_GALLERY = 'OMNISALON_CUSTOMER_AI_GALLERY';

  const CustomerPortal = {
    portalActiveTab: 'bookings', // 'bookings' | 'orders' | 'gallery' | 'rewards' | 'profile'

    /**
     * Escape chuỗi HTML an toàn
     */
    escapeHtml(str) {
      if (window.CustomerUtils && typeof window.CustomerUtils.escapeHtml === "function") { return window.CustomerUtils.escapeHtml(str); }
      if (typeof str !== 'string') return str == null ? '' : String(str);
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Lấy thông tin tài khoản người dùng hiện tại
     */
    getCurrentUser() {
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        const u = window.AuthEngine.getCurrentUser();
        if (u) return u;
      }
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        return window.AuthEngine.getCurrentUser();
      }
      if (window.store && typeof window.store.getCurrentUser === 'function') {
        return window.store.getCurrentUser();
      }
      return null;
    },

    /**
     * Kiểm tra quyền quản trị
     */
    isAdminUser(user) {
      // Safe delegated call to isAdminUser
      if (window.CustomerUtils && typeof window.CustomerUtils.isAdminUser === "function") { return window.CustomerUtils.isAdminUser(user); }
      if (!user) return false;
      const role = String(user.role || user.vaiTroSql || user.VaiTro || '').toUpperCase();
      const chucVu = String(user.ChucVu || user.chucVuSql || '').toUpperCase();
      const username = String(user.username || '').toLowerCase();
      const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'QUẢN TRỊ VIÊN', 'QUẢN LÝ', 'QUẢN LÝ CHI NHÁNH', 'THU NGÂN', 'THỢ', 'THỢ CHÍNH', 'THỢ PHỤ', 'BARBER', 'STAFF', 'NHÂN VIÊN'];
      return staffRoles.includes(role) || role.includes('THỢ') || chucVu.includes('THỢ') || chucVu.includes('QUẢN LÝ') || chucVu.includes('THU NGÂN') || chucVu.includes('QUẢN TRỊ') || chucVu.includes('NHÂN VIÊN') || username === 'admin';
    },

    /**
     * Lấy danh sách lịch hẹn của người dùng
     */
    _getUserBookings(user) {
      // Safe delegated call to _getUserBookings
      if (window.CustomerUtils && typeof window.CustomerUtils._getUserBookings === "function") { return window.CustomerUtils._getUserBookings(user); }
      if (window.CustomerUtils && typeof window.CustomerUtils._getUserBookings === 'function') {
        return window.CustomerUtils._getUserBookings(user);
      }
      if (!user) return [];
      const all = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      const phone = user.phone ? user.phone.trim() : null;
      const uid = user.id ? String(user.id) : null;
      return all.filter(b =>
        (phone && b.customerPhone && b.customerPhone.trim() === phone) ||
        (uid && (String(b.userId) === uid || String(b.customerId) === uid))
      );
    },

    /**
     * Lấy danh sách đơn hàng của người dùng
     */
    _getUserOrders(user) {
      // Safe delegated call to _getUserOrders
      if (window.CustomerUtils && typeof window.CustomerUtils._getUserOrders === "function") { return window.CustomerUtils._getUserOrders(user); }
      if (window.CustomerUtils && typeof window.CustomerUtils._getUserOrders === 'function') {
        return window.CustomerUtils._getUserOrders(user);
      }
      if (!user) return [];
      const all = (window.store && typeof window.store.getOrders === 'function') ? window.store.getOrders() : [];
      const phone = user.phone ? user.phone.trim() : null;
      const uid = user.id ? String(user.id) : null;
      return all.filter(o =>
        (phone && o.customerPhone && o.customerPhone.trim() === phone) ||
        (uid && (String(o.userId) === uid || String(o.customerId) === uid))
      );
    },

    /**
     * Lấy thư viện ảnh tóc AI
     */
    getAiGallery() {
      // Safe delegated call to getAiGallery
      if (window.CustomerAiStudio && typeof window.CustomerAiStudio.getAiGallery === "function") { return window.CustomerAiStudio.getAiGallery(); }
      if (window.CustomerAiStudio && typeof window.CustomerAiStudio.getAiGallery === 'function') {
        return window.CustomerAiStudio.getAiGallery();
      }
      try {
        const user = this.getCurrentUser();
        const userId = user ? user.id : 'guest';
        const key = `${STORAGE_KEY_AI_GALLERY}_${userId}`;
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch (e) { }
      return [];
    },

    /**
     * Lấy text hiển thị cho role badge
     */
    getRoleBadgeText(user) {
      // Safe delegated call to getRoleBadgeText
      if (window.CustomerUtils && typeof window.CustomerUtils.getRoleBadgeText === "function") { return window.CustomerUtils.getRoleBadgeText(user); }
      if (window.CustomerUtils && typeof window.CustomerUtils.getRoleBadgeText === 'function') {
        return window.CustomerUtils.getRoleBadgeText(user);
      }
      if (!user) return 'Khách Vãng Lai';
      const role = String(user.role || user.vaiTroSql || user.VaiTro || '').toUpperCase();
      const chucVu = String(user.ChucVu || user.chucVuSql || '').toUpperCase();
      const uid = String(user.id || user.MaNhanVien || user.staffId || '').toUpperCase();

      if (uid === 'NV00' || role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'QUẢN TRỊ VIÊN' || chucVu === 'QUẢN TRỊ VIÊN' || user.username === 'admin') {
        return 'Quản Trị Tối Cao';
      }
      if (role === 'BRANCH_MANAGER' || role === 'QUẢN LÝ' || chucVu === 'QUẢN LÝ CHI NHÁNH' || chucVu.includes('QUẢN LÝ')) {
        return 'Quản Lý Chi Nhánh';
      }
      if (role === 'CASHIER' || role === 'THU NGÂN' || chucVu === 'THU NGÂN' || chucVu.includes('THU NGÂN')) {
        return 'Thu Ngân Tiếp Tân';
      }
      if (role === 'STYLIST' || role === 'STAFF' || role === 'NHÂN VIÊN' || chucVu === 'THỢ CHÍNH' || chucVu === 'THỢ PHỤ' || chucVu.includes('THỢ') || chucVu.includes('BARBER')) {
        return user.CapBac ? `${user.CapBac} (${user.ChucVu || 'Thợ Tóc'})` : (user.ChucVu || 'Thợ Barber Chuyên Nghiệp');
      }
      return `${user.tier && !user.tier.includes('OMNI') ? user.tier : 'Khách Hàng VIP'}`;
    },

    /**
     * Mở modal trang cá nhân khách hàng (Customer Portal)
     */
    openCustomerPortalModal(initialTab = 'bookings') {
      const user = this.getCurrentUser();
      if (!user) {
        if (window.UICommon && typeof window.UICommon.openAuthModal === 'function') {
          window.UICommon.openAuthModal('login');
        }
        return;
      }

      if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
        window.UICommon.closeGlobalModal();
      }

      if (window.ProfilePage) {
        window.ProfilePage.activeTab = initialTab || 'bookings';
      }

      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate('/profile');
      } else if (typeof this.switchTab === 'function') {
        this.switchTab('profile');
      } else if (window.CustomerWeb && typeof window.CustomerWeb.switchTab === 'function') {
        window.CustomerWeb.switchTab('profile');
      }
    },

    /**
     * Chuyển tab trong Customer Portal Modal
     */
    switchPortalTab(tabName) {
      this.portalActiveTab = tabName;
      if (window.CustomerWeb) window.CustomerWeb.portalActiveTab = tabName;

      const contentBody = document.querySelector('.portal-tab-content-body');
      const tabsContainer = document.querySelector('.portal-nav-tabs');
      if (contentBody && tabsContainer) {
        const tabBtns = tabsContainer.querySelectorAll('.portal-tab-btn');
        tabBtns.forEach(btn => {
          const onclickAttr = btn.getAttribute('onclick') || '';
          const dataTab = btn.getAttribute('data-tab') || '';
          if (dataTab === tabName || onclickAttr.includes(`'${tabName}'`)) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });

        const user = this.getCurrentUser();
        if (user) {
          const userBookings = this._getUserBookings(user);
          const userOrders = this._getUserOrders(user);
          const galleryItems = this.getAiGallery();
          const points = user.rewardPoints || (userBookings.length * 50 + 100);
          const tierName = user.tier || (points >= 500 ? 'VIP Chủ Tịch' : points >= 300 ? 'Omni Vàng VIP' : points >= 150 ? 'Omni Bạc' : 'Thành Viên Tiêu Chuẩn');
          contentBody.innerHTML = this.renderPortalTabContent(user, userBookings, userOrders, galleryItems, points, tierName);
          return;
        }
      }
      this.renderCustomerPortalModalBody();
    },

    /**
     * Render toàn bộ body của modal Customer Portal
     */
    renderCustomerPortalModalBody() {
      const user = this.getCurrentUser();
      if (!user) return;

      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;

      const userBookings = this._getUserBookings(user);
      const userOrders = this._getUserOrders(user);
      const galleryItems = this.getAiGallery();
      const points = user.rewardPoints || (userBookings.length * 50 + 100);
      const tierName = user.tier || (points >= 500 ? 'VIP Chủ Tịch' : points >= 300 ? 'Omni Vàng VIP' : points >= 150 ? 'Omni Bạc' : 'Thành Viên Tiêu Chuẩn');
      const isAdmin = this.isAdminUser(user);

      const sanitizedEmail = (user.email || 'Chưa cập nhật Email')
        .replace(/@OMNIbarbershop\.com/gi, '@salontoc.vn')
        .replace(/@gmail\.com/gi, '@omnisalon.vn');

      const escapeFn = (typeof this.escapeHtml === 'function') ? this.escapeHtml.bind(this) : (s => s);
      const initials = (window.SalonUtils && typeof window.SalonUtils.getInitials === 'function')
        ? window.SalonUtils.getInitials(user.fullName || user.name || user.username)
        : (user.fullName || user.name || user.username || 'KH').substring(0, 2).toUpperCase();

      modalBody.innerHTML = `
        <div class="customer-portal-shell" style="max-width: 720px; margin: 0 auto;">
          <!-- 1. Profile Hero Card -->
          <div class="portal-profile-hero" style="background: var(--surface-card, #f8fafc) !important; border: 1px solid var(--border-color, #cbd5e1) !important; border-radius: 16px; padding: 20px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 12px;">
              <div style="display: flex; gap: 16px; align-items: center;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #F59E0B, #D97706); color: #000; font-size: 24px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.3); flex-shrink: 0;">
                  ${initials}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <h3 style="font-size: 22px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0;">${escapeFn(user.fullName || user.name || user.username)}</h3>
                    <span class="header-role-badge role-${(user.role || 'customer').toLowerCase()}">${this.getRoleBadgeText(user)}</span>
                  </div>
                  <div style="font-size: 14px; color: var(--text-secondary, #475569); margin-top: 4px; font-weight: 400;">
                    ${escapeFn(user.phone || 'Chưa cập nhật SĐT')} • ${escapeFn(sanitizedEmail)}
                  </div>
                </div>
              </div>
              <div class="portal-tier-pill" style="font-size: 13px; font-weight: 700; padding: 6px 14px; background: var(--surface-elevated, #e2e8f0); color: var(--brand-accent, #b48312); border: 1px solid var(--border-color, #cbd5e1); border-radius: 999px;">
                ${escapeFn(tierName)}
              </div>
            </div>

            <!-- 4 Metrics Stats Strip -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border-color, #e2e8f0); text-align: center;">
              <div>
                <div style="font-size: 13px; color: var(--text-secondary, #475569); font-weight: 500;">Điểm Thưởng</div>
                <div style="font-size: 22px; font-weight: 900; color: var(--brand-accent, #f59e0b); margin-top: 2px;">${points} pts</div>
              </div>
              <div>
                <div style="font-size: 13px; color: var(--text-secondary, #475569); font-weight: 500;">Lịch Đã Phục Vụ</div>
                <div style="font-size: 22px; font-weight: 900; color: var(--text-primary, #0f172a); margin-top: 2px;">${userBookings.length} Lần</div>
              </div>
              <div>
                <div style="font-size: 13px; color: var(--text-secondary, #475569); font-weight: 500;">Đơn Hàng Sáp</div>
                <div style="font-size: 22px; font-weight: 900; color: var(--text-primary, #0f172a); margin-top: 2px;">${userOrders.length} Đơn</div>
              </div>
              <div>
                <div style="font-size: 13px; color: var(--text-secondary, #475569); font-weight: 500;">Ảnh Tóc AI</div>
                <div style="font-size: 22px; font-weight: 900; color: #0284c7; margin-top: 2px;">${galleryItems.length} Ảnh</div>
              </div>
            </div>
          </div>

          <!-- TRUNG TÂM QUẢN TRỊ DÀNH RIÊNG CHO ADMIN -->
          ${isAdmin ? `
            <div class="portal-admin-hub-card" onclick="UICommon.closeGlobalModal(); if(window.AppRouter) { window.AppRouter.navigate('/admin'); } else if(window.CustomerWeb) { window.CustomerWeb.switchTab('admin'); } else { window.location.href='/admin'; }" 
                 style="margin-top: 16px; margin-bottom: 18px; padding: 16px 20px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%); border: 2px solid #F59E0B; border-radius: 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: none; transition: all 0.25s ease;">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: #F59E0B; color: #0F172A; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; flex-shrink: 0; box-shadow: none;">
                  ADM
                </div>
                <div>
                  <div style="font-size: 15px; font-weight: 900; color: #b48312; letter-spacing: 0.04em; text-transform: uppercase;">
                    [ TRUNG TÂM QUẢN TRỊ &amp; DỮ LIỆU CHUỖI SALON ]
                  </div>
                  <div style="font-size: 13.5px; color: var(--text-secondary, #475569); margin-top: 2px; font-weight: 500;">
                    Dành riêng Quản trị viên: Điều phối ghế thợ, Doanh thu, Nhân sự &amp; Lịch đặt toàn chuỗi
                  </div>
                </div>
              </div>
              <button type="button" class="btn-primary-nordic" style="min-height: 48px; padding: 12px 22px; font-size: 15px; font-weight: 800; background: linear-gradient(135deg, #F59E0B, #D97706); color: #0F172A; border: none; border-radius: 12px; flex-shrink: 0; cursor: pointer; box-shadow: none;" onclick="event.stopPropagation(); UICommon.closeGlobalModal(); if(window.AppRouter) { window.AppRouter.navigate('/admin'); } else if(window.CustomerWeb) { window.CustomerWeb.switchTab('admin'); } else { window.location.href='/admin'; }">
                [ Trung Tâm Quản Trị Salon ] →
              </button>
            </div>
          ` : ''}

          <!-- 2. Portal Navigation Tabs -->
          <div class="portal-nav-tabs" style="display: flex; gap: 8px; border-bottom: 2px solid var(--border-color, #cbd5e1); margin-bottom: 18px; overflow-x: auto; padding-bottom: 4px; scroll-behavior: smooth;">
            <button class="portal-tab-btn ${this.portalActiveTab === 'bookings' ? 'active' : ''}" data-tab="bookings" style="font-size: 14px; font-weight: 600; padding: 10px 16px; flex-shrink: 0; white-space: nowrap;" onclick="CustomerWeb.switchPortalTab('bookings')">
              Lịch Cắt Tóc (${userBookings.length})
            </button>
            <button class="portal-tab-btn ${this.portalActiveTab === 'orders' ? 'active' : ''}" data-tab="orders" style="font-size: 14px; font-weight: 600; padding: 10px 16px; flex-shrink: 0; white-space: nowrap;" onclick="CustomerWeb.switchPortalTab('orders')">
              Đơn Hàng (${userOrders.length})
            </button>
            <button class="portal-tab-btn ${this.portalActiveTab === 'gallery' ? 'active' : ''}" data-tab="gallery" style="font-size: 14px; font-weight: 600; padding: 10px 16px; flex-shrink: 0; white-space: nowrap;" onclick="CustomerWeb.switchPortalTab('gallery')">
              Thư Viện Tóc AI (${galleryItems.length})
            </button>
            <button class="portal-tab-btn ${this.portalActiveTab === 'rewards' ? 'active' : ''}" data-tab="rewards" style="font-size: 14px; font-weight: 600; padding: 10px 16px; flex-shrink: 0; white-space: nowrap;" onclick="CustomerWeb.switchPortalTab('rewards')">
              Điểm &amp; Hạng
            </button>
            <button class="portal-tab-btn ${this.portalActiveTab === 'profile' ? 'active' : ''}" data-tab="profile" style="font-size: 14px; font-weight: 600; padding: 10px 16px; flex-shrink: 0; white-space: nowrap;" onclick="CustomerWeb.switchPortalTab('profile')">
              Hồ Sơ
            </button>
          </div>

          <!-- 3. Dynamic Tab Content -->
          <div class="portal-tab-content-body" style="min-height: 260px; background: var(--surface-card, #f8fafc); border: 1px solid var(--border-color, #cbd5e1); border-radius: 14px; padding: 20px;">
            ${this.renderPortalTabContent(user, userBookings, userOrders, galleryItems, points, tierName)}
          </div>

          <!-- 4. Portal Footer Actions -->
          <div style="display: flex; gap: 12px; border-top: 1px solid var(--border-color, #cbd5e1); padding-top: 16px; margin-top: 20px; justify-content: space-between; align-items: center;">
            <button type="button" class="btn-cancel" style="min-height: 44px; height: 44px; padding: 0 20px; font-size: 14px; font-weight: 600; border-radius: 12px; background: var(--surface-elevated, #e2e8f0); color: var(--text-primary, #0f172a); border: 1px solid var(--border-color, #cbd5e1);" onclick="UICommon.closeGlobalModal()">Đóng Cửa Sổ</button>
            <button type="button" class="pill-btn-outline" style="min-height: 44px; height: 44px; color: #dc2626; border-color: rgba(220, 38, 38, 0.4); background: rgba(220, 38, 38, 0.08); font-size: 14px; font-weight: 700; padding: 0 20px; border-radius: 12px;" onclick="CustomerWeb.handleLogout()">
              Đăng Xuất An Toàn
            </button>
          </div>
        </div>
      `;

      modal.classList.add('active');
    },

    /**
     * Render nội dung tab con theo tab đang chọn
     */
    renderPortalTabContent(user, bookings, orders, gallery, points, tierName) {
      switch (this.portalActiveTab) {
        case 'bookings':
          return this.renderPortalBookingsTab(bookings);
        case 'orders':
          return this.renderPortalOrdersTab(orders);
        case 'gallery':
          return this.renderPortalGalleryTab(gallery);
        case 'rewards':
          return this.renderPortalRewardsTab(user, points, tierName);
        case 'profile':
          return this.renderPortalProfileTab(user);
        default:
          return this.renderPortalBookingsTab(bookings);
      }
    },

    /**
     * Tab: Lịch Hẹn Cắt Tóc
     */
    renderPortalBookingsTab(bookings) {
      if (!bookings || bookings.length === 0) {
        return `
          <div style="padding: 32px 20px; background: var(--surface-elevated, #f8fafc); border-radius: 10px; text-align: center; color: var(--text-secondary, #64748b); font-size: 13px; border: 1px dashed var(--border-color, #cbd5e1);">
            <strong style="color: var(--text-primary, #111);">Bạn chưa có lịch hẹn cắt tóc nào!</strong>
            <p style="margin: 6px auto 14px; max-width: 380px;">Hãy đặt lịch trước để được phục vụ đúng giờ với Master Stylist yêu thích và nhận 50 điểm thưởng thành viên.</p>
            <button class="btn-submit-terracotta" style="padding: 8px 20px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
              + Đặt Lịch Hẹn Ngay
            </button>
          </div>
        `;
      }

      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const branchMap = new Map(branches.map(b => [String(b.id), b]));
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const stylistMap = new Map(stylists.map(s => [String(s.id), s]));
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const serviceMap = new Map(services.map(s => [String(s.id), s]));

      const escapeFn = (typeof this.escapeHtml === 'function') ? this.escapeHtml.bind(this) : (s => s);

      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: var(--text-secondary, #555); text-transform: uppercase;">Danh Sách Lịch Hẹn Cắt Tóc:</span>
            <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
              + Đặt Lịch Mới
            </button>
          </div>
          <div style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px;">
            ${bookings.map(b => {
              const statusInfo = (typeof SalonUtils !== 'undefined' && SalonUtils.formatBookingStatus)
                ? SalonUtils.formatBookingStatus(b.status)
                : { key: b.status || '', label: b.status || '', cssClass: '' };
              const isCompleted = statusInfo.key === 'completed';
              const isCancelled = statusInfo.key === 'cancelled';
              const isCancellable = !isCompleted && !isCancelled;
              const branch = branchMap.get(String(b.branchId)) || {};
              const stylist = stylistMap.get(String(b.stylistId)) || {};
              const service = serviceMap.get(String(b.serviceId)) || {};
              const branchName = b.branchName || branch.name || 'Omni Salon Suite';
              const stylistName = b.stylistName || stylist.name || 'Chỉ định';
              const serviceName = b.serviceName || service.name || 'Dịch vụ Omni Salon';
              const bCode = b.id || b.bookingCode || b.MaLichHen;
              const isPaid = (b.paymentStatus === 'Paid' || b.paymentStatus === 'PAID' || b.TrangThaiThanhToan === 'Đã thanh toán');
              const bReview = (window.store && typeof window.store.getReviewByBookingId === 'function') ? window.store.getReviewByBookingId(bCode) : null;
              const payMethodLabel = (b.paymentMethod === 'Cash' || b.paymentMethod === 'Counter_Cash' || b.paymentMethod === 'Tiền Mặt Tại Quầy') ? 'Tiền Mặt Tại Quầy' : 'VietQR';

              const fmtDate = (d) => (typeof SalonUtils !== 'undefined' && SalonUtils.formatDate ? SalonUtils.formatDate(d) : (d || ''));
              const fmtCurr = (c) => (typeof SalonUtils !== 'undefined' && SalonUtils.formatCurrency ? SalonUtils.formatCurrency(c) : `${c} đ`);

              return `
                <div class="portal-card-history" style="background: var(--surface-card, #ffffff); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 12px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <div>
                      <strong style="color: var(--text-primary, #111); font-size: 14px;">#${escapeFn(bCode)}</strong>
                      <span style="font-size: 13px; font-weight: 700; color: var(--color-accent-gold); margin-left: 6px;">: ${escapeFn(serviceName)}</span>
                    </div>
                    <span class="status-pill-pulse ${statusInfo.cssClass}" style="font-size: 10px;">
                      <span class="pulse-dot"></span> ${statusInfo.label}
                    </span>
                  </div>
                  <div style="font-size: 12px; color: var(--text-secondary, #555); line-height: 1.5;">
                    <div>Chi nhánh: <strong>${escapeFn(branchName)}</strong></div>
                    <div>Master Stylist: <strong>${escapeFn(stylistName)}</strong> • Giờ hẹn: <span style="color: var(--brand-accent, #c85a44); font-weight:800;">${b.timeSlot} (${fmtDate(b.date || b.bookingDate)})</span></div>
                    <div>Chi phí: <strong>${fmtCurr(b.totalPrice || 0)}</strong></div>
                    <div>Thanh toán: <strong>${payMethodLabel}</strong> • Trạng thái: <strong style="color: ${isPaid ? '#16a34a' : '#ea580c'};">${isPaid ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}</strong></div>
                  </div>

                  <!-- Khối đánh giá dịch vụ -->
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color, rgba(255,255,255,0.08)); font-size: 11.5px; color: var(--text-secondary, #666);">
                    ${bReview ? `
                      <span style="color: #f59e0b; font-size: 13px;">${'★'.repeat(bReview.rating || 5)}${'☆'.repeat(5 - (bReview.rating || 5))}</span>
                      <span style="color: var(--text-secondary); font-size: 12px; margin-left: 6px; font-style: italic;">"${escapeFn(bReview.comment || 'Rất hài lòng')}"</span>
                    ` : `
                      <span>Bạn đã trải nghiệm dịch vụ? Hãy để lại đánh giá cho Omni Salon nhé!</span>
                    `}
                  </div>

                  <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center; flex-wrap: wrap; margin-top: 10px;">
                    <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="CustomerWeb.showTicketQr('${b.id}')">
                      Xem Vé QR
                    </button>
                    ${(!isPaid && !isCancelled) ? `
                      <button class="btn-submit-terracotta" style="font-size: 11px; padding: 5px 12px; background: #16a34a; display: inline-flex; align-items: center; gap: 4px;" 
                              onclick="CustomerWeb.openBookingPaymentModal('${escapeFn(bCode)}')">
                        💳 Thanh Toán Ngay (VietQR)
                      </button>
                    ` : ''}
                    ${(!isCancelled) ? (bReview ? `
                      <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px; color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);" 
                              onclick="CustomerWeb.openBookingReviewModal('${escapeFn(bCode)}')">
                        Sửa Đánh Giá
                      </button>
                    ` : `
                      <button class="btn-submit-terracotta" style="font-size: 11px; padding: 5px 12px; background: #d97706; display: inline-flex; align-items: center; gap: 4px;" 
                              onclick="CustomerWeb.openBookingReviewModal('${escapeFn(bCode)}')">
                        ⭐ Đánh Giá Lịch Hẹn
                      </button>
                    `) : ''}
                    ${isCancellable ? `
                      <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px; color: #b91c1c; border-color: #fca5a5;" onclick="CustomerWeb.cancelBookingByCustomer('${b.id}')">
                        Hủy Lịch
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    /**
     * Tab: Đơn Hàng Mỹ Phẩm & Tiến Trình Vận Chuyển
     */
    renderPortalOrdersTab(orders) {
      if (!orders || orders.length === 0) {
        return `
          <div style="padding: 32px 20px; background: var(--surface-elevated, #f8fafc); border-radius: 10px; text-align: center; color: var(--text-secondary, #64748b); font-size: 13px; border: 1px dashed var(--border-color, #cbd5e1);">
            <strong style="color: var(--text-primary, #111);">Bạn chưa có đơn hàng mỹ phẩm nào!</strong>
            <p style="margin: 6px auto 14px; max-width: 380px;">Khám phá các dòng sáp Pomade Brosh Nhật Bản chính hãng, dầu gội giữ màu và áo nón Streetwear.</p>
            <button class="btn-submit-terracotta" style="padding: 8px 20px;" onclick="UICommon.closeGlobalModal(); document.getElementById('newProductsSection')?.scrollIntoView({behavior:'smooth'});">
              Xem Cửa Hàng Sản Phẩm
            </button>
          </div>
        `;
      }

      const products = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts() : [];
      const productMap = new Map(products.map(p => [String(p.id), p]));
      const escapeFn = (typeof this.escapeHtml === 'function') ? this.escapeHtml.bind(this) : (s => s);

      return `
        <div>
          <div style="font-size: 12px; font-weight: 800; color: var(--text-secondary, #555); text-transform: uppercase; margin-bottom: 10px;">
            Lịch Sử Đơn Hàng &amp; Tiến Trình Vận Chuyển:
          </div>
          <div style="max-height: 540px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-right: 6px;">
            ${orders.map(o => {
              const oId = escapeFn(o.id || o.orderCode || o.MaDonHang || 'DH');
              const rawSt = (o.orderStatus || o.status || o.TrangThai || 'Pending').toLowerCase();
              let step = 1;
              if (rawSt.includes('hủy') || rawSt === 'cancelled') {
                step = 0;
              } else if (rawSt.includes('hoàn tất') || rawSt.includes('đã giao') || rawSt === 'completed' || rawSt === 'delivered') {
                step = 4;
              } else if (rawSt.includes('đang giao') || rawSt === 'delivering' || rawSt === 'shipping' || (rawSt.includes('giao') && !rawSt.includes('đã giao'))) {
                step = 3;
              } else if (rawSt.includes('đóng gói') || rawSt.includes('xử lý') || rawSt === 'processing') {
                step = 2;
              } else {
                step = 1;
              }

              const isPickup = o.deliveryType === 'PICKUP_BRANCH';
              const isCancelled = (step === 0);
              const isDelivering = (step === 3);
              const isCompleted = (step === 4);
              const isPaid = (o.paymentStatus === 'Paid' || o.TrangThai === 'Đã thanh toán' || o.paymentStatus === 'PAID');
              const items = Array.isArray(o.items) ? o.items : [];
              const rawDate = o.createdAt || o.orderDate || o.NgayDat;
              const formattedDate = rawDate ? (window.SalonUtils && window.SalonUtils.formatDateTime ? window.SalonUtils.formatDateTime(rawDate) : String(rawDate).split('T')[0]) : 'Hôm nay';
              const oReview = (window.store && typeof window.store.getReviewByOrderId === 'function') ? window.store.getReviewByOrderId(o.id || o.orderCode || o.MaDonHang) : null;
              const fmtCurr = (c) => (typeof SalonUtils !== 'undefined' && SalonUtils.formatCurrency ? SalonUtils.formatCurrency(c) : `${c} đ`);

              return `
                <div class="portal-card-history order-card-premium" style="background: var(--surface-card, #1c1c1a); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 20px 24px; box-shadow: 0 6px 20px rgba(0,0,0,0.25);">
                  <!-- Header don hang -->
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="font-size: 16px; font-weight: 900; color: #f59e0b; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 10px; border-radius: 6px; font-family: monospace;">#${oId}</span>
                      <span style="font-size: 13.5px; color: var(--text-secondary, #a1a1aa);">Đặt ngày: <strong style="color: #FAF8F5;">${formattedDate}</strong></span>
                    </div>
                    <div style="display: flex; align-items: baseline; gap: 6px;">
                      <span style="font-size: 13px; color: var(--text-secondary, #a1a1aa); text-transform: uppercase; font-weight: 600;">Tổng:</span>
                      <strong style="color: #f59e0b; font-size: 20px; font-weight: 900;">${fmtCurr(o.totalAmount || 0)}</strong>
                    </div>
                  </div>

                  <!-- Visual Timeline 4 Buoc -->
                  ${isCancelled ? `
                    <div style="padding: 12px 16px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 10px; font-size: 14px; font-weight: 700; color: #ef4444; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                      <span>❌</span> Đơn hàng đã được hủy
                    </div>
                  ` : `
                    <div class="order-status-timeline" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; padding: 12px 18px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; ${step > 1 ? 'background: #10B981; color: #000;' : (step === 1 ? 'background: #f59e0b; color: #000;' : 'background: rgba(255,255,255,0.1); color: #71717a;')}">${step > 1 ? '✓' : '1'}</span>
                        <span style="font-size: 13.5px; font-weight: ${step >= 1 ? '800' : '600'}; color: ${step === 1 ? '#f59e0b' : (step > 1 ? '#10B981' : '#71717a')};">Chờ Xác Nhận</span>
                      </div>
                      <span style="color: ${step > 1 ? '#10B981' : 'rgba(255,255,255,0.2)'}; font-weight: 900; font-size: 16px;">→</span>
                      
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; ${step > 2 ? 'background: #10B981; color: #000;' : (step === 2 ? 'background: #f59e0b; color: #000;' : 'background: rgba(255,255,255,0.1); color: #71717a;')}">${step > 2 ? '✓' : '2'}</span>
                        <span style="font-size: 13.5px; font-weight: ${step >= 2 ? '800' : '600'}; color: ${step === 2 ? '#f59e0b' : (step > 2 ? '#10B981' : '#71717a')};">Đang Đóng Gói</span>
                      </div>
                      <span style="color: ${step > 2 ? '#10B981' : 'rgba(255,255,255,0.2)'}; font-weight: 900; font-size: 16px;">→</span>

                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; ${step > 3 ? 'background: #10B981; color: #000;' : (step === 3 ? 'background: #0284c7; color: #fff;' : 'background: rgba(255,255,255,0.1); color: #71717a;')}">${step > 3 ? '✓' : '3'}</span>
                        <span style="font-size: 13.5px; font-weight: ${step >= 3 ? '800' : '600'}; color: ${step === 3 ? '#0284c7' : (step > 3 ? '#10B981' : '#71717a')};">Đang Giao</span>
                      </div>
                      <span style="color: ${step === 4 ? '#10B981' : 'rgba(255,255,255,0.2)'}; font-weight: 900; font-size: 16px;">→</span>

                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; ${step === 4 ? 'background: #10B981; color: #000;' : 'background: rgba(255,255,255,0.1); color: #71717a;'}">${step === 4 ? '✓' : '4'}</span>
                        <span style="font-size: 13.5px; font-weight: ${step === 4 ? '800' : '600'}; color: ${step === 4 ? '#10B981' : '#71717a'};">Hoàn Tất</span>
                      </div>
                    </div>
                  `}

                  <!-- Danh sach mon hang -->
                  <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 12px; padding: 14px 18px; margin-bottom: 14px;">
                    <div style="font-size: 12.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px;">
                      📦 SẢN PHẨM TRONG ĐƠN:
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      ${items.map(it => {
                        const prod = productMap.get(String(it.productId || it.id)) || {};
                        const itemName = it.name || prod.name || 'Sản phẩm';
                        const itemQty = it.qty || it.quantity || 1;
                        const itemPrice = it.price || it.unitPrice || prod.price || 0;
                        return `
                          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14.5px;">
                            <span style="color: #FAF8F5;">• ${escapeFn(itemName)} <strong style="color: #f59e0b; margin-left: 6px;">× ${itemQty}</strong></span>
                            <strong style="color: #f59e0b;">${fmtCurr(itemPrice * itemQty)}</strong>
                          </div>
                        `;
                      }).join('')}
                    </div>

                    <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(255, 255, 255, 0.12); font-size: 13.5px; color: var(--text-secondary, #a1a1aa); display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between;">
                      <div>Hình thức: <strong style="color: #FAF8F5;">${isPickup ? 'Nhận tại quầy chi nhánh' : 'Giao hàng tận nơi'}</strong></div>
                      <div>Thanh toán: <strong style="color: ${isPaid ? '#10B981' : '#f59e0b'};">${isPaid ? 'Đã Thanh Toán (VietQR)' : 'Chưa Thanh Toán'}</strong></div>
                    </div>
                  </div>

                  <!-- Danh gia neu co -->
                  ${oReview ? `
                    <div style="font-size: 13.5px; color: #FAF8F5; padding: 10px 14px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                      <span style="color: #f59e0b; font-size: 15px;">${'★'.repeat(oReview.rating || 5)}${'☆'.repeat(5 - (oReview.rating || 5))}</span>
                      <span style="font-style: italic; color: #e4e4e7;">"${escapeFn(oReview.comment || 'Rất hài lòng')}"</span>
                    </div>
                  ` : ''}

                  <!-- Hang nut thao tac -->
                  <div style="margin-top: 12px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                      ${isDelivering ? `
                        <span style="font-size: 13px; color: #0284c7; background: rgba(2, 132, 199, 0.12); border: 1px solid rgba(2, 132, 199, 0.35); padding: 6px 12px; border-radius: 8px; font-weight: 700;">
                          🚚 Đang vận chuyển
                        </span>
                      ` : (isCompleted ? `
                        <span style="font-size: 13px; color: #10B981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 6px 12px; border-radius: 8px; font-weight: 700;">
                          ✓ Đã hoàn tất
                        </span>
                      ` : '')}
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                      ${(!isPaid && !isCancelled) ? `
                        <button type="button" class="btn-order-action" style="font-size: 13px; padding: 8px 16px; color: #10b981; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                                onclick="CustomerWeb.openOrderPaymentModal('${oId}')">
                          💳 Thanh Toán VietQR
                        </button>
                      ` : ''}

                      ${(!isCancelled) ? (oReview ? `
                        <button type="button" class="btn-order-action" style="font-size: 13px; padding: 8px 16px; color: #f59e0b; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                                onclick="CustomerWeb.openOrderReviewModal('${oId}')">
                          ⭐ Sửa Đánh Giá
                        </button>
                      ` : `
                        <button type="button" class="btn-order-action" style="font-size: 13px; padding: 8px 16px; color: #f59e0b; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                                onclick="CustomerWeb.openOrderReviewModal('${oId}')">
                          ⭐ Đánh Giá Đơn Hàng
                        </button>
                      `) : ''}

                      ${(window.SalonUtils && typeof window.SalonUtils.canCancelOrder === 'function' ? window.SalonUtils.canCancelOrder(o) : (!isCancelled)) ? `
                        <button type="button" class="btn-order-action" style="font-size: 13px; padding: 8px 16px; color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                                onclick="CustomerWeb.openOrderCancelModal('${oId}')">
                          ✕ Hủy Đơn Hàng
                        </button>
                      ` : `
                        <span style="font-size: 12.5px; color: #94a3b8; background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); padding: 6px 14px; border-radius: 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                          ✕ Đã hủy đơn
                        </span>
                      `}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    /**
     * Tab: Thư Viện Ảnh Tóc AI
     */
    renderPortalGalleryTab(gallery) {
      if (!gallery || gallery.length === 0) {
        return `
          <div style="padding: 32px 20px; background: var(--surface-elevated, #f8fafc); border-radius: 10px; text-align: center; color: var(--text-secondary, #64748b); font-size: 13px; border: 1px dashed var(--border-color, #cbd5e1);">
            <strong style="color: var(--text-primary, #111);">Bạn chưa có bức ảnh tóc AI nào!</strong>
            <p style="margin: 6px auto 14px; max-width: 380px;">Hãy chụp hoặc tải ảnh khuôn mặt của bạn lên AI Barber Studio để thử phom tóc mới miễn phí.</p>
            <button class="btn-submit-terracotta" style="padding: 8px 20px;" onclick="UICommon.closeGlobalModal(); document.getElementById('aiStudioSection')?.scrollIntoView({behavior:'smooth'});">
              Thử Đổi Kiểu Tóc AI Ngay
            </button>
          </div>
        `;
      }

      const escapeFn = (typeof this.escapeHtml === 'function') ? this.escapeHtml.bind(this) : (s => s);
      const fmtDate = (d) => (typeof SalonUtils !== 'undefined' && SalonUtils.formatDate ? SalonUtils.formatDate(d) : (d || ''));

      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: var(--text-secondary, #555); text-transform: uppercase;">Bộ Sưu Tập Tóc AI Đã Tạo (${gallery.length}):</span>
            <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="UICommon.closeGlobalModal(); document.getElementById('aiStudioSection')?.scrollIntoView({behavior:'smooth'});">
              + Tạo Kiểu Tóc Mới
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-height: 320px; overflow-y: auto; padding-right: 4px;">
            ${gallery.map(item => `
              <div class="portal-ai-card" style="background: var(--surface-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column;">
                <div style="position: relative; height: 160px; overflow: hidden; background: #000;">
                  <img src="${item.resultImageUrl}" alt="${escapeFn(item.hairstyle)}" style="width: 100%; height: 100%; object-fit: cover;">
                  <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
                    ${fmtDate(item.createdAt)}
                  </span>
                </div>
                <div style="padding: 10px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h5 style="margin: 0 0 4px; font-size: 13px; font-weight: 800; color: var(--text-primary, #111);">${escapeFn(item.hairstyle)}</h5>
                    <div style="font-size: 11px; color: var(--text-secondary, #666); display: flex; align-items: center; gap: 4px;">
                      <span style="width: 8px; height: 8px; border-radius: 50%; background: ${item.colorHex || '#111'}; display: inline-block;"></span>
                      <span>${escapeFn(item.color)}</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px; margin-top: 10px;">
                    <a href="${item.resultImageUrl}" download="Omni-AI-Hair.jpg" class="pill-btn-outline" style="flex: 1; font-size: 10px; padding: 4px; text-align: center; text-decoration: none;">
                      Tải HD
                    </a>
                    <button class="btn-submit-terracotta" style="flex: 1; font-size: 10px; padding: 4px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
                      Cắt Kiểu Này
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    /**
     * Tab: Điểm Thưởng & Hạng Thành Viên
     */
    renderPortalRewardsTab(user, points, tierName) {
      const nextTierPoints = points < 150 ? 150 : points < 300 ? 300 : 500;
      const progressPercent = Math.min(100, Math.round((points / nextTierPoints) * 100));
      const escapeFn = (typeof this.escapeHtml === 'function') ? this.escapeHtml.bind(this) : (s => s);

      return `
        <div>
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%); border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase;">HẠNG THÀNH VIÊN HIỆN TẠI</span>
                <h4 style="font-size: 18px; font-weight: 900; color: #92400e; margin: 2px 0 0;">${escapeFn(tierName)}</h4>
              </div>
              <div style="font-size: 24px; font-weight: 900; color: #d97706;">
                ${points} <span style="font-size: 12px; color: #b45309;">điểm</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div style="margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #92400e; margin-bottom: 4px;">
                <span>Tiến trình nâng hạng tiếp theo</span>
                <span>${points} / ${nextTierPoints} pts</span>
              </div>
              <div style="width: 100%; height: 8px; background: rgba(217, 119, 6, 0.2); border-radius: 4px; overflow: hidden;">
                <div style="width: ${progressPercent}%; height: 100%; background: #d97706; border-radius: 4px;"></div>
              </div>
            </div>
          </div>

          <div style="font-size: 12px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 10px;">
            Đặc Quyền Thành Viên Omni Salon:
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #444;">
            <div style="display: flex; gap: 8px; align-items: baseline;">
              <span style="color: var(--brand-accent, #F59E0B); font-weight: 800;">•</span>
              <span><strong>Tích điểm tự động:</strong> Nhận 50 điểm cho mỗi ca cắt tóc hoàn thành &amp; 1 điểm cho mỗi 10.000đ mua sắm.</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: baseline;">
              <span style="color: var(--brand-accent, #F59E0B); font-weight: 800;">•</span>
              <span><strong>Ưu tiên đặt ghế:</strong> Được giữ chỗ thợ Master Stylist ưu tiên vào các khung giờ cao điểm cuối tuần.</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: baseline;">
              <span style="color: var(--brand-accent, #F59E0B); font-weight: 800;">•</span>
              <span><strong>Chiết khấu độc quyền:</strong> Giảm giá trực tiếp 5% - 15% khi thanh toán qua cổng mã VietQR.</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: baseline;">
              <span style="color: var(--brand-accent, #F59E0B); font-weight: 800;">•</span>
              <span><strong>Quà sinh nhật:</strong> Tặng 01 lần cạo mặt khăn nóng cổ điển &amp; vuốt sáp miễn phí trong tháng sinh nhật.</span>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Tab: Hồ Sơ Cá Nhân & Chỉnh Sửa
     */
    renderPortalProfileTab(user) {
      const escapeFn = (typeof this.escapeHtml === 'function') ? this.escapeHtml.bind(this) : (s => s);
      return `
        <div>
          <div style="font-size: 12px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 12px;">
            Cập Nhật Thông Tin Cá Nhân:
          </div>
          <form id="portalProfileForm" onsubmit="CustomerWeb.handleProfileUpdate(event)">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 700; color: #333; margin-bottom: 4px;">Họ Và Tên:</label>
                <input type="text" id="profileFullName" class="form-control-custom" value="${escapeFn(user.fullName || user.name || '')}" placeholder="Nguyễn Văn A" required>
                <span class="field-error-text" id="errProfileFullName" style="display:none; color:#b91c1c; font-size:11px; margin-top:2px;"></span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; color: #333; margin-bottom: 4px;">Số Điện Thoại:</label>
                  <input type="tel" id="profilePhone" class="form-control-custom" value="${escapeFn(user.phone || '')}" placeholder="0908123456" required>
                  <span class="field-error-text" id="errProfilePhone" style="display:none; color:#b91c1c; font-size:11px; margin-top:2px;"></span>
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; color: #333; margin-bottom: 4px;">Email Nhận Vé:</label>
                  <input type="email" id="profileEmail" class="form-control-custom" value="${escapeFn(user.email || '')}" placeholder="member@omnisalon.vn" required>
                  <span class="field-error-text" id="errProfileEmail" style="display:none; color:#b91c1c; font-size:11px; margin-top:2px;"></span>
                </div>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 700; color: #333; margin-bottom: 4px;">Tên Đăng Nhập (Username):</label>
                <input type="text" class="form-control-custom" value="${escapeFn(user.username || '')}" disabled style="background:#f1f5f9; color:#64748b; cursor:not-allowed;">
              </div>

              <div style="margin-top: 8px;">
                <button type="submit" class="btn-submit-terracotta" style="width: 100%; padding: 10px;">
                  Lưu Thông Tin Cá Nhân
                </button>
              </div>
            </div>
          </form>
        </div>
      `;
    },

    /**
     * Xử lý submit cập nhật hồ sơ cá nhân
     */
    handleProfileUpdate(e) {
      e.preventDefault();

      const nameInput = document.getElementById('profileFullName');
      const phoneInput = document.getElementById('profilePhone');
      const emailInput = document.getElementById('profileEmail');

      const fullName = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

      let hasError = false;

      const errName = document.getElementById('errProfileFullName');
      if (!fullName || fullName.length < 2) {
        if (errName) { errName.textContent = 'Họ và tên phải có ít nhất 2 ký tự.'; errName.style.display = 'block'; }
        hasError = true;
      } else if (errName) { errName.style.display = 'none'; }

      const phoneRegex = /^(0|\+84)[0-9]{9}$/;
      const errPhone = document.getElementById('errProfilePhone');
      if (!phone || !phoneRegex.test(phone)) {
        if (errPhone) { errPhone.textContent = 'Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 0 hoặc +84).'; errPhone.style.display = 'block'; }
        hasError = true;
      } else if (errPhone) { errPhone.style.display = 'none'; }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const errEmail = document.getElementById('errProfileEmail');
      if (!email || !emailRegex.test(email)) {
        if (errEmail) { errEmail.textContent = 'Định dạng Email không hợp lệ.'; errEmail.style.display = 'block'; }
        hasError = true;
      } else if (errEmail) { errEmail.style.display = 'none'; }

      if (hasError) return;

      const updates = { fullName, phone, email };

      const refreshHeader = () => {
        if (typeof this.renderHeader === 'function') this.renderHeader();
        else if (window.CustomerWeb && typeof window.CustomerWeb.renderHeader === 'function') window.CustomerWeb.renderHeader();
      };

      if (window.AuthEngine && typeof window.AuthEngine.updateProfile === 'function') {
        const res = window.AuthEngine.updateProfile(updates);
        if (res && res.success) {
          if (window.UICommon) window.UICommon.showToast('Cập nhật hồ sơ tài khoản thành công!');
          refreshHeader();
          this.renderCustomerPortalModalBody();
        } else {
          if (window.UICommon) window.UICommon.showToast((res && res.message) || 'Lỗi cập nhật hồ sơ', 'error');
        }
      } else if (window.store && typeof window.store.updateCurrentUser === 'function') {
        window.store.updateCurrentUser(updates);
        if (window.UICommon) window.UICommon.showToast('Đã lưu thông tin tài khoản!');
        refreshHeader();
        this.renderCustomerPortalModalBody();
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerPortal = CustomerPortal;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerPortal);
  }

})(typeof window !== 'undefined' ? window : this);

