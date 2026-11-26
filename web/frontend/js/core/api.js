(function (window) {
  'use strict';

  const SalonApi = {
    config: {
      baseUrl: (typeof location !== 'undefined' && location.port === '3000') ? `${location.origin}/api` : 'http://localhost:3000/api',
      useLiveApi: true, // Tự động kết nối Live Database Server thời gian thực
      timeoutMs: 30000
    },

    // Http client helper
    _getHeaders(customHeaders = {}) {
      const authHeader = (window.Auth && typeof window.Auth.getAuthHeader === 'function')
        ? window.Auth.getAuthHeader()
        : {};
      return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeader,
        ...customHeaders
      };
    },

    _enforceRole(allowedRoles, actionName = 'thao tác quản trị') {
      const user = (window.Auth && typeof window.Auth.getCurrentUser === 'function') ? window.Auth.getCurrentUser() : null;
      if (!user || !window.Auth.hasRole(allowedRoles)) {
        if (window.UICommon && typeof window.UICommon.showToast === 'function') {
          window.UICommon.showToast(`Bạn không có quyền ${actionName}.`, 'error');
        }
        return false;
      }
      return true;
    },

    _enforceOwnershipOrStaff(booking, actionName = 'thao tác lịch hẹn') {
      const user = (window.Auth && typeof window.Auth.getCurrentUser === 'function') ? window.Auth.getCurrentUser() : null;
      if (!user) return false;
      if (window.Auth.hasRole(['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'BARBER', 'STYLIST', 'STAFF'])) {
        return true;
      }
      const ownerId = booking?.customerId || booking?.MaKhachHang || booking?.userId;
      return Boolean(ownerId && window.Auth.canAccessResource(ownerId));
    },

    async _request(endpoint, options = {}) {
      if (!this.config.useLiveApi) return null; // Kích hoạt Store fallback
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
        const res = await fetch(`${this.config.baseUrl}${endpoint}`, {
          ...options,
          headers: this._getHeaders(options.headers),
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          if (errData) return errData;
          return { success: false, message: `Máy chủ trả về mã lỗi ${res.status}` };
        }
        return await res.json();
      } catch (err) {
        console.warn(`[SalonApi] Live API call to ${endpoint} failed:`, err.message);
        return { success: false, message: `Lỗi kết nối máy chủ: ${err.message}` };
      }
    },

    async _fetch(endpoint, options = {}) {
      const url = `${this.config.baseUrl}${endpoint}`;
      const res = await fetch(url, {
        ...options,
        headers: this._getHeaders(options.headers)
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          message: (data && (data.message || data.error)) || `Máy chủ trả về mã lỗi ${res.status}`,
          ...(data && typeof data === 'object' ? data : {})
        };
      }
      return data || {};
    },

    // Module 1: Xác Thực & Người Dùng
    async sendOtp(email, purpose = 'REGISTER') {
      try {
        const live = await this._request('/auth/send-otp', {
          method: 'POST',
          body: JSON.stringify({ email, purpose })
        });
        if (live) return live;
      } catch (e) {
        return { success: false, message: `Không thể kết nối máy chủ gửi OTP: ${e.message}` };
      }
      return { success: false, message: 'Dịch vụ gửi mã xác nhận chưa sẵn sàng.' };
    },

    async verifyOtp(email, otp, purpose = 'REGISTER') {
      const live = await this._request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp, purpose })
      });
      if (live) return live;
      return { success: false, message: 'Dịch vụ xác thực chưa sẵn sàng.' };
    },

    async register(userData) {
      const live = await this._request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
      if (live && live.success && live.user && live.token) {
        if (window.Auth && typeof window.Auth.setSessionFromBackend === 'function') {
          window.Auth.setSessionFromBackend(live.user, live.token);
        }
      }
      return live || { success: false, message: 'Không thể kết nối máy chủ đăng ký.' };
    },

    async resetPassword(resetData) {
      const live = await this._request('/auth/reset-password', { method: 'POST', body: JSON.stringify(resetData) });
      return live || { success: false, message: 'Không thể kết nối máy chủ đặt lại mật khẩu.' };
    },

    async login(identifier, password) {
      const live = await this._request('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) });
      if (live && live.success) {
        if (window.Auth && typeof window.Auth.setSessionFromBackend === 'function') {
          window.Auth.setSessionFromBackend(live.user, live.token);
        }
      }
      return live || { success: false, message: 'Không thể kết nối máy chủ đăng nhập.' };
    },

    async refreshToken(refreshTokenStr) {
      if (this.config.useLiveApi) {
        const live = await this._request('/auth/refresh-token', { method: 'POST', body: JSON.stringify({ refreshToken: refreshTokenStr }) });
        if (live) return live;
      }
      if (window.Auth && typeof window.Auth.refreshSession === 'function') {
        const success = window.Auth.refreshSession(refreshTokenStr);
        return { success, user: window.Auth.getCurrentUser(), token: window.Auth.getToken() };
      }
      return { success: false };
    },

    async getCurrentUser() {
      if (this.config.useLiveApi) {
        const live = await this._request('/auth/me');
        if (live) return live;
      }
      return window.Auth ? window.Auth.getCurrentUser() : null;
    },

    async updateProfile(updates) {
      if (this.config.useLiveApi) {
        const live = await this._request('/auth/profile', { method: 'PUT', body: JSON.stringify(updates) });
        if (live) return live;
      }
      if (window.Auth && typeof window.Auth.updateProfile === 'function') {
        return window.Auth.updateProfile(updates);
      }
      return { success: false, message: 'Không thể cập nhật hồ sơ.' };
    },

    async logout() {
      if (this.config.useLiveApi) {
        await this._request('/auth/logout', { method: 'POST' });
      }
      if (window.Auth && typeof window.Auth.logout === 'function') {
        return window.Auth.logout();
      }
      return { success: true };
    },

    async getUsers() {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xem danh sách người dùng');
      if (this.config.useLiveApi) {
        const live = await this._request('/users');
        if (live) return live;
      }
      return window.SalonStore ? window.SalonStore.getUsers() : [];
    },

    // Module 2: Chi Nhánh & Đội Ngũ Thợ
    async getBranches() {
      const live = await this._request('/branches');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getBranches() : [];
    },

    async getBranchById(id) {
      const live = await this._request(`/branches/${id}`);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getBranchById(id) : null;
    },

    async createBranch(branchData) {
      this._enforceRole(['SUPER_ADMIN'], 'thêm chi nhánh');
      const live = await this._request('/branches', { method: 'POST', body: JSON.stringify(branchData) });
      if (live && live.branch) return live.branch;
      return window.SalonStore ? window.SalonStore.addBranch(branchData) : null;
    },

    async updateBranch(id, branchData) {
      this._enforceRole(['SUPER_ADMIN'], 'cập nhật chi nhánh');
      const live = await this._request(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(branchData) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.updateBranch(id, branchData) : null;
    },

    async deleteBranch(id) {
      this._enforceRole(['SUPER_ADMIN'], 'xóa chi nhánh');
      const live = await this._request(`/branches/${id}`, { method: 'DELETE' });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.deleteBranch(id) : false;
    },

    async getStylists(branchId = null) {
      const endpoint = branchId ? `/stylists?branch_id=${branchId}` : '/stylists';
      const live = await this._request(endpoint);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getStylists(branchId) : [];
    },

    async getStylistById(id) {
      const live = await this._request(`/stylists/${id}`);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getStylistById(id) : null;
    },

    async getStylistSchedule(stylistId, date) {
      const live = await this._request(`/stylists/${stylistId}/schedule?date=${date}`);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getAvailableSlots(date, stylistId) : [];
    },

    async getTodayQueue(stylistId) {
      const live = await this._request(`/stylists/${stylistId}/today-queue`);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getStylistQueue(stylistId) : [];
    },

    async createStylist(stylistData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'thêm nhân sự thợ');
      const live = await this._request('/stylists', { method: 'POST', body: JSON.stringify(stylistData) });
      if (live && live.stylist) return live.stylist;
      return window.SalonStore ? window.SalonStore.addStylist(stylistData) : null;
    },

    async updateStylist(id, stylistData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'cập nhật thông tin thợ');
      const live = await this._request(`/stylists/${id}`, { method: 'PUT', body: JSON.stringify(stylistData) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.updateStylist(id, stylistData) : null;
    },

    async deleteStylist(id) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xóa thợ khỏi hệ thống');
      const live = await this._request(`/stylists/${id}`, { method: 'DELETE' });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.deleteStylist(id) : false;
    },

    // Module 3: Dịch Vụ & Gói Combo VIP
    async getServices(category = null) {
      const endpoint = category ? `/services?category=${category}` : '/services';
      const live = await this._request(endpoint);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getServices(category) : [];
    },

    async getServiceById(id) {
      const live = await this._request(`/services/${id}`);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getServiceById(id) : null;
    },

    async createService(serviceData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'thêm dịch vụ');
      const live = await this._request('/services', { method: 'POST', body: JSON.stringify(serviceData) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.addService(serviceData) : null;
    },

    async updateService(id, serviceData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'cập nhật dịch vụ');
      const live = await this._request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(serviceData) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.updateService(id, serviceData) : null;
    },

    async deleteService(id) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xóa dịch vụ');
      const live = await this._request(`/services/${id}`, { method: 'DELETE' });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.deleteService(id) : false;
    },

    async getCombos() {
      const live = await this._request('/combos');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getCombos() : [];
    },

    async getComboById(id) {
      const live = await this._request(`/combos/${id}`);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getComboById(id) : null;
    },

    async createCombo(comboData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'thêm gói combo');
      const live = await this._request('/combos', { method: 'POST', body: JSON.stringify(comboData) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.addCombo(comboData) : null;
    },

    async updateCombo(id, comboData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'cập nhật gói combo');
      const live = await this._request(`/combos/${id}`, { method: 'PUT', body: JSON.stringify(comboData) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.updateCombo(id, comboData) : null;
    },

    async deleteCombo(id) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xóa gói combo');
      const live = await this._request(`/combos/${id}`, { method: 'DELETE' });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.deleteCombo(id) : false;
    },

    // Module 4: Đặt Lịch & Điều Phối Ca
    async getAvailableSlots(date, stylistId, branchId = null, durationMinutes = 45) {
      const live = await this._request(`/bookings/available-slots?date=${date}&stylistId=${stylistId}&branchId=${branchId}&duration=${durationMinutes}`);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getAvailableSlots(date, stylistId, branchId, durationMinutes) : [];
    },

    async createBooking(bookingData) {
      const live = await this._request('/bookings', { method: 'POST', body: JSON.stringify(bookingData) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.addBooking(bookingData) : { success: true };
    },

    async lookupBooking(query) {
      const live = await this._request(`/bookings/lookup?q=${encodeURIComponent(query)}`);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getBookingByPhoneOrId(query) : [];
    },

    async getMyBookings() {
      const user = window.Auth ? window.Auth.getCurrentUser() : null;
      if (!user) return [];
      const live = await this._request('/bookings/my-history');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getBookings(null, user.id) : [];
    },

    async updateBookingStatus(bookingId, status, extraData = {}) {
      if (window.SalonStore) {
        const b = (window.SalonStore.state.bookings || []).find(it => it.id === bookingId || it.bookingCode === bookingId);
        if (b) {
          const user = (typeof window !== 'undefined' && window.Auth && typeof window.Auth.getCurrentUser === 'function') ? window.Auth.getCurrentUser() : null;
          // Cập nhật trạng thái lịch hẹn mượt mà
          this._enforceOwnershipOrStaff(b, `cập nhật trạng thái [${status}]`);
        }
      }
      const live = await this._request(`/bookings/${bookingId}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...extraData }) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.updateBookingStatus(bookingId, status, extraData) : false;
    },

    async checkinBooking(bookingId) {
      if (window.SalonStore) {
        const b = (window.SalonStore.state.bookings || []).find(it => it.id === bookingId || it.bookingCode === bookingId);
        if (b) this._enforceOwnershipOrStaff(b, 'check-in');
      }
      const live = await this._request(`/bookings/${bookingId}/checkin`, { method: 'POST' });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.checkinBooking(bookingId) : false;
    },

    async cancelBooking(bookingId, reason = '') {
      if (window.SalonStore) {
        const b = (window.SalonStore.state.bookings || []).find(it => it.id === bookingId || it.bookingCode === bookingId);
        if (b) this._enforceOwnershipOrStaff(b, 'hủy lịch hẹn');
      }
      const live = await this._request(`/bookings/${bookingId}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.cancelBooking(bookingId, reason) : false;
    },

    // Module 5: Sản Phẩm
    async getProducts(section = null) {
      const endpoint = section ? `/products?section=${section}` : '/products';
      const live = await this._request(endpoint);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getProducts(section) : [];
    },

    async getProductById(id) {
      const live = await this._request(`/products/${id}`);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getProductById(id) : null;
    },

    async createProduct(productData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'thêm sản phẩm');
      const live = await this._request('/products', { method: 'POST', body: JSON.stringify(productData) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.addProduct(productData) : null;
    },

    async updateProduct(id, productData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'cập nhật sản phẩm');
      const live = await this._request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.updateProduct(id, productData) : null;
    },

    async deleteProduct(id) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xóa sản phẩm');
      const live = await this._request(`/products/${id}`, { method: 'DELETE' });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.deleteProduct(id) : false;
    },

    async getInventory(branchId = null) {
      const endpoint = branchId ? `/inventory?branch_id=${branchId}` : '/inventory';
      const live = await this._request(endpoint);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getBranchInventory(branchId) : [];
    },

    async updateStock(invId, newStock) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'điều chỉnh kho hàng');
      const live = await this._request(`/inventory/${invId}/stock`, { method: 'PUT', body: JSON.stringify({ stock: newStock }) });
      if (live) return live;
      return window.SalonStore ? window.SalonStore.updateProductStock(invId, newStock) : false;
    },

    async createOrder(orderData) {
      const live = await this._request('/orders', { method: 'POST', body: JSON.stringify(orderData) });
      if (live) return live;
      return window.SalonStore ? await window.SalonStore.createOrder(orderData) : { success: true };
    },

    async createPosCheckout(posData) {
      const live = await this._request('/pos/checkout', { method: 'POST', body: JSON.stringify(posData) });
      if (live) return live;
      return window.SalonStore ? await window.SalonStore.createPosOrder(posData) : { success: true };
    },

    async getMyOrders() {
      const user = window.Auth ? window.Auth.getCurrentUser() : null;
      if (!user) return [];
      const live = await this._request('/orders/my-orders');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getOrders(user.id) : [];
    },

    // Module 6: Báo Cáo Thống Kê & Audit
    async getRevenueOverview(branchId = null) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xem báo cáo doanh thu');
      const endpoint = branchId ? `/analytics/revenue?branch_id=${branchId}` : '/analytics/revenue';
      const live = await this._request(endpoint);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getRevenueAnalytics(branchId) : {};
    },

    async getStylistCommissions(stylistId) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER', 'STYLIST'], 'xem hoa hồng thợ');
      const live = await this._request(`/analytics/stylists/${stylistId}/commissions`);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getStylistCommissions(stylistId) : {};
    },

    async getAuditLogs() {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xem nhật ký kiểm toán');
      const live = await this._request('/audit/logs');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getAuditLogs() : [];
    },

    // Module 8: Warehouse
    // Nhà Cung Cấp, NhaCungCap
    async getSuppliers() {
      const live = await this._request('/suppliers');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getSuppliers() : [];
    },

    async createSupplier(supplierData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'thêm nhà cung cấp');
      return await this._request('/suppliers', { method: 'POST', body: JSON.stringify(supplierData) });
    },

    async updateSupplier(supplierId, updates) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'cập nhật nhà cung cấp');
      return await this._request(`/suppliers/${supplierId}`, { method: 'PUT', body: JSON.stringify(updates) });
    },

    async deleteSupplier(supplierId) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xóa nhà cung cấp');
      return await this._request(`/suppliers/${supplierId}`, { method: 'DELETE' });
    },

    // Quy Tắc Giảm Giá Cận Hạn, QuyTacGiamGiaTheoHan
    async getDiscountRules() {
      const live = await this._request('/inventory/discount-rules');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getDiscountRules() : [];
    },

    async saveDiscountRule(ruleData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'lưu quy tắc giảm giá hạn sử dụng');
      return await this._request('/inventory/discount-rules', { method: 'POST', body: JSON.stringify(ruleData) });
    },

    async deleteDiscountRule(ruleId) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xóa quy tắc giảm giá');
      return await this._request(`/inventory/discount-rules/${ruleId}`, { method: 'DELETE' });
    },

    // Phiếu Nhập Kho, PhieuNhapKho & ChiTietPhieuNhap
    async getReceipts(branchId = null) {
      const endpoint = branchId ? `/inventory/receipts?branch_id=${branchId}` : '/inventory/receipts';
      const live = await this._request(endpoint);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getReceipts(branchId) : [];
    },

    async getReceiptDetail(receiptId) {
      return await this._request(`/inventory/receipts/${receiptId}`);
    },

    async createReceipt(receiptData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER', 'STYLIST', 'STAFF'], 'tạo phiếu nhập kho');
      return await this._request('/inventory/receipts', { method: 'POST', body: JSON.stringify(receiptData) });
    },

    async updateReceiptStatus(receiptId, status, approverId = null, rejectReason = null) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'duyệt phiếu nhập kho');
      return await this._request(`/inventory/receipts/${receiptId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, approverId, rejectReason })
      });
    },

    // Hóa Đơn & Lịch Sử Giao Dịch, HoaDon, ChiTietHoaDon_DichVu, ChiTietHoaDon_SanPham, ThanhToan
    async getInvoices(branchId = null) {
      const endpoint = branchId ? `/invoices?branch_id=${branchId}` : '/invoices';
      const live = await this._request(endpoint);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getInvoices(branchId) : [];
    },

    async getInvoiceDetail(invoiceId) {
      return await this._request(`/invoices/${invoiceId}`);
    },

    async getPayments() {
      const live = await this._request('/payments');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getPayments() : [];
    },

    // Views FEFO & Cảnh Báo Tồn Thấp, vw_GiaBanTheoLoHienTai, vw_SanPhamCanhBaoTonThap
    async getFefoLots(branchId = null) {
      const endpoint = branchId ? `/inventory/lots?branch_id=${branchId}` : '/inventory/lots';
      const live = await this._request(endpoint);
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getFefoLots(branchId) : [];
    },

    async getLowStockWarnings() {
      const live = await this._request('/inventory/low-stock');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getLowStockWarnings() : [];
    },

    // Danh Mục Sản Phẩm, DanhMucSanPham
    async getCategories() {
      const live = await this._request('/categories');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getCategories() : [];
    },

    async createCategory(categoryData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'thêm danh mục sản phẩm');
      return await this._request('/categories', { method: 'POST', body: JSON.stringify(categoryData) });
    },

    async updateCategory(categoryId, updates) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'cập nhật danh mục sản phẩm');
      return await this._request(`/categories/${categoryId}`, { method: 'PUT', body: JSON.stringify(updates) });
    },

    async deleteCategory(categoryId) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xóa danh mục sản phẩm');
      return await this._request(`/categories/${categoryId}`, { method: 'DELETE' });
    },

    // Khuyến Mãi, KhuyenMai, KhuyenMai_DichVu, KhuyenMai_SanPham
    async getPromotions() {
      const live = await this._request('/promotions');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getPromotions() : [];
    },

    async savePromotion(promoData) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'lưu chương trình khuyến mãi');
      return await this._request('/promotions', { method: 'POST', body: JSON.stringify(promoData) });
    },

    async deletePromotion(promoId) {
      this._enforceRole(['SUPER_ADMIN', 'BRANCH_MANAGER'], 'xóa chương trình khuyến mãi');
      return await this._request(`/promotions/${promoId}`, { method: 'DELETE' });
    },

    // Thông Báo Hệ Thống, ThongBao
    async getNotifications(userId = null) {
      const live = await this._request('/notifications');
      if (live) return live;
      return window.SalonStore ? window.SalonStore.getNotifications(userId) : [];
    },

    async createNotification(notifData) {
      return await this._request('/notifications', { method: 'POST', body: JSON.stringify(notifData) });
    },

    async markNotificationAsRead(notifId) {
      return await this._request(`/notifications/${notifId}/read`, { method: 'PUT' });
    },

    async deleteNotification(notifId) {
      return await this._request(`/notifications/${notifId}`, { method: 'DELETE' });
    }
  };

  window.SalonApi = SalonApi;
  window.api = SalonApi;

})(typeof window !== 'undefined' ? window : this);

