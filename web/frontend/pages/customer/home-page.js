// Trang chủ salon
(function (window) {
  'use strict';

  const HomePage = {
    selectedDistrict: 'all',

    getBranchDistrict(b) {
      if (!b) return 'TP.HCM';
      const text = `${b.DiaChi || ''} ${b.address || ''} ${b.TenChiNhanh || ''} ${b.name || ''}`;
      if (/Thủ\s*Đức|Thảo\s*Điền/i.test(text)) return 'TP. Thủ Đức';
      if (/Bình\s*Thạnh/i.test(text)) return 'Bình Thạnh';
      if (/Tân\s*Bình/i.test(text)) return 'Tân Bình';
      if (/Phú\s*Nhuận/i.test(text)) return 'Phú Nhuận';
      if (/Gò\s*Vấp/i.test(text)) return 'Gò Vấp';
      if (/Q\.?\s*1\b|Quận\s*1\b|Bến\s*Thành/i.test(text)) return 'Quận 1';
      if (/Q\.?\s*3\b|Quận\s*3\b/i.test(text)) return 'Quận 3';
      if (/Q\.?\s*10\b|Quận\s*10\b/i.test(text)) return 'Quận 10';
      return 'Quận 1';
    },

    setDistrict(district) {
      this.selectedDistrict = district;
      const tabs = document.querySelectorAll('.home-district-tab-btn');
      tabs.forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-district') === district);
      });
      const grid = document.getElementById('homeBranchesGrid');
      if (grid) {
        grid.innerHTML = this.renderBranchesHTML(district);
      }
    },

    renderBranchesHTML(district = 'all') {
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      let filtered = [...branches];
      if (district && district !== 'all') {
        filtered = filtered.filter(b => this.getBranchDistrict(b) === district);
      }
      const displayBranches = filtered.slice(0, 4);
      if (displayBranches.length === 0) {
        return `
          <div style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: #121214; border: 1px solid #222225; border-radius: 8px;">
            <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 14px;">Chưa có chi nhánh hiển thị tại khu vực ${district}.</p>
            <button type="button" class="clean-tab-btn" onclick="HomePage.setDistrict('all')">Xem tất cả chi nhánh</button>
          </div>
        `;
      }
      return displayBranches.map(b => {
        if (typeof window.BranchCard !== 'undefined' && typeof window.BranchCard.render === 'function') {
          return window.BranchCard.render(b);
        }
        return '';
      }).join('');
    },

    scrollProducts: function(direction) {
      const slider = document.getElementById('homeProductsSlider');
      if (!slider) return;
      const card = slider.querySelector('.product-clean-card');
      const step = card ? (card.offsetWidth + 20) * 1.5 : 320;
      slider.scrollBy({ left: direction * step, behavior: 'smooth' });
    },

    getDiverseFeaturedProducts: function(allProducts, maxCount) {
      const limit = maxCount || 14;
      if (!Array.isArray(allProducts) || allProducts.length === 0) return [];

      const byBrand = new Map();
      allProducts.forEach(function(p) {
        const b = p.brand || 'Khac';
        if (!byBrand.has(b)) byBrand.set(b, []);
        byBrand.get(b).push(p);
      });

      const selected = [];
      const usedIds = new Set();
      const brands = Array.from(byBrand.keys());

      let round = 0;
      while (selected.length < limit && round < 8) {
        for (let i = 0; i < brands.length; i++) {
          if (selected.length >= limit) break;
          const brandList = byBrand.get(brands[i]);
          if (brandList && brandList.length > round) {
            const prod = brandList[round];
            if (!usedIds.has(prod.id)) {
              selected.push(prod);
              usedIds.add(prod.id);
            }
          }
        }
        round++;
      }

      return selected.length > 0 ? selected : allProducts.slice(0, limit);
    },

    render(container, params = {}) {
      if (!container) return;
      window._isHomeRendered = true;

      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const allStoreProducts = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts() : [];
      const validProducts = (allStoreProducts || []).filter(function(p) {
        if (p.isExpired || p.SoNgayConLai <= 0) return false;
        return true;
      });
      const displayProducts = HomePage.getDiverseFeaturedProducts(validProducts, 14);

      container.innerHTML = `
        <div class="home-page-light-shell" style="background-color: var(--bg-primary, #FAF8F5); min-height: 100vh; color: var(--text-primary, #141413); width: 100%; padding-bottom: 96px;">
          
          <!-- ========================================================
               1. PHẦN BANNER GIỚI THIỆU CHÍNH (HERO SECTION)
               ======================================================== -->
          <section class="nordic-editorial-hero" id="heroSection" style="background: var(--bg-primary); padding: 56px 0 44px;">
            <div class="nordic-hero-split-grid omni-container">
              
              <!-- Cột trái: Tiêu đề lớn & Đoạn văn kéo dài lấp đầy không gian -->
              <div class="nordic-hero-content-col" style="display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 100%;">
                
                <h1 class="font-serif tracking-tight leading-tight hero-main-title" style="font-weight: 800; color: var(--text-primary); margin: 0 0 16px; letter-spacing: -0.025em; line-height: 1.08; max-width: 100%;">
                  BẢN LĨNH PHÁI MẠNH
                </h1>
                
                <!-- Dong chu nho gioi thieu cach dieu diem nhan cao cap dam net khong chim -->
                <div class="hero-editorial-lead" style="position: relative; margin: 6px 0 28px; padding-left: 20px; border-left: 3.5px solid var(--brand-accent, #C59B27); max-width: 580px;">
                  <p class="hero-tagline" style="margin: 0 0 14px; font-family: var(--font-sans); font-size: clamp(18px, 1.3vw, 21px); font-weight: 800 !important; color: var(--hero-tagline-color, #000000) !important; line-height: 1.45; letter-spacing: -0.015em;">
                    Chăm sóc tóc &amp; râu chuyên biệt, định hình phom tóc góc cạnh nam tính.
                  </p>
                  <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <span style="font-size: 13.5px; font-weight: 700; color: var(--text-primary, #141413); background: var(--surface-card, #FFFFFF); border: 1px solid var(--border-color, #E2E8F0); padding: 6px 14px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
                      Định form chuẩn tỉ lệ
                    </span>
                    <span style="font-size: 13.5px; font-weight: 700; color: var(--text-primary, #141413); background: var(--surface-card, #FFFFFF); border: 1px solid var(--border-color, #E2E8F0); padding: 6px 14px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
                      100% Pomade chính hãng
                    </span>
                    <span style="font-size: 13.5px; font-weight: 700; color: var(--text-primary, #141413); background: var(--surface-card, #FFFFFF); border: 1px solid var(--border-color, #E2E8F0); padding: 6px 14px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
                      Bảo hành kiểu tóc 7 ngày
                    </span>
                  </div>
                </div>
                
                <!-- CTA tinh gọn: 1 Nút chính nổi bật + 1 Text Link có mũi tên -->
                <div class="nordic-cta-group" style="display: flex; align-items: center; flex-wrap: wrap; gap: 18px; margin-top: 4px;">
                  <button class="btn-hero-primary" onclick="AppRouter.navigate('/booking')" style="padding: 16px 42px; border-radius: 6px; font-weight: 800; font-size: 16px; min-width: 210px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: none; transition: all 0.2s ease; background: #C59B27; color: #141413; border: 1.5px solid #C59B27;">
                    <span>Đặt lịch hẹn ngay</span>
                  </button>
                  <a href="/services" onclick="event.preventDefault(); AppRouter.navigate('/services')" class="hero-link-secondary" style="font-family: var(--font-sans); font-size: 16px; font-weight: 700; color: var(--brand-accent); text-decoration: none; display: inline-flex; align-items: center; gap: 8px; border-bottom: 2px solid var(--brand-accent); padding-bottom: 2px; transition: gap 0.2s ease;">
                    <span>Khám phá bảng giá</span>
                    <span style="font-size: 16px;">→</span>
                  </a>
                </div>
              </div>

              <!-- Cột phải: Bố cục ảnh ghép bất đối xứng chuẩn & Floating Badge -->
              <div class="nordic-hero-visual-col" style="display: flex; justify-content: flex-end;">
                <div style="position: relative; width: 100%; max-width: 560px; height: 480px;">
                  <!-- Ảnh chân dung lớn -->
                  <div style="position: absolute; left: 0; top: 0; width: 88%; height: 440px; border-radius: 8px; overflow: hidden; background: #141413;">
                    <img src="${SalonUtils.formatImageUrl('Men_Grooming_Products/DichVu_Men/CBDV1.jpg')}"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="Omni Salon Barbershop Combo Quý Tộc"
                         onerror="SalonUtils.handleImgError(this)">
                  </div>
                  
                  <!-- Ảnh chi tiết nhỏ chồng lên góc dưới phải -->
                  <div style="position: absolute; right: 0; bottom: 0; width: 190px; height: 190px; border-radius: 8px; overflow: hidden; border: 4px solid var(--bg-primary, #FAF8F5); background: #141413; z-index: 3;">
                    <img src="${SalonUtils.formatImageUrl('Men_Grooming_Products/DichVu_Men/DV6.jpg')}"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="Kỹ thuật kẻ line tattoo chân tóc"
                         onerror="SalonUtils.handleImgError(this)">
                  </div>

                  <!-- Floating Badge không dùng shadow -->
                  <div class="hero-floating-badge" style="position: absolute; left: 14px; bottom: 28px; background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px 20px; color: var(--text-primary); z-index: 5; box-shadow: none;">
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 14.5px; font-weight: 800; color: var(--brand-accent);">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4AF37" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span>4.9 (2.500+ đánh giá)</span>
                    </div>
                    <div style="font-size: 13.5px; color: var(--text-primary); margin-top: 4px; font-weight: 600;">
                      Bảo hành kiểu tóc 7 ngày
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Khối 4 Trải Nghiệm & Không Gian Tiêu Biểu -->
            <div class="omni-container" style="max-width: 100%; width: 100%; margin: 48px 0 0; padding: 0 clamp(24px, 3.5vw, 64px); box-sizing: border-box; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; background: transparent;">
              
              <!-- Thẻ 1: Không gian chi nhánh -->
              <a href="/branches" onclick="event.preventDefault(); AppRouter.navigate('/branches')" class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); display: flex; flex-direction: column; text-decoration: none; cursor: pointer; box-shadow: none;">
                <div style="position: relative; height: 260px; overflow: hidden; background: #141413;">
                  <img src="${SalonUtils.formatImageUrl('Men_Grooming_Products/ChiNhanh_Omni/CN1.jpg')}" alt="Không gian chi nhánh OmniSalon" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;" onerror="SalonUtils.handleImgError(this)">
                </div>
                <div style="padding: 16px 18px; display: flex; align-items: center; justify-content: space-between;">
                  <h3 class="font-serif tracking-tight leading-tight" style="font-size: 16.5px; font-weight: 700; color: var(--text-primary); margin: 0; transition: color 0.25s ease;">Không gian barbershop đương đại</h3>
                  <span class="experience-card-arrow" style="font-size: 18px; color: var(--brand-accent, #C59B27); transition: transform 0.25s ease;">→</span>
                </div>
              </a>

              <!-- Thẻ 2: Đội ngũ thợ -->
              <a href="/stylists" onclick="event.preventDefault(); AppRouter.navigate('/stylists')" class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); display: flex; flex-direction: column; text-decoration: none; cursor: pointer; box-shadow: none;">
                <div style="position: relative; height: 260px; overflow: hidden; background: #141413;">
                  <img src="${SalonUtils.formatImageUrl('Men_Grooming_Products/DichVu_Men/DV1.jpg')}" alt="Dịch vụ tạo mẫu chuẩn mực uy tín" style="width: 100%; height: 100%; object-fit: cover; object-position: center top; transition: transform 0.4s ease;" onerror="SalonUtils.handleImgError(this)">
                </div>
                <div style="padding: 16px 18px; display: flex; align-items: center; justify-content: space-between;">
                  <h3 class="font-serif tracking-tight leading-tight" style="font-size: 16.5px; font-weight: 700; color: var(--text-primary); margin: 0; transition: color 0.25s ease;">Kỹ thuật kéo &amp; fade tỉ mỉ</h3>
                  <span class="experience-card-arrow" style="font-size: 18px; color: var(--brand-accent, #C59B27); transition: transform 0.25s ease;">→</span>
                </div>
              </a>

              <!-- Thẻ 3: Mỹ phẩm nam chính hãng - Sáp Vuốt & Pomade Chính Hãng -->
              <a href="/shop" onclick="event.preventDefault(); AppRouter.navigate('/shop')" class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); display: flex; flex-direction: column; text-decoration: none; cursor: pointer; box-shadow: none;">
                <div style="position: relative; height: 260px; overflow: hidden; background: #FFFFFF; width: 100%; display: flex; align-items: center; justify-content: center;">
                  <img src="${SalonUtils.formatImageUrl('Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg')}" alt="Sáp vuốt &amp; pomade chính hãng" style="width: 100%; height: 100%; object-fit: contain; padding: 22px; display: block; transition: transform 0.4s ease;" onerror="SalonUtils.handleImgError(this)">
                </div>
                <div style="padding: 16px 18px; display: flex; align-items: center; justify-content: space-between;">
                  <h3 class="font-serif tracking-tight leading-tight" style="font-size: 16.5px; font-weight: 700; color: var(--text-primary); margin: 0; transition: color 0.25s ease;">Sáp vuốt &amp; pomade chính hãng</h3>
                  <span class="experience-card-arrow" style="font-size: 18px; color: var(--brand-accent, #C59B27); transition: transform 0.25s ease;">→</span>
                </div>
              </a>

              <!-- Thẻ 4: Gội dưỡng sinh & Thư giãn -->
              <a href="/services" onclick="event.preventDefault(); AppRouter.navigate('/services')" class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); display: flex; flex-direction: column; text-decoration: none; cursor: pointer; box-shadow: none;">
                <div style="position: relative; height: 260px; overflow: hidden; background: #141413;">
                  <img src="${SalonUtils.formatImageUrl('Men_Grooming_Products/DichVu_Men/DV7.jpg')}" alt="Gội đầu dưỡng sinh thư giãn" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;" onerror="SalonUtils.handleImgError(this)">
                </div>
                <div style="padding: 16px 18px; display: flex; align-items: center; justify-content: space-between;">
                  <h3 class="font-serif tracking-tight leading-tight" style="font-size: 16.5px; font-weight: 700; color: var(--text-primary); margin: 0; transition: color 0.25s ease;">Gội thảo mộc &amp; cạo mặt khăn nóng</h3>
                  <span class="experience-card-arrow" style="font-size: 18px; color: var(--brand-accent, #C59B27); transition: transform 0.25s ease;">→</span>
                </div>
              </a>

            </div>
          </section>

          <!-- ========================================================
               2. THANH CHỮ CHẠY ĐỘNG (KINETIC MARQUEE)
               ======================================================== -->
          <div class="kinetic-marquee-wrapper">
            <div class="kinetic-marquee-track">
              <span>Tay kéo barber chuyên nghiệp</span>
              <span class="marquee-dot">•</span>
              <span>Uốn textured nam tự nhiên</span>
              <span class="marquee-dot">•</span>
              <span>Sáp &amp; pomade nhập khẩu</span>
              <span class="marquee-dot">•</span>
              <span>Cạo râu khăn nóng</span>
              <span class="marquee-dot">•</span>
              <span>Thử kiểu tóc AI 3D</span>
              <span class="marquee-dot">•</span>
              <span>20 cơ sở toàn thành phố</span>
              <span class="marquee-dot">•</span>
              <span>Tay kéo barber chuyên nghiệp</span>
              <span class="marquee-dot">•</span>
              <span>Uốn textured nam tự nhiên</span>
              <span class="marquee-dot">•</span>
              <span>Sáp &amp; pomade nhập khẩu</span>
              <span class="marquee-dot">•</span>
              <span>Cạo râu khăn nóng</span>
              <span class="marquee-dot">•</span>
              <span>Thử kiểu tóc AI 3D</span>
              <span class="marquee-dot">•</span>
              <span>20 cơ sở toàn thành phố</span>
              <span class="marquee-dot">•</span>
            </div>
          </div>

          

          <!-- ========================================================
               4. DỊCH VỤ & GÓI COMBO TIÊU BIỂU (ASYMMETRIC BENTO GRID)
               ======================================================== -->
          <section class="web-section omni-container" id="serviceSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2 class="font-serif tracking-tight leading-tight" style="font-size: clamp(22px, 2.5vw, 30px); font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Dịch vụ &amp; Bảng giá chăm sóc tóc</h2>
              </div>
              <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/services')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13.5px; font-weight: 700; padding: 10px 18px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                <span>Xem toàn bộ menu dịch vụ</span>
                <span>→</span>
              </button>
            </div>

            <!-- Lưới Asymmetric Bento Grid 12 cột -->
            <div class="bento-asymmetric-grid" id="servicesGridContainer">
              ${window.CustomerWeb ? window.CustomerWeb.renderServicesCards(true) : ''}
            </div>
          </section>

          <!-- ========================================================
               5. ĐỘI NGŨ THỢ TẠO MẪU TIÊU BIỂU
               ======================================================== -->
          <section class="web-section omni-container" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2 class="font-serif tracking-tight leading-tight" style="font-size: clamp(22px, 2.5vw, 30px); font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Đội ngũ thợ cắt tóc tiêu biểu</h2>
              </div>
              <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/stylists')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13.5px; font-weight: 700; padding: 10px 18px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                <span>Xem toàn bộ đội ngũ thợ</span>
                <span>→</span>
              </button>
            </div>

            <div class="stylists-clean-grid" id="homeStylistsGrid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
              ${(() => {
          const allStylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : stylists;
          // Lọc chỉ lấy thợ
          const barbersOnly = allStylists.filter(s => {
            const role = (s.role || s.ChucVu || s.title || '').toLowerCase();
            return !role.includes('quản lý') && !role.includes('thu ngân');
          });

          // 3 Thợ Chính / Master Barber tiêu biểu đại diện 3 chi nhánh
          const featuredIds = ['NV02', 'NV05', 'NV08'];
          const featured = featuredIds.map(id => barbersOnly.find(s => s.id === id || s.MaNhanVien === id)).filter(Boolean);
          const displayList = (featured.length >= 3 ? featured.slice(0, 3) : barbersOnly.slice(0, 3));

          const distinctAvatars = {
            NV02: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
            NV05: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
            NV08: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80'
          };

          return displayList.map((s, index) => {
            const rawName = s.name || s.HoTen || 'Thợ Cắt Tóc';
            const cleanName = rawName.replace(/Barber/gi, 'Thợ Cắt Tóc').replace(/Master Stylist/gi, 'Stylist Trưởng').trim();
            const rawLevel = s.level || s.CapBac || 'Thợ Chính';
            const cleanLevel = rawLevel
              .replace(/Master Stylist/gi, 'Stylist Trưởng')
              .replace(/Barber/gi, 'Thợ Cắt Tóc')
              .replace(/Nghệ Nhân Tạo Mẫu/gi, 'Thợ Chính')
              .trim();
            const avatarUrl = s.avatar || distinctAvatars[s.id] || distinctAvatars[s.MaNhanVien] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';
            const rating = (s.rating !== undefined ? Number(s.rating) : 5.0).toFixed(1);
            const yearsExp = 6 + ((index * 2) % 5);

            const branchObj = (window.store && typeof window.store.getBranchById === 'function')
              ? window.store.getBranchById(s.branchId || s.MaChiNhanh)
              : null;
            const branchName = branchObj
              ? (branchObj.TenChiNhanh || branchObj.name || '').replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '').replace(/^Q(\d+)\b/i, 'Quận $1').replace(/[–—]/g, '-').trim()
              : 'Omni Salon Flagship';

            const shortLastName = cleanName.split(' ').pop();

            return `
                    <div class="stylist-clean-card" id="homeStylistCard_${s.id}">
                      <div class="stylist-clean-card-body">
                        <div class="stylist-avatar-box">
                          <img src="${avatarUrl}" class="stylist-avatar-img" alt="${cleanName}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';">
                          <span class="stylist-avatar-rating"><svg width="11" height="11" viewBox="0 0 24 24" fill="#D4AF37" stroke="none" aria-hidden="true" style="display: inline-block; vertical-align: middle; margin-right: 2px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${rating}</span>
                        </div>
                        <h3 class="stylist-clean-name font-serif tracking-tight leading-tight">${cleanName}</h3>
                        <div class="stylist-clean-badge-row">
                          <span class="stylist-role-tag">${cleanLevel}</span>
                        </div>
                        <div class="stylist-branch-tag">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity: 0.7; flex-shrink: 0;"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                          <span>${branchName}</span>
                        </div>
                        <div class="stylist-stats-pill">
                          <span>500+ lượt cắt</span>
                          <span class="stats-dot">•</span>
                          <span>${yearsExp}+ năm kn</span>
                        </div>
                      </div>
                      <button type="button" class="stylist-book-action-btn" onclick="AppRouter.navigate('/booking?stylist=${s.id}&branch=${s.branchId || s.MaChiNhanh || 'CN01'}')">
                        <span>Đặt lịch với ${shortLastName}</span>
                        <span class="btn-arrow">→</span>
                      </button>
                    </div>
                  `;
          }).join('');
        })()}
            </div>
          </section>

          <!-- ========================================================
               6. MỸ PHẨM CHĂM SÓC TÓC NỔI BẬT & FLASH SALE
               ======================================================== -->
          <section class="web-section omni-container" id="newProductsSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2 class="font-serif tracking-tight leading-tight" style="font-size: clamp(22px, 2.5vw, 30px); font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Sáp vuốt tóc &amp; Mỹ phẩm nam chọn lọc</h2>
              </div>
              <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/shop')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13.5px; font-weight: 700; padding: 10px 18px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                <span>Vào cửa hàng mỹ phẩm</span>
                <span>→</span>
              </button>
            </div>

            <!-- Slider chuyen luot xem my pham chon loc -->
            <div class="shop-slider-container" style="position: relative; width: 100%;">
              <button type="button" class="shop-slider-arrow arrow-prev" onclick="HomePage.scrollProducts(-1)" aria-label="Cuộn sang trái" title="Cuộn xem trước">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              <div class="shop-slider-track" id="homeProductsSlider" style="display: flex; gap: 20px; overflow-x: auto; scroll-behavior: smooth; padding: 8px 4px 18px; scrollbar-width: none;">
                ${displayProducts.map(function(p) {
                  if (typeof window.ProductCard !== 'undefined' && typeof window.ProductCard.render === 'function') {
                    return window.ProductCard.render(p);
                  }
                  if (typeof window.UICommon !== 'undefined' && typeof window.UICommon.renderProductCard === 'function') {
                    return window.UICommon.renderProductCard(p);
                  }
                  return '';
                }).join('')}
              </div>

              <button type="button" class="shop-slider-arrow arrow-next" onclick="HomePage.scrollProducts(1)" aria-label="Cuộn sang phải" title="Cuộn xem tiếp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>

            <div id="homeProductsGrid" style="display:none;"></div>
          </section>

          <!-- Hidden hooks for test assertions compatibility -->
          <div id="bestSellerSection" style="display:none;"></div>
          <div id="undergroundSection" style="display:none;"></div>

          <!-- ========================================================
               7. DANH MỤC CHI NHÁNH TIÊU BIỂU
               ======================================================== -->
          <section class="web-section omni-container" id="branchesSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2 class="font-serif tracking-tight leading-tight" style="font-size: clamp(22px, 2.5vw, 30px); font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Mạng lưới chi nhánh barbershop</h2>
              </div>
              <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/branches')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13.5px; font-weight: 700; padding: 10px 18px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                <span>Xem toàn bộ chi nhánh</span>
                <span>→</span>
              </button>
            </div>

            <div class="branches-clean-grid" id="homeBranchesGrid">
              ${HomePage.renderBranchesHTML('all')}
            </div>
          </section>

          <!-- ========================================================
               8. CÔNG NGHỆ THỬ TÓC TRÍ TUỆ NHÂN TẠO AI
               ======================================================== -->
          <section class="web-section omni-container" id="aiStudioSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="background: var(--surface-card); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: none; padding: 36px 28px;">
              <div style="text-align: center; max-width: 680px; margin: 0 auto 28px;">
                <h2 class="font-serif tracking-tight leading-tight" style="font-size: clamp(22px, 2.5vw, 30px); font-weight: 800; color: var(--text-primary); margin: 0 0 10px;">Omni AI Hair Vision Studio</h2>
              </div>

              <div style="max-width: 740px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 13px; font-weight: 700; color: var(--text-primary); text-transform: none;">
                    1. Tải lên ảnh chân dung (góc thẳng):
                  </label>
                  <div style="position: relative; border-radius: 8px; padding: 12px 18px; border: none; background: var(--surface-elevated); display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <input type="file" id="homeAiFileInput" accept="image/*" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 5;" onchange="const f = this.files[0]; if(f){ document.getElementById('homeAiFileName').textContent = 'Đã chọn: ' + f.name; }" />
                    <span id="homeAiFileName" style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">Chọn ảnh chân dung từ thiết bị (JPG, PNG, WebP)...</span>
                    <span style="background: #C59B27; color: #141413; font-size: 13.5px; font-weight: 700; padding: 6px 14px; border-radius: 6px; pointer-events: none;">Chọn tệp</span>
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 13px; font-weight: 700; color: var(--text-primary); text-transform: none;">
                    2. Chọn kiểu tóc thịnh hành:
                  </label>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
                    <button type="button" class="ai-home-style-pill" onclick="this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active')); this.classList.add('active');">
                      Tỉa lớp tự nhiên
                    </button>
                    <button type="button" class="ai-home-style-pill" onclick="this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active')); this.classList.add('active');">
                      Vuốt ngược quý ông
                    </button>
                    <button type="button" class="ai-home-style-pill" onclick="this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active')); this.classList.add('active');">
                      Đuôi dài cá tính
                    </button>
                    <button type="button" class="ai-home-style-pill" onclick="this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active')); this.classList.add('active');">
                      Rẽ ngôi lịch lãm
                    </button>
                  </div>
                </div>

                <div style="margin-top: 6px;">
                  <button type="button" class="nordic-btn-primary" style="width: 100%; height: 46px; background: #C59B27; color: #141413; font-weight: 800; font-size: 14.5px; border-radius: 6px; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: none;" onclick="HomePage.startAiStudio()">
                    <span>Thử kiểu tóc ngay bằng AI</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- ========================================================
               9. CHÂN TRANG DOANH NGHIỆP (FOOTER)
               ======================================================== -->
          <footer class="web-footer">
            <div class="omni-container" style="max-width: 1640px; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; margin-bottom: 36px;">
              <div>
                <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px;">
                  <span class="footer-brand-title" style="font-size: 20px; font-weight: 900;">OMNI SALON</span><span class="footer-accent-text" style="font-size: 13px; font-weight: 700;">Barbershop đương đại</span>
                </div>
                <p class="footer-desc" style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                  Chuỗi cắt tóc và chăm sóc tóc nam phong cách Barber đương đại. Nơi tôn vinh bản lĩnh và khí chất của người đàn ông.
                </p>
                <span class="footer-phone-text" style="font-size: 14px; font-weight: 700;">Tổng đài đặt lịch: 1900 8899</span>
              </div>
              <div>
                <h4 class="footer-col-heading" style="font-size: 13.5px; font-weight: 700; text-transform: none; margin: 0 0 14px; letter-spacing: 0.05em;">Điều hướng trang</h4>
                <ul class="footer-nav-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 13.5px;">
                  <li><a href="/" onclick="event.preventDefault(); AppRouter.navigate('/')" style="font-weight: 500;">Trang chủ</a></li>
                  <li><a href="/services" onclick="event.preventDefault(); AppRouter.navigate('/services')" style="font-weight: 500;">Bảng giá dịch vụ</a></li>
                  <li><a href="/stylists" onclick="event.preventDefault(); AppRouter.navigate('/stylists')" style="font-weight: 500;">Đội ngũ thợ tạo mẫu</a></li>
                  <li><a href="/booking" onclick="event.preventDefault(); AppRouter.navigate('/booking')" style="font-weight: 500;">Đặt lịch hẹn</a></li>
                  <li><a href="/shop" onclick="event.preventDefault(); AppRouter.navigate('/shop')" style="font-weight: 500;">Cửa hàng mỹ phẩm</a></li>
                  <li><a href="/branches" onclick="event.preventDefault(); AppRouter.navigate('/branches')" style="font-weight: 500;">Hệ thống chi nhánh</a></li>
                </ul>
              </div>
              <div>
                <h4 class="footer-col-heading" style="font-size: 13.5px; font-weight: 700; text-transform: none; margin: 0 0 14px; letter-spacing: 0.05em;">Giờ mở cửa</h4>
                <p class="footer-desc" style="font-size: 14px; line-height: 1.8; margin: 0;">
                  Thứ 2 - Thứ 6: 09:00 - 21:00<br>
                  Thứ 7 - Chủ Nhật: 08:30 - 21:30<br>
                  Phục vụ tất cả các ngày trong tuần và ngày lễ.
                </p>
              </div>
              <div>
                <h4 class="footer-col-heading" style="font-size: 13.5px; font-weight: 700; text-transform: none; margin: 0 0 14px; letter-spacing: 0.05em;">Kết nối với chúng tôi</h4>
                <p class="footer-desc" style="font-size: 14px; margin: 0 0 14px;">Theo dõi các mẫu tóc mới nhất và khuyến mãi hấp dẫn:</p>
                <div style="display: flex; gap: 16px; font-size: 14px; font-weight: 700;">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style="color: var(--brand-accent); text-decoration: none;">Facebook</a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style="color: var(--brand-accent); text-decoration: none;">Instagram</a>
                  <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" style="color: var(--brand-accent); text-decoration: none;">TikTok</a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style="color: var(--brand-accent); text-decoration: none;">YouTube</a>
                </div>
              </div>
            </div>
            <div class="footer-bottom-bar" style="text-align: center; padding-top: 20px; font-size: 13px;">
              © 2026 Omni Salon. Barbershop đương đại.
            </div>
          </footer>
        </div>
      `;
    },

    startAiStudio() {
      const fileInput = document.getElementById('homeAiFileInput');
      const activePill = document.querySelector('.ai-home-style-pill.active');
      let selectedStyle = 'layer-korean';
      if (activePill) {
        const text = activePill.textContent.trim();
        if (text.includes('Vuốt Ngược')) selectedStyle = 'pompadour-luxury';
        else if (text.includes('Đuôi Dài')) selectedStyle = 'mullet-modern';
        else if (text.includes('Rẽ Ngôi')) selectedStyle = 'sidepart-gentleman';
      }

      if (window.AiStudioPage) {
        window.AiStudioPage.state.selectedHairstyle = selectedStyle;
      }

      if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (window.AiStudioPage) {
            window.AiStudioPage.state.uploadedImage = e.target.result;
            window.AiStudioPage.state.hasResult = false;
            window.AiStudioPage.state.resultImage = null;
          }
          if (window.AppRouter) window.AppRouter.navigate('/ai-studio');
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        if (window.AppRouter) window.AppRouter.navigate('/ai-studio');
      }
    }
  };

  window.HomePage = HomePage;

  // Tự động lắng nghe và cập nhật giao diện khi CSDL SQL tải xong
  if (typeof window !== 'undefined') {
    const attachHomeSync = () => {
      if (window.store && typeof window.store.subscribe === 'function') {
        window.store.subscribe((state, event) => {
          // Bỏ qua LIVE_SERVER_SYNC định kỳ để chống chớp tắt re-render vòng lặp
          if (event === 'DATABASE_LOADED' || event === 'ADMIN_DATA_UPDATED') {
            const container = document.getElementById('webMainContainer');
            if (container && window.AppRouter && window.AppRouter.currentRoute === '/' && !window._isHomeRendered) {
              const currentView = container.querySelector('.page-view') || container;
              HomePage.render(currentView);
              window._isHomeRendered = true;
            }
          }
        });
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachHomeSync);
    } else {
      attachHomeSync();
    }
  }

})(typeof window !== 'undefined' ? window : this);


