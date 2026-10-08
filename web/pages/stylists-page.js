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

      container.innerHTML = `
        <div class="stylists-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 40px 0 80px;">
          <div style="max-width: 1240px; margin: 0 auto; padding: 0 20px;">
            <!-- Header Banner -->
            <div style="text-align: center; margin-bottom: 36px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; background: var(--brand-accent-subtle); border: 1px solid var(--brand-accent-border); color: var(--brand-accent); font-size: 13px; font-weight: 800; text-transform: uppercase; margin-bottom: 14px;">
                <span>✂️</span> ĐỘI NGŨ THỢ CẮT TÓC &amp; STYLIST • OMNI SALON
              </div>
              <h1 style="font-size: clamp(30px, 4vw, 42px); font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; margin: 0 0 10px;">
                Đội Ngũ Stylist &amp; Thợ Cắt Tóc Chuyên Nghiệp
              </h1>
              <p style="font-size: 15px; color: var(--text-secondary); max-width: 720px; margin: 0 auto 24px; line-height: 1.6;">
                Đội ngũ thợ cắt tóc và stylist tay nghề cao, tận tâm tư vấn kiểu tóc chuẩn theo dáng mặt và phong cách riêng của từng khách hàng.
              </p>

              <!-- Branch Filter Pills -->
              <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                <button class="nordic-pill-tab ${this.selectedBranch === 'all' ? 'active' : ''}" onclick="StylistsPage.filterBranch('all')"
                        style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${this.selectedBranch === 'all' ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.selectedBranch === 'all' ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${this.selectedBranch === 'all' ? '#ffffff' : 'var(--text-primary)'};">
                  Tất Cả Chi Nhánh
                </button>
                ${branches.slice(0, 8).map(b => {
                  const rawName = b.TenChiNhanh || b.name || '';
                  const cleanBranch = rawName
                    .replace(/^(Men\s+Salon\s+Barber|Omni\s+Salon\s+Barber|Omni\s+Salon)\s*[-–—]?\s*/gi, '')
                    .replace(/^Q(\d+)\b/i, 'Quận $1')
                    .split('—')[0]
                    .trim();
                  return `
                    <button class="nordic-pill-tab ${this.selectedBranch === b.id ? 'active' : ''}" onclick="StylistsPage.filterBranch('${b.id}')"
                            style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1.5px solid ${this.selectedBranch === b.id ? 'var(--brand-accent)' : 'var(--border-color)'}; background: ${this.selectedBranch === b.id ? 'var(--brand-accent)' : 'var(--surface-card)'}; color: ${this.selectedBranch === b.id ? '#ffffff' : 'var(--text-primary)'};">
                      📍 ${cleanBranch}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Stylists Grid (Strict 3-Columns Alignment) -->
            <div id="stylistsProfilesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
              ${this.renderStylistCards()}
            </div>
          </div>
        </div>
      `;
    },

    filterBranch(branchId) {
      this.selectedBranch = branchId;
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
              <h3 style="font-size: 18px; font-weight: 900; color: var(--text-primary); margin-bottom: 4px;">${cleanName}</h3>
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

