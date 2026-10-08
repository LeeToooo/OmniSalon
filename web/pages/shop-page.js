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

      const catIconMap = {
        'DM01': '💈',
        'DM02': '✨',
        'DM03': '💨',
        'DM04': '🧴',
        'DM05': '🧼',
        'DM06': '🌾',
        'DM07': '🧪',
        'DM08': '🧔',
        'DM09': '✂️'
      };

      const filtered = this.getFilteredProducts();

      container.innerHTML = `
        <div class="shop-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 40px 0 80px;">
          <div style="max-width: 1240px; margin: 0 auto; padding: 0 20px;">
            <!-- Header Banner -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 20px;">
              <div>
                <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; background: var(--brand-accent-subtle); border: 1px solid var(--brand-accent-border); color: var(--brand-accent); font-size: 13px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">
                  <span>🧴</span> MỸ PHẨM TÓC CHÍNH HÃNG 100% • OMNI SALON
                </div>
                <h1 style="font-size: clamp(28px, 4vw, 40px); font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; margin: 0 0 8px;">
                  Mỹ Phẩm &amp; Dược Liệu Tóc Cao Cấp
                </h1>
                <p style="font-size: 15px; color: var(--text-secondary); max-width: 680px; line-height: 1.6; margin: 0;">
                  Các dòng sản phẩm chăm sóc tóc chuyên nghiệp: Sáp vuốt tóc, Pomade, Gôm xịt giữ nếp, Dầu gội xả phục hồi, Dưỡng râu và Dụng cụ tạo kiểu.
                </p>
              </div>

              <!-- Nút mở giỏ hàng -->
              <button onclick="UICommon && UICommon.openCartDrawer ? UICommon.openCartDrawer() : null"
                      style="height: 48px; padding: 0 22px; border-radius: 12px; background: var(--brand-accent); border: none; color: #ffffff; font-size: 15px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(180,131,18,0.3);">
                🛒 Mở Giỏ Hàng (<span id="shopCartCounter">0</span>)
              </button>
            </div>

            <!-- BẢNG TÌM KIẾM & BỘ LỌC DANH MỤC -->
            <div style="background: var(--surface-card); border-radius: 20px; border: 1px solid var(--border-color); padding: 24px; margin-bottom: 32px; box-shadow: 0 4px 18px rgba(0,0,0,0.03);">
              <div style="display: flex; flex-direction: column; gap: 18px;">
                <!-- Ô Tìm Kiếm -->
                <div style="position: relative;">
                  <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 16px; color: var(--text-secondary);">🔍</span>
                  <input type="text" id="shopSearchInput"
                         style="width: 100%; height: 48px; padding-left: 44px; padding-right: 16px; font-size: 14px; font-weight: 600; background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--input-border); border-radius: 12px; outline: none; box-sizing: border-box;"
                         placeholder="Tìm kiếm theo tên sản phẩm, thương hiệu hoặc công dụng..."
                         value="${this.searchQuery}"
                         oninput="ShopPage.handleSearch(this.value)">
                </div>

                <!-- Lọc Theo Danh Mục (Flash Sale bảo mật) -->
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span style="font-size: 12px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase;">DANH MỤC:</span>
                  <button class="nordic-pill-tab ${this.selectedCategory === 'all' ? 'active' : ''}" onclick="ShopPage.setCategory('all')"
                          style="padding: 8px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${this.selectedCategory === 'all' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.selectedCategory === 'all' ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${this.selectedCategory === 'all' ? '#ffffff' : 'var(--text-primary)'};">
                    Tất Cả
                  </button>
                  <button class="nordic-pill-tab ${this.selectedCategory === 'fefo_expiry' ? 'active' : ''}" onclick="ShopPage.setCategory('fefo_expiry')"
                          style="padding: 8px 16px; border-radius: 9999px; font-size: 13px; font-weight: 800; cursor: pointer; border: 1.5px solid #dc2626; background: ${this.selectedCategory === 'fefo_expiry' ? '#dc2626' : 'rgba(220, 38, 38, 0.15)'}; color: ${this.selectedCategory === 'fefo_expiry' ? '#ffffff' : '#dc2626'};">
                    ⚡ Ưu Đãi Flash Sale (Giảm 20% - 70%)
                  </button>
                  ${categories.map(c => `
                    <button class="nordic-pill-tab ${this.selectedCategory === c.id ? 'active' : ''}" onclick="ShopPage.setCategory('${c.id}')"
                            style="padding: 8px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${this.selectedCategory === c.id ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.selectedCategory === c.id ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${this.selectedCategory === c.id ? '#ffffff' : 'var(--text-primary)'};">
                      ${catIconMap[c.id] || (c.icon && !c.icon.includes('icon') ? c.icon : '💈')} ${(c.TenDanhMuc || c.name || '').split(' - ')[0]}
                    </button>
                  `).join('')}
                </div>

                <!-- Lọc Theo Thương Hiệu -->
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span style="font-size: 12px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase;">THƯƠNG HIỆU:</span>
                  ${['all', 'apestomen', 'hanz de fuko', 'blumaan', 'kevin murphy', 'reuzel', 'olaplex', 'davines'].map(br => `
                    <button onclick="ShopPage.setBrand('${br}')"
                            style="padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid ${this.selectedBrand === br ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.selectedBrand === br ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.selectedBrand === br ? '#ffffff' : 'var(--text-secondary)'}; text-transform: capitalize;">
                      ${br === 'all' ? 'Tất Cả' : br}
                    </button>
                  `).join('')}
                </div>

                <!-- Lọc Theo Khoảng Giá -->
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span style="font-size: 12px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase;">MỨC GIÁ:</span>
                  <button onclick="ShopPage.setPrice('all')" style="padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid ${this.selectedPriceRange === 'all' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.selectedPriceRange === 'all' ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.selectedPriceRange === 'all' ? '#ffffff' : 'var(--text-secondary)'};">
                    Tất Cả Mức Giá
                  </button>
                  <button onclick="ShopPage.setPrice('under300')" style="padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid ${this.selectedPriceRange === 'under300' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.selectedPriceRange === 'under300' ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.selectedPriceRange === 'under300' ? '#ffffff' : 'var(--text-secondary)'};">
                    Dưới 300.000 đ
                  </button>
                  <button onclick="ShopPage.setPrice('300to500')" style="padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid ${this.selectedPriceRange === '300to500' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.selectedPriceRange === '300to500' ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.selectedPriceRange === '300to500' ? '#ffffff' : 'var(--text-secondary)'};">
                    300.000 đ – 500.000 đ
                  </button>
                  <button onclick="ShopPage.setPrice('above500')" style="padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid ${this.selectedPriceRange === 'above500' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.selectedPriceRange === 'above500' ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.selectedPriceRange === 'above500' ? '#ffffff' : 'var(--text-secondary)'};">
                    Trên 500.000 đ
                  </button>
                </div>
              </div>
            </div>

            <!-- LƯỚI SẢN PHẨM (12 SẢN PHẨM / TRANG) -->
            <div id="shopCatalogGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 24px;">
              ${this.renderProducts(filtered)}
            </div>

            <!-- PHÂN TRANG (MŨI TÊN CHUYỂN TRANG) -->
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

    renderProducts(filtered) {
      if (!filtered) filtered = this.getFilteredProducts();

      if (filtered.length === 0) {
        return `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--surface-card); border-radius: 20px; border: 1px solid var(--border-color);">
            <div style="font-size: 40px; margin-bottom: 12px;">🧴</div>
            <h3 style="color: var(--text-primary); font-size: 18px; margin-bottom: 6px;">Không tìm thấy sản phẩm phù hợp</h3>
            <p style="color: var(--text-secondary); font-size: 14px;">Quý khách vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
          </div>
        `;
      }

      // Phân trang 12 sản phẩm mỗi trang
      const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (this.currentPage > totalPages) this.currentPage = 1;
      const startIdx = (this.currentPage - 1) * this.pageSize;
      const paginated = filtered.slice(startIdx, startIdx + this.pageSize);

      return paginated.map(p => {
        const actualPrice = p.GiaBanThucTe || p.price;
        const originalPrice = p.originalPrice || p.GiaNiemYetGoc || p.GiaBan;
        const price = SalonUtils.formatCurrency(actualPrice);
        const rating = (p.rating || 4.9).toFixed(1);
        const rawImg = p.image || p.HinhAnh || '';
        const thumb = SalonUtils.formatImageUrl(rawImg);

        // CHỈ HIỂN THỊ FLASH SALE CHO KHÁCH HÀNG (ẨN HẠN DÙNG)
        const discountPercent = p.PhanTramGiam || (originalPrice > actualPrice ? Math.round((originalPrice - actualPrice) / originalPrice * 100) : 0);
        const flashSaleBadge = discountPercent > 0 ? `
          <span style="position: absolute; top: 10px; right: 10px; background: #dc2626; color: #ffffff; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.35); z-index: 2;">
            ⚡ Flash Sale -${discountPercent}%
          </span>
        ` : '';

        const priceDisplay = (originalPrice && originalPrice > actualPrice) ? `
          <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 20px; font-weight: 900; color: var(--brand-accent);">${price}</span>
            <span style="font-size: 13px; text-decoration: line-through; color: var(--text-secondary);">${SalonUtils.formatCurrency(originalPrice)}</span>
          </div>
        ` : `
          <div style="font-size: 20px; font-weight: 900; color: var(--brand-accent); margin-bottom: 12px;">${price}</div>
        `;

        // Làm sạch mô tả không cho lộ thông tin lô hàng cận hạn
        const cleanDesc = (p.description || p.MoTa || 'Dòng sản phẩm chăm sóc tóc nam chính hãng nhập khẩu, nuôi dưỡng và giữ nếp 24h.')
          .replace(/\(Lô.*?cận hạn.*?\)/gi, '')
          .replace(/Lô CTPN\d+/gi, '')
          .trim();

        return `
          <div class="product-nordic-card" id="productCard_${p.id}"
               style="padding: 20px; background: var(--surface-card); border-radius: 20px; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-shadow: 0 4px 18px rgba(0,0,0,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease;">
            <div>
              <div style="position: relative; border-radius: 14px; overflow: hidden; margin-bottom: 14px; background: var(--surface-elevated);">
                <img src="${thumb}" style="width: 100%; aspect-ratio: 1; object-fit: cover; display: block;" alt="${p.name || p.TenSanPham}" loading="lazy" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');">
                <span style="position: absolute; top: 10px; left: 10px; background: var(--surface-card); color: var(--brand-accent); font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; border: 1px solid var(--border-color);">
                  ${p.brand || 'CHÍNH HÃNG'}
                </span>
                ${flashSaleBadge}
                <span style="position: absolute; bottom: 10px; right: 10px; background: var(--surface-card); color: var(--text-primary); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                  ★ ${rating}
                </span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 44px;">
                ${p.name || p.TenSanPham}
              </h3>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 40px;">
                ${cleanDesc}
              </p>
            </div>

            <div style="margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 12px;">
              ${priceDisplay}
              <div style="display: flex; gap: 8px;">
                <button style="flex: 1; height: 42px; font-size: 13px; font-weight: 700; border-radius: 10px; background: var(--brand-accent); border: none; color: #ffffff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(180,131,18,0.25);"
                        onclick="UICommon.addToCart('${p.id}', 'product'); ShopPage.updateCartBadge();">
                  🛒 Thêm Giỏ
                </button>
                <button style="height: 42px; padding: 0 14px; font-size: 13px; font-weight: 700; border-radius: 10px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;"
                        onclick="UICommon.addToCart('${p.id}', 'product'); UICommon.openCartDrawer(); ShopPage.updateCartBadge();">
                  Mua Ngay
                </button>
              </div>
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

