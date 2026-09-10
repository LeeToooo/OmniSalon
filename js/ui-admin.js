// OmniSalon Admin Management UI Component Logic
// Chuẩn 100% Kiến Trúc Kỹ Thuật (CNTT-KLCN039 - Mục 2.1)
// Bao gồm đầy đủ 11 phân hệ:
// 1. Dashboard KPI & Báo Cáo Doanh Thu
// 2. Quản Lý Lịch Hẹn & Điều Phối (Hỗ trợ chi tiết AI Hairstyle)
// 3. Quản Lý Dịch Vụ & Combo VIP
// 4. Quản Lý Nhân Viên & Phân Ca Làm Việc
// 5. Quản Lý Chi Nhánh Chuỗi Salon (Branches)
// 6. Quản Lý Khách Hàng CRM (Tiers, Lịch sử, Chi tiêu)
// 7. Quản Lý Tồn Kho Theo Từng Chi Nhánh (Cảnh báo hết hàng & Nhập kho)
// 8. Quản Lý Đơn Bán Hàng Mỹ Phẩm (POS & E-commerce)
// 9. Quản Lý Khuyến Mãi & Voucher Giảm Giá
// 10. Thống Kê & Lịch Sử Tư Vấn Tóc AI (AI Hairstyle Analytics)
// 11. Nhật Ký Kiểm Toán Hệ Thống (Audit Logs minh bạch)

