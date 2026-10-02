// =========================================================================
// Omni Salon — BOOKING PAGE COMPONENT (FULL-PAGE 4-STEP WIZARD - WCAG AAA)
// Tuân thủ: .antigravity/rules/03_coder.md, 04_refactor.md
// Route: "/booking" -> Step 1 Service -> Step 2 Stylist -> Step 3 Time Slot -> Step 4 Digital Receipt
// Interactive Slot Ripple • Magnetic Buttons • High Contrast
// =========================================================================

(function (window) {
  'use strict';

  const BookingPage = {
    currentStep: 1,
    bookingState: {
      serviceId: 'DV01',
      branchId: 'CN01',
      stylistId: '',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '09:30',
      customerName: '',
      customerPhone: '',
      paymentMethod: 'VietQR',
      notes: ''
    },

    render(container, params = {}) {
      if (!container) return;

      if (params.service) this.bookingState.serviceId = String(params.service).replace(/[^a-zA-Z0-9_-]/g, '');
      if (params.branch) this.bookingState.branchId = String(params.branch).replace(/[^a-zA-Z0-9_-]/g, '');
      if (params.stylist) this.bookingState.stylistId = String(params.stylist).replace(/[^a-zA-Z0-9_-]/g, '');
      if (params.step) this.currentStep = Math.max(1, Math.min(4, parseInt(params.step, 10) || 1));

      if (!this.bookingState.branchId || this.bookingState.branchId === 'br-dbp') this.bookingState.branchId = 'CN01';
      if (!this.bookingState.serviceId || this.bookingState.serviceId === 'srv-haircut-men' || this.bookingState.serviceId === 'srv-1') this.bookingState.serviceId = 'DV01';

      const user = (window.store && typeof window.store.getCurrentUser === 'function') 
        ? window.store.getCurrentUser() 
        : null;
      if (user) {
        if (!this.bookingState.customerName) this.bookingState.customerName = user.name || user.fullName || '';
        if (!this.bookingState.customerPhone) this.bookingState.customerPhone = user.phone || '';
      }

      container.innerHTML = `
        <div class="w-full max-w-5xl mx-auto transform-none" style="padding-top: 50px; padding-bottom: 80px; transform: none !important; perspective: none !important;">
          <!-- Header Wizard -->
          <div style="text-align: center; margin-bottom: 36px;">
            <div class="nordic-hero-badge" style="margin-bottom: 12px;">
              <span>📅</span> RESERVATION SUITE • STEP-BY-STEP WIZARD
            </div>
            <h1 class="booking-page-title" style="font-size: clamp(30px, 3.5vw, 44px); font-weight: 900; color: var(--text-primary, #FFFFFF); letter-spacing: -0.01em;">
              Đặt Lịch Trải Nghiệm Salon 5 Sao
            </h1>
            <p class="booking-page-desc" style="color: var(--text-secondary, #CBD5E1); font-size: 14px; margin-top: 8px;">
              Quy trình 4 bước tinh giản giúp quý khách giữ chỗ ưu tiên trong 60 giây.
            </p>
          </div>

          <!-- 4-STEP PROGRESS STEPPER BAR -->
          <div class="booking-stepper-bar">
            <div class="stepper-step ${this.currentStep >= 1 ? 'active' : ''}" onclick="BookingPage.goToStep(1)">
              <span class="stepper-num">1</span>
              <span class="stepper-text">Dịch Vụ</span>
            </div>
            <div class="stepper-line ${this.currentStep >= 2 ? 'active' : ''}"></div>
            <div class="stepper-step ${this.currentStep >= 2 ? 'active' : ''}" onclick="BookingPage.goToStep(2)">
              <span class="stepper-num">2</span>
              <span class="stepper-text">Stylist</span>
            </div>
            <div class="stepper-line ${this.currentStep >= 3 ? 'active' : ''}"></div>
            <div class="stepper-step ${this.currentStep >= 3 ? 'active' : ''}" onclick="BookingPage.goToStep(3)">
              <span class="stepper-num">3</span>
              <span class="stepper-text">Ngày &amp; Giờ</span>
            </div>
            <div class="stepper-line ${this.currentStep >= 4 ? 'active' : ''}"></div>
            <div class="stepper-step ${this.currentStep >= 4 ? 'active' : ''}" onclick="BookingPage.goToStep(4)">
              <span class="stepper-num">4</span>
              <span class="stepper-text">Hóa Đơn Số</span>
            </div>
          </div>

          <!-- WIZARD STEP BODY -->
          <div id="bookingStepContent" class="w-full transform-none" style="transform: none !important; perspective: none !important;">
            ${this.renderCurrentStepContent()}
          </div>
        </div>
      `;
    },

    goToStep(step) {
      if (step < 1 || step > 4) return;
      if (step > 1 && !this.bookingState.serviceId) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng chọn dịch vụ ở Bước 1 trước!', 'warning');
        return;
      }
      if (step >= 4 && (!this.bookingState.date || !this.bookingState.timeSlot)) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng chọn ngày và giờ hẹn ở Bước 3 trước!', 'warning');
        this.goToStep(3);
        return;
      }
      this.currentStep = step;
      const stepContent = document.getElementById('bookingStepContent');
      if (stepContent) {
        stepContent.innerHTML = this.renderCurrentStepContent();
        document.querySelectorAll('.booking-stepper-bar .stepper-step').forEach((el, idx) => {
          if (idx + 1 <= this.currentStep) el.classList.add('active');
          else el.classList.remove('active');
        });
        document.querySelectorAll('.booking-stepper-bar .stepper-line').forEach((el, idx) => {
          if (idx + 1 < this.currentStep) el.classList.add('active');
          else el.classList.remove('active');
        });
        if (window.AppRouter) {
          window.AppRouter.initTiltEffects(stepContent);
          window.AppRouter.initMagneticButtons(stepContent);
        }
      }
    },

    renderCurrentStepContent() {
      switch (this.currentStep) {
        case 1: return this.renderStep1();
        case 2: return this.renderStep2();
        case 3: return this.renderStep3();
        case 4: return this.renderStep4();
        default: return this.renderStep1();
      }
    },

    // ── STEP 1: CHỌN DỊCH VỤ / COMBO ──
    renderStep1() {
      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const combos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];
      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];

      return `
        <div class="booking-step-panel" style="padding: 32px; background: #10131C; border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
            <div>
              <h3 class="booking-step-title" style="font-size: 20px; font-weight: 800; color: #FFFFFF;">Bước 1: Chọn Chi Nhánh &amp; Dịch Vụ Trải Nghiệm</h3>
              <p class="booking-step-subtitle" style="font-size: 13px; color: #CBD5E1;">Chọn chi nhánh gần bạn nhất và gói dịch vụ mong muốn</p>
            </div>
            <!-- Branch Selector -->
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 13px; font-weight: 800; color: #F59E0B;">📍 CHI NHÁNH:</span>
              <select id="bookingBranchPicker" class="quick-booking-pill-select" style="min-width: 240px; background: #141722; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.15);" onchange="BookingPage.selectBranch(this.value)">
                ${branches.map(b => `
                  <option value="${b.id}" ${this.bookingState.branchId === b.id ? 'selected' : ''}>
                    ${(b.TenChiNhanh || b.name).split('—')[0].trim()}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Services List -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 32px;">
            <!-- VIP Combos -->
            ${combos.map(c => `
              <div class="booking-service-card hover:border-amber-400/60 ${this.bookingState.serviceId === c.id ? 'selected active' : ''}" 
                   onclick="BookingPage.selectService('${c.id}')"
                   style="padding: 20px; border-radius: 16px; cursor: pointer;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                  <span style="font-size: 10px; font-weight: 800; background: linear-gradient(135deg, #10B981, #059669); color: #fff; padding: 3px 8px; border-radius: 9999px;">👑 VIP COMBO</span>
                  <span style="font-size: 12px; font-weight: 700; color: #CBD5E1;">⏱️ ${c.duration || 75}m</span>
                </div>
                <h4 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">${c.name}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                  <span style="font-size: 17px; font-weight: 900; color: #F59E0B;">${SalonUtils.formatCurrency(c.price)}</span>
                  <span style="font-size: 12px; font-weight: 800; color: ${this.bookingState.serviceId === c.id ? '#F59E0B' : '#CBD5E1'};">
                    ${this.bookingState.serviceId === c.id ? '✓ Đang Chọn' : 'Chọn Gói'}
                  </span>
                </div>
              </div>
            `).join('')}

            <!-- Individual Services -->
            ${services.map(s => `
              <div class="booking-service-card hover:border-amber-400/60 ${this.bookingState.serviceId === s.id ? 'selected active' : ''}" 
                   onclick="BookingPage.selectService('${s.id}')"
                   style="padding: 20px; border-radius: 16px; cursor: pointer;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                  <span style="font-size: 11px; font-weight: 700; color: #CBD5E1; text-transform: uppercase;">${s.category || 'Dịch Vụ'}</span>
                  <span style="font-size: 12px; font-weight: 700; color: #CBD5E1;">⏱️ ${s.duration || s.ThoiLuong || 45}m</span>
                </div>
                <h4 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px;">${s.name || s.TenDichVu}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                  <span style="font-size: 17px; font-weight: 900; color: #F59E0B;">${SalonUtils.formatCurrency(s.price || s.Gia)}</span>
                  <span style="font-size: 12px; font-weight: 800; color: ${this.bookingState.serviceId === s.id ? '#F59E0B' : '#CBD5E1'};">
                    ${this.bookingState.serviceId === s.id ? '✓ Đang Chọn' : 'Chọn Ca'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button class="nordic-btn-primary btn-magnetic" onclick="BookingPage.goToStep(2)">
              Tiếp Tục: Chọn Stylist →
            </button>
          </div>
        </div>
      `;
    },

    selectBranch(branchId) {
      this.bookingState.branchId = branchId;
      this.bookingState.stylistId = '';
      this.goToStep(1);
    },

    selectService(serviceId) {
      this.bookingState.serviceId = serviceId;
      this.goToStep(1);
    },

    // ── STEP 2: CHỌN STYLIST (HOẶC TỰ ĐỘNG XẾP THỢ) ──
    renderStep2() {
      const stylists = (window.store && typeof window.store.getStylists === 'function') 
        ? window.store.getStylists(this.bookingState.branchId) 
        : [];

      return `
        <div class="booking-step-panel" style="padding: 32px; background: #10131C; border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.15);">
          <div style="margin-bottom: 24px;">
            <h3 class="booking-step-title" style="font-size: 20px; font-weight: 800; color: #FFFFFF;">Bước 2: Chọn Stylist Đồng Hành</h3>
            <p class="booking-step-subtitle" style="font-size: 13px; color: #CBD5E1;">Quý khách có thể chọn Stylist yêu thích hoặc để Omni Salon tự động sắp xếp nghệ nhân phù hợp nhất</p>
          </div>

          <!-- Option: Tự động xếp thợ -->
          <div class="booking-stylist-option-card" onclick="BookingPage.selectStylist('')"
               style="padding: 20px 24px; border-radius: 16px; cursor: pointer; border: 2px solid ${!this.bookingState.stylistId ? '#F59E0B' : 'rgba(212, 175, 55, 0.15)'}; background: ${!this.bookingState.stylistId ? 'rgba(245,158,11,0.14)' : '#10131C'}; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #F59E0B, #D97706); display: flex; align-items: center; justify-content: center; font-size: 24px; color: #000;">⚡</div>
              <div>
                <h4 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">⚡ Tự Động Xếp Thợ Tay Nghề Cao (Khuyên Dùng)</h4>
                <p style="font-size: 12px; color: #CBD5E1;">Hệ thống tự động điều phối thợ có lịch trống tối ưu nhất, không cần chờ đợi</p>
              </div>
            </div>
            <span style="font-size: 14px; font-weight: 800; color: #F59E0B;">
              ${!this.bookingState.stylistId ? '✓ Đang Chọn' : 'Chọn'}
            </span>
          </div>

          <!-- Stylists Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 32px;">
            ${stylists.map(s => `
              <div class="booking-stylist-item-card" onclick="BookingPage.selectStylist('${s.id}')"
                   style="padding: 20px; border-radius: 16px; cursor: pointer; border: 2px solid ${this.bookingState.stylistId === s.id ? '#F59E0B' : 'rgba(212, 175, 55, 0.15)'}; background: ${this.bookingState.stylistId === s.id ? 'rgba(245,158,11,0.12)' : '#10131C'}; text-align: center;">
                <div style="width: 72px; height: 72px; margin: 0 auto 12px; border-radius: 50%; overflow: hidden; border: 2.5px solid #F59E0B;">
                  <img src="${s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${s.name}">
                </div>
                <h4 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">${s.name}</h4>
                <span style="font-size: 11px; font-weight: 700; color: #F59E0B; display: block; margin-bottom: 8px;">${s.level || 'Master Stylist'}</span>
                <span style="font-size: 12px; color: #CBD5E1;">★ 4.9 • Sẵn sàng nhận lịch</span>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; justify-content: space-between;">
            <button class="nordic-btn-secondary btn-magnetic" onclick="BookingPage.goToStep(1)">
              ← Quay Lại: Dịch Vụ
            </button>
            <button class="nordic-btn-primary btn-magnetic" onclick="BookingPage.goToStep(3)">
              Tiếp Tục: Ngày &amp; Giờ Hẹn →
            </button>
          </div>
        </div>
      `;
    },

    selectStylist(stylistId) {
      this.bookingState.stylistId = stylistId;
      this.goToStep(2);
    },

    // ── STEP 3: CHỌN NGÀY HẸN & KHUNG GIỜ TRỐNG ──
    renderStep3() {
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

      const morningSlots = availableSlots.filter(s => parseInt(s.time.split(':')[0], 10) < 12);
      const afternoonSlots = availableSlots.filter(s => {
        const h = parseInt(s.time.split(':')[0], 10);
        return h >= 12 && h < 18;
      });
      const eveningSlots = availableSlots.filter(s => parseInt(s.time.split(':')[0], 10) >= 18);

      return `
        <div class="booking-step-panel" style="padding: 32px; background: #10131C; border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.15);">
          <div style="margin-bottom: 24px;">
            <h3 class="booking-step-title" style="font-size: 20px; font-weight: 800; color: #FFFFFF;">Bước 3: Chọn Ngày Hẹn &amp; Khung Giờ Trống</h3>
            <p class="booking-step-subtitle" style="font-size: 13px; color: #CBD5E1;">Thời lượng phục vụ ước tính: <strong style="color: #F59E0B;">${duration} phút</strong></p>
          </div>

          <!-- Calendar Strip 7 Days -->
          <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 16px; margin-bottom: 28px; scrollbar-width: none;">
            ${nextDays.map(day => `
              <div class="booking-date-item-card" onclick="BookingPage.selectDate('${day.iso}')"
                   style="flex: 1; min-width: 100px; padding: 14px 10px; border-radius: 14px; text-align: center; cursor: pointer; border: 2px solid ${this.bookingState.date === day.iso ? '#F59E0B' : 'rgba(212, 175, 55, 0.15)'}; background: ${this.bookingState.date === day.iso ? 'rgba(245,158,11,0.15)' : '#10131C'};">
                <span style="font-size: 11px; font-weight: 600; color: #CBD5E1; display: block;">${day.dayName}</span>
                <span style="font-size: 16px; font-weight: 900; color: #FFFFFF; display: block; margin: 4px 0;">${day.dateFormatted}</span>
                <span style="font-size: 10px; font-weight: 800; color: #10B981;">CÒN CHỖ</span>
              </div>
            `).join('')}
          </div>

          <!-- Time Slot Matrix with Interactive Pulse Ripple -->
          <div style="display: flex; flex-direction: column; gap: 24px; margin-bottom: 32px;">
            <!-- Sáng -->
            <div>
              <span style="font-size: 13px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">
                🌅 BUỔI SÁNG (08:30 - 12:00)
              </span>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px;">
                ${this.renderSlotChips(morningSlots)}
              </div>
            </div>

            <!-- Chiều -->
            <div>
              <span style="font-size: 13px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">
                ☀️ BUỔI CHIỀU (12:00 - 18:00)
              </span>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px;">
                ${this.renderSlotChips(afternoonSlots)}
              </div>
            </div>

            <!-- Tối -->
            <div>
              <span style="font-size: 13px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 12px;">
                🌙 BUỔI TỐI (18:00 - 21:30)
              </span>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px;">
                ${this.renderSlotChips(eveningSlots)}
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <button class="nordic-btn-secondary btn-magnetic" onclick="BookingPage.goToStep(2)">
              ← Quay Lại: Stylist
            </button>
            <button class="nordic-btn-primary btn-magnetic" onclick="BookingPage.goToStep(4)">
              Tiếp Tục: Hóa Đơn Số →
            </button>
          </div>
        </div>
      `;
    },

    renderSlotChips(slots) {
      if (!slots || slots.length === 0) {
        return `<span style="font-size: 12px; color: #CBD5E1;">Hết khung giờ trống trong khoảng này</span>`;
      }
      return slots.map(slot => {
        const isSelected = this.bookingState.timeSlot === slot.time;
        const isAvailable = slot.available !== false;
        return `
          <button type="button" class="slot-chip-interactive booking-slot-chip"
                  onclick="${isAvailable ? `BookingPage.selectTimeSlot('${slot.time}', event)` : ''}"
                  style="padding: 12px 6px; border-radius: 12px; border: 1.5px solid ${isSelected ? '#F59E0B' : (isAvailable ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.04)')}; background: ${isSelected ? 'rgba(245,158,11,0.22)' : (isAvailable ? '#10131C' : '#07080B')}; color: ${isSelected ? '#F59E0B' : (isAvailable ? '#FFFFFF' : '#475569')}; cursor: ${isAvailable ? 'pointer' : 'not-allowed'}; font-weight: 800; font-size: 14px;">
            ${slot.time}
            <span style="font-size: 9px; display: block; font-weight: 700; color: ${isAvailable ? '#10B981' : '#F43F5E'}; margin-top: 2px;">
              ${isAvailable ? 'Còn chỗ' : 'Kín lịch'}
            </span>
          </button>
        `;
      }).join('');
    },

    selectDate(dateIso) {
      this.bookingState.date = dateIso;
      this.goToStep(3);
    },

    selectTimeSlot(time, event) {
      this.bookingState.timeSlot = time;
      if (event && window.AppRouter) {
        window.AppRouter.triggerSlotRipple(event, event.currentTarget);
      }
      this.goToStep(3);
    },

    // ── STEP 4: TÓM TẮT HÓA ĐƠN SỐ GLASSMORPHISM (DIGITAL RECEIPT) ──
    renderStep4() {
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
        <div class="booking-confirmation-grid">
          <!-- Left Column: Customer Form & Notes -->
          <div class="booking-step-panel" style="padding: 32px; background: #10131C; border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.15);">
            <h3 class="booking-step-title" style="font-size: 19px; font-weight: 800; color: #FFFFFF; margin-bottom: 20px;">
              Thông Tin Khách Hàng Xác Nhận
            </h3>

            <div style="display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px;">
              <div>
                <label style="font-size: 13px; font-weight: 700; color: #CBD5E1; display: block; margin-bottom: 8px;">HỌ VÀ TÊN QUÝ KHÁCH *</label>
                <input type="text" id="bookingNameInput" class="quick-booking-pill-select" style="width: 100%; background: #141722; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.15); height: 46px; font-size: 14px;"
                       placeholder="Ví dụ: Nguyễn Văn Hải" value="${SalonUtils.escapeHtml(this.bookingState.customerName)}"
                       oninput="BookingPage.bookingState.customerName = this.value">
              </div>

              <div>
                <label style="font-size: 13px; font-weight: 700; color: #CBD5E1; display: block; margin-bottom: 8px;">SỐ ĐIỆN THOẠI NHẬN MÃ VÉ *</label>
                <input type="tel" id="bookingPhoneInput" class="quick-booking-pill-select" style="width: 100%; background: #141722; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.15); height: 46px; font-size: 14px;"
                       placeholder="Ví dụ: 0908123456" value="${SalonUtils.escapeHtml(this.bookingState.customerPhone)}"
                       oninput="BookingPage.bookingState.customerPhone = this.value">
              </div>

              <div>
                <label style="font-size: 13px; font-weight: 700; color: #CBD5E1; display: block; margin-bottom: 8px;">PHƯƠNG THỨC THANH TOÁN</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <button type="button" class="booking-payment-toggle-btn"
                          onclick="BookingPage.bookingState.paymentMethod = 'VietQR'; BookingPage.goToStep(4);"
                          style="padding: 14px; border-radius: 12px; border: 1.5px solid ${this.bookingState.paymentMethod === 'VietQR' ? '#F59E0B' : 'rgba(212, 175, 55, 0.15)'}; background: ${this.bookingState.paymentMethod === 'VietQR' ? 'rgba(245,158,11,0.15)' : '#10131C'}; color: #fff; font-size: 13px; font-weight: 800; cursor: pointer;">
                    📲 Quét Mã VietQR
                  </button>
                  <button type="button" class="booking-payment-toggle-btn"
                          onclick="BookingPage.bookingState.paymentMethod = 'Cash'; BookingPage.goToStep(4);"
                          style="padding: 14px; border-radius: 12px; border: 1.5px solid ${this.bookingState.paymentMethod === 'Cash' ? '#F59E0B' : 'rgba(212, 175, 55, 0.15)'}; background: ${this.bookingState.paymentMethod === 'Cash' ? 'rgba(245,158,11,0.15)' : '#10131C'}; color: #fff; font-size: 13px; font-weight: 800; cursor: pointer;">
                    💵 Tiền Mặt Tại Salon
                  </button>
                </div>
              </div>

              <div>
                <label style="font-size: 13px; font-weight: 700; color: #CBD5E1; display: block; margin-bottom: 8px;">GHI CHÚ ĐẶC BIỆT (TÙY CHỌN)</label>
                <textarea class="quick-booking-pill-select" style="width: 100%; height: 74px; border-radius: 12px; resize: none; background: #141722; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.15); font-size: 13px;"
                          placeholder="Ví dụ: Tóc tơ mỏng, cần cắt kỹ phần gáy..."
                          oninput="BookingPage.bookingState.notes = this.value">${SalonUtils.escapeHtml(this.bookingState.notes)}</textarea>
              </div>
            </div>

            <button class="nordic-btn-secondary btn-magnetic" onclick="BookingPage.goToStep(3)" style="width: 100%;">
              ← Thay Đổi Ngày &amp; Giờ Hẹn
            </button>
          </div>

          <!-- Right Column: Glassmorphism Digital Receipt -->
          <div class="glass-digital-receipt booking-step-panel" style="background: #10131C; border: 1.5px solid rgba(245,158,11,0.35);">
            <div class="digital-receipt-header">
              <div>
                <div style="font-size: 11px; font-weight: 800; color: #F59E0B; letter-spacing: 0.12em;">OMNI LUXURY RECEIPT</div>
                <h3 class="booking-step-title" style="font-size: 22px; font-weight: 900; color: #FFFFFF; margin-top: 4px;">Phiếu Đặt Chỗ Điện Tử</h3>
              </div>
              <span style="font-size: 32px;">💈</span>
            </div>

            <div class="digital-receipt-row">
              <span class="label">Chi Nhánh</span>
              <span class="value">${branch ? branch.name.split('—')[0].trim() : 'Omni Flagship Suite'}</span>
            </div>

            <div class="digital-receipt-row">
              <span class="label">Dịch Vụ</span>
              <span class="value" style="color: #F59E0B;">${service ? service.name : 'Cắt Tạo Kiểu Master'}</span>
            </div>

            <div class="digital-receipt-row">
              <span class="label">Stylist Đảm Nhiệm</span>
              <span class="value">${stylist ? stylist.name : '⚡ Tự Động Xếp Thợ Tay Nghề Cao'}</span>
            </div>

            <div class="digital-receipt-row">
              <span class="label">Ngày Hẹn</span>
              <span class="value">${this.bookingState.date}</span>
            </div>

            <div class="digital-receipt-row">
              <span class="label">Khung Giờ</span>
              <span class="value">${this.bookingState.timeSlot} — ${estimatedEndTime} (${duration} phút)</span>
            </div>

            <div class="digital-receipt-row">
              <span class="label">Phương Thức</span>
              <span class="value">${this.bookingState.paymentMethod === 'VietQR' ? 'Quét VietQR 24/7' : 'Tiền Mặt'}</span>
            </div>

            <div class="digital-receipt-total">
              <span style="font-size: 14px; font-weight: 800; color: #CBD5E1;">TỔNG THANH TOÁN:</span>
              <span class="total-amount">${priceFormatted}</span>
            </div>

            <button type="button" class="nordic-btn-primary btn-magnetic" style="width: 100%; margin-top: 24px; padding: 16px; font-size: 15px;"
                    onclick="BookingPage.confirmAndSubmit()">
              ✨ XÁC NHẬN ĐẶT LỊCH NGAY
            </button>

            <p style="font-size: 12px; color: #CBD5E1; text-align: center; margin-top: 14px; line-height: 1.5;">
              🔒 Thông tin đặt chỗ được bảo mật qua chuẩn JWT RBAC &amp; mã QR vé điện tử tức thì.
            </p>
          </div>
        </div>
      `;
    },

    confirmAndSubmit() {
      const rawName = (this.bookingState.customerName || '').trim();
      const phone = (this.bookingState.customerPhone || '').trim();

      if (!rawName) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập họ và tên quý khách!', 'warning');
        return;
      }
      if (!phone || !/^[0-9]{9,11}$/.test(phone)) {
        if (window.UICommon) window.UICommon.showToast('Số điện thoại không hợp lệ (cần 9-11 chữ số)!', 'warning');
        return;
      }

      if (window.UICommon) {
        window.UICommon.bookingData = {
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
        window.UICommon.submitBooking();
      }
    }
  };

  window.BookingPage = BookingPage;

})(typeof window !== 'undefined' ? window : this);
