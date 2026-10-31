// =========================================================================
// OmniSalon / Omni Salon — CORE REACTIVE STORE MODULE
// Phiên bản: 2.2.0 Clean Architecture 
//, State Engine, Quản lý Combos, Tồn kho Chi Nhánh, Anti-Double Booking, POS
// =========================================================================

(function (window) {
  'use strict';

  class SalonStore {
    constructor() {
      this.storageKey = 'OMNISALON_SQL_DIRECT_V13';
      this.listeners = [];
      this.liveServerUrl = (typeof window !== 'undefined' && window.location.origin && (window.location.origin.startsWith('http://') || window.location.origin.startsWith('https://')))
        ? `${window.location.origin}/api`
        : 'http://127.0.0.1:3000/api';
      this.initStore();
      this.initLiveSync();
    }

    initLiveSync() {
      // Kênh BroadcastChannel đồng bộ tức thì giữa các tab Web PC và Web Mobile
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

      // Tự động đồng bộ Live Server SQL định kỳ 2 giây 1 lần
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

        // Đồng bộ Chi Nhánh từ SQL
        if (Array.isArray(db.branches) && db.branches.length > 0) {
          if (!this.state.branches || JSON.stringify(this.state.branches) !== JSON.stringify(db.branches)) {
            this.state.branches = db.branches;
            changed = true;
          }
        }

        // Đồng bộ Sản Phẩm từ SQL
        if (Array.isArray(db.products) && db.products.length > 0) {
          if (!this.state.products || JSON.stringify(this.state.products) !== JSON.stringify(db.products)) {
            this.state.products = db.products;
            changed = true;
          }
        }

        // Đồng bộ Danh Mục Sản Phẩm từ SQL
        if (Array.isArray(db.categories) && db.categories.length > 0) {
          if (!this.state.categories || JSON.stringify(this.state.categories) !== JSON.stringify(db.categories)) {
            this.state.categories = db.categories;
            changed = true;
          }
        }

        // Đồng bộ Dịch Vụ từ SQL
        if (Array.isArray(db.services) && db.services.length > 0) {
          if (!this.state.services || JSON.stringify(this.state.services) !== JSON.stringify(db.services)) {
            this.state.services = db.services;
            changed = true;
          }
        }

        // Đồng bộ Nhân Viên / Stylists từ SQL
        if (Array.isArray(db.stylists) && db.stylists.length > 0) {
          if (!this.state.stylists || JSON.stringify(this.state.stylists) !== JSON.stringify(db.stylists)) {
            this.state.stylists = db.stylists;
            changed = true;
          }
        }

        // Đồng bộ danh sách đặt lịch từ SQL
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

        // Đồng bộ danh sách đơn hàng từ SQL
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

        // Đồng bộ Combos từ SQL
        if (Array.isArray(db.combos) && db.combos.length > 0) {
          if (!this.state.combos || JSON.stringify(this.state.combos) !== JSON.stringify(db.combos)) {
            this.state.combos = db.combos;
            changed = true;
          }
        }

        // Đồng bộ Tài khoản Người dùng từ SQL
        if (Array.isArray(db.users) && db.users.length > 0) {
          if (!this.state.users || JSON.stringify(this.state.users) !== JSON.stringify(db.users)) {
            this.state.users = db.users;
            changed = true;
          }
        }

        // Đồng bộ Khuyến mãi & Đánh giá từ SQL
        if (Array.isArray(db.promotions) && db.promotions.length > 0) {
          if (!this.state.promotions || JSON.stringify(this.state.promotions) !== JSON.stringify(db.promotions)) {
            this.state.promotions = db.promotions;
            changed = true;
          }
        }
        if (Array.isArray(db.reviews) && db.reviews.length > 0) {
          if (!this.state.reviews || JSON.stringify(this.state.reviews) !== JSON.stringify(db.reviews)) {
            this.state.reviews = db.reviews;
            changed = true;
          }
        }

        // Đồng bộ Nhà Cung Cấp từ SQL, NhaCungCap
        if (Array.isArray(db.suppliers) && db.suppliers.length > 0) {
          if (!this.state.suppliers || JSON.stringify(this.state.suppliers) !== JSON.stringify(db.suppliers)) {
            this.state.suppliers = db.suppliers;
            changed = true;
          }
        }

        // Đồng bộ Quy Tắc Giảm Giá Cận Hạn từ SQL, QuyTacGiamGiaTheoHan
        if (Array.isArray(db.discountRules) && db.discountRules.length > 0) {
          if (!this.state.discountRules || JSON.stringify(this.state.discountRules) !== JSON.stringify(db.discountRules)) {
            this.state.discountRules = db.discountRules;
            changed = true;
          }
        }

        // Đồng bộ Phiếu Nhập Kho từ SQL, PhieuNhapKho & ChiTietPhieuNhap
        if (Array.isArray(db.receipts)) {
          if (!this.state.receipts || JSON.stringify(this.state.receipts) !== JSON.stringify(db.receipts)) {
            this.state.receipts = db.receipts;
            changed = true;
          }
        }

        // Đồng bộ Hóa Đơn & Thanh Toán từ SQL, HoaDon, ThanhToan
        if (Array.isArray(db.invoices)) {
          if (!this.state.invoices || JSON.stringify(this.state.invoices) !== JSON.stringify(db.invoices)) {
            this.state.invoices = db.invoices;
            changed = true;
          }
        }
        if (Array.isArray(db.payments)) {
          if (!this.state.payments || JSON.stringify(this.state.payments) !== JSON.stringify(db.payments)) {
            this.state.payments = db.payments;
            changed = true;
          }
        }

        // Đồng bộ Lô Hàng FEFO, vw_GiaBanTheoLoHienTai & Cảnh Báo Tồn Thấp, vw_SanPhamCanhBaoTonThap
        if (Array.isArray(db.fefoLots)) {
          if (!this.state.fefoLots || JSON.stringify(this.state.fefoLots) !== JSON.stringify(db.fefoLots)) {
            this.state.fefoLots = db.fefoLots;
            changed = true;
          }
        }
        if (Array.isArray(db.lowStockWarnings)) {
          if (!this.state.lowStockWarnings || JSON.stringify(this.state.lowStockWarnings) !== JSON.stringify(db.lowStockWarnings)) {
            this.state.lowStockWarnings = db.lowStockWarnings;
            changed = true;
          }
        }

        // Đồng bộ Thông Báo & Ca Làm Việc từ SQL, ThongBao, CaLamViec, TonKho
        if (Array.isArray(db.notifications)) {
          if (!this.state.notifications || JSON.stringify(this.state.notifications) !== JSON.stringify(db.notifications)) {
            this.state.notifications = db.notifications;
            changed = true;
          }
        }
        if (Array.isArray(db.shifts)) {
          if (!this.state.shifts || JSON.stringify(this.state.shifts) !== JSON.stringify(db.shifts)) {
            this.state.shifts = db.shifts;
            changed = true;
          }
        }
        if (Array.isArray(db.inventory)) {
          if (!this.state.inventory || JSON.stringify(this.state.inventory) !== JSON.stringify(db.inventory)) {
            this.state.inventory = db.inventory;
            changed = true;
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
        const res = await fetch(`${this.liveServerUrl}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking)
        });
        if (res && res.ok) {
          const data = await res.json();
          if (data && data.booking && data.booking.id) {
            booking.id = data.booking.id;
            booking.MaLichHen = data.booking.id;
            booking.bookingCode = data.booking.id;
            this.saveState();
          }
        }
      } catch (_) { }
    }

    async syncOrderToLiveServer(order) {
      if (typeof fetch === 'undefined') return { success: true };
      try {
        const res = await fetch(`${this.liveServerUrl}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { success: false, error: data.error || 'Lỗi khi gửi đơn hàng tới máy chủ!' };
        }
        if (data && data.order && data.order.id) {
          order.id = data.order.id;
          order.orderCode = data.order.id;
          order.MaDonHang = data.order.id;
          this.saveState();
        }
        return { success: true, order: data.order || order };
      } catch (err) {
        return { success: true };
      }
    }

    async syncCancelOrderToLiveServer(orderId, reason) {
      if (typeof fetch === 'undefined') return { success: true };
      try {
        const cleanId = String(orderId || '').replace(/^#+/, '').trim();
        const res = await fetch(`${this.liveServerUrl}/orders/${encodeURIComponent(cleanId)}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
        return await res.json().catch(() => ({ success: true }));
      } catch (_) {
        return { success: true };
      }
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

    async syncStylistToLiveServer(stylist, isUpdate = false) {
      if (typeof fetch === 'undefined') return { success: true };
      try {
        const id = stylist.id || stylist.MaNhanVien;
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate ? `${this.liveServerUrl}/stylists/${id}` : `${this.liveServerUrl}/stylists`;
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stylist)
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const serverId = data?.id || data?.MaNhanVien || data?.stylist?.id;
          if (serverId && serverId !== stylist.id) {
            stylist.id = serverId;
            stylist.MaNhanVien = serverId;
            this.saveState();
          }
          return { success: true, data };
        }
        return { success: false };
      } catch (err) {
        return { success: false, error: err };
      }
    }

    async syncDeleteStylistToLiveServer(stylistId) {
      if (typeof fetch === 'undefined') return { success: true };
      try {
        const res = await fetch(`${this.liveServerUrl}/stylists/${stylistId}`, {
          method: 'DELETE'
        });
        return await res.json().catch(() => ({ success: true }));
      } catch (err) {
        return { success: false, error: err };
      }
    }

    async syncServiceToLiveServer(service) {
      if (typeof fetch === 'undefined') return;
      try {
        const res = await fetch(`${this.liveServerUrl}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(service)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.service && data.service.id) {
            service.id = data.service.id;
            service.MaDichVu = data.service.id;
            this.saveState();
          }
        }
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
      if (typeof fetch === 'undefined') return { success: true };
      try {
        const res = await fetch(`${this.liveServerUrl}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data && data.product && data.product.id) {
            product.id = data.product.id;
            product.MaSanPham = data.product.id;
            if (data.product.brand) product.brand = data.product.brand;
            this.saveState();
          }
          return { success: true, data };
        }
        return { success: false };
      } catch (err) {
        return { success: false, error: err };
      }
    }

    async syncUpdateProductToLiveServer(productId, updates) {
      if (typeof fetch === 'undefined') return { success: true };
      try {
        const res = await fetch(`${this.liveServerUrl}/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        return await res.json().catch(() => ({ success: true }));
      } catch (err) {
        return { success: false, error: err };
      }
    }

    async syncDeleteProductToLiveServer(productId) {
      if (typeof fetch === 'undefined') return { success: true };
      try {
        const res = await fetch(`${this.liveServerUrl}/products/${productId}`, {
          method: 'DELETE'
        });
        return await res.json().catch(() => ({ success: true }));
      } catch (err) {
        return { success: false, error: err };
      }
    }

    async syncReceiptToLiveServer(receipt) {
      if (typeof fetch === 'undefined') return { success: true };
      try {
        const res = await fetch(`${this.liveServerUrl}/inventory/receipts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(receipt)
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          return { success: true, data };
        }
        return { success: false };
      } catch (err) {
        return { success: false, error: err };
      }
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

    async syncPosCheckoutToLiveServer(posOrder) {
      if (typeof fetch === 'undefined') return;
      try {
        const payload = {
          customerId: posOrder.userId || null,
          customerName: posOrder.customerName,
          customerPhone: posOrder.customerPhone,
          branchId: posOrder.branchId || 'CN01',
          staffId: posOrder.stylistId || posOrder.cashierId || 'NV61',
          total: posOrder.totalAmount,
          paymentMethod: posOrder.paymentMethod || 'Tiền mặt',
          services: posOrder.services || [],
          products: posOrder.items || []
        };
        const res = await fetch(`${this.liveServerUrl}/pos/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.invoice && data.invoice.id) {
            posOrder.id = data.invoice.id;
            posOrder.orderCode = data.invoice.id;
            posOrder.invoiceNo = data.invoice.invoiceNo || data.invoice.id;
            posOrder.paymentId = data.invoice.paymentId;
            this.createInvoice({
              id: data.invoice.id,
              MaHoaDon: data.invoice.id,
              customerId: posOrder.userId,
              branchId: posOrder.branchId,
              totalAmount: posOrder.totalAmount,
              TrangThai: 'Đã thanh toán',
              MaSoHoaDon: data.invoice.invoiceNo,
              services: posOrder.services,
              products: posOrder.items
            });
            this.saveState();
          }
        }
      } catch (_) { }
    }


    getSqlBaselineData() {
      // 20 Chi Nhánh chính thức từ CSDL QL_SALON.sql
      const branches = [
        { id: 'CN01', MaChiNhanh: 'CN01', name: 'Omni Salon Barber Q1 - Bến Thành', TenChiNhanh: 'Omni Salon Barber Q1 - Bến Thành', address: '120 Lê Lợi, P. Bến Thành, Q.1, TP.HCM', DiaChi: '120 Lê Lợi, P. Bến Thành, Q.1, TP.HCM', phone: '0901111001', SoDienThoai: '0901111001', openHours: '08:30 - 21:30', openTime: '08:30:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN1.jpg', HinhAnh: 'ChiNhanh_Omni/CN1.jpg', status: 'Hoạt động' },
        { id: 'CN02', MaChiNhanh: 'CN02', name: 'Omni Salon Barber Tân Bình - Cộng Hòa', TenChiNhanh: 'Omni Salon Barber Tân Bình - Cộng Hòa', address: '45 Cộng Hòa, P.4, Q.Tân Bình, TP.HCM', DiaChi: '45 Cộng Hòa, P.4, Q.Tân Bình, TP.HCM', phone: '0901111002', SoDienThoai: '0901111002', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN2.jpg', HinhAnh: 'ChiNhanh_Omni/CN2.jpg', status: 'Hoạt động' },
        { id: 'CN03', MaChiNhanh: 'CN03', name: 'Omni Salon Barber Bình Thạnh - Điện Biên Phủ', TenChiNhanh: 'Omni Salon Barber Bình Thạnh - Điện Biên Phủ', address: '88 Điện Biên Phủ, P.15, Q.Bình Thạnh, TP.HCM', DiaChi: '88 Điện Biên Phủ, P.15, Q.Bình Thạnh, TP.HCM', phone: '0901111003', SoDienThoai: '0901111003', openHours: '09:00 - 22:00', openTime: '09:00:00', closeTime: '22:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN3.jpg', HinhAnh: 'ChiNhanh_Omni/CN3.jpg', status: 'Hoạt động' },
        { id: 'CN04', MaChiNhanh: 'CN04', name: 'Omni Salon Barber Q3 - Nam Kỳ Khởi Nghĩa', TenChiNhanh: 'Omni Salon Barber Q3 - Nam Kỳ Khởi Nghĩa', address: '215 Nam Kỳ Khởi Nghĩa, P.7, Q.3, TP.HCM', DiaChi: '215 Nam Kỳ Khởi Nghĩa, P.7, Q.3, TP.HCM', phone: '0901111004', SoDienThoai: '0901111004', openHours: '08:30 - 21:30', openTime: '08:30:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN4.jpg', HinhAnh: 'ChiNhanh_Omni/CN4.jpg', status: 'Hoạt động' },
        { id: 'CN05', MaChiNhanh: 'CN05', name: 'Omni Salon Barber Q5 - Trần Hưng Đạo', TenChiNhanh: 'Omni Salon Barber Q5 - Trần Hưng Đạo', address: '105 Trần Hưng Đạo, P.6, Q.5, TP.HCM', DiaChi: '105 Trần Hưng Đạo, P.6, Q.5, TP.HCM', phone: '0901111005', SoDienThoai: '0901111005', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN5.jpg', HinhAnh: 'ChiNhanh_Omni/CN5.jpg', status: 'Hoạt động' },
        { id: 'CN06', MaChiNhanh: 'CN06', name: 'Omni Salon Barber Q7 - Nguyễn Thị Thập', TenChiNhanh: 'Omni Salon Barber Q7 - Nguyễn Thị Thập', address: '480 Nguyễn Thị Thập, P.Tân Quy, Q.7, TP.HCM', DiaChi: '480 Nguyễn Thị Thập, P.Tân Quy, Q.7, TP.HCM', phone: '0901111006', SoDienThoai: '0901111006', openHours: '09:00 - 21:30', openTime: '09:00:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN6.jpg', HinhAnh: 'ChiNhanh_Omni/CN6.jpg', status: 'Hoạt động' },
        { id: 'CN07', MaChiNhanh: 'CN07', name: 'Omni Salon Barber Q10 - 3 Tháng 2', TenChiNhanh: 'Omni Salon Barber Q10 - 3 Tháng 2', address: '324 Ba Tháng Hai, P.12, Q.10, TP.HCM', DiaChi: '324 Ba Tháng Hai, P.12, Q.10, TP.HCM', phone: '0901111007', SoDienThoai: '0901111007', openHours: '08:30 - 21:30', openTime: '08:30:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN7.jpg', HinhAnh: 'ChiNhanh_Omni/CN7.jpg', status: 'Hoạt động' },
        { id: 'CN08', MaChiNhanh: 'CN08', name: 'Omni Salon Barber Phú Nhuận - Phan Xích Long', TenChiNhanh: 'Omni Salon Barber Phú Nhuận - Phan Xích Long', address: '150 Phan Xích Long, P.2, Q.Phú Nhuận, TP.HCM', DiaChi: '150 Phan Xích Long, P.2, Q.Phú Nhuận, TP.HCM', phone: '0901111008', SoDienThoai: '0901111008', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN8.jpg', HinhAnh: 'ChiNhanh_Omni/CN8.jpg', status: 'Hoạt động' },
        { id: 'CN09', MaChiNhanh: 'CN09', name: 'Omni Salon Barber Gò Vấp - Quang Trung', TenChiNhanh: 'Omni Salon Barber Gò Vấp - Quang Trung', address: '68 Quang Trung, P.10, Q.Gò Vấp, TP.HCM', DiaChi: '68 Quang Trung, P.10, Q.Gò Vấp, TP.HCM', phone: '0901111009', SoDienThoai: '0901111009', openHours: '09:00 - 21:30', openTime: '09:00:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN9.jpg', HinhAnh: 'ChiNhanh_Omni/CN9.jpg', status: 'Hoạt động' },
        { id: 'CN10', MaChiNhanh: 'CN10', name: 'Omni Salon Barber Thủ Đức - Võ Văn Ngân', TenChiNhanh: 'Omni Salon Barber Thủ Đức - Võ Văn Ngân', address: '98 Võ Văn Ngân, P.Linh Chiểu, TP.Thủ Đức, TP.HCM', DiaChi: '98 Võ Văn Ngân, P.Linh Chiểu, TP.Thủ Đức, TP.HCM', phone: '0901111010', SoDienThoai: '0901111010', openHours: '08:30 - 21:30', openTime: '08:30:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN10.jpg', HinhAnh: 'ChiNhanh_Omni/CN10.jpg', status: 'Hoạt động' },
        { id: 'CN11', MaChiNhanh: 'CN11', name: 'Omni Salon Barber Thảo Điền - Xuân Thủy', TenChiNhanh: 'Omni Salon Barber Thảo Điền - Xuân Thủy', address: '55 Xuân Thủy, P.Thảo Điền, TP.Thủ Đức, TP.HCM', DiaChi: '55 Xuân Thủy, P.Thảo Điền, TP.Thủ Đức, TP.HCM', phone: '0901111011', SoDienThoai: '0901111011', openHours: '09:00 - 22:00', openTime: '09:00:00', closeTime: '22:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN11.jpg', HinhAnh: 'ChiNhanh_Omni/CN11.jpg', status: 'Hoạt động' },
        { id: 'CN12', MaChiNhanh: 'CN12', name: 'Omni Salon Barber Q4 - Hoàng Diệu', TenChiNhanh: 'Omni Salon Barber Q4 - Hoàng Diệu', address: '12 Hoàng Diệu, P.9, Q.4, TP.HCM', DiaChi: '12 Hoàng Diệu, P.9, Q.4, TP.HCM', phone: '0901111012', SoDienThoai: '0901111012', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN12.jpg', HinhAnh: 'ChiNhanh_Omni/CN12.jpg', status: 'Hoạt động' },
        { id: 'CN13', MaChiNhanh: 'CN13', name: 'Omni Salon Barber Q6 - Hậu Giang', TenChiNhanh: 'Omni Salon Barber Q6 - Hậu Giang', address: '260 Hậu Giang, P.4, Q.6, TP.HCM', DiaChi: '260 Hậu Giang, P.4, Q.6, TP.HCM', phone: '0901111013', SoDienThoai: '0901111013', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN13.jpg', HinhAnh: 'ChiNhanh_Omni/CN13.jpg', status: 'Hoạt động' },
        { id: 'CN14', MaChiNhanh: 'CN14', name: 'Omni Salon Barber Q8 - Phạm Hùng', TenChiNhanh: 'Omni Salon Barber Q8 - Phạm Hùng', address: '180 Phạm Hùng, P.5, Q.8, TP.HCM', DiaChi: '180 Phạm Hùng, P.5, Q.8, TP.HCM', phone: '0901111014', SoDienThoai: '0901111014', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN14.jpg', HinhAnh: 'ChiNhanh_Omni/CN14.jpg', status: 'Hoạt động' },
        { id: 'CN15', MaChiNhanh: 'CN15', name: 'Omni Salon Barber Q11 - Ông Ích Khiêm', TenChiNhanh: 'Omni Salon Barber Q11 - Ông Ích Khiêm', address: '85 Ông Ích Khiêm, P.10, Q.11, TP.HCM', DiaChi: '85 Ông Ích Khiêm, P.10, Q.11, TP.HCM', phone: '0901111015', SoDienThoai: '0901111015', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN15.jpg', HinhAnh: 'ChiNhanh_Omni/CN15.jpg', status: 'Hoạt động' },
        { id: 'CN16', MaChiNhanh: 'CN16', name: 'Omni Salon Barber Q12 - Lê Văn Khương', TenChiNhanh: 'Omni Salon Barber Q12 - Lê Văn Khương', address: '45 Lê Văn Khương, P.Thới An, Q.12, TP.HCM', DiaChi: '45 Lê Văn Khương, P.Thới An, Q.12, TP.HCM', phone: '0901111016', SoDienThoai: '0901111016', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN16.jpg', HinhAnh: 'ChiNhanh_Omni/CN16.jpg', status: 'Hoạt động' },
        { id: 'CN17', MaChiNhanh: 'CN17', name: 'Omni Salon Barber Tân Phú - Lũy Bán Bích', TenChiNhanh: 'Omni Salon Barber Tân Phú - Lũy Bán Bích', address: '72 Lũy Bán Bích, P.Tân Thới Hòa, Q.Tân Phú, TP.HCM', DiaChi: '72 Lũy Bán Bích, P.Tân Thới Hòa, Q.Tân Phú, TP.HCM', phone: '0901111017', SoDienThoai: '0901111017', openHours: '08:30 - 21:30', openTime: '08:30:00', closeTime: '21:30:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN17.jpg', HinhAnh: 'ChiNhanh_Omni/CN17.jpg', status: 'Hoạt động' },
        { id: 'CN18', MaChiNhanh: 'CN18', name: 'Omni Salon Barber Bình Tân - Tên Lửa', TenChiNhanh: 'Omni Salon Barber Bình Tân - Tên Lửa', address: '110 Tên Lửa, P.Bình Trị Đông B, Q.Bình Tân, TP.HCM', DiaChi: '110 Tên Lửa, P.Bình Trị Đông B, Q.Bình Tân, TP.HCM', phone: '0901111018', SoDienThoai: '0901111018', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN18.jpg', HinhAnh: 'ChiNhanh_Omni/CN18.jpg', status: 'Hoạt động' },
        { id: 'CN19', MaChiNhanh: 'CN19', name: 'Omni Salon Barber Bình Chánh - Quốc Lộ 50', TenChiNhanh: 'Omni Salon Barber Bình Chánh - Quốc Lộ 50', address: '35 Quốc lộ 50, X.Bình Hưng, H.Bình Chánh, TP.HCM', DiaChi: '35 Quốc lộ 50, X.Bình Hưng, H.Bình Chánh, TP.HCM', phone: '0901111019', SoDienThoai: '0901111019', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN19.jpg', HinhAnh: 'ChiNhanh_Omni/CN19.jpg', status: 'Hoạt động' },
        { id: 'CN20', MaChiNhanh: 'CN20', name: 'Omni Salon Barber Hóc Môn - Lý Thường Kiệt', TenChiNhanh: 'Omni Salon Barber Hóc Môn - Lý Thường Kiệt', address: '52 Lý Thường Kiệt, TT.Hóc Môn, H.Hóc Môn, TP.HCM', DiaChi: '52 Lý Thường Kiệt, TT.Hóc Môn, H.Hóc Môn, TP.HCM', phone: '0901111020', SoDienThoai: '0901111020', openHours: '08:30 - 21:00', openTime: '08:30:00', closeTime: '21:00:00', city: 'TP. Hồ Chí Minh', region: 'hcm', image: 'ChiNhanh_Omni/CN20.jpg', HinhAnh: 'ChiNhanh_Omni/CN20.jpg', status: 'Hoạt động' }
      ];

      // 10 Lịch Hẹn từ CSDL QL_SALON.sql, Tổng: 5.540.000 đ
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

      // 10 Đơn Hàng Bán Lẻ từ CSDL QL_SALON.sql, Tổng: 5.350.000 đ
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

      // 10 Dịch Vụ Chuẩn từ CSDL QL_SALON.sql
      const services = [
        { id: 'DV01', MaDichVu: 'DV01', name: 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade', price: 130000, Gia: 130000, originalPrice: 130000, NgayApDung: '2026-10-17', duration: '45 phút', durationMinutes: 45, ThoiLuong: 45, description: 'Tư vấn dáng mặt, cắt fade hiện đại, cạo viền sắc nét và vuốt sáp/pomade cao cấp.', category: 'Cắt & Tạo Kiểu', rating: 4.95, reviewCount: 420, image: 'Men_Grooming_Products/DichVu_Men/DV1.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/DV1.jpg' },
        { id: 'DV02', MaDichVu: 'DV02', name: 'Cắt & Ép Side tóc nam (Down Perm Combo)', price: 250000, Gia: 250000, originalPrice: 250000, NgayApDung: '2026-01-01', duration: '60 phút', durationMinutes: 60, ThoiLuong: 60, description: 'Cắt form chuẩn kết hợp ép xẹp tóc mai và gáy bị vểnh chỉa, giữ nếp 1-2 tháng.', category: 'Cắt & Tạo Kiểu', rating: 4.98, reviewCount: 310, image: 'Men_Grooming_Products/DichVu_Men/DV2.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/DV2.jpg' },
        { id: 'DV03', MaDichVu: 'DV03', name: 'Uốn tóc xoăn Texture / Ziczac phồng Hàn Quốc', price: 585000, Gia: 585000, originalPrice: 650000, discountPercent: 10, hasPromotion: true, promotion: { id: 'KM01', code: 'KM01', name: 'Chào Thu Rực Rỡ', discount: 10, discountPercent: 10, type: 'Giảm giá %' }, NgayApDung: '2026-01-01', duration: '90 phút', durationMinutes: 90, ThoiLuong: 90, description: 'Uốn lạnh tạo lọn sóng phồng tự nhiên, giúp tóc bồng bềnh dễ sấy tạo kiểu.', category: 'Uốn & Nhuộm', rating: 4.92, reviewCount: 280, image: 'Men_Grooming_Products/DichVu_Men/DV3.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/DV3.jpg' },
        { id: 'DV04', MaDichVu: 'DV04', name: 'Nhuộm màu thời trang nam (Khói / Rêu / Bạch kim)', price: 855000, Gia: 855000, originalPrice: 950000, discountPercent: 10, hasPromotion: true, promotion: { id: 'KM01', code: 'KM01', name: 'Chào Thu Rực Rỡ', discount: 10, discountPercent: 10, type: 'Giảm giá %' }, NgayApDung: '2026-01-01', duration: '120 phút', durationMinutes: 120, ThoiLuong: 120, description: 'Tẩy khử ánh sắc và nhuộm tông màu thời trang cao cấp bảo vệ sợi tóc.', category: 'Uốn & Nhuộm', rating: 4.90, reviewCount: 195, image: 'Men_Grooming_Products/DichVu_Men/DV4.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/DV4.jpg' },
        { id: 'DV05', MaDichVu: 'DV05', name: 'Uốn tóc con sâu Dreadlocks / Uốn Ruffled phá cách', price: 680000, Gia: 680000, originalPrice: 800000, discountPercent: 15, hasPromotion: true, promotion: { id: 'KM02', code: 'KM02', name: 'Đặc quyền Salon VIP', discount: 15, discountPercent: 15, type: 'Giảm giá %' }, NgayApDung: '2026-01-01', duration: '100 phút', durationMinutes: 100, ThoiLuong: 100, description: 'Kỹ thuật uốn giấy bạc / uốn con sâu tạo hiệu ứng xù gai góc, phong cách hip-hop cá tính.', category: 'Uốn & Nhuộm', rating: 4.96, reviewCount: 250, image: 'Men_Grooming_Products/DichVu_Men/DV5.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/DV5.jpg' },
        { id: 'DV06', MaDichVu: 'DV06', name: 'Kẻ Line Hair Tattoo nghệ thuật & Điêu khắc chân tóc', price: 150000, Gia: 150000, originalPrice: 150000, NgayApDung: '2026-01-01', duration: '30 phút', durationMinutes: 30, ThoiLuong: 30, description: 'Kỹ thuật dùng dao lam điêu khắc các họa tiết hoa văn, đường line sắc nét tạo điểm nhấn.', category: 'Cắt & Tạo Kiểu', rating: 4.93, reviewCount: 310, image: 'Men_Grooming_Products/DichVu_Men/DV6.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/DV6.jpg' },
        { id: 'DV07', MaDichVu: 'DV07', name: 'Cạo mặt, tỉa râu truyền thống & Khăn nóng', price: 80000, Gia: 80000, originalPrice: 80000, NgayApDung: '2026-01-01', duration: '30 phút', durationMinutes: 30, ThoiLuong: 30, description: 'Cạo râu bằng dao cạo bọt kem Proraso, chườm khăn nóng làm sạch lỗ chân lông.', category: 'Chăm Sóc & Phục Hồi', rating: 4.97, reviewCount: 520, image: 'Men_Grooming_Products/DichVu_Men/DV7.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/DV7.jpg' },
        { id: 'DV08', MaDichVu: 'DV08', name: 'Nhuộm đen phủ bạc thảo dược tự nhiên cho nam giới', price: 180000, Gia: 180000, originalPrice: 180000, NgayApDung: '2026-01-01', duration: '45 phút', durationMinutes: 45, ThoiLuong: 45, description: 'Phủ bạc 100% bằng chiết xuất thảo mộc không mùi hắc, trả lại màu tóc đen khỏe tự nhiên.', category: 'Uốn & Nhuộm', rating: 4.94, reviewCount: 380, image: 'Men_Grooming_Products/DichVu_Men/DV8.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/DV8.jpg' },
        { id: 'DV09', MaDichVu: 'DV09', name: 'Tẩy tóc nâng tông thời trang (1 Lần)', price: 300000, Gia: 300000, originalPrice: 300000, NgayApDung: '2026-01-01', duration: '60 phút', durationMinutes: 60, ThoiLuong: 60, description: 'Nâng sáng từ 3-4 cấp độ màu chuẩn bị trước khi phủ màu khói sáng.', category: 'Uốn & Nhuộm', rating: 4.91, reviewCount: 220, image: 'Men_Grooming_Products/DichVu_Men/DV9.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/DV9.jpg' },
        { id: 'DV10', MaDichVu: 'DV10', name: 'Lấy ráy tai êm ái Barber & Chăm sóc da mặt Facial', price: 100000, Gia: 100000, originalPrice: 100000, NgayApDung: '2026-01-01', duration: '35 phút', durationMinutes: 35, ThoiLuong: 35, description: 'Lấy ráy tai chuyên nghiệp bằng đèn quang học, hút bã nhờn và dưỡng ẩm da mặt.', category: 'Chăm Sóc & Phục Hồi', rating: 4.99, reviewCount: 610, image: 'Men_Grooming_Products/DichVu_Men/DV10.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/DV10.jpg' }
      ];

      // 4 Gói Combo VIP từ CSDL QL_SALON.sql
      const combos = [
        { id: 'CB01', MaCombo: 'CB01', name: 'Combo Quý Tộc Barber (Cắt + Gội + Cạo râu)', price: 300000, GiaCombo: 300000, oldPrice: 350000, duration: 90, durationMinutes: 90, ThoiLuong: 90, description: 'Gói dịch vụ chăm sóc hoàn chỉnh từ cắt tóc, gội dưỡng sinh đến cạo mặt khăn nóng.', image: 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' },
        { id: 'CB02', MaCombo: 'CB02', name: 'Combo Đẹp Trai Toàn Diện (Cắt + Ép Side Down Perm)', price: 330000, GiaCombo: 330000, oldPrice: 370000, duration: 80, durationMinutes: 80, ThoiLuong: 80, description: 'Cắt form chuẩn kết hợp ép xẹp 2 bên mai giúp đầu vuông vức, gọn gàng.', image: 'Men_Grooming_Products/DichVu_Men/CBDV2.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/CBDV2.jpg' },
        { id: 'CB03', MaCombo: 'CB03', name: 'Combo Lột Xác Phong Cách (Cắt + Uốn Texture + Gội)', price: 790000, GiaCombo: 790000, oldPrice: 920000, duration: 130, durationMinutes: 130, ThoiLuong: 130, description: 'Combo uốn phồng tóc tạo nếp Hàn Quốc kèm gội xả thư giãn.', image: 'Men_Grooming_Products/DichVu_Men/CBDV3.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/CBDV3.jpg' },
        { id: 'CB04', MaCombo: 'CB04', name: 'Combo Quý Ông (Kẻ Tattoo + Cạo râu + Ráy tai Facial)', price: 280000, GiaCombo: 280000, oldPrice: 330000, duration: 75, durationMinutes: 75, ThoiLuong: 75, description: 'Gói chăm sóc gọn gàng diện mạo gồm tỉa họa tiết tóc, cạo râu bọt kem và lấy ráy tai thư giãn.', image: 'Men_Grooming_Products/DichVu_Men/CBDV4.jpg', HinhAnh: 'Men_Grooming_Products/DichVu_Men/CBDV4.jpg' }
      ];

      // 9 Danh Mục Sản Phẩm
      const categories = [
        { id: 'DM01', MaDanhMuc: 'DM01', name: 'Sáp vuốt tóc - Clay & Wax', icon: '', description: 'Các sản phẩm clay, wax giữ nếp tóc nam' },
        { id: 'DM02', MaDanhMuc: 'DM02', name: 'Pomade cổ điển & hiện đại', icon: '', description: 'Các dòng pomade, paste tạo kiểu bóng/mờ' },
        { id: 'DM03', MaDanhMuc: 'DM03', name: 'Xịt tạo phồng & Pre-Styling', icon: '', description: 'Grooming tonic, xịt bảo vệ nhiệt' },
        { id: 'DM04', MaDanhMuc: 'DM04', name: 'Gôm xịt giữ nếp tóc nam', icon: '', description: 'Hairspray cố định form tóc' },
        { id: 'DM05', MaDanhMuc: 'DM05', name: 'Dầu gội & xả nam - trị gàu', icon: '', description: 'Dầu gội sạch sâu, kiểm soát dầu' },
        { id: 'DM06', MaDanhMuc: 'DM06', name: 'Bột tạo phồng', icon: '', description: 'Bột tăng volume tức thì' },
        { id: 'DM07', MaDanhMuc: 'DM07', name: 'Thuốc uốn lạnh & ép side', icon: '', description: 'Sản phẩm kỹ thuật uốn và down perm' },
        { id: 'DM08', MaDanhMuc: 'DM08', name: 'Chăm sóc râu - Beard Care', icon: '', description: 'Dầu dưỡng và bọt làm sạch râu' },
        { id: 'DM09', MaDanhMuc: 'DM09', name: 'Dụng cụ tạo kiểu nam', icon: '', description: 'Lược bán nguyệt, máy sấy ion chuyên nghiệp' }
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

        // 4 Thu ngân, Quầy POS & Hóa đơn, lương giờ, không hoa hồng cắt
        const id4 = `NV${String(60 + bIdx + 1).padStart(2, '0')}`;
        const cashierNames = [
          'Nguyễn Thảo My', 'Trần Bích Phương', 'Lê Ngọc Hân', 'Phạm Quỳnh Nga', 'Hoàng Thùy Linh',
          'Đỗ Mỹ Linh', 'Vũ Phương Ly', 'Đặng Thu Hà', 'Bùi Ánh Tuyết', 'Ngô Thanh Vân',
          'Dương Cẩm Lynh', 'Lý Nhã Kỳ', 'Mai Phương Thúy', 'Trịnh Kim Chi', 'Hà Kiều Anh',
          'Trần Tiểu Vy', 'Lương Thùy Linh', 'Nguyễn Thúc Thùy Tiên', 'Đoàn Thiên Ân', 'Huỳnh Thị Thanh Thủy'
        ];
        stylists.push({
          id: id4, MaNhanVien: id4, branchId: b.id, MaChiNhanh: b.id, name: cashierNames[bIdx] || 'Nhân viên thu ngân', HoTen: cashierNames[bIdx] || 'Nhân viên thu ngân',
          role: 'Thu ngân', ChucVu: 'Thu ngân', level: 'Chuyên viên thu ngân', title: 'Chuyên viên thu ngân • POS', phone: `0909888${String(60 + bIdx + 1)}`,
          email: `${id4.toLowerCase()}@salontoc.vn`, avatar: avatarPresets[(60 + bIdx) % avatarPresets.length],
          rating: 5.0, reviewCount: 100, specialty: 'Thanh toán POS, in hóa đơn, tư vấn khuyến mãi'
        });
      });

      // 130 Sản phẩm thực tế từ CSDL QL_SALON.sql
      const products = [
        { id: 'SP01', name: 'Apestomen Volcanic Clay', brand: 'Apestomen', categoryId: 'DM01', price: 129600, originalPrice: 480000, discountPercent: 73, PhanTramGiam: 73, fefoDiscount: 70, nearExpiryDiscount: 70, nearExpiryBatch: 'CTPN01001', nearExpiryStock: 19, promoDiscount: 10, daysLeft: 20, daysRemaining: 20, isNearExpiry: true, hasPromotion: true, promotion: { id: 'KM01_FEFO', code: 'KM01_FEFO', name: 'Xả kho cận hạn FEFO (-70%) + Chào Thu (-10%)', discount: 73, discountPercent: 73, fefoDiscount: 70, promoDiscount: 10, type: 'Giảm giá %' }, promo: { id: 'KM01_FEFO', code: 'KM01_FEFO', name: 'Xả kho cận hạn FEFO (-70%) + Chào Thu (-10%)', discount: 73, discountPercent: 73, fefoDiscount: 70, promoDiscount: 10, type: 'Giảm giá %' }, costPrice: 340000, stock: 24, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay.jpg', description: 'Tạo texture, tăng độ phồng, giữ tóc vào nếp với hiệu ứng khô tự nhiên. Áp dụng quy tắc cận hạn FEFO (-70%) kết hợp khuyến mãi (-10%) tính lũy tiến.' },
        { id: 'SP02', name: 'Hanz de Fuko Gravity Paste', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 879000, originalPrice: 879000, costPrice: 731000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Gravity_Paste.jpg', description: 'Tạo độ phồng, texture rõ và giữ nếp chắc.' },
        { id: 'SP03', name: 'Hanz de Fuko Claymation', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 879000, originalPrice: 879000, costPrice: 731000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Claymation.jpg', description: 'Clay kết hợp wax, tạo texture mạnh và giữ nếp lâu.' },
        { id: 'SP04', name: 'Hanz de Fuko Heavymade', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 690000, originalPrice: 690000, costPrice: 520000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Heavymade.jpg', description: 'Giữ nếp mạnh, tạo độ bóng vừa và kiểu tóc gọn gàng.' },
        { id: 'SP05', name: 'Hanz de Fuko Quicksand', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 879000, originalPrice: 879000, costPrice: 731000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Quicksand.jpg', description: 'Tạo texture, volume và cảm giác tóc khô tự nhiên.' },
        { id: 'SP06', name: 'Hanz de Fuko Modify', brand: 'Hanz de Fuko', categoryId: 'DM01', price: 747150, originalPrice: 879000, discountPercent: 15, hasPromotion: true, promotion: { id: 'KM02', code: 'KM02', name: 'Đặc quyền Salon VIP', discount: 15, discountPercent: 15, type: 'Giảm giá %' }, costPrice: 731000, stock: 25, image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Modify.jpg', description: 'Tạo kiểu linh hoạt, dễ chỉnh sửa và tạo độ bóng tự nhiên.' },
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

      // 2 Khuyến Mãi Chuẩn từ CSDL QL_SALON.sql, KM01 - 10%, KM02 - 15%
      const promotions = [
        { id: 'KM01', MaKhuyenMai: 'KM01', code: 'KM01', name: 'Chào Thu Rực Rỡ', TenKhuyenMai: 'Chào Thu Rực Rỡ', type: 'Giảm giá %', HinhThuc: 'Giảm giá %', discount: 10, GiaTriGiam: 10, target: 'Tất cả khách hàng', DoiTuongApDung: 'Tất cả khách hàng', startDate: '2026-09-01', NgayBatDau: '2026-09-01', endDate: '2026-10-31', NgayKetThuc: '2026-10-31', status: 'Đang áp dụng', TrangThai: 'Đang áp dụng', serviceIds: ['DV03', 'DV04'], productIds: ['SP01'] },
        { id: 'KM02', MaKhuyenMai: 'KM02', code: 'KM02', name: 'Đặc quyền Salon VIP', TenKhuyenMai: 'Đặc quyền Salon VIP', type: 'Giảm giá %', HinhThuc: 'Giảm giá %', discount: 15, GiaTriGiam: 15, target: 'Hội viên thân thiết', DoiTuongApDung: 'Hội viên thân thiết', startDate: '2026-01-01', NgayBatDau: '2026-01-01', endDate: '2026-12-31', NgayKetThuc: '2026-12-31', status: 'Đang áp dụng', TrangThai: 'Đang áp dụng', serviceIds: ['DV05'], productIds: ['SP06'] }
      ];

      // Tồn Kho Khởi Tạo
      const inventory = [];
      branches.forEach((b, bIdx) => {
        products.forEach(p => {
          let st = p.stock !== undefined ? p.stock : (p.SoLuongTon !== undefined ? p.SoLuongTon : 0);
          if (p.id === 'SP01') {
            if (b.id === 'CN01') st = 19;
            else if (b.id === 'CN02') st = 10;
          }
          inventory.push({
            id: `inv-${b.id}-${p.id}`,
            productId: p.id,
            MaSanPham: p.id,
            productName: p.name,
            branchId: b.id,
            MaChiNhanh: b.id,
            branchName: b.name,
            stock: st,
            SoLuongTon: st,
            warningThreshold: 5,
            minAlert: 5
          });
        });
      });

      return {
        branches,
        services,
        combos,
        categories,
        products,
        stylists,
        bookings,
        orders,
        promotions,
        suppliers: [],
        discountRules: [],
        receipts: [],
        invoices: [],
        payments: [],
        fefoLots: [],
        lowStockWarnings: [],
        notifications: [],
        shifts: [],
        inventory,
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
        ['OMNISALON_SQL_DIRECT', 'OMNISALON_OMNI_V5_LIVE', 'OMNISALON_OMNI_V6_SQL', 'OMNISALON_OMNI_V7_SQL', 'OMNISALON_OMNI_V8_SQL', 'OMNISALON_SQL_DIRECT_V9', 'OMNISALON_SQL_DIRECT_V10', 'OMNISALON_SQL_DIRECT_V11', 'OMNISALON_SQL_DIRECT_V12'].forEach(k => {
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
        } else {
          this.state.products = this.state.products.filter(p => p.id !== 'SP_TOTE');
        }
        if (!Array.isArray(this.state.bookings) || this.state.bookings.length < 10) {
          this.state.bookings = baseline.bookings;
        }
        if (!Array.isArray(this.state.orders) || this.state.orders.length < 10) {
          this.state.orders = baseline.orders;
        }
        if (!Array.isArray(this.state.promotions) || this.state.promotions.length === 0) {
          this.state.promotions = baseline.promotions;
        }
        if (!this.state.users || this.state.users.length === 0) {
          this.state.users = baseline.users;
        }
        if (!Array.isArray(this.state.inventory) || this.state.inventory.length === 0) {
          this.state.inventory = baseline.inventory;
        } else {
          const sp1cn1 = this.state.inventory.find(i => (i.productId === 'SP01' || i.MaSanPham === 'SP01') && (i.branchId === 'CN01' || i.MaChiNhanh === 'CN01'));
          if (sp1cn1 && (sp1cn1.stock === 15 || sp1cn1.stock === 20 || sp1cn1.stock === 24 || sp1cn1.stock === 25)) {
            sp1cn1.stock = 19;
            sp1cn1.SoLuongTon = 19;
          }
        }

        // Tự động chuẩn hóa 100% hình ảnh dịch vụ & combo sang ảnh salon thực tế, DichVu_Men/DV... và CBDV...
        const femaleImgList = ['photo-1522337360788-8b13dee7a37e', 'photo-1534528741775-53994a69daeb', 'photo-1544005313-94ddf0286df2'];
        const isBadImg = (url) => !url || typeof url !== 'string' || femaleImgList.some(f => url.includes(f));

        if (Array.isArray(this.state.services)) {
          this.state.services.forEach((s, idx) => {
            const dvMatch = (s.id || s.MaDichVu || '').match(/\d+/);
            const num = dvMatch ? parseInt(dvMatch[0], 10) : (idx + 1);
            const realImg = `DichVu_Men/DV${num}.jpg`;
            if (isBadImg(s.image) || (typeof s.image === 'string' && (s.image.includes('unsplash.com') || !s.image.includes('DichVu_Men')))) {
              s.image = realImg;
              s.HinhAnh = realImg;
            }
          });
        }
        if (Array.isArray(this.state.combos)) {
          this.state.combos.forEach((c, idx) => {
            const cbMatch = (c.id || c.MaCombo || '').match(/\d+/);
            const num = cbMatch ? parseInt(cbMatch[0], 10) : (idx + 1);
            const realImg = `DichVu_Men/CBDV${num}.jpg`;
            if (isBadImg(c.image) || (typeof c.image === 'string' && (c.image.includes('unsplash.com') || !c.image.includes('DichVu_Men')))) {
              c.image = realImg;
              c.HinhAnh = realImg;
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
              st.avatar = baseline.stylists[idx]?.avatar || '';
            }
          });
        }
      }

      if (!this.state.currentUser) {
        this.state.currentUser = null;
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
    // CHI NHÁNH & ĐỊA ĐIỂM
    // -----------------------------------------------------------------------
    getBranches() {
      return this.state.branches || [];
    }

    getBranchById(branchId) {
      if (!branchId) return null;
      const branches = this.getBranches();
      return branches.find(b => b.id === branchId || b.MaChiNhanh === branchId) || null;
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
    // NGƯỜI DÙNG & PHIÊN ĐĂNG NHẬP, ĐỒNG BỘ AUTHENGINE
    // -----------------------------------------------------------------------
    getCurrentUser() {
      let user = null;
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        user = window.AuthEngine.getCurrentUser();
      } else if (window.Auth && typeof window.Auth.getCurrentUser === 'function') {
        user = window.Auth.getCurrentUser();
      }
      if (window.AuthEngine) {
        return user;
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
    // DỊCH VỤ & GÓI COMBO VIP, CRUD COMBOS
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
      const clean = String(serviceId).trim().toLowerCase();
      const services = this.getServices();
      return services.find(s => 
        String(s.id || '').trim().toLowerCase() === clean || 
        String(s.MaDichVu || '').trim().toLowerCase() === clean
      ) || null;
    }

    getCombos() {
      return this.state.combos || [];
    }

    getComboById(comboId) {
      if (!comboId) return null;
      const clean = String(comboId).trim().toLowerCase();
      return (this.state.combos || []).find(c => 
        String(c.id || '').trim().toLowerCase() === clean || 
        String(c.MaCombo || '').trim().toLowerCase() === clean
      ) || null;
    }

    getOfferingById(id) {
      if (!id) return null;
      return this.getServiceById(id) || this.getComboById(id);
    }

    getAllOfferings() {
      return [...this.getServices(), ...this.getCombos()];
    }

    addCombo(comboData) {
      if (!comboData || !comboData.name || !comboData.price) {
        throw new Error('Dữ liệu gói combo không hợp lệ.');
      }

      let maxN = 0;
      (this.state.combos || []).forEach(c => {
        const m = String(c.id || c.MaCombo || '').match(/^CB0*(\d+)$/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxN) maxN = n;
        }
      });
      const nextN = maxN + 1;
      const standardId = 'CB' + (nextN < 10 ? '0' + nextN : nextN);

      let chosenId = comboData.id || comboData.MaCombo;
      if (!chosenId || !/^CB\d+$/i.test(chosenId)) {
        chosenId = standardId;
      } else {
        const numM = chosenId.match(/^CB0*(\d+)$/i);
        if (numM) {
          const num = parseInt(numM[1], 10);
          chosenId = 'CB' + (num < 10 ? '0' + num : num);
        }
      }

      const newCombo = {
        id: chosenId,
        MaCombo: chosenId,
        name: comboData.name.trim(),
        TenCombo: comboData.name.trim(),
        category: 'combo',
        type: 'combo',
        price: Number(comboData.price),
        GiaCombo: Number(comboData.price),
        oldPrice: Number(comboData.oldPrice || comboData.price * 1.25),
        duration: Number(comboData.duration || 75),
        ThoiLuong: Number(comboData.duration || 75),
        image: comboData.image || 'DichVu_Men/CBDV1.jpg',
        HinhAnh: comboData.image || 'DichVu_Men/CBDV1.jpg',
        description: comboData.description || 'Gói dịch vụ cắt gội tạo kiểu trọn gói cao cấp',
        MoTa: comboData.description || 'Gói dịch vụ cắt gội tạo kiểu trọn gói cao cấp',
        services: Array.isArray(comboData.services) ? comboData.services : (Array.isArray(comboData.serviceIds) ? comboData.serviceIds : ['DV01', 'DV02']),
        serviceIds: Array.isArray(comboData.serviceIds) ? comboData.serviceIds : (Array.isArray(comboData.services) ? comboData.services : ['DV01', 'DV02']),
        rating: 5.0,
        reviewsCount: 1
      };
      if (!this.state.combos) this.state.combos = [];
      this.state.combos.push(newCombo);
      this.logAudit('CREATE_COMBO', `Gói: ${newCombo.name}`, `Giá: ${newCombo.price}`);
      this.saveState();
      this.syncComboToLiveServer(newCombo);
      return newCombo;
    }

    updateCombo(comboId, updates) {
      const combo = this.getComboById(comboId);
      if (!combo) return false;
      Object.assign(combo, updates);
      this.logAudit('UPDATE_COMBO', `Gói: #${comboId}`, `Cập nhật thông tin combo`);
      this.saveState();
      this.syncUpdateComboToLiveServer(comboId, updates);
      return combo;
    }

    deleteCombo(comboId) {
      const idx = (this.state.combos || []).findIndex(c => c.id === comboId || c.MaCombo === comboId);
      if (idx === -1) return false;
      const removed = this.state.combos.splice(idx, 1)[0];
      this.logAudit('DELETE_COMBO', `Gói: #${comboId}`, `Xóa combo: ${removed.name || removed.TenCombo}`);
      this.saveState();
      this.syncDeleteComboToLiveServer(comboId);
      return true;
    }

    addService(serviceData) {
      if (!serviceData || !serviceData.name || !serviceData.price) {
        throw new Error('Dữ liệu dịch vụ không hợp lệ.');
      }

      let maxN = 0;
      (this.state.services || []).forEach(s => {
        const m = String(s.id || s.MaDichVu || '').match(/^DV0*(\d+)$/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxN) maxN = n;
        }
      });
      const nextN = maxN + 1;
      const standardId = 'DV' + (nextN < 10 ? '0' + nextN : nextN);

      let chosenId = serviceData.id || serviceData.MaDichVu;
      if (!chosenId || !/^DV\d+$/i.test(chosenId)) {
        chosenId = standardId;
      } else {
        const numM = chosenId.match(/^DV0*(\d+)$/i);
        if (numM) {
          const num = parseInt(numM[1], 10);
          chosenId = 'DV' + (num < 10 ? '0' + num : num);
        }
      }

      const newService = {
        id: chosenId,
        MaDichVu: chosenId,
        name: serviceData.name.trim(),
        TenDichVu: serviceData.name.trim(),
        category: serviceData.category || 'haircut',
        price: Number(serviceData.price),
        oldPrice: Number(serviceData.oldPrice || serviceData.price),
        duration: Number(serviceData.duration || 45),
        image: serviceData.image || 'DichVu_Men/DV1.jpg',
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
      if (updates.price !== undefined && Number(updates.price) !== Number(srv.price || srv.Gia)) {
        const todayStr = new Date().toISOString().split('T')[0];
        updates.NgayApDung = todayStr;
        updates.effectiveDate = todayStr;
      }
      Object.assign(srv, updates);
      this.logAudit('UPDATE_SERVICE', `Dịch vụ: #${serviceId}`, 'Cập nhật thông tin dịch vụ');
      this.saveState();
      this.syncUpdateServiceToLiveServer(serviceId, updates);
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
    // THỢ CẮT TÓC & ĐIỀU PHỐI CA, THỢ CHÍNH, THỢ PHỤ, QUẢN LÝ
    // -----------------------------------------------------------------------
    getStylists(branchId = null, includeAllStaff = false) {
      const list = (this.state.stylists || []).filter(s => {
        if (includeAllStaff) return true;
        return s.role !== 'Thu ngân' && s.ChucVu !== 'Thu ngân' && !s.title?.toLowerCase().includes('thu ngân');
      });
      if (!branchId || branchId === 'all') return list;
      const tb = this.getBranchById(branchId);
      const tid = tb ? tb.id : branchId;
      return list.filter(s => (s.branchId === branchId || s.branchId === tid || s.MaChiNhanh === branchId || s.MaChiNhanh === tid));
    }

    getAllStaff(branchId = null) {
      return this.getStylists(branchId, true);
    }

    getStylistById(stylistId) {
      if (!stylistId) return null;
      const stylists = this.getStylists();
      return stylists.find(s => s.id === stylistId || s.MaNhanVien === stylistId) || null;
    }

    async addStylist(stylistData) {
      if (!stylistData || !stylistData.name) {
        throw new Error('Vui lòng nhập họ và tên của thợ.');
      }
      let maxNum = 80;
      (this.state.stylists || []).forEach(s => {
        const numMatch = (s.id || s.MaNhanVien || '').match(/^NV0*(\d+)$/i);
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
        ChucVu: role,
        level: level,
        CapBac: level,
        title: `${level} • ${role}`,
        phone: stylistData.phone || '0912000000',
        email: stylistData.email || `${nextId.toLowerCase()}@salontoc.vn`,
        avatar: stylistData.avatar || (role === 'Thợ phụ' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'),
        rating: 5.0,
        reviewCount: 0,
        specialty: stylistData.specialty || (role === 'Thợ phụ' ? 'Gội đầu dưỡng sinh, Ép side & Chăm sóc tóc' : 'Tạo kiểu tóc chuyên nghiệp, Fade & Uốn'),
        isAvailable: true
      };

      if (!this.state.stylists) this.state.stylists = [];
      this.state.stylists.push(newStylist);
      this.logAudit('CREATE_STYLIST', `Nhân sự: ${newStylist.name}`, `Vai trò: ${role} (#${nextId})`);
      this.saveState();
      await this.syncStylistToLiveServer(newStylist);
      return newStylist;
    }

    async updateStylist(stylistId, updates) {
      const st = this.getStylistById(stylistId);
      if (!st) return false;
      Object.assign(st, updates);
      if (updates.name) st.HoTen = updates.name;
      if (updates.role) st.ChucVu = updates.role;
      if (updates.level) st.CapBac = updates.level;
      if (updates.branchId) st.MaChiNhanh = updates.branchId;
      if (updates.phone) st.SoDienThoai = updates.phone;
      if (updates.role || updates.level) {
        st.title = `${st.level || 'Master Barber'} • ${st.role || 'Thợ chính'}`;
      }
      this.logAudit('UPDATE_STYLIST', `Nhân sự: #${stylistId}`, `Cập nhật thông tin nhân sự: ${st.name || st.HoTen}`);
      this.saveState();
      await this.syncStylistToLiveServer(st, true);
      return st;
    }

    async deleteStylist(stylistId) {
      const idx = (this.state.stylists || []).findIndex(s => s.id === stylistId || s.MaNhanVien === stylistId);
      if (idx === -1) return false;
      const removed = this.state.stylists.splice(idx, 1)[0];
      this.logAudit('DELETE_STYLIST', `Nhân sự: #${stylistId}`, `Xóa thợ: ${removed.name || removed.HoTen}`);
      this.saveState();
      await this.syncDeleteStylistToLiveServer(stylistId);
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
    // ĐẶT LỊCH & CHỐNG TRÙNG LỊCH, ANTI-DOUBLE BOOKING WITH FLEXIBLE DURATION
    // -----------------------------------------------------------------------
    _timeToMinutes(timeStr) {
      if (!timeStr || !timeStr.includes(':')) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    }

    _getTodayIso() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    _getCurrentMinutes() {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    }

    isSlotAvailable(stylistId, date, timeSlot, durationMinutes = 45) {
      const todayIso = this._getTodayIso();
      const currentMinutes = this._getCurrentMinutes();
      const startMin = this._timeToMinutes(timeSlot);

      // Kiểm tra thời gian thực, Real-time Past Check:
      // Tuyệt đối không cho chọn giờ đã trôi qua trong ngày hôm nay hoặc các ngày trong quá khứ!
      if (date < todayIso) {
        return false;
      }
      if (date === todayIso && startMin <= currentMinutes) {
        return false;
      }

      const endMin = startMin + Number(durationMinutes);

      const existingBookings = (this.state.bookings || []).filter(b =>
        (!stylistId || b.stylistId === stylistId) &&
        b.date === date &&
        String(b.status || '').toLowerCase() !== 'cancelled' &&
        String(b.status || '').toLowerCase() !== 'no_show'
      );

      for (const b of existingBookings) {
        const bStart = this._timeToMinutes(b.timeSlot);
        const bDuration = Number(b.durationMinutes || (b.estimatedEndTime ? this._timeToMinutes(b.estimatedEndTime) - bStart : 45));
        const bEnd = bStart + bDuration;

        // Xung đột thời gian: Khoảng startMin, endMin giao thoa với bStart, bEnd
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

      const todayIso = this._getTodayIso();
      const currentMinutes = this._getCurrentMinutes();
      const isToday = (date === todayIso);
      const isPastDate = (date < todayIso);

      // Tối ưu N+1: Trích xuất trước khoảng thời gian các ca đã đặt trong ngày 1 lần duy nhất
      const dur = Number(durationMinutes || 45);
      const bookedIntervals = (this.state.bookings || [])
        .filter(b => (!stylistId || b.stylistId === stylistId) && b.date === date && String(b.status || '').toLowerCase() !== 'cancelled' && String(b.status || '').toLowerCase() !== 'no_show')
        .map(b => {
          const start = this._timeToMinutes(b.timeSlot);
          const bDur = Number(b.durationMinutes || (b.estimatedEndTime ? this._timeToMinutes(b.estimatedEndTime) - start : 45));
          return { start, end: start + bDur };
        });

      return standardSlots.map(time => {
        const slotStart = this._timeToMinutes(time);
        const slotEnd = slotStart + dur;
        const hasConflict = bookedIntervals.some(iv => slotStart < iv.end && slotEnd > iv.start);
        
        // Khung giờ đã trôi qua: nếu là ngày trong quá khứ, HOẶC là ngày hôm nay và giờ bắt đầu <= giờ hiện tại
        const isPast = isPastDate || (isToday && slotStart <= currentMinutes);
        const available = !isPast && !hasConflict;

        return {
          time,
          available,
          isPast,
          isBooked: hasConflict,
          reason: isPast ? 'Đã qua' : (hasConflict ? 'Kín lịch' : 'Còn chỗ')
        };
      });
    }

    addBooking(bookingData) {
      if (!bookingData || !bookingData.date || !bookingData.timeSlot) {
        throw new Error('Vui lòng chọn ngày, giờ và Barber phục vụ.');
      }

      const todayIso = this._getTodayIso();
      const currentMinutes = this._getCurrentMinutes();
      const startMin = this._timeToMinutes(bookingData.timeSlot);

      if (bookingData.date < todayIso || (bookingData.date === todayIso && startMin <= currentMinutes)) {
        throw new Error(`Khung giờ ${bookingData.timeSlot} ngày ${bookingData.date} đã trôi qua so với thời gian hiện tại! Vui lòng chọn khung giờ khác hoặc ngày tiếp theo.`);
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

      // Sinh mã lịch hẹn chuẩn định dạng CSDL SQL Server, LH01 -> LH11 -> LH12...
      let bookingCode = bookingData.bookingCode || bookingData.MaLichHen;
      if (!bookingCode) {
        const existingLh = (this.state.bookings || [])
          .map(b => (b.id || b.MaLichHen || b.bookingCode || ''))
          .filter(code => /^LH\d+$/i.test(code));
        let maxNum = 10;
        existingLh.forEach(code => {
          const num = parseInt(code.replace(/^LH/i, ''), 10);
          if (num > maxNum) maxNum = num;
        });
        bookingCode = 'LH' + (maxNum + 1 < 10 ? '0' + (maxNum + 1) : (maxNum + 1));
      }
      const bookingId = bookingData.id || bookingCode;

      const newBooking = {
        id: bookingId,
        MaLichHen: bookingCode,
        bookingCode,
        userId: bookingData.userId || this.getCurrentUser()?.id || null,
        branchId: bookingData.branchId || (branch ? branch.id : 'CN01'),
        branchName: branch ? branch.name : 'Omni Salon HQ',
        stylistId: bookingData.stylistId,
        stylistName: stylist ? stylist.name : (bookingData.stylistName || 'Master Stylist Chuyên Nghiệp'),
        customerName: (bookingData.customerName || '').trim(),
        customerPhone: (bookingData.customerPhone || '').trim(),
        customerEmail: (bookingData.customerEmail || '').trim(),
        serviceId: bookingData.serviceId || (bookingData.serviceIds?.[0]) || null,
        serviceIds: bookingData.serviceIds || (bookingData.serviceId ? [bookingData.serviceId] : []),
        servicesList: bookingData.servicesList || [],
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
        title: 'Đặt Lịch Cắt Tóc Thành Công',
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

      if (newStatus === 'Waiting' || newStatus === 'waiting') {
        booking.status = 'Waiting';
        booking.waitingAt = new Date().toISOString();
      }
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

    checkinBookingWaiting(bookingId) {
      return this.updateBookingStatus(bookingId, 'Waiting');
    }

    checkinBookingEarlyToday(bookingId) {
      const b = (this.state.bookings || []).find(x => x.id === bookingId || x.bookingCode === bookingId);
      if (!b) return false;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      const nowH = String(today.getHours()).padStart(2, '0');
      const nowM = String(today.getMinutes()).padStart(2, '0');
      const nowTime = `${nowH}:${nowM}`;

      const oldDate = b.date || b.bookingDate;
      const oldTime = b.timeSlot;
      b.date = todayStr;
      b.bookingDate = todayStr;
      b.timeSlot = nowTime;
      b.status = 'In_Progress';
      b.checkedInAt = new Date().toISOString();
      const noteSuffix = `[Đến làm sớm hôm nay lúc ${nowTime} (Lịch gốc: ${oldDate} ${oldTime})]`;
      b.notes = b.notes ? `${b.notes} • ${noteSuffix}` : noteSuffix;

      this.logAudit('EARLY_CHECKIN', `Lịch: #${b.bookingCode || b.id}`, `Khách làm sớm hôm nay: ${b.customerName} (${todayStr} ${nowTime})`);
      this.saveState();
      this.syncBookingStatusToLiveServer(b.id, 'In_Progress', { note: b.notes });
      return b;
    }

    checkinWaitingEarlyToday(bookingId) {
      const b = (this.state.bookings || []).find(x => x.id === bookingId || x.bookingCode === bookingId);
      if (!b) return false;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      const nowH = String(today.getHours()).padStart(2, '0');
      const nowM = String(today.getMinutes()).padStart(2, '0');
      const nowTime = `${nowH}:${nowM}`;

      const oldDate = b.date || b.bookingDate;
      const oldTime = b.timeSlot;
      b.date = todayStr;
      b.bookingDate = todayStr;
      b.timeSlot = nowTime;
      b.status = 'Waiting';
      b.waitingAt = new Date().toISOString();
      const noteSuffix = `[Đến sớm chờ ghế hôm nay lúc ${nowTime} (Lịch gốc: ${oldDate} ${oldTime})]`;
      b.notes = b.notes ? `${b.notes} • ${noteSuffix}` : noteSuffix;

      this.logAudit('EARLY_WAITING', `Lịch: #${b.bookingCode || b.id}`, `Khách đến sớm chờ ghế: ${b.customerName} (${todayStr} ${nowTime})`);
      this.saveState();
      this.syncBookingStatusToLiveServer(b.id, 'Waiting', { note: b.notes });
      return b;
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
    // QUẢN LÝ TỒN KHO CHI NHÁNH & TRỪ KHO NGUYÊN TỬ, ATOMIC STOCK
    // -----------------------------------------------------------------------
    getBranchInventory(branchId = null) {
      const bId = (!branchId || String(branchId).toLowerCase() === 'all') ? null : branchId;

      const prods = this.state.products || [];
      const invList = this.state.inventory || [];

      // Bản đồ tồn kho theo key: branchId_productId
      const invMap = new Map();
      const totalStockMap = new Map();

      invList.forEach(i => {
        const b = (i.branchId || i.MaChiNhanh || '').trim();
        const p = (i.productId || i.MaSanPham || '').trim();
        const s = Number(i.stock !== undefined ? i.stock : (i.SoLuongTon !== undefined ? i.SoLuongTon : 0));
        if (b && p) {
          invMap.set(`${b}_${p}`, i);
        }
        if (p) {
          totalStockMap.set(p, (totalStockMap.get(p) || 0) + s);
        }
      });

      return prods.map(prod => {
        let invItem = null;
        let actualStock = 0;

        if (bId) {
          // Khi xem theo 1 chi nhánh cụ thể, hoặc Quản lý chi nhánh đăng nhập
          invItem = invMap.get(`${bId}_${prod.id}`);
          if (invItem && (invItem.stock !== undefined || invItem.SoLuongTon !== undefined)) {
            actualStock = Number(invItem.stock !== undefined ? invItem.stock : invItem.SoLuongTon);
          } else {
            // Lấy từ getProductStock theo chi nhánh cụ thể
            const s = this.getProductStock(bId, prod.id);
            actualStock = (typeof s === 'number') ? s : 0;
          }
        } else {
          // Admin tối cao xem toàn bộ các chi nhánh, Tổng tồn kho toàn chuỗi
          if (totalStockMap.has(prod.id)) {
            actualStock = totalStockMap.get(prod.id);
          } else {
            actualStock = Number(prod.stock !== undefined ? prod.stock : (prod.SoLuongTon !== undefined ? prod.SoLuongTon : 0));
          }
        }

        const actualPrice = prod.price || prod.GiaBanThucTe || 350000;
        const actualCost = prod.costPrice !== undefined ? prod.costPrice : (prod.GiaNhap !== undefined ? prod.GiaNhap : Math.round(actualPrice * 0.7));

        return {
          id: invItem ? (invItem.id || `inv-${bId || 'all'}-${prod.id}`) : `inv-${bId || 'all'}-${prod.id}`,
          productId: prod.id,
          productName: prod.name || prod.TenSanPham || prod.id,
          brand: prod.brand || 'CHÍNH HÃNG',
          price: actualPrice,
          costPrice: actualCost,
          GiaNhap: actualCost,
          oldPrice: prod.oldPrice || actualCost,
          image: prod.image || prod.HinhAnh || '',
          stock: actualStock,
          minAlert: invItem?.warningThreshold || invItem?.MucCanhBao || invItem?.minAlert || 5,
          isLowStock: actualStock <= (invItem?.warningThreshold || invItem?.MucCanhBao || invItem?.minAlert || 5)
        };
      });
    }

    getStockForBranch(productId, branchId) {
      return this.getProductStock(branchId, productId);
    }

    getProductStock(branchId, productId) {
      const bId = branchId || 'CN01';
      const pId = productId || 'SP01';

      const invList = this.state.inventory || [];
      const item = invList.find(i => 
        (i.branchId === bId || i.MaChiNhanh === bId) && 
        (i.productId === pId || i.MaSanPham === pId)
      );
      if (item) {
        if (typeof item.stock === 'number') return item.stock;
        if (typeof item.SoLuongTon === 'number') return item.SoLuongTon;
        if (item.stock !== undefined) return parseInt(item.stock, 10);
        if (item.SoLuongTon !== undefined) return parseInt(item.SoLuongTon, 10);
      }

      const p = (this.state.products || []).find(it => (it.id === pId || it.MaSanPham === pId));
      if (p) {
        if (typeof p.stock === 'number') return p.stock;
        if (typeof p.SoLuongTon === 'number') return p.SoLuongTon;
      }
      return 0;
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
      const bId = branchId || 'CN01';
      const pId = productId || 'SP01';

      const qty = Math.max(1, parseInt(quantity) || 1);
      if (!this.state.inventory) this.state.inventory = [];
      let item = this.state.inventory.find(i => 
        (i.branchId === bId || i.MaChiNhanh === bId) && 
        (i.productId === pId || i.MaSanPham === pId)
      );

      // Nếu chi nhánh chưa có bản ghi tồn kho cụ thể, khởi tạo từ getProductStock
      if (!item) {
        const curStock = this.getProductStock(bId, pId);
        item = {
          id: `inv-${bId}-${pId}`,
          productId: pId,
          MaSanPham: pId,
          branchId: bId,
          MaChiNhanh: bId,
          stock: curStock,
          SoLuongTon: curStock,
          minAlert: 5
        };
        this.state.inventory.push(item);
      }

      const currentStock = typeof item.stock === 'number' ? item.stock : (Number(item.SoLuongTon) || 0);
      const newStock = Math.max(0, currentStock - qty);
      item.stock = newStock;
      item.SoLuongTon = newStock;

      // Cập nhật tồn kho sản phẩm tương ứng trong state
      const prod = (this.state.products || []).find(p => p.id === pId || p.MaSanPham === pId);
      if (prod) {
        if (typeof prod.stock === 'number') prod.stock = Math.max(0, prod.stock - qty);
        if (typeof prod.SoLuongTon === 'number') prod.SoLuongTon = Math.max(0, prod.SoLuongTon - qty);

        // FEFO & Cận Hạn: Nếu bán hết lô cận hạn, 18 sp của SP01, chuyển sang mức giảm tiếp theo, 10%
        if (prod.nearExpiryStock !== undefined) {
          prod.nearExpiryStock = Math.max(0, prod.nearExpiryStock - qty);
          if (prod.nearExpiryStock <= 0) {
            prod.discountPercent = prod.promoDiscount || 10;
            prod.price = Math.round(prod.originalPrice * (1 - prod.discountPercent / 100));
            prod.promotion = {
              id: 'KM01',
              code: 'KM01',
              name: 'Chào Thu Rực Rỡ',
              discount: prod.discountPercent,
              discountPercent: prod.discountPercent,
              type: 'Giảm giá %'
            };
          }
        }
      }

      this.logAudit('STOCK_DECREMENT', `SP: ${productId} tại ${branchId}`, `Trừ ${qty} sản phẩm. Tồn mới: ${newStock}`);
      this.saveState();

      // Bắn cập nhật đồng bộ tức thời lên Live Server SQL
      if (typeof fetch !== 'undefined') {
        fetch(`${this.liveServerUrl}/inventory/${pId}/stock`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: newStock, branchId: bId })
        }).catch(() => {});
      }
      return true;
    }

    incrementStock(branchId, productId, quantity = 1) {
      const bId = branchId || 'CN01';
      const pId = productId || 'SP01';

      const qty = Math.max(1, parseInt(quantity) || 1);
      if (!this.state.inventory) this.state.inventory = [];
      let item = this.state.inventory.find(i => 
        (i.branchId === bId || i.MaChiNhanh === bId) && 
        (i.productId === pId || i.MaSanPham === pId)
      );

      if (item) {
        const curStock = typeof item.stock === 'number' ? item.stock : (Number(item.SoLuongTon) || 0);
        item.stock = curStock + qty;
        item.SoLuongTon = curStock + qty;
      }

      const prod = (this.state.products || []).find(p => p.id === pId || p.MaSanPham === pId);
      if (prod) {
        if (typeof prod.stock === 'number') prod.stock += qty;
        if (typeof prod.SoLuongTon === 'number') prod.SoLuongTon += qty;

        if (prod.nearExpiryStock !== undefined) {
          prod.nearExpiryStock = Math.min(18, (prod.nearExpiryStock || 0) + qty);
          if (prod.nearExpiryStock > 0) {
            prod.discountPercent = Math.max(prod.nearExpiryDiscount || 40, prod.promoDiscount || 10);
            prod.price = Math.round(prod.originalPrice * (1 - prod.discountPercent / 100));
            prod.promotion = {
              id: 'KM01',
              code: 'KM01',
              name: 'Xả kho cận hạn FEFO (-40%)',
              discount: prod.discountPercent,
              discountPercent: prod.discountPercent,
              type: 'Giảm giá %'
            };
          }
        }
      }

      this.logAudit('STOCK_INCREMENT', `SP: ${productId} tại ${branchId}`, `Cộng hoàn ${qty} sản phẩm.`);
      this.saveState();
      return true;
    }

    updateProductStock(invId, newStock) {
      let inv = (this.state.inventory || []).find(i => i.id === invId);
      let targetBranchId = 'CN01';
      let targetProdId = '';

      if (inv) {
        targetBranchId = inv.branchId || inv.MaChiNhanh || 'CN01';
        targetProdId = inv.productId || inv.MaSanPham || '';
      } else if (invId && invId.startsWith('inv-')) {
        const parts = invId.split('-'); // e.g. inv-CN01-SP90 or inv-all-SP90
        if (parts.length >= 3) {
          targetBranchId = parts[1];
          targetProdId = parts.slice(2).join('-');
        } else {
          targetProdId = parts.slice(1).join('-');
        }
        inv = (this.state.inventory || []).find(i => 
          (i.productId === targetProdId || i.MaSanPham === targetProdId) &&
          (targetBranchId === 'all' || i.branchId === targetBranchId || i.MaChiNhanh === targetBranchId)
        );
        if (!inv) {
          inv = {
            id: invId,
            productId: targetProdId,
            MaSanPham: targetProdId,
            branchId: targetBranchId === 'all' ? 'CN01' : targetBranchId,
            MaChiNhanh: targetBranchId === 'all' ? 'CN01' : targetBranchId,
            stock: 0,
            SoLuongTon: 0,
            minAlert: 5
          };
          if (!this.state.inventory) this.state.inventory = [];
          this.state.inventory.push(inv);
        }
      }
      if (!inv) return false;

      const oldStock = inv.stock !== undefined ? inv.stock : (inv.SoLuongTon || 0);
      const val = Math.max(0, parseInt(newStock) || 0);
      inv.stock = val;
      inv.SoLuongTon = val;

      const pId = inv.productId || inv.MaSanPham || targetProdId;
      const bId = inv.branchId || inv.MaChiNhanh || (targetBranchId === 'all' ? 'CN01' : targetBranchId);

      // Cập nhật lên CSDL SQL Server trực tiếp
      if (typeof fetch !== 'undefined' && this.liveServerUrl && pId) {
        fetch(`${this.liveServerUrl}/inventory/${pId}/stock`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: val, branchId: bId })
        }).catch(() => {});
      }

      this.logAudit('UPDATE_STOCK', `Kho [${bId}]: ${pId}`, `Đổi số lượng: ${oldStock} -> ${val}`);
      this.saveState();
      return true;
    }

    // -----------------------------------------------------------------------
    // GIỎ HÀNG & ĐƠN HÀNG ONLINE / QUẦY POS, ATOMIC CHECKOUT
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
      return products.find(p => p.id === productId || p.MaSanPham === productId) || null;
    }

    async addProduct(productData) {
      if (!productData || !productData.name || !productData.price) {
        throw new Error('Dữ liệu sản phẩm không hợp lệ.');
      }
      let maxSpNum = 0;
      (this.state.products || []).forEach(p => {
        const m = (p.id || p.MaSanPham || '').match(/^SP0*(\d+)$/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxSpNum) maxSpNum = n;
        }
      });
      const nextId = productData.id || `SP${String(maxSpNum + 1).padStart(2, '0')}`;
      const price = Number(productData.price);
      const costPrice = Number(productData.costPrice !== undefined ? productData.costPrice : (productData.GiaNhap !== undefined ? productData.GiaNhap : Math.round(price * 0.7)));
      const newProd = {
        id: productData.id || nextId,
        MaSanPham: productData.id || nextId,
        name: productData.name.trim(),
        TenSanPham: productData.name.trim(),
        brand: productData.brand || 'CHÍNH HÃNG',
        price: price,
        costPrice: costPrice,
        GiaNhap: costPrice,
        oldPrice: Number(productData.oldPrice || costPrice),
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
      await this.syncProductToLiveServer(newProd);
      return newProd;
    }

    async updateProduct(productId, updates) {
      const p = this.getProductById(productId);
      if (!p) return false;
      Object.assign(p, updates);
      if (updates.name) p.TenSanPham = updates.name;
      if (updates.brand) p.brand = updates.brand;
      if (updates.price) {
        p.price = Number(updates.price);
        p.GiaBanThucTe = Number(updates.price);
      }
      if (updates.costPrice !== undefined) {
        p.costPrice = Number(updates.costPrice);
        p.GiaNhap = Number(updates.costPrice);
      }
      if (updates.oldPrice !== undefined) {
        p.oldPrice = Number(updates.oldPrice);
        p.originalPrice = Number(updates.oldPrice);
        p.GiaBan = Number(updates.oldPrice);
      }
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
      await this.syncUpdateProductToLiveServer(productId, updates);
      return p;
    }

    async deleteProduct(productId) {
      const idx = (this.state.products || []).findIndex(p => p.id === productId || p.MaSanPham === productId);
      if (idx === -1) return false;
      const removed = this.state.products.splice(idx, 1)[0];
      if (this.state.inventory) {
        this.state.inventory = this.state.inventory.filter(i => i.productId !== productId);
      }
      this.logAudit('DELETE_PRODUCT', `Sản phẩm: #${productId}`, `Xóa sản phẩm: ${removed.name || removed.TenSanPham}`);
      this.saveState();
      await this.syncDeleteProductToLiveServer(productId);
      return true;
    }

    async addReceipt(receiptData) {
      if (!receiptData) throw new Error('Dữ liệu phiếu nhập kho không hợp lệ.');
      let maxPnNum = 0;
      (this.state.receipts || []).forEach(r => {
        const m = (r.id || r.MaPhieuNhap || '').match(/^PN0*(\d+)$/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxPnNum) maxPnNum = n;
        }
      });
      const nextId = receiptData.id || `PN${String(maxPnNum + 1).padStart(2, '0')}`;
      const newReceipt = {
        id: nextId,
        MaPhieuNhap: nextId,
        branchId: receiptData.branchId || 'CN01',
        MaChiNhanh: receiptData.branchId || 'CN01',
        supplierId: receiptData.supplierId || 'NCC01',
        MaNhaCungCap: receiptData.supplierId || 'NCC01',
        supplierName: receiptData.supplierName || 'Nhà Cung Cấp',
        staffId: receiptData.staffId || 'NV01',
        MaNhanVien: receiptData.staffId || 'NV01',
        staffName: receiptData.staffName || 'Quản lý chi nhánh',
        createdDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        NgayLap: new Date().toISOString().replace('T', ' ').substring(0, 19),
        total: parseFloat(receiptData.total || 0),
        TongTien: parseFloat(receiptData.total || 0),
        status: receiptData.status || 'Đã duyệt',
        TrangThai: receiptData.status || 'Đã duyệt',
        itemCount: (receiptData.items || []).length || 1,
        items: receiptData.items || []
      };
      if (!this.state.receipts) this.state.receipts = [];
      this.state.receipts.unshift(newReceipt);
      this.saveState();
      await this.syncReceiptToLiveServer(newReceipt);
      return newReceipt;
    }

    getCartUserId() {
      const u = this.getCurrentUser();
      return (u && (u.id || u.MaKhachHang || u.username)) ? String(u.id || u.MaKhachHang || u.username) : 'guest';
    }

    getCart() {
      if (!this.state.cartsByUser || typeof this.state.cartsByUser !== 'object') {
        this.state.cartsByUser = {};
        if (Array.isArray(this.state.cart) && this.state.cart.length > 0) {
          this.state.cartsByUser['guest'] = [...this.state.cart];
        }
      }
      const uid = this.getCartUserId();
      if (!Array.isArray(this.state.cartsByUser[uid])) {
        this.state.cartsByUser[uid] = [];
      }
      this.state.cart = this.state.cartsByUser[uid];
      return this.state.cartsByUser[uid];
    }

    addToCart(productId, qty = 1) {
      const prod = this.getProductById(productId);
      if (!prod) return;

      // Lô đã hết hạn (QT05, "Thu hồi tiêu hủy") không được bán trên giao diện khách
      if (prod.isExpired || (prod.daysLeft !== null && prod.daysLeft !== undefined && prod.daysLeft <= 0) || (prod.daysRemaining !== null && prod.daysRemaining !== undefined && prod.daysRemaining <= 0)) {
        if (typeof window.UICommon !== 'undefined' && typeof window.UICommon.showToast === 'function') {
          window.UICommon.showToast('Lô hàng đã hết hạn (Thu hồi tiêu hủy), không được bán trên giao diện khách!', 'error');
        }
        return false;
      }

      const cart = this.getCart();
      const existing = cart.find(item => item.productId === productId);
      if (existing) {
        existing.qty += qty;
      } else {
        const fefoDisc = prod.fefoDiscount || prod.nearExpiryDiscount || 0;
        cart.push({
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          originalPrice: prod.originalPrice || prod.GiaNiemYetGoc || prod.GiaBan || prod.price,
          image: prod.image,
          brand: prod.brand,
          badge: fefoDisc > 0 ? `Cận hạn -${fefoDisc}%` : (prod.badge || (prod.discountPercent > 0 ? `Giảm ${prod.discountPercent}%` : '')),
          PhanTramGiam: prod.discountPercent || prod.PhanTramGiam || 0,
          fefoDiscount: fefoDisc,
          promoDiscount: prod.promoDiscount || 0,
          isNearExpiry: Boolean(prod.isNearExpiry || fefoDisc > 0),
          daysRemaining: prod.daysRemaining !== undefined ? prod.daysRemaining : prod.daysLeft,
          qty
        });
      }
      const uid = this.getCartUserId();
      this.state.cartsByUser[uid] = cart;
      this.state.cart = cart;
      this.saveState();
      this.notify('CART_UPDATED', cart);
    }

    updateCartQty(productId, qty) {
      let cart = this.getCart();
      if (qty <= 0) {
        cart = cart.filter(item => item.productId !== productId);
      } else {
        const item = cart.find(i => i.productId === productId);
        if (item) item.qty = qty;
      }
      const uid = this.getCartUserId();
      this.state.cartsByUser[uid] = cart;
      this.state.cart = cart;
      this.saveState();
      this.notify('CART_UPDATED', cart);
    }

    clearCart() {
      const uid = this.getCartUserId();
      if (!this.state.cartsByUser) this.state.cartsByUser = {};
      this.state.cartsByUser[uid] = [];
      this.state.cart = [];
      this.saveState();
      this.notify('CART_UPDATED', []);
    }

    getOrders() {
      return this.state.orders || [];
    }

    getReviews() {
      return this.state.reviews || [];
    }

    getReviewByOrderId(orderId) {
      if (!orderId) return null;
      const reviews = this.getReviews();
      const norm = String(orderId).trim().toLowerCase();
      return reviews.find(r => 
        (r.orderId && String(r.orderId).trim().toLowerCase() === norm) || 
        (r.MaDonHang && String(r.MaDonHang).trim().toLowerCase() === norm)
      ) || null;
    }

    async submitOrderReview({ orderId, rating, comment, customerId, customerName, customerPhone }) {
      const cleanKhId = customerId ? String(customerId).replace(/^TK_/, '') : null;
      const payload = {
        orderId,
        rating: Number(rating) || 5,
        comment: (comment || '').trim() || 'Sản phẩm rất tốt và đóng gói cẩn thận!',
        customerId: cleanKhId,
        customerName,
        customerPhone
      };

      try {
        const res = await fetch(`${this.liveServerUrl}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || (data && data.success === false)) {
          throw new Error(data.message || data.error || 'Lỗi khi gửi đánh giá đơn hàng!');
        }

        const reviewData = data.review || {
          id: 'DG' + Date.now(),
          orderId,
          rating: payload.rating,
          comment: payload.comment,
          customerName: customerName || 'Khách Hàng',
          date: new Date().toISOString()
        };

        if (!this.state.reviews) this.state.reviews = [];
        const norm = String(orderId).trim().toLowerCase();
        const existingIdx = this.state.reviews.findIndex(r => 
          (r.orderId && String(r.orderId).trim().toLowerCase() === norm) || 
          (r.MaDonHang && String(r.MaDonHang).trim().toLowerCase() === norm)
        );
        if (existingIdx >= 0) {
          this.state.reviews[existingIdx] = { ...this.state.reviews[existingIdx], ...reviewData };
        } else {
          this.state.reviews.unshift(reviewData);
        }
        this.saveState();
        this.notify('REVIEW_SUBMITTED', reviewData);
        return { success: true, message: data.message || 'Đánh giá thành công!', review: reviewData };
      } catch (err) {
        console.error('[REVIEW ERROR]', err);
        return { success: false, error: err.message };
      }
    }

    getReviewByBookingId(bookingId) {
      if (!bookingId) return null;
      const reviews = this.getReviews();
      const norm = String(bookingId).trim().toLowerCase();
      return reviews.find(r => 
        (r.bookingId && String(r.bookingId).trim().toLowerCase() === norm) || 
        (r.MaLichHen && String(r.MaLichHen).trim().toLowerCase() === norm)
      ) || null;
    }

    async submitBookingReview({ bookingId, rating, comment, customerId, customerName, customerPhone }) {
      const cleanKhId = customerId ? String(customerId).replace(/^TK_/, '') : null;
      const payload = {
        bookingId,
        rating: Number(rating) || 5,
        comment: (comment || '').trim() || 'Dịch vụ cắt tóc và tạo kiểu rất đẹp, thợ chu đáo!',
        customerId: cleanKhId,
        customerName,
        customerPhone
      };

      try {
        const res = await fetch(`${this.liveServerUrl}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || (data && data.success === false)) {
          throw new Error(data.message || data.error || 'Lỗi khi gửi đánh giá lịch hẹn!');
        }

        const reviewData = data.review || {
          id: 'DG' + Date.now(),
          bookingId,
          rating: payload.rating,
          comment: payload.comment,
          customerName: customerName || 'Khách Hàng',
          date: new Date().toISOString()
        };

        if (!this.state.reviews) this.state.reviews = [];
        const norm = String(bookingId).trim().toLowerCase();
        const existingIdx = this.state.reviews.findIndex(r => 
          (r.bookingId && String(r.bookingId).trim().toLowerCase() === norm) || 
          (r.MaLichHen && String(r.MaLichHen).trim().toLowerCase() === norm)
        );
        if (existingIdx >= 0) {
          this.state.reviews[existingIdx] = { ...this.state.reviews[existingIdx], ...reviewData };
        } else {
          this.state.reviews.unshift(reviewData);
        }
        this.saveState();
        this.notify('REVIEW_SUBMITTED', reviewData);
        return { success: true, message: data.message || 'Đánh giá thành công!', review: reviewData };
      } catch (err) {
        console.error('[BOOKING REVIEW ERROR]', err);
        return { success: false, error: err.message };
      }
    }

    async payBooking(bookingId) {
      if (!bookingId) return { success: false };
      const norm = String(bookingId).trim().toLowerCase();
      const booking = (this.state.bookings || []).find(b => 
        (b.id && String(b.id).trim().toLowerCase() === norm) || 
        (b.bookingCode && String(b.bookingCode).trim().toLowerCase() === norm) || 
        (b.MaLichHen && String(b.MaLichHen).trim().toLowerCase() === norm)
      );
      if (booking) {
        booking.paymentStatus = 'Paid';
        booking.TrangThaiThanhToan = 'Đã thanh toán';
        this.saveState();
        this.syncBookingStatusToLiveServer(booking.id, booking.status, { paymentStatus: 'Paid', TrangThaiThanhToan: 'Đã thanh toán' }).catch(() => {});
        this.notify('BOOKING_UPDATED', booking);
        return { success: true, booking };
      }
      return { success: false };
    }

    async createOrder(orderData) {
      const branch = this.getBranchById(orderData.branchId) || this.getCurrentBranch();

      // Sinh mã đơn hàng chuẩn định dạng CSDL SQL Server, DH01 -> DH11 -> DH12...
      let orderCode = orderData.orderCode || orderData.id;
      if (!orderCode || !orderCode.startsWith('DH')) {
        const existingDh = (this.state.orders || [])
          .map(o => (o.id || o.orderCode || o.MaDonHang || ''))
          .filter(code => /^DH\d+$/i.test(code));
        let maxDhNum = 10;
        existingDh.forEach(code => {
          const num = parseInt(code.replace(/^DH/i, ''), 10);
          if (num > maxDhNum) maxDhNum = num;
        });
        orderCode = 'DH' + (maxDhNum + 1 < 10 ? '0' + (maxDhNum + 1) : (maxDhNum + 1));
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

      const isPickup = orderData.deliveryType === 'PICKUP_BRANCH' || 
                       (orderData.shippingAddress && orderData.shippingAddress.toLowerCase().includes('quầy')) || 
                       (orderData.deliveryAddress && orderData.deliveryAddress.toLowerCase().includes('chi nhánh'));

      const newOrder = {
        id: orderCode,
        orderCode,
        MaDonHang: orderCode,
        userId: orderData.userId || this.getCurrentUser()?.id || null,
        branchId: branch ? branch.id : 'CN01',
        branchName: branch ? branch.name : 'Omni Salon HQ',
        deliveryType: isPickup ? 'PICKUP_BRANCH' : 'DELIVERY',
        orderType: orderData.orderType || (isPickup ? 'STORE_PICKUP' : 'ONLINE_DELIVERY'),
        customerName: orderData.customerName || 'Khách Hàng',
        customerPhone: orderData.customerPhone || '',
        shippingAddress: orderData.shippingAddress || (isPickup ? `Nhận tại quầy chi nhánh ${branch ? branch.name : 'OMNI'}` : 'Giao tận nơi'),
        items: orderData.items || [],
        totalAmount,
        discountAmount,
        voucherCode: orderData.voucherCode || null,
        paymentMethod: orderData.paymentMethod || (isPickup ? 'Thanh toán tại quầy' : 'COD'),
        paymentStatus: orderData.paymentStatus || 'Unpaid',
        orderStatus: orderData.orderStatus || 'Processing',
        createdAt: new Date().toISOString()
      };

      // Gửi lên live server xác thực tồn kho trước
      const syncResult = await this.syncOrderToLiveServer(newOrder);
      if (syncResult && syncResult.success === false) {
        return { error: syncResult.error || 'Tồn kho không đủ đáp ứng số lượng yêu cầu!' };
      }

      // Trừ kho từng sản phẩm sau khi server chấp thuận
      if (Array.isArray(orderData.items)) {
        orderData.items.forEach(it => {
          this.decrementStock(branch ? branch.id : 'CN01', it.productId || it.id, it.qty || it.quantity || 1);
        });
      }

      if (!this.state.orders) this.state.orders = [];
      this.state.orders.unshift(newOrder);
      this.clearCart();

      this.logAudit('CREATE_ORDER', `Đơn: #${newOrder.orderCode}`, `Tổng: ${SalonUtils.formatCurrency(newOrder.totalAmount)}`);
      this.saveState();
      return newOrder;
    }

    async cancelOrder(orderId, reason = 'Khách hàng yêu cầu hủy đơn') {
      const cleanId = String(orderId || '').replace(/^#+/, '').trim().toLowerCase();
      const order = (this.state.orders || []).find(o => 
        String(o.id || '').replace(/^#+/, '').trim().toLowerCase() === cleanId || 
        String(o.orderCode || '').replace(/^#+/, '').trim().toLowerCase() === cleanId || 
        String(o.MaDonHang || '').replace(/^#+/, '').trim().toLowerCase() === cleanId
      );
      if (!order) return { success: false, error: 'Không tìm thấy đơn hàng cần hủy!' };

      if (order.orderStatus === 'Cancelled' || order.TrangThai === 'Đã hủy') {
        return { success: false, error: 'Đơn hàng này đã được hủy trước đó!' };
      }

      const serverRes = await this.syncCancelOrderToLiveServer(order.id || order.orderCode, reason);
      if (serverRes && serverRes.success === false && !serverRes.error?.includes('Không tìm thấy')) {
        return { success: false, error: serverRes.error || 'Máy chủ từ chối yêu cầu hủy đơn hàng!' };
      }

      order.orderStatus = 'Cancelled';
      order.TrangThai = 'Đã hủy';
      order.cancelReason = reason;

      // Hoàn lại tồn kho cho sản phẩm
      if (Array.isArray(order.items)) {
        order.items.forEach(it => {
          this.incrementStock(order.branchId || 'CN01', it.productId || it.id, it.qty || it.quantity || 1);
        });
      }

      this.logAudit('CANCEL_ORDER', `Đơn: #${order.orderCode || order.id}`, `Lý do: ${reason}`);
      this.saveState();
      return { success: true, message: `Đã hủy đơn hàng #${order.orderCode || order.id} thành công!` };
    }

    async confirmOrderPayment(orderId, paymentMethod = 'VietQR') {
      const norm = String(orderId).trim().toLowerCase();
      const order = (this.state.orders || []).find(o => 
        (o.id && String(o.id).trim().toLowerCase() === norm) || 
        (o.orderCode && String(o.orderCode).trim().toLowerCase() === norm) ||
        (o.MaDonHang && String(o.MaDonHang).trim().toLowerCase() === norm)
      );

      if (!order) return { success: false, error: 'Không tìm thấy đơn hàng trong hệ thống!' };

      order.paymentStatus = 'Paid';
      order.TrangThai = 'Đã thanh toán';
      order.orderStatus = (order.orderStatus === 'Pending' || order.orderStatus === 'Chờ xác nhận') ? 'Processing' : (order.orderStatus || 'Processing');
      order.paymentMethod = paymentMethod || order.paymentMethod || 'VietQR';
      order.paidAt = new Date().toISOString();

      // Lập bản ghi hóa đơn trong state nếu chưa có
      const invoiceId = `HD-ORD-${order.id || order.orderCode}`;
      if (!this.state.invoices) this.state.invoices = [];
      const existingInv = this.state.invoices.find(i => i.MaDonHang === (order.id || order.orderCode) || i.id === invoiceId);
      if (!existingInv) {
        this.state.invoices.unshift({
          id: invoiceId,
          MaHoaDon: invoiceId,
          MaDonHang: order.id || order.orderCode,
          MaKhachHang: order.userId || order.customerId || 'KH01',
          MaChiNhanh: order.branchId || 'CN01',
          NgayLap: new Date().toISOString(),
          TongTien: Number(order.totalAmount || 0),
          TrangThai: 'Đã thanh toán',
          MaSoHoaDon: `HD-${order.id || order.orderCode}`,
          services: [],
          products: order.items || [],
          payment: {
            paymentMethod: paymentMethod,
            amount: Number(order.totalAmount || 0),
            status: 'SUCCESS'
          }
        });
      }

      this.logAudit('ORDER_PAYMENT', `Đơn: #${order.orderCode || order.id}`, `Xác nhận thanh toán ${paymentMethod}: ${SalonUtils.formatCurrency(order.totalAmount)}`);
      this.saveState();

      // Đồng bộ trực tiếp vào SQL Server backend
      try {
        const res = await fetch(`${this.liveServerUrl}/orders/${order.id || order.orderCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentStatus: 'Paid',
            status: order.orderStatus,
            paymentMethod: paymentMethod,
            totalAmount: order.totalAmount
          })
        });
        const data = await res.json().catch(() => ({}));
        return { success: true, message: data.message || `Đã xác nhận thanh toán đơn #${order.orderCode || order.id}!`, order };
      } catch (err) {
        console.warn('[CONFIRM PAYMENT SERVER SYNC]', err.message);
        return { success: true, message: `Đã xác nhận thanh toán đơn #${order.orderCode || order.id}!`, order };
      }
    }

    async updateOrderStatus(orderId, newStatus, notes = '') {
      const norm = String(orderId).trim().toLowerCase();
      const order = (this.state.orders || []).find(o => 
        (o.id && String(o.id).trim().toLowerCase() === norm) || 
        (o.orderCode && String(o.orderCode).trim().toLowerCase() === norm) ||
        (o.MaDonHang && String(o.MaDonHang).trim().toLowerCase() === norm)
      );

      if (!order) return { success: false, error: 'Không tìm thấy đơn hàng trong hệ thống!' };

      let normalizedStatus = 'Processing';
      let vietnameseStatus = 'Đang xử lý';

      const sLow = (newStatus || '').toLowerCase();
      if (sLow === 'pending' || sLow.includes('chờ')) {
        normalizedStatus = 'Pending';
        vietnameseStatus = 'Chờ xử lý';
      } else if (sLow === 'processing' || sLow.includes('đóng gói') || sLow.includes('xử lý')) {
        normalizedStatus = 'Processing';
        vietnameseStatus = 'Đang xử lý';
      } else if (sLow === 'delivering' || sLow === 'shipping' || (sLow.includes('giao') && !sLow.includes('đã giao'))) {
        normalizedStatus = 'Delivering';
        vietnameseStatus = 'Đang giao';
      } else if (sLow === 'completed' || sLow === 'delivered' || sLow.includes('hoàn tất') || sLow.includes('đã giao')) {
        normalizedStatus = 'Completed';
        vietnameseStatus = 'Đã giao';
      } else if (sLow === 'cancelled' || sLow.includes('hủy')) {
        normalizedStatus = 'Cancelled';
        vietnameseStatus = 'Đã hủy';
      }

      order.orderStatus = normalizedStatus;
      order.TrangThai = vietnameseStatus;
      if (notes) order.notes = notes;

      this.logAudit('UPDATE_ORDER_STATUS', `Đơn: #${order.orderCode || order.id}`, `Chuyển tiến trình: ${vietnameseStatus} (${normalizedStatus})`);
      this.saveState();
      this.notify('ORDER_STATUS_UPDATED', order);

      // Kênh đồng bộ BroadcastChannel tức thì sang tab khách hàng và mobile app
      if (this.syncChannel) {
        try {
          this.syncChannel.postMessage({ type: 'DATA_UPDATED', entity: 'ORDER', orderId: order.id, status: normalizedStatus });
        } catch (_) {}
      }

      // Đồng bộ trực tiếp vào SQL Server backend qua API PUT
      try {
        const res = await fetch(`${this.liveServerUrl}/orders/${order.id || order.orderCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: vietnameseStatus,
            orderStatus: normalizedStatus,
            notes: notes || order.notes || ''
          })
        });
        const data = await res.json().catch(() => ({}));
        return { success: true, message: data.message || `Đã cập nhật tiến trình đơn #${order.orderCode || order.id} sang "${vietnameseStatus}"!`, order };
      } catch (err) {
        console.warn('[UPDATE ORDER STATUS SERVER SYNC]', err.message);
        return { success: true, message: `Đã cập nhật tiến trình đơn #${order.orderCode || order.id} sang "${vietnameseStatus}"!`, order };
      }
    }

    // -----------------------------------------------------------------------
    // QUẢN LÝ CA LÀM & ĐĂNG KÝ CA LÀM NHÂN VIÊN, THỢ BARBER & THU NGÂN
    // -----------------------------------------------------------------------
    getStaffShifts(userId = null) {
      if (!this.state.staffShifts) {
        // Khởi tạo một số ca mẫu nếu chưa có
        this.state.staffShifts = [
          {
            id: 'shift-01',
            userId: 'user_nv01',
            staffName: 'Đỗ Đình Độ',
            role: 'STYLIST',
            branchId: 'CN01',
            branchName: 'Omni Salon Barber Q1 - Bến Thành',
            shiftType: 'CA_SANG',
            shiftName: 'Ca Sáng (08:30 - 14:30)',
            date: new Date().toISOString().split('T')[0],
            status: 'ACTIVE',
            note: 'Phục vụ khách cắt tóc theo lịch hẹn'
          },
          {
            id: 'shift-02',
            userId: 'user_nv02',
            staffName: 'Lê Hoàng Hải',
            role: 'BRANCH_MANAGER',
            branchId: 'CN01',
            branchName: 'Omni Salon Barber Q1 - Bến Thành',
            shiftType: 'FULL_DAY',
            shiftName: 'Ca Trực Quản Lý (08:00 - 20:30)',
            date: new Date().toISOString().split('T')[0],
            status: 'ACTIVE',
            note: 'Điều hành ca và tiếp đón khách'
          },
          {
            id: 'shift-03',
            userId: 'user_nv61',
            staffName: 'Nguyễn Thảo My',
            role: 'CASHIER',
            branchId: 'CN01',
            branchName: 'Omni Salon Barber Q1 - Bến Thành',
            shiftType: 'CA_SANG',
            shiftName: 'Ca Thu Ngân Sáng (08:30 - 15:00)',
            date: new Date().toISOString().split('T')[0],
            status: 'ACTIVE',
            note: 'Phụ trách máy POS và in hóa đơn thanh toán'
          }
        ];
      }
      if (!userId) return this.state.staffShifts;
      return this.state.staffShifts.filter(s => s.userId === userId);
    }

    registerStaffShift(shiftData) {
      if (!this.state.staffShifts) this.state.staffShifts = [];
      const newShift = {
        id: `shift-${Date.now()}`,
        userId: shiftData.userId || 'staff',
        staffName: shiftData.staffName || 'Nhân viên',
        role: shiftData.role || 'STYLIST',
        branchId: shiftData.branchId || 'CN01',
        branchName: shiftData.branchName || 'Omni Salon',
        shiftType: shiftData.shiftType || 'CA_SANG',
        shiftName: shiftData.shiftName || 'Ca Sáng (08:30 - 14:30)',
        date: shiftData.date || new Date().toISOString().split('T')[0],
        status: 'REGISTERED',
        note: shiftData.note || 'Đăng ký ca trực quầy / phục vụ khách',
        registeredAt: new Date().toISOString()
      };
      this.state.staffShifts.unshift(newShift);
      this.saveState();
      this.logAudit('REGISTER_SHIFT', `Nhân sự: ${newShift.staffName}`, `Đăng ký ${newShift.shiftName} ngày ${newShift.date}`);
      this.syncRegisterShiftToLiveServer(newShift);
      return newShift;
    }

    /**
     * Tạo hóa đơn quầy POS (Khách cắt tóc + Mua sản phẩm sáp vuốt trực tiếp)
     */
    async createPosOrder(posData) {
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

      // Sinh mã hóa đơn quầy POS chuẩn CSDL SQL Server, HD01 -> HD03 -> HD11...
      let orderCode = posData.orderCode || posData.id;
      if (!orderCode || !orderCode.startsWith('HD')) {
        const existingHd = (this.state.invoices || []).concat(this.state.orders || [])
          .map(o => (o.id || o.orderCode || o.MaHoaDon || ''))
          .filter(code => /^HD\d+$/i.test(code));
        let maxNum = 2;
        existingHd.forEach(code => {
          const num = parseInt(code.replace(/^HD/i, ''), 10);
          if (num > maxNum) maxNum = num;
        });
        orderCode = 'HD' + (maxNum + 1 < 10 ? '0' + (maxNum + 1) : (maxNum + 1));
      }

      const stObj = posData.stylistId ? this.getStylistById(posData.stylistId) : null;
      const stylistName = posData.stylistName || (stObj ? stObj.name : 'Master Barber');
      const posOrder = {
        id: orderCode,
        orderCode,
        MaHoaDon: orderCode,
        userId: posData.userId || null,
        branchId: posData.branchId,
        orderType: 'POS_COUNTER',
        customerName: posData.customerName || 'Khách Cắt Quầy',
        customerPhone: posData.customerPhone || '0900000000',
        stylistId: posData.stylistId || null,
        stylistName: stylistName,
        services: posData.services || [],
        items: posData.items || [],
        subtotal,
        discountAmount,
        totalAmount,
        voucherCode: posData.voucherCode || null,
        paymentMethod: posData.paymentMethod || 'Counter_Cash',
        paymentStatus: 'Paid',
        orderStatus: 'Completed',
        cashierId: this.getCurrentUser()?.id || 'NV61',
        createdAt: new Date().toISOString()
      };

      if (!this.state.orders) this.state.orders = [];
      this.state.orders.unshift(posOrder);

      this.logAudit('POS_CHECKOUT', `Hóa đơn quầy: #${orderCode}`, `Thu ngân xuất đơn: ${SalonUtils.formatCurrency(posOrder.totalAmount)}`);
      this.saveState();
      await this.syncPosCheckoutToLiveServer(posOrder);
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
    // BÁO CÁO THỐNG KÊ DOANH THU & HOA HỒNG THỢ
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

      // Doanh số sản phẩm bán lẻ, Đơn hàng trực tuyến + bán lẻ quầy POS
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

      // Biểu đồ 7 ngày gom nhóm theo ngày trong tuần thực tế, Phân rã Dịch Vụ & Bán Lẻ
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
    // THÔNG BÁO & AUDIT TRAIL
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
    // CONTENT & MEDIA QUERIES, ARTICLES, MOMENTS, COLLABS, HAIRSTYLES
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

    getSuppliers() {
      return this.state.suppliers || [];
    }

    getSupplierById(supplierId) {
      return (this.state.suppliers || []).find(s => s.id === supplierId || s.MaNhaCungCap === supplierId) || null;
    }

    getDiscountRules() {
      return this.state.discountRules || [];
    }

    getDiscountRuleById(ruleId) {
      return (this.state.discountRules || []).find(r => r.id === ruleId || r.MaQuyTac === ruleId) || null;
    }

    getReceipts(branchId = null) {
      const list = this.state.receipts || [];
      if (!branchId || String(branchId).toLowerCase() === 'all') return list;
      return list.filter(r => r.branchId === branchId || r.MaChiNhanh === branchId);
    }

    getReceiptById(receiptId) {
      return (this.state.receipts || []).find(r => r.id === receiptId || r.MaPhieuNhap === receiptId) || null;
    }

    getInvoices(branchId = null) {
      const list = this.state.invoices || [];
      if (!branchId || String(branchId).toLowerCase() === 'all') return list;
      return list.filter(inv => inv.branchId === branchId || inv.MaChiNhanh === branchId);
    }

    getInvoiceById(invoiceId) {
      return (this.state.invoices || []).find(inv => inv.id === invoiceId || inv.MaHoaDon === invoiceId) || null;
    }

    getPayments(invoiceId = null) {
      const list = this.state.payments || [];
      if (!invoiceId) return list;
      return list.filter(p => p.invoiceId === invoiceId || p.MaHoaDon === invoiceId);
    }

    getFefoLots(branchId = null) {
      const list = this.state.fefoLots || [];
      if (!branchId || String(branchId).toLowerCase() === 'all') return list;
      return list.filter(l => l.branchId === branchId || l.MaChiNhanh === branchId);
    }

    getLowStockWarnings(branchId = null) {
      const list = this.state.lowStockWarnings || [];
      if (!branchId || String(branchId).toLowerCase() === 'all') return list;
      return list.filter(w => w.branchId === branchId || w.MaChiNhanh === branchId);
    }

    getShifts(branchId = null, staffId = null) {
      let list = this.state.shifts || [];
      if (branchId && String(branchId).toLowerCase() !== 'all') {
        list = list.filter(s => s.branchId === branchId || s.MaChiNhanh === branchId);
      }
      if (staffId) {
        list = list.filter(s => s.userId === staffId || s.MaNhanVien === staffId);
      }
      return list;
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

    async syncUpdateServiceToLiveServer(serviceId, updates) {
      try {
        await fetch(`/api/services/${serviceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (_) {}
    }

    async syncComboToLiveServer(combo) {
      if (typeof fetch === 'undefined') return;
      try {
        const res = await fetch(`${this.liveServerUrl}/combos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(combo)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.combo && data.combo.id) {
            combo.id = data.combo.id;
            combo.MaCombo = data.combo.id;
            this.saveState();
          }
        }
      } catch (_) { }
    }

    async syncDeleteComboToLiveServer(comboId) {
      if (typeof fetch === 'undefined') return;
      try {
        await fetch(`${this.liveServerUrl}/combos/${comboId}`, {
          method: 'DELETE'
        });
      } catch (_) { }
    }

    async syncUpdateComboToLiveServer(comboId, updates) {
      try {
        await fetch(`/api/combos/${comboId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (_) {}
    }

    async syncRegisterShiftToLiveServer(shiftData) {
      try {
        const res = await fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shiftData)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.shift && data.shift.MaCa) {
            shiftData.id = data.shift.MaCa;
            shiftData.MaCa = data.shift.MaCa;
            this.saveState();
          }
        }
      } catch (_) {}
    }

    login(identifier, password) {
      if (window.Auth && typeof window.Auth.login === 'function') {
        const res = window.Auth.login(identifier, password);
        if (res && res.success && res.user) {
          this.state.currentUser = res.user;
          const uid = this.getCartUserId();
          if (!this.state.cartsByUser) this.state.cartsByUser = {};
          if (!this.state.cartsByUser[uid]) this.state.cartsByUser[uid] = [];
          this.state.cart = this.state.cartsByUser[uid];
          this.saveState();

          if (window.BookingPage && typeof window.BookingPage.resetBookingState === 'function') {
            window.BookingPage.resetBookingState();
          }

          this.notify('AUTH_CHANGED', res.user);
          this.notify('CART_UPDATED', this.state.cart);
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
      this.state.cart = (this.state.cartsByUser && this.state.cartsByUser['guest']) ? this.state.cartsByUser['guest'] : [];
      this.saveState();

      if (window.BookingPage && typeof window.BookingPage.resetBookingState === 'function') {
        window.BookingPage.resetBookingState();
      }

      this.notify('AUTH_CHANGED', null);
      this.notify('CART_UPDATED', this.state.cart);
      return { success: true };
    }
  }

  // Khởi tạo Singleton
  const storeInstance = new SalonStore();
  window.SalonStore = storeInstance;
  window.store = storeInstance;

})(typeof window !== 'undefined' ? window : this);

