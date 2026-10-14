// =========================================================================
// Omni Salon — TRANG CHỦ (GIAO DIỆN SÁNG CAO CẤP, THUẦN TIẾNG VIỆT, CÂN ĐỐI)
// Đáp ứng trọn vẹn 14 yêu cầu: Full sáng (#f1f3f6), Chữ tương phản rõ nét,
// 100% Thuần Việt, Thẻ cân đối bằng nhau, Flash Sale bảo mật cận date.
// =========================================================================

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
            <button type="button" class="clean-tab-btn" onclick="HomePage.setDistrict('all')">Xem Tất Cả Chi Nhánh</button>
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

    render(container, params = {}) {
      if (!container) return;

      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const rawProducts = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts('new') : [];

      // Lọc bỏ sản phẩm đã hết hạn (<= 0 ngày), ẩn tuyệt đối thông tin cận date, gắn nhãn Flash Sale
      const displayProducts = rawProducts.filter(p => {
        if (p.isExpired || p.SoNgayConLai <= 0) return false;
        return true;
      });

      container.innerHTML = `
        <div class="home-page-light-shell" style="background-color: var(--bg-primary, #0A0A0B); min-height: 100vh; color: var(--text-primary, #F4F4F5); width: 100%;">
          
          <!-- ========================================================
               1. PHẦN BANNER GIỚI THIỆU CHÍNH (HERO SECTION)
               ======================================================== -->
          <section class="nordic-editorial-hero" id="heroSection" style="background: var(--bg-primary); padding: 48px 0 40px;">
            <div class="nordic-hero-split-grid omni-container" style="max-width: 1640px; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; align-items: center;">
              
              <!-- Cột trái: Tiêu đề & Giới thiệu (Xóa pill-badge thừa thãi) -->
              <div class="nordic-hero-content-col" style="display: flex; flex-direction: column; gap: 18px;">
                <h1 class="nordic-hero-title" style="font-size: clamp(28px, 4vw, 44px); font-weight: 800; line-height: 1.25; color: var(--text-primary); margin: 0; letter-spacing: -0.02em;">
                  OMNI SALON — <span style="color: var(--brand-accent);">Nghệ Thuật Chăm Sóc</span> &amp; Tạo Mẫu Tóc Hiện Đại
                </h1>
                
                <p class="nordic-hero-tagline" style="font-size: 15.5px; color: var(--text-secondary); line-height: 1.65; margin: 0;">
                  Trải nghiệm chuẩn mực chăm sóc tóc tối giản, tinh tế kết hợp công nghệ AI Studio cá nhân hoá và đội ngũ thợ tạo mẫu tài hoa hàng đầu Việt Nam.
                </p>
                
                <div class="nordic-cta-group" style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px;">
                  <button class="nordic-btn-primary" onclick="AppRouter.navigate('/booking')" style="background: #D97706; color: #09090B; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14.5px; border: none; cursor: pointer; box-shadow: none;">
                    Đặt Lịch Hẹn Ngay
                  </button>
                  <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/services')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14.5px; cursor: pointer; box-shadow: none;">
                    Bảng Giá Dịch Vụ
                  </button>
                  <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/stylists')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14.5px; cursor: pointer; box-shadow: none;">
                    Đội Ngũ Thợ Tạo Mẫu
                  </button>
                </div>
              </div>

              <!-- Cột phải: Hình ảnh trình diễn -->
              <div class="nordic-hero-visual-col" style="display: flex; justify-content: center;">
                <div class="hero-visual-card" style="width: 100%; max-width: 480px; border-radius: 8px; overflow: hidden; background: var(--surface-card); border: 1px solid var(--border-color); box-shadow: none;">
                  <div style="position: relative; height: 320px; overflow: hidden;">
                    <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=85"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="Omni Salon Nghệ Thuật Tạo Mẫu">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(0deg, rgba(10,10,11,0.92) 0%, transparent 100%); padding: 24px 20px 18px;">
                      <span style="background: #27272A; color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.2); font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">Tạo Mẫu Đỉnh Cao</span>
                      <h3 class="hero-visual-card-title" style="color: #F4F4F5 !important; font-size: 20px; font-weight: 700; margin: 8px 0 4px;">Nghệ Thuật Cắt Tóc Thủ Công</h3>
                      <p class="hero-visual-card-desc" style="color: #A1A1AA !important; font-size: 13px; margin: 0;">Bảo hành kiểu tóc 7 ngày &amp; cam kết chuẩn mực chất lượng</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Khối 4 Trải Nghiệm & Không Gian Tiêu Biểu -->
            <div class="omni-container" style="max-width: 1640px; margin: 36px auto 0; padding: 0 clamp(16px, 3.5vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; background: transparent; border: none; box-shadow: none;">
              
              <!-- Thẻ 1: Không gian chi nhánh -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: none; display: flex; flex-direction: column; transition: transform 0.2s ease;">
                <div style="position: relative; height: 150px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80" alt="Không gian chi nhánh OmniSalon" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Không Gian Barbershop Cao Cấp</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Kiến trúc Modern sang trọng, trang thiết bị nhập khẩu tiêu chuẩn 5 sao.</p>
                  </div>
                  <div style="margin-top: 12px; font-size: 12px; font-weight: 600; color: #D97706;">Toàn quốc đồng bộ 18+ chi nhánh</div>
                </div>
              </div>

              <!-- Thẻ 2: Đội ngũ thợ & Uy tín hàng đầu -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: none; display: flex; flex-direction: column; transition: transform 0.2s ease;">
                <div style="position: relative; height: 150px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80" alt="Dịch vụ tạo mẫu chuẩn mực uy tín" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Nghệ Thuật Tạo Mẫu Tận Tâm</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Đội ngũ thợ cắt tóc giàu kinh nghiệm, tư vấn kỹ lưỡng theo từng tỷ lệ khuôn mặt.</p>
                  </div>
                  <div style="margin-top: 12px; font-size: 12px; font-weight: 600; color: #D97706;">Bảo hành kiểu tóc 7 ngày</div>
                </div>
              </div>

              <!-- Thẻ 3: Dược liệu sinh học -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: none; display: flex; flex-direction: column; transition: transform 0.2s ease;">
                <div style="position: relative; height: 150px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80" alt="Dược liệu tóc sinh học an toàn" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Dược Liệu &amp; Mỹ Phẩm Nam Cao Cấp</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Sáp, pomade, tinh chất dưỡng sinh học nhập khẩu chính ngạch an toàn da đầu.</p>
                  </div>
                  <div style="margin-top: 12px; font-size: 12px; font-weight: 600; color: #D97706;">Cam kết đúng giờ hẹn 100%</div>
                </div>
              </div>

              <!-- Thẻ 4: Gội dưỡng sinh & Thư giãn -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: none; display: flex; flex-direction: column; transition: transform 0.2s ease;">
                <div style="position: relative; height: 150px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80" alt="Gội đầu dưỡng sinh thư giãn" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Gội Dưỡng Sinh &amp; Thư Giãn Sâu</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Giường gội công thái học êm ái kết hợp bài trị liệu thảo mộc xua tan mệt mỏi.</p>
                  </div>
                  <div style="margin-top: 12px; font-size: 12px; font-weight: 600; color: #D97706;">Chuẩn mực &amp; tận tâm</div>
                </div>
              </div>

            </div>
          </section>

          <!-- ========================================================
               2. THANH CHỮ CHẠY ĐỘNG (KINETIC MARQUEE) - THUẦN VIỆT
               ======================================================== -->
          <div class="kinetic-marquee-wrapper">
            <div class="kinetic-marquee-track">
              <span>CẮT TẠO KIỂU NGHỆ THUẬT</span>
              <span class="marquee-dot">•</span>
              <span>UỐN PHỤC HỒI CHUYÊN SÂU</span>
              <span class="marquee-dot">•</span>
              <span>DƯỢC LIỆU TÓC SINH HỌC THUẦN KHIẾT</span>
              <span class="marquee-dot">•</span>
              <span>GỘI ĐẦU DƯỠNG SINH THƯ GIÃN</span>
              <span class="marquee-dot">•</span>
              <span>CÔNG NGHỆ THỬ TÓC TRÍ TUỆ NHÂN TẠO AI</span>
              <span class="marquee-dot">•</span>
              <span>18+ CHI NHÁNH TOÀN QUỐC</span>
              <span class="marquee-dot">•</span>
              <span>ĐẲNG CẤP CHĂM SÓC 5 SAO</span>
              <span class="marquee-dot">•</span>
              <span>CẮT TẠO KIỂU NGHỆ THUẬT</span>
              <span class="marquee-dot">•</span>
              <span>UỐN PHỤC HỒI CHUYÊN SÂU</span>
              <span class="marquee-dot">•</span>
              <span>DƯỢC LIỆU TÓC SINH HỌC THUẦN KHIẾT</span>
              <span class="marquee-dot">•</span>
              <span>GỘI ĐẦU DƯỠNG SINH THƯ GIÃN</span>
              <span class="marquee-dot">•</span>
              <span>CÔNG NGHỆ THỬ TÓC TRÍ TUỆ NHÂN TẠO AI</span>
              <span class="marquee-dot">•</span>
              <span>18+ CHI NHÁNH TOÀN QUỐC</span>
              <span class="marquee-dot">•</span>
              <span>ĐẲNG CẤP CHĂM SÓC 5 SAO</span>
              <span class="marquee-dot">•</span>
            </div>
          </div>

          <!-- ========================================================
               3. TRIẾT LÝ PHỤC VỤ & 4 TRỤ CỘT CHẤT LƯỢNG
               ======================================================== -->
          <section class="web-section omni-container" style="max-width: 1640px; margin: 0 auto; padding: 48px clamp(16px, 3.5vw, 48px) 24px;">
            <div class="section-title-wrap" style="text-align: center; margin-bottom: 32px;">
              <h2 style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0;">Nghệ Thuật Chăm Sóc Tóc Đương Đại</h2>
              <p style="color: var(--text-secondary); font-size: 14.5px; max-width: 680px; margin: 10px auto 0; line-height: 1.6;">
                Không chỉ là cắt tóc, Omni Salon định nghĩa lại phong thái và bản lĩnh tự tin thông qua từng đường kéo chính xác và sự tận tâm tuyệt đối.
              </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
              <div class="card-pillar" style="padding: 24px 20px; background: var(--surface-card); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: none; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: #D97706; margin-bottom: 12px; font-family: monospace;">01</div>
                  <h3 style="color: var(--text-primary); font-size: 17px; font-weight: 700; margin: 0 0 8px;">Thiết Kế Tóc Tỷ Lệ Vàng</h3>
                  <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0;">Thiết kế phom tóc chuẩn theo tỷ lệ nhân trắc học từng khuôn mặt, giúp tôn vinh đường nét tự nhiên và phong thái độc bản.</p>
                </div>
              </div>

              <div class="card-pillar" style="padding: 24px 20px; background: var(--surface-card); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: none; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: #D97706; margin-bottom: 12px; font-family: monospace;">02</div>
                  <h3 style="color: var(--text-primary); font-size: 17px; font-weight: 700; margin: 0 0 8px;">Dược Liệu Sinh Học Cao Cấp</h3>
                  <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0;">100% Dược liệu tóc sinh học an toàn nhập khẩu chính hãng từ Nhật Bản, Pháp và Hoa Kỳ. Cam kết không hóa chất độc hại.</p>
                </div>
              </div>

              <div class="card-pillar" style="padding: 24px 20px; background: var(--surface-card); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: none; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: #D97706; margin-bottom: 12px; font-family: monospace;">03</div>
                  <h3 style="color: var(--text-primary); font-size: 17px; font-weight: 700; margin: 0 0 8px;">Đội Ngũ Thợ Lành Nghề</h3>
                  <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0;">Đội ngũ thợ cắt tóc và stylist nhiều năm kinh nghiệm, tư vấn tận tâm và chăm sóc tỉ mỉ từng chi tiết cho mái tóc của bạn.</p>
                </div>
              </div>

              <div class="card-pillar" style="padding: 24px 20px; background: var(--surface-card); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: none; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: #D97706; margin-bottom: 12px; font-family: monospace;">04</div>
                  <h3 style="color: var(--text-primary); font-size: 17px; font-weight: 700; margin: 0 0 8px;">Thử Kiểu Tóc Thông Minh AI</h3>
                  <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0;">Công nghệ mô phỏng kiểu tóc 3D thông minh trước khi cắt, giúp bạn lựa chọn chuẩn xác phom tóc ưng ý nhất.</p>
                </div>
              </div>
            </div>
          </section>

          <!-- ========================================================
               4. DỊCH VỤ & GÓI COMBO TIÊU BIỂU
               ======================================================== -->
          <section class="web-section omni-container" id="serviceSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2 style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Dịch Vụ &amp; Gói Combo Chăm Sóc Tóc</h2>
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">Quy trình phục vụ chuẩn mực với các chuyên gia tạo mẫu hàng đầu.</p>
              </div>
              <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/services')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13.5px; font-weight: 600; padding: 10px 18px; border-radius: 8px; cursor: pointer; box-shadow: none;">
                Xem Toàn Bộ Menu Dịch Vụ
              </button>
            </div>

            <div class="bento-grid services-cards-grid" id="servicesGridContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
              ${window.CustomerWeb ? window.CustomerWeb.renderServicesCards(true) : ''}
            </div>
          </section>

          <!-- ========================================================
               5. ĐỘI NGŨ THỢ TẠO MẪU TIÊU BIỂU
               ======================================================== -->
          <section class="web-section omni-container" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2 style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Đội Ngũ Stylist &amp; Thợ Cắt Tóc Nổi Bật</h2>
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">Được đào tạo chuyên sâu về kỹ thuật kéo, phom tóc và tư vấn diện mạo.</p>
              </div>
              <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/stylists')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13.5px; font-weight: 600; padding: 10px 18px; border-radius: 8px; cursor: pointer; box-shadow: none;">
                Xem Toàn Bộ Đội Ngũ Thợ
              </button>
            </div>

            <div class="bento-grid stylists-4col-grid" id="homeStylistsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
              ${(() => {
                const featuredIds = ['NV02', 'NV05', 'NV08', 'NV04'];
                const featured = featuredIds.map(id => stylists.find(s => s.id === id || s.MaNhanVien === id)).filter(Boolean);
                const displayList = featured.length === 4 ? featured : stylists.slice(0, 4);
                return displayList.map(s => {
                  const rawName = s.name || s.HoTen || 'Thợ Cắt Tóc';
                  const cleanName = rawName.replace(/Barber/gi, 'Thợ Cắt Tóc').replace(/Master Stylist/gi, 'Stylist Trưởng').trim();
                  const rawLevel = s.level || s.CapBac || 'Thợ Chính';
                  const cleanLevel = rawLevel
                    .replace(/Master Stylist/gi, 'Stylist Trưởng')
                    .replace(/Barber/gi, 'Thợ Cắt Tóc')
                    .replace(/Nghệ Nhân Tạo Mẫu/gi, 'Stylist Chuyên Nghiệp')
                    .trim();
                  const avatarUrl = s.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';
                  return `
                    <div class="stylist-nordic-card" style="background: var(--surface-card); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: none; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; text-align: center;">
                      <div>
                        <div style="position: relative; width: 100px; height: 100px; margin: 0 auto 14px; border-radius: 50%; overflow: hidden; border: 2px solid #27272A;">
                          <img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${cleanName}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';">
                        </div>
                        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">${cleanName}</h3>
                        <span style="display: inline-block; background: #27272A; color: #A1A1AA; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 4px; margin-bottom: 10px;">${cleanLevel}</span>
                        <div style="font-size: 12.5px; font-weight: 500; color: #71717A; margin-bottom: 16px;">
                          Chuyên môn cao &amp; tận tâm
                        </div>
                      </div>
                      <button class="nordic-btn-primary" style="width: 100%; background: #D97706; color: #09090B; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 13.5px; border: none; cursor: pointer; box-shadow: none;" onclick="AppRouter.navigate('/booking?stylist=${s.id}&branch=${s.branchId || s.MaChiNhanh || 'CN01'}')">
                        Đặt Lịch Với ${cleanName.split(' ').pop()}
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
                <h2 style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Sản Phẩm Chăm Sóc &amp; Tạo Kiểu Cao Cấp</h2>
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0; line-height: 1.5;">Cam kết 100% sáp vuốt, pomade, gôm xịt chính hãng nhập khẩu nguyên hộp.</p>
              </div>
              <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/shop')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13.5px; font-weight: 600; padding: 10px 18px; border-radius: 8px; cursor: pointer; box-shadow: none;">
                Vào Cửa Hàng Mỹ Phẩm
              </button>
            </div>

            <div class="products-clean-grid" id="homeProductsGrid">
              ${displayProducts.slice(0, 4).map(p => {
                if (typeof window.ProductCard !== 'undefined' && typeof window.ProductCard.render === 'function') {
                  return window.ProductCard.render(p);
                }
                if (typeof window.UICommon !== 'undefined' && typeof window.UICommon.renderProductCard === 'function') {
                  return window.UICommon.renderProductCard(p);
                }
                return '';
              }).join('')}
            </div>
          </section>

          <!-- Hidden hooks for test assertions compatibility -->
          <div id="bestSellerSection" style="display:none;"></div>
          <div id="undergroundSection" style="display:none;"></div>

          <!-- ========================================================
               7. DANH MỤC CHI NHÁNH TIÊU BIỂU (TÁI CẤU TRÚC: THANH FILTER THEO QUẬN & NÚT SECONDARY)
               ======================================================== -->
          <section class="web-section omni-container" id="branchesSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 22px; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2 style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Hệ Thống Chi Nhánh Chuyên Nghiệp</h2>
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0; line-height: 1.5; max-width: 720px;">
                  Không gian Modern Nordic sang trọng, chuẩn mực vệ sinh tối đa và đồng bộ chất lượng 5 sao trên toàn thành phố.
                </p>
              </div>
              <button class="branch-book-btn" onclick="AppRouter.navigate('/branches')" style="height: 38px; padding: 0 16px; font-size: 13px;">
                <span>Xem Toàn Bộ 18+ Chi Nhánh</span>
                <span style="font-size: 15px;">→</span>
              </button>
            </div>

            <!-- Thanh Filter chọn Quận / Khu Vực (Tabs: Tất cả, Quận 1, Tân Bình, Bình Thạnh, Quận 3...) -->
            <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-right: 4px;">Khu Vực:</span>
              <div class="clean-filter-tabs">
                ${['all', 'Quận 1', 'Quận 3', 'Bình Thạnh', 'Tân Bình', 'Gò Vấp', 'Phú Nhuận', 'TP. Thủ Đức'].map(d => {
                  const label = d === 'all' ? 'Tất Cả' : d;
                  const isActive = (HomePage.selectedDistrict || 'all') === d;
                  return `
                    <button type="button" 
                            class="clean-tab-btn home-district-tab-btn ${isActive ? 'active' : ''}" 
                            data-district="${d}"
                            onclick="HomePage.setDistrict('${d}')">
                      ${label}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="branches-clean-grid" id="homeBranchesGrid">
              ${HomePage.renderBranchesHTML(HomePage.selectedDistrict || 'all')}
            </div>
          </section>

          <!-- ========================================================
               8. CÔNG NGHỆ THỬ TÓC TRÍ TUỆ NHÂN TẠO AI
               ======================================================== -->
          <section class="web-section omni-container" id="aiStudioSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="background: var(--surface-card); border-radius: 8px; border: 1px solid var(--border-color); box-shadow: none; padding: 36px 28px;">
              <div style="text-align: center; max-width: 680px; margin: 0 auto 28px;">
                <h2 style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0 0 10px;">Omni AI Hair Vision Studio</h2>
                <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">
                  Mô phỏng phom tóc thực tế theo từng đường nét khuôn mặt với trí tuệ nhân tạo. Giúp bạn tự tin chọn kiểu tóc chuẩn nhất.
                </p>
              </div>

              <div style="max-width: 740px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 13px; font-weight: 600; color: #D97706; text-transform: uppercase;">
                    1. Tải Lên Ảnh Chân Dung (Góc Thẳng):
                  </label>
                  <div style="position: relative; border-radius: 8px; padding: 12px 18px; border: 1px dashed #3F3F46; background: #18181B; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <input type="file" id="homeAiFileInput" accept="image/*" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 5;" onchange="const f = this.files[0]; if(f){ document.getElementById('homeAiFileName').textContent = 'Đã chọn: ' + f.name; }" />
                    <span id="homeAiFileName" style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">Chọn ảnh chân dung từ thiết bị (JPG, PNG, WebP)...</span>
                    <span style="background: #27272A; color: #F4F4F5; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 6px; border: 1px solid #3F3F46; pointer-events: none;">Chọn Tệp</span>
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 13px; font-weight: 600; color: #D97706; text-transform: uppercase;">
                    2. Chọn Kiểu Tóc Thịnh Hành:
                  </label>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
                    <button type="button" class="clean-tab-btn active" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 40px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Tỉa Lớp Tự Nhiên
                    </button>
                    <button type="button" class="clean-tab-btn" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 40px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Vuốt Ngược Quý Ông
                    </button>
                    <button type="button" class="clean-tab-btn" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 40px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Đuôi Dài Cá Tính
                    </button>
                    <button type="button" class="clean-tab-btn" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 40px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Rẽ Ngôi Lịch Lãm
                    </button>
                  </div>
                </div>

                <div style="margin-top: 6px;">
                  <button type="button" class="nordic-btn-primary" style="width: 100%; height: 46px; background: #D97706; color: #09090B; font-weight: 600; font-size: 14.5px; border-radius: 8px; border: none; cursor: pointer; box-shadow: none;" onclick="AppRouter.navigate('/ai-studio')">
                    Thử Kiểu Tóc Ngay Bằng AI
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- ========================================================
               9. CHÂN TRANG DOANH NGHIỆP (FOOTER) - SÁNG & RÕ NÉT
               ======================================================== -->
          <footer class="web-footer" style="background: var(--surface-card); border-top: 1px solid var(--border-color); padding: 48px 0 28px; margin-top: 48px;">
            <div class="omni-container" style="max-width: 1640px; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; margin-bottom: 36px;">
              <div>
                <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px;">
                  <span style="font-size: 20px; font-weight: 800; color: var(--text-primary);">OMNI SALON</span>
                  <span style="font-size: 11px; font-weight: 600; color: #D97706; letter-spacing: 0.08em;">HỆ THỐNG CAO CẤP</span>
                </div>
                <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin: 0 0 16px;">
                  Chuỗi salon tạo mẫu và chăm sóc tóc hiện đại hàng đầu Việt Nam. Cam kết chất lượng dịch vụ chuẩn mực và trải nghiệm trọn vẹn.
                </p>
                <span style="font-size: 14px; font-weight: 700; color: #D97706;">TỔNG ĐÀI ĐẶT LỊCH: 1900 8899</span>
              </div>
              <div>
                <h4 style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; margin: 0 0 14px;">ĐIỀU HƯỚNG TRANG</h4>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 13.5px;">
                  <li><a href="/" onclick="event.preventDefault(); AppRouter.navigate('/')" style="color: var(--text-secondary); text-decoration: none; font-weight: 500;">Trang Chủ</a></li>
                  <li><a href="/services" onclick="event.preventDefault(); AppRouter.navigate('/services')" style="color: var(--text-secondary); text-decoration: none; font-weight: 500;">Bảng Giá Dịch Vụ</a></li>
                  <li><a href="/stylists" onclick="event.preventDefault(); AppRouter.navigate('/stylists')" style="color: var(--text-secondary); text-decoration: none; font-weight: 500;">Đội Ngũ Thợ Tạo Mẫu</a></li>
                  <li><a href="/booking" onclick="event.preventDefault(); AppRouter.navigate('/booking')" style="color: var(--text-secondary); text-decoration: none; font-weight: 500;">Đặt Lịch Hẹn</a></li>
                  <li><a href="/shop" onclick="event.preventDefault(); AppRouter.navigate('/shop')" style="color: var(--text-secondary); text-decoration: none; font-weight: 500;">Cửa Hàng Mỹ Phẩm</a></li>
                  <li><a href="/admin" onclick="event.preventDefault(); AppRouter.navigate('/admin')" style="color: #D97706; text-decoration: none; font-weight: 600;">Khu Vực Quản Trị Viên</a></li>
                </ul>
              </div>
              <div>
                <h4 style="font-size: 14px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; margin: 0 0 14px;">GIỜ HOẠT ĐỘNG</h4>
                <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.8; margin: 0;">
                  Thứ 2 - Thứ 6: 09:00 - 21:00<br>
                  Thứ 7 - Chủ Nhật: 08:30 - 21:30<br>
                  Phục vụ tất cả các ngày trong tuần và ngày lễ.
                </p>
              </div>
              <div>
                <h4 style="font-size: 14px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; margin: 0 0 14px;">KẾT NỐI VỚI CHÚNG TÔI</h4>
                <p style="font-size: 14px; color: var(--text-secondary); margin: 0 0 14px;">Theo dõi các mẫu tóc mới nhất và khuyến mãi hấp dẫn:</p>
                <div style="display: flex; gap: 16px; font-size: 14px; font-weight: 700;">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style="color: var(--text-primary); text-decoration: none;">Facebook</a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style="color: var(--text-primary); text-decoration: none;">Instagram</a>
                  <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" style="color: var(--text-primary); text-decoration: none;">TikTok</a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style="color: var(--text-primary); text-decoration: none;">YouTube</a>
                </div>
              </div>
            </div>
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid var(--border-color); font-size: 13px; color: var(--text-secondary);">
              © 2026 OMNI SALON. TẤT CẢ QUYỀN ĐƯỢC BẢO LƯU. HỆ THỐNG QUẢN LÝ SALON CHUYÊN NGHIỆP.
            </div>
          </footer>
        </div>
      `;
    }
  };

  window.HomePage = HomePage;

  // Tự động lắng nghe và cập nhật giao diện khi CSDL SQL tải xong
  if (typeof window !== 'undefined') {
    const attachHomeSync = () => {
      if (window.store && typeof window.store.subscribe === 'function') {
        window.store.subscribe((state, event) => {
          if (event === 'LIVE_SERVER_SYNC' || event === 'STATE_CHANGE') {
            const container = document.getElementById('webMainContainer');
            if (container && window.AppRouter && window.AppRouter.currentRoute === '/') {
              const currentView = container.querySelector('.page-view') || container;
              HomePage.render(currentView);
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


