// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - ĐIỀU HƯỚNG VÀ LAYOUT NỘI DUNG CHÍNH (CUSTOMER MAIN CONTENT)
// File: web/frontend/js/modules/customer/layout/customer-main-content.js
// ============================================================================

(function (window) {
  'use strict';

  function escapeHtml(str) {
    if (typeof SalonUtils !== 'undefined' && typeof SalonUtils.escapeHtml === 'function') {
      return SalonUtils.escapeHtml(str);
    }
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const CustomerMainContent = {
    escapeHtml(str) {
      return escapeHtml(str);
    },

    renderMainContent() {
      const container = document.getElementById('webMainContainer');
      if (!container) return;

      const routeMap = {
        'home': '/',
        'services': '/services',
        'stylists': '/stylists',
        'booking': '/booking',
        'shop': '/shop',
        'cart': '/cart',
        'branches': '/branches',
        'ai': '/ai-studio',
        'admin': '/admin'
      };
      const targetRoute = routeMap[this.currentTab] || '/';

      if (window.AppRouter && window.AppRouter.routes && typeof window.AppRouter.routes[targetRoute] === 'function') {
        window.AppRouter.resolveRoute(targetRoute, false);
        return;
      }

      if (this.currentTab === 'cart' && window.CartPage) {
        window.CartPage.render(container);
        return;
      }

      if (this.currentTab === 'admin') {
        if (window.AdminWeb && typeof window.AdminWeb.render === 'function') {
          window.AdminWeb.render(container);
          return;
        }
        if (window.AdminPortal && typeof window.AdminPortal.render === 'function') {
          window.AdminPortal.render(container);
          return;
        }
        if (window.UIWeb && typeof window.UIWeb.renderAdminView === 'function') {
          window.UIWeb.renderAdminView(container);
          return;
        }
      }

      if (this.currentTab === 'services' && window.ServicesPage) {
        window.ServicesPage.render(container);
        return;
      }
      if (this.currentTab === 'stylists' && window.StylistsPage) {
        window.StylistsPage.render(container);
        return;
      }
      if (this.currentTab === 'booking' && window.BookingPage) {
        window.BookingPage.render(container);
        return;
      }
      if (this.currentTab === 'shop' && window.ShopPage) {
        window.ShopPage.render(container);
        return;
      }
      if (this.currentTab === 'cart' && window.CartPage) {
        window.CartPage.render(container);
        return;
      }
      if (this.currentTab === 'branches' && window.BranchesPage) {
        window.BranchesPage.render(container);
        return;
      }
      if (this.currentTab === 'ai' && window.AiStudioPage) {
        window.AiStudioPage.render(container);
        return;
      }
      if (window.HomePage && typeof window.HomePage.render === 'function') {
        window.HomePage.render(container);
        return;
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
                    <div class="metric-item"><strong>20+</strong><span>Suites</span></div>
                    <div class="metric-divider"></div>
                    <div class="metric-item"><strong>4.9 / 5</strong><span>Rating</span></div>
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
                  Đặt Lịch Ngay (Khởi Tạo Ca Hẹn)
                </button>
                <div class="quick-booking-footer-links">
                  <a href="javascript:void(0)" onclick="CustomerWeb.openLookupModal()">Tra cứu lịch đã đặt</a>
                  <span>•</span>
                  <a href="#serviceSection">Xem toàn bộ menu</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. BẠN ĐẾN NHÀ  - KHOẢNH KHẮC THƯỜNG NHẬT OMNI SALON -  -->
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
          <h2 class="section-title-clean font-serif tracking-tight leading-tight">DỊCH VỤ &amp; COMBO ĐẶC TRƯNG</h2>
          <p class="section-subtitle-clean">Tuyển tập gói chăm sóc &amp; cắt tạo kiểu độc quyền tại Omni Salon.</p>

          <div class="services-category-bar">
            <button class="service-cat-pill ${this.selectedCategory === 'all' ? 'active' : ''}" onclick="CustomerWeb.filterServices('all')">Tất Cả Dịch Vụ</button>
            <button class="service-cat-pill ${this.selectedCategory === 'haircut' ? 'active' : ''}" onclick="CustomerWeb.filterServices('haircut')">Cắt Tạo Phom Fade</button>
            <button class="service-cat-pill ${this.selectedCategory === 'perm' ? 'active' : ''}" onclick="CustomerWeb.filterServices('perm')">Uốn Con Sâu / Texture</button>
            <button class="service-cat-pill ${this.selectedCategory === 'color' ? 'active' : ''}" onclick="CustomerWeb.filterServices('color')">Nhuộm &amp; Tẩy Màu Khói</button>
            <button class="service-cat-pill ${this.selectedCategory === 'shave' ? 'active' : ''}" onclick="CustomerWeb.filterServices('shave')">Cạo Khăn Nóng Proraso</button>
            <button class="service-cat-pill ${this.selectedCategory === 'combo' ? 'active' : ''}" onclick="CustomerWeb.filterServices('combo')">Combo VIP Toàn Diện</button>
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
                  <span class="stylist-master-badge">Stylist Chuyên Nghiệp</span>
                </div>
                <div class="stylist-showcase-body">
                  <h4 class="stylist-showcase-name">${this.escapeHtml(st.name)}</h4>
                  <div class="stylist-showcase-role">${this.escapeHtml(st.title || st.role || 'Senior Artisan')}</div>
                  <div class="stylist-showcase-meta">
                    <span class="stylist-rating-pill">${st.rating || '4.9'} (${st.reviewCount || 128} đánh giá)</span>
                    <span class="stylist-exp-pill">${st.experience || '6+ năm'}</span>
                  </div>
                  <p class="stylist-showcase-specialty">Chuyên: ${this.escapeHtml((st.specialties || ['Fade Layer', 'Premlock', 'Texture Cut']).join(', '))}</p>
                  <div class="stylist-showcase-actions">
                    <button class="btn-check-availability" onclick="CustomerWeb.openStylistDrawer('${st.id}')">
                      Xem Lịch Trống
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

        <!-- 4. SẢN PHẨM MỚI  - NEW ARRIVALS -  -->
        <section class="section-container" id="newProductsSection" style="padding-top: 50px;">
          <h2 class="section-title-clean font-serif tracking-tight leading-tight">SẢN PHẨM MỚI</h2>
          <p class="section-subtitle-clean">Những mẫu sáp vuốt và phụ kiện mới nhất vừa cập bến, cập nhật liên tục.</p>
          <div class="products-grid-5">
            ${newProducts.map(p => UICommon.renderProductCard(p)).join('')}
          </div>
        </section>

        <!-- 5. SẢN PHẨM BÁN CHẠY  - BEST SELLERS -  -->
        <section class="section-container" id="bestSellerSection" style="padding-top: 50px;">
          <h2 class="section-title-clean font-serif tracking-tight leading-tight">SẢN PHẨM BÁN CHẠY</h2>
          <p class="section-subtitle-clean">Tuyển chọn các dòng sáp vuốt và dưỡng tóc được khách hàng tin dùng nhất.</p>
          <div class="products-grid-5">
            ${bestProducts.map(p => UICommon.renderProductCard(p)).join('')}
          </div>
        </section>

        <!-- 6. TIN TÓC UNDERGROUND -->
        <section class="section-container" id="undergroundSection" style="padding-top: 60px;">
          <h2 class="section-title-clean font-serif tracking-tight leading-tight">TIN TÓC &amp; PHONG CÁCH SỐNG</h2>
          <p class="section-subtitle-clean" style="max-width: 720px; margin: 0 auto 30px;">
            Cập nhật liên tục những xu hướng tóc nam, kỹ thuật chăm sóc và phong cách lịch lãm đương đại.
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
            <button class="btn-black-solid" onclick="UICommon.showToast('Bạn đang xem những tin tức mới nhất từ Omni Salon!')">XEM THÊM BÀI VIẾT →</button>
          </div>
        </section>

        <!-- 7. HỆ THỐNG CHI NHÁNH OMNI SALON TRÊN TOÀN QUỐC -->
        <section class="section-container" id="branchesSection" style="padding-top: 60px;">
          <div class="branches-split-layout">
            <div class="branches-left-info">
              <h2 class="branches-main-title font-serif tracking-tight leading-tight">Khám phá hệ thống chi nhánh Omni Salon trên toàn quốc.</h2>
              <p class="branches-sub-text">
                Dễ dàng tìm kiếm và trải nghiệm dịch vụ chất lượng cao cấp gần nơi bạn nhất.<br>
                <strong>Hotline: 1900 8899</strong>
              </p>
              <button class="btn-black-solid" style="margin-top: 20px;" onclick="UICommon.openBookingModal()">ĐẶT LỊCH NGAY →</button>
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

        <!-- 8. OMNI SALON AI STUDIO: ĐỔI KIỂU TÓC BẰNG ẢNH THẬT -->
        <section class="section-container" id="aiStudioSection" style="padding-top: 60px;">
          <div class="web-ai-studio-wrapper">
            <div class="web-ai-studio-header">
              <div class="badge-terracotta pulse-animation">AI BARBER VISION • THỬ KIỂU TÓC THỰC TẾ</div>
              <h2 class="section-title-clean font-serif tracking-tight leading-tight" style="margin-top: 8px; font-size: 28px; font-weight: 900; letter-spacing: 0.01em;">
                OMNI SALON AI STUDIO: THỬ KIỂU TÓC TRÊN ẢNH THẬT
              </h2>
              <p class="section-subtitle-clean" style="max-width: 720px; margin: 0 auto 24px;">
                Chụp hoặc tải ảnh chân dung để trực quan hóa phom tóc và màu nhuộm phù hợp với dáng mặt của bạn trước khi tới salon.
              </p>
            </div>
            <div id="webAiStudioContainer">
              ${this.renderAiStudioContent()}
            </div>
          </div>
        </section>

        <!-- 9. TÁC PHẨM TRONG THÁNG  - HAIRSTYLES SHOWCASE -  -->
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

        <!-- 11. VIDEO NGẮN HAY NHẤT  - SHORTS / REELS -  -->
        <section class="section-container" style="padding-top: 50px; text-align: center;">
          <h2 class="section-title-clean">VIDEO NGẮN HAY NHẤT</h2>
          <div class="videos-preview-row">
            <div class="video-item-card" onclick="UICommon.showToast('Đang mở video kỹ thuật tạo kiểu chuẩn Omni Salon!')">
              <div class="video-play-overlay">PHÁT</div>
              <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80" alt="Video 1" class="video-thumb">
              <div class="video-caption">Hành trình lột xác với Warrior Cut 2026</div>
            </div>
            <div class="video-item-card" onclick="UICommon.showToast('Đang mở video uốn con sâu Zic-zac cực cháy!')">
              <div class="video-play-overlay">PHÁT</div>
              <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80" alt="Video 2" class="video-thumb">
              <div class="video-caption">Uốn Con Sâu Premlock cực cháy tại Quận 10</div>
            </div>
            <div class="video-item-card" onclick="UICommon.showToast('Đang mở video liệu trình cạo mặt thư giãn!')">
              <div class="video-play-overlay">PHÁT</div>
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

        <!-- 13. CÂU HỎI THƯỜNG GẶP  - FAQ ACCORDION -  -->
        <section class="section-container" style="padding-top: 60px; padding-bottom: 20px;">
          <h2 class="section-title-clean">CÂU HỎI THƯỜNG GẶP</h2>
          <p class="section-subtitle-clean">Giải đáp những thắc mắc phổ biến của quý khách khi trải nghiệm tại Omni Salon.</p>
          
          <div class="faq-accordion-list">
            <div class="faq-accordion-item ${this.openFaqIndex === 0 ? 'open' : ''}">
              <button class="faq-header-btn" onclick="CustomerWeb.toggleFaq(0)">
                <span>1. Tôi có cần phải đặt lịch hẹn trước khi đến tiệm cắt không?</span>
                <span class="faq-icon-caret">+</span>
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
                Rất đơn giản, bạn chỉ cần bấm nút <strong>"Tra Cứu Lịch"</strong> trên thanh menu trên cùng, nhập Số điện thoại hoặc Mã lịch (#LH...) để xem chi tiết ca hẹn, số ghế và thợ cắt. Bạn cũng có thể hủy lịch trực tiếp trên web hoặc liên hệ hotline <strong>1900 8899</strong> để được hỗ trợ tức thì.
              </div>
            </div>

            <div class="faq-accordion-item ${this.openFaqIndex === 4 ? 'open' : ''}">
              <button class="faq-header-btn" onclick="CustomerWeb.toggleFaq(4)">
                <span>5. Chính sách bảo hành và cam kết chất lượng của Omni Salon như thế nào?</span>
              </button>
              <div class="faq-body-content">
                Tất cả các dịch vụ cắt, uốn, nhuộm tại toàn bộ chi nhánh Omni Salon đều được bảo hành chỉnh sửa miễn phí trong vòng 7 ngày nếu quý khách chưa thực sự ưng ý với phom tóc hoặc nếp uốn. Sự hài lòng và vẻ ngoài tự tin của bạn là tiêu chí hàng đầu của chúng tôi.
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
            <button type="button" class="stylist-drawer-close" onclick="CustomerWeb.closeStylistDrawer()">&times;</button>
          </div>
          <div class="stylist-drawer-body" id="stylistDrawerBody"></div>
          <div class="stylist-drawer-footer" style="padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.08); background: #0B0D13;">
            <button type="button" class="quick-booking-btn-submit" id="drawerBookStylistBtn" style="width: 100%;">
              Đặt Lịch Với Stylist Này
            </button>
          </div>
        </div>
      `;
    },
  };

  // 1. Phơi đối tượng ra window
  window.CustomerMainContent = CustomerMainContent;

  // 2. Đồng bộ ngược lại CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerMainContent);
  }

})(typeof window !== 'undefined' ? window : this);
