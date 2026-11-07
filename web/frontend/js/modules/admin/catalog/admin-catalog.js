// ============================================================================
// Omni Salon: PHÂN HỆ QUẢN TRỊ - QUẢN LÝ DANH MỤC DỊCH VỤ & COMBO (CATALOG)
// File tách độc lập để tối ưu tốc độ và giảm tải IDE
// ============================================================================

(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  Object.assign(window.AdminWeb, {
    _renderCatalogTableRows(pagedItems, type) {
      if (!pagedItems || pagedItems.length === 0) {
        return `
          <tr>
            <td colspan="8" style="text-align: center; padding: 32px; color: #888;">
              Không tìm thấy mặt hàng nào phù hợp với bộ lọc tìm kiếm.
            </td>
          </tr>
        `;
      }
      return pagedItems.map(item => {
        const itemId = item.id || item.MaCombo || item.MaDichVu || item.MaSanPham || '';
        const itemName = item.name || item.TenCombo || item.TenDichVu || item.TenSanPham || itemId;
        const itemCat = item.category || (type === 'combos' ? 'Combo VIP' : (type === 'products' ? (item.brand || 'Sản Phẩm') : 'Dịch Vụ'));
        const itemPrice = item.price !== undefined ? item.price : (item.GiaCombo !== undefined ? item.GiaCombo : (item.GiaBan !== undefined ? item.GiaBan : (item.Gia || 0)));
        const itemDuration = item.durationMinutes || parseInt(item.duration || item.ThoiLuong || (type === 'combos' ? 60 : 45), 10) || 45;
        const itemDesc = item.description || item.MoTa || (type === 'combos' ? 'Gói combo dịch vụ VIP tiêu chuẩn' : 'Chất lượng tiêu chuẩn Omni Salon Suite');
        const itemImage = item.image || item.HinhAnh || (type === 'combos' ? 'DichVu_Men/CBDV1.jpg' : 'DichVu_Men/DV1.jpg');

        return `
        <tr>
          <td>
            <img src="${SalonUtils.formatImageUrl(itemImage)}" 
                 style="width: 42px; height: 42px; border-radius: 6px; object-fit: cover;" alt="${this.escapeHtml(itemName)}"
                 onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='/DichVu_Men/DV1.jpg');">
          </td>
          <td><strong>${this.escapeHtml(itemId)}</strong></td>
          <td style="font-weight: 800;">${this.escapeHtml(itemName)}</td>
          <td>
            <span class="badge-terracotta" style="font-size: 10px; padding: 2px 8px;">
              ${this.escapeHtml(itemCat)}
            </span>
          </td>
          <td style="font-weight: 900; color: #c85a44;">
            ${SalonUtils.formatCurrency(itemPrice)}
            ${(type === 'services' && (item.NgayApDung || item.effectiveDate)) ? `
              <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary, #888); margin-top: 2px;">
                Áp dụng: ${SalonUtils.formatDate(item.NgayApDung || item.effectiveDate)}
              </div>
            ` : ''}
          </td>
          <td>
            <strong>${itemDuration}</strong> phút
          </td>
          <td style="font-size: 12px; color: var(--text-secondary, #888); max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${this.escapeHtml(itemDesc)}
          </td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="pill-btn-outline" style="padding: 3px 8px; font-size: 11px;" 
                      onclick="AdminWeb.editCatalogItemBottom('${type}', '${itemId}')">
                Sửa
              </button>
              <button class="pill-btn-outline" style="padding: 3px 8px; font-size: 11px; color: #b91c1c; border-color: #fca5a5;" 
                      onclick="AdminWeb.deleteCatalogItem('${type}', '${itemId}')">
                Xóa
              </button>
            </div>
          </td>
        </tr>
      `;}).join('');
    },

    renderCatalogTab(services, combos, products) {
      let type = this.catalogTabType || 'services';
      if (type !== 'services' && type !== 'combos') {
        type = 'services';
        this.catalogTabType = 'services';
      }
      const q = (this.catalogSearchQuery || '').toLowerCase().trim();

      let items = [];
      if (type === 'services') {
        items = services.filter(s => !q || (s.name && s.name.toLowerCase().includes(q)) || (s.category && s.category.toLowerCase().includes(q)) || (s.id && s.id.toLowerCase().includes(q)));
      } else {
        items = combos.filter(c => {
          const cName = (c.name || c.TenCombo || '').toLowerCase();
          const cDesc = (c.description || c.MoTa || '').toLowerCase();
          const cId = (c.id || c.MaCombo || '').toLowerCase();
          return !q || cName.includes(q) || cDesc.includes(q) || cId.includes(q);
        });
      }

      this.catalogPage = this.catalogPage || 1;
      const catTotalPages = Math.max(1, Math.ceil(items.length / this.pageSize));
      if (this.catalogPage > catTotalPages) this.catalogPage = catTotalPages;
      const pagedItems = items.slice((this.catalogPage - 1) * this.pageSize, this.catalogPage * this.pageSize);

      return `
        <!-- Thanh Subtabs Catalog Tinh Gọn (Đồng Bộ Chuẩn Ảnh 5) -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
          <button type="button" class="admin-tab-btn ${type === 'services' ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${type === 'services' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchCatalogTabType('services')">
            Dịch Vụ Cắt Tóc
          </button>
          <button type="button" class="admin-tab-btn ${type === 'combos' ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${type === 'combos' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchCatalogTabType('combos')">
            Gói Combo VIP
          </button>
        </div>

        <!-- Toolbar Filter & Actions Độc Lập Chuẩn Enterprise (Ảnh 3) -->
        <div class="admin-filter-bar" style="border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: var(--surface-card); border: 1px solid var(--border-color); box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex: 1;">
            <!-- Ô tìm kiếm dịch vụ / combo có icon kính lúp và nút X rõ ràng -->
            <div style="position: relative; min-width: 260px; max-width: 380px; flex: 1;">
              <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; display: flex; align-items: center; color: var(--text-secondary);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input type="text" id="adminCatalogSearchInput" class="form-control-custom"
                     style="padding-left: 38px !important; padding-right: 32px !important; height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated);"
                     placeholder="${type === 'combos' ? 'Tìm theo tên gói combo VIP...' : 'Tìm theo tên dịch vụ, phân loại...'}"
                     value="${this.escapeHtml(this.catalogSearchQuery || '')}"
                     oninput="AdminWeb.handleCatalogSearch(this.value)">
              <button type="button" id="adminCatalogSearchClear" onclick="AdminWeb.clearCatalogSearch()" 
                      style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 14px; padding: 4px; display: ${this.catalogSearchQuery ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; z-index: 2;"
                      title="Xóa tìm kiếm">✕</button>
            </div>
          </div>

          <div>
            <button class="btn-submit-terracotta" style="height: 38px; padding: 0 18px; font-size: 12.5px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.25);"
                    onclick="AdminWeb.prepareAddCatalogBottom('${type}')">
              <span>+ Thêm ${type === 'services' ? 'Dịch Vụ' : 'Gói Combo'} Mới</span>
            </button>
          </div>
        </div>

        <!-- Bảng Dữ Liệu Catalog Chuẩn Enterprise -->
        <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
          <div style="overflow-x: auto;">
            <table class="admin-enterprise-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Mã</th>
                  <th>Tên Dịch Vụ / Combo</th>
                  <th>Phân Loại</th>
                  <th id="adminCatalogPriceHeader">${type === 'combos' ? 'Giá Gói Combo' : 'Giá Dịch Vụ'}</th>
                  <th>Thời Lượng</th>
                  <th>Mô Tả Tóm Tắt</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody id="adminCatalogTableBody">
                ${this._renderCatalogTableRows(pagedItems, type)}
              </tbody>
            </table>
          </div>
          <div id="adminCatalogPaginationContainer">
            ${this._renderPaginationControls(this.catalogPage, catTotalPages, items.length, 'AdminWeb.setCatalogPage', 'dịch vụ / combo')}
          </div>
        </div>

        <!-- FORM THÊM / CHỈNH SỬA MẶT HÀNG NẰM DƯỚI BẢNG GIỐNG TRANG CHI NHÁNH & KHO -->
        ${this._renderCatalogBottomEditor(type)}
      `;
    },

    switchCatalogTabType(type) {
      this.catalogTabType = type;
      this.catalogSearchQuery = '';
      this.catalogPage = 1;
      const content = document.getElementById('adminSubTabContent');
      if (content && this.adminSubTab === 'catalog') {
        const services = window.store.getServices();
        const combos = window.store.getCombos();
        const products = window.store.getProducts();
        content.innerHTML = this.renderCatalogTab(services, combos, products);
        return;
      }
      this.refreshCatalogView();
    },

    handleCatalogSearch(val) {
      this.catalogSearchQuery = val;
      this.catalogPage = 1;
      const clearBtn = document.getElementById('adminCatalogSearchClear');
      if (clearBtn) clearBtn.style.display = val ? 'inline-flex' : 'none';
      this.refreshCatalogView();
    },

    clearCatalogSearch() {
      this.catalogSearchQuery = '';
      this.catalogPage = 1;
      const inp = document.getElementById('adminCatalogSearchInput');
      if (inp) {
        inp.value = '';
        inp.focus();
      }
      const clearBtn = document.getElementById('adminCatalogSearchClear');
      if (clearBtn) clearBtn.style.display = 'none';
      this.refreshCatalogView();
    },

    refreshCatalogView() {
      const content = document.getElementById('adminSubTabContent');
      if (!content || this.adminSubTab !== 'catalog') return;

      const services = window.store.getServices();
      const combos = window.store.getCombos();
      const products = window.store.getProducts();

      let type = this.catalogTabType || 'services';
      if (type !== 'services' && type !== 'combos') {
        type = 'services';
        this.catalogTabType = 'services';
      }

      const searchInput = document.getElementById('adminCatalogSearchInput');
      const isSearchFocused = (document.activeElement === searchInput);
      const selStart = searchInput ? searchInput.selectionStart : null;
      const selEnd = searchInput ? searchInput.selectionEnd : null;

      content.innerHTML = this.renderCatalogTab(services, combos, products);

      if (isSearchFocused) {
        const newSearchInput = document.getElementById('adminCatalogSearchInput');
        if (newSearchInput) {
          newSearchInput.focus();
          if (selStart !== null && selEnd !== null) {
            newSearchInput.setSelectionRange(selStart, selEnd);
          }
        }
      }
    },

    setCatalogPage(p) {
      this.catalogPage = p;
      this.refreshCatalogView();
    },

    // -----------------------------------------------------------------------
    // INLINE BOTTOM CATALOG EDITOR (CHỈNH SỬA & THÊM MỚI Ở ĐÁY TRANG GIỐNG CHI NHÁNH)
    // -----------------------------------------------------------------------
    _renderCatalogBottomEditor(type = 'services') {
      const isCombo = type === 'combos';
      const defaultImg = isCombo ? 'DichVu_Men/CBDV1.jpg' : 'DichVu_Men/DV1.jpg';
      const defaultName = isCombo ? 'Combo Cắt Tóc & Gội VIP' : 'Cắt Tóc Nam Chuyên Nghiệp';
      const defaultCat = isCombo ? 'Combo VIP' : 'Cắt & Tạo Kiểu';
      const defaultPrice = isCombo ? 300000 : 120000;
      const defaultDur = isCombo ? 60 : 45;
      const allServices = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];

      return `
        <div id="adminCatalogBottomEditor" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px 26px; margin-top: 24px; width: 100%; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08)); padding-bottom: 16px; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <h3 id="catalogEditorTitle" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">
                Thêm ${isCombo ? 'Gói Combo VIP' : 'Dịch Vụ'} Mới
              </h3>
            </div>
            <div>
              <button type="button" class="pill-btn-outline" style="padding: 5px 14px; font-size: 12px; font-weight: 600;" onclick="AdminWeb.resetCatalogBottomEditor()">
                Đặt Lại / Làm Trống
              </button>
            </div>
          </div>

          <form id="catalogBottomForm" onsubmit="event.preventDefault(); AdminWeb.submitCatalogBottomEditor();">
            <input type="hidden" id="catEditorId" value="">
            <input type="hidden" id="catEditorType" value="${type}">

            <div style="display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(320px, 360px); gap: 28px; align-items: start;">
              
              <!-- CỘT TRÁI: FORM LIỀN MẠCH -->
              <div style="display: flex; flex-direction: column;">
                
                <!-- PHẦN 1: THÔNG TIN DỊCH VỤ / COMBO -->
                <div style="margin-bottom: 6px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27); margin-bottom: 14px;">
                    Thông tin mặt hàng
                  </div>

                  <!-- Hàng 1: Tên mặt hàng -->
                  <div style="margin-bottom: 14px;">
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      ${isCombo ? 'Tên Gói Combo VIP' : 'Tên Dịch Vụ'} <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="text" id="catEditorName" class="form-control-custom" 
                           style="height: 38px; font-size: 13.5px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px; font-weight: 600;" 
                           placeholder="${isCombo ? 'VD: Combo Đẹp Trai Toàn Diện...' : 'VD: Cắt tóc nam Fade & Tạo kiểu sáp...'}"
                           oninput="AdminWeb.syncCatalogPreviewCard()" required>
                  </div>

                  <!-- Hàng 2: Giá & Thời lượng -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Giá Niêm Yết (VNĐ) <span style="color: #ef4444;">*</span>
                      </label>
                      <input type="number" id="catEditorPrice" class="form-control-custom" 
                             style="height: 38px; font-size: 13.5px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: #f59e0b; font-weight: 700; padding: 0 12px;" 
                             placeholder="250000" min="1000" step="5000"
                             oninput="AdminWeb.syncCatalogPreviewCard()" required>
                    </div>
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Thời Lượng Thực Hiện (Phút) ${isCombo ? '<span style="font-size: 11px; color: #f59e0b; font-weight: normal;">(Tự động tính)</span>' : ''}
                      </label>
                      <input type="number" id="catEditorDuration" class="form-control-custom" 
                             style="height: 38px; font-size: 13.5px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px; ${isCombo ? 'background: rgba(255,255,255,0.06); cursor: not-allowed; color: #f59e0b; font-weight: 700;' : ''}" 
                             value="${defaultDur}" min="5" step="5"
                             ${isCombo ? 'readonly' : ''}
                             oninput="AdminWeb.syncCatalogPreviewCard()" required>
                    </div>
                  </div>

                  <!-- Hàng 3: Phân loại & Ảnh URL -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Phân Loại (Category)
                      </label>
                      <input type="text" id="catEditorCategory" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                             value="${defaultCat}"
                             oninput="AdminWeb.syncCatalogPreviewCard()">
                    </div>
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Đường Dẫn Ảnh (Image Path)
                      </label>
                      <input type="text" id="catEditorImage" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                             value="${defaultImg}"
                             oninput="AdminWeb.syncCatalogPreviewCard()">
                    </div>
                  </div>

                  ${isCombo ? `
                    <!-- Khối chọn dịch vụ cấu thành gói Combo VIP -->
                    <div class="combo-services-selection-box" style="margin-bottom: 14px; background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <label class="sub-label" style="margin: 0; font-weight: 700; color: var(--brand-accent, #C59B27); font-size: 12.5px;">
                          Dịch Vụ Cấu Thành Gói Combo VIP:
                        </label>
                        <span id="comboSelectedCountBadge" style="background: rgba(197, 155, 39, 0.15); color: #C59B27; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(197, 155, 39, 0.3);">
                          Đã chọn: 0 dịch vụ
                        </span>
                      </div>
                      <div style="margin-bottom: 8px;">
                        <input type="text" id="comboServiceSearch" class="form-control-custom" placeholder="Tìm nhanh dịch vụ theo tên hoặc mã..." style="padding: 6px 10px; font-size: 12px; height: 32px;" oninput="AdminWeb.filterComboServices(this.value)">
                      </div>
                      <div id="comboServicesList" class="combo-services-list" style="max-height: 170px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px;">
                        ${allServices.map(s => {
                          const sId = String(s.id || s.MaDichVu || '').trim();
                          const sDur = parseInt(s.durationMinutes || s.duration || s.ThoiLuong || 30, 10);
                          const sPrice = parseFloat(s.price || s.Gia || 0);
                          const sName = s.name || s.TenDichVu || sId;
                          return `
                            <label class="combo-service-row" data-search="${this.escapeHtml((sId + ' ' + sName).toLowerCase())}" style="display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s ease;">
                              <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                                <input type="checkbox" class="combo-service-checkbox" value="${sId}" data-duration="${sDur}" data-name="${this.escapeHtml(sName)}" data-price="${sPrice}" onchange="AdminWeb.onComboServiceToggle()" style="accent-color: #f59e0b; cursor: pointer; width: 15px; height: 15px;">
                                <span class="combo-service-name" style="font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                  ${this.escapeHtml(sName)}
                                </span>
                              </div>
                              <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; flex-shrink: 0; margin-left: 8px;">
                                <span style="color: #f59e0b; font-weight: 700;">${sDur} phút</span>
                                <span style="color: var(--text-secondary); opacity: 0.5;">•</span>
                                <span style="color: #10b981; font-weight: 700;">${SalonUtils.formatCurrency(sPrice)}</span>
                              </div>
                            </label>
                          `;
                        }).join('')}
                      </div>
                      <div id="comboSelectedSummary" style="margin-top: 10px; padding: 10px 12px; border-radius: 8px; font-size: 12px;">
                      </div>
                    </div>
                  ` : ''}

                  <!-- Hàng 4: Mô tả tóm tắt -->
                  <div style="margin-bottom: 10px;">
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Mô Tả Tóm Tắt &amp; Công Dụng
                    </label>
                    <textarea id="catEditorDescription" class="form-control-custom" rows="2" 
                              style="font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 8px 12px; box-sizing: border-box;" 
                              placeholder="Mô tả công dụng và các bước phục vụ..."
                              oninput="AdminWeb.syncCatalogPreviewCard()"></textarea>
                  </div>
                </div>

              </div>

              <!-- CỘT PHẢI: DEMO THỰC TẾ TRÊN MENU ĐẶT LỊCH (LIVE PREVIEW CARD 1:1) -->
              <div style="position: sticky; top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27);">
                    Xem trước thực tế (Live Card)
                  </span>
                  <span style="font-size: 11px; color: var(--text-secondary);">Giao diện khách hàng</span>
                </div>

                <div class="catalog-preview-card" style="border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; background: var(--surface-card, #181816); width: 100%; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
                  <div style="position: relative; height: 160px; overflow: hidden; background: #000;">
                    <img id="catPreviewImg" src="${SalonUtils.formatImageUrl(defaultImg)}" 
                         alt="Preview" 
                         style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;"
                         onerror="this.src='/DichVu_Men/DV1.jpg';">
                    <span id="catPreviewBadge" class="badge-terracotta" style="position: absolute; top: 10px; left: 10px; font-size: 10.5px; padding: 3px 8px;">
                      ${defaultCat}
                    </span>
                    <span id="catPreviewDuration" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.75); color: #fff; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">
                      ${defaultDur} phút
                    </span>
                  </div>

                  <div style="padding: 14px 16px;">
                    <h4 id="catPreviewName" style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0; line-height: 1.35;">
                      ${defaultName}
                    </h4>
                    <p id="catPreviewDesc" style="font-size: 12px; color: var(--text-secondary); margin: 0 0 12px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      Chất lượng tiêu chuẩn Omni Salon Suite
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px;">
                      <span style="font-size: 11px; color: var(--text-secondary);">Giá niêm yết:</span>
                      <strong id="catPreviewPrice" style="font-size: 16px; font-weight: 900; color: #f59e0b;">
                        ${SalonUtils.formatCurrency(defaultPrice)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style="margin-top: 10px; font-size: 11.5px; color: var(--text-secondary); line-height: 1.4; text-align: center;">
                  Thẻ hiển thị tức thì trên menu chọn dịch vụ &amp; đặt lịch hẹn
                </div>
              </div>

            </div>

            <!-- NÚT HÀNH ĐỘNG DƯỚI ĐÁY FORM -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));">
              <button type="button" class="pill-btn-outline" style="height: 38px; padding: 0 18px; font-weight: 600; font-size: 13px;" onclick="AdminWeb.resetCatalogBottomEditor()">
                Hủy Bỏ / Làm Mới
              </button>
              <button type="submit" id="catEditorSubmitBtn"
                      style="height: 38px; padding: 0 28px; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; background: var(--brand-accent, #C59B27); color: #141413; transition: opacity 0.15s ease;"
                      onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
                <span>Lưu</span>
              </button>
            </div>

          </form>
        </div>
      `;
    },

    prepareAddCatalogBottom(type) {
      if (type && type !== this.catalogTabType) {
        this.catalogTabType = type;
        this.refreshCatalogView();
      }
      this.resetCatalogBottomEditor();
      const editor = document.getElementById('adminCatalogBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          const nameInput = document.getElementById('catEditorName');
          if (nameInput) nameInput.focus();
        }, 300);
      }
    },

    editCatalogItemBottom(type, itemId) {
      let item = null;
      if (type === 'services') item = window.store.getServiceById(itemId);
      else if (type === 'combos') item = window.store.getComboById(itemId);
      else item = window.store.getProductById(itemId);

      if (!item) {
        if (window.UICommon) window.UICommon.showToast('Không tìm thấy thông tin mặt hàng #' + itemId, 'warning');
        return;
      }

      // Đổi subtab nếu khác type hiện tại
      if (type !== this.catalogTabType) {
        this.catalogTabType = type;
        this.refreshCatalogView();
      }

      const idInput = document.getElementById('catEditorId');
      const typeInput = document.getElementById('catEditorType');
      const nameInput = document.getElementById('catEditorName');
      const priceInput = document.getElementById('catEditorPrice');
      const durInput = document.getElementById('catEditorDuration');
      const catInput = document.getElementById('catEditorCategory');
      const imgInput = document.getElementById('catEditorImage');
      const descInput = document.getElementById('catEditorDescription');
      const titleEl = document.getElementById('catalogEditorTitle');
      const submitBtn = document.getElementById('catEditorSubmitBtn');

      if (idInput) idInput.value = itemId;
      if (typeInput) typeInput.value = type;
      if (nameInput) nameInput.value = item.name || item.TenCombo || item.TenDichVu || item.TenSanPham || '';
      if (priceInput) priceInput.value = item.price !== undefined ? item.price : (item.GiaCombo !== undefined ? item.GiaCombo : (item.GiaBan || item.Gia || ''));
      if (durInput) durInput.value = item.durationMinutes || parseInt(item.duration || item.ThoiLuong || (type === 'combos' ? 60 : 45), 10) || 45;
      if (catInput) catInput.value = item.category || (type === 'combos' ? 'Combo VIP' : 'Dịch Vụ');
      if (imgInput) imgInput.value = item.image || item.HinhAnh || (type === 'combos' ? 'DichVu_Men/CBDV1.jpg' : 'DichVu_Men/DV1.jpg');
      if (descInput) descInput.value = item.description || item.MoTa || '';

      if (titleEl) {
        titleEl.textContent = 'Chỉnh Sửa ' + (type === 'combos' ? 'Gói Combo' : 'Dịch Vụ') + ': ' + (item.name || item.TenCombo || item.TenDichVu);
      }
      if (submitBtn) {
        submitBtn.innerHTML = '<span>Lưu</span>';
      }

      // Nếu là combo, tích chọn các dịch vụ cấu thành
      if (type === 'combos') {
        const rawCurIds = item.serviceIds || (Array.isArray(item.services) ? item.services.map(x => typeof x === 'object' ? (x.id || x.MaDichVu) : x) : []);
        const curIds = (Array.isArray(rawCurIds) ? rawCurIds : []).map(x => String(x).trim());
        const checkboxes = document.querySelectorAll('.combo-service-checkbox');
        checkboxes.forEach(cb => {
          cb.checked = curIds.includes(String(cb.value).trim());
        });
        if (typeof this.onComboServiceToggle === 'function') {
          this.onComboServiceToggle();
        }
      }

      this.syncCatalogPreviewCard();

      const editor = document.getElementById('adminCatalogBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          if (nameInput) nameInput.focus();
        }, 300);
      }
    },

    resetCatalogBottomEditor() {
      const type = this.catalogTabType || 'services';
      const isCombo = type === 'combos';

      const idInput = document.getElementById('catEditorId');
      const typeInput = document.getElementById('catEditorType');
      const nameInput = document.getElementById('catEditorName');
      const priceInput = document.getElementById('catEditorPrice');
      const durInput = document.getElementById('catEditorDuration');
      const catInput = document.getElementById('catEditorCategory');
      const imgInput = document.getElementById('catEditorImage');
      const descInput = document.getElementById('catEditorDescription');
      const titleEl = document.getElementById('catalogEditorTitle');
      const submitBtn = document.getElementById('catEditorSubmitBtn');

      if (idInput) idInput.value = '';
      if (typeInput) typeInput.value = type;
      if (nameInput) nameInput.value = '';
      if (priceInput) priceInput.value = '';
      if (durInput) durInput.value = isCombo ? 0 : 45;
      if (catInput) catInput.value = isCombo ? 'Combo VIP' : 'Cắt & Tạo Kiểu';
      if (imgInput) imgInput.value = isCombo ? 'DichVu_Men/CBDV1.jpg' : 'DichVu_Men/DV1.jpg';
      if (descInput) descInput.value = '';

      if (titleEl) {
        titleEl.textContent = 'Thêm ' + (isCombo ? 'Gói Combo VIP' : 'Dịch Vụ') + ' Mới';
      }
      if (submitBtn) {
        submitBtn.innerHTML = '<span>Lưu</span>';
      }

      if (isCombo) {
        const checkboxes = document.querySelectorAll('.combo-service-checkbox');
        checkboxes.forEach(cb => { cb.checked = false; });
        if (typeof this.onComboServiceToggle === 'function') {
          this.onComboServiceToggle();
        }
      }

      this.syncCatalogPreviewCard();
    },

    syncCatalogPreviewCard() {
      const nameVal = document.getElementById('catEditorName')?.value?.trim();
      const priceVal = parseFloat(document.getElementById('catEditorPrice')?.value) || 0;
      const durVal = parseInt(document.getElementById('catEditorDuration')?.value, 10) || 0;
      const catVal = document.getElementById('catEditorCategory')?.value?.trim();
      const imgVal = document.getElementById('catEditorImage')?.value?.trim();
      const descVal = document.getElementById('catEditorDescription')?.value?.trim();
      const type = document.getElementById('catEditorType')?.value || this.catalogTabType || 'services';
      const isCombo = type === 'combos';

      const previewImg = document.getElementById('catPreviewImg');
      const previewBadge = document.getElementById('catPreviewBadge');
      const previewDuration = document.getElementById('catPreviewDuration');
      const previewName = document.getElementById('catPreviewName');
      const previewDesc = document.getElementById('catPreviewDesc');
      const previewPrice = document.getElementById('catPreviewPrice');

      if (previewImg) {
        const fallback = isCombo ? 'DichVu_Men/CBDV1.jpg' : 'DichVu_Men/DV1.jpg';
        previewImg.src = SalonUtils.formatImageUrl(imgVal || fallback);
      }
      if (previewBadge) {
        previewBadge.textContent = catVal || (isCombo ? 'Combo VIP' : 'Dịch Vụ');
      }
      if (previewDuration) {
        previewDuration.textContent = (durVal || (isCombo ? 60 : 45)) + ' phút';
      }
      if (previewName) {
        previewName.textContent = nameVal || (isCombo ? 'Combo Cắt Tóc & Gội VIP' : 'Cắt Tóc Nam Chuyên Nghiệp');
      }
      if (previewDesc) {
        previewDesc.textContent = descVal || 'Chất lượng tiêu chuẩn Omni Salon Suite';
      }
      if (previewPrice) {
        previewPrice.textContent = SalonUtils.formatCurrency(priceVal || (isCombo ? 300000 : 120000));
      }
    },

    submitCatalogBottomEditor() {
      const id = document.getElementById('catEditorId')?.value?.trim() || null;
      const type = document.getElementById('catEditorType')?.value || this.catalogTabType || 'services';
      const name = document.getElementById('catEditorName')?.value?.trim();
      const price = parseFloat(document.getElementById('catEditorPrice')?.value) || 0;
      const duration = parseInt(document.getElementById('catEditorDuration')?.value, 10) || 45;
      const category = document.getElementById('catEditorCategory')?.value?.trim() || (type === 'combos' ? 'Combo VIP' : 'Dịch Vụ');
      let image = document.getElementById('catEditorImage')?.value?.trim();
      const description = document.getElementById('catEditorDescription')?.value?.trim() || '';

      if (!name || price <= 0) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập tên và giá bán hợp lệ!', 'warning');
        return;
      }

      let serviceIds = [];
      if (type === 'combos') {
        const checkedCbs = document.querySelectorAll('.combo-service-checkbox:checked');
        serviceIds = Array.from(checkedCbs).map(cb => cb.value);
        if (serviceIds.length === 0) {
          if (window.UICommon) window.UICommon.showToast('Vui lòng chọn ít nhất 1 dịch vụ cấu thành gói combo!', 'warning');
          return;
        }
      }

      if (type === 'services' && (!image || image.includes('unsplash.com'))) {
        const dvNum = (id || '').match(/\d+/);
        image = dvNum ? `DichVu_Men/DV${parseInt(dvNum[0], 10)}.jpg` : 'DichVu_Men/DV1.jpg';
      } else if (type === 'combos' && (!image || image.includes('unsplash.com'))) {
        const cbNum = (id || '').match(/\d+/);
        image = cbNum ? `DichVu_Men/CBDV${parseInt(cbNum[0], 10)}.jpg` : 'DichVu_Men/CBDV1.jpg';
      } else if (!image) {
        image = isCombo ? 'DichVu_Men/CBDV1.jpg' : 'DichVu_Men/DV1.jpg';
      }

      if (id) {
        // Cập nhật mặt hàng hiện có
        if (type === 'services') {
          window.store.updateService(id, { name, price, category, duration, image, description });
        } else if (type === 'combos') {
          window.store.updateCombo(id, { name, price, duration, durationMinutes: duration, image, description, serviceIds, services: serviceIds });
        }
        if (window.UICommon) window.UICommon.showToast(`Đã cập nhật [${name}] thành công!`, 'success');
      } else {
        // Thêm mặt hàng mới
        if (type === 'services') {
          window.store.addService({ name, price, category, duration, image, description });
        } else if (type === 'combos') {
          window.store.addCombo({ name, price, duration, durationMinutes: duration, image, description, serviceIds, services: serviceIds });
        }
        if (window.UICommon) window.UICommon.showToast(`Đã thêm [${name}] vào danh mục!`, 'success');
      }

      this.resetCatalogBottomEditor();
      this.refreshCatalogView();
      if (window.store && typeof window.store.syncWithLiveServer === 'function') {
        window.store.syncWithLiveServer();
      }

      // Cuộn nhẹ lên bảng
      const table = document.querySelector('.admin-table-container');
      if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    // Giữ lại để tương thích ngược nếu có sự kiện gọi openCatalogModal
    openCatalogModal(type, itemId = null) {
      if (itemId) {
        this.editCatalogItemBottom(type, itemId);
      } else {
        this.prepareAddCatalogBottom(type);
      }
    },

    onComboServiceToggle() {
      const checkboxes = document.querySelectorAll('.combo-service-checkbox:checked');
      let totalDuration = 0;
      const selected = [];
      checkboxes.forEach(cb => {
        const dur = parseInt(cb.getAttribute('data-duration'), 10) || 0;
        const id = cb.value;
        const name = cb.getAttribute('data-name') || id;
        const price = parseFloat(cb.getAttribute('data-price')) || 0;
        totalDuration += dur;
        selected.push({ id, name, duration: dur, price });
      });

      const durInput = document.getElementById('catEditorDuration') || document.getElementById('catDurationOrStock');
      if (durInput) {
        durInput.value = totalDuration;
      }

      const countBadge = document.getElementById('comboSelectedCountBadge');
      if (countBadge) {
        countBadge.textContent = 'Đã chọn: ' + selected.length + ' dịch vụ';
      }

      const summaryBox = document.getElementById('comboSelectedSummary');
      if (summaryBox) {
        if (selected.length === 0) {
          summaryBox.innerHTML = '<span style="color: #ef4444; font-size: 12px; font-weight: 500;">Chưa chọn dịch vụ nào. Vui lòng chọn ít nhất 1 dịch vụ cho combo.</span>';
        } else {
          const chipsHtml = selected.map(s => `
            <span class="combo-chip-item" style="display: inline-flex; align-items: center; gap: 6px; border-radius: 6px; padding: 4px 10px; font-size: 12px; margin: 2px;">
              <span class="combo-chip-title" style="font-weight: 600;">${this.escapeHtml(s.name)}</span>
              <span class="combo-chip-badge" style="padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;">${s.duration}p</span>
              <button type="button" onclick="AdminWeb.removeComboService('${s.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 2px; font-size: 14px; font-weight: bold; line-height: 1;" title="Bỏ dịch vụ này">&times;</button>
            </span>
          `).join('');
          summaryBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px;">
              <span style="font-weight: 600; color: var(--text-primary);">Dịch vụ đã chọn (${selected.length}):</span>
              <span style="color: #f59e0b; font-weight: 700;">Tổng thời lượng: ${totalDuration} phút</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${chipsHtml}
            </div>
          `;
        }
      }
      this.syncCatalogPreviewCard();
    },

    removeComboService(serviceId) {
      const cb = document.querySelector(`.combo-service-checkbox[value="${serviceId}"]`);
      if (cb) {
        cb.checked = false;
        this.onComboServiceToggle();
      }
    },

    filterComboServices(query) {
      const q = (query || '').toLowerCase().trim();
      const rows = document.querySelectorAll('.combo-service-row');
      rows.forEach(r => {
        const text = r.getAttribute('data-search') || '';
        if (!q || text.includes(q)) {
          r.style.display = 'flex';
        } else {
          r.style.display = 'none';
        }
      });
    },

    deleteCatalogItem(type, id) {
      this.openUniversalDeleteModal(type, id);
    },

  });

})(typeof window !== 'undefined' ? window : this);
