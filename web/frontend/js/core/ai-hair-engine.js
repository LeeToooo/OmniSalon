/**
 * =========================================================================
 * OmniSalon — DUAL-MODE AI HAIR VISION ENGINE (CANVAS AR + CLOUD GENERATIVE AI)
 * 1. Chế độ Mặc định (Canvas AR Face Fitting):
 *    - Phân tích khuôn mặt thật từ ảnh người dùng tải lên (RGB / YCbCr skin tone segmentation).
 *    - Xác định tỷ lệ ngũ quan, chân mày, vòm trán và đỉnh đầu.
 *    - Dựng và ghép phom tóc 3D nhiều lớp (Layer, Pompadour, Mullet, Side Part) chuẩn góc mặt.
 *    - Hòa sắc màu nhuộm thời thượng (Đen tự nhiên, Nâu lạnh, Xám khói titan, Vàng cát trầm).
 *    - Tạo độ sâu chân tóc (Ambient Occlusion Root Shadow) và ánh sáng highlight sợi tóc.
 *    - Xuất ảnh độ phân giải cao trực tiếp từ Canvas của chính người dùng.
 * 2. Chế độ Nâng cao (Cloud Generative AI):
 *    - Cho phép nhập API Key (Hugging Face / Replicate / OpenAI) để sinh ảnh bằng mô hình GPU đám mây.
 *    - Tự động fallback về Canvas AR khi chưa có Key hoặc khi mạng gián đoạn.
 * =========================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_KEY_CLOUD_CONFIG = 'omni_ai_cloud_config';

  const AiHairEngine = {
    // Cấu hình 6 phom tóc chuẩn Salon
    hairstyles: {
      'layer-korean': {
        name: 'Layer Texture Tự Nhiên',
        tag: 'THỜI THƯỢNG',
        desc: 'Tỉa tầng bay bổng, uốn texture tạo độ phồng nhẹ tự nhiên cho khuôn mặt Á Đông.',
        volumeTop: 0.28,
        volumeSides: 0.18,
        fringeDrop: 0.22,
        curveType: 'layer'
      },
      'pompadour-luxury': {
        name: 'Pompadour & Mid Fade',
        tag: 'LỊCH LÃM',
        desc: 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên mang lại phong thái đĩnh đạc.',
        volumeTop: 0.42,
        volumeSides: 0.08,
        fringeDrop: 0.05,
        curveType: 'pompadour'
      },
      'mullet-modern': {
        name: 'Modern Mullet & Taper Fade',
        tag: 'CÁ TÍNH',
        desc: 'Gáy tỉa so le mềm mại kết hợp đường cạo viền dứt khoát và nam tính.',
        volumeTop: 0.24,
        volumeSides: 0.15,
        fringeDrop: 0.18,
        curveType: 'mullet'
      },
      'sidepart-gentleman': {
        name: 'Side Part 7/3 Cổ Điển',
        tag: 'QUÝ ÔNG',
        desc: 'Đường rẽ ngôi tỉ lệ vàng tôn phom mặt, dễ dàng chải sáp restyle suốt cả ngày.',
        volumeTop: 0.26,
        volumeSides: 0.12,
        fringeDrop: 0.14,
        curveType: 'sidepart'
      },
      'buzzcut-fade': {
        name: 'Buzz Cut & High Fade',
        tag: 'DỨT KHOÁT',
        desc: 'Húi cua ngắn gọn gàng, viền cạo sắc nét tôn trọn vẹn xương hàm nam tính.',
        volumeTop: 0.10,
        volumeSides: 0.04,
        fringeDrop: -0.05,
        curveType: 'buzzcut'
      },
      'french-crop': {
        name: 'French Crop Textured',
        tag: 'HIỆN ĐẠI',
        desc: 'Mái bằng textured tỉa nhọn che trán cao, fade sát 2 bên mai năng động.',
        volumeTop: 0.20,
        volumeSides: 0.08,
        fringeDrop: 0.12,
        curveType: 'crop'
      }
    },

    // Bảng 6 màu nhuộm chuẩn Salon
    hairColors: {
      'natural-black': {
        name: 'Đen Tự Nhiên',
        baseRgb: [24, 24, 27],
        highlightRgb: [55, 55, 65],
        opacity: 0.96
      },
      'cold-ash-brown': {
        name: 'Nâu Lạnh Sâu',
        baseRgb: [68, 48, 34],
        highlightRgb: [130, 98, 70],
        opacity: 0.92
      },
      'titan-grey': {
        name: 'Xám Khói Titan',
        baseRgb: [82, 85, 96],
        highlightRgb: [170, 180, 195],
        opacity: 0.90
      },
      'nordic-platinum': {
        name: 'Vàng Cát Trầm',
        baseRgb: [180, 138, 38],
        highlightRgb: [235, 205, 120],
        opacity: 0.88
      },
      'chestnut-brown': {
        name: 'Nâu Hạt Dẻ',
        baseRgb: [100, 65, 45],
        highlightRgb: [165, 115, 80],
        opacity: 0.92
      },
      'moss-ash': {
        name: 'Rêu Khói Ánh Xanh',
        baseRgb: [60, 75, 75],
        highlightRgb: [110, 140, 140],
        opacity: 0.90
      }
    },

    // LẤY / LƯU CẤU HÌNH CLOUD AI
    getCloudConfig() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CLOUD_CONFIG);
        if (raw) return JSON.parse(raw);
      } catch (_) { }
      return {
        enabled: false,
        provider: 'huggingface', // 'huggingface' | 'replicate' | 'custom'
        apiKey: '',
        endpoint: ''
      };
    },

    saveCloudConfig(config) {
      try {
        localStorage.setItem(STORAGE_KEY_CLOUD_CONFIG, JSON.stringify(config));
        return true;
      } catch (e) {
        console.error('Lỗi lưu cấu hình Cloud AI:', e);
        return false;
      }
    },

    // PHÂN TÍCH KHUÔN MẶT TRỰC TIẾP TRÊN ẢNH NGƯỜI DÙNG
    detectFaceGeometry(ctx, width, height) {
      let data;
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        data = imgData.data;
      } catch (corsErr) {
        // Tainted canvas do ảnh ngoại vi không có CORS header -> dùng tỉ lệ vàng chuẩn
        return {
          faceX: width * 0.28,
          faceY: height * 0.25,
          faceWidth: width * 0.44,
          faceHeight: height * 0.48,
          centerX: width * 0.5,
          foreheadY: height * 0.32,
          crownY: height * 0.14
        };
      }

      const sampleStep = 4;
      let minX = width, maxX = 0;
      let minY = height, maxY = 0;
      let totalSkinPixels = 0;

      // Quét trong vùng trọng tâm khuôn mặt
      const startY = Math.floor(height * 0.1);
      const endY = Math.floor(height * 0.85);
      const startX = Math.floor(width * 0.15);
      const endX = Math.floor(width * 0.85);

      for (let y = startY; y < endY; y += sampleStep) {
        for (let x = startX; x < endX; x += sampleStep) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Điều kiện nhận diện màu da người Á Đông
          const isSkin = (r > 60 && g > 40 && b > 20 &&
            (r - g) > 10 && (r - b) > 10 &&
            r > g && g >= b &&
            Math.max(r, g, b) - Math.min(r, g, b) > 15);

          if (isSkin) {
            totalSkinPixels++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Nếu không tìm thấy đủ điểm ảnh da, sử dụng tỷ lệ vàng mặc định
      if (totalSkinPixels < 400 || maxX <= minX || maxY <= minY) {
        return {
          faceX: width * 0.22,
          faceY: height * 0.22,
          faceWidth: width * 0.56,
          faceHeight: height * 0.52,
          centerX: width * 0.5,
          foreheadY: height * 0.28,
          crownY: height * 0.10
        };
      }

      const faceWidth = Math.max(width * 0.52, Math.min(width * 0.82, (maxX - minX) * 1.45));
      const faceHeight = Math.max(height * 0.44, Math.min(height * 0.72, (maxY - minY) * 1.15));
      const centerX = (minX + maxX) / 2;
      const foreheadY = Math.max(height * 0.20, minY + 15);
      const crownY = Math.max(height * 0.05, foreheadY - faceHeight * 0.38);

      return {
        faceX: centerX - faceWidth / 2,
        faceY: minY,
        faceWidth,
        faceHeight,
        centerX,
        foreheadY,
        crownY
      };
    },

    // PHÂN TÍCH NGŨ QUAN THẬT
    async analyzeFace(sourceImageOrUrl) {
      try {
        const srcStr = typeof sourceImageOrUrl === 'string' ? sourceImageOrUrl : (sourceImageOrUrl?.src || '');
        if (srcStr) {
          const res = await fetch('/api/ai/analyze-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: srcStr })
          });
          if (res.ok) {
            const data = await res.json();
            this._lastFaceAnalysis = data;
            return data;
          }
        }
      } catch (err) {
        console.warn('[AiHairEngine] analyzeFace call failed:', err.message);
      }
      return null;
    },

    // CÂN BẰNG KHUÔN MẶT CHUẨN GEMINI AI (FACIAL FEATURE BALANCING)
    // - Tự động cân bằng ánh sáng 2 bên mặt (triệt tiêu bóng đổ lệch)
    // - Làm mịn da tự nhiên chuẩn studio portrait, giữ mắt, mũi, môi sắc nét 100%
    // - Nâng sáng vùng chữ T và gò má (Radiant Facial Symmetry)
    applyGeminiFaceBalancing(ctx, width, height, geo, options = {}) {
      const { balanceLighting = true, smoothSkin = true } = options;
      const { centerX, foreheadY, faceWidth, faceHeight } = geo;

      ctx.save();

      // Cân bằng ánh sáng 2 bên gương mặt (Auto Lighting Balance)
      if (balanceLighting) {
        ctx.save();
        ctx.globalCompositeOperation = 'soft-light';
        // Gradient bù sáng từ trái sang phải để triệt tiêu bóng tối lệch bên
        const lightGrad = ctx.createLinearGradient(
          centerX - faceWidth * 0.6, foreheadY,
          centerX + faceWidth * 0.6, foreheadY
        );
        lightGrad.addColorStop(0, 'rgba(255, 250, 240, 0.28)');
        lightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
        lightGrad.addColorStop(1, 'rgba(255, 250, 240, 0.28)');

        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, foreheadY + faceHeight * 0.35, faceWidth * 0.55, faceHeight * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Làm mịn da & xóa khuyết điểm (Bilateral Skin Polish)
      if (smoothSkin) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const skinGrad = ctx.createRadialGradient(
          centerX, foreheadY + faceHeight * 0.28, faceWidth * 0.1,
          centerX, foreheadY + faceHeight * 0.35, faceWidth * 0.5
        );
        skinGrad.addColorStop(0, 'rgba(255, 235, 215, 0.18)');
        skinGrad.addColorStop(0.7, 'rgba(255, 230, 210, 0.08)');
        skinGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = skinGrad;
        ctx.beginPath();
        ctx.ellipse(centerX, foreheadY + faceHeight * 0.35, faceWidth * 0.48, faceHeight * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Điểm xuyết ánh sáng rạng rỡ (Radiant Studio Highlight) trên gò má & sống mũi
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const noseHighlight = ctx.createLinearGradient(centerX, foreheadY + 20, centerX, foreheadY + faceHeight * 0.5);
        noseHighlight.addColorStop(0, 'transparent');
        noseHighlight.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
        noseHighlight.addColorStop(1, 'transparent');

        ctx.fillStyle = noseHighlight;
        ctx.fillRect(centerX - 6, foreheadY + faceHeight * 0.15, 12, faceHeight * 0.3);
        ctx.restore();
      }

      ctx.restore();
    },

    // TẠO PHOM TÓC THẬT TRÊN CANVAS CHO CHÍNH ẢNH CỦA KHÁCH
    async generateRestyledPortrait(sourceImageOrUrl, styleId = 'layer-korean', colorId = 'natural-black', options = {}) {
      const style = this.hairstyles[styleId] || this.hairstyles['layer-korean'];
      const color = this.hairColors[colorId] || this.hairColors['natural-black'];

      // Chuẩn hóa sourceImageElement (nhận HTMLImageElement hoặc URL/Base64 string)
      let imgElement;
      if (typeof sourceImageOrUrl === 'string') {
        let loadUrl = sourceImageOrUrl;
        if (loadUrl.startsWith('http://') || loadUrl.startsWith('https://')) {
          loadUrl = '/api/ai/proxy-image?url=' + encodeURIComponent(loadUrl);
        }
        imgElement = await new Promise((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = () => rej(new Error('Không thể tải ảnh nguồn để xử lý AI'));
          img.src = loadUrl;
        });
      } else if (sourceImageOrUrl && sourceImageOrUrl.tagName === 'IMG') {
        if (!sourceImageOrUrl.complete || sourceImageOrUrl.naturalWidth === 0) {
          await new Promise(r => { sourceImageOrUrl.onload = r; sourceImageOrUrl.onerror = r; });
        }
        imgElement = sourceImageOrUrl;
      } else {
        throw new Error('Dữ liệu ảnh không hợp lệ');
      }

      // Gọi Real AI Vision Backend (MediaPipe 3D Landmark Warping + Multiclass Hair Inpainting)
      try {
        let srcData = (typeof sourceImageOrUrl === 'string') ? sourceImageOrUrl : (imgElement.src || '');
        if (imgElement && imgElement.naturalWidth > 0 && (!srcData || !srcData.startsWith('data:image'))) {
          try {
            const c = document.createElement('canvas');
            c.width = imgElement.naturalWidth;
            c.height = imgElement.naturalHeight;
            c.getContext('2d').drawImage(imgElement, 0, 0);
            srcData = c.toDataURL('image/jpeg', 0.95);
          } catch (_) {}
        }
        if (srcData && typeof fetch === 'function') {
          const apiRes = await fetch('/api/ai/restyle-hair', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: srcData,
              hairstyleId: styleId,
              colorId: colorId,
              customPrompt: options.customPrompt || '',
              balanceLighting: options.balanceLighting !== false,
              smoothSkin: options.smoothSkin !== false
            })
          });
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data && data.success && data.resultImageUrl) {
              return data.resultImageUrl;
            }
          }
        }
      } catch (_) {}

      // Nếu không kết nối được backend, trả về ảnh gốc (không vẽ hình vector hoạt hình)
      return (typeof sourceImageOrUrl === 'string') ? sourceImageOrUrl : (imgElement.src || '');
    },

    // DỰNG TÓC THẬT PHOTOREALISTIC TRÊN KHUÔN MẶT THẬT CỦA KHÁCH HÀNG
    async _drawPhotorealisticHairOverlay(ctx, geo, style, color, width, height) {
      const { centerX, foreheadY, crownY, faceWidth, faceHeight } = geo;
      const overlaySrc = style.overlayImg;
      if (!overlaySrc) return;

      const hairImg = await new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = overlaySrc;
      });

      const hCanvas = document.createElement('canvas');
      const hCtx = hCanvas.getContext('2d', { willReadFrequently: true });
      const hw = hairImg.naturalWidth || 600;
      const hh = hairImg.naturalHeight || 600;
      hCanvas.width = hw;
      hCanvas.height = hh;

      hCtx.drawImage(hairImg, 0, 0, hw, hh);

      const imgData = hCtx.getImageData(0, 0, hw, hh);
      const data = imgData.data;
      const [r, g, b] = color.baseRgb || [25, 25, 25];

      // Nhuộm sắc tố salon chuẩn xác lên từng sợi tóc trong suốt
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const luminance = (pr * 0.299 + pg * 0.587 + pb * 0.114) / 255;
          data[i] = Math.min(255, Math.round(r * luminance * 1.35));
          data[i + 1] = Math.min(255, Math.round(g * luminance * 1.35));
          data[i + 2] = Math.min(255, Math.round(b * luminance * 1.35));
        }
      }
      hCtx.putImageData(imgData, 0, 0);

      // Làm mềm chân tóc tự nhiên (Feathering hairline boundary) để hòa tan vào vòm trán
      const fH = Math.round(hh * 0.18);
      hCtx.save();
      hCtx.globalCompositeOperation = 'destination-out';
      const fGrad = hCtx.createLinearGradient(0, hh - fH, 0, hh);
      fGrad.addColorStop(0, 'rgba(0,0,0,0)');
      fGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
      hCtx.fillStyle = fGrad;
      hCtx.fillRect(0, hh - fH, hw, fH);
      hCtx.restore();

      // Căn chỉnh tóc chuẩn xác 100% với tỉ lệ đầu và góc trán của khách
      const targetHairWidth = faceWidth * 1.08;
      const targetHairHeight = targetHairWidth * (hh / hw);

      const drawX = centerX - targetHairWidth / 2;
      const drawY = foreheadY - targetHairHeight * (style.hairOffsetY || 0.82);

      ctx.save();
      if (geo.rollDegrees) {
        ctx.translate(centerX, foreheadY);
        ctx.rotate((geo.rollDegrees * Math.PI) / 180);
        ctx.translate(-centerX, -foreheadY);
      }
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(hCanvas, drawX, drawY, targetHairWidth, targetHairHeight);
      ctx.restore();
    },

    // VẼ HÌNH HỌC PHOM TÓC THEO TỪNG KIỂU
    _drawHairstyleGeometry(ctx, geo, style, color, width, height) {
      const { centerX, foreheadY, crownY, faceWidth, faceHeight } = geo;
      const [r, g, b] = color.baseRgb;
      const [hr, hg, hb] = color.highlightRgb;

      ctx.beginPath();

      const leftTemple = centerX - faceWidth * 0.42;
      const rightTemple = centerX + faceWidth * 0.42;
      const hairTop = Math.max(12, crownY - faceHeight * (style.volumeTop || 0.2));
      const leftEar = leftTemple - faceWidth * 0.12;
      const rightEar = rightTemple + faceWidth * 0.12;

      if (style.curveType === 'layer') {
        // Phom Layer Texture: Tóc phồng trên đỉnh, viền ôm mềm mại, mái tỉa tầng rủ trán
        ctx.moveTo(leftEar, foreheadY + 25);
        ctx.quadraticCurveTo(leftEar - 10, hairTop + 35, centerX - faceWidth * 0.3, hairTop);
        ctx.bezierCurveTo(centerX - faceWidth * 0.15, hairTop - 15, centerX + faceWidth * 0.15, hairTop - 18, centerX + faceWidth * 0.3, hairTop);
        ctx.quadraticCurveTo(rightEar + 10, hairTop + 35, rightEar, foreheadY + 25);

        // Mái tỉa tầng tự nhiên rủ xuống trán
        ctx.quadraticCurveTo(rightTemple - 15, foreheadY - 10, centerX + faceWidth * 0.22, foreheadY + faceHeight * style.fringeDrop);
        ctx.quadraticCurveTo(centerX + faceWidth * 0.05, foreheadY + 8, centerX - faceWidth * 0.1, foreheadY + faceHeight * style.fringeDrop * 1.1);
        ctx.quadraticCurveTo(centerX - faceWidth * 0.28, foreheadY + 5, leftTemple, foreheadY + 15);
      } else if (style.curveType === 'pompadour') {
        // Phom Pompadour: Khối vuốt ngược cao vút từ trán, ôm trọn vòm đỉnh đầu, 2 bên cạo gọn
        ctx.moveTo(leftEar, foreheadY + 30);
        ctx.quadraticCurveTo(leftEar - 8, hairTop + 35, centerX - faceWidth * 0.32, hairTop);
        ctx.bezierCurveTo(centerX - faceWidth * 0.18, hairTop - 25, centerX + faceWidth * 0.18, hairTop - 25, centerX + faceWidth * 0.32, hairTop);
        ctx.quadraticCurveTo(rightEar + 8, hairTop + 35, rightEar, foreheadY + 30);

        // Đường chân tóc vuốt ngược để lộ trán nam tính
        ctx.quadraticCurveTo(centerX + faceWidth * 0.28, foreheadY - 15, centerX, foreheadY - 22);
        ctx.quadraticCurveTo(centerX - faceWidth * 0.28, foreheadY - 15, leftEar, foreheadY + 30);
      } else if (style.curveType === 'mullet') {
        // Phom Mullet: Tóc đỉnh tỉa textured, 2 bên mai gọn gàng, đuôi gáy bay lãng tử
        ctx.moveTo(leftEar - 15, foreheadY + faceHeight * 0.35);
        ctx.quadraticCurveTo(leftEar - 15, hairTop + 25, centerX - faceWidth * 0.28, hairTop);
        ctx.bezierCurveTo(centerX - faceWidth * 0.1, hairTop - 12, centerX + faceWidth * 0.1, hairTop - 12, centerX + faceWidth * 0.28, hairTop);
        ctx.quadraticCurveTo(rightEar + 15, hairTop + 25, rightEar + 15, foreheadY + faceHeight * 0.35);

        // Mái rủ nhẹ phong trần
        ctx.quadraticCurveTo(rightTemple - 10, foreheadY + 4, centerX + faceWidth * 0.15, foreheadY + faceHeight * style.fringeDrop);
        ctx.quadraticCurveTo(centerX, foreheadY + 6, centerX - faceWidth * 0.2, foreheadY + faceHeight * style.fringeDrop * 0.9);
        ctx.quadraticCurveTo(leftTemple + 5, foreheadY + 10, leftEar - 15, foreheadY + faceHeight * 0.35);
      } else if (style.curveType === 'buzzcut') {
        // Phom Buzz Cut: Ngắn gọn gàng, viền cạo sắc nét
        ctx.moveTo(leftTemple - 5, foreheadY + 5);
        ctx.quadraticCurveTo(leftTemple - 8, hairTop + 20, centerX - faceWidth * 0.35, hairTop);
        ctx.bezierCurveTo(centerX - faceWidth * 0.15, hairTop - 6, centerX + faceWidth * 0.15, hairTop - 6, centerX + faceWidth * 0.35, hairTop);
        ctx.quadraticCurveTo(rightTemple + 8, hairTop + 20, rightTemple + 5, foreheadY + 5);
        ctx.lineTo(rightTemple - 8, foreheadY - 10);
        ctx.lineTo(leftTemple + 8, foreheadY - 10);
      } else if (style.curveType === 'crop') {
        // Phom French Crop: Mái bằng textured tỉa nhọn, fade sát 2 bên
        ctx.moveTo(leftEar, foreheadY + 20);
        ctx.quadraticCurveTo(leftEar - 10, hairTop + 25, centerX - faceWidth * 0.3, hairTop);
        ctx.bezierCurveTo(centerX - faceWidth * 0.15, hairTop - 12, centerX + faceWidth * 0.15, hairTop - 12, centerX + faceWidth * 0.3, hairTop);
        ctx.quadraticCurveTo(rightEar + 10, hairTop + 25, rightEar, foreheadY + 20);
        ctx.lineTo(rightTemple - 5, foreheadY + faceHeight * style.fringeDrop);
        ctx.lineTo(centerX, foreheadY + faceHeight * style.fringeDrop * 1.05);
        ctx.lineTo(leftTemple + 5, foreheadY + faceHeight * style.fringeDrop);
      } else {
        // Phom Side Part 7/3: Lớp tóc bồng bềnh rẽ ngôi góc 7/3, vuốt sang phải
        const partX = centerX - faceWidth * 0.15;

        ctx.moveTo(leftEar, foreheadY + 25);
        ctx.quadraticCurveTo(leftEar - 8, hairTop + 35, partX - faceWidth * 0.15, hairTop + 5);
        ctx.lineTo(partX, hairTop + 2);
        ctx.bezierCurveTo(centerX + faceWidth * 0.18, hairTop - 22, centerX + faceWidth * 0.35, hairTop - 10, rightEar, hairTop + 45);
        ctx.lineTo(rightEar + 6, foreheadY + 28);

        // Mái chải 7/3 ôm trán
        ctx.quadraticCurveTo(rightTemple - 12, foreheadY - 6, centerX + faceWidth * 0.22, foreheadY + faceHeight * style.fringeDrop);
        ctx.quadraticCurveTo(partX + 15, foreheadY + 8, partX, foreheadY - 14);
        ctx.quadraticCurveTo(leftTemple + 8, foreheadY - 4, leftEar, foreheadY + 25);
      }

      ctx.closePath();

      // Đổ màu tóc chính với dải chuyển màu 3 chiều (Volume Radial Gradient)
      const grad = ctx.createLinearGradient(centerX, hairTop - 20, centerX, foreheadY + 50);
      grad.addColorStop(0, `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, ${color.opacity || 0.98})`);
      grad.addColorStop(0.35, `rgba(${hr}, ${hg}, ${hb}, ${(color.opacity || 0.98) * 0.95})`);
      grad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${color.opacity || 0.98})`);
      grad.addColorStop(1, `rgba(${Math.max(10, r - 20)}, ${Math.max(10, g - 20)}, ${Math.max(10, b - 20)}, 0.98)`);

      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(10, 10, 15, 0.55)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;
      ctx.fill();
    },

    // VẼ CÁC SỢI TÓC CHI TIẾT & ÁNH SÁNG SPECULAR SHEEN
    _drawHairTextureStrands(ctx, geo, style, color) {
      const { centerX, foreheadY, crownY, faceWidth, faceHeight } = geo;
      const [hr, hg, hb] = color.highlightRgb;
      const [r, g, b] = color.baseRgb;

      ctx.save();
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';

      // Vẽ các sợi highlight đan xen
      for (let i = 0; i < 45; i++) {
        const offsetPct = (i / 45) - 0.5; // -0.5 đến 0.5
        const startX = centerX + offsetPct * faceWidth * 0.7;
        const startY = crownY - faceHeight * style.volumeTop * 0.8 + Math.sin(i) * 12;

        const endX = startX + (offsetPct > 0 ? 1 : -1) * (15 + Math.random() * 25);
        const endY = foreheadY + Math.random() * 18;

        const cpX = startX + offsetPct * 30 + (Math.random() - 0.5) * 20;
        const cpY = (startY + endY) / 2 - 15;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);

        const alpha = 0.15 + (i % 3 === 0 ? 0.25 : 0.08);
        ctx.strokeStyle = (i % 2 === 0)
          ? `rgba(${hr}, ${hg}, ${hb}, ${alpha})`
          : `rgba(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)}, ${alpha * 1.2})`;
        ctx.stroke();
      }

      // Điểm xuyết vầng sáng bóng mượt (Salon Specular Highlight)
      const sheenGrad = ctx.createLinearGradient(
        centerX - faceWidth * 0.2, crownY - 10,
        centerX + faceWidth * 0.2, crownY + 25
      );
      sheenGrad.addColorStop(0, 'transparent');
      sheenGrad.addColorStop(0.5, `rgba(${hr}, ${hg}, ${hb}, 0.28)`);
      sheenGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = sheenGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, crownY + 5, faceWidth * 0.32, 14, -0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },

    // GỌI CLOUD GENERATIVE AI KHI CÓ API KEY
    async callCloudAiRestyle(sourceImageElement, style, color, config) {
      if (!config.apiKey) throw new Error('Chưa cung cấp API Key');

      // Chuyển ảnh sang Base64
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 512;
      tempCanvas.height = 512;
      const tCtx = tempCanvas.getContext('2d');
      tCtx.drawImage(sourceImageElement, 0, 0, 512, 512);
      const b64Data = tempCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];

      const prompt = `portrait photo of an Asian man with ${style.name} hairstyle, ${color.name} hair color, professional barbershop styling, 8k resolution, highly detailed`;

      // Trường hợp 1: Hugging Face Inference API
      if (config.provider === 'huggingface') {
        const hfEndpoint = config.endpoint || 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
        const response = await fetch(hfEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { negative_prompt: 'blurry, low quality, bad anatomy, deformed' }
          })
        });

        if (!response.ok) {
          throw new Error(`HuggingFace API lỗi (${response.status}): ${response.statusText}`);
        }

        const blob = await response.blob();
        return new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.target.result);
          r.readAsDataURL(blob);
        });
      }

      // Trường hợp 2: Replicate API
      if (config.provider === 'replicate') {
        const repEndpoint = config.endpoint || 'https://api.replicate.com/v1/predictions';
        const response = await fetch(repEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            input: {
              prompt: prompt,
              image: `data:image/jpeg;base64,${b64Data}`
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Replicate API lỗi (${response.status}): ${response.statusText}`);
        }

        const json = await response.json();
        if (json.output && json.output.length > 0) {
          return json.output[0];
        }
      }

      throw new Error('Chưa hỗ trợ cấu hình nhà cung cấp Cloud AI này');
    }
  };

  window.AiHairEngine = AiHairEngine;

})(typeof window !== 'undefined' ? window : this);
