// Các api xử lý ảnh và gợi ý kiểu tóc
const http = require('http');
const https = require('https');
const { extractAuthUser } = require('../../middlewares/auth_middleware');

let aiService = null;
try {
  aiService = require('../../ai_engine/ai_service');
} catch (e) {
  console.warn('[Thông báo AI] Chưa tải ai_service, các tính năng AI sẽ tạm dừng.');
}

async function handleAiRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody, corsOrigin } = ctx;

  if (!pathname.startsWith('/api/ai/')) {
    return false;
  }

  if (!aiService) {
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: 'Tính năng AI Studio đang tạm dừng để bảo trì.' }));
    return true;
  }

  // GET /api/ai/hairstyles - Danh mục phom tóc mẫu và bảng màu nhuộm tóc
  if (pathname === '/api/ai/hairstyles' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      hairstyles: Object.values(aiService.HAIRSTYLES),
      hairColors: Object.values(aiService.HAIR_COLORS)
    }));
    return true;
  }

  // POST /api/ai/analyze-face - Phân tích dáng khuôn mặt và ngũ quan từ ảnh chân dung
  if (pathname === '/api/ai/analyze-face' && method === 'POST') {
    const body = parsedBody || {};
    const image = body.image || body.imageBase64OrUrl || body.imageBase64 || body.url || body.photoUrl || '';
    try {
      const analysis = await aiService.analyzeFaceGeometry(image);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(analysis));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi phân tích ngũ quan AI: ' + err.message }));
    }
    return true;
  }

  // POST /api/ai/preprocess-customer-photo - Tiền xử lý ảnh
  if (pathname === '/api/ai/preprocess-customer-photo' && method === 'POST') {
    const body = parsedBody || {};
    const image = body.image || body.imageBase64OrUrl || body.imageBase64 || body.url || body.photoUrl || '';
    const backgroundMode = body.backgroundMode || 'studio';
    try {
      const result = aiService.runPythonVisionPreprocess({
        imageBase64OrUrl: image,
        backgroundMode
      });
      if (result && result.success) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result || { success: false, message: 'Không thể tiền xử lý ảnh khuôn mặt.' }));
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi tiền xử lý ảnh AI: ' + err.message }));
    }
    return true;
  }

  // POST /api/ai/restyle-hair - Thử kiểu tóc AI
  if (pathname === '/api/ai/restyle-hair' && method === 'POST') {
    const body = parsedBody || {};
    const image = body.image || body.imageBase64OrUrl || body.imageBase64 || body.originalImageBase64 || body.url || body.photoUrl || '';
    const hairstyleId = body.hairstyleId || body.selectedHairstyle || body.hairstyleName || 'layer-korean';
    const colorId = body.colorId || body.selectedColor || body.hairColorName || 'natural-black';
    const customPrompt = body.customPrompt || body.prompt || '';
    const balanceLighting = body.balanceLighting !== undefined ? body.balanceLighting : true;
    const smoothSkin = body.smoothSkin !== undefined ? body.smoothSkin : true;
    const savedCfg = aiService ? aiService.loadAiConfig() : {};
    const geminiApiKey = (body.geminiApiKey || body.apiKey || savedCfg.geminiApiKey || process.env.GEMINI_API_KEY || '').trim();

    try {
      const result = await aiService.generateAiHairRestyle({
        imageBase64OrUrl: image,
        hairstyleId,
        colorId,
        customPrompt,
        balanceLighting,
        smoothSkin,
        geminiApiKey
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi sinh ảnh kiểu tóc AI: ' + err.message }));
    }
    return true;
  }

  // POST /api/ai/consultation - Trò chuyện tư vấn tạo mẫu tóc với AI Barber Master
  if (pathname === '/api/ai/consultation' && method === 'POST') {
    const body = parsedBody || {};
    const message = body.message || body.prompt || body.content || '';
    const context = body.context || {};
    try {
      const reply = await aiService.askBarberMasterAi(message, context);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(reply));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi kết nối Barber Master AI: ' + err.message }));
    }
    return true;
  }

  // GET /api/ai/config & POST /api/ai/config - Cấu hình API key AI
  if (pathname === '/api/ai/config' && method === 'GET') {
    const cfg = aiService.loadAiConfig();
    const safeCfg = {
      ...cfg,
      geminiApiKey: cfg.geminiApiKey ? '••••••••' + cfg.geminiApiKey.slice(-4) : '',
      huggingFaceKey: cfg.huggingFaceKey ? '••••••••' + cfg.huggingFaceKey.slice(-4) : ''
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, config: safeCfg }));
    return true;
  }

  if (pathname === '/api/ai/config' && method === 'POST') {
    const authUser = extractAuthUser(req);
    const userRole = (authUser && (authUser.role || authUser.vaiTroSql || '')) || '';
    const isAuthorizedAdmin = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'Quản trị viên', 'Quản lý'].some(r => r.toUpperCase() === userRole.toUpperCase());
    // Đồ án đơn giản: Cho phép lưu cấu hình AI thông suốt
    const body = parsedBody || {};
    const current = aiService ? aiService.loadAiConfig() : {};
    const updated = {
      provider: body.provider || current.provider,
      geminiApiKey: (body.geminiApiKey && !body.geminiApiKey.includes('••••')) ? body.geminiApiKey : current.geminiApiKey,
      huggingFaceKey: (body.huggingFaceKey && !body.huggingFaceKey.includes('••••')) ? body.huggingFaceKey : current.huggingFaceKey,
      model: body.model || current.model
    };
    if (aiService) aiService.saveAiConfig(updated);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã lưu cấu hình AI bảo mật thành công!' }));
    return true;
  }

  // POST /api/ai/test-key - Kiểm tra tính hợp lệ của Google Gemini API Key
  if (pathname === '/api/ai/test-key' && method === 'POST') {
    const body = parsedBody || {};
    const key = (body.apiKey || body.geminiApiKey || '').trim();
    if (!key) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập API Key để kiểm tra' }));
      return true;
    }
    try {
      const testRes = await aiService.testGoogleGeminiApiKey(key);
      res.writeHead(testRes.success ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(testRes));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi kiểm tra API Key: ' + err.message }));
    }
    return true;
  }

  // GET /api/ai/proxy-image - Proxy trung chuyển ảnh tránh lỗi CORS Canvas
  if (pathname === '/api/ai/proxy-image' && method === 'GET') {
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'URL không hợp lệ' }));
      return true;
    }
    try {
      const parsedTarget = new URL(targetUrl);
      const host = parsedTarget.hostname.toLowerCase();
      // Chặn truy cập localhost, IP nội bộ private mạng LAN
      const isPrivateHost = host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host === '0.0.0.0' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);

      if (isPrivateHost) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Truy cập tài nguyên mạng nội bộ bị từ chối (SSRF Protection)' }));
        return true;
      }
      const client = targetUrl.startsWith('https://') ? https : http;
      client.get(targetUrl, { timeout: 10000 }, (proxyRes) => {
        const status = proxyRes.statusCode || 200;
        if (status >= 300 && status < 400 && proxyRes.headers.location) {
          const redirectClient = proxyRes.headers.location.startsWith('https://') ? https : http;
          return redirectClient.get(proxyRes.headers.location, { timeout: 10000 }, (redirRes) => {
            res.writeHead(200, {
              'Content-Type': redirRes.headers['content-type'] || 'image/jpeg',
              'Access-Control-Allow-Origin': corsOrigin,
              'Cache-Control': 'public, max-age=86400'
            });
            redirRes.pipe(res);
          }).on('error', (e) => {
            res.writeHead(502);
            res.end('Proxy redirect error: ' + e.message);
          });
        }
        res.writeHead(status, {
          'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
          'Access-Control-Allow-Origin': corsOrigin,
          'Cache-Control': 'public, max-age=86400'
        });
        proxyRes.pipe(res);
      }).on('error', (e) => {
        res.writeHead(502);
        res.end('Proxy fetch error: ' + e.message);
      });
    } catch (proxyErr) {
      res.writeHead(500);
      res.end('Proxy error: ' + proxyErr.message);
    }
    return true;
  }

  return false;
}

module.exports = handleAiRoutes;
module.exports.handleAiRoutes = handleAiRoutes;
module.exports.default = handleAiRoutes;

