// =========================================================================
// OMNISALON — TRANG ĐẶT LỊCH HẸN TRỰC TUYẾN (PHONG CÁCH 4RAU BARBERSHOP)
// Đồ Án Tốt Nghiệp: Hệ Thống Đặt Lịch & Điều Hành Chuỗi Salon Tóc
// Hỗ trợ: Đặt nhiều dịch vụ cùng lúc, Cascading 4 bước, Toàn màn hình
// =========================================================================

(function (window) {
  'use strict';

  const BookingPage = {
    // Trạng thái mở các bước
    expandedSteps: {
      step1: true,
      step2: false,
      step3: false,
      step4: false
    },

    // Dữ liệu đặt lịch hiện tại
    bookingState: {
      serviceIds: [],       // Mảng chứa nhiều dịch vụ đã chọn
      serviceId: '',        // Dịch vụ chính
      branchId: 'CN01',
      stylistId: '',
      date: (() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      })(),
      timeSlot: '',
      customerName: '',
      customerPhone: '',
      paymentMethod: 'VietQR',
      notes: ''
    },

    render(container, params = {}) {
      if (!container) return;

      // Khởi tạo tham số từ URL nếu có
      if (params.service) {
        const sId = String(params.service).replace(/[^a-zA-Z0-9_-]/g, '');
        if (!this.bookingState.serviceIds.includes(sId)) {
          this.bookingState.serviceIds.push(sId);
        }
        this.bookingState.serviceId = sId;
        this.expandedSteps.step2 = true;
      }
      if (params.branch) this.bookingState.branchId = String(params.branch).replace(/[^a-zA-Z0-9_-]/g, '');
      if (params.stylist) {
        const stId = String(params.stylist).replace(/[^a-zA-Z0-9_-]/g, '');
        this.bookingState.stylistId = stId;
        const allStylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
        const found = allStylists.find(s => s.id === stId || s.MaNhanVien === stId);
        if (found && (found.branchId || found.MaChiNhanh)) {
          this.bookingState.branchId = found.branchId || found.MaChiNhanh;
        }
        this.expandedSteps.step2 = true;
        this.expandedSteps.step3 = true;
      }

      if (!this.bookingState.branchId || this.bookingState.branchId === 'br-dbp') this.bookingState.branchId = 'CN01';

      // Nạp thông tin người dùng nếu đã đăng nhập
      const user = (window.store && typeof window.store.getCurrentUser === 'function') 
        ? window.store.getCurrentUser() 
        : null;
      if (user) {
        if (!this.bookingState.customerName) this.bookingState.customerName = user.name || user.fullName || '';
        if (!this.bookingState.customerPhone) this.bookingState.customerPhone = user.phone || '';
      }

      // Tự động kiểm tra: Nếu timeSlot đã chọn đã trôi qua so với giờ hiện tại thì reset
      if (this.bookingState.timeSlot) {
        const dur = this.getTotalCalculations().totalDuration || 45;
        const slots = (window.store && typeof window.store.getAvailableSlots === 'function')
          ? window.store.getAvailableSlots(this.bookingState.date, this.bookingState.stylistId, this.bookingState.branchId, dur)
          : [];
        const curSlotObj = slots.find(s => s.time === this.bookingState.timeSlot);
        if (!curSlotObj || !curSlotObj.available) {
          this.bookingState.timeSlot = '';
        }
      }

      const hasSelectedServices = this.bookingState.serviceIds.length > 0;

      container.innerHTML = `
        <div class="booking-page-shell w-full" style="padding-top: 30px; padding-bottom: 120px; width: 100%; max-width: 100%; margin: 0; padding-left: clamp(16px, 2.5vw, 36px); padding-right: clamp(16px, 2.5vw, 36px); color: var(--text-primary); box-sizing: border-box;">
          
          <!-- BANNER TIÊU ĐỀ 4RAU BARBERSHOP -->
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 18px; border-radius: 9999px; background: rgba(245, 158, 11, 0.12); border: 1.5px solid rgba(245, 158, 11, 0.4); color: #f59e0b; font-size: 13px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">
              OMNI SALON • ĐẶT LỊCH CẮT TÓC & TẠO KIỂU TRỰC TUYẾN
            </div>
            <h1 style="font-size: clamp(26px, 3.2vw, 38px); font-weight: 900; color: var(--text-primary); letter-spacing: -0.01em; margin-bottom: 8px;">
              Đặt Lịch Cắt Tóc Barber Shop Chuyên Nghiệp
            </h1>
            <p style="color: var(--text-secondary); font-size: 15px; max-width: 650px; margin: 0 auto; line-height: 1.6;">
              Quý khách có thể <strong style="color: #f59e0b;">chọn nhiều dịch vụ cùng lúc</strong> (Cắt, Gội, Uốn, Nhuộm, Chăm sóc râu) để thợ sắp xếp trọn gói phục vụ chu đáo nhất.
            </p>
          </div>

          <!-- CHỌN CHI NHÁNH PHỤC VỤ (FULL-WIDTH) -->
          <div style="background: var(--surface-card); border: 1.5px solid var(--border-color); border-radius: 14px; padding: 18px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; box-shadow: none;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div>
                <strong style="color: var(--text-primary); font-size: 15px; display: block;">Chi Nhánh Omni Salon Gần Bạn Nhất:</strong>
                <span style="color: var(--text-secondary); font-size: 13px;">Chọn cơ sở bạn muốn ghé trải nghiệm</span>
              </div>
            </div>
            <select id="bookingBranchPicker" onchange="BookingPage.changeBranch(this.value)"
                    style="min-width: 280px; height: 44px; padding: 0 16px; border-radius: 10px; background: var(--input-bg); border: 1.5px solid var(--input-border); color: var(--text-primary); font-size: 14px; font-weight: 700; outline: none; cursor: pointer;">
              ${this.renderBranchOptionsHTML()}
            </select>
          </div>

          <!-- BỐ CỤC 4 BƯỚC ĐẶT LỊCH LIÊN HOÀN (CASCADING) -->
          <div class="booking-cascading-container" style="display: flex; flex-direction: column; gap: 20px;">
            
            <!-- BƯỚC 1: CHỌN NHIỀU DỊCH VỤ -->
            <div class="booking-cascade-block" id="cascadeStep1" style="background: var(--surface-card); border: 1.5px solid ${hasSelectedServices ? '#f59e0b' : 'var(--border-color)'}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); scroll-margin-top: 95px;">
              <div class="cascade-header" onclick="BookingPage.toggleAccordion('step1')"
                   style="padding: 18px 24px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 36px; height: 36px; border-radius: 50%; background: ${hasSelectedServices ? '#f59e0b' : 'var(--surface-elevated)'}; color: ${hasSelectedServices ? '#000000' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">
                    ${hasSelectedServices ? '✓' : '1'}
                  </span>
                  <div>
                    <h3 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin: 0;">1. Chọn Dịch Vụ & Gói Chăm Sóc (Có thể chọn nhiều)</h3>
                    <span style="font-size: 13px; color: ${hasSelectedServices ? '#f59e0b' : 'var(--text-secondary)'}; font-weight: 600;">
                      ${this.getSelectedServicesSummaryText() || 'Bấm chọn một hoặc nhiều dịch vụ bên dưới'}
                    </span>
                  </div>
                </div>
                <span style="font-size: 18px; color: var(--text-secondary); transform: ${this.expandedSteps.step1 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep1" style="display: ${this.expandedSteps.step1 ? 'block' : 'none'}; padding: 22px 24px;">
                ${this.renderStep1ServicesHTML()}
              </div>
            </div>

            <!-- BƯỚC 2: CHỌN BARBER PHỤC VỤ -->
            <div class="booking-cascade-block" id="cascadeStep2" style="background: var(--surface-card); border: 1.5px solid ${this.bookingState.stylistId || (this.expandedSteps.step3 && !this.bookingState.stylistId) ? '#f59e0b' : 'var(--border-color)'}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); opacity: ${hasSelectedServices ? '1' : '0.6'}; scroll-margin-top: 95px;">
              <div class="cascade-header" onclick="${hasSelectedServices ? "BookingPage.toggleAccordion('step2')" : "UICommon.showToast('Vui lòng chọn ít nhất 1 dịch vụ ở Bước 1 trước!', 'warning')"}"
                   style="padding: 18px 24px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: ${hasSelectedServices ? 'pointer' : 'not-allowed'}; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 36px; height: 36px; border-radius: 50%; background: ${this.expandedSteps.step3 ? '#f59e0b' : 'var(--surface-elevated)'}; color: ${this.expandedSteps.step3 ? '#000000' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">
                    ${this.expandedSteps.step3 ? '✓' : '2'}
                  </span>
                  <div>
                    <h3 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin: 0;">2. Chọn Thợ Barber Tạo Mẫu</h3>
                    <span style="font-size: 13px; color: ${this.expandedSteps.step3 ? '#f59e0b' : 'var(--text-secondary)'}; font-weight: 600;">
                      ${this.getSelectedStylistName() || (hasSelectedServices ? 'Chọn thợ phục vụ hoặc tự động xếp thợ nhanh' : 'Chờ chọn dịch vụ...')}
                    </span>
                  </div>
                </div>
                <span style="font-size: 18px; color: var(--text-secondary); transform: ${this.expandedSteps.step2 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep2" style="display: ${this.expandedSteps.step2 ? 'block' : 'none'}; padding: 22px 24px;">
                ${this.renderStep2StylistsHTML()}
              </div>
            </div>

            <!-- BƯỚC 3: CHỌN NGÀY VÀ GIỜ HẸN -->
            <div class="booking-cascade-block" id="cascadeStep3" style="background: var(--surface-card); border: 1.5px solid ${this.bookingState.timeSlot ? '#f59e0b' : 'var(--border-color)'}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); opacity: ${hasSelectedServices ? '1' : '0.6'}; scroll-margin-top: 95px;">
              <div class="cascade-header" onclick="${hasSelectedServices ? "BookingPage.toggleAccordion('step3')" : "UICommon.showToast('Vui lòng chọn ít nhất 1 dịch vụ ở Bước 1 trước!', 'warning')"}"
                   style="padding: 18px 24px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: ${hasSelectedServices ? 'pointer' : 'not-allowed'}; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 36px; height: 36px; border-radius: 50%; background: ${this.bookingState.timeSlot ? '#f59e0b' : 'var(--surface-elevated)'}; color: ${this.bookingState.timeSlot ? '#000000' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">
                    ${this.bookingState.timeSlot ? '✓' : '3'}
                  </span>
                  <div>
                    <h3 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin: 0;">3. Chọn Ngày & Khung Giờ Cắt Tóc</h3>
                    <span style="font-size: 13px; color: ${this.bookingState.timeSlot ? '#f59e0b' : 'var(--text-secondary)'}; font-weight: 600;">
                      ${this.bookingState.timeSlot ? `Đã chọn: ${SalonUtils.formatDate(this.bookingState.date)} lúc ${this.bookingState.timeSlot}` : 'Bấm chọn ngày và giờ còn trống'}
                    </span>
                  </div>
                </div>
                <span style="font-size: 18px; color: var(--text-secondary); transform: ${this.expandedSteps.step3 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep3" style="display: ${this.expandedSteps.step3 ? 'block' : 'none'}; padding: 22px 24px;">
                ${this.renderStep3DateTimeHTML()}
              </div>
            </div>

            <!-- BƯỚC 4: THÔNG TIN KHÁCH HÀNG & XÁC NHẬN PHIẾU HẸN -->
            <div class="booking-cascade-block" id="cascadeStep4" style="background: var(--surface-card); border: 1.5px solid ${this.expandedSteps.step4 ? '#f59e0b' : 'var(--border-color)'}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); opacity: ${this.expandedSteps.step4 ? '1' : '0.6'}; scroll-margin-top: 95px;">
              <div class="cascade-header" onclick="${this.bookingState.timeSlot ? "BookingPage.toggleAccordion('step4')" : "UICommon.showToast('Vui lòng chọn ngày và giờ hẹn ở Bước 3 trước!', 'warning')"}"
                   style="padding: 18px 24px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: ${this.bookingState.timeSlot ? 'pointer' : 'not-allowed'}; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 36px; height: 36px; border-radius: 50%; background: ${this.expandedSteps.step4 ? '#f59e0b' : 'var(--surface-elevated)'}; color: ${this.expandedSteps.step4 ? '#000000' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">
                    4
                  </span>
                  <div>
                    <h3 style="font-size: 17px; font-weight: 800; color: var(--text-primary); margin: 0;">4. Thông Tin Khách Hàng & Xác Nhận Đặt Lịch</h3>
                    <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">
                      ${this.expandedSteps.step4 ? 'Kiểm tra tóm tắt phiếu đặt hẹn và bấm xác nhận' : 'Chờ hoàn thành các bước trên...'}
                    </span>
                  </div>
                </div>
                <span style="font-size: 18px; color: var(--text-secondary); transform: ${this.expandedSteps.step4 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep4" style="display: ${this.expandedSteps.step4 ? 'block' : 'none'}; padding: 22px 24px;">
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

    // ── XỬ LÝ CHỌN NHIỀU DỊCH VỤ (MULTI-SELECT) ──
    toggleSelectService(serviceId) {
      const idx = this.bookingState.serviceIds.indexOf(serviceId);
      if (idx > -1) {
        // Đã có -> Bỏ chọn
        this.bookingState.serviceIds.splice(idx, 1);
      } else {
        // Chưa có -> Thêm vào danh sách chọn
        this.bookingState.serviceIds.push(serviceId);
      }
      this.bookingState.serviceId = this.bookingState.serviceIds[0] || '';
      this.render(document.getElementById('webMainContainer'));
    },

    // Xóa toàn bộ dịch vụ đã chọn
    clearSelectedServices() {
      this.bookingState.serviceIds = [];
      this.bookingState.serviceId = '';
      this.render(document.getElementById('webMainContainer'));
    },

    scrollToStepSafely(stepId) {
      setTimeout(() => {
        const el = document.getElementById(stepId);
        if (el) {
          const yOffset = -90;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 100);
    },

    // Xác nhận chọn xong dịch vụ và chuyển bước 2
    proceedToStep2() {
      if (this.bookingState.serviceIds.length === 0) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng chọn ít nhất 1 dịch vụ!', 'warning');
        return;
      }
      this.expandedSteps.step1 = false; // Thu gọn Bước 1 để tránh tràn màn hình
      this.expandedSteps.step2 = true;
      const main = document.getElementById('webMainContainer');
      this.render(main);
      this.scrollToStepSafely('cascadeStep2');
    },

    onSelectStylist(stylistId) {
      this.bookingState.stylistId = stylistId;
      this.expandedSteps.step1 = false;
      this.expandedSteps.step2 = false; // Thu gọn Bước 2 để tránh bị cắt lơ lửng đè lên Bước 3
      this.expandedSteps.step3 = true;
      const main = document.getElementById('webMainContainer');
      this.render(main);
      this.scrollToStepSafely('cascadeStep3');
    },

    onSelectDate(dateIso) {
      this.bookingState.date = dateIso;
      // Kiểm tra ngay: Nếu timeSlot đã chọn đã quá giờ ở ngày mới thì reset
      if (this.bookingState.timeSlot) {
        const dur = this.getTotalCalculations().totalDuration || 45;
        const slots = (window.store && typeof window.store.getAvailableSlots === 'function')
          ? window.store.getAvailableSlots(dateIso, this.bookingState.stylistId, this.bookingState.branchId, dur)
          : [];
        const curSlotObj = slots.find(s => s.time === this.bookingState.timeSlot);
        if (!curSlotObj || !curSlotObj.available) {
          this.bookingState.timeSlot = '';
        }
      }
      this.render(document.getElementById('webMainContainer'));
    },

    onSelectTimeSlot(time) {
      const dur = this.getTotalCalculations().totalDuration || 45;
      const slots = (window.store && typeof window.store.getAvailableSlots === 'function')
        ? window.store.getAvailableSlots(this.bookingState.date, this.bookingState.stylistId, this.bookingState.branchId, dur)
        : [];
      const slotObj = slots.find(s => s.time === time);
      if (!slotObj || !slotObj.available) {
        if (slotObj && slotObj.isPast) {
          if (window.UICommon) window.UICommon.showToast('Khung giờ này đã trôi qua so với thời gian hiện tại! Vui lòng chọn ca khác.', 'warning');
        } else {
          if (window.UICommon) window.UICommon.showToast('Khung giờ này đã kín lịch! Vui lòng chọn ca khác.', 'warning');
        }
        return;
      }
      this.bookingState.timeSlot = time;
      this.expandedSteps.step1 = false;
      this.expandedSteps.step2 = false;
      this.expandedSteps.step3 = false; // Thu gọn Bước 3 để form Bước 4 hiển thị rộng thoáng
      this.expandedSteps.step4 = true;
      const main = document.getElementById('webMainContainer');
      this.render(main);
      this.scrollToStepSafely('cascadeStep4');
    },

    changeBranch(branchId) {
      this.bookingState.branchId = branchId;
      this.bookingState.stylistId = '';
      this.render(document.getElementById('webMainContainer'));
    },

    // ── TÍNH TOÁN DANH SÁCH DỊCH VỤ ĐÃ CHỌN ──
    getSelectedServicesList() {
      if (!this.bookingState.serviceIds || this.bookingState.serviceIds.length === 0) return [];
      const list = [];
      this.bookingState.serviceIds.forEach(id => {
        const s = (window.store && typeof window.store.getServiceById === 'function')
          ? (window.store.getServiceById(id) || window.store.getComboById(id))
          : null;
        if (s) {
          list.push({
            id: s.id,
            name: s.name || s.TenDichVu || s.TenCombo || id,
            price: Number(s.price || s.Gia || s.GiaCombo || 0),
            duration: parseInt(String(s.duration || s.ThoiLuong || s.durationMinutes || 45), 10) || 45,
            category: s.category || 'service'
          });
        }
      });
      return list;
    },

    getTotalCalculations() {
      const list = this.getSelectedServicesList();
      const totalPrice = list.reduce((sum, item) => sum + item.price, 0);
      const totalDuration = list.reduce((sum, item) => sum + item.duration, 0) || 45;
      return { totalPrice, totalDuration, count: list.length, list };
    },

    getSelectedServicesSummaryText() {
      const calc = this.getTotalCalculations();
      if (calc.count === 0) return '';
      const names = calc.list.map(s => s.name).join(' + ');
      return `Đã chọn (${calc.count} dịch vụ): ${names} • Tổng: ${SalonUtils.formatCurrency(calc.totalPrice)} • ⏱️ ${calc.totalDuration} phút`;
    },

    getSelectedStylistName() {
      if (this.bookingState.stylistId === '') {
        return this.expandedSteps.step3 ? 'Đã chọn: Tự động xếp Barber tay nghề cao' : '';
      }
      const st = (window.store && typeof window.store.getStylistById === 'function')
        ? window.store.getStylistById(this.bookingState.stylistId)
        : null;
      return st ? `Đã chọn: ${st.name} (${st.level || 'Master Barber'})` : '';
    },

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

    // ── BƯỚC 1: HIỂN THỊ DANH SÁCH DỊCH VỤ CÓ THỂ CHỌN NHIỀU ──
    renderStep1ServicesHTML() {
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const combos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];
      const calc = this.getTotalCalculations();

      return `
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- HƯỚNG DẪN CHỌN NHIỀU -->
          <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 12px 16px; font-size: 13.5px; color: var(--text-primary);">
            <strong>Gợi ý:</strong> Bạn có thể nhấp chọn <span style="color: #f59e0b; font-weight: 800;">nhiều dịch vụ cùng lúc</span> (ví dụ: vừa Cắt tóc, vừa Gội đầu massage, vừa Uốn tạo phồng). Hệ thống sẽ tự động cộng dồn thời gian và chi phí!
          </div>

          <!-- GÓI COMBO VIP TIỆM TÓC -->
          ${combos.length > 0 ? `
            <div>
              <span style="font-size: 13px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">
                GÓI COMBO ĐẶC QUYỀN VIP (TRỌN GÓI TIẾT KIỆM)
              </span>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;">
                ${combos.map(c => {
                  const isSelected = this.bookingState.serviceIds.includes(c.id);
                  return `
                    <div class="service-multi-card ${isSelected ? 'selected' : ''}" onclick="BookingPage.toggleSelectService('${c.id}')">
                       <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                          <span style="font-size: 11px; font-weight: 800; background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 3px 8px; border-radius: 6px;">COMBO VIP</span>
                          <div class="service-multi-check">${isSelected ? '✓' : ''}</div>
                        </div>
                        <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">${c.name}</h4>
                        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">${c.description || ''}</p>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px;">
                        <div>
                          <span style="font-size: 17px; font-weight: 900; color: #f59e0b;">${SalonUtils.formatCurrency(c.price)}</span>
                          <span style="font-size: 12px; color: var(--text-secondary); display: block;">${c.duration || 70} phút</span>
                        </div>
                        <span style="font-size: 12px; font-weight: 700; color: ${isSelected ? '#f59e0b' : 'var(--text-secondary)'};">
                          ${isSelected ? '✓ Đã chọn gói này' : '+ Thêm gói này'}
                        </span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- CÁC DỊCH VỤ CẮT, UỐN, NHUỘM, TẠO KIỂU -->
          <div>
            <span style="font-size: 13px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">
              CÁC DỊCH VỤ CẮT TÓC, UỐN, NHUỘM & CHĂM SÓC RÂU
            </span>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px;">
              ${services.map(s => {
                const isSelected = this.bookingState.serviceIds.includes(s.id);
                return `
                  <div class="service-multi-card ${isSelected ? 'selected' : ''}" onclick="BookingPage.toggleSelectService('${s.id}')">
                    <div>
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase;">DỊCH VỤ BARBER</span>
                        <div class="service-multi-check">${isSelected ? '✓' : ''}</div>
                      </div>
                      <h4 style="font-size: 15.5px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">${s.name || s.TenDichVu}</h4>
                      <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">${s.description || s.MoTa || ''}</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px;">
                      <div>
                        <span style="font-size: 16px; font-weight: 900; color: #f59e0b;">${SalonUtils.formatCurrency(s.price || s.Gia)}</span>
                        <span style="font-size: 11.5px; color: var(--text-secondary); display: block;">${s.duration || s.ThoiLuong || 45} phút</span>
                      </div>
                      <span style="font-size: 12px; font-weight: 700; color: ${isSelected ? '#f59e0b' : 'var(--text-secondary)'};">
                        ${isSelected ? '✓ Đã chọn' : '+ Thêm dịch vụ'}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- THANH TỔNG HỢP CÁC DỊCH VỤ ĐÃ CHỌN (STICKY SUMMARY BAR) -->
          ${calc.count > 0 ? `
            <div class="selected-services-summary-bar">
              <div>
                <div style="font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase;">
                  ĐÃ CHỌN ${calc.count} DỊCH VỤ:
                </div>
                <div style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 2px 0;">
                  ${calc.list.map(s => s.name).join(' + ')}
                </div>
                <div style="font-size: 13px; color: var(--text-secondary);">
                  Tổng thời gian dự kiến: <strong>${calc.totalDuration} phút</strong> • Tổng chi phí: <strong style="color: #f59e0b; font-size: 16px;">${SalonUtils.formatCurrency(calc.totalPrice)}</strong>
                </div>
              </div>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-cancel" onclick="BookingPage.clearSelectedServices()" style="padding: 10px 16px; font-size: 13px;">
                  ✕ Xóa Hết
                </button>
                <button type="button" class="btn-submit-terracotta" onclick="BookingPage.proceedToStep2()" style="padding: 10px 22px; font-size: 14px; font-weight: 800;">
                  Tiếp Tục Sang Chọn Thợ (${calc.count} Dịch Vụ) →
                </button>
              </div>
            </div>
          ` : `
            <div style="text-align: center; padding: 20px; background: var(--surface-card); border: 1px dashed var(--border-color); border-radius: 12px; color: var(--text-secondary); font-size: 14px;">
              Vui lòng nhấp vào các dịch vụ ở trên để chọn. Bạn có thể chọn 1 hoặc nhiều dịch vụ tùy ý.
            </div>
          `}
        </div>
      `;
    },

    // ── BƯỚC 2: CHỌN THỢ BARBER ──
    renderStep2StylistsHTML() {
      const rawStylists = (window.store && typeof window.store.getStylists === 'function') 
        ? window.store.getStylists(this.bookingState.branchId) 
        : [];
      const stylists = rawStylists.filter(s => s.role !== 'Thu ngân' && s.ChucVu !== 'Thu ngân' && !s.title?.toLowerCase().includes('thu ngân'));

      return `
        <div>
          <!-- LỰA CHỌN TỰ ĐỘNG XẾP THỢ -->
          <div onclick="BookingPage.onSelectStylist('')"
               style="padding: 18px 24px; border-radius: 14px; cursor: pointer; border: 2px solid ${this.bookingState.stylistId === '' ? '#f59e0b' : 'var(--border-color)'}; background: ${this.bookingState.stylistId === '' ? 'rgba(245, 158, 11, 0.08)' : 'var(--surface-card)'}; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1.5px solid #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900;">AUTO</div>
              <div>
                <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px;">Tự Động Chọn Thợ Tay Nghề Cao (Nhanh Nhất)</h4>
                <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Hệ thống Omni Salon sẽ xếp ngay Barber tay nghề chuẩn đang rảnh ghế tại chi nhánh để bạn không phải đợi.</p>
              </div>
            </div>
            <span style="font-size: 14px; font-weight: 800; color: #f59e0b;">
              ${this.bookingState.stylistId === '' ? '✓ Đang Chọn' : 'Chọn Nhanh'}
            </span>
          </div>

          <!-- LƯỚI DANH SÁCH THỢ CẮT TÓC -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px;">
            ${stylists.map(s => `
              <div onclick="BookingPage.onSelectStylist('${s.id}')"
                   style="padding: 20px; border-radius: 14px; cursor: pointer; border: 2px solid ${this.bookingState.stylistId === s.id ? '#f59e0b' : 'var(--border-color)'}; background: ${this.bookingState.stylistId === s.id ? 'rgba(245, 158, 11, 0.08)' : 'var(--surface-card)'}; text-align: center; transition: all 0.2s ease;">
                <div style="width: 72px; height: 72px; margin: 0 auto 12px; border-radius: 50%; overflow: hidden; border: 2px solid #f59e0b;">
                  <img src="${s.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=140&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${s.name}" onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';">
                </div>
                <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">${s.name}</h4>
                <div style="margin-bottom: 6px; display: flex; justify-content: center; gap: 6px; align-items: center;">
                  <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; ${s.role === 'Thợ phụ' ? 'background: rgba(14, 165, 233, 0.15); color: #0284c7;' : 'background: rgba(245, 158, 11, 0.15); color: #d97706;'}">
                    ${s.role === 'Thợ phụ' ? 'Thợ Phụ' : 'Master Barber'}
                  </span>
                  <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${s.level || 'Chính Hiệu'}</span>
                </div>
                <span style="font-size: 12px; color: var(--text-secondary);">${s.rating || '5.0'} / 5 • Sẵn sàng đón tiếp</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    // ── BƯỚC 3: CHỌN NGÀY VÀ GIỜ HẸN ──
    renderStep3DateTimeHTML() {
      const nextDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayNum = String(d.getDate()).padStart(2, '0');
        const iso = `${y}-${m}-${dayNum}`;
        const dayName = i === 0 ? 'Hôm nay' : (i === 1 ? 'Ngày mai' : `Th ${d.getDay() === 0 ? 'CN' : d.getDay() + 1}`);
        const dateFormatted = `${d.getDate()}/${d.getMonth() + 1}`;
        return { iso, dayName, dateFormatted, isToday: i === 0 };
      });

      const calc = this.getTotalCalculations();
      const duration = calc.totalDuration || 45;

      const availableSlots = (window.store && typeof window.store.getAvailableSlots === 'function')
        ? window.store.getAvailableSlots(this.bookingState.date, this.bookingState.stylistId, this.bookingState.branchId, duration)
        : [];

      const totalAvailable = availableSlots.filter(s => s.available).length;

      // Phân chia 3 ca làm việc chuẩn 4RAU Barbershop
      const shifts = [
        {
          name: 'CA SÁNG (08:30 - 11:30)',
          slots: availableSlots.filter(s => {
            const h = parseInt(s.time.split(':')[0], 10);
            return h < 12;
          })
        },
        {
          name: 'CA CHIỀU (13:30 - 17:30)',
          slots: availableSlots.filter(s => {
            const h = parseInt(s.time.split(':')[0], 10);
            return h >= 12 && h < 18;
          })
        },
        {
          name: 'CA TỐI (18:30 - 20:30)',
          slots: availableSlots.filter(s => {
            const h = parseInt(s.time.split(':')[0], 10);
            return h >= 18;
          })
        }
      ];

      return `
        <div>
          <!-- LỰA CHỌN 7 NGÀY (LỊCH TRƯỢT NGANG PHONG CÁCH 4RAU) -->
          <div style="display: flex; gap: 10px; overflow-x: auto; padding: 4px 2px 14px 2px; margin-bottom: 24px; box-sizing: border-box;">
            ${nextDays.map(day => {
              const daySlots = (window.store && typeof window.store.getAvailableSlots === 'function')
                ? window.store.getAvailableSlots(day.iso, this.bookingState.stylistId, this.bookingState.branchId, duration)
                : [];
              const hasOpen = daySlots.some(s => s.available);
              const isSelectedDay = this.bookingState.date === day.iso;

              return `
                <div onclick="BookingPage.onSelectDate('${day.iso}')"
                     class="day-picker-card ${isSelectedDay ? 'selected' : ''} ${day.isToday ? 'is-today' : ''}"
                     style="flex: 1; min-width: 95px; padding: 14px 8px; border-radius: 12px; text-align: center; cursor: pointer; box-sizing: border-box; border: 2px solid ${isSelectedDay ? '#f59e0b' : (day.isToday ? 'rgba(245, 158, 11, 0.45)' : 'var(--border-color)')}; background: ${isSelectedDay ? 'rgba(245, 158, 11, 0.15)' : (day.isToday ? 'rgba(245, 158, 11, 0.05)' : 'var(--surface-elevated)')}; transition: all 0.2s ease; ${isSelectedDay ? 'box-shadow: inset 0 0 0 1px #f59e0b;' : ''}">
                  <span style="font-size: 11.5px; font-weight: 800; color: ${day.isToday ? '#f59e0b' : 'var(--text-secondary)'}; display: block; text-transform: uppercase;">
                    ${day.isToday ? 'HÔM NAY' : day.dayName}
                  </span>
                  <span style="font-size: ${day.isToday ? '19px' : '17px'}; font-weight: 900; color: var(--text-primary); display: block; margin: 4px 0;">
                    ${day.dateFormatted}
                  </span>
                  <span style="font-size: 10.5px; font-weight: 800; color: ${hasOpen ? '#16a34a' : (day.isToday ? '#71717a' : '#ef4444')};">
                    ${hasOpen ? 'CÒN CHỖ' : (day.isToday ? 'HẾT GIỜ' : 'KÍN LỊCH')}
                  </span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- TIÊU ĐỀ KHUNG GIỜ PHỤC VỤ -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
            <div>
              <span style="font-size: 13px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em; display: block;">
                KHUNG GIỜ PHỤC VỤ (DỰ KIẾN ${duration} PHÚT)
              </span>
              <span style="font-size: 12px; color: var(--text-secondary);">
                Ngày chọn: <strong style="color: var(--text-primary);">${SalonUtils.formatDate(this.bookingState.date)}</strong>
              </span>
            </div>
            <span style="font-size: 12px; font-weight: 700; color: ${totalAvailable > 0 ? '#16a34a' : '#ef4444'};">
              ${totalAvailable > 0 ? `Còn ${totalAvailable} ca trống` : 'Đã hết ca khả dụng'}
            </span>
          </div>

          <!-- DANH SÁCH KHUNG GIỜ THEO TỪNG CA -->
          ${shifts.map(shift => {
            if (shift.slots.length === 0) return '';
            const shiftAvailCount = shift.slots.filter(s => s.available).length;
            return `
              <div style="margin-bottom: 18px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
                  <span style="font-size: 12.5px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.03em;">
                    ${shift.name}
                  </span>
                  <span style="font-size: 11px; font-weight: 700; color: ${shiftAvailCount > 0 ? '#16a34a' : '#71717a'};">
                    ${shiftAvailCount > 0 ? `${shiftAvailCount} ca nhận khách` : 'Đã hết ca'}
                  </span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); gap: 10px;">
                  ${shift.slots.map(slot => {
                    const isSelected = this.bookingState.timeSlot === slot.time;
                    const isPast = slot.isPast === true;
                    const isBooked = slot.isBooked === true || (!slot.available && !isPast);

                    if (isPast) {
                      return `
                        <button type="button" disabled class="slot-btn slot-past"
                                title="Khung giờ ${slot.time} đã trôi qua so với thời gian hiện tại"
                                style="padding: 12px 6px; border-radius: 10px; border: 1.5px dashed var(--border-color, #3f3f46); background: var(--surface-elevated, #27272a); color: var(--text-muted, #71717a); cursor: not-allowed; font-weight: 700; font-size: 14px; opacity: 0.35; text-decoration: line-through;">
                          ${slot.time}
                          <span style="font-size: 10px; display: block; font-weight: 800; color: #71717a; text-decoration: none; margin-top: 2px;">
                            ✕ ĐÃ QUA
                          </span>
                        </button>
                      `;
                    }

                    if (isBooked) {
                      return `
                        <button type="button" disabled class="slot-btn slot-full"
                                title="Khung giờ ${slot.time} đã kín chỗ"
                                style="padding: 12px 6px; border-radius: 10px; border: 1.5px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.08); color: #ef4444; cursor: not-allowed; font-weight: 700; font-size: 14px; opacity: 0.6;">
                          ${slot.time}
                          <span style="font-size: 10px; display: block; font-weight: 800; color: #ef4444; margin-top: 2px;">
                            ✕ KÍN LỊCH
                          </span>
                        </button>
                      `;
                    }

                    return `
                      <button type="button" onclick="BookingPage.onSelectTimeSlot('${slot.time}')"
                              class="slot-btn ${isSelected ? 'selected active' : ''}"
                              title="Chọn khung giờ ${slot.time}"
                              style="padding: 12px 6px; border-radius: 10px; border: 2px solid ${isSelected ? '#f59e0b' : 'var(--border-color)'}; background: ${isSelected ? '#f59e0b' : 'var(--surface-card)'}; color: ${isSelected ? '#000000' : 'var(--text-primary)'}; cursor: pointer; font-weight: 800; font-size: 14px; transition: all 0.15s ease; ${isSelected ? 'box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);' : ''}">
                        ${slot.time}
                        <span style="font-size: 10px; display: block; font-weight: 800; color: ${isSelected ? '#000000' : '#16a34a'}; margin-top: 2px;">
                          ${isSelected ? '✓ ĐÃ CHỌN' : '● CÒN CHỖ'}
                        </span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}

          ${totalAvailable === 0 ? `
            <div style="text-align: center; padding: 22px 16px; background: rgba(245, 158, 11, 0.06); border: 1.5px dashed #f59e0b; border-radius: 12px; margin-top: 14px;">
              <h4 style="font-size: 15.5px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px;">
                Tất cả các ca phục vụ của ngày ${SalonUtils.formatDate(this.bookingState.date)} đã kết thúc hoặc kín chỗ!
              </h4>
              <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 14px; line-height: 1.5;">
                Quý khách vui lòng bấm chọn ngày mai hoặc các ngày tiếp theo ở thanh lịch phía trên để đặt trước với Barber.
              </p>
              <button type="button" class="btn-submit-terracotta" onclick="BookingPage.onSelectDate('${nextDays[1].iso}')" style="padding: 10px 22px; font-size: 13.5px; font-weight: 800;">
                Chuyển Sang Ngày Mai (${nextDays[1].dateFormatted}) →
              </button>
            </div>
          ` : ''}
        </div>
      `;
    },

    // ── BƯỚC 4: THÔNG TIN KHÁCH HÀNG & PHIẾU ĐẶT CHỖ ──
    renderStep4ConfirmationHTML() {
      const calc = this.getTotalCalculations();
      const branch = (window.store && typeof window.store.getBranchById === 'function')
        ? window.store.getBranchById(this.bookingState.branchId)
        : null;
      const stylist = (window.store && typeof window.store.getStylistById === 'function')
        ? window.store.getStylistById(this.bookingState.stylistId)
        : null;

      const duration = calc.totalDuration || 45;
      const estimatedEndTime = SalonUtils.calculateEndTime(this.bookingState.timeSlot, duration);

      return `
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: start;">
          <!-- CỘT TRÁI: NHẬP THÔNG TIN LIÊN HỆ -->
          <div>
            <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 16px;">
              Thông Tin Khách Hàng Nhận Vé Cắt
            </h4>

            <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px;">
              <div>
                <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">HỌ VÀ TÊN QUÝ KHÁCH *</label>
                <input type="text" id="bookingNameInput" style="width: 100%; height: 44px; padding: 0 14px; border-radius: 10px; background: var(--input-bg); border: 1.5px solid var(--input-border); color: var(--text-primary); font-size: 14px; font-weight: 600; outline: none; box-sizing: border-box;"
                       placeholder="Ví dụ: Anh Nguyễn Văn Nam" value="${SalonUtils.escapeHtml(this.bookingState.customerName)}"
                       oninput="BookingPage.bookingState.customerName = this.value">
              </div>

              <div>
                <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">SỐ ĐIỆN THOẠI NHẬN TIN NHẮN VÉ *</label>
                <input type="tel" id="bookingPhoneInput" style="width: 100%; height: 44px; padding: 0 14px; border-radius: 10px; background: var(--input-bg); border: 1.5px solid var(--input-border); color: var(--text-primary); font-size: 14px; font-weight: 600; outline: none; box-sizing: border-box;"
                       placeholder="Ví dụ: 0908123456" value="${SalonUtils.escapeHtml(this.bookingState.customerPhone)}"
                       oninput="BookingPage.bookingState.customerPhone = this.value">
              </div>

              <div>
                <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">HÌNH THỨC THANH TOÁN</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <button type="button" onclick="BookingPage.bookingState.paymentMethod = 'VietQR'; BookingPage.render(document.getElementById('webMainContainer'));"
                          style="padding: 12px; border-radius: 10px; border: 2px solid ${this.bookingState.paymentMethod === 'VietQR' ? '#f59e0b' : 'var(--border-color)'}; background: ${this.bookingState.paymentMethod === 'VietQR' ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface-card)'}; color: var(--text-primary); font-size: 13px; font-weight: 700; cursor: pointer;">
                    Quét Mã VietQR
                  </button>
                  <button type="button" onclick="BookingPage.bookingState.paymentMethod = 'Cash'; BookingPage.render(document.getElementById('webMainContainer'));"
                          style="padding: 12px; border-radius: 10px; border: 2px solid ${this.bookingState.paymentMethod === 'Cash' ? '#f59e0b' : 'var(--border-color)'}; background: ${this.bookingState.paymentMethod === 'Cash' ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface-card)'}; color: var(--text-primary); font-size: 13px; font-weight: 700; cursor: pointer;">
                    Tiền Mặt Tại Quầy
                  </button>
                </div>
              </div>

              <div>
                <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">GHI CHÚ (YÊU CẦU ĐẶC BIỆT NẾU CÓ)</label>
                <textarea style="width: 100%; height: 60px; padding: 10px 14px; border-radius: 10px; resize: none; background: var(--input-bg); border: 1.5px solid var(--input-border); color: var(--text-primary); font-size: 13px; outline: none; box-sizing: border-box;"
                          placeholder="Ví dụ: Tóc ngắn, cạo sát chân gáy, uốn nhẹ tự nhiên..."
                          oninput="BookingPage.bookingState.notes = this.value">${SalonUtils.escapeHtml(this.bookingState.notes)}</textarea>
              </div>
            </div>
          </div>

          <!-- CỘT PHẢI: CHI TIẾT TỪNG DỊCH VỤ VÀ TỔNG TIỀN -->
          <div style="background: var(--surface-card); border: 2px solid #f59e0b; border-radius: 16px; padding: 22px; box-shadow: 0 4px 18px rgba(0,0,0,0.05);">
            <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase;">PHIẾU ĐẶT HẸN OMNI SALON</span>
                <h4 style="font-size: 17px; font-weight: 900; color: var(--text-primary); margin: 2px 0 0;">Tóm Tắt Dịch Vụ</h4>
              </div>
              <span style="font-size: 11px; font-weight: 800; color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); padding: 4px 8px; border-radius: 6px;">OMNI PASS</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Chi Nhánh:</span>
                <strong style="color: var(--text-primary);">${branch ? branch.name.split('—')[0].trim() : 'Omni Salon'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Barber Phục Vụ:</span>
                <strong style="color: var(--text-primary);">${stylist ? stylist.name : 'Tự Động Xếp Thợ Nhanh'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Thời Gian Hẹn:</span>
                <strong style="color: #f59e0b;">
                  ${this.bookingState.timeSlot ? `${SalonUtils.formatDate(this.bookingState.date)} • ${this.bookingState.timeSlot} - ${estimatedEndTime}` : 'Chưa chọn'}
                </strong>
              </div>
            </div>

            <!-- DANH SÁCH TỪNG DỊCH VỤ ĐÃ CHỌN -->
            <div style="border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 12px 0; margin-bottom: 14px;">
              <span style="font-size: 11.5px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 8px;">
                Danh sách ${calc.count} dịch vụ đã chọn:
              </span>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${calc.list.map(s => `
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                    <span style="color: var(--text-primary); font-weight: 700;">• ${s.name} (${s.duration || 45} phút)</span>
                    <strong style="color: #f59e0b;">${SalonUtils.formatCurrency(s.price)}</strong>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- TỔNG CỘNG -->
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 18px;">
              <div>
                <span style="font-size: 13px; font-weight: 800; color: var(--text-secondary); display: block;">TỔNG THANH TOÁN:</span>
                <span style="font-size: 12px; color: var(--text-secondary);">Thời lượng: <strong>${calc.totalDuration} phút</strong></span>
              </div>
              <span style="font-size: 24px; font-weight: 900; color: #f59e0b;">
                ${SalonUtils.formatCurrency(calc.totalPrice)}
              </span>
            </div>

            <button type="button" onclick="BookingPage.confirmAndSubmit()"
                    style="width: 100%; height: 50px; border-radius: 12px; background: #f59e0b; border: none; color: #000000; font-size: 16px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: none;">
              XÁC NHẬN ĐẶT LỊCH HẸN NGAY
            </button>
          </div>
        </div>
      `;
    },

    confirmAndSubmit() {
      const rawName = (this.bookingState.customerName || '').trim();
      const phone = (this.bookingState.customerPhone || '').trim();
      const calc = this.getTotalCalculations();

      if (calc.count === 0) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng chọn ít nhất 1 dịch vụ ở Bước 1!', 'warning');
        return;
      }
      if (!this.bookingState.timeSlot) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng chọn ngày và giờ hẹn ở Bước 3!', 'warning');
        return;
      }

      // Kiểm tra lần cuối: Khung giờ đã trôi qua so với thời gian thực tế hay chưa
      const dur = calc.totalDuration || 45;
      const currentSlots = (window.store && typeof window.store.getAvailableSlots === 'function')
        ? window.store.getAvailableSlots(this.bookingState.date, this.bookingState.stylistId, this.bookingState.branchId, dur)
        : [];
      const chosenSlot = currentSlots.find(s => s.time === this.bookingState.timeSlot);
      if (!chosenSlot || !chosenSlot.available) {
        if (chosenSlot && chosenSlot.isPast) {
          if (window.UICommon) window.UICommon.showToast('Khung giờ này đã trôi qua so với thời gian thực tế! Vui lòng chọn ca khác.', 'warning');
        } else {
          if (window.UICommon) window.UICommon.showToast('Khung giờ này đã có khách khác đặt trước! Vui lòng chọn ca khác.', 'warning');
        }
        this.bookingState.timeSlot = '';
        this.render(document.getElementById('webMainContainer'));
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

      const summaryServiceName = calc.list.map(s => s.name).join(' + ');

      const bookingPayload = {
        serviceId: this.bookingState.serviceIds[0],
        serviceIds: this.bookingState.serviceIds,
        servicesList: calc.list,
        serviceName: summaryServiceName,
        totalPrice: calc.totalPrice,
        durationMinutes: calc.totalDuration,
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

})(window);
