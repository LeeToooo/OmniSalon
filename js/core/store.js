// =========================================================================
// OmniSalon / 4RAU Barbershop — CORE STORE MODULE
// (Reactive State Engine, Chống Trùng Lịch, Giỏ Hàng, POS, Auth, LocalStorage)
// =========================================================================

class SalonStore {
  constructor() {
    this.storageKey = 'OMNISALON_4RAU_V5_LIVE';
    this.listeners = [];
    this.initStore();
  }

  initStore() {
    const existing = localStorage.getItem(this.storageKey);
    const initial = INITIAL_SALON_DATA;

    if (!existing) {
      this.state = JSON.parse(JSON.stringify(initial));
      this.state.cart = [];
      this.state.favorites = ['prod-new-1', 'prod-best-1', 'srv-1'];
      this.state.selectedBranchId = 'br-dbp'; // Mặc định là chi nhánh Điện Biên Phủ HQ
      this.state.users = [
        {
          id: 'usr-1',
          name: 'Nguyễn Văn Hải',
          email: 'khachhang@gmail.com',
          phone: '0908123456',
          password: '123',
          role: 'customer',
          tier: 'VIP 4RAU Member'
        },
        {
          id: 'usr-admin',
          name: 'Chủ Tịch Hà Hiền (Admin)',
          email: 'admin@4raubarbershop.com',
          phone: '19004407',
          password: 'admin',
          role: 'admin',
          tier: 'Founder & CEO'
        }
      ];
      this.state.currentUser = this.state.users[0];
      this.saveState();
    } else {
      try {
        this.state = JSON.parse(existing);
        const defaults = ['branches', 'services', 'combos', 'products', 'newsArticles', 'moments', 'brandCollabs', 'hairstyles', 'stylists', 'bookings', 'orders', 'promotions', 'notifications', 'inventory', 'auditLogs'];
        defaults.forEach(key => {
          if (!this.state[key] || !Array.isArray(this.state[key])) {
            this.state[key] = JSON.parse(JSON.stringify(initial[key] || []));
          }
        });
        if (!this.state.cart) this.state.cart = [];
        if (!this.state.favorites) this.state.favorites = ['prod-new-1'];
        if (!this.state.selectedBranchId) this.state.selectedBranchId = 'br-dbp';
        if (!this.state.users || this.state.users.length === 0) {
          this.state.users = [
            { id: 'usr-1', name: 'Nguyễn Văn Hải', email: 'khachhang@gmail.com', phone: '0908123456', password: '123', role: 'customer', tier: 'VIP Member' },
            { id: 'usr-admin', name: 'Chủ Tịch Hà Hiền (Admin)', email: 'admin@4raubarbershop.com', phone: '19004407', password: 'admin', role: 'admin', tier: 'Founder' }
          ];
        }
        if (!this.state.currentUser) this.state.currentUser = this.state.users[0];
      } catch (e) {
        console.error('Reset store to initial', e);
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
      console.error('LocalStorage error', e);
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
      try { fn(this.state); } catch (err) { console.error('Listener err', err); }
    });
  }

