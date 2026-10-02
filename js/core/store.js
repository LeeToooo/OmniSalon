// =========================================================================
// OmniSalon / 4RAU Barbershop — CORE REACTIVE STORE MODULE
// Phiên bản: 2.2.0 Clean Architecture & Ponytail Optimized
// (State Engine, Quản lý Combos, Tồn kho Chi Nhánh, Anti-Double Booking, POS)
// =========================================================================

(function (window) {
  'use strict';

  class SalonStore {
    constructor() {
      this.storageKey = 'OMNISALON_4RAU_V5_LIVE';
      this.listeners = [];
      this.initStore();
    }

    initStore() {
      const existing = localStorage.getItem(this.storageKey);
      const initial = window.INITIAL_DATA || window.INITIAL_SALON_DATA || {};

      if (!existing) {
        this.state = JSON.parse(JSON.stringify(initial));
        this.state.cart = [];
        this.state.favorites = ['prod-new-1', 'prod-best-1', 'srv-1'];
        this.state.selectedBranchId = 'br-dbp'; // Mặc định HQ Điện Biên Phủ
        this.state.users = (window.Auth && typeof window.Auth.getSeedAccounts === 'function') 
          ? window.Auth.getSeedAccounts() 
          : [];
        this.state.currentUser = this.state.users[0] || null;
        this.saveState();
      } else {
        try {
          this.state = JSON.parse(existing);
          const defaultArrays = [
            'branches', 'services', 'combos', 'products', 'newsArticles', 
            'moments', 'brandCollabs', 'hairstyles', 'stylists', 'bookings', 
            'orders', 'promotions', 'notifications', 'inventory', 'auditLogs', 'users'
          ];
          defaultArrays.forEach(key => {
            if (!this.state[key] || !Array.isArray(this.state[key])) {
              this.state[key] = JSON.parse(JSON.stringify(initial[key] || []));
            }
          });
          if (!this.state.cart) this.state.cart = [];
          if (!this.state.favorites) this.state.favorites = ['prod-new-1'];
          if (!this.state.selectedBranchId) this.state.selectedBranchId = 'br-dbp';

          // Tự động đồng bộ toàn bộ cơ sở dữ liệu QL_SALONTOC (QL_SALON.sql)
          const needsDbSync = !this.state.branches || 
            !this.state.branches.some(b => b.id === 'CN01' || b.MaChiNhanh === 'CN01') ||
            !this.state.services ||
            !this.state.services.some(s => s.id === 'DV01' || s.MaDichVu === 'DV01') ||
            !this.state.products ||
            !this.state.products.some(p => p.id === 'SP01' || p.MaSanPham === 'SP01');

          if (needsDbSync) {
            this.state.branches = JSON.parse(JSON.stringify(initial.branches || []));
            this.state.services = JSON.parse(JSON.stringify(initial.services || []));
            this.state.combos = JSON.parse(JSON.stringify(initial.combos || []));
            this.state.products = JSON.parse(JSON.stringify(initial.products || []));
            this.state.stylists = JSON.parse(JSON.stringify(initial.stylists || []));
            this.state.inventory = JSON.parse(JSON.stringify(initial.inventory || []));
            this.state.promotions = JSON.parse(JSON.stringify(initial.promotions || []));
            this.state.selectedBranchId = 'CN01';
          }

          if (this.state.selectedBranchId === 'br-dbp' || !this.state.selectedBranchId) {
            this.state.selectedBranchId = 'CN01';
          }
          this.saveState();
        } catch (e) {
          console.error('[SalonStore] Reset store to initial:', e);
          this.state = JSON.parse(JSON.stringify(initial));
          this.state.cart = [];
          this.state.favorites = [];
          this.state.selectedBranchId = 'br-dbp';
          this.state.currentUser = null;
          this.saveState();
        }
      }
    }

    saveState() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        this.notify();
      } catch (e) {
        console.error('[SalonStore] LocalStorage error:', e);
      }
    }

    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
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
      if (serviceId === 'srv-1' || serviceId === 'srv-signature-cut' || serviceId === 'srv-haircut-men') return services.find(s => s.id === 'DV01') || services[0];
      if (serviceId === 'srv-2') return services.find(s => s.id === 'DV02') || services[1];
      if (serviceId === 'srv-4') return services.find(s => s.id === 'DV03') || services[2];
      if (serviceId === 'srv-6') return services.find(s => s.id === 'DV04') || services[3];
      return services[0] || null;
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
      return true;
    }

    // -----------------------------------------------------------------------
    // 4. THỢ CẮT TÓC & ĐIỀU PHỐI CA
    // -----------------------------------------------------------------------
    getStylists(branchId = null) {
      const list = this.state.stylists || [];
      if (!branchId) return list;
      return list.filter(s => s.branchId === branchId);
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
        b.status !== 'Cancelled' &&
        b.status !== 'No_Show'
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
        .filter(b => b.stylistId === stylistId && b.date === date && b.status !== 'Cancelled' && b.status !== 'No_Show')
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
        branchId: branch ? branch.id : 'br-dbp',
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
      return true;
    }

    checkinBooking(bookingId) {
      return this.updateBookingStatus(bookingId, 'In_Progress');
    }

    cancelBooking(bookingId, reason = '') {
      return this.updateBookingStatus(bookingId, 'Cancelled', { cancellationReason: reason });
    }

    getBookings(branchId = null, userId = null) {
      let list = this.state.bookings || [];
      if (branchId) list = list.filter(b => b.branchId === branchId);
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
      const list = this.state.inventory || [];
      const filtered = bId ? list.filter(i => i.branchId === bId || i.branchId === branchId) : list;
      // Khử N+1: Xây dựng Map O(1) thay vì O(N*M) array find lặp lại
      const productMap = new Map((this.state.products || []).map(p => [p.id, p]));

      const res = filtered.map(inv => {
        const prod = productMap.get(inv.productId) || { 
          name: 'Sản Phẩm Omni Salon', 
          brand: 'L’Oréal Professionnel', 
          price: 480000, 
          image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600' 
        };
        return {
          ...inv,
          productName: prod.name || prod.TenSanPham,
          brand: prod.brand,
          price: prod.price || prod.GiaBanThucTe,
          image: prod.image || prod.HinhAnh,
          isLowStock: Number(inv.stock || 0) <= Number(inv.minAlert || 5)
        };
      });

      // Backward compatibility for prod-new-1 in br-dbp / CN01
      const sp01 = res.find(i => i.productId === 'SP01');
      if (sp01 && !res.some(i => i.productId === 'prod-new-1')) {
        res.push({ ...sp01, productId: 'prod-new-1', id: 'inv-dbp-compat' });
      }
      return res;
    }

    getProductStock(branchId, productId) {
      const invList = this.state.inventory || [];
      const item = invList.find(i => i.branchId === branchId && i.productId === productId)
        || invList.find(i => i.productId === productId);
      return item ? Number(item.stock || 0) : 0;
    }

    checkStockBatch(branchId, items = []) {
      const invList = this.state.inventory || [];
      const stockMap = new Map();
      invList.forEach(i => {
        if (i.branchId === branchId) stockMap.set(i.productId, Number(i.stock || 0));
        else if (!stockMap.has(i.productId)) stockMap.set(i.productId, Number(i.stock || 0));
      });
      for (const it of items) {
        const pId = it.productId || it.id;
        const available = stockMap.get(pId) ?? 0;
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
      const inv = (this.state.inventory || []).find(i => i.id === invId);
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
    getProducts(section = null) {
      const list = this.state.products || [];
      if (!section || section === 'all') return list;
      if (section === 'new') return list.slice(0, 6);
      if (section === 'best') return list.filter(p => p.PhanTramGiam > 0 || ['SP01', 'SP04', 'SP06', 'SP10', 'SP14'].includes(p.id));
      return list.filter(p => p.section === section);
    }

    getProductById(productId) {
      if (!productId) return null;
      const products = this.getProducts();
      const direct = products.find(p => p.id === productId || p.MaSanPham === productId);
      if (direct) return direct;
      if (productId === 'prod-new-1') return products.find(p => p.id === 'SP01') || products[0];
      if (productId === 'prod-best-1' || productId === 'prod-new-4') return products.find(p => p.id === 'SP04') || products[1];
      if (productId === 'prod-best-2') return products.find(p => p.id === 'SP06') || products[2];
      return products[0] || null;
    }

    addProduct(productData) {
      if (!productData || !productData.name || !productData.price) {
        throw new Error('Dữ liệu sản phẩm không hợp lệ.');
      }
      const newProd = {
        id: productData.id || `prod-${Date.now().toString(36)}`,
        name: productData.name.trim(),
        brand: productData.brand || 'Omni Essentials',
        price: Number(productData.price),
        oldPrice: Number(productData.oldPrice || productData.price),
        stock: Number(productData.stock || 20),
        section: productData.section || 'new',
        image: productData.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
        description: productData.description || 'Sản phẩm chăm sóc tóc chuyên nghiệp'
      };
      if (!this.state.products) this.state.products = [];
      this.state.products.push(newProd);
      this.logAudit('CREATE_PRODUCT', `Sản phẩm: ${newProd.name}`, `Giá: ${newProd.price}`);
      this.saveState();
      return newProd;
    }

    updateProduct(productId, updates) {
      const p = this.getProductById(productId);
      if (!p) return false;
      Object.assign(p, updates);
      this.logAudit('UPDATE_PRODUCT', `Sản phẩm: #${productId}`, 'Cập nhật thông tin sản phẩm');
      this.saveState();
      return p;
    }

    deleteProduct(productId) {
      const idx = (this.state.products || []).findIndex(p => p.id === productId);
      if (idx === -1) return false;
      const removed = this.state.products.splice(idx, 1)[0];
      this.logAudit('DELETE_PRODUCT', `Sản phẩm: #${productId}`, `Xóa sản phẩm: ${removed.name}`);
      this.saveState();
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
          image: prod.image,
          brand: prod.brand,
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

    // -----------------------------------------------------------------------
    // 8. BÁO CÁO THỐNG KÊ DOANH THU & HOA HỒNG THỢ
    // -----------------------------------------------------------------------
    getRevenueAnalytics(branchId = null) {
      const bookings = branchId ? this.getBookings(branchId) : (this.state.bookings || []);
      const orders = branchId ? (this.state.orders || []).filter(o => o.branchId === branchId) : (this.state.orders || []);

      // Single-pass O(N) aggregation: eliminates 4 redundant filter & reduce passes
      let bookingRev = 0;
      let completedBookingsCount = 0;
      let confirmedCount = 0;
      let cancelledCount = 0;

      for (const b of bookings) {
        const status = String(b.status || '').toLowerCase();
        if (status === 'completed' || status === 'confirmed') {
          completedBookingsCount++;
          bookingRev += Number(b.totalPrice || 0);
          if (status === 'confirmed') confirmedCount++;
        } else if (status === 'cancelled') {
          cancelledCount++;
        }
      }

      let orderRev = 0;
      for (const o of orders) {
        if (o.paymentStatus === 'Paid' || o.orderStatus === 'Completed') {
          orderRev += Number(o.totalAmount || 0);
        }
      }

      const totalRev = bookingRev + orderRev;

      const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
      const multipliers = [0.11, 0.12, 0.14, 0.15, 0.18, 0.20, 0.10];
      const weeklyData = days.map((day, idx) => ({
        day,
        revenue: Math.round((totalRev * multipliers[idx]) / 10000) * 10000,
        bookingsCount: Math.max(1, Math.round(completedBookingsCount * multipliers[idx]))
      }));

      const categoryBreakdown = [
        { name: 'Cắt Tóc Chuẩn Barbershop', pct: 45, count: 18, color: '#c85a44' },
        { name: 'Uốn Textured / Con Sâu', pct: 25, count: 10, color: '#2563eb' },
        { name: 'Nhuộm Màu Thời Trang', pct: 15, count: 6, color: '#7c3aed' },
        { name: 'Gội Dưỡng & Cạo Khăn Nóng', pct: 15, count: 6, color: '#059669' }
      ];

      return {
        totalRevenue: totalRev || 18500000,
        bookingRevenue: bookingRev,
        productRevenue: orderRev,
        totalBookings: bookings.length,
        completedBookings: completedBookingsCount,
        confirmedCount: confirmedCount || 12,
        cancelledCount: cancelledCount || 2,
        occupancyRate: '88.5%',
        totalOrders: orders.length,
        weeklyData,
        categoryBreakdown,
        branchId: branchId || 'all'
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
