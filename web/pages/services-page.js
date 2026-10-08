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
          <div style="max-width: 1240px; margin: 0 auto; padding: 0 20px;">
            <!-- Header Banner -->
            <div style="text-align: center; margin-bottom: 36px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; background: var(--brand-accent-subtle); border: 1px solid var(--brand-accent-border); color: var(--brand-accent); font-size: 13px; font-weight: 800; text-transform: uppercase; margin-bottom: 14px;">
                <span>✂️</span> BẢNG DỊCH VỤ • OMNI SALON
              </div>
              <h1 style="font-size: clamp(30px, 4vw, 42px); font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; margin: 0 0 10px;">
                Bảng Giá Dịch Vụ &amp; Gói Combo Cắt Tóc
              </h1>
              <p style="font-size: 15px; color: var(--text-secondary); max-width: 720px; margin: 0 auto 24px; line-height: 1.6;">
                Mỗi dịch vụ tại Omni Salon đều được chăm chút tỉ mỉ bởi đội ngũ thợ tay nghề cao, sử dụng mỹ phẩm chăm sóc tóc chính hãng an toàn cho da đầu.
              </p>

              <!-- Pill Tabs Category Filters -->
              <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                <button class="nordic-pill-tab ${this.activeCategory === 'all' ? 'active' : ''}" onclick="ServicesPage.setCategory('all')"
                        style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${this.activeCategory === 'all' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.activeCategory === 'all' ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${this.activeCategory === 'all' ? '#ffffff' : 'var(--text-primary)'};">
                  Tất Cả Dịch Vụ
                </button>
                <button class="nordic-pill-tab ${this.activeCategory === 'haircut' ? 'active' : ''}" onclick="ServicesPage.setCategory('haircut')"
                        style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${this.activeCategory === 'haircut' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.activeCategory === 'haircut' ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${this.activeCategory === 'haircut' ? '#ffffff' : 'var(--text-primary)'};">
                  ✂️ Cắt Tạo Kiểu
                </button>
                <button class="nordic-pill-tab ${this.activeCategory === 'perm' ? 'active' : ''}" onclick="ServicesPage.setCategory('perm')"
                        style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${this.activeCategory === 'perm' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.activeCategory === 'perm' ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${this.activeCategory === 'perm' ? '#ffffff' : 'var(--text-primary)'};">
                  🌀 Uốn Phục Hồi
                </button>
                <button class="nordic-pill-tab ${this.activeCategory === 'color' ? 'active' : ''}" onclick="ServicesPage.setCategory('color')"
                        style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${this.activeCategory === 'color' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.activeCategory === 'color' ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${this.activeCategory === 'color' ? '#ffffff' : 'var(--text-primary)'};">
                  🎨 Nhuộm Balayage / Ombre
                </button>
                <button class="nordic-pill-tab ${this.activeCategory === 'spa' || this.activeCategory === 'care' ? 'active' : ''}" onclick="ServicesPage.setCategory('spa')"
                        style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${this.activeCategory === 'spa' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.activeCategory === 'spa' ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${this.activeCategory === 'spa' ? '#ffffff' : 'var(--text-primary)'};">
                  ✨ Phục Hồi Chuyên Sâu
                </button>
                <button class="nordic-pill-tab ${this.activeCategory === 'combo' ? 'active' : ''}" onclick="ServicesPage.setCategory('combo')"
                        style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${this.activeCategory === 'combo' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.activeCategory === 'combo' ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${this.activeCategory === 'combo' ? '#ffffff' : 'var(--text-primary)'};">
                  👑 Gói Combo Tiết Kiệm
                </button>
              </div>
            </div>

            <!-- LƯỚI THẺ DỊCH VỤ (CÂN BẰNG THẺ TUYỆT ĐỐI) -->
            <div id="servicesCatalogGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
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
        const duration = item.duration || item.ThoiLuong || item.duration_minutes || (isCombo ? 75 : 45);
        const actualPrice = item.price || item.Gia || 0;
        const originalPrice = item.originalPrice || item.oldPrice;
        const priceFormatted = SalonUtils.formatCurrency(actualPrice);

        const thumb = item.image || (isCombo 
          ? 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80');

        return `
          <div class="service-bento-card" id="bentoCard_${item.id}"
               style="background: var(--surface-card); border: .5px solid var(--border-color); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; height: 100%; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04); transition: transform 0.2s ease, box-shadow 0.2s ease;">
            
            <!-- ẢNH DỊCH VỤ ĐỒNG NHẤT -->
            <div style="position: relative; width: 100%; height: 200px; overflow: hidden; background: var(--surface-elevated);">
              <img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover;" alt="${item.name || item.TenDichVu}" loading="lazy"
                   onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';">
              <div style="position: absolute; top: 12px; left: 12px; background: var(--surface-card); padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; color: var(--brand-accent); border: 1px solid var(--border-color);">
                ⏱️ ${duration} phút
              </div>
              ${isCombo ? `
                <div style="position: absolute; top: 12px; right: 12px; background: #166534; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800;">
                  👑 COMBO VIP
                </div>
              ` : ''}
            </div>

            <!-- NỘI DUNG DỊCH VỤ -->
            <div style="padding: 22px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; line-height: 1.4;">
                  ${item.name || item.TenDichVu}
                </h3>
                <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; min-height: 60px;">
                  ${item.description || item.MoTa || 'Dịch vụ tạo mẫu chuẩn 5 sao với tư vấn phom dáng chuyên nghiệp và thư giãn da đầu cao cấp.'}
                </p>
              </div>

              <!-- GIÁ & NÚT ĐẶT LỊCH DÍNH ĐÁY -->
              <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-size: 20px; font-weight: 900; color: var(--brand-accent);">${priceFormatted}</span>
                  ${originalPrice && originalPrice > actualPrice ? `<span style="font-size: 13px; text-decoration: line-through; color: var(--text-secondary); margin-left: 6px;">${SalonUtils.formatCurrency(originalPrice)}</span>` : ''}
                </div>
                <button onclick="ServicesPage.selectAndBook('${item.id}')"
                        style="height: 42px; padding: 0 18px; border-radius: 10px; background: var(--brand-accent); border: none; color: #ffffff; font-size: 13px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(180,131,18,0.25);">
                  📅 Đặt Lịch
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

