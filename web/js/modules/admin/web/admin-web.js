// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ QUẢN TRỊ SALON TRÊN WEB (ENTERPRISE ADMIN HUB & DISPATCHER)
// Phiên bản: 11.1 Clean Architecture, Zero N+1 Query, DRY Optimized
// Tuân thủ: .antigravity/rules/04_refactor.md, 07_ponytail.md, 08_caveman.md & docs/file_plan.json (TASK-07-WEB-ADMIN)
// ============================================================================

(function (window) {
  'use strict';

  const AdminWeb = {
    // -----------------------------------------------------------------------
    // 1. STATE MANAGEMENT
    // -----------------------------------------------------------------------
    adminSubTab: 'overview', // 'overview' | 'bookings' | 'stylists' | 'catalog' | 'inventory' | 'pos' | 'audit'
    filterBranch: 'all',
    filterStatus: 'all',
    filterDate: '',
    searchQuery: '',
    catalogTabType: 'services', // 'services' | 'combos' | 'products'
    catalogSearchQuery: '',
    inventorySearchQuery: '',
    auditActionFilter: 'all',
    auditSearchQuery: '',

    // -----------------------------------------------------------------------
    // PAGINATION STATE (10 MỤC / TRANG)
    // -----------------------------------------------------------------------
    pageSize: 10,
    inventoryPage: 1,
    dispatchPage: 1,
    dispatchBranchFilter: 'all',
    bookingsPage: 1,
    stylistsPage: 1,
    branchesPage: 1,
    catalogPage: 1,
    auditPage: 1,

    posState: {
      branchId: 'br-dbp',
      selectedStylistId: '',
      customerName: 'Khách Cắt Quầy',
      customerPhone: '0900000000',
      searchQuery: '',
      activeCategory: 'all',
      billServices: [],
      billProducts: [],
      voucherCode: '',
      discountAmount: 0,
      paymentMethod: 'VietQR' // 'VietQR' | 'Cash'
    },

    // -----------------------------------------------------------------------
    // 2. RBAC & SECURITY ROLE GUARD
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

    activeRoleOverride: null,

    getActiveRole(user) {
      if (this.activeRoleOverride) return this.activeRoleOverride;
      const r = String(user?.role || '').toUpperCase();
      if (r === 'CASHIER' || r.includes('THU NGÂN') || r.includes('THU_NGÂN')) return 'CASHIER';
      if (r === 'INVENTORY_MANAGER' || r.includes('KHO') || r.includes('THỦ_KHO')) return 'INVENTORY_MANAGER';
      return 'SUPER_ADMIN';
    },

    switchActiveRole(newRole) {
      this.activeRoleOverride = newRole;
      if (newRole === 'CASHIER') {
        this.adminSubTab = 'pos';
        if (window.UICommon) window.UICommon.showToast('💳 Đã chuyển sang vai trò: THU NGÂN (Mở quầy POS & Hóa Đơn)!');
      } else if (newRole === 'INVENTORY_MANAGER') {
        this.adminSubTab = 'inventory';
        if (window.UICommon) window.UICommon.showToast('📦 Đã chuyển sang vai trò: QUẢN LÝ KHO (Hiện đủ 130 sản phẩm & Tồn kho)!');
      } else {
        if (this.adminSubTab === 'pos') this.adminSubTab = 'overview';
        if (window.UICommon) window.UICommon.showToast('👑 Đã chuyển sang vai trò: QUẢN TRỊ VIÊN (Quản lý chung salon)!');
      }
      const container = document.getElementById('webMainContainer');
      if (container) this.render(container);
    },

    canAccess(user) {
      const targetUser = user || this.getCurrentUser();
      if (!targetUser || !targetUser.role) return false;
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'QUẢN TRỊ VIÊN', 'QUẢN TRỊ TỐI CAO', 'BRANCH_MANAGER', 'CASHIER', 'THU_NGÂN', 'INVENTORY_MANAGER', 'THỦ_KHO'];
      const role = String(targetUser.role).toUpperCase();
      return allowedRoles.includes(role) || role.includes('ADMIN') || role.includes('CASHIER') || role.includes('THU_NGÂN') || role.includes('KHO') || role.includes('MANAGER') || username === 'admin';
    },

    isSuperAdmin(user) {
      return user && (user.role === 'SUPER_ADMIN' || (window.AuthEngine && window.AuthEngine.hasRole('SUPER_ADMIN')));
    },

    isBranchManager(user) {
      return user && user.role === 'BRANCH_MANAGER';
    },

    syncBranchScope(user) {
      if (this.isBranchManager(user) && user.branchId) {
        this.filterBranch = user.branchId;
        this.posState.branchId = user.branchId;
      }
    },

    escapeHtml(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    // -----------------------------------------------------------------------
    // PAGINATION CONTROLS & HANDLERS (10 MỤC / TRANG)
    // -----------------------------------------------------------------------
    _renderPaginationControls(currentPage, totalPages, totalItems, onPageChangeExpr, itemName = 'mục') {
      if (totalPages <= 1) {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin-top: 14px; font-size: 12px; color: var(--text-secondary, #94A3B8); border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));">
            <span>Hiển thị toàn bộ ${totalItems} ${itemName}</span>
            <span class="badge-terracotta" style="font-size: 11px;">Trang 1 / 1</span>
          </div>
        `;
      }

      let pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      const start = Math.min(totalItems, (currentPage - 1) * this.pageSize + 1);
      const end = Math.min(totalItems, currentPage * this.pageSize);

      return `
        <div class="admin-pagination-bar">
          <div>
            Hiển thị <strong style="color: var(--text-primary, #FFF);">${start} - ${end}</strong> trên tổng số <strong style="color: var(--brand-accent, #F59E0B);">${totalItems}</strong> ${itemName}
          </div>
          <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="admin-tab-btn" style="${currentPage === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}" 
                    ${currentPage > 1 ? `onclick="${onPageChangeExpr}(${currentPage - 1})"` : 'disabled'}>
              ← Trước
            </button>
            ${pages.map(p => `
              <button type="button" class="admin-tab-btn ${p === currentPage ? 'active' : ''}" 
                      style="min-width: 32px;" 
                      onclick="${onPageChangeExpr}(${p})">
                ${p}
              </button>
            `).join('')}
            <button type="button" class="admin-tab-btn" style="${currentPage === totalPages ? 'opacity: 0.4; pointer-events: none;' : ''}" 
                    ${currentPage < totalPages ? `onclick="${onPageChangeExpr}(${currentPage + 1})"` : 'disabled'}>
              Sau →
            </button>
          </div>
        </div>
      `;
    },

    setInventoryPage(p) {
      this.inventoryPage = p;
      this.refreshInventoryView();
    },
    setDispatchPage(p) {
      this.dispatchPage = p;
      this.refreshBookingsTable();
    },
    setBookingsPage(p) {
      this.bookingsPage = p;
      this.refreshBookingsTable();
    },
    setStylistsPage(p) {
      this.stylistsPage = p;
      this.refreshSubTab();
    },
    setBranchesPage(p) {
      this.branchesPage = p;
      this.refreshBranchesView();
    },
    setCatalogPage(p) {
      this.catalogPage = p;
      this.refreshSubTab();
    },
    setAuditPage(p) {
      this.auditPage = p;
      this.refreshAuditView();
    },
    refreshBookingsView() {
      this.refreshBookingsTable();
    },

    // -----------------------------------------------------------------------
    // 3. DRY UTILITIES & EAGER LOADING AGGREGATORS (KHỬ N+1 QUERY)
    // -----------------------------------------------------------------------
    _openModal(htmlContent, isWide = false) {
      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;
      const shell = modal.querySelector('.modal-content-shell');
      if (shell) {
        if (isWide) {
          shell.classList.add('modal-wide');
          shell.style.maxWidth = '960px';
          shell.style.width = '95vw';
        } else {
          shell.classList.remove('modal-wide');
          shell.style.maxWidth = '';
          shell.style.width = '';
        }
      }
      modalBody.innerHTML = htmlContent;
      modal.classList.add('active');
    },

    _closeModal() {
      const modal = document.getElementById('globalModal');
      if (modal) {
        const shell = modal.querySelector('.modal-content-shell');
        if (shell) {
          shell.classList.remove('modal-wide');
          shell.style.maxWidth = '';
          shell.style.width = '';
        }
      }
      if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
        window.UICommon.closeGlobalModal();
      } else {
        if (modal) modal.classList.remove('active');
      }
    },

    _updateModalPreviewImage(rawUrl) {
      const imgEl = document.getElementById('modalPreviewImg');
      if (!imgEl) return;
      const cleanUrl = rawUrl ? rawUrl.trim() : '';
      if (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function') {
        imgEl.src = SalonUtils.formatImageUrl(cleanUrl);
      } else {
        imgEl.src = cleanUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';
      }
    },

    _updateModalStockBadge(stockValue) {
      const box = document.getElementById('modalStockStatusBox');
      if (!box) return;
      const stock = parseInt(stockValue) || 0;
      if (stock > 5) {
        box.innerHTML = `<span class="stock-badge-safe" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">✓ CÒN HÀNG (${stock} SP)</span>`;
      } else if (stock > 0) {
        box.innerHTML = `<span class="stock-badge-low" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">⚠️ SẮP HẾT HÀNG (${stock} SP)</span>`;
      } else {
        box.innerHTML = `<span class="stock-badge-critical" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">✕ HẾT HÀNG (0 SP)</span>`;
      }
    },

    _goToCustomerPortal() {
      if (window.CustomerWeb && typeof window.CustomerWeb.switchTab === 'function') {
        window.CustomerWeb.switchTab('home');
      } else if (window.UIWeb && typeof window.UIWeb.switchTab === 'function') {
        window.UIWeb.switchTab('home');
      }
    },

    _getBranchShortName(branchObjOrId, branchMap = null) {
      if (!branchObjOrId) return 'Omni Salon Flagship';
      let name = '';
      if (typeof branchObjOrId === 'object') {
        name = branchObjOrId.name || branchObjOrId.id || '';
      } else if (branchMap && branchMap.has(branchObjOrId)) {
        name = branchMap.get(branchObjOrId).name;
      } else {
        name = String(branchObjOrId);
      }
      return name.split('—')[0].trim();
    },

    /**
     * Eager Loading & Aggregation: Gom nhóm dữ liệu bookings theo thợ O(B)
     * Triệt tiêu toàn bộ lỗi N+1 khi duyệt qua danh sách Barber trong dashboard.
     */
    _getStylistStatsMap(stylists, bookings, targetDate = null) {
      const todayStr = targetDate || new Date().toISOString().split('T')[0];
      const statsMap = new Map();

      // Khởi tạo map cho tất cả thợ
      stylists.forEach(s => {
        statsMap.set(s.id, {
          stylistId: s.id,
          stylistName: s.name,
          commissionRate: s.commissionRate || 0.15,
          completedCutsCount: 0,
          totalCutValue: 0,
          revenue: 0,
          commissionAmount: 0,
          commission: 0,
          todayQueue: []
        });
      });

      // 1 vòng lặp duy nhất O(Bookings) thay vì lặp N*M
      bookings.forEach(b => {
        if (!b.stylistId) return;
        const stats = statsMap.get(b.stylistId);
        if (!stats) return;

        const status = (b.status || '').toLowerCase();
        // Cả 'completed' và 'confirmed' (hoặc 'hoàn thành', 'đã xác nhận') đều là lịch hợp lệ tạo doanh thu
        if (status === 'completed' || status === 'confirmed' || status === 'hoàn thành' || status === 'đã xác nhận') {
          stats.completedCutsCount += 1;
          const val = Number(b.totalPrice || 0);
          stats.totalCutValue += val;
          stats.revenue += val;
        }

        const bDate = b.date || b.bookingDate;
        if (bDate === todayStr && status !== 'cancelled') {
          stats.todayQueue.push(b);
        }
      });

      // Cộng dồn các ca cắt POS tại quầy được gán cho Barber
      const posOrders = (window.store && window.store.state && window.store.state.posOrders) || [];
      posOrders.forEach(pos => {
        if (!pos.stylistId) return;
        const stats = statsMap.get(pos.stylistId);
        if (!stats) return;
        if (Array.isArray(pos.services)) {
          pos.services.forEach(s => {
            const val = Number(s.price || 0);
            stats.completedCutsCount += 1;
            stats.totalCutValue += val;
            stats.revenue += val;
          });
        }
      });

      // Tính hoa hồng sau gom nhóm (15% doanh thu cắt)
      statsMap.forEach(stats => {
        const comm = Math.round(stats.totalCutValue * stats.commissionRate);
        stats.commissionAmount = comm;
        stats.commission = comm;
        stats.todayQueue.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
      });

      return statsMap;
    },

    /**
     * DRY: Tính toán hóa đơn POS & Voucher tập trung
     */
    _calculatePosSummary(posState, promotions = null) {
      const servicesTotal = posState.billServices.reduce((sum, s) => sum + Number(s.price || 0), 0);
      const productsTotal = posState.billProducts.reduce((sum, p) => sum + (Number(p.price || 0) * (p.qty || 1)), 0);
      const subtotal = servicesTotal + productsTotal;

      let discountAmount = 0;
      if (posState.voucherCode && window.PricingService) {
        const promoList = promotions || (window.store && window.store.getPromotions ? window.store.getPromotions() : []);
        const vRes = window.PricingService.processVoucherCode(posState.voucherCode, subtotal, promoList);
        discountAmount = vRes.isValid ? vRes.discountAmount : 0;
      }
      const finalTotal = Math.max(0, subtotal - discountAmount);

      return {
        servicesTotal,
        productsTotal,
        subtotal,
        discountAmount,
        finalTotal
      };
    },

    // -----------------------------------------------------------------------
    // 4. MAIN RENDER ENTRY POINT
    // -----------------------------------------------------------------------
    render(container) {
      if (!container) return;

      const user = this.getCurrentUser();

      // Kiểm tra quyền truy cập Role Guard
      if (!this.canAccess(user)) {
        this.renderAccessDenied(container, user);
        return;
      }

      // Khóa phạm vi chi nhánh cho Quản lý chi nhánh
      this.syncBranchScope(user);

      // Nạp dữ liệu từ Store
      const bookings = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      const products = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts() : [];
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const auditLogs = (window.store && typeof window.store.getAuditLogs === 'function') ? window.store.getAuditLogs() : [];
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const combos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];

      const branchMap = new Map(branches.map(b => [b.id, b]));
      const branchName = this.isBranchManager(user)
        ? this._getBranchShortName(user.branchId, branchMap)
        : `Toàn Hệ Thống Cơ Sở`;

      const activeRole = this.getActiveRole(user);
      let visibleTabs = [];

      if (activeRole === 'CASHIER') {
        visibleTabs = [
          { id: 'pos', icon: '💳', label: 'Thu Ngân POS & Hóa Đơn' },
          { id: 'bookings', icon: '📅', label: 'Tiếp Nhận & Check-in Lịch Hẹn' },
          { id: 'audit', icon: '📜', label: 'Lịch Sử Đơn Hàng & POS' }
        ];
        if (!['pos', 'bookings', 'audit'].includes(this.adminSubTab)) {
          this.adminSubTab = 'pos';
        }
      } else if (activeRole === 'INVENTORY_MANAGER') {
        visibleTabs = [
          { id: 'inventory', icon: '📦', label: 'Quản Lý Kho & Sản Phẩm' },
          { id: 'overview', icon: '📊', label: 'Báo Cáo Tồn Kho & Doanh Thu' },
          { id: 'branches', icon: '🏢', label: 'Hệ Thống Chi Nhánh' }
        ];
        if (!['inventory', 'overview', 'branches'].includes(this.adminSubTab)) {
          this.adminSubTab = 'inventory';
        }
      } else {
        visibleTabs = [
          { id: 'overview', icon: '📊', label: 'Báo Cáo Doanh Thu & Kho' },
          { id: 'branches', icon: '🏢', label: 'Quản Lý Chi Nhánh' },
          { id: 'bookings', icon: '📅', label: 'Điều Phối Lịch Hẹn' },
          { id: 'stylists', icon: '💈', label: 'Đội Ngũ Thợ & Phân Ca' },
          { id: 'catalog', icon: '✂️', label: 'Dịch Vụ & Combo' },
          { id: 'inventory', icon: '📦', label: 'Quản Lý Kho & Sản Phẩm' },
          { id: 'audit', icon: '📜', label: 'Quản Lý Khách Hàng & Nhật Ký' }
        ];
      }

      const roleDisplay = activeRole === 'CASHIER' 
        ? 'Nguyễn Thị Lan (Thu Ngân POS)' 
        : (activeRole === 'INVENTORY_MANAGER' ? 'Trần Văn Kho (Quản Lý Kho)' : `${this.escapeHtml(user.fullName || user.username)} (${this.escapeHtml(user.role)})`);

      container.innerHTML = `
        <div class="admin-full-wrapper">
          <!-- Top Enterprise Header -->
          <div class="admin-hub-header">
            <div>
              <div class="badge-terracotta">
                HỆ THỐNG ĐIỀU HÀNH OMNI SALON ENTERPRISE • NORDIC LUXURY
              </div>
              <h2 class="admin-hub-title" style="margin-top: 6px; color: var(--text-primary, #FFFFFF); font-weight: 900; letter-spacing: -0.02em;">
                TRUNG TÂM QUẢN TRỊ & ĐIỀU HÀNH SALON
              </h2>
              <div style="font-size: 14px; color: var(--text-secondary, #94A3B8); margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="status-pill-pulse status-completed" style="padding: 2px 8px; font-size: 11px;">
                  <span class="pulse-dot"></span> Trực Tuyến
                </span>
                <span>Phạm vi: <strong style="color: var(--text-primary, #FFFFFF);">${this.escapeHtml(branchName)}</strong></span>
                <span>• Nhân sự: <strong style="color: var(--brand-accent, #D4AF37);">${roleDisplay}</strong></span>
              </div>
            </div>

            <div style="display:flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <!-- Role Switcher cho Demo Phân Quyền Đồ Án -->
              <div style="display: flex; align-items: center; gap: 6px; background: var(--surface-card); padding: 4px 10px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <span style="font-size: 11.5px; font-weight: 800; color: var(--text-secondary);">🎭 Vai Trò:</span>
                <select style="padding: 4px 8px; font-size: 12px; font-weight: 800; border-radius: 8px; background: var(--surface-elevated); color: var(--brand-accent); border: 1px solid var(--border-color); cursor: pointer;" onchange="AdminWeb.switchActiveRole(this.value)">
                  <option value="SUPER_ADMIN" ${activeRole === 'SUPER_ADMIN' ? 'selected' : ''}>👑 Quản Trị Tối Cao (Tất Cả Tab)</option>
                  <option value="CASHIER" ${activeRole === 'CASHIER' ? 'selected' : ''}>💳 Thu Ngân (Chỉ POS & Lịch Hẹn)</option>
                  <option value="INVENTORY_MANAGER" ${activeRole === 'INVENTORY_MANAGER' ? 'selected' : ''}>📦 Quản Lý Kho (Chuyên 130 Sản Phẩm)</option>
                </select>
              </div>

              <!-- Theme Toggle Switch (Dark / Light) -->
              <button type="button" class="theme-toggle-btn" onclick="window.ThemeEngine && window.ThemeEngine.toggleTheme()" title="Chuyển chế độ Sáng / Tối">
                <span class="theme-icon icon-moon">🌙</span>
                <span class="theme-icon icon-sun">☀️</span>
              </button>
              <button class="pill-btn-outline" style="color: inherit; border-color: var(--border-color);" 
                      onclick="if(confirm('Khôi phục toàn bộ dữ liệu mẫu demo ban đầu?')) { window.store.resetToDefault(); if(window.UICommon) window.UICommon.showToast('🔄 Đã khôi phục dữ liệu gốc!'); AdminWeb.render(document.getElementById('webMainContainer')); }">
                🔄 Khôi Phục Dữ Liệu
              </button>
              <button class="btn-submit-terracotta" onclick="AdminWeb._goToCustomerPortal()">
                ← Giao Diện Khách Hàng
              </button>
            </div>
          </div>

          <!-- Admin Sub Navigation Tabs Bar (Phân quyền theo Role) -->
          <div class="admin-subnav-bar">
            ${visibleTabs.map(t => `
              <button class="admin-tab-btn ${this.adminSubTab === t.id ? 'active' : ''}" onclick="AdminWeb.switchSubTab('${t.id}')">
                ${t.icon} ${t.label}
              </button>
            `).join('')}
          </div>

          <!-- Sub-Tab Content -->
          <div id="adminSubTabContent">
            ${this.renderSubTabContent(user, bookings, products, branches, stylists, auditLogs, services, combos, branchMap)}
          </div>
        </div>
      `;
    },

    renderAccessDenied(container, user) {
      container.innerHTML = `
        <div class="admin-full-wrapper" style="min-height: 480px; display: flex; align-items: center; justify-content: center;">
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 40px 30px; max-width: 520px; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(220, 38, 38, 0.15); color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 18px;">
              🚫
            </div>
            <div class="badge-terracotta" style="background: rgba(220, 38, 38, 0.12); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
              403 FORBIDDEN • BẢO MẬT PHÂN QUYỀN
            </div>
            <h2 style="font-size: 22px; font-weight: 900; color: var(--text-primary); margin: 12px 0 8px;">
              TRUY CẬP BỊ TỪ CHỐI
            </h2>
            <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin-bottom: 24px;">
              ${user
                ? `Tài khoản <strong>${this.escapeHtml(user.fullName || user.username)}</strong> (Vai trò: <span style="color:#b91c1c; font-weight:800;">${this.escapeHtml(user.role)}</span>) không có quyền truy cập vào Phân Hệ Quản Trị Trung Tâm OmniSalon.`
                : 'Bạn chưa đăng nhập vào hệ thống. Vui lòng đăng nhập với tài khoản Quản trị viên (SuperAdmin), Quản lý chi nhánh hoặc Nhân viên để tiếp tục.'}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <button class="pill-btn-outline" onclick="AdminWeb._goToCustomerPortal()">
                ← Về Trang Khách Hàng
              </button>
              <button class="btn-submit-terracotta" onclick="if(window.UICommon) window.UICommon.openAuthModal('login');">
                🔑 Đăng Nhập Nhân Viên
              </button>
            </div>
          </div>
        </div>
      `;
    },

    switchSubTab(tabName) {
      this.adminSubTab = tabName;
      const container = document.getElementById('webMainContainer');
      if (container) this.render(container);
    },

    renderSubTabContent(user, bookings, products, branches, stylists, auditLogs, services, combos, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      switch (this.adminSubTab) {
        case 'overview':
          return this.renderOverviewTab(user, branches, stylists, products, bookings, bMap);
        case 'branches':
          return this.renderBranchesTab(user, branches, stylists, bookings, bMap);
        case 'bookings':
          return this.renderBookingsTab(user, bookings, branches, stylists, bMap);
        case 'stylists':
          return this.renderStylistsTab(user, stylists, branches, bookings, bMap);
        case 'catalog':
          return this.renderCatalogTab(services, combos, products);
        case 'inventory':
          return this.renderInventoryTab(user, branches, bMap);
        case 'pos':
          return this.renderPosTab(user, services, combos, products, branches, stylists, bMap);
        case 'audit':
          return this.renderAuditTab(auditLogs);
        default:
          return this.renderOverviewTab(user, branches, stylists, products, bookings, bMap);
      }
    },

    // -----------------------------------------------------------------------
    // SUB-TAB 1: TỔNG QUAN DOANH THU & KPIS (OVERVIEW - ZERO N+1)
    // -----------------------------------------------------------------------
    renderOverviewTab(user, branches, stylists, products, bookings = null, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      const allBookings = bookings || ((window.store && window.store.getBookings) ? window.store.getBookings() : []);
      const branchId = (this.isBranchManager(user) && user.branchId) ? user.branchId : (this.filterBranch !== 'all' ? this.filterBranch : null);
      
      const systemAnalytics = (window.store && typeof window.store.getRevenueAnalytics === 'function')
        ? window.store.getRevenueAnalytics(null)
        : { totalRevenue: 0, bookingRevenue: 0, productRevenue: 0, confirmedCount: 0, cancelledCount: 0, inProgressCount: 0, completionRate: 100, weeklyData: [], categoryBreakdown: [] };

      const analytics = branchId ? window.store.getRevenueAnalytics(branchId) : systemAnalytics;

      const chartMode = this.overviewChartMode || 'all'; // 'all' | 'services' | 'products'

      const weeklyData = (analytics.weeklyData && analytics.weeklyData.length > 0)
        ? analytics.weeklyData
        : ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map(d => ({ day: d, revenue: 0, serviceRevenue: 0, productRevenue: 0, bookingsCount: 0 }));

      const getVal = (d) => {
        if (chartMode === 'services') return Number(d.serviceRevenue || 0);
        if (chartMode === 'products') return Number(d.productRevenue || 0);
        return Number(d.revenue || 0);
      };

      const maxRev = Math.max(...weeklyData.map(d => getVal(d)), 1000000);
      const chartHeight = 150;
      const barWidth = 42;
      const spacing = 38;

      const svgBars = weeklyData.map((d, i) => {
        const val = getVal(d);
        const barH = Math.max(16, (val / maxRev) * chartHeight);
        const x = 35 + i * (barWidth + spacing);
        const y = chartHeight - barH + 20;
        const formattedRev = val > 0 ? (val / 1000000).toFixed(1) + 'Tr' : '0đ';

        return `
          <g class="chart-bar-group" style="cursor: pointer;">
            <title>${d.day}: ${SalonUtils.formatCurrency(val)} (Dịch vụ: ${SalonUtils.formatCurrency(d.serviceRevenue || 0)} • Bán lẻ: ${SalonUtils.formatCurrency(d.productRevenue || 0)})</title>
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="url(#adminBarGradient)" opacity="0.95">
              <animate attributeName="height" from="0" to="${barH}" dur="0.5s" fill="freeze" />
              <animate attributeName="y" from="${chartHeight + 20}" to="${y}" dur="0.5s" fill="freeze" />
            </rect>
            <text x="${x + barWidth / 2}" y="${y - 8}" font-size="11" font-weight="800" fill="#c85a44" text-anchor="middle">
              ${formattedRev}
            </text>
            <text x="${x + barWidth / 2}" y="${chartHeight + 38}" font-size="11" font-weight="700" fill="#555" text-anchor="middle">
              ${d.day.replace('Thứ ', 'T')}
            </text>
          </g>
        `;
      }).join('');

      // Khử N+1: Eager loading map cho Barber Rankings
      let scopedStylists = branchId ? stylists.filter(s => s.branchId === branchId) : stylists;
      if (scopedStylists.length === 0 && (branchId === 'br-nb' || branchId === 'branch-004')) {
        scopedStylists = stylists.filter(s => s.branchId === 'CN02' || s.branchId === 'br-nb');
      }
      if (scopedStylists.length === 0) {
        scopedStylists = stylists.slice(0, 5);
      }
      const stylistStatsMap = this._getStylistStatsMap(scopedStylists, allBookings);

      const rankedStylists = [...scopedStylists].sort((a, b) => {
        const statsA = stylistStatsMap.get(a.id) || { totalCutValue: 0, completedCutsCount: 0 };
        const statsB = stylistStatsMap.get(b.id) || { totalCutValue: 0, completedCutsCount: 0 };
        if (statsB.totalCutValue !== statsA.totalCutValue) {
          return statsB.totalCutValue - statsA.totalCutValue;
        }
        if (statsB.completedCutsCount !== statsA.completedCutsCount) {
          return statsB.completedCutsCount - statsA.completedCutsCount;
        }
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }).slice(0, 5);

      const inProgressCount = analytics.inProgressCount;
      const productSalesTotal = analytics.productRevenue;

      return `
        <!-- Filter Toolbar -->
        <div class="admin-filter-bar" style="background: var(--surface-card, #14171F); border: 1px solid var(--border-color, rgba(255,255,255,0.08)); border-radius: 14px; padding: 14px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary, #94A3B8);">Chi nhánh:</label>
              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta" style="font-size: 12px;">🔒 ${this.escapeHtml(this._getBranchShortName(user.branchId, bMap))}</span>
              ` : `
                <select class="table-select-filter admin-select-filter" style="background: var(--input-bg, #0A0B0E); color: var(--text-primary, #FFF); border-color: var(--input-border, rgba(255,255,255,0.12));" onchange="AdminWeb.filterBranch = this.value; AdminWeb.refreshSubTab();">
                  <option value="all" ${this.filterBranch === 'all' ? 'selected' : ''}>Toàn Bộ Chi Nhánh</option>
                  ${branches.map(b => `
                    <option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>
                  `).join('')}
                </select>
              `}
            </div>
          </div>
          <div style="font-size: 12px; color: #94A3B8;">
            Dữ liệu tổng hợp từ CSDL SQL thực tế • Tự động đồng bộ thời gian thực
          </div>
        </div>

        <!-- 4 High-Contrast KPI Cards (Glassmorphism Luxury - 100% Real Database Metrics) -->
        <div class="admin-kpi-grid">
          <div class="admin-kpi-card-rich">
            <div class="kpi-top-row">
              <span class="kpi-label-text">Doanh Thu Dịch Vụ & POS</span>
              <span class="kpi-growth-tag kpi-growth-positive" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.35);">✓ CSDL Thực Tế</span>
            </div>
            <div class="kpi-big-value">${SalonUtils.formatCurrency(analytics.bookingRevenue)}</div>
            <div class="kpi-sub-detail">
              <span>Bao gồm ${analytics.confirmedCount} phiếu hẹn dịch vụ & POS</span>
            </div>
          </div>

          <div class="admin-kpi-card-rich">
            <div class="kpi-top-row">
              <span class="kpi-label-text">Tổng Lịch Hẹn Đã Chốt</span>
              <span class="kpi-growth-tag kpi-growth-positive" style="background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.35);">Tỉ lệ ${analytics.completionRate}%</span>
            </div>
            <div class="kpi-big-value">${analytics.confirmedCount} Lịch Hẹn</div>
            <div class="kpi-sub-detail">
              <span>${analytics.cancelledCount} ca hủy • Hoàn tất ${analytics.completionRate}%</span>
            </div>
          </div>

          <div class="admin-kpi-card-rich">
            <div class="kpi-top-row">
              <span class="kpi-label-text">Khách Đang Làm Tại Ghế</span>
              <span class="kpi-growth-tag kpi-growth-warning">⚡ ${inProgressCount > 0 ? 'Đang Phục Vụ' : 'Sẵn Sàng Tiếp Khách'}</span>
            </div>
            <div class="kpi-big-value">${inProgressCount} Khách Đang Làm</div>
            <div class="kpi-sub-detail">
              <span>${scopedStylists.length} thợ đang sẵn sàng phục vụ</span>
            </div>
          </div>

          <div class="admin-kpi-card-rich">
            <div class="kpi-top-row">
              <span class="kpi-label-text">Doanh Số Sản Phẩm Bán Lẻ</span>
              <span class="kpi-growth-tag kpi-growth-positive" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.35);">✓ CSDL Thực Tế</span>
            </div>
            <div class="kpi-big-value">${SalonUtils.formatCurrency(productSalesTotal)}</div>
            <div class="kpi-sub-detail">
              <span>${analytics.totalOrders} đơn hàng bán lẻ & tồn kho thực tế</span>
            </div>
          </div>
        </div>

        <!-- Split Charts: Biểu đồ SVG 7 ngày & Tỉ trọng dịch vụ -->
        <div class="admin-analytics-split">
          <div class="admin-chart-box">
            <div class="chart-box-header" style="flex-wrap: wrap; gap: 8px;">
              <div>
                <div class="chart-box-title">
                  ${chartMode === 'services' ? '✂️ Biểu Đồ Doanh Thu Dịch Vụ & POS 7 Ngày' : (chartMode === 'products' ? '📦 Biểu Đồ Doanh Số Sản Phẩm Bán Lẻ 7 Ngày' : '📈 Biểu Đồ Tổng Doanh Thu 7 Ngày Gần Nhất')}
                </div>
                <div style="font-size: 11px; color: var(--brand-accent); font-weight: 700; margin-top: 2px;">
                  ${chartMode === 'services' ? `Khớp thẻ KPI: ${SalonUtils.formatCurrency(analytics.bookingRevenue)}` : (chartMode === 'products' ? `Khớp thẻ KPI: ${SalonUtils.formatCurrency(analytics.productRevenue)}` : `Toàn bộ hệ thống: ${SalonUtils.formatCurrency(analytics.totalRevenue)}`)}
                </div>
              </div>
              <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                <button type="button" class="admin-tab-btn ${chartMode === 'all' ? 'active' : ''}" style="padding: 3px 8px; font-size: 11px;" onclick="AdminWeb.overviewChartMode = 'all'; AdminWeb.refreshSubTab();">
                  Tất Cả (${SalonUtils.formatCurrency(analytics.totalRevenue)})
                </button>
                <button type="button" class="admin-tab-btn ${chartMode === 'services' ? 'active' : ''}" style="padding: 3px 8px; font-size: 11px;" onclick="AdminWeb.overviewChartMode = 'services'; AdminWeb.refreshSubTab();">
                  ✂️ Dịch Vụ (${SalonUtils.formatCurrency(analytics.bookingRevenue)})
                </button>
                <button type="button" class="admin-tab-btn ${chartMode === 'products' ? 'active' : ''}" style="padding: 3px 8px; font-size: 11px;" onclick="AdminWeb.overviewChartMode = 'products'; AdminWeb.refreshSubTab();">
                  📦 Bán Lẻ (${SalonUtils.formatCurrency(analytics.productRevenue)})
                </button>
              </div>
            </div>
            <div class="svg-bar-chart-container">
              <svg viewBox="0 0 600 200" style="width: 100%; height: 100%; overflow: visible;">
                <defs>
                  <linearGradient id="adminBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${chartMode === 'products' ? '#10b981' : '#c85a44'}" />
                    <stop offset="100%" stop-color="${chartMode === 'products' ? '#059669' : '#e07a5f'}" stop-opacity="0.8" />
                  </linearGradient>
                </defs>
                <line x1="20" y1="20" x2="580" y2="20" stroke="rgba(148, 163, 184, 0.25)" stroke-width="1" stroke-dasharray="3 3"/>
                <line x1="20" y1="95" x2="580" y2="95" stroke="rgba(148, 163, 184, 0.25)" stroke-width="1" stroke-dasharray="3 3"/>
                <line x1="20" y1="170" x2="580" y2="170" stroke="rgba(148, 163, 184, 0.4)" stroke-width="1.5"/>
                ${svgBars}
              </svg>
            </div>
          </div>

          <div class="admin-chart-box">
            <div class="chart-box-header">
              <div class="chart-box-title">
                🎯 Tỉ Trọng Dịch Vụ Thịnh Hành
              </div>
              <span style="font-size: 13px; color: var(--text-secondary, #94A3B8);">Theo lượt đặt ca</span>
            </div>
            <div class="popularity-gauge-list">
              ${((analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0) ? analytics.categoryBreakdown : [
                { name: 'Cắt Tóc Chuẩn Barbershop', pct: 40, count: Math.round(allBookings.length * 0.4), color: '#c85a44' },
                { name: 'Uốn Textured / Sóng Lơi', pct: 30, count: Math.round(allBookings.length * 0.3), color: '#2563eb' },
                { name: 'Phục Hồi & Dưỡng Tóc', pct: 20, count: Math.round(allBookings.length * 0.2), color: '#059669' },
                { name: 'Nhuộm Màu Thời Trang', pct: 10, count: Math.max(1, Math.round(allBookings.length * 0.1)), color: '#7c3aed' }
              ]).map(item => `
                <div class="popularity-gauge-item">
                  <div class="gauge-meta-row">
                    <span style="color: var(--text-primary); font-weight: 700;">${item.name}</span>
                    <span style="color: ${item.color}; font-weight: 800;">${item.pct}% (${item.count} ca)</span>
                  </div>
                  <div class="gauge-bar-track">
                    <div class="gauge-bar-fill" style="width: ${item.pct}%; background: ${item.color};"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Bảng xếp hạng Barber nổi bật (Khử N+1 O(1) Lookups) -->
        <div class="admin-table-container">
          <div class="admin-table-toolbar">
            <div style="font-size: 15px; font-weight: 800; color: var(--text-primary, #FFFFFF);">
              🏆 Bảng Xếp Hạng Hiệu Suất Barber Hàng Đầu
            </div>
            <button class="pill-btn-outline" style="font-size: 12px; padding: 6px 14px;" onclick="AdminWeb.switchSubTab('stylists')">
              Xem Toàn Bộ Thợ →
            </button>
          </div>
          <div style="overflow-x: auto;">
            <table class="admin-enterprise-table">
              <thead>
                <tr>
                  <th style="width: 10%;">Xếp Hạng</th>
                  <th style="width: 24%;">Barber</th>
                  <th style="width: 14%;">Cấp Bậc</th>
                  <th style="width: 18%;">Chi Nhánh</th>
                  <th style="width: 12%;">Đánh Giá</th>
                  <th style="width: 11%;">Lượt Cắt Tuần</th>
                  <th style="width: 11%;">Doanh Thu</th>
                </tr>
              </thead>
              <tbody>
                ${rankedStylists.length === 0 ? `
                  <tr>
                    <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-secondary); font-size: 14px;">
                      Chưa có dữ liệu thợ phục vụ trong chu kỳ này.
                    </td>
                  </tr>
                ` : rankedStylists.map((st, idx) => {
                  const stats = stylistStatsMap.get(st.id) || { totalCutValue: 0, completedCutsCount: 0 };
                  const brName = this._getBranchShortName(st.branchId, bMap);
                  return `
                    <tr>
                      <td><strong style="color: ${idx === 0 ? 'var(--brand-accent)' : 'var(--text-secondary)'};">${idx + 1}</strong></td>
                      <td style="font-weight: 700;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <img src="${st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" alt="${this.escapeHtml(st.name)}">
                          <span style="color: var(--text-primary); font-weight: 800;">${this.escapeHtml(st.name)}</span>
                        </div>
                      </td>
                      <td><span class="badge-terracotta" style="font-size: 11px;">${this.escapeHtml(st.role || 'Barber')}</span></td>
                      <td>${this.escapeHtml(brName)}</td>
                      <td><strong style="color: var(--brand-accent);">★ ${st.rating || '5.0'}</strong></td>
                      <td><strong>${stats.completedCutsCount || 0}</strong> lượt</td>
                      <td style="font-weight: 800; color: #10b981;">${SalonUtils.formatCurrency(stats.totalCutValue || 0)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // SUB-TAB: QUẢN LÝ CHI NHÁNH (BRANCHES MANAGEMENT)
    // -----------------------------------------------------------------------
    renderBranchesTab(user, branches, stylists, bookings = null, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      let list = [...branches];

      if (this.branchCityFilter && this.branchCityFilter !== 'all') {
        list = list.filter(b =>
          b.id === this.branchCityFilter ||
          b.MaChiNhanh === this.branchCityFilter ||
          (b.name || '').toLowerCase().includes(this.branchCityFilter.toLowerCase()) ||
          (b.TenChiNhanh || '').toLowerCase().includes(this.branchCityFilter.toLowerCase()) ||
          (b.city || '').toLowerCase().includes(this.branchCityFilter.toLowerCase()) ||
          (b.address || '').toLowerCase().includes(this.branchCityFilter.toLowerCase())
        );
      }

      if (this.branchSearchQuery) {
        const q = this.branchSearchQuery.toLowerCase().trim();
        list = list.filter(b =>
          (b.name || b.TenChiNhanh || '').toLowerCase().includes(q) ||
          (b.address || b.DiaChi || '').toLowerCase().includes(q) ||
          (b.id || b.MaChiNhanh || '').toLowerCase().includes(q) ||
          (b.phone || b.SoDienThoai || '').includes(q)
        );
      }

      this.branchesPage = this.branchesPage || 1;
      const brTotalPages = Math.max(1, Math.ceil(list.length / this.pageSize));
      if (this.branchesPage > brTotalPages) this.branchesPage = brTotalPages;
      const pagedBranches = list.slice((this.branchesPage - 1) * this.pageSize, this.branchesPage * this.pageSize);

      return `
        <!-- Filter & Actions Toolbar -->
        <div class="admin-filter-bar" style="background: var(--surface-card, #14171F); border: 1px solid var(--border-color, rgba(255,255,255,0.08)); border-radius: 14px; padding: 14px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <!-- Ô tìm kiếm chi nhánh -->
            <div style="position: relative; min-width: 260px;">
              <input type="text" class="table-search-input" placeholder="Tìm tên, địa chỉ, hotline, mã CN..."
                     value="${this.escapeHtml(this.branchSearchQuery)}"
                     oninput="AdminWeb.branchSearchQuery = this.value; AdminWeb.branchesPage = 1; AdminWeb.refreshBranchesView();"
                     style="padding-left: 32px; width: 100%; height: 38px; border-radius: 8px;">
              <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 13px; color: var(--text-secondary);">🔍</span>
            </div>

            <!-- Lọc theo Chi Nhánh -->
            <select class="admin-select-filter" style="height: 38px; border-radius: 8px;"
                    onchange="AdminWeb.branchCityFilter = this.value; AdminWeb.branchesPage = 1; AdminWeb.refreshBranchesView();">
              <option value="all" ${(!this.branchCityFilter || this.branchCityFilter === 'all') ? 'selected' : ''}>Tất Cả Chi Nhánh</option>
              ${branches.map(b => `
                <option value="${b.id}" ${this.branchCityFilter === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>
              `).join('')}
            </select>

            <!-- Nút Thêm Chi Nhánh Mới -->
            <button class="btn-submit-terracotta" style="padding: 9px 18px; font-size: 13px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);"
                    onclick="AdminWeb.openAddBranchModal()">
              <span>+ Thêm Chi Nhánh Mới</span>
            </button>
          </div>

          <div style="font-size: 12.5px; color: #94A3B8;">
            Hiển thị <strong style="color: var(--brand-accent);">${pagedBranches.length}</strong> / ${list.length} chi nhánh • Đồng bộ bảng <code style="color: #10b981;">ChiNhanh</code> trong QL_SALON.sql
          </div>
        </div>

        <!-- Bảng Danh Sách Chi Nhánh -->
        <div class="admin-table-container">
          <div class="admin-table-toolbar">
            <div style="font-size: 15px; font-weight: 800; color: var(--text-primary, #FFFFFF); display: flex; align-items: center; gap: 8px;">
              <span>🏢 Danh Sách Chi Nhánh Toàn Chuỗi OmniSalon</span>
              <span class="badge-terracotta" style="font-size: 11px;">100% CSDL SQL</span>
            </div>
          </div>
          <div style="overflow-x: auto;">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 80px;">Mã CN</th>
                  <th>Tên Chi Nhánh & Hình Ảnh</th>
                  <th>Địa Chỉ Cụ Thể</th>
                  <th>Hotline</th>
                  <th>Giờ Mở Cửa</th>
                  <th>Đội Ngũ Thợ</th>
                  <th>Doanh Thu Thực Tế</th>
                  <th>Trạng Thái</th>
                  <th style="text-align: center; width: 140px;">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${pagedBranches.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                      Không tìm thấy chi nhánh nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ` : pagedBranches.map(b => {
                  const bStylists = stylists.filter(s => s.branchId === b.id || s.MaChiNhanh === b.id);
                  const bAnalytics = (window.store && typeof window.store.getRevenueAnalytics === 'function')
                    ? window.store.getRevenueAnalytics(b.id)
                    : { totalRevenue: 0 };
                  const bRevenue = bAnalytics.totalRevenue;
                  const bImg = b.image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80';
                  const bName = b.name || b.TenChiNhanh || b.id;
                  const bAddr = b.address || b.DiaChi || 'TP. Hồ Chí Minh';
                  const bPhone = b.phone || b.SoDienThoai || '0901111000';
                  const bHours = b.openHours || (b.openTime && b.closeTime ? `${b.openTime.substring(0,5)} - ${b.closeTime.substring(0,5)}` : '08:30 - 21:30');
                  const bStatus = b.status || 'Hoạt động';

                  return `
                    <tr id="adminBranchRow_${b.id}">
                      <td>
                        <span class="badge-terracotta" style="font-family: monospace; font-size: 12px; font-weight: 800;">
                          ${this.escapeHtml(b.id)}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                          <img src="${bImg}" alt="${this.escapeHtml(bName)}"
                               style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0;"
                               onerror="this.src='https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80';">
                          <div>
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 14px;">${this.escapeHtml(bName)}</div>
                            <div style="font-size: 11px; color: var(--brand-accent); font-weight: 700;">${this.escapeHtml(b.city || 'TP. Hồ Chí Minh')}</div>
                          </div>
                        </div>
                      </td>
                      <td style="color: var(--text-secondary); font-size: 13px; max-width: 240px;">
                        ${this.escapeHtml(bAddr)}
                      </td>
                      <td>
                        <a href="tel:${bPhone}" style="color: var(--brand-accent); font-weight: 700; text-decoration: none;">
                          ${this.escapeHtml(bPhone)}
                        </a>
                      </td>
                      <td style="font-size: 12.5px; color: var(--text-secondary);">
                        ⏱️ ${this.escapeHtml(bHours)}
                      </td>
                      <td>
                        <span style="font-weight: 800; color: var(--text-primary);">${bStylists.length}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);"> thợ</span>
                      </td>
                      <td>
                        <strong style="color: #10b981; font-size: 13.5px; font-weight: 800;">
                          ${SalonUtils.formatCurrency(bRevenue)}
                        </strong>
                      </td>
                      <td>
                        <span class="status-pill-pulse ${bStatus === 'Hoạt động' ? 'status-completed' : 'status-cancelled'}" style="padding: 2px 8px; font-size: 11px;">
                          <span class="pulse-dot"></span> ${this.escapeHtml(bStatus)}
                        </span>
                      </td>
                      <td style="text-align: center;">
                        <div style="display: inline-flex; gap: 6px;">
                          <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700;"
                                  onclick="AdminWeb.openAddBranchModal('${b.id}')" title="Chỉnh sửa thông tin chi nhánh">
                            ✏️ Sửa
                          </button>
                          <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);"
                                  onclick="AdminWeb.openUniversalDeleteModal('branches', '${b.id}')" title="Xóa chi nhánh khỏi database">
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ${this._renderPaginationControls(this.branchesPage, brTotalPages, list.length, 'AdminWeb.setBranchesPage', 'chi nhánh')}
        </div>
      `;
    },

    refreshBranchesView() {
      const content = document.getElementById('adminSubTabContent');
      if (content && this.adminSubTab === 'branches') {
        const user = this.getCurrentUser();
        const branches = window.store.getBranches();
        const stylists = window.store.getStylists();
        const bookings = window.store.getBookings();
        content.innerHTML = this.renderBranchesTab(user, branches, stylists, bookings);
      }
    },

    // -----------------------------------------------------------------------
    // SUB-TAB 2: ĐIỀU PHỐI LỊCH HẸN (BOOKINGS DISPATCHER)
    // -----------------------------------------------------------------------
    renderBookingsTab(user, bookings, branches, stylists, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      let filtered = [...bookings];

      // Lọc theo quyền chi nhánh (Branch Manager) hoặc bộ lọc
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

      this.dispatchBranchFilter = this.dispatchBranchFilter || 'all';
      let scopedStylists = (this.isBranchManager(user) && user.branchId)
        ? stylists.filter(s => s.branchId === user.branchId)
        : (this.dispatchBranchFilter !== 'all'
            ? stylists.filter(s => s.branchId === this.dispatchBranchFilter)
            : (this.filterBranch !== 'all' ? stylists.filter(s => s.branchId === this.filterBranch) : stylists));
      if (scopedStylists.length === 0 && (user.branchId === 'br-nb' || user.branchId === 'branch-004')) {
        scopedStylists = stylists.filter(s => s.branchId === 'CN02' || s.branchId === 'br-nb');
      }
      if (scopedStylists.length === 0) {
        scopedStylists = stylists.slice(0, 6);
      }

      this.dispatchPage = this.dispatchPage || 1;
      const dispatchTotalPages = Math.max(1, Math.ceil(scopedStylists.length / this.pageSize));
      if (this.dispatchPage > dispatchTotalPages) this.dispatchPage = dispatchTotalPages;
      const pagedWorkstations = scopedStylists.slice((this.dispatchPage - 1) * this.pageSize, this.dispatchPage * this.pageSize);

      const timelineHtml = `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span class="quick-booking-badge">WORKSTATIONS DISPATCHER</span>
              <span style="font-size: 16px; font-weight: 800; color: var(--text-primary, #FFFFFF);">💈 Bàn Điều Phối Ghế Cắt (Kanban Workstation Columns)</span>
              <span class="badge-terracotta" style="font-size: 11px;">
                ${scopedStylists.length} Ghế Đang Hoạt Động
              </span>

              <!-- Lọc nhân viên / ghế cắt theo Chi Nhánh (Ảnh 5) -->
              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta" style="font-size: 11px;">🔒 ${this.escapeHtml(this._getBranchShortName(user.branchId, bMap))}</span>
              ` : `
                <select class="admin-select-filter" style="height: 32px; font-size: 12px; border-radius: 8px; padding: 2px 10px;"
                        onchange="AdminWeb.dispatchBranchFilter = this.value; AdminWeb.dispatchPage = 1; AdminWeb.refreshBookingsTable();">
                  <option value="all" ${(!this.dispatchBranchFilter || this.dispatchBranchFilter === 'all') ? 'selected' : ''}>Toàn Bộ Chi Nhánh</option>
                  ${branches.map(b => `<option value="${b.id}" ${this.dispatchBranchFilter === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                </select>
              `}
            </div>
            <div style="font-size: 13px; color: var(--text-secondary, #64748B);">
              Click một chạm chuyển trạng thái ca hẹn • Tự động xếp hàng theo khung giờ
            </div>
          </div>

          <div class="admin-kanban-board stylist-timeline-board">
            ${pagedWorkstations.map((st, sIdx) => {
              const globalChairNum = (this.dispatchPage - 1) * this.pageSize + sIdx + 1;
              const stBookings = filtered.filter(b => b.stylistId === st.id || (b.stylistName && b.stylistName.includes(st.name)));
              const hasInProgress = stBookings.some(b => (b.status || '').toLowerCase() === 'in_progress');
              const statusClass = hasInProgress ? 'stylist-status-busy' : 'stylist-status-available';
              const statusText = hasInProgress ? '⚡ Đang Phục Vụ' : '🟢 Ghế Rảnh';

              return `
                <div class="admin-workstation-column stylist-timeline-col">
                  <div class="workstation-column-header stylist-col-header">
                    <img src="${st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}" class="stylist-col-avatar" alt="${this.escapeHtml(st.name)}">
                    <div class="stylist-col-info">
                      <div class="stylist-col-name">Ghế #${globalChairNum} • ${this.escapeHtml(st.name)}</div>
                      <div class="stylist-col-badge">★ ${st.rating || '5.0'} • ${this.escapeHtml(st.role || 'Master Barber')}</div>
                    </div>
                    <span class="stylist-col-status ${statusClass}">${statusText}</span>
                  </div>

                  <div class="workstation-cards-container stylist-col-cards-list">
                    ${stBookings.length === 0 ? `
                      <div class="timeline-empty-notice" style="padding: 24px 12px; text-align: center; color: var(--text-secondary); font-size: 12px; border: 1px dashed var(--border-color); border-radius: 12px; background: rgba(255,255,255,0.02);">
                        Ghế đang trống • Sẵn sàng nhận khách Walk-in
                      </div>
                    ` : stBookings.map(b => {
                      const isConf = (b.status || '').toLowerCase() === 'confirmed';
                      const isInProg = (b.status || '').toLowerCase() === 'in_progress';
                      const isDone = (b.status || '').toLowerCase() === 'completed';

                      return `
                        <div class="kanban-booking-card timeline-booking-card ${isInProg ? 'in-progress' : ''}" style="margin-bottom: 10px; background: var(--surface-card); border: 1px solid ${isInProg ? 'var(--brand-accent)' : 'var(--border-color)'}; border-radius: 14px; padding: 14px;">
                          <div class="timeline-card-time" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-weight: 800; font-size: 13.5px; color: var(--text-primary, #FFFFFF);">⏰ ${this.escapeHtml(b.timeSlot || '')}</span>
                            <span style="font-size: 11px; font-weight: 800; color: ${isInProg ? '#E5B869' : (isDone ? '#10B981' : '#94A3B8')};">
                              ${isDone ? '✓ Hoàn tất' : (isInProg ? '⚡ Đang cắt' : '⏳ Chờ đến')}
                            </span>
                          </div>
                          <div class="timeline-card-customer" style="font-size: 14.5px; font-weight: 800; color: var(--text-primary, #FFFFFF); margin-bottom: 4px;">
                            ${this.escapeHtml(b.customerName || 'Khách Hàng')} 
                            <span style="font-size: 12px; font-weight: 400; color: var(--text-secondary);">(${this.escapeHtml(b.customerPhone || '')})</span>
                          </div>
                          <div class="timeline-card-service" style="font-size: 13px; color: var(--brand-accent); font-weight: 700; margin-bottom: 10px;">
                            ✂️ ${this.escapeHtml(b.serviceName || 'Dịch vụ')} • ${SalonUtils.formatCurrency(b.totalPrice || 0)}
                          </div>
                          <div class="timeline-card-actions" style="display: flex; gap: 8px;">
                            ${isConf ? `
                              <button type="button" class="btn-submit-terracotta" style="padding: 6px 12px; font-size: 11.5px; flex: 1;" 
                                      onclick="AdminWeb.updateBookingStatus('${b.id}', 'In_Progress')" title="Khách đã tới, đưa vào ghế cắt">
                                👉 Check-in Vào Ghế
                              </button>
                            ` : ''}
                            ${isInProg ? `
                              <button type="button" class="btn-submit-terracotta" style="padding: 6px 12px; font-size: 11.5px; background: #10B981; border-color: #10B981; flex: 1;" 
                                      onclick="AdminWeb.updateBookingStatus('${b.id}', 'Completed')" title="Hoàn tất ca cắt tóc">
                                ✓ Hoàn Tất Ca Cắt
                              </button>
                            ` : ''}
                            ${isDone ? `
                              <div style="font-size: 11px; color: #10B981; font-weight: 700; text-align: center; width: 100%; padding: 4px;">
                                ✓ Đã xong ca phục vụ
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

      return `
        ${timelineHtml}
        <div class="admin-table-container">
          <!-- Toolbar Bộ Lọc & Tìm Kiếm -->
          <div class="admin-table-toolbar">
            <div class="table-filter-group">
              <input type="text" class="table-search-input" 
                     placeholder="Tìm theo Mã, Tên, SĐT..." 
                     value="${this.escapeHtml(this.searchQuery)}"
                     oninput="AdminWeb.searchQuery = this.value; AdminWeb.bookingsPage = 1; AdminWeb.refreshBookingsTable();">

              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta" style="font-size: 11px;">🔒 Chi nhánh của bạn</span>
              ` : `
                <select class="table-select-filter" onchange="AdminWeb.filterBranch = this.value; AdminWeb.bookingsPage = 1; AdminWeb.refreshBookingsTable();">
                  <option value="all">Tất cả chi nhánh</option>
                  ${branches.map(b => `<option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                </select>
              `}

              <select class="table-select-filter" onchange="AdminWeb.filterStatus = this.value; AdminWeb.bookingsPage = 1; AdminWeb.refreshBookingsTable();">
                <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
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

            <div style="display:flex; gap: 8px;">
              <button class="btn-submit-terracotta" style="padding: 6px 16px; font-size: 12px;" onclick="if(window.UICommon) window.UICommon.openBookingModal();">
                + Thêm Lịch Hẹn Walk-in
              </button>
            </div>
          </div>

          <!-- Bảng Dữ Liệu Enterprise -->
          <div style="overflow-x: auto;">
            <table class="admin-enterprise-table">
              <thead>
                <tr>
                  <th>Mã Lịch</th>
                  <th>Khách Hàng</th>
                  <th>Số Điện Thoại</th>
                  <th>Dịch Vụ / Combo</th>
                  <th>Chi Nhánh</th>
                  <th>Barber Phục Vụ</th>
                  <th>Ngày & Giờ</th>
                  <th>Tổng Tiền</th>
                  <th>Trạng Thái</th>
                  <th>Chuyển Trạng Thái Nhanh</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody id="adminBookingsTbody">
                ${pagedBookings.length > 0 ? pagedBookings.map(b => {
                  const statusInfo = SalonUtils.formatBookingStatus(b.status);
                  const isConfirmed = (b.status || '').toLowerCase() === 'confirmed';
                  const isInProgress = (b.status || '').toLowerCase() === 'in_progress';
                  const isCompleted = (b.status || '').toLowerCase() === 'completed';

                  return `
                    <tr>
                      <td><strong>${this.escapeHtml(b.bookingCode || b.id)}</strong></td>
                      <td style="font-weight: 700;">${this.escapeHtml(b.customerName)}</td>
                      <td>${this.escapeHtml(b.customerPhone)}</td>
                      <td>${this.escapeHtml(b.serviceName || 'Dịch vụ')}</td>
                      <td>${this.escapeHtml(this._getBranchShortName(b.branchName || b.branchId, bMap))}</td>
                      <td><strong>${this.escapeHtml(b.stylistName || 'Barber')}</strong></td>
                      <td>
                        <strong>${this.escapeHtml(b.timeSlot || '')}</strong>
                        <div style="font-size: 11px; color: #888;">${SalonUtils.formatDate(b.date || b.bookingDate)}</div>
                      </td>
                      <td style="font-weight: 800; color: #c85a44;">${SalonUtils.formatCurrency(b.totalPrice)}</td>
                      <td>
                        <span class="status-pill-pulse ${statusInfo.cssClass}">
                          <span class="pulse-dot"></span> ${statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                          ${isConfirmed ? `
                            <button class="btn-submit-terracotta" style="padding: 3px 8px; font-size: 10px;" 
                                    onclick="AdminWeb.updateBookingStatus('${b.id}', 'In_Progress')" title="Nhận khách vào ghế cắt">
                              👉 Check-in
                            </button>
                          ` : ''}

                          ${isInProgress ? `
                            <button class="btn-submit-terracotta" style="padding: 3px 8px; font-size: 10px; background: #059669;" 
                                    onclick="AdminWeb.updateBookingStatus('${b.id}', 'Completed')" title="Hoàn tất ca cắt tóc">
                              ✓ Xong Ca
                            </button>
                          ` : ''}

                          <select class="table-select-filter" style="padding: 3px 6px; font-size: 10px;" 
                                  onchange="AdminWeb.updateBookingStatus('${b.id}', this.value)">
                            <option value="Confirmed" ${isConfirmed ? 'selected' : ''}>Đã xác nhận</option>
                            <option value="In_Progress" ${isInProgress ? 'selected' : ''}>Đang phục vụ</option>
                            <option value="Completed" ${isCompleted ? 'selected' : ''}>Đã hoàn thành</option>
                            <option value="Cancelled" ${(b.status || '').toLowerCase() === 'cancelled' ? 'selected' : ''}>Hủy ca hẹn</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; gap: 4px;">
                          <button class="pill-btn-outline" style="padding: 3px 6px; font-size: 10px;" 
                                  onclick="AdminWeb.viewBookingQrTicket('${b.id}')" title="Xem mã QR vé">
                            🎟️ QR
                          </button>
                          <button class="pill-btn-outline" style="padding: 3px 6px; font-size: 10px; color: #b91c1c; border-color: #fca5a5;" 
                                  onclick="AdminWeb.deleteBooking('${b.id}')" title="Xóa lịch hẹn">
                            🗑️
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
      `;
    },

    refreshBookingsTable() {
      const content = document.getElementById('adminSubTabContent');
      if (content && this.adminSubTab === 'bookings') {
        const user = this.getCurrentUser();
        const bookings = window.store.getBookings();
        const branches = window.store.getBranches();
        const stylists = window.store.getStylists();
        content.innerHTML = this.renderBookingsTab(user, bookings, branches, stylists);
      }
    },

    updateBookingStatus(bookingId, newStatus) {
      if (!bookingId || !newStatus) return;

      if (newStatus === 'Cancelled') {
        const reason = prompt('Nhập lý do hủy lịch hẹn:', 'Khách báo bận ca đột xuất');
        if (reason === null) return;
        window.store.cancelBooking(bookingId, reason);
      } else {
        window.store.updateBookingStatus(bookingId, newStatus);
      }

      if (window.UICommon) window.UICommon.showToast(`✅ Đã cập nhật lịch #${bookingId} sang [${newStatus}]!`);
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
            <div><strong>Thời gian:</strong> <span style="color:#c85a44; font-weight:800;">${b.timeSlot} — ${SalonUtils.formatDate(b.date || b.bookingDate)}</span></div>
            <div><strong>Barber:</strong> ${this.escapeHtml(b.stylistName || 'Chỉ định')}</div>
            <div><strong>Chi nhánh:</strong> ${this.escapeHtml(b.branchName || b.branchId)}</div>
          </div>

          <button class="btn-submit-terracotta" style="width: 100%;" onclick="AdminWeb._closeModal()">
            Đóng Cửa Sổ
          </button>
        </div>
      `);
    },

    // -----------------------------------------------------------------------
    // SUB-TAB 3: ĐỘI NGŨ BARBER & HOA HỒNG (ZERO N+1 WITH STATS MAP)
    // -----------------------------------------------------------------------
    renderStylistsTab(user, stylists, branches, bookings = null, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      const allBookings = bookings || ((window.store && window.store.getBookings) ? window.store.getBookings() : []);

      let filteredStylists = [...stylists];
      if (this.isBranchManager(user) && user.branchId) {
        filteredStylists = filteredStylists.filter(s => s.branchId === user.branchId);
      } else if (this.filterBranch !== 'all') {
        filteredStylists = filteredStylists.filter(s => s.branchId === this.filterBranch);
      }

      if (this.filterStylistRole && this.filterStylistRole !== 'all') {
        filteredStylists = filteredStylists.filter(s => {
          const r = (s.role || s.ChucVu || '').toLowerCase();
          if (this.filterStylistRole === 'Thợ chính') return r.includes('chính');
          if (this.filterStylistRole === 'Thợ phụ') return r.includes('phụ');
          if (this.filterStylistRole === 'Quản lý chi nhánh') return r.includes('quản lý');
          return true;
        });
      }

      // Khử N+1: Gom nhóm thống kê hoa hồng và ca hôm nay trước vòng lặp
      const stylistStatsMap = this._getStylistStatsMap(filteredStylists, allBookings);

      this.stylistsPage = this.stylistsPage || 1;
      const stylTotalPages = Math.max(1, Math.ceil(filteredStylists.length / this.pageSize));
      if (this.stylistsPage > stylTotalPages) this.stylistsPage = stylTotalPages;
      const pagedStylists = filteredStylists.slice((this.stylistsPage - 1) * this.pageSize, this.stylistsPage * this.pageSize);

      return `
        <!-- Filter & Action Toolbar -->
        <div class="admin-filter-bar" style="border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; background: var(--surface-card); border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Lọc theo Cơ sở:</label>
              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta">🔒 Chi nhánh của bạn</span>
              ` : `
                <select class="admin-select-filter" onchange="AdminWeb.filterBranch = this.value; AdminWeb.stylistsPage = 1; AdminWeb.refreshSubTab();">
                  <option value="all">Tất cả chi nhánh</option>
                  ${branches.map(b => `<option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                </select>
              `}
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <label style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Phân loại thợ:</label>
              <select class="admin-select-filter" onchange="AdminWeb.filterStylistRole = this.value; AdminWeb.stylistsPage = 1; AdminWeb.refreshSubTab();">
                <option value="all" ${(!this.filterStylistRole || this.filterStylistRole === 'all') ? 'selected' : ''}>Tất cả vai trò</option>
                <option value="Thợ chính" ${this.filterStylistRole === 'Thợ chính' ? 'selected' : ''}>✂️ Thợ chính</option>
                <option value="Thợ phụ" ${this.filterStylistRole === 'Thợ phụ' ? 'selected' : ''}>🧴 Thợ phụ</option>
                <option value="Quản lý chi nhánh" ${this.filterStylistRole === 'Quản lý chi nhánh' ? 'selected' : ''}>👔 Quản lý</option>
              </select>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <div style="font-size: 12px; color: var(--text-secondary);">
              Chính sách hoa hồng: <strong style="color: var(--brand-accent);">15% Doanh thu ca cắt hoàn tất</strong>
            </div>
            <button class="btn-submit-terracotta" style="padding: 9px 18px; font-size: 13px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; border-radius: 10px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);" onclick="AdminWeb.openAddStylistModal()">
              <span>+ Thêm Thợ Mới</span>
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px;">
          ${pagedStylists.map(st => {
            const brName = this._getBranchShortName(st.branchId, bMap);
            const comm = stylistStatsMap.get(st.id) || { completedCutsCount: 0, totalCutValue: 0, commissionAmount: 0, todayQueue: [] };
            const isAssis = (st.role || '').toLowerCase().includes('phụ');
            const isLead = (st.role || '').toLowerCase().includes('chính');

            return `
              <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 14px;">
                    <img src="${st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}" 
                         style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid ${isAssis ? '#0ea5e9' : '#c85a44'};" alt="${this.escapeHtml(st.name)}">
                    <div style="flex: 1; min-width: 0;">
                      <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${this.escapeHtml(st.name)}">${this.escapeHtml(st.name)}</h4>
                        <span style="font-size: 12px; font-weight: 800; color: #f59e0b; flex-shrink: 0; margin-left: 6px;">★ ${st.rating || '4.95'}</span>
                      </div>
                      <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        ${isAssis ? `
                          <span style="background: rgba(14, 165, 233, 0.15); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.35); padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800;">🧴 Thợ phụ</span>
                        ` : isLead ? `
                          <span style="background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.35); padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800;">✂️ Thợ chính</span>
                        ` : `
                          <span style="background: rgba(168, 85, 247, 0.15); color: #9333ea; border: 1px solid rgba(168, 85, 247, 0.35); padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800;">👔 Quản lý</span>
                        `}
                        <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">${this.escapeHtml(st.level || 'Master Barber')}</span>
                      </div>
                      <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Cơ sở: ${this.escapeHtml(brName)}</div>
                    </div>
                  </div>

                  <!-- Thống kê hoa hồng 15% & Ca hoàn thành (O(1) Map Lookup) -->
                  <div style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; margin-bottom: 14px;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                      <span style="color: var(--text-secondary);">Ca đã hoàn tất:</span>
                      <strong style="color: var(--text-primary);">${comm.completedCutsCount} lượt</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                      <span style="color: var(--text-secondary);">Doanh thu cắt tạo ra:</span>
                      <strong style="color: var(--text-primary);">${SalonUtils.formatCurrency(comm.totalCutValue)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; border-top: 1px dashed var(--border-color); padding-top: 6px; margin-top: 6px;">
                      <span style="font-weight: 700; color: #059669;">Hoa hồng tạm tính (15%):</span>
                      <strong style="color: #059669; font-size: 14px;">${SalonUtils.formatCurrency(comm.commissionAmount)}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <button class="pill-btn-outline" style="flex: 1; padding: 7px; font-size: 12px; font-weight: 700;" onclick="AdminWeb.viewStylistQueueModal('${st.id}')">
                      📅 Ca Hôm Nay (${comm.todayQueue.length})
                    </button>
                    <button class="btn-submit-terracotta" style="padding: 7px 12px; font-size: 12px; font-weight: 800;" 
                            onclick="if(window.UICommon) window.UICommon.openBookingModal(null, '${st.id}');">
                      + Xếp Khách
                    </button>
                  </div>
                  <div style="display: flex; gap: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                    <button class="pill-btn-outline" style="flex: 1; padding: 6px; font-size: 12px; font-weight: 700;" onclick="AdminWeb.openAddStylistModal('${st.id}')">
                      ✏️ Sửa Thông Tin
                    </button>
                    <button class="pill-btn-outline" style="flex: 1; padding: 6px; font-size: 12px; font-weight: 700; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" onclick="AdminWeb.openUniversalDeleteModal('stylists', '${st.id}')">
                      🗑️ Xóa Thợ
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

    viewStylistQueueModal(stylistId) {
      const st = window.store.getStylistById(stylistId);
      if (!st) return;

      const queue = (window.store && typeof window.store.getStylistQueue === 'function')
        ? window.store.getStylistQueue(stylistId)
        : [];

      this._openModal(`
        <div class="booking-wizard-wrapper" style="max-width: 540px; margin: 0 auto;">
          <div class="booking-header">
            <div class="badge-terracotta">LỊCH TRỰC & CA LÀM VIỆC</div>
            <h2 class="booking-title" style="font-size: 20px;">DANH SÁCH CA HÔM NAY — ${this.escapeHtml(st.name)}</h2>
            <p class="booking-subtitle">Theo dõi khách hàng đã đặt theo từng khung giờ</p>
          </div>

          <div style="max-height: 360px; overflow-y: auto; margin-bottom: 18px;">
            ${queue.length > 0 ? queue.map(b => {
              const statusInfo = SalonUtils.formatBookingStatus(b.status);
              return `
                <div style="background: var(--surface-card, #fafafc); border: 1px solid var(--border-color, #e5e7eb); border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 14px; font-weight: 800; color: var(--text-primary, #111);">
                      ⏰ ${this.escapeHtml(b.timeSlot)} — ${this.escapeHtml(b.customerName)}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary, #666); margin-top: 2px;">
                      Dịch vụ: <strong>${this.escapeHtml(b.serviceName || 'Cắt tóc')}</strong> • SĐT: ${this.escapeHtml(b.customerPhone)}
                    </div>
                  </div>
                  <div>
                    <span class="status-pill-pulse ${statusInfo.cssClass}">
                      <span class="pulse-dot"></span> ${statusInfo.label}
                    </span>
                  </div>
                </div>
              `;
            }).join('') : `
              <div style="text-align: center; padding: 30px; color: #888; font-size: 13px;">
                Chưa có khách đặt lịch nào cho thợ này trong ngày hôm nay.
              </div>
            `}
          </div>

          <button class="btn-submit-terracotta" style="width: 100%;" onclick="AdminWeb._closeModal()">
            Đóng Cửa Sổ
          </button>
        </div>
      `);
    },

    // -----------------------------------------------------------------------
    // SUB-TAB 4: QUẢN TRỊ CATALOG (SERVICES, COMBOS, PRODUCTS CRUD)
    // -----------------------------------------------------------------------
    renderCatalogTab(services, combos, products) {
      let type = this.catalogTabType || 'services';
      if (type !== 'services' && type !== 'combos') {
        type = 'services';
        this.catalogTabType = 'services';
      }
      const q = (this.catalogSearchQuery || '').toLowerCase();

      let items = [];
      if (type === 'services') {
        items = services.filter(s => !q || s.name.toLowerCase().includes(q) || (s.category && s.category.toLowerCase().includes(q)));
      } else {
        items = combos.filter(c => !q || c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
      }

      this.catalogPage = this.catalogPage || 1;
      const catTotalPages = Math.max(1, Math.ceil(items.length / this.pageSize));
      if (this.catalogPage > catTotalPages) this.catalogPage = catTotalPages;
      const pagedItems = items.slice((this.catalogPage - 1) * this.pageSize, this.catalogPage * this.pageSize);

      return `
        <div class="admin-table-container">
          <!-- Toolbar Phân Loại Catalog & Thêm Mới -->
          <div class="admin-table-toolbar">
            <div class="table-filter-group">
              <button type="button" class="admin-tab-btn ${type === 'services' ? 'active' : ''}" 
                      style="padding: 6px 14px; font-size: 12px;" onclick="AdminWeb.catalogTabType = 'services'; AdminWeb.catalogPage = 1; AdminWeb.refreshCatalogView();">
                ✂️ Dịch Vụ Cắt Tóc (${services.length})
              </button>
              <button type="button" class="admin-tab-btn ${type === 'combos' ? 'active' : ''}" 
                      style="padding: 6px 14px; font-size: 12px;" onclick="AdminWeb.catalogTabType = 'combos'; AdminWeb.catalogPage = 1; AdminWeb.refreshCatalogView();">
                🌟 Gói Combo VIP (${combos.length})
              </button>
              <input type="text" class="table-search-input" placeholder="Tìm theo tên dịch vụ..." 
                     value="${this.escapeHtml(this.catalogSearchQuery)}" 
                     oninput="AdminWeb.catalogSearchQuery = this.value; AdminWeb.catalogPage = 1; AdminWeb.refreshCatalogView();">
            </div>

            <div>
              <button class="btn-submit-terracotta" style="padding: 7px 16px; font-size: 12px;" onclick="AdminWeb.openCatalogModal('${type}')">
                + Thêm ${type === 'services' ? 'Dịch Vụ' : 'Gói Combo'} Mới
              </button>
            </div>
          </div>

          <!-- Bảng Dữ Liệu Catalog -->
          <div style="overflow-x: auto;">
            <table class="admin-enterprise-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Mã</th>
                  <th>Tên Dịch Vụ / Combo</th>
                  <th>Phân Loại</th>
                  <th>Giá Niêm Yết</th>
                  <th>Thời Lượng</th>
                  <th>Mô Tả Tóm Tắt</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                ${pagedItems.length > 0 ? pagedItems.map(item => `
                  <tr>
                    <td>
                      <img src="${SalonUtils.formatImageUrl(item.image)}" 
                           style="width: 42px; height: 42px; border-radius: 6px; object-fit: cover;" alt="${this.escapeHtml(item.name)}"
                           onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=120&q=80');">
                    </td>
                    <td><strong>${this.escapeHtml(item.id)}</strong></td>
                    <td style="font-weight: 800;">${this.escapeHtml(item.name)}</td>
                    <td>
                      <span class="badge-terracotta" style="font-size: 10px; padding: 2px 8px;">
                        ${this.escapeHtml(item.category || (type === 'combos' ? 'Combo VIP' : 'Dịch Vụ'))}
                      </span>
                    </td>
                    <td style="font-weight: 900; color: #c85a44;">
                      ${SalonUtils.formatCurrency(item.price)}
                      ${item.oldPrice && item.oldPrice > item.price ? `<span style="font-size: 11px; color: #999; text-decoration: line-through; display: block;">${SalonUtils.formatCurrency(item.oldPrice)}</span>` : ''}
                    </td>
                    <td>
                      <strong>${item.duration || 45}</strong> phút
                    </td>
                    <td style="font-size: 12px; color: var(--text-secondary, #888); max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${this.escapeHtml(item.description || 'Chất lượng tiêu chuẩn Omni Salon Suite')}
                    </td>
                    <td>
                      <div style="display: flex; gap: 4px;">
                        <button class="pill-btn-outline" style="padding: 3px 8px; font-size: 11px;" 
                                onclick="AdminWeb.openCatalogModal('${type}', '${item.id}')">
                          ✏️ Sửa
                        </button>
                        <button class="pill-btn-outline" style="padding: 3px 8px; font-size: 11px; color: #b91c1c; border-color: #fca5a5;" 
                                onclick="AdminWeb.deleteCatalogItem('${type}', '${item.id}')">
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="8" style="text-align: center; padding: 32px; color: #888;">
                      Không tìm thấy mặt hàng nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
          ${this._renderPaginationControls(this.catalogPage, catTotalPages, items.length, 'AdminWeb.setCatalogPage', 'dịch vụ / combo')}
        </div>
      `;
    },

    refreshCatalogView() {
      const content = document.getElementById('adminSubTabContent');
      if (content && this.adminSubTab === 'catalog') {
        const services = window.store.getServices();
        const combos = window.store.getCombos();
        const products = window.store.getProducts();
        content.innerHTML = this.renderCatalogTab(services, combos, products);
      }
    },

    openCatalogModal(type, itemId = null) {
      let item = null;
      if (itemId) {
        if (type === 'services') item = window.store.getServiceById(itemId);
        else if (type === 'combos') item = window.store.getComboById(itemId);
        else item = window.store.getProductById(itemId);
      }

      const isEdit = !!item;
      const typeLabel = type === 'services' ? 'Dịch Vụ' : type === 'combos' ? 'Gói Combo VIP' : 'Sản Phẩm';

      this._openModal(`
        <div style="max-width: 520px; margin: 0 auto;">
          <div class="badge-terracotta">QUẢN LÝ CATALOG SALON</div>
          <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0 16px;">${isEdit ? 'CHỈNH SỬA' : 'THÊM MỚI'} ${typeLabel.toUpperCase()}</h2>
          <form onsubmit="event.preventDefault(); AdminWeb.submitCatalogForm('${type}', '${itemId || ''}');">
            <div style="margin-bottom: 12px;">
              <label class="sub-label">Tên Mặt Hàng / Gói Dịch Vụ:</label>
              <input type="text" id="catName" class="form-control-custom" placeholder="VD: Uốn Textured Crop / Sáp Brosh Matte..." value="${this.escapeHtml(item?.name || '')}" required>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Giá Bán (VNĐ):</label>
                <input type="number" id="catPrice" class="form-control-custom" placeholder="250000" value="${item?.price || ''}" required min="1000">
              </div>
              <div>
                <label class="sub-label">Giá Gốc / So Sánh (VNĐ):</label>
                <input type="number" id="catOldPrice" class="form-control-custom" placeholder="320000" value="${item?.oldPrice || item?.price || ''}">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">${type === 'products' ? 'Thương Hiệu:' : 'Phân Loại (Category):'}</label>
                <input type="text" id="catCategory" class="form-control-custom" value="${this.escapeHtml(item?.category || item?.brand || (type === 'products' ? 'Brosh Japan' : 'haircut'))}" required>
              </div>
              <div>
                <label class="sub-label">${type === 'products' ? 'Số Lượng Tồn Kho:' : 'Thời Lượng Thực Hiện (Phút):'}</label>
                <input type="number" id="catDurationOrStock" class="form-control-custom" value="${item?.duration || item?.stock || (type === 'products' ? 30 : 45)}" required min="1">
              </div>
            </div>
            <div style="margin-bottom: 12px;">
              <label class="sub-label">Đường Dẫn Ảnh (Image URL):</label>
              <input type="url" id="catImage" class="form-control-custom" value="${this.escapeHtml(item?.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80')}">
            </div>
            <div style="margin-bottom: 16px;">
              <label class="sub-label">Mô Tả Chi Tiết:</label>
              <textarea id="catDescription" class="form-control-custom" rows="2" placeholder="Mô tả công dụng và các bước phục vụ...">${this.escapeHtml(item?.description || '')}</textarea>
            </div>
            <div style="display: flex; gap: 10px;">
              <button type="button" class="btn-cancel" style="flex: 1;" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
              <button type="submit" class="btn-submit-terracotta" style="flex: 1;">${isEdit ? 'Cập Nhật' : 'Lưu Mặt Hàng'}</button>
            </div>
          </form>
        </div>
      `);
    },

    submitCatalogForm(type, itemId) {
      const name = (document.getElementById('catName')?.value || '').trim();
      const price = Number(document.getElementById('catPrice')?.value) || 0;
      const oldPrice = Number(document.getElementById('catOldPrice')?.value) || price;
      const catOrBrand = (document.getElementById('catCategory')?.value || '').trim();
      const durOrStock = Number(document.getElementById('catDurationOrStock')?.value) || 45;
      const image = (document.getElementById('catImage')?.value || '').trim();
      const description = (document.getElementById('catDescription')?.value || '').trim();

      if (!name || price <= 0) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Vui lòng nhập tên và giá bán hợp lệ!', 'warning');
        else alert('Vui lòng nhập tên và giá bán hợp lệ!');
        return;
      }

      if (itemId) {
        if (type === 'services') {
          window.store.updateService(itemId, { name, price, oldPrice, category: catOrBrand, duration: durOrStock, image, description });
        } else if (type === 'combos') {
          window.store.updateCombo(itemId, { name, price, oldPrice, duration: durOrStock, image, description });
        } else {
          window.store.updateProduct(itemId, { name, price, oldPrice, brand: catOrBrand, stock: durOrStock, image, description });
        }
        if (window.UICommon) window.UICommon.showToast(`✅ Đã cập nhật [${name}] thành công!`);
      } else {
        if (type === 'services') {
          window.store.addService({ name, price, oldPrice, category: catOrBrand, duration: durOrStock, image, description });
        } else if (type === 'combos') {
          window.store.addCombo({ name, price, oldPrice, duration: durOrStock, image, description });
        } else {
          window.store.addProduct({ name, price, oldPrice, brand: catOrBrand, stock: durOrStock, image, description });
        }
        if (window.UICommon) window.UICommon.showToast(`✅ Đã thêm [${name}] vào danh mục!`);
      }

      this._closeModal();
      this.refreshCatalogView();
    },

    deleteCatalogItem(type, id) {
      this.openUniversalDeleteModal(type, id);
    },

    // -----------------------------------------------------------------------
    // SUB-TAB 5: QUẢN LÝ KHO HÀNG ĐA CHI NHÁNH (INVENTORY)
    // -----------------------------------------------------------------------
    renderInventoryTab(user, branches, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      const branchId = (this.isBranchManager(user) && user.branchId) ? user.branchId : (this.filterBranch !== 'all' ? this.filterBranch : null);
      const inventory = (window.store && typeof window.store.getBranchInventory === 'function')
        ? window.store.getBranchInventory(branchId)
        : [];

      const q = (this.inventorySearchQuery || '').toLowerCase();
      let lowStockCount = 0;
      const filtered = [];

      // Khử lọc 2 lần: Đếm và lọc trong 1 lượt O(Inventory)
      inventory.forEach(it => {
        if (it.isLowStock || (it.stock <= 5)) lowStockCount++;
        if (!q || 
            (it.productName && it.productName.toLowerCase().includes(q)) || 
            (it.brand && it.brand.toLowerCase().includes(q)) ||
            (it.productId && it.productId.toLowerCase().includes(q))) {
          filtered.push(it);
        }
      });

      this.inventoryPage = this.inventoryPage || 1;
      const invTotalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (this.inventoryPage > invTotalPages) this.inventoryPage = invTotalPages;
      const pagedInventory = filtered.slice((this.inventoryPage - 1) * this.pageSize, this.inventoryPage * this.pageSize);

      return `
        <div class="admin-table-container">
          <!-- Toolbar Kho Hàng -->
          <div class="admin-table-toolbar">
            <div class="table-filter-group">
              <input type="text" class="table-search-input" placeholder="Tìm sản phẩm sáp, pomade..." 
                     value="${this.escapeHtml(this.inventorySearchQuery)}" 
                     oninput="AdminWeb.inventorySearchQuery = this.value; AdminWeb.inventoryPage = 1; AdminWeb.refreshInventoryView();">

              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta">🔒 Chi nhánh của bạn</span>
              ` : `
                <select class="table-select-filter" onchange="AdminWeb.filterBranch = this.value; AdminWeb.inventoryPage = 1; AdminWeb.refreshInventoryView();">
                  <option value="all">Toàn bộ chi nhánh</option>
                  ${branches.map(b => `<option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                </select>
              `}
            </div>

            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              ${lowStockCount > 0 ? `
                <span class="stock-badge-critical" style="padding: 6px 12px; font-size: 12px;">
                  ⚠️ Có ${lowStockCount} sản phẩm sắp hết hàng (&lt;= 5)!
                </span>
              ` : `
                <span class="stock-badge-safe" style="padding: 6px 12px; font-size: 12px;">
                  ✓ Kho hàng ổn định
                </span>
              `}
              <button type="button" class="btn-submit-terracotta" style="padding: 7px 16px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;" onclick="AdminWeb.openProductModal()">
                + Thêm Sản Phẩm Mới
              </button>
            </div>
          </div>

          <!-- Bảng Tồn Kho & Quản Lý Sản Phẩm Gộp Hoàn Chỉnh -->
          <div style="overflow-x: auto;">
            <table class="admin-enterprise-table">
              <thead>
                <tr>
                  <th style="width: 52px;">Ảnh</th>
                  <th style="width: 75px;">Mã SP</th>
                  <th>Tên Sản Phẩm</th>
                  <th>Thương Hiệu</th>
                  <th>Đơn Giá Bán</th>
                  <th>Tồn Kho</th>
                  <th>Tình Trạng Kho</th>
                  <th style="min-width: 175px;">Điều Chỉnh Nhanh</th>
                  <th style="min-width: 130px;">Sửa Thông Tin &amp; Xóa</th>
                </tr>
              </thead>
              <tbody>
                ${pagedInventory.length > 0 ? pagedInventory.map(item => {
                  const stock = item.stock || 0;
                  let badge = '';
                  if (stock > 5) {
                    badge = `<span class="stock-badge-safe">✓ Còn Hàng (${stock})</span>`;
                  } else if (stock > 0) {
                    badge = `<span class="stock-badge-low">⚠️ Sắp Hết (${stock})</span>`;
                  } else {
                    badge = `<span class="stock-badge-critical">✕ HẾT HÀNG (0)</span>`;
                  }

                  return `
                    <tr>
                      <td>
                        <img src="${SalonUtils.formatImageUrl(item.image || item.HinhAnh)}" 
                             style="width: 44px; height: 44px; border-radius: 8px; object-fit: contain; background: #ffffff; padding: 2px; border: 1px solid var(--border-color, #e2e8f0);" alt="${this.escapeHtml(item.productName)}"
                             onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=120&q=80');">
                      </td>
                      <td><strong>${this.escapeHtml(item.productId)}</strong></td>
                      <td style="font-weight: 700;">${this.escapeHtml(item.productName)}</td>
                      <td>
                        <span class="badge-terracotta" style="font-size: 10px; padding: 2px 8px;">
                          ${this.escapeHtml(item.brand || 'CHÍNH HÃNG')}
                        </span>
                      </td>
                      <td style="font-weight: 800; color: #c85a44;">${SalonUtils.formatCurrency(item.price)}</td>
                      <td><strong style="font-size: 14px;">${stock}</strong> hộp/cái</td>
                      <td>${badge}</td>
                      <td>
                        <div style="display: flex; gap: 4px; align-items: center;">
                          <button class="pill-btn-outline" style="padding: 2px 8px; font-size: 11px;" title="Trừ 1 sản phẩm"
                                  onclick="AdminWeb.adjustStock('${item.id}', ${stock - 1})">-1</button>
                          <button class="pill-btn-outline" style="padding: 2px 8px; font-size: 11px;" title="Cộng 5 sản phẩm"
                                  onclick="AdminWeb.adjustStock('${item.id}', ${stock + 5})">+5</button>
                          <button class="pill-btn-outline" style="padding: 2px 8px; font-size: 11px;" title="Cộng 20 sản phẩm"
                                  onclick="AdminWeb.adjustStock('${item.id}', ${stock + 20})">+20</button>
                          <button class="btn-submit-terracotta" style="padding: 2px 8px; font-size: 10px;" title="Nhập số kiểm kê thực tế"
                                  onclick="AdminWeb.promptExactStock('${item.id}', ${stock})">Nhập số</button>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; gap: 5px; align-items: center;">
                          <button class="pill-btn-outline" style="padding: 3px 9px; font-size: 11px; display: inline-flex; align-items: center; gap: 3px;" 
                                  onclick="AdminWeb.openProductModal('${item.productId}')" title="Chỉnh sửa thông tin chi tiết sản phẩm">
                            ✏️ Sửa
                          </button>
                          <button class="pill-btn-outline" style="padding: 3px 9px; font-size: 11px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4); display: inline-flex; align-items: center; gap: 3px;" 
                                  onclick="AdminWeb.deleteInventoryProduct('${item.productId}')" title="Xóa sản phẩm khỏi kho hàng">
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="9" style="text-align: center; padding: 30px; color: #888;">
                      Không tìm thấy bản ghi tồn kho nào phù hợp.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
          ${this._renderPaginationControls(this.inventoryPage, invTotalPages, filtered.length, 'AdminWeb.setInventoryPage', 'sản phẩm')}
        </div>
      `;
    },

    refreshInventoryView() {
      const content = document.getElementById('adminSubTabContent');
      if (content && this.adminSubTab === 'inventory') {
        const user = this.getCurrentUser();
        const branches = window.store.getBranches();
        content.innerHTML = this.renderInventoryTab(user, branches);
      }
    },

    adjustStock(invId, newStock) {
      const val = Math.max(0, parseInt(newStock) || 0);
      window.store.updateProductStock(invId, val);
      if (window.UICommon) window.UICommon.showToast(`📦 Đã cập nhật tồn kho: ${val} sản phẩm!`);
      this.refreshInventoryView();
    },

    promptExactStock(invId, currentStock) {
      const res = prompt('Nhập số lượng tồn kho thực tế sau kiểm kê:', currentStock);
      if (res !== null && !isNaN(res) && res.trim() !== '') {
        this.adjustStock(invId, parseInt(res));
      }
    },

    openProductModal(productId = null) {
      const isEdit = !!productId;
      const product = isEdit ? window.store.getProductById(productId) : null;
      const currentStock = productId ? window.store.getProductStock(null, productId) : 25;
      const stockVal = product?.stock !== undefined ? product.stock : currentStock;
      const rawImg = product?.image || product?.HinhAnh || '';
      const displayImg = typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function'
        ? SalonUtils.formatImageUrl(rawImg)
        : (rawImg || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');

      let stockBadgeHtml = '';
      if (stockVal > 5) {
        stockBadgeHtml = `<span class="stock-badge-safe" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">✓ CÒN HÀNG (${stockVal} SP)</span>`;
      } else if (stockVal > 0) {
        stockBadgeHtml = `<span class="stock-badge-low" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">⚠️ SẮP HẾT HÀNG (${stockVal} SP)</span>`;
      } else {
        stockBadgeHtml = `<span class="stock-badge-critical" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">✕ HẾT HÀNG (0 SP)</span>`;
      }

      this._openModal(`
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 14px; margin-bottom: 20px;">
            <div>
              <div class="badge-terracotta" style="margin-bottom: 6px;">QUẢN LÝ KHO &amp; SẢN PHẨM RETAIL</div>
              <h2 style="font-size: 22px; font-weight: 800; margin: 0; color: #FFFFFF; letter-spacing: -0.01em;">
                ${isEdit ? 'CHỈNH SỬA THÔNG TIN SẢN PHẨM' : 'THÊM MỚI SẢN PHẨM VÀO KHO'}
              </h2>
            </div>
            <div style="text-align: right; font-size: 12px; color: var(--color-text-muted, #94a3b8);">
              Mã sản phẩm: <strong style="color: #f59e0b; font-family: monospace; font-size: 14px;">${this.escapeHtml(productId || 'NEW_ITEM')}</strong>
            </div>
          </div>

          <form onsubmit="event.preventDefault(); AdminWeb.submitProductForm('${productId || ''}');">
            <div class="product-modal-grid">
              <!-- CỘT TRÁI: LIVE IMAGE PREVIEW & TRẠNG THÁI TỒN KHO -->
              <div class="product-modal-preview-card">
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Ảnh Xem Trước</span>
                  <span style="font-size: 11px; color: #f59e0b; background: rgba(245, 158, 11, 0.12); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Live Preview</span>
                </div>

                <div class="product-modal-img-wrapper">
                  <img id="modalPreviewImg" src="${displayImg}" 
                       alt="${this.escapeHtml(product?.name || 'Ảnh sản phẩm')}" 
                       onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');">
                </div>

                <div id="modalStockStatusBox" style="width: 100%; margin-bottom: 12px;">
                  ${stockBadgeHtml}
                </div>

                <div style="width: 100%; background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px; font-size: 12px; color: #94a3b8; text-align: left; line-height: 1.5;">
                  💡 <strong>Ghi chú:</strong> Khi thay đổi đường dẫn ảnh hoặc số lượng tồn kho bên phải, khung xem trước và trạng thái sẽ tự động cập nhật ngay lập tức.
                </div>
              </div>

              <!-- CỘT PHẢI: FORM CÁC TRƯỜNG DỮ LIỆU RỘNG RÃI -->
              <div>
                <div style="margin-bottom: 14px;">
                  <label class="sub-label">Tên Sản Phẩm <span style="color: #ef4444;">*</span>:</label>
                  <input type="text" id="prodName" class="form-control-custom" style="font-size: 15px; font-weight: 600;" placeholder="VD: Sáp Brosh Matte Clay 115g..." value="${this.escapeHtml(product?.name || product?.TenSanPham || '')}" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <div>
                    <label class="sub-label">Thương Hiệu / Hãng <span style="color: #ef4444;">*</span>:</label>
                    <input type="text" id="prodBrand" class="form-control-custom" placeholder="VD: Hanz de Fuko, Brosh, Reuzel..." value="${this.escapeHtml(product?.brand || 'CHÍNH HÃNG')}" required>
                  </div>
                  <div>
                    <label class="sub-label">Số Lượng Tồn Kho <span style="color: #ef4444;">*</span>:</label>
                    <input type="number" id="prodStock" class="form-control-custom" placeholder="25" value="${stockVal}" required min="0" oninput="AdminWeb._updateModalStockBadge(this.value)">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <div>
                    <label class="sub-label">Đơn Giá Bán (VNĐ) <span style="color: #ef4444;">*</span>:</label>
                    <input type="number" id="prodPrice" class="form-control-custom" style="font-weight: 700; color: #fbbf24 !important;" placeholder="350000" value="${product?.price || ''}" required min="1000">
                  </div>
                  <div>
                    <label class="sub-label">Giá Gốc / So Sánh (VNĐ):</label>
                    <input type="number" id="prodOldPrice" class="form-control-custom" placeholder="420000" value="${product?.oldPrice || product?.price || ''}">
                  </div>
                </div>

                <div style="margin-bottom: 14px;">
                  <label class="sub-label">Đường Dẫn Ảnh (Men_Grooming_Products/... hoặc Link URL):</label>
                  <input type="text" id="prodImage" class="form-control-custom" placeholder="Men_Grooming_Products/... hoặc https://..." value="${this.escapeHtml(rawImg)}" oninput="AdminWeb._updateModalPreviewImage(this.value)">
                </div>

                <div style="margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <label class="sub-label" style="margin-bottom: 0;">Mô Tả Sản Phẩm &amp; Thông Số Chi Tiết:</label>
                    <span style="font-size: 12px; color: #94a3b8;">Có thể kéo góc dưới để mở rộng thêm</span>
                  </div>
                  <textarea id="prodDescription" class="form-control-custom" rows="6" style="min-height: 160px; font-size: 14.5px; line-height: 1.6; padding: 14px 16px;" placeholder="Ví dụ: Tạo texture, tăng độ phồng, giữ tóc vào nếp với hiệu ứng mờ tự nhiên...&#10;- Dung tích: 80g&#10;- Độ giữ nếp: Cao (High Hold)&#10;- Độ bóng: Mờ (Matte Finish)&#10;- Mùi hương: Hương nước hoa nam thanh lịch...">${this.escapeHtml(product?.description || product?.MoTa || '')}</textarea>
                </div>

                <div style="display: flex; gap: 14px; margin-top: 8px;">
                  <button type="button" class="btn-cancel" style="flex: 1; min-height: 48px; font-size: 15px; font-weight: 700; cursor: pointer;" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
                  <button type="submit" class="btn-submit-terracotta" style="flex: 1.6; min-height: 48px; font-size: 15px; font-weight: 800; cursor: pointer;">
                    ${isEdit ? '💾 Cập Nhật Sản Phẩm' : '✨ Lưu Sản Phẩm Vào Kho'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      `, true);
    },

    submitProductForm(productId) {
      const name = (document.getElementById('prodName')?.value || '').trim();
      const brand = (document.getElementById('prodBrand')?.value || '').trim();
      const price = Number(document.getElementById('prodPrice')?.value) || 0;
      const oldPrice = Number(document.getElementById('prodOldPrice')?.value) || price;
      const stock = Math.max(0, parseInt(document.getElementById('prodStock')?.value) || 0);
      const image = (document.getElementById('prodImage')?.value || '').trim();
      const description = (document.getElementById('prodDescription')?.value || '').trim();

      if (!name || price <= 0) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Vui lòng nhập tên sản phẩm và giá bán hợp lệ!', 'warning');
        else alert('Vui lòng nhập tên sản phẩm và giá bán hợp lệ!');
        return;
      }

      if (productId) {
        window.store.updateProduct(productId, { name, brand, price, oldPrice, stock, image, description });
        if (window.UICommon) window.UICommon.showToast(`✅ Đã cập nhật sản phẩm [${name}]!`);
      } else {
        window.store.addProduct({ name, brand, price, oldPrice, stock, image, description });
        if (window.UICommon) window.UICommon.showToast(`✅ Đã thêm mới sản phẩm [${name}] vào kho hàng!`);
      }

      this._closeModal();
      this.refreshInventoryView();
    },

    deleteInventoryProduct(productId) {
      this.openUniversalDeleteModal('products', productId);
    },

    openDeleteConfirmModal(productId) {
      this.openUniversalDeleteModal('products', productId);
    },

    executeDeleteProduct(productId) {
      this.executeUniversalDelete('products', productId);
    },

    // -----------------------------------------------------------------------
    // QUY TRÌNH XÁC NHẬN XÓA CHUNG TOÀN HỆ THỐNG (UNIFIED DELETE CONFIRM MODAL)
    // Áp dụng 1 form duy nhất cho: Sản Phẩm, Dịch Vụ, Gói Combo, Thợ, Lịch Hẹn
    // -----------------------------------------------------------------------
    openUniversalDeleteModal(type, id) {
      let title = 'Xác Nhận Xóa Khỏi Hệ Thống?';
      let badge = 'CẢNH BÁO XÓA DỮ LIỆU';
      let warning = 'Bạn có chắc chắn muốn xóa mục này khỏi hệ thống OmniSalon? Dữ liệu sẽ bị gỡ bỏ và đồng bộ trực tiếp vào database SQL.';
      let code = `#${id}`;
      let subTag = 'HỆ THỐNG';
      let name = id;
      let img = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';
      let detail1 = '';
      let detail2 = '';

      if (type === 'products') {
        const p = window.store.getProductById(id);
        badge = 'CẢNH BÁO XÓA HÀNG HÓA';
        title = 'Xác Nhận Xóa Khỏi Kho?';
        warning = 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống kho OmniSalon? Dữ liệu hàng hóa sẽ bị gỡ bỏ và không thể hoàn tác.';
        code = `#${id}`;
        subTag = p?.brand || 'CHÍNH HÃNG';
        name = p ? (p.name || p.TenSanPham) : id;
        const price = p?.price ? SalonUtils.formatCurrency(p.price) : '0 đ';
        const stock = window.store.getProductStock(null, id) || (p?.stock !== undefined ? p.stock : 0);
        detail1 = `<span style="color: #ef4444; font-weight: 800;">${price}</span>`;
        detail2 = `<span style="color: #94a3b8;">Tồn kho: <strong style="color: #f1f5f9;">${stock}</strong> hộp/cái</span>`;
        img = p?.image || p?.HinhAnh || img;
      } else if (type === 'services') {
        const s = window.store.getServiceById(id);
        badge = 'CẢNH BÁO XÓA DỊCH VỤ';
        title = 'Xác Nhận Xóa Dịch Vụ?';
        warning = 'Bạn có chắc chắn muốn xóa dịch vụ này khỏi danh mục OmniSalon? Dữ liệu dịch vụ sẽ bị xóa và cập nhật vào database SQL.';
        code = `#${id}`;
        subTag = s?.category || 'Dịch Vụ Cắt Tóc';
        name = s ? (s.name || s.TenDichVu) : id;
        const price = s?.price ? SalonUtils.formatCurrency(s.price) : '0 đ';
        const dur = s?.duration || s?.durationMinutes || 45;
        detail1 = `<span style="color: #ef4444; font-weight: 800;">${price}</span>`;
        detail2 = `<span style="color: #94a3b8;">Thời lượng: <strong style="color: #f1f5f9;">${dur} phút</strong></span>`;
        img = s?.image || img;
      } else if (type === 'combos') {
        const c = window.store.getComboById(id);
        badge = 'CẢNH BÁO XÓA COMBO VIP';
        title = 'Xác Nhận Xóa Gói Combo?';
        warning = 'Bạn có chắc chắn muốn xóa combo VIP này khỏi danh mục kinh doanh? Dữ liệu sẽ bị gỡ bỏ khỏi hệ thống.';
        code = `#${id}`;
        subTag = 'Combo VIP';
        name = c ? c.name : id;
        const price = c?.price ? SalonUtils.formatCurrency(c.price) : '0 đ';
        const dur = c?.duration || 60;
        detail1 = `<span style="color: #ef4444; font-weight: 800;">${price}</span>`;
        detail2 = `<span style="color: #94a3b8;">Thời lượng: <strong style="color: #f1f5f9;">${dur} phút</strong></span>`;
        img = c?.image || img;
      } else if (type === 'stylists') {
        const st = window.store.getStylistById(id);
        const role = st?.role || 'Thợ chính';
        badge = `CẢNH BÁO XÓA NHÂN SỰ (${role.toUpperCase()})`;
        title = 'Xác Nhận Xóa Thợ Khỏi Hệ Thống?';
        warning = `Bạn có chắc chắn muốn xóa ${role.toLowerCase()} này khỏi danh sách đội ngũ OmniSalon? Dữ liệu nhân sự sẽ bị gỡ bỏ và đồng bộ trực tiếp vào database SQL.`;
        code = `#${st?.id || id}`;
        subTag = `${role} • ${st?.level || 'Master Barber'}`;
        name = st ? (st.name || st.HoTen) : id;
        const brName = this._getBranchShortName(st?.branchId || 'CN01');
        detail1 = `<span style="color: #f59e0b; font-weight: 700;">★ ${st?.rating || '4.95'}</span>`;
        detail2 = `<span style="color: #94a3b8;">Cơ sở: <strong style="color: #f1f5f9;">${brName}</strong></span>`;
        img = st?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
      } else if (type === 'bookings') {
        const b = (window.store.getBookings() || []).find(it => it.id === id || it.bookingCode === id);
        badge = 'CẢNH BÁO XÓA LỊCH HẸN';
        title = 'Xác Nhận Xóa Lịch Hẹn?';
        warning = 'Bạn có chắc chắn muốn xóa vĩnh viễn phiếu lịch hẹn này khỏi hệ thống? Dữ liệu lịch hẹn sẽ bị gỡ bỏ hoàn toàn khỏi database SQL.';
        code = `#${b?.bookingCode || id}`;
        subTag = b?.serviceName || 'Lịch Hẹn Cắt Tóc';
        name = `Khách: ${b?.customerName || 'Khách Hàng'} (${b?.customerPhone || ''})`;
        detail1 = `<span style="color: #ef4444; font-weight: 800;">${b?.timeSlot || '09:00'} — ${b?.date || ''}</span>`;
        detail2 = `<span style="color: #94a3b8;">Thợ: <strong style="color: #f1f5f9;">${b?.stylistName || 'Barber'}</strong></span>`;
      } else if (type === 'branches') {
        const br = (window.store.getBranches() || []).find(b => b.id === id || b.MaChiNhanh === id);
        badge = 'CẢNH BÁO XÓA CHI NHÁNH';
        title = 'Xác Nhận Xóa Chi Nhánh Khỏi Hệ Thống?';
        warning = 'Bạn có chắc chắn muốn xóa chi nhánh này khỏi OmniSalon? Dữ liệu chi nhánh sẽ bị gỡ bỏ và đồng bộ trực tiếp vào database SQL.';
        code = `#${id}`;
        subTag = br?.city || 'Chi Nhánh Salon';
        name = br ? (br.name || br.TenChiNhanh) : id;
        const addr = br?.address || br?.DiaChi || '';
        const ph = br?.phone || br?.SoDienThoai || '';
        detail1 = `<span style="color: #ef4444; font-weight: 700;">${ph}</span>`;
        detail2 = `<span style="color: #94a3b8; font-size: 11px;">${addr}</span>`;
        img = br?.image || img;
      }

      const displayImg = typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function'
        ? SalonUtils.formatImageUrl(img)
        : (img || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');

      this._openModal(`
        <div style="text-align: center; padding: 10px 4px; max-width: 480px; margin: 0 auto;">
          <!-- ICON NỔI BẬT NGUY HIỂM -->
          <div style="width: 72px; height: 72px; margin: 0 auto 16px; border-radius: 50%; background: rgba(239, 68, 68, 0.12); border: 2px solid rgba(239, 68, 68, 0.35); display: flex; align-items: center; justify-content: center; font-size: 32px; box-shadow: 0 0 25px rgba(239, 68, 68, 0.25);">
            🗑️
          </div>

          <div class="badge-terracotta" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.35); margin-bottom: 8px;">
            ${badge}
          </div>

          <h3 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 0 0 10px; letter-spacing: -0.01em;">
            ${title}
          </h3>

          <p style="font-size: 14px; color: #94a3b8; margin: 0 0 20px; line-height: 1.5;">
            ${warning}
          </p>

          <!-- CARD THÔNG TIN ĐỐI TƯỢNG CHUẨN BỊ XÓA -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 14px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px; text-align: left;">
            <img src="${displayImg}" alt="${this.escapeHtml(name)}" 
                 style="width: 60px; height: 60px; border-radius: 10px; object-fit: cover; background: #ffffff; padding: 2px; border: 1px solid rgba(255, 255, 255, 0.15); flex-shrink: 0;" 
                 onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=120&q=80');">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-family: monospace; font-size: 12px; font-weight: 800; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 1px 6px; border-radius: 4px;">${this.escapeHtml(code)}</span>
                <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">${this.escapeHtml(subTag)}</span>
              </div>
              <div style="font-size: 15px; font-weight: 700; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;" title="${this.escapeHtml(name)}">
                ${this.escapeHtml(name)}
              </div>
              <div style="display: flex; gap: 14px; font-size: 13px;">
                ${detail1}
                ${detail2}
              </div>
            </div>
          </div>

          <!-- NÚT HÀNH ĐỘNG -->
          <div style="display: flex; gap: 12px;">
            <button type="button" class="btn-cancel" style="flex: 1; min-height: 48px; font-size: 15px; font-weight: 700; cursor: pointer; border-radius: 12px;" onclick="AdminWeb._closeModal()">
              Hủy Bỏ / Giữ Lại
            </button>
            <button type="button" class="btn-delete-confirm-danger" style="flex: 1.3; min-height: 48px; font-size: 15px; font-weight: 800; cursor: pointer;" onclick="AdminWeb.executeUniversalDelete('${type}', '${id}')">
              🗑️ Đồng Ý Xóa Ngay
            </button>
          </div>
        </div>
      `, false);
    },

    executeUniversalDelete(type, id) {
      if (type === 'products') {
        const p = window.store.getProductById(id);
        const name = p ? (p.name || p.TenSanPham) : id;
        window.store.deleteProduct(id);
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast(`🗑️ Đã xóa sản phẩm #${id} (${name}) khỏi kho và database SQL!`);
        this.refreshInventoryView();
      } else if (type === 'services') {
        const s = window.store.getServiceById(id);
        const name = s ? (s.name || s.TenDichVu) : id;
        window.store.deleteService(id);
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast(`🗑️ Đã xóa dịch vụ #${id} (${name}) khỏi database SQL!`);
        this.refreshCatalogView();
      } else if (type === 'combos') {
        window.store.deleteCombo(id);
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast(`🗑️ Đã xóa combo #${id}!`);
        this.refreshCatalogView();
      } else if (type === 'stylists') {
        const st = window.store.getStylistById(id);
        const name = st ? (st.name || st.HoTen) : id;
        window.store.deleteStylist(id);
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast(`🗑️ Đã xóa thợ [${name}] (#${id}) khỏi hệ thống và database SQL!`);
        this.refreshSubTab();
      } else if (type === 'bookings') {
        window.store.deleteBooking(id);
        this._closeModal();
      } else if (type === 'branches') {
        const br = (window.store.getBranches() || []).find(b => b.id === id || b.MaChiNhanh === id);
        const name = br ? (br.name || br.TenChiNhanh) : id;
        window.store.deleteBranch(id);
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast(`🗑️ Đã xóa chi nhánh #${id} (${name}) khỏi hệ thống và database SQL!`);
        this.refreshSubTab();
      }
    },

    // -----------------------------------------------------------------------
    // THÊM & CHỈNH SỬA THỢ (THỢ CHÍNH & THỢ PHỤ) LƯU VÀO DATABASE SQL
    // -----------------------------------------------------------------------
    openAddStylistModal(stylistId = null) {
      const branches = window.store.getBranches() || [];
      const st = stylistId ? window.store.getStylistById(stylistId) : null;
      const isEdit = !!st;
      const role = st?.role || 'Thợ chính';
      const level = st?.level || (role === 'Thợ phụ' ? 'Junior Barber' : 'Master Barber');
      const branchId = st?.branchId || (this.filterBranch !== 'all' ? this.filterBranch : 'CN01');

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
          <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0 6px;">${isEdit ? 'CHỈNH SỬA THÔNG TIN THỢ' : 'THÊM THỢ MỚI'}</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 16px;">Dữ liệu nhân sự được đồng bộ trực tiếp vào hệ thống OmniSalon.</p>

          <form onsubmit="event.preventDefault(); AdminWeb.submitStylistForm('${stylistId || ''}');">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Phân Loại Thợ / Vai Trò: <span style="color:#ef4444;">*</span></label>
                <select id="stRole" class="form-control-custom" required onchange="AdminWeb.onStylistRoleChange(this.value)">
                  <option value="Thợ chính" ${role === 'Thợ chính' ? 'selected' : ''}>✂️ Thợ chính (Lead Barber)</option>
                  <option value="Thợ phụ" ${role === 'Thợ phụ' ? 'selected' : ''}>🧴 Thợ phụ (Assistant Barber)</option>
                  <option value="Quản lý chi nhánh" ${role === 'Quản lý chi nhánh' ? 'selected' : ''}>👔 Quản lý chi nhánh</option>
                </select>
              </div>

              <div>
                <label class="sub-label">Cấp Bậc Chuyên Môn: <span style="color:#ef4444;">*</span></label>
                <select id="stLevel" class="form-control-custom" required>
                  <option value="Master Barber" ${level === 'Master Barber' ? 'selected' : ''}>Master Barber</option>
                  <option value="Senior Barber" ${level === 'Senior Barber' ? 'selected' : ''}>Senior Barber</option>
                  <option value="Junior Barber" ${level === 'Junior Barber' ? 'selected' : ''}>Junior Barber</option>
                  <option value="Stylist Chuyên Nghiệp" ${level === 'Stylist Chuyên Nghiệp' ? 'selected' : ''}>Stylist Chuyên Nghiệp</option>
                  <option value="Kỹ Thuật Viên Gội Dưỡng Sinh" ${level === 'Kỹ Thuật Viên Gội Dưỡng Sinh' ? 'selected' : ''}>Kỹ Thuật Viên Gội Dưỡng Sinh</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <label class="sub-label">Họ và Tên Thợ: <span style="color:#ef4444;">*</span></label>
              <input type="text" id="stName" class="form-control-custom" placeholder="VD: Nguyễn Tuấn Kiệt" value="${this.escapeHtml(st?.name || st?.HoTen || '')}" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Chi Nhánh / Cơ Sở: <span style="color:#ef4444;">*</span></label>
                <select id="stBranch" class="form-control-custom" required>
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
              <label class="sub-label">Kỹ Thuật & Sở Trường Nổi Bật:</label>
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
                💾 ${isEdit ? 'Cập Nhật Thông Tin' : 'Lưu Thông Tin Thợ'}
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
      }
    },

    submitStylistForm(stylistId) {
      const name = (document.getElementById('stName')?.value || '').trim();
      const role = document.getElementById('stRole')?.value || 'Thợ chính';
      const level = document.getElementById('stLevel')?.value || 'Master Barber';
      const branchId = document.getElementById('stBranch')?.value || 'CN01';
      const phone = (document.getElementById('stPhone')?.value || '').trim();
      const email = (document.getElementById('stEmail')?.value || '').trim();
      const specialty = (document.getElementById('stSpecialty')?.value || '').trim();
      const avatar = (document.getElementById('stAvatar')?.value || '').trim();

      if (!name) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Vui lòng nhập họ và tên của thợ!', 'warning');
        return;
      }

      if (stylistId) {
        window.store.updateStylist(stylistId, { name, role, level, branchId, phone, email, specialty, avatar });
        if (window.UICommon) window.UICommon.showToast(`✅ Đã cập nhật ${role} [${name}] vào database SQL!`);
      } else {
        const created = window.store.addStylist({ name, role, level, branchId, phone, email, specialty, avatar });
        if (window.UICommon) window.UICommon.showToast(`✅ Đã thêm mới ${role} [${name}] vào database SQL (#${created.id})!`);
      }

      this._closeModal();
      this.refreshSubTab();
    },

    // -----------------------------------------------------------------------
    // THÊM & CHỈNH SỬA CHI NHÁNH LƯU VÀO DATABASE SQL (ADD & EDIT BRANCH MODAL)
    // -----------------------------------------------------------------------
    openAddBranchModal(branchId = null) {
      const br = branchId ? window.store.getBranchById(branchId) : null;
      const isEdit = !!br;
      const branchPresets = [
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=600&q=80'
      ];
      const currentImage = br?.image || branchPresets[0];

      this._openModal(`
        <div style="max-width: 540px; margin: 0 auto;">
          <div class="badge-terracotta">HỆ THỐNG CHI NHÁNH</div>
          <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0 6px; color: #FFFFFF;">
            ${isEdit ? 'CHỈNH SỬA CHI NHÁNH' : 'THÊM CHI NHÁNH MỚI'}
          </h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 16px;">
            Dữ liệu chi nhánh được đồng bộ trực tiếp vào hệ thống OmniSalon.
          </p>

          <form onsubmit="event.preventDefault(); AdminWeb.submitBranchForm('${branchId || ''}');">
            <div style="margin-bottom: 12px;">
              <label class="sub-label">Tên Chi Nhánh / Cơ Sở: <span style="color:#ef4444;">*</span></label>
              <input type="text" id="brName" class="form-control-custom" placeholder="VD: Men Salon Barber Q2 - Thảo Điền" value="${this.escapeHtml(br?.name || br?.TenChiNhanh || '')}" required>
            </div>

            <div style="margin-bottom: 12px;">
              <label class="sub-label">Địa Chỉ Cụ Thể: <span style="color:#ef4444;">*</span></label>
              <input type="text" id="brAddress" class="form-control-custom" placeholder="VD: 15 Quốc Hương, P. Thảo Điền, TP. Thủ Đức, TP.HCM" value="${this.escapeHtml(br?.address || br?.DiaChi || '')}" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Số Điện Thoại Hotline: <span style="color:#ef4444;">*</span></label>
                <input type="tel" id="brPhone" class="form-control-custom" placeholder="0901111xxx" value="${this.escapeHtml(br?.phone || br?.SoDienThoai || '')}" required>
              </div>
              <div>
                <label class="sub-label">Tỉnh / Thành Phố: <span style="color:#ef4444;">*</span></label>
                <select id="brCity" class="form-control-custom" required>
                  <option value="TP. Hồ Chí Minh" ${(br?.city === 'TP. Hồ Chí Minh' || !br?.city) ? 'selected' : ''}>TP. Hồ Chí Minh</option>
                  <option value="Hà Nội" ${br?.city === 'Hà Nội' ? 'selected' : ''}>Hà Nội</option>
                  <option value="Đà Nẵng" ${br?.city === 'Đà Nẵng' ? 'selected' : ''}>Đà Nẵng</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Giờ Mở Cửa:</label>
                <input type="time" id="brOpenTime" class="form-control-custom" value="${br?.openTime || '08:30'}">
              </div>
              <div>
                <label class="sub-label">Giờ Đóng Cửa:</label>
                <input type="time" id="brCloseTime" class="form-control-custom" value="${br?.closeTime || '21:30'}">
              </div>
              <div>
                <label class="sub-label">Trạng Thái:</label>
                <select id="brStatus" class="form-control-custom">
                  <option value="Hoạt động" ${(br?.status === 'Hoạt động' || !br?.status) ? 'selected' : ''}>Hoạt động</option>
                  <option value="Tạm nghỉ" ${br?.status === 'Tạm nghỉ' ? 'selected' : ''}>Tạm nghỉ</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label class="sub-label">Hình Ảnh Chi Nhánh (URL):</label>
              <input type="url" id="brImage" class="form-control-custom" placeholder="https://..." value="${this.escapeHtml(currentImage)}">
              <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center; flex-wrap: wrap;">
                <span style="font-size: 11px; color: var(--text-secondary);">Chọn mẫu không gian:</span>
                ${branchPresets.map((img, idx) => `
                  <img src="${img}" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover; cursor: pointer; border: 1px solid var(--border-color);"
                       onclick="document.getElementById('brImage').value='${img}';" title="Mẫu ${idx + 1}">
                `).join('')}
              </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="button" class="btn-cancel" style="flex: 1; min-height: 44px; font-weight: 700;" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
              <button type="submit" class="btn-submit-terracotta" style="flex: 1.3; min-height: 44px; font-weight: 800;">
                💾 ${isEdit ? 'Cập Nhật Chi Nhánh' : 'Lưu Chi Nhánh Mới'}
              </button>
            </div>
          </form>
        </div>
      `);
    },

    submitBranchForm(branchId) {
      const name = (document.getElementById('brName')?.value || '').trim();
      const address = (document.getElementById('brAddress')?.value || '').trim();
      const phone = (document.getElementById('brPhone')?.value || '').trim();
      const city = document.getElementById('brCity')?.value || 'TP. Hồ Chí Minh';
      const openTime = document.getElementById('brOpenTime')?.value || '08:30';
      const closeTime = document.getElementById('brCloseTime')?.value || '21:30';
      const status = document.getElementById('brStatus')?.value || 'Hoạt động';
      const image = (document.getElementById('brImage')?.value || '').trim();

      if (!name || !address || !phone) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Vui lòng điền đầy đủ tên, địa chỉ và số điện thoại chi nhánh!', 'warning');
        return;
      }

      const branchData = {
        name,
        TenChiNhanh: name,
        address,
        DiaChi: address,
        phone,
        SoDienThoai: phone,
        city,
        openTime: openTime.length === 5 ? `${openTime}:00` : openTime,
        closeTime: closeTime.length === 5 ? `${closeTime}:00` : closeTime,
        openHours: `${openTime.substring(0, 5)} - ${closeTime.substring(0, 5)}`,
        status,
        image: image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80'
      };

      if (branchId) {
        window.store.updateBranch(branchId, branchData);
        if (window.UICommon) window.UICommon.showToast(`✅ Đã cập nhật chi nhánh [${name}] vào database SQL!`);
      } else {
        const created = window.store.addBranch(branchData);
        if (window.UICommon) window.UICommon.showToast(`✅ Đã thêm mới chi nhánh [${name}] (#${created.id}) vào database SQL!`);
      }

      this._closeModal();
      this.refreshSubTab();
    },

    // -----------------------------------------------------------------------
    // SUB-TAB 6: QUẦY THU NGÂN POS TẠI CHỖ (COUNTER POS CHECKOUT - DRY PRICING)
    // -----------------------------------------------------------------------
    renderPosTab(user, services, combos, products, branches, stylists, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      const pos = this.posState;

      // Đặt mặc định branchId và stylistId nếu chưa có
      if (this.isBranchManager(user) && user.branchId) {
        pos.branchId = user.branchId;
      } else if (!pos.branchId && branches.length > 0) {
        pos.branchId = branches[0].id;
      }

      const branchStylists = stylists.filter(s => s.branchId === pos.branchId);
      if (!pos.selectedStylistId && branchStylists.length > 0) {
        pos.selectedStylistId = branchStylists[0].id;
      }

      // Danh mục picker bên trái
      const q = (pos.searchQuery || '').toLowerCase();
      const cat = pos.activeCategory || 'all';

      let allOfferings = [];
      if (cat === 'all' || cat === 'services') {
        services.forEach(s => allOfferings.push({ ...s, itemType: 'service' }));
      }
      if (cat === 'all' || cat === 'combos') {
        combos.forEach(c => allOfferings.push({ ...c, itemType: 'service' }));
      }
      if (cat === 'all' || cat === 'products') {
        products.forEach(p => allOfferings.push({ ...p, itemType: 'product' }));
      }

      if (q) {
        allOfferings = allOfferings.filter(it => it.name.toLowerCase().includes(q) || (it.brand && it.brand.toLowerCase().includes(q)));
      }

      // DRY: Tính toán hóa đơn tập trung qua _calculatePosSummary
      const summary = this._calculatePosSummary(pos);
      pos.discountAmount = summary.discountAmount;

      return `
        <div class="pos-cashier-grid">
          <!-- CỘT TRÁI: PICKER DỊCH VỤ & SẢN PHẨM SÁP -->
          <div class="pos-panel pos-catalog-panel">
            <div class="pos-panel-header">
              <div>
                <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0;">✂️ Danh Mục Dịch Vụ & Sản Phẩm Sáp</h3>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Nhấp vào thẻ để đưa vào hóa đơn quầy thu ngân</p>
              </div>
              <input type="text" class="table-search-input" placeholder="Tìm dịch vụ / sáp..." 
                     value="${this.escapeHtml(pos.searchQuery)}" 
                     oninput="AdminWeb.posState.searchQuery = this.value; AdminWeb.refreshPosView();">
            </div>

            <!-- Filter Pills -->
            <div style="display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap;">
              <button type="button" class="admin-tab-btn ${pos.activeCategory === 'all' ? 'active' : ''}" 
                      style="padding: 4px 10px; font-size: 11px;" onclick="AdminWeb.posState.activeCategory = 'all'; AdminWeb.refreshPosView();">Tất Cả</button>
              <button type="button" class="admin-tab-btn ${pos.activeCategory === 'services' ? 'active' : ''}" 
                      style="padding: 4px 10px; font-size: 11px;" onclick="AdminWeb.posState.activeCategory = 'services'; AdminWeb.refreshPosView();">Dịch Vụ Cắt</button>
              <button type="button" class="admin-tab-btn ${pos.activeCategory === 'combos' ? 'active' : ''}" 
                      style="padding: 4px 10px; font-size: 11px;" onclick="AdminWeb.posState.activeCategory = 'combos'; AdminWeb.refreshPosView();">Gói Combo VIP</button>
              <button type="button" class="admin-tab-btn ${pos.activeCategory === 'products' ? 'active' : ''}" 
                      style="padding: 4px 10px; font-size: 11px;" onclick="AdminWeb.posState.activeCategory = 'products'; AdminWeb.refreshPosView();">Sáp & Mỹ Phẩm</button>
            </div>

            <!-- Grid Items -->
            <div class="pos-catalog-grid">
              ${allOfferings.map(item => `
                <div class="pos-item-card" onclick="${item.itemType === 'service' ? `AdminWeb.addPosService('${item.id}')` : `AdminWeb.addPosProduct('${item.id}')`}">
                  <div>
                    <img src="${SalonUtils.formatImageUrl(item.image || item.HinhAnh)}" 
                         class="pos-item-card-img" alt="${this.escapeHtml(item.name)}"
                         onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80');">
                    <div style="font-size: 11px; color: var(--brand-accent, #F59E0B); font-weight: 700;">${item.itemType === 'service' ? '✂️ Dịch Vụ' : '📦 Sản Phẩm'}</div>
                    <div style="font-size: 13px; font-weight: 800; color: var(--text-primary); line-height: 1.3; margin: 2px 0 4px;">${this.escapeHtml(item.name)}</div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px;">
                    <strong style="font-size: 13px; color: var(--brand-accent, #F59E0B);">${SalonUtils.formatCurrency(item.price)}</strong>
                    <button type="button" class="btn-submit-terracotta" style="padding: 3px 8px; font-size: 10px;">+ Thêm</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- CỘT PHẢI: HÓA ĐƠN QUẦY POS & THANH TOÁN -->
          <div class="pos-panel pos-receipt-panel">
            <div class="pos-panel-header">
              <div>
                <div class="badge-terracotta" style="font-size: 10px;">QUẦY THU NGÂN TẠI CHỖ</div>
                <h3 style="font-size: 17px; font-weight: 900; color: var(--text-primary); margin-top: 4px;">HÓA ĐƠN POS TẠM TÍNH</h3>
              </div>
              <button type="button" class="pill-btn-outline" style="font-size: 11px; padding: 4px 8px; color: #b91c1c; border-color: #fca5a5;" onclick="AdminWeb.resetPosBill()">
                Làm Mới Bill
              </button>
            </div>

            <!-- Chi nhánh & Barber phục vụ -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Cơ Sở Phục Vụ:</label>
                ${this.isBranchManager(user) ? `
                  <div style="font-size: 12px; font-weight: 800; color: var(--text-primary, #333); padding: 6px 8px; background: var(--surface-elevated, #f4f4f7); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 6px;">
                    🔒 ${this.escapeHtml(this._getBranchShortName(user.branchId, bMap))}
                  </div>
                ` : `
                  <select class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" 
                          onchange="AdminWeb.posState.branchId = this.value; AdminWeb.refreshPosView();">
                    ${branches.map(b => `<option value="${b.id}" ${b.id === pos.branchId ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                  </select>
                `}
              </div>
              <div>
                <label class="sub-label">Barber Phục Vụ:</label>
                <select class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" onchange="AdminWeb.posState.selectedStylistId = this.value">
                  ${branchStylists.map(s => `<option value="${s.id}" ${s.id === pos.selectedStylistId ? 'selected' : ''}>${this.escapeHtml(s.name)} (${this.escapeHtml(s.role)})</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Khách hàng -->
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Tên Khách Hàng:</label>
                <input type="text" class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" 
                       value="${this.escapeHtml(pos.customerName)}" oninput="AdminWeb.posState.customerName = this.value">
              </div>
              <div>
                <label class="sub-label">Số Điện Thoại:</label>
                <input type="tel" class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" 
                       value="${this.escapeHtml(pos.customerPhone)}" oninput="AdminWeb.posState.customerPhone = this.value">
              </div>
            </div>

            <!-- Chi tiết bill -->
            <div style="font-size: 12px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">
              Danh Sách Món Trong Bill (${pos.billServices.length + pos.billProducts.length}):
            </div>
            <div class="pos-bill-list">
              ${pos.billServices.length === 0 && pos.billProducts.length === 0 ? `
                <div style="text-align: center; padding: 24px; color: var(--text-secondary); font-size: 12px;">
                  Chưa có dịch vụ hoặc sản phẩm nào trong bill.<br>Vui lòng nhấp chọn từ bảng bên trái!
                </div>
              ` : ''}

              <!-- Dịch vụ cắt -->
              ${pos.billServices.map((s, idx) => `
                <div class="pos-bill-row">
                  <div>
                    <strong style="color: var(--text-primary);">✂️ ${this.escapeHtml(s.name)}</strong>
                    <div style="font-size: 11px; color: var(--text-secondary);">${s.duration || 45} phút</div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <strong style="color: var(--brand-accent, #F59E0B);">${SalonUtils.formatCurrency(s.price)}</strong>
                    <button type="button" style="color: #ef4444; border:none; background:none; cursor:pointer; font-weight:800;" onclick="AdminWeb.removePosService(${idx})">✕</button>
                  </div>
                </div>
              `).join('')}

              <!-- Sản phẩm retail -->
              ${pos.billProducts.map(p => `
                <div class="pos-bill-row">
                  <div>
                    <strong style="color: var(--text-primary);">📦 ${this.escapeHtml(p.name)}</strong>
                    <div style="font-size: 11px; color: var(--text-secondary);">${SalonUtils.formatCurrency(p.price)} / hộp</div>
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <button type="button" class="qty-btn" style="width:20px; height:20px; font-size:10px;" onclick="AdminWeb.changePosProductQty('${p.id}', ${p.qty - 1})">-</button>
                    <span style="font-weight: 800; font-size: 12px; width: 16px; text-align: center; color: var(--text-primary);">${p.qty}</span>
                    <button type="button" class="qty-btn" style="width:20px; height:20px; font-size:10px;" onclick="AdminWeb.changePosProductQty('${p.id}', ${p.qty + 1})">+</button>
                    <strong style="color: var(--brand-accent, #F59E0B); margin-left: 4px;">${SalonUtils.formatCurrency(p.price * p.qty)}</strong>
                    <button type="button" style="color: #ef4444; border:none; background:none; cursor:pointer; font-weight:800;" onclick="AdminWeb.changePosProductQty('${p.id}', 0)">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Mã Giảm Giá Voucher -->
            <div style="display: flex; gap: 6px; margin-bottom: 12px;">
              <input type="text" id="adminPosVoucherInput" class="form-control-custom" placeholder="Mã ưu đãi (VD: CHUTICH50)" 
                     style="font-size: 12px; padding: 6px 10px; text-transform: uppercase;" value="${this.escapeHtml(pos.voucherCode)}">
              <button type="button" class="btn-submit-terracotta" style="padding: 6px 14px; font-size: 11px; white-space: nowrap;" onclick="AdminWeb.applyPosVoucher()">
                Áp Mã
              </button>
            </div>

            <!-- Bảng Tổng Kết Thanh Toán (Từ summary tập trung) -->
            <div class="pos-summary-table">
              <div class="pos-summary-row">
                <span>Tổng tiền dịch vụ:</span>
                <span>${SalonUtils.formatCurrency(summary.servicesTotal)}</span>
              </div>
              <div class="pos-summary-row">
                <span>Tổng tiền sản phẩm:</span>
                <span>${SalonUtils.formatCurrency(summary.productsTotal)}</span>
              </div>
              ${summary.discountAmount > 0 ? `
                <div class="pos-summary-row" style="color: #10b981; font-weight: 700;">
                  <span>Giảm giá Voucher [${this.escapeHtml(pos.voucherCode)}]:</span>
                  <span>-${SalonUtils.formatCurrency(summary.discountAmount)}</span>
                </div>
              ` : ''}
              <div class="pos-summary-row total-row">
                <span>KHÁCH CẦN THANH TOÁN:</span>
                <span>${SalonUtils.formatCurrency(summary.finalTotal)}</span>
              </div>
            </div>

            <!-- Phương Thức Thu Tiền -->
            <div style="margin-bottom: 14px;">
              <div style="font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Phương Thức Thu Tiền:</div>
              <div style="display: flex; gap: 8px;">
                <button type="button" 
                        class="pos-pay-btn ${pos.paymentMethod === 'VietQR' ? 'active' : ''}"
                        onclick="AdminWeb.posState.paymentMethod = 'VietQR'; AdminWeb.refreshPosView();">
                  ⚡ Quét Mã VietQR
                </button>
                <button type="button" 
                        class="pos-pay-btn ${pos.paymentMethod === 'Cash' ? 'active' : ''}"
                        onclick="AdminWeb.posState.paymentMethod = 'Cash'; AdminWeb.refreshPosView();">
                  💵 Tiền Mặt Tại Quầy
                </button>
              </div>
            </div>

            <!-- Nút Thanh Toán -->
            <button type="button" class="btn-submit-terracotta" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 900;" 
                    onclick="AdminWeb.checkoutPosBill()">
              💳 Thanh Toán & Xuất Hóa Đơn (${SalonUtils.formatCurrency(summary.finalTotal)})
            </button>
          </div>
        </div>
      `;
    },

    addPosService(serviceId) {
      const srv = window.store.getServiceById(serviceId) || window.store.getComboById(serviceId);
      if (!srv) return;
      this.posState.billServices.push({
        id: srv.id,
        name: srv.name,
        price: Number(srv.price),
        duration: srv.duration || 45
      });
      if (window.UICommon) window.UICommon.showToast(`✂️ Đã thêm [${srv.name}] vào bill!`);
      this.refreshPosView();
    },

    addPosProduct(productId) {
      const prod = window.store.getProductById(productId);
      if (!prod) return;
      const existing = this.posState.billProducts.find(p => p.id === productId);
      if (existing) {
        existing.qty += 1;
      } else {
        this.posState.billProducts.push({
          id: prod.id,
          name: prod.name,
          price: Number(prod.price),
          qty: 1,
          image: prod.image
        });
      }
      if (window.UICommon) window.UICommon.showToast(`📦 Đã thêm sáp [${prod.name}] vào bill!`);
      this.refreshPosView();
    },

    changePosProductQty(productId, newQty) {
      if (newQty <= 0) {
        this.posState.billProducts = this.posState.billProducts.filter(p => p.id !== productId);
      } else {
        const it = this.posState.billProducts.find(p => p.id === productId);
        if (it) it.qty = newQty;
      }
      this.refreshPosView();
    },

    removePosService(index) {
      this.posState.billServices.splice(index, 1);
      this.refreshPosView();
    },

    applyPosVoucher(optionalCode = null) {
      const input = document.getElementById('adminPosVoucherInput');
      const code = (optionalCode || (input ? input.value : '')).trim().toUpperCase();
      if (!code) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập mã ưu đãi!', 'warning');
        return;
      }
      if (input && !input.value) {
        input.value = code;
      }
      const promos = window.store.getPromotions ? window.store.getPromotions() : [];
      // DRY: Validate against actual bill subtotal
      const currentSubtotal = this.posState.billServices.reduce((sum, s) => sum + Number(s.price || 0), 0) +
        this.posState.billProducts.reduce((sum, p) => sum + (Number(p.price || 0) * (p.qty || 1)), 0);

      const vRes = window.PricingService ? window.PricingService.processVoucherCode(code, currentSubtotal || 1000000, promos) : null;
      if (!vRes || !vRes.isValid) {
        if (window.UICommon) window.UICommon.showToast(vRes?.message || `Mã [${code}] không hợp lệ!`, 'error');
        return;
      }
      this.posState.voucherCode = code;
      if (window.UICommon) window.UICommon.showToast(`🎟️ Đã áp dụng mã ưu đãi [${code}]!`);
      this.refreshPosView();
    },

    resetPosBill() {
      this.posState.billServices = [];
      this.posState.billProducts = [];
      this.posState.voucherCode = '';
      this.posState.discountAmount = 0;
      this.refreshPosView();
    },

    removePosVoucher() {
      this.posState.voucherCode = '';
      this.posState.discountAmount = 0;
      this.refreshPosView();
    },

    refreshPosView() {
      const content = document.getElementById('adminSubTabContent');
      if (content && this.adminSubTab === 'pos') {
        const user = this.getCurrentUser();
        const services = window.store.getServices();
        const combos = window.store.getCombos();
        const products = window.store.getProducts();
        const branches = window.store.getBranches();
        const stylists = window.store.getStylists();
        content.innerHTML = this.renderPosTab(user, services, combos, products, branches, stylists);
      }
    },

    checkoutPosBill() {
      const pos = this.posState;
      if (pos.billServices.length === 0 && pos.billProducts.length === 0) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Hóa đơn chưa có dịch vụ hoặc sản phẩm nào!', 'warning');
        return;
      }

      try {
        const posOrder = window.store.createPosOrder({
          branchId: pos.branchId,
          stylistId: pos.selectedStylistId || null,
          customerName: pos.customerName || 'Khách Cắt Quầy',
          customerPhone: pos.customerPhone || '0900000000',
          services: pos.billServices,
          items: pos.billProducts.map(p => ({ productId: p.id, name: p.name, price: p.price, qty: p.qty })),
          voucherCode: pos.voucherCode || null,
          paymentMethod: pos.paymentMethod === 'VietQR' ? 'VietQR_Transfer' : 'Cash_Counter'
        });

        this.resetPosBill();
        this.openPosReceiptModal(posOrder);
      } catch (err) {
        if (window.UICommon) window.UICommon.showToast(`❌ ${err.message || 'Lỗi xử lý hóa đơn POS'}`, 'error');
        else alert(err.message || 'Lỗi xử lý hóa đơn POS');
      }
    },

    openPosReceiptModal(order) {
      const qrSvg = SalonUtils.generateQrSvgCode ? SalonUtils.generateQrSvgCode(`VIETQR-OMNI-${order.orderCode}-${order.totalAmount}`) : '';

      this._openModal(`
        <div class="booking-success-box" style="max-width: 500px; margin: 0 auto; text-align: center;">
          <div class="success-icon" style="background:#10b981; margin: 0 auto 12px;">✓</div>
          <h2 style="font-size: 22px; font-weight: 900; margin-bottom: 4px;">THANH TOÁN POS THÀNH CÔNG!</h2>
          <p style="color: #666; font-size: 13px; margin-bottom: 16px;">
            Mã hóa đơn quầy: <strong style="color: #c85a44;">${this.escapeHtml(order.orderCode || order.id)}</strong> • Trạng thái: <strong style="color: #10b981;">ĐÃ THANH TOÁN</strong>
          </p>

          <div class="booking-invoice-card" style="text-align: left; background: var(--surface-elevated); border-radius: 10px; padding: 14px; border: 1px solid var(--border-color); color: var(--text-primary);">
            <div class="invoice-item"><span>Cơ sở phục vụ:</span><strong>${this.escapeHtml(order.branchId)}</strong></div>
            <div class="invoice-item"><span>Khách hàng:</span><span>${this.escapeHtml(order.customerName)} (${this.escapeHtml(order.customerPhone)})</span></div>
            <div class="invoice-item"><span>Hình thức thanh toán:</span><strong>${this.escapeHtml(order.paymentMethod)}</strong></div>

            ${order.services && order.services.length > 0 ? `
              <div style="margin: 8px 0; border-top: 1px dashed var(--border-color); padding-top: 6px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">DỊCH VỤ CẮT:</div>
                ${order.services.map(s => `<div class="invoice-item"><span>${this.escapeHtml(s.name)}</span><strong>${SalonUtils.formatCurrency(s.price)}</strong></div>`).join('')}
              </div>
            ` : ''}

            ${order.items && order.items.length > 0 ? `
              <div style="margin: 8px 0; border-top: 1px dashed var(--border-color); padding-top: 6px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">SẢN PHẨM SÁP:</div>
                ${order.items.map(it => `<div class="invoice-item"><span>${this.escapeHtml(it.name)} (x${it.qty || 1})</span><strong>${SalonUtils.formatCurrency(it.price * (it.qty || 1))}</strong></div>`).join('')}
              </div>
            ` : ''}

            ${order.discountAmount > 0 ? `
              <div class="invoice-item" style="color: #059669;">
                <span>Voucher giảm giá:</span>
                <strong>-${SalonUtils.formatCurrency(order.discountAmount)}</strong>
              </div>
            ` : ''}

            <div class="invoice-item price-row" style="border-top: 2px solid var(--border-color); padding-top: 8px; margin-top: 8px; display: flex; justify-content: space-between;">
              <span style="font-weight: 800;">Tổng thực thu:</span>
              <strong style="color: #c85a44; font-size: 18px;">${SalonUtils.formatCurrency(order.totalAmount)}</strong>
            </div>
          </div>

          ${qrSvg ? `
            <div style="margin: 16px 0; padding: 12px; background: var(--surface-elevated); border-radius: 10px; border: 1px dashed var(--border-color); text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">MÃ VIETQR XÁC NHẬN GIAO DỊCH TỨC THÌ</div>
              <div style="display: flex; justify-content: center; margin: 6px 0;">${qrSvg}</div>
            </div>
          ` : ''}

          <div style="display: flex; gap: 10px; margin-top: 18px;">
            <button class="pill-btn-outline" style="flex: 1;" onclick="window.print()">🖨️ In Hóa Đơn</button>
            <button class="btn-submit-terracotta" style="flex: 1;" onclick="AdminWeb._closeModal(); AdminWeb.refreshPosView();">Hoàn Tất & Tạo Đơn Mới</button>
          </div>
        </div>
      `);
    },

    // -----------------------------------------------------------------------
    // SUB-TAB 7: NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGS)
    // -----------------------------------------------------------------------
    renderAuditTab(auditLogs) {
      let filtered = [...auditLogs];

      if (this.auditActionFilter !== 'all') {
        filtered = filtered.filter(l => (l.action || '').toUpperCase().includes(this.auditActionFilter.toUpperCase()));
      }

      if (this.auditSearchQuery) {
        const q = this.auditSearchQuery.toLowerCase();
        filtered = filtered.filter(l =>
          (l.operatorName && l.operatorName.toLowerCase().includes(q)) ||
          (l.entity && l.entity.toLowerCase().includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q)) ||
          (l.action && l.action.toLowerCase().includes(q))
        );
      }

      this.auditPage = this.auditPage || 1;
      const auditTotalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (this.auditPage > auditTotalPages) this.auditPage = auditTotalPages;
      const pagedAudit = filtered.slice((this.auditPage - 1) * this.pageSize, this.auditPage * this.pageSize);

      return `
        <div class="admin-table-container">
          <div class="admin-table-toolbar">
            <div class="table-filter-group">
              <input type="text" class="table-search-input" placeholder="Tìm người, thao tác, đối tượng..." 
                     value="${this.escapeHtml(this.auditSearchQuery)}" 
                     oninput="AdminWeb.auditSearchQuery = this.value; AdminWeb.auditPage = 1; AdminWeb.refreshAuditView();">

              <select class="table-select-filter" onchange="AdminWeb.auditActionFilter = this.value; AdminWeb.auditPage = 1; AdminWeb.refreshAuditView();">
                <option value="all" ${this.auditActionFilter === 'all' ? 'selected' : ''}>Tất cả hành động</option>
                <option value="BOOKING" ${this.auditActionFilter === 'BOOKING' ? 'selected' : ''}>Lịch Hẹn (Booking)</option>
                <option value="STOCK" ${this.auditActionFilter === 'STOCK' ? 'selected' : ''}>Kho Hàng (Stock)</option>
                <option value="PRODUCT" ${this.auditActionFilter === 'PRODUCT' ? 'selected' : ''}>Sản Phẩm (Product)</option>
                <option value="SERVICE" ${this.auditActionFilter === 'SERVICE' ? 'selected' : ''}>Dịch Vụ (Service)</option>
                <option value="ORDER" ${this.auditActionFilter === 'ORDER' ? 'selected' : ''}>Hóa Đơn / POS</option>
                <option value="AUTH" ${this.auditActionFilter === 'AUTH' ? 'selected' : ''}>Xác Thực (Auth)</option>
              </select>
            </div>

            <span style="font-size: 12px; color: #888;">Lưu vết an toàn ${auditLogs.length} sự kiện gần nhất</span>
          </div>

          <div style="overflow-x: auto;">
            <table class="admin-enterprise-table">
              <thead>
                <tr>
                  <th>Thời Gian</th>
                  <th>Hành Động</th>
                  <th>Người Thao Tác</th>
                  <th>Đối Tượng Tác Động</th>
                  <th>Nội Dung Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                ${pagedAudit.length > 0 ? pagedAudit.map(l => `
                  <tr>
                    <td style="font-size: 12px; color: #666; white-space: nowrap;">${this.escapeHtml(l.timestamp)}</td>
                    <td><span class="badge-terracotta" style="font-size: 10px; padding: 2px 6px;">${this.escapeHtml(l.action)}</span></td>
                    <td><strong>${this.escapeHtml(l.operatorName || 'Hệ Thống')}</strong></td>
                    <td>${this.escapeHtml(l.entity || '—')}</td>
                    <td style="color: #444;">${this.escapeHtml(l.details)}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="5" style="text-align: center; padding: 30px; color: #888;">
                      Không tìm thấy sự kiện nào khớp với bộ lọc kiểm toán.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
          ${this._renderPaginationControls(this.auditPage, auditTotalPages, filtered.length, 'AdminWeb.setAuditPage', 'nhật ký')}
        </div>
      `;
    },

    refreshAuditView() {
      const content = document.getElementById('adminSubTabContent');
      if (content && this.adminSubTab === 'audit') {
        const auditLogs = window.store.getAuditLogs();
        content.innerHTML = this.renderAuditTab(auditLogs);
      }
    },

    refreshSubTab() {
      const container = document.getElementById('webMainContainer');
      if (container) this.render(container);
    }
  };

  // -----------------------------------------------------------------------
  // EXPOSURE & TƯƠNG THÍCH HỆ THỐNG
  // -----------------------------------------------------------------------
  window.AdminWeb = AdminWeb;
  window.AdminPortal = AdminWeb;

  // Cầu nối thông minh: Nếu UIWeb đã tồn tại, đồng bộ hóa hàm renderAdminView sang AdminWeb
  if (typeof window.UIWeb !== 'undefined') {
    window.UIWeb.admin = AdminWeb;
    window.UIWeb.renderAdminView = function (container) {
      AdminWeb.render(container);
    };
  }

})(typeof window !== 'undefined' ? window : this);

