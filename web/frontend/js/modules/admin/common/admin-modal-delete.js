(function (window) {
  'use strict';

  const AdminModalDelete = {
    openUniversalDeleteModal(type, id) {
      let title = 'Xác Nhận Xóa Khỏi Hệ Thống?';
      let badge = 'CẢNH BÁO XÓA DỮ LIỆU';
      let warning = 'Bạn có chắc chắn muốn xóa mục này khỏi hệ thống OmniSalon? Dữ liệu sẽ bị gỡ bỏ và đồng bộ trực tiếp vào database SQL.';
      let code = `#${id}`;
      let subTag = 'HỆ THỐNG';
      let name = id;
      let img = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';
      let detail1 = '';
      let detail2 = '';

      if (type === 'products') {
        const p = window.store.getProductById(id);
        badge = 'CẢNH BÁO XÓA HÀNG HÓA';
        title = 'Xác Nhận Xóa Khỏi Kho?';
        warning = 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống kho OmniSalon? Dữ liệu hàng hóa sẽ bị gỡ bỏ và không thể hoàn tác.';
        code = `#${id}`;
        subTag = p?.brand || 'CHÍNH HÃNG';
        name = p ? (p.name || p.TenSanPham) : id;
        const price = p?.price ? SalonUtils.formatCurrency(p.price) : '0 đ';
        const stock = window.store.getProductStock(null, id) || (p?.stock !== undefined ? p.stock : 0);
        detail1 = `<span style="color: #ef4444; font-weight: 800;">${price}</span>`;
        detail2 = `<span style="color: #94a3b8;">Tồn kho: <strong style="color: #f1f5f9;">${stock}</strong> hộp/cái</span>`;
        img = p?.image || p?.HinhAnh || img;
      } else if (type === 'services') {
        const s = window.store.getServiceById(id);
        badge = 'CẢNH BÁO XÓA DỊCH VỤ';
        title = 'Xác Nhận Xóa Dịch Vụ?';
        warning = 'Bạn có chắc chắn muốn xóa dịch vụ này khỏi danh mục OmniSalon? Dữ liệu dịch vụ sẽ bị xóa và cập nhật vào database SQL.';
        code = `#${id}`;
        subTag = s?.category || 'Dịch Vụ Cắt Tóc';
        name = s ? (s.name || s.TenDichVu) : id;
        const price = s?.price ? SalonUtils.formatCurrency(s.price) : '0 đ';
        const dur = s?.duration || s?.durationMinutes || 45;
        detail1 = `<span style="color: #ef4444; font-weight: 800;">${price}</span>`;
        detail2 = `<span style="color: #94a3b8;">Thời lượng: <strong style="color: #f1f5f9;">${dur} phút</strong></span>`;
        img = s?.image || img;
      } else if (type === 'combos') {
        const c = window.store.getComboById(id);
        badge = 'CẢNH BÁO XÓA COMBO VIP';
        title = 'Xác Nhận Xóa Gói Combo?';
        warning = 'Bạn có chắc chắn muốn xóa combo VIP này khỏi danh mục kinh doanh? Dữ liệu sẽ bị gỡ bỏ khỏi hệ thống.';
        code = `#${id}`;
        subTag = 'Combo VIP';
        name = c ? c.name : id;
        const price = c?.price ? SalonUtils.formatCurrency(c.price) : '0 đ';
        const dur = c?.duration || 60;
        detail1 = `<span style="color: #ef4444; font-weight: 800;">${price}</span>`;
        detail2 = `<span style="color: #94a3b8;">Thời lượng: <strong style="color: #f1f5f9;">${dur} phút</strong></span>`;
        img = c?.image || img;
      } else if (type === 'stylists') {
        const st = window.store.getStylistById(id);
        const role = st?.role || 'Thợ chính';
        badge = `CẢNH BÁO XÓA NHÂN SỰ (${role.toUpperCase()})`;
        title = 'Xác Nhận Xóa Thợ Khỏi Hệ Thống?';
        warning = `Bạn có chắc chắn muốn xóa ${role.toLowerCase()} này khỏi danh sách đội ngũ OmniSalon? Dữ liệu nhân sự sẽ bị gỡ bỏ và đồng bộ trực tiếp vào database SQL.`;
        code = `#${st?.id || id}`;
        subTag = `${role} • ${st?.level || 'Master Barber'}`;
        name = st ? (st.name || st.HoTen) : id;
        const brName = this._getBranchShortName(st?.branchId || 'CN01');
        detail1 = `<span style="color: #f59e0b; font-weight: 700;">${st?.rating ? Number(st.rating).toFixed(1) : '5.0'}</span>`;
        detail2 = `<span style="color: #94a3b8;">Cơ sở: <strong style="color: #f1f5f9;">${brName}</strong></span>`;
        img = st?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
      } else if (type === 'bookings') {
        const b = (window.store.getBookings() || []).find(it => it.id === id || it.bookingCode === id);
        badge = 'CẢNH BÁO XÓA LỊCH HẸN';
        title = 'Xác Nhận Xóa Lịch Hẹn?';
        warning = 'Bạn có chắc chắn muốn xóa vĩnh viễn phiếu lịch hẹn này khỏi hệ thống? Dữ liệu lịch hẹn sẽ bị gỡ bỏ hoàn toàn khỏi database SQL.';
        code = `#${b?.bookingCode || id}`;
        subTag = b?.serviceName || 'Lịch Hẹn Cắt Tóc';
        name = `Khách: ${b?.customerName || 'Khách Hàng'} (${b?.customerPhone || ''})`;
        detail1 = `<span style="color: #ef4444; font-weight: 800;">${b?.timeSlot || '09:00'} | ${b?.date || ''}</span>`;
        detail2 = `<span style="color: #94a3b8;">Thợ: <strong style="color: #f1f5f9;">${b?.stylistName || 'Barber'}</strong></span>`;
      } else if (type === 'branches') {
        const br = (window.store.getBranches() || []).find(b => b.id === id || b.MaChiNhanh === id);
        badge = 'CẢNH BÁO XÓA CHI NHÁNH';
        title = 'Xác Nhận Xóa Chi Nhánh Khỏi Hệ Thống?';
        warning = 'Bạn có chắc chắn muốn xóa chi nhánh này khỏi OmniSalon? Dữ liệu chi nhánh sẽ bị gỡ bỏ và đồng bộ trực tiếp vào database SQL.';
        code = `#${id}`;
        subTag = br?.city || 'Chi Nhánh Salon';
        name = br ? (br.name || br.TenChiNhanh) : id;
        const addr = br?.address || br?.DiaChi || '';
        const ph = br?.phone || br?.SoDienThoai || '';
        detail1 = `<span style="color: #ef4444; font-weight: 700;">${ph}</span>`;
        detail2 = `<span style="color: #94a3b8; font-size: 11px;">${addr}</span>`;
        img = br?.image || img;
      }

      const displayImg = typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function'
        ? SalonUtils.formatImageUrl(img)
        : (img || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80');

      this._openModal(`
        <div style="text-align: center; padding: 10px 4px; max-width: 480px; margin: 0 auto;">
          <!-- ICON NỔI BẬT NGUY HIỂM -->
          <div style="width: 72px; height: 72px; margin: 0 auto 16px; border-radius: 50%; background: rgba(239, 68, 68, 0.12); border: 2px solid rgba(239, 68, 68, 0.35); display: flex; align-items: center; justify-content: center; font-size: 32px; box-shadow: 0 0 25px rgba(239, 68, 68, 0.25);">
            Xóa
          </div>

          <div class="badge-terracotta" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.35); margin-bottom: 8px;">
            ${badge}
          </div>

          <h3 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 0 0 10px; letter-spacing: -0.01em;">
            ${title}
          </h3>

          <p style="font-size: 14px; color: #94a3b8; margin: 0 0 20px; line-height: 1.5;">
            ${warning}
          </p>

          <!-- CARD THÔNG TIN ĐỐI TƯỢNG CHUẨN BỊ XÓA -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 14px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px; text-align: left;">
            <img src="${displayImg}" alt="${this.escapeHtml(name)}" 
                 style="width: 60px; height: 60px; border-radius: 10px; object-fit: cover; background: #ffffff; padding: 2px; border: 1px solid rgba(255, 255, 255, 0.15); flex-shrink: 0;" 
                 onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=120&q=80');">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-family: monospace; font-size: 12px; font-weight: 800; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 1px 6px; border-radius: 4px;">${this.escapeHtml(code)}</span>
                <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">${this.escapeHtml(subTag)}</span>
              </div>
              <div style="font-size: 15px; font-weight: 700; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;" title="${this.escapeHtml(name)}">
                ${this.escapeHtml(name)}
              </div>
              <div style="display: flex; gap: 14px; font-size: 13px;">
                ${detail1}
                ${detail2}
              </div>
            </div>
          </div>

          <!-- NÚT HÀNH ĐỘNG -->
          <div style="display: flex; gap: 12px;">
            <button type="button" class="btn-cancel" style="flex: 1; min-height: 48px; font-size: 15px; font-weight: 700; cursor: pointer; border-radius: 12px;" onclick="AdminWeb._closeModal()">
              Hủy Bỏ / Giữ Lại
            </button>
            <button type="button" class="btn-delete-confirm-danger" style="flex: 1.3; min-height: 48px; font-size: 15px; font-weight: 800; cursor: pointer;" onclick="AdminWeb.executeUniversalDelete('${type}', '${id}')">
              Đồng Ý Xóa Ngay
            </button>
          </div>
        </div>
      `, false);
    },

    async executeUniversalDelete(type, id) {
      if (type === 'products') {
        const p = window.store.getProductById(id);
        const name = p ? (p.name || p.TenSanPham) : id;
        await window.store.deleteProduct(id);
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast(`Đã xóa sản phẩm #${id} (${name}) khỏi kho và database SQL!`);
        this.refreshInventoryView();
      } else if (type === 'services') {
        const s = window.store.getServiceById(id);
        const name = s ? (s.name || s.TenDichVu) : id;
        await window.store.deleteService(id);
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast(`Đã xóa dịch vụ #${id} (${name}) khỏi database SQL!`);
        this.refreshCatalogView();
      } else if (type === 'combos') {
        await window.store.deleteCombo(id);
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast(`Đã xóa combo #${id}!`);
        this.refreshCatalogView();
      } else if (type === 'stylists') {
        const st = window.store.getStylistById(id);
        const name = st ? (st.name || st.HoTen) : id;
        await window.store.deleteStylist(id);
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast(`Đã xóa thợ [${name}] (#${id}) khỏi hệ thống và database SQL!`);
        this.refreshSubTab();
      } else if (type === 'bookings') {
        await window.store.deleteBooking(id);
        this._closeModal();
      } else if (type === 'branches') {
        const br = (window.store.getBranches() || []).find(b => b.id === id || b.MaChiNhanh === id);
        const name = br ? (br.name || br.TenChiNhanh) : id;
        await window.store.deleteBranch(id);
        this._closeModal();
        if (window.UICommon) window.UICommon.showToast(`Đã xóa chi nhánh #${id} (${name}) khỏi hệ thống và database SQL!`);
        this.refreshSubTab();
      }
    },

  };

  // 1. Phơi đối tượng ra window
  window.AdminModalDelete = AdminModalDelete;

  // 2. Đồng bộ ngược lại AdminWeb nếu đã được nạp
  if (typeof window.AdminWeb !== 'undefined') {
    Object.assign(window.AdminWeb, AdminModalDelete);
  }

})(typeof window !== 'undefined' ? window : this);
