// Trang thông tin cá nhân khách hàng /profile: lịch hẹn, đơn hàng, tóc AI, cài đặt

(function (window) {
  'use strict';

  const ProfilePage = {
    activeTab: 'bookings',

    setTab(tab) {
      this.activeTab = (tab === 'rewards') ? 'bookings' : tab;
      const container = document.getElementById('webMainContainer');
      if (container) {
        this.render(container);
      }
    },

    render(container, params = {}) {
      if (!container) return;

      if (params && params.tab) {
        this.activeTab = (params.tab === 'rewards') ? 'bookings' : params.tab;
      }
      if (this.activeTab === 'rewards') {
        this.activeTab = 'bookings';
      }

      const user = (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function')
        ? window.CustomerWeb.getCurrentUser()
        : ((window.store && typeof window.store.getCurrentUser === 'function') ? window.store.getCurrentUser() : null);

      // Nếu chưa đăng nhập, hiển thị màn hình yêu cầu đăng nhập thân thiện
      if (!user) {
        container.innerHTML = `
          <div class="profile-page-shell" style="background-color: var(--bg-primary); min-height: 80vh; padding: 60px 20px; display: flex; align-items: center; justify-content: center;">
            <div style="max-width: 480px; width: 100%; text-align: center; background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 40px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
              <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(197, 155, 39, 0.15); border: 2px solid #C59B27; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C59B27" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0 0 10px;">Tài Khoản Omni Salon</h2>
              <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">
                Đăng nhập để theo dõi trạng thái lịch hẹn cắt tóc, quản lý đơn hàng mỹ phẩm và xem bộ sưu tập tóc AI.
              </p>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <button type="button" class="btn-submit-terracotta" style="width: 100%; height: 46px; font-size: 14.5px; font-weight: 800; border-radius: 10px; background: #C59B27; color: #000;" onclick="UICommon.openAuthModal('login')">
                  Đăng Nhập Tài Khoản
                </button>
                <button type="button" class="pill-btn-outline" style="width: 100%; height: 46px; font-size: 14px; font-weight: 700; border-radius: 10px;" onclick="UICommon.openAuthModal('register')">
                  Tạo Tài Khoản Mới
                </button>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Đã đăng nhập: lấy toàn bộ dữ liệu người dùng
      const userPhone = (user.phone || '').trim().toLowerCase();
      const userId = (user.id || '').trim().toLowerCase();

      const allBookings = (window.store && typeof window.store.getBookings === 'function')
        ? window.store.getBookings()
        : ((window.store && window.store.state && window.store.state.bookings) ? window.store.state.bookings : []);
      const userBookings = allBookings.filter(b => {
        const bPhone = (b.customerPhone || '').trim().toLowerCase();
        const bUid = (b.userId || '').trim().toLowerCase();
        return (userPhone && bPhone === userPhone) || (userId && bUid === userId);
      });

      const allOrders = (window.store && typeof window.store.getOrders === 'function')
        ? window.store.getOrders()
        : ((window.store && window.store.state && window.store.state.orders) ? window.store.state.orders : []);
      const userOrders = allOrders.filter(o => {
        const oPhone = (o.customerPhone || '').trim().toLowerCase();
        const oUid = (o.userId || '').trim().toLowerCase();
        return (userPhone && oPhone === userPhone) || (userId && oUid === userId);
      });

      const galleryItems = (window.store && typeof window.store.getAiHairHistory === 'function')
        ? window.store.getAiHairHistory()
        : [];

      const isAdmin = (window.CustomerWeb && typeof window.CustomerWeb.isAdminUser === 'function')
        ? window.CustomerWeb.isAdminUser(user)
        : (user && ['SUPER_ADMIN', 'ADMIN'].includes(String(user.role).toUpperCase()));

      const avatarInitials = window.SalonUtils ? window.SalonUtils.getInitials(user.fullName || user.name || user.username || 'Omni') : 'OS';

      container.innerHTML = `
        <div class="profile-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 40px 0 80px;">
          <div class="omni-container" style="max-width: 1240px; margin: 0 auto; padding: 0 20px;">
            
            <!-- 1. HEADER PROFILE HERO BANNER -->
            <div class="profile-hero-card" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 28px; margin-bottom: 28px; box-shadow: 0 8px 30px rgba(0,0,0,0.25);">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                
                <!-- Cột thông tin thành viên -->
                <div style="display: flex; align-items: center; gap: 20px;">
                  <div style="width: 76px; height: 76px; border-radius: 50%; background: #C59B27; color: #141413; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 900; box-shadow: 0 4px 15px rgba(197, 155, 39, 0.3); border: 2px solid #FFFFFF;">
                    ${avatarInitials}
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                      <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin: 0;">
                        ${window.SalonUtils ? window.SalonUtils.escapeHtml(user.fullName || user.name || user.username) : (user.fullName || user.name)}
                      </h1>
                      ${isAdmin ? `
                        <span style="font-size: 11.5px; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; padding: 3px 10px; border-radius: 20px; text-transform: uppercase;">
                          Quản Trị Viên
                        </span>
                      ` : ''}
                    </div>
                    <div style="font-size: 13.5px; color: var(--text-secondary); display: flex; gap: 16px; flex-wrap: wrap;">
                      <span style="display: inline-flex; align-items: center; gap: 5px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> ${user.phone || 'Chưa cập nhật SĐT'}</span>
                      <span style="display: inline-flex; align-items: center; gap: 5px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> ${user.email || 'khachhang@omnisalon.vn'}</span>
                    </div>
                  </div>
                </div>

                <!-- Thống kê nhanh & Nút thao tác -->
                <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
                  <div style="display: flex; gap: 20px; text-align: center; background: var(--surface-elevated); padding: 12px 20px; border-radius: 14px; border: 1px solid var(--border-color);">
                    <div>
                      <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Lịch Hẹn</div>
                      <div style="font-size: 20px; font-weight: 900; color: var(--text-primary); margin-top: 2px;">${userBookings.length}</div>
                    </div>
                    <div style="width: 1px; background: var(--border-color);"></div>
                    <div>
                      <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Đơn Hàng</div>
                      <div style="font-size: 20px; font-weight: 900; color: var(--text-primary); margin-top: 2px;">${userOrders.length}</div>
                    </div>
                  </div>

                  <button type="button" class="pill-btn-outline" style="height: 42px; padding: 0 16px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4); font-size: 13px; font-weight: 700;" onclick="ProfilePage.handleLogout()">
                    Đăng Xuất
                  </button>
                </div>
              </div>
            </div>

            <!-- 2. NAVIGATION TABS TRANG PROFILE -->
            <div class="profile-nav-tabs" style="display: flex; gap: 10px; border-bottom: 2px solid var(--border-color); margin-bottom: 24px; overflow-x: auto; padding-bottom: 6px;">
              <button class="profile-tab-btn ${this.activeTab === 'bookings' ? 'active' : ''}" onclick="ProfilePage.setTab('bookings')" style="padding: 12px 20px; font-size: 14.5px; font-weight: 700; border: none; background: ${this.activeTab === 'bookings' ? '#f59e0b' : 'transparent'}; color: ${this.activeTab === 'bookings' ? '#000000' : 'var(--text-secondary)'}; border-radius: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                Lịch Hẹn Cắt Tóc (${userBookings.length})
              </button>
              <button class="profile-tab-btn ${this.activeTab === 'orders' ? 'active' : ''}" onclick="ProfilePage.setTab('orders')" style="padding: 12px 20px; font-size: 14.5px; font-weight: 700; border: none; background: ${this.activeTab === 'orders' ? '#f59e0b' : 'transparent'}; color: ${this.activeTab === 'orders' ? '#000000' : 'var(--text-secondary)'}; border-radius: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                Đơn Hàng Mỹ Phẩm (${userOrders.length})
              </button>
              <button class="profile-tab-btn ${this.activeTab === 'gallery' ? 'active' : ''}" onclick="ProfilePage.setTab('gallery')" style="padding: 12px 20px; font-size: 14.5px; font-weight: 700; border: none; background: ${this.activeTab === 'gallery' ? '#f59e0b' : 'transparent'}; color: ${this.activeTab === 'gallery' ? '#000000' : 'var(--text-secondary)'}; border-radius: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                Thư Viện Tóc AI (${galleryItems.length})
              </button>
              <button class="profile-tab-btn ${this.activeTab === 'account' ? 'active' : ''}" onclick="ProfilePage.setTab('account')" style="padding: 12px 20px; font-size: 14.5px; font-weight: 700; border: none; background: ${this.activeTab === 'account' ? '#f59e0b' : 'transparent'}; color: ${this.activeTab === 'account' ? '#000000' : 'var(--text-secondary)'}; border-radius: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                Cài Đặt Tài Khoản
              </button>
            </div>

            <!-- 3. NỘI DUNG TỪNG TAB -->
            <div class="profile-tab-panel-container">
              ${this.renderTabBody(this.activeTab, user, userBookings, userOrders, galleryItems)}
            </div>

          </div>
        </div>
      `;
    },

    renderTabBody(tab, user, bookings, orders, gallery) {
      switch (tab) {
        case 'bookings':
          return this.renderBookingsTab(bookings);
        case 'orders':
          return this.renderOrdersTab(orders);
        case 'gallery':
          return this.renderGalleryTab(gallery);
        case 'account':
          return this.renderAccountTab(user);
        default:
          return this.renderBookingsTab(bookings);
      }
    },

    // Danh sách lịch hẹn cắt tóc
    renderBookingsTab(bookings) {
      if (!bookings || bookings.length === 0) {
        return `
          <div style="padding: 48px 20px; text-align: center; background: var(--surface-card); border-radius: 16px; border: 1px dashed var(--border-color);">
            <div style="margin-bottom: 14px; color: var(--brand-accent);"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Bạn Chưa Có Lịch Hẹn Nào!</h3>
            <p style="font-size: 14px; color: var(--text-secondary); max-width: 440px; margin: 0 auto 20px; line-height: 1.6;">
              Đặt lịch hẹn trước với Master Stylist yêu thích tại Omni Salon để trải nghiệm dịch vụ cắt tóc và uốn tạo kiểu đỉnh cao mà không phải chờ đợi.
            </p>
            <button type="button" class="btn-submit-terracotta" style="padding: 12px 28px; font-size: 14px; font-weight: 800; border-radius: 10px; background: #C59B27; color: #000;" onclick="UICommon.openBookingModal()">
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

      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">
              Lịch sử các ca hẹn đã đặt (${bookings.length} lịch):
            </div>
            <button type="button" class="btn-submit-terracotta" style="padding: 8px 16px; font-size: 13px; font-weight: 800; border-radius: 8px; background: #C59B27; color: #000;" onclick="UICommon.openBookingModal()">
              + Đặt Lịch Mới
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px;">
            ${bookings.map(b => {
              const statusInfo = window.SalonUtils ? window.SalonUtils.formatBookingStatus(b.status) : { label: b.status, cssClass: 'status-confirmed', key: 'confirmed' };
              const isCompleted = statusInfo.key === 'completed';
              const isCancelled = statusInfo.key === 'cancelled';
              const isCancellable = !isCompleted && !isCancelled;
              const branch = branchMap.get(String(b.branchId)) || {};
              const stylist = stylistMap.get(String(b.stylistId)) || {};
              const service = serviceMap.get(String(b.serviceId)) || {};
              const branchName = b.branchName || branch.name || 'Omni Salon Suite';
              const stylistName = b.stylistName || stylist.name || 'Bất kỳ Stylist';
              const serviceName = b.serviceName || service.name || 'Dịch vụ Omni Salon';
              const bCode = b.id || b.bookingCode || b.MaLichHen;
              const isPaid = (b.paymentStatus === 'Paid' || b.paymentStatus === 'PAID' || b.TrangThaiThanhToan === 'Đã thanh toán');
              const bReview = (window.store && typeof window.store.getReviewByBookingId === 'function') ? window.store.getReviewByBookingId(bCode) : null;
              const payMethodLabel = (b.paymentMethod === 'Cash' || b.paymentMethod === 'Counter_Cash' || b.paymentMethod === 'Tiền Mặt Tại Quầy') ? 'Tiền Mặt Tại Quầy' : 'VietQR';

              return `
                <div class="profile-item-card" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                      <div>
                        <strong style="font-size: 15px; font-family: monospace; color: var(--text-primary);">#${bCode}</strong>
                        <div style="font-size: 14px; font-weight: 700; color: #C59B27; margin-top: 2px;">${window.SalonUtils ? window.SalonUtils.escapeHtml(serviceName) : serviceName}</div>
                      </div>
                      <span class="status-pill-pulse ${statusInfo.cssClass}">
                        <span class="pulse-dot"></span> ${statusInfo.label}
                      </span>
                    </div>

                    <div style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 12px; background: var(--surface-elevated); padding: 10px 14px; border-radius: 10px;">
                      <div><strong style="color: var(--text-primary);">Giờ hẹn:</strong> <span style="color: #f59e0b; font-weight: 700;">${b.timeSlot}</span> (${window.SalonUtils ? window.SalonUtils.formatDate(b.date || b.bookingDate) : (b.date || b.bookingDate)})</div>
                      <div><strong style="color: var(--text-primary);">Stylist:</strong> ${window.SalonUtils ? window.SalonUtils.escapeHtml(stylistName) : stylistName}</div>
                      <div><strong style="color: var(--text-primary);">Chi nhánh:</strong> ${window.SalonUtils ? window.SalonUtils.escapeHtml(branchName) : branchName}</div>
                      <div><strong style="color: var(--text-primary);">Tổng chi phí:</strong> <strong style="color: #f59e0b;">${window.SalonUtils ? window.SalonUtils.formatCurrency(b.totalPrice || 0) : b.totalPrice}</strong></div>
                      <div><strong style="color: var(--text-primary);">Thanh toán:</strong> ${payMethodLabel} • <strong style="color: ${isPaid ? '#10B981' : '#f59e0b'};">${isPaid ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}</strong></div>
                    </div>

                    ${isCancelled ? `
                      <div style="font-size: 12px; color: #ef4444; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 6px 10px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <span><strong>Lý do hủy:</strong> ${window.SalonUtils ? window.SalonUtils.escapeHtml(b.LyDoHuy || b.cancelReason || '[Hệ Thống] Tự động hủy qua 12h đêm do khách không đến theo lịch hẹn.') : (b.LyDoHuy || b.cancelReason || '[Hệ Thống] Tự động hủy qua 12h đêm do khách không đến theo lịch hẹn.')}</span>
                      </div>
                    ` : ''}

                    ${bReview ? `
                      <div style="font-size: 12.5px; color: var(--text-secondary); padding: 8px 12px; background: rgba(245, 158, 11, 0.08); border-radius: 8px; margin-bottom: 12px;">
                        <span style="color: #f59e0b;">${'★'.repeat(bReview.rating || 5)}${'☆'.repeat(5 - (bReview.rating || 5))}</span>
                        <span style="margin-left: 6px; font-style: italic;">"${bReview.comment || 'Rất hài lòng'}"</span>
                      </div>
                    ` : ''}
                  </div>

                  <!-- Nút thao tác -->
                  <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; padding-top: 10px; border-top: 1px solid var(--border-color);">
                    <button type="button" class="pill-btn-outline" style="font-size: 12px; padding: 5px 12px;" onclick="CustomerWeb.showTicketQr('${b.id}')">
                      Xem Vé QR
                    </button>
                    ${(!isPaid && !isCancelled) ? `
                      <button type="button" class="pill-btn-outline btn-pay" style="font-size: 12px; padding: 5px 12px; color: #10B981 !important; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" onclick="CustomerWeb.openBookingPaymentModal('${bCode}')">
                        Thanh Toán VietQR
                      </button>
                    ` : ''}
                    ${(!isCancelled) ? (bReview ? `
                      <button type="button" class="pill-btn-outline btn-review" style="font-size: 12px; padding: 5px 12px; color: #f59e0b !important; font-weight: 700; cursor: pointer;" onclick="CustomerWeb.openBookingReviewModal('${bCode}')">
                        Sửa Đánh Giá
                      </button>
                    ` : `
                      <button type="button" class="pill-btn-outline btn-review" style="font-size: 12px; padding: 5px 12px; color: #f59e0b !important; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" onclick="CustomerWeb.openBookingReviewModal('${bCode}')">
                        ⭐ Đánh Giá
                      </button>
                    `) : ''}
                    ${isCancellable ? `
                      <button type="button" class="pill-btn-outline btn-danger" style="font-size: 12px; padding: 5px 12px; color: #ef4444 !important; font-weight: 700; cursor: pointer;" onclick="CustomerWeb.cancelBookingByCustomer('${b.id}')">
                        Hủy Lịch Hẹn
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

    // Danh sách đơn hàng mỹ phẩm
    renderOrdersTab(orders) {
      if (!orders || orders.length === 0) {
        return `
          <div style="padding: 48px 20px; text-align: center; background: var(--surface-card); border-radius: 16px; border: 1px dashed var(--border-color);">
            <div style="margin-bottom: 14px; color: var(--brand-accent);"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Bạn Chưa Có Đơn Hàng Mỹ Phẩm Nào!</h3>
            <p style="font-size: 14px; color: var(--text-secondary); max-width: 440px; margin: 0 auto 20px; line-height: 1.6;">
              Khám phá ngay bộ sưu tập sáp vuốt tóc, pomade chính hãng Brosh, Hanz de Fuko và dầu dưỡng cao cấp tại Omni Salon Shop.
            </p>
            <button type="button" class="btn-submit-terracotta" style="padding: 12px 28px; font-size: 14px; font-weight: 800; border-radius: 10px; background: #C59B27; color: #000;" onclick="if(window.AppRouter) window.AppRouter.navigate('/shop'); else CustomerWeb.switchTab('shop');">
              Khám Phá Cửa Hàng Ngay
            </button>
          </div>
        `;
      }

      const products = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts() : [];
      const productMap = new Map(products.map(p => [String(p.id), p]));

      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 17px; font-weight: 800; color: var(--text-primary);">
                Lịch Sử Mua Hàng &amp; Tiến Trình Vận Chuyển
              </span>
              <span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); padding: 3px 10px; border-radius: 999px; font-size: 13px; font-weight: 800;">
                ${orders.length} đơn
              </span>
            </div>
            <button type="button" class="btn-submit-terracotta" style="padding: 10px 22px; font-size: 14px; font-weight: 800; border-radius: 10px; background: #C59B27; color: #000; cursor: pointer;" onclick="if(window.AppRouter) window.AppRouter.navigate('/shop'); else CustomerWeb.switchTab('shop');">
              + Mua Thêm Sản Phẩm
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 20px;">
            ${orders.map(o => {
              const oCode = o.id || o.orderCode || o.MaDonHang || 'DH';
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

              // Kiểm tra điều kiện: chỉ cấm hủy khi đơn đã hủy rồi
              const isCancellable = (window.SalonUtils && typeof window.SalonUtils.canCancelOrder === 'function')
                ? window.SalonUtils.canCancelOrder(o)
                : (step !== 0);
              const isDelivering = (step === 3);
              const isCompleted = (step === 4);
              const isCancelled = (step === 0);

              const items = Array.isArray(o.items) ? o.items : [];
              const hasMoreThanTwo = items.length > 2;
              const visibleItems = hasMoreThanTwo ? items.slice(0, 2) : items;
              const hiddenItems = hasMoreThanTwo ? items.slice(2) : [];
              const orderSafeId = String(oCode).replace(/[^a-zA-Z0-9_-]/g, '_');
              const rawDate = o.createdAt || o.orderDate || o.NgayDat;
              const formattedDate = rawDate ? (window.SalonUtils ? window.SalonUtils.formatDateTime(rawDate) : String(rawDate).split('T')[0]) : 'Hôm nay';
              const isPaid = (o.paymentStatus === 'Paid' || o.TrangThai === 'Đã thanh toán' || o.paymentStatus === 'PAID');
              const oReview = (window.store && window.store.getReviewByOrderId) ? window.store.getReviewByOrderId(oCode) : null;

              return `
                <div class="profile-item-card order-card-premium" style="background: var(--surface-card, #1c1c1a); border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12)); border-radius: 18px; padding: 26px 30px; box-shadow: var(--theme-shadow-elevated, 0 10px 30px rgba(0, 0, 0, 0.15)); margin-bottom: 22px;">
                  
                  <!-- Header don hang -->
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)); padding-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                      <span style="font-size: 18px; font-weight: 900; color: #f59e0b; background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(245, 158, 11, 0.35); padding: 6px 14px; border-radius: 8px; font-family: monospace; letter-spacing: 0.5px;">#${oCode}</span>
                      <span style="font-size: 14.5px; color: var(--text-secondary, #575752);">Đặt ngày: <strong style="color: var(--text-primary, #141413);">${formattedDate}</strong></span>
                    </div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                      <span style="font-size: 14px; color: var(--text-secondary, #a1a1aa); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Tổng tiền:</span>
                      <strong style="font-size: 24px; font-weight: 900; color: #f59e0b; letter-spacing: -0.5px;">${window.SalonUtils ? window.SalonUtils.formatCurrency(o.totalAmount || 0) : o.totalAmount}</strong>
                    </div>
                  </div>

                  <!-- Visual Timeline 4 Buoc -->
                  ${isCancelled ? `
                    <div style="padding: 16px 20px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; font-size: 15px; font-weight: 700; color: #ef4444; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                      <span style="display: inline-flex; align-items: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Đơn hàng đã được hủy bỏ.</span>
                    </div>
                  ` : `
                    <div class="order-status-timeline-large" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; padding: 18px 24px; background: var(--surface-elevated, rgba(255, 255, 255, 0.03)); border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)); border-radius: 14px;">
                      
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; ${step > 1 ? 'background: #10B981; color: #000;' : (step === 1 ? 'background: #f59e0b; color: #000; box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);' : 'background: var(--surface-card, #fff); border: 2px solid var(--border-color, #d4d4d8); color: var(--text-secondary, #71717a);')}">
                          ${step > 1 ? '✓' : '1'}
                        </div>
                        <span style="font-size: 14.5px; font-weight: ${step >= 1 ? '800' : '600'}; color: ${step === 1 ? '#f59e0b' : (step > 1 ? '#10B981' : 'var(--text-secondary, #71717a)')};">Chờ Xác Nhận</span>
                      </div>

                      <div style="font-size: 18px; font-weight: 900; color: ${step > 1 ? '#10B981' : 'var(--border-color, rgba(255,255,255,0.2))'};">→</div>

                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; ${step > 2 ? 'background: #10B981; color: #000;' : (step === 2 ? 'background: #f59e0b; color: #000; box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);' : 'background: var(--surface-card, #fff); border: 2px solid var(--border-color, #d4d4d8); color: var(--text-secondary, #71717a);')}">
                          ${step > 2 ? '✓' : '2'}
                        </div>
                        <span style="font-size: 14.5px; font-weight: ${step >= 2 ? '800' : '600'}; color: ${step === 2 ? '#f59e0b' : (step > 2 ? '#10B981' : 'var(--text-secondary, #71717a)')};">Đang Đóng Gói</span>
                      </div>

                      <div style="font-size: 18px; font-weight: 900; color: ${step > 2 ? '#10B981' : 'var(--border-color, rgba(255,255,255,0.2))'};">→</div>

                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; ${step > 3 ? 'background: #10B981; color: #000;' : (step === 3 ? 'background: #0284c7; color: #fff; box-shadow: 0 0 12px rgba(2, 132, 199, 0.5);' : 'background: var(--surface-card, #fff); border: 2px solid var(--border-color, #d4d4d8); color: var(--text-secondary, #71717a);')}">
                          ${step > 3 ? '✓' : '3'}
                        </div>
                        <span style="font-size: 14.5px; font-weight: ${step >= 3 ? '800' : '600'}; color: ${step === 3 ? '#0284c7' : (step > 3 ? '#10B981' : 'var(--text-secondary, #71717a)')};">Đang Giao Hàng</span>
                      </div>

                      <div style="font-size: 18px; font-weight: 900; color: ${step === 4 ? '#10B981' : 'var(--border-color, rgba(255,255,255,0.2))'};">→</div>

                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; ${step === 4 ? 'background: #10B981; color: #000; box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);' : 'background: var(--surface-card, #fff); border: 2px solid var(--border-color, #d4d4d8); color: var(--text-secondary, #71717a);'}">
                          ${step === 4 ? '✓' : '4'}
                        </div>
                        <span style="font-size: 14.5px; font-weight: ${step === 4 ? '800' : '600'}; color: ${step === 4 ? '#10B981' : 'var(--text-secondary, #71717a)'};">Hoàn Tất</span>
                      </div>

                    </div>
                  `}

                  <!-- Danh sach mon hang -->
                  <div style="background: var(--surface-elevated, rgba(255, 255, 255, 0.02)); border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)); border-radius: 14px; padding: 20px 24px; margin-bottom: 20px;">
                    <div style="font-size: 13.5px; font-weight: 800; color: var(--text-secondary, #575752); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                      SẢN PHẨM TRONG ĐƠN:
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                      ${visibleItems.map((it, idx) => {
                        const prod = productMap.get(String(it.productId || it.id)) || {};
                        const itName = it.name || prod.name || it.TenSanPham || 'Mỹ phẩm';
                        const itQty = it.qty || it.quantity || 1;
                        const itPrice = it.price || it.unitPrice || prod.price || 0;
                        const showBorder = hasMoreThanTwo || (idx < visibleItems.length - 1);
                        return `
                          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; ${showBorder ? 'border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));' : ''}">
                            <div style="display: flex; align-items: center; gap: 10px;">
                              <span style="font-size: 16px; font-weight: 700; color: var(--text-primary, #141413);">• ${window.SalonUtils ? window.SalonUtils.escapeHtml(itName) : itName}</span>
                              <span style="background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 6px; padding: 2px 8px; font-size: 13px; font-weight: 800;">× ${itQty}</span>
                            </div>
                            <strong style="font-size: 16.5px; font-weight: 800; color: #f59e0b;">${window.SalonUtils ? window.SalonUtils.formatCurrency(itPrice * itQty) : (itPrice * itQty)}</strong>
                          </div>
                        `;
                      }).join('')}

                      ${hasMoreThanTwo ? `
                        <div id="orderItemsExtra_${orderSafeId}" style="display: none; flex-direction: column; gap: 10px;">
                          ${hiddenItems.map((it, idx) => {
                            const prod = productMap.get(String(it.productId || it.id)) || {};
                            const itName = it.name || prod.name || it.TenSanPham || 'Mỹ phẩm';
                            const itQty = it.qty || it.quantity || 1;
                            const itPrice = it.price || it.unitPrice || prod.price || 0;
                            const showBorder = idx < hiddenItems.length - 1;
                            return `
                              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; ${showBorder ? 'border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));' : ''}">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                  <span style="font-size: 16px; font-weight: 700; color: var(--text-primary, #141413);">• ${window.SalonUtils ? window.SalonUtils.escapeHtml(itName) : itName}</span>
                                  <span style="background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 6px; padding: 2px 8px; font-size: 13px; font-weight: 800;">× ${itQty}</span>
                                </div>
                                <strong style="font-size: 16.5px; font-weight: 800; color: #f59e0b;">${window.SalonUtils ? window.SalonUtils.formatCurrency(itPrice * itQty) : (itPrice * itQty)}</strong>
                              </div>
                            `;
                          }).join('')}
                        </div>

                        <div style="text-align: center; margin-top: 10px; padding-top: 6px;">
                          <button type="button" 
                                  id="btnToggleOrder_${orderSafeId}" 
                                  class="btn-order-toggle-items"
                                  onclick="if(window.ProfilePage && window.ProfilePage.toggleOrderItems) window.ProfilePage.toggleOrderItems('${orderSafeId}', ${items.length}); else if(window.CustomerWeb && window.CustomerWeb.toggleOrderItems) window.CustomerWeb.toggleOrderItems('${orderSafeId}', ${items.length});"
                                  style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; font-size: 13.5px; font-weight: 700; border-radius: 8px; padding: 7px 18px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s;">
                            <span id="btnToggleOrderText_${orderSafeId}">Hiển thị tất cả (${items.length} sản phẩm)</span>
                            <span id="btnToggleOrderArrow_${orderSafeId}" style="font-size: 11px;">▼</span>
                          </button>
                        </div>
                      ` : ''}
                    </div>

                    <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--border-color, rgba(255, 255, 255, 0.12)); font-size: 14.5px; color: var(--text-secondary, #575752); display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: center;">
                      <div>
                        <span>Hình thức:</span> <strong style="color: var(--text-primary, #141413); margin-left: 4px;">${o.shippingAddress || (o.deliveryType === 'PICKUP_BRANCH' ? 'Nhận tại quầy chi nhánh' : 'Giao hàng tận nơi')}</strong>
                      </div>
                      <div>
                        <span>Thanh toán:</span> <strong style="color: ${isPaid ? '#10B981' : '#f59e0b'}; margin-left: 4px;">${isPaid ? 'Đã thanh toán (VietQR)' : 'Chưa thanh toán'}</strong>
                      </div>
                    </div>
                  </div>

                  <!-- Danh gia neu co -->
                  ${oReview ? `
                    <div style="font-size: 14.5px; color: var(--text-primary, #141413); padding: 12px 18px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                      <span style="color: #f59e0b; font-size: 17px; letter-spacing: 2px;">${'★'.repeat(oReview.rating || 5)}${'☆'.repeat(5 - (oReview.rating || 5))}</span>
                      <span style="font-style: italic; color: var(--text-primary, #141413); font-weight: 500;">"${window.SalonUtils ? window.SalonUtils.escapeHtml(oReview.comment || 'Rất hài lòng') : (oReview.comment || 'Rất hài lòng')}"</span>
                    </div>
                  ` : ''}

                  <!-- Hang nut thao tac: to, ro rang, dong bo -->
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)); padding-top: 18px;">
                    <div>
                      ${isDelivering ? `
                        <span style="font-size: 13.5px; color: #0284c7; background: rgba(2, 132, 199, 0.12); border: 1px solid rgba(2, 132, 199, 0.35); padding: 8px 16px; border-radius: 10px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
                          Đơn hàng đang được vận chuyển - Không thể hủy
                        </span>
                      ` : (isCompleted ? `
                        <span style="font-size: 13.5px; color: #10B981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 8px 16px; border-radius: 10px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
                          ✓ Giao hàng thành công
                        </span>
                      ` : '')}
                    </div>

                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                      ${(!isPaid && !isCancelled) ? `
                        <button type="button" class="btn-order-action btn-pay" style="font-size: 13.5px; padding: 9px 20px; color: #10B981 !important; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; font-weight: 700; cursor: pointer; transition: all 0.2s;" onclick="CustomerWeb.openOrderPaymentModal('${oCode}')">
                          Thanh Toán VietQR
                        </button>
                      ` : ''}

                      ${(!isCancelled) ? (oReview ? `
                        <button type="button" class="btn-order-action btn-review" style="font-size: 13.5px; padding: 9px 20px; color: #f59e0b !important; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; font-weight: 700; cursor: pointer; transition: all 0.2s;" onclick="CustomerWeb.openOrderReviewModal('${oCode}')">
                          ⭐ Sửa Đánh Giá
                        </button>
                      ` : `
                        <button type="button" class="btn-order-action btn-review" style="font-size: 13.5px; padding: 9px 20px; color: #f59e0b !important; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; font-weight: 700; cursor: pointer; transition: all 0.2s;" onclick="CustomerWeb.openOrderReviewModal('${oCode}')">
                          ⭐ Đánh Giá Đơn Hàng
                        </button>
                      `) : ''}

                      ${isCancellable ? `
                        <button type="button" class="btn-order-action btn-cancel-order" style="font-size: 13.5px; padding: 9px 20px; color: #ef4444 !important; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; font-weight: 700; cursor: pointer; transition: all 0.2s;" onclick="ProfilePage.cancelOrder('${oCode}')">
                          ✕ Hủy Đơn Hàng
                        </button>
                      ` : `
                        <span style="font-size: 13.5px; color: #94a3b8; background: rgba(148, 163, 184, 0.12); border: 1px solid rgba(148, 163, 184, 0.3); padding: 8px 18px; border-radius: 10px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
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

    // Bộ sưu tập ảnh kiểu tóc AI
    renderGalleryTab(gallery) {
      if (!gallery || gallery.length === 0) {
        return `
          <div style="padding: 48px 20px; text-align: center; background: var(--surface-card); border-radius: 16px; border: 1px dashed var(--border-color);">
            <div style="margin-bottom: 14px; color: var(--brand-accent);"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg></div>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Chưa Có Kiểu Tóc Nào Trong Bộ Sưu Tập!</h3>
            <p style="font-size: 14px; color: var(--text-secondary); max-width: 440px; margin: 0 auto 20px; line-height: 1.6;">
              Trải nghiệm công nghệ AI Studio của Omni Salon: Tải ảnh chân dung của bạn lên và thử ngay 10+ kiểu tóc Fade, Mullet, Sidepart hot trend hoàn toàn miễn phí.
            </p>
            <button type="button" class="btn-submit-terracotta" style="padding: 12px 28px; font-size: 14px; font-weight: 800; border-radius: 10px; background: #C59B27; color: #000;" onclick="if(window.AppRouter) window.AppRouter.navigate('/ai-studio'); else CustomerWeb.switchTab('ai');">
              Khám Phá AI Hair Studio Ngay
            </button>
          </div>
        `;
      }

      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">
              Ảnh kiểu tóc bạn đã thử nghiệm (${gallery.length} ảnh):
            </div>
            <button type="button" class="btn-submit-terracotta" style="padding: 8px 16px; font-size: 13px; font-weight: 800; border-radius: 8px; background: #C59B27; color: #000;" onclick="if(window.AppRouter) window.AppRouter.navigate('/ai-studio'); else CustomerWeb.switchTab('ai');">
              + Thử Kiểu Tóc Mới
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
            ${gallery.map(it => `
              <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column;">
                <img src="${it.resultImage || it.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80'}" alt="Tóc AI" style="width: 100%; height: 260px; object-fit: cover;">
                <div style="padding: 14px;">
                  <strong style="font-size: 15px; color: var(--text-primary); display: block; margin-bottom: 4px;">${window.SalonUtils ? window.SalonUtils.escapeHtml(it.styleName || 'Kiểu Tóc Nam') : (it.styleName || 'Kiểu Tóc Nam')}</strong>
                  <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">Tạo ngày: ${it.date ? (window.SalonUtils ? window.SalonUtils.formatDate(it.date) : it.date) : 'Gần đây'}</div>
                  <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn-submit-terracotta" style="flex: 1; padding: 7px; font-size: 12px; font-weight: 700; border-radius: 8px;" onclick="UICommon.openBookingModal()">
                      Đặt Cắt Kiểu Này
                    </button>
                    ${it.resultImage ? `
                      <a href="${it.resultImage}" download="omni_hair_${Date.now()}.jpg" class="pill-btn-outline" style="padding: 7px 12px; font-size: 12px; font-weight: 700; text-decoration: none; display: flex; align-items: center; justify-content: center;">
                        ⬇
                      </a>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    // Cài đặt thông tin cá nhân
    renderAccountTab(user) {
      return `
        <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px; max-width: 600px;">
          <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 16px;">Thông Tin Cá Nhân</h3>
          
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Họ và tên:</label>
              <input type="text" id="profFullName" class="form-control-custom" value="${user.fullName || user.name || ''}" style="width: 100%; height: 42px;">
            </div>

            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Số điện thoại:</label>
              <input type="text" id="profPhone" class="form-control-custom" value="${user.phone || ''}" style="width: 100%; height: 42px;">
            </div>

            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">Email:</label>
              <input type="email" id="profEmail" class="form-control-custom" value="${user.email || ''}" style="width: 100%; height: 42px;">
            </div>

            <div style="margin-top: 10px; display: flex; gap: 10px;">
              <button type="button" class="btn-submit-terracotta" style="padding: 10px 24px; font-size: 13.5px; font-weight: 800; border-radius: 10px; background: #C59B27; color: #000;" onclick="ProfilePage.updateProfile()">
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      `;
    },

    updateProfile() {
      const name = document.getElementById('profFullName')?.value.trim();
      const phone = document.getElementById('profPhone')?.value.trim();
      const email = document.getElementById('profEmail')?.value.trim();

      if (!name) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập họ và tên!', 'warning');
        return;
      }

      if (window.store && typeof window.store.getCurrentUser === 'function') {
        const u = window.store.getCurrentUser();
        if (u) {
          u.fullName = name;
          u.name = name;
          if (phone) u.phone = phone;
          if (email) u.email = email;
          if (typeof window.store.setCurrentUser === 'function') window.store.setCurrentUser(u);
          if (typeof window.store.saveState === 'function') window.store.saveState();
        }
      }

      if (window.UICommon) window.UICommon.showToast('Đã cập nhật thông tin cá nhân thành công!');
      const container = document.getElementById('webMainContainer');
      if (container) this.render(container);
    },

    toggleOrderItems(orderSafeId, totalCount) {
      const extraContainer = document.getElementById('orderItemsExtra_' + orderSafeId) || document.getElementById('portalOrderItemsExtra_' + orderSafeId);
      const btnText = document.getElementById('btnToggleOrderText_' + orderSafeId) || document.getElementById('btnPortalToggleOrderText_' + orderSafeId);
      const btnArrow = document.getElementById('btnToggleOrderArrow_' + orderSafeId) || document.getElementById('btnPortalToggleOrderArrow_' + orderSafeId);
      if (!extraContainer) return;

      const isHidden = (extraContainer.style.display === 'none' || !extraContainer.style.display);
      if (isHidden) {
        extraContainer.style.display = 'flex';
        if (btnText) btnText.textContent = 'Thu gọn';
        if (btnArrow) btnArrow.textContent = '▲';
      } else {
        extraContainer.style.display = 'none';
        if (btnText) btnText.textContent = `Hiển thị tất cả (${totalCount} sản phẩm)`;
        if (btnArrow) btnArrow.textContent = '▼';
      }
    },

    cancelOrder(orderId) {
      if (!orderId) return;
      if (window.CustomerWeb && typeof window.CustomerWeb.openOrderCancelModal === 'function') {
        window.CustomerWeb.openOrderCancelModal(orderId, 'profile');
      }
    },

    handleLogout() {
      if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
        if (window.AuthEngine && typeof window.AuthEngine.logout === 'function') {
          window.AuthEngine.logout();
        } else if (window.store && typeof window.store.logout === 'function') {
          window.store.logout();
        }
        if (window.CustomerWeb) {
          window.CustomerWeb.currentTab = 'home';
          window.CustomerWeb.renderHeader();
        }
        if (window.AppRouter) {
          window.AppRouter.navigate('/');
        } else if (window.CustomerWeb) {
          window.CustomerWeb.switchTab('home');
        }
        if (window.UICommon) window.UICommon.showToast('Đã đăng xuất an toàn!');
      }
    }
  };

  window.ProfilePage = ProfilePage;
  if (typeof window.CustomerWeb !== 'undefined') {
    window.CustomerWeb.toggleOrderItems = ProfilePage.toggleOrderItems;
  }

})(window);

