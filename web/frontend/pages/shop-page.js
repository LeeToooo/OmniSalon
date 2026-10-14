// =========================================================================

(function (window) {
  'use strict';

  const ShopPage = {
    selectedCategory: 'all',
    selectedBrand: 'all',
    selectedPriceRange: 'all',
    searchQuery: '',
    currentPage: 1,
    pageSize: 12,

    render(container, params = {}) {
      if (!container) return;

      if (params.category) this.selectedCategory = params.category;
      if (params.brand) this.selectedBrand = params.brand;
      if (params.price) this.selectedPriceRange = params.price;

      let categories = (window.store && typeof window.store.getCategories === 'function')
        ? window.store.getCategories()
        : [];
      if (!categories || categories.length === 0) {
        categories = (window.INITIAL_DATA && window.INITIAL_DATA.categories) ||
                     (window.INITIAL_SALON_DATA && window.INITIAL_SALON_DATA.categories) || [];
      }

      const filtered = this.getFilteredProducts();

      container.innerHTML = `
        <div class="shop-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 32px 0 72px;">
          <div style="max-width: 1640px; width: 100%; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); box-sizing: border-box;">
            <!-- Header Banner (Visual Hierarchy & Contrast) -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 20px;">
              <div>
                <h1 style="font-size: clamp(26px, 3.5vw, 36px); font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin: 0 0 8px;">
                  Mỹ Phẩm &amp; Dược Liệu Tóc Cao Cấp
                </h1>
                <p style="font-size: 14.5px; color: var(--text-secondary); max-width: 680px; line-height: 1.6; margin: 0;">
                  Các dòng sản phẩm chăm sóc tóc chuyên nghiệp: Sáp vuốt tóc, Pomade, Gôm xịt giữ nếp, Dầu gội xả phục hồi, Dưỡng râu và Dụng cụ tạo kiểu.
                </p>
              </div>

              <!-- Nút mở giỏ hàng (Flat CTA) -->
              <button class="btn-flat-cta btn-flat-primary"
                      style="height: 44px; padding: 0 20px; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;"
                      onclick="UICommon && UICommon.openCartDrawer ? UICommon.openCartDrawer() : null">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span>Giỏ Hàng (<span id="shopCartCounter">0</span>)</span>
              </button>
            </div>

            <!-- BẢNG TÌM KIẾM & BỘ LỌC DANH MỤC (Flat Design - Radius 12px) -->
            <div style="background: var(--surface-card); border-radius: 12px; border: 1px solid var(--border-color); padding: 20px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Ô Tìm Kiếm -->
                <div style="position: relative;">
                  <input type="text" id="shopSearchInput"
                         style="width: 100%; height: 44px; padding-left: 16px; padding-right: 16px; font-size: 14px; font-weight: 500; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; outline: none; box-sizing: border-box; transition: border-color 0.15s ease;"
                         placeholder="Tìm kiếm theo tên sản phẩm, thương hiệu hoặc công dụng..."
                         value="${this.searchQuery}"
                         oninput="ShopPage.handleSearch(this.value)">
                </div>

                <!-- Lọc Theo Danh Mục (Clean Tabs) -->
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span style="font-size: 11.5px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase; letter-spacing: 0.04em;">DANH MỤC:</span>
                  <div class="clean-filter-tabs">
                    <button class="clean-tab-btn ${this.selectedCategory === 'all' ? 'active' : ''}" onclick="ShopPage.setCategory('all')">
                      Tất Cả
                    </button>
                    <button class="clean-tab-btn ${this.selectedCategory === 'fefo_expiry' ? 'active' : ''}" onclick="ShopPage.setCategory('fefo_expiry')"
                            style="${this.selectedCategory === 'fefo_expiry' ? 'background: #b91c1c; border-color: #b91c1c;' : 'color: #ef4444; border-color: rgba(239, 68, 68, 0.3);'}">
                      Flash Sale
                    </button>
                    ${categories.map(c => `
                      <button class="clean-tab-btn ${this.selectedCategory === c.id ? 'active' : ''}" onclick="ShopPage.setCategory('${c.id}')">
                        ${(c.TenDanhMuc || c.name || '').split(' - ')[0]}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- Lọc Theo Thương Hiệu & Mức Giá (Clean Row) -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid var(--border-color);">
                  <!-- Thương hiệu -->
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-size: 11.5px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase; letter-spacing: 0.04em;">THƯƠNG HIỆU:</span>
                    <div class="clean-filter-tabs">
                      ${['all', 'apestomen', 'hanz de fuko', 'blumaan', 'kevin murphy', 'reuzel', 'olaplex', 'davines'].map(br => `
                        <button class="clean-tab-btn ${this.selectedBrand === br ? 'active' : ''}" onclick="ShopPage.setBrand('${br}')"
                                style="height: 32px; padding: 0 10px; font-size: 12px; text-transform: capitalize;">
                          ${br === 'all' ? 'Tất Cả' : br}
                        </button>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Khoảng Giá -->
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-size: 11.5px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase; letter-spacing: 0.04em;">MỨC GIÁ:</span>
                    <div class="clean-filter-tabs">
                      <button class="clean-tab-btn ${this.selectedPriceRange === 'all' ? 'active' : ''}" onclick="ShopPage.setPrice('all')" style="height: 32px; padding: 0 10px; font-size: 12px;">
                        Tất Cả
                      </button>
                      <button class="clean-tab-btn ${this.selectedPriceRange === 'under300' ? 'active' : ''}" onclick="ShopPage.setPrice('under300')" style="height: 32px; padding: 0 10px; font-size: 12px;">
                        &lt; 300K
                      </button>
                      <button class="clean-tab-btn ${this.selectedPriceRange === '300to500' ? 'active' : ''}" onclick="ShopPage.setPrice('300to500')" style="height: 32px; padding: 0 10px; font-size: 12px;">
                        300K – 500K
                      </button>
                      <button class="clean-tab-btn ${this.selectedPriceRange === 'above500' ? 'active' : ''}" onclick="ShopPage.setPrice('above500')" style="height: 32px; padding: 0 10px; font-size: 12px;">
                        &gt; 500K
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- LƯỚI SẢN PHẨM (Clean E-Commerce Grid) -->
            <div id="shopCatalogGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;">
              ${this.renderProducts(filtered)}
            </div>

            <!-- PHÂN TRANG -->
            <div id="shopPaginationContainer">
              ${this.renderPagination(filtered)}
            </div>
          </div>
        </div>
      `;

      this.updateCartBadge();
    },

    setCategory(cat) {
      this.selectedCategory = cat;
      this.currentPage = 1;
      this.render(document.getElementById('webMainContainer'));
    },

    setBrand(brand) {
      this.selectedBrand = brand;
      this.currentPage = 1;
      this.render(document.getElementById('webMainContainer'));
    },

    setPrice(range) {
      this.selectedPriceRange = range;
      this.currentPage = 1;
      this.render(document.getElementById('webMainContainer'));
    },

    handleSearch(query) {
      this.searchQuery = query.toLowerCase().trim();
      this.currentPage = 1;
      this.refreshCatalog();
    },

    changePage(newPage) {
      const filtered = this.getFilteredProducts();
      const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (newPage < 1 || newPage > totalPages) return;
      this.currentPage = newPage;
      this.refreshCatalog();

      const grid = document.getElementById('shopCatalogGrid');
      if (grid) {
        const top = grid.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    },

    refreshCatalog() {
      const filtered = this.getFilteredProducts();
      const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (this.currentPage > totalPages) this.currentPage = 1;

      const grid = document.getElementById('shopCatalogGrid');
      if (grid) {
        grid.innerHTML = this.renderProducts(filtered);
      }
      const pagination = document.getElementById('shopPaginationContainer');
      if (pagination) {
        pagination.innerHTML = this.renderPagination(filtered);
      }
    },

    refreshGrid() {
      this.refreshCatalog();
    },

    updateCartBadge() {
      const cartCount = (window.store && typeof window.store.getCartCount === 'function')
        ? window.store.getCartCount()
        : 0;
      const counter = document.getElementById('shopCartCounter');
      if (counter) counter.textContent = cartCount;
    },

    getFilteredProducts() {
      let allProducts = (window.store && typeof window.store.getProducts === 'function')
        ? window.store.getProducts()
        : [];
      if (!allProducts || allProducts.length === 0) {
        allProducts = (window.INITIAL_DATA && window.INITIAL_DATA.products) ||
                      (window.INITIAL_SALON_DATA && window.INITIAL_SALON_DATA.products) || [];
      }

      // LỌC 1: LOẠI BỎ HOÀN TOÀN SẢN PHẨM HẾT HẠN (daysRemaining <= 0)
      let filtered = allProducts.filter(p => {
        if (p.isExpired === true) return false;
        if (p.daysRemaining !== undefined && p.daysRemaining <= 0) return false;
        return true;
      });

      // Filter theo Danh mục
      if (this.selectedCategory === 'fefo_expiry') {
        filtered = filtered.filter(p => (p.PhanTramGiam && p.PhanTramGiam > 0) || p.isNearExpiry);
      } else if (this.selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.categoryId === this.selectedCategory || p.MaDanhMuc === this.selectedCategory);
      }

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

      return filtered;
    },

    resetFilters() {
      this.selectedCategory = 'all';
      this.selectedBrand = 'all';
      this.selectedPriceRange = 'all';
      this.searchQuery = '';
      this.currentPage = 1;
      const input = document.getElementById('shopSearchInput');
      if (input) input.value = '';
      this.render(document.getElementById('webMainContainer'));
    },

    renderProducts(filtered) {
      if (!filtered) filtered = this.getFilteredProducts();

      if (filtered.length === 0) {
        if (typeof window.ProductCard !== 'undefined' && typeof window.ProductCard.renderEmptyState === 'function') {
          return window.ProductCard.renderEmptyState({
            onReset: 'ShopPage.resetFilters()'
          });
        }
        return `
          <div class="catalog-empty-state" style="grid-column: 1 / -1;">
            <h3 class="empty-state-title">Không tìm thấy sản phẩm phù hợp</h3>
            <p class="empty-state-desc">Quý khách vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
            <button type="button" class="btn-flat-cta btn-flat-outline" onclick="ShopPage.resetFilters()">Thiết Lập Lại Bộ Lọc</button>
          </div>
        `;
      }

      // Phân trang 12 sản phẩm mỗi trang
      const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (this.currentPage > totalPages) this.currentPage = 1;
      const startIdx = (this.currentPage - 1) * this.pageSize;
      const paginated = filtered.slice(startIdx, startIdx + this.pageSize);

      if (typeof window.ProductCard !== 'undefined' && typeof window.ProductCard.render === 'function') {
        return paginated.map(p => window.ProductCard.render(p, {
          onCardClick: `UICommon.openProductDetailModal ? UICommon.openProductDetailModal('${p.id}') : null`
        })).join('');
      }

      // Fallback
      return paginated.map(p => {
        const actualPrice = p.GiaBanThucTe || p.price;
        const price = SalonUtils.formatCurrency(actualPrice);
        return `
          <div class="product-clean-card" id="productCard_${p.id}">
            <div class="product-body">
              <h3 class="product-title-clean">${p.name || p.TenSanPham}</h3>
              <div class="product-price-current">${price}</div>
            </div>
          </div>
        `;
      }).join('');
    },

    renderPagination(filtered) {
      if (!filtered || filtered.length === 0) return '';
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
      if (totalPages <= 1) return '';

      const startIdx = (this.currentPage - 1) * this.pageSize;
      const endIdx = Math.min(startIdx + this.pageSize, total);

      const pages = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        const left = Math.max(2, this.currentPage - 1);
        const right = Math.min(totalPages - 1, this.currentPage + 1);
        if (left > 2) pages.push('...');
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }

      const prevDisabled = this.currentPage <= 1;
      const nextDisabled = this.currentPage >= totalPages;

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 36px; padding: 18px 24px; background: var(--surface-card); border-radius: 18px; border: 1px solid var(--border-color); flex-wrap: wrap; gap: 16px; box-shadow: 0 4px 18px rgba(0,0,0,0.03);">
          <div style="font-size: 14px; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
            <span>Hiển thị</span>
            <span style="color: var(--brand-accent); font-weight: 800; font-size: 15px;">${startIdx + 1}–${endIdx}</span>
            <span>trên tổng số</span>
            <span style="color: var(--text-primary); font-weight: 800; font-size: 15px;">${total}</span>
            <span>sản phẩm (Trang ${this.currentPage}/${totalPages})</span>
          </div>

          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <button id="shopPrevPageBtn"
                    onclick="ShopPage.changePage(${this.currentPage - 1})"
                    ${prevDisabled ? 'disabled' : ''}
                    style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 42px; padding: 0 16px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: ${prevDisabled ? 'not-allowed' : 'pointer'}; opacity: ${prevDisabled ? '0.35' : '1'}; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); transition: all 0.2s ease;">
              <span style="font-size: 16px; line-height: 1;">←</span>
              <span>Trước</span>
            </button>

            <div style="display: inline-flex; align-items: center; gap: 6px;">
              ${pages.map(p => {
                if (p === '...') {
                  return `<span style="padding: 0 6px; color: var(--text-secondary); font-weight: 800; font-size: 14px;">…</span>`;
                }
                const isActive = p === this.currentPage;
                return `
                  <button onclick="ShopPage.changePage(${p})"
                          style="min-width: 42px; height: 42px; padding: 0 10px; border-radius: 10px; font-size: 13px; font-weight: ${isActive ? '800' : '600'}; cursor: pointer; transition: all 0.2s ease; ${
                            isActive
                              ? 'background: var(--brand-accent); color: #ffffff; border: 1.5px solid var(--brand-accent); box-shadow: 0 2px 10px rgba(180,131,18,0.3);'
                              : 'background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color);'
                          }">
                    ${p}
                  </button>
                `;
              }).join('')}
            </div>

            <button id="shopNextPageBtn"
                    onclick="ShopPage.changePage(${this.currentPage + 1})"
                    ${nextDisabled ? 'disabled' : ''}
                    style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 42px; padding: 0 18px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: ${nextDisabled ? 'not-allowed' : 'pointer'}; opacity: ${nextDisabled ? '0.35' : '1'}; background: var(--brand-accent); border: none; color: #ffffff; box-shadow: 0 4px 14px rgba(180,131,18,0.25); transition: all 0.2s ease;">
              <span>Sau</span>
              <span style="font-size: 16px; line-height: 1;">→</span>
            </button>
          </div>
        </div>
      `;
    },

    // -----------------------------------------------------------------------
    // TRANG CHI TIẾT SẢN PHẨM (PRODUCT DETAIL PAGE — FULL-PAGE CHUYÊN NGHIỆP)
    // -----------------------------------------------------------------------
    renderProductDetail(container, productId) {
      if (!container) return;

      let allProducts = (window.store && typeof window.store.getProducts === 'function')
        ? window.store.getProducts()
        : [];
      if (!allProducts || allProducts.length === 0) {
        allProducts = (window.INITIAL_DATA && window.INITIAL_DATA.products) ||
                      (window.INITIAL_SALON_DATA && window.INITIAL_SALON_DATA.products) || [];
      }

      // Lọc bỏ hoàn toàn SP_TOTE hoặc dữ liệu túi đỏ không nằm trong database SQL
      allProducts = allProducts.filter(p => p.id !== 'SP_TOTE' && p.MaSanPham !== 'SP_TOTE');

      let targetId = (productId === 'SP_TOTE') ? 'SP02' : productId;
      let prod = allProducts.find(p => p.id === targetId || p.MaSanPham === targetId);
      if (!prod) {
        prod = allProducts.find(p => p.id === 'SP02') || allProducts.find(p => p.id === 'SP01') || allProducts[0];
      }
      if (!prod) {
        prod = {
          id: 'SP02',
          name: 'Hanz de Fuko Gravity Paste',
          brand: 'Hanz de Fuko',
          price: 879000,
          originalPrice: 950000,
          image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Gravity_Paste.jpg',
          stock: 430,
          reviewCount: 120,
          description: 'Tạo độ phồng, texture rõ và giữ nếp chắc Dung tích: 2 oz / 56g; Loại: Paste; Giữ nếp: Cao; Finish: Matte tự nhiên; Phù hợp: Tóc ngắn – trung bình.'
        };
      }

      const actualPrice = Number(prod.GiaBanThucTe || prod.price || 0);
      const originalPrice = Number(prod.GiaNiemYetGoc || prod.originalPrice || prod.oldPrice || actualPrice);
      const hasDiscount = originalPrice > actualPrice && actualPrice > 0;
      const discountPercent = hasDiscount ? Math.round(((originalPrice - actualPrice) / originalPrice) * 100) : 0;

      // Gallery 4 ảnh chất lượng cao chuẩn barbershop nam giới
      const mainImgUrl = prod.image || prod.HinhAnh || 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Gravity_Paste.jpg';
      const detailImages = [
        mainImgUrl,
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80'
      ];

      // Trích xuất thông số từ mô tả sản phẩm trong CSDL chuẩn
      const rawDesc = prod.MoTa || prod.description || '';
      let detailsList = [];
      if (rawDesc.includes(';')) {
        detailsList = rawDesc.split(';').map(s => s.trim()).filter(Boolean);
      }
      if (detailsList.length === 0) {
        detailsList = [
          'Độ giữ nếp: Extreme High Hold 5/5 (Bền bỉ 14-16 tiếng)',
          'Độ bóng: Matte Finish (Mờ tự nhiên, không bết dính)',
          'Độ phồng (Volume): Cực cao, tạo phom phồng và restyle linh hoạt',
          'Mùi hương: Gỗ tuyết tùng Địa Trung Hải trầm ấm & nam tính',
          'Khả năng làm sạch: 100% gốc nước, dễ dàng rửa trôi với nước ấm'
        ];
      }

      let variants = ['56g (Hộp tiêu chuẩn)', '100g (Hũ tiết kiệm Salon)'];
      const pNameLower = (prod.name || prod.TenSanPham || '').toLowerCase();
      if (pNameLower.includes('shampoo') || pNameLower.includes('dầu gội') || pNameLower.includes('gội')) {
        variants = ['250ml', '500ml'];
      } else if (pNameLower.includes('spray') || pNameLower.includes('gôm') || pNameLower.includes('xịt')) {
        variants = ['150ml', '300ml'];
      } else if (pNameLower.includes('oil') || pNameLower.includes('dưỡng')) {
        variants = ['30ml', '60ml'];
      }

      // Lọc ra 4 sản phẩm liên quan khác
      const relatedProducts = allProducts.filter(p => (p.id !== prod.id && p.MaSanPham !== prod.id)).slice(0, 4);

      container.innerHTML = `
        <div class="pdp-page-wrapper">
          <div class="pdp-container">
            <!-- 1. BREADCRUMB & NÚT ĐIỀU HƯỚNG -->
            <div class="pdp-top-bar">
              <div class="pdp-breadcrumb">
                <a href="/" onclick="event.preventDefault(); CustomerWeb.switchTab('home')">Trang Chủ</a>
                <span class="pdp-sep">›</span>
                <a href="/shop" onclick="event.preventDefault(); CustomerWeb.switchTab('shop')">Mỹ Phẩm Salon</a>
                <span class="pdp-sep">›</span>
                <span style="color: var(--text-secondary);">${prod.brand || 'Thương hiệu'}</span>
                <span class="pdp-sep">›</span>
                <span class="pdp-curr-name" title="${prod.name || prod.TenSanPham}">${prod.name || prod.TenSanPham}</span>
              </div>
              <div class="pdp-top-actions">
                <button type="button" class="pdp-back-btn" onclick="CustomerWeb.switchTab('shop')">
                  ← Tiếp Tục Mua Sắm
                </button>
              </div>
            </div>

            <!-- 2. MAIN HERO SHOWCASE (CHUẨN BỐ CỤC 4RAU — THƯƠNG HIỆU OMNI SALON) -->
            <div class="pdp-hero-grid">
              <!-- CỘT TRÁI: GALLERY TRƯNG BÀY SẢN PHẨM -->
              <div class="pdp-gallery-wrap">
                <div class="pdp-gallery-inner">
                  <!-- Thumbnails Dọc Trái -->
                  <div class="pdp-thumbnails-col">
                    ${detailImages.map((img, idx) => `
                      <div class="pdp-thumb-item ${idx === 0 ? 'active' : ''}" onclick="ShopPage.switchDetailImage('${img}', this, ${idx})">
                        <img src="${SalonUtils.formatImageUrl(img)}" alt="thumb-${idx}" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : null">
                      </div>
                    `).join('')}
                  </div>

                  <!-- Khung Ảnh Lớn Chính -->
                  <div class="pdp-main-stage">
                    <img id="pdpMainImg"
                         src="${SalonUtils.formatImageUrl(detailImages[0])}"
                         alt="${prod.name || prod.TenSanPham}"
                         class="pdp-main-stage-img"
                         onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : null">

                    <!-- Dải chấm tròn chuẩn 4RAU -->
                    <div class="pdp-stage-dots-4rau">
                      ${detailImages.map((_, idx) => `<span class="pdp-dot-4rau ${idx === 0 ? 'active' : ''}" id="pdpDot_${idx}" onclick="ShopPage.switchDetailImage('${detailImages[idx]}', document.querySelectorAll('.pdp-thumb-item')[${idx}], ${idx})"></span>`).join('')}
                    </div>

                    <!-- Badge số lượng ảnh 1/4 chuẩn 4RAU -->
                    <div class="pdp-counter-badge" id="pdpImgCounter">1/${detailImages.length}</div>
                  </div>
                </div>
              </div>

              <!-- CỘT PHẢI: THÔNG TIN CHI TIẾT & MUA HÀNG (CHUẨN 4RAU — OMNI SALON) -->
              <div class="pdp-info-wrap">
                <!-- 1. Category / Brand Badge -->
                <div class="pdp-4rau-brand-badge">${'OMNI SALON • ' + (prod.brand || 'CHÍNH HÃNG').toUpperCase()}</div>

                <!-- 2. Tiêu Đề Sản Phẩm -->
                <h1 class="pdp-4rau-title">${prod.name || prod.TenSanPham}</h1>

                <!-- 3. Thanh Phụ: Đã Bán • Còn Hàng -->
                <div class="pdp-4rau-subbar">
                  <div class="pdp-4rau-sold">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <span>Đã bán <strong>${prod.reviewCount || 18}</strong></span>
                  </div>
                  <div class="pdp-4rau-instock">
                    <span class="pdp-4rau-dot"></span>
                    <span>Còn hàng</span>
                  </div>
                </div>

                <!-- 4. Khung Giá Đỏ Nổi Bật Nền Xám Nhạt Chuẩn 4RAU -->
                <div class="pdp-4rau-price-box">
                  <span class="pdp-4rau-price">${SalonUtils.formatCurrency(actualPrice)}</span>
                  ${hasDiscount ? `
                    <span class="pdp-4rau-old-price">${SalonUtils.formatCurrency(originalPrice)}</span>
                    <span class="pdp-4rau-discount-tag">-${discountPercent}%</span>
                  ` : ''}
                </div>

                <!-- 5. CHI TIẾT Dòng Gạch Đầu Dòng Chuẩn 4RAU -->
                <div class="pdp-4rau-section">
                  <div class="pdp-4rau-heading">CHI TIẾT:</div>
                  <div class="pdp-4rau-details-list">
                    ${detailsList.map(item => `
                      <div class="pdp-4rau-detail-item">- ${item}</div>
                    `).join('')}
                  </div>
                </div>

                <!-- 6. Phân Loại / Dung Tích -->
                <div class="pdp-4rau-field-row">
                  <span class="pdp-4rau-field-label">DUNG TÍCH / QUY CÁCH:</span>
                  <div class="pdp-4rau-chips-wrap" id="pdpVariantGroup">
                    ${variants.map((v, i) => `
                      <button type="button" class="pdp-4rau-chip ${i === 0 ? 'active' : ''}" onclick="ShopPage.selectVariant(this, '${v}')">${v}</button>
                    `).join('')}
                  </div>
                </div>

                <!-- 7. Tồn Kho -->
                <div class="pdp-4rau-field-row">
                  <span class="pdp-4rau-field-label">TỒN KHO:</span>
                  <span class="pdp-4rau-stock-val">${prod.stock || 80}</span>
                </div>

                <!-- 8. Số Lượng Chọn -->
                <div class="pdp-4rau-field-row">
                  <span class="pdp-4rau-field-label">SỐ LƯỢNG:</span>
                  <div class="pdp-4rau-stepper">
                    <button type="button" class="pdp-4rau-step-btn" onclick="ShopPage.changeDetailQty(-1)">−</button>
                    <input type="text" id="pdpDetailQtyInput" value="1" readonly class="pdp-4rau-step-input">
                    <button type="button" class="pdp-4rau-step-btn" onclick="ShopPage.changeDetailQty(1)">+</button>
                  </div>
                </div>

                <!-- 9. Cụm Nút CTA Chuẩn 4RAU (Thêm Giỏ Đen • Mua Ngay Đỏ • Nút Tim) -->
                <div class="pdp-4rau-cta-row">
                  <button type="button" class="pdp-4rau-btn-cart" onclick="ShopPage.handleDetailAddToCart('${prod.id}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <span>Thêm giỏ hàng</span>
                  </button>
                  <button type="button" class="pdp-4rau-btn-buynow" onclick="ShopPage.handleDetailBuyNow('${prod.id}')">
                    Mua ngay
                  </button>
                  <button type="button" class="pdp-4rau-btn-wish" onclick="ShopPage.toggleWishlist('${prod.id}', this)" title="Lưu vào danh sách yêu thích">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>

                <!-- 10. Chia Sẻ (Facebook • Zalo • Sao Chép Link) -->
                <div class="pdp-4rau-share-row">
                  <span class="pdp-4rau-share-label">Chia sẻ:</span>
                  <button type="button" class="pdp-4rau-share-btn fb" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    <span>Facebook</span>
                  </button>
                  <button type="button" class="pdp-4rau-share-btn zalo" onclick="window.open('https://chat.zalo.me/', '_blank')">
                    <strong>Z</strong> <span>Nhắn Zalo</span>
                  </button>
                  <button type="button" class="pdp-4rau-share-btn copy" onclick="ShopPage.copyProductLink()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    <span>Sao chép link</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. KHỐI 3 CAM KẾT CHUẨN 4RAU DƯỚI SHOWCASE (OMNI SALON) -->
            <div class="pdp-4rau-trust-bar">
              <div class="pdp-4rau-trust-card">
                <div class="pdp-4rau-trust-icon blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                </div>
                <div class="pdp-4rau-trust-text">
                  <h4>GIAO HÀNG HỎA TỐC</h4>
                  <p>Nội thành TP.HCM &amp; Hà Nội nhận trong 2H, toàn quốc 24-48H</p>
                </div>
              </div>

              <div class="pdp-4rau-trust-card">
                <div class="pdp-4rau-trust-icon green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 12 20 22 4 22 4 12"></polyline>
                    <rect x="2" y="7" width="20" height="5"></rect>
                    <line x1="12" y1="22" x2="12" y2="7"></line>
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                  </svg>
                </div>
                <div class="pdp-4rau-trust-text">
                  <h4>QUÀ TẶNG &amp; DỊCH VỤ SALON</h4>
                  <p>Tặng kèm voucher 20% &amp; dịch vụ tư vấn tạo kiểu tại Omni Salon</p>
                </div>
              </div>

              <div class="pdp-4rau-trust-card">
                <div class="pdp-4rau-trust-icon gold">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div class="pdp-4rau-trust-text">
                  <h4>100% CHÍNH HÃNG OMNI SALON</h4>
                  <p>Hoàn tiền 200% nếu phát hiện hàng giả, đổi mới trong 7 ngày</p>
                </div>
              </div>
            </div>


            <!-- 3. SECTION TABS CHI TIẾT (FULL WIDTH CONTAINER) -->
            <div class="pdp-tabs-wrapper">
              <div class="pdp-tab-nav">
                <button type="button" class="pdp-tab-btn active" onclick="ShopPage.switchDetailTab('tabDesc', this)">
                  Mô Tả &amp; Công Dụng Chi Tiết
                </button>
                <button type="button" class="pdp-tab-btn" onclick="ShopPage.switchDetailTab('tabUsage', this)">
                  Hướng Dẫn Sử Dụng Chuẩn Salon
                </button>
                <button type="button" class="pdp-tab-btn" onclick="ShopPage.switchDetailTab('tabIngredients', this)">
                  Thành Phần &amp; Độ An Toàn
                </button>
                <button type="button" class="pdp-tab-btn" onclick="ShopPage.switchDetailTab('tabReviews', this)">
                  Đánh Giá Của Khách Hàng (${prod.reviewCount || 142})
                </button>
              </div>

              <!-- Tab 1: Mô tả -->
              <div class="pdp-tab-panel active" id="tabDesc">
                <h3>Đặc Tính &amp; Hiệu Năng Vượt Trội</h3>
                <p>
                  <strong>${prod.name || prod.TenSanPham}</strong> là dòng sản phẩm tạo kiểu cao cấp được nghiên cứu và phát triển chuyên biệt dành cho các kiểu tóc hiện đại như Pompadour, Quiff, Undercut và Side Part. Công thức đột phá kết hợp giữa sáp hữu cơ tự nhiên và khoáng chất vi lượng mang đến khả năng giữ nếp bền bỉ suốt 14 đến 16 tiếng mà không gây cảm giác nặng đầu hay khô xơ.
                </p>
                <ul>
                  <li><strong>Độ giữ nếp (Extreme High Hold):</strong> Giữ phom tóc nguyên vẹn ngay cả khi đội mũ bảo hiểm hay hoạt động thể thao ngoài trời. Khả năng tái tạo kiểu (restyle) bằng tay cực kỳ linh hoạt.</li>
                  <li><strong>Hiệu ứng hoàn thiện (Matte Finish):</strong> Cung cấp độ bóng tự nhiên, chân thực, tạo cảm giác tóc dày dặn và đầy sức sống.</li>
                  <li><strong>Hương thơm độc bản:</strong> Nốt hương gỗ tuyết tùng trầm ấm kết hợp hương bạc hà Địa Trung Hải thanh mát, toát lên sự nam tính, sang trọng và cuốn hút.</li>
                  <li><strong>Khả năng làm sạch:</strong> Dễ dàng rửa trôi hoàn toàn 100% chỉ sau một lần gội đầu với nước ấm mà không để lại bất kỳ dư chất nào trên da đầu.</li>
                </ul>
              </div>

              <!-- Tab 2: Hướng dẫn -->
              <div class="pdp-tab-panel" id="tabUsage">
                <h3>Quy Trình Tạo Kiểu 4 Bước Chuẩn Master Stylist</h3>
                <p>Để đạt được độ phồng volume tối đa và giữ nếp chuẩn form salon cả ngày, các Master Barber tại Omni Salon khuyến nghị quy trình sau:</p>
                <ul>
                  <li><strong>Bước 1 (Pre-styling):</strong> Gội sạch đầu và lau khô bằng khăn. Xịt một lớp mỏng sản phẩm dưỡng tạo phồng hoặc nước muối biển, sau đó dùng máy sấy kết hợp lược bán nguyệt sấy định hình form tóc theo hướng mong muốn.</li>
                  <li><strong>Bước 2 (Lấy sáp):</strong> Dùng đầu ngón tay lấy một lượng sáp vừa đủ (khoảng nửa đốt ngón tay). Đóng nắp ngay sau khi lấy để bảo quản chất lượng sáp.</li>
                  <li><strong>Bước 3 (Làm tan sáp):</strong> Đặt sáp vào lòng bàn tay và xoa đều theo chuyển động tròn cho đến khi chất sáp tan mịn và ấm lên hoàn toàn.</li>
                  <li><strong>Bước 4 (Định hình):</strong> Luồn các ngón tay vuốt sáp từ phần chân tóc lên ngọn tóc để đảm bảo sáp bám đều khắp các sợi tóc. Dùng ngón tay hoặc lược thưa để tinh chỉnh các tép tóc (texture) hoàn hảo nhất.</li>
                </ul>
              </div>

              <!-- Tab 3: Thành phần -->
              <div class="pdp-tab-panel" id="tabIngredients">
                <h3>Bảng Thành Phần Hữu Cơ &amp; Dưỡng Chất Thiết Yếu</h3>
                <p>Tất cả sản phẩm phân phối tại Omni Salon đều đáp ứng tiêu chuẩn kiểm định nghiêm ngặt của Bộ Y Tế, 100% thành phần lành tính không gây kích ứng:</p>
                <ul>
                  <li><strong>Carnauba Wax (Sáp cọ Carnauba Brazil):</strong> Thành phần sáp tự nhiên quý giá giúp tạo cấu trúc giữ nếp dẻo dai mà không làm khô cứng sợi tóc.</li>
                  <li><strong>Jojoba Seed Oil (Tinh dầu Jojoba tự nhiên):</strong> Nuôi dưỡng nang tóc sâu từ bên trong, kiểm soát độ ẩm và ngăn ngừa gàu ngứa hiệu quả.</li>
                  <li><strong>Chiết xuất mầm lúa mạch &amp; Vitamin E:</strong> Tăng cường liên kết keratin, bảo vệ tóc khỏi tác hại của nhiệt độ máy sấy và tia UV từ ánh nắng mặt trời.</li>
                  <li><strong>Cam kết an toàn:</strong> Không chứa Paraben, không Sulfate (SLS/SLES), không Silicone gây bít tắc nang lông và hoàn toàn không thí nghiệm trên động vật (Cruelty-Free).</li>
                </ul>
              </div>

              <!-- Tab 4: Đánh giá -->
              <div class="pdp-tab-panel" id="tabReviews">
                <div class="pdp-reviews-summary">
                  <div class="pdp-reviews-score">
                    <div class="pdp-reviews-big-num">4.9</div>
                    <div style="color: #F59E0B; font-size: 18px; margin-bottom: 4px;">★★★★★</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">Dựa trên 142 đánh giá xác thực</div>
                  </div>
                  <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
                      <span style="width: 50px;">5 sao</span>
                      <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                        <div style="width: 92%; height: 100%; background: #F59E0B; border-radius: 4px;"></div>
                      </div>
                      <span style="width: 35px; text-align: right; color: var(--text-secondary);">92%</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
                      <span style="width: 50px;">4 sao</span>
                      <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                        <div style="width: 6%; height: 100%; background: #F59E0B; border-radius: 4px;"></div>
                      </div>
                      <span style="width: 35px; text-align: right; color: var(--text-secondary);">6%</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
                      <span style="width: 50px;">3 sao</span>
                      <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                        <div style="width: 2%; height: 100%; background: #F59E0B; border-radius: 4px;"></div>
                      </div>
                      <span style="width: 35px; text-align: right; color: var(--text-secondary);">2%</span>
                    </div>
                  </div>
                </div>

                <div class="pdp-reviews-list">
                  <div class="pdp-review-item">
                    <div class="pdp-review-user">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" alt="avatar" class="pdp-review-avatar">
                      <div class="pdp-review-meta">
                        <h4>Nguyễn Hoàng Long <span class="pdp-verified-badge">✓ Đã Mua Hàng</span></h4>
                        <div class="pdp-review-date">Đánh giá ngày 12/10/2026 • Chi nhánh Quận 1</div>
                      </div>
                    </div>
                    <div style="color: #F59E0B; font-size: 14px; margin-bottom: 8px;">★★★★★</div>
                    <p class="pdp-review-comment">Sáp giữ nếp cực tốt, mình đi xe máy đội mũ bảo hiểm 40 phút mà bỏ mũ ra chỉ cần vuốt lại vài đường là tóc vào form y như cũ. Mùi hương gỗ tuyết tùng rất sang trọng, bạn gái mình khen suốt. Đóng gói của Omni Salon cẩn thận có tem chính hãng!</p>
                  </div>

                  <div class="pdp-review-item">
                    <div class="pdp-review-user">
                      <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80" alt="avatar" class="pdp-review-avatar">
                      <div class="pdp-review-meta">
                        <h4>Trần Minh Quân <span class="pdp-verified-badge">✓ Đã Mua Hàng</span></h4>
                        <div class="pdp-review-date">Đánh giá ngày 08/10/2026 • Giao hàng hỏa tốc 2h</div>
                      </div>
                    </div>
                    <div style="color: #F59E0B; font-size: 14px; margin-bottom: 8px;">★★★★★</div>
                    <p class="pdp-review-comment">Chất sáp mềm tan trong tay rất nhanh, không bị bết rít. Gội đầu cực kỳ dễ sạch, xả nước ấm là trôi hết không cần gội đi gội lại 2 lần. Xứng đáng với mức giá cao cấp!</p>
                  </div>

                  <div class="pdp-review-item">
                    <div class="pdp-review-user">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="avatar" class="pdp-review-avatar">
                      <div class="pdp-review-meta">
                        <h4>Lê Duy Khang <span class="pdp-verified-badge">✓ Đã Mua Hàng</span></h4>
                        <div class="pdp-review-date">Đánh giá ngày 02/10/2026 • Chi nhánh Cầu Giấy</div>
                      </div>
                    </div>
                    <div style="color: #F59E0B; font-size: 14px; margin-bottom: 8px;">★★★★★</div>
                    <p class="pdp-review-comment">Được thợ tại salon tư vấn dùng hũ này sau khi uốn tóc layer. Tóc có độ tơi texture rõ rệt, không bị bóng loáng giả tạo. Sẽ ủng hộ Omni Salon dài dài!</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. SECTION SẢN PHẨM KHUYÊN DÙNG (RELATED PRODUCTS GRID 4 CỘT) -->
            <div class="pdp-related-section">
              <div class="pdp-section-header">
                <div class="pdp-section-title-wrap">
                  <h2>SẢN PHẨM KHUYÊN DÙNG CÙNG BỘ SƯU TẬP</h2>
                  <p>Combo chăm sóc &amp; tạo kiểu hoàn hảo chuẩn phong cách Salon Master</p>
                </div>
                <button type="button" class="pdp-back-btn" onclick="CustomerWeb.switchTab('shop')">
                  Xem Tất Cả Mỹ Phẩm →
                </button>
              </div>

              <div class="pdp-related-grid">
                ${relatedProducts.map(rel => {
                  const relPrice = Number(rel.GiaBanThucTe || rel.price || 0);
                  const relImg = rel.image || rel.HinhAnh || 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg';
                  return `
                    <div class="pdp-related-card" onclick="if(window.AppRouter) window.AppRouter.navigate('/product?id=${rel.id}');">
                      <div class="pdp-related-img-wrap">
                        <img src="${SalonUtils.formatImageUrl(relImg)}" alt="${rel.name || rel.TenSanPham}" class="pdp-related-img" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : null">
                      </div>
                      <div class="pdp-related-info">
                        <div class="pdp-related-brand">${rel.brand || 'OMNI SALON'}</div>
                        <div class="pdp-related-title" title="${rel.name || rel.TenSanPham}">${rel.name || rel.TenSanPham}</div>
                        <div class="pdp-related-price-row">
                          <span class="pdp-related-price">${SalonUtils.formatCurrency(relPrice)}</span>
                        </div>
                        <div class="pdp-related-btns" onclick="event.stopPropagation();">
                          <button type="button" class="pdp-related-view-btn" onclick="if(window.AppRouter) window.AppRouter.navigate('/product?id=${rel.id}');">
                            Xem Chi Tiết
                          </button>
                          <button type="button" class="pdp-related-add-btn" onclick="ShopPage.handleDetailAddToCart('${rel.id}')" title="Thêm vào giỏ">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                              <line x1="3" y1="6" x2="21" y2="6"></line>
                              <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

          </div>

          <!-- 5. CHÂN TRANG FOOTER DOANH NGHIỆP HOÀN CHỈNH -->
          <footer class="web-footer">
            <div class="footer-inner">
              <div class="footer-col-brand">
                <div class="footer-logo-OMNI" style="font-size: 26px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.02em;">Omni Salon</div>
                <div style="font-size: 13px; color: #94A3B8; margin-top: 8px;">The Art of Modern Hair Care &amp; Grooming</div>
              </div>

              <div class="footer-col-info">
                <h4 class="footer-col-title">THÔNG TIN DOANH NGHIỆP</h4>
                <ul class="footer-info-list">
                  <li><strong>CÔNG TY TNHH OMNI SALON ENTERPRISE</strong></li>
                  <li>MST: 0315048848</li>
                  <li>Địa chỉ HQ: 634 Điện Biên Phủ, Phường Vườn Lài, TP. Hồ Chí Minh</li>
                  <li>Hotline: <strong style="color: #D4AF37;">1900 8899</strong></li>
                  <li>Email: contact@omnisalon.vn</li>
                  <li>Website: omnisalon.vn</li>
                </ul>
              </div>

              <div class="footer-col-policy">
                <h4 class="footer-col-title">CHÍNH SÁCH HỆ THỐNG</h4>
                <ul class="footer-policy-list">
                  <li>› Về Omni Salon</li>
                  <li>› Hướng dẫn Đặt lịch trực tuyến</li>
                  <li>› Điều kiện giao dịch chung</li>
                  <li>› Chính sách bảo mật thông tin khách hàng</li>
                  <li>› Cam kết bảo hành 7 ngày &amp; Chất lượng tạo mẫu 5 sao</li>
                  <li>› Chính sách mua hàng và thanh toán VietQR</li>
                  <li>› Chính sách đổi trả và hoàn tiền sản phẩm</li>
                  <li>› Tuyển dụng Master Stylist &amp; Quản lý Salon</li>
                </ul>
              </div>
            </div>
            <div class="footer-bottom-bar">
              © 2026 Omni Salon. The Art of Modern Hair Care &amp; Grooming. All rights reserved.
            </div>
          </footer>
        </div>
      `;

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    switchDetailTab(tabId, btnEl) {
      document.querySelectorAll('.pdp-tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.pdp-tab-panel').forEach(panel => panel.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      const targetPanel = document.getElementById(tabId);
      if (targetPanel) targetPanel.classList.add('active');
    },

    switchDetailImage(imgUrl, thumbEl, idx) {
      const mainImg = document.getElementById('pdpMainImg');
      if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = SalonUtils.formatImageUrl(imgUrl);
          if (idx === 0 || imgUrl.includes('Men_Grooming_Products') || !imgUrl.includes('unsplash')) {
            mainImg.style.mixBlendMode = 'multiply';
          } else {
            mainImg.style.mixBlendMode = 'normal';
          }
          mainImg.style.opacity = '1';
        }, 150);
      }
      document.querySelectorAll('.pdp-thumb-item').forEach(el => el.classList.remove('active'));
      if (thumbEl) thumbEl.classList.add('active');
      document.querySelectorAll('.pdp-dot, .pdp-dot-4rau').forEach(el => el.classList.remove('active'));
      const activeDot = document.getElementById(`pdpDot_${idx}`);
      if (activeDot) activeDot.classList.add('active');
      const counter = document.getElementById('pdpImgCounter');
      if (counter) {
        const total = document.querySelectorAll('.pdp-thumb-item').length || 4;
        counter.textContent = `${idx + 1}/${total}`;
      }
    },

    selectVariant(btnEl, variantVal) {
      document.querySelectorAll('.pdp-variant-btn, .pdp-4rau-chip').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
    },

    changeDetailQty(delta) {
      const input = document.getElementById('pdpDetailQtyInput');
      if (!input) return;
      let val = parseInt(input.value, 10) || 1;
      val = Math.max(1, Math.min(99, val + delta));
      input.value = val;
    },

    handleDetailAddToCart(productId) {
      const input = document.getElementById('pdpDetailQtyInput');
      const qty = input ? (parseInt(input.value, 10) || 1) : 1;
      if (window.UICommon && typeof window.UICommon.addToCart === 'function') {
        window.UICommon.addToCart(productId, 'product', qty);
      }
      this.updateCartBadge();
    },

    handleDetailBuyNow(productId) {
      const input = document.getElementById('pdpDetailQtyInput');
      const qty = input ? (parseInt(input.value, 10) || 1) : 1;
      if (window.UICommon && typeof window.UICommon.addToCart === 'function') {
        window.UICommon.addToCart(productId, 'product', qty);
        window.UICommon.openCartDrawer();
      }
    },

    toggleWishlist(productId, btnEl) {
      if (btnEl) {
        btnEl.classList.toggle('active');
        const isActive = btnEl.classList.contains('active');
        if (window.UICommon) {
          window.UICommon.showToast(isActive ? 'Đã thêm vào danh sách yêu thích!' : 'Đã bỏ yêu thích.');
        }
      }
    },

    copyProductLink() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href);
      }
      if (window.UICommon) {
        window.UICommon.showToast('Đã sao chép liên kết sản phẩm vào bộ nhớ tạm!');
      }
    }
  };

  window.ShopPage = ShopPage;
  window.ProductDetailPage = {
    render(container, params = {}) {
      const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
      let prodId = params?.id || (window.AppRouter && window.AppRouter.queryParams && window.AppRouter.queryParams.id) || (urlParams && urlParams.get('id')) || 'SP02';
      if (prodId === 'SP_TOTE') {
        prodId = 'SP02';
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
          window.history.replaceState(null, '', '/product?id=SP02');
        }
      }
      ShopPage.renderProductDetail(container, prodId);
    }
  };

  // Tự động lắng nghe và cập nhật danh mục sản phẩm khi CSDL SQL tải xong
  if (typeof window !== 'undefined') {
    const attachShopSync = () => {
      if (window.store && typeof window.store.subscribe === 'function') {
        window.store.subscribe((state, event) => {
          if (event === 'LIVE_SERVER_SYNC' || event === 'STATE_CHANGE') {
            const container = document.getElementById('webMainContainer');
            if (container && window.AppRouter && window.AppRouter.currentRoute === '/shop') {
              ShopPage.render(container);
            }
          }
        });
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachShopSync);
    } else {
      attachShopSync();
    }
  }

})(window);

