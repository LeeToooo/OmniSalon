// OmniSalon Reactive Store Engine — Chuẩn 100% Kiến Trúc Kỹ Thuật (CNTT-KLCN039)
// Quản lý trạng thái: Đa Chi Nhánh, Kho Chi Nhánh, Chống Trùng Lịch, Tư Vấn AI, Thông Báo & Audit Logs

class SalonStore {
  constructor() {
    this.storageKey = 'OMNI_SALON_MEN_V4';
    this.listeners = [];
    this.initStore();
  }

  initStore() {
    const existing = localStorage.getItem(this.storageKey);
    const initial = window.INITIAL_DATA || {};

    if (!existing) {
      this.state = JSON.parse(JSON.stringify(initial));
      this.state.cart = [];
      this.state.favorites = ['srv-1', 'srv-2', 'cmb-1', 'prod-1'];
      this.state.selectedBranchId = 'br-1';
      this.state.users = [
        {
          id: 'usr-1',
          name: 'Nguyễn Văn Hải',
          email: 'khachhang@gmail.com',
          phone: '0908123456',
          password: '123',
          role: 'customer',
          tier: 'VIP Diamond'
        },
        {
          id: 'usr-admin',
          name: 'Quản Lý Salon (Admin)',
          email: 'admin@omnisalon.vn',
          phone: '0988889999',
          password: 'admin',
          role: 'admin',
          tier: 'Giám Đốc Vận Hành'
        }
      ];
      this.state.currentUser = this.state.users[0]; // Logged in as customer by default
      this.saveState();
    } else {
      try {
        this.state = JSON.parse(existing);
        // Ensure all enterprise collections exist (schema migration)
        const defaults = ['branches', 'services', 'combos', 'hairstyles', 'products', 'inventory', 'stylists', 'shifts', 'bookings', 'orders', 'promotions', 'hairConsultations', 'notifications', 'auditLogs', 'customers'];
        defaults.forEach(key => {
          if (!this.state[key] || !Array.isArray(this.state[key])) {
            this.state[key] = JSON.parse(JSON.stringify(initial[key] || []));
          }
        });
        if (!this.state.cart) this.state.cart = [];
        if (!this.state.favorites) this.state.favorites = ['srv-1', 'prod-1'];
        if (!this.state.selectedBranchId) this.state.selectedBranchId = 'br-1';
        if (!this.state.users || this.state.users.length === 0) {
          this.state.users = [
            { id: 'usr-1', name: 'Nguyễn Văn Hải', email: 'khachhang@gmail.com', phone: '0908123456', password: '123', role: 'customer', tier: 'VIP Diamond' },
            { id: 'usr-admin', name: 'Quản Lý Salon (Admin)', email: 'admin@omnisalon.vn', phone: '0988889999', password: 'admin', role: 'admin', tier: 'Giám Đốc Vận Hành' }
          ];
        }
        if (!this.state.currentUser) {
          this.state.currentUser = this.state.users[0];
        }
      } catch (e) {
        console.error('Failed to parse store, resetting to initial', e);
        this.state = JSON.parse(JSON.stringify(initial));
        this.state.cart = [];
        this.state.favorites = [];
        this.state.selectedBranchId = 'br-1';
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
      console.error('LocalStorage write error', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.state); } catch (err) { console.error('Listener error', err); }
    });
  }

  // ==========================================
  // 1. CHI NHÁNH (BRANCHES)
  // ==========================================
  getBranches() {
    return this.state.branches || [];
  }

  getCurrentBranch() {
    const branches = this.getBranches();
    return branches.find(b => b.id === this.state.selectedBranchId) || branches[0] || null;
  }

  setSelectedBranch(branchId) {
    const exists = this.getBranches().find(b => b.id === branchId);
    if (exists) {
      this.state.selectedBranchId = branchId;
      this.saveState();
      this.logAudit('CHANGE_ACTIVE_BRANCH', `Chi nhánh: ${exists.name}`, `Người dùng chọn chi nhánh hoạt động`);
    }
  }

  addBranch(branch) {
    branch.id = 'br-' + Date.now();
    this.state.branches.push(branch);
    this.saveState();
    this.logAudit('ADD_BRANCH', `Chi nhánh: ${branch.name}`, `Thêm cơ sở mới vào chuỗi salon`);
    return branch;
  }

  // ==========================================
  // 2. AUTHENTICATION & RBAC ROLES
  // ==========================================
  getCurrentUser() {
    return this.state.currentUser || null;
  }

  login(email, password) {
    const user = (this.state.users || []).find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (user) {
      this.state.currentUser = user;
      this.saveState();
      this.logAudit('USER_LOGIN', `Tài khoản: ${user.email}`, `Đăng nhập thành công với vai trò ${user.role}`);
      return { success: true, user };
    }
    return { success: false, message: 'Email hoặc mật khẩu không chính xác' };
  }

  register(name, email, phone, password) {
    const existing = (this.state.users || []).find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      return { success: false, message: 'Email này đã được đăng ký tài khoản' };
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password,
      role: 'customer',
      tier: 'Standard Member'
    };

    this.state.users.push(newUser);
    this.state.currentUser = newUser;

    // Create in customers CRM as well
    if (!this.state.customers) this.state.customers = [];
    this.state.customers.unshift({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: 'customer',
      tier: 'Thành Viên Mới',
      totalSpent: 0,
      totalVisits: 0,
      lastVisit: 'Chưa có',
      preferredStylist: 'Tùy chọn'
    });

    this.saveState();
    this.logAudit('USER_REGISTER', `Tài khoản: ${newUser.email}`, `Đăng ký tài khoản khách hàng mới`);
    return { success: true, user: newUser };
  }

  logout() {
    const user = this.state.currentUser;
    if (user) {
      this.logAudit('USER_LOGOUT', `Tài khoản: ${user.email}`, `Đăng xuất khỏi hệ thống`);
    }
    this.state.currentUser = null;
    this.saveState();
  }

  // ==========================================
  // 3. YÊU THÍCH (FAVORITES)
  // ==========================================
  getFavorites() {
    return this.state.favorites || [];
  }

  toggleFavorite(itemId) {
    if (!this.state.favorites) this.state.favorites = [];
    const idx = this.state.favorites.indexOf(itemId);
    if (idx > -1) {
      this.state.favorites.splice(idx, 1);
    } else {
      this.state.favorites.push(itemId);
    }
    this.saveState();
  }

  // ==========================================
  // 4. DỊCH VỤ & BẢNG GIÁ COMBO (SERVICES & COMBOS)
  // ==========================================
  getServices() {
    return this.state.services || [];
  }

  getCombos() {
    return this.state.combos || [];
  }

  getAllServiceOfferings() {
    return [...this.getServices(), ...this.getCombos()];
  }

  addService(service) {
    service.id = 'srv-' + Date.now();
    service.rating = 5.0;
    service.reviewsCount = 1;
    this.state.services.unshift(service);
    this.saveState();
    this.logAudit('CREATE_SERVICE', `Dịch vụ: ${service.name}`, `Giá: ${service.price.toLocaleString('vi-VN')}đ`);
    return service;
  }

  updateService(serviceId, updatedFields) {
    let target = this.state.services.find(s => s.id === serviceId);
    let isCombo = false;
    if (!target) {
      target = this.state.combos.find(c => c.id === serviceId);
      isCombo = true;
    }

    if (target) {
      Object.assign(target, updatedFields);
      this.saveState();
      this.logAudit('UPDATE_SERVICE', `${isCombo ? 'Combo' : 'Dịch vụ'}: ${target.name}`, `Cập nhật thông tin/bảng giá`);
      return target;
    }
    return null;
  }

  deleteService(serviceId) {
    const srv = this.state.services.find(s => s.id === serviceId);
    const cmb = this.state.combos.find(c => c.id === serviceId);
    const name = srv?.name || cmb?.name || serviceId;

    this.state.services = this.state.services.filter(s => s.id !== serviceId);
    this.state.combos = this.state.combos.filter(c => c.id !== serviceId);
    this.saveState();
    this.logAudit('DELETE_SERVICE', `Mục: ${name}`, `Xóa khỏi menu dịch vụ`);
  }

  // ==========================================
  // 5. MẪU TÓC 3D & TƯ VẤN AI (HAIRSTYLES & AI TRY-ON)
  // ==========================================
  getHairstyles() {
    return this.state.hairstyles || [];
  }

  getHairConsultations() {
    return this.state.hairConsultations || [];
  }

  saveHairConsultation(data) {
    const user = this.getCurrentUser();
    const newConsultation = {
      id: 'ai-c-' + Date.now(),
      userId: user ? user.id : 'guest',
      customerName: user ? user.name : (data.customerName || 'Khách Trực Tuyến'),
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      ...data
    };

    if (!this.state.hairConsultations) this.state.hairConsultations = [];
    this.state.hairConsultations.unshift(newConsultation);

    // Create notification
    this.addNotification({
      userId: user ? user.id : 'guest',
      title: '💇 Tư Vấn Kiểu Tóc Thành Công',
      content: `AI gợi ý kiểu [${data.selectedStyle}] phù hợp gương mặt ${data.faceShape} (${data.matchScore}% Match). Bạn có thể đặt lịch ngay!`,
      type: 'ai_consultation'
    });

    this.saveState();
    return newConsultation;
  }

  // ==========================================
  // 6. STYLIST & PHÂN CA (STAFF & SHIFTS)
  // ==========================================
  getStylists(branchId = null) {
    const list = this.state.stylists || [];
    if (branchId) {
      return list.filter(s => s.branchId === branchId);
    }
    return list;
  }

  getShifts(branchId = null) {
    const list = this.state.shifts || [];
    if (branchId) {
      return list.filter(sh => sh.branchId === branchId);
    }
    return list;
  }

  addShift(shift) {
    shift.id = 'sh-' + Date.now();
    shift.status = 'active';
    this.state.shifts.push(shift);
    this.saveState();
    this.logAudit('ADD_SHIFT', `Stylist: ${shift.stylistName}`, `Phân ca: ${shift.shift} ngày ${shift.date}`);
    return shift;
  }

  deleteShift(shiftId) {
    this.state.shifts = this.state.shifts.filter(s => s.id !== shiftId);
    this.saveState();
    this.logAudit('DELETE_SHIFT', `Ca: #${shiftId}`, `Hủy phân ca làm việc`);
  }

  // ==========================================
  // 7. NGHIỆP VỤ ĐẶT LỊCH & CHỐNG TRÙNG LỊCH (DOUBLE-BOOKING PREVENTION)
  // ==========================================
  getBookings(branchId = null) {
    const list = this.state.bookings || [];
    if (branchId) {
      return list.filter(b => b.branchId === branchId);
    }
    return list;
  }

  // Kiểm tra khung giờ trống: Chống trùng lịch 100%
  getAvailableSlots(date, stylistId, branchId = null, excludeBookingId = null) {
    const allSlots = ['08:30', '09:30', '10:30', '11:30', '13:30', '14:30', '15:30', '16:30', '17:30', '18:30', '19:30'];
    const existing = (this.state.bookings || []).filter(b => 
      b.date === date && 
      b.stylistId === stylistId && 
      (!branchId || b.branchId === branchId) &&
      b.status !== 'cancelled' &&
      (!excludeBookingId || b.id !== excludeBookingId)
    );
    const bookedTimes = existing.map(b => b.timeSlot);
    
    return allSlots.map(time => ({
      time,
      available: !bookedTimes.includes(time)
    }));
  }

  addBooking(bookingData) {
    // Validate double-booking on server/store side
    const isConflict = (this.state.bookings || []).some(b => 
      b.date === bookingData.date &&
      b.stylistId === bookingData.stylistId &&
      b.timeSlot === bookingData.timeSlot &&
      b.status !== 'cancelled'
    );

    if (isConflict) {
      throw new Error(`Khung giờ ${bookingData.timeSlot} ngày ${bookingData.date} của Stylist này vừa được đặt. Vui lòng chọn giờ khác!`);
    }

    const branch = this.getBranches().find(br => br.id === (bookingData.branchId || this.state.selectedBranchId)) || this.getCurrentBranch();

    const newBooking = {
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      branchId: branch ? branch.id : 'br-1',
      branchName: branch ? branch.name : 'OmniSalon Flagship',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'confirmed',
      review: null,
      ...bookingData
    };

    if (!this.state.bookings) this.state.bookings = [];
    this.state.bookings.unshift(newBooking);

    // Auto notification for customer
    const user = this.getCurrentUser();
    this.addNotification({
      userId: user ? user.id : 'guest',
      title: '✅ Đặt Lịch Hẹn Thành Công',
      content: `Lịch hẹn #${newBooking.id} [${newBooking.serviceName}] tại ${newBooking.branchName} vào lúc ${newBooking.timeSlot} ngày ${newBooking.date} đã được xác nhận.`,
      type: 'booking_confirmed'
    });

    // Auto notification for Admin
    this.addNotification({
      userId: 'usr-admin',
      title: '📅 Lịch Hẹn Mới Chờ Phục Vụ',
      content: `Khách hàng ${newBooking.customerName} (${newBooking.customerPhone}) vừa đặt lịch #${newBooking.id} với Stylist ${newBooking.stylistName}.`,
      type: 'admin_booking'
    });

    // Audit log
    this.logAudit('CREATE_BOOKING', `Lịch: #${newBooking.id}`, `Khách: ${newBooking.customerName} - Dịch vụ: ${newBooking.serviceName}`);

    this.saveState();
    return newBooking;
  }

  updateBookingStatus(bookingId, status) {
    const b = this.state.bookings.find(item => item.id === bookingId);
    if (b) {
      const oldStatus = b.status;
      b.status = status;

      // Notify customer of status change
      const statusText = {
        'confirmed': 'Đã xác nhận',
        'in_progress': 'Đang thực hiện dịch vụ',
        'completed': 'Đã hoàn tất',
        'cancelled': 'Đã hủy'
      }[status] || status;

      this.addNotification({
        userId: 'usr-1',
        title: `🔔 Trạng Thái Lịch Hẹn #${b.id}`,
        content: `Lịch hẹn của bạn đã chuyển sang trạng thái: [${statusText}].`,
        type: 'booking_status'
      });

      this.logAudit('UPDATE_BOOKING_STATUS', `Lịch #${b.id}`, `Đổi trạng thái: ${oldStatus} -> ${status}`);
      this.saveState();
    }
  }

  rescheduleBooking(bookingId, newDate, newTimeSlot) {
    const b = this.state.bookings.find(item => item.id === bookingId);
    if (!b) return null;

    // Check slot conflict
    const isConflict = (this.state.bookings || []).some(item => 
      item.id !== bookingId &&
      item.date === newDate &&
      item.stylistId === b.stylistId &&
      item.timeSlot === newTimeSlot &&
      item.status !== 'cancelled'
    );

    if (isConflict) {
      throw new Error(`Khung giờ ${newTimeSlot} ngày ${newDate} đã kín chỗ! Vui lòng chọn giờ khác.`);
    }

    const oldDate = `${b.timeSlot} ${b.date}`;
    b.date = newDate;
    b.timeSlot = newTimeSlot;
    b.status = 'confirmed';

    this.addNotification({
      userId: 'usr-1',
      title: '🕒 Lịch Hẹn Đã Được Đổi Giờ',
      content: `Lịch hẹn #${b.id} đã dời từ [${oldDate}] sang [${newTimeSlot} ${newDate}].`,
      type: 'booking_rescheduled'
    });

    this.logAudit('RESCHEDULE_BOOKING', `Lịch #${b.id}`, `Đổi từ ${oldDate} sang ${newTimeSlot} ${newDate}`);
    this.saveState();
    return b;
  }

  addReview(bookingId, rating, comment) {
    const b = this.state.bookings.find(item => item.id === bookingId);
    if (b) {
      b.review = {
        rating: parseInt(rating),
        comment: comment.trim(),
        reviewedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

      this.logAudit('CUSTOMER_REVIEW', `Lịch #${b.id}`, `Khách đánh giá ${rating}★: "${comment.trim()}"`);
      this.saveState();
      return b.review;
    }
    return null;
  }

  // ==========================================
  // 8. SẢN PHẨM & TỒN KHO CHI NHÁNH (PRODUCTS & INVENTORY)
  // ==========================================
  getProducts() {
    return this.state.products || [];
  }

  getBranchStock(productId, branchId = null) {
    const brId = branchId || this.state.selectedBranchId;
    const inv = (this.state.inventory || []).find(i => i.productId === productId && i.branchId === brId);
    return inv ? inv.stock : 0;
  }

  getTotalProductStock(productId) {
    return (this.state.inventory || [])
      .filter(i => i.productId === productId)
      .reduce((sum, i) => sum + i.stock, 0);
  }

  getInventory(branchId = null) {
    const products = this.getProducts();
    const inventory = this.state.inventory || [];
    const brId = branchId || this.state.selectedBranchId;

    return products.map(prod => {
      const invRecord = inventory.find(i => i.productId === prod.id && i.branchId === brId);
      const stock = invRecord ? invRecord.stock : 0;
      const minAlert = invRecord ? invRecord.minAlert : 5;
      return {
        ...prod,
        stock,
        minAlert,
        isLowStock: stock <= minAlert,
        branchId: brId
      };
    });
  }

  updateProductStock(productId, branchId, addQty) {
    let invRecord = (this.state.inventory || []).find(i => i.productId === productId && i.branchId === branchId);
    if (!invRecord) {
      invRecord = {
        id: 'inv-' + Date.now(),
        productId,
        branchId,
        stock: 0,
        minAlert: 5
      };
      this.state.inventory.push(invRecord);
    }

    invRecord.stock = Math.max(0, invRecord.stock + parseInt(addQty));
    const prod = this.getProducts().find(p => p.id === productId);
    const branch = this.getBranches().find(b => b.id === branchId);

    this.logAudit('STOCK_UPDATE', `Kho: ${prod?.name || productId}`, `${branch?.name}: Số lượng thay đổi ${addQty > 0 ? '+' : ''}${addQty} (Còn ${invRecord.stock})`);

    // Check low stock trigger
    if (invRecord.stock <= invRecord.minAlert) {
      this.addNotification({
        userId: 'usr-admin',
        title: '⚠️ Báo Động Hết Hàng Trong Kho',
        content: `Sản phẩm [${prod?.name}] tại ${branch?.name} chỉ còn ${invRecord.stock} hộp/lọ! Cần nhập thêm ngay.`,
        type: 'inventory_alert'
      });
    }

    this.saveState();
  }

  // ==========================================
  // 9. GIỎ HÀNG & BÁN LẺ POS (CART & ORDERS)
  // ==========================================
  getCart() {
    return this.state.cart || [];
  }

  addToCart(productId, qty = 1) {
    const prod = this.state.products.find(p => p.id === productId);
    if (!prod) return;

    const existingIndex = this.state.cart.findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
      this.state.cart[existingIndex].qty += qty;
    } else {
      this.state.cart.push({
        productId: prod.id,
        name: prod.name,
        price: prod.price,
        image: prod.image,
        brand: prod.brand,
        qty: qty
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
    const branch = this.getCurrentBranch();
    const newOrder = {
      id: 'ORD-' + Math.floor(100 + Math.random() * 900),
      branchId: branch ? branch.id : 'br-1',
      branchName: branch ? branch.name : 'OmniSalon Flagship',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'Completed',
      ...orderData
    };

    // Auto deduct inventory from active branch
    newOrder.items.forEach(item => {
      this.updateProductStock(item.productId, newOrder.branchId, -item.qty);
    });

    if (!this.state.orders) this.state.orders = [];
    this.state.orders.unshift(newOrder);

    this.clearCart();

    this.logAudit('CREATE_ORDER', `Đơn hàng: #${newOrder.id}`, `Tổng tiền: ${newOrder.totalAmount.toLocaleString('vi-VN')}đ - Thanh toán: ${newOrder.paymentMethod}`);
    this.saveState();
    return newOrder;
  }

  getOrders(branchId = null) {
    const list = this.state.orders || [];
    if (branchId) {
      return list.filter(o => o.branchId === branchId);
    }
    return list;
  }

  // ==========================================
  // 10. KHUYẾN MÃI (PROMOTIONS)
  // ==========================================
  getPromotions() {
    return this.state.promotions || [];
  }

  addPromotion(promo) {
    if (!this.state.promotions) this.state.promotions = [];
    this.state.promotions.unshift(promo);
    this.saveState();
    this.logAudit('CREATE_PROMOTION', `Mã: ${promo.code}`, `Giảm: ${promo.discountValue}${promo.discountType === 'percent' ? '%' : 'đ'}`);
    return promo;
  }

  deletePromotion(code) {
    this.state.promotions = this.state.promotions.filter(p => p.code !== code);
    this.saveState();
    this.logAudit('DELETE_PROMOTION', `Mã: ${code}`, `Xóa mã khuyến mãi`);
  }

  applyPromoCode(code, amount) {
    const promo = (this.state.promotions || []).find(p => p.code.toUpperCase() === code.trim().toUpperCase());
    if (!promo) return { valid: false, message: 'Mã giảm giá không tồn tại' };

    if (amount < promo.minOrder) {
      return { valid: false, message: `Áp dụng cho đơn từ ${promo.minOrder.toLocaleString('vi-VN')}đ` };
    }

    let discount = 0;
    if (promo.discountType === 'percent') {
      discount = (amount * promo.discountValue) / 100;
    } else {
      discount = promo.discountValue;
    }

    return {
      valid: true,
      code: promo.code,
      discount: discount,
      finalAmount: Math.max(0, amount - discount),
      message: `Đã áp dụng mã ${promo.code}`
    };
  }

  // ==========================================
  // 11. THÔNG BÁO & AUDIT LOGGING
  // ==========================================
  getNotifications(userId = null) {
    const list = this.state.notifications || [];
    if (userId) {
      return list.filter(n => n.userId === userId || n.userId === 'guest' || n.userId === 'all');
    }
    return list;
  }

  getUnreadNotificationsCount(userId = null) {
    return this.getNotifications(userId).filter(n => !n.isRead).length;
  }

  markNotificationAsRead(notifId) {
    const notif = (this.state.notifications || []).find(n => n.id === notifId);
    if (notif) {
      notif.isRead = true;
      this.saveState();
    }
  }

  markAllNotificationsAsRead(userId = null) {
    this.getNotifications(userId).forEach(n => { n.isRead = true; });
    this.saveState();
  }

  addNotification(notifData) {
    const newNotif = {
      id: 'notif-' + Date.now() + Math.floor(Math.random() * 100),
      isRead: false,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      ...notifData
    };
    if (!this.state.notifications) this.state.notifications = [];
    this.state.notifications.unshift(newNotif);
    this.saveState();
    return newNotif;
  }

  getAuditLogs() {
    return this.state.auditLogs || [];
  }

  logAudit(action, entity, details) {
    const user = this.getCurrentUser();
    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      operatorName: user ? `${user.name} (${user.role})` : 'Hệ Thống Tự Động',
      action,
      entity,
      details
    };
    if (!this.state.auditLogs) this.state.auditLogs = [];
    this.state.auditLogs.unshift(newLog);
    // Limit to 200 logs to prevent memory bloat
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs.pop();
    }
  }

  // ==========================================
  // 12. KHÁCH HÀNG CRM
  // ==========================================
  getCustomers() {
    return this.state.customers || [];
  }

  // ==========================================
  // 13. BÁO CÁO & THỐNG KÊ (ANALYTICS)
  // ==========================================
  getAnalyticsData(branchId = null) {
    const bookings = this.getBookings(branchId);
    const orders = this.getOrders(branchId);
    const products = this.getProducts();
    const stylists = this.getStylists(branchId);

    const bookingRev = bookings
      .filter(b => b.status === 'completed' || b.status === 'confirmed' || b.status === 'in_progress')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const orderRev = orders
      .filter(o => o.status === 'Completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const totalRevenue = bookingRev + orderRev;

    const serviceCounts = {};
    bookings.forEach(b => {
      serviceCounts[b.serviceName] = (serviceCounts[b.serviceName] || 0) + 1;
    });

    const stylistPerf = stylists.map(st => {
      const count = bookings.filter(b => b.stylistId === st.id).length;
      return {
        id: st.id,
        name: st.name,
        branchId: st.branchId,
        count: count,
        rating: st.rating
      };
    });

    const inventoryList = this.getInventory(branchId);
    const lowStockProducts = inventoryList.filter(p => p.isLowStock);

    return {
      totalRevenue,
      bookingRev,
      orderRev,
      totalBookings: bookings.length,
      activeProducts: products.length,
      lowStockProducts,
      popularServices: Object.entries(serviceCounts).map(([name, count]) => ({ name, count })),
      stylistPerf
    };
  }

  resetToDefault() {
    localStorage.removeItem(this.storageKey);
    this.initStore();
    this.notify();
  }
}

window.store = new SalonStore();
