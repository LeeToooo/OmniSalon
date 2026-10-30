// Trang thông tin cá nhân khách hàng /profile (5 tab: lịch hẹn, đơn hàng, tóc AI, điểm thưởng, cài đặt)

(function (window) {
  'use strict';

  const ProfilePage = {
    activeTab: 'bookings',

    setTab(tab) {
      this.activeTab = tab;
      const container = document.getElementById('webMainContainer');
      if (container) {
        this.render(container);
      }
    },

    render(container, params = {}) {
      if (!container) return;

      if (params && params.tab) {
        this.activeTab = params.tab;
      }

      const user = (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function')
        ? window.CustomerWeb.getCurrentUser()
        : ((window.store && typeof window.store.getCurrentUser === 'function') ? window.store.getCurrentUser() : null);

      // Nếu chưa đăng nhập, hiển thị màn hình yêu cầu đăng nhập thân thiện
      if (!user) {
        container.innerHTML = `
          <div class="profile-page-shell" style="background-color: var(--bg-primary); min-height: 80vh; padding: 60px 20px; display: flex; align-items: center; justify-content: center;">
            <div style="max-width: 480px; width: 100%; text-align: center; background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 40px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
              <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(197, 155, 39, 0.15); border: 2px solid #C59B27; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px;">
                👤
              </div>
              <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0 0 10px;">Tài Khoản Omni Salon</h2>
              <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">
                Đăng nhập để theo dõi trạng thái lịch hẹn cắt tóc, quản lý đơn hàng mỹ phẩm, xem bộ sưu tập tóc AI và tích lũy điểm thưởng thành viên.
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

      // Tính điểm thưởng và hạng
      const points = user.points || user.loyaltyPoints || 100;
      let tierName = 'Thành Viên Bạc';
      let tierColor = '#94a3b8';
      let tierBadgeBg = 'rgba(148, 163, 184, 0.15)';
      if (points >= 500) {
        tierName = 'Thành Viên Kim Cương';
        tierColor = '#38bdf8';
        tierBadgeBg = 'rgba(56, 189, 248, 0.15)';
      } else if (points >= 200) {
        tierName = 'Thành Viên Vàng VIP';
        tierColor = '#C59B27';
        tierBadgeBg = 'rgba(197, 155, 39, 0.15)';
      }

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
                  <div style="width: 76px; height: 76px; border-radius: 50%; background: linear-gradient(135deg, #F59E0B 0%, #B45309 100%); color: #000; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 900; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); border: 2px solid #FFFFFF;">
                    ${avatarInitials}
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                      <h1 style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin: 0;">
                        ${window.SalonUtils ? window.SalonUtils.escapeHtml(user.fullName || user.name || user.username) : (user.fullName || user.name)}
                      </h1>
                      <span style="font-size: 11.5px; font-weight: 700; color: ${tierColor}; background: ${tierBadgeBg}; border: 1px solid ${tierColor}; padding: 3px 10px; border-radius: 20px; text-transform: uppercase;">
                        ${tierName}
                      </span>
                    </div>
                    <div style="font-size: 13.5px; color: var(--text-secondary); display: flex; gap: 16px; flex-wrap: wrap;">
                      <span>📞 ${user.phone || 'Chưa cập nhật SĐT'}</span>
                      <span>✉️ ${user.email || 'khachhang@omnisalon.vn'}</span>
                    </div>
                  </div>
                </div>

                <!-- Thống kê nhanh & Nút thao tác -->
                <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
                  <div style="display: flex; gap: 20px; text-align: center; background: var(--surface-elevated); padding: 12px 20px; border-radius: 14px; border: 1px solid var(--border-color);">
                    <div>
                      <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Điểm Thưởng</div>
                      <div style="font-size: 20px; font-weight: 900; color: #f59e0b; margin-top: 2px;">${points} pts</div>
                    </div>
                    <div style="width: 1px; background: var(--border-color);"></div>
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

              <!-- Banner Quản Trị Viên (Nếu là Admin) -->
              ${isAdmin ? `
                <div style="margin-top: 20px; padding: 14px 20px; background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">⚡</span>
                    <div>
                      <strong style="color: #f59e0b; font-size: 14px;">TRUNG TÂM QUẢN TRỊ SALON</strong>
                      <div style="font-size: 12.5px; color: var(--text-secondary);">Bạn đang đăng nhập với quyền Quản trị viên Omni Salon.</div>
                    </div>
                  </div>
                  <button type="button" class="btn-submit-terracotta" style="padding: 8px 18px; font-size: 13px; font-weight: 800; background: #f59e0b; color: #000; border-radius: 8px;" onclick="if(window.AppRouter) window.AppRouter.navigate('/admin'); else CustomerWeb.switchTab('admin');">
                    Vào Bảng Điều Khiển Quản Trị →
                  </button>
                </div>
              ` : ''}
            </div>

            <!-- 2. NAVIGATION TABS TRANG PROFILE -->
            <div class="profile-nav-tabs" style="display: flex; gap: 10px; border-bottom: 2px solid var(--border-color); margin-bottom: 24px; overflow-x: auto; padding-bottom: 6px;">
              <button class="profile-tab-btn ${this.activeTab === 'bookings' ? 'active' : ''}" onclick="ProfilePage.setTab('bookings')" style="padding: 12px 20px; font-size: 14.5px; font-weight: 700; border: none; background: ${this.activeTab === 'bookings' ? '#f59e0b' : 'transparent'}; color: ${this.activeTab === 'bookings' ? '#000000' : 'var(--text-secondary)'}; border-radius: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                📅 Lịch Hẹn Cắt Tóc (${userBookings.length})
              </button>
              <button class="profile-tab-btn ${this.activeTab === 'orders' ? 'active' : ''}" onclick="ProfilePage.setTab('orders')" style="padding: 12px 20px; font-size: 14.5px; font-weight: 700; border: none; background: ${this.activeTab === 'orders' ? '#f59e0b' : 'transparent'}; color: ${this.activeTab === 'orders' ? '#000000' : 'var(--text-secondary)'}; border-radius: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                📦 Đơn Hàng Mỹ Phẩm (${userOrders.length})
              </button>
              <button class="profile-tab-btn ${this.activeTab === 'gallery' ? 'active' : ''}" onclick="ProfilePage.setTab('gallery')" style="padding: 12px 20px; font-size: 14.5px; font-weight: 700; border: none; background: ${this.activeTab === 'gallery' ? '#f59e0b' : 'transparent'}; color: ${this.activeTab === 'gallery' ? '#000000' : 'var(--text-secondary)'}; border-radius: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                ✂️ Thư Viện Tóc AI (${galleryItems.length})
              </button>
              <button class="profile-tab-btn ${this.activeTab === 'rewards' ? 'active' : ''}" onclick="ProfilePage.setTab('rewards')" style="padding: 12px 20px; font-size: 14.5px; font-weight: 700; border: none; background: ${this.activeTab === 'rewards' ? '#f59e0b' : 'transparent'}; color: ${this.activeTab === 'rewards' ? '#000000' : 'var(--text-secondary)'}; border-radius: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                🎁 Điểm &amp; Hạng Thành Viên
              </button>
              <button class="profile-tab-btn ${this.activeTab === 'account' ? 'active' : ''}" onclick="ProfilePage.setTab('account')" style="padding: 12px 20px; font-size: 14.5px; font-weight: 700; border: none; background: ${this.activeTab === 'account' ? '#f59e0b' : 'transparent'}; color: ${this.activeTab === 'account' ? '#000000' : 'var(--text-secondary)'}; border-radius: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                ⚙️ Cài Đặt Tài Khoản
              </button>
            </div>

            <!-- 3. NỘI DUNG TỪNG TAB -->
            <div class="profile-tab-panel-container">
              ${this.renderTabBody(this.activeTab, user, userBookings, userOrders, galleryItems, points, tierName)}
            </div>

          </div>
        </div>
      `;
    },

    renderTabBody(tab, user, bookings, orders, gallery, points, tierName) {
      switch (tab) {
        case 'bookings':
          return this.renderBookingsTab(bookings);
        case 'orders':
          return this.renderOrdersTab(orders);
        case 'gallery':
          return this.renderGalleryTab(gallery);
        case 'rewards':
          return this.renderRewardsTab(user, points, tierName);
        case 'account':
          return this.renderAccountTab(user);
        default:
          return this.renderBookingsTab(bookings);
      }
    },

    // -------------------------------------------------------------
    // 1. Danh sách lịch hẹn cắt tóc
    // -------------------------------------------------------------
    renderBookingsTab(bookings) {
      if (!bookings || bookings.length === 0) {
        return `
          <div style="padding: 48px 20px; text-align: center; background: var(--surface-card); border-radius: 16px; border: 1px dashed var(--border-color);">
            <div style="font-size: 40px; margin-bottom: 12px;">📅</div>
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
                      <button type="button" class="btn-submit-terracotta" style="font-size: 12px; padding: 5px 14px; background: #10B981;" onclick="CustomerWeb.openBookingPaymentModal('${bCode}')">
                        💳 Thanh Toán VietQR
                      </button>
                    ` : ''}
                    ${(!isCancelled) ? (bReview ? `
                      <button type="button" class="pill-btn-outline" style="font-size: 12px; padding: 5px 12px; color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);" onclick="CustomerWeb.openBookingReviewModal('${bCode}')">
                        Sửa Đánh Giá
                      </button>
                    ` : `
                      <button type="button" class="btn-submit-terracotta" style="font-size: 12px; padding: 5px 12px; background: #d97706;" onclick="CustomerWeb.openBookingReviewModal('${bCode}')">
                        ⭐ Đánh Giá
                      </button>
                    `) : ''}
                    ${isCancellable ? `
                      <button type="button" class="pill-btn-outline" style="font-size: 12px; padding: 5px 12px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="CustomerWeb.cancelBookingByCustomer('${b.id}')">
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

    // -------------------------------------------------------------
    // 2. Danh sách đơn hàng mỹ phẩm
    // -------------------------------------------------------------
    renderOrdersTab(orders) {
      if (!orders || orders.length === 0) {
        return `
          <div style="padding: 48px 20px; text-align: center; background: var(--surface-card); border-radius: 16px; border: 1px dashed var(--border-color);">
            <div style="font-size: 40px; margin-bottom: 12px;">📦</div>
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
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">
              Lịch sử mua hàng &amp; Tiến trình vận chuyển (${orders.length} đơn):
            </div>
            <button type="button" class="btn-submit-terracotta" style="padding: 8px 16px; font-size: 13px; font-weight: 800; border-radius: 8px; background: #C59B27; color: #000;" onclick="if(window.AppRouter) window.AppRouter.navigate('/shop'); else CustomerWeb.switchTab('shop');">
              + Mua Thêm Sản Phẩm
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
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

              // Kiểm tra điều kiện: chỉ cho hủy khi đơn chưa giao
              const isCancellable = (window.SalonUtils && typeof window.SalonUtils.canCancelOrder === 'function')
                ? window.SalonUtils.canCancelOrder(o)
                : (step === 1 || step === 2);
              const isDelivering = (step === 3);
              const isCompleted = (step === 4);
              const isCancelled = (step === 0);

              const items = Array.isArray(o.items) ? o.items : [];
              const rawDate = o.createdAt || o.orderDate || o.NgayDat;
              const formattedDate = rawDate ? (window.SalonUtils ? window.SalonUtils.formatDateTime(rawDate) : String(rawDate).split('T')[0]) : 'Hôm nay';
              const isPaid = (o.paymentStatus === 'Paid' || o.TrangThai === 'Đã thanh toán' || o.paymentStatus === 'PAID');
              const oReview = (window.store && window.store.getReviewByOrderId) ? window.store.getReviewByOrderId(oCode) : null;

              return `
                <div class="profile-item-card" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px;">
                  
                  <!-- Header đơn hàng -->
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                    <div>
                      <span style="font-size: 16px; font-weight: 800; color: var(--text-primary); font-family: monospace;">#${oCode}</span>
                      <span style="font-size: 13px; color: var(--text-secondary); margin-left: 10px;">Đặt ngày: <strong>${formattedDate}</strong></span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="font-size: 13px; color: var(--text-secondary);">Tổng tiền:</span>
                      <strong style="font-size: 17px; color: #C59B27;">${window.SalonUtils ? window.SalonUtils.formatCurrency(o.totalAmount || 0) : o.totalAmount}</strong>
                    </div>
                  </div>

                  <!-- Visual Timeline 4 Bước -->
                  ${isCancelled ? `
                    <div style="padding: 10px 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; font-size: 13px; font-weight: 700; color: #ef4444; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                      <span>❌</span> Đơn hàng đã được hủy bỏ.
                    </div>
                  ` : `
                    <div class="order-status-timeline" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding: 10px 16px; background: var(--surface-elevated); border-radius: 10px; font-size: 12.5px;">
                      <span style="font-weight: ${step >= 1 ? '800' : '500'}; color: ${step === 1 ? '#ea580c' : (step > 1 ? '#10B981' : 'var(--text-secondary)')}; display: inline-flex; align-items: center; gap: 4px;">
                        ${step > 1 ? '✓' : '①'} Chờ Xác Nhận
                      </span>
                      <span style="color: ${step > 1 ? '#10B981' : 'var(--border-color)'}; font-weight: 700;">→</span>
                      <span style="font-weight: ${step >= 2 ? '800' : '500'}; color: ${step === 2 ? '#ea580c' : (step > 2 ? '#10B981' : 'var(--text-secondary)')}; display: inline-flex; align-items: center; gap: 4px;">
                        ${step > 2 ? '✓' : '②'} Đang Đóng Gói
                      </span>
                      <span style="color: ${step > 2 ? '#10B981' : 'var(--border-color)'}; font-weight: 700;">→</span>
                      <span style="font-weight: ${step >= 3 ? '800' : '500'}; color: ${step === 3 ? '#0284c7' : (step > 3 ? '#10B981' : 'var(--text-secondary)')}; display: inline-flex; align-items: center; gap: 4px;">
                        ${step > 3 ? '✓' : '③'} Đang Giao Hàng
                      </span>
                      <span style="color: ${step > 3 ? '#10B981' : 'var(--border-color)'}; font-weight: 700;">→</span>
                      <span style="font-weight: ${step === 4 ? '800' : '500'}; color: ${step === 4 ? '#10B981' : 'var(--text-secondary)'}; display: inline-flex; align-items: center; gap: 4px;">
                        ${step === 4 ? '✓' : '④'} Hoàn Tất
                      </span>
                    </div>
                  `}

                  <!-- Danh sách món hàng -->
                  <div style="background: var(--surface-elevated); border-radius: 10px; padding: 12px 16px; margin-bottom: 12px;">
                    <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Sản phẩm trong đơn:</div>
                    ${items.map(it => {
                      const prod = productMap.get(String(it.productId || it.id)) || {};
                      const itName = it.name || prod.name || it.TenSanPham || 'Mỹ phẩm';
                      const itQty = it.qty || it.quantity || 1;
                      const itPrice = it.price || it.unitPrice || prod.price || 0;
                      return `
                        <div style="display: flex; justify-content: space-between; font-size: 13px; line-height: 1.8;">
                          <span>• ${window.SalonUtils ? window.SalonUtils.escapeHtml(itName) : itName} <strong>× ${itQty}</strong></span>
                          <strong style="color: #C59B27;">${window.SalonUtils ? window.SalonUtils.formatCurrency(itPrice * itQty) : (itPrice * itQty)}</strong>
                        </div>
                      `;
                    }).join('')}
                    <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed var(--border-color); font-size: 12.5px; color: var(--text-secondary);">
                      Hình thức: <strong>${o.shippingAddress || (o.deliveryType === 'PICKUP_BRANCH' ? 'Nhận tại quầy chi nhánh' : 'Giao hàng tận nơi')}</strong> • Thanh toán: <strong>${isPaid ? 'Đã thanh toán (VietQR)' : 'Chưa thanh toán'}</strong>
                    </div>
                  </div>

                  <!-- Đánh giá nếu có -->
                  ${oReview ? `
                    <div style="font-size: 12.5px; color: var(--text-secondary); padding: 8px 12px; background: rgba(245, 158, 11, 0.08); border-radius: 8px; margin-bottom: 12px;">
                      <span style="color: #f59e0b;">${'★'.repeat(oReview.rating || 5)}${'☆'.repeat(5 - (oReview.rating || 5))}</span>
                      <span style="margin-left: 6px; font-style: italic;">"${oReview.comment || 'Rất hài lòng'}"</span>
                    </div>
                  ` : ''}

                  <!-- HÀNG NÚT THAO TÁC ĐỒNG BỘ: HỦY ĐƠN HÀNG, THANH TOÁN, ĐÁNH GIÁ -->
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                    <div>
                      ${isDelivering ? `
                        <span style="font-size: 12px; color: #0284c7; background: rgba(2, 132, 199, 0.1); border: 1px solid rgba(2, 132, 199, 0.3); padding: 5px 10px; border-radius: 8px; font-weight: 600;">
                          🚚 Đơn hàng đang được vận chuyển - Không thể hủy
                        </span>
                      ` : (isCompleted ? `
                        <span style="font-size: 12px; color: #10B981; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 5px 10px; border-radius: 8px; font-weight: 600;">
                          ✓ Giao hàng thành công
                        </span>
                      ` : '')}
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                      ${(!isPaid && !isCancelled) ? `
                        <button type="button" class="btn-submit-terracotta" style="font-size: 12px; padding: 6px 14px; background: #10B981;" onclick="CustomerWeb.openOrderPaymentModal('${oCode}')">
                          💳 Thanh Toán VietQR
                        </button>
                      ` : ''}

                      ${(!isCancelled) ? (oReview ? `
                        <button type="button" class="pill-btn-outline" style="font-size: 12px; padding: 5px 12px; color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);" onclick="CustomerWeb.openOrderReviewModal('${oCode}')">
                          Sửa Đánh Giá
                        </button>
                      ` : `
                        <button type="button" class="btn-submit-terracotta" style="font-size: 12px; padding: 6px 14px; background: #d97706;" onclick="CustomerWeb.openOrderReviewModal('${oCode}')">
                          ⭐ Đánh Giá Đơn Hàng
                        </button>
                      `) : ''}

                      <!-- NÚT HỦY ĐƠN HÀNG THEO RÀNG BUỘC NGHIỆP VỤ -->
                      ${isCancellable ? `
                        <button type="button" class="pill-btn-outline" style="font-size: 12px; padding: 5px 12px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4); font-weight: 700;" onclick="ProfilePage.cancelOrder('${oCode}')">
                          Hủy Đơn Hàng
                        </button>
                      ` : ''}
                    </div>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    // -------------------------------------------------------------
    // 3. Bộ sưu tập ảnh kiểu tóc AI
    // -------------------------------------------------------------
    renderGalleryTab(gallery) {
      if (!gallery || gallery.length === 0) {
        return `
          <div style="padding: 48px 20px; text-align: center; background: var(--surface-card); border-radius: 16px; border: 1px dashed var(--border-color);">
            <div style="font-size: 40px; margin-bottom: 12px;">✂️</div>
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

    // -------------------------------------------------------------
    // 4. Tích điểm và hạng thành viên
    // -------------------------------------------------------------
    renderRewardsTab(user, points, tierName) {
      return `
        <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px;">
          <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 8px;">Chính Sách Khách Hàng Thân Thiết (Omni Loyalty)</h3>
          <p style="font-size: 14px; color: var(--text-secondary); margin: 0 0 24px; line-height: 1.6;">
            Tích lũy điểm thưởng với mỗi lần đặt lịch cắt tóc (50 điểm/lần) hoặc mua sản phẩm mỹ phẩm chính hãng (10 điểm trên mỗi 100.000đ).
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 28px;">
            <div style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px;">
              <span style="font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Hạng Bạc (0 - 199 pts)</span>
              <h4 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 6px 0 10px;">Ưu Đãi Cơ Bản</h4>
              <ul style="font-size: 13px; color: var(--text-secondary); margin: 0; padding-left: 18px; line-height: 1.8;">
                <li>Tích điểm 5% giá trị mỗi hóa đơn</li>
                <li>Tặng suất sấy tạo kiểu miễn phí vào tháng sinh nhật</li>
                <li>Được ưu tiên giữ chỗ trước 15 phút</li>
              </ul>
            </div>

            <div style="background: var(--surface-elevated); border: 2px solid #C59B27; border-radius: 12px; padding: 20px;">
              <span style="font-size: 12px; font-weight: 800; color: #C59B27; text-transform: uppercase;">Hạng Vàng VIP (200 - 499 pts)</span>
              <h4 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 6px 0 10px;">Đặc Quyền Hội Viên Vàng</h4>
              <ul style="font-size: 13px; color: var(--text-secondary); margin: 0; padding-left: 18px; line-height: 1.8;">
                <li>Giảm ngay 10% cho mọi dòng sáp vuốt và mỹ phẩm</li>
                <li>Tặng gói gội massage thư giãn da đầu mỗi lần cắt tóc</li>
                <li>Phục vụ nước uống welcome drink cao cấp</li>
              </ul>
            </div>

            <div style="background: var(--surface-elevated); border: 1px solid #38bdf8; border-radius: 12px; padding: 20px;">
              <span style="font-size: 12px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Hạng Kim Cương (500+ pts)</span>
              <h4 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 6px 0 10px;">Đẳng Cấp Thượng Lưu</h4>
              <ul style="font-size: 13px; color: var(--text-secondary); margin: 0; padding-left: 18px; line-height: 1.8;">
                <li>Giảm 15% trọn đời dịch vụ và sản phẩm</li>
                <li>Chỉ định Master Stylist / Top Stylist không phụ phí</li>
                <li>Hộp quà tri ân mỹ phẩm độc quyền cuối năm</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    },

    // -------------------------------------------------------------
    // 5. Cài đặt thông tin cá nhân
    // -------------------------------------------------------------
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

    cancelOrder(orderId) {
      if (!orderId) return;
      const reason = prompt(`Vui lòng nhập lý do hủy đơn hàng #${orderId}:`, 'Tôi muốn thay đổi địa chỉ hoặc sản phẩm');
      if (reason === null) return;
      const cleanReason = reason.trim();
      if (!cleanReason || cleanReason.length < 3) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng cung cấp lý do hủy cụ thể (tối thiểu 3 ký tự)', 'warning');
        return;
      }

      if (window.store && typeof window.store.cancelOrder === 'function') {
        window.store.cancelOrder(orderId, cleanReason).then(res => {
          if (res && res.success) {
            if (window.UICommon) window.UICommon.showToast(res.message || `Đã hủy đơn hàng #${orderId} thành công!`);
            const container = document.getElementById('webMainContainer');
            if (container) this.render(container);
          } else {
            if (window.UICommon) window.UICommon.showToast(res?.error || 'Lỗi khi hủy đơn hàng!', 'error');
          }
        });
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

})(window);

