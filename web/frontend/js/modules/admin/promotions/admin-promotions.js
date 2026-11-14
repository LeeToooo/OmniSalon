(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  Object.assign(window.AdminWeb, {
    promotionsSubTab: 'rules', // 'rules' | 'promotions'
    promotionsSearchQuery: '',
    _editingPromotionId: null,
    _editingDiscountRuleId: null,

    switchPromotionsSubTab(tab) {
      this.promotionsSubTab = tab;
      this.promotionsSearchQuery = '';
      const content = document.getElementById('adminSubTabContent');
      if (content) {
        const user = this.getCurrentUser();
        content.innerHTML = this.renderPromotionsTab(user);
      } else {
        const container = document.getElementById('webMainContainer');
        if (container && typeof this.render === 'function') this.render(container);
      }
    },

    handlePromotionsSearch(val) {
      this.promotionsSearchQuery = val || '';
      const clearBtn = document.getElementById('adminPromotionsSearchClear');
      if (clearBtn) clearBtn.style.display = this.promotionsSearchQuery ? 'inline-flex' : 'none';
      const container = document.getElementById('adminPromotionsTableContainer');
      if (container) {
        container.innerHTML = this._renderPromotionsTableContent();
      }
    },

    clearPromotionsSearch() {
      const input = document.getElementById('adminPromotionsSearchInput');
      if (input) input.value = '';
      this.handlePromotionsSearch('');
    },

    renderPromotionsTab(user) {
      const isSuper = this.isSuperAdmin(user);
      const isRules = (this.promotionsSubTab === 'rules');

      return `
        <!-- Sub-tabs chuyển đổi giữa Quy tắc giảm giá & Chương trình khuyến mãi -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
          <button type="button" class="admin-tab-btn ${isRules ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${isRules ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchPromotionsSubTab('rules')">
            Quy Tắc Giảm Giá Hạn Dùng FEFO
          </button>
          <button type="button" class="admin-tab-btn ${!isRules ? 'active' : ''}" 
                  style="padding: 8px 18px; font-size: 13.5px; cursor: pointer; font-weight: 700; background: transparent; border: none; border-radius: 6px; ${!isRules ? 'color: var(--brand-accent, #C59B27); border-bottom: 2px solid var(--brand-accent, #C59B27);' : 'color: var(--text-secondary);'}" 
                  onclick="AdminWeb.switchPromotionsSubTab('promotions')">
            Chương Trình Khuyến Mãi &amp; Ưu Đãi
          </button>
        </div>

        <!-- Filter & Actions Toolbar -->
        <div class="admin-filter-bar" style="border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: var(--surface-card); border: 1px solid var(--border-color); box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <div style="position: relative; min-width: 280px; max-width: 420px; flex: 1;">
            <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; display: flex; align-items: center; color: var(--text-secondary);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input type="text" id="adminPromotionsSearchInput" class="form-control-custom"
                   style="padding-left: 38px !important; padding-right: 32px !important; height: 38px; font-size: 13px; border-radius: 8px; width: 100%; border: 1px solid var(--border-color); background: var(--surface-elevated);"
                   placeholder="${isRules ? 'Tìm quy tắc theo tên, mã hoặc % giảm...' : 'Tìm khuyến mãi theo tên hoặc mã...'}"
                   value="${this.escapeHtml(this.promotionsSearchQuery || '')}"
                   oninput="AdminWeb.handlePromotionsSearch(this.value);">
            <button type="button" id="adminPromotionsSearchClear"
                    onclick="AdminWeb.clearPromotionsSearch();"
                    style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 14px; padding: 4px; display: ${this.promotionsSearchQuery ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; z-index: 2;"
                    title="Xóa tìm kiếm">✕</button>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            ${isRules ? `
              <button class="btn-submit-terracotta" style="height: 38px; padding: 0 18px; font-size: 12.5px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.25);"
                      onclick="AdminWeb.openAddDiscountRuleModal()">
                <span>+ Thêm Quy Tắc Giảm Giá Mới</span>
              </button>
            ` : `
              <button class="btn-submit-terracotta" style="height: 38px; padding: 0 18px; font-size: 12.5px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 3px 10px rgba(245, 158, 11, 0.25);"
                      onclick="AdminWeb.openAddPromotionModal()">
                <span>+ Thêm Khuyến Mãi Mới</span>
              </button>
            `}
          </div>
        </div>

        <!-- Table Container -->
        <div id="adminPromotionsTableContainer">
          ${this._renderPromotionsTableContent()}
        </div>
      `;
    },

    _renderPromotionsTableContent() {
      if (this.promotionsSubTab === 'rules') {
        return this._renderDiscountRulesTable();
      } else {
        return this._renderPromotionsListTable();
      }
    },

    // 1. Render Bảng Quy Tắc Giảm Giá Theo Hạn Dùng
    _renderDiscountRulesTable() {
      const allRules = (window.store && typeof window.store.getDiscountRules === 'function') ? window.store.getDiscountRules() : [];
      const q = (this.promotionsSearchQuery || '').toLowerCase().trim();
      const rules = allRules.filter(r => {
        if (!q) return true;
        const name = (r.name || r.TenQuyTac || '').toLowerCase();
        const code = (r.id || r.MaQuyTac || '').toLowerCase();
        const pct = String(r.percent || r.PhanTramGiam || '');
        return name.includes(q) || code.includes(q) || pct.includes(q);
      });

      if (rules.length === 0) {
        return `
          <div style="text-align: center; padding: 48px 20px; background: var(--surface-card); border-radius: 12px; border: 1px dashed var(--border-color); color: var(--text-secondary);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Không tìm thấy quy tắc giảm giá nào</div>
            <div style="font-size: 12.5px;">Nhấn nút "+ Thêm Quy Tắc Giảm Giá Mới" ở góc trên để tạo mới.</div>
          </div>
        `;
      }

      return `
        <div style="background: var(--surface-card); border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead>
                <tr style="background: var(--surface-elevated, rgba(255,255,255,0.02)); border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px;">
                  <th style="padding: 12px 16px; font-weight: 700;">Mã Quy Tắc</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Tên Quy Tắc Giảm Giá</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Số Ngày Còn Lại Tối Thiểu</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Số Ngày Còn Lại Tối Đa</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Mức Giảm (%)</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Trạng Thái</th>
                  <th style="padding: 12px 16px; font-weight: 700; text-align: right;">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${rules.map(r => {
                  const id = r.id || r.MaQuyTac;
                  const name = r.name || r.TenQuyTac || '—';
                  const minDays = (r.minDays !== undefined ? r.minDays : r.SoNgayConLaiToiThieu);
                  const maxDays = (r.maxDays !== undefined ? r.maxDays : r.SoNgayConLaiToiDa);
                  const pct = (r.percent !== undefined ? r.percent : (r.PhanTramGiam || 0));
                  const status = r.status || r.TrangThai || 'Đang áp dụng';
                  const isSafe = (pct === 0);
                  const isHigh = (pct >= 50);

                  return `
                    <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.15s ease;">
                      <td style="padding: 14px 16px; font-family: monospace; font-weight: 700; color: var(--text-primary);">${this.escapeHtml(id)}</td>
                      <td style="padding: 14px 16px; font-weight: 600; color: var(--text-primary);">${this.escapeHtml(name)}</td>
                      <td style="padding: 14px 16px; color: var(--text-secondary); font-weight: 600;">${minDays < 0 ? minDays + ' (Quá hạn)' : minDays + ' ngày'}</td>
                      <td style="padding: 14px 16px; color: var(--text-secondary); font-weight: 600;">${maxDays >= 99999 ? 'Không giới hạn' : maxDays + ' ngày'}</td>
                      <td style="padding: 14px 16px;">
                        <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 12px; ${isSafe ? 'background: rgba(34, 197, 94, 0.12); color: #22c55e;' : (isHigh ? 'background: rgba(239, 68, 68, 0.12); color: #ef4444;' : 'background: rgba(245, 158, 11, 0.12); color: #f59e0b;')}">
                          -${pct}%
                        </span>
                      </td>
                      <td style="padding: 14px 16px;">
                        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11.5px; font-weight: 600; background: rgba(34, 197, 94, 0.1); color: #22c55e;">
                          ${this.escapeHtml(status)}
                        </span>
                      </td>
                      <td style="padding: 14px 16px; text-align: right; white-space: nowrap;">
                        <button type="button" class="btn-action-icon" style="padding: 6px 12px; font-size: 12px; font-weight: 700; border-radius: 6px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); cursor: pointer; margin-right: 6px;"
                                onclick="AdminWeb.openEditDiscountRuleModal('${this.escapeHtml(id)}')">
                          Sửa
                        </button>
                        <button type="button" class="btn-action-icon" style="padding: 6px 12px; font-size: 12px; font-weight: 700; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.08); color: #ef4444; cursor: pointer;"
                                onclick="AdminWeb.confirmDeleteDiscountRule('${this.escapeHtml(id)}')">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // 2. Render Bảng Danh Sách Khuyến Mãi
    _renderPromotionsListTable() {
      const allPromos = (window.store && typeof window.store.getPromotions === 'function') ? window.store.getPromotions() : [];
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const products = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts() : [];
      const sMap = new Map(services.map(s => [s.id || s.MaDichVu, s]));
      const pMap = new Map(products.map(p => [p.id || p.MaSanPham, p]));

      const q = (this.promotionsSearchQuery || '').toLowerCase().trim();
      const promos = allPromos.filter(p => {
        if (!q) return true;
        const name = (p.name || p.TenKhuyenMai || '').toLowerCase();
        const code = (p.id || p.MaKhuyenMai || '').toLowerCase();
        return name.includes(q) || code.includes(q);
      });

      if (promos.length === 0) {
        return `
          <div style="text-align: center; padding: 48px 20px; background: var(--surface-card); border-radius: 12px; border: 1px dashed var(--border-color); color: var(--text-secondary);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Không tìm thấy chương trình khuyến mãi nào</div>
            <div style="font-size: 12.5px;">Nhấn nút "+ Thêm Khuyến Mãi Mới" ở góc trên để tạo mới.</div>
          </div>
        `;
      }

      return `
        <div style="background: var(--surface-card); border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead>
                <tr style="background: var(--surface-elevated, rgba(255,255,255,0.02)); border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px;">
                  <th style="padding: 12px 16px; font-weight: 700;">Mã Khuyến Mãi</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Tên Chương Trình</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Hình Thức Giảm</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Đối Tượng Áp Dụng</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Thời Gian Áp Dụng</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Áp Dụng Cho</th>
                  <th style="padding: 12px 16px; font-weight: 700;">Trạng Thái</th>
                  <th style="padding: 12px 16px; font-weight: 700; text-align: right;">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${promos.map(p => {
                  const id = p.id || p.MaKhuyenMai;
                  const name = p.name || p.TenKhuyenMai || '—';
                  const type = p.type || p.HinhThuc || 'Giảm giá %';
                  const val = p.value !== undefined ? p.value : (p.GiaTriGiam || 0);
                  const target = p.target || p.DoiTuongApDung || 'Tất cả khách hàng';
                  const start = p.startDate || p.NgayBatDau || '—';
                  const end = p.endDate || p.NgayKetThuc || '—';
                  const status = p.status || p.TrangThai || 'Đang áp dụng';
                  const sIds = Array.isArray(p.serviceIds) ? p.serviceIds : [];
                  const pIds = Array.isArray(p.productIds) ? p.productIds : [];

                  const serviceNames = sIds.map(sid => sMap.get(sid)?.name || sMap.get(sid)?.TenDichVu || sid).slice(0, 3);
                  const productNames = pIds.map(pid => pMap.get(pid)?.name || pMap.get(pid)?.TenSanPham || pid).slice(0, 3);

                  return `
                    <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.15s ease;">
                      <td style="padding: 14px 16px; font-family: monospace; font-weight: 700; color: var(--text-primary);">${this.escapeHtml(id)}</td>
                      <td style="padding: 14px 16px; font-weight: 600; color: var(--text-primary);">${this.escapeHtml(name)}</td>
                      <td style="padding: 14px 16px;">
                        <span style="font-weight: 800; color: var(--brand-accent, #C59B27);">
                          ${this.escapeHtml(type)} (${val > 100 ? val.toLocaleString('vi-VN') + 'đ' : val + '%'})
                        </span>
                      </td>
                      <td style="padding: 14px 16px; color: var(--text-secondary);">${this.escapeHtml(target)}</td>
                      <td style="padding: 14px 16px; font-size: 12px; color: var(--text-secondary); white-space: nowrap;">
                        ${this.escapeHtml(start)} <br><span style="color: var(--text-primary);">đến ${this.escapeHtml(end)}</span>
                      </td>
                      <td style="padding: 14px 16px; font-size: 12px;">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                          ${sIds.length > 0 ? `
                            <span style="display: inline-flex; align-items: center; gap: 4px; color: #3b82f6; font-weight: 600;">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              ${sIds.length} Dịch vụ (${serviceNames.join(', ')}${sIds.length > 3 ? '...' : ''})
                            </span>
                          ` : ''}
                          ${pIds.length > 0 ? `
                            <span style="display: inline-flex; align-items: center; gap: 4px; color: #10b981; font-weight: 600;">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              ${pIds.length} Sản phẩm (${productNames.join(', ')}${pIds.length > 3 ? '...' : ''})
                            </span>
                          ` : ''}
                          ${sIds.length === 0 && pIds.length === 0 ? `
                            <span style="color: var(--text-secondary); font-style: italic;">Áp dụng toàn bộ dịch vụ &amp; sản phẩm</span>
                          ` : ''}
                        </div>
                      </td>
                      <td style="padding: 14px 16px;">
                        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11.5px; font-weight: 600; background: rgba(34, 197, 94, 0.1); color: #22c55e;">
                          ${this.escapeHtml(status)}
                        </span>
                      </td>
                      <td style="padding: 14px 16px; text-align: right; white-space: nowrap;">
                        <button type="button" class="btn-action-icon" style="padding: 6px 12px; font-size: 12px; font-weight: 700; border-radius: 6px; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-primary); cursor: pointer; margin-right: 6px;"
                                onclick="AdminWeb.openEditPromotionModal('${this.escapeHtml(id)}')">
                          Sửa
                        </button>
                        <button type="button" class="btn-action-icon" style="padding: 6px 12px; font-size: 12px; font-weight: 700; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.08); color: #ef4444; cursor: pointer;"
                                onclick="AdminWeb.confirmDeletePromotion('${this.escapeHtml(id)}')">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // ---------------- MODAL QUY TẮC GIẢM GIÁ ----------------
    openAddDiscountRuleModal() {
      this._editingDiscountRuleId = null;
      this._showDiscountRuleModal({
        id: '',
        name: '',
        minDays: 30,
        maxDays: 90,
        percent: 20,
        status: 'Đang áp dụng'
      }, false);
    },

    openEditDiscountRuleModal(ruleId) {
      this._editingDiscountRuleId = ruleId;
      const all = (window.store && typeof window.store.getDiscountRules === 'function') ? window.store.getDiscountRules() : [];
      const rule = all.find(r => (r.id === ruleId || r.MaQuyTac === ruleId));
      if (!rule) {
        if (window.UICommon) window.UICommon.showToast('Không tìm thấy quy tắc #' + ruleId, 'error');
        return;
      }
      this._showDiscountRuleModal({
        id: rule.id || rule.MaQuyTac,
        name: rule.name || rule.TenQuyTac,
        minDays: rule.minDays !== undefined ? rule.minDays : rule.SoNgayConLaiToiThieu,
        maxDays: rule.maxDays !== undefined ? rule.maxDays : rule.SoNgayConLaiToiDa,
        percent: rule.percent !== undefined ? rule.percent : rule.PhanTramGiam,
        status: rule.status || rule.TrangThai || 'Đang áp dụng'
      }, true);
    },

    _showDiscountRuleModal(data, isEdit) {
      const modalId = 'modalDiscountRuleForm';
      let modalEl = document.getElementById(modalId);
      if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = modalId;
        document.body.appendChild(modalEl);
      }

      modalEl.innerHTML = `
        <div class="custom-modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 20px;">
          <div style="background: var(--surface-card, #1c1c1e); border: 1px solid var(--border-color, #333); border-radius: 14px; width: 100%; max-width: 520px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden;">
            <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">
                ${isEdit ? 'Sửa Quy Tắc Giảm Giá Hạn Dùng' : 'Thêm Quy Tắc Giảm Giá Mới'}
              </h3>
              <button type="button" style="background: none; border: none; font-size: 18px; color: var(--text-secondary); cursor: pointer;" onclick="document.getElementById('${modalId}').remove();">✕</button>
            </div>
            <form onsubmit="AdminWeb.submitDiscountRuleForm(event, ${isEdit});" style="padding: 20px;">
              <div style="margin-bottom: 14px;">
                <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Mã Quy Tắc</label>
                <input type="text" id="drFormId" class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px; font-weight: 700;" 
                       value="${this.escapeHtml(data.id || '')}" ${isEdit ? 'readonly' : 'placeholder="Tự sinh (VD: QT06) nếu để trống"'}>
              </div>
              <div style="margin-bottom: 14px;">
                <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Tên Quy Tắc Giảm Giá *</label>
                <input type="text" id="drFormName" class="form-control-custom" required style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px;" 
                       value="${this.escapeHtml(data.name || '')}" placeholder="VD: Còn từ 4 đến 8 tháng (Cận hạn nhẹ)">
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Số Ngày Tối Thiểu *</label>
                  <input type="number" id="drFormMinDays" required class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px;" 
                         value="${data.minDays}" placeholder="VD: 91">
                </div>
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Số Ngày Tối Đa *</label>
                  <input type="number" id="drFormMaxDays" required class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px;" 
                         value="${data.maxDays}" placeholder="VD: 180">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Mức Giảm (%) *</label>
                  <input type="number" step="0.01" min="0" max="100" id="drFormPercent" required class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px; font-weight: 700; color: var(--brand-accent);" 
                         value="${data.percent}" placeholder="VD: 10 hoặc 20">
                </div>
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Trạng Thái</label>
                  <select id="drFormStatus" class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px;">
                    <option value="Đang áp dụng" ${data.status === 'Đang áp dụng' ? 'selected' : ''}>Đang áp dụng</option>
                    <option value="Tạm dừng" ${data.status === 'Tạm dừng' ? 'selected' : ''}>Tạm dừng</option>
                  </select>
                </div>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                <button type="button" style="padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer;"
                        onclick="document.getElementById('${modalId}').remove();">Hủy</button>
                <button type="submit" class="btn-submit-terracotta" style="padding: 9px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; background: var(--brand-accent, #C59B27); color: #141413; border: none;">
                  ${isEdit ? 'Lưu Thay Đổi' : 'Thêm Quy Tắc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    async submitDiscountRuleForm(e, isEdit) {
      e.preventDefault();
      const id = (document.getElementById('drFormId')?.value || '').trim();
      const name = (document.getElementById('drFormName')?.value || '').trim();
      const minDays = parseInt(document.getElementById('drFormMinDays')?.value || '0', 10);
      const maxDays = parseInt(document.getElementById('drFormMaxDays')?.value || '0', 10);
      const percent = parseFloat(document.getElementById('drFormPercent')?.value || '0');
      const status = document.getElementById('drFormStatus')?.value || 'Đang áp dụng';

      if (!name) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập tên quy tắc', 'warning');
        return;
      }
      if (minDays > maxDays) {
        if (window.UICommon) window.UICommon.showToast('Số ngày tối thiểu không được lớn hơn số ngày tối đa', 'warning');
        return;
      }

      const payload = { id, MaQuyTac: id, name, TenQuyTac: name, minDays, SoNgayConLaiToiThieu: minDays, maxDays, SoNgayConLaiToiDa: maxDays, percent, PhanTramGiam: percent, status, TrangThai: status };

      try {
        if (isEdit && this._editingDiscountRuleId) {
          await window.store.updateDiscountRule(this._editingDiscountRuleId, payload);
          if (window.UICommon) window.UICommon.showToast('Đã cập nhật quy tắc giảm giá thành công!', 'success');
        } else {
          await window.store.addDiscountRule(payload);
          if (window.UICommon) window.UICommon.showToast('Đã thêm quy tắc giảm giá mới thành công!', 'success');
        }
      } catch (err) {
        if (window.UICommon) window.UICommon.showToast('Lỗi lưu quy tắc: ' + err.message, 'error');
      }

      const modalEl = document.getElementById('modalDiscountRuleForm');
      if (modalEl) modalEl.remove();

      // Cập nhật lại view
      const container = document.getElementById('adminPromotionsTableContainer');
      if (container) container.innerHTML = this._renderPromotionsTableContent();
    },

    confirmDeleteDiscountRule(ruleId) {
      if (typeof window.AdminModalDelete !== 'undefined' && typeof window.AdminModalDelete.openDeleteModal === 'function') {
        window.AdminModalDelete.openDeleteModal({
          title: 'Xóa Quy Tắc Giảm Giá #' + ruleId,
          message: 'Bạn có chắc chắn muốn xóa quy tắc giảm giá cận hạn này không? Thao tác này sẽ xóa vĩnh viễn trong CSDL SQL Server.',
          confirmText: 'Xác Nhận Xóa',
          onConfirm: async () => {
            await window.store.deleteDiscountRule(ruleId);
            if (window.UICommon) window.UICommon.showToast('Đã xóa quy tắc #' + ruleId, 'success');
            const container = document.getElementById('adminPromotionsTableContainer');
            if (container) container.innerHTML = AdminWeb._renderPromotionsTableContent();
          }
        });
      } else {
        if (confirm('Bạn có chắc chắn muốn xóa quy tắc #' + ruleId + '?')) {
          window.store.deleteDiscountRule(ruleId).then(() => {
            if (window.UICommon) window.UICommon.showToast('Đã xóa quy tắc #' + ruleId, 'success');
            const container = document.getElementById('adminPromotionsTableContainer');
            if (container) container.innerHTML = AdminWeb._renderPromotionsTableContent();
          });
        }
      }
    },

    // ---------------- MODAL KHUYẾN MÃI ----------------
    openAddPromotionModal() {
      this._editingPromotionId = null;
      const today = new Date().toISOString().split('T')[0];
      this._showPromotionModal({
        id: '',
        name: '',
        type: 'Giảm giá %',
        value: 10,
        target: 'Tất cả khách hàng',
        startDate: today,
        endDate: '2026-12-31',
        status: 'Đang áp dụng',
        serviceIds: [],
        productIds: []
      }, false);
    },

    openEditPromotionModal(kmId) {
      this._editingPromotionId = kmId;
      const all = (window.store && typeof window.store.getPromotions === 'function') ? window.store.getPromotions() : [];
      const p = all.find(x => (x.id === kmId || x.MaKhuyenMai === kmId));
      if (!p) {
        if (window.UICommon) window.UICommon.showToast('Không tìm thấy khuyến mãi #' + kmId, 'error');
        return;
      }
      this._showPromotionModal({
        id: p.id || p.MaKhuyenMai,
        name: p.name || p.TenKhuyenMai,
        type: p.type || p.HinhThuc || 'Giảm giá %',
        value: p.value !== undefined ? p.value : (p.GiaTriGiam || 0),
        target: p.target || p.DoiTuongApDung || 'Tất cả khách hàng',
        startDate: p.startDate || p.NgayBatDau || '',
        endDate: p.endDate || p.NgayKetThuc || '',
        status: p.status || p.TrangThai || 'Đang áp dụng',
        serviceIds: Array.isArray(p.serviceIds) ? p.serviceIds : [],
        productIds: Array.isArray(p.productIds) ? p.productIds : []
      }, true);
    },

    _showPromotionModal(data, isEdit) {
      const modalId = 'modalPromotionForm';
      let modalEl = document.getElementById(modalId);
      if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = modalId;
        document.body.appendChild(modalEl);
      }

      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const products = (window.store && typeof window.store.getProducts === 'function') ? window.store.getProducts() : [];
      const selectedSIds = new Set(data.serviceIds || []);
      const selectedPIds = new Set(data.productIds || []);

      modalEl.innerHTML = `
        <div class="custom-modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 20px;">
          <div style="background: var(--surface-card, #1c1c1e); border: 1px solid var(--border-color, #333); border-radius: 14px; width: 100%; max-width: 680px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden;">
            <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
              <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">
                ${isEdit ? 'Sửa Chương Trình Khuyến Mãi' : 'Thêm Chương Trình Khuyến Mãi Mới'}
              </h3>
              <button type="button" style="background: none; border: none; font-size: 18px; color: var(--text-secondary); cursor: pointer;" onclick="document.getElementById('${modalId}').remove();">✕</button>
            </div>
            
            <form onsubmit="AdminWeb.submitPromotionForm(event, ${isEdit});" style="padding: 20px; overflow-y: auto; flex: 1;">
              <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 14px;">
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Mã Khuyến Mãi</label>
                  <input type="text" id="pmFormId" class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px; font-weight: 700;" 
                         value="${this.escapeHtml(data.id || '')}" ${isEdit ? 'readonly' : 'placeholder="Tự sinh (VD: KM02)"'}>
                </div>
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Tên Chương Trình Khuyến Mãi *</label>
                  <input type="text" id="pmFormName" class="form-control-custom" required style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px;" 
                         value="${this.escapeHtml(data.name || '')}" placeholder="VD: Chào Thu Rực Rỡ">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Hình Thức Giảm</label>
                  <select id="pmFormType" class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px;">
                    <option value="Giảm giá %" ${data.type.includes('%') ? 'selected' : ''}>Giảm giá %</option>
                    <option value="Giảm giá tiền mặt" ${!data.type.includes('%') ? 'selected' : ''}>Giảm tiền mặt (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Giá Trị Giảm *</label>
                  <input type="number" step="any" min="0" id="pmFormValue" required class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px; font-weight: 700; color: var(--brand-accent);" 
                         value="${data.value}" placeholder="VD: 10">
                </div>
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Đối Tượng Áp Dụng</label>
                  <input type="text" id="pmFormTarget" class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px;" 
                         value="${this.escapeHtml(data.target || 'Tất cả khách hàng')}">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 18px;">
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Ngày Bắt Đầu *</label>
                  <input type="date" id="pmFormStartDate" required class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px;" 
                         value="${data.startDate}">
                </div>
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Ngày Kết Thúc *</label>
                  <input type="date" id="pmFormEndDate" required class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px;" 
                         value="${data.endDate}">
                </div>
                <div>
                  <label style="display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Trạng Thái</label>
                  <select id="pmFormStatus" class="form-control-custom" style="width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-elevated); padding: 0 12px;">
                    <option value="Đang áp dụng" ${data.status === 'Đang áp dụng' ? 'selected' : ''}>Đang áp dụng</option>
                    <option value="Tạm dừng" ${data.status === 'Tạm dừng' ? 'selected' : ''}>Tạm dừng</option>
                  </select>
                </div>
              </div>

              <!-- PHẦN CHỌN SẢN PHẨM & DỊCH VỤ HOẶC 1 TRONG 2 -->
              <div style="border-top: 1px solid var(--border-color); padding-top: 14px; margin-bottom: 14px;">
                <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                  Phạm Vi Áp Dụng (Chọn Dịch Vụ và/hoặc Sản Phẩm)
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
                  Bạn có thể chọn dịch vụ, sản phẩm hoặc cả hai. Nếu không chọn mục nào, khuyến mãi sẽ mặc định áp dụng chung.
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                  <!-- Cột 1: Danh sách Dịch vụ -->
                  <div style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
                    <div style="font-weight: 700; font-size: 12.5px; color: #3b82f6; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                      <span>Dịch Vụ Cắt / Uốn / Nhuộm</span>
                      <label style="font-size: 11px; font-weight: normal; cursor: pointer; color: var(--text-secondary);">
                        <input type="checkbox" onchange="document.querySelectorAll('.chk-promo-service').forEach(c => c.checked = this.checked);"> Chọn tất cả
                      </label>
                    </div>
                    <div style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px;">
                      ${services.map(s => {
                        const sId = s.id || s.MaDichVu;
                        const sName = s.name || s.TenDichVu;
                        const isChecked = selectedSIds.has(sId);
                        return `
                          <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; padding: 4px 6px; border-radius: 4px; background: rgba(255,255,255,0.02);">
                            <input type="checkbox" class="chk-promo-service" value="${this.escapeHtml(sId)}" ${isChecked ? 'checked' : ''}>
                            <span style="font-family: monospace; font-weight: 700; color: var(--text-secondary);">${this.escapeHtml(sId)}</span>
                            <span style="color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(sName)}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- Cột 2: Danh sách Sản phẩm -->
                  <div style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
                    <div style="font-weight: 700; font-size: 12.5px; color: #10b981; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                      <span>Sản Phẩm &amp; Mỹ Phẩm</span>
                      <label style="font-size: 11px; font-weight: normal; cursor: pointer; color: var(--text-secondary);">
                        <input type="checkbox" onchange="document.querySelectorAll('.chk-promo-product').forEach(c => c.checked = this.checked);"> Chọn tất cả
                      </label>
                    </div>
                    <div style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px;">
                      ${products.map(p => {
                        const pId = p.id || p.MaSanPham;
                        const pName = p.name || p.TenSanPham;
                        const isChecked = selectedPIds.has(pId);
                        return `
                          <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; padding: 4px 6px; border-radius: 4px; background: rgba(255,255,255,0.02);">
                            <input type="checkbox" class="chk-promo-product" value="${this.escapeHtml(pId)}" ${isChecked ? 'checked' : ''}>
                            <span style="font-family: monospace; font-weight: 700; color: var(--text-secondary);">${this.escapeHtml(pId)}</span>
                            <span style="color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(pName)}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                <button type="button" style="padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer;"
                        onclick="document.getElementById('${modalId}').remove();">Hủy</button>
                <button type="submit" class="btn-submit-terracotta" style="padding: 9px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; background: var(--brand-accent, #C59B27); color: #141413; border: none;">
                  ${isEdit ? 'Lưu Khuyến Mãi' : 'Thêm Khuyến Mãi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    async submitPromotionForm(e, isEdit) {
      e.preventDefault();
      const id = (document.getElementById('pmFormId')?.value || '').trim();
      const name = (document.getElementById('pmFormName')?.value || '').trim();
      const type = document.getElementById('pmFormType')?.value || 'Giảm giá %';
      const value = parseFloat(document.getElementById('pmFormValue')?.value || '0');
      const target = (document.getElementById('pmFormTarget')?.value || 'Tất cả khách hàng').trim();
      const startDate = document.getElementById('pmFormStartDate')?.value;
      const endDate = document.getElementById('pmFormEndDate')?.value;
      const status = document.getElementById('pmFormStatus')?.value || 'Đang áp dụng';

      if (!name) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập tên khuyến mãi', 'warning');
        return;
      }

      const serviceIds = [];
      document.querySelectorAll('.chk-promo-service:checked').forEach(c => serviceIds.push(c.value));
      const productIds = [];
      document.querySelectorAll('.chk-promo-product:checked').forEach(c => productIds.push(c.value));

      const payload = {
        id,
        MaKhuyenMai: id,
        code: id,
        name,
        TenKhuyenMai: name,
        type,
        HinhThuc: type,
        value,
        GiaTriGiam: value,
        target,
        DoiTuongApDung: target,
        startDate,
        NgayBatDau: startDate,
        endDate,
        NgayKetThuc: endDate,
        status,
        TrangThai: status,
        serviceIds,
        productIds
      };

      try {
        if (isEdit && this._editingPromotionId) {
          await window.store.updatePromotion(this._editingPromotionId, payload);
          if (window.UICommon) window.UICommon.showToast('Đã cập nhật chương trình khuyến mãi thành công!', 'success');
        } else {
          await window.store.addPromotion(payload);
          if (window.UICommon) window.UICommon.showToast('Đã tạo chương trình khuyến mãi mới thành công!', 'success');
        }
      } catch (err) {
        if (window.UICommon) window.UICommon.showToast('Lỗi lưu khuyến mãi: ' + err.message, 'error');
      }

      const modalEl = document.getElementById('modalPromotionForm');
      if (modalEl) modalEl.remove();

      // Cập nhật lại bảng
      const container = document.getElementById('adminPromotionsTableContainer');
      if (container) container.innerHTML = this._renderPromotionsTableContent();
    },

    confirmDeletePromotion(kmId) {
      if (typeof window.AdminModalDelete !== 'undefined' && typeof window.AdminModalDelete.openDeleteModal === 'function') {
        window.AdminModalDelete.openDeleteModal({
          title: 'Xóa Chương Trình Khuyến Mãi #' + kmId,
          message: 'Bạn có chắc chắn muốn xóa chương trình khuyến mãi này không? Thao tác này sẽ xóa vĩnh viễn trong CSDL SQL Server.',
          confirmText: 'Xác Nhận Xóa',
          onConfirm: async () => {
            await window.store.deletePromotion(kmId);
            if (window.UICommon) window.UICommon.showToast('Đã xóa khuyến mãi #' + kmId, 'success');
            const container = document.getElementById('adminPromotionsTableContainer');
            if (container) container.innerHTML = AdminWeb._renderPromotionsTableContent();
          }
        });
      } else {
        if (confirm('Bạn có chắc chắn muốn xóa khuyến mãi #' + kmId + '?')) {
          window.store.deletePromotion(kmId).then(() => {
            if (window.UICommon) window.UICommon.showToast('Đã xóa khuyến mãi #' + kmId, 'success');
            const container = document.getElementById('adminPromotionsTableContainer');
            if (container) container.innerHTML = AdminWeb._renderPromotionsTableContent();
          });
        }
      }
    }
  });

})(typeof window !== 'undefined' ? window : this);

