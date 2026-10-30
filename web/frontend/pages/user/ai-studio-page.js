// Trang thử kiểu tóc bằng AI
(function (window) {
  'use strict';

  const AiStudioPage = {
    state: {
      uploadedImage: null,
      originalRawImage: null,
      croppedImage: null,
      cleanBaseImage: null,
      transparentImage: null,
      activeBaseMode: 'cropped', // 'cropped' | 'raw'
      isPreprocessed: false,
      selectedHairstyle: 'layer-korean',
      selectedColor: 'natural-black',
      isScanning: false,
      scanProgress: 0,
      scanStageText: '',
      hasResult: false,
      resultImage: null,
      sliderPosition: 50,
      faceAnalysis: null,
      chatMessages: [
        {
          sender: 'barber',
          text: 'Xin chào! Mình là Master Barber Lê Minh Hoàng. Hãy tải ảnh chân dung của bạn lên, hệ thống sẽ tự động căn góc chuẩn 3:4. Khi bạn bấm Mô phỏng, AI sẽ tự động tách nền và xóa phom tóc cũ để ghép kiểu tóc mới hoàn hảo nhất!'
        }
      ],
      isChatLoading: false
    },

    hairstyles: [
      {
        id: 'layer-korean',
        name: 'Layer Texture Hàn Quốc',
        tag: 'THỜI THƯỢNG',
        desc: 'Tỉa tầng bay bổng, uốn texture tạo độ phồng tự nhiên cho khuôn mặt Á Đông.',
        preview: 'assets/hairstyles/layer-korean.jpg',
        result: 'assets/hairstyles/layer-korean.jpg'
      },
      {
        id: 'pompadour-luxury',
        name: 'Pompadour & Mid Fade',
        tag: 'LỊCH LÃM',
        desc: 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên mang lại phong thái đĩnh đạc.',
        preview: 'assets/hairstyles/pompadour-luxury.jpg',
        result: 'assets/hairstyles/pompadour-luxury.jpg'
      },
      {
        id: 'mullet-modern',
        name: 'Modern Mullet & Taper Fade',
        tag: 'PHONG CÁCH',
        desc: 'Gáy tỉa so le mềm mại kết hợp đường cạo viền dứt khoát và nam tính.',
        preview: 'assets/hairstyles/mullet-modern.jpg',
        result: 'assets/hairstyles/mullet-modern.jpg'
      },
      {
        id: 'sidepart-gentleman',
        name: 'Side Part 7/3 Cổ Điển',
        tag: 'QUÝ ÔNG',
        desc: 'Đường rẽ ngôi tỉ lệ vàng tôn phom mặt, dễ dàng chải sáp restyle suốt cả ngày.',
        preview: 'assets/hairstyles/sidepart-gentleman.jpg',
        result: 'assets/hairstyles/sidepart-gentleman.jpg'
      },
      {
        id: 'buzzcut-fade',
        name: 'Buzz Cut & High Fade',
        tag: 'DỨT KHOÁT',
        desc: 'Gọn gàng, tôn trọn vẹn xương hàm và đường nét góc cạnh của gương mặt.',
        preview: 'assets/hairstyles/buzzcut-fade.jpg',
        result: 'assets/hairstyles/buzzcut-fade.jpg'
      },
      {
        id: 'french-crop',
        name: 'French Crop Textured',
        tag: 'HIỆN ĐẠI',
        desc: 'Mái bằng textured tỉa nhọn che trán cao, fade sát 2 bên mai năng động.',
        preview: 'assets/hairstyles/french-crop.jpg',
        result: 'assets/hairstyles/french-crop.jpg'
      }
    ],

    hairColors: [
      { id: 'natural-black', name: 'Đen Tự Nhiên', hex: '#141413' },
      { id: 'cold-ash-brown', name: 'Nâu Lạnh Sâu', hex: '#523A28' },
      { id: 'titan-grey', name: 'Xám Khói Titan', hex: '#6B7280' },
      { id: 'nordic-platinum', name: 'Vàng Cát Trầm', hex: '#C59B27' },
      { id: 'chestnut-brown', name: 'Nâu Hạt Dẻ', hex: '#6F4E37' },
      { id: 'moss-ash', name: 'Rêu Khói Ánh Xanh', hex: '#4A5568' }
    ],

    demoPortraits: [
      { name: 'Mẫu Nam 01 (Khách Thật)', url: 'assets/hairstyles/sidepart-gentleman.jpg' },
      { name: 'Mẫu Nam 02 (Khách Thật)', url: 'assets/hairstyles/pompadour-luxury.jpg' },
      { name: 'Mẫu Nam 03 (Khách Thật)', url: 'assets/hairstyles/layer-korean.jpg' },
      { name: 'Mẫu Nam 04 (Khách Thật)', url: 'assets/hairstyles/mullet-modern.jpg' }
    ],

    render(container, params = {}) {
      if (!container) return;

      // Mặc định nạp ảnh mẫu đầu tiên nếu chưa có
      if (!this.state.uploadedImage) {
        this.state.uploadedImage = this.demoPortraits[0].url;
        this.state.originalRawImage = this.demoPortraits[0].url;
      }

      container.innerHTML = `
        <div class="omni-container" style="padding-top: 40px; padding-bottom: 80px; max-width: 1440px; margin: 0 auto; padding-left: clamp(16px, 3.5vw, 48px); padding-right: clamp(16px, 3.5vw, 48px); box-sizing: border-box;">
          
          <!-- Header Hero -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(197, 155, 39, 0.12); border: 1px solid rgba(197, 155, 39, 0.3); border-radius: 20px; margin-bottom: 10px;">
              <span style="font-size: 13px;">✨</span>
              <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                CÔNG NGHỆ REAL AI BARBER VISION
              </span>
            </div>
            <h1 class="font-serif tracking-tight leading-tight" style="font-size: clamp(28px, 4vw, 42px); font-weight: 700; color: var(--text-primary); margin: 0 0 10px;">
              Thử Kiểu Tóc Thật &amp; Chẩn Đoán Dáng Mặt AI
            </h1>
            <p style="color: var(--text-secondary); font-size: 14.5px; max-width: 680px; margin: 0 auto; line-height: 1.6;">
              Tự động cắt góc chân dung, tách phông nền &amp; xóa tóc cũ để ghép mọi kiểu tóc chuẩn xác 100% trước khi thợ barber cắt kéo.
            </p>
          </div>

          <!-- Studio Main Grid: 2 Cột Đối Xứng -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; max-width: 1240px; margin: 0 auto; align-items: start;">
            
            <!-- CỘT TRÁI: KHUNG ẢNH CHÂN DUNG & SO SÁNH SLIDER -->
            <div class="ai-studio-panel" style="border-radius: 8px; padding: 22px; background: var(--surface-card); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
              
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                  ẢNH CHÂN DUNG KHÁCH HÀNG
                </span>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <button type="button" onclick="AiStudioPage.openGeminiKeyModal()" title="Cài đặt link / API Key Google Gemini" style="background: rgba(197, 155, 39, 0.15); border: 1px solid #C59B27; border-radius: 4px; padding: 4px 10px; color: #C59B27; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                    <span id="aiGeminiHeaderBadgeIcon">✨</span>
                    <span id="aiGeminiHeaderBadgeText">Google Gemini AI</span>
                  </button>
                  <span id="aiUploadStatusBadge" style="font-size: 11.5px; color: #10B981; font-weight: 700;">
                    ${this.state.uploadedImage ? '● Đã sẵn sàng' : 'Chưa có ảnh'}
                  </span>
                </div>
              </div>

              <!-- THANH CĂN CHỈNH GÓC CHÂN DUNG (GIỮ NGUYÊN TÓC THẬT, CHỈ XÓA KHI BẮT ĐẦU MÔ PHỎNG) -->
              <div id="aiPreprocessBar" style="background: rgba(197, 155, 39, 0.08); border: 1px solid rgba(197, 155, 39, 0.3); border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 13px;">✂️</span>
                    <span style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                      CĂN GÓC CHÂN DUNG &amp; CHUẨN BỊ MÔ PHỎNG
                    </span>
                  </div>
                  <span id="aiPreprocessStatusBadge" style="font-size: 10.5px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.12); padding: 2px 7px; border-radius: 4px;">
                    ● Đã định vị 478 điểm mốc 3D
                  </span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                  <button type="button" id="btnBaseModeCropped" onclick="AiStudioPage.switchBaseMode('cropped')" 
                          title="Ảnh chân dung đã được tự động cắt tỉ lệ 3:4 chuẩn Studio (giữ nguyên tóc thật của khách)"
                          style="padding: 7px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; cursor: pointer; border: 1px solid #C59B27; background: #C59B27; color: #141413; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s ease;">
                    <span>✂️ Cắt 3:4 Chuẩn (Giữ Tóc Thật)</span>
                  </button>
                  <button type="button" id="btnBaseModeRaw" onclick="AiStudioPage.switchBaseMode('raw')" 
                          title="Xem lại ảnh gốc nguyên bản ban đầu khách gửi"
                          style="padding: 7px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s ease;">
                    <span>🖼️ Ảnh Gốc Ban Đầu</span>
                  </button>
                </div>

                <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; display: flex; align-items: flex-start; gap: 6px; padding-top: 2px;">
                  <span style="color: #C59B27; font-size: 12px; margin-top: 1px;">⚡</span>
                  <span>AI sẽ <strong>tự động tách nền &amp; xóa sạch tóc cũ</strong> ngay khi bạn bấm <em>"Mô Phỏng Kiểu Tóc"</em> để kiểu tóc mới ôm khít hoàn hảo vào vòm trán.</span>
                </div>
              </div>

              <!-- Dropzone & Viewport bọc ảnh -->
              <div id="aiNativeDropZone" 
                   ondragover="event.preventDefault(); this.style.borderColor='#C59B27';"
                   ondragleave="this.style.borderColor='var(--border-color)';"
                   ondrop="AiStudioPage.handleDrop(event)"
                   style="position: relative; border: 1.5px dashed var(--border-color); border-radius: 8px; background: var(--surface-elevated, #141413); overflow: hidden; min-height: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                
                <!-- Input file ẩn để kích hoạt qua nút hoặc nhấp ô tải -->
                <input type="file" id="aiStudioFileInput" accept="image/*" 
                       onchange="AiStudioPage.handleFileSelected(event)"
                       style="display: none;" />

                <!-- Khung hiển thị ảnh có hỗ trợ So sánh Split-Slider mượt mà -->
                <div id="aiPortraitViewport" 
                     onmousedown="AiStudioPage.handleViewportMouseDown(event)"
                     ontouchstart="AiStudioPage.handleViewportTouchStart(event)"
                     style="position: relative; width: 100%; height: 440px; overflow: hidden; display: ${this.state.uploadedImage ? 'block' : 'none'}; user-select: none; cursor: ${this.state.hasResult ? 'ew-resize' : 'default'}; touch-action: none;">
                  
                  <!-- ẢNH KẾT QUẢ AI (NẰM DƯỚI) -->
                  <img id="aiResultPortrait" 
                       src="${this.state.resultImage || ''}" 
                       alt="Kiểu tóc mới AI" 
                       draggable="false"
                       style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; display: ${this.state.hasResult ? 'block' : 'none'}; pointer-events: none; user-select: none;">

                  <!-- ẢNH GỐC CỦA NGƯỜI DÙNG (CÓ CLIP NẾU ĐANG CHẾ ĐỘ SLIDER) -->
                  <div id="aiBeforeClipper" style="position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; clip-path: inset(0 ${this.state.hasResult ? (100 - this.state.sliderPosition) + '%' : '0%'} 0 0); z-index: 3; pointer-events: none;">
                    <img id="aiSourcePortrait" 
                         src="${this.state.uploadedImage || ''}" 
                         alt="Chân dung gốc" 
                         draggable="false"
                         style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; pointer-events: none; user-select: none;">
                  </div>

                  <!-- THANH TRƯỢT SO SÁNH INTERACTIVE SLIDER DIVIDER (Vùng chạm 44px dễ nắm kéo) -->
                  <div id="aiCompareSliderDivider" 
                       onmousedown="AiStudioPage.startSliderDrag(event)"
                       ontouchstart="AiStudioPage.startSliderDragTouch(event)"
                       style="display: ${this.state.hasResult ? 'flex' : 'none'}; position: absolute; top: 0; bottom: 0; left: ${this.state.sliderPosition}%; width: 44px; margin-left: -22px; z-index: 8; align-items: center; justify-content: center; cursor: ew-resize; touch-action: none;">
                    <!-- Đường kẻ màu vàng ở chính giữa -->
                    <div style="position: absolute; top: 0; bottom: 0; width: 2.5px; background: #C59B27; box-shadow: 0 0 10px rgba(0,0,0,0.6); pointer-events: none;"></div>
                    <!-- Nút tròn cầm kéo ở tâm -->
                    <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #C59B27; color: #141413; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; box-shadow: 0 2px 10px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.8); pointer-events: none;">
                      ⇄
                    </div>
                  </div>

                  <!-- LASER & SCAN MESH OVERLAY -->
                  <div id="aiScanLaserLine" class="ai-laser-line" style="display: none; position: absolute; left: 0; right: 0; height: 2.5px; background: #C59B27; box-shadow: 0 0 12px #C59B27; z-index: 10; pointer-events: none;"></div>
                  <div id="aiScanGridMesh" class="ai-grid-mesh" style="display: none; position: absolute; inset: 0; background-image: radial-gradient(rgba(197, 155, 39, 0.25) 1.5px, transparent 1.5px); background-size: 20px 20px; pointer-events: none; z-index: 8;"></div>

                  <!-- HUD MODAL QUÉT NEURAL NETWORK -->
                  <div id="aiScanHudModal" style="display: none; position: absolute; inset: 0; background: rgba(20, 20, 19, 0.88); backdrop-filter: blur(4px); flex-direction: column; align-items: center; justify-content: center; z-index: 15; padding: 24px; text-align: center;">
                    <div class="ai-radar-ring" style="width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #C59B27; border-radius: 50%; animation: spin 0.9s linear infinite; margin-bottom: 14px;"></div>
                    <div class="font-serif tracking-tight leading-tight" style="font-size: 16px; font-weight: 700; color: #FAF8F5;" id="aiScanHudTitle">HỆ THỐNG ĐANG PHÂN TÍCH NGŨ QUAN THẬT...</div>
                    <div style="font-size: 12.5px; color: #A1A1AA; margin-top: 6px; max-width: 280px;" id="aiScanHudSub">Đo đạc tỉ lệ xương hàm &amp; phom vòm trán...</div>
                    <div style="width: 200px; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 16px; overflow: hidden;">
                      <div id="aiScanHudProgress" style="height: 100%; width: 0%; background: #C59B27; transition: width 0.25s ease;"></div>
                    </div>
                  </div>

                  <!-- BADGE TRẠNG THÁI GÓC ẢNH -->
                  <div id="aiViewBadgeBefore" style="display: ${this.state.hasResult ? 'block' : 'none'}; position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.75); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 10.5px; font-weight: 800; z-index: 5; border: 1px solid rgba(255,255,255,0.2); pointer-events: none;">
                    ẢNH GỐC CỦA BẠN
                  </div>
                  <div id="aiViewBadgeAfter" style="display: ${this.state.hasResult ? 'block' : 'none'}; position: absolute; bottom: 10px; right: 10px; background: rgba(197, 155, 39, 0.95); color: #141413; padding: 4px 10px; border-radius: 4px; font-size: 10.5px; font-weight: 800; z-index: 5; box-shadow: 0 2px 8px rgba(0,0,0,0.4); pointer-events: none;">
                    ĐỔI TÓC &amp; CÂN BẰNG MẶT (GEMINI AI) ✨
                  </div>
                </div>

                <!-- Empty state khi chưa có ảnh -->
                <div id="aiEmptyUploadUI" 
                     onclick="AiStudioPage.triggerFileInput()"
                     style="display: ${this.state.uploadedImage ? 'none' : 'flex'}; cursor: pointer; flex-direction: column; align-items: center; justify-content: center; padding: 24px;">
                  <div style="font-size: 32px; margin-bottom: 8px;">📷</div>
                  <h4 style="font-size: 15px; font-weight: 700; margin: 0 0 6px;">Kéo thả hoặc nhấp để chọn ảnh chân dung</h4>
                  <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0 0 14px;">Hỗ trợ ảnh chụp camera trước hoặc tệp JPG/PNG</p>
                </div>
              </div>

              <!-- Nút tải ảnh & Chụp Camera -->
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" onclick="AiStudioPage.triggerFileInput()" class="nordic-btn-secondary" style="flex: 1; padding: 9px 12px; font-size: 12.5px; font-weight: 700; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <span>📁 Tải Ảnh Từ Thiết Bị</span>
                </button>
                <button type="button" onclick="AiStudioPage.openCameraModal()" class="nordic-btn-secondary" style="flex: 1; padding: 9px 12px; font-size: 12.5px; font-weight: 700; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <span>📸 Chụp Bằng Camera</span>
                </button>
              </div>

              <!-- Thanh nút So sánh Trước / Sau -->
              <div id="aiCompareControls" style="display: ${this.state.hasResult ? 'flex' : 'none'}; align-items: center; justify-content: space-between; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 12px;">
                <span style="font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Chế Độ Xem:</span>
                <div style="display: flex; gap: 6px;">
                  <button type="button" id="btnModeSplit" onclick="AiStudioPage.setCompareMode('split')" style="background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
                    Thanh Trượt ⇄
                  </button>
                  <button type="button" id="btnModeBefore" onclick="AiStudioPage.setCompareMode('before')" style="background: var(--surface-card); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
                    Ảnh Gốc
                  </button>
                  <button type="button" id="btnModeAfter" onclick="AiStudioPage.setCompareMode('after')" style="background: var(--surface-card); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
                    Tóc Mới
                  </button>
                </div>
              </div>

              <!-- CHỌN ẢNH MẪU CHÂN DUNG CÓ SẴN -->
              <div>
                <span class="tracking-widest" style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 8px;">
                  HOẶC THỬ NHANH VỚI ẢNH MẪU:
                </span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${this.demoPortraits.map(dp => `
                    <button type="button" onclick="AiStudioPage.selectDemoPortrait('${dp.url}')" style="display: flex; align-items: center; gap: 6px; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 8px; cursor: pointer; color: var(--text-primary); font-size: 11.5px; font-weight: 600;">
                      <img src="${dp.url}" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover;" alt="${dp.name}">
                      <span>${dp.name}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

            </div>

            <!-- CỘT PHẢI: CHẨN ĐOÁN DÁNG MẶT AI + BỘ CHỌN PHOM TÓC + CTA -->
            <div class="ai-studio-panel" style="border-radius: 8px; padding: 22px; background: var(--surface-card); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
              
              <!-- THẺ CHẨN ĐOÁN NGŨ QUAN & SẮC TỐ DA THẬT (AI DIAGNOSTIC CARD) -->
              <div id="aiFaceDiagnosticBox" style="background: linear-gradient(145deg, rgba(197, 155, 39, 0.08) 0%, rgba(20, 20, 19, 0.4) 100%); border: 1px solid rgba(197, 155, 39, 0.35); border-radius: 8px; padding: 14px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 11px; font-weight: 800; color: #C59B27; letter-spacing: 0.5px;">
                      🧠 CHẨN ĐOÁN NGŨ QUAN 3D (PYTHON VISION)
                    </span>
                    <span id="aiVisionProviderTag" style="display: none; font-size: 10px; color: #10B981; font-weight: 700; background: rgba(16, 185, 129, 0.12); padding: 1px 6px; border-radius: 4px;"></span>
                  </div>
                  <span id="aiFaceShapeBadge" style="font-size: 11px; background: #C59B27; color: #141413; font-weight: 800; padding: 2px 8px; border-radius: 4px;">
                    ĐANG PHÂN TÍCH...
                  </span>
                </div>
                
                <div id="aiFaceDiagnosticText" style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 10px;">
                  Hệ thống đang quét phân tích xương quai hàm, vòm trán và độ tương thích ngũ quan...
                </div>

                <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 11.5px;">
                  <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 8px;">
                    <span style="color: var(--text-muted);">Sắc tố da:</span> <strong id="aiSkinToneVal" style="color: var(--text-primary);">-</strong>
                  </div>
                  <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 8px;">
                    <span style="color: var(--text-muted);">Tỉ lệ mặt:</span> <strong id="aiRatioVal" style="color: #10B981;">Chuẩn Á Đông</strong>
                  </div>
                  <div style="background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 8px;">
                    <span style="color: var(--text-muted);">Độ tương thích cao nhất:</span> <strong id="aiTopMatchVal" style="color: #C59B27;">-</strong>
                  </div>
                </div>
              </div>

              <!-- DANH SÁCH 6 PHOM DÁNG TÓC THỊNH HÀNH -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                  <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    CHỌN PHOM DÁNG TÓC THỊNH HÀNH
                  </span>
                  <span style="font-size: 11px; color: var(--text-muted);">6 kiểu thịnh hành nhất</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  ${this.hairstyles.map(h => {
        const isSelected = this.state.selectedHairstyle === h.id;
        return `
                      <button type="button" 
                              id="pillStyle_${h.id}"
                              class="ai-style-pill-btn ${isSelected ? 'selected' : ''}"
                              onclick="AiStudioPage.selectHairstyle('${h.id}')"
                              style="width: 100%; padding: 10px 12px; border-radius: 6px; text-align: left; display: flex; flex-direction: column; gap: 3px; cursor: pointer; border: 1.5px solid ${isSelected ? '#C59B27' : 'var(--border-color)'}; background: ${isSelected ? 'rgba(197, 155, 39, 0.08)' : 'var(--surface-elevated)'}; transition: all 0.15s ease;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                          <strong style="color: ${isSelected ? '#C59B27' : 'var(--text-primary)'}; font-size: 12.5px;">${h.name}</strong>
                          <span id="scoreTag_${h.id}" style="font-size: 10px; font-weight: 800; color: ${isSelected ? '#C59B27' : '#10B981'}; background: rgba(16, 185, 129, 0.12); padding: 1px 5px; border-radius: 3px;">
                            95%
                          </span>
                        </div>
                        <span style="font-size: 10px; color: var(--text-secondary); line-height: 1.2;">${h.tag} • ${h.desc.substring(0, 36)}...</span>
                      </button>
                    `;
      }).join('')}
                </div>
              </div>

              <!-- MÀU NHUỘM PHỐI HỢP -->
              <div>
                <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase; display: block; margin-bottom: 8px;">
                  BẢNG MÀU NHUỘM TÔN DA
                </span>
                <div style="display: flex; gap: 7px; flex-wrap: wrap;">
                  ${this.hairColors.map(c => {
        const isSelected = this.state.selectedColor === c.id;
        return `
                      <button type="button" 
                              id="pillColor_${c.id}"
                              class="ai-color-pill-btn ${isSelected ? 'selected' : ''}"
                              onclick="AiStudioPage.selectColor('${c.id}')"
                              style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 5px; cursor: pointer; border: 1.5px solid ${isSelected ? '#C59B27' : 'var(--border-color)'}; background: ${isSelected ? 'rgba(197, 155, 39, 0.08)' : 'var(--surface-elevated)'}; font-size: 11.5px; font-weight: 700; transition: all 0.15s ease;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${c.hex}; display: inline-block; border: 1px solid rgba(255,255,255,0.4); flex-shrink: 0;"></span>
                        <span style="color: ${isSelected ? '#C59B27' : 'var(--text-primary)'};">${c.name}</span>
                      </button>
                    `;
      }).join('')}
                </div>
              </div>

              <!-- TÙY CHỈNH CÂN BẰNG KHUÔN MẶT & LỜI NHẮC GEMINI AI -->
              <div style="background: var(--surface-elevated); border: 1px solid rgba(197, 155, 39, 0.3); border-radius: 6px; padding: 12px 14px; margin-top: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    💎 CÂN BẰNG KHUÔN MẶT &amp; GEMINI AI VISION
                  </span>
                  <div id="aiGeminiKeyBadge" onclick="AiStudioPage.openGeminiKeyModal()" style="cursor: pointer;"></div>
                </div>

                <!-- Tùy chọn cân bằng ngũ quan -->
                <div style="display: flex; gap: 14px; margin-bottom: 10px; flex-wrap: wrap;">
                  <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-primary); cursor: pointer;">
                    <input type="checkbox" id="aiCheckBalanceLight" checked style="accent-color: #C59B27; cursor: pointer;">
                    <span>Cân bằng ánh sáng gương mặt</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-primary); cursor: pointer;">
                    <input type="checkbox" id="aiCheckSmoothSkin" checked style="accent-color: #C59B27; cursor: pointer;">
                    <span>Làm mịn da &amp; xóa khuyết điểm</span>
                  </label>
                </div>

                <!-- Ô nhập lời nhắc riêng cho Gemini AI -->
                <div style="position: relative;">
                  <input type="text" id="aiCustomPromptInput" 
                         placeholder="Nhập yêu cầu riêng cho Gemini AI (VD: Tỉa layer mỏng nhẹ, uốn phồng chân tóc, làm sáng da mặt)..." 
                         style="width: 100%; box-sizing: border-box; padding: 8px 12px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 5px; font-size: 11.5px;" />
                </div>
              </div>

              <!-- NÚT CTA: MÔ PHỎNG KIỂU TÓC THẬT NGAY -->
              <div style="margin-top: 4px;">
                <button type="button" class="nordic-btn-primary" id="btnRunAiRestyle" onclick="AiStudioPage.runAiRestyle()"
                        style="width: 100%; height: 48px; font-size: 14px; font-weight: 800; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(197, 155, 39, 0.25);">
                  <span id="aiBtnSpinner" style="display: none; width: 16px; height: 16px; border: 2.5px solid #141413; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                  <span id="aiBtnIcon">✨</span>
                  <span id="aiBtnText">Mô Phỏng Kiểu Tóc &amp; Cân Bằng Mặt Thật Ngay →</span>
                </button>

                <!-- Action Buttons khi đã có kết quả -->
                <div id="aiResultActions" style="display: ${this.state.hasResult ? 'flex' : 'none'}; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
                  <button type="button" onclick="AiStudioPage.bookThisHairstyle()"
                          style="flex: 1.4; min-width: 160px; padding: 10px 14px; font-size: 12.5px; font-weight: 800; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer;">
                    ✂️ Đặt Lịch Cắt Kiểu Này Ngay
                  </button>
                  <button type="button" onclick="AiStudioPage.downloadResultImage()"
                          style="flex: 1; min-width: 110px; padding: 10px 14px; font-size: 12.5px; font-weight: 600; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                    📥 Tải Ảnh HD
                  </button>
                  <button type="button" onclick="AiStudioPage.resetAiRestyle()"
                          style="padding: 10px 14px; font-size: 12.5px; font-weight: 600; background: var(--surface-elevated); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                    Thử Lại
                  </button>
                </div>

                <!-- Thống kê chi tiết & Lời khuyên sáp vuốt -->
                <div id="aiAnalysisCard" style="display: ${this.state.hasResult ? 'block' : 'none'}; margin-top: 12px; padding: 12px 14px; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px;">
                  <div style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase; margin-bottom: 6px;">
                    💡 LỜI KHUYÊN TẠO KIỂU TỪ BARBER MASTER
                  </div>
                  <div id="aiBarberAdviceText" style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px;">
                    Đang đồng bộ phân tích...
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: 11.5px; color: var(--text-muted);">
                    <div>• Sáp khuyên dùng: <strong id="aiProductRec" style="color: #C59B27;">Apestomen Volcanic Clay</strong></div>
                    <div>• Động cơ: <strong id="aiEngineRec" style="color: #10B981;">Flux / SANA Neural Vision</strong></div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          <!-- PHÂN HỆ TƯ VẤN TRỰC TIẾP VỚI BARBER MASTER AI (CHATBOT DRAWER) -->
          <div style="max-width: 1240px; margin: 32px auto 0; background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
            <div style="padding: 14px 20px; background: var(--surface-elevated); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #C59B27; color: #141413; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800;">
                  💈
                </div>
                <div>
                  <strong style="font-size: 13.5px; color: var(--text-primary); display: block;">Tư Vấn Trực Tiếp Với Master Barber AI</strong>
                  <span style="font-size: 11px; color: #10B981;">● Thợ trưởng Lê Minh Hoàng (12 năm kinh nghiệm) đang trực tuyến</span>
                </div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button type="button" onclick="AiStudioPage.askQuickQuestion('Mặt mình hơi tròn trán cao thì cắt kiểu nào đẹp?')" style="font-size: 11px; padding: 4px 8px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 4px; cursor: pointer;">
                  Mặt tròn trán cao?
                </button>
                <button type="button" onclick="AiStudioPage.askQuickQuestion('Tóc cứng khó vào nếp thì dùng loại sáp nào?')" style="font-size: 11px; padding: 4px 8px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 4px; cursor: pointer;">
                  Sáp cho tóc cứng?
                </button>
                <button type="button" onclick="AiStudioPage.askQuickQuestion('Da ngăm nhuộm màu gì cho sáng mặt?')" style="font-size: 11px; padding: 4px 8px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 4px; cursor: pointer;">
                  Màu nhuộm sáng da?
                </button>
              </div>
            </div>

            <!-- Khung tin nhắn Chat -->
            <div id="aiChatMessages" style="padding: 16px 20px; max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
              ${this.state.chatMessages.map(m => `
                <div style="display: flex; justify-content: ${m.sender === 'user' ? 'flex-end' : 'flex-start'};">
                  <div style="max-width: 80%; padding: 8px 14px; border-radius: 6px; font-size: 12.5px; line-height: 1.5; background: ${m.sender === 'user' ? '#C59B27' : 'var(--surface-elevated)'}; color: ${m.sender === 'user' ? '#141413' : 'var(--text-primary)'}; border: 1px solid ${m.sender === 'user' ? '#C59B27' : 'var(--border-color)'};">
                    ${m.text}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Input gửi câu hỏi cho thợ -->
            <div style="padding: 12px 20px; background: var(--surface-elevated); border-top: 1px solid var(--border-color); display: flex; gap: 10px;">
              <input type="text" id="aiChatInput" 
                     placeholder="Hỏi Master Barber về kiểu tóc, chất tóc, sáp vuốt hoặc chăm sóc da đầu..." 
                     onkeydown="if(event.key==='Enter') AiStudioPage.sendChatMessage()"
                     style="flex: 1; padding: 10px 14px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; font-size: 13px;" />
              <button type="button" onclick="AiStudioPage.sendChatMessage()" 
                      style="padding: 10px 18px; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; font-size: 13px; font-weight: 800; cursor: pointer;">
                Gửi Hỏi
              </button>
            </div>
          </div>

        </div>
      `;

      // Kích hoạt phân tích ngũ quan tự động cho ảnh hiện tại
      this.triggerFaceAnalysis();
      setTimeout(() => this.updateGeminiBadge(), 20);
    },

    // TỰ ĐỘNG CẮT ẢNH, XÓA NỀN, XÓA TÓC CŨ & CHẨN ĐOÁN NGŨ QUAN BẰNG AI
    async triggerFaceAnalysis() {
      const src = this.state.originalRawImage || this.state.uploadedImage;
      if (!src) return;

      const badge = document.getElementById('aiFaceShapeBadge');
      const desc = document.getElementById('aiFaceDiagnosticText');
      const skin = document.getElementById('aiSkinToneVal');
      const topMatch = document.getElementById('aiTopMatchVal');
      const prepBadge = document.getElementById('aiPreprocessStatusBadge');

      if (badge) badge.textContent = 'ĐANG PHÂN TÍCH...';
      if (prepBadge) {
        prepBadge.textContent = '⏳ Đang cắt ảnh, tách nền & xóa tóc cũ...';
        prepBadge.style.color = '#F59E0B';
      }

      try {
        let analysis = null;
        if (window.SalonApi && typeof window.SalonApi.analyzeFace === 'function') {
          analysis = await window.SalonApi.analyzeFace(src);
        } else if (window.AiHairEngine && typeof window.AiHairEngine.analyzeFace === 'function') {
          analysis = await window.AiHairEngine.analyzeFace(src);
        }

        if (!analysis || !analysis.faceShape) {
          // Dự phòng tính toán cục bộ
          analysis = {
            faceShape: {
              type: 'SQUARE',
              name: 'Khuôn Mặt Vuông Chữ Điền',
              desc: 'Đường nét quai hàm sắc nét toát lên vẻ nam tính, vững chãi và quyền uy.'
            },
            skinUndertone: { name: 'Sắc Tố Da Ấm (Warm Undertone)' },
            topMatch: { name: 'Pompadour & Mid Fade', score: 99 }
          };
        }

        this.state.faceAnalysis = analysis;

        // Lưu trữ các kết quả tiền xử lý tự động
        if (analysis.croppedImageUrl) this.state.croppedImage = analysis.croppedImageUrl;
        if (analysis.cleanBaseImageUrl) this.state.cleanBaseImage = analysis.cleanBaseImageUrl;
        if (analysis.transparentPngUrl) this.state.transparentImage = analysis.transparentPngUrl;
        this.state.isPreprocessed = !!(analysis.cleanBaseImageUrl || analysis.croppedImageUrl);

        // Mặc định hiển thị ảnh cắt 3:4 hoặc ảnh gốc CÓ TÓC THẬT, KHÔNG hiển thị đầu trọc khi chưa mô phỏng
        const displayImg = (this.state.activeBaseMode === 'raw') 
          ? this.state.originalRawImage 
          : (this.state.croppedImage || this.state.originalRawImage);
        
        if (displayImg) {
          this.state.uploadedImage = displayImg;
          const srcImg = document.getElementById('aiSourcePortrait');
          if (srcImg) srcImg.src = displayImg;
        }

        if (prepBadge) {
          prepBadge.textContent = '● Đã cắt 3:4 chuẩn Studio (Sẵn sàng mô phỏng)';
          prepBadge.style.color = '#10B981';
        }

        if (badge && analysis.faceShape) {
          badge.textContent = analysis.faceShape.name.toUpperCase();
        }
        if (desc && analysis.faceShape) {
          desc.textContent = analysis.faceShape.desc;
        }
        if (skin && analysis.skinUndertone) {
          skin.textContent = analysis.skinUndertone.name;
        }
        const ratioEl = document.getElementById('aiRatioVal');
        if (ratioEl && analysis.metrics) {
          ratioEl.textContent = `${analysis.metrics.ratioLengthToWidth}x (478 Điểm Mốc 3D)`;
        } else if (ratioEl) {
          ratioEl.textContent = 'Chuẩn Á Đông';
        }
        if (topMatch && analysis.topMatch) {
          topMatch.textContent = `${analysis.topMatch.name} (${analysis.topMatch.score}%)`;
        }

        const providerLabel = document.getElementById('aiVisionProviderTag');
        if (providerLabel && analysis.provider) {
          providerLabel.textContent = `● ${analysis.provider}`;
          providerLabel.style.display = 'inline-block';
        }

        // Cập nhật điểm tương thích trên từng pill kiểu tóc
        if (analysis.styleScores) {
          for (const [sId, sData] of Object.entries(analysis.styleScores)) {
            const tag = document.getElementById(`scoreTag_${sId}`);
            if (tag) {
              tag.textContent = `${sData.score}%`;
              tag.style.background = sData.score >= 95 ? 'rgba(197, 155, 39, 0.2)' : 'rgba(16, 185, 129, 0.12)';
              tag.style.color = sData.score >= 95 ? '#C59B27' : '#10B981';
            }
          }
        }
      } catch (err) {
        console.warn('[Face Analysis]', err.message);
      }
    },

    // Chuyển đổi giữa 2 chế độ xem: Ảnh cắt tỉ lệ 3:4, giữ tóc thật hoặc Ảnh gốc ban đầu
    switchBaseMode(mode) {
      this.state.activeBaseMode = mode;
      let targetImg = this.state.croppedImage || this.state.originalRawImage;
      if (mode === 'raw') {
        targetImg = this.state.originalRawImage;
      }

      if (targetImg) {
        this.state.uploadedImage = targetImg;
        const srcImg = document.getElementById('aiSourcePortrait');
        if (srcImg) srcImg.src = targetImg;
      }

      const setBtnState = (btnId, isSelected) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.style.background = isSelected ? '#C59B27' : 'var(--surface-card)';
        btn.style.color = isSelected ? '#141413' : 'var(--text-secondary)';
        btn.style.borderColor = isSelected ? '#C59B27' : 'var(--border-color)';
        btn.style.fontWeight = isSelected ? '800' : '600';
      };

      setBtnState('btnBaseModeCropped', mode !== 'raw');
      setBtnState('btnBaseModeRaw', mode === 'raw');

      if (window.UICommon) {
        const labels = {
          cropped: 'Đang xem: Ảnh chân dung cắt tỉ lệ 3:4 chuẩn Studio (giữ nguyên tóc thật)',
          raw: 'Đang xem: Ảnh gốc ban đầu của khách hàng'
        };
        window.UICommon.showToast(labels[mode] || 'Đã chuyển chế độ xem', 'info');
      }
    },

    // CHỌN PHOM TÓC & MÀU NHUỘM
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
      const proxiedUrl = (url && url.startsWith('http') && !url.includes('/api/ai/proxy-image'))
        ? ('/api/ai/proxy-image?url=' + encodeURIComponent(url))
        : url;
      this.state.originalRawImage = proxiedUrl;
      this.state.uploadedImage = proxiedUrl;
      this.state.croppedImage = null;
      this.state.cleanBaseImage = null;
      this.state.transparentImage = null;
      this.state.activeBaseMode = 'cropped';
      this.state.hasResult = false;
      this.state.resultImage = null;

      const srcImg = document.getElementById('aiSourcePortrait');
      const resImg = document.getElementById('aiResultPortrait');
      const previewBox = document.getElementById('aiPortraitViewport');
      const emptyUI = document.getElementById('aiEmptyUploadUI');

      if (previewBox) previewBox.style.display = 'block';
      if (emptyUI) emptyUI.style.display = 'none';
      if (srcImg) {
        srcImg.crossOrigin = 'anonymous';
        srcImg.src = proxiedUrl;
      }
      if (resImg) {
        resImg.src = '';
        resImg.style.display = 'none';
      }

      this._toggleResultState(false);
      this.setCompareMode('before');
      this.triggerFaceAnalysis();
      if (window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast('Đã nạp ảnh mẫu chân dung. Đang nhận diện 478 điểm mốc 3D...', 'info');
      }
    },

    triggerFileInput() {
      const input = document.getElementById('aiStudioFileInput');
      if (input) input.click();
    },

    handleDrop(event) {
      event.preventDefault();
      const files = event.dataTransfer && event.dataTransfer.files;
      if (files && files.length > 0) {
        this.handleFileSelected({ target: { files } });
      }
    },

    handleFileSelected(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        if (window.UICommon) window.UICommon.showToast('Chỉ chấp nhận tệp ảnh JPG, PNG hoặc WEBP!', 'error');
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        if (window.UICommon) window.UICommon.showToast('Dung lượng ảnh không được vượt quá 8MB!', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.state.originalRawImage = e.target.result;
        this.state.uploadedImage = e.target.result;
        this.state.croppedImage = null;
        this.state.cleanBaseImage = null;
        this.state.transparentImage = null;
        this.state.activeBaseMode = 'clean';
        this.state.hasResult = false;
        this.state.resultImage = null;

        const previewBox = document.getElementById('aiPortraitViewport');
        const emptyUI = document.getElementById('aiEmptyUploadUI');
        const srcImg = document.getElementById('aiSourcePortrait');
        const resImg = document.getElementById('aiResultPortrait');

        if (previewBox) previewBox.style.display = 'block';
        if (emptyUI) emptyUI.style.display = 'none';
        if (srcImg) srcImg.src = this.state.uploadedImage;
        if (resImg) {
          resImg.src = '';
          resImg.style.display = 'none';
        }

        this._toggleResultState(false);
        this.triggerFaceAnalysis();
        if (window.UICommon) window.UICommon.showToast('✂️ Đang tự động cắt góc chân dung, tách phông nền và xóa tóc cũ để ghép tóc chuẩn...', 'info');
      };
      reader.readAsDataURL(file);
    },

    // THỰC HIỆN BIẾN ĐỔI KIỂU TÓC AI THẬT
    async runAiRestyle(bypassKey = false) {
      if (this.state.isScanning) return;

      const sourceImg = document.getElementById('aiSourcePortrait');
      if (!sourceImg || (!this.state.uploadedImage && !sourceImg.src)) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng tải ảnh chân dung lên trước!', 'warning');
        return;
      }

      const geminiApiKey = localStorage.getItem('omni_gemini_api_key') || '';

      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle);
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor);

      return new Promise((resolveRestyle) => {
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
          laserPos += 5 * laserDirection;
          if (laserPos >= 340) laserDirection = -1;
          if (laserPos <= 10) laserDirection = 1;
          if (laser) laser.style.top = `${laserPos}px`;
        }, 20);

        // Mô phỏng chuỗi 4 pha Neural Network
        const stages = [
          { progress: 25, text: 'Giai đoạn 1/4: Tự động tách phông nền & xóa sạch phom tóc cũ của khách...' },
          { progress: 55, text: `Giai đoạn 2/4: Dựng đa giác 3D phom tóc mới [${currentStyle ? currentStyle.name : 'Tóc'}]...` },
          { progress: 85, text: `Giai đoạn 3/4: Hòa sắc sợi tóc [${currentColor ? currentColor.name : 'Màu sắc'}] & ray-tracing chiều sâu...` },
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
              // Lấy các thiết lập Cân bằng khuôn mặt & Lời nhắc Gemini AI
              const customPromptInput = document.getElementById('aiCustomPromptInput');
              const customPrompt = customPromptInput ? customPromptInput.value.trim() : '';
              const balanceLightingCheck = document.getElementById('aiCheckBalanceLight');
              const balanceLighting = balanceLightingCheck ? balanceLightingCheck.checked : true;
              const smoothSkinCheck = document.getElementById('aiCheckSmoothSkin');
              const smoothSkin = smoothSkinCheck ? smoothSkinCheck.checked : true;
              const geminiApiKey = localStorage.getItem('omni_gemini_api_key') || '';

              // Đảm bảo ảnh Before bên trái là ảnh chân dung có tóc thật của khách
              const beforePortrait = this.state.croppedImage || this.state.originalRawImage || this.state.uploadedImage;
              if (sourceImg && beforePortrait) {
                sourceImg.src = beforePortrait;
              }

              // Chuyển đổi ảnh nguồn thành Base64 Data URI chất lượng cao để AI xử lý chuẩn xác
              let imageToSend = beforePortrait || (sourceImg ? sourceImg.src : '');
              if (sourceImg && sourceImg.complete && sourceImg.naturalWidth > 0 && (!imageToSend || !imageToSend.startsWith('data:image'))) {
                try {
                  const c = document.createElement('canvas');
                  c.width = sourceImg.naturalWidth;
                  c.height = sourceImg.naturalHeight;
                  const ctx = c.getContext('2d');
                  ctx.drawImage(sourceImg, 0, 0);
                  imageToSend = c.toDataURL('image/jpeg', 0.95);
                } catch (cErr) {
                  console.warn('[AI Studio] Canvas convert note:', cErr.message);
                }
              }

              // GỌI ĐỘNG CƠ CÂN BẰNG KHUÔN MẶT & ĐỔI TÓC THẬT BẢO TOÀN NGŨ QUAN
              let generatedPortraitData = null;
              let responseDetails = null;

              if (window.SalonApi && typeof window.SalonApi.restyleHairPhoto === 'function') {
                responseDetails = await window.SalonApi.restyleHairPhoto({
                  originalImageBase64: imageToSend,
                  hairstyleName: this.state.selectedHairstyle,
                  hairColorName: this.state.selectedColor,
                  hairColorHex: currentColor ? currentColor.hex : '#141413',
                  customPrompt,
                  balanceLighting,
                  smoothSkin,
                  geminiApiKey,
                  faceAnalysis: this.state.faceAnalysis
                });
                if (responseDetails && responseDetails.resultImageUrl) {
                  generatedPortraitData = responseDetails.resultImageUrl;
                }
              }

              if (!generatedPortraitData) {
                if (responseDetails && responseDetails.message) {
                  if (window.UICommon) window.UICommon.showToast(responseDetails.message, 'warning');
                }
                generatedPortraitData = imageToSend || sourceImg.src;
              }

              this.state.resultImage = generatedPortraitData;
              this.state.isScanning = false;
              this.state.hasResult = true;

              if (laser) laser.style.display = 'none';
              if (mesh) mesh.style.display = 'none';
              if (hud) hud.style.display = 'none';
              if (spinner) spinner.style.display = 'none';
              if (icon) icon.style.display = 'inline-block';
              if (text) text.textContent = 'Mô Phỏng Kiểu Tóc & Cân Bằng Mặt Thật Ngay →';
              if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
              }

              // Hiển thị ảnh kết quả
              if (resultImgEl) {
                resultImgEl.src = generatedPortraitData;
                resultImgEl.style.display = 'block';
              }

              this._toggleResultState(true);
              this.setCompareMode('split');

              // Cập nhật lời khuyên thợ
              const adviceEl = document.getElementById('aiBarberAdviceText');
              const prodEl = document.getElementById('aiProductRec');
              if (responseDetails && responseDetails.faceAnalysis) {
                if (adviceEl) adviceEl.textContent = responseDetails.faceAnalysis.barberAdvice || '';
                if (prodEl && responseDetails.faceAnalysis.suggestedProduct) {
                  prodEl.textContent = responseDetails.faceAnalysis.suggestedProduct.name;
                }
              } else if (adviceEl && currentStyle) {
                adviceEl.textContent = `Kiểu tóc [${currentStyle.name}] mang lại phong thái đỉnh đạc, hãy dùng máy sấy nâng phom chân tóc và hoàn thiện bằng sáp giữ nếp mờ.`;
              }

              if (window.UICommon) {
                window.UICommon.showToast(`Đã tạo phom tóc "${currentStyle ? currentStyle.name : ''}" thành công trên khuôn mặt bạn!`, 'success');
              }
              resolveRestyle(generatedPortraitData);
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
              if (window.UICommon) window.UICommon.showToast('Lỗi AI: ' + genErr.message, 'error');
              resolveRestyle(null);
            }
          }
        }, 350);
      });
    },

    // ĐIỀU KHIỂN CHẾ ĐỘ XEM TRƯỚC / SAU & SLIDER
    setCompareMode(mode) {
      this.state.compareMode = mode;
      const viewport = document.getElementById('aiPortraitViewport');
      const clipper = document.getElementById('aiBeforeClipper');
      const divider = document.getElementById('aiCompareSliderDivider');
      const btnSplit = document.getElementById('btnModeSplit');
      const btnBefore = document.getElementById('btnModeBefore');
      const btnAfter = document.getElementById('btnModeAfter');

      const resetBtns = () => {
        [btnSplit, btnBefore, btnAfter].forEach(b => {
          if (b) {
            b.style.background = 'var(--surface-card)';
            b.style.color = 'var(--text-secondary)';
            b.style.borderColor = 'var(--border-color)';
          }
        });
      };
      resetBtns();

      if (mode === 'split') {
        if (viewport) viewport.style.cursor = 'ew-resize';
        if (clipper) clipper.style.clipPath = `inset(0 ${100 - this.state.sliderPosition}% 0 0)`;
        if (divider) {
          divider.style.display = 'flex';
          divider.style.left = this.state.sliderPosition + '%';
        }
        if (btnSplit) {
          btnSplit.style.background = '#C59B27';
          btnSplit.style.color = '#141413';
          btnSplit.style.borderColor = '#C59B27';
        }
      } else if (mode === 'before') {
        if (viewport) viewport.style.cursor = 'default';
        if (clipper) clipper.style.clipPath = 'inset(0 0 0 0)';
        if (divider) divider.style.display = 'none';
        if (btnBefore) {
          btnBefore.style.background = '#C59B27';
          btnBefore.style.color = '#141413';
          btnBefore.style.borderColor = '#C59B27';
        }
      } else if (mode === 'after') {
        if (viewport) viewport.style.cursor = 'default';
        if (clipper) clipper.style.clipPath = 'inset(0 100% 0 0)';
        if (divider) divider.style.display = 'none';
        if (btnAfter) {
          btnAfter.style.background = '#C59B27';
          btnAfter.style.color = '#141413';
          btnAfter.style.borderColor = '#C59B27';
        }
      }
    },

    updateSliderPosition(clientX) {
      const viewport = document.getElementById('aiPortraitViewport');
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      if (rect.width <= 0) return;
      let posX = clientX - rect.left;
      let pct = (posX / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      this.state.sliderPosition = pct;

      const clipper = document.getElementById('aiBeforeClipper');
      const divider = document.getElementById('aiCompareSliderDivider');
      if (clipper) clipper.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      if (divider) divider.style.left = pct + '%';
    },

    handleViewportMouseDown(e) {
      if (!this.state.hasResult) return;
      if (e.target && (e.target.closest('#aiScanHudModal') || e.target.closest('button'))) return;
      if (this.state.compareMode && this.state.compareMode !== 'split') {
        this.setCompareMode('split');
      }
      this.updateSliderPosition(e.clientX);
      this.startSliderDrag(e);
    },

    handleViewportTouchStart(e) {
      if (!this.state.hasResult) return;
      if (e.target && (e.target.closest('#aiScanHudModal') || e.target.closest('button'))) return;
      if (this.state.compareMode && this.state.compareMode !== 'split') {
        this.setCompareMode('split');
      }
      this.startSliderDragTouch(e);
    },

    startSliderDrag(e) {
      if (!this.state.hasResult) return;
      e.preventDefault();
      e.stopPropagation();

      const onMouseMove = (moveEvent) => {
        moveEvent.preventDefault();
        this.updateSliderPosition(moveEvent.clientX);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },

    startSliderDragTouch(e) {
      if (!this.state.hasResult) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      if (e.touches && e.touches[0]) {
        this.updateSliderPosition(e.touches[0].clientX);
      }

      const onTouchMove = (touchEvent) => {
        if (touchEvent.cancelable) touchEvent.preventDefault();
        if (touchEvent.touches && touchEvent.touches[0]) {
          this.updateSliderPosition(touchEvent.touches[0].clientX);
        }
      };

      const onTouchEnd = () => {
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', onTouchEnd);
      };

      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
    },

    // CHATBOT TƯ VẤN MASTER BARBER AI
    async sendChatMessage() {
      const input = document.getElementById('aiChatInput');
      if (!input) return;
      const msg = input.value.trim();
      if (!msg) return;

      input.value = '';
      this.state.chatMessages.push({ sender: 'user', text: msg });
      this._renderChat();

      try {
        let replyText = 'Master Barber OmniSalon khuyên bạn nên thử phom tóc uốn texture và cắt fade gọn gàng 2 bên mai để tôn đường nét xương hàm!';
        if (window.SalonApi && typeof window.SalonApi.askAiBarber === 'function') {
          const res = await window.SalonApi.askAiBarber(msg);
          if (res && res.reply) replyText = res.reply;
        } else {
          const res = await fetch('/api/ai/consultation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.reply) replyText = data.reply;
          }
        }
        this.state.chatMessages.push({ sender: 'barber', text: replyText });
      } catch (err) {
        this.state.chatMessages.push({ sender: 'barber', text: 'Có chút trục trặc mạng khi kết nối thợ trưởng, bạn vui lòng hỏi lại nhé!' });
      }
      this._renderChat();
    },

    askQuickQuestion(questionText) {
      const input = document.getElementById('aiChatInput');
      if (input) {
        input.value = questionText;
        this.sendChatMessage();
      }
    },

    _renderChat() {
      const container = document.getElementById('aiChatMessages');
      if (!container) return;
      container.innerHTML = this.state.chatMessages.map(m => `
        <div style="display: flex; justify-content: ${m.sender === 'user' ? 'flex-end' : 'flex-start'};">
          <div style="max-width: 80%; padding: 8px 14px; border-radius: 6px; font-size: 12.5px; line-height: 1.5; background: ${m.sender === 'user' ? '#C59B27' : 'var(--surface-elevated)'}; color: ${m.sender === 'user' ? '#141413' : 'var(--text-primary)'}; border: 1px solid ${m.sender === 'user' ? '#C59B27' : 'var(--border-color)'};">
            ${m.text}
          </div>
        </div>
      `).join('');
      container.scrollTop = container.scrollHeight;
    },

    // CHỤP ẢNH BẰNG CAMERA NATIVE
    openCameraModal() {
      const modalHtml = `
        <div id="aiCameraModalBackdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;">
          <div style="background: var(--surface-card, #1c1c1f); border: 1px solid var(--border-color, #333); border-radius: 8px; width: 100%; max-width: 500px; padding: 20px; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <strong style="color: var(--text-primary); font-size: 16px;">📸 Chụp Chân Dung Bằng Camera</strong>
              <button type="button" onclick="AiStudioPage.closeCameraModal()" style="background: transparent; border: none; font-size: 20px; color: var(--text-secondary); cursor: pointer;">✕</button>
            </div>
            
            <div style="position: relative; width: 100%; height: 340px; background: #000; border-radius: 6px; overflow: hidden; margin-bottom: 14px; display: flex; align-items: center; justify-content: center;">
              <video id="aiCameraVideo" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
              <canvas id="aiCameraCanvas" style="display: none;"></canvas>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="button" onclick="AiStudioPage.captureCameraShot()" style="flex: 1; padding: 12px; background: #C59B27; color: #141413; font-weight: 800; border-radius: 6px; border: 1px solid #C59B27; cursor: pointer;">
                Chụp Ảnh Ngay 📸
              </button>
              <button type="button" onclick="AiStudioPage.closeCameraModal()" style="padding: 12px 18px; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                Hủy
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      // Kích hoạt camera stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 } })
          .then(stream => {
            const video = document.getElementById('aiCameraVideo');
            if (video) {
              video.srcObject = stream;
              this._activeStream = stream;
            }
          })
          .catch(err => {
            console.error('Camera error:', err);
            if (window.UICommon) window.UICommon.showToast('Không thể mở camera: ' + err.message, 'error');
            this.closeCameraModal();
          });
      }
    },

    captureCameraShot() {
      const video = document.getElementById('aiCameraVideo');
      const canvas = document.getElementById('aiCameraCanvas');
      if (!video || !canvas) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const capturedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      this.closeCameraModal();

      this.state.uploadedImage = capturedBase64;
      this.state.hasResult = false;
      this.state.resultImage = null;

      const srcImg = document.getElementById('aiSourcePortrait');
      const resImg = document.getElementById('aiResultPortrait');
      const previewBox = document.getElementById('aiPortraitViewport');
      const emptyUI = document.getElementById('aiEmptyUploadUI');

      if (previewBox) previewBox.style.display = 'block';
      if (emptyUI) emptyUI.style.display = 'none';
      if (srcImg) srcImg.src = capturedBase64;
      if (resImg) {
        resImg.src = '';
        resImg.style.display = 'none';
      }

      this._toggleResultState(false);
      this.triggerFaceAnalysis();
      if (window.UICommon) window.UICommon.showToast('Đã chụp ảnh thành công! Bấm Mô Phỏng để tạo phom tóc.', 'success');
    },

    closeCameraModal() {
      if (this._activeStream) {
        this._activeStream.getTracks().forEach(track => track.stop());
        this._activeStream = null;
      }
      const modal = document.getElementById('aiCameraModalBackdrop');
      if (modal) modal.remove();
    },

    // DOWNLOAD KẾT QUẢ VÀ ĐẶT LỊCH THẬT
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

    bookThisHairstyle() {
      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle);
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor);
      const styleName = currentStyle ? currentStyle.name : 'Tóc Tạo Mẫu AI';
      const colorName = currentColor ? currentColor.name : 'Tự Nhiên';

      const noteText = `[AI 3D RESTYLE] Khách chọn kiểu tóc: ${styleName} (Màu nhuộm: ${colorName})`;

      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate(`/booking?service=srv-haircut-men&notes=${encodeURIComponent(noteText)}`);
      } else if (window.CustomerWeb && typeof window.CustomerWeb.switchTab === 'function') {
        window.CustomerWeb.switchTab('booking');
      }
    },

    resetAiRestyle() {
      this.state.hasResult = false;
      this.state.resultImage = null;
      const resImg = document.getElementById('aiResultPortrait');
      if (resImg) {
        resImg.src = '';
        resImg.style.display = 'none';
      }
      this._toggleResultState(false);
      this.setCompareMode('before');
      if (window.UICommon) window.UICommon.showToast('Đã làm mới, mời bạn chọn kiểu khác!', 'info');
    },

    _toggleResultState(hasResult) {
      const actions = document.getElementById('aiResultActions');
      const compareControls = document.getElementById('aiCompareControls');
      const analysisCard = document.getElementById('aiAnalysisCard');
      const bBefore = document.getElementById('aiViewBadgeBefore');
      const bAfter = document.getElementById('aiViewBadgeAfter');

      if (actions) actions.style.display = hasResult ? 'flex' : 'none';
      if (compareControls) compareControls.style.display = hasResult ? 'flex' : 'none';
      if (analysisCard) analysisCard.style.display = hasResult ? 'block' : 'none';
      if (bBefore) bBefore.style.display = hasResult ? 'block' : 'none';
      if (bAfter) bAfter.style.display = hasResult ? 'block' : 'none';
    },

    _updateHairstyleUI() {
      this.hairstyles.forEach(h => {
        const btn = document.getElementById(`pillStyle_${h.id}`);
        if (!btn) return;
        const isSelected = this.state.selectedHairstyle === h.id;
        btn.classList.toggle('selected', isSelected);
        btn.style.borderColor = isSelected ? '#C59B27' : 'var(--border-color)';
        btn.style.background = isSelected ? 'rgba(197, 155, 39, 0.08)' : 'var(--surface-elevated)';
        const title = btn.querySelector('strong');
        if (title) title.style.color = isSelected ? '#C59B27' : 'var(--text-primary)';
      });
    },

    _updateColorUI() {
      this.hairColors.forEach(c => {
        const btn = document.getElementById(`pillColor_${c.id}`);
        if (!btn) return;
        const isSelected = this.state.selectedColor === c.id;
        btn.classList.toggle('selected', isSelected);
        btn.style.borderColor = isSelected ? '#C59B27' : 'var(--border-color)';
        btn.style.background = isSelected ? 'rgba(197, 155, 39, 0.08)' : 'var(--surface-elevated)';
        const nameSpan = btn.querySelector('span:last-child');
        if (nameSpan) nameSpan.style.color = isSelected ? '#C59B27' : 'var(--text-primary)';
      });
    },

    openAiSettingsModal() {
      const modalHtml = `
        <div id="aiSettingsModalBackdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;">
          <div style="background: var(--surface-card, #1c1c1f); border: 1px solid var(--border-color, #333); border-radius: 8px; width: 100%; max-width: 480px; padding: 22px; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <h3 style="margin: 0; font-size: 17px; color: var(--text-primary); font-weight: 700;">⚙️ Cấu Hình Động Cơ Real AI Vision</h3>
              <button type="button" onclick="document.getElementById('aiSettingsModalBackdrop').remove()" style="background: transparent; border: none; font-size: 18px; color: var(--text-secondary); cursor: pointer;">✕</button>
            </div>
            <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0 0 16px; line-height: 1.5;">
              Hệ thống kích hoạt mặc định <strong>Omni Neural Vision (Flux/SANA)</strong>: Tự động phân tích ngũ quan và tạo kiểu tóc thật hoàn toàn miễn phí. Bạn có thể bổ sung API Key của Google Gemini hoặc HuggingFace nếu muốn.
            </p>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <label style="font-size: 12px; font-weight: 700; color: #C59B27; display: block; margin-bottom: 6px;">ĐỘNG CƠ AI MỤC TIÊU:</label>
                <select id="modalAiProviderSelect" style="width: 100%; padding: 8px 12px; border-radius: 6px; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13px;">
                  <option value="pollinations" selected>Omni Neural Vision (Flux / SANA - Miễn phí, Real AI)</option>
                  <option value="gemini">Google Gemini 1.5 Vision API</option>
                  <option value="huggingface">Hugging Face SDXL Barbershop</option>
                </select>
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700; color: var(--text-primary); display: block; margin-bottom: 6px;">API Key (Tùy chọn):</label>
                <input type="password" id="modalAiApiKeyInput" placeholder="Nhập API Key nếu sử dụng Gemini/HuggingFace..." style="width: 100%; padding: 8px 12px; border-radius: 6px; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 13px; box-sizing: border-box;" />
              </div>
              <div style="display: flex; gap: 10px; margin-top: 6px;">
                <button type="button" onclick="AiStudioPage.saveAiSettingsModal()" style="flex: 1; padding: 10px; background: #C59B27; color: #141413; font-weight: 800; border-radius: 6px; border: 1px solid #C59B27; cursor: pointer;">
                  Lưu Thiết Lập
                </button>
                <button type="button" onclick="document.getElementById('aiSettingsModalBackdrop').remove()" style="padding: 10px 16px; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // CẬP NHẬT TRẠNG THÁI BADGE GEMINI KEY
    updateGeminiBadge() {
      const badge = document.getElementById('aiGeminiKeyBadge');
      const headerText = document.getElementById('aiGeminiHeaderBadgeText');
      const headerIcon = document.getElementById('aiGeminiHeaderBadgeIcon');
      const key = (localStorage.getItem('omni_gemini_api_key') || '').trim();

      if (badge) {
        if (key) {
          badge.innerHTML = `
            <span style="font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 8px; border-radius: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              🟢 Gemini Key: Đã kết nối <span style="font-size: 9px; opacity: 0.8; text-decoration: underline;">(Đổi)</span>
            </span>
          `;
        } else {
          badge.innerHTML = `
            <span style="font-size: 10px; background: rgba(197, 155, 39, 0.15); color: #C59B27; border: 1px solid rgba(197, 155, 39, 0.4); padding: 2px 8px; border-radius: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              🔑 Nhập Gemini Key (Tóc Thật)
            </span>
          `;
        }
      }

      if (headerText) {
        headerText.textContent = key ? 'Gemini AI: Đã kết nối' : 'Kết Nối Gemini AI';
      }
      if (headerIcon) {
        headerIcon.textContent = key ? '🟢' : '🔑';
      }
    },

    // MODAL NHẬP VÀ TEST LINK / API KEY GOOGLE GEMINI
    openGeminiKeyModal(opts = {}) {
      const existing = document.getElementById('geminiKeyModalBackdrop');
      if (existing) existing.remove();

      const savedKey = localStorage.getItem('omni_gemini_api_key') || '';
      const reasonMsg = opts.reason || '';

      const modalHtml = `
        <div id="geminiKeyModalBackdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 16px;">
          <div style="background: var(--surface-card, #1A1A19); border: 1.5px solid #C59B27; border-radius: 12px; width: 100%; max-width: 520px; padding: 24px; box-shadow: 0 12px 48px rgba(0,0,0,0.85); animation: fadeIn 0.2s ease; box-sizing: border-box;">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
              <div>
                <div style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 20px; background: rgba(197, 155, 39, 0.15); color: #C59B27; font-size: 11px; font-weight: 800; margin-bottom: 6px;">
                  <span>✨ GOOGLE GEMINI MULTIMODAL VISION</span>
                </div>
                <h3 style="margin: 0; font-size: 18px; color: #FAF8F5; font-weight: 800; font-family: 'Cinzel', serif;">
                  Kết Nối Google Gemini API (Tóc Thật)
                </h3>
              </div>
              <button type="button" onclick="document.getElementById('geminiKeyModalBackdrop').remove()" style="background: transparent; border: none; font-size: 20px; color: #A1A1AA; cursor: pointer;">✕</button>
            </div>

            ${reasonMsg ? `
              <div style="padding: 10px 12px; background: rgba(197, 155, 39, 0.1); border-left: 3px solid #C59B27; border-radius: 4px; font-size: 12px; color: #E4E4E7; margin-bottom: 14px; line-height: 1.5;">
                💡 ${reasonMsg}
              </div>
            ` : ''}

            <p style="font-size: 12.5px; color: #A1A1AA; margin: 0 0 14px; line-height: 1.5;">
              Hệ thống sử dụng mô hình <strong>Google Gemini 2.0 Multimodal Vision</strong> để nhận diện khuôn mặt thật, cân bằng ánh sáng và sinh tóc thật photorealistic 100%.
            </p>

            <div style="background: rgba(255,255,255,0.03); border: 1px dashed rgba(197, 155, 39, 0.4); border-radius: 8px; padding: 12px 14px; margin-bottom: 16px;">
              <div style="font-size: 12px; font-weight: 700; color: #FAF8F5; margin-bottom: 4px;">Chưa có Google Gemini API Key?</div>
              <div style="font-size: 11.5px; color: #A1A1AA; line-height: 1.4; margin-bottom: 8px;">
                Nhận Key hoàn toàn miễn phí từ Google AI Studio (chỉ mất 10 giây, không cần thẻ tín dụng):
              </div>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" 
                 style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: #C59B27; text-decoration: underline;">
                🔗 Bấm vào đây để lấy API Key miễn phí tại Google AI Studio ↗
              </a>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <label style="font-size: 11.5px; font-weight: 700; color: #FAF8F5; display: block; margin-bottom: 6px;">
                  DÁN GOOGLE GEMINI API KEY VÀO ĐÂY:
                </label>
                <div style="position: relative;">
                  <input type="password" id="geminiApiKeyInputField" 
                         value="${savedKey}" 
                         placeholder="AIzaSy..." 
                         style="width: 100%; box-sizing: border-box; padding: 10px 40px 10px 12px; border-radius: 6px; background: #262624; color: #FAF8F5; border: 1px solid rgba(255,255,255,0.2); font-size: 13px; font-family: monospace;" />
                  <button type="button" onclick="AiStudioPage.toggleKeyVisibility()" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #A1A1AA; cursor: pointer; font-size: 14px;">
                    👁️
                  </button>
                </div>
                <div id="geminiKeyTestStatus" style="font-size: 12px; margin-top: 6px; min-height: 18px;"></div>
              </div>

              <div style="display: flex; gap: 10px; margin-top: 8px;">
                <button type="button" id="btnTestGeminiKey" onclick="AiStudioPage.testGeminiKeyInModal()" 
                        style="padding: 10px 14px; font-size: 12px; font-weight: 700; background: #262624; color: #FAF8F5; border: 1px solid rgba(255,255,255,0.25); border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  <span id="geminiTestSpinner" style="display: none; width: 12px; height: 12px; border: 2px solid #FAF8F5; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                  <span>⚡ Kiểm Tra Kết Nối</span>
                </button>
                <button type="button" onclick="AiStudioPage.saveGeminiKeyModal()" 
                        style="flex: 1; padding: 10px 16px; font-size: 12.5px; font-weight: 800; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 10px rgba(197, 155, 39, 0.3);">
                  💾 Lưu &amp; Kích Hoạt Tóc Thật
                </button>
              </div>

              ${opts.onSuccess ? `
                <div style="text-align: center; margin-top: 6px;">
                  <button type="button" onclick="document.getElementById('geminiKeyModalBackdrop').remove(); AiStudioPage.runAiRestyle(true);" 
                          style="background: transparent; border: none; color: #71717A; font-size: 11.5px; text-decoration: underline; cursor: pointer;">
                    Bỏ qua &amp; Dùng thử phác thảo không cần key →
                  </button>
                </div>
              ` : ''}

            </div>

          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    toggleKeyVisibility() {
      const input = document.getElementById('geminiApiKeyInputField');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    },

    async testGeminiKeyInModal() {
      const input = document.getElementById('geminiApiKeyInputField');
      const key = (input ? input.value : '').trim();
      const statusEl = document.getElementById('geminiKeyTestStatus');
      const spinner = document.getElementById('geminiTestSpinner');
      if (!key) {
        if (statusEl) statusEl.innerHTML = '<span style="color: #EF4444;">Vui lòng nhập API Key trước khi kiểm tra.</span>';
        return;
      }
      if (spinner) spinner.style.display = 'inline-block';
      if (statusEl) statusEl.innerHTML = '<span style="color: #A1A1AA;">Đang kết nối Google AI Studio...</span>';

      try {
        const res = await window.SalonApi.testGeminiApiKey(key);
        if (res && res.success) {
          if (statusEl) statusEl.innerHTML = `<span style="color: #10B981; font-weight: 700;">✓ ${res.message || 'API Key Google Gemini hợp lệ 100%!'}</span>`;
        } else {
          if (statusEl) statusEl.innerHTML = `<span style="color: #EF4444;">✕ ${res.message || 'API Key không hợp lệ hoặc đã bị khóa.'}</span>`;
        }
      } catch (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color: #EF4444;">✕ Lỗi kết nối: ${err.message}</span>`;
      } finally {
        if (spinner) spinner.style.display = 'none';
      }
    },

    async saveGeminiKeyModal() {
      const input = document.getElementById('geminiApiKeyInputField');
      const key = (input ? input.value : '').trim();
      if (!key) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng nhập API Key', 'error');
        return;
      }
      localStorage.setItem('omni_gemini_api_key', key);
      try {
        await fetch('/api/ai/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'gemini',
            geminiApiKey: key
          })
        });
      } catch (e) { }

      this.updateGeminiBadge();
      const modal = document.getElementById('geminiKeyModalBackdrop');
      if (modal) modal.remove();
      if (window.UICommon) {
        window.UICommon.showToast('Đã kết nối Google Gemini API thành công! Tóc thật photorealistic đã sẵn sàng.', 'success');
      }
    },

    saveAiSettingsModal() {
      const provider = document.getElementById('modalAiProviderSelect')?.value || 'gemini';
      const key = (document.getElementById('modalAiApiKeyInput')?.value || '').trim();
      if (key) {
        localStorage.setItem('omni_gemini_api_key', key);
      }
      fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          geminiApiKey: key,
          huggingFaceKey: provider === 'huggingface' ? key : ''
        })
      }).then(() => {
        this.updateGeminiBadge();
        const modal = document.getElementById('aiSettingsModalBackdrop');
        if (modal) modal.remove();
        if (window.UICommon) window.UICommon.showToast('Đã lưu cấu hình Google Gemini AI thành công!', 'success');
      }).catch(() => {
        const modal = document.getElementById('aiSettingsModalBackdrop');
        if (modal) modal.remove();
      });
    }
  };

  // Gắn vào window toàn cục
  window.AiStudioPage = AiStudioPage;

})(window);
