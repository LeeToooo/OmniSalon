// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ QUẢN TRỊ SALON - GIAO DIỆN KHUNG SHELL, SIDEBAR & PHÂN QUYỀN TRUY CẬP
// File: web/frontend/js/modules/admin/layout/admin-shell.js
// ============================================================================

(function (window) {
  'use strict';

  const AdminShell = {
    render(container) {
      if (!container) return;

      // Tự động lắng nghe thay đổi dữ liệu từ Store và Live Server
      if (window.store && typeof window.store.subscribe === 'function' && !this._isLiveSyncSubscribed) {
        this._isLiveSyncSubscribed = true;
        window.store.subscribe((state, event) => {
          // Bỏ qua LIVE_SERVER_SYNC định kỳ để chống giật re-render làm gián đoạn cuộn trang Admin
          if (event === 'ORDER_STATUS_UPDATED' || event === 'BOOKING_UPDATED' || event === 'ADMIN_FORCE_RENDER') {
            const el = document.getElementById('webMainContainer');
            if (el && document.body.classList.contains('admin-mode')) {
              // Lưu vị trí cuộn trang hiện tại của admin viewport
              const viewport = document.querySelector('.admin-main-viewport');
              const prevScrollTop = viewport ? viewport.scrollTop : 0;

              AdminWeb.render(el);

              if (viewport && prevScrollTop > 0) {
                const newViewport = document.querySelector('.admin-main-viewport');
                if (newViewport) newViewport.scrollTop = prevScrollTop;
              }
            }
          }
        });
      }

      const user = this.getCurrentUser();

      // Kiểm tra tài khoản có quyền trước khi vào trang quản trị
      if (!this.canAccess(user)) {
        this.renderRequireStaffLogin(container, user);
        return;
      }

      // Khóa phạm vi chi nhánh cho Quản lý chi nhánh
      this.syncBranchScope(user);

      // Nạp dữ liệu từ Store
      const bookings = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      const products = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts() : [];
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const stylists = (window.store && typeof window.store.getAllStaff === 'function')
        ? window.store.getAllStaff()
        : ((window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists(null, true) : []);
      const auditLogs = (window.store && typeof window.store.getAuditLogs === 'function') ? window.store.getAuditLogs() : [];
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const combos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];

      const branchMap = new Map(branches.map(b => [b.id, b]));
      const branchName = this.isBranchManager(user)
        ? (this._getBranchShortName((user?.branchId && user.branchId !== 'ALL') ? user.branchId : 'CN01', branchMap) || 'Chi Nhánh Q1 - Bến Thành')
        : (this.isCashier(user)
          ? (this._getBranchShortName((user?.branchId && user.branchId !== 'ALL') ? user.branchId : 'CN01', branchMap) || 'Quầy Thu Ngân Chi Nhánh Q1')
          : `Toàn Hệ Thống Cơ Sở`);

      const activeRole = this.getActiveRole(user);

      const tabIcons = {
        overview: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
        pos: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/><line x1="14" y1="15" x2="18" y2="15"/></svg>`,
        branches: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 10h1"/><path d="M9 14h1"/><path d="M14 10h1"/><path d="M14 14h1"/></svg>`,
        bookings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>`,
        stylists: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        catalog: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
        inventory: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
        receipts: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        audit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        chat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
      };

      let visibleTabs = [];
      let tabGroups = [];

      if (activeRole === 'CASHIER') {
        visibleTabs = [
          { id: 'receipts', icon: tabIcons.receipts, label: 'Lập Phiếu Nhập Kho' },
          { id: 'pos', icon: tabIcons.pos, label: 'Thu Ngân POS & Hóa Đơn' },
          { id: 'bookings', icon: tabIcons.bookings, label: 'Tiếp Nhận & Check-in Lịch Hẹn' },
          { id: 'chat', icon: tabIcons.chat, label: 'Chat Tư Vấn Khách Hàng' }
        ];
        tabGroups = [
          {
            groupLabel: 'NGHIỆP VỤ THU NGÂN & TIẾP ĐÓN',
            ids: ['receipts', 'pos', 'bookings', 'chat']
          }
        ];
        if (!['receipts', 'pos', 'bookings', 'chat'].includes(this.adminSubTab)) {
          this.adminSubTab = 'pos';
        }
      } else if (activeRole === 'BRANCH_MANAGER') {
        visibleTabs = [
          { id: 'overview', icon: tabIcons.overview, label: 'Báo Cáo Doanh Thu Chi Nhánh' },
          { id: 'stylists', icon: tabIcons.stylists, label: 'Đội Ngũ Thợ & Phân Ca' },
          { id: 'inventory', icon: tabIcons.inventory, label: 'Quản Lý Kho & Sản Phẩm' },
          { id: 'receipts', icon: tabIcons.receipts, label: 'Phiếu Nhập Kho' },
          { id: 'catalog', icon: tabIcons.catalog, label: 'Dịch Vụ & Bảng Giá' },
          { id: 'pos', icon: tabIcons.pos, label: 'Thu Ngân POS & Hóa Đơn' },
          { id: 'bookings', icon: tabIcons.bookings, label: 'Tiếp Nhận & Check-in Lịch Hẹn' },
          { id: 'chat', icon: tabIcons.chat, label: 'Chat Tư Vấn Khách Hàng' }
        ];
        tabGroups = [
          {
            groupLabel: 'CHỨC NĂNG QUẢN LÝ CHI NHÁNH',
            ids: ['overview', 'stylists', 'inventory', 'receipts', 'catalog']
          },
          {
            groupLabel: 'QUYỀN THU NGÂN & CSKH',
            ids: ['pos', 'bookings', 'chat']
          }
        ];
        if (!['overview', 'stylists', 'inventory', 'receipts', 'catalog', 'pos', 'bookings', 'chat'].includes(this.adminSubTab)) {
          this.adminSubTab = 'overview';
        }
      } else {
        visibleTabs = [
          { id: 'overview', icon: tabIcons.overview, label: 'Báo Cáo Toàn Chuỗi Salon' },
          { id: 'branches', icon: tabIcons.branches, label: 'Quản Lý Chuỗi Chi Nhánh' },
          { id: 'audit', icon: tabIcons.audit, label: 'Khách Hàng & Nhật Ký Kiểm Toán' },
          { id: 'stylists', icon: tabIcons.stylists, label: 'Đội Ngũ Thợ & Phân Ca' },
          { id: 'inventory', icon: tabIcons.inventory, label: 'Quản Lý Kho & Sản Phẩm' },
          { id: 'receipts', icon: tabIcons.receipts, label: 'Phiếu Nhập Kho' },
          { id: 'catalog', icon: tabIcons.catalog, label: 'Dịch Vụ & Bảng Giá' },
          { id: 'pos', icon: tabIcons.pos, label: 'Thu Ngân POS & Hóa Đơn' },
          { id: 'bookings', icon: tabIcons.bookings, label: 'Tiếp Nhận & Điều Phối Lịch Hẹn' },
          { id: 'chat', icon: tabIcons.chat, label: 'CSKH & Live Chat Trực Tuyến' }
        ];
        tabGroups = [
          {
            groupLabel: 'QUẢN TRỊ HỆ THỐNG',
            ids: ['overview', 'branches', 'audit']
          },
          {
            groupLabel: 'QUẢN LÝ VẬN HÀNH & KHO',
            ids: ['stylists', 'inventory', 'receipts', 'catalog']
          },
          {
            groupLabel: 'QUYỀN THU NGÂN & TIẾP NHẬN',
            ids: ['pos', 'bookings', 'chat']
          }
        ];
      }

      const roleBadge = activeRole === 'CASHIER'
        ? 'Thu Ngân POS'
        : (activeRole === 'BRANCH_MANAGER' ? 'Quản Lý Chi Nhánh' : 'Quản Trị Viên');

      const activeTabObj = visibleTabs.find(t => t.id === this.adminSubTab) || visibleTabs[0];

      document.body.classList.add('admin-mode');
      container.innerHTML = `
        <div class="admin-dashboard-layout ${this.isSidebarCollapsed ? 'sidebar-collapsed' : ''}">
          <!-- Lớp phủ mờ khi mở menu trên di động -->
          <div class="admin-sidebar-overlay" id="adminSidebarOverlay" onclick="AdminWeb.closeSidebar()"></div>

          <!-- Nút tab cạnh mép trái khi thu gọn menu (Thòi ra) -->
          <button type="button" class="admin-sidebar-edge-toggle" id="adminSidebarEdgeToggle" onclick="AdminWeb.toggleSidebarCollapse()" title="Mở rộng menu (Thòi ra)" aria-label="Mở rộng menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </button>

          <!-- Menu dọc bảng quản trị chính thức -->
          <aside class="admin-sidebar" id="adminSidebar">
            <div class="admin-sidebar-header">
              <div class="admin-sidebar-brand">
                <div class="admin-brand-icon-box">OS</div>
                <div class="admin-brand-text">
                  <div class="admin-brand-name">OMNI SALON</div>
                  <div class="admin-brand-desc">Bảng Quản Trị Hệ Thống</div>
                </div>
              </div>
              <!-- Nút thu gọn menu (Thụt vào) nằm bên phải chữ OMNI SALON -->
              <button type="button" class="admin-sidebar-collapse-btn" id="adminSidebarCollapseBtn" onclick="AdminWeb.toggleSidebarCollapse()" title="Thu gọn menu (Thụt vào)" aria-label="Thu gọn menu">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="11 17 6 12 11 7"></polyline>
                  <polyline points="18 17 13 12 18 7"></polyline>
                </svg>
              </button>
              <button type="button" class="admin-sidebar-close-btn" onclick="AdminWeb.closeSidebar()" title="Đóng menu">✕</button>
            </div>

            <!-- Thẻ hồ sơ nhân sự quản trị -->
            <div class="admin-sidebar-user-box">
              <div class="admin-user-avatar-circle">
                ${this.escapeHtml((user?.fullName || user?.username || 'AD').substring(0, 2).toUpperCase())}
              </div>
              <div class="admin-user-details">
                <div class="admin-user-fullname" title="${this.escapeHtml(user?.fullName || user?.username || 'Nhân sự')}">
                  ${this.escapeHtml(user?.fullName || user?.username || 'Nhân sự')}
                </div>
                <div class="admin-user-badge-pill">${roleBadge}</div>
              </div>
            </div>

            <div class="admin-sidebar-branch-info">
              <span class="admin-sidebar-status-dot"></span>
              <span class="admin-sidebar-branch-text" title="${this.escapeHtml(branchName)}">
                ${this.escapeHtml(branchName)}
              </span>
            </div>

            <!-- Danh mục các phân hệ dạng menu dọc -->
            <div class="admin-sidebar-nav-container">
              ${tabGroups.map(group => {
        const groupTabs = visibleTabs.filter(t => group.ids.includes(t.id));
        if (groupTabs.length === 0) return '';
        return `
                  <div class="admin-sidebar-nav-group">
                    <div class="admin-sidebar-nav-label">${group.groupLabel}</div>
                    <nav class="admin-sidebar-nav-list">
                      ${groupTabs.map(t => `
                        <button type="button" 
                                class="admin-sidebar-nav-item ${this.adminSubTab === t.id ? 'active' : ''}" 
                                onclick="AdminWeb.switchSubTab('${t.id}')">
                          <span class="admin-nav-item-icon">${t.icon}</span>
                          <span class="admin-nav-item-label">${t.label}</span>
                          ${this.adminSubTab === t.id ? '<span class="admin-nav-item-indicator"></span>' : ''}
                        </button>
                      `).join('')}
                    </nav>
                  </div>
                `;
      }).join('')}
            </div>

            <!-- Chân menu dọc với các nút hành động -->
            <div class="admin-sidebar-footer">
              <button type="button" class="admin-sidebar-footer-btn action-return" onclick="AdminWeb._goToCustomerPortal()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                <span>Về Giao Diện Khách</span>
              </button>
              <button type="button" class="admin-sidebar-footer-btn action-reset" 
                      onclick="if(confirm('Khôi phục toàn bộ dữ liệu mẫu demo ban đầu?')) { window.store.resetToDefault(); if(window.UICommon) window.UICommon.showToast('Đã khôi phục dữ liệu gốc!'); AdminWeb.render(document.getElementById('webMainContainer')); }">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                <span>Khôi Phục Dữ Liệu</span>
              </button>
              <div class="admin-sidebar-system-version">Omni Salon Enterprise • 2026</div>
            </div>
          </aside>

          <!-- Vùng nội dung chính của bảng quản trị -->
          <div class="admin-main-viewport">
            <!-- Thanh đầu trang vùng nội dung -->
            <header class="admin-topbar">
              <div class="admin-topbar-left">
                <button type="button" class="admin-topbar-sidebar-toggle admin-mobile-menu-toggle" id="adminTopbarSidebarToggle" onclick="AdminWeb.toggleSidebarCollapse()" title="Mở rộng menu (Thòi ra)" aria-label="Mở rộng menu">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <div class="admin-topbar-title-cluster">
                  <div class="admin-topbar-breadcrumbs">
                    <span>Hệ Thống Quản Trị</span>
                    <span class="crumb-sep">/</span>
                    <span class="crumb-active">${activeTabObj?.label || 'Tổng Quan'}</span>
                  </div>
                  <h1 class="admin-topbar-heading">
                    ${activeTabObj?.label || 'Bảng Quản Trị'}
                  </h1>
                </div>
              </div>

              <div class="admin-topbar-right">
                <div class="admin-topbar-branch-badge" title="Cơ sở làm việc">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>${this.escapeHtml(branchName)}</span>
                </div>
                <div class="admin-topbar-status-badge">
                  <span class="status-pulse-dot"></span>
                  <span>Trực Tuyến</span>
                </div>
                <!-- Nút chuyển chế độ Sáng / Tối icon tinh gọn -->
                <button type="button" class="admin-topbar-theme-icon-btn theme-toggle-btn" 
                        onclick="window.ThemeEngine && window.ThemeEngine.toggleTheme()" 
                        title="Chuyển chế độ Sáng / Tối (Trắng / Đen)" 
                        aria-label="Chuyển chế độ Sáng / Tối">
                  <svg class="theme-icon-sun icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C59B27" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                  <svg class="theme-icon-moon icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </button>
              </div>
            </header>

            <!-- Khung chứa nội dung phân hệ -->
            <div class="admin-subtab-container" id="adminSubTabContent">
              ${this.renderSubTabContent(user, bookings, products, branches, stylists, auditLogs, services, combos, branchMap)}
            </div>
          </div>
        </div>
      `;
      if (this.adminSubTab === "branches") {
        setTimeout(() => {
          this.initBranchImageInteractions();
          this.syncBranchPreviewCard();
        }, 60);
      }
    },

    isSidebarCollapsed: (typeof localStorage !== 'undefined' && localStorage.getItem('omni_admin_sidebar_collapsed') === 'true'),

    toggleSidebarCollapse() {
      if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
        this.toggleSidebar();
        return;
      }
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('omni_admin_sidebar_collapsed', this.isSidebarCollapsed ? 'true' : 'false');
        }
      } catch (e) {}

      const layout = document.querySelector('.admin-dashboard-layout');
      if (layout) {
        if (this.isSidebarCollapsed) {
          layout.classList.add('sidebar-collapsed');
        } else {
          layout.classList.remove('sidebar-collapsed');
        }
      }
    },

    toggleSidebar() {
      const sidebar = document.getElementById('adminSidebar');
      const overlay = document.getElementById('adminSidebarOverlay');
      if (sidebar) sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    },

    closeSidebar() {
      const sidebar = document.getElementById('adminSidebar');
      const overlay = document.getElementById('adminSidebarOverlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
    },

    renderRequireStaffLogin(container, user) {
      container.innerHTML = `
        <div class="admin-full-wrapper" style="min-height: 480px; display: flex; align-items: center; justify-content: center; padding: 40px 20px;">
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 40px 30px; max-width: 520px; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); color: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 30px; margin: 0 auto 18px;">🔒</div>
            <div class="badge-terracotta" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3);">
              KHU VỰC DÀNH CHO QUẢN TRỊ &amp; NHÂN VIÊN
            </div>
            <h2 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 14px 0 10px;">
              Yêu Cầu Quyền Quản Trị
            </h2>
            <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin-bottom: 24px;">
              ${user
          ? `Tài khoản <strong>${this.escapeHtml(user.fullName || user.username)}</strong> hiện không có quyền truy cập vào Phân Hệ Quản Trị. Vui lòng đăng nhập với tài khoản Quản lý hoặc Nhân viên có thẩm quyền.`
          : 'Bạn chưa đăng nhập. Vui lòng đăng nhập với tài khoản Quản trị viên, Quản lý chi nhánh hoặc Nhân viên để vào trang này.'}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <button class="pill-btn-outline" style="padding: 10px 20px; font-size: 13.5px;" onclick="if(window.AppRouter) window.AppRouter.navigate('/'); else AdminWeb._goToCustomerPortal();">
                ← Về Trang Chủ
              </button>
              <button class="btn-submit-terracotta" style="padding: 10px 22px; font-size: 13.5px; font-weight: 700; border-radius: 8px; background: #C59B27; color: #000;" onclick="if(window.UICommon) window.UICommon.openAuthModal('login');">
                Đăng Nhập Tài Khoản
              </button>
            </div>
          </div>
        </div>
      `;
    },

    goToReceptionCheckin(stylistId = null) {
      this.switchSubTab('bookings');
      if (stylistId) {
        setTimeout(() => {
          const el = document.getElementById(`workstation-card-${stylistId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.boxShadow = '0 0 0 3px #C59B27';
            setTimeout(() => { el.style.boxShadow = ''; }, 2000);
          }
        }, 150);
      }
    },

  };

  // 1. Phơi đối tượng ra window
  window.AdminShell = AdminShell;

  // 2. Đồng bộ ngược lại AdminWeb nếu đã được nạp
  if (typeof window.AdminWeb !== 'undefined') {
    Object.assign(window.AdminWeb, AdminShell);
  }

})(typeof window !== 'undefined' ? window : this);
