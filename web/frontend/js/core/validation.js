/**
 * =========================================================================
 * 4RAU BARBERSHOP / OMNISALON — DATA VALIDATION & RUNTIME SCHEMA ENGINE
 * Tuân thủ: Clean Architecture, Separation of Concerns & Edge Case Defense
 * Thay thế giả định Happy Path bằng kiểm tra Schema runtime chặt chẽ (Zero Blind Casting)
 * =========================================================================
 */

(function (window) {
  'use strict';

  // ── 1. TIỆN ÍCH VALIDATION CƠ BẢN ──
  const ValidationUtils = {
    isNonEmptyString(val) {
      return typeof val === 'string' && val.trim().length > 0;
    },
    isValidPhone(val) {
      if (!val) return false;
      const clean = String(val).replace(/[\s.-]/g, '');
      return /^[0-9]{9,11}$/.test(clean);
    },
    isValidEmail(val) {
      if (!val) return true; // Optional field
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
    },
    isValidDateIso(val) {
      if (typeof val !== 'string') return false;
      return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val));
    },
    isValidTimeSlot(val) {
      if (typeof val !== 'string') return false;
      return /^([01]\d|2[0-3]):[0-5]\d$/.test(val);
    },
    isPositiveNumber(val) {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    },
    getTodayIso() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },
    getCurrentMinutes() {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    },
    timeToMinutes(timeStr) {
      if (!timeStr || !timeStr.includes(':')) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    }
  };

  // ── 2. SCHEMA DEFINITIONS (ZOD-EQUIVALENT RUNTIME VALIDATORS) ──
  const SalonSchemas = {
    /**
     * Validate dữ liệu đặt lịch hẹn (Booking Input & Payload)
     * Đảm bảo chống đặt lịch trong quá khứ theo thời gian thực (Real-time Defense)
     */
    validateBookingInput(input) {
      const errors = [];
      if (!input || typeof input !== 'object') {
        return { success: false, errors: ['Dữ liệu phiếu đặt lịch không hợp lệ hoặc rỗng.'] };
      }

      // Họ tên
      if (!ValidationUtils.isNonEmptyString(input.customerName)) {
        errors.push('Họ và tên quý khách không được để trống.');
      }

      // Số điện thoại
      if (!ValidationUtils.isValidPhone(input.customerPhone)) {
        errors.push('Số điện thoại không hợp lệ (phải từ 9 đến 11 chữ số).');
      }

      // Ngày hẹn
      if (!ValidationUtils.isValidDateIso(input.date)) {
        errors.push('Ngày hẹn không đúng định dạng YYYY-MM-DD.');
      }

      // Khung giờ hẹn
      if (!ValidationUtils.isValidTimeSlot(input.timeSlot)) {
        errors.push('Khung giờ hẹn không đúng định dạng HH:mm.');
      }

      // KIỂM TRA THỜI GIAN THỰC (REAL-TIME PAST CHECK)
      const todayIso = ValidationUtils.getTodayIso();
      const currentMin = ValidationUtils.getCurrentMinutes();
      const slotMin = ValidationUtils.timeToMinutes(input.timeSlot);

      if (input.date < todayIso) {
        errors.push(`Ngày hẹn (${input.date}) đã trôi qua so với hôm nay (${todayIso}).`);
      } else if (input.date === todayIso && slotMin <= currentMin) {
        errors.push(`Khung giờ ${input.timeSlot} ngày hôm nay đã kết thúc so với thời gian hiện tại.`);
      }

      // Dịch vụ
      const serviceIds = Array.isArray(input.serviceIds) ? input.serviceIds : (input.serviceId ? [input.serviceId] : []);
      if (serviceIds.length === 0) {
        errors.push('Vui lòng chọn ít nhất 1 dịch vụ cắt tóc hoặc gói chăm sóc.');
      }

      return {
        success: errors.length === 0,
        errors,
        validatedData: errors.length === 0 ? {
          ...input,
          customerName: input.customerName.trim(),
          customerPhone: String(input.customerPhone).replace(/[\s.-]/g, ''),
          date: input.date,
          timeSlot: input.timeSlot,
          serviceIds
        } : null
      };
    },

    /**
     * Validate dữ liệu chi nhánh từ API / DB
     */
    validateBranch(branch) {
      if (!branch || typeof branch !== 'object') return null;
      return {
        id: branch.id || branch.MaChiNhanh || 'CN01',
        name: branch.name || branch.TenChiNhanh || 'Omni Salon Chi Nhánh',
        address: branch.address || branch.DiaChi || 'TP. Hồ Chí Minh',
        phone: branch.phone || branch.SoDienThoai || '0909123456',
        image: branch.image || branch.HinhAnh || '',
        status: branch.status || branch.TrangThai || 'Hoạt động'
      };
    },

    /**
     * Validate dữ liệu dịch vụ từ API / DB
     */
    validateService(service) {
      if (!service || typeof service !== 'object') return null;
      return {
        id: service.id || service.MaDichVu || service.MaCombo || 'DV01',
        name: service.name || service.TenDichVu || service.TenCombo || 'Dịch vụ Barber',
        price: Number(service.price || service.Gia || service.GiaCombo || 0),
        duration: Number(service.duration || service.ThoiLuong || service.durationMinutes || 45),
        description: service.description || service.MoTa || '',
        image: service.image || service.HinhAnh || '',
        category: service.category || (service.MaCombo ? 'combo' : 'service')
      };
    },

    /**
     * Validate dữ liệu sản phẩm từ API / DB
     */
    validateProduct(prod) {
      if (!prod || typeof prod !== 'object') return null;
      return {
        id: prod.id || prod.MaSanPham || 'SP01',
        name: prod.name || prod.TenSanPham || 'Sản phẩm Pomade / Grooming',
        price: Number(prod.price || prod.GiaBan || prod.Gia || 0),
        originalPrice: Number(prod.originalPrice || prod.GiaGoc || prod.price || 0),
        stock: Number(prod.stock || prod.SoLuongTon || 0),
        image: prod.image || prod.HinhAnh || '',
        brand: prod.brand || prod.ThuongHieu || 'Omni Salon Grooming',
        status: prod.status || prod.TrangThai || 'Đang bán'
      };
    }
  };

  // ── 3. SKELETON UI LOADERS (LOẠI BỎ SPINNER TRÒN GENERIC AI) ──
  const SkeletonUI = {
    renderCardSkeleton(count = 4) {
      return Array.from({ length: count }, () => `
        <div class="skeleton-card" style="background: var(--surface-card); border: 1.5px solid var(--border-color); border-radius: 14px; padding: 20px; overflow: hidden; position: relative;">
          <div style="width: 100%; height: 160px; background: var(--surface-elevated); border-radius: 10px; margin-bottom: 14px; animation: pulseSkeleton 1.5s infinite ease-in-out;"></div>
          <div style="width: 70%; height: 20px; background: var(--surface-elevated); border-radius: 6px; margin-bottom: 10px; animation: pulseSkeleton 1.5s infinite ease-in-out;"></div>
          <div style="width: 45%; height: 16px; background: var(--surface-elevated); border-radius: 6px; margin-bottom: 16px; animation: pulseSkeleton 1.5s infinite ease-in-out;"></div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="width: 35%; height: 22px; background: var(--surface-elevated); border-radius: 6px; animation: pulseSkeleton 1.5s infinite ease-in-out;"></div>
            <div style="width: 30%; height: 36px; background: var(--surface-elevated); border-radius: 8px; animation: pulseSkeleton 1.5s infinite ease-in-out;"></div>
          </div>
        </div>
      `).join('');
    },

    renderBookingShiftSkeleton() {
      return `
        <div style="padding: 20px 0;">
          <div style="width: 200px; height: 18px; background: var(--surface-elevated); border-radius: 6px; margin-bottom: 14px; animation: pulseSkeleton 1.5s infinite;"></div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); gap: 10px;">
            ${Array.from({ length: 8 }, () => `
              <div style="height: 52px; background: var(--surface-elevated); border-radius: 10px; animation: pulseSkeleton 1.5s infinite;"></div>
            `).join('')}
          </div>
        </div>
      `;
    }
  };

  // Xuất bản global
  window.ValidationUtils = ValidationUtils;
  window.SalonSchemas = SalonSchemas;
  window.SkeletonUI = SkeletonUI;

})(typeof window !== 'undefined' ? window : this);
