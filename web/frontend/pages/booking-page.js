// =========================================================================
// Omni Salon — CASCADING ACCORDION BOOKING PAGE (FULL-LIGHT & HIGH CONTRAST)
// Tuân thủ: Yêu cầu Thứ 6 (Chọn dịch vụ -> xổ xuống thợ -> xổ xuống ngày giờ -> xổ xuống xác nhận)
// Thuần Tiếng Việt 100% • Full Sáng Dịu Mắt • Cân Bằng Thẻ Tuyệt Đối
// =========================================================================

(function (window) {
  'use strict';

  const BookingPage = {
    // Trạng thái mở xổ xuống của 4 phần
    expandedSteps: {
      step1: true,
      step2: false,
      step3: false,
      step4: false
    },

    bookingState: {
      serviceId: '',
      branchId: 'CN01',
      stylistId: '',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '',
      customerName: '',
      customerPhone: '',
      paymentMethod: 'VietQR',
      notes: ''
    },

    render(container, params = {}) {
      if (!container) return;

      if (params.service) {
        this.bookingState.serviceId = String(params.service).replace(/[^a-zA-Z0-9_-]/g, '');
        this.expandedSteps.step2 = true;
      }
      if (params.branch) this.bookingState.branchId = String(params.branch).replace(/[^a-zA-Z0-9_-]/g, '');
      if (params.stylist) {
        this.bookingState.stylistId = String(params.stylist).replace(/[^a-zA-Z0-9_-]/g, '');
        this.expandedSteps.step3 = true;
      }

      if (!this.bookingState.branchId || this.bookingState.branchId === 'br-dbp') this.bookingState.branchId = 'CN01';

      const user = (window.store && typeof window.store.getCurrentUser === 'function') 
        ? window.store.getCurrentUser() 
        : null;
      if (user) {
        if (!this.bookingState.customerName) this.bookingState.customerName = user.name || user.fullName || '';
        if (!this.bookingState.customerPhone) this.bookingState.customerPhone = user.phone || '';
      }

      container.innerHTML = `
        <div class="booking-page-shell w-full mx-auto" style="padding-top: 40px; padding-bottom: 80px; max-width: 1200px; margin: 0 auto; padding-left: clamp(16px, 3.5vw, 40px); padding-right: clamp(16px, 3.5vw, 40px); color: var(--text-primary); box-sizing: border-box;">
          <!-- Tiêu Đề Đặt Lịch -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; background: var(--brand-accent-subtle); border: 1px solid var(--brand-accent-border); color: var(--brand-accent); font-size: 13px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">
              <span>📅</span> HỆ THỐNG ĐẶT LỊCH HẸN TRỰC TUYẾN • OMNI SALON
            </div>
            <h1 style="font-size: clamp(28px, 3.5vw, 40px); font-weight: 900; color: var(--text-primary); letter-spacing: -0.01em; margin-bottom: 8px;">
              Đặt Lịch Trải Nghiệm Salon 5 Sao
            </h1>
            <p style="color: var(--text-secondary); font-size: 15px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
              Chọn dịch vụ yêu thích để mở tiếp các bước chọn thợ tạo mẫu, ngày giờ hẹn và thông tin nhận vé.
            </p>
          </div>

          <!-- LỰA CHỌN CHI NHÁNH CHUNG -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 22px;">📍</span>
              <div>
                <strong style="color: var(--text-primary); font-size: 15px; display: block;">Chi Nhánh Phục Vụ:</strong>
                <span style="color: var(--text-secondary); font-size: 13px;">Chọn salon gần bạn nhất</span>
              </div>
            </div>
            <select id="bookingBranchPicker" onchange="BookingPage.changeBranch(this.value)"
                    style="min-width: 280px; height: 44px; padding: 0 16px; border-radius: 10px; background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text-primary); font-size: 14px; font-weight: 600; outline: none; cursor: pointer;">
              ${this.renderBranchOptionsHTML()}
            </select>
          </div>

          <!-- HỆ THỐNG CASCADING ACCORDION 4 BƯỚC -->
          <div class="booking-cascading-container" style="display: flex; flex-direction: column; gap: 20px;">
            
            <!-- PHẦN 1: CHỌN DỊCH VỤ (BƯỚC 1) -->
            <div class="booking-cascade-block" id="cascadeStep1" style="background: var(--surface-card); border: 1.5px solid ${this.bookingState.serviceId ? 'var(--brand-accent)' : 'var(--border-color)'}; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
              <div class="cascade-header" onclick="BookingPage.toggleAccordion('step1')"
                   style="padding: 20px 28px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 36px; height: 36px; border-radius: 50%; background: ${this.bookingState.serviceId ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.bookingState.serviceId ? '#ffffff' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">
                    ${this.bookingState.serviceId ? '✓' : '1'}
                  </span>
                  <div>
                    <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0;">1. Chọn Dịch Vụ &amp; Gói Chăm Sóc</h3>
                    <span style="font-size: 13px; color: ${this.bookingState.serviceId ? 'var(--brand-accent)' : 'var(--text-secondary)'}; font-weight: 600;">
                      ${this.getSelectedServiceName() || 'Bấm vào 1 dịch vụ để tiếp tục'}
                    </span>
                  </div>
                </div>
                <span style="font-size: 18px; color: var(--text-secondary); transform: ${this.expandedSteps.step1 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep1" style="display: ${this.expandedSteps.step1 ? 'block' : 'none'}; padding: 24px 28px;">
                ${this.renderStep1ServicesHTML()}
              </div>
            </div>

            <!-- PHẦN 2: CHỌN THỢ TẠO MẪU (BƯỚC 2) -->
            <div class="booking-cascade-block" id="cascadeStep2" style="background: var(--surface-card); border: 1.5px solid ${this.bookingState.stylistId || (this.expandedSteps.step3 && !this.bookingState.stylistId) ? 'var(--brand-accent)' : 'var(--border-color)'}; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); opacity: ${this.bookingState.serviceId ? '1' : '0.6'};">
              <div class="cascade-header" onclick="${this.bookingState.serviceId ? "BookingPage.toggleAccordion('step2')" : "UICommon.showToast('Vui lòng chọn dịch vụ ở Bước 1 trước!', 'warning')"}"
                   style="padding: 20px 28px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: ${this.bookingState.serviceId ? 'pointer' : 'not-allowed'}; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 36px; height: 36px; border-radius: 50%; background: ${this.expandedSteps.step3 ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.expandedSteps.step3 ? '#ffffff' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">
                    ${this.expandedSteps.step3 ? '✓' : '2'}
                  </span>
                  <div>
                    <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0;">2. Chọn Thợ Tạo Mẫu (Stylist)</h3>
                    <span style="font-size: 13px; color: ${this.expandedSteps.step3 ? 'var(--brand-accent)' : 'var(--text-secondary)'}; font-weight: 600;">
                      ${this.getSelectedStylistName() || (this.bookingState.serviceId ? 'Chọn thợ phục vụ hoặc tự động xếp thợ' : 'Chờ chọn dịch vụ...')}
                    </span>
                  </div>
                </div>
                <span style="font-size: 18px; color: var(--text-secondary); transform: ${this.expandedSteps.step2 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep2" style="display: ${this.expandedSteps.step2 ? 'block' : 'none'}; padding: 24px 28px;">
                ${this.renderStep2StylistsHTML()}
              </div>
            </div>

            <!-- PHẦN 3: CHỌN NGÀY & GIỜ HẸN (BƯỚC 3) -->
            <div class="booking-cascade-block" id="cascadeStep3" style="background: var(--surface-card); border: 1.5px solid ${this.bookingState.timeSlot ? 'var(--brand-accent)' : 'var(--border-color)'}; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); opacity: ${this.expandedSteps.step3 || this.bookingState.timeSlot ? '1' : '0.6'};">
              <div class="cascade-header" onclick="${this.bookingState.serviceId ? "BookingPage.toggleAccordion('step3')" : "UICommon.showToast('Vui lòng hoàn thành các bước trên trước!', 'warning')"}"
                   style="padding: 20px 28px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: ${this.bookingState.serviceId ? 'pointer' : 'not-allowed'}; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 36px; height: 36px; border-radius: 50%; background: ${this.bookingState.timeSlot ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.bookingState.timeSlot ? '#ffffff' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">
                    ${this.bookingState.timeSlot ? '✓' : '3'}
                  </span>
                  <div>
                    <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0;">3. Chọn Ngày &amp; Giờ Hẹn</h3>
                    <span style="font-size: 13px; color: ${this.bookingState.timeSlot ? 'var(--brand-accent)' : 'var(--text-secondary)'}; font-weight: 600;">
                      ${this.bookingState.timeSlot ? `${SalonUtils.formatDate(this.bookingState.date)} lúc ${this.bookingState.timeSlot}` : 'Chọn ngày và khung giờ bạn muốn đến'}
                    </span>
                  </div>
                </div>
                <span style="font-size: 18px; color: var(--text-secondary); transform: ${this.expandedSteps.step3 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep3" style="display: ${this.expandedSteps.step3 ? 'block' : 'none'}; padding: 24px 28px;">
                ${this.renderStep3DateTimeHTML()}
              </div>
            </div>

            <!-- PHẦN 4: THÔNG TIN & XÁC NHẬN ĐẶT LỊCH (BƯỚC 4) -->
            <div class="booking-cascade-block" id="cascadeStep4" style="background: var(--surface-card); border: 1.5px solid ${this.expandedSteps.step4 ? 'var(--brand-accent)' : 'var(--border-color)'}; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); opacity: ${this.expandedSteps.step4 ? '1' : '0.6'};">
              <div class="cascade-header" onclick="${this.bookingState.timeSlot ? "BookingPage.toggleAccordion('step4')" : "UICommon.showToast('Vui lòng chọn ngày và giờ hẹn ở Bước 3 trước!', 'warning')"}"
                   style="padding: 20px 28px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: ${this.bookingState.timeSlot ? 'pointer' : 'not-allowed'}; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 36px; height: 36px; border-radius: 50%; background: ${this.expandedSteps.step4 ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.expandedSteps.step4 ? '#ffffff' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">
                    4
                  </span>
                  <div>
                    <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0;">4. Thông Tin Khách Hàng &amp; Xác Nhận Đặt Lịch</h3>
                    <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">
                      ${this.expandedSteps.step4 ? 'Kiểm tra thông tin phiếu đặt hẹn và hoàn tất' : 'Chờ hoàn thành các bước trên...'}
                    </span>
                  </div>
                </div>
                <span style="font-size: 18px; color: var(--text-secondary); transform: ${this.expandedSteps.step4 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep4" style="display: ${this.expandedSteps.step4 ? 'block' : 'none'}; padding: 24px 28px;">
                ${this.renderStep4ConfirmationHTML()}
              </div>
            </div>

          </div>
        </div>
      `;
    },

    toggleAccordion(stepKey) {
      this.expandedSteps[stepKey] = !this.expandedSteps[stepKey];
      const body = document.getElementById(`body${stepKey.charAt(0).toUpperCase() + stepKey.slice(1)}`);
      if (body) {
        body.style.display = this.expandedSteps[stepKey] ? 'block' : 'none';
      }
      this.render(document.getElementById('webMainContainer'));
    },

    // ── XỬ LÝ CHỌN VÀ TỰ ĐỘNG XỔ XUỐNG BƯỚC TIẾP THEO ──
    onSelectService(serviceId) {
      this.bookingState.serviceId = serviceId;
      // Tự động mở Bước 2 (Thợ tạo mẫu) và cuộn xuống
      this.expandedSteps.step2 = true;
      const main = document.getElementById('webMainContainer');
      this.render(main);

      setTimeout(() => {
        const el = document.getElementById('cascadeStep2');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    },

    onSelectStylist(stylistId) {
      this.bookingState.stylistId = stylistId;
      // Tự động mở Bước 3 (Ngày & Giờ) và cuộn xuống
      this.expandedSteps.step3 = true;
      const main = document.getElementById('webMainContainer');
      this.render(main);

      setTimeout(() => {
        const el = document.getElementById('cascadeStep3');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    },

    onSelectDate(dateIso) {
      this.bookingState.date = dateIso;
      this.render(document.getElementById('webMainContainer'));
    },

    onSelectTimeSlot(time) {
      this.bookingState.timeSlot = time;
      // Tự động mở Bước 4 (Thông tin & Xác nhận) và cuộn xuống
      this.expandedSteps.step4 = true;
      const main = document.getElementById('webMainContainer');
      this.render(main);

      setTimeout(() => {
        const el = document.getElementById('cascadeStep4');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    },

    changeBranch(branchId) {
      this.bookingState.branchId = branchId;
      this.bookingState.stylistId = '';
      this.render(document.getElementById('webMainContainer'));
    },

    // ── RENDERING HELPERS ──
    renderBranchOptionsHTML() {
      const branches = (window.store && typeof window.store.getBranches === 'function') 
        ? window.store.getBranches() 
        : (window.INITIAL_SALON_DATA?.branches || []);
      return branches.map(b => `
        <option value="${b.id}" ${this.bookingState.branchId === b.id ? 'selected' : ''}>
          ${(b.TenChiNhanh || b.name).split('—')[0].trim()}
        </option>
      `).join('');
    },

    getSelectedServiceName() {
      if (!this.bookingState.serviceId) return '';
      const s = (window.store && typeof window.store.getServiceById === 'function') 
        ? (window.store.getServiceById(this.bookingState.serviceId) || window.store.getComboById(this.bookingState.serviceId))
        : null;
      return s ? `Đã chọn: ${s.name || s.TenDichVu} (${SalonUtils.formatCurrency(s.price || s.Gia)})` : '';
    },

    getSelectedStylistName() {
      if (this.bookingState.stylistId === '') {
        return this.expandedSteps.step3 ? 'Đã chọn: Tự động xếp thợ tay nghề cao' : '';
      }
      const st = (window.store && typeof window.store.getStylistById === 'function')
        ? window.store.getStylistById(this.bookingState.stylistId)
        : null;
      return st ? `Đã chọn: ${st.name} (${st.level || 'Master Stylist'})` : '';
    },

    renderStep1ServicesHTML() {
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const combos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];

      return `
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Danh Sách Combo VIP -->
          ${combos.length > 0 ? `
            <div>
              <span style="font-size: 13px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">
                👑 GÓI COMBO ĐẶC QUYỀN VIP
              </span>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                ${combos.map(c => `
                  <div class="booking-service-card" onclick="BookingPage.onSelectService('${c.id}')"
                       style="padding: 20px; border-radius: 16px; border: 2px solid ${this.bookingState.serviceId === c.id ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.bookingState.serviceId === c.id ? 'var(--brand-accent-subtle)' : 'var(--surface-card)'}; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease;">
                    <div>
                      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                        <span style="font-size: 11px; font-weight: 800; background: rgba(22, 101, 52, 0.2); color: #16a34a; border: 1px solid rgba(22, 163, 74, 0.3); padding: 3px 8px; border-radius: 9999px;">👑 COMBO VIP</span>
                        <span style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">⏱️ ${c.duration || 70} phút</span>
                      </div>
                      <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">${c.name}</h4>
                      <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 14px;">${c.description}</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
                      <span style="font-size: 18px; font-weight: 900; color: var(--brand-accent);">${SalonUtils.formatCurrency(c.price)}</span>
                      <button type="button" style="padding: 6px 14px; border-radius: 8px; border: none; background: ${this.bookingState.serviceId === c.id ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.bookingState.serviceId === c.id ? '#ffffff' : 'var(--text-primary)'}; font-size: 13px; font-weight: 700; cursor: pointer;">
                        ${this.bookingState.serviceId === c.id ? '✓ Đang Chọn' : 'Chọn Gói Này'}
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Danh Sách Dịch Vụ Lẻ Chuẩn -->
          <div>
            <span style="font-size: 13px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">
              💈 CÁC DỊCH VỤ CẮT, UỐN, NHUỘM &amp; PHỤC HỒI
            </span>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
              ${services.map(s => `
                <div class="booking-service-card" onclick="BookingPage.onSelectService('${s.id}')"
                     style="padding: 20px; border-radius: 16px; border: 2px solid ${this.bookingState.serviceId === s.id ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.bookingState.serviceId === s.id ? 'var(--brand-accent-subtle)' : 'var(--surface-card)'}; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                      <span style="font-size: 12px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase;">DỊCH VỤ SALON</span>
                      <span style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">⏱️ ${s.duration || s.ThoiLuong || 45} phút</span>
                    </div>
                    <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">${s.name || s.TenDichVu}</h4>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 14px;">${s.description || s.MoTa || ''}</p>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
                    <span style="font-size: 18px; font-weight: 900; color: var(--brand-accent);">${SalonUtils.formatCurrency(s.price || s.Gia)}</span>
                    <button type="button" style="padding: 6px 14px; border-radius: 8px; border: none; background: ${this.bookingState.serviceId === s.id ? 'var(--brand-accent)' : 'var(--surface-elevated)'}; color: ${this.bookingState.serviceId === s.id ? '#ffffff' : 'var(--text-primary)'}; font-size: 13px; font-weight: 700; cursor: pointer;">
                      ${this.bookingState.serviceId === s.id ? '✓ Đang Chọn' : 'Chọn Dịch Vụ'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    },

    renderStep2StylistsHTML() {
      const stylists = (window.store && typeof window.store.getStylists === 'function') 
        ? window.store.getStylists(this.bookingState.branchId) 
        : [];

      return `
        <div>
          <!-- Lựa chọn tự động xếp thợ -->
          <div onclick="BookingPage.onSelectStylist('')"
               style="padding: 18px 24px; border-radius: 16px; cursor: pointer; border: 2px solid ${this.bookingState.stylistId === '' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.bookingState.stylistId === '' ? 'var(--brand-accent-subtle)' : 'var(--surface-card)'}; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--brand-accent-subtle); color: var(--brand-accent); border: 1px solid var(--brand-accent-border); display: flex; align-items: center; justify-content: center; font-size: 22px;">⚡</div>
              <div>
                <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px;">⚡ Tự Động Chọn Thợ Tay Nghề Cao (Nhanh Nhất)</h4>
                <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Hệ thống tự động xếp thợ đang có lịch trống tại chi nhánh để bạn không phải chờ đợi lâu.</p>
              </div>
            </div>
            <span style="font-size: 14px; font-weight: 800; color: var(--brand-accent);">
              ${this.bookingState.stylistId === '' ? '✓ Đang Chọn' : 'Chọn Nhanh'}
            </span>
          </div>

          <!-- Lưới thợ cắt tóc & stylist -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;">
            ${stylists.map(s => `
              <div onclick="BookingPage.onSelectStylist('${s.id}')"
                   style="padding: 20px; border-radius: 16px; cursor: pointer; border: 2px solid ${this.bookingState.stylistId === s.id ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.bookingState.stylistId === s.id ? 'var(--brand-accent-subtle)' : 'var(--surface-card)'}; text-align: center; transition: all 0.2s ease;">
                <div style="width: 72px; height: 72px; margin: 0 auto 12px; border-radius: 50%; overflow: hidden; border: 2px solid var(--brand-accent);">
                  <img src="${s.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=140&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${s.name}" onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';">
                </div>
                <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">${s.name}</h4>
                <div style="margin-bottom: 6px; display: flex; justify-content: center; gap: 6px; align-items: center;">
                  <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; ${s.role === 'Thợ phụ' ? 'background: rgba(14, 165, 233, 0.15); color: #0284c7;' : 'background: rgba(245, 158, 11, 0.15); color: #d97706;'}">
                    ${s.role === 'Thợ phụ' ? '🧴 Thợ Phụ' : '✂️ Thợ Chính'}
                  </span>
                  <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${s.level || 'Master Barber'}</span>
                </div>
                <span style="font-size: 12px; color: var(--text-secondary);">★ ${s.rating || '5.0'} • Sẵn sàng đón tiếp</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    renderStep3DateTimeHTML() {
      const nextDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        const dayName = i === 0 ? 'Hôm nay' : (i === 1 ? 'Ngày mai' : `Th ${d.getDay() === 0 ? 'CN' : d.getDay() + 1}`);
        const dateFormatted = `${d.getDate()}/${d.getMonth() + 1}`;
        return { iso, dayName, dateFormatted };
      });

      const service = (window.store && typeof window.store.getServiceById === 'function')
        ? (window.store.getServiceById(this.bookingState.serviceId) || window.store.getComboById(this.bookingState.serviceId))
        : null;
      const duration = Number(service ? (service.duration || service.duration_minutes || 45) : 45);

      const availableSlots = (window.store && typeof window.store.getAvailableSlots === 'function')
        ? window.store.getAvailableSlots(this.bookingState.date, this.bookingState.stylistId, this.bookingState.branchId, duration)
        : [];

      return `
        <div>
          <!-- Lịch chọn 7 ngày tiếp theo -->
          <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 24px;">
            ${nextDays.map(day => `
              <div onclick="BookingPage.onSelectDate('${day.iso}')"
                   style="flex: 1; min-width: 90px; padding: 12px 8px; border-radius: 12px; text-align: center; cursor: pointer; border: 2px solid ${this.bookingState.date === day.iso ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.bookingState.date === day.iso ? 'var(--brand-accent-subtle)' : 'var(--surface-elevated)'}; transition: all 0.2s ease;">
                <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block;">${day.dayName}</span>
                <span style="font-size: 17px; font-weight: 900; color: var(--text-primary); display: block; margin: 4px 0;">${day.dateFormatted}</span>
                <span style="font-size: 11px; font-weight: 800; color: #16a34a;">CÒN CHỖ</span>
              </div>
            `).join('')}
          </div>

          <!-- Khung Giờ Hẹn -->
          <span style="font-size: 13px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">
            ⏰ KHUNG GIỜ PHỤC VỤ (BẤM VÀO ĐỂ CHỌN GIỜ)
          </span>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;">
            ${availableSlots.map(slot => {
              const isSelected = this.bookingState.timeSlot === slot.time;
              const isAvailable = slot.available !== false;
              return `
                <button type="button" onclick="${isAvailable ? `BookingPage.onSelectTimeSlot('${slot.time}')` : ''}"
                        style="padding: 12px 6px; border-radius: 10px; border: 1.5px solid ${isSelected ? 'var(--brand-accent)' : (isAvailable ? 'var(--border-color)' : 'transparent')}; background: ${isSelected ? 'var(--brand-accent)' : (isAvailable ? 'var(--surface-card)' : 'var(--surface-elevated)')}; color: ${isSelected ? '#ffffff' : (isAvailable ? 'var(--text-primary)' : 'var(--text-secondary)')}; cursor: ${isAvailable ? 'pointer' : 'not-allowed'}; font-weight: 800; font-size: 14px; transition: all 0.2s ease; opacity: ${isAvailable ? '1' : '0.5'};">
                  ${slot.time}
                  <span style="font-size: 10px; display: block; font-weight: 700; color: ${isSelected ? '#ffffff' : (isAvailable ? '#16a34a' : '#ef4444')}; margin-top: 2px;">
                    ${isAvailable ? 'Còn chỗ' : 'Kín lịch'}
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    renderStep4ConfirmationHTML() {
      const service = (window.store && typeof window.store.getServiceById === 'function')
        ? (window.store.getServiceById(this.bookingState.serviceId) || window.store.getComboById(this.bookingState.serviceId))
        : null;
      const branch = (window.store && typeof window.store.getBranchById === 'function')
        ? window.store.getBranchById(this.bookingState.branchId)
        : null;
      const stylist = (window.store && typeof window.store.getStylistById === 'function')
        ? window.store.getStylistById(this.bookingState.stylistId)
        : null;

      const duration = Number(service ? (service.duration || service.duration_minutes || 45) : 45);
      const estimatedEndTime = SalonUtils.calculateEndTime(this.bookingState.timeSlot, duration);
      const priceFormatted = SalonUtils.formatCurrency(service ? service.price : 180000);

      return `
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: start;">
          <!-- Cột Trái: Nhập Thông Tin Khách Hàng -->
          <div>
            <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 16px;">
              Thông Tin Khách Hàng Liên Hệ
            </h4>

            <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px;">
              <div>
                <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">HỌ VÀ TÊN QUÝ KHÁCH *</label>
                <input type="text" id="bookingNameInput" style="width: 100%; height: 44px; padding: 0 14px; border-radius: 10px; background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text-primary); font-size: 14px; font-weight: 600; outline: none; box-sizing: border-box;"
                       placeholder="Ví dụ: Nguyễn Văn Hưng" value="${SalonUtils.escapeHtml(this.bookingState.customerName)}"
                       oninput="BookingPage.bookingState.customerName = this.value">
              </div>

              <div>
                <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">SỐ ĐIỆN THOẠI NHẬN TIN NHẮN VÉ *</label>
                <input type="tel" id="bookingPhoneInput" style="width: 100%; height: 44px; padding: 0 14px; border-radius: 10px; background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text-primary); font-size: 14px; font-weight: 600; outline: none; box-sizing: border-box;"
                       placeholder="Ví dụ: 0908123456" value="${SalonUtils.escapeHtml(this.bookingState.customerPhone)}"
                       oninput="BookingPage.bookingState.customerPhone = this.value">
              </div>

              <div>
                <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">HÌNH THỨC THANH TOÁN</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <button type="button" onclick="BookingPage.bookingState.paymentMethod = 'VietQR'; BookingPage.render(document.getElementById('webMainContainer'));"
                          style="padding: 12px; border-radius: 10px; border: 2px solid ${this.bookingState.paymentMethod === 'VietQR' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.bookingState.paymentMethod === 'VietQR' ? 'var(--brand-accent-subtle)' : 'var(--surface-card)'}; color: var(--text-primary); font-size: 13px; font-weight: 700; cursor: pointer;">
                    📲 Quét Mã VietQR
                  </button>
                  <button type="button" onclick="BookingPage.bookingState.paymentMethod = 'Cash'; BookingPage.render(document.getElementById('webMainContainer'));"
                          style="padding: 12px; border-radius: 10px; border: 2px solid ${this.bookingState.paymentMethod === 'Cash' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.bookingState.paymentMethod === 'Cash' ? 'var(--brand-accent-subtle)' : 'var(--surface-card)'}; color: var(--text-primary); font-size: 13px; font-weight: 700; cursor: pointer;">
                    💵 Tiền Mặt Tại Quầy
                  </button>
                </div>
              </div>

              <div>
                <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">GHI CHÚ (TÙY CHỌN)</label>
                <textarea style="width: 100%; height: 60px; padding: 10px 14px; border-radius: 10px; resize: none; background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text-primary); font-size: 13px; outline: none; box-sizing: border-box;"
                          placeholder="Ví dụ: Tóc ngắn, cạo sát chân gáy..."
                          oninput="BookingPage.bookingState.notes = this.value">${SalonUtils.escapeHtml(this.bookingState.notes)}</textarea>
              </div>
            </div>
          </div>

          <!-- Cột Phải: Phiếu Đặt Chỗ & Nút Xác Nhận -->
          <div style="background: var(--surface-card); border: 1.5px solid var(--brand-accent); border-radius: 16px; padding: 24px; box-shadow: 0 4px 18px rgba(0,0,0,0.05);">
            <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 11px; font-weight: 800; color: var(--brand-accent); text-transform: uppercase;">PHIẾU ĐẶT CHỖ OMNI SALON</span>
                <h4 style="font-size: 17px; font-weight: 900; color: var(--text-primary); margin: 2px 0 0;">Tóm Tắt Hóa Đơn Số</h4>
              </div>
              <span style="font-size: 24px;">💈</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; margin-bottom: 18px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Chi Nhánh:</span>
                <strong style="color: var(--text-primary);">${branch ? branch.name.split('—')[0].trim() : 'Omni Salon Flagship'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Dịch Vụ:</span>
                <strong style="color: var(--brand-accent);">${service ? (service.name || service.TenDichVu) : 'Chưa chọn'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Thợ Tạo Mẫu:</span>
                <strong style="color: var(--text-primary);">${stylist ? stylist.name : '⚡ Tự Động Xếp Thợ'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Thời Gian:</span>
                <strong style="color: var(--text-primary);">${this.bookingState.timeSlot ? `${SalonUtils.formatDate(this.bookingState.date)} • ${this.bookingState.timeSlot} - ${estimatedEndTime}` : 'Chưa chọn'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Phương Thức:</span>
                <strong style="color: var(--text-primary);">${this.bookingState.paymentMethod === 'VietQR' ? 'Quét Mã VietQR' : 'Tiền Mặt'}</strong>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: baseline; border-top: 1.5px solid var(--border-color); padding-top: 14px; margin-bottom: 20px;">
              <span style="font-size: 14px; font-weight: 800; color: var(--text-secondary);">TỔNG CHI PHÍ:</span>
              <span style="font-size: 22px; font-weight: 900; color: var(--brand-accent);">${priceFormatted}</span>
            </div>

            <button type="button" onclick="BookingPage.confirmAndSubmit()"
                    style="width: 100%; height: 50px; border-radius: 12px; background: var(--brand-accent); border: none; color: #ffffff; font-size: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(180,131,18,0.35);">
              ✨ XÁC NHẬN ĐẶT LỊCH NGAY
            </button>
          </div>
        </div>
      `;
    },

    confirmAndSubmit() {
      const rawName = (this.bookingState.customerName || '').trim();
      const phone = (this.bookingState.customerPhone || '').trim();

      if (!this.bookingState.serviceId) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng chọn dịch vụ ở Bước 1!', 'warning');
        return;
      }
      if (!this.bookingState.timeSlot) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng chọn ngày và giờ hẹn ở Bước 3!', 'warning');
        return;
      }
      if (!rawName) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập họ và tên quý khách!', 'warning');
        return;
      }
      if (!phone || !/^[0-9]{9,11}$/.test(phone)) {
        if (window.UICommon) window.UICommon.showToast('Số điện thoại không hợp lệ (cần 9-11 chữ số)!', 'warning');
        return;
      }

      const bookingPayload = {
        serviceId: this.bookingState.serviceId,
        branchId: this.bookingState.branchId,
        stylistId: this.bookingState.stylistId,
        date: this.bookingState.date,
        timeSlot: this.bookingState.timeSlot,
        customerName: rawName,
        customerPhone: phone,
        paymentMethod: this.bookingState.paymentMethod || 'VietQR',
        notes: (this.bookingState.notes || '').trim()
      };

      if (window.UICommon) {
        window.UICommon.bookingData = bookingPayload;
        window.UICommon.submitBooking();
      }
    }
  };

  window.BookingPage = BookingPage;

})(typeof window !== 'undefined' ? window : this);

