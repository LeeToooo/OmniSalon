// ============================================================================
// OmniSalon & 4RAU Barbershop Enterprise Suite
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

    canAccess(user) {
      const targetUser = user || this.getCurrentUser();
      if (!targetUser || !targetUser.role) return false;
      const allowedRoles = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'STYLIST'];
      const role = String(targetUser.role).toUpperCase();
      return allowedRoles.includes(role);
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
    // 3. DRY UTILITIES & EAGER LOADING AGGREGATORS (KHỬ N+1 QUERY)
    // -----------------------------------------------------------------------
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
        if (status === 'completed') {
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

      // Tính hoa hồng sau gom nhóm
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
        : 'Toàn Hệ Thống 18 Cơ Sở';

      container.innerHTML = `
        <div class="admin-full-wrapper">
          <!-- Top Enterprise Header -->
          <div class="admin-hub-header">
            <div>
              <div class="badge-terracotta" style="background: rgba(212,175,55,0.15); color: #D4AF37; border: 1px solid rgba(212,175,55,0.3);">
                HỆ THỐNG ĐIỀU HÀNH OMNI SALON ENTERPRISE • NORDIC LUXURY
              </div>
              <h2 class="admin-hub-title" style="margin-top: 6px; color: var(--text-primary, #FFFFFF); font-weight: 900; letter-spacing: -0.02em;">
                TRUNG TÂM QUẢN TRỊ & ĐIỀU HÀNH SALON
              </h2>
              <div style="font-size: 13px; color: var(--text-secondary, #94A3B8); margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="status-pill-pulse status-completed" style="padding: 2px 8px; font-size: 10px;">
                  <span class="pulse-dot"></span> Trực Tuyến
                </span>
                <span>Phạm vi: <strong style="color: var(--text-primary, #FFFFFF);">${this.escapeHtml(branchName)}</strong></span>
                <span>• Nhân sự: <strong style="color: #f59e0b;">${this.escapeHtml(user.fullName || user.username)} (${this.escapeHtml(user.role)})</strong></span>
              </div>
            </div>

            <div style="display:flex; gap: 10px; align-items: center; flex-wrap: wrap;">
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

          <!-- Admin Sub Navigation Tabs Bar -->
          <div class="admin-subnav-bar">
            <button class="admin-tab-btn ${this.adminSubTab === 'overview' ? 'active' : ''}" onclick="AdminWeb.switchSubTab('overview')">
              📊 Tổng Quan & Phân Tích
            </button>
            <button class="admin-tab-btn ${this.adminSubTab === 'bookings' ? 'active' : ''}" onclick="AdminWeb.switchSubTab('bookings')">
              📅 Điều Phối Lịch Hẹn (${bookings.length})
            </button>
            <button class="admin-tab-btn ${this.adminSubTab === 'stylists' ? 'active' : ''}" onclick="AdminWeb.switchSubTab('stylists')">
              💈 Đội Ngũ Barber & Hoa Hồng (${stylists.length})
            </button>
            <button class="admin-tab-btn ${this.adminSubTab === 'catalog' ? 'active' : ''}" onclick="AdminWeb.switchSubTab('catalog')">
              ✂️ Quản Trị Catalog (${services.length + combos.length + products.length})
            </button>
            <button class="admin-tab-btn ${this.adminSubTab === 'inventory' ? 'active' : ''}" onclick="AdminWeb.switchSubTab('inventory')">
              📦 Kho Hàng Chi Nhánh
            </button>
            <button class="admin-tab-btn ${this.adminSubTab === 'pos' ? 'active' : ''}" onclick="AdminWeb.switchSubTab('pos')">
              💳 Quầy Thu Ngân POS
            </button>
            <button class="admin-tab-btn ${this.adminSubTab === 'audit' ? 'active' : ''}" onclick="AdminWeb.switchSubTab('audit')">
              📜 Nhật Ký Hoạt Động (${auditLogs.length})
            </button>
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
      
      const analytics = (window.store && typeof window.store.getRevenueAnalytics === 'function')
        ? window.store.getRevenueAnalytics(branchId)
        : { totalRevenue: 19100000, confirmedCount: 78, cancelledCount: 4, occupancyRate: '88.5%', weeklyData: [], categoryBreakdown: [] };

      const weeklyData = analytics.weeklyData || [
        { day: 'Thứ 2', revenue: 2000000, bookingsCount: 8 },
        { day: 'Thứ 3', revenue: 2200000, bookingsCount: 9 },
        { day: 'Thứ 4', revenue: 2500000, bookingsCount: 11 },
        { day: 'Thứ 5', revenue: 2800000, bookingsCount: 12 },
        { day: 'Thứ 6', revenue: 3500000, bookingsCount: 15 },
        { day: 'Thứ 7', revenue: 4200000, bookingsCount: 18 },
        { day: 'Chủ Nhật', revenue: 3900000, bookingsCount: 16 }
      ];

      const maxRev = Math.max(...weeklyData.map(d => d.revenue), 4500000);
      const chartHeight = 150;
      const barWidth = 42;
      const spacing = 38;

      const svgBars = weeklyData.map((d, i) => {
        const barH = Math.max(16, (d.revenue / maxRev) * chartHeight);
        const x = 35 + i * (barWidth + spacing);
        const y = chartHeight - barH + 20;
        const formattedRev = (d.revenue / 1000000).toFixed(1) + 'Tr';

        return `
          <g class="chart-bar-group" style="cursor: pointer;">
            <title>${d.day}: ${SalonUtils.formatCurrency(d.revenue)} (${d.bookingsCount} lượt phục vụ)</title>
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
      const scopedStylists = branchId ? stylists.filter(s => s.branchId === branchId) : stylists;
      const stylistStatsMap = this._getStylistStatsMap(scopedStylists, allBookings);

      const rankedStylists = [...scopedStylists].sort((a, b) => {
        const statsA = stylistStatsMap.get(a.id);
        const statsB = stylistStatsMap.get(b.id);
        return (statsB?.completedCutsCount || b.rating || 0) - (statsA?.completedCutsCount || a.rating || 0);
      }).slice(0, 5);

      const inProgressCount = allBookings.filter(b => (b.status || '').toLowerCase() === 'in_progress').length;
      const productSalesTotal = (window.store && window.store.getOrders ? window.store.getOrders() : []).reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0) || 5420000;

      return `
        <!-- Filter Toolbar -->
        <div class="admin-filter-bar" style="background: var(--surface-card, #14171F); border: 1px solid var(--border-color, rgba(255,255,255,0.08)); border-radius: 14px; padding: 14px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary, #94A3B8);">Khu vực / Chi nhánh:</label>
            ${this.isBranchManager(user) ? `
              <span class="badge-terracotta" style="font-size: 12px;">🔒 ${this.escapeHtml(this._getBranchShortName(user.branchId, bMap))}</span>
            ` : `
              <select class="table-select-filter admin-select-filter" style="background: var(--input-bg, #0A0B0E); color: var(--text-primary, #FFF); border-color: var(--input-border, rgba(255,255,255,0.12));" onchange="AdminWeb.filterBranch = this.value; AdminWeb.refreshSubTab();">
                <option value="all">Toàn Bộ 18 Chi Nhánh</option>
                ${branches.map(b => `<option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
              </select>
            `}
          </div>
          <div style="font-size: 12px; color: #94A3B8;">
            Dữ liệu tổng hợp chu kỳ 7 ngày • Tự động đồng bộ thời gian thực
          </div>
        </div>

        <!-- 4 High-Contrast KPI Cards (Glassmorphism Luxury) -->
        <div class="admin-kpi-grid">
          <div class="admin-kpi-card-rich">
            <div class="kpi-top-row">
              <span class="kpi-label-text">Doanh Thu Dịch Vụ & POS</span>
              <span class="kpi-growth-tag kpi-growth-positive">↗ +18.4%</span>
            </div>
            <div class="kpi-big-value">${SalonUtils.formatCurrency(analytics.totalRevenue)}</div>
            <div class="kpi-sub-detail">
              <span>Bao gồm quầy POS & Thanh toán VietQR</span>
            </div>
          </div>

          <div class="admin-kpi-card-rich">
            <div class="kpi-top-row">
              <span class="kpi-label-text">Tổng Lịch Hẹn Đã Chốt</span>
              <span class="kpi-growth-tag kpi-growth-positive">Lấp đầy ${analytics.occupancyRate}</span>
            </div>
            <div class="kpi-big-value">${analytics.confirmedCount} Lịch Hẹn</div>
            <div class="kpi-sub-detail">
              <span>${analytics.cancelledCount} ca hủy • Tỉ lệ hoàn thành 95%</span>
            </div>
          </div>

          <div class="admin-kpi-card-rich">
            <div class="kpi-top-row">
              <span class="kpi-label-text">Khách Đang Làm Tại Ghế</span>
              <span class="kpi-growth-tag kpi-growth-positive" style="background: rgba(212,175,55,0.15); color: #D4AF37; border-color: rgba(212,175,55,0.3);">⚡ Đang Phục Vụ</span>
            </div>
            <div class="kpi-big-value">${inProgressCount} Khách Đang Làm</div>
            <div class="kpi-sub-detail">
              <span>${scopedStylists.length} thợ đang sẵn sàng phục vụ</span>
            </div>
          </div>

          <div class="admin-kpi-card-rich">
            <div class="kpi-top-row">
              <span class="kpi-label-text">Doanh Số Sản Phẩm Bán Lẻ</span>
              <span class="kpi-growth-tag kpi-growth-positive">↗ +12.6%</span>
            </div>
            <div class="kpi-big-value">${SalonUtils.formatCurrency(productSalesTotal)}</div>
            <div class="kpi-sub-detail">
              <span>Pomade, sáp vuốt tóc & combo chăm sóc</span>
            </div>
          </div>
        </div>

        <!-- Split Charts: Biểu đồ SVG 7 ngày & Tỉ trọng dịch vụ -->
        <div class="admin-analytics-split">
          <div class="admin-chart-box">
            <div class="chart-box-header">
              <div class="chart-box-title">
                📈 Biểu Đồ Doanh Thu Dịch Vụ 7 Ngày Gần Nhất
              </div>
              <span style="font-size: 12px; color: #888;">Đơn vị: Triệu VNĐ</span>
            </div>
            <div class="svg-bar-chart-container">
              <svg viewBox="0 0 600 200" style="width: 100%; height: 100%; overflow: visible;">
                <defs>
                  <linearGradient id="adminBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#c85a44" />
                    <stop offset="100%" stop-color="#e07a5f" stop-opacity="0.8" />
                  </linearGradient>
                </defs>
                <line x1="20" y1="20" x2="580" y2="20" stroke="#f0f0f4" stroke-width="1" stroke-dasharray="3 3"/>
                <line x1="20" y1="95" x2="580" y2="95" stroke="#f0f0f4" stroke-width="1" stroke-dasharray="3 3"/>
                <line x1="20" y1="170" x2="580" y2="170" stroke="#e2e2e8" stroke-width="1.5"/>
                ${svgBars}
              </svg>
            </div>
          </div>

          <div class="admin-chart-box">
            <div class="chart-box-header">
              <div class="chart-box-title">
                🎯 Tỉ Trọng Dịch Vụ Thịnh Hành
              </div>
              <span style="font-size: 12px; color: #888;">Theo lượt đặt ca</span>
            </div>
            <div class="popularity-gauge-list">
              ${(analytics.categoryBreakdown || [
                { name: 'Cắt Tóc Chuẩn Barbershop', pct: 45, count: 28, color: '#c85a44' },
                { name: 'Uốn Textured / Con Sâu', pct: 25, count: 16, color: '#2563eb' },
                { name: 'Gói Combo VIP 7 Bước', pct: 18, count: 11, color: '#f59e0b' },
                { name: 'Nhuộm Màu Thời Trang', pct: 12, count: 7, color: '#7c3aed' }
              ]).map(item => `
                <div class="popularity-gauge-item">
                  <div class="gauge-meta-row">
                    <span>${item.name}</span>
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
            <div style="font-size: 14px; font-weight: 800; color: var(--text-primary, #FFFFFF);">
              🏆 Bảng Xếp Hạng Hiệu Suất Barber Hàng Đầu
            </div>
            <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="AdminWeb.switchSubTab('stylists')">
              Xem Toàn Bộ Thợ →
            </button>
          </div>
          <div style="overflow-x: auto;">
            <table class="admin-enterprise-table">
              <thead>
                <tr>
                  <th>Xếp Hạng</th>
                  <th>Barber</th>
                  <th>Cấp Bậc</th>
                  <th>Chi Nhánh</th>
                  <th>Đánh Giá</th>
                  <th>Lượt Cắt Tuần</th>
                  <th>Doanh Thu Ước Tính</th>
                </tr>
              </thead>
              <tbody>
                ${rankedStylists.map((st, idx) => {
                  const stats = stylistStatsMap.get(st.id) || { totalCutValue: 1200000, completedCutsCount: 8 };
                  const brName = this._getBranchShortName(st.branchId, bMap);
                  return `
                    <tr>
                      <td><strong style="color: ${idx === 0 ? '#f59e0b' : '#666'};">#${idx + 1}</strong></td>
                      <td style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        <img src="${st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" alt="${this.escapeHtml(st.name)}">
                        ${this.escapeHtml(st.name)}
                      </td>
                      <td><span class="badge-terracotta" style="font-size: 10px;">${this.escapeHtml(st.role || 'Barber')}</span></td>
                      <td>${this.escapeHtml(brName)}</td>
                      <td><strong style="color: #f59e0b;">★ ${st.rating || '5.0'}</strong></td>
                      <td><strong>${stats.completedCutsCount || 10}</strong> lượt</td>
                      <td style="font-weight: 800; color: #c85a44;">${SalonUtils.formatCurrency(stats.totalCutValue || 1800000)}</td>
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

      const scopedStylists = (this.isBranchManager(user) && user.branchId)
        ? stylists.filter(s => s.branchId === user.branchId)
        : (this.filterBranch !== 'all' ? stylists.filter(s => s.branchId === this.filterBranch) : stylists);

      const timelineHtml = `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="quick-booking-badge">WORKSTATIONS DISPATCHER</span>
              <span style="font-size: 16px; font-weight: 800; color: #FFFFFF;">💈 Bàn Điều Phối Ghế Cắt (Kanban Workstation Columns)</span>
              <span class="badge-terracotta" style="font-size: 10px; background: rgba(212,175,55,0.15); color: #D4AF37; border: 1px solid rgba(212,175,55,0.3);">
                ${scopedStylists.length} Ghế Đang Hoạt Động
              </span>
            </div>
            <div style="font-size: 12px; color: #94A3B8;">
              Click một chạm chuyển trạng thái ca hẹn • Tự động xếp hàng theo khung giờ
            </div>
          </div>

          <div class="admin-kanban-board stylist-timeline-board">
            ${scopedStylists.map((st, sIdx) => {
              const stBookings = filtered.filter(b => b.stylistId === st.id || (b.stylistName && b.stylistName.includes(st.name)));
              const hasInProgress = stBookings.some(b => (b.status || '').toLowerCase() === 'in_progress');
              const statusClass = hasInProgress ? 'stylist-status-busy' : 'stylist-status-available';
              const statusText = hasInProgress ? '⚡ Đang Phục Vụ' : '🟢 Ghế Rảnh';

              return `
                <div class="admin-workstation-column stylist-timeline-col">
                  <div class="workstation-column-header stylist-col-header">
                    <img src="${st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}" class="stylist-col-avatar" alt="${this.escapeHtml(st.name)}">
                    <div class="stylist-col-info">
                      <div class="stylist-col-name">Ghế #${sIdx + 1} • ${this.escapeHtml(st.name)}</div>
                      <div class="stylist-col-badge">★ ${st.rating || '5.0'} • ${this.escapeHtml(st.role || 'Master Barber')}</div>
                    </div>
                    <span class="stylist-col-status ${statusClass}">${statusText}</span>
                  </div>

                  <div class="workstation-cards-container stylist-col-cards-list">
                    ${stBookings.length === 0 ? `
                      <div class="timeline-empty-notice" style="padding: 24px 12px; text-align: center; color: #64748B; font-size: 12px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.01);">
                        Ghế đang trống • Sẵn sàng nhận khách Walk-in
                      </div>
                    ` : stBookings.map(b => {
                      const isConf = (b.status || '').toLowerCase() === 'confirmed';
                      const isInProg = (b.status || '').toLowerCase() === 'in_progress';
                      const isDone = (b.status || '').toLowerCase() === 'completed';

                      return `
                        <div class="kanban-booking-card timeline-booking-card ${isInProg ? 'in-progress' : ''}" style="margin-bottom: 10px; background: var(--surface-card, #131722); border: 1px solid ${isInProg ? 'var(--color-accent-gold, #D4AF37)' : 'var(--border-color, rgba(255,255,255,0.08))'}; border-radius: 14px; padding: 14px;">
                          <div class="timeline-card-time" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-weight: 800; font-size: 13px; color: #FFF;">⏰ ${this.escapeHtml(b.timeSlot || '')}</span>
                            <span style="font-size: 10.5px; font-weight: 800; color: ${isInProg ? '#E5B869' : (isDone ? '#10B981' : '#94A3B8')};">
                              ${isDone ? '✓ Hoàn tất' : (isInProg ? '⚡ Đang cắt' : '⏳ Chờ đến')}
                            </span>
                          </div>
                          <div class="timeline-card-customer" style="font-size: 14px; font-weight: 800; color: #FFF; margin-bottom: 4px;">
                            ${this.escapeHtml(b.customerName || 'Khách Hàng')} 
                            <span style="font-size: 11px; font-weight: 400; color: #94A3B8;">(${this.escapeHtml(b.customerPhone || '')})</span>
                          </div>
                          <div class="timeline-card-service" style="font-size: 12px; color: var(--color-accent-gold, #D4AF37); margin-bottom: 10px;">
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
        </div>
      `;

      return `
        ${timelineHtml}
        <div class="admin-table-container">
          <!-- Toolbar Bộ Lọc & Tìm Kiếm -->
          <div class="admin-table-toolbar">
            <div class="table-filter-group">
              <input type="text" class="table-search-input" 
                     placeholder="Tìm theo Mã, Tên, SĐT..." 
                     value="${this.escapeHtml(this.searchQuery)}"
                     oninput="AdminWeb.searchQuery = this.value; AdminWeb.refreshBookingsTable();">

              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta" style="font-size: 11px;">🔒 Chi nhánh của bạn</span>
              ` : `
                <select class="table-select-filter" onchange="AdminWeb.filterBranch = this.value; AdminWeb.refreshBookingsTable();">
                  <option value="all">Tất cả chi nhánh</option>
                  ${branches.map(b => `<option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                </select>
              `}

              <select class="table-select-filter" onchange="AdminWeb.filterStatus = this.value; AdminWeb.refreshBookingsTable();">
                <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
                <option value="confirmed" ${this.filterStatus === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
                <option value="in_progress" ${this.filterStatus === 'in_progress' ? 'selected' : ''}>Đang cắt / Đã Check-in</option>
                <option value="completed" ${this.filterStatus === 'completed' ? 'selected' : ''}>Đã hoàn thành</option>
                <option value="cancelled" ${this.filterStatus === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
              </select>

              <input type="date" class="table-select-filter" 
                     value="${this.filterDate}" 
                     onchange="AdminWeb.filterDate = this.value; AdminWeb.refreshBookingsTable();" 
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
                ${filtered.length > 0 ? filtered.map(b => {
                  const statusInfo = SalonUtils.formatBookingStatus(b.status);
                  const isConfirmed = (b.status || '').toLowerCase() === 'confirmed';
                  const isInProgress = (b.status || '').toLowerCase() === 'in_progress';
                  const isCompleted = (b.status || '').toLowerCase() === 'completed';

                  return `
                    <tr>
                      <td><strong>#${this.escapeHtml(b.bookingCode || b.id)}</strong></td>
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
      if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn phiếu lịch hẹn #${bookingId} khỏi hệ thống?`)) {
        window.store.deleteBooking(bookingId);
        if (window.UICommon) window.UICommon.showToast(`🗑️ Đã xóa lịch hẹn #${bookingId}!`);
        this.refreshBookingsTable();
      }
    },

    viewBookingQrTicket(bookingId) {
      const b = (window.store.getBookings() || []).find(item => item.id === bookingId || item.bookingCode === bookingId);
      if (!b) return;

      const qrCodeText = `OMNI-${b.bookingCode || b.id}-${b.customerPhone}`;
      const qrSvg = SalonUtils.generateQrSvgCode ? SalonUtils.generateQrSvgCode(qrCodeText) : '';

      this._openModal(`
        <div class="booking-wizard-wrapper" style="max-width: 460px; text-align: center; margin: 0 auto;">
          <div class="badge-terracotta">VÉ ĐIỆN TỬ VÉ QUẢN TRỊ</div>
          <h2 class="booking-title" style="font-size: 20px; margin-top: 6px;">#${this.escapeHtml(b.bookingCode || b.id)}</h2>
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

      // Khử N+1: Gom nhóm thống kê hoa hồng và ca hôm nay trước vòng lặp
      const stylistStatsMap = this._getStylistStatsMap(filteredStylists, allBookings);

      return `
        <!-- Filter Toolbar -->
        <div class="admin-filter-bar" style="border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Lọc theo Cơ sở:</label>
            ${this.isBranchManager(user) ? `
              <span class="badge-terracotta">🔒 Chi nhánh của bạn</span>
            ` : `
              <select class="admin-select-filter" onchange="AdminWeb.filterBranch = this.value; AdminWeb.refreshSubTab();">
                <option value="all">Tất cả chi nhánh</option>
                ${branches.map(b => `<option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
              </select>
            `}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary);">
            Chính sách hoa hồng: <strong style="color: var(--brand-accent);">15% Doanh thu ca cắt hoàn tất</strong>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px;">
          ${filteredStylists.map(st => {
            const brName = this._getBranchShortName(st.branchId, bMap);
            const comm = stylistStatsMap.get(st.id) || { completedCutsCount: 0, totalCutValue: 0, commissionAmount: 0, todayQueue: [] };

            return `
              <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 14px;">
                    <img src="${st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}" 
                         style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #c85a44;" alt="${this.escapeHtml(st.name)}">
                    <div style="flex: 1; min-width: 0;">
                      <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0;">${this.escapeHtml(st.name)}</h4>
                        <span style="font-size: 12px; font-weight: 800; color: #f59e0b;">★ ${st.rating || '5.0'}</span>
                      </div>
                      <div style="font-size: 12px; color: #c85a44; font-weight: 700; margin-top: 2px;">${this.escapeHtml(st.role || 'Master Barber')}</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">Cơ sở: ${this.escapeHtml(brName)}</div>
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

                <div style="display: flex; gap: 8px;">
                  <button class="pill-btn-outline" style="flex: 1; padding: 7px; font-size: 12px;" onclick="AdminWeb.viewStylistQueueModal('${st.id}')">
                    📅 Ca Hôm Nay (${comm.todayQueue.length})
                  </button>
                  <button class="btn-submit-terracotta" style="padding: 7px 12px; font-size: 12px;" 
                          onclick="if(window.UICommon) window.UICommon.openBookingModal(null, '${st.id}');">
                    + Xếp Khách
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
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
                <div style="background: #fafafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 14px; font-weight: 800; color: #111;">
                      ⏰ ${this.escapeHtml(b.timeSlot)} — ${this.escapeHtml(b.customerName)}
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 2px;">
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
      const type = this.catalogTabType || 'services';
      const q = (this.catalogSearchQuery || '').toLowerCase();

      let items = [];
      if (type === 'services') {
        items = services.filter(s => !q || s.name.toLowerCase().includes(q) || (s.category && s.category.toLowerCase().includes(q)));
      } else if (type === 'combos') {
        items = combos.filter(c => !q || c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
      } else {
        items = products.filter(p => !q || p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)));
      }

      return `
        <div class="admin-table-container">
          <!-- Toolbar Phân Loại Catalog & Thêm Mới -->
          <div class="admin-table-toolbar">
            <div class="table-filter-group">
              <button type="button" class="admin-tab-btn ${type === 'services' ? 'active' : ''}" 
                      style="padding: 6px 14px; font-size: 12px;" onclick="AdminWeb.catalogTabType = 'services'; AdminWeb.refreshCatalogView();">
                ✂️ Dịch Vụ Cắt Tóc (${services.length})
              </button>
              <button type="button" class="admin-tab-btn ${type === 'combos' ? 'active' : ''}" 
                      style="padding: 6px 14px; font-size: 12px;" onclick="AdminWeb.catalogTabType = 'combos'; AdminWeb.refreshCatalogView();">
                🌟 Gói Combo VIP (${combos.length})
              </button>
              <button type="button" class="admin-tab-btn ${type === 'products' ? 'active' : ''}" 
                      style="padding: 6px 14px; font-size: 12px;" onclick="AdminWeb.catalogTabType = 'products'; AdminWeb.refreshCatalogView();">
                💈 Sản Phẩm Retail (${products.length})
              </button>
              <input type="text" class="table-search-input" placeholder="Tìm theo tên..." 
                     value="${this.escapeHtml(this.catalogSearchQuery)}" 
                     oninput="AdminWeb.catalogSearchQuery = this.value; AdminWeb.refreshCatalogView();">
            </div>

            <div>
              <button class="btn-submit-terracotta" style="padding: 7px 16px; font-size: 12px;" onclick="AdminWeb.openCatalogModal('${type}')">
                + Thêm ${type === 'services' ? 'Dịch Vụ' : type === 'combos' ? 'Gói Combo' : 'Sản Phẩm'} Mới
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
                  <th>Tên Mặt Hàng</th>
                  <th>Phân Loại / Hãng</th>
                  <th>Giá Niêm Yết</th>
                  <th>${type === 'products' ? 'Tồn Kho' : 'Thời Lượng'}</th>
                  <th>Mô Tả Tóm Tắt</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                ${items.length > 0 ? items.map(item => `
                  <tr>
                    <td>
                      <img src="${item.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=120&q=80'}" 
                           style="width: 42px; height: 42px; border-radius: 6px; object-fit: cover;" alt="${this.escapeHtml(item.name)}">
                    </td>
                    <td><strong>#${this.escapeHtml(item.id)}</strong></td>
                    <td style="font-weight: 800;">${this.escapeHtml(item.name)}</td>
                    <td>
                      <span class="badge-terracotta" style="font-size: 10px; padding: 2px 8px;">
                        ${this.escapeHtml(item.category || item.brand || 'Dịch Vụ')}
                      </span>
                    </td>
                    <td style="font-weight: 900; color: #c85a44;">
                      ${SalonUtils.formatCurrency(item.price)}
                      ${item.oldPrice && item.oldPrice > item.price ? `<span style="font-size: 11px; color: #999; text-decoration: line-through; display: block;">${SalonUtils.formatCurrency(item.oldPrice)}</span>` : ''}
                    </td>
                    <td>
                      ${type === 'products' ? `<strong>${item.stock || 0}</strong> cái` : `<strong>${item.duration || 45}</strong> phút`}
                    </td>
                    <td style="font-size: 12px; color: #555; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
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
      if (confirm(`Bạn có chắc chắn muốn xóa mặt hàng #${id} khỏi hệ thống kinh doanh?`)) {
        if (type === 'services') window.store.deleteService(id);
        else if (type === 'combos') window.store.deleteCombo(id);
        else window.store.deleteProduct(id);

        if (window.UICommon) window.UICommon.showToast(`🗑️ Đã xóa mục #${id}!`);
        this.refreshCatalogView();
      }
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

      return `
        <div class="admin-table-container">
          <!-- Toolbar Kho Hàng -->
          <div class="admin-table-toolbar">
            <div class="table-filter-group">
              <input type="text" class="table-search-input" placeholder="Tìm sản phẩm sáp, pomade..." 
                     value="${this.escapeHtml(this.inventorySearchQuery)}" 
                     oninput="AdminWeb.inventorySearchQuery = this.value; AdminWeb.refreshInventoryView();">

              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta">🔒 Chi nhánh của bạn</span>
              ` : `
                <select class="table-select-filter" onchange="AdminWeb.filterBranch = this.value; AdminWeb.refreshInventoryView();">
                  <option value="all">Toàn bộ chi nhánh</option>
                  ${branches.map(b => `<option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                </select>
              `}
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              ${lowStockCount > 0 ? `
                <span class="stock-badge-critical" style="padding: 6px 12px; font-size: 12px;">
                  ⚠️ Có ${lowStockCount} sản phẩm sắp hết hàng (&lt;= 5)!
                </span>
              ` : `
                <span class="stock-badge-safe" style="padding: 6px 12px; font-size: 12px;">
                  ✓ Kho hàng ổn định
                </span>
              `}
            </div>
          </div>

          <!-- Bảng Tồn Kho -->
          <div style="overflow-x: auto;">
            <table class="admin-enterprise-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Mã SP</th>
                  <th>Tên Sản Phẩm</th>
                  <th>Thương Hiệu</th>
                  <th>Đơn Giá Bán</th>
                  <th>Tồn Kho Thực Tế</th>
                  <th>Tình Trạng Kho</th>
                  <th>Điều Chỉnh Nhanh</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length > 0 ? filtered.map(item => {
                  const stock = item.stock || 0;
                  let badge = '';
                  if (stock > 10) {
                    badge = `<span class="stock-badge-safe">Đủ Hàng (${stock})</span>`;
                  } else if (stock > 0) {
                    badge = `<span class="stock-badge-low">Sắp Hết (${stock})</span>`;
                  } else {
                    badge = `<span class="stock-badge-critical">HẾT HÀNG (0)</span>`;
                  }

                  return `
                    <tr>
                      <td>
                        <img src="${item.image || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=120&q=80'}" 
                             style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover;" alt="${this.escapeHtml(item.productName)}">
                      </td>
                      <td><strong>${this.escapeHtml(item.productId)}</strong></td>
                      <td style="font-weight: 700;">${this.escapeHtml(item.productName)}</td>
                      <td>${this.escapeHtml(item.brand || 'BROSH JAPAN')}</td>
                      <td style="font-weight: 800; color: #c85a44;">${SalonUtils.formatCurrency(item.price)}</td>
                      <td><strong style="font-size: 14px;">${stock}</strong> hộp/cái</td>
                      <td>${badge}</td>
                      <td>
                        <div style="display: flex; gap: 4px; align-items: center;">
                          <button class="pill-btn-outline" style="padding: 2px 8px; font-size: 11px;" 
                                  onclick="AdminWeb.adjustStock('${item.id}', ${stock - 1})">-1</button>
                          <button class="pill-btn-outline" style="padding: 2px 8px; font-size: 11px;" 
                                  onclick="AdminWeb.adjustStock('${item.id}', ${stock + 5})">+5</button>
                          <button class="pill-btn-outline" style="padding: 2px 8px; font-size: 11px;" 
                                  onclick="AdminWeb.adjustStock('${item.id}', ${stock + 20})">+20</button>
                          <button class="btn-submit-terracotta" style="padding: 2px 8px; font-size: 10px;" 
                                  onclick="AdminWeb.promptExactStock('${item.id}', ${stock})">Nhập số</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="8" style="text-align: center; padding: 30px; color: #888;">
                      Không tìm thấy bản ghi tồn kho nào phù hợp.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
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
      if (res !== null && !isNaN(res)) {
        this.adjustStock(invId, parseInt(res));
      }
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
                <h3 style="font-size: 16px; font-weight: 800; color: #111; margin: 0;">✂️ Danh Mục Dịch Vụ & Sản Phẩm Sáp</h3>
                <p style="font-size: 12px; color: #666; margin-top: 2px;">Nhấp vào thẻ để đưa vào hóa đơn quầy thu ngân</p>
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
                    <img src="${item.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80'}" 
                         style="width: 100%; height: 95px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" alt="${this.escapeHtml(item.name)}">
                    <div style="font-size: 11px; color: #c85a44; font-weight: 700;">${item.itemType === 'service' ? '✂️ Dịch Vụ' : '📦 Sản Phẩm'}</div>
                    <div style="font-size: 13px; font-weight: 800; color: #111; line-height: 1.3; margin: 2px 0 4px;">${this.escapeHtml(item.name)}</div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px;">
                    <strong style="font-size: 13px; color: #c85a44;">${SalonUtils.formatCurrency(item.price)}</strong>
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
                <h3 style="font-size: 17px; font-weight: 900; color: #111; margin-top: 4px;">HÓA ĐƠN POS TẠM TÍNH</h3>
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
                  <div style="font-size: 12px; font-weight: 800; color: #333; padding: 6px 8px; background: #f4f4f7; border-radius: 6px;">
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
            <div style="font-size: 12px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 6px;">
              Danh Sách Món Trong Bill (${pos.billServices.length + pos.billProducts.length}):
            </div>
            <div class="pos-bill-list">
              ${pos.billServices.length === 0 && pos.billProducts.length === 0 ? `
                <div style="text-align: center; padding: 24px; color: #999; font-size: 12px;">
                  Chưa có dịch vụ hoặc sản phẩm nào trong bill.<br>Vui lòng nhấp chọn từ bảng bên trái!
                </div>
              ` : ''}

              <!-- Dịch vụ cắt -->
              ${pos.billServices.map((s, idx) => `
                <div class="pos-bill-row">
                  <div>
                    <strong>✂️ ${this.escapeHtml(s.name)}</strong>
                    <div style="font-size: 11px; color: #888;">${s.duration || 45} phút</div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <strong style="color: #c85a44;">${SalonUtils.formatCurrency(s.price)}</strong>
                    <button type="button" style="color: #ef4444; border:none; background:none; cursor:pointer; font-weight:800;" onclick="AdminWeb.removePosService(${idx})">✕</button>
                  </div>
                </div>
              `).join('')}

              <!-- Sản phẩm retail -->
              ${pos.billProducts.map(p => `
                <div class="pos-bill-row">
                  <div>
                    <strong>📦 ${this.escapeHtml(p.name)}</strong>
                    <div style="font-size: 11px; color: #888;">${SalonUtils.formatCurrency(p.price)} / hộp</div>
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <button type="button" class="qty-btn" style="width:20px; height:20px; font-size:10px;" onclick="AdminWeb.changePosProductQty('${p.id}', ${p.qty - 1})">-</button>
                    <span style="font-weight: 800; font-size: 12px; width: 16px; text-align: center;">${p.qty}</span>
                    <button type="button" class="qty-btn" style="width:20px; height:20px; font-size:10px;" onclick="AdminWeb.changePosProductQty('${p.id}', ${p.qty + 1})">+</button>
                    <strong style="color: #c85a44; margin-left: 4px;">${SalonUtils.formatCurrency(p.price * p.qty)}</strong>
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
                <div class="pos-summary-row" style="color: #059669; font-weight: 700;">
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
              <div style="font-size: 11px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 6px;">Phương Thức Thu Tiền:</div>
              <div style="display: flex; gap: 8px;">
                <button type="button" 
                        style="flex: 1; padding: 8px; font-size: 12px; font-weight: 800; border-radius: 8px; cursor: pointer; border: 1px solid ${pos.paymentMethod === 'VietQR' ? '#c85a44' : '#d1d5db'}; background: ${pos.paymentMethod === 'VietQR' ? '#fff6f4' : '#fff'}; color: ${pos.paymentMethod === 'VietQR' ? '#c85a44' : '#4b5563'};"
                        onclick="AdminWeb.posState.paymentMethod = 'VietQR'; AdminWeb.refreshPosView();">
                  ⚡ Quét Mã VietQR
                </button>
                <button type="button" 
                        style="flex: 1; padding: 8px; font-size: 12px; font-weight: 800; border-radius: 8px; cursor: pointer; border: 1px solid ${pos.paymentMethod === 'Cash' ? '#c85a44' : '#d1d5db'}; background: ${pos.paymentMethod === 'Cash' ? '#fff6f4' : '#fff'}; color: ${pos.paymentMethod === 'Cash' ? '#c85a44' : '#4b5563'};"
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
            Mã hóa đơn quầy: <strong style="color: #c85a44;">#${this.escapeHtml(order.orderCode || order.id)}</strong> • Trạng thái: <strong style="color: #10b981;">ĐÃ THANH TOÁN</strong>
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

      return `
        <div class="admin-table-container">
          <div class="admin-table-toolbar">
            <div class="table-filter-group">
              <input type="text" class="table-search-input" placeholder="Tìm người, thao tác, đối tượng..." 
                     value="${this.escapeHtml(this.auditSearchQuery)}" 
                     oninput="AdminWeb.auditSearchQuery = this.value; AdminWeb.refreshAuditView();">

              <select class="table-select-filter" onchange="AdminWeb.auditActionFilter = this.value; AdminWeb.refreshAuditView();">
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
                ${filtered.length > 0 ? filtered.map(l => `
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
