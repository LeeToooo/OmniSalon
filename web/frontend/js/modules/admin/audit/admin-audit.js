(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  Object.assign(window.AdminWeb, {
    switchAuditSubTab(type) {
      this.auditSubTab = type;
      this.auditSearchQuery = '';
      this.auditActionFilter = 'all';
      this.auditRoleFilter = 'all';
      this.auditOperatorRoleFilter = 'all';
      this.auditLogRoleFilter = 'all';
      this.auditBranchFilter = 'all';
      this.auditPaymentStatusFilter = 'all';
      this.auditOrderStatusFilter = 'all';
      this.auditNotifStatusFilter = 'all';
      this.auditReviewStarFilter = 'all';
      this.auditReviewStatusFilter = 'all';
      this.auditReviewTypeFilter = 'all';
      this.selectedAuditRowId = null;
      this.auditPage = 1;
      if (type === 'reviews') {
        this.fetchAdminReviews(true);
      }
      this.refreshAuditView();
    },

    handleAuditSearch(val) {
      this.auditSearchQuery = val;
      this.auditPage = 1;
      const clearBtn = document.getElementById('adminAuditSearchClear');
      if (clearBtn) clearBtn.style.display = val ? 'inline-flex' : 'none';
      this._updateAuditContentOnly();
    },

    clearAuditSearch() {
      this.auditSearchQuery = '';
      this.auditPage = 1;
      const inp = document.getElementById('adminAuditSearchInput');
      if (inp) {
        inp.value = '';
        inp.focus();
      }
      const clearBtn = document.getElementById('adminAuditSearchClear');
      if (clearBtn) clearBtn.style.display = 'none';
      this._updateAuditContentOnly();
    },

    getUserRoleCode(u) {
      if (!u) return 'CUSTOMER';
      const role = (u.role || '').toString().trim().toUpperCase();
      const rawRole = (u.VaiTro || u.vaiTro || u.vaiTroSql || '').toString().trim().toUpperCase();
      const chucVu = (u.ChucVu || u.chucVuSql || '').toString().trim().toUpperCase();
      const maNV = (u.MaNhanVien || u.staffId || '').toString().trim().toUpperCase();
      const maTK = (u.id || u.MaTaiKhoan || '').toString().trim().toUpperCase();
      const username = (u.username || u.TenDangNhap || '').toString().trim().toUpperCase();

      // 1. Quản trị viên tối cao: Duy nhất tài khoản root quản trị ban đầu
      if (
        maTK === 'TK_ADMIN' || username === 'ADMIN' || maNV === 'NV00' ||
        ((role === 'SUPER_ADMIN' || rawRole === 'SUPER_ADMIN') && (maTK === 'TK_ADMIN' || username === 'ADMIN'))
      ) {
        return 'SUPER_ADMIN';
      }

      // 2. Khách hàng: Ưu tiên nhận diện CUSTOMER nếu được chỉ định hoặc không có mã nhân viên
      if (
        role === 'CUSTOMER' ||
        rawRole === 'KHÁCH HÀNG' || rawRole === 'KHACH HANG' || rawRole === 'CUSTOMER' ||
        chucVu === 'KHÁCH HÀNG' || chucVu === 'KHACH HANG' ||
        (!maNV && Boolean(u.MaKhachHang))
      ) {
        return 'CUSTOMER';
      }

      // 3. Quản lý chi nhánh (BRANCH_MANAGER)
      if (
        role === 'BRANCH_MANAGER' ||
        rawRole === 'BRANCH_MANAGER' ||
        rawRole.includes('QUẢN LÝ') || rawRole.includes('QUAN LY') ||
        chucVu.includes('QUẢN LÝ') || chucVu.includes('QUAN LY') || chucVu.includes('BRANCH_MANAGER')
      ) {
        return 'BRANCH_MANAGER';
      }

      // 4. Thu ngân POS (CASHIER)
      if (
        role === 'CASHIER' ||
        rawRole === 'CASHIER' ||
        rawRole.includes('THU NGÂN') || rawRole.includes('THU NGAN') ||
        chucVu.includes('THU NGÂN') || chucVu.includes('THU NGAN') || chucVu.includes('TIẾP TÂN') || chucVu.includes('TIEP TAN') || chucVu.includes('CASHIER')
      ) {
        return 'CASHIER';
      }

      // 5. Thợ / Barber / Stylist / Nhân viên (BARBER)
      if (
        role === 'BARBER' || role === 'STYLIST' || role === 'STAFF' ||
        rawRole === 'BARBER' || rawRole === 'STYLIST' || rawRole === 'STAFF' ||
        rawRole.includes('THỢ') || rawRole.includes('THO') || rawRole.includes('BARBER') || rawRole.includes('STYLIST') ||
        rawRole.includes('NHÂN VIÊN') || rawRole.includes('NHAN VIEN') ||
        chucVu.includes('THỢ') || chucVu.includes('THO') || chucVu.includes('BARBER') || chucVu.includes('STYLIST') ||
        chucVu.includes('KỸ THUẬT') || chucVu.includes('KY THUAT') ||
        chucVu.includes('NHÂN VIÊN') || chucVu.includes('NHAN VIEN') ||
        Boolean(maNV)
      ) {
        return 'BARBER';
      }

      // 6. Mặc định là Khách hàng
      return 'CUSTOMER';
    },

    _isInvoicePaid(inv) {
      if (!inv) return false;
      if (inv.isPaid === true) return true;
      const st = String(inv.status || inv.TrangThai || '').toLowerCase();
      const pSt = String(inv.paymentStatus || '').toLowerCase();
      return pSt === 'paid' || st.includes('đã thanh toán') || st.includes('paid') || st.includes('hoàn tất') || st.includes('thành công') || inv.TrangThai === 'Đã thanh toán';
    },

    _extractAuditOperatorRole(log) {
      if (!log) return 'SYSTEM';
      if (log.operatorRole) {
        const opR = String(log.operatorRole).trim().toUpperCase();
        if (opR.includes('BRANCH_MANAGER') || opR.includes('QUẢN LÝ') || opR.includes('MANAGER')) return 'BRANCH_MANAGER';
        if (opR.includes('CASHIER') || opR.includes('THU NGÂN') || opR.includes('TIẾP TÂN')) return 'CASHIER';
        if (opR.includes('SUPER_ADMIN') || opR.includes('ADMIN') || opR.includes('QUẢN TRỊ')) return 'SUPER_ADMIN';
        if (opR.includes('BARBER') || opR.includes('STYLIST') || opR.includes('THỢ') || opR.includes('STAFF') || opR.includes('NHÂN VIÊN') || opR.includes('NHAN VIEN')) return 'STYLIST';
        if (opR.includes('CUSTOMER') || opR.includes('KHÁCH')) return 'CUSTOMER';
        if (opR.includes('SYSTEM') || opR.includes('HỆ THỐNG')) return 'SYSTEM';
        return opR;
      }
      const str = String(log.operatorName || log.operator || '').toUpperCase();
      if (!str || str.includes('HỆ THỐNG') || str.includes('SYSTEM')) return 'SYSTEM';
      if (str.includes('BRANCH_MANAGER') || str.includes('QUẢN LÝ') || str.includes('MANAGER')) return 'BRANCH_MANAGER';
      if (str.includes('CASHIER') || str.includes('THU NGÂN') || str.includes('TIẾP TÂN')) return 'CASHIER';
      if (str.includes('SUPER_ADMIN') || str.includes('ADMIN') || str.includes('QUẢN TRỊ') || str.includes('NV00') || str.includes('TK_ADMIN')) return 'SUPER_ADMIN';
      if (str.includes('BARBER') || str.includes('STYLIST') || str.includes('THỢ') || str.includes('STAFF') || str.includes('NHÂN VIÊN') || str.includes('NHAN VIEN')) return 'STYLIST';
      if (str.includes('CUSTOMER') || str.includes('KHÁCH')) return 'CUSTOMER';
      return 'SYSTEM';
    },

    _getAuditRoleBadge(role) {
      const r = String(role || 'SYSTEM').toUpperCase();
      switch (r) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
          return { label: 'SUPER_ADMIN', text: 'Quản Trị Viên', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)' };
        case 'BRANCH_MANAGER':
          return { label: 'BRANCH_MANAGER', text: 'Quản Lý Chi Nhánh', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)', border: 'rgba(37, 99, 235, 0.35)' };
        case 'CASHIER':
          return { label: 'CASHIER', text: 'Thu Ngân', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' };
        case 'STYLIST':
        case 'BARBER':
        case 'STAFF':
          return { label: 'STYLIST', text: 'Thợ / Stylist', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' };
        case 'CUSTOMER':
          return { label: 'CUSTOMER', text: 'Khách Hàng', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.35)' };
        case 'SYSTEM':
        default:
          return { label: r || 'SYSTEM', text: 'Hệ Thống', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.35)' };
      }
    },

    onAuditRowClick(subType, rowId, evt) {
      if (evt && evt.target && (evt.target.tagName === 'SELECT' || evt.target.tagName === 'INPUT' || evt.target.tagName === 'BUTTON' || evt.target.closest('button') || evt.target.closest('select') || evt.target.closest('a'))) {
        return;
      }
      this.selectedAuditRowId = rowId;
      if (subType === 'logs') {
        this.toggleAuditRowDetail(rowId);
      } else if (subType === 'invoices') {
        this.toggleInvoiceRowDetail(rowId);
      } else if (subType === 'orders') {
        this.toggleOrderRowDetail(rowId);
      } else if (subType === 'reviews') {
        this.openReviewDetailModal(rowId);
      } else {
        const rows = document.querySelectorAll('#adminAuditContentContainer tr.admin-branch-table-row');
        rows.forEach(r => {
          r.classList.remove('is-selected');
          r.style.background = '';
          r.style.boxShadow = '';
        });
        const row = document.getElementById(`auditRow_${rowId}`);
        if (row) {
          row.classList.add('is-selected');
          row.style.background = 'rgba(255, 255, 255, 0.04)';
          row.style.boxShadow = 'inset 2px 0 0 var(--brand-accent)';
        }
      }
    },

    toggleAuditRowDetail(rowId) {
      this.expandedAuditRowId = (this.expandedAuditRowId === rowId) ? null : rowId;
      this.selectedAuditRowId = rowId;
      this._updateAuditContentOnly();
    },

    toggleInvoiceRowDetail(invId) {
      this.expandedInvoiceRowId = (this.expandedInvoiceRowId === invId) ? null : invId;
      this.selectedAuditRowId = invId;
      this._updateAuditContentOnly();
    },

    toggleOrderRowDetail(orderId) {
      this.expandedOrderRowId = (this.expandedOrderRowId === orderId) ? null : orderId;
      this.selectedAuditRowId = orderId;
      this._updateAuditContentOnly();
    },

    toggleInlineAddUser() {
      this.isAddingUserInline = !this.isAddingUserInline;
      this._updateAuditContentOnly();
      if (this.isAddingUserInline) {
        setTimeout(() => {
          const inp = document.getElementById('inlineNewUsername');
          if (inp) inp.focus();
        }, 50);
      }
    },

    async submitInlineNewUser() {
      const uInput = document.getElementById('inlineNewUsername');
      const fInput = document.getElementById('inlineNewFullName');
      const pInput = document.getElementById('inlineNewPhone');
      const rSelect = document.getElementById('inlineNewRole');
      const bSelect = document.getElementById('inlineNewBranch');

      const username = (uInput ? uInput.value : '').trim().toLowerCase();
      const fullName = (fInput ? fInput.value : '').trim();
      const phone = (pInput ? pInput.value : '').trim();
      const role = rSelect ? rSelect.value : 'CUSTOMER';
      const branchId = bSelect ? bSelect.value : 'ALL';

      if (!username) {
        if (window.SalonToast) window.SalonToast.show('Vui lòng nhập tên đăng nhập', 'warning');
        return;
      }
      if (!fullName) {
        if (window.SalonToast) window.SalonToast.show('Vui lòng nhập họ tên người dùng', 'warning');
        return;
      }

      const users = (window.store && window.store.state && window.store.state.users) || [];
      const exists = users.some(u => (u.username || u.TenDangNhap || '').toLowerCase() === username);
      if (exists) {
        if (window.SalonToast) window.SalonToast.show('Tên đăng nhập đã tồn tại trong hệ thống', 'warning');
        return;
      }

      const roleMap = {
        'SUPER_ADMIN': 'Quản trị viên',
        'ADMIN': 'Quản trị viên',
        'BRANCH_MANAGER': 'Quản lý',
        'CASHIER': 'Thu ngân',
        'BARBER': 'Nhân viên',
        'CUSTOMER': 'Khách hàng'
      };
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const branchObj = branches.find(b => b.id === branchId);
      const branchName = branchObj ? branchObj.name : (branchId === 'ALL' ? 'Toàn Hệ Thống' : branchId);

      const isStaff = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'BARBER'].includes(role);

      // Tạo mã đúng chuẩn: Nhân viên -> TK_NVxx, Khách hàng -> TK_KHxx
      let nextNum = 1;
      const prefix = isStaff ? 'TK_NV' : 'TK_KH';
      users.forEach(u => {
        const idStr = String(u.id || u.MaTaiKhoan || '');
        if (idStr.startsWith(prefix)) {
          const m = idStr.match(new RegExp(`^${prefix}(\\d+)`, 'i'));
          if (m) {
            const num = parseInt(m[1], 10);
            if (!isNaN(num) && num >= nextNum) nextNum = num + 1;
          }
        }
      });
      if (isStaff && nextNum <= 80) nextNum = 81;
      if (!isStaff && nextNum <= 22) nextNum = 23;

      const newId = `${prefix}${nextNum < 10 ? '0' + nextNum : nextNum}`;
      const newUser = {
        id: newId,
        MaTaiKhoan: newId,
        username,
        TenDangNhap: username,
        fullName,
        HoTen: fullName,
        phone,
        SoDienThoai: phone,
        role,
        VaiTro: roleMap[role] || role,
        roleName: roleMap[role] || role,
        branchId,
        MaChiNhanh: branchId,
        branchName,
        isActive: true,
        TrangThai: 'Hoạt động',
        createdAt: new Date().toISOString()
      };

      if (!window.store.state.users) window.store.state.users = [];
      window.store.state.users.unshift(newUser);
      if (window.store.saveState) window.store.saveState();

      // Đồng bộ trực tiếp vào cơ sở dữ liệu SQL Server (bắt buộc Bearer token)
      try {
        const authHeader = (window.Auth && typeof window.Auth.getAuthHeader === 'function') ? window.Auth.getAuthHeader() : {};
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({
            username,
            fullName,
            phone,
            role,
            branchId
          })
        });
        const resData = await res.json().catch(() => null);
        if (!res.ok || !resData || resData.success === false) {
          window.store.state.users = (window.store.state.users || []).filter(u => u.id !== newUser.id);
          if (window.store.saveState) window.store.saveState();
          if (window.SalonToast) window.SalonToast.show(resData?.message || 'Không có quyền hoặc lỗi tạo tài khoản.', 'error');
          return;
        }
        if (resData.user && resData.user.id) {
          newUser.id = resData.user.id;
          newUser.MaTaiKhoan = resData.user.MaTaiKhoan;
          if (resData.user.MaNhanVien) newUser.MaNhanVien = resData.user.MaNhanVien;
          if (resData.user.MaKhachHang) newUser.MaKhachHang = resData.user.MaKhachHang;
          if (window.store.saveState) window.store.saveState();
        }
      } catch (err) {
        if (window.SalonToast) window.SalonToast.show('Lỗi kết nối máy chủ khi tạo tài khoản.', 'error');
        return;
      }

      if (typeof window.store.logAudit === 'function') {
        window.store.logAudit('CREATE_USER', `Tài khoản: ${username}`, `Thêm tài khoản mới: ${fullName} (${role})`);
      }

      this.isAddingUserInline = false;
      if (window.SalonToast) window.SalonToast.show(`Đã thêm tài khoản "${username}" [${newUser.id}] thành công`, 'success');
      this._updateAuditContentOnly();
      if (window.store && typeof window.store.syncWithLiveServer === 'function') {
        window.store.syncWithLiveServer();
      }
    },

    async changeUserRoleDirect(userId, newRole) {
      if (!userId || !newRole) return;
      const roleMap = {
        'SUPER_ADMIN': 'Quản trị viên',
        'ADMIN': 'Quản trị viên',
        'BRANCH_MANAGER': 'Quản lý',
        'CASHIER': 'Thu ngân',
        'BARBER': 'Nhân viên',
        'CUSTOMER': 'Khách hàng'
      };
      const chucVuMap = {
        'SUPER_ADMIN': 'Quản trị viên',
        'ADMIN': 'Quản trị viên',
        'BRANCH_MANAGER': 'Quản lý chi nhánh',
        'CASHIER': 'Thu ngân',
        'BARBER': 'Thợ chính',
        'CUSTOMER': 'Khách hàng'
      };
      const users = (window.store && window.store.state && window.store.state.users) || [];
      const u = users.find(x => x.id === userId || x.username === userId || x.MaTaiKhoan === userId || x.TenDangNhap === userId);
      if (u) {
        u.role = newRole;
        u.VaiTro = roleMap[newRole] || newRole;
        u.roleName = roleMap[newRole] || newRole;
        if (newRole === 'CUSTOMER') {
          u.ChucVu = 'Khách hàng';
          u.branchId = null;
          u.branchName = 'Khách Hàng';
          u.TenChiNhanh = 'Khách Hàng';
          u.MaNhanVien = null;
          u.staffId = null;
        } else if (chucVuMap[newRole]) {
          u.ChucVu = chucVuMap[newRole];
        }
        if (window.store.saveState) window.store.saveState();
        if (typeof window.store.logAudit === 'function') {
          window.store.logAudit('UPDATE_USER_ROLE', `Tài khoản: ${u.username || u.TenDangNhap || userId}`, `Cập nhật vai trò sang: ${roleMap[newRole] || newRole}`);
        }
      }
      if (window.store && typeof window.store.updateUserRole === 'function') {
        await window.store.updateUserRole(userId, newRole);
      }
      if (window.store && typeof window.store.syncWithLiveServer === 'function') {
        await window.store.syncWithLiveServer();
      }
      if (window.SalonToast) {
        window.SalonToast.show(`Đã cập nhật vai trò cho ${userId} sang ${roleMap[newRole] || newRole}`, 'success');
      }
      this._updateAuditContentOnly();
    },

    async changeUserBranchDirect(userId, newBranchId) {
      if (!userId) return;
      const users = (window.store && window.store.state && window.store.state.users) || [];
      const u = users.find(x => x.id === userId || x.username === userId || x.MaTaiKhoan === userId || x.TenDangNhap === userId);
      try {
        const authHeader = (window.Auth && typeof window.Auth.getAuthHeader === 'function') ? window.Auth.getAuthHeader() : {};
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}/branch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ branchId: newBranchId })
        });
        const resData = await res.json().catch(() => null);
        if (!res.ok || (resData && resData.success === false)) {
          if (window.SalonToast) window.SalonToast.show(resData?.message || 'Không thể cập nhật chi nhánh tài khoản.', 'error');
          if (window.store && typeof window.store.syncWithLiveServer === 'function') await window.store.syncWithLiveServer();
          this._updateAuditContentOnly();
          return;
        }
      } catch (err) {
        if (window.SalonToast) window.SalonToast.show(`Lỗi kết nối khi cập nhật chi nhánh: ${err.message}`, 'error');
        this._updateAuditContentOnly();
        return;
      }

      if (u) {
        u.branchId = newBranchId;
        u.MaChiNhanh = newBranchId;
        const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
        const b = branches.find(br => br.id === newBranchId);
        u.branchName = b ? b.name : (newBranchId === 'ALL' ? 'Toàn Hệ Thống' : newBranchId);
        if (window.store.saveState) window.store.saveState();
        if (typeof window.store.logAudit === 'function') {
          window.store.logAudit('UPDATE_USER_BRANCH', `Tài khoản: ${u.username || u.TenDangNhap || userId}`, `Đổi cơ sở sang: ${u.branchName}`);
        }
      }
      if (window.SalonToast) {
        window.SalonToast.show(`Đã cập nhật cơ sở cho ${userId}`, 'success');
      }
      this._updateAuditContentOnly();
    },

    async toggleUserActiveDirect(userId) {
      if (!userId) return;
      const users = (window.store && window.store.state && window.store.state.users) || [];
      const u = users.find(x => x.id === userId || x.username === userId || x.MaTaiKhoan === userId || x.TenDangNhap === userId);
      let newActive = true;
      if (u) {
        const rawStatus = (u.TrangThai || '').toString();
        const currentlyActive = !rawStatus.includes('khóa') && !rawStatus.includes('khoa') && rawStatus !== 'inactive' && u.isActive !== false;
        newActive = !currentlyActive;
      }
      try {
        const authHeader = (window.Auth && typeof window.Auth.getAuthHeader === 'function') ? window.Auth.getAuthHeader() : {};
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ isActive: newActive, status: newActive ? 'Hoạt động' : 'Tạm khóa' })
        });
        const resData = await res.json().catch(() => null);
        if (!res.ok || (resData && resData.success === false)) {
          if (window.SalonToast) window.SalonToast.show(resData?.message || 'Không thể cập nhật trạng thái tài khoản.', 'error');
          if (window.store && typeof window.store.syncWithLiveServer === 'function') await window.store.syncWithLiveServer();
          this._updateAuditContentOnly();
          return;
        }
      } catch (err) {
        if (window.SalonToast) window.SalonToast.show(`Lỗi kết nối khi cập nhật trạng thái: ${err.message}`, 'error');
        this._updateAuditContentOnly();
        return;
      }

      if (u) {
        u.isActive = newActive;
        u.TrangThai = newActive ? 'Hoạt động' : 'Tạm khóa';
        if (window.store.saveState) window.store.saveState();
        if (typeof window.store.logAudit === 'function') {
          window.store.logAudit('UPDATE_USER_STATUS', `Tài khoản: ${u.username || u.TenDangNhap || userId}`, newActive ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản');
        }
      }
      if (window.SalonToast) {
        window.SalonToast.show(`Đã cập nhật trạng thái cho ${userId}`, 'info');
      }
      this._updateAuditContentOnly();
    },

    async deleteUserDirect(userId) {
      if (!userId) return;
      if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userId}" không?`)) {
        try {
          const authHeader = (window.Auth && typeof window.Auth.getAuthHeader === 'function') ? window.Auth.getAuthHeader() : {};
          const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
            method: 'DELETE',
            headers: { ...authHeader }
          });
          const resData = await res.json().catch(() => null);
          if (!res.ok || (resData && resData.success === false)) {
            if (window.SalonToast) window.SalonToast.show(resData?.message || 'Không thể xóa tài khoản.', 'error');
            return;
          }
        } catch (_) {
          if (window.SalonToast) window.SalonToast.show('Lỗi kết nối khi xóa tài khoản.', 'error');
          return;
        }
        if (window.store && window.store.state && window.store.state.users) {
          window.store.state.users = window.store.state.users.filter(u => u.id !== userId && u.username !== userId && u.MaTaiKhoan !== userId && u.TenDangNhap !== userId);
          if (window.store.saveState) window.store.saveState();
          if (typeof window.store.logAudit === 'function') {
            window.store.logAudit('DELETE_USER', `Tài khoản: ${userId}`, 'Đã xóa tài khoản khỏi hệ thống');
          }
        }
        if (window.SalonToast) {
          window.SalonToast.show(`Đã xóa tài khoản ${userId}`, 'success');
        }
        this._updateAuditContentOnly();
      }
    },

    computeInvoiceFinancials(inv) {
      if (!inv) {
        return { sTotal: 0, pTotal: 0, total: 0, services: [], products: [] };
      }

      let sTotal = Number(inv.serviceTotal !== undefined ? inv.serviceTotal : (inv.TongTienDichVu !== undefined ? inv.TongTienDichVu : (inv.TienDichVu || 0)));
      let pTotal = Number(inv.productTotal !== undefined ? inv.productTotal : (inv.TongTienSanPham !== undefined ? inv.TongTienSanPham : (inv.TienSanPham || 0)));
      let total = Number(inv.totalAmount || inv.TongThanhToan || inv.TongTien || inv.total || 0);

      const ordersList = (window.store && typeof window.store.getOrders === 'function') ? window.store.getOrders() : (window.store?.state?.orders || []);
      const bookingsList = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : (window.store?.state?.bookings || []);

      const invOrderId = inv.MaDonHang || inv.orderId || inv.orderCode;
      const invBookingId = inv.MaLichHen || inv.bookingId || inv.bookingCode;

      const relatedOrder = invOrderId ? ordersList.find(o => (o.id || o.orderCode || o.MaDonHang) === invOrderId) : null;
      const relatedBooking = invBookingId ? bookingsList.find(b => (b.id || b.bookingCode || b.MaLichHen) === invBookingId) : null;

      let services = (Array.isArray(inv.services) && inv.services.length > 0) ? inv.services : [];
      let products = (Array.isArray(inv.items) && inv.items.length > 0) ? inv.items : ((Array.isArray(inv.products) && inv.products.length > 0) ? inv.products : []);

      if (products.length === 0 && relatedOrder && Array.isArray(relatedOrder.items) && relatedOrder.items.length > 0) {
        products = relatedOrder.items;
      }
      if (services.length === 0 && relatedBooking) {
        if (Array.isArray(relatedBooking.services) && relatedBooking.services.length > 0) {
          services = relatedBooking.services;
        } else if (relatedBooking.serviceName || relatedBooking.TenDichVu) {
          services = [{
            name: relatedBooking.serviceName || relatedBooking.TenDichVu,
            price: Number(relatedBooking.totalPrice || relatedBooking.TongTien || 0)
          }];
        }
      }

      if (sTotal === 0 && services.length > 0) {
        sTotal = services.reduce((sum, s) => sum + Number(s.price || s.DonGia || 0), 0);
      }
      if (pTotal === 0 && products.length > 0) {
        pTotal = products.reduce((sum, it) => sum + (Number(it.price || it.DonGia || it.DonGiaThucTe || 0) * (it.qty || it.quantity || it.SoLuong || 1)), 0);
      }

      if (total === 0) {
        total = sTotal + pTotal;
      } else if (sTotal === 0 && pTotal === 0 && total > 0) {
        if (invOrderId || relatedOrder) {
          pTotal = total;
          sTotal = 0;
        } else if (invBookingId || relatedBooking) {
          sTotal = total;
          pTotal = 0;
        } else {
          sTotal = total;
          pTotal = 0;
        }
      }

      return { sTotal, pTotal, total, services, products, relatedOrder, relatedBooking };
    },

    _formatTableDateTime(val) {
      if (!val) return '—';
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return this.escapeHtml(String(val));
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${hh}:${mm}:${ss} • ${dd}/${mo}/${yyyy}`;
      } catch (e) {
        return this.escapeHtml(String(val));
      }
    },

    _updateAuditContentOnly() {
      const container = document.getElementById('adminAuditContentContainer');
      if (container) {
        const subType = this.auditSubTab || 'logs';
        const logs = (window.store && typeof window.store.getAuditLogs === 'function') ? window.store.getAuditLogs() : [];
        const invoices = (window.store && typeof window.store.getInvoices === 'function') ? window.store.getInvoices() : [];
        const payments = (window.store && typeof window.store.getPayments === 'function') ? window.store.getPayments() : [];
        const notifications = (window.store && typeof window.store.getNotifications === 'function') ? window.store.getNotifications() : [];
        const orders = (window.store && typeof window.store.getOrders === 'function') ? window.store.getOrders() : [];
        const users = (window.store && typeof window.store.getUsers === 'function') ? window.store.getUsers() : ((window.Auth && typeof window.Auth.getSeedAccounts === 'function') ? window.Auth.getSeedAccounts() : []);
        const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
        const q = (this.auditSearchQuery || '').toLowerCase().trim();
        container.innerHTML = this._renderAuditTableContent(subType, { logs, invoices, payments, notifications, orders, users, branches, q });
      } else {
        this.refreshAuditView();
      }
    },

    setAuditPage(page) {
      this.auditPage = page;
      this._updateAuditContentOnly();
      const el = document.getElementById('adminAuditContentContainer');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    renderAuditTab(auditLogs) {
      const subType = this.auditSubTab || 'logs';

      // Tự động tải nhật ký sự kiện mới nhất từ Backend API nếu đang xem tab logs
      if (subType === 'logs' && window.store && typeof window.store.fetchAuditLogsFromServer === 'function' && !this._fetchingAuditLogs) {
        this._fetchingAuditLogs = true;
        window.store.fetchAuditLogsFromServer().then(freshLogs => {
          this._fetchingAuditLogs = false;
          if (Array.isArray(freshLogs) && (this.auditSubTab || 'logs') === 'logs') {
            this._updateAuditContentOnly();
          }
        }).catch(() => {
          this._fetchingAuditLogs = false;
        });
      }

      const logs = auditLogs || (window.store && typeof window.store.getAuditLogs === 'function' ? window.store.getAuditLogs() : []);
      logs.forEach(l => {
        if (l.entity && typeof l.entity === 'string') l.entity = l.entity.replace(/#/g, '');
        if (l.details && typeof l.details === 'string') l.details = l.details.replace(/#/g, '');
      });
      const invoices = (window.store && typeof window.store.getInvoices === 'function') ? window.store.getInvoices() : [];
      const payments = (window.store && typeof window.store.getPayments === 'function') ? window.store.getPayments() : [];
      const notifications = (window.store && typeof window.store.getNotifications === 'function') ? window.store.getNotifications() : [];
      const orders = (window.store && typeof window.store.getOrders === 'function') ? window.store.getOrders() : [];
      const users = (window.store && typeof window.store.getUsers === 'function') ? window.store.getUsers() : ((window.Auth && typeof window.Auth.getSeedAccounts === 'function') ? window.Auth.getSeedAccounts() : []);
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];

      const q = (this.auditSearchQuery || '').toLowerCase().trim();

      // Search Placeholders
      const searchPlaceholders = {
        logs: 'Tìm theo mã, nội dung, người thao tác, đối tượng...',
        users: 'Tìm tài khoản, họ tên, số điện thoại, chi nhánh...',
        invoices: 'Tìm mã hóa đơn, tên khách, chi nhánh, PT thanh toán...',
        orders: 'Tìm mã đơn hàng, tên khách, số điện thoại...',
        notifications: 'Tìm tiêu đề, nội dung, phân loại thông báo...',
        reviews: 'Tìm mã đánh giá, tên khách, nội dung, mã đối tượng...'
      };
      const placeholder = searchPlaceholders[subType] || 'Tìm kiếm...';

      return `
        <!-- THANH CHUYỂN PHÂN HỆ TINH GỌN (BỎ HẲN SỐ ĐẾM ĐẰNG SAU, CHỮ TO RÕ NHẤT QUÁN 13PX) -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
          <button type="button" class="admin-tab-btn ${subType === 'logs' ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'logs' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchAuditSubTab('logs')">
            Sự Kiện Kiểm Toán
          </button>
          <button type="button" class="admin-tab-btn ${subType === 'users' ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'users' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchAuditSubTab('users')">
            Tài Khoản &amp; Phân Quyền
          </button>
          <button type="button" class="admin-tab-btn ${subType === 'invoices' ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'invoices' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchAuditSubTab('invoices')">
            Hóa Đơn &amp; Thu Tiền
          </button>
          <button type="button" class="admin-tab-btn ${subType === 'orders' ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'orders' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchAuditSubTab('orders')">
            Đơn Hàng &amp; Thanh Toán
          </button>
          <button type="button" class="admin-tab-btn ${subType === 'notifications' ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'notifications' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchAuditSubTab('notifications')">
            Thông Báo Hệ Thống
          </button>
          <button type="button" class="admin-tab-btn ${subType === 'reviews' ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'reviews' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchAuditSubTab('reviews')">
            Đánh Giá Khách Hàng
          </button>
        </div>

        <!-- THẺ FILTER BAR ĐỘC LẬP TINH GỌN (NO NEON GLOW, NO SLOP) -->
        <div class="admin-filter-bar" style="border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: var(--surface-card); border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1;">
            
            <!-- Ô TÌM KIẾM CÓ ICON KÍNH LÚP & NÚT X RÕ RÀNG -->
            <div style="position: relative; min-width: 260px; max-width: 380px; flex: 1;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; display: flex; align-items: center; color: var(--text-muted);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input type="text" id="adminAuditSearchInput" class="form-control-custom"
                     aria-label="Tìm kiếm trong kiểm toán"
                     style="padding-left: 34px !important; padding-right: 28px !important; height: 34px; font-size: 13px; border-radius: 6px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                     placeholder="${placeholder}"
                     value="${this.escapeHtml(this.auditSearchQuery || '')}"
                     oninput="AdminWeb.handleAuditSearch(this.value);">
              <button type="button" id="adminAuditSearchClear"
                      onclick="AdminWeb.clearAuditSearch();"
                      aria-label="Xóa từ khóa tìm kiếm"
                      style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px; padding: 4px; display: ${this.auditSearchQuery ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; z-index: 2;"
                      title="Xóa tìm kiếm">✕</button>
            </div>

            <!-- BỘ LỌC CHUYÊN BIỆT CHO TỪNG PHÂN HỆ -->
            ${(() => {
          if (subType === 'logs') {
            return `
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditActionFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${(!this.auditActionFilter || this.auditActionFilter === 'all') ? 'selected' : ''}>Tất cả đối tượng</option>
                    <option value="Chi Nhánh" ${this.auditActionFilter === 'Chi Nhánh' || this.auditActionFilter === 'BRANCH' ? 'selected' : ''}>Chi Nhánh</option>
                    <option value="Lịch Hẹn" ${this.auditActionFilter === 'Lịch Hẹn' || this.auditActionFilter === 'BOOKING' ? 'selected' : ''}>Lịch Hẹn</option>
                    <option value="Kho Hàng" ${this.auditActionFilter === 'Kho Hàng' || this.auditActionFilter === 'STOCK' ? 'selected' : ''}>Kho Hàng</option>
                    <option value="Sản Phẩm" ${this.auditActionFilter === 'Sản Phẩm' || this.auditActionFilter === 'PRODUCT' ? 'selected' : ''}>Sản Phẩm</option>
                    <option value="Nhân Sự / Thợ" ${this.auditActionFilter === 'Nhân Sự / Thợ' || this.auditActionFilter === 'STAFF' || this.auditActionFilter === 'STYLIST' ? 'selected' : ''}>Nhân Sự / Thợ</option>
                    <option value="Dịch Vụ & Combo" ${this.auditActionFilter === 'Dịch Vụ & Combo' || this.auditActionFilter === 'SERVICE' ? 'selected' : ''}>Dịch Vụ & Combo</option>
                    <option value="Hóa Đơn / POS" ${this.auditActionFilter === 'Hóa Đơn / POS' || this.auditActionFilter === 'ORDER' ? 'selected' : ''}>Hóa Đơn / POS</option>
                    <option value="Xác Thực" ${this.auditActionFilter === 'Xác Thực' || this.auditActionFilter === 'AUTH' ? 'selected' : ''}>Xác Thực</option>
                  </select>
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditOperatorRoleFilter = this.value; AdminWeb.auditLogRoleFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${(!this.auditOperatorRoleFilter || this.auditOperatorRoleFilter === 'all') ? 'selected' : ''}>Tất cả người thao tác</option>
                    <option value="SUPER_ADMIN" ${(this.auditOperatorRoleFilter === 'SUPER_ADMIN' || this.auditLogRoleFilter === 'SUPER_ADMIN') ? 'selected' : ''}>Quản Trị Viên (SUPER_ADMIN)</option>
                    <option value="BRANCH_MANAGER" ${(this.auditOperatorRoleFilter === 'BRANCH_MANAGER' || this.auditLogRoleFilter === 'BRANCH_MANAGER') ? 'selected' : ''}>Quản Lý Chi Nhánh (BRANCH_MANAGER)</option>
                    <option value="CASHIER" ${(this.auditOperatorRoleFilter === 'CASHIER' || this.auditLogRoleFilter === 'CASHIER') ? 'selected' : ''}>Thu Ngân (CASHIER)</option>
                    <option value="STYLIST" ${(this.auditOperatorRoleFilter === 'STYLIST' || this.auditLogRoleFilter === 'STYLIST') ? 'selected' : ''}>Thợ / Nhân Viên (STYLIST)</option>
                    <option value="CUSTOMER" ${(this.auditOperatorRoleFilter === 'CUSTOMER' || this.auditLogRoleFilter === 'CUSTOMER') ? 'selected' : ''}>Khách Hàng (CUSTOMER)</option>
                    <option value="SYSTEM" ${(this.auditOperatorRoleFilter === 'SYSTEM' || this.auditLogRoleFilter === 'SYSTEM') ? 'selected' : ''}>Hệ Thống (SYSTEM)</option>
                  </select>
                `;
          }
          if (subType === 'users') {
            return `
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditRoleFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${this.auditRoleFilter === 'all' ? 'selected' : ''}>Tất cả vai trò</option>
                    <option value="SUPER_ADMIN" ${(this.auditRoleFilter === 'SUPER_ADMIN' || this.auditRoleFilter === 'ADMIN') ? 'selected' : ''}>Quản Trị Viên (SUPER_ADMIN)</option>
                    <option value="BRANCH_MANAGER" ${this.auditRoleFilter === 'BRANCH_MANAGER' ? 'selected' : ''}>Quản Lý Chi Nhánh (BRANCH_MANAGER)</option>
                    <option value="CASHIER" ${this.auditRoleFilter === 'CASHIER' ? 'selected' : ''}>Thu Ngân POS (CASHIER)</option>
                    <option value="BARBER" ${this.auditRoleFilter === 'BARBER' ? 'selected' : ''}>Thợ / Barber (BARBER)</option>
                    <option value="CUSTOMER" ${this.auditRoleFilter === 'CUSTOMER' ? 'selected' : ''}>Khách Hàng (CUSTOMER)</option>
                  </select>
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditBranchFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${this.auditBranchFilter === 'all' ? 'selected' : ''}>Tất cả cơ sở</option>
                    ${branches.map(b => `
                      <option value="${b.id}" ${this.auditBranchFilter === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>
                    `).join('')}
                  </select>
                `;
          }
          if (subType === 'invoices') {
            return `
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditPaymentStatusFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${this.auditPaymentStatusFilter === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
                    <option value="paid" ${this.auditPaymentStatusFilter === 'paid' ? 'selected' : ''}>Đã thanh toán</option>
                    <option value="pending" ${this.auditPaymentStatusFilter === 'pending' ? 'selected' : ''}>Chờ thanh toán</option>
                  </select>
                `;
          }
          if (subType === 'orders') {
            return `
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditOrderStatusFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${this.auditOrderStatusFilter === 'all' ? 'selected' : ''}>Tất cả tiến trình</option>
                    <option value="pending" ${this.auditOrderStatusFilter === 'pending' ? 'selected' : ''}>Chờ xác nhận</option>
                    <option value="processing" ${this.auditOrderStatusFilter === 'processing' ? 'selected' : ''}>Đang đóng gói / chuẩn bị</option>
                    <option value="delivering" ${this.auditOrderStatusFilter === 'delivering' ? 'selected' : ''}>Đang giao / Sẵn sàng tại quầy</option>
                    <option value="completed" ${this.auditOrderStatusFilter === 'completed' ? 'selected' : ''}>Hoàn tất / Đã nhận</option>
                    <option value="cancelled" ${this.auditOrderStatusFilter === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
                  </select>
                `;
          }
          if (subType === 'notifications') {
            return `
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditNotifStatusFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${this.auditNotifStatusFilter === 'all' ? 'selected' : ''}>Tất cả thông báo</option>
                    <option value="unread" ${this.auditNotifStatusFilter === 'unread' ? 'selected' : ''}>Chưa đọc</option>
                    <option value="read" ${this.auditNotifStatusFilter === 'read' ? 'selected' : ''}>Đã đọc</option>
                  </select>
                `;
          }
          if (subType === 'reviews') {
            return `
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditReviewStarFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${(!this.auditReviewStarFilter || this.auditReviewStarFilter === 'all') ? 'selected' : ''}>Tất cả mức sao</option>
                    <option value="5" ${this.auditReviewStarFilter === '5' ? 'selected' : ''}>5 sao</option>
                    <option value="4" ${this.auditReviewStarFilter === '4' ? 'selected' : ''}>4 sao</option>
                    <option value="3" ${this.auditReviewStarFilter === '3' ? 'selected' : ''}>3 sao</option>
                    <option value="2" ${this.auditReviewStarFilter === '2' ? 'selected' : ''}>2 sao</option>
                    <option value="1" ${this.auditReviewStarFilter === '1' ? 'selected' : ''}>1 sao</option>
                  </select>
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditReviewStatusFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${(!this.auditReviewStatusFilter || this.auditReviewStatusFilter === 'all') ? 'selected' : ''}>Tất cả trạng thái</option>
                    <option value="visible" ${this.auditReviewStatusFilter === 'visible' ? 'selected' : ''}>Hiển thị</option>
                    <option value="hidden" ${this.auditReviewStatusFilter === 'hidden' ? 'selected' : ''}>Đã ẩn</option>
                    <option value="replied" ${this.auditReviewStatusFilter === 'replied' ? 'selected' : ''}>Đã phản hồi</option>
                    <option value="unreplied" ${this.auditReviewStatusFilter === 'unreplied' ? 'selected' : ''}>Chưa phản hồi</option>
                  </select>
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditReviewTypeFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${(!this.auditReviewTypeFilter || this.auditReviewTypeFilter === 'all') ? 'selected' : ''}>Tất cả đối tượng</option>
                    <option value="service" ${this.auditReviewTypeFilter === 'service' ? 'selected' : ''}>Dịch vụ / Lịch hẹn</option>
                    <option value="product" ${this.auditReviewTypeFilter === 'product' ? 'selected' : ''}>Sản phẩm / Đơn hàng</option>
                  </select>
                `;
          }
          return '';
        })()}
          </div>

          <!-- NÚT HÀNH ĐỘNG BÊN PHẢI TINH GỌN (CHỮ 13PX ĐỒNG NHẤT, KHÔNG ICON SẶC SỠ) -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            ${(() => {
          if (subType === 'users') {
            return `
                  <button style="height: 34px; padding: 0 14px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; background: var(--brand-accent, #C59B27); color: #141413; border: none; display: inline-flex; align-items: center; transition: opacity 0.15s ease;"
                          onclick="AdminWeb.toggleInlineAddUser()">
                    <span>+ Thêm Tài Khoản Mới</span>
                  </button>
                `;
          }
          if (subType === 'logs') {
            return `
                  <button style="height: 34px; padding: 0 14px; font-size: 13px; font-weight: 500; border-radius: 6px; cursor: pointer; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); display: inline-flex; align-items: center; transition: all 0.15s ease;"
                          onclick="AdminWeb.exportAuditLogs()">
                    <span>Xuất Báo Cáo Nhật Ký</span>
                  </button>
                `;
          }
          if (subType === 'invoices') {
            return `
                  <button style="height: 34px; padding: 0 14px; font-size: 13px; font-weight: 500; border-radius: 6px; cursor: pointer; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); display: inline-flex; align-items: center; transition: all 0.15s ease;"
                          onclick="AdminWeb.exportInvoicesReport()">
                    <span>Xuất File Doanh Thu</span>
                  </button>
                `;
          }
          if (subType === 'orders') {
            return `
                  <button style="height: 34px; padding: 0 14px; font-size: 13px; font-weight: 500; border-radius: 6px; cursor: pointer; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); display: inline-flex; align-items: center; transition: all 0.15s ease;"
                          onclick="AdminWeb.exportOrdersReport()">
                    <span>Xuất Danh Sách Đơn</span>
                  </button>
                `;
          }
          if (subType === 'notifications') {
            return `
                  <button style="height: 34px; padding: 0 14px; font-size: 13px; font-weight: 500; border-radius: 6px; cursor: pointer; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); display: inline-flex; align-items: center; transition: all 0.15s ease;"
                          onclick="AdminWeb.markAllNotificationsRead()">
                    <span>Đánh Dấu Đã Đọc Tất Cả</span>
                  </button>
                `;
          }
          if (subType === 'reviews') {
            return `
                  <button style="height: 34px; padding: 0 14px; font-size: 13px; font-weight: 500; border-radius: 6px; cursor: pointer; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); display: inline-flex; align-items: center; transition: all 0.15s ease;"
                          onclick="AdminWeb.fetchAdminReviews(false)">
                    <span>Làm Mới</span>
                  </button>
                  <button style="height: 34px; padding: 0 14px; font-size: 13px; font-weight: 500; border-radius: 6px; cursor: pointer; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); display: inline-flex; align-items: center; transition: all 0.15s ease;"
                          onclick="AdminWeb.exportReviewsReport()">
                    <span>Xuất File Đánh Giá</span>
                  </button>
                `;
          }
          return '';
        })()}
          </div>
        </div>

        <!-- KHỐI BẢNG CÓ ID ĐỘC LẬP ĐỂ GIỮ NGUYÊN FOCUS KHI GÕ TÌM KIẾM -->
        <div id="adminAuditContentContainer">
          ${this._renderAuditTableContent(subType, { logs, invoices, payments, notifications, orders, users, branches, q })}
        </div>
      `;
    },

    _renderAuditTableContent(subType, { logs, invoices, payments, notifications, orders, users, branches, q }) {
      this.auditPage = this.auditPage || 1;

      // 1. Phân hệ sự kiện kiểm toán (Logs)
      if (subType === 'logs') {
        let filtered = [...logs];

        // Lọc theo vai trò người thao tác (6 vai trò: SUPER_ADMIN, BRANCH_MANAGER, CASHIER, STYLIST, CUSTOMER, SYSTEM)
        const activeRoleFilter = String(this.auditOperatorRoleFilter || this.auditLogRoleFilter || 'all').trim().toUpperCase();
        if (activeRoleFilter && activeRoleFilter !== 'ALL') {
          filtered = filtered.filter(l => {
            const opRole = (typeof this._extractAuditOperatorRole === 'function')
              ? this._extractAuditOperatorRole(l)
              : String(l.operatorRole || l.role || '').toUpperCase();
            if (activeRoleFilter === 'BRANCH_MANAGER') return opRole.includes('BRANCH_MANAGER') || opRole.includes('QUẢN LÝ');
            if (activeRoleFilter === 'SUPER_ADMIN') return opRole.includes('SUPER_ADMIN') || opRole.includes('QUẢN TRỊ') || opRole === 'ADMIN';
            if (activeRoleFilter === 'CASHIER') return opRole.includes('CASHIER') || opRole.includes('THU NGÂN');
            if (activeRoleFilter === 'STYLIST') return opRole.includes('STYLIST') || opRole.includes('BARBER') || opRole.includes('THỢ');
            if (activeRoleFilter === 'CUSTOMER') return opRole.includes('CUSTOMER') || opRole.includes('KHÁCH');
            if (activeRoleFilter === 'SYSTEM') return opRole.includes('SYSTEM') || opRole.includes('HỆ THỐNG');
            return opRole.includes(activeRoleFilter);
          });
        }

        // Lọc theo nhóm đối tượng
        if (this.auditActionFilter && this.auditActionFilter !== 'all') {
          const af = this.auditActionFilter.toUpperCase();
          filtered = filtered.filter(l => {
            const ent = String(l.entity || l.entityType || '').toUpperCase();
            const act = String(l.action || '').toUpperCase();
            if (af === 'CHI NHÁNH' || af === 'BRANCH') return ent.includes('CHI NHÁNH') || act.includes('BRANCH');
            if (af === 'LỊCH HẸN' || af === 'BOOKING') return ent.includes('LỊCH HẸN') || ent.includes('LỊCH') || act.includes('BOOKING');
            if (af === 'KHO HÀNG' || af === 'STOCK') return ent.includes('KHO') || ent.includes('PHIẾU') || act.includes('STOCK') || act.includes('RECEIPT');
            if (af === 'SẢN PHẨM' || af === 'PRODUCT') return ent.includes('SẢN PHẨM') || ent.includes('SP') || act.includes('PRODUCT');
            if (af === 'NHÂN SỰ / THỢ' || af === 'STAFF' || af === 'STYLIST') return ent.includes('NHÂN SỰ') || ent.includes('THỢ') || ent.includes('CA') || act.includes('STYLIST') || act.includes('STAFF') || act.includes('SHIFT');
            if (af === 'DỊCH VỤ & COMBO' || af === 'SERVICE') return ent.includes('DỊCH VỤ') || ent.includes('COMBO') || act.includes('SERVICE') || act.includes('COMBO');
            if (af === 'HÓA ĐƠN / POS' || af === 'ORDER') return ent.includes('HÓA ĐƠN') || ent.includes('ĐƠN') || ent.includes('POS') || act.includes('ORDER') || act.includes('INVOICE') || act.includes('POS') || act.includes('PAYMENT');
            if (af === 'XÁC THỰC' || af === 'AUTH') return ent.includes('TÀI KHOẢN') || ent.includes('OTP') || act.includes('AUTH') || act.includes('LOGIN') || act.includes('PASSWORD') || act.includes('ROLE');
            return ent.includes(af) || act.includes(af);
          });
        }

        if (q) {
          const norm = str => (str || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          const normQ = norm(q);
          filtered = filtered.filter(l =>
            norm(l.operatorName).includes(normQ) ||
            norm(l.actor).includes(normQ) ||
            norm(l.operatorRole).includes(normQ) ||
            norm(l.role).includes(normQ) ||
            norm(l.entity).includes(normQ) ||
            norm(l.details).includes(normQ) ||
            norm(l.action).includes(normQ) ||
            norm(l.id).includes(normQ)
          );
        }

        const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
        if (this.auditPage > totalPages) this.auditPage = totalPages;
        const paged = filtered.slice((this.auditPage - 1) * this.pageSize, this.auditPage * this.pageSize);

        const cleanActionLabels = {
          'UPDATE_BOOKING_STATUS': 'Cập nhật lịch hẹn',
          'UPDATE_BRANCH': 'Cập nhật chi nhánh',
          'CREATE_BRANCH': 'Thêm chi nhánh',
          'DELETE_BRANCH': 'Xóa chi nhánh',
          'CHANGE_BRANCH': 'Đổi chi nhánh',
          'CREATE_BOOKING': 'Đặt lịch mới',
          'UPDATE_BOOKING': 'Cập nhật lịch',
          'CANCEL_BOOKING': 'Hủy lịch hẹn',
          'RESCHEDULE_BOOKING': 'Đổi giờ hẹn',
          'COMPLETE_BOOKING': 'Hoàn tất ca',
          'CHECKIN_WAITING': 'Khách vào sảnh',
          'EARLY_CHECKIN': 'Khách check-in sớm',
          'EARLY_WAITING': 'Khách chờ sảnh sớm',
          'DELETE_BOOKING': 'Xóa lịch hẹn',
          'UPDATE_STOCK': 'Điều chỉnh tồn kho',
          'ADJUST_STOCK': 'Điều chỉnh kho',
          'STOCK_DECREMENT': 'Xuất giảm tồn kho',
          'STOCK_INCREMENT': 'Hoàn nhập tồn kho',
          'CREATE_PRODUCT': 'Thêm sản phẩm mới',
          'UPDATE_PRODUCT': 'Sửa thông tin sản phẩm',
          'DELETE_PRODUCT': 'Xóa sản phẩm',
          'CREATE_SERVICE': 'Thêm dịch vụ',
          'UPDATE_SERVICE': 'Sửa dịch vụ',
          'DELETE_SERVICE': 'Xóa dịch vụ',
          'CREATE_COMBO': 'Thêm combo VIP',
          'UPDATE_COMBO': 'Sửa combo VIP',
          'DELETE_COMBO': 'Xóa combo VIP',
          'CREATE_STYLIST': 'Thêm nhân sự',
          'UPDATE_STYLIST': 'Sửa nhân sự',
          'DELETE_STYLIST': 'Nghỉ việc nhân sự',
          'REGISTER_SHIFT': 'Đăng ký ca làm',
          'CREATE_ORDER': 'Đặt hàng mỹ phẩm',
          'CANCEL_ORDER': 'Hủy đơn hàng',
          'UPDATE_ORDER_STATUS': 'Cập nhật đơn hàng',
          'ORDER_PAYMENT': 'Thanh toán đơn hàng',
          'CREATE_RECEIPT': 'Tạo phiếu nhập',
          'APPROVE_RECEIPT': 'Duyệt nhập kho',
          'REJECT_RECEIPT': 'Từ chối nhập kho',
          'POS_CHECKOUT': 'Thanh toán POS',
          'ONLINE_PAYMENT': 'Thanh toán VietQR',
          'PAYMENT_SUCCESS': 'Thanh toán thành công',
          'CUSTOMER_REGISTER': 'Đăng ký khách hàng',
          'AUTH_LOGIN': 'Đăng nhập',
          'AUTH_LOGOUT': 'Đăng xuất',
          'LOGIN': 'Đăng nhập',
          'LOGOUT': 'Đăng xuất',
          'CHANGE_PASSWORD': 'Đổi mật khẩu',
          'RESET_PASSWORD': 'Đặt lại mật khẩu',
          'OTP_EXPIRED_OR_INVALID': 'OTP hết hạn',
          'AUTO_CANCEL_BOOKING': 'Tự động hủy lịch hẹn',
          'AUTO_CANCEL_ORDER': 'Tự động hủy đơn hàng',
          'CREATE_USER': 'Tạo tài khoản',
          'DELETE_USER': 'Xóa tài khoản',
          'UPDATE_USER_STATUS': 'Khóa/mở tài khoản',
          'UPDATE_USER_BRANCH': 'Chuyển chi nhánh',
          'UPDATE_USER_ROLE': 'Phân quyền tài khoản'
        };

        const renderRoleBadge = (role) => {
          const badge = this._getAuditRoleBadge(role);
          return `<span style="display: inline-block; padding: 2.5px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background: ${badge.bg}; color: ${badge.color}; border: 1px solid ${badge.border}; text-transform: uppercase; letter-spacing: 0.3px;">${badge.label}</span>`;
        };

        return `
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%;">
                <thead>
                  <tr>
                    <th style="width: 175px; padding: 12px 14px;">THỜI GIAN</th>
                    <th style="width: 190px; padding: 12px 14px;">HÀNH ĐỘNG</th>
                    <th style="width: 220px; padding: 12px 14px;">NGƯỜI THAO TÁC</th>
                    <th style="width: 160px; padding: 12px 14px;">ĐỐI TƯỢNG</th>
                    <th style="padding: 12px 14px;">NỘI DUNG CHI TIẾT</th>
                    <th style="text-align: center; width: 110px; padding: 12px 14px;">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.length === 0 ? `
                    <tr>
                      <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        Không tìm thấy sự kiện kiểm toán nào khớp với bộ lọc.
                      </td>
                    </tr>
                  ` : paged.map((l, idx) => {
          const rowId = l.id || `log_${idx}_${l.timestamp}`;
          const isSelected = this.selectedAuditRowId === rowId;
          const isExpanded = this.expandedAuditRowId === rowId;
          const actLabel = cleanActionLabels[l.action] || l.action || 'Sự kiện';
          const role = l.operatorRole || l.role || 'SYSTEM';
          const actorName = l.operatorName || l.actor || 'Hệ Thống';

          return `
                      <tr id="auditRow_${rowId}"
                          class="admin-branch-table-row ${isSelected ? 'is-selected' : ''}"
                          onclick="AdminWeb.onAuditRowClick('logs', '${rowId}', event)"
                          style="cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease; ${isSelected ? 'background: rgba(197, 155, 39, 0.16); box-shadow: inset 3px 0 0 #C59B27;' : ''}">
                        <td style="white-space: nowrap; font-size: 12.5px; color: var(--text-secondary); padding: 12px 14px; font-variant-numeric: tabular-nums;">
                          ${this._formatTableDateTime(l.timestamp)}
                        </td>
                        <td style="padding: 12px 14px;">
                          <div>
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 13.5px;">${this.escapeHtml(actLabel)}</div>
                            <div style="font-size: 11.5px; color: var(--brand-accent); font-weight: 700; font-family: monospace;">${this.escapeHtml(l.action || '')}</div>
                          </div>
                        </td>
                        <td style="padding: 12px 14px;">
                          <div>
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 13px; margin-bottom: 4px;">${this.escapeHtml(actorName)}</div>
                            <div>${renderRoleBadge(role)}</div>
                          </div>
                        </td>
                        <td style="padding: 12px 10px; white-space: nowrap;">
                          <span style="color: #f59e0b; font-weight: 700; font-size: 12.5px;">${this.escapeHtml(String(l.entity || '—').replace(/#/g, ''))}</span>
                        </td>
                        <td style="color: var(--text-secondary); font-size: 12.5px; line-height: 1.4; padding: 12px 14px;">
                          ${this.escapeHtml(String(l.details || '—').replace(/#/g, ''))}
                        </td>
                        <td style="text-align: center; padding: 12px 10px; white-space: nowrap;">
                          <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;"
                                  onclick="event.stopPropagation(); AdminWeb.toggleAuditRowDetail('${rowId}')">
                            ${isExpanded ? 'Thu Gọn' : 'Chi Tiết'}
                          </button>
                        </td>
                      </tr>
                      ${isExpanded ? `
                        <tr id="auditDetailRow_${rowId}" class="audit-expanded-row" style="background: rgba(255, 255, 255, 0.02); border-bottom: 1px solid var(--border-color);">
                          <td colspan="6" style="padding: 14px 18px;">
                            <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px 16px;">
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                  <span>Chi tiết sự kiện: ${this.escapeHtml(String(l.id || rowId).replace(/^#/, ''))}</span>
                                  <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">• ${this._formatTableDateTime(l.timestamp)}</span>
                                </div>
                                <button type="button" class="pill-btn-outline" style="padding: 2px 8px; font-size: 11px; border-radius: 4px;"
                                        onclick="event.stopPropagation(); AdminWeb.toggleAuditRowDetail('${rowId}')">
                                  Thu gọn ✕
                                </button>
                              </div>
                              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 12.5px; margin-bottom: 12px;">
                                <div><span style="color: var(--text-secondary);">NGƯỜI THỰC HIỆN:</span> <strong style="color: var(--text-primary);">${this.escapeHtml(actorName)}</strong> ${renderRoleBadge(role)}</div>
                                <div><span style="color: var(--text-secondary);">THAO TÁC GHI NHẬN:</span> <strong style="color: var(--text-primary);">${this.escapeHtml(actLabel)} (${this.escapeHtml(l.action)})</strong></div>
                                <div><span style="color: var(--text-secondary);">MỤC TIÊU / ĐỐI TƯỢNG:</span> <strong style="color: #f59e0b;">${this.escapeHtml(String(l.entity || '—').replace(/#/g, ''))}</strong></div>
                                <div><span style="color: var(--text-secondary);">CHI NHÁNH:</span> <strong style="color: var(--text-primary);">${this.escapeHtml(l.branchId || 'Toàn hệ thống')}</strong></div>
                                <div><span style="color: var(--text-secondary);">ĐỊA CHỈ KẾT NỐI / KÊNH:</span> <strong style="color: var(--text-primary);">${this.escapeHtml(l.ip || '127.0.0.1 • Web Enterprise Console')}</strong></div>
                              </div>
                              ${(l.before || l.beforeData || l.after || l.afterData) ? `
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-bottom: 12px;">
                                  <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px;">
                                    <div style="font-size: 11.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">GIÁ TRỊ TRƯỚC (BEFORE):</div>
                                    <div style="font-family: monospace; font-size: 12px; color: var(--text-secondary); white-space: pre-wrap; word-break: break-all;">${this.escapeHtml(typeof (l.before || l.beforeData) === 'object' ? JSON.stringify(l.before || l.beforeData, null, 2) : String(l.before || l.beforeData || '— Không có dữ liệu trước (Tạo mới)'))}</div>
                                  </div>
                                  <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px;">
                                    <div style="font-size: 11.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">GIÁ TRỊ SAU (AFTER):</div>
                                    <div style="font-family: monospace; font-size: 12px; color: var(--text-primary); white-space: pre-wrap; word-break: break-all;">${this.escapeHtml(typeof (l.after || l.afterData) === 'object' ? JSON.stringify(l.after || l.afterData, null, 2) : String(l.after || l.afterData || '— Không có dữ liệu sau (Đã xóa)'))}</div>
                                  </div>
                                </div>
                              ` : ''}
                              <div style="background: #151413; border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px; font-family: monospace; font-size: 12px; color: #a1a1aa; white-space: pre-wrap; word-break: break-all;">
                                ${this.escapeHtml(l.details || 'Không có payload chi tiết')}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ` : ''}
                    `;
        }).join('')}
                </tbody>
              </table>
            </div>
            ${this._renderPaginationControls(this.auditPage, totalPages, filtered.length, 'AdminWeb.setAuditPage', 'nhật ký')}
          </div>
        `;
      }

      // 2. Phân hệ tài khoản và phân quyền (Users)
      if (subType === 'users') {
        const uList = users || [];
        const normQ = (q || '').toLowerCase().trim();
        let filteredUsers = uList.filter(u => {
          if (this.auditRoleFilter && this.auditRoleFilter !== 'all') {
            const uRole = this.getUserRoleCode(u);
            const targetFilter = this.auditRoleFilter.toUpperCase();
            if (targetFilter === 'ADMIN' || targetFilter === 'SUPER_ADMIN') {
              if (uRole !== 'SUPER_ADMIN') return false;
            } else if (uRole !== targetFilter) {
              return false;
            }
          }
          if (this.auditBranchFilter && this.auditBranchFilter !== 'all') {
            const bId = (u.branchId || u.MaChiNhanh || '').toUpperCase();
            if (bId !== this.auditBranchFilter.toUpperCase()) return false;
          }
          if (!normQ) return true;
          const uname = (u.username || u.TenDangNhap || '').toLowerCase();
          const fname = (u.fullName || u.HoTen || '').toLowerCase();
          const phone = (u.phone || u.SoDienThoai || '').toLowerCase();
          const branch = (u.branchName || u.branchId || u.MaChiNhanh || '').toLowerCase();
          return uname.includes(normQ) || fname.includes(normQ) || phone.includes(normQ) || branch.includes(normQ);
        });

        const totalPages = Math.max(1, Math.ceil(filteredUsers.length / this.pageSize));
        if (this.auditPage > totalPages) this.auditPage = totalPages;
        const paged = filteredUsers.slice((this.auditPage - 1) * this.pageSize, this.auditPage * this.pageSize);

        return `
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%;">
                <thead>
                  <tr>
                    <th style="width: 85px; padding: 12px 14px;">MÃ</th>
                    <th style="padding: 12px 14px;">TÀI KHOẢN &amp; HỌ TÊN</th>
                    <th style="padding: 12px 14px;">HOTLINE / SĐT</th>
                    <th style="width: 180px; padding: 12px 14px;">VAI TRÒ (CHỈNH TRỰC TIẾP)</th>
                    <th style="width: 180px; padding: 12px 14px;">CƠ SỞ (CHỈNH TRỰC TIẾP)</th>
                    <th style="width: 120px; padding: 12px 14px;">TRẠNG THÁI</th>
                    <th style="text-align: center; width: 80px; padding: 12px 14px;">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.isAddingUserInline ? `
                    <tr style="background: rgba(197, 155, 39, 0.08); border-bottom: 2px solid var(--brand-accent);">
                      <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--brand-accent); padding: 12px 14px;">Mới</td>
                      <td style="padding: 12px 14px;">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                          <input type="text" id="inlineNewFullName" placeholder="Họ và tên *" style="height: 28px; font-size: 12.5px; font-weight: 700; border-radius: 4px; padding: 0 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); width: 100%; max-width: 220px;">
                          <input type="text" id="inlineNewUsername" placeholder="Tên đăng nhập (@) *" style="height: 24px; font-size: 11.5px; border-radius: 4px; padding: 0 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--brand-accent); width: 100%; max-width: 220px;">
                        </div>
                      </td>
                      <td style="padding: 12px 14px;">
                        <input type="text" id="inlineNewPhone" placeholder="0901xxxxxx" style="height: 28px; font-size: 12.5px; font-weight: 700; border-radius: 4px; padding: 0 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: #f59e0b; width: 130px;">
                      </td>
                      <td style="padding: 12px 14px;">
                        <select id="inlineNewRole" style="height: 30px; font-size: 12px; font-weight: 600; border-radius: 6px; padding: 2px 8px; border: 1px solid var(--border-color); background: #1c1b18; color: var(--text-primary); width: 100%;">
                          <option value="CUSTOMER">Khách Hàng</option>
                          <option value="BARBER">Thợ / Barber</option>
                          <option value="CASHIER">Thu Ngân POS</option>
                          <option value="BRANCH_MANAGER">Quản Lý Chi Nhánh</option>
                        </select>
                      </td>
                      <td style="padding: 12px 14px;">
                        <select id="inlineNewBranch" style="height: 30px; font-size: 12px; font-weight: 600; border-radius: 6px; padding: 2px 8px; border: 1px solid var(--border-color); background: #1c1b18; color: var(--text-primary); width: 100%;">
                          <option value="ALL">Toàn Hệ Thống</option>
                          ${branches.map(b => `<option value="${b.id}">${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                        </select>
                      </td>
                      <td style="padding: 12px 14px;">
                        <span class="status-pill status-completed" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; display: inline-block;">Hoạt động</span>
                      </td>
                      <td style="text-align: center; padding: 12px 10px; white-space: nowrap;">
                        <div style="display: inline-flex; gap: 6px;">
                          <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;" onclick="AdminWeb.submitInlineNewUser()">Lưu</button>
                          <button class="pill-btn-outline" style="padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 6px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="AdminWeb.toggleInlineAddUser()">Hủy</button>
                        </div>
                      </td>
                    </tr>
                  ` : ''}
                  ${paged.length === 0 ? `
                    <tr>
                      <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        Không tìm thấy tài khoản nào khớp với bộ lọc.
                      </td>
                    </tr>
                  ` : paged.map(u => {
          const uid = u.id || u.MaTaiKhoan || u.username || u.TenDangNhap || '—';
          const uname = u.username || u.TenDangNhap || '—';
          const fname = u.fullName || u.HoTen || '—';
          const phone = u.phone || u.SoDienThoai || '0901111000';

          // Parse role accurately via helper
          const roleCode = this.getUserRoleCode(u);

          const branchId = u.branchId || u.MaChiNhanh || 'ALL';
          const isSelected = this.selectedAuditRowId === uid;
          const rawStatus = (u.TrangThai || '').toString();
          const isActive = !rawStatus.includes('khóa') && !rawStatus.includes('khoa') && rawStatus !== 'inactive' && u.isActive !== false;

          return `
                      <tr id="auditRow_${uid}"
                          class="admin-branch-table-row ${isSelected ? 'is-selected' : ''}"
                          onclick="AdminWeb.onAuditRowClick('users', '${uid}', event)"
                          style="cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease; ${isSelected ? 'background: rgba(197, 155, 39, 0.16); box-shadow: inset 3px 0 0 #C59B27;' : ''}">
                        <!-- Cột Mã: font-weight: 700; color: var(--text-primary); giống hệt bảng Chi Nhánh (CN01) -->
                        <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--text-primary); padding: 12px 14px;">
                          ${this.escapeHtml(String(uid).replace(/^#/, ""))}
                        </td>
                        <!-- Cột Họ tên & Username 2 dòng phân cấp: Họ tên 13.5px bold 800, Username 11.5px gold accent giống hệt bảng Chi Nhánh -->
                        <td style="padding: 12px 14px;">
                          <div>
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 13.5px;">${this.escapeHtml(fname)}</div>
                            <div style="font-size: 11.5px; color: var(--brand-accent); font-weight: 700;">@${this.escapeHtml(uname)}</div>
                          </div>
                        </td>
                        <!-- Cột Hotline / SĐT: màu amber #f59e0b font-weight 700 giống cột Hotline bảng Chi Nhánh -->
                        <td style="padding: 12px 14px;">
                          <a href="tel:${phone}" onclick="event.stopPropagation()" style="color: #f59e0b; font-weight: 700; text-decoration: none; font-size: 12.5px; font-variant-numeric: tabular-nums;">
                            ${this.escapeHtml(phone)}
                          </a>
                        </td>
                        <!-- Cột Vai trò điều khiển trực tiếp -->
                        <td style="padding: 12px 14px;">
                          ${(uid === 'TK_ADMIN' || uname === 'admin' || roleCode === 'SUPER_ADMIN') ? `
                            <select class="admin-table-inline-select" style="height: 30px; font-size: 12px; font-weight: 700; border-radius: 6px; padding: 2px 8px; border: 1px solid rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.12); color: #ef4444; cursor: not-allowed; width: 100%; max-width: 165px;" disabled title="Quản Trị Viên tối cao là vai trò cố định, không thể thay đổi">
                              <option value="SUPER_ADMIN" selected>Quản Trị Viên</option>
                            </select>
                          ` : `
                            <select class="admin-table-inline-select" style="height: 30px; font-size: 12px; font-weight: 600; border-radius: 6px; padding: 2px 8px; border: 1px solid var(--border-color); background: #1c1b18; color: var(--text-primary); cursor: pointer; width: 100%; max-width: 165px;"
                                    onchange="AdminWeb.changeUserRoleDirect('${this.escapeHtml(String(uid).replace(/^#/, ""))}', this.value)">
                              <option value="BRANCH_MANAGER" ${roleCode === 'BRANCH_MANAGER' ? 'selected' : ''}>Quản Lý Chi Nhánh</option>
                              <option value="CASHIER" ${roleCode === 'CASHIER' ? 'selected' : ''}>Thu Ngân POS</option>
                              <option value="BARBER" ${roleCode === 'BARBER' || roleCode === 'STYLIST' ? 'selected' : ''}>Thợ / Barber</option>
                              <option value="CUSTOMER" ${roleCode === 'CUSTOMER' ? 'selected' : ''}>Khách Hàng</option>
                            </select>
                          `}
                        </td>
                        <!-- Cột Cơ sở điều khiển trực tiếp -->
                        <td style="padding: 12px 14px;">
                          ${roleCode === 'CUSTOMER' ? `
                            <span style="font-size: 12.5px; color: var(--text-muted); font-weight: 600;">Khách Hàng</span>
                          ` : `
                            <select class="admin-table-inline-select" style="height: 30px; font-size: 12px; font-weight: 600; border-radius: 6px; padding: 2px 8px; border: 1px solid var(--border-color); background: #1c1b18; color: var(--text-primary); cursor: pointer; width: 100%; max-width: 165px;"
                                    onchange="AdminWeb.changeUserBranchDirect('${this.escapeHtml(String(uid).replace(/^#/, ""))}', this.value)">
                              <option value="ALL" ${branchId === 'ALL' ? 'selected' : ''}>Toàn Hệ Thống</option>
                              ${branches.map(b => `
                                <option value="${b.id}" ${branchId === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>
                              `).join('')}
                            </select>
                          `}
                        </td>
                        <!-- Cột Trạng thái: dùng class status-pill status-completed giống hệt bảng Chi Nhánh (Hoạt động) -->
                        <td style="padding: 12px 14px;">
                          <button type="button" class="status-pill ${isActive ? 'status-completed' : 'status-cancelled'}"
                                  onclick="event.stopPropagation(); AdminWeb.toggleUserActiveDirect('${this.escapeHtml(String(uid).replace(/^#/, ""))}')"
                                  style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; cursor: pointer; border: none; display: inline-block;"
                                  title="Nhấp để thay đổi trạng thái">
                            ${isActive ? 'Hoạt động' : 'Tạm khóa'}
                          </button>
                        </td>
                        <!-- Cột Thao tác: nút Xóa có viền đỏ pill-btn-outline giống bảng Chi Nhánh -->
                        <td style="text-align: center; padding: 12px 10px; white-space: nowrap;">
                          <button class="pill-btn-outline" style="padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 6px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" 
                                  onclick="event.stopPropagation(); AdminWeb.deleteUserDirect('${this.escapeHtml(String(uid).replace(/^#/, ""))}')" title="Xóa tài khoản">
                            Xóa
                          </button>
                        </td>
                      </tr>
                    `;
        }).join('')}
                </tbody>
              </table>
            </div>
            ${this._renderPaginationControls(this.auditPage, totalPages, filteredUsers.length, 'AdminWeb.setAuditPage', 'tài khoản')}
          </div>
        `;
      }

      // 3. Phân hệ hóa đơn & thu tiền (Invoices)
      if (subType === 'invoices') {
        const filtered = invoices.filter(inv => {
          const isPaid = this._isInvoicePaid(inv);
          if (this.auditPaymentStatusFilter === 'paid' && !isPaid) return false;
          if (this.auditPaymentStatusFilter === 'pending' && isPaid) return false;
          if (!q) return true;
          const code = (inv.id || inv.MaHoaDon || '').toLowerCase();
          const cust = (inv.customerName || inv.TenKhachHang || '').toLowerCase();
          const branch = (inv.branchName || inv.MaChiNhanh || '').toLowerCase();
          const method = (inv.paymentMethod || inv.PhuongThucThanhToan || '').toLowerCase();
          return code.includes(q) || cust.includes(q) || branch.includes(q) || method.includes(q);
        });

        const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
        if (this.auditPage > totalPages) this.auditPage = totalPages;
        const paged = filtered.slice((this.auditPage - 1) * this.pageSize, this.auditPage * this.pageSize);

        return `
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%;">
                <thead>
                  <tr>
                    <th style="width: 75px; padding: 12px 10px; white-space: nowrap;">MÃ HĐ</th>
                    <th style="width: 140px; padding: 12px 10px; white-space: nowrap;">CƠ SỞ</th>
                    <th style="width: 140px; padding: 12px 10px; white-space: nowrap;">KHÁCH HÀNG</th>
                    <th style="width: 150px; padding: 12px 10px; white-space: nowrap;">THỜI GIAN</th>
                    <th style="width: 105px; padding: 12px 10px; text-align: right; white-space: nowrap;">TIỀN DỊCH VỤ</th>
                    <th style="width: 105px; padding: 12px 10px; text-align: right; white-space: nowrap;">TIỀN SẢN PHẨM</th>
                    <th style="width: 125px; padding: 12px 10px; text-align: right; white-space: nowrap;">TỔNG DOANH THU</th>
                    <th style="width: 95px; padding: 12px 10px; white-space: nowrap;">PHƯƠNG THỨC</th>
                    <th style="width: 115px; padding: 12px 10px; white-space: nowrap;">TRẠNG THÁI</th>
                    <th style="text-align: center; width: 90px; padding: 12px 10px; white-space: nowrap;">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.length === 0 ? `
                    <tr>
                      <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        Không tìm thấy hóa đơn nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ` : paged.map(inv => {
          const { sTotal, pTotal, total, services: invServices, products: invItems } = this.computeInvoiceFinancials(inv);
          const isPaid = this._isInvoicePaid(inv);
          const invId = inv.id || inv.MaHoaDon || 'HD00';
          const isSelected = this.selectedAuditRowId === invId;
          const isExpanded = this.expandedInvoiceRowId === invId;

          return `
                      <tr id="auditRow_${invId}"
                          class="admin-branch-table-row ${isSelected ? 'is-selected' : ''}"
                          onclick="AdminWeb.onAuditRowClick('invoices', '${invId}', event)"
                          style="cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease; ${isSelected ? 'background: rgba(197, 155, 39, 0.16); box-shadow: inset 3px 0 0 #C59B27;' : ''}">
                        <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--text-primary); padding: 12px 8px;">
                          ${this.escapeHtml(String(invId).replace(/^#/, ''))}
                        </td>
                        <td style="padding: 12px 8px; white-space: nowrap;">
                          <div>
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 13px; white-space: nowrap;">${this.escapeHtml(inv.branchName || `Chi Nhánh ${inv.branchId || '01'}`)}</div>
                            <div style="font-size: 11px; color: var(--brand-accent); font-weight: 700; white-space: nowrap;">${this.escapeHtml(String(inv.branchId || 'CN01').replace(/^#/, ''))}</div>
                          </div>
                        </td>
                        <td style="padding: 12px 8px; white-space: nowrap;">
                          <div>
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 13px; white-space: nowrap;">${this.escapeHtml(inv.customerName || inv.TenKhachHang || 'Khách vãng lai')}</div>
                            <div style="font-size: 11px; color: #f59e0b; font-weight: 700; white-space: nowrap;">${this.escapeHtml(String(inv.customerPhone || '090xxxxxxx').replace(/^#/, ''))}</div>
                          </div>
                        </td>
                        <td style="white-space: nowrap; font-size: 12px; color: var(--text-secondary); padding: 12px 8px; font-variant-numeric: tabular-nums;">
                          ${this._formatTableDateTime(inv.createdDate || inv.NgayLap)}
                        </td>
                        <td style="padding: 12px 8px; font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; color: var(--text-secondary); white-space: nowrap;">${SalonUtils.formatCurrency(sTotal)}</td>
                        <td style="padding: 12px 8px; font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; color: var(--text-secondary); white-space: nowrap;">${SalonUtils.formatCurrency(pTotal)}</td>
                        <td style="padding: 12px 8px; text-align: right; white-space: nowrap;">
                          <strong style="color: #10b981; font-size: 13px; font-weight: 800;">
                            ${SalonUtils.formatCurrency(total)}
                          </strong>
                        </td>
                        <td style="padding: 12px 8px; font-size: 12px; color: var(--text-secondary); white-space: nowrap;">
                          ${this.escapeHtml(inv.paymentMethod || inv.PhuongThucThanhToan || 'VietQR')}
                        </td>
                        <td style="padding: 12px 8px; white-space: nowrap;">
                          <span class="status-pill ${isPaid ? 'status-completed' : 'status-cancelled'}" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; white-space: nowrap; display: inline-block;">
                            ${isPaid ? 'Đã thanh toán' : 'Chờ xử lý'}
                          </span>
                        </td>
                        <td style="text-align: center; padding: 12px 8px; white-space: nowrap;">
                          <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: center;">
                            <button class="pill-btn-outline" style="padding: 4px 8px; font-size: 11.5px; font-weight: 700; border-radius: 6px;"
                                    onclick="event.stopPropagation(); AdminWeb.toggleInvoiceRowDetail('${invId}')">
                              ${isExpanded ? 'Thu Gọn' : 'Xem Nhanh'}
                            </button>
                            <button class="pill-btn-outline" style="padding: 4px 8px; font-size: 11.5px; font-weight: 700; border-radius: 6px;"
                                    title="Xem chi tiết & in hóa đơn"
                                    onclick="event.stopPropagation(); AdminWeb.openInvoiceDetailModal('${invId}')">
                              Phiếu In
                            </button>
                          </div>
                        </td>
                      </tr>
                      ${isExpanded ? `
                        <tr id="invoiceDetailRow_${invId}" class="admin-branch-detail-row audit-expanded-row" style="background: rgba(255, 255, 255, 0.02); border-bottom: 1px solid var(--border-color);">
                          <td colspan="10" style="padding: 14px 18px;">
                            <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px 16px;">
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                  <span>Chi tiết hóa đơn: ${this.escapeHtml(String(invId).replace(/^#/, ''))}</span>
                                  <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">• Khách hàng: ${this.escapeHtml(inv.customerName || 'Khách vãng lai')} (${this.escapeHtml(inv.customerPhone || 'Không có SĐT')})</span>
                                </div>
                                <div style="display: inline-flex; gap: 8px;">
                                  <button type="button" class="pill-btn-outline" style="padding: 3px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;"
                                          onclick="event.stopPropagation(); AdminWeb.openInvoiceDetailModal('${invId}')">
                                    Xem Phiếu In
                                  </button>
                                  <button type="button" class="pill-btn-outline" style="padding: 3px 8px; font-size: 11px; border-radius: 4px;"
                                          aria-label="Đóng chi tiết hóa đơn"
                                          onclick="event.stopPropagation(); AdminWeb.toggleInvoiceRowDetail('${invId}')">
                                    ✕
                                  </button>
                                </div>
                              </div>
                              <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.6;">
                                <div>• <strong>Dịch vụ thực hiện:</strong> ${invServices.length > 0
                ? invServices.map(s => `${this.escapeHtml(s.name || s.TenDichVu || 'Dịch vụ')} (${SalonUtils.formatCurrency(s.price || s.DonGia || 0)})`).join(', ')
                : (sTotal > 0 ? 'Dịch vụ lẻ tại quầy' : 'Không có')
              }</div>
                                <div>• <strong>Sản phẩm đính kèm:</strong> ${invItems.length > 0
                ? invItems.map(it => `${this.escapeHtml(it.name || it.TenSanPham || 'Sản phẩm')} (x${it.qty || it.quantity || it.SoLuong || 1} - ${SalonUtils.formatCurrency(it.price || it.DonGia || 0)})`).join(', ')
                : (pTotal > 0 ? 'Sản phẩm tại quầy / Đơn online' : 'Không có')
              }</div>
                                <div>• <strong>Phương thức &amp; Thu ngân:</strong> ${this.escapeHtml(inv.paymentMethod || 'VietQR')} • Thu ngân: ${this.escapeHtml(inv.cashierName || 'Thu Ngân Quầy')}</div>
                                <div style="margin-top: 12px; padding: 10px 14px; background: rgba(0, 0, 0, 0.03); border: 1px dashed var(--border-color); border-radius: 6px; display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; max-width: 320px;">
                                  <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                                    <span>Tiền dịch vụ:</span>
                                    <strong style="color: var(--text-primary);">${SalonUtils.formatCurrency(sTotal)}</strong>
                                  </div>
                                  <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                                    <span>Tiền sản phẩm:</span>
                                    <strong style="color: var(--text-primary);">${SalonUtils.formatCurrency(pTotal)}</strong>
                                  </div>
                                  <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 700; border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 4px;">
                                    <span>Tổng Thanh Toán:</span>
                                    <strong style="color: #10b981; font-size: 14.5px;">${SalonUtils.formatCurrency(total)}</strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ` : ''}
                    `;
        }).join('')}
                </tbody>
              </table>
            </div>
            ${this._renderPaginationControls(this.auditPage, totalPages, filtered.length, 'AdminWeb.setAuditPage', 'hóa đơn')}
          </div>
        `;
      }

      // 4. Phân hệ đơn hàng (Orders)
      if (subType === 'orders') {
        const orderList = orders || [];
        let filtered = orderList.filter(o => {
          if (this.auditOrderStatusFilter && this.auditOrderStatusFilter !== 'all') {
            const rawSt = (o.orderStatus || o.status || o.TrangThai || '').toLowerCase();
            if (this.auditOrderStatusFilter === 'pending' && !rawSt.includes('chờ') && rawSt !== 'pending') return false;
            if (this.auditOrderStatusFilter === 'processing' && !rawSt.includes('chuẩn bị') && !rawSt.includes('đóng gói') && !rawSt.includes('xử lý') && rawSt !== 'processing') return false;
            if (this.auditOrderStatusFilter === 'delivering' && !rawSt.includes('sẵn sàng') && !rawSt.includes('giao') && rawSt !== 'delivering' && rawSt !== 'ready' && rawSt !== 'ready_for_pickup') return false;
            if (this.auditOrderStatusFilter === 'completed' && !rawSt.includes('đã nhận') && !rawSt.includes('hoàn tất') && !rawSt.includes('đã giao') && rawSt !== 'completed' && rawSt !== 'delivered') return false;
            if (this.auditOrderStatusFilter === 'cancelled' && !rawSt.includes('hủy') && rawSt !== 'cancelled') return false;
          }
          if (!q) return true;
          const code = (o.id || o.orderCode || o.MaDonHang || '').toLowerCase();
          const cust = (o.customerName || '').toLowerCase();
          const phone = (o.customerPhone || '').toLowerCase();
          const paySt = (o.paymentStatus || o.TrangThai || '').toLowerCase();
          return code.includes(q) || cust.includes(q) || phone.includes(q) || paySt.includes(q);
        });

        const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
        if (this.auditPage > totalPages) this.auditPage = totalPages;
        const paged = filtered.slice((this.auditPage - 1) * this.pageSize, this.auditPage * this.pageSize);

        return `
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%; table-layout: auto;">
                <thead>
                  <tr>
                    <th style="width: 72px; padding: 10px 8px;">MÃ ĐƠN</th>
                    <th style="padding: 10px 8px;">KHÁCH HÀNG &amp; SĐT</th>
                    <th style="padding: 10px 8px;">THỜI GIAN</th>
                    <th style="padding: 10px 8px;">SẢN PHẨM</th>
                    <th style="padding: 10px 8px; text-align: right;">TỔNG TIỀN</th>
                    <th style="padding: 10px 8px;">HÌNH THỨC</th>
                    <th style="padding: 10px 8px;">THANH TOÁN</th>
                    <th style="padding: 10px 8px;">TIẾN TRÌNH</th>
                    <th style="text-align: center; width: 150px; padding: 10px 8px;">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.length === 0 ? `
                    <tr>
                      <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ` : paged.map(o => {
          const oCode = String(o.id || o.orderCode || o.MaDonHang || '');
          const inv = (window.store && typeof window.store.getInvoices === 'function')
            ? (window.store.getInvoices().find(i => {
              const iCode = String(i.MaDonHang || '').trim();
              return iCode && (iCode === oCode || iCode === '#' + oCode || '#' + iCode === oCode) && i.TrangThai === 'Đã thanh toán';
            }))
            : null;
          const isPaid = Boolean(
            o.paymentStatus === 'Paid' ||
            o.paymentStatus === 'PAID' ||
            o.paymentStatus === 'Đã thanh toán' ||
            o.isPaid === true ||
            o.TrangThaiHoaDon === 'Đã thanh toán' ||
            o.TrangThaiThanhToan === 'Đã thanh toán' ||
            o.TrangThaiThanhToan === 'Paid' ||
            inv
          );
          const items = o.items || [];
          const itemsSummary = items.map(it => `${this.escapeHtml(it.name || it.TenSanPham || 'Sản phẩm')} (x${it.qty || it.quantity || 1})`).join(', ');
          const isPickup = (window.SalonUtils && typeof window.SalonUtils.isPickupOrder === 'function')
            ? window.SalonUtils.isPickupOrder(o)
            : (o.deliveryType === 'PICKUP_BRANCH' || (o.shippingAddress && o.shippingAddress.toLowerCase().includes('quầy')));

          const rawSt = (o.orderStatus || o.status || o.TrangThai || 'Pending');
          const stInfo = (window.SalonUtils && typeof window.SalonUtils.formatOrderStatus === 'function')
            ? window.SalonUtils.formatOrderStatus(rawSt, isPickup)
            : { step: 1, label: rawSt };
          const step = stInfo.step;
          const stepLabel = stInfo.label;

          const stepStyles = {
            0: { pillBg: 'rgba(239, 68, 68, 0.12)', pillFg: '#EF4444', selectBg: 'rgba(239, 68, 68, 0.12)', selectFg: '#EF4444', selectBd: 'rgba(239, 68, 68, 0.3)' },
            1: { pillBg: 'rgba(245, 158, 11, 0.14)', pillFg: '#B45309', selectBg: '#FFFBEB', selectFg: '#92400E', selectBd: '#FCD34D' },
            2: { pillBg: 'rgba(245, 158, 11, 0.16)', pillFg: '#D97706', selectBg: '#FEF3C7', selectFg: '#B45309', selectBd: '#F59E0B' },
            3: { pillBg: 'rgba(14, 165, 233, 0.14)', pillFg: '#0284C7', selectBg: '#E0F2FE', selectFg: '#0369A1', selectBd: '#7DD3FC' },
            4: { pillBg: 'rgba(16, 185, 129, 0.14)', pillFg: '#059669', selectBg: '#ECFDF5', selectFg: '#047857', selectBd: '#6EE7B7' }
          };
          const stStyle = stepStyles[step] || stepStyles[1];
          const isSelected = this.selectedAuditRowId === oCode;

          return `
                      <tr id="auditRow_${oCode}"
                          class="admin-branch-table-row ${isSelected ? 'is-selected' : ''}"
                          onclick="AdminWeb.onAuditRowClick('orders', '${oCode}', event)"
                          style="cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease; ${isSelected ? 'background: rgba(197, 155, 39, 0.16); box-shadow: inset 3px 0 0 #C59B27;' : ''}">
                        <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--text-primary); padding: 10px 8px;">
                          ${this.escapeHtml(String(oCode).replace(/^#/, ''))}
                        </td>
                        <td style="padding: 10px 8px; white-space: nowrap;">
                          <div>
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 13px; white-space: nowrap;">${this.escapeHtml(o.customerName || 'Khách Hàng')}</div>
                            <div style="font-size: 11.5px; color: #f59e0b; font-weight: 700; white-space: nowrap;">${this.escapeHtml(String(o.customerPhone || '090xxxxxxx').replace(/^#/, ''))}</div>
                          </div>
                        </td>
                        <td style="white-space: nowrap; font-size: 11.5px; color: var(--text-secondary); padding: 10px 8px; font-variant-numeric: tabular-nums;">
                          ${this._formatTableDateTime(o.createdAt || o.orderDate || o.NgayDat)}
                        </td>
                        <td style="padding: 10px 8px; font-size: 12px; color: var(--text-secondary); max-width: 145px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${itemsSummary || '—'}
                        </td>
                        <td style="padding: 10px 8px; text-align: right; white-space: nowrap;">
                          <strong style="color: #10b981; font-size: 13px; font-weight: 800;">
                            ${SalonUtils.formatCurrency(o.totalAmount || o.finalTotal || o.TongTien || 0)}
                          </strong>
                        </td>
                        <td style="padding: 10px 8px; font-size: 12px; color: var(--text-secondary); white-space: nowrap;">
                          ${isPickup ? 'Tại quầy' : 'Giao tận nơi'}
                        </td>
                        <td style="padding: 10px 8px; white-space: nowrap;">
                          <span class="status-pill" style="background: ${isPaid ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.1)'}; color: ${isPaid ? '#059669' : '#DC2626'}; padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; white-space: nowrap; display: inline-block;">
                            ${isPaid ? 'Đã trả' : 'Chưa thu'}
                          </span>
                        </td>
                        <td style="padding: 10px 8px; white-space: nowrap;">
                          <span class="status-pill" style="background: ${stStyle.pillBg}; color: ${stStyle.pillFg}; padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; white-space: nowrap; display: inline-block;">
                            ${this.escapeHtml(stepLabel)}
                          </span>
                        </td>
                        <td style="text-align: center; padding: 10px 8px; white-space: nowrap;" onclick="event.stopPropagation()">
                          ${step === 0 ? `
                            <span style="display: inline-block; padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; background-color: ${stStyle.selectBg} !important; color: ${stStyle.selectFg} !important; border: 1px solid ${stStyle.selectBd} !important;">
                              Đã hủy
                            </span>
                          ` : (step === 4 && isPaid) ? `
                            <span style="display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 31px; padding: 0 12px; border-radius: 6px; font-size: 12px; font-weight: 700; background-color: #ECFDF5 !important; color: #047857 !important; border: 1px solid #6EE7B7 !important; min-width: 132px;" title="Đơn hàng đã tới bước cuối cùng và đã thu tiền, không thể quay về các bước trước">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              ${isPickup ? 'Đã nhận tại quầy' : 'Hoàn tất'}
                            </span>
                          ` : `
                            <select class="admin-order-status-select"
                                    style="height: 31px; padding: 0 8px; border-radius: 6px; font-size: 12px; font-weight: 700; background-color: ${stStyle.selectBg} !important; color: ${stStyle.selectFg} !important; border: 1px solid ${stStyle.selectBd} !important; cursor: pointer; min-width: 132px;"
                                    onchange="AdminWeb.updateOrderStatus('${oCode}', this.value)">
                              ${isPickup ? `
                                <option value="Pending" ${step === 1 ? 'selected' : ''}>Chờ xác nhận</option>
                                <option value="Processing" ${step === 2 ? 'selected' : ''}>Đang chuẩn bị</option>
                                <option value="Ready" ${step === 3 ? 'selected' : ''}>Sẵn sàng tại quầy</option>
                                <option value="Completed" ${step === 4 ? 'selected' : ''}>Đã nhận tại quầy</option>
                              ` : `
                                <option value="Pending" ${step === 1 ? 'selected' : ''}>Chờ xác nhận</option>
                                <option value="Processing" ${step === 2 ? 'selected' : ''}>Đang đóng gói</option>
                                <option value="Delivering" ${step === 3 ? 'selected' : ''}>Đang giao hàng</option>
                                <option value="Completed" ${step === 4 ? 'selected' : ''}>Hoàn tất</option>
                              `}
                            </select>
                          `}
                        </td>
                      </tr>
                    `;
        }).join('')}
                </tbody>
              </table>
            </div>
            ${this._renderPaginationControls(this.auditPage, totalPages, filtered.length, 'AdminWeb.setAuditPage', 'đơn hàng')}
          </div>
        `;
      }

      // 5. Phân hệ thông báo hệ thống (Notifications)
      if (subType === 'notifications') {
        const filtered = notifications.filter(n => {
          if (this.auditNotifStatusFilter === 'unread' && (n.isRead || n.DaDoc)) return false;
          if (this.auditNotifStatusFilter === 'read' && !(n.isRead || n.DaDoc)) return false;
          if (!q) return true;
          const title = (n.title || n.TieuDe || '').toLowerCase();
          const content = (n.content || n.NoiDung || '').toLowerCase();
          const type = (n.type || n.LoaiThongBao || '').toLowerCase();
          return title.includes(q) || content.includes(q) || type.includes(q);
        });

        const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
        if (this.auditPage > totalPages) this.auditPage = totalPages;
        const paged = filtered.slice((this.auditPage - 1) * this.pageSize, this.auditPage * this.pageSize);

        return `
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%;">
                <thead>
                  <tr>
                    <th style="width: 90px; padding: 12px 14px;">MÃ TB</th>
                    <th style="width: 220px; padding: 12px 14px;">TIÊU ĐỀ</th>
                    <th style="padding: 12px 14px;">NỘI DUNG</th>
                    <th style="width: 130px; padding: 12px 14px;">PHÂN LOẠI</th>
                    <th style="width: 170px; padding: 12px 14px;">THỜI GIAN</th>
                    <th style="width: 110px; padding: 12px 14px;">TRẠNG THÁI</th>
                    <th style="text-align: center; width: 100px; padding: 12px 14px;">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.length === 0 ? `
                    <tr>
                      <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        Không có thông báo nào khớp với bộ lọc.
                      </td>
                    </tr>
                  ` : paged.map(n => {
          const isRead = n.isRead || n.DaDoc;
          const nId = n.id || n.MaThongBao || 'TB00';
          const isSelected = this.selectedAuditRowId === nId;

          return `
                      <tr id="auditRow_${nId}"
                          class="admin-branch-table-row ${isSelected ? 'is-selected' : ''}"
                          onclick="AdminWeb.onAuditRowClick('notifications', '${nId}', event)"
                          style="cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease; ${isSelected ? 'background: rgba(197, 155, 39, 0.16); box-shadow: inset 3px 0 0 #C59B27;' : ''}">
                        <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--text-primary); padding: 12px 14px;">
                          ${this.escapeHtml(String(nId).replace(/^#/, ''))}
                        </td>
                        <td style="padding: 12px 10px; white-space: nowrap;">
                          <div>
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 13.5px; white-space: nowrap;">${this.escapeHtml(n.title || n.TieuDe)}</div>
                            <div style="font-size: 11.5px; color: var(--brand-accent); font-weight: 700; white-space: nowrap;">${this.escapeHtml(n.type || n.LoaiThongBao || 'Hệ thống')}</div>
                          </div>
                        </td>
                        <td style="color: var(--text-secondary); font-size: 12.5px; line-height: 1.4; padding: 12px 14px;">
                          ${this.escapeHtml(n.content || n.NoiDung)}
                        </td>
                        <td style="padding: 12px 14px; font-size: 12px; color: var(--text-secondary); white-space: nowrap;">
                          ${this.escapeHtml(n.type || n.LoaiThongBao || 'Hệ thống')}
                        </td>
                        <td style="white-space: nowrap; font-size: 12px; color: var(--text-secondary); padding: 12px 14px; font-variant-numeric: tabular-nums;">
                          ${this._formatTableDateTime(n.createdAt || n.NgayTao)}
                        </td>
                        <td style="padding: 12px 10px; white-space: nowrap;">
                          <span class="status-pill ${isRead ? 'status-completed' : 'status-cancelled'}" style="padding: 4px 12px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; white-space: nowrap; display: inline-block;">
                            ${isRead ? 'Đã đọc' : 'Chưa đọc'}
                          </span>
                        </td>
                        <td style="text-align: center; padding: 12px 10px; white-space: nowrap;">
                          <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;"
                                  onclick="event.stopPropagation(); AdminWeb.toggleNotificationRead('${nId}')">
                            ${isRead ? 'Bỏ đọc' : 'Đã đọc'}
                          </button>
                        </td>
                      </tr>
                    `;
        }).join('')}
                </tbody>
              </table>
            </div>
            ${this._renderPaginationControls(this.auditPage, totalPages, filtered.length, 'AdminWeb.setAuditPage', 'thông báo')}
          </div>
        `;
      }

      // 6. Phân hệ đánh giá khách hàng (Reviews)
      if (subType === 'reviews') {
        const rawReviews = Array.isArray(this._adminReviewsList)
          ? this._adminReviewsList
          : ((window.store && typeof window.store.getReviews === 'function') ? window.store.getReviews() : []);

        const allReviews = rawReviews.map(r => {
          const code = String(r.id || r.MaDanhGia || '');
          const shortCode = code.replace(/^DG/i, '').padStart(4, '0');
          const stars = Number(r.rating || r.SoSao || 5);
          const statusStr = r.status || r.TrangThai || 'Hiển thị';
          const isHidden = statusStr === 'Đã ẩn' || statusStr === 'hidden';
          const replyText = String(r.adminReply || r.PhanHoiAdmin || '').trim();
          const targetBadge = r.MaSanPham
            ? `SP ${r.MaSanPham}`
            : (r.MaDichVu ? `DV ${r.MaDichVu}` : (r.MaDonHang || r.orderId ? `ĐƠN #${r.MaDonHang || r.orderId}` : (r.MaLichHen || r.bookingId ? `LỊCH #${r.MaLichHen || r.bookingId}` : 'SALON')));
          const isProdTarget = Boolean(r.MaSanPham || r.productId || r.MaDonHang || r.orderId);
          return {
            ...r,
            _id: code,
            _shortCode: shortCode,
            _stars: stars,
            _isHidden: isHidden,
            _replyText: replyText,
            _targetBadge: targetBadge,
            _targetName: r.targetName || 'Omni Salon',
            _isProdTarget: isProdTarget
          };
        });

        const totalAll = allReviews.length;
        const avgAll = totalAll > 0
          ? (allReviews.reduce((s, r) => s + r._stars, 0) / totalAll).toFixed(1)
          : '0.0';
        const hiddenCount = allReviews.filter(r => r._isHidden).length;
        const repliedCount = allReviews.filter(r => Boolean(r._replyText)).length;

        const filtered = allReviews.filter(r => {
          if (this.auditReviewStarFilter && this.auditReviewStarFilter !== 'all') {
            if (String(r._stars) !== String(this.auditReviewStarFilter)) return false;
          }
          if (this.auditReviewStatusFilter && this.auditReviewStatusFilter !== 'all') {
            if (this.auditReviewStatusFilter === 'visible' && r._isHidden) return false;
            if (this.auditReviewStatusFilter === 'hidden' && !r._isHidden) return false;
            if (this.auditReviewStatusFilter === 'replied' && !r._replyText) return false;
            if (this.auditReviewStatusFilter === 'unreplied' && r._replyText) return false;
          }
          if (this.auditReviewTypeFilter && this.auditReviewTypeFilter !== 'all') {
            if (this.auditReviewTypeFilter === 'product' && !r._isProdTarget) return false;
            if (this.auditReviewTypeFilter === 'service' && r._isProdTarget) return false;
          }
          if (!q) return true;
          const hay = `${r._id} ${r._shortCode} ${r.customerName || ''} ${r.customerPhone || ''} ${r.comment || r.NoiDung || ''} ${r._targetBadge} ${r._targetName}`.toLowerCase();
          return hay.includes(q);
        });

        const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
        if (this.auditPage > totalPages) this.auditPage = totalPages;
        const paged = filtered.slice((this.auditPage - 1) * this.pageSize, this.auditPage * this.pageSize);

        return `
          <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 10px 16px; margin-bottom: 14px; background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 10px; font-size: 13px; color: var(--text-secondary);">
            <span>Tổng: <strong style="color: var(--text-primary);">${totalAll}</strong> đánh giá</span>
            <span style="color: var(--border-color);">|</span>
            <span>Điểm TB: <strong style="color: #F59E0B;">${avgAll}★</strong></span>
            <span style="color: var(--border-color);">|</span>
            <span>Đang ẩn: <strong style="color: ${hiddenCount > 0 ? '#EF4444' : 'var(--text-primary)'};">${hiddenCount}</strong></span>
            <span style="color: var(--border-color);">|</span>
            <span>Đã phản hồi: <strong style="color: #10B981;">${repliedCount}</strong></span>
          </div>

          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%;">
                <thead>
                  <tr>
                    <th style="width: 64px; padding: 10px 8px;">MÃ ĐG</th>
                    <th style="padding: 10px 8px;">KHÁCH HÀNG</th>
                    <th style="padding: 10px 8px;">ĐỐI TƯỢNG</th>
                    <th style="padding: 10px 8px;">ĐÁNH GIÁ</th>
                    <th style="padding: 10px 8px; min-width: 190px;">NỘI DUNG NHẬN XÉT</th>
                    <th style="padding: 10px 8px;">THỜI GIAN</th>
                    <th style="padding: 10px 8px;">TRẠNG THÁI</th>
                    <th style="text-align: center; width: 175px; padding: 10px 8px;">KIỂM DUYỆT</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.length === 0 ? `
                    <tr>
                      <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        Chưa có đánh giá nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ` : paged.map(r => {
          const isSelected = this.selectedAuditRowId === r._id;
          return `
                      <tr id="auditRow_${r._id}"
                          class="admin-branch-table-row ${isSelected ? 'is-selected' : ''}"
                          onclick="AdminWeb.onAuditRowClick('reviews', '${this.escapeHtml(r._id)}', event)"
                          style="cursor: pointer; ${isSelected ? 'background: rgba(197, 155, 39, 0.14); box-shadow: inset 3px 0 0 #C59B27;' : ''}">
                        <td style="font-family: monospace; font-size: 12px; font-weight: 700; color: var(--text-primary); padding: 10px 8px; white-space: nowrap;">
                          ${this.escapeHtml(r._shortCode)}
                        </td>
                        <td style="padding: 10px 8px; white-space: nowrap;">
                          <div style="font-weight: 800; color: var(--text-primary); font-size: 12.5px;">${this.escapeHtml(r.customerName || 'Khách Hàng')}</div>
                          ${r.customerPhone ? `<div style="font-size: 11px; color: var(--text-secondary);">${this.escapeHtml(r.customerPhone)}</div>` : ''}
                        </td>
                        <td style="padding: 10px 8px; max-width: 140px;">
                          <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 800; margin-bottom: 3px; ${r._isProdTarget ? 'background: rgba(16, 185, 129, 0.14); color: #059669;' : 'background: rgba(14, 165, 233, 0.14); color: #0284C7;'}">
                            ${this.escapeHtml(r._targetBadge)}
                          </span>
                          <div style="font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${this.escapeHtml(r._targetName)}
                          </div>
                        </td>
                        <td style="padding: 10px 8px; white-space: nowrap;">
                          <div style="color: #F59E0B; font-size: 12.5px; letter-spacing: 1px;">${'★'.repeat(r._stars)}${'☆'.repeat(5 - r._stars)}</div>
                          <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-top: 2px;">${r._stars.toFixed(1)} / 5</div>
                        </td>
                        <td style="padding: 10px 8px; max-width: 230px;">
                          <div style="font-size: 12px; color: var(--text-primary); line-height: 1.45;">
                            ${this.escapeHtml(r.comment || r.NoiDung || '')}
                          </div>
                          ${r._replyText ? `
                            <div style="margin-top: 6px; padding: 4px 8px; border-radius: 6px; background: rgba(197, 155, 39, 0.12); border-left: 2px solid #C59B27; font-size: 11px; color: var(--text-secondary);">
                              <strong style="color: #8A6208;">Phản hồi:</strong> ${this.escapeHtml(r._replyText)}
                            </div>
                          ` : ''}
                        </td>
                        <td style="white-space: nowrap; font-size: 11.5px; color: var(--text-secondary); padding: 10px 8px; font-variant-numeric: tabular-nums;">
                          ${this._formatTableDateTime(r.date || r.NgayDanhGia)}
                        </td>
                        <td style="padding: 10px 8px; white-space: nowrap;">
                          <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                            <span style="padding: 3px 9px; border-radius: 9999px; font-size: 11px; font-weight: 700; ${r._isHidden ? 'background: rgba(239, 68, 68, 0.12); color: #DC2626;' : 'background: rgba(16, 185, 129, 0.14); color: #059669;'}">
                              ${r._isHidden ? 'Đã ẩn' : 'Hiển thị'}
                            </span>
                            ${r._replyText ? `
                              <span style="padding: 2px 8px; border-radius: 9999px; font-size: 10.5px; font-weight: 700; background: rgba(16, 185, 129, 0.1); color: #059669;">
                                ✓ Đã phản hồi
                              </span>
                            ` : ''}
                          </div>
                        </td>
                        <td style="text-align: center; padding: 10px 8px; white-space: nowrap;" onclick="event.stopPropagation()">
                          <div style="display: inline-flex; gap: 5px; align-items: center;">
                            <button type="button" class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px; cursor: pointer;"
                                    onclick="AdminWeb.openReplyReviewModal('${this.escapeHtml(r._id)}')">
                              ${r._replyText ? 'Sửa phản hồi' : 'Phản hồi'}
                            </button>
                            <button type="button" class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px; cursor: pointer; ${r._isHidden ? 'color: #059669;' : ''}"
                                    onclick="AdminWeb.toggleReviewStatus('${this.escapeHtml(r._id)}', '${r._isHidden ? 'Hiển thị' : 'Đã ẩn'}')">
                              ${r._isHidden ? 'Hiện' : 'Ẩn'}
                            </button>
                            <button type="button" class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px; color: #DC2626; cursor: pointer;"
                                    onclick="AdminWeb.deleteReviewAdmin('${this.escapeHtml(r._id)}')">
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
            ${this._renderPaginationControls(this.auditPage, totalPages, filtered.length, 'AdminWeb.setAuditPage', 'đánh giá')}
          </div>
        `;
      }

      return '';
    },
    // Modals & operations for audit
    openUserRoleModal(userId) {
      if (!userId) return;
      const users = (window.store && typeof window.store.getUsers === 'function') ? window.store.getUsers() : [];
      const user = users.find(u => u.id === userId || u.MaTaiKhoan === userId || u.username === userId) || { id: userId, username: userId };
      const currentRole = this.getUserRoleCode(user);
      if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') {
        if (window.UICommon) window.UICommon.showToast('Không thể thay đổi vai trò Quản Trị Viên tối cao.', 'warning');
        return;
      }
      const currentBranch = user.branchId || user.MaChiNhanh || '';
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];

      this._openModal(`
        <div style="padding: 12px 8px; max-width: 480px; margin: 0 auto;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(197, 155, 39, 0.15); border: 2px solid rgba(197, 155, 39, 0.4); display: flex; align-items: center; justify-content: center; color: var(--brand-accent);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h3 style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0;">
                Phân Quyền Tài Khoản
              </h3>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                Cập nhật vai trò và phạm vi quản lý cho @${this.escapeHtml(user.username || userId)}
              </div>
            </div>
          </div>

          <form onsubmit="event.preventDefault(); AdminWeb.submitUserRoleChange('${this.escapeHtml(userId)}');">
            <div style="margin-bottom: 14px;">
              <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                Tài Khoản / Họ Tên:
              </label>
              <input type="text" class="form-control-custom" readonly
                     style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); padding: 0 12px;"
                     value="${this.escapeHtml(user.fullName || user.username || userId)} (@${this.escapeHtml(user.username || userId)})">
            </div>

            <div style="margin-bottom: 14px;">
              <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                Vai Trò Phân Quyền: <span style="color: #ef4444;">*</span>
              </label>
              <select id="userModalRoleSelect" class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;">
                <option value="BRANCH_MANAGER" ${currentRole === 'BRANCH_MANAGER' ? 'selected' : ''}>Quản Lý Chi Nhánh (BRANCH_MANAGER)</option>
                <option value="CASHIER" ${currentRole === 'CASHIER' ? 'selected' : ''}>Thu Ngân POS (CASHIER)</option>
                <option value="BARBER" ${currentRole === 'BARBER' ? 'selected' : ''}>Thợ Cắt Tóc / Barber (BARBER)</option>
                <option value="CUSTOMER" ${currentRole === 'CUSTOMER' ? 'selected' : ''}>Khách Hàng (CUSTOMER)</option>
              </select>
            </div>

            <div style="margin-bottom: 20px;">
              <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                Chi Nhánh Trực Thuộc:
              </label>
              <select id="userModalBranchSelect" class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;">
                <option value="" ${!currentBranch ? 'selected' : ''}>Toàn Hệ Thống (Tất Cả Cơ Sở)</option>
                ${branches.map(b => `
                  <option value="${b.id}" ${currentBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>
                `).join('')}
              </select>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 14px;">
              <button type="button" class="pill-btn-outline" style="height: 38px; padding: 0 16px; font-size: 13px; font-weight: 600;" onclick="AdminWeb._closeModal()">
                Hủy Bỏ
              </button>
              <button type="submit" class="btn-submit-terracotta" style="height: 38px; padding: 0 20px; font-size: 13px; font-weight: 700; border-radius: 8px; background: var(--brand-accent); color: #141413; border: none; cursor: pointer;">
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      `);
    },

    async submitUserRoleChange(userId) {
      const roleSel = document.getElementById('userModalRoleSelect');
      const branchSel = document.getElementById('userModalBranchSelect');
      if (!roleSel) return;
      const newRole = roleSel.value;
      const newBranch = branchSel ? branchSel.value : '';

      if (window.store && typeof window.store.updateUserRole === 'function') {
        await window.store.updateUserRole(userId, newRole);
      }
      const roleMap = {
        'SUPER_ADMIN': 'Quản trị viên',
        'ADMIN': 'Quản trị viên',
        'BRANCH_MANAGER': 'Quản lý',
        'CASHIER': 'Thu ngân',
        'BARBER': 'Nhân viên',
        'CUSTOMER': 'Khách hàng'
      };
      const chucVuMap = {
        'SUPER_ADMIN': 'Quản trị viên',
        'ADMIN': 'Quản trị viên',
        'BRANCH_MANAGER': 'Quản lý chi nhánh',
        'CASHIER': 'Thu ngân',
        'BARBER': 'Thợ chính',
        'CUSTOMER': 'Khách hàng'
      };
      const users = (window.store && typeof window.store.getUsers === 'function') ? window.store.getUsers() : [];
      const user = users.find(u => u.id === userId || u.MaTaiKhoan === userId || u.username === userId);
      if (user) {
        user.role = newRole;
        user.VaiTro = roleMap[newRole] || newRole;
        user.roleName = roleMap[newRole] || newRole;
        if (newRole === 'CUSTOMER') {
          user.ChucVu = 'Khách hàng';
          user.branchId = null;
          user.branchName = 'Khách Hàng';
          user.TenChiNhanh = 'Khách Hàng';
          user.MaNhanVien = null;
          user.staffId = null;
        } else {
          if (chucVuMap[newRole]) user.ChucVu = chucVuMap[newRole];
          user.branchId = newBranch;
          user.MaChiNhanh = newBranch;
        }
      }

      this._closeModal();
      if (window.store && typeof window.store.syncWithLiveServer === 'function') {
        await window.store.syncWithLiveServer();
      }
      if (window.UICommon) window.UICommon.showToast(`Đã cập nhật phân quyền tài khoản [${userId}] sang ${roleMap[newRole] || newRole} thành công!`, 'success');
      this._updateAuditContentOnly();
    },

    openAddUserModal() {
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];

      this._openModal(`
        <div style="padding: 12px 8px; max-width: 500px; margin: 0 auto;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(197, 155, 39, 0.15); border: 2px solid rgba(197, 155, 39, 0.4); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--brand-accent); font-weight: 800;">
              +
            </div>
            <div>
              <h3 style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0;">
                Thêm Tài Khoản Mới
              </h3>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                Tạo tài khoản nhân viên / quản lý / khách hàng vào CSDL
              </div>
            </div>
          </div>

          <form onsubmit="event.preventDefault(); AdminWeb.submitNewUser();">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                  Tên Đăng Nhập: <span style="color: #ef4444;">*</span>
                </label>
                <input type="text" id="newUname" class="form-control-custom" required
                       style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;"
                       placeholder="VD: user_nv25">
              </div>
              <div>
                <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                  Họ Và Tên: <span style="color: #ef4444;">*</span>
                </label>
                <input type="text" id="newFname" class="form-control-custom" required
                       style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;"
                       placeholder="VD: Nguyễn Văn A">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                  Số Điện Thoại: <span style="color: #ef4444;">*</span>
                </label>
                <input type="tel" id="newPhone" class="form-control-custom" required
                       style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;"
                       placeholder="090xxxxxxx">
              </div>
              <div>
                <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                  Mật Khẩu Khởi Tạo:
                </label>
                <input type="password" id="newPass" class="form-control-custom"
                       style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;"
                       placeholder="Tối thiểu 6 ký tự (hoặc để trống tự sinh)">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px;">
              <div>
                <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                  Vai Trò: <span style="color: #ef4444;">*</span>
                </label>
                <select id="newRole" class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;">
                  <option value="BARBER">Thợ / Barber</option>
                  <option value="CASHIER">Thu Ngân POS</option>
                  <option value="BRANCH_MANAGER">Quản Lý Chi Nhánh</option>
                  <option value="CUSTOMER">Khách Hàng</option>
                </select>
              </div>
              <div>
                <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                  Chi Nhánh:
                </label>
                <select id="newBranch" class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;">
                  <option value="">Toàn Hệ Thống</option>
                  ${branches.map(b => `
                    <option value="${b.id}">${this.escapeHtml(this._getBranchShortName(b))}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 14px;">
              <button type="button" class="pill-btn-outline" style="height: 38px; padding: 0 16px; font-size: 13px; font-weight: 600;" onclick="AdminWeb._closeModal()">
                Hủy Bỏ
              </button>
              <button type="submit" class="btn-submit-terracotta" style="height: 38px; padding: 0 20px; font-size: 13px; font-weight: 700; border-radius: 8px; background: var(--brand-accent); color: #141413; border: none; cursor: pointer;">
                Thêm Tài Khoản
              </button>
            </div>
          </form>
        </div>
      `);
    },

    async submitNewUser() {
      const uname = (document.getElementById('newUname')?.value || '').trim().toLowerCase();
      const fname = (document.getElementById('newFname')?.value || '').trim();
      const phone = (document.getElementById('newPhone')?.value || '').trim();
      const rawPassword = (document.getElementById('newPass')?.value || '').trim();
      const role = document.getElementById('newRole')?.value || 'BARBER';
      const branch = document.getElementById('newBranch')?.value || 'ALL';

      if (!uname || !fname || !phone) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng điền đầy đủ Tên đăng nhập, Họ tên và Số điện thoại!', 'warning');
        return;
      }
      if (rawPassword && rawPassword.length < 6) {
        if (window.UICommon) window.UICommon.showToast('Mật khẩu khởi tạo phải có ít nhất 6 ký tự!', 'warning');
        return;
      }

      const users = (window.store && window.store.state && window.store.state.users) || [];
      const exists = users.some(u => (u.username || u.TenDangNhap || '').toLowerCase() === uname);
      if (exists) {
        if (window.SalonToast) window.SalonToast.show('Tên đăng nhập đã tồn tại trong hệ thống', 'warning');
        return;
      }

      const roleMap = {
        'SUPER_ADMIN': 'Quản trị viên',
        'ADMIN': 'Quản trị viên',
        'BRANCH_MANAGER': 'Quản lý',
        'CASHIER': 'Thu ngân',
        'BARBER': 'Nhân viên',
        'CUSTOMER': 'Khách hàng'
      };
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const branchObj = branches.find(b => b.id === branch);
      const branchName = branchObj ? branchObj.name : (branch === 'ALL' ? 'Toàn Hệ Thống' : branch);

      const isStaff = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'BARBER'].includes(role);
      let nextNum = 1;
      const prefix = isStaff ? 'TK_NV' : 'TK_KH';
      users.forEach(u => {
        const idStr = String(u.id || u.MaTaiKhoan || '');
        if (idStr.startsWith(prefix)) {
          const m = idStr.match(new RegExp(`^${prefix}(\\d+)`, 'i'));
          if (m) {
            const num = parseInt(m[1], 10);
            if (!isNaN(num) && num >= nextNum) nextNum = num + 1;
          }
        }
      });
      if (isStaff && nextNum <= 80) nextNum = 81;
      if (!isStaff && nextNum <= 22) nextNum = 23;

      const newId = `${prefix}${nextNum < 10 ? '0' + nextNum : nextNum}`;
      const newUser = {
        id: newId,
        MaTaiKhoan: newId,
        username: uname,
        TenDangNhap: uname,
        fullName: fname,
        HoTen: fname,
        phone: phone,
        SoDienThoai: phone,
        role: role,
        VaiTro: roleMap[role] || role,
        roleName: roleMap[role] || role,
        branchId: branch,
        MaChiNhanh: branch,
        branchName,
        isActive: true,
        TrangThai: 'Hoạt động',
        createdAt: new Date().toISOString()
      };

      if (!window.store.state.users) window.store.state.users = [];
      window.store.state.users.unshift(newUser);
      if (window.store.saveState) window.store.saveState();

      try {
        const authHeader = (window.Auth && typeof window.Auth.getAuthHeader === 'function') ? window.Auth.getAuthHeader() : {};
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({
            username: uname,
            fullName: fname,
            phone: phone,
            ...(rawPassword ? { password: rawPassword } : {}),
            role: role,
            branchId: branch
          })
        });
        const resData = await res.json().catch(() => null);
        if (!res.ok || !resData || resData.success === false) {
          window.store.state.users = (window.store.state.users || []).filter(u => u.id !== newUser.id);
          if (window.store.saveState) window.store.saveState();
          if (window.SalonToast) window.SalonToast.show(resData?.message || 'Không có quyền hoặc lỗi tạo tài khoản.', 'error');
          return;
        }
        if (resData.user && resData.user.id) {
          newUser.id = resData.user.id;
          newUser.MaTaiKhoan = resData.user.MaTaiKhoan;
          if (resData.user.MaNhanVien) newUser.MaNhanVien = resData.user.MaNhanVien;
          if (resData.user.MaKhachHang) newUser.MaKhachHang = resData.user.MaKhachHang;
          if (window.store.saveState) window.store.saveState();
        }
      } catch (err) {
        if (window.SalonToast) window.SalonToast.show('Lỗi kết nối máy chủ khi tạo tài khoản.', 'error');
        return;
      }

      if (typeof window.store.logAudit === 'function') {
        window.store.logAudit('CREATE_USER', `Tài khoản: ${uname}`, `Thêm tài khoản mới: ${fname} (${role})`);
      }

      this._closeModal();
      if (window.SalonToast) window.SalonToast.show(`Đã thêm tài khoản "${uname}" [${newUser.id}] thành công`, 'success');
      this._updateAuditContentOnly();
      if (window.store && typeof window.store.syncWithLiveServer === 'function') {
        window.store.syncWithLiveServer();
      }
    },

    openAuditLogDetailModal(logId) {
      const logs = (window.store && typeof window.store.getAuditLogs === 'function') ? window.store.getAuditLogs() : [];
      const log = logs.find((l, idx) => l.id === logId || `log_${idx}_${l.timestamp}` === logId) || { id: logId, action: 'Sự kiện kiểm toán', details: 'Chi tiết sự kiện' };
      const opRole = this._extractAuditOperatorRole(log);
      const roleBadge = this._getAuditRoleBadge(opRole);

      this._openModal(`
        <div style="padding: 12px 8px; max-width: 520px; margin: 0 auto;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(197, 155, 39, 0.15); border: 2px solid rgba(197, 155, 39, 0.4); display: flex; align-items: center; justify-content: center; color: var(--brand-accent);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div>
              <h3 style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0;">
                Chi Tiết Sự Kiện Kiểm Toán
              </h3>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                Mã sự kiện: ${this.escapeHtml(log.id || logId)}
              </div>
            </div>
          </div>

          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <span style="font-size: 11px; color: var(--text-secondary); display: block;">Thời Gian:</span>
                <strong style="font-size: 12.5px; color: var(--text-primary); font-variant-numeric: tabular-nums;">
                  ${this._formatTableDateTime(log.timestamp)}
                </strong>
              </div>
              <div>
                <span style="font-size: 11px; color: var(--text-secondary); display: block;">Hành Động:</span>
                <strong style="font-size: 12.5px; color: #60a5fa;">
                  ${this.escapeHtml(log.action || '—')}
                </strong>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div>
                <span style="font-size: 11px; color: var(--text-secondary); display: block;">Người Thao Tác:</span>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                  <strong style="font-size: 12.5px; color: var(--text-primary);">
                    ${this.escapeHtml(log.operatorName || 'Hệ Thống')}
                  </strong>
                  <span style="display: inline-flex; align-items: center; font-size: 11px; font-weight: 800; color: ${roleBadge.color}; background: ${roleBadge.bg}; border: 1px solid ${roleBadge.border}; padding: 1px 7px; border-radius: 9999px;">
                    ${this.escapeHtml(opRole)}
                  </span>
                </div>
              </div>
              <div>
                <span style="font-size: 11px; color: var(--text-secondary); display: block;">Đối Tượng Tác Động:</span>
                <span style="font-family: monospace; font-size: 12px; font-weight: 700; color: #f59e0b;">
                  ${this.escapeHtml(log.entity || '—')}
                </span>
              </div>
            </div>

            <div>
              <span style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 4px;">Nội Dung Chi Tiết:</span>
              <div style="font-size: 13px; color: var(--text-primary); line-height: 1.5; background: var(--surface-elevated); padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color);">
                ${this.escapeHtml(log.details || 'Không có mô tả chi tiết.')}
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="button" class="pill-btn-outline" style="height: 36px; padding: 0 18px; font-size: 12.5px; font-weight: 600;" onclick="AdminWeb._closeModal()">
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      `);
    },

    openInvoiceDetailModal(invId) {
      const invoices = (window.store && typeof window.store.getInvoices === 'function') ? window.store.getInvoices() : [];
      const inv = invoices.find(i => (i.id || i.MaHoaDon) === invId);
      if (!inv) return;

      const { sTotal, pTotal, total, services, products } = this.computeInvoiceFinancials(inv);
      const isPaid = this._isInvoicePaid(inv);

      this._openModal(`
        <div style="padding: 12px 8px; max-width: 520px; margin: 0 auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0;">
                Hóa Đơn ${this.escapeHtml(inv.id || inv.MaHoaDon)}
              </h3>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                ${this._formatTableDateTime(inv.createdDate || inv.NgayLap)} · ${this.escapeHtml(inv.branchName || 'Chi Nhánh Omni')}
              </div>
            </div>
            <span class="status-pill ${isPaid ? 'status-completed' : 'status-cancelled'}" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px;">
              ${this.escapeHtml(inv.status || inv.TrangThai || (isPaid ? 'Đã thanh toán' : 'Chờ xử lý'))}
            </span>
          </div>

          <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Khách Hàng:</div>
            <strong style="font-size: 14px; color: var(--text-primary);">${this.escapeHtml(inv.customerName || inv.TenKhachHang || 'Khách vãng lai')}</strong>
          </div>

          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--brand-accent); margin-bottom: 8px;">Dịch Vụ &amp; Sản Phẩm:</div>
            ${services.length > 0 ? services.map(s => `
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
                <span>• ${this.escapeHtml(s.name || s.TenDichVu || 'Dịch vụ')}</span>
                <strong>${SalonUtils.formatCurrency(s.price || s.DonGia || 0)}</strong>
              </div>
            `).join('') : (sTotal > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
                <span>• Dịch vụ lẻ tại quầy</span>
                <strong>${SalonUtils.formatCurrency(sTotal)}</strong>
              </div>
            ` : '')}
            ${products.length > 0 ? products.map(p => `
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
                <span>• ${this.escapeHtml(p.name || p.TenSanPham || 'Sản phẩm')} (x${p.qty || p.SoLuong || 1})</span>
                <strong>${SalonUtils.formatCurrency((p.price || p.DonGia || 0) * (p.qty || p.SoLuong || 1))}</strong>
              </div>
            `).join('') : (pTotal > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
                <span>• Sản phẩm tại quầy / Đơn online</span>
                <strong>${SalonUtils.formatCurrency(pTotal)}</strong>
              </div>
            ` : '')}
            ${services.length === 0 && products.length === 0 && sTotal === 0 && pTotal === 0 ? `
              <div style="font-size: 12.5px; color: var(--text-secondary); font-style: italic;">Không có thông tin chi tiết</div>
            ` : ''}
            <div style="border-top: 1px dashed var(--border-color); margin-top: 8px; padding-top: 8px; display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>Tiền dịch vụ:</span>
                <span>${SalonUtils.formatCurrency(sTotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>Tiền sản phẩm:</span>
                <span>${SalonUtils.formatCurrency(pTotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 4px;">
                <strong>Tổng Thanh Toán:</strong>
                <strong style="color: #10b981; font-size: 16px;">${SalonUtils.formatCurrency(total)}</strong>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; color: var(--text-secondary);">PT: ${this.escapeHtml(inv.paymentMethod || 'VietQR')}</span>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="pill-btn-outline" style="height: 36px; padding: 0 16px; font-size: 12.5px; font-weight: 600;" onclick="window.print()">
                In Hóa Đơn
              </button>
              <button type="button" class="btn-submit-terracotta" style="height: 36px; padding: 0 16px; font-size: 12.5px; font-weight: 700; border-radius: 8px; background: var(--brand-accent); color: #141413; border: none; cursor: pointer;" onclick="AdminWeb._closeModal()">
                Đóng
              </button>
            </div>
          </div>
        </div>
      `);
    },

    exportAuditLogs() {
      const logs = (window.store && typeof window.store.getAuditLogs === 'function') ? window.store.getAuditLogs() : [];
      let csv = 'Timestamp,Action,Operator,Role,Entity,Details\n';
      const escapeCsv = (val) => `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
      logs.forEach(l => {
        const opRole = this._extractAuditOperatorRole(l);
        csv += `${escapeCsv(l.timestamp)},${escapeCsv(l.action)},${escapeCsv(l.operatorName || 'Hệ Thống')},${escapeCsv(opRole)},${escapeCsv(l.entity)},${escapeCsv(l.details)}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `nhat_ky_kiem_toan_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (window.UICommon) window.UICommon.showToast('Đã xuất file báo cáo nhật ký kiểm toán thành công!', 'success');
    },

    exportInvoicesReport() {
      const invoices = (window.store && typeof window.store.getInvoices === 'function') ? window.store.getInvoices() : [];
      let csv = 'InvoiceId,Branch,Customer,Date,ServiceTotal,ProductTotal,Total,Status,PaymentMethod\n';
      const escapeCsv = (val) => `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
      invoices.forEach(i => {
        const { sTotal, pTotal, total } = this.computeInvoiceFinancials(i);
        csv += `${escapeCsv(i.id || i.MaHoaDon || '')},${escapeCsv(i.branchName || '')},${escapeCsv(i.customerName || '')},${escapeCsv(i.createdDate || i.NgayLap || '')},"${sTotal}","${pTotal}","${total}",${escapeCsv(i.status || '')},${escapeCsv(i.paymentMethod || '')}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `bao_cao_hoa_don_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (window.UICommon) window.UICommon.showToast('Đã xuất file báo cáo doanh thu hóa đơn thành công!', 'success');
    },

    exportOrdersReport() {
      const orders = (window.store && typeof window.store.getOrders === 'function') ? window.store.getOrders() : [];
      let csv = 'OrderId,Customer,Phone,Date,Total,Delivery,PaymentStatus,OrderStatus\n';
      orders.forEach(o => {
        csv += `"${o.id || o.orderCode || ''}","${o.customerName || ''}","${o.customerPhone || ''}","${o.createdAt || ''}","${o.totalAmount || 0}","${o.deliveryType || ''}","${o.paymentStatus || ''}","${o.orderStatus || o.status || ''}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `danh_sach_don_hang_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (window.UICommon) window.UICommon.showToast('Đã xuất danh sách đơn hàng thành công!', 'success');
    },

    toggleNotificationRead(notifId) {
      const notifications = (window.store && typeof window.store.getNotifications === 'function') ? window.store.getNotifications() : [];
      const n = notifications.find(it => (it.id || it.MaThongBao) === notifId);
      if (n) {
        n.isRead = !n.isRead;
        n.DaDoc = n.isRead;
      }
      this._updateAuditContentOnly();
    },

    markAllNotificationsRead() {
      const notifications = (window.store && typeof window.store.getNotifications === 'function') ? window.store.getNotifications() : [];
      notifications.forEach(n => {
        n.isRead = true;
        n.DaDoc = true;
      });
      if (window.UICommon) window.UICommon.showToast('Đã đánh dấu đọc tất cả thông báo hệ thống!', 'success');
      this._updateAuditContentOnly();
    },

    async updateOrderStatus(orderId, newStatus) {
      if (!orderId || !newStatus) return;
      const statusLabels = {
        'Pending': 'Chờ xác nhận',
        'Processing': 'Đang chuẩn bị / đóng gói',
        'Ready': 'Sẵn sàng tại quầy',
        'Delivering': 'Đang giao hàng',
        'Completed': 'Hoàn tất / Đã nhận',
        'Cancelled': 'Đã hủy'
      };
      const label = statusLabels[newStatus] || newStatus;

      if (window.store && typeof window.store.updateOrderStatus === 'function') {
        const res = await window.store.updateOrderStatus(orderId, newStatus);
        if (res && res.success) {
          if (window.UICommon) window.UICommon.showToast(res.message || `Đã chuyển đơn ${orderId} sang "${label}"`, 'success');
          this.refreshAuditView();
        } else {
          if (window.UICommon) window.UICommon.showToast(res?.error || res?.message || 'Lỗi khi cập nhật trạng thái đơn hàng!', 'error');
          this.refreshAuditView();
        }
      }
    },

    async fetchAdminReviews(silent = true) {
      try {
        const authHeader = (window.Auth && typeof window.Auth.getAuthHeader === 'function') ? window.Auth.getAuthHeader() : {};
        const res = await fetch('/api/reviews?include_hidden=true', {
          headers: { ...authHeader }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          this._adminReviewsList = data;
          if (window.store && window.store.state) {
            window.store.state.reviews = data;
          }
          if ((this.auditSubTab || '') === 'reviews') {
            this._updateAuditContentOnly();
          }
          if (!silent && window.UICommon) {
            window.UICommon.showToast('Đã làm mới danh sách đánh giá!', 'success', 1500);
          }
        }
      } catch (e) {
        if (!silent && window.UICommon) {
          window.UICommon.showToast('Không thể tải lại đánh giá từ máy chủ.', 'error');
        }
      }
    },

    _findAdminReviewById(reviewId) {
      const list = Array.isArray(this._adminReviewsList)
        ? this._adminReviewsList
        : ((window.store && typeof window.store.getReviews === 'function') ? window.store.getReviews() : []);
      return list.find(r => String(r.id || r.MaDanhGia) === String(reviewId)) || null;
    },

    openReviewDetailModal(reviewId) {
      const r = this._findAdminReviewById(reviewId);
      if (!r) return;
      const stars = Number(r.rating || r.SoSao || 5);
      const reply = (r.adminReply || r.PhanHoiAdmin || '').trim();
      this._openModal(`
        <div style="padding: 12px 8px; max-width: 500px; margin: 0 auto;">
          <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 800; color: var(--text-primary);">
            Chi Tiết Đánh Giá #${this.escapeHtml(String(r.id || r.MaDanhGia))}
          </h3>
          <div style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px; font-size: 13px; line-height: 1.65; margin-bottom: 14px;">
            <div><strong>Khách hàng:</strong> ${this.escapeHtml(r.customerName || 'Khách Hàng')} ${r.customerPhone ? `(${this.escapeHtml(r.customerPhone)})` : ''}</div>
            <div><strong>Đối tượng:</strong> ${this.escapeHtml(r.targetName || r.MaSanPham || r.MaDichVu || r.MaDonHang || r.MaLichHen || 'Omni Salon')}</div>
            <div><strong>Số sao:</strong> <span style="color: #F59E0B;">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span> (${stars}/5)</div>
            <div><strong>Thời gian:</strong> ${this._formatTableDateTime(r.date || r.NgayDanhGia)}</div>
            <div><strong>Trạng thái:</strong> ${this.escapeHtml(r.status || r.TrangThai || 'Hiển thị')}</div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
              <strong>Nội dung nhận xét:</strong><br>${this.escapeHtml(r.comment || r.NoiDung || '')}
            </div>
            ${reply ? `
              <div style="margin-top: 8px; padding: 8px 10px; border-radius: 6px; background: rgba(197, 155, 39, 0.12); border-left: 3px solid #C59B27;">
                <strong>Phản hồi của Salon:</strong><br>${this.escapeHtml(reply)}
              </div>
            ` : ''}
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="pill-btn-outline" style="height: 36px; padding: 0 14px;" onclick="AdminWeb._closeModal(); AdminWeb.openReplyReviewModal('${this.escapeHtml(String(r.id || r.MaDanhGia))}')">
              ${reply ? 'Sửa phản hồi' : 'Phản hồi'}
            </button>
            <button type="button" class="btn-submit-terracotta" style="height: 36px; padding: 0 18px; background: #C59B27; color: #141413; font-weight: 700; border-radius: 8px;" onclick="AdminWeb._closeModal()">
              Đóng
            </button>
          </div>
        </div>
      `);
    },

    openReplyReviewModal(reviewId) {
      const r = this._findAdminReviewById(reviewId);
      const currentReply = (r && (r.adminReply || r.PhanHoiAdmin)) ? (r.adminReply || r.PhanHoiAdmin) : '';
      this._openModal(`
        <div style="padding: 12px 8px; max-width: 480px; margin: 0 auto;">
          <h3 style="margin: 0 0 6px; font-size: 18px; font-weight: 800; color: var(--text-primary);">
            ${currentReply ? 'Chỉnh sửa phản hồi đánh giá' : 'Phản hồi đánh giá khách hàng'}
          </h3>
          <div style="font-size: 12.5px; color: var(--text-secondary); margin-bottom: 14px;">
            Khách hàng: <strong>${this.escapeHtml(r?.customerName || 'Khách Hàng')}</strong> • "${this.escapeHtml((r?.comment || r?.NoiDung || '').slice(0, 80))}"
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 12.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">Nội dung phản hồi từ Omni Salon:</label>
            <textarea id="adminReviewReplyInput" rows="4" class="form-control-custom" style="width: 100%; border-radius: 8px; padding: 10px; font-size: 13.5px;" placeholder="Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ / sản phẩm tại Omni Salon...">${this.escapeHtml(currentReply)}</textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="pill-btn-outline" style="height: 38px; padding: 0 16px;" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
            <button type="button" class="btn-submit-terracotta" style="height: 38px; padding: 0 18px; background: #C59B27; color: #141413; font-weight: 800; border-radius: 8px;" onclick="AdminWeb.submitReviewReply('${this.escapeHtml(String(reviewId))}')">
              Lưu phản hồi
            </button>
          </div>
        </div>
      `);
    },

    async submitReviewReply(reviewId) {
      const replyText = (document.getElementById('adminReviewReplyInput')?.value || '').trim();
      if (!replyText) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập nội dung phản hồi!', 'warning');
        return;
      }
      try {
        const authHeader = (window.Auth && typeof window.Auth.getAuthHeader === 'function') ? window.Auth.getAuthHeader() : {};
        const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/reply`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ reply: replyText })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          if (window.UICommon) window.UICommon.showToast(data?.message || 'Không thể lưu phản hồi!', 'error');
          return;
        }
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast('Đã lưu phản hồi đánh giá thành công!', 'success');
        await this.fetchAdminReviews(true);
      } catch (e) {
        if (window.UICommon) window.UICommon.showToast('Lỗi kết nối máy chủ khi phản hồi đánh giá!', 'error');
      }
    },

    async toggleReviewStatus(reviewId, nextStatus) {
      try {
        const authHeader = (window.Auth && typeof window.Auth.getAuthHeader === 'function') ? window.Auth.getAuthHeader() : {};
        const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ status: nextStatus })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          if (window.UICommon) window.UICommon.showToast(data?.message || 'Không thể đổi trạng thái đánh giá!', 'error');
          return;
        }
        if (window.UICommon) window.UICommon.showToast(data.message || `Đã chuyển sang "${nextStatus}"`, 'success');
        await this.fetchAdminReviews(true);
      } catch (e) {
        if (window.UICommon) window.UICommon.showToast('Lỗi kết nối khi cập nhật trạng thái đánh giá!', 'error');
      }
    },

    async deleteReviewAdmin(reviewId) {
      if (!confirm(`Xác nhận xóa vĩnh viễn đánh giá ${reviewId}?`)) return;
      try {
        const authHeader = (window.Auth && typeof window.Auth.getAuthHeader === 'function') ? window.Auth.getAuthHeader() : {};
        const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
          method: 'DELETE',
          headers: { ...authHeader }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          if (window.UICommon) window.UICommon.showToast(data?.message || 'Không thể xóa đánh giá!', 'error');
          return;
        }
        if (window.UICommon) window.UICommon.showToast(data.message || `Đã xóa đánh giá ${reviewId}!`, 'success');
        await this.fetchAdminReviews(true);
      } catch (e) {
        if (window.UICommon) window.UICommon.showToast('Lỗi kết nối khi xóa đánh giá!', 'error');
      }
    },

    exportReviewsReport() {
      const reviews = Array.isArray(this._adminReviewsList)
        ? this._adminReviewsList
        : ((window.store && typeof window.store.getReviews === 'function') ? window.store.getReviews() : []);
      const escapeCsv = (val) => `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
      let csv = 'MaDG,KhachHang,SDT,DoiTuong,SoSao,NoiDung,PhanHoiAdmin,ThoiGian,TrangThai\n';
      reviews.forEach(r => {
        csv += [
          escapeCsv(r.id || r.MaDanhGia || ''),
          escapeCsv(r.customerName || 'Khách Hàng'),
          escapeCsv(r.customerPhone || ''),
          escapeCsv(r.targetName || r.MaSanPham || r.MaDichVu || r.MaDonHang || r.MaLichHen || ''),
          escapeCsv(r.rating || r.SoSao || 5),
          escapeCsv(r.comment || r.NoiDung || ''),
          escapeCsv(r.adminReply || r.PhanHoiAdmin || ''),
          escapeCsv(r.date || r.NgayDanhGia || ''),
          escapeCsv(r.status || r.TrangThai || 'Hiển thị')
        ].join(',') + '\n';
      });
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `danh_sach_danh_gia_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (window.UICommon) window.UICommon.showToast('Đã xuất file danh sách đánh giá thành công!', 'success');
    },

    async confirmOrderPayment(orderId) {
      if (!confirm(`Xác nhận đã nhận đủ tiền thanh toán cho đơn hàng ${orderId}?`)) return;
      if (window.store && typeof window.store.confirmOrderPayment === 'function') {
        const res = await window.store.confirmOrderPayment(orderId, 'VietQR');
        if (res && res.success) {
          if (window.UICommon) window.UICommon.showToast(`Đã xác nhận thanh toán thành công cho đơn hàng ${orderId}!`, 'success');
          this.refreshAuditView();
        } else {
          if (window.UICommon) window.UICommon.showToast(res?.error || 'Lỗi khi xác nhận thanh toán đơn hàng!', 'error');
        }
      }
    },

    refreshAuditView() {
      const content = document.getElementById('adminSubTabContent');
      if (content && this.adminSubTab === 'audit') {
        const input = document.getElementById('adminAuditSearchInput');
        const hadFocus = input && document.activeElement === input;
        const caret = input ? input.selectionStart : null;

        const auditLogs = (window.store && typeof window.store.getAuditLogs === 'function') ? window.store.getAuditLogs() : [];
        content.innerHTML = this.renderAuditTab(auditLogs);

        if (hadFocus) {
          const newInput = document.getElementById('adminAuditSearchInput');
          if (newInput) {
            newInput.focus();
            if (caret !== null) {
              newInput.setSelectionRange(caret, caret);
            }
          }
        }
      }
    },

  });

})(typeof window !== 'undefined' ? window : this);
