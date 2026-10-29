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
        { id: 'olaplex', label: 'Olaplex' },
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
                    ${categories.map(c => {
        const cName = (c.TenDanhMuc || c.name || '').split(' - ')[0];
        const isSel = this.selectedCategory === c.id;
        return `
                        <div class="shop-dropdown-item ${isSel ? 'selected' : ''}" onclick="ShopPage.setCategory('${c.id}')">
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
                  <button type="button" class="btn-clear-to-lookbook" onclick="ShopPage.resetFilters()" title="Quay lại toàn bộ Lookbook">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Xem Toàn Bộ Lookbook</span>
                  </button>
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
    // HỆ THỐNG LOOKBOOK SHOWCASE & BENTO BANNERS CHUẨN ẢNH 1 (4RAU STYLE)
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

      // 1. Phân nhóm sản phẩm thông minh
      const norm = (str) => String(str || '').toLowerCase();

      // Top Bán Chạy Nhất (Ưu tiên sản phẩm có đánh giá cao hoặc có chiết khấu)
      let bestSellers = allProducts.filter(p => (p.PhanTramGiam && p.PhanTramGiam > 0) || Number(p.rating || 5.0) >= 4.9 || norm(p.name).includes('volcanic') || norm(p.name).includes('claymation') || norm(p.name).includes('blue') || norm(p.name).includes('rough rider'));
      if (bestSellers.length < 5) bestSellers = allProducts.slice(0, 6);

      // Apestomen (Singapore)
      let apestomen = allProducts.filter(p => norm(p.brand).includes('apestomen') || norm(p.name).includes('apestomen') || norm(p.name).includes('volcanic') || norm(p.name).includes('nitro') || norm(p.name).includes('cola pomade'));
      if (apestomen.length < 5) {
        const others = allProducts.filter(p => !apestomen.includes(p) && (p.categoryId === 'DM01' || p.categoryId === 'DM02'));
        apestomen = apestomen.concat(others).slice(0, 5);
      }

      // Hanz de Fuko (California)
      let hanz = allProducts.filter(p => norm(p.brand).includes('hanz') || norm(p.name).includes('hanz') || norm(p.name).includes('claymation') || norm(p.name).includes('gravity paste') || norm(p.name).includes('quicksand') || norm(p.name).includes('spongewax'));
      if (hanz.length < 5) {
        const others = allProducts.filter(p => !hanz.includes(p) && p.categoryId === 'DM01');
        hanz = hanz.concat(others).slice(0, 5);
      }

      // Blumaan (USA)
      let blumaan = allProducts.filter(p => norm(p.brand).includes('blumaan') || norm(p.name).includes('blumaan') || norm(p.name).includes('cavalier') || norm(p.name).includes('monarch') || norm(p.name).includes('meraki') || norm(p.name).includes('hybrid cream'));
      if (blumaan.length < 5) {
        const others = allProducts.filter(p => !blumaan.includes(p) && (p.categoryId === 'DM01' || p.categoryId === 'DM03'));
        blumaan = blumaan.concat(others).slice(0, 5);
      }

      // Reuzel Pomade (Rotterdam, Hà Lan)
      let reuzel = allProducts.filter(p => norm(p.brand).includes('reuzel') || norm(p.name).includes('reuzel'));
      if (reuzel.length < 5) {
        const others = allProducts.filter(p => !reuzel.includes(p) && (p.categoryId === 'DM02' || p.categoryId === 'DM08'));
        reuzel = reuzel.concat(others).slice(0, 5);
      }

      // Kevin Murphy & Uppercut Deluxe
      let kevinUppercut = allProducts.filter(p => norm(p.brand).includes('kevin') || norm(p.brand).includes('uppercut') || norm(p.name).includes('rough rider') || norm(p.name).includes('night rider') || norm(p.name).includes('uppercut'));
      if (kevinUppercut.length < 5) {
        const others = allProducts.filter(p => !kevinUppercut.includes(p) && (p.categoryId === 'DM01' || p.categoryId === 'DM02'));
        kevinUppercut = kevinUppercut.concat(others).slice(0, 5);
      }

      // Davines & Olaplex Chăm Sóc Phục Hồi
      let davinesOlaplex = allProducts.filter(p => norm(p.brand).includes('davines') || norm(p.brand).includes('olaplex') || norm(p.brand).includes('kerasys') || p.categoryId === 'DM05');
      if (davinesOlaplex.length < 5) {
        const others = allProducts.filter(p => !davinesOlaplex.includes(p) && (p.categoryId === 'DM05' || p.categoryId === 'DM06'));
        davinesOlaplex = davinesOlaplex.concat(others).slice(0, 5);
      }

      // Dụng Cụ Barber & Shaving Proraso
      let toolsGrooming = allProducts.filter(p => norm(p.brand).includes('proraso') || norm(p.brand).includes('amish') || norm(p.brand).includes('y.s. park') || norm(p.brand).includes('ats') || p.categoryId === 'DM08' || p.categoryId === 'DM09' || p.categoryId === 'DM07' || p.categoryId === 'DM06');
      if (toolsGrooming.length < 5) {
        const others = allProducts.filter(p => !toolsGrooming.includes(p));
        toolsGrooming = toolsGrooming.concat(others).slice(0, 5);
      }

      return `
        <!-- DÒNG 1: SẢN PHẨM BÁN CHẠY NHẤT -->
        ${this.renderShowcaseRow('bestsellers', 'OMNI SIGNATURE GROOMING', 'Sản Phẩm Bán Chạy Nhất', "ShopPage.setCategory('all')", bestSellers)}

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

        <!-- DÒNG 7: DAVINES & OLAPLEX PHỤC HỒI TÓC -->
        ${this.renderShowcaseRow('davines_olaplex', 'ITALY & USA SALON FORMULA', 'Davines &amp; Olaplex Hair Care', "ShopPage.setBrand('davines')", davinesOlaplex)}

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
        'Olaplex', 'Davines', 'By Vilain', 'Uppercut Deluxe',
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
                    <span class="pdp-4rau-dot" style="background: #10B981;"></span>
                    <span>Còn hàng</span>
                  </div>
                </div>

                <!-- 4. Khung Giá Nổi Bật -->
                <div class="pdp-4rau-price-box">
                  <span class="pdp-4rau-price" style="color: #C59B27; font-weight: 800; font-size: 26px;">${SalonUtils.formatCurrency(actualPrice)}</span>
                  ${hasDiscount ? `
                    <span class="pdp-4rau-old-price">${SalonUtils.formatCurrency(originalPrice)}</span>
                    <span class="pdp-4rau-discount-tag" style="background: rgba(197, 155, 39, 0.15); color: #C59B27; border: 1px solid rgba(197, 155, 39, 0.3);">-${discountPercent}%</span>
                  ` : ''}
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
              // Lấy tồn kho chi nhánh trực tiếp từ CSDL SQL (bảng TonKho)
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
      const input = document.getElementById('pdpDetailQtyInput');
      const qty = input ? (parseInt(input.value, 10) || 1) : 1;
      const customData = {};
      if (this.currentPdpPrice) customData.price = this.currentPdpPrice;
      if (this.selectedVariant) customData.variant = this.selectedVariant;
      if (window.UICommon && typeof window.UICommon.buyNow === 'function') {
        window.UICommon.buyNow(productId, qty, customData);
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

