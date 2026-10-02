// =========================================================================
// OmniSalon — CORE DATA RE-SYNCHRONIZED (QL_SALONTOC / QL_SALON_2.sql)
// Ánh xạ 100% toàn bộ cơ sở dữ liệu: ChiNhanh, NhanVien, KhachHang, TaiKhoan,
// DichVu, DanhMucSanPham, SanPham, PhieuNhapKho, TonKho, KhuyenMai, vw_GiaBanTheoLoHienTai
// =========================================================================

const INITIAL_SALON_DATA = {
  // =========================================================================
  // 1. HỆ THỐNG CHI NHÁNH (Bảng ChiNhanh) - Khớp 100% QL_SALONTOC
  // =========================================================================
  branches: [
    {
      id: 'CN01',
      MaChiNhanh: 'CN01',
      TenChiNhanh: 'Salon Tóc Chi Nhánh 1 - Quận 1',
      name: 'Salon Tóc Chi Nhánh 1 - Quận 1',
      DiaChi: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      address: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      SoDienThoai: '0901111222',
      phone: '0901111222',
      GioMoCua: '08:30:00',
      GioDongCua: '21:30:00',
      hours: '08:30 - 21:30',
      TrangThai: 'Hoạt động',
      city: 'TP. HỒ CHÍ MINH',
      group: 'OMNI SALON FLAGSHIP',
      totalChairs: 18,
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
      manager: 'Trần Minh Hoàng (NV01)'
    },
    {
      id: 'CN02',
      MaChiNhanh: 'CN02',
      TenChiNhanh: 'Salon Tóc Chi Nhánh 2 - Tân Bình',
      name: 'Salon Tóc Chi Nhánh 2 - Tân Bình',
      DiaChi: '45 Cộng Hòa, Phường 4, Quận Tân Bình, TP.HCM',
      address: '45 Cộng Hòa, Phường 4, Quận Tân Bình, TP.HCM',
      SoDienThoai: '0903333444',
      phone: '0903333444',
      GioMoCua: '08:30:00',
      GioDongCua: '21:00:00',
      hours: '08:30 - 21:00',
      TrangThai: 'Hoạt động',
      city: 'TP. HỒ CHÍ MINH',
      group: 'OMNI SALON SUITE',
      totalChairs: 15,
      image: 'https://images.unsplash.com/photo-1517832606589-7157462939ac?auto=format&fit=crop&w=600&q=80',
      manager: 'Phạm Thu Thảo (NV04)'
    },
    {
      id: 'CN03',
      MaChiNhanh: 'CN03',
      TenChiNhanh: 'Salon Tóc Chi Nhánh 3 - Bình Thạnh',
      name: 'Salon Tóc Chi Nhánh 3 - Bình Thạnh',
      DiaChi: '88 Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM',
      address: '88 Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM',
      SoDienThoai: '0905555666',
      phone: '0905555666',
      GioMoCua: '09:00:00',
      GioDongCua: '22:00:00',
      hours: '09:00 - 22:00',
      TrangThai: 'Hoạt động',
      city: 'TP. HỒ CHÍ MINH',
      group: 'OMNI SALON SUITE',
      totalChairs: 16,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      manager: 'Võ Quốc Bảo (NV05)'
    }
  ],

  // =========================================================================
  // 2. NHÂN VIÊN & STYLISTS (Bảng NhanVien & DanhGia)
  // =========================================================================
  employees: [
    {
      MaNhanVien: 'NV01',
      MaChiNhanh: 'CN01',
      HoTen: 'Trần Minh Hoàng',
      SoDienThoai: '0912000001',
      Email: 'hoang.tm@salontoc.vn',
      CapBac: 'Quản lý',
      ChucVu: 'Quản lý chi nhánh',
      TrangThai: 'Đang làm việc'
    },
    {
      MaNhanVien: 'NV02',
      MaChiNhanh: 'CN01',
      HoTen: 'Lê Thị Hương',
      SoDienThoai: '0912000002',
      Email: 'huong.lt@salontoc.vn',
      CapBac: 'Senior Stylist',
      ChucVu: 'Thợ chính',
      TrangThai: 'Đang làm việc'
    },
    {
      MaNhanVien: 'NV03',
      MaChiNhanh: 'CN01',
      HoTen: 'Nguyễn Văn Nam',
      SoDienThoai: '0912000003',
      Email: 'nam.nv@salontoc.vn',
      CapBac: 'Junior Stylist',
      ChucVu: 'Thợ phụ',
      TrangThai: 'Đang làm việc'
    },
    {
      MaNhanVien: 'NV04',
      MaChiNhanh: 'CN02',
      HoTen: 'Phạm Thu Thảo',
      SoDienThoai: '0912000004',
      Email: 'thao.pt@salontoc.vn',
      CapBac: 'Senior Stylist',
      ChucVu: 'Thợ chính',
      TrangThai: 'Đang làm việc'
    },
    {
      MaNhanVien: 'NV05',
      MaChiNhanh: 'CN03',
      HoTen: 'Võ Quốc Bảo',
      SoDienThoai: '0912000005',
      Email: 'bao.vq@salontoc.vn',
      CapBac: 'Master Stylist',
      ChucVu: 'Thợ chính',
      TrangThai: 'Đang làm việc'
    }
  ],

  // Đội ngũ Stylists công khai (3 thợ tiêu biểu đưa lên Home: Hương, Bảo, Thảo)
  stylists: [
    {
      id: 'NV02',
      MaNhanVien: 'NV02',
      branchId: 'CN01',
      MaChiNhanh: 'CN01',
      name: 'Lê Thị Hương',
      HoTen: 'Lê Thị Hương',
      level: 'Senior Stylist',
      title: 'Senior Stylist & Thợ chính Chi Nhánh 1 (Quận 1)',
      role: 'Thợ chính',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      rating: 5.0,
      reviewCount: 520,
      reviewsCount: 520,
      specialty: 'Cắt tạo kiểu Layer nữ, Uốn phục hồi sóng lơi chuẩn Hàn & Nhuộm Balayage',
      specialties: ['Cắt Layer Nữ', 'Uốn Sóng Lơi', 'Nhuộm Balayage', 'Phục Hồi Olaplex'],
      experience: '8 năm kinh nghiệm',
      commissionRate: 0.15,
      isAvailable: true
    },
    {
      id: 'NV05',
      MaNhanVien: 'NV05',
      branchId: 'CN03',
      MaChiNhanh: 'CN03',
      name: 'Võ Quốc Bảo',
      HoTen: 'Võ Quốc Bảo',
      level: 'Master Stylist',
      title: 'Master Stylist & Art Director Chi Nhánh 3 (Bình Thạnh)',
      role: 'Thợ chính',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      rating: 5.0,
      reviewCount: 580,
      reviewsCount: 580,
      specialty: 'Fade nghệ thuật Châu Âu, Cắt tóc nam thời trang, Uốn Texture & Scissor Art',
      specialties: ['Cắt Tóc Nam', 'European Fade', 'Uốn Texture', 'Tạo Kiểu Pomade'],
      experience: '10 năm kinh nghiệm',
      commissionRate: 0.20,
      isAvailable: true
    },
    {
      id: 'NV04',
      MaNhanVien: 'NV04',
      branchId: 'CN02',
      MaChiNhanh: 'CN02',
      name: 'Phạm Thu Thảo',
      HoTen: 'Phạm Thu Thảo',
      level: 'Senior Stylist',
      title: 'Senior Stylist Chi Nhánh 2 (Tân Bình)',
      role: 'Thợ chính',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      rating: 5.0,
      reviewCount: 510,
      reviewsCount: 510,
      specialty: 'Nhuộm Ombre thời trang, Liệu trình phục hồi chuyên sâu Olaplex & Cắt bob',
      specialties: ['Nhuộm Ombre', 'Olaplex Chuyên Sâu', 'Tạo Kiểu Thời Trang'],
      experience: '7 năm kinh nghiệm',
      commissionRate: 0.15,
      isAvailable: true
    },
    {
      id: 'NV03',
      MaNhanVien: 'NV03',
      branchId: 'CN01',
      MaChiNhanh: 'CN01',
      name: 'Nguyễn Văn Nam',
      HoTen: 'Nguyễn Văn Nam',
      level: 'Junior Stylist',
      title: 'Junior Stylist & Thợ phụ Chi Nhánh 1',
      role: 'Thợ phụ',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      rating: 4.9,
      reviewCount: 240,
      reviewsCount: 240,
      specialty: 'Gội đầu dưỡng sinh, massage bấm huyệt và sấy vuốt phom sáp cao cấp',
      specialties: ['Gội Dưỡng Sinh', 'Massage Cổ Vai Gáy', 'Sấy Tạo Kiểu'],
      experience: '3 năm kinh nghiệm',
      commissionRate: 0.10,
      isAvailable: true
    }
  ],

  // =========================================================================
  // 3. KHÁCH HÀNG (Bảng KhachHang)
  // =========================================================================
  customers: [
    {
      MaKhachHang: 'KH01',
      HoTen: 'Ngô Văn Tuấn',
      SoDienThoai: '0988000001',
      Email: 'vantuan@omnisalon.vn',
      NgaySinh: '1998-05-14'
    },
    {
      MaKhachHang: 'KH02',
      HoTen: 'Trần Mỹ Linh',
      SoDienThoai: '0988000002',
      Email: 'mylinh.tran@omnisalon.vn',
      NgaySinh: '2001-11-20'
    },
    {
      MaKhachHang: 'KH03',
      HoTen: 'Đặng Thanh Tùng',
      SoDienThoai: '0988000003',
      Email: 'thanhtung.dang@omnisalon.vn',
      NgaySinh: '1995-03-08'
    },
    {
      MaKhachHang: 'KH04',
      HoTen: 'Vũ Phương Thảo',
      SoDienThoai: '0988000004',
      Email: 'phuongthao.vu@omnisalon.vn',
      NgaySinh: '2000-09-12'
    },
    {
      MaKhachHang: 'KH05',
      HoTen: 'Lê Minh Khôi',
      SoDienThoai: '0988000005',
      Email: 'minhkhoi.le@omnisalon.vn',
      NgaySinh: '1992-07-24'
    }
  ],

  // =========================================================================
  // 4. DANH MỤC DỊCH VỤ (Bảng DichVu) - Khớp 100% 5 Dịch Vụ Chuẩn
  // =========================================================================
  services: [
    {
      id: 'DV01',
      MaDichVu: 'DV01',
      TenDichVu: 'Cắt tóc nam thời trang',
      name: 'Cắt tóc nam thời trang',
      category: 'haircut',
      Gia: 120000,
      price: 120000,
      ThoiLuong: 45,
      duration: 45,
      MoTa: 'Bao gồm gội, massage và tạo kiểu bằng sáp cao cấp',
      description: 'Bao gồm gội, massage và tạo kiểu bằng sáp cao cấp',
      TrangThai: 'Kinh doanh',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 520
    },
    {
      id: 'DV02',
      MaDichVu: 'DV02',
      TenDichVu: 'Cắt & Tạo kiểu tóc nữ',
      name: 'Cắt & Tạo kiểu tóc nữ',
      category: 'haircut',
      Gia: 250000,
      price: 250000,
      ThoiLuong: 60,
      duration: 60,
      MoTa: 'Tư vấn kiểu tóc hợp khuôn mặt, tỉa layer chuẩn form',
      description: 'Tư vấn kiểu tóc hợp khuôn mặt, tỉa layer chuẩn form',
      TrangThai: 'Kinh doanh',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 460
    },
    {
      id: 'DV03',
      MaDichVu: 'DV03',
      TenDichVu: 'Uốn tóc phục hồi sóng lơi',
      name: 'Uốn tóc phục hồi sóng lơi',
      category: 'perm',
      Gia: 650000,
      price: 650000,
      originalPrice: 650000,
      discountPrice: 600000,
      promotionApplied: 'KM01',
      promotionNote: 'Áp dụng mã KM01 giảm ngay 50.000đ',
      ThoiLuong: 120,
      duration: 120,
      MoTa: 'Sử dụng thuốc uốn hữu cơ không khô xơ, tặng hấp collagen (Có áp dụng KM01 giảm 50.000đ)',
      description: 'Sử dụng thuốc uốn hữu cơ không khô xơ, tặng hấp collagen (Có áp dụng KM01 giảm 50.000đ)',
      TrangThai: 'Kinh doanh',
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      rating: 4.98,
      reviewsCount: 380
    },
    {
      id: 'DV04',
      MaDichVu: 'DV04',
      TenDichVu: 'Nhuộm màu thời trang Balayage/Ombre',
      name: 'Nhuộm màu thời trang Balayage/Ombre',
      category: 'color',
      Gia: 950000,
      price: 950000,
      originalPrice: 950000,
      discountPrice: 900000,
      promotionApplied: 'KM01',
      promotionNote: 'Áp dụng mã KM01 giảm ngay 50.000đ',
      ThoiLuong: 150,
      duration: 150,
      MoTa: 'Kỹ thuật phối màu chuẩn Tây kèm khử ánh sắc (Có áp dụng KM01 giảm 50.000đ)',
      description: 'Kỹ thuật phối màu chuẩn Tây kèm khử ánh sắc (Có áp dụng KM01 giảm 50.000đ)',
      TrangThai: 'Kinh doanh',
      image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80',
      rating: 4.95,
      reviewsCount: 310
    },
    {
      id: 'DV05',
      MaDichVu: 'DV05',
      TenDichVu: 'Liệu trình phục hồi Olaplex chuyên sâu',
      name: 'Liệu trình phục hồi Olaplex chuyên sâu',
      category: 'spa',
      Gia: 800000,
      price: 800000,
      originalPrice: 800000,
      discountPrice: 700000,
      promotionApplied: 'KM02',
      promotionNote: 'Áp dụng mã KM02 giảm ngay 100.000đ',
      ThoiLuong: 90,
      duration: 90,
      MoTa: 'Phục hồi cấp tốc 5 bước cho tóc nát, tóc xơ tẩy (Có áp dụng KM02 giảm 100.000đ)',
      description: 'Phục hồi cấp tốc 5 bước cho tóc nát, tóc xơ tẩy (Có áp dụng KM02 giảm 100.000đ)',
      TrangThai: 'Kinh doanh',
      image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 420
    }
  ],

  // Combos gói cao cấp kế thừa dịch vụ chuẩn
  combos: [
    {
      id: 'cmb-1',
      name: 'COMBO OMNI SIGNATURE SUITE (Cắt Nam + Gội Spa + Tạo Kiểu Sáp)',
      category: 'combo',
      type: 'combo',
      price: 390000,
      originalPrice: 520000,
      oldPrice: 520000,
      duration: 70,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      description: 'Trọn gói cắt phom tóc thiết kế, gội thư giãn bấm huyệt kinh lạc và tạo kiểu sáp chuẩn salon.',
      rating: 5.0,
      reviewsCount: 780
    },
    {
      id: 'cmb-2',
      name: 'COMBO ĐẾ VƯƠNG (Cắt + Uốn Sóng Lơi + Phục Hồi Olaplex)',
      category: 'combo',
      type: 'combo',
      price: 1350000,
      originalPrice: 1700000,
      oldPrice: 1700000,
      duration: 180,
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      description: 'Combo hoàn hảo cho mái tóc hư tổn: Cắt layer chuẩn form + Uốn sóng lơi hữu cơ + Liệu trình phục hồi Olaplex 5 bước.',
      rating: 5.0,
      reviewsCount: 430
    }
  ],

  // =========================================================================
  // 5. DANH MỤC SẢN PHẨM (Bảng DanhMucSanPham: DM01 -> DM06)
  // =========================================================================
  categories: [
    { id: 'DM01', MaDanhMuc: 'DM01', TenDanhMuc: 'Dầu gội & Dầu xả', name: 'Dầu gội & Dầu xả', MoTa: 'Chăm sóc làm sạch sâu và cấp ẩm da đầu' },
    { id: 'DM02', MaDanhMuc: 'DM02', TenDanhMuc: 'Tinh dầu & Dưỡng tóc', name: 'Tinh dầu & Dưỡng tóc', MoTa: 'Serum, tinh dầu phục hồi và chống nhiệt' },
    { id: 'DM03', MaDanhMuc: 'DM03', TenDanhMuc: 'Kem ủ & Mặt nạ tóc', name: 'Kem ủ & Mặt nạ tóc', MoTa: 'Phục hồi hư tổn tóc xơ rối do hóa chất' },
    { id: 'DM04', MaDanhMuc: 'DM04', TenDanhMuc: 'Sáp vuốt tóc & Pomade', name: 'Sáp vuốt tóc & Pomade', MoTa: 'Tạo kiểu giữ nếp tóc nam' },
    { id: 'DM05', MaDanhMuc: 'DM05', TenDanhMuc: 'Xịt giữ nếp & Gôm xịt tóc', name: 'Xịt giữ nếp & Gôm xịt tóc', MoTa: 'Tạo kiểu định hình tóc thời trang' },
    { id: 'DM06', MaDanhMuc: 'DM06', TenDanhMuc: 'Nhuộm & Tẩy tóc chuyên nghiệp', name: 'Nhuộm & Tẩy tóc chuyên nghiệp', MoTa: 'Màu nhuộm thời trang cao cấp' }
  ],

  // =========================================================================
  // 6. NHÀ CUNG CẤP (Bảng NhaCungCap)
  // =========================================================================
  suppliers: [
    { MaNhaCungCap: 'NCC01', TenNhaCungCap: 'Công ty TNHH Phân Phối Mỹ Phẩm L’Oréal VN', SoDienThoai: '02838221199', Email: 'contact@loreal.vn', DiaChi: 'Tầng 10, Bitexco, Q.1, TP.HCM' },
    { MaNhaCungCap: 'NCC02', TenNhaCungCap: 'Moroccanoil Việt Nam', SoDienThoai: '02839102233', Email: 'support@moroccanoil.vn', DiaChi: '26 Nguyễn Thị Minh Khai, Q.1, TP.HCM' },
    { MaNhaCungCap: 'NCC03', TenNhaCungCap: 'Davines International VN', SoDienThoai: '02839445566', Email: 'orders@davines.vn', DiaChi: '15 Lê Duẩn, Q.1, TP.HCM' },
    { MaNhaCungCap: 'NCC04', TenNhaCungCap: 'Olaplex Global Distribution', SoDienThoai: '02838997788', Email: 'supply@olaplex.vn', DiaChi: '72 Lê Thánh Tôn, Q.1, TP.HCM' }
  ],

  // =========================================================================
  // 7. SẢN PHẨM & GIÁ BÁN THEO LÔ CẬN HẠN (SanPham + vw_GiaBanTheoLoHienTai)
  // 20 sản phẩm mỹ phẩm từ database (L’Oréal, Olaplex, Moroccanoil, Davines, Volcanic Clay...)
  // =========================================================================
  products: [
    {
      id: 'SP01',
      MaSanPham: 'SP01',
      MaDanhMuc: 'DM01',
      categoryId: 'DM01',
      MaNhaCungCap: 'NCC01',
      TenSanPham: 'Dầu gội L’Oréal Professionnel Absolut Repair 500ml',
      name: 'Dầu gội L’Oréal Professionnel Absolut Repair 500ml',
      brand: 'L’Oréal Professionnel',
      GiaNhap: 360000,
      GiaBan: 480000,
      GiaNiemYetGoc: 480000,
      price: 288000, // Giá bán thực tế theo lô cận hạn
      originalPrice: 480000,
      GiaBanThucTe: 288000,
      PhanTramGiam: 40,
      badge: 'Cận Hạn - Giảm 40%',
      isNearExpiry: true,
      batchCode: 'LO2608A1',
      batchExpiry: '2026-11-15',
      daysRemaining: 45,
      batchRemaining: 15,
      MoTa: 'Phục hồi tóc hư tổn nặng với Protein diêm mạch vàng (Lô CTPN01 cận hạn <45 ngày giảm 40%)',
      description: 'Phục hồi tóc hư tổn nặng với Protein diêm mạch vàng (Lô CTPN01 cận hạn <45 ngày giảm 40%)',
      HinhAnh: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600',
      image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.9
    },
    {
      id: 'SP02',
      MaSanPham: 'SP02',
      MaDanhMuc: 'DM01',
      categoryId: 'DM01',
      MaNhaCungCap: 'NCC01',
      TenSanPham: 'Dầu xả L’Oréal Absolut Repair Gold Conditioner 500ml',
      name: 'Dầu xả L’Oréal Absolut Repair Gold Conditioner 500ml',
      brand: 'L’Oréal Professionnel',
      GiaNhap: 380000,
      GiaBan: 510000,
      GiaNiemYetGoc: 510000,
      price: 510000,
      GiaBanThucTe: 510000,
      PhanTramGiam: 0,
      batchCode: 'LO2608A2',
      batchExpiry: '2027-08-01',
      MoTa: 'Cung cấp độ bóng mượt vượt trội mà không làm nặng tóc',
      description: 'Cung cấp độ bóng mượt vượt trội mà không làm nặng tóc',
      HinhAnh: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.9
    },
    {
      id: 'SP03',
      MaSanPham: 'SP03',
      MaDanhMuc: 'DM01',
      categoryId: 'DM01',
      MaNhaCungCap: 'NCC03',
      TenSanPham: 'Dầu gội Davines Naturaltech Purifying Anti-Dandruff 250ml',
      name: 'Dầu gội Davines Naturaltech Purifying Anti-Dandruff 250ml',
      brand: 'Davines',
      GiaNhap: 290000,
      GiaBan: 395000,
      GiaNiemYetGoc: 395000,
      price: 395000,
      GiaBanThucTe: 395000,
      PhanTramGiam: 0,
      MoTa: 'Dầu gội đặc trị gàu và cân bằng tuyến dầu da đầu',
      description: 'Dầu gội đặc trị gàu và cân bằng tuyến dầu da đầu',
      HinhAnh: 'https://images.unsplash.com/photo-1608248597359-597546e9dfd0?w=600',
      image: 'https://images.unsplash.com/photo-1608248597359-597546e9dfd0?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.85
    },
    {
      id: 'SP04',
      MaSanPham: 'SP04',
      MaDanhMuc: 'DM01',
      categoryId: 'DM01',
      MaNhaCungCap: 'NCC04',
      TenSanPham: 'Dầu gội phục hồi liên kết tóc Olaplex No.4 Bond Maintenance 250ml',
      name: 'Dầu gội phục hồi liên kết tóc Olaplex No.4 Bond Maintenance 250ml',
      brand: 'Olaplex',
      GiaNhap: 520000,
      GiaBan: 690000,
      GiaNiemYetGoc: 690000,
      price: 552000, // Lô CTPN04 (<110 ngày: giảm 20%)
      originalPrice: 690000,
      GiaBanThucTe: 552000,
      PhanTramGiam: 20,
      badge: 'Giảm 20%',
      isNearExpiry: true,
      batchCode: 'LO2608B1',
      batchExpiry: '2027-01-20',
      daysRemaining: 110,
      batchRemaining: 10,
      MoTa: 'Tái tạo cấu trúc tóc yếu, dễ gãy rụng do uốn nhuộm (Lô CTPN04 hạn <110 ngày giảm 20%)',
      description: 'Tái tạo cấu trúc tóc yếu, dễ gãy rụng do uốn nhuộm (Lô CTPN04 hạn <110 ngày giảm 20%)',
      HinhAnh: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 5.0
    },
    {
      id: 'SP05',
      MaSanPham: 'SP05',
      MaDanhMuc: 'DM01',
      categoryId: 'DM01',
      MaNhaCungCap: 'NCC04',
      TenSanPham: 'Dầu xả Olaplex No.5 Bond Maintenance Conditioner 250ml',
      name: 'Dầu xả Olaplex No.5 Bond Maintenance Conditioner 250ml',
      brand: 'Olaplex',
      GiaNhap: 520000,
      GiaBan: 690000,
      GiaNiemYetGoc: 690000,
      price: 690000,
      GiaBanThucTe: 690000,
      PhanTramGiam: 0,
      MoTa: 'Cấp ẩm chuyên sâu và bảo vệ biểu bì tóc chắc khỏe',
      description: 'Cấp ẩm chuyên sâu và bảo vệ biểu bì tóc chắc khỏe',
      HinhAnh: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
      image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.95
    },
    {
      id: 'SP06',
      MaSanPham: 'SP06',
      MaDanhMuc: 'DM02',
      categoryId: 'DM02',
      MaNhaCungCap: 'NCC02',
      TenSanPham: 'Tinh dầu dưỡng tóc Moroccanoil Treatment Original 100ml',
      name: 'Tinh dầu dưỡng tóc Moroccanoil Treatment Original 100ml',
      brand: 'Moroccanoil',
      GiaNhap: 650000,
      GiaBan: 890000,
      GiaNiemYetGoc: 890000,
      price: 890000,
      GiaBanThucTe: 890000,
      PhanTramGiam: 0,
      MoTa: 'Tinh chất dầu Argan tự nhiên nuôi dưỡng ngọn tóc suôn mềm',
      description: 'Tinh chất dầu Argan tự nhiên nuôi dưỡng ngọn tóc suôn mềm',
      HinhAnh: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600',
      image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 5.0
    },
    {
      id: 'SP07',
      MaSanPham: 'SP07',
      MaDanhMuc: 'DM02',
      categoryId: 'DM02',
      MaNhaCungCap: 'NCC02',
      TenSanPham: 'Tinh dầu Moroccanoil Light Treatment 100ml',
      name: 'Tinh dầu Moroccanoil Light Treatment 100ml',
      brand: 'Moroccanoil',
      GiaNhap: 650000,
      GiaBan: 890000,
      GiaNiemYetGoc: 890000,
      price: 890000,
      GiaBanThucTe: 890000,
      PhanTramGiam: 0,
      MoTa: 'Công thức chuyên biệt dành cho tóc tẩy, mỏng và sáng màu',
      description: 'Công thức chuyên biệt dành cho tóc tẩy, mỏng và sáng màu',
      HinhAnh: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.9
    },
    {
      id: 'SP08',
      MaSanPham: 'SP08',
      MaDanhMuc: 'DM02',
      categoryId: 'DM02',
      MaNhaCungCap: 'NCC04',
      TenSanPham: 'Dầu dưỡng tái tạo tóc Olaplex No.7 Bonding Oil 30ml',
      name: 'Dầu dưỡng tái tạo tóc Olaplex No.7 Bonding Oil 30ml',
      brand: 'Olaplex',
      GiaNhap: 490000,
      GiaBan: 670000,
      GiaNiemYetGoc: 670000,
      price: 670000,
      GiaBanThucTe: 670000,
      PhanTramGiam: 0,
      MoTa: 'Bảo vệ tóc trước nhiệt độ cao tới 230 độ C và tia UV',
      description: 'Bảo vệ tóc trước nhiệt độ cao tới 230 độ C và tia UV',
      HinhAnh: 'https://images.unsplash.com/photo-1608248597359-597546e9dfd0?w=600',
      image: 'https://images.unsplash.com/photo-1608248597359-597546e9dfd0?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.95
    },
    {
      id: 'SP09',
      MaSanPham: 'SP09',
      MaDanhMuc: 'DM02',
      categoryId: 'DM02',
      MaNhaCungCap: 'NCC01',
      TenSanPham: 'Serum dưỡng tóc L’Oréal Mythic Oil Huile Originale 100ml',
      name: 'Serum dưỡng tóc L’Oréal Mythic Oil Huile Originale 100ml',
      brand: 'L’Oréal Professionnel',
      GiaNhap: 320000,
      GiaBan: 440000,
      GiaNiemYetGoc: 440000,
      price: 440000,
      GiaBanThucTe: 440000,
      PhanTramGiam: 0,
      MoTa: 'Chiết xuất dầu bơ và hạt nho tăng cường độ đàn hồi',
      description: 'Chiết xuất dầu bơ và hạt nho tăng cường độ đàn hồi',
      HinhAnh: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600',
      image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.88
    },
    {
      id: 'SP10',
      MaSanPham: 'SP10',
      MaDanhMuc: 'DM03',
      categoryId: 'DM03',
      MaNhaCungCap: 'NCC04',
      TenSanPham: 'Kem ủ tái kết nối Olaplex No.3 Hair Perfector 100ml',
      name: 'Kem ủ tái kết nối Olaplex No.3 Hair Perfector 100ml',
      brand: 'Olaplex',
      GiaNhap: 520000,
      GiaBan: 690000,
      GiaNiemYetGoc: 690000,
      price: 690000,
      GiaBanThucTe: 690000,
      PhanTramGiam: 0,
      MoTa: 'Sản phẩm điều trị cấu trúc phân tử tóc bán chạy nhất thế giới',
      description: 'Sản phẩm điều trị cấu trúc phân tử tóc bán chạy nhất thế giới',
      HinhAnh: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 5.0
    },
    {
      id: 'SP11',
      MaSanPham: 'SP11',
      MaDanhMuc: 'DM03',
      categoryId: 'DM03',
      MaNhaCungCap: 'NCC02',
      TenSanPham: 'Mặt nạ tóc Moroccanoil Intense Hydrating Mask 250ml',
      name: 'Mặt nạ tóc Moroccanoil Intense Hydrating Mask 250ml',
      brand: 'Moroccanoil',
      GiaNhap: 580000,
      GiaBan: 780000,
      GiaNiemYetGoc: 780000,
      price: 780000,
      GiaBanThucTe: 780000,
      PhanTramGiam: 0,
      MoTa: 'Ủ tóc dưỡng ẩm sâu cho tóc xoăn lọn và tóc khô ráp',
      description: 'Ủ tóc dưỡng ẩm sâu cho tóc xoăn lọn và tóc khô ráp',
      HinhAnh: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.92
    },
    {
      id: 'SP12',
      MaSanPham: 'SP12',
      MaDanhMuc: 'DM03',
      categoryId: 'DM03',
      MaNhaCungCap: 'NCC03',
      TenSanPham: 'Mặt nạ Davines The Renaissance Circle 250ml',
      name: 'Mặt nạ Davines The Renaissance Circle 250ml',
      brand: 'Davines',
      GiaNhap: 380000,
      GiaBan: 520000,
      GiaNiemYetGoc: 520000,
      price: 520000,
      GiaBanThucTe: 520000,
      PhanTramGiam: 0,
      MoTa: 'Mặt nạ phục hồi kỳ diệu cho tóc hư tổn do xử lý nhiệt',
      description: 'Mặt nạ phục hồi kỳ diệu cho tóc hư tổn do xử lý nhiệt',
      HinhAnh: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
      image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.87
    },
    {
      id: 'SP13',
      MaSanPham: 'SP13',
      MaDanhMuc: 'DM04',
      categoryId: 'DM04',
      MaNhaCungCap: 'NCC01',
      TenSanPham: 'Sáp vuốt tóc nam L’Oréal Homme Clay Strong Hold 50ml',
      name: 'Sáp vuốt tóc nam L’Oréal Homme Clay Strong Hold 50ml',
      brand: 'L’Oréal Professionnel',
      GiaNhap: 210000,
      GiaBan: 310000,
      GiaNiemYetGoc: 310000,
      price: 310000,
      GiaBanThucTe: 310000,
      PhanTramGiam: 0,
      MoTa: 'Độ giữ nếp cực cao, hoàn thiện mờ tự nhiên không bóng',
      description: 'Độ giữ nếp cực cao, hoàn thiện mờ tự nhiên không bóng',
      HinhAnh: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.91
    },
    {
      id: 'SP14',
      MaSanPham: 'SP14',
      MaDanhMuc: 'DM04',
      categoryId: 'DM04',
      MaNhaCungCap: 'NCC01',
      TenSanPham: 'Sáp vuốt tóc Volcanic Clay Version V5 80ml',
      name: 'Sáp vuốt tóc Volcanic Clay Version V5 80ml',
      brand: 'Volcanic Clay',
      GiaNhap: 230000,
      GiaBan: 340000,
      GiaNiemYetGoc: 340000,
      price: 340000,
      GiaBanThucTe: 340000,
      PhanTramGiam: 0,
      MoTa: 'Giữ nếp trên 14 tiếng, hút dầu thừa tốt cho khí hậu nóng ẩm',
      description: 'Giữ nếp trên 14 tiếng, hút dầu thừa tốt cho khí hậu nóng ẩm',
      HinhAnh: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600',
      image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.96
    },
    {
      id: 'SP15',
      MaSanPham: 'SP15',
      MaDanhMuc: 'DM04',
      categoryId: 'DM04',
      MaNhaCungCap: 'NCC02',
      TenSanPham: 'Pomade tạo kiểu Moroccanoil Styling Clay 75ml',
      name: 'Pomade tạo kiểu Moroccanoil Styling Clay 75ml',
      brand: 'Moroccanoil',
      GiaNhap: 390000,
      GiaBan: 540000,
      GiaNiemYetGoc: 540000,
      price: 540000,
      GiaBanThucTe: 540000,
      PhanTramGiam: 0,
      MoTa: 'Tạo kiểu linh hoạt, dễ gội rửa với thành phần dầu Argan tự nhiên',
      description: 'Tạo kiểu linh hoạt, dễ gội rửa với thành phần dầu Argan tự nhiên',
      HinhAnh: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600',
      image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.93
    },
    {
      id: 'SP16',
      MaSanPham: 'SP16',
      MaDanhMuc: 'DM05',
      categoryId: 'DM05',
      MaNhaCungCap: 'NCC01',
      TenSanPham: 'Gôm xịt tóc L’Oréal Infinium Pure Strong 500ml',
      name: 'Gôm xịt tóc L’Oréal Infinium Pure Strong 500ml',
      brand: 'L’Oréal Professionnel',
      GiaNhap: 250000,
      GiaBan: 360000,
      GiaNiemYetGoc: 360000,
      price: 360000,
      GiaBanThucTe: 360000,
      PhanTramGiam: 0,
      MoTa: 'Keo xịt giữ nếp chuẩn salon, khô tức thì, không để lại bụi trắng',
      description: 'Keo xịt giữ nếp chuẩn salon, khô tức thì, không để lại bụi trắng',
      HinhAnh: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600',
      image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.9
    },
    {
      id: 'SP17',
      MaSanPham: 'SP17',
      MaDanhMuc: 'DM05',
      categoryId: 'DM05',
      MaNhaCungCap: 'NCC02',
      TenSanPham: 'Xịt bóng Moroccanoil Glimmer Shine Spray 100ml',
      name: 'Xịt bóng Moroccanoil Glimmer Shine Spray 100ml',
      brand: 'Moroccanoil',
      GiaNhap: 430000,
      GiaBan: 590000,
      GiaNiemYetGoc: 590000,
      price: 590000,
      GiaBanThucTe: 590000,
      PhanTramGiam: 0,
      MoTa: 'Lớp phủ hoàn thiện tạo hiệu ứng bắt sáng rạng rỡ cho tóc',
      description: 'Lớp phủ hoàn thiện tạo hiệu ứng bắt sáng rạng rỡ cho tóc',
      HinhAnh: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.9
    },
    {
      id: 'SP18',
      MaSanPham: 'SP18',
      MaDanhMuc: 'DM06',
      categoryId: 'DM06',
      MaNhaCungCap: 'NCC01',
      TenSanPham: 'Kem nhuộm tóc L’Oréal Majirel Cool Cover 50ml',
      name: 'Kem nhuộm tóc L’Oréal Majirel Cool Cover 50ml',
      brand: 'L’Oréal Professionnel',
      GiaNhap: 160000,
      GiaBan: 240000,
      GiaNiemYetGoc: 240000,
      price: 240000,
      GiaBanThucTe: 240000,
      PhanTramGiam: 0,
      MoTa: 'Màu nhuộm phủ bạc và ánh sắc lạnh bền lâu không hại sợi tóc',
      description: 'Màu nhuộm phủ bạc và ánh sắc lạnh bền lâu không hại sợi tóc',
      HinhAnh: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.88
    },
    {
      id: 'SP19',
      MaSanPham: 'SP19',
      MaDanhMuc: 'DM06',
      categoryId: 'DM06',
      MaNhaCungCap: 'NCC01',
      TenSanPham: 'Bột tẩy tóc L’Oréal Blond Studio 9 Levels 500g',
      name: 'Bột tẩy tóc L’Oréal Blond Studio 9 Levels 500g',
      brand: 'L’Oréal Professionnel',
      GiaNhap: 580000,
      GiaBan: 790000,
      GiaNiemYetGoc: 790000,
      price: 790000,
      GiaBanThucTe: 790000,
      PhanTramGiam: 0,
      MoTa: 'Bột tẩy nâng sáng lên đến 9 tông nhẹ dịu với da đầu',
      description: 'Bột tẩy nâng sáng lên đến 9 tông nhẹ dịu với da đầu',
      HinhAnh: 'https://images.unsplash.com/photo-1585232351009-aa87416fca90?w=600',
      image: 'https://images.unsplash.com/photo-1585232351009-aa87416fca90?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.94
    },
    {
      id: 'SP20',
      MaSanPham: 'SP20',
      MaDanhMuc: 'DM06',
      categoryId: 'DM06',
      MaNhaCungCap: 'NCC03',
      TenSanPham: 'Màu nhuộm tóc Davines Mask with Vibrachrom 100ml',
      name: 'Màu nhuộm tóc Davines Mask with Vibrachrom 100ml',
      brand: 'Davines',
      GiaNhap: 180000,
      GiaBan: 270000,
      GiaNiemYetGoc: 270000,
      price: 270000,
      GiaBanThucTe: 270000,
      PhanTramGiam: 0,
      MoTa: 'Màu nhuộm hữu cơ chứa tinh dầu hạt diêm mạch bảo vệ sợi tóc',
      description: 'Màu nhuộm hữu cơ chứa tinh dầu hạt diêm mạch bảo vệ sợi tóc',
      HinhAnh: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600',
      image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 4.91
    },
    {
      id: 'SP21',
      MaSanPham: 'SP21',
      MaDanhMuc: 'DM06',
      categoryId: 'DM06',
      MaNhaCungCap: 'NCC01',
      TenSanPham: 'Khăn choàng cắt tóc Omni Barber Cape Luxury',
      name: 'Khăn choàng cắt tóc Omni Barber Cape Luxury',
      brand: 'OMNI APPAREL & ACCESSORIES',
      GiaNhap: 150000,
      GiaBan: 250000,
      GiaNiemYetGoc: 250000,
      price: 250000,
      GiaBanThucTe: 250000,
      PhanTramGiam: 0,
      MoTa: 'Khăn choàng vải trượt nước cao cấp phụ kiện salon độc quyền Omni Salon',
      description: 'Khăn choàng vải trượt nước cao cấp phụ kiện salon độc quyền Omni Salon',
      HinhAnh: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600',
      TrangThaiKinhDoanh: 'Đang bán',
      rating: 5.0
    }
  ],

  // =========================================================================
  // 8. PHIẾU NHẬP KHO & CHI TIẾT PHIẾU NHẬP (PhieuNhapKho, ChiTietPhieuNhap)
  // =========================================================================
  purchaseOrders: [
    { MaPhieuNhap: 'PN01', MaNhanVien: 'NV01', MaNguoiDuyet: 'NV01', MaNhaCungCap: 'NCC01', MaChiNhanh: 'CN01', NgayLap: '2026-08-10', TongTien: 15000000, NgayDuyet: '2026-08-11', TrangThai: 'Đã duyệt' },
    { MaPhieuNhap: 'PN02', MaNhanVien: 'NV01', MaNguoiDuyet: 'NV01', MaNhaCungCap: 'NCC04', MaChiNhanh: 'CN01', NgayLap: '2026-08-20', TongTien: 15300000, NgayDuyet: '2026-08-21', TrangThai: 'Đã duyệt' },
    { MaPhieuNhap: 'PN03', MaNhanVien: 'NV01', MaNguoiDuyet: 'NV01', MaNhaCungCap: 'NCC02', MaChiNhanh: 'CN01', NgayLap: '2026-09-01', TongTien: 13000000, NgayDuyet: '2026-09-02', TrangThai: 'Đã duyệt' }
  ],

  purchaseOrderDetails: [
    { MaChiTietPhieuNhap: 'CTPN01', MaPhieuNhap: 'PN01', MaSanPham: 'SP01', SoLo: 'LO2608A1', HanSuDung: '2026-11-15', SoLuong: 20, SoLuongConLai: 15, DonGiaNhap: 360000, ThanhTien: 7200000, note: 'Lô cận hạn <45 ngày giảm 40%' },
    { MaChiTietPhieuNhap: 'CTPN02', MaPhieuNhap: 'PN01', MaSanPham: 'SP02', SoLo: 'LO2608A2', HanSuDung: '2027-08-01', SoLuong: 15, SoLuongConLai: 12, DonGiaNhap: 380000, ThanhTien: 5700000 },
    { MaChiTietPhieuNhap: 'CTPN03', MaPhieuNhap: 'PN01', MaSanPham: 'SP13', SoLo: 'LO2608A3', HanSuDung: '2027-10-20', SoLuong: 10, SoLuongConLai: 8, DonGiaNhap: 210000, ThanhTien: 2100000 },
    { MaChiTietPhieuNhap: 'CTPN04', MaPhieuNhap: 'PN02', MaSanPham: 'SP04', SoLo: 'LO2608B1', HanSuDung: '2027-01-20', SoLuong: 15, SoLuongConLai: 10, DonGiaNhap: 520000, ThanhTien: 7800000, note: 'Lô cận hạn <110 ngày giảm 20%' },
    { MaChiTietPhieuNhap: 'CTPN05', MaPhieuNhap: 'PN02', MaSanPham: 'SP08', SoLo: 'LO2608B2', HanSuDung: '2027-12-30', SoLuong: 10, SoLuongConLai: 8, DonGiaNhap: 490000, ThanhTien: 4900000 },
    { MaChiTietPhieuNhap: 'CTPN06', MaPhieuNhap: 'PN02', MaSanPham: 'SP10', SoLo: 'LO2608B3', HanSuDung: '2027-12-30', SoLuong: 5, SoLuongConLai: 4, DonGiaNhap: 520000, ThanhTien: 2600000 },
    { MaChiTietPhieuNhap: 'CTPN07', MaPhieuNhap: 'PN03', MaSanPham: 'SP06', SoLo: 'LO2609C1', HanSuDung: '2028-02-15', SoLuong: 20, SoLuongConLai: 18, DonGiaNhap: 650000, ThanhTien: 13000000 }
  ],

  // =========================================================================
  // 9. QUY TẮC GIẢM GIÁ THEO HẠN (Bảng QuyTacGiamGiaTheoHan)
  // =========================================================================
  discountRules: [
    { MaQuyTac: 'QT01', TenQuyTac: 'Còn trên 4 tháng (Hạn tiêu chuẩn)', SoNgayConLaiToiThieu: 121, SoNgayConLaiToiDa: 9999, PhanTramGiam: 0.00, TrangThai: 'Đang áp dụng' },
    { MaQuyTac: 'QT02', TenQuyTac: 'Còn 2 đến 4 tháng (Giảm nhẹ giải phóng kho)', SoNgayConLaiToiThieu: 61, SoNgayConLaiToiDa: 120, PhanTramGiam: 20.00, TrangThai: 'Đang áp dụng' },
    { MaQuyTac: 'QT03', TenQuyTac: 'Còn 1 đến 2 tháng (Cận hạn sâu)', SoNgayConLaiToiThieu: 31, SoNgayConLaiToiDa: 60, PhanTramGiam: 40.00, TrangThai: 'Đang áp dụng' },
    { MaQuyTac: 'QT04', TenQuyTac: 'Còn dưới 1 tháng (Cận hạn gấp)', SoNgayConLaiToiThieu: 1, SoNgayConLaiToiDa: 30, PhanTramGiam: 70.00, TrangThai: 'Đang áp dụng' },
    { MaQuyTac: 'QT05', TenQuyTac: 'Đã hết hạn (Thu hồi tiêu hủy)', SoNgayConLaiToiThieu: -9999, SoNgayConLaiToiDa: 0, PhanTramGiam: 100.00, TrangThai: 'Đang áp dụng' }
  ],

  // =========================================================================
  // 10. TỒN KHO THEO CHI NHÁNH (Bảng TonKho)
  // =========================================================================
  inventory: [
    { id: 'TK_SP01_CN01', MaTonKho: 'TK_SP01_CN01', productId: 'SP01', MaSanPham: 'SP01', branchId: 'CN01', MaChiNhanh: 'CN01', stock: 15, SoLuongTon: 15, minAlert: 5, MucCanhBao: 5 },
    { id: 'TK_SP02_CN01', MaTonKho: 'TK_SP02_CN01', productId: 'SP02', MaSanPham: 'SP02', branchId: 'CN01', MaChiNhanh: 'CN01', stock: 12, SoLuongTon: 12, minAlert: 5, MucCanhBao: 5 },
    { id: 'TK_SP04_CN01', MaTonKho: 'TK_SP04_CN01', productId: 'SP04', MaSanPham: 'SP04', branchId: 'CN01', MaChiNhanh: 'CN01', stock: 10, SoLuongTon: 10, minAlert: 5, MucCanhBao: 5 },
    { id: 'TK_SP06_CN01', MaTonKho: 'TK_SP06_CN01', productId: 'SP06', MaSanPham: 'SP06', branchId: 'CN01', MaChiNhanh: 'CN01', stock: 18, SoLuongTon: 18, minAlert: 5, MucCanhBao: 5 },
    { id: 'TK_SP13_CN01', MaTonKho: 'TK_SP13_CN01', productId: 'SP13', MaSanPham: 'SP13', branchId: 'CN01', MaChiNhanh: 'CN01', stock: 8, SoLuongTon: 8, minAlert: 5, MucCanhBao: 5 },
    { id: 'TK_SP14_CN02', MaTonKho: 'TK_SP14_CN02', productId: 'SP14', MaSanPham: 'SP14', branchId: 'CN02', MaChiNhanh: 'CN02', stock: 20, SoLuongTon: 20, minAlert: 5, MucCanhBao: 5 },
    { id: 'TK_SP15_CN03', MaTonKho: 'TK_SP15_CN03', productId: 'SP15', MaSanPham: 'SP15', branchId: 'CN03', MaChiNhanh: 'CN03', stock: 14, SoLuongTon: 14, minAlert: 5, MucCanhBao: 5 }
  ],

  // =========================================================================
  // 11. KHUYẾN MÃI (Bảng KhuyenMai, KhuyenMai_DichVu, KhuyenMai_SanPham)
  // =========================================================================
  promotions: [
    {
      id: 'KM01',
      MaKhuyenMai: 'KM01',
      code: 'KM01',
      TenKhuyenMai: 'Ưu đãi Khai Trương Mùa Cắt Tóc',
      HinhThuc: 'TienMat',
      discountType: 'fixed',
      GiaTriGiam: 50000,
      discountValue: 50000,
      DoiTuongApDung: 'DichVu',
      NgayBatDau: '2026-09-01',
      NgayKetThuc: '2026-12-31',
      expiry: '2026-12-31',
      TrangThai: 'Hoạt động',
      description: 'Giảm ngay 50.000đ khi đặt lịch Uốn sóng lơi (DV03) hoặc Nhuộm Balayage (DV04)'
    },
    {
      id: 'KM02',
      MaKhuyenMai: 'KM02',
      code: 'KM02',
      TenKhuyenMai: 'Tri Ân Khách Hàng - Phục Hồi Olaplex',
      HinhThuc: 'TienMat',
      discountType: 'fixed',
      GiaTriGiam: 100000,
      discountValue: 100000,
      DoiTuongApDung: 'DichVu',
      NgayBatDau: '2026-09-15',
      NgayKetThuc: '2026-11-30',
      expiry: '2026-11-30',
      TrangThai: 'Hoạt động',
      description: 'Giảm 100.000đ trực tiếp khi trải nghiệm Liệu trình Olaplex chuyên sâu (DV05)'
    },
    {
      id: 'KM03',
      MaKhuyenMai: 'KM03',
      code: 'KM03',
      TenKhuyenMai: 'Đại Tiệc Dầu Dưỡng Moroccanoil',
      HinhThuc: 'PhanTram',
      discountType: 'percent',
      GiaTriGiam: 10,
      discountValue: 10,
      DoiTuongApDung: 'SanPham',
      NgayBatDau: '2026-09-01',
      NgayKetThuc: '2026-10-31',
      expiry: '2026-10-31',
      TrangThai: 'Hoạt động',
      description: 'Giảm 10% cho tất cả sản phẩm thuộc thương hiệu Moroccanoil'
    }
  ],

  // =========================================================================
  // 12. LỊCH HẸN & ĐẶT LỊCH (Bảng LichHen & ChiTietLichHen)
  // =========================================================================
  bookings: [
    {
      id: 'LH01',
      MaLichHen: 'LH01',
      bookingCode: 'LH01',
      customerId: 'KH01',
      MaKhachHang: 'KH01',
      customerName: 'Ngô Văn Tuấn',
      customerPhone: '0988000001',
      customerEmail: 'vantuan@omnisalon.vn',
      stylistId: 'NV02',
      MaNhanVien: 'NV02',
      stylistName: 'Lê Thị Hương',
      branchId: 'CN01',
      MaChiNhanh: 'CN01',
      branchName: 'Salon Tóc Chi Nhánh 1 - Quận 1',
      serviceId: 'DV01',
      serviceName: 'Cắt tóc nam thời trang',
      date: '2026-10-02',
      timeSlot: '09:00',
      totalPrice: 120000,
      TongTien: 120000,
      TienCoc: 0,
      status: 'Confirmed',
      TrangThai: 'Đã hoàn thành',
      GhiChu: 'Khách yêu cầu tỉa phom gọn gàng',
      createdAt: '2026-09-25 08:30:00'
    },
    {
      id: 'LH02',
      MaLichHen: 'LH02',
      bookingCode: 'LH02',
      customerId: 'KH02',
      MaKhachHang: 'KH02',
      customerName: 'Trần Mỹ Linh',
      customerPhone: '0988000002',
      customerEmail: 'mylinh.tran@omnisalon.vn',
      stylistId: 'NV02',
      MaNhanVien: 'NV02',
      stylistName: 'Lê Thị Hương',
      branchId: 'CN01',
      MaChiNhanh: 'CN01',
      branchName: 'Salon Tóc Chi Nhánh 1 - Quận 1',
      serviceId: 'DV02',
      serviceName: 'Cắt & Tạo kiểu tóc nữ',
      date: '2026-10-02',
      timeSlot: '14:30',
      totalPrice: 250000,
      TongTien: 250000,
      TienCoc: 50000,
      status: 'In_Progress',
      TrangThai: 'Đang phục vụ',
      GhiChu: 'Tư vấn cắt layer chuẩn form',
      createdAt: '2026-09-28 10:00:00'
    }
  ],

  // =========================================================================
  // 13. ĐƠN HÀNG (Bảng DonHang & ChiTietDonHang)
  // =========================================================================
  orders: [
    {
      id: 'DH01',
      MaDonHang: 'DH01',
      orderCode: 'DH01',
      customerId: 'KH03',
      MaKhachHang: 'KH03',
      customerName: 'Đặng Thanh Tùng',
      customerPhone: '0988000003',
      branchId: 'CN01',
      MaChiNhanh: 'CN01',
      shippingAddress: '158 An Dương Vương, TP.HCM',
      items: [
        { productId: 'SP14', name: 'Sáp vuốt tóc Volcanic Clay Version V5 80ml', price: 340000, quantity: 1, subtotal: 340000 }
      ],
      totalAmount: 340000,
      TongTienGoc: 340000,
      TongGiamGia: 0,
      TongThanhToan: 340000,
      TrangThaiDonHang: 'Đã hoàn thành',
      orderStatus: 'Delivered',
      PhuongThucThanhToan: 'ChuyenKhoan',
      paymentMethod: 'VietQR',
      createdAt: '2026-09-27 15:00:00'
    }
  ],

  // =========================================================================
  // 14. ĐÁNH GIÁ (Bảng DanhGia)
  // =========================================================================
  reviews: [
    {
      MaDanhGia: 'DG01',
      MaKhachHang: 'KH01',
      customerName: 'Ngô Văn Tuấn',
      MaLichHen: 'LH01',
      SoSao: 5,
      NoiDung: 'Thợ cắt rất có tâm, tư vấn kỹ dáng mặt và vuốt sáp đẹp.',
      NgayDanhGia: '2026-09-25 11:30:00',
      TrangThai: 'Hiển thị',
      stylistName: 'Lê Thị Hương'
    },
    {
      MaDanhGia: 'DG02',
      MaKhachHang: 'KH03',
      customerName: 'Đặng Thanh Tùng',
      MaDonHang: 'DH01',
      SoSao: 4,
      NoiDung: 'Sản phẩm đóng gói cẩn thận, sáp giữ nếp tốt tự nhiên.',
      NgayDanhGia: '2026-09-27 18:00:00',
      TrangThai: 'Hiển thị'
    }
  ],

  // =========================================================================
  // 15. THÔNG BÁO (Bảng ThongBao)
  // =========================================================================
  notifications: [
    {
      id: 'TB01',
      MaThongBao: 'TB01',
      title: 'Chào mừng bạn đến với OmniSalon!',
      TieuDe: 'Chào mừng bạn đến với OmniSalon!',
      content: 'Trải nghiệm hệ thống salon đẳng cấp tại 3 chi nhánh Quận 1, Tân Bình, Bình Thạnh.',
      NoiDung: 'Trải nghiệm hệ thống salon đẳng cấp tại 3 chi nhánh Quận 1, Tân Bình, Bình Thạnh.',
      type: 'promo',
      isRead: false,
      createdAt: '2026-09-01 08:00:00'
    }
  ],

  // =========================================================================
  // 16. BÀI VIẾT TIN TỨC & GƯƠNG MẶT
  // =========================================================================
  newsArticles: [
    {
      id: 'news-1',
      title: 'Xu Hướng Tóc Nam & Nữ Thịnh Hành 2026: Layer Bay & Texture Hiện Đại',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      date: 'Tháng 10, 2026',
      author: 'Master Stylist Võ Quốc Bảo',
      excerpt: 'Cùng chuyên gia OmniSalon khám phá phong cách tạo mẫu Bắc Âu tinh giản nhưng đầy cuốn hút.'
    },
    {
      id: 'news-2',
      title: 'Quy Trình 5 Bước Phục Hồi Olaplex Cho Mái Tóc Cháy Xơ Do Hóa Chất',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      date: 'Tháng 10, 2026',
      author: 'Senior Stylist Lê Thị Hương',
      excerpt: 'Liệu trình độc quyền giúp liên kết lại các chuỗi disulfide bị đứt gãy trong sợi tóc.'
    }
  ],

  brandCollabs: [
    { id: 'collab-1', title: 'OMNI x L’ORÉAL PROFESSIONNEL', linkText: 'GET THE LOOK >' },
    { id: 'collab-2', title: 'OMNI x OLAPLEX GLOBAL', linkText: 'GET THE LOOK >' },
    { id: 'collab-3', title: 'OMNI x MOROCCANOIL', linkText: 'GET THE LOOK >' },
    { id: 'collab-4', title: 'OMNI x DAVINES', linkText: 'GET THE LOOK >' }
  ]
};

// Gán biến toàn cục
window.INITIAL_DATA = INITIAL_SALON_DATA;
window.INITIAL_SALON_DATA = INITIAL_SALON_DATA;
window.RAW_DATA = INITIAL_SALON_DATA;
