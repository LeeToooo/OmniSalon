// OmniSalon Customer Storefront UI & AI 3D Virtual Try-On Studio
// Chuẩn 100% Kiến Trúc Kỹ Thuật (CNTT-KLCN039 - Mục 2.2 & Mục 3)
// Bao gồm: Hero Constellation, Category Mosaics, AI Face Mesh Scanner, 3D Hairstyle Interactive Studio, 
// Booking Wizard Chống Trùng Lịch Đa Chi Nhánh, E-Invoice VietQR, Giỏ Hàng & Notifications

const UICustomer = {
  activeCategory: 'all',
  searchQuery: '',
  currentHeroSet: 0,
  
  // AI 3D WebGL Try-On State & Runtime Context
  aiState: {
    selectedFaceShape: 'Square',
    skinTone: 'Warm Undertone (Nam Tính)',
    selectedHairstyleId: 'hs-1',
    selectedColorHex: '#4a3728',
    selectedColorName: 'Nâu Tây Lạnh',
    beardStyle: 'stubble', // 'none' | 'stubble' | 'beard'
    lightingMode: 'studio', // 'studio' | 'sunset' | 'cyber' | 'daylight'
    windEnabled: false,
    hairVolume: 1.0,        // 0.85 to 1.25 scale
    hairGloss: 0.85,        // roughness/clearcoat
    rotationY: 0,
    rotationX: 0,
    targetRotationY: 0,
    targetRotationX: 0,
    zoomLevel: 1.0,
    targetZoomLevel: 1.0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    showLandmarks: false,
    isScanning: false,
    activePresetAngle: 'front'
  },
  threeApp: {
    scene: null,
    camera: null,
    renderer: null,
    mannequinGroup: null,
    headMesh: null,
    hairGroup: null,
    hairMaterial: null,
    beardGroup: null,
    beardMaterial: null,
    lights: {},
    pointsMesh: null,
    pointsLines: null,
    animFrameId: null,
    clock: null,
    strands: []
  },

  // Booking Wizard State
  bookingWizardData: {
    branchId: null,
    serviceId: null,
    serviceName: '',
    servicePrice: 0,
    stylistId: null,
    date: null,
    timeSlot: null,
    customerName: '',
    customerPhone: '',
    hairstyleChoice: '',
    hairColorChoice: '',
    promoCode: '',
    discount: 0
  },

  // =========================================================================
  // 1. HERO CONSTELLATION STAGE (Exact Match to Video Frame & Design Specs)
  // =========================================================================
  renderHeroConstellation(containerEl) {
    if (!containerEl) return;
    const services = window.store.getServices();
    const products = window.store.getProducts();

    containerEl.innerHTML = `
      <div class="hero-constellation-stage">
        <!-- Constellation Orbit Floating Cards -->
        <div class="orbit-constellation-row" id="heroOrbitRow">
          ${this.getHeroOrbitHtml()}
        </div>

        <!-- Centered Wordmark Title (OmniSalon) -->
        <h1 class="hero-wordmark-display" onclick="window.mainApp.navigateTo('services')" title="OmniSalon">
          omnisalon
        </h1>

        <!-- Centered Pill Search Bar -->
        <div class="hero-pill-search-container">
          <div class="hero-pill-search-bar">
            <input type="text" class="hero-pill-search-input" id="heroCenteredSearchInput" 
                   placeholder="Tìm dịch vụ cắt fade, uốn con sâu, cạo râu khăn nóng, sáp vuốt tóc..." 
                   value="${this.searchQuery}">
            <button class="hero-pill-search-submit" id="heroSearchBtn" title="Tìm kiếm">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Category Pill Chips Row with Solid Color Dots -->
        <div class="category-chips-orbit-row">
          <button class="shop-category-chip ${this.activeCategory === 'all' ? 'active' : ''}" onclick="UICustomer.handleCategoryClick('all', this)">
            <span class="chip-solid-dot" style="background: var(--color-shop-violet);"></span>
            Tất Cả
          </button>
          <button class="shop-category-chip ${this.activeCategory === 'cut' ? 'active' : ''}" onclick="UICustomer.handleCategoryClick('cut', this)">
            <span class="chip-solid-dot" style="background: #9fa5aa;"></span>
            Cắt & Fade Chuẩn Barber
          </button>
          <button class="shop-category-chip ${this.activeCategory === 'color' ? 'active' : ''}" onclick="UICustomer.handleCategoryClick('color', this)">
            <span class="chip-solid-dot" style="background: #cc2229;"></span>
            Nhuộm & Tẩy Phái Mạnh
          </button>
          <button class="shop-category-chip ${this.activeCategory === 'perm' ? 'active' : ''}" onclick="UICustomer.handleCategoryClick('perm', this)">
            <span class="chip-solid-dot" style="background: #008744;"></span>
            Uốn Con Sâu & Texture
          </button>
          <button class="shop-category-chip ${this.activeCategory === 'shave' ? 'active' : ''}" onclick="UICustomer.handleCategoryClick('shave', this)">
            <span class="chip-solid-dot" style="background: #3b82f6;"></span>
            Cạo Râu Khăn Nóng
          </button>
          <button class="shop-category-chip ${this.activeCategory === 'treatment' ? 'active' : ''}" onclick="UICustomer.handleCategoryClick('treatment', this)">
            <span class="chip-solid-dot" style="background: #e6a100;"></span>
            Trị Gàu & Dưỡng Sinh
          </button>
          <button class="shop-category-chip ${this.activeCategory === 'combo' ? 'active' : ''}" onclick="UICustomer.handleCategoryClick('combo', this)">
            <span class="chip-solid-dot" style="background: #845ec2;"></span>
            Combo Quý Ông VIP
          </button>
        </div>
      </div>
    `;

    // Search events
    const heroInput = document.getElementById('heroCenteredSearchInput');
    const heroBtn = document.getElementById('heroSearchBtn');
    if (heroInput) {
      heroInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        const topSearch = document.getElementById('topSearchInput');
        if (topSearch) topSearch.value = this.searchQuery;
        this.renderServicesGrid(document.getElementById('servicesGrid'));
      });
      heroInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchQuery = heroInput.value;
          this.renderServicesGrid(document.getElementById('servicesGrid'));
        }
      });
    }
    if (heroBtn && heroInput) {
      heroBtn.addEventListener('click', () => {
        this.searchQuery = heroInput.value;
        this.renderServicesGrid(document.getElementById('servicesGrid'));
      });
    }

    // Auto cycle constellation
    if (!this.heroTimerStarted) {
      this.heroTimerStarted = true;
      setInterval(() => {
        this.currentHeroSet = this.currentHeroSet === 0 ? 1 : 0;
        const orbitRow = document.getElementById('heroOrbitRow');
        if (orbitRow) {
          orbitRow.style.opacity = '0';
          orbitRow.style.transform = 'translateY(6px)';
          orbitRow.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          setTimeout(() => {
            orbitRow.innerHTML = this.getHeroOrbitHtml();
            orbitRow.style.opacity = '1';
            orbitRow.style.transform = 'translateY(0px)';
          }, 400);
        }
      }, 7000);
    }
  },

  getHeroOrbitHtml() {
    const services = window.store.getServices();
    const products = window.store.getProducts();

    if (this.currentHeroSet === 0) {
      return `
        <!-- Card 1: Kevin Murphy Rough Rider Wax -->
        <div class="orbit-card-spotlight" onclick="UICustomer.addToCart('${products[0]?.id || 'prod-1'}')" title="Kevin Murphy Rough Rider">
          <div class="orbit-img-wrap">
            <img class="orbit-img" src="${products[0]?.image || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=300&q=80'}" alt="Rough Rider">
          </div>
          <div class="orbit-brand-name">Kevin Murphy Clay</div>
          <div class="orbit-rating-caption">
            <span class="orbit-rating-stars">★★★★★</span> (4.9)
          </div>
        </div>

        <!-- Card 2: AI Try-On Feature Spotlight -->
        <div class="orbit-card-circle-brand" onclick="window.mainApp.navigateTo('aiConsultation')" title="Thử Tóc Nam & Râu 3D AI" style="background: linear-gradient(135deg, #1e1b4b, #5433eb);">
          <div style="color:white; text-align:center; padding: 10px;">
            <div style="font-size:22px;">🧔</div>
            <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.04em;">3D MEN STYLIST</div>
          </div>
        </div>

        <!-- Card 3: Pomade Reuzel Blue Water Soluble -->
        <div class="orbit-card-jar" onclick="UICustomer.addToCart('${products[1]?.id || 'prod-2'}')" title="Reuzel Blue Pomade">
          <img src="${products[1]?.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=250&q=80'}" alt="Reuzel Blue">
        </div>

        <!-- Card 4: Sáp Hanz de Fuko Claymation -->
        <div class="orbit-card-center-tall" onclick="UICustomer.addToCart('${products[2]?.id || 'prod-3'}')" title="Hanz de Fuko Claymation">
          <img src="${products[2]?.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80'}" alt="Hanz de Fuko">
        </div>

        <!-- Card 5: Cắt Fade Chuẩn Barber -->
        <div class="orbit-card-right-spotlight" onclick="UICustomer.openBookingWizard('${services[0]?.id || 'srv-1'}')" title="Cắt Fade Chuẩn Barber">
          <div class="orbit-img-wrap">
            <img class="orbit-img" src="${services[0]?.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80'}" alt="Skin Fade">
          </div>
          <div class="orbit-brand-name">Barber Skin Fade</div>
          <div class="orbit-rating-caption">
            <span class="orbit-rating-stars">★★★★★</span> (5.0)
          </div>
        </div>

        <!-- Card 6: Uốn Con Sâu Zic-Zac -->
        <div class="orbit-card-far-right" onclick="UICustomer.openBookingWizard('${services[2]?.id || 'srv-3'}')" title="Uốn Con Sâu Zic-Zac">
          <img src="${services[2]?.image || 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=200&q=80'}" alt="Uốn Con Sâu">
        </div>
      `;
    } else {
      return `
        <!-- Card 1: Combo Quý Ông VIP -->
        <div class="orbit-card-spotlight" onclick="UICustomer.openBookingWizard('cmb-1')" title="Combo Quý Ông VIP">
          <div class="orbit-img-wrap">
            <img class="orbit-img" src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80" alt="VIP Gentleman">
          </div>
          <div class="orbit-brand-name">Gentleman 7 Bước</div>
          <div class="orbit-rating-caption">
            <span class="orbit-rating-stars">★★★★★</span> (4.9)
          </div>
        </div>

        <!-- Card 2: Xịt Phồng By Vilain Sidekick -->
        <div class="orbit-card-jar" style="width:115px; height:115px;" onclick="UICustomer.addToCart('${products[4]?.id || 'prod-5'}')" title="By Vilain Sidekick">
          <img src="${products[4]?.image || 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=250&q=80'}" alt="By Vilain">
        </div>

        <!-- Card 3: Cạo Râu Khăn Nóng Proraso -->
        <div class="orbit-card-center-tall" style="width:160px; height:185px;" onclick="UICustomer.openBookingWizard('${services[3]?.id || 'srv-4'}')" title="Cạo Khăn Nóng Thảo Dược">
          <img src="${services[3]?.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=300&q=80'}" alt="Cạo Râu Khăn Nóng">
        </div>

        <!-- Card 4: AI 3D Barber Haircut Try-On -->
        <div class="orbit-card-jar" style="width:130px; height:130px; background:#0f172a; color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer;" onclick="window.mainApp.navigateTo('aiConsultation')">
          <div style="font-size:24px;">💈</div>
          <div style="font-size:10px; font-weight:800; margin-top:4px; letter-spacing:0.04em;">AI 3D TRY-ON</div>
        </div>

        <!-- Card 5: Nhuộm Tẩy Xám Khói Nam -->
        <div class="orbit-card-right-spotlight" onclick="UICustomer.openBookingWizard('${services[1]?.id || 'srv-2'}')" title="Nhuộm Tẩy Xám Khói">
          <div class="orbit-img-wrap">
            <img class="orbit-img" src="${services[1]?.image || 'https://images.unsplash.com/photo-1517832606589-7929c3922966?auto=format&fit=crop&w=300&q=80'}" alt="Nhuộm Xám Khói">
          </div>
          <div class="orbit-brand-name">Tẩy Khói Đẳng Cấp</div>
          <div class="orbit-rating-caption">
            <span class="orbit-rating-stars">★★★★★</span> (5.0)
          </div>
        </div>

        <!-- Card 6: Dầu Gội Trị Gàu Alpecin C1 -->
        <div class="orbit-card-far-right" onclick="UICustomer.addToCart('${products[5]?.id || 'prod-6'}')" title="Alpecin Caffeine C1">
          <img src="${products[5]?.image || 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=200&q=80'}" alt="Alpecin C1">
        </div>
      `;
    }
  },

  handleCategoryClick(catKey, btnEl) {
    this.activeCategory = catKey;
    document.querySelectorAll('.shop-category-chip').forEach(c => c.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const names = {
      all: 'Tất Cả',
      cut: 'Cắt & Fade Chuẩn Barber',
      color: 'Nhuộm & Tẩy Phái Mạnh',
      perm: 'Uốn Con Sâu & Texture',
      shave: 'Cạo Râu Khăn Nóng',
      treatment: 'Trị Gàu & Dưỡng Sinh',
      combo: 'Combo Quý Ông VIP'
    };
    window.mainApp.showToast(`💈 Đang hiển thị danh mục [${names[catKey] || catKey}]`);
    this.renderServicesGrid(document.getElementById('servicesGrid'));
  },

  // =========================================================================
  // 2. CATEGORY MOSAICS SECTION (2x2 Quad Tiles from Video)
  // =========================================================================
  renderCategoryMosaics(containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = `
      <div class="mosaics-rail-section">
        <div class="mosaics-grid-container" id="mosaicsGridContainer">
          
          <!-- Column 1: Cắt & Fade Chuẩn Barber -->
          <div class="mosaic-column">
            <div class="mosaic-column-title" onclick="UICustomer.handleCategoryClick('cut')">
              <span>Cắt & Fade Chuẩn Barber</span>
              <span style="font-size:16px;">›</span>
            </div>
            <div class="mosaic-2x2-card" onclick="UICustomer.handleCategoryClick('cut')">
              <div class="mosaic-quad-tile" style="background:#1e293b;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80" alt="Pompadour">
                <span class="mosaic-quad-label">Pompadour</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#334155;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80" alt="Side Part 7/3">
                <span class="mosaic-quad-label">Side Part 7/3</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#475569;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1517832606589-7929c3922966?auto=format&fit=crop&w=300&q=80" alt="French Crop">
                <span class="mosaic-quad-label">French Crop</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#0f172a;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=300&q=80" alt="Mohican Sport">
                <span class="mosaic-quad-label">Mohican Fade</span>
              </div>
            </div>
          </div>

          <!-- Column 2: Uốn Định Hình & Texture Nam -->
          <div class="mosaic-column">
            <div class="mosaic-column-title" onclick="UICustomer.handleCategoryClick('perm')">
              <span>Uốn Texture & Định Hình Nam</span>
              <span style="font-size:16px;">›</span>
            </div>
            <div class="mosaic-2x2-card" onclick="UICustomer.handleCategoryClick('perm')">
              <div class="mosaic-quad-tile" style="background:#262626;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80" alt="Uốn Con Sâu">
                <span class="mosaic-quad-label">Uốn Con Sâu</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#3b3b3b;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80" alt="Phồng Chân Tóc">
                <span class="mosaic-quad-label">Phồng Root-Lift</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#171717;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1517832606589-7929c3922966?auto=format&fit=crop&w=300&q=80" alt="Premlock">
                <span class="mosaic-quad-label">Premlock Độc</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#404040;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=300&q=80" alt="Mullet Layer">
                <span class="mosaic-quad-label">Mullet Layer</span>
              </div>
            </div>
          </div>

          <!-- Column 3: Gói Combo Quý Ông VIP -->
          <div class="mosaic-column">
            <div class="mosaic-column-title" onclick="UICustomer.handleCategoryClick('combo')">
              <span>Gói Combo Quý Ông VIP</span>
              <span style="font-size:16px;">›</span>
            </div>
            <div class="mosaic-2x2-card" onclick="UICustomer.handleCategoryClick('combo')">
              <div class="mosaic-quad-tile" style="background:#1b1b1b;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80" alt="VIP Gentleman">
                <span class="mosaic-quad-label">Gentleman 7B</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#2e1065;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=300&q=80" alt="Đế Vương">
                <span class="mosaic-quad-label">Đế Vương VIP</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#312e81;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1517832606589-7929c3922966?auto=format&fit=crop&w=300&q=80" alt="Makeover">
                <span class="mosaic-quad-label">Lột Xác 360°</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#14532d;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80" alt="Cạo Khăn Nóng">
                <span class="mosaic-quad-label">Cạo Khăn Nóng</span>
              </div>
            </div>
          </div>

          <!-- Column 4: Mỹ Phẩm Men's Grooming Chính Hãng -->
          <div class="mosaic-column">
            <div class="mosaic-column-title" onclick="window.mainApp.navigateTo('products')">
              <span>Mỹ Phẩm Men's Grooming</span>
              <span style="font-size:16px;">›</span>
            </div>
            <div class="mosaic-2x2-card" onclick="window.mainApp.navigateTo('products')">
              <div class="mosaic-quad-tile" style="background:#422006;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=300&q=80" alt="Kevin Murphy">
                <span class="mosaic-quad-label">Kevin Murphy</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#1e3a8a;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80" alt="Reuzel Blue">
                <span class="mosaic-quad-label">Reuzel Pomade</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#374151;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80" alt="Hanz de Fuko">
                <span class="mosaic-quad-label">Hanz de Fuko</span>
              </div>
              <div class="mosaic-quad-tile" style="background:#0284c7;">
                <img class="mosaic-quad-img" src="https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=300&q=80" alt="By Vilain">
                <span class="mosaic-quad-label">By Vilain Pre</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Carousel Arrow Button -->
        <button class="mosaics-carousel-arrow" onclick="document.getElementById('mosaicsGridContainer').scrollBy({left: 300, behavior: 'smooth'})" title="Xem tiếp">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    `;
  },

  // =========================================================================
  // 3. HAIR MODELS SHOWCASE SECTION
  // =========================================================================
  renderHairModels(containerEl) {
    if (!containerEl) return;
    const hairstyles = window.store.getHairstyles();

    containerEl.innerHTML = hairstyles.map(hs => `
      <div class="hair-model-card" onclick="UICustomer.selectAndTryHairstyle('${hs.id}')">
        <img class="hair-model-img" src="${hs.image}" alt="${hs.title}">
        <div class="hair-model-overlay">
          <div style="font-size:11px; font-weight:700; color: #a78bfa; margin-bottom: 2px;">
            ✨ ${hs.baseMatchScore}% Match (${hs.matchFaceShapes.join(', ')})
          </div>
          <div class="hair-model-name">${hs.title}</div>
          <div class="hair-model-tags">${hs.gender} · ${hs.styleCategory} · Thử 3D →</div>
        </div>
      </div>
    `).join('');
  },

  selectAndTryHairstyle(hairstyleId) {
    this.aiState.selectedHairstyleId = hairstyleId;
    window.mainApp.navigateTo('aiConsultation');
    window.mainApp.showToast(`✨ Đã mở kiểu tóc [${hairstyleId}] trong phòng thử 3D!`);
  },

  // =========================================================================
  // 4. SERVICES & COMBOS GRID SECTION
  // =========================================================================
  renderServicesGrid(containerEl) {
    if (!containerEl) return;
    const services = window.store.getServices();
    const combos = window.store.getCombos();
    const favorites = window.store.getFavorites();

    let list = [...services, ...combos];

    if (this.activeCategory !== 'all') {
      list = list.filter(item => item.category === this.activeCategory);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      );
    }

    if (list.length === 0) {
      containerEl.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--color-muted-gray);">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <p>Không tìm thấy dịch vụ phù hợp với từ khóa "${this.searchQuery}"</p>
        </div>
      `;
      return;
    }

    containerEl.innerHTML = list.map(item => {
      const isFav = favorites.includes(item.id);
      const isCombo = item.type === 'combo';

      return `
        <div class="elevated-card">
          <div class="card-img-wrapper">
            <img class="card-img" src="${item.image}" alt="${item.name}">
            ${isCombo ? '<span class="card-badge card-badge-violet">COMBO VIP TRỌN GÓI</span>' : ''}
            <button class="card-fav-btn" onclick="UICustomer.toggleFav('${item.id}', event)" title="Yêu thích">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>
          <div class="card-content">
            <div class="card-category">
              ${item.duration} Phút · ${item.rating} ★ (${item.reviewsCount} đánh giá)
            </div>
            <h3 class="card-title">${item.name}</h3>
            <p class="card-description">${item.description}</p>
            
            ${isCombo && item.steps ? `
              <div style="margin: 10px 0; font-size: 12px; color: var(--color-slate-ink); background: var(--color-canvas-mist); padding: 8px 12px; border-radius: 12px;">
                <strong>Gồm 4 bước:</strong> ${item.steps.join(' → ')}
              </div>
            ` : ''}

            <div class="card-meta-row">
              <div class="card-price">
                ${item.price.toLocaleString('vi-VN')}đ
                ${item.oldPrice ? `<span class="old-price">${item.oldPrice.toLocaleString('vi-VN')}đ</span>` : ''}
              </div>
              <button class="pill-btn" onclick="UICustomer.openBookingWizard('${item.id}')">
                Đặt Lịch Ngay
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  toggleFav(id, event) {
    if (event) event.stopPropagation();
    window.store.toggleFavorite(id);
    const isFav = window.store.getFavorites().includes(id);
    window.mainApp.showToast(isFav ? '❤️ Đã thêm vào mục Yêu thích!' : '🤍 Đã bỏ khỏi mục Yêu thích');
    this.renderServicesGrid(document.getElementById('servicesGrid'));
  },

  // =========================================================================
  // 5. PRODUCTS STORE GRID WITH BRANCH STOCK STATUS
  // =========================================================================
  renderProductsGrid(containerEl) {
    if (!containerEl) return;
    const products = window.store.getProducts();
    const currentBranch = window.store.getCurrentBranch();
    const favorites = window.store.getFavorites();

    containerEl.innerHTML = products.map(prod => {
      const isFav = favorites.includes(prod.id);
      const stock = window.store.getBranchStock(prod.id, currentBranch?.id);

      return `
        <div class="elevated-card">
          <div class="card-img-wrapper">
            <img class="card-img" src="${prod.image}" alt="${prod.name}">
            <span class="card-badge" style="background: ${stock <= 5 ? '#fee2e2' : '#dcfce7'}; color: ${stock <= 5 ? '#991b1b' : '#166534'};">
              ${stock <= 5 ? `⚠️ Sắp hết (Còn ${stock})` : `✓ Còn ${stock} tại ${currentBranch?.name.split('—')[1] || 'chi nhánh'}`}
            </span>
            <button class="card-fav-btn" onclick="UICustomer.toggleFav('${prod.id}', event)" title="Yêu thích">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>
          <div class="card-content">
            <div class="card-category">${prod.brand} · ${prod.category} · ${prod.rating} ★</div>
            <h3 class="card-title">${prod.name}</h3>
            <p class="card-description">${prod.description}</p>
            <div class="card-meta-row">
              <div class="card-price">
                ${prod.price.toLocaleString('vi-VN')}đ
                ${prod.oldPrice ? `<span class="old-price">${prod.oldPrice.toLocaleString('vi-VN')}đ</span>` : ''}
              </div>
              <button class="pill-btn pill-btn-secondary" onclick="UICustomer.addToCart('${prod.id}')" ${stock <= 0 ? 'disabled' : ''}>
                ${stock <= 0 ? 'Hết Hàng' : '+ Giỏ Hàng'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // =========================================================================
  // 6. FLAGSHIP FEATURE: TƯ VẤN KIỂU TÓC AI + PHÒNG THỬ TÓC 3D/AR THREE.JS (MỤC 3)
  // =========================================================================
  renderAIConsultationView(containerEl) {
    if (!containerEl) return;
    const hairstyles = window.store.getHairstyles();
    const currentStyle = hairstyles.find(h => h.id === this.aiState.selectedHairstyleId) || hairstyles[0];

    // Clean up any previous Three.js animation frame and renderer
    if (this.threeApp) {
      if (this.threeApp.animFrameId) {
        cancelAnimationFrame(this.threeApp.animFrameId);
        this.threeApp.animFrameId = null;
      }
      if (this.threeApp.renderer) {
        try {
          this.threeApp.renderer.dispose();
        } catch (e) {}
        this.threeApp.renderer = null;
      }
    }

    containerEl.innerHTML = `
      <!-- AI Hairstyle Studio Title Banner -->
      <div class="catalog-section-header" style="margin-top: 8px;">
        <div>
          <div style="font-size: 12px; font-weight: 700; color: var(--color-shop-violet); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            💈 Studio Độc Quyền Phái Mạnh (Mục 3 Kiến Trúc Kỹ Thuật)
          </div>
          <h2 class="catalog-section-title">Phòng Thử Tóc & Râu Nam 3D/AR Siêu Thực (Three.js WebGL)</h2>
          <div style="font-size: 13px; color: var(--color-muted-gray); margin-top: 4px;">
            Dựng hình 7 kiểu tóc nam thời thượng, phối râu quai nón/stubble nam tính, kiểm tra tỷ lệ xương hàm phái mạnh và ánh sáng Studio 3-Point.
          </div>
        </div>
      </div>

      <!-- Studio 2-Column Split Workspace -->
      <div class="ai-studio-workspace">
        
        <!-- Left Column: Interactive 3D WebGL Hairstyle Stage -->
        <div class="ai-3d-stage-card">
          <div class="ai-stage-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="status-pill status-confirmed">BARBER 3D WEBGL ACTIVE</span>
              <span style="font-size:12px; color:var(--color-muted-gray);">Xoay chuột / Vuốt để quay 360° · Lăn chuột để Zoom</span>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="pill-btn pill-btn-secondary" style="font-size:11px; padding:4px 10px;" onclick="UICustomer.reset3DView()">
                Góc Nhìn Chuẩn
              </button>
            </div>
          </div>

          <!-- 3D Canvas Viewport Container -->
          <div class="ai-canvas-wrapper" id="aiCanvasWrapper">
            <canvas id="hair3DCanvas" class="hair-3d-canvas"></canvas>
            
            <!-- Laser Scan Line Simulation Overlay -->
            <div class="ai-laser-scan-line ${this.aiState.isScanning ? 'scanning' : ''}" id="aiScanLine"></div>

            <!-- Top HUD: Camera Angle Presets & Studio Lighting Selector -->
            <div class="ai-studio-hud-top">
              <!-- Camera Angle Presets -->
              <div class="hud-glass-group">
                <button class="hud-icon-btn ${this.aiState.activePresetAngle === 'front' ? 'active' : ''}" onclick="UICustomer.setPresetAngle('front')" title="Góc Chính Diện">
                  🎯 Chính Diện
                </button>
                <button class="hud-icon-btn ${this.aiState.activePresetAngle === 'angle45' ? 'active' : ''}" onclick="UICustomer.setPresetAngle('angle45')" title="Góc Nghiêng 45°">
                  📐 Nghiêng 45°
                </button>
                <button class="hud-icon-btn ${this.aiState.activePresetAngle === 'side' ? 'active' : ''}" onclick="UICustomer.setPresetAngle('side')" title="Góc Ngang 90°">
                  👤 Góc Ngang
                </button>
                <button class="hud-icon-btn ${this.aiState.activePresetAngle === 'top' ? 'active' : ''}" onclick="UICustomer.setPresetAngle('top')" title="Đỉnh Đầu">
                  🔝 Đỉnh Đầu
                </button>
              </div>

              <!-- Studio Lighting Presets -->
              <div class="hud-glass-group">
                <button class="hud-icon-btn ${this.aiState.lightingMode === 'studio' ? 'active' : ''}" onclick="UICustomer.setStudioLighting('studio')" title="Studio Ring Light 4500K">
                  🌟 Studio
                </button>
                <button class="hud-icon-btn ${this.aiState.lightingMode === 'sunset' ? 'active' : ''}" onclick="UICustomer.setStudioLighting('sunset')" title="Hoàng Hôn Golden Hour">
                  🌆 Hoàng Hôn
                </button>
                <button class="hud-icon-btn ${this.aiState.lightingMode === 'cyber' ? 'active' : ''}" onclick="UICustomer.setStudioLighting('cyber')" title="Neon Cyberpunk Violet">
                  💜 Cyber
                </button>
                <button class="hud-icon-btn ${this.aiState.lightingMode === 'daylight' ? 'active' : ''}" onclick="UICustomer.setStudioLighting('daylight')" title="Ánh Sáng Tự Nhiên 6500K">
                  ☀️ Ban Ngày
                </button>
              </div>
            </div>

            <!-- Bottom HUD: Active Style Badge, Beard Switcher & Interactive Toggles -->
            <div class="ai-studio-hud-bottom">
              <!-- Active Style Badge -->
              <div class="ai-floating-style-badge">
                <div style="font-weight: 800; font-size: 14px; letter-spacing: -0.01em;">${currentStyle.title}</div>
                <div style="font-size: 11px; color: #a5b4fc; display: flex; align-items: center; gap: 6px;">
                  <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${this.aiState.selectedColorHex}; border:1px solid rgba(255,255,255,0.4);"></span>
                  <span id="activeColorLabel">${this.aiState.selectedColorName}</span> · PBR Hair Sheen
                </div>
              </div>

              <!-- Beard / Stubble Modifier Group -->
              <div class="hud-glass-group">
                <span style="font-size:11px; font-weight:800; color:rgba(255,255,255,0.9); padding:0 4px;">🧔 RÂU:</span>
                <button class="hud-icon-btn ${this.aiState.beardStyle === 'none' ? 'active' : ''}" onclick="UICustomer.setBeardStyle('none')" title="Cạo sạch nhẵn nhụi">
                  Cạo Sạch
                </button>
                <button class="hud-icon-btn ${this.aiState.beardStyle === 'stubble' ? 'active' : ''}" onclick="UICustomer.setBeardStyle('stubble')" title="Râu lún phún nam tính (Stubble)">
                  Lún Phún
                </button>
                <button class="hud-icon-btn ${this.aiState.beardStyle === 'beard' ? 'active' : ''}" onclick="UICustomer.setBeardStyle('beard')" title="Râu quai nón quý ông (Full Beard)">
                  Quai Nón
                </button>
              </div>

              <!-- Interactive Toggles -->
              <div class="hud-glass-group">
                <button class="hud-icon-btn ${this.aiState.windEnabled ? 'active' : ''}" onclick="UICustomer.toggleWind()" title="Mô phỏng tóc bay theo gió">
                  🍃 Gió: ${this.aiState.windEnabled ? 'BẬT' : 'TẮT'}
                </button>
                <button class="hud-icon-btn ${this.aiState.showLandmarks ? 'active' : ''}" onclick="UICustomer.toggleLandmarks()" title="Hiện 468 điểm mốc AR Hologram">
                  ✨ AR Mesh
                </button>
                <button class="hud-icon-btn" onclick="UICustomer.captureHDSnapshot()" title="Chụp ảnh kết quả thử tóc độ phân giải cao">
                  📸 Chụp HD
                </button>
              </div>
            </div>
          </div>

          <!-- Real-Time Hair Color Dye Palette Swatches -->
          <div class="ai-color-palette-bar">
            <div>
              <span style="font-size:12px; font-weight:700; color:var(--color-slate-ink);">Bảng Màu Nhuộm Cao Cấp:</span>
              <span style="font-size:11px; color:var(--color-muted-gray); margin-left:6px;">(Đổi màu nhuộm và phản xạ ánh sáng lập tức)</span>
            </div>
            <div class="color-swatches-row">
              ${(currentStyle.suitableColors || []).map(col => `
                <button class="color-swatch-btn ${col.hex === this.aiState.selectedColorHex ? 'selected' : ''}"
                        style="background: ${col.hex};"
                        title="${col.name}"
                        onclick="UICustomer.selectDyeColor('${col.hex}', '${col.name}')">
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Sliders Deck: Hair Volume & Gloss Level -->
          <div class="ai-controls-deck">
            <div class="ai-slider-item">
              <div class="ai-slider-item-header">
                <span>ĐỘ PHỒNG TÓC (VOLUME)</span>
                <span id="volumeValueLabel">${Math.round(this.aiState.hairVolume * 100)}%</span>
              </div>
              <input type="range" class="ai-range-input" min="0.85" max="1.25" step="0.01" value="${this.aiState.hairVolume}" oninput="UICustomer.updateHairVolume(this.value)">
            </div>
            <div class="ai-slider-item">
              <div class="ai-slider-item-header">
                <span>ĐỘ BÓNG MƯỢT (GLOSS / KERATIN)</span>
                <span id="glossValueLabel">${Math.round(this.aiState.hairGloss * 100)}%</span>
              </div>
              <input type="range" class="ai-range-input" min="0.2" max="1.0" step="0.02" value="${this.aiState.hairGloss}" oninput="UICustomer.updateHairGloss(this.value)">
            </div>
          </div>
        </div>

        <!-- Right Column: AI Analysis & Face Shape Diagnostic -->
        <div class="ai-analysis-sidebar">
          
          <!-- Scan & Face Mode Options -->
          <div class="elevated-card" style="padding: 18px; margin-bottom: 16px;">
            <div style="font-size:13px; font-weight:700; margin-bottom:10px;">Phương Thức Quét Khuôn Mặt:</div>
            <div style="display:flex; gap:8px; margin-bottom:12px;">
              <button class="pill-btn" style="flex:1; justify-content:center; font-size:12px; padding:8px 10px;" onclick="UICustomer.triggerAIScan()">
                📸 Quét Camera AI
              </button>
              <label class="pill-btn pill-btn-secondary" style="flex:1; justify-content:center; font-size:12px; padding:8px 10px; cursor:pointer;">
                📁 Tải Ảnh Chân Dung
                <input type="file" accept="image/*" style="display:none;" onchange="UICustomer.handlePhotoUpload(event)">
              </label>
            </div>

            <div style="font-size:12px; color:var(--color-muted-gray); margin-bottom:8px;">Hoặc thử nhanh với dáng khuôn mặt mẫu:</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              ${['Oval', 'Round', 'Square', 'Heart', 'Diamond'].map(shape => `
                <button class="shop-category-chip ${shape === this.aiState.selectedFaceShape ? 'active' : ''}" 
                        style="font-size:11px; padding:4px 10px;"
                        onclick="UICustomer.selectFaceShape('${shape}')">
                  ${shape}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- AI Diagnostic Results Card -->
          <div class="elevated-card" style="padding: 18px; margin-bottom: 16px; border-left: 4px solid var(--color-shop-violet);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
              <div>
                <div style="font-size:11px; font-weight:700; color:var(--color-shop-violet); text-transform:uppercase;">Kết Quả Phân Tích Tỷ Lệ Vàng</div>
                <h3 style="font-size:18px; font-weight:800; margin-top:2px;">Khuôn Mặt: ${this.aiState.selectedFaceShape}</h3>
              </div>
              <span class="status-pill status-confirmed" style="font-size:12px;">98% Tương Thích</span>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px; margin-bottom:12px;">
              <div style="background:var(--color-canvas-mist); padding:8px 12px; border-radius:10px;">
                <span style="color:var(--color-muted-gray);">Tông Da Nhận Diện:</span>
                <div style="font-weight:700; margin-top:2px;">${this.aiState.skinTone}</div>
              </div>
              <div style="background:var(--color-canvas-mist); padding:8px 12px; border-radius:10px;">
                <span style="color:var(--color-muted-gray);">Tỷ Lệ Trán / Cằm:</span>
                <div style="font-weight:700; margin-top:2px;">1 : 1.05 (Chuẩn Vàng)</div>
              </div>
            </div>

            <p style="font-size:13px; color:var(--color-slate-ink); line-height:1.5;">
              ${this.getStylistAdvice(this.aiState.selectedFaceShape)}
            </p>
          </div>

          <!-- Recommended Hairstyles Pick List -->
          <div class="elevated-card" style="padding: 18px; margin-bottom: 16px;">
            <div style="font-size:13px; font-weight:700; margin-bottom:12px;">
              Thư Viện Kiểu Tóc Phù Hợp Nhất:
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${hairstyles.map(hs => {
                const isSelected = hs.id === this.aiState.selectedHairstyleId;
                const matchScore = hs.matchFaceShapes.includes(this.aiState.selectedFaceShape) ? hs.baseMatchScore : Math.max(70, hs.baseMatchScore - 18);
                return `
                  <div class="ai-rec-style-item ${isSelected ? 'active' : ''}" onclick="UICustomer.selectAndTryHairstyle('${hs.id}')">
                    <img src="${hs.image}" style="width:52px; height:52px; border-radius:12px; object-fit:cover;">
                    <div style="flex:1;">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:14px; font-weight:700;">${hs.title}</span>
                        <span style="font-size:11px; font-weight:800; color:var(--color-shop-violet);">${matchScore}% Match</span>
                      </div>
                      <div style="font-size:12px; color:var(--color-muted-gray); margin-top:2px;">${hs.gender} · ${hs.styleCategory} · 3D Mesh</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Bottom Actions: Save Consultation & Book Appointment Directly -->
          <div style="display:flex; gap:10px;">
            <button class="pill-btn pill-btn-secondary" style="flex:1; justify-content:center; font-size:13px;" onclick="UICustomer.saveAIConsultationHistory()">
              💾 Lưu Kết Quả
            </button>
            <button class="pill-btn" style="flex:2; justify-content:center; font-size:13px;" onclick="UICustomer.bookWithCurrentAIHairstyle()">
              📅 Đặt Lịch Với Kiểu Này &rarr;
            </button>
          </div>

        </div>
      </div>
    `;

    // Initialize the Three.js 3D WebGL Studio
    setTimeout(() => {
      this.init3DStudio();
    }, 60);
  },

  getStylistAdvice(faceShape) {
    const adviceMap = {
      Oval: 'Khuôn mặt trái xoan tỷ lệ vàng lý tưởng. Bạn hợp với hầu hết mọi kiểu tóc nam như Modern Pompadour, Side Part 7/3 rủ Hàn Quốc hoặc Textured Crop. Kết hợp thêm râu stubble lún phún sẽ tăng tối đa vẻ phong trần.',
      Round: 'Khuôn mặt tròn nên ưu tiên các kiểu tóc có độ phồng cao ở đỉnh (Pompadour hoặc Mohican Fade Sport) kết hợp cạo sát hai bên thái dương (High Skin Fade) và để râu dê/quai nón góc cạnh để tạo hiệu ứng thon dài khuôn mặt.',
      Square: 'Khuôn mặt vuông chữ điền với góc xương hàm nam tính cực mạnh mẽ. Rất hoàn hảo với kiểu Side Part cổ điển, French Crop sắc nét hoặc Buzz Cut quân đội. Râu quai nón tỉa fade ôm sát đường quai hàm sẽ tôn trọn nét nam tính.',
      Heart: 'Khuôn mặt tam giác/trái tim có trán rộng và cằm nhọn. Kiểu tóc Mullet Layer vuốt nhẹ hoặc Side Part rủ 7/3 sẽ cân bằng phần trán. Khuyên dùng râu quai nón dày phần cằm để tạo độ đầy đặn cho vùng cằm dưới.',
      Diamond: 'Khuôn mặt kim cương có gò má góc cạnh và trán hẹp. Kiểu uốn con sâu Zic-Zac bồng bềnh hoặc tóc Side Part rủ phồng chân tóc kết hợp râu lún phún stubble 5 o\'clock sẽ tôn lên đường nét lãng tử chuẩn sao điện ảnh.'
    };
    return adviceMap[faceShape] || 'Khuôn mặt nam tính, phù hợp các kiểu tóc Fade hiện đại kết hợp râu quai nón tỉa laser sắc sảo.';
  },

  selectFaceShape(shape) {
    this.aiState.selectedFaceShape = shape;
    // Update chip buttons
    document.querySelectorAll('.shop-category-chip').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim() === shape);
    });

    // Morph the 3D head geometry dynamically
    this.morph3DFaceShape(shape);
    window.mainApp.showToast(`✨ Đã phân tích theo khuôn mặt [${shape}]`);
  },

  selectAndTryHairstyle(styleId) {
    this.aiState.selectedHairstyleId = styleId;
    const hairstyles = window.store.getHairstyles();
    const style = hairstyles.find(h => h.id === styleId);
    if (style && style.suitableColors && style.suitableColors.length > 0) {
      this.aiState.selectedColorHex = style.suitableColors[0].hex;
      this.aiState.selectedColorName = style.suitableColors[0].name;
    }

    if (this.threeApp.hairGroup) {
      this.build3DHairstyle(styleId, this.aiState.selectedColorHex);
      
      // Update UI active styling
      document.querySelectorAll('.ai-rec-style-item').forEach(item => {
        const onclickAttr = item.getAttribute('onclick') || '';
        item.classList.toggle('active', onclickAttr.includes(`'${styleId}'`));
      });
      
      // Update HUD floating badge
      const badgeTitle = document.querySelector('.ai-floating-style-badge > div:first-child');
      if (badgeTitle && style) badgeTitle.textContent = style.title;
      const activeColorLabel = document.getElementById('activeColorLabel');
      if (activeColorLabel) activeColorLabel.textContent = this.aiState.selectedColorName;
      
      // Update color palette swatches
      const paletteContainer = document.querySelector('.color-swatches-row');
      if (paletteContainer && style && style.suitableColors) {
        paletteContainer.innerHTML = style.suitableColors.map(col => `
          <button class="color-swatch-btn ${col.hex === this.aiState.selectedColorHex ? 'selected' : ''}"
                  style="background: ${col.hex};"
                  title="${col.name}"
                  onclick="UICustomer.selectDyeColor('${col.hex}', '${col.name}')">
          </button>
        `).join('');
      }
    } else {
      this.renderAIConsultationView(document.getElementById('aiConsultationView'));
    }
    window.mainApp.showToast(`💈 Đã áp dụng kiểu tóc: ${style ? style.title : styleId}`);
  },

  setBeardStyle(style) {
    this.aiState.beardStyle = style;
    
    // Update active HUD buttons
    const hudButtons = document.querySelectorAll('.hud-glass-group .hud-icon-btn');
    hudButtons.forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      if (onclickAttr.includes('setBeardStyle')) {
        btn.classList.toggle('active', onclickAttr.includes(`'${style}'`));
      }
    });

    this.build3DBeard();

    const labels = {
      none: 'Cạo sạch nhẵn nhụi',
      stubble: 'Râu lún phún nam tính (5 O\'Clock Shadow)',
      beard: 'Râu quai nón quý ông Barbershop'
    };
    window.mainApp.showToast(`🧔 Đã đổi kiểu râu: ${labels[style] || style}`);
  },

  selectDyeColor(hex, name) {
    this.aiState.selectedColorHex = hex;
    this.aiState.selectedColorName = name;
    
    // Update color swatches visual
    document.querySelectorAll('.color-swatch-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('title') === name);
    });
    
    const label = document.getElementById('activeColorLabel');
    if (label) label.textContent = name;

    this.update3DHairMaterial();
    window.mainApp.showToast(`🎨 Đã thử màu nhuộm: ${name}`);
  },

  setPresetAngle(angleKey) {
    this.aiState.activePresetAngle = angleKey;
    document.querySelectorAll('.hud-glass-group .hud-icon-btn').forEach(btn => {
      if (btn.getAttribute('title') && btn.getAttribute('title').includes(angleKey)) {
        btn.classList.add('active');
      }
    });

    if (angleKey === 'front') {
      this.aiState.targetRotationY = 0;
      this.aiState.targetRotationX = 0;
      this.aiState.targetZoomLevel = 1.0;
    } else if (angleKey === 'angle45') {
      this.aiState.targetRotationY = 0.75;
      this.aiState.targetRotationX = 0.05;
      this.aiState.targetZoomLevel = 1.0;
    } else if (angleKey === 'side') {
      this.aiState.targetRotationY = 1.57;
      this.aiState.targetRotationX = 0;
      this.aiState.targetZoomLevel = 1.05;
    } else if (angleKey === 'top') {
      this.aiState.targetRotationY = 0;
      this.aiState.targetRotationX = 0.65;
      this.aiState.targetZoomLevel = 1.15;
    }
  },

  reset3DView() {
    this.setPresetAngle('front');
  },

  setStudioLighting(mode) {
    this.aiState.lightingMode = mode;
    this.update3DStudioLighting(mode);

    // Update active HUD buttons
    const hudButtons = document.querySelectorAll('.hud-glass-group .hud-icon-btn');
    hudButtons.forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      if (onclickAttr.includes('setStudioLighting')) {
        btn.classList.toggle('active', onclickAttr.includes(`'${mode}'`));
      }
    });

    const modeLabels = {
      studio: 'Studio Ring Light 4500K',
      sunset: 'Hoàng Hôn Golden Hour',
      cyber: 'Cyberpunk Violet Neon',
      daylight: 'Ánh Sáng Tự Nhiên 6500K'
    };
    window.mainApp.showToast(`💡 Chuyển chế độ ánh sáng: ${modeLabels[mode] || mode}`);
  },

  toggleWind() {
    this.aiState.windEnabled = !this.aiState.windEnabled;
    const hudButtons = document.querySelectorAll('.hud-glass-group .hud-icon-btn');
    hudButtons.forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      if (onclickAttr.includes('toggleWind')) {
        btn.classList.toggle('active', this.aiState.windEnabled);
        btn.innerHTML = `🍃 Gió Thổi: ${this.aiState.windEnabled ? 'BẬT' : 'TẮT'}`;
      }
    });
    window.mainApp.showToast(this.aiState.windEnabled ? '🍃 Đã bật mô phỏng tóc bay theo gió' : '🍃 Đã tắt hiệu ứng gió');
  },

  toggleLandmarks() {
    this.aiState.showLandmarks = !this.aiState.showLandmarks;
    if (this.threeApp.pointsMesh) {
      this.threeApp.pointsMesh.visible = this.aiState.showLandmarks;
    }
    if (this.threeApp.pointsLines) {
      this.threeApp.pointsLines.visible = this.aiState.showLandmarks;
    }
    const hudButtons = document.querySelectorAll('.hud-glass-group .hud-icon-btn');
    hudButtons.forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      if (onclickAttr.includes('toggleLandmarks')) {
        btn.classList.toggle('active', this.aiState.showLandmarks);
      }
    });
    window.mainApp.showToast(this.aiState.showLandmarks ? '✨ Đã bật lưới 468 điểm mốc AR' : '✨ Đã ẩn lưới AR');
  },

  updateHairVolume(vol) {
    const volume = parseFloat(vol);
    this.aiState.hairVolume = volume;
    const label = document.getElementById('volumeValueLabel');
    if (label) label.textContent = `${Math.round(volume * 100)}%`;

    if (this.threeApp.hairGroup) {
      this.threeApp.hairGroup.scale.set(volume, volume, volume);
    }
  },

  updateHairGloss(glossVal) {
    const gloss = parseFloat(glossVal);
    this.aiState.hairGloss = gloss;
    const label = document.getElementById('glossValueLabel');
    if (label) label.textContent = `${Math.round(gloss * 100)}%`;

    if (this.threeApp.hairMaterial) {
      this.threeApp.hairMaterial.roughness = Math.max(0.12, 0.65 - gloss * 0.45);
      this.threeApp.hairMaterial.clearcoat = gloss;
      this.threeApp.hairMaterial.clearcoatRoughness = Math.max(0.08, 0.4 - gloss * 0.3);
      this.threeApp.hairMaterial.needsUpdate = true;
    }
  },

  captureHDSnapshot() {
    if (!this.threeApp.renderer) return;
    try {
      // Force render 1 frame to ensure buffer has current pixels
      this.threeApp.renderer.render(this.threeApp.scene, this.threeApp.camera);
      const dataUrl = this.threeApp.renderer.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `OmniSalon_TryOn_${this.aiState.selectedHairstyleId}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.mainApp.showToast('📸 Đã lưu ảnh chụp HD 3D về máy của bạn!');
    } catch (err) {
      console.error('Snapshot capture error:', err);
      window.mainApp.showToast('❌ Không thể chụp ảnh lúc này.');
    }
  },

  triggerAIScan() {
    this.aiState.isScanning = true;
    const scanLine = document.getElementById('aiScanLine');
    if (scanLine) scanLine.classList.add('scanning');

    // Turn on AR mesh during scan
    this.aiState.showLandmarks = true;
    if (this.threeApp.pointsMesh) this.threeApp.pointsMesh.visible = true;
    if (this.threeApp.pointsLines) this.threeApp.pointsLines.visible = true;

    window.mainApp.showToast('🔍 AI đang quét 468 điểm mốc khuôn mặt và đo đạc tỷ lệ 3D...');
    setTimeout(() => {
      this.aiState.isScanning = false;
      if (scanLine) scanLine.classList.remove('scanning');
      window.mainApp.showToast('✅ Quét hoàn tất! Đã nhận diện khuôn mặt và tối ưu hóa mô hình 3D.');
      this.renderAIConsultationView(document.getElementById('aiConsultationView'));
    }, 1800);
  },

  handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
      this.triggerAIScan();
    }
  },

  saveAIConsultationHistory() {
    const hairstyles = window.store.getHairstyles();
    const currentStyle = hairstyles.find(h => h.id === this.aiState.selectedHairstyleId) || hairstyles[0];

    window.store.saveHairConsultation({
      faceShape: this.aiState.selectedFaceShape,
      skinTone: this.aiState.skinTone,
      selectedStyle: currentStyle.title,
      selectedColor: this.aiState.selectedColorName,
      matchScore: 98
    });

    window.mainApp.showToast('💾 Đã lưu kết quả tư vấn 3D vào hồ sơ của bạn!');
  },

  bookWithCurrentAIHairstyle() {
    const hairstyles = window.store.getHairstyles();
    const currentStyle = hairstyles.find(h => h.id === this.aiState.selectedHairstyleId) || hairstyles[0];

    // Auto open booking wizard with hairstyle pre-attached
    this.openBookingWizard(currentStyle.serviceSuggestionId || 'srv-1', {
      hairstyleChoice: currentStyle.title,
      hairColorChoice: this.aiState.selectedColorName
    });
  },

  // =========================================================================
  // REALISTIC THREE.JS WEBGL ENGINE ARCHITECTURE
  // =========================================================================
  init3DStudio() {
    const canvas = document.getElementById('hair3DCanvas');
    const container = document.getElementById('aiCanvasWrapper');
    if (!canvas || !container) return;

    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded yet, retrying in 200ms...');
      setTimeout(() => this.init3DStudio(), 200);
      return;
    }

    try {
      if (this.threeApp.animFrameId) {
        cancelAnimationFrame(this.threeApp.animFrameId);
        this.threeApp.animFrameId = null;
      }
      if (this.threeApp.renderer) {
        try {
          this.threeApp.renderer.dispose();
        } catch (e) {}
        this.threeApp.renderer = null;
      }

      const width = container.clientWidth || 600;
      const height = container.clientHeight || 480;

      // 1. Scene setup
      const scene = new THREE.Scene();
      this.threeApp.scene = scene;

      // 2. Camera setup
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
      camera.position.set(0, 0.15, 3.2);
      this.threeApp.camera = camera;

      // 3. Renderer setup
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      if (renderer.outputEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
      this.threeApp.renderer = renderer;

      // 4. Lighting setup (Studio 3-Point System)
      this.setup3DStudioLighting(scene);

      // 5. Mannequin Bust & Anatomical Head
      const mannequinGroup = new THREE.Group();
      this.threeApp.mannequinGroup = mannequinGroup;
      scene.add(mannequinGroup);

      this.build3DMannequinHead(mannequinGroup);

      // 6. Realistic 3D Beard Mesh Group
      const beardGroup = new THREE.Group();
      this.threeApp.beardGroup = beardGroup;
      mannequinGroup.add(beardGroup);
      this.build3DBeard();

      // 7. Realistic 3D Hairstyle Mesh
      const hairGroup = new THREE.Group();
      this.threeApp.hairGroup = hairGroup;
      hairGroup.scale.set(this.aiState.hairVolume, this.aiState.hairVolume, this.aiState.hairVolume);
      mannequinGroup.add(hairGroup);

      this.build3DHairstyle(this.aiState.selectedHairstyleId, this.aiState.selectedColorHex);

      // 8. AR Cyber Holographic Points & Mesh
      this.build3DARFaceMesh(mannequinGroup);

      // 9. Interactive Mouse & Touch Drag Controls
      this.setup3DInteractions(canvas);

      // 10. Window resize listener
      window.addEventListener('resize', () => {
        if (!canvas || !this.threeApp.renderer || !this.threeApp.camera) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        if (newW > 0 && newH > 0) {
          this.threeApp.camera.aspect = newW / newH;
          this.threeApp.camera.updateProjectionMatrix();
          this.threeApp.renderer.setSize(newW, newH, false);
        }
      });

      // 11. Start 60fps Render Loop
      this.threeApp.clock = new THREE.Clock();
      this.start3DRenderLoop();
    } catch (err) {
      console.error('3D Studio Initialization Error:', err);
    }
  },

  adjustColorHSL(colorInput, dH, dS, dL) {
    const c = new THREE.Color(colorInput);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    let h = (hsl.h + dH) % 1;
    if (h < 0) h += 1;
    let s = Math.max(0, Math.min(1, hsl.s + dS));
    let l = Math.max(0, Math.min(1, hsl.l + dL));
    c.setHSL(h, s, l);
    return c;
  },

  setup3DStudioLighting(scene) {
    // 1. Sleek Studio Reflective Circular Stage Plinth Disc
    const floorGeo = new THREE.CircleGeometry(2.4, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090b12,
      roughness: 0.65,
      metalness: 0.35
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -1.12;
    scene.add(floorMesh);

    // Floor outer glowing accent ring
    const floorRingGeo = new THREE.RingGeometry(2.35, 2.40, 48);
    const floorRingMat = new THREE.MeshBasicMaterial({
      color: 0x5433eb,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = -1.115;
    scene.add(floorRing);

    // 2. Ambient light (Deep salon shadow fill)
    const ambientLight = new THREE.AmbientLight(0x242033, 1.1);
    scene.add(ambientLight);
    this.threeApp.lights.ambient = ambientLight;

    // 3. Key Light (Main soft warm studio beam - 45° angle)
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.6);
    keyLight.position.set(2.2, 2.6, 2.6);
    scene.add(keyLight);
    this.threeApp.lights.key = keyLight;

    // 4. Fill Light (Soft cool fill on the opposite side)
    const fillLight = new THREE.DirectionalLight(0xdbe8ff, 0.85);
    fillLight.position.set(-2.4, 1.4, 1.8);
    scene.add(fillLight);
    this.threeApp.lights.fill = fillLight;

    // 5. Rim Light (Editorial halo glow highlighting hair silhouette & crest)
    const rimLight = new THREE.DirectionalLight(0xa78bfa, 2.2);
    rimLight.position.set(0, 2.8, -2.4);
    scene.add(rimLight);
    this.threeApp.lights.rim = rimLight;

    // 6. Subtle bottom bounce light for jawline definition
    const bounceLight = new THREE.DirectionalLight(0x5a3aa5, 0.35);
    bounceLight.position.set(0, -1.8, 1.2);
    scene.add(bounceLight);
    this.threeApp.lights.bounce = bounceLight;

    this.update3DStudioLighting(this.aiState.lightingMode);
  },

  update3DStudioLighting(mode) {
    const lights = this.threeApp.lights;
    if (!lights || !lights.key) return;

    if (mode === 'studio') {
      // 4500K Studio Ring Light with violet rim
      lights.ambient.color.setHex(0x282436);
      lights.ambient.intensity = 1.1;
      lights.key.color.setHex(0xfff5ea);
      lights.key.intensity = 1.6;
      lights.fill.color.setHex(0xdbe7ff);
      lights.fill.intensity = 0.8;
      lights.rim.color.setHex(0xa78bfa);
      lights.rim.intensity = 2.2;
    } else if (mode === 'sunset') {
      // Golden Hour warm radiance
      lights.ambient.color.setHex(0x351d28);
      lights.ambient.intensity = 1.0;
      lights.key.color.setHex(0xffaa5e);
      lights.key.intensity = 1.8;
      lights.fill.color.setHex(0xff758f);
      lights.fill.intensity = 0.85;
      lights.rim.color.setHex(0xf43f5e);
      lights.rim.intensity = 2.4;
    } else if (mode === 'cyber') {
      // High-fashion Cyberpunk editorial (Balanced skin tone + glowing neon rims)
      lights.ambient.color.setHex(0x1a122c);
      lights.ambient.intensity = 1.1;
      lights.key.color.setHex(0xffe4ec);
      lights.key.intensity = 1.4;
      lights.fill.color.setHex(0x38bdf8);
      lights.fill.intensity = 1.0;
      lights.rim.color.setHex(0xd946ef);
      lights.rim.intensity = 2.8;
    } else if (mode === 'daylight') {
      // 6500K crisp daylight
      lights.ambient.color.setHex(0x333b47);
      lights.ambient.intensity = 1.2;
      lights.key.color.setHex(0xffffff);
      lights.key.intensity = 1.7;
      lights.fill.color.setHex(0xcfdfff);
      lights.fill.intensity = 0.9;
      lights.rim.color.setHex(0xb2ccff);
      lights.rim.intensity = 1.5;
    }
  },

  build3DMannequinHead(parentGroup) {
    // 1. Studio Porcelain/Clay Mannequin PBR Material (Matching Reference Photo)
    const skinColor = new THREE.Color(0xd4d8df);
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.38,
      metalness: 0.06
    });
    this.threeApp.skinMaterial = skinMaterial;

    // 2. Anatomical Head Mesh (Sculpted cranium & masculine jawline)
    const headGeo = new THREE.SphereGeometry(0.70, 48, 48);
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Masculine jaw tapering & squared chin
      if (y < -0.05) {
        const factor = Math.min(1.0, (-y - 0.05) / 0.55);
        x *= 1.0 - factor * 0.26;
        if (z < 0) {
          z *= 1.0 - factor * 0.25;
        } else {
          z *= 1.0 - factor * 0.08;
        }
        // Strong squared chin definition
        if (y < -0.38 && Math.abs(x) < 0.22) {
          z += 0.05;
        }
      }
      // Forehead contour
      if (y > 0.15) {
        x *= 0.97;
      }
      // High masculine cheekbone ridge
      if (y > -0.12 && y < 0.22 && z > 0.22) {
        x *= 1.035;
      }
      // Brow ridge projection (superciliary arches)
      if (y > 0.16 && y < 0.28 && z > 0.42) {
        z *= 1.05;
      }

      pos.setXYZ(i, x, y * 1.04, z * 0.96);
    }
    headGeo.computeVertexNormals();

    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.position.set(0, 0.15, 0);
    parentGroup.add(headMesh);
    this.threeApp.headMesh = headMesh;

    // Apply face shape morphing based on selected shape
    this.morph3DFaceShape(this.aiState.selectedFaceShape);

    // 3. Sculpted Neck with Adam's Apple & Shoulder Plinth
    const neckGeo = new THREE.CylinderGeometry(0.24, 0.38, 0.54, 32);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, -0.46, -0.02);
    parentGroup.add(neckMesh);

    // Subtle Adam's Apple bump on the neck
    const adamsAppleGeo = new THREE.SphereGeometry(0.045, 12, 12);
    adamsAppleGeo.scale(0.8, 1.2, 1.4);
    const adamsAppleMesh = new THREE.Mesh(adamsAppleGeo, skinMaterial);
    adamsAppleMesh.position.set(0, -0.42, 0.21);
    parentGroup.add(adamsAppleMesh);

    // Luxury Boutique Studio Shoulder Pedestal (Satin obsidian mannequin plinth)
    const pedestalGeo = new THREE.CylinderGeometry(0.70, 1.05, 0.42, 36);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x11131a,
      roughness: 0.32,
      metalness: 0.85
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.set(0, -0.88, -0.03);
    parentGroup.add(pedestalMesh);

    // Luxury Barber Gold Trim Ring around bust pedestal collar
    const goldRingGeo = new THREE.TorusGeometry(0.71, 0.022, 16, 48);
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.22,
      metalness: 0.95
    });
    const goldRingMesh = new THREE.Mesh(goldRingGeo, goldRingMat);
    goldRingMesh.rotation.x = Math.PI / 2;
    goldRingMesh.position.set(0, -0.68, -0.03);
    parentGroup.add(goldRingMesh);

    // 4. Refined Masculine Almond Eyes with Eyelids and Cornea Reflection
    const eyeDist = 0.235;
    const eyeY = 0.21;
    const eyeZ = 0.615;

    const eyeScleraMat = new THREE.MeshStandardMaterial({ color: 0xc8ced6, roughness: 0.35 });
    const eyeIrisMat = new THREE.MeshStandardMaterial({
      color: 0x363d48,
      roughness: 0.25
    });
    const eyelidMat = new THREE.MeshStandardMaterial({ color: 0x88929e, roughness: 0.50 });

    [-1, 1].forEach(side => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(side * eyeDist, eyeY, eyeZ);

      // Eyeball
      const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 24), eyeScleraMat);
      eyeball.scale.set(1.0, 0.80, 0.92);
      eyeGroup.add(eyeball);

      // Deep Espresso Iris disk
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.037, 24), eyeIrisMat);
      iris.position.set(0, 0, 0.073);
      eyeGroup.add(iris);

      // Pupil
      const pupil = new THREE.Mesh(
        new THREE.CircleGeometry(0.016, 16),
        new THREE.MeshBasicMaterial({ color: 0x020202 })
      );
      pupil.position.set(0, 0, 0.075);
      eyeGroup.add(pupil);

      // Upper Eyelid Arch & Lash Line Contour
      const lidCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.068, -0.008, 0.076),
        new THREE.Vector3(0, 0.034, 0.084),
        new THREE.Vector3(0.068, -0.008, 0.076)
      ]);
      const lidMesh = new THREE.Mesh(new THREE.TubeGeometry(lidCurve, 16, 0.009, 6, false), eyelidMat);
      eyeGroup.add(lidMesh);

      parentGroup.add(eyeGroup);

      // Sleek, Groomed Masculine Eyebrows
      const browCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.10, eyeY + 0.07, eyeZ + 0.03),
        new THREE.Vector3(side * 0.24, eyeY + 0.095, eyeZ + 0.02),
        new THREE.Vector3(side * 0.38, eyeY + 0.055, eyeZ - 0.04)
      ]);
      const browGeo = new THREE.TubeGeometry(browCurve, 18, 0.019, 8, false);
      const browMesh = new THREE.Mesh(browGeo, eyelidMat);
      parentGroup.add(browMesh);

      // Contoured Sculpted Human Ears (Helix, Antihelix & Earlobe)
      const helixCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.67, eyeY + 0.14, -0.03),
        new THREE.Vector3(side * 0.74, eyeY + 0.11, -0.06),
        new THREE.Vector3(side * 0.76, eyeY + 0.03, -0.08),
        new THREE.Vector3(side * 0.73, eyeY - 0.06, -0.07),
        new THREE.Vector3(side * 0.68, eyeY - 0.12, -0.05) // Earlobe
      ]);
      const helixMesh = new THREE.Mesh(new THREE.TubeGeometry(helixCurve, 18, 0.024, 8, false), skinMaterial);
      parentGroup.add(helixMesh);

      const conchaGeo = new THREE.SphereGeometry(0.048, 12, 12);
      conchaGeo.scale(0.5, 1.2, 0.7);
      const conchaMesh = new THREE.Mesh(conchaGeo, skinMaterial);
      conchaMesh.position.set(side * 0.69, eyeY + 0.03, -0.06);
      parentGroup.add(conchaMesh);
    });

    // 5. Sculpted Defined Masculine Nose
    const noseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, eyeY + 0.03, eyeZ + 0.03),
      new THREE.Vector3(0, eyeY - 0.09, eyeZ + 0.09),
      new THREE.Vector3(0, eyeY - 0.18, eyeZ + 0.12),
      new THREE.Vector3(0, eyeY - 0.22, eyeZ + 0.115),
      new THREE.Vector3(0, eyeY - 0.25, eyeZ + 0.06)
    ]);
    const noseGeo = new THREE.TubeGeometry(noseCurve, 18, 0.028, 8, false);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    parentGroup.add(noseMesh);

    // Left and Right Nostril wings (Alar lobules)
    [-1, 1].forEach(side => {
      const nostrilGeo = new THREE.SphereGeometry(0.034, 12, 12);
      nostrilGeo.scale(1.15, 0.85, 1.05);
      const nostrilMesh = new THREE.Mesh(nostrilGeo, skinMaterial);
      nostrilMesh.position.set(side * 0.056, eyeY - 0.22, eyeZ + 0.085);
      parentGroup.add(nostrilMesh);
    });

    // 6. Sculpted Masculine Lips (Studio Porcelain Clay finish)
    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xbac0ca,
      roughness: 0.36,
      metalness: 0.04
    });
    // Upper lip with subtle cupid's bow
    const upperLipCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.11, eyeY - 0.35, eyeZ + 0.01),
      new THREE.Vector3(-0.03, eyeY - 0.33, eyeZ + 0.05),
      new THREE.Vector3(0, eyeY - 0.338, eyeZ + 0.045),
      new THREE.Vector3(0.03, eyeY - 0.33, eyeZ + 0.05),
      new THREE.Vector3(0.11, eyeY - 0.35, eyeZ + 0.01)
    ]);
    const upperLipMesh = new THREE.Mesh(new THREE.TubeGeometry(upperLipCurve, 20, 0.021, 8, false), lipMat);
    parentGroup.add(upperLipMesh);

    // Lower lip with natural fullness
    const lowerLipCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.09, eyeY - 0.365, eyeZ),
      new THREE.Vector3(0, eyeY - 0.395, eyeZ + 0.05),
      new THREE.Vector3(0.09, eyeY - 0.365, eyeZ)
    ]);
    const lowerLipMesh = new THREE.Mesh(new THREE.TubeGeometry(lowerLipCurve, 18, 0.025, 8, false), lipMat);
    parentGroup.add(lowerLipMesh);
  },

  morph3DFaceShape(shape) {
    if (!this.threeApp.headMesh) return;
    const mesh = this.threeApp.headMesh;

    if (shape === 'Round') {
      mesh.scale.set(1.06, 0.96, 1.02);
    } else if (shape === 'Square') {
      mesh.scale.set(1.06, 0.98, 1.04);
    } else if (shape === 'Heart') {
      mesh.scale.set(1.02, 1.02, 0.95);
    } else if (shape === 'Diamond') {
      mesh.scale.set(1.05, 1.02, 0.93);
    } else {
      // Oval standard
      mesh.scale.set(1.0, 1.0, 1.0);
    }
  },

  build3DBeard() {
    const beardGroup = this.threeApp.beardGroup;
    if (!beardGroup) return;

    // Clear previous beard children
    while (beardGroup.children.length > 0) {
      const child = beardGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      beardGroup.remove(child);
    }

    const style = this.aiState.beardStyle || 'none';
    if (style === 'none') {
      beardGroup.visible = false;
      return;
    }

    beardGroup.visible = true;

    // Rich dark brown/black barbershop beard material
    const beardMat = new THREE.MeshStandardMaterial({
      color: style === 'stubble' ? 0x221815 : 0x181210,
      roughness: style === 'stubble' ? 0.92 : 0.80,
      metalness: 0.06,
      transparent: style === 'stubble',
      opacity: style === 'stubble' ? 0.90 : 1.0
    });

    if (style === 'stubble') {
      // 1. Jawline contour curve (5 o'clock shadow)
      const jawCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.58, -0.05, 0.24),
        new THREE.Vector3(-0.52, -0.28, 0.36),
        new THREE.Vector3(-0.35, -0.44, 0.52),
        new THREE.Vector3(0, -0.50, 0.64),
        new THREE.Vector3(0.35, -0.44, 0.52),
        new THREE.Vector3(0.52, -0.28, 0.36),
        new THREE.Vector3(0.58, -0.05, 0.24)
      ]);
      const jawMesh = new THREE.Mesh(
        new THREE.TubeGeometry(jawCurve, 32, 0.038, 8, false),
        beardMat
      );
      beardGroup.add(jawMesh);

      // 2. Chin stubble patch
      const chinCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.16, -0.36, 0.60),
        new THREE.Vector3(0, -0.42, 0.66),
        new THREE.Vector3(0.16, -0.36, 0.60)
      ]);
      const chinMesh = new THREE.Mesh(
        new THREE.TubeGeometry(chinCurve, 16, 0.042, 8, false),
        beardMat
      );
      beardGroup.add(chinMesh);

      // 3. Stubble moustache
      const stacheCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.18, -0.15, 0.57),
        new THREE.Vector3(-0.08, -0.13, 0.65),
        new THREE.Vector3(0, -0.14, 0.66),
        new THREE.Vector3(0.08, -0.13, 0.65),
        new THREE.Vector3(0.18, -0.15, 0.57)
      ]);
      const stacheMesh = new THREE.Mesh(
        new THREE.TubeGeometry(stacheCurve, 20, 0.026, 8, false),
        beardMat
      );
      beardGroup.add(stacheMesh);

      // 4. Soul patch below lower lip
      const soulPatchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.24, 0.65),
        new THREE.Vector3(0, -0.32, 0.64)
      ]);
      beardGroup.add(new THREE.Mesh(
        new THREE.TubeGeometry(soulPatchCurve, 8, 0.032, 8, false),
        beardMat
      ));

    } else if (style === 'beard') {
      // Full Barbershop Boxed / Ducktail Trimmed Beard

      // 1. Sideburns and Cheek lines (both sides)
      [-1, 1].forEach(side => {
        // Upper cheek razor lineup
        const cheekCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.62, 0.08, 0.24),
          new THREE.Vector3(side * 0.56, -0.06, 0.34),
          new THREE.Vector3(side * 0.44, -0.20, 0.48),
          new THREE.Vector3(side * 0.25, -0.30, 0.60),
          new THREE.Vector3(0, -0.48, 0.68)
        ]);
        beardGroup.add(new THREE.Mesh(
          new THREE.TubeGeometry(cheekCurve, 24, 0.048, 8, false),
          beardMat
        ));

        // Lower jaw / underside fullness
        const lowerJawCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.58, -0.22, 0.27),
          new THREE.Vector3(side * 0.48, -0.36, 0.40),
          new THREE.Vector3(side * 0.32, -0.48, 0.54),
          new THREE.Vector3(side * 0.16, -0.54, 0.64),
          new THREE.Vector3(0, -0.56, 0.70)
        ]);
        beardGroup.add(new THREE.Mesh(
          new THREE.TubeGeometry(lowerJawCurve, 24, 0.068, 8, false),
          beardMat
        ));

        // Sideburn fade fill
        const sideburnCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.64, 0.16, 0.22),
          new THREE.Vector3(side * 0.62, 0.02, 0.24),
          new THREE.Vector3(side * 0.58, -0.14, 0.28)
        ]);
        beardGroup.add(new THREE.Mesh(
          new THREE.TubeGeometry(sideburnCurve, 12, 0.052, 8, false),
          beardMat
        ));
      });

      // 2. Volumetric Chin Box / Goatee
      const chinBoxGeo = new THREE.SphereGeometry(0.19, 24, 24);
      chinBoxGeo.scale(1.25, 0.95, 1.35);
      const chinBoxMesh = new THREE.Mesh(chinBoxGeo, beardMat);
      chinBoxMesh.position.set(0, -0.48, 0.60);
      beardGroup.add(chinBoxMesh);

      // 3. Prominent Groomed Moustache
      [-1, 1].forEach(side => {
        const stacheCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.13, 0.66),
          new THREE.Vector3(side * 0.08, -0.12, 0.65),
          new THREE.Vector3(side * 0.18, -0.15, 0.60),
          new THREE.Vector3(side * 0.24, -0.21, 0.54)
        ]);
        beardGroup.add(new THREE.Mesh(
          new THREE.TubeGeometry(stacheCurve, 16, 0.040, 8, false),
          beardMat
        ));
      });

      // 4. Soul patch connection
      const soulCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.23, 0.65),
        new THREE.Vector3(0, -0.34, 0.65)
      ]);
      beardGroup.add(new THREE.Mesh(
        new THREE.TubeGeometry(soulCurve, 8, 0.046, 8, false),
        beardMat
      ));
    }
  },

  createHairClumpRibbon(curve, startWidth = 0.11, endWidth = 0.018, camber = 0.024, segments = 12) {
    const headCenter = new THREE.Vector3(0, 0.35, 0);
    const points = curve.getPoints(segments);
    const count = segments + 1;

    const positions = new Float32Array(count * 3 * 3);
    const uvs = new Float32Array(count * 3 * 2);
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = points[i];
      const tangent = curve.getTangentAt(t).normalize();
      
      const outVec = new THREE.Vector3().subVectors(p, headCenter).normalize();
      let binormal = new THREE.Vector3().crossVectors(tangent, outVec).normalize();
      if (binormal.lengthSq() < 0.001) {
        binormal.set(1, 0, 0);
      }
      const ribbonNormal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      const w = (startWidth * (1 - Math.pow(t, 1.25)) + endWidth * 0.1) * 0.5;
      const c = camber * (1 - t * 0.7);

      const vLeft = new THREE.Vector3().copy(p).addScaledVector(binormal, -w);
      const vCenter = new THREE.Vector3().copy(p).addScaledVector(ribbonNormal, c);
      const vRight = new THREE.Vector3().copy(p).addScaledVector(binormal, w);

      const baseIdx = i * 3;
      positions[baseIdx * 3]     = vLeft.x;   positions[baseIdx * 3 + 1]     = vLeft.y;   positions[baseIdx * 3 + 2]     = vLeft.z;
      positions[(baseIdx+1) * 3] = vCenter.x; positions[(baseIdx+1) * 3 + 1] = vCenter.y; positions[(baseIdx+1) * 3 + 2] = vCenter.z;
      positions[(baseIdx+2) * 3] = vRight.x;  positions[(baseIdx+2) * 3 + 1] = vRight.y;  positions[(baseIdx+2) * 3 + 2] = vRight.z;

      uvs[baseIdx * 2]     = 0.0; uvs[baseIdx * 2 + 1]     = t;
      uvs[(baseIdx+1) * 2] = 0.5; uvs[(baseIdx+1) * 2 + 1] = t;
      uvs[(baseIdx+2) * 2] = 1.0; uvs[(baseIdx+2) * 2 + 1] = t;

      if (i < segments) {
        const currL = baseIdx;
        const currC = baseIdx + 1;
        const currR = baseIdx + 2;
        const nextL = baseIdx + 3;
        const nextC = baseIdx + 4;
        const nextR = baseIdx + 5;

        indices.push(currL, nextL, currC);
        indices.push(currC, nextL, nextC);
        indices.push(currC, nextC, currR);
        indices.push(currR, nextC, nextR);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  },

  build3DHairstyle(styleId, colorHex) {
    const hairGroup = this.threeApp.hairGroup;
    if (!hairGroup) return;

    // Clear previous hair meshes
    while (hairGroup.children.length > 0) {
      const child = hairGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      hairGroup.remove(child);
    }
    this.threeApp.strands = [];

    // Hair PBR Material with realistic specular highlights (Obsidian / Barber Sheen)
    const color = new THREE.Color(colorHex);

    const hairMaterial = new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: Math.max(0.18, 0.58 - this.aiState.hairGloss * 0.38),
      metalness: 0.16,
      clearcoat: Math.min(1.0, this.aiState.hairGloss * 0.85),
      clearcoatRoughness: 0.22,
      side: THREE.DoubleSide
    });
    this.threeApp.hairMaterial = hairMaterial;

    const addClump = (curve, startW = 0.11, endW = 0.018, camber = 0.024, phase = 0) => {
      const geo = this.createHairClumpRibbon(curve, startW, endW, camber);
      const mesh = new THREE.Mesh(geo, hairMaterial);
      hairGroup.add(mesh);
      this.threeApp.strands.push({ mesh, phase, baseCurve: curve });
    };

    // 1. Base Volumetric Cranium Dome
    const isBuzz = styleId === 'hs-7';
    const isExplodedPerm = styleId === 'hs-6';

    const baseCapGeo = new THREE.SphereGeometry(0.74, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const baseCapMesh = new THREE.Mesh(baseCapGeo, hairMaterial);
    baseCapMesh.position.set(0, 0.22, -0.02);
    if (isExplodedPerm) {
      baseCapMesh.scale.set(1.08, 1.10, 1.08);
    } else if (isBuzz) {
      baseCapMesh.scale.set(1.01, 1.01, 1.01);
    } else {
      baseCapMesh.scale.set(1.03, 1.02, 1.05);
    }
    hairGroup.add(baseCapMesh);

    // Fade Side Clipper Texture Panels
    const addSideFades = (height = 0.45, yPos = 0.22) => {
      [-1, 1].forEach(side => {
        const fadeGeo = new THREE.CylinderGeometry(0.725, 0.695, height, 24, 1, true, side > 0 ? 0.25 : Math.PI - 1.15, 0.9);
        const fadeMat = new THREE.MeshStandardMaterial({
          color: color.clone().multiplyScalar(0.72),
          roughness: 0.88,
          metalness: 0.08
        });
        const fadeMesh = new THREE.Mesh(fadeGeo, fadeMat);
        fadeMesh.position.set(0, yPos, -0.05);
        hairGroup.add(fadeMesh);
      });
    };

    // 2. HAIRSTYLE-SPECIFIC LAYERED CLUMP RIBBONS (7 BARBERSHOP STYLES)
    if (styleId === 'hs-1') {
      // 1. Modern Undercut Pompadour
      addSideFades(0.48, 0.22);
      const partCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.48, 0.70, 0.44),
        new THREE.Vector3(-0.52, 0.75, 0.12),
        new THREE.Vector3(-0.54, 0.68, -0.25)
      ]);
      hairGroup.add(new THREE.Mesh(new THREE.TubeGeometry(partCurve, 16, 0.012, 6, false), new THREE.MeshBasicMaterial({ color: 0x050505 })));

      for (let i = -11; i <= 11; i++) {
        const xOffset = i * 0.044;
        const arc = 1 - Math.pow(i / 12, 2);
        const hArc = arc * 0.42;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xOffset * 0.65, 0.72 + hArc * 0.4, 0.54),
          new THREE.Vector3(xOffset * 0.82, 1.02 + hArc, 0.36),
          new THREE.Vector3(xOffset * 0.88, 1.06 + hArc * 0.7, 0.06),
          new THREE.Vector3(xOffset * 0.94, 0.96 + hArc * 0.25, -0.22),
          new THREE.Vector3(xOffset * 0.82, 0.68, -0.48)
        ]);
        addClump(curve, 0.12 + arc * 0.03, 0.02, 0.032, i * 0.25);
      }

    } else if (styleId === 'hs-2') {
      // 2. Side Part 7/3 Rủ Hàn Quốc
      addSideFades(0.35, 0.18);
      // 70% Comma bangs
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const xStart = -0.12 + t * 0.64;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xStart, 0.76, 0.48),
          new THREE.Vector3(xStart + 0.08, 0.88, 0.55),
          new THREE.Vector3(xStart + 0.14, 0.64 - t * 0.12, 0.64),
          new THREE.Vector3(xStart + 0.04, 0.42 - t * 0.08, 0.62),
          new THREE.Vector3(xStart - 0.06, 0.35, 0.56)
        ]);
        addClump(curve, 0.11 - t * 0.02, 0.016, 0.028, i * 0.35);
      }
      // 30% Sleek tucked ribbons
      for (let i = 0; i < 9; i++) {
        const t = i / 9;
        const xStart = -0.18 - t * 0.38;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xStart, 0.74, 0.46),
          new THREE.Vector3(xStart - 0.06, 0.78, 0.28),
          new THREE.Vector3(xStart - 0.08, 0.62, -0.05),
          new THREE.Vector3(xStart - 0.05, 0.42, -0.32)
        ]);
        addClump(curve, 0.10, 0.018, 0.024, -i * 0.3);
      }

    } else if (styleId === 'hs-3') {
      // 3. Textured French Crop (Chính xác theo ảnh mẫu tham chiếu của khách hàng!)
      addSideFades(0.55, 0.25);
      // 19 Forward Jagged Fringe Clumps (Lọn mái so le che trán)
      for (let i = -9; i <= 9; i++) {
        const xFrac = i / 9.5;
        const xStart = xFrac * 0.46;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xStart * 0.85, 0.76, 0.40),
          new THREE.Vector3(xStart * 1.05, 0.68, 0.56),
          new THREE.Vector3(xStart * 1.10, 0.54 + (Math.abs(i) % 2) * 0.04, 0.64)
        ]);
        addClump(curve, 0.105, 0.016, 0.026, i * 0.3);
      }
      // 36 Layered Crown & Mid Clumps (Tầng tóc đan xen trên đỉnh đầu)
      for (let row = 0; row < 4; row++) {
        const rowZ = 0.28 - row * 0.18;
        const clumpsInRow = 10 - row;
        for (let c = 0; c < clumpsInRow; c++) {
          const frac = (c / (clumpsInRow - 1)) - 0.5;
          const x = frac * (0.85 - row * 0.12);
          const yBase = 0.84 + Math.cos(frac * Math.PI) * 0.10;
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(x * 0.7, yBase, rowZ - 0.12),
            new THREE.Vector3(x * 0.9, yBase + 0.06, rowZ + 0.06),
            new THREE.Vector3(x * 1.05, yBase - 0.04, rowZ + 0.22)
          ]);
          addClump(curve, 0.12 - row * 0.01, 0.02, 0.028, c * 0.4);
        }
      }

    } else if (styleId === 'hs-4') {
      // 4. Mullet Layer Nam
      addSideFades(0.32, 0.22);
      // Front bangs
      for (let s = -7; s <= 7; s++) {
        const xOffset = s * 0.055;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xOffset * 0.8, 0.76, 0.50),
          new THREE.Vector3(xOffset * 1.1, 0.60, 0.62),
          new THREE.Vector3(xOffset * 1.2, 0.44, 0.58)
        ]);
        addClump(curve, 0.10, 0.018, 0.025, s * 0.3);
      }
      // Mullet Back Cascade
      for (let i = -8; i <= 8; i++) {
        const xOffset = i * 0.052;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xOffset * 0.7, 0.45, -0.42),
          new THREE.Vector3(xOffset * 0.9, 0.15, -0.48),
          new THREE.Vector3(xOffset * 1.1, -0.18, -0.49),
          new THREE.Vector3(xOffset * 1.2, -0.48, -0.45),
          new THREE.Vector3(xOffset * 1.0, -0.68, -0.40)
        ]);
        addClump(curve, 0.12, 0.022, 0.030, i * 0.4);
      }

    } else if (styleId === 'hs-5') {
      // 5. Mohican Fade Sport
      addSideFades(0.58, 0.25);
      for (let i = 0; i < 24; i++) {
        const progress = i / 23;
        const zPos = -0.38 + progress * 0.88;
        const peakHeight = Math.sin(progress * Math.PI * 0.85 + 0.15) * 0.40;
        const xJitter = ((i % 3) - 1) * 0.035;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xJitter * 0.5, 0.68, zPos),
          new THREE.Vector3(xJitter * 0.8, 0.88 + peakHeight * 0.6, zPos + 0.04),
          new THREE.Vector3(xJitter, 1.05 + peakHeight, zPos + 0.08)
        ]);
        addClump(curve, 0.11, 0.016, 0.034, i * 0.45);
      }

    } else if (styleId === 'hs-6') {
      // 6. Uốn Con Sâu Zic-Zac / Premlock
      for (let i = 0; i < 28; i++) {
        const phi = Math.acos(-1 + (2 * i) / 28);
        const theta = Math.sqrt(28 * Math.PI) * phi;
        const startX = Math.cos(theta) * Math.sin(phi) * 0.74;
        const startY = Math.cos(phi) * 0.65 + 0.25;
        const startZ = Math.sin(theta) * Math.sin(phi) * 0.74;
        if (startY < 0.12) continue;

        const points = [];
        const turns = 4;
        const segs = 14;
        for (let s = 0; s <= segs; s++) {
          const t = s / segs;
          const coilAngle = t * Math.PI * 2 * turns;
          const coilRadius = 0.045;
          const x = startX * (1.0 + t * 0.45) + Math.cos(coilAngle) * coilRadius;
          const y = startY + t * 0.22 + Math.sin(coilAngle) * coilRadius;
          const z = startZ * (1.0 + t * 0.45) + (s % 2 === 0 ? 0.02 : -0.02);
          points.push(new THREE.Vector3(x, y, z));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        addClump(curve, 0.08, 0.02, 0.025, i * 0.5);
      }

    } else {
      // 7. Buzz Cut Fade Quân Đội
      addSideFades(0.55, 0.24);
      const hairlineCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.52, 0.45, 0.32),
        new THREE.Vector3(-0.46, 0.58, 0.45),
        new THREE.Vector3(-0.35, 0.65, 0.54),
        new THREE.Vector3(-0.20, 0.66, 0.60),
        new THREE.Vector3(0, 0.67, 0.61),
        new THREE.Vector3(0.20, 0.66, 0.60),
        new THREE.Vector3(0.35, 0.65, 0.54),
        new THREE.Vector3(0.46, 0.58, 0.45),
        new THREE.Vector3(0.52, 0.45, 0.32)
      ]);
      addClump(hairlineCurve, 0.045, 0.045, 0.015, 0);

      for (let r = 0; r < 16; r++) {
        const yArc = 0.58 + r * 0.032;
        const zArc = 0.52 - r * 0.072;
        const width = Math.sqrt(Math.max(0, 1 - Math.pow(r / 16, 2))) * 0.54;
        const ridgeCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-width, yArc, zArc),
          new THREE.Vector3(0, yArc + 0.04, zArc + 0.02),
          new THREE.Vector3(width, yArc, zArc)
        ]);
        addClump(ridgeCurve, 0.08, 0.02, 0.020, r * 0.2);
      }
    }
  },

  update3DHairMaterial() {
    if (!this.threeApp.hairMaterial) return;
    this.threeApp.hairMaterial.color.set(this.aiState.selectedColorHex);
    this.threeApp.hairMaterial.roughness = Math.max(0.18, 0.62 - this.aiState.hairGloss * 0.42);
    this.threeApp.hairMaterial.clearcoat = Math.min(1.0, this.aiState.hairGloss * 0.85);
    this.threeApp.hairMaterial.needsUpdate = true;
  },

  build3DARFaceMesh(parentGroup) {
    // 468-Point Cyber Holographic Point Cloud Matrix
    const pointCount = 180;
    const positions = new Float32Array(pointCount * 3);
    const lineIndices = [];

    let pIdx = 0;
    // Map points across realistic facial contour coordinates
    for (let row = -6; row <= 7; row++) {
      const y = row * 0.08 + 0.1;
      const cols = Math.round(14 - Math.abs(row) * 0.8);
      for (let c = 0; c < cols; c++) {
        if (pIdx >= pointCount) break;
        const angle = ((c / (cols - 1)) - 0.5) * 1.5;
        const rad = (0.70 - (row < 0 ? (-row * 0.03) : (row * 0.01))) * Math.cos(row * 0.08);
        const x = Math.sin(angle) * rad;
        const z = Math.cos(angle) * rad * 0.95;

        positions[pIdx * 3] = x;
        positions[pIdx * 3 + 1] = y;
        positions[pIdx * 3 + 2] = z;

        if (c > 0) {
          lineIndices.push(pIdx - 1, pIdx);
        }
        pIdx++;
      }
    }

    // Points Cloud
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMat = new THREE.PointsMaterial({
      color: 0x00f5ff,
      size: 0.026,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const pointsMesh = new THREE.Points(pointsGeo, pointsMat);
    pointsMesh.visible = this.aiState.showLandmarks;
    parentGroup.add(pointsMesh);
    this.threeApp.pointsMesh = pointsMesh;

    // Wireframe Connecting Lines
    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    linesGeo.setIndex(lineIndices);
    const linesMat = new THREE.LineBasicMaterial({
      color: 0x00b4d8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
    linesMesh.visible = this.aiState.showLandmarks;
    parentGroup.add(linesMesh);
    this.threeApp.pointsLines = linesMesh;
  },

  setup3DInteractions(canvas) {
    let isPointerDown = false;
    let startX = 0;
    let startY = 0;

    const onPointerDown = (clientX, clientY) => {
      isPointerDown = true;
      startX = clientX;
      startY = clientY;
    };

    const onPointerMove = (clientX, clientY) => {
      if (!isPointerDown) return;
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      startX = clientX;
      startY = clientY;

      this.aiState.targetRotationY += deltaX * 0.009;
      this.aiState.targetRotationX = Math.max(-0.45, Math.min(0.55, this.aiState.targetRotationX + deltaY * 0.007));
    };

    const onPointerUp = () => {
      isPointerDown = false;
    };

    // Mouse Listeners
    canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onPointerUp);

    // Touch Listeners
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', onPointerUp);

    // Mouse Wheel Zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.0012;
      this.aiState.targetZoomLevel = Math.max(0.75, Math.min(1.5, this.aiState.targetZoomLevel - zoomDelta));
    }, { passive: false });
  },

  start3DRenderLoop() {
    const app = this.threeApp;
    if (!app.renderer || !app.scene || !app.camera) return;

    const render = () => {
      app.animFrameId = requestAnimationFrame(render);

      const elapsedTime = app.clock ? app.clock.getElapsedTime() : 0;

      // Smooth inertia damping for rotations and zoom
      this.aiState.rotationY += (this.aiState.targetRotationY - this.aiState.rotationY) * 0.12;
      this.aiState.rotationX += (this.aiState.targetRotationX - this.aiState.rotationX) * 0.12;
      this.aiState.zoomLevel += (this.aiState.targetZoomLevel - this.aiState.zoomLevel) * 0.12;

      // Apply rotations to mannequin bust
      if (app.mannequinGroup) {
        app.mannequinGroup.rotation.y = this.aiState.rotationY;
        app.mannequinGroup.rotation.x = this.aiState.rotationX;
      }

      // Apply zoom to camera
      if (app.camera) {
        app.camera.position.z = 3.2 / this.aiState.zoomLevel;
      }

      // Wind breeze animation for hair strands
      if (this.aiState.windEnabled && app.strands && app.strands.length > 0) {
        const windSpeed = 2.4;
        const windStrength = 0.035;
        app.strands.forEach(strand => {
          if (strand.mesh) {
            strand.mesh.rotation.z = Math.sin(elapsedTime * windSpeed + strand.phase) * windStrength;
            strand.mesh.rotation.x = Math.cos(elapsedTime * (windSpeed * 0.8) + strand.phase) * (windStrength * 0.6);
          }
        });
      }

      // Render Three.js frame
      try {
        app.renderer.render(app.scene, app.camera);
      } catch (renderErr) {
        console.warn('Frame render error:', renderErr);
      }
    };

    render();
  },

  // =========================================================================
  // 7. UPGRADED BOOKING WIZARD (MULTI-BRANCH & DOUBLE-BOOKING PREVENTION)
  // =========================================================================
  openBookingWizard(serviceOrComboId, aiOptions = {}) {
    const allOfferings = window.store.getAllServiceOfferings();
    const item = allOfferings.find(s => s.id === serviceOrComboId) || allOfferings[0];
    if (!item) return;

    const branches = window.store.getBranches();
    const activeBranch = window.store.getCurrentBranch();
    const stylists = window.store.getStylists(activeBranch?.id);
    const user = window.store.getCurrentUser();
    const todayStr = new Date().toISOString().split('T')[0];

    this.bookingWizardData = {
      branchId: activeBranch ? activeBranch.id : branches[0]?.id,
      serviceId: item.id,
      serviceName: item.name,
      servicePrice: item.price,
      stylistId: stylists[0]?.id || 'st-1',
      date: todayStr,
      timeSlot: null,
      customerName: user ? user.name : '',
      customerPhone: user ? user.phone : '',
      hairstyleChoice: aiOptions.hairstyleChoice || '',
      hairColorChoice: aiOptions.hairColorChoice || '',
      promoCode: aiOptions.hairstyleChoice ? 'AITRYON50' : '',
      discount: aiOptions.hairstyleChoice ? 50000 : 0
    };

    this.renderBookingStep1();
    document.getElementById('bookingModal').classList.add('active');
  },

  renderBookingStep1() {
    const allOfferings = window.store.getAllServiceOfferings();
    const selectedItem = allOfferings.find(s => s.id === this.bookingWizardData.serviceId) || allOfferings[0];
    const branches = window.store.getBranches();
    const stylists = window.store.getStylists(this.bookingWizardData.branchId);

    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
      <div class="wizard-steps-indicator">
        <div class="wizard-step-item active">
          <div class="step-circle">1</div>
          <div class="step-label">Chi Nhánh & Stylist</div>
        </div>
        <div class="wizard-step-item">
          <div class="step-circle">2</div>
          <div class="step-label">Khung Giờ Trống</div>
        </div>
        <div class="wizard-step-item">
          <div class="step-circle">3</div>
          <div class="step-label">Xác Nhận & Ưu Đãi</div>
        </div>
      </div>

      <!-- AI Attached Hairstyle Badge if present -->
      ${this.bookingWizardData.hairstyleChoice ? `
        <div style="background: rgba(84, 51, 235, 0.08); border: 1px solid var(--color-shop-violet); border-radius: 16px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--color-shop-violet);">✨ ĐÃ KÈM THEO MẪU TÓC THỬ 3D</div>
            <div style="font-size:13px; font-weight:700;">${this.bookingWizardData.hairstyleChoice} (${this.bookingWizardData.hairColorChoice})</div>
          </div>
          <span class="status-pill status-confirmed">Tự Động Gắn Đơn</span>
        </div>
      ` : ''}

      <!-- Step 1.1: Choose Branch -->
      <div class="form-group">
        <label class="form-label">Chọn Chi Nhánh OmniSalon:</label>
        <select class="form-select" id="wizardBranchSelect" onchange="UICustomer.onWizardBranchChange(this.value)">
          ${branches.map(b => `
            <option value="${b.id}" ${b.id === this.bookingWizardData.branchId ? 'selected' : ''}>
              ${b.name} (${b.address.split(',')[0]})
            </option>
          `).join('')}
        </select>
      </div>

      <!-- Step 1.2: Choose Service / Combo -->
      <div class="form-group">
        <label class="form-label">Dịch Vụ / Gói Combo Đã Chọn:</label>
        <select class="form-select" id="wizardServiceSelect" onchange="UICustomer.onWizardServiceChange(this.value)">
          <optgroup label="── GÓI COMBO VIP ──">
            ${window.store.getCombos().map(c => `
              <option value="${c.id}" ${c.id === this.bookingWizardData.serviceId ? 'selected' : ''}>
                [COMBO] ${c.name} — ${c.price.toLocaleString('vi-VN')}đ (${c.duration}p)
              </option>
            `).join('')}
          </optgroup>
          <optgroup label="── DỊCH VỤ RIÊNG LẺ ──">
            ${window.store.getServices().map(s => `
              <option value="${s.id}" ${s.id === this.bookingWizardData.serviceId ? 'selected' : ''}>
                ${s.name} — ${s.price.toLocaleString('vi-VN')}đ (${s.duration}p)
              </option>
            `).join('')}
          </optgroup>
        </select>
      </div>

      <!-- Step 1.3: Choose Stylist in Branch -->
      <div class="form-group">
        <label class="form-label">Chọn Stylist Phục Vụ Tại Chi Nhánh:</label>
        <div class="stylist-grid">
          ${stylists.length === 0 ? `
            <div style="grid-column:1/-1; padding:12px; color:var(--color-muted-gray);">Chi nhánh này đang cập nhật danh sách Stylist.</div>
          ` : stylists.map(st => `
            <div class="stylist-option-card ${st.id === this.bookingWizardData.stylistId ? 'selected' : ''}"
                 onclick="UICustomer.selectStylist('${st.id}')">
              <img class="stylist-avatar" src="${st.avatar}" alt="${st.name}">
              <div style="font-weight:600; font-size:13px;">${st.name}</div>
              <div style="font-size:11px; color:var(--color-muted-gray);">${st.rating} ★ (${st.specialty.split('&')[0]})</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Step 1.4: Date Picker -->
      <div class="form-group">
        <label class="form-label">Chọn Ngày Hẹn:</label>
        <input type="date" class="form-input" id="bookingDateInput" 
               value="${this.bookingWizardData.date}" 
               min="${new Date().toISOString().split('T')[0]}"
               onchange="UICustomer.updateBookingDate(this.value)">
      </div>

      <button class="pill-btn" style="width: 100%; justify-content: center; margin-top: 16px;" 
              onclick="UICustomer.renderBookingStep2()">
        Tiếp Theo: Chọn Khung Giờ &rarr;
      </button>
    `;
  },

  onWizardBranchChange(branchId) {
    this.bookingWizardData.branchId = branchId;
    const stylists = window.store.getStylists(branchId);
    this.bookingWizardData.stylistId = stylists[0]?.id || null;
    this.renderBookingStep1();
  },

  onWizardServiceChange(serviceId) {
    const item = window.store.getAllServiceOfferings().find(s => s.id === serviceId);
    if (item) {
      this.bookingWizardData.serviceId = item.id;
      this.bookingWizardData.serviceName = item.name;
      this.bookingWizardData.servicePrice = item.price;
    }
  },

  selectStylist(stylistId) {
    this.bookingWizardData.stylistId = stylistId;
    this.renderBookingStep1();
  },

  updateBookingDate(dateVal) {
    this.bookingWizardData.date = dateVal;
  },

  renderBookingStep2() {
    const slots = window.store.getAvailableSlots(
      this.bookingWizardData.date, 
      this.bookingWizardData.stylistId, 
      this.bookingWizardData.branchId
    );
    const modalBody = document.getElementById('bookingModalBody');

    modalBody.innerHTML = `
      <div class="wizard-steps-indicator">
        <div class="wizard-step-item">
          <div class="step-circle">1</div>
          <div class="step-label">Dịch Vụ & Stylist</div>
        </div>
        <div class="wizard-step-item active">
          <div class="step-circle">2</div>
          <div class="step-label">Khung Giờ Trống</div>
        </div>
        <div class="wizard-step-item">
          <div class="step-circle">3</div>
          <div class="step-label">Xác Nhận</div>
        </div>
      </div>

      <div style="background:var(--color-canvas-mist); padding:14px; border-radius:16px; margin-bottom:16px;">
        <div style="font-size:12px; color:var(--color-muted-gray);">LỊCH HẸN VỚI STYLIST</div>
        <div style="font-size:15px; font-weight:700; margin-top:2px;">
          ${window.store.getStylists().find(st => st.id === this.bookingWizardData.stylistId)?.name} 
          (${this.bookingWizardData.date})
        </div>
        <div style="font-size:12px; color:var(--color-shop-violet); margin-top:2px;">
          ✓ Hệ thống kiểm tra chống trùng lịch 100% thời gian thực
        </div>
      </div>

      <div style="font-size: 13px; font-weight: 700; margin-bottom: 10px;">
        Vui Lòng Chọn Khung Giờ Còn Trống:
      </div>

      <div class="time-slots-grid">
        ${slots.map(s => `
          <button class="time-slot-btn ${!s.available ? 'disabled' : ''} ${s.time === this.bookingWizardData.timeSlot ? 'selected' : ''}"
                  ${!s.available ? 'disabled title="Đã có khách đặt"' : ''}
                  onclick="UICustomer.selectTimeSlot('${s.time}')">
            ${s.time}
            ${!s.available ? '<span style="font-size:9px; display:block; opacity:0.7;">Đã Kín</span>' : ''}
          </button>
        `).join('')}
      </div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="pill-btn pill-btn-secondary" style="flex: 1; justify-content: center;" onclick="UICustomer.renderBookingStep1()">
          &larr; Quay Lại
        </button>
        <button class="pill-btn" style="flex: 2; justify-content: center;" 
                ${!this.bookingWizardData.timeSlot ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}
                onclick="UICustomer.renderBookingStep3()">
          Tiếp Theo: Thông Tin Khách &rarr;
        </button>
      </div>
    `;
  },

  selectTimeSlot(slotTime) {
    this.bookingWizardData.timeSlot = slotTime;
    this.renderBookingStep2();
  },

  renderBookingStep3() {
    const modalBody = document.getElementById('bookingModalBody');
    const service = window.store.getAllServiceOfferings().find(s => s.id === this.bookingWizardData.serviceId);
    const stylist = window.store.getStylists().find(st => st.id === this.bookingWizardData.stylistId);
    const branch = window.store.getBranches().find(b => b.id === this.bookingWizardData.branchId);
    const finalPrice = Math.max(0, (service?.price || 0) - this.bookingWizardData.discount);

    modalBody.innerHTML = `
      <div class="wizard-steps-indicator">
        <div class="wizard-step-item"><div class="step-circle">1</div><div class="step-label">Dịch Vụ</div></div>
        <div class="wizard-step-item"><div class="step-circle">2</div><div class="step-label">Khung Giờ</div></div>
        <div class="wizard-step-item active"><div class="step-circle">3</div><div class="step-label">Xác Nhận</div></div>
      </div>

      <div class="form-group">
        <label class="form-label">Họ và Tên Quý Khách:</label>
        <input type="text" class="form-input" id="custNameInput" placeholder="Ví dụ: Nguyễn Văn Hải" 
               value="${this.bookingWizardData.customerName}"
               oninput="UICustomer.bookingWizardData.customerName = this.value">
      </div>

      <div class="form-group">
        <label class="form-label">Số Điện Thoại Nhận SMS Nhắc Lịch:</label>
        <input type="tel" class="form-input" id="custPhoneInput" placeholder="Ví dụ: 0908123456" 
               value="${this.bookingWizardData.customerPhone}"
               oninput="UICustomer.bookingWizardData.customerPhone = this.value">
      </div>

      <div class="form-group">
        <label class="form-label">Mã Giảm Giá / Voucher:</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" class="form-input" id="promoCodeInput" placeholder="Nhập mã OMNISALON20 hoặc AITRYON50" value="${this.bookingWizardData.promoCode}">
          <button class="pill-btn pill-btn-secondary" onclick="UICustomer.applyBookingPromo()">Áp Dụng</button>
        </div>
      </div>

      <!-- Smart Product Recommendation Add-on -->
      <div style="background: rgba(84, 51, 235, 0.04); border: 1px dashed var(--color-shop-violet); padding: 12px 16px; border-radius: 18px; margin: 16px 0; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=100&q=80" style="width: 40px; height: 40px; border-radius: 10px; object-fit: cover;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: var(--color-shop-violet);">✨ GỢI Ý MỸ PHẨM CHĂM SÓC SAU DỊCH VỤ</div>
            <div style="font-size: 13px; font-weight: 700;">Dầu Gội Olaplex No.4 Bond Maintenance (780.000đ)</div>
          </div>
        </div>
        <button class="pill-btn pill-btn-secondary" style="font-size: 11px; padding: 6px 12px;" 
                onclick="window.store.addToCart('prod-1', 1); window.mainApp.showToast('🛍️ Đã thêm Olaplex No.4 vào giỏ hàng!')">
          + Mua Kèm
        </button>
      </div>

      <!-- Final Bill Summary -->
      <div style="background: var(--color-canvas-mist); padding: 16px; border-radius: 20px; margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
          <span>Cơ sở phục vụ:</span>
          <strong>${branch?.name}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
          <span>Dịch vụ đặt:</span>
          <span>${service?.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
          <span>Stylist & Khung Giờ:</span>
          <span>${stylist?.name} (${this.bookingWizardData.timeSlot} - ${this.bookingWizardData.date})</span>
        </div>
        ${this.bookingWizardData.hairstyleChoice ? `
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--color-shop-violet); margin-bottom: 6px;">
            <span>Kiểu tóc đã thử 3D:</span>
            <span>${this.bookingWizardData.hairstyleChoice} (${this.bookingWizardData.hairColorChoice})</span>
          </div>
        ` : ''}
        ${this.bookingWizardData.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--color-shop-violet); margin-bottom: 6px;">
            <span>Ưu đãi giảm giá:</span>
            <span>-${this.bookingWizardData.discount.toLocaleString('vi-VN')}đ</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; border-top: 1px solid var(--color-faint-border); padding-top: 8px; margin-top: 8px;">
          <span>Tổng thanh toán:</span>
          <span style="color:var(--color-shop-violet);">${finalPrice.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      <div style="display: flex; gap: 12px;">
        <button class="pill-btn pill-btn-secondary" style="flex: 1; justify-content: center;" onclick="UICustomer.renderBookingStep2()">
          &larr; Quay Lại
        </button>
        <button class="pill-btn" style="flex: 2; justify-content: center;" onclick="UICustomer.submitBooking()">
          Xác Nhận Đặt Chỗ &rarr;
        </button>
      </div>
    `;
  },

  applyBookingPromo() {
    const code = document.getElementById('promoCodeInput')?.value || '';
    const service = window.store.getAllServiceOfferings().find(s => s.id === this.bookingWizardData.serviceId);
    const res = window.store.applyPromoCode(code, service?.price || 0);

    if (res.valid) {
      this.bookingWizardData.promoCode = res.code;
      this.bookingWizardData.discount = res.discount;
      window.mainApp.showToast(`🎉 ${res.message}! Giảm ${res.discount.toLocaleString('vi-VN')}đ`);
      this.renderBookingStep3();
    } else {
      window.mainApp.showToast(`❌ ${res.message}`);
    }
  },

  submitBooking() {
    const name = this.bookingWizardData.customerName.trim();
    const phone = this.bookingWizardData.customerPhone.trim();

    if (!name || !phone) {
      window.mainApp.showToast('⚠️ Vui lòng nhập họ tên và số điện thoại liên hệ');
      return;
    }

    const service = window.store.getAllServiceOfferings().find(s => s.id === this.bookingWizardData.serviceId);
    const stylist = window.store.getStylists().find(st => st.id === this.bookingWizardData.stylistId);
    const finalPrice = Math.max(0, (service?.price || 0) - this.bookingWizardData.discount);

    try {
      const booking = window.store.addBooking({
        branchId: this.bookingWizardData.branchId,
        customerName: name,
        customerPhone: phone,
        serviceId: service.id,
        serviceName: service.name,
        stylistId: stylist.id,
        stylistName: stylist.name,
        date: this.bookingWizardData.date,
        timeSlot: this.bookingWizardData.timeSlot,
        hairstyleChoice: this.bookingWizardData.hairstyleChoice,
        hairColorChoice: this.bookingWizardData.hairColorChoice,
        totalPrice: finalPrice
      });

      document.getElementById('bookingModal').classList.remove('active');
      window.mainApp.showToast(`✅ Đặt lịch thành công! Mã đơn #${booking.id}. OmniSalon đã gửi thông báo xác nhận.`);
      window.mainApp.navigateTo('myBookings');
    } catch (err) {
      window.mainApp.showToast(`⚠️ ${err.message}`);
    }
  },

  // =========================================================================
  // 8. MY BOOKINGS, RESCHEDULE, REVIEW & E-INVOICE MODAL
  // =========================================================================
  renderMyBookings(containerEl) {
    if (!containerEl) return;
    const bookings = window.store.getBookings();

    if (bookings.length === 0) {
      containerEl.innerHTML = `
        <div style="text-align: center; padding: 64px 20px;">
          <div style="font-size:40px; margin-bottom:12px;">📅</div>
          <h3>Bạn chưa có lịch hẹn nào</h3>
          <p style="color: var(--color-muted-gray); margin-top: 8px;">Hãy chọn dịch vụ và đặt lịch ngay để được phục vụ tốt nhất.</p>
          <button class="pill-btn" style="margin-top:20px;" onclick="window.mainApp.navigateTo('services')">
            Khám Phá Dịch Vụ Ngay
          </button>
        </div>
      `;
      return;
    }

    containerEl.innerHTML = `
      <div class="catalog-section-header">
        <div>
          <h2 class="catalog-section-title">Lịch Hẹn Của Tôi (${bookings.length})</h2>
          <div style="font-size:13px; color:var(--color-muted-gray); margin-top:4px;">
            Theo dõi trạng thái phục vụ, đổi giờ hẹn, xuất hóa đơn điện tử hoặc đánh giá chất lượng
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${bookings.map(b => `
          <div class="elevated-card" style="padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-direction: row;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="status-pill status-${b.status}">${this.getStatusLabel(b.status)}</span>
                <span style="font-size: 12px; color: var(--color-muted-gray);">Mã Lịch: <strong>#${b.id}</strong></span>
                <span style="font-size: 12px; color: var(--color-shop-violet); font-weight:600;">• ${b.branchName}</span>
              </div>
              <h3 style="font-size: 18px; font-weight: 700; margin: 8px 0 4px 0;">${b.serviceName}</h3>
              <p style="font-size: 14px; color: var(--color-muted-gray);">
                Stylist: <strong>${b.stylistName}</strong> · Thời gian: <strong>${b.timeSlot} — Ngày ${b.date}</strong>
              </p>
              ${b.hairstyleChoice ? `
                <div style="font-size: 12px; color: var(--color-shop-violet); font-weight: 600; margin-top: 4px;">
                  ✨ Mẫu tóc đã thử: ${b.hairstyleChoice} (${b.hairColorChoice})
                </div>
              ` : ''}
              <p style="font-size: 13px; color: var(--color-ink-black); margin-top: 4px;">
                Khách hàng: ${b.customerName} (${b.customerPhone})
              </p>
              ${b.review ? `
                <div style="margin-top: 10px; padding: 8px 12px; background: var(--color-canvas-mist); border-radius: 12px; font-size: 12px;">
                  <span style="color: #f59e0b; font-weight: bold;">${'★'.repeat(b.review.rating)}</span>
                  <span style="margin-left: 6px; color: var(--color-ink-black);">"${b.review.comment}"</span>
                </div>
              ` : ''}
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px;">
              <div style="font-size: 19px; font-weight: 800; color: var(--color-shop-violet);">
                ${b.totalPrice.toLocaleString('vi-VN')}đ
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                <button class="pill-btn pill-btn-secondary" style="font-size:12px; padding:6px 12px;"
                        onclick="UICustomer.openInvoiceModal('${b.id}')">
                  🧾 E-Invoice
                </button>
                ${b.status !== 'cancelled' && b.status !== 'completed' ? `
                  <button class="pill-btn pill-btn-secondary" style="font-size:12px; padding:6px 12px;"
                          onclick="UICustomer.openRescheduleModal('${b.id}')">
                    🕒 Đổi Giờ
                  </button>
                  <button class="pill-btn pill-btn-secondary" style="color: var(--color-danger); font-size:12px; padding:6px 12px;" 
                          onclick="UICustomer.cancelBooking('${b.id}')">
                    ✕ Hủy
                  </button>
                ` : ''}
                ${(b.status === 'completed' || b.status === 'confirmed') && !b.review ? `
                  <button class="pill-btn" style="font-size:12px; padding:6px 12px;"
                          onclick="UICustomer.openReviewModal('${b.id}')">
                    ⭐ Đánh Giá
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  getStatusLabel(status) {
    const map = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      in_progress: 'Đang làm dịch vụ',
      completed: 'Hoàn tất',
      cancelled: 'Đã hủy'
    };
    return map[status] || status;
  },

  cancelBooking(bookingId) {
    if (confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?')) {
      window.store.updateBookingStatus(bookingId, 'cancelled');
      window.mainApp.showToast('🔔 Lịch hẹn đã được hủy.');
      this.renderMyBookings(document.getElementById('myBookingsView'));
    }
  },

  openRescheduleModal(bookingId) {
    const booking = window.store.getBookings().find(b => b.id === bookingId);
    if (!booking) return;

    const modalBody = document.getElementById('bookingModalBody');
    const todayStr = new Date().toISOString().split('T')[0];

    modalBody.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight:700;">Đổi Khung Giờ Lịch Hẹn [${booking.id}]</h3>
        <p style="font-size: 13px; color: var(--color-muted-gray); margin-top: 4px;">
          ${booking.serviceName} · Stylist: ${booking.stylistName} (${booking.branchName})
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">Chọn Ngày Mới:</label>
        <input type="date" class="form-input" id="rescheduleDateInput"
               value="${booking.date}" min="${todayStr}"
               onchange="UICustomer.refreshRescheduleSlots('${booking.id}', this.value)">
      </div>

      <div class="form-group">
        <label class="form-label">Chọn Khung Giờ Mới Còn Trống:</label>
        <div class="time-slots-grid" id="rescheduleSlotsContainer"></div>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="pill-btn pill-btn-secondary" style="flex:1; justify-content:center;" onclick="document.getElementById('bookingModal').classList.remove('active')">
          Đóng
        </button>
        <button class="pill-btn" style="flex:2; justify-content:center;" id="btnSubmitReschedule" disabled
                onclick="UICustomer.submitReschedule('${booking.id}')">
          Xác Nhận Đổi Lịch
        </button>
      </div>
    `;

    document.getElementById('bookingModal').classList.add('active');
    this.refreshRescheduleSlots(booking.id, booking.date);
  },

  refreshRescheduleSlots(bookingId, dateVal) {
    const booking = window.store.getBookings().find(b => b.id === bookingId);
    if (!booking) return;

    const slots = window.store.getAvailableSlots(dateVal, booking.stylistId, booking.branchId, bookingId);
    const container = document.getElementById('rescheduleSlotsContainer');
    if (!container) return;

    container.innerHTML = slots.map(s => `
      <button class="time-slot-btn ${!s.available ? 'disabled' : ''} ${s.time === this.rescheduleSelectedTime ? 'selected' : ''}"
              ${!s.available ? 'disabled' : ''}
              onclick="UICustomer.selectRescheduleSlot('${s.time}')">
        ${s.time}
      </button>
    `).join('');
  },

  selectRescheduleSlot(timeSlot) {
    this.rescheduleSelectedTime = timeSlot;
    document.querySelectorAll('#rescheduleSlotsContainer .time-slot-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.textContent.trim() === timeSlot);
    });

    const submitBtn = document.getElementById('btnSubmitReschedule');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  },

  submitReschedule(bookingId) {
    const dateInput = document.getElementById('rescheduleDateInput');
    if (!dateInput || !this.rescheduleSelectedTime) return;

    try {
      window.store.rescheduleBooking(bookingId, dateInput.value, this.rescheduleSelectedTime);
      document.getElementById('bookingModal').classList.remove('active');
      window.mainApp.showToast(`✅ Đã đổi lịch hẹn sang ${this.rescheduleSelectedTime} ngày ${dateInput.value}!`);
      this.renderMyBookings(document.getElementById('myBookingsView'));
    } catch (e) {
      window.mainApp.showToast(`⚠️ ${e.message}`);
    }
  },

  openReviewModal(bookingId) {
    const booking = window.store.getBookings().find(b => b.id === bookingId);
    if (!booking) return;

    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
      <div style="margin-bottom: 20px; text-align:center;">
        <h3 style="font-size: 18px; font-weight:700;">Đánh Giá Dịch Vụ OmniSalon</h3>
        <p style="font-size: 13px; color: var(--color-muted-gray); margin-top: 4px;">
          ${booking.serviceName} · Stylist: ${booking.stylistName}
        </p>
      </div>

      <div style="display:flex; justify-content:center; gap: 8px; margin-bottom: 20px; font-size: 32px; cursor: pointer;">
        <span onclick="UICustomer.setReviewRating(1)" class="star-rating-pick" data-val="1">★</span>
        <span onclick="UICustomer.setReviewRating(2)" class="star-rating-pick" data-val="2">★</span>
        <span onclick="UICustomer.setReviewRating(3)" class="star-rating-pick" data-val="3">★</span>
        <span onclick="UICustomer.setReviewRating(4)" class="star-rating-pick" data-val="4">★</span>
        <span onclick="UICustomer.setReviewRating(5)" class="star-rating-pick" data-val="5" style="color:#f59e0b;">★</span>
      </div>

      <div class="form-group">
        <label class="form-label">Cảm Nhận Của Quý Khách:</label>
        <textarea class="form-textarea" id="reviewCommentInput" rows="3" placeholder="Chia sẻ về độ hài lòng đường cắt, màu tóc hoặc sự chu đáo của chuyên viên..."></textarea>
      </div>

      <button class="pill-btn" style="width:100%; justify-content:center;" onclick="UICustomer.submitReview('${booking.id}')">
        Gửi Đánh Giá Ngay
      </button>
    `;

    this.selectedReviewRating = 5;
    document.getElementById('bookingModal').classList.add('active');
  },

  setReviewRating(val) {
    this.selectedReviewRating = val;
    document.querySelectorAll('.star-rating-pick').forEach(el => {
      const v = parseInt(el.dataset.val);
      el.style.color = v <= val ? '#f59e0b' : '#ccc';
    });
  },

  submitReview(bookingId) {
    const commentInput = document.getElementById('reviewCommentInput');
    const comment = commentInput ? commentInput.value : 'Dịch vụ rất tuyệt vời!';
    window.store.addReview(bookingId, this.selectedReviewRating || 5, comment || 'Hài lòng');

    document.getElementById('bookingModal').classList.remove('active');
    window.mainApp.showToast('🎉 Cảm ơn quý khách đã gửi đánh giá cho OmniSalon!');
    this.renderMyBookings(document.getElementById('myBookingsView'));
  },

  openInvoiceModal(bookingId) {
    const booking = window.store.getBookings().find(b => b.id === bookingId);
    if (!booking) return;

    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `
      <div style="border-bottom: 2px dashed var(--color-faint-border); padding-bottom: 16px; margin-bottom: 16px; text-align: center;">
        <div style="font-weight: 800; font-size: 24px; color: var(--color-shop-violet); letter-spacing: -0.03em;">OMNISALON</div>
        <div style="font-size: 12px; color: var(--color-muted-gray); font-weight:600;">HÓA ĐƠN DỊCH VỤ ĐIỆN TỬ (E-INVOICE)</div>
        <div style="font-size: 11px; color: var(--color-muted-gray); margin-top: 4px;">
          Mã số: #${booking.id} · ${booking.branchName}
        </div>
      </div>

      <div style="font-size: 13px; margin-bottom: 16px; display: flex; justify-content: space-between;">
        <div>
          <div>Khách hàng: <strong>${booking.customerName}</strong></div>
          <div>Số điện thoại: <strong>${booking.customerPhone}</strong></div>
        </div>
        <div style="text-align: right;">
          <div>Stylist: <strong>${booking.stylistName}</strong></div>
          <div>Ngày & Giờ: <strong>${booking.timeSlot} (${booking.date})</strong></div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
        <thead>
          <tr style="border-bottom: 1px solid #ddd; text-align: left;">
            <th style="padding: 6px 0;">Dịch Vụ Thực Hiện</th>
            <th style="padding: 6px 0; text-align: right;">Thành Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px 0;">
              <strong>${booking.serviceName}</strong>
              ${booking.hairstyleChoice ? `<div style="font-size:11px; color:var(--color-shop-violet);">Kiểu tóc: ${booking.hairstyleChoice} (${booking.hairColorChoice})</div>` : ''}
            </td>
            <td style="padding: 8px 0; text-align: right;">${booking.totalPrice.toLocaleString('vi-VN')}đ</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="border-top: 1px solid #ddd; font-weight: 700;">
            <td style="padding: 8px 0;">Tổng thanh toán:</td>
            <td style="padding: 8px 0; text-align: right; color: var(--color-shop-violet); font-size: 17px;">
              ${booking.totalPrice.toLocaleString('vi-VN')}đ
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- VietQR Verification Stamp -->
      <div style="background: var(--color-canvas-mist); padding: 14px; border-radius: 16px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight:700; color:var(--color-success); margin-bottom:4px;">
          ✓ ĐÃ XÁC THỰC THANH TOÁN VIETQR / POS CHÍNH XÁC
        </div>
        <div style="font-size: 11px; color: var(--color-muted-gray);">
          Cảm ơn quý khách đã tin tưởng trải nghiệm dịch vụ tại hệ thống OmniSalon.
        </div>
      </div>

      <div style="display: flex; gap: 12px;">
        <button class="pill-btn pill-btn-secondary" style="flex: 1; justify-content: center;" onclick="document.getElementById('bookingModal').classList.remove('active')">
          Đóng
        </button>
        <button class="pill-btn" style="flex: 1; justify-content: center;" onclick="window.print()">
          🖨️ In Hóa Đơn
        </button>
      </div>
    `;

    document.getElementById('bookingModal').classList.add('active');
  },

  // =========================================================================
  // 9. SHOPPING CART DRAWER & CHECKOUT
  // =========================================================================
  addToCart(productId) {
    window.store.addToCart(productId, 1);
    window.mainApp.showToast('🛒 Đã thêm sản phẩm vào giỏ hàng');
    this.renderCartDrawer();
    document.getElementById('cartDrawer').classList.add('open');
  },

  renderCartDrawer() {
    const cart = window.store.getCart();
    const listEl = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('cartTotalAmount');
    if (!listEl) return;

    if (cart.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 48px 20px; color: var(--color-muted-gray);">
          <div style="font-size:36px; margin-bottom:8px;">🛍️</div>
          <div style="font-weight:600;">Giỏ hàng của bạn đang trống</div>
        </div>
      `;
      if (totalEl) totalEl.textContent = '0đ';
      return;
    }

    let total = 0;
    listEl.innerHTML = cart.map(item => {
      total += item.price * item.qty;
      return `
        <div class="cart-item-row">
          <img class="cart-item-img" src="${item.image}" alt="${item.name}">
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 700;">${item.name}</div>
            <div style="font-size: 12px; color: var(--color-shop-violet);">${item.price.toLocaleString('vi-VN')}đ</div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button style="border:none; width:26px; height:26px; border-radius:50%; background:#e5e7eb; font-weight:bold; cursor:pointer;"
                    onclick="window.store.updateCartQty('${item.productId}', ${item.qty - 1})">-</button>
            <span style="font-size: 13px; font-weight: 700; width:16px; text-align:center;">${item.qty}</span>
            <button style="border:none; width:26px; height:26px; border-radius:50%; background:#e5e7eb; font-weight:bold; cursor:pointer;"
                    onclick="window.store.updateCartQty('${item.productId}', ${item.qty + 1})">+</button>
          </div>
        </div>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + 'đ';
  },

  checkoutCart() {
    const cart = window.store.getCart();
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const user = window.store.getCurrentUser();

    const order = window.store.createOrder({
      customerName: user ? user.name : 'Khách Hàng Trực Tuyến',
      customerPhone: user ? user.phone : '0908123456',
      items: cart,
      totalAmount: total,
      paymentMethod: 'VietQR / Chuyển Khoản Tức Thì'
    });

    document.getElementById('cartDrawer').classList.remove('open');
    window.mainApp.showToast(`🎉 Thanh toán đơn hàng #${order.id} thành công! OmniSalon đang đóng gói giao hàng.`);
    this.renderCartDrawer();
  }
};

window.UICustomer = UICustomer;
