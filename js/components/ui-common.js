// =========================================================================
// OmniSalon / 4RAU Barbershop — FILE 2: GIAO DIỆN CHUNG (COMMON UI COMPONENTS)
// Chứa toàn bộ: Product Cards, News Cards, Branch Pills, Booking Wizard,
// Cart Drawer / Bottom Sheet, Auth Modal, 3D Studio, Toast Notifications.
// Tái sử dụng 100% cho cả Web Portal và Android CH Play Mobile App.
// =========================================================================

const UICommon = {
  // -----------------------------------------------------------------------
  // 1. RENDER THẺ SẢN PHẨM (CHUẨN 100% ẢNH NGON.PNG)
  // -----------------------------------------------------------------------
  renderProductCard(prod, isMobile = false) {
    const formattedPrice = SalonUtils.formatCurrency(prod.price);
    return `
      <div class="product-item-card" data-id="${prod.id}" onclick="UICommon.openProductDetailModal('${prod.id}')">
        <div class="product-img-box">
          <img src="${prod.image}" alt="${prod.name}" loading="lazy" class="product-thumb" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';">
          <button class="quick-add-btn" title="Thêm vào giỏ" onclick="event.stopPropagation(); UICommon.handleAddToCart('${prod.id}')">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2-2.76 5H8.53l-.13-.27L6.16 6l-.95-2-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25z"/>
            </svg>
          </button>
        </div>
        <div class="product-info-box">
          <h4 class="product-title" title="${prod.name}">${prod.name}</h4>
          <div class="product-price-red">${formattedPrice}</div>
        </div>
      </div>
    `;
  },

  // -----------------------------------------------------------------------
  // 2. RENDER BÀI VIẾT TIN TÓC UNDERGROUND (CHUẨN ẢNH NGON.PNG)
  // -----------------------------------------------------------------------
  renderFeatureArticle(article) {
    return `
      <article class="underground-feature-card" onclick="UICommon.openArticleModal('${article.id}')">
        <div class="feature-img-wrapper">
          <img src="${article.image}" alt="${article.title}" class="feature-img">
        </div>
        <h3 class="feature-title">${article.title}</h3>
        <p class="feature-excerpt">${article.excerpt}</p>
      </article>
    `;
  },

  renderSideArticle(article) {
    return `
      <article class="underground-side-card" onclick="UICommon.openArticleModal('${article.id}')">
        <h4 class="side-article-title">${article.title}</h4>
        <p class="side-article-excerpt">${article.excerpt}</p>
      </article>
    `;
  },

  renderGridArticle(article) {
    return `
      <article class="underground-grid-card" onclick="UICommon.openArticleModal('${article.id}')">
        <h4 class="grid-article-title">${article.title}</h4>
        <p class="grid-article-excerpt">${article.excerpt}</p>
      </article>
    `;
  },

  // -----------------------------------------------------------------------
  // 3. RENDER NÚT CHI NHÁNH DẠNG THẺ HIỆN ĐẠI (KHÔNG BỊ BÓ NÉN CHỮ)
  // -----------------------------------------------------------------------
  renderBranchPill(branch) {
    const rawParts = (branch.name || '').split('—');
    const mainTitle = (rawParts[0] || branch.name).trim();
    const subTitle = rawParts[1] ? rawParts[1].trim() : (branch.address ? branch.address.split(',')[0] : '');

    return `
      <button class="branch-pill-button" onclick="UICommon.openBranchModal('${branch.id}')" title="${branch.name}">
        <div class="branch-pill-inner">
          <span class="branch-pill-icon">📍</span>
          <div class="branch-pill-text-wrap">
            <span class="branch-pill-title">${mainTitle}</span>
            ${subTitle ? `<span class="branch-pill-sub">${subTitle}</span>` : ''}
          </div>
        </div>
      </button>
    `;
  },

  // -----------------------------------------------------------------------
  // 4. RENDER TICKER DỊCH VỤ (OUR SERVICE — CHUẨN CHÍNH TẢ & ĐỒ HOẠ CAO CẤP)
  // -----------------------------------------------------------------------
  renderServicesTickerHTML() {
    return `
      <div class="services-ticker-container">
        <!-- Hàng 1: Dịch vụ đặc trưng -->
        <div class="ticker-row ticker-row-1">
          <div class="ticker-track">
            <span class="service-tag">GỘI ĐẦU MASSAGE DƯỠNG SINH</span>
            <span class="service-tag">CẠO MẶT KHĂN NÓNG CỔ ĐIỂN</span>
            <span class="service-tag">UỐN TÓC NAM PREMLOCK</span>
            <span class="service-tag">ÉP SIDE DOWN PERM</span>
            <span class="service-tag">NHUỘM MÀU THỜI THƯỢNG</span>
            <span class="service-tag">TẨY TÓC KHÓI BẠC</span>
            <span class="service-tag">UỐN CON SÂU ZIC-ZAC</span>
            <!-- Lặp lại track mượt mà -->
            <span class="service-tag">GỘI ĐẦU MASSAGE DƯỠNG SINH</span>
            <span class="service-tag">CẠO MẶT KHĂN NÓNG CỔ ĐIỂN</span>
            <span class="service-tag">UỐN TÓC NAM PREMLOCK</span>
            <span class="service-tag">ÉP SIDE DOWN PERM</span>
            <span class="service-tag">NHUỘM MÀU THỜI THƯỢNG</span>
            <span class="service-tag">TẨY TÓC KHÓI BẠC</span>
          </div>
        </div>
        <!-- Hàng 2: Phong cách tạo form -->
        <div class="ticker-row ticker-row-2">
          <div class="ticker-track reverse">
            <span class="service-tag">CẠO MẶT KHĂN NÓNG CỔ ĐIỂN</span>
            <span class="service-tag">UỐN TÓC HÀN QUỐC</span>
            <span class="service-tag">ÉP SIDE DOWN PERM</span>
            <span class="service-tag">NHUỘM MÀU THỜI THƯỢNG</span>
            <span class="service-tag">TẨY TÓC AN TOÀN</span>
            <span class="service-tag">UỐN TEXTURE GIẤY BẠC</span>
            <span class="service-tag">CẮT TẠO PHOM FADE BÉN</span>
            <!-- Lặp lại -->
            <span class="service-tag">CẠO MẶT KHĂN NÓNG CỔ ĐIỂN</span>
            <span class="service-tag">UỐN TÓC HÀN QUỐC</span>
            <span class="service-tag">ÉP SIDE DOWN PERM</span>
            <span class="service-tag">NHUỘM MÀU THỜI THƯỢNG</span>
            <span class="service-tag">TẨY TÓC AN TOÀN</span>
            <span class="service-tag">UỐN TEXTURE GIẤY BẠC</span>
          </div>
        </div>
        <!-- Hàng 3: Chuẩn quốc tế -->
        <div class="ticker-row ticker-row-3">
          <div class="ticker-track">
            <span class="service-tag">HEAD WASH & MASSAGE</span>
            <span class="service-tag">HOT TOWEL SHAVE</span>
            <span class="service-tag">HAIR PERM & TEXTURE</span>
            <span class="service-tag">SIDE HAIR STRAIGHTENING</span>
            <span class="service-tag">HAIR DYE & BLEACH</span>
            <span class="service-tag">PREMLOCK HIPHOP</span>
            <!-- Lặp lại -->
            <span class="service-tag">HEAD WASH & MASSAGE</span>
            <span class="service-tag">HOT TOWEL SHAVE</span>
            <span class="service-tag">HAIR PERM & TEXTURE</span>
            <span class="service-tag">SIDE HAIR STRAIGHTENING</span>
            <span class="service-tag">HAIR DYE & BLEACH</span>
          </div>
        </div>
      </div>
    `;
  },

  // -----------------------------------------------------------------------
  // 5. RENDER HỢP TÁC THƯƠNG HIỆU (BRAND COLLABS — CHUẨN XÁM ĐẬM NGON.PNG)
  // -----------------------------------------------------------------------
  renderBrandCollabCard(collab) {
    return `
      <div class="collab-box-card" onclick="UICommon.showToast('🚀 Khám phá bộ sưu tập ${collab.title}!')">
        <div class="collab-title">${collab.title}</div>
        <div class="collab-link">${collab.linkText}</div>
      </div>
    `;
  },

  // -----------------------------------------------------------------------
  // 6. BOOKING WIZARD ĐẶT LỊCH CHỐNG TRÙNG LỊCH (QUY TRÌNH 4 BƯỚC CHUYÊN NGHIỆP)
  // -----------------------------------------------------------------------
  bookingData: {
    serviceId: 'srv-1',
    branchId: 'br-dbp',
    stylistId: 'st-1',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:30',
    customerName: '',
    customerPhone: '',
    notes: ''
  },

  openBookingModal(preselectedServiceId = null, preselectedBranchId = null) {
    if (preselectedServiceId) this.bookingData.serviceId = preselectedServiceId;
    if (preselectedBranchId) this.bookingData.branchId = preselectedBranchId;
    const user = window.store.getCurrentUser();
    if (user) {
      this.bookingData.customerName = user.name;
      this.bookingData.customerPhone = user.phone;
    }

    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = this.renderBookingWizardHTML();
    modal.classList.add('active');
    this.bindBookingSlotEvents();
  },

  renderBookingWizardHTML() {
    const services = window.store.getServices();
    const combos = window.store.getCombos();
    const branches = window.store.getBranches();
    const stylists = window.store.getStylists(this.bookingData.branchId);
    const slots = window.store.getAvailableSlots(this.bookingData.date, this.bookingData.stylistId, this.bookingData.branchId);

    const activeService = [...services, ...combos].find(s => s.id === this.bookingData.serviceId) || services[0];
    const activeBranch = branches.find(b => b.id === this.bookingData.branchId) || branches[0];

    return `
      <div class="booking-wizard-wrapper">
        <div class="booking-header">
          <div class="badge-terracotta">4RAU BARBERSHOP</div>
          <h2 class="booking-title">ĐẶT LỊCH CẮT TÓC & LÀM ĐẸP</h2>
          <p class="booking-subtitle">Hệ thống đặt lịch tự động chống trùng ca — Phục vụ đúng giờ, không chờ đợi</p>
        </div>

        <form id="bookingWizardForm" onsubmit="event.preventDefault(); UICommon.submitBooking();">
          <!-- Bước 1: Chọn Dịch Vụ -->
          <div class="booking-step-section">
            <label class="booking-label">1. Chọn Dịch Vụ / Combo VIP</label>
            <div class="service-select-grid">
              ${services.map(s => `
                <div class="service-chip ${this.bookingData.serviceId === s.id ? 'active' : ''}" 
                     onclick="UICommon.selectBookingService('${s.id}')">
                  <div class="service-chip-name">${s.name}</div>
                  <div class="service-chip-price">${SalonUtils.formatCurrency(s.price)}</div>
                </div>
              `).join('')}
              ${combos.map(c => `
                <div class="service-chip combo-chip ${this.bookingData.serviceId === c.id ? 'active' : ''}" 
                     onclick="UICommon.selectBookingService('${c.id}')">
                  <div class="service-chip-name">👑 ${c.name}</div>
                  <div class="service-chip-price">${SalonUtils.formatCurrency(c.price)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Bước 2: Chọn Chi Nhánh -->
          <div class="booking-step-section">
            <label class="booking-label">2. Chọn Chi Nhánh 4RAU Thuận Tiện</label>
            <select class="form-control-custom" id="bookingBranchSelect" onchange="UICommon.selectBookingBranch(this.value)">
              <optgroup label="--- 4RAU BARBER CUTCLUB ---">
                ${branches.filter(b => b.group === '4RAU BARBER CUTCLUB').map(b => `
                  <option value="${b.id}" ${b.id === this.bookingData.branchId ? 'selected' : ''}>${b.name} (${b.address})</option>
                `).join('')}
              </optgroup>
              <optgroup label="--- TIỆM TÓC CỦA CHỦ TỊCH ---">
                ${branches.filter(b => b.group === 'TIỆM TÓC CỦA CHỦ TỊCH').map(b => `
                  <option value="${b.id}" ${b.id === this.bookingData.branchId ? 'selected' : ''}>★ ${b.name}</option>
                `).join('')}
              </optgroup>
            </select>
          </div>

          <!-- Bước 3: Chọn Ngày, Barber & Khung Giờ -->
          <div class="booking-step-section">
            <label class="booking-label">3. Chọn Barber & Thời Gian Hẹn</label>
            <div class="booking-row-2">
              <div>
                <span class="sub-label">Barber Phục Vụ:</span>
                <select class="form-control-custom" id="bookingStylistSelect" onchange="UICommon.selectBookingStylist(this.value)">
                  ${stylists.map(st => `
                    <option value="${st.id}" ${st.id === this.bookingData.stylistId ? 'selected' : ''}>${st.name} — ${st.role} (5.0★)</option>
                  `).join('')}
                </select>
              </div>
              <div>
                <span class="sub-label">Ngày Hẹn:</span>
                <input type="date" class="form-control-custom" value="${this.bookingData.date}" min="${new Date().toISOString().split('T')[0]}" 
                       onchange="UICommon.selectBookingDate(this.value)">
              </div>
            </div>

            <div style="margin-top: 12px;">
              <span class="sub-label">Khung Giờ Trống (Slot Time):</span>
              <div class="time-slots-grid" id="timeSlotsContainer">
                ${slots.map(s => `
                  <button type="button" class="time-slot-btn ${s.available ? '' : 'disabled'} ${this.bookingData.timeSlot === s.time && s.available ? 'active' : ''}"
                          ${s.available ? `onclick="UICommon.selectBookingSlot('${s.time}')"` : 'disabled'} 
                          title="${s.available ? 'Còn trống' : 'Đã có khách đặt'}">
                    ${s.time}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Bước 4: Thông Tin Liên Hệ & Xác Nhận -->
          <div class="booking-step-section">
            <label class="booking-label">4. Thông Tin Khách Hàng</label>
            <div class="booking-row-2">
              <input type="text" class="form-control-custom" placeholder="Họ và tên của bạn..." 
                     value="${this.bookingData.customerName}" required oninput="UICommon.bookingData.customerName = this.value">
              <input type="tel" class="form-control-custom" placeholder="Số điện thoại nhận SMS..." 
                     value="${this.bookingData.customerPhone}" required oninput="UICommon.bookingData.customerPhone = this.value">
            </div>
          </div>

          <!-- Tóm Tắt & Thanh Toán -->
          <div class="booking-summary-card">
            <div class="summary-line">
              <span>Dịch vụ chọn:</span>
              <strong>${activeService.name}</strong>
            </div>
            <div class="summary-line">
              <span>Địa điểm:</span>
              <span>${activeBranch.name}</span>
            </div>
            <div class="summary-line">
              <span>Thời gian:</span>
              <span>${this.bookingData.timeSlot} — ${SalonUtils.formatDate(this.bookingData.date)}</span>
            </div>
            <div class="summary-line total-line">
              <span>Tổng chi phí:</span>
              <span class="price-big">${SalonUtils.formatCurrency(activeService.price)}</span>
            </div>
          </div>

          <div class="booking-action-row">
            <button type="button" class="btn-cancel" onclick="UICommon.closeGlobalModal()">Hủy Bỏ</button>
            <button type="submit" class="btn-submit-terracotta">Xác Nhận Đặt Lịch →</button>
          </div>
        </form>
      </div>
    `;
  },

  selectBookingService(serviceId) {
    this.bookingData.serviceId = serviceId;
    this.refreshBookingWizardUI();
  },

  selectBookingBranch(branchId) {
    this.bookingData.branchId = branchId;
    const stylists = window.store.getStylists(branchId);
    if (stylists.length > 0) this.bookingData.stylistId = stylists[0].id;
    this.refreshBookingWizardUI();
  },

  selectBookingStylist(stylistId) {
    this.bookingData.stylistId = stylistId;
    this.refreshBookingWizardUI();
  },

  selectBookingDate(dateVal) {
    this.bookingData.date = dateVal;
    this.refreshBookingWizardUI();
  },

  refreshBookingWizardUI() {
    const html = this.renderBookingWizardHTML();
    const modalBody = document.getElementById('globalModalBody');
    if (modalBody && modalBody.children.length > 0 && modalBody.querySelector('.booking-wizard-wrapper')) {
      modalBody.innerHTML = html;
    }
    const tabContainer = document.getElementById('androidBookingTabContainer');
    if (tabContainer) {
      tabContainer.innerHTML = html;
    }
  },

  selectBookingSlot(slotTime) {
    this.bookingData.timeSlot = slotTime;
    const btns = document.querySelectorAll('.time-slot-btn');
    btns.forEach(b => {
      if (b.textContent.trim() === slotTime) b.classList.add('active');
      else b.classList.remove('active');
    });
  },

  bindBookingSlotEvents() {},

  submitBooking() {
    if (!this.bookingData.customerName.trim() || !this.bookingData.customerPhone.trim()) {
      UICommon.showToast('⚠️ Vui lòng nhập đầy đủ tên và số điện thoại!', 'warning');
      return;
    }

    const services = window.store.getAllOfferings();
    const service = services.find(s => s.id === this.bookingData.serviceId);
    const stylist = window.store.getStylists().find(st => st.id === this.bookingData.stylistId);
    const branch = window.store.getBranches().find(br => br.id === this.bookingData.branchId);

    try {
      const newBooking = window.store.addBooking({
        serviceId: this.bookingData.serviceId,
        serviceName: service ? service.name : 'Cắt Tóc Barber',
        branchId: this.bookingData.branchId,
        branchName: branch ? branch.name : '4RAU Barbershop',
        stylistId: this.bookingData.stylistId,
        stylistName: stylist ? stylist.name : 'Master Barber',
        date: this.bookingData.date,
        timeSlot: this.bookingData.timeSlot,
        customerName: this.bookingData.customerName,
        customerPhone: this.bookingData.customerPhone,
        totalPrice: service ? service.price : 180000
      });

      this.closeGlobalModal();
      this.openBookingSuccessModal(newBooking);
    } catch (err) {
      alert(err.message || 'Lỗi khi đặt lịch!');
    }
  },

  openBookingSuccessModal(booking) {
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="booking-success-box">
        <div class="success-icon">✓</div>
        <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">ĐẶT LỊCH THÀNH CÔNG!</h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
          Mã lịch hẹn: <strong style="color: #c85a44;">#${booking.id}</strong>. 4RAU Barbershop rất hân hạnh được phục vụ bạn.
        </p>

        <div class="booking-invoice-card">
          <div class="invoice-item"><span>Dịch vụ:</span><strong>${booking.serviceName}</strong></div>
          <div class="invoice-item"><span>Chi nhánh:</span><span>${booking.branchName}</span></div>
          <div class="invoice-item"><span>Barber:</span><strong>${booking.stylistName}</strong></div>
          <div class="invoice-item"><span>Thời gian:</span><strong>${booking.timeSlot} — ${SalonUtils.formatDate(booking.date)}</strong></div>
          <div class="invoice-item"><span>Khách hàng:</span><span>${booking.customerName} (${booking.customerPhone})</span></div>
          <div class="invoice-item price-row"><span>Tổng thanh toán:</span><strong style="color: #c85a44; font-size: 18px;">${SalonUtils.formatCurrency(booking.totalPrice)}</strong></div>
        </div>

        <!-- VietQR Chuyển Khoản Tức Thì -->
        <div class="vietqr-box" style="margin-top: 20px; padding: 16px; background: #fafafa; border-radius: 12px; text-align: center; border: 1px dashed #ccc;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px;">QUÉT MÃ VIETQR THANH TOÁN HOẶC TRẢ TIỀN TẠI QUẦY</div>
          <img src="https://api.vietqr.io/image/970422-0908123456-compact2.jpg?amount=${booking.totalPrice}&addInfo=4RAU%20${booking.id}&accountName=4RAU%20BARBERSHOP" 
               alt="VietQR 4RAU" style="max-width: 180px; border-radius: 8px; margin: 10px auto; display: block;">
          <div style="font-size: 12px; color: #888;">Ngân hàng Quân Đội MBBank — STK: 0908123456 (4RAU BARBERSHOP)</div>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
          <button class="btn-submit-terracotta" style="width: 100%;" onclick="UICommon.closeGlobalModal()">Hoàn Tất & Đóng</button>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  // -----------------------------------------------------------------------
  // 7. GIỎ HÀNG (DRAWER WEB & BOTTOM SHEET MOBILE)
  // -----------------------------------------------------------------------
  handleAddToCart(productId) {
    window.store.addToCart(productId, 1);
    const prod = window.store.getProducts().find(p => p.id === productId);
    UICommon.showToast(`🛒 Đã thêm [${prod?.name || 'Sản phẩm'}] vào giỏ!`);
    this.updateCartBadges();
  },

  openCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    if (!drawer) return;
    this.renderCartDrawerContent();
    drawer.classList.add('open');
  },

  closeCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    if (drawer) drawer.classList.remove('open');
  },

  renderCartDrawerContent() {
    const listContainer = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('cartTotalAmount');
    if (!listContainer) return;

    const cart = window.store.getCart();
    let total = 0;

    if (cart.length === 0) {
      listContainer.innerHTML = `
        <div class="cart-empty-state">
          <div style="font-size: 40px; margin-bottom: 10px;">🛍️</div>
          <div style="font-weight: 600; font-size: 15px;">Giỏ hàng của bạn đang trống</div>
          <div style="font-size: 13px; color: #888; margin-top: 4px;">Hãy chọn các dòng sáp vuốt, pomade, áo nón 4RAU cực chất!</div>
        </div>
      `;
      if (totalEl) totalEl.textContent = '0 đ';
      return;
    }

    listContainer.innerHTML = cart.map(item => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;
      return `
        <div class="cart-drawer-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <h5 class="cart-item-title">${item.name}</h5>
            <div class="cart-item-brand">${item.brand}</div>
            <div class="cart-item-price">${SalonUtils.formatCurrency(item.price)}</div>
            <div class="cart-qty-control">
              <button class="qty-btn" onclick="UICommon.changeCartQty('${item.productId}', ${item.qty - 1})">-</button>
              <span class="qty-number">${item.qty}</span>
              <button class="qty-btn" onclick="UICommon.changeCartQty('${item.productId}', ${item.qty + 1})">+</button>
              <button class="remove-item-btn" onclick="UICommon.changeCartQty('${item.productId}', 0)">✕</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = SalonUtils.formatCurrency(total);
    this.updateCartBadges();
  },

  changeCartQty(productId, newQty) {
    window.store.updateCartQty(productId, newQty);
    this.renderCartDrawerContent();
  },

  updateCartBadges() {
    const cart = window.store.getCart();
    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    const badges = document.querySelectorAll('.cart-badge-count');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  },

  checkoutCart() {
    const cart = window.store.getCart();
    if (cart.length === 0) {
      UICommon.showToast('Giỏ hàng trống! Vui lòng chọn sản phẩm.', 'warning');
      return;
    }

    const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const user = window.store.getCurrentUser();

    const order = window.store.createOrder({
      customerName: user ? user.name : 'Khách Mua Tại Web/App',
      customerPhone: user ? user.phone : '0908123456',
      items: cart,
      totalAmount: total,
      paymentMethod: 'VietQR / Trả Khi Nhận Hàng (COD)'
    });

    this.closeCartDrawer();
    UICommon.showToast(`🎉 Đặt đơn hàng #${order.id} thành công!`);
    this.openOrderSuccessModal(order);
  },

  openOrderSuccessModal(order) {
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="booking-success-box">
        <div class="success-icon" style="background:#10b981;">✓</div>
        <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">ĐẶT HÀNG THÀNH CÔNG!</h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
          Mã đơn hàng: <strong style="color: #c85a44;">#${order.id}</strong>. Bộ phận kho 4RAU sẽ đóng gói và giao đến bạn sớm nhất.
        </p>
        <div class="booking-invoice-card">
          ${order.items.map(it => `
            <div class="invoice-item">
              <span>${it.name} (x${it.qty}):</span>
              <strong>${SalonUtils.formatCurrency(it.price * it.qty)}</strong>
            </div>
          `).join('')}
          <div class="invoice-item price-row">
            <span>Tổng hóa đơn:</span>
            <strong style="color: #c85a44; font-size: 18px;">${SalonUtils.formatCurrency(order.totalAmount)}</strong>
          </div>
        </div>
        <button class="btn-submit-terracotta" style="width: 100%; margin-top: 20px;" onclick="UICommon.closeGlobalModal()">Đóng Cửa Sổ</button>
      </div>
    `;
    modal.classList.add('active');
  },

  // -----------------------------------------------------------------------
  // 8. CHI TIẾT SẢN PHẨM & TIN TỨC MODAL
  // -----------------------------------------------------------------------
  openProductDetailModal(productId) {
    const prod = window.store.getProducts().find(p => p.id === productId);
    if (!prod) return;

    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="product-modal-detail">
        <div class="modal-prod-img-wrap">
          <img src="${prod.image}" alt="${prod.name}" class="modal-prod-img">
        </div>
        <div class="modal-prod-info">
          <div class="badge-terracotta">${prod.brand}</div>
          <h2 class="modal-prod-title">${prod.name}</h2>
          <div class="modal-prod-price">${SalonUtils.formatCurrency(prod.price)}</div>
          <p class="modal-prod-desc">${prod.description}</p>
          <div style="display:flex; gap:12px; margin-top:24px;">
            <button class="btn-submit-terracotta" style="flex:1;" onclick="UICommon.handleAddToCart('${prod.id}'); UICommon.closeGlobalModal();">
              Thêm Vào Giỏ Hàng
            </button>
            <button class="btn-cancel" onclick="UICommon.closeGlobalModal()">Đóng</button>
          </div>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  openArticleModal(articleId) {
    const article = window.store.getNewsArticles().find(a => a.id === articleId) || window.store.getNewsArticles()[0];
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="article-modal-detail">
        <div class="badge-terracotta">TIN TÓC UNDERGROUND 4RAU</div>
        <h2 style="font-size: 22px; font-weight: 800; margin: 12px 0;">${article.title}</h2>
        <div style="font-size: 13px; color: #888; margin-bottom: 16px;">Xuất bản: ${article.date} | Bởi Ban Biên Tập 4RAU Barber</div>
        <img src="${article.image}" alt="${article.title}" style="width: 100%; border-radius: 12px; margin-bottom: 16px;">
        <p style="font-size: 15px; line-height: 1.7; color: #333;">${article.excerpt}</p>
        <p style="font-size: 14px; line-height: 1.7; color: #555; margin-top: 10px;">
          Tại 4RAU Barbershop, chúng tôi không chỉ tạo nên những quả đầu đẹp mà còn truyền tải hơi thở đường phố, phong cách sống phóng khoáng và sự tự tin đến cho mỗi anh em. Hãy ghé bất kỳ chi nhánh nào trong hệ thống để được các Barber lành nghề tư vấn form tóc chuẩn nhất!
        </p>
        <button class="btn-submit-terracotta" style="margin-top: 20px; width: 100%;" onclick="UICommon.openBookingModal()">
          Đặt Lịch Cắt Kiểu Này Ngay →
        </button>
      </div>
    `;
    modal.classList.add('active');
  },

  openBranchModal(branchId) {
    const branch = window.store.getBranches().find(b => b.id === branchId);
    if (!branch) return;

    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="branch-modal-detail">
        <div class="badge-terracotta">${branch.group}</div>
        <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0;">${branch.name}</h2>
        <img src="${branch.image}" alt="${branch.name}" style="width:100%; height:200px; object-fit:cover; border-radius:12px; margin: 12px 0;">
        <div class="invoice-item"><span>Địa chỉ:</span><strong>${branch.address}</strong></div>
        <div class="invoice-item"><span>Hotline:</span><strong style="color:#c85a44;">${branch.phone}</strong></div>
        <div class="invoice-item"><span>Giờ mở cửa:</span><span>${branch.hours}</span></div>
        <div class="invoice-item"><span>Quy mô:</span><span>${branch.totalChairs} ghế Barber & Thư giãn</span></div>
        <div class="invoice-item"><span>Quản lý cơ sở:</span><span>${branch.manager}</span></div>

        <div style="display:flex; gap:12px; margin-top: 20px;">
          <button class="btn-submit-terracotta" style="flex:1;" onclick="UICommon.openBookingModal(null, '${branch.id}')">
            Đặt Lịch Tại Chi Nhánh Này →
          </button>
          <button class="btn-cancel" onclick="UICommon.closeGlobalModal()">Đóng</button>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  // -----------------------------------------------------------------------
  // 9. MODAL ĐĂNG NHẬP / TÀI KHOẢN
  // -----------------------------------------------------------------------
  openAuthModal() {
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="auth-modal-box">
        <div class="badge-terracotta">4RAU BARBER MEMBER</div>
        <h2 style="font-size: 20px; font-weight: 800; margin: 8px 0 16px;">ĐĂNG NHẬP TÀI KHOẢN</h2>
        <form onsubmit="event.preventDefault(); UICommon.handleLogin();">
          <div style="margin-bottom: 12px;">
            <label class="sub-label">Email hoặc Số điện thoại:</label>
            <input type="text" id="loginAccount" class="form-control-custom" value="khachhang@gmail.com" required>
          </div>
          <div style="margin-bottom: 16px;">
            <label class="sub-label">Mật khẩu:</label>
            <input type="password" id="loginPassword" class="form-control-custom" value="123" required>
          </div>
          <button type="submit" class="btn-submit-terracotta" style="width:100%;">Đăng Nhập Ngay</button>
        </form>

        <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed #ddd; text-align: center;">
          <div style="font-size: 12px; color: #888; margin-bottom: 8px;">Đăng nhập nhanh với quyền Quản Trị Viên (Admin):</div>
          <button type="button" class="pill-btn-outline" style="font-size: 12px; width: 100%;" 
                  onclick="window.store.login('admin@4raubarbershop.com', 'admin'); UICommon.closeGlobalModal(); UICommon.showToast('👑 Đã đăng nhập với tư cách Chủ Tịch Hà Hiền (Admin)!');">
            👑 Đăng Nhập Quản Trị Salon (Admin)
          </button>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  handleLogin() {
    const acc = document.getElementById('loginAccount').value;
    const pass = document.getElementById('loginPassword').value;
    const res = window.store.login(acc, pass);
    if (res.success) {
      UICommon.showToast(`👋 Chào mừng ${res.user.name} trở lại!`);
      this.closeGlobalModal();
    } else {
      alert(res.message);
    }
  },

  // -----------------------------------------------------------------------
  // 10. AI PHOTO RESTYLE VISION STUDIO (KẾT NỐI API THẬT & ĐỔI ẢNH TÓC KHÁCH)
  // -----------------------------------------------------------------------
  aiState: {
    originalImage: null,
    resultImage: null,
    selectedStyle: 'Side Part 7/3 Hàn Quốc',
    selectedColorName: 'Đen Tự Nhiên',
    selectedColorHex: '#1c1b18',
    customPrompt: '',
    isProcessing: false,
    sliderPos: 50,
    showApiSettings: false
  },

  openAiStudioModal(preselectedStyle = null) {
    // Không dùng popup modal nữa: bản Web và bản App chạy như 1 trang riêng biệt
    const isApp = window.location.pathname.includes('app.html') || document.getElementById('androidScrollContent');
    if (isApp && window.UIApp) {
      if (preselectedStyle) window.UIApp.aiState.selectedStyle = preselectedStyle;
      window.UIApp.switchTab('ai');
      return;
    }

    const webAiSec = document.getElementById('aiStudioSection');
    if (webAiSec) {
      if (preselectedStyle && window.UIWeb) window.UIWeb.selectAiStyle(preselectedStyle);
      webAiSec.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Fallback nếu không tìm thấy container inline
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;
    if (preselectedStyle) this.aiState.selectedStyle = preselectedStyle;
    this.renderAiStudioContent(modalBody);
    modal.classList.add('active');
  },

  renderAiStudioContent(containerEl = null) {
    const modalBody = containerEl || document.getElementById('globalModalBody');
    if (!modalBody) return;

    const { originalImage, resultImage, selectedStyle, selectedColorName, selectedColorHex, isProcessing, showApiSettings } = this.aiState;
    const aiConfig = SalonApi ? SalonApi.getAiConfig() : { provider: 'demo_smart', apiKey: '', endpoint: '' };

    const stylePresets = [
      { name: 'Side Part 7/3 Hàn Quốc', icon: '💇‍♂️' },
      { name: 'Undercut Fade Bén (Hà Hiền)', icon: '💈' },
      { name: 'Uốn Con Sâu / Texture Wave', icon: '🌀' },
      { name: 'Mullet Hiện Đại (Wolf Cut)', icon: '🐺' },
      { name: 'Buzz Cut Quân Đội', icon: '⚡' },
      { name: 'Crop Warrior Phá Cách', icon: '⚔️' },
      { name: 'Pompadour Quý Tộc', icon: '👑' },
      { name: 'Ép Side Tóc Nam (Down Perm)', icon: '✨' }
    ];

    const colorPresets = [
      { name: 'Đen Tự Nhiên', hex: '#1c1b18' },
      { name: 'Nâu Tây Lạnh', hex: '#4a3728' },
      { name: 'Khói Xám Bạc', hex: '#9ca3af' },
      { name: 'Vàng Rêu Khói', hex: '#7a8264' },
      { name: 'Nâu Hạt Dẻ', hex: '#6f4e37' },
      { name: 'Khói Ánh Tím', hex: '#6b46c1' }
    ];

    modalBody.innerHTML = `
      <div class="ai-restyle-modal-box">
        <!-- Header -->
        <div class="ai-modal-header">
          <div class="badge-terracotta pulse-animation">AI PHOTO RESTYLE VISION API • 2026</div>
          <h2 style="font-size: 22px; font-weight: 900; margin: 8px 0 4px; letter-spacing: -0.02em;">
            4RAU AI BARBER STUDIO — THAY ĐỔI KIỂU TÓC BẰNG ẢNH THẬT
          </h2>
          <p style="font-size: 13px; color: #777; margin-bottom: 16px;">
            Chụp hoặc tải ảnh khuôn mặt của bạn lên để AI biến đổi kiểu tóc, màu nhuộm theo xu hướng và gửi lại bức ảnh mới nhất cho bạn.
          </p>
        </div>

        <div class="ai-studio-grid-layout">
          <!-- CỘT TRÁI: KHUNG HIỂN THỊ ẢNH & BEFORE / AFTER SLIDER -->
          <div class="ai-viewport-column">
            ${
              !originalImage
                ? `
                <!-- Khung Upload Ảnh Khi Chưa Có Ảnh -->
                <div class="ai-upload-dropzone" id="aiDropZone" onclick="document.getElementById('aiPhotoFileInput').click()">
                  <input type="file" id="aiPhotoFileInput" accept="image/*" style="display:none;" onchange="UICommon.handleAiPhotoUpload(event)">
                  <input type="file" id="aiCameraFileInput" accept="image/*" capture="user" style="display:none;" onchange="UICommon.handleAiPhotoUpload(event)">
                  
                  <div class="dropzone-icon-box">
                    <svg width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">Kéo thả hoặc bấm để tải ảnh chân dung</h4>
                  <p style="font-size: 12px; color: #888; max-width: 260px; margin: 0 auto 16px;">Hỗ trợ định dạng JPG, PNG rõ khuôn mặt chụp thẳng</p>

                  <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;" onclick="event.stopPropagation();">
                    <button class="btn-sub-action" onclick="document.getElementById('aiPhotoFileInput').click()">
                      📁 Chọn Từ Máy
                    </button>
                    <button class="btn-sub-action" onclick="document.getElementById('aiCameraFileInput').click()">
                      📸 Chụp Selfie
                    </button>
                  </div>

                  <!-- Thử nhanh với ảnh mẫu -->
                  <div class="sample-avatar-strip" onclick="event.stopPropagation();">
                    <span style="font-size: 11px; color: #999; font-weight: 600; display: block; margin-bottom: 8px;">HOẶC THỬ NHANH VỚI ẢNH MẪU:</span>
                    <div style="display: flex; gap: 8px; justify-content: center;">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=140&q=80" 
                           class="sample-avatar-thumb" title="Mẫu Nam 1" onclick="UICommon.loadSampleAiPhoto(this.src)">
                      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=140&q=80" 
                           class="sample-avatar-thumb" title="Mẫu Nam 2" onclick="UICommon.loadSampleAiPhoto(this.src)">
                      <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=140&q=80" 
                           class="sample-avatar-thumb" title="Mẫu Nam 3" onclick="UICommon.loadSampleAiPhoto(this.src)">
                    </div>
                  </div>
                </div>
                `
                : isProcessing
                ? `
                <!-- Khung Hiển Thị Khi AI Đang Phân Tích & Xử Lý -->
                <div class="ai-processing-container">
                  <div class="ai-scan-box">
                    <img src="${originalImage}" class="ai-base-img" alt="Scanning">
                    <div class="ai-scan-laser-line"></div>
                    <div class="ai-scan-grid-overlay"></div>
                  </div>
                  <div class="ai-progress-status-box">
                    <div class="barber-pole-spinner"></div>
                    <div style="font-size: 14px; font-weight: 800; color: #fff; margin-top: 12px;">
                      ĐANG LIÊN KẾT AI XỬ LÝ ẢNH...
                    </div>
                    <div class="ai-status-step-text" id="aiStatusStep">Đang phân tích cấu trúc khuôn mặt & góc cạnh hộp sọ...</div>
                  </div>
                </div>
                `
                : resultImage
                ? `
                <!-- Khung So Sánh Before / After Sau Khi AI Đổi Ảnh Xong -->
                <div class="ai-compare-slider-shell" id="aiCompareShell">
                  <div class="ai-image-compare-wrapper" id="compareWrapper">
                    <!-- Ảnh Sau (AI Result) -->
                    <img src="${resultImage}" class="compare-img compare-img-after" alt="Ảnh Sau Khi Đổi Tóc">
                    <span class="compare-label-after">✨ ẢNH TÓC AI</span>

                    <!-- Ảnh Trước (Original) -->
                    <div class="compare-before-clip" id="compareBeforeClip" style="width: 50%;">
                      <img src="${originalImage}" class="compare-img compare-img-before" alt="Ảnh Gốc">
                      <span class="compare-label-before">ẢNH GỐC</span>
                    </div>

                    <!-- Thanh Kéo Phân Chia (Divider Handle) -->
                    <div class="compare-divider-handle" id="compareHandle" style="left: 50%;">
                      <div class="handle-line"></div>
                      <div class="handle-circle">↔</div>
                    </div>
                  </div>

                  <div class="compare-hint-bar">
                    <span>👈 Kéo thanh tròn sang trái/phải để so sánh Trước & Sau 👉</span>
                  </div>

                  <div class="ai-result-actions-strip">
                    <button class="btn-sub-action" onclick="UICommon.downloadAiResultPhoto()" title="Tải ảnh về máy">
                      📥 Tải Ảnh HD Về Máy
                    </button>
                    <button class="btn-sub-action" onclick="UICommon.resetAiPhoto()">
                      🔄 Đổi Ảnh Khác
                    </button>
                  </div>
                </div>
                `
                : `
                <!-- Ảnh Đã Tải Lên Sẵn Sàng Biến Đổi -->
                <div class="ai-ready-preview-box">
                  <div class="ready-img-wrap">
                    <img src="${originalImage}" class="ready-preview-img" alt="Ảnh Đã Chọn">
                    <span class="ready-tag">ẢNH SẴN SÀNG</span>
                    <button class="btn-change-photo-mini" onclick="UICommon.resetAiPhoto()">Đổi ảnh</button>
                  </div>
                  <div style="font-size: 13px; color: #555; text-align: center; margin-top: 10px;">
                    Đã nhận diện ảnh chân dung. Hãy chọn kiểu tóc bên phải và nhấn <strong>Biến Đổi</strong>!
                  </div>
                </div>
                `
            }
          </div>

          <!-- CỘT PHẢI: BẢNG ĐIỀU KHIỂN CHỌN KIỂU TÓC, MÀU & API -->
          <div class="ai-controls-column">
            <!-- 1. CHỌN MẪU TÓC NAM -->
            <div class="control-group">
              <label class="control-section-label">
                <span>1. CHỌN KIỂU TÓC XU HƯỚNG</span>
                <span class="badge-selected-tag">${selectedStyle}</span>
              </label>
              <div class="style-cards-grid">
                ${stylePresets.map(s => `
                  <button class="style-pill-card ${selectedStyle === s.name ? 'active' : ''}" 
                          onclick="UICommon.selectAiStyle('${s.name}')">
                    <span class="style-icon">${s.icon}</span>
                    <span class="style-title">${s.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 2. CHỌN MÀU NHUỘM TÓC -->
            <div class="control-group" style="margin-top: 14px;">
              <label class="control-section-label">
                <span>2. CHỌN MÀU NHUỘM THỜI THƯỢNG</span>
                <span style="font-size: 12px; font-weight: 700; color: #c85a44;">${selectedColorName}</span>
              </label>
              <div class="color-swatches-grid">
                ${colorPresets.map(c => `
                  <button class="color-swatch-item ${selectedColorName === c.name ? 'active' : ''}" 
                          onclick="UICommon.selectAiColor('${c.name}', '${c.hex}')" 
                          title="${c.name}">
                    <span class="swatch-circle" style="background: ${c.hex};"></span>
                    <span class="swatch-name">${c.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 3. MÔ TẢ YÊU CẦU TÙY BIẾN -->
            <div class="control-group" style="margin-top: 14px;">
              <label class="control-section-label">3. GHI CHÚ YÊU CẦU CHO AI (TÙY CHỌN)</label>
              <input type="text" id="aiCustomPromptInput" class="ai-custom-input" 
                     placeholder="Ví dụ: Fade sát chân tóc, uốn sóng phồng nhẹ, vuốt sáp mờ..."
                     value="${this.aiState.customPrompt || ''}"
                     onchange="UICommon.aiState.customPrompt = this.value">
            </div>

            <!-- 4. NÚT MỞ CÀI ĐẶT API -->
            <div class="ai-api-toggle-row">
              <button class="btn-text-toggle" onclick="UICommon.toggleAiApiSettings()">
                ⚙️ Cài đặt API Key & Endpoint (${aiConfig.provider})
              </button>
            </div>

            <!-- KHUNG CẤU HÌNH API (KHI BẬT) -->
            ${showApiSettings ? `
              <div class="ai-settings-collapsible">
                <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 8px;">CẤU HÌNH KẾT NỐI AI VISION API:</div>
                <div class="api-form-row">
                  <label>Nhà Cung Cấp API:</label>
                  <select id="aiProviderSelect" class="api-input-control" onchange="UICommon.handleAiProviderChange(this.value)">
                    <option value="demo_smart" ${aiConfig.provider === 'demo_smart' ? 'selected' : ''}>4RAU Neural Engine (Sẵn có - Không cần Key)</option>
                    <option value="huggingface" ${aiConfig.provider === 'huggingface' ? 'selected' : ''}>Hugging Face Inference API</option>
                    <option value="replicate" ${aiConfig.provider === 'replicate' ? 'selected' : ''}>Replicate API (SD / Face-to-Many)</option>
                    <option value="openai" ${aiConfig.provider === 'openai' ? 'selected' : ''}>OpenAI Vision / DALL-E 3</option>
                    <option value="custom" ${aiConfig.provider === 'custom' ? 'selected' : ''}>Custom Webhook Backend URL</option>
                  </select>
                </div>
                <div class="api-form-row">
                  <label>API Key (Mã Token):</label>
                  <input type="password" id="aiApiKeyInput" class="api-input-control" placeholder="hf_xxxx... hoặc r8_xxxx..." value="${aiConfig.apiKey || ''}">
                </div>
                <div class="api-form-row">
                  <label>API Endpoint (URL):</label>
                  <input type="text" id="aiEndpointInput" class="api-input-control" placeholder="https://api-inference.huggingface.co/..." value="${aiConfig.endpoint || ''}">
                </div>
                <button class="btn-submit-terracotta" style="width: 100%; padding: 8px; margin-top: 8px; font-size: 12px;" onclick="UICommon.saveAiApiSettings()">
                  💾 Lưu Cấu Hình API
                </button>
              </div>
            ` : ''}

            <!-- 5. CÁC NÚT HÀNH ĐỘNG CHÍNH -->
            <div class="ai-action-buttons-wrap">
              ${!resultImage ? `
                <button class="btn-execute-ai" onclick="UICommon.processAiPhotoRestyle()" ${!originalImage || isProcessing ? 'disabled style="opacity: 0.6;"' : ''}>
                  ⚡ BẮT ĐẦU ĐỔI KIỂU TÓC BẰNG AI →
                </button>
              ` : `
                <button class="btn-submit-terracotta btn-book-now-ai" onclick="UICommon.bookWithAiHairstyle()">
                  📅 ĐẶT LỊCH CẮT KIỂU TÓC NÀY NGAY →
                </button>
                <button class="btn-execute-ai" style="margin-top: 8px; background: #222;" onclick="UICommon.processAiPhotoRestyle()">
                  ✨ Thử Đổi Màu / Kiểu Tóc Khác
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // Nếu đang hiển thị Before/After, khởi tạo tương tác kéo trượt
    if (resultImage && !isProcessing) {
      setTimeout(() => this.initCompareSlider(), 60);
    }
  },

  handleAiPhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.aiState.originalImage = e.target.result;
      this.aiState.resultImage = null;
      this.renderAiStudioContent();
      UICommon.showToast('✅ Đã tải ảnh khuôn mặt lên thành công!');
    };
    reader.readAsDataURL(file);
  },

  loadSampleAiPhoto(imageUrl) {
    this.aiState.originalImage = imageUrl;
    this.aiState.resultImage = null;
    this.renderAiStudioContent();
    UICommon.showToast('✅ Đã chọn ảnh mẫu. Hãy bấm Bắt Đầu Đổi Kiểu Tóc!');
  },

  selectAiStyle(styleName) {
    this.aiState.selectedStyle = styleName;
    this.renderAiStudioContent();
    UICommon.showToast(`💇 Đã chọn kiểu tóc: ${styleName}`);
  },

  selectAiColor(colorName, colorHex) {
    this.aiState.selectedColorName = colorName;
    this.aiState.selectedColorHex = colorHex;
    this.renderAiStudioContent();
    UICommon.showToast(`🎨 Đã chọn màu nhuộm: ${colorName}`);
  },

  toggleAiApiSettings() {
    this.aiState.showApiSettings = !this.aiState.showApiSettings;
    this.renderAiStudioContent();
  },

  handleAiProviderChange(provider) {
    const endpointInput = document.getElementById('aiEndpointInput');
    if (endpointInput) {
      if (provider === 'huggingface') {
        endpointInput.value = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
      } else if (provider === 'replicate') {
        endpointInput.value = 'https://api.replicate.com/v1/predictions';
      } else if (provider === 'openai') {
        endpointInput.value = 'https://api.openai.com/v1/images/generations';
      } else if (provider === 'demo_smart') {
        endpointInput.value = 'Local Neural Engine';
      }
    }
  },

  saveAiApiSettings() {
    const provider = document.getElementById('aiProviderSelect')?.value;
    const apiKey = document.getElementById('aiApiKeyInput')?.value;
    const endpoint = document.getElementById('aiEndpointInput')?.value;

    if (SalonApi) {
      SalonApi.saveAiConfig(provider, apiKey, endpoint);
      UICommon.showToast('💾 Đã lưu cài đặt API thành công!');
      this.aiState.showApiSettings = false;
      this.renderAiStudioContent();
    }
  },

  async processAiPhotoRestyle() {
    if (!this.aiState.originalImage) {
      UICommon.showToast('⚠️ Vui lòng tải hoặc chụp ảnh khuôn mặt trước.', 'warning');
      return;
    }

    this.aiState.isProcessing = true;
    this.renderAiStudioContent();

    // Mô phỏng text trạng thái từng bước
    const stepEl = document.getElementById('aiStatusStep');
    setTimeout(() => { if (stepEl) stepEl.textContent = `Đang cắt phom tóc ${this.aiState.selectedStyle}...`; }, 400);
    setTimeout(() => { if (stepEl) stepEl.textContent = `Đang hòa sắc màu nhuộm ${this.aiState.selectedColorName}...`; }, 900);
    setTimeout(() => { if (stepEl) stepEl.textContent = 'Đang hoàn thiện chi tiết ánh sáng và chất tóc 8K...'; }, 1300);

    try {
      const response = await SalonApi.restyleHairPhoto({
        originalImageBase64: this.aiState.originalImage,
        hairstyleName: this.aiState.selectedStyle,
        hairColorName: this.aiState.selectedColorName,
        hairColorHex: this.aiState.selectedColorHex,
        customPrompt: this.aiState.customPrompt
      });

      this.aiState.isProcessing = false;
      if (response && response.resultImageUrl) {
        this.aiState.resultImage = response.resultImageUrl;
        this.renderAiStudioContent();
        UICommon.showToast(`🎉 Đổi kiểu tóc AI thành công (${response.providerUsed})!`);
      } else {
        throw new Error('Không nhận được ảnh kết quả.');
      }
    } catch (err) {
      this.aiState.isProcessing = false;
      this.renderAiStudioContent();
      UICommon.showToast(`❌ Có lỗi khi tạo ảnh AI: ${err.message}`, 'error');
    }
  },

  initCompareSlider() {
    const wrapper = document.getElementById('compareWrapper');
    const beforeClip = document.getElementById('compareBeforeClip');
    const handle = document.getElementById('compareHandle');
    if (!wrapper || !beforeClip || !handle) return;

    let isSliding = false;

    const updateSlider = (clientX) => {
      const rect = wrapper.getBoundingClientRect();
      let pos = ((clientX - rect.left) / rect.width) * 100;
      if (pos < 2) pos = 2;
      if (pos > 98) pos = 98;
      beforeClip.style.width = `${pos}%`;
      handle.style.left = `${pos}%`;
    };

    wrapper.onmousedown = (e) => { isSliding = true; updateSlider(e.clientX); };
    window.onmousemove = (e) => { if (isSliding) updateSlider(e.clientX); };
    window.onmouseup = () => { isSliding = false; };

    wrapper.ontouchstart = (e) => { isSliding = true; updateSlider(e.touches[0].clientX); };
    window.ontouchmove = (e) => { if (isSliding) updateSlider(e.touches[0].clientX); };
    window.ontouchend = () => { isSliding = false; };
  },

  downloadAiResultPhoto() {
    if (!this.aiState.resultImage) return;
    const a = document.createElement('a');
    a.href = this.aiState.resultImage;
    a.download = `4RAU-AI-Hairstyle-${this.aiState.selectedStyle.replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    UICommon.showToast('📥 Đã tải ảnh kiểu tóc HD về thiết bị của bạn!');
  },

  resetAiPhoto() {
    this.aiState.originalImage = null;
    this.aiState.resultImage = null;
    this.renderAiStudioContent();
  },

  bookWithAiHairstyle() {
    this.closeGlobalModal();
    UICommon.openBookingModal();
    UICommon.showToast(`💇 Đã đưa kiểu tóc "${this.aiState.selectedStyle}" vào ghi chú đặt lịch!`);
  },

  // -----------------------------------------------------------------------
  // 11. TOAST NOTIFICATION VÀ TIỆN ÍCH ĐÓNG MODAL
  // -----------------------------------------------------------------------
  closeGlobalModal() {
    const modal = document.getElementById('globalModal');
    if (modal) modal.classList.remove('active');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-pill-message toast-${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }
};

window.UICommon = UICommon;