  // --- Chi nhánh ---
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
      this.logAudit('CHANGE_BRANCH', `Chi nhánh: ${exists.name}`, 'Đổi chi nhánh phục vụ');
    }
  }

  // --- Xác thực ---
  getCurrentUser() {
    return this.state.currentUser || null;
  }

  login(email, password) {
    const user = (this.state.users || []).find(
      u => (u.email.toLowerCase() === email.trim().toLowerCase() || u.phone === email.trim()) && u.password === password
    );
    if (user) {
      this.state.currentUser = user;
      this.saveState();
      this.logAudit('LOGIN', `Tài khoản: ${user.email}`, `Đăng nhập vai trò ${user.role}`);
      return { success: true, user };
    }
    return { success: false, message: 'Sai thông tin tài khoản hoặc mật khẩu' };
  }

  register(name, email, phone, password) {
    const existing = (this.state.users || []).find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() || u.phone === phone.trim()
    );
    if (existing) {
      return { success: false, message: 'Email hoặc Số điện thoại này đã tồn tại' };
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role: 'customer',
      tier: 'Standard Member'
    };

    this.state.users.push(newUser);
    this.state.currentUser = newUser;
    this.saveState();
    this.logAudit('REGISTER', `Khách hàng: ${newUser.name}`, 'Đăng ký tài khoản mới');
    return { success: true, user: newUser };
  }

  logout() {
    this.state.currentUser = null;
    this.saveState();
  }

  // --- Dịch vụ, Combos, Sản phẩm, Tin tức ---
  getServices() {
    return this.state.services || [];
  }

  getCombos() {
    return this.state.combos || [];
  }

  getAllOfferings() {
    return [...this.getServices(), ...this.getCombos()];
  }

  getProducts(section = null) {
    const list = this.state.products || [];
    if (section) return list.filter(p => p.section === section);
    return list;
  }

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

  getStylists(branchId = null) {
    const list = this.state.stylists || [];
    if (branchId) return list.filter(s => s.branchId === branchId);
    return list;
  }

  // --- Đặt Lịch & Chống Trùng Lịch ---
  getBookings(branchId = null) {
    const list = this.state.bookings || [];
    if (branchId) return list.filter(b => b.branchId === branchId);
    return list;
  }

  getAvailableSlots(date, stylistId, branchId = null) {
    const slots = ['08:30', '09:30', '10:30', '11:30', '13:30', '14:30', '15:30', '16:30', '17:30', '18:30', '19:30', '20:30'];
    const booked = (this.state.bookings || [])
      .filter(b => b.date === date && b.stylistId === stylistId && b.status !== 'cancelled')
      .map(b => b.timeSlot);

    return slots.map(time => ({
      time,
      available: !booked.includes(time)
    }));
  }

  addBooking(bookingData) {
    // Check conflict
    const isConflict = (this.state.bookings || []).some(b => 
      b.date === bookingData.date &&
      b.stylistId === bookingData.stylistId &&
      b.timeSlot === bookingData.timeSlot &&
      b.status !== 'cancelled'
    );

    if (isConflict) {
      throw new Error(`Khung giờ ${bookingData.timeSlot} ngày ${bookingData.date} của Barber này vừa được đặt. Vui lòng chọn giờ khác!`);
    }

    const branch = this.getBranches().find(br => br.id === (bookingData.branchId || this.state.selectedBranchId)) || this.getCurrentBranch();

    const newBooking = {
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      branchId: branch ? branch.id : 'br-dbp',
      branchName: branch ? branch.name : '4RAU Barbershop',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'confirmed',
      ...bookingData
    };

    if (!this.state.bookings) this.state.bookings = [];
    this.state.bookings.unshift(newBooking);

    this.addNotification({
      userId: this.state.currentUser?.id || 'guest',
      title: '✅ Đặt Lịch Cắt Tóc Thành Công',
      content: `Lịch hẹn #${newBooking.id} [${newBooking.serviceName}] tại ${newBooking.branchName} lúc ${newBooking.timeSlot} ngày ${newBooking.date} đã được xác nhận.`,
      type: 'booking_confirmed'
    });

    this.logAudit('CREATE_BOOKING', `Lịch: #${newBooking.id}`, `Khách: ${newBooking.customerName} - Dịch vụ: ${newBooking.serviceName}`);
    this.saveState();
    return newBooking;
  }

  // --- Giỏ Hàng & Mua Sắm ---
  getCart() {
    return this.state.cart || [];
  }

  addToCart(productId, qty = 1) {
    const prod = this.state.products.find(p => p.id === productId);
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
    const branch = this.getCurrentBranch();
    const newOrder = {
      id: 'ORD-' + Math.floor(100 + Math.random() * 900),
      branchId: branch ? branch.id : 'br-dbp',
      branchName: branch ? branch.name : '4RAU Barbershop HQ',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'Completed',
      ...orderData
    };

    if (!this.state.orders) this.state.orders = [];
    this.state.orders.unshift(newOrder);
    this.clearCart();

    this.logAudit('CREATE_ORDER', `Đơn hàng #${newOrder.id}`, `Tổng tiền: ${SalonUtils.formatCurrency(newOrder.totalAmount)}`);
    this.saveState();
    return newOrder;
  }

  // --- Thông Báo & Audit Logs ---
  getNotifications() {
    return this.state.notifications || [];
  }

  addNotification(data) {
    const notif = {
      id: 'notif-' + Date.now(),
      isRead: false,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      ...data
    };
    if (!this.state.notifications) this.state.notifications = [];
    this.state.notifications.unshift(notif);
    this.saveState();
    return notif;
  }

  markAllNotificationsAsRead() {
    (this.state.notifications || []).forEach(n => { n.isRead = true; });
    this.saveState();
  }

  getAuditLogs() {
    return this.state.auditLogs || [];
  }

  logAudit(action, entity, details) {
    const user = this.getCurrentUser();
    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      operatorName: user ? `${user.name} (${user.role})` : 'Hệ Thống',
      action,
      entity,
      details
    };
    if (!this.state.auditLogs) this.state.auditLogs = [];
    this.state.auditLogs.unshift(newLog);
    if (this.state.auditLogs.length > 100) this.state.auditLogs.pop();
  }

  // --- Quản Lý Lịch Hẹn Dành Cho Quản Trị Viên (Admin) ---
  updateBookingStatus(bookingId, newStatus) {
    const booking = (this.state.bookings || []).find(b => b.id === bookingId);
    if (!booking) return false;
    const oldStatus = booking.status;
    booking.status = newStatus;

    this.logAudit('UPDATE_BOOKING_STATUS', `Lịch: #${booking.id}`, `Đổi từ [${oldStatus}] sang [${newStatus}]`);
    this.addNotification({
      userId: booking.customerId || 'guest',
      title: '🔄 Cập Nhật Trạng Thái Lịch Hẹn',
      content: `Lịch #${booking.id} của quý khách đã chuyển sang trạng thái [${newStatus}].`,
      type: 'booking_status_update'
    });
    this.saveState();
    return true;
  }

  deleteBooking(bookingId) {
    const idx = (this.state.bookings || []).findIndex(b => b.id === bookingId);
    if (idx === -1) return false;
    const removed = this.state.bookings.splice(idx, 1)[0];
    this.logAudit('DELETE_BOOKING', `Lịch: #${bookingId}`, `Khách: ${removed.customerName} - Dịch vụ: ${removed.serviceName}`);
    this.saveState();
    return true;
  }

  getBookingByPhoneOrId(query) {
    if (!query) return [];
    const q = query.trim().toLowerCase().replace('#', '');
    return (this.state.bookings || []).filter(b => 
      b.id.toLowerCase().includes(q) || 
      (b.customerPhone && b.customerPhone.includes(q)) ||
      (b.customerName && b.customerName.toLowerCase().includes(q))
    );
  }

  searchServicesAndProducts(query) {
    if (!query || query.trim().length < 1) return { services: [], products: [] };
    const q = query.trim().toLowerCase();
    const services = this.getAllOfferings().filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
    const products = (this.state.products || []).filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
    return { services: services.slice(0, 5), products: products.slice(0, 5) };
  }

  getRevenueAnalytics() {
    const bookings = this.state.bookings || [];
    const completedOrConfirmed = bookings.filter(b => b.status !== 'cancelled');
    const totalRev = completedOrConfirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0) || 18500000;
    
    // Phân bổ 7 ngày gần nhất
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const mockMultipliers = [0.10, 0.12, 0.13, 0.14, 0.18, 0.23, 0.20];
    const weeklyData = days.map((day, i) => {
      const dayRev = Math.round((totalRev * mockMultipliers[i]) / 10000) * 10000;
      return {
        day,
        revenue: dayRev,
        bookingsCount: Math.round((completedOrConfirmed.length || 15) * mockMultipliers[i]) || 2
      };
    });

    // Tỉ trọng nhóm dịch vụ
    const categoryBreakdown = [
      { name: 'Cắt Fade Chuẩn Barber', count: 42, pct: 45, color: '#c85a44' },
      { name: 'Uốn Con Sâu / Texture', count: 24, pct: 26, color: '#e07a5f' },
      { name: 'Combo VIP Chủ Tịch', count: 15, pct: 16, color: '#d97706' },
      { name: 'Nhuộm Tẩy Xám Khói', count: 8, pct: 9, color: '#8b5cf6' },
      { name: 'Cạo Khăn Nóng', count: 4, pct: 4, color: '#10b981' }
    ];

    return {
      totalRevenue: totalRev,
      totalBookings: bookings.length || 18,
      confirmedCount: bookings.filter(b => b.status === 'confirmed').length,
      completedCount: bookings.filter(b => b.status === 'completed').length,
      cancelledCount: bookings.filter(b => b.status === 'cancelled').length,
      weeklyData,
      categoryBreakdown,
      occupancyRate: '88%'
    };
  }

  getInventory(branchId = null) {
    const list = this.state.inventory || [];
    const products = this.state.products || [];
    return list.map(inv => {
      const prod = products.find(p => p.id === inv.productId) || { name: 'Sản phẩm 4RAU', brand: '4RAU APPAREL', price: 250000, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' };
      return {
        ...inv,
        productName: prod.name,
        brand: prod.brand,
        price: prod.price,
        image: prod.image
      };
    });
  }

  updateProductStock(invId, newStock) {
    const inv = (this.state.inventory || []).find(i => i.id === invId);
    if (!inv) return false;
    const oldStock = inv.stock;
    inv.stock = Math.max(0, parseInt(newStock) || 0);
    this.logAudit('UPDATE_STOCK', `Kho: ${inv.id}`, `Đổi số lượng từ [${oldStock}] sang [${inv.stock}]`);
    this.saveState();
    return true;
  }

  // --- Khôi Phục Dữ Liệu Demo ---
  resetToDefault() {
    localStorage.removeItem(this.storageKey);
    this.initStore();
    this.notify();
  }
}

// Khởi tạo Singleton Store và export ra window scope
window.SalonUtils = SalonUtils;
window.INITIAL_DATA = INITIAL_SALON_DATA;
window.store = new SalonStore();

