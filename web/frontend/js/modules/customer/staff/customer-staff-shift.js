// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG & NHÂN SỰ - QUẢN LÝ CA LÀM VIỆC (CUSTOMER STAFF SHIFT)
// File: web/frontend/js/modules/customer/customer-staff-shift.js
// ============================================================================

(function (window) {
  'use strict';

  const CustomerStaffShift = {
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
     * Lấy tài khoản người dùng hiện tại
     */
    getCurrentUser() {
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        const u = window.AuthEngine.getCurrentUser();
        if (u) return u;
      }
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        return window.AuthEngine.getCurrentUser();
      }
      if (window.store && typeof window.store.getCurrentUser === 'function') {
        return window.store.getCurrentUser();
      }
      return null;
    },

    /**
     * Mở modal xem ca làm hôm nay và đăng ký ca mới cho Stylist / Thu ngân
     */
    openStaffShiftModal() {
      const user = (typeof this.getCurrentUser === 'function')
        ? this.getCurrentUser()
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function')
          ? window.CustomerWeb.getCurrentUser()
          : (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function')
            ? window.AuthEngine.getCurrentUser()
            : null;
      if (!user) return;

      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;

      const roleUpper = String(user.role || user.vaiTroSql || user.VaiTro || user.ChucVu || '').toUpperCase();
      const capBacUpper = String(user.capBacSql || user.CapBac || '').toUpperCase();
      const isThoPhu = roleUpper.includes('PHỤ') || capBacUpper.includes('JUNIOR') || capBacUpper.includes('PHỤ');
      const isThoChinh = (roleUpper.includes('CHÍNH') || capBacUpper.includes('MASTER') || roleUpper.includes('QUẢN LÝ')) && !isThoPhu;
      const isStylist = isThoPhu || isThoChinh || roleUpper.includes('THỢ') || roleUpper.includes('STYLIST');
      const isCashier = roleUpper.includes('THU NGÂN') || roleUpper.includes('CASHIER');
      const staffRoleName = isThoPhu ? 'Thợ Phụ Barber' : (isThoChinh ? 'Thợ Chính Barber' : (isCashier ? 'Thu Ngân Quầy POS' : 'Nhân Viên Salon'));

      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];
      const userBranch = branches.find(b => b.id === user.branchId) || branches[0] || { id: 'CN01', name: 'Omni Salon Barber Q1 - Bến Thành' };

      const shifts = (window.store && typeof window.store.getStaffShifts === 'function')
        ? window.store.getStaffShifts(user.username || user.id)
        : [];

      const todayStr = new Date().toISOString().split('T')[0];
      const todayShift = shifts.find(s => s.date === todayStr) || {
        shiftName: isStylist ? 'Ca Sáng (08:30 - 14:30)' : 'Ca Thu Ngân Sáng (08:30 - 15:00)',
        status: 'ACTIVE',
        branchName: userBranch.name,
        note: isCashier ? 'Phụ trách máy POS và in phiếu hóa đơn' : (isThoPhu ? 'Phục vụ khách cắt tóc' : 'Điều hành ca và tiếp đón khách')
      };

      if (todayShift.note) {
        todayShift.note = todayShift.note
          .replace(/\s*VIP\s*/gi, ' ')
          .replace(/Trực 5 ghế cắt chính và phục vụ khách hẹn trước/gi, isThoPhu ? 'Phục vụ khách cắt tóc' : 'Điều hành ca và tiếp đón khách')
          .replace(/Phụ trách 5 lượt khách cắt tóc hẹn trước/gi, isThoPhu ? 'Phục vụ khách cắt tóc' : 'Điều hành ca và tiếp đón khách')
          .replace(/Phụ trách máy POS 01/gi, 'Phụ trách máy POS')
          .replace(/Trực quầy POS 01/gi, 'Trực quầy POS')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Lấy danh sách khách hẹn của thợ hôm nay nếu là Stylist
      const allBookings = (window.store && typeof window.store.getBookings === 'function') ? window.store.getBookings() : [];
      const myBookingsToday = isStylist ? allBookings.filter(b => (b.date === todayStr) && (b.stylistId === user.id || b.stylistName === user.fullName || b.stylistName === user.name)) : [];

      const escapeFn = (typeof this.escapeHtml === 'function')
        ? this.escapeHtml.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.escapeHtml === 'function')
          ? window.CustomerWeb.escapeHtml.bind(window.CustomerWeb)
          : (str) => (typeof str !== 'string' ? (str == null ? '' : String(str)) : str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

      const fmtDate = (d) => (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatDate === 'function' ? SalonUtils.formatDate(d) : (d || ''));

      modalBody.innerHTML = `
        <div class="booking-wizard-wrapper" style="max-width: 680px; padding: 24px;">
          <div class="booking-header" style="text-align: left; margin-bottom: 20px;">
            <div class="badge-terracotta" style="display: inline-block; margin-bottom: 8px;">CỔNG NHÂN VIÊN OMNI SALON</div>
            <h2 class="booking-title" style="font-size: 22px; margin: 0 0 6px;">LỊCH LÀM HÔM NAY & ĐĂNG KÝ CA</h2>
            <p class="booking-subtitle" style="font-size: 13.5px; color: var(--text-secondary); margin: 0;">
              Nhân sự: <strong style="color: #f59e0b;">${escapeFn(user.fullName || user.name)}</strong> (${staffRoleName}) • Chi nhánh: <strong>${userBranch.name.split('—')[0]}</strong>
            </p>
          </div>

          <!-- 1. CA LÀM VIỆC HÔM NAY -->
          <div style="background: var(--surface-card, #14171F); border: 2px solid #10b981; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <strong style="font-size: 14.5px; color: #10b981; text-transform: uppercase;">
                CA LÀM VIỆC HÔM NAY (${fmtDate(todayStr)})
              </strong>
              <span style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px;">
                ĐANG TRỰC CA
              </span>
            </div>

            <div style="font-size: 13.5px; line-height: 1.7; color: var(--text-primary);">
              <div><strong>Khung giờ ca:</strong> <span style="color: #f59e0b; font-weight: 800; font-size: 14px;">${todayShift.shiftName}</span></div>
              <div><strong>Địa điểm làm việc:</strong> ${todayShift.branchName}</div>
              <div><strong>Nhiệm vụ phụ trách:</strong> ${todayShift.note}</div>
              ${isStylist ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                  <strong>Lượt khách đặt bạn hôm nay:</strong> <span style="color: #f59e0b; font-weight: 800;">${myBookingsToday.length} ca</span>
                  ${myBookingsToday.length > 0 ? `
                    <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
                      ${myBookingsToday.map(b => `
                        <div style="font-size: 12.5px; color: var(--text-secondary); background: var(--surface-elevated); padding: 4px 8px; border-radius: 6px;">
                          • <strong>${b.timeSlot}</strong>: Khách ${escapeFn(b.customerName)} (${escapeFn(b.serviceName || 'Dịch vụ')})
                        </div>
                      `).join('')}
                    </div>
                  ` : '<div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">(Chưa có khách hẹn trước, sẵn sàng tiếp khách vãng lai tại quầy)</div>'}
                </div>
              ` : `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                  <strong>Trạng thái POS:</strong> <span style="color: #10b981; font-weight: 800;">Quầy POS Sẵn Sàng Thanh Toán</span>
                </div>
              `}
            </div>
          </div>

          <!-- 2. FORM ĐĂNG KÝ CA LÀM MỚI -->
          <div style="background: var(--surface-card, #14171F); border: 1.5px solid var(--border-color); border-radius: 14px; padding: 18px; margin-bottom: 20px;">
            <strong style="font-size: 14px; color: #f59e0b; text-transform: uppercase; display: block; margin-bottom: 12px;">
              Đăng Ký Ca Làm Việc Cho Ngày Tiếp Theo
            </strong>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Chọn Ngày Làm:</label>
                <input type="date" id="staffShiftDateInput" class="form-control-custom" 
                       value="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}" 
                       style="width: 100%; height: 40px; font-size: 13px;">
              </div>
              <div>
                <label style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Chọn Khung Ca:</label>
                <select id="staffShiftTypeSelect" class="form-control-custom" style="width: 100%; height: 40px; font-size: 13px;">
                  <option value="CA_SANG">Ca Sáng (08:30 - 14:30)</option>
                  <option value="CA_CHIEU">Ca Chiều (14:00 - 20:30)</option>
                  <option value="CA_TOI">Ca Tối (17:00 - 21:30)</option>
                  <option value="FULL_DAY">Cả Ngày (08:30 - 20:30)</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label style="font-size: 12.5px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 4px;">Ghi chú / Nguyện vọng phụ trách:</label>
              <input type="text" id="staffShiftNoteInput" class="form-control-custom" 
                     placeholder="VD: Nhận chuyên ca uốn nhuộm hoặc hỗ trợ quầy thanh toán nhanh..." 
                     style="width: 100%; height: 40px; font-size: 13px;">
            </div>

            <button type="button" class="btn-submit-terracotta" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 10px;" 
                    onclick="CustomerWeb.submitStaffShiftRegistration()">
              LƯU ĐĂNG KÝ CA LÀM
            </button>
          </div>

          <button class="btn-cancel" style="width: 100%; padding: 10px; border-radius: 10px;" onclick="UICommon.closeGlobalModal()">
            Đóng Cửa Sổ
          </button>
        </div>
      `;

      modal.classList.add('active');
    },

    /**
     * Gửi đăng ký ca làm việc mới lên hệ thống
     */
    submitStaffShiftRegistration() {
      const user = (typeof this.getCurrentUser === 'function')
        ? this.getCurrentUser()
        : (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function')
          ? window.CustomerWeb.getCurrentUser()
          : (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function')
            ? window.AuthEngine.getCurrentUser()
            : null;
      if (!user) return;

      const dateInput = document.getElementById('staffShiftDateInput');
      const typeSelect = document.getElementById('staffShiftTypeSelect');
      const noteInput = document.getElementById('staffShiftNoteInput');

      const date = dateInput ? dateInput.value : '';
      const shiftType = typeSelect ? typeSelect.value : 'CA_SANG';
      const shiftName = typeSelect ? typeSelect.options[typeSelect.selectedIndex].text : 'Ca Sáng (08:30 - 14:30)';
      const note = (noteInput ? noteInput.value : '').trim() || 'Đăng ký ca làm định kỳ';

      if (!date) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng chọn ngày làm việc!', 'warning');
        return;
      }

      if (window.store && typeof window.store.registerStaffShift === 'function') {
        window.store.registerStaffShift({
          userId: user.username || user.id,
          staffName: user.fullName || user.name || 'Nhân viên',
          role: user.role || 'STAFF',
          branchId: user.branchId || 'CN01',
          branchName: user.branchName || 'Omni Salon',
          shiftType,
          shiftName,
          date,
          note
        });

        const fmtDate = (d) => (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatDate === 'function' ? SalonUtils.formatDate(d) : (d || ''));
        if (window.UICommon) {
          window.UICommon.showToast(`Đã lưu đăng ký [${shiftName}] cho ngày ${fmtDate(date)} thành công!`, 'success');
        }
        if (typeof this.openStaffShiftModal === 'function') {
          this.openStaffShiftModal();
        } else if (window.CustomerWeb && typeof window.CustomerWeb.openStaffShiftModal === 'function') {
          window.CustomerWeb.openStaffShiftModal();
        }
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerStaffShift = CustomerStaffShift;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerStaffShift);
  }

})(typeof window !== 'undefined' ? window : this);

