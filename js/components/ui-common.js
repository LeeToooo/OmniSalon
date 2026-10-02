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
  // 6. BOOKING WIZARD ĐẶT LỊCH CHỐNG TRÙNG LỊCH (QUY TRÌNH 4 BƯỚC ĐỘC LẬP)
  // -----------------------------------------------------------------------
  bookingStep: 1, // 1: Dịch vụ & Combo | 2: Stylist | 3: Ngày & Giờ | 4: Hóa đơn & Xác nhận

  bookingData: {
    serviceId: 'DV01',
    branchId: 'CN01',
    stylistId: 'NV02',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:30',
    customerName: '',
    customerPhone: '',
    notes: '',
    voucherCode: '',
    paymentMethod: 'VietQR'
  },

  setBookingStep(step) {
    this.bookingStep = Math.max(1, Math.min(4, step));
    this.refreshBookingWizardUI();
  },

  autoSelectAvailableStylist() {
    const stylists = window.store ? window.store.getStylists(this.bookingData.branchId) : [];
    if (!stylists || stylists.length === 0) return;
    const best = stylists.slice().sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5))[0];
    this.bookingData.stylistId = best.id;
    if (window.AppState) window.AppState.updateBooking({ stylistId: best.id });
    this.showToast(`✨ Đã tự động chọn Chuyên gia: ${best.name} (★ ${best.rating || 5.0})`);
    this.refreshBookingWizardUI();
  },

  openBookingModal(preselectedServiceId = null, preselectedBranchId = null) {
    if (preselectedServiceId) this.bookingData.serviceId = preselectedServiceId;
    if (preselectedBranchId) this.bookingData.branchId = preselectedBranchId;
    if (this.bookingData.branchId === 'br-dbp') this.bookingData.branchId = 'CN01';
    if (this.bookingData.serviceId === 'srv-1') this.bookingData.serviceId = 'DV01';
    if (this.bookingData.stylistId === 'st-1') this.bookingData.stylistId = 'NV02';
    this.bookingStep = 1;
    const user = window.store.getCurrentUser();
    if (user) {
      this.bookingData.customerName = user.name || user.fullName || '';
      this.bookingData.customerPhone = user.phone || '';
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

    // Eager direct lookup: Khử N+1 và tính thời lượng thực tế của dịch vụ/combo đang chọn
    const activeService = window.store.getServiceById(this.bookingData.serviceId)
      || window.store.getComboById(this.bookingData.serviceId)
      || services[0];
    const activeBranch = window.store.getBranchById(this.bookingData.branchId) || branches[0];
    const activeStylist = window.store.getStylistById(this.bookingData.stylistId) || stylists[0];
    const duration = Number(activeService?.duration || activeService?.duration_minutes || 45);
    const slots = window.store.getAvailableSlots(this.bookingData.date, this.bookingData.stylistId, this.bookingData.branchId, duration);
    const estimatedEndTime = SalonUtils.calculateEndTime(this.bookingData.timeSlot, duration);

    // 7 ngày tiếp theo cho Lịch trượt ngang
    const nextDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Hôm nay' : (i === 1 ? 'Ngày mai' : `Th ${d.getDay() === 0 ? 'CN' : d.getDay() + 1}`);
      const dateFormatted = `${d.getDate()}/${d.getMonth() + 1}`;
      return { iso, dayName, dateFormatted };
    });

    return `
      <div class="booking-wizard-wrapper" style="max-width: 980px;">
        <div class="booking-header">
          <div class="badge-terracotta">OMNI SALON • NORDIC MINIMALIST LUXURY</div>
          <h2 class="booking-title">ĐẶT LỊCH TRẢI NGHIỆM SALON 5 SAO</h2>
          <p class="booking-subtitle">Omni Salon — The Art of Modern Hair Care &amp; Grooming</p>
        </div>

        <div class="booking-split-layout">
          <!-- CỘT TRÁI (65%): Multi-step Wizard Pane -->
          <div class="booking-wizard-pane">
            <!-- 4-STEP PROGRESS STEPPER -->
            <div class="booking-stepper-bar">
          <div class="stepper-step ${this.bookingStep >= 1 ? 'active' : ''}" onclick="UICommon.setBookingStep(1)">
            <span class="stepper-num">1</span>
            <span class="stepper-text">Dịch Vụ</span>
          </div>
          <div class="stepper-line ${this.bookingStep >= 2 ? 'active' : ''}"></div>
          <div class="stepper-step ${this.bookingStep >= 2 ? 'active' : ''}" onclick="UICommon.setBookingStep(2)">
            <span class="stepper-num">2</span>
            <span class="stepper-text">Stylist</span>
          </div>
          <div class="stepper-line ${this.bookingStep >= 3 ? 'active' : ''}"></div>
          <div class="stepper-step ${this.bookingStep >= 3 ? 'active' : ''}" onclick="UICommon.setBookingStep(3)">
            <span class="stepper-num">3</span>
            <span class="stepper-text">Thời Gian</span>
          </div>
          <div class="stepper-line ${this.bookingStep >= 4 ? 'active' : ''}"></div>
          <div class="stepper-step ${this.bookingStep >= 4 ? 'active' : ''}" onclick="UICommon.setBookingStep(4)">
            <span class="stepper-num">4</span>
            <span class="stepper-text">Hóa Đơn</span>
          </div>
        </div>

        <form id="bookingWizardForm" onsubmit="event.preventDefault(); UICommon.submitBooking();">
          
          <!-- ================= BƯỚC 1: CHỌN DỊCH VỤ & COMBO ================= -->
          <div class="wizard-step-panel step-1 ${this.bookingStep === 1 ? 'active' : ''}">
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:10px;">
              <label class="booking-label" style="margin:0;">1. Chọn Dịch Vụ Hoặc Gói Combo VIP</label>
              <span style="font-size:12px; color:var(--color-accent-gold); font-weight:700;">★ Ưu đãi combo tới 25%</span>
            </div>

            <div style="font-size:11px; font-weight:800; color:var(--color-text-muted); text-transform:uppercase; margin-bottom:8px; letter-spacing:0.04em;">
              — Gói Combo Thư Giãn Trọn Gói —
            </div>
            <div class="service-select-grid" style="margin-bottom:14px;">
              ${combos.map(c => `
                <div class="service-select-card ${this.bookingData.serviceId === c.id ? 'active' : ''}" 
                     onclick="UICommon.selectBookingService('${c.id}')">
                  <div class="service-tick-btn">${this.bookingData.serviceId === c.id ? '✓' : ''}</div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 13px; font-weight: 800; color: #fff;">👑 ${c.name}</div>
                    <div style="font-size: 11px; color: var(--color-accent-gold); margin: 2px 0;">⏱️ ${c.duration || 75} phút trọn gói</div>
                    <div style="font-size: 13px; font-weight: 900; color: var(--color-accent-gold);">${SalonUtils.formatCurrency(c.price)}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="font-size:11px; font-weight:800; color:var(--color-text-muted); text-transform:uppercase; margin-bottom:8px; letter-spacing:0.04em;">
              — Dịch Vụ Cắt &amp; Tạo Mẫu Đơn Lẻ —
            </div>
            <div class="service-select-grid" style="margin-bottom:16px;">
              ${services.map(s => `
                <div class="service-select-card ${this.bookingData.serviceId === s.id ? 'active' : ''}" 
                     onclick="UICommon.selectBookingService('${s.id}')">
                  <div class="service-tick-btn">${this.bookingData.serviceId === s.id ? '✓' : ''}</div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 13px; font-weight: 800; color: #fff;">${s.name}</div>
                    <div style="font-size: 11px; color: var(--color-text-muted); margin: 2px 0;">⏱️ ${s.duration || 45} phút</div>
                    <div style="font-size: 13px; font-weight: 900; color: var(--color-accent-gold);">${SalonUtils.formatCurrency(s.price)}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Chọn Chi Nhánh Phục Vụ -->
            <div style="margin-bottom: 14px;">
              <label class="booking-label">Chi Nhánh Thuận Tiện Gần Bạn</label>
              <select class="form-control-custom" id="bookingBranchSelect" onchange="UICommon.selectBookingBranch(this.value)">
                ${branches.map(b => `
                  <option value="${b.id}" ${b.id === this.bookingData.branchId ? 'selected' : ''}>${b.TenChiNhanh || b.name} (${b.DiaChi || b.address || ''})</option>
                `).join('')}
              </select>
            </div>

            <!-- Thanh trạng thái tổng tiền cập nhật realtime -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span style="font-size: 12px; color: #94A3B8;">Tạm tính dịch vụ đang chọn:</span>
              <span style="font-size: 16px; font-weight: 900; color: var(--color-accent-gold);">${SalonUtils.formatCurrency(activeService?.price || 0)}</span>
            </div>

            <div style="display:flex; justify-content:flex-end;">
              <button type="button" class="btn-submit-terracotta" onclick="UICommon.setBookingStep(2)">
                Tiếp Theo: Chọn Stylist →
              </button>
            </div>
          </div>

          <!-- ================= BƯỚC 2: CHỌN STYLIST ================= -->
          <div class="wizard-step-panel step-2 ${this.bookingStep === 2 ? 'active' : ''}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
              <label class="booking-label" style="margin:0;">2. Chọn Chuyên Gia Stylist</label>
              <button type="button" class="btn-auto-stylist" onclick="UICommon.autoSelectAvailableStylist()">
                ⚡ Hệ Thống Tự Sắp Xếp Thợ Phù Hợp
              </button>
            </div>

            <div style="margin-bottom: 16px;">
              ${window.StylistCardWidget ? window.StylistCardWidget.renderGrid(stylists, this.bookingData.stylistId, 'UICommon.selectBookingStylist') : ''}
              <select class="form-control-custom" id="bookingStylistSelect" style="display:none;" onchange="UICommon.selectBookingStylist(this.value)">
                ${stylists.map(st => `
                  <option value="${st.id}" ${st.id === this.bookingData.stylistId ? 'selected' : ''}>${st.name} (5.0★)</option>
                `).join('')}
              </select>
            </div>

            <div style="display:flex; justify-content:space-between; gap:10px;">
              <button type="button" class="pill-btn-outline" style="color:#fff;" onclick="UICommon.setBookingStep(1)">
                ← Quay Lại
              </button>
              <button type="button" class="btn-submit-terracotta" onclick="UICommon.setBookingStep(3)">
                Tiếp Theo: Chọn Thời Gian →
              </button>
            </div>
          </div>

          <!-- ================= BƯỚC 3: CHỌN NGÀY & KHUNG GIỜ ================= -->
          <div class="wizard-step-panel step-3 ${this.bookingStep === 3 ? 'active' : ''}">
            <label class="booking-label">3. Chọn Ngày &amp; Khung Giờ Hẹn</label>
            
            <!-- Lịch trượt ngang (Horizontal Date Picker) -->
            <div class="app-date-scroll">
              ${nextDays.map(d => `
                <button type="button" class="date-scroll-chip ${this.bookingData.date === d.iso ? 'active' : ''}" 
                        onclick="UICommon.selectBookingDate('${d.iso}')">
                  <span class="date-chip-day">${d.dayName}</span>
                  <span class="date-chip-num">${d.dateFormatted}</span>
                </button>
              `).join('')}
            </div>

            <div style="margin-bottom: 14px;">
              <input type="date" class="form-control-custom" value="${this.bookingData.date}" 
                     min="${new Date().toISOString().split('T')[0]}" 
                     onchange="UICommon.selectBookingDate(this.value)">
            </div>

            <!-- Bộ chọn khung giờ Sáng / Chiều / Tối dạng Chip -->
            <div id="timeSlotsContainer" style="margin-bottom: 20px;">
              ${window.BookingSlotPicker
        ? window.BookingSlotPicker.render(slots, this.bookingData.timeSlot, 'UICommon.selectBookingSlot')
        : (window.TimeSlotChipsWidget ? window.TimeSlotChipsWidget.render(slots, this.bookingData.timeSlot, 'UICommon.selectBookingSlot') : '')}
            </div>

            <div style="display:flex; justify-content:space-between; gap:10px;">
              <button type="button" class="pill-btn-outline" style="color:#fff;" onclick="UICommon.setBookingStep(2)">
                ← Quay Lại
              </button>
              <button type="button" class="btn-submit-terracotta" onclick="UICommon.setBookingStep(4)">
                Tiếp Theo: Hóa Đơn &amp; Xác Nhận →
              </button>
            </div>
          </div>

          <!-- ================= BƯỚC 4: TÓM TẮT & HÓA ĐƠN SỐ TỐI GIẢN ================= -->
          <div class="wizard-step-panel step-4 ${this.bookingStep === 4 ? 'active' : ''}">
            <label class="booking-label">4. Thông Tin Khách Hàng</label>
            <div class="booking-row-2" style="margin-bottom: 16px;">
              <input type="text" class="form-control-custom" placeholder="Họ và tên của bạn..." 
                     value="${this.bookingData.customerName}" required oninput="UICommon.bookingData.customerName = this.value">
              <input type="tel" class="form-control-custom" placeholder="Số điện thoại (10 chữ số)..." 
                     value="${this.bookingData.customerPhone}" required oninput="UICommon.bookingData.customerPhone = this.value">
            </div>

            <!-- Hóa Đơn Kỹ Thuật Số Tối Giản (Digital Invoice) -->
            <div class="digital-invoice-card booking-summary-card">
              <div class="digital-invoice-header">
                <span class="digital-invoice-title">HÓA ĐƠN ĐIỆN TỬ OMNI SALON</span>
                <span class="digital-invoice-badge">● Chống Trùng Ca 100%</span>
              </div>
              <div class="invoice-line-item summary-line">
                <span>Dịch vụ lựa chọn:</span>
                <strong id="bookingSummaryServiceName">${activeService.name}</strong>
              </div>
              <div class="invoice-line-item summary-line">
                <span>Thời lượng ca:</span>
                <strong style="color:var(--color-accent-gold);" id="bookingSummaryDurationText">⏱️ ${duration} phút (~ ${estimatedEndTime} xong)</strong>
              </div>
              <div class="invoice-line-item summary-line">
                <span>Chuyên gia phục vụ:</span>
                <strong>${activeStylist?.name || 'Master Stylist'}</strong>
              </div>
              <div class="invoice-line-item summary-line">
                <span>Cơ sở thực hiện:</span>
                <span id="bookingSummaryBranchName">${activeBranch.name}</span>
              </div>
              <div class="invoice-line-item summary-line">
                <span>Khung giờ hẹn:</span>
                <span id="bookingSummaryTimeRangeText" style="color:var(--color-accent-gold); font-weight:700;">${this.bookingData.timeSlot} - ${estimatedEndTime} (${SalonUtils.formatDate(this.bookingData.date)})</span>
              </div>
              <div class="invoice-total-line summary-line total-line">
                <span class="invoice-total-label">Tổng Chi Phí:</span>
                <span class="invoice-total-price price-big" id="bookingSummaryPrice">${SalonUtils.formatCurrency(activeService.price)}</span>
              </div>
            </div>

            <!-- Phương thức thanh toán -->
            <div style="margin-bottom: 20px;">
              <span class="sub-label">Phương Thức Thanh Toán Ưu Tiên:</span>
              <div style="display:flex; gap:10px;">
                <label style="flex:1; display:flex; align-items:center; gap:8px; padding:10px 14px; background:var(--surface-card); border:1px solid var(--border-color); border-radius:12px; cursor:pointer;">
                  <input type="radio" name="payMethod" value="VietQR" checked onchange="UICommon.bookingData.paymentMethod = 'VietQR'">
                  <span style="font-size:12px; font-weight:700; color:var(--text-primary);">💳 VietQR Tự Động</span>
                </label>
                <label style="flex:1; display:flex; align-items:center; gap:8px; padding:10px 14px; background:var(--surface-card); border:1px solid var(--border-color); border-radius:12px; cursor:pointer;">
                  <input type="radio" name="payMethod" value="Cash" onchange="UICommon.bookingData.paymentMethod = 'Cash'">
                  <span style="font-size:12px; font-weight:700; color:var(--text-primary);">💵 Thanh Toán Tại Quầy</span>
                </label>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; gap:10px;">
              <button type="button" class="pill-btn-outline" style="color:#fff;" onclick="UICommon.setBookingStep(3)">
                ← Quay Lại
              </button>
              <button type="submit" class="btn-submit-terracotta" style="flex:1;">
                Xác Nhận Đặt Lịch Ngay →
              </button>
            </div>
          </div>

        </form>
          </div>

          <!-- CỘT PHẢI (35%): Live Order Summary Card (Ghim cố định Sticky) -->
          <div class="booking-sticky-sidebar">
            <div class="sticky-summary-card">
              <div class="sticky-summary-header">
                <span class="quick-booking-badge">LIVE SUMMARY</span>
                <h4 style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; color: #FFF;">Tóm Tắt Đặt Ca</h4>
                <span style="font-size: 11px; color: var(--color-accent-gold);">● Cập nhật thời gian thực</span>
              </div>
              <div class="sticky-summary-body">
                <div class="summary-line" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12.5px;">
                  <span style="color: #94A3B8;">Chi nhánh:</span>
                  <strong style="color: #FFF;">${activeBranch.name.split('—')[0]}</strong>
                </div>
                <div class="summary-line" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12.5px;">
                  <span style="color: #94A3B8;">Dịch vụ:</span>
                  <strong style="color: var(--color-accent-gold);">${activeService.name}</strong>
                </div>
                <div class="summary-line" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12.5px;">
                  <span style="color: #94A3B8;">Thời lượng:</span>
                  <span style="color: #E2E8F0;">⏱️ ${duration} phút (~ ${estimatedEndTime} xong)</span>
                </div>
                <div class="summary-line" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12.5px;">
                  <span style="color: #94A3B8;">Chuyên gia:</span>
                  <strong style="color: #FFF;">★ ${activeStylist?.name || 'Master Stylist'}</strong>
                </div>
                <div class="summary-line" style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12.5px;">
                  <span style="color: #94A3B8;">Khung giờ:</span>
                  <strong style="color: #10B981;">⏰ ${this.bookingData.timeSlot} — ${SalonUtils.formatDate(this.bookingData.date)}</strong>
                </div>
                <div class="summary-line total-line" style="border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px; display: flex; justify-content: space-between; align-items: baseline;">
                  <span style="font-size: 13px; font-weight: 800; color: #FFF;">Tổng Tạm Tính:</span>
                  <span class="price-big" style="font-size: 18px; font-weight: 900; color: var(--color-accent-gold);">${SalonUtils.formatCurrency(activeService.price)}</span>
                </div>
              </div>
              <div style="padding: 14px 18px; background: rgba(0,0,0,0.25); border-top: 1px solid rgba(255,255,255,0.06); border-radius: 0 0 16px 16px;">
                ${this.bookingStep < 4 ? `
                  <button type="button" class="btn-submit-terracotta" style="width: 100%; font-size: 13px; padding: 10px;" onclick="UICommon.setBookingStep(${this.bookingStep + 1})">
                    Tiếp Tục Bước ${this.bookingStep + 1} →
                  </button>
                ` : `
                  <button type="button" class="btn-submit-terracotta" style="width: 100%; font-size: 13px; padding: 10px;" onclick="UICommon.submitBooking()">
                    ✨ Hoàn Tất Đặt Lịch
                  </button>
                `}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  selectBookingService(serviceId) {
    this.bookingData.serviceId = serviceId;
    if (window.AppState) window.AppState.updateBooking({ serviceId });
    this.refreshBookingWizardUI();
  },

  selectBookingBranch(branchId) {
    this.bookingData.branchId = branchId;
    const stylists = window.store.getStylists(branchId);
    if (stylists.length > 0) this.bookingData.stylistId = stylists[0].id;
    if (window.AppState) window.AppState.updateBooking({ branchId, stylistId: this.bookingData.stylistId });
    this.refreshBookingWizardUI();
  },

  selectBookingStylist(stylistId) {
    this.bookingData.stylistId = stylistId;
    if (window.AppState) window.AppState.updateBooking({ stylistId });
    this.refreshBookingWizardUI();
  },

  selectBookingDate(dateVal) {
    this.bookingData.date = dateVal;
    if (window.AppState) window.AppState.updateBooking({ date: dateVal });
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
    if (window.AppState) window.AppState.updateBooking({ timeSlot: slotTime });
    const btns = document.querySelectorAll('.time-slot-btn');
    btns.forEach(b => {
      if (b.textContent.trim() === slotTime) b.classList.add('active');
      else b.classList.remove('active');
    });

    // Frontend Performance: Cập nhật trực tiếp text target tránh re-render làm mất state form input
    const activeService = window.store.getServiceById(this.bookingData.serviceId)
      || window.store.getComboById(this.bookingData.serviceId);
    const duration = Number(activeService?.duration || activeService?.duration_minutes || 45);
    const estimatedEndTime = SalonUtils.calculateEndTime(slotTime, duration);

    const durEl = document.getElementById('bookingSummaryDurationText');
    if (durEl) durEl.textContent = `⏱️ ${duration} phút (~ ${estimatedEndTime} xong)`;

    const rangeEl = document.getElementById('bookingSummaryTimeRangeText');
    if (rangeEl) rangeEl.textContent = `${slotTime} - ${estimatedEndTime} (${SalonUtils.formatDate(this.bookingData.date)})`;
  },

  bindBookingSlotEvents() { },

  submitBooking() {
    const rawName = (this.bookingData.customerName || '').trim();
    const phone = (this.bookingData.customerPhone || '').trim();

    if (!rawName) {
      UICommon.showToast('⚠️ Vui lòng nhập họ và tên khách hàng!', 'warning');
      return;
    }
    // OWASP A03 XSS Defense: Chặn script injection và mã hóa HTML Entities
    if (/<script\b|javascript:|onerror=|onload=/i.test(rawName)) {
      UICommon.showToast('⚠️ Họ và tên chứa ký tự không an toàn!', 'warning');
      return;
    }
    const name = rawName.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' }[c]));

    if (!phone || !/^[0-9]{9,11}$/.test(phone)) {
      UICommon.showToast('⚠️ Số điện thoại không hợp lệ (cần 9-11 chữ số)!', 'warning');
      return;
    }
    if (!this.bookingData.date) {
      UICommon.showToast('⚠️ Vui lòng chọn ngày hẹn!', 'warning');
      return;
    }
    if (!this.bookingData.timeSlot) {
      UICommon.showToast('⚠️ Vui lòng chọn khung giờ hẹn!', 'warning');
      return;
    }

    // Khử N+1: Direct lookups O(1) thay vì nạp toàn bộ danh sách để find() lặp lại
    const service = window.store.getServiceById(this.bookingData.serviceId)
      || window.store.getComboById(this.bookingData.serviceId);
    const stylist = window.store.getStylistById(this.bookingData.stylistId);
    const branch = window.store.getBranchById(this.bookingData.branchId);
    const duration = Number(service ? (service.duration || service.duration_minutes || 45) : 45);
    const user = window.store.getCurrentUser();

    const rawNotes = (this.bookingData.notes || '').trim();
    const cleanNotes = rawNotes ? rawNotes.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' }[c])) : '';
    const paymentMethod = this.bookingData.paymentMethod || 'VietQR';

    try {
      const newBooking = window.store.addBooking({
        userId: user ? user.id : null,
        serviceId: this.bookingData.serviceId,
        serviceName: service ? service.name : 'Cắt Tóc Barber',
        comboId: service && service.category === 'combo' ? service.id : null,
        durationMinutes: duration,
        branchId: this.bookingData.branchId,
        branchName: branch ? branch.name : '4RAU Barbershop',
        stylistId: this.bookingData.stylistId,
        stylistName: stylist ? stylist.name : 'Master Barber',
        date: this.bookingData.date,
        timeSlot: this.bookingData.timeSlot,
        customerName: name,
        customerPhone: phone,
        totalPrice: service ? service.price : 180000,
        paymentMethod: paymentMethod,
        notes: cleanNotes
      });

      this.closeGlobalModal();
      this.openBookingSuccessModal(newBooking);
    } catch (err) {
      UICommon.showToast(err.message || 'Lỗi khi đặt lịch!', 'error');
    }
  },

  openBookingSuccessModal(booking) {
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    const qrSvg = SalonUtils.generateQrSvgCode('#BK-' + (booking.bookingCode || booking.id), { size: 160, fg: '#1c1917' });
    const endTime = booking.estimatedEndTime || SalonUtils.calculateEndTime(booking.timeSlot, booking.durationMinutes || 45);

    modalBody.innerHTML = `
      <div class="booking-success-box">
        <div class="success-icon" style="background:#10b981;">✓</div>
        <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 6px;">ĐẶT LỊCH THÀNH CÔNG!</h2>
        <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
          Mã vé điện tử: <strong style="color: #c85a44;">#${booking.bookingCode || booking.id}</strong>. 4RAU Barbershop cam kết phục vụ đúng giờ!
        </p>

        <div class="booking-invoice-card">
          <div class="invoice-item"><span>Gói dịch vụ:</span><strong>${booking.serviceName} (${booking.durationMinutes || 45} phút)</strong></div>
          <div class="invoice-item"><span>Cơ sở phục vụ:</span><span>${booking.branchName}</span></div>
          <div class="invoice-item"><span>Barber thực hiện:</span><strong>${booking.stylistName}</strong></div>
          <div class="invoice-item"><span>Khung giờ hẹn:</span><strong>${booking.timeSlot} - ${endTime} (${SalonUtils.formatDate(booking.date)})</strong></div>
          <div class="invoice-item"><span>Khách hàng:</span><span>${booking.customerName} (${booking.customerPhone})</span></div>
          <div class="invoice-item price-row"><span>Tổng thanh toán:</span><strong style="color: #c85a44; font-size: 18px;">${SalonUtils.formatCurrency(booking.totalPrice)}</strong></div>
        </div>

        <!-- Mã QR Vector SVG Chuẩn 4RAU -->
        <div class="booking-qr-card" style="margin-top: 16px; padding: 16px; background: #fafafa; border-radius: 12px; text-align: center; border: 1px dashed #ccc;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; text-transform: uppercase;">MÃ QR VÉ ĐIỆN TỬ CHECK-IN TẠI QUẦY</div>
          <div style="display: flex; justify-content: center; margin: 10px 0;">
            ${qrSvg}
          </div>
          <div style="font-size: 12px; color: #666;">Đưa mã QR này cho Tiếp tân khi đến để được nhận ghế ngay không cần chờ!</div>
        </div>

        <div style="margin-top: 18px; display: flex; gap: 12px; justify-content: center;">
          <button class="btn-submit-terracotta" style="width: 100%;" onclick="UICommon.closeGlobalModal()">Hoàn Tất & Đóng</button>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  // -----------------------------------------------------------------------
  // 7. GIỎ HÀNG (DRAWER WEB & BOTTOM SHEET MOBILE)
  // -----------------------------------------------------------------------
  // -----------------------------------------------------------------------
  // 7. GIỎ HÀNG (DRAWER WEB & BOTTOM SHEET MOBILE) VỚI GIAO HÀNG & VOUCHER
  // -----------------------------------------------------------------------
  cartState: {
    deliveryType: 'PICKUP_BRANCH', // 'PICKUP_BRANCH' | 'DELIVERY'
    pickupBranchId: 'br-dbp',
    deliveryAddress: '',
    recipientName: '',
    recipientPhone: '',
    voucherCode: '',
    appliedVoucher: null,
    discountAmount: 0
  },

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

  setCartDeliveryType(type) {
    this.cartState.deliveryType = type;
    this.renderCartDrawerContent();
  },

  setCartPickupBranch(branchId) {
    this.cartState.pickupBranchId = branchId;
  },

  applyCartVoucher(code = null) {
    const inputEl = document.getElementById('cartVoucherInput');
    const voucherCode = (code || (inputEl ? inputEl.value : '')).trim().toUpperCase();

    if (!voucherCode) {
      this.showToast('Vui lòng nhập mã ưu đãi (Voucher)!', 'warning');
      return;
    }

    const cart = window.store.getCart();
    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const promos = window.store.getPromotions ? window.store.getPromotions() : [];

    if (window.PricingService) {
      const res = window.PricingService.processVoucherCode(voucherCode, subtotal, promos);
      if (!res.isValid) {
        this.showToast(`⚠️ ${res.message}`, 'warning');
        return;
      }
      this.cartState.voucherCode = voucherCode;
      this.cartState.appliedVoucher = res.voucher;
      this.cartState.discountAmount = res.discountAmount;
      this.showToast(`🎉 Áp dụng voucher [${voucherCode}] giảm ${SalonUtils.formatCurrency(res.discountAmount)}!`);
    } else {
      const voucher = promos.find(p => (p.code || '').toUpperCase() === voucherCode);
      if (!voucher) {
        this.showToast(`Mã ưu đãi [${voucherCode}] không tồn tại trên hệ thống!`, 'error');
        return;
      }
      this.cartState.voucherCode = voucherCode;
      this.cartState.appliedVoucher = voucher;
      this.cartState.discountAmount = voucher.discountValue || 50000;
      this.showToast(`🎉 Đã áp dụng mã [${voucherCode}]!`);
    }

    this.renderCartDrawerContent();
  },

  removeCartVoucher() {
    this.cartState.voucherCode = '';
    this.cartState.appliedVoucher = null;
    this.cartState.discountAmount = 0;
    this.showToast('Đã hủy áp dụng voucher!');
    this.renderCartDrawerContent();
  },

  renderCartDrawerContent() {
    const listContainer = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('cartTotalAmount');
    if (!listContainer) return;

    const cart = window.store.getCart();
    const branches = window.store.getBranches();
    let subtotal = 0;

    if (cart.length === 0) {
      listContainer.innerHTML = `
        <div class="cart-empty-state">
          <div style="font-size: 40px; margin-bottom: 10px;">🛍️</div>
          <div style="font-weight: 600; font-size: 15px;">Giỏ hàng của bạn đang trống</div>
          <div style="font-size: 13px; color: #888; margin-top: 4px;">Hãy chọn các dòng sáp vuốt, pomade, áo nón 4RAU cực chất!</div>
        </div>
      `;
      if (totalEl) totalEl.textContent = '0 đ';
      this.cartState.appliedVoucher = null;
      this.cartState.discountAmount = 0;
      return;
    }

    subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    // Tính lại giảm giá voucher nếu giỏ hàng thay đổi
    if (this.cartState.appliedVoucher && window.PricingService) {
      const vRes = window.PricingService.applyVoucher(this.cartState.appliedVoucher, subtotal);
      if (vRes.isValid) {
        this.cartState.discountAmount = vRes.discountAmount;
      } else {
        this.cartState.appliedVoucher = null;
        this.cartState.discountAmount = 0;
      }
    }

    const finalTotal = Math.max(0, subtotal - this.cartState.discountAmount);

    let html = `
      <div class="cart-items-wrapper">
        ${cart.map(item => `
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
        `).join('')}
      </div>

      <!-- PHƯƠNG THỨC NHẬN HÀNG (DELIVERY / PICKUP) -->
      <div class="cart-fulfillment-card" style="margin: 14px 0 8px; padding: 12px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
        <div style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: uppercase; margin-bottom: 8px;">
          Hình Thức Nhận Hàng:
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button type="button" 
                  style="flex: 1; padding: 7px 4px; font-size: 11px; font-weight: 700; border-radius: 8px; cursor: pointer; border: 1px solid ${this.cartState.deliveryType === 'PICKUP_BRANCH' ? '#c85a44' : '#d1d5db'}; background: ${this.cartState.deliveryType === 'PICKUP_BRANCH' ? '#fff6f4' : '#fff'}; color: ${this.cartState.deliveryType === 'PICKUP_BRANCH' ? '#c85a44' : '#4b5563'};"
                  onclick="UICommon.setCartDeliveryType('PICKUP_BRANCH')">
            🏢 Lấy Tại Chi Nhánh
          </button>
          <button type="button" 
                  style="flex: 1; padding: 7px 4px; font-size: 11px; font-weight: 700; border-radius: 8px; cursor: pointer; border: 1px solid ${this.cartState.deliveryType === 'DELIVERY' ? '#c85a44' : '#d1d5db'}; background: ${this.cartState.deliveryType === 'DELIVERY' ? '#fff6f4' : '#fff'}; color: ${this.cartState.deliveryType === 'DELIVERY' ? '#c85a44' : '#4b5563'};"
                  onclick="UICommon.setCartDeliveryType('DELIVERY')">
            🚚 Giao Tận Nơi (COD)
          </button>
        </div>

        ${this.cartState.deliveryType === 'PICKUP_BRANCH' ? `
          <div>
            <select class="form-control-custom" style="font-size: 12px; padding: 6px 10px;" onchange="UICommon.setCartPickupBranch(this.value)">
              ${branches.map(b => `<option value="${b.id}" ${b.id === this.cartState.pickupBranchId ? 'selected' : ''}>Chi nhánh: ${b.name.split('—')[0]}</option>`).join('')}
            </select>
            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Giữ hàng miễn phí tại quầy 4RAU trong 48h</div>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="text" id="cartDeliveryAddress" class="form-control-custom" placeholder="Nhập địa chỉ nhận hàng (Số nhà, đường, quận/huyện)..." 
                   style="font-size: 12px; padding: 6px 10px;" value="${this.cartState.deliveryAddress || ''}" 
                   oninput="UICommon.cartState.deliveryAddress = this.value">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <input type="text" id="cartRecipientName" class="form-control-custom" placeholder="Họ tên người nhận..."
                     style="font-size: 12px; padding: 6px 10px;" value="${this.cartState.recipientName || ''}"
                     oninput="UICommon.cartState.recipientName = this.value">
              <input type="tel" id="cartRecipientPhone" class="form-control-custom" placeholder="Số điện thoại..."
                     style="font-size: 12px; padding: 6px 10px;" value="${this.cartState.recipientPhone || ''}"
                     oninput="UICommon.cartState.recipientPhone = this.value">
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Đồng giá ship 20.000đ • Miễn phí ship cho đơn từ 500k</div>
          </div>
        `}
      </div>

      <!-- MÃ VOUCHER ƯU ĐÃI -->
      <div class="cart-voucher-card" style="margin-bottom: 12px; padding: 10px; background: #ffffff; border-radius: 10px; border: 1px dashed #d1d5db;">
        ${this.cartState.appliedVoucher ? `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 12px; font-weight: 800; color: #059669;">🎟️ [${this.cartState.voucherCode}]</span>
              <span style="font-size: 12px; color: #059669; font-weight: 700; margin-left: 4px;">-${SalonUtils.formatCurrency(this.cartState.discountAmount)}</span>
            </div>
            <button type="button" style="font-size: 11px; color: #dc2626; border: none; background: none; cursor: pointer; text-decoration: underline;" onclick="UICommon.removeCartVoucher()">
              Gỡ mã
            </button>
          </div>
        ` : `
          <div style="display: flex; gap: 6px;">
            <input type="text" id="cartVoucherInput" class="form-control-custom" placeholder="Mã giảm giá (VD: OMNIWELCOME)" style="font-size: 12px; padding: 6px 10px; text-transform: uppercase;">
            <button type="button" class="btn-submit-terracotta" style="padding: 6px 14px; font-size: 11px; white-space: nowrap;" onclick="UICommon.applyCartVoucher()">
              Áp Dụng
            </button>
          </div>
        `}
      </div>

      <!-- TỔNG KẾT TIỀN -->
      <div class="cart-summary-breakdown" style="font-size: 12px; color: #4b5563; border-top: 1px solid #f3f4f6; padding-top: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Tiền hàng:</span>
          <span>${SalonUtils.formatCurrency(subtotal)}</span>
        </div>
        ${this.cartState.discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #059669; font-weight: 700;">
            <span>Voucher giảm giá:</span>
            <span>-${SalonUtils.formatCurrency(this.cartState.discountAmount)}</span>
          </div>
        ` : ''}
      </div>
    `;

    listContainer.innerHTML = html;
    if (totalEl) totalEl.textContent = SalonUtils.formatCurrency(finalTotal);
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

    const branchId = this.cartState.pickupBranchId || 'br-dbp';
    const branch = window.store.getBranchById(branchId);

    let cleanAddress = 'Nhận tại quầy chi nhánh';
    if (this.cartState.deliveryType === 'DELIVERY') {
      const addr = (this.cartState.deliveryAddress || '').trim();
      if (!addr) {
        UICommon.showToast('⚠️ Vui lòng nhập địa chỉ nhận hàng chi tiết!', 'warning');
        const addrInput = document.getElementById('cartDeliveryAddress');
        if (addrInput) addrInput.focus();
        return;
      }
      // OWASP A03 XSS Defense: Chặn script injection vào địa chỉ giao hàng
      if (/<script\b|javascript:|onerror=|onload=/i.test(addr)) {
        UICommon.showToast('⚠️ Địa chỉ nhận hàng chứa ký tự không an toàn!', 'warning');
        return;
      }
      cleanAddress = addr.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' }[c]));
    } else {
      cleanAddress = `Nhận tại chi nhánh ${branch ? branch.name.split('—')[0].trim() : '4RAU'}`;
    }

    // DRY & Khử N+1: Kiểm tra tồn kho toàn bộ giỏ hàng qua checkStockBatch O(N+M)
    const stockCheck = window.store.checkStockBatch ? window.store.checkStockBatch(branchId, cart) : { available: true };
    if (!stockCheck.available) {
      UICommon.showToast(`⚠️ Sản phẩm [${stockCheck.productName}] chỉ còn ${stockCheck.inStock} cái tại chi nhánh ${branch ? branch.name.split('—')[0] : ''}!`, 'warning');
      return;
    }

    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const discount = this.cartState.discountAmount || 0;
    const finalTotal = Math.max(0, subtotal - discount);
    const user = window.store.getCurrentUser();

    let customerName = user ? (user.fullName || user.name) : 'Khách Mua Tại Web/App';
    let customerPhone = user ? user.phone : '0908123456';

    if (this.cartState.deliveryType === 'DELIVERY') {
      const recName = (this.cartState.recipientName || '').trim();
      const recPhone = (this.cartState.recipientPhone || '').trim();
      if (recName) {
        customerName = recName.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#27;' }[c]));
      }
      if (recPhone) {
        if (!/^[0-9]{9,11}$/.test(recPhone)) {
          UICommon.showToast('⚠️ Số điện thoại nhận hàng không hợp lệ (9-11 chữ số)!', 'warning');
          const phoneInput = document.getElementById('cartRecipientPhone');
          if (phoneInput) phoneInput.focus();
          return;
        }
        customerPhone = recPhone;
      } else if (!user) {
        UICommon.showToast('⚠️ Vui lòng nhập số điện thoại người nhận để giao hàng!', 'warning');
        const phoneInput = document.getElementById('cartRecipientPhone');
        if (phoneInput) phoneInput.focus();
        return;
      }
    }

    // Clean Architecture & DRY: store.createOrder tự động hạch toán voucher và trừ tồn kho nguyên tử
    const order = window.store.createOrder({
      customerName,
      customerPhone,
      branchId,
      branchName: branch ? branch.name : '4RAU Điện Biên Phủ',
      deliveryType: this.cartState.deliveryType,
      deliveryAddress: cleanAddress,
      shippingAddress: cleanAddress,
      items: cart,
      subtotal,
      discountAmount: discount,
      voucherCode: this.cartState.voucherCode || null,
      totalAmount: finalTotal,
      paymentMethod: this.cartState.deliveryType === 'PICKUP_BRANCH' ? 'Thanh toán trực tiếp khi nhận tại quầy' : 'VietQR / Trả Khi Nhận Hàng (COD)'
    });

    // Reset giỏ hàng
    window.store.state.cart = [];
    window.store.saveState();
    this.cartState.appliedVoucher = null;
    this.cartState.voucherCode = '';
    this.cartState.discountAmount = 0;
    this.cartState.deliveryAddress = '';
    this.cartState.recipientName = '';
    this.cartState.recipientPhone = '';

    this.closeCartDrawer();
    this.updateCartBadges();
    UICommon.showToast(`🎉 Đặt đơn hàng #${order.id} thành công!`, 'success');
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
          Mã đơn hàng: <strong style="color: #c85a44;">#${order.id}</strong>. Bộ phận kho 4RAU sẽ chuẩn bị và phục vụ bạn sớm nhất.
        </p>
        <div class="booking-invoice-card">
          <div class="invoice-item">
            <span>Phương thức:</span>
            <strong>${order.deliveryType === 'PICKUP_BRANCH' ? '🏢 Nhận tại quầy chi nhánh' : '🚚 Giao hàng tận nhà'}</strong>
          </div>
          ${order.items.map(it => `
            <div class="invoice-item">
              <span>${it.name} (x${it.qty}):</span>
              <strong>${SalonUtils.formatCurrency(it.price * it.qty)}</strong>
            </div>
          `).join('')}
          ${order.discountAmount > 0 ? `
            <div class="invoice-item" style="color: #059669;">
              <span>Voucher giảm giá:</span>
              <strong>-${SalonUtils.formatCurrency(order.discountAmount)}</strong>
            </div>
          ` : ''}
          <div class="invoice-item price-row">
            <span>Tổng thanh toán:</span>
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
  // 9. MODAL ĐĂNG NHẬP / TÀI KHOẢN (ROLE SWITCHER 5 VAI TRÒ & TAB ĐĂNG KÝ)
  // -----------------------------------------------------------------------
  authTab: 'login', // 'login' | 'register'

  openAuthModal(tab = 'login') {
    this.authTab = tab;
    const modal = document.getElementById('globalModal');
    const modalBody = document.getElementById('globalModalBody');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <div class="auth-modal-box" style="max-width: 460px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 14px;">
          <div class="badge-terracotta">OMNI SALON SUITE</div>
          <h2 style="font-size: 20px; font-weight: 900; margin: 8px 0 4px;">CỔNG XÁC THỰC THÀNH VIÊN</h2>
          <p style="font-size: 12px; color: #666;">Đồng bộ đa nền tảng Web Portal, App Android/iOS & Quản Trị</p>
        </div>

        <!-- 2 Tabs: Đăng Nhập vs Đăng Ký -->
        <div class="auth-tab-switch-header" style="display: flex; gap: 8px; margin-bottom: 18px; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
          <button type="button" class="auth-tab-btn ${this.authTab === 'login' ? 'active' : ''}" 
                  style="flex: 1; padding: 8px; font-size: 13px; font-weight: 800; border: none; background: none; cursor: pointer; color: ${this.authTab === 'login' ? '#D4AF37' : '#94A3B8'}; border-bottom: ${this.authTab === 'login' ? '2px solid #D4AF37' : 'none'}; margin-bottom: -10px;"
                  onclick="UICommon.openAuthModal('login')">
            🔑 Đăng Nhập
          </button>
          <button type="button" class="auth-tab-btn ${this.authTab === 'register' ? 'active' : ''}" 
                  style="flex: 1; padding: 8px; font-size: 13px; font-weight: 800; border: none; background: none; cursor: pointer; color: ${this.authTab === 'register' ? '#D4AF37' : '#94A3B8'}; border-bottom: ${this.authTab === 'register' ? '2px solid #D4AF37' : 'none'}; margin-bottom: -10px;"
                  onclick="UICommon.openAuthModal('register')">
            ✨ Đăng Ký Mới
          </button>
        </div>

        ${this.authTab === 'login' ? `
          <!-- TAB ĐĂNG NHẬP -->
          <form onsubmit="event.preventDefault(); UICommon.handleLogin();">
            <div style="margin-bottom: 12px;">
              <label class="sub-label">Email hoặc Tên đăng nhập:</label>
              <input type="text" id="loginAccount" class="form-control-custom" value="admin" required autocomplete="username">
            </div>
            <div style="margin-bottom: 16px;">
              <label class="sub-label">Mật khẩu:</label>
              <input type="password" id="loginPassword" class="form-control-custom" value="admin123" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn-submit-terracotta" style="width:100%; padding: 12px; font-weight: 800;">Đăng Nhập Ngay →</button>
          </form>

          <!-- ROLE SWITCHER 1-CHẠM 5 VAI TRÒ CHUẨN RBAC -->
          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed rgba(255,255,255,0.15);">
            <div style="font-size: 11px; font-weight: 800; color: #F59E0B; text-transform: uppercase; margin-bottom: 10px; text-align: center;">
              ⚡ Chuyển Đổi Nhanh 5 Vai Trò (1-Chạm Đăng Nhập):
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
              <button type="button" class="role-switch-pill" onclick="UICommon.quickLoginRole('SUPER_ADMIN')" 
                      style="padding: 8px; border-radius: 8px; border: 1px solid rgba(245,158,11,0.3); background: rgba(245,158,11,0.08); text-align: left; cursor: pointer; font-size: 11px;">
                <div style="font-weight: 800; color: #F59E0B;">👑 Super Admin</div>
                <div style="font-size: 10px; color: #94A3B8;">Chủ Tịch OmniSalon (admin)</div>
              </button>
              <button type="button" class="role-switch-pill" onclick="UICommon.quickLoginRole('BRANCH_MANAGER')" 
                      style="padding: 8px; border-radius: 8px; border: 1px solid rgba(59,130,246,0.3); background: rgba(59,130,246,0.08); text-align: left; cursor: pointer; font-size: 11px;">
                <div style="font-weight: 800; color: #60A5FA;">🏢 Quản Lý Chi Nhánh</div>
                <div style="font-size: 10px; color: #94A3B8;">Trần Minh Hoàng (hoang.ql)</div>
              </button>
              <button type="button" class="role-switch-pill" onclick="UICommon.quickLoginRole('STYLIST')" 
                      style="padding: 8px; border-radius: 8px; border: 1px solid rgba(168,85,247,0.3); background: rgba(168,85,247,0.08); text-align: left; cursor: pointer; font-size: 11px;">
                <div style="font-weight: 800; color: #C084FC;">💈 Master Stylist</div>
                <div style="font-size: 10px; color: #94A3B8;">Lê Thị Hương (huong.stylist)</div>
              </button>
              <button type="button" class="role-switch-pill" onclick="UICommon.quickLoginRole('CASHIER')" 
                      style="padding: 8px; border-radius: 8px; border: 1px solid rgba(34,197,94,0.3); background: rgba(34,197,94,0.08); text-align: left; cursor: pointer; font-size: 11px;">
                <div style="font-weight: 800; color: #4ADE80;">💳 Thu Ngân Quầy</div>
                <div style="font-size: 10px; color: #94A3B8;">Nguyễn Thị Lan (lan.tn)</div>
              </button>
            </div>
            <div style="margin-top: 6px;">
              <button type="button" class="role-switch-pill" onclick="UICommon.quickLoginRole('CUSTOMER')" 
                      style="width: 100%; padding: 7px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); text-align: center; cursor: pointer; font-size: 11px; font-weight: 800; color: #E2E8F0;">
                👤 Đăng Nhập Khách Hàng VIP (Ngô Văn Tuấn - kh_vantuan)
              </button>
            </div>
          </div>
        ` : `
          <!-- TAB ĐĂNG KÝ -->
          <form onsubmit="event.preventDefault(); UICommon.handleRegister();">
            <div style="margin-bottom: 10px;">
              <label class="sub-label">Họ và Tên Khách Hàng:</label>
              <input type="text" id="regFullName" class="form-control-custom" placeholder="Nguyễn Văn A" required>
            </div>
            <div style="margin-bottom: 10px;">
              <label class="sub-label">Số Điện Thoại:</label>
              <input type="tel" id="regPhone" class="form-control-custom" placeholder="0908123456" required pattern="[0-9]{9,11}">
            </div>
            <div style="margin-bottom: 10px;">
              <label class="sub-label">Email (Tùy chọn):</label>
              <input type="email" id="regEmail" class="form-control-custom" placeholder="khachhang@gmail.com">
            </div>
            <div style="margin-bottom: 14px;">
              <label class="sub-label">Mật khẩu khởi tạo:</label>
              <input type="password" id="regPassword" class="form-control-custom" placeholder="Tối thiểu 3 ký tự" required minlength="3">
            </div>
            <button type="submit" class="btn-submit-terracotta" style="width:100%; padding: 12px; font-weight: 800;">Tạo Tài Khoản Thành Viên →</button>
          </form>
          <div style="font-size: 11px; color: #888; text-align: center; margin-top: 12px;">
            Đăng ký tài khoản để tích điểm đổi quà & lưu giữ bộ sưu tập tóc AI Omni Salon!
          </div>
        `}
      </div>
    `;
    modal.classList.add('active');
  },

  handleLogin() {
    const acc = document.getElementById('loginAccount')?.value.trim();
    const pass = document.getElementById('loginPassword')?.value;
    if (!acc) {
      this.showToast('⚠️ Vui lòng nhập email hoặc tên đăng nhập!', 'warning');
      return;
    }
    if (!pass) {
      this.showToast('⚠️ Vui lòng nhập mật khẩu!', 'warning');
      return;
    }

    let res = null;
    if (window.AuthEngine && typeof window.AuthEngine.login === 'function') {
      res = window.AuthEngine.login(acc, pass);
    } else if (window.store && typeof window.store.login === 'function') {
      res = window.store.login(acc, pass);
    }

    if (res && res.success) {
      const user = res.user;
      const roleName = user.roleName || user.role || 'Thành Viên';
      this.showToast(`👋 Chào mừng ${user.fullName || user.name} (${roleName})!`, 'success');
      this.closeGlobalModal();
      if (window.UIWeb) {
        window.UIWeb.renderHeader();
        window.UIWeb.renderMainContent();
      }
      if (window.UIApp) {
        window.UIApp.renderApp();
      }
    } else {
      this.showToast(res?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.', 'error');
    }
  },

  handleRegister() {
    const fullName = document.getElementById('regFullName')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;

    if (!fullName) {
      this.showToast('⚠️ Vui lòng nhập họ và tên!', 'warning');
      return;
    }
    if (!phone || !/^[0-9]{9,11}$/.test(phone)) {
      this.showToast('⚠️ Số điện thoại không hợp lệ (cần 9-11 chữ số)!', 'warning');
      return;
    }
    if (!password || password.length < 3) {
      this.showToast('⚠️ Mật khẩu cần tối thiểu 3 ký tự!', 'warning');
      return;
    }

    let res = null;
    if (window.AuthEngine && typeof window.AuthEngine.register === 'function') {
      res = window.AuthEngine.register({
        fullName,
        phone,
        email: email || `${phone}@customer.4rau.vn`,
        username: phone,
        password
      });
    } else {
      res = { success: true, user: { fullName, phone, role: 'CUSTOMER' } };
    }

    if (res && res.success) {
      this.showToast(`🎉 Chúc mừng ${fullName} đã trở thành Omni Salon Member!`, 'success');
      this.closeGlobalModal();
      if (window.UIWeb) {
        window.UIWeb.renderHeader();
        window.UIWeb.renderMainContent();
      }
      if (window.UIApp) {
        window.UIApp.renderApp();
      }
    } else {
      this.showToast(res?.message || 'Không thể tạo tài khoản. Số điện thoại có thể đã tồn tại.', 'error');
    }
  },

  quickLoginRole(roleKey) {
    let seedUsers = [];
    if (window.AuthEngine && typeof window.AuthEngine.getSeedAccounts === 'function') {
      seedUsers = window.AuthEngine.getSeedAccounts();
    }
    const seed = seedUsers.find(u => u.role === roleKey);
    if (seed) {
      const res = window.AuthEngine.login(seed.username, seed.password);
      if (res && res.success) {
        this.showToast(`👑 Đã đăng nhập: ${seed.fullName} [${seed.roleName}]`, 'success');
        this.closeGlobalModal();
        if (window.UIWeb) {
          window.UIWeb.renderHeader();
          window.UIWeb.renderMainContent();
        }
        if (window.UIApp) {
          window.UIApp.renderApp();
        }
      }
    } else {
      const res = window.store.login(roleKey === 'SUPER_ADMIN' ? 'executive@omnisalon.vn' : 'khachhang@gmail.com', 'admin123');
      if (res && res.success) {
        this.showToast(`👑 Đã đăng nhập vai trò [${roleKey}]`, 'success');
      }
      this.closeGlobalModal();
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
            ${!originalImage
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

    let safeMessage = String(message || '');
    // OWASP A03 XSS Defense: Chặn script injection vào toast notification
    if (/<script\b|javascript:|onerror=|onload=|eval\(|<iframe\b|<object\b|<embed\b/i.test(safeMessage)) {
      safeMessage = safeMessage
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }

    const toast = document.createElement('div');
    toast.className = `toast-pill-message toast-${type}`;
    toast.innerHTML = safeMessage;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }
};

window.UICommon = UICommon;
