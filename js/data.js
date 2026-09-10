// OmniSalon Seed Data — Chuẩn 100% Hệ Thống Salon Nam & Barbershop Cao Cấp
// Tích hợp: Đa Chi Nhánh, Kho Theo Chi Nhánh, Thư Viện Tóc Nam 3D AI, Lịch Sử Tư Vấn, Audit Logs, Thông Báo

const INITIAL_DATA = {
  // 1. Chi nhánh Barbershop & Salon Nam (Branches)
  branches: [
    {
      id: 'br-1',
      name: 'OmniSalon Flagship Barber — Quận 1',
      address: '88 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      phone: '028 3822 9999',
      hours: '08:30 - 21:30 (Tất cả các ngày)',
      totalChairs: 16,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      manager: 'Lê Hoàng Nam (Head Manager)'
    },
    {
      id: 'br-2',
      name: 'OmniSalon Boutique Barber — Thảo Điền',
      address: '24 Xuân Thủy, Phường Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
      phone: '028 3744 8888',
      hours: '09:00 - 21:00 (Tất cả các ngày)',
      totalChairs: 12,
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
      manager: 'Vũ Đức Thành (Branch Leader)'
    },
    {
      id: 'br-3',
      name: 'OmniSalon Premier Barber — Cầu Giấy',
      address: '102 Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
      phone: '024 3795 6666',
      hours: '08:30 - 21:00 (Tất cả các ngày)',
      totalChairs: 14,
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
      manager: 'Hoàng Minh Tuấn (Senior Barber)'
    }
  ],

  // 2. Dịch vụ Tóc & Chăm Sóc Nam Riêng Lẻ (Services)
  services: [
    {
      id: 'srv-1',
      name: 'Cắt Tạo Kiểu Chuẩn Barber / Fade & Tỉa Textured',
      category: 'cut',
      type: 'single',
      price: 220000,
      oldPrice: 280000,
      duration: 45, // minutes
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      description: 'Tư vấn form tóc chuẩn tỉ lệ khuôn mặt, cắt fade cạo viền sắc nét, gội bấm huyệt thư giãn cổ vai gáy và sấy vuốt tạo kiểu pomade.',
      rating: 4.96,
      reviewsCount: 342
    },
    {
      id: 'srv-2',
      name: 'Nhuộm & Tẩy Màu Thời Trang Phái Mạnh',
      category: 'color',
      type: 'single',
      price: 650000,
      oldPrice: 850000,
      duration: 90,
      image: 'https://images.unsplash.com/photo-1517832606589-7157462939ac?auto=format&fit=crop&w=600&q=80',
      description: 'Nâng tông an toàn Olaplex, nhuộm các dải màu hot trend nam: Khói xám smokey, nâu tây lạnh, rêu khói, xanh đen cá tính.',
      rating: 4.92,
      reviewsCount: 188
    },
    {
      id: 'srv-3',
      name: 'Uốn Định Hình Nam / Texture Curls / Uốn Con Sâu',
      category: 'perm',
      type: 'single',
      price: 550000,
      oldPrice: 700000,
      duration: 75,
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      description: 'Kỹ thuật uốn phồng chân tóc Hàn Quốc, uốn con sâu giấy bạc zic-zac hoặc uốn sóng lơi bồng bềnh, vào nếp tự nhiên 4-6 tháng.',
      rating: 4.95,
      reviewsCount: 215
    },
    {
      id: 'srv-4',
      name: 'Cạo Mặt Râu Khăn Nóng Cổ Điển & Bọt Thảo Dược',
      category: 'shave',
      type: 'single',
      price: 150000,
      oldPrice: 200000,
      duration: 30,
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
      description: 'Liệu trình thư giãn quý ông: Ủ khăn nóng thảo mộc làm mềm râu, cạo râu êm dịu bọt tuyết Proraso và thoa nước hoa hồng se khít chân lông.',
      rating: 4.98,
      reviewsCount: 195
    },
    {
      id: 'srv-5',
      name: 'Gội Đầu Dưỡng Sinh Relax & Massage Cổ Vai Gáy',
      category: 'spa',
      type: 'single',
      price: 180000,
      oldPrice: 240000,
      duration: 45,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      description: '14 bước gội đầu dưỡng sinh thảo dược kết hợp bấm huyệt chuyên sâu vùng đầu, gáy, vai, giải tỏa hoàn toàn áp lực công sở.',
      rating: 4.97,
      reviewsCount: 260
    },
    {
      id: 'srv-6',
      name: 'Phục Hồi Tóc Hư Tổn & Trị Gàu Chuyên Sâu Da Đầu',
      category: 'treatment',
      type: 'single',
      price: 350000,
      oldPrice: 450000,
      duration: 45,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      description: 'Tẩy tế bào chết da đầu sinh học, khử sạch dầu nhờn trị gàu ngứa, bù đắp Keratin phục hồi lõi tóc chắc khỏe từ gốc.',
      rating: 4.89,
      reviewsCount: 142
    }
  ],

  // 3. Gói Combo Quý Ông & Đế Vương VIP (Combos)
  combos: [
    {
      id: 'cmb-1',
      name: 'COMBO GENTLEMAN VIP (Cắt Tạo Kiểu + Cạo Khăn Nóng + Gội Spa + Vuốt Sáp)',
      category: 'combo',
      type: 'combo',
      price: 490000,
      oldPrice: 680000,
      duration: 75,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      description: 'Gói chăm sóc diện mạo toàn diện cho quý ông: Cắt fade sắc nét + Cạo râu mặt khăn nóng cổ điển + Gội spa bấm huyệt cổ vai gáy + Đắp mặt nạ than hoạt tính + Vuốt Pomade cao cấp.',
      steps: ['Tư vấn & Cắt form tóc nam tính', 'Cạo mặt râu ủ khăn nóng thảo mộc', 'Gội đầu dưỡng sinh & Bấm huyệt', 'Đắp mặt nạ lạnh & Sấy vuốt Pomade'],
      rating: 5.0,
      reviewsCount: 420
    },
    {
      id: 'cmb-2',
      name: 'COMBO ĐẾ VƯƠNG TOÀN DIỆN (Cắt + Uốn Texture Phồng Chân + Nhuộm Tông Nam)',
      category: 'combo',
      type: 'combo',
      price: 1150000,
      oldPrice: 1550000,
      duration: 135,
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      description: 'Gói dịch vụ lột xác đẳng cấp phái mạnh: Cắt tỉa chuẩn form + Uốn phồng tạo kết cấu bồng bềnh + Nhuộm màu nam tính thời thượng + Gội sấy tạo kiểu chuẩn salon.',
      steps: ['Cắt form Fade/Side Part hiện đại', 'Xử lý thuốc uốn collagen nano', 'Nhuộm tông màu tây nam tính', 'Gội xả chuyên sâu & Hướng dẫn tự tạo kiểu'],
      rating: 4.96,
      reviewsCount: 278
    },
    {
      id: 'cmb-3',
      name: 'COMBO LỘT XÁC DIỆN MẠO (Cắt Fade + Tẩy Olaplex + Nhuộm Xám Khói/Bạch Kim)',
      category: 'combo',
      type: 'combo',
      price: 1350000,
      oldPrice: 1800000,
      duration: 150,
      image: 'https://images.unsplash.com/photo-1517832606589-7157462939ac?auto=format&fit=crop&w=600&q=80',
      description: 'Dành riêng cho phái mạnh cá tính: Nâng tông tóc an toàn không xót da đầu với Olaplex + Nhuộm xám khói/bạch kim chuẩn fashion + Cắt tỉa layer sắc cạnh.',
      steps: ['Nâng tông an toàn Olaplex', 'Nhuộm phối màu đa chiều', 'Cắt fade viền sắc sảo', 'Hấp dầu khóa màu chuyên sâu'],
      rating: 4.98,
      reviewsCount: 165
    },
    {
      id: 'cmb-4',
      name: 'COMBO RELAX THƯ GIÃN CUỐI TUẦN (Cắt Tóc + Gội Dưỡng Sinh 14 Bước + Cạo Râu)',
      category: 'combo',
      type: 'combo',
      price: 390000,
      oldPrice: 520000,
      duration: 70,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      description: 'Xả stress tức thì sau tuần làm việc: Cắt gọt mái tóc gọn gàng + Gội đầu dưỡng sinh bấm huyệt đã thông kinh lạc + Cạo râu tẩy da chết da mặt sáng mịn.',
      steps: ['Cắt chỉnh tóc form chuẩn', 'Gội dưỡng sinh thảo mộc 14 bước', 'Massage vai gáy & Cạo râu êm ái', 'Sấy tạo phồng tự nhiên'],
      rating: 4.95,
      reviewsCount: 310
    }
  ],

  // 4. Thư viện kiểu tóc Nam 3D AI (100% Men Hairstyles for AI Try-On)
  hairstyles: [
    {
      id: 'hs-1',
      title: 'Modern Undercut Pompadour',
      gender: 'Nam',
      styleCategory: 'Pompadour',
      matchFaceShapes: ['Round', 'Square', 'Oval'],
      description: 'Đường cắt fade sắc nét 2 bên mang tai, phần đỉnh vuốt ngược bồng bềnh tạo vẻ nam tính, quyền lực và lịch lãm quý ông doanh nhân.',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-1',
      baseMatchScore: 98,
      suitableColors: [
        { name: 'Nâu Tây Lạnh', hex: '#4a3728' },
        { name: 'Đen Mờ Tự Nhiên', hex: '#1e1e1e' },
        { name: 'Xám Tro Smokey', hex: '#71717a' },
        { name: 'Nâu Hạt Dẻ Trầm', hex: '#5a3825' }
      ]
    },
    {
      id: 'hs-2',
      title: 'Side Part 7/3 Rủ Hàn Quốc',
      gender: 'Nam',
      styleCategory: 'Side Part',
      matchFaceShapes: ['Oval', 'Heart', 'Diamond'],
      description: 'Rẽ ngôi 7/3 vuốt phồng nhẹ nhàng, phần mái rủ bồng bềnh chuẩn nam thần lãng tử, giúp cân đối tỉ lệ trán và khuôn mặt thanh thoát.',
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-3',
      baseMatchScore: 97,
      suitableColors: [
        { name: 'Nâu Hạt Dẻ', hex: '#5a3825' },
        { name: 'Nâu Sôcôla Lạnh', hex: '#3d2314' },
        { name: 'Đen Tuyến Tự Nhiên', hex: '#111827' },
        { name: 'Vàng Khói Trầm', hex: '#b08968' }
      ]
    },
    {
      id: 'hs-3',
      title: 'Textured French Crop',
      gender: 'Nam',
      styleCategory: 'Crop',
      matchFaceShapes: ['Round', 'Square', 'Oval'],
      description: 'Mái bằng cắt ngắn tỉa textured so le cá tính, xung quanh cạo fade cao gọn gàng, tôn trọn góc cạnh xương hàm phái mạnh và cực kỳ dễ chăm sóc.',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-1',
      baseMatchScore: 95,
      suitableColors: [
        { name: 'Khói Xám Bạc', hex: '#9ca3af' },
        { name: 'Đen Tự Nhiên', hex: '#1c1b18' },
        { name: 'Xanh Rêu Khói', hex: '#4b5563' },
        { name: 'Nâu Tây', hex: '#4a3728' }
      ]
    },
    {
      id: 'hs-4',
      title: 'Mullet Layer Nam Thời Thượng',
      gender: 'Nam',
      styleCategory: 'Mullet',
      matchFaceShapes: ['Oval', 'Diamond', 'Heart'],
      description: 'Phần tóc mái tỉa layer nhẹ nhàng, đuôi gáy để dài tạo phong cách nghệ sĩ, phóng khoáng, nổi loạn và cuốn hút đầy chất phong trần.',
      image: 'https://images.unsplash.com/photo-1517832606589-7157462939ac?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-1',
      baseMatchScore: 94,
      suitableColors: [
        { name: 'Bạch Kim Platinum', hex: '#e5e7eb' },
        { name: 'Khói Ánh Tím Nam', hex: '#7c3aed' },
        { name: 'Nâu Caramel', hex: '#c08041' },
        { name: 'Đen Mờ', hex: '#1e1e1e' }
      ]
    },
    {
      id: 'hs-5',
      title: 'Mohican Fade Sport',
      gender: 'Nam',
      styleCategory: 'Mohican',
      matchFaceShapes: ['Round', 'Oval', 'Square'],
      description: 'Dáng tóc thể thao khỏe khoắn với đỉnh tóc vuốt dựng nhọn về phía trước, hai bên cạo sát da đầu skin fade sắc sảo, tôn vẻ nam tính mạnh mẽ.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-1',
      baseMatchScore: 96,
      suitableColors: [
        { name: 'Đen Tự Nhiên', hex: '#1c1b18' },
        { name: 'Nâu Hạt Dẻ', hex: '#5a3825' },
        { name: 'Xám Tro', hex: '#71717a' }
      ]
    },
    {
      id: 'hs-6',
      title: 'Uốn Con Sâu Zic-Zac / Premlock',
      gender: 'Nam',
      styleCategory: 'Perm/Curls',
      matchFaceShapes: ['Square', 'Round', 'Oval', 'Heart', 'Diamond'],
      description: 'Từng lọn tóc được uốn zic-zac giấy bạc tạo độ xù bồng bềnh cá tính, phong cách hiphop đường phố cực kỳ bụi bặm và phá cách.',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-3',
      baseMatchScore: 95,
      suitableColors: [
        { name: 'Nâu Đồng Sáng', hex: '#c08041' },
        { name: 'Khói Bạc', hex: '#9ca3af' },
        { name: 'Đen Mờ', hex: '#1e1e1e' }
      ]
    },
    {
      id: 'hs-7',
      title: 'Buzz Cut Fade Quân Đội',
      gender: 'Nam',
      styleCategory: 'Buzz Cut',
      matchFaceShapes: ['Square', 'Oval'],
      description: 'Cắt cua ngắn gọn tối đa ôm sát hộp sọ, kết hợp fade mượt mà 2 bên tạo vẻ phong trần, quyền lực, mát mẻ và tôn trọn quai hàm góc cạnh.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      serviceSuggestionId: 'srv-1',
      baseMatchScore: 93,
      suitableColors: [
        { name: 'Đen Mực Tự Nhiên', hex: '#111827' },
        { name: 'Xám Bạc', hex: '#9ca3af' }
      ]
    }
  ],

  // 5. Sản Phẩm Mỹ Phẩm Men's Grooming Chính Hãng (Products)
  products: [
    {
      id: 'prod-1',
      name: 'Sáp Vuốt Tóc Kevin Murphy Rough Rider Clay Wax 100g',
      category: 'Styling / Sáp',
      brand: 'Kevin Murphy Úc',
      price: 680000,
      oldPrice: 750000,
      rating: 4.98,
      image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
      description: 'Độ giữ nếp cực cao Strong Hold cả ngày dài, hoàn thiện mờ tự nhiên Matte Finish, giàu chiết xuất tre và dầu mầm đậu nành bảo vệ tóc.'
    },
    {
      id: 'prod-2',
      name: 'Pomade Gốc Nước Reuzel Blue Water Soluble High Sheen 113g',
      category: 'Pomade Cổ Điển',
      brand: 'Reuzel Hà Lan',
      price: 450000,
      oldPrice: 520000,
      rating: 4.95,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      description: 'Chuyên dụng cho kiểu tóc Pompadour và Slicked Back quý ông, độ bóng High Sheen sang trọng, giữ nếp chắc và dễ dàng gội sạch với nước.'
    },
    {
      id: 'prod-3',
      name: 'Sáp Tạo Phồng Hanz de Fuko Claymation 56g',
      category: 'Styling / Sáp',
      brand: 'Hanz de Fuko USA',
      price: 520000,
      oldPrice: 590000,
      rating: 4.92,
      image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
      description: 'Công thức lai độc quyền giữa Clay và Wax tạo độ phồng tối đa (High Volume) và texture sắc nét, thích hợp với tóc người châu Á.'
    },
    {
      id: 'prod-4',
      name: 'Gôm Xịt Khóa Nếp Kevin Murphy Session Spray 370ml',
      category: 'Gôm Xịt Tóc',
      brand: 'Kevin Murphy Úc',
      price: 620000,
      oldPrice: 690000,
      rating: 4.94,
      image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',
      description: 'Khóa chặt nếp tóc bất chấp gió mạnh và mũ bảo hiểm, không để lại bụi trắng, hương thơm nước hoa nam tính quý phái.'
    },
    {
      id: 'prod-5',
      name: 'Xịt Tạo Phồng & Bảo Vệ Nhiệt By Vilain Sidekick Pre-Styling 155ml',
      category: 'Pre-styling',
      brand: 'By Vilain Đan Mạch',
      price: 480000,
      oldPrice: 540000,
      rating: 4.96,
      image: 'https://images.unsplash.com/photo-1608248597261-833258657640?auto=format&fit=crop&w=600&q=80',
      description: 'Bảo vệ tóc trước nhiệt độ máy sấy lên tới 150°C, tăng độ phồng bồng bềnh và kiểm soát tóc con vào nếp dễ dàng.'
    },
    {
      id: 'prod-6',
      name: 'Dầu Gội Trị Gàu & Ngăn Rụng Tóc Alpecin Caffeine Double Effect 200ml',
      category: 'Dầu Gội Trị Liệu',
      brand: 'Alpecin Đức',
      price: 320000,
      oldPrice: 380000,
      rating: 4.91,
      image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80',
      description: 'Tác động kép: Đánh bay gàu ngứa bã nhờn da đầu nam giới đồng thời phức hợp Caffeine kích thích lưu thông máu và mọc tóc dày khỏe.'
    },
    {
      id: 'prod-7',
      name: 'Tinh Dầu Dưỡng Tóc & Dưỡng Râu Reuzel Beard Serum 50ml',
      category: 'Dưỡng Tóc & Râu',
      brand: 'Reuzel Hà Lan',
      price: 390000,
      oldPrice: 460000,
      rating: 4.97,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
      description: 'Chiết xuất từ tinh dầu hạt argan và vitamin E, cấp ẩm chuyên sâu cho râu và tóc bóng mượt mềm mại, không gây nhờn rít.'
    },
    {
      id: 'prod-8',
      name: 'Bọt Cạo Râu Thảo Dược Khăn Nóng Proraso Eucalyptus & Menthol 300ml',
      category: 'Chăm Sóc Cạo Râu',
      brand: 'Proraso Italy',
      price: 280000,
      oldPrice: 340000,
      rating: 4.99,
      image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80',
      description: 'Công thức cổ điển từ nước Ý với tinh chất bạch đàn và bạc hà sảng khoái, tạo lớp bọt dày bảo vệ da tuyệt đối khỏi trầy xước.'
    }
  ],

  // 6. Quản Lý Tồn Kho Theo Chi Nhánh (Inventory per Branch)
  inventory: [
    // Kevin Murphy Rough Rider (prod-1)
    { id: 'inv-1', productId: 'prod-1', branchId: 'br-1', stock: 35, minAlert: 8 },
    { id: 'inv-2', productId: 'prod-1', branchId: 'br-2', stock: 22, minAlert: 8 },
    { id: 'inv-3', productId: 'prod-1', branchId: 'br-3', stock: 18, minAlert: 8 },

    // Reuzel Blue Pomade (prod-2)
    { id: 'inv-4', productId: 'prod-2', branchId: 'br-1', stock: 28, minAlert: 6 },
    { id: 'inv-5', productId: 'prod-2', branchId: 'br-2', stock: 16, minAlert: 6 },
    { id: 'inv-6', productId: 'prod-2', branchId: 'br-3', stock: 4, minAlert: 6 }, // Cảnh báo thấp!

    // Hanz de Fuko Claymation (prod-3)
    { id: 'inv-7', productId: 'prod-3', branchId: 'br-1', stock: 20, minAlert: 5 },
    { id: 'inv-8', productId: 'prod-3', branchId: 'br-2', stock: 14, minAlert: 5 },
    { id: 'inv-9', productId: 'prod-3', branchId: 'br-3', stock: 9, minAlert: 5 },

    // Kevin Murphy Session Spray (prod-4)
    { id: 'inv-10', productId: 'prod-4', branchId: 'br-1', stock: 19, minAlert: 5 },
    { id: 'inv-11', productId: 'prod-4', branchId: 'br-2', stock: 11, minAlert: 5 },
    { id: 'inv-12', productId: 'prod-4', branchId: 'br-3', stock: 3, minAlert: 5 }, // Cảnh báo thấp!

    // By Vilain Sidekick (prod-5)
    { id: 'inv-13', productId: 'prod-5', branchId: 'br-1', stock: 25, minAlert: 6 },
    { id: 'inv-14', productId: 'prod-5', branchId: 'br-2', stock: 18, minAlert: 6 },
    { id: 'inv-15', productId: 'prod-5', branchId: 'br-3', stock: 12, minAlert: 6 },

    // Alpecin Caffeine (prod-6)
    { id: 'inv-16', productId: 'prod-6', branchId: 'br-1', stock: 30, minAlert: 8 },
    { id: 'inv-17', productId: 'prod-6', branchId: 'br-2', stock: 24, minAlert: 8 },
    { id: 'inv-18', productId: 'prod-6', branchId: 'br-3', stock: 15, minAlert: 8 },

    // Reuzel Beard Serum (prod-7)
    { id: 'inv-19', productId: 'prod-7', branchId: 'br-1', stock: 16, minAlert: 4 },
    { id: 'inv-20', productId: 'prod-7', branchId: 'br-2', stock: 8, minAlert: 4 },
    { id: 'inv-21', productId: 'prod-7', branchId: 'br-3', stock: 2, minAlert: 4 }, // Cảnh báo thấp!

    // Proraso Shaving Foam (prod-8)
    { id: 'inv-22', productId: 'prod-8', branchId: 'br-1', stock: 40, minAlert: 10 },
    { id: 'inv-23', productId: 'prod-8', branchId: 'br-2', stock: 26, minAlert: 10 },
    { id: 'inv-24', productId: 'prod-8', branchId: 'br-3', stock: 20, minAlert: 10 }
  ],

  // 7. Đội Ngũ Barber & Stylist Tóc Nam (Employees / Stylists)
  stylists: [
    {
      id: 'st-1',
      branchId: 'br-1',
      name: 'Kevin Nguyễn',
      role: 'Master Barber & Giám Đốc Sáng Tạo',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      rating: 4.99,
      specialty: 'Cắt tạo form Pompadour, Fade & Phục hình râu quý ông',
      experience: '12 năm kinh nghiệm Barber quốc tế'
    },
    {
      id: 'st-2',
      branchId: 'br-1',
      name: 'Alex Phạm',
      role: 'Perm & Texture Master',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      rating: 4.95,
      specialty: 'Chuyên gia Uốn Con Sâu, Premlock & Uốn Phồng Side Part',
      experience: '8 năm kinh nghiệm tạo kiểu tóc nam'
    },
    {
      id: 'st-3',
      branchId: 'br-2',
      name: 'Dennis Hoàng',
      role: 'Head Barber & Fade Master',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      rating: 4.96,
      specialty: 'Skin Fade sắc sảo, Tattoo Hair & Textured Crop hiện đại',
      experience: '9 năm kinh nghiệm Barbershop'
    },
    {
      id: 'st-4',
      branchId: 'br-3',
      name: 'Tuấn Phong',
      role: 'Senior Barber & Shaving Specialist',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      rating: 4.94,
      specialty: 'Cạo mặt râu khăn nóng truyền thống & Nhuộm tẩy thời trang nam',
      experience: '7 năm kinh nghiệm'
    }
  ],

  // 8. Ca Làm Việc Nhân Viên (Shifts)
  shifts: [
    { id: 'sh-1', branchId: 'br-1', stylistId: 'st-1', stylistName: 'Kevin Nguyễn', date: '2026-09-05', shift: 'Ca Sáng', hours: '08:30 - 14:30', status: 'active' },
    { id: 'sh-2', branchId: 'br-1', stylistId: 'st-2', stylistName: 'Alex Phạm', date: '2026-09-05', shift: 'Ca Chiều', hours: '14:30 - 21:00', status: 'active' },
    { id: 'sh-3', branchId: 'br-2', stylistId: 'st-3', stylistName: 'Dennis Hoàng', date: '2026-09-05', shift: 'Cả Ngày', hours: '09:00 - 20:30', status: 'active' },
    { id: 'sh-4', branchId: 'br-3', stylistId: 'st-4', stylistName: 'Tuấn Phong', date: '2026-09-05', shift: 'Cả Ngày', hours: '08:30 - 20:30', status: 'active' }
  ],

  // 9. Lịch Hẹn Khách Hàng Nam (Bookings)
  bookings: [
    {
      id: 'BK-9801',
      branchId: 'br-1',
      branchName: 'OmniSalon Flagship Barber — Quận 1',
      customerName: 'Nguyễn Văn Hải',
      customerPhone: '0908123456',
      serviceId: 'cmb-1',
      serviceName: 'COMBO GENTLEMAN VIP',
      stylistId: 'st-1',
      stylistName: 'Kevin Nguyễn',
      date: '2026-09-05',
      timeSlot: '10:30',
      totalPrice: 490000,
      hairstyleChoice: 'Modern Undercut Pompadour',
      hairColorChoice: 'Nâu Tây Lạnh',
      status: 'confirmed',
      createdAt: '2026-09-04 14:30',
      review: null
    },
    {
      id: 'BK-9802',
      branchId: 'br-1',
      branchName: 'OmniSalon Flagship Barber — Quận 1',
      customerName: 'Trần Minh Quân',
      customerPhone: '0912987654',
      serviceId: 'srv-2',
      serviceName: 'Nhuộm & Tẩy Màu Thời Trang Phái Mạnh',
      stylistId: 'st-2',
      stylistName: 'Alex Phạm',
      date: '2026-09-05',
      timeSlot: '14:30',
      totalPrice: 650000,
      hairstyleChoice: 'Textured French Crop',
      hairColorChoice: 'Khói Xám Bạc',
      status: 'in_progress',
      createdAt: '2026-09-04 16:15',
      review: null
    },
    {
      id: 'BK-9799',
      branchId: 'br-2',
      branchName: 'OmniSalon Boutique Barber — Thảo Điền',
      customerName: 'Đặng Quốc Tuấn',
      customerPhone: '0933555777',
      serviceId: 'cmb-2',
      serviceName: 'COMBO ĐẾ VƯƠNG TOÀN DIỆN',
      stylistId: 'st-3',
      stylistName: 'Dennis Hoàng',
      date: '2026-09-03',
      timeSlot: '13:30',
      totalPrice: 1150000,
      hairstyleChoice: 'Side Part 7/3 Rủ Hàn Quốc',
      hairColorChoice: 'Nâu Hạt Dẻ',
      status: 'completed',
      createdAt: '2026-09-02 09:20',
      review: {
        rating: 5,
        comment: 'Cắt fade rất bén và tỉ mỉ, cạo râu khăn nóng cực kỳ thư giãn! Uốn phồng chân tóc rất dễ vuốt tại nhà.',
        reviewedAt: '2026-09-03 16:00'
      }
    }
  ],

  // 10. Đơn Bán Hàng Mỹ Phẩm Nam (Sales Orders & POS)
  orders: [
    {
      id: 'ORD-501',
      branchId: 'br-1',
      branchName: 'OmniSalon Flagship Barber — Quận 1',
      customerName: 'Lê Hoàng Long',
      customerPhone: '0988776655',
      items: [
        { productId: 'prod-1', productName: 'Sáp Kevin Murphy Rough Rider', price: 680000, qty: 1 }
      ],
      totalAmount: 680000,
      paymentMethod: 'VietQR / Chuyển Khoản Tức Thì',
      status: 'Completed',
      date: '2026-09-04 11:20'
    },
    {
      id: 'ORD-502',
      branchId: 'br-2',
      branchName: 'OmniSalon Boutique Barber — Thảo Điền',
      customerName: 'Nguyễn Văn Hải',
      customerPhone: '0908123456',
      items: [
        { productId: 'prod-2', productName: 'Pomade Reuzel Blue Water Soluble', price: 450000, qty: 1 }
      ],
      totalAmount: 450000,
      paymentMethod: 'Thẻ POS Tại Quầy',
      status: 'Completed',
      date: '2026-09-04 17:45'
    }
  ],

  // 11. Chương Trình Khuyến Mãi (Promotions & Vouchers)
  promotions: [
    {
      code: 'OMNISALON20',
      discountType: 'percent',
      discountValue: 20, // 20%
      minOrder: 400000,
      expiry: '2026-12-31',
      description: 'Giảm 20% cho đơn dịch vụ hoặc sáp vuốt tóc từ 400.000đ'
    },
    {
      code: 'GENTLEMAN100',
      discountType: 'fixed',
      discountValue: 100000, // 100.000đ
      minOrder: 300000,
      expiry: '2026-12-31',
      description: 'Tặng ngay 100.000đ cho quý ông lần đầu đặt lịch cắt tóc hoặc combo'
    },
    {
      code: 'AITRYON50',
      discountType: 'fixed',
      discountValue: 50000,
      minOrder: 200000,
      expiry: '2026-12-31',
      description: 'Ưu đãi 50.000đ khi đặt lịch ngay sau khi trải nghiệm Tư Vấn Tóc Nam AI 3D'
    }
  ],

  // 12. Lịch Sử Tư Vấn AI Của Khách Nam (Hair Consultations — Quyền riêng tư: Không lưu ảnh gốc)
  hairConsultations: [
    {
      id: 'ai-c-101',
      userId: 'usr-1',
      customerName: 'Nguyễn Văn Hải',
      faceShape: 'Oval',
      skinTone: 'Warm Undertone (Nam Tính)',
      detectedAttributes: { foreheadRatio: 'Cân đối', jawline: 'Góc cạnh nam tính' },
      recommendedStyles: ['Modern Undercut Pompadour', 'Side Part 7/3 Rủ Hàn Quốc'],
      selectedStyle: 'Modern Undercut Pompadour',
      selectedColor: 'Nâu Tây Lạnh',
      matchScore: 98,
      createdAt: '2026-09-04 14:15'
    },
    {
      id: 'ai-c-102',
      userId: 'usr-2',
      customerName: 'Trần Minh Quân',
      faceShape: 'Square',
      skinTone: 'Cool Undertone (Sáng Lạnh)',
      detectedAttributes: { foreheadRatio: 'Vuông vức', jawline: 'Quai hàm chữ điền quyền lực' },
      recommendedStyles: ['Textured French Crop', 'Buzz Cut Fade Quân Đội'],
      selectedStyle: 'Textured French Crop',
      selectedColor: 'Khói Xám Bạc',
      matchScore: 96,
      createdAt: '2026-09-04 16:00'
    }
  ],

  // 13. Hệ Thống Thông Báo Nhắc Lịch & Ưu Đãi (Notifications)
  notifications: [
    {
      id: 'notif-1',
      userId: 'usr-1',
      title: '⏰ Nhắc Lịch Hẹn Quý Ông Hôm Nay',
      content: 'Lịch hẹn làm đẹp [COMBO GENTLEMAN VIP] với Master Barber Kevin Nguyễn tại Chi nhánh Quận 1 sẽ diễn ra lúc 10:30.',
      type: 'appointment_reminder',
      isRead: false,
      createdAt: '2026-09-05 08:00'
    },
    {
      id: 'notif-2',
      userId: 'usr-1',
      title: '✨ Quà Tặng VIP Gentleman Dành Riêng Cho Bạn',
      content: 'Mã giảm giá AITRYON50 đã sẵn sàng trong ví của bạn cho lần thử kiểu tóc tiếp theo!',
      type: 'promo',
      isRead: false,
      createdAt: '2026-09-04 15:00'
    },
    {
      id: 'notif-3',
      userId: 'usr-admin',
      title: '⚠️ Cảnh Báo Tồn Kho Dưới Mức',
      content: 'Sản phẩm Pomade Reuzel Blue tại Chi nhánh Cầu Giấy chỉ còn 4 hộp. Vui lòng nhập hàng bổ sung.',
      type: 'inventory_alert',
      isRead: false,
      createdAt: '2026-09-05 07:30'
    }
  ],

  // 14. Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)
  auditLogs: [
    {
      id: 'log-1',
      timestamp: '2026-09-05 08:15',
      operatorName: 'Quản Lý Barbershop (Admin)',
      action: 'UPDATE_BOOKING_STATUS',
      entity: 'Booking #BK-9801',
      details: 'Chuyển trạng thái lịch hẹn sang: Đã xác nhận (Confirmed)'
    },
    {
      id: 'log-2',
      timestamp: '2026-09-04 16:40',
      operatorName: 'Lê Hoàng Nam (Flagship Manager)',
      action: 'STOCK_REPLENISHMENT',
      entity: 'Inventory #inv-1',
      details: 'Nhập thêm +15 hộp sáp Kevin Murphy Rough Rider tại Chi nhánh Quận 1'
    },
    {
      id: 'log-3',
      timestamp: '2026-09-04 14:00',
      operatorName: 'Quản Lý Barbershop (Admin)',
      action: 'PROMOTION_CREATED',
      entity: 'Promotion #GENTLEMAN100',
      details: 'Tạo voucher ưu đãi GENTLEMAN100 giảm 100.000đ cho quý ông trải nghiệm lần đầu'
    }
  ],

  // 15. Quản Lý Khách Hàng Thân Thiết (Customers CRM)
  customers: [
    {
      id: 'usr-1',
      name: 'Nguyễn Văn Hải',
      email: 'khachhang@gmail.com',
      phone: '0908123456',
      role: 'customer',
      tier: 'VIP Gentleman Diamond',
      totalSpent: 4850000,
      totalVisits: 9,
      lastVisit: '2026-09-05',
      preferredStylist: 'Kevin Nguyễn'
    },
    {
      id: 'usr-2',
      name: 'Trần Minh Quân',
      email: 'minhquan.tran@gmail.com',
      phone: '0912987654',
      role: 'customer',
      tier: 'Gold Member',
      totalSpent: 3200000,
      totalVisits: 5,
      lastVisit: '2026-09-05',
      preferredStylist: 'Alex Phạm'
    },
    {
      id: 'usr-3',
      name: 'Đặng Quốc Tuấn',
      email: 'quoctuan.dang@gmail.com',
      phone: '0933555777',
      role: 'customer',
      tier: 'Platinum Member',
      totalSpent: 6500000,
      totalVisits: 11,
      lastVisit: '2026-09-03',
      preferredStylist: 'Dennis Hoàng'
    }
  ]
};

// Export to window scope for Global SPA Access
window.INITIAL_DATA = INITIAL_DATA;
