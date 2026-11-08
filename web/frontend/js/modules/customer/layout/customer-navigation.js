// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - MODULE ĐIỀU HƯỚNG & MENU TÀI KHOẢN (CUSTOMER NAVIGATION)
// File: web/frontend/js/modules/customer/customer-navigation.js
// ============================================================================

(function (window) {
  'use strict';

  const CustomerNavigation = {
    /**
     * Bật / tắt mở dropdown menu tài khoản ở Header
     * @param {Event} event 
     */
    toggleUserMenu(event) {
      if (event) event.stopPropagation();
      const dropdown = document.getElementById('headerUserDropdown');
      const wrapper = document.querySelector('.header-user-menu-wrapper');
      if (dropdown) {
        dropdown.classList.toggle('open');
        if (wrapper) wrapper.classList.toggle('open');
        if (typeof this.closeCartPopup === 'function') {
          this.closeCartPopup();
        } else if (window.CustomerWeb && typeof window.CustomerWeb.closeCartPopup === 'function') {
          window.CustomerWeb.closeCartPopup();
        }
      }
    },

    /**
     * Đóng dropdown menu tài khoản
     */
    closeUserMenu() {
      const dropdown = document.getElementById('headerUserDropdown');
      const wrapper = document.querySelector('.header-user-menu-wrapper');
      if (dropdown) dropdown.classList.remove('open');
      if (wrapper) wrapper.classList.remove('open');
    },

    /**
     * Bật / tắt drawer menu trên thiết bị di động
     */
    toggleMobileDrawer() {
      const overlay = document.getElementById('webMobileDrawerOverlay');
      if (overlay) {
        overlay.classList.toggle('active');
        document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
      }
    },

    /**
     * Đóng drawer menu trên thiết bị di động
     */
    closeMobileDrawer() {
      const overlay = document.getElementById('webMobileDrawerOverlay');
      if (overlay) {
        overlay.classList.remove('active');
      }
      document.body.style.overflow = '';
    },

    /**
     * Khởi tạo các sự kiện lắng nghe click ngoài và scroll hiệu ứng Header
     */
    _initHeaderListeners() {
      if (typeof window !== 'undefined' && !window._headerMenuListenerBound) {
        window._headerMenuListenerBound = true;
        document.addEventListener('click', (e) => {
          const cartWrapper = document.getElementById('headerCartWrapper');
          if (cartWrapper && !cartWrapper.contains(e.target)) {
            if (window.CustomerWeb && typeof window.CustomerWeb.closeCartPopup === 'function') {
              window.CustomerWeb.closeCartPopup();
            } else if (typeof this.closeCartPopup === 'function') {
              this.closeCartPopup();
            }
          }
          const userWrapper = document.querySelector('.header-user-menu-wrapper');
          if (userWrapper && !userWrapper.contains(e.target)) {
            if (window.CustomerWeb && typeof window.CustomerWeb.closeUserMenu === 'function') {
              window.CustomerWeb.closeUserMenu();
            } else if (typeof this.closeUserMenu === 'function') {
              this.closeUserMenu();
            }
          }
          if (!e.target.closest('.nav-mega-parent')) {
            if (window.CustomerWeb && typeof window.CustomerWeb.closeAllMegaMenus === 'function') {
              window.CustomerWeb.closeAllMegaMenus();
            } else if (typeof this.closeAllMegaMenus === 'function') {
              this.closeAllMegaMenus();
            }
          }
        });

        // Hiệu ứng fade nhẹ từ trên xuống khi kéo cuộn trang Header Scroll Fade-Down
        let ticking = false;
        const onScroll = () => {
          if (!ticking) {
            window.requestAnimationFrame(() => {
              const header = document.querySelector('.web-main-header');
              if (header) {
                if (window.scrollY > 30) {
                  header.classList.add('is-scrolled');
                } else {
                  header.classList.remove('is-scrolled');
                }
              }
              ticking = false;
            });
            ticking = true;
          }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }
    },

    /**
     * Render thẻ nút điều hướng sang Quản Trị / Thu Ngân / Quản Lý
     * @param {Object} user 
     * @param {boolean} isAdmin 
     */
    renderAdminButtonHTML(user, isAdmin) {
      if (!user) return '';
      const roleUpper = String(user?.role || user?.vaiTroSql || user?.VaiTro || user?.ChucVu || user?.chucVuSql || '').toUpperCase();
      const uid = String(user?.id || user?.MaNhanVien || user?.staffId || '').toUpperCase();

      const isSuper = (uid === 'NV00' || roleUpper.includes('ADMIN') || roleUpper.includes('QUẢN TRỊ') || user.username === 'admin');
      const isManager = !isSuper && (roleUpper.includes('BRANCH') || roleUpper.includes('QUẢN LÝ'));
      const isCashier = !isSuper && !isManager && (roleUpper.includes('CASHIER') || roleUpper.includes('THU NGÂN'));

      if (!isSuper && !isManager && !isCashier) {
        return '';
      }

      const currentTab = this.currentTab !== undefined ? this.currentTab : (window.CustomerWeb?.currentTab || 'home');
      const label = isCashier ? 'Quầy Thu Ngân POS' : (isManager ? 'Bàn Làm Việc Quản Lý' : 'Bảng Quản Trị Viên');
      const sub = isCashier ? 'Thanh toán & Đơn hàng' : (isManager ? 'Vận hành chi nhánh' : 'Toàn quyền hệ thống salon');

      return `
        <button type="button" class="dropdown-admin-card-btn ${currentTab === 'admin' ? 'active' : ''}" 
                onclick="CustomerWeb.closeUserMenu(); CustomerWeb.switchTab('${currentTab === 'admin' ? 'home' : 'admin'}');" 
                title="Vào khu vực làm việc phân hệ"
                style="background: #C59B27 !important; border: 1.5px solid #A27B1C !important;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="admin-card-icon-box" style="background: rgba(0, 0, 0, 0.12) !important;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#141413" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.25;">
              <span style="font-size: 13.5px; font-weight: 800; color: #141413 !important;">${currentTab === 'admin' ? 'Xem Giao Diện Khách' : label}</span>
              <span style="font-size: 11px; color: #3E320D !important; font-weight: 700;">${sub}</span>
            </div>
          </div>
          <span style="color: #141413 !important; font-size: 14px; font-weight: 800;">→</span>
        </button>
      `;
    },

    handleAdminDenied() {
      // Đồ án đơn giản: không chặn quyền
    },

    /**
     * Chuyển tab / chuyển trang chính trong hệ thống portal
     * @param {string} tab 
     */
    switchTab(tab) {
      if (typeof this.closeCartPopup === 'function') {
        this.closeCartPopup();
      } else if (window.CustomerWeb && typeof window.CustomerWeb.closeCartPopup === 'function') {
        window.CustomerWeb.closeCartPopup();
      }

      if (typeof this.closeUserMenu === 'function') {
        this.closeUserMenu();
      } else if (window.CustomerWeb && typeof window.CustomerWeb.closeUserMenu === 'function') {
        window.CustomerWeb.closeUserMenu();
      }

      const targetTab = tab || 'home';

      if (targetTab === 'admin') {
        this.currentTab = 'admin';
        if (window.CustomerWeb) window.CustomerWeb.currentTab = 'admin';
        document.body.classList.add('admin-mode');

        if (typeof this.renderHeader === 'function') {
          this.renderHeader();
        } else if (window.CustomerWeb && typeof window.CustomerWeb.renderHeader === 'function') {
          window.CustomerWeb.renderHeader();
        }

        if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
          window.AppRouter.navigate('/admin');
        } else if (window.AdminWeb && typeof window.AdminWeb.render === 'function') {
          const main = document.getElementById('webMainContainer');
          if (main) window.AdminWeb.render(main);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      this.currentTab = targetTab;
      if (window.CustomerWeb) window.CustomerWeb.currentTab = targetTab;
      document.body.classList.remove('admin-mode');

      if (typeof this.renderHeader === 'function') {
        this.renderHeader();
      } else if (window.CustomerWeb && typeof window.CustomerWeb.renderHeader === 'function') {
        window.CustomerWeb.renderHeader();
      }

      const routeMap = {
        'home': '/',
        'services': '/services',
        'stylists': '/stylists',
        'booking': '/booking',
        'shop': '/shop',
        'cart': '/cart',
        'branches': '/branches',
        'ai': '/ai-studio',
        'profile': '/profile'
      };

      const targetRoute = routeMap[targetTab] || '/';
      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate(targetRoute);
      } else {
        if (typeof this.renderMainContent === 'function') {
          this.renderMainContent();
        } else if (window.CustomerWeb && typeof window.CustomerWeb.renderMainContent === 'function') {
          window.CustomerWeb.renderMainContent();
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerNavigation = CustomerNavigation;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerNavigation);
  }

})(typeof window !== 'undefined' ? window : this);

