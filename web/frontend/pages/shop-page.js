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
                <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 6px; background: var(--brand-accent-subtle); border: 1px solid var(--brand-accent-border); color: var(--brand-accent); font-size: 12px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 10px;">
                  MỸ PHẨM CHÍNH HÃNG 100% • OMNI SALON
                </div>
                <h1 style="font-size: clamp(26px, 3.5vw, 36px); font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; margin: 0 0 8px;">
                  Mỹ Phẩm &amp; Dược Liệu Tóc Cao Cấp
                </h1>
                <p style="font-size: 14.5px; color: var(--text-secondary); max-width: 680px; line-height: 1.6; margin: 0;">
                  Các dòng sản phẩm chăm sóc tóc chuyên nghiệp: Sáp vuốt tóc, Pomade, Gôm xịt giữ nếp, Dầu gội xả phục hồi, Dưỡng râu và Dụng cụ tạo kiểu.
                </p>
              </div>

              <!-- Nút mở giỏ hàng (Flat CTA) -->
              <button class="btn-flat-cta btn-flat-primary"
                      style="height: 44px; padding: 0 20px; font-size: 14px;"
                      onclick="UICommon && UICommon.openCartDrawer ? UICommon.openCartDrawer() : null">
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
    }
  };

  window.ShopPage = ShopPage;

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

