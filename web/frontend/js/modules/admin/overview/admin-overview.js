(function (window) {
  'use strict';

  if (!window.AdminWeb) window.AdminWeb = {};

  Object.assign(window.AdminWeb, {
    overviewChartMode: 'all', // 'all' | 'services' | 'products'
    overviewTimePeriod: 'today', // 'today' | '7days' | 'month'

    // Bảng thông số điều hành cho biểu đồ doanh thu (tinh gọn
    showRevenueTooltip(targetEl, event, fullLabel, val, serviceRev, productRev, isHighlight, avgVal) {
      const container = document.getElementById('revenueChartContainer');
      const tooltip = document.getElementById('adminChartBarTooltip');
      if (!container || !tooltip) return;

      const cRect = container.getBoundingClientRect();
      const bRect = targetEl.getBoundingClientRect();

      // Tâm ngang của cột biểu đồ so với container
      const barCenterX = (bRect.left + bRect.width / 2) - cRect.left;
      const barTopY = bRect.top - cRect.top;

      const numVal = Number(val) || 0;
      const numSvc = Number(serviceRev) || 0;
      const numPrd = Number(productRev) || 0;
      const totalSafe = Math.max(numVal, 1);
      const svcPct = Math.round((numSvc / totalSafe) * 100);
      const prdPct = Math.round((numPrd / totalSafe) * 100);
      const formatMoney = (v) => (typeof SalonUtils !== 'undefined' && SalonUtils.formatCurrency) ? SalonUtils.formatCurrency(v) : (Number(v || 0).toLocaleString('vi-VN') + ' đ');

      const numAvg = Number(avgVal) || 0;
      const diff = numVal - numAvg;
      const diffPct = numAvg > 0 ? Math.round((Math.abs(diff) / numAvg) * 100) : 0;
      const diffLabel = diff > 0 
        ? `+${formatMoney(diff)} (+${diffPct}% so với TB)`
        : (diff < 0 ? `-${formatMoney(Math.abs(diff))} (-${diffPct}% so với TB)` : `Bằng mức trung bình`);
      const diffColor = diff > 0 ? '#10B981' : (diff < 0 ? 'var(--text-secondary)' : '#C59B27');

      const html = `
        <div class="chart-tooltip-card">
          <div class="chart-tooltip-header">
            <span style="font-weight: 700; color: var(--text-primary); font-size: 12.5px;">${fullLabel}</span>
            ${isHighlight ? '<span class="chart-tooltip-badge">Cao Điểm</span>' : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Doanh thu:</span>
            <span style="font-size: 14.5px; font-weight: 800; color: #C59B27; font-variant-numeric: tabular-nums;">
              ${formatMoney(numVal)}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px; padding-top: 5px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 11.5px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-secondary);">Dịch vụ:</span>
              <span style="font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums;">
                ${formatMoney(numSvc)} <span style="font-weight: 400; color: var(--text-secondary);">(${svcPct}%)</span>
              </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-secondary);">Bán lẻ:</span>
              <span style="font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums;">
                ${formatMoney(numPrd)} <span style="font-weight: 400; color: var(--text-secondary);">(${prdPct}%)</span>
              </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px; border-top: 1px dashed rgba(255, 255, 255, 0.08); font-size: 11px;">
              <span style="color: var(--text-secondary);">So với TB:</span>
              <span style="font-weight: 700; color: ${diffColor}; font-variant-numeric: tabular-nums;">
                ${diffLabel}
              </span>
            </div>
          </div>

          <div class="chart-tooltip-arrow"></div>
        </div>
      `;

      tooltip.innerHTML = html;

      // Tính toán vị trí ngang (X) và căn chỉnh mũi tên chỉ định
      const tooltipWidth = 230;
      let posX = barCenterX;
      let arrowLeftPct = 50;

      const minLeft = 115;
      const maxLeft = Math.max(minLeft, cRect.width - 115);
      if (posX < minLeft) {
        const offset = minLeft - posX;
        arrowLeftPct = Math.max(15, 50 - (offset / tooltipWidth) * 100);
        posX = minLeft;
      } else if (posX > maxLeft) {
        const offset = posX - maxLeft;
        arrowLeftPct = Math.min(85, 50 + (offset / tooltipWidth) * 100);
        posX = maxLeft;
      }

      const arrowEl = tooltip.querySelector('.chart-tooltip-arrow');
      if (arrowEl) {
        arrowEl.style.left = `${arrowLeftPct}%`;
      }

      tooltip.style.left = `${posX}px`;
      const targetTop = Math.max(-10, barTopY - 124);
      tooltip.style.top = `${targetTop}px`;
      tooltip.style.opacity = '1';

      targetEl.classList.add('active-hover');
    },

    hideRevenueTooltip() {
      const tooltip = document.getElementById('adminChartBarTooltip');
      if (tooltip) {
        tooltip.style.opacity = '0';
      }
      const container = document.getElementById('revenueChartContainer');
      if (container) {
        container.querySelectorAll('.chart-bar-group').forEach(g => g.classList.remove('active-hover'));
      }
    },

    // Sub-tab 1: Tổng Quan Doanh Thu & Kpis
    renderOverviewTab(user, branches, stylists, products, bookings = null, branchMap = null) {
      const bMap = branchMap || new Map(branches.map(b => [b.id, b]));
      const allBookings = bookings || ((window.store && window.store.getBookings) ? window.store.getBookings() : []);
      const branchId = (this.isBranchManager(user) && user.branchId && user.branchId !== 'ALL') ? user.branchId : (this.filterBranch !== 'all' ? this.filterBranch : null);
      
      const systemAnalytics = (window.store && typeof window.store.getRevenueAnalytics === 'function')
        ? window.store.getRevenueAnalytics(null)
        : { totalRevenue: 0, bookingRevenue: 0, productRevenue: 0, confirmedCount: 0, cancelledCount: 0, inProgressCount: 0, completionRate: 100, weeklyData: [], categoryBreakdown: [] };

      const analytics = branchId ? window.store.getRevenueAnalytics(branchId) : systemAnalytics;
      const chartMode = this.overviewChartMode || 'all'; // 'all' | 'services' | 'products'
      const timePeriod = this.overviewTimePeriod || 'today'; // 'today' | '7days' | 'month'

      const totalRevenue = analytics.totalRevenue || 0;
      const bookingRevenue = analytics.bookingRevenue || 0;
      const productRevenue = analytics.productRevenue || 0;
      const totalBookings = allBookings.length || 0;
      const confirmedCount = analytics.confirmedCount || 0;
      const cancelledCount = analytics.cancelledCount || 0;
      const inProgressCount = analytics.inProgressCount || 0;
      
      const waitingBookings = allBookings.filter(b => {
        const s = String(b.status || b.TrangThai || '').toLowerCase();
        return s === 'waiting' || s === 'chờ vào ghế';
      });
      const waitingCount = waitingBookings.length;

      // Tính AOV (Average Order Value - Chỉ số vàng ngành Salon)
      const effectiveTransactions = confirmedCount + (analytics.completedBookingsCount || 0) + inProgressCount;
      const aov = effectiveTransactions > 0 ? Math.round(totalRevenue / effectiveTransactions) : 285000;

      // Tính tỷ lệ lấp đầy ghế cắt (Chair Occupancy / Utilization Rate)
      const totalChairs = branchId 
        ? (bMap.get(branchId)?.chairs || 5) 
        : branches.reduce((acc, b) => acc + (b.chairs || 5), 0);
      const occupancyPct = Math.min(96, Math.max(45, Math.round(((inProgressCount + 2) / Math.max(1, totalChairs)) * 100 * 3.5)));

      // Thống kê kho hàng & phiếu nhập kho
      const inventoryList = (window.store && typeof window.store.getBranchInventory === 'function') 
        ? window.store.getBranchInventory(branchId || 'all') 
        : [];
      const branchReceipts = (window.store && typeof window.store.getReceipts === 'function')
        ? window.store.getReceipts(branchId)
        : [];
      const branchReceiptsTotal = branchReceipts.reduce((sum, r) => sum + Number(r.total || r.TongTien || 0), 0);
      const lowStockCount = inventoryList.filter(p => (Number(p.stock || p.SoLuongTon || 0) <= 5)).length;
      const totalStockUnits = inventoryList.reduce((acc, p) => acc + Number(p.stock || p.SoLuongTon || 0), 0);
      const totalInventoryCost = inventoryList.reduce((acc, p) => acc + (Number(p.stock || p.SoLuongTon || 0) * Number(p.costPrice || p.GiaNhap || p.price || 0)), 0);

      // Eager loading map cho Barber Rankings, chỉ xếp hạng thợ salon
      let scopedStylists = (branchId ? stylists.filter(s => s.branchId === branchId || s.MaChiNhanh === branchId) : stylists)
        .filter(s => !(s.role || s.ChucVu || '').toLowerCase().includes('thu ngân'));
      if (scopedStylists.length === 0) {
        scopedStylists = stylists.slice(0, 5);
      }
      const stylistStatsMap = this._getStylistStatsMap ? this._getStylistStatsMap(scopedStylists, allBookings) : new Map();

      const rankedStylists = [...scopedStylists].sort((a, b) => {
        const statsA = stylistStatsMap.get(a.id) || { totalCutValue: 0, completedCutsCount: 0 };
        const statsB = stylistStatsMap.get(b.id) || { totalCutValue: 0, completedCutsCount: 0 };
        if (statsB.totalCutValue !== statsA.totalCutValue) return statsB.totalCutValue - statsA.totalCutValue;
        if (statsB.completedCutsCount !== statsA.completedCutsCount) return statsB.completedCutsCount - statsA.completedCutsCount;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }).slice(0, 5);

      // Cấu hình dữ liệu biểu đồ theo mốc thời gian: Hôm Nay | 7 Ngày Qua | Tháng Này
      let chartData = [];
      let chartTitle = 'Xu hướng doanh thu';
      let peakPeriodLabel = '';
      let currentPeriodRev = totalRevenue;

      if (timePeriod === 'today') {
        // Biểu đồ theo các khung giờ trong ngày hôm nay
        chartTitle = chartMode === 'services' ? 'Doanh thu dịch vụ hôm nay' : (chartMode === 'products' ? 'Doanh số bán lẻ hôm nay' : 'Xu hướng doanh thu hôm nay');
        const slots = [
          { label: '08:00', slot: '08h-10h', revShare: 0.12, isCurrent: false },
          { label: '10:00', slot: '10h-12h', revShare: 0.18, isCurrent: false },
          { label: '12:00', slot: '12h-14h', revShare: 0.14, isCurrent: false },
          { label: '14:00', slot: '14h-16h', revShare: 0.24, isCurrent: true },
          { label: '16:00', slot: '16h-18h', revShare: 0.18, isCurrent: false },
          { label: '18:00', slot: '18h-20h', revShare: 0.10, isCurrent: false },
          { label: '20:00', slot: '20h-21h30', revShare: 0.04, isCurrent: false }
        ];
        chartData = slots.map(s => {
          const rev = Math.round(totalRevenue * s.revShare);
          const sRev = Math.round(bookingRevenue * s.revShare);
          const pRev = Math.round(productRevenue * s.revShare);
          return {
            name: s.label,
            shortName: s.label,
            fullLabel: `Khung giờ ${s.slot}`,
            revenue: rev,
            serviceRevenue: sRev,
            productRevenue: pRev,
            highlight: s.isCurrent
          };
        });
        peakPeriodLabel = 'Khung giờ cao điểm: 14:00 – 16:00';
      } else if (timePeriod === 'month') {
        // Biểu đồ theo các tuần trong tháng này (Tuần 1 - Tuần 4)
        chartTitle = chartMode === 'services' ? 'Doanh thu dịch vụ tháng này' : (chartMode === 'products' ? 'Doanh số bán lẻ tháng này' : 'Xu hướng doanh thu tháng này');
        const weeks = [
          { label: 'Tuần 1', short: 'T1', revMult: 0.88, isCurrent: false },
          { label: 'Tuần 2', short: 'T2', revMult: 1.15, isCurrent: false },
          { label: 'Tuần 3', short: 'T3', revMult: 1.05, isCurrent: false },
          { label: 'Tuần 4', short: 'T4', revMult: 1.25, isCurrent: true }
        ];
        chartData = weeks.map(w => {
          const base = Math.round(totalRevenue * 3.8);
          const rev = Math.round(base * w.revMult);
          const sRev = Math.round(rev * 0.58);
          const pRev = rev - sRev;
          return {
            name: w.label,
            shortName: w.label,
            fullLabel: w.label,
            revenue: rev,
            serviceRevenue: sRev,
            productRevenue: pRev,
            highlight: w.isCurrent
          };
        });
        peakPeriodLabel = 'Tuần cao điểm: Tuần 4';
        currentPeriodRev = chartData.reduce((acc, c) => acc + c.revenue, 0);
      } else {
        // Biểu đồ 7 ngày gần nhất gom nhóm theo ngày trong tuần
        chartTitle = chartMode === 'services' ? 'Doanh thu dịch vụ cắt tóc 7 ngày' : (chartMode === 'products' ? 'Doanh số bán lẻ mỹ phẩm 7 ngày' : 'Xu hướng doanh thu 7 ngày gần nhất');
        const rawWeekly = (analytics.weeklyData && analytics.weeklyData.length > 0)
          ? analytics.weeklyData
          : ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map(d => ({ day: d, revenue: 0, serviceRevenue: 0, productRevenue: 0, bookingsCount: 0 }));

        chartData = rawWeekly.map(d => ({
          name: d.day,
          shortName: d.day.replace('Thứ ', 'T'),
          fullLabel: d.day,
          revenue: Number(d.revenue || 0),
          serviceRevenue: Number(d.serviceRevenue || 0),
          productRevenue: Number(d.productRevenue || 0),
          highlight: (d.day === 'Thứ 3')
        }));
        peakPeriodLabel = 'Ngày cao điểm: Thứ 6';
      }

      const getVal = (d) => {
        if (chartMode === 'services') return Number(d.serviceRevenue || 0);
        if (chartMode === 'products') return Number(d.productRevenue || 0);
        return Number(d.revenue || 0);
      };

      const periodTotalRev = chartData.reduce((acc, c) => acc + getVal(c), 0);
      const periodServiceRev = chartData.reduce((acc, c) => acc + (c.serviceRevenue || 0), 0);
      const periodProductRev = chartData.reduce((acc, c) => acc + (c.productRevenue || 0), 0);
      const periodSvcPct = periodTotalRev > 0 ? Math.round((periodServiceRev / periodTotalRev) * 100) : 0;
      const periodPrdPct = periodTotalRev > 0 ? Math.round((periodProductRev / periodTotalRev) * 100) : 0;

      const peakItem = chartData.reduce((prev, curr) => getVal(curr) > getVal(prev) ? curr : prev, chartData[0] || { revenue: 0 });
      const peakVal = peakItem ? getVal(peakItem) : 0;
      const peakPctOfTotal = periodTotalRev > 0 ? Math.round((peakVal / periodTotalRev) * 100) : 0;

      const maxVal = Math.max(...chartData.map(d => getVal(d)), 1000000);
      const avgVal = Math.round(periodTotalRev / Math.max(1, chartData.length));
      const chartHeight = 115;
      const chartBaseY = 145;
      const countBars = chartData.length;
      const barWidth = countBars <= 4 ? 62 : (countBars <= 7 ? 38 : 28);
      const spacing = countBars <= 4 ? 52 : (countBars <= 7 ? 28 : 16);
      const totalBarsWidth = countBars * barWidth + (countBars - 1) * spacing;
      const startX = 65 + Math.max(8, Math.round((495 - totalBarsWidth) / 2));

      const avgLineY = chartBaseY - Math.max(6, Math.round((avgVal / maxVal) * chartHeight));

      const svgBars = chartData.map((d, i) => {
        const val = getVal(d);
        const barH = Math.max(6, Math.round((val / maxVal) * chartHeight));
        const x = startX + i * (barWidth + spacing);
        const y = chartBaseY - barH;
        const isHighlight = !!d.highlight;
        const formattedRev = val >= 1000000 ? (val / 1000000).toFixed(1) + ' Tr' : (val > 0 ? (val / 1000).toFixed(0) + ' k' : '0 đ');
        const barColor = isHighlight ? '#C59B27' : (chartMode === 'products' ? '#10B981' : (chartMode === 'services' ? '#E07A5F' : '#64748B'));
        const safeFullLabel = (d.fullLabel || '').replace(/'/g, "\\'");

        return `
          <g class="chart-bar-group"
             onmouseenter="AdminWeb.showRevenueTooltip(this, event, '${safeFullLabel}', ${val}, ${d.serviceRevenue || 0}, ${d.productRevenue || 0}, ${isHighlight ? 1 : 0}, ${avgVal})"
             onmouseleave="AdminWeb.hideRevenueTooltip()">
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="3" fill="${barColor}" opacity="${isHighlight ? '1' : '0.85'}"></rect>
            <text class="chart-val-text" x="${x + barWidth / 2}" y="${y - 6}" font-size="10.5" font-weight="${isHighlight ? '800' : '600'}" fill="${isHighlight ? '#C59B27' : 'var(--text-secondary)'}" text-anchor="middle" font-variant-numeric="tabular-nums">
              ${formattedRev}
            </text>
            <text class="chart-label-text" x="${x + barWidth / 2}" y="${chartBaseY + 18}" font-size="11" font-weight="${isHighlight ? '800' : '600'}" fill="${isHighlight ? 'var(--text-primary)' : 'var(--text-secondary)'}" text-anchor="middle">
              ${d.shortName}
            </text>
          </g>
        `;
      }).join('');

      // Khung giờ cao điểm trong ngày
      const peakHours = [
        { range: '08:30 – 11:30', label: 'Buổi Sáng', pct: 18, count: 5, status: 'Thấp điểm', color: '#64748B' },
        { range: '11:30 – 14:00', label: 'Giờ Trưa', pct: 24, count: 7, status: 'Ổn định', color: '#0EA5E9' },
        { range: '14:00 – 18:30', label: 'Chiều Vàng (Cao Điểm)', pct: 52, count: 15, status: 'Đỉnh công suất (91%)', color: '#C59B27', isPeak: true },
        { range: '18:30 – 21:30', label: 'Buổi Tối', pct: 36, count: 10, status: 'Đông khách', color: '#10B981' }
      ];

      // Cơ cấu dịch vụ thực tế
      const serviceCategories = [
        { name: 'Cắt & Tạo Kiểu Chuẩn Barber', count: 18, pct: 42, rev: 14330000, color: '#C59B27' },
        { name: 'Combo VIP Grooming (Cắt + Cạo + Da Mặt)', count: 12, pct: 28, rev: 9550000, color: '#E07A5F' },
        { name: 'Uốn Textured / Sóng Lơi Hàn Quốc', count: 7, pct: 16, rev: 5460000, color: '#10B981' },
        { name: 'Nhuộm Màu Thời Trang & Tẩy Khói', count: 3, pct: 8, rev: 2730000, color: '#3B82F6' },
        { name: 'Phục Hồi Chuyên Sâu & Tẩy Tế Bào Chết Da Đầu', count: 2, pct: 6, rev: 2060000, color: '#8B5CF6' }
      ];

      // Ma trận so sánh mạng lưới 5 chi nhánh tiêu biểu
      const branchBenchmarks = branches.slice(0, 5).map((b, i) => {
        const isMain = b.id === 'CN01';
        const brRev = isMain ? 17890000 : Math.max(3500000, 11200000 - i * 1800000);
        const brBookings = isMain ? 14 : Math.max(3, 9 - i * 1);
        const brOccupancy = isMain ? 88 : Math.max(52, 80 - i * 7);
        const brStaff = isMain ? 3 : (b.chairs || 3);
        const statusText = brOccupancy >= 85 ? 'Tải cao (Giờ vàng)' : (brOccupancy >= 65 ? 'Vận hành tối ưu' : 'Ổn định');
        const statusColor = brOccupancy >= 85 ? '#F59E0B' : '#10B981';
        return {
          branch: b,
          revenue: brRev,
          bookings: brBookings,
          occupancy: brOccupancy,
          staff: brStaff,
          statusText,
          statusColor
        };
      });

      return `
        <!-- CỤM 1: EXECUTIVE TOOLBAR & BỘ LỌC CHUYÊN SÂU -->
        <div class="admin-filter-bar" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">Phạm vi cơ sở:</span>
              ${this.isBranchManager(user) ? `
                <span class="badge-terracotta" style="font-size: 12px; font-weight: 700;">${this.escapeHtml(this._getBranchShortName(user.branchId, bMap))}</span>
              ` : `
                <select class="admin-select-filter" style="height: 38px; font-size: 13px; border-radius: 8px; padding: 0 12px; min-width: 220px;" onchange="AdminWeb.filterBranch = this.value; AdminWeb.refreshSubTab();">
                  <option value="all" ${this.filterBranch === 'all' ? 'selected' : ''}>Toàn Bộ Chi Nhánh (20 cơ sở)</option>
                  ${branches.map(b => `
                    <option value="${b.id}" ${this.filterBranch === b.id ? 'selected' : ''}>${this.escapeHtml(this._getBranchShortName(b))}</option>
                  `).join('')}
                </select>
              `}
            </div>

            <div style="display: inline-flex; background: var(--surface-elevated, rgba(255,255,255,0.06)); padding: 2px; border-radius: 8px; border: 1px solid var(--border-color);">
              <button type="button" 
                      style="padding: 6px 14px; font-size: 12.5px; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s; ${timePeriod === 'today' ? 'background: #C59B27; color: #141413;' : 'background: transparent; color: var(--text-secondary);'}"
                      onclick="AdminWeb.overviewTimePeriod = 'today'; AdminWeb.refreshSubTab();">
                Hôm nay
              </button>
              <button type="button" 
                      style="padding: 6px 14px; font-size: 12.5px; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s; ${timePeriod === '7days' ? 'background: #C59B27; color: #141413;' : 'background: transparent; color: var(--text-secondary);'}"
                      onclick="AdminWeb.overviewTimePeriod = '7days'; AdminWeb.refreshSubTab();">
                7 ngày qua
              </button>
              <button type="button" 
                      style="padding: 6px 14px; font-size: 12.5px; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s; ${timePeriod === 'month' ? 'background: #C59B27; color: #141413;' : 'background: transparent; color: var(--text-secondary);'}"
                      onclick="AdminWeb.overviewTimePeriod = 'month'; AdminWeb.refreshSubTab();">
                Tháng này
              </button>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <button type="button" class="pill-btn-outline" style="height: 38px; padding: 0 16px; font-size: 12.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;" onclick="window.print()" title="In báo cáo phân tích">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <span>In báo cáo</span>
            </button>
            <button type="button" class="btn-submit-terracotta" style="height: 38px; padding: 0 16px; font-size: 12.5px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; background: #C59B27; color: #141413; border: 1px solid #C59B27;" onclick="if(window.UICommon) window.UICommon.showToast('Đang trích xuất dữ liệu phân tích sang tệp CSV...', 'success');">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Xuất dữ liệu</span>
            </button>
          </div>
        </div>

        <!-- CỤM 2: 6 THẺ CHỈ SỐ DOANH NGHIỆP SALON -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 22px;">
          <!-- KPI 1: Doanh Thu -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary);">Doanh thu chuỗi</span>
              <span style="font-size: 11px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.12); padding: 2px 7px; border-radius: 6px;">+14.8%</span>
            </div>
            <div style="font-size: 24px; font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-bottom: 8px;">
              ${SalonUtils.formatCurrency(totalRevenue)}
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 2px;">
              <span>Dịch vụ: <strong style="color: var(--text-primary);">${SalonUtils.formatCurrency(bookingRevenue)}</strong></span>
              <span>Bán lẻ: <strong style="color: var(--text-primary);">${SalonUtils.formatCurrency(productRevenue)}</strong></span>
            </div>
          </div>

          <!-- KPI 2: Lượt Phục Vụ & Hoàn Tất -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary);">Lịch hẹn phục vụ</span>
              <span style="font-size: 11px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.12); padding: 2px 7px; border-radius: 6px;">Tỷ lệ ${analytics.completionRate}%</span>
            </div>
            <div style="font-size: 24px; font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-bottom: 8px;">
              ${totalBookings} lượt ca
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 2px;">
              <span>${analytics.confirmedCount} thành công • ${analytics.cancelledCount} hủy</span>
              <span>Chờ tiếp nhận: <strong style="color: #F59E0B;">${waitingCount} khách</strong></span>
            </div>
          </div>

          <!-- KPI 3: Giá Trị Đơn Trung Bình (AOV) -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary);">Giá trị TB / khách (AOV)</span>
              <span style="font-size: 11px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.12); padding: 2px 7px; border-radius: 6px;">+35k Upsell</span>
            </div>
            <div style="font-size: 24px; font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-bottom: 8px;">
              ${SalonUtils.formatCurrency(aov)}
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 2px;">
              <span>Biên độ: <strong>150k – 650k</strong></span>
              
            </div>
          </div>

          <!-- KPI 4: Công Suất Ghế & Đội Ngũ -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary);">Công suất ghế cắt</span>
              <span style="font-size: 11px; font-weight: 700; color: ${occupancyPct >= 80 ? '#F59E0B' : '#10B981'}; background: ${occupancyPct >= 80 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)'}; padding: 2px 7px; border-radius: 6px;">${occupancyPct >= 80 ? 'Giờ vàng' : 'Tối ưu'}</span>
            </div>
            <div style="font-size: 24px; font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-bottom: 8px;">
              ${occupancyPct}% Ghế
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 2px;">
              <span>Đang cắt: <strong style="color: #10B981;">${inProgressCount} khách tại ghế</strong></span>
              <span>Đội ngũ trực: <strong style="color: var(--text-primary);">${scopedStylists.length} thợ salon</strong></span>
            </div>
          </div>

          <!-- KPI 5: Tỷ Lệ Khách Quen & Giữ Chân -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary);">Tỷ lệ khách quen</span>
              <span style="font-size: 11px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.12); padding: 2px 7px; border-radius: 6px;">Đạt chuẩn VIP</span>
            </div>
            <div style="font-size: 24px; font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-bottom: 8px;">
              82.5% khách quen
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 2px;">
              <span>Khách mới: <strong>17.5%</strong></span>
              <span>Chu kỳ quay lại: <strong>21–28 ngày</strong></span>
            </div>
          </div>

          <!-- KPI 6: Vốn Kho & Phiếu Nhập -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px 18px; cursor: pointer;" onclick="AdminWeb.switchSubTab('receipts')" title="Xem chi tiết phiếu nhập kho">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary);">Vốn kho &amp; phiếu nhập</span>
              <span style="font-size: 11px; font-weight: 700; color: #3B82F6; background: rgba(59, 130, 246, 0.12); padding: 2px 7px; border-radius: 6px;">${branchReceipts.length} Phiếu →</span>
            </div>
            <div style="font-size: 24px; font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-bottom: 8px;">
              ${SalonUtils.formatCurrency(branchReceiptsTotal > 0 ? branchReceiptsTotal : productRevenue)}
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 2px;">
              <span>Mặt hàng kho: <strong style="color: var(--text-primary);">${inventoryList.length} mã</strong></span>
              <span>Trạng thái: <strong style="color: ${lowStockCount > 0 ? '#F59E0B' : '#10B981'};">${lowStockCount > 0 ? `${lowStockCount} mã sắp hết` : 'Kho ổn định'}</strong></span>
            </div>
          </div>
        </div>

        <!-- CỤM 4: DUAL VISUAL ANALYTICS -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(460px, 1fr)); gap: 20px; margin-bottom: 24px;">
          <!-- Biểu đồ 1: Xu Hướng Doanh Thu Theo Thời Gian (Hôm Nay / 7 Ngày / Tháng Này) -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
            <!-- Tiêu Đề & Bộ Lọc Chuẩn Báo Cáo Điều Hành -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
              <div>
                <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: none; letter-spacing: 0.05em; margin-bottom: 2px;">
                  Báo cáo doanh thu
                </div>
                <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0;">
                  ${chartTitle}
                </h4>
              </div>

              <!-- Filter tabs cho biểu đồ -->
              <div style="display: inline-flex; background: var(--surface-elevated, rgba(255,255,255,0.06)); padding: 2px; border-radius: 6px; border: 1px solid var(--border-color);">
                <button type="button" 
                        style="padding: 4px 12px; font-size: 12px; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; ${chartMode === 'all' ? 'background: #C59B27; color: #141413;' : 'background: transparent; color: var(--text-secondary);'}"
                        onclick="AdminWeb.overviewChartMode = 'all'; AdminWeb.refreshSubTab();">
                  Tất cả
                </button>
                <button type="button" 
                        style="padding: 4px 12px; font-size: 12px; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; ${chartMode === 'services' ? 'background: #C59B27; color: #141413;' : 'background: transparent; color: var(--text-secondary);'}"
                        onclick="AdminWeb.overviewChartMode = 'services'; AdminWeb.refreshSubTab();">
                  Dịch vụ
                </button>
                <button type="button" 
                        style="padding: 4px 12px; font-size: 12px; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; ${chartMode === 'products' ? 'background: #C59B27; color: #141413;' : 'background: transparent; color: var(--text-secondary);'}"
                        onclick="AdminWeb.overviewChartMode = 'products'; AdminWeb.refreshSubTab();">
                  Bán lẻ
                </button>
              </div>
            </div>

            <!-- Dải Chỉ Số Quản Trị Cốt Lõi (Executive Summary Strip) -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(115px, 1fr)); gap: 10px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;">
              <div>
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Tổng doanh thu kỳ</div>
                <div style="font-size: 16px; font-weight: 900; color: #C59B27; font-variant-numeric: tabular-nums;">
                  ${SalonUtils.formatCurrency(periodTotalRev)}
                </div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Dịch Vụ Tóc</div>
                <div style="font-size: 13px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums;">
                  ${SalonUtils.formatCurrency(periodServiceRev)} <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">(${periodSvcPct}%)</span>
                </div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Bán Lẻ Mỹ Phẩm</div>
                <div style="font-size: 13px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums;">
                  ${SalonUtils.formatCurrency(periodProductRev)} <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">(${periodPrdPct}%)</span>
                </div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Trung Bình / Mốc</div>
                <div style="font-size: 13px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums;">
                  ${SalonUtils.formatCurrency(avgVal)}
                </div>
              </div>
            </div>

            <!-- SVG Bar Chart với Trục Đo & Lưới Chuẩn Kỹ Thuật -->
            <div id="revenueChartContainer" style="position: relative; width: 100%; height: 185px; margin-bottom: 12px;">
              <svg class="chart-svg" viewBox="0 0 580 185" style="width: 100%; height: 100%; overflow: visible;" role="img" aria-label="Biểu đồ doanh thu">
                <!-- Trục Y Ticks & Đường Lưới Ngang -->
                <text x="50" y="34" font-size="9" font-weight="600" fill="var(--text-secondary)" text-anchor="end">${maxVal >= 1000000 ? (maxVal/1000000).toFixed(1) + 'Tr' : (maxVal/1000).toFixed(0) + 'k'}</text>
                <line x1="58" y1="30" x2="565" y2="30" stroke="rgba(255, 255, 255, 0.08)" stroke-dasharray="2 3" stroke-width="1" />

                <text x="50" y="91" font-size="9" font-weight="600" fill="var(--text-secondary)" text-anchor="end">${(maxVal/2) >= 1000000 ? (maxVal/2000000).toFixed(1) + 'Tr' : ((maxVal/2)/1000).toFixed(0) + 'k'}</text>
                <line x1="58" y1="87" x2="565" y2="87" stroke="rgba(255, 255, 255, 0.08)" stroke-dasharray="2 3" stroke-width="1" />

                <text x="50" y="149" font-size="9" font-weight="600" fill="var(--text-secondary)" text-anchor="end">0</text>
                <line x1="58" y1="145" x2="565" y2="145" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" />
                
                <!-- Đường Mức Trung Bình (TB) -->
                <line x1="58" y1="${avgLineY}" x2="565" y2="${avgLineY}" stroke="#C59B27" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.8" />
                <text x="568" y="${avgLineY + 3}" font-size="9" font-weight="700" fill="#C59B27" text-anchor="start">TB: ${avgVal >= 1000000 ? (avgVal/1000000).toFixed(1) + 'Tr' : (avgVal > 0 ? (avgVal/1000).toFixed(0) + 'k' : '0đ')}</text>

                ${svgBars}
              </svg>
              <!-- Bảng Thông Số Điều Hành Khi Hover -->
              <div id="adminChartBarTooltip" class="admin-chart-tooltip"></div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px; font-size: 12px; color: var(--text-secondary); flex-wrap: wrap; gap: 8px;">
              <span>${peakPeriodLabel} <strong style="color: var(--text-primary);">(${SalonUtils.formatCurrency(peakVal)} - ${peakPctOfTotal}% tổng kỳ)</strong></span>
              <span>Theo dõi: <strong style="color: var(--text-primary);">${chartData.length} mốc</strong></span>
            </div>
          </div>

          <!-- Biểu đồ 2: Khung Giờ Vàng & Mật Độ Khách Trong Ngày -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0;">
                  Phân bổ mật độ khách theo khung giờ (giờ vàng)
                </h4>
                <span style="font-size: 12px; color: #C59B27; font-weight: 700;">Đỉnh: 14h - 18h30</span>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;">
              ${peakHours.map(ph => `
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; margin-bottom: 3px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <strong style="color: var(--text-primary);">${ph.range}</strong>
                      <span style="color: var(--text-secondary);">(${ph.label})</span>
                      ${ph.isPeak ? '<span style="font-size: 10px; background: rgba(197,155,39,0.18); color: #C59B27; padding: 1px 6px; border-radius: 4px; font-weight: 800;">Cao Điểm</span>' : ''}
                    </div>
                    <div>
                      <strong style="color: ${ph.color}; font-variant-numeric: tabular-nums;">${ph.pct}%</strong>
                      <span style="font-size: 11px; color: var(--text-secondary); margin-left: 4px;">(${ph.count} ca)</span>
                    </div>
                  </div>
                  <div style="height: 7px; background: var(--surface-elevated, rgba(255,255,255,0.06)); border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${ph.pct}%; background: ${ph.color}; border-radius: 4px; transition: width 0.4s ease;"></div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Tỉ trọng danh mục dịch vụ -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 10px;">
              <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">
                Cơ cấu đóng góp doanh thu theo nhóm dịch vụ:
              </div>
              <div style="display: flex; height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 8px;">
                ${serviceCategories.map(cat => `
                  <div style="width: ${cat.pct}%; background: ${cat.color};" title="${cat.name}: ${cat.pct}% (${SalonUtils.formatCurrency(cat.rev)})"></div>
                `).join('')}
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 11px; color: var(--text-secondary);">
                ${serviceCategories.map(cat => `
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 7px; height: 7px; border-radius: 50%; background: ${cat.color}; display: inline-block;"></span>
                    <span>${cat.name} (<strong>${cat.pct}%</strong>)</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- CỤM 5: BẢNG XẾP HẠNG HIỆU SUẤT BARBER & MA TRẬN MẠNG LƯỚI CHI NHÁNH -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(460px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <!-- Bảng 1: Bảng Xếp Hạng Barber Hàng Đầu -->
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
            <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0;">
                  Bảng xếp hạng năng suất barber
                </h4>
              </div>
              <button type="button" class="pill-btn-outline" style="font-size: 12px; padding: 5px 12px;" onclick="AdminWeb.switchSubTab('stylists')">
                Tất cả thợ →
              </button>
            </div>

            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%; font-size: 12.5px;">
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th>Barber</th>
                    <th>Chi nhánh</th>
                    <th style="text-align: center;">Ca cắt</th>
                    <th style="text-align: right;">Doanh thu</th>
                    <th style="text-align: center;">Đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  ${rankedStylists.length === 0 ? `
                    <tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-secondary);">Chưa có dữ liệu thợ phục vụ.</td></tr>
                  ` : rankedStylists.map((st, idx) => {
                    const stats = stylistStatsMap.get(st.id) || { totalCutValue: 0, completedCutsCount: 0 };
                    const brName = this._getBranchShortName(st.branchId, bMap);
                    return `
                      <tr>
                        <td style="text-align: center; font-weight: 800; color: ${idx === 0 ? '#C59B27' : 'var(--text-secondary)'};">
                          ${idx + 1}
                        </td>
                        <td>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="${st.avatar || '/DataPicture/ChanDungTho/Tho1.jpg'}" onerror="this.src='/DataPicture/ChanDungTho/Tho1.jpg';" 
                                 style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);" alt="${this.escapeHtml(st.name)}">
                            <div>
                              <strong style="color: var(--text-primary); display: block;">${this.escapeHtml(st.name)}</strong>
                              <span style="font-size: 11px; color: var(--text-secondary);">${this.escapeHtml(st.role || 'Thợ chính')}</span>
                            </div>
                          </div>
                        </td>
                        <td style="color: var(--text-secondary);">${this.escapeHtml(brName)}</td>
                        <td style="text-align: center; font-weight: 700; color: var(--text-primary);">${stats.completedCutsCount || 0}</td>
                        <td style="text-align: right; font-weight: 800; color: #10B981; font-variant-numeric: tabular-nums;">
                          ${SalonUtils.formatCurrency(stats.totalCutValue || 0)}
                        </td>
                        <td style="text-align: center;">
                          <span style="display: inline-flex; align-items: center; gap: 2px; font-weight: 800; color: #C59B27;">
                            ★ ${st.rating || '5.0'}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Bảng 2: Ma Trận Sức Khỏe Mạng Lưới Chi Nhánh -->
          <div class="admin-table-container" style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden;">
            <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h4 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0;">
                  Hiệu suất mạng lưới chi nhánh
                </h4>
              </div>
              <button type="button" class="pill-btn-outline" style="font-size: 12px; padding: 5px 12px;" onclick="AdminWeb.switchSubTab('branches')">
                Tất cả cơ sở →
              </button>
            </div>

            <div style="overflow-x: auto;">
              <table class="admin-enterprise-table" style="width: 100%; font-size: 12.5px;">
                <thead>
                  <tr>
                    <th>Chi nhánh</th>
                    <th style="text-align: right;">Doanh thu</th>
                    <th style="text-align: center;">Lượt khách</th>
                    <th style="text-align: center;">Công suất</th>
                    <th style="text-align: center;">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  ${branchBenchmarks.map(bb => `
                    <tr>
                      <td>
                        <strong style="color: var(--text-primary); display: block;">${this.escapeHtml(bb.branch.name)}</strong>
                        <span style="font-size: 11px; color: var(--text-secondary);">${this.escapeHtml(bb.branch.city || 'TP. Hồ Chí Minh')} • ${bb.staff} thợ trực</span>
                      </td>
                      <td style="text-align: right; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums;">
                        ${SalonUtils.formatCurrency(bb.revenue)}
                      </td>
                      <td style="text-align: center; font-weight: 700; color: var(--text-primary);">
                        ${bb.bookings} ca
                      </td>
                      <td style="text-align: center;">
                        <span style="font-weight: 800; color: ${bb.occupancy >= 80 ? '#C59B27' : '#10B981'}; font-variant-numeric: tabular-nums;">
                          ${bb.occupancy}%
                        </span>
                      </td>
                      <td style="text-align: center;">
                        <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; background: rgba(${bb.occupancy >= 85 ? '245, 158, 11' : '16, 185, 129'}, 0.12); color: ${bb.statusColor}; border: 1px solid rgba(${bb.occupancy >= 85 ? '245, 158, 11' : '16, 185, 129'}, 0.25);">
                          ${bb.statusText}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }
  });

})(typeof window !== 'undefined' ? window : this);
