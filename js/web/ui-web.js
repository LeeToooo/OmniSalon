// =========================================================================
// OmniSalon / 4RAU Barbershop — WEB PORTAL UI MODULE
// (Header, Live Search, 14 Sections Trang Chủ, Inline AI Studio,
//  Tra Cứu Lịch Hẹn, FAQ Accordion & Trung Tâm Quản Trị Salon Đẳng Cấp)
// =========================================================================

const UIWeb = {
  currentTab: 'home', // 'home' | 'admin'
  adminSubTab: 'overview', // 'overview' | 'bookings' | 'stylists' | 'catalog' | 'inventory' | 'pos' | 'audit'
  selectedCategory: 'all', // 'all' | 'haircut' | 'perm' | 'color' | 'shave' | 'combo'
  adminFilterBranch: 'all',
  adminFilterStatus: 'all',
  adminSearchQuery: '',
  catalogTabType: 'services', // 'services' | 'combos' | 'products'
  catalogSearchQuery: '',
  posState: {
    branchId: 'br-dbp',
    stylistId: '',
    customerName: 'Khách Cắt Quầy',
    customerPhone: '0908123456',
    searchQuery: '',
    activeCategory: 'all',
    billServices: [],
    billProducts: [],
    voucherCode: '',
    discountAmount: 0,
    paymentMethod: 'VietQR'
  },
  openFaqIndex: 0,

  init() {
    this.renderHeader();
    this.renderMainContent();
    this.initGlobalListeners();
  },

  initGlobalListeners() {
    // Đóng Live Search Dropdown khi click ra ngoài
    document.addEventListener('click', (e) => {
      const searchWrap = document.querySelector('.web-search-box-wrap');
      const dropdown = document.getElementById('webSearchDropdown');
      if (dropdown && searchWrap && !searchWrap.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

    // Lắng nghe Store thay đổi để tự động re-render khi Admin cập nhật dữ liệu
    if (window.store && typeof window.store.subscribe === 'function') {
      window.store.subscribe(() => {
        if (this.currentTab === 'admin') {
          const container = document.getElementById('webMainContainer');
          if (container) this.renderAdminView(container);
        }
        this.renderHeader();
      });
    }
  },

  // -----------------------------------------------------------------------
  // 1. THANH HEADER ĐẲNG CẤP VỚI LIVE SEARCH & TRA CỨU
  // -----------------------------------------------------------------------
  renderHeader() {
    if (window.CustomerWeb && typeof window.CustomerWeb.renderHeader === 'function') {
      window.CustomerWeb.renderHeader();
      return;
    }
    const headerEl = document.getElementById('webHeaderContainer');
    if (!headerEl) return;

    const branches = window.store.getBranches();
    const currentBranch = window.store.getCurrentBranch();
    const user = window.store.getCurrentUser();
    const cart = window.store.getCart();
    const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

    headerEl.innerHTML = `
      <header class="web-main-header">
        <div class="web-header-inner">
          <!-- CỤM 1 (TRÁI): Brand Logo Omni Salon + Slogan -->
          <div class="brand-logo-wrap flex-shrink-0" onclick="UIWeb.switchTab('home')" style="cursor: pointer;" title="Về trang chủ Omni Salon">
            <span class="logo-text-omni" style="font-size: 22px; font-weight: 900; letter-spacing: -0.02em; color: #FFFFFF;">Omni Salon</span>
            <span class="logo-sub-text" style="font-size: 9px; font-weight: 700; letter-spacing: 0.15em; color: var(--color-accent-gold, #F59E0B); text-transform: uppercase;">HAIR CARE &amp; GROOMING</span>
          </div>

          <!-- CỤM 2 (GIỮA): Navigation Links chính -->
          <nav class="web-nav-links">
            <a href="/" class="nav-link ${this.currentTab === 'home' ? 'active' : ''}" onclick="event.preventDefault(); UIWeb.switchTab('home')">TRANG CHỦ</a>
            <a href="/services" class="nav-link ${this.currentTab === 'services' ? 'active' : ''}" onclick="event.preventDefault(); UIWeb.switchTab('services')">DỊCH VỤ</a>
            <a href="/stylists" class="nav-link ${this.currentTab === 'stylists' ? 'active' : ''}" onclick="event.preventDefault(); UIWeb.switchTab('stylists')">STYLISTS</a>
            <a href="/booking" class="nav-link ${this.currentTab === 'booking' ? 'active' : ''} text-highlight" onclick="event.preventDefault(); UIWeb.switchTab('booking')">📅 ĐẶT LỊCH</a>
            <a href="/shop" class="nav-link ${this.currentTab === 'shop' ? 'active' : ''}" onclick="event.preventDefault(); UIWeb.switchTab('shop')">SẢN PHẨM</a>
            <a href="/branches" data-route="/branches" class="nav-link ${this.currentTab === 'branches' ? 'active' : ''}" onclick="event.preventDefault(); if (window.AppRouter) { window.AppRouter.navigate('/branches'); } else { UIWeb.switchTab('home'); const el = document.getElementById('branchesSection'); if(el) el.scrollIntoView({behavior:'smooth'}); }">CHI NHÁNH</a>
            <a href="/ai-studio" data-route="/ai-studio" class="nav-link nav-link-optional text-highlight" onclick="event.preventDefault(); if (window.AppRouter) { window.AppRouter.navigate('/ai-studio'); } else { UIWeb.switchTab('home'); const el = document.getElementById('aiStudioSection'); if(el) el.scrollIntoView({behavior:'smooth'}); }">⚡ AI ĐỔI KIỂU TÓC</a>
          </nav>

          <!-- CỤM 3 (PHẢI): Search w-48, Cart, Theme Toggle, User Dropdown (Gom Chi nhánh, Tra cứu & Quản lý) -->
          <div class="web-header-actions">
            <!-- Ô Live Search thu nhỏ gọn gàng w-48 -->
            <div class="web-search-box-wrap flex-shrink-0">
              <svg class="web-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="webLiveSearchInput" class="web-search-input" 
                     placeholder="Tìm kiếm..." 
                     autocomplete="off"
                     oninput="UIWeb.handleLiveSearch(this.value)" 
                     onfocus="UIWeb.handleLiveSearch(this.value)">
              <div class="search-results-dropdown" id="webSearchDropdown"></div>
            </div>

            <!-- Cart Button -->
            <button class="header-action-btn cart-btn-wrap flex-shrink-0" onclick="UICommon.openCartDrawer()" title="Xem giỏ hàng">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
              <span class="cart-badge-count" style="${cartCount > 0 ? '' : 'display:none;'}">${cartCount}</span>
            </button>

            <!-- Theme Toggle Switch (Dark / Light) -->
            <button type="button" class="theme-toggle-btn flex-shrink-0" onclick="window.ThemeEngine && window.ThemeEngine.toggleTheme()" title="Chuyển chế độ Sáng / Tối">
              <span class="theme-icon icon-moon">🌙</span>
              <span class="theme-icon icon-sun">☀️</span>
            </button>

            <!-- User Menu Dropdown (Gom Chi nhánh, Tra cứu & Quản lý vào menu Avatar) -->
            <div class="header-user-menu-wrapper flex-shrink-0">
              <div class="header-user-btn" id="headerUserBtn" onclick="this.parentElement.querySelector('.header-user-dropdown').classList.toggle('open')" title="Mở menu thành viên &amp; tiện ích">
                <span class="user-avatar-text">${user ? SalonUtils.getInitials(user.fullName || user.name || user.username) : '👤'}</span>
                <div class="user-info-text-wrap">
                  <span class="user-name-text">${user ? (user.fullName || user.name || user.username || 'Tài Khoản').split(' ').slice(-1)[0] : 'Đăng Nhập'}</span>
                </div>
                <span class="user-dropdown-arrow">▾</span>
              </div>

              <!-- Dropdown Content Menu -->
              <div class="header-user-dropdown h-auto w-80 p-5 rounded-2xl bg-[#11141D] border border-amber-500/20 shadow-2xl flex flex-col gap-3.5 z-50" id="headerUserDropdown" style="width: 320px; height: auto; padding: 20px; background: #11141D !important; border: 1px solid rgba(245, 158, 11, 0.2) !important; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8) !important; display: none; flex-direction: column; gap: 14px; box-sizing: border-box;">
                ${user ? `
                  <div class="dropdown-user-header" style="display: flex; align-items: center; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span class="user-avatar-text" style="width: 36px; height: 36px; font-size: 13px;">${SalonUtils.getInitials(user.fullName || user.name || user.username)}</span>
                    <div class="dropdown-user-details" style="display: flex; flex-direction: column; overflow: hidden;">
                      <span class="dropdown-user-name" style="font-size: 13px; font-weight: 800; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.fullName || user.name || user.username}</span>
                      <span class="dropdown-user-phone" style="font-size: 11px; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.phone || user.email || 'Thành viên Omni VIP'}</span>
                    </div>
                  </div>
                ` : ''}

                <!-- 1. Tra cứu lịch hẹn -->
                <button 
                  onclick="UIWeb.openLookupModal(); this.closest('.header-user-dropdown').classList.remove('open');"
                  class="header-lookup-btn dropdown-item-btn w-full h-11 px-4 rounded-xl bg-[#181D2A] hover:bg-[#202738] border border-white/10 text-white font-medium text-sm flex items-center gap-2.5 transition-all"
                  style="width: 100% !important; height: 44px !important; min-height: 44px !important; padding: 0 16px !important; border-radius: 12px !important; background: #181D2A !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #FFFFFF !important; font-weight: 500 !important; font-size: 14px !important; display: flex !important; align-items: center !important; gap: 10px !important; cursor: pointer !important; box-sizing: border-box !important;"
                >
                  <span class="text-base" style="font-size: 16px;">🔍</span>
                  <span>Tra Cứu Lịch Hẹn</span>
                </button>

                <!-- 2. Chọn chi nhánh (Tự co giãn chiều cao, không cắt cụt chữ) -->
                <div class="header-branch-pill dropdown-branch-pill w-full flex flex-col gap-1.5 p-3 rounded-xl bg-[#181D2A] border border-white/10" style="width: 100% !important; height: auto !important; min-height: unset !important; display: flex !important; flex-direction: column !important; gap: 6px !important; padding: 12px !important; border-radius: 12px !important; background: #181D2A !important; border: 1px solid rgba(255,255,255,0.1) !important; box-sizing: border-box !important;">
                  <div class="flex items-center gap-1.5 text-xs font-semibold text-amber-400" style="display: flex !important; align-items: center !important; gap: 6px !important; font-size: 12px !important; font-weight: 600 !important; color: #F59E0B !important;">
                    <span>📍</span>
                    <span>Chi nhánh:</span>
                  </div>
                  <select class="header-branch-select w-full bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer py-2 leading-normal" 
                          style="width: 100% !important; max-width: 100% !important; background: #181D2A !important; color: #FFFFFF !important; font-size: 12px !important; font-weight: 500 !important; border: none !important; outline: none !important; cursor: pointer !important; padding: 6px 0 !important; line-height: 1.5 !important;"
                          onchange="window.store && window.store.setSelectedBranch(this.value)">
                    ${branches.map(b => `<option value="${b.id}" class="bg-[#181D2A] text-white" style="background:#181D2A; color:#FFFFFF;" ${b.id === currentBranch?.id ? 'selected' : ''}>${b.name.trim()}</option>`).join('')}
                  </select>
                </div>

                <!-- 3. Nút Quản Trị Salon (Nổi bật, nền vàng Champagne rực rỡ) -->
                <button 
                  onclick="this.closest('.header-user-dropdown').classList.remove('open'); UIWeb.switchTab('${this.currentTab === 'admin' ? 'home' : 'admin'}');"
                  class="header-admin-pill-btn w-full h-11 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all ${this.currentTab === 'admin' ? 'active' : ''}"
                  style="width: 100% !important; height: 44px !important; min-height: 44px !important; padding: 0 16px !important; border-radius: 12px !important; background: linear-gradient(to right, #F59E0B, #FBBF24, #D97706) !important; color: #000000 !important; font-weight: 700 !important; font-size: 14px !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; border: none !important; cursor: pointer !important; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.25) !important; box-sizing: border-box !important;"
                >
                  <span>⚡</span>
                  <span>Trung Tâm Quản Trị Salon</span>
                </button>

                <!-- 4. Nút Đăng Nhập / Đăng Ký (Nền tối viền vàng, chữ trắng sáng 100%, không để nền trắng chữ trắng) -->
                ${user ? `
                  <button class="dropdown-item-btn danger-btn w-full h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all" 
                          style="width: 100% !important; height: 40px !important; min-height: 40px !important; padding: 0 16px !important; border-radius: 12px !important; background: rgba(239, 68, 68, 0.1) !important; border: 1px solid rgba(239, 68, 68, 0.3) !important; color: #F87171 !important; font-weight: 600 !important; font-size: 13px !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; cursor: pointer !important; box-sizing: border-box !important;"
                          onclick="window.AuthEngine ? window.AuthEngine.logout() : window.Auth.logout(); UIWeb.renderHeader(); this.closest('.header-user-dropdown').classList.remove('open');">
                    <span>🚪</span>
                    <span>Đăng Xuất</span>
                  </button>
                ` : `
                  <button 
                    onclick="UICommon.openAuthModal(); this.closest('.header-user-dropdown').classList.remove('open');"
                    class="w-full h-11 min-h-[44px] px-4 rounded-xl bg-[#1E2435] hover:bg-[#262E44] border border-amber-500/40 hover:border-amber-400 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                    style="width: 100% !important; height: 44px !important; min-height: 44px !important; padding: 0 16px !important; border-radius: 12px !important; background: #1E2435 !important; border: 1px solid rgba(245, 158, 11, 0.4) !important; color: #FFFFFF !important; font-weight: 600 !important; font-size: 14px !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; cursor: pointer !important; box-sizing: border-box !important;"
                  >
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
  },

  // -----------------------------------------------------------------------
  // 2. TÌM KIẾM THỜI GIAN THỰC (LIVE SEARCH DROPDOWN)
  // -----------------------------------------------------------------------
  handleLiveSearch(query) {
    if (window.CustomerWeb && typeof window.CustomerWeb.handleLiveSearch === 'function') {
      window.CustomerWeb.handleLiveSearch(query);
      return;
    }
    const dropdown = document.getElementById('webSearchDropdown');
    if (!dropdown) return;

    if (!query || query.trim().length < 1) {
      dropdown.classList.remove('active');
      dropdown.innerHTML = '';
      return;
    }

    const results = window.store.searchServicesAndProducts(query);
    const hasServices = results.services && results.services.length > 0;
    const hasProducts = results.products && results.products.length > 0;

    if (!hasServices && !hasProducts) {
      dropdown.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #888; font-size: 13px;">
          Không tìm thấy dịch vụ hoặc sản phẩm khớp với "<strong>${query}</strong>"
        </div>
      `;
      dropdown.classList.add('active');
      return;
    }

    let html = '';

    if (hasServices) {
      html += `<div class="search-result-group-title">✂️ Dịch Vụ Cắt & Tạo Mẫu</div>`;
      results.services.forEach(s => {
        html += `
          <div class="search-result-item" onclick="UIWeb.selectSearchResultService('${s.id}')">
            <img src="${s.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=120&q=80'}" class="search-item-thumb" alt="${s.name}">
            <div style="flex: 1; min-width: 0;">
              <div class="search-item-name">${s.name}</div>
              <div class="search-item-meta">${SalonUtils.formatCurrency(s.price)} • ${s.duration || 45} phút</div>
            </div>
            <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;">Đặt Lịch</button>
          </div>
        `;
      });
    }

    if (hasProducts) {
      html += `<div class="search-result-group-title">💈 Sáp & Sản Phẩm Chăm Sóc</div>`;
      results.products.forEach(p => {
        html += `
          <div class="search-result-item" onclick="UIWeb.selectSearchResultProduct('${p.id}')">
            <img src="${p.image}" class="search-item-thumb" alt="${p.name}">
            <div style="flex: 1; min-width: 0;">
              <div class="search-item-name">${p.name}</div>
              <div class="search-item-meta">${SalonUtils.formatCurrency(p.price)} • ${p.brand}</div>
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
    UICommon.openBookingModal(serviceId);
  },

  selectSearchResultProduct(productId) {
    const dropdown = document.getElementById('webSearchDropdown');
    if (dropdown) dropdown.classList.remove('active');
    UICommon.openProductDetailModal(productId);
  },

  // -----------------------------------------------------------------------
  // 3. TRA CỨU LỊCH HẸN BẰNG SĐT / MÃ LỊCH
  // -----------------------------------------------------------------------
  openLookupModal(prefill) {
    if (window.CustomerWeb && typeof window.CustomerWeb.openLookupModal === 'function') {
      window.CustomerWeb.openLookupModal(prefill);
      return;
    }
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="booking-wizard-wrapper" style="max-width: 580px;">
        <div class="booking-header">
          <div class="badge-terracotta">HỆ THỐNG TRA CỨU OMNI SALON</div>
          <h2 class="booking-title" style="font-size: 22px;">TRA CỨU LỊCH HẸN TẠO MẪU TÓC</h2>
          <p class="booking-subtitle">Nhập Số Điện Thoại hoặc Mã Lịch (#BK-...) để kiểm tra tình trạng lịch hẹn</p>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <input type="text" id="lookupSearchInput" class="form-control-custom" 
                 placeholder="Nhập SĐT (VD: 0908123456) hoặc Mã (#BK-...)" 
                 style="font-size: 14px;"
                 onkeydown="if(event.key === 'Enter') UIWeb.searchBookingLookup()">
          <button class="btn-submit-terracotta" style="white-space: nowrap; padding: 10px 20px;" onclick="UIWeb.searchBookingLookup()">
            Tìm Lịch Hẹn
          </button>
        </div>

        <div id="lookupResultsContainer">
          <div style="padding: 24px; text-align: center; color: #888; font-size: 13px; background: #fafafa; border-radius: 10px; border: 1px dashed #e0e0e0;">
            Nhập thông tin bên trên để tra cứu thời gian, chi nhánh và thợ cắt của bạn.
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  searchBookingLookup() {
    const input = document.getElementById('lookupSearchInput');
    const container = document.getElementById('lookupResultsContainer');
    if (!input || !container) return;

    const query = input.value.trim();
    if (!query) {
      UICommon.showToast('⚠️ Vui lòng nhập số điện thoại hoặc mã lịch hẹn!', 'warning');
      return;
    }

    const matches = window.store.getBookingByPhoneOrId(query);

    if (matches.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: #b91c1c; font-size: 13px; background: #fef2f2; border-radius: 10px; border: 1px solid #fee2e2;">
          Không tìm thấy lịch hẹn nào khớp với "<strong>${query}</strong>". Quý khách vui lòng kiểm tra lại số điện thoại hoặc đặt lịch mới.
          <div style="margin-top: 14px;">
            <button class="btn-submit-terracotta" style="padding: 8px 18px; font-size: 12px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
              + Đặt Lịch Hẹn Mới Ngay
            </button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="font-size: 12px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 10px;">
        Tìm thấy ${matches.length} lịch hẹn:
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
        ${matches.map(b => {
          const statusInfo = SalonUtils.formatBookingStatus(b.status);
          return `
            <div class="lookup-card-result">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 14px; font-weight: 900; color: #111;">#${b.id}</span>
                <span class="status-pill-pulse ${statusInfo.cssClass}">
                  <span class="pulse-dot"></span> ${statusInfo.label}
                </span>
              </div>
              <div style="font-size: 13px; line-height: 1.6; color: #444;">
                <div><strong>Dịch vụ:</strong> ${b.serviceName}</div>
                <div><strong>Chi nhánh:</strong> ${b.branchName}</div>
                <div><strong>Master Stylist:</strong> ${b.stylistName}</div>
                <div><strong>Giờ hẹn:</strong> <span style="color: #c85a44; font-weight: 800;">${b.timeSlot} — ${SalonUtils.formatDate(b.date)}</span></div>
                <div><strong>Khách hàng:</strong> ${b.customerName} (${b.customerPhone})</div>
                <div><strong>Chi phí:</strong> <strong>${SalonUtils.formatCurrency(b.totalPrice)}</strong></div>
              </div>
              <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end;">
                ${b.status !== 'cancelled' ? `
                  <button class="pill-btn-outline" style="font-size: 11px; padding: 6px 12px; color: #b91c1c; border-color: #fca5a5;" 
                          onclick="UIWeb.cancelBookingByCustomer('${b.id}')">
                    Hủy Lịch Hẹn
                  </button>
                ` : ''}
                <button class="btn-submit-terracotta" style="font-size: 11px; padding: 6px 14px;" 
                        onclick="UICommon.showToast('📍 Hướng dẫn chỉ đường: Gọi Hotline 1900 4407 để được đón tiếp!');">
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
    if (confirm(`Bạn có chắc chắn muốn hủy lịch hẹn #${bookingId} không?`)) {
      window.store.updateBookingStatus(bookingId, 'cancelled');
      UICommon.showToast(`Đã hủy lịch hẹn #${bookingId}!`);
      this.searchBookingLookup();
    }
  },

  // -----------------------------------------------------------------------
  // 4. MAIN CUSTOMER PORTAL (TRANG CHỦ BẢN WEB ĐẦY ĐỦ)
  // -----------------------------------------------------------------------
  renderMainContent() {
    const container = document.getElementById('webMainContainer');
    if (!container) return;

    if (this.currentTab === 'admin') {
      this.renderAdminView(container);
      return;
    }

    if (window.CustomerWeb && typeof window.CustomerWeb.renderMainContent === 'function') {
      window.CustomerWeb.renderMainContent();
      return;
    }

    const newProducts = window.store.getProducts('new');
    const bestProducts = window.store.getProducts('best');
    const news = window.store.getNewsArticles();
    const moments = window.store.getMoments();
    const brandCollabs = window.store.getBrandCollabs();
    const branches = window.store.getBranches();
    const cutclubBranches = branches.filter(b => b.group === 'OMNI SALON CUTCLUB' || b.group === '4RAU BARBER CUTCLUB' || b.group === 'OMNI SALON SUITE');
    const chairmanBranches = branches.filter(b => b.group === 'TIỆM TÓC CỦA CHỦ TỊCH' || b.group === 'OMNI SALON FLAGSHIP');
    const hairstyles = window.store.getHairstyles();

    const featureArticle = news.find(n => n.isFeature) || news[0];
    const sideArticles = news.filter(n => !n.isFeature && n.id.startsWith('news-side'));
    const gridArticles = news.filter(n => n.id.startsWith('news-grid'));

    container.innerHTML = `
      <!-- =======================================================
           1. HERO BANNER HIỆN ĐẠI CÙNG FLOATING BADGES
           ======================================================= -->
      <section class="web-hero-section" id="heroSection">
        <div class="hero-bg-overlay"></div>
        <div class="hero-content-center">
          <span class="hero-brand-tag">SINCE 2015 — THE AUTHENTIC VIETNAMESE BARBERSHOP</span>
          <h1 class="hero-big-title">VĂN HÓA TÓC NAM &amp; PHONG CÁCH ĐƯỜNG PHỐ</h1>
          <p class="hero-description">Trải nghiệm dịch vụ cắt tóc tỉ mỉ, cạo khăn nóng cổ điển và công nghệ mô phỏng AI Restyle Vision 2026 dẫn đầu xu hướng.</p>
          <div class="hero-cta-group">
            <button class="btn-hero-terracotta" onclick="UICommon.openBookingModal()">✂️ ĐẶT LỊCH NGAY</button>
            <button class="btn-hero-brown" onclick="document.getElementById('serviceSection').scrollIntoView({behavior:'smooth'})">📋 XEM BẢNG GIÁ</button>
            <button class="btn-hero-glass" onclick="UIWeb.openLookupModal()">🔍 TRA CỨU LỊCH</button>
          </div>

          <!-- Hero Floating Feature Badges -->
          <div class="hero-floating-badges">
            <div class="hero-badge-pill">
              <span class="hero-badge-dot"></span> 18+ Chi Nhánh Toàn Quốc
            </div>
            <div class="hero-badge-pill">
              <span class="hero-badge-dot"></span> 100% Đặt Lịch Chuẩn Giờ
            </div>
            <div class="hero-badge-pill">
              <span class="hero-badge-dot"></span> ⚡ AI Restyle Vision 2026
            </div>
            <div class="hero-badge-pill">
              <span class="hero-badge-dot"></span> ⭐ 4.92 / 5.0 Độ Hài Lòng
            </div>
          </div>
        </div>
      </section>

      <!-- =======================================================
           2. BẠN ĐẾN NHÀ (KHOẢNH KHẮC THƯỜNG NHẬT 4RAU)
           ======================================================= -->
      <section class="section-container" style="padding-top: 40px; padding-bottom: 20px;">
        <h2 class="section-title-clean">BẠN ĐẾN NHÀ</h2>
        <div class="moments-horizontal-scroll">
          ${moments.map(m => `
            <div class="moment-card" title="${m.caption}">
              <img src="${m.image}" alt="${m.caption}" class="moment-img" loading="lazy">
            </div>
          `).join('')}
        </div>
      </section>

      <!-- =======================================================
           3. BẢNG DỊCH VỤ ĐẶC TRƯNG VỚI BỘ LỌC CATEGORY TABS
           ======================================================= -->
      <section class="section-container" id="serviceSection" style="padding-top: 50px;">
        <h2 class="section-title-clean">DỊCH VỤ & COMBO ĐẶC TRƯNG</h2>
        <p class="section-subtitle-clean">Lựa chọn dịch vụ chuẩn mực từ Master Stylist hàng đầu Việt Nam.</p>

        <!-- Category Filter Chips -->
        <div class="services-category-bar">
          <button class="service-cat-pill ${this.selectedCategory === 'all' ? 'active' : ''}" onclick="UIWeb.filterServices('all')">Tất Cả Dịch Vụ</button>
          <button class="service-cat-pill ${this.selectedCategory === 'haircut' ? 'active' : ''}" onclick="UIWeb.filterServices('haircut')">✂️ Cắt Tạo Phom Fade</button>
          <button class="service-cat-pill ${this.selectedCategory === 'perm' ? 'active' : ''}" onclick="UIWeb.filterServices('perm')">🌀 Uốn Con Sâu / Texture</button>
          <button class="service-cat-pill ${this.selectedCategory === 'color' ? 'active' : ''}" onclick="UIWeb.filterServices('color')">🎨 Nhuộm & Tẩy Màu Khói</button>
          <button class="service-cat-pill ${this.selectedCategory === 'shave' ? 'active' : ''}" onclick="UIWeb.filterServices('shave')">🪒 Cạo Khăn Nóng Proraso</button>
          <button class="service-cat-pill ${this.selectedCategory === 'combo' ? 'active' : ''}" onclick="UIWeb.filterServices('combo')">👑 Combo VIP Toàn Diện</button>
        </div>

        <div class="services-cards-grid" id="servicesGridContainer">
          ${this.renderServicesCards()}
        </div>
      </section>

      <!-- =======================================================
           4. SẢN PHẨM MỚI (NEW ARRIVALS)
           ======================================================= -->
      <section class="section-container" id="newProductsSection" style="padding-top: 50px;">
        <h2 class="section-title-clean">SẢN PHẨM MỚI</h2>
        <p class="section-subtitle-clean">Những mẫu sáp vuốt và phụ kiện mới nhất vừa cập bến — cập nhật liên tục.</p>
        <div class="products-grid-5">
          ${newProducts.map(p => UICommon.renderProductCard(p)).join('')}
        </div>
      </section>

      <!-- =======================================================
           5. SẢN PHẨM BÁN CHẠY (BEST SELLERS)
           ======================================================= -->
      <section class="section-container" id="bestSellerSection" style="padding-top: 50px;">
        <h2 class="section-title-clean">SẢN PHẨM BÁN CHẠY</h2>
        <p class="section-subtitle-clean">Chúng tôi mang đến sự lựa chọn tốt nhất cho bạn với phong cách riêng biệt.</p>
        <div class="products-grid-5">
          ${bestProducts.map(p => UICommon.renderProductCard(p)).join('')}
        </div>
      </section>

      <!-- =======================================================
           6. TIN TÓC UNDERGROUND (ERLING HAALAND & VĂN HÓA ĐƯỜNG PHỐ)
           ======================================================= -->
      <section class="section-container" id="undergroundSection" style="padding-top: 60px;">
        <h2 class="section-title-clean">TIN TÓC UNDERGROUND</h2>
        <p class="section-subtitle-clean" style="max-width: 720px; margin: 0 auto 30px;">
          Cập nhật liên tục những xu hướng tóc, thời trang và lifestyle mới nhất từ giới trẻ đường phố. Theo dõi để không bỏ lỡ bất kỳ chuyển động nào trong văn hóa urban và underground.
        </p>

        <!-- Khối trên: Bài lớn bên trái + 3 bài bên phải -->
        <div class="underground-top-layout">
          <div class="underground-left-col">
            ${UICommon.renderFeatureArticle(featureArticle)}
          </div>
          <div class="underground-right-col">
            ${sideArticles.map(a => UICommon.renderSideArticle(a)).join('')}
          </div>
        </div>

        <!-- Khối dưới: 4 bài dạng lưới -->
        <div class="underground-bottom-grid">
          ${gridArticles.map(a => UICommon.renderGridArticle(a)).join('')}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <button class="btn-black-solid" onclick="UICommon.showToast('📰 Bạn đang xem những tin tức mới nhất từ Omni Salon!')">XEM THÊM BÀI VIẾT</button>
        </div>
      </section>

      <!-- =======================================================
           7. HỆ THỐNG CHI NHÁNH 4RAU TRÊN TOÀN QUỐC
           ======================================================= -->
      <section class="section-container" id="branchesSection" style="padding-top: 60px;">
        <div class="branches-split-layout">
          <!-- Cột Trái -->
          <div class="branches-left-info">
            <h2 class="branches-main-title">Khám phá hệ thống chi nhánh Omni Salon trên toàn quốc.</h2>
            <p class="branches-sub-text">
              Dễ dàng tìm kiếm và trải nghiệm dịch vụ chất lượng gần nơi bạn nhất.<br>
              <strong>Hotline: 1900 8899</strong>
            </p>
            <button class="btn-black-solid" style="margin-top: 20px;" onclick="UICommon.openBookingModal()">ĐẶT LỊCH NGAY</button>
          </div>

          <!-- Cột Phải -->
          <div class="branches-right-pills">
            <!-- Nhóm CutClub / Suite chi nhánh -->
            <div class="branch-group-header">
              <span class="group-title">OMNI SALON SUITE</span>
              <span class="group-count">15 chi nhánh</span>
            </div>
            <div class="branch-pills-grid">
              ${cutclubBranches.map(b => UICommon.renderBranchPill(b)).join('')}
            </div>

            <!-- Nhóm Tiệm Tóc Của Chủ Tịch 3 chi nhánh -->
            <div class="branch-group-header" style="margin-top: 28px;">
              <span class="group-title">TIỆM TÓC CỦA CHỦ TỊCH</span>
              <span class="group-count">3 chi nhánh</span>
            </div>
            <div class="branch-pills-grid">
              ${chairmanBranches.map(b => UICommon.renderBranchPill(b)).join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- =======================================================
           8. 4RAU AI BARBER STUDIO — ĐỔI KIỂU TÓC BẰNG ẢNH THẬT
           ======================================================= -->
      <section class="section-container" id="aiStudioSection" style="padding-top: 60px;">
        <div class="web-ai-studio-wrapper">
          <div class="web-ai-studio-header">
            <div class="badge-terracotta pulse-animation">CÔNG NGHỆ ĐỘT PHÁ 2026 • AI RESTYLE VISION</div>
            <h2 class="section-title-clean" style="margin-top: 8px; font-size: 28px; font-weight: 900; letter-spacing: 0.01em;">
              OMNI AI HAIR STUDIO — THAY ĐỔI KIỂU TÓC BẰNG ẢNH THẬT
            </h2>
            <p class="section-subtitle-clean" style="max-width: 720px; margin: 0 auto 24px;">
              Chụp hoặc tải ảnh khuôn mặt của bạn lên để công nghệ AI tự động nhận diện dáng mặt, biến đổi kiểu tóc & màu nhuộm xu hướng, và gửi lại bức ảnh mới sắc nét nhất cho bạn.
            </p>
          </div>
          <div id="webAiStudioContainer">
            ${this.renderAiStudioContent()}
          </div>
        </div>
      </section>

      <!-- =======================================================
           9. TÁC PHẨM TRONG THÁNG (HAIRSTYLES SHOWCASE)
           ======================================================= -->
      <section class="section-container" style="padding-top: 50px;">
        <h2 class="section-title-clean">TÁC PHẨM TRONG THÁNG</h2>
        <p class="section-subtitle-clean">
          Tuyển tập những kiểu tóc nam nổi bật và sáng tạo nhất trong tuần do Master Stylist tạo mẫu.
        </p>
        <div class="hairstyles-showcase-grid">
          ${hairstyles.map(h => `
            <div class="hairstyle-card">
              <img src="${h.image}" alt="${h.title}" class="hs-img" loading="lazy">
              <div class="hs-info">
                <h4 class="hs-title">${h.title}</h4>
                <p class="hs-desc">${h.description}</p>
                <div style="display:flex; gap:8px; margin-top:12px;">
                  <button class="pill-btn-outline" style="flex:1; font-size:12px;" onclick="UIWeb.selectAiStyle('${h.styleCategory}'); document.getElementById('aiStudioSection').scrollIntoView({behavior:'smooth'});">Thử AI Kiểu Này</button>
                  <button class="btn-submit-terracotta" style="padding:6px 14px; font-size:12px;" onclick="UICommon.openBookingModal('${h.serviceSuggestionId}')">Đặt Lịch</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- =======================================================
           10. OUR SERVICE (TICKER RUNNING PILLS)
           ======================================================= -->
      <section class="section-container" style="padding-top: 50px;">
        <h2 class="section-title-clean">OUR SERVICE</h2>
        ${UICommon.renderServicesTickerHTML()}
      </section>

      <!-- =======================================================
           11. VIDEO NGẮN HAY NHẤT (SHORTS / REELS)
           ======================================================= -->
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

      <!-- =======================================================
           12. CÁC HỢP TÁC THƯƠNG HIỆU (BRAND COLLABS)
           ======================================================= -->
      <section class="section-container" style="padding-top: 50px;">
        <h2 class="section-title-clean">CÁC HỢP TÁC THƯƠNG HIỆU</h2>
        <div class="collab-boxes-grid">
          ${brandCollabs.map(c => UICommon.renderBrandCollabCard(c)).join('')}
        </div>
      </section>

      <!-- =======================================================
           13. CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION)
           ======================================================= -->
      <section class="section-container" style="padding-top: 60px; padding-bottom: 20px;">
        <h2 class="section-title-clean">CÂU HỎI THƯỜNG GẶP</h2>
        <p class="section-subtitle-clean">Giải đáp những thắc mắc phổ biến của quý khách khi trải nghiệm tại Omni Salon Suite.</p>
        
        <div class="faq-accordion-list">
          <div class="faq-accordion-item ${this.openFaqIndex === 0 ? 'open' : ''}">
            <button class="faq-header-btn" onclick="UIWeb.toggleFaq(0)">
              <span>1. Tôi có cần phải đặt lịch hẹn trước khi đến tiệm không?</span>
              <span class="faq-icon-caret">▼</span>
            </button>
            <div class="faq-body-content">
              Omni Salon khuyến khích quý khách nên đặt lịch trước qua website hoặc App Mobile để được giữ ghế ưu tiên với đúng Master Stylist yêu thích, đảm bảo phục vụ đúng giờ và không phải chờ đợi vào các khung giờ cao điểm hoặc cuối tuần. Tuy nhiên, nếu bạn ghé trực tiếp (Walk-in), tiệm vẫn luôn bố trí thợ sẵn sàng đón tiếp.
            </div>
          </div>

          <div class="faq-accordion-item ${this.openFaqIndex === 1 ? 'open' : ''}">
            <button class="faq-header-btn" onclick="UIWeb.toggleFaq(1)">
              <span>2. Công nghệ Omni AI Hair Studio đổi kiểu tóc hoạt động ra sao?</span>
              <span class="faq-icon-caret">▼</span>
            </button>
            <div class="faq-body-content">
              Studio AI sử dụng mô hình thị giác máy tính nhận diện cấu trúc hộp sọ, đường viền hàm và ngũ quan của khuôn mặt bạn. Sau đó, AI sẽ dựng kiểu tóc mới (Side Part, Mullet, Uốn con sâu...) và hòa sắc màu nhuộm thời thượng lên ảnh thật của bạn với độ chân thực cao nhất, giúp bạn xem trước phom tóc phù hợp trước khi quyết định cắt.
            </div>
          </div>

          <div class="faq-accordion-item ${this.openFaqIndex === 2 ? 'open' : ''}">
            <button class="faq-header-btn" onclick="UIWeb.toggleFaq(2)">
              <span>3. Dịch vụ uốn tóc con sâu (Premlock) và nhuộm giữ phom được bao lâu?</span>
              <span class="faq-icon-caret">▼</span>
            </button>
            <div class="faq-body-content">
              Dịch vụ uốn tóc tại Omni Salon sử dụng thuốc uốn hữu cơ cao cấp nhập khẩu, giúp phom lọn sóng giữ ổn định từ 3 đến 5 tháng tùy thuộc vào tốc độ mọc dài của tóc. Với màu nhuộm, quý khách sẽ được tặng kèm bí quyết sấy tạo kiểu và gợi ý dòng dầu gội giữ màu chuyên dụng như Brosh Japan.
            </div>
          </div>

          <div class="faq-accordion-item ${this.openFaqIndex === 3 ? 'open' : ''}">
            <button class="faq-header-btn" onclick="UIWeb.toggleFaq(3)">
              <span>4. Tôi có thể tra cứu hoặc thay đổi giờ lịch hẹn đã đặt bằng cách nào?</span>
              <span class="faq-icon-caret">▼</span>
            </button>
            <div class="faq-body-content">
              Rất đơn giản, bạn chỉ cần bấm nút <strong>"Tra Cứu Lịch"</strong> trên thanh menu trên cùng, nhập Số điện thoại hoặc Mã lịch (#BK-...) để xem chi tiết ca hẹn, số ghế và thợ cắt. Bạn cũng có thể hủy hoặc dời lịch trực tiếp hoặc liên hệ tổng đài <strong>1900 8899</strong> để được hỗ trợ tức thì.
            </div>
          </div>

          <div class="faq-accordion-item ${this.openFaqIndex === 4 ? 'open' : ''}">
            <button class="faq-header-btn" onclick="UIWeb.toggleFaq(4)">
              <span>5. Chính sách bảo hành và cam kết chất lượng của Omni Salon như thế nào?</span>
              <span class="faq-icon-caret">▼</span>
            </button>
            <div class="faq-body-content">
              Tất cả các dịch vụ cắt, uốn, nhuộm tại toàn bộ 18+ chi nhánh Omni Salon đều được bảo hành chỉnh sửa miễn phí trong vòng 7 ngày nếu quý khách chưa thực sự ưng ý với phom tóc hoặc nếp uốn. Sự hài lòng và vẻ ngoài tự tin của bạn là tiêu chí hàng đầu của chúng tôi.
            </div>
          </div>
        </div>
      </section>

      <!-- =======================================================
           14. FOOTER ĐẦY ĐỦ THÔNG TIN DOANH NGHIỆP
           ======================================================= -->
      <footer class="web-footer">
        <div class="footer-inner">
          <!-- Col 1: Logo -->
          <div class="footer-col-brand">
            <div class="footer-logo-4rau" style="font-size: 26px; font-weight: 900; color: #FFFFFF;">OMNI SALON</div>
            <div style="font-size: 13px; color: #aaa; margin-top: 8px;">Kiến trúc tóc đương đại & Trải nghiệm 5 sao</div>
          </div>

          <!-- Col 2: Thông tin doanh nghiệp -->
          <div class="footer-col-info">
            <h4 class="footer-col-title">THÔNG TIN DOANH NGHIỆP</h4>
            <ul class="footer-info-list">
              <li><strong>CÔNG TY TNHH OMNI SALON SUITE</strong></li>
              <li>MST: 0315048848</li>
              <li>Địa chỉ: 634 Điện Biên Phủ, Phường 11, Quận 10 / Giáp Quận 1, TP. Hồ Chí Minh</li>
              <li>Hotline: <strong style="color: #c85a44;">1900 8899</strong></li>
              <li>Email: executive@omnisalon.vn</li>
              <li>Website: omnisalon.vn</li>
            </ul>
          </div>

          <!-- Col 3: Chính sách -->
          <div class="footer-col-policy">
            <h4 class="footer-col-title">CHÍNH SÁCH HỆ THỐNG</h4>
            <ul class="footer-policy-list">
              <li>› Về chúng tôi</li>
              <li>› Hướng dẫn đặt lịch trực tuyến</li>
              <li>› Điều kiện giao dịch chung</li>
              <li>› Chính sách bảo mật thông tin khách hàng</li>
              <li>› Cam kết bảo hành 7 ngày & Chất lượng tạo mẫu</li>
              <li>› Chính sách thanh toán VietQR</li>
              <li>› Chính sách đổi trả và hoàn tiền sản phẩm</li>
              <li>› Liên hệ & Cơ hội nghề nghiệp Master Stylist</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom-bar">
          © 2026 Omni Salon Suite. All rights reserved.
        </div>
      </footer>
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
      grid.innerHTML = this.renderServicesCards();
    }
  },

  renderServicesCards() {
    const services = window.store.getServices();
    const combos = window.store.getCombos();
    const all = [
      ...services.map(s => ({ ...s, isCombo: false })),
      ...combos.map(c => ({ ...c, isCombo: true, category: 'combo' }))
    ];

    const filtered = all.filter(s => {
      if (this.selectedCategory === 'all') return true;
      if (this.selectedCategory === 'combo') return s.isCombo;
      if (this.selectedCategory === 'haircut') return s.category === 'haircut' || s.name.toLowerCase().includes('cắt');
      if (this.selectedCategory === 'perm') return s.category === 'perm' || s.name.toLowerCase().includes('uốn') || s.name.toLowerCase().includes('ép');
      if (this.selectedCategory === 'color') return s.category === 'color' || s.name.toLowerCase().includes('nhuộm') || s.name.toLowerCase().includes('tẩy');
      if (this.selectedCategory === 'shave') return s.category === 'treatment' || s.name.toLowerCase().includes('cạo') || s.name.toLowerCase().includes('gội');
      return true;
    });

    const fallbackImg = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';

    return filtered.map(s => {
      const coverImg = s.image || fallbackImg;
      return `
      <div class="service-card-item card-3d-tilt" id="serviceCard_${s.id}">
        <div class="service-card-cover-wrap">
          <img src="${coverImg}" alt="${s.name}" class="service-card-cover" loading="lazy" onerror="this.onerror=null; this.src='${fallbackImg}';">
          <span class="service-card-duration-badge">⏱️ ${s.duration || 45} phút</span>
        </div>
        <div class="service-card-body">
          <div style="font-size: 11px; font-weight: 800; color: #F59E0B; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em;">
            ${s.isCombo ? '👑 COMBO TRỌN GÓI VIP' : '✂️ MASTER STYLIST'}
          </div>
          <h4 class="service-card-title">${s.name}</h4>
          <p class="service-card-desc">${s.description || ''}</p>
          <div class="service-card-footer">
            <span class="service-card-price">${SalonUtils.formatCurrency(s.price)}</span>
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

  switchTab(tab) {
    if (tab === 'admin') {
      const user = window.store.getCurrentUser();
      const staffRoles = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER'];
      let isStaff = false;

      if (window.AuthEngine && typeof window.AuthEngine.hasRole === 'function') {
        isStaff = window.AuthEngine.hasRole(staffRoles);
      } else if (user) {
        isStaff = staffRoles.includes(user.role);
      }

      if (!isStaff) {
        if (!user) {
          UICommon.showToast('Vui lòng đăng nhập với tài khoản Quản trị viên hoặc Nhân viên!', 'warning');
          UICommon.openAuthModal('login');
        } else {
          UICommon.showToast('⛔ [403 Forbidden] Tài khoản Khách hàng không có quyền truy cập Trung tâm Quản trị!', 'error');
        }
        return;
      }
    }

    this.currentTab = tab;
    this.renderHeader();
    this.renderMainContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openProfileMenu() {
    if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
      window.CustomerWeb.openCustomerPortalModal();
      return;
    }
    const user = window.store.getCurrentUser();
    if (!user) {
      UICommon.openAuthModal('login');
      return;
    }
    this.openCustomerPortalModal();
  },

  openCustomerPortalModal() {
    if (window.CustomerWeb && typeof window.CustomerWeb.openCustomerPortalModal === 'function') {
      window.CustomerWeb.openCustomerPortalModal();
      return;
    }
    const user = window.store.getCurrentUser();
    if (!user) return;

    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    const userBookings = window.store.getBookings().filter(b => 
      (b.customerPhone && user.phone && b.customerPhone === user.phone) ||
      (b.customerId && b.customerId === user.id) ||
      (b.userId && b.userId === user.id)
    );

    const userOrders = window.store.getOrders().filter(o => 
      (o.customerPhone && user.phone && o.customerPhone === user.phone) ||
      (o.userId && o.userId === user.id)
    );

    const points = user.rewardPoints || (userBookings.length * 50 + 100);
    const tierName = points >= 300 ? 'OMNI KIM CƯƠNG VIP' : points >= 150 ? 'OMNI VÀNG VIP' : 'OMNI THÀNH VIÊN BẠC';

    modalBody.innerHTML = `
      <div class="customer-portal-shell" style="max-width: 650px; margin: 0 auto;">
        <!-- Profile Header -->
        <div class="portal-profile-hero">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; gap: 14px; align-items: center;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: #c85a44; color: #fff; font-size: 20px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.4);">
                ${SalonUtils.getInitials(user.fullName || user.name || user.username)}
              </div>
              <div>
                <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 2px;">${user.fullName || user.name || user.username}</h3>
                <div style="font-size: 12px; color: #cbd5e1;">${user.phone || '0908123456'} • ${user.email || 'member@omnisalon.vn'}</div>
              </div>
            </div>
            <div class="portal-tier-pill">
              ★ ${tierName}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.15); text-align: center;">
            <div>
              <div style="font-size: 11px; color: #94a3b8;">Điểm Thưởng Tích Lũy</div>
              <div style="font-size: 18px; font-weight: 900; color: #f59e0b;">${points} pts</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #94a3b8;">Lịch Cắt Đã Phục Vụ</div>
              <div style="font-size: 18px; font-weight: 900; color: #fff;">${userBookings.length} Lần</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #94a3b8;">Đơn Hàng Mỹ Phẩm</div>
              <div style="font-size: 18px; font-weight: 900; color: #fff;">${userOrders.length} Đơn</div>
            </div>
          </div>
        </div>

        <!-- Section 1: Lịch hẹn cá nhân -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="font-size: 14px; font-weight: 800; color: #111;">📅 Lịch Hẹn Cắt Tóc Gần Đây (${userBookings.length})</h4>
            <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="UICommon.closeGlobalModal(); UICommon.openBookingModal();">
              + Đặt Lịch Mới
            </button>
          </div>
          ${userBookings.length > 0 ? `
            <div style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
              ${userBookings.map(b => {
                const statusInfo = SalonUtils.formatBookingStatus(b.status);
                return `
                  <div class="portal-card-history">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <strong style="color: #111; font-size: 13px;">#${b.id || b.bookingCode}</strong> — ${b.serviceName}
                        <div style="font-size: 11px; color: #666; margin-top: 2px;">
                          ${b.branchName.split('—')[0]} • Thợ: ${b.stylistName} • <strong>${b.timeSlot} (${SalonUtils.formatDate(b.date)})</strong>
                        </div>
                      </div>
                      <span class="status-pill-pulse ${statusInfo.cssClass}" style="font-size: 10px;">
                        <span class="pulse-dot"></span> ${statusInfo.label}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div style="padding: 16px; background: #f8fafc; border-radius: 8px; text-align: center; color: #64748b; font-size: 12px; border: 1px dashed #cbd5e1;">
              Bạn chưa có lịch hẹn cắt tóc nào. Hãy đặt lịch ngay để trải nghiệm phục vụ VIP!
            </div>
          `}
        </div>

        <!-- Section 2: Đơn hàng mỹ phẩm -->
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 14px; font-weight: 800; color: #111; margin-bottom: 10px;">🛍️ Lịch Sử Đơn Hàng Sáp & Mỹ Phẩm (${userOrders.length})</h4>
          ${userOrders.length > 0 ? `
            <div style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
              ${userOrders.map(o => `
                <div class="portal-card-history">
                  <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <div>
                      <strong style="font-size: 13px; color: #111;">#${o.id}</strong>
                      <span style="font-size: 11px; color: #666; margin-left: 6px;">(${o.items ? o.items.length : 1} món hàng)</span>
                      <div style="font-size: 11px; color: #888; margin-top: 2px;">
                        ${o.deliveryType === 'PICKUP_BRANCH' ? '🏢 Lấy tại chi nhánh' : '🚚 Giao tận nhà'} • ${o.paymentMethod || 'VietQR'}
                      </div>
                    </div>
                    <strong style="color: #c85a44; font-size: 13px;">${SalonUtils.formatCurrency(o.totalAmount)}</strong>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="padding: 16px; background: #f8fafc; border-radius: 8px; text-align: center; color: #64748b; font-size: 12px; border: 1px dashed #cbd5e1;">
              Chưa có đơn hàng nào. Hãy khám phá các dòng sáp Brosh Nhật Bản chính hãng tại Shop!
            </div>
          `}
        </div>

        <!-- Action Footer -->
        <div style="display: flex; gap: 10px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          <button type="button" class="btn-cancel" style="flex: 1;" onclick="UICommon.closeGlobalModal()">Đóng Cửa Sổ</button>
          <button type="button" class="pill-btn-outline" style="color: #b91c1c; border-color: #fca5a5;" onclick="UIWeb.handleLogout()">
            🚪 Đăng Xuất Tài Khoản
          </button>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  handleLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      if (window.AuthEngine && typeof window.AuthEngine.logout === 'function') {
        window.AuthEngine.logout();
      } else {
        window.store.logout();
      }
      UICommon.closeGlobalModal();
      UICommon.showToast('Đã đăng xuất tài khoản an toàn!');
      this.currentTab = 'home';
      this.renderHeader();
      this.renderMainContent();
    }
  },

  // -----------------------------------------------------------------------
  // 5. AI BARBER STUDIO INLINE LOGIC
  // -----------------------------------------------------------------------
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

  renderAiStudioContent() {
    const { originalImage, resultImage, selectedStyle, selectedColorName, selectedColorHex, isProcessing, showApiSettings } = this.aiState;
    const aiConfig = SalonApi ? SalonApi.getAiConfig() : { provider: 'demo_smart', apiKey: '', endpoint: '' };

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
          ${
            !originalImage
              ? `
              <div class="ai-upload-dropzone" id="webAiDropZone" onclick="document.getElementById('webAiPhotoFileInput').click()">
                <input type="file" id="webAiPhotoFileInput" accept="image/*" style="display:none;" onchange="UIWeb.handleAiUpload(event)">
                <input type="file" id="webAiCameraInput" accept="image/*" capture="user" style="display:none;" onchange="UIWeb.handleAiUpload(event)">
                
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
                         class="sample-avatar-thumb" title="Mẫu Nam 1" onclick="UIWeb.loadSampleAi(this.src)">
                    <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80" 
                         class="sample-avatar-thumb" title="Mẫu Nam 2" onclick="UIWeb.loadSampleAi(this.src)">
                    <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80" 
                         class="sample-avatar-thumb" title="Mẫu Nam 3" onclick="UIWeb.loadSampleAi(this.src)">
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
                  <div class="ai-status-step-text" id="webAiStatusStep">Đang phân tích cấu trúc khuôn mặt & góc cạnh hộp sọ...</div>
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
                  <span>👈 Kéo thanh tròn sang trái/phải để so sánh Trước & Sau 👉</span>
                </div>

                <div class="ai-result-actions-strip">
                  <button class="btn-sub-action" onclick="UIWeb.downloadAiResult()" title="Tải ảnh về máy">
                    📥 Tải Ảnh HD Về Máy
                  </button>
                  <button class="btn-sub-action" onclick="UIWeb.resetAi()">
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
                  <button class="btn-change-photo-mini" onclick="UIWeb.resetAi()">Đổi ảnh</button>
                </div>
                <div style="font-size: 13px; color: #888; text-align: center; margin-top: 12px;">
                  Đã nhận diện khuôn mặt. Hãy chọn kiểu tóc & màu nhuộm bên phải và nhấn <strong>Biến Đổi</strong>!
                </div>
              </div>
              `
          }
        </div>

        <!-- CỘT PHẢI: BẢNG ĐIỀU KHIỂN CHỌN KIỂU TÓC, MÀU & API -->
        <div class="ai-controls-column">
          <!-- 1. CHỌN MẪU TÓC NAM -->
          <div class="control-group">
            <label class="control-section-label">
              <span>1. CHỌN KIỂU TÓC XU HƯỚNG</span>
              <span class="badge-selected-tag">${selectedStyle}</span>
            </label>
            <div class="style-cards-grid">
              ${stylePresets.map(s => `
                <button class="style-pill-card ${selectedStyle === s.name ? 'active' : ''}" 
                        onclick="UIWeb.selectAiStyle('${s.name}')">
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
              <span style="font-size: 12px; font-weight: 700; color: #c85a44;">${selectedColorName}</span>
            </label>
            <div class="color-swatches-grid">
              ${colorPresets.map(c => `
                <button class="color-swatch-item ${selectedColorName === c.name ? 'active' : ''}" 
                        onclick="UIWeb.selectAiColor('${c.name}', '${c.hex}')" 
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
                   value="${this.aiState.customPrompt || ''}"
                   onchange="UIWeb.aiState.customPrompt = this.value">
          </div>

          <!-- 4. NÚT MỞ CÀI ĐẶT API -->
          <div class="ai-api-toggle-row">
            <button class="btn-text-toggle" onclick="UIWeb.toggleAiApiSettings()">
              ⚙️ Cài đặt API Key & Endpoint (${aiConfig.provider})
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
                <input type="password" id="webAiApiKeyInput" class="api-input-control" placeholder="hf_xxxx... hoặc r8_xxxx..." value="${aiConfig.apiKey || ''}">
              </div>
              <div class="api-form-row">
                <label>API Endpoint (URL):</label>
                <input type="text" id="webAiEndpointInput" class="api-input-control" placeholder="https://api-inference.huggingface.co/..." value="${aiConfig.endpoint || ''}">
              </div>
              <button class="btn-submit-terracotta" style="width: 100%; padding: 8px; margin-top: 8px; font-size: 12px;" onclick="UIWeb.saveAiApiSettings()">
                💾 Lưu Cấu Hình API
              </button>
            </div>
          ` : ''}

          <!-- 5. CÁC NÚT HÀNH ĐỘNG CHÍNH -->
          <div class="ai-action-buttons-wrap">
            ${!resultImage ? `
              <button class="btn-execute-ai" onclick="UIWeb.processAiRestyle()" ${!originalImage || isProcessing ? 'disabled style="opacity: 0.6;"' : ''}>
                ⚡ BẮT ĐẦU ĐỔI KIỂU TÓC BẰNG AI →
              </button>
            ` : `
              <button class="btn-submit-terracotta btn-book-now-ai" onclick="UIWeb.bookAiHairstyle()">
                📅 ĐẶT LỊCH CẮT KIỂU TÓC NÀY NGAY →
              </button>
              <button class="btn-execute-ai" style="margin-top: 8px; background: #222;" onclick="UIWeb.processAiRestyle()">
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
    UICommon.showToast(`💇 Bản Web: Đã chọn kiểu tóc ${styleName}`);
  },

  selectAiColor(colorName, colorHex) {
    this.aiState.selectedColorName = colorName;
    this.aiState.selectedColorHex = colorHex;
    this.updateAiStudio();
    UICommon.showToast(`🎨 Bản Web: Đã chọn màu ${colorName}`);
  },

  handleAiUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.aiState.originalImage = e.target.result;
      this.aiState.resultImage = null;
      this.updateAiStudio();
      UICommon.showToast('✅ Đã tải ảnh khuôn mặt lên Studio Web!');
    };
    reader.readAsDataURL(file);
  },

  loadSampleAi(imageUrl) {
    this.aiState.originalImage = imageUrl;
    this.aiState.resultImage = null;
    this.updateAiStudio();
    UICommon.showToast('✅ Đã chọn ảnh mẫu. Bấm "Bắt Đầu Đổi Kiểu Tóc"!');
  },

  toggleAiApiSettings() {
    this.aiState.showApiSettings = !this.aiState.showApiSettings;
    this.updateAiStudio();
  },

  saveAiApiSettings() {
    const provider = document.getElementById('webAiProviderSelect')?.value;
    const apiKey = document.getElementById('webAiApiKeyInput')?.value;
    const endpoint = document.getElementById('webAiEndpointInput')?.value;
    if (SalonApi) {
      SalonApi.saveAiConfig(provider, apiKey, endpoint);
      UICommon.showToast('💾 Đã lưu cấu hình API thành công!');
      this.aiState.showApiSettings = false;
      this.updateAiStudio();
    }
  },

  async processAiRestyle() {
    if (!this.aiState.originalImage) {
      UICommon.showToast('⚠️ Vui lòng tải hoặc chọn ảnh chân dung trước.', 'warning');
      return;
    }
    this.aiState.isProcessing = true;
    this.updateAiStudio();

    const stepEl = document.getElementById('webAiStatusStep');
    setTimeout(() => { if (stepEl) stepEl.textContent = `Đang cắt phom tóc ${this.aiState.selectedStyle}...`; }, 400);
    setTimeout(() => { if (stepEl) stepEl.textContent = `Đang hòa sắc màu nhuộm ${this.aiState.selectedColorName}...`; }, 900);

    try {
      const response = await SalonApi.restyleHairPhoto({
        originalImageBase64: this.aiState.originalImage,
        hairstyleName: this.aiState.selectedStyle,
        hairColorName: this.aiState.selectedColorName,
        hairColorHex: this.aiState.selectedColorHex,
        customPrompt: this.aiState.customPrompt
      });

      this.aiState.isProcessing = false;
      if (response && response.resultImageUrl) {
        this.aiState.resultImage = response.resultImageUrl;
        this.updateAiStudio();
        UICommon.showToast(`🎉 Đổi kiểu tóc AI thành công (${response.providerUsed})!`);
      }
    } catch (err) {
      this.aiState.isProcessing = false;
      this.updateAiStudio();
      UICommon.showToast(`❌ Lỗi AI: ${err.message}`, 'error');
    }
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
    a.download = `Omni-Web-AI-${this.aiState.selectedStyle.replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    UICommon.showToast('📥 Đã tải ảnh kiểu tóc HD về máy tính!');
  },

  resetAi() {
    this.aiState.originalImage = null;
    this.aiState.resultImage = null;
    this.updateAiStudio();
  },

  bookAiHairstyle() {
    UICommon.openBookingModal();
    UICommon.showToast(`💇 Đã đưa kiểu tóc "${this.aiState.selectedStyle}" vào lịch hẹn!`);
  },

  // -----------------------------------------------------------------------
  // 6. TRUNG TÂM QUẢN TRỊ SALON SIÊU ĐẲNG CẤP (ENTERPRISE ADMIN HUB)
  // -----------------------------------------------------------------------
  renderAdminView(container) {
    if (window.AdminWeb && typeof window.AdminWeb.render === 'function') {
      window.AdminWeb.render(container);
      return;
    }
    const bookings = window.store.getBookings();
    const products = window.store.getProducts();
    const branches = window.store.getBranches();
    const stylists = window.store.getStylists();
    const auditLogs = window.store.getAuditLogs();
    const inventory = window.store.getInventory();
    const analytics = window.store.getRevenueAnalytics();
    const services = window.store.getServices();
    const combos = window.store.getCombos();

    container.innerHTML = `
      <div class="admin-full-wrapper">
        <!-- Top Enterprise Header -->
        <div class="admin-hub-header">
          <div>
            <div class="badge-terracotta" style="background: rgba(212,175,55,0.15); color: #D4AF37; border: 1px solid rgba(212,175,55,0.3);">
              HỆ THỐNG ĐIỀU HÀNH OMNI SALON ENTERPRISE • NORDIC LUXURY
            </div>
            <h2 class="admin-hub-title" style="margin-top: 6px; color: #FFFFFF !important; font-weight: 900; letter-spacing: -0.02em; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
              TRUNG TÂM QUẢN TRỊ & ĐIỀU HÀNH CHUỖI SALON
            </h2>
            <div style="font-size: 13px; color: #aaa; margin-top: 4px; display: flex; align-items: center; gap: 8px;">
              <span class="status-pill-pulse status-completed" style="padding: 2px 8px; font-size: 10px;">
                <span class="pulse-dot"></span> Trực Tuyến
              </span>
              <span>18 Chi nhánh toàn quốc • Đồng bộ dữ liệu Real-time POS</span>
            </div>
          </div>
          <div style="display:flex; gap: 10px; align-items: center;">
            <button class="pill-btn-outline" style="color: #fff; border-color: rgba(255,255,255,0.3);" 
                    onclick="if(confirm('Khôi phục toàn bộ dữ liệu mẫu demo?')) { window.store.resetToDefault(); UICommon.showToast('🔄 Đã khôi phục dữ liệu gốc!'); UIWeb.renderMainContent(); }">
              🔄 Khôi Phục Dữ Liệu
            </button>
            <button class="btn-submit-terracotta" onclick="UIWeb.switchTab('home')">
              ← Giao Diện Khách Hàng
            </button>
          </div>
        </div>

        <!-- Admin Sub Navigation Tabs Bar -->
        <div class="admin-subnav-bar">
          <button class="admin-tab-btn ${this.adminSubTab === 'overview' ? 'active' : ''}" onclick="UIWeb.switchAdminSubTab('overview')">
            📊 Tổng Quan & Phân Tích
          </button>
          <button class="admin-tab-btn ${this.adminSubTab === 'bookings' ? 'active' : ''}" onclick="UIWeb.switchAdminSubTab('bookings')">
            📅 Quản Lý Lịch Hẹn (${bookings.length})
          </button>
          <button class="admin-tab-btn ${this.adminSubTab === 'stylists' ? 'active' : ''}" onclick="UIWeb.switchAdminSubTab('stylists')">
            💈 Đội Ngũ Barber (${stylists.length})
          </button>
          <button class="admin-tab-btn ${this.adminSubTab === 'catalog' ? 'active' : ''}" onclick="UIWeb.switchAdminSubTab('catalog')">
            ✂️ Menu & Gói Combo (${services.length + combos.length})
          </button>
          <button class="admin-tab-btn ${this.adminSubTab === 'inventory' ? 'active' : ''}" onclick="UIWeb.switchAdminSubTab('inventory')">
            📦 Kho Hàng (${inventory.length})
          </button>
          <button class="admin-tab-btn ${this.adminSubTab === 'pos' ? 'active' : ''}" onclick="UIWeb.switchAdminSubTab('pos')">
            💳 Quầy Thu Ngân POS
          </button>
          <button class="admin-tab-btn ${this.adminSubTab === 'audit' ? 'active' : ''}" onclick="UIWeb.switchAdminSubTab('audit')">
            📜 Nhật Ký Hoạt Động (${auditLogs.length})
          </button>
        </div>

        <!-- Nội dung Sub-tab tương ứng -->
        <div id="adminSubTabContent">
          ${this.renderAdminSubTabContent(analytics, bookings, products, branches, stylists, inventory, auditLogs, services, combos)}
        </div>
      </div>
    `;
  },

  switchAdminSubTab(tabName) {
    this.adminSubTab = tabName;
    const container = document.getElementById('webMainContainer');
    if (container) this.renderAdminView(container);
  },

  renderAdminSubTabContent(analytics, bookings, products, branches, stylists, inventory, auditLogs, services, combos) {
    switch (this.adminSubTab) {
      case 'overview':
        return this.renderAdminOverviewTab(analytics, bookings, branches, stylists, products);
      case 'bookings':
        return this.renderAdminBookingsTab(bookings, branches);
      case 'stylists':
        return this.renderAdminStylistsTab(stylists, branches);
      case 'catalog':
        return this.renderAdminCatalogTab(services || window.store.getServices(), combos || window.store.getCombos(), products || window.store.getProducts());
      case 'inventory':
        return this.renderAdminInventoryTab(inventory);
      case 'pos':
        return this.renderAdminPosTab(services || window.store.getServices(), combos || window.store.getCombos(), products || window.store.getProducts(), branches, stylists);
      case 'audit':
        return this.renderAdminAuditTab(auditLogs);
      default:
        return this.renderAdminOverviewTab(analytics, bookings, branches, stylists, products);
    }
  },

  // --- SUB-TAB 1: TỔNG QUAN & DOANH THU & BIỂU ĐỒ SVG ---
  renderAdminOverviewTab(analytics, bookings, branches, stylists, products) {
    const weeklyData = (analytics && analytics.weeklyData) || [
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
    const chartWidth = 560;
    const barWidth = 42;
    const spacing = 38;

    const svgBars = weeklyData.map((d, i) => {
      const barH = Math.max(16, (d.revenue / maxRev) * chartHeight);
      const x = 35 + i * (barWidth + spacing);
      const y = chartHeight - barH + 20;
      const formattedRev = (d.revenue / 1000000).toFixed(1) + 'Tr';

      return `
        <g class="chart-bar-group" style="cursor: pointer;">
          <title>${d.day}: ${SalonUtils.formatCurrency(d.revenue)} (${d.bookingsCount} lượt cắt)</title>
          <!-- Cột doanh thu -->
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="url(#barGradient)" opacity="0.95">
            <animate attributeName="height" from="0" to="${barH}" dur="0.6s" fill="freeze" />
            <animate attributeName="y" from="${chartHeight + 20}" to="${y}" dur="0.6s" fill="freeze" />
          </rect>
          <!-- Số tiền trên đỉnh cột -->
          <text x="${x + barWidth / 2}" y="${y - 8}" font-size="11" font-weight="800" fill="#c85a44" text-anchor="middle">
            ${formattedRev}
          </text>
          <!-- Tên thứ dưới đáy cột -->
          <text x="${x + barWidth / 2}" y="${chartHeight + 38}" font-size="11" font-weight="700" fill="#555" text-anchor="middle">
            ${d.day.replace('Thứ ', 'T')}
          </text>
        </g>
      `;
    }).join('');

    return `
      <!-- 4 High-Contrast KPI Cards -->
      <div class="admin-kpi-grid">
        <div class="admin-kpi-card-rich">
          <div class="kpi-top-row">
            <span class="kpi-label-text">Tổng Doanh Thu Tuần</span>
            <span class="kpi-growth-tag kpi-growth-positive">↗ +18.4%</span>
          </div>
          <div class="kpi-big-value">${SalonUtils.formatCurrency(analytics.totalRevenue)}</div>
          <div class="kpi-sub-detail">
            <span>Đã thu ngân trực tiếp & VietQR</span>
          </div>
        </div>

        <div class="admin-kpi-card-rich">
          <div class="kpi-top-row">
            <span class="kpi-label-text">Tổng Lịch Hẹn</span>
            <span class="kpi-growth-tag kpi-growth-positive">↗ Lấp đầy ${analytics.occupancyRate}</span>
          </div>
          <div class="kpi-big-value">${bookings.length} Ca Hẹn</div>
          <div class="kpi-sub-detail">
            <span>${analytics.confirmedCount} Đã chốt • ${analytics.cancelledCount} Đã hủy</span>
          </div>
        </div>

        <div class="admin-kpi-card-rich">
          <div class="kpi-top-row">
            <span class="kpi-label-text">Quy Mô Chuỗi Salon</span>
            <span class="kpi-growth-tag kpi-growth-positive">18 Cơ Sở</span>
          </div>
          <div class="kpi-big-value">${branches.length} Chi Nhánh</div>
          <div class="kpi-sub-detail">
            <span>15 CutClub + 3 Tiệm Chủ Tịch</span>
          </div>
        </div>

        <div class="admin-kpi-card-rich">
          <div class="kpi-top-row">
            <span class="kpi-label-text">Độ Hài Lòng Khách</span>
            <span class="kpi-growth-tag kpi-growth-positive">★ 4.92 / 5.0</span>
          </div>
          <div class="kpi-big-value">98.6%</div>
          <div class="kpi-sub-detail">
            <span>Dựa trên đánh giá sau lượt cắt</span>
          </div>
        </div>
      </div>

      <!-- Split Charts Row: SVG Doanh thu 7 ngày & Popularity Gauges -->
      <div class="admin-analytics-split">
        <!-- Cột Trái: Biểu Đồ Doanh Thu 7 Ngày SVG -->
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
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#c85a44" />
                  <stop offset="100%" stop-color="#e07a5f" stop-opacity="0.8" />
                </linearGradient>
              </defs>
              <!-- Đường gióng ngang mờ -->
              <line x1="20" y1="20" x2="580" y2="20" stroke="#f0f0f4" stroke-width="1" stroke-dasharray="3 3"/>
              <line x1="20" y1="95" x2="580" y2="95" stroke="#f0f0f4" stroke-width="1" stroke-dasharray="3 3"/>
              <line x1="20" y1="170" x2="580" y2="170" stroke="#e2e2e8" stroke-width="1.5"/>
              ${svgBars}
            </svg>
          </div>
        </div>

        <!-- Cột Phải: Tỉ Lệ Dịch Vụ Ưa Chuộng Nhất -->
        <div class="admin-chart-box">
          <div class="chart-box-header">
            <div class="chart-box-title">
              🎯 Tỉ Trọng Dịch Vụ Thịnh Hành
            </div>
            <span style="font-size: 12px; color: #888;">Theo lượt đặt</span>
          </div>

          <div class="popularity-gauge-list">
            ${((analytics && analytics.categoryBreakdown) || [
              { name: 'Cắt Tóc Chuẩn Barbershop', pct: 45, count: 18, color: '#c85a44' },
              { name: 'Uốn Textured / Con Sâu', pct: 25, count: 10, color: '#2563eb' },
              { name: 'Nhuộm Màu Thời Trang', pct: 15, count: 6, color: '#7c3aed' },
              { name: 'Gội Dưỡng & Cạo Khăn Nóng', pct: 15, count: 6, color: '#059669' }
            ]).map(item => `
              <div class="popularity-gauge-item">
                <div class="gauge-meta-row">
                  <span>${item.name}</span>
                  <span style="color: ${item.color}; font-weight: 800;">${item.pct}% (${item.count} lượt)</span>
                </div>
                <div class="gauge-bar-track">
                  <div class="gauge-bar-fill" style="width: ${item.pct}%; background: ${item.color};"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Quick Action Cards Strip -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        <div style="background: #fff; border: 1px solid #e2e2e6; border-radius: 12px; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #111;">📅 Thêm Lịch Hẹn Khách Vãng Lai</div>
            <div style="font-size: 12px; color: #777; margin-top: 2px;">Nhập lịch trực tiếp cho khách walk-in</div>
          </div>
          <button class="btn-submit-terracotta" style="padding: 8px 16px; font-size: 12px;" onclick="UICommon.openBookingModal()">
            + Đặt Ngay
          </button>
        </div>

        <div style="background: #fff; border: 1px solid #e2e2e6; border-radius: 12px; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #111;">📦 Kiểm Kê Kho Hàng Retail</div>
            <div style="font-size: 12px; color: #777; margin-top: 2px;">Có ${products.filter(p => p.stock <= 5).length || 2} sản phẩm sắp hết hàng</div>
          </div>
          <button class="pill-btn-outline" style="padding: 8px 16px; font-size: 12px;" onclick="UIWeb.switchAdminSubTab('inventory')">
            Kiểm Kho
          </button>
        </div>

        <div style="background: #fff; border: 1px solid #e2e2e6; border-radius: 12px; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #111;">💈 Quản Lý Ca Trực Barber</div>
            <div style="font-size: 12px; color: #777; margin-top: 2px;">${stylists.length} thợ cắt đang sẵn sàng</div>
          </div>
          <button class="pill-btn-outline" style="padding: 8px 16px; font-size: 12px;" onclick="UIWeb.switchAdminSubTab('stylists')">
            Xem Thợ
          </button>
        </div>
      </div>
    `;
  },

  // --- SUB-TAB 2: QUẢN LÝ LỊCH HẸN & BẢNG DỮ LIỆU ĐỔI TRẠNG THÁI ---
  renderAdminBookingsTab(bookings, branches) {
    // Filter bookings
    let filtered = [...bookings];

    if (this.adminFilterBranch !== 'all') {
      filtered = filtered.filter(b => b.branchId === this.adminFilterBranch);
    }
    if (this.adminFilterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === this.adminFilterStatus);
    }
    if (this.adminSearchQuery) {
      const q = this.adminSearchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        (b.customerPhone && b.customerPhone.includes(q))
      );
    }

    return `
      <div class="admin-table-container">
        <!-- Toolbar Bộ Lọc & Tìm Kiếm -->
        <div class="admin-table-toolbar">
          <div class="table-filter-group">
            <input type="text" class="table-search-input" 
                   placeholder="Tìm theo Mã, Tên, SĐT..." 
                   value="${this.adminSearchQuery}"
                   oninput="UIWeb.adminSearchQuery = this.value; UIWeb.refreshAdminBookingsContent();">
            
            <select class="table-select-filter" onchange="UIWeb.adminFilterBranch = this.value; UIWeb.refreshAdminBookingsContent();">
              <option value="all">Tất cả chi nhánh</option>
              ${branches.map(b => `<option value="${b.id}" ${this.adminFilterBranch === b.id ? 'selected' : ''}>${b.name.split('—')[0]}</option>`).join('')}
            </select>

            <select class="table-select-filter" onchange="UIWeb.adminFilterStatus = this.value; UIWeb.refreshAdminBookingsContent();">
              <option value="all" ${this.adminFilterStatus === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
              <option value="confirmed" ${this.adminFilterStatus === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
              <option value="in_progress" ${this.adminFilterStatus === 'in_progress' ? 'selected' : ''}>Đang phục vụ</option>
              <option value="completed" ${this.adminFilterStatus === 'completed' ? 'selected' : ''}>Đã hoàn thành</option>
              <option value="cancelled" ${this.adminFilterStatus === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
            </select>
          </div>

          <div style="display:flex; gap: 8px;">
            <button class="btn-submit-terracotta" style="padding: 6px 16px; font-size: 12px;" onclick="UICommon.openBookingModal()">
              + Thêm Lịch Hẹn Mới
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
                <th>Dịch Vụ</th>
                <th>Chi Nhánh</th>
                <th>Barber</th>
                <th>Giờ Hẹn</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái Hiện Tại</th>
                <th>Cập Nhật Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody id="adminBookingsTbody">
              ${filtered.length > 0 ? filtered.map(b => {
                const statusInfo = SalonUtils.formatBookingStatus(b.status);
                return `
                  <tr>
                    <td><strong>#${b.id}</strong></td>
                    <td style="font-weight: 700;">${b.customerName}</td>
                    <td>${b.customerPhone}</td>
                    <td>${b.serviceName}</td>
                    <td>${b.branchName.split('—')[0]}</td>
                    <td><strong>${b.stylistName}</strong></td>
                    <td>${b.timeSlot} <span style="font-size: 11px; color: #888;">(${SalonUtils.formatDate(b.date)})</span></td>
                    <td style="font-weight: 800; color: #c85a44;">${SalonUtils.formatCurrency(b.totalPrice)}</td>
                    <td>
                      <span class="status-pill-pulse ${statusInfo.cssClass}">
                        <span class="pulse-dot"></span> ${statusInfo.label}
                      </span>
                    </td>
                    <td>
                      <select class="table-select-filter" style="padding: 4px 8px; font-size: 11px;" 
                              onchange="UIWeb.changeBookingStatus('${b.id}', this.value)">
                        <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
                        <option value="in_progress" ${b.status === 'in_progress' ? 'selected' : ''}>Đang phục vụ</option>
                        <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Đã hoàn thành</option>
                        <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Hủy ca hẹn</option>
                      </select>
                    </td>
                    <td>
                      <button class="pill-btn-outline" style="padding: 4px 8px; font-size: 11px; color: #b91c1c; border-color: #fca5a5;" 
                              onclick="UIWeb.removeBooking('${b.id}')" title="Xóa lịch hẹn này">
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="11" style="text-align:center; padding: 30px; color: #888;">
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

  refreshAdminBookingsContent() {
    const content = document.getElementById('adminSubTabContent');
    if (content) {
      const bookings = window.store.getBookings();
      const branches = window.store.getBranches();
      content.innerHTML = this.renderAdminBookingsTab(bookings, branches);
    }
  },

  changeBookingStatus(bookingId, newStatus) {
    window.store.updateBookingStatus(bookingId, newStatus);
    UICommon.showToast(`✅ Đã cập nhật lịch #${bookingId} sang [${newStatus}]!`);
    const subTab = document.getElementById('adminSubTabContent');
    if (subTab && this.adminSubTab === 'bookings') {
      this.refreshAdminBookingsContent();
    } else {
      const container = document.getElementById('webMainContainer');
      if (container) this.renderAdminView(container);
    }
  },

  removeBooking(bookingId) {
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn lịch hẹn #${bookingId} khỏi hệ thống?`)) {
      window.store.deleteBooking(bookingId);
      UICommon.showToast(`🗑️ Đã xóa lịch hẹn #${bookingId}!`);
      const subTab = document.getElementById('adminSubTabContent');
      if (subTab && this.adminSubTab === 'bookings') {
        this.refreshAdminBookingsContent();
      } else {
        const container = document.getElementById('webMainContainer');
        if (container) this.renderAdminView(container);
      }
    }
  },

  // --- SUB-TAB 3: ĐỘI NGŨ MASTER BARBER ---
  renderAdminStylistsTab(stylists, branches) {
    const branchMap = new Map((branches || []).map(b => [b.id, b]));
    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
        ${stylists.map(st => {
          const br = branchMap.get(st.branchId);
          return `
            <div style="background: #ffffff; border: 1px solid #e2e2e6; border-radius: 12px; overflow: hidden; padding: 18px; display: flex; gap: 14px; align-items: center; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
              <img src="${st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}" 
                   style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #c85a44;" alt="${st.name}">
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <h4 style="font-size: 15px; font-weight: 800; color: #111;">${st.name}</h4>
                  <span style="font-size: 12px; font-weight: 800; color: #f59e0b;">★ ${st.rating || '5.0'}</span>
                </div>
                <div style="font-size: 12px; color: #c85a44; font-weight: 700; margin-bottom: 2px;">${st.role}</div>
                <div style="font-size: 11px; color: #777;">Cơ sở: ${br ? br.name.split('—')[0] : 'Omni Salon Flagship'}</div>
                <div style="margin-top: 8px; display: flex; gap: 6px;">
                  <span class="status-pill-pulse status-completed" style="font-size: 10px; padding: 2px 6px;">
                    <span class="pulse-dot"></span> Sẵn Sàng Nhận Lịch
                  </span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // --- SUB-TAB 4: KHO HÀNG & POS SẢN PHẨM RETAIL ---
  renderAdminInventoryTab(inventory) {
    return `
      <div class="admin-table-container">
        <div class="admin-table-toolbar">
          <div style="font-size: 14px; font-weight: 800; color: #111;">
            📦 Danh Mục Sản Phẩm Bán Lẻ & Tồn Kho Hệ Thống (${inventory.length} mã)
          </div>
          <div>
            <button class="btn-submit-terracotta" style="padding: 6px 14px; font-size: 12px;" onclick="UICommon.showToast('ℹ️ Chức năng nhập kho từ nhà cung cấp Brosh Nhật Bản đang đồng bộ!');">
              + Nhập Thêm Hàng Mới
            </button>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table class="admin-enterprise-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Mã SP</th>
                <th>Tên Sản Phẩm</th>
                <th>Thương Hiệu</th>
                <th>Đơn Giá</th>
                <th>Số Lượng Tồn</th>
                <th>Tình Trạng Kho</th>
                <th>Điều Chỉnh Nhanh</th>
              </tr>
            </thead>
            <tbody>
              ${inventory.map(item => {
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
                      <img src="${item.image}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;" alt="${item.productName}">
                    </td>
                    <td><strong>${item.productId}</strong></td>
                    <td style="font-weight: 700;">${item.productName}</td>
                    <td>${item.brand}</td>
                    <td style="font-weight: 800; color: #c85a44;">${SalonUtils.formatCurrency(item.price)}</td>
                    <td><strong style="font-size: 14px;">${stock}</strong> hộp/cái</td>
                    <td>${badge}</td>
                    <td>
                      <div style="display: flex; gap: 4px; align-items: center;">
                        <button class="pill-btn-outline" style="padding: 2px 8px; font-size: 12px;" onclick="UIWeb.adjustStock('${item.id}', ${stock - 1})">-1</button>
                        <button class="pill-btn-outline" style="padding: 2px 8px; font-size: 12px;" onclick="UIWeb.adjustStock('${item.id}', ${stock + 5})">+5</button>
                        <button class="pill-btn-outline" style="padding: 2px 8px; font-size: 12px;" onclick="UIWeb.adjustStock('${item.id}', ${stock + 20})">+20</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  adjustStock(invId, newStock) {
    window.store.updateProductStock(invId, newStock);
    UICommon.showToast(`📦 Đã cập nhật tồn kho: ${Math.max(0, newStock)} sản phẩm!`);
    const subTab = document.getElementById('adminSubTabContent');
    if (subTab && this.adminSubTab === 'inventory') {
      subTab.innerHTML = this.renderAdminInventoryTab(window.store.getInventory());
    } else {
      const container = document.getElementById('webMainContainer');
      if (container) this.renderAdminView(container);
    }
  },

  // --- SUB-TAB 5: NHẬT KÝ KIỂM TOÁN (AUDIT LOGS) ---
  renderAdminAuditTab(auditLogs) {
    return `
      <div class="admin-table-container">
        <div class="admin-table-toolbar">
          <div style="font-size: 14px; font-weight: 800; color: #111;">
            📜 Nhật Ký Hoạt Động & Giao Dịch Toàn Hệ Thống (Audit Trail)
          </div>
          <span style="font-size: 12px; color: #888;">Lưu trữ an toàn 100 sự kiện gần nhất</span>
        </div>

        <div style="overflow-x: auto;">
          <table class="admin-enterprise-table">
            <thead>
              <tr>
                <th>Thời Gian</th>
                <th>Hành Động</th>
                <th>Người Thao Tác</th>
                <th>Đối Tượng</th>
                <th>Chi Tiết</th>
              </tr>
            </thead>
            <tbody>
              ${auditLogs.map(l => `
                <tr>
                  <td style="font-size: 12px; color: #666; white-space: nowrap;">${l.timestamp}</td>
                  <td><span class="badge-terracotta" style="font-size: 10px; padding: 2px 6px;">${l.action}</span></td>
                  <td><strong>${l.operatorName}</strong></td>
                  <td>${l.entity || '—'}</td>
                  <td style="color: #444;">${l.details}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // -----------------------------------------------------------------------
  // --- SUB-TAB 6: BẢNG GIÁ & MENU DỊCH VỤ / COMBO / SẢN PHẨM (CATALOG CRUD) ---
  // -----------------------------------------------------------------------
  renderAdminCatalogTab(services, combos, products) {
    const type = this.catalogTabType || 'services';
    const q = (this.catalogSearchQuery || '').toLowerCase();

    let items = [];
    if (type === 'services') {
      items = services.filter(s => !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    } else if (type === 'combos') {
      items = combos.filter(c => !q || c.name.toLowerCase().includes(q));
    } else {
      items = products.filter(p => !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }

    return `
      <div class="admin-table-container">
        <!-- Toolbar Phân Loại Catalog & Thêm Mới -->
        <div class="admin-table-toolbar">
          <div class="table-filter-group">
            <button type="button" class="admin-tab-btn ${type === 'services' ? 'active' : ''}" 
                    style="padding: 6px 14px; font-size: 12px;" onclick="UIWeb.switchCatalogTabType('services')">
              ✂️ Dịch Vụ Cắt Tóc (${services.length})
            </button>
            <button type="button" class="admin-tab-btn ${type === 'combos' ? 'active' : ''}" 
                    style="padding: 6px 14px; font-size: 12px;" onclick="UIWeb.switchCatalogTabType('combos')">
              🌟 Gói Combo VIP (${combos.length})
            </button>
            <button type="button" class="admin-tab-btn ${type === 'products' ? 'active' : ''}" 
                    style="padding: 6px 14px; font-size: 12px;" onclick="UIWeb.switchCatalogTabType('products')">
              💈 Sản Phẩm Retail (${products.length})
            </button>
            <input type="text" class="table-search-input" placeholder="Tìm theo tên..." 
                   value="${this.catalogSearchQuery || ''}" 
                   oninput="UIWeb.catalogSearchQuery = this.value; UIWeb.refreshCatalogView();">
          </div>

          <div>
            <button class="btn-submit-terracotta" style="padding: 7px 16px; font-size: 12px;" onclick="UIWeb.openAddCatalogModal('${type}')">
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
                         style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;" alt="${item.name}">
                  </td>
                  <td><strong>#${item.id}</strong></td>
                  <td style="font-weight: 800;">${item.name}</td>
                  <td>
                    <span class="badge-terracotta" style="font-size: 10px; padding: 2px 8px;">
                      ${item.category || item.brand || 'Dịch Vụ'}
                    </span>
                  </td>
                  <td style="font-weight: 900; color: #c85a44;">
                    ${SalonUtils.formatCurrency(item.price)}
                    ${item.oldPrice && item.oldPrice > item.price ? `<span style="font-size: 11px; color: #999; text-decoration: line-through; display: block;">${SalonUtils.formatCurrency(item.oldPrice)}</span>` : ''}
                  </td>
                  <td>
                    ${type === 'products' ? `<strong>${item.stock || 0}</strong> cái` : `<strong>${item.duration || 45}</strong> phút`}
                  </td>
                  <td style="font-size: 12px; color: #555; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.description || 'Chất lượng cao cấp tiêu chuẩn Omni Salon'}
                  </td>
                  <td>
                    <button class="pill-btn-outline" style="padding: 4px 8px; font-size: 11px; color: #b91c1c; border-color: #fca5a5;" 
                            onclick="UIWeb.deleteCatalogItem('${type}', '${item.id}')">
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 24px; color: #888;">
                    Không tìm thấy mục nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  switchCatalogTabType(type) {
    this.catalogTabType = type;
    this.refreshCatalogView();
  },

  refreshCatalogView() {
    const content = document.getElementById('adminSubTabContent');
    if (content && this.adminSubTab === 'catalog') {
      const services = window.store.getServices();
      const combos = window.store.getCombos();
      const products = window.store.getProducts();
      content.innerHTML = this.renderAdminCatalogTab(services, combos, products);
    }
  },

  openAddCatalogModal(type) {
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    const title = type === 'services' ? 'DỊCH VỤ MỚI' : type === 'combos' ? 'GÓI COMBO VIP MỚI' : 'SẢN PHẨM RETAIL MỚI';

    modalBody.innerHTML = `
      <div style="max-width: 520px; margin: 0 auto;">
        <div class="badge-terracotta">QUẢN LÝ CATALOG SALON</div>
        <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0 16px;">THÊM ${title}</h2>
        <form onsubmit="event.preventDefault(); UIWeb.submitAddCatalog('${type}');">
          <div style="margin-bottom: 12px;">
            <label class="sub-label">Tên Mặt Hàng / Gói:</label>
            <input type="text" id="catName" class="form-control-custom" placeholder="VD: Uốn Textured Crop / Sáp Brosh Matte..." required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
            <div>
              <label class="sub-label">Giá Bán (VNĐ):</label>
              <input type="number" id="catPrice" class="form-control-custom" placeholder="250000" required min="1000">
            </div>
            <div>
              <label class="sub-label">Giá Gốc / So Sánh (VNĐ):</label>
              <input type="number" id="catOldPrice" class="form-control-custom" placeholder="320000">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
            <div>
              <label class="sub-label">${type === 'products' ? 'Thương Hiệu:' : 'Phân Loại (Category):'}</label>
              <input type="text" id="catCategory" class="form-control-custom" value="${type === 'products' ? 'Brosh Japan' : 'haircut'}" required>
            </div>
            <div>
              <label class="sub-label">${type === 'products' ? 'Số Lượng Tồn Ban Đầu:' : 'Thời Lượng Thực Hiện (Phút):'}</label>
              <input type="number" id="catDurationOrStock" class="form-control-custom" value="${type === 'products' ? 30 : 45}" required min="1">
            </div>
          </div>
          <div style="margin-bottom: 12px;">
            <label class="sub-label">Đường Dẫn Ảnh (Image URL):</label>
            <input type="url" id="catImage" class="form-control-custom" value="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80">
          </div>
          <div style="margin-bottom: 16px;">
            <label class="sub-label">Mô Tả Chi Tiết:</label>
            <textarea id="catDescription" class="form-control-custom" rows="2" placeholder="Mô tả công dụng và các bước phục vụ..."></textarea>
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn-cancel" style="flex: 1;" onclick="UICommon.closeGlobalModal()">Hủy Bỏ</button>
            <button type="submit" class="btn-submit-terracotta" style="flex: 1;">Lưu Mặt Hàng</button>
          </div>
        </form>
      </div>
    `;
    modal.classList.add('active');
  },

  submitAddCatalog(type) {
    const name = document.getElementById('catName').value.trim();
    const price = Number(document.getElementById('catPrice').value) || 0;
    const oldPrice = Number(document.getElementById('catOldPrice').value) || price;
    const catOrBrand = document.getElementById('catCategory').value.trim();
    const durOrStock = Number(document.getElementById('catDurationOrStock').value) || 45;
    const image = document.getElementById('catImage').value.trim();
    const description = document.getElementById('catDescription').value.trim();

    if (!name || price <= 0) {
      if (window.UICommon) window.UICommon.showToast('⚠️ Vui lòng nhập tên và giá bán hợp lệ!', 'warning');
      else alert('Vui lòng nhập tên và giá bán hợp lệ!');
      return;
    }

    if (type === 'services') {
      window.store.addService({
        name,
        price,
        oldPrice,
        category: catOrBrand,
        duration: durOrStock,
        image,
        description
      });
      UICommon.showToast(`✂️ Đã thêm dịch vụ [${name}] thành công!`);
    } else if (type === 'combos') {
      window.store.addCombo({
        name,
        price,
        oldPrice,
        duration: durOrStock,
        image,
        description
      });
      UICommon.showToast(`🌟 Đã thêm gói Combo VIP [${name}] thành công!`);
    } else {
      window.store.addProduct({
        name,
        price,
        oldPrice,
        brand: catOrBrand,
        stock: durOrStock,
        image,
        description
      });
      UICommon.showToast(`📦 Đã thêm sản phẩm [${name}] vào kho thành công!`);
    }

    UICommon.closeGlobalModal();
    const container = document.getElementById('webMainContainer');
    if (container) this.renderAdminView(container);
  },

  deleteCatalogItem(type, id) {
    if (confirm(`Bạn có chắc chắn muốn xóa mục #${id} khỏi danh mục kinh doanh?`)) {
      if (type === 'services') {
        window.store.deleteService(id);
      } else if (type === 'combos') {
        window.store.deleteCombo(id);
      } else {
        window.store.deleteProduct(id);
      }
      UICommon.showToast(`🗑️ Đã xóa mục #${id}!`);
      this.refreshCatalogView();
    }
  },

  // -----------------------------------------------------------------------
  // --- SUB-TAB 7: QUẦY THU NGÂN POS 2 CỘT (TÍNH TIỀN TẠI CHỖ & XUẤT VIETQR) ---
  // -----------------------------------------------------------------------
  renderAdminPosTab(services, combos, products, branches, stylists) {
    const pos = this.posState;
    if (!pos.selectedStylistId && stylists.length > 0) {
      pos.selectedStylistId = stylists[0].id;
    }

    // Lọc danh mục chọn món bên trái
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

    // Tính toán hóa đơn bên phải
    const servicesTotal = pos.billServices.reduce((sum, s) => sum + s.price, 0);
    const productsTotal = pos.billProducts.reduce((sum, p) => sum + (p.price * p.qty), 0);
    const subtotal = servicesTotal + productsTotal;

    // Tính voucher
    if (pos.voucherCode && window.PricingService) {
      const vRes = window.PricingService.processVoucherCode(pos.voucherCode, subtotal, window.store.getPromotions ? window.store.getPromotions() : []);
      pos.discountAmount = vRes.isValid ? vRes.discountAmount : 0;
    }
    const finalTotal = Math.max(0, subtotal - pos.discountAmount);

    return `
      <div class="pos-cashier-grid">
        <!-- CỘT TRÁI: DANH MỤC DỊCH VỤ & SẢN PHẨM ĐỂ CHỌN MÓN (PICKER) -->
        <div class="pos-panel pos-catalog-panel">
          <div class="pos-panel-header">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #111;">✂️ Danh Mục Dịch Vụ & Sản Phẩm Sáp</h3>
              <p style="font-size: 12px; color: #666; margin-top: 2px;">Click vào thẻ để thêm vào hóa đơn thanh toán</p>
            </div>
            <div style="display: flex; gap: 6px;">
              <input type="text" class="table-search-input" placeholder="Tìm dịch vụ / sáp..." 
                     value="${pos.searchQuery || ''}" 
                     oninput="UIWeb.posState.searchQuery = this.value; UIWeb.refreshPosView();">
            </div>
          </div>

          <!-- Category Pills Filter -->
          <div style="display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap;">
            <button type="button" class="admin-tab-btn ${pos.activeCategory === 'all' ? 'active' : ''}" 
                    style="padding: 4px 10px; font-size: 11px;" onclick="UIWeb.setPosFilter('all')">Tất Cả</button>
            <button type="button" class="admin-tab-btn ${pos.activeCategory === 'services' ? 'active' : ''}" 
                    style="padding: 4px 10px; font-size: 11px;" onclick="UIWeb.setPosFilter('services')">Dịch Vụ Cắt</button>
            <button type="button" class="admin-tab-btn ${pos.activeCategory === 'combos' ? 'active' : ''}" 
                    style="padding: 4px 10px; font-size: 11px;" onclick="UIWeb.setPosFilter('combos')">Gói Combo VIP</button>
            <button type="button" class="admin-tab-btn ${pos.activeCategory === 'products' ? 'active' : ''}" 
                    style="padding: 4px 10px; font-size: 11px;" onclick="UIWeb.setPosFilter('products')">Sáp & Mỹ Phẩm</button>
          </div>

          <!-- Grid Sản Phẩm / Dịch Vụ -->
          <div class="pos-catalog-grid">
            ${allOfferings.map(item => `
              <div class="pos-item-card" onclick="${item.itemType === 'service' ? `UIWeb.addPosService('${item.id}')` : `UIWeb.addPosProduct('${item.id}')`}">
                <div>
                  <img src="${item.image}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" alt="${item.name}">
                  <div style="font-size: 11px; color: #c85a44; font-weight: 700;">${item.itemType === 'service' ? '✂️ Dịch Vụ' : '📦 Sản Phẩm'}</div>
                  <div style="font-size: 13px; font-weight: 800; color: #111; line-height: 1.3; margin: 2px 0 4px;">${item.name}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px;">
                  <strong style="font-size: 13px; color: #c85a44;">${SalonUtils.formatCurrency(item.price)}</strong>
                  <button type="button" class="btn-submit-terracotta" style="padding: 4px 8px; font-size: 10px;">+ Thêm</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- CỘT PHẢI: HÓA ĐƠN QUẦY POS & THANH TOÁN (RECEIPT & BILLING) -->
        <div class="pos-panel pos-receipt-panel">
          <div class="pos-panel-header">
            <div>
              <div class="badge-terracotta" style="font-size: 10px;">QUẦY THU NGÂN TẠI CHỖ</div>
              <h3 style="font-size: 17px; font-weight: 900; color: #111; margin-top: 4px;">HÓA ĐƠN POS TẠM TÍNH</h3>
            </div>
            <button type="button" class="pill-btn-outline" style="font-size: 11px; padding: 4px 8px; color: #b91c1c; border-color: #fca5a5;" onclick="UIWeb.resetPosBill()">
              Làm Mới Bill
            </button>
          </div>

          <!-- Thông tin chi nhánh & Master Stylist phục vụ -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div>
              <label class="sub-label">Cơ Sở Phục Vụ:</label>
              <select class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" onchange="UIWeb.posState.branchId = this.value">
                ${branches.map(b => `<option value="${b.id}" ${b.id === pos.branchId ? 'selected' : ''}>${b.name.split('—')[0]}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="sub-label">Master Stylist Phục Vụ:</label>
              <select class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" onchange="UIWeb.posState.stylistId = this.value">
                ${stylists.map(s => `<option value="${s.id}" ${s.id === pos.selectedStylistId ? 'selected' : ''}>${s.name} (${s.role})</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Thông tin khách hàng -->
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div>
              <label class="sub-label">Tên Khách Hàng:</label>
              <input type="text" class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" 
                     value="${pos.customerName}" oninput="UIWeb.posState.customerName = this.value">
            </div>
            <div>
              <label class="sub-label">Số Điện Thoại:</label>
              <input type="tel" class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" 
                     value="${pos.customerPhone}" oninput="UIWeb.posState.customerPhone = this.value">
            </div>
          </div>

          <!-- Chi tiết các món trong hóa đơn -->
          <div style="font-size: 12px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 6px;">
            Danh Sách Dịch Vụ & Sản Phẩm (${pos.billServices.length + pos.billProducts.length}):
          </div>
          <div class="pos-bill-list">
            ${pos.billServices.length === 0 && pos.billProducts.length === 0 ? `
              <div style="text-align: center; padding: 24px; color: #999; font-size: 12px;">
                Chưa có dịch vụ hoặc sản phẩm nào trong bill.<br>Vui lòng chọn từ cột bên trái!
              </div>
            ` : ''}

            <!-- Dịch vụ cắt -->
            ${pos.billServices.map((s, idx) => `
              <div class="pos-bill-row">
                <div>
                  <strong>✂️ ${s.name}</strong>
                  <div style="font-size: 11px; color: #888;">${s.duration || 45} phút</div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <strong style="color: #c85a44;">${SalonUtils.formatCurrency(s.price)}</strong>
                  <button type="button" style="color: #ef4444; border:none; background:none; cursor:pointer;" onclick="UIWeb.removePosService(${idx})">✕</button>
                </div>
              </div>
            `).join('')}

            <!-- Sản phẩm retail -->
            ${pos.billProducts.map(p => `
              <div class="pos-bill-row">
                <div>
                  <strong>📦 ${p.name}</strong>
                  <div style="font-size: 11px; color: #888;">${SalonUtils.formatCurrency(p.price)} / hộp</div>
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <button type="button" class="qty-btn" style="width:20px; height:20px; font-size:10px;" onclick="UIWeb.changePosProductQty('${p.id}', ${p.qty - 1})">-</button>
                  <span style="font-weight: 800; font-size: 12px; width: 16px; text-align: center;">${p.qty}</span>
                  <button type="button" class="qty-btn" style="width:20px; height:20px; font-size:10px;" onclick="UIWeb.changePosProductQty('${p.id}', ${p.qty + 1})">+</button>
                  <strong style="color: #c85a44; margin-left: 4px;">${SalonUtils.formatCurrency(p.price * p.qty)}</strong>
                  <button type="button" style="color: #ef4444; border:none; background:none; cursor:pointer;" onclick="UIWeb.changePosProductQty('${p.id}', 0)">✕</button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Áp Voucher Giảm Giá -->
          <div style="display: flex; gap: 6px; margin-bottom: 12px;">
            <input type="text" id="posVoucherInput" class="form-control-custom" placeholder="Mã ưu đãi (VD: CHUTICH50)" 
                   style="font-size: 12px; padding: 6px 10px; text-transform: uppercase;" value="${pos.voucherCode}">
            <button type="button" class="btn-submit-terracotta" style="padding: 6px 14px; font-size: 11px; white-space: nowrap;" onclick="UIWeb.applyPosVoucher()">
              Áp Mã
            </button>
          </div>

          <!-- Bảng Tổng Kết Thanh Toán -->
          <div class="pos-summary-table">
            <div class="pos-summary-row">
              <span>Tổng tiền dịch vụ:</span>
              <span>${SalonUtils.formatCurrency(servicesTotal)}</span>
            </div>
            <div class="pos-summary-row">
              <span>Tổng tiền sản phẩm:</span>
              <span>${SalonUtils.formatCurrency(productsTotal)}</span>
            </div>
            ${pos.discountAmount > 0 ? `
              <div class="pos-summary-row" style="color: #059669; font-weight: 700;">
                <span>Giảm giá Voucher [${pos.voucherCode}]:</span>
                <span>-${SalonUtils.formatCurrency(pos.discountAmount)}</span>
              </div>
            ` : ''}
            <div class="pos-summary-row total-row">
              <span>KHÁCH CẦN THANH TOÁN:</span>
              <span>${SalonUtils.formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <!-- Phương Thức Thanh Toán -->
          <div style="margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 6px;">Phương Thức Thu Tiền:</div>
            <div style="display: flex; gap: 8px;">
              <button type="button" 
                      style="flex: 1; padding: 8px; font-size: 12px; font-weight: 800; border-radius: 8px; cursor: pointer; border: 1px solid ${pos.paymentMethod === 'VietQR' ? '#c85a44' : '#d1d5db'}; background: ${pos.paymentMethod === 'VietQR' ? '#fff6f4' : '#fff'}; color: ${pos.paymentMethod === 'VietQR' ? '#c85a44' : '#4b5563'};"
                      onclick="UIWeb.posState.paymentMethod = 'VietQR'; UIWeb.refreshPosView();">
                ⚡ Quét Mã VietQR
              </button>
              <button type="button" 
                      style="flex: 1; padding: 8px; font-size: 12px; font-weight: 800; border-radius: 8px; cursor: pointer; border: 1px solid ${pos.paymentMethod === 'Cash' ? '#c85a44' : '#d1d5db'}; background: ${pos.paymentMethod === 'Cash' ? '#fff6f4' : '#fff'}; color: ${pos.paymentMethod === 'Cash' ? '#c85a44' : '#4b5563'};"
                      onclick="UIWeb.posState.paymentMethod = 'Cash'; UIWeb.refreshPosView();">
                💵 Tiền Mặt Tại Quầy
              </button>
            </div>
          </div>

          <!-- Nút Thanh Toán -->
          <button type="button" class="btn-submit-terracotta" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 900;" 
                  onclick="UIWeb.checkoutPosBill()">
            💳 Thanh Toán & Xuất Hóa Đơn (${SalonUtils.formatCurrency(finalTotal)})
          </button>
        </div>
      </div>
    `;
  },

  setPosFilter(cat) {
    this.posState.activeCategory = cat;
    this.refreshPosView();
  },

  addPosService(serviceId) {
    const srv = window.store.getServiceById(serviceId) || window.store.getComboById(serviceId);
    if (!srv) return;
    this.posState.billServices.push({
      id: srv.id,
      name: srv.name,
      price: srv.price,
      duration: srv.duration || 45
    });
    UICommon.showToast(`✂️ Đã thêm [${srv.name}] vào hóa đơn!`);
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
        price: prod.price,
        qty: 1,
        image: prod.image
      });
    }
    UICommon.showToast(`📦 Đã thêm sáp [${prod.name}] vào hóa đơn!`);
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

  applyPosVoucher() {
    const input = document.getElementById('posVoucherInput');
    const code = (input ? input.value : '').trim().toUpperCase();
    if (!code) {
      UICommon.showToast('Vui lòng nhập mã ưu đãi!', 'warning');
      return;
    }
    const promos = window.store.getPromotions ? window.store.getPromotions() : [];
    const vRes = window.PricingService ? window.PricingService.processVoucherCode(code, 99999999, promos) : null;
    if (!vRes || !vRes.isValid) {
      UICommon.showToast(vRes?.message || `Mã [${code}] không hợp lệ!`, 'error');
      return;
    }
    this.posState.voucherCode = code;
    UICommon.showToast(`🎟️ Đã áp dụng mã [${code}]!`);
    this.refreshPosView();
  },

  resetPosBill() {
    this.posState.billServices = [];
    this.posState.billProducts = [];
    this.posState.voucherCode = '';
    this.posState.discountAmount = 0;
    this.refreshPosView();
  },

  refreshPosView() {
    const content = document.getElementById('adminSubTabContent');
    if (content && this.adminSubTab === 'pos') {
      const services = window.store.getServices();
      const combos = window.store.getCombos();
      const products = window.store.getProducts();
      const branches = window.store.getBranches();
      const stylists = window.store.getStylists();
      content.innerHTML = this.renderAdminPosTab(services, combos, products, branches, stylists);
    }
  },

  checkoutPosBill() {
    const pos = this.posState;
    if (pos.billServices.length === 0 && pos.billProducts.length === 0) {
      UICommon.showToast('⚠️ Hóa đơn chưa có dịch vụ hoặc sản phẩm nào!', 'warning');
      return;
    }

    try {
      const posOrder = window.store.createPosOrder({
        branchId: pos.branchId,
        stylistId: pos.selectedStylistId,
        customerName: pos.customerName,
        customerPhone: pos.customerPhone,
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
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    const qrSvg = SalonUtils.generateQrSvgCode ? SalonUtils.generateQrSvgCode(`VIETQR-OMNI-${order.orderCode}-${order.totalAmount}`) : '';

    modalBody.innerHTML = `
      <div class="booking-success-box" style="max-width: 500px; margin: 0 auto;">
        <div class="success-icon" style="background:#10b981;">✓</div>
        <h2 style="font-size: 22px; font-weight: 900; margin-bottom: 4px;">THANH TOÁN POS THÀNH CÔNG!</h2>
        <p style="color: #666; font-size: 13px; margin-bottom: 16px;">
          Mã hóa đơn quầy: <strong style="color: #c85a44;">#${order.orderCode || order.id}</strong> • Trạng thái: <strong style="color: #10b981;">ĐÃ THANH TOÁN</strong>
        </p>

        <div class="booking-invoice-card" style="text-align: left;">
          <div class="invoice-item"><span>Cơ sở phục vụ:</span><strong>${order.branchId}</strong></div>
          <div class="invoice-item"><span>Khách hàng:</span><span>${order.customerName} (${order.customerPhone})</span></div>
          <div class="invoice-item"><span>Hình thức:</span><strong>${order.paymentMethod}</strong></div>
          ${order.services && order.services.length > 0 ? `
            <div style="margin: 8px 0; border-top: 1px dashed #ddd; padding-top: 6px;">
              <div style="font-size: 11px; font-weight: 700; color: #888;">DỊCH VỤ CẮT:</div>
              ${order.services.map(s => `<div class="invoice-item"><span>${s.name}</span><strong>${SalonUtils.formatCurrency(s.price)}</strong></div>`).join('')}
            </div>
          ` : ''}
          ${order.items && order.items.length > 0 ? `
            <div style="margin: 8px 0; border-top: 1px dashed #ddd; padding-top: 6px;">
              <div style="font-size: 11px; font-weight: 700; color: #888;">SẢN PHẨM SÁP:</div>
              ${order.items.map(it => `<div class="invoice-item"><span>${it.name} (x${it.qty || 1})</span><strong>${SalonUtils.formatCurrency(it.price * (it.qty || 1))}</strong></div>`).join('')}
            </div>
          ` : ''}
          ${order.discountAmount > 0 ? `
            <div class="invoice-item" style="color: #059669;">
              <span>Voucher giảm giá:</span>
              <strong>-${SalonUtils.formatCurrency(order.discountAmount)}</strong>
            </div>
          ` : ''}
          <div class="invoice-item price-row">
            <span>Tổng thực thu:</span>
            <strong style="color: #c85a44; font-size: 18px;">${SalonUtils.formatCurrency(order.totalAmount)}</strong>
          </div>
        </div>

        ${qrSvg ? `
          <div style="margin: 16px 0; padding: 12px; background: #fafafa; border-radius: 10px; border: 1px dashed #ccc; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; color: #666; margin-bottom: 6px;">MÃ VIETQR XÁC NHẬN GIAO DỊCH TỨC THÌ</div>
            <div style="display: flex; justify-content: center; margin: 6px 0;">${qrSvg}</div>
          </div>
        ` : ''}

        <div style="display: flex; gap: 10px; margin-top: 18px;">
          <button class="pill-btn-outline" style="flex: 1;" onclick="window.print()">🖨️ In Hóa Đơn</button>
          <button class="btn-submit-terracotta" style="flex: 1;" onclick="UICommon.closeGlobalModal(); UIWeb.refreshPosView();">Hoàn Tất & Tạo Đơn Mới</button>
        </div>
      </div>
    `;
    modal.classList.add('active');
  }
};

window.UIWeb = UIWeb;

