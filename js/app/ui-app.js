// =========================================================================
// OmniSalon / 4RAU Barbershop — MOBILE APP UI MODULE
// (Vỏ Máy Android, 5 Tabs Di Động, Đặt Lịch, Thử Tóc AI, Cửa Hàng, Profile)
// =========================================================================

const UIApp = {
  currentTab: 'home', // 'home' | 'booking' | 'ai' | 'shop' | 'profile'
  isFramed: true, // true: hiển thị trong khung điện thoại Android; false: toàn màn hình điện thoại

  init() {
    if (document.body.classList.contains('mobile-app-body') || window.location.pathname.includes('app.html')) {
      this.isFramed = false;
    }
    const hash = window.location.hash.replace('#', '');
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') || hash;
    if (['home', 'booking', 'ai', 'shop', 'profile'].includes(tabParam)) {
      this.currentTab = tabParam;
    }
    this.renderAppFrame();
    if (this.currentTab === 'ai' && this.aiState.resultImage && !this.aiState.isProcessing) {
      setTimeout(() => this.initCompareSlider(), 60);
    }
    if (window.store && !this._subscribed) {
      this._subscribed = true;
      window.store.subscribe(() => {
        const scrollContainer = document.getElementById('androidScrollContent');
        if (scrollContainer) {
          scrollContainer.innerHTML = this.renderActiveTabContent();
        }
        UICommon.updateCartBadges();
      });
    }
  },

  renderAppFrame() {
    const appContainer = document.getElementById('appMobileContainer');
    if (!appContainer) return;

    appContainer.innerHTML = `
      <div class="android-phone-outer ${this.isFramed ? 'framed' : 'fullscreen'}">
        <!-- Vỏ máy điện thoại Android (Punch-hole camera, viền kim loại) -->
        <div class="android-device-bezel">
          <!-- Camera đục lỗ nốt ruồi -->
          <div class="android-punchhole-camera"></div>

          <!-- Màn hình cảm ứng bên trong -->
          <div class="android-screen-surface">
            <!-- 1. Android Status Bar -->
            <div class="android-status-bar">
              <span class="android-clock" id="androidLiveClock">09:41</span>
              <div class="android-status-icons">
                <!-- WiFi Icon -->
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.6 0 6.88 1.4 9.3 3.73L12 19.12 2.7 11.23C5.12 8.9 8.4 7.5 12 7.5z"/></svg>
                <!-- 5G / Sóng -->
                <span style="font-size: 11px; font-weight: 800;">5G</span>
                <!-- Pin 100% -->
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17 5v16c0 .55-.45 1-1 1H8c-.55 0-1-.45-1-1V5c0-.55.45-1 1-1h2V2h4v2h2c.55 0 1 .45 1 1zm-2 1H9v14h6V6z"/></svg>
              </div>
            </div>

            <!-- 2. Android Top App Bar -->
            <div class="android-top-app-bar">
              <div class="app-bar-left" onclick="UIApp.switchTab('home')">
                <span class="app-4rau-badge">4RAU</span>
                <span class="app-bar-title">Barbershop</span>
              </div>
              <div class="app-bar-right">
                <!-- Nút mở chi nhánh -->
                <button class="app-icon-btn" onclick="UICommon.openBranchModal('br-dbp')" title="Chi nhánh">📍</button>
                <!-- Nút mở giỏ hàng -->
                <button class="app-icon-btn cart-btn-wrap" onclick="UICommon.openCartDrawer()" title="Giỏ hàng">
                  🛒
                  <span class="cart-badge-count" id="appCartBadge" style="display:none;">0</span>
                </button>
              </div>
            </div>

            <!-- 3. Nội dung cuộn chính của App Android -->
            <div class="android-scroll-content" id="androidScrollContent">
              ${this.renderActiveTabContent()}
            </div>

            <!-- 4. Android Bottom Navigation Bar (5 Tabs chuẩn Material You) -->
            <div class="android-bottom-nav">
              <button class="bottom-nav-item ${this.currentTab === 'home' ? 'active' : ''}" onclick="UIApp.switchTab('home')">
                <div class="nav-indicator"><span class="nav-icon">🏠</span></div>
                <span class="nav-label">Trang Chủ</span>
              </button>
              <button class="bottom-nav-item ${this.currentTab === 'booking' ? 'active' : ''}" onclick="UIApp.switchTab('booking')">
                <div class="nav-indicator"><span class="nav-icon">📅</span></div>
                <span class="nav-label">Đặt Lịch</span>
              </button>
              <button class="bottom-nav-item ${this.currentTab === 'ai' ? 'active' : ''}" onclick="UIApp.switchTab('ai')">
                <div class="nav-indicator"><span class="nav-icon">💈</span></div>
                <span class="nav-label">Thử Tóc AI</span>
              </button>
              <button class="bottom-nav-item ${this.currentTab === 'shop' ? 'active' : ''}" onclick="UIApp.switchTab('shop')">
                <div class="nav-indicator"><span class="nav-icon">🛍️</span></div>
                <span class="nav-label">Cửa Hàng</span>
              </button>
              <button class="bottom-nav-item ${this.currentTab === 'profile' ? 'active' : ''}" onclick="UIApp.switchTab('profile')">
                <div class="nav-indicator"><span class="nav-icon">👤</span></div>
                <span class="nav-label">Cá Nhân</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.startClock();
    UICommon.updateCartBadges();
  },

  startClock() {
    setInterval(() => {
      const el = document.getElementById('androidLiveClock');
      if (el) {
        const now = new Date();
        el.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      }
    }, 1000);
  },

  switchTab(tabName) {
    this.currentTab = tabName;
    const scrollContainer = document.getElementById('androidScrollContent');
    if (scrollContainer) {
      scrollContainer.innerHTML = this.renderActiveTabContent();
      scrollContainer.scrollTop = 0;
      if (tabName === 'ai' && this.aiState.resultImage && !this.aiState.isProcessing) {
        setTimeout(() => this.initCompareSlider(), 60);
      }
    }
    const items = document.querySelectorAll('.bottom-nav-item');
    items.forEach(it => {
      if (it.getAttribute('onclick')?.includes(tabName)) it.classList.add('active');
      else it.classList.remove('active');
    });
  },

  renderActiveTabContent() {
    switch (this.currentTab) {
      case 'home':
        return this.renderHomeTab();
      case 'booking':
        return this.renderBookingTab();
      case 'ai':
        return this.renderAiTab();
      case 'shop':
        return this.renderShopTab();
      case 'profile':
        return this.renderProfileTab();
      default:
        return this.renderHomeTab();
    }
  },

  // --- Tab 1: Trang Chủ Mobile App (Chuẩn Giao Diện Điện Thoại Native) ---
  renderHomeTab() {
    const branch = window.store.getCurrentBranch();
    const bestProducts = window.store.getProducts('best').slice(0, 4);
    const services = window.store.getServices().slice(0, 4);
    const moments = window.store.getMoments().slice(0, 4);

    return `
      <div class="app-home-page" style="padding-bottom: 24px;">
        <!-- 1. Hero Promo Banner -->
        <div class="app-hero-card" style="background: linear-gradient(135deg, #1c1b18 0%, #2e1e19 100%); margin: 12px 14px; border-radius: 16px; padding: 20px; color: #fff; position: relative; overflow: hidden; border: 1px solid rgba(200,90,68,0.3);">
          <div style="font-size: 11px; font-weight: 800; color: var(--color-terracotta); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">💈 4RAU BARBERSHOP APP</div>
          <h2 style="font-size: 20px; font-weight: 900; line-height: 1.25; margin-bottom: 8px;">CẮT TÓC CHUẨN MEN & THỬ TÓC AI</h2>
          <p style="font-size: 12px; color: #ccc; margin-bottom: 16px;">18+ Chi nhánh toàn quốc — Đặt lịch giữ chỗ trước, không phải chờ đợi</p>
          <div style="display: flex; gap: 8px;">
            <button class="btn-submit-terracotta" style="padding: 8px 16px; font-size: 12px;" onclick="UIApp.switchTab('booking')">
              📅 ĐẶT LỊCH NGAY
            </button>
            <button class="pill-btn-outline" style="padding: 8px 14px; font-size: 12px; color: #fff; border-color: rgba(255,255,255,0.4);" onclick="UIApp.switchTab('ai')">
              ⚡ THỬ TÓC AI
            </button>
          </div>
        </div>

        <!-- 2. Quick Actions Grid (4 Nút Nhanh) -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 0 14px 16px;">
          <button class="app-quick-tile" onclick="UIApp.switchTab('booking')" style="background:#fff; border: 1px solid #eee; border-radius: 12px; padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer;">
            <span style="font-size: 22px;">📅</span>
            <span style="font-size: 11px; font-weight: 700; color: #333;">Đặt Lịch</span>
          </button>
          <button class="app-quick-tile" onclick="UIApp.switchTab('ai')" style="background:#fff; border: 1px solid #eee; border-radius: 12px; padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer;">
            <span style="font-size: 22px;">💈</span>
            <span style="font-size: 11px; font-weight: 700; color: #333;">Thử Tóc AI</span>
          </button>
          <button class="app-quick-tile" onclick="UIApp.switchTab('shop')" style="background:#fff; border: 1px solid #eee; border-radius: 12px; padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer;">
            <span style="font-size: 22px;">🛍️</span>
            <span style="font-size: 11px; font-weight: 700; color: #333;">Cửa Hàng</span>
          </button>
          <button class="app-quick-tile" onclick="UICommon.openBranchModal('${branch?.id || 'br-dbp'}')" style="background:#fff; border: 1px solid #eee; border-radius: 12px; padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer;">
            <span style="font-size: 22px;">📍</span>
            <span style="font-size: 11px; font-weight: 700; color: #333;">Chi Nhánh</span>
          </button>
        </div>

        <!-- 3. Current Branch Info Banner -->
        <div style="margin: 0 14px 18px; padding: 12px 14px; background: #fafafa; border: 1px solid #eee; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display:flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">📍</span>
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase;">Chi nhánh phục vụ:</div>
              <div style="font-size: 13px; font-weight: 800; color: #111;">${branch ? branch.name.split('—')[0] : '4RAU Barbershop'}</div>
            </div>
          </div>
          <button class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="UICommon.openBranchModal('${branch?.id || 'br-dbp'}')">
            Đổi
          </button>
        </div>

        <!-- 4. Dịch Vụ Nổi Bật -->
        <div style="margin: 0 14px 20px;">
          <div style="display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
            <h3 style="font-size: 15px; font-weight: 800; text-transform: uppercase;">DỊCH VỤ NỔI BẬT</h3>
            <a href="javascript:void(0)" onclick="UIApp.switchTab('booking')" style="font-size: 12px; font-weight: 700; color: var(--color-terracotta); text-decoration:none;">Xem tất cả →</a>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${services.map(s => `
              <div style="background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 13px; font-weight: 700; color: #111;">${s.name}</div>
                  <div style="font-size: 12px; font-weight: 800; color: var(--color-terracotta); margin-top: 2px;">${SalonUtils.formatCurrency(s.price)}</div>
                </div>
                <button class="btn-submit-terracotta" style="padding: 6px 12px; font-size: 11px;" onclick="UICommon.openBookingModal('${s.id}')">
                  Đặt Lịch
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 5. Sản Phẩm Bán Chạy -->
        <div style="margin: 0 14px 20px;">
          <div style="display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
            <h3 style="font-size: 15px; font-weight: 800; text-transform: uppercase;">SẢN PHẨM BÁN CHẠY</h3>
            <a href="javascript:void(0)" onclick="UIApp.switchTab('shop')" style="font-size: 12px; font-weight: 700; color: var(--color-terracotta); text-decoration:none;">Xem shop →</a>
          </div>
          <div class="app-store-grid-2">
            ${bestProducts.map(p => UICommon.renderProductCard(p, true)).join('')}
          </div>
        </div>

        <!-- 6. Khoảnh Khắc Bạn Đến Nhà -->
        <div style="margin: 0 14px 16px;">
          <div style="display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
            <h3 style="font-size: 15px; font-weight: 800; text-transform: uppercase;">BẠN ĐẾN NHÀ 4RAU</h3>
          </div>
          <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch;">
            ${moments.map(m => `
              <div style="flex: 0 0 140px; border-radius: 10px; overflow: hidden; border: 1px solid #eee; background: #fff;">
                <img src="${m.image}" alt="${m.title}" style="width: 140px; height: 140px; object-fit: cover;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';">
                <div style="padding: 6px 8px; font-size: 11px; font-weight: 600; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.title}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // --- Tab 2: Đặt Lịch Cắt Tóc (Nhúng Trực Tiếp Không Cần Popup Modal) ---
  renderBookingTab() {
    return `
      <div style="padding: 14px 14px 30px;">
        <div id="androidBookingTabContainer">
          ${UICommon.renderBookingWizardHTML()}
        </div>
      </div>
    `;
  },

  // -----------------------------------------------------------------------
  // AI BARBER STUDIO METHODS (BẢN APP MOBILE RIÊNG BIỆT — CHẠY NHƯ 1 TRANG NATIVE)
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

  // --- Tab 3: Thử Tóc AI Bằng Ảnh Thật Trên App Mobile (Giao diện 1 Trang Độc Lập, Không Dùng Modal) ---
  renderAiTab() {
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
      <div class="app-ai-mobile-page">
        <!-- Top App Badge & Header -->
        <div style="margin-bottom: 12px;">
          <div class="badge-terracotta pulse-animation">CÔNG NGHỆ AI RESTYLE 2026</div>
          <h3 style="font-size: 20px; font-weight: 900; margin: 6px 0 2px; color: #fff; letter-spacing: -0.01em;">4RAU AI BARBER STUDIO</h3>
          <p style="font-size: 12px; color: #888; margin: 0;">Chụp hoặc tải ảnh để biến đổi kiểu tóc xu hướng & xem kết quả tức thì</p>
        </div>

        <!-- Khung hiển thị ảnh / Scan / Compare slider -->
        <div class="app-ai-card" style="padding: 10px; margin-bottom: 12px;">
          ${
            !originalImage
              ? `
              <div class="ai-upload-dropzone" onclick="document.getElementById('appAiPhotoFileInput').click()" style="padding: 24px 12px;">
                <input type="file" id="appAiPhotoFileInput" accept="image/*" style="display:none;" onchange="UIApp.handleAiUpload(event)">
                <input type="file" id="appAiCameraInput" accept="image/*" capture="user" style="display:none;" onchange="UIApp.handleAiUpload(event)">

                <div class="dropzone-icon-box" style="width: 52px; height: 52px; margin: 0 auto 10px;">
                  <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <div style="font-size: 14px; font-weight: 800; color: #fff;">Chạm để Chọn hoặc Chụp ảnh chân dung</div>
                <div style="font-size: 11px; color: #888; margin-top: 4px; margin-bottom: 12px;">AI tự động nhận diện dáng mặt và chân tóc</div>

                <div style="display: flex; gap: 8px; justify-content: center;" onclick="event.stopPropagation();">
                  <button class="btn-sub-action" style="font-size: 12px; padding: 8px 14px;" onclick="document.getElementById('appAiCameraInput').click()">
                    📸 Chụp Selfie
                  </button>
                  <button class="btn-sub-action" style="font-size: 12px; padding: 8px 14px;" onclick="document.getElementById('appAiPhotoFileInput').click()">
                    📁 Thư Viện Ảnh
                  </button>
                </div>

                <div class="sample-avatar-strip" style="margin-top: 14px; padding-top: 10px;" onclick="event.stopPropagation();">
                  <span style="font-size: 11px; color: #aaa; font-weight: 700; display: block; margin-bottom: 8px;">HOẶC THỬ NHANH VỚI ẢNH MẪU:</span>
                  <div style="display: flex; gap: 12px; justify-content: center;">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80" 
                         class="sample-avatar-thumb" title="Mẫu Nam 1" onclick="UIApp.loadSampleAi(this.src)">
                    <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80" 
                         class="sample-avatar-thumb" title="Mẫu Nam 2" onclick="UIApp.loadSampleAi(this.src)">
                    <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80" 
                         class="sample-avatar-thumb" title="Mẫu Nam 3" onclick="UIApp.loadSampleAi(this.src)">
                  </div>
                </div>
              </div>
              `
              : isProcessing
              ? `
              <div class="ai-processing-container" style="padding: 16px 8px;">
                <div class="ai-scan-box" style="max-height: 280px;">
                  <img src="${originalImage}" class="ai-base-img" style="max-height: 280px;" alt="Scanning">
                  <div class="ai-scan-laser-line"></div>
                </div>
                <div class="barber-pole-spinner" style="width: 40px; height: 40px;"></div>
                <div style="font-size: 14px; font-weight: 800; color: #fff; margin-top: 12px;">
                  AI RESTYLE ĐANG BIẾN ĐỔI KIỂU TÓC...
                </div>
                <div class="ai-status-step-text" id="appAiStatusStep">Đang phân tích cấu trúc khuôn mặt & đường chân tóc...</div>
              </div>
              `
              : resultImage
              ? `
              <div class="ai-compare-slider-shell">
                <div class="ai-image-compare-wrapper" id="appCompareWrapper" style="height: 310px;">
                  <img src="${resultImage}" class="compare-img compare-img-after" alt="Ảnh Sau Đổi Tóc">
                  <span class="compare-label-after">✨ TÓC MỚI</span>

                  <div class="compare-before-clip" id="appCompareBeforeClip" style="width: 50%;">
                    <img src="${originalImage}" class="compare-img compare-img-before" alt="Ảnh Gốc">
                    <span class="compare-label-before">ẢNH GỐC</span>
                  </div>

                  <div class="compare-divider-handle" id="appCompareHandle" style="left: 50%;">
                    <div class="handle-circle">↔</div>
                  </div>
                </div>

                <div class="compare-hint-bar" style="margin-top: 6px;">
                  <span>👈 Chạm & vuốt sang trái/phải để so sánh 👉</span>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 6px;">
                  <button class="btn-sub-action" style="flex: 1; font-size: 12px; padding: 10px;" onclick="UIApp.downloadAiResult()">
                    📥 Tải Ảnh Về Máy
                  </button>
                  <button class="btn-sub-action" style="flex: 1; font-size: 12px; padding: 10px;" onclick="UIApp.resetAi()">
                    🔄 Đổi Ảnh Khác
                  </button>
                </div>
              </div>
              `
              : `
              <div class="ai-ready-preview-box">
                <div class="ready-img-wrap" style="max-height: 290px;">
                  <img src="${originalImage}" class="ready-preview-img" style="max-height: 290px;" alt="Ảnh Chân Dung">
                  <span class="ready-tag">ẢNH SẴN SÀNG</span>
                  <button class="btn-change-photo-mini" onclick="UIApp.resetAi()">Đổi ảnh</button>
                </div>
                <div style="font-size: 12px; color: #aaa; text-align: center; margin-top: 8px;">
                  Đã nhận diện khuôn mặt. Hãy chọn kiểu tóc & màu nhuộm bên dưới rồi bấm <strong>Biến Đổi</strong>!
                </div>
              </div>
              `
          }
        </div>

        <!-- 1. CHỌN KIỂU TÓC HOT TREND -->
        <div class="app-ai-card">
          <div class="app-ai-card-title">
            <span>1. CHỌN KIỂU TÓC HOT TREND</span>
            <span class="badge-selected-tag">${selectedStyle}</span>
          </div>
          <div class="app-style-scroll-row">
            ${stylePresets.map(s => `
              <div class="app-style-chip ${selectedStyle === s.name ? 'active' : ''}" onclick="UIApp.selectAiStyle('${s.name}')">
                <span>${s.icon}</span>
                <span>${s.name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2. CHỌN MÀU NHUỘM TÓC -->
        <div class="app-ai-card">
          <div class="app-ai-card-title">
            <span>2. CHỌN MÀU NHUỘM</span>
            <span style="font-size: 12px; font-weight: 700; color: #c85a44;">${selectedColorName}</span>
          </div>
          <div class="app-color-row">
            ${colorPresets.map(c => `
              <button class="app-color-item ${selectedColorName === c.name ? 'active' : ''}" onclick="UIApp.selectAiColor('${c.name}', '${c.hex}')" title="${c.name}">
                <span class="app-color-dot" style="background: ${c.hex};"></span>
                <span class="app-color-name">${c.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 3. GHI CHÚ YÊU CẦU THÊM -->
        <div class="app-ai-card">
          <div class="app-ai-card-title">
            <span>3. GHI CHÚ YÊU CẦU CHO AI (TÙY CHỌN)</span>
          </div>
          <input type="text" id="appAiCustomPromptInput" class="ai-custom-input"
                 placeholder="Ví dụ: Cạo sát chân tóc, uốn sóng phồng, vuốt bóng..."
                 value="${this.aiState.customPrompt || ''}"
                 onchange="UIApp.aiState.customPrompt = this.value"
                 style="width:100%; box-sizing:border-box;">
        </div>

        <!-- 4. NÚT HÀNH ĐỘNG CHÍNH -->
        <div style="margin-top: 12px; margin-bottom: 16px;">
          ${!resultImage ? `
            <button class="btn-execute-ai" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 800;" onclick="UIApp.processAiRestyle()" ${!originalImage || isProcessing ? 'disabled style="opacity: 0.6;"' : ''}>
              ⚡ BẮT ĐẦU ĐỔI KIỂU TÓC AI →
            </button>
          ` : `
            <button class="btn-submit-terracotta btn-book-now-ai" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 800;" onclick="UIApp.bookAiHairstyle()">
              📅 ĐẶT LỊCH CẮT KIỂU TÓC NÀY NGAY →
            </button>
            <button class="btn-execute-ai" style="width: 100%; margin-top: 8px; background: #262630; font-size: 13px;" onclick="UIApp.processAiRestyle()">
              ✨ Thử Kiểu Tóc Hoặc Màu Khác
            </button>
          `}
        </div>

        <!-- 5. CÀI ĐẶT API PROVIDER (COMPACT ACCORDION) -->
        <div style="text-align: center; margin-bottom: 24px;">
          <button class="btn-text-toggle" style="font-size: 11px; color: #777;" onclick="UIApp.toggleAiApiSettings()">
            ⚙️ Cài đặt AI Vision API (${aiConfig.provider})
          </button>
          ${showApiSettings ? `
            <div class="ai-settings-collapsible" style="text-align: left; margin-top: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 8px;">CẤU HÌNH API VISION TRÊN APP:</div>
              <div class="api-form-row">
                <label style="font-size: 11px;">Nhà Cung Cấp:</label>
                <select id="appAiProviderSelect" class="api-input-control" style="font-size: 12px;">
                  <option value="demo_smart" ${aiConfig.provider === 'demo_smart' ? 'selected' : ''}>4RAU Neural Engine (Sẵn có - Không cần Key)</option>
                  <option value="huggingface" ${aiConfig.provider === 'huggingface' ? 'selected' : ''}>Hugging Face Inference API</option>
                  <option value="replicate" ${aiConfig.provider === 'replicate' ? 'selected' : ''}>Replicate API (SD / Face-to-Many)</option>
                  <option value="openai" ${aiConfig.provider === 'openai' ? 'selected' : ''}>OpenAI Vision / DALL-E 3</option>
                </select>
              </div>
              <div class="api-form-row">
                <label style="font-size: 11px;">API Key (Mã Token):</label>
                <input type="password" id="appAiApiKeyInput" class="api-input-control" style="font-size: 12px;" placeholder="Mã token..." value="${aiConfig.apiKey || ''}">
              </div>
              <button class="btn-submit-terracotta" style="width: 100%; padding: 8px; margin-top: 8px; font-size: 12px;" onclick="UIApp.saveAiApiSettings()">
                💾 Lưu Cấu Hình
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  updateAiTab() {
    if (this.currentTab !== 'ai') return;
    const scrollContainer = document.getElementById('androidScrollContent');
    if (scrollContainer) {
      scrollContainer.innerHTML = this.renderAiTab();
      if (this.aiState.resultImage && !this.aiState.isProcessing) {
        setTimeout(() => this.initCompareSlider(), 60);
      }
    }
  },

  selectAiStyle(styleName) {
    this.aiState.selectedStyle = styleName;
    this.updateAiTab();
    UICommon.showToast(`💇 Bản App: Đã chọn kiểu tóc ${styleName}`);
  },

  selectAiColor(colorName, colorHex) {
    this.aiState.selectedColorName = colorName;
    this.aiState.selectedColorHex = colorHex;
    this.updateAiTab();
    UICommon.showToast(`🎨 Bản App: Đã chọn màu ${colorName}`);
  },

  handleAiUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.aiState.originalImage = e.target.result;
      this.aiState.resultImage = null;
      this.updateAiTab();
      UICommon.showToast('✅ Đã tải ảnh chân dung lên App Mobile!');
    };
    reader.readAsDataURL(file);
  },

  loadSampleAi(imageUrl) {
    this.aiState.originalImage = imageUrl;
    this.aiState.resultImage = null;
    this.updateAiTab();
    UICommon.showToast('✅ Đã chọn ảnh mẫu. Chạm "Bắt Đầu Đổi Kiểu Tóc"!');
  },

  toggleAiApiSettings() {
    this.aiState.showApiSettings = !this.aiState.showApiSettings;
    this.updateAiTab();
  },

  saveAiApiSettings() {
    const provider = document.getElementById('appAiProviderSelect')?.value;
    const apiKey = document.getElementById('appAiApiKeyInput')?.value;
    if (SalonApi) {
      SalonApi.saveAiConfig(provider, apiKey, '');
      UICommon.showToast('💾 Đã lưu cấu hình API trên App!');
      this.aiState.showApiSettings = false;
      this.updateAiTab();
    }
  },

  async processAiRestyle() {
    if (!this.aiState.originalImage) {
      UICommon.showToast('⚠️ Vui lòng chụp hoặc chọn ảnh chân dung trước.', 'warning');
      return;
    }
    this.aiState.isProcessing = true;
    this.updateAiTab();

    const stepEl = document.getElementById('appAiStatusStep');
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
        this.updateAiTab();
        UICommon.showToast(`🎉 Đổi kiểu tóc AI thành công (${response.providerUsed})!`);
      }
    } catch (err) {
      this.aiState.isProcessing = false;
      this.updateAiTab();
      UICommon.showToast(`❌ Lỗi AI: ${err.message}`, 'error');
    }
  },

  initCompareSlider() {
    const wrapper = document.getElementById('appCompareWrapper');
    const beforeClip = document.getElementById('appCompareBeforeClip');
    const handle = document.getElementById('appCompareHandle');
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
    a.download = `4RAU-Mobile-AI-${this.aiState.selectedStyle.replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    UICommon.showToast('📥 Đã tải ảnh kiểu tóc HD về máy!');
  },

  resetAi() {
    this.aiState.originalImage = null;
    this.aiState.resultImage = null;
    this.updateAiTab();
  },

  bookAiHairstyle() {
    const note = `[AI Studio App] Khách muốn cắt kiểu: ${this.aiState.selectedStyle} - Màu: ${this.aiState.selectedColorName}`;
    if (window.store && window.store.bookingDraft) {
      window.store.bookingDraft.notes = note;
    }
    this.switchTab('booking');
    UICommon.showToast(`💇 Đã chuyển kiểu tóc "${this.aiState.selectedStyle}" sang màn hình Đặt Lịch!`);
  },

  // --- Tab 4: Cửa Hàng Mỹ Phẩm & Phụ Kiện 4RAU ---
  renderShopTab() {
    const products = window.store.getProducts();
    return `
      <div style="padding: 16px;">
        <div class="badge-terracotta">CỬA HÀNG 4RAU CHÍNH HÃNG</div>
        <h3 style="font-size: 18px; font-weight: 800; margin: 6px 0 12px;">SÁP, POMADE & PHỤ KIỆN</h3>
        <div class="app-store-grid-2">
          ${products.map(p => UICommon.renderProductCard(p, true)).join('')}
        </div>
      </div>
    `;
  },

  // --- Tab 5: Tài Khoản & Quản Trị ---
  renderProfileTab() {
    const user = window.store.getCurrentUser();
    const bookings = window.store.getBookings();

    return `
      <div style="padding: 16px;">
        <div class="app-profile-header">
          <div class="app-profile-avatar">${user ? SalonUtils.getInitials(user.name) : '4R'}</div>
          <div>
            <h3 style="font-size: 16px; font-weight: 800;">${user ? user.name : 'Khách 4RAU'}</h3>
            <span class="app-profile-tier">${user?.role === 'admin' ? 'Chủ Tịch (Admin)' : (user?.tier || 'Thành Viên')}</span>
          </div>
        </div>

        <div class="app-card-block" style="margin-top: 16px;">
          <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px;">LỊCH HẸN GẦN NHẤT</h4>
          ${bookings.slice(0, 2).map(b => `
            <div class="invoice-item" style="padding: 8px 0; border-bottom: 1px dashed #eee;">
              <div>
                <strong>#${b.id}</strong> — ${b.serviceName}<br>
                <small style="color:#888;">${b.timeSlot} ${SalonUtils.formatDate(b.date)} (${b.stylistName})</small>
              </div>
              <span class="status-badge status-${b.status}">${b.status === 'confirmed' ? 'Đã duyệt' : b.status}</span>
            </div>
          `).join('')}
        </div>

        <div class="app-card-block" style="margin-top: 16px;">
          <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px;">TIỆN ÍCH HỆ THỐNG</h4>
          <button class="pill-btn-outline" style="width:100%; margin-bottom: 8px; font-size: 13px;" onclick="UIApp.openPlayStoreModal()">
            ⭐ Xem Trang Cài Đặt Trên Google Play (CH Play)
          </button>
          <button class="btn-submit-terracotta" style="width:100%; font-size: 13px;" onclick="window.location.href='index.html';">
            👑 Chuyển Sang Quản Trị Hệ Thống (Bản Web) →
          </button>
        </div>
      </div>
    `;
  },

  // --- Màn hình giả lập Google Play Store (CH Play) ---
  openPlayStoreModal() {
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="playstore-modal-surface">
        <!-- Play Store Top Header -->
        <div class="playstore-top-bar">
          <div style="display:flex; align-items:center; gap: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5.31 0 .6.1.84.27l12.44 8.5-4.5 4.5L3 20.5z"/>
              <path fill="#FBBC04" d="M16.94 15.27L12.44 10.77 3 20.5c.34.19.78.22 1.25-.05l12.69-5.18z"/>
              <path fill="#EA4335" d="M16.94 8.73L4.25 3.55c-.47-.27-.91-.24-1.25-.05l9.44 9.73 4.5-4.5z"/>
              <path fill="#34A853" d="M21.19 10.45l-4.25-1.72-4.5 4.5 4.5 4.5 4.25-1.72c1.08-.44 1.08-1.56 0-2.06z"/>
            </svg>
            <span style="font-weight: 700; color: #202124; font-size: 16px;">Google Play</span>
          </div>
          <button class="modal-close-icon-btn" onclick="UICommon.closeGlobalModal()" style="color:#555;">✕</button>
        </div>

        <!-- Chi tiết App -->
        <div class="playstore-app-intro">
          <div class="playstore-app-icon">4R</div>
          <div class="playstore-app-meta">
            <h3 class="app-title">4RAU Barbershop</h3>
            <span class="app-dev">4RAU Barber CutClub & Co.</span>
            <div class="app-tags">Chứa quảng cáo • Mua hàng trong ứng dụng</div>
          </div>
        </div>

        <!-- Thống kê đánh giá -->
        <div class="playstore-stats-strip">
          <div class="stat-cell">
            <strong>4.9 ★</strong>
            <span>18.5K bài đánh giá</span>
          </div>
          <div class="stat-cell">
            <strong>50.000+</strong>
            <span>Lượt tải xuống</span>
          </div>
          <div class="stat-cell">
            <span class="age-badge">3+</span>
            <span>Phù hợp mọi lứa tuổi</span>
          </div>
        </div>

        <!-- Nút Cài Đặt (Màu xanh lá CH Play) -->
        <button class="btn-playstore-install" onclick="UIApp.triggerPwaInstall()">
          Cài Đặt Ứng Dụng (Download APK / PWA)
        </button>

        <div style="font-size: 13px; color: #5f6368; line-height: 1.5; margin-top: 16px;">
          Ứng dụng chính thức của chuỗi <strong>4RAU Barbershop</strong>. Cho phép bạn đặt lịch hẹn cắt tóc chống trùng giờ với Master Barber Hà Hiền, đổi kiểu tóc bằng AI và mua sắm sáp Pomade Brosh chính hãng.
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  triggerPwaInstall() {
    UICommon.showToast('📲 Đang tải ứng dụng 4RAU Barbershop về thiết bị của bạn...');
    setTimeout(() => {
      UICommon.showToast('✅ Ứng dụng đã sẵn sàng trên màn hình chính của bạn!');
      UICommon.closeGlobalModal();
    }, 1500);
  }
};


// -------------------------------------------------------------------------
// 3. PLATFORM COORDINATOR (ĐIỀU HƯỚNG WEB & APP CHUẨN ĐỘC LẬP)
// -------------------------------------------------------------------------

window.UIApp = UIApp;
