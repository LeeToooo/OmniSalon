// ============================================================================
// Omni Salon: PHÂN HỆ QUẢN TRỊ - QUẢN LÝ KHO HÀNG ĐA CHI NHÁNH & FEFO (INVENTORY)
// Giao diện thiết kế 1:1 đồng bộ chuẩn Quản lý chuỗi chi nhánh (Enterprise UI/UX)
// File tách độc lập để tối ưu tốc độ và giảm tải IDE
// ============================================================================

(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  Object.assign(window.AdminWeb, {
    inventorySubTab: 'stock', // 'stock' | 'fefo' | 'receipts' | 'rules'
    inventoryPage: 1,
    inventorySearchQuery: '',
    _receiptItems: [],

    // -----------------------------------------------------------------------
    // SUB-TAB 5: QUẢN LÝ KHO HÀNG ĐA CHI NHÁNH & PHIẾU NHẬP KHO (TÁCH RIÊNG ĐỘC LẬP)
    // -----------------------------------------------------------------------
    switchInventorySubTab(type) {
      this.inventorySubTab = type;
      this.inventoryPage = 1;
      this.inventorySearchQuery = '';
      const user = this.getCurrentUser();
      const isCashier = this.isCashier(user);

      if (isCashier || this.adminSubTab === 'receipts') {
        this.adminSubTab = 'receipts';
        if (type !== 'receipts' && type !== 'rules') {
          this.inventorySubTab = 'receipts';
        }
      } else {
        this.adminSubTab = 'inventory';
        if (type === 'receipts') {
          this.inventorySubTab = 'stock';
        }
      }

      const content = document.getElementById('adminSubTabContent');
      if (content) {
        const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
        content.innerHTML = this.renderInventoryTab(user, branches);
        document.querySelectorAll('.admin-sidebar-nav-item').forEach(btn => {
          const isRec = (this.adminSubTab === 'receipts');
          const isBtnRec = btn.innerHTML.includes('Phiếu Nhập Kho') || btn.innerHTML.includes('receipts');
          const isBtnInv = btn.innerHTML.includes('Quản Lý Kho') || btn.innerHTML.includes('inventory');
          if (isRec) {
            btn.classList.toggle('active', isBtnRec);
          } else {
            btn.classList.toggle('active', isBtnInv);
          }
        });
        if (this.inventorySubTab === 'stock') {
          setTimeout(() => this.syncProductPreviewCard(), 60);
        } else if (this.inventorySubTab === 'receipts') {
          setTimeout(() => this.syncReceiptPreviewCard(), 60);
        }
      } else {
        const container = document.getElementById('webMainContainer');
        if (container) {
          this.render(container);
        } else {
          this.refreshInventoryView();
        }
      }
    },

    // RENDER TAB CHÍNH: Tách biệt hoàn toàn Quản Lý Kho & Phiếu Nhập Kho, Bỏ icon emoji
    renderInventoryTab(user, branches, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      const branchId = (this.isBranchManager(user) && user.branchId && user.branchId !== 'ALL') ? user.branchId : (this.filterBranch !== 'all' ? this.filterBranch : null);
      const isCashier = this.isCashier(user);
      const isReceiptTab = (isCashier || this.adminSubTab === 'receipts');

      let subType = this.inventorySubTab;
      if (isReceiptTab) {
        if (subType !== 'receipts' && subType !== 'rules') subType = 'receipts';
      } else {
        if (subType === 'receipts') subType = 'stock';
        if (!subType) subType = 'stock';
      }
      this.inventorySubTab = subType;

      const inventory = (window.store && typeof window.store.getBranchInventory === 'function') ? window.store.getBranchInventory(branchId) : [];
      const fefoLots = (window.store && typeof window.store.getFefoLots === 'function') ? window.store.getFefoLots(branchId) : [];
      const receipts = (window.store && typeof window.store.getReceipts === 'function') ? window.store.getReceipts(branchId) : [];
      const suppliers = (window.store && typeof window.store.getSuppliers === 'function') ? window.store.getSuppliers() : [];
      const discountRules = (window.store && typeof window.store.getDiscountRules === 'function') ? window.store.getDiscountRules() : [];

      const q = (this.inventorySearchQuery || '').toLowerCase().trim();

      return `
        <!-- Thanh Chuyển Đổi Phân Hệ (Subtabs Chuẩn Khách Hàng / Kiểm Toán - Bỏ Hoàn Toàn Icon) -->
        ${isReceiptTab ? `
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <button type="button" class="admin-tab-btn ${subType === 'receipts' ? 'active' : ''}" 
                    style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'receipts' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                    onclick="AdminWeb.switchInventorySubTab('receipts')">
              Danh Sách Phiếu Nhập Kho
            </button>
            ${!isCashier ? `
              <button type="button" class="admin-tab-btn ${subType === 'rules' ? 'active' : ''}" 
                      style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'rules' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                      onclick="AdminWeb.switchInventorySubTab('rules')">
                Nhà Cung Cấp Hàng Hóa
              </button>
            ` : ''}
          </div>
        ` : `
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <button type="button" class="admin-tab-btn ${subType === 'stock' ? 'active' : ''}" 
                    style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'stock' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                    onclick="AdminWeb.switchInventorySubTab('stock')">
              Tồn Kho &amp; Sản Phẩm
            </button>
            <button type="button" class="admin-tab-btn ${subType === 'fefo' ? 'active' : ''}" 
                    style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'fefo' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                    onclick="AdminWeb.switchInventorySubTab('fefo')">
              Lô Hàng FEFO &amp; Giá Cận Hạn
            </button>
            <button type="button" class="admin-tab-btn ${subType === 'rules' ? 'active' : ''}" 
                    style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${subType === 'rules' ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                    onclick="AdminWeb.switchInventorySubTab('rules')">
              Danh Sách Nhà Cung Cấp
            </button>
          </div>
        `}

        <!-- Filter & Actions Toolbar Thẻ Độc Lập Giống Y Hệt Quản Lý Chuỗi Chi Nhánh -->
        <div class="admin-filter-bar" style="border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: var(--surface-card); border: 1px solid var(--border-color); box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex: 1;">
            <!-- Ô tìm kiếm sản phẩm / kho có icon kính lúp và nút X rõ ràng -->
            <div style="position: relative; min-width: 260px; max-width: 380px; flex: 1;">
              <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; display: flex; align-items: center; color: var(--text-secondary);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input type="text" id="adminInventorySearchInput" class="form-control-custom"
                     style="padding-left: 38px !important; padding-right: 32px !important; height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated);"
                     placeholder="Tìm theo tên, mã hoặc số lô..."
                     value="${this.escapeHtml(this.inventorySearchQuery || '')}"
                     oninput="AdminWeb.handleInventorySearch(this.value);">
              <button type="button" id="adminInventorySearchClear"
                      onclick="AdminWeb.clearInventorySearch();"
                      style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 14px; padding: 4px; display: ${this.inventorySearchQuery ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; z-index: 2;"
                      title="Xóa tìm kiếm">✕</button>
            </div>

            <!-- Lọc theo Khu Vực / Chi Nhánh -->
            <div style="display: flex; align-items: center; gap: 6px;">
              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta" style="padding: 8px 12px; font-size: 12px;">Chi nhánh của bạn</span>
              ` : `
                <select class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; padding: 0 12px; border: 1px solid var(--border-color); background: var(--surface-elevated);"
                        onchange="AdminWeb.filterBranch = this.value; AdminWeb.inventoryPage = 1; AdminWeb.refreshInventoryView();">
                  <option value="all" ${(!this.filterBranch || this.filterBranch === 'all') ? 'selected' : ''}>Toàn bộ chi nhánh</option>
                  ${branches.map(b => `
                    <option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>
                  `).join('')}
                </select>
              `}
            </div>
          </div>

          <!-- Nút Hành Động Cam Chuẩn Form Chi Nhánh -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            ${subType === 'stock' ? `
              <button class="btn-submit-terracotta" style="height: 38px; padding: 0 18px; font-size: 12.5px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.25);"
                      onclick="AdminWeb.prepareAddProductBottom()">
                <span>+ Thêm Sản Phẩm Mới</span>
              </button>
            ` : ''}
            ${subType === 'receipts' ? `
              <button class="btn-submit-terracotta" style="height: 38px; padding: 0 18px; font-size: 12.5px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.25);"
                      onclick="AdminWeb.prepareAddReceiptBottom()">
                <span>+ Lập Phiếu Nhập Kho Mới</span>
              </button>
            ` : ''}
            ${subType === 'rules' ? `
              <button class="btn-submit-terracotta" style="height: 38px; padding: 0 18px; font-size: 12.5px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.25);"
                      onclick="AdminWeb.prepareAddSupplierBottom()">
                <span>+ Thêm Nhà Cung Cấp Mới</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Khối Bảng Kho Hàng Có ID Độc Lập Để Không Mất Focus Khi Gõ -->
        <div id="adminInventoryContentContainer">
          ${this._renderInventoryContent(subType, { inventory, fefoLots, receipts, suppliers, discountRules, q })}
        </div>
      `;
    },

    // RENDER NỘI DUNG BẢNG KHO: Thiết kế 1:1 giống bảng chi nhánh
    _renderInventoryContent(subType, { inventory, fefoLots, receipts, suppliers, discountRules, q }) {
      this.inventoryPage = this.inventoryPage || 1;
      const user = this.getCurrentUser();

      // 1. Phân hệ Tồn Kho & Sản Phẩm (stock)
      if (subType === 'stock') {
        const normQ = this._normalizeSearchText(q);
        const filtered = inventory.filter(it => {
          if (!normQ) return true;
          const name = this._normalizeSearchText(it.productName || it.name || '');
          const brand = this._normalizeSearchText(it.brand || '');
          const id = this._normalizeSearchText(it.productId || it.id || '');
          return name.includes(normQ) || brand.includes(normQ) || id.includes(normQ);
        });
        const invTotalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
        if (this.inventoryPage > invTotalPages) this.inventoryPage = invTotalPages;
        const pagedInventory = filtered.slice((this.inventoryPage - 1) * this.pageSize, this.inventoryPage * this.pageSize);

        return `
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%; border-collapse: separate; border-spacing: 0;">
                <thead style="background: var(--surface-elevated); border-bottom: 2px solid var(--border-color);">
                  <tr>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; white-space: nowrap;">MÃ</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; white-space: nowrap;">SẢN PHẨM &amp; THƯƠNG HIỆU</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; white-space: nowrap;">DANH MỤC</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; white-space: nowrap;">ĐƠN GIÁ BÁN</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; white-space: nowrap;">GIÁ GỐC (VỐN)</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; white-space: nowrap; text-align: center;">TỒN KHO HIỆN TẠI</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; white-space: nowrap; text-align: center;">ĐIỀU CHỈNH NHANH</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; white-space: nowrap; text-align: center;">TRẠNG THÁI</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; white-space: nowrap; text-align: center;">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  ${pagedInventory.length > 0 ? pagedInventory.map(item => {
                    const stock = item.stock || 0;
                    const costPriceVal = item.costPrice !== undefined ? item.costPrice : (item.GiaNhap !== undefined ? item.GiaNhap : Math.round((item.price || 250000) * 0.7));
                    const isAvailable = stock > 0;
                    const pImg = SalonUtils.formatImageUrl(item.image || item.HinhAnh);
                    const pName = item.productName || item.name || 'Sản phẩm';
                    const pBrand = item.brand || 'CHÍNH HÃNG';
                    const pCategory = item.category || item.NhomHang || 'Chăm sóc nam';

                    return `
                      <tr class="admin-inventory-table-row"
                          style="cursor: pointer; transition: background 0.15s ease, box-shadow 0.15s ease; border-bottom: 1px solid var(--border-color);">
                        <!-- Cột 1: MÃ SP (Giống cột MÃ CN01) -->
                        <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--text-primary); padding: 12px 14px;">
                          ${this.escapeHtml(item.productId || item.id)}
                        </td>

                        <!-- Cột 2: SẢN PHẨM & THƯƠNG HIỆU (Ảnh 44x44 + Tên đậm + Thương hiệu vàng gold - Chuẩn 1:1 giống Chi nhánh & Cơ sở) -->
                        <td style="padding: 12px 14px;">
                          <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0; background: #111; display: flex; align-items: center; justify-content: center;">
                              <img src="${pImg}" alt="${this.escapeHtml(pName)}"
                                   style="width: 100%; height: 100%; object-fit: contain; padding: 2px;"
                                   onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=120&q=80');">
                            </div>
                            <div>
                              <div style="font-weight: 800; color: var(--text-primary); font-size: 13.5px; line-height: 1.3;">${this.escapeHtml(pName)}</div>
                              <div style="font-size: 11.5px; color: var(--brand-accent); font-weight: 700; margin-top: 2px;">${this.escapeHtml(pBrand)}</div>
                            </div>
                          </div>
                        </td>

                        <!-- Cột 3: DANH MỤC -->
                        <td style="color: var(--text-secondary); font-size: 12.5px; padding: 12px 14px; white-space: nowrap;">
                          ${this.escapeHtml(pCategory)}
                        </td>

                        <!-- Cột 4: ĐƠN GIÁ BÁN (Vàng Cam) -->
                        <td style="padding: 12px 14px; white-space: nowrap;">
                          <strong style="color: #f59e0b; font-size: 13px; font-weight: 800;">
                            ${SalonUtils.formatCurrency(item.price)}
                          </strong>
                        </td>

                        <!-- Cột 5: GIÁ GỐC (Xanh ngọc emerald giống doanh thu) -->
                        <td style="padding: 12px 14px; white-space: nowrap;">
                          <strong style="color: #10b981; font-size: 13px; font-weight: 800;">
                            ${SalonUtils.formatCurrency(costPriceVal)}
                          </strong>
                        </td>

                        <!-- Cột 6: TỒN KHO HIỆN TẠI (Pill bo tròn với chấm tròn) -->
                        <td style="padding: 12px 14px; text-align: center; white-space: nowrap;">
                          <span class="status-pill ${stock > 5 ? 'status-completed' : (stock > 0 ? '' : 'status-cancelled')}" 
                                style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; display: inline-flex; align-items: center; gap: 5px; ${stock <= 5 && stock > 0 ? 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);' : ''}">
                            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
                            ${stock > 0 ? `Còn ${stock} hộp/cái` : 'Hết hàng'}
                          </span>
                        </td>

                        <!-- Cột 7: ĐIỀU CHỈNH NHANH (Nút pill nhỏ gọn, thẩm mỹ) -->
                        <td style="padding: 12px 14px; text-align: center; white-space: nowrap;">
                          <div style="display: inline-flex; align-items: center; gap: 4px;">
                            <button class="pill-btn-outline" style="padding: 3px 7px; font-size: 11px; font-weight: 700; border-radius: 6px;" 
                                    onclick="event.stopPropagation(); AdminWeb.adjustStock('${item.id}', ${stock - 1})" title="Giảm 1">-1</button>
                            <button class="pill-btn-outline" style="padding: 3px 7px; font-size: 11px; font-weight: 700; border-radius: 6px;" 
                                    onclick="event.stopPropagation(); AdminWeb.adjustStock('${item.id}', ${stock + 5})" title="Tăng 5">+5</button>
                            <button class="pill-btn-outline" style="padding: 3px 7px; font-size: 11px; font-weight: 700; border-radius: 6px;" 
                                    onclick="event.stopPropagation(); AdminWeb.adjustStock('${item.id}', ${stock + 20})" title="Tăng 20">+20</button>
                            <button class="btn-submit-terracotta" style="padding: 3px 9px; font-size: 11px; font-weight: 700; border-radius: 6px; height: auto;" 
                                    onclick="event.stopPropagation(); AdminWeb.promptExactStock('${item.id}', ${stock})">Nhập số</button>
                          </div>
                        </td>

                        <!-- Cột 8: TRẠNG THÁI -->
                        <td style="padding: 12px 14px; text-align: center; white-space: nowrap;">
                          <span class="status-pill ${isAvailable ? 'status-completed' : 'status-cancelled'}" 
                                style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px;">
                            ${isAvailable ? 'Sẵn hàng' : 'Cảnh báo tồn'}
                          </span>
                        </td>

                        <!-- Cột 9: THAO TÁC (Sửa vàng / Xóa đỏ chuẩn 1:1 giống quản lý chi nhánh) -->
                        <td style="text-align: center; padding: 12px 14px; white-space: nowrap;">
                          <div style="display: inline-flex; gap: 6px;">
                            <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;"
                                    onclick="event.stopPropagation(); AdminWeb.editProductBottom('${item.productId}')" title="Chỉnh sửa sản phẩm">
                              Sửa
                            </button>
                            <button class="pill-btn-outline" style="padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 6px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" 
                                    onclick="event.stopPropagation(); AdminWeb.openUniversalDeleteModal('products', '${item.productId}')" title="Xóa sản phẩm">
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('') : `
                    <tr><td colspan="9" style="text-align: center; padding: 36px; color: var(--text-secondary); font-size: 13.5px;">Không tìm thấy bản ghi tồn kho nào phù hợp.</td></tr>
                  `}
                </tbody>
              </table>
            </div>
            ${this._renderPaginationControls(this.inventoryPage, invTotalPages, filtered.length, 'AdminWeb.setInventoryPage', 'sản phẩm')}
          </div>
          ${this._renderProductBottomEditor()}
        `;
      }

      // 2. Phân hệ Định Giá Lô FEFO (fefo)
      if (subType === 'fefo') {
        const normQ = this._normalizeSearchText(q);
        const filtered = fefoLots.filter(l => {
          if (!normQ) return true;
          const name = this._normalizeSearchText(l.productName || l.TenSanPham || '');
          const lot = this._normalizeSearchText(l.lotNumber || l.SoLo || '');
          const id = this._normalizeSearchText(l.productId || l.MaSanPham || l.id || l.MaChiTietPhieuNhap || '');
          const br = this._normalizeSearchText(l.branchName || l.TenChiNhanh || '');
          return name.includes(normQ) || lot.includes(normQ) || id.includes(normQ) || br.includes(normQ);
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
        if (this.inventoryPage > totalPages) this.inventoryPage = totalPages;
        const paged = filtered.slice((this.inventoryPage - 1) * this.pageSize, this.inventoryPage * this.pageSize);

        return `
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%; border-collapse: separate; border-spacing: 0;">
                <thead style="background: var(--surface-elevated); border-bottom: 2px solid var(--border-color);">
                  <tr>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">SỐ LÔ</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">SẢN PHẨM</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">CHI NHÁNH</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">HẠN SỬ DỤNG</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; text-align: center;">NGÀY CÒN LẠI</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; text-align: center;">TỒN KHẢ DỤNG</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">GIÁ NIÊM YẾT</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; text-align: center;">% GIẢM</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">GIÁ THỰC TẾ</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; text-align: center;">TÌNH TRẠNG</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.length > 0 ? paged.map(lot => {
                    const daysLeft = lot.daysLeft !== undefined ? lot.daysLeft : (lot.SoNgayConLai !== undefined ? lot.SoNgayConLai : 0);
                    const isExp = daysLeft <= 0;
                    const isNearExp = daysLeft > 0 && daysLeft <= 90;
                    const statusNote = lot.statusNote || lot.TinhTrangHang || '';
                    let stBadge = isExp
                      ? `<span class="status-pill status-cancelled" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px;">Đã hết hạn</span>`
                      : (isNearExp 
                          ? `<span class="status-pill" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">${this.escapeHtml(statusNote || 'Cận hạn giảm giá')}</span>` 
                          : `<span class="status-pill status-completed" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px;">${this.escapeHtml(statusNote || 'Hạn tốt')}</span>`);

                    const lotNumber = lot.lotNumber || lot.SoLo || '—';
                    const productName = lot.productName || lot.TenSanPham || 'Sản phẩm';
                    const branchName = lot.branchName || lot.TenChiNhanh || (lot.branchId || lot.MaChiNhanh ? ('Chi Nhánh ' + (lot.branchId || lot.MaChiNhanh)) : 'Toàn hệ thống');
                    const rawExp = lot.expiryDate || lot.HanSuDung;
                    const expDate = rawExp ? (typeof rawExp === 'string' ? (rawExp.includes('T') ? rawExp.split('T')[0] : (rawExp.includes(' ') && rawExp.length > 15 ? new Date(rawExp).toISOString().split('T')[0] : rawExp.split(' ')[0])) : (rawExp instanceof Date ? rawExp.toISOString().split('T')[0] : String(rawExp).split('T')[0])) : '—';
                    const remainingQty = lot.remainingQuantity !== undefined ? lot.remainingQuantity : (lot.SoLuongConLai !== undefined ? lot.SoLuongConLai : 0);
                    const origPrice = lot.originalPrice !== undefined ? lot.originalPrice : (lot.GiaNiemYetGoc !== undefined ? lot.GiaNiemYetGoc : 0);
                    const discountPct = lot.discountPercent !== undefined ? lot.discountPercent : (lot.PhanTramGiam !== undefined ? lot.PhanTramGiam : 0);
                    const actualPrice = lot.actualPrice !== undefined ? lot.actualPrice : (lot.GiaBanThucTe !== undefined ? lot.GiaBanThucTe : 0);

                    return `
                      <tr style="transition: background 0.15s ease; border-bottom: 1px solid var(--border-color);">
                        <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--text-primary); padding: 12px 14px;">${this.escapeHtml(lotNumber)}</td>
                        <td style="font-weight: 800; color: var(--text-primary); font-size: 13px; padding: 12px 14px;">${this.escapeHtml(productName)}</td>
                        <td style="color: var(--text-secondary); font-size: 12.5px; padding: 12px 14px;">${this.escapeHtml(branchName)}</td>
                        <td style="white-space: nowrap; font-size: 12px; color: var(--text-secondary); padding: 12px 14px;">${this.escapeHtml(expDate)}</td>
                        <td style="text-align: center; padding: 12px 14px;">
                          <strong style="color: ${isExp ? '#ef4444' : (isNearExp ? '#f59e0b' : '#10b981')}; font-size: 12.5px; font-weight: 800;">
                            ${daysLeft} ngày
                          </strong>
                        </td>
                        <td style="text-align: center; padding: 12px 14px;"><strong style="font-size: 13.5px; color: var(--text-primary);">${remainingQty}</strong></td>
                        <td style="text-decoration: ${discountPct > 0 ? 'line-through' : 'none'}; color: var(--text-secondary); font-size: 12.5px; padding: 12px 14px;">
                          ${SalonUtils.formatCurrency(origPrice)}
                        </td>
                        <td style="text-align: center; padding: 12px 14px;">
                          <span style="font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 6px; background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
                            -${discountPct}%
                          </span>
                        </td>
                        <td style="padding: 12px 14px; white-space: nowrap;">
                          <strong style="color: #f59e0b; font-size: 13px; font-weight: 800;">
                            ${SalonUtils.formatCurrency(actualPrice)}
                          </strong>
                        </td>
                        <td style="text-align: center; padding: 12px 14px; white-space: nowrap;">${stBadge}</td>
                      </tr>
                    `;
                  }).join('') : `
                    <tr><td colspan="10" style="text-align: center; padding: 36px; color: var(--text-secondary);">Không có dữ liệu lô hàng FEFO nào.</td></tr>
                  `}
                </tbody>
              </table>
            </div>
            ${this._renderPaginationControls(this.inventoryPage, totalPages, filtered.length, 'AdminWeb.setInventoryPage', 'lô hàng FEFO')}
          </div>
        `;
      }

      // 3. Phân hệ Phiếu Nhập Kho (receipts)
      if (subType === 'receipts') {
        const normQ = this._normalizeSearchText(q);
        const filtered = receipts.filter(r => {
          if (!normQ) return true;
          const id = this._normalizeSearchText(r.id || r.MaPhieuNhap || '');
          const sup = this._normalizeSearchText(r.supplierName || '');
          const br = this._normalizeSearchText(r.branchName || '');
          return id.includes(normQ) || sup.includes(normQ) || br.includes(normQ);
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
        if (this.inventoryPage > totalPages) this.inventoryPage = totalPages;
        const paged = filtered.slice((this.inventoryPage - 1) * this.pageSize, this.inventoryPage * this.pageSize);

        return `
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%; border-collapse: separate; border-spacing: 0;">
                <thead style="background: var(--surface-elevated); border-bottom: 2px solid var(--border-color);">
                  <tr>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">MÃ PHIẾU</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">CHI NHÁNH</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">NHÀ CUNG CẤP</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">NGƯỜI LẬP</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">NGƯỜI DUYỆT</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">NGÀY LẬP</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">TỔNG TIỀN</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; text-align: center;">MẶT HÀNG</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; text-align: center;">TRẠNG THÁI</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; text-align: center;">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.length > 0 ? paged.map(r => {
                    const rStatus = r.status || r.TrangThai || 'Đã duyệt';
                    const isApproved = (rStatus === 'Đã duyệt');
                    const isPending = (rStatus === 'Chờ duyệt');
                    return `
                      <tr style="transition: background 0.15s ease; border-bottom: 1px solid var(--border-color);">
                        <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--text-primary); padding: 12px 14px;">${this.escapeHtml(r.id || r.MaPhieuNhap)}</td>
                        <td style="color: var(--text-primary); font-weight: 600; font-size: 12.5px; padding: 12px 14px;">${this.escapeHtml(r.branchName || r.TenChiNhanh || (r.branchId || r.MaChiNhanh ? ('Chi Nhánh ' + (r.branchId || r.MaChiNhanh)) : 'Toàn hệ thống'))}</td>
                        <td style="font-weight: 700; color: var(--brand-accent); padding: 12px 14px;">${this.escapeHtml(r.supplierName || r.TenNhaCungCap || 'NCC Chính Hãng')}</td>
                        <td style="color: var(--text-secondary); font-size: 12.5px; padding: 12px 14px;">${this.escapeHtml(r.staffName || r.TenNguoiLap || 'Nhân viên kho')}</td>
                        <td style="color: var(--text-secondary); font-size: 12.5px; padding: 12px 14px;">${this.escapeHtml(r.approverName || r.TenNguoiDuyet || '—')}</td>
                        <td style="white-space: nowrap; font-size: 12px; color: var(--text-secondary); padding: 12px 14px;">${this.escapeHtml(r.createdDate || r.NgayLap || '—')}</td>
                        <td style="padding: 12px 14px; white-space: nowrap;">
                          <strong style="color: #10b981; font-size: 13px; font-weight: 800;">${SalonUtils.formatCurrency(r.total || r.TongTien)}</strong>
                        </td>
                        <td style="text-align: center; padding: 12px 14px;">
                          <span style="font-weight: 700; font-size: 11.5px; padding: 2px 8px; border-radius: 6px; background: rgba(255,255,255,0.06); color: var(--text-primary);">${r.itemCount || 1} mục</span>
                        </td>
                        <td style="text-align: center; padding: 12px 14px; white-space: nowrap;">
                          <span class="status-pill ${isApproved ? 'status-completed' : (isPending ? '' : 'status-cancelled')}"
                                style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; ${isPending ? 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);' : ''}">
                            ${this.escapeHtml(rStatus)}
                          </span>
                        </td>
                        <td style="text-align: center; padding: 12px 14px; white-space: nowrap;">
                          <div style="display: inline-flex; gap: 6px; align-items: center;">
                            <button class="pill-btn-outline" style="padding: 4px 12px; font-size: 11.5px; font-weight: 700; border-radius: 6px;" 
                                    onclick="AdminWeb.viewReceiptDetailModal('${r.id || r.MaPhieuNhap}')">Chi Tiết</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('') : `
                    <tr><td colspan="10" style="text-align: center; padding: 36px; color: var(--text-secondary);">Không tìm thấy phiếu nhập kho nào.</td></tr>
                  `}
                </tbody>
              </table>
            </div>
            ${this._renderPaginationControls(this.inventoryPage, totalPages, filtered.length, 'AdminWeb.setInventoryPage', 'phiếu nhập kho')}
          </div>
          ${this._renderReceiptBottomEditor()}
        `;
      }

      // 4. Phân hệ Danh Sách Nhà Cung Cấp Hàng Hóa (rules / NhaCungCap)
      if (subType === 'rules') {
        const normQ = this._normalizeSearchText(q);
        const filtered = suppliers.filter(s => {
          if (!normQ) return true;
          const id = this._normalizeSearchText(s.id || s.MaNhaCungCap || '');
          const name = this._normalizeSearchText(s.name || s.TenNhaCungCap || '');
          const phone = this._normalizeSearchText(s.phone || s.SoDienThoai || '');
          const email = this._normalizeSearchText(s.email || s.Email || '');
          return id.includes(normQ) || name.includes(normQ) || phone.includes(normQ) || email.includes(normQ);
        });

        const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
        if (this.inventoryPage > totalPages) this.inventoryPage = totalPages;
        const paged = filtered.slice((this.inventoryPage - 1) * this.pageSize, this.inventoryPage * this.pageSize);

        return `
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 26px;">
            <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                Danh Sách Nhà Cung Cấp Hàng Hóa &amp; Đối Tác Chính Hãng
              </h4>
              <span style="font-size: 12px; color: var(--text-secondary);">Tổng số: ${filtered.length} đối tác</span>
            </div>
            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%; border-collapse: separate; border-spacing: 0;">
                <thead style="background: var(--surface-elevated); border-bottom: 2px solid var(--border-color);">
                  <tr>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">MÃ ĐỐI TÁC</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">TÊN NHÀ CUNG CẤP</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">SỐ ĐIỆN THOẠI</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px;">EMAIL LIÊN HỆ</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; text-align: center;">TRẠNG THÁI</th>
                    <th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: var(--text-secondary); padding: 12px 14px; text-align: center;">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  ${paged.length > 0 ? paged.map(s => `
                    <tr style="transition: background 0.15s ease; border-bottom: 1px solid var(--border-color);">
                      <td style="white-space: nowrap; font-family: monospace; font-size: 12.5px; font-weight: 700; color: var(--text-primary); padding: 12px 14px;">${this.escapeHtml(s.id || s.MaNhaCungCap)}</td>
                      <td style="font-weight: 800; color: var(--text-primary); font-size: 13.5px; padding: 12px 14px;">${this.escapeHtml(s.name || s.TenNhaCungCap)}</td>
                      <td style="padding: 12px 14px;">
                        <a href="tel:${s.phone || s.SoDienThoai}" style="color: #f59e0b; font-weight: 700; text-decoration: none; font-size: 12.5px;">
                          ${this.escapeHtml(s.phone || s.SoDienThoai || '—')}
                        </a>
                      </td>
                      <td style="font-size: 12px; color: var(--text-secondary); padding: 12px 14px;">${this.escapeHtml(s.email || s.Email || '—')}</td>
                      <td style="text-align: center; padding: 12px 14px;">
                        <span class="status-pill status-completed" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 9999px;">
                          ${this.escapeHtml(s.status || 'Hoạt động')}
                        </span>
                      </td>
                      <td style="text-align: center; padding: 12px 14px; white-space: nowrap;">
                        <div style="display: inline-flex; gap: 6px;">
                          <button class="pill-btn-outline" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px;"
                                  onclick="event.stopPropagation(); AdminWeb.editSupplierBottom('${s.id || s.MaNhaCungCap}')" title="Chỉnh sửa đối tác">
                            Sửa
                          </button>
                          <button class="pill-btn-outline" style="padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 6px; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" 
                                  onclick="event.stopPropagation(); AdminWeb.deleteSupplierDirect('${s.id || s.MaNhaCungCap}')" title="Xóa nhà cung cấp">
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('') : `
                    <tr><td colspan="6" style="text-align: center; padding: 36px; color: var(--text-secondary);">Không tìm thấy nhà cung cấp nào phù hợp.</td></tr>
                  `}
                </tbody>
              </table>
            </div>
            ${this._renderPaginationControls(this.inventoryPage, totalPages, filtered.length, 'AdminWeb.setInventoryPage', 'đối tác')}
          </div>
          ${this._renderSupplierBottomEditor()}
        `;
      }
      return '';
    },

    _normalizeSearchText(str) {
      if (!str) return '';
      return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .trim();
    },

    handleInventorySearch(val) {
      this.inventorySearchQuery = val;
      this.inventoryPage = 1;
      const clearBtn = document.getElementById('adminInventorySearchClear');
      if (clearBtn) clearBtn.style.display = val ? 'inline-flex' : 'none';
      this._updateInventoryContentOnly();
    },

    clearInventorySearch() {
      this.inventorySearchQuery = '';
      this.inventoryPage = 1;
      const inp = document.getElementById('adminInventorySearchInput');
      if (inp) {
        inp.value = '';
        inp.focus();
      }
      const clearBtn = document.getElementById('adminInventorySearchClear');
      if (clearBtn) clearBtn.style.display = 'none';
      this._updateInventoryContentOnly();
    },

    _updateInventoryContentOnly() {
      const container = document.getElementById('adminInventoryContentContainer');
      if (container) {
        const user = this.getCurrentUser();
        const branchId = (this.isBranchManager(user) && user.branchId && user.branchId !== 'ALL') ? user.branchId : (this.filterBranch !== 'all' ? this.filterBranch : null);
        const isCashier = this.isCashier(user);
        const subType = isCashier ? 'receipts' : (this.inventorySubTab || 'stock');
        const inventory = (window.store && typeof window.store.getBranchInventory === 'function') ? window.store.getBranchInventory(branchId) : [];
        const fefoLots = (window.store && typeof window.store.getFefoLots === 'function') ? window.store.getFefoLots(branchId) : [];
        const receipts = (window.store && typeof window.store.getReceipts === 'function') ? window.store.getReceipts(branchId) : [];
        const suppliers = (window.store && typeof window.store.getSuppliers === 'function') ? window.store.getSuppliers() : [];
        const discountRules = (window.store && typeof window.store.getDiscountRules === 'function') ? window.store.getDiscountRules() : [];
        const q = (this.inventorySearchQuery || '').trim();
        container.innerHTML = this._renderInventoryContent(subType, { inventory, fefoLots, receipts, suppliers, discountRules, q });
      } else {
        this.refreshInventoryView();
      }
    },

    async approveReceipt(receiptId) {
      if (!receiptId) return;
      if (!confirm('Xác nhận phê duyệt phiếu nhập #' + receiptId + ' và cộng dồn số lượng vào tồn kho?')) return;
      const user = this.getCurrentUser();
      const approverId = user?.staffId || user?.MaNhanVien || 'NV01';
      const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('OMNISALON_JWT_ACCESS_TOKEN') : '';
      try {
        const res = await fetch('/api/inventory/receipts/' + encodeURIComponent(receiptId) + '/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
          },
          body: JSON.stringify({ approverId })
        });
        const data = await res.json();
        if (data && data.success) {
          if (window.UICommon) window.UICommon.showToast(data.message || 'Đã duyệt phiếu nhập thành công!', 'success');
          if (window.store && typeof window.store.fetchReceipts === 'function') await window.store.fetchReceipts();
          if (window.store && typeof window.store.fetchInventory === 'function') await window.store.fetchInventory();
          this.refreshInventoryView();
        } else {
          if (window.UICommon) window.UICommon.showToast(data?.error || 'Lỗi khi duyệt phiếu nhập', 'error');
        }
      } catch (e) {
        if (window.UICommon) window.UICommon.showToast('Lỗi kết nối khi duyệt phiếu nhập', 'error');
      }
    },

    rejectReceiptModal(receiptId) {
      if (!receiptId) return;
      this._openModal(`
        <div style="max-width: 480px; margin: 0 auto;">
          <div class="badge-terracotta" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">TỪ CHỐI PHIẾU NHẬP KHO</div>
          <h2 style="font-size: 18px; font-weight: 800; margin: 8px 0 14px; color: #f87171;">TỪ CHỐI PHIẾU #${this.escapeHtml(receiptId)}</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">
            Vui lòng nhập lý do từ chối phiếu nhập kho này. Lý do sẽ được lưu vào cơ sở dữ liệu và hiển thị trong chi tiết phiếu.
          </p>
          <form onsubmit="event.preventDefault(); AdminWeb.confirmRejectReceipt('${receiptId}');">
            <div style="margin-bottom: 16px;">
              <label class="sub-label">Lý Do Từ Chối (Bắt buộc): <span style="color:#ef4444;">*</span></label>
              <textarea id="rejectReceiptReasonInput" class="form-control-custom" rows="4" style="font-size: 13.5px; line-height: 1.5;" placeholder="Nhập lý do từ chối cụ thể tối thiểu 3 ký tự..." required>Thông tin lô hàng hoặc đơn giá không hợp lệ</textarea>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" class="btn-cancel" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
              <button type="submit" class="btn-submit-terracotta" style="background: #ef4444; border-color: #ef4444;">Xác Nhận Từ Chối</button>
            </div>
          </form>
        </div>
      `);
    },

    async confirmRejectReceipt(receiptId) {
      const reasonInput = document.getElementById('rejectReceiptReasonInput');
      const cleanReason = (reasonInput?.value || '').trim();
      if (!cleanReason || cleanReason.length < 3) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng cung cấp lý do từ chối cụ thể tối thiểu 3 ký tự', 'warning');
        return;
      }
      const user = this.getCurrentUser();
      const approverId = user?.staffId || user?.MaNhanVien || 'NV01';
      const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('OMNISALON_JWT_ACCESS_TOKEN') : '';
      try {
        const res = await fetch('/api/inventory/receipts/' + encodeURIComponent(receiptId) + '/reject', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
          },
          body: JSON.stringify({ approverId, reason: cleanReason })
        });
        const data = await res.json();
        if (data && data.success) {
          this._closeModal();
          if (window.UICommon) window.UICommon.showToast(data.message || 'Đã từ chối phiếu nhập!', 'warning');
          if (window.store && typeof window.store.fetchReceipts === 'function') await window.store.fetchReceipts();
          this.refreshInventoryView();
        } else {
          if (window.UICommon) window.UICommon.showToast(data?.error || 'Lỗi khi từ chối phiếu nhập', 'error');
        }
      } catch (e) {
        if (window.UICommon) window.UICommon.showToast('Lỗi kết nối khi từ chối phiếu nhập', 'error');
      }
    },
    refreshInventoryView() {
      const content = document.getElementById('adminSubTabContent');
      if (content && (this.adminSubTab === 'inventory' || this.adminSubTab === 'receipts')) {
        const user = this.getCurrentUser();
        const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
        content.innerHTML = this.renderInventoryTab(user, branches);
        return;
      }
      const container = document.getElementById('webMainContainer');
      if (container && (this.adminSubTab === 'inventory' || this.adminSubTab === 'receipts')) {
        this.render(container);
      }
    },

    adjustStock(invId, newStock) {
      const val = Math.max(0, parseInt(newStock) || 0);
      window.store.updateProductStock(invId, val);
      if (window.UICommon) window.UICommon.showToast(`Đã cập nhật tồn kho: ${val} sản phẩm!`);
      this.refreshInventoryView();
    },

    promptExactStock(invId, currentStock) {
      const modalHtml = `
        <div style="padding: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0;">Kiểm Kê Tồn Kho Thực Tế</h3>
            <button type="button" onclick="AdminWeb._closeModal()" style="background: none; border: none; font-size: 18px; color: var(--text-secondary); cursor: pointer;">✕</button>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">
            Nhập số lượng tồn kho thực tế sau kiểm đếm tại quầy/kệ để đồng bộ CSDL:
          </p>
          <div style="margin-bottom: 18px;">
            <input type="number" id="customStockInput" class="form-control-custom" min="0" value="${currentStock}" 
                   style="height: 42px; font-size: 16px; font-weight: 800; width: 100%; border-radius: 8px; padding: 0 14px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--brand-accent, #C59B27);">
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" class="pill-btn-outline" style="padding: 8px 18px; font-size: 12.5px; font-weight: 700;" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
            <button type="button" class="btn-submit-terracotta" style="padding: 8px 20px; font-size: 12.5px; font-weight: 800; cursor: pointer;" 
                    onclick="const v = document.getElementById('customStockInput').value; AdminWeb._closeModal(); if(v !== '' && !isNaN(v)) AdminWeb.adjustStock('${invId}', parseInt(v));">
              Lưu Kiểm Kê
            </button>
          </div>
        </div>
      `;
      this._openModal(modalHtml);
    },

    openProductModal(productId = null) {
      const isEdit = !!productId;
      const product = isEdit ? window.store.getProductById(productId) : null;
      const currentStock = productId ? window.store.getProductStock(null, productId) : 25;
      const stockVal = product?.stock !== undefined ? product.stock : currentStock;
      const rawImg = product?.image || product?.HinhAnh || '';
      const displayImg = typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function'
        ? SalonUtils.formatImageUrl(rawImg)
        : (rawImg || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');

      let stockBadgeHtml = '';
      if (stockVal > 5) {
        stockBadgeHtml = `<span class="stock-badge-safe" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">✓ CÒN HÀNG (${stockVal} SP)</span>`;
      } else if (stockVal > 0) {
        stockBadgeHtml = `<span class="stock-badge-low" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">SẮP HẾT HÀNG (${stockVal} SP)</span>`;
      } else {
        stockBadgeHtml = `<span class="stock-badge-critical" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">HẾT HÀNG (0 SP)</span>`;
      }

      this._openModal(`
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 14px; margin-bottom: 20px;">
            <div>
              <div class="badge-terracotta" style="margin-bottom: 6px;">QUẢN LÝ KHO &amp; SẢN PHẨM RETAIL</div>
              <h2 style="font-size: 22px; font-weight: 800; margin: 0; color: #FFFFFF; letter-spacing: -0.01em;">
                ${isEdit ? 'CHỈNH SỬA THÔNG TIN SẢN PHẨM' : 'THÊM MỚI SẢN PHẨM VÀO KHO'}
              </h2>
            </div>
            <div style="text-align: right; font-size: 12px; color: var(--color-text-muted, #94a3b8);">
              Mã sản phẩm: <strong style="color: #f59e0b; font-family: monospace; font-size: 14px;">${this.escapeHtml(productId || 'NEW_ITEM')}</strong>
            </div>
          </div>

          <form onsubmit="event.preventDefault(); AdminWeb.submitProductForm('${productId || ''}');">
            <div class="product-modal-grid">
              <!-- CỘT TRÁI: LIVE IMAGE PREVIEW & TRẠNG THÁI TỒN KHO -->
              <div class="product-modal-preview-card">
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Ảnh Xem Trước</span>
                  <span style="font-size: 11px; color: #f59e0b; background: rgba(245, 158, 11, 0.12); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Live Preview</span>
                </div>

                <div class="product-modal-img-wrapper">
                  <img id="modalPreviewImg" src="${displayImg}" 
                       alt="${this.escapeHtml(product?.name || 'Ảnh sản phẩm')}" 
                       onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');">
                </div>

                <div id="modalStockStatusBox" style="width: 100%; margin-bottom: 12px;">
                  ${stockBadgeHtml}
                </div>

                <div style="width: 100%; background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px; font-size: 12px; color: #94a3b8; text-align: left; line-height: 1.5;">
                  <strong>Ghi chú:</strong> Khi thay đổi đường dẫn ảnh hoặc số lượng tồn kho bên phải, khung xem trước và trạng thái sẽ tự động cập nhật ngay lập tức.
                </div>
              </div>

              <!-- CỘT PHẢI: FORM CÁC TRƯỜNG DỮ LIỆU RỘNG RÃI -->
              <div>
                <div style="margin-bottom: 14px;">
                  <label class="sub-label">Tên Sản Phẩm <span style="color: #ef4444;">*</span>:</label>
                  <input type="text" id="prodName" class="form-control-custom" style="font-size: 15px; font-weight: 600;" placeholder="VD: Sáp Brosh Matte Clay 115g..." value="${this.escapeHtml(product?.name || product?.TenSanPham || '')}" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <div>
                    <label class="sub-label">Thương Hiệu / Hãng <span style="color: #ef4444;">*</span>:</label>
                    <input type="text" id="prodBrand" class="form-control-custom" placeholder="VD: Hanz de Fuko, Brosh, Reuzel..." value="${this.escapeHtml(product?.brand || 'CHÍNH HÃNG')}" required>
                  </div>
                  <div>
                    <label class="sub-label">Số Lượng Tồn Kho <span style="color: #ef4444;">*</span>:</label>
                    <input type="number" id="prodStock" class="form-control-custom" placeholder="25" value="${stockVal}" required min="0" oninput="AdminWeb._updateModalStockBadge(this.value)">
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <div>
                    <label class="sub-label">Đơn Giá Bán Ra VNĐ <span style="color: #ef4444;">*</span>:</label>
                    <input type="number" id="prodPrice" class="form-control-custom" style="font-weight: 700; color: #fbbf24 !important;" placeholder="350000" value="${product?.originalPrice || product?.GiaBan || product?.price || ''}" required min="1000">
                    <span style="font-size: 11px; color: #94a3b8;">Giá niêm yết bán cho khách</span>
                  </div>
                  <div>
                    <label class="sub-label">Giá Gốc / Giá Nhập Kho VNĐ <span style="color: #ef4444;">*</span>:</label>
                    <input type="number" id="prodCostPrice" class="form-control-custom" style="font-weight: 700; color: #10b981 !important;" placeholder="245000" value="${product?.costPrice || product?.GiaNhap || (product?.price ? Math.round(product.price * 0.7) : 245000)}" required min="1000">
                    <span style="font-size: 11px; color: #10b981;">Giá vốn thực tế khi nhập hàng</span>
                  </div>
                </div>

                <div style="margin-bottom: 14px;">
                  <label class="sub-label">Đường Dẫn Ảnh Men_Grooming_Products/... hoặc Link URL:</label>
                  <input type="text" id="prodImage" class="form-control-custom" placeholder="Men_Grooming_Products/... hoặc https://..." value="${this.escapeHtml(rawImg)}" oninput="AdminWeb._updateModalPreviewImage(this.value)">
                </div>

                <div style="margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <label class="sub-label" style="margin-bottom: 0;">Mô Tả Sản Phẩm &amp; Thông Số Chi Tiết:</label>
                    <span style="font-size: 12px; color: #94a3b8;">Có thể kéo góc dưới để mở rộng thêm</span>
                  </div>
                  <textarea id="prodDescription" class="form-control-custom" rows="6" style="min-height: 160px; font-size: 14.5px; line-height: 1.6; padding: 14px 16px;" placeholder="Ví dụ: Tạo texture, tăng độ phồng, giữ tóc vào nếp với hiệu ứng mờ tự nhiên...&#10;- Dung tích: 80g&#10;- Độ giữ nếp: Cao (High Hold)&#10;- Độ bóng: Mờ (Matte Finish)&#10;- Mùi hương: Hương nước hoa nam thanh lịch...">${this.escapeHtml(product?.description || product?.MoTa || '')}</textarea>
                </div>

                <div style="display: flex; gap: 14px; margin-top: 8px;">
                  <button type="button" class="btn-cancel" style="flex: 1; min-height: 48px; font-size: 15px; font-weight: 700; cursor: pointer;" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
                  <button type="submit" class="btn-submit-terracotta" style="flex: 1.6; min-height: 48px; font-size: 15px; font-weight: 800; cursor: pointer;">
                    ${isEdit ? 'Cập Nhật Sản Phẩm' : 'Lưu Sản Phẩm Vào Kho'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      `, true);
    },

    async submitProductForm(productId) {
      const name = (document.getElementById('prodName')?.value || '').trim();
      const brand = (document.getElementById('prodBrand')?.value || '').trim();
      const price = Number(document.getElementById('prodPrice')?.value) || 0;
      const costPrice = Number(document.getElementById('prodCostPrice')?.value) || Math.round(price * 0.7);
      const oldPrice = price;
      const stock = Math.max(0, parseInt(document.getElementById('prodStock')?.value) || 0);
      const image = (document.getElementById('prodImage')?.value || '').trim();
      const description = (document.getElementById('prodDescription')?.value || '').trim();

      if (!name || price <= 0) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập tên sản phẩm và giá bán hợp lệ!', 'warning');
        else alert('Vui lòng nhập tên sản phẩm và giá bán hợp lệ!');
        return;
      }

      if (productId) {
        await window.store.updateProduct(productId, { name, brand, price, originalPrice: price, GiaBan: price, costPrice, GiaNhap: costPrice, oldPrice: price, stock, image, description });
        if (window.UICommon) window.UICommon.showToast(`Đã cập nhật sản phẩm [${name}]!`);
      } else {
        await window.store.addProduct({ name, brand, price, originalPrice: price, GiaBan: price, costPrice, GiaNhap: costPrice, oldPrice: price, stock, image, description });
        if (window.UICommon) window.UICommon.showToast(`Đã thêm mới sản phẩm [${name}] vào kho hàng!`);
      }

      this._closeModal();
      this.refreshInventoryView();
    },

    deleteInventoryProduct(productId) {
      this.openUniversalDeleteModal('products', productId);
    },

    openDeleteConfirmModal(productId) {
      this.openUniversalDeleteModal('products', productId);
    },

    executeDeleteProduct(productId) {
      this.executeUniversalDelete('products', productId);
    },

    // -----------------------------------------------------------------------
    // QUẢN LÝ PHIẾU NHẬP KHO, INVENTORY RECEIPTS - SQL PHIEUNHAPKHO & CHITIETPHIEUNHAP
    // -----------------------------------------------------------------------
    // Multi-item Receipt State & Management
    openAddReceiptModal() {
      const user = this.getCurrentUser();
      const branches = window.store.getBranches() || [];
      const suppliers = window.store.getSuppliers() || [];
      const products = window.store.getProducts() || [];
      const isSuper = this.isSuperAdmin(user);
      const isManager = this.isBranchManager(user);
      const branchId = (isManager && user.branchId) ? user.branchId : (this.filterBranch !== 'all' ? this.filterBranch : 'CN01');
      const creatorName = user ? (user.fullName || user.name || user.username || 'Nhân viên') : 'Nhân viên kho';
      const isStaffOnly = !isSuper && !isManager;

      // Sinh mã lô chuẩn LOyyyyMM A001
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const defaultLotPrefix = 'LO' + yr + mo + 'A';

      // Khởi tạo danh sách dòng sản phẩm nhập kho
      this._receiptItems = [
        {
          id: Date.now(),
          productId: products[0]?.id || 'SP01',
          quantity: 10,
          costPrice: products[0]?.costPrice || products[0]?.GiaNhap || 150000,
          lotNumber: defaultLotPrefix + '001',
          expiryDate: new Date(now.getTime() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]
        }
      ];

      this._openModal(`
        <div style="max-width: 960px; margin: 0 auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div>
              <div class="badge-terracotta">QUẢN LÝ KHO &amp; NHẬP HÀNG</div>
              <h2 style="font-size: 20px; font-weight: 800; margin: 6px 0 2px;">LẬP PHIẾU NHẬP KHO NHIỀU MẶT HÀNG</h2>
              <div style="font-size: 13px; color: var(--text-secondary);">
                Người lập phiếu: <strong style="color: #f59e0b;">${this.escapeHtml(creatorName)}</strong> 
                • <span>Phiếu nhập kho</span>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; color: var(--text-secondary);">Ngày lập phiếu:</span>
              <div style="font-size: 14px; font-weight: 700; color: var(--text-primary);">${now.toLocaleDateString('vi-VN')}</div>
            </div>
          </div>

          <form onsubmit="event.preventDefault(); AdminWeb.submitMultiItemReceipt();">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; background: var(--surface-card); padding: 14px; border-radius: 10px; border: 1px solid var(--border-color);">
              <div>
                <label class="sub-label">Chi Nhánh Nhập Hàng: <span style="color:#ef4444;">*</span></label>
                ${(isManager || isStaffOnly) ? `
                  <input type="hidden" id="receiptBranchId" value="${branchId}">
                  <input type="text" class="form-control-custom" value="${this.escapeHtml(this._getBranchShortName(branchId))}" disabled>
                ` : `
                  <select id="receiptBranchId" class="form-control-custom">
                    ${branches.map(b => `<option value="${b.id}" ${b.id === branchId ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                  </select>
                `}
              </div>
              <div>
                <label class="sub-label">Nhà Cung Cấp Hàng Hóa: <span style="color:#ef4444;">*</span></label>
                <select id="receiptSupplierId" class="form-control-custom" required>
                  ${suppliers.map(s => `<option value="${s.id || s.MaNhaCungCap}">${this.escapeHtml(s.name || s.TenNhaCungCap)}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- BẢNG NHẬP NHIỀU MẶT HÀNG DYNAMIC -->
            <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 style="font-size: 14px; font-weight: 800; margin: 0; color: #f59e0b;">Danh Sách Mặt Hàng Nhập Kho</h4>
                <button type="button" class="btn-submit-terracotta" style="padding: 6px 14px; font-size: 12px; font-weight: 700; background: #0284c7;" onclick="AdminWeb._addReceiptRow();">
                  + Thêm Mặt Hàng
                </button>
              </div>

              <div style="overflow-x: auto;">
                <table class="admin-enterprise-table" style="font-size: 12.5px;">
                  <thead>
                    <tr>
                      <th style="min-width: 220px;">Sản Phẩm</th>
                      <th style="width: 90px; text-align: center;">Số Lượng</th>
                      <th style="min-width: 130px;">Giá Nhập VNĐ</th>
                      <th style="min-width: 140px;">Số Lô FEFO</th>
                      <th style="min-width: 130px;">Hạn Dùng EXP</th>
                      <th style="min-width: 120px; text-align: right;">Thành Tiền</th>
                      <th style="width: 44px; text-align: center;">Xóa</th>
                    </tr>
                  </thead>
                  <tbody id="receiptRowsTbody">
                    ${this._renderReceiptRowsHtml()}
                  </tbody>
                </table>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 14px 20px; background: rgba(16, 185, 129, 0.08); border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.25);">
              <div>
                <span style="font-weight: 800; font-size: 15px; color: var(--text-primary);">Tổng Giá Trị Phiếu Nhập:</span>
                <span id="receiptTotalItemsCount" style="font-size: 13px; color: var(--text-secondary); margin-left: 8px;">(1 mặt hàng)</span>
              </div>
              <strong id="receiptGrandTotalDisplay" style="font-size: 22px; color: #10b981; font-weight: 900;">1.500.000 đ</strong>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 12px;">
              <button type="button" class="btn-cancel" style="min-height: 44px; padding: 0 20px;" onclick="AdminWeb._closeModal()">Hủy Bỏ</button>
              <button type="submit" class="btn-submit-terracotta" style="min-height: 44px; padding: 0 24px; font-weight: 800;">
                Lưu
              </button>
            </div>
          </form>
        </div>
      `);

      this._recalculateReceiptGrandTotal();
    },

    _renderReceiptRowsHtml() {
      const products = window.store.getProducts() || [];
      return (this._receiptItems || []).map((row, idx) => {
        const lineTotal = (row.quantity || 0) * (row.costPrice || 0);
        return `
          <tr id="receiptRow_${row.id}">
            <td>
              <select class="form-control-custom" style="padding: 6px 10px; font-size: 12.5px;" onchange="AdminWeb._onReceiptRowProductChange(${idx}, this.value)">
                ${products.map(p => `<option value="${p.id || p.MaSanPham}" ${(p.id || p.MaSanPham) === row.productId ? 'selected' : ''}>${this.escapeHtml(p.name || p.TenSanPham)} (${p.id || p.MaSanPham})</option>`).join('')}
              </select>
            </td>
            <td>
              <input type="number" class="form-control-custom" style="padding: 6px 8px; font-size: 12.5px; text-align: center;" min="1" value="${row.quantity}" oninput="AdminWeb._onReceiptRowQtyChange(${idx}, this.value)">
            </td>
            <td>
              <input type="number" class="form-control-custom" style="padding: 6px 8px; font-size: 12.5px;" min="1000" step="1000" value="${row.costPrice}" oninput="AdminWeb._onReceiptRowCostChange(${idx}, this.value)">
            </td>
            <td>
              <input type="text" class="form-control-custom" style="padding: 6px 8px; font-size: 12px; font-family: monospace;" value="${this.escapeHtml(row.lotNumber)}" oninput="AdminWeb._receiptItems[${idx}].lotNumber = this.value">
            </td>
            <td>
              <input type="date" class="form-control-custom" style="padding: 6px 8px; font-size: 12px;" value="${row.expiryDate}" oninput="AdminWeb._receiptItems[${idx}].expiryDate = this.value">
            </td>
            <td style="text-align: right; font-weight: 800; color: #10b981; font-size: 13px;" id="receiptLineTotal_${idx}">
              ${SalonUtils.formatCurrency(lineTotal)}
            </td>
            <td style="text-align: center;">
              ${(this._receiptItems.length > 1) ? `
                <button type="button" style="background: none; border: none; color: #ef4444; font-size: 16px; cursor: pointer; padding: 2px 6px;" onclick="AdminWeb._removeReceiptRow(${idx})" title="Xóa mặt hàng này">✕</button>
              ` : `
                <span style="color: var(--text-secondary); opacity: 0.4;">—</span>
              `}
            </td>
          </tr>
        `;
      }).join('');
    },

    _addReceiptRow() {
      const products = window.store.getProducts() || [];
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const seq = String(this._receiptItems.length + 1).padStart(3, '0');
      const defaultLot = 'LO' + yr + mo + 'A' + seq;

      const p0 = products[this._receiptItems.length % products.length] || products[0];
      this._receiptItems.push({
        id: Date.now() + Math.random(),
        productId: p0?.id || 'SP01',
        quantity: 10,
        costPrice: p0?.costPrice || p0?.GiaNhap || 150000,
        lotNumber: defaultLot,
        expiryDate: new Date(now.getTime() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]
      });

      const tbody = document.getElementById('receiptRowsTbody');
      if (tbody) tbody.innerHTML = this._renderReceiptRowsHtml();
      this._recalculateReceiptGrandTotal();
    },

    _removeReceiptRow(idx) {
      if (this._receiptItems.length <= 1) return;
      this._receiptItems.splice(idx, 1);
      const tbody = document.getElementById('receiptRowsTbody');
      if (tbody) tbody.innerHTML = this._renderReceiptRowsHtml();
      this._recalculateReceiptGrandTotal();
    },

    _onReceiptRowProductChange(idx, prodId) {
      const p = window.store.getProductById(prodId);
      if (this._receiptItems[idx]) {
        this._receiptItems[idx].productId = prodId;
        if (p) {
          this._receiptItems[idx].costPrice = p.costPrice || p.GiaNhap || Math.round((p.price || 200000) * 0.7);
        }
      }
      const tbody = document.getElementById('receiptRowsTbody');
      if (tbody) tbody.innerHTML = this._renderReceiptRowsHtml();
      this._recalculateReceiptGrandTotal();
    },

    _onReceiptRowQtyChange(idx, val) {
      const qty = parseInt(val, 10) || 0;
      if (this._receiptItems[idx]) {
        this._receiptItems[idx].quantity = qty;
        const lineTotal = qty * (this._receiptItems[idx].costPrice || 0);
        const cell = document.getElementById('receiptLineTotal_' + idx);
        if (cell) cell.textContent = SalonUtils.formatCurrency(lineTotal);
      }
      this._recalculateReceiptGrandTotal();
    },

    _onReceiptRowCostChange(idx, val) {
      const cost = parseFloat(val) || 0;
      if (this._receiptItems[idx]) {
        this._receiptItems[idx].costPrice = cost;
        const lineTotal = (this._receiptItems[idx].quantity || 0) * cost;
        const cell = document.getElementById('receiptLineTotal_' + idx);
        if (cell) cell.textContent = SalonUtils.formatCurrency(lineTotal);
      }
      this._recalculateReceiptGrandTotal();
    },

    _recalculateReceiptGrandTotal() {
      let grandTotal = 0;
      let totalQty = 0;
      (this._receiptItems || []).forEach(row => {
        grandTotal += (row.quantity || 0) * (row.costPrice || 0);
        totalQty += (row.quantity || 0);
      });
      const grandEl = document.getElementById('receiptGrandTotalDisplay');
      if (grandEl) grandEl.textContent = SalonUtils.formatCurrency(grandTotal);
      const countEl = document.getElementById('receiptTotalItemsCount');
      if (countEl) countEl.textContent = '(' + (this._receiptItems?.length || 0) + ' mặt hàng, ' + totalQty + ' sản phẩm)';
    },

    async submitMultiItemReceipt() {
      const branchId = document.getElementById('receiptBranchId')?.value || 'CN01';
      const supplierId = document.getElementById('receiptSupplierId')?.value || 'NCC01';
      const user = this.getCurrentUser();
      const status = 'Đã duyệt';
      const staffId = user?.staffId || user?.MaNhanVien || 'NV01';

      if (!this._receiptItems || this._receiptItems.length === 0) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng thêm ít nhất một mặt hàng nhập kho!', 'warning');
        return;
      }

      let grandTotal = 0;
      const formattedItems = this._receiptItems.map(it => {
        const line = (it.quantity || 0) * (it.costPrice || 0);
        grandTotal += line;
        return {
          productId: it.productId,
          quantity: it.quantity,
          costPrice: it.costPrice,
          lotNumber: it.lotNumber,
          expiryDate: it.expiryDate
        };
      });

      const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('OMNISALON_JWT_ACCESS_TOKEN') : '';
      try {
        const res = await fetch('/api/inventory/receipts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
          },
          body: JSON.stringify({
            branchId,
            supplierId,
            staffId,
            items: formattedItems,
            total: grandTotal,
            status
          })
        });
        const data = await res.json();
        if (data && data.success) {
          const msg = 'Đã lưu phiếu nhập #' + data.id + ' thành công! Tồn kho đã được cập nhật.';
          if (window.UICommon) {
            window.UICommon.closeGlobalModal();
            window.UICommon.showToast(msg, 'success');
          }
          if (window.store && typeof window.store.fetchReceipts === 'function') await window.store.fetchReceipts();
          if (window.store && typeof window.store.fetchInventory === 'function') await window.store.fetchInventory();
          this.resetReceiptBottomEditor();
          this.refreshInventoryView();
        } else {
          if (window.UICommon) window.UICommon.showToast(data?.error || 'Lỗi khi lập phiếu nhập kho', 'error');
        }
      } catch (e) {
        if (window.UICommon) window.UICommon.showToast('Lỗi kết nối khi gửi phiếu nhập kho', 'error');
      }
    },

    async viewReceiptDetailModal(receiptId) {
      let receipt = null;
      try {
        const res = await fetch(`${window.store.liveServerUrl}/inventory/receipts/${receiptId}`);
        if (res.ok) {
          receipt = await res.json();
        }
      } catch (_) {}
      if (!receipt) {
        receipt = window.store.getReceiptById(receiptId);
      }
      if (!receipt) {
        if (window.UICommon) window.UICommon.showToast('Không tìm thấy thông tin phiếu nhập kho!', 'warning');
        return;
      }

      const items = receipt.items || [];
      this._openModal(`
        <div style="max-width: 700px; margin: 0 auto;">
          <div class="badge-terracotta">CHI TIẾT PHIẾU NHẬP KHO</div>
          <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0 14px;">MÃ PHIẾU: #${this.escapeHtml(receipt.id || receipt.MaPhieuNhap)}</h2>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color, rgba(255,255,255,0.08)); border-radius: 10px; padding: 14px; margin-bottom: 16px;">
            <div>
              <div style="font-size: 12px; color: #888;">Chi Nhánh:</div>
              <strong style="font-size: 14px;">${this.escapeHtml(receipt.branchName || `Chi Nhánh ${receipt.branchId}`)}</strong>
            </div>
            <div>
              <div style="font-size: 12px; color: #888;">Nhà Cung Cấp:</div>
              <strong style="font-size: 14px; color: #f59e0b;">${this.escapeHtml(receipt.supplierName || 'NCC Chính Hãng')}</strong>
            </div>
            <div>
              <div style="font-size: 12px; color: #888;">Người Lập Phiếu:</div>
              <div>${this.escapeHtml(receipt.staffName || 'Quản lý kho')}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #888;">Ngày Lập:</div>
              <div>${this.escapeHtml(receipt.createdDate || receipt.NgayLap || '—')}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #888;">Trạng Thái:</div>
              <span class="${(receipt.status || receipt.TrangThai) === 'Đã từ chối' ? 'stock-badge-critical' : 'stock-badge-safe'}">${this.escapeHtml(receipt.status || receipt.TrangThai || 'Đã duyệt')}</span>
            </div>
            <div>
              <div style="font-size: 12px; color: #888;">Tổng Tiền:</div>
              <strong style="font-size: 16px; color: #10b981;">${SalonUtils.formatCurrency(receipt.total || receipt.TongTien)}</strong>
            </div>
          </div>

          ${(receipt.rejectReason || receipt.LyDoTuChoi || (receipt.status || receipt.TrangThai) === 'Đã từ chối') ? `
            <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; color: #ef4444; font-size: 13px;">
              <strong>⚠️ Lý Do Từ Chối Phiếu:</strong> ${this.escapeHtml(receipt.rejectReason || receipt.LyDoTuChoi || 'Không đạt tiêu chuẩn kiểm định lô hàng')}
            </div>
          ` : ''}

          <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">Danh Sách Mặt Hàng Trong Phiếu (${items.length}):</h4>
          <div style="overflow-x: auto; margin-bottom: 16px;">
            <table class="admin-enterprise-table">
              <thead>
                <tr>
                  <th>Mã SP</th>
                  <th>Tên Sản Phẩm</th>
                  <th>Số Lô</th>
                  <th>Hạn Sử Dụng</th>
                  <th style="text-align: center;">Số Lượng</th>
                  <th style="text-align: right;">Đơn Giá Nhập</th>
                  <th style="text-align: right;">Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                ${items.length > 0 ? items.map(it => `
                  <tr>
                    <td><strong>${this.escapeHtml(it.productId || it.id)}</strong></td>
                    <td style="font-weight: 700;">${this.escapeHtml(it.productName || it.name || 'Sản phẩm')}</td>
                    <td>${this.escapeHtml(it.lotNumber || '—')}</td>
                    <td style="white-space: nowrap;">${this.escapeHtml(it.expiryDate || '—')}</td>
                    <td style="text-align: center; font-weight: 800;">${it.quantity || it.qty || 0}</td>
                    <td style="text-align: right; color: #10b981;">${SalonUtils.formatCurrency(it.costPrice || it.price)}</td>
                    <td style="text-align: right; font-weight: 800; color: #f59e0b;">${SalonUtils.formatCurrency(it.total || (it.quantity * it.costPrice))}</td>
                  </tr>
                `).join('') : `
                  <tr><td colspan="7" style="text-align: center; padding: 20px; color: #888;">Chi tiết mặt hàng lô theo phiếu nhập kho.</td></tr>
                `}
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="button" class="btn-cancel" onclick="AdminWeb._closeModal()">Đóng Cửa Sổ</button>
          </div>
        </div>
      `);
    },

    
    // -----------------------------------------------------------------------
    // BOTTOM EDITORS CHUẨN FORM QUẢN LÝ CHUỖI CHI NHÁNH (2 CỘT LIỀN MẠCH 1:1)
    // -----------------------------------------------------------------------
    _renderProductBottomEditor() {
      const productPresets = [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1512290900672-1f5bebb1d5f7?auto=format&fit=crop&w=400&q=80'
      ];

      return `
        <div id="adminProductBottomEditor" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px 26px; margin-top: 24px; width: 100%; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08)); padding-bottom: 16px; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <h3 id="productEditorTitle" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">
                Thêm Sản Phẩm Mới
              </h3>
            </div>
            <div>
              <button type="button" class="pill-btn-outline" style="padding: 5px 14px; font-size: 12px; font-weight: 600;" onclick="AdminWeb.resetProductBottomEditor()">
                Đặt Lại / Làm Trống
              </button>
            </div>
          </div>

          <form id="productBottomForm" onsubmit="event.preventDefault(); AdminWeb.submitProductBottomEditor();">
            <input type="hidden" id="prodEditorId" value="">

            <div style="display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(340px, 380px); gap: 28px; align-items: start;">
              
              <!-- CỘT TRÁI: FORM LIỀN MẠCH -->
              <div style="display: flex; flex-direction: column;">
                
                <!-- PHẦN 1: THÔNG TIN SẢN PHẨM & THƯƠNG HIỆU -->
                <div style="margin-bottom: 6px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27); margin-bottom: 14px;">
                    Thông tin sản phẩm &amp; thương hiệu
                  </div>

                  <!-- Hàng 1: Tên sản phẩm & Thương hiệu -->
                  <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 14px;">
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Tên Sản Phẩm <span style="color: #ef4444;">*</span>
                      </label>
                      <input type="text" id="prodEditorName" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                             placeholder="VD: Sáp Brosh Matte Clay 115g" 
                             oninput="AdminWeb.syncProductPreviewCard();" required>
                    </div>
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Thương Hiệu / Hãng <span style="color: #ef4444;">*</span>
                      </label>
                      <input type="text" id="prodEditorBrand" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                             placeholder="VD: Brosh Pomade" 
                             value="CHÍNH HÃNG"
                             oninput="AdminWeb.syncProductPreviewCard();" required>
                    </div>
                  </div>

                  <!-- Hàng 2: Danh mục & Trạng thái kinh doanh -->
                  <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 14px;">
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Danh Mục Sản Phẩm <span style="color: #ef4444;">*</span>
                      </label>
                      <select id="prodEditorCategory" class="admin-select-filter" 
                              style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                              onchange="AdminWeb.syncProductPreviewCard();" required>
                        <option value="Sáp & Pomade">Sáp &amp; Pomade</option>
                        <option value="Dầu Gội & Xả">Dầu Gội &amp; Xả</option>
                        <option value="Dưỡng Tóc & Tạo Kiểu">Dưỡng Tóc &amp; Tạo Kiểu</option>
                        <option value="Nước Hoa Nam">Nước Hoa Nam</option>
                        <option value="Chăm Sóc Râu & Da Mặt">Chăm Sóc Râu &amp; Da Mặt</option>
                        <option value="Chăm sóc nam">Chăm sóc nam</option>
                      </select>
                    </div>
                    <div>
                      <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Trạng Thái Kinh Doanh
                      </label>
                      <select id="prodEditorStatus" class="admin-select-filter" 
                              style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                              onchange="AdminWeb.syncProductPreviewCard();">
                        <option value="Đang kinh doanh">Đang kinh doanh</option>
                        <option value="Tạm ngưng">Tạm ngưng</option>
                      </select>
                    </div>
                  </div>

                  <!-- Hàng 3: Đơn giá bán, Giá vốn, Tồn kho (3 cột) -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                    <div>
                      <label class="sub-label" style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Đơn Giá Bán VNĐ <span style="color: #ef4444;">*</span>
                      </label>
                      <input type="number" id="prodEditorPrice" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; font-weight: 700; color: #f59e0b !important; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 10px;" 
                             placeholder="350000" min="1000" step="1000"
                             oninput="AdminWeb.syncProductPreviewCard();" required>
                    </div>
                    <div>
                      <label class="sub-label" style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Giá Gốc / Vốn VNĐ <span style="color: #ef4444;">*</span>
                      </label>
                      <input type="number" id="prodEditorCostPrice" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; font-weight: 700; color: #10b981 !important; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 10px;" 
                             placeholder="245000" min="1000" step="1000"
                             oninput="AdminWeb.syncProductPreviewCard();" required>
                    </div>
                    <div>
                      <label class="sub-label" style="display: block; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                        Tồn Kho Ban Đầu
                      </label>
                      <input type="number" id="prodEditorStock" class="form-control-custom" 
                             style="height: 38px; font-size: 13px; font-weight: 700; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 10px;" 
                             placeholder="25" min="0" value="25"
                             oninput="AdminWeb.syncProductPreviewCard();">
                    </div>
                  </div>
                </div>

                <div style="height: 1px; background: var(--border-color, rgba(255, 255, 255, 0.08)); margin: 20px 0 18px;"></div>

                <!-- PHẦN 2: HÌNH ẢNH SẢN PHẨM & MÔ TẢ CHI TIẾT -->
                <div>
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27); margin-bottom: 12px;">
                    Hình ảnh sản phẩm &amp; mô tả
                  </div>

                  <div style="margin-bottom: 14px;">
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Đường Dẫn Ảnh Hoặc Tải Tệp Trực Tiếp
                    </label>
                    <div style="display: flex; width: 100%; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--surface-elevated); transition: border-color 0.15s ease;">
                      <input type="text" id="prodEditorImage" 
                             style="flex: 1; height: 38px; font-size: 12.5px; border: none; background: transparent; color: var(--text-primary); padding: 0 12px; outline: none;" 
                             placeholder="Men_Grooming_Products/... hoặc https://..." 
                             value="${productPresets[0]}"
                             oninput="AdminWeb.syncProductPreviewCard();">
                      <label style="display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; font-size: 12px; font-weight: 600; color: var(--brand-accent, #C59B27); background: rgba(197, 155, 39, 0.08); border-left: 1px solid var(--border-color); cursor: pointer; user-select: none; transition: background 0.15s ease; white-space: nowrap;"
                             onmouseover="this.style.background='rgba(197, 155, 39, 0.18)';" 
                             onmouseout="this.style.background='rgba(197, 155, 39, 0.08)';">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span>Tải từ máy</span>
                        <input type="file" accept="image/*" style="display: none;" onchange="AdminWeb.onProductFileUpload(this)">
                      </label>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
                    <span style="font-size: 11.5px; color: var(--text-secondary); font-weight: 500;">
                      Mẫu ảnh sản phẩm nam cao cấp (Click chọn nhanh):
                    </span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                      ${productPresets.map((img, idx) => `
                        <img src="${img}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: contain; background: #111; cursor: pointer; border: 1.5px solid rgba(255, 255, 255, 0.12); padding: 2px; transition: transform 0.15s ease, border-color 0.15s ease;"
                             onmouseover="this.style.transform='scale(1.1)'; this.style.borderColor='var(--brand-accent)';" 
                             onmouseout="this.style.transform='scale(1)'; this.style.borderColor='rgba(255, 255, 255, 0.12)';"
                             onclick="AdminWeb.setProductPresetImage('${img}');" title="Chọn mẫu ảnh ${idx + 1}">
                      `).join('')}
                    </div>
                  </div>

                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Mô Tả Sản Phẩm &amp; Thông Số Chi Tiết
                    </label>
                    <textarea id="prodEditorDescription" class="form-control-custom" rows="3" 
                              style="width: 100%; font-size: 12.5px; line-height: 1.5; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); resize: vertical;" 
                              placeholder="Độ giữ nếp, độ bóng, mùi hương, thành phần chính..."
                              oninput="AdminWeb.syncProductPreviewCard();"></textarea>
                  </div>
                </div>

              </div>

              <!-- CỘT PHẢI: DEMO THỰC TẾ TRÊN TRANG KHÁCH HÀNG (LIVE PREVIEW CARD 1:1) -->
              <div style="position: sticky; top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27);">
                    Xem trước trên web khách hàng (1:1)
                  </span>
                  <button type="button" class="pill-btn-outline" style="padding: 3px 9px; font-size: 11px; font-weight: 600;" onclick="AdminWeb.syncProductPreviewCard()" title="Làm mới xem trước">
                    Làm mới
                  </button>
                </div>

                <!-- Product Card Preview chuẩn 1:1 giao diện sản phẩm shop -->
                <div class="product-preview-card" style="border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; background: var(--surface-card, #181816); width: 100%; max-width: 380px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
                  <div style="position: relative; width: 100%; aspect-ratio: 1 / 1; max-height: 240px; background: #111; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img id="previewProdImg" src="${productPresets[0]}" alt="Xem trước sản phẩm"
                         style="width: 100%; height: 100%; object-fit: contain; padding: 12px; transition: transform 0.2s ease;"
                         onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');">
                    <span id="previewProdStockBadge" style="position: absolute; top: 10px; left: 10px; background: rgba(16, 185, 129, 0.9); color: #fff; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; letter-spacing: 0.03em;">
                      ✓ Còn hàng (25)
                    </span>
                    <span id="previewProdCategoryBadge" style="position: absolute; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); color: #FAF8F5; font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);">
                      Sáp &amp; Pomade
                    </span>
                  </div>

                  <div style="padding: 14px 16px 16px;">
                    <div id="previewProdBrand" style="font-size: 11px; font-weight: 800; color: var(--brand-accent, #C59B27); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                      CHÍNH HÃNG
                    </div>
                    <h4 id="previewProdName" style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; line-height: 1.35; min-height: 38px;">
                      Tên Sản Phẩm Demo
                    </h4>
                    <div id="previewProdDesc" style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 32px;">
                      Mô tả đặc điểm sản phẩm và thông số sử dụng...
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                      <div>
                        <span style="font-size: 11px; color: var(--text-secondary); display: block;">Giá niêm yết:</span>
                        <div id="previewProdPrice" style="font-size: 17px; font-weight: 900; color: #f59e0b;">
                          350.000 đ
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <span style="font-size: 11px; color: var(--text-secondary); display: block;">Giá vốn nhập:</span>
                        <div id="previewProdCost" style="font-size: 13px; font-weight: 700; color: #10b981;">
                          245.000 đ
                        </div>
                      </div>
                    </div>

                    <button type="button" class="btn-submit-terracotta" style="width: 100%; height: 36px; font-size: 12px; font-weight: 700; border-radius: 8px; opacity: 0.9; cursor: default;">
                      Thêm Vào Giỏ Hàng
                    </button>
                  </div>
                </div>

                <div style="margin-top: 10px; font-size: 11px; color: var(--text-secondary); line-height: 1.4; text-align: center;">
                  Thẻ xem trước tự động cập nhật thời gian thực khi chỉnh sửa bên trái
                </div>

              </div>

            </div>

            <!-- NÚT HÀNH ĐỘNG DƯỚI ĐÁY FORM -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));">
              <button type="button" class="pill-btn-outline" style="height: 38px; padding: 0 18px; font-weight: 600; font-size: 13px;" onclick="AdminWeb.resetProductBottomEditor()">
                Hủy Bỏ / Làm Mới
              </button>
              <button type="submit" id="btnSubmitProductBottom" 
                      style="height: 38px; padding: 0 24px; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; background: var(--brand-accent, #C59B27); color: #141413; transition: opacity 0.15s ease;"
                      onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
                <span id="btnSubmitProductBottomText">Lưu Sản Phẩm Mới</span>
              </button>
            </div>

          </form>
        </div>
      `;
    },

    prepareAddProductBottom() {
      this.resetProductBottomEditor();
      const editor = document.getElementById('adminProductBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const nameInput = document.getElementById('prodEditorName');
        if (nameInput) setTimeout(() => nameInput.focus(), 300);
      }
    },

    editProductBottom(productId) {
      const product = window.store.getProductById(productId);
      if (!product) return;
      const editor = document.getElementById('adminProductBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const titleEl = document.getElementById('productEditorTitle');
      if (titleEl) titleEl.textContent = `Chỉnh Sửa Sản Phẩm ${product.name || product.TenSanPham || product.id || productId}`;

      const idEl = document.getElementById('prodEditorId');
      if (idEl) idEl.value = product.id || productId;

      const nameEl = document.getElementById('prodEditorName');
      if (nameEl) nameEl.value = product.name || product.TenSanPham || '';

      const brandEl = document.getElementById('prodEditorBrand');
      if (brandEl) brandEl.value = product.brand || 'CHÍNH HÃNG';

      const catEl = document.getElementById('prodEditorCategory');
      if (catEl) catEl.value = product.category || product.NhomHang || 'Sáp & Pomade';

      const statusEl = document.getElementById('prodEditorStatus');
      if (statusEl) statusEl.value = (product.status || 'Đang kinh doanh');

      const priceEl = document.getElementById('prodEditorPrice');
      if (priceEl) priceEl.value = product.originalPrice || product.GiaBan || product.price || '';

      const costEl = document.getElementById('prodEditorCostPrice');
      if (costEl) costEl.value = product.costPrice || product.GiaNhap || (product.price ? Math.round(product.price * 0.7) : 245000);

      const stockEl = document.getElementById('prodEditorStock');
      const currentStock = window.store.getProductStock(null, productId);
      if (stockEl) stockEl.value = product.stock !== undefined ? product.stock : currentStock;

      const imgEl = document.getElementById('prodEditorImage');
      if (imgEl) imgEl.value = product.image || product.HinhAnh || '';

      const descEl = document.getElementById('prodEditorDescription');
      if (descEl) descEl.value = product.description || product.MoTa || '';

      const btnSubmitText = document.getElementById('btnSubmitProductBottomText');
      if (btnSubmitText) btnSubmitText.textContent = `Cập Nhật Sản Phẩm`;

      this.syncProductPreviewCard();
    },

    resetProductBottomEditor() {
      const form = document.getElementById('productBottomForm');
      if (form) form.reset();
      const idEl = document.getElementById('prodEditorId');
      if (idEl) idEl.value = '';
      const titleEl = document.getElementById('productEditorTitle');
      if (titleEl) titleEl.textContent = 'Thêm Sản Phẩm Mới';
      const btnSubmitText = document.getElementById('btnSubmitProductBottomText');
      if (btnSubmitText) btnSubmitText.textContent = 'Lưu Sản Phẩm Mới';
      const imgEl = document.getElementById('prodEditorImage');
      if (imgEl) imgEl.value = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';
      const brandEl = document.getElementById('prodEditorBrand');
      if (brandEl) brandEl.value = 'CHÍNH HÃNG';
      const stockEl = document.getElementById('prodEditorStock');
      if (stockEl) stockEl.value = '25';
      this.syncProductPreviewCard();
    },

    syncProductPreviewCard() {
      const name = document.getElementById('prodEditorName')?.value || 'Tên Sản Phẩm Demo';
      const brand = document.getElementById('prodEditorBrand')?.value || 'CHÍNH HÃNG';
      const category = document.getElementById('prodEditorCategory')?.value || 'Sáp & Pomade';
      const price = Number(document.getElementById('prodEditorPrice')?.value) || 0;
      const cost = Number(document.getElementById('prodEditorCostPrice')?.value) || 0;
      const stock = parseInt(document.getElementById('prodEditorStock')?.value) || 0;
      const rawImg = document.getElementById('prodEditorImage')?.value || '';
      const desc = document.getElementById('prodEditorDescription')?.value || 'Mô tả đặc điểm sản phẩm và thông số sử dụng...';

      const previewName = document.getElementById('previewProdName');
      if (previewName) previewName.textContent = name;

      const previewBrand = document.getElementById('previewProdBrand');
      if (previewBrand) previewBrand.textContent = brand;

      const previewCat = document.getElementById('previewProdCategoryBadge');
      if (previewCat) previewCat.textContent = category;

      const previewPrice = document.getElementById('previewProdPrice');
      if (previewPrice) previewPrice.textContent = SalonUtils.formatCurrency(price);

      const previewCost = document.getElementById('previewProdCost');
      if (previewCost) previewCost.textContent = SalonUtils.formatCurrency(cost);

      const previewDesc = document.getElementById('previewProdDesc');
      if (previewDesc) previewDesc.textContent = desc;

      const previewImg = document.getElementById('previewProdImg');
      if (previewImg) {
        const formattedUrl = typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function'
          ? SalonUtils.formatImageUrl(rawImg)
          : rawImg;
        previewImg.src = formattedUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';
      }

      const previewStockBadge = document.getElementById('previewProdStockBadge');
      if (previewStockBadge) {
        if (stock > 5) {
          previewStockBadge.style.background = 'rgba(16, 185, 129, 0.9)';
          previewStockBadge.textContent = `✓ Còn hàng (${stock})`;
        } else if (stock > 0) {
          previewStockBadge.style.background = 'rgba(245, 158, 11, 0.9)';
          previewStockBadge.textContent = `Sắp hết (${stock})`;
        } else {
          previewStockBadge.style.background = 'rgba(239, 68, 68, 0.9)';
          previewStockBadge.textContent = 'Hết hàng (0)';
        }
      }
    },

    async submitProductBottomEditor() {
      const prodId = document.getElementById('prodEditorId')?.value || '';
      const name = (document.getElementById('prodEditorName')?.value || '').trim();
      const brand = (document.getElementById('prodEditorBrand')?.value || '').trim();
      const category = (document.getElementById('prodEditorCategory')?.value || 'Sáp & Pomade').trim();
      const status = (document.getElementById('prodEditorStatus')?.value || 'Đang kinh doanh').trim();
      const price = Number(document.getElementById('prodEditorPrice')?.value) || 0;
      const costPrice = Number(document.getElementById('prodEditorCostPrice')?.value) || Math.round(price * 0.7);
      const stock = Math.max(0, parseInt(document.getElementById('prodEditorStock')?.value) || 0);
      const image = (document.getElementById('prodEditorImage')?.value || '').trim();
      const description = (document.getElementById('prodEditorDescription')?.value || '').trim();

      if (!name || price <= 0) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập tên sản phẩm và giá bán hợp lệ!', 'warning');
        return;
      }

      if (prodId) {
        await window.store.updateProduct(prodId, { name, brand, category, status, price, originalPrice: price, GiaBan: price, costPrice, GiaNhap: costPrice, oldPrice: price, stock, image, description });
        if (window.UICommon) window.UICommon.showToast(`Đã cập nhật sản phẩm [${name}]!`, 'success');
      } else {
        await window.store.addProduct({ name, brand, category, status, price, originalPrice: price, GiaBan: price, costPrice, GiaNhap: costPrice, oldPrice: price, stock, image, description });
        if (window.UICommon) window.UICommon.showToast(`Đã thêm mới sản phẩm [${name}] vào kho hàng!`, 'success');
      }

      this.resetProductBottomEditor();
      this.refreshInventoryView();
    },

    onProductFileUpload(input) {
      if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imgUrl = e.target.result;
          const inputEl = document.getElementById('prodEditorImage');
          if (inputEl) inputEl.value = imgUrl;
          this.syncProductPreviewCard();
        };
        reader.readAsDataURL(input.files[0]);
      }
    },

    setProductPresetImage(url) {
      const inputEl = document.getElementById('prodEditorImage');
      if (inputEl) inputEl.value = url;
      this.syncProductPreviewCard();
    },

    // -----------------------------------------------------------------------
    // BOTTOM EDITOR CHO PHIẾU NHẬP KHO (2 CỘT LIỀN MẠCH 1:1)
    // -----------------------------------------------------------------------
    _renderReceiptBottomEditor() {
      const user = this.getCurrentUser();
      const branches = window.store.getBranches() || [];
      const suppliers = window.store.getSuppliers() || [];
      const products = window.store.getProducts() || [];
      const isSuper = this.isSuperAdmin(user);
      const isManager = this.isBranchManager(user);
      const branchId = (isManager && user.branchId && user.branchId !== 'ALL') ? user.branchId : (this.filterBranch !== 'all' ? this.filterBranch : 'CN01');
      const creatorName = user ? (user.fullName || user.name || user.username || 'Nhân viên') : 'Nhân viên kho';
      const isStaffOnly = !isSuper && !isManager;
      const now = new Date();

      if (!this._receiptItems || this._receiptItems.length === 0) {
        const yr = now.getFullYear();
        const mo = String(now.getMonth() + 1).padStart(2, '0');
        const defaultLot = 'LO' + yr + mo + 'A001';
        const p0 = products[0];
        this._receiptItems = [
          {
            id: Date.now(),
            productId: p0?.id || 'SP01',
            quantity: 10,
            costPrice: p0?.costPrice || p0?.GiaNhap || 150000,
            lotNumber: defaultLot,
            expiryDate: new Date(now.getTime() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]
          }
        ];
      }

      return `
        <div id="adminReceiptBottomEditor" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px 26px; margin-top: 24px; width: 100%; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08)); padding-bottom: 16px; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <h3 id="receiptEditorTitle" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">
                Lập Phiếu Nhập Kho Mới
              </h3>
            </div>
            <div>
              <button type="button" class="pill-btn-outline" style="padding: 5px 14px; font-size: 12px; font-weight: 600;" onclick="AdminWeb.resetReceiptBottomEditor()">
                Đặt Lại / Làm Trống
              </button>
            </div>
          </div>

          <form id="receiptBottomForm" onsubmit="event.preventDefault(); AdminWeb.submitMultiItemReceipt();">
            <div style="display: flex; flex-direction: column; gap: 20px;">
              
              <!-- PHẦN 1: THÔNG TIN PHIẾU NHẬP KHO -->
              <div>
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27); margin-bottom: 14px;">
                  Thông tin phiếu nhập kho
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Chi Nhánh Nhập Hàng <span style="color: #ef4444;">*</span>
                    </label>
                    ${(isManager || isStaffOnly) ? `
                      <input type="hidden" id="receiptBranchId" value="${branchId}">
                      <input type="text" class="form-control-custom" style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); padding: 0 12px;" value="${this.escapeHtml(this._getBranchShortName(branchId))}" disabled>
                    ` : `
                      <select id="receiptBranchId" class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" onchange="AdminWeb.syncReceiptPreviewCard();">
                        ${branches.map(b => `<option value="${b.id}" ${b.id === branchId ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>`).join('')}
                      </select>
                    `}
                  </div>
                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Nhà Cung Cấp Hàng Hóa <span style="color: #ef4444;">*</span>
                    </label>
                    <select id="receiptSupplierId" class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" onchange="AdminWeb.syncReceiptPreviewCard();" required>
                      ${suppliers.map(s => `<option value="${s.id || s.MaNhaCungCap}">${this.escapeHtml(s.name || s.TenNhaCungCap)}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Người Lập Phiếu
                    </label>
                    <input type="text" class="form-control-custom" style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" value="${this.escapeHtml(creatorName)}" disabled>
                  </div>
                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Ngày Lập Phiếu
                    </label>
                    <input type="text" class="form-control-custom" style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" value="${now.toLocaleDateString('vi-VN')}" disabled>
                  </div>
                </div>
              </div>

              <div style="height: 1px; background: var(--border-color, rgba(255, 255, 255, 0.08));"></div>

              <!-- PHẦN 2: DANH SÁCH MẶT HÀNG NHẬP KHO -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27);">
                    Danh sách mặt hàng nhập kho
                  </div>
                  <button type="button" class="btn-submit-terracotta" style="padding: 6px 14px; font-size: 12px; font-weight: 700; height: auto; border-radius: 6px; cursor: pointer;" onclick="AdminWeb._addReceiptRow();">
                    + Thêm Mặt Hàng
                  </button>
                </div>

                <div style="overflow-x: auto; background: var(--surface-elevated); border-radius: 8px; border: 1px solid var(--border-color);">
                  <table class="admin-enterprise-table" style="width: 100%; font-size: 12.5px;">
                    <thead>
                      <tr style="border-bottom: 1px solid var(--border-color);">
                        <th style="min-width: 220px; padding: 10px 12px;">Sản Phẩm</th>
                        <th style="width: 85px; text-align: center; padding: 10px 8px;">Số Lượng</th>
                        <th style="min-width: 130px; padding: 10px 8px;">Giá Nhập VNĐ</th>
                        <th style="min-width: 140px; padding: 10px 8px;">Số Lô FEFO</th>
                        <th style="min-width: 130px; padding: 10px 8px;">Hạn Dùng EXP</th>
                        <th style="min-width: 130px; text-align: right; padding: 10px 12px;">Thành Tiền</th>
                        <th style="width: 44px; text-align: center; padding: 10px 4px;">Xóa</th>
                      </tr>
                    </thead>
                    <tbody id="receiptRowsTbody">
                      ${this._renderReceiptRowsHtml()}
                    </tbody>
                  </table>
                </div>

                <!-- TỔNG KẾT ĐƠN HÀNG GỌN GÀNG -->
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 14px 20px; margin-top: 14px; flex-wrap: wrap; gap: 8px;">
                  <div>
                    <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Tổng Giá Trị Phiếu Nhập:</span>
                    <span id="receiptTotalItemsCount" style="font-size: 12.5px; color: var(--text-secondary); margin-left: 8px;">(0 mặt hàng, 0 sản phẩm)</span>
                  </div>
                  <strong id="receiptGrandTotalDisplay" style="font-size: 20px; color: #10b981; font-weight: 800;">
                    0 đ
                  </strong>
                </div>
              </div>

            </div>

            <!-- NÚT HÀNH ĐỘNG DƯỚI ĐÁY FORM: BỎ TICK VÀ DUYỆT SQL, CHỈ ĐỂ LƯU -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));">
              <button type="button" class="pill-btn-outline" style="height: 38px; padding: 0 18px; font-weight: 600; font-size: 13px;" onclick="AdminWeb.resetReceiptBottomEditor()">
                Hủy Bỏ / Làm Mới
              </button>
              <button type="submit" 
                      style="height: 38px; padding: 0 28px; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; background: var(--brand-accent, #C59B27); color: #141413; transition: opacity 0.15s ease;"
                      onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
                <span>Lưu</span>
              </button>
            </div>

          </form>
        </div>
      `;
    },

    prepareAddReceiptBottom() {
      this.resetReceiptBottomEditor();
      const editor = document.getElementById('adminReceiptBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    resetReceiptBottomEditor() {
      const products = window.store.getProducts() || [];
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const defaultLot = 'LO' + yr + mo + 'A001';
      const p0 = products[0];
      this._receiptItems = [
        {
          id: Date.now(),
          productId: p0?.id || 'SP01',
          quantity: 10,
          costPrice: p0?.costPrice || p0?.GiaNhap || 150000,
          lotNumber: defaultLot,
          expiryDate: new Date(now.getTime() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]
        }
      ];
      const tbody = document.getElementById('receiptRowsTbody');
      if (tbody) tbody.innerHTML = this._renderReceiptRowsHtml();
      this.syncReceiptPreviewCard();
    },

    syncReceiptPreviewCard() {
      this._recalculateReceiptGrandTotal();
    },


    // -----------------------------------------------------------------------
    // BOTTOM EDITOR CHO NHÀ CUNG CẤP HÀNG HÓA (2 CỘT LIỀN MẠCH 1:1)
    // -----------------------------------------------------------------------
    _renderSupplierBottomEditor() {
      return `
        <div id="adminSupplierBottomEditor" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 24px 26px; margin-top: 24px; width: 100%; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08)); padding-bottom: 16px; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <h3 id="supplierEditorTitle" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">
                Thêm Nhà Cung Cấp Mới
              </h3>
            </div>
            <div>
              <button type="button" class="pill-btn-outline" style="padding: 5px 14px; font-size: 12px; font-weight: 600;" onclick="AdminWeb.resetSupplierBottomEditor()">
                Đặt Lại / Làm Trống
              </button>
            </div>
          </div>

          <form id="supplierBottomForm" onsubmit="event.preventDefault(); AdminWeb.submitSupplierBottomEditor();">
            <input type="hidden" id="supEditorId" value="">

            <div style="display: flex; flex-direction: column; gap: 16px;">
              
              <!-- THÔNG TIN PHÁP NHÂN & LIÊN HỆ -->
              <div>
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--brand-accent, #C59B27); margin-bottom: 14px;">
                  Thông tin nhà phân phối &amp; đối tác
                </div>

                <!-- Hàng 1: Tên Nhà Cung Cấp & Mã Đối Tác -->
                <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Tên Công Ty / Nhà Cung Cấp <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="text" id="supEditorName" class="form-control-custom" 
                           style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                           placeholder="VD: Công ty TNHH Phân Phối Mỹ Phẩm Barber Sài Gòn" required>
                  </div>
                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Mã Đối Tác
                    </label>
                    <input type="text" id="supEditorCode" class="form-control-custom" 
                           style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                           placeholder="VD: NCC08 (Tự sinh nếu để trống)">
                  </div>
                </div>

                <!-- Hàng 2: Số điện thoại hotline & Email -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Số Điện Thoại Hotline <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="tel" id="supEditorPhone" class="form-control-custom" 
                           style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                           placeholder="02838221199 hoặc 0909xxxxxx" required>
                  </div>
                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Email Đặt Hàng &amp; Liên Hệ
                    </label>
                    <input type="email" id="supEditorEmail" class="form-control-custom" 
                           style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                           placeholder="order@supplier.vn">
                  </div>
                </div>

                <!-- Hàng 3: Danh mục hàng cung ứng & Trạng thái -->
                <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Nhóm Hàng Cung Ứng Chính
                    </label>
                    <select id="supEditorCategory" class="admin-select-filter" 
                            style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;">
                      <option value="Mỹ phẩm sáp, pomade & gôm xịt">Mỹ phẩm sáp, pomade &amp; gôm xịt</option>
                      <option value="Dầu gội, dầu xả & hấp dầu">Dầu gội, dầu xả &amp; hấp dầu</option>
                      <option value="Hóa chất uốn, nhuộm & tẩy tóc">Hóa chất uốn, nhuộm &amp; tẩy tóc</option>
                      <option value="Kéo cắt, tông đơ & thiết bị barber">Kéo cắt, tông đơ &amp; thiết bị barber</option>
                      <option value="Khăn, áo choàng & phụ liệu salon">Khăn, áo choàng &amp; phụ liệu salon</option>
                    </select>
                  </div>
                  <div>
                    <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                      Trạng Thái Hoạt Động
                    </label>
                    <select id="supEditorStatus" class="admin-select-filter" 
                            style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;">
                      <option value="Hoạt động">Hoạt động</option>
                      <option value="Tạm ngưng">Tạm ngưng</option>
                    </select>
                  </div>
                </div>

                <!-- Hàng 4: Địa chỉ trụ sở / kho hàng -->
                <div>
                  <label class="sub-label" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                    Địa Chỉ Trụ Sở / Kho Xuất Hàng
                  </label>
                  <input type="text" id="supEditorAddress" class="form-control-custom" 
                         style="height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); padding: 0 12px;" 
                         placeholder="VD: Tòa nhà Bitexco, 02 Hải Triều, Q.1, TP. Hồ Chí Minh">
                </div>
              </div>

            </div>

            <!-- NÚT HÀNH ĐỘNG DƯỚI ĐÁY FORM -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));">
              <button type="button" class="pill-btn-outline" style="height: 38px; padding: 0 18px; font-weight: 600; font-size: 13px;" onclick="AdminWeb.resetSupplierBottomEditor()">
                Hủy Bỏ / Làm Mới
              </button>
              <button type="submit" id="btnSubmitSupplierBottom" 
                      style="height: 38px; padding: 0 28px; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; background: var(--brand-accent, #C59B27); color: #141413; transition: opacity 0.15s ease;"
                      onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
                <span id="btnSubmitSupplierBottomText">Lưu</span>
              </button>
            </div>

          </form>
        </div>
      `;
    },

    prepareAddSupplierBottom() {
      this.resetSupplierBottomEditor();
      const editor = document.getElementById('adminSupplierBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const nameInput = document.getElementById('supEditorName');
        if (nameInput) setTimeout(() => nameInput.focus(), 300);
      }
    },

    editSupplierBottom(supplierId) {
      const s = (window.store && typeof window.store.getSupplierById === 'function') 
        ? window.store.getSupplierById(supplierId) 
        : ((window.store.getSuppliers() || []).find(x => x.id === supplierId || x.MaNhaCungCap === supplierId));
      if (!s) return;

      const editor = document.getElementById('adminSupplierBottomEditor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      const titleEl = document.getElementById('supplierEditorTitle');
      if (titleEl) titleEl.textContent = `Chỉnh Sửa Nhà Cung Cấp ${s.name || s.TenNhaCungCap || s.id || supplierId}`;

      const idEl = document.getElementById('supEditorId');
      if (idEl) idEl.value = s.id || s.MaNhaCungCap || supplierId;

      const codeEl = document.getElementById('supEditorCode');
      if (codeEl) codeEl.value = s.id || s.MaNhaCungCap || supplierId;

      const nameEl = document.getElementById('supEditorName');
      if (nameEl) nameEl.value = s.name || s.TenNhaCungCap || '';

      const phoneEl = document.getElementById('supEditorPhone');
      if (phoneEl) phoneEl.value = s.phone || s.SoDienThoai || '';

      const emailEl = document.getElementById('supEditorEmail');
      if (emailEl) emailEl.value = s.email || s.Email || '';

      const addrEl = document.getElementById('supEditorAddress');
      if (addrEl) addrEl.value = s.address || s.DiaChi || '';

      const statusEl = document.getElementById('supEditorStatus');
      if (statusEl) statusEl.value = s.status || 'Hoạt động';

      const btnSubmitText = document.getElementById('btnSubmitSupplierBottomText');
      if (btnSubmitText) btnSubmitText.textContent = 'Lưu';

      this.syncSupplierPreviewCard();
    },

    resetSupplierBottomEditor() {
      const form = document.getElementById('supplierBottomForm');
      if (form) form.reset();
      const idEl = document.getElementById('supEditorId');
      if (idEl) idEl.value = '';
      const titleEl = document.getElementById('supplierEditorTitle');
      if (titleEl) titleEl.textContent = 'Thêm Nhà Cung Cấp Mới';
      const btnSubmitText = document.getElementById('btnSubmitSupplierBottomText');
      if (btnSubmitText) btnSubmitText.textContent = 'Lưu';
      this.syncSupplierPreviewCard();
    },

    syncSupplierPreviewCard() {},

    async submitSupplierBottomEditor() {
      const supId = document.getElementById('supEditorId')?.value || '';
      const name = (document.getElementById('supEditorName')?.value || '').trim();
      const code = (document.getElementById('supEditorCode')?.value || '').trim();
      const phone = (document.getElementById('supEditorPhone')?.value || '').trim();
      const email = (document.getElementById('supEditorEmail')?.value || '').trim();
      const address = (document.getElementById('supEditorAddress')?.value || '').trim();
      const status = (document.getElementById('supEditorStatus')?.value || 'Hoạt động').trim();
      const category = (document.getElementById('supEditorCategory')?.value || 'Mỹ phẩm sáp, pomade & gôm xịt').trim();

      if (!name || !phone) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập tên nhà cung cấp và số điện thoại hotline!', 'warning');
        return;
      }

      if (supId) {
        if (window.store && typeof window.store.updateSupplier === 'function') {
          await window.store.updateSupplier(supId, { name, TenNhaCungCap: name, phone, SoDienThoai: phone, email, Email: email, address, DiaChi: address, status, category });
        }
        if (window.UICommon) window.UICommon.showToast(`Đã cập nhật nhà cung cấp [${name}]!`, 'success');
      } else {
        const suppliers = (window.store && typeof window.store.getSuppliers === 'function') ? window.store.getSuppliers() : [];
        const nextId = code || ('NCC' + String(suppliers.length + 1).padStart(2, '0'));
        if (window.store && typeof window.store.addSupplier === 'function') {
          await window.store.addSupplier({ id: nextId, MaNhaCungCap: nextId, name, TenNhaCungCap: name, phone, SoDienThoai: phone, email, Email: email, address, DiaChi: address, status, category });
        }
        if (window.UICommon) window.UICommon.showToast(`Đã thêm mới nhà cung cấp [${name}]!`, 'success');
      }

      this.resetSupplierBottomEditor();
      this.refreshInventoryView();
    },

    async deleteSupplierDirect(supplierId) {
      if (!supplierId) return;
      const s = (window.store.getSuppliers() || []).find(x => x.id === supplierId || x.MaNhaCungCap === supplierId);
      const name = s ? (s.name || s.TenNhaCungCap || supplierId) : supplierId;
      if (!confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${name}" khỏi hệ thống không?`)) return;

      if (window.store && typeof window.store.deleteSupplier === 'function') {
        await window.store.deleteSupplier(supplierId);
      }
      if (window.UICommon) window.UICommon.showToast(`Đã xóa nhà cung cấp [${name}]!`, 'info');
      this.refreshInventoryView();
    },

    // -----------------------------------------------------------------------
 // QUY TRÌNH XÁC NHẬN XÓA CHUNG TOÀN HỆ THỐNG, UNIFIED DELETE CONFIRM MODAL
    // Áp dụng 1 form duy nhất cho: Sản Phẩm, Dịch Vụ, Gói Combo, Thợ, Lịch Hẹn
  });

})(typeof window !== "undefined" ? window : this);
