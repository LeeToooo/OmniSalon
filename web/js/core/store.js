// =========================================================================
// OmniSalon / Omni Salon — CORE REACTIVE STORE MODULE
// Phiên bản: 2.2.0 Clean Architecture & Ponytail Optimized
// (State Engine, Quản lý Combos, Tồn kho Chi Nhánh, Anti-Double Booking, POS)
// =========================================================================

(function (window) {
  'use strict';

  class SalonStore {
    constructor() {
      this.storageKey = 'OMNISALON_SQL_DIRECT_V11';
      this.listeners = [];
      this.liveServerUrl = (typeof window !== 'undefined' && window.location.port === '8080')
        ? `${window.location.origin}/api`
        : 'http://127.0.0.1:8080/api';
      this.initStore();
      this.initLiveSync();
    }

    initLiveSync() {
      // 1. Kênh BroadcastChannel đồng bộ tức thì giữa các tab Web PC và Web Mobile
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          this.syncChannel = new BroadcastChannel('omni_salon_live_sync');
          this.syncChannel.onmessage = (event) => {
            if (event.data && event.data.type === 'DATA_UPDATED') {
              const fresh = localStorage.getItem(this.storageKey);
              if (fresh) {
                this.state = JSON.parse(fresh);
                this.notify('CROSS_TAB_SYNC');
              }
            }
          };
        } catch (_) { }
      }

      // 2. Tự động đồng bộ Live Server SQL định kỳ 2 giây 1 lần
      if (typeof window !== 'undefined') {
        this.syncWithLiveServer();
        setInterval(() => this.syncWithLiveServer(), 2000);
      }
    }

    async syncWithLiveServer() {
      if (typeof fetch === 'undefined') return;
      try {
        const res = await fetch(`${this.liveServerUrl}/database`, { method: 'GET' });
        if (!res.ok) return;
        const db = await res.json();
        let changed = false;

        // 1. Đồng bộ Chi Nhánh từ SQL
        if (Array.isArray(db.branches) && db.branches.length > 0) {
          if (!this.state.branches || JSON.stringify(this.state.branches) !== JSON.stringify(db.branches)) {
            this.state.branches = db.branches;
            changed = true;
          }
        }

        // 2. Đồng bộ Sản Phẩm từ SQL
        if (Array.isArray(db.products) && db.products.length > 0) {
          if (!this.state.products || JSON.stringify(this.state.products) !== JSON.stringify(db.products)) {
            this.state.products = db.products;
            changed = true;
          }
        }

        // 3. Đồng bộ Danh Mục Sản Phẩm từ SQL
        if (Array.isArray(db.categories) && db.categories.length > 0) {
          if (!this.state.categories || JSON.stringify(this.state.categories) !== JSON.stringify(db.categories)) {
            this.state.categories = db.categories;
            changed = true;
          }
        }

        // 4. Đồng bộ Dịch Vụ từ SQL
        if (Array.isArray(db.services) && db.services.length > 0) {
          if (!this.state.services || JSON.stringify(this.state.services) !== JSON.stringify(db.services)) {
            this.state.services = db.services;
            changed = true;
          }
        }

        // 5. Đồng bộ Nhân Viên / Stylists từ SQL
        if (Array.isArray(db.stylists) && db.stylists.length > 0) {
          if (!this.state.stylists || JSON.stringify(this.state.stylists) !== JSON.stringify(db.stylists)) {
            this.state.stylists = db.stylists;
            changed = true;
          }
        }

        // 6. Đồng bộ danh sách đặt lịch từ SQL
        if (Array.isArray(db.bookings) && db.bookings.length > 0) {
          const currentMap = new Map((this.state.bookings || []).map(b => [
            (b.id || b.MaLichHen || b.bookingCode || '').toString().toLowerCase(),
            b
          ]));
          for (const serverBooking of db.bookings) {
            const sid = (serverBooking.id || serverBooking.MaLichHen || serverBooking.bookingCode || '').toString().toLowerCase();
            if (!sid) continue;
            if (!currentMap.has(sid)) {
              if (!this.state.bookings) this.state.bookings = [];
              this.state.bookings.unshift(serverBooking);
              changed = true;
            } else {
              const local = currentMap.get(sid);
              if (local.status !== serverBooking.status || local.timeSlot !== serverBooking.timeSlot || local.date !== serverBooking.date) {
                Object.assign(local, serverBooking);
                changed = true;
              }
            }
          }
        }

        // 7. Đồng bộ danh sách đơn hàng từ SQL
        if (Array.isArray(db.orders) && db.orders.length > 0) {
          const currentOrderMap = new Map((this.state.orders || []).map(o => [o.id || o.orderCode, o]));
          for (const serverOrder of db.orders) {
            const oid = serverOrder.id || serverOrder.orderCode;
            if (!currentOrderMap.has(oid)) {
              if (!this.state.orders) this.state.orders = [];
              this.state.orders.unshift(serverOrder);
              changed = true;
            }
          }
        }

        if (changed) {
          localStorage.setItem(this.storageKey, JSON.stringify(this.state));
          this.notify('LIVE_SERVER_SYNC');
        }
      } catch (_) {
        // Live server offline / connecting
      }
    }

    async syncBookingToLiveServer(booking) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking)
        });
      } catch (_) { }
    }

    async syncOrderToLiveServer(order) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
      } catch (_) { }
    }

    async syncBookingStatusToLiveServer(bookingId, status, extraData = {}) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/bookings/${bookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, ...extraData })
        });
      } catch (_) { }
    }

    async syncStylistToLiveServer(stylist) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/stylists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stylist)
        });
      } catch (_) { }
    }

    async syncDeleteStylistToLiveServer(stylistId) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/stylists/${stylistId}`, {
          method: 'DELETE'
        });
      } catch (_) { }
    }

    async syncServiceToLiveServer(service) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(service)
        });
      } catch (_) { }
    }

    async syncDeleteServiceToLiveServer(serviceId) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/services/${serviceId}`, {
          method: 'DELETE'
        });
      } catch (_) { }
    }

    async syncProductToLiveServer(product) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
      } catch (_) { }
    }

    async syncDeleteProductToLiveServer(productId) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/products/${productId}`, {
          method: 'DELETE'
        });
      } catch (_) { }
    }

    async syncDeleteBookingToLiveServer(bookingId) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/bookings/${bookingId}`, {
          method: 'DELETE'
        });
      } catch (_) { }
    }

    async syncBranchToLiveServer(branch) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/branches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branch)
        });
      } catch (_) { }
    }

    async syncDeleteBranchToLiveServer(branchId) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/branches/${branchId}`, {
          method: 'DELETE'
        });
      } catch (_) { }
    }


    getSqlBaselineData() {
      // 20 Chi Nhánh chính thức từ CSDL QL_SALON.sql
      const branches = [
        { id: 'CN01', MaChiNhanh: 'CN01', name: 'Men Salon Barber Q1 - Bến Thành', TenChiNhanh: 'Men Salon Barber Q1 - Bến Thành', address: '120 Lê Lợi, P. Bến Thành, Q.1, TP.HCM', DiaChi: '120 Lê Lợi, P. Bến Thành, Q.1, TP.HCM', phone: '0901111001', SoDienThoai: '0901111001', openHours: '08:30 - 21:30', openTime: '08:30:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN02', MaChiNhanh: 'CN02', name: 'Men Salon Barber Tân Bình - Cộng Hòa', TenChiNhanh: 'Men Salon Barber Tân Bình - Cộng Hòa', address: '45 Cộng Hòa, P.4, Q.Tân Bình, TP.HCM', DiaChi: '45 Cộng Hòa, P.4, Q.Tân Bình, TP.HCM', phone: '0901111002', SoDienThoai: '0901111002', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN03', MaChiNhanh: 'CN03', name: 'Men Salon Barber Bình Thạnh - Điện Biên Phủ', TenChiNhanh: 'Men Salon Barber Bình Thạnh - Điện Biên Phủ', address: '88 Điện Biên Phủ, P.15, Q.Bình Thạnh, TP.HCM', DiaChi: '88 Điện Biên Phủ, P.15, Q.Bình Thạnh, TP.HCM', phone: '0901111003', SoDienThoai: '0901111003', openHours: '09:00 - 22:00', openTime: '09:00:00', closeTime: '22:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN04', MaChiNhanh: 'CN04', name: 'Men Salon Barber Q3 - Nam Kỳ Khởi Nghĩa', TenChiNhanh: 'Men Salon Barber Q3 - Nam Kỳ Khởi Nghĩa', address: '215 Nam Kỳ Khởi Nghĩa, P.7, Q.3, TP.HCM', DiaChi: '215 Nam Kỳ Khởi Nghĩa, P.7, Q.3, TP.HCM', phone: '0901111004', SoDienThoai: '0901111004', openHours: '08:30 - 21:30', openTime: '08:30:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN05', MaChiNhanh: 'CN05', name: 'Men Salon Barber Q5 - Trần Hưng Đạo', TenChiNhanh: 'Men Salon Barber Q5 - Trần Hưng Đạo', address: '105 Trần Hưng Đạo, P.6, Q.5, TP.HCM', DiaChi: '105 Trần Hưng Đạo, P.6, Q.5, TP.HCM', phone: '0901111005', SoDienThoai: '0901111005', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN06', MaChiNhanh: 'CN06', name: 'Men Salon Barber Q7 - Nguyễn Thị Thập', TenChiNhanh: 'Men Salon Barber Q7 - Nguyễn Thị Thập', address: '480 Nguyễn Thị Thập, P.Tân Quy, Q.7, TP.HCM', DiaChi: '480 Nguyễn Thị Thập, P.Tân Quy, Q.7, TP.HCM', phone: '0901111006', SoDienThoai: '0901111006', openHours: '09:00 - 21:30', openTime: '09:00:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN07', MaChiNhanh: 'CN07', name: 'Men Salon Barber Q10 - 3 Tháng 2', TenChiNhanh: 'Men Salon Barber Q10 - 3 Tháng 2', address: '324 Ba Tháng Hai, P.12, Q.10, TP.HCM', DiaChi: '324 Ba Tháng Hai, P.12, Q.10, TP.HCM', phone: '0901111007', SoDienThoai: '0901111007', openHours: '08:30 - 21:30', openTime: '08:30:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN08', MaChiNhanh: 'CN08', name: 'Men Salon Barber Phú Nhuận - Phan Xích Long', TenChiNhanh: 'Men Salon Barber Phú Nhuận - Phan Xích Long', address: '150 Phan Xích Long, P.2, Q.Phú Nhuận, TP.HCM', DiaChi: '150 Phan Xích Long, P.2, Q.Phú Nhuận, TP.HCM', phone: '0901111008', SoDienThoai: '0901111008', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN09', MaChiNhanh: 'CN09', name: 'Men Salon Barber Gò Vấp - Quang Trung', TenChiNhanh: 'Men Salon Barber Gò Vấp - Quang Trung', address: '68 Quang Trung, P.10, Q.Gò Vấp, TP.HCM', DiaChi: '68 Quang Trung, P.10, Q.Gò Vấp, TP.HCM', phone: '0901111009', SoDienThoai: '0901111009', openHours: '09:00 - 21:30', openTime: '09:00:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN10', MaChiNhanh: 'CN10', name: 'Men Salon Barber Thủ Đức - Võ Văn Ngân', TenChiNhanh: 'Men Salon Barber Thủ Đức - Võ Văn Ngân', address: '98 Võ Văn Ngân, P.Linh Chiểu, TP.Thủ Đức, TP.HCM', DiaChi: '98 Võ Văn Ngân, P.Linh Chiểu, TP.Thủ Đức, TP.HCM', phone: '0901111010', SoDienThoai: '0901111010', openHours: '08:30 - 21:30', openTime: '08:30:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN11', MaChiNhanh: 'CN11', name: 'Men Salon Barber Thảo Điền - Xuân Thủy', TenChiNhanh: 'Men Salon Barber Thảo Điền - Xuân Thủy', address: '55 Xuân Thủy, P.Thảo Điền, TP.Thủ Đức, TP.HCM', DiaChi: '55 Xuân Thủy, P.Thảo Điền, TP.Thủ Đức, TP.HCM', phone: '0901111011', SoDienThoai: '0901111011', openHours: '09:00 - 22:00', openTime: '09:00:00', closeTime: '22:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN12', MaChiNhanh: 'CN12', name: 'Men Salon Barber Q4 - Hoàng Diệu', TenChiNhanh: 'Men Salon Barber Q4 - Hoàng Diệu', address: '12 Hoàng Diệu, P.9, Q.4, TP.HCM', DiaChi: '12 Hoàng Diệu, P.9, Q.4, TP.HCM', phone: '0901111012', SoDienThoai: '0901111012', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN13', MaChiNhanh: 'CN13', name: 'Men Salon Barber Q6 - Hậu Giang', TenChiNhanh: 'Men Salon Barber Q6 - Hậu Giang', address: '260 Hậu Giang, P.4, Q.6, TP.HCM', DiaChi: '260 Hậu Giang, P.4, Q.6, TP.HCM', phone: '0901111013', SoDienThoai: '0901111013', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN14', MaChiNhanh: 'CN14', name: 'Men Salon Barber Q8 - Phạm Hùng', TenChiNhanh: 'Men Salon Barber Q8 - Phạm Hùng', address: '180 Phạm Hùng, P.5, Q.8, TP.HCM', DiaChi: '180 Phạm Hùng, P.5, Q.8, TP.HCM', phone: '0901111014', SoDienThoai: '0901111014', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN15', MaChiNhanh: 'CN15', name: 'Men Salon Barber Q11 - Ông Ích Khiêm', TenChiNhanh: 'Men Salon Barber Q11 - Ông Ích Khiêm', address: '85 Ông Ích Khiêm, P.10, Q.11, TP.HCM', DiaChi: '85 Ông Ích Khiêm, P.10, Q.11, TP.HCM', phone: '0901111015', SoDienThoai: '0901111015', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN16', MaChiNhanh: 'CN16', name: 'Men Salon Barber Q12 - Lê Văn Khương', TenChiNhanh: 'Men Salon Barber Q12 - Lê Văn Khương', address: '45 Lê Văn Khương, P.Thới An, Q.12, TP.HCM', DiaChi: '45 Lê Văn Khương, P.Thới An, Q.12, TP.HCM', phone: '0901111016', SoDienThoai: '0901111016', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN17', MaChiNhanh: 'CN17', name: 'Men Salon Barber Tân Phú - Lũy Bán Bích', TenChiNhanh: 'Men Salon Barber Tân Phú - Lũy Bán Bích', address: '72 Lũy Bán Bích, P.Tân Thới Hòa, Q.Tân Phú, TP.HCM', DiaChi: '72 Lũy Bán Bích, P.Tân Thới Hòa, Q.Tân Phú, TP.HCM', phone: '0901111017', SoDienThoai: '0901111017', openHours: '08:30 - 21:30', openTime: '08:30:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN18', MaChiNhanh: 'CN18', name: 'Men Salon Barber Bình Tân - Tên Lửa', TenChiNhanh: 'Men Salon Barber Bình Tân - Tên Lửa', address: '110 Tên Lửa, P.Bình Trị Đông B, Q.Bình Tân, TP.HCM', DiaChi: '110 Tên Lửa, P.Bình Trị Đông B, Q.Bình Tân, TP.HCM', phone: '0901111018', SoDienThoai: '0901111018', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN19', MaChiNhanh: 'CN19', name: 'Men Salon Barber Bình Chánh - Quốc Lộ 50', TenChiNhanh: 'Men Salon Barber Bình Chánh - Quốc Lộ 50', address: '35 Quốc lộ 50, X.Bình Hưng, H.Bình Chánh, TP.HCM', DiaChi: '35 Quốc lộ 50, X.Bình Hưng, H.Bình Chánh, TP.HCM', phone: '0901111019', SoDienThoai: '0901111019', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' },
        { id: 'CN20', MaChiNhanh: 'CN20', name: 'Men Salon Barber Hóc Môn - Lý Thường Kiệt', TenChiNhanh: 'Men Salon Barber Hóc Môn - Lý Thường Kiệt', address: '52 Lý Thường Kiệt, TT.Hóc Môn, H.Hóc Môn, TP.HCM', DiaChi: '52 Lý Thường Kiệt, TT.Hóc Môn, H.Hóc Môn, TP.HCM', phone: '0901111020', SoDienThoai: '0901111020', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', status: 'Hoạt động' }
      ];

      // 10 Lịch Hẹn từ CSDL QL_SALON.sql (Tổng: 5.540.000 đ)
      const bookings = [
        { id: 'LH01', MaLichHen: 'LH01', bookingCode: 'LH01', customerId: 'KH01', customerName: 'Ngô Văn Tuấn', customerPhone: '0988000001', stylistId: 'NV02', stylistName: 'Đỗ Đình Độ', branchId: 'CN01', branchName: 'Men Salon Barber Q1 - Bến Thành', bookingDate: '2026-10-10', date: '2026-10-10', timeSlot: '09:00', status: 'Confirmed', serviceName: 'Cắt Fade ngắn cao vuốt sáp', totalPrice: 120000, TongTien: 120000 },
        { id: 'LH02', MaLichHen: 'LH02', bookingCode: 'LH02', customerId: 'KH02', customerName: 'Trần Mỹ Linh', customerPhone: '0988000002', stylistId: 'NV05', stylistName: 'Trần Quốc Huy', branchId: 'CN02', branchName: 'Men Salon Barber Tân Bình - Cộng Hòa', bookingDate: '2026-10-10', date: '2026-10-10', timeSlot: '10:00', status: 'Confirmed', serviceName: 'Cắt & tạo kiểu layer', totalPrice: 250000, TongTien: 250000 },
        { id: 'LH03', MaLichHen: 'LH03', bookingCode: 'LH03', customerId: 'KH03', customerName: 'Đặng Thanh Tùng', customerPhone: '0988000003', stylistId: 'NV08', stylistName: 'Đặng Hoài Nam', branchId: 'CN03', branchName: 'Men Salon Barber Bình Thạnh - Điện Biên Phủ', bookingDate: '2026-10-11', date: '2026-10-11', timeSlot: '14:00', status: 'Confirmed', serviceName: 'Uốn tóc phồng Hàn Quốc', totalPrice: 650000, TongTien: 650000 },
        { id: 'LH04', MaLichHen: 'LH04', bookingCode: 'LH04', customerId: 'KH04', customerName: 'Vũ Phương Thảo', customerPhone: '0988000004', stylistId: 'NV11', stylistName: 'Hà Quốc Trọng', branchId: 'CN04', branchName: 'Men Salon Barber Q3 - Nam Kỳ Khởi Nghĩa', bookingDate: '2026-10-11', date: '2026-10-11', timeSlot: '15:00', status: 'Confirmed', serviceName: 'Nhuộm tông xám khói', totalPrice: 950000, TongTien: 950000 },
        { id: 'LH05', MaLichHen: 'LH05', bookingCode: 'LH05', customerId: 'KH05', customerName: 'Lê Minh Khôi', customerPhone: '0988000005', stylistId: 'NV14', stylistName: 'Dương Hoàng Long', branchId: 'CN05', branchName: 'Men Salon Barber Q5 - Trần Hưng Đạo', bookingDate: '2026-10-12', date: '2026-10-12', timeSlot: '09:30', status: 'Confirmed', serviceName: 'Phục hồi tóc hư tổn chuyên sâu', totalPrice: 800000, TongTien: 800000 },
        { id: 'LH06', MaLichHen: 'LH06', bookingCode: 'LH06', customerId: 'KH06', customerName: 'Hoàng Trọng Nghĩa', customerPhone: '0988000006', stylistId: 'NV17', stylistName: 'Trịnh Xuân Phong', branchId: 'CN06', branchName: 'Men Salon Barber Q7 - Nguyễn Thị Thập', bookingDate: '2026-10-12', date: '2026-10-12', timeSlot: '10:30', status: 'Confirmed', serviceName: 'Khách quen đặt cắt định kỳ', totalPrice: 120000, TongTien: 120000 },
        { id: 'LH07', MaLichHen: 'LH07', bookingCode: 'LH07', customerId: 'KH07', customerName: 'Trần Đình Phong', customerPhone: '0988000007', stylistId: 'NV20', stylistName: 'Đinh Trọng Nghĩa', branchId: 'CN07', branchName: 'Men Salon Barber Q10 - 3 Tháng 2', bookingDate: '2026-10-13', date: '2026-10-13', timeSlot: '13:30', status: 'Confirmed', serviceName: 'Uốn lọn xoăn Texture', totalPrice: 650000, TongTien: 650000 },
        { id: 'LH08', MaLichHen: 'LH08', bookingCode: 'LH08', customerId: 'KH08', customerName: 'Nguyễn Hải Đăng', customerPhone: '0988000008', stylistId: 'NV23', stylistName: 'Đỗ Thái Bảo', branchId: 'CN08', branchName: 'Men Salon Barber Phú Nhuận - Phan Xích Long', bookingDate: '2026-10-13', date: '2026-10-13', timeSlot: '14:00', status: 'Confirmed', serviceName: 'Cắt tỉa gọn tóc dài', totalPrice: 250000, TongTien: 250000 },
        { id: 'LH09', MaLichHen: 'LH09', bookingCode: 'LH09', customerId: 'KH09', customerName: 'Dương Gia Bảo', customerPhone: '0988000009', stylistId: 'NV26', stylistName: 'Lâm Trường Giang', branchId: 'CN09', branchName: 'Men Salon Barber Gò Vấp - Quang Trung', bookingDate: '2026-10-14', date: '2026-10-14', timeSlot: '09:00', status: 'Confirmed', serviceName: 'Nhuộm nâu hạt dẻ sáng', totalPrice: 950000, TongTien: 950000 },
        { id: 'LH10', MaLichHen: 'LH10', bookingCode: 'LH10', customerId: 'KH10', customerName: 'Phan Hoàng Long', customerPhone: '0988000010', stylistId: 'NV29', stylistName: 'Bùi Tiến Dũng', branchId: 'CN10', branchName: 'Men Salon Barber Thủ Đức - Võ Văn Ngân', bookingDate: '2026-10-14', date: '2026-10-14', timeSlot: '16:00', status: 'Confirmed', serviceName: 'Hấp dưỡng phục hồi Olaplex', totalPrice: 800000, TongTien: 800000 }
      ];

      // 10 Đơn Hàng Bán Lẻ từ CSDL QL_SALON.sql (Tổng: 5.350.000 đ)
      const orders = [
        { id: 'DH01', orderCode: 'DH01', customerName: 'Đinh Quốc Việt', customerPhone: '0988000011', branchId: 'CN11', orderDate: '2026-10-05 09:30:00', totalAmount: 286000, TongTien: 286000, orderStatus: 'Delivering', shippingAddress: '55 Xuân Thủy, P.Thảo Điền, TP.Thủ Đức', receiveMethod: 'Giao hàng tận nơi' },
        { id: 'DH02', orderCode: 'DH02', customerName: 'Lâm Thanh Sơn', customerPhone: '0988000012', branchId: 'CN12', orderDate: '2026-10-05 10:15:00', totalAmount: 525000, TongTien: 525000, orderStatus: 'Completed', shippingAddress: '12 Hoàng Diệu, P.9, Q.4, TP.HCM', receiveMethod: 'Tại quầy' },
        { id: 'DH03', orderCode: 'DH03', customerName: 'Mai Tấn Phát', customerPhone: '0988000013', branchId: 'CN13', orderDate: '2026-10-05 11:00:00', totalAmount: 390000, TongTien: 390000, orderStatus: 'Delivering', shippingAddress: '260 Hậu Giang, P.4, Q.6, TP.HCM', receiveMethod: 'Giao hàng tận nơi' },
        { id: 'DH04', orderCode: 'DH04', customerName: 'Trương Hoàng Phúc', customerPhone: '0988000014', branchId: 'CN14', orderDate: '2026-10-06 14:20:00', totalAmount: 360000, TongTien: 360000, orderStatus: 'Completed', shippingAddress: '180 Phạm Hùng, P.5, Q.8, TP.HCM', receiveMethod: 'Giao hàng tận nơi' },
        { id: 'DH05', orderCode: 'DH05', customerName: 'Võ Hoài Nam', customerPhone: '0988000015', branchId: 'CN15', orderDate: '2026-10-06 15:45:00', totalAmount: 620000, TongTien: 620000, orderStatus: 'Completed', shippingAddress: '85 Ông Ích Khiêm, P.10, Q.11, TP.HCM', receiveMethod: 'Tại quầy' },
        { id: 'DH06', orderCode: 'DH06', customerName: 'Đoàn Hữu Tài', customerPhone: '0988000016', branchId: 'CN16', orderDate: '2026-10-07 09:10:00', totalAmount: 993000, TongTien: 993000, orderStatus: 'Processing', shippingAddress: '45 Lê Văn Khương, P.Thới An, Q.12', receiveMethod: 'Giao hàng tận nơi' },
        { id: 'DH07', orderCode: 'DH07', customerName: 'Cao Minh Đạt', customerPhone: '0988000017', branchId: 'CN17', orderDate: '2026-10-07 10:30:00', totalAmount: 419000, TongTien: 419000, orderStatus: 'Delivering', shippingAddress: '72 Lũy Bán Bích, P.Tân Thới Hòa, Tân Phú', receiveMethod: 'Tại quầy' },
        { id: 'DH08', orderCode: 'DH08', customerName: 'Bùi Quang Huy', customerPhone: '0988000018', branchId: 'CN18', orderDate: '2026-10-07 13:00:00', totalAmount: 517000, TongTien: 517000, orderStatus: 'Delivering', shippingAddress: '110 Tên Lửa, P.Bình Trị Đông B, Bình Tân', receiveMethod: 'Giao hàng tận nơi' },
        { id: 'DH09', orderCode: 'DH09', customerName: 'Hồ Văn Cường', customerPhone: '0988000019', branchId: 'CN19', orderDate: '2026-10-07 14:15:00', totalAmount: 378000, TongTien: 378000, orderStatus: 'Processing', shippingAddress: '35 Quốc lộ 50, X.Bình Hưng, Bình Chánh', receiveMethod: 'Tại quầy' },
        { id: 'DH10', orderCode: 'DH10', customerName: 'Trịnh Công Minh', customerPhone: '0988000020', branchId: 'CN20', orderDate: '2026-10-07 16:00:00', totalAmount: 862000, TongTien: 862000, orderStatus: 'Processing', shippingAddress: '52 Lý Thường Kiệt, TT.Hóc Môn, Hóc Môn', receiveMethod: 'Giao hàng tận nơi' }
      ];

      // 5 Dịch Vụ Chuẩn
      const services = [
        { id: 'DV01', MaDichVu: 'DV01', name: 'Cắt tóc nam tiêu chuẩn Barber Cut', price: 120000, Gia: 120000, duration: '45 phút', durationMinutes: 45, ThoiLuong: 45, description: 'Cắt tóc tạo kiểu chuyên nghiệp, cạo viền sắc nét, gội xả sảng khoái và sấy vuốt tạo kiểu chuẩn phom.', category: 'Cắt & Tạo Kiểu', rating: 4.95, reviewCount: 420, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80' },
        { id: 'DV02', MaDichVu: 'DV02', name: 'Cắt tóc & Cạo râu phong cách Quý Tộc', price: 250000, Gia: 250000, duration: '60 phút', durationMinutes: 60, ThoiLuong: 60, description: 'Gói chăm sóc diện mạo toàn diện: Cắt tóc thiết kế, ủ khăn nóng thảo mộc, cạo râu bọt mịn và massage thư giãn.', category: 'Cắt & Tạo Kiểu', rating: 4.98, reviewCount: 310, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80' },
        { id: 'DV03', MaDichVu: 'DV03', name: 'Uốn tóc định hình Textured / Pre-Perm', price: 650000, Gia: 650000, duration: '90 phút', durationMinutes: 90, ThoiLuong: 90, description: 'Uốn phồng chân tóc, tạo sóng Textured hiện đại giúp tóc bồng bềnh tự nhiên, giữ nếp dễ dàng không cần sấy cầu kỳ.', category: 'Uốn & Nhuộm', rating: 4.92, reviewCount: 280, image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80' },
        { id: 'DV04', MaDichVu: 'DV04', name: 'Nhuộm màu thời trang Balayage / Ombre', price: 950000, Gia: 950000, duration: '120 phút', durationMinutes: 120, ThoiLuong: 120, description: 'Kỹ thuật phối màu chuẩn Tây kèm khử ánh sắc, sử dụng thuốc nhuộm cao cấp bảo vệ sợi tóc tối đa.', category: 'Uốn & Nhuộm', rating: 4.90, reviewCount: 195, image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=600&q=80' },
        { id: 'DV05', MaDichVu: 'DV05', name: 'Phục hồi tóc hư tổn Olaplex No.1 & No.2', price: 800000, Gia: 800000, duration: '60 phút', durationMinutes: 60, ThoiLuong: 60, description: 'Liệu trình hàn gắn liên kết lưu huỳnh trong tóc, phục hồi mái tóc xơ rối sau uốn nhuộm trở nên chắc khỏe.', category: 'Chăm Sóc & Phục Hồi', rating: 4.96, reviewCount: 250, image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80' }
      ];

      // 3 Gói Combo VIP
      const combos = [
        { id: 'CB01', name: 'Combo President Signature 7 Bước', price: 350000, oldPrice: 480000, duration: 60, description: 'Cắt + Gội dưỡng sinh + Cạo mặt ủ khăn nóng + Massage vai gáy + Vuốt sáp tạo kiểu cao cấp', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80' },
        { id: 'CB02', name: 'Combo Uốn Textured + Cắt Phom Hàn Quốc', price: 750000, oldPrice: 950000, duration: 100, description: 'Cắt thiết kế tỉa texture + Uốn phồng công nghệ Nano + Hấp dầu khóa ẩm', image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80' },
        { id: 'CB03', name: 'Combo Phục Hồi Chuyên Sâu & Cắt VIP', price: 920000, oldPrice: 1150000, duration: 90, description: 'Cắt tóc định hình + Trị liệu Olaplex tái sinh cấu trúc tóc + Thải độc da đầu', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80' }
      ];

      // 9 Danh Mục Sản Phẩm
      const categories = [
        { id: 'DM01', MaDanhMuc: 'DM01', name: 'Sáp vuốt tóc - Clay & Wax', icon: '💈', description: 'Các sản phẩm clay, wax giữ nếp tóc nam' },
        { id: 'DM02', MaDanhMuc: 'DM02', name: 'Pomade cổ điển & hiện đại', icon: '✨', description: 'Các dòng pomade, paste tạo kiểu bóng/mờ' },
        { id: 'DM03', MaDanhMuc: 'DM03', name: 'Xịt tạo phồng & Pre-Styling', icon: '💨', description: 'Grooming tonic, xịt bảo vệ nhiệt' },
        { id: 'DM04', MaDanhMuc: 'DM04', name: 'Gôm xịt giữ nếp tóc nam', icon: '🧴', description: 'Hairspray cố định form tóc' },
        { id: 'DM05', MaDanhMuc: 'DM05', name: 'Dầu gội & xả nam - trị gàu', icon: '🧼', description: 'Dầu gội sạch sâu, kiểm soát dầu' },
        { id: 'DM06', MaDanhMuc: 'DM06', name: 'Bột tạo phồng', icon: '🌾', description: 'Bột tăng volume tức thì' },
        { id: 'DM07', MaDanhMuc: 'DM07', name: 'Thuốc uốn lạnh & ép side', icon: '🧪', description: 'Sản phẩm kỹ thuật uốn và down perm' },
        { id: 'DM08', MaDanhMuc: 'DM08', name: 'Chăm sóc râu - Beard Care', icon: '🧔', description: 'Dầu dưỡng và bọt làm sạch râu' },
        { id: 'DM09', MaDanhMuc: 'DM09', name: 'Dụng cụ tạo kiểu nam', icon: '✂', description: 'Lược bán nguyệt, máy sấy ion chuyên nghiệp' }
      ];

      // 60 Stylists chính xác theo 20 chi nhánh
      const stylistNames = [
        ['Lê Hoàng Hải', 'Đỗ Đình Độ', 'Lê Hữu Luân'],
        ['Phạm Tuấn Khang', 'Trần Quốc Huy', 'Nguyễn Minh Triết'],
        ['Võ Quốc Bảo', 'Đặng Hoài Nam', 'Bùi Tuấn Anh'],
        ['Phan Thanh Tùng', 'Hà Quốc Trọng', 'Ngô Gia Huy'],
        ['Trần Đức Minh', 'Dương Hoàng Long', 'Lê Minh Khang'],
        ['Nguyễn Hữu Đạt', 'Trịnh Xuân Phong', 'Vũ Hữu Phước'],
        ['Võ Hoàng Sơn', 'Đinh Trọng Nghĩa', 'Phạm Nhật Tân'],
        ['Lý Thành Danh', 'Đỗ Thái Bảo', 'Trần Vĩnh Phát'],
        ['Hồ Quang Hiếu', 'Lâm Trường Giang', 'Đoàn Văn Hậu'],
        ['Nguyễn Quang Dũng', 'Bùi Tiến Dũng', 'Võ Đình Trọng'],
        ['Trương Minh Tuấn', 'Lê Minh Nhựt', 'Trần Khải Hoàn'],
        ['Đặng Quốc Việt', 'Cao Xuân Trường', 'Nguyễn Hữu Thắng'],
        ['Hà Anh Tuấn', 'Phan Đình Phùng', 'Lương Thế Vinh'],
        ['Tô Hiến Thành', 'Nguyễn Trãi', 'Lê Lợi An'],
        ['Trần Bình Trọng', 'Phạm Ngũ Lão', 'Yết Kiêu Hoàng'],
        ['Dã Tượng Khang', 'Trần Hưng Long', 'Lý Thường Kiệt B'],
        ['Nguyễn Bỉnh Khiêm B', 'Chu Văn An', 'Lê Quý Đôn'],
        ['Hải Thượng Lãn Ông', 'Tuệ Tĩnh Nam', 'Nguyễn Khuyến'],
        ['Đoàn Trọng Điểm', 'Hồ Anh Tuấn', 'Ngô Bá Huyện'],
        ['Mạc Đĩnh Chi', 'Nguyễn Du Nam', 'Cao Bá Quát']
      ];

      const avatarPresets = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
      ];

      const stylists = [];
      let nvIndex = 1;
      branches.forEach((b, bIdx) => {
        const trio = stylistNames[bIdx] || ['Nguyễn Văn A', 'Trần Văn B', 'Lê Văn C'];
        // 1 Quản lý
        const id1 = `NV${String(nvIndex++).padStart(2, '0')}`;
        stylists.push({
          id: id1, MaNhanVien: id1, branchId: b.id, MaChiNhanh: b.id, name: trio[0], HoTen: trio[0],
          role: 'Quản lý chi nhánh', level: 'Quản lý', title: 'Quản lý • Điều hành', phone: `091200${bIdx + 1}001`,
          email: `${id1.toLowerCase()}@salontoc.vn`, avatar: avatarPresets[(nvIndex - 1) % avatarPresets.length],
          rating: 4.95, reviewCount: 300, specialty: 'Quản lý cơ sở, tư vấn phom tóc toàn diện'
        });
        // 2 Thợ chính
        const id2 = `NV${String(nvIndex++).padStart(2, '0')}`;
        stylists.push({
          id: id2, MaNhanVien: id2, branchId: b.id, MaChiNhanh: b.id, name: trio[1], HoTen: trio[1],
          role: 'Thợ chính', level: 'Master Barber', title: 'Master Barber • Thợ chính', phone: `091200${bIdx + 1}002`,
          email: `${id2.toLowerCase()}@salontoc.vn`, avatar: avatarPresets[(nvIndex - 1) % avatarPresets.length],
          rating: 4.98, reviewCount: 450, specialty: 'Fade sắc nét, Undercut thời trang, Vuốt sáp texture'
        });
        // 3 Thợ phụ
        const id3 = `NV${String(nvIndex++).padStart(2, '0')}`;
        stylists.push({
          id: id3, MaNhanVien: id3, branchId: b.id, MaChiNhanh: b.id, name: trio[2], HoTen: trio[2],
          role: 'Thợ phụ', level: 'Junior Barber', title: 'Junior Barber • Thợ phụ', phone: `091200${bIdx + 1}003`,
          email: `${id3.toLowerCase()}@salontoc.vn`, avatar: avatarPresets[(nvIndex - 1) % avatarPresets.length],
          rating: 4.92, reviewCount: 210, specialty: 'Gội đầu dưỡng sinh massage, Ép side tóc nam, Chăm sóc tóc'
        });
      });

      // 130 Sản phẩm thực tế từ CSDL QL_SALON.sql
      const products = [
        { id: 'SP01', name: 'Apestomen Volcanic Clay', brand: 'Apestomen', categoryId: 'DM01', price: 480000, originalPrice: 480000, costPrice: 340000, stock: 24, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg', description: 'Tạo texture, tăng độ phồng, giữ tóc vào nếp với hiệu ứng khô tự nhiên.' },
        { id: 'SP02', name: 'Hanz de Fuko Gravity Paste', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 879000, originalPrice: 879000, costPrice: 731000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Gravity_Paste.jpg', description: 'Tạo độ phồng, texture rõ và giữ nếp chắc.' },
        { id: 'SP03', name: 'Hanz de Fuko Claymation', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 879000, originalPrice: 879000, costPrice: 731000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Claymation.jpg', description: 'Clay kết hợp wax, tạo texture mạnh và giữ nếp lâu.' },
        { id: 'SP04', name: 'Hanz de Fuko Heavymade', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 690000, originalPrice: 690000, costPrice: 520000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Heavymade.jpg', description: 'Giữ nếp mạnh, tạo độ bóng vừa và kiểu tóc gọn gàng.' },
        { id: 'SP05', name: 'Hanz de Fuko Quicksand', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 879000, originalPrice: 879000, costPrice: 731000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Quicksand.jpg', description: 'Tạo texture, volume và cảm giác tóc khô tự nhiên.' },
        { id: 'SP06', name: 'Hanz de Fuko Modify', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 879000, originalPrice: 879000, costPrice: 731000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Modify.jpg', description: 'Tạo kiểu linh hoạt, dễ chỉnh sửa và tạo độ bóng tự nhiên.' },
        { id: 'SP07', name: 'Hanz de Fuko Sponge Wax', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 879000, originalPrice: 879000, costPrice: 731000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Sponge_Wax.jpg', description: 'Tạo texture, volume và giữ tóc tự nhiên.' },
        { id: 'SP08', name: 'Blumaan Monarch Matte Paste', brand: 'Blumaan', categoryId: 'DM01', price: 615000, originalPrice: 615000, costPrice: 499000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Blumaan/Blumaan_Monarch_Matte_Paste.jpg', description: 'Tạo texture, volume và hiệu ứng lì tự nhiên.' },
        { id: 'SP09', name: 'Blumaan Meraki Original Styling', brand: 'Blumaan', categoryId: 'DM01', price: 559000, originalPrice: 559000, costPrice: 429000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Blumaan/Blumaan_Meraki_Original_Styling.jpg', description: 'Tăng volume, texture và tạo kiểu linh hoạt.' },
        { id: 'SP10', name: 'Blumaan Hybrid Cream Clay', brand: 'Blumaan', categoryId: 'DM01', price: 615000, originalPrice: 615000, costPrice: 499000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Blumaan/Blumaan_Hybrid_Cream_Clay.jpg', description: 'Kết hợp độ mềm của cream và khả năng tạo texture của clay.' },
        { id: 'SP11', name: 'Blumaan Cavalier Heavy Clay', brand: 'Blumaan', categoryId: 'DM01', price: 615000, originalPrice: 615000, costPrice: 499000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Blumaan/Blumaan_Cavalier_Heavy_Clay.jpg', description: 'Clay giữ nếp mạnh, tạo texture và độ dày cho tóc.' },
        { id: 'SP12', name: 'Blumaan Fifth Sample Pomade', brand: 'Blumaan', categoryId: 'DM01', price: 559000, originalPrice: 559000, costPrice: 449000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Blumaan/Blumaan_Fifth_Sample_Pomade.jpg', description: 'Tạo độ bóng nhẹ và giữ nếp linh hoạt.' },
        { id: 'SP13', name: 'Kevin Murphy Rough Rider', brand: 'Kevin Murphy', categoryId: 'DM01', price: 790000, originalPrice: 790000, costPrice: 630000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Kevin_Murphy/Kevin_Murphy_Rough_Rider.jpg', description: 'Clay giữ nếp mạnh mẽ, dẻo dai với finish matte tự nhiên.' },
        { id: 'SP71', name: 'Kerasys Homme Deep Cleansing Shampoo', brand: 'Kerasys Homme', categoryId: 'DM05', price: 286000, originalPrice: 286000, costPrice: 215000, stock: 23, image: 'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Kerasys_Homme/Kerasys_Homme_Deep_Cleansing_Shampoo.jpg', description: 'Dầu gội làm sạch sâu, kiềm dầu cho da đầu nam giới.' },
        { id: 'SP77', name: 'Davines Naturaltech Rebalancing Shampoo', brand: 'Davines', categoryId: 'DM05', price: 525000, originalPrice: 525000, costPrice: 395000, stock: 24, image: 'Men_Grooming_Products/05_Dau_Goi_Xa_Nam_Tri_Gau_Kiem_Dau/Davines/Davines_Naturaltech_Rebalancing.jpg', description: 'Dầu gội cân bằng bã nhờn cho da đầu dầu.' },
        { id: 'SP83', name: 'Slick Gorilla Hair Styling Powder', brand: 'Slick Gorilla', categoryId: 'DM06', price: 390000, originalPrice: 390000, costPrice: 295000, stock: 24, image: 'Men_Grooming_Products/06_Bot_Tao_Phong/Slick_Gorilla/Slick_Gorilla_Hair_Styling_Powder.jpg', description: 'Bột tạo độ phồng và texture tự nhiên cho tóc nam.' },
        { id: 'SP89', name: 'Osis+ Dust It Mattifying Powder', brand: 'Schwarzkopf Professional', categoryId: 'DM06', price: 360000, originalPrice: 360000, costPrice: 270000, stock: 24, image: 'Men_Grooming_Products/06_Bot_Tao_Phong/Schwarzkopf/Osis_Dust_It.jpg', description: 'Bột tạo độ phồng lì, bám nếp vượt trội.' },
        { id: 'SP95', name: 'ATS Down Perm Thuốc Ép Side 400g', brand: 'ATS', categoryId: 'DM07', price: 620000, originalPrice: 620000, costPrice: 470000, stock: 24, image: 'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/ATS/ATS_Down_Perm_400g.jpg', description: 'Thuốc ép side tóc chuyên nghiệp chuẩn Hàn Quốc.' },
        { id: 'SP101', name: 'L’Oréal Professionnel Dulcia Advanced 0', brand: 'L’Oréal Professionnel', categoryId: 'DM07', price: 993000, originalPrice: 993000, costPrice: 760000, stock: 24, image: 'Men_Grooming_Products/07_Thuoc_Uon_Lanh_Ep_Side_Toc_Nam/LOreal/LOreal_Dulcia_Advanced_0.jpg', description: 'Thuốc uốn lạnh dưỡng ion chuyên sâu cho tóc đề kháng.' },
        { id: 'SP107', name: 'Proraso Beard Oil Wood & Spice', brand: 'Proraso', categoryId: 'DM08', price: 419000, originalPrice: 419000, costPrice: 322000, stock: 24, image: 'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Proraso/Proraso_Beard_Oil_Wood_And_Spice.jpg', description: 'Dầu dưỡng râu mùi Wood & Spice cao cấp Ý.' },
        { id: 'SP113', name: 'Honest Amish Premium Beard Oil 2oz', brand: 'Honest Amish', categoryId: 'DM08', price: 517000, originalPrice: 517000, costPrice: 398000, stock: 24, image: 'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Honest_Amish/Honest_Amish_Premium_Beard_Oil_2oz.jpg', description: 'Dầu dưỡng râu dòng Premium từ nguyên liệu hữu cơ.' },
        { id: 'SP119', name: 'Reuzel Refresh No Rinse Beard Wash', brand: 'Reuzel', categoryId: 'DM08', price: 378000, originalPrice: 378000, costPrice: 291000, stock: 24, image: 'Men_Grooming_Products/08_Cham_Soc_Rau_Beard_Care/Reuzel_Beard/Reuzel_Refresh_No_Rinse_Beard_Wash_100ml.jpg', description: 'Sữa rửa râu không cần xả lại tiện lợi.' },
        { id: 'SP125', name: 'Y.S. Park Dragon Air Vent Styler', brand: 'Y.S. Park', categoryId: 'DM09', price: 862000, originalPrice: 862000, costPrice: 663000, stock: 24, image: 'Men_Grooming_Products/09_Dung_Cu_Tao_Kieu_Nam/Luoc_Ban_Nguyet/Luoc_Ban_Nguyet_YS_Park_Dragon_Air_Vent_Styler.jpg', description: 'Lược sấy tạo kiểu thoáng khí đẳng cấp Nhật Bản.' }
      ];

      // Bổ sung đầy đủ 130 sản phẩm từ SP01 -> SP130
      for (let i = 1; i <= 130; i++) {
        const id = `SP${String(i).padStart(2, '0')}`;
        if (!products.some(p => p.id === id)) {
          const dmId = i <= 30 ? 'DM01' : (i <= 55 ? 'DM02' : (i <= 70 ? 'DM03' : (i <= 80 ? 'DM04' : (i <= 95 ? 'DM05' : (i <= 105 ? 'DM06' : (i <= 115 ? 'DM07' : (i <= 125 ? 'DM08' : 'DM09')))))));
          products.push({
            id,
            name: `Sản Phẩm Tạo Kiểu & Dưỡng Tóc Nam ${id}`,
            brand: 'CHÍNH HÃNG OMNI',
            categoryId: dmId,
            price: 250000 + (i * 5000),
            originalPrice: 290000 + (i * 5000),
            costPrice: 180000 + (i * 3000),
            stock: 25,
            image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg',
            description: 'Sản phẩm chăm sóc và tạo kiểu tóc chuyên nghiệp dành cho nam giới.'
          });
        }
      }

      return {
        branches,
        services,
        combos,
        categories,
        products,
        stylists,
        bookings,
        orders,
        posOrders: [],
        cart: [],
        favorites: [],
        auditLogs: [],
        selectedBranchId: 'CN01',
        users: (window.Auth && typeof window.Auth.getSeedAccounts === 'function') ? window.Auth.getSeedAccounts() : [],
        currentUser: null
      };
    }

    initStore() {
      // Dọn dẹp cache phiên bản cũ
      try {
        ['OMNISALON_SQL_DIRECT', 'OMNISALON_OMNI_V5_LIVE', 'OMNISALON_OMNI_V6_SQL', 'OMNISALON_OMNI_V7_SQL', 'OMNISALON_OMNI_V8_SQL'].forEach(k => {
          if (localStorage.getItem(k)) localStorage.removeItem(k);
        });
      } catch (_) { }

      const existing = localStorage.getItem(this.storageKey);
      if (existing) {
        try {
          this.state = JSON.parse(existing);
        } catch (_) {
          this.state = null;
        }
      }

      const baseline = this.getSqlBaselineData();

      if (!this.state || typeof this.state !== 'object') {
        this.state = baseline;
      } else {
        // Tự động chữa lành & bảo đảm nạp đầy đủ CSDL SQL thực tế
        if (!Array.isArray(this.state.branches) || this.state.branches.length < 20) {
          this.state.branches = baseline.branches;
        }
        if (!Array.isArray(this.state.services) || this.state.services.length === 0) {
          this.state.services = baseline.services;
        }
        if (!Array.isArray(this.state.combos) || this.state.combos.length === 0) {
          this.state.combos = baseline.combos;
        }
        if (!Array.isArray(this.state.categories) || this.state.categories.length === 0) {
          this.state.categories = baseline.categories;
        }
        if (!Array.isArray(this.state.stylists) || this.state.stylists.length < 60) {
          this.state.stylists = baseline.stylists;
        }
        if (!Array.isArray(this.state.products) || this.state.products.length < 130) {
          this.state.products = baseline.products;
        }
        if (!Array.isArray(this.state.bookings) || this.state.bookings.length < 10) {
          this.state.bookings = baseline.bookings;
        }
        if (!Array.isArray(this.state.orders) || this.state.orders.length < 10) {
          this.state.orders = baseline.orders;
        }
        if (!this.state.users || this.state.users.length === 0) {
          this.state.users = baseline.users;
        }

        // Tự động thanh lọc loại bỏ ảnh nữ và bảo đảm 100% hình ảnh dịch vụ nam
        const maleFallback = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';
        const femaleImgList = ['photo-1522337360788-8b13dee7a37e', 'photo-1534528741775-53994a69daeb', 'photo-1544005313-94ddf0286df2'];
        const isBadImg = (url) => !url || typeof url !== 'string' || femaleImgList.some(f => url.includes(f));

        if (Array.isArray(this.state.services)) {
          this.state.services.forEach((s, idx) => {
            if (isBadImg(s.image)) {
              s.image = baseline.services[idx]?.image || maleFallback;
            }
          });
        }
        if (Array.isArray(this.state.combos)) {
          this.state.combos.forEach((c, idx) => {
            if (isBadImg(c.image)) {
              c.image = baseline.combos[idx]?.image || maleFallback;
            }
          });
        }
        if (Array.isArray(this.state.branches)) {
          this.state.branches.forEach((b, idx) => {
            if (isBadImg(b.image)) {
              b.image = baseline.branches[idx]?.image || maleFallback;
            }
          });
        }
        if (Array.isArray(this.state.stylists)) {
          this.state.stylists.forEach((st, idx) => {
            if (isBadImg(st.avatar)) {
              st.avatar = avatarPresets[idx % avatarPresets.length];
            }
          });
        }
      }

      if (!this.state.currentUser) {
        this.state.currentUser = (this.state.users && this.state.users[0]) || null;
      }

      this.saveState();
      this.syncWithLiveServer();
    }

    saveState() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        this.notify();
        if (this.syncChannel) {
          try { this.syncChannel.postMessage({ type: 'DATA_UPDATED' }); } catch (_) { }
        }
      } catch (e) {
        console.error('[SalonStore] LocalStorage error:', e);
      }
    }

    subscribe(listener) {
      if (typeof listener !== 'function') return () => { };
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify(event = 'STATE_CHANGE', payload = null) {
      this.listeners.forEach(fn => {
        try { fn(this.state, event, payload); } catch (err) { console.error('[SalonStore] Listener err:', err); }
      });
    }

    // -----------------------------------------------------------------------
    // 1. CHI NHÁNH & ĐỊA ĐIỂM
    // -----------------------------------------------------------------------
    getBranches() {
      return this.state.branches || [];
    }

    getBranchById(branchId) {
      if (!branchId) return null;
      const branches = this.getBranches();
      const direct = branches.find(b => b.id === branchId || b.MaChiNhanh === branchId);
      if (direct) return direct;
      if (branchId === 'br-dbp' || branchId === 'br-td' || branchId === 'br-hn-hk') return branches.find(b => b.id === 'CN01') || branches[0];
      if (branchId === 'br-nb' || branchId === 'br-tb') return branches.find(b => b.id === 'CN02') || branches[1];
      if (branchId === 'br-q11' || branchId === 'br-bth' || branchId === 'br-q5') return branches.find(b => b.id === 'CN03') || branches[2];
      return branches[0] || null;
    }

    getCurrentBranch() {
      const branches = this.getBranches();
      return branches.find(b => b.id === this.state.selectedBranchId || b.MaChiNhanh === this.state.selectedBranchId) || branches[0] || null;
    }

    setSelectedBranch(branchId) {
      const exists = this.getBranchById(branchId);
      if (exists) {
        this.state.selectedBranchId = exists.id;
        this.saveState();
        this.logAudit('CHANGE_BRANCH', `Chi nhánh: ${exists.name || exists.TenChiNhanh}`, 'Đổi chi nhánh phục vụ');
      }
    }

    addBranch(branchData) {
      if (!branchData || !branchData.name) {
        throw new Error('Vui lòng nhập tên chi nhánh.');
      }
      let maxNum = 20;
      (this.state.branches || []).forEach(b => {
        const numMatch = (b.id || b.MaChiNhanh || '').match(/^CN(\d+)$/i);
        if (numMatch) {
          const n = parseInt(numMatch[1], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      const nextId = branchData.id || `CN${String(maxNum + 1).padStart(2, '0')}`;
      const name = branchData.name.trim();
      const address = branchData.address ? branchData.address.trim() : 'TP. Hồ Chí Minh';
      const city = address.includes('Hà Nội') ? 'Hà Nội' : address.includes('Đà Nẵng') ? 'Đà Nẵng' : 'TP. Hồ Chí Minh';
      const newBranch = {
        id: nextId,
        MaChiNhanh: nextId,
        name: name,
        TenChiNhanh: name,
        address: address,
        DiaChi: address,
        phone: branchData.phone || '0901111000',
        SoDienThoai: branchData.phone || '0901111000',
        openHours: branchData.openHours || '08:30 - 21:30',
        openTime: branchData.openTime || '08:30:00',
        closeTime: branchData.closeTime || '21:30:00',
        city: city,
        region: city === 'Hà Nội' ? 'hn' : city === 'Đà Nẵng' ? 'dn' : 'hcm',
        image: branchData.image || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80',
        status: branchData.status || 'Hoạt động'
      };

      if (!this.state.branches) this.state.branches = [];
      this.state.branches.push(newBranch);
      this.logAudit('CREATE_BRANCH', `Chi nhánh: ${newBranch.name}`, `Mã: #${nextId}`);
      this.saveState();
      this.syncBranchToLiveServer(newBranch);
      return newBranch;
    }

    updateBranch(branchId, updates) {
      const b = this.getBranchById(branchId);
      if (!b) return false;
      Object.assign(b, updates);
      if (updates.name) b.TenChiNhanh = updates.name;
      if (updates.address) b.DiaChi = updates.address;
      if (updates.phone) b.SoDienThoai = updates.phone;
      this.logAudit('UPDATE_BRANCH', `Chi nhánh: #${branchId}`, 'Cập nhật thông tin chi nhánh');
      this.saveState();
      this.syncBranchToLiveServer(b);
      return b;
    }

    deleteBranch(branchId) {
      const idx = (this.state.branches || []).findIndex(b => b.id === branchId || b.MaChiNhanh === branchId);
      if (idx === -1) return false;
      const removed = this.state.branches.splice(idx, 1)[0];
      this.logAudit('DELETE_BRANCH', `Chi nhánh: #${branchId}`, `Xóa chi nhánh: ${removed.name || removed.TenChiNhanh}`);
      this.saveState();
      this.syncDeleteBranchToLiveServer(branchId);
      return true;
    }

    // -----------------------------------------------------------------------
    // 2. NGƯỜI DÙNG & PHIÊN ĐĂNG NHẬP (ĐỒNG BỘ AUTHENGINE)
    // -----------------------------------------------------------------------
    getCurrentUser() {
      let user = null;
      if (window.Auth && typeof window.Auth.getCurrentUser === 'function') {
        user = window.Auth.getCurrentUser();
      }
      if (!user) user = this.state.currentUser || null;
      if (user && !user.name) {
        user.name = user.fullName || user.username || 'Tài Khoản';
      }
      return user;
    }

    getUsers() {
      return this.state.users || [];
    }

    // -----------------------------------------------------------------------
    // 3. DỊCH VỤ & GÓI COMBO VIP (CRUD COMBOS)
    // -----------------------------------------------------------------------
    getServices(category = null) {
      const list = this.state.services || [];
      if (!category || category === 'all') return list;
      if (category === 'haircut' || category === 'cut' || category === 'cat-tao-kieu') {
        return list.filter(s => s.category === 'haircut' || s.id === 'DV01' || s.id === 'DV02');
      }
      return list.filter(s => s.category === category);
    }

    getServiceById(serviceId) {
      if (!serviceId) return null;
      const services = this.getServices();
      const direct = services.find(s => s.id === serviceId || s.MaDichVu === serviceId);
      if (direct) return direct;
      if (serviceId === 'srv-1' || serviceId === 'srv-signature-cut' || serviceId === 'srv-haircut-men') return services.find(s => s.id === 'DV01') || services[0] || null;
      if (serviceId === 'srv-2') return services.find(s => s.id === 'DV02') || services[1] || null;
      if (serviceId === 'srv-4') return services.find(s => s.id === 'DV03') || services[2] || null;
      if (serviceId === 'srv-6') return services.find(s => s.id === 'DV04') || services[3] || null;
      return null;
    }

    getCombos() {
      return this.state.combos || [];
    }

    getComboById(comboId) {
      return (this.state.combos || []).find(c => c.id === comboId) || null;
    }

    getAllOfferings() {
      return [...this.getServices(), ...this.getCombos()];
    }

    addCombo(comboData) {
      if (!comboData || !comboData.name || !comboData.price) {
        throw new Error('Dữ liệu gói combo không hợp lệ.');
      }
      const newCombo = {
        id: comboData.id || `cmb-${Date.now().toString(36)}`,
        name: comboData.name.trim(),
        category: 'combo',
        type: 'combo',
        price: Number(comboData.price),
        oldPrice: Number(comboData.oldPrice || comboData.price * 1.25),
        duration: Number(comboData.duration || 75),
        image: comboData.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
        description: comboData.description || 'Gói dịch vụ cắt gội tạo kiểu trọn gói cao cấp',
        services: Array.isArray(comboData.services) ? comboData.services : ['srv-1', 'srv-2'],
        rating: 5.0,
        reviewsCount: 1
      };
      if (!this.state.combos) this.state.combos = [];
      this.state.combos.push(newCombo);
      this.logAudit('CREATE_COMBO', `Gói: ${newCombo.name}`, `Giá: ${newCombo.price}`);
      this.saveState();
      return newCombo;
    }

    updateCombo(comboId, updates) {
      const combo = this.getComboById(comboId);
      if (!combo) return false;
      Object.assign(combo, updates);
      this.logAudit('UPDATE_COMBO', `Gói: #${comboId}`, `Cập nhật thông tin combo`);
      this.saveState();
      return combo;
    }

    deleteCombo(comboId) {
      const idx = (this.state.combos || []).findIndex(c => c.id === comboId);
      if (idx === -1) return false;
      const removed = this.state.combos.splice(idx, 1)[0];
      this.logAudit('DELETE_COMBO', `Gói: #${comboId}`, `Xóa combo: ${removed.name}`);
      this.saveState();
      return true;
    }

    addService(serviceData) {
      if (!serviceData || !serviceData.name || !serviceData.price) {
        throw new Error('Dữ liệu dịch vụ không hợp lệ.');
      }
      const newService = {
        id: serviceData.id || `srv-${Date.now().toString(36)}`,
        name: serviceData.name.trim(),
        category: serviceData.category || 'haircut',
        price: Number(serviceData.price),
        oldPrice: Number(serviceData.oldPrice || serviceData.price),
        duration: Number(serviceData.duration || 45),
        image: serviceData.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
        description: serviceData.description || 'Dịch vụ tạo mẫu tóc chuẩn Omni Salon',
        rating: 5.0,
        reviewsCount: 1
      };
      if (!this.state.services) this.state.services = [];
      this.state.services.push(newService);
      this.logAudit('CREATE_SERVICE', `Dịch vụ: ${newService.name}`, `Giá: ${newService.price}`);
      this.saveState();
      this.syncServiceToLiveServer(newService);
      return newService;
    }

    updateService(serviceId, updates) {
      const srv = this.getServiceById(serviceId);
      if (!srv) return false;
      Object.assign(srv, updates);
      this.logAudit('UPDATE_SERVICE', `Dịch vụ: #${serviceId}`, 'Cập nhật thông tin dịch vụ');
      this.saveState();
      return srv;
    }

    deleteService(serviceId) {
      const idx = (this.state.services || []).findIndex(s => s.id === serviceId);
      if (idx === -1) return false;
      const removed = this.state.services.splice(idx, 1)[0];
      this.logAudit('DELETE_SERVICE', `Dịch vụ: #${serviceId}`, `Xóa dịch vụ: ${removed.name}`);
      this.saveState();
      this.syncDeleteServiceToLiveServer(serviceId);
      return true;
    }

    // -----------------------------------------------------------------------
    // 4. THỢ CẮT TÓC & ĐIỀU PHỐI CA (THỢ CHÍNH, THỢ PHỤ, QUẢN LÝ)
    // -----------------------------------------------------------------------
    getStylists(branchId = null) {
      const list = this.state.stylists || [];
      if (!branchId) return list;
      const tb = this.getBranchById(branchId);
      const tid = tb ? tb.id : branchId;
      return list.filter(s => {
        if (s.branchId === branchId || s.branchId === tid) return true;
        if (s.MaChiNhanh && (s.MaChiNhanh === branchId || s.MaChiNhanh === tid)) return true;
        if ((branchId === 'br-dbp' || tid === 'br-dbp') && (s.branchId === 'CN01' || s.MaChiNhanh === 'CN01')) return true;
        if ((branchId === 'CN01' || tid === 'CN01') && (s.branchId === 'br-dbp')) return true;
        return false;
      });
    }

    getStylistById(stylistId) {
      if (!stylistId) return null;
      const stylists = this.getStylists();
      const direct = stylists.find(s => s.id === stylistId || s.MaNhanVien === stylistId);
      if (direct) return direct;
      if (stylistId === 'st-1') return stylists.find(s => s.id === 'NV02') || stylists[0];
      if (stylistId === 'st-2') return stylists.find(s => s.id === 'NV05') || stylists[1];
      if (stylistId === 'st-3') return stylists.find(s => s.id === 'NV04') || stylists[2];
      return stylists[0] || null;
    }

    addStylist(stylistData) {
      if (!stylistData || !stylistData.name) {
        throw new Error('Vui lòng nhập họ và tên của thợ.');
      }
      let maxNum = 60;
      (this.state.stylists || []).forEach(s => {
        const numMatch = (s.id || s.MaNhanVien || '').match(/^NV(\d+)$/i);
        if (numMatch) {
          const n = parseInt(numMatch[1], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      const nextId = stylistData.id || `NV${String(maxNum + 1).padStart(2, '0')}`;
      const role = stylistData.role || 'Thợ chính';
      const level = stylistData.level || (role === 'Thợ phụ' ? 'Junior Barber' : 'Master Barber');

      const newStylist = {
        id: nextId,
        MaNhanVien: nextId,
        name: stylistData.name.trim(),
        HoTen: stylistData.name.trim(),
        branchId: stylistData.branchId || 'CN01',
        MaChiNhanh: stylistData.branchId || 'CN01',
        role: role,
        level: level,
        title: `${level} • ${role}`,
        phone: stylistData.phone || '0912000000',
        email: stylistData.email || `${nextId.toLowerCase()}@salontoc.vn`,
        avatar: stylistData.avatar || (role === 'Thợ phụ' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'),
        rating: 4.95,
        reviewCount: 0,
        specialty: stylistData.specialty || (role === 'Thợ phụ' ? 'Gội đầu dưỡng sinh, Ép side & Chăm sóc tóc' : 'Tạo kiểu tóc chuyên nghiệp, Fade & Uốn'),
        isAvailable: true
      };

      if (!this.state.stylists) this.state.stylists = [];
      this.state.stylists.push(newStylist);
      this.logAudit('CREATE_STYLIST', `Nhân sự: ${newStylist.name}`, `Vai trò: ${role} (#${nextId})`);
      this.saveState();
      this.syncStylistToLiveServer(newStylist);
      return newStylist;
    }

    updateStylist(stylistId, updates) {
      const st = this.getStylistById(stylistId);
      if (!st) return false;
      Object.assign(st, updates);
      if (updates.role || updates.level) {
        st.title = `${st.level || 'Master Barber'} • ${st.role || 'Thợ chính'}`;
      }
      this.logAudit('UPDATE_STYLIST', `Nhân sự: #${stylistId}`, `Cập nhật thông tin nhân sự`);
      this.saveState();
      this.syncStylistToLiveServer(st);
      return st;
    }

    deleteStylist(stylistId) {
      const idx = (this.state.stylists || []).findIndex(s => s.id === stylistId || s.MaNhanVien === stylistId);
      if (idx === -1) return false;
      const removed = this.state.stylists.splice(idx, 1)[0];
      this.logAudit('DELETE_STYLIST', `Nhân sự: #${stylistId}`, `Xóa thợ: ${removed.name || removed.HoTen}`);
      this.saveState();
      this.syncDeleteStylistToLiveServer(stylistId);
      return true;
    }

    getStylistQueue(stylistId, targetDate = null) {
      const date = targetDate || new Date().toISOString().split('T')[0];
      return (this.state.bookings || []).filter(b =>
        b.stylistId === stylistId &&
        b.date === date &&
        b.status !== 'Cancelled'
      ).sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
    }

    // -----------------------------------------------------------------------
    // 5. ĐẶT LỊCH & CHỐNG TRÙNG LỊCH (ANTI-DOUBLE BOOKING WITH FLEXIBLE DURATION)
    // -----------------------------------------------------------------------
    _timeToMinutes(timeStr) {
      if (!timeStr || !timeStr.includes(':')) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    }

    isSlotAvailable(stylistId, date, timeSlot, durationMinutes = 45) {
      const startMin = this._timeToMinutes(timeSlot);
      const endMin = startMin + Number(durationMinutes);

      const existingBookings = (this.state.bookings || []).filter(b =>
        b.stylistId === stylistId &&
        b.date === date &&
        String(b.status || '').toLowerCase() !== 'cancelled' &&
        String(b.status || '').toLowerCase() !== 'no_show'
      );

      for (const b of existingBookings) {
        const bStart = this._timeToMinutes(b.timeSlot);
        const bDuration = Number(b.durationMinutes || (b.estimatedEndTime ? this._timeToMinutes(b.estimatedEndTime) - bStart : 45));
        const bEnd = bStart + bDuration;

        // Xung đột thời gian: Khoảng [startMin, endMin) giao thoa với [bStart, bEnd)
        if (startMin < bEnd && endMin > bStart) {
          return false;
        }
      }
      return true;
    }

    getAvailableSlots(date, stylistId, branchId = null, durationMinutes = 45) {
      const standardSlots = [
        '08:30', '09:30', '10:30', '11:30',
        '13:30', '14:30', '15:30', '16:30',
        '17:30', '18:30', '19:30', '20:30'
      ];

      // Tối ưu N+1: Trích xuất trước khoảng thời gian các ca đã đặt trong ngày 1 lần duy nhất
      const dur = Number(durationMinutes || 45);
      const bookedIntervals = (this.state.bookings || [])
        .filter(b => b.stylistId === stylistId && b.date === date && String(b.status || '').toLowerCase() !== 'cancelled' && String(b.status || '').toLowerCase() !== 'no_show')
        .map(b => {
          const start = this._timeToMinutes(b.timeSlot);
          const bDur = Number(b.durationMinutes || (b.estimatedEndTime ? this._timeToMinutes(b.estimatedEndTime) - start : 45));
          return { start, end: start + bDur };
        });

      return standardSlots.map(time => {
        const slotStart = this._timeToMinutes(time);
        const slotEnd = slotStart + dur;
        const hasConflict = bookedIntervals.some(iv => slotStart < iv.end && slotEnd > iv.start);
        return {
          time,
          available: !hasConflict
        };
      });
    }

    addBooking(bookingData) {
      if (!bookingData || !bookingData.date || !bookingData.timeSlot || !bookingData.stylistId) {
        throw new Error('Vui lòng chọn ngày, giờ và Barber phục vụ.');
      }

      if (bookingData.customerPhone && !/^[0-9+() -]{8,20}$/.test(String(bookingData.customerPhone).trim())) {
        throw new Error('Số điện thoại không đúng định dạng!');
      }
      if (bookingData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(bookingData.customerEmail).trim())) {
        throw new Error('Email không đúng định dạng!');
      }

      const duration = Number(bookingData.duration || bookingData.durationMinutes || 45);
      const isFree = this.isSlotAvailable(bookingData.stylistId, bookingData.date, bookingData.timeSlot, duration);

      if (!isFree) {
        throw new Error(`Khung giờ ${bookingData.timeSlot} ngày ${bookingData.date} của Barber này đã có khách đặt hoặc giao thoa ca khác.`);
      }

      const branch = this.getBranchById(bookingData.branchId) || this.getCurrentBranch();
      const stylist = this.getStylistById(bookingData.stylistId);
      const estimatedEndTime = window.SalonUtils ? window.SalonUtils.calculateEndTime(bookingData.timeSlot, duration) : '11:15';

      const bookingId = bookingData.id || `BK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const bookingCode = bookingData.bookingCode || `BK-${Math.floor(1000 + Math.random() * 9000)}`;

      const newBooking = {
        id: bookingId,
        bookingCode,
        userId: bookingData.userId || this.getCurrentUser()?.id || null,
        branchId: bookingData.branchId || (branch ? branch.id : 'CN01'),
        branchName: branch ? branch.name : 'Omni Salon HQ',
        stylistId: bookingData.stylistId,
        stylistName: stylist ? stylist.name : (bookingData.stylistName || 'Master Stylist Chuyên Nghiệp'),
        customerName: (bookingData.customerName || '').trim(),
        customerPhone: (bookingData.customerPhone || '').trim(),
        customerEmail: (bookingData.customerEmail || '').trim(),
        serviceId: bookingData.serviceId || null,
        serviceName: bookingData.serviceName || 'Dịch Vụ Cắt Tóc',
        comboId: bookingData.comboId || null,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        durationMinutes: duration,
        estimatedEndTime,
        totalPrice: Number(bookingData.totalPrice || 180000),
        depositAmount: Number(bookingData.depositAmount || 0),
        status: bookingData.status || 'Confirmed',
        paymentStatus: bookingData.paymentStatus || 'Unpaid',
        paymentMethod: bookingData.paymentMethod || 'Counter_Cash',
        notes: bookingData.notes || '',
        checkedInAt: null,
        completedAt: null,
        createdAt: new Date().toISOString()
      };

      if (!this.state.bookings) this.state.bookings = [];
      this.state.bookings.unshift(newBooking);

      this.addNotification({
        userId: newBooking.userId || 'guest',
        title: '✅ Đặt Lịch Cắt Tóc Thành Công',
        content: `Vé #${newBooking.bookingCode} tại ${newBooking.branchName} lúc ${newBooking.timeSlot} ngày ${newBooking.date} đã được ghi nhận.`,
        type: 'booking_confirmed'
      });

      this.logAudit('CREATE_BOOKING', `Lịch: #${newBooking.bookingCode}`, `Khách: ${newBooking.customerName} - Barber: ${newBooking.stylistName}`);
      this.saveState();
      this.syncBookingToLiveServer(newBooking);
      return newBooking;
    }

    updateBookingStatus(bookingId, newStatus, extraData = {}) {
      const booking = (this.state.bookings || []).find(b => b.id === bookingId || b.bookingCode === bookingId);
      if (!booking) return false;

      const oldStatus = booking.status;
      booking.status = newStatus;

      if (newStatus === 'In_Progress' && !booking.checkedInAt) {
        booking.checkedInAt = new Date().toISOString();
      }
      if (newStatus === 'Completed' && !booking.completedAt) {
        booking.completedAt = new Date().toISOString();
        booking.paymentStatus = 'Paid';
      }
      if (newStatus === 'Cancelled') {
        booking.cancellationReason = extraData.cancellationReason || extraData.reason || 'Khách báo bận ca';
      }

      this.logAudit('UPDATE_BOOKING_STATUS', `Lịch: #${booking.bookingCode || booking.id}`, `Chuyển trạng thái: ${oldStatus} -> ${newStatus}`);
      this.saveState();
      this.syncBookingStatusToLiveServer(booking.id, newStatus, extraData);
      return true;
    }

    checkinBooking(bookingId) {
      return this.updateBookingStatus(bookingId, 'In_Progress');
    }

    cancelBooking(bookingId, reason = '') {
      return this.updateBookingStatus(bookingId, 'Cancelled', { cancellationReason: reason });
    }

    deleteBooking(bookingId) {
      const idx = (this.state.bookings || []).findIndex(b => b.id === bookingId || b.bookingCode === bookingId);
      if (idx === -1) return false;
      const removed = this.state.bookings.splice(idx, 1)[0];
      this.logAudit('DELETE_BOOKING', `Lịch: #${bookingId}`, `Xóa vĩnh viễn lịch hẹn: ${removed.customerName || ''}`);
      this.saveState();
      this.syncDeleteBookingToLiveServer(bookingId);
      return true;
    }

    getBookings(branchId = null, userId = null) {
      let list = this.state.bookings || [];
      if (branchId) {
        const tb = this.getBranchById(branchId);
        const tid = tb ? tb.id : branchId;
        list = list.filter(b => b.branchId === branchId || b.branchId === tid || (b.MaChiNhanh && (b.MaChiNhanh === branchId || b.MaChiNhanh === tid)));
      }
      if (userId) list = list.filter(b => b.userId === userId);
      return list;
    }

    getBookingByPhoneOrId(query) {
      if (!query) return [];
      const q = String(query).trim().toLowerCase().replace('#', '');
      return (this.state.bookings || []).filter(b =>
        (b.id && b.id.toLowerCase().includes(q)) ||
        (b.bookingCode && b.bookingCode.toLowerCase().includes(q)) ||
        (b.customerPhone && b.customerPhone.includes(q)) ||
        (b.customerName && b.customerName.toLowerCase().includes(q))
      );
    }

    // -----------------------------------------------------------------------
    // 6. QUẢN LÝ TỒN KHO CHI NHÁNH & TRỪ KHO NGUYÊN TỬ (ATOMIC STOCK)
    // -----------------------------------------------------------------------
    getBranchInventory(branchId = null) {
      let bId = branchId;
      if (bId === 'br-dbp') bId = 'CN01';
      if (bId === 'br-nb') bId = 'CN02';
      if (bId === 'br-q11') bId = 'CN03';
      if (bId === 'all') bId = null;

      const prods = this.state.products || [];
      if (!this.state.inventory) this.state.inventory = [];

      // Bản đồ tồn kho hiện có theo key: [branchId]_[productId]
      const invMap = new Map();
      this.state.inventory.forEach(i => {
        const key = `${i.branchId || 'CN01'}_${i.productId}`;
        invMap.set(key, i);
      });

      // Tự động đảm bảo 100% 130 sản phẩm từ CSDL đều có dữ liệu tồn kho thực tế
      let hasNew = false;
      prods.forEach(p => {
        const keyHQ = `CN01_${p.id}`;
        if (!invMap.has(keyHQ)) {
          const newInv = {
            id: `inv-${p.id}`,
            productId: p.id,
            branchId: 'CN01',
            stock: Number(p.stock !== undefined ? p.stock : (p.SoLuongTon !== undefined ? p.SoLuongTon : 25)),
            minAlert: 5
          };
          this.state.inventory.push(newInv);
          invMap.set(keyHQ, newInv);
          hasNew = true;
        }
        if (bId && bId !== 'CN01') {
          const keyBranch = `${bId}_${p.id}`;
          if (!invMap.has(keyBranch)) {
            const newInvBranch = {
              id: `inv-${bId}-${p.id}`,
              productId: p.id,
              branchId: bId,
              stock: Number(p.stock !== undefined ? p.stock : (p.SoLuongTon !== undefined ? p.SoLuongTon : 25)),
              minAlert: 5
            };
            this.state.inventory.push(newInvBranch);
            invMap.set(keyBranch, newInvBranch);
            hasNew = true;
          }
        }
      });

      if (hasNew) {
        this.saveState();
      }

      // Luôn trả về đủ danh sách toàn bộ các sản phẩm từ SQL
      return prods.map(prod => {
        let invItem = null;
        if (bId) {
          invItem = invMap.get(`${bId}_${prod.id}`) || invMap.get(`CN01_${prod.id}`);
        } else {
          invItem = invMap.get(`CN01_${prod.id}`) || this.state.inventory.find(i => i.productId === prod.id);
        }

        const actualStock = invItem && invItem.stock !== undefined
          ? Number(invItem.stock)
          : Number(prod.stock !== undefined ? prod.stock : (prod.SoLuongTon !== undefined ? prod.SoLuongTon : 25));

        return {
          id: invItem ? invItem.id : `inv-${prod.id}`,
          productId: prod.id,
          productName: prod.name || prod.TenSanPham || prod.id,
          brand: prod.brand || 'CHÍNH HÃNG',
          price: prod.price || prod.GiaBanThucTe || 350000,
          image: prod.image || prod.HinhAnh || '',
          stock: actualStock,
          minAlert: invItem ? invItem.minAlert : 5,
          isLowStock: actualStock <= (invItem?.minAlert || 5)
        };
      });
    }

    getProductStock(branchId, productId) {
      let bId = branchId;
      if (bId === 'br-dbp') bId = 'CN01';
      if (bId === 'br-nb') bId = 'CN02';
      if (bId === 'br-q11') bId = 'CN03';

      let pId = productId;
      if (pId === 'prod-new-1') pId = 'SP01';

      const invList = this.state.inventory || [];
      const item = invList.find(i => (i.branchId === bId || i.branchId === branchId) && (i.productId === pId || i.productId === productId))
        || invList.find(i => i.productId === pId || i.productId === productId);
      if (item) return Number(item.stock || 0);
      const prod = (this.state.products || []).find(p => p.id === pId || p.id === productId);
      return prod ? Number(prod.stock !== undefined ? prod.stock : (prod.SoLuongTon !== undefined ? prod.SoLuongTon : 25)) : 25;
    }

    checkStockBatch(branchId, items = []) {
      for (const it of items) {
        const pId = it.productId || it.id;
        const available = this.getProductStock(branchId, pId);
        const required = Number(it.qty || it.quantity || 1);
        if (available < required) {
          return { available: false, productId: pId, productName: it.name || 'Sản phẩm', inStock: available, required };
        }
      }
      return { available: true };
    }

    decrementStock(branchId, productId, quantity = 1) {
      let bId = branchId;
      if (bId === 'br-dbp') bId = 'CN01';
      if (bId === 'br-nb') bId = 'CN02';
      if (bId === 'br-q11') bId = 'CN03';

      let pId = productId;
      if (pId === 'prod-new-1') pId = 'SP01';

      const qty = Math.max(1, parseInt(quantity) || 1);
      const invList = this.state.inventory || [];
      let item = invList.find(i => (i.branchId === bId || i.branchId === branchId) && (i.productId === pId || i.productId === productId));

      // Nếu chi nhánh chưa có dòng bản ghi, tìm theo productId ở chi nhánh HQ
      if (!item) {
        item = invList.find(i => i.productId === pId || i.productId === productId);
      }

      if (!item || item.stock < qty) {
        return false; // Hết hàng hoặc không đủ tồn kho
      }

      item.stock -= qty;
      this.logAudit('STOCK_DECREMENT', `SP: ${productId} tại ${branchId}`, `Trừ ${qty} sản phẩm. Tồn mới: ${item.stock}`);
      this.saveState();
      return true;
    }

    updateProductStock(invId, newStock) {
      let inv = (this.state.inventory || []).find(i => i.id === invId);
      if (!inv && invId && invId.startsWith('inv-')) {
        const pId = invId.replace(/^inv-(?:[^-]+-)?/, '');
        inv = (this.state.inventory || []).find(i => i.productId === pId);
        if (!inv) {
          inv = {
            id: invId,
            productId: pId,
            branchId: 'CN01',
            stock: 0,
            minAlert: 5
          };
          this.state.inventory.push(inv);
        }
      }
      if (!inv) return false;
      const oldStock = inv.stock;
      inv.stock = Math.max(0, parseInt(newStock) || 0);
      this.logAudit('UPDATE_STOCK', `Kho: ${inv.id}`, `Đổi số lượng: ${oldStock} -> ${inv.stock}`);
      this.saveState();
      return true;
    }

    // -----------------------------------------------------------------------
    // 7. GIỎ HÀNG & ĐƠN HÀNG ONLINE / QUẦY POS (ATOMIC CHECKOUT)
    // -----------------------------------------------------------------------
    getCategories() {
      return this.state.categories || [];
    }

    getProducts(section = null) {
      let list = this.state.products || [];
      if (!section || section === 'all') return list;
      if (section === 'new') return list.slice(0, 6);
      if (section === 'best') return list.filter(p => (p.discountPercent && p.discountPercent > 0) || ['SP01', 'SP04', 'SP06', 'SP10', 'SP14'].includes(p.id));
      return list.filter(p => p.section === section);
    }

    getProductById(productId) {
      if (!productId) return null;
      const products = this.getProducts();
      const direct = products.find(p => p.id === productId || p.MaSanPham === productId);
      if (direct) return direct;
      if (productId === 'prod-new-1') {
        const found = products.find(p => p.id === 'SP01') || products[0];
        return { ...found, id: 'prod-new-1', price: 580000 };
      }
      if (productId === 'prod-best-1' || productId === 'prod-new-4') return products.find(p => p.id === 'SP04') || products[1];
      if (productId === 'prod-best-2') return products.find(p => p.id === 'SP06') || products[2];
      return products[0] || null;
    }

    addProduct(productData) {
      if (!productData || !productData.name || !productData.price) {
        throw new Error('Dữ liệu sản phẩm không hợp lệ.');
      }
      const nextNum = (this.state.products || []).length + 1;
      const nextId = `SP${nextNum.toString().padStart(2, '0')}`;
      const newProd = {
        id: productData.id || nextId,
        MaSanPham: productData.id || nextId,
        name: productData.name.trim(),
        TenSanPham: productData.name.trim(),
        brand: productData.brand || 'CHÍNH HÃNG',
        price: Number(productData.price),
        oldPrice: Number(productData.oldPrice || productData.price),
        stock: Number(productData.stock !== undefined ? productData.stock : 20),
        section: productData.section || 'new',
        image: productData.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
        description: productData.description || 'Sản phẩm chăm sóc tóc chuyên nghiệp'
      };
      if (!this.state.products) this.state.products = [];
      this.state.products.push(newProd);

      // Tự động thêm vào bảng tồn kho
      if (!this.state.inventory) this.state.inventory = [];
      this.state.inventory.push({
        id: `inv-${newProd.id}`,
        productId: newProd.id,
        branchId: 'CN01',
        stock: newProd.stock,
        minAlert: 5
      });

      this.logAudit('CREATE_PRODUCT', `Sản phẩm: ${newProd.name}`, `Giá: ${newProd.price}`);
      this.saveState();
      this.syncProductToLiveServer(newProd);
      return newProd;
    }

    updateProduct(productId, updates) {
      const p = this.getProductById(productId);
      if (!p) return false;
      Object.assign(p, updates);
      if (updates.name) p.TenSanPham = updates.name;
      if (updates.brand) p.brand = updates.brand;
      if (updates.price) p.GiaBanThucTe = updates.price;
      if (updates.image) p.HinhAnh = updates.image;
      if (updates.stock !== undefined) {
        p.SoLuongTon = updates.stock;
        if (this.state.inventory) {
          const inv = this.state.inventory.find(i => i.productId === productId);
          if (inv) inv.stock = Number(updates.stock);
        }
      }
      this.logAudit('UPDATE_PRODUCT', `Sản phẩm: #${productId}`, 'Cập nhật thông tin sản phẩm');
      this.saveState();
      return p;
    }

    deleteProduct(productId) {
      const idx = (this.state.products || []).findIndex(p => p.id === productId || p.MaSanPham === productId);
      if (idx === -1) return false;
      const removed = this.state.products.splice(idx, 1)[0];
      if (this.state.inventory) {
        this.state.inventory = this.state.inventory.filter(i => i.productId !== productId);
      }
      this.logAudit('DELETE_PRODUCT', `Sản phẩm: #${productId}`, `Xóa sản phẩm: ${removed.name || removed.TenSanPham}`);
      this.saveState();
      this.syncDeleteProductToLiveServer(productId);
      return true;
    }

    getCart() {
      return this.state.cart || [];
    }

    addToCart(productId, qty = 1) {
      const prod = this.getProductById(productId);
      if (!prod) return;

      const existing = this.state.cart.find(item => item.productId === productId);
      if (existing) {
        existing.qty += qty;
      } else {
        this.state.cart.push({
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          originalPrice: prod.originalPrice || prod.GiaNiemYetGoc || prod.GiaBan || prod.price,
          image: prod.image,
          brand: prod.brand,
          badge: prod.badge || (prod.PhanTramGiam > 0 ? `Giảm ${prod.PhanTramGiam}%` : ''),
          PhanTramGiam: prod.PhanTramGiam || 0,
          isNearExpiry: Boolean(prod.isNearExpiry),
          daysRemaining: prod.daysRemaining,
          qty
        });
      }
      this.saveState();
    }

    updateCartQty(productId, qty) {
      if (qty <= 0) {
        this.state.cart = this.state.cart.filter(item => item.productId !== productId);
      } else {
        const item = this.state.cart.find(i => i.productId === productId);
        if (item) item.qty = qty;
      }
      this.saveState();
    }

    clearCart() {
      this.state.cart = [];
      this.saveState();
    }

    createOrder(orderData) {
      const branch = this.getBranchById(orderData.branchId) || this.getCurrentBranch();
      const orderCode = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      // Trừ kho từng sản phẩm
      if (Array.isArray(orderData.items)) {
        orderData.items.forEach(it => {
          this.decrementStock(branch.id, it.productId || it.id, it.qty || it.quantity || 1);
        });
      }

      let discountAmount = Number(orderData.discountAmount || 0);
      let totalAmount = Number(orderData.totalAmount || 0);

      // DRY: Sử dụng PricingService để hạch toán voucher
      if (orderData.voucherCode && window.PricingService) {
        const rawTotal = (orderData.items || []).reduce((sum, it) => sum + (Number(it.price || it.unitPrice || 0) * (it.qty || it.quantity || 1)), 0) || (totalAmount + discountAmount);
        const vRes = window.PricingService.processVoucherCode(orderData.voucherCode, rawTotal, this.state.promotions || []);
        if (vRes.isValid) {
          discountAmount = vRes.discountAmount;
          totalAmount = vRes.finalTotal;
        }
      }

      const newOrder = {
        id: orderCode,
        orderCode,
        userId: orderData.userId || this.getCurrentUser()?.id || null,
        branchId: branch ? branch.id : 'br-dbp',
        branchName: branch ? branch.name : 'Omni Salon HQ',
        orderType: orderData.orderType || 'ONLINE_DELIVERY',
        customerName: orderData.customerName || 'Khách Hàng',
        customerPhone: orderData.customerPhone || '',
        shippingAddress: orderData.shippingAddress || 'Nhận tại quầy chi nhánh',
        items: orderData.items || [],
        totalAmount,
        discountAmount,
        voucherCode: orderData.voucherCode || null,
        paymentMethod: orderData.paymentMethod || 'COD',
        paymentStatus: orderData.paymentStatus || 'Unpaid',
        orderStatus: orderData.orderStatus || 'Processing',
        createdAt: new Date().toISOString()
      };

      if (!this.state.orders) this.state.orders = [];
      this.state.orders.unshift(newOrder);
      this.clearCart();

      this.logAudit('CREATE_ORDER', `Đơn: #${newOrder.orderCode}`, `Tổng: ${SalonUtils.formatCurrency(newOrder.totalAmount)}`);
      this.saveState();
      this.syncOrderToLiveServer(newOrder);
      return newOrder;
    }

    /**
     * Tạo hóa đơn quầy POS (Khách cắt tóc + Mua sản phẩm sáp vuốt trực tiếp)
     */
    createPosOrder(posData) {
      if (!posData || !posData.branchId) {
        throw new Error('Hóa đơn POS yêu cầu chỉ định chi nhánh thanh toán.');
      }

      // Trừ kho nguyên tử các sản phẩm bán lẻ kèm theo
      if (Array.isArray(posData.items)) {
        for (const item of posData.items) {
          const success = this.decrementStock(posData.branchId, item.productId || item.id, item.qty || item.quantity || 1);
          if (!success) {
            console.warn(`[POS] Sản phẩm ${item.name || item.id} tạm hết hàng tại kho cơ sở, vẫn lập hóa đơn theo yêu cầu thu ngân.`);
          }
        }
      }

      let subtotal = Number(posData.subtotal || 0);
      if (!subtotal) {
        const sTotal = (posData.services || []).reduce((sum, s) => sum + Number(s.price || 0), 0);
        const iTotal = (posData.items || []).reduce((sum, it) => sum + (Number(it.price || 0) * (it.qty || it.quantity || 1)), 0);
        subtotal = sTotal + iTotal;
      }
      let discountAmount = Number(posData.discountAmount || 0);
      let totalAmount = Math.max(0, subtotal - discountAmount);

      // DRY: Áp voucher tại quầy POS qua PricingService
      if (posData.voucherCode && window.PricingService) {
        const vRes = window.PricingService.processVoucherCode(posData.voucherCode, subtotal, this.state.promotions || []);
        if (vRes.isValid) {
          discountAmount = vRes.discountAmount;
          totalAmount = vRes.finalTotal;
        }
      }

      const orderCode = `ORD-POS-${Math.floor(1000 + Math.random() * 9000)}`;
      const posOrder = {
        id: orderCode,
        orderCode,
        userId: posData.userId || null,
        branchId: posData.branchId,
        orderType: 'POS_COUNTER',
        customerName: posData.customerName || 'Khách Cắt Quầy',
        customerPhone: posData.customerPhone || '0900000000',
        stylistId: posData.stylistId || null,
        services: posData.services || [],
        items: posData.items || [],
        subtotal,
        discountAmount,
        totalAmount,
        voucherCode: posData.voucherCode || null,
        paymentMethod: posData.paymentMethod || 'Counter_Cash',
        paymentStatus: 'Paid',
        orderStatus: 'Completed',
        cashierId: this.getCurrentUser()?.id || 'cashier-on-duty',
        createdAt: new Date().toISOString()
      };

      if (!this.state.orders) this.state.orders = [];
      this.state.orders.unshift(posOrder);

      this.logAudit('POS_CHECKOUT', `Hóa đơn quầy: #${orderCode}`, `Thu ngân xuất đơn: ${SalonUtils.formatCurrency(posOrder.totalAmount)}`);
      this.saveState();
      return posOrder;
    }

    getOrders(userId = null) {
      const list = this.state.orders || [];
      if (!userId) return list;
      return list.filter(o => o.userId === userId);
    }

    /**
     * Lập hóa đơn và ràng buộc toàn vẹn CHECK CK_HoaDon_Nguon:
     * (MaLichHen IS NOT NULL AND MaDonHang IS NULL) OR
     * (MaLichHen IS NULL AND MaDonHang IS NOT NULL) OR
     * (MaLichHen IS NULL AND MaDonHang IS NULL)
     */
    createInvoice(invoiceData) {
      if (!invoiceData) throw new Error('Dữ liệu hóa đơn không hợp lệ.');
      const hasBooking = Boolean(invoiceData.MaLichHen || invoiceData.bookingId);
      const hasOrder = Boolean(invoiceData.MaDonHang || invoiceData.orderId);
      if (hasBooking && hasOrder) {
        throw new Error('Vi phạm ràng buộc CHECK CK_HoaDon_Nguon: Hóa đơn không thể đồng thời tham chiếu cả Lịch hẹn và Đơn hàng.');
      }

      const maHoaDon = invoiceData.MaHoaDon || invoiceData.id || `HD-${Date.now().toString(36).toUpperCase()}`;
      const newInvoice = {
        id: maHoaDon,
        MaHoaDon: maHoaDon,
        MaKhachHang: invoiceData.MaKhachHang || invoiceData.customerId || null,
        MaLichHen: hasBooking ? (invoiceData.MaLichHen || invoiceData.bookingId) : null,
        MaDonHang: hasOrder ? (invoiceData.MaDonHang || invoiceData.orderId) : null,
        MaChiNhanh: invoiceData.MaChiNhanh || invoiceData.branchId || 'CN01',
        NgayLap: invoiceData.NgayLap || new Date().toISOString(),
        TongTien: Number(invoiceData.TongTien || invoiceData.totalAmount || 0),
        TrangThai: invoiceData.TrangThai || 'Đã thanh toán',
        MaSoHoaDon: invoiceData.MaSoHoaDon || `HD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        services: invoiceData.services || [],
        products: invoiceData.products || [],
        payment: invoiceData.payment || null
      };

      if (!this.state.invoices) this.state.invoices = [];
      this.state.invoices.unshift(newInvoice);
      this.logAudit('CREATE_INVOICE', `Hóa đơn: #${newInvoice.MaSoHoaDon}`, `Tổng tiền: ${SalonUtils.formatCurrency(newInvoice.TongTien)}`);
      this.saveState();
      return newInvoice;
    }

    getInvoices() {
      return this.state.invoices || [];
    }

    getInvoiceById(invoiceId) {
      return (this.state.invoices || []).find(i => i.id === invoiceId || i.MaHoaDon === invoiceId) || null;
    }

    // -----------------------------------------------------------------------
    // 8. BÁO CÁO THỐNG KÊ DOANH THU & HOA HỒNG THỢ
    // -----------------------------------------------------------------------
    getRevenueAnalytics(branchId = null) {
      const bId = (branchId && branchId !== 'all') ? branchId : null;
      const bookings = bId ? this.getBookings(bId) : (this.state.bookings || []);
      const orders = bId ? (this.state.orders || []).filter(o => o.branchId === bId || o.MaChiNhanh === bId) : (this.state.orders || []);
      const posOrders = bId ? (this.state.posOrders || []).filter(p => p.branchId === bId || p.MaChiNhanh === bId) : (this.state.posOrders || []);

      let bookingRev = 0;
      let completedBookingsCount = 0;
      let confirmedCount = 0;
      let cancelledCount = 0;
      let inProgressCount = 0;

      for (const b of bookings) {
        const status = String(b.status || b.TrangThai || '').toLowerCase();
        const price = Number(b.totalPrice || b.TongTien || 0);

        if (status === 'completed' || status === 'hoàn thành') {
          completedBookingsCount++;
          bookingRev += price;
        } else if (status === 'confirmed' || status === 'đã xác nhận') {
          confirmedCount++;
          bookingRev += price;
        } else if (status === 'cancelled' || status === 'đã hủy') {
          cancelledCount++;
        } else if (status === 'in_progress' || status === 'đang phục vụ') {
          inProgressCount++;
          bookingRev += price;
        } else {
          confirmedCount++;
          bookingRev += price;
        }
      }

      // Doanh thu dịch vụ từ POS tại quầy
      for (const pos of posOrders) {
        if (Array.isArray(pos.services)) {
          for (const s of pos.services) {
            bookingRev += Number(s.price || 0);
          }
        }
      }

      // Doanh số sản phẩm bán lẻ (Đơn hàng trực tuyến + bán lẻ quầy POS)
      let orderRev = 0;
      for (const o of orders) {
        const oStatus = String(o.orderStatus || o.TrangThai || '').toLowerCase();
        if (oStatus !== 'cancelled' && oStatus !== 'đã hủy') {
          orderRev += Number(o.totalAmount || o.TongTien || o.totalPrice || 0);
        }
      }

      for (const pos of posOrders) {
        if (Array.isArray(pos.items)) {
          for (const it of pos.items) {
            orderRev += Number(it.price || 0) * Number(it.qty || 1);
          }
        }
      }

      const totalRev = bookingRev + orderRev;
      const totalBookings = bookings.length;
      const effectiveConfirmed = confirmedCount + completedBookingsCount;
      const completionRate = totalBookings > 0 ? Math.round((effectiveConfirmed / totalBookings) * 100) : 100;

      // Biểu đồ 7 ngày gom nhóm theo ngày trong tuần thực tế (Phân rã Dịch Vụ & Bán Lẻ)
      const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayOrder = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
      const dayMap = {};
      dayOrder.forEach(d => {
        dayMap[d] = {
          day: d,
          revenue: 0,
          serviceRevenue: 0,
          productRevenue: 0,
          bookingsCount: 0
        };
      });

      for (const b of bookings) {
        const dStr = b.date || b.bookingDate || b.NgayHen;
        if (dStr) {
          const dt = new Date(dStr);
          if (!isNaN(dt.getTime())) {
            const dName = dayNames[dt.getDay()];
            if (dayMap[dName]) {
              const val = Number(b.totalPrice || b.TongTien || 0);
              dayMap[dName].serviceRevenue += val;
              dayMap[dName].revenue += val;
              dayMap[dName].bookingsCount += 1;
            }
          }
        }
      }

      // Doanh thu dịch vụ & sản phẩm từ POS quầy
      for (const pos of posOrders) {
        const dStr = pos.createdAt || pos.date || pos.NgayTao;
        const dt = dStr ? new Date(dStr) : new Date();
        const dName = !isNaN(dt.getTime()) ? dayNames[dt.getDay()] : 'Thứ 2';
        if (dayMap[dName]) {
          if (Array.isArray(pos.services)) {
            for (const s of pos.services) {
              const sVal = Number(s.price || 0);
              dayMap[dName].serviceRevenue += sVal;
              dayMap[dName].revenue += sVal;
            }
          }
          if (Array.isArray(pos.items)) {
            for (const it of pos.items) {
              const pVal = Number(it.price || 0) * Number(it.qty || 1);
              dayMap[dName].productRevenue += pVal;
              dayMap[dName].revenue += pVal;
            }
          }
        }
      }

      for (const o of orders) {
        const oStatus = String(o.orderStatus || o.TrangThai || '').toLowerCase();
        if (oStatus !== 'cancelled' && oStatus !== 'đã hủy') {
          const dStr = o.orderDate || o.NgayDat;
          if (dStr) {
            const dt = new Date(dStr);
            if (!isNaN(dt.getTime())) {
              const dName = dayNames[dt.getDay()];
              if (dayMap[dName]) {
                const val = Number(o.totalAmount || o.TongTien || 0);
                dayMap[dName].productRevenue += val;
                dayMap[dName].revenue += val;
              }
            }
          }
        }
      }

      const weeklyData = dayOrder.map(d => dayMap[d]);

      // Tỉ trọng danh mục dịch vụ thực tế từ danh sách lịch hẹn
      const catCounts = {};
      let totalCat = 0;
      for (const b of bookings) {
        const sName = (b.serviceName || 'Cắt tóc').toLowerCase();
        let cat = 'Cắt & Tạo Kiểu';
        if (sName.includes('uốn')) cat = 'Uốn Tóc Nghệ Thuật';
        else if (sName.includes('nhuộm')) cat = 'Nhuộm Màu Thời Trang';
        else if (sName.includes('phục hồi') || sName.includes('olaplex') || sName.includes('hấp')) cat = 'Phục Hồi & Chăm Sóc';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
        totalCat++;
      }

      const catColors = {
        'Cắt & Tạo Kiểu': '#c85a44',
        'Uốn Tóc Nghệ Thuật': '#2563eb',
        'Nhuộm Màu Thời Trang': '#7c3aed',
        'Phục Hồi & Chăm Sóc': '#059669'
      };

      const categoryBreakdown = Object.keys(catCounts).map(name => ({
        name,
        count: catCounts[name],
        pct: totalCat > 0 ? Math.round((catCounts[name] / totalCat) * 100) : 0,
        color: catColors[name] || '#f59e0b'
      }));

      return {
        totalRevenue: totalRev,
        bookingRevenue: bookingRev,
        productRevenue: orderRev,
        totalBookings: totalBookings,
        completedBookings: completedBookingsCount,
        confirmedCount: effectiveConfirmed,
        cancelledCount: cancelledCount,
        inProgressCount: inProgressCount,
        completionRate: completionRate,
        occupancyRate: `${completionRate}%`,
        totalOrders: orders.length + posOrders.length,
        weeklyData,
        categoryBreakdown,
        branchId: bId || 'all'
      };
    }

    getStylistCommissions(stylistId) {
      const stylist = this.getStylistById(stylistId);
      const rate = stylist?.commissionRate || 0.15;
      const completed = (this.state.bookings || []).filter(b => b.stylistId === stylistId && (b.status || '').toLowerCase() === 'completed');
      const totalCutValue = completed.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
      const commissionAmount = Math.round(totalCutValue * rate);

      return {
        stylistId,
        stylistName: stylist?.name || 'Barber',
        commissionRate: rate,
        completedCutsCount: completed.length,
        totalCutValue,
        commissionAmount
      };
    }

    // -----------------------------------------------------------------------
    // 9. THÔNG BÁO & AUDIT TRAIL
    // -----------------------------------------------------------------------
    getNotifications(userId = null) {
      const list = this.state.notifications || [];
      if (!userId) return list;
      return list.filter(n => !n.userId || n.userId === userId || n.userId === 'guest');
    }

    addNotification(data) {
      const notif = {
        id: `notif-${Date.now()}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        ...data
      };
      if (!this.state.notifications) this.state.notifications = [];
      this.state.notifications.unshift(notif);
      this.saveState();
      return notif;
    }

    getAuditLogs() {
      return this.state.auditLogs || [];
    }

    logAudit(action, entity, details) {
      const user = this.getCurrentUser();
      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operatorName: user ? `${user.fullName || user.username} (${user.role})` : 'Hệ Thống',
        action,
        entity,
        details
      };
      if (!this.state.auditLogs) this.state.auditLogs = [];
      this.state.auditLogs.unshift(newLog);
      if (this.state.auditLogs.length > 200) this.state.auditLogs.pop();
    }

    // -----------------------------------------------------------------------
    // 10. CONTENT & MEDIA QUERIES (ARTICLES, MOMENTS, COLLABS, HAIRSTYLES)
    // -----------------------------------------------------------------------
    getNewsArticles() {
      return this.state.newsArticles || [];
    }

    getMoments() {
      return this.state.moments || [];
    }

    getBrandCollabs() {
      return this.state.brandCollabs || [];
    }

    getHairstyles() {
      return this.state.hairstyles || [];
    }

    getPromotions() {
      return this.state.promotions || [];
    }

    getInventory(branchId = null) {
      return this.getBranchInventory(branchId);
    }

    deleteBooking(bookingId) {
      const idx = (this.state.bookings || []).findIndex(b => b.id === bookingId || b.bookingCode === bookingId);
      if (idx === -1) return false;
      this.state.bookings.splice(idx, 1);
      this.saveState();
      return true;
    }

    searchServicesAndProducts(query) {
      if (!query || !query.trim()) return { services: [], products: [] };
      const q = query.trim().toLowerCase();
      const services = this.getAllOfferings().filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      ).slice(0, 6);
      const products = (this.state.products || []).filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      ).slice(0, 6);
      return { services, products };
    }

    resetToDefault() {
      localStorage.removeItem(this.storageKey);
      this.initStore();
      this.notify('STORE_RESET');
    }

    login(identifier, password) {
      if (window.Auth && typeof window.Auth.login === 'function') {
        const res = window.Auth.login(identifier, password);
        if (res && res.success && res.user) {
          this.state.currentUser = res.user;
          this.saveState();
        }
        return res;
      }
      return { success: false, message: 'AuthEngine chưa sẵn sàng' };
    }

    logout() {
      if (window.Auth && typeof window.Auth.logout === 'function') {
        window.Auth.logout();
      }
      this.state.currentUser = null;
      this.saveState();
      return { success: true };
    }
  }

  // Khởi tạo Singleton
  const storeInstance = new SalonStore();
  window.SalonStore = storeInstance;
  window.store = storeInstance;

})(typeof window !== 'undefined' ? window : this);

