// Trang cửa hàng sản phẩm
(function (window) {
  'use strict';

  const ShopPage = {
    selectedCategory: 'all',
    selectedBrand: 'all',
    selectedPriceRange: 'all',
    searchQuery: '',
    currentPage: 1,
    pageSize: 15,

    toggleDropdown(id, e) {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      const targetMenu = document.getElementById(id);
      const targetBtn = document.getElementById(id + 'Btn');
      const isCurrentlyOpen = targetMenu && targetMenu.classList.contains('show');

      this.closeAllDropdowns();

      if (!isCurrentlyOpen && targetMenu && targetBtn) {
        targetMenu.classList.add('show');
        targetBtn.classList.add('active');
      }
    },

    closeAllDropdowns() {
      document.querySelectorAll('.shop-dropdown-menu.show').forEach(el => el.classList.remove('show'));
      document.querySelectorAll('.shop-dropdown-btn.active').forEach(el => el.classList.remove('active'));
    },

    // Hàm loại bỏ ký tự nguy hiểm tránh lỗi hiển thị xss
    escapeHtml(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

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

      // Xác định nhãn hiển thị cho 3 Dropdown
      let activeCatLabel = 'Tất Cả';
      if (this.selectedCategory === 'fefo_expiry') {
        activeCatLabel = 'Ưu Đãi Đặc Biệt';
      } else if (this.selectedCategory === 'bestsellers') {
        activeCatLabel = 'Bán Chạy Nhất';
      } else if (this.selectedCategory !== 'all') {
        const matchCat = categories.find(c => c.id === this.selectedCategory || c.MaDanhMuc === this.selectedCategory);
        if (matchCat) {
          activeCatLabel = (matchCat.TenDanhMuc || matchCat.name || '').split(' - ')[0];
        }
      }

      const brands = [
        { id: 'all', label: 'Tất Cả Thương Hiệu' },
        { id: 'apestomen', label: 'Apestomen' },
        { id: 'hanz de fuko', label: 'Hanz De Fuko' },
        { id: 'blumaan', label: 'Blumaan' },
        { id: 'kevin murphy', label: 'Kevin Murphy' },
        { id: 'reuzel', label: 'Reuzel' },
        { id: 'davines', label: 'Davines' }
      ];
      let activeBrandLabel = 'Tất Cả';
      const matchBrand = brands.find(b => b.id === this.selectedBrand);
      if (matchBrand && matchBrand.id !== 'all') {
        activeBrandLabel = matchBrand.label;
      }

      const prices = [
        { id: 'all', label: 'Tất Cả Mức Giá' },
        { id: 'under300', label: 'Dưới 300K' },
        { id: '300to500', label: '300K - 500K' },
        { id: 'above500', label: 'Trên 500K' }
      ];
      let activePriceLabel = 'Tất Cả';
      const matchPrice = prices.find(p => p.id === this.selectedPriceRange);
      if (matchPrice && matchPrice.id !== 'all') {
        activePriceLabel = matchPrice.label;
      }

      const hasActiveFilter = (this.selectedCategory !== 'all' || this.selectedBrand !== 'all' || this.selectedPriceRange !== 'all' || Boolean(this.searchQuery));
      let activeFilterSummary = '';
      if (this.searchQuery) {
        activeFilterSummary += 'Từ khóa: "' + this.searchQuery + '" ';
      }
      if (this.selectedCategory !== 'all') {
        activeFilterSummary += (activeFilterSummary ? ' • ' : '') + 'Danh mục: ' + activeCatLabel;
      }
      if (this.selectedBrand !== 'all') {
        activeFilterSummary += (activeFilterSummary ? ' • ' : '') + 'Thương hiệu: ' + activeBrandLabel;
      }
      if (this.selectedPriceRange !== 'all') {
        activeFilterSummary += (activeFilterSummary ? ' • ' : '') + 'Mức giá: ' + activePriceLabel;
      }
      const allActiveProducts = this.getAllActiveProducts();

      container.innerHTML = `
        <div class="shop-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 48px 0 88px;">
          <div class="shop-fluid-container">
            <!-- Header Banner (Editorial Visual Hierarchy) -->
            <div style="margin-bottom: 32px;">
              <span class="tracking-widest" style="font-size: 11.5px; font-weight: 700; color: #C59B27; text-transform: uppercase; margin-bottom: 8px; display: inline-block;">
                BỘ SƯU TẬP CHĂM SÓC TÓC NAM GIỚI
              </span>
              <h1 class="font-serif tracking-tight leading-tight" style="font-size: clamp(30px, 4vw, 42px); font-weight: 700; color: var(--text-primary); margin: 0 0 10px;">
                Sản Phẩm Grooming &amp; Pomade Chính Hãng
              </h1>
              <p style="font-size: 15px; color: var(--text-secondary); max-width: 680px; line-height: 1.6; margin: 0;">
                Các dòng sản phẩm tạo kiểu và dưỡng tóc chuyên dụng: Sáp vuốt tóc, Pomade gốc dầu và nước, Gôm xịt khóa nếp, Dầu gội phục hồi và Dưỡng râu.
              </p>
            </div>

            <!-- BẢNG TÌM KIẾM & BỘ LỌC BUTTON DROPDOWN EDITORIAL -->
            <div class="shop-filter-bar">
              <!-- Ô Tìm Kiếm -->
              <div style="position: relative;">
                <input type="text" id="shopSearchInput"
                       style="width: 100%; height: 44px; padding-left: 16px; padding-right: 16px; font-size: 14px; font-weight: 500; background: var(--surface-elevated); color: var(--text-primary); border: 1.5px solid var(--border-color); border-radius: 8px; outline: none; box-sizing: border-box; transition: border-color 0.15s ease;"
                       placeholder="Tìm kiếm theo tên sáp, pomade, thương hiệu hoặc công dụng..."
                       value="${this.searchQuery}"
                       oninput="ShopPage.handleSearch(this.value)">
              </div>

              <!-- Hàng Dropdown Lọc: Danh Mục, Thương Hiệu, Mức Giá -->
              <div class="shop-filter-row">
                <!-- Dropdown Danh Mục -->
                <div class="shop-dropdown-wrap">
                  <button type="button" id="shopCatDropdownBtn" class="shop-dropdown-btn ${this.selectedCategory !== 'all' ? 'active' : ''}" onclick="ShopPage.toggleDropdown('shopCatDropdown', event)">
                    <span style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">DANH MỤC:</span>
                    <span>${activeCatLabel}</span>
                    <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  <div id="shopCatDropdown" class="shop-dropdown-menu">
                    <div class="shop-dropdown-item ${this.selectedCategory === 'all' ? 'selected' : ''}" onclick="ShopPage.setCategory('all')">
                      <span>Tất Cả Danh Mục</span>
                      ${this.selectedCategory === 'all' ? '<span style="color:#C59B27; font-weight:800;">✓</span>' : ''}
                    </div>
                    <div class="shop-dropdown-item ${this.selectedCategory === 'fefo_expiry' ? 'selected' : ''}" onclick="ShopPage.setCategory('fefo_expiry')" style="color: #ef4444;">
                      <span>🔥 Ưu Đãi Đặc Biệt</span>
                      ${this.selectedCategory === 'fefo_expiry' ? '<span style="color:#ef4444; font-weight:800;">✓</span>' : ''}
                    </div>
                    <div class="shop-dropdown-item ${this.selectedCategory === 'bestsellers' ? 'selected' : ''}" onclick="ShopPage.setCategory('bestsellers')" style="color: #f59e0b;">
                      <span>⭐ Sản Phẩm Bán Chạy Nhất</span>
                      ${this.selectedCategory === 'bestsellers' ? '<span style="color:#f59e0b; font-weight:800;">✓</span>' : ''}
                    </div>
                    ${categories.map(c => {
        const cId = c.id || c.MaDanhMuc;
        const cName = (c.TenDanhMuc || c.name || '').split(' - ')[0];
        const isSel = this.selectedCategory === cId;
        return `
                        <div class="shop-dropdown-item ${isSel ? 'selected' : ''}" onclick="ShopPage.setCategory('${cId}')">
                          <span>${cName}</span>
                          ${isSel ? '<span style="color:#C59B27; font-weight:800;">✓</span>' : ''}
                        </div>
                      `;
      }).join('')}
                  </div>
                </div>

                <!-- Dropdown Thương Hiệu -->
                <div class="shop-dropdown-wrap">
                  <button type="button" id="shopBrandDropdownBtn" class="shop-dropdown-btn ${this.selectedBrand !== 'all' ? 'active' : ''}" onclick="ShopPage.toggleDropdown('shopBrandDropdown', event)">
                    <span style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">THƯƠNG HIỆU:</span>
                    <span>${activeBrandLabel}</span>
                    <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  <div id="shopBrandDropdown" class="shop-dropdown-menu">
                    ${brands.map(b => {
        const isSel = this.selectedBrand === b.id;
        return `
                        <div class="shop-dropdown-item ${isSel ? 'selected' : ''}" onclick="ShopPage.setBrand('${b.id}')">
                          <span>${b.label}</span>
                          ${isSel ? '<span style="color:#C59B27; font-weight:800;">✓</span>' : ''}
                        </div>
                      `;
      }).join('')}
                  </div>
                </div>

                <!-- Dropdown Mức Giá -->
                <div class="shop-dropdown-wrap">
                  <button type="button" id="shopPriceDropdownBtn" class="shop-dropdown-btn ${this.selectedPriceRange !== 'all' ? 'active' : ''}" onclick="ShopPage.toggleDropdown('shopPriceDropdown', event)">
                    <span style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">MỨC GIÁ:</span>
                    <span>${activePriceLabel}</span>
                    <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  <div id="shopPriceDropdown" class="shop-dropdown-menu">
                    ${prices.map(p => {
        const isSel = this.selectedPriceRange === p.id;
        return `
                        <div class="shop-dropdown-item ${isSel ? 'selected' : ''}" onclick="ShopPage.setPrice('${p.id}')">
                          <span>${p.label}</span>
                          ${isSel ? '<span style="color:#C59B27; font-weight:800;">✓</span>' : ''}
                        </div>
                      `;
      }).join('')}
                  </div>
                </div>

                ${hasActiveFilter ? `
                  <button type="button" class="shop-reset-filter-btn" onclick="ShopPage.resetFilters()" title="Xóa tất cả bộ lọc">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Xóa Lọc</span>
                  </button>
                ` : ''}
              </div>
            </div>

            ${hasActiveFilter ? `
              <!-- CHẾ ĐỘ LỌC TÌM KIẾM THEO YÊU CẦU -->
              <div class="shop-filtered-view-wrap">
                <div class="shop-active-filter-strip">
                  <div class="active-filter-info">
                    <span class="active-filter-label">Đang hiển thị theo bộ lọc:</span>
                    <span class="active-filter-pill">${activeFilterSummary}</span>
                    <span class="active-filter-count">(${filtered.length} sản phẩm)</span>
                  </div>
                </div>

                <div id="shopCatalogGrid" class="shop-filtered-catalog-grid">
                  ${this.renderProducts(filtered)}
                </div>

                <div id="shopPaginationContainer">
                  ${this.renderPagination(filtered)}
                </div>
              </div>
            ` : `
              <!-- CHẾ ĐỘ LOOKBOOK ẢNH 1: CÁC DÒNG SẢN PHẨM & BENTO BANNERS NGHỆ THUẬT -->
              <div class="shop-lookbook-root">
                ${this.renderLookbookShowcases(allActiveProducts)}
              </div>
            `}
          </div>
        </div>
      `;

      this.updateCartBadge();
    },

    
    // -----------------------------------------------------------------------
    // HỆ THỐNG LOOKBOOK SHOWCASE & BENTO BANNERS CHUẨN ẢNH 1, 4RAU STYLE
    // -----------------------------------------------------------------------
    getAllActiveProducts() {
      let all = (window.store && typeof window.store.getProducts === 'function')
        ? window.store.getProducts()
        : [];
      if (!all || all.length === 0) {
        all = (window.INITIAL_DATA && window.INITIAL_DATA.products) ||
          (window.INITIAL_SALON_DATA && window.INITIAL_SALON_DATA.products) || [];
      }
      return all.filter(p => {
        if (p.isExpired === true) return false;
        if (p.daysRemaining !== undefined && p.daysRemaining <= 0) return false;
        return true;
      });
    },

    scrollSlider(sliderId, direction) {
      const slider = document.getElementById(sliderId);
      if (!slider) return;
      const scrollAmount = Math.max(260, slider.clientWidth * 0.75);
      slider.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    },

    renderShowcaseRow(rowId, eyebrow, title, viewAllAction, products) {
      if (!products || products.length === 0) return '';
      const cardsHtml = products.map(p => {
        if (typeof window.ProductCard !== 'undefined' && typeof window.ProductCard.render === 'function') {
          return window.ProductCard.render(p);
        }
        return '';
      }).join('');

      return `
        <section class="shop-showcase-section" id="showcase_${rowId}">
          <div class="shop-showcase-header">
            <div class="showcase-title-wrap">
              <span class="showcase-eyebrow">${eyebrow}</span>
              <h2 class="showcase-title font-serif">${title}</h2>
            </div>
            <button type="button" class="showcase-view-all-btn" onclick="${viewAllAction}">
              <span>Xem tất cả</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <div class="shop-slider-container">
            <button type="button" class="shop-slider-arrow arrow-prev" onclick="ShopPage.scrollSlider('slider_${rowId}', -1)" aria-label="Cuộn sang trái" title="Cuộn xem trước">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div class="shop-slider-track" id="slider_${rowId}">
              ${cardsHtml}
            </div>

            <button type="button" class="shop-slider-arrow arrow-next" onclick="ShopPage.scrollSlider('slider_${rowId}', 1)" aria-label="Cuộn sang phải" title="Cuộn xem tiếp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </section>
      `;
    },

    renderLookbookShowcases(allProducts) {
      if (!allProducts || allProducts.length === 0) {
        return '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Đang cập nhật danh mục sản phẩm...</div>';
      }

      // 1. Phân nhóm sản phẩm thông minh, Chỉ hiển thị đúng sản phẩm theo từng thương hiệu
      const norm = (str) => String(str || '').toLowerCase();

      // Top Bán Chạy Nhất, Ưu tiên sản phẩm có đánh giá cao hoặc có chiết khấu
      let bestSellers = allProducts.filter(p => (p.PhanTramGiam && p.PhanTramGiam > 0) || Number(p.rating || 5.0) >= 4.8 || norm(p.name).includes('volcanic') || norm(p.name).includes('claymation') || norm(p.name).includes('blue') || norm(p.name).includes('rough rider'));
      if (bestSellers.length < 5) bestSellers = allProducts.slice(0, 6);

      // Apestomen, Singapore
      const apestomen = allProducts.filter(p => norm(p.brand).includes('apestomen') || norm(p.name).includes('apestomen') || norm(p.name).includes('volcanic') || norm(p.name).includes('nitro') || norm(p.name).includes('cola pomade'));

      // Hanz de Fuko, California
      const hanz = allProducts.filter(p => norm(p.brand).includes('hanz') || norm(p.name).includes('hanz') || norm(p.name).includes('claymation') || norm(p.name).includes('gravity paste') || norm(p.name).includes('quicksand') || norm(p.name).includes('spongewax'));

      // Blumaan, USA
      const blumaan = allProducts.filter(p => norm(p.brand).includes('blumaan') || norm(p.name).includes('blumaan') || norm(p.name).includes('cavalier') || norm(p.name).includes('monarch') || norm(p.name).includes('meraki') || norm(p.name).includes('hybrid cream'));

      // Reuzel Pomade, Rotterdam, Hà Lan
      const reuzel = allProducts.filter(p => norm(p.brand).includes('reuzel') || norm(p.name).includes('reuzel'));

      // Kevin Murphy & Uppercut Deluxe
      const kevinUppercut = allProducts.filter(p => norm(p.brand).includes('kevin') || norm(p.brand).includes('uppercut') || norm(p.name).includes('rough rider') || norm(p.name).includes('night rider') || norm(p.name).includes('uppercut'));

      // Davines Chăm Sóc Phục Hồi, Không có Olaplex
      const davinesOlaplex = allProducts.filter(p => norm(p.brand).includes('davines') || norm(p.brand).includes('kerasys') || norm(p.name).includes('davines'));

      // Dụng Cụ Barber & Shaving Proraso
      const toolsGrooming = allProducts.filter(p => norm(p.brand).includes('proraso') || norm(p.brand).includes('amish') || norm(p.brand).includes('y.s. park') || norm(p.brand).includes('ats') || p.categoryId === 'DM08' || p.categoryId === 'DM09');

      return `
        <!-- DÒNG 1: SẢN PHẨM BÁN CHẠY NHẤT -->
        ${this.renderShowcaseRow('bestsellers', 'OMNI SIGNATURE GROOMING', 'Sản Phẩm Bán Chạy Nhất', "ShopPage.setCategory('bestsellers')", bestSellers)}

        <!-- BENTO BANNER 1 (CHUẨN ẢNH 1: 3 BANNERS NGHỆ THUẬT) -->
        <div class="shop-bento-grid">
          <!-- Card Lớn Trái: Pomade Cao Cấp -->
          <div class="bento-card bento-card-large" onclick="ShopPage.setCategory('DM02')" title="Khám phá dòng Pomade quý ông">
            <div class="bento-card-bg" style="background-image: url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80');"></div>
            <div class="bento-card-overlay"></div>
            <div class="bento-card-content">
              <span class="bento-tag">BỘ SƯU TẬP QUÝ ÔNG</span>
              <h3 class="bento-title font-serif">Pomade Cao Cấp</h3>
              <p class="bento-desc">Gốc dầu và gốc nước cho độ bóng bẩy chuẩn mực, phom tóc Pompadour &amp; Slick Back lịch lãm vượt thời gian.</p>
              <div class="bento-btn">KHÁM PHÁ NGAY &rarr;</div>
            </div>
          </div>

          <!-- Cột Phải Xếp Chồng (2 Card) -->
          <div class="bento-col-stacked">
            <!-- Card Phải Trên: Clay & Fiber -->
            <div class="bento-card bento-card-small" onclick="ShopPage.setCategory('DM01')" title="Xem các dòng Clay &amp; Wax tạo phồng">
              <div class="bento-card-bg" style="background-image: url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=700&q=80');"></div>
              <div class="bento-card-overlay"></div>
              <div class="bento-card-content">
                <span class="bento-tag">VOLUME &amp; TEXTURE</span>
                <h4 class="bento-title-small">Clay &amp; Fiber Tạo Phồng</h4>
                <div class="bento-btn-small">MUA NGAY &rarr;</div>
              </div>
            </div>

            <!-- Card Phải Dưới: Ưu Đãi Đang Sale -->
            <div class="bento-card bento-card-small" onclick="ShopPage.setCategory('fefo_expiry')" title="Săn ưu đãi Flash Sale">
              <div class="bento-card-bg" style="background-image: url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=700&q=80');"></div>
              <div class="bento-card-overlay bento-overlay-sale"></div>
              <div class="bento-card-content">
                <span class="bento-tag bento-tag-sale">ƯU ĐÃI GIỚI HẠN</span>
                <h4 class="bento-title-small">Flash Sale Giảm Đến 40%</h4>
                <div class="bento-btn-small bento-btn-sale">SĂN DEAL NGAY &rarr;</div>
              </div>
            </div>
          </div>
        </div>

        <!-- DÒNG 2: APESTOMEN (SINGAPORE) -->
        ${this.renderShowcaseRow('apestomen', 'SINGAPORE GROOMING BRAND', 'Apestomen Professional', "ShopPage.setBrand('apestomen')", apestomen)}

        <!-- CAMPAIGN STRIP BANNER 2 (CHUẨN ẢNH 1: 2 BANNERS SONG SONG) -->
        <div class="shop-campaign-strip">
          <div class="campaign-banner-card" onclick="ShopPage.setCategory('DM03')" title="Xem các dòng Pre-styling và xịt muối biển">
            <div class="campaign-banner-bg" style="background-image: url('https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80');"></div>
            <div class="campaign-banner-overlay"></div>
            <div class="campaign-banner-content">
              <span class="campaign-tag">PRE-STYLING &amp; BẢO VỆ NHIỆT</span>
              <h3 class="campaign-title font-serif">Xịt Muối Biển &amp; Pre-Styling</h3>
              <p class="campaign-desc">Bảo vệ sợi tóc khỏi nhiệt độ máy sấy, tăng volume bồng bềnh và kết cấu texture tự nhiên.</p>
              <div class="campaign-btn">KHÁM PHÁ NGAY &rarr;</div>
            </div>
          </div>

          <div class="campaign-banner-card" onclick="ShopPage.setCategory('DM05')" title="Xem các dòng dầu gội phục hồi">
            <div class="campaign-banner-bg" style="background-image: url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80');"></div>
            <div class="campaign-banner-overlay"></div>
            <div class="campaign-banner-content">
              <span class="campaign-tag">CHĂM SÓC CHUYÊN SÂU</span>
              <h3 class="campaign-title font-serif">Dầu Gội &amp; Dưỡng Phục Hồi</h3>
              <p class="campaign-desc">Cân bằng dầu nhờn da đầu nam giới, ngăn gàu và phục hồi sợi tóc hư tổn từ gốc.</p>
              <div class="campaign-btn">MUA NGAY &rarr;</div>
            </div>
          </div>
        </div>

        <!-- DÒNG 3: HANZ DE FUKO (CALIFORNIA) -->
        ${this.renderShowcaseRow('hanz', 'CALIFORNIA, USA', 'Hanz de Fuko Natural Styling', "ShopPage.setBrand('hanz de fuko')", hanz)}

        <!-- DÒNG 4: BLUMAAN (USA) -->
        ${this.renderShowcaseRow('blumaan', 'CRAFTED IN USA', 'Blumaan Hair Care', "ShopPage.setBrand('blumaan')", blumaan)}

        <!-- DÒNG 5: REUZEL POMADE (HÀ LAN) -->
        ${this.renderShowcaseRow('reuzel', 'ROTTERDAM, NETHERLANDS', 'Reuzel Pomade Barbershop', "ShopPage.setBrand('reuzel')", reuzel)}

        <!-- DÒNG 6: KEVIN MURPHY & UPPERCUT DELUXE -->
        ${this.renderShowcaseRow('kevin_uppercut', 'PREMIUM BARBERSHOP STYLING', 'Kevin Murphy &amp; Uppercut Deluxe', "ShopPage.setCategory('DM01')", kevinUppercut)}

        <!-- DÒNG 7: DAVINES PHỤC HỒI TÓC -->
        ${this.renderShowcaseRow('davines_olaplex', 'ITALY SALON FORMULA', 'Davines Hair Care &amp; Phục Hồi Tóc', "ShopPage.setBrand('davines')", davinesOlaplex)}

        <!-- DÒNG 8: DỤNG CỤ BARBER & PRORASO SHAVING -->
        ${this.renderShowcaseRow('barber_tools', 'AUTHENTIC BARBER TOOLS & SHAVING', 'Dụng Cụ Barber &amp; Cạo Mặt Proraso', "ShopPage.setCategory('DM08')", toolsGrooming)}
      `;
    },

    setCategory(cat) {
      this.selectedCategory = cat;
      this.currentPage = 1;
      this.closeAllDropdowns();
      this.render(document.getElementById('webMainContainer'));
    },

    setBrand(brand) {
      this.selectedBrand = brand;
      this.currentPage = 1;
      this.closeAllDropdowns();
      this.render(document.getElementById('webMainContainer'));
    },

    setPrice(range) {
      this.selectedPriceRange = range;
      this.currentPage = 1;
      this.closeAllDropdowns();
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

      // LỌC 1: LOẠI BỎ HOÀN TOÀN SẢN PHẨM HẾT HẠN  - daysRemaining <= 0 - 
      let filtered = allProducts.filter(p => {
        if (p.isExpired === true) return false;
        if (p.daysRemaining !== undefined && p.daysRemaining <= 0) return false;
        return true;
      });

      // Filter theo Danh mục
      if (this.selectedCategory === 'fefo_expiry') {
        filtered = filtered.filter(p => (p.PhanTramGiam && p.PhanTramGiam > 0) || p.isNearExpiry);
      } else if (this.selectedCategory === 'bestsellers') {
        const norm = (str) => String(str || '').toLowerCase();
        filtered = filtered.filter(p => (p.PhanTramGiam && p.PhanTramGiam > 0) || Number(p.rating || 5.0) >= 4.8 || norm(p.name).includes('volcanic') || norm(p.name).includes('claymation') || norm(p.name).includes('blue') || norm(p.name).includes('rough rider'));
        if (filtered.length === 0) {
          filtered = [...allProducts].sort((a, b) => (b.rating || 5) - (a.rating || 5)).slice(0, 12);
        }
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

      // Phân trang 15 sản phẩm mỗi trang
      const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      if (this.currentPage > totalPages) this.currentPage = 1;
      const startIdx = (this.currentPage - 1) * this.pageSize;
      const paginated = filtered.slice(startIdx, startIdx + this.pageSize);

      if (typeof window.ProductCard !== 'undefined' && typeof window.ProductCard.render === 'function') {
        return paginated.map(p => window.ProductCard.render(p, {
          onCardClick: `UICommon.openProductDetailModal ? UICommon.openProductDetailModal('${p.id}') : null`,
          showAddToCart: true,
          showBuyNow: true
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
                          style="min-width: 42px; height: 42px; padding: 0 10px; border-radius: 10px; font-size: 13px; font-weight: ${isActive ? '800' : '600'}; cursor: pointer; transition: all 0.2s ease; ${isActive
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
    // TRANG CHI TIẾT SẢN PHẨM  - PRODUCT DETAIL PAGE — FULL-PAGE CHUYÊN NGHIỆP - 
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
        container.innerHTML = `
          <div class="shop-empty-state" style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">
            <h3 style="color: var(--text-primary); font-size: 20px; margin-bottom: 8px;">Không tìm thấy sản phẩm</h3>
            <p style="font-size: 14px; margin-bottom: 20px;">Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.</p>
            <button type="button" class="btn-submit-terracotta" onclick="if(window.AppRouter) window.AppRouter.navigate('/shop')">Quay lại Cửa Hàng</button>
          </div>
        `;
        return;
      }

      const actualPrice = Number(prod.GiaBanThucTe !== undefined ? prod.GiaBanThucTe : (prod.price !== undefined ? prod.price : 0));
      const originalPrice = Number(prod.originalPrice !== undefined ? prod.originalPrice : (prod.GiaNiemYetGoc !== undefined ? prod.GiaNiemYetGoc : (prod.GiaBan !== undefined ? prod.GiaBan : actualPrice)));
      const fefoDiscount = Number(prod.fefoDiscount || prod.nearExpiryDiscount || 0);
      const hasDiscount = (originalPrice > actualPrice && actualPrice > 0) || fefoDiscount > 0;
      let discountPercent = Number(prod.discountPercent || prod.PhanTramGiam || 0);
      if (!discountPercent && originalPrice > actualPrice && originalPrice > 0) {
        discountPercent = Math.round(((originalPrice - actualPrice) / originalPrice) * 100);
      }
      const isExpired = Boolean(
        prod.isExpired ||
        (prod.daysLeft !== null && prod.daysLeft !== undefined && prod.daysLeft <= 0) ||
        (prod.daysRemaining !== null && prod.daysRemaining !== undefined && prod.daysRemaining <= 0) ||
        (prod.SoNgayConLai !== null && prod.SoNgayConLai !== undefined && prod.SoNgayConLai <= 0)
      );

      // Bộ sưu tập 4 góc ảnh chụp thực tế chất lượng cao từ thư viện sản phẩm
      const mainImgUrl = prod.image || prod.HinhAnh || '';
      let detailImages = (Array.isArray(prod.images) && prod.images.length > 0) ? prod.images : null;
      if (!detailImages || detailImages.length === 0) {
        if (mainImgUrl && mainImgUrl.includes('_01.jpg')) {
          detailImages = [
            mainImgUrl,
            mainImgUrl.replace('_01.jpg', '_02.jpg'),
            mainImgUrl.replace('_01.jpg', '_03.jpg'),
            mainImgUrl.replace('_01.jpg', '_04.jpg')
          ];
        } else if (mainImgUrl) {
          detailImages = [mainImgUrl];
        } else {
          detailImages = [];
        }
      }

      // Nhãn và biểu tượng cho 4 góc chụp chuyên nghiệp
      const pNameLower = (prod.name || prod.TenSanPham || '').toLowerCase();
      let angleList = [
        { index: 0, badge: 'Góc 1 • Chính Diện', label: 'Mặt Chính Diện', icon: '📷' },
        { index: 1, badge: 'Góc 2 • Nghiêng 45°', label: 'Góc Nghiêng 45°', icon: '📐' },
        { index: 2, badge: 'Góc 3 • Chất Sáp / Mở Nắp', label: 'Chất Sáp / Mở Nắp', icon: '✨' },
        { index: 3, badge: 'Góc 4 • Mặt Sau & Tem', label: 'Mặt Sau & Tem Nhãn', icon: '🏷️' }
      ];

      if (pNameLower.includes('lược') || pNameLower.includes('máy sấy') || pNameLower.includes('kéo') || pNameLower.includes('brush') || pNameLower.includes('comb')) {
        angleList[2] = { index: 2, badge: 'Góc 3 • Chi Tiết Máy', label: 'Cận Cảnh Chi Tiết', icon: '🔍' };
        angleList[3] = { index: 3, badge: 'Góc 4 • Thông Số & Tem', label: 'Thông Số Kỹ Thuật', icon: '🏷️' };
      } else if (pNameLower.includes('dầu gội') || pNameLower.includes('shampoo') || pNameLower.includes('xịt') || pNameLower.includes('spray') || pNameLower.includes('tonic') || pNameLower.includes('dưỡng')) {
        angleList[2] = { index: 2, badge: 'Góc 3 • Vòi Xịt / Nắp', label: 'Đầu Vòi Xịt & Nắp Chai', icon: '🧴' };
        angleList[3] = { index: 3, badge: 'Góc 4 • Mặt Sau & Thành Phần', label: 'Mặt Sau & Thành Phần', icon: '🏷️' };
      }
      this.currentAngleList = angleList;
      this._currentReviews = null;
      setTimeout(() => this.fetchProductReviews(targetId, prod), 10);

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

      // Phân tích Dung Tích / Quy Cách chuẩn xác theo thuộc tính thực tế
      const pName = prod.name || prod.TenSanPham || '';
      const pDesc = prod.description || prod.MoTa || '';
      const cat = prod.category || prod.TenDanhMuc || '';
      const catId = prod.categoryId || prod.MaDanhMuc || '';
      const fullText = `${pDesc}; ${pName}; ${cat}`.toLowerCase();

      // Dụng cụ / phụ kiện
      const isTool = catId === 'DM09' || 
                     cat.toLowerCase().includes('dụng cụ') || 
                     pName.toLowerCase().includes('lược') || 
                     pName.toLowerCase().includes('comb') || 
                     pName.toLowerCase().includes('brush') || 
                     pName.toLowerCase().includes('pick') || 
                     pName.toLowerCase().includes('máy sấy') || 
                     pName.toLowerCase().includes('kéo') ||
                     fullText.includes('lược chải');

      let variantLabel = 'DUNG TÍCH / QUY CÁCH:';
      let variants = [];

      if (isTool) {
        variantLabel = 'QUY CÁCH / PHÂN LOẠI:';
        variants = ['Bản tiêu chuẩn (Chính hãng)'];
      } else if (fullText.includes('kit')) {
        variantLabel = 'QUY CÁCH / BỘ SẢN PHẨM:';
        variants = ['Bộ tiêu chuẩn Salon (Full Kit)'];
      } else {
        // Tìm dung tích từ mô tả hoặc tên
        let capacity = null;
        const matchDesc = pDesc.match(/Dung\s*t[ií]ch:\s*([^;,\n]+)/i);
        if (matchDesc && matchDesc[1].trim() !== '—' && matchDesc[1].trim() !== '-') {
          capacity = matchDesc[1].trim();
        } else {
          const matchName = pName.match(/(\d+(?:\.\d+)?\s*(?:oz|g|ml)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:oz|g|ml))?)/i);
          if (matchName) capacity = matchName[1].trim();
        }

        if (capacity) {
          let suffix = '(Tiêu chuẩn)';
          if (fullText.includes('pomade') || fullText.includes('clay') || fullText.includes('wax') || fullText.includes('paste')) {
            suffix = '(Hũ tiêu chuẩn)';
          } else if (fullText.includes('tuýp') || fullText.includes('tube')) {
            suffix = '(Tuýp chuẩn)';
          } else if (fullText.includes('chai') || fullText.includes('bottle') || fullText.includes('shampoo') || fullText.includes('gội') || fullText.includes('tonic') || fullText.includes('spray') || fullText.includes('xịt')) {
            suffix = '(Chai chuẩn)';
          } else if (fullText.includes('powder') || fullText.includes('bột')) {
            suffix = '(Lọ bột chuẩn)';
          } else if (fullText.includes('oil') || fullText.includes('dầu')) {
            suffix = '(Chai nhỏ giọt)';
          } else if (fullText.includes('balm')) {
            suffix = '(Hũ balm)';
          }
          variants = [`${capacity} ${suffix}`];
        } else if (fullText.includes('shampoo') || fullText.includes('gội')) {
          variants = ['350ml (Chai tiêu chuẩn)'];
        } else if (fullText.includes('spray') || fullText.includes('xịt') || fullText.includes('gôm')) {
          variants = ['200ml (Chai tiêu chuẩn)'];
        } else {
          variants = ['Hộp tiêu chuẩn (Chính hãng)'];
        }
      }

      // Lọc ra 4 sản phẩm liên quan khác
      const relatedProducts = allProducts.filter(p => (p.id !== prod.id && p.MaSanPham !== prod.id)).slice(0, 4);

      // Xác định Danh mục chuẩn xác theo bộ lọc của Shop
      let categories = (window.store && typeof window.store.getCategories === 'function')
        ? window.store.getCategories()
        : [];
      if (!categories || categories.length === 0) {
        categories = (window.INITIAL_DATA && window.INITIAL_DATA.categories) ||
          (window.INITIAL_SALON_DATA && window.INITIAL_SALON_DATA.categories) || [];
      }

      const matchCat = categories.find(c => c.id === catId || c.MaDanhMuc === catId);
      const catDisplayName = matchCat 
        ? (matchCat.TenDanhMuc || matchCat.name || '').split(' - ')[0]
        : (prod.TenDanhMuc || prod.category || 'Sáp Vuốt Tóc & Tạo Kiểu');

      // Nhận diện thương hiệu chuẩn xác từ tên sản phẩm thay vì hardcode
      const knownBrands = [
        'Hanz de Fuko', 'Apestomen', 'Blumaan', 'Kevin Murphy', 'Reuzel',
        'Davines', 'By Vilain', 'Uppercut Deluxe',
        "L'Oréal Professionnel", "L'Oréal", 'Schwarzkopf Professional', 'Schwarzkopf',
        'Morris Motley', 'Slick Gorilla', 'Dapper Dan', 'Suavecito', 'Proraso', 'Kerasys Homme', 'ATS'
      ];
      let displayBrand = prod.brand;
      if (!displayBrand || displayBrand === 'Omni Professional' || displayBrand === 'CHÍNH HÃNG') {
        const found = knownBrands.find(b => pName.toLowerCase().includes(b.toLowerCase()));
        if (found) displayBrand = found;
      }
      displayBrand = displayBrand || 'CHÍNH HÃNG';

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
                <a href="/shop" onclick="event.preventDefault(); if(typeof ShopPage !== 'undefined' && ShopPage.setCategory) ShopPage.setCategory('${catId || 'all'}'); CustomerWeb.switchTab('shop');" class="pdp-breadcrumb-cat" title="Lọc theo danh mục ${catDisplayName}">${catDisplayName}</a>
                <span class="pdp-sep">›</span>
                <span class="pdp-curr-name" title="${prod.name || prod.TenSanPham}">${prod.name || prod.TenSanPham}</span>
              </div>
              <div class="pdp-top-actions">
                <button type="button" class="pdp-back-btn" onclick="CustomerWeb.switchTab('shop')">
                  ← Tiếp Tục Mua Sắm
                </button>
              </div>
            </div>

            <!-- 2. MAIN HERO SHOWCASE  - CHUẨN BỐ CỤC 4RAU — THƯƠNG HIỆU OMNI SALON -  -->
            <div class="pdp-hero-grid">
              <!-- CỘT TRÁI: GALLERY TRƯNG BÀY SẢN PHẨM -->
              <div class="pdp-gallery-wrap">
                <div class="pdp-gallery-inner">
                  <!-- Thumbnails Dọc Trái -->
                  <div class="pdp-thumbnails-col">
                    ${detailImages.map((img, idx) => {
                      const ang = angleList[idx] || { badge: 'Góc ' + (idx + 1), icon: '📷' };
                      return `
                        <div class="pdp-thumb-item ${idx === 0 ? 'active' : ''}" 
                             title="${ang.label || ang.badge}"
                             onclick="ShopPage.switchDetailImage('${img}', this, ${idx})">
                          <img src="${SalonUtils.formatImageUrl(img)}" alt="Góc ${idx + 1}" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : null">
                          <span class="pdp-thumb-angle-tag">G${idx + 1}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Khung Ảnh Lớn Chính -->
                  <div class="pdp-main-stage">
                    <!-- Badge Góc chụp sản phẩm thực tế -->
                    <div class="pdp-angle-stage-badge" id="pdpAngleStageBadge">
                      <span class="pdp-angle-icon">${(angleList[0] && angleList[0].icon) || '📷'}</span>
                      <span id="pdpAngleText">${(angleList[0] && angleList[0].badge) || 'Góc 1 • Chính Diện'}</span>
                    </div>

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

              <!-- CỘT PHẢI: THÔNG TIN CHI TIẾT & MUA HÀNG -->
              <div class="pdp-info-wrap">
                <!-- 1. Category / Brand Badge -->
                <div class="pdp-4rau-brand-badge" style="color: #C59B27; font-weight: 700; letter-spacing: 0.05em;">${'OMNI SALON • ' + displayBrand.toUpperCase()}</div>

                <!-- 2. Tiêu Đề Sản Phẩm -->
                <h1 class="pdp-4rau-title font-serif tracking-tight leading-tight" style="font-size: clamp(26px, 3.2vw, 36px); font-weight: 700; color: var(--text-primary); margin: 0 0 10px;">
                  ${prod.name || prod.TenSanPham}
                </h1>

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
                    <span class="pdp-4rau-dot" style="background: ${isExpired ? '#ef4444' : '#10B981'};"></span>
                    <span>${isExpired ? 'Hết hạn sử dụng' : 'Còn hàng'}</span>
                  </div>
                </div>

                <!-- 4. Khung Giá Nổi Bật -->
                <div class="pdp-4rau-price-box">
                  ${isExpired ? `
                    <span class="pdp-4rau-price" style="color: #dc2626; font-weight: 800; font-size: 22px;">Đã hết hạn (Thu hồi tiêu hủy)</span>
                  ` : `
                    <span class="pdp-4rau-price" style="color: #C59B27; font-weight: 800; font-size: 26px;">${SalonUtils.formatCurrency(actualPrice)}</span>
                    ${hasDiscount ? `
                      <span class="pdp-4rau-old-price">${SalonUtils.formatCurrency(originalPrice)}</span>
                      <span class="pdp-4rau-discount-tag" style="background: ${fefoDiscount > 0 ? '#fee2e2' : 'rgba(197, 155, 39, 0.15)'}; color: ${fefoDiscount > 0 ? '#dc2626' : '#C59B27'}; border: 1px solid ${fefoDiscount > 0 ? '#fca5a5' : 'rgba(197, 155, 39, 0.3)'};">${fefoDiscount > 0 ? 'Cận hạn -' + fefoDiscount + '%' : '-' + discountPercent + '%'}</span>
                    ` : ''}
                  `}
                </div>

                <!-- 5. CHI TIẾT ĐẶC TÍNH SẢN PHẨM (Tương phản cao trên nền tối) -->
                <div class="pdp-4rau-section">
                  <div class="pdp-4rau-heading">CHI TIẾT ĐẶC TÍNH:</div>
                  <div class="pdp-4rau-details-list">
                    ${detailsList.map(item => `
                      <div class="pdp-4rau-detail-item"><span class="pdp-bullet-gold">▪</span> <span>${item}</span></div>
                    `).join('')}
                  </div>
                </div>

                <!-- 6. Phân Loại / Dung Tích -->
                <div class="pdp-4rau-field-row">
                  <span class="pdp-4rau-field-label">${variantLabel}</span>
                  <div class="pdp-4rau-chips-wrap" id="pdpVariantGroup">
                    ${variants.map((v, i) => `
                      <button type="button" class="pdp-4rau-chip ${i === 0 ? 'active' : ''}" onclick="ShopPage.selectVariant(this, '${v}', '${prod.id}')">${v}</button>
                    `).join('')}
                  </div>
                </div>

                <!-- 7. Chọn Chi Nhánh Còn Hàng -->
                <div class="pdp-4rau-field-row" style="align-items: center; justify-content: flex-start; margin-top: 4px; margin-bottom: 14px;">
                  <button type="button" class="btn-check-branch-stock" onclick="ShopPage.openBranchStockModal('${prod.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>Chọn chi nhánh còn hàng</span>
                  </button>
                </div>

                <!-- 8. Số Lượng Chọn -->
                <div class="pdp-4rau-field-row">
                  <span class="pdp-4rau-field-label">SỐ LƯỢNG:</span>
                  <div class="pdp-4rau-stepper">
                    <button type="button" class="pdp-4rau-step-btn" onclick="ShopPage.changeDetailQty(-1)" aria-label="Giảm số lượng">−</button>
                    <input type="text" id="pdpDetailQtyInput" value="1" readonly class="pdp-4rau-step-input" aria-label="Số lượng sản phẩm">
                    <button type="button" class="pdp-4rau-step-btn" onclick="ShopPage.changeDetailQty(1)" aria-label="Tăng số lượng">+</button>
                  </div>
                </div>

                <!-- 9. Cụm Nút CTA Chuẩn Levents: Thêm Giỏ & Mua Ngay Song Hành Tương Phản Cao -->
                <div class="pdp-4rau-cta-row">
                  ${isExpired ? `
                    <button type="button" class="pdp-btn-add-cart disabled" disabled style="opacity: 0.5; cursor: not-allowed; background: #64748b;">
                      <span>Không thể mua (Đã hết hạn)</span>
                    </button>
                  ` : `
                    <button type="button" class="pdp-btn-add-cart" onclick="ShopPage.handleDetailAddToCart('${prod.id}')">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                        <line x1="3" x2="21" y1="6" y2="6"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                      </svg>
                      <span>Thêm vào giỏ</span>
                    </button>
                    <button type="button" class="pdp-4rau-btn-buynow" onclick="ShopPage.handleDetailBuyNow('${prod.id}')">
                      <span>Mua ngay</span>
                      <span style="font-size: 15px; margin-left: 2px;">→</span>
                    </button>
                  `}
                  <button type="button" class="pdp-4rau-btn-wish" onclick="ShopPage.toggleWishlist('${prod.id}', this)" title="Lưu vào danh sách yêu thích" aria-label="Yêu thích">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>

                <!-- 10. KHỐI CHÍNH SÁCH ACCORDION CHUẨN LEVENTS (VẬN CHUYỂN HỎA TỐC 2H, ĐỔI TRẢ, CHÍNH HÃNG) -->
                <div class="pdp-editorial-policies">
                  <!-- Accordion 1: Thông tin sản phẩm -->
                  <div class="pdp-policy-accordion-item">
                    <button type="button" class="pdp-policy-header" onclick="ShopPage.togglePolicyAccordion(this)">
                      <div class="pdp-policy-header-text">
                        <span class="pdp-policy-title">Thông tin sản phẩm</span>
                        <span class="pdp-policy-subtitle">Dòng tạo kiểu chuyên nghiệp, tối ưu phom tóc nam Á Đông.</span>
                      </div>
                      <span class="pdp-policy-arrow">›</span>
                    </button>
                    <div class="pdp-policy-body">
                      <p style="margin: 0 0 8px;"><strong>${prod.name || prod.TenSanPham}</strong> được nghiên cứu và kiểm định thực tế bởi đội ngũ Master Barber Omni Salon, giữ nếp dẻo dai và tái tạo kiểu dễ dàng sau khi đội mũ bảo hiểm.</p>
                      <ul class="pdp-policy-list">
                        <li>Độ giữ nếp cao và linh hoạt, không gây cảm giác khô giòn hay nặng đầu.</li>
                        <li>Hiệu ứng hoàn thiện tự nhiên, tạo kết cấu tơi dày (texture) chuẩn salon.</li>
                        <li>Gội sạch 100% bằng nước ấm chỉ sau một lần xả thông thường.</li>
                      </ul>
                    </div>
                  </div>

                  <!-- Accordion 2: Chính sách vận chuyển & Giao hàng hỏa tốc 2H -->
                  <div class="pdp-policy-accordion-item">
                    <button type="button" class="pdp-policy-header" onclick="ShopPage.togglePolicyAccordion(this)">
                      <div class="pdp-policy-header-text">
                        <span class="pdp-policy-title">Chính sách vận chuyển</span>
                        <span class="pdp-policy-subtitle">Giao hàng hỏa tốc 2H nội thành • Tiêu chuẩn 1 - 2 ngày toàn quốc</span>
                      </div>
                      <span class="pdp-policy-arrow">›</span>
                    </button>
                    <div class="pdp-policy-body">
                      <div class="pdp-policy-spec-row">
                        <span class="pdp-policy-pill">HỎA TỐC 2H</span>
                        <span>Áp dụng toàn bộ quận nội thành TP.HCM &amp; Hà Nội (nhận hàng ngay trong 120 phút từ chi nhánh gần nhất).</span>
                      </div>
                      <div class="pdp-policy-spec-row">
                        <span class="pdp-policy-pill">TIÊU CHUẨN</span>
                        <span>Toàn quốc nhận từ 1 - 2 ngày làm việc. Hộp carton 3 lớp đệm khí chống sốc, bảo quản sáp nguyên vẹn.</span>
                      </div>
                      <div class="pdp-policy-spec-row">
                        <span class="pdp-policy-pill">FREESHIP</span>
                        <span>Miễn phí vận chuyển toàn quốc cho đơn hàng từ <strong>500.000 đ</strong> trở lên.</span>
                      </div>
                    </div>
                  </div>

                  <!-- Accordion 3: Chính sách đổi trả & Bảo hành -->
                  <div class="pdp-policy-accordion-item">
                    <button type="button" class="pdp-policy-header" onclick="ShopPage.togglePolicyAccordion(this)">
                      <div class="pdp-policy-header-text">
                        <span class="pdp-policy-title">Chính sách đổi trả &amp; Bảo hành</span>
                        <span class="pdp-policy-subtitle">Đổi mới miễn phí trong 7 ngày nếu lỗi sản phẩm</span>
                      </div>
                      <span class="pdp-policy-arrow">›</span>
                    </button>
                    <div class="pdp-policy-body">
                      <p style="margin: 0 0 6px;">Omni Salon cam kết quyền lợi tối đa cho khách hàng:</p>
                      <ul class="pdp-policy-list">
                        <li>Đổi mới 100% trong vòng 7 ngày kể từ ngày nhận hàng nếu phát sinh lỗi hư vòi xịt, nắp rạn nứt hoặc kích ứng da đầu.</li>
                        <li>Hỗ trợ tư vấn đổi mùi hương hoặc dòng sáp phù hợp hơn nếu sản phẩm còn nguyên tem niêm phong.</li>
                      </ul>
                    </div>
                  </div>

                  <!-- Accordion 4: Cam kết chính hãng Omni Salon -->
                  <div class="pdp-policy-accordion-item">
                    <button type="button" class="pdp-policy-header" onclick="ShopPage.togglePolicyAccordion(this)">
                      <div class="pdp-policy-header-text">
                        <span class="pdp-policy-title">Cam kết chính hãng Omni Salon</span>
                        <span class="pdp-policy-subtitle">Phân phối chính ngạch • Hoàn tiền 200% nếu hàng giả</span>
                      </div>
                      <span class="pdp-policy-arrow">›</span>
                    </button>
                    <div class="pdp-policy-body">
                      <p style="margin: 0 0 6px;">100% mỹ phẩm tóc tại Omni Salon đều có tem bảo chứng QR Code chính ngạch, hóa đơn rõ ràng và hạn sử dụng xa.</p>
                      <p style="margin: 0;">Khách hàng có thể mang sáp đến bất kỳ chi nhánh nào trong hệ thống 20 cơ sở Omni Salon để được Master Barber hỗ trợ chỉnh form tóc và hướng dẫn sấy tạo phồng miễn phí!</p>
                    </div>
                  </div>
                </div>

                <!-- 11. Chia Sẻ  - Facebook • Zalo • Sao Chép Link -  -->
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


            <!-- 3. SECTION TABS CHI TIẾT  - FULL WIDTH CONTAINER -  -->
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
                  Đánh Giá Của Khách Hàng <span id="pdpReviewTabCount">(${prod.reviewCount || 0})</span>
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

              <!-- Tab 4: Đánh giá sản phẩm -->
              <div class="pdp-tab-panel" id="tabReviews">
                ${ShopPage.renderDynamicProductReviews(prod)}
              </div>
            </div>

            <!-- 4. SECTION SẢN PHẨM KHUYÊN DÙNG (EDITORIAL RELATED PRODUCTS) -->
            <div class="pdp-related-section">
              <div class="pdp-section-header">
                <div class="pdp-section-title-wrap">
                  <h2 class="font-serif tracking-tight leading-tight" style="font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px;">SẢN PHẨM CÙNG BỘ SƯU TẬP</h2>
                  <p style="font-size: 14px; color: var(--text-secondary); margin: 0;">Gợi ý các dòng sáp và pomade kết hợp hoàn hảo cho phom tóc của bạn</p>
                </div>
                <button type="button" class="pdp-back-btn" onclick="CustomerWeb.switchTab('shop')" style="font-size: 13.5px; font-weight: 700; color: #C59B27;">
                  Xem Tất Cả Mỹ Phẩm →
                </button>
              </div>

              <div class="pdp-related-grid">
                ${relatedProducts.map(rel => {
        const relPrice = Number(rel.GiaBanThucTe || rel.price || 0);
        const relImg = rel.image || rel.HinhAnh || 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg';
        return `
                    <div class="pdp-related-card" onclick="if(window.AppRouter) window.AppRouter.navigate('/product?id=${rel.id}');" style="border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-card);">
                      <div class="pdp-related-img-wrap" style="background: #FFFFFF; padding: 12px;">
                        <img src="${SalonUtils.formatImageUrl(relImg)}" alt="${rel.name || rel.TenSanPham}" class="pdp-related-img" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : null">
                      </div>
                      <div class="pdp-related-info">
                        <div class="pdp-related-brand" style="color: #C59B27; font-weight: 700; font-size: 11px;">${rel.brand || 'OMNI SALON'}</div>
                        <div class="pdp-related-title font-serif tracking-tight leading-tight" style="font-size: 15px; font-weight: 700;" title="${rel.name || rel.TenSanPham}">${rel.name || rel.TenSanPham}</div>
                        <div class="pdp-related-price-row">
                          <span class="pdp-related-price" style="color: #C59B27; font-weight: 800;">${SalonUtils.formatCurrency(relPrice)}</span>
                        </div>
                        <div class="pdp-related-btns" onclick="event.stopPropagation();">
                          <button type="button" class="pdp-related-view-btn" onclick="if(window.AppRouter) window.AppRouter.navigate('/product?id=${rel.id}');" style="font-weight: 700;">
                            Chi Tiết →
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

    togglePolicyAccordion(headerEl) {
      const item = headerEl ? headerEl.closest('.pdp-policy-accordion-item') : null;
      if (!item) return;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.pdp-policy-accordion-item').forEach(el => el.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
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
          mainImg.style.mixBlendMode = 'normal';
          mainImg.style.opacity = '1';
        }, 140);
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
      // Cập nhật badge góc chụp trên khung ảnh lớn
      const angleBadge = document.getElementById('pdpAngleStageBadge');
      if (angleBadge && this.currentAngleList && this.currentAngleList[idx]) {
        const ang = this.currentAngleList[idx];
        angleBadge.innerHTML = `<span class="pdp-angle-icon">${ang.icon}</span> <span id="pdpAngleText">${ang.badge}</span>`;
      }
    },

    selectVariant(btnEl, variantVal, productId) {
      document.querySelectorAll('.pdp-variant-btn, .pdp-4rau-chip').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      this.selectedVariant = variantVal;

      const prod = window.store && typeof window.store.getProductById === 'function' ? window.store.getProductById(productId) : null;
      if (!prod) return;

      const basePrice = Number(prod.price || prod.GiaBan || prod.giaHienTai || 280000);
      const baseOldPrice = Number(prod.originalPrice || prod.GiaNiemYet || basePrice * 1.15);

      let mult = 1.0;
      const vLower = String(variantVal || '').toLowerCase();
      if (vLower.includes('100g') || vLower.includes('118ml') || vLower.includes('500ml') || vLower.includes('300ml')) {
        mult = 1.55;
      } else if (vLower.includes('150g') || vLower.includes('250ml') || vLower.includes('xl')) {
        mult = 2.1;
      } else if (vLower.includes('30ml') || vLower.includes('mini')) {
        mult = 0.65;
      }

      const newPrice = Math.round((basePrice * mult) / 1000) * 1000;
      const newOldPrice = Math.round((baseOldPrice * mult) / 1000) * 1000;

      this.currentPdpPrice = newPrice;

      const priceEl = document.querySelector('.pdp-4rau-price');
      if (priceEl && window.SalonUtils) {
        priceEl.textContent = SalonUtils.formatCurrency(newPrice);
      }
      const oldPriceEl = document.querySelector('.pdp-4rau-old-price');
      if (oldPriceEl && window.SalonUtils) {
        oldPriceEl.textContent = SalonUtils.formatCurrency(newOldPrice);
      }
    },

    openBranchStockModal(productId) {
      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;

      const prod = (window.store && typeof window.store.getProductById === 'function') ? window.store.getProductById(productId) : null;
      const prodName = prod ? (prod.name || prod.TenSanPham || 'Sản phẩm') : 'Sản phẩm';
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];

      modal.classList.add('active');
      modalBody.innerHTML = `
        <div style="padding: 10px 4px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">TỒN KHO THEO CHI NHÁNH</div>
            <h2 style="font-size: 19px; font-weight: 800; color: #ffffff; margin: 0 0 6px;">${SalonUtils.escapeHtml(prodName)}</h2>
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">Quý khách vui lòng chọn chi nhánh còn hàng gần nhất để được phục vụ nhanh chóng</p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; max-height: 380px; overflow-y: auto;">
            ${branches.map((b, idx) => {
              // Lấy tồn kho chi nhánh trực tiếp từ CSDL SQL, bảng TonKho
              const rawStock = (window.store && typeof window.store.getStockForBranch === 'function')
                ? window.store.getStockForBranch(productId, b.id)
                : null;
              const branchStock = (rawStock !== null && rawStock !== undefined && !isNaN(rawStock))
                ? Number(rawStock)
                : 0;
              const isAvailable = branchStock > 0;
              return `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                  <div>
                    <div style="font-weight: 700; font-size: 14.5px; color: #ffffff; margin-bottom: 2px;">${SalonUtils.escapeHtml(b.name)}</div>
                    <div style="font-size: 12.5px; color: #94a3b8;">${SalonUtils.escapeHtml(b.address || 'TP. Hồ Chí Minh')}</div>
                    <div style="margin-top: 6px;">
                      ${isAvailable ? `
                        <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 2px 8px; border-radius: 4px;">
                          ✓ Còn ${branchStock} sản phẩm
                        </span>
                      ` : `
                        <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #ef4444; background: rgba(239, 68, 68, 0.12); padding: 2px 8px; border-radius: 4px;">
                          ✕ Hết sản phẩm
                        </span>
                      `}
                    </div>
                  </div>
                  <div>
                    ${isAvailable ? `
                      <button class="btn-submit-terracotta" style="padding: 7px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; white-space: nowrap; cursor: pointer;"
                              onclick="ShopPage.chooseBranchForProduct('${b.id}', '${SalonUtils.escapeHtml(b.name)}')">
                        Chọn Chi Nhánh
                      </button>
                    ` : `
                      <button disabled style="opacity: 0.5; padding: 7px 14px; font-size: 12px; border-radius: 8px; background: rgba(255,255,255,0.05); color: #888; border: none; cursor: not-allowed;">
                        Hết Hàng
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="text-align: right;">
            <button class="pill-btn-outline" style="padding: 8px 18px; font-size: 12.5px;" onclick="UICommon.closeGlobalModal()">Đóng</button>
          </div>
        </div>
      `;
    },

    chooseBranchForProduct(branchId, branchName) {
      if (window.CartPage && window.CartPage.checkoutData) {
        window.CartPage.checkoutData.pickupBranchId = branchId;
        window.CartPage.detectedNearestBranchId = branchId;
      }
      if (window.UICommon) {
        window.UICommon.closeGlobalModal();
        window.UICommon.showToast(`✓ Đã chọn ${branchName}. Đơn hàng nhận tại Salon sẽ được chuẩn bị sẵn tại đây!`, 'success');
      }
    },

    changeDetailQty(delta) {
      const input = document.getElementById('pdpDetailQtyInput');
      if (!input) return;
      let val = parseInt(input.value, 10) || 1;
      val = Math.max(1, Math.min(99, val + delta));
      input.value = val;
    },

    handleDetailAddToCart(productId) {
      if (window.store && typeof window.store.getProducts === 'function') {
        const prod = window.store.getProducts().find(p => p.id === productId || p.MaSanPham === productId);
        if (prod && (prod.isExpired || (prod.daysLeft !== null && prod.daysLeft !== undefined && prod.daysLeft <= 0))) {
          if (window.UICommon && typeof window.UICommon.showToast === 'function') {
            window.UICommon.showToast('Sản phẩm đã hết hạn sử dụng (Thu hồi tiêu hủy), không thể bán.', 'error');
          } else {
            alert('Sản phẩm đã hết hạn sử dụng (Thu hồi tiêu hủy), không thể bán.');
          }
          return;
        }
      }
      const input = document.getElementById('pdpDetailQtyInput');
      const qty = input ? (parseInt(input.value, 10) || 1) : 1;
      const customData = {};
      if (this.currentPdpPrice) customData.price = this.currentPdpPrice;
      if (this.selectedVariant) customData.variant = this.selectedVariant;
      if (window.UICommon && typeof window.UICommon.addToCart === 'function') {
        window.UICommon.addToCart(productId, 'product', qty, customData);
      }
      this.updateCartBadge();
    },

    handleDetailBuyNow(productId) {
      if (window.store && typeof window.store.getProducts === 'function') {
        const prod = window.store.getProducts().find(p => p.id === productId || p.MaSanPham === productId);
        if (prod && (prod.isExpired || (prod.daysLeft !== null && prod.daysLeft !== undefined && prod.daysLeft <= 0))) {
          if (window.UICommon && typeof window.UICommon.showToast === 'function') {
            window.UICommon.showToast('Sản phẩm đã hết hạn sử dụng (Thu hồi tiêu hủy), không thể bán.', 'error');
          } else {
            alert('Sản phẩm đã hết hạn sử dụng (Thu hồi tiêu hủy), không thể bán.');
          }
          return;
        }
      }
      const input = document.getElementById('pdpDetailQtyInput');
      const qty = input ? (parseInt(input.value, 10) || 1) : 1;
      const customData = {};
      if (this.currentPdpPrice) customData.price = this.currentPdpPrice;
      if (this.selectedVariant) customData.variant = this.selectedVariant;
      if (window.UICommon && typeof window.UICommon.buyNow === 'function') {
        window.UICommon.buyNow(productId, qty, customData);
      }
    },

    // Lấy danh sách đánh giá từ API backend hoặc Store
    async fetchProductReviews(productId, product) {
      if (!productId) return;
      try {
        const res = await fetch('/api/reviews?productId=' + encodeURIComponent(productId));
        const list = await res.json();
        if (Array.isArray(list)) {
          this._currentReviews = list;
          const container = document.getElementById('tabReviews');
          if (container && product) {
            container.innerHTML = this.renderDynamicProductReviews(product, list);
          }
          const countEl = document.getElementById('pdpReviewTabCount');
          if (countEl) countEl.textContent = '(' + list.length + ')';
        }
      } catch (e) {
        console.warn('Lỗi tải đánh giá sản phẩm:', e);
      }
    },

    getProductReviews(product, providedList) {
      if (Array.isArray(providedList)) return providedList;
      if (Array.isArray(this._currentReviews)) return this._currentReviews;
      if (!product) return [];
      const prodId = String(product.id || product.MaSanPham || '');
      const prodName = String(product.name || product.TenSanPham || '');

      const allReviews = (window.store && window.store.state && Array.isArray(window.store.state.reviews))
        ? window.store.state.reviews
        : [];
      return allReviews.filter(r => 
        (r.productId && String(r.productId).trim() === prodId) || 
        (r.MaSanPham && String(r.MaSanPham).trim() === prodId) ||
        (r.orderId && r.productName && r.productName.toLowerCase() === prodName.toLowerCase())
      );
    },

    renderDynamicProductReviews(product, providedList) {
      if (!product) return '';
      const reviews = this.getProductReviews(product, providedList);
      const totalReviews = reviews.length;

      if (totalReviews === 0) {
        return `
          <div style="padding: 42px 20px; text-align: center; background: var(--surface-card); border-radius: 12px; border: 1px dashed var(--border-color);">
            <div style="font-size: 36px; margin-bottom: 10px;">⭐</div>
            <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">Chưa có đánh giá nào cho sản phẩm này</h4>
            <p style="font-size: 13.5px; color: var(--text-secondary); margin: 0 0 18px;">Hãy là người đầu tiên trải nghiệm chất lượng sản phẩm và chia sẻ cảm nhận của bạn!</p>
            ${(window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function' && window.CustomerWeb.getCurrentUser()) ? `
              <button type="button" class="btn-submit-terracotta" style="padding: 8px 22px; font-size: 13px; font-weight: 800; border-radius: 8px; background: #d97706;" onclick="ShopPage.openWriteProductReviewModal('${product.id || product.MaSanPham}', '${this.escapeHtml(product.name || product.TenSanPham)}')">
                ⭐ Viết Đánh Giá Đầu Tiên
              </button>
            ` : `
              <button type="button" class="btn-submit-terracotta" style="padding: 8px 22px; font-size: 13px; font-weight: 800; border-radius: 8px; background: #d97706;" onclick="if(window.UICommon && typeof window.UICommon.openAuthModal === 'function') window.UICommon.openAuthModal('login');">
                🔑 Đăng Nhập Để Đánh Giá
              </button>
            `}
          </div>
        `;
      }

      const totalStars = reviews.reduce((sum, r) => sum + (Number(r.rating || r.SoSao) || 5), 0);
      const avgScore = (totalStars / totalReviews).toFixed(1);

      const count5 = reviews.filter(r => Number(r.rating || r.SoSao) === 5).length;
      const count4 = reviews.filter(r => Number(r.rating || r.SoSao) === 4).length;
      const count3 = reviews.filter(r => Number(r.rating || r.SoSao) === 3).length;
      const count2 = reviews.filter(r => Number(r.rating || r.SoSao) === 2).length;
      const count1 = reviews.filter(r => Number(r.rating || r.SoSao) <= 1).length;

      const p5 = Math.round((count5 / totalReviews) * 100);
      const p4 = Math.round((count4 / totalReviews) * 100);
      const p3 = Math.round((count3 / totalReviews) * 100);
      const p2 = Math.round((count2 / totalReviews) * 100);
      const p1 = Math.round((count1 / totalReviews) * 100);

      const fullStars = Math.round(Number(avgScore));

      return `
        <div class="pdp-reviews-summary" style="display: flex; gap: 24px; padding: 20px; background: var(--surface-card); border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 24px; flex-wrap: wrap;">
          <div class="pdp-reviews-score" style="text-align: center; min-width: 180px;">
            <div class="pdp-reviews-big-num" style="font-size: 42px; font-weight: 900; color: #F59E0B; line-height: 1;">${avgScore}</div>
            <div style="color: #F59E0B; font-size: 20px; margin: 6px 0;">${'★'.repeat(fullStars)}${'☆'.repeat(5 - fullStars)}</div>
            <div style="font-size: 13px; color: var(--text-secondary);">Dựa trên ${totalReviews} đánh giá thực tế</div>
            ${(window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function' && window.CustomerWeb.getCurrentUser()) ? `
              <button type="button" class="btn-submit-terracotta" style="margin-top: 14px; padding: 7px 16px; font-size: 12px; font-weight: 800; border-radius: 8px; background: #d97706;" onclick="ShopPage.openWriteProductReviewModal('${product.id || product.MaSanPham}', '${this.escapeHtml(product.name || product.TenSanPham)}')">
                ⭐ Viết Đánh Giá
              </button>
            ` : `
              <button type="button" class="btn-submit-terracotta" style="margin-top: 14px; padding: 7px 16px; font-size: 12px; font-weight: 800; border-radius: 8px; background: #d97706;" onclick="if(window.UICommon && typeof window.UICommon.openAuthModal === 'function') window.UICommon.openAuthModal('login');">
                🔑 Đăng Nhập Để Đánh Giá
              </button>
            `}
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 6px; min-width: 240px;">
            ${[
              { star: 5, count: count5, percent: p5 },
              { star: 4, count: count4, percent: p4 },
              { star: 3, count: count3, percent: p3 },
              { star: 2, count: count2, percent: p2 },
              { star: 1, count: count1, percent: p1 }
            ].map(row => `
              <div style="display: flex; align-items: center; gap: 10px; font-size: 12.5px;">
                <span style="width: 45px; color: var(--text-secondary);">${row.star} sao</span>
                <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
                  <div style="width: ${row.percent}%; height: 100%; background: #F59E0B; border-radius: 4px;"></div>
                </div>
                <span style="width: 38px; text-align: right; color: var(--text-secondary); font-size: 12px;">${row.percent}%</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="pdp-reviews-list">
          ${reviews.map(r => {
            const author = r.customerName || r.TenKhachHang || r.author || 'Khách Hàng';
            const star = Number(r.rating || r.SoSao || 5);
            const dateStr = r.date ? (window.SalonUtils ? window.SalonUtils.formatDate(r.date) : r.date) : 'Gần đây';
            const orderInfo = r.orderId ? ` • Đơn hàng #${r.orderId}` : '';
            return `
              <div class="pdp-review-item" style="border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 16px;">
                <div class="pdp-review-user" style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                  <div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center;">
                    ${(window.SalonUtils && typeof window.SalonUtils.getInitials === 'function') ? window.SalonUtils.getInitials(author) : author.substring(0, 2).toUpperCase()}
                  </div>
                  <div class="pdp-review-meta">
                    <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--text-primary);">${this.escapeHtml(author)} <span class="pdp-verified-badge" style="color: #10B981; font-size: 11px; margin-left: 6px; font-weight: 600;">✓ Đã Mua Hàng</span></h4>
                    <div class="pdp-review-date" style="font-size: 12px; color: var(--text-secondary);">Đánh giá ngày ${dateStr}${orderInfo}</div>
                  </div>
                </div>
                <div style="color: #F59E0B; font-size: 13px; margin-bottom: 6px;">${'★'.repeat(star)}${'☆'.repeat(5 - star)}</div>
                <p class="pdp-review-comment" style="font-size: 13.5px; line-height: 1.6; color: var(--text-secondary); margin: 0;">${this.escapeHtml(r.comment || r.NoiDung || 'Sản phẩm rất tốt!')}</p>
              </div>
            `;
          }).join('')}
        </div>
      `;
    },

        // Mở popup cho khách tự chấm sao và gửi đánh giá sản phẩm
    openWriteProductReviewModal(productId, productName) {
      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;

      const user = (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function') 
        ? window.CustomerWeb.getCurrentUser() 
        : null;
      if (!user) {
        if (window.UICommon) {
          window.UICommon.showToast('Quý khách vui lòng đăng nhập để gửi đánh giá sản phẩm!', 'warning');
          if (typeof window.UICommon.openAuthModal === 'function') {
            window.UICommon.openAuthModal('login');
          }
        }
        return;
      }
      const initialName = user ? (user.fullName || user.name || '') : '';

      modal.classList.remove('modal-wide');
      modal.classList.add('active');

      modalBody.innerHTML = `
        <div style="padding: 10px;">
          <div style="text-align: center; margin-bottom: 16px;">
            <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary, #141413); margin: 0 0 6px;">Đánh Giá Sản Phẩm</h3>
            <p style="font-size: 13px; color: var(--accent-gold, #C59B27); margin: 0; font-weight: 600;">${this.escapeHtml(productName || 'Sản phẩm')}</p>
          </div>

          <div style="margin-bottom: 14px; text-align: center;">
            <div style="font-size: 13px; color: var(--text-secondary, #575752); margin-bottom: 6px;">Chọn số sao đánh giá:</div>
            <div id="reviewStarRatingSelector" style="font-size: 28px; cursor: pointer; color: #F59E0B; user-select: none;">
              <span data-star="1" onclick="ShopPage._selectRatingStar(1)">★</span>
              <span data-star="2" onclick="ShopPage._selectRatingStar(2)">★</span>
              <span data-star="3" onclick="ShopPage._selectRatingStar(3)">★</span>
              <span data-star="4" onclick="ShopPage._selectRatingStar(4)">★</span>
              <span data-star="5" onclick="ShopPage._selectRatingStar(5)">★</span>
            </div>
            <input type="hidden" id="pdpReviewStarInput" value="5">
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12.5px; color: var(--text-secondary, #575752); margin-bottom: 4px; font-weight: 600;">Họ và tên của bạn:</label>
            <input type="text" id="pdpReviewAuthorInput" class="form-control-custom" style="width: 100%; height: 40px; font-size: 13.5px;" value="${this.escapeHtml(initialName)}" placeholder="Ví dụ: Nguyễn Văn A">
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 12.5px; color: var(--text-secondary, #575752); margin-bottom: 4px; font-weight: 600;">Nội dung nhận xét về sản phẩm:</label>
            <textarea id="pdpReviewCommentInput" class="form-control-custom" rows="3" style="width: 100%; font-size: 13.5px; padding: 10px;" placeholder="Chia sẻ cảm nhận của bạn về độ giữ nếp, mùi hương, chất sáp..."></textarea>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" class="btn-cancel" onclick="UICommon.closeGlobalModal()" style="height: 40px; padding: 0 16px; font-size: 13px;">Hủy Bỏ</button>
            <button type="button" class="btn-submit-terracotta" style="height: 40px; padding: 0 20px; font-size: 13px; font-weight: 800; background: #d97706;" onclick="ShopPage.submitProductReview('${productId}')">
              Gửi Đánh Giá Ngay
            </button>
          </div>
        </div>
      `;
    },

    _selectRatingStar(star) {
      const input = document.getElementById('pdpReviewStarInput');
      const selector = document.getElementById('reviewStarRatingSelector');
      if (input) input.value = star;
      if (selector) {
        const spans = selector.querySelectorAll('span');
        spans.forEach((s, idx) => {
          s.style.color = (idx < star) ? '#F59E0B' : '#475569';
        });
      }
    },

    async submitProductReview(productId) {
      const star = parseInt(document.getElementById('pdpReviewStarInput')?.value || '5', 10);
      const author = document.getElementById('pdpReviewAuthorInput')?.value.trim() || 'Khách Hàng';
      const comment = document.getElementById('pdpReviewCommentInput')?.value.trim();

      if (!comment || comment.length < 5) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập nhận xét ít nhất 5 ký tự!', 'warning');
        return;
      }

      const newReview = {
        id: 'DG_' + Date.now(),
        productId,
        MaSanPham: productId,
        customerName: author,
        author,
        rating: star,
        SoSao: star,
        comment,
        NoiDung: comment,
        date: new Date().toISOString()
      };

      if (window.store && window.store.state) {
        if (!Array.isArray(window.store.state.reviews)) window.store.state.reviews = [];
        window.store.state.reviews.unshift(newReview);
        if (typeof window.store.saveState === 'function') window.store.saveState();
      }

      // Gửi đồng bộ lên backend API
      try {
        await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            rating: star,
            comment,
            customerName: author
          })
        }).catch(() => {});
      } catch (e) {}

      if (window.UICommon) {
        window.UICommon.closeGlobalModal();
        window.UICommon.showToast('Cảm ơn bạn! Đánh giá sản phẩm đã được đăng tải thành công.');
      }

      // Đồng bộ vào mảng _currentReviews của ShopPage ngay lập tức
      if (!Array.isArray(this._currentReviews)) {
        this._currentReviews = [];
      }
      this._currentReviews.unshift(newReview);

      // Cập nhật số đếm đánh giá trên tab
      const countEl = document.getElementById('pdpReviewTabCount');
      if (countEl) countEl.textContent = '(' + this._currentReviews.length + ')';

      // Re-render tab reviews với danh sách mới nhất
      const panel = document.getElementById('tabReviews');
      if (panel) {
        const prod = (window.store && typeof window.store.getProductById === 'function')
          ? window.store.getProductById(productId)
          : { id: productId, name: author };
        if (prod) {
          panel.innerHTML = this.renderDynamicProductReviews(prod, this._currentReviews);
        }
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
    // Lắng nghe đóng dropdown bộ lọc khi click ra ngoài
    if (!window._shopDropdownInit) {
      window._shopDropdownInit = true;
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.shop-dropdown-wrap')) {
          if (window.ShopPage && typeof window.ShopPage.closeAllDropdowns === 'function') {
            window.ShopPage.closeAllDropdowns();
          }
        }
      });
    }

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

