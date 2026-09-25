// =========================================================================
// OmniSalon / 4RAU Barbershop — CORE DATA SEED MODULE
// (18+ Chi Nhánh Toàn Quốc, Dịch Vụ, Combos VIP, Sản Phẩm, Tin Tức, Stylists)
// =========================================================================

const INITIAL_SALON_DATA = {
  // 1. Hệ thống chi nhánh toàn quốc (15 Chi nhánh CutClub + 3 Tiệm Tóc Chủ Tịch)
  branches: [
    // --- 4RAU BARBER CUTCLUB (15 Chi nhánh) ---
    {
      id: 'br-nb',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB NHÀ BÈ — CẮT TÓC NAM SUNRISE RIVERSIDE',
      address: 'Tháp G Sunrise Riverside, Nguyễn Hữu Thọ, Phước Kiển, Nhà Bè, TP.HCM',
      phone: '1900 4407 (Phím 1)',
      hours: '08:30 - 21:00',
      totalChairs: 14,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      manager: 'Trần Văn Hoàng'
    },
    {
      id: 'br-q5',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB QUẬN 5 — CẮT TÓC NAM CHỢ LỚN',
      address: '286 An Dương Vương, Phường 4, Quận 5, TP.HCM',
      phone: '1900 4407 (Phím 2)',
      hours: '08:30 - 21:00',
      totalChairs: 16,
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
      manager: 'Nguyễn Thành Nam'
    },
    {
      id: 'br-btan',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB BÌNH TÂN — CẮT TÓC NAM PRIVIA KHANG ĐIỀN',
      address: '158 An Dương Vương, An Lạc, Bình Tân, TP.HCM',
      phone: '1900 4407 (Phím 3)',
      hours: '08:30 - 21:00',
      totalChairs: 12,
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
      manager: 'Lê Quốc Đạt'
    },
    {
      id: 'br-q11',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB QUẬN 11 — CẮT TÓC NAM TRẦN QUANG KHẢI',
      address: '634 Điện Biên Phủ, Phường Vườn Lài, Quận 10 / Q11, TP.HCM',
      phone: '1900 4407 (Phím 4)',
      hours: '08:30 - 21:30',
      totalChairs: 18,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      manager: 'Vũ Đức Thành'
    },
    {
      id: 'br-tt',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB THỦ THIÊM — POPUP THỦ THIÊM PARK',
      address: 'Khu Đô Thị Mới Thủ Thiêm, TP. Thủ Đức, TP.HCM',
      phone: '1900 4407 (Phím 5)',
      hours: '09:00 - 21:00',
      totalChairs: 10,
      image: 'https://images.unsplash.com/photo-1517832606589-7157462939ac?auto=format&fit=crop&w=600&q=80',
      manager: 'Hoàng Minh Tuấn'
    },
    {
      id: 'br-q9',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB QUẬN 9 — VINHOMES GRAND PARK',
      address: 'Phân khu Rainbow, Vinhomes Grand Park, Long Thạnh Mỹ, TP. Thủ Đức, TP.HCM',
      phone: '1900 4407 (Phím 6)',
      hours: '08:30 - 21:00',
      totalChairs: 14,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      manager: 'Đặng Quốc Bảo'
    },
    {
      id: 'br-tp',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB TÂN PHÚ — CẮT TÓC NAM ĐƯỜNG ĐỘC LẬP',
      address: '77 Độc Lập, Tân Thành, Tân Phú, TP.HCM',
      phone: '1900 4407 (Phím 7)',
      hours: '08:30 - 21:00',
      totalChairs: 12,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      manager: 'Trương Tuấn Kiệt'
    },
    {
      id: 'br-tb',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB TÂN BÌNH — CẮT TÓC NAM GẦN SÂN BAY TÂN SƠN NHẤT',
      address: '19 Hồng Hà, Phường 2, Tân Bình, TP.HCM',
      phone: '1900 4407 (Phím 8)',
      hours: '08:00 - 21:30',
      totalChairs: 15,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      manager: 'Bùi Anh Tuấn'
    },
    {
      id: 'br-q2',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB QUẬN 2 — CẮT TÓC NAM ONE VERANDAH',
      address: 'Bát Nàn, Phường Thạnh Mỹ Lợi, TP. Thủ Đức, TP.HCM',
      phone: '1900 4407 (Phím 9)',
      hours: '08:30 - 21:00',
      totalChairs: 12,
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
      manager: 'Phan Minh Khang'
    },
    {
      id: 'br-gv',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB GÒ VẤP — CẮT TÓC NAM PHAN VĂN TRỊ',
      address: '537 Phan Văn Trị, Phường 5, Gò Vấp, TP.HCM',
      phone: '1900 4407 (Phím 10)',
      hours: '08:30 - 21:30',
      totalChairs: 14,
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
      manager: 'Trịnh Thế Hùng'
    },
    {
      id: 'br-q4',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB QUẬN 4 — CẮT TÓC NAM BẾN VÂN ĐỒN',
      address: '360 Bến Vân Đồn, Phường 1, Quận 4, TP.HCM',
      phone: '1900 4407 (Phím 11)',
      hours: '08:30 - 21:00',
      totalChairs: 12,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      manager: 'Đỗ Hữu Thắng'
    },
    {
      id: 'br-td',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB QUẬN 2 — CẮT TÓC NAM THẢO ĐIỀN',
      address: '24 Xuân Thủy, Thảo Điền, TP. Thủ Đức, TP.HCM',
      phone: '1900 4407 (Phím 12)',
      hours: '09:00 - 21:30',
      totalChairs: 16,
      image: 'https://images.unsplash.com/photo-1517832606589-7157462939ac?auto=format&fit=crop&w=600&q=80',
      manager: 'Cao Đình Trọng'
    },
    {
      id: 'br-bth',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB BÌNH THẠNH — CẮT TÓC NAM HÀNG XANH',
      address: '475 Điện Biên Phủ, Phường 25, Bình Thạnh, TP.HCM',
      phone: '1900 4407 (Phím 13)',
      hours: '08:30 - 21:00',
      totalChairs: 14,
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
      manager: 'Ngô Xuân Trường'
    },
    {
      id: 'br-pmh',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB QUẬN 7 — CẮT TÓC NAM PHÚ MỸ HƯNG',
      address: '102 Nguyễn Đức Cảnh, Tân Phong, Quận 7, TP.HCM',
      phone: '1900 4407 (Phím 14)',
      hours: '08:30 - 21:30',
      totalChairs: 16,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      manager: 'Phạm Quang Huy'
    },
    {
      id: 'br-dbp',
      group: '4RAU BARBER CUTCLUB',
      name: '4RAU CUTCLUB QUẬN 10 — CẮT TÓC NAM ĐIỆN BIÊN PHỦ (HQ)',
      address: '634 Điện Biên Phủ, Phường 11, Quận 10, TP.HCM',
      phone: '1900 4407 (Phím 15)',
      hours: '08:30 - 22:00',
      totalChairs: 20,
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
      manager: 'Hà Văn Lộc'
    },

    // --- TIỆM TÓC CỦA CHỦ TỊCH (3 Chi nhánh VIP) ---
    {
      id: 'br-ct-q1',
      group: 'TIỆM TÓC CỦA CHỦ TỊCH',
      name: 'TIỆM TÓC CỦA CHỦ TỊCH — BARBER DELUXE ĐÔNG DU, QUẬN 1',
      address: '18 Đông Du, Phường Bến Nghé, Quận 1, TP.HCM',
      phone: '1900 4407 (VIP Q1)',
      hours: '09:00 - 22:00',
      totalChairs: 8,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      manager: 'Chủ Tịch Hà Hiền & Master Barbers'
    },
    {
      id: 'br-ct-q3',
      group: 'TIỆM TÓC CỦA CHỦ TỊCH',
      name: 'TIỆM TÓC CỦA CHỦ TỊCH — BARBER DELUXE ĐIỆN BIÊN PHỦ, Q3',
      address: '220 Điện Biên Phủ, Phường Võ Thị Sáu, Quận 3, TP.HCM',
      phone: '1900 4407 (VIP Q3)',
      hours: '09:00 - 21:30',
      totalChairs: 8,
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
      manager: 'Master Barber Vũ Nam'
    },
    {
      id: 'br-ct-yersin',
      group: 'TIỆM TÓC CỦA CHỦ TỊCH',
      name: 'TIỆM TÓC CỦA CHỦ TỊCH — BARBER DELUXE YERSIN, QUẬN 1',
      address: '72 Yersin, Phường Cầu Ông Lãnh, Quận 1, TP.HCM',
      phone: '1900 4407 (VIP Yersin)',
      hours: '09:00 - 21:30',
      totalChairs: 8,
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
      manager: 'Master Barber Alex Tùng'
    }
  ],

  // 2. Dịch vụ (OUR SERVICE — Khớp 100% ticker pills trong ảnh ngon.png)
  services: [
    {
      id: 'srv-1',
      name: 'CẮT TẠO KIỂU FADE & CHUẨN BARBER',
      category: 'cut',
      type: 'single',
      price: 180000,
      oldPrice: 220000,
      duration: 45,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      description: 'Tư vấn form tóc theo dáng mặt, cạo fade viền sắc nét, cạo mặt êm ái và sấy vuốt tạo kiểu pomade.',
      rating: 4.98,
      reviewsCount: 520
    },
    {
      id: 'srv-2',
      name: 'GỘI ĐẦU MASSAGE ĐẦU / RELAX CỔ VAI GÁY',
      category: 'spa',
      type: 'single',
      price: 120000,
      oldPrice: 150000,
      duration: 35,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      description: 'Liệu trình gội đầu sảng khoái với bấm huyệt kinh lạc, massage cổ vai gáy giải tỏa căng thẳng sau giờ làm.',
      rating: 4.96,
      reviewsCount: 380
    },
    {
      id: 'srv-3',
      name: 'CẠO MẶT VỚI KHĂN NÓNG / HOT TOWEL SHAVE',
      category: 'shave',
      type: 'single',
      price: 150000,
      oldPrice: 180000,
      duration: 30,
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
      description: 'Ủ khăn nóng thảo mộc truyền thống, bọt cạo tuyết mịn màng Proraso và thoa dưỡng ẩm phục hồi da.',
      rating: 4.99,
      reviewsCount: 410
    },
    {
      id: 'srv-4',
      name: 'UỐN TÓC NAM / HAIR PERM & TEXTURE',
      category: 'perm',
      type: 'single',
      price: 450000,
      oldPrice: 550000,
      duration: 75,
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      description: 'Uốn phồng chân tóc, uốn sóng lơi nhẹ nhàng chuẩn soái ca hoặc uốn con sâu giấy bạc cá tính.',
      rating: 4.95,
      reviewsCount: 340
    },
    {
      id: 'srv-5',
      name: 'ÉP SIDE TÓC / SIDE HAIR STRAIGHTENING',
      category: 'perm',
      type: 'single',
      price: 250000,
      oldPrice: 300000,
      duration: 40,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      description: 'Ép xẹp hoàn toàn 2 bên side tóc bị chỉa, giúp form tóc ôm sát đầu gọn gàng từ 2 đến 3 tháng.',
      rating: 4.94,
      reviewsCount: 290
    },
    {
      id: 'srv-6',
      name: 'NHUỘM TÓC THỜI TRANG & TẨY TÓC AN TOÀN',
      category: 'color',
      type: 'single',
      price: 550000,
      oldPrice: 700000,
      duration: 90,
      image: 'https://images.unsplash.com/photo-1517832606589-7157462939ac?auto=format&fit=crop&w=600&q=80',
      description: 'Nhuộm các tông màu hot trend: Nâu khói, xám khói, nâu tây lạnh, xanh đen nam tính không rát da đầu.',
      rating: 4.92,
      reviewsCount: 260
    },
    {
      id: 'srv-7',
      name: 'UỐN GIẤY BẠC ZIC-ZAC / PREMLOCK HIPHOP',
      category: 'perm',
      type: 'single',
      price: 650000,
      oldPrice: 800000,
      duration: 90,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
      description: 'Kỹ thuật uốn zic-zac đường phố bụi bặm, tạo độ xù phồng cực ngầu cho các bạn trẻ underground.',
      rating: 4.97,
      reviewsCount: 195
    }
  ],

  // 3. Gói Combo VIP
  combos: [
    {
      id: 'cmb-1',
      name: 'COMBO 4RAU SIGNATURE (Cắt + Cạo Khăn Nóng + Gội + Sáp)',
      category: 'combo',
      type: 'combo',
      price: 390000,
      oldPrice: 520000,
      duration: 70,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      description: 'Trải nghiệm barbershop trọn gói: Tư vấn dáng tóc + Cắt fade + Cạo mặt ủ khăn nóng + Gội đầu sảng khoái + Vuốt Pomade xịn.',
      rating: 5.0,
      reviewsCount: 780
    },
    {
      id: 'cmb-2',
      name: 'COMBO ĐẾ VƯƠNG (Cắt + Uốn Phồng Chân + Ép Side + Gội Spa)',
      category: 'combo',
      type: 'combo',
      price: 850000,
      oldPrice: 1100000,
      duration: 110,
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      description: 'Lột xác hoàn hảo cho mái tóc chỉa, khó vào nếp: Cắt form thời trang + Uốn bồng bềnh + Ép ôm sát 2 bên + Dưỡng phục hồi.',
      rating: 4.98,
      reviewsCount: 430
    }
  ],

  // 4. Sản phẩm (100% khớp danh sách SẢN PHẨM MỚI & SẢN PHẨM BÁN CHẠY trong ảnh ngon.png)
  products: [
    // --- SẢN PHẨM MỚI (NEW ARRIVALS) ---
    {
      id: 'prod-new-1',
      section: 'new',
      name: 'BROSH x WACKO MARIA GREASE',
      brand: 'BROSH JAPAN',
      category: 'Pomade / Sáp',
      price: 580000,
      image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
      description: 'Bản collab giới hạn giữa Brosh Pomade Nhật Bản và nhãn hàng thời trang đường phố Wacko Maria. Giữ nếp cực tốt, hương thơm quyến rũ.'
    },
    {
      id: 'prod-new-2',
      section: 'new',
      name: '4RAU RAGLAN LONGTEE - RED',
      brand: '4RAU APPAREL',
      category: 'Thời Trang',
      price: 490000,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      description: 'Áo thun tay dài Raglan phối màu đỏ trắng phong cách Vintage đường phố, chất vải cotton 100% định lượng cao dày dặn, thoáng mát.'
    },
    {
      id: 'prod-new-3',
      section: 'new',
      name: '4RAU Winter Tote 2025',
      brand: '4RAU ACCESSORIES',
      category: 'Phụ Kiện',
      price: 99000,
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      description: 'Túi tote canvas đỏ nổi bật với logo 4RAU in nổi, quai đeo chịu lực tốt, ngăn chứa đồ rộng rãi cho các hoạt động thường ngày.'
    },
    {
      id: 'prod-new-4',
      section: 'new',
      name: '4RAU Winter Trucker Hat 2025 - RED',
      brand: '4RAU APPAREL',
      category: 'Mũ Nón',
      price: 450000,
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
      description: 'Nón lưỡi trai Trucker form chuẩn Snapback phối lưới đỏ, thêu logo 4RAU sắc sảo, chống gãy form, phong cách Hip-Hop cá tính.'
    },
    {
      id: 'prod-new-5',
      section: 'new',
      name: '4RAU Winter Trucker Hat 2025 - BLACK',
      brand: '4RAU APPAREL',
      category: 'Mũ Nón',
      price: 450000,
      image: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=600&q=80',
      description: 'Nón Trucker tông đen Black sang trọng bụi bặm, phối lưới thoáng khí phía sau, khóa cài bấm dễ dàng điều chỉnh kích cỡ.'
    },

    // --- SẢN PHẨM BÁN CHẠY (BEST SELLERS) ---
    {
      id: 'prod-best-1',
      section: 'best',
      name: 'BROSH TONIC SPRAY',
      brand: 'BROSH JAPAN',
      category: 'Chăm Sóc & Dưỡng',
      price: 500000,
      image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
      description: 'Nước dưỡng kích thích mọc tóc và làm mát da đầu tức thì, khử mùi hôi nón bảo hiểm, tạo độ phồng nhẹ tự nhiên trước khi sấy tóc.'
    },
    {
      id: 'prod-best-2',
      section: 'best',
      name: 'KBP Original Pomade',
      brand: 'KBP BARBER',
      category: 'Pomade',
      price: 440000,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      description: 'Dòng Pomade gốc nước huyền thoại dành riêng cho khí hậu nóng ẩm Việt Nam, độ giữ nếp Strong Hold bền bỉ 12 giờ.'
    },
    {
      id: 'prod-best-3',
      section: 'best',
      name: 'BROSH SUPER HARD GEL',
      brand: 'BROSH JAPAN',
      category: 'Gel Tạo Kiểu',
      price: 600000,
      image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
      description: 'Gel siêu cứng khóa nếp thần tốc, tạo độ bóng tinh tế, không bong tróc vảy trắng, dễ dàng tái tạo nếp sau khi đội mũ.'
    },
    {
      id: 'prod-best-4',
      section: 'best',
      name: '4RAU 4EVER WHITE TEE',
      brand: '4RAU APPAREL',
      category: 'Thời Trang',
      price: 189000,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      description: 'Áo phông trắng basic cổ tròn biểu tượng của 4RAU Barber, form suông nam tính, in logo trước ngực và sau lưng sắc nét.'
    },
    {
      id: 'prod-best-5',
      section: 'best',
      name: 'Bột Tạo Phồng Brosh Powder Magic',
      brand: 'BROSH JAPAN',
      category: 'Pre-styling',
      price: 420000,
      image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',
      description: 'Hút sạch dầu thừa bết dính ở chân tóc, mang lại độ bồng bềnh tự nhiên tối đa, không lộ bột, giữ nếp phồng suốt cả ngày.'
    }
  ],

  // 5. Bài viết Blog (TIN TÓC UNDERGROUND — 100% đúng tiêu đề và nội dung ảnh ngon.png)
  newsArticles: [
    {
      id: 'news-feature',
      isFeature: true,
      title: 'Erling Haaland cắt Buzz Cut: Khi "người Viking" trở lại với mái tóc quân đội',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      date: 'Tháng 9, 2026',
      author: '4RAU Editorial',
      excerpt: 'Erling Haaland bất ngờ cắt Buzz Cut sau nhiều năm để tóc dài. Cùng 4RAU tìm hiểu kiểu tóc mới, Buzz Cut là gì và kiểu tóc này có phù hợp với bạn không.'
    },
    {
      id: 'news-side-1',
      isFeature: false,
      title: 'Ngày Đẹp Cắt Tóc Tháng 9/2026 Ngày Nào Tốt? 5 Ngày Đẹp Nhất Theo Lịch Vạn Niên',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
      date: 'Tháng 9, 2026',
      excerpt: 'Lịch cắt tóc tháng 9/2026: ngày nào hết tháng có hồn, các ngày hoàng đạo, 5 ngày...'
    },
    {
      id: 'news-side-2',
      isFeature: false,
      title: 'Pomade Gốc Dầu Khó Gội? Đây Là Cách Barber 4RAU Vẫn Làm Mỗi Ngày',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
      date: 'Tháng 9, 2026',
      excerpt: 'Pomade gốc dầu khó tan trong nước nên gội mãi vẫn bết. Barber 4RAU chỉ quy trình...'
    },
    {
      id: 'news-side-3',
      isFeature: false,
      title: 'Warrior Cut Là Gì? Kiểu Tóc James (CORTIS) Đang Gây Sốt TikTok 2026',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80',
      date: 'Tháng 9, 2026',
      excerpt: 'Warrior cut viral TikTok nhờ màn cắt trọc bớt ngố của James (CORTIS) trước MV "T...'
    },
    {
      id: 'news-grid-1',
      title: 'HAIR HỌC TRÒ 2026: 10 Kiểu Tóc Nam Đi Học Đẹp, Gọn, Chuẩn Trend',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      date: 'Tháng 9, 2026',
      excerpt: 'HAIR HỌC TRÒ 2026: Khám phá 10 kiểu tóc nam đi học đẹp, gọn và trendy...'
    },
    {
      id: 'news-grid-2',
      title: 'Himesh Patel sở hữu bộ râu đẹp nhất trong The Odyssey — Không phải đại nhất, mà là cân đối nhất',
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=400&q=80',
      date: 'Tháng 9, 2026',
      excerpt: 'Khi nhắc đến The Odyssey của đạo diễn Christopher Nolan, khán giả sẽ n...'
    },
    {
      id: 'news-grid-3',
      title: 'Kiểu tóc Lionel Messi: Vì sao gần 20 năm vẫn không lỗi thời? Góc nhìn của barber 4RAU',
      image: 'https://images.unsplash.com/photo-1517832606589-7157462939ac?auto=format&fit=crop&w=400&q=80',
      date: 'Tháng 9, 2026',
      excerpt: 'Nếu Lionel Messi bước vào 4RAU Barber trước trận chung kết World Cup 2...'
    },
    {
      id: 'news-grid-4',
      title: 'Kiểu tóc Erling Haaland: Vì sao Man Bún trở thành biểu tượng của World Cup 2026?',
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
      date: 'Tháng 9, 2026',
      excerpt: 'Không chỉ ghi bàn, Erling Haaland còn gây sốt với kiểu tóc Man Bún đặc...'
    }
  ],

  // 6. Bạn Đến Nhà (Khoảnh khắc khách hàng và barber tại shop — ngon.png)
  moments: [
    {
      id: 'm-1',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=500&q=80',
      caption: 'Khách quen cùng Master Barber Hà Hiền tại chi nhánh Điện Biên Phủ'
    },
    {
      id: 'm-2',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=500&q=80',
      caption: 'Check-in góc tường gạch cổ điển đặc trưng của 4RAU Barbershop'
    },
    {
      id: 'm-3',
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=500&q=80',
      caption: 'Anh em thợ cắt tóc đeo tạp dề da thương hiệu sẵn sàng phục vụ'
    },
    {
      id: 'm-4',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
      caption: 'Rapper và nghệ sĩ underground ghé tút lại diện mạo trước show diễn'
    },
    {
      id: 'm-5',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
      caption: 'Nụ cười hài lòng với kiểu tóc Fade bén ngót và cạo râu êm dịu'
    }
  ],

  // 7. Các hợp tác thương hiệu (Brand Collaborations — ngon.png)
  brandCollabs: [
    { id: 'collab-1', title: '4RAU x XANHSM', linkText: 'GET THE LOOK >' },
    { id: 'collab-2', title: '4RAU x ECKSAIGON', linkText: 'GET THE LOOK >' },
    { id: 'collab-3', title: '4RAU x Clear Men 2025', linkText: 'GET THE LOOK >' },
    { id: 'collab-4', title: 'BST 4RAU x GAMBLE WORLDWIDE', linkText: 'GET THE LOOK >' },
    { id: 'collab-5', title: '4RAU x REDBULL', linkText: 'GET THE LOOK >' },
    { id: 'collab-6', title: '4RAU x RUNAM CAFE', linkText: 'GET THE LOOK >' }
  ],

  // 8. Tác phẩm trong tháng (Hairstyles Gallery & AI Try-On)
  hairstyles: [
    {
      id: 'hs-1',
      title: 'Buzz Cut Quân Đội (Erling Haaland 2026)',
      gender: 'Nam',
      styleCategory: 'Buzz Cut',
      matchFaceShapes: ['Square', 'Oval', 'Diamond'],
      description: 'Cắt cua ngắn ôm sát hộp sọ, fade bén mượt mà hai bên tạo vẻ phong trần, quyền lực và góc cạnh.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-1',
      baseMatchScore: 98,
      suitableColors: [
        { name: 'Đen Tự Nhiên', hex: '#1c1b18' },
        { name: 'Xám Bạc Smokey', hex: '#9ca3af' }
      ]
    },
    {
      id: 'hs-2',
      title: 'Warrior Cut James (CORTIS Viral TikTok)',
      gender: 'Nam',
      styleCategory: 'Warrior/Crop',
      matchFaceShapes: ['Oval', 'Round', 'Square'],
      description: 'Mái crop ngắn phá cách kết hợp fade cao sắc sảo, siêu phẩm viral đang gây sốt trong giới trẻ.',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-1',
      baseMatchScore: 97,
      suitableColors: [
        { name: 'Nâu Khói Lạnh', hex: '#4a3728' },
        { name: 'Đen Mực', hex: '#111827' }
      ]
    },
    {
      id: 'hs-3',
      title: 'Side Part 7/3 Phồng Rủ Lãng Tử',
      gender: 'Nam',
      styleCategory: 'Side Part',
      matchFaceShapes: ['Oval', 'Heart', 'Diamond'],
      description: 'Rẽ ngôi 7/3 vuốt phồng nhẹ nhàng, phần mái rủ bồng bềnh giúp khuôn mặt thanh thoát và điển trai.',
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-4',
      baseMatchScore: 96,
      suitableColors: [
        { name: 'Nâu Hạt Dẻ', hex: '#5a3825' },
        { name: 'Nâu Sôcôla', hex: '#3d2314' }
      ]
    },
    {
      id: 'hs-4',
      title: 'Modern Undercut Pompadour Quý Ông',
      gender: 'Nam',
      styleCategory: 'Pompadour',
      matchFaceShapes: ['Round', 'Square', 'Oval'],
      description: 'Fade chuẩn barber hai bên, phần đỉnh vuốt ngược phồng bóng sang trọng với pomade gốc nước.',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-1',
      baseMatchScore: 95,
      suitableColors: [
        { name: 'Nâu Tây', hex: '#4a3728' },
        { name: 'Đen Tự Nhiên', hex: '#1e1e1e' }
      ]
    }
  ],

  // 9. Stylists & Barbers
  stylists: [
    {
      id: 'st-1',
      branchId: 'br-dbp',
      name: 'Master Barber Hà Hiền',
      role: 'Founder & Giám Đốc Sáng Tạo 4RAU',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      rating: 5.0,
      specialty: 'Fade đỉnh cao, tạo hình râu cổ điển & Phong cách Underground',
      experience: '15 năm kinh nghiệm'
    },
    {
      id: 'st-2',
      branchId: 'br-q11',
      name: 'Barber Dennis Hoàng',
      role: 'Head Barber & Texture Master',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      rating: 4.98,
      specialty: 'Uốn con sâu, Side part rủ & Chuyên gia cạo mặt khăn nóng',
      experience: '9 năm kinh nghiệm'
    },
    {
      id: 'st-3',
      branchId: 'br-td',
      name: 'Barber Alex Vũ',
      role: 'Senior Barber Thảo Điền',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      rating: 4.96,
      specialty: 'Skin fade, Mullet hiện đại & Ép side tự nhiên',
      experience: '8 năm kinh nghiệm'
    }
  ],

  // 10. Lịch hẹn & Booking
  bookings: [
    {
      id: 'BK-4RAU-101',
      branchId: 'br-dbp',
      branchName: '4RAU CUTCLUB QUẬN 10 — CẮT TÓC NAM ĐIỆN BIÊN PHỦ (HQ)',
      customerName: 'Nguyễn Văn Hải',
      customerPhone: '0908123456',
      serviceId: 'srv-1',
      serviceName: 'CẮT TẠO KIỂU FADE & CHUẨN BARBER',
      stylistId: 'st-1',
      stylistName: 'Master Barber Hà Hiền',
      date: '2026-09-12',
      timeSlot: '10:30',
      totalPrice: 180000,
      status: 'confirmed',
      createdAt: '2026-09-11 14:00'
    }
  ],

  // 11. Đơn hàng bán lẻ
  orders: [],

  // 12. Khuyến mãi & Vouchers
  promotions: [
    { code: '4RAUWELCOME', discountType: 'fixed', discountValue: 50000, minOrder: 150000, expiry: '2026-12-31', description: 'Giảm ngay 50k cho khách hàng đặt lịch lần đầu' },
    { code: 'VIPGENTLEMAN', discountType: 'percent', discountValue: 15, minOrder: 300000, expiry: '2026-12-31', description: 'Giảm 15% cho combo hoặc hóa đơn mỹ phẩm từ 300k' }
  ],

  // 13. Thông báo
  notifications: [
    {
      id: 'notif-1',
      userId: 'usr-1',
      title: '💈 Chào mừng bạn đến với 4RAU Barbershop!',
      content: 'Nhập mã 4RAUWELCOME khi đặt lịch để được giảm ngay 50.000đ cho lần cắt tóc đầu tiên.',
      type: 'promo',
      isRead: false,
      createdAt: '2026-09-12 08:00'
    }
  ],

  // 14. Tồn kho chi nhánh
  inventory: [
    { id: 'inv-1', productId: 'prod-new-1', branchId: 'br-dbp', stock: 45, minAlert: 10 },
    { id: 'inv-2', productId: 'prod-new-2', branchId: 'br-dbp', stock: 25, minAlert: 5 },
    { id: 'inv-3', productId: 'prod-best-1', branchId: 'br-dbp', stock: 30, minAlert: 8 }
  ],

  // 15. Audit logs
  auditLogs: [
    {
      id: 'log-1',
      timestamp: '2026-09-12 08:00',
      operatorName: 'Hệ Thống 4RAU',
      action: 'SYSTEM_BOOT',
      entity: 'Platform V5',
      details: 'Khởi chạy hệ sinh thái 4RAU Barbershop (Web & Android CH Play App)'
    }
  ]
};

// -------------------------------------------------------------------------
// 2. CÁC HÀM TIỆN ÍCH CHUNG (HELPER UTILITIES)
// -------------------------------------------------------------------------

window.INITIAL_DATA = INITIAL_SALON_DATA;
