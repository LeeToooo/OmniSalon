(function (window) {
  'use strict';

  const AdminUtils = {
    clearSearchQueries() {
      this.branchSearchQuery = '';
      this.branchCityFilter = 'all';
      this.stylistSearchQuery = '';
      this.filterStylistRole = 'all';
      this.auditSearchQuery = '';
      this.auditActionFilter = 'all';
      this.auditRoleFilter = 'all';
      this.inventorySearchQuery = '';
      this.receiptsSearchQuery = '';
      this.catalogSearchQuery = '';
      this.searchQuery = '';
      this.customerLookupQuery = '';
      this.branchesPage = 1;
      this.stylistsPage = 1;
      this.auditPage = 1;
      this.inventoryPage = 1;
      this.catalogPage = 1;
      this.bookingsPage = 1;
    },

    getCurrentUser() {
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        const u = window.AuthEngine.getCurrentUser();
        if (u) return u;
      }
      if (window.store && typeof window.store.getCurrentUser === 'function') {
        const u = window.store.getCurrentUser();
        if (u) return u;
      }
      return null;
    },

    getActiveRole(user) {
      const targetUser = user || this.getCurrentUser();
      if (!targetUser) return 'SUPER_ADMIN';
      if (this.isStylist(targetUser)) return 'STYLIST';
      if (this.isCashier(targetUser)) return 'CASHIER';
      if (this.isBranchManager(targetUser)) return 'BRANCH_MANAGER';
      if (this.isSuperAdmin(targetUser)) return 'SUPER_ADMIN';
      return 'STYLIST';
    },

    isStylist(user) {
      const targetUser = user || this.getCurrentUser();
      if (!targetUser) return false;
      const uid = String(targetUser.id || targetUser.MaNhanVien || targetUser.staffId || '').toUpperCase();
      const username = String(targetUser.username || targetUser.TenDangNhap || '').toLowerCase();
      const fullName = String(targetUser.fullName || targetUser.name || targetUser.HoTen || '').toLowerCase();
      if (uid === 'NV00' || uid === 'TK_NV00' || username === 'admin') return false;

      const role = String(targetUser.role || targetUser.vaiTroSql || targetUser.VaiTro || '').toUpperCase();
      const chucVu = String(targetUser.ChucVu || targetUser.chucVuSql || targetUser.roleName || targetUser.CapBac || targetUser.capBacSql || '').toUpperCase();

      if (role === 'STYLIST' || role.includes('THỢ') || role.includes('BARBER') || chucVu.includes('THỢ') || chucVu.includes('BARBER') || chucVu.includes('JUNIOR') || chucVu.includes('SENIOR') || chucVu.includes('MASTER')) {
        return true;
      }
      if (fullName.includes('luân') || fullName.includes('luan') || uid === 'NV03' || uid === 'TK_NV03' || username === 'user_nv03') {
        return true;
      }
      if (window.store && typeof window.store.getStylists === 'function') {
        const stylists = window.store.getStylists(null, true);
        if (stylists.some(s => s.id === uid || s.MaNhanVien === uid || (s.name && s.name.toLowerCase() === fullName))) {
          if (!chucVu.includes('QUẢN LÝ') && !role.includes('QUẢN LÝ') && !role.includes('BRANCH')) {
            return true;
          }
        }
      }
      return (role === 'STAFF' || (role.includes('NHÂN VIÊN') && !role.includes('THU NGÂN') && !role.includes('QUẢN LÝ')));
    },

    canAccess(user) {
      const u = user || this.getCurrentUser();
      if (!u) return false;
      const role = String(u.role || u.vaiTroSql || u.VaiTro || '').toUpperCase();
      const chucVu = String(u.ChucVu || u.chucVuSql || '').toUpperCase();
      const username = String(u.username || '').toLowerCase();
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'QUẢN TRỊ VIÊN', 'QUẢN TRỊ TỐI CAO', 'BRANCH_MANAGER', 'QUẢN LÝ', 'QUẢN LÝ CHI NHÁNH', 'CASHIER', 'THU NGÂN', 'THU_NGÂN', 'STAFF', 'NHÂN VIÊN', 'THỢ', 'THỢ CHÍNH', 'THỢ PHỤ', 'BARBER'];
      return allowedRoles.includes(role) || role.includes('THỢ') || chucVu.includes('THỢ') || chucVu.includes('QUẢN') || chucVu.includes('THU NGÂN') || chucVu.includes('NHÂN VIÊN') || username === 'admin';
    },

    isSuperAdmin(user) {
      const targetUser = user || this.getCurrentUser();
      if (!targetUser) return false;
      const role = String(targetUser.role || targetUser.vaiTroSql || targetUser.VaiTro || targetUser.ChucVu || targetUser.chucVuSql || '').toUpperCase();
      const username = String(targetUser.username || targetUser.TenDangNhap || '').toLowerCase();
      const uid = String(targetUser.id || targetUser.MaNhanVien || targetUser.staffId || '').toUpperCase();
      if (uid === 'NV00' || uid === 'TK_NV00' || username === 'admin') return true;
      if (this.isStylist(targetUser) || this.isCashier(targetUser) || this.isBranchManager(targetUser)) return false;
      return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'QUẢN TRỊ VIÊN' || role === 'QUẢN TRỊ TỐI CAO' || role.includes('QUẢN TRỊ');
    },

    isBranchManager(user) {
      const targetUser = user || this.getCurrentUser();
      if (!targetUser) return false;
      if (this.isSuperAdmin(targetUser)) return false;
      const role = String(targetUser.role || targetUser.vaiTroSql || targetUser.VaiTro || targetUser.ChucVu || targetUser.chucVuSql || '').toUpperCase();
      return role === 'BRANCH_MANAGER' || role === 'QUẢN LÝ' || role.includes('QUẢN LÝ') || role.includes('QUAN_LY');
    },

    isCashier(user) {
      const targetUser = user || this.getCurrentUser();
      if (!targetUser) return false;
      if (this.isSuperAdmin(targetUser) || this.isBranchManager(targetUser)) return false;
      const role = String(targetUser.role || targetUser.vaiTroSql || targetUser.VaiTro || targetUser.ChucVu || targetUser.chucVuSql || '').toUpperCase();
      return role === 'CASHIER' || role === 'THU NGÂN' || role.includes('THU NGÂN') || role.includes('THU_NGÂN');
    },

    syncBranchScope(user) {
      if (this.isBranchManager(user) || this.isCashier(user) || this.isStylist(user)) {
        const branchId = (user?.branchId && user.branchId !== 'ALL') ? user.branchId : 'CN01';
        this.filterBranch = branchId;
        this.posState.branchId = branchId;
      }
    },

    escapeHtml(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    // Pagination controls & handlers
    _renderPaginationControls(currentPage, totalPages, totalItems, onPageChangeExpr, itemName = 'mục') {
      if (totalPages <= 1) {
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin-top: 14px; font-size: 12px; color: var(--text-secondary, #94A3B8); border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));">
            <span>Hiển thị toàn bộ ${totalItems} ${itemName}</span>
            <span class="badge-terracotta" style="font-size: 11px;">Trang 1 / 1</span>
          </div>
        `;
      }

      const pages = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        const left = Math.max(2, currentPage - 1);
        const right = Math.min(totalPages - 1, currentPage + 1);
        if (left > 2) pages.push('...');
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }

      const start = Math.min(totalItems, (currentPage - 1) * this.pageSize + 1);
      const end = Math.min(totalItems, currentPage * this.pageSize);
      const prevDisabled = currentPage <= 1;
      const nextDisabled = currentPage >= totalPages;

      return `
        <div class="admin-pagination-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; margin-top: 20px; background: var(--surface-card, #1c1917); border-radius: 14px; border: 1px solid var(--border-color, rgba(255,255,255,0.08)); flex-wrap: wrap; gap: 14px; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
          <div style="font-size: 13.5px; font-weight: 600; color: var(--text-secondary, #94a3b8); display: flex; align-items: center; gap: 6px;">
            <span>Hiển thị</span>
            <strong style="color: var(--brand-accent, #C59B27); font-weight: 800; font-size: 14px;">${start}–${end}</strong>
            <span>trên tổng số</span>
            <strong style="color: var(--text-primary, #FAF8F5); font-weight: 800; font-size: 14px;">${totalItems}</strong>
            <span>${itemName} (Trang ${currentPage}/${totalPages})</span>
          </div>

          <div style="display: inline-flex; align-items: center; gap: 6px;">
            <button type="button" class="admin-pagination-btn admin-page-nav-prev" 
                    ${prevDisabled ? 'disabled' : `onclick="${onPageChangeExpr}(${currentPage - 1})"`}
                    style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 38px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: ${prevDisabled ? 'not-allowed' : 'pointer'}; opacity: ${prevDisabled ? '0.35' : '1'}; background: var(--surface-elevated, #242422); border: 1px solid var(--border-color, rgba(255,255,255,0.12)); color: var(--text-primary, #FAF8F5) !important;">
              <span style="font-size: 15px; line-height: 1;">←</span>
              <span>Trước</span>
            </button>

            <div style="display: inline-flex; align-items: center; gap: 5px;">
              ${pages.map(p => {
                if (p === '...') {
                  return `<span style="padding: 0 5px; color: var(--text-secondary, #94a3b8); font-weight: 800; font-size: 14px;">…</span>`;
                }
                const isActive = p === currentPage;
                return `
                  <button type="button" class="admin-pagination-btn admin-page-num-btn ${isActive ? 'admin-page-active active' : ''}" 
                          onclick="${onPageChangeExpr}(${p})"
                          style="min-width: 38px; height: 38px; padding: 0 8px; border-radius: 8px; font-size: 13px; font-weight: ${isActive ? '900' : '600'}; cursor: pointer; transition: all 0.2s ease; ${isActive 
                            ? 'background: #C59B27 !important; color: #141413 !important; border: 1.5px solid #C59B27 !important; box-shadow: 0 2px 8px rgba(197, 155, 39, 0.4);' 
                            : 'background: var(--surface-elevated, #242422); color: var(--text-primary, #FAF8F5) !important; border: 1px solid var(--border-color, rgba(255,255,255,0.12));'
                          }">
                    ${p}
                  </button>
                `;
              }).join('')}
            </div>

            <button type="button" class="admin-pagination-btn admin-page-nav-next" 
                    ${nextDisabled ? 'disabled' : `onclick="${onPageChangeExpr}(${currentPage + 1})"`}
                    style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 38px; padding: 0 16px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: ${nextDisabled ? 'not-allowed' : 'pointer'}; opacity: ${nextDisabled ? '0.35' : '1'}; background: #C59B27 !important; border: 1px solid #C59B27 !important; color: #141413 !important; box-shadow: 0 2px 10px rgba(197, 155, 39, 0.3);">
              <span>Sau</span>
              <span style="font-size: 15px; line-height: 1;">→</span>
            </button>
          </div>
        </div>
      `;
    },

    setInventoryPage(p) {
      this.inventoryPage = p;
      if (document.getElementById('adminInventoryContentContainer')) {
        this._updateInventoryContentOnly();
      } else {
        this.refreshInventoryView();
      }
    },
    setDispatchPage(p) {
      this.dispatchPage = p;
      this.refreshBookingsTable();
    },
    setBookingsPage(p) {
      this.bookingsPage = p;
      this.refreshBookingsTable();
    },
    setStylistsPage(p) {
      this.stylistsPage = p;
      this.refreshSubTab();
    },
    setBranchesPage(p) {
      this.branchesPage = p;
      this.refreshBranchesView();
    },
    setCatalogPage(p) {
      this.catalogPage = p;
      this.refreshSubTab();
    },
    setAuditPage(p) {
      this.auditPage = p;
      this.refreshAuditView();
    },
    refreshBookingsView() {
      this.refreshBookingsTable();
    },

    // Dry utilities & eager loading aggregators
    _openModal(htmlContent, isWide = false) {
      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;
      const shell = modal.querySelector('.modal-content-shell');
      if (shell) {
        if (isWide === 'queue' || isWide === 'medium') {
          shell.classList.remove('modal-wide');
          shell.style.maxWidth = '720px';
          shell.style.width = '90vw';
        } else if (isWide) {
          shell.classList.add('modal-wide');
          shell.style.maxWidth = '960px';
          shell.style.width = '95vw';
        } else {
          shell.classList.remove('modal-wide');
          shell.style.maxWidth = '';
          shell.style.width = '';
        }
      }
      modalBody.innerHTML = htmlContent;
      modal.classList.add('active');
    },

    _closeModal() {
      const modal = document.getElementById('globalModal');
      if (modal) {
        const shell = modal.querySelector('.modal-content-shell');
        if (shell) {
          shell.classList.remove('modal-wide');
          shell.style.maxWidth = '';
          shell.style.width = '';
        }
      }
      if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
        window.UICommon.closeGlobalModal();
      } else {
        if (modal) modal.classList.remove('active');
      }
    },

    _updateModalPreviewImage(rawUrl) {
      const imgEl = document.getElementById('modalPreviewImg');
      if (!imgEl) return;
      const cleanUrl = rawUrl ? rawUrl.trim() : '';
      if (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function') {
        imgEl.src = SalonUtils.formatImageUrl(cleanUrl);
      } else {
        imgEl.src = cleanUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80';
      }
    },

    _updateModalStockBadge(stockValue) {
      const box = document.getElementById('modalStockStatusBox');
      if (!box) return;
      const stock = parseInt(stockValue) || 0;
      if (stock > 5) {
        box.innerHTML = `<span class="stock-badge-safe" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">✓ CÒN HÀNG (${stock} SP)</span>`;
      } else if (stock > 0) {
        box.innerHTML = `<span class="stock-badge-low" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">SẮP HẾT HÀNG (${stock} SP)</span>`;
      } else {
        box.innerHTML = `<span class="stock-badge-critical" style="display: block; width: 100%; text-align: center; padding: 7px 12px; font-size: 13px; font-weight: 700; border-radius: 8px;">HẾT HÀNG (0 SP)</span>`;
      }
    },

    _goToCustomerPortal() {
      document.body.classList.remove('admin-mode');
      if (window.CustomerWeb && typeof window.CustomerWeb.switchTab === 'function') {
        window.CustomerWeb.switchTab('home');
      } else if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate('/');
      } else if (window.UIWeb && typeof window.UIWeb.switchTab === 'function') {
        window.UIWeb.switchTab('home');
      }
    },

    _getBranchShortName(branchObjOrId, branchMap = null) {
      if (!branchObjOrId) return 'Omni Salon Flagship';
      let name = '';
      if (typeof branchObjOrId === 'object') {
        name = branchObjOrId.name || branchObjOrId.id || '';
      } else if (branchMap && branchMap.has(branchObjOrId)) {
        name = branchMap.get(branchObjOrId).name;
      } else {
        name = String(branchObjOrId);
      }
      return name.split('—')[0].trim();
    },

    /**
     * Eager Loading & Aggregation: Gom nhóm dữ liệu bookings theo thợ O(B)
     * Triệt tiêu toàn bộ lỗi N+1 khi duyệt qua danh sách Barber trong dashboard.
     */
    _getStylistStatsMap(stylists, bookings, targetDate = null) {
      const todayStr = targetDate || new Date().toISOString().split('T')[0];
      const statsMap = new Map();

      // Khởi tạo map cho tất cả thợ
      stylists.forEach(s => {
        statsMap.set(s.id, {
          stylistId: s.id,
          stylistName: s.name,
          commissionRate: s.commissionRate || 0.15,
          completedCutsCount: 0,
          totalCutValue: 0,
          revenue: 0,
          commissionAmount: 0,
          commission: 0,
          todayQueue: []
        });
      });

      // 1 vòng lặp duy nhất O thay vì lặp N*M
      bookings.forEach(b => {
        if (!b.stylistId) return;
        const stats = statsMap.get(b.stylistId);
        if (!stats) return;

        const status = (b.status || '').toLowerCase();
        // Cả 'completed' và 'confirmed', hoặc 'hoàn thành', 'đã xác nhận' đều là lịch hợp lệ tạo doanh thu
        if (status === 'completed' || status === 'confirmed' || status === 'hoàn thành' || status === 'đã xác nhận') {
          stats.completedCutsCount += 1;
          const val = Number(b.totalPrice || 0);
          stats.totalCutValue += val;
          stats.revenue += val;
        }

        const bDate = b.date || b.bookingDate;
        if (bDate === todayStr && status !== 'cancelled') {
          stats.todayQueue.push(b);
        }
      });

      // Cộng dồn các ca cắt POS tại quầy được gán cho Barber
      const posOrders = (window.store && window.store.state && window.store.state.posOrders) || [];
      posOrders.forEach(pos => {
        if (!pos.stylistId) return;
        const stats = statsMap.get(pos.stylistId);
        if (!stats) return;
        if (Array.isArray(pos.services)) {
          pos.services.forEach(s => {
            const val = Number(s.price || 0);
            stats.completedCutsCount += 1;
            stats.totalCutValue += val;
            stats.revenue += val;
          });
        }
      });

      // Tính hoa hồng sau gom nhóm, 15% doanh thu cắt
      statsMap.forEach(stats => {
        const comm = Math.round(stats.totalCutValue * stats.commissionRate);
        stats.commissionAmount = comm;
        stats.commission = comm;
        stats.todayQueue.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
      });

      return statsMap;
    },

    /**
     * DRY: Tính toán hóa đơn POS & Voucher tập trung
     */
    _calculatePosSummary(posState, promotions = null) {
      const servicesTotal = posState.billServices.reduce((sum, s) => sum + Number(s.price || 0), 0);
      const productsTotal = posState.billProducts.reduce((sum, p) => sum + (Number(p.price || 0) * (p.qty || 1)), 0);
      const subtotal = servicesTotal + productsTotal;

      let discountAmount = 0;
      if (posState.voucherCode && window.PricingService) {
        const promoList = promotions || (window.store && window.store.getPromotions ? window.store.getPromotions() : []);
        const vRes = window.PricingService.processVoucherCode(posState.voucherCode, subtotal, promoList);
        discountAmount = vRes.isValid ? vRes.discountAmount : 0;
      }
      const finalTotal = Math.max(0, subtotal - discountAmount);

      return {
        servicesTotal,
        productsTotal,
        subtotal,
        discountAmount,
        finalTotal
      };
    },

  };

  // 1. Phơi đối tượng ra window
  window.AdminUtils = AdminUtils;

  // 2. Đồng bộ ngược lại AdminWeb nếu đã được nạp
  if (typeof window.AdminWeb !== 'undefined') {
    Object.assign(window.AdminWeb, AdminUtils);
  }

})(typeof window !== 'undefined' ? window : this);
