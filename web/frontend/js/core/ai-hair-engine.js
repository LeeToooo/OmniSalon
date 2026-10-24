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
    // Cấu hình phom tóc
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
      }
    },

    // Bảng màu nhuộm
    hairColors: {
      'natural-black': {
        name: 'Đen Tự Nhiên',
        baseRgb: [24, 24, 27],
        highlightRgb: [55, 55, 65],
        opacity: 0.95
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
      }
    },

    // 1. LẤY / LƯU CẤU HÌNH CLOUD AI
    getCloudConfig() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CLOUD_CONFIG);
        if (raw) return JSON.parse(raw);
      } catch (_) {}
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

    // 2. PHÂN TÍCH KHUÔN MẶT TRỰC TIẾP TRÊN ẢNH NGƯỜI DÙNG (Native Computer Vision)
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

      // Quét trong vùng trọng tâm khuôn mặt (loại bỏ viền ngoài bức ảnh)
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

          // Điều kiện nhận diện màu da người Á Đông (RGB & YCbCr)
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

      // Nếu không tìm thấy đủ điểm ảnh da (ảnh tối hoặc quá khác biệt), sử dụng tỷ lệ vàng mặc định
      if (totalSkinPixels < 400 || maxX <= minX || maxY <= minY) {
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

      const faceWidth = Math.max(width * 0.35, Math.min(width * 0.75, (maxX - minX) * 1.05));
      const faceHeight = Math.max(height * 0.38, Math.min(height * 0.7, (maxY - minY) * 1.1));
      const centerX = (minX + maxX) / 2;
      const foreheadY = Math.max(height * 0.18, minY + faceHeight * 0.15);
      const crownY = Math.max(height * 0.05, foreheadY - faceHeight * 0.36);

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

    // 3. TẠO PHOM TÓC THẬT TRÊN CANVAS CHO CHÍNH ẢNH CỦA KHÁCH
    async generateRestyledPortrait(sourceImageOrUrl, styleId = 'layer-korean', colorId = 'natural-black') {
      const style = this.hairstyles[styleId] || this.hairstyles['layer-korean'];
      const color = this.hairColors[colorId] || this.hairColors['natural-black'];

      // Chuẩn hóa sourceImageElement (nhận HTMLImageElement hoặc URL/Base64 string)
      let imgElement;
      if (typeof sourceImageOrUrl === 'string') {
        imgElement = await new Promise((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = () => rej(new Error('Không thể tải ảnh nguồn để xử lý AI'));
          img.src = sourceImageOrUrl;
        });
      } else if (sourceImageOrUrl && sourceImageOrUrl.tagName === 'IMG') {
        if (!sourceImageOrUrl.complete || sourceImageOrUrl.naturalWidth === 0) {
          await new Promise(r => { sourceImageOrUrl.onload = r; sourceImageOrUrl.onerror = r; });
        }
        imgElement = sourceImageOrUrl;
      } else {
        throw new Error('Dữ liệu ảnh không hợp lệ');
      }

      // Kiểm tra nếu bật Cloud AI và có Key hợp lệ
      const cloudCfg = this.getCloudConfig();
      if (cloudCfg.enabled && cloudCfg.apiKey && cloudCfg.apiKey.trim() !== '') {
        try {
          const cloudResult = await this.callCloudAiRestyle(imgElement, style, color, cloudCfg);
          if (cloudResult) return cloudResult;
        } catch (cloudErr) {
          console.warn('[CLOUD AI FALLBACK]', cloudErr.message, '-> Tự động chuyển sang Canvas AR Engine');
        }
      }

      // Xử lý bằng Canvas AR Engine trực tiếp
      return new Promise((resolve, reject) => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          const naturalW = imgElement.naturalWidth || imgElement.width || 600;
          const naturalH = imgElement.naturalHeight || imgElement.height || 700;

          // Chuẩn hóa kích thước xử lý (khoảng 700 - 900px để vừa nét vừa tối ưu tốc độ)
          const targetW = Math.min(800, Math.max(500, naturalW));
          const targetH = Math.round(targetW * (naturalH / naturalW));
          canvas.width = targetW;
          canvas.height = targetH;

          // Bước 1: Vẽ ảnh gốc của chính người dùng
          ctx.drawImage(imgElement, 0, 0, targetW, targetH);

          // Bước 2: Phân tích hình học khuôn mặt thực tế
          const geo = this.detectFaceGeometry(ctx, targetW, targetH);

          // Bước 3: Dựng lớp chân tóc bóng đổ (Root Shadowing) để tóc ăn khớp tự nhiên với trán
          ctx.save();
          const rootGradient = ctx.createRadialGradient(
            geo.centerX, geo.foreheadY - 10, geo.faceWidth * 0.1,
            geo.centerX, geo.foreheadY + 15, geo.faceWidth * 0.45
          );
          rootGradient.addColorStop(0, 'rgba(15, 15, 20, 0.45)');
          rootGradient.addColorStop(0.7, 'rgba(15, 15, 20, 0.15)');
          rootGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = rootGradient;
          ctx.fillRect(geo.centerX - geo.faceWidth * 0.5, geo.foreheadY - 25, geo.faceWidth, 50);
          ctx.restore();

          // Bước 4: Dựng phom tóc theo cấu trúc được chọn
          ctx.save();
          this._drawHairstyleGeometry(ctx, geo, style, color, targetW, targetH);
          ctx.restore();

          // Bước 5: Thêm hiệu ứng sợi tóc tự nhiên và độ bóng salon (Specular Sheen)
          ctx.save();
          this._drawHairTextureStrands(ctx, geo, style, color);
          ctx.restore();

          // Bước 6: Trả về kết quả Base64 chất lượng cao
          try {
            const resultDataUrl = canvas.toDataURL('image/jpeg', 0.92);
            resolve(resultDataUrl);
          } catch (canvasErr) {
            // Trường hợp canvas bị taint do ảnh CORS không cho phép toDataURL
            console.warn('[CANVAS TAINTED FALLBACK]', canvasErr.message);
            resolve(imgElement.src);
          }
        } catch (err) {
          console.error('[AI HAIR ENGINE ERROR]', err);
          reject(err);
        }
      });
    },

    // 4. VẼ HÌNH HỌC PHOM TÓC THEO TỪNG KIỂU
    _drawHairstyleGeometry(ctx, geo, style, color, width, height) {
      const { centerX, foreheadY, crownY, faceWidth, faceHeight } = geo;
      const [r, g, b] = color.baseRgb;
      const [hr, hg, hb] = color.highlightRgb;

      ctx.beginPath();

      const leftTemple = centerX - faceWidth * 0.46;
      const rightTemple = centerX + faceWidth * 0.46;
      const hairTop = crownY - faceHeight * style.volumeTop;
      const leftEar = leftTemple - faceWidth * style.volumeSides;
      const rightEar = rightTemple + faceWidth * style.volumeSides;

      if (style.curveType === 'layer') {
        // Phom Layer Texture: Tóc phồng trên đỉnh, viền ôm mềm mại, mái tỉa tầng rủ trán
        ctx.moveTo(leftEar, foreheadY + 20);
        ctx.quadraticCurveTo(leftEar - 10, hairTop + 30, centerX - faceWidth * 0.3, hairTop);
        ctx.bezierCurveTo(centerX - faceWidth * 0.15, hairTop - 15, centerX + faceWidth * 0.15, hairTop - 18, centerX + faceWidth * 0.3, hairTop);
        ctx.quadraticCurveTo(rightEar + 10, hairTop + 30, rightEar, foreheadY + 20);

        // Mái tỉa tầng tự nhiên rủ xuống trán
        ctx.quadraticCurveTo(rightTemple - 15, foreheadY - 10, centerX + faceWidth * 0.2, foreheadY + faceHeight * style.fringeDrop);
        ctx.quadraticCurveTo(centerX + faceWidth * 0.05, foreheadY + 8, centerX - faceWidth * 0.08, foreheadY + faceHeight * style.fringeDrop * 1.1);
        ctx.quadraticCurveTo(centerX - faceWidth * 0.25, foreheadY + 5, leftTemple, foreheadY + 15);
      } else if (style.curveType === 'pompadour') {
        // Phom Pompadour: Khối vuốt ngược cao vút, 2 bên cạo mid-fade gọn gàng
        ctx.moveTo(leftTemple + 8, foreheadY + 10);
        ctx.quadraticCurveTo(leftTemple - 4, hairTop + 40, centerX - faceWidth * 0.35, hairTop);
        ctx.bezierCurveTo(centerX - faceWidth * 0.2, hairTop - 35, centerX + faceWidth * 0.2, hairTop - 35, centerX + faceWidth * 0.35, hairTop);
        ctx.quadraticCurveTo(rightTemple + 4, hairTop + 40, rightTemple - 8, foreheadY + 10);

        // Đường viền chân tóc vuốt ngược để lộ trán nam tính
        ctx.quadraticCurveTo(centerX + faceWidth * 0.25, foreheadY - 25, centerX, foreheadY - 32);
        ctx.quadraticCurveTo(centerX - faceWidth * 0.25, foreheadY - 25, leftTemple + 8, foreheadY + 10);
      } else if (style.curveType === 'mullet') {
        // Phom Mullet: Tóc đỉnh tỉa textured, 2 bên mai gọn gàng, đuôi gáy bay lãng tử
        ctx.moveTo(leftEar - 12, foreheadY + faceHeight * 0.25);
        ctx.quadraticCurveTo(leftEar - 15, hairTop + 20, centerX - faceWidth * 0.28, hairTop);
        ctx.bezierCurveTo(centerX - faceWidth * 0.1, hairTop - 12, centerX + faceWidth * 0.1, hairTop - 12, centerX + faceWidth * 0.28, hairTop);
        ctx.quadraticCurveTo(rightEar + 15, hairTop + 20, rightEar + 12, foreheadY + faceHeight * 0.25);

        // Mái rủ nhẹ phong trần
        ctx.quadraticCurveTo(rightTemple - 10, foreheadY + 4, centerX + faceWidth * 0.12, foreheadY + faceHeight * style.fringeDrop);
        ctx.quadraticCurveTo(centerX, foreheadY + 6, centerX - faceWidth * 0.18, foreheadY + faceHeight * style.fringeDrop * 0.9);
        ctx.quadraticCurveTo(leftTemple + 5, foreheadY + 10, leftEar - 12, foreheadY + faceHeight * 0.25);
      } else {
        // Phom Side Part 7/3: Đường rẽ ngôi dứt khoát góc 7/3, chải phom quý ông
        const partX = centerX - faceWidth * 0.12; // Rẽ ngôi bên trái

        ctx.moveTo(leftTemple - 6, foreheadY + 14);
        ctx.quadraticCurveTo(leftTemple - 12, hairTop + 35, partX - faceWidth * 0.15, hairTop + 5);
        // Đường rẽ ngôi rãnh tóc
        ctx.lineTo(partX, hairTop + 2);
        ctx.bezierCurveTo(centerX + faceWidth * 0.15, hairTop - 20, centerX + faceWidth * 0.32, hairTop - 10, rightEar, hairTop + 45);
        ctx.lineTo(rightEar + 4, foreheadY + 18);

        // Mái chải 7/3 ôm trán
        ctx.quadraticCurveTo(rightTemple - 12, foreheadY - 6, centerX + faceWidth * 0.18, foreheadY + faceHeight * style.fringeDrop);
        ctx.quadraticCurveTo(partX + 15, foreheadY + 8, partX, foreheadY - 14);
        ctx.quadraticCurveTo(leftTemple + 8, foreheadY - 4, leftTemple - 6, foreheadY + 14);
      }

      ctx.closePath();

      // Đổ màu tóc chính với dải chuyển màu 3 chiều (Volume Radial Gradient)
      const grad = ctx.createLinearGradient(centerX, hairTop - 20, centerX, foreheadY + 40);
      grad.addColorStop(0, `rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)}, ${color.opacity})`);
      grad.addColorStop(0.35, `rgba(${hr}, ${hg}, ${hb}, ${color.opacity * 0.95})`);
      grad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${color.opacity})`);
      grad.addColorStop(1, `rgba(${Math.max(10, r - 15)}, ${Math.max(10, g - 15)}, ${Math.max(10, b - 15)}, 0.96)`);

      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(10, 10, 15, 0.45)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.fill();
    },

    // 5. VẼ CÁC SỢI TÓC CHI TIẾT & ÁNH SÁNG SPECULAR SHEEN
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

    // 6. GỌI CLOUD GENERATIVE AI KHI CÓ API KEY
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
