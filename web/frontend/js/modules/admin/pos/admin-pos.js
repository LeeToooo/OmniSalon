(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  Object.assign(window.AdminWeb, {
    renderPosTab(user, services, combos, products, branches, stylists, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      const pos = this.posState;

      // Đặt mặc định branchId và stylistId nếu chưa có
      if ((this.isBranchManager(user) || this.isCashier(user)) && user?.branchId && user.branchId !== 'ALL') {
        pos.branchId = user.branchId;
      } else if (!pos.branchId && branches.length > 0) {
        pos.branchId = branches[0].id;
      }

      let branchStylists = (window.store && typeof window.store.getStylists === 'function')
        ? window.store.getStylists(pos.branchId)
        : [];
      if (!branchStylists || branchStylists.length === 0) {
        branchStylists = stylists.filter(s => (s.branchId === pos.branchId || s.MaChiNhanh === pos.branchId));
      }
      if (!branchStylists || branchStylists.length === 0) {
        branchStylists = stylists.filter(s => s.role !== 'Thu ngân' && s.ChucVu !== 'Thu ngân');
      }
      if (!pos.selectedStylistId || !branchStylists.some(s => s.id === pos.selectedStylistId)) {
        pos.selectedStylistId = branchStylists[0]?.id || (stylists[0]?.id || '');
      }

      // Danh mục picker bên trái với chuẩn hóa tiếng Việt diacritic-insensitive
      const allOfferings = this._getPosOfferings(pos.activeCategory || 'all', pos.searchQuery || '');

      // DRY: Tính toán hóa đơn tập trung qua _calculatePosSummary
      const summary = this._calculatePosSummary(pos);
      pos.discountAmount = summary.discountAmount;

      return `
        <div class="pos-cashier-grid">
          <!-- CỘT TRÁI: PICKER DỊCH VỤ & SẢN PHẨM SÁP -->
          <div class="pos-panel pos-catalog-panel">
            <div class="pos-panel-header">
              <div>
                <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0;">Danh Mục Dịch Vụ & Sản Phẩm Sáp</h3>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Nhấp vào thẻ để đưa vào hóa đơn quầy thu ngân</p>
              </div>
              <input type="text" id="posCatalogSearchInput" class="table-search-input" placeholder="Tìm dịch vụ / sáp..." 
                     value="${this.escapeHtml(pos.searchQuery || '')}" 
                     oninput="AdminWeb.handlePosSearch(this.value)">
            </div>

            <!-- Filter Pills -->
            <div style="display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap;">
              <button type="button" class="admin-tab-btn pos-cat-btn ${pos.activeCategory === 'all' || !pos.activeCategory ? 'active' : ''}" data-cat="all"
                      style="padding: 4px 10px; font-size: 11px;" onclick="AdminWeb.setPosCategory('all')">Tất Cả</button>
              <button type="button" class="admin-tab-btn pos-cat-btn ${pos.activeCategory === 'services' ? 'active' : ''}" data-cat="services"
                      style="padding: 4px 10px; font-size: 11px;" onclick="AdminWeb.setPosCategory('services')">Dịch Vụ Cắt</button>
              <button type="button" class="admin-tab-btn pos-cat-btn ${pos.activeCategory === 'combos' ? 'active' : ''}" data-cat="combos"
                      style="padding: 4px 10px; font-size: 11px;" onclick="AdminWeb.setPosCategory('combos')">Gói Combo VIP</button>
              <button type="button" class="admin-tab-btn pos-cat-btn ${pos.activeCategory === 'products' ? 'active' : ''}" data-cat="products"
                      style="padding: 4px 10px; font-size: 11px;" onclick="AdminWeb.setPosCategory('products')">Sáp & Mỹ Phẩm</button>
            </div>

            <!-- Grid Items (Targeted DOM update không làm mất focus input tìm kiếm) -->
            <div class="pos-catalog-grid" id="posCatalogGrid">
              ${this._renderPosCatalogItems(allOfferings)}
            </div>
          </div>

          <!-- CỘT PHẢI: HÓA ĐƠN QUẦY POS & THANH TOÁN -->
          <div class="pos-panel pos-receipt-panel">
            <div class="pos-panel-header">
              <div>
                <div class="badge-terracotta" style="font-size: 10px;">QUẦY THU NGÂN TẠI CHỖ</div>
                <h3 style="font-size: 17px; font-weight: 900; color: var(--text-primary); margin-top: 4px;">HÓA ĐƠN POS TẠM TÍNH</h3>
              </div>
              <button type="button" class="pill-btn-outline" style="font-size: 11px; padding: 4px 8px; color: #b91c1c; border-color: #fca5a5;" onclick="AdminWeb.resetPosBill()">
                Làm Mới Bill
              </button>
            </div>

            <!-- Chi nhánh & Barber phục vụ -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Cơ Sở Phục Vụ:</label>
                ${(this.isBranchManager(user) || this.isCashier(user)) ? `
                  <div style="font-size: 12px; font-weight: 800; color: var(--text-primary, #333); padding: 6px 8px; background: var(--surface-elevated, #f4f4f7); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 6px;">
                    ${this.escapeHtml(this._getBranchShortName((user?.branchId && user.branchId !== 'ALL') ? user.branchId : (pos.branchId || 'CN01'), bMap))}
                  </div>
                ` : `
                  <select class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" 
                          onchange="AdminWeb.posState.branchId = this.value; AdminWeb.refreshPosView();">
                    ${branches.map(b => `<option value="${b.id}" ${b.id === pos.branchId ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                  </select>
                `}
              </div>
              <div>
                <label class="sub-label">Barber Phục Vụ:</label>
                <select class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" onchange="AdminWeb.posState.selectedStylistId = this.value">
                  ${branchStylists.map(s => `<option value="${s.id}" ${s.id === pos.selectedStylistId ? 'selected' : ''}>${this.escapeHtml(s.name)} (${this.escapeHtml(s.role)})</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Khách hàng -->
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div>
                <label class="sub-label">Tên Khách Hàng:</label>
                <input type="text" class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" 
                       value="${this.escapeHtml(pos.customerName)}" oninput="AdminWeb.posState.customerName = this.value">
              </div>
              <div>
                <label class="sub-label">Số Điện Thoại:</label>
                <input type="tel" class="form-control-custom" style="font-size: 12px; padding: 6px 8px;" 
                       value="${this.escapeHtml(pos.customerPhone)}" oninput="AdminWeb.posState.customerPhone = this.value">
              </div>
            </div>

            <!-- Chi tiết bill -->
            <div style="font-size: 12px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">
              Danh Sách Dịch Vụ & Sản Phẩm Trong Bill (${pos.billServices.length + pos.billProducts.length}):
            </div>
            <div class="pos-bill-list">
              ${pos.billServices.length === 0 && pos.billProducts.length === 0 ? `
                <div style="text-align: center; padding: 24px; color: var(--text-secondary); font-size: 12px;">
                  Chưa có dịch vụ hoặc sản phẩm nào trong bill.<br>Vui lòng nhấp chọn từ bảng bên trái!
                </div>
              ` : ''}

              <!-- Dịch vụ cắt -->
              ${pos.billServices.map((s, idx) => `
                <div class="pos-bill-row">
                  <div>
                    <strong style="color: var(--text-primary);">${this.escapeHtml(s.name)}</strong>
                    <div style="font-size: 11px; color: var(--text-secondary);">${parseInt(String(s.duration || 45).replace(/\s*phút/gi, ''), 10) || 45} phút</div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <strong style="color: var(--brand-accent, #F59E0B);">${SalonUtils.formatCurrency(s.price)}</strong>
                    <button type="button" style="color: #ef4444; border:none; background:none; cursor:pointer; font-weight:800;" onclick="AdminWeb.removePosService(${idx})">✕</button>
                  </div>
                </div>
              `).join('')}

              <!-- Sản phẩm retail -->
              ${pos.billProducts.map(p => `
                <div class="pos-bill-row">
                  <div>
                    <strong style="color: var(--text-primary);">${this.escapeHtml(p.name)}</strong>
                    <div style="font-size: 11px; color: var(--text-secondary);">${SalonUtils.formatCurrency(p.price)} / hộp</div>
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <button type="button" class="qty-btn" style="width:20px; height:20px; font-size:10px;" onclick="AdminWeb.changePosProductQty('${p.id}', ${p.qty - 1})">-</button>
                    <span style="font-weight: 800; font-size: 12px; width: 16px; text-align: center; color: var(--text-primary);">${p.qty}</span>
                    <button type="button" class="qty-btn" style="width:20px; height:20px; font-size:10px;" onclick="AdminWeb.changePosProductQty('${p.id}', ${p.qty + 1})">+</button>
                    <strong style="color: var(--brand-accent, #F59E0B); margin-left: 4px;">${SalonUtils.formatCurrency(p.price * p.qty)}</strong>
                    <button type="button" style="color: #ef4444; border:none; background:none; cursor:pointer; font-weight:800;" onclick="AdminWeb.changePosProductQty('${p.id}', 0)">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Mã Giảm Giá Voucher -->
            <div style="display: flex; gap: 6px; margin-bottom: 12px;">
              <input type="text" id="adminPosVoucherInput" class="form-control-custom" placeholder="Mã ưu đãi (VD: KM2026)" 
                     style="font-size: 12px; padding: 6px 10px; text-transform: uppercase;" value="${this.escapeHtml(pos.voucherCode)}">
              <button type="button" class="btn-submit-terracotta" style="padding: 6px 14px; font-size: 11px; white-space: nowrap;" onclick="AdminWeb.applyPosVoucher()">
                Áp Mã
              </button>
            </div>

            <!-- Bảng Tổng Kết Thanh Toán (Từ summary tập trung) -->
            <div class="pos-summary-table">
              <div class="pos-summary-row">
                <span>Tổng tiền dịch vụ:</span>
                <span>${SalonUtils.formatCurrency(summary.servicesTotal)}</span>
              </div>
              <div class="pos-summary-row">
                <span>Tổng tiền sản phẩm:</span>
                <span>${SalonUtils.formatCurrency(summary.productsTotal)}</span>
              </div>
              ${summary.discountAmount > 0 ? `
                <div class="pos-summary-row" style="color: #10b981; font-weight: 700;">
                  <span>Giảm giá Voucher [${this.escapeHtml(pos.voucherCode)}]:</span>
                  <span>-${SalonUtils.formatCurrency(summary.discountAmount)}</span>
                </div>
              ` : ''}
              <div class="pos-summary-row total-row">
                <span>KHÁCH CẦN THANH TOÁN:</span>
                <span>${SalonUtils.formatCurrency(summary.finalTotal)}</span>
              </div>
            </div>

            <!-- Phương Thức Thu Tiền -->
            <div style="margin-bottom: 14px;">
              <div style="font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Phương Thức Thu Tiền:</div>
              <div style="display: flex; gap: 8px;">
                <button type="button" 
                        class="pos-pay-btn ${pos.paymentMethod === 'VietQR' ? 'active' : ''}"
                        onclick="AdminWeb.posState.paymentMethod = 'VietQR'; AdminWeb.refreshPosView();">
                  Quét Mã VietQR
                </button>
                <button type="button" 
                        class="pos-pay-btn ${pos.paymentMethod === 'Cash' ? 'active' : ''}"
                        onclick="AdminWeb.posState.paymentMethod = 'Cash'; AdminWeb.refreshPosView();">
                  Tiền Mặt Tại Quầy
                </button>
              </div>
            </div>

            <!-- Nút Thanh Toán -->
            <button type="button" class="btn-submit-terracotta" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 900;" 
                    onclick="AdminWeb.checkoutPosBill()">
              Thanh Toán & Xuất Hóa Đơn (${SalonUtils.formatCurrency(summary.finalTotal)})
            </button>
          </div>
        </div>
      `;
    },

    addPosService(serviceId) {
      const srv = window.store.getServiceById(serviceId) || window.store.getComboById(serviceId);
      if (!srv) return;
      this.posState.billServices.push({
        id: srv.id,
        name: srv.name,
        price: Number(srv.price),
        duration: srv.duration || 45
      });
      if (window.UICommon) window.UICommon.showToast(`Đã thêm [${srv.name}] vào bill!`);
      this.refreshPosView();
    },

    addPosProduct(productId) {
      const prod = window.store.getProductById(productId);
      if (!prod) return;
      const existing = this.posState.billProducts.find(p => p.id === productId);
      if (existing) {
        existing.qty += 1;
      } else {
        this.posState.billProducts.push({
          id: prod.id,
          name: prod.name,
          price: Number(prod.price),
          qty: 1,
          image: prod.image
        });
      }
      if (window.UICommon) window.UICommon.showToast(`Đã thêm sáp [${prod.name}] vào bill!`);
      this.refreshPosView();
    },

    changePosProductQty(productId, newQty) {
      if (newQty <= 0) {
        this.posState.billProducts = this.posState.billProducts.filter(p => p.id !== productId);
      } else {
        const it = this.posState.billProducts.find(p => p.id === productId);
        if (it) it.qty = newQty;
      }
      this.refreshPosView();
    },

    removePosService(index) {
      this.posState.billServices.splice(index, 1);
      this.refreshPosView();
    },

    applyPosVoucher(optionalCode = null) {
      const input = document.getElementById('adminPosVoucherInput');
      const code = (optionalCode || (input ? input.value : '')).trim().toUpperCase();
      if (!code) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập mã ưu đãi!', 'warning');
        return;
      }
      if (input && !input.value) {
        input.value = code;
      }
      const promos = window.store.getPromotions ? window.store.getPromotions() : [];
      // DRY: Validate against actual bill subtotal
      const currentSubtotal = this.posState.billServices.reduce((sum, s) => sum + Number(s.price || 0), 0) +
        this.posState.billProducts.reduce((sum, p) => sum + (Number(p.price || 0) * (p.qty || 1)), 0);

      const vRes = window.PricingService ? window.PricingService.processVoucherCode(code, currentSubtotal || 1000000, promos) : null;
      if (!vRes || !vRes.isValid) {
        if (window.UICommon) window.UICommon.showToast(vRes?.message || `Mã [${code}] không hợp lệ!`, 'error');
        return;
      }
      this.posState.voucherCode = code;
      if (window.UICommon) window.UICommon.showToast(`Đã áp dụng mã ưu đãi [${code}]!`);
      this.refreshPosView();
    },

    resetPosBill() {
      this.posState.billServices = [];
      this.posState.billProducts = [];
      this.posState.voucherCode = '';
      this.posState.discountAmount = 0;
      this.refreshPosView();
    },

    removePosVoucher() {
      this.posState.voucherCode = '';
      this.posState.discountAmount = 0;
      this.refreshPosView();
    },

    refreshPosView() {
      const content = document.getElementById('adminSubTabContent');
      if (content && this.adminSubTab === 'pos') {
        const input = document.getElementById('posCatalogSearchInput');
        const hadFocus = input && document.activeElement === input;
        const caret = input ? input.selectionStart : null;

        const user = this.getCurrentUser();
        const services = window.store.getServices();
        const combos = window.store.getCombos();
        const products = window.store.getProducts();
        const branches = window.store.getBranches();
        const stylists = window.store.getStylists();
        content.innerHTML = this.renderPosTab(user, services, combos, products, branches, stylists);

        if (hadFocus) {
          const newInput = document.getElementById('posCatalogSearchInput');
          if (newInput) {
            newInput.focus();
            if (caret !== null) {
              newInput.setSelectionRange(caret, caret);
            }
          }
        }
      }
    },

    _getPosOfferings(category = 'all', searchQuery = '') {
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const combos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];
      const products = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts() : [];

      let list = [];
      if (category === 'all' || category === 'services') {
        services.forEach(s => list.push({ ...s, itemType: 'service' }));
      }
      if (category === 'all' || category === 'combos') {
        combos.forEach(c => list.push({ ...c, itemType: 'service' }));
      }
      if (category === 'all' || category === 'products') {
        products.forEach(p => list.push({ ...p, itemType: 'product' }));
      }

      if (searchQuery && searchQuery.trim()) {
        const norm = str => (str || '')
          .toString()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .trim();
        const normQ = norm(searchQuery);
        list = list.filter(it => {
          const normName = norm(it.name || it.TenSanPham || it.TenDichVu);
          const normBrand = norm(it.brand || it.ThuongHieu || '');
          const normCode = norm(it.id || it.MaSanPham || it.MaDichVu || '');
          return normName.includes(normQ) || normBrand.includes(normQ) || normCode.includes(normQ);
        });
      }
      return list;
    },

    _renderPosCatalogItems(allOfferings) {
      if (!allOfferings || allOfferings.length === 0) {
        return `
          <div style="grid-column: 1 / -1; text-align: center; padding: 36px 16px; color: var(--text-secondary); background: var(--surface-elevated, rgba(0,0,0,0.03)); border-radius: 10px;">
            <p style="margin: 0; font-size: 13px;">Không tìm thấy dịch vụ hoặc sáp nào khớp với bộ lọc.</p>
          </div>
        `;
      }
      return allOfferings.map(item => `
        <div class="pos-item-card" onclick="${item.itemType === 'service' ? `AdminWeb.addPosService('${item.id}')` : `AdminWeb.addPosProduct('${item.id}')`}">
          <div>
            <img src="${SalonUtils.formatImageUrl(item.image || item.HinhAnh)}" 
                 class="pos-item-card-img" alt="${this.escapeHtml(item.name)}"
                 onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80');">
            <div style="font-size: 11px; color: var(--brand-accent, #F59E0B); font-weight: 700;">${item.itemType === 'service' ? 'Dịch Vụ' : 'Sản Phẩm'}</div>
            <div style="font-size: 13px; font-weight: 800; color: var(--text-primary); line-height: 1.3; margin: 2px 0 4px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; min-height: 34px;">${this.escapeHtml(item.name)}</div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; gap: 8px;">
            <strong style="font-size: 13px; color: var(--brand-accent, #F59E0B); font-weight: 800; white-space: nowrap !important; display: inline-block;">${SalonUtils.formatCurrency(item.price)}</strong>
            <button type="button" class="pos-item-add-btn">+ Thêm</button>
          </div>
        </div>
      `).join('');
    },

    handlePosSearch(value) {
      this.posState.searchQuery = value || '';
      const grid = document.getElementById('posCatalogGrid');
      if (grid) {
        const offerings = this._getPosOfferings(this.posState.activeCategory || 'all', this.posState.searchQuery);
        grid.innerHTML = this._renderPosCatalogItems(offerings);
      }
    },

    setPosCategory(cat) {
      this.posState.activeCategory = cat || 'all';
      const buttons = document.querySelectorAll('.pos-cat-btn');
      buttons.forEach(b => {
        if (b.dataset.cat === this.posState.activeCategory) b.classList.add('active');
        else b.classList.remove('active');
      });
      const grid = document.getElementById('posCatalogGrid');
      if (grid) {
        const offerings = this._getPosOfferings(this.posState.activeCategory, this.posState.searchQuery);
        grid.innerHTML = this._renderPosCatalogItems(offerings);
      }
    },

    async checkoutPosBill() {
      const pos = this.posState;
      if (pos.billServices.length === 0 && pos.billProducts.length === 0) {
        if (window.UICommon) window.UICommon.showToast('Hóa đơn chưa có dịch vụ hoặc sản phẩm nào!', 'warning');
        return;
      }

      try {
        const chosenStylist = (window.store && typeof window.store.getStylistById === 'function')
          ? window.store.getStylistById(pos.selectedStylistId)
          : null;
        const stylistName = chosenStylist ? chosenStylist.name : 'Master Barber Chuyên Nghiệp';

        const posOrder = await window.store.createPosOrder({
          branchId: pos.branchId,
          stylistId: pos.selectedStylistId || null,
          stylistName: stylistName,
          customerName: pos.customerName || 'Khách Cắt Quầy',
          customerPhone: pos.customerPhone || '0900000000',
          services: pos.billServices,
          items: pos.billProducts.map(p => ({ productId: p.id, name: p.name, price: p.price, qty: p.qty })),
          voucherCode: pos.voucherCode || null,
          paymentMethod: pos.paymentMethod === 'VietQR' ? 'VietQR_Transfer' : 'Cash_Counter'
        });

        this.resetPosBill();
        this.openPosReceiptModal(posOrder);
      } catch (err) {
        if (window.UICommon) window.UICommon.showToast(`${err.message || 'Lỗi xử lý hóa đơn POS'}`, 'error');
      }
    },

    openPosReceiptModal(order) {
      const qrSvg = SalonUtils.generateQrSvgCode ? SalonUtils.generateQrSvgCode(`VIETQR-OMNI-${order.orderCode}-${order.totalAmount}`) : '';

      this._openModal(`
        <div class="booking-success-box" style="max-width: 500px; margin: 0 auto; text-align: center;">
          <div class="success-icon" style="background:#10b981; margin: 0 auto 12px;">✓</div>
          <h2 style="font-size: 22px; font-weight: 900; margin-bottom: 4px;">THANH TOÁN POS THÀNH CÔNG!</h2>
          <p style="color: #666; font-size: 13px; margin-bottom: 16px;">
            Mã hóa đơn quầy: <strong style="color: #c85a44;">${this.escapeHtml(order.orderCode || order.id)}</strong> • Trạng thái: <strong style="color: #10b981;">ĐÃ THANH TOÁN</strong>
          </p>

          <div class="booking-invoice-card" style="text-align: left; background: var(--surface-elevated); border-radius: 10px; padding: 14px; border: 1px solid var(--border-color); color: var(--text-primary);">
            <div class="invoice-item"><span>Cơ sở phục vụ:</span><strong>${this.escapeHtml(this._getBranchShortName(order.branchId))}</strong></div>
            <div class="invoice-item"><span>Barber phục vụ:</span><strong>${this.escapeHtml(order.stylistName || (window.store && window.store.getStylistById(order.stylistId)?.name) || 'Master Barber')}</strong></div>
            <div class="invoice-item"><span>Khách hàng:</span><span>${this.escapeHtml(order.customerName)} (${this.escapeHtml(order.customerPhone)})</span></div>
            <div class="invoice-item"><span>Hình thức thanh toán:</span><strong>${this.escapeHtml(order.paymentMethod)}</strong></div>

            ${order.services && order.services.length > 0 ? `
              <div style="margin: 8px 0; border-top: 1px dashed var(--border-color); padding-top: 6px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">DỊCH VỤ:</div>
                ${order.services.map(s => `<div class="invoice-item"><span>${this.escapeHtml(s.name)}</span><strong>${SalonUtils.formatCurrency(s.price)}</strong></div>`).join('')}
              </div>
            ` : ''}

            ${order.items && order.items.length > 0 ? `
              <div style="margin: 8px 0; border-top: 1px dashed var(--border-color); padding-top: 6px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">SẢN PHẨM:</div>
                ${order.items.map(it => `<div class="invoice-item"><span>${this.escapeHtml(it.name)} (x${it.qty || 1})</span><strong>${SalonUtils.formatCurrency(it.price * (it.qty || 1))}</strong></div>`).join('')}
              </div>
            ` : ''}

            ${order.discountAmount > 0 ? `
              <div class="invoice-item" style="color: #059669;">
                <span>Voucher giảm giá:</span>
                <strong>-${SalonUtils.formatCurrency(order.discountAmount)}</strong>
              </div>
            ` : ''}

            <div class="invoice-item price-row" style="border-top: 2px solid var(--border-color); padding-top: 8px; margin-top: 8px; display: flex; justify-content: space-between;">
              <span style="font-weight: 800;">Tổng thực thu:</span>
              <strong style="color: #c85a44; font-size: 18px;">${SalonUtils.formatCurrency(order.totalAmount)}</strong>
            </div>
          </div>

          ${qrSvg ? `
            <div style="margin: 16px 0; padding: 12px; background: var(--surface-elevated); border-radius: 10px; border: 1px dashed var(--border-color); text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">MÃ VIETQR XÁC NHẬN GIAO DỊCH TỨC THÌ</div>
              <div style="display: flex; justify-content: center; margin: 6px 0;">${qrSvg}</div>
            </div>
          ` : ''}

          <div style="display: flex; gap: 10px; margin-top: 18px;">
            <button class="pill-btn-outline" style="flex: 1;" onclick="window.print()">In Hóa Đơn</button>
            <button class="btn-submit-terracotta" style="flex: 1;" onclick="AdminWeb._closeModal(); AdminWeb.refreshPosView();">Hoàn Tất & Tạo Đơn Mới</button>
          </div>
        </div>
      `);
    },
  });

})(typeof window !== 'undefined' ? window : this);
