// Trang danh sach dich vu va goi combo lam toc
(function (window) {
  'use strict';

  const ServicesPage = {
    activeCategory: 'all',
    _currentServiceReviews: {},

    // Metadata dong bo truc quan giong trang Dat Lich
    serviceVisualMeta: {
      'CB01': { shortName: 'Combo Quý Tộc Barber (Cắt + Gội + Cạo râu)', highlight: 'Cắt • Gội thư giãn • Cạo râu khăn nóng', savings: 'Tiết kiệm 50K', img: 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg', category: 'combo', duration: 90, price: 300000 },
      'CB02': { shortName: 'Combo Đẹp Trai Toàn Diện (Cắt + Ép Side Down Perm)', highlight: 'Cắt form chuẩn • Ép side ôm sát 2 tháng', savings: 'Tiết kiệm 40K', img: 'Men_Grooming_Products/DichVu_Men/CBDV2.jpg', category: 'combo', duration: 80, price: 330000 },
      'CB03': { shortName: 'Combo Lột Xác Phong Cách (Cắt + Uốn Texture + Gội)', highlight: 'Cắt • Uốn Texture Hàn Quốc • Gội xả', savings: 'Tiết kiệm 130K', img: 'Men_Grooming_Products/DichVu_Men/CBDV3.jpg', category: 'combo', duration: 130, price: 790000 },
      'CB04': { shortName: 'Combo Quý Ông (Kẻ Tattoo + Cạo râu + Ráy tai Facial)', highlight: 'Kẻ Tattoo • Cạo râu • Ráy tai Facial', savings: 'Tiết kiệm 50K', img: 'Men_Grooming_Products/DichVu_Men/CBDV4.jpg', category: 'combo', duration: 75, price: 280000 },
      'DV01': { shortName: 'Cắt Fade & Vuốt Sáp', highlight: 'Tư vấn phom mặt • Sấy vuốt Pomade', img: 'Men_Grooming_Products/DichVu_Men/DV1.jpg', category: 'cut', duration: 45, price: 120000 },
      'DV02': { shortName: 'Ép Side Down Perm', highlight: 'Ép xẹp tóc mai • Giữ nếp 2 tháng', img: 'Men_Grooming_Products/DichVu_Men/DV2.jpg', category: 'cut', duration: 60, price: 250000 },
      'DV03': { shortName: 'Uốn Phồng Texture', highlight: 'Lọn sóng tự nhiên • Dễ sấy tạo kiểu', img: 'Men_Grooming_Products/DichVu_Men/DV3.jpg', category: 'perm', duration: 90, price: 650000 },
      'DV04': { shortName: 'Nhuộm Thời Trang', highlight: 'Khói / Rêu / Bạch kim bảo vệ tóc', img: 'Men_Grooming_Products/DichVu_Men/DV4.jpg', category: 'perm', duration: 90, price: 950000 },
      'DV05': { shortName: 'Uốn Sâu Dreadlocks', highlight: 'Xù gai góc • Phong cách hip-hop', img: 'Men_Grooming_Products/DichVu_Men/DV5.jpg', category: 'perm', duration: 100, price: 800000 },
      'DV06': { shortName: 'Kẻ Line Hair Tattoo', highlight: 'Điêu khắc chân tóc • Đường nét sắc bén', img: 'Men_Grooming_Products/DichVu_Men/DV6.jpg', category: 'cut', duration: 30, price: 150000 },
      'DV07': { shortName: 'Cạo Râu Khăn Nóng', highlight: 'Bọt kem Proraso • Chườm ấm thư giãn', img: 'Men_Grooming_Products/DichVu_Men/DV7.jpg', category: 'spa', duration: 30, price: 80000 },
      'DV08': { shortName: 'Nhuộm Đen Phủ Bạc', highlight: 'Thảo dược tự nhiên • Không mùi hắc', img: 'Men_Grooming_Products/DichVu_Men/DV8.jpg', category: 'perm', duration: 60, price: 250000 },
      'DV09': { shortName: 'Tẩy Tóc Nâng Tông', highlight: 'Nâng sáng 3-4 cấp • Chuẩn bị phủ màu', img: 'Men_Grooming_Products/DichVu_Men/DV9.jpg', category: 'perm', duration: 60, price: 300000 },
      'DV10': { shortName: 'Ráy Tai & Facial', highlight: 'Đèn soi quang học • Dưỡng ẩm sáng da', img: 'Men_Grooming_Products/DichVu_Men/DV10.jpg', category: 'spa', duration: 35, price: 100000 }
    },

    // Du lieu goc du phong cho cac goi combo VIP
    comboDefaults: {
      'CB01': { name: 'Combo Quý Tộc Barber (Cắt + Gội + Cạo râu)', price: 300000, duration: 90, description: 'Gói dịch vụ chăm sóc hoàn chỉnh từ cắt tóc, gội dưỡng sinh đến cạo mặt khăn nóng.', image: 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' },
      'CB02': { name: 'Combo Đẹp Trai Toàn Diện (Cắt + Ép Side Down Perm)', price: 330000, duration: 80, description: 'Cắt form chuẩn kết hợp ép xẹp 2 bên mai giúp đầu vuông vức, gọn gàng.', image: 'Men_Grooming_Products/DichVu_Men/CBDV2.jpg' },
      'CB03': { name: 'Combo Lột Xác Phong Cách (Cắt + Uốn Texture + Gội)', price: 790000, duration: 130, description: 'Combo uốn phồng tóc tạo nếp Hàn Quốc kèm gội xả thư giãn.', image: 'Men_Grooming_Products/DichVu_Men/CBDV3.jpg' },
      'CB04': { name: 'Combo Quý Ông (Kẻ Tattoo + Cạo râu + Ráy tai Facial)', price: 280000, duration: 75, description: 'Gói chăm sóc gọn gàng diện mạo gồm tỉa họa tiết tóc, cạo râu bọt kem và lấy ráy tai thư giãn.', image: 'Men_Grooming_Products/DichVu_Men/CBDV4.jpg' }
    },

    // Chuan hoa offering tranh triet de loi undefined va 0 dong
    normalizeOffering(rawItem, forceCombo) {
      if (!rawItem) return null;
      const sId = rawItem.id || rawItem.MaCombo || rawItem.MaDichVu || '';
      const upperId = String(sId).trim().toUpperCase();
      const isCombo = forceCombo === true || upperId.startsWith('CB') || Boolean(rawItem.TenCombo) || Boolean(rawItem.GiaCombo);
      const meta = this.serviceVisualMeta[upperId] || this.serviceVisualMeta[sId] || {};
      const comboDef = this.comboDefaults[upperId] || {};

      let resolvedName = rawItem.name || rawItem.TenCombo || rawItem.TenDichVu || rawItem.TenGoi || meta.shortName || comboDef.name || '';
      if (!resolvedName || resolvedName === 'undefined') {
        resolvedName = comboDef.name || meta.shortName || (isCombo ? 'Gói Combo Barber' : 'Dịch Vụ Tạo Kiểu');
      }

      let rawPrice = rawItem.price;
      if (rawPrice === undefined || rawPrice === null || rawPrice === 0) rawPrice = rawItem.GiaCombo;
      if (rawPrice === undefined || rawPrice === null || rawPrice === 0) rawPrice = rawItem.Gia;
      if (rawPrice === undefined || rawPrice === null || rawPrice === 0) rawPrice = rawItem.GiaTien;
      if (rawPrice === undefined || rawPrice === null || rawPrice === 0) rawPrice = comboDef.price;
      if (rawPrice === undefined || rawPrice === null || rawPrice === 0) rawPrice = meta.price;
      const resolvedPrice = Number(rawPrice) || 0;

      let durRaw = rawItem.duration || rawItem.ThoiLuong || rawItem.durationMinutes || comboDef.duration || meta.duration || (isCombo ? 75 : 45);
      let durationVal = parseInt(String(durRaw).replace(/\D/g, ''), 10);
      if (!durationVal || isNaN(durationVal)) {
        durationVal = isCombo ? (comboDef.duration || 75) : 45;
      }

      let resolvedDesc = rawItem.description || rawItem.MoTa || rawItem.highlight || comboDef.description || meta.highlight || 'Tư vấn phom dáng theo chất tóc và gương mặt, kết hợp kỹ thuật cắt kéo thủ công và tạo kiểu chính hãng.';
      if (resolvedDesc === 'undefined') {
        resolvedDesc = comboDef.description || 'Dịch vụ tạo kiểu tóc nam cao cấp tại Omni Salon.';
      }

      let resolvedImg = rawItem.image || rawItem.HinhAnh || comboDef.image || meta.img || (isCombo ? 'Men_Grooming_Products/DichVu_Men/CBDV1.jpg' : 'Men_Grooming_Products/DichVu_Men/DV1.jpg');

      const originalPrice = rawItem.originalPrice || rawItem.oldPrice || (isCombo ? Math.round(resolvedPrice * 1.15) : undefined);

      return {
        ...rawItem,
        id: sId || upperId,
        name: resolvedName,
        TenDichVu: resolvedName,
        TenCombo: resolvedName,
        price: resolvedPrice,
        Gia: resolvedPrice,
        GiaCombo: resolvedPrice,
        duration: `${durationVal} phút`,
        durationVal: durationVal,
        description: resolvedDesc,
        MoTa: resolvedDesc,
        image: resolvedImg,
        HinhAnh: resolvedImg,
        originalPrice: originalPrice,
        isCombo: isCombo,
        category: rawItem.category || meta.category || (isCombo ? 'combo' : 'haircut'),
        services: Array.isArray(rawItem.services) ? rawItem.services : []
      };
    },

    render(container, params = {}) {
      if (!container) return;

      if (params.category) {
        this.activeCategory = params.category;
      }

      container.innerHTML = `
        <div class="services-page-shell" style="background-color: var(--bg-primary); min-height: 100vh; color: var(--text-primary); padding: 48px 0 88px;">
          <!-- Khung nội dung tràn viền toàn diện đồng bộ với Header -->
          <div class="services-fluid-container" style="width: 100%; max-width: 100%; margin: 0; padding: 0 clamp(20px, 3vw, 56px); box-sizing: border-box;">
            <!-- Header Banner -->
            <div style="text-align: center; margin-bottom: 40px;">
              <span class="tracking-widest" style="font-size: 11.5px; font-weight: 700; color: #C59B27; text-transform: uppercase; margin-bottom: 8px; display: inline-block;">
                BẢNG GIÁ DỊCH VỤ NIÊM YẾT
              </span>
              <h1 class="font-serif tracking-tight leading-tight" style="font-size: clamp(30px, 3.8vw, 46px); font-weight: 700; color: var(--text-primary); margin: 0 0 12px;">
                Dịch Vụ Cắt Tóc &amp; Gói Grooming Toàn Diện
              </h1>
              <p style="font-size: clamp(14px, 1vw, 16px); color: var(--text-secondary); max-width: min(800px, 65vw); margin: 0 auto 28px; line-height: 1.6;">
                Từng đường kéo, từng đường cạo khăn nóng và kỹ thuật fade chuẩn xác mang lại diện mạo đĩnh đạc và phong độ vững vàng cho quý ông.
              </p>

              <!-- Clean Tabs Category Filters -->
              <div class="clean-filter-tabs" style="justify-content: center; gap: 8px; flex-wrap: wrap;">
                <button class="clean-tab-btn ${this.activeCategory === 'all' ? 'active' : ''}" onclick="ServicesPage.setCategory('all')">
                  Tất Cả Dịch Vụ
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'haircut' ? 'active' : ''}" onclick="ServicesPage.setCategory('haircut')">
                  Cắt &amp; Fade Tạo Kiểu
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'perm' ? 'active' : ''}" onclick="ServicesPage.setCategory('perm')">
                  Uốn Texture &amp; Định Hình
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'color' ? 'active' : ''}" onclick="ServicesPage.setCategory('color')">
                  Nhuộm Tone Trầm &amp; Highlight
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'spa' || this.activeCategory === 'care' ? 'active' : ''}" onclick="ServicesPage.setCategory('spa')">
                  Cạo Mặt &amp; Thư Giãn Da Đầu
                </button>
                <button class="clean-tab-btn ${this.activeCategory === 'combo' ? 'active' : ''}" onclick="ServicesPage.setCategory('combo')">
                  Gói Combo Toàn Diện
                </button>
              </div>
            </div>

            <!-- LƯỚI THẺ DỊCH VỤ 4 CỘT ĐỒNG BỘ MỌI ĐỘ PHÂN GIẢI -->
            <div id="servicesCatalogGrid" class="services-catalog-grid">
              ${this.renderCards()}
            </div>
          </div>
        </div>
      `;
    },

    setCategory(category) {
      this.activeCategory = category;
      this.render(document.getElementById('webMainContainer'));
    },

    renderCards() {
      const rawServices = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const rawCombos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];

      // Loc bo triet de combo bi lan vao services
      const allServices = rawServices
        .filter(s => {
          const id = String(s.id || s.MaDichVu || '').trim().toUpperCase();
          return !id.startsWith('CB');
        })
        .map(s => this.normalizeOffering(s, false));

      // Lay danh sach combo day du tu store hoac comboDefaults
      let allCombos = rawCombos.map(c => this.normalizeOffering(c, true));
      if (!allCombos || allCombos.length === 0) {
        allCombos = Object.keys(this.comboDefaults).map(id => this.normalizeOffering({ id, ...this.comboDefaults[id] }, true));
      }

      // Dam bao du 4 combo CB01 den CB04 khong thieu
      const comboMap = new Map();
      allCombos.forEach(c => comboMap.set(String(c.id).toUpperCase(), c));
      ['CB01', 'CB02', 'CB03', 'CB04'].forEach(id => {
        if (!comboMap.has(id)) {
          comboMap.set(id, this.normalizeOffering({ id, ...this.comboDefaults[id] }, true));
        }
      });
      const unifiedCombos = Array.from(comboMap.values());

      let list = [];
      if (this.activeCategory === 'all') {
        list = [...allServices, ...unifiedCombos];
      } else if (this.activeCategory === 'combo') {
        list = unifiedCombos;
      } else if (this.activeCategory === 'haircut' || this.activeCategory === 'cut' || this.activeCategory === 'cat-tao-kieu') {
        list = [
          ...allServices.filter(s => s.category === 'haircut' || s.category === 'cut' || s.id === 'DV01' || s.id === 'DV02' || s.id === 'DV06'),
          ...unifiedCombos.filter(c => c.name && c.name.toLowerCase().includes('cắt'))
        ];
      } else if (this.activeCategory === 'perm') {
        list = allServices.filter(s => s.category === 'perm' || s.id === 'DV03' || s.id === 'DV05');
      } else if (this.activeCategory === 'color') {
        list = allServices.filter(s => s.category === 'color' || s.id === 'DV04' || s.id === 'DV08' || s.id === 'DV09');
      } else if (this.activeCategory === 'spa' || this.activeCategory === 'care' || this.activeCategory === 'shave') {
        list = allServices.filter(s => s.category === 'spa' || s.category === 'care' || s.id === 'DV07' || s.id === 'DV10');
      } else {
        list = allServices.filter(s => s.category === this.activeCategory);
      }

      if (list.length === 0) {
        list = [...allServices, ...unifiedCombos];
      }

      return list.map(item => {
        const isCombo = item.isCombo;
        const durationVal = item.durationVal || 45;
        const actualPrice = item.price || 0;
        const originalPrice = item.originalPrice;
        const priceFormatted = window.SalonUtils ? window.SalonUtils.formatCurrency(actualPrice) : (actualPrice.toLocaleString('vi-VN') + ' ₫');

        const rawImg = item.image;
        const thumb = (typeof window.SalonUtils !== 'undefined' && typeof window.SalonUtils.formatImageUrl === 'function')
          ? window.SalonUtils.formatImageUrl(rawImg)
          : rawImg;

        const displayName = this.escapeHtml(item.name);
        const displayDesc = this.escapeHtml(item.description);

        return `
          <div class="service-editorial-card" id="bentoCard_${item.id}">
            
            <!-- ANH DICH VU DONG NHAT KHOA TY LE VANG -->
            <div class="service-card-media" style="position: relative; width: 100%; aspect-ratio: 16 / 10; overflow: hidden; background: #141413; cursor: pointer;" onclick="ServicesPage.openServiceDetailModal('${item.id}')">
              <img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.5s ease;" alt="${displayName}" loading="lazy"
                   onerror="typeof SalonUtils !== 'undefined' && SalonUtils.handleImgError ? SalonUtils.handleImgError(this) : (this.onerror=null, this.src='Men_Grooming_Products/DichVu_Men/DV1.jpg');">
              <div style="position: absolute; top: 12px; left: 12px; background: rgba(20, 20, 19, 0.85); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; color: #FAF8F5; border: 1px solid rgba(255, 255, 255, 0.1); z-index: 2;">
                ⏱ ${durationVal} phút
              </div>
              ${isCombo ? `
                <div style="position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #C59B27, #eab308); color: #141413; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; border: none; letter-spacing: 0.04em; z-index: 2;">
                  COMBO ĐẶC BIỆT
                </div>
              ` : (item.discountPercent > 0 ? `
                <div style="position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; border: none; letter-spacing: 0.04em; z-index: 2;">
                  GIẢM -${item.discountPercent}%
                </div>
              ` : '')}
            </div>

            <!-- NOI DUNG DICH VU EDITORIAL -->
            <div class="service-card-body" style="padding: clamp(16px, 1.2vw, 24px); flex: 1; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
              <div>
                <h3 class="font-serif tracking-tight leading-tight service-card-title" style="font-size: clamp(17px, 1.15vw, 22px); font-weight: 700; color: var(--text-primary); margin: 0 0 8px; cursor: pointer;" onclick="ServicesPage.openServiceDetailModal('${item.id}')">
                  ${displayName}
                </h3>
                <p class="service-card-desc" style="font-size: clamp(13px, 0.85vw, 15px); color: var(--text-secondary); line-height: 1.6; margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; min-height: clamp(54px, 3.8vw, 68px);">
                  ${displayDesc}
                </p>
              </div>

              <!-- GIA VA NUT CHI TIET VA DAT LICH -->
              <div class="service-card-footer" style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                <div>
                  <span class="service-card-price" style="font-size: clamp(18px, 1.2vw, 23px); font-weight: 800; color: #C59B27;">${priceFormatted}</span>
                  ${originalPrice && originalPrice > actualPrice ? `<span style="font-size: clamp(12px, 0.8vw, 13.5px); text-decoration: line-through; color: var(--text-muted); margin-left: 6px;">${window.SalonUtils ? window.SalonUtils.formatCurrency(originalPrice) : originalPrice}</span>` : ''}
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <button type="button" onclick="ServicesPage.openServiceDetailModal('${item.id}')"
                          class="service-card-btn"
                          style="min-height: clamp(36px, 2.2vw, 42px); height: clamp(36px, 2.2vw, 42px); padding: 0 clamp(10px, 0.8vw, 14px); border-radius: 6px; background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); font-size: clamp(12px, 0.8vw, 13.5px); font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s ease;">
                    Chi Tiết
                  </button>
                  <button onclick="ServicesPage.selectAndBook('${item.id}')"
                          class="service-card-btn"
                          style="min-height: clamp(36px, 2.2vw, 42px); height: clamp(36px, 2.2vw, 42px); padding: 0 clamp(14px, 1vw, 20px); border-radius: 6px; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); font-size: clamp(12.5px, 0.8vw, 14px); font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s ease; white-space: nowrap;">
                    Đặt Lịch →
                  </button>
                </div>
              </div>
            </div>

          </div>
        `;
      }).join('');
    },

    selectAndBook(serviceId) {
      if (window.UICommon && typeof window.UICommon.closeGlobalModal === 'function') {
        window.UICommon.closeGlobalModal();
      }
      if (window.AppRouter) {
        window.AppRouter.navigate(`/booking?service=${serviceId}`);
      } else if (window.BookingPage) {
        window.BookingPage.onSelectService(serviceId);
        window.location.hash = `#/booking?service=${serviceId}`;
      }
    },

    // Tim thong tin dich vu hoac combo theo ID voi chuan hoa offering
    findServiceOrCombo(itemId) {
      if (!itemId) return null;
      const clean = String(itemId).trim().toLowerCase();
      const rawServices = (window.store && typeof window.store.getServices === 'function') ? window.store.getServices() : [];
      const rawCombos = (window.store && typeof window.store.getCombos === 'function') ? window.store.getCombos() : [];

      const upperClean = clean.toUpperCase();
      if (upperClean.startsWith('CB')) {
        const c = rawCombos.find(it => String(it.id || it.MaCombo || '').trim().toLowerCase() === clean);
        if (c) return this.normalizeOffering(c, true);
        if (this.comboDefaults[upperClean]) {
          return this.normalizeOffering({ id: upperClean, ...this.comboDefaults[upperClean] }, true);
        }
      }

      const s = rawServices.find(it => String(it.id || it.MaDichVu || '').trim().toLowerCase() === clean);
      if (s) return this.normalizeOffering(s, false);

      const c = rawCombos.find(it => String(it.id || it.MaCombo || '').trim().toLowerCase() === clean);
      if (c) return this.normalizeOffering(c, true);

      if (this.comboDefaults[upperClean]) {
        return this.normalizeOffering({ id: upperClean, ...this.comboDefaults[upperClean] }, true);
      }

      return null;
    },

    // Lay danh sach danh gia cua dich vu
    getServiceReviews(serviceId) {
      const clean = String(serviceId).trim().toLowerCase();
      if (this._currentServiceReviews[clean]) {
        return this._currentServiceReviews[clean];
      }
      const allReviews = (window.store && window.store.state && Array.isArray(window.store.state.reviews))
        ? window.store.state.reviews
        : [];
      return allReviews.filter(r => 
        (r.serviceId && String(r.serviceId).trim().toLowerCase() === clean) ||
        (r.MaDichVu && String(r.MaDichVu).trim().toLowerCase() === clean) ||
        (r.comboId && String(r.comboId).trim().toLowerCase() === clean)
      );
    },

    // Mo Modal chi tiet dich vu va combo kem quy trinh chuan 5 buoc va danh gia
    async openServiceDetailModal(serviceId) {
      const item = this.findServiceOrCombo(serviceId);
      if (!item) return;

      const modal = document.getElementById('globalModal');
      const modalBody = document.getElementById('globalModalBody');
      if (!modal || !modalBody) return;

      modal.classList.add('modal-wide');
      modal.classList.add('active');

      const isCombo = item.isCombo;
      const durationVal = item.durationVal || 45;
      const actualPrice = item.price || 0;
      const priceFormatted = window.SalonUtils ? window.SalonUtils.formatCurrency(actualPrice) : (actualPrice.toLocaleString('vi-VN') + ' ₫');

      const rawImg = item.image;
      const thumb = (typeof window.SalonUtils !== 'undefined' && typeof window.SalonUtils.formatImageUrl === 'function')
        ? window.SalonUtils.formatImageUrl(rawImg)
        : rawImg;

      const title = item.name;
      const desc = item.description;
      const categoryTag = isCombo ? 'GÓI COMBO ĐẶC BIỆT' : (item.category ? item.category.toUpperCase() : 'DỊCH VỤ TIÊU CHUẨN');

      // Tai danh gia tu backend
      try {
        const res = await fetch(`/api/reviews?serviceId=${encodeURIComponent(serviceId)}`);
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          this._currentServiceReviews[String(serviceId).trim().toLowerCase()] = list;
        }
      } catch (_) {}

      const reviews = this.getServiceReviews(serviceId);
      const currentUser = (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function') 
        ? window.CustomerWeb.getCurrentUser() 
        : null;

      // Danh sach dich vu thanh phan neu la Combo
      const comboServices = (isCombo && Array.isArray(item.services)) ? item.services : [];

      modalBody.innerHTML = `
        <div class="service-detail-modal-content" style="max-height: 80vh; overflow-y: auto; padding: 10px 4px;">
          
          <!-- Banner hinh anh va Tieu de -->
          <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; align-items: flex-start;">
            <div style="flex: 1; min-width: 280px; max-width: 440px; aspect-ratio: 16/10; border-radius: 12px; overflow: hidden; position: relative; background: #141413;">
              <img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover;" alt="${this.escapeHtml(title)}">
              <div style="position: absolute; top: 12px; left: 12px; background: rgba(20, 20, 19, 0.85); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; color: #FAF8F5;">
                ⏱ ${durationVal} phút
              </div>
            </div>

            <div style="flex: 1.2; min-width: 280px;">
              <div style="font-size: 11px; font-weight: 800; color: #C59B27; letter-spacing: 0.05em; margin-bottom: 6px;">${categoryTag}</div>
              <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin: 0 0 10px; line-height: 1.3;">${this.escapeHtml(title)}</h2>
              <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;">
                <span style="font-size: 26px; font-weight: 900; color: #C59B27;">${priceFormatted}</span>
                ${item.originalPrice && item.originalPrice > actualPrice ? `
                  <span style="font-size: 16px; text-decoration: line-through; color: var(--text-muted);">${window.SalonUtils ? window.SalonUtils.formatCurrency(item.originalPrice) : item.originalPrice}</span>
                  <span style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 800;">-${item.discountPercent}%</span>
                ` : ''}
              </div>
              <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin: 0 0 20px;">${this.escapeHtml(desc)}</p>
              
              <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                <button type="button" class="btn-submit-terracotta" style="padding: 10px 24px; font-size: 14px; font-weight: 800; border-radius: 8px; background: #C59B27; color: #141413;" onclick="ServicesPage.selectAndBook('${item.id}')">
                  📅 Đặt Lịch Dịch Vụ Này Ngay
                </button>
                <button type="button" class="btn-cancel" style="padding: 10px 20px; font-size: 13.5px;" onclick="UICommon.closeGlobalModal()">
                  Đóng
                </button>
              </div>
            </div>
          </div>

          <!-- Cac dich vu thanh phan trong Combo neu co -->
          ${comboServices.length > 0 ? `
            <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
              <h4 style="font-size: 13px; font-weight: 800; color: #C59B27; text-transform: uppercase; margin: 0 0 12px;">Các Dịch Vụ Bao Gồm Trong Combo</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                ${comboServices.map(s => `
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--text-primary);">
                    <span style="color: #10B981; font-weight: 800;">✓</span>
                    <span>${this.escapeHtml(s.name || s.TenDichVu || s)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- QUY TRINH THUC HIEN TIEU CHUAN -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="font-size: 11.5px; font-weight: 800; color: #C59B27; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
              QUY TRÌNH THỰC HIỆN TIÊU CHUẨN TẠI OMNI SALON
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--surface-elevated); border: 1px solid #C59B27; color: #C59B27; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">1</span>
                <div><strong>Bước 1:</strong> Tư vấn phom dáng mặt &amp; cấu trúc sợi tóc, lựa chọn kiểu tóc phù hợp phong cách.</div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--surface-elevated); border: 1px solid #C59B27; color: #C59B27; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">2</span>
                <div><strong>Bước 2:</strong> Gội xả thảo mộc &amp; massage bấm huyệt đả thông kinh lạc, làm sạch da đầu chuyên sâu.</div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--surface-elevated); border: 1px solid #C59B27; color: #C59B27; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">3</span>
                <div><strong>Bước 3:</strong> Cắt fade &amp; tỉa texture tạo tầng bồng bềnh bằng kéo thủ công Nhật Bản chuẩn từng milimet.</div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--surface-elevated); border: 1px solid #C59B27; color: #C59B27; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">4</span>
                <div><strong>Bước 4:</strong> Cạo viền sắc nét, chườm khăn nóng thảo mộc thư giãn cơ mặt và làm dịu chân tóc.</div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--surface-elevated); border: 1px solid #C59B27; color: #C59B27; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">5</span>
                <div><strong>Bước 5:</strong> Sấy tạo phom &amp; vuốt sáp / pomade cao cấp khóa form giữ nếp tự nhiên suốt ngày dài.</div>
              </div>
            </div>
          </div>

          <!-- MUC DANH GIA CUA KHACH HANG -->
          <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
              <div>
                <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px;">Đánh Giá Từ Khách Hàng</h3>
                <div style="font-size: 12.5px; color: var(--text-secondary);">Trải nghiệm thực tế của khách hàng khi sử dụng dịch vụ</div>
              </div>
              ${currentUser ? `
                <button type="button" class="btn-submit-terracotta" style="padding: 7px 16px; font-size: 12px; font-weight: 800; border-radius: 8px; background: #d97706;" onclick="ServicesPage.openWriteServiceReviewModal('${item.id}', '${this.escapeHtml(title)}')">
                  ⭐ Viết Đánh Giá
                </button>
              ` : `
                <button type="button" class="btn-submit-terracotta" style="padding: 7px 16px; font-size: 12px; font-weight: 800; border-radius: 8px; background: #d97706;" onclick="if(window.UICommon && typeof window.UICommon.openAuthModal === 'function') window.UICommon.openAuthModal('login');">
                  🔑 Đăng Nhập Để Đánh Giá
                </button>
              `}
            </div>

            <div id="serviceReviewsContainer">
              ${reviews.length === 0 ? `
                <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13.5px; border: 1px dashed var(--border-color); border-radius: 8px;">
                  Chưa có đánh giá nào cho dịch vụ này. Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận của bạn!
                </div>
              ` : `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  ${reviews.map(r => {
                    const author = r.customerName || r.TenKhachHang || r.author || 'Khách Hàng';
                    const star = Number(r.rating || r.SoSao || 5);
                    const comment = r.comment || r.NoiDung || 'Dịch vụ rất chất lượng, tay nghề thợ tuyệt vời!';
                    const dateStr = r.date ? (window.SalonUtils ? window.SalonUtils.formatDate(r.date) : r.date) : 'Gần đây';
                    return `
                      <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                          <strong style="font-size: 13.5px; color: var(--text-primary);">${this.escapeHtml(author)}</strong>
                          <span style="font-size: 12px; color: var(--text-secondary);">${dateStr}</span>
                        </div>
                        <div style="color: #F59E0B; font-size: 12.5px; margin-bottom: 4px;">${'★'.repeat(star)}${'☆'.repeat(5 - star)}</div>
                        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0;">${this.escapeHtml(comment)}</p>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          </div>

        </div>
      `;
    },

    // Mo popup viet danh gia cho dich vu
    openWriteServiceReviewModal(serviceId, serviceName) {
      const user = (window.CustomerWeb && typeof window.CustomerWeb.getCurrentUser === 'function') 
        ? window.CustomerWeb.getCurrentUser() 
        : null;
      if (!user) {
        if (window.UICommon) {
          window.UICommon.showToast('Quý khách vui lòng đăng nhập để gửi đánh giá dịch vụ!', 'warning');
          if (typeof window.UICommon.openAuthModal === 'function') {
            window.UICommon.openAuthModal('login');
          }
        }
        return;
      }

      const initialName = user.fullName || user.name || '';
      const promptComment = window.prompt(`Đánh giá dịch vụ "${serviceName}":\nNhập nội dung nhận xét của bạn:`, 'Dịch vụ rất chuyên nghiệp, tạo kiểu ưng ý!');
      if (promptComment && promptComment.trim().length >= 4) {
        this.submitServiceReview(serviceId, 5, promptComment.trim(), initialName);
      }
    },

    // Gui danh gia dich vu
    async submitServiceReview(serviceId, star = 5, comment = '', author = 'Khách Hàng') {
      const clean = String(serviceId).trim().toLowerCase();
      const newReview = {
        id: 'DG_DV_' + Date.now(),
        serviceId: serviceId,
        MaDichVu: serviceId,
        customerName: author,
        author: author,
        rating: star,
        SoSao: star,
        comment: comment,
        NoiDung: comment,
        date: new Date().toISOString()
      };

      if (!this._currentServiceReviews[clean]) {
        this._currentServiceReviews[clean] = [];
      }
      this._currentServiceReviews[clean].unshift(newReview);

      if (window.store && window.store.state) {
        if (!Array.isArray(window.store.state.reviews)) window.store.state.reviews = [];
        window.store.state.reviews.unshift(newReview);
        if (typeof window.store.saveState === 'function') window.store.saveState();
      }

      try {
        await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: serviceId,
            rating: star,
            comment: comment,
            customerName: author
          })
        }).catch(() => {});
      } catch (_) {}

      if (window.UICommon) {
        window.UICommon.showToast('Cảm ơn bạn! Đánh giá dịch vụ đã được gửi thành công.', 'success');
      }

      // Cap nhat lai noi dung modal
      this.openServiceDetailModal(serviceId);
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  window.ServicesPage = ServicesPage;

})(window);
