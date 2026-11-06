// ============================================================================
// Omni Salon: PHÂN HỆ QUẢN TRỊ - NHẬT KÝ KIỂM TOÁN, HÓA ĐƠN & PHÂN QUYỀN (AUDIT & RBAC)
// File tách độc lập để tối ưu tốc độ và giảm tải IDE
// ============================================================================

(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  Object.assign(window.AdminWeb, {
    switchAuditSubTab(type) {
      this.auditSubTab = type;
      this.auditSearchQuery = '';
      this.auditActionFilter = 'all';
      this.auditRoleFilter = 'all';
      this.auditBranchFilter = 'all';
      this.auditPaymentStatusFilter = 'all';
      this.auditOrderStatusFilter = 'all';
      this.auditNotifStatusFilter = 'all';
      this.selectedAuditRowId = null;
      this.auditPage = 1;
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

    submitInlineNewUser() {
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
        'SUPER_ADMIN': 'Quản Trị Tối Cao',
        'ADMIN': 'Quản trị viên',
        'BRANCH_MANAGER': 'Quản lý',
        'CASHIER': 'Thu ngân',
        'BARBER': 'Nhân viên',
        'CUSTOMER': 'Khách hàng'
      };
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const branchObj = branches.find(b => b.id === branchId);
      const branchName = branchObj ? branchObj.name : (branchId === 'ALL' ? 'Toàn Hệ Thống' : branchId);

      const newId = 'TK_' + (users.length + 1).toString().padStart(2, '0');
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

      if (typeof window.store.logAudit === 'function') {
        window.store.logAudit('CREATE_USER', `Tài khoản: ${username}`, `Thêm tài khoản mới: ${fullName} (${role})`);
      }

      this.isAddingUserInline = false;
      if (window.SalonToast) window.SalonToast.show(`Đã thêm tài khoản "${username}" thành công`, 'success');
      this._updateAuditContentOnly();
    },

    changeUserRoleDirect(userId, newRole) {
      if (!userId || !newRole) return;
      const roleMap = {
        'SUPER_ADMIN': 'Quản Trị Tối Cao',
        'ADMIN': 'Quản trị viên',
        'BRANCH_MANAGER': 'Quản lý',
        'CASHIER': 'Thu ngân',
        'BARBER': 'Nhân viên',
        'CUSTOMER': 'Khách hàng'
      };
      const users = (window.store && window.store.state && window.store.state.users) || [];
      const u = users.find(x => x.id === userId || x.username === userId || x.MaTaiKhoan === userId || x.TenDangNhap === userId);
      if (u) {
        u.role = newRole;
        u.VaiTro = roleMap[newRole] || newRole;
        u.roleName = roleMap[newRole] || newRole;
        if (window.store.saveState) window.store.saveState();
        if (typeof window.store.logAudit === 'function') {
          window.store.logAudit('UPDATE_USER_ROLE', `Tài khoản: ${u.username || u.TenDangNhap || userId}`, `Cập nhật vai trò sang: ${roleMap[newRole] || newRole}`);
        }
      }
      if (window.store && typeof window.store.updateUserRole === 'function') {
        window.store.updateUserRole(userId, newRole);
      }
      if (window.SalonToast) {
        window.SalonToast.show(`Đã cập nhật vai trò cho ${userId} sang ${roleMap[newRole] || newRole}`, 'success');
      }
      this._updateAuditContentOnly();
    },

    changeUserBranchDirect(userId, newBranchId) {
      if (!userId) return;
      const users = (window.store && window.store.state && window.store.state.users) || [];
      const u = users.find(x => x.id === userId || x.username === userId || x.MaTaiKhoan === userId || x.TenDangNhap === userId);
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

    toggleUserActiveDirect(userId) {
      if (!userId) return;
      const users = (window.store && window.store.state && window.store.state.users) || [];
      const u = users.find(x => x.id === userId || x.username === userId || x.MaTaiKhoan === userId || x.TenDangNhap === userId);
      if (u) {
        const rawStatus = (u.TrangThai || '').toString();
        const currentlyActive = !rawStatus.includes('khóa') && !rawStatus.includes('khoa') && rawStatus !== 'inactive' && u.isActive !== false;
        const newActive = !currentlyActive;
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

    deleteUserDirect(userId) {
      if (!userId) return;
      if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userId}" không?`)) {
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
      } catch(e) {
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
        notifications: 'Tìm tiêu đề, nội dung, phân loại thông báo...'
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
                     style="padding-left: 34px !important; padding-right: 28px !important; height: 34px; font-size: 13px; border-radius: 6px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                     placeholder="${placeholder}"
                     value="${this.escapeHtml(this.auditSearchQuery || '')}"
                     oninput="AdminWeb.handleAuditSearch(this.value);">
              <button type="button" id="adminAuditSearchClear"
                      onclick="AdminWeb.clearAuditSearch();"
                      style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px; padding: 4px; display: ${this.auditSearchQuery ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; z-index: 2;"
                      title="Xóa tìm kiếm">✕</button>
            </div>

            <!-- BỘ LỌC CHUYÊN BIỆT CHO TỪNG PHÂN HỆ -->
            ${(() => {
              if (subType === 'logs') {
                return `
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditActionFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${this.auditActionFilter === 'all' ? 'selected' : ''}>Tất cả hành động</option>
                    <option value="BRANCH" ${this.auditActionFilter === 'BRANCH' ? 'selected' : ''}>Chi Nhánh</option>
                    <option value="BOOKING" ${this.auditActionFilter === 'BOOKING' ? 'selected' : ''}>Lịch Hẹn</option>
                    <option value="STOCK" ${this.auditActionFilter === 'STOCK' ? 'selected' : ''}>Kho Hàng</option>
                    <option value="PRODUCT" ${this.auditActionFilter === 'PRODUCT' ? 'selected' : ''}>Sản Phẩm</option>
                    <option value="SERVICE" ${this.auditActionFilter === 'SERVICE' ? 'selected' : ''}>Dịch Vụ</option>
                    <option value="ORDER" ${this.auditActionFilter === 'ORDER' ? 'selected' : ''}>Hóa Đơn / POS</option>
                    <option value="AUTH" ${this.auditActionFilter === 'AUTH' ? 'selected' : ''}>Xác Thực</option>
                  </select>
                `;
              }
              if (subType === 'users') {
                return `
                  <select class="admin-select-filter" style="height: 34px; font-size: 13px; border-radius: 6px; padding: 0 10px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary);"
                          onchange="AdminWeb.auditRoleFilter = this.value; AdminWeb.auditPage = 1; AdminWeb._updateAuditContentOnly();">
                    <option value="all" ${this.auditRoleFilter === 'all' ? 'selected' : ''}>Tất cả vai trò</option>
                    <option value="SUPER_ADMIN" ${this.auditRoleFilter === 'SUPER_ADMIN' ? 'selected' : ''}>Quản Trị Tối Cao</option>
                    <option value="ADMIN" ${this.auditRoleFilter === 'ADMIN' ? 'selected' : ''}>Quản Trị Viên</option>
                    <option value="BRANCH_MANAGER" ${this.auditRoleFilter === 'BRANCH_MANAGER' ? 'selected' : ''}>Quản Lý Chi Nhánh</option>
                    <option value="CASHIER" ${this.auditRoleFilter === 'CASHIER' ? 'selected' : ''}>Thu Ngân POS</option>
                    <option value="BARBER" ${this.auditRoleFilter === 'BARBER' ? 'selected' : ''}>Thợ / Barber</option>
                    <option value="CUSTOMER" ${this.auditRoleFilter === 'CUSTOMER' ? 'selected' : ''}>Khách Hàng</option>
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
                    <option value="processing" ${this.auditOrderStatusFilter === 'processing' ? 'selected' : ''}>Đang đóng gói</option>
                    <option value="delivering" ${this.auditOrderStatusFilter === 'delivering' ? 'selected' : ''}>Đang giao hàng</option>
                    <option value="completed" ${this.auditOrderStatusFilter === 'completed' ? 'selected' : ''}>Hoàn tất</option>
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

      // 1. PHÂN HỆ SỰ KIỆN KIỂM TOÁN (LOGS) - CHUẨN THEO BẢNG CHI NHÁNH
      if (subType === 'logs') {
        let filtered = [...logs];
        if (this.auditActionFilter && this.auditActionFilter !== 'all') {
          filtered = filtered.filter(l => (l.action || '').toUpperCase().includes(this.auditActionFilter.toUpperCase()));
        }
        if (q) {
          const norm = str => (str || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          const normQ = norm(q);
          filtered = filtered.filter(l =>
            norm(l.operatorName).includes(normQ) ||
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
          'CREATE_BOOKING': 'Đặt lịch mới',
          'UPDATE_BOOKING': 'Cập nhật lịch',
          'CANCEL_BOOKING': 'Hủy lịch hẹn',
          'COMPLETE_BOOKING': 'Hoàn tất ca',
          'CHECKIN_WAITING': 'Khách vào sảnh',
          'UPDATE_STOCK': 'Cập nhật kho',
          'ADJUST_STOCK': 'Điều chỉnh kho',
          'CREATE_PRODUCT': 'Thêm sản phẩm',
          'UPDATE_PRODUCT': 'Sửa sản phẩm',
          'DELETE_PRODUCT': 'Xóa sản phẩm',
          'CREATE_RECEIPT': 'Tạo phiếu nhập',
          'APPROVE_RECEIPT': 'Duyệt nhập kho',
          'POS_CHECKOUT': 'Thanh toán POS',
          'AUTH_LOGIN': 'Đăng nhập',
          'AUTH_LOGOUT': 'Đăng xuất',
          'LOGIN': 'Đăng nhập',
          'LOGOUT': 'Đăng xuất',
          'UPDATE_USER_ROLE': 'Phân quyền tài khoản'
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
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 13px;">${this.escapeHtml(l.operatorName || 'Hệ Thống')}</div>
                            <div style="font-size: 11.5px; color: var(--brand-accent); font-weight: 700;">${this.escapeHtml(l.operatorRole || 'SUPER_ADMIN')}</div>
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
                                <div><span style="color: var(--text-secondary);">NGƯỜI THỰC HIỆN:</span> <strong style="color: var(--text-primary);">${this.escapeHtml(l.operatorName || 'Hệ Thống')} (${this.escapeHtml(l.operatorRole || 'SUPER_ADMIN')})</strong></div>
                                <div><span style="color: var(--text-secondary);">THAO TÁC GHI NHẬN:</span> <strong style="color: var(--text-primary);">${this.escapeHtml(actLabel)} (${this.escapeHtml(l.action)})</strong></div>
                                <div><span style="color: var(--text-secondary);">MỤC TIÊU / ĐỐI TƯỢNG:</span> <strong style="color: #f59e0b;">${this.escapeHtml(String(l.entity || '—').replace(/#/g, ''))}</strong></div>
                                <div><span style="color: var(--text-secondary);">ĐỊA CHỈ KẾT NỐI / KÊNH:</span> <strong style="color: var(--text-primary);">${this.escapeHtml(l.ip || '127.0.0.1 • Web Enterprise Console')}</strong></div>
                              </div>
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

      // 2. PHÂN HỆ TÀI KHOẢN & PHÂN QUYỀN (USERS) - CHUẨN THEO BẢNG CHI NHÁNH 100%
      if (subType === 'users') {
        const uList = users || [];
        const normQ = (q || '').toLowerCase().trim();
        let filteredUsers = uList.filter(u => {
          if (this.auditRoleFilter && this.auditRoleFilter !== 'all') {
            const role = (u.role || u.VaiTro || '').toUpperCase();
            if (!role.includes(this.auditRoleFilter.toUpperCase())) return false;
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
                          <option value="ADMIN">Quản Trị Viên</option>
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

                    // Parse role accurately
                    const rawRole = (u.role || u.VaiTro || 'CUSTOMER').toString().toUpperCase();
                    let roleCode = 'CUSTOMER';
                    if (rawRole.includes('TỐI CAO') || rawRole.includes('TOI CAO') || rawRole === 'SUPER_ADMIN') {
                      roleCode = 'SUPER_ADMIN';
                    } else if (rawRole.includes('QUẢN TRỊ') || rawRole.includes('QUAN TRI') || rawRole === 'ADMIN') {
                      roleCode = 'ADMIN';
                    } else if (rawRole.includes('QUẢN LÝ') || rawRole.includes('QUAN LY') || rawRole === 'BRANCH_MANAGER') {
                      roleCode = 'BRANCH_MANAGER';
                    } else if (rawRole.includes('THU NGÂN') || rawRole.includes('THU NGAN') || rawRole === 'CASHIER') {
                      roleCode = 'CASHIER';
                    } else if (rawRole.includes('THỢ') || rawRole.includes('THO') || rawRole.includes('BARBER') || rawRole.includes('STYLIST')) {
                      roleCode = 'BARBER';
                    } else {
                      roleCode = 'CUSTOMER';
                    }

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
                          <select class="admin-table-inline-select" style="height: 30px; font-size: 12px; font-weight: 600; border-radius: 6px; padding: 2px 8px; border: 1px solid var(--border-color); background: #1c1b18; color: var(--text-primary); cursor: pointer; width: 100%; max-width: 165px;"
                                  onchange="AdminWeb.changeUserRoleDirect('${this.escapeHtml(String(uid).replace(/^#/, ""))}', this.value)">
                            <option value="SUPER_ADMIN" ${roleCode === 'SUPER_ADMIN' ? 'selected' : ''}>Quản Trị Tối Cao</option>
                            <option value="ADMIN" ${roleCode === 'ADMIN' ? 'selected' : ''}>Quản Trị Viên</option>
                            <option value="BRANCH_MANAGER" ${roleCode === 'BRANCH_MANAGER' ? 'selected' : ''}>Quản Lý Chi Nhánh</option>
                            <option value="CASHIER" ${roleCode === 'CASHIER' ? 'selected' : ''}>Thu Ngân POS</option>
                            <option value="BARBER" ${roleCode === 'BARBER' ? 'selected' : ''}>Thợ / Barber</option>
                            <option value="CUSTOMER" ${roleCode === 'CUSTOMER' ? 'selected' : ''}>Khách Hàng</option>
                          </select>
                        </td>
                        <!-- Cột Cơ sở điều khiển trực tiếp -->
                        <td style="padding: 12px 14px;">
                          <select class="admin-table-inline-select" style="height: 30px; font-size: 12px; font-weight: 600; border-radius: 6px; padding: 2px 8px; border: 1px solid var(--border-color); background: #1c1b18; color: var(--text-primary); cursor: pointer; width: 100%; max-width: 165px;"
                                  onchange="AdminWeb.changeUserBranchDirect('${this.escapeHtml(String(uid).replace(/^#/, ""))}', this.value)">
                            <option value="ALL" ${branchId === 'ALL' ? 'selected' : ''}>Toàn Hệ Thống</option>
                            ${branches.map(b => `
                              <option value="${b.id}" ${branchId === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>
                            `).join('')}
                          </select>
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

      // 3. PHÂN HỆ HÓA ĐƠN & THU TIỀN (INVOICES) - CHUẨN THEO BẢNG CHI NHÁNH
      if (subType === 'invoices') {
        const filtered = invoices.filter(inv => {
          if (this.auditPaymentStatusFilter === 'paid') {
            const isPaid = (inv.status || inv.TrangThai || '').toLowerCase().includes('đã thanh toán') || (inv.paymentStatus || '').toLowerCase() === 'paid';
            if (!isPaid) return false;
          } else if (this.auditPaymentStatusFilter === 'pending') {
            const isPaid = (inv.status || inv.TrangThai || '').toLowerCase().includes('đã thanh toán') || (inv.paymentStatus || '').toLowerCase() === 'paid';
            if (isPaid) return false;
          }
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
                    let sTotal = Number(inv.serviceTotal || inv.TongTienDichVu || 0);
                    let pTotal = Number(inv.productTotal || inv.TongTienSanPham || 0);
                    let total = Number(inv.totalAmount || inv.TongThanhToan || inv.TongTien || inv.total || 0);

                    if (sTotal === 0 && Array.isArray(inv.services) && inv.services.length > 0) {
                      sTotal = inv.services.reduce((sum, s) => sum + Number(s.price || s.DonGia || 0), 0);
                    }
                    if (pTotal === 0 && (Array.isArray(inv.items) || Array.isArray(inv.products))) {
                      const pItems = inv.items || inv.products || [];
                      pTotal = pItems.reduce((sum, it) => sum + (Number(it.price || it.DonGia || 0) * (it.qty || it.quantity || it.SoLuong || 1)), 0);
                    }
                    if (total === 0) {
                      total = sTotal + pTotal;
                    } else if (sTotal === 0 && pTotal === 0 && total > 0) {
                      sTotal = total;
                    }

                    const isPaid = (inv.status || inv.TrangThai || '').toLowerCase().includes('đã thanh toán') || (inv.paymentStatus || '').toLowerCase() === 'paid';
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
                          <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;"
                                  onclick="event.stopPropagation(); AdminWeb.toggleInvoiceRowDetail('${invId}')">
                            ${isExpanded ? 'Thu Gọn' : 'Xem In'}
                          </button>
                        </td>
                      </tr>
                      ${isExpanded ? `
                        <tr id="invoiceDetailRow_${invId}" class="audit-expanded-row" style="background: rgba(255, 255, 255, 0.02); border-bottom: 1px solid var(--border-color);">
                          <td colspan="10" style="padding: 14px 18px;">
                            <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px 16px;">
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                  <span>Chi tiết hóa đơn: ${this.escapeHtml(String(invId).replace(/^#/, ''))}</span>
                                  <span style="font-size: 12px; color: var(--text-secondary); font-weight: normal;">• Khách hàng: ${this.escapeHtml(inv.customerName || 'Khách vãng lai')} (${this.escapeHtml(inv.customerPhone || 'Không có SĐT')})</span>
                                </div>
                                <div style="display: inline-flex; gap: 8px;">
                                  <button type="button" class="pill-btn-outline" style="padding: 3px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;"
                                          onclick="window.print()">
                                    In hóa đơn
                                  </button>
                                  <button type="button" class="pill-btn-outline" style="padding: 3px 8px; font-size: 11px; border-radius: 4px;"
                                          onclick="event.stopPropagation(); AdminWeb.toggleInvoiceRowDetail('${invId}')">
                                    ✕
                                  </button>
                                </div>
                              </div>
                              <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.6;">
                                <div>• <strong>Dịch vụ thực hiện:</strong> ${Array.isArray(inv.services) && inv.services.length > 0 ? inv.services.map(s => `${s.name || s.TenDichVu} (${SalonUtils.formatCurrency(s.price || 0)})`).join(', ') : 'Dịch vụ lẻ tại quầy'}</div>
                                <div>• <strong>Sản phẩm đính kèm:</strong> ${Array.isArray(inv.items) && inv.items.length > 0 ? inv.items.map(it => `${it.name || it.TenSanPham} (x${it.qty || 1} - ${SalonUtils.formatCurrency(it.price || 0)})`).join(', ') : 'Không có'}</div>
                                <div>• <strong>Phương thức &amp; Thu ngân:</strong> ${this.escapeHtml(inv.paymentMethod || 'VietQR')} • Thu ngân: ${this.escapeHtml(inv.cashierName || 'Thu Ngân 01')}</div>
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

      // 4. PHÂN HỆ ĐƠN HÀNG TRỰC TUYẾN & XỬ LÝ (ORDERS) - CHUẨN THEO BẢNG CHI NHÁNH
      if (subType === 'orders') {
        const orderList = orders || [];
        let filtered = orderList.filter(o => {
          if (this.auditOrderStatusFilter && this.auditOrderStatusFilter !== 'all') {
            const rawSt = (o.orderStatus || o.status || o.TrangThai || '').toLowerCase();
            if (this.auditOrderStatusFilter === 'pending' && !rawSt.includes('chờ') && rawSt !== 'pending') return false;
            if (this.auditOrderStatusFilter === 'processing' && !rawSt.includes('xử lý') && !rawSt.includes('gói') && rawSt !== 'processing') return false;
            if (this.auditOrderStatusFilter === 'delivering' && !rawSt.includes('giao') && rawSt !== 'delivering') return false;
            if (this.auditOrderStatusFilter === 'completed' && !rawSt.includes('hoàn tất') && !rawSt.includes('xong') && rawSt !== 'completed') return false;
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
              <table class="admin-enterprise-table" style="width: 100%;">
                <thead>
                  <tr>
                    <th style="width: 90px; padding: 12px 14px;">MÃ ĐƠN</th>
                    <th style="padding: 12px 14px;">KHÁCH HÀNG &amp; SĐT</th>
                    <th style="padding: 12px 14px;">THỜI GIAN</th>
                    <th style="padding: 12px 14px;">SẢN PHẨM</th>
                    <th style="padding: 12px 14px; text-align: right;">TỔNG TIỀN</th>
                    <th style="padding: 12px 14px;">HÌNH THỨC</th>
                    <th style="padding: 12px 14px;">THANH TOÁN</th>
                    <th style="padding: 12px 14px;">TIẾN TRÌNH</th>
                    <th style="text-align: center; width: 140px; padding: 12px 14px;">THAO TÁC</th>
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
                    const oCode = o.id || o.orderCode || o.MaDonHang;
                    const isPaid = (o.paymentStatus === 'Paid' || o.TrangThai === 'Đã thanh toán');
                    const items = o.items || [];
                    const itemsSummary = items.map(it => `${this.escapeHtml(it.name || it.TenSanPham || 'Sản phẩm')} (x${it.qty || it.quantity || 1})`).join(', ');
                    const isPickup = o.deliveryType === 'PICKUP_BRANCH' || (o.shippingAddress && o.shippingAddress.toLowerCase().includes('quầy'));

                    const rawSt = (o.orderStatus || o.status || o.TrangThai || 'Pending').toLowerCase();
                    let step = 1;
                    let stepLabel = 'Chờ xác nhận';

                    if (rawSt.includes('hủy') || rawSt === 'cancelled') {
                      step = 0;
                      stepLabel = 'Đã hủy';
                    } else if (rawSt.includes('hoàn tất') || rawSt.includes('đã giao') || rawSt === 'completed' || rawSt === 'delivered') {
                      step = 4;
                      stepLabel = 'Hoàn tất';
                    } else if (rawSt.includes('đang giao') || rawSt === 'delivering' || rawSt === 'shipping' || (rawSt.includes('giao') && !rawSt.includes('đã giao'))) {
                      step = 3;
                      stepLabel = 'Đang giao hàng';
                    } else if (rawSt.includes('đóng gói') || rawSt.includes('xử lý') || rawSt === 'processing') {
                      step = 2;
                      stepLabel = 'Đang đóng gói';
                    }

                    const isSelected = this.selectedAuditRowId === oCode;

                    return `
                      <tr id="auditRow_${oCode}"
                          class="admin-branch-table-row ${isSelected ? 'is-selected' : ''}"
                          onclick="AdminWeb.onAuditRowClick('orders', '${oCode}', event)"
                          style="cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease; ${isSelected ? 'background: rgba(197, 155, 39, 0.16); box-shadow: inset 3px 0 0 #C59B27;' : ''}">
                        <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--text-primary); padding: 12px 14px;">
                          ${this.escapeHtml(String(oCode).replace(/^#/, ''))}
                        </td>
                        <td style="padding: 12px 10px; white-space: nowrap;">
                          <div>
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 13px; white-space: nowrap;">${this.escapeHtml(o.customerName || 'Khách Hàng')}</div>
                            <div style="font-size: 11.5px; color: #f59e0b; font-weight: 700; white-space: nowrap;">${this.escapeHtml(String(o.customerPhone || '090xxxxxxx').replace(/^#/, ''))}</div>
                          </div>
                        </td>
                        <td style="white-space: nowrap; font-size: 12px; color: var(--text-secondary); padding: 12px 14px; font-variant-numeric: tabular-nums;">
                          ${this._formatTableDateTime(o.createdAt || o.NgayDat)}
                        </td>
                        <td style="padding: 12px 14px; font-size: 12.5px; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${itemsSummary || '—'}
                        </td>
                        <td style="padding: 12px 10px; text-align: right; white-space: nowrap;">
                          <strong style="color: #10b981; font-size: 13px; font-weight: 800;">
                            ${SalonUtils.formatCurrency(o.totalAmount || o.finalTotal || o.TongTien || 0)}
                          </strong>
                        </td>
                        <td style="padding: 12px 14px; font-size: 12px; color: var(--text-secondary); white-space: nowrap;">
                          ${isPickup ? 'Tại quầy' : 'Giao tận nơi'}
                        </td>
                        <td style="padding: 12px 10px; white-space: nowrap;">
                          <span class="status-pill ${isPaid ? 'status-completed' : 'status-cancelled'}" style="padding: 4px 12px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; white-space: nowrap; display: inline-block;">
                            ${isPaid ? 'Đã trả' : 'Chưa thu'}
                          </span>
                        </td>
                        <td style="padding: 12px 10px; white-space: nowrap;">
                          <span class="status-pill ${step === 4 ? 'status-completed' : (step === 0 ? 'status-cancelled' : 'status-completed')}" style="padding: 4px 12px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; white-space: nowrap; display: inline-block;">
                            ${stepLabel}
                          </span>
                        </td>
                        <td style="text-align: center; padding: 12px 10px; white-space: nowrap;">
                          <div style="display: inline-flex; gap: 6px;">
                            ${step === 1 ? `
                              <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;" 
                                      onclick="event.stopPropagation(); AdminWeb.updateOrderStatus('${oCode}', 'Processing')">Xác Nhận</button>
                            ` : ''}
                            ${step === 2 ? `
                              <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;" 
                                      onclick="event.stopPropagation(); AdminWeb.updateOrderStatus('${oCode}', 'Delivering')">Giao Hàng</button>
                            ` : ''}
                            ${step === 3 ? `
                              <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;" 
                                      onclick="event.stopPropagation(); AdminWeb.updateOrderStatus('${oCode}', 'Completed')">Hoàn Tất</button>
                            ` : ''}
                            ${!isPaid && step > 0 && step < 4 ? `
                              <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px; color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);" 
                                      onclick="event.stopPropagation(); AdminWeb.confirmOrderPayment('${oCode}')">Thu Tiền</button>
                            ` : ''}
                          </div>
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

      // 5. PHÂN HỆ THÔNG BÁO HỆ THỐNG (NOTIFICATIONS) - CHUẨN THEO BẢNG CHI NHÁNH
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

      return '';
    },
    // -----------------------------------------------------------------------
    // MODALS & OPERATIONS FOR AUDIT, USERS, INVOICES
    // -----------------------------------------------------------------------
    openUserRoleModal(userId) {
      if (!userId) return;
      const users = (window.store && typeof window.store.getUsers === 'function') ? window.store.getUsers() : [];
      const user = users.find(u => u.id === userId || u.MaTaiKhoan === userId || u.username === userId) || { id: userId, username: userId };
      const currentRole = (user.role || user.VaiTro || 'CUSTOMER').toUpperCase();
      const currentBranch = user.branchId || user.MaChiNhanh || '';
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];

      this._openModal(`
        <div style="padding: 12px 8px; max-width: 480px; margin: 0 auto;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(197, 155, 39, 0.15); border: 2px solid rgba(197, 155, 39, 0.4); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--brand-accent); font-weight: 800;">
              👥
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
                <option value="SUPER_ADMIN" ${currentRole === 'SUPER_ADMIN' ? 'selected' : ''}>Quản Trị Tối Cao (SUPER_ADMIN)</option>
                <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>Quản Trị Viên (ADMIN)</option>
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
      const users = (window.store && typeof window.store.getUsers === 'function') ? window.store.getUsers() : [];
      const user = users.find(u => u.id === userId || u.MaTaiKhoan === userId || u.username === userId);
      if (user) {
        user.role = newRole;
        user.VaiTro = newRole;
        user.branchId = newBranch;
        user.MaChiNhanh = newBranch;
      }

      this._closeModal();
      if (window.UICommon) window.UICommon.showToast(`Đã cập nhật phân quyền tài khoản [${userId}] sang ${newRole} thành công!`, 'success');
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
                       value="123456">
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
                  <option value="ADMIN">Quản Trị Viên</option>
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

    submitNewUser() {
      const uname = (document.getElementById('newUname')?.value || '').trim();
      const fname = (document.getElementById('newFname')?.value || '').trim();
      const phone = (document.getElementById('newPhone')?.value || '').trim();
      const role = document.getElementById('newRole')?.value || 'BARBER';
      const branch = document.getElementById('newBranch')?.value || '';

      if (!uname || !fname || !phone) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng điền đầy đủ Tên đăng nhập, Họ tên và Số điện thoại!', 'warning');
        return;
      }

      const users = (window.store && typeof window.store.getUsers === 'function') ? window.store.getUsers() : [];
      const newId = `TK${String(users.length + 1).padStart(3, '0')}`;
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
        VaiTro: role,
        branchId: branch,
        MaChiNhanh: branch,
        status: 'Hoạt động'
      };

      users.unshift(newUser);
      this._closeModal();
      if (window.UICommon) window.UICommon.showToast(`Đã thêm tài khoản [${uname}] (${newId}) thành công!`, 'success');
      this._updateAuditContentOnly();
    },

    openAuditLogDetailModal(logId) {
      const logs = (window.store && typeof window.store.getAuditLogs === 'function') ? window.store.getAuditLogs() : [];
      const log = logs.find((l, idx) => l.id === logId || `log_${idx}_${l.timestamp}` === logId) || { id: logId, action: 'Sự kiện kiểm toán', details: 'Chi tiết sự kiện' };

      this._openModal(`
        <div style="padding: 12px 8px; max-width: 520px; margin: 0 auto;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(197, 155, 39, 0.15); border: 2px solid rgba(197, 155, 39, 0.4); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--brand-accent); font-weight: 800;">
              📝
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
                <strong style="font-size: 12.5px; color: var(--text-primary);">
                  ${this.escapeHtml(log.operatorName || 'Hệ Thống')}
                </strong>
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

      const services = inv.services || [];
      const products = inv.items || inv.products || [];
      const total = inv.totalAmount || inv.TongThanhToan || inv.TongTien || 0;

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
            <span class="status-pill status-completed" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px;">
              ${this.escapeHtml(inv.status || inv.TrangThai || 'Đã thanh toán')}
            </span>
          </div>

          <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Khách Hàng:</div>
            <strong style="font-size: 14px; color: var(--text-primary);">${this.escapeHtml(inv.customerName || inv.TenKhachHang || 'Khách vãng lai')}</strong>
          </div>

          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--brand-accent); margin-bottom: 8px;">Dịch Vụ &amp; Sản Phẩm:</div>
            ${services.map(s => `
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
                <span>• ${this.escapeHtml(s.name || s.TenDichVu || 'Dịch vụ')}</span>
                <strong>${SalonUtils.formatCurrency(s.price || s.DonGia || 0)}</strong>
              </div>
            `).join('')}
            ${products.map(p => `
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
                <span>• ${this.escapeHtml(p.name || p.TenSanPham || 'Sản phẩm')} (x${p.qty || p.SoLuong || 1})</span>
                <strong>${SalonUtils.formatCurrency((p.price || p.DonGia || 0) * (p.qty || p.SoLuong || 1))}</strong>
              </div>
            `).join('')}
            <div style="border-top: 1px dashed var(--border-color); margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 14px;">
              <strong>Tổng Thanh Toán:</strong>
              <strong style="color: #10b981; font-size: 16px;">${SalonUtils.formatCurrency(total)}</strong>
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
      let csv = 'Timestamp,Action,Operator,Entity,Details\n';
      logs.forEach(l => {
        csv += `"${l.timestamp || ''}","${l.action || ''}","${l.operatorName || ''}","${l.entity || ''}","${(l.details || '').replace(/"/g, '""')}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `nhat_ky_kiem_toan_${new Date().toISOString().substring(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (window.UICommon) window.UICommon.showToast('Đã xuất file báo cáo nhật ký kiểm toán thành công!', 'success');
    },

    exportInvoicesReport() {
      const invoices = (window.store && typeof window.store.getInvoices === 'function') ? window.store.getInvoices() : [];
      let csv = 'InvoiceId,Branch,Customer,Date,Total,Status,PaymentMethod\n';
      invoices.forEach(i => {
        csv += `"${i.id || i.MaHoaDon || ''}","${i.branchName || ''}","${i.customerName || ''}","${i.createdDate || i.NgayLap || ''}","${i.totalAmount || i.TongThanhToan || 0}","${i.status || ''}","${i.paymentMethod || ''}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `bao_cao_hoa_don_${new Date().toISOString().substring(0,10)}.csv`);
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
      link.setAttribute('download', `danh_sach_don_hang_${new Date().toISOString().substring(0,10)}.csv`);
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
        'Pending': '① Chờ Xác Nhận',
        'Processing': '② Đang Đóng Gói',
        'Delivering': '③ Đang Giao Hàng',
        'Completed': '④ Hoàn Tất',
        'Cancelled': 'Hủy Đơn Hàng'
      };
      const label = statusLabels[newStatus] || newStatus;
      if (!confirm(`Xác nhận chuyển trạng thái đơn hàng ${orderId} sang "${label}"?`)) {
        this.refreshAuditView();
        return;
      }

      if (window.store && typeof window.store.updateOrderStatus === 'function') {
        const res = await window.store.updateOrderStatus(orderId, newStatus);
        if (res && res.success) {
          if (window.UICommon) window.UICommon.showToast(res.message || `Đã chuyển đơn ${orderId} sang "${label}"!`, 'success');
          this.refreshAuditView();
        } else {
          if (window.UICommon) window.UICommon.showToast(res?.error || 'Lỗi khi cập nhật trạng thái đơn hàng!', 'error');
        }
      }
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
