// Main App Coordinator & Navigation Router with Full Authentication & Reactive Store
// Chuẩn 100% Kiến Trúc Kỹ Thuật (CNTT-KLCN039)

class MainApp {
  constructor() {
    this.currentMode = 'customer'; // 'customer' | 'admin'
    this.currentView = 'services';
    this.init();
  }

  init() {
    this.renderBranchSelector();
    this.bindEvents();
    this.bindNotificationEvents();
    this.updateUserAuthUI();
    this.updateCartBadge();
    this.updateNotificationBadge();
    this.renderCurrentView();

    // Subscribe to store updates for automatic reactivity
    window.store.subscribe(() => {
      this.updateUserAuthUI();
      this.renderBranchSelector();
      this.updateCartBadge();
      this.updateNotificationBadge();
      this.renderCurrentView();
      UICustomer.renderCartDrawer();
    });
  }

  renderBranchSelector() {
    const select = document.getElementById('headerBranchSelect');
    if (!select) return;

    const branches = window.store.getBranches();
    const currentBranchId = window.store.getCurrentBranch()?.id;

    select.innerHTML = branches.map(b => `
      <option value="${b.id}" ${b.id === currentBranchId ? 'selected' : ''}>
        ${b.name}
      </option>
    `).join('');
  }

  handleBranchChange(branchId) {
    window.store.setSelectedBranch(branchId);
    const branch = window.store.getCurrentBranch();
    this.showToast(`📍 Đã chuyển sang chi nhánh [${branch?.name || 'Chi nhánh'}]`);
    this.renderCurrentView();
  }

