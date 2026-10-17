// =========================================================================
// Omni Salon: AI HAIR STUDIO 3D (MÔ PHỎNG KIỂU TÓC 3D)
// Phong cách tạp chí Editorial • Tông màu ấm • Typography Playfair Display
// Route: "/ai-studio"
// =========================================================================

(function (window) {
  'use strict';

  const AiStudioPage = {
    state: {
      uploadedImage: null,
      selectedHairstyle: 'layer-korean',
      selectedColor: 'natural-black',
      isScanning: false,
      scanProgress: 0,
      scanStageText: '',
      hasResult: false,
      resultImage: null,
      sliderPosition: 50
    },

    hairstyles: [
      {
        id: 'layer-korean',
        name: 'Layer Texture Tự Nhiên',
        tag: 'THỜI THƯỢNG',
        desc: 'Tỉa tầng bay bổng, uốn texture tạo độ phồng tự nhiên cho khuôn mặt Á Đông.',
        preview: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
        result: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'pompadour-luxury',
        name: 'Pompadour & Mid Fade',
        tag: 'LỊCH LÃM',
        desc: 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên mang lại phong thái đĩnh đạc.',
        preview: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
        result: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'mullet-modern',
        name: 'Modern Mullet & Taper Fade',
        tag: 'PHONG CÁCH',
        desc: 'Gáy tỉa so le mềm mại kết hợp đường cạo viền dứt khoát và nam tính.',
        preview: 'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=400&q=80',
        result: 'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'sidepart-gentleman',
        name: 'Side Part 7/3 Cổ Điển',
        tag: 'QUÝ ÔNG',
        desc: 'Đường rẽ ngôi tỉ lệ vàng tôn phom mặt, dễ dàng chải sáp restyle suốt cả ngày.',
        preview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        result: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'buzzcut-fade',
        name: 'Buzz Cut & High Fade',
        tag: 'DỨT KHOÁT',
        desc: 'Gọn gàng, tôn trọn vẹn xương hàm và đường nét góc cạnh của gương mặt.',
        preview: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80',
        result: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80'
      }
    ],

    hairColors: [
      { id: 'natural-black', name: 'Đen Tự Nhiên', hex: '#141413', border: '#475569' },
      { id: 'cold-ash-brown', name: 'Nâu Lạnh Sâu', hex: '#523A28', border: '#A27B5C' },
      { id: 'titan-grey', name: 'Xám Khói Titan', hex: '#6B7280', border: '#9CA3AF' },
      { id: 'nordic-platinum', name: 'Vàng Cát Trầm', hex: '#C59B27', border: '#C59B27' }
    ],

    demoPortraits: [
      { name: 'Mẫu Nam 01', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80' },
      { name: 'Mẫu Nam 02', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=500&q=80' },
      { name: 'Mẫu Nam 03', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80' }
    ],

    render(container, params = {}) {
      if (!container) return;

      // Mặc định chọn ảnh demo nếu chưa có ảnh
      if (!this.state.uploadedImage) {
        this.state.uploadedImage = this.demoPortraits[0].url;
      }

      container.innerHTML = `
        <div class="omni-container" style="padding-top: 48px; padding-bottom: 88px; max-width: 1440px; margin: 0 auto; padding-left: clamp(16px, 3.5vw, 48px); padding-right: clamp(16px, 3.5vw, 48px); box-sizing: border-box;">
          <!-- Header Hero -->
          <div style="text-align: center; margin-bottom: 40px;">
            <span class="tracking-widest" style="font-size: 11.5px; font-weight: 700; color: #C59B27; text-transform: uppercase; margin-bottom: 8px; display: inline-block;">
              CÔNG NGHỆ MÔ PHỎNG 3D
            </span>
            <h1 class="font-serif tracking-tight leading-tight" style="font-size: clamp(30px, 4.2vw, 44px); font-weight: 700; color: var(--text-primary); margin: 0 0 12px;">
              Thử Kiểu Tóc 3D &amp; Định Hình Phom Dáng
            </h1>
            <p style="color: var(--text-secondary); font-size: 15px; max-width: 680px; margin: 0 auto; line-height: 1.6;">
              Mô phỏng chân thực dáng tóc theo từng đường nét khuôn mặt trước khi thợ barber thực hiện cắt kéo.
            </p>
          </div>

          <!-- Studio Main Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; align-items: stretch;">
            
            <!-- CỘT TRÁI: INPUT FILE ẢNH CHÂN DUNG -->
            <div class="ai-studio-panel" style="border-radius: 8px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: none;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                  <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    ẢNH CHÂN DUNG CỦA BẠN
                  </span>
                  <span id="aiUploadStatusBadge" style="font-size: 11.5px; color: var(--text-muted); font-weight: 500;">
                    ${this.state.uploadedImage ? 'Sẵn sàng mô phỏng' : 'Chưa chọn ảnh'}
                  </span>
                </div>

                <!-- Dropzone bọc Native Input File -->
                <div id="aiNativeDropZone" 
                     ondragover="event.preventDefault(); this.style.borderColor='#C59B27';"
                     ondragleave="this.style.borderColor='var(--border-color)';"
                     ondrop="AiStudioPage.handleDrop(event)"
                     style="position: relative; border: 1px dashed var(--border-color); border-radius: 6px; background: var(--surface-elevated, #F8FAFC); padding: 18px; text-align: center; cursor: pointer; transition: all 0.2s ease; overflow: hidden; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                  
                  <input type="file" id="aiStudioFileInput" accept="image/*" 
                         onchange="AiStudioPage.handleFileSelected(event)"
                         style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 20;" />

                  <!-- Preview Box with Laser & HUD -->
                  <div id="aiPortraitViewport" class="ai-portrait-viewport" style="position: relative; width: 100%; height: 280px; border-radius: 4px; overflow: hidden; display: ${this.state.uploadedImage ? 'block' : 'none'};">
                    <img id="aiSourcePortrait" src="${this.state.uploadedImage || ''}" alt="Chân dung" style="width: 100%; height: 100%; object-fit: cover;">
                    <div id="aiScanLaserLine" class="ai-laser-line" style="display: none; position: absolute; left: 0; right: 0; height: 2px; background: #C59B27; z-index: 10;"></div>
                    <div id="aiScanGridMesh" class="ai-grid-mesh" style="display: none; position: absolute; inset: 0; background-image: radial-gradient(rgba(197, 155, 39, 0.2) 1px, transparent 1px); background-size: 20px 20px; pointer-events: none; z-index: 8;"></div>
                    
                    <div id="aiScanHudModal" style="display: none; position: absolute; inset: 0; background: rgba(20, 20, 19, 0.9); backdrop-filter: blur(4px); flex-direction: column; align-items: center; justify-content: center; z-index: 15; padding: 20px; text-align: center;">
                      <div class="ai-radar-ring" style="width: 40px; height: 40px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #C59B27; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;"></div>
                      <div class="font-serif tracking-tight leading-tight" style="font-size: 15px; font-weight: 700; color: #FAF8F5;" id="aiScanHudTitle">HỆ THỐNG ĐANG PHÂN TÍCH PHOM TÓC...</div>
                      <div style="font-size: 12px; color: #A1A1AA; margin-top: 4px;" id="aiScanHudSub">Nhận diện đường nét ngũ quan...</div>
                      <div style="width: 180px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 12px; overflow: hidden;">
                        <div id="aiScanHudProgress" style="height: 100%; width: 0%; background: #C59B27; transition: width 0.2s ease;"></div>
                      </div>
                    </div>

                    <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(20,20,19,0.85); padding: 4px 10px; border-radius: 4px; font-size: 11px; color: #FAF8F5; z-index: 12; pointer-events: none;">
                      Nhấp hoặc kéo thả ảnh mới để thay đổi
                    </div>
                  </div>

                  <!-- Empty Placeholder UI -->
                  <div id="aiEmptyUploadUI" style="display: ${this.state.uploadedImage ? 'none' : 'flex'}; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="width: 44px; height: 44px; border-radius: 6px; background: var(--surface-card, #FFFFFF); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #C59B27; margin-bottom: 10px;">
                      ẢNH
                    </div>
                    <h4 class="font-serif tracking-tight leading-tight" style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Kéo thả ảnh chân dung vào đây</h4>
                    <p style="font-size: 12px; color: var(--text-secondary); max-width: 260px; margin-bottom: 12px; line-height: 1.4;">
                      hoặc nhấp chuột để chọn ảnh chụp góc thẳng từ thiết bị
                    </p>
                    <span class="nordic-btn-secondary" style="font-size: 12px; font-weight: 700; padding: 6px 16px; pointer-events: none; border-radius: 4px; background: var(--surface-card, #FFFFFF); color: var(--text-primary); border: 1px solid var(--border-color);">
                      Chọn Tệp Ảnh
                    </span>
                  </div>
                </div>
              </div>

              <!-- Quick Demo Samples -->
              <div style="margin-top: 18px;">
                <span class="tracking-widest" style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 8px;">
                  HOẶC CHỌN ẢNH MẪU CÓ SẴN:
                </span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${this.demoPortraits.map(dp => `
                    <button type="button" class="ai-demo-portrait-btn" onclick="AiStudioPage.selectDemoPortrait('${dp.url}')" style="display: flex; align-items: center; gap: 8px; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 10px; cursor: pointer; color: var(--text-primary); font-size: 12px; font-weight: 600;">
                      <img src="${dp.url}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;" alt="${dp.name}">
                      <span>${dp.name}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- CỘT PHẢI: DANH SÁCH 4 PHOM TÓC + NÚT CTA -->
            <div class="ai-studio-panel" style="border-radius: 8px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: none;">
              <div>
                <div style="margin-bottom: 16px;">
                  <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    PHOM DÁNG TÓC THỊNH HÀNH
                  </span>
                  <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Chọn 1 phom tóc bên dưới để ướm thử lên khuôn mặt:</p>
                </div>

                <!-- 4 Hairstyle Buttons -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                  ${this.hairstyles.slice(0, 4).map(h => {
        const isSelected = this.state.selectedHairstyle === h.id;
        return `
                      <button type="button" 
                              id="pillStyle_${h.id}"
                              class="ai-style-pill-btn ${isSelected ? 'selected' : ''}"
                              onclick="AiStudioPage.selectHairstyle('${h.id}')"
                              style="width: 100%; padding: 12px 14px; border-radius: 6px; text-align: left; display: flex; flex-direction: column; gap: 4px; cursor: pointer; border: 1.5px solid ${isSelected ? '#C59B27' : 'var(--border-color)'}; background: var(--surface-card); transition: all 0.15s ease;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                          <strong class="font-serif tracking-tight leading-tight" style="color: ${isSelected ? '#C59B27' : 'var(--text-primary)'}; font-size: 13.5px;">${h.name}</strong>
                          <span style="color: ${isSelected ? '#C59B27' : 'var(--text-muted)'}; font-size: 11px;">${isSelected ? '●' : '○'}</span>
                        </div>
                        <span style="font-size: 10.5px; color: var(--text-secondary); line-height: 1.3;">${h.tag}</span>
                      </button>
                    `;
      }).join('')}
                </div>

                <!-- Color Swatches -->
                <div style="margin-bottom: 20px;">
                  <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase; display: block; margin-bottom: 8px;">
                    MÀU NHUỘM PHỐI HỢP:
                  </span>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${this.hairColors.map(c => {
        const isSelected = this.state.selectedColor === c.id;
        return `
                        <button type="button" 
                                id="pillColor_${c.id}"
                                class="ai-color-pill-btn ${isSelected ? 'selected' : ''}"
                                onclick="AiStudioPage.selectColor('${c.id}')"
                                style="display: flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 6px; cursor: pointer; border: 1.5px solid ${isSelected ? '#C59B27' : 'var(--border-color)'}; background: var(--surface-card); font-size: 12.5px; font-weight: 700; transition: all 0.15s ease;">
                          <span style="width: 12px; height: 12px; border-radius: 50%; background: ${c.hex}; display: inline-block; border: 1.5px solid ${c.id === 'natural-black' ? '#64748B' : 'rgba(255,255,255,0.4)'}; flex-shrink: 0;"></span>
                          <span style="color: ${isSelected ? '#C59B27' : 'var(--text-primary)'}; font-weight: 700;">${c.name}</span>
                        </button>
                      `;
      }).join('')}
                  </div>
                </div>
              </div>

              <!-- NÚT CTA 'Tạo Kiểu Ngay' -->
              <div>
                <button type="button" class="nordic-btn-primary" id="btnRunAiRestyle" onclick="AiStudioPage.runAiRestyle()"
                        style="width: 100%; height: 46px; font-size: 14px; font-weight: 800; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(197, 155, 39, 0.25);">
                  <span id="aiBtnSpinner" style="display: none; width: 16px; height: 16px; border: 2px solid #141413; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                  <span id="aiBtnIcon"></span>
                  <span id="aiBtnText">Mô Phỏng Kiểu Tóc Ngay →</span>
                </button>

                <!-- Result Actions -->
                <div id="aiResultActions" style="display: ${this.state.hasResult ? 'flex' : 'none'}; gap: 10px; margin-top: 14px;">
                  <button type="button" class="nordic-btn-primary" onclick="AiStudioPage.bookThisHairstyle()"
                          style="flex: 1; padding: 11px 14px; font-size: 13px; font-weight: 700; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer;">
                    Đặt Lịch Cắt Kiểu Này →
                  </button>
                  <button type="button" class="nordic-btn-secondary" onclick="AiStudioPage.resetAiRestyle()" style="padding: 11px 14px; font-size: 13px; font-weight: 600; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px;">
                    Thử Kiểu Khác
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      `;

      // Cập nhật micro-interactions
      if (window.AppRouter) {
        window.AppRouter.initMagneticButtons(container);
      }
    },

    selectHairstyle(styleId) {
      this.state.selectedHairstyle = styleId;
      const found = this.hairstyles.find(h => h.id === styleId);
      if (found && window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`Đã chọn phom tóc: ${found.name}`, 'info');
      }
      this._updateHairstyleUI();
    },

    selectColor(colorId) {
      this.state.selectedColor = colorId;
      const found = this.hairColors.find(c => c.id === colorId);
      if (found && window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`Đã chọn màu nhuộm: ${found.name}`, 'info');
      }
      this._updateColorUI();
    },

    selectDemoPortrait(url) {
      this.state.uploadedImage = url;
      this.state.hasResult = false;
      const img = document.getElementById('aiSourcePortrait');
      if (img) img.src = url;
      this._toggleResultState(false);
      if (window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast('Đã nạp ảnh mẫu chân dung HD', 'success');
      }
    },

    triggerFileInput() {
      const input = document.getElementById('aiStudioFileInput');
      if (input) input.click();
    },

    handleDrop(event) {
      event.preventDefault();
      const dropzone = document.getElementById('aiNativeDropZone');
      if (dropzone) dropzone.style.borderColor = 'rgba(212, 175, 55, 0.35)';
      const files = event.dataTransfer && event.dataTransfer.files;
      if (files && files.length > 0) {
        this.handleFileSelected({ target: { files } });
      }
    },

    handleFileSelected(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      // Validate định dạng ảnh & kích thước (< 5MB, JPG/PNG/WEBP, chống path traversal)
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
        this.state.uploadedImage = e.target.result;
        this.state.hasResult = false;
        const previewBox = document.getElementById('aiPortraitViewport') || document.getElementById('aiPreviewBox');
        const emptyUI = document.getElementById('aiEmptyUploadUI');
        const img = document.getElementById('aiSourcePortrait');
        if (previewBox) previewBox.style.display = 'block';
        if (emptyUI) emptyUI.style.display = 'none';
        if (img) img.src = this.state.uploadedImage;
        const statusBadge = document.getElementById('aiUploadStatusBadge');
        if (statusBadge) {
          statusBadge.textContent = 'Sẵn sàng phân tích';
          statusBadge.style.color = '#10B981';
        }
        this._toggleResultState(false);
        if (window.UICommon) window.UICommon.showToast('Đã tải ảnh khuôn mặt lên thành công! Bấm Bắt Đầu Phân Tích để thử kiểu.', 'success');
      };
      reader.readAsDataURL(file);
    },

    runAiRestyle() {
      if (this.state.isScanning) return;

      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle);
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor);

      this.state.isScanning = true;
      this.state.scanProgress = 0;
      this.state.hasResult = false;

      const laser = document.getElementById('aiScanLaserLine');
      const mesh = document.getElementById('aiScanGridMesh');
      const hud = document.getElementById('aiScanHudModal');
      const hudProgress = document.getElementById('aiScanHudProgress');
      const hudSub = document.getElementById('aiScanHudSub');
      const btn = document.getElementById('btnRunAiRestyle');
      const spinner = document.getElementById('aiBtnSpinner');
      const icon = document.getElementById('aiBtnIcon');
      const text = document.getElementById('aiBtnText');

      if (laser) laser.style.display = 'block';
      if (mesh) mesh.style.display = 'block';
      if (hud) hud.style.display = 'flex';
      if (spinner) spinner.style.display = 'inline-block';
      if (icon) icon.style.display = 'none';
      if (text) text.textContent = 'Đang Phân Tích & Biến Đổi 3D...';
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.75';
      }

      // Hiệu ứng quét laser chuyển động
      let laserPos = 0;
      let laserDirection = 1;
      const laserInterval = setInterval(() => {
        laserPos += 4 * laserDirection;
        if (laserPos >= 240) laserDirection = -1;
        if (laserPos <= 10) laserDirection = 1;
        if (laser) laser.style.top = `${laserPos}px`;
      }, 20);

      // Mô phỏng chuỗi 3 pha Neural Network
      const stages = [
        { progress: 30, text: 'Giai đoạn 1/3: Trích xuất Face Landmarks & Tọa độ ngũ quan...' },
        { progress: 70, text: `Giai đoạn 2/3: Dựng lưới đa giác 3D phom tóc [${currentStyle ? currentStyle.name : 'Layer'}]...` },
        { progress: 95, text: `Giai đoạn 3/3: Hòa sắc sợi tóc [${currentColor ? currentColor.name : 'Đen Tự Nhiên'}] & Ray-tracing...` },
        { progress: 100, text: 'Hoàn tất render siêu độ phân giải 4K!' }
      ];

      let stageIdx = 0;
      const stepInterval = setInterval(() => {
        if (stageIdx < stages.length) {
          const currentStage = stages[stageIdx];
          this.state.scanProgress = currentStage.progress;
          if (hudProgress) hudProgress.style.width = `${currentStage.progress}%`;
          if (hudSub) hudSub.textContent = currentStage.text;
          stageIdx++;
        } else {
          clearInterval(stepInterval);
          clearInterval(laserInterval);

          setTimeout(() => {
            this.state.isScanning = false;
            this.state.hasResult = true;

            if (laser) laser.style.display = 'none';
            if (mesh) mesh.style.display = 'none';
            if (hud) hud.style.display = 'none';
            if (spinner) spinner.style.display = 'none';
            if (icon) icon.style.display = 'none';
            if (text) text.textContent = 'Mô Phỏng Kiểu Tóc Ngay →';
            if (btn) {
              btn.disabled = false;
              btn.style.opacity = '1';
            }

            // Cập nhật ảnh kết quả
            const img = document.getElementById('aiSourcePortrait');
            if (img && currentStyle && currentStyle.result) {
              img.src = currentStyle.result;
            }

            this._toggleResultState(true);

            if (window.UICommon) {
              window.UICommon.showToast(`Tạo mẫu 3D "${currentStyle ? currentStyle.name : 'Tóc'}" thành công!`, 'success');
            }
          }, 400);
        }
      }, 500);
    },

    _toggleResultState(hasResult) {
      const actions = document.getElementById('aiResultActions');
      if (actions) actions.style.display = hasResult ? 'flex' : 'none';
    },

    _updateHairstyleUI() {
      this.hairstyles.slice(0, 4).forEach(h => {
        const btn = document.getElementById(`pillStyle_${h.id}`);
        if (!btn) return;
        const isSelected = this.state.selectedHairstyle === h.id;
        btn.classList.toggle('selected', isSelected);
        btn.style.borderColor = isSelected ? '#C59B27' : 'var(--border-color)';
        btn.style.background = 'var(--surface-card)';
        const title = btn.querySelector('strong');
        if (title) title.style.color = isSelected ? '#C59B27' : 'var(--text-primary)';
        const radio = btn.querySelector('div span:last-child');
        if (radio) {
          radio.textContent = isSelected ? '●' : '○';
          radio.style.color = isSelected ? '#C59B27' : 'var(--text-muted)';
        }
      });
    },

    _updateColorUI() {
      this.hairColors.forEach(c => {
        const btn = document.getElementById(`pillColor_${c.id}`);
        if (!btn) return;
        const isSelected = this.state.selectedColor === c.id;
        btn.classList.toggle('selected', isSelected);
        btn.style.borderColor = isSelected ? '#C59B27' : 'var(--border-color)';
        btn.style.background = 'var(--surface-card)';
        const nameSpan = btn.querySelector('span:last-child');
        if (nameSpan) nameSpan.style.color = isSelected ? '#C59B27' : 'var(--text-primary)';
      });
    },

    resetAiRestyle() {
      this.state.hasResult = false;
      const img = document.getElementById('aiSourcePortrait');
      if (img) img.src = this.state.uploadedImage;
      this._toggleResultState(false);
      if (window.UICommon) window.UICommon.showToast('Đã làm mới, mời bạn chọn kiểu hoặc ảnh khác!', 'info');
    },

    saveToGallery() {
      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle);
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor);

      if (window.CustomerWeb && typeof window.CustomerWeb.saveAiResultToGallery === 'function') {
        window.CustomerWeb.saveAiResultToGallery({
          id: 'ai-art-' + Date.now(),
          styleName: currentStyle ? currentStyle.name : 'Kiểu Tóc AI 3D',
          colorName: currentColor ? currentColor.name : 'Đen Tự Nhiên',
          imageUrl: currentStyle ? currentStyle.result : this.state.uploadedImage,
          createdAt: new Date().toISOString()
        });
      }

      if (window.UICommon) {
        window.UICommon.showToast('Đã lưu mẫu tóc vào Thư Viện Cá Nhân của bạn!', 'success');
      }
    },

    bookThisHairstyle() {
      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle);
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor);
      const styleName = currentStyle ? currentStyle.name : 'Tóc Tạo Mẫu AI';
      const colorName = currentColor ? currentColor.name : 'Tự Nhiên';

      const noteText = `[AI 3D RESTYLE] Kiểu tóc yêu cầu: ${styleName} (Màu: ${colorName})`;

      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate(`/booking?service=srv-haircut-men&notes=${encodeURIComponent(noteText)}`);
      } else if (window.CustomerWeb && typeof window.CustomerWeb.switchTab === 'function') {
        window.CustomerWeb.switchTab('booking');
      }
    }
  };

  // Expose to Global
  window.AiStudioPage = AiStudioPage;

})(window);

