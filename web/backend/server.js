require('dotenv').config();

// Khởi tạo máy chủ web và điều hướng api

const http = require('http');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Cấu hình kết nối cơ sở dữ liệu SQL Server
const { initDbConnection, getActiveDbConfig, DB_NAME } = require('./database/db');

// Middleware xác thực tài khoản và CORS
const { getCorsOrigin, ALLOWED_ORIGINS } = require('./middlewares/auth_middleware');

// Router điều hướng các api
const handleApiRoutes = require('./routes');

// Bộ lập lịch tự động kích hoạt hủy lịch hẹn/đơn hàng quá hạn qua 12h đêm
const { startMidnightAutoCancelScheduler } = require('./services/auto_cancel_service');

// Đường dẫn thư mục gốc và thư mục frontend giao diện
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'web', 'frontend');

// Bảng định dạng MIME phục vụ file tĩnh
const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4'
};

// Khởi tạo máy chủ HTTP
const server = http.createServer(async (req, res) => {
  // Cấu hình tiêu đề CORS an toàn
  const corsOrigin = getCorsOrigin(req.headers.origin);
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Vary', 'Origin');

  // Phản hồi yêu cầu OPTIONS, CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Thu thập nội dung request body, JSON (giới hạn 15MB để chống OOM DoS)
  const MAX_BODY_BYTES = 15 * 1024 * 1024;
  const chunks = [];
  let totalBytes = 0;
  let bodyAborted = false;

  req.on('error', () => {
    bodyAborted = true;
  });

  req.on('data', chunk => {
    if (bodyAborted) return;
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_BYTES) {
      bodyAborted = true;
      if (!res.headersSent) {
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Dữ liệu gửi lên vượt quá giới hạn cho phép (15MB).' }));
      }
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', async () => {
    if (bodyAborted) return;
    const body = chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : '';
    let parsedBody = null;
    if (body) {
      try {
        parsedBody = JSON.parse(body);
      } catch (err) {
        console.warn(`[HTTP] Invalid JSON payload on ${pathname}:`, err.message);
      }
    }

    // Đóng gói ngữ cảnh yêu cầu gửi vào các router con
    const ctx = {
      pathname,
      method,
      parsedUrl,
      parsedBody,
      corsOrigin,
      rawBody: body
    };

    try {
      // Kênh Server-Sent Events (SSE) đẩy cập nhật thời gian thực tới trình duyệt
      if (pathname === '/api/events' && method === 'GET') {
        const realtimeService = require('./services/realtime.service');
        realtimeService.addClient(req, res);
        return;
      }

      // Xử lý các yêu cầu api
      if (await handleApiRoutes(req, res, ctx)) return;

      // Nếu client gọi đường dẫn /api/... nhưng không khớp router nào
      if (pathname.startsWith('/api/')) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, error: 'Không tìm thấy API yêu cầu', path: pathname }));
      }

      // Phục vụ các file tĩnh như ảnh, css và js (chặn Path Traversal và file nhạy cảm)
      let rawPath = pathname.replace(/^\/+/, '');
      try {
        rawPath = decodeURIComponent(rawPath);
      } catch (_) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, error: 'Đường dẫn không hợp lệ' }));
      }

      if (rawPath.includes('\0') || rawPath.includes('..') || rawPath.includes('\\')) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, error: 'Truy cập bị từ chối' }));
      }

      let relPath = rawPath;
      if (relPath.startsWith('static/')) {
        relPath = relPath.substring(7);
      }
      relPath = relPath.replace(/^web\/frontend\//, '').replace(/^frontend\//, '').replace(/^web\//, '');

      const pathSegments = relPath.split('/').filter(Boolean);
      if (pathSegments.some(seg => seg.startsWith('.') || seg === 'node_modules' || seg === 'config')) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, error: 'Truy cập bị từ chối' }));
      }

      const DATAPICTURE_DIR = path.resolve(ROOT_DIR, 'DataPicture');
      const FRONTEND_BASE = path.resolve(FRONTEND_DIR);
      const HAIRSTYLES_DIR = path.resolve(__dirname, 'ai_engine', 'hairstyles');
      const FRONTEND_HAIRSTYLES_DIR = path.resolve(FRONTEND_BASE, 'assets', 'hairstyles');

      const cleanRelPath = relPath.replace(/^DataPicture\//i, '');
      const safeBasename = path.basename(relPath);
      const candidateRoots = [
        { base: DATAPICTURE_DIR, target: path.resolve(DATAPICTURE_DIR, cleanRelPath) },
        { base: FRONTEND_BASE, target: path.resolve(FRONTEND_BASE, 'DataPicture', cleanRelPath) },
        { base: FRONTEND_BASE, target: path.resolve(FRONTEND_BASE, relPath) },
        { base: HAIRSTYLES_DIR, target: path.resolve(HAIRSTYLES_DIR, safeBasename) },
        { base: FRONTEND_HAIRSTYLES_DIR, target: path.resolve(FRONTEND_HAIRSTYLES_DIR, safeBasename) }
      ];

      function isPathInsideBase(baseDir, resolvedTarget) {
        const rel = path.relative(baseDir, resolvedTarget);
        return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
      }

      for (const candidate of candidateRoots) {
        if (!isPathInsideBase(candidate.base, candidate.target)) continue;
        if (fs.existsSync(candidate.target)) {
          try {
            const realBase = fs.realpathSync(candidate.base);
            const realTarget = fs.realpathSync(candidate.target);
            if (!isPathInsideBase(realBase, realTarget)) continue;
            const stat = fs.statSync(realTarget);
            if (stat.isFile()) {
              const ext = path.extname(realTarget).toLowerCase();
              const mime = MIME_MAP[ext] || 'application/octet-stream';
              const isCode = ['.js', '.css', '.html', '.json'].includes(ext);
              res.writeHead(200, {
                'Content-Type': mime,
                'Content-Length': stat.size,
                'Cache-Control': isCode ? 'no-cache, no-store, must-revalidate' : 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'Accept-Ranges': 'bytes'
              });
              if (method === 'HEAD') {
                return res.end();
              }
              return fs.createReadStream(realTarget).pipe(res);
            }
          } catch (err) {
            console.warn(`[HTTP] Static asset serve error (${relPath}):`, err.message);
          }
        }
      }

      // Trả về file index.html cho các đường dẫn trang
      const fileExt = path.extname(relPath).toLowerCase();
      if (!fileExt || fileExt === '.html') {
        const indexPath = path.join(FRONTEND_DIR, 'index.html');
        if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0'
          });
          return fs.createReadStream(indexPath).pipe(res);
        }
      }

      // Không tìm thấy file
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, error: 'File Not Found', path: pathname }));

    } catch (err) {
      console.error(`[Lỗi Server] Yêu cầu ${method} ${pathname} gặp sự cố:`, err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: 'Lỗi xử lý nội bộ máy chủ.' }));
      }
    }
  });
});

