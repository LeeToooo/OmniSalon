// Các api xử lý ảnh và gợi ý kiểu tóc
const http = require('http');
const https = require('https');
const dns = require('dns').promises;
const net = require('net');

function isPrivateOrReservedIp(ip) {
  if (!ip) return true;
  const normalized = ip.toLowerCase().trim();
  if (normalized === '::1' || normalized === '::' || normalized === '0.0.0.0') return true;
  if (normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('ff')) return true;
  const v4 = normalized.startsWith('::ffff:') ? normalized.slice(7) : normalized;
  if (!net.isIPv4(v4)) {
    return normalized.includes(':'); // chặn IPv6 nội bộ/không xác định
  }
  const parts = v4.split('.').map(n => parseInt(n, 10));
  if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

async function validateSafePublicUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (_) {
    return { safe: false, reason: 'URL không hợp lệ' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, reason: 'Chỉ hỗ trợ giao thức HTTP/HTTPS' };
  }
  if (parsed.username || parsed.password) {
    return { safe: false, reason: 'URL không hợp lệ' };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { safe: false, reason: 'Không cho phép truy cập máy chủ nội bộ' };
  }
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { safe: false, reason: 'Địa chỉ IP nội bộ bị chặn' };
    }
    return { safe: true, url: parsed.toString() };
  }
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      return { safe: false, reason: 'Không thể phân giải tên miền' };
    }
    for (const rec of records) {
      if (isPrivateOrReservedIp(rec.address)) {
        return { safe: false, reason: 'Tên miền trỏ tới địa chỉ nội bộ bị chặn' };
      }
    }
    return { safe: true, url: parsed.toString() };
  } catch (_) {
    return { safe: false, reason: 'Không thể phân giải DNS cho URL' };
  }
}

async function proxySafeImage(targetUrl, res, corsOrigin, redirectsLeft = 2) {
  const check = await validateSafePublicUrl(targetUrl);
  if (!check.safe) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: check.reason || 'Không thể truy cập hình ảnh này.' }));
    return;
  }

  const client = check.url.startsWith('https://') ? https : http;
  const request = client.get(check.url, { timeout: 10000, headers: { 'User-Agent': 'OmniSalon-ImageProxy/1.0' } }, async (proxyRes) => {
    const status = proxyRes.statusCode || 200;
    if (status >= 300 && status < 400 && proxyRes.headers.location) {
      proxyRes.resume();
      if (redirectsLeft <= 0) {
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Quá nhiều chuyển hướng ảnh.' }));
        }
        return;
      }
      try {
        const nextUrl = new URL(proxyRes.headers.location, check.url).toString();
        await proxySafeImage(nextUrl, res, corsOrigin, redirectsLeft - 1);
      } catch (_) {
        if (!res.headersSent) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'URL chuyển hướng không hợp lệ.' }));
        }
      }
      return;
    }

    const contentType = String(proxyRes.headers['content-type'] || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      proxyRes.resume();
      res.writeHead(415, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Tài nguyên đích không phải hình ảnh hợp lệ.' }));
      return;
    }

    const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
    const chunks = [];
    let total = 0;
    proxyRes.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_IMAGE_BYTES) {
        proxyRes.destroy();
        if (!res.headersSent) {
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Kích thước ảnh vượt quá giới hạn 10MB.' }));
        }
        return;
      }
      chunks.push(chunk);
    });
    proxyRes.on('end', () => {
      if (res.headersSent || total > MAX_IMAGE_BYTES) return;
      const buf = Buffer.concat(chunks);
      res.writeHead(200, {
        'Content-Type': contentType.split(';')[0] || 'image/jpeg',
        'Content-Length': buf.length,
        'Access-Control-Allow-Origin': corsOrigin,
        'Cache-Control': 'public, max-age=86400'
      });
      res.end(buf);
    });
  });

  request.on('error', (e) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi tải ảnh: ' + e.message }));
    }
  });
}

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
    const includeAssets = body.includeAssets !== false;
    try {
      const analysis = await aiService.analyzeFaceGeometry(image, { includeAssets });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(analysis));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Lỗi phân tích ngũ quan AI: ' + err.message }));
    }
    return true;
  }

  // POST /api/ai/restyle-hair - Thử kiểu tóc AI qua Python Vision cục bộ
  if (pathname === '/api/ai/restyle-hair' && method === 'POST') {
    const body = parsedBody || {};
    const image = body.image || body.imageBase64OrUrl || body.imageBase64 || body.originalImageBase64 || body.url || body.photoUrl || '';
    const hairstyleId = body.hairstyleId || body.selectedHairstyle || body.hairstyleName || 'layer-korean';
    const colorId = body.colorId || body.selectedColor || body.hairColorName || 'natural-black';
    const customPrompt = body.customPrompt || body.prompt || '';
    const volume = ['natural', 'standard', 'high'].includes(body.volume) ? body.volume : 'standard';
    const finish = ['matte', 'gloss'].includes(body.finish) ? body.finish : 'matte';
    const preserveBackground = body.preserveBackground !== undefined ? Boolean(body.preserveBackground) : true;
    const balanceLighting = body.balanceLighting !== undefined ? body.balanceLighting : true;
    const smoothSkin = body.smoothSkin !== undefined ? body.smoothSkin : true;

    try {
      const result = await aiService.generateAiHairRestyle({
        imageBase64OrUrl: image,
        hairstyleId,
        colorId,
        colorHex: body.colorHex || body.hairColorHex || '',
        customPrompt,
        volume,
        finish,
        preserveBackground,
        balanceLighting,
        smoothSkin
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Không thể xử lý ảnh lúc này: ' + err.message }));
    }
    return true;
  }

  // GET /api/ai/proxy-image - Proxy trung chuyển ảnh an toàn (chặn SSRF + redirect nội bộ)
  if (pathname === '/api/ai/proxy-image' && method === 'GET') {
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'URL không hợp lệ' }));
      return true;
    }
    try {
      await proxySafeImage(targetUrl, res, corsOrigin, 2);
    } catch (proxyErr) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Proxy error: ' + proxyErr.message }));
      }
    }
    return true;
  }

  return false;
}

module.exports = handleAiRoutes;
module.exports.handleAiRoutes = handleAiRoutes;
module.exports.default = handleAiRoutes;

