// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ QUẢN TRỊ SALON TRÊN WEB (ADMIN WEB PLATFORM MODULE)
// Phiên bản: 11.2 Clean Architecture, Zero N+1 Query, Modular Shell
// Module chức năng điều phối trung tâm
// ============================================================================

(function (window) {
  'use strict';

  const AdminWeb = {
    // -----------------------------------------------------------------------
    // STATE MANAGEMENT
    // -----------------------------------------------------------------------
    adminSubTab: 'overview', // 'overview' | 'bookings' | 'stylists' | 'catalog' | 'inventory' | 'pos' | 'audit'
    filterBranch: 'all',
    filterStatus: 'all',
    filterDate: '',
    searchQuery: '',
    branchSearchQuery: '',
    branchCityFilter: 'all',
    stylistSearchQuery: '',
    filterStylistRole: 'all',
    receiptsSearchQuery: '',
    catalogTabType: 'services', // 'services' | 'combos' | 'products'
    catalogSearchQuery: '',
    inventorySearchQuery: '',
    inventorySubTab: 'stock', // 'stock' | 'fefo' | 'receipts' | 'rules'
    auditActionFilter: 'all',
    selectedAuditRowId: null,
    auditSearchQuery: '',
    auditRoleFilter: 'all',
    customerLookupQuery: '',
    bookingSubTab: 'workstation', // 'workstation' | 'dispatch' | 'calendar'
    branchesPage: 1,
    stylistsPage: 1,
    auditPage: 1,
    inventoryPage: 1,
    catalogPage: 1,
    bookingsPage: 1,
    dispatchPage: 1,
    pageSize: 10,
    inventoryPageSize: 10,
    isSubmitting: false,
    selectedReceiptDetail: null,
    selectedPromotion: null,

    // Trạng thái POS tại quầy
    posState: {
      customerPhone: '',
      customerName: '',
      stylistId: '',
      branchId: 'CN01',
      billServices: [],
      billProducts: [],
      voucherCode: '',
      discountAmount: 0,
      paymentMethod: 'VietQR' // 'VietQR' | 'Cash'
    },

    switchBookingSubTab(subTab) {
      this.bookingSubTab = subTab;
      this.searchQuery = '';
      this.customerLookupQuery = '';
      this.bookingsPage = 1;
      if (typeof this.refreshBookingsTable === 'function') {
        this.refreshBookingsTable();
      }
    },

    switchSubTab(tabName) {
      if (typeof this.closeSidebar === 'function') this.closeSidebar();
      if (typeof this.clearSearchQueries === 'function') this.clearSearchQueries();
      const user = (typeof this.getCurrentUser === 'function') ? this.getCurrentUser() : null;
      const activeRole = (typeof this.getActiveRole === 'function') ? this.getActiveRole(user) : 'SUPER_ADMIN';
      if (activeRole === 'CASHIER' && !['receipts', 'pos', 'bookings'].includes(tabName)) {
        if (window.UICommon) window.UICommon.showToast('Thu ngân chỉ có quyền sử dụng Quầy POS, Tiếp nhận lịch hẹn, Lập phiếu nhập và Lịch sử đơn!', 'warning');
        return;
      }
      if (activeRole === 'BRANCH_MANAGER' && !['overview', 'stylists', 'inventory', 'receipts', 'catalog', 'pos', 'bookings'].includes(tabName)) {
        if (window.UICommon) window.UICommon.showToast('Quản lý chi nhánh có quyền Báo cáo, Thợ, Kho, Phiếu nhập, Giá dịch vụ và toàn quyền Thu ngân!', 'warning');
        return;
      }
      if (tabName === 'receipts') {
        this.adminSubTab = 'receipts';
        this.inventorySubTab = 'receipts';
      } else if (tabName === 'inventory') {
        this.adminSubTab = 'inventory';
        this.inventorySubTab = (this.inventorySubTab && this.inventorySubTab !== 'receipts') ? this.inventorySubTab : 'stock';
      } else {
        this.adminSubTab = tabName;
      }
      const container = document.getElementById('webMainContainer');
      if (container && typeof this.render === 'function') this.render(container);
      if (tabName === 'branches') {
        setTimeout(() => {
          if (typeof this.initBranchImageInteractions === 'function') this.initBranchImageInteractions();
          if (typeof this.syncBranchPreviewCard === 'function') this.syncBranchPreviewCard();
        }, 80);
      }
    },

    renderSubTabContent(user, bookings, products, branches, stylists, auditLogs, services, combos, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      const activeRole = (typeof this.getActiveRole === 'function') ? this.getActiveRole(user) : 'SUPER_ADMIN';

      if (activeRole === 'CASHIER' && !['receipts', 'pos', 'bookings'].includes(this.adminSubTab)) {
        this.adminSubTab = 'pos';
      } else if (activeRole === 'BRANCH_MANAGER' && !['overview', 'stylists', 'inventory', 'receipts', 'catalog', 'pos', 'bookings'].includes(this.adminSubTab)) {
        this.adminSubTab = 'overview';
      }

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
        case 'receipts':
          return this.renderInventoryTab(user, branches, bMap);
        case 'pos':
          return this.renderPosTab(user, services, combos, products, branches, stylists, bMap);
        case 'audit':
          return this.renderAuditTab(auditLogs);
        default:
          return (activeRole === 'CASHIER' || activeRole === 'BRANCH_MANAGER')
            ? this.renderPosTab(user, services, combos, products, branches, stylists, bMap)
            : this.renderOverviewTab(user, branches, stylists, products, bookings, bMap);
      }
    },

    // Fallback stubs for sub-modules if loaded asynchronously
    renderOverviewTab(user, branches, stylists, products, bookings = null, branchMap = null) {
      return '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Đang tải phân hệ Tổng quan...</div>';
    },
    renderBranchesTab(user, branches, stylists, bookings, branchMap = null) {
      return '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Đang tải phân hệ Chi nhánh...</div>';
    },
    renderBookingsTab(user, bookings, branches, stylists, branchMap = null) {
      return '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Đang tải phân hệ Lịch hẹn...</div>';
    },
    renderStylistsTab(user, stylists, branches, bookings, branchMap = null) {
      return '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Đang tải phân hệ Stylist...</div>';
    },
    renderCatalogTab(services, combos, products) {
      return '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Đang tải phân hệ Danh mục...</div>';
    },
    renderInventoryTab(user, branches, branchMap = null) {
      return '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Đang tải phân hệ Kho hàng...</div>';
    },
    renderPosTab(user, services, combos, products, branches, stylists, branchMap = null) {
      return '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Đang tải phân hệ Quầy thu ngân...</div>';
    },
    renderAuditTab(auditLogs) {
      return '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Đang tải phân hệ Nhật ký...</div>';
    },

    refreshSubTab() {
      const container = document.getElementById('webMainContainer');
      if (container && typeof this.render === 'function') this.render(container);
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
