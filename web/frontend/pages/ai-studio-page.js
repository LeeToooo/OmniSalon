// =========================================================================
// Omni Salon — AI HAIR STUDIO 3D (INTERACTIVE NEURAL RESTYLE ENGINE)
// Tuân thủ: .antigravity/rules/03_coder.md, 04_refactor.md, 07_ponytail.md
// Route: "/ai-studio"
// Features: Upload Portrait, 3D Hairstyle Selector, Hair Color Swatches,
//           Neural Scanning Laser Effect, Before/After Slider, Book Hairstyle
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
        name: 'Layer Hàn Quốc Lãng Tử',
        tag: 'HOT TREND 2026',
        desc: 'Tầng layer bay bổng, uốn nhẹ tạo độ phồng tự nhiên cho khuôn mặt Á Đông.',
        preview: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
        result: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'pompadour-luxury',
        name: 'Pompadour Quý Tộc',
        tag: 'EXECUTIVE VIP',
        desc: 'Độ phồng vuốt ngược đỉnh cao, fade sát 2 bên tôn đường nét góc cạnh quyền lực.',
        preview: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
        result: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'mullet-modern',
        name: 'Mullet Hiện Đại Cá Tính',
        tag: 'STREET LUXURY',
        desc: 'Phá cách với gáy dài tỉa so le mềm mại kết hợp side fade sắc bén.',
        preview: 'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=400&q=80',
        result: 'https://images.unsplash.com/photo-1517832606589-7629c3395907?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'sidepart-gentleman',
        name: 'Side Part 7/3 Quý Ông',
        tag: 'CLASSIC GENTLEMAN',
        desc: 'Đường rẽ ngôi tỷ lệ vàng chuẩn mực kết hợp texture tự nhiên.',
        preview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        result: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'buzzcut-fade',
        name: 'Buzz Cut & High Fade',
        tag: 'BOLD & CRISP',
        desc: 'Gọn gàng, tôn trọn vẹn xương quai hàm nam tính và thần thái quyết đoán.',
        preview: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80',
        result: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80'
      }
    ],

    hairColors: [
      { id: 'natural-black', name: 'Đen Tự Nhiên', hex: '#111827', border: '#475569' },
      { id: 'cold-ash-brown', name: 'Nâu Tây Lạnh', hex: '#634735', border: '#A27B5C' },
      { id: 'titan-grey', name: 'Xám Khói Titan', hex: '#71717A', border: '#A1A1AA' },
      { id: 'nordic-platinum', name: 'Bạch Kim Nordic', hex: '#E2E8F0', border: '#D4AF37' }
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
        <div class="omni-container" style="padding-top: 50px; padding-bottom: 80px;">
          <!-- Header Hero -->
          <div style="text-align: center; margin-bottom: 36px;">
            <div class="nordic-hero-badge" style="margin-bottom: 12px;">
              <span>⚡</span> OMNI NEURAL AI VISION STUDIO • 3D HAIR RESTYLE
            </div>
            <h1 style="font-size: clamp(30px, 3.5vw, 46px); font-weight: 900; color: #FFFFFF; letter-spacing: -0.02em;">
              AI Đổi Kiểu Tóc 3D Thực Tế Ảo
            </h1>
            <p style="color: #CBD5E1; font-size: 15px; margin-top: 8px; max-width: 640px; margin-left: auto; margin-right: auto; line-height: 1.6;">
              Mô phỏng 3D phom tóc thực tế theo từng đường nét hộp sọ và ngũ quan trước khi thợ chạm kéo. 100% không rủi ro chọn sai mẫu tóc.
            </p>
          </div>

          <!-- Studio Main Grid (2 Cột: Cột Trái Upload Native Kéo Thả, Cột Phải 4 Pill Buttons + CTA Loading) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 28px; max-width: 1400px; margin: 0 auto; align-items: stretch;">
            
            <!-- CỘT TRÁI: INPUT FILE KÉO THẢ ẢNH CHÂN DUNG NATIVE BỌC STYLE THẺ SANG TRỌNG -->
            <div class="ai-studio-panel" style="background: #10131C; border: 1.5px solid rgba(212, 175, 55, 0.25); border-radius: 20px; padding: 28px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 12px 36px rgba(0,0,0,0.5);">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                  <span style="font-size: 13px; font-weight: 800; color: #F59E0B; letter-spacing: 0.08em; text-transform: uppercase;">
                    📸 CHÂN DUNG CỦA BẠN (PORTRAIT)
                  </span>
                  <span id="aiUploadStatusBadge" style="font-size: 11px; color: #10B981; font-weight: 700;">
                    ${this.state.uploadedImage ? '✓ Sẵn sàng phân tích' : 'Chưa chọn ảnh'}
                  </span>
                </div>

                <!-- Dropzone bọc Native Input File -->
                <div id="aiNativeDropZone" 
                     ondragover="event.preventDefault(); this.style.borderColor='#F59E0B';"
                     ondragleave="this.style.borderColor='rgba(212,175,55,0.35)';"
                     ondrop="AiStudioPage.handleDrop(event)"
                     style="position: relative; border: 2px dashed rgba(212, 175, 55, 0.35); border-radius: 16px; background: #0B0D13; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s ease; overflow: hidden; min-height: 290px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                  
                  <input type="file" id="aiStudioFileInput" accept="image/*" 
                         onchange="AiStudioPage.handleFileSelected(event)"
                         style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 20;" />

                  <!-- Preview Box with Laser & HUD -->
                  <div id="aiPortraitViewport" class="ai-portrait-viewport" style="position: relative; width: 100%; height: 260px; border-radius: 12px; overflow: hidden; display: ${this.state.uploadedImage ? 'block' : 'none'};">
                    <img id="aiSourcePortrait" src="${this.state.uploadedImage || ''}" alt="Chân dung" style="width: 100%; height: 100%; object-fit: cover;">
                    <div id="aiScanLaserLine" class="ai-laser-line" style="display: none; position: absolute; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, #F59E0B, #10B981, #F59E0B, transparent); box-shadow: 0 0 16px #10B981, 0 0 32px #F59E0B; z-index: 10;"></div>
                    <div id="aiScanGridMesh" class="ai-grid-mesh" style="display: none; position: absolute; inset: 0; background-image: radial-gradient(rgba(245, 158, 11, 0.25) 1px, transparent 1px); background-size: 20px 20px; pointer-events: none; z-index: 8;"></div>
                    
                    <div id="aiScanHudModal" style="display: none; position: absolute; inset: 0; background: rgba(11, 13, 19, 0.78); backdrop-filter: blur(4px); flex-direction: column; align-items: center; justify-content: center; z-index: 15; padding: 24px; text-align: center;">
                      <div class="ai-radar-ring" style="width: 50px; height: 50px; border: 3px solid rgba(245, 158, 11, 0.3); border-top-color: #F59E0B; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;"></div>
                      <div style="font-size: 14px; font-weight: 800; color: #FFFFFF;" id="aiScanHudTitle">AI ĐANG PHÂN TÍCH PHOM TÓC...</div>
                      <div style="font-size: 12px; color: #CBD5E1; margin-top: 4px;" id="aiScanHudSub">Nhận diện 128 landmarks khuôn mặt...</div>
                      <div style="width: 180px; height: 5px; background: rgba(255,255,255,0.15); border-radius: 999px; margin-top: 10px; overflow: hidden;">
                        <div id="aiScanHudProgress" style="height: 100%; width: 0%; background: linear-gradient(90deg, #F59E0B, #10B981); transition: width 0.2s ease;"></div>
                      </div>
                    </div>

                    <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 6px; font-size: 11px; color: #CBD5E1; z-index: 12; pointer-events: none;">
                      Bấm hoặc kéo thả ảnh mới để thay đổi
                    </div>
                  </div>

                  <!-- Empty Placeholder UI -->
                  <div id="aiEmptyUploadUI" style="display: ${this.state.uploadedImage ? 'none' : 'flex'}; flex-direction: column; align-items: center; justify-content: center;">
                    <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 12px;">
                      📁
                    </div>
                    <h4 style="font-size: 15px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">Kéo thả ảnh chân dung vào đây</h4>
                    <p style="font-size: 12px; color: #94A3B8; max-width: 260px; margin-bottom: 10px; line-height: 1.4;">
                      hoặc nhấp chuột để chọn ảnh chụp góc thẳng từ máy tính / điện thoại
                    </p>
                    <span class="nordic-btn-secondary" style="font-size: 11px; padding: 6px 14px; pointer-events: none;">
                      Chọn Tệp Ảnh Native
                    </span>
                  </div>
                </div>
              </div>

              <!-- Quick Demo Samples -->
              <div style="margin-top: 18px;">
                <span style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px;">
                  HOẶC DÙNG ẢNH MẪU CHÂN DUNG CÓ SẴN:
                </span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${this.demoPortraits.map(dp => `
                    <button type="button" onclick="AiStudioPage.selectDemoPortrait('${dp.url}')" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 5px 12px; cursor: pointer; color: #E2E8F0; font-size: 12px; font-weight: 600;">
                      <img src="${dp.url}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover;" alt="${dp.name}">
                      <span>${dp.name}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- CỘT PHẢI: DANH SÁCH 4 PHOM TÓC CHỌN NHANH (PILL BUTTONS) + NÚT CTA CÓ LOADING STATE -->
            <div class="ai-studio-panel" style="background: #10131C; border: 1.5px solid rgba(212, 175, 55, 0.25); border-radius: 20px; padding: 28px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 12px 36px rgba(0,0,0,0.5);">
              <div>
                <div style="margin-bottom: 16px;">
                  <span style="font-size: 13px; font-weight: 800; color: #F59E0B; letter-spacing: 0.08em; text-transform: uppercase;">
                    ✂️ DANH SÁCH 4 PHOM TÓC CHỌN NHANH
                  </span>
                  <p style="font-size: 12px; color: #94A3B8; margin-top: 4px;">Chọn 1 phom tóc bên dưới để ướm thử cùng công nghệ AI:</p>
                </div>

                <!-- 4 Pill Buttons -->
                <div class="grid grid-cols-2 gap-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                  ${this.hairstyles.slice(0, 4).map(h => {
                    const isSelected = this.state.selectedHairstyle === h.id;
                    return `
                      <button type="button" 
                              class="nordic-pill-tab ${isSelected ? 'active' : ''}" 
                              id="pillStyle_${h.id}"
                              onclick="AiStudioPage.selectHairstyle('${h.id}')"
                              style="width: 100%; padding: 12px 14px; border-radius: 12px; text-align: left; display: flex; flex-direction: column; gap: 4px; cursor: pointer; border: 1.5px solid ${isSelected ? '#F59E0B' : 'rgba(255,255,255,0.15)'}; background: ${isSelected ? 'rgba(245,158,11,0.2)' : '#161B26'}; transition: all 0.2s ease;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                          <strong style="color: ${isSelected ? '#F59E0B' : '#FFFFFF'} !important; font-size: 13px;">${h.name}</strong>
                          <span style="color: ${isSelected ? '#F59E0B' : '#94A3B8'}; font-size: 13px;">${isSelected ? '●' : '○'}</span>
                        </div>
                        <span style="font-size: 11px; color: ${isSelected ? '#FDE68A' : '#94A3B8'} !important; line-height: 1.3;">${h.tag}</span>
                      </button>
                    `;
                  }).join('')}
                </div>

                <!-- Color Swatches -->
                <div style="margin-bottom: 20px;">
                  <span style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px;">
                    MÀU NHUỘM PHỐI HỢP:
                  </span>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${this.hairColors.map(c => {
                      const isSelected = this.state.selectedColor === c.id;
                      return `
                        <button type="button" onclick="AiStudioPage.selectColor('${c.id}')"
                                style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; cursor: pointer; border: 1px solid ${isSelected ? '#F59E0B' : 'rgba(255,255,255,0.1)'}; background: ${isSelected ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)'}; color: #FFFFFF; font-size: 11px; font-weight: 600;">
                          <span style="width: 12px; height: 12px; border-radius: 50%; background: ${c.hex}; display: inline-block;"></span>
                          <span>${c.name}</span>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>

              <!-- NÚT CTA 'Tạo Kiểu Ngay' CÓ LOADING STATE -->
              <div>
                <button type="button" class="nordic-btn-primary btn-magnetic" id="btnRunAiRestyle" onclick="AiStudioPage.runAiRestyle()"
                        style="width: 100%; height: 50px; font-size: 14px; font-weight: 900; letter-spacing: 0.03em; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #0F172A; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);">
                  <span id="aiBtnSpinner" style="display: none; width: 18px; height: 18px; border: 2px solid #0F172A; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                  <span id="aiBtnIcon">⚡</span>
                  <span id="aiBtnText">Tạo Kiểu Ngay</span>
                </button>

                <!-- Result Actions -->
                <div id="aiResultActions" style="display: ${this.state.hasResult ? 'flex' : 'none'}; gap: 10px; margin-top: 12px;">
                  <button type="button" class="nordic-btn-primary" onclick="AiStudioPage.bookThisHairstyle()"
                          style="flex: 1; padding: 11px 14px; font-size: 12px; font-weight: 800; background: #10B981; color: #FFFFFF; border: none; border-radius: 10px; cursor: pointer;">
                    📅 Đặt Lịch Làm Kiểu Này →
                  </button>
                  <button type="button" class="nordic-btn-secondary" onclick="AiStudioPage.resetAiRestyle()" style="padding: 11px 14px; font-size: 12px; font-weight: 700;">
                    🔄 Thử Mẫu Khác
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
        window.UICommon.showToast(`✂️ Đã chọn phom tóc: ${found.name}`, 'info');
      }
      this._updateHairstyleUI();
    },

    selectColor(colorId) {
      this.state.selectedColor = colorId;
      const found = this.hairColors.find(c => c.id === colorId);
      if (found && window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`🎨 Đã chọn màu nhuộm: ${found.name}`, 'info');
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
        window.UICommon.showToast('✅ Đã nạp ảnh mẫu chân dung HD', 'success');
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
        if (window.UICommon) window.UICommon.showToast('⚠️ Tên tệp chứa ký tự không an toàn!', 'error');
        return;
      }

      if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExtensions.test(fileName)) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WEBP hợp lệ!', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        if (window.UICommon) window.UICommon.showToast('⚠️ Dung lượng ảnh không được vượt quá 5MB!', 'error');
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
          statusBadge.textContent = '✓ Sẵn sàng phân tích';
          statusBadge.style.color = '#10B981';
        }
        this._toggleResultState(false);
        if (window.UICommon) window.UICommon.showToast('📸 Đã tải ảnh khuôn mặt lên thành công! Bấm Bắt Đầu Phân Tích để thử kiểu.', 'success');
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
            if (icon) icon.style.display = 'inline';
            if (text) text.textContent = 'Bắt Đầu Phân Tích & Thử Kiểu';
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
              window.UICommon.showToast(`🎉 Tạo mẫu 3D "${currentStyle ? currentStyle.name : 'Tóc'}" thành công!`, 'success');
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
        btn.style.borderColor = isSelected ? '#F59E0B' : 'rgba(255,255,255,0.1)';
        btn.style.background = isSelected ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)';
        const radio = btn.querySelector('div span:last-child');
        if (radio) {
          radio.textContent = isSelected ? '●' : '○';
          radio.style.color = isSelected ? '#F59E0B' : 'rgba(255,255,255,0.3)';
        }
      });
    },

    _updateColorUI() {
      const container = document.querySelector('.ai-controls-panel');
      if (container) {
        const currentContainer = document.getElementById('webMainContainer');
        if (currentContainer) this.render(currentContainer);
      }
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
        window.UICommon.showToast('💾 Đã lưu mẫu tóc vào Thư Viện Cá Nhân của bạn!', 'success');
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

