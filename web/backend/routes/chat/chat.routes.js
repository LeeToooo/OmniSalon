// =========================================================================
// QUẢN LÝ CHAT TRỰC TUYẾN (REALTIME CHAT) GIỮA KHÁCH HÀNG & ADMIN / THU NGÂN / QUẢN LÝ
// Bảng CSDL: TinNhan, KhachHang, NhanVien
// =========================================================================

const { querySql } = require('../../database/db');

// Đảm bảo bảng TinNhan luôn tồn tại
async function ensureChatTable() {
  try {
    await querySql(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TinNhan')
      BEGIN
        CREATE TABLE TinNhan (
          MaTinNhan INT IDENTITY(1,1) PRIMARY KEY,
          MaHoiThoai NVARCHAR(100) NOT NULL,
          MaNguoiGui NVARCHAR(50) NOT NULL,
          TenNguoiGui NVARCHAR(100) NOT NULL,
          VaiTroNguoiGui NVARCHAR(50) NOT NULL,
          MaNguoiNhan NVARCHAR(50) NULL,
          VaiTroNguoiNhan NVARCHAR(50) NULL,
          NoiDung NVARCHAR(MAX) NOT NULL,
          ThoiGianGui DATETIME DEFAULT GETDATE(),
          DaDoc BIT DEFAULT 0,
          LoaiTinNhan NVARCHAR(20) DEFAULT 'text'
        );
        CREATE INDEX IX_TinNhan_HoiThoai ON TinNhan(MaHoiThoai, ThoiGianGui);
      END
    `);
  } catch (err) {
    console.error('[CHAT] Lỗi kiểm tra bảng TinNhan:', err.message);
  }
}

// Gọi một lần khi nạp module
ensureChatTable();

/**
 * Xử lý các API Chat
 */
async function handleChatRoutes(req, res, ctx) {
  const { pathname, method, parsedUrl, parsedBody } = ctx;

  // 1. GET /api/chat/conversations - Lấy danh sách hội thoại cho Admin / Quản lý / Thu ngân
  if (pathname === '/api/chat/conversations' && method === 'GET') {
    try {
      await ensureChatTable();
      // Gom nhóm theo MaHoiThoai, lấy tin nhắn mới nhất và số tin chưa đọc
      const rows = await querySql(`
        WITH LastMsg AS (
          SELECT 
            MaHoiThoai,
            MAX(MaTinNhan) as MaxId
          FROM TinNhan
          GROUP BY MaHoiThoai
        )
        SELECT 
          t.MaHoiThoai,
          t.MaNguoiGui,
          t.TenNguoiGui,
          t.VaiTroNguoiGui,
          t.NoiDung AS LastMessage,
          CONVERT(VARCHAR(19), t.ThoiGianGui, 120) AS LastTime,
          t.DaDoc,
          (
            SELECT COUNT(*) 
            FROM TinNhan unread 
            WHERE unread.MaHoiThoai = t.MaHoiThoai 
              AND unread.DaDoc = 0 
              AND unread.VaiTroNguoiGui = 'KhachHang'
          ) AS UnreadCount
        FROM TinNhan t
        INNER JOIN LastMsg lm ON t.MaTinNhan = lm.MaxId
        ORDER BY t.ThoiGianGui DESC
      `);

      // Lấy thông tin bổ sung khách hàng nếu có
      const conversations = [];
      for (const r of rows) {
        let customerInfo = null;
        const khId = r.MaHoiThoai.replace(/^CONV_/, '');
        const khRows = await querySql(`
          SELECT TOP 1 MaKhachHang, HoTen, SoDienThoai, Email
          FROM KhachHang
          WHERE MaKhachHang = ? OR SoDienThoai = ?
        `, [khId, khId]);
        if (khRows && khRows.length > 0) {
          customerInfo = khRows[0];
        }

        conversations.push({
          conversationId: r.MaHoiThoai,
          lastMessage: r.LastMessage,
          lastTime: r.LastTime,
          unreadCount: Number(r.UnreadCount || 0),
          customerName: customerInfo ? customerInfo.HoTen : (r.TenNguoiGui || 'Khách hàng'),
          customerPhone: customerInfo ? customerInfo.SoDienThoai : '',
          customerAvatar: '',
          memberTier: 'Khách hàng'
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(conversations));
      return true;
    } catch (err) {
      console.error('[CHAT API] conversations error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Lỗi tải danh sách hội thoại' }));
      return true;
    }
  }

  // 2. GET /api/chat/messages - Lấy danh sách tin nhắn theo MaHoiThoai
  if (pathname === '/api/chat/messages' && method === 'GET') {
    try {
      await ensureChatTable();
      const searchParams = parsedUrl ? parsedUrl.searchParams : new URL(req.url, 'http://localhost').searchParams;
      const conversationId = searchParams.get('conversationId');
      const afterId = parseInt(searchParams.get('afterId') || '0', 10) || 0;

      if (!conversationId) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Thiếu conversationId' }));
        return true;
      }

      let rows;
      if (afterId > 0) {
        rows = await querySql(`
          SELECT 
            MaTinNhan AS id,
            MaHoiThoai AS conversationId,
            MaNguoiGui AS senderId,
            TenNguoiGui AS senderName,
            VaiTroNguoiGui AS senderRole,
            MaNguoiNhan AS recipientId,
            VaiTroNguoiNhan AS recipientRole,
            NoiDung AS message,
            CONVERT(VARCHAR(19), ThoiGianGui, 120) AS timestamp,
            DaDoc AS isRead,
            LoaiTinNhan AS messageType
          FROM TinNhan
          WHERE MaHoiThoai = ? AND MaTinNhan > ?
          ORDER BY MaTinNhan ASC
        `, [conversationId, afterId]);
      } else {
        rows = await querySql(`
          SELECT TOP 100
            MaTinNhan AS id,
            MaHoiThoai AS conversationId,
            MaNguoiGui AS senderId,
            TenNguoiGui AS senderName,
            VaiTroNguoiGui AS senderRole,
            MaNguoiNhan AS recipientId,
            VaiTroNguoiNhan AS recipientRole,
            NoiDung AS message,
            CONVERT(VARCHAR(19), ThoiGianGui, 120) AS timestamp,
            DaDoc AS isRead,
            LoaiTinNhan AS messageType
          FROM TinNhan
          WHERE MaHoiThoai = ?
          ORDER BY MaTinNhan ASC
        `, [conversationId]);
      }

      // Đánh dấu đã đọc nếu role đọc là Admin/Staff hoặc Khách
      const markRole = searchParams.get('markReadRole');
      if (markRole) {
        // Nếu markRole là 'admin' -> Đánh dấu các tin của 'KhachHang' thành đã đọc
        if (markRole === 'admin') {
          await querySql(`
            UPDATE TinNhan 
            SET DaDoc = 1 
            WHERE MaHoiThoai = ? AND VaiTroNguoiGui = 'KhachHang' AND DaDoc = 0
          `, [conversationId]);
        } else if (markRole === 'customer') {
          await querySql(`
            UPDATE TinNhan 
            SET DaDoc = 1 
            WHERE MaHoiThoai = ? AND VaiTroNguoiGui != 'KhachHang' AND DaDoc = 0
          `, [conversationId]);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(rows));
      return true;
    } catch (err) {
      console.error('[CHAT API] messages error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Lỗi tải tin nhắn' }));
      return true;
    }
  }

  // 3. POST /api/chat/send - Gửi tin nhắn mới
  if (pathname === '/api/chat/send' && method === 'POST') {
    try {
      await ensureChatTable();
      const body = parsedBody || {};
      const conversationId = (body.conversationId || '').trim();
      const senderId = (body.senderId || 'GUEST').trim();
      const senderName = (body.senderName || 'Khách').trim();
      const senderRole = (body.senderRole || 'KhachHang').trim(); // 'KhachHang', 'ThuNgan', 'QuanLy', 'QuanTriVien'
      const recipientId = (body.recipientId || '').trim() || null;
      const recipientRole = (body.recipientRole || '').trim() || null;
      const message = (body.message || '').trim();
      const messageType = (body.messageType || 'text').trim();

      if (!conversationId || !message) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'conversationId và message không được để trống' }));
        return true;
      }

      await querySql(`
        INSERT INTO TinNhan (
          MaHoiThoai, MaNguoiGui, TenNguoiGui, VaiTroNguoiGui, 
          MaNguoiNhan, VaiTroNguoiNhan, NoiDung, ThoiGianGui, DaDoc, LoaiTinNhan
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE(), 0, ?)
      `, [
        conversationId, senderId, senderName, senderRole,
        recipientId, recipientRole, message, messageType
      ]);

      const inserted = await querySql(`
        SELECT TOP 1
          MaTinNhan AS id,
          MaHoiThoai AS conversationId,
          MaNguoiGui AS senderId,
          TenNguoiGui AS senderName,
          VaiTroNguoiGui AS senderRole,
          MaNguoiNhan AS recipientId,
          VaiTroNguoiNhan AS recipientRole,
          NoiDung AS message,
          CONVERT(VARCHAR(19), ThoiGianGui, 120) AS timestamp,
          DaDoc AS isRead,
          LoaiTinNhan AS messageType
        FROM TinNhan
        WHERE MaHoiThoai = ?
        ORDER BY MaTinNhan DESC
      `, [conversationId]);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: inserted[0] || null }));
      return true;
    } catch (err) {
      console.error('[CHAT API] send error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Lỗi gửi tin nhắn' }));
      return true;
    }
  }

  // 4. POST /api/chat/mark-read - Đánh dấu đã đọc
  if (pathname === '/api/chat/mark-read' && method === 'POST') {
    try {
      await ensureChatTable();
      const body = parsedBody || {};
      const conversationId = (body.conversationId || '').trim();
      const readerRole = (body.readerRole || 'admin').trim();

      if (!conversationId) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Thiếu conversationId' }));
        return true;
      }

      if (readerRole === 'admin') {
        await querySql(`
          UPDATE TinNhan 
          SET DaDoc = 1 
          WHERE MaHoiThoai = ? AND VaiTroNguoiGui = 'KhachHang'
        `, [conversationId]);
      } else {
        await querySql(`
          UPDATE TinNhan 
          SET DaDoc = 1 
          WHERE MaHoiThoai = ? AND VaiTroNguoiGui != 'KhachHang'
        `, [conversationId]);
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true }));
      return true;
    } catch (err) {
      console.error('[CHAT API] mark-read error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Lỗi cập nhật trạng thái đã đọc' }));
      return true;
    }
  }

  return false;
}

module.exports = handleChatRoutes;
