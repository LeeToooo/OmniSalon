// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - MODULE THANH TIÊU ĐỀ HEADER (CUSTOMER HEADER)
// File: web/frontend/js/modules/customer/customer-header.js
// ============================================================================

(function (window) {
  'use strict';

  const CustomerHeader = {
    renderHeader() {
      const headerEl = document.getElementById('webHeaderContainer');
      if (!headerEl) return;

      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : [];
      const currentBranch = (window.store && typeof window.store.getCurrentBranch === 'function')
        ? window.store.getCurrentBranch()
        : branches[0] || null;

      const getUser = (typeof this.getCurrentUser === 'function')
        ? this.getCurrentUser.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function'
            ? window.CustomerWeb.getCurrentUser.bind(window.CustomerWeb)
            : null);
      const user = getUser ? getUser() : (window.store && typeof window.store.getCurrentUser === 'function' ? window.store.getCurrentUser() : null);

      const cart = (window.store && typeof window.store.getCart === 'function')
        ? window.store.getCart()
        : [];
      const cartCount = cart.reduce((sum, i) => sum + (i.qty || 1), 0);

      // Xác định quyền hạn quản trị  Chỉ dành riêng cho Admin 
      const checkAdmin = (typeof this.isAdminUser === 'function')
        ? this.isAdminUser.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.isAdminUser === 'function'
            ? window.CustomerWeb.isAdminUser.bind(window.CustomerWeb)
            : null);
      const isAdmin = checkAdmin ? checkAdmin(user) : false;

      const currentTab = this.currentTab !== undefined ? this.currentTab : (window.CustomerWeb?.currentTab || 'home');

      const escapeFn = (s) => {
        if (typeof this.escapeHtml === 'function') return this.escapeHtml(s);
        if (window.CustomerWeb && typeof window.CustomerWeb.escapeHtml === 'function') return window.CustomerWeb.escapeHtml(s);
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      };

      const getRoleBadge = (u) => {
        if (typeof this.getRoleBadgeText === 'function') return this.getRoleBadgeText(u);
        if (window.CustomerWeb && typeof window.CustomerWeb.getRoleBadgeText === 'function') return window.CustomerWeb.getRoleBadgeText(u);
        return 'Khách hàng';
      };

      const renderShopMega = () => {
        if (typeof this.renderShopMegaMenuHTML === 'function') return this.renderShopMegaMenuHTML();
        if (window.CustomerWeb && typeof window.CustomerWeb.renderShopMegaMenuHTML === 'function') return window.CustomerWeb.renderShopMegaMenuHTML();
        return '';
      };

      const renderBranchesMega = () => {
        if (typeof this.renderBranchesMegaMenuHTML === 'function') return this.renderBranchesMegaMenuHTML();
        if (window.CustomerWeb && typeof window.CustomerWeb.renderBranchesMegaMenuHTML === 'function') return window.CustomerWeb.renderBranchesMegaMenuHTML();
        return '';
      };

      const renderMiniCart = () => {
        if (typeof this.renderMiniCartDropdownHTML === 'function') return this.renderMiniCartDropdownHTML();
        if (window.CustomerWeb && typeof window.CustomerWeb.renderMiniCartDropdownHTML === 'function') return window.CustomerWeb.renderMiniCartDropdownHTML();
        return '';
      };

      const renderAdminBtn = (u, adm) => {
        if (typeof this.renderAdminButtonHTML === 'function') return this.renderAdminButtonHTML(u, adm);
        if (window.CustomerWeb && typeof window.CustomerWeb.renderAdminButtonHTML === 'function') return window.CustomerWeb.renderAdminButtonHTML(u, adm);
        return '';
      };

      headerEl.innerHTML = `
        <header class="web-main-header">
          <div class="web-header-inner">
            <!-- CỤM 1  - TRÁI - : Brand Logo Omni Salon + Slogan Barber Style -->
            <div class="brand-logo-wrap flex-shrink-0" onclick="CustomerWeb.switchTab('home')" style="cursor: pointer;" title="Về trang chủ Omni Salon">
              <span class="logo-text-omni" style="letter-spacing: -0.02em; font-weight: 900;">OMNI SALON</span>
              <span class="logo-sub-text" style="color: var(--brand-accent); font-weight: 700; font-size: 13.5px;">Barbershop Đương Đại</span>
            </div>

            <!-- CỤM 2  - GIỮA - : Navigation Links thuần tiếng Việt -->
            <nav class="web-nav-links">
              <a href="/" data-route="/" class="nav-link ${currentTab === 'home' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.switchTab('home')">Trang chủ</a>
              <a href="/services" data-route="/services" class="nav-link ${currentTab === 'services' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.switchTab('services')">Dịch vụ</a>
              <a href="/stylists" data-route="/stylists" class="nav-link ${currentTab === 'stylists' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.switchTab('stylists')">Thợ tạo mẫu</a>
              <a href="/booking" data-route="/booking" class="nav-link ${currentTab === 'booking' ? 'active' : ''} text-highlight" onclick="event.preventDefault(); CustomerWeb.switchTab('booking')">Đặt lịch</a>
              <!-- CỬA HÀNG (MEGA MENU - CHUẨN ẢNH 2 4RAU) -->
              <div class="nav-mega-parent" id="navShopMegaWrap"
                   onmouseenter="CustomerWeb.handleMegaEnter('shop')"
                   onmouseleave="CustomerWeb.handleMegaLeave('shop')">
                <a href="/shop" data-route="/shop" class="nav-link nav-link-optional ${currentTab === 'shop' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.handleNavMegaClick('shop', event)">
                  <span>Cửa hàng</span>
                  <svg class="nav-caret-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </a>
                <div class="header-mega-menu shop-mega-menu" id="headerShopMegaDropdown">
                  ${renderShopMega()}
                </div>
              </div>

              <!-- CHI NHÁNH (MEGA MENU - CHUẨN ẢNH 2 4RAU) -->
              <div class="nav-mega-parent" id="navBranchesMegaWrap"
                   onmouseenter="CustomerWeb.handleMegaEnter('branches')"
                   onmouseleave="CustomerWeb.handleMegaLeave('branches')">
                <a href="/branches" data-route="/branches" class="nav-link nav-link-optional ${currentTab === 'branches' ? 'active' : ''}" onclick="event.preventDefault(); CustomerWeb.handleNavMegaClick('branches', event)">
                  <span>Chi nhánh</span>
                  <svg class="nav-caret-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </a>
                <div class="header-mega-menu branches-mega-menu" id="headerBranchesMegaDropdown">
                  ${renderBranchesMega()}
                </div>
              </div>
              <a href="/ai-studio" data-route="/ai-studio" class="nav-link nav-link-optional text-highlight" onclick="event.preventDefault(); CustomerWeb.switchTab('ai')">AI tạo kiểu tóc</a>
            </nav>

            <!-- CỤM 3  - PHẢI - : Search, Cart, Theme Toggle, User Dropdown -->
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

              <!-- Nut Gio Hang voi Mini Cart Dropdown Popup chuan phong cach cao cap -->
              <div class="header-cart-menu-wrapper flex-shrink-0" id="headerCartWrapper"
                   onmouseenter="CustomerWeb.handleCartMouseEnter()"
                   onmouseleave="CustomerWeb.handleCartMouseLeave()">
                <button type="button" class="header-action-btn cart-btn-wrap" id="headerCartBtn" 
                        onclick="CustomerWeb.goToCartPage(event)" 
                        title="Xem giỏ hàng" aria-label="Giỏ hàng">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  <span class="cart-badge-count" style="${cartCount > 0 ? '' : 'display:none;'}">${cartCount}</span>
                </button>

                <!-- Mini Cart Dropdown Popup -->
                <div class="header-cart-dropdown" id="headerCartDropdown">
                  ${renderMiniCart()}
                </div>
              </div>

              <!-- Nút Chuyển Đổi Chế Độ Sáng / Tối với Icon Tinh Tế -->
              <button type="button" class="header-action-btn theme-toggle-btn flex-shrink-0" onclick="window.ThemeEngine && window.ThemeEngine.toggleTheme()" title="Chuyển chế độ Sáng / Tối" aria-label="Chuyển chế độ Sáng / Tối">
                <svg class="theme-icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
                <svg class="theme-icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </button>

              <!-- User / Auth Header Section -->
              ${user ? `
                <!-- User Menu Dropdown khi da dang nhap -->
                <div class="header-user-menu-wrapper flex-shrink-0">
                  <button type="button" class="header-user-btn" id="headerUserBtn" onclick="CustomerWeb.toggleUserMenu(event)" title="Menu tài khoản ${escapeFn(user.fullName || user.name || user.username)}">
                    <span class="user-avatar-text">${SalonUtils.getInitials(user.fullName || user.name || user.username || 'Omni')}</span>
                    <span class="user-name-text">${((user.fullName || user.name || user.username || 'Tài Khoản').trim().split(' ').slice(-1)[0] || 'Tài Khoản')}</span>
                    <svg class="user-caret-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  <!-- Dropdown Content Menu khi bam vao Avatar -->
                  <div class="header-user-dropdown" id="headerUserDropdown">
                    <div class="dropdown-user-header">
                      <span class="user-avatar-text" style="width: 42px; height: 42px; font-size: 15px; font-weight: 800;">${SalonUtils.getInitials(user.fullName || user.name || user.username || 'Omni')}</span>
                      <div class="dropdown-user-details" style="display: flex; flex-direction: column; overflow: hidden; gap: 3px;">
                        <span class="dropdown-user-name" style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); line-height: 1.3;">${escapeFn(user.fullName || user.name || user.username)}</span>
                        <span class="header-role-badge" style="width: fit-content;">${getRoleBadge(user)}</span>
                      </div>
                    </div>

                    <!-- Chon chi nhanh cho nhan vien hoac quan tri -->
                    ${(() => {
                      const roleUpper = String(user?.role || user?.vaiTroSql || user?.VaiTro || user?.ChucVu || user?.chucVuSql || '').toUpperCase();
                      const uid = String(user?.id || user?.MaNhanVien || user?.staffId || '').toUpperCase();
                      const isSuper = user && (uid === 'NV00' || roleUpper.includes('ADMIN') || roleUpper.includes('QUẢN TRỊ') || user.username === 'admin');
                      const isBranchMgr = user && !isSuper && (roleUpper.includes('QUẢN LÝ') || roleUpper.includes('BRANCH_MANAGER'));
                      const isStf = user && !isSuper && !isBranchMgr && (roleUpper.includes('THỢ') || roleUpper.includes('STYLIST') || roleUpper.includes('THU NGÂN') || roleUpper.includes('CASHIER') || roleUpper.includes('NHÂN VIÊN') || roleUpper.includes('STAFF') || roleUpper.includes('BARBER'));

                      if (isSuper) {
                        return `
                          <div class="dropdown-branch-pill">
                            <div class="branch-pill-header">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              <span>Chi nhánh quản trị:</span>
                            </div>
                            <select class="header-branch-select" onchange="window.store && window.store.setSelectedBranch(this.value)">
                              ${branches.map(b => `<option value="${b.id}" ${b.id === currentBranch?.id ? 'selected' : ''}>${(b.TenChiNhanh || b.name).trim()}</option>`).join('')}
                            </select>
                          </div>
                        `;
                      }
                      if (isBranchMgr) {
                        const bObj = user?.branchId ? branches.find(b => b.id === user.branchId || b.MaChiNhanh === user.branchId) : null;
                        const userBranchName = (bObj ? (bObj.TenChiNhanh || bObj.name) : null) || user?.branchName || currentBranch?.TenChiNhanh || currentBranch?.name || 'Chi Nhánh Quản Trị';
                        return `
                          <div class="dropdown-branch-pill">
                            <div class="branch-pill-header">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              <span>Chi nhánh quản trị:</span>
                            </div>
                            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); padding: 2px 0;">
                              ${escapeFn(userBranchName.split('—')[0].trim())}
                            </div>
                          </div>
                        `;
                      }
                      if (isStf) {
                        const userBranchName = user?.branchName || (user?.branchId ? branches.find(b => b.id === user.branchId)?.name : null) || currentBranch?.name || 'Omni Salon Barber';
                        return `
                          <div class="dropdown-branch-pill">
                            <div class="branch-pill-header">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              <span>Chi nhánh công tác:</span>
                            </div>
                            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); padding: 2px 0;">
                              ${escapeFn(userBranchName.split('—')[0].trim())}
                            </div>
                          </div>
                          <button class="dropdown-item-btn" style="background: var(--surface-card); color: var(--text-primary); font-weight: 700; border: 1px solid var(--border-color); border-radius: 8px; margin: 2px 0;" onclick="CustomerWeb.closeUserMenu(); if(window.AdminWeb) { AdminWeb.adminSubTab = 'receipts'; AdminWeb.inventorySubTab = 'receipts'; CustomerWeb.switchTab('admin'); setTimeout(() => { AdminWeb.switchSubTab('receipts'); AdminWeb.openAddReceiptModal(); }, 200); }">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            <span>Lập phiếu nhập kho</span>
                          </button>
                        `;
                      }
                      return '';
                    })()}

                    <!-- Nut Quan Tri Salon cho Admin hoac Quan Ly -->
                    ${renderAdminBtn(user, isAdmin)}

                    <!-- Lich lam viec danh cho Tho va Thu ngan -->
                    ${(() => {
                      const roleUpper = String(user?.role || user?.vaiTroSql || user?.VaiTro || user?.ChucVu || user?.chucVuSql || '').toUpperCase();
                      const isStf = user && (roleUpper.includes('THỢ') || roleUpper.includes('STYLIST') || roleUpper.includes('THU NGÂN') || roleUpper.includes('CASHIER') || roleUpper.includes('NHÂN VIÊN') || roleUpper.includes('STAFF') || roleUpper.includes('BARBER'));
                      if (isStf) {
                        return `
                          <button class="dropdown-item-btn" style="margin: 2px 0;" onclick="CustomerWeb.openStaffShiftModal(); CustomerWeb.closeUserMenu();">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span>Lịch làm hôm nay &amp; đăng ký ca</span>
                          </button>
                        `;
                      }
                      return '';
                    })()}

                    <!-- Trang ca nhan -->
                    <button class="dropdown-item-btn" onclick="CustomerWeb.closeUserMenu(); if(window.AppRouter) window.AppRouter.navigate('/profile'); else CustomerWeb.switchTab('profile');">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      <span>Trang cá nhân</span>
                    </button>

                    <!-- Tra cuu lich hen -->
                    <button onclick="CustomerWeb.openLookupModal(); CustomerWeb.closeUserMenu();" class="dropdown-item-btn">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      <span>Tra cứu lịch hẹn</span>
                    </button>

                    <div style="height: 1px; background: var(--border-color); margin: 4px 0;"></div>

                    <!-- Nut Dang Xuat -->
                    <button class="dropdown-logout-btn" onclick="window.AuthEngine ? window.AuthEngine.logout() : (window.store && window.store.logout()); CustomerWeb._lookupLastQuery = ''; CustomerWeb.currentTab = 'home'; CustomerWeb.renderHeader(); if(window.AppRouter) window.AppRouter.navigate('/'); else CustomerWeb.switchTab('home'); if(window.UICommon) window.UICommon.showToast('Đã đăng xuất tài khoản!'); CustomerWeb.closeUserMenu();">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              ` : `
                <!-- Nut Dang Nhap truc tiep sang trong khi chua dang nhap -->
                <div class="header-auth-action flex-shrink-0">
                  <button type="button" class="header-auth-cta-btn" onclick="UICommon.openAuthModal('login')" title="Đăng nhập hoặc đăng ký tài khoản Omni Salon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Đăng nhập</span>
                  </button>
                </div>
              `}
            </div>
          </div>
        </header>
      `;

      if (typeof this._initHeaderListeners === 'function') {
        this._initHeaderListeners();
      } else if (window.CustomerWeb && typeof window.CustomerWeb._initHeaderListeners === 'function') {
        window.CustomerWeb._initHeaderListeners();
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerHeader = CustomerHeader;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerHeader);
  }

})(typeof window !== 'undefined' ? window : this);

