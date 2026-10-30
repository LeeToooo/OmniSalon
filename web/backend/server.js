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
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Thu thập nội dung request body, JSON
  let body = '';
  req.on('data', chunk => { body += chunk.toString('utf8'); });
  req.on('end', async () => {
    let parsedBody = null;
    if (body) {
      try { parsedBody = JSON.parse(body); } catch (_) {}
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
            // Xử lý các yêu cầu api
      if (await handleApiRoutes(req, res, ctx)) return;

      // Nếu client gọi đường dẫn /api/... nhưng không khớp router nào
      if (pathname.startsWith('/api/')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ error: 'Không tìm thấy API yêu cầu', path: pathname }));
      }

            // Phục vụ các file tĩnh như ảnh, css và js
      let rawPath = pathname.replace(/^\/+/, '');
      try { rawPath = decodeURIComponent(rawPath); } catch (_) {}

      let relPath = rawPath;
      if (relPath.startsWith('static/')) {
        relPath = relPath.substring(7);
      }
      relPath = relPath.replace(/^web\/frontend\//, '').replace(/^frontend\//, '').replace(/^web\//, '');

      // Tìm kiếm file tại thư mục gốc dự án hoặc thư mục frontend
      const candidatePaths = [
        path.join(ROOT_DIR, relPath),
        path.join(ROOT_DIR, 'Men_Grooming_Products', relPath),
        path.join(FRONTEND_DIR, relPath)
      ];

      if (relPath.startsWith('ChiNhanh_Omni/')) {
        candidatePaths.push(path.join(ROOT_DIR, 'Men_Grooming_Products', 'ChiNhanh_Omni', path.basename(relPath)));
      }
      if (relPath.startsWith('DichVu_Men/')) {
        candidatePaths.push(path.join(ROOT_DIR, 'Men_Grooming_Products', 'DichVu_Men', path.basename(relPath)));
      }

      for (const targetPath of candidatePaths) {
        if (fs.existsSync(targetPath)) {
          try {
            const stat = fs.statSync(targetPath);
            if (stat.isFile()) {
              const ext = path.extname(targetPath).toLowerCase();
              const mime = MIME_MAP[ext] || 'application/octet-stream';
              const isCode = ['.js', '.css', '.html', '.json'].includes(ext);
              res.writeHead(200, {
                'Content-Type': mime,
                'Content-Length': stat.size,
                'Cache-Control': isCode ? 'no-cache, no-store, must-revalidate' : 'public, max-age=86400',
                'Access-Control-Allow-Origin': corsOrigin,
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'Accept-Ranges': 'bytes'
              });
              if (method === 'HEAD') {
                return res.end();
              }
              return fs.createReadStream(targetPath).pipe(res);
            }
          } catch (_) {}
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
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'File Not Found', path: pathname }));

    } catch (err) {
      console.error(`[Lỗi Server] Yêu cầu ${method} ${pathname} gặp sự cố:`, err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    }
  });
});

// KHỞI ĐỘNG MÁY CHỦ VỚI CƠ CHẾ DÒ TÌM CỔNG DỰ PHÒNG
async function startServer() {
  await initDbConnection();

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