// KHỞI ĐỘNG MÁY CHỦ VỚI CƠ CHẾ DÒ TÌM CỔNG DỰ PHÒNG
async function startServer() {
  await initDbConnection();
  startMidnightAutoCancelScheduler();

  // Danh sách các cổng có thể lắng nghe nếu cổng mặc định bị chiếm dụng
  const CANDIDATE_PORTS = [
    process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    3000,
    3001,
    3002,
    8080,
    8081,
    8082,
    5000
  ].filter((p, idx, arr) => p && arr.indexOf(p) === idx);

  let portIdx = 0;

  function tryListen() {
    const currentPort = CANDIDATE_PORTS[portIdx];
    server.removeAllListeners('error');
    server.removeAllListeners('listening');

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        console.warn(`[Thông Báo Cổng] Cổng ${currentPort} đang bận (${err.code}).`);
        portIdx++;
        if (portIdx < CANDIDATE_PORTS.length) {
          console.log(`  -> Đang chuyển sang cổng dự phòng: http://localhost:${CANDIDATE_PORTS[portIdx]}...\n`);
          tryListen();
        } else {
          console.error(`[Lỗi Cổng] Tất cả các cổng dự phòng đều không khả dụng.`);
          process.exit(1);
        }
      } else {
        console.error('[Lỗi Server]', err);
      }
    });

    server.once('listening', () => {
      console.log(`--------------------------------------------------`);
      console.log(`  HỆ THỐNG OMNISALON BACKEND ĐANG HOẠT ĐỘNG`);
      console.log(`  - Địa chỉ Website:   http://localhost:${currentPort}`);
      console.log(`  - Máy chủ CSDL:      ${getActiveDbConfig()?.server || '.\\SQLEXPRESS'}`);
      console.log(`  - Cơ sở dữ liệu:     ${DB_NAME}`);
      console.log(`  - Kiểm tra API:      http://localhost:${currentPort}/api/health`);
      console.log(`--------------------------------------------------`);
    });

    server.listen(currentPort, '0.0.0.0');
  }

  tryListen();
}

startServer();
