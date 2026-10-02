// =========================================================================
// Omni Salon — SHOP PAGE COMPONENT (E-COMMERCE & CART DRAWER - WCAG AAA)
// Tuân thủ: .antigravity/rules/03_coder.md, 04_refactor.md
// Route: "/shop" -> E-Commerce Hair Cosmetics, Brand/Price Filter, Cart Drawer
// =========================================================================

(function (window) {
  'use strict';

  const ShopPage = {
    selectedBrand: 'all',
    selectedPriceRange: 'all',
    searchQuery: '',

    render(container, params = {}) {
      if (!container) return;

      if (params.brand) this.selectedBrand = params.brand;
      if (params.price) this.selectedPriceRange = params.price;

      container.innerHTML = `
        <div class="omni-container" style="padding-top: 60px; padding-bottom: 80px;">
          <!-- Header Banner & Floating Cart Action -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; flex-wrap: wrap; gap: 20px;">
            <div>
              <div class="nordic-hero-badge">
                <span>🧴</span> OMNI HAIR CARE APOTHECARY • CHÍNH HÃNG 100%
              </div>
              <h1 class="shop-header-title" style="font-size: clamp(30px, 4vw, 44px); font-weight: 900; color: var(--text-primary, #FFFFFF); letter-spacing: -0.02em; margin-bottom: 8px;">
                Mỹ Phẩm &amp; Dược Liệu Tóc Cao Cấp Quốc Tế
              </h1>
              <p class="shop-header-desc" style="font-size: 14px; color: var(--text-secondary, #CBD5E1); max-width: 680px; line-height: 1.6;">
                Các dòng Pomade, Sáp vuốt tóc, Dầu gội hữu cơ và Serum phục hồi chuyên sâu từ các thương hiệu huyền thoại Brosh, Suavecito, Reuzel.
              </p>
            </div>

            <!-- Cart Trigger Button -->
            <button class="nordic-btn-primary btn-magnetic" onclick="UICommon && UICommon.openCartDrawer ? UICommon.openCartDrawer() : null">
              🛒 Mở Giỏ Hàng (<span id="shopCartCounter">0</span>)
            </button>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="shop-filter-panel" style="background: var(--surface-card, #10131C); border-radius: 20px; border: 1px solid var(--border-color, rgba(212, 175, 55, 0.15)); padding: 24px; margin-bottom: 32px;">
            <div style="display: flex; flex-direction: column; gap: 18px;">
              <!-- Top Row: Search Input -->
              <div style="display: flex; gap: 14px; align-items: center;">
                <div style="flex: 1; position: relative;">
                  <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 16px;">🔍</span>
                  <input type="text" id="shopSearchInput" class="quick-booking-pill-select shop-search-input"
                         style="width: 100%; padding-left: 44px; height: 48px; font-size: 14px; background: var(--bg-primary, #141722); color: var(--text-primary, #FFFFFF); border: 1px solid var(--border-color, rgba(255,255,255,0.15)); border-radius: 12px;"
                         placeholder="Tìm kiếm theo tên sản phẩm, công dụng (pomade, gội, xả, sáp, serum)..."
                         value="${this.searchQuery}"
                         oninput="ShopPage.handleSearch(this.value)">
                </div>
              </div>

              <!-- Brand Filters -->
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span class="shop-filter-label" style="font-size: 12px; font-weight: 800; color: #F59E0B; text-transform: uppercase;">THƯƠNG HIỆU:</span>
                <button class="nordic-pill-tab ${this.selectedBrand === 'all' ? 'active' : ''}" onclick="ShopPage.setBrand('all')">
                  Tất Cả
                </button>
                <button class="nordic-pill-tab ${this.selectedBrand === 'loreal' || this.selectedBrand === 'l’oréal' ? 'active' : ''}" onclick="ShopPage.setBrand('loreal')">
                  L’Oréal
                </button>
                <button class="nordic-pill-tab ${this.selectedBrand === 'olaplex' ? 'active' : ''}" onclick="ShopPage.setBrand('olaplex')">
                  Olaplex
                </button>
                <button class="nordic-pill-tab ${this.selectedBrand === 'moroccanoil' ? 'active' : ''}" onclick="ShopPage.setBrand('moroccanoil')">
                  Moroccanoil
                </button>
                <button class="nordic-pill-tab ${this.selectedBrand === 'davines' ? 'active' : ''}" onclick="ShopPage.setBrand('davines')">
                  Davines
                </button>
                <button class="nordic-pill-tab ${this.selectedBrand === 'volcanic' ? 'active' : ''}" onclick="ShopPage.setBrand('volcanic')">
                  Volcanic Clay
                </button>
              </div>

              <!-- Price Filters -->
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span class="shop-filter-label" style="font-size: 12px; font-weight: 800; color: #F59E0B; text-transform: uppercase;">MỨC GIÁ:</span>
                <button class="nordic-pill-tab ${this.selectedPriceRange === 'all' ? 'active' : ''}" onclick="ShopPage.setPriceRange('all')">
                  Tất Cả Mức Giá
                </button>
                <button class="nordic-pill-tab ${this.selectedPriceRange === 'under300' ? 'active' : ''}" onclick="ShopPage.setPriceRange('under300')">
                  Dưới 300,000 đ
                </button>
                <button class="nordic-pill-tab ${this.selectedPriceRange === '300to500' ? 'active' : ''}" onclick="ShopPage.setPriceRange('300to500')">
                  300,000 đ - 500,000 đ
                </button>
                <button class="nordic-pill-tab ${this.selectedPriceRange === 'above500' ? 'active' : ''}" onclick="ShopPage.setPriceRange('above500')">
                  Trên 500,000 đ
                </button>
              </div>
            </div>
          </div>

          <!-- Product Catalog Grid -->
          <div class="bento-grid" id="shopCatalogGrid">
            ${this.renderProducts()}
          </div>
        </div>
      `;

      this.updateCartBadge();
    },

    setBrand(brand) {
      this.selectedBrand = brand;
      this.refreshGrid();
    },

    setPriceRange(range) {
      this.selectedPriceRange = range;
      this.refreshGrid();
    },

    handleSearch(query) {
      this.searchQuery = query.toLowerCase().trim();
      this.refreshGrid();
    },

    refreshGrid() {
      const grid = document.getElementById('shopCatalogGrid');
      if (grid) {
        grid.innerHTML = this.renderProducts();
        if (window.AppRouter) {
          window.AppRouter.initTiltEffects(grid);
          window.AppRouter.initMagneticButtons(grid);
        }
      }
    },

    updateCartBadge() {
      const cartCount = (window.store && typeof window.store.getCartCount === 'function') 
        ? window.store.getCartCount() 
        : 0;
      const counter = document.getElementById('shopCartCounter');
      if (counter) counter.textContent = cartCount;
    },

    renderProducts() {
      const allProducts = (window.store && typeof window.store.getProducts === 'function') 
        ? window.store.getProducts() 
        : [];

      let filtered = allProducts;

      if (this.selectedBrand !== 'all') {
        const queryBrand = this.selectedBrand.replace(/[’']/g, '').toLowerCase();
        filtered = filtered.filter(p => {
          const b = (p.brand || '').replace(/[’']/g, '').toLowerCase();
          const n = (p.name || p.TenSanPham || '').replace(/[’']/g, '').toLowerCase();
          return b.includes(queryBrand) || n.includes(queryBrand);
        });
      }

      if (this.selectedPriceRange === 'under300') {
        filtered = filtered.filter(p => Number(p.GiaBanThucTe || p.price) < 300000);
      } else if (this.selectedPriceRange === '300to500') {
        filtered = filtered.filter(p => {
          const val = Number(p.GiaBanThucTe || p.price);
          return val >= 300000 && val <= 500000;
        });
      } else if (this.selectedPriceRange === 'above500') {
        filtered = filtered.filter(p => Number(p.GiaBanThucTe || p.price) > 500000);
      }

      if (this.searchQuery) {
        filtered = filtered.filter(p => {
          const name = (p.name || p.TenSanPham || '').toLowerCase();
          const brand = (p.brand || '').toLowerCase();
          const desc = (p.description || p.MoTa || '').toLowerCase();
          return name.includes(this.searchQuery) || brand.includes(this.searchQuery) || desc.includes(this.searchQuery);
        });
      }

      if (filtered.length === 0) {
        return `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #10131C; border-radius: 20px; border: 1px dashed rgba(212, 175, 55, 0.25);">
            <div style="font-size: 40px; margin-bottom: 12px;">🧴</div>
            <h3 style="color: #FFFFFF; font-size: 18px; margin-bottom: 6px;">Không tìm thấy sản phẩm phù hợp</h3>
            <p style="color: #CBD5E1; font-size: 13px;">Quý khách vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
          </div>
        `;
      }

      return filtered.map(p => {
        const actualPrice = p.GiaBanThucTe || p.price;
        const originalPrice = p.originalPrice || p.GiaNiemYetGoc || p.GiaBan;
        const price = SalonUtils.formatCurrency(actualPrice);
        const rating = (p.rating || 4.9).toFixed(1);
        const thumb = p.image || p.HinhAnh || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80';
        const badge = p.badge || (p.PhanTramGiam > 0 ? `Giảm ${p.PhanTramGiam}%` : '');
        const discountBadgeHtml = badge ? `
          <span style="position: absolute; top: 12px; right: 12px; background: #EF4444; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); z-index: 2;">
            ${badge}
          </span>
        ` : '';
        const priceDisplay = (originalPrice && originalPrice > actualPrice) ? `
          <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px;">
            <span style="font-size: 20px; font-weight: 900; color: #F59E0B;">${price}</span>
            <span style="font-size: 14px; text-decoration: line-through; color: #94A3B8;">${SalonUtils.formatCurrency(originalPrice)}</span>
          </div>
        ` : `
          <div style="font-size: 20px; font-weight: 900; color: #F59E0B; margin-bottom: 14px;">${price}</div>
        `;

        return `
          <div class="card-3d-tilt product-nordic-card" id="productCard_${p.id}"
               style="padding: 24px; background: var(--surface-card, #10131C); border-radius: 20px; border: 1px solid var(--border-color, rgba(212, 175, 55, 0.15)); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="position: relative; border-radius: 14px; overflow: hidden; margin-bottom: 16px;">
                <img src="${thumb}" style="width: 100%; aspect-ratio: 1; object-fit: cover;" alt="${p.name || p.TenSanPham}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80';">
                <span style="position: absolute; top: 12px; left: 12px; background: rgba(7,8,11,0.9); color: #F59E0B; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(245,158,11,0.35);">
                  ${p.brand || 'PREMIUM'}
                </span>
                ${discountBadgeHtml}
                <span style="position: absolute; bottom: 12px; right: 12px; background: rgba(7,8,11,0.85); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                  ★ ${rating}
                </span>
              </div>
              <h3 class="product-card-title" style="font-size: 16px; font-weight: 800; margin-bottom: 8px; line-height: 1.4;">${p.name || p.TenSanPham}</h3>
              <p class="product-card-desc" style="font-size: 13px; line-height: 1.55; margin-bottom: 16px;">
                ${p.description || p.MoTa || 'Dòng sản phẩm cao cấp chính hãng nhập khẩu, nuôi dưỡng và bảo vệ nếp tóc suốt 24h.'}
              </p>
            </div>

            <div>
              ${priceDisplay}
              <div style="display: flex; gap: 8px;">
                <button class="nordic-btn-primary btn-magnetic" style="flex: 1; font-size: 12px; padding: 10px;"
                        onclick="UICommon.addToCart('${p.id}', 'product'); ShopPage.updateCartBadge();">
                  🛒 Thêm Vào Giỏ
                </button>
                <button class="nordic-btn-secondary btn-magnetic" style="font-size: 12px; padding: 10px;"
                        onclick="UICommon.addToCart('${p.id}', 'product'); UICommon.openCartDrawer(); ShopPage.updateCartBadge();">
                  Mua Ngay →
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  };

  window.ShopPage = ShopPage;

})(typeof window !== 'undefined' ? window : this);
