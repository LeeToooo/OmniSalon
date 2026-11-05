// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - OMNI AI HAIR STUDIO (CUSTOMER AI STUDIO)
// File: web/frontend/js/modules/customer/ai/customer-ai-studio.js
// ============================================================================

(function (window) {
  'use strict';

  const STORAGE_KEY_AI_GALLERY = 'OMNISALON_CUSTOMER_AI_GALLERY';

  const CustomerAiStudio = {
    // Trạng thái AI Studio Inline
    aiState: {
      originalImage: null,
      resultImage: null,
      selectedStyle: 'Side Part 7/3 Hàn Quốc',
      selectedColorName: 'Đen Tự Nhiên',
      selectedColorHex: '#1c1b18',
      customPrompt: '',
      isProcessing: false,
      showApiSettings: false
    },

    /**
     * Escape chuỗi HTML an toàn
     */
    escapeHtml(str) {
      if (window.CustomerUtils && typeof window.CustomerUtils.escapeHtml === "function") { return window.CustomerUtils.escapeHtml(str); }
      if (typeof str !== 'string') return str == null ? '' : String(str);
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Lấy thông tin tài khoản người dùng hiện tại
     */
    getCurrentUser() {
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        const u = window.AuthEngine.getCurrentUser();
        if (u) return u;
      }
      if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === 'function') {
        return window.AuthEngine.getCurrentUser();
      }
      if (window.store && typeof window.store.getCurrentUser === 'function') {
        return window.store.getCurrentUser();
      }
      return null;
    },

    /**
     * Lấy state AI hiện tại với fallback an toàn
     */
    _getAiState() {
      if (this && this.aiState) return this.aiState;
      if (window.CustomerWeb && window.CustomerWeb.aiState) return window.CustomerWeb.aiState;
      return CustomerAiStudio.aiState;
    },

    /**
     * Render giao diện nội dung AI Studio
     */
    renderAiStudioContent() {
      const state = this._getAiState();
      const { originalImage, resultImage, selectedStyle, selectedColorName, selectedColorHex, isProcessing, showApiSettings } = state;
      const aiConfig = (window.SalonApi && typeof window.SalonApi.getAiConfig === 'function')
        ? window.SalonApi.getAiConfig()
        : { provider: 'demo_smart', apiKey: '', endpoint: '' };

      const stylePresets = [
        { name: 'Side Part 7/3 Hàn Quốc', icon: '' },
        { name: 'Undercut Fade Bén (Hà Hiền)', icon: '' },
        { name: 'Uốn Con Sâu / Texture Wave', icon: '' },
        { name: 'Mullet Hiện Đại (Wolf Cut)', icon: '' },
        { name: 'Buzz Cut Quân Đội', icon: '' },
        { name: 'Crop Warrior Phá Cách', icon: '' },
        { name: 'Pompadour Quý Tộc', icon: '' },
        { name: 'Ép Side Tóc Nam (Down Perm)', icon: '' }
      ];

      const colorPresets = [
        { name: 'Đen Tự Nhiên', hex: '#1c1b18' },
        { name: 'Nâu Tây Lạnh', hex: '#4a3728' },
        { name: 'Khói Xám Bạc', hex: '#9ca3af' },
        { name: 'Vàng Rêu Khói', hex: '#7a8264' },
        { name: 'Nâu Hạt Dẻ', hex: '#6f4e37' },
        { name: 'Khói Ánh Tím', hex: '#6b46c1' }
      ];

      const escapeFn = (typeof this.escapeHtml === 'function') ? this.escapeHtml.bind(this) : (s => s);

      return `
        <div class="ai-studio-grid-layout">
          <!-- CỘT TRÁI: KHUNG HIỂN THỊ ẢNH & BEFORE / AFTER SLIDER -->
          <div class="ai-viewport-column">
            ${!originalImage
            ? `
                <div class="ai-upload-dropzone" id="webAiDropZone" onclick="document.getElementById('webAiPhotoFileInput').click()">
                  <input type="file" id="webAiPhotoFileInput" accept="image/*" style="display:none;" onchange="CustomerWeb.handleAiUpload(event)">
                  <input type="file" id="webAiCameraInput" accept="image/*" capture="user" style="display:none;" onchange="CustomerWeb.handleAiUpload(event)">
                  
                  <div class="dropzone-icon-box">
                    <svg width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <h4 style="font-size: 16px; font-weight: 800; margin-bottom: 6px;">Kéo thả hoặc bấm để tải ảnh chân dung của bạn</h4>
                  <p style="font-size: 13px; color: #888; max-width: 320px; margin: 0 auto 16px;">AI tự động phát hiện đường nét khuôn mặt, hộp sọ và chân tóc</p>

                  <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;" onclick="event.stopPropagation();">
                    <button class="btn-sub-action" onclick="document.getElementById('webAiPhotoFileInput').click()">
                      Chọn Ảnh Từ Máy Tính
                    </button>
                    <button class="btn-sub-action" onclick="document.getElementById('webAiCameraInput').click()">
                      Chụp Bằng Camera
                    </button>
                  </div>

                  <div class="sample-avatar-strip" onclick="event.stopPropagation();">
                    <span style="font-size: 11px; color: #999; font-weight: 700; display: block; margin-bottom: 8px;">HOẶC THỬ NHANH VỚI ẢNH MẪU:</span>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80" 
                           class="sample-avatar-thumb" title="Mẫu Nam 1" onclick="CustomerWeb.loadSampleAi(this.src)">
                      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80" 
                           class="sample-avatar-thumb" title="Mẫu Nam 2" onclick="CustomerWeb.loadSampleAi(this.src)">
                      <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80" 
                           class="sample-avatar-thumb" title="Mẫu Nam 3" onclick="CustomerWeb.loadSampleAi(this.src)">
                    </div>
                  </div>
                </div>
                `
            : isProcessing
                ? `
                <div class="ai-processing-container">
                  <div class="ai-scan-box">
                    <img src="${originalImage}" class="ai-base-img" alt="Scanning">
                    <div class="ai-scan-laser-line"></div>
                    <div class="ai-scan-grid-overlay"></div>
                  </div>
                  <div class="ai-progress-status-box">
                    <div class="barber-pole-spinner"></div>
                    <div style="font-size: 15px; font-weight: 800; color: #fff; margin-top: 14px;">
                      ĐANG LIÊN KẾT AI VISION XỬ LÝ ẢNH...
                    </div>
                    <div class="ai-status-step-text" id="webAiStatusStep">Đang phân tích cấu trúc khuôn mặt &amp; góc cạnh hộp sọ...</div>
                  </div>
                </div>
                `
                : resultImage
                    ? `
                <div class="ai-compare-slider-shell">
                  <div class="ai-image-compare-wrapper" id="webCompareWrapper">
                    <img src="${resultImage}" class="compare-img compare-img-after" alt="Ảnh Sau Khi Đổi Tóc">
                    <span class="compare-label-after">ẢNH TÓC AI</span>

                    <div class="compare-before-clip" id="webCompareBeforeClip" style="width: 50%;">
                      <img src="${originalImage}" class="compare-img compare-img-before" alt="Ảnh Gốc">
                      <span class="compare-label-before">ẢNH GỐC</span>
                    </div>

                    <div class="compare-divider-handle" id="webCompareHandle" style="left: 50%;">
                      <div class="handle-circle">↔</div>
                    </div>
                  </div>

                  <div class="compare-hint-bar">
                    <span>Kéo thanh tròn sang trái/phải để so sánh Trước &amp; Sau</span>
                  </div>

                  <div class="ai-result-actions-strip">
                    <button class="btn-sub-action" onclick="CustomerWeb.downloadAiResult()" title="Tải ảnh về máy">
                      Tải Ảnh HD Về Máy
                    </button>
                    <button class="btn-sub-action" onclick="CustomerWeb.resetAi()">
                      Đổi Ảnh Khác
                    </button>
                  </div>
                </div>
                `
                    : `
                <div class="ai-ready-preview-box">
                  <div class="ready-img-wrap">
                    <img src="${originalImage}" class="ready-preview-img" alt="Ảnh Đã Chọn">
                    <span class="ready-tag">ẢNH SẴN SÀNG</span>
                    <button class="btn-change-photo-mini" onclick="CustomerWeb.resetAi()">Đổi ảnh</button>
                  </div>
                  <div style="font-size: 13px; color: #888; text-align: center; margin-top: 12px;">
                    Đã nhận diện khuôn mặt. Hãy chọn kiểu tóc &amp; màu nhuộm bên phải và nhấn <strong>Biến Đổi</strong>!
                  </div>
                </div>
                `
        }
          </div>

          <!-- CỘT PHẢI: BẢNG ĐIỀU KHIỂN CHỌN KIỂU TÓC, MÀU & THAO TÁC -->
          <div class="ai-controls-column">
            <!-- 1. CHỌN MẪU TÓC NAM -->
            <div class="control-group">
              <label class="control-section-label">
                <span>1. CHỌN KIỂU TÓC XU HƯỚNG</span>
                <span class="badge-selected-tag">${escapeFn(selectedStyle)}</span>
              </label>
              <div class="style-cards-grid">
                ${stylePresets.map(s => `
                  <button class="style-pill-card ${selectedStyle === s.name ? 'active' : ''}" 
                          onclick="CustomerWeb.selectAiStyle('${s.name}')">
                    <span class="style-title">${s.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 2. CHỌN MÀU NHUỘM TÓC -->
            <div class="control-group" style="margin-top: 16px;">
              <label class="control-section-label">
                <span>2. CHỌN MÀU NHUỘM THỜI THƯỢNG</span>
                <span style="font-size: 12px; font-weight: 700; color: #c85a44;">${escapeFn(selectedColorName)}</span>
              </label>
              <div class="color-swatches-grid">
                ${colorPresets.map(c => `
                  <button class="color-swatch-item ${selectedColorName === c.name ? 'active' : ''}" 
                          onclick="CustomerWeb.selectAiColor('${c.name}', '${c.hex}')" 
                          title="${c.name}">
                    <span class="swatch-circle" style="background: ${c.hex};"></span>
                    <span class="swatch-name">${c.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 3. MÔ TẢ YÊU CẦU TÙY BIẾN -->
            <div class="control-group" style="margin-top: 16px;">
              <label class="control-section-label">3. GHI CHÚ YÊU CẦU CHO AI (TÙY CHỌN)</label>
              <input type="text" id="webAiCustomPromptInput" class="ai-custom-input" 
                     placeholder="Ví dụ: Fade sát chân tóc, uốn sóng phồng nhẹ, vuốt sáp mờ..." 
                     value="${escapeFn(state.customPrompt || '')}" 
                     onchange="CustomerWeb.aiState.customPrompt = this.value">
            </div>

            <!-- 4. NÚT MỞ CÀI ĐẶT API -->
            <div class="ai-api-toggle-row">
              <button class="btn-text-toggle" onclick="CustomerWeb.toggleAiApiSettings()">
                Cài đặt API Key &amp; Endpoint (${escapeFn(aiConfig.provider)})
              </button>
            </div>

            <!-- KHUNG CẤU HÌNH API  - KHI BẬT -  -->
            ${showApiSettings ? `
              <div class="ai-settings-collapsible">
                <div style="font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 8px;">CẤU HÌNH KẾT NỐI AI VISION API:</div>
                <div class="api-form-row">
                  <label>Nhà Cung Cấp API:</label>
                  <select id="webAiProviderSelect" class="api-input-control">
                    <option value="demo_smart" ${aiConfig.provider === 'demo_smart' ? 'selected' : ''}>Omni Neural Engine (Sẵn có - Không cần Key)</option>
                    <option value="huggingface" ${aiConfig.provider === 'huggingface' ? 'selected' : ''}>Hugging Face Inference API</option>
                    <option value="replicate" ${aiConfig.provider === 'replicate' ? 'selected' : ''}>Replicate API (SD / Face-to-Many)</option>
                    <option value="openai" ${aiConfig.provider === 'openai' ? 'selected' : ''}>OpenAI Vision / DALL-E 3</option>
                  </select>
                </div>
                <div class="api-form-row">
                  <label>API Key (Mã Token):</label>
                  <input type="password" id="webAiApiKeyInput" class="api-input-control" placeholder="hf_xxxx... hoặc r8_xxxx..." value="${escapeFn(aiConfig.apiKey || '')}">
                </div>
                <div class="api-form-row">
                  <label>API Endpoint (URL):</label>
                  <input type="text" id="webAiEndpointInput" class="api-input-control" placeholder="https://api-inference.huggingface.co/..." value="${escapeFn(aiConfig.endpoint || '')}">
                </div>
                <button class="btn-submit-terracotta" style="width: 100%; padding: 8px; margin-top: 8px; font-size: 12px;" onclick="CustomerWeb.saveAiApiSettings()">
                  Lưu Cấu Hình API
                </button>
              </div>
            ` : ''}

            <!-- 5. CÁC NÚT HÀNH ĐỘNG CHÍNH -->
            <div class="ai-action-buttons-wrap">
              ${!resultImage ? `
                <button class="btn-execute-ai" onclick="CustomerWeb.processAiRestyle()" ${!originalImage || isProcessing ? 'disabled style="opacity: 0.6;"' : ''}>
                  BẮT ĐẦU ĐỔI KIỂU TÓC BẰNG AI
                </button>
              ` : `
                <button class="btn-submit-terracotta btn-book-now-ai" onclick="CustomerWeb.bookAiHairstyle()">
                  ĐẶT LỊCH CẮT KIỂU TÓC NÀY
                </button>
                <button class="btn-execute-ai" style="margin-top: 8px; background: #222;" onclick="CustomerWeb.processAiRestyle()">
                  Thử Đổi Màu / Kiểu Tóc Khác
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    },

    updateAiStudio() {
      const el = document.getElementById('webAiStudioContainer');
      if (el) {
        el.innerHTML = this.renderAiStudioContent();
        const state = this._getAiState();
        if (state.resultImage && !state.isProcessing) {
          setTimeout(() => this.initCompareSlider(), 60);
        }
      }
    },

    selectAiStyle(styleName) {
      const state = this._getAiState();
      state.selectedStyle = styleName;
      this.updateAiStudio();
      if (window.UICommon) window.UICommon.showToast(`Đã chọn kiểu tóc ${styleName}`);
    },

    selectAiColor(colorName, colorHex) {
      const state = this._getAiState();
      state.selectedColorName = colorName;
      state.selectedColorHex = colorHex;
      this.updateAiStudio();
      if (window.UICommon) window.UICommon.showToast(`Đã chọn màu ${colorName}`);
    },

    handleAiUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const allowedExtensions = /\.(jpe?g|png|webp)$/i;
      const fileName = (file.name || '').replace(/[\/\\]/g, '');

      if (fileName.includes('..') || fileName.includes('<') || fileName.includes('>')) {
        if (window.UICommon) window.UICommon.showToast('Tên tệp chứa ký tự không an toàn!', 'error');
        return;
      }

      if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExtensions.test(fileName)) {
        if (window.UICommon) window.UICommon.showToast('Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WEBP hợp lệ!', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        if (window.UICommon) window.UICommon.showToast('Dung lượng ảnh không được vượt quá 5MB!', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const state = this._getAiState();
        state.originalImage = e.target.result;
        state.resultImage = null;
        this.updateAiStudio();
        if (window.UICommon) window.UICommon.showToast('Đã tải ảnh khuôn mặt lên Studio Web!');
      };
      reader.readAsDataURL(file);
    },

    loadSampleAi(imageUrl) {
      const state = this._getAiState();
      state.originalImage = imageUrl;
      state.resultImage = null;
      this.updateAiStudio();
      if (window.UICommon) window.UICommon.showToast('Đã chọn ảnh mẫu. Bấm "Bắt Đầu Đổi Kiểu Tóc"!');
    },

    toggleAiApiSettings() {
      const state = this._getAiState();
      state.showApiSettings = !state.showApiSettings;
      this.updateAiStudio();
    },

    saveAiApiSettings() {
      const provider = document.getElementById('webAiProviderSelect')?.value;
      const apiKey = document.getElementById('webAiApiKeyInput')?.value;
      const endpoint = document.getElementById('webAiEndpointInput')?.value;
      if (window.SalonApi && typeof window.SalonApi.saveAiConfig === 'function') {
        window.SalonApi.saveAiConfig(provider, apiKey, endpoint);
        if (window.UICommon) window.UICommon.showToast('Đã lưu cấu hình API thành công!');
        const state = this._getAiState();
        state.showApiSettings = false;
        this.updateAiStudio();
      }
    },

    async processAiRestyle() {
      const state = this._getAiState();
      if (!state.originalImage) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng tải hoặc chọn ảnh chân dung trước.', 'warning');
        return;
      }
      state.isProcessing = true;
      this.updateAiStudio();

      const stepEl = document.getElementById('webAiStatusStep');
      setTimeout(() => { if (stepEl) stepEl.textContent = `Đang cắt phom tóc ${state.selectedStyle}...`; }, 400);
      setTimeout(() => { if (stepEl) stepEl.textContent = `Đang hòa sắc màu nhuộm ${state.selectedColorName}...`; }, 900);

      try {
        const response = await window.SalonApi.restyleHairPhoto({
          originalImageBase64: state.originalImage,
          hairstyleName: state.selectedStyle,
          hairColorName: state.selectedColorName,
          hairColorHex: state.selectedColorHex,
          customPrompt: state.customPrompt
        });

        state.isProcessing = false;
        if (response && response.resultImageUrl) {
          state.resultImage = response.resultImageUrl;

          this.saveAiToGallery({
            id: 'ai-' + Date.now(),
            hairstyle: state.selectedStyle,
            color: state.selectedColorName,
            colorHex: state.selectedColorHex,
            resultImageUrl: response.resultImageUrl,
            originalImageUrl: state.originalImage,
            createdAt: new Date().toISOString()
          });

          this.updateAiStudio();
          if (window.UICommon) window.UICommon.showToast(`Đổi kiểu tóc AI thành công (${response.providerUsed})!`);
        }
      } catch (err) {
        state.isProcessing = false;
        this.updateAiStudio();
        if (window.UICommon) window.UICommon.showToast(`Lỗi AI: ${err.message}`, 'error');
      }
    },

    saveAiToGallery(item) {
      try {
        const user = this.getCurrentUser();
        const userId = user ? user.id : 'guest';
        const key = `${STORAGE_KEY_AI_GALLERY}_${userId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift(item);
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
      } catch (e) {
        console.warn('[CustomerWeb] Cannot save to gallery localStorage:', e);
      }
    },

    getAiGallery() {
      try {
        const user = this.getCurrentUser();
        const userId = user ? user.id : 'guest';
        const key = `${STORAGE_KEY_AI_GALLERY}_${userId}`;
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch (e) { }

      return [
        {
          id: 'ai-sample-1',
          hairstyle: 'Side Part 7/3 Hàn Quốc',
          color: 'Khói Xám Bạc',
          colorHex: '#9ca3af',
          resultImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          originalImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'ai-sample-2',
          hairstyle: 'Undercut Fade Bén (Hà Hiền)',
          color: 'Đen Tự Nhiên',
          colorHex: '#1c1b18',
          resultImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
          originalImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
    },

    initCompareSlider() {
      const wrapper = document.getElementById('webCompareWrapper');
      const beforeClip = document.getElementById('webCompareBeforeClip');
      const handle = document.getElementById('webCompareHandle');
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

    downloadAiResult() {
      const state = this._getAiState();
      if (!state.resultImage) return;
      const a = document.createElement('a');
      a.href = state.resultImage;
      a.download = `Omni-AI-${state.selectedStyle.replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (window.UICommon) window.UICommon.showToast('Đã tải ảnh kiểu tóc HD về máy tính!');
    },

    resetAi() {
      const state = this._getAiState();
      state.originalImage = null;
      state.resultImage = null;
      this.updateAiStudio();
    },

    bookAiHairstyle() {
      const state = this._getAiState();
      if (window.UICommon && typeof window.UICommon.openBookingModal === 'function') {
        window.UICommon.openBookingModal();
        window.UICommon.showToast(`Đã đưa kiểu tóc "${state.selectedStyle}" vào lịch hẹn!`);
      }
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerAiStudio = CustomerAiStudio;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerAiStudio);
  }

})(typeof window !== 'undefined' ? window : this);

