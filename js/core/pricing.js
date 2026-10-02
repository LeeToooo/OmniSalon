// ============================================================================
// OmniSalon & 4RAU Barbershop Enterprise Suite
// CORE PRICING & PROMOTION SERVICE (CLEAN ARCHITECTURE — DRY REFACTOR)
// Tuân thủ: .antigravity/rules/04_refactor.md (Tách logic tính giá/voucher thành service riêng)
// ============================================================================

(function (window) {
  'use strict';

  class PricingService {
    /**
     * Tính toán số tiền tiết kiệm và tỷ lệ chiết khấu của gói Combo VIP
     * @param {number} originalPrice - Tổng giá gốc nếu làm từng dịch vụ lẻ
     * @param {number} comboPrice - Giá niêm yết trọn gói của Combo
     * @returns {{ savingsAmount: number, savingsPercent: number, isDiscounted: boolean, formattedSavings: string }}
     */
    static calculateComboSavings(originalPrice, comboPrice) {
      const orig = Number(originalPrice) || 0;
      const combo = Number(comboPrice) || 0;

      if (orig <= combo || orig === 0) {
        return {
          savingsAmount: 0,
          savingsPercent: 0,
          isDiscounted: false,
          formattedSavings: '0 đ'
        };
      }

      const savingsAmount = orig - combo;
      const savingsPercent = Math.round((savingsAmount / orig) * 100);

      return {
        savingsAmount,
        savingsPercent,
        isDiscounted: true,
        formattedSavings: savingsAmount.toLocaleString('vi-VN') + ' đ'
      };
    }

    /**
     * Kiểm tra tính hợp lệ và tính mức giảm giá của Voucher
     * @param {Object} voucher - Đối tượng Voucher từ database hoặc data.js
     * @param {number} orderSubtotal - Tổng tiền đơn hàng trước khi áp voucher
     * @returns {{ isValid: boolean, discountAmount: number, finalTotal: number, message: string }}
     */
    static applyVoucher(voucher, orderSubtotal) {
      const subtotal = Math.max(0, Number(orderSubtotal) || 0);

      if (!voucher || typeof voucher !== 'object') {
        return {
          isValid: false,
          discountAmount: 0,
          finalTotal: subtotal,
          message: 'Voucher không tồn tại hoặc không hợp lệ.'
        };
      }

      // Kiểm tra trạng thái kích hoạt
      if (voucher.isActive === false || voucher.is_active === 0) {
        return {
          isValid: false,
          discountAmount: 0,
          finalTotal: subtotal,
          message: `Mã ưu đãi [${voucher.code}] hiện đang tạm khóa.`
        };
      }

      // Kiểm tra hạn sử dụng
      const expiry = voucher.expiry || voucher.expiry_date || voucher.expiryDate;
      if (expiry) {
        const expiryDate = new Date(expiry + 'T23:59:59');
        const now = new Date();
        if (now > expiryDate) {
          return {
            isValid: false,
            discountAmount: 0,
            finalTotal: subtotal,
            message: `Mã ưu đãi [${voucher.code}] đã hết hạn sử dụng.`
          };
        }
      }

      // Kiểm tra giá trị đơn hàng tối thiểu
      const minOrder = Number(voucher.minOrder || voucher.min_order) || 0;
      if (subtotal < minOrder) {
        const diff = minOrder - subtotal;
        return {
          isValid: false,
          discountAmount: 0,
          finalTotal: subtotal,
          message: `Đơn hàng chưa đạt mức tối thiểu ${minOrder.toLocaleString('vi-VN')} đ (còn thiếu ${diff.toLocaleString('vi-VN')} đ).`
        };
      }

      // Tính số tiền được giảm theo loại (fixed hoặc percent)
      const discountType = (voucher.discountType || voucher.discount_type || 'fixed').toLowerCase();
      const rawValue = Number(voucher.discountValue || voucher.discount_value) || 0;
      let calculatedDiscount = 0;

      if (discountType === 'percent' || discountType === 'percentage') {
        calculatedDiscount = Math.round((subtotal * rawValue) / 100);
        // Áp mức trần giảm tối đa (nếu có cấu hình max_discount)
        const maxCap = Number(voucher.maxDiscount || voucher.max_discount);
        if (maxCap && maxCap > 0 && calculatedDiscount > maxCap) {
          calculatedDiscount = maxCap;
        }
      } else {
        // Giảm cố định theo số tiền VNĐ
        calculatedDiscount = rawValue;
      }

      // Không giảm vượt quá giá trị đơn hàng
      calculatedDiscount = Math.min(calculatedDiscount, subtotal);
      const finalTotal = Math.max(0, subtotal - calculatedDiscount);

      return {
        isValid: true,
        discountAmount: calculatedDiscount,
        finalTotal,
        message: `Áp dụng thành công mã [${voucher.code}], giảm ${calculatedDiscount.toLocaleString('vi-VN')} đ!`
      };
    }

    /**
     * Tra cứu voucher theo mã và tính toán toàn diện (DRY Pattern cho POS, Cart, Booking)
     * @param {string} code - Mã voucher nhập từ người dùng
     * @param {number} subtotal - Tổng tiền đơn hàng trước giảm giá
     * @param {Array} vouchersList - Danh sách voucher hợp lệ
     */
    static processVoucherCode(code, subtotal, vouchersList = []) {
      if (!code || typeof code !== 'string') {
        return { isValid: false, discountAmount: 0, finalTotal: subtotal, message: 'Vui lòng nhập mã ưu đãi.' };
      }
      const cleanCode = code.trim().toUpperCase();
      const voucher = (vouchersList || []).find(v => (v.code || '').toUpperCase() === cleanCode);
      if (!voucher) {
        return { isValid: false, discountAmount: 0, finalTotal: subtotal, message: `Mã ưu đãi [${cleanCode}] không tồn tại trên hệ thống.` };
      }
      const res = this.applyVoucher(voucher, subtotal);
      return { ...res, voucher, code: cleanCode };
    }

    /**
     * Tính toán giờ kết thúc chính xác dựa trên giờ bắt đầu và tổng thời lượng phục vụ
     * @param {string} startTimeStr - Chuỗi giờ bắt đầu (VD: '10:30' hoặc '09:00:00')
     * @param {number} durationMinutes - Tổng thời lượng thực hiện (phút)
     * @returns {string} Giờ kết thúc định dạng 'HH:mm'
     */
    static calculateEstimatedEndTime(startTimeStr, durationMinutes) {
      if (!startTimeStr || typeof startTimeStr !== 'string') return '00:00';
      const cleanTime = startTimeStr.trim();
      const parts = cleanTime.split(':');
      if (parts.length < 2) return startTimeStr;

      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(minutes)) return startTimeStr;

      const totalMinutes = (hours * 60) + minutes + (Number(durationMinutes) || 0);
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMinutes = totalMinutes % 60;

      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(endHours)}:${pad(endMinutes)}`;
    }

    /**
     * Tính toán tổng quan đơn hàng (Items, Voucher, Phí vận chuyển, Điểm tích lũy)
     * @param {Array} items - Danh sách mặt hàng/dịch vụ
     * @param {Object} voucher - Voucher áp dụng (hoặc null)
     * @param {number} shippingFee - Phí giao hàng (mặc định 0 đối với POS hoặc dịch vụ)
     * @returns {Object} Chi tiết hạch toán tài chính
     */
    static calculateOrderSummary(items = [], voucher = null, shippingFee = 0) {
      const safeItems = Array.isArray(items) ? items : [];
      let subtotal = 0;
      let totalItemsCount = 0;
      let totalDuration = 0;

      safeItems.forEach(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const duration = Number(item.duration || item.duration_minutes || item.durationMinutes) || 0;
        subtotal += price * qty;
        totalItemsCount += qty;
        totalDuration += duration * qty;
      });

      const voucherResult = voucher ? this.applyVoucher(voucher, subtotal) : {
        isValid: false,
        discountAmount: 0,
        finalTotal: subtotal,
        message: ''
      };

      const finalShipping = Math.max(0, Number(shippingFee) || 0);
      const grandTotal = voucherResult.finalTotal + finalShipping;

      // Điểm thưởng tích lũy (10.000 đ = 1 điểm)
      const earnedPoints = Math.floor(grandTotal / 10000);

      return {
        subtotal,
        discountAmount: voucherResult.discountAmount,
        shippingFee: finalShipping,
        grandTotal,
        totalItemsCount,
        totalDuration,
        earnedPoints,
        voucherStatus: voucherResult
      };
    }

    /**
     * DRY: Tính hoa hồng thợ cắt tóc theo doanh thu ca cắt (mặc định 15%)
     * @param {number} revenue - Tổng doanh thu các ca cắt tóc
     * @param {number} [rate=0.15] - Tỷ lệ hoa hồng (0.15 = 15%)
     * @returns {number} Số tiền hoa hồng (đã làm tròn)
     */
    static calculateStylistCommission(revenue, rate = 0.15) {
      const rev = Math.max(0, Number(revenue) || 0);
      const r = (rate !== undefined && !isNaN(rate)) ? Number(rate) : 0.15;
      return Math.round(rev * r);
    }
  }

  // Xuất module global (Window Exposure)
  window.PricingService = PricingService;
  window.Pricing = PricingService;

})(typeof window !== 'undefined' ? window : this);
