// =========================================================================
// Omni Salon — 3D PERSPECTIVE CLIENT-SIDE APP ROUTER
// Tuân thủ: .antigravity/rules/03_coder.md, 04_refactor.md
// Routes: / (Home), /services, /stylists, /booking, /shop, /admin
// 3D Scene Transitions: 1200px perspective, 3D Depth Flip/Glide
// Spotlight Border Effect • Magnetic Buttons • Interactive Slot Ripple
// =========================================================================

(function (window) {
  'use strict';

  const AppRouter = {
    currentRoute: '/',
    queryParams: {},
    isTransitioning: false,
    routes: {},

    init() {
      // Đăng ký các route mặc định
      this.register('/', () => this._renderPage('HomePage'));
      this.register('/services', () => this._renderPage('ServicesPage'));
      this.register('/stylists', () => this._renderPage('StylistsPage'));
      this.register('/booking', () => this._renderPage('BookingPage'));
      this.register('/shop', () => this._renderPage('ShopPage'));
      this.register('/branches', () => this._renderPage('BranchesPage'));
      this.register('/ai-studio', () => this._renderPage('AiStudioPage'));
      this.register('/admin', () => this._renderPage('AdminPortal'));

      // Lắng nghe thay đổi History API & Hash
      window.addEventListener('popstate', () => {
        this.resolveRoute(this.getCurrentPath(), false);
      });

      window.addEventListener('hashchange', () => {
        this.resolveRoute(this.getCurrentPath(), false);
      });

      // Bắt sự kiện click link nội bộ
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href], [data-route]');
        if (!link) return;

        const targetRoute = link.getAttribute('data-route');
        const href = link.getAttribute('href');

        if (targetRoute) {
          e.preventDefault();
          this.navigate(targetRoute);
          return;
        }

        if (href && (href.startsWith('/') || href.startsWith('#/')) && !href.startsWith('//') && !href.includes(':')) {
          // Bỏ qua nếu có target="_blank"
          if (link.getAttribute('target') === '_blank') return;
          e.preventDefault();
          const cleanPath = href.replace(/^#/, '');
          this.navigate(cleanPath);
        }
      });

      // Kích hoạt route hiện tại từ URL
      const initialPath = this.getCurrentPath();
      this.resolveRoute(initialPath, false);

      // Thiết lập bộ theo dõi micro 3D Tilt, Spotlight và Magnetic Buttons trên toàn trang
      this.initGlobalTiltObserver();
      this.initMagneticButtons();
      this.initSlotRippleDelegation();
    },

    register(routePath, handler) {
      this.routes[routePath] = handler;
    },

    getCurrentPath() {
      // Ưu tiên đọc từ Hash nếu có (hỗ trợ file:// và static server)
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/')) {
        return hash.replace(/^#/, '');
      }

      // Đọc từ pathname nếu đang chạy trên HTTP/HTTPS
      const path = window.location.pathname || '/';
      let clean = path.replace(/\/index\.html$/i, '');
      if (clean === '') clean = '/';
      if (clean.length > 1 && clean.endsWith('/')) {
        clean = clean.slice(0, -1);
      }
      return clean;
    },

    navigate(path, pushState = true) {
      if (!path) path = '/';
      if (this.isTransitioning) return;

      const [routePath, queryString] = path.split('?');
      this.queryParams = {};
      if (queryString) {
        queryString.split('&').forEach(pair => {
          const [k, v] = pair.split('=');
          if (k) this.queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });
      }

      const normalized = this._normalizePath(routePath);

      if (pushState) {
        if (window.location.protocol === 'file:') {
          window.location.hash = `#${path}`;
        } else {
          try {
            window.history.pushState({ route: normalized }, '', path);
          } catch (e) {
            window.location.hash = `#${path}`;
          }
        }
      }

      this.resolveRoute(normalized, true);
    },

    _normalizePath(path) {
      let p = path.trim();
      if (!p.startsWith('/')) p = `/${p}`;
      if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
      return p;
    },

    resolveRoute(pathWithQuery, animate = true) {
      const [path] = pathWithQuery.split('?');
      const normalized = this._normalizePath(path);
      this.currentRoute = normalized;

      if (window.CustomerWeb) {
        if (normalized.startsWith('/admin')) {
          const user = (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function') 
            ? window.CustomerWeb.getCurrentUser() 
            : (window.store && typeof window.store.getCurrentUser === 'function' ? window.store.getCurrentUser() : null);
          const isAdmin = window.CustomerWeb && typeof window.CustomerWeb.isAdminUser === 'function'
            ? window.CustomerWeb.isAdminUser(user)
            : (user && ['SUPER_ADMIN', 'ADMIN'].includes(String(user.role).toUpperCase()));
          if (!isAdmin) {
            if (window.CustomerWeb && typeof window.CustomerWeb.handleAdminDenied === 'function') {
              window.CustomerWeb.handleAdminDenied();
            }
            this.navigate('/', false);
            return;
          }
          if (window.CustomerWeb.currentTab !== 'admin') {
            window.CustomerWeb.currentTab = 'admin';
            window.CustomerWeb.renderHeader();
          }
        } else {
          const tabMap = {
            '/': 'home',
            '/services': 'services',
            '/stylists': 'stylists',
            '/booking': 'booking',
            '/shop': 'shop',
            '/branches': 'branches',
            '/ai-studio': 'ai'
          };
          const targetTab = tabMap[normalized] || 'home';
          if (window.CustomerWeb.currentTab !== targetTab) {
            window.CustomerWeb.currentTab = targetTab;
            window.CustomerWeb.renderHeader();
          }
        }
      }

      this.syncActiveNav(normalized);

      let handler = this.routes[normalized];
      if (!handler) {
        if (normalized.startsWith('/admin')) {
          handler = this.routes['/admin'];
        } else {
          handler = this.routes['/'];
        }
      }

      if (typeof handler === 'function') {
        handler();
      }
    },

    _renderPage(pageComponentName) {
      const container = document.getElementById('webMainContainer');
      if (!container) return;

      let pageComponent = window[pageComponentName];
      if (!pageComponent && (pageComponentName === 'AdminPortal' || pageComponentName === 'AdminWeb')) {
        pageComponent = window.AdminWeb || window.AdminPortal;
      }

      if (!pageComponent || typeof pageComponent.render !== 'function') {
        console.warn(`[AppRouter] Page component ${pageComponentName} not found.`);
        return;
      }

      // RBAC Security Guard cho route /admin
      if (pageComponentName === 'AdminPortal' || pageComponentName === 'AdminWeb') {
        const user = (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function')
          ? window.AuthEngine.getCurrentUser()
          : (window.store && typeof window.store.getCurrentUser === 'function' ? window.store.getCurrentUser() : null);
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'QUẢN TRỊ VIÊN', 'QUẢN TRỊ TỐI CAO', 'BRANCH_MANAGER', 'CASHIER', 'THU_NGÂN', 'INVENTORY_MANAGER', 'THỦ_KHO'];
        const role = String(user?.role || '').toUpperCase();
        const isAllowed = user && (allowedRoles.includes(role) || role.includes('ADMIN') || role.includes('CASHIER') || role.includes('THU_NGÂN') || role.includes('KHO') || role.includes('MANAGER') || username === 'admin');

        if (!isAllowed) {
          if (window.AdminWeb && typeof window.AdminWeb.renderAccessDenied === 'function') {
            window.AdminWeb.renderAccessDenied(container, user);
          } else {
            container.innerHTML = `
              <div class="omni-container" style="padding: 100px 20px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 20px;">🚫</div>
                <h2 style="font-size: 28px; color: #EF4444; font-weight: 900; margin-bottom: 12px;">403 FORBIDDEN • TRUY CẬP BỊ TỪ CHỐI</h2>
                <p style="color: #CBD5E1; max-width: 520px; margin: 0 auto 24px; font-size: 15px;">Khu vực quản trị chỉ dành riêng cho Quản lý &amp; Nhân viên salon có thẩm quyền.</p>
                <button class="nordic-btn-primary" onclick="AppRouter.navigate('/')">Quay Lại Trang Chủ</button>
              </div>
            `;
          }
          return;
        }
      }

      const currentView = container.querySelector('.page-view');

      if (currentView) {
        this.isTransitioning = true;
        currentView.classList.remove('page-enter-active');
        currentView.classList.add('page-exit');

        setTimeout(() => {
          this._mountNewPage(container, pageComponent);
          this.isTransitioning = false;
        }, 220);
      } else {
        this._mountNewPage(container, pageComponent);
      }
    },

    _mountNewPage(container, pageComponent) {
      const newPageWrapper = document.createElement('div');
      newPageWrapper.className = 'page-view page-enter-init';
      container.innerHTML = '';
      container.appendChild(newPageWrapper);

      pageComponent.render(newPageWrapper, this.queryParams);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          newPageWrapper.classList.add('page-enter-active');
          newPageWrapper.classList.remove('page-enter-init');
        });
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Kích hoạt Micro Interactions
      this.initTiltEffects(newPageWrapper);
      this.initMagneticButtons(newPageWrapper);

      this.updatePageMeta(this.currentRoute);
    },

    updatePageMeta(route) {
      const titles = {
        '/': 'Omni Salon — The Art of Modern Hair Care & Grooming',
        '/services': 'Bespoke Services Menu — Omni Salon 5-Star Experience',
        '/stylists': 'Master Stylists & Art Directors — Omni Salon Artisans',
        '/booking': 'Đặt Lịch Trải Nghiệm Salon 5 Sao — Omni Salon',
        '/shop': 'Omni Apothecary — Mỹ Phẩm & Dược Liệu Tóc Quốc Tế',
        '/branches': 'Hệ Thống Chi Nhánh Toàn Quốc — Omni Salon Luxury Suite',
        '/ai-studio': 'AI Hair Studio 3D — Trải Nghiệm Thử Kiểu Tóc Thực Tế Ảo | Omni Salon',
        '/admin': 'Enterprise Admin Hub & Dispatcher — Omni Salon'
      };
      document.title = titles[route] || 'Omni Salon — The Art of Modern Hair Care';
    },

    syncActiveNav(route) {
      const navLinks = document.querySelectorAll('.web-nav-links .nav-link, .link-nav-route, .mobile-bottom-nav a');
      navLinks.forEach(link => {
        const targetRoute = link.getAttribute('data-route') || link.getAttribute('href');
        if (!targetRoute) return;
        const clean = targetRoute.replace(/^#/, '').split('?')[0];
        if (clean === route || (route === '/' && clean === '#heroSection')) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    },

    // -----------------------------------------------------------------------
    // 1. GIAO DIỆN ỔN ĐỊNH & VỮNG CHÃI (TRIỆT TIÊU CHAO ĐẢO 3D KHI DI CHUỘT)
    // -----------------------------------------------------------------------
    initTiltEffects(scope = document) {
      const cards = scope.querySelectorAll('.card-3d-tilt, .service-bento-card, .stylist-nordic-card, .product-nordic-card, .md3-service-card, .md3-stylist-card');
      cards.forEach(card => {
        card.style.transform = 'none';
        card.style.perspective = 'none';
      });
    },

    // -----------------------------------------------------------------------
    // 2. CỐ ĐỊNH NÚT BẤM (TRIỆT TIÊU HIỆU ỨNG HÚT NAM CHÂM CHẠY THEO CHUỘT)
    // -----------------------------------------------------------------------
    initMagneticButtons(scope = document) {
      const buttons = scope.querySelectorAll('.nordic-btn-primary, .nordic-btn-secondary, .stylist-book-btn, .service-bento-btn, .btn-magnetic');
      buttons.forEach(btn => {
        btn.style.transform = 'none';
      });
    },

    // -----------------------------------------------------------------------
    // 3. INTERACTIVE TIME SLOT RIPPLE (HIỆU ỨNG CHẠM NHẸ KHI CHỌN GIỜ)
    // -----------------------------------------------------------------------
    initSlotRippleDelegation() {
      document.addEventListener('click', (e) => {
        const slotEl = e.target.closest('.slot-chip-interactive, [onclick*="selectTimeSlot"], .time-slot-chip');
        if (!slotEl) return;
        this.triggerSlotRipple(e, slotEl);
      });
    },

    triggerSlotRipple(event, element) {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'slot-pulse-ripple';

      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      element.style.position = 'relative';
      element.style.overflow = 'hidden';
      element.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 650);
    },

    initGlobalTiltObserver() {
      // Triệt tiêu observer để tối ưu hiệu năng và tránh gắn lại sự kiện chao đảo
    }
  };

  window.AppRouter = AppRouter;

})(typeof window !== 'undefined' ? window : this);
