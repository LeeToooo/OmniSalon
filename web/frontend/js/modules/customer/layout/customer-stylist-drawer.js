(function (window) {
  'use strict';

  const CustomerStylistDrawer = {
    /**
     * Escape chuỗi HTML an toàn
     */
    escapeHtml(str) {
      if (window.CustomerUtils && typeof window.CustomerUtils.escapeHtml === "function") { return window.CustomerUtils.escapeHtml(str); }
      if (typeof str !== 'string') return str == null ? '' : String(str);
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Xử lý thanh đặt lịch nhanh trên trang chủ (Branch, Service, Date)
     */
    submitQuickBooking() {
      const branchId = document.getElementById('quickBranchSelect')?.value;
      const serviceId = document.getElementById('quickServiceSelect')?.value;
      const date = document.getElementById('quickDateInput')?.value;

      if (window.UICommon && typeof window.UICommon.openBookingModal === 'function') {
        if (!window.UICommon.bookingData) window.UICommon.bookingData = {};
        if (branchId) window.UICommon.bookingData.branchId = branchId;
        if (date) window.UICommon.bookingData.date = date;
        window.UICommon.openBookingModal(serviceId, branchId);
      }
    },

    /**
     * Cuộn thanh trượt slider danh sách Master Stylist sang trái / phải
     * @param {number} direction - (-1: sang trái, 1: sang phải)
     */
    scrollStylistSlider(direction) {
      const slider = document.getElementById('stylistsSliderContainer');
      if (slider) {
        slider.scrollBy({ left: direction * 300, behavior: 'smooth' });
      }
    },

    /**
     * Mở ngăn kéo (Slide-over Drawer) xem thông tin chi tiết & lịch trống của Stylist
     * @param {string|number} stylistId 
     */
    openStylistDrawer(stylistId) {
      const stylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const st = stylists.find(s => String(s.id) === String(stylistId)) || stylists[0];
      if (!st) return;

      const drawer = document.getElementById('stylistSlideOverDrawer');
      const backdrop = document.getElementById('stylistDrawerBackdrop');
      const avatar = document.getElementById('drawerStylistAvatar');
      const name = document.getElementById('drawerStylistName');
      const title = document.getElementById('drawerStylistTitle');
      const body = document.getElementById('drawerStylistBody');
      const bookBtn = document.getElementById('drawerBookStylistBtn');

      if (avatar) avatar.src = st.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
      if (name) name.textContent = st.name;
      if (title) title.textContent = `${st.title || st.role || 'Senior Artisan'} • ${st.rating || '4.9'}`;

      const specialties = st.specialties || ['Cắt Fade', 'Uốn Con Sâu', 'Nhuộm Tẩy'];
      const todaySlots = ['09:00', '10:30', '14:00', '16:30', '19:00'];

      const escapeFn = (typeof this.escapeHtml === 'function')
        ? this.escapeHtml.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.escapeHtml === 'function')
          ? window.CustomerWeb.escapeHtml.bind(window.CustomerWeb)
          : (str) => (typeof str !== 'string' ? (str == null ? '' : String(str)) : str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

      if (body) {
        body.innerHTML = `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 8px;">CHUYÊN MÔN NỔI BẬT</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${specialties.map(sp => `<span class="badge-terracotta" style="font-size: 11px;">${escapeFn(sp)}</span>`).join('')}
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 8px;">KINH NGHIỆM TẠO MẪU</div>
            <p style="font-size: 13px; color: #CCC; line-height: 1.6; margin: 0;">
              ${st.bio || `Hơn ${st.experience || '6 năm'} kinh nghiệm trong nghệ thuật tạo mẫu tóc nam cao cấp. Chuyên sâu về kỹ thuật fade mượt mà và các phương pháp uốn sóng texture hiện đại.`}
            </p>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase;">KHUNG GIỜ TRỐNG HÔM NAY</span>
              <span style="font-size: 11px; color: #10B981; font-weight: 700;">Còn 5 ca trống</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              ${todaySlots.map(time => `
                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 4px; text-align: center; cursor: pointer;"
                     onclick="CustomerWeb.closeStylistDrawer(); if(window.UICommon) { if(!window.UICommon.bookingData) window.UICommon.bookingData = {}; window.UICommon.bookingData.timeSlot = '${time}'; window.UICommon.openBookingModal(null, null, '${st.id}'); }">
                  <span style="font-size: 13px; font-weight: 700; color: #FFF;">${time}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (bookBtn) {
        bookBtn.onclick = () => {
          this.closeStylistDrawer();
          if (window.UICommon && typeof window.UICommon.openBookingModal === 'function') {
            window.UICommon.openBookingModal(null, null, st.id);
          }
        };
      }

      if (backdrop) backdrop.classList.add('active');
      if (drawer) drawer.classList.add('active');
    },

    /**
     * Đóng ngăn kéo chi tiết Stylist
     */
    closeStylistDrawer() {
      const drawer = document.getElementById('stylistSlideOverDrawer');
      const backdrop = document.getElementById('stylistDrawerBackdrop');
      if (drawer) drawer.classList.remove('active');
      if (backdrop) backdrop.classList.remove('active');
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerStylistDrawer = CustomerStylistDrawer;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerStylistDrawer);
  }

})(typeof window !== 'undefined' ? window : this);

