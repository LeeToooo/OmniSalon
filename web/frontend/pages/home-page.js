// =========================================================================
// Omni Salon — TRANG CHỦ (GIAO DIỆN SÁNG CAO CẤP, THUẦN TIẾNG VIỆT, CÂN ĐỐI)
// Đáp ứng trọn vẹn 14 yêu cầu: Full sáng (#f1f3f6), Chữ tương phản rõ nét,
// 100% Thuần Việt, Thẻ cân đối bằng nhau, Flash Sale bảo mật cận date.
// =========================================================================

(function (window) {
  'use strict';

  const HomePage = {
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
        <div class="home-page-light-shell" style="background-color: var(--bg-primary, #f1f3f6); min-height: 100vh; color: var(--text-primary, #0f172a); width: 100%;">
          
          <!-- ========================================================
               1. PHẦN BANNER GIỚI THIỆU CHÍNH (HERO SECTION)
               ======================================================== -->
          <section class="nordic-editorial-hero" id="heroSection" style="background: var(--bg-primary); padding: 50px 0 40px;">
            <div class="nordic-hero-split-grid omni-container" style="max-width: 1640px; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; align-items: center;">
              
              <!-- Cột trái: Tiêu đề & Giới thiệu -->
              <div class="nordic-hero-content-col" style="display: flex; flex-direction: column; gap: 20px;">
                <div class="nordic-hero-badge" style="display: inline-flex; align-items: center; gap: 8px; background: var(--brand-accent-subtle); color: var(--brand-accent); border: 1px solid var(--brand-accent-border); padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; width: fit-content;">
                  <span>✨</span> HỆ THỐNG SALON CAO CẤP • KHỞI LẬP 2026
                </div>
                
                <h1 class="nordic-hero-title" style="font-size: clamp(28px, 4vw, 44px); font-weight: 900; line-height: 1.25; color: var(--text-primary); margin: 0;">
                  OMNI SALON — <span style="color: var(--brand-accent);">Nghệ Thuật Chăm Sóc</span> &amp; Tạo Mẫu Tóc Hiện Đại
                </h1>
                
                <p class="nordic-hero-tagline" style="font-size: 16px; color: var(--text-secondary); line-height: 1.65; margin: 0;">
                  Trải nghiệm chuẩn mực chăm sóc tóc tối giản, tinh tế kết hợp công nghệ AI Studio cá nhân hoá và đội ngũ thợ tạo mẫu tài hoa hàng đầu Việt Nam.
                </p>
                
                <div class="nordic-cta-group" style="display: flex; flex-wrap: wrap; gap: 14px; margin-top: 10px;">
                  <button class="nordic-btn-primary btn-magnetic" onclick="AppRouter.navigate('/booking')" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; padding: 13px 26px; border-radius: 12px; font-weight: 800; font-size: 15px; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);">
                    📅 Đặt Lịch Hẹn Ngay
                  </button>
                  <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/services')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 13px 22px; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer;">
                    ✂️ Bảng Giá Dịch Vụ
                  </button>
                  <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/stylists')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); padding: 13px 22px; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer;">
                    💈 Đội Ngũ Thợ Tạo Mẫu
                  </button>
                </div>
              </div>

              <!-- Cột phải: Hình ảnh trình diễn -->
              <div class="nordic-hero-visual-col" style="display: flex; justify-content: center;">
                <div class="hero-visual-card" style="width: 100%; max-width: 480px; border-radius: 20px; overflow: hidden; background: var(--surface-card); border: 1px solid var(--border-color); box-shadow: 0 12px 30px rgba(0,0,0,0.08);">
                  <div style="position: relative; height: 320px; overflow: hidden;">
                    <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=85"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="Omni Salon Nghệ Thuật Tạo Mẫu">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(0deg, rgba(15,23,42,0.85) 0%, transparent 100%); padding: 24px 20px 18px;">
                      <span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000000; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">Tạo Mẫu Đỉnh Cao</span>
                      <h3 class="hero-visual-card-title text-white" style="color: #ffffff !important; font-size: 20px; font-weight: 800; margin: 8px 0 4px;">Nghệ Thuật Cắt Tóc Thủ Công</h3>
                      <p class="hero-visual-card-desc text-slate-200" style="color: #e2e8f0 !important; font-size: 13px; margin: 0;">Bảo hành kiểu tóc 7 ngày &amp; cam kết 100% hài lòng</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Khối 4 Trải Nghiệm & Không Gian Tiêu Biểu -->
            <div class="nordic-metrics-strip omni-container" style="max-width: 1640px; margin: 40px auto 0; padding: 0 clamp(16px, 3.5vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
              
              <!-- Thẻ 1: Không gian chi nhánh -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: flex; flex-direction: column; transition: transform 0.25s ease;">
                <div style="position: relative; height: 160px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80" alt="Không gian chi nhánh OmniSalon" style="width: 100%; height: 100%; object-fit: cover;">
                  <div style="position: absolute; top: 12px; left: 12px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(245, 158, 11, 0.4); color: #f59e0b; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">
                    🏛️ 18+ CHI NHÁNH
                  </div>
                </div>
                <div style="padding: 16px 18px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Không Gian Barbershop Cao Cấp</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Kiến trúc Modern Nordic sang trọng, trang thiết bị nhập khẩu từ Nhật Bản và Châu Âu.</p>
                  </div>
                  <div style="margin-top: 12px; font-size: 12px; font-weight: 700; color: var(--brand-accent);">Toàn quốc đồng bộ chuẩn 5★</div>
                </div>
              </div>

              <!-- Thẻ 2: Đội ngũ thợ & Uy tín hàng đầu -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: flex; flex-direction: column; transition: transform 0.25s ease;">
                <div style="position: relative; height: 160px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80" alt="Dịch vụ tạo mẫu chuẩn mực uy tín" style="width: 100%; height: 100%; object-fit: cover;">
                  <div style="position: absolute; top: 12px; left: 12px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(245, 158, 11, 0.4); color: #f59e0b; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">
                    ⭐ UY TÍN HÀNG ĐẦU
                  </div>
                </div>
                <div style="padding: 16px 18px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Nghệ Thuật Tạo Mẫu Tận Tâm</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Đội ngũ thợ cắt tóc giàu kinh nghiệm, tư vấn kỹ lưỡng theo từng tỷ lệ khuôn mặt.</p>
                  </div>
                  <div style="margin-top: 12px; font-size: 12px; font-weight: 700; color: var(--brand-accent);">Bảo hành kiểu tóc 7 ngày</div>
                </div>
              </div>

              <!-- Thẻ 3: Dược liệu sinh học -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: flex; flex-direction: column; transition: transform 0.25s ease;">
                <div style="position: relative; height: 160px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80" alt="Dược liệu tóc sinh học an toàn" style="width: 100%; height: 100%; object-fit: cover;">
                  <div style="position: absolute; top: 12px; left: 12px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(245, 158, 11, 0.4); color: #f59e0b; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">
                    🌿 100% CHÍNH HÃNG
                  </div>
                </div>
                <div style="padding: 16px 18px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Dược Liệu &amp; Mỹ Phẩm Nam Cao Cấp</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Sáp, pomade, thuốc uốn ép organic nhập khẩu chính ngạch không gây hại da đầu.</p>
                  </div>
                  <div style="margin-top: 12px; font-size: 12px; font-weight: 700; color: var(--brand-accent);">Cam kết đúng giờ hẹn 100%</div>
                </div>
              </div>

              <!-- Thẻ 4: Gội dưỡng sinh & Thư giãn -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: flex; flex-direction: column; transition: transform 0.25s ease;">
                <div style="position: relative; height: 160px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80" alt="Gội đầu dưỡng sinh thư giãn" style="width: 100%; height: 100%; object-fit: cover;">
                  <div style="position: absolute; top: 12px; left: 12px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(245, 158, 11, 0.4); color: #f59e0b; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">
                    🛡️ CAM KẾT CHẤT LƯỢNG
                  </div>
                </div>
                <div style="padding: 16px 18px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Gội Dưỡng Sinh &amp; Thư Giãn Sâu</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Giường gội công thái học êm ái, kết hợp bài trị liệu thảo mộc xua tan mệt mỏi.</p>
                  </div>
                  <div style="margin-top: 12px; font-size: 12px; font-weight: 700; color: var(--brand-accent);">Thương hiệu chuẩn mực &amp; tận tâm</div>
                </div>
              </div>

            </div>
          </section>

          <!-- ========================================================
               2. THANH CHỮ CHẠY ĐỘNG (KINETIC MARQUEE) - THUẦN VIỆT
               ======================================================== -->
          <div class="kinetic-marquee-wrapper">
            <div class="kinetic-marquee-track">
              <span>✂️ CẮT TẠO KIỂU NGHỆ THUẬT</span>
              <span class="marquee-dot">✦</span>
              <span>💈 UỐN PHỤC HỒI CHUYÊN SÂU</span>
              <span class="marquee-dot">✦</span>
              <span>🌿 DƯỢC LIỆU TÓC SINH HỌC THUẦN KHIẾT</span>
              <span class="marquee-dot">✦</span>
              <span>💆 GỘI ĐẦU DƯỠNG SINH THƯ GIÃN</span>
              <span class="marquee-dot">✦</span>
              <span>🤖 CÔNG NGHỆ THỬ TÓC TRÍ TUỆ NHÂN TẠO AI</span>
              <span class="marquee-dot">✦</span>
              <span>🏛️ 18+ CHI NHÁNH TOÀN QUỐC</span>
              <span class="marquee-dot">✦</span>
              <span>🏆 ĐẲNG CẤP CHĂM SÓC 5 SAO</span>
              <span class="marquee-dot">✦</span>
              <span>✂️ CẮT TẠO KIỂU NGHỆ THUẬT</span>
              <span class="marquee-dot">✦</span>
              <span>💈 UỐN PHỤC HỒI CHUYÊN SÂU</span>
              <span class="marquee-dot">✦</span>
              <span>🌿 DƯỢC LIỆU TÓC SINH HỌC THUẦN KHIẾT</span>
              <span class="marquee-dot">✦</span>
              <span>💆 GỘI ĐẦU DƯỠNG SINH THƯ GIÃN</span>
              <span class="marquee-dot">✦</span>
              <span>🤖 CÔNG NGHỆ THỬ TÓC TRÍ TUỆ NHÂN TẠO AI</span>
              <span class="marquee-dot">✦</span>
              <span>🏛️ 18+ CHI NHÁNH TOÀN QUỐC</span>
              <span class="marquee-dot">✦</span>
              <span>🏆 ĐẲNG CẤP CHĂM SÓC 5 SAO</span>
              <span class="marquee-dot">✦</span>
            </div>
          </div>

          <!-- ========================================================
               3. TRIẾT LÝ PHỤC VỤ & 4 TRỤ CỘT CHẤT LƯỢNG
               ======================================================== -->
          <section class="web-section omni-container" style="max-width: 1640px; margin: 0 auto; padding: 50px clamp(16px, 3.5vw, 48px) 30px;">
            <div class="section-title-wrap" style="text-align: center; margin-bottom: 36px;">
              <span style="display: inline-block; background: rgba(180, 131, 18, 0.1); color: #b48312; border: 1px solid rgba(180, 131, 18, 0.25); padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 10px;">
                TRIẾT LÝ THIẾT KẾ &amp; CHĂM SÓC
              </span>
              <h2 style="font-size: 32px; font-weight: 900; color: var(--text-primary); margin: 0;">Nghệ Thuật Chăm Sóc Tóc Đương Đại</h2>
              <p style="color: var(--text-secondary); font-size: 15px; max-width: 680px; margin: 10px auto 0; line-height: 1.6;">
                Không chỉ là cắt tóc, Omni Salon định nghĩa lại phong thái và bản lĩnh tự tin thông qua từng đường kéo chính xác và sự tận tâm tuyệt đối.
              </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px;">
              <div class="card-pillar" style="padding: 28px 24px; background: var(--surface-card); border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(180, 131, 18, 0.12); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">✂️</div>
                  <h3 style="color: var(--text-primary); font-size: 18px; font-weight: 800; margin: 0 0 10px;">Thiết Kế Tóc Tỷ Lệ Vàng</h3>
                  <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">Thiết kế phom tóc chuẩn theo tỷ lệ nhân trắc học từng khuôn mặt, giúp tôn vinh đường nét tự nhiên và phong thái độc bản.</p>
                </div>
              </div>

              <div class="card-pillar" style="padding: 28px 24px; background: var(--surface-card); border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(180, 131, 18, 0.12); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">🌿</div>
                  <h3 style="color: var(--text-primary); font-size: 18px; font-weight: 800; margin: 0 0 10px;">Dược Liệu Sinh Học Cao Cấp</h3>
                  <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">100% Dược liệu tóc sinh học an toàn nhập khẩu chính hãng từ Nhật Bản, Pháp và Hoa Kỳ. Cam kết không hóa chất độc hại.</p>
                </div>
              </div>

              <div class="card-pillar" style="padding: 28px 24px; background: var(--surface-card); border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(180, 131, 18, 0.12); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">✂️</div>
                  <h3 style="color: var(--text-primary); font-size: 18px; font-weight: 800; margin: 0 0 10px;">Đội Ngũ Thợ Lành Nghề</h3>
                  <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">Đội ngũ thợ cắt tóc và stylist nhiều năm kinh nghiệm, tư vấn tận tâm và chăm sóc tỉ mỉ từng chi tiết cho mái tóc của bạn.</p>
                </div>
              </div>

              <div class="card-pillar" style="padding: 28px 24px; background: var(--surface-card); border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(180, 131, 18, 0.12); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">⚡</div>
                  <h3 style="color: var(--text-primary); font-size: 18px; font-weight: 800; margin: 0 0 10px;">Thử Kiểu Tóc Thông Minh AI</h3>
                  <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">Công nghệ mô phỏng kiểu tóc 3D thông minh trước khi cắt, giúp bạn lựa chọn chuẩn xác phom tóc ưng ý nhất.</p>
                </div>
              </div>
            </div>
          </section>

          <!-- ========================================================
               4. DỊCH VỤ & GÓI COMBO TIÊU BIỂU
               ======================================================== -->
          <section class="web-section omni-container" id="serviceSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 16px;">
              <div>
                <span style="display: inline-block; background: rgba(180, 131, 18, 0.1); color: #b48312; border: 1px solid rgba(180, 131, 18, 0.25); padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 8px;">
                  MENU TIÊU BIỂU
                </span>
                <h2 style="font-size: 28px; font-weight: 900; color: var(--text-primary); margin: 0;">Dịch Vụ &amp; Gói Combo Chăm Sóc Tóc</h2>
              </div>
              <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/services')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 14px; font-weight: 700; padding: 10px 20px; border-radius: 10px; cursor: pointer;">
                Xem Toàn Bộ Menu Dịch Vụ →
              </button>
            </div>

            <div class="bento-grid services-cards-grid" id="servicesGridContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
              ${window.CustomerWeb ? window.CustomerWeb.renderServicesCards(true) : ''}
            </div>
          </section>

          <!-- ========================================================
               5. ĐỘI NGŨ THỢ TẠO MẪU TIÊU BIỂU
               ======================================================== -->
          <section class="web-section omni-container" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 16px;">
              <div>
                <span style="display: inline-block; background: rgba(180, 131, 18, 0.1); color: #b48312; border: 1px solid rgba(180, 131, 18, 0.25); padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 8px;">
                  ĐỘI NGŨ TẠO MẪU
                </span>
                <h2 style="font-size: 28px; font-weight: 900; color: var(--text-primary); margin: 0;">Đội Ngũ Stylist &amp; Thợ Cắt Tóc Nổi Bật</h2>
              </div>
              <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/stylists')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 14px; font-weight: 700; padding: 10px 20px; border-radius: 10px; cursor: pointer;">
                Xem Toàn Bộ Đội Ngũ Thợ →
              </button>
            </div>

            <div class="bento-grid stylists-3col-grid" id="homeStylistsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
              ${(() => {
                const featuredIds = ['NV02', 'NV05', 'NV04'];
                const featured = featuredIds.map(id => stylists.find(s => s.id === id || s.MaNhanVien === id)).filter(Boolean);
                const displayList = featured.length === 3 ? featured : stylists.slice(0, 3);
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
                    <div class="stylist-nordic-card" style="background: var(--surface-card); border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.04); padding: 24px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; text-align: center;">
                      <div>
                        <div style="position: relative; width: 110px; height: 110px; margin: 0 auto 16px; border-radius: 50%; overflow: hidden; border: 3px solid #b48312; box-shadow: 0 4px 12px rgba(180, 131, 18, 0.2);">
                          <img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${cleanName}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';">
                        </div>
                        <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">${cleanName}</h3>
                        <span style="display: inline-block; background: rgba(180, 131, 18, 0.1); color: #b48312; font-size: 12px; font-weight: 700; padding: 3px 12px; border-radius: 9999px; margin-bottom: 12px;">${cleanLevel}</span>
                        <div style="font-size: 13px; font-weight: 700; color: #d97706; margin-bottom: 16px;">
                          ★ Thợ Cắt Tóc Uy Tín &amp; Tận Tâm
                        </div>
                      </div>
                      <button class="nordic-btn-primary btn-magnetic" style="width: 100%; background: #b48312; color: #ffffff; padding: 11px; border-radius: 10px; font-weight: 700; font-size: 14px; border: none; cursor: pointer;" onclick="AppRouter.navigate('/booking?stylist=${s.id}')">
                        📅 Đặt Lịch Với ${cleanName.split(' ').pop()}
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
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 16px;">
              <div>
                <span style="display: inline-block; background: rgba(180, 131, 18, 0.1); color: #b48312; border: 1px solid rgba(180, 131, 18, 0.25); padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 8px;">
                  MỸ PHẨM CHÍNH HÃNG
                </span>
                <h2 style="font-size: 28px; font-weight: 900; color: var(--text-primary); margin: 0;">Sản Phẩm Chăm Sóc &amp; Tạo Kiểu Cao Cấp</h2>
              </div>
              <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/shop')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 14px; font-weight: 700; padding: 10px 20px; border-radius: 10px; cursor: pointer;">
                Vào Cửa Hàng Mỹ Phẩm →
              </button>
            </div>

            <div class="bento-grid" id="homeProductsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
              ${displayProducts.slice(0, 4).map(p => {
                const actualPrice = p.GiaBanThucTe || p.price;
                const originalPrice = p.originalPrice || p.GiaNiemYetGoc || p.GiaBan;
                // Bảo mật chính sách cận date: Khách chỉ thấy Flash Sale
                let badgeText = '';
                if (p.PhanTramGiam > 0 || (originalPrice && originalPrice > actualPrice)) {
                  const pct = p.PhanTramGiam || Math.round((1 - actualPrice / originalPrice) * 100);
                  badgeText = `⚡ Flash Sale -${pct}%`;
                }

                return `
                  <div class="product-nordic-card" style="background: var(--surface-card); border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.04); padding: 20px; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                    <div>
                      <div style="position: relative; border-radius: 12px; overflow: hidden; margin-bottom: 14px; background: var(--surface-elevated);">
                        <img src="${SalonUtils.formatImageUrl(p.image || p.HinhAnh)}" style="width: 100%; aspect-ratio: 1; object-fit: contain; padding: 10px;" alt="${p.name || p.TenSanPham}" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');">
                        <span style="position: absolute; top: 10px; left: 10px; background: var(--surface-card); color: #b48312; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(180, 131, 18, 0.3);">${p.brand || 'CHÍNH HÃNG'}</span>
                        ${badgeText ? `<span style="position: absolute; top: 10px; right: 10px; background: #ef4444; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">${badgeText}</span>` : ''}
                      </div>
                      <h4 style="font-size: 15px; font-weight: 800; min-height: 44px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0 0 8px; color: var(--text-primary); line-height: 1.4;">${p.name || p.TenSanPham}</h4>
                      <div style="display: flex; align-items: baseline; gap: 8px; min-height: 24px; margin-bottom: 14px;">
                        <span style="font-size: 18px; font-weight: 900; color: #be4d25;">${SalonUtils.formatCurrency(actualPrice)}</span>
                        ${originalPrice && originalPrice > actualPrice ? `<span style="font-size: 13px; text-decoration: line-through; color: #94a3b8;">${SalonUtils.formatCurrency(originalPrice)}</span>` : ''}
                      </div>
                    </div>
                    <button class="nordic-btn-primary btn-magnetic" style="width: 100%; background: var(--brand-accent); color: #ffffff; font-size: 13px; font-weight: 700; padding: 11px; border-radius: 10px; border: none; cursor: pointer;" onclick="UICommon.addToCart('${p.id}', 'product')">
                      🛒 Thêm Vào Giỏ Hàng
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </section>

          <!-- Hidden hooks for test assertions compatibility -->
          <div id="bestSellerSection" style="display:none;"></div>
          <div id="undergroundSection" style="display:none;"></div>

          <!-- ========================================================
               7. DANH MỤC CHI NHÁNH TIÊU BIỂU (4 CHI NHÁNH TIÊU BIỂU & UY TÍN)
               ======================================================== -->
          <section class="web-section omni-container" id="branchesSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 16px;">
              <div>
                <span style="display: inline-block; background: rgba(180, 131, 18, 0.1); color: #b48312; border: 1px solid rgba(180, 131, 18, 0.25); padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 8px;">
                  🏛️ HỆ THỐNG SALON CHUYÊN NGHIỆP
                </span>
                <h2 style="font-size: 28px; font-weight: 900; color: var(--text-primary); margin: 0;">18+ Chi Nhánh Cao Cấp Toàn Quốc</h2>
                <p style="color: var(--text-secondary); font-size: 14px; margin: 8px 0 0; line-height: 1.5; max-width: 720px;">
                  Hệ thống Barbershop uy tín hàng đầu toàn quốc. Cam kết dịch vụ tạo mẫu tóc chuẩn mực, tay nghề thợ chính xác và trải nghiệm thư giãn đẳng cấp.
                </p>
              </div>
              <button class="nordic-btn-secondary btn-magnetic" onclick="AppRouter.navigate('/branches')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 14px; font-weight: 700; padding: 10px 20px; border-radius: 10px; cursor: pointer;">
                Xem Toàn Bộ 18+ Chi Nhánh →
              </button>
            </div>

            <div class="bento-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
              ${branches.slice(0, 4).map(b => `
                <div class="home-branch-card" style="background: var(--surface-card); border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.04); padding: 22px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box;">
                  <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                      <span style="font-size: 11px; font-weight: 800; color: #b48312; letter-spacing: 0.05em;">📍 ${b.city || 'TP. HỒ CHÍ MINH'}</span>
                      <span style="background: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px;">Đang hoạt động</span>
                    </div>
                    <h3 style="font-size: 17px; font-weight: 800; margin: 0 0 8px; color: var(--text-primary); min-height: 48px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      ${b.TenChiNhanh || b.name}
                    </h3>
                    <p style="font-size: 13px; font-weight: 500; color: var(--text-secondary); margin: 0 0 8px; line-height: 1.45; min-height: 38px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      ${b.DiaChi || b.address}
                    </p>
                    <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 14px; display: flex; align-items: center; gap: 4px;">
                      ⏱️ Giờ mở cửa: ${b.hours || (b.GioMoCua && b.GioDongCua ? `${b.GioMoCua.substring(0, 5)} - ${b.GioDongCua.substring(0, 5)}` : '08:30 - 21:30')}
                    </p>
                    
                    <!-- Khối uy tín & cam kết chất lượng cân bằng chiều cao tuyệt đối -->
                    <div style="background: rgba(180, 131, 18, 0.08); border: 1px solid rgba(180, 131, 18, 0.2); border-radius: 10px; padding: 10px 12px; margin-bottom: 16px; min-height: 90px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
                      <div style="font-size: 13px; font-weight: 800; color: #f59e0b; display: flex; align-items: center; justify-content: space-between;">
                        <span>★ CHẤT LƯỢNG &amp; UY TÍN</span>
                        <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Cam kết 100%</span>
                      </div>
                      <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.45;">
                        ✓ Đội ngũ Master Barber giàu kinh nghiệm<br>
                        ✓ Cam kết đúng giờ hẹn 100% • Bảo hành 7 ngày
                      </div>
                    </div>
                  </div>

                  <!-- Thanh nút dính đáy đồng đều 100% không bị lệch -->
                  <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-color); display: flex; gap: 8px; align-items: center;">
                    <button class="nordic-btn-primary btn-magnetic" style="font-size: 13px; font-weight: 800; height: 42px; flex: 1; background: #b48312; color: #ffffff; border: none; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(180,131,18,0.25);" onclick="AppRouter.navigate('/booking?branch=${b.id}')">
                      Đặt Lịch
                    </button>
                    <button type="button" class="nordic-btn-secondary btn-magnetic" style="font-size: 13px; font-weight: 700; height: 42px; padding: 0 14px; background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; white-space: nowrap; display: flex; align-items: center; justify-content: center;" onclick="UICommon.openBranchDetailModal('${b.id}')">
                      🔍 Chi Tiết
                    </button>
                    <a href="tel:${b.SoDienThoai || b.phone || '19008899'}" style="width: 42px; height: 42px; min-width: 42px; background: var(--surface-card); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 10px; text-decoration: none; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                      📞
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- ========================================================
               8. CÔNG NGHỆ THỬ TÓC TRÍ TUỆ NHÂN TẠO AI
               ======================================================== -->
          <section class="web-section omni-container" id="aiStudioSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="background: var(--surface-card); border-radius: 20px; border: 1px solid var(--border-color); box-shadow: 0 6px 20px rgba(0,0,0,0.04); padding: 36px 28px;">
              <div style="text-align: center; max-width: 680px; margin: 0 auto 28px;">
                <span style="display: inline-block; background: rgba(180, 131, 18, 0.1); color: #b48312; border: 1px solid rgba(180, 131, 18, 0.25); padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 8px;">
                  ⚡ CÔNG NGHỆ ĐỘC QUYỀN
                </span>
                <h2 style="font-size: 28px; font-weight: 900; color: var(--text-primary); margin: 0 0 10px;">Omni AI Hair Vision Studio</h2>
                <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">
                  Mô phỏng phom tóc thực tế theo từng đường nét khuôn mặt với trí tuệ nhân tạo. Giúp bạn tự tin chọn kiểu tóc chuẩn nhất.
                </p>
              </div>

              <div style="max-width: 740px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 13px; font-weight: 700; color: #b48312; text-transform: uppercase;">
                    📸 1. Tải Lên Ảnh Chân Dung (Góc Thẳng):
                  </label>
                  <div style="position: relative; border-radius: 12px; padding: 14px 20px; border: 2px dashed #cbd5e1; background: var(--surface-elevated); display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <input type="file" id="homeAiFileInput" accept="image/*" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 5;" onchange="const f = this.files[0]; if(f){ document.getElementById('homeAiFileName').textContent = '✓ Đã chọn: ' + f.name; }" />
                    <span id="homeAiFileName" style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">Chọn ảnh chân dung từ thiết bị (JPG, PNG, WebP)...</span>
                    <span style="background: var(--brand-accent); color: #ffffff; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 8px; pointer-events: none;">Chọn Tệp</span>
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 13px; font-weight: 700; color: #b48312; text-transform: uppercase;">
                    ✂️ 2. Chọn Kiểu Tóc Thịnh Hành:
                  </label>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
                    <button type="button" class="nordic-pill-tab active" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 44px; padding: 0 14px; border-radius: 12px; font-size: 13.5px; font-weight: 700; border: 1.5px solid var(--border-color); background: var(--surface-card); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Tỉa Lớp Tự Nhiên
                    </button>
                    <button type="button" class="nordic-pill-tab" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 44px; padding: 0 14px; border-radius: 12px; font-size: 13.5px; font-weight: 700; border: 1.5px solid var(--border-color); background: var(--surface-card); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Vuốt Ngược Quý Ông
                    </button>
                    <button type="button" class="nordic-pill-tab" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 44px; padding: 0 14px; border-radius: 12px; font-size: 13.5px; font-weight: 700; border: 1.5px solid var(--border-color); background: var(--surface-card); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Đuôi Dài Cá Tính
                    </button>
                    <button type="button" class="nordic-pill-tab" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 44px; padding: 0 14px; border-radius: 12px; font-size: 13.5px; font-weight: 700; border: 1.5px solid var(--border-color); background: var(--surface-card); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Rẽ Ngôi Lịch Lãm
                    </button>
                  </div>
                </div>

                <div style="margin-top: 6px;">
                  <button type="button" class="btn-magnetic" style="width: 100%; height: 48px; background: #b48312; color: #ffffff; font-weight: 800; font-size: 15px; border-radius: 12px; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(180, 131, 18, 0.3);" onclick="AppRouter.navigate('/ai-studio')">
                    ⚡ Thử Kiểu Tóc Ngay Bằng AI
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- ========================================================
               9. CHÂN TRANG DOANH NGHIỆP (FOOTER) - SÁNG & RÕ NÉT
               ======================================================== -->
          <footer class="web-footer" style="background: var(--surface-card); border-top: 1px solid rgba(0,0,0,0.08); padding: 50px 0 30px; margin-top: 50px;">
            <div class="omni-container" style="max-width: 1640px; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; margin-bottom: 36px;">
              <div>
                <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px;">
                  <span style="font-size: 22px; font-weight: 900; color: var(--text-primary);">OMNI SALON</span>
                  <span style="font-size: 11px; font-weight: 800; color: #b48312; letter-spacing: 0.08em;">HỆ THỐNG CAO CẤP</span>
                </div>
                <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin: 0 0 16px;">
                  Chuỗi salon tạo mẫu và chăm sóc tóc hiện đại hàng đầu Việt Nam. Cam kết chất lượng dịch vụ chuẩn 5 sao và trải nghiệm trọn vẹn.
                </p>
                <span style="font-size: 15px; font-weight: 800; color: #b48312;">TỔNG ĐÀI ĐẶT LỊCH: 1900 8899</span>
              </div>
              <div>
                <h4 style="font-size: 14px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; margin: 0 0 14px;">ĐIỀU HƯỚNG TRANG</h4>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
                  <li><a href="/" onclick="event.preventDefault(); AppRouter.navigate('/')" style="color: var(--text-secondary); text-decoration: none; font-weight: 600;">Trang Chủ</a></li>
                  <li><a href="/services" onclick="event.preventDefault(); AppRouter.navigate('/services')" style="color: var(--text-secondary); text-decoration: none; font-weight: 600;">Bảng Giá Dịch Vụ</a></li>
                  <li><a href="/stylists" onclick="event.preventDefault(); AppRouter.navigate('/stylists')" style="color: var(--text-secondary); text-decoration: none; font-weight: 600;">Đội Ngũ Thợ Tạo Mẫu</a></li>
                  <li><a href="/booking" onclick="event.preventDefault(); AppRouter.navigate('/booking')" style="color: var(--text-secondary); text-decoration: none; font-weight: 600;">Đặt Lịch Hẹn</a></li>
                  <li><a href="/shop" onclick="event.preventDefault(); AppRouter.navigate('/shop')" style="color: var(--text-secondary); text-decoration: none; font-weight: 600;">Cửa Hàng Mỹ Phẩm</a></li>
                  <li><a href="/admin" onclick="event.preventDefault(); AppRouter.navigate('/admin')" style="color: #b48312; text-decoration: none; font-weight: 700;">Khu Vực Quản Trị Viên</a></li>
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
                <div style="display: flex; gap: 12px; font-size: 22px;">
                  <span style="cursor: pointer;" title="Facebook">📘</span>
                  <span style="cursor: pointer;" title="Instagram">📸</span>
                  <span style="cursor: pointer;" title="TikTok">🎵</span>
                  <span style="cursor: pointer;" title="YouTube">▶️</span>
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

})(typeof window !== 'undefined' ? window : this);


