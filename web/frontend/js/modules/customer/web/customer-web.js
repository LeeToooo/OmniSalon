// =========================================================================
// OmniSalon / Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG TRÊN WEB PORTAL (CUSTOMER WEB PLATFORM MODULE)
// Phiên bản: 2.2.0 Clean Architecture, RBAC Protected & High Aesthetics
// Tuân thủ: docs/analysis.md (Mục 2.2 & 4.3) & docs/file_plan.json (TASK-06-WEB-CUSTOMER)
// =========================================================================

(function (window) {
  'use strict';

  const STORAGE_KEY_AI_GALLERY = 'OMNISALON_CUSTOMER_AI_GALLERY';

  const CustomerWeb = {
    currentTab: 'home', // 'home' | 'admin'
    selectedCategory: 'all', // 'all' | 'haircut' | 'perm' | 'color' | 'shave' | 'combo'
    openFaqIndex: 0,
    portalActiveTab: 'bookings', // 'bookings' | 'orders' | 'gallery' | 'rewards' | 'profile'

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
      this.renderHeader();
      this.renderMainContent();
      this.initGlobalListeners();
      this.initAuthSync();
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
        window.store.subscribe(() => {
          this.updateCartBadge();
          if (this.currentTab === 'home') {
            const grid = document.getElementById('servicesGridContainer');
            if (grid) grid.innerHTML = this.renderServicesCards(true);
          }
        });
      }
    },

    initAuthSync() {
      // Tự động re-render Header khi phiên đăng nhập thay đổi (Login / Logout / Profile update)
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
    },

    // -----------------------------------------------------------------------
    // TIỆN ÍCH HỖ TRỢ XSS, QUERY DRY & FORMAT
    // -----------------------------------------------------------------------
    _findBookings(query) {
      if (!query) return [];
      if (window.store && typeof window.store.getBookingByPhoneOrId === 'function') {
        const res = window.store.getBookingByPhoneOrId(query);
        if (res && res.length > 0) return res;
      }
      const all = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      const clean = String(query).toLowerCase().replace('#', '').trim();
      return all.filter(b =>
        (b.customerPhone && b.customerPhone.trim() === String(query).trim()) ||
        (b.customerPhone && b.customerPhone.includes(clean)) ||
        (b.id && b.id.toLowerCase().replace('#', '') === clean) ||
        (b.id && b.id.toLowerCase().includes(clean)) ||
        (b.bookingCode && b.bookingCode.toLowerCase().replace('#', '') === clean) ||
        (b.bookingCode && b.bookingCode.toLowerCase().includes(clean)) ||
        (b.MaLichHen && b.MaLichHen.toLowerCase().includes(clean))
      );
    },

    _findBookingById(id) {
      if (!id) return null;
      const clean = String(id).toLowerCase().replace('#', '').trim();
      const all = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      return all.find(b => (b.id && b.id.toLowerCase().replace('#', '') === clean) || (b.bookingCode && b.bookingCode.toLowerCase().replace('#', '') === clean)) || null;
    },

    _getUserBookings(user) {
      if (!user) return [];
      const all = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      const phone = user.phone ? user.phone.trim() : null;
      const uid = user.id ? String(user.id) : null;
      return all.filter(b =>
        (phone && b.customerPhone && b.customerPhone.trim() === phone) ||
        (uid && (String(b.userId) === uid || String(b.customerId) === uid))
      );
    },

    _getUserOrders(user) {
      if (!user) return [];
      const all = (window.store && typeof window.store.getOrders === 'function') ? window.store.getOrders() : [];
      const phone = user.phone ? user.phone.trim() : null;
      const uid = user.id ? String(user.id) : null;
      return all.filter(o =>
        (phone && o.customerPhone && o.customerPhone.trim() === phone) ||
        (uid && (String(o.userId) === uid || String(o.customerId) === uid))
      );
    },

    updateCartBadge() {
      const badge = document.querySelector('.cart-badge-count');
      const cart = (window.store && typeof window.store.getCart === 'function') ? window.store.getCart() : [];
      const count = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? '' : 'none';
      } else {
        this.renderHeader();
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

    getCurrentUser() {
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        return window.AuthEngine.getCurrentUser();
      }
      if (window.store && typeof window.store.getCurrentUser === 'function') {
        return window.store.getCurrentUser();
      }
      return null;
    },

    getRoleBadgeText(user) {
      if (!user) return 'Khách Vãng Lai';
      const role = String(user.role || user.vaiTroSql || user.VaiTro || '').toUpperCase();
      const chucVu = String(user.ChucVu || user.chucVuSql || '').toUpperCase();
      
      if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'QUẢN TRỊ VIÊN' || chucVu === 'QUẢN TRỊ VIÊN' || user.username === 'admin') {
        return '👑 Quản Trị Tối Cao';
      }
      if (role === 'BRANCH_MANAGER' || role === 'QUẢN LÝ' || chucVu === 'QUẢN LÝ CHI NHÁNH') {
        return '🏢 Quản Lý Chi Nhánh';
      }
      if (role === 'STYLIST' || role === 'NHÂN VIÊN' || chucVu === 'THỢ CHÍNH' || chucVu === 'THỢ PHỤ') {
        return user.CapBac ? `💈 ${user.CapBac} (${user.ChucVu || 'Thợ Tóc'})` : '💈 Thợ Barber Chuyên Nghiệp';
      }
      if (role === 'CASHIER' || role === 'THU NGÂN' || chucVu === 'THU NGÂN') {
        return '💵 Thu Ngân Tiếp Tân';
      }
      return `★ ${user.tier && !user.tier.includes('OMNI') ? user.tier : 'Khách Hàng VIP'}`;
    },

    isAdminUser(user) {
      if (!user) return false;
      const role = String(user.role || user.vaiTroSql || user.VaiTro || '').toUpperCase();
      const chucVu = String(user.ChucVu || user.chucVuSql || '').toUpperCase();
      const username = String(user.username || '').toLowerCase();
      const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'QUẢN TRỊ VIÊN', 'QUẢN LÝ', 'QUẢN LÝ CHI NHÁNH', 'THU NGÂN'];
      return staffRoles.includes(role) || chucVu.includes('QUẢN LÝ') || chucVu.includes('THU NGÂN') || chucVu.includes('QUẢN TRỊ') || username === 'admin';
    },

    // -----------------------------------------------------------------------
    // 1. THANH HEADER ĐẲNG CẤP VỚI 3 CỤM GỌN GÀNG, USER DROPDOWN & LIVE SEARCH
    // -----------------------------------------------------------------------
    renderHeader() {
      const headerEl = document.getElementById('webHeaderContainer');
      if (!headerEl) return;

      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : [];
      const currentBranch = (window.store && typeof window.store.getCurrentBranch === 'function')
        ? window.store.getCurrentBranch()
        : branches[0] || null;
      const user = this.getCurrentUser();
      const cart = (window.store && typeof window.store.getCart === 'function')
        ? window.store.getCart()
        : [];
      const cartCount = cart.reduce((sum, i) => sum + (i.qty || 1), 0);

      // Xác định quyền hạn quản trị (Chỉ dành riêng cho Admin)
      const isAdmin = this.isAdminUser(user);

      headerEl.innerHTML = `
        <header class="web-main-header">
          <div class="web-header-inner">
            <!-- CỤM 1 (TRÁI): Brand Logo Omni Salon + Slogan -->
            <div class="brand-logo-wrap flex-shrink-0" onclick="CustomerWeb.switchTab('home')" style="cursor: pointer;" title="Về trang chủ Omni Salon">
              <span class="logo-text-omni">Omni Salon</span>
              <span class="logo-sub-text">CHĂM SÓC &amp; TẠO KIỂU TÓC CAO CẤP</span>
            </div>

            <!-- CỤM 2 (GIỮA): Navigation Links thuần tiếng Việt -->
            <nav class="web-nav-links">
              <a href="/" data-route="/" class="nav-link ${this.currentTab === 'home' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.switchTab('home')">TRANG CHỦ</a>
              <a href="/services" data-route="/services" class="nav-link ${this.currentTab === 'services' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.switchTab('services')">DỊCH VỤ</a>
              <a href="/stylists" data-route="/stylists" class="nav-link ${this.currentTab === 'stylists' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.switchTab('stylists')">THỢ TẠO MẪU</a>
              <a href="/booking" data-route="/booking" class="nav-link ${this.currentTab === 'booking' ? 'active' : ''} text-highlight" onclick="event.preventDefault(); CustomerWeb.switchTab('booking')">📅 ĐẶT LỊCH</a>
              <a href="/shop" data-route="/shop" class="nav-link nav-link-optional ${this.currentTab === 'shop' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.switchTab('shop')">CỬA HÀNG</a>
              <a href="/branches" data-route="/branches" class="nav-link nav-link-optional ${this.currentTab === 'branches' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.switchTab('branches')">CHI NHÁNH</a>
              <a href="/ai-studio" data-route="/ai-studio" class="nav-link nav-link-optional text-highlight" onclick="event.preventDefault(); CustomerWeb.switchTab('ai')">⚡ AI TẠO KIỂU TÓC</a>
              ${isAdmin ? `
                <a href="/admin" data-route="/admin" class="nav-link nav-link-admin ${this.currentTab === 'admin' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.switchTab('admin')">
                  ${user && (String(user.role).toUpperCase().includes('CASHIER') || String(user.vaiTroSql || '').toUpperCase().includes('THU NGÂN') || String(user.ChucVu || '').toUpperCase().includes('THU NGÂN'))
                    ? '💳 THU NGÂN POS'
                    : (user && (String(user.role).toUpperCase().includes('BRANCH') || String(user.vaiTroSql || '').toUpperCase().includes('QUẢN LÝ') || String(user.ChucVu || '').toUpperCase().includes('QUẢN LÝ'))
                        ? '🏢 QUẢN LÝ'
                        : '👑 QUẢN TRỊ')}
                </a>
              ` : ''}
            </nav>

            <!-- CỤM 3 (PHẢI): Search, Cart, Theme Toggle, User Dropdown -->
            <div class="web-header-actions">
              <!-- Ô Live Search thu nhỏ gọn gàng -->
              <div class="web-search-box-wrap flex-shrink-0">
                <svg class="web-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="webLiveSearchInput" class="web-search-input" 
                       placeholder="Tìm dịch vụ, sản phẩm..." 
                       autocomplete="off"
                       oninput="CustomerWeb.handleLiveSearch(this.value)" 
                       onfocus="CustomerWeb.handleLiveSearch(this.value)">
                <div class="search-results-dropdown" id="webSearchDropdown"></div>
              </div>

              <!-- Cart Button với Badge -->
              <button class="header-action-btn cart-btn-wrap flex-shrink-0" onclick="UICommon && UICommon.openCartDrawer()" title="Xem giỏ hàng">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                <span class="cart-badge-count" style="${cartCount > 0 ? '' : 'display:none;'}">${cartCount}</span>
              </button>

              <!-- Nút Chuyển Đổi Chế Độ Sáng / Tối (Theme Toggle Switch) -->
              <button type="button" class="theme-toggle-btn flex-shrink-0" onclick="window.ThemeEngine && window.ThemeEngine.toggleTheme()" title="Chuyển chế độ Sáng / Tối">
                <span class="theme-icon icon-moon">🌙</span>
                <span class="theme-icon icon-sun">☀️</span>
              </button>

              <!-- User Menu Dropdown (Gom Chi nhánh, Tra cứu & Quản lý vào menu Avatar) -->
              <div class="header-user-menu-wrapper flex-shrink-0">
                <div class="header-user-btn" id="headerUserBtn" onclick="CustomerWeb.toggleUserMenu(event)" title="Mở menu thành viên &amp; tiện ích">
                  <span class="user-avatar-text">${user ? SalonUtils.getInitials(user.fullName || user.name || user.username || 'Omni') : '👤'}</span>
                  <div class="user-info-text-wrap">
                    <span class="user-name-text">${user ? ((user.fullName || user.name || user.username || 'Tài Khoản').trim().split(' ').slice(-1)[0] || 'Tài Khoản') : 'Đăng Nhập'}</span>
                  </div>
                  <span class="user-dropdown-arrow">▾</span>
                </div>

                <!-- Dropdown Content Menu khi bấm vào Avatar -->
                <div class="header-user-dropdown" id="headerUserDropdown">
                  ${user ? `
                    <div class="dropdown-user-header">
                      <span class="user-avatar-text" style="width: 38px; height: 38px; font-size: 14px;">${SalonUtils.getInitials(user.fullName || user.name || user.username || 'Omni')}</span>
                      <div class="dropdown-user-details" style="display: flex; flex-direction: column; overflow: hidden; gap: 2px;">
                        <span class="dropdown-user-name">${user.fullName || user.name || user.username}</span>
                        <span class="header-role-badge role-${(user.role || 'customer').toLowerCase()}" style="width: fit-content;">${this.getRoleBadgeText(user)}</span>
                      </div>
                    </div>
                  ` : ''}

                  <!-- 1. Tra cứu lịch hẹn -->
                  <button onclick="CustomerWeb.openLookupModal(); CustomerWeb.closeUserMenu();" class="dropdown-item-btn">
                    <span style="font-size: 16px;">🔍</span>
                    <span>Tra Cứu Lịch Hẹn</span>
                  </button>

                  <!-- 2. Chọn chi nhánh -->
                  <div class="dropdown-branch-pill">
                    <div class="branch-pill-header">
                      <span>📍</span>
                      <span>Chi nhánh phục vụ:</span>
                    </div>
                    <select class="header-branch-select" onchange="window.store && window.store.setSelectedBranch(this.value)">
                      ${branches.map(b => `<option value="${b.id}" ${b.id === currentBranch?.id ? 'selected' : ''}>${(b.TenChiNhanh || b.name).trim()}</option>`).join('')}
                    </select>
                  </div>

                  <!-- 3. Nút Quản Trị Salon (Chỉ dành riêng cho Admin) -->
                  ${this.renderAdminButtonHTML(user, isAdmin)}

                  <!-- 4. Nút Đăng Nhập / Đăng Ký / Cá Nhân -->
                  ${user ? `
                    <button class="dropdown-item-btn" onclick="CustomerWeb.openCustomerPortalModal(); CustomerWeb.closeUserMenu();">
                      <span>👤</span>
                      <span>Trang Cá Nhân &amp; Điểm Thưởng</span>
                    </button>
                    <button class="dropdown-logout-btn" onclick="window.AuthEngine ? window.AuthEngine.logout() : (window.store && window.store.logout()); CustomerWeb.currentTab = 'home'; CustomerWeb.renderHeader(); if(window.AppRouter) window.AppRouter.navigate('/'); else CustomerWeb.switchTab('home'); if(window.UICommon) window.UICommon.showToast('Đã đăng xuất tài khoản!'); CustomerWeb.closeUserMenu();">
                      <span>🚪</span>
                      <span>Đăng Xuất</span>
                    </button>
                  ` : `
                    <button class="dropdown-primary-btn" onclick="UICommon.openAuthModal('login'); CustomerWeb.closeUserMenu();">
                      <span>🔑</span>
                      <span>Đăng Nhập / Đăng Ký</span>
                    </button>
                  `}
                </div>
              </div>
            </div>
          </div>
        </header>
      `;

      this._initHeaderListeners();
    },

    toggleUserMenu(event) {
      if (event) event.stopPropagation();
      const dropdown = document.getElementById('headerUserDropdown');
      const wrapper = document.querySelector('.header-user-menu-wrapper');
      if (dropdown) {
        dropdown.classList.toggle('open');
        if (wrapper) wrapper.classList.toggle('open');
      }
    },

    closeUserMenu() {
      const dropdown = document.getElementById('headerUserDropdown');
      const wrapper = document.querySelector('.header-user-menu-wrapper');
      if (dropdown) dropdown.classList.remove('open');
      if (wrapper) wrapper.classList.remove('open');
    },

    _initHeaderListeners() {
      if (typeof window !== 'undefined' && !window._headerMenuListenerBound) {
        window._headerMenuListenerBound = true;
        document.addEventListener('click', (e) => {
          const wrapper = document.querySelector('.header-user-menu-wrapper');
          if (wrapper && !wrapper.contains(e.target)) {
            const dropdown = document.getElementById('headerUserDropdown');
            if (dropdown) dropdown.classList.remove('open');
            wrapper.classList.remove('open');
          }
        });
      }
    },

    renderAdminButtonHTML(user, isAdmin) {
      if (isAdmin || this.isAdminUser(user)) {
        const isCashier = user && (String(user.role).toUpperCase().includes('CASHIER') || String(user.vaiTroSql || '').toUpperCase().includes('THU NGÂN') || String(user.ChucVu || '').toUpperCase().includes('THU NGÂN'));
        const isManager = user && (String(user.role).toUpperCase().includes('BRANCH') || String(user.vaiTroSql || '').toUpperCase().includes('QUẢN LÝ') || String(user.ChucVu || '').toUpperCase().includes('QUẢN LÝ'));
        const label = isCashier ? '💳 Quầy Thu Ngân POS' : (isManager ? '🏢 Bàn Làm Việc Quản Lý' : '👑 Bảng Quản Trị Tối Cao');
        return `
          <button class="dropdown-admin-btn ${this.currentTab === 'admin' ? 'active' : ''}" 
                  onclick="CustomerWeb.closeUserMenu(); CustomerWeb.switchTab('${this.currentTab === 'admin' ? 'home' : 'admin'}');" 
                  title="Vào Khu Vực Làm Việc Phân Hệ">
            ${this.currentTab === 'admin' ? '← Xem Giao Diện Khách' : label}
          </button>
        `;
      }
      // Dành riêng cho Admin & Nhân sự chuyên môn
      return '';
    },

    handleAdminDenied() {
      if (window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast('⛔ [403 Forbidden] Khu vực này chỉ dành riêng cho Quản trị viên (Admin)!', 'error');
      }
    },

    switchTab(tab) {
      if (tab === 'admin') {
        const user = this.getCurrentUser();
        const isAuthorized = this.isAdminUser(user);

        if (!isAuthorized) {
          this.handleAdminDenied();
          return;
        }

        this.currentTab = 'admin';
        this.renderHeader();
        if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
          window.AppRouter.navigate('/admin');
        } else if (window.AdminWeb && typeof window.AdminWeb.render === 'function') {
          const main = document.getElementById('webMainContainer');
          if (main) window.AdminWeb.render(main);
        }
        return;
      }

      this.currentTab = tab;
      this.renderHeader();

      const routeMap = {
        'home': '/',
        'services': '/services',
        'stylists': '/stylists',
        'booking': '/booking',
        'shop': '/shop',
        'branches': '/branches',
        'ai': '/ai-studio'
      };

      const targetRoute = routeMap[tab] || '/';
      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate(targetRoute);
      } else {
        this.renderMainContent();
      }
    },

    // -----------------------------------------------------------------------
    // 2. LIVE SEARCH DROPDOWN VỚI XSS SANITIZATION & TỐC ĐỘ CAO
    // -----------------------------------------------------------------------
    handleLiveSearch(query) {
      const dropdown = document.getElementById('webSearchDropdown');
      if (!dropdown) return;

      if (!query || query.trim().length < 1) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      const cleanQuery = query.trim();
      const results = (window.store && typeof window.store.searchServicesAndProducts === 'function')
        ? window.store.searchServicesAndProducts(cleanQuery)
        : { services: [], products: [] };

      const hasServices = results.services && results.services.length > 0;
      const hasProducts = results.products && results.products.length > 0;

      if (!hasServices && !hasProducts) {
        dropdown.innerHTML = `
          <div style="padding: 16px; text-align: center; color: #888; font-size: 13px;">
            Không tìm thấy dịch vụ hoặc sản phẩm khớp với "<strong>${this.escapeHtml(cleanQuery)}</strong>"
          </div>
        `;
        dropdown.classList.add('active');
        return;
      }

      let html = '';

      if (hasServices) {
        html += `<div class="search-result-group-title">✂️ Dịch Vụ & Combo Trọn Gói (${results.services.length})</div>`;
        results.services.slice(0, 5).forEach(s => {
          html += `
            <div class="search-result-item" onclick="CustomerWeb.selectSearchResultService('${s.id}')">
              <img src="${s.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=120&q=80'}" class="search-item-thumb" alt="${this.escapeHtml(s.name)}">
              <div style="flex: 1; min-width: 0;">
                <div class="search-item-name">${this.escapeHtml(s.name)}</div>
                <div class="search-item-meta">${SalonUtils.formatCurrency(s.price)} • ${s.duration || 45} phút ${s.isCombo ? '• 👑 Gói Combo' : ''}</div>
              </div>
              <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;">Đặt Lịch</button>
            </div>
          `;
        });
      }

      if (hasProducts) {
        html += `<div class="search-result-group-title">🧴 Sản Phẩm Tóc Chính Hãng (${results.products.length})</div>`;
        results.products.slice(0, 5).forEach(p => {
          const pImg = SalonUtils.formatImageUrl(p.image || p.HinhAnh);
          html += `
            <div class="search-result-item" onclick="CustomerWeb.selectSearchResultProduct('${p.id}')">
              <img src="${pImg}" class="search-item-thumb" alt="${this.escapeHtml(p.name)}" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=120&q=80');">
              <div style="flex: 1; min-width: 0;">
                <div class="search-item-name">${this.escapeHtml(p.name)}</div>
                <div class="search-item-meta">${SalonUtils.formatCurrency(p.price)} • ${this.escapeHtml(p.brand || 'CHÍNH HÃNG')}</div>
              </div>
              <button class="btn-submit-terracotta" style="font-size: 11px; padding: 4px 10px;">Xem Chi Tiết</button>
            </div>
          `;
        });
      }

      dropdown.innerHTML = html;
      dropdown.classList.add('active');
    },

    selectSearchResultService(serviceId) {
      const dropdown = document.getElementById('webSearchDropdown');
      if (dropdown) dropdown.classList.remove('active');
      if (window.UICommon && typeof window.UICommon.openBookingModal === 'function') {
        window.UICommon.openBookingModal(serviceId);
      }
    },

    selectSearchResultProduct(productId) {
      const dropdown = document.getElementById('webSearchDropdown');
      if (dropdown) dropdown.classList.remove('active');
      if (window.UICommon && typeof window.UICommon.openProductDetailModal === 'function') {
        window.UICommon.openProductDetailModal(productId);
      }
    },

    // -----------------------------------------------------------------------
    // 3. TRA CỨU LỊCH HẸN BẰNG SĐT / MÃ LỊCH (#BK-...) KÈM HỦY LỊCH
    // -----------------------------------------------------------------------
    openLookupModal(prefillValue = '') {
      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;

      const user = this.getCurrentUser();
      const defaultQuery = prefillValue || (user && user.phone ? user.phone : '');

      modalBody.innerHTML = `
        <div class="booking-wizard-wrapper" style="max-width: 620px;">
          <div class="booking-header">
            <div class="badge-terracotta">HỆ THỐNG TRA CỨU OMNI SALON</div>
            <h2 class="booking-title" style="font-size: 22px;">TRA CỨU LỊCH HẸN CẮT TÓC</h2>
            <p class="booking-subtitle">Nhập Số Điện Thoại (10 số) hoặc Mã Lịch Hẹn (#BK-...) để kiểm tra tình trạng</p>
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <input type="text" id="lookupSearchInput" class="form-control-custom" 
                   placeholder="Nhập SĐT (VD: 0908123456) hoặc Mã (#BK-1001)" 
                   value="${this.escapeHtml(defaultQuery)}"
                   style="font-size: 14px;"
                   onkeydown="if(event.key === 'Enter') CustomerWeb.searchBookingLookup()">
            <button class="btn-submit-terracotta" style="white-space: nowrap; padding: 10px 22px;" onclick="CustomerWeb.searchBookingLookup()">
              🔍 Tìm Lịch
            </button>
          </div>

          <div id="lookupResultsContainer">
            <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px; background: var(--surface-elevated); border-radius: 12px; border: 1px dashed var(--border-color);">
              Nhập thông tin bên trên để tra cứu thời gian, chi nhánh, thợ cắt và vé QR điện tử của bạn.
            </div>
          </div>
        </div>
      `;

      modal.classList.add('active');

      if (defaultQuery) {
        setTimeout(() => this.searchBookingLookup(), 50);
      }
    },

    searchBookingLookup() {
      const input = document.getElementById('lookupSearchInput');
      const container = document.getElementById('lookupResultsContainer');
      if (!input || !container) return;

      const query = input.value.trim();
      if (!query || query.length < 3) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Vui lòng nhập số điện thoại hoặc mã lịch hẹn hợp lệ!', 'warning');
        return;
      }

      const matches = this._findBookings(query);

      if (!matches || matches.length === 0) {
        container.innerHTML = `
          <div style="padding: 24px; text-align: center; background: var(--surface-elevated); border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="font-size: 14px; font-weight: 700; color: #ef4444; margin-bottom: 6px;">
              Không tìm thấy lịch hẹn nào khớp với "<strong>${this.escapeHtml(query)}</strong>".
            </div>
            <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 16px;">
              Quý khách vui lòng kiểm tra lại số điện thoại hoặc bấm nút bên dưới để đặt lịch hẹn mới ngay.
            </div>
            <div>
              <button class="btn-submit-terracotta" style="padding: 10px 22px; font-size: 13px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
                + Đặt Lịch Hẹn Mới Ngay
              </button>
            </div>
          </div>
        `;
        return;
      }

      // Eager loading map lookups O(1)
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const branchMap = new Map(branches.map(b => [String(b.id), b]));
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const stylistMap = new Map(stylists.map(s => [String(s.id), s]));
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const serviceMap = new Map(services.map(s => [String(s.id), s]));

      container.innerHTML = `
        <div style="font-size: 12px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px;">
          Tìm thấy ${matches.length} lịch hẹn:
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
          ${matches.map(b => {
        const statusInfo = SalonUtils.formatBookingStatus(b.status);
        const isCancellable = b.status !== 'cancelled' && b.status !== 'completed';
        const branch = branchMap.get(String(b.branchId)) || {};
        const stylist = stylistMap.get(String(b.stylistId)) || {};
        const service = serviceMap.get(String(b.serviceId)) || {};
        const branchName = b.branchName || branch.name || 'Omni Salon Suite';
        const stylistName = b.stylistName || stylist.name || 'Bất kỳ';
        const serviceName = b.serviceName || service.name || 'Cắt Tóc';
        return `
              <div class="lookup-card-result" style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 15px; font-weight: 900; color: var(--text-primary);">#${this.escapeHtml(b.id || b.bookingCode)}</span>
                  <span class="status-pill-pulse ${statusInfo.cssClass}">
                    <span class="pulse-dot"></span> ${statusInfo.label}
                  </span>
                </div>
                <div style="font-size: 13px; line-height: 1.6; color: var(--text-secondary);">
                  <div><strong style="color: var(--text-primary);">Dịch vụ:</strong> ${this.escapeHtml(serviceName)}</div>
                  <div><strong style="color: var(--text-primary);">Chi nhánh:</strong> ${this.escapeHtml(branchName)}</div>
                  <div><strong style="color: var(--text-primary);">Master Stylist:</strong> ${this.escapeHtml(stylistName)}</div>
                  <div><strong style="color: var(--text-primary);">Giờ hẹn:</strong> <span style="color: var(--brand-accent); font-weight: 800;">${b.timeSlot} — ${SalonUtils.formatDate(b.date || b.bookingDate)}</span></div>
                  <div><strong style="color: var(--text-primary);">Khách hàng:</strong> ${this.escapeHtml(b.customerName)} (<span data-phone="${this.escapeHtml(b.customerPhone)}">${this.escapeHtml(SalonUtils.maskPhone ? SalonUtils.maskPhone(b.customerPhone) : b.customerPhone)}</span>)</div>
                  <div><strong style="color: var(--text-primary);">Chi phí:</strong> <strong style="color: var(--brand-accent);">${SalonUtils.formatCurrency(b.totalPrice || 0)}</strong></div>
                </div>
                <div style="margin-top: 14px; display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;">
                  <button class="pill-btn-outline" style="font-size: 11px; padding: 6px 14px;" onclick="CustomerWeb.showTicketQr('${b.id}')">
                    🎫 Xem Vé QR
                  </button>
                  ${isCancellable ? `
                    <button class="pill-btn-outline" style="font-size: 11px; padding: 6px 14px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" 
                            onclick="CustomerWeb.cancelBookingByCustomer('${b.id}')">
                      Hủy Lịch Hẹn
                    </button>
                  ` : ''}
                  <button class="btn-submit-terracotta" style="font-size: 11px; padding: 6px 14px;" 
                          onclick="UICommon.showToast('📍 Hotline hỗ trợ chỉ đường: 1900 4407 (Miễn phí cước gọi)!');">
                    Chỉ Đường & Hỗ Trợ
                  </button>
                </div>
              </div>
            `;
      }).join('')}
        </div>
      `;
    },

    cancelBookingByCustomer(bookingId) {
      if (!bookingId) return;

      const user = this.getCurrentUser();
      const booking = this._findBookingById(bookingId);
      if (!booking) {
        if (window.UICommon) window.UICommon.showToast(`⚠️ Không tìm thấy lịch hẹn #${bookingId}!`, 'warning');
        return;
      }

      if (!user) {
        // SEC-02 Fix: Khách vãng lai chưa đăng nhập bắt buộc phải khớp SĐT tra cứu hoặc mã hẹn
        const lookupInput = document.getElementById('lookupSearchInput');
        const activeLookupPhone = lookupInput ? lookupInput.value.trim() : '';
        const isOwner = Boolean(activeLookupPhone && (activeLookupPhone === booking.customerPhone || activeLookupPhone === booking.id || activeLookupPhone === booking.bookingCode));
        if (!isOwner) {
          if (window.UICommon) window.UICommon.showToast('⛔ [403 Forbidden] IDOR detected: Vui lòng đăng nhập hoặc tra cứu đúng số điện thoại để hủy lịch!', 'error');
          return;
        }
      } else if (!['SUPER_ADMIN', 'BRANCH_MANAGER', 'STYLIST', 'CASHIER'].includes(user.role)) {
        const isOwner = (booking.userId && booking.userId === user.id) ||
          (booking.customerId && booking.customerId === user.id) ||
          (booking.customerPhone && user.phone && booking.customerPhone.trim() === user.phone.trim()) ||
          (booking.customerEmail && user.email && booking.customerEmail.trim().toLowerCase() === user.email.trim().toLowerCase());
        if (!isOwner) {
          if (window.UICommon) window.UICommon.showToast('⛔ [403 Forbidden] IDOR detected: Bạn không thể hủy lịch hẹn của khách hàng khác!', 'error');
          return;
        }
      }

      const reason = prompt(`Vui lòng nhập lý do bạn muốn hủy lịch hẹn #${bookingId}:`, 'Tôi có việc đột xuất bận');
      if (reason === null) return; // Người dùng ấn Cancel

      const cleanReason = reason.trim();
      if (!cleanReason || cleanReason.length < 3) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Vui lòng cung cấp lý do hủy cụ thể (tối thiểu 3 ký tự)', 'warning');
        return;
      }

      if (window.SalonApi && typeof window.SalonApi.cancelBooking === 'function') {
        window.SalonApi.cancelBooking(bookingId, cleanReason).then(res => {
          if (window.UICommon) window.UICommon.showToast(`✅ Đã hủy lịch hẹn #${bookingId} thành công!`);
          this.searchBookingLookup();
        }).catch(err => {
          if (window.UICommon) window.UICommon.showToast(`❌ Lỗi hủy lịch: ${err.message}`, 'error');
        });
      } else if (window.store && typeof window.store.updateBookingStatus === 'function') {
        window.store.updateBookingStatus(bookingId, 'cancelled');
        if (window.UICommon) window.UICommon.showToast(`✅ Đã hủy lịch hẹn #${bookingId}!`);
        this.searchBookingLookup();
      }
    },

    showTicketQr(bookingId) {
      const booking = this._findBookingById(bookingId);
      if (!booking) return;

      const user = this.getCurrentUser();
      if (!user) {
        // SEC-01 Fix: Khách vãng lai chưa đăng nhập bắt buộc phải khớp SĐT tra cứu hoặc mã hẹn
        const lookupInput = document.getElementById('lookupSearchInput');
        const activeLookupPhone = lookupInput ? lookupInput.value.trim() : '';
        const isOwner = Boolean(activeLookupPhone && (activeLookupPhone === booking.customerPhone || activeLookupPhone === booking.id || activeLookupPhone === booking.bookingCode));
        if (!isOwner) {
          if (window.UICommon) window.UICommon.showToast('⛔ [403 Forbidden] IDOR detected: Bạn không có quyền xem vé điện tử của khách hàng khác!', 'error');
          return;
        }
      } else if (!['SUPER_ADMIN', 'BRANCH_MANAGER', 'STYLIST', 'CASHIER'].includes(user.role)) {
        const isOwner = (booking.userId && booking.userId === user.id) ||
          (booking.customerId && booking.customerId === user.id) ||
          (booking.customerPhone && user.phone && booking.customerPhone.trim() === user.phone.trim()) ||
          (booking.customerEmail && user.email && booking.customerEmail.trim().toLowerCase() === user.email.trim().toLowerCase());
        if (!isOwner) {
          if (window.UICommon) window.UICommon.showToast('⛔ [403 Forbidden] IDOR detected: Bạn không có quyền xem vé điện tử của khách hàng khác!', 'error');
          return;
        }
      }

      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;

      const qrCodeText = booking.bookingCode || booking.id;
      const qrSvg = (window.SalonUtils && typeof window.SalonUtils.generateQrSvgCode === 'function')
        ? window.SalonUtils.generateQrSvgCode(qrCodeText, 180)
        : `<div style="padding: 20px; font-weight: 800; font-size: 20px; color: #111;">[QR: ${qrCodeText}]</div>`;

      modalBody.innerHTML = `
        <div class="booking-wizard-wrapper" style="max-width: 480px; text-align: center;">
          <div class="badge-terracotta">VÉ ĐIỆN TỬ OMNI SALON CHECK-IN</div>
          <h2 class="booking-title" style="font-size: 20px; margin-top: 8px;">#${this.escapeHtml(booking.id || booking.bookingCode)}</h2>
          <p class="booking-subtitle">Đưa mã QR này cho Tiếp tân hoặc Master Stylist tại quầy để check-in tức thì</p>

          <div style="background: #fff; padding: 20px; border-radius: 12px; display: inline-block; margin: 16px auto; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 2px dashed #c85a44;">
            ${qrSvg}
            <div style="font-size: 13px; font-weight: 800; color: #111; letter-spacing: 0.1em; margin-top: 8px;">
              MÃ CHECK-IN: ${this.escapeHtml(qrCodeText)}
            </div>
          </div>

          <div style="text-align: left; background: #fafafa; border-radius: 10px; padding: 14px; font-size: 13px; line-height: 1.7; margin-bottom: 16px; border: 1px solid #eee;">
            <div><strong>Khách hàng:</strong> ${this.escapeHtml(booking.customerName)} (<span data-phone="${this.escapeHtml(booking.customerPhone)}">${this.escapeHtml(SalonUtils.maskPhone ? SalonUtils.maskPhone(booking.customerPhone) : booking.customerPhone)}</span>)</div>
            <div><strong>Dịch vụ:</strong> ${this.escapeHtml(booking.serviceName)}</div>
            <div><strong>Chi nhánh:</strong> ${this.escapeHtml(booking.branchName)}</div>
            <div><strong>Thời gian:</strong> <span style="color:#c85a44; font-weight:800;">${booking.timeSlot} — ${SalonUtils.formatDate(booking.date || booking.bookingDate)}</span></div>
            <div><strong>Master Stylist:</strong> ${this.escapeHtml(booking.stylistName || 'Master Stylist chỉ định')}</div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn-cancel" style="flex: 1;" onclick="CustomerWeb.openLookupModal('${booking.customerPhone || ''}')">
              ← Quay Lại Danh Sách
            </button>
            <button class="btn-submit-terracotta" style="flex: 1;" onclick="UICommon.closeGlobalModal()">
              Xong
            </button>
          </div>
        </div>
      `;
      modal.classList.add('active');
    },

    // -----------------------------------------------------------------------
    // 4. MAIN CUSTOMER PORTAL (TOÀN BỘ 14 SECTIONS TRANG CHỦ HOÀN THIỆN)
    // -----------------------------------------------------------------------
    renderMainContent() {
      const container = document.getElementById('webMainContainer');
      if (!container) return;

      if (this.currentTab === 'admin') {
        if (window.AdminWeb && typeof window.AdminWeb.render === 'function') {
          window.AdminWeb.render(container);
          return;
        }
        if (window.UIWeb && typeof window.UIWeb.renderAdminView === 'function') {
          window.UIWeb.renderAdminView(container);
          return;
        }
      }

      const newProducts = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts('new') : [];
      const bestProducts = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts('best') : [];
      const news = (window.store && typeof window.store.getNewsArticles === 'function') ? window.store.getNewsArticles() : [];
      const moments = (window.store && typeof window.store.getMoments === 'function') ? window.store.getMoments() : [];
      const brandCollabs = (window.store && typeof window.store.getBrandCollabs === 'function') ? window.store.getBrandCollabs() : [];
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const cutclubBranches = branches.filter(b => b.group === 'OMNI SALON CUTCLUB' || b.group === 'OMNI SALON CUTCLUB' || b.group === 'OMNI SALON SUITE');
      const chairmanBranches = branches.filter(b => b.group === 'TIỆM TÓC CỦA CHỦ TỊCH' || b.group === 'OMNI SALON FLAGSHIP');
      const hairstyles = (window.store && typeof window.store.getHairstyles === 'function') ? window.store.getHairstyles() : [];

      const featureArticle = news.find(n => n.isFeature) || news[0];
      const sideArticles = news.filter(n => !n.isFeature && n.id && n.id.startsWith('news-side'));
      const gridArticles = news.filter(n => n.id && n.id.startsWith('news-grid'));
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];

      container.innerHTML = `
        <!-- 1. SPLIT-SCREEN HERO HIỆN ĐẠI & FLOATING QUICK BOOKING WIDGET -->
        <section class="web-hero-section web-hero-split" id="heroSection">
          <div class="hero-split-container">
            <!-- Left: Brand Editorial Visual with Parallax / Art Direction -->
            <div class="hero-brand-editorial">
              <div class="hero-editorial-visual">
                <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=85" alt="Omni Salon Brand Editorial" class="hero-parallax-img" loading="eager">
                <div class="hero-editorial-overlay">
                  <span class="hero-editorial-badge">HAUTE COIFFURE &amp; GROOMING</span>
                  <h1 class="hero-editorial-title">OMNI SALON</h1>
                  <p class="hero-editorial-tagline">The Art of Modern Hair Care &amp; Bespoke Styling</p>
                  <div class="hero-editorial-metrics">
                    <div class="metric-item"><strong>18+</strong><span>Suites</span></div>
                    <div class="metric-divider"></div>
                    <div class="metric-item"><strong>4.9★</strong><span>Rating</span></div>
                    <div class="metric-divider"></div>
                    <div class="metric-item"><strong>100%</strong><span>On-time</span></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Right: Quick Booking Floating Widget -->
            <div class="quick-booking-card-floating">
              <div class="quick-booking-header">
                <span class="quick-booking-badge">FAST RESERVATION</span>
                <h3 class="quick-booking-title">Đặt Chỗ Trực Tiếp</h3>
                <p class="quick-booking-subtitle">Chọn chi nhánh &amp; dịch vụ để nhận phục vụ ưu tiên trong 60 giây</p>
              </div>
              <div class="quick-booking-form">
                <div class="quick-booking-field">
                  <label class="quick-booking-label">CHI NHÁNH SALON</label>
                  <select id="quickBranchSelect" class="quick-booking-pill-select">
                    ${branches.map(b => `<option value="${b.id}">${b.name.split('—')[0].trim()}</option>`).join('')}
                  </select>
                </div>
                <div class="quick-booking-field">
                  <label class="quick-booking-label">DỊCH VỤ MONG MUỐN</label>
                  <select id="quickServiceSelect" class="quick-booking-pill-select">
                    ${services.map(s => `<option value="${s.id}">${s.name} (${SalonUtils.formatCurrency(s.price)})</option>`).join('')}
                  </select>
                </div>
                <div class="quick-booking-field">
                  <label class="quick-booking-label">NGÀY HẸN TRẢI NGHIỆM</label>
                  <input type="date" id="quickDateInput" class="quick-booking-pill-select" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <button type="button" class="quick-booking-btn-submit" onclick="CustomerWeb.submitQuickBooking()">
                  ✨ Đặt Lịch Ngay (Khởi Tạo Ca Hẹn)
                </button>
                <div class="quick-booking-footer-links">
                  <a href="javascript:void(0)" onclick="CustomerWeb.openLookupModal()">🔍 Tra cứu lịch đã đặt</a>
                  <span>•</span>
                  <a href="#serviceSection">📋 Xem toàn bộ menu</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. BẠN ĐẾN NHÀ (KHOẢNH KHẮC THƯỜNG NHẬT OMNI SALON) -->
        <section class="section-container" style="padding-top: 40px; padding-bottom: 20px;">
          <h2 class="section-title-clean">BẠN ĐẾN NHÀ • OMNI SALON MOMENTS</h2>
          <div class="moments-horizontal-scroll">
            ${moments.map(m => `
              <div class="moment-card" title="${this.escapeHtml(m.caption)}">
                <img src="${m.image}" alt="${this.escapeHtml(m.caption)}" class="moment-img" loading="lazy">
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 3. BẢNG DỊCH VỤ BENTO GRID ĐẲNG CẤP VỚI CATEGORY FILTER -->
        <section class="section-container" id="serviceSection" style="padding-top: 50px;">
          <h2 class="section-title-clean">DỊCH VỤ &amp; COMBO ĐẶC TRƯNG</h2>
          <p class="section-subtitle-clean">Bố cục Bento Grid quốc tế — Tuyển tập gói chăm sóc &amp; tạo kiểu độc quyền.</p>

          <div class="services-category-bar">
            <button class="service-cat-pill ${this.selectedCategory === 'all' ? 'active' : ''}" onclick="CustomerWeb.filterServices('all')">Tất Cả Dịch Vụ</button>
            <button class="service-cat-pill ${this.selectedCategory === 'haircut' ? 'active' : ''}" onclick="CustomerWeb.filterServices('haircut')">✂️ Cắt Tạo Phom Fade</button>
            <button class="service-cat-pill ${this.selectedCategory === 'perm' ? 'active' : ''}" onclick="CustomerWeb.filterServices('perm')">🌀 Uốn Con Sâu / Texture</button>
            <button class="service-cat-pill ${this.selectedCategory === 'color' ? 'active' : ''}" onclick="CustomerWeb.filterServices('color')">🎨 Nhuộm &amp; Tẩy Màu Khói</button>
            <button class="service-cat-pill ${this.selectedCategory === 'shave' ? 'active' : ''}" onclick="CustomerWeb.filterServices('shave')">🪒 Cạo Khăn Nóng Proraso</button>
            <button class="service-cat-pill ${this.selectedCategory === 'combo' ? 'active' : ''}" onclick="CustomerWeb.filterServices('combo')">👑 Combo VIP Toàn Diện</button>
          </div>

          <div class="services-cards-grid services-bento-grid" id="servicesGridContainer">
            ${this.renderServicesCards()}
          </div>
        </section>

        <!-- 3.1. ĐỘI NGŨ MASTER STYLIST VỚI THẺ DỌC & SLIDE-OVER DRAWER -->
        <section class="section-container" id="stylistSection" style="padding-top: 60px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
            <div>
              <span class="quick-booking-badge">ĐỘI NGŨ CHUYÊN NGHIỆP</span>
              <h2 class="section-title-clean" style="margin: 6px 0 0 0; text-align: left;">ĐỘI NGŨ THỢ CẮT TÓC &amp; STYLIST</h2>
              <p class="section-subtitle-clean" style="margin: 4px 0 0 0; text-align: left;">Đội ngũ thợ cắt tóc và stylist giàu kinh nghiệm, luôn lắng nghe và tư vấn kiểu tóc hợp nhất cho bạn.</p>
            </div>
            <div class="stylist-slider-controls">
              <button class="slider-arrow-btn" onclick="CustomerWeb.scrollStylistSlider(-1)" title="Trước">←</button>
              <button class="slider-arrow-btn" onclick="CustomerWeb.scrollStylistSlider(1)" title="Sau">→</button>
            </div>
          </div>

          <div class="stylists-vertical-cards-slider" id="stylistsSliderContainer">
            ${stylists.map(st => `
              <div class="stylist-showcase-card">
                <div class="stylist-showcase-avatar-wrap">
                  <img src="${st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}" alt="${this.escapeHtml(st.name)}" class="stylist-showcase-avatar" loading="lazy">
                  <span class="stylist-master-badge">⭐ Stylist Chuyên Nghiệp</span>
                </div>
                <div class="stylist-showcase-body">
                  <h4 class="stylist-showcase-name">${this.escapeHtml(st.name)}</h4>
                  <div class="stylist-showcase-role">${this.escapeHtml(st.title || st.role || 'Senior Artisan')}</div>
                  <div class="stylist-showcase-meta">
                    <span class="stylist-rating-pill">★ ${st.rating || '4.9'} (${st.reviewCount || 128} đánh giá)</span>
                    <span class="stylist-exp-pill">${st.experience || '6+ năm'}</span>
                  </div>
                  <p class="stylist-showcase-specialty">Chuyên: ${this.escapeHtml((st.specialties || ['Fade Layer', 'Premlock', 'Texture Cut']).join(', '))}</p>
                  <div class="stylist-showcase-actions">
                    <button class="btn-check-availability" onclick="CustomerWeb.openStylistDrawer('${st.id}')">
                      📅 Xem Lịch Trống
                    </button>
                    <button class="btn-quick-pick" onclick="UICommon.openBookingModal(null, null, '${st.id}')">
                      Đặt Ngay
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 4. SẢN PHẨM MỚI (NEW ARRIVALS) -->
        <section class="section-container" id="newProductsSection" style="padding-top: 50px;">
          <h2 class="section-title-clean">SẢN PHẨM MỚI</h2>
          <p class="section-subtitle-clean">Những mẫu sáp vuốt và phụ kiện mới nhất vừa cập bến — cập nhật liên tục.</p>
          <div class="products-grid-5">
            ${newProducts.map(p => UICommon.renderProductCard(p)).join('')}
          </div>
        </section>

        <!-- 5. SẢN PHẨM BÁN CHẠY (BEST SELLERS) -->
        <section class="section-container" id="bestSellerSection" style="padding-top: 50px;">
          <h2 class="section-title-clean">SẢN PHẨM BÁN CHẠY</h2>
          <p class="section-subtitle-clean">Chúng tôi mang đến sự lựa chọn tốt nhất cho bạn với phong cách riêng biệt.</p>
          <div class="products-grid-5">
            ${bestProducts.map(p => UICommon.renderProductCard(p)).join('')}
          </div>
        </section>

        <!-- 6. TIN TÓC UNDERGROUND -->
        <section class="section-container" id="undergroundSection" style="padding-top: 60px;">
          <h2 class="section-title-clean">TIN TÓC UNDERGROUND</h2>
          <p class="section-subtitle-clean" style="max-width: 720px; margin: 0 auto 30px;">
            Cập nhật liên tục những xu hướng tóc, thời trang và lifestyle mới nhất từ giới trẻ đường phố.
          </p>

          <div class="underground-top-layout">
            <div class="underground-left-col">
              ${featureArticle ? UICommon.renderFeatureArticle(featureArticle) : ''}
            </div>
            <div class="underground-right-col">
              ${sideArticles.map(a => UICommon.renderSideArticle(a)).join('')}
            </div>
          </div>

          <div class="underground-bottom-grid">
            ${gridArticles.map(a => UICommon.renderGridArticle(a)).join('')}
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <button class="btn-black-solid" onclick="UICommon.showToast('📰 Bạn đang xem những tin tức mới nhất từ Omni Salon!')">XEM THÊM BÀI VIẾT</button>
          </div>
        </section>

        <!-- 7. HỆ THỐNG CHI NHÁNH OMNI SALON TRÊN TOÀN QUỐC -->
        <section class="section-container" id="branchesSection" style="padding-top: 60px;">
          <div class="branches-split-layout">
            <div class="branches-left-info">
              <h2 class="branches-main-title">Khám phá hệ thống chi nhánh Omni Salon trên toàn quốc.</h2>
              <p class="branches-sub-text">
                Dễ dàng tìm kiếm và trải nghiệm dịch vụ chất lượng cao cấp gần nơi bạn nhất.<br>
                <strong>Hotline: 1900 8899</strong>
              </p>
              <button class="btn-black-solid" style="margin-top: 20px;" onclick="UICommon.openBookingModal()">ĐẶT LỊCH NGAY</button>
            </div>

            <div class="branches-right-pills">
              <div class="branch-group-header">
                <span class="group-title">OMNI SALON BOUTIQUE</span>
                <span class="group-count">15 chi nhánh</span>
              </div>
              <div class="branch-pills-grid">
                ${cutclubBranches.map(b => UICommon.renderBranchPill(b)).join('')}
              </div>

              <div class="branch-group-header" style="margin-top: 28px;">
                <span class="group-title">OMNI SALON VIP SUITE</span>
                <span class="group-count">3 chi nhánh</span>
              </div>
              <div class="branch-pills-grid">
                ${chairmanBranches.map(b => UICommon.renderBranchPill(b)).join('')}
              </div>
            </div>
          </div>
        </section>

        <!-- 8. OMNI SALON AI STUDIO — ĐỔI KIỂU TÓC BẰNG ẢNH THẬT -->
        <section class="section-container" id="aiStudioSection" style="padding-top: 60px;">
          <div class="web-ai-studio-wrapper">
            <div class="web-ai-studio-header">
              <div class="badge-terracotta pulse-animation">CÔNG NGHỆ ĐỘT PHÁ 2026 • OMNI AI RESTYLE VISION</div>
              <h2 class="section-title-clean" style="margin-top: 8px; font-size: 28px; font-weight: 900; letter-spacing: 0.01em;">
                OMNI SALON AI STUDIO — THAY ĐỔI KIỂU TÓC BẰNG ẢNH THẬT
              </h2>
              <p class="section-subtitle-clean" style="max-width: 720px; margin: 0 auto 24px;">
                Chụp hoặc tải ảnh khuôn mặt của bạn lên để công nghệ AI tự động nhận diện dáng mặt, biến đổi kiểu tóc &amp; màu nhuộm xu hướng, và lưu vào bộ sưu tập cá nhân.
              </p>
            </div>
            <div id="webAiStudioContainer">
              ${this.renderAiStudioContent()}
            </div>
          </div>
        </section>

        <!-- 9. TÁC PHẨM TRONG THÁNG (HAIRSTYLES SHOWCASE) -->
        <section class="section-container" style="padding-top: 50px;">
          <h2 class="section-title-clean">TÁC PHẨM TRONG THÁNG</h2>
          <p class="section-subtitle-clean">Tuyển tập những kiểu tóc nam nổi bật do Master Stylist tạo mẫu.</p>
          <div class="hairstyles-showcase-grid">
            ${hairstyles.map(h => `
              <div class="hairstyle-card">
                <img src="${h.image}" alt="${this.escapeHtml(h.title)}" class="hs-img" loading="lazy">
                <div class="hs-info">
                  <h4 class="hs-title">${this.escapeHtml(h.title)}</h4>
                  <p class="hs-desc">${this.escapeHtml(h.description)}</p>
                  <div style="display:flex; gap:8px; margin-top:12px;">
                    <button class="pill-btn-outline" style="flex:1; font-size:12px;" onclick="CustomerWeb.selectAiStyle('${h.styleCategory || h.title}'); document.getElementById('aiStudioSection').scrollIntoView({behavior:'smooth'});">Thử AI Kiểu Này</button>
                    <button class="btn-submit-terracotta" style="padding:6px 14px; font-size:12px;" onclick="UICommon.openBookingModal('${h.serviceSuggestionId || ''}')">Đặt Lịch</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 10. OUR SERVICE (TICKER RUNNING PILLS) -->
        <section class="section-container" style="padding-top: 50px;">
          <h2 class="section-title-clean">OUR SERVICE</h2>
          ${UICommon.renderServicesTickerHTML ? UICommon.renderServicesTickerHTML() : ''}
        </section>

        <!-- 11. VIDEO NGẮN HAY NHẤT (SHORTS / REELS) -->
        <section class="section-container" style="padding-top: 50px; text-align: center;">
          <h2 class="section-title-clean">VIDEO NGẮN HAY NHẤT</h2>
          <div class="videos-preview-row">
            <div class="video-item-card" onclick="UICommon.showToast('🎬 Đang mở video kỹ thuật tạo kiểu chuẩn Omni Salon!')">
              <div class="video-play-overlay">▶</div>
              <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80" alt="Video 1" class="video-thumb">
              <div class="video-caption">Hành trình lột xác với Warrior Cut 2026</div>
            </div>
            <div class="video-item-card" onclick="UICommon.showToast('🎬 Đang mở video uốn con sâu Zic-zac cực cháy!')">
              <div class="video-play-overlay">▶</div>
              <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80" alt="Video 2" class="video-thumb">
              <div class="video-caption">Uốn Con Sâu Premlock cực cháy tại Quận 10</div>
            </div>
            <div class="video-item-card" onclick="UICommon.showToast('🎬 Đang mở video liệu trình cạo mặt thư giãn!')">
              <div class="video-play-overlay">▶</div>
              <img src="https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=400&q=80" alt="Video 3" class="video-thumb">
              <div class="video-caption">Liệu trình cạo mặt thư giãn quý ông Proraso</div>
            </div>
          </div>
        </section>

        <!-- 12. CÁC HỢP TÁC THƯƠNG HIỆU -->
        <section class="section-container" style="padding-top: 50px;">
          <h2 class="section-title-clean">CÁC HỢP TÁC THƯƠNG HIỆU</h2>
          <div class="collab-boxes-grid">
            ${brandCollabs.map(c => UICommon.renderBrandCollabCard(c)).join('')}
          </div>
        </section>

        <!-- 13. CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION) -->
        <section class="section-container" style="padding-top: 60px; padding-bottom: 20px;">
          <h2 class="section-title-clean">CÂU HỎI THƯỜNG GẶP</h2>
          <p class="section-subtitle-clean">Giải đáp những thắc mắc phổ biến của quý khách khi trải nghiệm tại Omni Salon.</p>
          
          <div class="faq-accordion-list">
            <div class="faq-accordion-item ${this.openFaqIndex === 0 ? 'open' : ''}">
              <button class="faq-header-btn" onclick="CustomerWeb.toggleFaq(0)">
                <span>1. Tôi có cần phải đặt lịch hẹn trước khi đến tiệm cắt không?</span>
                <span class="faq-icon-caret">▼</span>
              </button>
              <div class="faq-body-content">
                Omni Salon khuyến khích quý khách nên đặt lịch trước qua website hoặc App Mobile để được giữ ghế ưu tiên với đúng Master Stylist yêu thích, đảm bảo phục vụ đúng giờ và không phải chờ đợi vào các khung giờ cao điểm hoặc cuối tuần. Tuy nhiên, nếu bạn ghé trực tiếp (Walk-in), tiệm vẫn luôn bố trí thợ sẵn sàng đón tiếp.
              </div>
            </div>

            <div class="faq-accordion-item ${this.openFaqIndex === 1 ? 'open' : ''}">
              <button class="faq-header-btn" onclick="CustomerWeb.toggleFaq(1)">
                <span>2. Công nghệ Omni AI Hair Studio đổi kiểu tóc hoạt động ra sao?</span>
              </button>
              <div class="faq-body-content">
                Studio AI sử dụng mô hình thị giác máy tính nhận diện cấu trúc hộp sọ, đường viền hàm và ngũ quan của khuôn mặt bạn. Sau đó, AI sẽ dựng kiểu tóc mới (Side Part, Mullet, Uốn con sâu...) và hòa sắc màu nhuộm thời thượng lên ảnh thật của bạn với độ chân thực cao nhất, giúp bạn xem trước phom tóc phù hợp trước khi quyết định cắt.
              </div>
            </div>

            <div class="faq-accordion-item ${this.openFaqIndex === 2 ? 'open' : ''}">
              <button class="faq-header-btn" onclick="CustomerWeb.toggleFaq(2)">
                <span>3. Dịch vụ uốn tóc con sâu (Premlock) và nhuộm giữ phom được bao lâu?</span>
              </button>
              <div class="faq-body-content">
                Dịch vụ uốn tóc tại Omni Salon sử dụng thuốc uốn hữu cơ cao cấp nhập khẩu, giúp phom lọn sóng giữ ổn định từ 3 đến 5 tháng tùy thuộc vào tốc độ mọc dài của tóc. Với màu nhuộm, quý khách sẽ được tặng kèm bí quyết sấy tạo kiểu và gợi ý dòng dầu gội giữ màu chuyên dụng như Brosh Japan.
              </div>
            </div>

            <div class="faq-accordion-item ${this.openFaqIndex === 3 ? 'open' : ''}">
              <button class="faq-header-btn" onclick="CustomerWeb.toggleFaq(3)">
                <span>4. Tôi có thể tra cứu hoặc thay đổi giờ lịch hẹn đã đặt bằng cách nào?</span>
              </button>
              <div class="faq-body-content">
                Rất đơn giản, bạn chỉ cần bấm nút <strong>"Tra Cứu Lịch"</strong> trên thanh menu trên cùng, nhập Số điện thoại hoặc Mã lịch (#BK-...) để xem chi tiết ca hẹn, số ghế và thợ cắt. Bạn cũng có thể hủy lịch trực tiếp trên web hoặc liên hệ hotline <strong>1900 8899</strong> để được hỗ trợ tức thì.
              </div>
            </div>

            <div class="faq-accordion-item ${this.openFaqIndex === 4 ? 'open' : ''}">
              <button class="faq-header-btn" onclick="CustomerWeb.toggleFaq(4)">
                <span>5. Chính sách bảo hành và cam kết chất lượng của Omni Salon như thế nào?</span>
              </button>
              <div class="faq-body-content">
                Tất cả các dịch vụ cắt, uốn, nhuộm tại toàn bộ 18+ chi nhánh Omni Salon đều được bảo hành chỉnh sửa miễn phí trong vòng 7 ngày nếu quý khách chưa thực sự ưng ý với phom tóc hoặc nếp uốn. Sự hài lòng và vẻ ngoài tự tin của bạn là tiêu chí hàng đầu của chúng tôi.
              </div>
            </div>
          </div>
        </section>

        <!-- 14. FOOTER DOANH NGHIỆP ĐẦY ĐỦ THÔNG TIN PHÁP LÝ -->
        <footer class="web-footer">
          <div class="footer-inner">
            <div class="footer-col-brand">
              <div class="footer-logo-OMNI" style="font-size: 26px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.02em;">Omni Salon</div>
              <div style="font-size: 13px; color: #94A3B8; margin-top: 8px;">The Art of Modern Hair Care &amp; Grooming</div>
            </div>

            <div class="footer-col-info">
              <h4 class="footer-col-title">THÔNG TIN DOANH NGHIỆP</h4>
              <ul class="footer-info-list">
                <li><strong>CÔNG TY TNHH OMNI SALON ENTERPRISE</strong></li>
                <li>MST: 0315048848</li>
                <li>Địa chỉ HQ: 634 Điện Biên Phủ, Phường Vườn Lài, TP. Hồ Chí Minh</li>
                <li>Hotline: <strong style="color: #D4AF37;">1900 8899</strong></li>
                <li>Email: contact@omnisalon.vn</li>
                <li>Website: omnisalon.vn</li>
              </ul>
            </div>

            <div class="footer-col-policy">
              <h4 class="footer-col-title">CHÍNH SÁCH HỆ THỐNG</h4>
              <ul class="footer-policy-list">
                <li>› Về Omni Salon</li>
                <li>› Hướng dẫn Đặt lịch trực tuyến</li>
                <li>› Điều kiện giao dịch chung</li>
                <li>› Chính sách bảo mật thông tin khách hàng</li>
                <li>› Cam kết bảo hành 7 ngày &amp; Chất lượng tạo mẫu 5 sao</li>
                <li>› Chính sách mua hàng và thanh toán VietQR</li>
                <li>› Chính sách đổi trả và hoàn tiền sản phẩm</li>
                <li>› Tuyển dụng Master Stylist &amp; Quản lý Salon</li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom-bar">
            © 2026 Omni Salon. The Art of Modern Hair Care &amp; Grooming. All rights reserved.
          </div>
        </footer>

        <!-- Stylist Slide-over Drawer -->
        <div class="stylist-drawer-backdrop" id="stylistDrawerBackdrop" onclick="CustomerWeb.closeStylistDrawer()"></div>
        <div class="stylist-slide-over-drawer" id="stylistSlideOverDrawer">
          <div class="stylist-drawer-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="stylist-drawer-avatar-wrap">
                <img id="drawerStylistAvatar" src="" class="stylist-drawer-avatar" alt="">
              </div>
              <div>
                <h3 id="drawerStylistName" class="stylist-drawer-name" style="margin: 0; font-size: 16px; font-weight: 800; color: #FFF;">Master Stylist</h3>
                <span id="drawerStylistTitle" class="stylist-drawer-title" style="font-size: 12px; color: var(--color-accent-gold, #D4AF37);">Senior Artisan</span>
              </div>
            </div>
            <button type="button" class="stylist-drawer-close" onclick="CustomerWeb.closeStylistDrawer()">✕</button>
          </div>
          <div class="stylist-drawer-body" id="stylistDrawerBody"></div>
          <div class="stylist-drawer-footer" style="padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.08); background: #0B0D13;">
            <button type="button" class="quick-booking-btn-submit" id="drawerBookStylistBtn" style="width: 100%;">
              ✨ Đặt Lịch Với Stylist Này
            </button>
          </div>
        </div>
      `;
    },

    filterServices(category) {
      this.selectedCategory = category;
      const btns = document.querySelectorAll('.service-cat-pill');
      btns.forEach(b => {
        if (b.textContent.toLowerCase().includes(category) || (category === 'all' && b.textContent.includes('Tất Cả'))) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      const grid = document.getElementById('servicesGridContainer');
      if (grid) {
        grid.innerHTML = this.renderServicesCards(true);
      }
    },

    renderServicesCards(featuredOnly = true) {
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const combos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];

      const distinctServiceImgs = {
        DV01: 'Men_Grooming_Products/DichVu_Men/DV1.jpg',
        DV02: 'Men_Grooming_Products/DichVu_Men/DV2.jpg',
        DV03: 'Men_Grooming_Products/DichVu_Men/DV3.jpg',
        DV04: 'Men_Grooming_Products/DichVu_Men/DV4.jpg',
        DV05: 'Men_Grooming_Products/DichVu_Men/DV5.jpg',
        DV06: 'Men_Grooming_Products/DichVu_Men/DV6.jpg',
        DV07: 'Men_Grooming_Products/DichVu_Men/DV7.jpg',
        DV08: 'Men_Grooming_Products/DichVu_Men/DV8.jpg',
        DV09: 'Men_Grooming_Products/DichVu_Men/DV9.jpg',
        DV10: 'Men_Grooming_Products/DichVu_Men/DV10.jpg'
      };

      const all = [
        ...services.map(s => ({ ...s, isCombo: false, image: s.image || distinctServiceImgs[s.id] || distinctServiceImgs[s.MaDichVu] })),
        ...combos.map(c => ({ ...c, isCombo: true, category: 'combo', image: c.image || 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' }))
      ];

      let filtered;
      if (featuredOnly) {
        const featuredIds = ['DV01', 'DV02', 'DV03', 'DV04'];
        const featured = featuredIds.map(id => all.find(s => s.id === id || s.MaDichVu === id)).filter(Boolean);
        filtered = (featured.length === 4 ? featured : all.slice(0, 4)).slice(0, 4);
      } else {
        filtered = all.filter(s => {
          if (this.selectedCategory === 'all') return true;
          if (this.selectedCategory === 'combo') return s.isCombo;
          if (this.selectedCategory === 'haircut' || this.selectedCategory === 'cut' || this.selectedCategory === 'cat-tao-kieu') {
            return s.category === 'haircut' || s.id === 'DV01' || s.id === 'DV02' || (s.name && s.name.toLowerCase().includes('cắt'));
          }
          if (this.selectedCategory === 'perm') return s.category === 'perm' || s.id === 'DV03' || (s.name && (s.name.toLowerCase().includes('uốn') || s.name.toLowerCase().includes('ép')));
          if (this.selectedCategory === 'color') return s.category === 'color' || s.id === 'DV04' || (s.name && (s.name.toLowerCase().includes('nhuộm') || s.name.toLowerCase().includes('tẩy')));
          if (this.selectedCategory === 'shave' || this.selectedCategory === 'spa') return s.category === 'spa' || s.category === 'treatment' || s.id === 'DV05' || (s.name && (s.name.toLowerCase().includes('phục hồi') || s.name.toLowerCase().includes('cạo') || s.name.toLowerCase().includes('gội')));
          return true;
        });
      }

      return filtered.map(s => {
        let savingsBadge = '';
        if (s.isCombo && s.originalPrice && window.PricingService) {
          const savings = window.PricingService.calculateComboSavings(s.originalPrice, s.price);
          if (savings.isDiscounted) {
            savingsBadge = `<div style="font-size: 11px; color: #10B981; font-weight: 700; margin-top: 2px;">Tiết kiệm ${savings.formattedSavings} (-${savings.savingsPercent}%)</div>`;
          }
        }

        const fallbackImg = 'Men_Grooming_Products/DichVu_Men/DV1.jpg';
        const rawImg = s.image || (s.isCombo ? 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' : fallbackImg);
        const coverImg = (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function')
          ? SalonUtils.formatImageUrl(rawImg)
          : rawImg;

        const durationVal = String(s.duration || s.ThoiLuong || 45).replace(/\s*phút\s*/gi, '').trim();

        return `
        <div class="service-card-item card-3d-tilt" id="serviceCard_${s.id}">
          <div class="service-card-cover-wrap">
            <img src="${coverImg}" alt="${this.escapeHtml(s.name)}" class="service-card-cover" loading="lazy" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='Men_Grooming_Products/DichVu_Men/DV1.jpg');">
            <span class="service-card-duration-badge">⏱️ ${durationVal} phút</span>
          </div>
          <div class="service-card-body">
            <div style="font-size: 11px; font-weight: 800; color: #F59E0B; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em;">
              ${s.isCombo ? '👑 COMBO TRỌN GÓI VIP' : '✂️ MASTER STYLIST'}
            </div>
            <h4 class="service-card-title">${this.escapeHtml(s.name)}</h4>
            <p class="service-card-desc">${this.escapeHtml(s.description || '')}</p>
            <div class="service-card-footer">
              <div style="display: flex; flex-direction: column;">
                <span class="service-card-price">${SalonUtils.formatCurrency(s.price)}</span>
                ${savingsBadge}
              </div>
              <button class="service-card-cta-btn" onclick="UICommon.openBookingModal('${s.id}')">
                Đặt Lịch →
              </button>
            </div>
          </div>
        </div>
      `;
      }).join('');
    },

    toggleFaq(index) {
      this.openFaqIndex = this.openFaqIndex === index ? -1 : index;
      const items = document.querySelectorAll('.faq-accordion-item');
      items.forEach((item, idx) => {
        if (idx === this.openFaqIndex) item.classList.add('open');
        else item.classList.remove('open');
      });
    },

    submitQuickBooking() {
      const branchId = document.getElementById('quickBranchSelect')?.value;
      const serviceId = document.getElementById('quickServiceSelect')?.value;
      const date = document.getElementById('quickDateInput')?.value;

      if (window.UICommon && typeof window.UICommon.openBookingModal === 'function') {
        if (branchId) window.UICommon.bookingData.branchId = branchId;
        if (date) window.UICommon.bookingData.date = date;
        window.UICommon.openBookingModal(serviceId, branchId);
      }
    },

    scrollStylistSlider(direction) {
      const slider = document.getElementById('stylistsSliderContainer');
      if (slider) {
        slider.scrollBy({ left: direction * 300, behavior: 'smooth' });
      }
    },

    openStylistDrawer(stylistId) {
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const st = stylists.find(s => s.id === stylistId) || stylists[0];
      if (!st) return;

      const drawer = document.getElementById('stylistSlideOverDrawer');
      const backdrop = document.getElementById('stylistDrawerBackdrop');
      const avatar = document.getElementById('drawerStylistAvatar');
      const name = document.getElementById('drawerStylistName');
      const title = document.getElementById('drawerStylistTitle');
      const body = document.getElementById('drawerStylistBody');
      const bookBtn = document.getElementById('drawerBookStylistBtn');

      if (avatar) avatar.src = st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
      if (name) name.textContent = st.name;
      if (title) title.textContent = `${st.title || st.role || 'Senior Artisan'} • ★ ${st.rating || '4.9'}`;

      const specialties = st.specialties || ['Cắt Fade', 'Uốn Con Sâu', 'Nhuộm Tẩy'];
      const todaySlots = ['09:00', '10:30', '14:00', '16:30', '19:00'];

      if (body) {
        body.innerHTML = `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 8px;">CHUYÊN MÔN NỔI BẬT</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${specialties.map(sp => `<span class="badge-terracotta" style="font-size: 11px;">${this.escapeHtml(sp)}</span>`).join('')}
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 8px;">KINH NGHIỆM TẠO MẪU</div>
            <p style="font-size: 13px; color: #CCC; line-height: 1.6; margin: 0;">
              ${st.bio || `Hơn ${st.experience || '6 năm'} kinh nghiệm trong nghệ thuật tạo mẫu tóc nam cao cấp. Chuyên sâu về kỹ thuật fade mượt mà và các phương pháp uốn sóng texture hiện đại.`}
            </p>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase;">KHUNG GIỜ TRỐNG HÔM NAY</span>
              <span style="font-size: 11px; color: #10B981; font-weight: 700;">🟢 Còn 5 ca trống</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              ${todaySlots.map(time => `
                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 4px; text-align: center; cursor: pointer;"
                     onclick="CustomerWeb.closeStylistDrawer(); if(window.UICommon) { window.UICommon.bookingData.timeSlot = '${time}'; window.UICommon.openBookingModal(null, null, '${st.id}'); }">
                  <span style="font-size: 13px; font-weight: 700; color: #FFF;">⏰ ${time}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (bookBtn) {
        bookBtn.onclick = () => {
          this.closeStylistDrawer();
          if (window.UICommon && typeof window.UICommon.openBookingModal === 'function') {
            window.UICommon.openBookingModal(null, null, st.id);
          }
        };
      }

      if (backdrop) backdrop.classList.add('active');
      if (drawer) drawer.classList.add('active');
    },

    closeStylistDrawer() {
      const drawer = document.getElementById('stylistSlideOverDrawer');
      const backdrop = document.getElementById('stylistDrawerBackdrop');
      if (drawer) drawer.classList.remove('active');
      if (backdrop) backdrop.classList.remove('active');
    },

    // -----------------------------------------------------------------------
    // 5. AI BARBER STUDIO INLINE LOGIC (CANVAS NEURAL + GALLERY PERSISTENCE)
    // -----------------------------------------------------------------------
    renderAiStudioContent() {
      const { originalImage, resultImage, selectedStyle, selectedColorName, selectedColorHex, isProcessing, showApiSettings } = this.aiState;
      const aiConfig = (window.SalonApi && typeof window.SalonApi.getAiConfig === 'function')
        ? window.SalonApi.getAiConfig()
        : { provider: 'demo_smart', apiKey: '', endpoint: '' };

      const stylePresets = [
        { name: 'Side Part 7/3 Hàn Quốc', icon: '💇‍♂️' },
        { name: 'Undercut Fade Bén (Hà Hiền)', icon: '💈' },
        { name: 'Uốn Con Sâu / Texture Wave', icon: '🌀' },
        { name: 'Mullet Hiện Đại (Wolf Cut)', icon: '🐺' },
        { name: 'Buzz Cut Quân Đội', icon: '⚡' },
        { name: 'Crop Warrior Phá Cách', icon: '⚔️' },
        { name: 'Pompadour Quý Tộc', icon: '👑' },
        { name: 'Ép Side Tóc Nam (Down Perm)', icon: '✨' }
      ];

      const colorPresets = [
        { name: 'Đen Tự Nhiên', hex: '#1c1b18' },
        { name: 'Nâu Tây Lạnh', hex: '#4a3728' },
        { name: 'Khói Xám Bạc', hex: '#9ca3af' },
        { name: 'Vàng Rêu Khói', hex: '#7a8264' },
        { name: 'Nâu Hạt Dẻ', hex: '#6f4e37' },
        { name: 'Khói Ánh Tím', hex: '#6b46c1' }
      ];

      return `
        <div class="ai-studio-grid-layout">
          <!-- CỘT TRÁI: KHUNG HIỂN THỊ ẢNH & BEFORE / AFTER SLIDER -->
          <div class="ai-viewport-column">
            ${!originalImage
          ? `
                <div class="ai-upload-dropzone" id="webAiDropZone" onclick="document.getElementById('webAiPhotoFileInput').click()">
                  <input type="file" id="webAiPhotoFileInput" accept="image/*" style="display:none;" onchange="CustomerWeb.handleAiUpload(event)">
                  <input type="file" id="webAiCameraInput" accept="image/*" capture="user" style="display:none;" onchange="CustomerWeb.handleAiUpload(event)">
                  
                  <div class="dropzone-icon-box">
                    <svg width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <h4 style="font-size: 16px; font-weight: 800; margin-bottom: 6px;">Kéo thả hoặc bấm để tải ảnh chân dung của bạn</h4>
                  <p style="font-size: 13px; color: #888; max-width: 320px; margin: 0 auto 16px;">AI tự động phát hiện đường nét khuôn mặt, hộp sọ và chân tóc</p>

                  <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;" onclick="event.stopPropagation();">
                    <button class="btn-sub-action" onclick="document.getElementById('webAiPhotoFileInput').click()">
                      📁 Chọn Ảnh Từ Máy Tính
                    </button>
                    <button class="btn-sub-action" onclick="document.getElementById('webAiCameraInput').click()">
                      📸 Chụp Bằng Camera
                    </button>
                  </div>

                  <div class="sample-avatar-strip" onclick="event.stopPropagation();">
                    <span style="font-size: 11px; color: #999; font-weight: 700; display: block; margin-bottom: 8px;">HOẶC THỬ NHANH VỚI ẢNH MẪU:</span>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80" 
                           class="sample-avatar-thumb" title="Mẫu Nam 1" onclick="CustomerWeb.loadSampleAi(this.src)">
                      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80" 
                           class="sample-avatar-thumb" title="Mẫu Nam 2" onclick="CustomerWeb.loadSampleAi(this.src)">
                      <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80" 
                           class="sample-avatar-thumb" title="Mẫu Nam 3" onclick="CustomerWeb.loadSampleAi(this.src)">
                    </div>
                  </div>
                </div>
                `
          : isProcessing
            ? `
                <div class="ai-processing-container">
                  <div class="ai-scan-box">
                    <img src="${originalImage}" class="ai-base-img" alt="Scanning">
                    <div class="ai-scan-laser-line"></div>
                    <div class="ai-scan-grid-overlay"></div>
                  </div>
                  <div class="ai-progress-status-box">
                    <div class="barber-pole-spinner"></div>
                    <div style="font-size: 15px; font-weight: 800; color: #fff; margin-top: 14px;">
                      ĐANG LIÊN KẾT AI VISION XỬ LÝ ẢNH...
                    </div>
                    <div class="ai-status-step-text" id="webAiStatusStep">Đang phân tích cấu trúc khuôn mặt &amp; góc cạnh hộp sọ...</div>
                  </div>
                </div>
                `
            : resultImage
              ? `
                <div class="ai-compare-slider-shell">
                  <div class="ai-image-compare-wrapper" id="webCompareWrapper">
                    <img src="${resultImage}" class="compare-img compare-img-after" alt="Ảnh Sau Khi Đổi Tóc">
                    <span class="compare-label-after">✨ ẢNH TÓC AI</span>

                    <div class="compare-before-clip" id="webCompareBeforeClip" style="width: 50%;">
                      <img src="${originalImage}" class="compare-img compare-img-before" alt="Ảnh Gốc">
                      <span class="compare-label-before">ẢNH GỐC</span>
                    </div>

                    <div class="compare-divider-handle" id="webCompareHandle" style="left: 50%;">
                      <div class="handle-circle">↔</div>
                    </div>
                  </div>

                  <div class="compare-hint-bar">
                    <span>👈 Kéo thanh tròn sang trái/phải để so sánh Trước &amp; Sau 👉</span>
                  </div>

                  <div class="ai-result-actions-strip">
                    <button class="btn-sub-action" onclick="CustomerWeb.downloadAiResult()" title="Tải ảnh về máy">
                      📥 Tải Ảnh HD Về Máy
                    </button>
                    <button class="btn-sub-action" onclick="CustomerWeb.resetAi()">
                      🔄 Đổi Ảnh Khác
                    </button>
                  </div>
                </div>
                `
              : `
                <div class="ai-ready-preview-box">
                  <div class="ready-img-wrap">
                    <img src="${originalImage}" class="ready-preview-img" alt="Ảnh Đã Chọn">
                    <span class="ready-tag">ẢNH SẴN SÀNG</span>
                    <button class="btn-change-photo-mini" onclick="CustomerWeb.resetAi()">Đổi ảnh</button>
                  </div>
                  <div style="font-size: 13px; color: #888; text-align: center; margin-top: 12px;">
                    Đã nhận diện khuôn mặt. Hãy chọn kiểu tóc &amp; màu nhuộm bên phải và nhấn <strong>Biến Đổi</strong>!
                  </div>
                </div>
                `
        }
          </div>

          <!-- CỘT PHẢI: BẢNG ĐIỀU KHIỂN CHỌN KIỂU TÓC, MÀU & THAO TÁC -->
          <div class="ai-controls-column">
            <!-- 1. CHỌN MẪU TÓC NAM -->
            <div class="control-group">
              <label class="control-section-label">
                <span>1. CHỌN KIỂU TÓC XU HƯỚNG</span>
                <span class="badge-selected-tag">${this.escapeHtml(selectedStyle)}</span>
              </label>
              <div class="style-cards-grid">
                ${stylePresets.map(s => `
                  <button class="style-pill-card ${selectedStyle === s.name ? 'active' : ''}" 
                          onclick="CustomerWeb.selectAiStyle('${s.name}')">
                    <span class="style-icon">${s.icon}</span>
                    <span class="style-title">${s.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 2. CHỌN MÀU NHUỘM TÓC -->
            <div class="control-group" style="margin-top: 16px;">
              <label class="control-section-label">
                <span>2. CHỌN MÀU NHUỘM THỜI THƯỢNG</span>
                <span style="font-size: 12px; font-weight: 700; color: #c85a44;">${this.escapeHtml(selectedColorName)}</span>
              </label>
              <div class="color-swatches-grid">
                ${colorPresets.map(c => `
                  <button class="color-swatch-item ${selectedColorName === c.name ? 'active' : ''}" 
                          onclick="CustomerWeb.selectAiColor('${c.name}', '${c.hex}')" 
                          title="${c.name}">
                    <span class="swatch-circle" style="background: ${c.hex};"></span>
                    <span class="swatch-name">${c.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 3. MÔ TẢ YÊU CẦU TÙY BIẾN -->
            <div class="control-group" style="margin-top: 16px;">
              <label class="control-section-label">3. GHI CHÚ YÊU CẦU CHO AI (TÙY CHỌN)</label>
              <input type="text" id="webAiCustomPromptInput" class="ai-custom-input" 
                     placeholder="Ví dụ: Fade sát chân tóc, uốn sóng phồng nhẹ, vuốt sáp mờ..."
                     value="${this.escapeHtml(this.aiState.customPrompt || '')}"
                     onchange="CustomerWeb.aiState.customPrompt = this.value">
            </div>

            <!-- 4. NÚT MỞ CÀI ĐẶT API -->
            <div class="ai-api-toggle-row">
              <button class="btn-text-toggle" onclick="CustomerWeb.toggleAiApiSettings()">
                ⚙️ Cài đặt API Key &amp; Endpoint (${this.escapeHtml(aiConfig.provider)})
              </button>
            </div>

            <!-- KHUNG CẤU HÌNH API (KHI BẬT) -->
            ${showApiSettings ? `
              <div class="ai-settings-collapsible">
                <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 8px;">CẤU HÌNH KẾT NỐI AI VISION API:</div>
                <div class="api-form-row">
                  <label>Nhà Cung Cấp API:</label>
                  <select id="webAiProviderSelect" class="api-input-control">
                    <option value="demo_smart" ${aiConfig.provider === 'demo_smart' ? 'selected' : ''}>Omni Neural Engine (Sẵn có - Không cần Key)</option>
                    <option value="huggingface" ${aiConfig.provider === 'huggingface' ? 'selected' : ''}>Hugging Face Inference API</option>
                    <option value="replicate" ${aiConfig.provider === 'replicate' ? 'selected' : ''}>Replicate API (SD / Face-to-Many)</option>
                    <option value="openai" ${aiConfig.provider === 'openai' ? 'selected' : ''}>OpenAI Vision / DALL-E 3</option>
                  </select>
                </div>
                <div class="api-form-row">
                  <label>API Key (Mã Token):</label>
                  <input type="password" id="webAiApiKeyInput" class="api-input-control" placeholder="hf_xxxx... hoặc r8_xxxx..." value="${this.escapeHtml(aiConfig.apiKey || '')}">
                </div>
                <div class="api-form-row">
                  <label>API Endpoint (URL):</label>
                  <input type="text" id="webAiEndpointInput" class="api-input-control" placeholder="https://api-inference.huggingface.co/..." value="${this.escapeHtml(aiConfig.endpoint || '')}">
                </div>
                <button class="btn-submit-terracotta" style="width: 100%; padding: 8px; margin-top: 8px; font-size: 12px;" onclick="CustomerWeb.saveAiApiSettings()">
                  💾 Lưu Cấu Hình API
                </button>
              </div>
            ` : ''}

            <!-- 5. CÁC NÚT HÀNH ĐỘNG CHÍNH -->
            <div class="ai-action-buttons-wrap">
              ${!resultImage ? `
                <button class="btn-execute-ai" onclick="CustomerWeb.processAiRestyle()" ${!originalImage || isProcessing ? 'disabled style="opacity: 0.6;"' : ''}>
                  ⚡ BẮT ĐẦU ĐỔI KIỂU TÓC BẰNG AI →
                </button>
              ` : `
                <button class="btn-submit-terracotta btn-book-now-ai" onclick="CustomerWeb.bookAiHairstyle()">
                  📅 ĐẶT LỊCH CẮT KIỂU TÓC NÀY NGAY →
                </button>
                <button class="btn-execute-ai" style="margin-top: 8px; background: #222;" onclick="CustomerWeb.processAiRestyle()">
                  ✨ Thử Đổi Màu / Kiểu Tóc Khác
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    },

    updateAiStudio() {
      const el = document.getElementById('webAiStudioContainer');
      if (el) {
        el.innerHTML = this.renderAiStudioContent();
        if (this.aiState.resultImage && !this.aiState.isProcessing) {
          setTimeout(() => this.initCompareSlider(), 60);
        }
      }
    },

    selectAiStyle(styleName) {
      this.aiState.selectedStyle = styleName;
      this.updateAiStudio();
      if (window.UICommon) window.UICommon.showToast(`💇 Đã chọn kiểu tóc ${styleName}`);
    },

    selectAiColor(colorName, colorHex) {
      this.aiState.selectedColorName = colorName;
      this.aiState.selectedColorHex = colorHex;
      this.updateAiStudio();
      if (window.UICommon) window.UICommon.showToast(`🎨 Đã chọn màu ${colorName}`);
    },

    handleAiUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      // Validate định dạng ảnh & kích thước (< 5MB, JPG/PNG/WEBP, chống path traversal)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const allowedExtensions = /\.(jpe?g|png|webp)$/i;
      const fileName = (file.name || '').replace(/[\/\\]/g, '');

      if (fileName.includes('..') || fileName.includes('<') || fileName.includes('>')) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Tên tệp chứa ký tự không an toàn!', 'error');
        return;
      }

      if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExtensions.test(fileName)) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WEBP hợp lệ!', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Dung lượng ảnh không được vượt quá 5MB!', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.aiState.originalImage = e.target.result;
        this.aiState.resultImage = null;
        this.updateAiStudio();
        if (window.UICommon) window.UICommon.showToast('✅ Đã tải ảnh khuôn mặt lên Studio Web!');
      };
      reader.readAsDataURL(file);
    },

    loadSampleAi(imageUrl) {
      this.aiState.originalImage = imageUrl;
      this.aiState.resultImage = null;
      this.updateAiStudio();
      if (window.UICommon) window.UICommon.showToast('✅ Đã chọn ảnh mẫu. Bấm "Bắt Đầu Đổi Kiểu Tóc"!');
    },

    toggleAiApiSettings() {
      this.aiState.showApiSettings = !this.aiState.showApiSettings;
      this.updateAiStudio();
    },

    saveAiApiSettings() {
      const provider = document.getElementById('webAiProviderSelect')?.value;
      const apiKey = document.getElementById('webAiApiKeyInput')?.value;
      const endpoint = document.getElementById('webAiEndpointInput')?.value;
      if (window.SalonApi && typeof window.SalonApi.saveAiConfig === 'function') {
        window.SalonApi.saveAiConfig(provider, apiKey, endpoint);
        if (window.UICommon) window.UICommon.showToast('💾 Đã lưu cấu hình API thành công!');
        this.aiState.showApiSettings = false;
        this.updateAiStudio();
      }
    },

    async processAiRestyle() {
      if (!this.aiState.originalImage) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Vui lòng tải hoặc chọn ảnh chân dung trước.', 'warning');
        return;
      }
      this.aiState.isProcessing = true;
      this.updateAiStudio();

      const stepEl = document.getElementById('webAiStatusStep');
      setTimeout(() => { if (stepEl) stepEl.textContent = `Đang cắt phom tóc ${this.aiState.selectedStyle}...`; }, 400);
      setTimeout(() => { if (stepEl) stepEl.textContent = `Đang hòa sắc màu nhuộm ${this.aiState.selectedColorName}...`; }, 900);

      try {
        const response = await window.SalonApi.restyleHairPhoto({
          originalImageBase64: this.aiState.originalImage,
          hairstyleName: this.aiState.selectedStyle,
          hairColorName: this.aiState.selectedColorName,
          hairColorHex: this.aiState.selectedColorHex,
          customPrompt: this.aiState.customPrompt
        });

        this.aiState.isProcessing = false;
        if (response && response.resultImageUrl) {
          this.aiState.resultImage = response.resultImageUrl;

          // Lưu bức ảnh vào thư viện cá nhân (AI Gallery)
          this.saveAiToGallery({
            id: 'ai-' + Date.now(),
            hairstyle: this.aiState.selectedStyle,
            color: this.aiState.selectedColorName,
            colorHex: this.aiState.selectedColorHex,
            resultImageUrl: response.resultImageUrl,
            originalImageUrl: this.aiState.originalImage,
            createdAt: new Date().toISOString()
          });

          this.updateAiStudio();
          if (window.UICommon) window.UICommon.showToast(`🎉 Đổi kiểu tóc AI thành công (${response.providerUsed})!`);
        }
      } catch (err) {
        this.aiState.isProcessing = false;
        this.updateAiStudio();
        if (window.UICommon) window.UICommon.showToast(`❌ Lỗi AI: ${err.message}`, 'error');
      }
    },

    saveAiToGallery(item) {
      try {
        const user = this.getCurrentUser();
        const userId = user ? user.id : 'guest';
        const key = `${STORAGE_KEY_AI_GALLERY}_${userId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift(item);
        // Giữ tối đa 20 ảnh gần nhất
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
      } catch (e) {
        console.warn('[CustomerWeb] Cannot save to gallery localStorage:', e);
      }
    },

    getAiGallery() {
      try {
        const user = this.getCurrentUser();
        const userId = user ? user.id : 'guest';
        const key = `${STORAGE_KEY_AI_GALLERY}_${userId}`;
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch (e) { }

      // Fallback mẫu chất lượng nếu chưa có
      return [
        {
          id: 'ai-sample-1',
          hairstyle: 'Side Part 7/3 Hàn Quốc',
          color: 'Khói Xám Bạc',
          colorHex: '#9ca3af',
          resultImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          originalImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'ai-sample-2',
          hairstyle: 'Undercut Fade Bén (Hà Hiền)',
          color: 'Đen Tự Nhiên',
          colorHex: '#1c1b18',
          resultImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
          originalImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
    },

    initCompareSlider() {
      const wrapper = document.getElementById('webCompareWrapper');
      const beforeClip = document.getElementById('webCompareBeforeClip');
      const handle = document.getElementById('webCompareHandle');
      if (!wrapper || !beforeClip || !handle) return;

      let isSliding = false;
      const updateSlider = (clientX) => {
        const rect = wrapper.getBoundingClientRect();
        let pos = ((clientX - rect.left) / rect.width) * 100;
        if (pos < 2) pos = 2;
        if (pos > 98) pos = 98;
        beforeClip.style.width = `${pos}%`;
        handle.style.left = `${pos}%`;
      };

      wrapper.onmousedown = (e) => { isSliding = true; updateSlider(e.clientX); };
      window.onmousemove = (e) => { if (isSliding) updateSlider(e.clientX); };
      window.onmouseup = () => { isSliding = false; };
      wrapper.ontouchstart = (e) => { isSliding = true; updateSlider(e.touches[0].clientX); };
      window.ontouchmove = (e) => { if (isSliding) updateSlider(e.touches[0].clientX); };
      window.ontouchend = () => { isSliding = false; };
    },

    downloadAiResult() {
      if (!this.aiState.resultImage) return;
      const a = document.createElement('a');
      a.href = this.aiState.resultImage;
      a.download = `Omni-AI-${this.aiState.selectedStyle.replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (window.UICommon) window.UICommon.showToast('📥 Đã tải ảnh kiểu tóc HD về máy tính!');
    },

    resetAi() {
      this.aiState.originalImage = null;
      this.aiState.resultImage = null;
      this.updateAiStudio();
    },

    bookAiHairstyle() {
      if (window.UICommon && typeof window.UICommon.openBookingModal === 'function') {
        window.UICommon.openBookingModal();
        window.UICommon.showToast(`💇 Đã đưa kiểu tóc "${this.aiState.selectedStyle}" vào lịch hẹn!`);
      }
    },

    // -----------------------------------------------------------------------
    // 6. MÀN HÌNH TRANG CÁ NHÂN KHÁCH HÀNG (CUSTOMER PORTAL ĐẦY ĐỦ 5 TABS)
    // -----------------------------------------------------------------------
    openCustomerPortalModal() {
      const user = this.getCurrentUser();
      if (!user) {
        if (window.UICommon && typeof window.UICommon.openAuthModal === 'function') {
          window.UICommon.openAuthModal('login');
        }
        return;
      }

      this.portalActiveTab = 'bookings';
      this.renderCustomerPortalModalBody();
    },

    switchPortalTab(tabName) {
      this.portalActiveTab = tabName;
      this.renderCustomerPortalModalBody();
    },

    renderCustomerPortalModalBody() {
      const user = this.getCurrentUser();
      if (!user) return;

      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;

      const userBookings = this._getUserBookings(user);
      const userOrders = this._getUserOrders(user);

      const galleryItems = this.getAiGallery();
      const points = user.rewardPoints || (userBookings.length * 50 + 100);
      const tierName = user.tier || (points >= 500 ? 'VIP Chủ Tịch' : points >= 300 ? 'Omni Vàng VIP' : points >= 150 ? 'Omni Bạc' : 'Thành Viên Tiêu Chuẩn');

      const isAdmin = this.isAdminUser(user);

      const sanitizedEmail = (user.email || 'Chưa cập nhật Email')
        .replace(/@OMNIbarbershop\.com/gi, '@salontoc.vn')
        .replace(/@gmail\.com/gi, '@omnisalon.vn');

      modalBody.innerHTML = `
        <div class="customer-portal-shell" style="max-width: 720px; margin: 0 auto;">
          <!-- 1. Profile Hero Card (Thích ứng hoàn hảo Chế độ Sáng / Tối) -->
          <div class="portal-profile-hero" style="background: var(--surface-card, #f8fafc) !important; border: 1px solid var(--border-color, #cbd5e1) !important; border-radius: 16px; padding: 20px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 12px;">
              <div style="display: flex; gap: 16px; align-items: center;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #F59E0B, #D97706); color: #000; font-size: 24px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.3); flex-shrink: 0;">
                  ${SalonUtils.getInitials(user.fullName || user.name || user.username)}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <h3 style="font-size: 22px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0;">${this.escapeHtml(user.fullName || user.name || user.username)}</h3>
                    <span class="header-role-badge role-${(user.role || 'customer').toLowerCase()}">${this.getRoleBadgeText(user)}</span>
                  </div>
                  <div style="font-size: 14px; color: var(--text-secondary, #475569); margin-top: 4px; font-weight: 400;">
                    📞 ${this.escapeHtml(user.phone || 'Chưa cập nhật SĐT')} • ✉️ ${this.escapeHtml(sanitizedEmail)}
                  </div>
                </div>
              </div>
              <div class="portal-tier-pill" style="font-size: 13px; font-weight: 700; padding: 6px 14px; background: var(--surface-elevated, #e2e8f0); color: var(--brand-accent, #b48312); border: 1px solid var(--border-color, #cbd5e1); border-radius: 999px;">
                ★ ${this.escapeHtml(tierName)}
              </div>
            </div>

            <!-- 4 Metrics Stats Strip -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border-color, #e2e8f0); text-align: center;">
              <div>
                <div style="font-size: 13px; color: var(--text-secondary, #475569); font-weight: 500;">Điểm Thưởng</div>
                <div style="font-size: 22px; font-weight: 900; color: var(--brand-accent, #f59e0b); margin-top: 2px;">${points} pts</div>
              </div>
              <div>
                <div style="font-size: 13px; color: var(--text-secondary, #475569); font-weight: 500;">Lịch Đã Phục Vụ</div>
                <div style="font-size: 22px; font-weight: 900; color: var(--text-primary, #0f172a); margin-top: 2px;">${userBookings.length} Lần</div>
              </div>
              <div>
                <div style="font-size: 13px; color: var(--text-secondary, #475569); font-weight: 500;">Đơn Hàng Sáp</div>
                <div style="font-size: 22px; font-weight: 900; color: var(--text-primary, #0f172a); margin-top: 2px;">${userOrders.length} Đơn</div>
              </div>
              <div>
                <div style="font-size: 13px; color: var(--text-secondary, #475569); font-weight: 500;">Ảnh Tóc AI</div>
                <div style="font-size: 22px; font-weight: 900; color: #0284c7; margin-top: 2px;">${galleryItems.length} Ảnh</div>
              </div>
            </div>
          </div>

          <!-- [ ⚡ TRUNG TÂM QUẢN TRỊ & DỮ LIỆU CHUỖI SALON ] DÀNH RIÊNG CHO QUẢN TRỊ VIÊN (ADMIN) -->
          ${isAdmin ? `
            <div class="portal-admin-hub-card" onclick="UICommon.closeGlobalModal(); if(window.AppRouter) { window.AppRouter.navigate('/admin'); } else if(window.CustomerWeb) { window.CustomerWeb.switchTab('admin'); } else { window.location.href='/admin'; }" 
                 style="margin-top: 16px; margin-bottom: 18px; padding: 16px 20px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%); border: 2px solid #F59E0B; border-radius: 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15); transition: all 0.25s ease;">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: #F59E0B; color: #0F172A; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; flex-shrink: 0; box-shadow: 0 2px 10px rgba(245, 158, 11, 0.4);">
                  ⚡
                </div>
                <div>
                  <div style="font-size: 15px; font-weight: 900; color: #b48312; letter-spacing: 0.04em; text-transform: uppercase;">
                    [ ⚡ TRUNG TÂM QUẢN TRỊ &amp; DỮ LIỆU CHUỖI SALON ]
                  </div>
                  <div style="font-size: 13.5px; color: var(--text-secondary, #475569); margin-top: 2px; font-weight: 500;">
                    Dành riêng Quản trị viên: Điều phối ghế thợ, Doanh thu, Nhân sự &amp; Lịch đặt toàn chuỗi
                  </div>
                </div>
              </div>
              <button type="button" class="btn-primary-nordic" style="min-height: 48px; padding: 12px 22px; font-size: 15px; font-weight: 800; background: linear-gradient(135deg, #F59E0B, #D97706); color: #0F172A; border: none; border-radius: 12px; flex-shrink: 0; cursor: pointer; box-shadow: 0 2px 10px rgba(245, 158, 11, 0.3);" onclick="event.stopPropagation(); UICommon.closeGlobalModal(); if(window.AppRouter) { window.AppRouter.navigate('/admin'); } else if(window.CustomerWeb) { window.CustomerWeb.switchTab('admin'); } else { window.location.href='/admin'; }">
                [ ⚡ Trung Tâm Quản Trị Salon ] →
              </button>
            </div>
          ` : ''}

          <!-- 2. Portal Navigation Tabs -->
          <div class="portal-nav-tabs" style="display: flex; gap: 8px; border-bottom: 2px solid var(--border-color, #cbd5e1); margin-bottom: 18px; overflow-x: auto; padding-bottom: 4px;">
            <button class="portal-tab-btn ${this.portalActiveTab === 'bookings' ? 'active' : ''}" style="font-size: 14px; font-weight: 600; padding: 10px 16px;" onclick="CustomerWeb.switchPortalTab('bookings')">
              📅 Lịch Cắt Tóc (${userBookings.length})
            </button>
            <button class="portal-tab-btn ${this.portalActiveTab === 'orders' ? 'active' : ''}" style="font-size: 14px; font-weight: 600; padding: 10px 16px;" onclick="CustomerWeb.switchPortalTab('orders')">
              📦 Đơn Hàng (${userOrders.length})
            </button>
            <button class="portal-tab-btn ${this.portalActiveTab === 'gallery' ? 'active' : ''}" style="font-size: 14px; font-weight: 600; padding: 10px 16px;" onclick="CustomerWeb.switchPortalTab('gallery')">
              ⚡ Thư Viện Tóc AI (${galleryItems.length})
            </button>
            <button class="portal-tab-btn ${this.portalActiveTab === 'rewards' ? 'active' : ''}" style="font-size: 14px; font-weight: 600; padding: 10px 16px;" onclick="CustomerWeb.switchPortalTab('rewards')">
              🪙 Điểm &amp; Hạng
            </button>
            <button class="portal-tab-btn ${this.portalActiveTab === 'profile' ? 'active' : ''}" style="font-size: 14px; font-weight: 600; padding: 10px 16px;" onclick="CustomerWeb.switchPortalTab('profile')">
              ⚙️ Hồ Sơ
            </button>
          </div>

          <!-- 3. Dynamic Tab Content -->
          <div class="portal-tab-content-body" style="min-height: 260px; background: var(--surface-card, #f8fafc); border: 1px solid var(--border-color, #cbd5e1); border-radius: 14px; padding: 20px;">
            ${this.renderPortalTabContent(user, userBookings, userOrders, galleryItems, points, tierName)}
          </div>

          <!-- 4. Portal Footer Actions -->
          <div style="display: flex; gap: 12px; border-top: 1px solid var(--border-color, #cbd5e1); padding-top: 16px; margin-top: 20px; justify-content: space-between; align-items: center;">
            <button type="button" class="btn-cancel" style="min-height: 44px; height: 44px; padding: 0 20px; font-size: 14px; font-weight: 600; border-radius: 12px; background: var(--surface-elevated, #e2e8f0); color: var(--text-primary, #0f172a); border: 1px solid var(--border-color, #cbd5e1);" onclick="UICommon.closeGlobalModal()">Đóng Cửa Sổ</button>
            <button type="button" class="pill-btn-outline" style="min-height: 44px; height: 44px; color: #dc2626; border-color: rgba(220, 38, 38, 0.4); background: rgba(220, 38, 38, 0.08); font-size: 14px; font-weight: 700; padding: 0 20px; border-radius: 12px;" onclick="CustomerWeb.handleLogout()">
              🚪 Đăng Xuất An Toàn
            </button>
          </div>
        </div>
      `;

      modal.classList.add('active');
    },

    renderPortalTabContent(user, bookings, orders, gallery, points, tierName) {
      switch (this.portalActiveTab) {
        case 'bookings':
          return this.renderPortalBookingsTab(bookings);
        case 'orders':
          return this.renderPortalOrdersTab(orders);
        case 'gallery':
          return this.renderPortalGalleryTab(gallery);
        case 'rewards':
          return this.renderPortalRewardsTab(user, points, tierName);
        case 'profile':
          return this.renderPortalProfileTab(user);
        default:
          return this.renderPortalBookingsTab(bookings);
      }
    },

    renderPortalBookingsTab(bookings) {
      if (!bookings || bookings.length === 0) {
        return `
          <div style="padding: 32px 20px; background: var(--surface-elevated, #f8fafc); border-radius: 10px; text-align: center; color: var(--text-secondary, #64748b); font-size: 13px; border: 1px dashed var(--border-color, #cbd5e1);">
            <div style="font-size: 32px; margin-bottom: 8px;">📅</div>
            <strong style="color: var(--text-primary, #111);">Bạn chưa có lịch hẹn cắt tóc nào!</strong>
            <p style="margin: 6px auto 14px; max-width: 380px;">Hãy đặt lịch trước để được phục vụ đúng giờ với Master Stylist yêu thích và nhận 50 điểm thưởng thành viên.</p>
            <button class="btn-submit-terracotta" style="padding: 8px 20px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
              + Đặt Lịch Hẹn Ngay
            </button>
          </div>
        `;
      }

      // Eager loading map lookups O(1) để khử N+1 query trong vòng lặp render
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const branchMap = new Map(branches.map(b => [String(b.id), b]));
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const stylistMap = new Map(stylists.map(s => [String(s.id), s]));
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const serviceMap = new Map(services.map(s => [String(s.id), s]));

      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: var(--text-secondary, #555); text-transform: uppercase;">Danh Sách Lịch Hẹn Cắt Tóc:</span>
            <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
              + Đặt Lịch Mới
            </button>
          </div>
          <div style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px;">
            ${bookings.map(b => {
        const statusInfo = SalonUtils.formatBookingStatus(b.status);
        const isCancellable = b.status !== 'cancelled' && b.status !== 'completed';
        const branch = branchMap.get(String(b.branchId)) || {};
        const stylist = stylistMap.get(String(b.stylistId)) || {};
        const service = serviceMap.get(String(b.serviceId)) || {};
        const branchName = b.branchName || branch.name || 'Omni Salon Suite';
        const stylistName = b.stylistName || stylist.name || 'Chỉ định';
        const serviceName = b.serviceName || service.name || 'Dịch vụ Omni Salon';
        return `
                <div class="portal-card-history" style="background: var(--surface-card, #ffffff); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 12px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <div>
                      <strong style="color: var(--text-primary, #111); font-size: 14px;">#${this.escapeHtml(b.id || b.bookingCode)}</strong>
                      <span style="font-size: 13px; font-weight: 700; color: var(--color-terracotta); margin-left: 6px;">— ${this.escapeHtml(serviceName)}</span>
                    </div>
                    <span class="status-pill-pulse ${statusInfo.cssClass}" style="font-size: 10px;">
                      <span class="pulse-dot"></span> ${statusInfo.label}
                    </span>
                  </div>
                  <div style="font-size: 12px; color: var(--text-secondary, #555); line-height: 1.5;">
                    <div>🏢 Chi nhánh: <strong>${this.escapeHtml(branchName)}</strong></div>
                    <div>💈 Master Stylist: <strong>${this.escapeHtml(stylistName)}</strong> • ⏱️ Giờ hẹn: <span style="color: var(--brand-accent, #c85a44); font-weight:800;">${b.timeSlot} (${SalonUtils.formatDate(b.date || b.bookingDate)})</span></div>
                    <div>💵 Chi phí: <strong>${SalonUtils.formatCurrency(b.totalPrice || 0)}</strong></div>
                  </div>
                  <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px;">
                    <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="CustomerWeb.showTicketQr('${b.id}')">
                      🎫 Xem Vé QR
                    </button>
                    ${isCancellable ? `
                      <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px; color: #b91c1c; border-color: #fca5a5;" onclick="CustomerWeb.cancelBookingByCustomer('${b.id}')">
                        Hủy Lịch
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;
    },

    renderPortalOrdersTab(orders) {
      if (!orders || orders.length === 0) {
        return `
          <div style="padding: 32px 20px; background: var(--surface-elevated, #f8fafc); border-radius: 10px; text-align: center; color: var(--text-secondary, #64748b); font-size: 13px; border: 1px dashed var(--border-color, #cbd5e1);">
            <div style="font-size: 32px; margin-bottom: 8px;">🛍️</div>
            <strong style="color: var(--text-primary, #111);">Bạn chưa có đơn hàng mỹ phẩm nào!</strong>
            <p style="margin: 6px auto 14px; max-width: 380px;">Khám phá các dòng sáp Pomade Brosh Nhật Bản chính hãng, dầu gội giữ màu và áo nón Streetwear.</p>
            <button class="btn-submit-terracotta" style="padding: 8px 20px;" onclick="UICommon.closeGlobalModal(); document.getElementById('newProductsSection').scrollIntoView({behavior:'smooth'});">
              Xem Cửa Hàng Sản Phẩm
            </button>
          </div>
        `;
      }

      // Eager loading map lookups O(1) cho sản phẩm để khử N+1 query trong vòng lặp item
      const products = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts() : [];
      const productMap = new Map(products.map(p => [String(p.id), p]));

      return `
        <div>
          <div style="font-size: 12px; font-weight: 800; color: var(--text-secondary, #555); text-transform: uppercase; margin-bottom: 10px;">
            Lịch Sử Đơn Hàng &amp; Tiến Trình Vận Chuyển:
          </div>
          <div style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px;">
            ${orders.map(o => {
        const status = (o.orderStatus || o.status || 'Pending').toLowerCase();
        const isPickup = o.deliveryType === 'PICKUP_BRANCH';
        const items = o.items || [];
        return `
                <div class="portal-card-history" style="background: var(--surface-card, #ffffff); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 12px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                    <div>
                      <strong style="color: var(--text-primary, #111); font-size: 14px;">#${this.escapeHtml(o.id || o.orderCode)}</strong>
                      <span style="font-size: 12px; color: var(--text-secondary, #666); margin-left: 6px;">(${items.length} mặt hàng)</span>
                    </div>
                    <strong style="color: var(--color-terracotta); font-size: 14px;">${SalonUtils.formatCurrency(o.totalAmount || 0)}</strong>
                  </div>

                  <!-- Visual Order Timeline -->
                  <div class="order-status-timeline" style="display: flex; align-items: center; justify-content: space-between; margin: 10px 0; padding: 8px 12px; background: var(--surface-elevated, #f8fafc); border-radius: 8px; font-size: 11px;">
                    <span style="font-weight: ${status === 'pending' ? '800; color:#c85a44' : '600; color:var(--text-secondary, #666)'}">① Chờ Xác Nhận</span>
                    <span style="color:#ccc;">→</span>
                    <span style="font-weight: ${status === 'processing' ? '800; color:#c85a44' : '600; color:var(--text-secondary, #666)'}">② Đang Đóng Gói</span>
                    <span style="color:#ccc;">→</span>
                    <span style="font-weight: ${status === 'shipping' ? '800; color:#c85a44' : '600; color:var(--text-secondary, #666)'}">③ Đang Giao</span>
                    <span style="color:#ccc;">→</span>
                    <span style="font-weight: ${status === 'completed' ? '800; color:#16a34a' : '600; color:var(--text-secondary, #666)'}">④ Hoàn Tất</span>
                  </div>

                  <div style="font-size: 12px; color: var(--text-secondary, #555); line-height: 1.5;">
                    <div>Hình thức: <strong>${isPickup ? '🏢 Nhận tại chi nhánh Omni Salon' : '🚚 Giao hàng tận nhà'}</strong></div>
                    <div>Thanh toán: <strong>${this.escapeHtml(o.paymentMethod || 'VietQR')}</strong> • Trạng thái: <strong style="color:${o.paymentStatus === 'Paid' ? '#16a34a' : '#ea580c'}">${o.paymentStatus === 'Paid' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}</strong></div>
                  </div>

                  <!-- Danh sách món hàng tóm tắt -->
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color, #e5e7eb); font-size: 11px; color: var(--text-secondary, #666);">
                    ${items.map(it => {
          const prod = productMap.get(String(it.productId || it.id)) || {};
          const itemName = it.name || prod.name || 'Sản phẩm';
          const itemQty = it.qty || it.quantity || 1;
          const itemPrice = it.price || it.unitPrice || prod.price || 0;
          return `
                      <div style="display: flex; justify-content: space-between;">
                        <span>• ${this.escapeHtml(itemName)} x${itemQty}</span>
                        <span>${SalonUtils.formatCurrency(itemPrice * itemQty)}</span>
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
    },

    renderPortalGalleryTab(gallery) {
      if (!gallery || gallery.length === 0) {
        return `
          <div style="padding: 32px 20px; background: var(--surface-elevated, #f8fafc); border-radius: 10px; text-align: center; color: var(--text-secondary, #64748b); font-size: 13px; border: 1px dashed var(--border-color, #cbd5e1);">
            <div style="font-size: 32px; margin-bottom: 8px;">🎨</div>
            <strong style="color: var(--text-primary, #111);">Bạn chưa có bức ảnh tóc AI nào!</strong>
            <p style="margin: 6px auto 14px; max-width: 380px;">Hãy chụp hoặc tải ảnh khuôn mặt của bạn lên AI Barber Studio để thử phom tóc mới miễn phí.</p>
            <button class="btn-submit-terracotta" style="padding: 8px 20px;" onclick="UICommon.closeGlobalModal(); document.getElementById('aiStudioSection').scrollIntoView({behavior:'smooth'});">
              ⚡ Thử Đổi Kiểu Tóc AI Ngay
            </button>
          </div>
        `;
      }

      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: var(--text-secondary, #555); text-transform: uppercase;">Bộ Sưu Tập Tóc AI Đã Tạo (${gallery.length}):</span>
            <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="UICommon.closeGlobalModal(); document.getElementById('aiStudioSection').scrollIntoView({behavior:'smooth'});">
              + Tạo Kiểu Tóc Mới
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-height: 320px; overflow-y: auto; padding-right: 4px;">
            ${gallery.map(item => `
              <div class="portal-ai-card" style="background: var(--surface-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column;">
                <div style="position: relative; height: 160px; overflow: hidden; background: #000;">
                  <img src="${item.resultImageUrl}" alt="${this.escapeHtml(item.hairstyle)}" style="width: 100%; height: 100%; object-fit: cover;">
                  <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
                    ${SalonUtils.formatDate(item.createdAt)}
                  </span>
                </div>
                <div style="padding: 10px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h5 style="margin: 0 0 4px; font-size: 13px; font-weight: 800; color: var(--text-primary, #111);">${this.escapeHtml(item.hairstyle)}</h5>
                    <div style="font-size: 11px; color: var(--text-secondary, #666); display: flex; align-items: center; gap: 4px;">
                      <span style="width: 8px; height: 8px; border-radius: 50%; background: ${item.colorHex || '#111'}; display: inline-block;"></span>
                      <span>${this.escapeHtml(item.color)}</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px; margin-top: 10px;">
                    <a href="${item.resultImageUrl}" download="Omni-AI-Hair.jpg" class="pill-btn-outline" style="flex: 1; font-size: 10px; padding: 4px; text-align: center; text-decoration: none;">
                      📥 Tải HD
                    </a>
                    <button class="btn-submit-terracotta" style="flex: 1; font-size: 10px; padding: 4px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
                      ✂️ Cắt Kiểu Này
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    renderPortalRewardsTab(user, points, tierName) {
      const nextTierPoints = points < 150 ? 150 : points < 300 ? 300 : 500;
      const progressPercent = Math.min(100, Math.round((points / nextTierPoints) * 100));

      return `
        <div>
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%); border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase;">HẠNG THÀNH VIÊN HIỆN TẠI</span>
                <h4 style="font-size: 18px; font-weight: 900; color: #92400e; margin: 2px 0 0;">★ ${this.escapeHtml(tierName)}</h4>
              </div>
              <div style="font-size: 24px; font-weight: 900; color: #d97706;">
                ${points} <span style="font-size: 12px; color: #b45309;">điểm</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div style="margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #92400e; margin-bottom: 4px;">
                <span>Tiến trình nâng hạng tiếp theo</span>
                <span>${points} / ${nextTierPoints} pts</span>
              </div>
              <div style="width: 100%; height: 8px; background: rgba(217, 119, 6, 0.2); border-radius: 4px; overflow: hidden;">
                <div style="width: ${progressPercent}%; height: 100%; background: #d97706; border-radius: 4px;"></div>
              </div>
            </div>
          </div>

          <div style="font-size: 12px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 10px;">
            Đặc Quyền Thành Viên Omni Salon:
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #444;">
            <div style="display: flex; gap: 8px; align-items: baseline;">
              <span style="color: #16a34a; font-weight: 800;">✓</span>
              <span><strong>Tích điểm tự động:</strong> Nhận 50 điểm cho mỗi ca cắt tóc hoàn thành &amp; 1 điểm cho mỗi 10.000đ mua sắm.</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: baseline;">
              <span style="color: #16a34a; font-weight: 800;">✓</span>
              <span><strong>Ưu tiên đặt ghế:</strong> Được giữ chỗ thợ Master Stylist ưu tiên vào các khung giờ cao điểm cuối tuần.</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: baseline;">
              <span style="color: #16a34a; font-weight: 800;">✓</span>
              <span><strong>Chiết khấu độc quyền:</strong> Giảm giá trực tiếp 5% - 15% khi thanh toán qua cổng mã VietQR.</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: baseline;">
              <span style="color: #16a34a; font-weight: 800;">✓</span>
              <span><strong>Quà sinh nhật:</strong> Tặng 01 lần cạo mặt khăn nóng cổ điển &amp; vuốt sáp miễn phí trong tháng sinh nhật.</span>
            </div>
          </div>
        </div>
      `;
    },

    renderPortalProfileTab(user) {
      return `
        <div>
          <div style="font-size: 12px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 12px;">
            Cập Nhật Thông Tin Cá Nhân:
          </div>
          <form id="portalProfileForm" onsubmit="CustomerWeb.handleProfileUpdate(event)">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 700; color: #333; margin-bottom: 4px;">Họ Và Tên:</label>
                <input type="text" id="profileFullName" class="form-control-custom" value="${this.escapeHtml(user.fullName || user.name || '')}" placeholder="Nguyễn Văn A" required>
                <span class="field-error-text" id="errProfileFullName" style="display:none; color:#b91c1c; font-size:11px; margin-top:2px;"></span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; color: #333; margin-bottom: 4px;">Số Điện Thoại:</label>
                  <input type="tel" id="profilePhone" class="form-control-custom" value="${this.escapeHtml(user.phone || '')}" placeholder="0908123456" required>
                  <span class="field-error-text" id="errProfilePhone" style="display:none; color:#b91c1c; font-size:11px; margin-top:2px;"></span>
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; color: #333; margin-bottom: 4px;">Email Nhận Vé:</label>
                  <input type="email" id="profileEmail" class="form-control-custom" value="${this.escapeHtml(user.email || '')}" placeholder="member@omnisalon.vn" required>
                  <span class="field-error-text" id="errProfileEmail" style="display:none; color:#b91c1c; font-size:11px; margin-top:2px;"></span>
                </div>
              </div>

              <div>
                <label style="display: block; font-size: 12px; font-weight: 700; color: #333; margin-bottom: 4px;">Tên Đăng Nhập (Username):</label>
                <input type="text" class="form-control-custom" value="${this.escapeHtml(user.username || '')}" disabled style="background:#f1f5f9; color:#64748b; cursor:not-allowed;">
              </div>

              <div style="margin-top: 8px;">
                <button type="submit" class="btn-submit-terracotta" style="width: 100%; padding: 10px;">
                  💾 Lưu Thông Tin Cá Nhân
                </button>
              </div>
            </div>
          </form>
        </div>
      `;
    },

    handleProfileUpdate(e) {
      e.preventDefault();

      const nameInput = document.getElementById('profileFullName');
      const phoneInput = document.getElementById('profilePhone');
      const emailInput = document.getElementById('profileEmail');

      const fullName = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

      // Validate dữ liệu
      let hasError = false;

      const errName = document.getElementById('errProfileFullName');
      if (!fullName || fullName.length < 2) {
        if (errName) { errName.textContent = 'Họ và tên phải có ít nhất 2 ký tự.'; errName.style.display = 'block'; }
        hasError = true;
      } else if (errName) { errName.style.display = 'none'; }

      const phoneRegex = /^(0|\+84)[0-9]{9}$/;
      const errPhone = document.getElementById('errProfilePhone');
      if (!phone || !phoneRegex.test(phone)) {
        if (errPhone) { errPhone.textContent = 'Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 0 hoặc +84).'; errPhone.style.display = 'block'; }
        hasError = true;
      } else if (errPhone) { errPhone.style.display = 'none'; }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const errEmail = document.getElementById('errProfileEmail');
      if (!email || !emailRegex.test(email)) {
        if (errEmail) { errEmail.textContent = 'Định dạng Email không hợp lệ.'; errEmail.style.display = 'block'; }
        hasError = true;
      } else if (errEmail) { errEmail.style.display = 'none'; }

      if (hasError) return;

      const updates = { fullName, phone, email };

      if (window.AuthEngine && typeof window.AuthEngine.updateProfile === 'function') {
        const res = window.AuthEngine.updateProfile(updates);
        if (res && res.success) {
          if (window.UICommon) window.UICommon.showToast('✅ Cập nhật hồ sơ tài khoản thành công!');
          this.renderHeader();
          this.renderCustomerPortalModalBody();
        } else {
          if (window.UICommon) window.UICommon.showToast(res.message || 'Lỗi cập nhật hồ sơ', 'error');
        }
      } else if (window.store && typeof window.store.updateCurrentUser === 'function') {
        window.store.updateCurrentUser(updates);
        if (window.UICommon) window.UICommon.showToast('✅ Đã lưu thông tin tài khoản!');
        this.renderHeader();
        this.renderCustomerPortalModalBody();
      }
    },

    handleLogout() {
      if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản không?')) {
        if (window.AuthEngine && typeof window.AuthEngine.logout === 'function') {
          window.AuthEngine.logout();
        } else if (window.store && typeof window.store.logout === 'function') {
          window.store.logout();
        }
        if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
          window.UICommon.closeGlobalModal();
        }
        if (window.UICommon) window.UICommon.showToast('Đã đăng xuất tài khoản an toàn!');
        this.currentTab = 'home';
        this.renderHeader();
        this.renderMainContent();
      }
    },

    // -----------------------------------------------------------------------
    // 7. ROLE GUARD CHUYỂN TAB VÀ TƯƠNG THÍCH ĐA PHÂN HỆ
    // -----------------------------------------------------------------------
    switchTab(tab) {
      if (tab === 'admin') {
        const user = this.getCurrentUser();
        const isAdmin = this.isAdminUser(user);

        if (!isAdmin) {
          if (!user) {
            if (window.UICommon) {
              window.UICommon.showToast('Vui lòng đăng nhập với tài khoản Quản trị viên (Admin)!', 'warning');
              window.UICommon.openAuthModal('login');
            }
          } else {
            this.handleAdminDenied();
          }
          return;
        }

        this.currentTab = 'admin';
        this.renderHeader();
        if (window.AppRouter && window.AppRouter.currentRoute !== '/admin') {
          window.AppRouter.navigate('/admin');
        } else {
          this.renderMainContent();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (tab === 'services') {
        this.currentTab = 'services';
        this.renderHeader();
        if (window.AppRouter) window.AppRouter.navigate('/services');
        return;
      }

      if (tab === 'stylists') {
        this.currentTab = 'stylists';
        this.renderHeader();
        if (window.AppRouter) window.AppRouter.navigate('/stylists');
        return;
      }

      if (tab === 'booking') {
        this.currentTab = 'booking';
        this.renderHeader();
        if (window.AppRouter) window.AppRouter.navigate('/booking');
        return;
      }

      if (tab === 'shop') {
        this.currentTab = 'shop';
        this.renderHeader();
        if (window.AppRouter) window.AppRouter.navigate('/shop');
        return;
      }

      if (tab === 'ai') {
        if (typeof this.openCustomerPortalModal === 'function') {
          this.openCustomerPortalModal('gallery');
        }
        return;
      }

      this.currentTab = tab || 'home';
      this.renderHeader();
      if (window.AppRouter && window.AppRouter.currentRoute !== '/') {
        window.AppRouter.navigate('/');
      } else {
        this.renderMainContent();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // -----------------------------------------------------------------------
  // EXPOSURE & TƯƠNG THÍCH HOÀN HẢO VỚI HỆ THỐNG HIỆN HỮU (UIWEB BRIDGE)
  // -----------------------------------------------------------------------
  window.CustomerWeb = CustomerWeb;

  // Cầu nối thông minh: Nếu UIWeb đã tồn tại, đồng bộ hóa các hàm gọi từ UIWeb sang CustomerWeb
  if (typeof window.UIWeb !== 'undefined') {
    window.UIWeb.customer = CustomerWeb;
    window.UIWeb.openCustomerPortalModal = CustomerWeb.openCustomerPortalModal.bind(CustomerWeb);
    window.UIWeb.openProfileMenu = CustomerWeb.openCustomerPortalModal.bind(CustomerWeb);
    window.UIWeb.handleLiveSearch = CustomerWeb.handleLiveSearch.bind(CustomerWeb);
    window.UIWeb.openLookupModal = CustomerWeb.openLookupModal.bind(CustomerWeb);
    window.UIWeb.searchBookingLookup = CustomerWeb.searchBookingLookup.bind(CustomerWeb);
  }

})(typeof window !== 'undefined' ? window : this);