const UIAdmin = {
  bookingFilter: 'all',
  bookingBranchFilter: 'all',
  serviceTab: 'services', // 'services' | 'combos'
  inventoryBranchFilter: 'br-1',
  auditSearchQuery: '',
  customerSearchQuery: '',

  // =========================================================================
  // 1. DASHBOARD & KPI OVERVIEW
  // =========================================================================
  renderDashboard(containerEl) {
    if (!containerEl) return;
    const currentBranch = window.store.getCurrentBranch();
    const analytics = window.store.getAnalyticsData(this.bookingBranchFilter === 'all' ? null : this.bookingBranchFilter);
    const bookings = window.store.getBookings(this.bookingBranchFilter === 'all' ? null : this.bookingBranchFilter);
    const branches = window.store.getBranches();

    containerEl.innerHTML = `
      <!-- Admin Page Title Header -->
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            👑 Trung Tâm Điều Hành & Báo Cáo
          </div>
          <h2 class="catalog-section-title">Tổng Quan Hoạt Động Chuỗi Salon</h2>
          <div style="font-size: 13px; color: var(--color-muted-gray); margin-top: 4px;">
            Hệ thống quản trị hợp nhất đa chi nhánh, cập nhật theo thời gian thực (Realtime Reactive Engine)
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <select class="form-select" style="width: auto; padding: 8px 16px; border-radius: 9999px; font-weight: 600;" 
                  onchange="UIAdmin.setDashboardBranchFilter(this.value)">
            <option value="all" ${this.bookingBranchFilter === 'all' ? 'selected' : ''}>Toàn Bộ Chi Nhánh</option>
            ${branches.map(b => `<option value="${b.id}" ${this.bookingBranchFilter === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
          <button class="pill-btn" onclick="window.mainApp.navigateTo('adminBookings')">
            📅 Điều Phối Lịch
          </button>
          <button class="pill-btn pill-btn-secondary" onclick="window.store.resetToDefault(); window.mainApp.showToast('🔄 Đã khôi phục dữ liệu demo gốc!')">
            Khôi Phục Dữ Liệu
          </button>
        </div>
      </div>

      <!-- 4 Top KPI Metric Cards -->
      <div class="kpi-metrics-grid">
        <div class="kpi-card">
          <div class="kpi-label">Tổng Doanh Thu Lũy Kế</div>
          <div class="kpi-value">${analytics.totalRevenue.toLocaleString('vi-VN')}đ</div>
          <div class="kpi-subtext">
            <span>Dịch vụ: <strong>${analytics.bookingRev.toLocaleString('vi-VN')}đ</strong></span>
            <span>Mỹ phẩm: <strong>${analytics.orderRev.toLocaleString('vi-VN')}đ</strong></span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Lịch Hẹn Phục Vụ</div>
          <div class="kpi-value">${analytics.totalBookings}</div>
          <div class="kpi-subtext">
            <span style="color: var(--color-success);">✓ Đang vận hành hiệu quả</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Mặt Hàng Mỹ Phẩm</div>
          <div class="kpi-value">${analytics.activeProducts}</div>
          <div class="kpi-subtext">
            <span>Nhập khẩu chính hãng 100%</span>
          </div>
        </div>

        <div class="kpi-card" style="border-left: 4px solid ${analytics.lowStockProducts.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">
          <div class="kpi-label">Cảnh Báo Tồn Kho Dưới Mức</div>
          <div class="kpi-value" style="color: ${analytics.lowStockProducts.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">
            ${analytics.lowStockProducts.length}
          </div>
          <div class="kpi-subtext">
            <span>${analytics.lowStockProducts.length > 0 ? '⚠️ Cần nhập thêm hàng ngay' : '✓ Kho đủ nguồn cung'}</span>
          </div>
        </div>
      </div>

      <!-- 2 Main Analytics Charts Row -->
      <div class="charts-row">
        <!-- Monthly Revenue Chart -->
        <div class="chart-card">
          <div class="chart-title-bar">
            <div>
              <div class="chart-title">Biểu Đồ Tăng Trưởng Doanh Thu (2026)</div>
              <div style="font-size: 12px; color: var(--color-muted-gray);">Đơn vị: Triệu VNĐ (Bao gồm Dịch vụ & Bán lẻ)</div>
            </div>
            <span class="status-pill status-completed">+24.5% So với tháng trước</span>
          </div>
          <div class="bar-chart-container">
            <div class="bar-col">
              <span class="bar-val">28tr</span>
              <div class="bar-fill-wrap"><div class="bar-fill" style="height: 48%;"></div></div>
              <span class="bar-label">T3</span>
            </div>
            <div class="bar-col">
              <span class="bar-val">34tr</span>
              <div class="bar-fill-wrap"><div class="bar-fill" style="height: 58%;"></div></div>
              <span class="bar-label">T4</span>
            </div>
            <div class="bar-col">
              <span class="bar-val">42tr</span>
              <div class="bar-fill-wrap"><div class="bar-fill" style="height: 72%;"></div></div>
              <span class="bar-label">T5</span>
            </div>
            <div class="bar-col">
              <span class="bar-val">39tr</span>
              <div class="bar-fill-wrap"><div class="bar-fill" style="height: 66%;"></div></div>
              <span class="bar-label">T6</span>
            </div>
            <div class="bar-col">
              <span class="bar-val">48tr</span>
              <div class="bar-fill-wrap"><div class="bar-fill" style="height: 82%;"></div></div>
              <span class="bar-label">T7</span>
            </div>
            <div class="bar-col active">
              <span class="bar-val" style="color: var(--color-shop-violet); font-weight: 700;">65tr</span>
              <div class="bar-fill-wrap"><div class="bar-fill" style="height: 100%; background: linear-gradient(to top, #5433eb, #8c6dfd);"></div></div>
              <span class="bar-label" style="font-weight: 700; color: var(--color-shop-violet);">T8 (Hiện tại)</span>
            </div>
          </div>
        </div>

        <!-- Popular Services Breakdown -->
        <div class="chart-card">
          <div class="chart-title-bar">
            <div>
              <div class="chart-title">💇 Top Dịch Vụ & Combo Được Đặt Nhiều Nhất</div>
              <div style="font-size: 12px; color: var(--color-muted-gray);">Số lượt khách đặt lịch phục vụ</div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
            ${analytics.popularServices.map((s, idx) => `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 6px;">
                  <span>${idx + 1}. ${s.name}</span>
                  <span style="color: var(--color-shop-violet); font-weight: 700;">${s.count} lượt</span>
                </div>
                <div style="background: var(--color-canvas-mist); height: 8px; border-radius: 9999px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, #5433eb, #8c6dfd); height: 100%; width: ${Math.min(100, s.count * 25)}%; border-radius: 9999px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Stylist Performance by Branch -->
      <div class="chart-card" style="margin-bottom: 24px;">
        <div class="chart-title-bar">
          <div>
            <div class="chart-title">⭐ Hiệu Suất & Đánh Giá Đội Ngũ Stylist</div>
            <div style="font-size: 12px; color: var(--color-muted-gray);">Xếp hạng năng suất làm việc và sự hài lòng của khách hàng</div>
          </div>
        </div>
        <div class="cards-grid-4" style="margin-top: 16px;">
          ${analytics.stylistPerf.map(st => `
            <div class="elevated-card" style="padding: 16px; background: var(--color-canvas-mist);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 15px;">${st.name}</strong>
                <span class="status-pill status-confirmed">${st.rating} ★</span>
              </div>
              <div style="font-size: 13px; color: var(--color-muted-gray);">
                Số ca phục vụ: <strong style="color: var(--color-shop-violet); font-size: 15px;">${st.count}</strong> lượt
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Quick Recent Bookings -->
      <div class="table-card">
        <div class="table-toolbar">
          <div>
            <h3 style="font-size: 16px; font-weight: 700;">Lịch Hẹn Mới Nhất Chờ Xử Lý</h3>
            <span style="font-size: 12px; color: var(--color-muted-gray);">Tự động cập nhật theo thời gian thực</span>
          </div>
          <button class="pill-btn" onclick="window.mainApp.navigateTo('adminBookings')">
            Xem Tất Cả Lịch Hẹn (${bookings.length}) →
          </button>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã Lịch</th>
                <th>Khách Hàng</th>
                <th>Dịch Vụ & Kiểu Tóc</th>
                <th>Chi Nhánh</th>
                <th>Stylist</th>
                <th>Ngày & Giờ</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${bookings.slice(0, 5).map(b => {
                const branch = branches.find(br => br.id === b.branchId);
                return `
                  <tr>
                    <td><strong>#${b.id}</strong></td>
                    <td>
                      <div style="font-weight: 700;">${b.customerName}</div>
                      <div style="font-size: 12px; color: var(--color-muted-gray);">${b.customerPhone}</div>
                    </td>
                    <td>
                      <strong style="color: var(--color-shop-violet);">${b.serviceName}</strong>
                      ${b.hairstyleChoice ? `<div style="font-size: 11px; color: #b45309; margin-top: 2px;">✨ AI: ${b.hairstyleChoice} (${b.hairColorChoice})</div>` : ''}
                    </td>
                    <td><span style="font-size: 12px; font-weight: 600;">${branch?.name.split('—')[1] || 'OmniSalon'}</span></td>
                    <td>${b.stylistName}</td>
                    <td>
                      <div>${b.date}</div>
                      <div style="font-weight: 700; color: var(--color-ink-black);">${b.timeSlot}</div>
                    </td>
                    <td><strong>${b.totalPrice.toLocaleString('vi-VN')}đ</strong></td>
                    <td>
                      <span class="status-pill status-${b.status}">
                        ${this.getStatusLabel(b.status)}
                      </span>
                    </td>
                    <td>
                      <select class="form-select" style="font-size: 12px; padding: 4px 8px; border-radius: 9999px;"
                              onchange="UIAdmin.updateBookingStatus('${b.id}', this.value)">
                        <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
                        <option value="in_progress" ${b.status === 'in_progress' ? 'selected' : ''}>Đang phục vụ</option>
                        <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Hoàn thành</option>
                        <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Hủy bỏ</option>
                      </select>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setDashboardBranchFilter(branchId) {
    this.bookingBranchFilter = branchId;
    this.renderDashboard(document.getElementById('adminDashboardView'));
  },

  getStatusLabel(status) {
    const map = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      in_progress: 'Đang phục vụ',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return map[status] || status;
  },

  // =========================================================================
  // 2. APPOINTMENTS & SCHEDULING (BOOKINGS MANAGER)
  // =========================================================================
  renderBookingsManager(containerEl) {
    if (!containerEl) return;
    const branches = window.store.getBranches();
    let bookings = window.store.getBookings(this.bookingBranchFilter === 'all' ? null : this.bookingBranchFilter);

    if (this.bookingFilter !== 'all') {
      bookings = bookings.filter(b => b.status === this.bookingFilter);
    }

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            Quản Lý Lịch Hẹn
          </div>
          <h2 class="catalog-section-title">Danh Sách Lịch Hẹn Khách Hàng (${bookings.length})</h2>
          <div style="font-size: 13px; color: var(--color-muted-gray); margin-top: 4px;">
            Điều phối ca làm việc, cập nhật tiến độ phục vụ và gửi nhắc hẹn
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <select class="form-select" style="width: auto; padding: 8px 16px; border-radius: 9999px;" 
                  onchange="UIAdmin.setBookingBranchFilter(this.value)">
            <option value="all" ${this.bookingBranchFilter === 'all' ? 'selected' : ''}>Tất Cả Chi Nhánh</option>
            ${branches.map(b => `<option value="${b.id}" ${this.bookingBranchFilter === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
          <button class="pill-btn" onclick="UICustomer.openBookingWizard()">
            + Đặt Lịch Cho Khách
          </button>
        </div>
      </div>

      <!-- Filter Pills Row -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        ${['all', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(st => `
          <button class="shop-category-chip ${this.bookingFilter === st ? 'active' : ''}" 
                  onclick="UIAdmin.filterBookings('${st}')">
            ${st === 'all' ? 'Tất Cả Trạng Thái' : this.getStatusLabel(st)}
          </button>
        `).join('')}
      </div>

      <div class="table-card">
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã Lịch</th>
                <th>Khách Hàng</th>
                <th>Dịch Vụ & Kiểu Tóc AI</th>
                <th>Chi Nhánh</th>
                <th>Stylist</th>
                <th>Ngày & Giờ</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Thao Tác Điều Phối</th>
              </tr>
            </thead>
            <tbody>
              ${bookings.length === 0 ? `
                <tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--color-muted-gray);">Không tìm thấy lịch hẹn phù hợp</td></tr>
              ` : bookings.map(b => {
                const branch = branches.find(br => br.id === b.branchId);
                return `
                  <tr>
                    <td><strong>#${b.id}</strong></td>
                    <td>
                      <div style="font-weight: 700;">${b.customerName}</div>
                      <div style="font-size: 12px; color: var(--color-muted-gray);">${b.customerPhone}</div>
                    </td>
                    <td>
                      <strong style="color: var(--color-shop-violet);">${b.serviceName}</strong>
                      ${b.hairstyleChoice ? `
                        <div style="margin-top: 4px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #fef3c7; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #b45309;">
                          ✨ ${b.hairstyleChoice} (${b.hairColorChoice})
                        </div>
                      ` : ''}
                    </td>
                    <td><span style="font-size: 12px; font-weight: 600;">${branch?.name.split('—')[1] || 'Chi nhánh'}</span></td>
                    <td>${b.stylistName}</td>
                    <td>
                      <div>${b.date}</div>
                      <div style="font-weight: 700; color: var(--color-ink-black);">${b.timeSlot}</div>
                    </td>
                    <td><strong>${b.totalPrice.toLocaleString('vi-VN')}đ</strong></td>
                    <td>
                      <span class="status-pill status-${b.status}">
                        ${this.getStatusLabel(b.status)}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 6px; align-items: center;">
                        <select class="form-select" style="font-size: 12px; padding: 4px 8px; border-radius: 9999px;"
                                onchange="UIAdmin.updateBookingStatus('${b.id}', this.value)">
                          <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
                          <option value="in_progress" ${b.status === 'in_progress' ? 'selected' : ''}>Đang phục vụ</option>
                          <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Hoàn thành</option>
                          <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Hủy bỏ</option>
                        </select>
                        <button class="pill-btn pill-btn-secondary" style="padding: 4px 10px; font-size: 11px;"
                                onclick="UICustomer.viewInvoice('${b.id}')" title="Xem Hóa Đơn E-Invoice">
                          🧾
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setBookingBranchFilter(branchId) {
    this.bookingBranchFilter = branchId;
    this.renderBookingsManager(document.getElementById('adminBookingsView'));
  },

  filterBookings(status) {
    this.bookingFilter = status;
    this.renderBookingsManager(document.getElementById('adminBookingsView'));
  },

  updateBookingStatus(bookingId, status) {
    window.store.updateBookingStatus(bookingId, status);
    window.mainApp.showToast(`✅ Đã cập nhật trạng thái lịch hẹn #${bookingId} thành [${this.getStatusLabel(status)}]`);
    this.renderBookingsManager(document.getElementById('adminBookingsView'));
    this.renderDashboard(document.getElementById('adminDashboardView'));
  },

  // =========================================================================
  // 3. SERVICES & COMBOS MANAGEMENT
  // =========================================================================
  renderServicesManager(containerEl) {
    if (!containerEl) return;
    const isComboTab = this.serviceTab === 'combos';
    const items = isComboTab ? window.store.getCombos() : window.store.getServices();

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            Bảng Giá Dịch Vụ
          </div>
          <h2 class="catalog-section-title">Quản Lý Menu Dịch Vụ & Combo VIP (${items.length})</h2>
        </div>
        <button class="pill-btn" onclick="UIAdmin.openAddServiceModal()">
          + Thêm Dịch Vụ Mới
        </button>
      </div>

      <!-- Tabs: Dịch vụ lẻ vs Gói Combo VIP -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <button class="shop-category-chip ${!isComboTab ? 'active' : ''}" onclick="UIAdmin.switchServiceTab('services')">
          💇 Dịch Vụ Riêng Lẻ (${window.store.getServices().length})
        </button>
        <button class="shop-category-chip ${isComboTab ? 'active' : ''}" onclick="UIAdmin.switchServiceTab('combos')">
          👑 Gói Combo VIP Trọn Gói (${window.store.getCombos().length})
        </button>
      </div>

      <!-- Services List Cards Grid -->
      <div class="cards-grid-3">
        ${items.map(s => `
          <div class="elevated-card">
            <div class="card-img-wrapper">
              <img class="card-img" src="${s.image}" alt="${s.name}">
              <span class="card-badge" style="background: rgba(84, 51, 235, 0.9); color: white;">
                ${s.duration} Phút
              </span>
            </div>
            <div class="card-content">
              <div class="card-category">Danh mục: ${s.category.toUpperCase()} · ${s.rating} ★</div>
              <h3 class="card-title">${s.name}</h3>
              <p class="card-description">${s.description}</p>
              
              ${s.steps ? `
                <div style="margin: 10px 0; padding: 8px 12px; background: var(--color-canvas-mist); border-radius: 12px; font-size: 11px;">
                  <strong>Quy trình thực hiện:</strong>
                  <ul style="padding-left: 14px; margin-top: 4px; color: var(--color-muted-gray);">
                    ${s.steps.slice(0, 3).map(st => `<li>${st}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              <div class="card-meta-row">
                <div>
                  <div class="card-price">${s.price.toLocaleString('vi-VN')}đ</div>
                  ${s.oldPrice ? `<div style="font-size: 12px; color: var(--color-muted-gray); text-decoration: line-through;">${s.oldPrice.toLocaleString('vi-VN')}đ</div>` : ''}
                </div>
                <div style="display: flex; gap: 6px;">
                  <button class="pill-btn pill-btn-secondary" style="font-size: 12px; padding: 6px 12px;" onclick="UIAdmin.openEditServiceModal('${s.id}')">
                    Sửa
                  </button>
                  <button class="pill-btn pill-btn-secondary" style="font-size: 12px; padding: 6px 10px; color: var(--color-danger);" onclick="UIAdmin.deleteService('${s.id}')">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  switchServiceTab(tab) {
    this.serviceTab = tab;
    this.renderServicesManager(document.getElementById('adminServicesView'));
  },

  openAddServiceModal() {
    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
      <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">+ Thêm Dịch Vụ Mới</h3>
      <div class="form-group">
        <label class="form-label">Tên Dịch Vụ:</label>
        <input type="text" class="form-input" id="newSrvName" placeholder="Ví dụ: Cắt Tóc Tạo Kiểu Mullet">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="form-group">
          <label class="form-label">Giá Dịch Vụ (VNĐ):</label>
          <input type="number" class="form-input" id="newSrvPrice" placeholder="300000">
        </div>
        <div class="form-group">
          <label class="form-label">Thời Lượng (Phút):</label>
          <input type="number" class="form-input" id="newSrvDuration" placeholder="45">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Phân Loại:</label>
        <select class="form-select" id="newSrvCategory">
          <option value="cut">Cắt & Tạo Kiểu (cut)</option>
          <option value="color">Nhuộm Thời Trang (color)</option>
          <option value="perm">Uốn Sóng Cao Cấp (perm)</option>
          <option value="treatment">Phục Hồi Tóc Hư Tổn (treatment)</option>
          <option value="combo">Gói Combo VIP (combo)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Mô Tả Chi Tiết:</label>
        <textarea class="form-textarea" id="newSrvDesc" rows="3" placeholder="Mô tả kỹ thuật thực hiện, công nghệ sử dụng..."></textarea>
      </div>
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="pill-btn pill-btn-secondary" style="flex: 1; justify-content: center;" onclick="document.getElementById('bookingModal').classList.remove('active')">
          Hủy Bỏ
        </button>
        <button class="pill-btn" style="flex: 2; justify-content: center;" onclick="UIAdmin.submitNewService()">
          Lưu Dịch Vụ
        </button>
      </div>
    `;
    document.getElementById('bookingModal').classList.add('active');
  },

  submitNewService() {
    const name = document.getElementById('newSrvName').value.trim();
    const price = parseInt(document.getElementById('newSrvPrice').value) || 350000;
    const duration = parseInt(document.getElementById('newSrvDuration').value) || 45;
    const cat = document.getElementById('newSrvCategory').value;
    const desc = document.getElementById('newSrvDesc').value.trim() || 'Dịch vụ chuẩn salon quốc tế cao cấp.';

    if (!name) {
      window.mainApp.showToast('⚠️ Vui lòng nhập tên dịch vụ!');
      return;
    }

    window.store.addService({
      name,
      category: cat === 'combo' ? 'combo' : cat,
      type: cat === 'combo' ? 'combo' : 'single',
      price,
      duration,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
      description: desc
    });

    document.getElementById('bookingModal').classList.remove('active');
    window.mainApp.showToast('🎉 Đã thêm dịch vụ mới thành công!');
    this.renderServicesManager(document.getElementById('adminServicesView'));
  },

  openEditServiceModal(serviceId) {
    const service = window.store.getAllServiceOfferings().find(s => s.id === serviceId);
    if (!service) return;

    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
      <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">Chỉnh Sửa Dịch Vụ</h3>
      <div class="form-group">
        <label class="form-label">Tên Dịch Vụ:</label>
        <input type="text" class="form-input" id="editSrvName" value="${service.name}">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="form-group">
          <label class="form-label">Giá Dịch Vụ (VNĐ):</label>
          <input type="number" class="form-input" id="editSrvPrice" value="${service.price}">
        </div>
        <div class="form-group">
          <label class="form-label">Thời Lượng (Phút):</label>
          <input type="number" class="form-input" id="editSrvDuration" value="${service.duration}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Mô Tả Chi Tiết:</label>
        <textarea class="form-textarea" id="editSrvDesc" rows="3">${service.description}</textarea>
      </div>
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="pill-btn pill-btn-secondary" style="flex: 1; justify-content: center;" onclick="document.getElementById('bookingModal').classList.remove('active')">
          Hủy Bỏ
        </button>
        <button class="pill-btn" style="flex: 2; justify-content: center;" onclick="UIAdmin.submitEditService('${service.id}')">
          Cập Nhật
        </button>
      </div>
    `;
    document.getElementById('bookingModal').classList.add('active');
  },

  submitEditService(serviceId) {
    const name = document.getElementById('editSrvName').value.trim();
    const price = parseInt(document.getElementById('editSrvPrice').value);
    const duration = parseInt(document.getElementById('editSrvDuration').value);
    const desc = document.getElementById('editSrvDesc').value.trim();

    window.store.updateService(serviceId, { name, price, duration, description: desc });
    document.getElementById('bookingModal').classList.remove('active');
    window.mainApp.showToast('✅ Đã cập nhật dịch vụ thành công!');
    this.renderServicesManager(document.getElementById('adminServicesView'));
  },

  deleteService(serviceId) {
    if (confirm('Bạn có chắc chắn muốn xóa dịch vụ này khỏi menu không?')) {
      window.store.deleteService(serviceId);
      window.mainApp.showToast('🗑️ Đã xóa dịch vụ thành công.');
      this.renderServicesManager(document.getElementById('adminServicesView'));
    }
  },

  // =========================================================================
  // 4. STYLISTS & SHIFTS MANAGEMENT
  // =========================================================================
  renderShiftsManager(containerEl) {
    if (!containerEl) return;
    const branches = window.store.getBranches();
    const stylists = window.store.getStylists();
    const shifts = window.store.getShifts();

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            Nhân Sự & Ca Làm
          </div>
          <h2 class="catalog-section-title">Quản Lý Nhân Viên & Phân Ca Làm Việc</h2>
        </div>
        <button class="pill-btn" onclick="UIAdmin.openAddShiftModal()">
          + Phân Ca Làm Việc
        </button>
      </div>

      <!-- Stylists Team Cards -->
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 14px;">Đội Ngũ Stylist Toàn Hệ Thống (${stylists.length})</h3>
        <div class="cards-grid-4">
          ${stylists.map(st => {
            const branch = branches.find(b => b.id === st.branchId);
            return `
              <div class="elevated-card" style="padding: 16px; text-align: center;">
                <img src="${st.avatar}" style="width: 76px; height: 76px; border-radius: 9999px; object-fit: cover; margin: 0 auto 12px; border: 3px solid var(--color-canvas-mist);">
                <h4 style="font-size: 16px; font-weight: 700;">${st.name}</h4>
                <div style="font-size: 12px; color: var(--color-shop-violet); font-weight: 600; margin-bottom: 4px;">${st.role}</div>
                <div style="font-size: 12px; color: var(--color-muted-gray); margin-bottom: 8px;">${branch?.name.split('—')[1] || 'Chuỗi Salon'}</div>
                <div style="font-size: 12px; margin-bottom: 8px;"><strong>Chuyên môn:</strong> ${st.specialty}</div>
                <div class="status-pill status-confirmed" style="display: inline-block;">${st.rating} ★ (${st.experience})</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Shifts Table -->
      <div class="table-card">
        <div class="table-toolbar">
          <h3 style="font-size: 16px; font-weight: 700;">Lịch Phân Ca Tuần Này</h3>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Stylist</th>
                <th>Chi Nhánh</th>
                <th>Ngày Làm Việc</th>
                <th>Ca Làm</th>
                <th>Khung Giờ</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${shifts.map(sh => {
                const branch = branches.find(b => b.id === sh.branchId);
                return `
                  <tr>
                    <td><strong>${sh.stylistName}</strong></td>
                    <td>${branch?.name.split('—')[1] || 'Chi nhánh'}</td>
                    <td><strong>${sh.date}</strong></td>
                    <td><span class="status-pill status-confirmed">${sh.shift}</span></td>
                    <td>${sh.hours}</td>
                    <td><span style="color: var(--color-success); font-weight: 700;">Đang hoạt động</span></td>
                    <td>
                      <button class="pill-btn pill-btn-secondary" style="font-size: 11px; padding: 4px 10px; color: var(--color-danger);"
                              onclick="UIAdmin.deleteShift('${sh.id}')">
                        Hủy Ca
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openAddShiftModal() {
    const stylists = window.store.getStylists();
    const branches = window.store.getBranches();
    const modalBody = document.getElementById('bookingModalBody');

    modalBody.innerHTML = `
      <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">+ Phân Ca Làm Cho Nhân Viên</h3>
      <div class="form-group">
        <label class="form-label">Chọn Chi Nhánh:</label>
        <select class="form-select" id="newShiftBranch">
          ${branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Chọn Stylist:</label>
        <select class="form-select" id="newShiftStylist">
          ${stylists.map(st => `<option value="${st.id}|${st.name}">${st.name} — ${st.role}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Ngày Làm Việc:</label>
        <input type="date" class="form-input" id="newShiftDate" value="${new Date().toISOString().slice(0, 10)}">
      </div>
      <div class="form-group">
        <label class="form-label">Chọn Ca:</label>
        <select class="form-select" id="newShiftType">
          <option value="Ca Sáng|08:30 - 12:30">Ca Sáng (08:30 - 12:30)</option>
          <option value="Ca Chiều|13:00 - 17:30">Ca Chiều (13:00 - 17:30)</option>
          <option value="Ca Tối|18:00 - 21:30">Ca Tối (18:00 - 21:30)</option>
          <option value="Cả Ngày|08:30 - 21:30">Cả Ngày (08:30 - 21:30)</option>
        </select>
      </div>
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="pill-btn pill-btn-secondary" style="flex: 1; justify-content: center;" onclick="document.getElementById('bookingModal').classList.remove('active')">
          Hủy
        </button>
        <button class="pill-btn" style="flex: 2; justify-content: center;" onclick="UIAdmin.submitNewShift()">
          Lưu Phân Ca
        </button>
      </div>
    `;
    document.getElementById('bookingModal').classList.add('active');
  },

  submitNewShift() {
    const branchId = document.getElementById('newShiftBranch').value;
    const [stylistId, stylistName] = document.getElementById('newShiftStylist').value.split('|');
    const date = document.getElementById('newShiftDate').value;
    const [shift, hours] = document.getElementById('newShiftType').value.split('|');

    window.store.addShift({ branchId, stylistId, stylistName, date, shift, hours });
    document.getElementById('bookingModal').classList.remove('active');
    window.mainApp.showToast('✅ Đã phân ca làm việc thành công!');
    this.renderShiftsManager(document.getElementById('adminShiftsView'));
  },

  deleteShift(shiftId) {
    if (confirm('Bạn có chắc chắn muốn hủy ca làm việc này?')) {
      window.store.deleteShift(shiftId);
      window.mainApp.showToast('🗑️ Đã hủy ca làm việc.');
      this.renderShiftsManager(document.getElementById('adminShiftsView'));
    }
  },

  // =========================================================================
  // 5. BRANCHES MANAGEMENT (CHI NHÁNH SALON) - NEW MODULE
  // =========================================================================
  renderBranchesManager(containerEl) {
    if (!containerEl) return;
    const branches = window.store.getBranches();

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            Mạng Lưới Chuỗi Salon
          </div>
          <h2 class="catalog-section-title">Quản Lý Chi Nhánh OmniSalon (${branches.length})</h2>
          <div style="font-size: 13px; color: var(--color-muted-gray); margin-top: 4px;">
            Thiết lập danh sách chi nhánh, địa chỉ, số ghế và quản lý cơ sở
          </div>
        </div>
        <button class="pill-btn" onclick="UIAdmin.openAddBranchModal()">
          + Thêm Chi Nhánh Mới
        </button>
      </div>

      <div class="cards-grid-3">
        ${branches.map(b => {
          const stylists = window.store.getStylists(b.id);
          const bookings = window.store.getBookings(b.id);
          return `
            <div class="elevated-card">
              <div class="card-img-wrapper">
                <img class="card-img" src="${b.image}" alt="${b.name}">
                <span class="card-badge" style="background: rgba(0,0,0,0.7); color: white;">
                  ${b.totalChairs} Ghế Phục Vụ
                </span>
              </div>
              <div class="card-content">
                <div class="card-category">Quản lý: ${b.manager}</div>
                <h3 class="card-title">${b.name}</h3>
                <p class="card-description" style="margin-bottom: 8px;">📍 ${b.address}</p>
                <div style="font-size: 12px; color: var(--color-muted-gray); margin-bottom: 12px;">
                  📞 Hotline: <strong>${b.phone}</strong><br>
                  ⏰ Giờ mở cửa: ${b.hours}
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 14px; padding: 10px; background: var(--color-canvas-mist); border-radius: 12px; font-size: 12px;">
                  <div style="flex: 1; text-align: center;">
                    <div style="font-weight: 700; color: var(--color-shop-violet); font-size: 15px;">${stylists.length}</div>
                    <div style="color: var(--color-muted-gray);">Stylist</div>
                  </div>
                  <div style="flex: 1; text-align: center; border-left: 1px solid var(--color-faint-border);">
                    <div style="font-weight: 700; color: var(--color-shop-violet); font-size: 15px;">${bookings.length}</div>
                    <div style="color: var(--color-muted-gray);">Lịch hẹn</div>
                  </div>
                </div>

                <div class="card-meta-row">
                  <button class="pill-btn pill-btn-secondary" style="font-size: 12px; padding: 6px 12px;" onclick="UIAdmin.openEditBranchModal('${b.id}')">
                    Chỉnh Sửa
                  </button>
                  <button class="pill-btn pill-btn-secondary" style="font-size: 12px; padding: 6px 10px; color: var(--color-danger);" onclick="UIAdmin.deleteBranch('${b.id}')">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  openAddBranchModal() {
    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
      <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">+ Thêm Chi Nhánh Mới</h3>
      <div class="form-group">
        <label class="form-label">Tên Chi Nhánh:</label>
        <input type="text" class="form-input" id="newBrName" placeholder="Ví dụ: OmniSalon Landmark — Bình Thạnh">
      </div>
      <div class="form-group">
        <label class="form-label">Địa Chỉ Hoạt Động:</label>
        <input type="text" class="form-input" id="newBrAddress" placeholder="Số nhà, đường, phường, quận/huyện, TP...">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="form-group">
          <label class="form-label">Hotline:</label>
          <input type="text" class="form-input" id="newBrPhone" placeholder="028 3999 8888">
        </div>
        <div class="form-group">
          <label class="form-label">Số Ghế Phục Vụ:</label>
          <input type="number" class="form-input" id="newBrChairs" placeholder="15">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Người Quản Lý:</label>
        <input type="text" class="form-input" id="newBrManager" placeholder="Nguyễn Văn A">
      </div>
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="pill-btn pill-btn-secondary" style="flex: 1; justify-content: center;" onclick="document.getElementById('bookingModal').classList.remove('active')">
          Hủy
        </button>
        <button class="pill-btn" style="flex: 2; justify-content: center;" onclick="UIAdmin.submitNewBranch()">
          Lưu Chi Nhánh
        </button>
      </div>
    `;
    document.getElementById('bookingModal').classList.add('active');
  },

  submitNewBranch() {
    const name = document.getElementById('newBrName').value.trim();
    const address = document.getElementById('newBrAddress').value.trim();
    const phone = document.getElementById('newBrPhone').value.trim() || '028 3822 9999';
    const totalChairs = parseInt(document.getElementById('newBrChairs').value) || 12;
    const manager = document.getElementById('newBrManager').value.trim() || 'Quản lý cơ sở';

    if (!name || !address) {
      window.mainApp.showToast('⚠️ Vui lòng nhập tên và địa chỉ chi nhánh!');
      return;
    }

    window.store.addBranch({
      name,
      address,
      phone,
      hours: '08:30 - 21:30 (Tất cả các ngày)',
      totalChairs,
      manager,
      image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80'
    });

    document.getElementById('bookingModal').classList.remove('active');
    window.mainApp.showToast('🎉 Đã thêm chi nhánh mới thành công!');
    this.renderBranchesManager(document.getElementById('adminBranchesView'));
    window.mainApp.renderBranchSelector();
  },

  openEditBranchModal(branchId) {
    const branch = window.store.getBranches().find(b => b.id === branchId);
    if (!branch) return;

    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
      <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">Chỉnh Sửa Chi Nhánh</h3>
      <div class="form-group">
        <label class="form-label">Tên Chi Nhánh:</label>
        <input type="text" class="form-input" id="editBrName" value="${branch.name}">
      </div>
      <div class="form-group">
        <label class="form-label">Địa Chỉ:</label>
        <input type="text" class="form-input" id="editBrAddress" value="${branch.address}">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="form-group">
          <label class="form-label">Hotline:</label>
          <input type="text" class="form-input" id="editBrPhone" value="${branch.phone}">
        </div>
        <div class="form-group">
          <label class="form-label">Số Ghế Phục Vụ:</label>
          <input type="number" class="form-input" id="editBrChairs" value="${branch.totalChairs}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Người Quản Lý:</label>
        <input type="text" class="form-input" id="editBrManager" value="${branch.manager}">
      </div>
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="pill-btn pill-btn-secondary" style="flex: 1; justify-content: center;" onclick="document.getElementById('bookingModal').classList.remove('active')">
          Hủy
        </button>
        <button class="pill-btn" style="flex: 2; justify-content: center;" onclick="UIAdmin.submitEditBranch('${branch.id}')">
          Cập Nhật
        </button>
      </div>
    `;
    document.getElementById('bookingModal').classList.add('active');
  },

  submitEditBranch(branchId) {
    const name = document.getElementById('editBrName').value.trim();
    const address = document.getElementById('editBrAddress').value.trim();
    const phone = document.getElementById('editBrPhone').value.trim();
    const totalChairs = parseInt(document.getElementById('editBrChairs').value);
    const manager = document.getElementById('editBrManager').value.trim();

    window.store.updateBranch(branchId, { name, address, phone, totalChairs, manager });
    document.getElementById('bookingModal').classList.remove('active');
    window.mainApp.showToast('✅ Đã cập nhật chi nhánh thành công!');
    this.renderBranchesManager(document.getElementById('adminBranchesView'));
    window.mainApp.renderBranchSelector();
  },

  deleteBranch(branchId) {
    if (confirm('Bạn có chắc chắn muốn xóa chi nhánh này?')) {
      window.store.deleteBranch(branchId);
      window.mainApp.showToast('🗑️ Đã xóa chi nhánh.');
      this.renderBranchesManager(document.getElementById('adminBranchesView'));
      window.mainApp.renderBranchSelector();
    }
  },

  // =========================================================================
  // 6. CUSTOMERS CRM - NEW MODULE
  // =========================================================================
  renderCustomersManager(containerEl) {
    if (!containerEl) return;
    let customers = window.store.getCustomers();
    if (this.customerSearchQuery) {
      const q = this.customerSearchQuery.toLowerCase();
      customers = customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q));
    }

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            Chăm Sóc Khách Hàng (CRM)
          </div>
          <h2 class="catalog-section-title">Hồ Sơ Khách Hàng & Hạng Thành Viên (${customers.length})</h2>
        </div>
        <div class="hero-pill-search-container" style="max-width: 300px;">
          <input type="text" class="hero-pill-search-input" placeholder="Tìm theo tên hoặc số ĐT..." 
                 value="${this.customerSearchQuery}" oninput="UIAdmin.searchCustomer(this.value)">
        </div>
      </div>

      <div class="table-card">
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Khách Hàng</th>
                <th>Số Điện Thoại</th>
                <th>Hạng VIP</th>
                <th>Số Lần Ghé</th>
                <th>Tổng Chi Tiêu</th>
                <th>Lần Ghé Gần Nhất</th>
                <th>Stylist Ưa Thích</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map(c => `
                <tr>
                  <td>
                    <div style="font-weight: 700;">${c.name}</div>
                    <div style="font-size: 12px; color: var(--color-muted-gray);">${c.email}</div>
                  </td>
                  <td><strong>${c.phone}</strong></td>
                  <td>
                    <span class="status-pill status-${c.tier.includes('Diamond') ? 'confirmed' : 'completed'}">
                      ${c.tier}
                    </span>
                  </td>
                  <td><strong style="color: var(--color-shop-violet); font-size: 15px;">${c.totalVisits}</strong> lần</td>
                  <td><strong>${c.totalSpent.toLocaleString('vi-VN')}đ</strong></td>
                  <td>${c.lastVisit}</td>
                  <td>${c.preferredStylist}</td>
                  <td>
                    <button class="pill-btn pill-btn-secondary" style="font-size: 11px; padding: 4px 10px;"
                            onclick="window.mainApp.showToast('💌 Đã gửi voucher tri ân tới khách hàng [${c.name}]')">
                      Tặng Voucher
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  searchCustomer(query) {
    this.customerSearchQuery = query;
    this.renderCustomersManager(document.getElementById('adminCustomersView'));
  },

  // =========================================================================
  // 7. INVENTORY MANAGEMENT PER BRANCH (UPGRADED)
  // =========================================================================
  renderInventoryManager(containerEl) {
    if (!containerEl) return;
    const branches = window.store.getBranches();
    const inventory = window.store.getInventory(this.inventoryBranchFilter);
    const selectedBranch = branches.find(b => b.id === this.inventoryBranchFilter) || branches[0];

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            Quản Lý Kho Hàng Chuỗi
          </div>
          <h2 class="catalog-section-title">Kiểm Kê Tồn Kho Theo Từng Chi Nhánh</h2>
          <div style="font-size: 13px; color: var(--color-muted-gray); margin-top: 4px;">
            Đang xem kho tại: <strong>${selectedBranch?.name}</strong>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <select class="form-select" style="width: auto; padding: 8px 16px; border-radius: 9999px; font-weight: 600;"
                  onchange="UIAdmin.setInventoryBranch(this.value)">
            ${branches.map(b => `<option value="${b.id}" ${this.inventoryBranchFilter === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
          <button class="pill-btn" onclick="window.mainApp.showToast('📦 Đã tạo phiếu xuất kho điều chuyển hàng giữa các chi nhánh!')">
            + Điều Chuyển Kho
          </button>
        </div>
      </div>

      <div class="table-card">
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên Sản Phẩm</th>
                <th>Thương Hiệu</th>
                <th>Giá Bán</th>
                <th>Tồn Kho Chi Nhánh</th>
                <th>Tổng Toàn Chuỗi</th>
                <th>Trạng Thái Kho</th>
                <th>Nhập Kho Nhanh</th>
              </tr>
            </thead>
            <tbody>
              ${inventory.map(p => {
                const totalStock = window.store.getTotalProductStock(p.id);
                return `
                  <tr>
                    <td><img src="${p.image}" style="width: 48px; height: 48px; border-radius: 12px; object-fit: cover;"></td>
                    <td><strong>${p.name}</strong></td>
                    <td><span style="font-weight: 600; color: var(--color-shop-violet);">${p.brand}</span></td>
                    <td><strong>${p.price.toLocaleString('vi-VN')}đ</strong></td>
                    <td>
                      <span style="font-size: 16px; font-weight: 800; color: ${p.isLowStock ? 'var(--color-danger)' : 'var(--color-ink-black)'};">
                        ${p.stock}
                      </span> lọ
                    </td>
                    <td><strong style="color: var(--color-slate-ink);">${totalStock}</strong> lọ</td>
                    <td>
                      <span class="status-pill ${p.isLowStock ? 'status-cancelled' : 'status-completed'}">
                        ${p.isLowStock ? `⚠️ Sắp hết (≤ ${p.minAlert})` : '✓ Đủ nguồn cung'}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 6px;">
                        <button class="pill-btn pill-btn-secondary" style="font-size: 11px; padding: 4px 10px;"
                                onclick="window.store.updateProductStock('${p.id}', '${this.inventoryBranchFilter}', 10); UIAdmin.renderInventoryManager(document.getElementById('adminInventoryView')); window.mainApp.showToast('📦 Đã nhập thêm +10 vào kho ${selectedBranch?.name.split('—')[1]}!')">
                          +10 Hộp
                        </button>
                        <button class="pill-btn pill-btn-secondary" style="font-size: 11px; padding: 4px 10px;"
                                onclick="window.store.updateProductStock('${p.id}', '${this.inventoryBranchFilter}', 25); UIAdmin.renderInventoryManager(document.getElementById('adminInventoryView')); window.mainApp.showToast('📦 Đã nhập thêm +25 vào kho ${selectedBranch?.name.split('—')[1]}!')">
                          +25 Hộp
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setInventoryBranch(branchId) {
    this.inventoryBranchFilter = branchId;
    this.renderInventoryManager(document.getElementById('adminInventoryView'));
  },

  // =========================================================================
  // 8. SALES ORDERS & POS INVOICES
  // =========================================================================
  renderOrdersManager(containerEl) {
    if (!containerEl) return;
    const orders = window.store.getOrders();

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            Bán Lẻ Mỹ Phẩm
          </div>
          <h2 class="catalog-section-title">Danh Sách Đơn Hàng Bán Lẻ (POS & Online) (${orders.length})</h2>
        </div>
        <button class="pill-btn" onclick="window.mainApp.showToast('🧾 Đã xuất file báo cáo thuế & doanh số bán lẻ (Excel)')">
          Xuất File Excel
        </button>
      </div>

      <div class="table-card">
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Sản Phẩm Đặt Mua</th>
                <th>Tổng Tiền</th>
                <th>Phương Thức TT</th>
                <th>Thời Gian</th>
                <th>Trạng Thái</th>
                <th>Hóa Đơn</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><strong>#${o.id}</strong></td>
                  <td>
                    <div style="font-weight: 700;">${o.customerName}</div>
                    <div style="font-size: 12px; color: var(--color-muted-gray);">${o.customerPhone}</div>
                  </td>
                  <td>
                    ${(o.items || []).map(it => `
                      <div style="font-size: 13px;">${it.productName} <span style="color: var(--color-shop-violet); font-weight: 700;">x${it.qty}</span></div>
                    `).join('')}
                  </td>
                  <td><strong style="color: var(--color-shop-violet); font-size: 15px;">${o.totalAmount.toLocaleString('vi-VN')}đ</strong></td>
                  <td><span class="status-pill status-confirmed">${o.paymentMethod}</span></td>
                  <td>${o.date}</td>
                  <td><span class="status-pill status-completed">${o.status}</span></td>
                  <td>
                    <button class="pill-btn pill-btn-secondary" style="font-size: 11px; padding: 4px 10px;"
                            onclick="window.mainApp.showToast('🧾 Đã in hóa đơn POS mã [${o.id}]')">
                      In E-Invoice
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 9. PROMOTIONS & VOUCHERS
  // =========================================================================
  renderPromotionsManager(containerEl) {
    if (!containerEl) return;
    const promotions = window.store.getPromotions();

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            Chiến Dịch Khuyến Mãi
          </div>
          <h2 class="catalog-section-title">Mã Giảm Giá & Voucher Salon (${promotions.length})</h2>
        </div>
        <button class="pill-btn" onclick="UIAdmin.openAddPromoModal()">
          + Tạo Voucher Mới
        </button>
      </div>

      <div class="cards-grid-3">
        ${promotions.map(pr => `
          <div class="elevated-card" style="padding: 20px; border-left: 5px solid var(--color-shop-violet);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 18px; font-weight: 800; color: var(--color-shop-violet); letter-spacing: 0.05em;">
                ${pr.code}
              </span>
              <span class="status-pill status-completed">Đang áp dụng</span>
            </div>
            <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">
              ${pr.discountType === 'percent' ? `Giảm ${pr.discountValue}%` : `Giảm ${pr.discountValue.toLocaleString('vi-VN')}đ`}
            </div>
            <div style="font-size: 13px; color: var(--color-muted-gray); margin-bottom: 12px;">
              ${pr.description || `Đơn hàng tối thiểu: ${pr.minOrder.toLocaleString('vi-VN')}đ`}
            </div>
            <div style="font-size: 12px; color: var(--color-muted-gray); display: flex; justify-content: space-between; align-items: center;">
              <span>HSD: 31/12/2026</span>
              <button class="pill-btn pill-btn-secondary" style="font-size: 11px; padding: 4px 10px;"
                      onclick="navigator.clipboard.writeText('${pr.code}'); window.mainApp.showToast('📋 Đã sao chép mã [${pr.code}]')">
                Sao Chép
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  openAddPromoModal() {
    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
      <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">+ Tạo Voucher Khuyến Mãi Mới</h3>
      <div class="form-group">
        <label class="form-label">Mã Code (In hoa):</label>
        <input type="text" class="form-input" id="newPromoCode" placeholder="Ví dụ: OMNI2026" style="text-transform: uppercase;">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="form-group">
          <label class="form-label">Mức Giảm (%):</label>
          <input type="number" class="form-input" id="newPromoDiscount" placeholder="20">
        </div>
        <div class="form-group">
          <label class="form-label">Đơn Tối Thiểu (VNĐ):</label>
          <input type="number" class="form-input" id="newPromoMinOrder" placeholder="500000">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Mô Tả Voucher:</label>
        <input type="text" class="form-input" id="newPromoDesc" placeholder="Ưu đãi mừng khai trương chi nhánh mới">
      </div>
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="pill-btn pill-btn-secondary" style="flex: 1; justify-content: center;" onclick="document.getElementById('bookingModal').classList.remove('active')">
          Hủy
        </button>
        <button class="pill-btn" style="flex: 2; justify-content: center;" onclick="UIAdmin.submitNewPromo()">
          Lưu Voucher
        </button>
      </div>
    `;
    document.getElementById('bookingModal').classList.add('active');
  },

  submitNewPromo() {
    const code = document.getElementById('newPromoCode').value.trim().toUpperCase();
    const discount = parseInt(document.getElementById('newPromoDiscount').value) || 20;
    const minOrder = parseInt(document.getElementById('newPromoMinOrder').value) || 500000;
    const desc = document.getElementById('newPromoDesc').value.trim() || `Giảm ${discount}% cho đơn từ ${minOrder.toLocaleString('vi-VN')}đ`;

    if (!code) {
      window.mainApp.showToast('⚠️ Vui lòng nhập mã voucher!');
      return;
    }

    window.store.addPromotion({
      code,
      discountType: 'percent',
      discountValue: discount,
      minOrder,
      description: desc
    });

    document.getElementById('bookingModal').classList.remove('active');
    window.mainApp.showToast(`🎉 Đã tạo mã khuyến mãi [${code}] thành công!`);
    this.renderPromotionsManager(document.getElementById('adminPromotionsView'));
  },

  // =========================================================================
  // 10. AI CONSULTATION & HAIRSTYLE ANALYTICS - NEW MODULE
  // =========================================================================
  renderAiConsultationsManager(containerEl) {
    if (!containerEl) return;
    const consultations = window.store.getHairConsultations();
    const hairstyles = window.store.getHairstyles();

    // Group stats
    const shapeCounts = {};
    consultations.forEach(c => {
      shapeCounts[c.faceShape] = (shapeCounts[c.faceShape] || 0) + 1;
    });

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            ✨ Báo Cáo Công Nghệ AI (Mục 3 Kiến Trúc Kỹ Thuật)
          </div>
          <h2 class="catalog-section-title">Thống Kê Tư Vấn Tóc AI & Trải Nghiệm 3D Try-On</h2>
          <div style="font-size: 13px; color: var(--color-muted-gray); margin-top: 4px;">
            Dữ liệu ẩn danh phục vụ phân tích xu hướng làm đẹp và tối ưu dịch vụ salon
          </div>
        </div>
      </div>

      <!-- AI KPI Cards -->
      <div class="kpi-metrics-grid">
        <div class="kpi-card">
          <div class="kpi-label">Tổng Lượt Quét & Thử Tóc AI</div>
          <div class="kpi-value">${consultations.length}</div>
          <div class="kpi-subtext"><span>Tỷ lệ chuyển đổi đặt lịch: <strong>72.4%</strong></span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Dáng Mặt Phổ Biến Nhất</div>
          <div class="kpi-value" style="font-size: 22px;">Oval (Trái Xoan)</div>
          <div class="kpi-subtext"><span>Chiếm 45% lượng khách quét</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Màu Nhuộm Thử Nhiều Nhất</div>
          <div class="kpi-value" style="font-size: 20px; color: #cc2229;">Đỏ Cherry & Vàng Khói</div>
          <div class="kpi-subtext"><span>Xu hướng thu hút giới trẻ</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Độ Phù Hợp Trung Bình (Match)</div>
          <div class="kpi-value" style="color: var(--color-shop-violet);">96.8%</div>
          <div class="kpi-subtext"><span>Chuẩn thuật toán phân tích tỷ lệ vàng</span></div>
        </div>
      </div>

      <!-- AI Consultations History Table -->
      <div class="table-card">
        <div class="table-toolbar">
          <h3 style="font-size: 16px; font-weight: 700;">Nhật Ký Tư Vấn AI Của Khách Hàng Gần Đây</h3>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã Lượt</th>
                <th>Khách Hàng</th>
                <th>Thời Gian</th>
                <th>Dáng Mặt Phát Hiện</th>
                <th>Tông Da</th>
                <th>Kiểu Tóc Đã Thử</th>
                <th>Màu Nhuộm</th>
                <th>Độ Match</th>
              </tr>
            </thead>
            <tbody>
              ${consultations.map(c => `
                <tr>
                  <td><strong>#${c.id}</strong></td>
                  <td><strong>${c.customerName}</strong></td>
                  <td>${c.createdAt}</td>
                  <td><span class="status-pill status-confirmed">${c.faceShape}</span></td>
                  <td>${c.skinTone}</td>
                  <td><strong style="color: var(--color-shop-violet);">${c.selectedStyle}</strong></td>
                  <td>${c.selectedColor}</td>
                  <td><strong style="color: var(--color-success);">${c.matchScore || 98}%</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 11. AUDIT LOGS (NHẬT KÝ KIỂM TOÁN HỆ THỐNG) - NEW MODULE
  // =========================================================================
  renderAuditLogsManager(containerEl) {
    if (!containerEl) return;
    let logs = window.store.getAuditLogs();

    if (this.auditSearchQuery) {
      const q = this.auditSearchQuery.toLowerCase();
      logs = logs.filter(l => l.action.toLowerCase().includes(q) || l.entity.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.operatorName.toLowerCase().includes(q));
    }

    containerEl.innerHTML = `
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            Bảo Mật & Minh Bạch Dữ Liệu (Mục 7)
          </div>
          <h2 class="catalog-section-title">Nhật Ký Kiểm Toán Hệ Thống (Audit Logs) (${logs.length})</h2>
          <div style="font-size: 13px; color: var(--color-muted-gray); margin-top: 4px;">
            Theo dõi và ghi vết toàn bộ thao tác sửa lịch, sửa giá, điều chỉnh kho, phân ca của người dùng
          </div>
        </div>
        <div class="hero-pill-search-container" style="max-width: 320px;">
          <input type="text" class="hero-pill-search-input" placeholder="Tìm theo thao tác, nhân viên..." 
                 value="${this.auditSearchQuery}" oninput="UIAdmin.searchAudit(this.value)">
        </div>
      </div>

      <div class="table-card">
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Thời Gian</th>
                <th>Người Thực Hiện</th>
                <th>Hành Động (Action)</th>
                <th>Đối Tượng (Entity)</th>
                <th>Chi Tiết Thay Đổi</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `
                <tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--color-muted-gray);">Không tìm thấy nhật ký kiểm toán phù hợp</td></tr>
              ` : logs.map(l => `
                <tr>
                  <td style="font-size: 12px; color: var(--color-muted-gray); font-family: monospace;">${l.timestamp}</td>
                  <td><strong>${l.operatorName}</strong></td>
                  <td>
                    <span class="status-pill status-${this.getAuditStatusType(l.action)}">
                      ${l.action}
                    </span>
                  </td>
                  <td><strong>${l.entity}</strong></td>
                  <td style="color: var(--color-slate-ink); font-size: 13px;">${l.details}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  searchAudit(query) {
    this.auditSearchQuery = query;
    this.renderAuditLogsManager(document.getElementById('adminAuditLogsView'));
  },

  getAuditStatusType(action) {
    if (action.includes('LOGIN') || action.includes('CONFIRM')) return 'completed';
    if (action.includes('STOCK') || action.includes('UPDATE')) return 'confirmed';
    if (action.includes('DELETE') || action.includes('CANCEL')) return 'cancelled';
    return 'pending';
  }
};
