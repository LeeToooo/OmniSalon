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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                  <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    ẢNH CHÂN DUNG CỦA BẠN
                  </span>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" onclick="AiStudioPage.openAiSettingsModal()" title="Cài đặt mô hình AI" style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 4px; padding: 3px 8px; color: var(--text-primary); font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                      <span>⚙️</span>
                      <span>Cấu hình AI</span>
                    </button>
                    <span id="aiUploadStatusBadge" style="font-size: 11.5px; color: #10B981; font-weight: 600;">
                      ${this.state.uploadedImage ? 'Sẵn sàng mô phỏng' : 'Chưa chọn ảnh'}
                    </span>
                  </div>
                </div>

                <!-- Dropzone bọc Native Input File -->
                <div id="aiNativeDropZone" 
                     ondragover="event.preventDefault(); this.style.borderColor='#C59B27';"
                     ondragleave="this.style.borderColor='var(--border-color)';"
                     ondrop="AiStudioPage.handleDrop(event)"
                     style="position: relative; border: 1px dashed var(--border-color); border-radius: 6px; background: var(--surface-elevated, #F8FAFC); padding: 18px; text-align: center; cursor: pointer; transition: all 0.2s ease; overflow: hidden; min-height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                  
                  <input type="file" id="aiStudioFileInput" accept="image/*" 
                         onchange="AiStudioPage.handleFileSelected(event)"
                         style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 20;" />

                  <!-- Preview Box with Laser & HUD -->
                  <div id="aiPortraitViewport" class="ai-portrait-viewport" style="position: relative; width: 100%; height: 320px; border-radius: 4px; overflow: hidden; display: ${this.state.uploadedImage ? 'block' : 'none'};">
                    <!-- Ảnh gốc của người dùng -->
                    <img id="aiSourcePortrait" src="${this.state.uploadedImage || ''}" alt="Chân dung gốc" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                    
                    <!-- Ảnh kết quả AI thật được tạo từ Canvas AR Engine -->
                    <img id="aiResultPortrait" src="${this.state.resultImage || ''}" alt="Kiểu tóc mới AI" style="display: ${this.state.hasResult ? 'block' : 'none'}; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 5;">

                    <!-- Laser & HUD hiệu ứng quét nhận diện -->
                    <div id="aiScanLaserLine" class="ai-laser-line" style="display: none; position: absolute; left: 0; right: 0; height: 2px; background: #C59B27; z-index: 10;"></div>
                    <div id="aiScanGridMesh" class="ai-grid-mesh" style="display: none; position: absolute; inset: 0; background-image: radial-gradient(rgba(197, 155, 39, 0.2) 1px, transparent 1px); background-size: 20px 20px; pointer-events: none; z-index: 8;"></div>
                    
                    <div id="aiScanHudModal" style="display: none; position: absolute; inset: 0; background: rgba(20, 20, 19, 0.92); backdrop-filter: blur(4px); flex-direction: column; align-items: center; justify-content: center; z-index: 15; padding: 20px; text-align: center;">
                      <div class="ai-radar-ring" style="width: 44px; height: 44px; border: 2.5px solid rgba(255,255,255,0.1); border-top-color: #C59B27; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;"></div>
                      <div class="font-serif tracking-tight leading-tight" style="font-size: 15px; font-weight: 700; color: #FAF8F5;" id="aiScanHudTitle">HỆ THỐNG ĐANG PHÂN TÍCH KHUÔN MẶT...</div>
                      <div style="font-size: 12px; color: #A1A1AA; margin-top: 4px;" id="aiScanHudSub">Định vị đường nét ngũ quan & phom vòm trán...</div>
                      <div style="width: 180px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 14px; overflow: hidden;">
                        <div id="aiScanHudProgress" style="height: 100%; width: 0%; background: #C59B27; transition: width 0.2s ease;"></div>
                      </div>
                    </div>

                    <!-- Badge trạng thái góc ảnh -->
                    <div id="aiViewBadge" style="display: ${this.state.hasResult ? 'inline-flex' : 'none'}; position: absolute; top: 10px; left: 10px; background: rgba(20,20,19,0.85); color: #C59B27; border: 1px solid rgba(197,155,39,0.4); border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 700; z-index: 12; letter-spacing: 0.5px;">
                      KẾT QUẢ AI
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

                <!-- Thanh công cụ So sánh Trước / Sau -->
                <div id="aiCompareControls" style="display: ${this.state.hasResult ? 'flex' : 'none'}; align-items: center; justify-content: space-between; margin-top: 10px; background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 12px;">
                  <span style="font-size: 11.5px; font-weight: 700; color: var(--text-secondary);">SO SÁNH GƯƠNG MẶT:</span>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" id="btnShowBefore" onclick="AiStudioPage.toggleCompare('before')" style="background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 4px; padding: 4px 10px; font-size: 11.5px; font-weight: 600; cursor: pointer;">
                      Ảnh Gốc
                    </button>
                    <button type="button" id="btnShowAfter" onclick="AiStudioPage.toggleCompare('after')" style="background: #C59B27; border: 1px solid #C59B27; color: #141413; border-radius: 4px; padding: 4px 10px; font-size: 11.5px; font-weight: 700; cursor: pointer;">
                      Tóc Mới AI ✨
                    </button>
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
                  <span id="aiBtnText">Mô Phỏng Kiểu Tóc Thật Ngay →</span>
                </button>

                <!-- Result Actions -->
                <div id="aiResultActions" style="display: ${this.state.hasResult ? 'flex' : 'none'}; gap: 10px; margin-top: 14px; flex-wrap: wrap;">
                  <button type="button" class="nordic-btn-primary" onclick="AiStudioPage.bookThisHairstyle()"
                          style="flex: 1.2; min-width: 150px; padding: 11px 14px; font-size: 13px; font-weight: 700; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer;">
                    Đặt Lịch Cắt Kiểu Này →
                  </button>
                  <button type="button" class="nordic-btn-secondary" onclick="AiStudioPage.downloadResultImage()"
                          style="flex: 1; min-width: 120px; padding: 11px 14px; font-size: 13px; font-weight: 600; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                    📥 Tải Ảnh PNG
                  </button>
                  <button type="button" class="nordic-btn-secondary" onclick="AiStudioPage.resetAiRestyle()"
                          style="padding: 11px 14px; font-size: 13px; font-weight: 600; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                    Thử Kiểu Khác
                  </button>
                </div>

                <!-- Thống kê phân tích phom tóc -->
                <div id="aiAnalysisCard" style="display: ${this.state.hasResult ? 'block' : 'none'}; margin-top: 14px; padding: 12px 14px; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px;">
                  <div style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase; margin-bottom: 6px;">
                    📊 THÔNG SỐ ĐỊNH HÌNH PHOM TÓC
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; color: var(--text-secondary);">
                    <div>• Phom tóc: <strong id="aiStatStyleName" style="color: var(--text-primary);">-</strong></div>
                    <div>• Sắc màu: <strong id="aiStatColorName" style="color: var(--text-primary);">-</strong></div>
                    <div>• Tỷ lệ vòm trán: <strong style="color: #10B981;">Chuẩn Á Đông</strong></div>
                    <div>• Động cơ xử lý: <strong id="aiStatEngineName" style="color: #C59B27;">Canvas AR Vision</strong></div>
                  </div>
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
      this.state.resultImage = null;

      const srcImg = document.getElementById('aiSourcePortrait');
      const resImg = document.getElementById('aiResultPortrait');
      const previewBox = document.getElementById('aiPortraitViewport');
      const emptyUI = document.getElementById('aiEmptyUploadUI');
      const badge = document.getElementById('aiViewBadge');

      if (previewBox) previewBox.style.display = 'block';
      if (emptyUI) emptyUI.style.display = 'none';
      if (srcImg) srcImg.src = url;
      if (resImg) {
        resImg.src = '';
        resImg.style.display = 'none';
      }
      if (badge) badge.style.display = 'none';

      const statusBadge = document.getElementById('aiUploadStatusBadge');
      if (statusBadge) {
        statusBadge.textContent = 'Sẵn sàng mô phỏng';
        statusBadge.style.color = '#10B981';
      }

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
        this.state.resultImage = null;

        const previewBox = document.getElementById('aiPortraitViewport') || document.getElementById('aiPreviewBox');
        const emptyUI = document.getElementById('aiEmptyUploadUI');
        const srcImg = document.getElementById('aiSourcePortrait');
        const resImg = document.getElementById('aiResultPortrait');
        const badge = document.getElementById('aiViewBadge');

        if (previewBox) previewBox.style.display = 'block';
        if (emptyUI) emptyUI.style.display = 'none';
        if (srcImg) srcImg.src = this.state.uploadedImage;
        if (resImg) {
          resImg.src = '';
          resImg.style.display = 'none';
        }
        if (badge) badge.style.display = 'none';

        const statusBadge = document.getElementById('aiUploadStatusBadge');
        if (statusBadge) {
          statusBadge.textContent = 'Sẵn sàng mô phỏng';
          statusBadge.style.color = '#10B981';
        }
        this._toggleResultState(false);
        if (window.UICommon) window.UICommon.showToast('Đã tải ảnh khuôn mặt của bạn lên! Nhấn Mô Phỏng Kiểu Tóc để tạo phom tóc thật.', 'success');
      };
      reader.readAsDataURL(file);
    },

    async runAiRestyle() {
      if (this.state.isScanning) return;

      const sourceImg = document.getElementById('aiSourcePortrait');
      if (!sourceImg || (!this.state.uploadedImage && !sourceImg.src)) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng tải ảnh chân dung lên trước!', 'warning');
        return;
      }

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
      const resultImgEl = document.getElementById('aiResultPortrait');

      if (laser) laser.style.display = 'block';
      if (mesh) mesh.style.display = 'block';
      if (hud) hud.style.display = 'flex';
      if (spinner) spinner.style.display = 'inline-block';
      if (icon) icon.style.display = 'none';
      if (text) text.textContent = 'Đang Phân Tích & Biến Đổi Tóc Thật...';
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.75';
      }
      if (resultImgEl) resultImgEl.style.display = 'none';

      // Hiệu ứng quét laser
      let laserPos = 0;
      let laserDirection = 1;
      const laserInterval = setInterval(() => {
        laserPos += 4 * laserDirection;
        if (laserPos >= 260) laserDirection = -1;
        if (laserPos <= 10) laserDirection = 1;
        if (laser) laser.style.top = `${laserPos}px`;
      }, 20);

      // Mô phỏng chuỗi 4 pha Neural Network
      const stages = [
        { progress: 25, text: 'Giai đoạn 1/4: Phân tích ma trận điểm ảnh & vòm trán người dùng...' },
        { progress: 55, text: `Giai đoạn 2/4: Định hình tỷ lệ ngũ quan & cấu trúc [${currentStyle ? currentStyle.name : 'Tóc'}]...` },
        { progress: 85, text: `Giai đoạn 3/4: Hòa sắc sợi tóc [${currentColor ? currentColor.name : 'Màu sắc'}] & chân tóc 3D...` },
        { progress: 100, text: 'Giai đoạn 4/4: Hoàn tất render ảnh chân dung thật!' }
      ];

      let stageIdx = 0;
      const stepInterval = setInterval(async () => {
        if (stageIdx < stages.length) {
          const currentStage = stages[stageIdx];
          this.state.scanProgress = currentStage.progress;
          if (hudProgress) hudProgress.style.width = `${currentStage.progress}%`;
          if (hudSub) hudSub.textContent = currentStage.text;
          stageIdx++;
        } else {
          clearInterval(stepInterval);
          clearInterval(laserInterval);

          try {
            // GỌI ĐỘNG CƠ THẬT (AiHairEngine)
            let generatedPortraitData = null;
            if (window.AiHairEngine && typeof window.AiHairEngine.generateRestyledPortrait === 'function') {
              generatedPortraitData = await window.AiHairEngine.generateRestyledPortrait(
                sourceImg,
                this.state.selectedHairstyle,
                this.state.selectedColor
              );
            }

            if (!generatedPortraitData) {
              generatedPortraitData = this.state.uploadedImage || sourceImg.src;
            }

            this.state.resultImage = generatedPortraitData;
            this.state.isScanning = false;
            this.state.hasResult = true;

            if (laser) laser.style.display = 'none';
            if (mesh) mesh.style.display = 'none';
            if (hud) hud.style.display = 'none';
            if (spinner) spinner.style.display = 'none';
            if (icon) icon.style.display = 'none';
            if (text) text.textContent = 'Mô Phỏng Kiểu Tóc Thật Ngay →';
            if (btn) {
              btn.disabled = false;
              btn.style.opacity = '1';
            }

            // Cập nhật ảnh kết quả thật
            if (resultImgEl) {
              resultImgEl.src = generatedPortraitData;
              resultImgEl.style.display = 'block';
            }

            this._toggleResultState(true);
            this.toggleCompare('after');

            // Cập nhật stats
            const statStyle = document.getElementById('aiStatStyleName');
            const statColor = document.getElementById('aiStatColorName');
            const statEngine = document.getElementById('aiStatEngineName');
            if (statStyle && currentStyle) statStyle.textContent = currentStyle.name;
            if (statColor && currentColor) statColor.textContent = currentColor.name;
            if (statEngine) {
              const cfg = window.AiHairEngine ? window.AiHairEngine.getCloudConfig() : {};
              statEngine.textContent = (cfg.enabled && cfg.apiKey) ? `${cfg.provider.toUpperCase()} Cloud AI` : 'Canvas AR Hair Shader';
            }

            if (window.UICommon) {
              window.UICommon.showToast(`Đã tạo phom tóc "${currentStyle ? currentStyle.name : ''}" thành công trên khuôn mặt bạn!`, 'success');
            }
          } catch (genErr) {
            console.error('Lỗi sinh ảnh AI:', genErr);
            this.state.isScanning = false;
            if (laser) laser.style.display = 'none';
            if (mesh) mesh.style.display = 'none';
            if (hud) hud.style.display = 'none';
            if (spinner) spinner.style.display = 'none';
            if (text) text.textContent = 'Mô Phỏng Kiểu Tóc Thật Ngay →';
            if (btn) {
              btn.disabled = false;
              btn.style.opacity = '1';
            }
            if (window.UICommon) window.UICommon.showToast('Không thể tạo kiểu tóc: ' + genErr.message, 'error');
          }
        }
      }, 400);
    },

    toggleCompare(mode) {
      const resultImg = document.getElementById('aiResultPortrait');
      const btnBefore = document.getElementById('btnShowBefore');
      const btnAfter = document.getElementById('btnShowAfter');
      const badge = document.getElementById('aiViewBadge');
      if (!resultImg) return;

      if (mode === 'before') {
        resultImg.style.display = 'none';
        if (btnBefore) {
          btnBefore.style.background = '#C59B27';
          btnBefore.style.color = '#141413';
          btnBefore.style.borderColor = '#C59B27';
        }
        if (btnAfter) {
          btnAfter.style.background = 'var(--surface-elevated)';
          btnAfter.style.color = 'var(--text-secondary)';
          btnAfter.style.borderColor = 'var(--border-color)';
        }
        if (badge) {
          badge.textContent = 'ẢNH GỐC';
          badge.style.color = 'var(--text-muted)';
        }
      } else {
        resultImg.style.display = 'block';
        if (btnAfter) {
          btnAfter.style.background = '#C59B27';
          btnAfter.style.color = '#141413';
          btnAfter.style.borderColor = '#C59B27';
        }
        if (btnBefore) {
          btnBefore.style.background = 'var(--surface-elevated)';
          btnBefore.style.color = 'var(--text-secondary)';
          btnBefore.style.borderColor = 'var(--border-color)';
        }
        if (badge) {
          badge.textContent = 'KẾT QUẢ AI';
          badge.style.color = '#C59B27';
        }
      }
    },

    downloadResultImage() {
      const resultImg = this.state.resultImage;
      if (!resultImg) {
        if (window.UICommon) window.UICommon.showToast('Chưa có ảnh kết quả để tải xuống!', 'warning');
        return;
      }
      const a = document.createElement('a');
      a.href = resultImg;
      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle);
      const styleSlug = currentStyle ? currentStyle.id : 'hair';
      a.download = `omnisalon-${styleSlug}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (window.UICommon) window.UICommon.showToast('Đang tải ảnh kiểu tóc về máy của bạn...', 'success');
    },

    openAiSettingsModal() {
      const cfg = window.AiHairEngine ? window.AiHairEngine.getCloudConfig() : { enabled: false, provider: 'huggingface', apiKey: '', endpoint: '' };
      const modalHtml = `
        <div id="aiSettingsModalBackdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px;">
          <div style="background: var(--surface-card, #1c1c1f); border: 1px solid var(--border-color, #333); border-radius: 8px; width: 100%; max-width: 480px; padding: 24px; box-sizing: border-box; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 class="font-serif" style="margin: 0; font-size: 18px; color: var(--text-primary); font-weight: 700;">⚙️ Cấu Hình Động Cơ AI Hair</h3>
              <button type="button" onclick="document.getElementById('aiSettingsModalBackdrop').remove()" style="background: transparent; border: none; font-size: 18px; color: var(--text-secondary); cursor: pointer;">✕</button>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 16px; line-height: 1.5;">
              Hệ thống chạy mặc định bằng <strong>Canvas AR Engine</strong> cục bộ (miễn phí, xử lý tức thì, bảo mật dữ liệu). Bạn có thể cấu hình thêm Cloud GPU AI nếu muốn dùng mô hình đám mây.
            </p>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #C59B27; display: block; margin-bottom: 6px;">CHỌN ĐỘNG CƠ (AI ENGINE):</label>
                <select id="modalAiEngineProvider" style="width: 100%; padding: 8px 12px; border-radius: 6px; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13px;" onchange="const val = this.value; document.getElementById('modalCloudKeyGroup').style.display = (val === 'canvas' ? 'none' : 'block');">
                  <option value="canvas" ${!cfg.enabled ? 'selected' : ''}>Canvas AR Hair Shader (Khuyến nghị - 0s độ trễ, Offline)</option>
                  <option value="huggingface" ${cfg.enabled && cfg.provider === 'huggingface' ? 'selected' : ''}>Hugging Face Inference API (Cloud SDXL)</option>
                  <option value="replicate" ${cfg.enabled && cfg.provider === 'replicate' ? 'selected' : ''}>Replicate API (SDXL Inpainting Cloud GPU)</option>
                </select>
              </div>

              <div id="modalCloudKeyGroup" style="display: ${cfg.enabled ? 'block' : 'none'};">
                <label style="font-size: 12px; font-weight: 700; color: var(--text-primary); display: block; margin-bottom: 6px;">API Key / Access Token:</label>
                <input type="password" id="modalAiApiKey" value="${cfg.apiKey || ''}" placeholder="hf_... hoặc r8_..." style="width: 100%; padding: 8px 12px; border-radius: 6px; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13px; box-sizing: border-box;" />
                <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">Để trống nếu muốn sử dụng Canvas AR Engine mặc định.</span>
              </div>

              <div style="display: flex; gap: 10px; margin-top: 8px;">
                <button type="button" class="nordic-btn-primary" onclick="AiStudioPage.saveAiSettingsFromModal()" style="flex: 1; padding: 10px; background: #C59B27; color: #141413; font-weight: 700; border-radius: 6px; border: 1px solid #C59B27; cursor: pointer;">
                  Lưu Cấu Hình
                </button>
                <button type="button" class="nordic-btn-secondary" onclick="document.getElementById('aiSettingsModalBackdrop').remove()" style="padding: 10px 16px; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    saveAiSettingsFromModal() {
      const provider = document.getElementById('modalAiEngineProvider').value;
      const apiKey = (document.getElementById('modalAiApiKey') ? document.getElementById('modalAiApiKey').value.trim() : '');
      const enabled = (provider !== 'canvas' && apiKey.length > 0);

      if (window.AiHairEngine) {
        window.AiHairEngine.saveCloudConfig({
          enabled,
          provider: (provider === 'canvas' ? 'huggingface' : provider),
          apiKey,
          endpoint: ''
        });
      }

      const modal = document.getElementById('aiSettingsModalBackdrop');
      if (modal) modal.remove();

      if (window.UICommon) {
        const msg = enabled ? `Đã kích hoạt Cloud AI Engine (${provider.toUpperCase()})` : 'Đã chuyển về Canvas AR Studio Engine (Khuyến nghị)';
        window.UICommon.showToast(msg, 'success');
      }
    },

    _toggleResultState(hasResult) {
      const actions = document.getElementById('aiResultActions');
      const compareControls = document.getElementById('aiCompareControls');
      const analysisCard = document.getElementById('aiAnalysisCard');
      if (actions) actions.style.display = hasResult ? 'flex' : 'none';
      if (compareControls) compareControls.style.display = hasResult ? 'flex' : 'none';
      if (analysisCard) analysisCard.style.display = hasResult ? 'block' : 'none';
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
      this.state.resultImage = null;

      const resImg = document.getElementById('aiResultPortrait');
      if (resImg) {
        resImg.src = '';
        resImg.style.display = 'none';
      }
      const badge = document.getElementById('aiViewBadge');
      if (badge) badge.style.display = 'none';

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
          imageUrl: this.state.resultImage || this.state.uploadedImage,
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

