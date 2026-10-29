// Trang danh sách dịch vụ làm tóc
(function (window) {
  'use strict';

  const ServicesPage = {
    activeCategory: 'all',

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

            <!-- LƯỚI THẺ DỊCH VỤ 4 CỘT ĐỒNG BỘ MỌI ĐỘ PHÂN GIẢI (TỰ KÉO GIÃN THEO MÀN HÌNH) -->
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
        const actualPrice = item.price || item.Gia || 0;
        const originalPrice = item.originalPrice || item.oldPrice;
        const priceFormatted = SalonUtils.formatCurrency(actualPrice);

        const rawImg = item.image || item.HinhAnh || (isCombo ? 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' : 'Men_Grooming_Products/DichVu_Men/DV1.jpg');
        const thumb = (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function')
          ? SalonUtils.formatImageUrl(rawImg)
          : rawImg;

        return `
          <div class="service-editorial-card" id="bentoCard_${item.id}">
            
            <!-- ẢNH DỊCH VỤ ĐỒNG NHẤT KHÓA TỶ LỆ VÀNG 16:10 (KHÔNG GIÃN NỞ MÉO HÌNH, KHÔNG DƯ CỤT) -->
            <div class="service-card-media" style="position: relative; width: 100%; aspect-ratio: 16 / 10; overflow: hidden; background: #141413;">
              <img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.5s ease;" alt="${item.name || item.TenDichVu}" loading="lazy"
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

            <!-- NỘI DUNG DỊCH VỤ EDITORIAL (TỰ CO GIÃN THEO ĐỘ PHÂN GIẢI) -->
            <div class="service-card-body" style="padding: clamp(16px, 1.2vw, 24px); flex: 1; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
              <div>
                <h3 class="font-serif tracking-tight leading-tight service-card-title" style="font-size: clamp(17px, 1.15vw, 22px); font-weight: 700; color: var(--text-primary); margin: 0 0 8px;">
                  ${item.name || item.TenDichVu}
                </h3>
                <p class="service-card-desc" style="font-size: clamp(13px, 0.85vw, 15px); color: var(--text-secondary); line-height: 1.6; margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; min-height: clamp(54px, 3.8vw, 68px);">
                  ${item.description || item.MoTa || 'Tư vấn phom dáng theo chất tóc và gương mặt, kết hợp kỹ thuật cắt kéo thủ công và tạo kiểu với sáp pomade chính hãng.'}
                </p>
              </div>

              <!-- GIÁ & NÚT ĐẶT LỊCH VỚI MŨI TÊN ĐIỀU HƯỚNG -->
              <div class="service-card-footer" style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div>
                  <span class="service-card-price" style="font-size: clamp(18px, 1.2vw, 23px); font-weight: 800; color: #C59B27;">${priceFormatted}</span>
                  ${originalPrice && originalPrice > actualPrice ? `<span style="font-size: clamp(12px, 0.8vw, 13.5px); text-decoration: line-through; color: var(--text-muted); margin-left: 6px;">${SalonUtils.formatCurrency(originalPrice)}</span>` : ''}
                </div>
                <button onclick="ServicesPage.selectAndBook('${item.id}')"
                        class="service-card-btn"
                        style="min-height: clamp(38px, 2.4vw, 44px); height: clamp(38px, 2.4vw, 44px); padding: 0 clamp(16px, 1.1vw, 24px); border-radius: 6px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); font-size: clamp(13px, 0.85vw, 15px); font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease; white-space: nowrap;">
                  Đặt Lịch →
                </button>
              </div>
            </div>

          </div>
        `;
      }).join('');
    },

    selectAndBook(serviceId) {
      if (window.AppRouter) {
        window.AppRouter.navigate(`/booking?service=${serviceId}`);
      } else if (window.BookingPage) {
        window.BookingPage.onSelectService(serviceId);
        window.location.hash = `#/booking?service=${serviceId}`;
      }
    }
  };

  window.ServicesPage = ServicesPage;

})(window);

