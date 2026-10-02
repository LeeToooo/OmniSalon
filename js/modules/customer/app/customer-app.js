// ============================================================================
// OmniSalon & 4RAU Barbershop Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG TRÊN MOBILE APP (MOBILE CUSTOMER PLATFORM)
// Phiên bản: 11.0 Clean Architecture, Native Mobile Touch-Optimized
// Tuân thủ: .antigravity/rules/03_coder.md, 07_ponytail.md, 08_caveman.md & docs/file_plan.json (TASK-08-MOBILE-CUSTOMER)
// ============================================================================

(function (window) {
  'use strict';

  const CustomerApp = {
    // -----------------------------------------------------------------------
    // 1. STATE MANAGEMENT
    // -----------------------------------------------------------------------
    activeTab: 'home', // 'home' | 'booking' | 'ai' | 'shop' | 'profile'
    carouselIndex: 0,
    carouselTimer: null,
    shopBrand: 'all', // 'all' | 'brosh' | '4rau' | 'reuzel'
    shopSearchQuery: '',
    profileSubTab: 'bookings', // 'bookings' | 'orders' | 'rewards'

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
    // 2. INITIALIZATION & ROUTING
    // -----------------------------------------------------------------------
    init(defaultTab = 'home') {
      const hash = (window.location.hash || '').replace('#', '');
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') || hash;
      const validTabs = ['home', 'booking', 'ai', 'shop', 'profile'];
      
      this.activeTab = validTabs.includes(tabParam) ? tabParam : defaultTab;
      this.startCarouselAutoPlay();

      if (window.store && !this._storeSubscribed) {
        this._storeSubscribed = true;
        window.store.subscribe(() => {
          this.refreshCurrentView();
        });
      }
    },

    switchTab(tabName) {
      if (!['home', 'booking', 'ai', 'shop', 'profile'].includes(tabName)) return;
      this.activeTab = tabName;
      if (window.AppState) window.AppState.set('activeTab', tabName);

      // Đồng bộ với UIApp nếu đang chạy bên trong khung app.html
      if (window.UIApp) {
        window.UIApp.currentTab = tabName;
      }

      const scrollContainer = document.getElementById('androidScrollContent');
      if (scrollContainer) {
        scrollContainer.innerHTML = this.renderTabContent(tabName);
        scrollContainer.scrollTop = 0;

        if (tabName === 'ai' && this.aiState.resultImage && !this.aiState.isProcessing) {
          setTimeout(() => this.initCompareSlider(), 60);
        }
      }

      // Cập nhật trạng thái active thanh Bottom Navigation
      const items = document.querySelectorAll('.bottom-nav-item');
      items.forEach(it => {
        const onclickAttr = it.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${tabName}'`)) {
          it.classList.add('active');
        } else {
          it.classList.remove('active');
        }
      });
    },

    refreshCurrentView() {
      const scrollContainer = document.getElementById('androidScrollContent');
      if (scrollContainer) {
        scrollContainer.innerHTML = this.renderTabContent(this.activeTab);
        if (this.activeTab === 'ai' && this.aiState.resultImage && !this.aiState.isProcessing) {
          setTimeout(() => this.initCompareSlider(), 60);
        }
      }
      if (window.UICommon && typeof window.UICommon.updateCartBadges === 'function') {
        window.UICommon.updateCartBadges();
      }
    },

    renderTabContent(tabName) {
      switch (tabName || this.activeTab) {
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

    // -----------------------------------------------------------------------
    // 3. UTILITIES, MODALS & DRY RESOLVERS
    // -----------------------------------------------------------------------
    getCurrentUser() {
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        return window.AuthEngine.getCurrentUser();
      }
      if (window.store && typeof window.store.getCurrentUser === 'function') {
        return window.store.getCurrentUser();
      }
      return null;
    },

    isStaffUser(user) {
      const u = user || this.getCurrentUser();
      if (!u || !u.role) return false;
      const staffRoles = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'STYLIST'];
      return staffRoles.includes(String(u.role).toUpperCase());
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

    _openModal(htmlContent) {
      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;
      modalBody.innerHTML = htmlContent;
      modal.classList.add('active');
    },

    _closeModal() {
      if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
        window.UICommon.closeGlobalModal();
      } else {
        const modal = document.getElementById('globalModal');
        if (modal) modal.classList.remove('active');
      }
    },

    _matchesBrand(product, brand) {
      if (!brand || brand === 'all') return true;
      const target = `${product.name || ''} ${product.brand || ''}`.toLowerCase();
      if (brand === 'brosh') return target.includes('brosh');
      if (brand === '4rau') return target.includes('4rau');
      if (brand === 'reuzel') return target.includes('reuzel');
      return true;
    },

    _filterProducts(allProducts, brand, query) {
      const q = (query || '').trim().toLowerCase();
      return allProducts.filter(p => {
        if (!this._matchesBrand(p, brand)) return false;
        if (q) {
          const matchName = (p.name || '').toLowerCase().includes(q);
          const matchDesc = (p.description || '').toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }
        return true;
      });
    },

    _getUserBookings(user, bookingsList = null) {
      const u = user || this.getCurrentUser();
      const all = bookingsList || ((window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : []);
      if (!u) return [];
      if (this.isStaffUser(u)) return all;
      return all.filter(b => 
        (b.userId && b.userId === u.id) ||
        (b.customerPhone && u.phone && b.customerPhone.trim() === u.phone.trim()) ||
        (b.customerEmail && u.email && b.customerEmail.trim().toLowerCase() === u.email.trim().toLowerCase())
      );
    },

    _getUserOrders(user, ordersList = null) {
      const u = user || this.getCurrentUser();
      const all = ordersList || ((window.store && typeof window.store.getOrders === 'function') ? window.store.getOrders() : []);
      if (!u) return this._getDemoOrders(null);
      if (this.isStaffUser(u)) return all;
      const userOrders = all.filter(o =>
        (o.userId && o.userId === u.id) ||
        (o.customerPhone && u.phone && o.customerPhone.trim() === u.phone.trim())
      );
      return userOrders.length > 0 ? userOrders : this._getDemoOrders(u);
    },

    _getDemoOrders(user = null) {
      return [
        {
          id: 'ORD-DEMO-2026',
          status: 'SHIPPING',
          orderType: 'DELIVERY',
          items: [{ id: 'prod-best-1', name: 'Sáp Brosh Pomade Original Japan', qty: 1 }],
          total: 380000,
          customerName: user ? user.name : 'Khách Omni Salon'
        }
      ];
    },

    _formatBookingStatus(status) {
      const s = String(status || '').toLowerCase();
      if (s === 'confirmed') return { label: 'Đã Xác Nhận', cssClass: 'status-confirmed' };
      if (s === 'completed') return { label: 'Đã Hoàn Tất', cssClass: 'status-completed' };
      if (s === 'in_progress') return { label: 'Đang Cắt', cssClass: 'status-in_progress' };
      if (s === 'cancelled') return { label: 'Đã Hủy', cssClass: 'status-cancelled' };
      return { label: status || 'Chờ Duyệt', cssClass: `status-${s}` };
    },

    _getOrderTimelineProgress(status) {
      const s = String(status || 'PENDING').toUpperCase();
      const isProcessing = ['PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED'].includes(s);
      const isShipping = ['SHIPPING', 'DELIVERED', 'COMPLETED'].includes(s);
      const isDelivered = ['DELIVERED', 'COMPLETED'].includes(s);
      const width = isDelivered ? '100%' : (isShipping ? '66%' : (isProcessing ? '33%' : '0%'));
      return { isProcessing, isShipping, isDelivered, width };
    },

    // -----------------------------------------------------------------------
    // 4. TAB 1: TRANG CHỦ (HOME TAB WITH CAROUSEL & QUICK ACTIONS)
    // -----------------------------------------------------------------------
    startCarouselAutoPlay() {
      if (this.carouselTimer) clearInterval(this.carouselTimer);
      this.carouselTimer = setInterval(() => {
        if (this.activeTab === 'home') {
          this.carouselIndex = (this.carouselIndex + 1) % 3;
          this.updateCarouselDOM();
        }
      }, 5000);
    },

    setCarouselSlide(index) {
      this.carouselIndex = index;
      if (window.AppState) window.AppState.set('carouselIndex', index);
      this.updateCarouselDOM();
      this.startCarouselAutoPlay(); // Reset timer khi người dùng chạm đổi slide
    },

    updateCarouselDOM() {
      const track = document.getElementById('appHomeCarouselTrack');
      const dots = document.querySelectorAll('.app-carousel-dot');
      if (track) {
        track.style.transform = `translateX(-${this.carouselIndex * 100}%)`;
      }
      dots.forEach((d, idx) => {
        if (idx === this.carouselIndex) d.classList.add('active');
        else d.classList.remove('active');
      });
    },

    renderHomeTab() {
      const branch = (window.store && typeof window.store.getCurrentBranch === 'function')
        ? window.store.getCurrentBranch()
        : { id: 'br-dbp', name: 'Omni Salon Điện Biên Phủ (Quận 10)' };
      const bestProducts = (window.store && typeof window.store.getProducts === 'function')
        ? window.store.getProducts('best').slice(0, 4)
        : [];
      const services = (window.store && typeof window.store.getServices === 'function')
        ? window.store.getServices().slice(0, 4)
        : [];
      const moments = (window.store && typeof window.store.getMoments === 'function')
        ? window.store.getMoments().slice(0, 6)
        : [];
      const stylists = (window.store && typeof window.store.getStylists === 'function')
        ? window.store.getStylists()
        : [];
      const topStylists = stylists.slice(0, 5);
      const user = this.getCurrentUser();

      const stories = [
        { id: 'st-1', label: 'Fade Layer', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=150&q=80' },
        { id: 'st-2', label: 'Premlock', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=150&q=80' },
        { id: 'st-3', label: 'Wolf Cut', image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=150&q=80' },
        { id: 'st-4', label: 'Pompadour', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
        { id: 'st-5', label: 'Tẩy Khói', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
        { id: 'st-6', label: 'Hot Shave', image: 'https://images.unsplash.com/photo-1517832606589-7629c3395909?auto=format&fit=crop&w=150&q=80' }
      ];

      return `
        <div class="app-home-page" style="padding-bottom: 70px; position: relative;">
          
          <!-- 0. Header Tối Giản Dạng Pill-Bar + Avatar -->
          <div class="mobile-pill-header" style="padding: 12px 14px 6px; display: flex; align-items: center; gap: 10px;">
            <div class="mobile-search-pill" style="flex: 1; display: flex; align-items: center; gap: 8px; background: #1A1D26; border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; padding: 8px 14px; cursor: pointer;" onclick="CustomerApp.switchTab('shop')">
              <span style="font-size: 14px; color: #94A3B8;">🔍</span>
              <span style="font-size: 12.5px; color: #94A3B8;">Tìm dịch vụ, sáp vuốt, stylist...</span>
            </div>
            <div class="mobile-header-user-avatar" onclick="CustomerApp.switchTab('profile')" style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--color-accent-gold, #D4AF37); overflow: hidden; cursor: pointer; flex-shrink: 0;">
              <img src="${user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="User">
            </div>
          </div>

          <!-- 0.1. Thanh Stories / Highlights Hình Tròn (Instagram-style) -->
          <div class="mobile-stories-strip" style="display: flex; gap: 14px; overflow-x: auto; padding: 10px 14px 14px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
            ${stories.map(st => `
              <div class="mobile-story-item" onclick="CustomerApp.viewStory('${st.id}')" style="display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; flex-shrink: 0;">
                <div class="mobile-story-ring" style="width: 60px; height: 60px; border-radius: 50%; padding: 2px; background: linear-gradient(45deg, #D4AF37, #C85A44, #F59E0B); display: flex; align-items: center; justify-content: center;">
                  <img src="${st.image}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #0B0D13;" alt="${st.label}">
                </div>
                <span style="font-size: 10.5px; font-weight: 700; color: #FFF; max-width: 62px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${st.label}</span>
              </div>
            `).join('')}
          </div>

          <!-- 1. Native Carousel Banner Slider -->
          <div class="app-carousel-container">
            <div class="app-carousel-track" id="appHomeCarouselTrack" style="transform: translateX(-${this.carouselIndex * 100}%);">
              <!-- Slide 1: Đặt lịch AI -->
              <div class="app-carousel-slide">
                <div class="app-hero-card" style="background: linear-gradient(135deg, #1c1b18 0%, #2e1e19 100%); padding: 20px 18px; color: #fff; min-height: 160px; display:flex; flex-direction:column; justify-content:space-between; border: 1px solid rgba(200,90,68,0.3); border-radius: 18px;">
                  <div>
                    <div style="font-size: 10px; font-weight: 800; color: var(--color-accent-gold); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">✨ OMNI SALON BOUTIQUE APP</div>
                    <h2 style="font-size: 19px; font-weight: 900; line-height: 1.25; margin-bottom: 6px;">OMNI SALON — THE ART OF MODERN HAIR CARE &amp; GROOMING</h2>
                    <p style="font-size: 11px; color: #d1d5db; margin: 0;">18+ Chi nhánh toàn quốc — Đặt chỗ giữ ca tức thì</p>
                  </div>
                  <div style="display: flex; gap: 8px; margin-top: 14px;">
                    <button class="btn-submit-terracotta" style="padding: 7px 14px; font-size: 11px;" onclick="CustomerApp.switchTab('booking')">
                      📅 ĐẶT LỊCH NGAY
                    </button>
                    <button class="pill-btn-outline" style="padding: 7px 12px; font-size: 11px; color: #fff; border-color: rgba(255,255,255,0.4);" onclick="CustomerApp.switchTab('ai')">
                      ⚡ THỬ TÓC AI
                    </button>
                  </div>
                </div>
              </div>

              <!-- Slide 2: Sáp Brosh Japan -->
              <div class="app-carousel-slide">
                <div class="app-hero-card" style="background: linear-gradient(135deg, #182825 0%, #111a18 100%); padding: 20px 18px; color: #fff; min-height: 160px; display:flex; flex-direction:column; justify-content:space-between; border: 1px solid rgba(16,185,129,0.3); border-radius: 18px;">
                  <div>
                    <div style="font-size: 10px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">🇯🇵 BROSH JAPAN CHÍNH HÃNG</div>
                    <h2 style="font-size: 19px; font-weight: 900; line-height: 1.25; margin-bottom: 6px;">BỘ SƯU TẬP POMADE 2026</h2>
                    <p style="font-size: 11px; color: #d1d5db; margin: 0;">Độ giữ nếp chuẩn Barber Nhật, mùi hương nam tính cổ điển</p>
                  </div>
                  <div style="display: flex; gap: 8px; margin-top: 14px;">
                    <button class="btn-submit-terracotta" style="padding: 7px 14px; font-size: 11px; background: #059669; border-color: #059669;" onclick="CustomerApp.switchTab('shop'); CustomerApp.setShopBrand('brosh');">
                      🛍️ XEM BỘ SƯU TẬP
                    </button>
                  </div>
                </div>
              </div>

              <!-- Slide 3: Ưu đãi Voucher -->
              <div class="app-carousel-slide">
                <div class="app-hero-card" style="background: linear-gradient(135deg, #2b1f13 0%, #45241b 100%); padding: 20px 18px; color: #fff; min-height: 160px; display:flex; flex-direction:column; justify-content:space-between; border: 1px solid rgba(245,158,11,0.3); border-radius: 18px;">
                  <div>
                    <div style="font-size: 10px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">🎟️ MÃ ƯU ĐÃI THÀNH VIÊN</div>
                    <h2 style="font-size: 19px; font-weight: 900; line-height: 1.25; margin-bottom: 6px;">GIẢM 50K CHO LẦN ĐẶT ĐẦU</h2>
                    <p style="font-size: 11px; color: #d1d5db; margin: 0;">Nhập mã <strong>4RAUWELCOME</strong> tại bước thanh toán</p>
                  </div>
                  <div style="display: flex; gap: 8px; margin-top: 14px;">
                    <button class="btn-submit-terracotta" style="padding: 7px 14px; font-size: 11px;" onclick="CustomerApp.switchTab('booking')">
                      ✂️ DÙNG MÃ NGAY
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dots Indicator -->
            <div class="app-carousel-dots">
              <span class="app-carousel-dot ${this.carouselIndex === 0 ? 'active' : ''}" onclick="CustomerApp.setCarouselSlide(0)"></span>
              <span class="app-carousel-dot ${this.carouselIndex === 1 ? 'active' : ''}" onclick="CustomerApp.setCarouselSlide(1)"></span>
              <span class="app-carousel-dot ${this.carouselIndex === 2 ? 'active' : ''}" onclick="CustomerApp.setCarouselSlide(2)"></span>
            </div>
          </div>

          <!-- 2. Quick Actions Grid (4 Nút Lối Tắt) -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 0 14px 16px;">
            <button class="app-quick-tile" onclick="CustomerApp.switchTab('booking')" style="background:#1A1D26; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <span style="font-size: 22px;">📅</span>
              <span style="font-size: 11px; font-weight: 700; color: #FFF;">Đặt Lịch</span>
            </button>
            <button class="app-quick-tile" onclick="CustomerApp.switchTab('ai')" style="background:#1A1D26; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <span style="font-size: 22px;">💈</span>
              <span style="font-size: 11px; font-weight: 700; color: #FFF;">Thử Tóc AI</span>
            </button>
            <button class="app-quick-tile" onclick="CustomerApp.switchTab('shop')" style="background:#1A1D26; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <span style="font-size: 22px;">🛍️</span>
              <span style="font-size: 11px; font-weight: 700; color: #FFF;">Cửa Hàng</span>
            </button>
            <button class="app-quick-tile" onclick="UICommon.openBranchModal('${branch?.id || 'br-dbp'}')" style="background:#1A1D26; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <span style="font-size: 22px;">📍</span>
              <span style="font-size: 11px; font-weight: 700; color: #FFF;">Cơ Sở</span>
            </button>
          </div>

          <!-- 2.1. Top Stylists Horizontal Scroll List -->
          <div style="margin: 0 14px 20px;">
            <div style="display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
              <h3 style="font-size: 15px; font-weight: 800; text-transform: uppercase; color: #FFFFFF; letter-spacing: 0.02em;">TOP MASTER STYLISTS</h3>
              <span style="font-size: 11px; color: var(--color-accent-gold, #D4AF37); font-weight: 700;">★ 4.9+ Tuyển Chọn</span>
            </div>
            <div class="mobile-horizontal-scroll" style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
              ${topStylists.map(st => `
                <div class="mobile-stylist-chip-card" style="flex: 0 0 140px; background: #131722; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 10px; text-align: center;">
                  <img src="${st.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #D4AF37; margin: 0 auto 6px;" alt="${st.name}">
                  <div style="font-size: 12.5px; font-weight: 800; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${st.name}</div>
                  <div style="font-size: 10.5px; color: #D4AF37; margin: 2px 0;">★ ${st.rating || '4.9'} (${st.experience || '6 năm'})</div>
                  <button type="button" class="btn-submit-terracotta" style="padding: 4px 8px; font-size: 10.5px; width: 100%; margin-top: 6px;" onclick="UICommon.openBookingModal(null, null, '${st.id}')">
                    Đặt Ca
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 3. Current Branch Info Banner -->
          <div style="margin: 0 14px 18px; padding: 12px 14px; background: #131722; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display:flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">📍</span>
              <div>
                <div style="font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Chi nhánh đang chọn:</div>
                <div style="font-size: 13px; font-weight: 800; color: #FFFFFF;">${this.escapeHtml(branch ? branch.name.split('—')[0] : 'Omni Salon')}</div>
              </div>
            </div>
            <button class="pill-btn-outline" style="font-size: 11px; padding: 5px 12px; color: #FFF;" onclick="UICommon.openBranchModal('${branch?.id || 'br-dbp'}')">
              Đổi
            </button>
          </div>

          <!-- 4. Dịch Vụ Nổi Bật -->
          <div style="margin: 0 14px 20px;">
            <div style="display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
              <h3 style="font-size: 15px; font-weight: 800; text-transform: uppercase; color: #FFFFFF;">DỊCH VỤ NỔI BẬT</h3>
              <a href="javascript:void(0)" onclick="CustomerApp.switchTab('booking')" style="font-size: 12px; font-weight: 700; color: var(--color-accent-gold, #D4AF37); text-decoration:none;">Xem tất cả →</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${window.ServiceCardWidget ? services.map(s => window.ServiceCardWidget.render(s, {
                onClickHandler: `UICommon.openBookingModal('${s.id}')`
              })).join('') : services.map(s => `
                <div style="background: #131722; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 13px; font-weight: 700; color: #FFF;">${this.escapeHtml(s.name)}</div>
                    <div style="font-size: 12px; font-weight: 800; color: var(--color-accent-gold); margin-top: 3px;">${SalonUtils.formatCurrency(s.price)}</div>
                  </div>
                  <button class="btn-submit-terracotta" style="padding: 6px 14px; font-size: 11px;" onclick="UICommon.openBookingModal('${s.id}')">
                    Đặt Lịch
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 5. Sản Phẩm Bán Chạy -->
          <div style="margin: 0 14px 20px;">
            <div style="display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
              <h3 style="font-size: 15px; font-weight: 800; text-transform: uppercase; color: #FFFFFF;">SẢN PHẨM BÁN CHẠY</h3>
              <a href="javascript:void(0)" onclick="CustomerApp.switchTab('shop')" style="font-size: 12px; font-weight: 700; color: var(--color-accent-gold, #D4AF37); text-decoration:none;">Vào Shop →</a>
            </div>
            <div class="app-store-grid-2">
              ${bestProducts.map(p => UICommon.renderProductCard(p, true)).join('')}
            </div>
          </div>

          <!-- 6. Khoảnh Khắc Bạn Đến Nhà -->
          <div style="margin: 0 14px 16px;">
            <div style="display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
              <h3 style="font-size: 15px; font-weight: 800; text-transform: uppercase; color: #FFFFFF;">OMNI SALON MOMENTS</h3>
            </div>
            <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
              ${moments.map(m => `
                <div style="flex: 0 0 140px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: #131722;">
                  <img src="${m.image}" alt="${this.escapeHtml(m.title)}" style="width: 140px; height: 140px; object-fit: cover;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';">
                  <div style="padding: 6px 8px; font-size: 11px; font-weight: 600; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(m.title)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 7. Floating Action Button (FAB) Đặt Lịch Nổi Bật Kèm Rung Nhẹ -->
          <button type="button" class="mobile-booking-fab" onclick="CustomerApp.switchTab('booking')" title="Đặt Lịch Ngay">
            <span style="font-size: 18px;">📅</span>
            <span>ĐẶT LỊCH NGAY</span>
          </button>

        </div>
      `;
    },

    viewStory(storyId) {
      if (window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`✨ Đang phát Lookbook xu hướng Omni Salon: #${storyId}`);
      }
    },

    // -----------------------------------------------------------------------
    // 5. TAB 2: ĐẶT LỊCH (NATIVE TOUCH-OPTIMIZED 85% BOTTOM SHEET WIZARD)
    // -----------------------------------------------------------------------
    renderBookingTab() {
      return `
        <div class="mobile-booking-sheet-wrapper" style="padding: 10px 10px 30px;">
          <div id="androidBookingTabContainer" class="mobile-booking-bottom-sheet">
            <div class="sheet-drag-handle" style="width: 40px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.25); margin: 6px auto 14px;"></div>
            ${UICommon.renderBookingWizardHTML()}
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // 6. TAB 3: THỬ TÓC AI (AI BARBER STUDIO WITH BEFORE/AFTER SLIDER)
    // -----------------------------------------------------------------------
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
        <div class="app-ai-mobile-page" style="padding: 14px 14px 30px; background: #121216; color: #fff;">
          <!-- Top App Badge & Header -->
          <div style="margin-bottom: 12px;">
            <div class="badge-terracotta pulse-animation" style="font-size: 10px;">CÔNG NGHỆ AI RESTYLE 2026</div>
            <h3 style="font-size: 19px; font-weight: 900; margin: 6px 0 2px; color: #fff; letter-spacing: -0.01em;">OMNI SALON AI STUDIO</h3>
            <p style="font-size: 11px; color: #9ca3af; margin: 0;">Chụp hoặc tải ảnh để biến đổi kiểu tóc xu hướng & xem kết quả tức thì</p>
          </div>

          <!-- Khung hiển thị ảnh / Scan / Compare slider -->
          <div class="app-ai-card" style="padding: 10px; margin-bottom: 12px; background: #1c1c24; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;">
            ${
              !originalImage
                ? `
                <div class="ai-upload-dropzone" onclick="document.getElementById('appAiPhotoFileInput').click()" style="padding: 24px 12px; text-align: center; cursor: pointer;">
                  <input type="file" id="appAiPhotoFileInput" accept="image/*" style="display:none;" onchange="CustomerApp.handleAiUpload(event)">
                  <input type="file" id="appAiCameraInput" accept="image/*" capture="user" style="display:none;" onchange="CustomerApp.handleAiUpload(event)">

                  <div class="dropzone-icon-box" style="width: 52px; height: 52px; margin: 0 auto 10px; background: rgba(200,90,68,0.15); border-radius: 50%; display:flex; align-items:center; justify-content:center; color: var(--color-terracotta);">
                    <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <div style="font-size: 13px; font-weight: 800; color: #fff;">Chạm để Chọn hoặc Chụp ảnh chân dung</div>
                  <div style="font-size: 11px; color: #9ca3af; margin-top: 4px; margin-bottom: 12px;">AI tự động nhận diện dáng mặt và chân tóc</div>

                  <div style="display: flex; gap: 8px; justify-content: center;" onclick="event.stopPropagation();">
                    <button type="button" class="btn-sub-action" style="font-size: 11px; padding: 7px 12px; background: #2a2a36; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;" onclick="document.getElementById('appAiCameraInput').click()">
                      📸 Chụp Selfie
                    </button>
                    <button type="button" class="btn-sub-action" style="font-size: 11px; padding: 7px 12px; background: #2a2a36; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;" onclick="document.getElementById('appAiPhotoFileInput').click()">
                      📁 Thư Viện Ảnh
                    </button>
                  </div>

                  <div class="sample-avatar-strip" style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1);" onclick="event.stopPropagation();">
                    <span style="font-size: 10px; color: #9ca3af; font-weight: 700; display: block; margin-bottom: 8px; text-transform: uppercase;">HOẶC THỬ NHANH VỚI ẢNH MẪU:</span>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80" 
                           class="sample-avatar-thumb" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-terracotta); cursor: pointer;" title="Mẫu Nam 1" onclick="CustomerApp.loadSampleAi(this.src)">
                      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80" 
                           class="sample-avatar-thumb" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-terracotta); cursor: pointer;" title="Mẫu Nam 2" onclick="CustomerApp.loadSampleAi(this.src)">
                      <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80" 
                           class="sample-avatar-thumb" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-terracotta); cursor: pointer;" title="Mẫu Nam 3" onclick="CustomerApp.loadSampleAi(this.src)">
                    </div>
                  </div>
                </div>
                `
                : isProcessing
                ? `
                <div class="ai-processing-container" style="padding: 16px 8px; text-align: center;">
                  <div class="ai-scan-box" style="max-height: 280px; position: relative; overflow: hidden; border-radius: 12px;">
                    <img src="${originalImage}" class="ai-base-img" style="max-height: 280px; width: 100%; object-fit: cover;" alt="Scanning">
                    <div class="ai-scan-laser-line"></div>
                  </div>
                  <div class="barber-pole-spinner" style="width: 36px; height: 36px; margin: 12px auto 6px;"></div>
                  <div style="font-size: 13px; font-weight: 800; color: #fff; margin-top: 8px;">
                    AI RESTYLE ĐANG BIẾN ĐỔI KIỂU TÓC...
                  </div>
                  <div class="ai-status-step-text" id="appAiStatusStep" style="font-size: 11px; color: #9ca3af; margin-top: 4px;">Đang phân tích cấu trúc khuôn mặt & đường chân tóc...</div>
                </div>
                `
                : resultImage
                ? `
                <div class="ai-compare-slider-shell">
                  <div class="ai-image-compare-wrapper" id="appCompareWrapper" style="height: 310px; position: relative; overflow: hidden; border-radius: 14px;">
                    <img src="${resultImage}" class="compare-img compare-img-after" style="width: 100%; height: 100%; object-fit: cover;" alt="Ảnh Sau Đổi Tóc">
                    <span class="compare-label-after" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px;">✨ TÓC MỚI</span>

                    <div class="compare-before-clip" id="appCompareBeforeClip" style="width: 50%; position: absolute; top:0; left:0; height: 100%; overflow: hidden;">
                      <img src="${originalImage}" class="compare-img compare-img-before" style="width: 100%; height: 100%; object-fit: cover;" alt="Ảnh Gốc">
                      <span class="compare-label-before" style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px;">ẢNH GỐC</span>
                    </div>

                    <div class="compare-divider-handle" id="appCompareHandle" style="position: absolute; top:0; bottom:0; left: 50%; width: 2px; background: #fff; transform: translateX(-50%); cursor: ew-resize;">
                      <div class="handle-circle" style="width: 26px; height: 26px; border-radius: 50%; background: #fff; color: #111; font-weight: 900; font-size: 12px; display: flex; align-items: center; justify-content: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); box-shadow: 0 2px 6px rgba(0,0,0,0.4);">↔</div>
                    </div>
                  </div>

                  <div class="compare-hint-bar" style="margin-top: 8px; text-align: center; font-size: 11px; color: #9ca3af;">
                    <span>👈 Chạm & vuốt sang trái/phải để so sánh 👉</span>
                  </div>

                  <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <button class="btn-sub-action" style="flex: 1; font-size: 11px; padding: 9px; background: #262632; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;" onclick="CustomerApp.downloadAiResult()">
                      📥 Tải Ảnh Về Máy
                    </button>
                    <button class="btn-sub-action" style="flex: 1; font-size: 11px; padding: 9px; background: #262632; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;" onclick="CustomerApp.resetAi()">
                      🔄 Đổi Ảnh Khác
                    </button>
                  </div>
                </div>
                `
                : `
                <div class="ai-ready-preview-box">
                  <div class="ready-img-wrap" style="max-height: 290px; position: relative; overflow: hidden; border-radius: 12px;">
                    <img src="${originalImage}" class="ready-preview-img" style="max-height: 290px; width: 100%; object-fit: cover;" alt="Ảnh Chân Dung">
                    <span class="ready-tag" style="position: absolute; top: 10px; left: 10px; background: #059669; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px;">ẢNH SẴN SÀNG</span>
                    <button class="btn-change-photo-mini" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #fff; border: none; font-size: 11px; padding: 4px 10px; border-radius: 6px;" onclick="CustomerApp.resetAi()">Đổi ảnh</button>
                  </div>
                  <div style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 8px;">
                    Đã nhận diện khuôn mặt. Hãy chọn kiểu tóc & màu nhuộm bên dưới rồi bấm <strong>Biến Đổi</strong>!
                  </div>
                </div>
                `
            }
          </div>

          <!-- 1. CHỌN KIỂU TÓC HOT TREND -->
          <div class="app-ai-card" style="background: #1c1c24; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; margin-bottom: 12px;">
            <div class="app-ai-card-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase;">1. CHỌN KIỂU TÓC HOT TREND</span>
              <span class="badge-selected-tag" style="font-size: 11px; font-weight: 800; color: var(--color-terracotta);">${this.escapeHtml(selectedStyle)}</span>
            </div>
            <div class="app-style-scroll-row">
              ${stylePresets.map(s => `
                <div class="app-style-chip ${selectedStyle === s.name ? 'active' : ''}" onclick="CustomerApp.selectAiStyle('${s.name}')">
                  <span>${s.icon}</span>
                  <span>${s.name}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 2. CHỌN MÀU NHUỘM TÓC -->
          <div class="app-ai-card" style="background: #1c1c24; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; margin-bottom: 12px;">
            <div class="app-ai-card-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase;">2. CHỌN MÀU NHUỘM</span>
              <span style="font-size: 11px; font-weight: 800; color: #c85a44;">${this.escapeHtml(selectedColorName)}</span>
            </div>
            <div class="app-color-row">
              ${colorPresets.map(c => `
                <button type="button" class="app-color-item ${selectedColorName === c.name ? 'active' : ''}" onclick="CustomerApp.selectAiColor('${c.name}', '${c.hex}')" title="${c.name}">
                  <span class="app-color-dot" style="background: ${c.hex};"></span>
                  <span class="app-color-name">${c.name}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 3. GHI CHÚ YÊU CẦU THÊM -->
          <div class="app-ai-card" style="background: #1c1c24; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px; margin-bottom: 14px;">
            <div class="app-ai-card-title" style="font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin-bottom: 6px;">
              3. GHI CHÚ YÊU CẦU CHO AI (TÙY CHỌN)
            </div>
            <input type="text" id="appAiCustomPromptInput" class="ai-custom-input"
                   placeholder="Ví dụ: Cạo sát chân tóc, uốn sóng phồng, vuốt bóng..."
                   value="${this.escapeHtml(this.aiState.customPrompt || '')}"
                   onchange="CustomerApp.aiState.customPrompt = this.value"
                   style="width:100%; box-sizing:border-box; background: #262632; border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px;">
          </div>

          <!-- 4. NÚT HÀNH ĐỘNG CHÍNH -->
          <div style="margin-top: 10px; margin-bottom: 16px;">
            ${!resultImage ? `
              <button type="button" class="btn-execute-ai" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 800; background: var(--color-terracotta); color: #fff; border: none; border-radius: 12px; cursor: pointer;" onclick="CustomerApp.processAiRestyle()" ${!originalImage || isProcessing ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                ⚡ BẮT ĐẦU ĐỔI KIỂU TÓC AI →
              </button>
            ` : `
              <button type="button" class="btn-submit-terracotta btn-book-now-ai" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 800; border-radius: 12px;" onclick="CustomerApp.bookAiHairstyle()">
                📅 ĐẶT LỊCH CẮT KIỂU TÓC NÀY NGAY →
              </button>
              <button type="button" class="btn-execute-ai" style="width: 100%; margin-top: 8px; background: #262632; color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 10px; font-size: 12px; font-weight: 700; border-radius: 10px; cursor: pointer;" onclick="CustomerApp.processAiRestyle()">
                ✨ Thử Kiểu Tóc Hoặc Màu Khác
              </button>
            `}
          </div>

          <!-- 5. CÀI ĐẶT API PROVIDER -->
          <div style="text-align: center; margin-bottom: 24px;">
            <button type="button" class="btn-text-toggle" style="background:none; border:none; font-size: 11px; color: #6b7280; cursor: pointer;" onclick="CustomerApp.toggleAiApiSettings()">
              ⚙️ Cài đặt AI Vision API (${this.escapeHtml(aiConfig.provider)})
            </button>
            ${showApiSettings ? `
              <div class="ai-settings-collapsible" style="text-align: left; margin-top: 10px; background: #1c1c24; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px;">
                <div style="font-size: 11px; font-weight: 800; color: #fff; margin-bottom: 8px;">CẤU HÌNH API VISION TRÊN APP:</div>
                <div class="api-form-row" style="margin-bottom: 8px;">
                  <label style="font-size: 10px; color: #9ca3af; display:block; margin-bottom: 2px;">Nhà Cung Cấp:</label>
                  <select id="appAiProviderSelect" class="api-input-control" style="width:100%; font-size: 12px; padding: 6px 8px; background: #262632; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;">
                    <option value="demo_smart" ${aiConfig.provider === 'demo_smart' ? 'selected' : ''}>Omni Neural Engine (Sẵn có - Không cần Key)</option>
                    <option value="huggingface" ${aiConfig.provider === 'huggingface' ? 'selected' : ''}>Hugging Face Inference API</option>
                    <option value="replicate" ${aiConfig.provider === 'replicate' ? 'selected' : ''}>Replicate API (SD / Face-to-Many)</option>
                    <option value="openai" ${aiConfig.provider === 'openai' ? 'selected' : ''}>OpenAI Vision / DALL-E 3</option>
                  </select>
                </div>
                <div class="api-form-row" style="margin-bottom: 8px;">
                  <label style="font-size: 10px; color: #9ca3af; display:block; margin-bottom: 2px;">API Key (Mã Token):</label>
                  <input type="password" id="appAiApiKeyInput" class="api-input-control" style="width:100%; box-sizing:border-box; font-size: 12px; padding: 6px 8px; background: #262632; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;" placeholder="Mã token..." value="${this.escapeHtml(aiConfig.apiKey || '')}">
                </div>
                <button type="button" class="btn-submit-terracotta" style="width: 100%; padding: 8px; font-size: 11px;" onclick="CustomerApp.saveAiApiSettings()">
                  💾 Lưu Cấu Hình
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    selectAiStyle(styleName) {
      this.aiState.selectedStyle = styleName;
      if (window.AppState) window.AppState.updateAi({ selectedStyle: styleName });
      this.refreshCurrentView();
      if (window.UICommon) window.UICommon.showToast(`💇 Đã chọn kiểu tóc ${styleName}`);
    },

    selectAiColor(colorName, colorHex) {
      this.aiState.selectedColorName = colorName;
      this.aiState.selectedColorHex = colorHex;
      if (window.AppState) window.AppState.updateAi({ selectedColorName: colorName, selectedColorHex: colorHex });
      this.refreshCurrentView();
      if (window.UICommon) window.UICommon.showToast(`🎨 Đã chọn màu ${colorName}`);
    },

    handleAiUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.aiState.originalImage = e.target.result;
        this.aiState.resultImage = null;
        this.refreshCurrentView();
        if (window.UICommon) window.UICommon.showToast('✅ Đã tải ảnh chân dung lên App Mobile!');
      };
      reader.readAsDataURL(file);
    },

    loadSampleAi(imageUrl) {
      this.aiState.originalImage = imageUrl;
      this.aiState.resultImage = null;
      this.refreshCurrentView();
      if (window.UICommon) window.UICommon.showToast('✅ Đã chọn ảnh mẫu. Chạm "Bắt Đầu Đổi Kiểu Tóc"!');
    },

    toggleAiApiSettings() {
      this.aiState.showApiSettings = !this.aiState.showApiSettings;
      this.refreshCurrentView();
    },

    saveAiApiSettings() {
      const provider = document.getElementById('appAiProviderSelect')?.value;
      const apiKey = document.getElementById('appAiApiKeyInput')?.value;
      if (window.SalonApi) {
        window.SalonApi.saveAiConfig(provider, apiKey, '');
        if (window.UICommon) window.UICommon.showToast('💾 Đã lưu cấu hình API trên App!');
        this.aiState.showApiSettings = false;
        this.refreshCurrentView();
      }
    },

    async processAiRestyle() {
      if (!this.aiState.originalImage) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Vui lòng chụp hoặc chọn ảnh chân dung trước.', 'warning');
        return;
      }
      this.aiState.isProcessing = true;
      this.refreshCurrentView();

      const stepEl = document.getElementById('appAiStatusStep');
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
          this.refreshCurrentView();
          if (window.UICommon) window.UICommon.showToast(`🎉 Đổi kiểu tóc AI thành công (${response.providerUsed})!`);
        }
      } catch (err) {
        this.aiState.isProcessing = false;
        this.refreshCurrentView();
        if (window.UICommon) window.UICommon.showToast(`❌ Lỗi AI: ${err.message}`, 'error');
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
      a.download = `Omni-Mobile-AI-${this.aiState.selectedStyle.replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (window.UICommon) window.UICommon.showToast('📥 Đã tải ảnh kiểu tóc HD về máy!');
    },

    resetAi() {
      this.aiState.originalImage = null;
      this.aiState.resultImage = null;
      this.refreshCurrentView();
    },

    bookAiHairstyle() {
      const note = `[AI Studio App] Khách muốn cắt kiểu: ${this.aiState.selectedStyle} - Màu: ${this.aiState.selectedColorName}`;
      if (window.store) {
        if (!window.store.bookingDraft) window.store.bookingDraft = {};
        window.store.bookingDraft.notes = note;
      }
      this.switchTab('booking');
      if (window.UICommon) window.UICommon.showToast(`💇 Đã chuyển kiểu tóc "${this.aiState.selectedStyle}" sang Đặt Lịch!`);
    },

    // -----------------------------------------------------------------------
    // 7. TAB 4: CỬA HÀNG (SHOP TAB WITH 2-COLUMN GRID & BRAND FILTERS)
    // -----------------------------------------------------------------------
    setShopBrand(brand) {
      this.shopBrand = brand;
      if (window.AppState) window.AppState.updateShop({ brand });
      this.refreshCurrentView();
    },

    handleShopSearch(val) {
      this.shopSearchQuery = (val || '').trim().toLowerCase();
      if (window.AppState) window.AppState.updateShop({ query: this.shopSearchQuery });
      this.refreshCurrentView();
    },

    renderShopTab() {
      const allProducts = (window.store && typeof window.store.getProducts === 'function')
        ? window.store.getProducts()
        : [];

      // Lọc theo Brand & Tìm kiếm O(N) tối ưu
      const filtered = this._filterProducts(allProducts, this.shopBrand, this.shopSearchQuery);

      return `
        <div style="padding: 14px 14px 30px;">
          <!-- Header Shop -->
          <div style="margin-bottom: 12px;">
            <div class="badge-terracotta" style="font-size: 10px;">CỬA HÀNG OMNI SALON CHÍNH HÃNG</div>
            <h3 style="font-size: 18px; font-weight: 900; margin: 4px 0 2px; color: #111827;">SÁP, POMADE & PHỤ KIỆN</h3>
            <p style="font-size: 11px; color: #6b7280; margin: 0;">Giao hàng tận nhà hoặc nhận trực tiếp tại 18 chi nhánh</p>
          </div>

          <!-- Thanh Tìm Kiếm Sản Phẩm -->
          <div style="margin-bottom: 10px;">
            <input type="text" class="form-control-custom" placeholder="🔍 Tìm kiếm sáp, gôm, dầu gội..." 
                   value="${this.escapeHtml(this.shopSearchQuery)}"
                   oninput="CustomerApp.handleShopSearch(this.value)"
                   style="font-size: 12px; padding: 8px 12px; border-radius: 10px; width: 100%; box-sizing: border-box;">
          </div>

          <!-- Thanh Lọc Thương Hiệu (Brand Filter Pills) -->
          <div class="app-shop-brand-bar">
            <button type="button" class="app-brand-pill ${this.shopBrand === 'all' ? 'active' : ''}" onclick="CustomerApp.setShopBrand('all')">
              Tất Cả (${allProducts.length})
            </button>
            <button type="button" class="app-brand-pill ${this.shopBrand === 'brosh' ? 'active' : ''}" onclick="CustomerApp.setShopBrand('brosh')">
              🇯🇵 Brosh Japan
            </button>
            <button type="button" class="app-brand-pill ${this.shopBrand === '4rau' ? 'active' : ''}" onclick="CustomerApp.setShopBrand('4rau')">
              💈 Omni Essentials
            </button>
            <button type="button" class="app-brand-pill ${this.shopBrand === 'reuzel' ? 'active' : ''}" onclick="CustomerApp.setShopBrand('reuzel')">
              🐷 Reuzel / Khác
            </button>
          </div>

          <!-- Lưới Sản Phẩm 2 Cột Native -->
          ${filtered.length === 0 ? `
            <div style="text-align: center; padding: 40px 14px; background: #fafafc; border-radius: 14px; border: 1px dashed #d1d5db; margin-top: 10px;">
              <span style="font-size: 32px;">📦</span>
              <div style="font-size: 13px; font-weight: 700; color: #374151; margin-top: 8px;">Không tìm thấy sản phẩm phù hợp</div>
              <button type="button" class="pill-btn-outline" style="margin-top: 10px; font-size: 11px; padding: 6px 14px;" onclick="CustomerApp.setShopBrand('all'); CustomerApp.handleShopSearch('');">
                Xóa Bộ Lọc
              </button>
            </div>
          ` : `
            <div class="app-store-grid-2" style="margin-top: 8px;">
              ${filtered.map(p => UICommon.renderProductCard(p, true)).join('')}
            </div>
          `}
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // 8. TAB 5: CÁ NHÂN (PROFILE, QR TICKETS, TIMELINE, VIP REWARDS & STAFF SWITCH)
    // -----------------------------------------------------------------------
    switchProfileSubTab(subTab) {
      this.profileSubTab = subTab;
      if (window.AppState) window.AppState.set('profile.subTab', subTab);
      this.refreshCurrentView();
    },

    switchToStaffMode() {
      const user = this.getCurrentUser();
      if (!this.isStaffUser(user)) {
        if (window.UICommon) {
          window.UICommon.showToast('⚠️ Bạn cần đăng nhập tài khoản Thợ hoặc Quản trị để mở chế độ này.', 'warning');
          window.UICommon.openAuthModal();
        }
        return;
      }
      
      // Nếu có Module AdminApp (Task 9) sẵn sàng thì gọi
      if (window.AdminApp && typeof window.AdminApp.init === 'function') {
        window.AdminApp.init();
      } else if (window.UIApp && typeof window.UIApp.switchToStaffMode === 'function') {
        window.UIApp.switchToStaffMode();
      } else {
        if (window.UICommon) {
          window.UICommon.showToast(`👑 Đã kích hoạt Chế Độ Nhân Viên: ${user.name} (${user.role})!`);
        }
      }
    },

    openTicketModal(bookingId) {
      const bookings = (window.store && typeof window.store.getBookings === 'function')
        ? window.store.getBookings()
        : [];
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      // Bảo mật IDOR: Kiểm tra quyền sở hữu vé điện tử
      const user = this.getCurrentUser();
      const isStaff = this.isStaffUser(user);
      if (!isStaff) {
        if (!user) {
          if (window.UICommon) window.UICommon.showToast('⚠️ Vui lòng đăng nhập để xem vé điện tử.', 'warning');
          return;
        }
        const isOwner = (booking.userId && booking.userId === user.id) ||
                        (booking.customerPhone && user.phone && booking.customerPhone.trim() === user.phone.trim()) ||
                        (booking.customerEmail && user.email && booking.customerEmail.trim().toLowerCase() === user.email.trim().toLowerCase());
        if (!isOwner) {
          if (window.UICommon) window.UICommon.showToast('⛔ [403 Forbidden] IDOR detected: Bạn không có quyền xem vé của khách hàng khác!', 'error');
          return;
        }
      }

      const code = booking.bookingCode || `#${booking.id}`;
      const qrSvg = (window.SalonUtils && typeof window.SalonUtils.generateQrSvgCode === 'function')
        ? window.SalonUtils.generateQrSvgCode(`4RAU:BOOKING:${booking.id}:${code}`, { size: 180 })
        : (window.UICommon && typeof window.UICommon.generateQrSvg === 'function'
            ? window.UICommon.generateQrSvg(`4RAU:BOOKING:${booking.id}:${code}`, 180)
            : `<svg width="180" height="180" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/><rect x="20" y="20" width="60" height="60" fill="#111"/></svg>`);

      this._openModal(`
        <div style="padding: 10px 4px; text-align: center;">
          <div class="badge-terracotta" style="font-size: 10px;">VÉ CẮT TÓC ĐIỆN TỬ CHÍNH THỨC</div>
          <h3 style="font-size: 18px; font-weight: 900; margin: 6px 0; color: #111;">${this.escapeHtml(code)}</h3>
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 14px;">Đưa mã này cho Tiếp tân hoặc Barber khi đến cơ sở</p>

          <div style="background: #fff; border: 2px solid #111; border-radius: 16px; padding: 16px; display: inline-block; margin-bottom: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            ${qrSvg}
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; text-align: left; font-size: 12px; line-height: 1.6; margin-bottom: 14px;">
            <div><strong>Khách hàng:</strong> ${this.escapeHtml(booking.customerName || 'Khách Omni Salon')} (${this.escapeHtml(booking.customerPhone || '')})</div>
            <div><strong>Dịch vụ:</strong> ${this.escapeHtml(booking.serviceName || 'Cắt tóc tạo kiểu cao cấp')}</div>
            <div><strong>Thời gian:</strong> ⏰ ${this.escapeHtml(booking.timeSlot || '')} — Ngày ${this.escapeHtml(booking.date || '')}</div>
            <div><strong>Stylist phục vụ:</strong> ✂️ ${this.escapeHtml(booking.stylistName || 'Master Stylist')}</div>
            <div><strong>Cơ sở:</strong> 📍 ${this.escapeHtml(booking.branchName || 'Omni Salon Suite')}</div>
          </div>

          <button type="button" class="btn-submit-terracotta" style="width: 100%; padding: 10px; font-size: 13px;" onclick="CustomerApp._closeModal()">
            Đóng Vé
          </button>
        </div>
      `);
    },

    renderProfileTab() {
      const user = this.getCurrentUser();
      const isStaff = this.isStaffUser(user);
      const myBookings = this._getUserBookings(user);
      const myOrders = this._getUserOrders(user);

      const loyaltyPoints = user ? (user.points || 250) : 100;
      const tierName = user?.tier || (loyaltyPoints >= 500 ? 'Hội Viên Vàng (Gold)' : 'Hội Viên Bạc (Silver)');

      return `
        <div style="padding: 14px 14px 30px;">
          <!-- 1. VIP Member Card -->
          <div class="member-vip-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span style="font-size: 10px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.1em;">THẺ THÀNH VIÊN ĐIỆN TỬ</span>
                <h3 style="font-size: 18px; font-weight: 900; margin: 4px 0 2px;">${this.escapeHtml(user ? user.name : 'Khách Hàng Thân Thiết')}</h3>
                <span style="font-size: 12px; color: #d1d5db;">${this.escapeHtml(user ? user.phone : '090-XXX-XXXX')}</span>
              </div>
              <div class="app-profile-avatar" style="width: 44px; height: 44px; border-radius: 50%; background: var(--brand-accent); color: var(--bg-primary); font-weight: 900; font-size: 16px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--border-color);">
                ${user ? SalonUtils.getInitials(user.name) : 'OS'}
              </div>
            </div>

            <div style="margin-top: 18px; display: flex; justify-content: space-between; align-items: baseline;">
              <div>
                <span style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Điểm Tích Lũy</span>
                <div style="font-size: 20px; font-weight: 900; color: #fbbf24;">${loyaltyPoints} pts</div>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Hạng Thẻ</span>
                <div style="font-size: 13px; font-weight: 800; color: #fff;">${tierName}</div>
              </div>
            </div>
          </div>

          <!-- 2. Theme Switcher Row (Chế độ Sáng / Tối) -->
          <div class="theme-switcher-row">
            <div class="theme-switcher-label">
              <div class="theme-switcher-icon-wrap">🌓</div>
              <div>
                <div class="theme-switcher-text-title">Giao Diện Ứng Dụng</div>
                <div class="theme-switcher-text-sub">Chuyển đổi giao diện Sáng / Tối</div>
              </div>
            </div>
            <div class="theme-segmented-ctrl">
              <button type="button" class="theme-segment-btn ${window.ThemeEngine && window.ThemeEngine.getTheme() === 'dark' ? 'active' : ''}" data-target-theme="dark" onclick="window.ThemeEngine && window.ThemeEngine.setTheme('dark')">
                🌙 Tối
              </button>
              <button type="button" class="theme-segment-btn ${window.ThemeEngine && window.ThemeEngine.getTheme() === 'light' ? 'active' : ''}" data-target-theme="light" onclick="window.ThemeEngine && window.ThemeEngine.setTheme('light')">
                ☀️ Sáng
              </button>
            </div>
          </div>

          <!-- 3. Staff / Admin Mode Switcher Banner (Nếu là Staff / Admin) -->
          ${isStaff ? `
            <div class="staff-switch-card">
              <div>
                <div style="font-size: 11px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase;">⚡ QUYỀN NHÂN VIÊN HỆ THỐNG</div>
                <div style="font-size: 13px; font-weight: 800; color: var(--text-primary);">Chế độ: ${this.escapeHtml(user.role)}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">Xem ca cắt, mobile POS & kiểm kho</div>
              </div>
              <button type="button" class="btn-submit-terracotta" style="padding: 7px 12px; font-size: 11px;" onclick="CustomerApp.switchToStaffMode()">
                Chuyển Staff →
              </button>
            </div>
          ` : `
            <div style="background: var(--surface-card); border: 1px dashed var(--border-color); border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: var(--text-secondary);">Bạn là Stylist hay Quản lý?</span>
              <button type="button" class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="UICommon.openAuthModal()">
                Đăng Nhập Staff
              </button>
            </div>
          `}

          <!-- 4. Profile Sub-Tab Switcher -->
          <div style="display: flex; gap: 6px; margin-bottom: 14px; background: var(--surface-elevated); padding: 4px; border-radius: 12px; border: 1px solid var(--border-color);">
            <button type="button" style="flex: 1; padding: 8px 4px; font-size: 11px; font-weight: 800; border-radius: 8px; border: none; cursor: pointer; background: ${this.profileSubTab === 'bookings' ? 'var(--surface-card)' : 'transparent'}; color: ${this.profileSubTab === 'bookings' ? 'var(--brand-accent)' : 'var(--text-secondary)'}; box-shadow: ${this.profileSubTab === 'bookings' ? 'var(--theme-shadow-card)' : 'none'};" onclick="CustomerApp.switchProfileSubTab('bookings')">
              ✂️ Vé Cắt (${myBookings.length})
            </button>
            <button type="button" style="flex: 1; padding: 8px 4px; font-size: 11px; font-weight: 800; border-radius: 8px; border: none; cursor: pointer; background: ${this.profileSubTab === 'orders' ? 'var(--surface-card)' : 'transparent'}; color: ${this.profileSubTab === 'orders' ? 'var(--brand-accent)' : 'var(--text-secondary)'}; box-shadow: ${this.profileSubTab === 'orders' ? 'var(--theme-shadow-card)' : 'none'};" onclick="CustomerApp.switchProfileSubTab('orders')">
              📦 Đơn Hàng (${myOrders.length})
            </button>
            <button type="button" style="flex: 1; padding: 8px 4px; font-size: 11px; font-weight: 800; border-radius: 8px; border: none; cursor: pointer; background: ${this.profileSubTab === 'rewards' ? 'var(--surface-card)' : 'transparent'}; color: ${this.profileSubTab === 'rewards' ? 'var(--brand-accent)' : 'var(--text-secondary)'}; box-shadow: ${this.profileSubTab === 'rewards' ? 'var(--theme-shadow-card)' : 'none'};" onclick="CustomerApp.switchProfileSubTab('rewards')">
              🎁 Ưu Đãi
            </button>
          </div>

          <!-- 4. Sub-Tab Content -->
          ${
            this.profileSubTab === 'bookings'
              ? this.renderProfileBookingsTab(myBookings)
              : this.profileSubTab === 'orders'
              ? this.renderProfileOrdersTab(myOrders)
              : this.renderProfileRewardsTab()
          }

          <!-- 5. Tiện Ích Khác -->
          <div style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 14px;">
            <button type="button" class="pill-btn-outline" style="width:100%; margin-bottom: 8px; font-size: 12px; padding: 9px;" onclick="UIApp ? UIApp.openPlayStoreModal() : null">
              ⭐ Đánh Giá 5 Sao Trên Google Play Store
            </button>
            <button type="button" class="pill-btn-outline" style="width:100%; font-size: 12px; padding: 9px; color: var(--brand-accent); border-color: var(--border-color);" onclick="window.location.href='index.html';">
              🌐 Mở Phiên Bản Web Desktop →
            </button>
          </div>
        </div>
      `;
    },

    renderProfileBookingsTab(bookingsList) {
      if (!bookingsList || bookingsList.length === 0) {
        return `
          <div style="text-align: center; padding: 32px 14px; background: var(--surface-elevated); border-radius: 14px; border: 1px dashed var(--border-color);">
            <span style="font-size: 32px;">📅</span>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 6px;">Bạn chưa có lịch hẹn nào</div>
            <button type="button" class="btn-submit-terracotta" style="margin-top: 10px; font-size: 11px; padding: 7px 16px;" onclick="CustomerApp.switchTab('booking')">
              Đặt Lịch Trải Nghiệm Ngay
            </button>
          </div>
        `;
      }

      return `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${bookingsList.map(b => {
            const statusInfo = this._formatBookingStatus(b.status);
            const code = b.bookingCode || `#${b.id}`;

            return `
              <div class="app-ticket-card">
                <div class="ticket-barcode-header">
                  <div>
                    <span style="font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase;">MÃ VÉ CẮT:</span>
                    <strong style="font-size: 13px; color: #111827; margin-left: 4px;">${this.escapeHtml(code)}</strong>
                  </div>
                  <span class="status-badge ${statusInfo.cssClass}" style="font-size: 10px; padding: 2px 8px;">
                    ${this.escapeHtml(statusInfo.label)}
                  </span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 14px; font-weight: 800; color: #111827;">${this.escapeHtml(b.serviceName || 'Dịch Vụ Cắt Tóc')}</div>
                    <div style="font-size: 12px; color: #4b5563; margin-top: 2px;">⏰ ${this.escapeHtml(b.timeSlot || '')} — ${this.escapeHtml(b.date || '')}</div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">✂️ Barber: <strong>${this.escapeHtml(b.stylistName || 'Barber')}</strong></div>
                  </div>
                  <button type="button" class="btn-submit-terracotta" style="padding: 7px 12px; font-size: 11px; white-space: nowrap;" onclick="CustomerApp.openTicketModal('${b.id}')">
                    📱 Xem Vé QR
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    },

    renderProfileOrdersTab(ordersList) {
      if (!ordersList || ordersList.length === 0) {
        return `
          <div style="text-align: center; padding: 32px 14px; background: var(--surface-elevated); border-radius: 14px; border: 1px dashed var(--border-color);">
            <span style="font-size: 32px;">🛍️</span>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 6px;">Bạn chưa có đơn đặt hàng nào</div>
            <button type="button" class="btn-submit-terracotta" style="margin-top: 10px; font-size: 11px; padding: 7px 16px;" onclick="CustomerApp.switchTab('shop')">
              Ghé Cửa Hàng Omni Salon
            </button>
          </div>
        `;
      }

      return `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${ordersList.map(o => {
            const timeline = this._getOrderTimelineProgress(o.status);
            const itemsCount = (o.items || []).reduce((acc, it) => acc + (it.qty || 1), 0);
            const total = Number(o.total || o.finalAmount || 0);

            return `
              <div class="app-ticket-card">
                <div class="ticket-barcode-header">
                  <div>
                    <span style="font-size: 10px; font-weight: 800; color: #6b7280;">ĐƠN HÀNG:</span>
                    <strong style="font-size: 12px; color: #111; margin-left: 4px;">#${this.escapeHtml(o.id)}</strong>
                  </div>
                  <strong style="font-size: 13px; color: var(--color-terracotta);">${SalonUtils.formatCurrency(total)}</strong>
                </div>

                <!-- 4-Step Order Tracking Timeline -->
                <div class="order-timeline-wrap">
                  <div class="order-timeline-progress-fill" style="width: ${timeline.width};"></div>
                  
                  <div class="order-timeline-node active">
                    <div class="order-timeline-dot">1</div>
                    <span class="order-timeline-text">Đã Đặt</span>
                  </div>
                  <div class="order-timeline-node ${timeline.isProcessing ? 'active' : ''}">
                    <div class="order-timeline-dot">2</div>
                    <span class="order-timeline-text">Xử Lý</span>
                  </div>
                  <div class="order-timeline-node ${timeline.isShipping ? 'active' : ''}">
                    <div class="order-timeline-dot">3</div>
                    <span class="order-timeline-text">Đang Giao</span>
                  </div>
                  <div class="order-timeline-node ${timeline.isDelivered ? 'active' : ''}">
                    <div class="order-timeline-dot">4</div>
                    <span class="order-timeline-text">Hoàn Tất</span>
                  </div>
                </div>

                <div style="font-size: 11px; color: #4b5563; background: #f9fafb; padding: 8px 10px; border-radius: 8px; margin-top: 6px;">
                  <div>📦 <strong>Sản phẩm:</strong> ${itemsCount} món (${(o.items || []).map(i => i.name).join(', ')})</div>
                  <div>🚚 <strong>Phương thức:</strong> ${o.orderType === 'POS_COUNTER' ? 'Mua tại quầy chi nhánh' : 'Giao hàng tận nơi'}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    },

    renderProfileRewardsTab() {
      const promos = (window.store && typeof window.store.getPromotions === 'function')
        ? window.store.getPromotions()
        : [];

      return `
        <div>
          <div style="font-size: 12px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; text-transform: uppercase;">
            🎟️ VOUCHER DÀNH RIÊNG CHO BẠN
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${promos.map(p => `
              <div style="background: var(--surface-card); border: 1px dashed var(--brand-accent); border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--theme-shadow-card);">
                <div>
                  <div style="font-size: 13px; font-weight: 800; color: var(--brand-accent);">${this.escapeHtml(p.code)}</div>
                  <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${this.escapeHtml(p.description || 'Ưu đãi thành viên')}</div>
                  <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px; opacity: 0.8;">Hạn dùng: ${this.escapeHtml(p.expiry || '2026-12-31')}</div>
                </div>
                <button type="button" class="pill-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="CustomerApp.switchTab('booking')">
                  Dùng Ngay
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  };

  // Expose module ra window
  window.CustomerApp = CustomerApp;

})(window);