  bindEvents() {
    // Mode switcher buttons (Customer vs Admin)
    const btnCust = document.getElementById('btnModeCustomer');
    const btnAdmin = document.getElementById('btnModeAdmin');

    if (btnCust) {
      btnCust.addEventListener('click', () => this.switchMode('customer'));
    }
    if (btnAdmin) {
      btnAdmin.addEventListener('click', () => this.switchMode('admin'));
    }

    // Top search bar input listener
    const searchInput = document.getElementById('topSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        UICustomer.searchQuery = e.target.value;
        const heroInput = document.getElementById('heroCenteredSearchInput');
        if (heroInput) heroInput.value = e.target.value;
        if (this.currentView === 'services') {
          UICustomer.renderServicesGrid(document.getElementById('servicesGrid'));
        } else if (this.currentView === 'products') {
          UICustomer.renderProductsGrid(document.getElementById('productsGrid'));
        }
      });
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleTopSearch();
        }
      });
    }

    // Cart drawer toggle
    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartDrawer = document.getElementById('cartDrawer');

    if (cartToggleBtn) {
      cartToggleBtn.addEventListener('click', () => {
        UICustomer.renderCartDrawer();
        cartDrawer.classList.add('open');
      });
    }

    if (closeCartBtn) {
      closeCartBtn.addEventListener('click', () => {
        cartDrawer.classList.remove('open');
      });
    }

    // Close booking modal when clicking close button
    const closeBookingModalBtn = document.getElementById('closeBookingModalBtn');
    if (closeBookingModalBtn) {
      closeBookingModalBtn.addEventListener('click', () => {
        document.getElementById('bookingModal').classList.remove('active');
      });
    }
  }

  bindNotificationEvents() {
    const notifBtn = document.getElementById('headerNotifBtn');
    const notifDrawer = document.getElementById('notificationsDrawer');
    const closeNotifBtn = document.getElementById('closeNotifBtn');

    if (notifBtn && notifDrawer) {
      notifBtn.addEventListener('click', () => {
        this.renderNotifications();
        notifDrawer.classList.add('open');
      });
    }

    if (closeNotifBtn && notifDrawer) {
      closeNotifBtn.addEventListener('click', () => {
        notifDrawer.classList.remove('open');
      });
    }
  }

  renderNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    const notifs = window.store.getNotifications();
    if (notifs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--color-muted-gray);">
          <div style="font-size: 32px; margin-bottom: 8px;">🔔</div>
          <div>Bạn không có thông báo mới nào.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = notifs.map(n => `
      <div class="elevated-card" style="padding: 14px; margin-bottom: 10px; background: ${n.read ? 'var(--color-canvas-mist)' : '#ffffff'}; border-left: 4px solid ${n.read ? 'var(--color-muted-gray)' : 'var(--color-shop-violet)'};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <strong style="font-size: 13px; color: ${n.read ? 'var(--color-slate-ink)' : 'var(--color-shop-violet)'};">${n.title}</strong>
          <span style="font-size: 11px; color: var(--color-muted-gray);">${n.time}</span>
        </div>
        <p style="font-size: 12px; color: var(--color-slate-ink); line-height: 1.4; margin: 0;">${n.content}</p>
        ${!n.read ? `
          <div style="margin-top: 6px; text-align: right;">
            <button class="pill-btn pill-btn-secondary" style="font-size: 10px; padding: 2px 8px;" onclick="window.store.markNotificationAsRead('${n.id}'); window.mainApp.renderNotifications();">
              Đánh dấu đã đọc
            </button>
          </div>
        ` : ''}
      </div>
    `).join('');

    this.updateNotificationBadge();
  }

  updateNotificationBadge() {
    const notifs = window.store.getNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('headerNotifBadge');
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
  }

  handleTopSearch() {
    const searchInput = document.getElementById('topSearchInput');
    if (!searchInput) return;

    UICustomer.searchQuery = searchInput.value.trim();
    if (this.currentView !== 'services' && this.currentView !== 'products') {
      this.navigateTo('services');
    } else if (this.currentView === 'services') {
      UICustomer.renderServicesGrid(document.getElementById('servicesGrid'));
    } else if (this.currentView === 'products') {
      UICustomer.renderProductsGrid(document.getElementById('productsGrid'));
    }
  }

  updateUserAuthUI() {
    const user = window.store.getCurrentUser();
    const sidebarAuthBtn = document.getElementById('sidebarAuthBtn');
    const headerAuthBtn = document.getElementById('headerUserBtn');

    if (user) {
      const initials = user.name.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase();
      if (sidebarAuthBtn) {
        sidebarAuthBtn.innerHTML = `
          <div class="user-avatar-circle" style="background:var(--color-shop-violet); color:white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">${initials}</div>
          <span style="max-width:56px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${user.name.split(' ').slice(-1)[0]}</span>
        `;
        sidebarAuthBtn.onclick = () => this.openProfileModal();
      }
      if (headerAuthBtn) {
        headerAuthBtn.innerHTML = `
          <span style="font-weight:600;">👤 ${user.name}</span>
          <span style="font-size:11px; background:var(--color-shop-violet); color:white; padding:2px 8px; border-radius:9999px;">${user.role === 'admin' ? 'Admin' : (user.tier || 'VIP')}</span>
        `;
        headerAuthBtn.onclick = () => this.openProfileModal();
      }
    } else {
      if (sidebarAuthBtn) {
        sidebarAuthBtn.innerHTML = `
          <div class="sidebar-avatar-icon">👤</div>
          <span>Sign In</span>
        `;
        sidebarAuthBtn.onclick = () => this.openAuthModal();
      }
      if (headerAuthBtn) {
        headerAuthBtn.innerHTML = `<span>Đăng Nhập / Đăng Ký</span>`;
        headerAuthBtn.onclick = () => this.openAuthModal();
      }
    }
  }

  switchMode(mode) {
    const user = window.store.getCurrentUser();
    if (mode === 'admin' && (!user || user.role !== 'admin')) {
      if (confirm('Chế độ Quản Trị yêu cầu quyền Quản Trị Viên (Admin). Bạn có muốn đăng nhập nhanh bằng tài khoản Admin không?')) {
        window.store.login('admin@omnisalon.vn', 'admin');
        this.showToast('👑 Đã đăng nhập với tư cách Quản Trị Viên Salon!');
      } else {
        return;
      }
    }

    this.currentMode = mode;
    const btnCust = document.getElementById('btnModeCustomer');
    const btnAdmin = document.getElementById('btnModeAdmin');
    const customerNav = document.getElementById('customerNavGroup');
    const adminNav = document.getElementById('adminNavGroup');

    if (mode === 'customer') {
      if (btnCust) btnCust.className = 'mode-pill-btn active';
      if (btnAdmin) btnAdmin.className = 'mode-pill-btn';
      if (customerNav) customerNav.style.display = 'flex';
      if (adminNav) adminNav.style.display = 'none';
      this.navigateTo('services');
    } else {
      if (btnCust) btnCust.className = 'mode-pill-btn';
      if (btnAdmin) btnAdmin.className = 'mode-pill-btn active-admin';
      if (customerNav) customerNav.style.display = 'none';
      if (adminNav) adminNav.style.display = 'flex';
      this.navigateTo('adminDashboard');
    }
  }

  navigateTo(viewId) {
    this.currentView = viewId;

    // Update active nav buttons
    document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
      if (btn.dataset.view === viewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Hide all view containers
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.style.display = 'none';
    });

    // Show target view container
    const targetPanel = document.getElementById(viewId + 'View');
    if (targetPanel) {
      targetPanel.style.display = 'block';
    }

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCurrentView() {
    const container = document.getElementById(this.currentView + 'View');
    if (!container) return;

    switch (this.currentView) {
      // Customer Views
      case 'services':
        UICustomer.renderHeroConstellation(document.getElementById('heroShopConstellation'));
        UICustomer.renderCategoryMosaics(document.getElementById('categoryMosaicsGrid'));
        UICustomer.renderHairModels(document.getElementById('hairGalleryScroll'));
        UICustomer.renderServicesGrid(document.getElementById('servicesGrid'));
        break;
      case 'aiConsultation':
        UICustomer.renderAIConsultationView(container);
        break;
      case 'products':
        UICustomer.renderProductsGrid(document.getElementById('productsGrid'));
        break;
      case 'myBookings':
        UICustomer.renderMyBookings(container);
        break;
      case 'favorites':
        this.renderFavoritesView(container);
        break;

      // Admin 11 Phân Hệ (CNTT-KLCN039 Mục 2.1)
      case 'adminDashboard':
        UIAdmin.renderDashboard(container);
        break;
      case 'adminBookings':
        UIAdmin.renderBookingsManager(container);
        break;
      case 'adminServices':
        UIAdmin.renderServicesManager(container);
        break;
      case 'adminShifts':
        UIAdmin.renderShiftsManager(container);
        break;
      case 'adminBranches':
        UIAdmin.renderBranchesManager(container);
        break;
      case 'adminCustomers':
        UIAdmin.renderCustomersManager(container);
        break;
      case 'adminInventory':
        UIAdmin.renderInventoryManager(container);
        break;
      case 'adminOrders':
        UIAdmin.renderOrdersManager(container);
        break;
      case 'adminPromotions':
        UIAdmin.renderPromotionsManager(container);
        break;
      case 'adminAiConsultations':
      case 'adminConsultations':
        UIAdmin.renderAiConsultationsManager(container);
        break;
      case 'adminAuditLogs':
        UIAdmin.renderAuditLogsManager(container);
        break;
      default:
        break;
    }
  }

  renderFavoritesView(containerEl) {
    const favorites = window.store.getFavorites();
    const services = window.store.getServices().filter(s => favorites.includes(s.id));
    const products = window.store.getProducts().filter(p => favorites.includes(p.id));

    if (services.length === 0 && products.length === 0) {
      containerEl.innerHTML = `
        <div style="text-align:center; padding:64px 20px;">
          <div style="font-size: 48px; margin-bottom: 12px;">❤️</div>
          <h3 style="font-size: 20px; font-weight: 700;">Danh sách yêu thích đang trống</h3>
          <p style="color:var(--color-muted-gray); margin-top:8px;">Bấm vào biểu tượng trái tim trên các dịch vụ hoặc mỹ phẩm để lưu lại tại đây.</p>
          <button class="pill-btn" style="margin-top: 20px;" onclick="window.mainApp.navigateTo('services')">
            Khám Phá Dịch Vụ Ngay →
          </button>
        </div>
      `;
      return;
    }

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <h2 class="catalog-section-title">Danh Sách Yêu Thích Của Bạn (${services.length + products.length})</h2>
        </div>
      </div>
      <div class="cards-grid-3">
        ${services.map(srv => `
          <div class="elevated-card">
            <div class="card-img-wrapper">
              <img class="card-img" src="${srv.image}" alt="${srv.name}">
              <button class="card-fav-btn active" onclick="UICustomer.toggleFav('${srv.id}', event)">❤️</button>
            </div>
            <div class="card-content">
              <div class="card-category">${srv.duration} Phút · ★ ${srv.rating}</div>
              <h3 class="card-title">${srv.name}</h3>
              <p class="card-description">${srv.description}</p>
              <div class="card-meta-row">
                <div class="card-price">${srv.price.toLocaleString('vi-VN')}đ</div>
                <button class="pill-btn" onclick="UICustomer.openBookingWizard('${srv.id}')">Đặt Lịch</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  setCategoryFilter(categoryKey, chipBtn) {
    UICustomer.activeCategory = categoryKey;
    document.querySelectorAll('.shop-category-chip').forEach(c => c.classList.remove('active'));
    if (chipBtn) chipBtn.classList.add('active');
    if (this.currentView !== 'services') {
      this.navigateTo('services');
    } else {
      UICustomer.renderServicesGrid(document.getElementById('servicesGrid'));
    }
  }

  updateCartBadge() {
    const cart = window.store.getCart();
    const totalQty = cart.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0);
    const badge = document.getElementById('cartBadgeCount');
    if (badge) {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
  }

  showToast(message) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- Authentication Modal (Đăng Nhập & Đăng Ký) ---
  openAuthModal(initialTab = 'login') {
    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
      <div class="auth-tabs">
        <button class="auth-tab-btn ${initialTab === 'login' ? 'active' : ''}" id="tabBtnLogin" onclick="window.mainApp.switchAuthTab('login')">
          Đăng Nhập
        </button>
        <button class="auth-tab-btn ${initialTab === 'register' ? 'active' : ''}" id="tabBtnRegister" onclick="window.mainApp.switchAuthTab('register')">
          Tạo Tài Khoản Mới
        </button>
      </div>

      <!-- Login Form -->
      <div id="authLoginForm" style="display: ${initialTab === 'login' ? 'block' : 'none'};">
        <div class="form-group">
          <label class="form-label">Email Đăng Nhập:</label>
          <input type="email" class="form-input" id="loginEmail" placeholder="khachhang@gmail.com" value="khachhang@gmail.com">
        </div>
        <div class="form-group">
          <label class="form-label">Mật Khẩu:</label>
          <input type="password" class="form-input" id="loginPassword" placeholder="••••••" value="123">
        </div>

        <div style="background:var(--color-canvas-mist); border-radius:16px; padding:14px; margin-bottom:18px; font-size:12px;">
          <div style="font-weight:700; margin-bottom:6px; color:var(--color-shop-violet);">⚡ Đăng Nhập Nhanh 1-Click:</div>
          <div style="display:flex; gap:8px;">
            <button class="pill-btn pill-btn-secondary" style="font-size:11px; padding:5px 12px;"
                    onclick="document.getElementById('loginEmail').value='khachhang@gmail.com'; document.getElementById('loginPassword').value='123';">
              Khách Hàng (VIP)
            </button>
            <button class="pill-btn pill-btn-secondary" style="font-size:11px; padding:5px 12px;"
                    onclick="document.getElementById('loginEmail').value='admin@omnisalon.vn'; document.getElementById('loginPassword').value='admin';">
              Quản Trị Viên (Admin)
            </button>
          </div>
        </div>

        <button class="pill-btn" style="width:100%; justify-content:center; font-size:15px;" onclick="window.mainApp.handleLogin()">
          Đăng Nhập Ngay →
        </button>
      </div>

      <!-- Register Form -->
      <div id="authRegisterForm" style="display: ${initialTab === 'register' ? 'block' : 'none'};">
        <div class="form-group">
          <label class="form-label">Họ và Tên:</label>
          <input type="text" class="form-input" id="regName" placeholder="Ví dụ: Trần Thị Mai">
        </div>
        <div class="form-group">
          <label class="form-label">Số Điện Thoại:</label>
          <input type="tel" class="form-input" id="regPhone" placeholder="0988776655">
        </div>
        <div class="form-group">
          <label class="form-label">Địa Chỉ Email:</label>
          <input type="email" class="form-input" id="regEmail" placeholder="mai.tran@gmail.com">
        </div>
        <div class="form-group">
          <label class="form-label">Mật Khẩu:</label>
          <input type="password" class="form-input" id="regPassword" placeholder="Tối thiểu 6 ký tự">
        </div>

        <button class="pill-btn" style="width:100%; justify-content:center; font-size:15px;" onclick="window.mainApp.handleRegister()">
          Hoàn Tất Đăng Ký →
        </button>
      </div>
    `;
    document.getElementById('bookingModal').classList.add('active');
  }

  switchAuthTab(tab) {
    document.getElementById('tabBtnLogin').className = 'auth-tab-btn ' + (tab === 'login' ? 'active' : '');
    document.getElementById('tabBtnRegister').className = 'auth-tab-btn ' + (tab === 'register' ? 'active' : '');
    document.getElementById('authLoginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('authRegisterForm').style.display = tab === 'register' ? 'block' : 'none';
  }

  handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    const res = window.store.login(email, pass);

    if (res.success) {
      document.getElementById('bookingModal').classList.remove('active');
      this.showToast(`🎉 Chào mừng trở lại, ${res.user.name}!`);
      this.updateUserAuthUI();
      if (res.user.role === 'admin') {
        this.switchMode('admin');
      }
    } else {
      this.showToast(`❌ ${res.message}`);
    }
  }

  handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;

    if (!name || !phone || !email || !pass) {
      this.showToast('⚠️ Vui lòng điền đầy đủ các thông tin đăng ký');
      return;
    }

    const res = window.store.register(name, email, phone, pass);
    if (res.success) {
      document.getElementById('bookingModal').classList.remove('active');
      this.showToast(`🎉 Đăng ký tài khoản thành công! Chào mừng ${res.user.name}`);
      this.updateUserAuthUI();
    } else {
      this.showToast(`❌ ${res.message}`);
    }
  }

  openProfileModal() {
    const user = window.store.getCurrentUser();
    if (!user) {
      this.openAuthModal();
      return;
    }

    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 68px; height: 68px; background: var(--color-shop-violet); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; margin: 0 auto 12px auto; box-shadow: 0 4px 16px rgba(84, 51, 235, 0.25);">
          ${user.name[0]}
        </div>
        <h3 style="font-size: 19px; font-weight: 700;">${user.name}</h3>
        <p style="font-size: 13px; color: var(--color-muted-gray);">${user.email} · ${user.phone}</p>
      </div>

      <div style="background: var(--color-canvas-mist); border-radius: 18px; padding: 18px; margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
          <span>Cấp bậc hội viên:</span>
          <span style="font-weight: 700; color: var(--color-shop-violet);">${user.role === 'admin' ? '👑 Quản Trị Viên Salon' : (user.tier || 'Thành Viên VIP')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
          <span>Điểm thưởng OmniPoints:</span>
          <span style="font-weight: 700;">1,250 Điểm</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span>Tiêu chuẩn đề tài:</span>
          <span style="font-weight: 600;">CNTT-KLCN039</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="pill-btn pill-btn-secondary" style="justify-content: center; width: 100%;"
                onclick="window.store.resetToDefault(); window.mainApp.showToast('🔄 Đã khôi phục dữ liệu demo gốc!'); document.getElementById('bookingModal').classList.remove('active');">
          🔄 Khôi Phục Dữ Liệu Demo Gốc
        </button>
        <button class="pill-btn pill-btn-secondary" style="color:var(--color-danger); justify-content: center; width: 100%;"
                onclick="window.store.logout(); window.mainApp.updateUserAuthUI(); document.getElementById('bookingModal').classList.remove('active'); window.mainApp.showToast('Đã đăng xuất tài khoản.');">
          🚪 Đăng Xuất Tài Khoản
        </button>
        <button class="pill-btn" style="justify-content: center; width: 100%;"
                onclick="document.getElementById('bookingModal').classList.remove('active');">
          Đóng
        </button>
      </div>
    `;
    document.getElementById('bookingModal').classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.mainApp = new MainApp();
});
