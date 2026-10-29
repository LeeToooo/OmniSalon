// Trang đặt lịch cắt tóc trực tuyến
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

    resetBookingState() {
      this.bookingState = {
        serviceIds: [],
        serviceId: '',
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
      };
      this.hasChosenStylist = false;
      this.selectedCategory = 'all';
      this.expandedSteps = {
        step1: true,
        step2: false,
        step3: false,
        step4: false
      };
      this.lastUserId = null;
    },

    serviceVisualMeta: {
      'CB01': { shortName: 'Combo Quý Tộc', highlight: 'Cắt • Gội thư giãn • Cạo râu khăn nóng', savings: 'Tiết kiệm 50K', img: 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg', category: 'combo' },
      'CB02': { shortName: 'Combo Đẹp Trai', highlight: 'Cắt form chuẩn • Ép side ôm sát 2 tháng', savings: 'Tiết kiệm 40K', img: 'Men_Grooming_Products/DichVu_Men/CBDV2.jpg', category: 'combo' },
      'CB03': { shortName: 'Combo Lột Xác', highlight: 'Cắt • Uốn Texture Hàn Quốc • Gội xả', savings: 'Tiết kiệm 130K', img: 'Men_Grooming_Products/DichVu_Men/CBDV3.jpg', category: 'combo' },
      'CB04': { shortName: 'Combo Quý Ông', highlight: 'Kẻ Tattoo • Cạo râu • Ráy tai Facial', savings: 'Tiết kiệm 50K', img: 'Men_Grooming_Products/DichVu_Men/CBDV4.jpg', category: 'combo' },
      'DV01': { shortName: 'Cắt Fade & Vuốt Sáp', highlight: 'Tư vấn phom mặt • Sấy vuốt Pomade', img: 'Men_Grooming_Products/DichVu_Men/DV1.jpg', category: 'cut' },
      'DV02': { shortName: 'Ép Side Down Perm', highlight: 'Ép xẹp tóc mai • Giữ nếp 2 tháng', img: 'Men_Grooming_Products/DichVu_Men/DV2.jpg', category: 'cut' },
      'DV03': { shortName: 'Uốn Phồng Texture', highlight: 'Lọn sóng tự nhiên • Dễ sấy tạo kiểu', img: 'Men_Grooming_Products/DichVu_Men/DV3.jpg', category: 'perm' },
      'DV04': { shortName: 'Nhuộm Thời Trang', highlight: 'Khói / Rêu / Bạch kim bảo vệ tóc', img: 'Men_Grooming_Products/DichVu_Men/DV4.jpg', category: 'perm' },
      'DV05': { shortName: 'Uốn Sâu Dreadlocks', highlight: 'Xù gai góc • Phong cách hip-hop', img: 'Men_Grooming_Products/DichVu_Men/DV5.jpg', category: 'perm' },
      'DV06': { shortName: 'Kẻ Line Hair Tattoo', highlight: 'Điêu khắc chân tóc • Đường nét sắc bén', img: 'Men_Grooming_Products/DichVu_Men/DV6.jpg', category: 'cut' },
      'DV07': { shortName: 'Cạo Râu Khăn Nóng', highlight: 'Bọt kem Proraso • Chườm ấm thư giãn', img: 'Men_Grooming_Products/DichVu_Men/DV7.jpg', category: 'spa' },
      'DV08': { shortName: 'Nhuộm Đen Phủ Bạc', highlight: 'Thảo dược tự nhiên • Không mùi hắc', img: 'Men_Grooming_Products/DichVu_Men/DV8.jpg', category: 'perm' },
      'DV09': { shortName: 'Tẩy Tóc Nâng Tông', highlight: 'Nâng sáng 3-4 cấp • Chuẩn bị phủ màu', img: 'Men_Grooming_Products/DichVu_Men/DV9.jpg', category: 'perm' },
      'DV10': { shortName: 'Ráy Tai & Facial', highlight: 'Đèn soi quang học • Dưỡng ẩm sáng da', img: 'Men_Grooming_Products/DichVu_Men/DV10.jpg', category: 'spa' }
    },

    setCategory(category) {
      this.selectedCategory = category;
      const body = document.getElementById('bodyStep1');
      if (body) {
        body.innerHTML = this.renderStep1ServicesHTML();
      }
    },

    render(container, params = {}) {
      if (!container) return;

      // Nạp thông tin người dùng nếu đã đăng nhập & tự động reset nếu đổi tài khoản
      const user = (window.store && typeof window.store.getCurrentUser === 'function')
        ? window.store.getCurrentUser()
        : null;
      const currentUserId = user ? String(user.id || user.username || user.MaKhachHang || '') : null;
      if (this.lastUserId !== undefined && this.lastUserId !== currentUserId) {
        this.resetBookingState();
      }
      this.lastUserId = currentUserId;

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

      if (!this.bookingState.branchId) this.bookingState.branchId = 'CN01';

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
      const hasSelectedStylist = Boolean(this.bookingState.stylistId !== '' || this.hasChosenStylist || this.bookingState.timeSlot);
      const hasSelectedTime = Boolean(this.bookingState.timeSlot);

      container.innerHTML = `
        <div class="booking-page-shell w-full" style="padding-top: 48px; padding-bottom: 120px; width: 100%; max-width: 100%; margin: 0; padding-left: clamp(16px, 2.5vw, 36px); padding-right: clamp(16px, 2.5vw, 36px); color: var(--text-primary); box-sizing: border-box;">
          
          <!-- BANNER TIÊU ĐỀ EDITORIAL -->
          <div style="text-align: center; margin-bottom: 36px;">
            <span class="tracking-widest" style="font-size: 11.5px; font-weight: 700; color: #C59B27; text-transform: uppercase; margin-bottom: 8px; display: inline-block;">
              ĐẶT LỊCH TRỰC TUYẾN 24/7
            </span>
            <h1 class="font-serif tracking-tight leading-tight" style="font-size: clamp(30px, 4.2vw, 44px); font-weight: 700; color: var(--text-primary); margin: 0 0 12px;">
              Đặt Lịch Cắt Tóc &amp; Tạo Mẫu Chuyên Nghiệp
            </h1>
            <p style="color: var(--text-secondary); font-size: 15px; max-width: 680px; margin: 0 auto; line-height: 1.6;">
              Quý khách có thể <strong style="color: #C59B27;">chọn nhiều dịch vụ cùng lúc</strong> (Cắt fade, gội dưỡng sinh, cạo khăn nóng, uốn định hình) để thợ sắp xếp trọn gói phục vụ chu đáo nhất.
            </p>
          </div>

          <!-- CHỌN CHI NHÁNH PHỤC VỤ (FULL-WIDTH) -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 18px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; box-shadow: none;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div>
                <strong style="color: var(--text-primary); font-size: 15px; display: block;">Chi Nhánh Omni Salon Gần Bạn Nhất:</strong>
                <span style="color: var(--text-secondary); font-size: 13px;">Chọn cơ sở bạn muốn ghé trải nghiệm</span>
              </div>
            </div>
            <select id="bookingBranchPicker" onchange="BookingPage.changeBranch(this.value)"
                    style="min-width: 280px; height: 44px; padding: 0 16px; border-radius: 6px; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 14px; font-weight: 700; outline: none; cursor: pointer;">
              ${this.renderBranchOptionsHTML()}
            </select>
          </div>

          <!-- BỐ CỤC 4 BƯỚC ĐẶT LỊCH LIÊN HOÀN (CASCADING) -->
          <div class="booking-cascading-container" style="display: flex; flex-direction: column; gap: 20px;">
            
            <!-- BƯỚC 1: CHỌN NHIỀU DỊCH VỤ -->
            <div class="booking-cascade-block" id="cascadeStep1" style="background: var(--surface-card); border: 1px solid ${hasSelectedServices ? '#C59B27' : 'var(--border-color)'}; border-radius: 8px; overflow: hidden; box-shadow: none; scroll-margin-top: 95px;">
              <div class="cascade-header" onclick="BookingPage.toggleAccordion('step1')"
                   style="padding: 18px 24px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 34px; height: 34px; border-radius: 50%; background: ${hasSelectedServices ? '#C59B27' : 'var(--surface-elevated)'}; color: ${hasSelectedServices ? '#141413' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px;">
                    1
                  </span>
                  <div>
                    <h3 class="font-serif tracking-tight leading-tight" style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px;">1. Chọn Dịch Vụ &amp; Gói Chăm Sóc (Có thể chọn nhiều)</h3>
                    <span style="font-size: 13px; color: ${hasSelectedServices ? '#C59B27' : 'var(--text-secondary)'}; font-weight: 600;">
                      ${this.getSelectedServicesSummaryText() || 'Bấm chọn một hoặc nhiều dịch vụ bên dưới'}
                    </span>
                  </div>
                </div>
                <span style="font-size: 16px; color: var(--text-secondary); transform: ${this.expandedSteps.step1 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep1" style="display: ${this.expandedSteps.step1 ? 'block' : 'none'}; padding: 22px 24px;">
                ${this.renderStep1ServicesHTML()}
              </div>
            </div>

            <!-- BƯỚC 2: CHỌN BARBER PHỤC VỤ -->
            <div class="booking-cascade-block" id="cascadeStep2" style="background: var(--surface-card); border: 1px solid ${hasSelectedStylist ? '#C59B27' : 'var(--border-color)'}; border-radius: 8px; overflow: hidden; box-shadow: none; opacity: ${hasSelectedServices ? '1' : '0.6'}; scroll-margin-top: 95px;">
              <div class="cascade-header" onclick="${hasSelectedServices ? "BookingPage.toggleAccordion('step2')" : "UICommon.showToast('Vui lòng chọn ít nhất 1 dịch vụ ở Bước 1 trước!', 'warning')"}"
                   style="padding: 18px 24px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: ${hasSelectedServices ? 'pointer' : 'not-allowed'}; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 34px; height: 34px; border-radius: 50%; background: ${hasSelectedStylist ? '#C59B27' : 'var(--surface-elevated)'}; color: ${hasSelectedStylist ? '#141413' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px;">
                    2
                  </span>
                  <div>
                    <h3 class="font-serif tracking-tight leading-tight" style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px;">2. Chọn Thợ Barber Tạo Mẫu</h3>
                    <span style="font-size: 13px; color: ${hasSelectedStylist ? '#C59B27' : 'var(--text-secondary)'}; font-weight: 600;">
                      ${this.getSelectedStylistName() || (hasSelectedServices ? 'Chọn thợ phục vụ hoặc tự động xếp thợ nhanh' : 'Chờ chọn dịch vụ...')}
                    </span>
                  </div>
                </div>
                <span style="font-size: 16px; color: var(--text-secondary); transform: ${this.expandedSteps.step2 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep2" style="display: ${this.expandedSteps.step2 ? 'block' : 'none'}; padding: 22px 24px;">
                ${this.renderStep2StylistsHTML()}
              </div>
            </div>

            <!-- BƯỚC 3: CHỌN NGÀY VÀ GIỜ HẸN -->
            <div class="booking-cascade-block" id="cascadeStep3" style="background: var(--surface-card); border: 1px solid ${hasSelectedTime ? '#C59B27' : 'var(--border-color)'}; border-radius: 8px; overflow: hidden; box-shadow: none; opacity: ${hasSelectedServices ? '1' : '0.6'}; scroll-margin-top: 95px;">
              <div class="cascade-header" onclick="${hasSelectedServices ? "BookingPage.toggleAccordion('step3')" : "UICommon.showToast('Vui lòng chọn ít nhất 1 dịch vụ ở Bước 1 trước!', 'warning')"}"
                   style="padding: 18px 24px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: ${hasSelectedServices ? 'pointer' : 'not-allowed'}; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 34px; height: 34px; border-radius: 50%; background: ${hasSelectedTime ? '#C59B27' : 'var(--surface-elevated)'}; color: ${hasSelectedTime ? '#141413' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px;">
                    3
                  </span>
                  <div>
                    <h3 class="font-serif tracking-tight leading-tight" style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px;">3. Chọn Ngày &amp; Khung Giờ Cắt Tóc</h3>
                    <span style="font-size: 13px; color: ${hasSelectedTime ? '#C59B27' : 'var(--text-secondary)'}; font-weight: 600;">
                      ${this.bookingState.timeSlot ? `Đã chọn: ${SalonUtils.formatDate(this.bookingState.date)} lúc ${this.bookingState.timeSlot}` : 'Bấm chọn ngày và giờ còn trống'}
                    </span>
                  </div>
                </div>
                <span style="font-size: 16px; color: var(--text-secondary); transform: ${this.expandedSteps.step3 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
              </div>
              <div class="cascade-body" id="bodyStep3" style="display: ${this.expandedSteps.step3 ? 'block' : 'none'}; padding: 22px 24px;">
                ${this.renderStep3DateTimeHTML()}
              </div>
            </div>

            <!-- BƯỚC 4: THÔNG TIN KHÁCH HÀNG & XÁC NHẬN PHIẾU HẸN -->
            <div class="booking-cascade-block" id="cascadeStep4" style="background: var(--surface-card); border: 1px solid ${this.expandedSteps.step4 || hasSelectedTime ? '#C59B27' : 'var(--border-color)'}; border-radius: 8px; overflow: hidden; box-shadow: none; opacity: ${hasSelectedTime ? '1' : '0.6'}; scroll-margin-top: 95px;">
              <div class="cascade-header" onclick="${this.bookingState.timeSlot ? "BookingPage.toggleAccordion('step4')" : "UICommon.showToast('Vui lòng chọn ngày và giờ hẹn ở Bước 3 trước!', 'warning')"}"
                   style="padding: 18px 24px; background: var(--surface-card); display: flex; justify-content: space-between; align-items: center; cursor: ${this.bookingState.timeSlot ? 'pointer' : 'not-allowed'}; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="width: 34px; height: 34px; border-radius: 50%; background: ${this.expandedSteps.step4 || hasSelectedTime ? '#C59B27' : 'var(--surface-elevated)'}; color: ${this.expandedSteps.step4 || hasSelectedTime ? '#141413' : 'var(--text-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px;">
                    4
                  </span>
                  <div>
                    <h3 class="font-serif tracking-tight leading-tight" style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px;">4. Thông Tin Khách Hàng &amp; Xác Nhận Đặt Lịch</h3>
                    <span style="font-size: 13px; color: ${this.expandedSteps.step4 ? '#C59B27' : 'var(--text-secondary)'}; font-weight: 600;">
                      ${this.expandedSteps.step4 ? 'Kiểm tra tóm tắt phiếu đặt hẹn và bấm xác nhận' : 'Chờ hoàn thành các bước trên...'}
                    </span>
                  </div>
                </div>
                <span style="font-size: 16px; color: var(--text-secondary); transform: ${this.expandedSteps.step4 ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s ease;">▼</span>
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

    // XỬ LÝ CHỌN NHIỀU DỊCH VỤ
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
      this.hasChosenStylist = true;
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
      this.hasChosenStylist = false;
      this.render(document.getElementById('webMainContainer'));
    },

    // TÍNH TOÁN DANH SÁCH DỊCH VỤ ĐÃ CHỌN
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
      return `Đã chọn (${calc.count} dịch vụ): ${names} • Tổng: ${SalonUtils.formatCurrency(calc.totalPrice)} • ${calc.totalDuration} phút`;
    },

    getSelectedStylistName() {
      if (this.bookingState.stylistId) {
        const st = (window.store && typeof window.store.getStylistById === 'function')
          ? window.store.getStylistById(this.bookingState.stylistId)
          : null;
        return st ? `Đã chọn: ${st.name} (${st.level || 'Master Barber'})` : 'Đã chọn thợ';
      }
      if (this.hasChosenStylist || this.bookingState.timeSlot) {
        return 'Đã chọn: Tự động xếp Barber tay nghề cao';
      }
      return '';
    },

    renderBranchOptionsHTML() {
      const branches = (window.store && typeof window.store.getBranches === 'function')
        ? window.store.getBranches()
        : (window.INITIAL_SALON_DATA?.branches || []);
      return branches.map(b => `
        <option value="${b.id}" ${this.bookingState.branchId === b.id ? 'selected' : ''}>
          ${(b.TenChiNhanh || b.name).replace(/[–—]/g, '-').split('-')[0].trim()}
        </option>
      `).join('');
    },

    // THẺ DỊCH VỤ TRỰC QUAN
    renderServiceVisualCard(item, isCombo = false) {
      const isSelected = this.bookingState.serviceIds.includes(item.id);
      const meta = this.serviceVisualMeta[item.id] || {};
      const shortName = meta.shortName || item.name || item.TenDichVu || item.TenCombo || item.id;
      const highlight = meta.highlight || (isCombo ? 'Gói chăm sóc toàn diện chuẩn Barbershop' : 'Tạo kiểu chuẩn form, chăm sóc chu đáo');
      const imgPath = meta.img || item.image || item.HinhAnh || (isCombo ? 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' : 'Men_Grooming_Products/DichVu_Men/DV1.jpg');
      const imgUrl = SalonUtils.formatImageUrl(imgPath);
      const dur = parseInt(String(item.duration || item.ThoiLuong || item.durationMinutes || (isCombo ? 75 : 45)).replace(/\s*phút/gi, ''), 10) || (isCombo ? 75 : 45);
      const price = Number(item.price || item.Gia || item.GiaCombo || 0);

      return `
        <div class="booking-service-visual-card ${isSelected ? 'selected' : ''}" 
             onclick="BookingPage.toggleSelectService('${item.id}')"
             role="button"
             tabindex="0"
             aria-pressed="${isSelected}">
          <div class="svc-media-box">
            <img src="${imgUrl}" alt="${SalonUtils.escapeHtml(shortName)}" class="svc-card-img" onerror="SalonUtils.handleImgError(this)" loading="lazy">
            <div class="svc-media-gradient"></div>
            
            <div class="svc-media-badges">
              ${isCombo ? '<span class="svc-badge-pill svc-badge-combo">COMBO HOT</span>' : '<span class="svc-badge-pill svc-badge-type">BARBER</span>'}
              ${item.discountPercent > 0 ? `<span class="svc-badge-pill svc-badge-promo" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; font-weight: 800; border: none;">-${item.discountPercent}%</span>` : ''}
              ${meta.savings ? `<span class="svc-badge-pill svc-badge-savings">${meta.savings}</span>` : ''}
            </div>

            <div class="svc-duration-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${dur} phút</span>
            </div>

            <div class="svc-check-circle ${isSelected ? 'checked' : ''}">
              ${isSelected ? '✓' : ''}
            </div>
          </div>

          <div class="svc-card-body">
            <div class="svc-card-top">
              <h4 class="svc-card-title font-serif">${shortName}</h4>
              <p class="svc-highlight-tag">${highlight}</p>
            </div>
            
            <div class="svc-card-footer">
              <div class="svc-card-price-box">
                ${(item.originalPrice && item.originalPrice > price) ? `
                  <span class="svc-card-old-price" style="text-decoration: line-through; opacity: 0.6; font-size: 13px; margin-right: 6px; color: var(--text-secondary);">${SalonUtils.formatCurrency(item.originalPrice)}</span>
                  <span class="svc-card-price font-bold" style="color: #ef4444;">${SalonUtils.formatCurrency(price)}</span>
                ` : `
                  <span class="svc-card-price">${SalonUtils.formatCurrency(price)}</span>
                `}
              </div>
              <button type="button" class="svc-select-btn ${isSelected ? 'selected' : ''}" 
                      onclick="event.stopPropagation(); BookingPage.toggleSelectService('${item.id}')">
                ${isSelected ? '✓ Đã chọn' : '+ Chọn'}
              </button>
            </div>
          </div>
        </div>
      `;
    },

    // BƯỚC 1: HIỂN THỊ DANH SÁCH DỊCH VỤ TRỰC QUAN BẮT MẮT
    renderStep1ServicesHTML() {
      const allServices = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const allCombos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];
      const calc = this.getTotalCalculations();
      const cat = this.selectedCategory || 'all';

      // Lọc danh sách theo Tab danh mục
      let filteredCombos = [];
      let filteredServices = [];

      if (cat === 'all') {
        filteredCombos = allCombos;
        filteredServices = allServices;
      } else if (cat === 'combo') {
        filteredCombos = allCombos;
        filteredServices = [];
      } else {
        filteredCombos = [];
        filteredServices = allServices.filter(s => {
          const meta = this.serviceVisualMeta[s.id] || {};
          return meta.category === cat;
        });
      }

      const totalItemsCount = allCombos.length + allServices.length;
      const comboCount = allCombos.length;
      const cutCount = allServices.filter(s => (this.serviceVisualMeta[s.id]?.category === 'cut')).length;
      const permCount = allServices.filter(s => (this.serviceVisualMeta[s.id]?.category === 'perm')).length;
      const spaCount = allServices.filter(s => (this.serviceVisualMeta[s.id]?.category === 'spa')).length;

      const categoryTabs = [
        { id: 'all', label: 'Tất Cả', count: totalItemsCount },
        { id: 'combo', label: 'Combo Tiết Kiệm', count: comboCount },
        { id: 'cut', label: 'Cắt & Ép Side', count: cutCount },
        { id: 'perm', label: 'Uốn & Nhuộm', count: permCount },
        { id: 'spa', label: 'Chăm Sóc & Râu', count: spaCount }
      ];

      return `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- THANH TAB LỌC DANH MỤC TRỰC QUAN -->
          <div class="svc-filter-tabs-row" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
            ${categoryTabs.map(t => `
              <button type="button" 
                      class="svc-filter-chip ${cat === t.id ? 'active' : ''}" 
                      onclick="BookingPage.setCategory('${t.id}')">
                <span>${t.label}</span>
                <span class="svc-chip-count">(${t.count})</span>
              </button>
            `).join('')}
          </div>

          <!-- DANH SÁCH GÓI COMBO TIẾT KIỆM (NẾU CÓ) -->
          ${filteredCombos.length > 0 ? `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                  GÓI COMBO TOÀN DIỆN (TIẾT KIỆM)
                </span>
                <span style="font-size: 12px; color: var(--text-secondary);">${filteredCombos.length} gói ưu đãi</span>
              </div>
              <div class="booking-services-grid">
                ${filteredCombos.map(c => this.renderServiceVisualCard(c, true)).join('')}
              </div>
            </div>
          ` : ''}

          <!-- DANH SÁCH DỊCH VỤ LẺ BARBER -->
          ${filteredServices.length > 0 ? `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                  ${cat === 'all' ? 'DỊCH VỤ CẮT, UỐN, NHUỘM & CHĂM SÓC' : 'DỊCH VỤ THEO YÊU CẦU'}
                </span>
                <span style="font-size: 12px; color: var(--text-secondary);">${filteredServices.length} dịch vụ</span>
              </div>
              <div class="booking-services-grid">
                ${filteredServices.map(s => this.renderServiceVisualCard(s, false)).join('')}
              </div>
            </div>
          ` : ''}

          <!-- THANH TỔNG HỢP CÁC DỊCH VỤ ĐÃ CHỌN (STICKY SUMMARY BAR) -->
          ${calc.count > 0 ? `
            <div class="selected-services-summary-bar" style="border-radius: 8px; border: 1.5px solid #C59B27; background: var(--surface-card); box-shadow: 0 4px 20px rgba(0,0,0,0.15); padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <div style="flex: 1; min-width: 260px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    ĐÃ CHỌN ${calc.count} DỊCH VỤ
                  </span>
                  <span style="font-size: 12px; color: var(--text-secondary);">•</span>
                  <span style="font-size: 12.5px; color: var(--text-secondary);">Thời gian: <strong style="color: var(--text-primary);">${calc.totalDuration} phút</strong></span>
                </div>
                <div class="font-serif tracking-tight leading-tight" style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                  ${calc.list.map(s => s.name).join(' + ')}
                </div>
                <div style="font-size: 16px; font-weight: 800; color: #C59B27;">
                  Tổng thanh toán: ${SalonUtils.formatCurrency(calc.totalPrice)}
                </div>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <button type="button" class="btn-cancel" onclick="BookingPage.clearSelectedServices()" style="padding: 10px 16px; font-size: 13px; border-radius: 6px; cursor: pointer;">
                  Xóa Hết
                </button>
                <button type="button" class="btn-submit-terracotta" onclick="BookingPage.proceedToStep2()" style="padding: 10px 22px; font-size: 13.5px; font-weight: 700; border-radius: 6px; background: #C59B27; color: #141413; border: 1px solid #C59B27; cursor: pointer;">
                  Tiếp Tục Sang Chọn Thợ (${calc.count}) →
                </button>
              </div>
            </div>
          ` : `
            <div style="text-align: center; padding: 22px; background: var(--surface-card); border: 1px dashed var(--border-color); border-radius: 8px; color: var(--text-secondary); font-size: 13.5px;">
              Vui lòng bấm <strong style="color: #C59B27;">+ Chọn</strong> các dịch vụ ở trên để tiếp tục. Bạn có thể chọn 1 hoặc nhiều dịch vụ tùy ý.
            </div>
          `}
        </div>
      `;
    },

    // BƯỚC 2: CHỌN THỢ BARBER
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
              ${this.bookingState.stylistId === '' ? 'Đang Chọn' : 'Chọn Nhanh'}
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

    // BƯỚC 3: CHỌN NGÀY VÀ GIỜ HẸN
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

      // Tìm ngày kế tiếp sau ngày đang chọn
      const currentDayIdx = nextDays.findIndex(d => d.iso === this.bookingState.date);
      // Ưu tiên tìm ngày tiếp theo còn chỗ trong danh sách
      const nextAvailableDay = nextDays.slice(currentDayIdx >= 0 ? currentDayIdx + 1 : 1).find(day => {
        const dSlots = (window.store && typeof window.store.getAvailableSlots === 'function')
          ? window.store.getAvailableSlots(day.iso, this.bookingState.stylistId, this.bookingState.branchId, duration)
          : [];
        return dSlots.some(s => s.available);
      });
      // Nếu không có ngày nào còn chỗ, lấy ngày liền kề tiếp theo trong 7 ngày
      const nextTargetDay = nextAvailableDay || (currentDayIdx >= 0 && currentDayIdx < nextDays.length - 1 ? nextDays[currentDayIdx + 1] : (currentDayIdx === nextDays.length - 1 ? nextDays[0] : nextDays[1]));

      let nextBtnText = 'Chuyển Sang Ngày Tiếp Theo';
      if (nextTargetDay) {
        if (currentDayIdx === 0 && nextTargetDay.iso === nextDays[1].iso) {
          nextBtnText = `Chuyển Sang Ngày Mai (${nextTargetDay.dateFormatted}) →`;
        } else {
          nextBtnText = `Chuyển Sang ${nextTargetDay.dayName} (${nextTargetDay.dateFormatted})${nextAvailableDay ? ' [Còn chỗ]' : ''} →`;
        }
      }

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
                            ĐÃ QUA
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
                            KÍN LỊCH
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
                          ${isSelected ? 'ĐÃ CHỌN' : 'CÒN CHỖ'}
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
                Quý khách vui lòng bấm chọn ngày tiếp theo ${nextTargetDay ? `(${nextTargetDay.dayName} ${nextTargetDay.dateFormatted})` : ''} ở thanh lịch phía trên hoặc bấm nút bên dưới để chuyển ngày.
              </p>
              ${nextTargetDay ? `
                <button type="button" class="btn-submit-terracotta" onclick="BookingPage.onSelectDate('${nextTargetDay.iso}')" style="padding: 10px 22px; font-size: 13.5px; font-weight: 800;">
                  ${nextBtnText}
                </button>
              ` : `
                <button type="button" class="btn-submit-terracotta" onclick="BookingPage.onSelectDate('${nextDays[0].iso}')" style="padding: 10px 22px; font-size: 13.5px; font-weight: 800;">
                  Quay Lại Lịch Đầu Tuần →
                </button>
              `}
            </div>
          ` : ''}
        </div>
      `;
    },

    // BƯỚC 4: THÔNG TIN KHÁCH HÀNG & PHIẾU ĐẶT CHỖ
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
          <div style="background: var(--surface-card); border: 1px solid #C59B27; border-radius: 8px; padding: 22px; box-shadow: none;">
            <div style="border-bottom: 1px dashed var(--border-color); padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="tracking-widest" style="font-size: 10.5px; font-weight: 800; color: #C59B27; text-transform: uppercase;">PHIẾU ĐẶT HẸN OMNI SALON</span>
                <h4 class="font-serif tracking-tight leading-tight" style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 2px 0 0;">Tóm Tắt Dịch Vụ</h4>
              </div>
              <span style="font-size: 11px; font-weight: 800; color: #C59B27; border: 1px solid rgba(197,155,39,0.3); padding: 3px 8px; border-radius: 4px;">OMNI PASS</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Chi Nhánh:</span>
                <strong style="color: var(--text-primary);">${branch ? branch.name.replace(/[–—]/g, '-').split('-')[0].trim() : 'Omni Salon'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Barber Phục Vụ:</span>
                <strong style="color: var(--text-primary);">${stylist ? stylist.name : 'Tự Động Xếp Thợ Nhanh'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Thời Gian Hẹn:</span>
                <strong style="color: #C59B27;">
                  ${this.bookingState.timeSlot ? `${SalonUtils.formatDate(this.bookingState.date)} • ${this.bookingState.timeSlot} - ${estimatedEndTime}` : 'Chưa chọn'}
                </strong>
              </div>
            </div>

            <!-- DANH SÁCH TỪNG DỊCH VỤ ĐÃ CHỌN -->
            <div style="border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 12px 0; margin-bottom: 14px;">
              <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; display: block; margin-bottom: 8px;">
                Danh sách ${calc.count} dịch vụ đã chọn:
              </span>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${calc.list.map(s => `
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                    <span style="color: var(--text-primary); font-weight: 600;">• ${s.name} (${s.duration || 45} phút)</span>
                    <strong style="color: #C59B27;">${SalonUtils.formatCurrency(s.price)}</strong>
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
              <span style="font-size: 24px; font-weight: 800; color: #C59B27;">
                ${SalonUtils.formatCurrency(calc.totalPrice)}
              </span>
            </div>

            <button type="button" onclick="BookingPage.confirmAndSubmit()"
                    style="width: 100%; height: 48px; border-radius: 6px; background: #141413; border: 1px solid #141413; color: #FAF8F5; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: none; transition: background 0.2s ease;">
              Xác Nhận Đặt Lịch Hẹn Ngay →
            </button>
          </div>
        </div>
      `;
    },

    confirmAndSubmit() {
      // Yêu cầu bắt buộc đăng nhập tài khoản trước khi đặt lịch
      const user = (window.store && typeof window.store.getCurrentUser === 'function')
        ? window.store.getCurrentUser()
        : null;
      if (!user) {
        if (window.UICommon) {
          window.UICommon.showToast('Vui lòng đăng nhập tài khoản để đặt lịch hẹn và tích điểm thành viên!', 'warning');
          window.UICommon.openAuthModal('login');
        } else if (window.AuthEngine && typeof window.AuthEngine.openAuthModal === 'function') {
          window.AuthEngine.openAuthModal();
        }
        return;
      }

      const rawName = (this.bookingState.customerName || (user ? (user.fullName || user.name) : '')).trim();
      const phone = (this.bookingState.customerPhone || (user ? user.phone : '')).trim();
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
      if (!rawName || rawName.length < 2 || /\d/.test(rawName)) {
        if (window.UICommon) window.UICommon.showToast('Họ và tên quý khách không hợp lệ (ít nhất 2 ký tự và không chứa số)!', 'warning');
        return;
      }
      const vnPhoneRegex = /^(03|05|07|08|09)\d{8}$/;
      if (!phone || !vnPhoneRegex.test(phone.replace(/[\s.-]/g, ''))) {
        if (window.UICommon) window.UICommon.showToast('Số điện thoại không hợp lệ! Vui lòng nhập số di động 10 chữ số (VD: 0908123456)', 'warning');
        return;
      }

      const summaryServiceName = calc.list.map(s => s.name).join(' + ');

      const chosenStylist = this.bookingState.stylistId
        ? (window.store && typeof window.store.getStylistById === 'function' ? window.store.getStylistById(this.bookingState.stylistId) : null)
        : null;

      const bookingPayload = {
        serviceId: this.bookingState.serviceIds[0],
        serviceIds: this.bookingState.serviceIds,
        servicesList: calc.list,
        serviceName: summaryServiceName,
        totalPrice: calc.totalPrice,
        durationMinutes: calc.totalDuration,
        branchId: this.bookingState.branchId,
        stylistId: this.bookingState.stylistId,
        stylistName: chosenStylist ? chosenStylist.name : 'Master Barber Chuyên Nghiệp',
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
