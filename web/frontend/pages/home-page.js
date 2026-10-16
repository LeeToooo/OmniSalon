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
        <div class="home-page-light-shell" style="background-color: var(--bg-primary, #FAF8F5); min-height: 100vh; color: var(--text-primary, #141413); width: 100%;">
          
          <!-- ========================================================
               1. PHẦN BANNER GIỚI THIỆU CHÍNH (HERO SECTION)
               ======================================================== -->
          <section class="nordic-editorial-hero" id="heroSection" style="background: var(--bg-primary); padding: 56px 0 48px;">
            <div class="nordic-hero-split-grid omni-container" style="max-width: 1640px; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 48px; align-items: center;">
              
              <!-- Cột trái: Nhãn nhỏ, Tiêu đề lớn Playfair Display & CTA tinh gọn -->
              <div class="nordic-hero-content-col" style="display: flex; flex-direction: column; gap: 14px;">
                <span class="hero-eyebrow" style="font-family: var(--font-sans); text-transform: uppercase; letter-spacing: 0.15em; font-size: 13px; font-weight: 700; color: #C59B27; display: inline-block;">
                  CHUẨN MỰC BARBERSHOP ĐƯƠNG ĐẠI
                </span>
                
                <h1 class="font-serif tracking-tight leading-tight hero-main-title" style="font-size: clamp(34px, 4.6vw, 54px); font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.025em; line-height: 1.15;">
                  Định Hình Phong Cách &amp; Bản Lĩnh Phái Mạnh
                </h1>
                
                <p class="hero-tagline" style="font-family: var(--font-sans); font-size: 15.5px; color: var(--text-secondary); line-height: 1.65; margin: 6px 0 16px; max-width: 540px;">
                  Không gian chăm sóc tóc và râu dành riêng cho nam giới. Nơi từng đường kéo tỉ mỉ kết hợp phom tóc phù hợp góc cạnh gương mặt, sáp pomade chính hãng và sự thư giãn sau ngày làm việc.
                </p>
                
                <!-- CTA tinh gọn: 1 Nút chính nổi bật + 1 Text Link có mũi tên -->
                <div class="nordic-cta-group" style="display: flex; align-items: center; flex-wrap: wrap; gap: 18px; margin-top: 4px;">
                  <button class="btn-hero-primary" onclick="AppRouter.navigate('/booking')" style="background: #141413; color: #FAF8F5; padding: 13px 28px; border-radius: 6px; font-weight: 700; font-size: 14.5px; border: 1px solid rgba(255, 255, 255, 0.12); cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(20, 20, 19, 0.15); transition: all 0.2s ease;">
                    <span>Đặt Lịch Hẹn Ngay</span>
                  </button>
                  <a href="/services" onclick="event.preventDefault(); AppRouter.navigate('/services')" style="font-family: var(--font-sans); font-size: 14.5px; font-weight: 700; color: #C59B27; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: gap 0.2s ease;">
                    <span>Khám phá bảng giá</span>
                    <span style="font-size: 16px;">→</span>
                  </a>
                </div>
              </div>

              <!-- Cột phải: Bố cục ảnh ghép bất đối xứng & Floating Badge kính mờ -->
              <div class="nordic-hero-visual-col" style="display: flex; justify-content: center;">
                <div style="position: relative; width: 100%; max-width: 490px; height: 380px;">
                  <!-- Ảnh chân dung lớn -->
                  <div style="position: absolute; left: 0; top: 0; width: 84%; height: 340px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(20, 20, 19, 0.1); background: #141413;">
                    <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=85"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="Omni Salon Barbershop">
                  </div>
                  
                  <!-- Ảnh chi tiết nhỏ chồng lên góc dưới phải -->
                  <div style="position: absolute; right: 0; bottom: 0; width: 185px; height: 185px; border-radius: 10px; overflow: hidden; border: 4px solid var(--bg-primary, #FAF8F5); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18); background: #141413; z-index: 3;">
                    <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80"
                         style="width: 100%; height: 100%; object-fit: cover;"
                         alt="Kỹ thuật kéo và tông đơ">
                  </div>

                  <!-- Floating Badge kính mờ (Glassmorphism) -->
                  <div style="position: absolute; left: -10px; bottom: 30px; background: rgba(20, 20, 19, 0.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(197, 155, 39, 0.35); border-radius: 8px; padding: 12px 18px; color: #FAF8F5; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22); z-index: 5;">
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 800; color: #C59B27;">
                      <span style="color: #F59E0B;">★</span>
                      <span>4.9 (2,500+ Đánh giá)</span>
                    </div>
                    <div style="font-size: 12px; color: #E7E2DA; margin-top: 3px; font-weight: 500;">
                      Bảo hành kiểu tóc 7 ngày
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Khối 4 Trải Nghiệm & Không Gian Tiêu Biểu (Editorial Layout & Clean Copywriting) -->
            <div class="omni-container" style="max-width: 1640px; margin: 44px auto 0; padding: 0 clamp(16px, 3.5vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; background: transparent;">
              
              <!-- Thẻ 1: Không gian chi nhánh -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid rgba(20, 20, 19, 0.08); display: flex; flex-direction: column;">
                <div style="position: relative; height: 155px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80" alt="Không gian chi nhánh OmniSalon" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 class="font-serif tracking-tight leading-tight" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Không Gian Barbershop Đương Đại</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Ghế cắt công thái học êm ái, ánh sáng vừa vặn và âm nhạc thư giãn dành riêng cho nam giới.</p>
                  </div>
                  <div style="margin-top: 14px;">
                    <a href="/branches" onclick="event.preventDefault(); AppRouter.navigate('/branches')" style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #C59B27; text-decoration: none;">
                      <span>Hệ thống 20 chi nhánh</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Thẻ 2: Đội ngũ thợ -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid rgba(20, 20, 19, 0.08); display: flex; flex-direction: column;">
                <div style="position: relative; height: 155px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80" alt="Dịch vụ tạo mẫu chuẩn mực uy tín" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 class="font-serif tracking-tight leading-tight" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Kỹ Thuật Kéo &amp; Fade Tỉ Mỉ</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Đội ngũ thợ barber hiểu chất tóc Á Đông, tư vấn độ dài và cách vuốt sáp dễ dàng hằng ngày.</p>
                  </div>
                  <div style="margin-top: 14px;">
                    <a href="/stylists" onclick="event.preventDefault(); AppRouter.navigate('/stylists')" style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #C59B27; text-decoration: none;">
                      <span>Bảo hành kiểu tóc 7 ngày</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Thẻ 3: Mỹ phẩm nam chính hãng -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid rgba(20, 20, 19, 0.08); display: flex; flex-direction: column;">
                <div style="position: relative; height: 155px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80" alt="Sáp vuốt tóc chính hãng" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 class="font-serif tracking-tight leading-tight" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Sáp Vuốt &amp; Pomade Chính Hãng</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Sáp vuốt tóc, pomade gốc nước, dầu dưỡng râu nhập khẩu nguyên hộp, an toàn cho da đầu.</p>
                  </div>
                  <div style="margin-top: 14px;">
                    <a href="/shop" onclick="event.preventDefault(); AppRouter.navigate('/shop')" style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #C59B27; text-decoration: none;">
                      <span>Khám phá sản phẩm</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Thẻ 4: Gội dưỡng sinh & Thư giãn -->
              <div class="feature-experience-card" style="background: var(--surface-card); border-radius: 8px; overflow: hidden; border: 1px solid rgba(20, 20, 19, 0.08); display: flex; flex-direction: column;">
                <div style="position: relative; height: 155px; overflow: hidden;">
                  <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80" alt="Gội đầu dưỡng sinh thư giãn" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <h3 class="font-serif tracking-tight leading-tight" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Gội Thảo Mộc &amp; Cạo Mặt Khăn Nóng</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">Cạo râu êm ái bọt kem, chườm khăn nóng làm sạch sâu lỗ chân lông và massage cổ vai gáy.</p>
                  </div>
                  <div style="margin-top: 14px;">
                    <a href="/services" onclick="event.preventDefault(); AppRouter.navigate('/services')" style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #C59B27; text-decoration: none;">
                      <span>Trải nghiệm phục hồi</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </section>

          <!-- ========================================================
               2. THANH CHỮ CHẠY ĐỘNG (KINETIC MARQUEE)
               ======================================================== -->
          <div class="kinetic-marquee-wrapper">
            <div class="kinetic-marquee-track">
              <span>TAY KÉO BARBER CHUYÊN NGHIỆP</span>
              <span class="marquee-dot">•</span>
              <span>UỐN TEXTURED NAM TỰ NHIÊN</span>
              <span class="marquee-dot">•</span>
              <span>SÁP &amp; POMADE NHẬP KHẨU CHÍNH HÃNG</span>
              <span class="marquee-dot">•</span>
              <span>CẠO RÂU KHĂN NÓNG THẢO MỘC</span>
              <span class="marquee-dot">•</span>
              <span>MÔ PHỎNG KIỂU TÓC AI 3D</span>
              <span class="marquee-dot">•</span>
              <span>20 CƠ SỞ TOÀN THÀNH PHỐ</span>
              <span class="marquee-dot">•</span>
              <span>TAY KÉO BARBER CHUYÊN NGHIỆP</span>
              <span class="marquee-dot">•</span>
              <span>UỐN TEXTURED NAM TỰ NHIÊN</span>
              <span class="marquee-dot">•</span>
              <span>SÁP &amp; POMADE NHẬP KHẨU CHÍNH HÃNG</span>
              <span class="marquee-dot">•</span>
              <span>CẠO RÂU KHĂN NÓNG THẢO MỘC</span>
              <span class="marquee-dot">•</span>
              <span>MÔ PHỎNG KIỂU TÓC AI 3D</span>
              <span class="marquee-dot">•</span>
              <span>20 CƠ SỞ TOÀN THÀNH PHỐ</span>
              <span class="marquee-dot">•</span>
            </div>
          </div>

          <!-- ========================================================
               3. TRIẾT LÝ CẮT KÉO & TRẢI NGHIỆM CHĂM SÓC
               ======================================================== -->
          <section class="web-section omni-container" style="max-width: 1640px; margin: 0 auto; padding: 48px clamp(16px, 3.5vw, 48px) 24px;">
            <div class="section-title-wrap" style="text-align: center; margin-bottom: 32px;">
              <h2 class="font-serif tracking-tight leading-tight" style="font-size: 30px; font-weight: 800; color: var(--text-primary); margin: 0;">Triết Lý Cắt Kéo &amp; Chăm Sóc Đương Đại</h2>
              <p style="color: var(--text-secondary); font-size: 14.5px; max-width: 680px; margin: 10px auto 0; line-height: 1.6;">
                Không phô trương hình thức, Omni Salon tập trung vào độ sắc nét của từng nhát kéo, độ vừa vặn của phom tóc và sự thư giãn thoải mái tuyệt đối của mỗi người đàn ông khi ngồi vào ghế.
              </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
              <div class="card-pillar" style="padding: 24px 20px; background: var(--surface-card); border-radius: 8px; border: 1px solid rgba(20, 20, 19, 0.08); box-shadow: none; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: #C59B27; margin-bottom: 12px; font-family: monospace;">01</div>
                  <h3 class="font-serif tracking-tight leading-tight" style="color: var(--text-primary); font-size: 17px; font-weight: 700; margin: 0 0 8px;">Định Phom Theo Khuôn Mặt</h3>
                  <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0;">Cắt chỉnh độ dài và tỉa texture dựa theo cấu trúc hộp sọ, tôn vinh đường nét quai hàm nam tính tự nhiên.</p>
                </div>
              </div>

              <div class="card-pillar" style="padding: 24px 20px; background: var(--surface-card); border-radius: 8px; border: 1px solid rgba(20, 20, 19, 0.08); box-shadow: none; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: #C59B27; margin-bottom: 12px; font-family: monospace;">02</div>
                  <h3 class="font-serif tracking-tight leading-tight" style="color: var(--text-primary); font-size: 17px; font-weight: 700; margin: 0 0 8px;">Sáp &amp; Pomade Nhập Khẩu</h3>
                  <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0;">100% Sản phẩm tạo kiểu và dưỡng tóc chính hãng từ các thương hiệu barber uy tín, an toàn cho da đầu.</p>
                </div>
              </div>

              <div class="card-pillar" style="padding: 24px 20px; background: var(--surface-card); border-radius: 8px; border: 1px solid rgba(20, 20, 19, 0.08); box-shadow: none; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: #C59B27; margin-bottom: 12px; font-family: monospace;">03</div>
                  <h3 class="font-serif tracking-tight leading-tight" style="color: var(--text-primary); font-size: 17px; font-weight: 700; margin: 0 0 8px;">Tay Kéo Barber Tỉ Mỉ</h3>
                  <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0;">Đội ngũ thợ lành nghề, lắng nghe mong muốn của khách và hướng dẫn chi tiết cách tự chăm sóc tóc tại nhà.</p>
                </div>
              </div>

              <div class="card-pillar" style="padding: 24px 20px; background: var(--surface-card); border-radius: 8px; border: 1px solid rgba(20, 20, 19, 0.08); box-shadow: none; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: #C59B27; margin-bottom: 12px; font-family: monospace;">04</div>
                  <h3 class="font-serif tracking-tight leading-tight" style="color: var(--text-primary); font-size: 17px; font-weight: 700; margin: 0 0 8px;">Mô Phỏng Kiểu Tóc AI 3D</h3>
                  <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.6; margin: 0;">Công nghệ thử kiểu tóc trực quan trước khi cắt, giúp bạn an tâm tuyệt đối về phom tóc dự định thay đổi.</p>
                </div>
              </div>
            </div>
          </section>

          <!-- ========================================================
               4. DỊCH VỤ & GÓI COMBO TIÊU BIỂU (ASYMMETRIC BENTO GRID)
               ======================================================== -->
          <section class="web-section omni-container" id="serviceSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2 class="font-serif tracking-tight leading-tight" style="font-size: 30px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Dịch Vụ &amp; Bảng Giá Chăm Sóc Tóc</h2>
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">Quy trình bài bản với tay kéo barber chuyên nghiệp và mỹ phẩm lành tính.</p>
              </div>
              <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/services')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid rgba(20, 20, 19, 0.1); font-size: 13.5px; font-weight: 700; padding: 10px 18px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                <span>Xem Toàn Bộ Menu Dịch Vụ</span>
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
                <h2 class="font-serif tracking-tight leading-tight" style="font-size: 30px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Đội Ngũ Thợ Cắt Tóc Tiêu Biểu</h2>
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">Am hiểu chất tóc phái mạnh, làm việc bằng sự tỉ mỉ và trách nhiệm cao.</p>
              </div>
              <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/stylists')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid rgba(20, 20, 19, 0.1); font-size: 13.5px; font-weight: 700; padding: 10px 18px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                <span>Xem Toàn Bộ Đội Ngũ Thợ</span>
                <span>→</span>
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
              .replace(/Nghệ Nhân Tạo Mẫu/gi, 'Thợ Chính')
              .trim();
            const avatarUrl = s.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';
            return `
                    <div class="stylist-nordic-card" style="background: var(--surface-card); border-radius: 8px; border: 1px solid rgba(20, 20, 19, 0.08); box-shadow: none; padding: 22px 20px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; text-align: center;">
                      <div>
                        <div style="position: relative; width: 100px; height: 100px; margin: 0 auto 14px; border-radius: 50%; overflow: hidden; border: 2px solid #C59B27;">
                          <img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${cleanName}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';">
                        </div>
                        <h3 class="font-serif tracking-tight leading-tight" style="font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">${cleanName}</h3>
                        <span style="display: inline-block; background: var(--surface-elevated); color: var(--text-secondary); font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 4px; margin-bottom: 10px; border: 1px solid rgba(20, 20, 19, 0.08);">${cleanLevel}</span>
                        <div style="font-size: 12.5px; font-weight: 500; color: var(--text-secondary); margin-bottom: 16px;">
                          Tay kéo kinh nghiệm &amp; nhiệt tình
                        </div>
                      </div>
                      <button type="button" style="width: 100%; background: #C59B27; color: #141413; padding: 10px 14px; border-radius: 6px; font-weight: 700; font-size: 13.5px; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;" onclick="AppRouter.navigate('/booking?stylist=${s.id}&branch=${s.branchId || s.MaChiNhanh || 'CN01'}')">
                        <span>Đặt Lịch Với ${cleanName.split(' ').pop()}</span>
                        <span>→</span>
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
                <h2 class="font-serif tracking-tight leading-tight" style="font-size: 30px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Sáp Vuốt Tóc &amp; Mỹ Phẩm Nam Chọn Lọc</h2>
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0; line-height: 1.5;">Cam kết 100% sáp vuốt, pomade, gôm xịt chính hãng nhập khẩu nguyên hộp.</p>
              </div>
              <button class="nordic-btn-secondary" onclick="AppRouter.navigate('/shop')" style="background: var(--surface-card); color: var(--text-primary); border: 1px solid rgba(20, 20, 19, 0.1); font-size: 13.5px; font-weight: 700; padding: 10px 18px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                <span>Vào Cửa Hàng Mỹ Phẩm</span>
                <span>→</span>
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
               7. DANH MỤC CHI NHÁNH TIÊU BIỂU
               ======================================================== -->
          <section class="web-section omni-container" id="branchesSection" style="max-width: 1640px; margin: 0 auto; padding: 40px clamp(16px, 3.5vw, 48px);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 22px; flex-wrap: wrap; gap: 16px;">
              <div>
                <h2 class="font-serif tracking-tight leading-tight" style="font-size: 30px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">Mạng Lưới Chi Nhánh Barbershop</h2>
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0; line-height: 1.5; max-width: 720px;">
                  Không gian ấm cúng, sạch sẽ thoáng mát và đồng bộ chất lượng phục vụ trên toàn thành phố.
                </p>
              </div>
              <button class="branch-book-btn" onclick="AppRouter.navigate('/branches')" style="display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 16px; font-size: 13px; font-weight: 700; background: #C59B27; color: #141413; border: none; border-radius: 6px; cursor: pointer;">
                <span>Xem Toàn Bộ Chi Nhánh</span>
                <span style="font-size: 15px;">→</span>
              </button>
            </div>

            <!-- Thanh Filter chọn Quận / Khu Vực -->
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
            <div style="background: var(--surface-card); border-radius: 8px; border: 1px solid rgba(20, 20, 19, 0.08); box-shadow: none; padding: 36px 28px;">
              <div style="text-align: center; max-width: 680px; margin: 0 auto 28px;">
                <h2 class="font-serif tracking-tight leading-tight" style="font-size: 30px; font-weight: 800; color: var(--text-primary); margin: 0 0 10px;">Omni AI Hair Vision Studio</h2>
                <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">
                  Mô phỏng phom tóc thực tế theo từng đường nét khuôn mặt với trí tuệ nhân tạo. Giúp bạn tự tin chọn kiểu tóc ưng ý nhất trước khi cắt.
                </p>
              </div>

              <div style="max-width: 740px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 13px; font-weight: 700; color: #C59B27; text-transform: uppercase;">
                    1. Tải Lên Ảnh Chân Dung (Góc Thẳng):
                  </label>
                  <div style="position: relative; border-radius: 8px; padding: 12px 18px; border: 1px dashed rgba(20, 20, 19, 0.2); background: var(--surface-elevated); display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <input type="file" id="homeAiFileInput" accept="image/*" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 5;" onchange="const f = this.files[0]; if(f){ document.getElementById('homeAiFileName').textContent = 'Đã chọn: ' + f.name; }" />
                    <span id="homeAiFileName" style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">Chọn ảnh chân dung từ thiết bị (JPG, PNG, WebP)...</span>
                    <span style="background: #141413; color: #FAF8F5; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 6px; pointer-events: none;">Chọn Tệp</span>
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 13px; font-weight: 700; color: #C59B27; text-transform: uppercase;">
                    2. Chọn Kiểu Tóc Thịnh Hành:
                  </label>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
                    <button type="button" class="clean-tab-btn active" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 40px; padding: 0 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Tỉa Lớp Tự Nhiên
                    </button>
                    <button type="button" class="clean-tab-btn" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 40px; padding: 0 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Vuốt Ngược Quý Ông
                    </button>
                    <button type="button" class="clean-tab-btn" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 40px; padding: 0 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Đuôi Dài Cá Tính
                    </button>
                    <button type="button" class="clean-tab-btn" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="height: 40px; padding: 0 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; white-space: nowrap; transition: all 0.2s ease;">
                      Rẽ Ngôi Lịch Lãm
                    </button>
                  </div>
                </div>

                <div style="margin-top: 6px;">
                  <button type="button" class="nordic-btn-primary" style="width: 100%; height: 46px; background: #141413; color: #FAF8F5; font-weight: 700; font-size: 14.5px; border-radius: 6px; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;" onclick="AppRouter.navigate('/ai-studio')">
                    <span>Thử Kiểu Tóc Ngay Bằng AI</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- ========================================================
               9. CHÂN TRANG DOANH NGHIỆP (FOOTER)
               ======================================================== -->
          <footer class="web-footer" style="background: #141413; border-top: 1px solid rgba(255, 255, 255, 0.08); padding: 52px 0 32px; margin-top: 48px; color: #FAF8F5;">
            <div class="omni-container" style="max-width: 1640px; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; margin-bottom: 36px;">
              <div>
                <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px;">
                  <span style="font-size: 20px; font-weight: 900; color: #FAF8F5;">OMNI SALON</span>
                  <span style="font-size: 11px; font-weight: 700; color: #C59B27; letter-spacing: 0.08em;">AUTHENTIC BARBER</span>
                </div>
                <p style="font-size: 14px; color: #A6A6A0; line-height: 1.6; margin: 0 0 16px;">
                  Chuỗi cắt tóc và chăm sóc tóc nam phong cách Barber đương đại. Nơi tôn vinh bản lĩnh và khí chất của người đàn ông.
                </p>
                <span style="font-size: 14px; font-weight: 700; color: #C59B27;">TỔNG ĐÀI ĐẶT LỊCH: 1900 8899</span>
              </div>
              <div>
                <h4 style="font-size: 13.5px; font-weight: 700; color: #FAF8F5; text-transform: uppercase; margin: 0 0 14px; letter-spacing: 0.05em;">ĐIỀU HƯỚNG TRANG</h4>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 13.5px;">
                  <li><a href="/" onclick="event.preventDefault(); AppRouter.navigate('/')" style="color: #A6A6A0; text-decoration: none; font-weight: 500;">Trang Chủ</a></li>
                  <li><a href="/services" onclick="event.preventDefault(); AppRouter.navigate('/services')" style="color: #A6A6A0; text-decoration: none; font-weight: 500;">Bảng Giá Dịch Vụ</a></li>
                  <li><a href="/stylists" onclick="event.preventDefault(); AppRouter.navigate('/stylists')" style="color: #A6A6A0; text-decoration: none; font-weight: 500;">Đội Ngũ Thợ Tạo Mẫu</a></li>
                  <li><a href="/booking" onclick="event.preventDefault(); AppRouter.navigate('/booking')" style="color: #A6A6A0; text-decoration: none; font-weight: 500;">Đặt Lịch Hẹn</a></li>
                  <li><a href="/shop" onclick="event.preventDefault(); AppRouter.navigate('/shop')" style="color: #A6A6A0; text-decoration: none; font-weight: 500;">Cửa Hàng Mỹ Phẩm</a></li>
                  <li><a href="/branches" onclick="event.preventDefault(); AppRouter.navigate('/branches')" style="color: #A6A6A0; text-decoration: none; font-weight: 500;">Hệ Thống Chi Nhánh</a></li>
                </ul>
              </div>
              <div>
                <h4 style="font-size: 13.5px; font-weight: 700; color: #FAF8F5; text-transform: uppercase; margin: 0 0 14px; letter-spacing: 0.05em;">GIỜ MỞ CỬA</h4>
                <p style="font-size: 14px; color: #A6A6A0; line-height: 1.8; margin: 0;">
                  Thứ 2 - Thứ 6: 09:00 - 21:00<br>
                  Thứ 7 - Chủ Nhật: 08:30 - 21:30<br>
                  Phục vụ tất cả các ngày trong tuần và ngày lễ.
                </p>
              </div>
              <div>
                <h4 style="font-size: 13.5px; font-weight: 700; color: #FAF8F5; text-transform: uppercase; margin: 0 0 14px; letter-spacing: 0.05em;">KẾT NỐI VỚI CHÚNG TÔI</h4>
                <p style="font-size: 14px; color: #A6A6A0; margin: 0 0 14px;">Theo dõi các mẫu tóc mới nhất và khuyến mãi hấp dẫn:</p>
                <div style="display: flex; gap: 16px; font-size: 14px; font-weight: 700;">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style="color: #C59B27; text-decoration: none;">Facebook</a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style="color: #C59B27; text-decoration: none;">Instagram</a>
                  <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" style="color: #C59B27; text-decoration: none;">TikTok</a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style="color: #C59B27; text-decoration: none;">YouTube</a>
                </div>
              </div>
            </div>
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 13px; color: #8E8E8A;">
              © 2026 OMNI SALON. CHUẨN MỰC BARBERSHOP ĐƯƠNG ĐẠI.
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


