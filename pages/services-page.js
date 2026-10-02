// =========================================================================
// Omni Salon — SERVICES PAGE COMPONENT (BENTO GRID & 3D PARALLAX TILT - WCAG AAA)
// Tuân thủ: .antigravity/rules/03_coder.md, 04_refactor.md
// Route: "/services" -> Bento Grid Services, Pill Tabs, Duration, Price
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
        <div class="omni-container" style="padding-top: 60px; padding-bottom: 80px;">
          <!-- Header Banner -->
          <div style="margin-bottom: 40px;">
            <div class="nordic-hero-badge">
              <span>✂️</span> BESPOKE SERVICES MENU • NORDIC LUXURY
            </div>
            <h1 style="font-size: clamp(32px, 4vw, 48px); font-weight: 900; color: #FFFFFF; letter-spacing: -0.02em; margin-bottom: 12px;">
              Bảng Dịch Vụ &amp; Trải Nghiệm Chăm Sóc Tóc 5 Sao
            </h1>
            <p style="font-size: 15px; color: #CBD5E1; max-width: 720px; line-height: 1.65;">
              Mỗi gói dịch vụ tại Omni Salon đều được thiết kế tỉ mỉ bởi các chuyên gia tạo mẫu hàng đầu, sử dụng 100% dược liệu hữu cơ cao cấp nhập khẩu chính hãng.
            </p>
          </div>

          <!-- Pill Tabs Category Filters -->
          <div class="nordic-filter-strip" id="servicesPillStrip">
            <button class="nordic-pill-tab ${this.activeCategory === 'all' ? 'active' : ''}" onclick="ServicesPage.setCategory('all')">
              Tất Cả Dịch Vụ
            </button>
            <button class="nordic-pill-tab ${this.activeCategory === 'haircut' ? 'active' : ''}" onclick="ServicesPage.setCategory('haircut')">
              ✂️ Cắt Tạo Kiểu
            </button>
            <button class="nordic-pill-tab ${this.activeCategory === 'perm' ? 'active' : ''}" onclick="ServicesPage.setCategory('perm')">
              🌀 Uốn Phục Hồi
            </button>
            <button class="nordic-pill-tab ${this.activeCategory === 'color' ? 'active' : ''}" onclick="ServicesPage.setCategory('color')">
              🎨 Nhuộm Balayage / Ombre
            </button>
            <button class="nordic-pill-tab ${this.activeCategory === 'spa' || this.activeCategory === 'care' ? 'active' : ''}" onclick="ServicesPage.setCategory('spa')">
              ✨ Phục Hồi Olaplex
            </button>
            <button class="nordic-pill-tab ${this.activeCategory === 'combo' ? 'active' : ''}" onclick="ServicesPage.setCategory('combo')">
              👑 Gói Combo Tiết Kiệm
            </button>
          </div>

          <!-- Services Bento Grid -->
          <div class="bento-grid" id="servicesCatalogGrid" style="margin-top: 24px;">
            ${this.renderCards()}
          </div>
        </div>
      `;
    },

    setCategory(category) {
      this.activeCategory = category;
      const strip = document.getElementById('servicesPillStrip');
      if (strip) {
        const isCut = (category === 'haircut' || category === 'cut' || category === 'cat-tao-kieu');
        strip.querySelectorAll('.nordic-pill-tab').forEach(tab => {
          const onclickAttr = tab.getAttribute('onclick') || '';
          if (onclickAttr.includes(`'${category}'`) || (isCut && onclickAttr.includes("'haircut'"))) {
            tab.classList.add('active');
          } else {
            tab.classList.remove('active');
          }
        });
      }

      const grid = document.getElementById('servicesCatalogGrid');
      if (grid) {
        grid.innerHTML = this.renderCards();
        if (window.AppRouter) {
          window.AppRouter.initTiltEffects(grid);
          window.AppRouter.initMagneticButtons(grid);
        }
      }
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
        // Tab 'Cắt Tạo Kiểu': Load trực tiếp DV01, DV02 và các Combo có cắt tạo kiểu
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
        
        let savingsBadge = '';
        if (isCombo) {
          const savings = (window.PricingEngine && typeof window.PricingEngine.calculateComboSavings === 'function')
            ? window.PricingEngine.calculateComboSavings(item.id)
            : 80000;
          if (savings > 0) {
            savingsBadge = `<span class="service-bento-badge-save">TIẾT KIỆM ${SalonUtils.formatCurrency(savings)}</span>`;
          }
        } else if (item.promotionApplied) {
          const discountAmt = (originalPrice && originalPrice > actualPrice) ? (originalPrice - actualPrice) : (item.id === 'DV05' ? 100000 : 50000);
          savingsBadge = `<span class="service-bento-badge-save" style="background: linear-gradient(135deg, #F59E0B, #D97706); color: #000; font-weight: 800;">${item.promotionApplied}: -${SalonUtils.formatCurrency(discountAmt)}</span>`;
        }

        const thumb = item.image || (isCombo 
          ? 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80');

        return `
          <div class="card-3d-tilt service-bento-card" id="bentoCard_${item.id}" style="background: #11141D; border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);">
            <div class="service-bento-img-wrap">
              <img src="${thumb}" class="service-bento-img" alt="${item.name || item.TenDichVu}" loading="lazy"
                   onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';">
              <div class="service-bento-duration">
                <span>⏱️</span>
                <span>${duration} phút</span>
              </div>
              ${savingsBadge}
            </div>
            <div class="service-bento-body">
              <div>
                <h3 class="service-bento-title">${isCombo ? '👑 ' : ''}${item.name || item.TenDichVu}</h3>
                <p class="service-bento-desc">${item.description || item.MoTa || 'Dịch vụ tạo mẫu chuẩn 5 sao với tư vấn phom dáng chuyên nghiệp và thư giãn da đầu cao cấp.'}</p>
              </div>
              <div class="service-bento-footer">
                <div>
                  <span class="service-bento-price">${priceFormatted}</span>
                  ${originalPrice && originalPrice > actualPrice ? `<span style="font-size: 13px; text-decoration: line-through; color: #94A3B8; margin-left: 6px;">${SalonUtils.formatCurrency(originalPrice)}</span>` : ''}
                </div>
                <button class="service-bento-btn btn-magnetic" onclick="ServicesPage.selectAndBook('${item.id}')">
                  Chọn dịch vụ này → Đặt lịch
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
      } else if (window.UICommon) {
        window.UICommon.openBookingModal(serviceId);
      }
    }
  };

  window.ServicesPage = ServicesPage;

})(typeof window !== 'undefined' ? window : this);
