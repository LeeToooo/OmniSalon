(function (window) {
  'use strict';

  const STORAGE_KEY_AI_GALLERY = 'OMNISALON_CUSTOMER_AI_GALLERY';

  const CustomerWeb = {
    currentTab: 'home', // 'home' | 'admin'
    selectedCategory: 'all', // 'all' | 'haircut' | 'perm' | 'color' | 'shave' | 'combo'
    openFaqIndex: 0,
    portalActiveTab: 'bookings', // 'bookings' | 'orders' | 'gallery' | 'profile'

    // Trạng thái AI Studio Inline
    aiState: {
      originalImage: null,
      resultImage: null,
      selectedStyle: 'Side Part 7/3 Hàn Quốc',
      selectedColorName: 'Đen Tự Nhiên',
      selectedColorHex: '#1c1b18',
      customPrompt: '',
      isProcessing: false,
      showApiSettings: false
    },

    // -----------------------------------------------------------------------
    // KHỞI TẠO MODULE KHÁCH HÀNG TRÊN WEB
    // -----------------------------------------------------------------------
    init() {
      // Xác định tab hiện tại từ URL pathname để không bị ghi đè trang chủ
      const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '/';
      const cleanPath = path.replace(/\/index\.html$/i, '') || '/';
      if (cleanPath === '/cart') {
        this.currentTab = 'cart';
      } else if (cleanPath === '/shop' || cleanPath === '/product') {
        this.currentTab = 'shop';
      } else if (cleanPath === '/services') {
        this.currentTab = 'services';
      } else if (cleanPath === '/stylists') {
        this.currentTab = 'stylists';
      } else if (cleanPath === '/booking') {
        this.currentTab = 'booking';
      } else if (cleanPath === '/branches') {
        this.currentTab = 'branches';
      } else if (cleanPath === '/ai-studio') {
        this.currentTab = 'ai';
      } else if (cleanPath.startsWith('/admin')) {
        this.currentTab = 'admin';
      }

      this.renderHeader();
      this.renderMainContent();
      this.initGlobalListeners();
      this.initAuthSync();
    },

    // Render noi dung chinh thong qua router
    renderMainContent() {
      if (window.AppRouter && typeof window.AppRouter.resolveRoute === 'function') {
        const path = window.AppRouter.getCurrentPath ? window.AppRouter.getCurrentPath() : '/';
        window.AppRouter.resolveRoute(path);
      }
    },




    initGlobalListeners() {
      // Đóng dropdown tìm kiếm khi click ra ngoài
      document.addEventListener('click', (e) => {
        const searchWrap = document.querySelector('.web-search-box-wrap');
        const dropdown = document.getElementById('webSearchDropdown');
        if (dropdown && searchWrap && !searchWrap.contains(e.target)) {
          dropdown.classList.remove('active');
        }
      });

      // Lắng nghe phím ESC để đóng modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
            window.UICommon.closeGlobalModal();
          }
        }
      });

      // Lắng nghe Reactive Store thay đổi
      if (window.store && typeof window.store.subscribe === 'function') {
        window.store.subscribe((state, event) => {
          this.updateCartBadge();
          // Tránh gọi renderServicesCards liên tục gây chớp tắt giao diện trang chủ
          if (this.currentTab === 'home' && (event === 'SERVICES_UPDATED' || event === 'ADMIN_CATALOG_CHANGED')) {
            const grid = document.getElementById('servicesGridContainer');
            if (grid) grid.innerHTML = this.renderServicesCards(true);
          }
        });
      }
    },

    initAuthSync() {
      // Tự động re-render Header khi phiên đăng nhập thay đổi  Login / Logout / Profile update 
      if (window.AuthEngine && typeof window.AuthEngine.subscribe === 'function') {
        window.AuthEngine.subscribe(() => {
          this.renderHeader();
          // Nếu đang mở trang cá nhân, cập nhật lại dữ liệu
          const modal = document.getElementById('globalModal');
          const portalShell = document.querySelector('.customer-portal-shell');
          if (modal && modal.classList.contains('active') && portalShell) {
            this.renderCustomerPortalModalBody();
          }
        });
      }
    }
  };

  // -----------------------------------------------------------------------
  // EXPOSURE & TƯƠNG THÍCH HOÀN HẢO VỚI HỆ THỐNG HIỆN HỮU — UIWEB BRIDGE 
  // -----------------------------------------------------------------------
  window.CustomerWeb = CustomerWeb;

    // Cầu nối thông minh: Nếu UIWeb đã tồn tại, đồng bộ hóa các hàm gọi từ UIWeb sang CustomerWeb
    if(typeof window.UIWeb !== 'undefined') {
      window.UIWeb.customer = CustomerWeb;
  window.UIWeb.openCustomerPortalModal = CustomerWeb.openCustomerPortalModal.bind(CustomerWeb);
  window.UIWeb.openProfileMenu = CustomerWeb.openCustomerPortalModal.bind(CustomerWeb);
  window.UIWeb.handleLiveSearch = CustomerWeb.handleLiveSearch.bind(CustomerWeb);
  window.UIWeb.openLookupModal = CustomerWeb.openLookupModal.bind(CustomerWeb);
  window.UIWeb.searchBookingLookup = CustomerWeb.searchBookingLookup.bind(CustomerWeb);
}

}) (typeof window !== 'undefined' ? window : this);

