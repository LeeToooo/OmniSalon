// =========================================================================
// QUẢN LÝ SẢN PHẨM MỸ PHẨM & DANH MỤC
// Bảng CSDL: SanPham, DanhMucSanPham, TonKho, ChiTietPhieuNhap, QuyTacGiamGiaTheoHan
// =========================================================================

const { querySql } = require('../../database/db');
const { catIcons, brandPrefixes, detectBrand } = require('../../services/helper_service');

async function handleProductRoutes(req, res, ctx) {
  const { pathname, method, parsedBody } = ctx;

  // -----------------------------------------------------------------------
  // SẢN PHẨM MỸ PHẨM
  // -----------------------------------------------------------------------

  // GET /api/products - Danh sách mỹ phẩm kèm thông tin tồn kho, lô hạn dùng và giảm giá cận date
  if (pathname === '/api/products' && method === 'GET') {
    const [rows, promoRows, kmSanPhamRows, discountRules, reviewRows] = await Promise.all([
      querySql(`
        SELECT sp.MaSanPham, sp.MaDanhMuc, sp.MaNhaCungCap, sp.TenSanPham, sp.MoTa, 
               sp.HinhAnh, sp.GiaNhap, sp.GiaBan, sp.TrangThaiKinhDoanh,
               dm.TenDanhMuc,
               ISNULL((SELECT SUM(tk.SoLuongTon) FROM TonKho tk WHERE tk.MaSanPham = sp.MaSanPham), 0) AS SoLuongTon,
               CONVERT(VARCHAR(10), ctpn.HanSuDung, 120) AS HanSuDung,
               ctpn.SoLuongConLai
        FROM SanPham sp
        LEFT JOIN DanhMucSanPham dm ON sp.MaDanhMuc = dm.MaDanhMuc
        OUTER APPLY (
            SELECT TOP 1 HanSuDung, SoLuongConLai 
            FROM ChiTietPhieuNhap 
            WHERE MaSanPham = sp.MaSanPham AND SoLuongConLai > 0
            ORDER BY HanSuDung ASC
        ) ctpn
      `),
      querySql(`SELECT MaKhuyenMai, TenKhuyenMai, HinhThuc, GiaTriGiam, TrangThai FROM KhuyenMai WHERE TrangThai = N'Đang áp dụng'`),
      querySql(`SELECT MaKhuyenMai, MaSanPham FROM KhuyenMai_SanPham`),
      querySql(`SELECT MaQuyTac, SoNgayConLaiToiThieu, SoNgayConLaiToiDa, PhanTramGiam FROM QuyTacGiamGiaTheoHan WHERE TrangThai = N'Áp dụng' ORDER BY PhanTramGiam DESC`),
      querySql(`SELECT dg.SoSao, ctdh.MaSanPham FROM DanhGia dg JOIN ChiTietDonHang ctdh ON dg.MaDonHang = ctdh.MaDonHang WHERE ctdh.MaSanPham IS NOT NULL`)
    ]);

    const ratingMap = new Map();
    (reviewRows || []).forEach(rv => {
      if (!ratingMap.has(rv.MaSanPham)) ratingMap.set(rv.MaSanPham, []);
      ratingMap.get(rv.MaSanPham).push(Number(rv.SoSao || 5));
    });

    const now = new Date();

    const products = rows.map(r => {
      const origPrice = parseFloat(r.GiaBan || 0);
      let finalPrice = origPrice;
      let discountPercent = 0;
      let promoInfo = null;

      // Ưu tiên 1: Áp dụng quy tắc giảm giá xả hàng theo hạn sử dụng
      if (r.HanSuDung) {
        const expDate = new Date(r.HanSuDung);
        const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0) {
          const matchedRule = (discountRules || []).find(rl => daysLeft >= rl.SoNgayConLaiToiThieu && daysLeft <= rl.SoNgayConLaiToiDa);
          if (matchedRule) {
            discountPercent = parseFloat(matchedRule.PhanTramGiam || 0);
            finalPrice = Math.round(origPrice * (1 - discountPercent / 100));
            promoInfo = {
              code: matchedRule.MaQuyTac,
              name: `Cận date (${daysLeft} ngày) - Giảm ${discountPercent}%`,
              discountPercent
            };
          }
        }
      }

      // Ưu tiên 2: Khuyến mãi theo chiến dịch marketing nếu chưa có giảm giá cận date
      if (discountPercent === 0) {
        const matchedLink = (kmSanPhamRows || []).find(km => km.MaSanPham === r.MaSanPham);
        const matchedPromo = matchedLink ? (promoRows || []).find(p => p.MaKhuyenMai === matchedLink.MaKhuyenMai) : null;
        if (matchedPromo) {
          if (matchedPromo.HinhThuc && matchedPromo.HinhThuc.includes('%')) {
            discountPercent = parseFloat(matchedPromo.GiaTriGiam || 0);
            finalPrice = Math.round(origPrice * (1 - discountPercent / 100));
          } else {
            const discountAmt = parseFloat(matchedPromo.GiaTriGiam || 0);
            finalPrice = Math.max(0, origPrice - discountAmt);
            discountPercent = origPrice > 0 ? Math.round((discountAmt / origPrice) * 100) : 0;
          }
          promoInfo = {
            code: matchedPromo.MaKhuyenMai,
            name: matchedPromo.TenKhuyenMai,
            discountPercent
          };
        }
      }

      const pStock = parseInt(r.SoLuongTon || 0, 10);
      const ratings = ratingMap.get(r.MaSanPham) || [];
      const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 5.0;

      return {
        id: r.MaSanPham,
        MaSanPham: r.MaSanPham,
        name: r.TenSanPham,
        TenSanPham: r.TenSanPham,
        categoryId: r.MaDanhMuc,
        category: r.TenDanhMuc || 'Chăm sóc tóc',
        brand: typeof detectBrand === 'function' ? detectBrand(r.TenSanPham) : (brandPrefixes[r.MaSanPham] || 'Omni Professional'),
        price: finalPrice,
        originalPrice: origPrice,
        GiaBan: origPrice,
        costPrice: parseFloat(r.GiaNhap || 0),
        discountPercent,
        promotion: promoInfo,
        stock: pStock,
        SoLuongTon: pStock,
        inStock: pStock > 0,
        rating: avgRating,
        reviewsCount: ratings.length,
        image: r.HinhAnh || '',
        HinhAnh: r.HinhAnh || '',
        description: r.MoTa,
        MoTa: r.MoTa,
        expiryDate: r.HanSuDung,
        status: r.TrangThaiKinhDoanh || 'Kinh doanh'
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(products));
    return true;
  }

  // POST /api/products - Thêm sản phẩm mỹ phẩm mới vào kho
  if (pathname === '/api/products' && method === 'POST') {
    const body = parsedBody || {};
    const maxRows = await querySql(`SELECT TOP 1 MaSanPham FROM SanPham ORDER BY LEN(MaSanPham) DESC, MaSanPham DESC`);
    let nextN = 21;
    if (maxRows && maxRows[0]) {
      const m = maxRows[0].MaSanPham.match(/SP(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const spId = (body.id || body.MaSanPham || ('SP' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const catId = body.categoryId || body.MaDanhMuc || 'DM01';
    const suppId = body.supplierId || body.MaNhaCungCap || 'NCC01';
    const name = body.name || body.TenSanPham || 'Sản phẩm mới';
    const desc = body.description || body.MoTa || '';
    const image = body.image || body.HinhAnh || '';
    const cost = parseFloat(body.costPrice || body.GiaNhap || 150000);
    const price = parseFloat(body.price || body.GiaBan || 250000);
    const status = body.status || body.TrangThaiKinhDoanh || 'Kinh doanh';

    await querySql(
      `INSERT INTO SanPham (MaSanPham, MaDanhMuc, MaNhaCungCap, TenSanPham, MoTa, HinhAnh, GiaNhap, GiaBan, TrangThaiKinhDoanh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [spId, catId, suppId, name, desc, image, cost, price, status]
    );

    // Tự động khởi tạo dòng tồn kho cho 20 chi nhánh
    await querySql(`
      INSERT INTO TonKho (MaSanPham, MaChiNhanh, SoLuongTon, MucCanhBao, NgayCapNhat)
      SELECT ?, cn.MaChiNhanh, 0, 5, GETDATE()
      FROM ChiNhanh cn
      WHERE NOT EXISTS (
        SELECT 1 FROM TonKho tk WHERE tk.MaSanPham = ? AND tk.MaChiNhanh = cn.MaChiNhanh
      )
    `, [spId, spId]).catch(() => {});

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, product: { id: spId, MaSanPham: spId, name, price, status } }));
    return true;
  }

  // PUT /api/products/:id - Cập nhật thông tin sản phẩm
  if (pathname.startsWith('/api/products/') && method === 'PUT') {
    const id = pathname.replace('/api/products/', '').trim();
    const body = parsedBody || {};
    await querySql(
      `UPDATE SanPham SET 
         TenSanPham = COALESCE(?, TenSanPham), 
         MaDanhMuc = COALESCE(?, MaDanhMuc), 
         GiaBan = COALESCE(?, GiaBan), 
         GiaNhap = COALESCE(?, GiaNhap), 
         MoTa = COALESCE(?, MoTa), 
         HinhAnh = COALESCE(?, HinhAnh), 
         TrangThaiKinhDoanh = COALESCE(?, TrangThaiKinhDoanh) 
       WHERE MaSanPham = ?`,
      [
        body.name || body.TenSanPham || null,
        body.categoryId || body.MaDanhMuc || null,
        body.price || body.GiaBan || null,
        body.costPrice || body.GiaNhap || null,
        body.description || body.MoTa || null,
        body.image || body.HinhAnh || null,
        body.status || body.TrangThaiKinhDoanh || null,
        id
      ]
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // DELETE /api/products/:id - Ngừng kinh doanh sản phẩm
  // Lưu ý: Dùng Soft-delete nếu sản phẩm đã có lịch sử trong Đơn hàng, Hóa đơn POS, Phiếu nhập kho hoặc Khuyến mãi
  if (pathname.startsWith('/api/products/') && method === 'DELETE') {
    const id = pathname.replace('/api/products/', '').trim();
    const hasHistory = await querySql(`
      SELECT TOP 1 MaSanPham FROM (
        SELECT MaSanPham FROM ChiTietDonHang WHERE MaSanPham = ?
        UNION ALL
        SELECT MaSanPham FROM ChiTietHoaDon_SanPham WHERE MaSanPham = ?
        UNION ALL
        SELECT MaSanPham FROM ChiTietPhieuNhap WHERE MaSanPham = ?
        UNION ALL
        SELECT MaSanPham FROM KhuyenMai_SanPham WHERE MaSanPham = ?
      ) t
    `, [id, id, id, id]);

    if (hasHistory && hasHistory.length > 0) {
      await querySql(`UPDATE SanPham SET TrangThaiKinhDoanh = N'Ngừng kinh doanh' WHERE MaSanPham = ?`, [id]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Sản phẩm đã có lịch sử chứng từ kho hoặc giao dịch, chuyển sang trạng thái Ngừng kinh doanh.', id, softDeleted: true }));
      return true;
    }

    await querySql(`DELETE FROM TonKho WHERE MaSanPham = ?`, [id]);
    await querySql(`DELETE FROM SanPham WHERE MaSanPham = ?`, [id]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa sản phẩm khỏi cơ sở dữ liệu', id }));
    return true;
  }

  // -----------------------------------------------------------------------
  // DANH MỤC SẢN PHẨM
  // -----------------------------------------------------------------------

  // GET /api/categories - Lấy danh mục sản phẩm
  if (pathname === '/api/categories' && method === 'GET') {
    const rows = await querySql(`SELECT MaDanhMuc, TenDanhMuc, MoTa, TrangThai FROM DanhMucSanPham`);
    const categories = rows.map(r => ({
      id: r.MaDanhMuc,
      MaDanhMuc: r.MaDanhMuc,
      name: r.TenDanhMuc,
      TenDanhMuc: r.TenDanhMuc,
      description: r.MoTa,
      MoTa: r.MoTa,
      icon: catIcons[r.MaDanhMuc] || '💈',
      status: r.TrangThai
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(categories));
    return true;
  }

  // POST /api/categories - Thêm danh mục mới
  if (pathname === '/api/categories' && method === 'POST') {
    const body = parsedBody || {};
    const maxCat = await querySql(`SELECT TOP 1 MaDanhMuc FROM DanhMucSanPham ORDER BY LEN(MaDanhMuc) DESC, MaDanhMuc DESC`);
    let nextN = 5;
    if (maxCat && maxCat[0]) {
      const m = maxCat[0].MaDanhMuc.match(/DM(\d+)/i);
      if (m) nextN = parseInt(m[1], 10) + 1;
    }
    const dmId = (body.id || body.MaDanhMuc || ('DM' + (nextN < 10 ? '0' + nextN : nextN))).trim();
    const name = body.name || body.TenDanhMuc || 'Danh mục mới';
    const desc = body.description || body.MoTa || '';
    const status = body.status || body.TrangThai || 'Kinh doanh';

    await querySql(
      `INSERT INTO DanhMucSanPham (MaDanhMuc, TenDanhMuc, MoTa, TrangThai) VALUES (?, ?, ?, ?)`,
      [dmId, name, desc, status]
    );

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, category: { id: dmId, MaDanhMuc: dmId, name, description: desc, status } }));
    return true;
  }

  // PUT /api/categories/:id - Sửa danh mục
  if (pathname.startsWith('/api/categories/') && method === 'PUT') {
    const id = pathname.replace('/api/categories/', '').trim();
    const body = parsedBody || {};
    await querySql(
      `UPDATE DanhMucSanPham SET TenDanhMuc = COALESCE(?, TenDanhMuc), MoTa = COALESCE(?, MoTa), TrangThai = COALESCE(?, TrangThai) WHERE MaDanhMuc = ?`,
      [body.name || body.TenDanhMuc || null, body.description || body.MoTa || null, body.status || body.TrangThai || null, id]
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, categoryId: id }));
    return true;
  }

  // DELETE /api/categories/:id - Ngừng kinh doanh danh mục
  if (pathname.startsWith('/api/categories/') && method === 'DELETE') {
    const id = pathname.replace('/api/categories/', '').trim();
    await querySql(`UPDATE DanhMucSanPham SET TrangThai = N'Ngừng kinh doanh' WHERE MaDanhMuc = ?`, [id]);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã ngừng kinh doanh danh mục', categoryId: id }));
    return true;
  }

  return false;
}

module.exports = handleProductRoutes;
module.exports.handleProductRoutes = handleProductRoutes;
module.exports.default = handleProductRoutes;

