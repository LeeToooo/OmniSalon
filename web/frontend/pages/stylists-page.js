// =========================================================================
// Omni Salon — STYLISTS PAGE COMPONENT (ĐỘI NGŨ NGHỆ NHÂN TẠO MẪU)
// 100% Thuần Tiếng Việt • Full Sáng Dịu Mắt • Cân Bằng Thẻ Tuyệt Đối
// =========================================================================

(function (window) {
  'use strict';

  const StylistsPage = {
    selectedBranch: 'all',

    render(container, params = {}) {
      if (!container) return;

      if (params.branch) {
        this.selectedBranch = params.branch;
      }

      const branches = (window.store && typeof window.store.getBranches === 'function' && window.store.getBranches().length > 0)
        ? window.store.getBranches()
        : ((window.store && window.store.state && window.store.state.branches) || window.INITIAL_SALON_DATA?.branches || []);

      if (window.store && typeof window.store.subscribe === 'function' && !this._subscribed) {
        this._subscribed = true;
        window.store.subscribe((state, event) => {
          const container = document.getElementById('webMainContainer');
          if (container && (window.location.hash.includes('/stylists') || window.location.pathname.includes('/stylists'))) {
            StylistsPage.render(container);
          }
        });
      }

      const selectedBranchObj = branches.find(b => b.id === this.selectedBranch);
      const selectedBranchLabel = selectedBranchObj 
        ? (selectedBranchObj.TenChiNhanh || selectedBranchObj.name || '').replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '').replace(/^Q(\d+)\b/i, 'Quận $1').split('—')[0].trim()
        : 'Tất Cả Chi Nhánh';

      const allStylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      const currentCount = this.selectedBranch === 'all' 
        ? allStylists.length 
        : allStylists.filter(s => s.branchId === this.selectedBranch || s.MaChiNhanh === this.selectedBranch).length;

      const oldModal = document.getElementById('branchBubblesModal');
      if (oldModal) oldModal.remove();

      container.innerHTML = `
        <div class="stylists-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 40px 0 80px;">
          <!-- Khung nội dung tràn viền 2 bên hiện đại -->
          <div style="max-width: 1640px; width: 100%; margin: 0 auto; padding: 0 clamp(16px, 3.5vw, 48px); box-sizing: border-box;">
            <!-- Header Banner -->
            <div style="text-align: center; margin-bottom: 36px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; background: var(--brand-accent-subtle); border: 1px solid var(--brand-accent-border); color: var(--brand-accent); font-size: 13px; font-weight: 800; text-transform: uppercase; margin-bottom: 14px;">
                <span>✂️</span> ĐỘI NGŨ THỢ CẮT TÓC &amp; STYLIST • OMNI SALON
              </div>
              <h1 style="font-size: clamp(30px, 4vw, 44px); font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; margin: 0 0 10px;">
                Đội Ngũ Stylist &amp; Thợ Cắt Tóc Chuyên Nghiệp
              </h1>
              <p style="font-size: 15px; color: var(--text-secondary); max-width: 720px; margin: 0 auto 24px; line-height: 1.6;">
                Đội ngũ thợ cắt tóc và stylist tay nghề cao, tận tâm tư vấn kiểu tóc chuẩn theo dáng mặt và phong cách riêng của từng khách hàng.
              </p>

              <!-- NÚT MỞ BONG BÓNG CHỌN CHI NHÁNH (POPUP BUBBLE SELECTOR) -->
              <div style="display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap;">
                <button type="button" class="btn-bubble-trigger btn-magnetic" onclick="StylistsPage.openBubbleModal()"
                        style="display: inline-flex; align-items: center; gap: 10px; padding: 12px 24px; border-radius: 9999px; background: var(--surface-card); border: 2px solid var(--brand-accent); color: var(--text-primary); font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 18px rgba(180, 131, 18, 0.2); transition: all 0.25s ease;">
                  <span style="font-size: 18px;">📍</span>
                  <span>Chi Nhánh: <strong style="color: var(--brand-accent);">${selectedBranchLabel}</strong></span>
                  <span style="background: var(--brand-accent); color: #ffffff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px;">${currentCount} Thợ</span>
                  <span style="font-size: 11px; opacity: 0.8; margin-left: 2px;">▼ Nhấn để chọn</span>
                </button>
                
                ${this.selectedBranch !== 'all' ? `
                  <button type="button" onclick="StylistsPage.filterBranch('all')"
                          style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 9999px; background: rgba(239, 68, 68, 0.1); border: 1.5px solid rgba(239, 68, 68, 0.3); color: #dc2626; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;">
                    ✕ Xem Tất Cả Chi Nhánh
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Stylists Grid (Tràn viền 2 bên rộng thoáng, tự động lấp đầy 4-5 cột) -->
            <div id="stylistsProfilesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 28px;">
              ${this.renderStylistCards()}
            </div>
          </div>
        </div>

        <!-- POPUP BONG BÓNG CHỌN CHI NHÁNH (BUBBLES MODAL) -->
        <div id="branchBubblesModal" onclick="if(event.target === this) StylistsPage.closeBubbleModal()" 
             style="display: none; position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 999999; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
          <div style="background: var(--surface-card, #ffffff); border: 1.5px solid var(--border-color, #cbd5e1); border-radius: 24px; max-width: 680px; width: 92%; padding: 32px 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.45); position: relative; max-height: 85vh; overflow-y: auto; text-align: center; box-sizing: border-box; margin: auto;">
            <!-- Nút đóng -->
            <button onclick="StylistsPage.closeBubbleModal()" 
                    style="position: absolute; top: 18px; right: 18px; width: 36px; height: 36px; border-radius: 50%; background: var(--surface-elevated, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); color: var(--text-primary, #0f172a); font-size: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">
              ✕
            </button>

            <!-- Tiêu đề Popup -->
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px; border-radius: 9999px; background: var(--brand-accent-subtle); color: var(--brand-accent); font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">
              <span>🎈</span> BẢNG BONG BÓNG KHU VỰC
            </div>
            <h3 style="font-size: 22px; font-weight: 900; color: var(--text-primary, #0f172a); margin: 0 0 8px;">
              Chọn Chi Nhánh Salon
            </h3>
            <p style="font-size: 14px; color: var(--text-secondary, #64748b); margin: 0 auto 24px; max-width: 520px; line-height: 1.5;">
              Nhấn vào bong bóng chi nhánh bất kỳ để lọc nhanh danh sách Stylist &amp; Thợ Cắt Tóc chuyên nghiệp tại cơ sở đó.
            </p>

            <!-- Lưới các bong bóng chi nhánh (Interactive Bubble Chips) -->
            <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; padding: 10px 0 20px;">
              <!-- Bong bóng 1: Tất Cả Chi Nhánh -->
              <button class="branch-bubble-item ${this.selectedBranch === 'all' ? 'active' : ''}" 
                      onclick="StylistsPage.selectBubbleBranch('all')"
                      style="padding: 12px 22px; border-radius: 9999px; font-size: 14px; font-weight: 800; cursor: pointer; border: 2px solid ${this.selectedBranch === 'all' ? 'var(--brand-accent, #b48312)' : 'var(--border-color, #cbd5e1)'}; background: ${this.selectedBranch === 'all' ? 'linear-gradient(135deg, #b48312, #d97706)' : 'var(--surface-elevated, #f8fafc)'}; color: ${this.selectedBranch === 'all' ? '#ffffff' : 'var(--text-primary, #0f172a)'}; box-shadow: ${this.selectedBranch === 'all' ? '0 4px 14px rgba(180, 131, 18, 0.4)' : '0 2px 6px rgba(0,0,0,0.04)'}; display: inline-flex; align-items: center; gap: 6px;">
                ✨ Tất Cả Chi Nhánh (${branches.length})
              </button>

              <!-- Các bong bóng chi nhánh cụ thể -->
              ${branches.map(b => {
                const rawName = b.TenChiNhanh || b.name || '';
                const cleanBranch = rawName
                  .replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '')
                  .replace(/^Q(\d+)\b/i, 'Quận $1')
                  .split('—')[0]
                  .trim();
                const isSelected = this.selectedBranch === b.id;
                const stylistCountInBranch = allStylists.filter(s => s.branchId === b.id || s.MaChiNhanh === b.id).length;

                return `
                  <button class="branch-bubble-item ${isSelected ? 'active' : ''}" 
                          onclick="StylistsPage.selectBubbleBranch('${b.id}')"
                          style="padding: 11px 18px; border-radius: 9999px; font-size: 13.5px; font-weight: 700; cursor: pointer; border: 2px solid ${isSelected ? 'var(--brand-accent, #b48312)' : 'var(--border-color, #cbd5e1)'}; background: ${isSelected ? 'linear-gradient(135deg, #b48312, #d97706)' : 'var(--surface-elevated, #f8fafc)'}; color: ${isSelected ? '#ffffff' : 'var(--text-primary, #0f172a)'}; box-shadow: ${isSelected ? '0 4px 14px rgba(180, 131, 18, 0.4)' : '0 2px 6px rgba(0,0,0,0.04)'}; display: inline-flex; align-items: center; gap: 6px;">
                    <span>📍</span>
                    <span>${cleanBranch}</span>
                    <span style="font-size: 11px; opacity: ${isSelected ? '1' : '0.8'}; font-weight: 800; background: ${isSelected ? 'rgba(255,255,255,0.25)' : 'var(--surface-card, #e2e8f0)'}; padding: 2px 7px; border-radius: 999px;">${stylistCountInBranch} thợ</span>
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Nút đóng nhanh dưới đáy -->
            <div style="margin-top: 14px; padding-top: 18px; border-top: 1px solid var(--border-color, #cbd5e1);">
              <button onclick="StylistsPage.closeBubbleModal()" 
                      style="padding: 10px 24px; border-radius: 12px; background: var(--surface-elevated, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); color: var(--text-primary, #0f172a); font-size: 13px; font-weight: 700; cursor: pointer;">
                Đóng Bảng Chọn
              </button>
            </div>
          </div>
        </div>
      `;
    },

    openBubbleModal() {
      let modal = document.getElementById('branchBubblesModal');
      if (modal) {
        if (modal.parentElement !== document.body) {
          document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    },

    closeBubbleModal() {
      const modal = document.getElementById('branchBubblesModal');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    },

    selectBubbleBranch(branchId) {
      this.closeBubbleModal();
      this.filterBranch(branchId);
    },

    filterBranch(branchId) {
      this.selectedBranch = branchId;
      const modal = document.getElementById('branchBubblesModal');
      if (modal) modal.remove();
      document.body.style.overflow = '';
      this.render(document.getElementById('webMainContainer'));
    },

    renderStylistCards() {
      const allStylists = (window.store && typeof window.store.getStylists === 'function') ? window.store.getStylists() : [];
      let list = allStylists;
      if (this.selectedBranch !== 'all') {
        list = allStylists.filter(s => s.branchId === this.selectedBranch || s.MaChiNhanh === this.selectedBranch);
      }

      const portfolioSamples = [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
      ];

      return list.map((stylist, index) => {
        const rating = (stylist.rating !== undefined ? Number(stylist.rating) : 5.0).toFixed(1);
        const yearsExp = 6 + (index % 6);
        const specialties = Array.isArray(stylist.specialties) && stylist.specialties.length > 0
          ? stylist.specialties
          : ['Cắt Fade Nghệ Thuật', 'Uốn Textured Nam', 'Nhuộm Khói Nam', 'Tạo Kiểu Pomade'];

        const branchObj = (window.store && typeof window.store.getBranchById === 'function') 
          ? window.store.getBranchById(stylist.branchId) 
          : null;
        const branchName = branchObj 
          ? (branchObj.TenChiNhanh || branchObj.name).replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '').replace(/^Q(\d+)\b/i, 'Quận $1').split('—')[0].trim()
          : 'Omni Salon Flagship';

        const p1 = portfolioSamples[index % portfolioSamples.length];
        const p2 = portfolioSamples[(index + 1) % portfolioSamples.length];
        const p3 = portfolioSamples[(index + 2) % portfolioSamples.length];

        const cleanName = (stylist.name || stylist.HoTen || 'Stylist').trim();
        const isAssis = (stylist.role || '').toLowerCase().includes('phụ');
        const roleBadgeText = isAssis ? '🧴 Thợ Phụ' : '✂️ Thợ Chính';

        return `
          <div class="stylist-nordic-card" id="stylistCard_${stylist.id}"
               style="background: var(--surface-card); border: .5px solid var(--border-color); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-shadow: 0 4px 18px rgba(0,0,0,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease;">
            
            <div style="text-align: center;">
              <!-- Avatar Tròn Có Viền Gold -->
              <div style="position: relative; width: 96px; height: 96px; margin: 0 auto 16px; border-radius: 50%; overflow: hidden; border: 3px solid ${isAssis ? '#0ea5e9' : 'var(--brand-accent)'}; box-shadow: 0 4px 14px rgba(180,131,18,0.25);">
                <img src="${stylist.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80'}"
                     style="width: 100%; height: 100%; object-fit: cover;"
                     alt="${cleanName}"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';">
                <span style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.65); color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 0;">
                  ${yearsExp}+ Năm Kinh Nghiệm
                </span>
              </div>

              <!-- Thông Tin Thợ Cắt Tóc / Stylist -->
              <h3 class="stylist-name" style="font-size: 18px; font-weight: 900; color: var(--text-primary, #1e293b); margin-bottom: 4px;">${cleanName}</h3>
              <div style="margin-bottom: 6px; display: flex; justify-content: center; align-items: center; gap: 6px;">
                <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; ${isAssis ? 'background: rgba(14, 165, 233, 0.15); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.35);' : 'background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.35);'}">
                  ${roleBadgeText}
                </span>
                <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">${stylist.level || (isAssis ? 'Junior Barber' : 'Master Barber')}</span>
              </div>
              <span style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 10px;">📍 ${branchName}</span>

              <!-- Đánh Giá Sao -->
              <div style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 9999px; background: var(--brand-accent-subtle); border: 1px solid var(--brand-accent-border); margin-bottom: 14px;">
                <span style="color: var(--brand-accent); font-size: 13px; font-weight: 800;">★ 5.0 (500+ lượt cắt ưng ý)</span>
              </div>

              <!-- Thẻ Kỹ Thuật Chuyên Sâu -->
              <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px;">
                ${specialties.slice(0, 3).map(tag => `<span style="font-size: 11px; font-weight: 700; color: var(--text-primary); background: var(--surface-elevated); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border-color);">✨ ${tag}</span>`).join('')}
              </div>

              <!-- Ảnh tác phẩm thực tế -->
              <div style="width: 100%; text-align: left; margin-bottom: 8px;">
                <span style="font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">MẪU TÓC ĐÃ THỰC HIỆN:</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 18px;">
                <img src="${p1}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px;" alt="Mẫu tóc 1" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300';">
                <img src="${p2}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px;" alt="Mẫu tóc 2" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300';">
                <img src="${p3}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px;" alt="Mẫu tóc 3" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300';">
              </div>
            </div>

            <!-- Nút Đặt Lịch Trực Tiếp -->
            <button onclick="StylistsPage.bookWithStylist('${stylist.id}', '${stylist.branchId || ''}')"
                    style="width: 100%; height: 44px; border-radius: 10px; background: var(--brand-accent); border: none; color: #ffffff; font-size: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(180,131,18,0.25); margin-top: auto;">
              📅 Đặt Lịch Với ${cleanName.split(' ').pop()}
            </button>
          </div>
        `;
      }).join('');
    },

    bookWithStylist(stylistId, branchId) {
      if (window.AppRouter) {
        window.AppRouter.navigate(`/booking?stylist=${stylistId}&branch=${branchId}`);
      } else if (window.BookingPage) {
        window.BookingPage.onSelectStylist(stylistId);
        window.location.hash = `#/booking?stylist=${stylistId}`;
      }
    }
  };

  window.StylistsPage = StylistsPage;

})(window);

