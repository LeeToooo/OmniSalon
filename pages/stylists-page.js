// =========================================================================
// Omni Salon — STYLISTS PAGE COMPONENT (MASTER PROFILES & MINI PORTFOLIO - WCAG AAA)
// Tuân thủ: .antigravity/rules/03_coder.md, 04_refactor.md
// Route: "/stylists" -> Champagne Gold Avatar, Rating ★ 4.9, Mini Portfolio
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

      const branches = (window.store && typeof window.store.getBranches === 'function') ? window.store.getBranches() : [];

      container.innerHTML = `
        <div class="omni-container" style="padding-top: 60px; padding-bottom: 80px;">
          <!-- Header Banner -->
          <div style="margin-bottom: 40px;">
            <div class="nordic-hero-badge">
              <span>👑</span> MASTER STYLISTS &amp; ART DIRECTORS • OMNI SALON
            </div>
            <h1 style="font-size: clamp(32px, 4vw, 48px); font-weight: 900; color: #FFFFFF; letter-spacing: -0.02em; margin-bottom: 12px;">
              Đội Ngũ Nghệ Nhân Tạo Tác Đỉnh Cao
            </h1>
            <p style="font-size: 15px; color: #CBD5E1; max-width: 720px; line-height: 1.65;">
              Mỗi Master Stylist tại Omni Salon là một nghệ nhân được đào tạo chuyên sâu về cấu trúc khuôn mặt, kỹ thuật cắt kéo thủ công và xu hướng thời trang quốc tế.
            </p>
          </div>

          <!-- Branch Filter Pills -->
          <div class="nordic-filter-strip" id="stylistBranchFilter">
            <button class="nordic-pill-tab ${this.selectedBranch === 'all' ? 'active' : ''}" onclick="StylistsPage.filterBranch('all')">
              Toàn Bộ Chi Nhánh (18+ Suites)
            </button>
            ${branches.slice(0, 6).map(b => `
              <button class="nordic-pill-tab ${this.selectedBranch === b.id ? 'active' : ''}" onclick="StylistsPage.filterBranch('${b.id}')">
                📍 ${b.name.split('—')[0].trim()}
              </button>
            `).join('')}
          </div>

          <!-- Stylists Grid with Portfolio (Strict 3-Columns Alignment) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6 stylists-3col-grid" id="stylistsProfilesGrid" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; max-width: 1152px; margin: 32px auto 0; padding: 0 24px; box-sizing: border-box;">
            ${this.renderStylistCards()}
          </div>
        </div>
      `;
    },

    filterBranch(branchId) {
      this.selectedBranch = branchId;
      const strip = document.getElementById('stylistBranchFilter');
      if (strip) {
        strip.querySelectorAll('.nordic-pill-tab').forEach(tab => {
          if (tab.getAttribute('onclick')?.includes(`'${branchId}'`)) {
            tab.classList.add('active');
          } else {
            tab.classList.remove('active');
          }
        });
      }

      const grid = document.getElementById('stylistsProfilesGrid');
      if (grid) {
        grid.innerHTML = this.renderStylistCards();
        if (window.AppRouter) {
          window.AppRouter.initTiltEffects(grid);
          window.AppRouter.initMagneticButtons(grid);
        }
      }
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
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
      ];

      return list.map((stylist, index) => {
        const rating = (stylist.rating !== undefined ? Number(stylist.rating) : 5.0).toFixed(1);
        const reviewsCount = Number(stylist.reviewsCount || stylist.reviews_count || 500);
        const yearsExp = 8 + (index % 5);
        const specialties = Array.isArray(stylist.specialties) && stylist.specialties.length > 0
          ? stylist.specialties
          : ['Bespoke Fade', 'Texture Perm', 'Balayage Color', 'Beard Sculpture'];

        const branchObj = (window.store && typeof window.store.getBranchById === 'function') 
          ? window.store.getBranchById(stylist.branchId) 
          : null;
        const branchName = branchObj ? (branchObj.TenChiNhanh || branchObj.name).split('—')[0].trim() : 'Omni Flagship Suite';

        const p1 = portfolioSamples[index % portfolioSamples.length];
        const p2 = portfolioSamples[(index + 1) % portfolioSamples.length];
        const p3 = portfolioSamples[(index + 2) % portfolioSamples.length];

        const rawName = stylist.name || stylist.HoTen || 'Master Stylist';
        const cleanName = rawName
          .replace(/Barber/gi, 'Master Stylist')
          .replace(/Master\s+Master\s+Stylist/gi, 'Master Stylist')
          .replace(/Master\s+Stylist\s+Master\s+Stylist/gi, 'Master Stylist')
          .trim();
        const rawRole = stylist.title || stylist.level || stylist.CapBac || 'Master Stylist / Art Director';
        const cleanRole = rawRole
          .replace(/Barber/gi, 'Master Stylist')
          .replace(/Master\s+Master\s+Stylist/gi, 'Master Stylist')
          .trim();

        return `
          <div class="stylist-nordic-card static-alignment" id="stylistCard_${stylist.id}">
            <!-- Champagne Gold Avatar Frame -->
            <div class="stylist-avatar-frame">
              <img src="${stylist.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80'}"
                   class="stylist-avatar-img"
                   alt="${cleanName}"
                   loading="lazy"
                   onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';">
              <span class="stylist-exp-badge">${yearsExp}+ Năm KN</span>
            </div>

            <!-- Profile Info -->
            <h3 class="stylist-name">${cleanName}</h3>
            <span class="stylist-role">${cleanRole}</span>
            <span style="font-size: 12px; color: #94A3B8; margin-bottom: 12px;">📍 ${branchName}</span>

            <!-- Rating Row -->
            <div class="stylist-rating-row" style="display:flex;align-items:center;justify-content:center;gap:4px;margin-bottom: 8px;">
              <span class="text-amber-400 font-semibold text-sm" style="color:#FBBF24 !important;">★ 4.9 (500+ đánh giá)</span>
            </div>

            <!-- Tags Cloud -->
            <div class="stylist-tags-cloud">
              ${specialties.slice(0, 3).map(tag => `<span class="stylist-pill-tag">✨ ${tag}</span>`).join('')}
            </div>

            <!-- Mini Portfolio Gallery -->
            <div style="width: 100%; text-align: left; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em;">TÁC PHẨM THỰC TẾ:</span>
            </div>
            <div class="stylist-portfolio-mini">
              <img src="${p1}" class="stylist-portfolio-thumb" alt="Tác phẩm 1" loading="lazy">
              <img src="${p2}" class="stylist-portfolio-thumb" alt="Tác phẩm 2" loading="lazy">
              <img src="${p3}" class="stylist-portfolio-thumb" alt="Tác phẩm 3" loading="lazy">
            </div>

            <!-- Direct Booking CTA with Magnetic Button -->
            <button class="stylist-book-btn btn-magnetic" onclick="StylistsPage.bookWithStylist('${stylist.id}', '${stylist.branchId || ''}')">
              📅 Đặt Lịch Với ${stylist.name.split(' ').pop()} →
            </button>
          </div>
        `;
      }).join('');
    },

    bookWithStylist(stylistId, branchId) {
      if (window.AppRouter) {
        window.AppRouter.navigate(`/booking?stylist=${stylistId}&branch=${branchId}`);
      } else if (window.UICommon) {
        window.UICommon.bookingData.stylistId = stylistId;
        if (branchId) window.UICommon.bookingData.branchId = branchId;
        window.UICommon.openBookingModal();
      }
    }
  };

  window.StylistsPage = StylistsPage;

})(typeof window !== 'undefined' ? window : this);
