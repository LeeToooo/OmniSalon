(function (window) {
  'use strict';

  const STORAGE_KEY_AI_GALLERY = 'OMNISALON_CUSTOMER_AI_GALLERY';

  const CustomerWeb = {
    currentTab: 'home', // 'home' | 'admin'
    selectedCategory: 'all', // 'all' | 'haircut' | 'perm' | 'color' | 'shave' | 'combo'
    openFaqIndex: 0,
    portalActiveTab: 'bookings', // 'bookings' | 'orders' | 'gallery' | 'profile'

    // Khởi tạo module khách hàng trên web
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

      // Lắng nghe Reactive Store thay đổi (Real-time SSE + BroadcastChannel) mà không làm nhảy cuộn
      if (window.store && typeof window.store.subscribe === 'function') {
        window.store.subscribe((state, event) => {
          this.updateCartBadge();
          if (this.currentTab === 'home' && (event === 'SERVICES_UPDATED' || event === 'ADMIN_CATALOG_CHANGED')) {
            const grid = document.getElementById('servicesGridContainer');
            if (grid) grid.innerHTML = this.renderServicesCards(true);
          }

          const isProfileRoute = window.AppRouter && window.AppRouter.currentRoute && window.AppRouter.currentRoute.startsWith('/profile');
          const activeModal = document.getElementById('globalModal');
          const isModalOpen = activeModal && activeModal.classList.contains('active');
          const isTyping = document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

          if (isProfileRoute && !isModalOpen && !isTyping && window.ProfilePage && typeof window.ProfilePage.render === 'function') {
            if (['LIVE_SERVER_SYNC', 'BOOKING_UPDATED', 'ORDER_STATUS_UPDATED', 'DATABASE_LOADED'].includes(event)) {
              const container = document.getElementById('webMainContainer');
              if (container) {
                const prevY = window.scrollY;
                const prevPreserve = window._preserveScrollOnRender;
                window._preserveScrollOnRender = true;
                try {
                  window.ProfilePage.render(container);
                } finally {
                  requestAnimationFrame(() => {
                    window._preserveScrollOnRender = prevPreserve;
                    if (prevY > 0) window.scrollTo(0, prevY);
                  });
                }
              }
            }
          }

          if (isModalOpen && document.querySelector('.customer-portal-shell')) {
            if (['LIVE_SERVER_SYNC', 'BOOKING_UPDATED', 'ORDER_STATUS_UPDATED'].includes(event)) {
              if (typeof this.renderCustomerPortalModalBody === 'function') {
                const shellBody = document.querySelector('.customer-portal-shell');
                const prevTop = shellBody ? shellBody.scrollTop : 0;
                this.renderCustomerPortalModalBody();
                const newBody = document.querySelector('.customer-portal-shell');
                if (newBody && prevTop > 0) newBody.scrollTop = prevTop;
              }
            }
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

  // Gắn CustomerWeb vào window
  window.CustomerWeb = Object.assign(window.CustomerWeb || {}, CustomerWeb);

    // Đồng bộ các hàm sang UIWeb nếu có
    if(typeof window.UIWeb !== 'undefined') {
      window.UIWeb.customer = CustomerWeb;
  window.UIWeb.openCustomerPortalModal = CustomerWeb.openCustomerPortalModal.bind(CustomerWeb);
  window.UIWeb.openProfileMenu = CustomerWeb.openCustomerPortalModal.bind(CustomerWeb);
  window.UIWeb.handleLiveSearch = CustomerWeb.handleLiveSearch.bind(CustomerWeb);
  window.UIWeb.openLookupModal = CustomerWeb.openLookupModal.bind(CustomerWeb);
  window.UIWeb.searchBookingLookup = CustomerWeb.searchBookingLookup.bind(CustomerWeb);
}

}) (typeof window !== 'undefined' ? window : this);

