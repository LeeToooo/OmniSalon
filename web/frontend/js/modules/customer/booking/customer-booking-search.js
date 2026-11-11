(function (window) {
  'use strict';

  const CustomerBookingSearch = {
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
     * Kiểm tra người dùng có quyền quản trị/nhân viên hay không
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
     * Tìm kiếm danh sách lịch hẹn theo số điện thoại hoặc mã lịch hẹn
     */
    _findBookings(query) {
      // Safe delegated call to _findBookings
      if (window.CustomerUtils && typeof window.CustomerUtils._findBookings === "function") { return window.CustomerUtils._findBookings(query); }
      if (window.CustomerUtils && typeof window.CustomerUtils._findBookings === 'function') {
        return window.CustomerUtils._findBookings(query);
      }
      if (!query) return [];
      if (window.store && typeof window.store.getBookingByPhoneOrId === 'function') {
        const res = window.store.getBookingByPhoneOrId(query);
        if (res && res.length > 0) return res;
      }
      const all = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      const clean = String(query).toLowerCase().replace('#', '').trim();
      return all.filter(b =>
        (b.customerPhone && b.customerPhone.trim() === String(query).trim()) ||
        (b.customerPhone && b.customerPhone.includes(clean)) ||
        (b.id && b.id.toLowerCase().replace('#', '') === clean) ||
        (b.id && b.id.toLowerCase().includes(clean)) ||
        (b.bookingCode && b.bookingCode.toLowerCase().replace('#', '') === clean) ||
        (b.bookingCode && b.bookingCode.toLowerCase().includes(clean)) ||
        (b.MaLichHen && b.MaLichHen.toLowerCase().includes(clean))
      );
    },

    /**
     * Tra cứu chi tiết lịch hẹn cắt tóc theo SĐT hoặc mã lịch hẹn
     */
    searchBookingLookup() {
      const input = document.getElementById('lookupSearchInput');
      const container = document.getElementById('lookupResultsContainer');
      if (!input || !container) return;

      const self = this || CustomerBookingSearch;
      const getUser = (self && typeof self.getCurrentUser === 'function')
        ? self.getCurrentUser.bind(self)
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function')
          ? window.CustomerWeb.getCurrentUser.bind(window.CustomerWeb)
          : () => null;

      const checkAdmin = (self && typeof self.isAdminUser === 'function')
        ? self.isAdminUser.bind(self)
        : (window.CustomerWeb && typeof window.CustomerWeb.isAdminUser === 'function')
          ? window.CustomerWeb.isAdminUser.bind(window.CustomerWeb)
          : () => false;

      const escapeFn = (self && typeof self.escapeHtml === 'function')
        ? self.escapeHtml.bind(self)
        : (window.CustomerWeb && typeof window.CustomerWeb.escapeHtml === 'function')
          ? window.CustomerWeb.escapeHtml.bind(window.CustomerWeb)
          : (str) => (typeof str !== 'string' ? (str == null ? '' : String(str)) : str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

      const findBookingsFn = (self && typeof self._findBookings === 'function')
        ? self._findBookings.bind(self)
        : (window.CustomerWeb && typeof window.CustomerWeb._findBookings === 'function')
          ? window.CustomerWeb._findBookings.bind(window.CustomerWeb)
          : (q) => [];

      const user = getUser();
      const isAdmin = checkAdmin(user);
      const isCustomer = user && !isAdmin;

      // Nếu là khách hàng thì bắt buộc chỉ tra cứu theo SĐT của chính mình
      const query = isCustomer ? (user.phone || '').trim() : input.value.trim();
      if (!isCustomer && (!query || query.length < 3)) {
        container.innerHTML = `
          <div style="padding: 32px 20px; text-align: center; background: var(--surface-elevated); border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="font-size: 32px; margin-bottom: 12px;">📅</div>
            <div style="font-size: 16px; font-weight: 700; color: #f59e0b; margin-bottom: 8px;">Tra Cứu Lịch Hẹn Cắt Tóc</div>
            <div style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; max-width: 420px; margin: 0 auto 16px;">
              Vui lòng nhập <strong>Số điện thoại</strong> của bạn vào ô tìm kiếm ở trên để tra cứu chi tiết lịch hẹn và stylist phục vụ.
            </div>
            <div>
              <button class="btn-submit-terracotta" style="padding: 10px 24px; font-size: 13.5px; font-weight: 800; border-radius: 10px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
                + Đặt Lịch Hẹn Ngay
              </button>
            </div>
          </div>
        `;
        return;
      }

      let matches = findBookingsFn(query);

      // Bảo mật riêng tư: Khách hàng chỉ xem lịch của chính mình
      if (isCustomer) {
        matches = matches.filter(b => (b.customerPhone && b.customerPhone.trim() === user.phone.trim()) || b.userId === user.id);
      }

      if (!matches || matches.length === 0) {
        container.innerHTML = `
          <div style="padding: 28px 20px; text-align: center; background: var(--surface-elevated); border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="font-size: 15px; font-weight: 700; color: #f59e0b; margin-bottom: 6px;">
              ${isCustomer ? 'Quý khách chưa có lịch hẹn nào tại Omni Salon.' : `Không tìm thấy lịch hẹn nào khớp với "${escapeFn(query)}".`}
            </div>
            <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">
              ${isCustomer ? 'Hãy bấm đặt lịch bên dưới để chọn stylist tay kéo vàng và khung giờ phù hợp nhất.' : 'Quý khách vui lòng kiểm tra lại số điện thoại hoặc bấm nút bên dưới để đặt lịch hẹn mới.'}
            </div>
            <div>
              <button class="btn-submit-terracotta" style="padding: 10px 24px; font-size: 13.5px; font-weight: 800; border-radius: 10px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
                + Đặt Lịch Hẹn Ngay
              </button>
            </div>
          </div>
        `;
        return;
      }

      // Eager loading map lookups O(1)
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const branchMap = new Map(branches.map(b => [String(b.id), b]));
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const stylistMap = new Map(stylists.map(s => [String(s.id), s]));
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const serviceMap = new Map(services.map(s => [String(s.id), s]));

      container.innerHTML = `
        <div style="font-size: 12px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px;">
          ${isCustomer ? `Lịch hẹn của bạn (${matches.length} lịch):` : `Tìm thấy ${matches.length} lịch hẹn:`}
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
          ${matches.map(b => {
        const isUserLoggedIn = !!(user && (user.id || user.phone));
        const statusInfo = (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatBookingStatus === 'function')
          ? SalonUtils.formatBookingStatus(b.status)
          : { key: b.status || '', label: b.status || '', cssClass: '' };
        const isCompleted = statusInfo.key === 'completed';
        const isCancelled = statusInfo.key === 'cancelled';
        const isCancellable = !isCompleted && !isCancelled;
        const branch = branchMap.get(String(b.branchId)) || {};
        const stylist = stylistMap.get(String(b.stylistId)) || {};
        const service = serviceMap.get(String(b.serviceId)) || {};
        const branchName = b.branchName || branch.name || 'Omni Salon Suite';
        const stylistName = b.stylistName || stylist.name || 'Bất kỳ';
        const serviceName = b.serviceName || service.name || 'Cắt Tóc';
        const bCode = b.id || b.bookingCode || b.MaLichHen;
        const isPaid = (b.paymentStatus === 'Paid' || b.paymentStatus === 'PAID' || b.TrangThaiThanhToan === 'Đã thanh toán');
        const bReview = (window.store && typeof window.store.getReviewByBookingId === 'function') ? window.store.getReviewByBookingId(bCode) : null;
        const payMethodLabel = (b.paymentMethod === 'Cash' || b.paymentMethod === 'Counter_Cash' || b.paymentMethod === 'Tiền Mặt Tại Quầy') ? 'Tiền Mặt Tại Quầy' : 'VietQR';

        const fmtDate = (d) => (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatDate === 'function' ? SalonUtils.formatDate(d) : (d || ''));
        const fmtCurr = (c) => (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatCurrency === 'function' ? SalonUtils.formatCurrency(c) : `${c} đ`);
        const maskPhone = (p) => (typeof SalonUtils !== 'undefined' && typeof SalonUtils.maskPhone === 'function' ? SalonUtils.maskPhone(p) : (p || ''));

        if (isCompleted) {
          return `
            <div class="lookup-card-result completed-booking-card" style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 16px; opacity: 0.95;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 14px; font-weight: 800; color: var(--text-primary); font-family: monospace;">
                  #${escapeFn(bCode)}
                </span>
                <span class="status-pill-pulse ${statusInfo.cssClass}" style="font-size: 11px; padding: 2px 8px;">
                  <span class="pulse-dot"></span> ${statusInfo.label}
                </span>
              </div>
              <div style="font-size: 12.5px; line-height: 1.6; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div><strong style="color: var(--text-primary);">Dịch vụ:</strong> ${escapeFn(serviceName)}</div>
                <div><strong style="color: var(--text-primary);">Giờ hẹn:</strong> <span style="color: var(--brand-accent); font-weight: 700;">${b.timeSlot} | ${fmtDate(b.date || b.bookingDate)}</span></div>
                <div><strong style="color: var(--text-primary);">Chi nhánh:</strong> ${escapeFn(branchName)}</div>
                <div><strong style="color: var(--text-primary);">Chi phí:</strong> <strong style="color: var(--brand-accent);">${fmtCurr(b.totalPrice || 0)}</strong></div>
                <div style="grid-column: 1 / -1;"><strong style="color: var(--text-primary);">Thanh toán:</strong> <strong>${payMethodLabel}</strong> • Trạng thái: <strong style="color: ${isPaid ? '#16a34a' : '#ea580c'};">${isPaid ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}</strong></div>
              </div>
              <!-- Đánh giá lịch hẹn -->
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color); font-size: 12px;">
                ${bReview ? `
                  <span style="color: #f59e0b; font-size: 13px;">${'★'.repeat(bReview.rating || 5)}${'☆'.repeat(5 - (bReview.rating || 5))}</span>
                  <span style="color: var(--text-secondary); font-size: 12px; margin-left: 6px; font-style: italic;">"${escapeFn(bReview.comment || 'Rất hài lòng')}"</span>
                ` : `
                  <span style="color: var(--text-secondary);">Bạn đã trải nghiệm dịch vụ? Hãy để lại đánh giá cho Omni Salon nhé!</span>
                `}
              </div>
              <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="CustomerWeb.showTicketQr('${b.id}')">
                  Xem Vé QR
                </button>
                ${(!isPaid) ? `
                  <button type="button" class="pill-btn-outline btn-pay" style="font-size: 11px; padding: 4px 10px; color: #10b981 !important; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                          onclick="CustomerWeb.openBookingPaymentModal('${escapeFn(bCode)}')">
                    💳 Thanh Toán VietQR
                  </button>
                ` : ''}
                ${bReview ? `
                  <button type="button" class="pill-btn-outline btn-review" style="font-size: 11px; padding: 4px 10px; color: #f59e0b !important; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                          onclick="CustomerWeb.openBookingReviewModal('${escapeFn(bCode)}')">
                    ⭐ Sửa Đánh Giá
                  </button>
                ` : `
                  <button type="button" class="pill-btn-outline btn-review" style="font-size: 11px; padding: 4px 10px; color: #f59e0b !important; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                          onclick="CustomerWeb.openBookingReviewModal('${escapeFn(bCode)}')">
                    ⭐ Đánh Giá Lịch Hẹn
                  </button>
                `}
                <button type="button" class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px; color: var(--brand-accent); border-color: rgba(217, 119, 6, 0.4); display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
                  + Đặt Lại Lịch
                </button>
              </div>
            </div>
          `;
        }

        return `
              <div class="lookup-card-result" style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); font-family: monospace;">
                    #${escapeFn(bCode)}
                  </span>
                  <span class="status-pill-pulse ${statusInfo.cssClass}">
                    <span class="pulse-dot"></span> ${statusInfo.label}
                  </span>
                </div>
                <div style="font-size: 13px; line-height: 1.6; color: var(--text-secondary);">
                  <div><strong style="color: var(--text-primary);">Dịch vụ:</strong> ${escapeFn(serviceName)}</div>
                  <div><strong style="color: var(--text-primary);">Chi nhánh:</strong> ${escapeFn(branchName)}</div>
                  <div><strong style="color: var(--text-primary);">Master Stylist:</strong> ${escapeFn(stylistName)}</div>
                  <div><strong style="color: var(--text-primary);">Giờ hẹn:</strong> <span style="color: var(--brand-accent); font-weight: 800;">${b.timeSlot} | ${fmtDate(b.date || b.bookingDate)}</span></div>
                  <div><strong style="color: var(--text-primary);">Khách hàng:</strong> ${escapeFn(b.customerName)} (<span data-phone="${escapeFn(b.customerPhone)}">${escapeFn(maskPhone(b.customerPhone))}</span>)</div>
                  <div><strong style="color: var(--text-primary);">Chi phí:</strong> <strong style="color: var(--brand-accent);">${fmtCurr(b.totalPrice || 0)}</strong></div>
                  <div><strong style="color: var(--text-primary);">Thanh toán:</strong> <strong>${payMethodLabel}</strong> • Trạng thái: <strong style="color: ${isPaid ? '#16a34a' : '#ea580c'};">${isPaid ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}</strong></div>
                </div>

                <!-- Khối đánh giá dịch vụ -->
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color); font-size: 12px;">
                  ${bReview ? `
                    <span style="color: #f59e0b; font-size: 13px;">${'★'.repeat(bReview.rating || 5)}${'☆'.repeat(5 - (bReview.rating || 5))}</span>
                    <span style="color: var(--text-secondary); font-size: 12px; margin-left: 6px; font-style: italic;">"${escapeFn(bReview.comment || 'Rất hài lòng')}"</span>
                  ` : `
                    <span style="color: var(--text-secondary);">Bạn đã trải nghiệm dịch vụ? Hãy để lại đánh giá cho Omni Salon nhé!</span>
                  `}
                </div>

                <div style="margin-top: 14px; display: flex; gap: 8px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                  <button class="pill-btn-outline" style="font-size: 11px; padding: 6px 14px;" onclick="CustomerWeb.showTicketQr('${b.id}')">
                    Xem Vé QR
                  </button>
                  ${(!isPaid && !isCancelled) ? `
                    <button type="button" class="pill-btn-outline btn-pay" style="font-size: 11px; padding: 5px 12px; color: #10b981 !important; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                            onclick="CustomerWeb.openBookingPaymentModal('${escapeFn(bCode)}')">
                      💳 Thanh Toán VietQR
                    </button>
                  ` : ''}
                  ${(!isCancelled) ? (bReview ? `
                    <button type="button" class="pill-btn-outline btn-review" style="font-size: 11px; padding: 5px 12px; color: #f59e0b !important; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                            onclick="CustomerWeb.openBookingReviewModal('${escapeFn(bCode)}')">
                      ⭐ Sửa Đánh Giá
                    </button>
                  ` : `
                    <button type="button" class="pill-btn-outline btn-review" style="font-size: 11px; padding: 5px 12px; color: #f59e0b !important; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                            onclick="CustomerWeb.openBookingReviewModal('${escapeFn(bCode)}')">
                      ⭐ Đánh Giá Lịch Hẹn
                    </button>
                  `) : ''}
                  ${isCancellable ? (
            isUserLoggedIn ? `
                      <button type="button" class="pill-btn-outline btn-danger" style="font-size: 11px; padding: 5px 12px; color: #ef4444 !important; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; cursor: pointer;" 
                              onclick="CustomerWeb.openBookingCancelModal('${b.id}')">
                        ✕ Hủy Lịch Hẹn
                      </button>
                    ` : `
                      <button type="button" class="pill-btn-outline" style="font-size: 11px; padding: 5px 12px; color: #94a3b8; border-color: rgba(148, 163, 184, 0.4); display: inline-flex; align-items: center; gap: 4px; font-weight: 600; cursor: pointer;" 
                              onclick="CustomerWeb.promptLoginToCancelOrder('${b.id}')">
                        🔒 Đăng nhập để hủy lịch
                      </button>
                    `
          ) : ''}
                </div>
              </div>
            `;
      }).join('')}
        </div>
      `;
    },

    /**
     * Khách hàng kích hoạt hủy lịch hẹn
     */
    cancelBookingByCustomer(bookingId) {
      if (typeof this.openBookingCancelModal === 'function') {
        this.openBookingCancelModal(bookingId);
      } else if (window.CustomerWeb && typeof window.CustomerWeb.openBookingCancelModal === 'function') {
        window.CustomerWeb.openBookingCancelModal(bookingId);
      }
    },

    /**
     * Nhắc khách đăng nhập tài khoản trước khi thực hiện hủy lịch hẹn
     */
    promptLoginToCancelBooking(bookingId) {
      if (window.UICommon) {
        window.UICommon.showToast('Vui lòng đăng nhập tài khoản để thực hiện hủy lịch hẹn', 'warning');
        if (typeof window.UICommon.openAuthModal === 'function') {
          window.UICommon.openAuthModal('login');
        }
      }
    },

    /**
     * Alias hỗ trợ tương thích với các lệnh gọi promptLoginToCancelOrder trên thẻ kết quả
     */
    promptLoginToCancelOrder(orderId) {
      this.promptLoginToCancelBooking(orderId);
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerBookingSearch = CustomerBookingSearch;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerBookingSearch);
  }

})(typeof window !== 'undefined' ? window : this);

