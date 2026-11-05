// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - DỊCH VỤ TRANG CHỦ & HỎI ĐÁP FAQ (CUSTOMER SERVICES GRID)
// File: web/frontend/js/modules/customer/layout/customer-services-grid.js
// ============================================================================

(function (window) {
  'use strict';

  function escapeHtml(str) {
    if (typeof SalonUtils !== 'undefined' && typeof SalonUtils.escapeHtml === 'function') {
      return SalonUtils.escapeHtml(str);
    }
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const CustomerServicesGrid = {
    selectedCategory: 'all',
    openFaqIndex: 0,

    escapeHtml(str) {
      return escapeHtml(str);
    },

    filterServices(category) {
      this.selectedCategory = category;
      if (typeof window.CustomerWeb !== 'undefined') {
        window.CustomerWeb.selectedCategory = category;
      }
      const btns = document.querySelectorAll('.service-cat-pill');
      btns.forEach(b => {
        if (b.textContent.toLowerCase().includes(category) || (category === 'all' && b.textContent.includes('Tất Cả'))) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      const grid = document.getElementById('servicesGridContainer');
      if (grid) {
        const renderFn = (this && typeof this.renderServicesCards === 'function')
          ? this.renderServicesCards.bind(this)
          : (window.CustomerWeb && typeof window.CustomerWeb.renderServicesCards === 'function')
            ? window.CustomerWeb.renderServicesCards.bind(window.CustomerWeb)
            : CustomerServicesGrid.renderServicesCards.bind(CustomerServicesGrid);
        grid.innerHTML = renderFn(true);
      }
    },

    renderServicesCards(featuredOnly = true) {
      const esc = (this && typeof this.escapeHtml === 'function')
        ? this.escapeHtml.bind(this)
        : (window.CustomerWeb && typeof window.CustomerWeb.escapeHtml === 'function')
          ? window.CustomerWeb.escapeHtml.bind(window.CustomerWeb)
          : escapeHtml;

      const services = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const combos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];

      const distinctServiceImgs = {
        DV01: 'Men_Grooming_Products/DichVu_Men/DV1.jpg',
        DV02: 'Men_Grooming_Products/DichVu_Men/DV2.jpg',
        DV03: 'Men_Grooming_Products/DichVu_Men/DV3.jpg',
        DV04: 'Men_Grooming_Products/DichVu_Men/DV4.jpg',
        DV05: 'Men_Grooming_Products/DichVu_Men/DV5.jpg',
        DV06: 'Men_Grooming_Products/DichVu_Men/DV6.jpg',
        DV07: 'Men_Grooming_Products/DichVu_Men/DV7.jpg',
        DV08: 'Men_Grooming_Products/DichVu_Men/DV8.jpg',
        DV09: 'Men_Grooming_Products/DichVu_Men/DV9.jpg',
        DV10: 'Men_Grooming_Products/DichVu_Men/DV10.jpg'
      };

      const all = [
        ...services.map(s => {
          const defaultImg = distinctServiceImgs[s.id] || distinctServiceImgs[s.MaDichVu] || 'Men_Grooming_Products/DichVu_Men/DV1.jpg';
          const validImg = (!s.image || s.image.includes('unsplash.com')) ? defaultImg : s.image;
          return { ...s, isCombo: false, image: validImg };
        }),
        ...combos.map(c => {
          const defaultImg = 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg';
          const validImg = (!c.image || c.image.includes('unsplash.com')) ? defaultImg : c.image;
          return { ...c, isCombo: true, category: 'combo', image: validImg };
        })
      ];

      const currentCat = (this && this.selectedCategory) || (window.CustomerWeb && window.CustomerWeb.selectedCategory) || 'all';

      let filtered;
      if (featuredOnly) {
        const featuredIds = ['DV01', 'DV02', 'DV03', 'DV04'];
        const featured = featuredIds.map(id => all.find(s => s.id === id || s.MaDichVu === id)).filter(Boolean);
        filtered = (featured.length === 4 ? featured : all.slice(0, 4)).slice(0, 4);
      } else {
        filtered = all.filter(s => {
          if (currentCat === 'all') return true;
          if (currentCat === 'combo') return s.isCombo;
          if (currentCat === 'haircut' || currentCat === 'cut' || currentCat === 'cat-tao-kieu') {
            return s.category === 'haircut' || s.id === 'DV01' || s.id === 'DV02' || (s.name && s.name.toLowerCase().includes('cắt'));
          }
          if (currentCat === 'perm') return s.category === 'perm' || s.id === 'DV03' || (s.name && (s.name.toLowerCase().includes('uốn') || s.name.toLowerCase().includes('ép')));
          if (currentCat === 'color') return s.category === 'color' || s.id === 'DV04' || (s.name && (s.name.toLowerCase().includes('nhuộm') || s.name.toLowerCase().includes('tẩy')));
          if (currentCat === 'shave' || currentCat === 'spa') return s.category === 'spa' || s.category === 'treatment' || s.id === 'DV05' || (s.name && (s.name.toLowerCase().includes('phục hồi') || s.name.toLowerCase().includes('cạo') || s.name.toLowerCase().includes('gội')));
          return true;
        });
      }

      if (featuredOnly) {
        return filtered.map((s, idx) => {
          let savingsBadge = '';
          if (s.isCombo && s.originalPrice && window.PricingService) {
            const savings = window.PricingService.calculateComboSavings(s.originalPrice, s.price);
            if (savings.isDiscounted) {
              savingsBadge = `<span style="font-size: 11px; color: #10B981; font-weight: 700; margin-left: 6px;">-${savings.savingsPercent}%</span>`;
            }
          } else if (s.discountPercent > 0 || (s.originalPrice && s.originalPrice > s.price)) {
            const pct = s.discountPercent || Math.round((1 - (s.price / s.originalPrice)) * 100);
            savingsBadge = `<span style="font-size: 11px; color: #ef4444; font-weight: 700; margin-left: 6px; background: rgba(239, 68, 68, 0.15); padding: 1px 6px; border-radius: 4px;">-${pct}%</span>`;
          }

          const fallbackImg = 'Men_Grooming_Products/DichVu_Men/DV1.jpg';
          const rawImg = (!s.image || s.image.includes('unsplash.com')) ? (s.isCombo ? 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' : fallbackImg) : s.image;
          const coverImg = (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function')
            ? SalonUtils.formatImageUrl(rawImg)
            : rawImg;

          const durationVal = String(s.duration || s.ThoiLuong || 45).replace(/\s*phút\s*/gi, '').trim();
          // Lưới Asymmetric 12 cột: 7 & 5 cột xen kẽ
          const colClass = (idx === 0 || idx === 3) ? 'bento-col-7' : 'bento-col-5';

          return `
            <div class="bento-editorial-card ${colClass}" id="serviceCard_${s.id}" onclick="UICommon && UICommon.openBookingModal ? UICommon.openBookingModal('${s.id}') : (window.AppRouter && window.AppRouter.navigate('/booking?service=${s.id}'))" style="min-height: 310px;">
              <img src="${coverImg}" alt="${esc(s.name)}" class="bento-bg-img" loading="lazy" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='Men_Grooming_Products/DichVu_Men/DV1.jpg');">
              <div class="bento-scrim">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-family: var(--font-sans); font-size: 13px; font-weight: 700; color: #D4AF37; text-transform: none; letter-spacing: normal;">
                    ${s.isCombo ? 'Gói combo toàn diện' : 'Tạo kiểu &amp; cắt tóc'}
                  </span>
                  <span style="font-size: 13px; font-weight: 600; color: #FAF8F5; background: rgba(20,20,19,0.85); padding: 3px 8px; border-radius: 4px; border: none;">
                    ${durationVal} phút
                  </span>
                </div>
                <h3 class="font-serif tracking-tight leading-tight text-white" style="font-size: clamp(19px, 2vw, 24px); font-weight: 700; color: #FFFFFF !important; margin: 6px 0 4px; ">
                  ${esc(s.name)}
                </h3>
                <p class="text-slate-200" style="font-family: var(--font-sans); font-size: 13.5px; color: #E2E8F0 !important; margin: 0; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; ">
                  ${esc(s.description || 'Tay nghề barber tỉ mỉ, định hình phom tóc sắc nét và tư vấn sáp vuốt nam tính.')}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: none;">
                  <div style="display: flex; align-items: baseline; gap: 4px;">
                    ${(s.originalPrice && s.originalPrice > s.price) ? `
                      <span style="font-size: 13px; text-decoration: line-through; opacity: 0.65; color: #E2E8F0;">${SalonUtils.formatCurrency(s.originalPrice)}</span>
                    ` : ''}
                    <span style="font-size: 17px; font-weight: 800; color: #C59B27;">${SalonUtils.formatCurrency(s.price)}</span>
                    ${savingsBadge}
                  </div>
                  <button type="button" class="bento-cta-btn" style="display: inline-flex; align-items: center; gap: 6px; background: #C59B27; color: #141413; padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; transition: transform 0.2s ease;">
                    <span>Đặt Lịch</span>
                    <span style="font-size: 14px;">→</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      return filtered.map(s => {
        let savingsBadge = '';
        if (s.isCombo && s.originalPrice && window.PricingService) {
          const savings = window.PricingService.calculateComboSavings(s.originalPrice, s.price);
          if (savings.isDiscounted) {
            savingsBadge = `<div style="font-size: 11px; color: #10B981; font-weight: 700; margin-top: 2px;">Tiết kiệm ${savings.formattedSavings} (-${savings.savingsPercent}%)</div>`;
          }
        } else if (s.discountPercent > 0 || (s.originalPrice && s.originalPrice > s.price)) {
          const pct = s.discountPercent || Math.round((1 - (s.price / s.originalPrice)) * 100);
          savingsBadge = `<div style="font-size: 11px; color: #ef4444; font-weight: 700; margin-top: 2px;">Ưu đãi giảm -${pct}%</div>`;
        }

        const fallbackImg = 'Men_Grooming_Products/DichVu_Men/DV1.jpg';
        const rawImg = (!s.image || s.image.includes('unsplash.com')) ? (s.isCombo ? 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' : fallbackImg) : s.image;
        const coverImg = (typeof SalonUtils !== 'undefined' && typeof SalonUtils.formatImageUrl === 'function')
          ? SalonUtils.formatImageUrl(rawImg)
          : rawImg;

        const durationVal = String(s.duration || s.ThoiLuong || 45).replace(/\s*phút\s*/gi, '').trim();

        return `
        <div class="service-card-item" id="serviceCard_${s.id}" style="border: 1px solid rgba(20,20,19,0.08); border-radius: 8px; overflow: hidden; background: var(--surface-card); box-shadow: none;">
          <div class="service-card-cover-wrap" style="position: relative; height: 180px; overflow: hidden;">
            <img src="${coverImg}" alt="${esc(s.name)}" class="service-card-cover" loading="lazy" onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='Men_Grooming_Products/DichVu_Men/DV1.jpg');">
            <span class="service-card-duration-badge" style="position: absolute; top: 10px; left: 10px; background: rgba(20,20,19,0.75); color: #FAF8F5; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${durationVal} phút</span>
          </div>
          <div class="service-card-body" style="padding: 16px;">
            <div style="font-size: 11px; font-weight: 700; color: #C59B27; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.06em;">
              ${s.isCombo ? 'GÓI COMBO' : 'THỢ CHÍNH TẠO MẪU'}
            </div>
            <h3 class="service-card-title font-serif tracking-tight leading-tight" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px;">${esc(s.name)}</h3>
            <p class="service-card-desc" style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 14px; min-height: 38px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${esc(s.description || 'Chăm sóc chu đáo, tạo kiểu tự nhiên dễ vuốt sáp hằng ngày.')}</p>
            <div class="service-card-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
              <div style="display: flex; flex-direction: column;">
                <div style="display: flex; align-items: baseline; gap: 6px;">
                  ${(s.originalPrice && s.originalPrice > s.price) ? `
                    <span style="font-size: 13px; text-decoration: line-through; opacity: 0.6; color: var(--text-secondary);">${SalonUtils.formatCurrency(s.originalPrice)}</span>
                  ` : ''}
                  <span class="service-card-price" style="font-size: 16px; font-weight: 800; color: #C59B27;">${SalonUtils.formatCurrency(s.price)}</span>
                </div>
                ${savingsBadge}
              </div>
              <button class="service-card-cta-btn" onclick="UICommon.openBookingModal('${s.id}')" style="display: inline-flex; align-items: center; gap: 6px; background: #C59B27; color: #141413; font-weight: 700; font-size: 13px; padding: 7px 14px; border-radius: 6px; border: none; cursor: pointer;">
                <span>Đặt Lịch</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      `;
      }).join('');
    },

    toggleFaq(index) {
      this.openFaqIndex = this.openFaqIndex === index ? -1 : index;
      if (typeof window.CustomerWeb !== 'undefined') {
        window.CustomerWeb.openFaqIndex = this.openFaqIndex;
      }
      const items = document.querySelectorAll('.faq-accordion-item');
      items.forEach((item, idx) => {
        if (idx === this.openFaqIndex) item.classList.add('open');
        else item.classList.remove('open');
      });
    }
  };

  // 1. Phơi đối tượng ra window
  window.CustomerServicesGrid = CustomerServicesGrid;

  // 2. Đồng bộ ngược lại CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerServicesGrid);
  }

})(typeof window !== 'undefined' ? window : this);

