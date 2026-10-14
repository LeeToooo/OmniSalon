// =========================================================================
// Omni Salon — SERVICES PAGE COMPONENT (BẢNG DỊCH VỤ SALON 5 SAO)
// 100% Thuần Tiếng Việt • Full Sáng Dịu Mắt • Cân Bằng Thẻ Tuyệt Đối
// =========================================================================

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
        <div class="services-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 40px 0 80px;">
          <!-- Khung nội dung tràn viền 2 bên hiện đại -->
          <div style="max-width: 1640px; width: 100%; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); box-sizing: border-box;">
            <!-- Header Banner -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: clamp(28px, 4vw, 40px); font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin: 0 0 10px;">
                Bảng Giá Dịch Vụ &amp; Gói Combo Cắt Tóc
              </h1>
              <p style="font-size: 14.5px; color: var(--text-secondary); max-width: 720px; margin: 0 auto 24px; line-height: 1.6;">
                Mỗi dịch vụ tại Omni Salon đều được chăm chút tỉ mỉ bởi đội ngũ thợ tay nghề cao, sử dụng mỹ phẩm chăm sóc tóc chính hãng an toàn cho da đầu.
              </p>

              <!-- Clean Tabs Category Filters -->
              <div class="clean-filter-tabs" style="justify-content: center;">
                <button class="clean-tab-btn ${this.activeCategory === 'all' ? 'active' : ''}" onclick="ServicesPage.setCategory('all')">
                  Tất Cả Dịch Vụ
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'haircut' ? 'active' : ''}" onclick="ServicesPage.setCategory('haircut')">
                  Cắt Tạo Kiểu
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'perm' ? 'active' : ''}" onclick="ServicesPage.setCategory('perm')">
                  Uốn Phục Hồi
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'color' ? 'active' : ''}" onclick="ServicesPage.setCategory('color')">
                  Nhuộm Balayage / Ombre
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'spa' || this.activeCategory === 'care' ? 'active' : ''}" onclick="ServicesPage.setCategory('spa')">
                  Phục Hồi Chuyên Sâu
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'combo' ? 'active' : ''}" onclick="ServicesPage.setCategory('combo')">
                  Gói Combo Tiết Kiệm
                </button>
              </div>
            </div>

            <!-- LƯỚI THẺ DỊCH VỤ -->
            <div id="servicesCatalogGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
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
          <div class="service-bento-card" id="bentoCard_${item.id}"
               style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; height: 100%; box-shadow: none; transition: transform 0.2s ease;">
            
            <!-- ẢNH DỊCH VỤ ĐỒNG NHẤT -->
            <div style="position: relative; width: 100%; height: 180px; overflow: hidden; background: #18181b;">
              <img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover;" alt="${item.name || item.TenDichVu}" loading="lazy"
                   onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='Men_Grooming_Products/DichVu_Men/DV1.jpg');">
              <div style="position: absolute; top: 10px; left: 10px; background: #121214; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #A1A1AA; border: 1px solid #222225;">
                ${durationVal} phút
              </div>
              ${isCombo ? `
                <div style="position: absolute; top: 10px; right: 10px; background: #27272A; color: #FBBF24; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid rgba(245, 158, 11, 0.2);">
                  COMBO VIP
                </div>
              ` : ''}
            </div>

            <!-- NỘI DUNG DỊCH VỤ -->
            <div style="padding: 18px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 class="service-bento-title" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; line-height: 1.4;">
                  ${item.name || item.TenDichVu}
                </h3>
                <p class="service-bento-desc" style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; min-height: 58px;">
                  ${item.description || item.MoTa || 'Dịch vụ tạo mẫu chuẩn mực với tư vấn phom dáng chuyên nghiệp và thư giãn da đầu cao cấp.'}
                </p>
              </div>

              <!-- GIÁ & NÚT ĐẶT LỊCH DÍNH ĐÁY -->
              <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-size: 18px; font-weight: 600; color: var(--text-primary);">${priceFormatted}</span>
                  ${originalPrice && originalPrice > actualPrice ? `<span style="font-size: 12.5px; text-decoration: line-through; color: var(--text-muted); margin-left: 6px;">${SalonUtils.formatCurrency(originalPrice)}</span>` : ''}
                </div>
                <button onclick="ServicesPage.selectAndBook('${item.id}')"
                        style="height: 38px; padding: 0 16px; border-radius: 8px; background: #D97706; border: none; color: #09090B; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: none;">
                  Đặt Lịch
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

