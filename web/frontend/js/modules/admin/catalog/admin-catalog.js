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
                      onclick="AdminWeb.openCatalogModal('${type}', '${itemId}')">
                Sửa
              </button>
              <button class="pill-btn-outline" style="padding: 3px 8px; font-size: 11px; color: #b91c1c; border-color: #fca5a5;" 
                      onclick="AdminWeb.deleteCatalogItem('${type}', '${itemId}')">
                Xóa
              </button>
            </div>
          </td>
        </tr>
      `}).join('');
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
        <div class="admin-table-container">
          <!-- Toolbar Phân Loại Catalog & Thêm Mới -->
          <div class="admin-table-toolbar">
            <div class="table-filter-group">
              <button type="button" class="admin-tab-btn ${type === 'services' ? 'active' : ''}" 
                      style="padding: 6px 14px; font-size: 12px;" onclick="AdminWeb.switchCatalogTabType('services')">
                Dịch Vụ Cắt Tóc (${services.length})
              </button>
              <button type="button" class="admin-tab-btn ${type === 'combos' ? 'active' : ''}" 
                      style="padding: 6px 14px; font-size: 12px;" onclick="AdminWeb.switchCatalogTabType('combos')">
                Gói Combo VIP (${combos.length})
              </button>
              <div class="search-input-wrapper" style="position: relative; display: inline-flex; align-items: center;">
                <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; color: var(--text-muted, #94a3b8); pointer-events: none;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" class="table-search-input" id="adminCatalogSearchInput" placeholder="${type === 'combos' ? 'Tìm theo tên gói combo VIP...' : 'Tìm theo tên dịch vụ...'}" 
                       style="padding-left: 36px; padding-right: 32px;"
                       autocomplete="off"
                       value="${this.escapeHtml(this.catalogSearchQuery || '')}" 
                       oninput="AdminWeb.handleCatalogSearch(this.value)">
                <button type="button" id="adminCatalogSearchClear" onclick="AdminWeb.clearCatalogSearch()" 
                        style="position: absolute; right: 8px; border: none; background: transparent; cursor: pointer; color: var(--text-muted, #94a3b8); display: ${this.catalogSearchQuery ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; width: 20px; height: 20px; font-size: 14px; font-weight: bold; border-radius: 50%;" title="Xóa tìm kiếm">✕</button>
              </div>
            </div>

            <div>
              <button class="btn-submit-terracotta" style="padding: 7px 16px; font-size: 12px;" onclick="AdminWeb.openCatalogModal('${type}')">
                + Thêm ${type === 'services' ? 'Dịch Vụ' : 'Gói Combo'} Mới
              </button>
            </div>
          </div>

          <!-- Bảng Dữ Liệu Catalog -->
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
      `;
    },

    switchCatalogTabType(type) {
      this.catalogTabType = type;
      this.catalogSearchQuery = '';
      this.catalogPage = 1;
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

      const tableBody = document.getElementById('adminCatalogTableBody');
      const paginationContainer = document.getElementById('adminCatalogPaginationContainer');

      if (tableBody && paginationContainer) {
        tableBody.innerHTML = this._renderCatalogTableRows(pagedItems, type);
        paginationContainer.innerHTML = this._renderPaginationControls(this.catalogPage, catTotalPages, items.length, 'AdminWeb.setCatalogPage', 'dịch vụ / combo');
        const priceHeader = document.getElementById('adminCatalogPriceHeader');
        if (priceHeader) {
          priceHeader.textContent = (type === 'combos' ? 'Giá Gói Combo' : 'Giá Dịch Vụ');
        }
      } else {
        content.innerHTML = this.renderCatalogTab(services, combos, products);
      }
    },

    openCatalogModal(type, itemId = null) {
      let item = null;
      if (itemId) {
        if (type === 'services') item = window.store.getServiceById(itemId);
        else if (type === 'combos') item = window.store.getComboById(itemId);
        else item = window.store.getProductById(itemId);
      }

      const isEdit = !!item;
      const isProduct = type === 'products';
      const isCombo = type === 'combos';
      const typeLabel = isProduct ? 'Sản Phẩm' : isCombo ? 'Gói Combo VIP' : 'Dịch Vụ';
      const nameLabel = isProduct ? 'Tên Mặt Hàng / Sản Phẩm:' : isCombo ? 'Tên Gói Combo VIP:' : 'Tên Dịch Vụ:';

      // Chuẩn hóa ảnh: Tuyệt đối không dùng ảnh Unsplash cho Dịch Vụ và Combo salon
      let itemImage = item?.image || item?.HinhAnh || '';
      if (type === 'services') {
        const dvNum = (item?.id || itemId || item?.MaDichVu || '').match(/\d+/);
        const num = dvNum ? parseInt(dvNum[0], 10) : 1;
        const defaultPath = `DichVu_Men/DV${num}.jpg`;
        if (!itemImage || itemImage.includes('unsplash.com') || !itemImage.includes('DichVu_Men')) {
          itemImage = defaultPath;
        }
      } else if (type === 'combos') {
        const cbNum = (item?.id || itemId || item?.MaCombo || '').match(/\d+/);
        const num = cbNum ? parseInt(cbNum[0], 10) : 1;
        const defaultPath = `DichVu_Men/CBDV${num}.jpg`;
        if (!itemImage || itemImage.includes('unsplash.com') || !itemImage.includes('DichVu_Men')) {
          itemImage = defaultPath;
        }
      }

      this._openModal(`
        <div style="max-width: ${isCombo ? '600px' : '520px'}; margin: 0 auto;">
          <div class="badge-terracotta">QUẢN LÝ CATALOG SALON</div>
          <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0 16px;">${isEdit ? 'CHỈNH SỬA' : 'THÊM MỚI'} ${typeLabel.toUpperCase()}</h2>
          <form onsubmit="event.preventDefault(); AdminWeb.submitCatalogForm('${type}', '${itemId || ''}');">
            <div style="margin-bottom: 12px;">
              <label class="sub-label">${nameLabel}</label>
              <input type="text" id="catName" class="form-control-custom" placeholder="${isProduct ? 'VD: Sáp Brosh Matte / Pomade Reuzel...' : isCombo ? 'VD: Combo Quý Tộc Barber...' : 'VD: Cắt tóc nam Fade & Tạo kiểu...'}" value="${this.escapeHtml(item?.name || item?.TenCombo || item?.TenDichVu || item?.TenSanPham || '')}" required>
            </div>
            ${isProduct ? `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <div>
                  <label class="sub-label">Giá Bán (VNĐ):</label>
                  <input type="number" id="catPrice" class="form-control-custom" placeholder="250000" value="${item?.price !== undefined ? item.price : (item?.GiaCombo !== undefined ? item.GiaCombo : (item?.Gia || ''))}" required min="1000">
                </div>
                <div>
                  <label class="sub-label">Giá Gốc / So Sánh (VNĐ):</label>
                  <input type="number" id="catOldPrice" class="form-control-custom" placeholder="320000" value="${item?.oldPrice || item?.originalPrice || item?.GiaBan || item?.price || ''}">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <div>
                  <label class="sub-label">Thương Hiệu:</label>
                  <input type="text" id="catCategory" class="form-control-custom" value="${this.escapeHtml(item?.brand || 'Brosh Japan')}" required>
                </div>
                <div>
                  <label class="sub-label">Số Lượng Tồn Kho:</label>
                  <input type="number" id="catDurationOrStock" class="form-control-custom" value="${item?.stock || 30}" required min="1">
                </div>
              </div>
            ` : `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <div>
                  <label class="sub-label">${isCombo ? 'Giá Gói Combo (VNĐ):' : 'Giá Dịch Vụ (VNĐ):'}</label>
                  <input type="number" id="catPrice" class="form-control-custom" placeholder="250000" value="${item?.price || ''}" required min="1000">
                </div>
                <div>
                  <label class="sub-label">Thời Lượng Thực Hiện (Phút): ${isCombo ? '<span style="font-size: 11px; color: #f59e0b; font-weight: normal;">(Tự động tính)</span>' : ''}</label>
                  <input type="number" id="catDurationOrStock" class="form-control-custom" value="${item?.durationMinutes || parseInt(item?.duration || item?.ThoiLuong || (isCombo ? 0 : 45), 10) || (isCombo ? 0 : 45)}" ${isCombo ? 'readonly style="background: rgba(255,255,255,0.06); cursor: not-allowed; color: #f59e0b; font-weight: 700;"' : ''} required min="1">
                </div>
              </div>
              <div style="margin-bottom: 12px;">
                <label class="sub-label">Phân Loại (Category):</label>
                <input type="text" id="catCategory" class="form-control-custom" value="${this.escapeHtml(item?.category || (isCombo ? 'Combo VIP' : 'Cắt & Tạo Kiểu'))}" required>
              </div>
            `}
            ${isCombo ? `
              <div style="margin-bottom: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color, rgba(255,255,255,0.08)); border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <label class="sub-label" style="display: block; margin: 0; font-weight: 700; color: #f59e0b;">
                    Dịch Vụ Cấu Thành Combo VIP:
                  </label>
                  <span id="comboSelectedCountBadge" style="background: rgba(245,158,11,0.18); color: #f59e0b; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(245,158,11,0.3);">
                    Đã chọn: 0 dịch vụ
                  </span>
                </div>
                <div style="margin-bottom: 8px;">
                  <input type="text" id="comboServiceSearch" class="form-control-custom" placeholder="Tìm nhanh dịch vụ theo tên hoặc mã..." style="padding: 6px 10px; font-size: 12px;" oninput="AdminWeb.filterComboServices(this.value)">
                </div>
                <div id="comboServicesList" style="max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px;">
                  ${((window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : []).map(s => {
                    const sId = String(s.id || s.MaDichVu || '').trim();
                    const rawCurIds = item?.serviceIds || (Array.isArray(item?.services) ? item.services.map(x => typeof x === 'object' ? (x.id || x.MaDichVu) : x) : []);
                    const curIds = (Array.isArray(rawCurIds) ? rawCurIds : []).map(x => String(x).trim());
                    const isChecked = curIds.includes(sId);
                    const sDur = parseInt(s.durationMinutes || s.duration || s.ThoiLuong || 30, 10);
                    const sPrice = parseFloat(s.price || s.Gia || 0);
                    const sName = s.name || s.TenDichVu || sId;
                    return `
                      <label class="combo-service-row" data-search="${this.escapeHtml((sId + ' ' + sName).toLowerCase())}" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.02); cursor: pointer; transition: background 0.15s ease;">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                          <input type="checkbox" class="combo-service-checkbox" value="${sId}" data-duration="${sDur}" data-name="${this.escapeHtml(sName)}" data-price="${sPrice}" ${isChecked ? 'checked' : ''} onchange="AdminWeb.onComboServiceToggle()" style="accent-color: #f59e0b; cursor: pointer; width: 15px; height: 15px;">
                          <span style="font-size: 13px; font-weight: 600; color: #f3f4f6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${this.escapeHtml(sName)} <span style="font-size: 11px; color: #9ca3af; font-weight: normal;">#${sId}</span>
                          </span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; flex-shrink: 0; margin-left: 8px;">
                          <span style="color: #f59e0b; font-weight: 700;">${sDur} phút</span>
                          <span style="color: #6b7280;">•</span>
                          <span style="color: #10b981; font-weight: 600;">${SalonUtils.formatCurrency(sPrice)}</span>
                        </div>
                      </label>
                    `;
                  }).join('')}
                </div>
                <div id="comboSelectedSummary" style="margin-top: 10px; padding: 8px 10px; border-radius: 6px; background: rgba(0,0,0,0.25); border: 1px dashed rgba(245,158,11,0.3); font-size: 12px;">
                </div>
              </div>
            ` : ''}
            <div style="margin-bottom: 12px;">
              <label class="sub-label">Đường Dẫn Ảnh (Image URL):</label>
              <input type="text" id="catImage" class="form-control-custom" value="${this.escapeHtml(itemImage || (type === 'combos' ? 'DichVu_Men/CBDV1.jpg' : type === 'services' ? 'DichVu_Men/DV1.jpg' : 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg'))}">
            </div>
            <div style="margin-bottom: 16px;">
              <label class="sub-label">Mô Tả Chi Tiết:</label>
              <textarea id="catDescription" class="form-control-custom" rows="2" placeholder="Mô tả công dụng và các bước phục vụ...">${this.escapeHtml(item?.description || item?.MoTa || '')}</textarea>
            </div>
            <div style="display: flex; gap: 10px;">
              <button type="button" class="btn-cancel" style="flex: 1;" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
              <button type="submit" class="btn-submit-terracotta" style="flex: 1;">${isEdit ? 'Cập Nhật' : 'Lưu Mặt Hàng'}</button>
            </div>
          </form>
        </div>
      `);

      if (isCombo) {
        setTimeout(() => {
          if (typeof AdminWeb.onComboServiceToggle === 'function') {
            AdminWeb.onComboServiceToggle();
          }
        }, 40);
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

      const durInput = document.getElementById('catDurationOrStock');
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
            <span style="display: inline-flex; align-items: center; gap: 5px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; border-radius: 4px; padding: 3px 8px; font-size: 11px; margin: 2px;">
              <span><strong>#${this.escapeHtml(s.id)}</strong> ${this.escapeHtml(s.name)}</span>
              <span style="background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 3px; color: #fff; font-weight: 700;">${s.duration}p</span>
              <button type="button" onclick="AdminWeb.removeComboService('${s.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0 2px; font-size: 13px; font-weight: bold; line-height: 1;" title="Bỏ dịch vụ này">&times;</button>
            </span>
          `).join('');
          summaryBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; color: #d1d5db; font-size: 11px;">
              <span>Dịch vụ đã chọn (${selected.length}):</span>
              <span style="color: #f59e0b; font-weight: 700;">Tổng thời lượng: ${totalDuration} phút</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${chipsHtml}
            </div>
          `;
        }
      }
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

    submitCatalogForm(type, itemId) {
      const name = (document.getElementById('catName')?.value || '').trim();
      const price = Number(document.getElementById('catPrice')?.value) || 0;
      const oldPrice = document.getElementById('catOldPrice') ? (Number(document.getElementById('catOldPrice').value) || price) : price;
      const catOrBrand = (document.getElementById('catCategory')?.value || '').trim();
      const durOrStock = Number(document.getElementById('catDurationOrStock')?.value) || 45;
      let image = (document.getElementById('catImage')?.value || '').trim();
      const description = (document.getElementById('catDescription')?.value || '').trim();

      if (!name || price <= 0) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập tên và giá bán hợp lệ!', 'warning');
        else alert('Vui lòng nhập tên và giá bán hợp lệ!');
        return;
      }

      let serviceIds = [];
      if (type === 'combos') {
        const checkedCbs = document.querySelectorAll('.combo-service-checkbox:checked');
        serviceIds = Array.from(checkedCbs).map(cb => cb.value);
        if (serviceIds.length === 0) {
          if (window.UICommon) window.UICommon.showToast('Vui lòng chọn ít nhất 1 dịch vụ cấu thành gói combo!', 'warning');
          else alert('Vui lòng chọn ít nhất 1 dịch vụ cấu thành gói combo!');
          return;
        }
      }

      if (type === 'services' && (!image || image.includes('unsplash.com'))) {
        const dvNum = (itemId || '').match(/\d+/);
        image = dvNum ? `DichVu_Men/DV${parseInt(dvNum[0], 10)}.jpg` : 'DichVu_Men/DV1.jpg';
      } else if (type === 'combos' && (!image || image.includes('unsplash.com'))) {
        const cbNum = (itemId || '').match(/\d+/);
        image = cbNum ? `DichVu_Men/CBDV${parseInt(cbNum[0], 10)}.jpg` : 'DichVu_Men/CBDV1.jpg';
      } else if (!image) {
        if (itemId) {
          const existing = window.store.getProductById(itemId);
          image = existing?.image || existing?.HinhAnh || 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg';
        } else {
          image = 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg';
        }
      }

      if (itemId) {
        if (type === 'services') {
          window.store.updateService(itemId, { name, price, oldPrice, category: catOrBrand, duration: durOrStock, image, description });
        } else if (type === 'combos') {
          window.store.updateCombo(itemId, { name, price, oldPrice, duration: durOrStock, durationMinutes: durOrStock, image, description, serviceIds, services: serviceIds });
        } else {
          window.store.updateProduct(itemId, { name, price, oldPrice, originalPrice: oldPrice, GiaBan: oldPrice, brand: catOrBrand, stock: durOrStock, image, description });
        }
        if (window.UICommon) window.UICommon.showToast(`Đã cập nhật [${name}] thành công!`);
      } else {
        if (type === 'services') {
          window.store.addService({ name, price, oldPrice, category: catOrBrand, duration: durOrStock, image, description });
        } else if (type === 'combos') {
          window.store.addCombo({ name, price, oldPrice, duration: durOrStock, durationMinutes: durOrStock, image, description, serviceIds, services: serviceIds });
        } else {
          window.store.addProduct({ name, price, oldPrice, brand: catOrBrand, stock: durOrStock, image, description });
        }
        if (window.UICommon) window.UICommon.showToast(`Đã thêm [${name}] vào danh mục!`);
      }

      this._closeModal();
      this.refreshCatalogView();
      if (window.store && typeof window.store.syncWithLiveServer === 'function') {
        window.store.syncWithLiveServer();
      }
    },

    deleteCatalogItem(type, id) {
      this.openUniversalDeleteModal(type, id);
    },

  });

})(typeof window !== 'undefined' ? window : this);
