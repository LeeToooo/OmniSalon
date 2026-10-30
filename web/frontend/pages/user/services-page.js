// Trang danh sách dịch vụ và gói combo làm tóc
(function (window) {
  'use strict';

  const ServicesPage = {
    activeCategory: 'all',
    _currentServiceReviews: {},

    render(container, params = {}) {
      if (!container) return;

      if (params.category) {
        this.activeCategory = params.category;
      }

      container.innerHTML = `
        <div class="services-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 48px 0 88px;">
          <!-- Khung nội dung tràn viền toàn diện đồng bộ với Header -->
          <div class="services-fluid-container" style="width: 100%; max-width: 100%; margin: 0; padding: 0 clamp(20px, 3vw, 56px); box-sizing: border-box;">
            <!-- Header Banner -->
            <div style="text-align: center; margin-bottom: 40px;">
              <span class="tracking-widest" style="font-size: 11.5px; font-weight: 700; color: #C59B27; text-transform: uppercase; margin-bottom: 8px; display: inline-block;">
                BẢNG GIÁ DỊCH VỤ NIÊM YẾT
              </span>
              <h1 class="font-serif tracking-tight leading-tight" style="font-size: clamp(30px, 3.8vw, 46px); font-weight: 700; color: var(--text-primary); margin: 0 0 12px;">
                Dịch Vụ Cắt Tóc &amp; Gói Grooming Toàn Diện
              </h1>
              <p style="font-size: clamp(14px, 1vw, 16px); color: var(--text-secondary); max-width: min(800px, 65vw); margin: 0 auto 28px; line-height: 1.6;">
                Từng đường kéo, từng đường cạo khăn nóng và kỹ thuật fade chuẩn xác mang lại diện mạo đĩnh đạc và phong độ vững vàng cho quý ông.
              </p>

              <!-- Clean Tabs Category Filters -->
              <div class="clean-filter-tabs" style="justify-content: center; gap: 8px; flex-wrap: wrap;">
                <button class="clean-tab-btn ${this.activeCategory === 'all' ? 'active' : ''}" onclick="ServicesPage.setCategory('all')">
                  Tất Cả Dịch Vụ
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'haircut' ? 'active' : ''}" onclick="ServicesPage.setCategory('haircut')">
                  Cắt &amp; Fade Tạo Kiểu
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'perm' ? 'active' : ''}" onclick="ServicesPage.setCategory('perm')">
                  Uốn Texture &amp; Định Hình
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'color' ? 'active' : ''}" onclick="ServicesPage.setCategory('color')">
                  Nhuộm Tone Trầm &amp; Highlight
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'spa' || this.activeCategory === 'care' ? 'active' : ''}" onclick="ServicesPage.setCategory('spa')">
                  Cạo Mặt &amp; Thư Giãn Da Đầu
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'combo' ? 'active' : ''}" onclick="ServicesPage.setCategory('combo')">
                  Gói Combo Toàn Diện
                </button>
              </div>
            </div>

            <!-- LƯỚI THẺ DỊCH VỤ 4 CỘT ĐỒNG BỘ MỌI ĐỘ PHÂN GIẢI -->
            <div id="servicesCatalogGrid" class="services-catalog-grid">
              ${this.renderCards()}
            </div>
          </div>
        </div>
      `;
    },

    setCategory(category) {
      this.activeCategory = category;
      this.render(document.getElementById('webMainContainer'));
    },

    renderCards() {
      const allServices = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const allCombos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];

      let list = [];
      if (this.activeCategory === 'all') {
        list = [
          ...allServices.map(s => ({ ...s, isCombo: false })),
          ...allCombos.map(c => ({ ...c, isCombo: true }))
        ];
      } else if (this.activeCategory === 'combo') {
        list = allCombos.map(c => ({ ...c, isCombo: true }));
      } else if (this.activeCategory === 'haircut' || this.activeCategory === 'cut' || this.activeCategory === 'cat-tao-kieu') {
        list = [
          ...allServices.filter(s => s.category === 'haircut' || s.id === 'DV01' || s.id === 'DV02' || s.MaDichVu === 'DV01' || s.MaDichVu === 'DV02').map(s => ({ ...s, isCombo: false })),
          ...allCombos.filter(c => c.name && c.name.toLowerCase().includes('cắt')).map(c => ({ ...c, isCombo: true }))
        ];
      } else if (this.activeCategory === 'perm') {
        list = allServices.filter(s => s.category === 'perm' || s.id === 'DV03' || s.MaDichVu === 'DV03').map(s => ({ ...s, isCombo: false }));
      } else if (this.activeCategory === 'color') {
        list = allServices.filter(s => s.category === 'color' || s.id === 'DV04' || s.MaDichVu === 'DV04').map(s => ({ ...s, isCombo: false }));
      } else if (this.activeCategory === 'spa' || this.activeCategory === 'care' || this.activeCategory === 'shave') {
        list = allServices.filter(s => s.category === 'spa' || s.category === 'care' || s.id === 'DV05' || s.MaDichVu === 'DV05').map(s => ({ ...s, isCombo: false }));
      } else {
        list = allServices.filter(s => s.category === this.activeCategory).map(s => ({ ...s, isCombo: false }));
      }

      if (list.length === 0) {
        list = allServices.map(s => ({ ...s, isCombo: false }));
      }

      return list.map(item => {
        const isCombo = item.isCombo;
        const durationRaw = item.duration || item.ThoiLuong || item.duration_minutes || (isCombo ? 75 : 45);
        const durationVal = String(durationRaw).replace(/\s*phút\s*/gi, '').trim();
        const actualPrice = item.price || item.Gia || item.GiaCombo || item.GiaTien || 0;
        const originalPrice = item.originalPrice || item.oldPrice;
        const priceFormatted = window.SalonUtils ? window.SalonUtils.formatCurrency(actualPrice) : (actualPrice + ' ₫');

        const rawImg = item.image || item.HinhAnh || (isCombo ? 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' : 'Men_Grooming_Products/DichVu_Men/DV1.jpg');
        const thumb = (typeof window.SalonUtils !== 'undefined' && typeof window.SalonUtils.formatImageUrl === 'function')
          ? window.SalonUtils.formatImageUrl(rawImg)
          : rawImg;

        return `
          <div class="service-editorial-card" id="bentoCard_${item.id}">
            
            <!-- ẢNH DỊCH VỤ ĐỒNG NHẤT KHÓA TỶ LỆ VÀNG 16:10 -->
            <div class="service-card-media" style="position: relative; width: 100%; aspect-ratio: 16 / 10; overflow: hidden; background: #141413; cursor: pointer;" onclick="ServicesPage.openServiceDetailModal('${item.id}')">
              <img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.5s ease;" alt="${item.name || item.TenDichVu || item.TenCombo || 'Dịch vụ'}" loading="lazy"
                   onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='Men_Grooming_Products/DichVu_Men/DV1.jpg');">
              <div style="position: absolute; top: 12px; left: 12px; background: rgba(20, 20, 19, 0.85); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; color: #FAF8F5; border: 1px solid rgba(255, 255, 255, 0.1); z-index: 2;">
                ⏱ ${durationVal} phút
              </div>
              ${isCombo ? `
                <div style="position: absolute; top: 12px; right: 12px; background: #C59B27; color: #141413; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; border: none; letter-spacing: 0.04em; z-index: 2;">
                  COMBO ĐẶC BIỆT
                </div>
              ` : (item.discountPercent > 0 ? `
                <div style="position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; border: none; letter-spacing: 0.04em; z-index: 2;">
                  GIẢM -${item.discountPercent}%
                </div>
              ` : '')}
            </div>

            <!-- NỘI DUNG DỊCH VỤ EDITORIAL -->
            <div class="service-card-body" style="padding: clamp(16px, 1.2vw, 24px); flex: 1; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
              <div>
                <h3 class="font-serif tracking-tight leading-tight service-card-title" style="font-size: clamp(17px, 1.15vw, 22px); font-weight: 700; color: var(--text-primary); margin: 0 0 8px; cursor: pointer;" onclick="ServicesPage.openServiceDetailModal('${item.id}')">
                  ${item.name || item.TenDichVu || item.TenCombo}
                </h3>
                <p class="service-card-desc" style="font-size: clamp(13px, 0.85vw, 15px); color: var(--text-secondary); line-height: 1.6; margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; min-height: clamp(54px, 3.8vw, 68px);">
                  ${item.description || item.MoTa || 'Tư vấn phom dáng theo chất tóc và gương mặt, kết hợp kỹ thuật cắt kéo thủ công và tạo kiểu với sáp pomade chính hãng.'}
                </p>
              </div>

              <!-- GIÁ & NÚT CHI TIẾT + ĐẶT LỊCH -->
              <div class="service-card-footer" style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                <div>
                  <span class="service-card-price" style="font-size: clamp(18px, 1.2vw, 23px); font-weight: 800; color: #C59B27;">${priceFormatted}</span>
                  ${originalPrice && originalPrice > actualPrice ? `<span style="font-size: clamp(12px, 0.8vw, 13.5px); text-decoration: line-through; color: var(--text-muted); margin-left: 6px;">${window.SalonUtils ? window.SalonUtils.formatCurrency(originalPrice) : originalPrice}</span>` : ''}
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <button type="button" onclick="ServicesPage.openServiceDetailModal('${item.id}')"
                          class="service-card-btn"
                          style="min-height: clamp(36px, 2.2vw, 42px); height: clamp(36px, 2.2vw, 42px); padding: 0 clamp(10px, 0.8vw, 14px); border-radius: 6px; background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); font-size: clamp(12px, 0.8vw, 13.5px); font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s ease;">
                    🔍 Chi Tiết
                  </button>
                  <button onclick="ServicesPage.selectAndBook('${item.id}')"
                          class="service-card-btn"
                          style="min-height: clamp(36px, 2.2vw, 42px); height: clamp(36px, 2.2vw, 42px); padding: 0 clamp(14px, 1vw, 20px); border-radius: 6px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); font-size: clamp(12.5px, 0.8vw, 14px); font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s ease; white-space: nowrap;">
                    Đặt Lịch →
                  </button>
                </div>
              </div>
            </div>

          </div>
        `;
      }).join('');
    },

    selectAndBook(serviceId) {
      if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
        window.UICommon.closeGlobalModal();
      }
      if (window.AppRouter) {
        window.AppRouter.navigate(`/booking?service=${serviceId}`);
      } else if (window.BookingPage) {
        window.BookingPage.onSelectService(serviceId);
        window.location.hash = `#/booking?service=${serviceId}`;
      }
    },

    // Tìm thông tin dịch vụ hoặc combo theo ID
    findServiceOrCombo(itemId) {
      if (!itemId) return null;
      const clean = String(itemId).trim().toLowerCase();
      const allServices = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const allCombos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];

      const s = allServices.find(it => String(it.id || it.MaDichVu || '').trim().toLowerCase() === clean);
      if (s) return { ...s, isCombo: false };

      const c = allCombos.find(it => String(it.id || it.MaCombo || '').trim().toLowerCase() === clean);
      if (c) return { ...c, isCombo: true };

      return null;
    },

    // Lấy danh sách đánh giá của dịch vụ
    getServiceReviews(serviceId) {
      const clean = String(serviceId).trim().toLowerCase();
      if (this._currentServiceReviews[clean]) {
        return this._currentServiceReviews[clean];
      }
      const allReviews = (window.store && window.store.state && Array.isArray(window.store.state.reviews))
        ? window.store.state.reviews
        : [];
      return allReviews.filter(r => 
        (r.serviceId && String(r.serviceId).trim().toLowerCase() === clean) ||
        (r.MaDichVu && String(r.MaDichVu).trim().toLowerCase() === clean) ||
        (r.comboId && String(r.comboId).trim().toLowerCase() === clean)
      );
    },

    // Mở Modal chi tiết dịch vụ / combo kèm quy trình chuẩn 5 bước và đánh giá
    async openServiceDetailModal(serviceId) {
      const item = this.findServiceOrCombo(serviceId);
      if (!item) return;

      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;

      modal.classList.add('modal-wide');
      modal.classList.add('active');

      const isCombo = item.isCombo;
      const durationRaw = item.duration || item.ThoiLuong || item.duration_minutes || (isCombo ? 75 : 45);
      const durationVal = String(durationRaw).replace(/\s*phút\s*/gi, '').trim();
      const actualPrice = item.price || item.Gia || item.GiaCombo || item.GiaTien || 0;
      const priceFormatted = window.SalonUtils ? window.SalonUtils.formatCurrency(actualPrice) : (actualPrice + ' ₫');

      const rawImg = item.image || item.HinhAnh || (isCombo ? 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' : 'Men_Grooming_Products/DichVu_Men/DV1.jpg');
      const thumb = (typeof window.SalonUtils !== 'undefined' && typeof window.SalonUtils.formatImageUrl === 'function')
        ? window.SalonUtils.formatImageUrl(rawImg)
        : rawImg;

      const title = item.name || item.TenDichVu || item.TenCombo || 'Dịch Vụ Omni Salon';
      const desc = item.description || item.MoTa || 'Tư vấn phom dáng theo chất tóc và gương mặt, kết hợp kỹ thuật cắt kéo thủ công và tạo kiểu với sáp pomade chính hãng.';
      const categoryTag = isCombo ? 'GÓI COMBO ĐẶC BIỆT' : (item.category ? item.category.toUpperCase() : 'DỊCH VỤ TIÊU CHUẨN');

      // Tải đánh giá từ backend
      try {
        const res = await fetch(`/api/reviews?serviceId=${encodeURIComponent(serviceId)}`);
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          this._currentServiceReviews[String(serviceId).trim().toLowerCase()] = list;
        }
      } catch (_) {}

      const reviews = this.getServiceReviews(serviceId);
      const currentUser = (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function') 
        ? window.CustomerWeb.getCurrentUser() 
        : null;

      // Danh sách dịch vụ thành phần nếu là Combo
      const comboServices = (isCombo && Array.isArray(item.services)) ? item.services : [];

      modalBody.innerHTML = `
        <div class="service-detail-modal-content" style="max-height: 80vh; overflow-y: auto; padding: 10px 4px;">
          
          <!-- Banner hình ảnh & Tiêu đề -->
          <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; align-items: flex-start;">
            <div style="flex: 1; min-width: 280px; max-width: 440px; aspect-ratio: 16/10; border-radius: 12px; overflow: hidden; position: relative; background: #141413;">
              <img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover;" alt="${title}">
              <div style="position: absolute; top: 12px; left: 12px; background: rgba(20, 20, 19, 0.85); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; color: #FAF8F5;">
                ⏱ ${durationVal} phút
              </div>
            </div>

            <div style="flex: 1.2; min-width: 280px;">
              <div style="font-size: 11px; font-weight: 800; color: #C59B27; letter-spacing: 0.05em; margin-bottom: 6px;">${categoryTag}</div>
              <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin: 0 0 10px; line-height: 1.3;">${title}</h2>
              <div style="font-size: 24px; font-weight: 900; color: #C59B27; margin-bottom: 14px;">${priceFormatted}</div>
              <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin: 0 0 20px;">${desc}</p>
              
              <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                <button type="button" class="btn-submit-terracotta" style="padding: 10px 24px; font-size: 14px; font-weight: 800; border-radius: 8px; background: #C59B27; color: #141413;" onclick="ServicesPage.selectAndBook('${item.id}')">
                  📅 Đặt Lịch Dịch Vụ Này Ngay
                </button>
                <button type="button" class="btn-cancel" style="padding: 10px 20px; font-size: 13.5px;" onclick="UICommon.closeGlobalModal()">
                  Đóng
                </button>
              </div>
            </div>
          </div>

          <!-- Các dịch vụ thành phần trong Combo (nếu có) -->
          ${comboServices.length > 0 ? `
            <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
              <h4 style="font-size: 13px; font-weight: 800; color: #C59B27; text-transform: uppercase; margin: 0 0 12px;">Các Dịch Vụ Bao Gồm Trong Combo</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                ${comboServices.map((s, idx) => `
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--text-primary);">
                    <span style="color: #10B981; font-weight: 800;">✓</span>
                    <span>${s.name || s.TenDichVu || s}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- QUY TRÌNH THỰC HIỆN TIÊU CHUẨN (Chuẩn đồng bộ với Mobile) -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="font-size: 11.5px; font-weight: 800; color: #C59B27; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
              QUY TRÌNH THỰC HIỆN TIÊU CHUẨN TẠI OMNI SALON
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--surface-elevated); border: 1px solid #C59B27; color: #C59B27; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">1</span>
                <div><strong>Bước 1:</strong> Tư vấn phom dáng mặt &amp; cấu trúc sợi tóc, lựa chọn kiểu tóc phù hợp phong cách.</div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--surface-elevated); border: 1px solid #C59B27; color: #C59B27; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">2</span>
                <div><strong>Bước 2:</strong> Gội xả thảo mộc &amp; massage bấm huyệt đả thông kinh lạc, làm sạch da đầu chuyên sâu.</div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--surface-elevated); border: 1px solid #C59B27; color: #C59B27; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">3</span>
                <div><strong>Bước 3:</strong> Cắt fade &amp; tỉa texture tạo tầng bồng bềnh bằng kéo thủ công Nhật Bản chuẩn từng milimet.</div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--surface-elevated); border: 1px solid #C59B27; color: #C59B27; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">4</span>
                <div><strong>Bước 4:</strong> Cạo viền sắc nét, chườm khăn nóng thảo mộc thư giãn cơ mặt và làm dịu chân tóc.</div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--surface-elevated); border: 1px solid #C59B27; color: #C59B27; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">5</span>
                <div><strong>Bước 5:</strong> Sấy tạo phom &amp; vuốt sáp / pomade cao cấp khóa form giữ nếp tự nhiên suốt ngày dài.</div>
              </div>
            </div>
          </div>

          <!-- MỤC ĐÁNH GIÁ CỦA KHÁCH HÀNG -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
              <div>
                <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px;">Đánh Giá Từ Khách Hàng</h3>
                <div style="font-size: 12.5px; color: var(--text-secondary);">Trải nghiệm thực tế của khách hàng khi sử dụng dịch vụ</div>
              </div>
              ${currentUser ? `
                <button type="button" class="btn-submit-terracotta" style="padding: 7px 16px; font-size: 12px; font-weight: 800; border-radius: 8px; background: #d97706;" onclick="ServicesPage.openWriteServiceReviewModal('${item.id}', '${this.escapeHtml(title)}')">
                  ⭐ Viết Đánh Giá
                </button>
              ` : `
                <button type="button" class="btn-submit-terracotta" style="padding: 7px 16px; font-size: 12px; font-weight: 800; border-radius: 8px; background: #d97706;" onclick="if(window.UICommon && typeof window.UICommon.openAuthModal === 'function') window.UICommon.openAuthModal('login');">
                  🔑 Đăng Nhập Để Đánh Giá
                </button>
              `}
            </div>

            <div id="serviceReviewsContainer">
              ${reviews.length === 0 ? `
                <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13.5px; border: 1px dashed var(--border-color); border-radius: 8px;">
                  Chưa có đánh giá nào cho dịch vụ này. Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận của bạn!
                </div>
              ` : `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  ${reviews.map(r => {
                    const author = r.customerName || r.TenKhachHang || r.author || 'Khách Hàng';
                    const star = Number(r.rating || r.SoSao || 5);
                    const comment = r.comment || r.NoiDung || 'Dịch vụ rất chất lượng, tay nghề thợ tuyệt vời!';
                    const dateStr = r.date ? (window.SalonUtils ? window.SalonUtils.formatDate(r.date) : r.date) : 'Gần đây';
                    return `
                      <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                          <strong style="font-size: 13.5px; color: var(--text-primary);">${this.escapeHtml(author)}</strong>
                          <span style="font-size: 12px; color: var(--text-secondary);">${dateStr}</span>
                        </div>
                        <div style="color: #F59E0B; font-size: 12.5px; margin-bottom: 4px;">${'★'.repeat(star)}${'☆'.repeat(5 - star)}</div>
                        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">${this.escapeHtml(comment)}</p>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          </div>

        </div>
      `;
    },

    // Mở popup viết đánh giá cho dịch vụ
    openWriteServiceReviewModal(serviceId, serviceName) {
      const user = (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function') 
        ? window.CustomerWeb.getCurrentUser() 
        : null;
      if (!user) {
        if (window.UICommon) {
          window.UICommon.showToast('Quý khách vui lòng đăng nhập để gửi đánh giá dịch vụ!', 'warning');
          if (typeof window.UICommon.openAuthModal === 'function') {
            window.UICommon.openAuthModal('login');
          }
        }
        return;
      }

      const initialName = user.fullName || user.name || '';
      const promptComment = window.prompt(`Đánh giá dịch vụ "${serviceName}":\nNhập nội dung nhận xét của bạn:`, 'Dịch vụ rất chuyên nghiệp, tạo kiểu ưng ý!');
      if (promptComment && promptComment.trim().length >= 4) {
        this.submitServiceReview(serviceId, 5, promptComment.trim(), initialName);
      }
    },

    // Gửi đánh giá dịch vụ
    async submitServiceReview(serviceId, star = 5, comment = '', author = 'Khách Hàng') {
      const clean = String(serviceId).trim().toLowerCase();
      const newReview = {
        id: 'DG_DV_' + Date.now(),
        serviceId: serviceId,
        MaDichVu: serviceId,
        customerName: author,
        author: author,
        rating: star,
        SoSao: star,
        comment: comment,
        NoiDung: comment,
        date: new Date().toISOString()
      };

      if (!this._currentServiceReviews[clean]) {
        this._currentServiceReviews[clean] = [];
      }
      this._currentServiceReviews[clean].unshift(newReview);

      if (window.store && window.store.state) {
        if (!Array.isArray(window.store.state.reviews)) window.store.state.reviews = [];
        window.store.state.reviews.unshift(newReview);
        if (typeof window.store.saveState === 'function') window.store.saveState();
      }

      try {
        await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: serviceId,
            rating: star,
            comment: comment,
            customerName: author
          })
        }).catch(() => {});
      } catch (_) {}

      if (window.UICommon) {
        window.UICommon.showToast('Cảm ơn bạn! Đánh giá dịch vụ đã được gửi thành công.', 'success');
      }

      // Re-render modal
      this.openServiceDetailModal(serviceId);
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  window.ServicesPage = ServicesPage;

})(window);
