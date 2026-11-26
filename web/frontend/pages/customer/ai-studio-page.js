(function (window) {
  'use strict';

  const AiStudioPage = {
    state: {
      uploadedImage: null,
      originalRawImage: null,
      croppedImage: null,
      activeBaseMode: 'cropped', // 'cropped' | 'raw'
      selectedHairstyle: 'layer-korean',
      activeCategory: 'all', // 'all' | 'classic' | 'trends' | 'edgy' | 'wavy'
      selectedFaceShape: 'all', // 'all' | 'square' | 'round' | 'oval' | 'oblong' | 'diamond'
      selectedColor: 'natural-black',
      selectedVolume: 'standard', // 'natural' | 'standard' | 'high'
      selectedFinish: 'matte', // 'matte' | 'gloss'
      customBarberNotes: '',
      faceAnalysis: null,
      showFaceOverlay: true,
      autoFitOnCapture: true,
      isAnalyzingFace: false,
      isProcessing: false,
      processProgress: 0,
      hasResult: false,
      resultImage: null,
      lastRestyleMeta: null,
      pendingAutoAnalyze: false,
      sliderPosition: 50,
      compareMode: 'split' // 'split' | 'before' | 'after'
    },

    // Danh sách 12 kiểu tóc chuẩn đồng bộ 100% với AI Engine Backend
    hairstyles: [
      {
        id: 'layer-korean',
        name: 'Layer Texture Hàn Quốc',
        category: 'trends',
        tag: 'THỜI THƯỢNG',
        faceShape: 'Mặt dài, Mặt gầy, Trái xoan',
        faceKeys: ['oblong', 'oval', 'heart'],
        length: 'Trung bình 7 - 10 cm',
        volume: 'Bồng bềnh',
        finish: 'Clay Mờ / Xịt Phồng',
        serviceId: 'DV03',
        suggestedProductName: 'Apestomen Volcanic Clay VIP',
        desc: 'Tỉa tầng bay bổng, uốn texture tạo độ phồng tự nhiên cho khuôn mặt Á Đông.',
        preview: '/assets/hairstyles/layer-korean.jpg',
        result: '/assets/hairstyles/layer-korean.jpg'
      },
      {
        id: 'pompadour-luxury',
        name: 'Pompadour & Mid Fade',
        category: 'classic',
        tag: 'LỊCH LÃM',
        faceShape: 'Mặt tròn, Mặt vuông, Trái xoan',
        faceKeys: ['round', 'square', 'oval'],
        length: 'Trung bình 8 - 10 cm',
        volume: 'Bồng bềnh cao',
        finish: 'Pomade Bóng / Clay',
        serviceId: 'DV01',
        suggestedProductName: 'Reuzel Green Medium Hold Grease',
        desc: 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên mang lại phong thái đĩnh đạc.',
        preview: '/assets/hairstyles/pompadour-luxury.jpg',
        result: '/assets/hairstyles/pompadour-luxury.jpg'
      },
      {
        id: 'mullet-modern',
        name: 'Modern Mullet & Taper Fade',
        category: 'trends',
        tag: 'PHONG CÁCH',
        faceShape: 'Mặt trái xoan, Mặt tròn, Kim cương',
        faceKeys: ['oval', 'round', 'diamond'],
        length: 'Đỉnh 7cm, Gáy 10cm',
        volume: 'Đầy đặn',
        finish: 'Matte Paste',
        serviceId: 'DV03',
        suggestedProductName: 'Reuzel Grooming Tonic',
        desc: 'Gáy tỉa so le mềm mại kết hợp đường cạo viền dứt khoát và nam tính.',
        preview: '/assets/hairstyles/mullet-modern.jpg',
        result: '/assets/hairstyles/mullet-modern.jpg'
      },
      {
        id: 'sidepart-gentleman',
        name: 'Side Part 7/3 Cổ Điển',
        category: 'classic',
        tag: 'QUÝ ÔNG',
        faceShape: 'Mặt vuông, Trái xoan, Mặt dài',
        faceKeys: ['square', 'oval', 'oblong'],
        length: 'Trung bình 6 - 8 cm',
        volume: 'Tiêu chuẩn',
        finish: 'Pomade Gốc Nước',
        serviceId: 'CB01',
        suggestedProductName: 'Apestomen Volcanic Clay VIP',
        desc: 'Đường rẽ ngôi cân đối tôn phom mặt, dễ dàng chải sáp restyle suốt cả ngày.',
        preview: '/assets/hairstyles/sidepart-gentleman.jpg',
        result: '/assets/hairstyles/sidepart-gentleman.jpg'
      },
      {
        id: 'buzzcut-fade',
        name: 'Buzz Cut & High Fade',
        category: 'edgy',
        tag: 'DỨT KHOÁT',
        faceShape: 'Mặt vuông, Trái xoan, Góc cạnh',
        faceKeys: ['square', 'oval'],
        length: 'Ngắn 1 - 2 cm',
        volume: 'Thấp',
        finish: 'Matte (Mờ tự nhiên)',
        serviceId: 'DV01',
        suggestedProductName: "L'Oréal Professionnel Infinium Pure Strong",
        desc: 'Gọn gàng, tôn trọn vẹn xương hàm và đường nét góc cạnh của gương mặt.',
        preview: '/assets/hairstyles/buzzcut-fade.jpg',
        result: '/assets/hairstyles/buzzcut-fade.jpg'
      },
      {
        id: 'french-crop',
        name: 'French Crop Textured',
        category: 'edgy',
        tag: 'HIỆN ĐẠI',
        faceShape: 'Mặt dài, Trán cao, Trái xoan',
        faceKeys: ['oblong', 'oval', 'heart'],
        length: 'Ngắn 3 - 5 cm',
        volume: 'Tự nhiên',
        finish: 'Bột tạo phồng / Matte',
        serviceId: 'DV02',
        suggestedProductName: 'Hanz de Fuko Quicksand',
        desc: 'Mái tỉa nhọn textured ngang trán, cạo fade cao 2 bên mai năng động và trẻ trung.',
        preview: '/assets/hairstyles/french-crop.jpg',
        result: '/assets/hairstyles/french-crop.jpg'
      },
      {
        id: 'short-quiff',
        name: 'Short Quiff & Mid Taper',
        category: 'trends',
        tag: 'NĂNG ĐỘNG',
        faceShape: 'Mặt tròn, Mặt vuông, Trái xoan',
        faceKeys: ['round', 'square', 'oval'],
        length: 'Ngắn 4 - 6 cm',
        volume: 'Tiêu chuẩn',
        finish: 'Matte Clay',
        serviceId: 'DV01',
        suggestedProductName: 'Apestomen Volcanic Clay VIP',
        desc: 'Mái vuốt ngược ngắn tự nhiên, hai bên mai cắt taper gọn gàng, phù hợp cả công sở lẫn thể thao.',
        preview: '/assets/hairstyles/short-quiff.jpg',
        result: '/assets/hairstyles/short-quiff.jpg'
      },
      {
        id: 'two-block',
        name: 'Two-Block 6/4 Lãng Tử',
        category: 'trends',
        tag: 'K-STYLE IDOL',
        faceShape: 'Mặt tròn, Trái xoan, Vuông',
        faceKeys: ['round', 'oval', 'square'],
        length: 'Trung bình 8 - 11 cm',
        volume: 'Bồng bềnh',
        finish: 'Sáp Vuốt Nhẹ / Gôm',
        serviceId: 'DV02',
        suggestedProductName: 'Reuzel Grooming Tonic',
        desc: 'Phần mai và gáy tỉa ngắn gọn, phần trên để dài rẽ ngôi 6/4 bồng bềnh chuẩn phong cách sao Hàn.',
        preview: '/assets/hairstyles/two-block.jpg',
        result: '/assets/hairstyles/two-block.jpg'
      },
      {
        id: 'ivy-league',
        name: 'Ivy League Hiện Đại',
        category: 'classic',
        tag: 'DOANH NHÂN',
        faceShape: 'Mặt vuông, Trái xoan, Mặt tròn',
        faceKeys: ['square', 'oval', 'round'],
        length: 'Ngắn - Vừa 4 - 6 cm',
        volume: 'Vừa phải',
        finish: 'Pomade Mờ / Sáp Cream',
        serviceId: 'CB01',
        suggestedProductName: 'Reuzel Green Medium Hold Grease',
        desc: 'Tóc quý tộc Mỹ kết hợp fade đương đại, mái vuốt lệch nhẹ 8/2 tạo phong thái trí thức đĩnh đạc.',
        preview: '/assets/hairstyles/ivy-league.jpg',
        result: '/assets/hairstyles/ivy-league.jpg'
      },
      {
        id: 'undercut-slick',
        name: 'Undercut Slicked Back',
        category: 'classic',
        tag: 'QUYỀN LỰC',
        faceShape: 'Mặt vuông, Mặt dài',
        faceKeys: ['square', 'oblong'],
        length: 'Trung bình 8 - 12 cm',
        volume: 'Mượt mà',
        finish: 'Classic Pomade',
        serviceId: 'DV01',
        suggestedProductName: 'Reuzel Blue Strong Hold Pomade',
        desc: 'Cạo sát 2 bên mai (Skin Fade), tóc đỉnh đầu vuốt mượt bóng ra sau với pomade gốc nước.',
        preview: '/assets/hairstyles/undercut-slick.jpg',
        result: '/assets/hairstyles/undercut-slick.jpg'
      },
      {
        id: 'ripple-perm',
        name: 'Uốn Con Sâu / Ripple Curls',
        category: 'wavy',
        tag: 'BÙNG NỔ CÁ TÍNH',
        faceShape: 'Mặt gầy, Mặt dài, Trái xoan',
        faceKeys: ['oblong', 'oval', 'diamond'],
        length: 'Trung bình 7 - 9 cm',
        volume: 'Bồng bềnh cao',
        finish: 'Bọt Tạo Sóng / Dưỡng Ẩm',
        serviceId: 'DV05',
        suggestedProductName: 'Hanz de Fuko Quicksand',
        desc: 'Tóc uốn sóng lượn dập xù cá tính, tạo kết cấu bồng bềnh và độ dày tối đa cho mái tóc mỏng.',
        preview: '/assets/hairstyles/ripple-perm.jpg',
        result: '/assets/hairstyles/ripple-perm.jpg'
      },
      {
        id: 'mohican-fade',
        name: 'Mohican Ngắn & Sharp Fade',
        category: 'edgy',
        tag: 'BỤI BẶM',
        faceShape: 'Mặt tròn, Mặt vuông',
        faceKeys: ['round', 'square'],
        length: 'Ngắn 3 - 5 cm',
        volume: 'Vuốt nhọn',
        finish: 'Matte Wax',
        serviceId: 'DV01',
        suggestedProductName: 'Apestomen Volcanic Clay VIP',
        desc: 'Mái vuốt nhọn hướng về trước, hai bên cạo fade trắng dứt khoát, toát lên vẻ bụi bặm và phá cách.',
        preview: '/assets/hairstyles/mohican-fade.jpg',
        result: '/assets/hairstyles/mohican-fade.jpg'
      }
    ],

    // Bảng màu nhuộm tóc nam
    hairColors: [
      { id: 'natural-black', name: 'Đen Tự Nhiên', hex: '#141413', desc: 'Lịch thiệp, chuẩn mực công sở' },
      { id: 'cold-ash-brown', name: 'Nâu Lạnh Sâu', hex: '#523A28', desc: 'Sáng da, không cần tẩy tóc' },
      { id: 'titan-grey', name: 'Xám Khói Titan', hex: '#6B7280', desc: 'Ánh kim khói thời thượng' },
      { id: 'nordic-platinum', name: 'Vàng Cát Trầm', hex: '#C59B27', desc: 'Ấm áp, tôn đường sóng uốn' },
      { id: 'chestnut-brown', name: 'Nâu Hạt Dẻ', hex: '#6F4E37', desc: 'Nhẹ nhàng, tôn làn da nam Á Đông' },
      { id: 'moss-ash', name: 'Rêu Khói Ánh Xanh', hex: '#4A5568', desc: 'Phá cách, cuốn hút hiện đại' },
      { id: 'caramel-mocha', name: 'Nâu Mocha Caramel', hex: '#8B5A2B', desc: 'Trầm ấm, ngọt ngào lịch lãm' },
      { id: 'pure-platinum', name: 'Bạch Kim Khói', hex: '#E5E7EB', desc: 'Nổi bật, phong cách idol' }
    ],

    // ẢNH NGƯỜI THẬT CHỤP TẠI SALON (DÙNG ĐỂ THỬ NHANH KHI CHƯA BẬT CAMERA - KHÔNG DÙNG ẢNH AI ẢO)
    demoPortraits: [
      { name: 'Ảnh thật 01 (Anh Minh)', url: '/DataPicture/ChanDungTho/Tho4.jpg' },
      { name: 'Ảnh thật 02 (Anh Tuấn)', url: '/DataPicture/ChanDungTho/Tho2.jpg' },
      { name: 'Ảnh thật 03 (Anh Hùng)', url: '/DataPicture/ChanDungTho/Tho7.jpg' }
    ],

    // DỮ LIỆU TƯ VẤN KHUÔN MẶT TỪ BARBER MASTER
    faceConsultantMap: {
      all: {
        title: 'Tư Vấn Tổng Quan Mọi Khuôn Mặt',
        desc: 'Mỗi đường nét xương hàm và vòm trán đều có phom tóc hoàn hảo tương ứng. Chụp camera hoặc tải ảnh chân dung để hệ thống tự động nhận diện khuôn mặt thật của bạn.'
      },
      square: {
        title: 'Mặt Vuông Chữ Điền (Nam Tính & Quyền Lực)',
        desc: 'Góc hàm sắc nét nam tính, vòm trán rộng vững chãi. Phù hợp tuyệt vời với các phom tóc cổ điển lịch lãm: Side Part 7/3, Pompadour, Undercut hoặc Buzz Cut Fade.'
      },
      round: {
        title: 'Mặt Tròn (Đầy Đặn & Trẻ Trung)',
        desc: 'Chiều ngang và chiều dọc gương mặt tương đương nhau. Nên ưu tiên các kiểu tóc vuốt dựng có độ phồng cao như Short Quiff, Pompadour, High Fade 2 bên để kéo dài khuôn mặt.'
      },
      oval: {
        title: 'Mặt Trái Xoan (Cân Đối Hài Hòa)',
        desc: 'Gương mặt có tỉ lệ cân đối hài hòa của nam giới. Bạn có thể tự tin diện hầu hết mọi phom tóc từ Layer Hàn Quốc, Two-Block bồng bềnh đến Side Part hay Buzz Cut.'
      },
      oblong: {
        title: 'Mặt Dài & Trán Cao',
        desc: 'Chiều dài mặt lớn hơn chiều ngang. Khuyên dùng các phom tóc có mái rủ như French Crop Textured, Layer nhẹ hoặc Curtain Hair để cân đối lại chiều cao khuôn mặt.'
      },
      diamond: {
        title: 'Mặt Kim Cương (Gò Má Cao)',
        desc: 'Gò má rộng trong khi trán và cằm hẹp. Các kiểu tóc uốn xoăn bồng bềnh như Ripple Perm, Modern Mullet hoặc Messy Quiff sẽ làm mềm đường nét gò má cực kỳ hiệu quả.'
      },
      heart: {
        title: 'Mặt Trái Tim (Trán Rộng, Cằm Thon)',
        desc: 'Vầng trán rộng cân xứng với phần cằm gọn gàng. Rất hợp các phom tóc có mái rủ nhẹ như French Crop, Layer Hàn Quốc hoặc Two-Block 6/4.'
      }
    },

    render(container, params = {}) {
      if (!container) return;

      container.innerHTML = `
        <div class="omni-container" style="padding-top: 40px; padding-bottom: 80px; max-width: 1440px; margin: 0 auto; padding-left: clamp(16px, 3.5vw, 48px); padding-right: clamp(16px, 3.5vw, 48px); box-sizing: border-box;">
          
          <!-- Header Hero Chuyên Nghiệp -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; background: rgba(197, 155, 39, 0.12); border: 1px solid rgba(197, 155, 39, 0.35); border-radius: 20px; margin-bottom: 12px;">
              <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                OMNISALON BARBERSHOP CAMERA &amp; FACE-FIT STYLING
              </span>
            </div>
            <h1 class="font-serif tracking-tight leading-tight" style="font-size: clamp(28px, 4vw, 42px); font-weight: 700; color: var(--text-primary); margin: 0 0 10px;">
              CHỤP ẢNH NHẬN DIỆN KHUÔN MẶT &amp; THỬ KIỂU TÓC THẬT
            </h1>
            <p style="font-size: 14.5px; color: var(--text-secondary); max-width: 720px; margin: 0 auto; line-height: 1.6;">
              Mở camera chụp trực diện hoặc tải ảnh thật của bạn — hệ thống tự động nhận diện khuôn mặt, đo form vòm sọ 3D và gắn kiểu tóc chuẩn dáng đầu ngay lập tức.
            </p>
          </div>

          <!-- Studio Main Grid: 2 Cột Đối Xứng Cân Đối -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 28px; max-width: 1260px; margin: 0 auto; align-items: start;">
            
            <!-- CỘT TRÁI: KHUNG ẢNH CHÂN DUNG & NHẬN DIỆN KHUÔN MẶT + SLIDER -->
            <div class="ai-studio-panel" style="border-radius: 8px; padding: 22px; background: var(--surface-card); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
              
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                  ẢNH CHÂN DUNG CỦA BẠN
                </span>
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <button type="button" id="btnToggleFaceOverlay" onclick="AiStudioPage.toggleFaceOverlay()"
                          style="display: ${this.state.uploadedImage ? 'inline-flex' : 'none'}; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; cursor: pointer; border: 1px solid rgba(197,155,39,0.5); background: ${this.state.showFaceOverlay ? 'rgba(197,155,39,0.18)' : 'var(--surface-elevated)'}; color: #C59B27;">
                    <span>${this.state.showFaceOverlay ? 'Ẩn khung form mặt' : 'Hiện khung form mặt'}</span>
                  </button>
                  <span id="aiUploadStatusBadge" style="font-size: 11.5px; color: ${this.state.uploadedImage ? '#10B981' : 'var(--text-muted)'}; font-weight: 700;">
                    ● ${this.state.uploadedImage ? 'Đã nạp chân dung' : 'Chờ chụp / tải ảnh thật'}
                  </span>
                </div>
              </div>

              <!-- THANH CĂN CHỈNH GÓC CHÂN DUNG & TỰ ĐỘNG GẮN TÓC -->
              <div id="aiPreprocessBar" style="background: rgba(197, 155, 39, 0.08); border: 1px solid rgba(197, 155, 39, 0.25); border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                  <span style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    Khung Chân Dung &amp; Tự Động Bắt Form Đầu
                  </span>
                  <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: var(--text-primary); cursor: pointer;">
                    <input type="checkbox" id="chkAutoFitOnCapture" ${this.state.autoFitOnCapture ? 'checked' : ''} onchange="AiStudioPage.state.autoFitOnCapture = this.checked" style="accent-color: #C59B27;">
                    <span>Tự động gắn tóc sau khi chụp/chọn</span>
                  </label>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <button type="button" id="btnBaseModeCropped" onclick="AiStudioPage.switchBaseMode('cropped')" 
                          title="Tỉ lệ 3:4 chuẩn chân dung studio"
                          style="padding: 8px 10px; border-radius: 5px; font-size: 11.5px; font-weight: 800; cursor: pointer; border: 1px solid #C59B27; background: #C59B27; color: #141413; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s ease;">
                    <span>Tỉ lệ 3:4 chuẩn form đầu</span>
                  </button>
                  <button type="button" id="btnBaseModeRaw" onclick="AiStudioPage.switchBaseMode('raw')" 
                          title="Xem lại ảnh gốc nguyên bản ban đầu"
                          style="padding: 8px 10px; border-radius: 5px; font-size: 11.5px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s ease;">
                    <span>Ảnh gốc ban đầu</span>
                  </button>
                </div>
              </div>

              <!-- Dropzone & Viewport bọc ảnh -->
              <div id="aiNativeDropZone" 
                   ondragover="event.preventDefault(); this.style.borderColor='#C59B27';"
                   ondragleave="this.style.borderColor='var(--border-color)';"
                   ondrop="AiStudioPage.handleDrop(event)"
                   style="position: relative; border: 1.5px dashed var(--border-color); border-radius: 8px; background: var(--surface-elevated, #141413); overflow: hidden; min-height: 460px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                
                <!-- Input file ẩn để kích hoạt qua nút hoặc nhấp ô tải -->
                <input type="file" id="aiStudioFileInput" accept="image/*" 
                       onchange="AiStudioPage.handleFileSelected(event)"
                       style="display: none;" />

                <!-- Khung hiển thị ảnh có hỗ trợ So sánh Split-Slider mượt mà theo tỉ lệ chuẩn 3:4 -->
                <div id="aiPortraitViewport" 
                     onmousedown="AiStudioPage.handleViewportMouseDown(event)"
                     ontouchstart="AiStudioPage.handleViewportTouchStart(event)"
                     style="position: relative; width: 100%; max-width: 440px; aspect-ratio: 3 / 4; margin: 0 auto; overflow: hidden; display: ${this.state.uploadedImage ? 'block' : 'none'}; user-select: none; cursor: ${this.state.hasResult ? 'ew-resize' : 'default'}; touch-action: none;">
                  
                  <!-- ẢNH KẾT QUẢ KIỂU TÓC MỚI (NẰM DƯỚI) -->
                  <img id="aiResultPortrait" 
                       src="${this.state.resultImage || ''}" 
                       alt="Kiểu tóc mới" 
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

                  <!-- LỚP HIỂN THỊ KHUNG NHẬN DIỆN KHUÔN MẶT & FORM ĐẦU 3D -->
                  <svg id="aiFaceOverlaySvg" viewBox="0 0 100 100" preserveAspectRatio="none"
                       style="position: absolute; inset: 0; width: 100%; height: 100%; z-index: 4; pointer-events: none; display: none;"></svg>

                  <!-- THANH TRƯỢT SO SÁNH INTERACTIVE SLIDER DIVIDER (Vùng chạm 44px dễ kéo) -->
                  <div id="aiCompareSliderDivider" 
                       onmousedown="AiStudioPage.startSliderDrag(event)"
                       ontouchstart="AiStudioPage.startSliderDragTouch(event)"
                       style="display: ${this.state.hasResult ? 'flex' : 'none'}; position: absolute; top: 0; bottom: 0; left: ${this.state.sliderPosition}%; width: 44px; margin-left: -22px; z-index: 8; align-items: center; justify-content: center; cursor: ew-resize; touch-action: none;">
                    <div style="position: absolute; top: 0; bottom: 0; width: 2.5px; background: #C59B27; box-shadow: 0 0 10px rgba(0,0,0,0.6); pointer-events: none;"></div>
                    <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #C59B27; color: #141413; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; box-shadow: 0 2px 10px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.8); pointer-events: none;">
                      ⇄
                    </div>
                  </div>

                  <!-- OVERLAY XỬ LÝ THANH LỊCH -->
                  <div id="aiScanHudModal" style="display: none; position: absolute; inset: 0; background: rgba(20, 20, 19, 0.88); backdrop-filter: blur(4px); flex-direction: column; align-items: center; justify-content: center; z-index: 15; padding: 24px; text-align: center;">
                    <div style="width: 42px; height: 42px; border: 3px solid rgba(255,255,255,0.15); border-top-color: #C59B27; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 14px;"></div>
                    <div class="font-serif tracking-tight leading-tight" style="font-size: 16px; font-weight: 700; color: #FAF8F5;" id="aiScanHudTitle">ĐANG ĐO FORM ĐẦU &amp; GẮN TÓC THẬT...</div>
                    <div style="font-size: 12.5px; color: #A1A1AA; margin-top: 6px; max-width: 300px;" id="aiScanHudSub">Đang điều chỉnh góc nghiêng, hòa ánh sáng &amp; màu tóc...</div>
                    <div style="width: 220px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 16px; overflow: hidden;">
                      <div id="aiScanHudProgress" style="height: 100%; width: 0%; background: #C59B27; transition: width 0.2s ease;"></div>
                    </div>
                  </div>

                  <!-- BADGE TRẠNG THÁI GÓC ẢNH -->
                  <div id="aiViewBadgeBefore" style="display: ${this.state.hasResult ? 'block' : 'none'}; position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.8); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 10.5px; font-weight: 800; z-index: 5; border: 1px solid rgba(255,255,255,0.2); pointer-events: none;">
                    ẢNH GỐC
                  </div>
                  <div id="aiViewBadgeAfter" style="display: ${this.state.hasResult ? 'block' : 'none'}; position: absolute; bottom: 12px; right: 12px; background: #C59B27; color: #141413; padding: 4px 10px; border-radius: 4px; font-size: 10.5px; font-weight: 800; z-index: 5; box-shadow: 0 2px 8px rgba(0,0,0,0.4); pointer-events: none;">
                    KIỂU TÓC MỚI
                  </div>
                </div>

                <!-- Empty state khi chưa chụp / tải ảnh thật -->
                <div id="aiEmptyUploadUI" 
                     style="display: ${this.state.uploadedImage ? 'none' : 'flex'}; flex-direction: column; align-items: center; justify-content: center; padding: 32px 24px; text-align: center; width: 100%; box-sizing: border-box;">
                  <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(197, 155, 39, 0.12); border: 1px solid rgba(197, 155, 39, 0.4); margin-bottom: 14px; color: #C59B27; display: flex; align-items: center; justify-content: center;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>
                  <h4 style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0 0 8px;">Chụp hình trực tiếp hoặc tải ảnh thật của bạn</h4>
                  <p style="font-size: 12.5px; color: var(--text-secondary); max-width: 340px; margin: 0 0 18px; line-height: 1.5;">
                    Hệ thống tự động phát hiện khuôn mặt, đo vòm sọ 3D và gắn kiểu tóc theo đúng form đầu thực tế (không dùng ảnh mẫu ảo).
                  </p>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 340px;">
                    <button type="button" onclick="AiStudioPage.openCameraModal()" style="flex: 1; min-width: 140px; padding: 11px 14px; background: #C59B27; color: #141413; font-weight: 800; font-size: 12.5px; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer;">
                      Mở Camera Quét Mặt
                    </button>
                    <button type="button" onclick="AiStudioPage.triggerFileInput()" style="flex: 1; min-width: 140px; padding: 11px 14px; background: var(--surface-card); color: var(--text-primary); font-weight: 700; font-size: 12.5px; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                      Tải Ảnh Từ Thiết Bị
                    </button>
                  </div>
                </div>
              </div>

              <!-- Nút tải ảnh & Chụp Camera -->
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button type="button" onclick="AiStudioPage.openCameraModal()" class="nordic-btn-secondary" style="flex: 1; padding: 10px 14px; font-size: 12.5px; font-weight: 800; background: rgba(197, 155, 39, 0.14); border: 1px solid #C59B27; color: #C59B27; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <span>Chụp bằng camera</span>
                </button>
                <button type="button" onclick="AiStudioPage.triggerFileInput()" class="nordic-btn-secondary" style="flex: 1; padding: 10px 14px; font-size: 12.5px; font-weight: 700; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <span>Tải ảnh từ thiết bị</span>
                </button>
              </div>

              <!-- Thanh nút So sánh Trước / Sau -->
              <div id="aiCompareControls" style="display: ${this.state.hasResult ? 'flex' : 'none'}; align-items: center; justify-content: space-between; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 14px;">
                <span style="font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Chế Độ Xem:</span>
                <div style="display: flex; gap: 6px;">
                  <button type="button" id="btnModeSplit" onclick="AiStudioPage.setCompareMode('split')" style="background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer;">
                    Thanh Trượt ⇄
                  </button>
                  <button type="button" id="btnModeBefore" onclick="AiStudioPage.setCompareMode('before')" style="background: var(--surface-card); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer;">
                    Ảnh Gốc
                  </button>
                  <button type="button" id="btnModeAfter" onclick="AiStudioPage.setCompareMode('after')" style="background: var(--surface-card); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer;">
                    Kiểu Tóc Mới
                  </button>
                </div>
              </div>

              <!-- CHỌN NHANH ẢNH CHỤP NGƯỜI THẬT TẠI SALON -->
              <div>
                <span class="tracking-widest" style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 8px;">
                  HOẶC TEST NHANH VỚI ẢNH CHỤP NGƯỜI THẬT TẠI TIỆM:
                </span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${this.demoPortraits.map(dp => `
                    <button type="button" onclick="AiStudioPage.selectDemoPortrait('${dp.url}')" style="display: flex; align-items: center; gap: 6px; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 4px; padding: 5px 9px; cursor: pointer; color: var(--text-primary); font-size: 11.5px; font-weight: 600;">
                      <img src="${dp.url}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; object-position: center top;" alt="${dp.name}">
                      <span>${dp.name}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

            </div>

            <!-- CỘT PHẢI: BỘ SƯU TẬP 12 KIỂU TÓC + TƯ VẤN KHUÔN MẶT + TÙY CHỈNH TẠO KIỂU -->
            <div class="ai-studio-panel" style="border-radius: 8px; padding: 22px; background: var(--surface-card); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
              
              <!-- KHỐI TƯ VẤN PHOM TÓC THEO DÁNG MẶT THẬT -->
              <div id="aiFaceDiagnosticBox" style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                  <span style="font-size: 11px; font-weight: 800; color: #C59B27; letter-spacing: 0.5px; text-transform: uppercase;">
                    NHẬN DIỆN KHUÔN MẶT &amp; TƯ VẤN PHOM TÓC
                  </span>
                  <span id="aiFaceShapeBadge" style="font-size: 11px; background: var(--surface-card); border: 1px solid rgba(197,155,39,0.5); color: #C59B27; font-weight: 800; padding: 2px 8px; border-radius: 4px;">
                    CHỜ QUÉT ẢNH CHÂN DUNG
                  </span>
                </div>
                
                <div id="aiFaceDiagnosticText" style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
                  Hãy chụp camera hoặc chọn ảnh thật để hệ thống tự động đo tỷ lệ khuôn mặt, góc đầu 3D và gợi ý kiểu tóc hợp nhất.
                </div>

                <!-- BỘ CHỌN NHANH DÁNG MẶT CỦA BẠN -->
                <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
                  <button type="button" class="ai-faceshape-pill-btn selected" data-shape="all" onclick="AiStudioPage.selectFaceShape('all')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; border: 1px solid #C59B27; background: #C59B27; color: #141413; cursor: pointer;">
                    Tất cả
                  </button>
                  <button type="button" class="ai-faceshape-pill-btn" data-shape="square" onclick="AiStudioPage.selectFaceShape('square')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); cursor: pointer;">
                    Mặt Vuông
                  </button>
                  <button type="button" class="ai-faceshape-pill-btn" data-shape="round" onclick="AiStudioPage.selectFaceShape('round')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); cursor: pointer;">
                    Mặt Tròn
                  </button>
                  <button type="button" class="ai-faceshape-pill-btn" data-shape="oval" onclick="AiStudioPage.selectFaceShape('oval')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); cursor: pointer;">
                    Mặt Trái Xoan
                  </button>
                  <button type="button" class="ai-faceshape-pill-btn" data-shape="oblong" onclick="AiStudioPage.selectFaceShape('oblong')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); cursor: pointer;">
                    Mặt Dài
                  </button>
                  <button type="button" class="ai-faceshape-pill-btn" data-shape="diamond" onclick="AiStudioPage.selectFaceShape('diamond')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); cursor: pointer;">
                    Mặt Kim Cương
                  </button>
                </div>
              </div>

              <!-- DANH SÁCH 12 PHOM DÁNG TÓC THỊNH HÀNH -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                  <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    CHỌN PHOM DÁNG TÓC BARBERSHOP
                  </span>
                  <span style="font-size: 11px; color: var(--text-muted);" id="aiStyleCountLabel">12 kiểu tóc nam thịnh hành</span>
                </div>

                <!-- BỘ LỌC PHÂN LOẠI PHONG CÁCH -->
                <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 10px; scrollbar-width: none;">
                  <button type="button" class="ai-category-tab-btn" data-cat="all" onclick="AiStudioPage.filterCategory('all')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; border: 1px solid #C59B27; background: #C59B27; color: #141413; cursor: pointer; transition: all 0.15s ease;">
                    Tất cả (12)
                  </button>
                  <button type="button" class="ai-category-tab-btn" data-cat="classic" onclick="AiStudioPage.filterCategory('classic')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;">
                    Lịch lãm (4)
                  </button>
                  <button type="button" class="ai-category-tab-btn" data-cat="trends" onclick="AiStudioPage.filterCategory('trends')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;">
                    K-Style &amp; Trend (4)
                  </button>
                  <button type="button" class="ai-category-tab-btn" data-cat="edgy" onclick="AiStudioPage.filterCategory('edgy')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;">
                    Gọn gàng &amp; Fade (3)
                  </button>
                  <button type="button" class="ai-category-tab-btn" data-cat="wavy" onclick="AiStudioPage.filterCategory('wavy')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;">
                    Uốn Texture (1)
                  </button>
                </div>

                <!-- LƯỚI THẺ KIỂU TÓC TRỰC QUAN -->
                <div id="aiHairstylesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; max-height: 350px; overflow-y: auto; padding-right: 4px;">
                  ${this.hairstyles.map(h => {
        const isSelected = this.state.selectedHairstyle === h.id;
        return `
                      <div id="pillStyle_${h.id}"
                           class="ai-style-card ${isSelected ? 'selected' : ''}"
                           data-category="${h.category}"
                           data-facekeys="${(h.faceKeys || []).join(',')}"
                           onclick="AiStudioPage.selectHairstyle('${h.id}')"
                           style="padding: 9px 11px; border-radius: 8px; display: flex; gap: 10px; align-items: center; cursor: pointer; border: 1.5px solid ${isSelected ? '#C59B27' : 'var(--border-color)'}; background: ${isSelected ? 'rgba(197, 155, 39, 0.1)' : 'var(--surface-elevated)'}; transition: all 0.15s ease; position: relative;">
                        <img src="${h.preview}" alt="${h.name}" onerror="this.src='/assets/hairstyles/layer-korean.jpg'" style="width: 52px; height: 52px; border-radius: 6px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.15);" />
                        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;">
                          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                            <strong style="color: ${isSelected ? '#C59B27' : 'var(--text-primary)'}; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${h.name}</strong>
                            <span id="scoreTag_${h.id}" style="font-size: 9.5px; font-weight: 700; color: var(--text-muted); background: var(--surface-card); border: 1px solid var(--border-color); padding: 1px 5px; border-radius: 3px; flex-shrink: 0;">
                              Chờ quét
                            </span>
                          </div>
                          <span style="font-size: 9.5px; font-weight: 700; color: #C59B27; letter-spacing: 0.5px;">${h.tag} • ${h.length}</span>
                          <span style="font-size: 10px; color: var(--text-secondary); line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${h.desc}</span>
                        </div>
                        ${isSelected ? '<span class="ai-check-badge" style="position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; border-radius: 50%; background: #C59B27; color: #141413; font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">✓</span>' : ''}
                      </div>
                    `;
      }).join('')}
                </div>
              </div>

              <!-- CHI TIẾT PHOM TÓC ĐANG CHỌN -->
              <div id="aiSelectedStyleDetailBox" style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px; font-size: 11.5px; line-height: 1.5;">
                ${this._renderSelectedStyleDetailHTML()}
              </div>

              <!-- TÙY CHỈNH TẠO KIỂU: ĐỘ PHỒNG VÀ CHẤT LIỆU SÁP -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <span class="tracking-widest" style="font-size: 10.5px; font-weight: 800; color: #C59B27; text-transform: uppercase; display: block; margin-bottom: 6px;">
                    ĐỘ PHỒNG TÓC (VOLUME)
                  </span>
                  <div style="display: flex; gap: 4px;">
                    <button type="button" id="btnVol_natural" onclick="AiStudioPage.selectVolume('natural')" 
                            style="flex: 1; padding: 5px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer;">
                      Tự nhiên
                    </button>
                    <button type="button" id="btnVol_standard" onclick="AiStudioPage.selectVolume('standard')" 
                            style="flex: 1; padding: 5px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 800; border: 1px solid #C59B27; background: #C59B27; color: #141413; cursor: pointer;">
                      Tiêu chuẩn
                    </button>
                    <button type="button" id="btnVol_high" onclick="AiStudioPage.selectVolume('high')" 
                            style="flex: 1; padding: 5px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer;">
                      Bồng bềnh
                    </button>
                  </div>
                </div>

                <div>
                  <span class="tracking-widest" style="font-size: 10.5px; font-weight: 800; color: #C59B27; text-transform: uppercase; display: block; margin-bottom: 6px;">
                    CHẤT LIỆU SÁP (FINISH)
                  </span>
                  <div style="display: flex; gap: 4px;">
                    <button type="button" id="btnFin_matte" onclick="AiStudioPage.selectFinish('matte')" 
                            style="flex: 1; padding: 5px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 800; border: 1px solid #C59B27; background: #C59B27; color: #141413; cursor: pointer;">
                      Mờ tự nhiên
                    </button>
                    <button type="button" id="btnFin_gloss" onclick="AiStudioPage.selectFinish('gloss')" 
                            style="flex: 1; padding: 5px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer;">
                      Bóng Pomade
                    </button>
                  </div>
                </div>
              </div>

              <!-- BẢNG MÀU NHUỘM PHỐI HỢP -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                  <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    BẢNG MÀU NHUỘM TÔN DA (8 MÀU)
                  </span>
                  <span style="font-size: 10.5px; color: var(--text-muted);" id="aiSelectedColorLabel">Đen Tự Nhiên (Lịch thiệp, chuẩn công sở)</span>
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  ${this.hairColors.map(c => {
        const isSelected = this.state.selectedColor === c.id;
        return `
                      <button type="button" 
                              id="pillColor_${c.id}"
                              class="ai-color-pill-btn ${isSelected ? 'selected' : ''}"
                              title="${c.name} - ${c.desc || ''}"
                              onclick="AiStudioPage.selectColor('${c.id}')"
                              style="display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 5px; cursor: pointer; border: 1.5px solid ${isSelected ? '#C59B27' : 'var(--border-color)'}; background: ${isSelected ? 'rgba(197, 155, 39, 0.12)' : 'var(--surface-elevated)'}; font-size: 11px; font-weight: 700; transition: all 0.15s ease;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${c.hex}; display: inline-block; border: 1px solid rgba(255,255,255,0.4); flex-shrink: 0;"></span>
                        <span style="color: ${isSelected ? '#C59B27' : 'var(--text-primary)'};">${c.name}</span>
                      </button>
                    `;
      }).join('')}
                </div>
              </div>

              <!-- GHI CHÚ YÊU CẦU DÀNH CHO THỢ BARBER (TÙY CHỌN) -->
              <div style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px;">
                <label for="aiCustomPromptInput" style="display: block; font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase; margin-bottom: 6px;">
                  Ghi Chú Yêu Cầu Cho Thợ Cắt (Tùy Chọn)
                </label>
                <input type="text" id="aiCustomPromptInput" 
                       placeholder="VD: Cạo fade sát 2 bên mai, tỉa mỏng phần mái, giữ độ dài đỉnh 7cm..." 
                       style="width: 100%; box-sizing: border-box; padding: 8px 12px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 5px; font-size: 12px;" />
              </div>

              <!-- NÚT CTA CHÍNH: XEM TRƯỚC KIỂU TÓC -->
              <div style="margin-top: 4px;">
                <button type="button" class="nordic-btn-primary" id="btnRunAiRestyle" onclick="AiStudioPage.runAiRestyle()"
                        style="width: 100%; height: 48px; font-size: 14px; font-weight: 800; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease;">
                  <span id="aiBtnSpinner" style="display: none; width: 16px; height: 16px; border: 2.5px solid #141413; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                  <span id="aiBtnText">Xem trước kiểu tóc trên ảnh chân dung →</span>
                </button>

                <!-- Nút hành động khi đã có kết quả xem trước -->
                <div id="aiResultActions" style="display: ${this.state.hasResult ? 'flex' : 'none'}; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
                  <button type="button" onclick="AiStudioPage.bookThisHairstyle()"
                          style="flex: 1.4; min-width: 160px; padding: 10px 14px; font-size: 12.5px; font-weight: 800; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer;">
                    Đặt lịch cắt kiểu này ngay
                  </button>
                  <button type="button" onclick="AiStudioPage.downloadResultImage()"
                          style="flex: 1; min-width: 110px; padding: 10px 14px; font-size: 12.5px; font-weight: 600; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                    Tải ảnh kiểu tóc HD
                  </button>
                  <button type="button" onclick="AiStudioPage.resetAiRestyle()"
                          style="padding: 10px 14px; font-size: 12.5px; font-weight: 600; background: var(--surface-elevated); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                    Chọn kiểu khác
                  </button>
                </div>

                <!-- Lời khuyên tạo kiểu từ Barber Master -->
                <div id="aiAnalysisCard" style="display: ${this.state.hasResult ? 'block' : 'none'}; margin-top: 12px; padding: 12px 14px; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px;">
                  <div style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase; margin-bottom: 6px;">
                    Lời Khuyên Tạo Kiểu Từ Barber Master
                  </div>
                  <div id="aiBarberAdviceText" style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px;">
                    Kiểu tóc này mang lại phong thái đĩnh đạc và cuốn hút. Hãy sấy nâng phom chân tóc khi còn ẩm và hoàn thiện bằng sáp giữ nếp mờ.
                  </div>
                  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; font-size: 11.5px; color: var(--text-muted);">
                    <div>• Sáp khuyên dùng: <strong id="aiProductRec" style="color: #C59B27;">Apestomen Volcanic Clay</strong></div>
                    <div>• Chu kỳ cắt tỉa: <strong style="color: #10B981;">3 - 4 tuần / lần</strong></div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      `;

      // Khởi tạo các chi tiết giao diện & tự động phân tích nếu vừa nhận ảnh từ Trang chủ
      this._updateSelectedStyleDetail();
      if (this.state.pendingAutoAnalyze && this.state.uploadedImage) {
        this.state.pendingAutoAnalyze = false;
        const pendingImg = this.state.originalRawImage || this.state.uploadedImage;
        setTimeout(() => this.analyzeAndFitFace(pendingImg, { autoRestyle: true }), 60);
      } else if (this.state.faceAnalysis && this.state.faceAnalysis.success) {
        this._applyFaceAnalysisToUI(this.state.faceAnalysis);
        if (this.state.hasResult) {
          this.setCompareMode(this.state.compareMode || 'split');
        }
      }
    },

    _renderSelectedStyleDetailHTML() {
      const cur = this.hairstyles.find(h => h.id === this.state.selectedHairstyle) || this.hairstyles[0];
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: #C59B27; font-size: 12.5px;">${cur.name}</strong>
          <span style="color: #10B981; font-weight: 700;">Hợp: ${cur.faceShape}</span>
        </div>
        <div style="color: var(--text-secondary); font-size: 11px; margin-bottom: 6px;">
          ${cur.desc}
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 10.5px; color: var(--text-muted);">
          <span>Độ dài: <strong style="color: var(--text-primary);">${cur.length}</strong></span>
          <span>Độ phồng: <strong style="color: var(--text-primary);">${cur.volume}</strong></span>
          <span>Sản phẩm: <strong style="color: #C59B27;">${cur.finish}</strong></span>
        </div>
      `;
    },

    _updateSelectedStyleDetail() {
      const el = document.getElementById('aiSelectedStyleDetailBox');
      if (el) el.innerHTML = this._renderSelectedStyleDetailHTML();
    },

    // CHỌN DÁNG MẶT ĐỂ TƯ VẤN (KHÔNG GHI ĐÈ ĐIỂM ĐO THẬT TỪ MEDIAPIPE)
    selectFaceShape(shapeKey) {
      this.state.selectedFaceShape = shapeKey;

      // Cập nhật các nút pill dáng mặt
      document.querySelectorAll('.ai-faceshape-pill-btn').forEach(btn => {
        const isAct = btn.getAttribute('data-shape') === shapeKey;
        btn.classList.toggle('selected', isAct);
        btn.style.background = isAct ? '#C59B27' : 'var(--surface-card)';
        btn.style.color = isAct ? '#141413' : 'var(--text-secondary)';
        btn.style.borderColor = isAct ? '#C59B27' : 'var(--border-color)';
        btn.style.fontWeight = isAct ? '800' : '600';
      });

      // Cập nhật lời tư vấn
      const info = this.faceConsultantMap[shapeKey] || this.faceConsultantMap.all;
      const titleEl = document.getElementById('aiFaceShapeBadge');
      const textEl = document.getElementById('aiFaceDiagnosticText');
      if (titleEl) titleEl.textContent = info.title.toUpperCase();
      if (textEl) textEl.textContent = info.desc;

      const realScores = this.state.faceAnalysis?.styleScores || null;

      // Cập nhật nhãn gợi ý trên các thẻ tóc mà không bịa điểm % nếu chưa phân tích khuôn mặt
      this.hairstyles.forEach(h => {
        const scoreTag = document.getElementById(`scoreTag_${h.id}`);
        if (!scoreTag) return;
        const matches = (shapeKey === 'all') || (h.faceKeys && h.faceKeys.includes(shapeKey));
        if (realScores && realScores[h.id]) {
          const sObj = realScores[h.id];
          const val = (typeof sObj === 'object' ? sObj?.score : sObj);
          if (val) {
            scoreTag.textContent = `${val}%`;
            const isTop = (shapeKey !== 'all' && matches) || sObj?.isTopMatch || Number(val) >= 95;
            scoreTag.style.color = isTop ? '#C59B27' : '#10B981';
            scoreTag.style.background = isTop ? 'rgba(197, 155, 39, 0.22)' : 'rgba(16, 185, 129, 0.12)';
            scoreTag.style.border = 'none';
            return;
          }
        }
        if (shapeKey === 'all') {
          scoreTag.textContent = 'Chờ quét';
          scoreTag.style.color = 'var(--text-muted)';
          scoreTag.style.background = 'var(--surface-card)';
          scoreTag.style.border = '1px solid var(--border-color)';
        } else {
          scoreTag.textContent = matches ? 'Rất hợp' : 'Tham khảo';
          scoreTag.style.color = matches ? '#C59B27' : 'var(--text-secondary)';
          scoreTag.style.background = matches ? 'rgba(197, 155, 39, 0.18)' : 'var(--surface-card)';
          scoreTag.style.border = matches ? '1px solid rgba(197, 155, 39, 0.4)' : '1px solid var(--border-color)';
        }
      });

      if (window.UICommon) {
        window.UICommon.showToast(`Đã chọn tư vấn cho: ${info.title}`, 'info');
      }
    },

    // CHỌN ĐỘ PHỒNG TÓC
    selectVolume(vol) {
      this.state.selectedVolume = vol;
      ['natural', 'standard', 'high'].forEach(v => {
        const btn = document.getElementById(`btnVol_${v}`);
        if (!btn) return;
        const isAct = v === vol;
        btn.style.background = isAct ? '#C59B27' : 'var(--surface-elevated)';
        btn.style.color = isAct ? '#141413' : 'var(--text-secondary)';
        btn.style.borderColor = isAct ? '#C59B27' : 'var(--border-color)';
        btn.style.fontWeight = isAct ? '800' : '600';
      });
    },

    // CHỌN CHẤT LIỆU SÁP
    selectFinish(finish) {
      this.state.selectedFinish = finish;
      ['matte', 'gloss'].forEach(f => {
        const btn = document.getElementById(`btnFin_${f}`);
        if (!btn) return;
        const isAct = f === finish;
        btn.style.background = isAct ? '#C59B27' : 'var(--surface-elevated)';
        btn.style.color = isAct ? '#141413' : 'var(--text-secondary)';
        btn.style.borderColor = isAct ? '#C59B27' : 'var(--border-color)';
        btn.style.fontWeight = isAct ? '800' : '600';
      });
    },

    // CHỌN PHOM TÓC & MÀU NHUỘM
    selectHairstyle(styleId) {
      this.state.selectedHairstyle = styleId;
      const found = this.hairstyles.find(h => h.id === styleId);
      if (found && window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`Đã chọn phom tóc: ${found.name}`, 'info');
      }
      this._updateHairstyleUI();
      this._updateSelectedStyleDetail();
    },

    selectColor(colorId) {
      this.state.selectedColor = colorId;
      const found = this.hairColors.find(c => c.id === colorId);
      if (found && window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`Đã chọn màu nhuộm: ${found.name}`, 'info');
      }
      this._updateColorUI();
    },

    // Chuyển chế độ xem ảnh (3:4 chuẩn form đầu / ảnh gốc)
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
        if (this.state.faceAnalysis) {
          this._renderFaceOverlaySvg(this.state.faceAnalysis);
        }
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
    },

    toggleFaceOverlay() {
      this.state.showFaceOverlay = !this.state.showFaceOverlay;
      const btn = document.getElementById('btnToggleFaceOverlay');
      if (btn) {
        btn.style.background = this.state.showFaceOverlay ? 'rgba(197,155,39,0.18)' : 'var(--surface-elevated)';
        const span = btn.querySelector('span');
        if (span) span.textContent = this.state.showFaceOverlay ? 'Ẩn khung form mặt' : 'Hiện khung form mặt';
      }
      this._renderFaceOverlaySvg(this.state.faceAnalysis);
    },

    _renderFaceOverlaySvg(faceAnalysis) {
      const svg = document.getElementById('aiFaceOverlaySvg');
      if (!svg) return;
      if (!this.state.showFaceOverlay || !faceAnalysis || !faceAnalysis.success) {
        svg.style.display = 'none';
        svg.innerHTML = '';
        return;
      }

      const isCropped = this.state.activeBaseMode !== 'raw' && Boolean(this.state.croppedImage);
      const norm = (isCropped && faceAnalysis.croppedGeometry?.normalized)
        ? faceAnalysis.croppedGeometry.normalized
        : (faceAnalysis.geometry?.normalized || null);

      if (!norm || typeof norm.centerX !== 'number') {
        svg.style.display = 'none';
        svg.innerHTML = '';
        return;
      }

      const cx = norm.centerX * 100;
      const lCheek = (norm.leftCheekX || (norm.centerX - 0.16)) * 100;
      const rCheek = (norm.rightCheekX || (norm.centerX + 0.16)) * 100;
      const topY = (norm.skullTopY || Math.max(0.03, (norm.foreheadY || 0.25) - 0.16)) * 100;
      const chinY = (norm.chinY || 0.65) * 100;
      const rx = Math.max(12, (rCheek - lCheek) * 0.56);
      const cy = (topY + chinY) * 0.5;
      const ry = Math.max(18, (chinY - topY) * 0.52);

      const toPoints = (arr) => (Array.isArray(arr) ? arr.map(p => `${(p.x * 100).toFixed(2)},${(p.y * 100).toFixed(2)}`).join(' ') : '');
      const hairlinePts = toPoints(norm.hairlineArc);
      const jawPts = toPoints(norm.jawContour);
      const shapeLabel = (faceAnalysis.faceShape?.name || 'Khuôn mặt').split(' (')[0];

      svg.innerHTML = `
        <ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}"
                 fill="none" stroke="rgba(197, 155, 39, 0.72)" stroke-width="0.55" stroke-dasharray="2.2,1.6" />
        ${hairlinePts ? `<polyline points="${hairlinePts}" fill="none" stroke="#10B981" stroke-width="0.65" stroke-linecap="round" stroke-linejoin="round" />` : ''}
        ${jawPts ? `<polyline points="${jawPts}" fill="none" stroke="rgba(250, 248, 245, 0.75)" stroke-width="0.5" stroke-dasharray="1.4,1.2" stroke-linecap="round" stroke-linejoin="round" />` : ''}
        <circle cx="${cx.toFixed(2)}" cy="${topY.toFixed(2)}" r="1.05" fill="#C59B27" />
        <rect x="3" y="2.5" width="52" height="5.5" rx="1.5" fill="rgba(20, 20, 19, 0.78)" stroke="rgba(16, 185, 129, 0.75)" stroke-width="0.35" />
        <text x="5.2" y="6.1" fill="#10B981" font-size="2.7" font-weight="800" font-family="sans-serif">✓ BẮT FORM: ${shapeLabel.toUpperCase()}</text>
      `;
      svg.style.display = 'block';
    },

    _applyFaceAnalysisToUI(analysis) {
      if (!analysis || !analysis.success) return;
      this.state.faceAnalysis = analysis;

      const shapeName = analysis.faceShape?.name || 'Đã nhận diện';
      const shapeCode = (analysis.faceShape?.code || 'oval').toLowerCase();
      const badgeEl = document.getElementById('aiFaceShapeBadge');
      const textEl = document.getElementById('aiFaceDiagnosticText');
      if (badgeEl) {
        badgeEl.textContent = shapeName.toUpperCase();
        badgeEl.style.background = '#C59B27';
        badgeEl.style.color = '#141413';
      }
      if (textEl) {
        const yaw = analysis.metrics?.headYawDegrees ?? 0;
        const roll = analysis.metrics?.headRollDegrees ?? 0;
        textEl.textContent = `${analysis.barberAdvice || ''} (Trục nghiêng: ${roll}°, xoay mặt: ${yaw}°)`;
      }

      document.querySelectorAll('.ai-faceshape-pill-btn').forEach(btn => {
        const isAct = btn.getAttribute('data-shape') === shapeCode;
        btn.classList.toggle('selected', isAct);
        btn.style.background = isAct ? '#C59B27' : 'var(--surface-card)';
        btn.style.color = isAct ? '#141413' : 'var(--text-secondary)';
        btn.style.borderColor = isAct ? '#C59B27' : 'var(--border-color)';
        btn.style.fontWeight = isAct ? '800' : '600';
      });

      if (analysis.styleScores) {
        this.hairstyles.forEach(h => {
          const scoreTag = document.getElementById(`scoreTag_${h.id}`);
          const sObj = analysis.styleScores[h.id];
          const val = (typeof sObj === 'object' ? sObj?.score : sObj);
          if (scoreTag && val) {
            scoreTag.textContent = `${val}%`;
            const isTop = (sObj && sObj.isTopMatch) || Number(val) >= 95;
            scoreTag.style.color = isTop ? '#C59B27' : '#10B981';
            scoreTag.style.background = isTop ? 'rgba(197, 155, 39, 0.22)' : 'rgba(16, 185, 129, 0.12)';
          }
        });
      }

      this._renderFaceOverlaySvg(analysis);
    },

    async analyzeAndFitFace(rawImageSource, { autoRestyle = true } = {}) {
      const token = (this._portraitLoadToken = (this._portraitLoadToken || 0) + 1);
      const statusBadge = document.getElementById('aiUploadStatusBadge');
      const toggleOverlayBtn = document.getElementById('btnToggleFaceOverlay');
      if (toggleOverlayBtn) toggleOverlayBtn.style.display = 'inline-flex';
      if (statusBadge) {
        statusBadge.textContent = '● Đang phát hiện khuôn mặt & đo form đầu...';
        statusBadge.style.color = '#C59B27';
      }

      this.state.isAnalyzingFace = true;
      try {
        const res = await fetch('/api/ai/analyze-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: rawImageSource })
        });
        const data = await res.json();
        if (token !== this._portraitLoadToken) return;

        if (data && data.success) {
          if (data.croppedImageUrl) {
            this.state.croppedImage = data.croppedImageUrl;
            if (this.state.activeBaseMode !== 'raw') {
              this.state.uploadedImage = data.croppedImageUrl;
              const srcImg = document.getElementById('aiSourcePortrait');
              if (srcImg) srcImg.src = data.croppedImageUrl;
            }
          }

          this._applyFaceAnalysisToUI(data);
          if (statusBadge) {
            statusBadge.textContent = `✓ Đã nhận diện: ${data.faceShape?.name || 'Khuôn mặt'}`;
            statusBadge.style.color = '#10B981';
          }

          if (autoRestyle && this.state.autoFitOnCapture) {
            await this.runAiRestyle();
          }
        } else {
          if (statusBadge) {
            statusBadge.textContent = '! Không phát hiện khuôn mặt rõ nét';
            statusBadge.style.color = '#EF4444';
          }
          const badgeEl = document.getElementById('aiFaceShapeBadge');
          if (badgeEl) badgeEl.textContent = 'CHƯA THẤY KHUÔN MẶT RÕ';
          this._renderFaceOverlaySvg(null);
          if (window.UICommon) {
            window.UICommon.showToast(data?.message || 'Chưa nhận diện rõ khuôn mặt trong ảnh. Vui lòng chụp thẳng góc và đủ sáng.', 'warning');
          }
        }
      } catch (err) {
        if (statusBadge) {
          statusBadge.textContent = '! Lỗi phân tích khuôn mặt';
          statusBadge.style.color = '#EF4444';
        }
      } finally {
        this.state.isAnalyzingFace = false;
      }
    },

    _prepareLoadedPortrait(imageSource) {
      this.state.originalRawImage = imageSource;
      this.state.uploadedImage = imageSource;
      this.state.croppedImage = null;
      this.state.hasResult = false;
      this.state.resultImage = null;
      this.state.faceAnalysis = null;
      this.state.showFaceOverlay = true;

      const srcImg = document.getElementById('aiSourcePortrait');
      const resImg = document.getElementById('aiResultPortrait');
      const previewBox = document.getElementById('aiPortraitViewport');
      const emptyUI = document.getElementById('aiEmptyUploadUI');

      if (previewBox) previewBox.style.display = 'block';
      if (emptyUI) emptyUI.style.display = 'none';
      if (srcImg) {
        srcImg.crossOrigin = 'anonymous';
        srcImg.src = imageSource;
      }
      if (resImg) {
        resImg.src = '';
        resImg.style.display = 'none';
      }

      this._renderFaceOverlaySvg(null);
      this._toggleResultState(false);
      this.setCompareMode('before');
    },

    selectDemoPortrait(url) {
      const proxiedUrl = (url && url.startsWith('http') && !url.includes('/api/ai/proxy-image'))
        ? ('/api/ai/proxy-image?url=' + encodeURIComponent(url))
        : url;
      this._prepareLoadedPortrait(proxiedUrl);
      this.analyzeAndFitFace(proxiedUrl, { autoRestyle: true });
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
        const dataUrl = e.target.result;
        this._prepareLoadedPortrait(dataUrl);
        this.analyzeAndFitFace(dataUrl, { autoRestyle: true });
      };
      reader.readAsDataURL(file);
    },

    // THỰC HIỆN TẠO PHOM TÓC XEM TRƯỚC (NHẸ NHÀNG, MƯỢT MÀ, KHÔNG LASER/RADAR SCI-FI)
    async runAiRestyle() {
      if (this.state.isProcessing) return;

      const sourceImg = document.getElementById('aiSourcePortrait');
      // Luôn gửi ảnh gốc ban đầu (tránh auto-crop 2 lần gây lệch khung Before/After)
      const photoToSend = this.state.originalRawImage || this.state.uploadedImage || (sourceImg ? sourceImg.src : '');
      if (!photoToSend) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng tải ảnh chân dung lên trước!', 'warning');
        return;
      }

      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle) || this.hairstyles[0];
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor) || this.hairColors[0];

      this.state.isProcessing = true;
      this.state.hasResult = false;

      const hud = document.getElementById('aiScanHudModal');
      const hudProgress = document.getElementById('aiScanHudProgress');
      const hudSub = document.getElementById('aiScanHudSub');
      const btn = document.getElementById('btnRunAiRestyle');
      const spinner = document.getElementById('aiBtnSpinner');
      const text = document.getElementById('aiBtnText');
      const resultImgEl = document.getElementById('aiResultPortrait');

      if (hud) hud.style.display = 'flex';
      if (spinner) spinner.style.display = 'inline-block';
      if (text) text.textContent = 'Đang Uốn Phom Tóc 3D...';
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.75';
      }
      if (resultImgEl) resultImgEl.style.display = 'none';

      if (hudProgress) hudProgress.style.width = '30%';
      if (hudSub) hudSub.textContent = `Đang phân tích 478 điểm mốc 3D và định hình tóc: ${currentStyle.name}...`;

      try {
        if (hudProgress) hudProgress.style.width = '55%';
        if (hudSub) hudSub.textContent = 'Đang uốn phom sọ 3D, giữ nguyên hậu cảnh & hòa sắc ánh sáng phòng...';

        const customPromptInput = document.getElementById('aiCustomPromptInput');
        const customPrompt = customPromptInput ? customPromptInput.value.trim() : '';

        const res = await fetch('/api/ai/restyle-hair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: photoToSend,
            hairstyleId: currentStyle.id,
            colorId: currentColor.id,
            colorHex: currentColor.hex || '#141413',
            volume: this.state.selectedVolume || 'standard',
            finish: this.state.selectedFinish || 'matte',
            customPrompt,
            balanceLighting: true,
            smoothSkin: true,
            preserveBackground: true
          })
        });

        if (hudProgress) hudProgress.style.width = '85%';
        if (hudSub) hudSub.textContent = `Đang hòa sắc màu nhuộm ${currentColor.name} & bảo toàn ngũ quan thật...`;

        const data = await res.json();

        if (data && data.success && data.resultImageUrl) {
          if (hudProgress) hudProgress.style.width = '100%';
          if (hudSub) hudSub.textContent = 'Hoàn tất phom tóc chuẩn salon!';

          const resultUrl = data.resultImageUrl;
          this.state.resultImage = resultUrl;
          this.state.hasResult = true;
          this.state.lastRestyleMeta = {
            suggestedService: data.suggestedService || null,
            suggestedProduct: data.suggestedProduct || null
          };

          // Đồng bộ ảnh nguồn sang khung 3:4 chuẩn nếu đang ở chế độ Ảnh gốc để thanh trượt Before/After khớp từng pixel
          if (this.state.activeBaseMode === 'raw' && this.state.croppedImage) {
            this.switchBaseMode('cropped');
          }

          // Tạm ẩn khung lưới form đầu để xem tóc ghép sạch tự nhiên (vẫn có nút bật lại)
          this.state.showFaceOverlay = false;
          this._renderFaceOverlaySvg(null);
          const overlayBtn = document.getElementById('btnToggleFaceOverlay');
          if (overlayBtn) {
            overlayBtn.style.background = 'var(--surface-elevated)';
            const sp = overlayBtn.querySelector('span');
            if (sp) sp.textContent = 'Hiện khung form mặt';
          }

          if (resultImgEl) {
            resultImgEl.src = resultUrl;
            resultImgEl.style.display = 'block';
          }

          this._toggleResultState(true);
          this.setCompareMode('split');

          if (data.faceAnalysis && data.faceAnalysis.faceShape) {
            this.state.faceShape = data.faceAnalysis.faceShape.name;
            if (!this.state.faceAnalysis) {
              this._applyFaceAnalysisToUI({ success: true, ...data.faceAnalysis });
              this.state.showFaceOverlay = false;
              this._renderFaceOverlaySvg(null);
            }
          }

          // Cập nhật lời khuyên thợ & sản phẩm thực tế từ SQL (không dùng tên sản phẩm bịa đặt)
          const adviceEl = document.getElementById('aiBarberAdviceText');
          const prodEl = document.getElementById('aiProductRec');
          const volText = this.state.selectedVolume === 'high' ? 'sấy nâng chân tóc tạo độ bồng bềnh tối đa' : (this.state.selectedVolume === 'natural' ? 'sấy xuôi giữ nếp tự nhiên nhẹ nhàng' : 'sấy nâng phom vừa phải khi tóc còn ẩm');
          const finText = this.state.selectedFinish === 'gloss' ? 'Pomade giữ nếp bóng bẩy lịch lãm' : 'Sáp Clay lì tự nhiên không bết rít';
          if (adviceEl) {
            adviceEl.textContent = `Kiểu tóc [${currentStyle.name}] màu ${currentColor.name} tôn trọn đường nét gương mặt thật của bạn — khuyên ${volText} và hoàn thiện với ${finText}.`;
          }
          if (prodEl) {
            prodEl.textContent = data.suggestedProduct?.name || currentStyle.suggestedProductName || 'Apestomen Volcanic Clay VIP';
          }

          if (window.UICommon) {
            window.UICommon.showToast(`Đã tạo phom tóc "${currentStyle.name}" chân thực thành công!`, 'success');
          }
        } else {
          const errMsg = (data && data.message) ? data.message : 'Không thể nhận diện khuôn mặt rõ nét trong ảnh. Vui lòng chụp góc thẳng và sáng rõ.';
          if (window.UICommon) {
            window.UICommon.showToast(errMsg, 'warning');
          }
        }
      } catch (err) {
        if (window.UICommon) {
          window.UICommon.showToast('Lỗi kết nối máy chủ AI: ' + err.message, 'error');
        }
      } finally {
        this.state.isProcessing = false;
        if (hud) hud.style.display = 'none';
        if (spinner) spinner.style.display = 'none';
        if (text) text.textContent = 'Xem trước kiểu tóc trên ảnh chân dung →';
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
        }
      }
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
      const bBefore = document.getElementById('aiViewBadgeBefore');
      const bAfter = document.getElementById('aiViewBadgeAfter');

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

      const hasRes = Boolean(this.state.hasResult);

      if (mode === 'split') {
        if (viewport) viewport.style.cursor = 'ew-resize';
        if (clipper) clipper.style.clipPath = `inset(0 ${100 - this.state.sliderPosition}% 0 0)`;
        if (divider) {
          divider.style.display = 'flex';
          divider.style.left = this.state.sliderPosition + '%';
        }
        if (bBefore) bBefore.style.display = hasRes ? 'block' : 'none';
        if (bAfter) bAfter.style.display = hasRes ? 'block' : 'none';
        if (btnSplit) {
          btnSplit.style.background = '#C59B27';
          btnSplit.style.color = '#141413';
          btnSplit.style.borderColor = '#C59B27';
        }
      } else if (mode === 'before') {
        if (viewport) viewport.style.cursor = 'default';
        if (clipper) clipper.style.clipPath = 'inset(0 0 0 0)';
        if (divider) divider.style.display = 'none';
        if (bBefore) bBefore.style.display = hasRes ? 'block' : 'none';
        if (bAfter) bAfter.style.display = 'none';
        if (btnBefore) {
          btnBefore.style.background = '#C59B27';
          btnBefore.style.color = '#141413';
          btnBefore.style.borderColor = '#C59B27';
        }
      } else if (mode === 'after') {
        if (viewport) viewport.style.cursor = 'default';
        if (clipper) clipper.style.clipPath = 'inset(0 100% 0 0)';
        if (divider) divider.style.display = 'none';
        if (bBefore) bBefore.style.display = 'none';
        if (bAfter) bAfter.style.display = hasRes ? 'block' : 'none';
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

    // CHỤP ẢNH BẰNG CAMERA THIẾT BỊ (NHẬN DIỆN KHUÔN MẶT TRỰC TIẾP & TỰ ĐỘNG GẮN TÓC THEO FORM ĐẦU)
    openCameraModal() {
      this.closeCameraModal();
      const modalHtml = `
        <div id="aiCameraModalBackdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;">
          <div style="background: var(--surface-card, #1c1c1f); border: 1px solid var(--border-color, #333); border-radius: 10px; width: 100%; max-width: 440px; padding: 18px; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <strong style="color: var(--text-primary); font-size: 15.5px; display: block;">Camera Quét Khuôn Mặt 3D</strong>
                <span style="font-size: 11px; color: var(--text-secondary);">Đưa khuôn mặt vào khung oval để tự động đo form đầu</span>
              </div>
              <button type="button" onclick="AiStudioPage.closeCameraModal()" style="background: transparent; border: none; font-size: 20px; color: var(--text-secondary); cursor: pointer;">✕</button>
            </div>
            
            <div style="position: relative; width: 100%; aspect-ratio: 3 / 4; max-height: 440px; margin: 0 auto 12px; background: #000; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
              <video id="aiCameraVideo" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);"></video>
              <canvas id="aiCameraCanvas" style="display: none;"></canvas>

              <!-- Khung hướng dẫn căn mặt & nhận diện live -->
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;">
                <path d="M0,0 H100 V100 H0 Z M50,18 A23,29 0 1,0 50.01,18 Z" fill="rgba(0,0,0,0.34)" fill-rule="evenodd" />
                <ellipse id="aiCameraGuideOval" cx="50" cy="47" rx="23" ry="29" fill="none" stroke="#C59B27" stroke-width="0.9" stroke-dasharray="3,2" />
                <line x1="50" y1="15" x2="50" y2="21" stroke="rgba(197,155,39,0.75)" stroke-width="0.6" />
              </svg>

              <div id="aiCameraFacePill" style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: rgba(20, 20, 19, 0.85); color: #C59B27; border: 1px solid rgba(197,155,39,0.55); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; pointer-events: none;">
                ● Đang bật camera &amp; dò khuôn mặt...
              </div>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="button" id="btnCaptureCameraShot" onclick="AiStudioPage.captureCameraShot()" style="flex: 1; padding: 12px; background: #C59B27; color: #141413; font-weight: 800; border-radius: 6px; border: 1px solid #C59B27; cursor: pointer;">
                Chụp Ảnh &amp; Gắn Kiểu Tóc
              </button>
              <button type="button" onclick="AiStudioPage.closeCameraModal()" style="padding: 12px 18px; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                Hủy
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } } })
          .then(stream => {
            const video = document.getElementById('aiCameraVideo');
            if (video) {
              video.srcObject = stream;
              this._activeStream = stream;
              this._startLiveCameraFaceLoop();
            } else {
              stream.getTracks().forEach(t => t.stop());
            }
          })
          .catch(err => {
            console.warn('Camera unavailable:', err && err.message ? err.message : err);
            if (window.UICommon) window.UICommon.showToast('Không thể mở camera: ' + err.message, 'error');
            this.closeCameraModal();
          });
      } else {
        if (window.UICommon) {
          window.UICommon.showToast('Thiết bị hoặc kết nối HTTP không hỗ trợ truy cập camera trực tiếp. Vui lòng dùng HTTPS/localhost hoặc tải ảnh từ thiết bị.', 'error');
        }
        this.closeCameraModal();
      }
    },

    _startLiveCameraFaceLoop() {
      if (this._camDetectTimer) clearInterval(this._camDetectTimer);
      this._camDetectBusy = false;

      const probeCanvas = document.createElement('canvas');
      probeCanvas.width = 240;
      probeCanvas.height = 320;
      const probeCtx = probeCanvas.getContext('2d');

      this._camDetectTimer = setInterval(async () => {
        if (this._camDetectBusy) return;
        const video = document.getElementById('aiCameraVideo');
        const oval = document.getElementById('aiCameraGuideOval');
        const pill = document.getElementById('aiCameraFacePill');
        if (!video || !video.videoWidth || !this._activeStream) return;

        this._camDetectBusy = true;
        try {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          const targetAspect = 3 / 4;
          let sx = 0, sy = 0, sw = vw, sh = vh;
          if (vw / vh > targetAspect) {
            sw = vh * targetAspect;
            sx = (vw - sw) / 2;
          } else {
            sh = vw / targetAspect;
            sy = (vh - sh) / 2;
          }

          probeCtx.save();
          probeCtx.translate(probeCanvas.width, 0);
          probeCtx.scale(-1, 1);
          probeCtx.drawImage(video, sx, sy, sw, sh, 0, 0, probeCanvas.width, probeCanvas.height);
          probeCtx.restore();

          const frameData = probeCanvas.toDataURL('image/jpeg', 0.7);
          const res = await fetch('/api/ai/analyze-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: frameData, includeAssets: false })
          });
          const data = await res.json();

          if (!this._activeStream) return;
          if (data && data.success) {
            const shapeShort = (data.faceShape?.name || 'Khuôn mặt').split(' (')[0];
            if (oval) {
              oval.setAttribute('stroke', '#10B981');
              oval.removeAttribute('stroke-dasharray');
            }
            if (pill) {
              pill.style.color = '#10B981';
              pill.style.borderColor = '#10B981';
              pill.textContent = `✓ Đã bắt mặt (${shapeShort}) • Giữ thẳng để chụp`;
            }
          } else {
            if (oval) {
              oval.setAttribute('stroke', '#C59B27');
              oval.setAttribute('stroke-dasharray', '3,2');
            }
            if (pill) {
              pill.style.color = '#C59B27';
              pill.style.borderColor = 'rgba(197,155,39,0.55)';
              pill.textContent = '● Đưa mặt vào giữa khung hình sáng rõ';
            }
          }
        } catch (_) {
        } finally {
          this._camDetectBusy = false;
        }
      }, 750);
    },

    captureCameraShot() {
      const video = document.getElementById('aiCameraVideo');
      const canvas = document.getElementById('aiCameraCanvas');
      if (!video || !canvas) return;

      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 640;
      const targetAspect = 3 / 4;
      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (vw / vh > targetAspect) {
        sw = vh * targetAspect;
        sx = (vw - sw) / 2;
      } else {
        sh = vw / targetAspect;
        sy = (vh - sh) / 2;
      }

      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      const capturedBase64 = canvas.toDataURL('image/jpeg', 0.94);
      this.closeCameraModal();

      this._prepareLoadedPortrait(capturedBase64);
      this.analyzeAndFitFace(capturedBase64, { autoRestyle: true });
    },

    closeCameraModal() {
      if (this._camDetectTimer) {
        clearInterval(this._camDetectTimer);
        this._camDetectTimer = null;
      }
      this._camDetectBusy = false;
      if (this._activeStream) {
        this._activeStream.getTracks().forEach(track => track.stop());
        this._activeStream = null;
      }
      const modal = document.getElementById('aiCameraModalBackdrop');
      if (modal) modal.remove();
    },

    // TẢI ẢNH KẾT QUẢ VỀ MÁY
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

    // ĐẶT LỊCH HẸN VỚI KIỂU TÓC ĐÃ CHỌN
    bookThisHairstyle() {
      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle) || this.hairstyles[0];
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor) || this.hairColors[0];
      const customPromptInput = document.getElementById('aiCustomPromptInput');
      const userNote = customPromptInput ? customPromptInput.value.trim() : '';

      const styleName = currentStyle.name;
      const colorName = currentColor.name;
      const volLabel = this.state.selectedVolume === 'high' ? 'Bồng bềnh' : (this.state.selectedVolume === 'natural' ? 'Tự nhiên' : 'Tiêu chuẩn');
      const finLabel = this.state.selectedFinish === 'gloss' ? 'Bóng Pomade' : 'Mờ tự nhiên';

      let noteText = `[KIỂU TÓC CHỌN TRƯỚC]: ${styleName} (Màu: ${colorName}, Độ phồng: ${volLabel}, Nếp sáp: ${finLabel})`;
      if (userNote) {
        noteText += ` | Yêu cầu riêng: ${userNote}`;
      }

      const targetServiceId = this.state.lastRestyleMeta?.suggestedService?.id || currentStyle.serviceId || 'DV01';

      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate(`/booking?service=${encodeURIComponent(targetServiceId)}&notes=${encodeURIComponent(noteText)}`);
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
      if (window.UICommon) window.UICommon.showToast('Mời bạn chọn kiểu tóc khác trong bộ sưu tập!', 'info');
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

    filterCategory(cat) {
      this.state.activeCategory = cat;
      const tabs = document.querySelectorAll('.ai-category-tab-btn');
      tabs.forEach(t => {
        const isAct = t.getAttribute('data-cat') === cat;
        t.style.background = isAct ? '#C59B27' : 'var(--surface-elevated)';
        t.style.color = isAct ? '#141413' : 'var(--text-secondary)';
        t.style.borderColor = isAct ? '#C59B27' : 'var(--border-color)';
        t.style.fontWeight = isAct ? '800' : '600';
      });

      let visibleCount = 0;
      this.hairstyles.forEach(h => {
        const card = document.getElementById(`pillStyle_${h.id}`);
        if (!card) return;
        const matchCat = (cat === 'all') || (h.category === cat);
        card.style.display = matchCat ? 'flex' : 'none';
        if (matchCat) visibleCount++;
      });

      const countLabel = document.getElementById('aiStyleCountLabel');
      if (countLabel) {
        countLabel.textContent = `${visibleCount} kiểu tóc hiển thị`;
      }
    },

    _updateHairstyleUI() {
      this.hairstyles.forEach(h => {
        const card = document.getElementById(`pillStyle_${h.id}`);
        if (!card) return;
        const isSelected = this.state.selectedHairstyle === h.id;
        card.classList.toggle('selected', isSelected);
        card.style.borderColor = isSelected ? '#C59B27' : 'var(--border-color)';
        card.style.background = isSelected ? 'rgba(197, 155, 39, 0.12)' : 'var(--surface-elevated)';

        let check = card.querySelector('.ai-check-badge');
        if (isSelected && !check) {
          const badge = document.createElement('span');
          badge.className = 'ai-check-badge';
          badge.innerHTML = '✓';
          badge.style.cssText = 'position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; border-radius: 50%; background: #C59B27; color: #141413; font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.4);';
          card.appendChild(badge);
        } else if (!isSelected && check) {
          check.remove();
        }

        const title = card.querySelector('strong');
        if (title) title.style.color = isSelected ? '#C59B27' : 'var(--text-primary)';
      });
    },

    _updateColorUI() {
      const colorLabel = document.getElementById('aiSelectedColorLabel');
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor);
      if (colorLabel && currentColor) {
        colorLabel.textContent = `${currentColor.name} (${currentColor.desc || ''})`;
      }

      this.hairColors.forEach(c => {
        const btn = document.getElementById(`pillColor_${c.id}`);
        if (!btn) return;
        const isSelected = this.state.selectedColor === c.id;
        btn.classList.toggle('selected', isSelected);
        btn.style.borderColor = isSelected ? '#C59B27' : 'var(--border-color)';
        btn.style.background = isSelected ? 'rgba(197, 155, 39, 0.15)' : 'var(--surface-elevated)';
        const nameSpan = btn.querySelector('span:last-child');
        if (nameSpan) nameSpan.style.color = isSelected ? '#C59B27' : 'var(--text-primary)';
      });
    }
  };

  // Gắn vào window toàn cục
  window.AiStudioPage = AiStudioPage;

})(window);
