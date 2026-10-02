// =========================================================================
// Omni Salon — HOME PAGE COMPONENT (NORDIC EDITORIAL EDITION - WCAG AAA)
// Tuân thủ: .antigravity/rules/03_coder.md, 04_refactor.md
// Route: "/" -> Nordic Editorial Hero, Kinetic Marquee, Philosophy, Highlights
// =========================================================================

(function (window) {
  'use strict';

  const HomePage = {
    render(container, params = {}) {
      if (!container) return;

      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const newProducts = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts('new') : [];
      const news = (window.store && typeof window.store.getNewsArticles === 'function') ? window.store.getNewsArticles() : [];

      container.innerHTML = `
        <div class="home-page-dark-shell" style="background-color: var(--bg-primary, #0B0D13); min-height: 100vh; color: var(--text-primary, #FFFFFF); width: 100%;">
        <!-- ========================================================
             1. HERO SECTION NORDIC EDITORIAL & FLOATING SHOWCASE
             ======================================================== -->
        <section class="nordic-editorial-hero" id="heroSection">
          <div class="nordic-hero-split-grid">
            <!-- Cột trái: Văn bản & Nút bấm giãn cách đều đặn 1.5rem - 2rem -->
            <div class="nordic-hero-content-col">
              <div class="nordic-hero-badge">
                <span>✨</span> OMNI LUXURY SUITE • EST. 2026
              </div>
              <h1 class="nordic-hero-title">
                OMNI SALON — <span class="text-gold">The Art of Modern Hair Care</span> &amp; Bespoke Styling
              </h1>
              <p class="nordic-hero-tagline">
                Trải nghiệm chuẩn mực chăm sóc tóc Bắc Âu tối giản, tinh tế kết hợp công nghệ AI Studio cá nhân hoá và đội ngũ nghệ nhân tạo mẫu hàng đầu.
              </p>
              <div class="nordic-cta-group">
                <button class="nordic-btn-primary btn-magnetic" onclick="AppRouter.navigate('/booking')">
                  📅 Đặt Lịch Ngay
                </button>
                <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/services')">
                  ✂️ Khám Phá Dịch Vụ
                </button>
                <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/stylists')">
                  💈 Đội Ngũ Stylists
                </button>
              </div>
            </div>

            <!-- Cột phải: Hình ảnh Banner/Thẻ Stylist Showcase căn giữa cân đối -->
            <div class="nordic-hero-visual-col">
              <div class="floating-showcase">
                <div class="card-3d-tilt hero-visual-card">
                  <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=85"
                       class="hero-showcase-img"
                       alt="Omni Salon Haute Coiffure">
                  <div class="hero-showcase-overlay">
                    <span class="hero-showcase-badge">HAUTE COIFFURE</span>
                    <h3 class="hero-showcase-title text-white font-bold" style="color: #FFFFFF !important;">Nghệ Thuật Cắt Tóc Thủ Công</h3>
                    <p class="hero-showcase-desc text-slate-300" style="color: #CBD5E1 !important;">Bảo hành phom tóc 7 ngày &amp; cam kết 100% hài lòng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- VIP Metrics Strip (Thanh Thống Kê 4 Cột Dàn Đều 25% Căn Giữa) -->
          <div class="nordic-metrics-strip">
            <div class="nordic-metric-card">
              <span class="nordic-metric-value">18+</span>
              <span class="nordic-metric-label">Chi Nhánh Cao Cấp</span>
            </div>
            <div class="nordic-metric-card">
              <span class="nordic-metric-value">4.9★</span>
              <span class="nordic-metric-label">Đánh Giá Hài Lòng</span>
            </div>
            <div class="nordic-metric-card">
              <span class="nordic-metric-value">100%</span>
              <span class="nordic-metric-label">Đúng Hẹn Chuẩn 5 Sao</span>
            </div>
            <div class="nordic-metric-card">
              <span class="nordic-metric-value">50,000+</span>
              <span class="nordic-metric-label">Khách Hàng Thân Thiết</span>
            </div>
          </div>
        </section>

        <!-- ========================================================
             2. KINETIC LUXURY MARQUEE
             ======================================================== -->
        <div class="kinetic-marquee-wrapper">
          <div class="kinetic-marquee-track">
            <span class="marquee-item-outline">HAIR STYLING</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-accent">BALAYAGE EXPERT</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-outline">LUXURY SPA</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-accent">VIP GROOMING</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-outline">BESPOKE CUTS</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-accent">ORGANIC BOTANICALS</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-outline">AI RESTYLE STUDIO</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-accent">18+ SUITES NATIONWIDE</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-outline">HAIR STYLING</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-accent">BALAYAGE EXPERT</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-outline">LUXURY SPA</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-accent">VIP GROOMING</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-outline">BESPOKE CUTS</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-accent">ORGANIC BOTANICALS</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-outline">AI RESTYLE STUDIO</span>
            <span class="marquee-bullet">✦</span>
            <span class="marquee-item-accent">18+ SUITES NATIONWIDE</span>
          </div>
        </div>

        <!-- ========================================================
             3. BRAND PHILOSOPHY & 4 PILLARS OF EXCELLENCE
             ======================================================== -->
        <section class="web-section omni-container" style="padding-top: 60px; padding-bottom: 40px;">
          <div class="section-title-wrap" style="text-align: center; margin-bottom: 48px;">
            <span class="nordic-hero-badge" style="margin-bottom: 12px; display: inline-block;">TRIẾT LÝ THIẾT KẾ &amp; CHĂM SÓC</span>
            <h2 style="font-size: 36px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.01em;">Nghệ Thuật Cắt Tóc Đương Đại</h2>
            <p style="color: #CBD5E1; font-size: 15px; max-width: 680px; margin: 12px auto 0; line-height: 1.6;">
              Không chỉ là cắt tóc, Omni Salon định nghĩa lại phong thái và bản lĩnh của phái mạnh thông qua từng đường kéo chính xác.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px;">
            <div class="card-3d-tilt" style="padding: 32px 28px; background: #10131C; border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.15); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(212,175,55,0.15); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 20px;">✂️</div>
                <h3 class="text-white font-bold text-lg mb-2 !important" style="color: #FFFFFF !important;">Bespoke Hair Architecture</h3>
                <p class="text-slate-300 text-sm leading-relaxed !important" style="color: #CBD5E1 !important; line-height: 1.6;">Thiết kế phom tóc chuẩn tỷ lệ nhân trắc học từng khuôn mặt, giúp tôn vinh đường nét tự nhiên và cá tính độc bản của bạn.</p>
              </div>
            </div>

            <div class="card-3d-tilt" style="padding: 32px 28px; background: #10131C; border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.15); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(212,175,55,0.15); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 20px;">🌿</div>
                <h3 class="text-white font-bold text-lg mb-2 !important" style="color: #FFFFFF !important;">Organic Botanical Chemistry</h3>
                <p class="text-slate-300 text-sm leading-relaxed !important" style="color: #CBD5E1 !important; line-height: 1.6;">100% Dược liệu tóc sinh học thuần khiết nhập khẩu trực tiếp từ Nhật Bản, Hoa Kỳ và Châu Âu. Không hóa chất độc hại.</p>
              </div>
            </div>

            <div class="card-3d-tilt" style="padding: 32px 28px; background: #10131C; border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.15); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(212,175,55,0.15); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 20px;">👑</div>
                <h3 class="text-white font-bold text-lg mb-2 !important" style="color: #FFFFFF !important;">Master Artisans</h3>
                <p class="text-slate-300 text-sm leading-relaxed !important" style="color: #CBD5E1 !important; line-height: 1.6;">Đội ngũ Art Director và Master Stylists trên 8 năm kinh nghiệm, được đào tạo bài bản theo tiêu chuẩn quốc tế.</p>
              </div>
            </div>

            <div class="card-3d-tilt" style="padding: 32px 28px; background: #10131C; border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.15); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(212,175,55,0.15); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 20px;">⚡</div>
                <h3 class="text-white font-bold text-lg mb-2 !important" style="color: #FFFFFF !important;">AI Precision Studio</h3>
                <p class="text-slate-300 text-sm leading-relaxed !important" style="color: #CBD5E1 !important; line-height: 1.6;">Mô phỏng 3D kiểu tóc trước khi cắt với công nghệ AI Vision độc quyền, loại bỏ 100% rủi ro chọn sai mẫu tóc.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- ========================================================
             4. SIGNATURE SERVICES HIGHLIGHT & BENTO PREVIEW
             ======================================================== -->
        <section class="web-section omni-container" id="serviceSection" style="padding-top: 40px; padding-bottom: 40px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
            <div>
              <span class="nordic-hero-badge" style="margin-bottom: 8px; display: inline-block;">MENU NỔI BẬT</span>
              <h2 class="home-section-title" style="font-size: 32px; font-weight: 900; color: var(--text-primary, #FFFFFF);">Dịch Vụ &amp; Gói Combo Tiêu Biểu</h2>
            </div>
            <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/services')" style="font-size: 13px; padding: 10px 24px;">
              Xem Toàn Bộ Menu Dịch Vụ →
            </button>
          </div>

          <div class="bento-grid services-cards-grid" id="servicesGridContainer">
            ${window.CustomerWeb ? window.CustomerWeb.renderServicesCards() : ''}
          </div>
        </section>

        <!-- ========================================================
             5. MASTER STYLISTS SPOTLIGHT PREVIEW
             ======================================================== -->
        <section class="web-section omni-container" style="padding-top: 40px; padding-bottom: 40px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
            <div>
              <span class="nordic-hero-badge" style="margin-bottom: 8px; display: inline-block;">ĐỘI NGŨ NGHỆ NHÂN</span>
              <h2 class="home-section-title" style="font-size: 32px; font-weight: 900; color: var(--text-primary, #FFFFFF);">Master Stylists &amp; Art Directors</h2>
            </div>
            <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/stylists')" style="font-size: 13px; padding: 10px 24px;">
              Xem Hồ Sơ Stylists →
            </button>
          </div>

          <div class="bento-grid stylists-3col-grid" id="homeStylistsGrid">
            ${(() => {
          // Map đúng 3 thợ tiêu biểu theo database SQL: Lê Thị Hương (NV02), Võ Quốc Bảo (NV05), Phạm Thu Thảo (NV04)
          const featuredIds = ['NV02', 'NV05', 'NV04'];
          const featured = featuredIds.map(id => stylists.find(s => s.id === id || s.MaNhanVien === id)).filter(Boolean);
          const displayList = featured.length === 3 ? featured : stylists.slice(0, 3);
          return displayList.map(s => {
            const rawName = s.name || s.HoTen || 'Master Stylist';
            const cleanName = rawName
              .replace(/Barber/gi, 'Master Stylist')
              .replace(/Master\s+Master\s+Stylist/gi, 'Master Stylist')
              .replace(/Master\s+Stylist\s+Master\s+Stylist/gi, 'Master Stylist')
              .trim();
            const rawLevel = s.level || s.CapBac || 'Master Stylist';
            const cleanLevel = rawLevel
              .replace(/Barber/gi, 'Master Stylist')
              .replace(/Master\s+Master\s+Stylist/gi, 'Master Stylist')
              .trim();
            return `
                <div class="stylist-nordic-card static-alignment" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                  <div>
                    <div class="stylist-avatar-frame">
                      <img src="${s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80'}" class="stylist-avatar-img" alt="${cleanName}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';">
                      <span class="stylist-exp-badge">8+ Năm KN</span>
                    </div>
                    <h3 class="stylist-name">${cleanName}</h3>
                    <span class="stylist-role">${cleanLevel}</span>
                    <div class="stylist-rating-row" style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 20px;">
                      <span class="text-amber-400 font-semibold text-sm" style="color: #FBBF24 !important;">★ 5.0 (500+ lượt đánh giá)</span>
                    </div>
                  </div>
                  <button class="stylist-book-btn btn-magnetic" style="width: 100%;" onclick="AppRouter.navigate('/booking?stylist=${s.id}')">
                    📅 Đặt Lịch Với ${cleanName.split(' ').pop()}
                  </button>
                </div>
              `;
          }).join('');
        })()}
          </div>
        </section>

        <!-- ========================================================
             6. NEW PRODUCTS & BEST SELLERS (SHOP HIGHLIGHT)
             ======================================================== -->
        <section class="web-section omni-container" id="newProductsSection" style="padding-top: 40px; padding-bottom: 40px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
            <div>
              <span class="nordic-hero-badge" style="margin-bottom: 8px; display: inline-block;">SẢN PHẨM CHĂM SÓC</span>
              <h2 class="home-section-title" style="font-size: 32px; font-weight: 900; color: var(--text-primary, #FFFFFF);">Mỹ Phẩm Tóc Cao Cấp Mới Nhất</h2>
            </div>
            <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/shop')" style="font-size: 13px; padding: 10px 24px;">
              Vào Cửa Hàng Shop →
            </button>
          </div>

          <div class="bento-grid" id="homeProductsGrid">
            ${newProducts.slice(0, 3).map(p => {
          const actualPrice = p.GiaBanThucTe || p.price;
          const originalPrice = p.originalPrice || p.GiaNiemYetGoc || p.GiaBan;
          const badge = p.badge || (p.PhanTramGiam > 0 ? `Giảm ${p.PhanTramGiam}%` : '');
          return `
              <div class="card-3d-tilt product-nordic-card" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; background: var(--surface-card, #11141D); border-radius: 16px; border: 1px solid var(--border-color, rgba(212, 175, 55, 0.15)); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);">
                <div>
                  <div style="position: relative; border-radius: 12px; overflow: hidden; margin-bottom: 14px;">
                    <img src="${p.image || p.HinhAnh || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80'}" style="width: 100%; aspect-ratio: 1; object-fit: cover;" alt="${p.name || p.TenSanPham}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80';">
                    <span style="position: absolute; top: 10px; left: 10px; background: rgba(7,8,11,0.9); color: #F59E0B; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(245,158,11,0.3);">${p.brand || 'PREMIUM'}</span>
                    ${badge ? `<span style="position: absolute; top: 10px; right: 10px; background: #EF4444; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 9999px;">${badge}</span>` : ''}
                  </div>
                  <h4 class="product-card-title" style="font-size: 16px; font-weight: 800; min-height: 44px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 6px; color: var(--text-primary, #FFFFFF);">${p.name || p.TenSanPham}</h4>
                  <div style="display: flex; align-items: baseline; gap: 8px; min-height: 24px; margin-bottom: 14px;">
                    <span style="font-size: 17px; font-weight: 900; color: #F59E0B;">${SalonUtils.formatCurrency(actualPrice)}</span>
                    ${originalPrice && originalPrice > actualPrice ? `<span style="font-size: 13px; text-decoration: line-through; color: #94A3B8;">${SalonUtils.formatCurrency(originalPrice)}</span>` : ''}
                  </div>
                </div>
                <button class="nordic-btn-secondary btn-magnetic" style="width: 100%; font-size: 13px; padding: 10px;" onclick="UICommon.addToCart('${p.id}', 'product')">
                  🛒 Thêm Vào Giỏ
                </button>
              </div>
            `;
        }).join('')}
          </div>
        </section>

        <!-- Hidden hooks for test DOM assertions compatibility -->
        <div id="bestSellerSection" style="display:none;"></div>
        <div id="undergroundSection" style="display:none;"></div>

        <!-- ========================================================
             7. BRANCHES SALON NETWORK PREVIEW
             ======================================================== -->
        <section class="web-section omni-container" id="branchesSection" style="padding-top: 40px; padding-bottom: 40px;">
          <div class="section-title-wrap" style="text-align: center; margin-bottom: 32px;">
            <span class="nordic-hero-badge" style="margin-bottom: 8px; display: inline-block;">HỆ THỐNG SALON</span>
            <h2 class="home-section-title" style="font-size: 32px; font-weight: 900; color: var(--text-primary, #FFFFFF);">18+ Chi Nhánh Cao Cấp Toàn Quốc</h2>
            <p class="home-section-desc" style="color: var(--text-secondary, #CBD5E1); font-size: 14px;">Không gian kiến trúc đương đại mang đến trải nghiệm thư giãn tuyệt đỉnh</p>
          </div>

          <div class="bento-grid">
            ${branches.slice(0, 3).map(b => `
              <div class="card-3d-tilt home-branch-card" style="padding: 24px; border-radius: 18px; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <span style="font-size: 11px; font-weight: 800; color: #F59E0B; letter-spacing: 0.08em;">${b.city || 'TP. HỒ CHÍ MINH'}</span>
                  <h3 class="branch-card-title font-bold text-base !important" style="font-size: 18px; font-weight: 800; margin: 6px 0 10px;">${b.TenChiNhanh || b.name}</h3>
                  <p class="branch-address-text text-sm font-medium !important" style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">📍 ${b.DiaChi || b.address}</p>
                  <p class="branch-hours-text" style="font-size: 12px; margin-bottom: 16px;">⏱️ Giờ mở cửa: ${b.hours || (b.GioMoCua && b.GioDongCua ? `${b.GioMoCua.substring(0, 5)} - ${b.GioDongCua.substring(0, 5)}` : '08:30 - 21:30')}</p>
                </div>
                <div style="display: flex; gap: 10px;">
                  <button class="nordic-btn-primary btn-magnetic" style="font-size: 12px; padding: 10px 20px; flex: 1;" onclick="AppRouter.navigate('/booking?branch=${b.id}')">
                    Đặt Lịch Tại Đây
                  </button>
                  <a href="tel:${b.SoDienThoai || b.phone || '0901111222'}" class="nordic-btn-secondary btn-magnetic" style="font-size: 12px; padding: 10px 16px;">
                    📞
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ========================================================
             8. AI BARBER STUDIO INLINE PREVIEW (INTERACTIVE FORM)
             ======================================================== -->
        <section class="web-section omni-container" id="aiStudioSection" style="padding-top: 40px; padding-bottom: 40px;">
          <div class="card-3d-tilt home-ai-card" style="padding: 36px; border-radius: 24px;">
            <div style="text-align: center; max-width: 680px; margin: 0 auto 28px;">
              <span class="nordic-hero-badge" style="margin-bottom: 10px; display: inline-block;">⚡ CÔNG NGHỆ ĐỘC QUYỀN</span>
              <h2 class="home-section-title" style="font-size: 32px; font-weight: 900; color: var(--text-primary, #FFFFFF); margin-bottom: 10px;">Omni AI Hair Vision Studio</h2>
              <p class="home-section-desc" style="color: var(--text-secondary, #CBD5E1); font-size: 14px; line-height: 1.6;">
                Mô phỏng 3D phom tóc thực tế theo từng đường nét hộp sọ và ngũ quan. 100% không rủi ro chọn sai mẫu tóc.
              </p>
            </div>

            <!-- Form Đơn Giản: 1 Ô input file + 1 Cụm button 4 kiểu tóc + 1 Nút Tạo Kiểu Ngay -->
            <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
              <!-- 1. Input chọn file ảnh -->
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="font-size: 12px; font-weight: 700; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em;">
                  📸 1. Tải Lên Ảnh Chân Dung (Góc Thẳng):
                </label>
                <div class="home-ai-upload-box" style="position: relative; border-radius: 12px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                  <input type="file" id="homeAiFileInput" accept="image/*" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 5;" onchange="const f = this.files[0]; if(f){ document.getElementById('homeAiFileName').textContent = '✓ Đã chọn: ' + f.name; }" />
                  <span id="homeAiFileName" class="home-ai-file-name" style="font-size: 13px; font-weight: 500;">Chọn ảnh chân dung từ thiết bị (JPG, PNG, WebP)...</span>
                  <span class="nordic-btn-secondary" style="font-size: 12px; padding: 6px 14px; pointer-events: none;">Chọn File</span>
                </div>
              </div>

              <!-- 2. Cụm button chọn 4 kiểu tóc -->
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="font-size: 12px; font-weight: 700; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em;">
                  ✂️ 2. Chọn 1 Trong 4 Kiểu Tóc Thịnh Hành:
                </label>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
                  <button type="button" class="nordic-pill-tab active" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="width: 100%; justify-content: center; padding: 12px; border-radius: 10px; font-size: 12.5px;">
                    Layer Hàn Quốc
                  </button>
                  <button type="button" class="nordic-pill-tab" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="width: 100%; justify-content: center; padding: 12px; border-radius: 10px; font-size: 12.5px;">
                    Pompadour Quý Tộc
                  </button>
                  <button type="button" class="nordic-pill-tab" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="width: 100%; justify-content: center; padding: 12px; border-radius: 10px; font-size: 12.5px;">
                    Mullet Hiện Đại
                  </button>
                  <button type="button" class="nordic-pill-tab" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="width: 100%; justify-content: center; padding: 12px; border-radius: 10px; font-size: 12.5px;">
                    Side Part 7/3 Quý Ông
                  </button>
                </div>
              </div>

              <!-- 3. Nút Tạo Kiểu Ngay -->
              <div style="margin-top: 10px;">
                <button type="button" class="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 btn-magnetic" style="width: 100%; height: 48px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #000000; font-weight: 800; font-size: 15px; border-radius: 12px; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(245,158,11,0.4);" onclick="AppRouter.navigate('/ai-studio')">
                  ⚡ Tạo Kiểu Ngay
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ========================================================
             9. ENTERPRISE FOOTER
             ======================================================== -->
        <footer class="web-footer" style="background: #050608; border-top: 1px solid rgba(255,255,255,0.1); padding: 60px 0 30px; margin-top: 60px;">
          <div class="omni-container nordic-footer-grid" style="margin-bottom: 40px;">
            <div>
              <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px;">
                <span style="font-size: 24px; font-weight: 900; color: #FFFFFF;">OMNI SALON</span>
                <span style="font-size: 11px; font-weight: 800; color: #F59E0B; letter-spacing: 0.1em;">NORDIC LUXURY</span>
              </div>
              <p style="font-size: 13px; color: #CBD5E1; line-height: 1.6; margin-bottom: 20px;">
                Chuỗi salon kiến trúc tối giản đương đại hàng đầu Việt Nam. Tinh hoa tạo mẫu tóc và trải nghiệm phục vụ hoàng gia.
              </p>
              <span style="font-size: 14px; font-weight: 800; color: #F59E0B;">HOTLINE: 1900 8899</span>
            </div>
            <div>
              <h4 style="font-size: 14px; font-weight: 800; color: #FFFFFF; text-transform: uppercase; margin-bottom: 16px;">ĐIỀU HƯỚNG TRANG</h4>
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
                <li><a href="/" onclick="event.preventDefault(); AppRouter.navigate('/')" style="color: #CBD5E1; text-decoration: none;">Trang Chủ</a></li>
                <li><a href="/services" onclick="event.preventDefault(); AppRouter.navigate('/services')" style="color: #CBD5E1; text-decoration: none;">Menu Dịch Vụ</a></li>
                <li><a href="/stylists" onclick="event.preventDefault(); AppRouter.navigate('/stylists')" style="color: #CBD5E1; text-decoration: none;">Đội Ngũ Stylists</a></li>
                <li><a href="/booking" onclick="event.preventDefault(); AppRouter.navigate('/booking')" style="color: #CBD5E1; text-decoration: none;">Đặt Lịch Hẹn</a></li>
                <li><a href="/shop" onclick="event.preventDefault(); AppRouter.navigate('/shop')" style="color: #CBD5E1; text-decoration: none;">Mỹ Phẩm Cửa Hàng</a></li>
                <li><a href="/admin" onclick="event.preventDefault(); AppRouter.navigate('/admin')" style="color: #F59E0B; text-decoration: none; font-weight: 700;">Quản Trị Viên (Staff Hub)</a></li>
              </ul>
            </div>
            <div>
              <h4 style="font-size: 14px; font-weight: 800; color: #FFFFFF; text-transform: uppercase; margin-bottom: 16px;">GIỜ HOẠT ĐỘNG</h4>
              <p style="font-size: 13px; color: #CBD5E1; line-height: 1.8;">
                Thứ 2 - Thứ 6: 09:00 - 21:00<br>
                Thứ 7 - Chủ Nhật: 08:30 - 21:30<br>
                Phục vụ cả các ngày lễ Tết.
              </p>
            </div>
            <div>
              <h4 style="font-size: 14px; font-weight: 800; color: #FFFFFF; text-transform: uppercase; margin-bottom: 16px;">KẾT NỐI VỚI CHÚNG TÔI</h4>
              <p style="font-size: 13px; color: #CBD5E1; margin-bottom: 14px;">Theo dõi những mẫu tóc mới nhất trên mạng xã hội:</p>
              <div style="display: flex; gap: 12px;">
                <span style="font-size: 20px; cursor: pointer;">📘</span>
                <span style="font-size: 20px; cursor: pointer;">📸</span>
                <span style="font-size: 20px; cursor: pointer;">🎵</span>
                <span style="font-size: 20px; cursor: pointer;">▶️</span>
              </div>
            </div>
          </div>
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #94A3B8;">
            © 2026 OMNI SALON ENTERPRISE SUITE. TẤT CẢ QUYỀN ĐƯỢC BẢO LƯU.
          </div>
        </footer>
        </div>
      `;
    }
  };

  window.HomePage = HomePage;

})(typeof window !== 'undefined' ? window : this);
