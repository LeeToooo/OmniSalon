(function (window) {
  'use strict';

  const AiStudioPage = {
    state: {
      uploadedImage: null,
      originalRawImage: null,
      croppedImage: null,
      activeBaseMode: 'cropped', // 'cropped' | 'raw'
      selectedHairstyle: 'layer-korean',
      activeCategory: 'all', // 'all' | 'short-fade' | 'classic' | 'k-style' | 'perm-wavy' | 'long-rugged'
      selectedFaceShape: 'all', // 'all' | 'square' | 'round' | 'oval' | 'oblong' | 'diamond'
      selectedColor: 'natural-black',
      selectedVolume: 'standard', // 'natural' | 'standard' | 'high'
      selectedFinish: 'matte', // 'matte' | 'gloss'
      customBarberNotes: '',
      isProcessing: false,
      processProgress: 0,
      hasResult: false,
      resultImage: null,
      sliderPosition: 50,
      compareMode: 'split' // 'split' | 'before' | 'after'
    },

    // BỘ SƯU TẬP 28 KIỂU TÓC THỊNH HÀNH CHUẨN BARBERSHOP
    hairstyles: [
      // --- 1. GỌN GÀNG & FADE (7 KIỂU) ---
      {
        id: 'buzzcut-fade',
        name: 'Buzz Cut & High Fade',
        category: 'short-fade',
        tag: 'DỨT KHOÁT',
        faceShape: 'Mặt vuông, Trái xoan, Góc cạnh',
        faceKeys: ['square', 'oval'],
        length: 'Ngắn 1 - 2 cm',
        volume: 'Thấp',
        finish: 'Matte (Mờ tự nhiên)',
        desc: 'Húi cua gọn gàng, viền cạo fade trắng sắc nét tôn trọn vẹn xương hàm và đường nét nam tính.',
        preview: 'assets/hairstyles/buzzcut-fade.jpg',
        result: 'assets/hairstyles/buzzcut-fade.jpg'
      },
      {
        id: 'short-quiff',
        name: 'Short Quiff & Mid Taper',
        category: 'short-fade',
        tag: 'NĂNG ĐỘNG',
        faceShape: 'Mặt tròn, Mặt vuông, Trái xoan',
        faceKeys: ['round', 'square', 'oval'],
        length: 'Ngắn 4 - 6 cm',
        volume: 'Tiêu chuẩn',
        finish: 'Matte Clay',
        desc: 'Mái vuốt ngược ngắn tự nhiên, mai cắt taper gọn gàng, tôn vầng trán sáng sủa và năng động.',
        preview: 'assets/hairstyles/short-quiff.jpg',
        result: 'assets/hairstyles/short-quiff.jpg'
      },
      {
        id: 'french-crop',
        name: 'French Crop Textured',
        category: 'short-fade',
        tag: 'HIỆN ĐẠI',
        faceShape: 'Mặt dài, Trán cao, Trái xoan',
        faceKeys: ['oblong', 'oval'],
        length: 'Ngắn 3 - 5 cm',
        volume: 'Tự nhiên',
        finish: 'Bột tạo phồng / Matte',
        desc: 'Mái bằng textured tỉa nhọn che khuyết điểm trán cao, fade sát 2 bên mai năng động.',
        preview: 'assets/hairstyles/french-crop.jpg',
        result: 'assets/hairstyles/french-crop.jpg'
      },
      {
        id: 'crew-cut',
        name: 'Crew Cut Thể Thao',
        category: 'short-fade',
        tag: 'THỂ THAO',
        faceShape: 'Mặt tròn, Mặt vuông, Trái xoan',
        faceKeys: ['round', 'square', 'oval'],
        length: 'Ngắn 2 - 4 cm',
        volume: 'Gọn gàng',
        finish: 'Sáp nhẹ tự nhiên',
        desc: 'Phom tóc thể thao kinh điển, dễ chăm sóc, vuốt nhẹ là vào nếp chuẩn mực suốt ngày dài.',
        preview: 'assets/hairstyles/french-crop.jpg',
        result: 'assets/hairstyles/french-crop.jpg'
      },
      {
        id: 'mohican-fade',
        name: 'Mohican Ngắn & Sharp Fade',
        category: 'short-fade',
        tag: 'BỤI BẶM',
        faceShape: 'Mặt tròn, Mặt vuông',
        faceKeys: ['round', 'square'],
        length: 'Ngắn 3 - 5 cm',
        volume: 'Vuốt nhọn',
        finish: 'Matte Wax',
        desc: 'Mái vuốt nhọn hướng về trước, hai bên cạo fade trắng dứt khoát và đậm chất cá tính.',
        preview: 'assets/hairstyles/mohican-fade.jpg',
        result: 'assets/hairstyles/mohican-fade.jpg'
      },
      {
        id: 'high-tight',
        name: 'High & Tight Quân Đội',
        category: 'short-fade',
        tag: 'MẠNH MẼ',
        faceShape: 'Mặt vuông, Kim cương',
        faceKeys: ['square', 'diamond'],
        length: 'Ngắn 1 - 3 cm',
        volume: 'Cực gọn',
        finish: 'Tự nhiên',
        desc: 'Cắt sát cao 2 bên đỉnh đầu, giữ lại phần chỏm tóc ngắn sắc nét, tôn phong thái kỷ luật, đĩnh đạc.',
        preview: 'assets/hairstyles/buzzcut-fade.jpg',
        result: 'assets/hairstyles/buzzcut-fade.jpg'
      },
      {
        id: 'buzzcut-line',
        name: 'Buzz Cut Kẻ Line Nghệ Thuật',
        category: 'short-fade',
        tag: 'CÁ TÍNH',
        faceShape: 'Mặt góc cạnh, Trái xoan',
        faceKeys: ['square', 'oval'],
        length: 'Ngắn 1 - 2 cm',
        volume: 'Thấp',
        finish: 'Matte',
        desc: 'Húi cua sắc nét kết hợp đường tattoo kẻ line dứt khoát bên vành tai mang phong cách thời thượng.',
        preview: 'assets/hairstyles/buzzcut-fade.jpg',
        result: 'assets/hairstyles/buzzcut-fade.jpg'
      },

      // --- 2. QUÝ ÔNG & CỔ ĐIỂN (7 KIỂU) ---
      {
        id: 'sidepart-gentleman',
        name: 'Side Part 7/3 Cổ Điển',
        category: 'classic',
        tag: 'QUÝ ÔNG',
        faceShape: 'Mặt vuông, Trái xoan, Mặt dài',
        faceKeys: ['square', 'oval', 'oblong'],
        length: 'Trung bình 6 - 8 cm',
        volume: 'Tiêu chuẩn',
        finish: 'Pomade Gốc Nước',
        desc: 'Đường rẽ ngôi tỉ lệ vàng 7/3 tôn khuôn mặt, dễ dàng chải sáp restyle lịch lãm suốt cả ngày làm việc.',
        preview: 'assets/hairstyles/sidepart-gentleman.jpg',
        result: 'assets/hairstyles/sidepart-gentleman.jpg'
      },
      {
        id: 'pompadour-luxury',
        name: 'Pompadour & Mid Fade',
        category: 'classic',
        tag: 'LỊCH LÃM',
        faceShape: 'Mặt tròn, Mặt vuông, Trái xoan',
        faceKeys: ['round', 'square', 'oval'],
        length: 'Trung bình 8 - 10 cm',
        volume: 'Bồng bềnh cao',
        finish: 'Pomade Bóng / Clay',
        desc: 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên mang lại phong thái doanh nhân đĩnh đạc.',
        preview: 'assets/hairstyles/pompadour-luxury.jpg',
        result: 'assets/hairstyles/pompadour-luxury.jpg'
      },
      {
        id: 'ivy-league',
        name: 'Ivy League Hiện Đại',
        category: 'classic',
        tag: 'DOANH NHÂN',
        faceShape: 'Mặt vuông, Trái xoan, Mặt tròn',
        faceKeys: ['square', 'oval', 'round'],
        length: 'Ngắn - Vừa 4 - 6 cm',
        volume: 'Vừa phải',
        finish: 'Pomade Mờ / Sáp Cream',
        desc: 'Phom tóc giới thượng lưu Mỹ kết hợp fade đương đại, mái vuốt lệch nhẹ tạo vẻ chững chạc, thành đạt.',
        preview: 'assets/hairstyles/ivy-league.jpg',
        result: 'assets/hairstyles/ivy-league.jpg'
      },
      {
        id: 'undercut-slick',
        name: 'Undercut Slicked Back',
        category: 'classic',
        tag: 'QUYỀN LỰC',
        faceShape: 'Mặt vuông, Mặt dài',
        faceKeys: ['square', 'oblong'],
        length: 'Trung bình 8 - 12 cm',
        volume: 'Mượt mà',
        finish: 'Classic Pomade',
        desc: 'Cạo sát 2 bên mai (Skin Fade), tóc đỉnh đầu vuốt mượt bóng ra sau thể hiện quyền lực và cuốn hút.',
        preview: 'assets/hairstyles/undercut-slick.jpg',
        result: 'assets/hairstyles/undercut-slick.jpg'
      },
      {
        id: 'slick-back-classic',
        name: 'Classic Slick Back Fade',
        category: 'classic',
        tag: 'CỔ ĐIỂN',
        faceShape: 'Mặt vuông, Kim cương',
        faceKeys: ['square', 'diamond'],
        length: 'Trung bình 7 - 9 cm',
        volume: 'Mượt ôm đầu',
        finish: 'Pomade Bóng Nhẹ',
        desc: 'Chải mượt ôm trọn vòm đầu về phía sau, kết hợp đường fade mượt mà chuẩn Barbershop truyền thống.',
        preview: 'assets/hairstyles/undercut-slick.jpg',
        result: 'assets/hairstyles/undercut-slick.jpg'
      },
      {
        id: 'sidepart-82',
        name: 'Side Part 8/2 Học Đường',
        category: 'classic',
        tag: 'TRẺ TRUNG',
        faceShape: 'Mặt trái xoan, Mặt tròn',
        faceKeys: ['oval', 'round'],
        length: 'Trung bình 6 - 8 cm',
        volume: 'Tự nhiên',
        finish: 'Sáp Giữ Nếp Tự Nhiên',
        desc: 'Ngôi 8/2 mềm mại, mái đổ tự nhiên sang một bên mang lại vẻ thư sinh, thanh lịch chuẩn công sở.',
        preview: 'assets/hairstyles/sidepart-gentleman.jpg',
        result: 'assets/hairstyles/sidepart-gentleman.jpg'
      },
      {
        id: 'executive-contour',
        name: 'Executive Contour Doanh Nhân',
        category: 'classic',
        tag: 'ĐẲNG CẤP',
        faceShape: 'Mặt vuông, Mặt dài',
        faceKeys: ['square', 'oblong'],
        length: 'Trung bình 7 - 9 cm',
        volume: 'Tiêu chuẩn',
        finish: 'Pomade Gốc Dầu / Nước',
        desc: 'Đường rẽ ngôi cạo chỉ (Hard Part) sắc sảo, chải ôm nếp bóng mượt chuẩn mực tiệc tối và sự kiện cao cấp.',
        preview: 'assets/hairstyles/pompadour-luxury.jpg',
        result: 'assets/hairstyles/pompadour-luxury.jpg'
      },

      // --- 3. K-STYLE & TRẺ TRUNG (6 KIỂU) ---
      {
        id: 'layer-korean',
        name: 'Layer Texture Hàn Quốc',
        category: 'k-style',
        tag: 'THỜI THƯỢNG',
        faceShape: 'Mặt dài, Mặt gầy, Trái xoan',
        faceKeys: ['oblong', 'oval'],
        length: 'Trung bình 7 - 10 cm',
        volume: 'Bồng bềnh',
        finish: 'Clay Mờ / Xịt Phồng',
        desc: 'Tỉa tầng bay bổng, uốn texture tạo độ phồng tự nhiên giúp gương mặt hài hòa và đầy đặn hơn.',
        preview: 'assets/hairstyles/layer-korean.jpg',
        result: 'assets/hairstyles/layer-korean.jpg'
      },
      {
        id: 'two-block',
        name: 'Two-Block 6/4 Lãng Tử',
        category: 'k-style',
        tag: 'K-STYLE IDOL',
        faceShape: 'Mặt tròn, Trái xoan, Vuông',
        faceKeys: ['round', 'oval', 'square'],
        length: 'Trung bình 8 - 11 cm',
        volume: 'Bồng bềnh',
        finish: 'Sáp Vuốt Nhẹ / Gôm',
        desc: 'Phần mai và gáy tỉa gọn, phần trên để dài rẽ ngôi 6/4 bồng bềnh chuẩn phong cách sao Hàn.',
        preview: 'assets/hairstyles/two-block.jpg',
        result: 'assets/hairstyles/two-block.jpg'
      },
      {
        id: 'comma-hair',
        name: 'Comma Hair (Mái Dấu Phẩy)',
        category: 'k-style',
        tag: 'LÃNG TỬ',
        faceShape: 'Mặt trái xoan, Mặt dài',
        faceKeys: ['oval', 'oblong'],
        length: 'Trung bình 7 - 9 cm',
        volume: 'Tiêu chuẩn',
        finish: 'Gôm Xịt Giữ Nếp Mái',
        desc: 'Phần mái uốn cong hình dấu phẩy tinh tế ôm nhẹ vầng trán, tạo điểm nhấn thu hút và thanh thoát.',
        preview: 'assets/hairstyles/two-block.jpg',
        result: 'assets/hairstyles/two-block.jpg'
      },
      {
        id: 'curtain-hair',
        name: 'Curtain Hair 5/5 Lãng Mạn',
        category: 'k-style',
        tag: 'NGHỆ THUẬT',
        faceShape: 'Mặt vuông góc cạnh, Trái xoan',
        faceKeys: ['square', 'oval'],
        length: 'Trung bình 9 - 12 cm',
        volume: 'Rủ tự nhiên',
        finish: 'Tinh Dầu Dưỡng / Sáp Kem',
        desc: 'Rẽ ngôi giữa 5/5 bồng bềnh uốn sóng nhẹ rủ 2 bên gò má, mang đậm chất nghệ sĩ lãng tử.',
        preview: 'assets/hairstyles/layer-korean.jpg',
        result: 'assets/hairstyles/layer-korean.jpg'
      },
      {
        id: 'mullet-modern',
        name: 'Modern Mullet & Taper Fade',
        category: 'k-style',
        tag: 'PHONG CÁCH',
        faceShape: 'Mặt trái xoan, Mặt tròn, Kim cương',
        faceKeys: ['oval', 'round', 'diamond'],
        length: 'Đỉnh 7cm, Gáy 10cm',
        volume: 'Đầy đặn',
        finish: 'Matte Paste',
        desc: 'Gáy tỉa so le dài mềm mại kết hợp đường cạo viền taper dứt khoát, dẫn đầu xu hướng giới trẻ.',
        preview: 'assets/hairstyles/mullet-modern.jpg',
        result: 'assets/hairstyles/mullet-modern.jpg'
      },
      {
        id: 'drop-fade-mullet',
        name: 'Drop Fade Mullet Cá Tính',
        category: 'k-style',
        tag: 'CỰC CHẤT',
        faceShape: 'Mặt tròn, Góc cạnh',
        faceKeys: ['round', 'square'],
        length: 'Đỉnh 6cm, Gáy 9cm',
        volume: 'Tiêu chuẩn',
        finish: 'Clay Giữ Nếp Cao',
        desc: 'Đường fade cong vòng qua sau tai tạo độ chuyển mượt mà kết hợp đuôi mullet bay bổng nổi bật.',
        preview: 'assets/hairstyles/mullet-modern.jpg',
        result: 'assets/hairstyles/mullet-modern.jpg'
      },

      // --- 4. UỐN TEXTURE & XOĂN (5 KIỂU) ---
      {
        id: 'ripple-perm',
        name: 'Uốn Con Sâu / Ripple Curls',
        category: 'perm-wavy',
        tag: 'CÁ TÍNH',
        faceShape: 'Mặt gầy, Mặt dài, Trái xoan',
        faceKeys: ['oblong', 'oval'],
        length: 'Trung bình 7 - 9 cm',
        volume: 'Bồng bềnh cao',
        finish: 'Bọt Tạo Sóng / Dưỡng Ẩm',
        desc: 'Tóc uốn sóng lượn dập xù ziczac cá tính, tạo kết cấu bồng bềnh và độ dày phồng tối đa cho tóc mỏng.',
        preview: 'assets/hairstyles/ripple-perm.jpg',
        result: 'assets/hairstyles/ripple-perm.jpg'
      },
      {
        id: 'curly-undercut',
        name: 'Curly Undercut Bồng Bềnh',
        category: 'perm-wavy',
        tag: 'ẤN TƯỢNG',
        faceShape: 'Mặt vuông, Mặt tròn',
        faceKeys: ['square', 'round'],
        length: 'Trung bình 8 - 10 cm',
        volume: 'Xoăn lượn sóng',
        finish: 'Kem Uốn Định Hình',
        desc: 'Mai cạo fade gọn làm nổi bật từng lọn xoăn lượn sóng trên đỉnh đầu, phong cách vừa ngầu vừa lãng mạn.',
        preview: 'assets/hairstyles/ripple-perm.jpg',
        result: 'assets/hairstyles/ripple-perm.jpg'
      },
      {
        id: 'perm-fly',
        name: 'Uốn Fly Texture Bay Bổng',
        category: 'perm-wavy',
        tag: 'BAY BỔNG',
        faceShape: 'Mặt dài, Trán cao',
        faceKeys: ['oblong'],
        length: 'Trung bình 6 - 8 cm',
        volume: 'Bay ngọn',
        finish: 'Bột Phồng / Clay Mờ',
        desc: 'Tỉa so le nhẹ và uốn bay ngọn tóc tạo cảm giác tóc chuyển động tự do theo gió tự nhiên.',
        preview: 'assets/hairstyles/layer-korean.jpg',
        result: 'assets/hairstyles/layer-korean.jpg'
      },
      {
        id: 'premlock',
        name: 'Uốn Premlock Cá Tính',
        category: 'perm-wavy',
        tag: 'ĐỘT PHÁ',
        faceShape: 'Mặt tròn, Góc cạnh',
        faceKeys: ['round', 'square'],
        length: 'Ngắn - Vừa 4 - 7 cm',
        volume: 'Dày đặc',
        finish: 'Xịt Dưỡng Ẩm Afro',
        desc: 'Kỹ thuật uốn xoăn tít châu Phi cực chất, sợi tóc đan chặt tạo độ xù dày dặn khác biệt hoàn toàn.',
        preview: 'assets/hairstyles/ripple-perm.jpg',
        result: 'assets/hairstyles/ripple-perm.jpg'
      },
      {
        id: 'messy-quiff',
        name: 'Messy Quiff Uốn Phồng',
        category: 'perm-wavy',
        tag: 'PHÓNG KHOÁNG',
        faceShape: 'Mặt vuông, Tròn, Trái xoan',
        faceKeys: ['square', 'round', 'oval'],
        length: 'Trung bình 6 - 8 cm',
        volume: 'Phồng bung lọn',
        finish: 'Matte Clay',
        desc: 'Uốn phồng chân tóc nhẹ giúp mái vuốt ngược bung lọn tự nhiên không bị đơ cứng, đẹp bất chấp gió bụi.',
        preview: 'assets/hairstyles/short-quiff.jpg',
        result: 'assets/hairstyles/short-quiff.jpg'
      },

      // --- 5. DÀI & PHONG TRẦN (3 KIỂU) ---
      {
        id: 'wolf-cut',
        name: 'Wolf Cut Phong Trần',
        category: 'long-rugged',
        tag: 'PHONG TRẦN',
        faceShape: 'Mặt góc cạnh, Mặt dài, Trái xoan',
        faceKeys: ['square', 'oblong', 'oval'],
        length: 'Dài 12 - 16 cm',
        volume: 'Tầng so le',
        finish: 'Tinh Dầu Dưỡng Tự Nhiên',
        desc: 'Sự pha trộn giữa Shag và Mullet với các lớp tỉa so le dài phóng khoáng, đậm chất nghệ sĩ phong trần.',
        preview: 'assets/hairstyles/mullet-modern.jpg',
        result: 'assets/hairstyles/mullet-modern.jpg'
      },
      {
        id: 'man-bun-undercut',
        name: 'Man Bun & Undercut Nghệ Sĩ',
        category: 'long-rugged',
        tag: 'NGHỆ SĨ',
        faceShape: 'Mặt chữ điền, Xương hàm nét',
        faceKeys: ['square'],
        length: 'Dài trên 15 cm',
        volume: 'Búi cao',
        finish: 'Dây Cột & Wax Nhẹ',
        desc: 'Tóc búi cao nam tính trên đỉnh đầu kết hợp cạo sát gáy và mai sắc nét, toát lên khí chất đỉnh cao.',
        preview: 'assets/hairstyles/undercut-slick.jpg',
        result: 'assets/hairstyles/undercut-slick.jpg'
      },
      {
        id: 'long-wavy-surfer',
        name: 'Long Wavy Surfer Sóng Biển',
        category: 'long-rugged',
        tag: 'TỰ DO',
        faceShape: 'Mặt trái xoan, Mặt dài',
        faceKeys: ['oval', 'oblong'],
        length: 'Dài 14 - 18 cm',
        volume: 'Sóng lượn',
        finish: 'Muối Biển Sea Salt Spray',
        desc: 'Mái tóc dài ngang cằm uốn sóng lượn tự nhiên như sau buổi lướt sóng biển, tự do và cuốn hút.',
        preview: 'assets/hairstyles/layer-korean.jpg',
        result: 'assets/hairstyles/layer-korean.jpg'
      }
    ],

    // BẢNG 8 MÀU NHUỘM TÔN DA NAM GIỚI CHUẨN SALON
    hairColors: [
      { id: 'natural-black', name: 'Đen Tự Nhiên', hex: '#141413', desc: 'Lịch thiệp, chuẩn mực công sở' },
      { id: 'cold-ash-brown', name: 'Nâu Lạnh Sâu', hex: '#523A28', desc: 'Sáng da, không cần tẩy tóc' },
      { id: 'titan-grey', name: 'Xám Khói Titan', hex: '#6B7280', desc: 'Ánh kim khói thời thượng' },
      { id: 'nordic-platinum', name: 'Vàng Cát Trầm', hex: '#C59B27', desc: 'Ấm áp, tôn đường sóng uốn' },
      { id: 'chestnut-brown', name: 'Nâu Hạt Dẻ', hex: '#6F4E37', desc: 'Nhẹ nhàng, tôn làn da nam Á Đông' },
      { id: 'moss-ash', name: 'Rêu Khói Ánh Xanh', hex: '#4A5568', desc: 'Phá cách, cuốn hút hiện đại' },
      { id: 'caramel-mocha', name: 'Nâu Mocha Caramel', hex: '#8B5A2B', desc: 'Trầm ấm, ngọt ngào lịch lãm' },
      { id: 'pure-platinum', name: 'Bạch Kim Khói', hex: '#E5E7EB', desc: 'Nổi bật, phong cách idol' }
    ],

    // MẪU ẢNH CHÂN DUNG THỬ NHANH
    demoPortraits: [
      { name: 'Mẫu 01 (Side Part)', url: 'assets/hairstyles/sidepart-gentleman.jpg' },
      { name: 'Mẫu 02 (Pompadour)', url: 'assets/hairstyles/pompadour-luxury.jpg' },
      { name: 'Mẫu 03 (Layer Hàn)', url: 'assets/hairstyles/layer-korean.jpg' },
      { name: 'Mẫu 04 (Mullet)', url: 'assets/hairstyles/mullet-modern.jpg' },
      { name: 'Mẫu 05 (Short Quiff)', url: 'assets/hairstyles/short-quiff.jpg' },
      { name: 'Mẫu 06 (Two-Block)', url: 'assets/hairstyles/two-block.jpg' }
    ],

    // DỮ LIỆU TƯ VẤN KHUÔN MẶT TỪ BARBER MASTER
    faceConsultantMap: {
      all: {
        title: 'Tư Vấn Tổng Quan Mọi Khuôn Mặt',
        desc: 'Mỗi đường nét xương hàm và vòm trán đều có phom tóc hoàn hảo tương ứng. Hãy chọn dáng mặt của bạn bên dưới để nhận gợi ý chuẩn nhất từ Barber Master.'
      },
      square: {
        title: 'Mặt Vuông Chữ Điền (Nam Tính & Quyền Lực)',
        desc: 'Góc hàm sắc nét nam tính, vòm trán rộng vững chãi. Phù hợp tuyệt vời với các phom tóc cổ điển lịch lãm: Side Part 7/3, Pompadour, Undercut hoặc Buzz Cut Fade.'
      },
      round: {
        title: 'Mặt Tròn (Đầy Đặn & Trẻ Trung)',
        desc: 'Chiều ngang và chiều dọc gương mặt tương đương nhau. Nên ưu tiên các kiểu tóc vuốt dựng có độ phồng cao như Short Quiff, Pompadour, High Fade 2 bên để kéo dài khuôn mặt.'
      },
      oval: {
        title: 'Mặt Trái Xoan (Tỉ Lệ Vàng Cân Đối)',
        desc: 'Gương mặt tỉ lệ vàng lý tưởng của nam giới. Bạn có thể tự tin diện hầu hết mọi phom tóc từ Layer Hàn Quốc, Two-Block bồng bềnh đến Side Part hay Buzz Cut.'
      },
      oblong: {
        title: 'Mặt Dài & Trán Cao',
        desc: 'Chiều dài mặt lớn hơn chiều ngang. Khuyên dùng các phom tóc có mái rủ như French Crop Textured, Layer nhẹ hoặc Curtain Hair để cân đối lại chiều cao khuôn mặt.'
      },
      diamond: {
        title: 'Mặt Kim Cương (Gò Má Cao)',
        desc: 'Gò má rộng trong khi trán và cằm hẹp. Các kiểu tóc uốn xoăn bồng bềnh như Ripple Perm, Modern Mullet hoặc Messy Quiff sẽ làm mềm đường nét gò má cực kỳ hiệu quả.'
      }
    },

    render(container, params = {}) {
      if (!container) return;

      // Mặc định nạp ảnh mẫu đầu tiên nếu chưa có
      if (!this.state.uploadedImage) {
        this.state.uploadedImage = this.demoPortraits[0].url;
        this.state.originalRawImage = this.demoPortraits[0].url;
      }

      container.innerHTML = `
        <div class="omni-container" style="padding-top: 40px; padding-bottom: 80px; max-width: 1440px; margin: 0 auto; padding-left: clamp(16px, 3.5vw, 48px); padding-right: clamp(16px, 3.5vw, 48px); box-sizing: border-box;">
          
          <!-- Header Hero Chuyên Nghiệp (Không AI Phô Trương) -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; background: rgba(197, 155, 39, 0.12); border: 1px solid rgba(197, 155, 39, 0.35); border-radius: 20px; margin-bottom: 12px;">
              <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                OMNISALON BARBERSHOP LOOKBOOK &amp; STYLING STUDIO
              </span>
            </div>
            <h1 class="font-serif tracking-tight leading-tight" style="font-size: clamp(28px, 4vw, 42px); font-weight: 700; color: var(--text-primary); margin: 0 0 10px;">
              THỬ KIỂU TÓC &amp; TẠO MẪU TÓC NAM CHUYÊN NGHIỆP
            </h1>
            <p style="font-size: 14.5px; color: var(--text-secondary); max-width: 720px; margin: 0 auto; line-height: 1.6;">
              Bộ sưu tập 28 kiểu tóc nam thịnh hành, phối màu nhuộm và nếp sáp chuẩn salon giúp bạn chọn phom dáng hoàn hảo nhất trước khi bước vào ghế cắt.
            </p>
          </div>

          <!-- Studio Main Grid: 2 Cột Đối Xứng Cân Đối -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 28px; max-width: 1260px; margin: 0 auto; align-items: start;">
            
            <!-- CỘT TRÁI: KHUNG ẢNH CHÂN DUNG & SO SÁNH SLIDER TRỰC QUAN -->
            <div class="ai-studio-panel" style="border-radius: 8px; padding: 22px; background: var(--surface-card); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
              
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                  ẢNH CHÂN DUNG CỦA BẠN
                </span>
                <span id="aiUploadStatusBadge" style="font-size: 11.5px; color: #10B981; font-weight: 700;">
                  ● ${this.state.uploadedImage ? 'Ảnh chân dung sẵn sàng' : 'Chưa có ảnh'}
                </span>
              </div>

              <!-- THANH CĂN CHỈNH GÓC CHÂN DUNG (GIỮ NGUYÊN TÓC THẬT) -->
              <div id="aiPreprocessBar" style="background: rgba(197, 155, 39, 0.08); border: 1px solid rgba(197, 155, 39, 0.25); border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                  <span style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    Tỉ Lệ Khung Hình Chân Dung
                  </span>
                  <span style="font-size: 11px; font-weight: 700; color: #10B981;">
                    ● Tiêu chuẩn Studio Barbershop
                  </span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <button type="button" id="btnBaseModeCropped" onclick="AiStudioPage.switchBaseMode('cropped')" 
                          title="Tỉ lệ 3:4 chuẩn chân dung studio"
                          style="padding: 8px 10px; border-radius: 5px; font-size: 11.5px; font-weight: 800; cursor: pointer; border: 1px solid #C59B27; background: #C59B27; color: #141413; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s ease;">
                    <span>Tỉ lệ 3:4 chuẩn Studio</span>
                  </button>
                  <button type="button" id="btnBaseModeRaw" onclick="AiStudioPage.switchBaseMode('raw')" 
                          title="Xem lại ảnh gốc nguyên bản ban đầu"
                          style="padding: 8px 10px; border-radius: 5px; font-size: 11.5px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s ease;">
                    <span>Ảnh gốc ban đầu</span>
                  </button>
                </div>
              </div>

              <!-- Dropzone & Viewport bọc ảnh -->
              <div id="aiNativeDropZone" 
                   ondragover="event.preventDefault(); this.style.borderColor='#C59B27';"
                   ondragleave="this.style.borderColor='var(--border-color)';"
                   ondrop="AiStudioPage.handleDrop(event)"
                   style="position: relative; border: 1.5px dashed var(--border-color); border-radius: 8px; background: var(--surface-elevated, #141413); overflow: hidden; min-height: 420px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                
                <!-- Input file ẩn để kích hoạt qua nút hoặc nhấp ô tải -->
                <input type="file" id="aiStudioFileInput" accept="image/*" 
                       onchange="AiStudioPage.handleFileSelected(event)"
                       style="display: none;" />

                <!-- Khung hiển thị ảnh có hỗ trợ So sánh Split-Slider mượt mà -->
                <div id="aiPortraitViewport" 
                     onmousedown="AiStudioPage.handleViewportMouseDown(event)"
                     ontouchstart="AiStudioPage.handleViewportTouchStart(event)"
                     style="position: relative; width: 100%; height: 460px; overflow: hidden; display: ${this.state.uploadedImage ? 'block' : 'none'}; user-select: none; cursor: ${this.state.hasResult ? 'ew-resize' : 'default'}; touch-action: none;">
                  
                  <!-- ẢNH KẾT QUẢ KIỂU TÓC MỚI (NẰM DƯỚI) -->
                  <img id="aiResultPortrait" 
                       src="${this.state.resultImage || ''}" 
                       alt="Kiểu tóc mới" 
                       draggable="false"
                       style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; display: ${this.state.hasResult ? 'block' : 'none'}; pointer-events: none; user-select: none;">

                  <!-- ẢNH GỐC CỦA NGƯỜI DÙNG (CÓ CLIP NẾU ĐANG CHẾ ĐỘ SLIDER) -->
                  <div id="aiBeforeClipper" style="position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; clip-path: inset(0 ${this.state.hasResult ? (100 - this.state.sliderPosition) + '%' : '0%'} 0 0); z-index: 3; pointer-events: none;">
                    <img id="aiSourcePortrait" 
                         src="${this.state.uploadedImage || ''}" 
                         alt="Chân dung gốc" 
                         draggable="false"
                         style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; pointer-events: none; user-select: none;">
                  </div>

                  <!-- THANH TRƯỢT SO SÁNH INTERACTIVE SLIDER DIVIDER (Vùng chạm 44px dễ kéo) -->
                  <div id="aiCompareSliderDivider" 
                       onmousedown="AiStudioPage.startSliderDrag(event)"
                       ontouchstart="AiStudioPage.startSliderDragTouch(event)"
                       style="display: ${this.state.hasResult ? 'flex' : 'none'}; position: absolute; top: 0; bottom: 0; left: ${this.state.sliderPosition}%; width: 44px; margin-left: -22px; z-index: 8; align-items: center; justify-content: center; cursor: ew-resize; touch-action: none;">
                    <div style="position: absolute; top: 0; bottom: 0; width: 2.5px; background: #C59B27; box-shadow: 0 0 10px rgba(0,0,0,0.6); pointer-events: none;"></div>
                    <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #C59B27; color: #141413; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; box-shadow: 0 2px 10px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.8); pointer-events: none;">
                      ⇄
                    </div>
                  </div>

                  <!-- OVERLAY XỬ LÝ THANH LỊCH (KHÔNG CÓ LASER/RADAR SCI-FI) -->
                  <div id="aiScanHudModal" style="display: none; position: absolute; inset: 0; background: rgba(20, 20, 19, 0.88); backdrop-filter: blur(4px); flex-direction: column; align-items: center; justify-content: center; z-index: 15; padding: 24px; text-align: center;">
                    <div style="width: 42px; height: 42px; border: 3px solid rgba(255,255,255,0.15); border-top-color: #C59B27; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 14px;"></div>
                    <div class="font-serif tracking-tight leading-tight" style="font-size: 16px; font-weight: 700; color: #FAF8F5;" id="aiScanHudTitle">ĐANG TẠO PHOM TÓC TRÊN KHUÔN MẶT BẠN...</div>
                    <div style="font-size: 12.5px; color: #A1A1AA; margin-top: 6px; max-width: 300px;" id="aiScanHudSub">Đang điều chỉnh góc nghiêng và hòa sắc màu nhuộm...</div>
                    <div style="width: 220px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 16px; overflow: hidden;">
                      <div id="aiScanHudProgress" style="height: 100%; width: 0%; background: #C59B27; transition: width 0.2s ease;"></div>
                    </div>
                  </div>

                  <!-- BADGE TRẠNG THÁI GÓC ẢNH -->
                  <div id="aiViewBadgeBefore" style="display: ${this.state.hasResult ? 'block' : 'none'}; position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.8); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 10.5px; font-weight: 800; z-index: 5; border: 1px solid rgba(255,255,255,0.2); pointer-events: none;">
                    ẢNH GỐC
                  </div>
                  <div id="aiViewBadgeAfter" style="display: ${this.state.hasResult ? 'block' : 'none'}; position: absolute; bottom: 12px; right: 12px; background: #C59B27; color: #141413; padding: 4px 10px; border-radius: 4px; font-size: 10.5px; font-weight: 800; z-index: 5; box-shadow: 0 2px 8px rgba(0,0,0,0.4); pointer-events: none;">
                    KIỂU TÓC MỚI
                  </div>
                </div>

                <!-- Empty state khi chưa có ảnh -->
                <div id="aiEmptyUploadUI" 
                     onclick="AiStudioPage.triggerFileInput()"
                     style="display: ${this.state.uploadedImage ? 'none' : 'flex'}; cursor: pointer; flex-direction: column; align-items: center; justify-content: center; padding: 32px; text-align: center;">
                  <div style="width: 44px; height: 44px; margin-bottom: 12px; color: var(--text-muted); display: flex; align-items: center; justify-content: center;">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <h4 style="font-size: 15px; font-weight: 700; margin: 0 0 6px;">Kéo thả hoặc nhấp để chọn ảnh chân dung</h4>
                  <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0 0 14px;">Hỗ trợ ảnh chụp camera trước hoặc tệp JPG/PNG</p>
                </div>
              </div>

              <!-- Nút tải ảnh & Chụp Camera -->
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button type="button" onclick="AiStudioPage.triggerFileInput()" class="nordic-btn-secondary" style="flex: 1; padding: 10px 14px; font-size: 12.5px; font-weight: 700; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <span>Tải ảnh từ thiết bị</span>
                </button>
                <button type="button" onclick="AiStudioPage.openCameraModal()" class="nordic-btn-secondary" style="flex: 1; padding: 10px 14px; font-size: 12.5px; font-weight: 700; background: var(--surface-elevated); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <span>Chụp bằng camera</span>
                </button>
              </div>

              <!-- Thanh nút So sánh Trước / Sau -->
              <div id="aiCompareControls" style="display: ${this.state.hasResult ? 'flex' : 'none'}; align-items: center; justify-content: space-between; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 14px;">
                <span style="font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Chế Độ Xem:</span>
                <div style="display: flex; gap: 6px;">
                  <button type="button" id="btnModeSplit" onclick="AiStudioPage.setCompareMode('split')" style="background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer;">
                    Thanh Trượt ⇄
                  </button>
                  <button type="button" id="btnModeBefore" onclick="AiStudioPage.setCompareMode('before')" style="background: var(--surface-card); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer;">
                    Ảnh Gốc
                  </button>
                  <button type="button" id="btnModeAfter" onclick="AiStudioPage.setCompareMode('after')" style="background: var(--surface-card); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer;">
                    Kiểu Tóc Mới
                  </button>
                </div>
              </div>

              <!-- CHỌN ẢNH MẪU CHÂN DUNG CÓ SẴN -->
              <div>
                <span class="tracking-widest" style="font-size: 10.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 8px;">
                  HOẶC THỬ NHANH VỚI ẢNH MẪU:
                </span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${this.demoPortraits.map(dp => `
                    <button type="button" onclick="AiStudioPage.selectDemoPortrait('${dp.url}')" style="display: flex; align-items: center; gap: 6px; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 4px; padding: 5px 9px; cursor: pointer; color: var(--text-primary); font-size: 11.5px; font-weight: 600;">
                      <img src="${dp.url}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;" alt="${dp.name}">
                      <span>${dp.name}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

            </div>

            <!-- CỘT PHẢI: BỘ SƯU TẬP 28 KIỂU TÓC + TƯ VẤN KHUÔN MẶT + TÙY CHỈNH TẠO KIỂU -->
            <div class="ai-studio-panel" style="border-radius: 8px; padding: 22px; background: var(--surface-card); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
              
              <!-- KHỐI TƯ VẤN PHOM TÓC THEO DÁNG MẶT TỪ BARBER MASTER -->
              <div id="aiFaceDiagnosticBox" style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                  <span style="font-size: 11px; font-weight: 800; color: #C59B27; letter-spacing: 0.5px; text-transform: uppercase;">
                    TƯ VẤN PHOM TÓC THEO DÁNG MẶT
                  </span>
                  <span id="aiFaceShapeBadge" style="font-size: 11px; background: #C59B27; color: #141413; font-weight: 800; padding: 2px 8px; border-radius: 4px;">
                    MẶT VUÔNG CHỮ ĐIỀN
                  </span>
                </div>
                
                <div id="aiFaceDiagnosticText" style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
                  Góc hàm sắc nét nam tính, vòm trán rộng vững chãi. Phù hợp tuyệt vời với các phom tóc cổ điển lịch lãm: Side Part 7/3, Pompadour, Undercut hoặc Buzz Cut Fade.
                </div>

                <!-- BỘ CHỌN NHANH DÁNG MẶT CỦA BẠN -->
                <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
                  <button type="button" class="ai-faceshape-pill-btn" data-shape="all" onclick="AiStudioPage.selectFaceShape('all')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); cursor: pointer;">
                    Tất cả
                  </button>
                  <button type="button" class="ai-faceshape-pill-btn selected" data-shape="square" onclick="AiStudioPage.selectFaceShape('square')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; border: 1px solid #C59B27; background: #C59B27; color: #141413; cursor: pointer;">
                    Mặt Vuông
                  </button>
                  <button type="button" class="ai-faceshape-pill-btn" data-shape="round" onclick="AiStudioPage.selectFaceShape('round')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); cursor: pointer;">
                    Mặt Tròn
                  </button>
                  <button type="button" class="ai-faceshape-pill-btn" data-shape="oval" onclick="AiStudioPage.selectFaceShape('oval')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); cursor: pointer;">
                    Mặt Trái Xoan
                  </button>
                  <button type="button" class="ai-faceshape-pill-btn" data-shape="oblong" onclick="AiStudioPage.selectFaceShape('oblong')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); cursor: pointer;">
                    Mặt Dài
                  </button>
                  <button type="button" class="ai-faceshape-pill-btn" data-shape="diamond" onclick="AiStudioPage.selectFaceShape('diamond')" 
                          style="white-space: nowrap; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-card); color: var(--text-secondary); cursor: pointer;">
                    Mặt Kim Cương
                  </button>
                </div>
              </div>

              <!-- DANH SÁCH 28 PHOM DÁNG TÓC THỊNH HÀNH -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                  <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    CHỌN PHOM DÁNG TÓC BARBERSHOP
                  </span>
                  <span style="font-size: 11px; color: var(--text-muted);" id="aiStyleCountLabel">28 kiểu tóc nam thịnh hành</span>
                </div>

                <!-- BỘ LỌC PHÂN LOẠI PHONG CÁCH -->
                <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 10px; scrollbar-width: none;">
                  <button type="button" class="ai-category-tab-btn" data-cat="all" onclick="AiStudioPage.filterCategory('all')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; border: 1px solid #C59B27; background: #C59B27; color: #141413; cursor: pointer; transition: all 0.15s ease;">
                    Tất cả (28)
                  </button>
                  <button type="button" class="ai-category-tab-btn" data-cat="short-fade" onclick="AiStudioPage.filterCategory('short-fade')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;">
                    Gọn gàng &amp; Fade (7)
                  </button>
                  <button type="button" class="ai-category-tab-btn" data-cat="classic" onclick="AiStudioPage.filterCategory('classic')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;">
                    Quý ông &amp; Cổ điển (7)
                  </button>
                  <button type="button" class="ai-category-tab-btn" data-cat="k-style" onclick="AiStudioPage.filterCategory('k-style')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;">
                    K-Style &amp; Trẻ trung (6)
                  </button>
                  <button type="button" class="ai-category-tab-btn" data-cat="perm-wavy" onclick="AiStudioPage.filterCategory('perm-wavy')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;">
                    Uốn Texture &amp; Xoăn (5)
                  </button>
                  <button type="button" class="ai-category-tab-btn" data-cat="long-rugged" onclick="AiStudioPage.filterCategory('long-rugged')" 
                          style="white-space: nowrap; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;">
                    Dài &amp; Phong trần (3)
                  </button>
                </div>

                <!-- LƯỚI THẺ KIỂU TÓC TRỰC QUAN -->
                <div id="aiHairstylesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; max-height: 350px; overflow-y: auto; padding-right: 4px;">
                  ${this.hairstyles.map(h => {
                    const isSelected = this.state.selectedHairstyle === h.id;
                    return `
                      <div id="pillStyle_${h.id}"
                           class="ai-style-card ${isSelected ? 'selected' : ''}"
                           data-category="${h.category}"
                           data-facekeys="${(h.faceKeys || []).join(',')}"
                           onclick="AiStudioPage.selectHairstyle('${h.id}')"
                           style="padding: 9px 11px; border-radius: 8px; display: flex; gap: 10px; align-items: center; cursor: pointer; border: 1.5px solid ${isSelected ? '#C59B27' : 'var(--border-color)'}; background: ${isSelected ? 'rgba(197, 155, 39, 0.1)' : 'var(--surface-elevated)'}; transition: all 0.15s ease; position: relative;">
                        <img src="${h.preview}" alt="${h.name}" onerror="this.src='assets/hairstyles/layer-korean.jpg'" style="width: 52px; height: 52px; border-radius: 6px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.15);" />
                        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;">
                          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                            <strong style="color: ${isSelected ? '#C59B27' : 'var(--text-primary)'}; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${h.name}</strong>
                            <span id="scoreTag_${h.id}" style="font-size: 9.5px; font-weight: 800; color: ${isSelected ? '#C59B27' : '#10B981'}; background: rgba(16, 185, 129, 0.12); padding: 1px 5px; border-radius: 3px; flex-shrink: 0;">
                              98%
                            </span>
                          </div>
                          <span style="font-size: 9.5px; font-weight: 700; color: #C59B27; letter-spacing: 0.5px;">${h.tag} • ${h.length}</span>
                          <span style="font-size: 10px; color: var(--text-secondary); line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${h.desc}</span>
                        </div>
                        ${isSelected ? '<span class="ai-check-badge" style="position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; border-radius: 50%; background: #C59B27; color: #141413; font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">✓</span>' : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- CHI TIẾT PHOM TÓC ĐANG CHỌN -->
              <div id="aiSelectedStyleDetailBox" style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px; font-size: 11.5px; line-height: 1.5;">
                ${this._renderSelectedStyleDetailHTML()}
              </div>

              <!-- TÙY CHỈNH TẠO KIỂU: ĐỘ PHỒNG VÀ CHẤT LIỆU SÁP -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <span class="tracking-widest" style="font-size: 10.5px; font-weight: 800; color: #C59B27; text-transform: uppercase; display: block; margin-bottom: 6px;">
                    ĐỘ PHỒNG TÓC (VOLUME)
                  </span>
                  <div style="display: flex; gap: 4px;">
                    <button type="button" id="btnVol_natural" onclick="AiStudioPage.selectVolume('natural')" 
                            style="flex: 1; padding: 5px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer;">
                      Tự nhiên
                    </button>
                    <button type="button" id="btnVol_standard" onclick="AiStudioPage.selectVolume('standard')" 
                            style="flex: 1; padding: 5px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 800; border: 1px solid #C59B27; background: #C59B27; color: #141413; cursor: pointer;">
                      Tiêu chuẩn
                    </button>
                    <button type="button" id="btnVol_high" onclick="AiStudioPage.selectVolume('high')" 
                            style="flex: 1; padding: 5px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer;">
                      Bồng bềnh
                    </button>
                  </div>
                </div>

                <div>
                  <span class="tracking-widest" style="font-size: 10.5px; font-weight: 800; color: #C59B27; text-transform: uppercase; display: block; margin-bottom: 6px;">
                    CHẤT LIỆU SÁP (FINISH)
                  </span>
                  <div style="display: flex; gap: 4px;">
                    <button type="button" id="btnFin_matte" onclick="AiStudioPage.selectFinish('matte')" 
                            style="flex: 1; padding: 5px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 800; border: 1px solid #C59B27; background: #C59B27; color: #141413; cursor: pointer;">
                      Mờ tự nhiên
                    </button>
                    <button type="button" id="btnFin_gloss" onclick="AiStudioPage.selectFinish('gloss')" 
                            style="flex: 1; padding: 5px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 600; border: 1px solid var(--border-color); background: var(--surface-elevated); color: var(--text-secondary); cursor: pointer;">
                      Bóng Pomade
                    </button>
                  </div>
                </div>
              </div>

              <!-- BẢNG MÀU NHUỘM PHỐI HỢP -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                  <span class="tracking-widest" style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase;">
                    BẢNG MÀU NHUỘM TÔN DA (8 MÀU)
                  </span>
                  <span style="font-size: 10.5px; color: var(--text-muted);" id="aiSelectedColorLabel">Đen Tự Nhiên (Lịch thiệp, chuẩn công sở)</span>
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  ${this.hairColors.map(c => {
                    const isSelected = this.state.selectedColor === c.id;
                    return `
                      <button type="button" 
                              id="pillColor_${c.id}"
                              class="ai-color-pill-btn ${isSelected ? 'selected' : ''}"
                              title="${c.name} - ${c.desc || ''}"
                              onclick="AiStudioPage.selectColor('${c.id}')"
                              style="display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 5px; cursor: pointer; border: 1.5px solid ${isSelected ? '#C59B27' : 'var(--border-color)'}; background: ${isSelected ? 'rgba(197, 155, 39, 0.12)' : 'var(--surface-elevated)'}; font-size: 11px; font-weight: 700; transition: all 0.15s ease;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${c.hex}; display: inline-block; border: 1px solid rgba(255,255,255,0.4); flex-shrink: 0;"></span>
                        <span style="color: ${isSelected ? '#C59B27' : 'var(--text-primary)'};">${c.name}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- GHI CHÚ YÊU CẦU DÀNH CHO THỢ BARBER (TÙY CHỌN) -->
              <div style="background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px;">
                <label for="aiCustomPromptInput" style="display: block; font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase; margin-bottom: 6px;">
                  Ghi Chú Yêu Cầu Cho Thợ Cắt (Tùy Chọn)
                </label>
                <input type="text" id="aiCustomPromptInput" 
                       placeholder="VD: Cạo fade sát 2 bên mai, tỉa mỏng phần mái, giữ độ dài đỉnh 7cm..." 
                       style="width: 100%; box-sizing: border-box; padding: 8px 12px; background: var(--surface-card); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 5px; font-size: 12px;" />
              </div>

              <!-- NÚT CTA CHÍNH: XEM TRƯỚC KIỂU TÓC -->
              <div style="margin-top: 4px;">
                <button type="button" class="nordic-btn-primary" id="btnRunAiRestyle" onclick="AiStudioPage.runAiRestyle()"
                        style="width: 100%; height: 48px; font-size: 14px; font-weight: 800; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease;">
                  <span id="aiBtnSpinner" style="display: none; width: 16px; height: 16px; border: 2.5px solid #141413; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                  <span id="aiBtnText">Xem trước kiểu tóc trên ảnh chân dung →</span>
                </button>

                <!-- Nút hành động khi đã có kết quả xem trước -->
                <div id="aiResultActions" style="display: ${this.state.hasResult ? 'flex' : 'none'}; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
                  <button type="button" onclick="AiStudioPage.bookThisHairstyle()"
                          style="flex: 1.4; min-width: 160px; padding: 10px 14px; font-size: 12.5px; font-weight: 800; background: #C59B27; color: #141413; border: 1px solid #C59B27; border-radius: 6px; cursor: pointer;">
                    Đặt lịch cắt kiểu này ngay
                  </button>
                  <button type="button" onclick="AiStudioPage.downloadResultImage()"
                          style="flex: 1; min-width: 110px; padding: 10px 14px; font-size: 12.5px; font-weight: 600; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                    Tải ảnh kiểu tóc HD
                  </button>
                  <button type="button" onclick="AiStudioPage.resetAiRestyle()"
                          style="padding: 10px 14px; font-size: 12.5px; font-weight: 600; background: var(--surface-elevated); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                    Chọn kiểu khác
                  </button>
                </div>

                <!-- Lời khuyên tạo kiểu từ Barber Master -->
                <div id="aiAnalysisCard" style="display: ${this.state.hasResult ? 'block' : 'none'}; margin-top: 12px; padding: 12px 14px; background: var(--surface-elevated); border: 1px solid var(--border-color); border-radius: 6px;">
                  <div style="font-size: 11px; font-weight: 800; color: #C59B27; text-transform: uppercase; margin-bottom: 6px;">
                    Lời Khuyên Tạo Kiểu Từ Barber Master
                  </div>
                  <div id="aiBarberAdviceText" style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px;">
                    Kiểu tóc này mang lại phong thái đĩnh đạc và cuốn hút. Hãy sấy nâng phom chân tóc khi còn ẩm và hoàn thiện bằng sáp giữ nếp mờ.
                  </div>
                  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; font-size: 11.5px; color: var(--text-muted);">
                    <div>• Sáp khuyên dùng: <strong id="aiProductRec" style="color: #C59B27;">Apestomen Volcanic Clay</strong></div>
                    <div>• Chu kỳ cắt tỉa: <strong style="color: #10B981;">3 - 4 tuần / lần</strong></div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      `;

      // Khởi tạo các chi tiết giao diện
      this._updateSelectedStyleDetail();
    },

    _renderSelectedStyleDetailHTML() {
      const cur = this.hairstyles.find(h => h.id === this.state.selectedHairstyle) || this.hairstyles[0];
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: #C59B27; font-size: 12.5px;">${cur.name}</strong>
          <span style="color: #10B981; font-weight: 700;">Hợp: ${cur.faceShape}</span>
        </div>
        <div style="color: var(--text-secondary); font-size: 11px; margin-bottom: 6px;">
          ${cur.desc}
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 10.5px; color: var(--text-muted);">
          <span>Độ dài: <strong style="color: var(--text-primary);">${cur.length}</strong></span>
          <span>Độ phồng: <strong style="color: var(--text-primary);">${cur.volume}</strong></span>
          <span>Sản phẩm: <strong style="color: #C59B27;">${cur.finish}</strong></span>
        </div>
      `;
    },

    _updateSelectedStyleDetail() {
      const el = document.getElementById('aiSelectedStyleDetailBox');
      if (el) el.innerHTML = this._renderSelectedStyleDetailHTML();
    },

    // CHỌN DÁNG MẶT ĐỂ TƯ VẤN
    selectFaceShape(shapeKey) {
      this.state.selectedFaceShape = shapeKey;

      // Cập nhật các nút pill dáng mặt
      document.querySelectorAll('.ai-faceshape-pill-btn').forEach(btn => {
        const isAct = btn.getAttribute('data-shape') === shapeKey;
        btn.classList.toggle('selected', isAct);
        btn.style.background = isAct ? '#C59B27' : 'var(--surface-card)';
        btn.style.color = isAct ? '#141413' : 'var(--text-secondary)';
        btn.style.borderColor = isAct ? '#C59B27' : 'var(--border-color)';
        btn.style.fontWeight = isAct ? '800' : '600';
      });

      // Cập nhật lời tư vấn
      const info = this.faceConsultantMap[shapeKey] || this.faceConsultantMap.all;
      const titleEl = document.getElementById('aiFaceShapeBadge');
      const textEl = document.getElementById('aiFaceDiagnosticText');
      if (titleEl) titleEl.textContent = info.title.toUpperCase();
      if (textEl) textEl.textContent = info.desc;

      // Cập nhật điểm số tương thích trên các thẻ tóc
      this.hairstyles.forEach(h => {
        const scoreTag = document.getElementById(`scoreTag_${h.id}`);
        if (!scoreTag) return;
        const matches = (shapeKey === 'all') || (h.faceKeys && h.faceKeys.includes(shapeKey));
        const scoreVal = matches ? '98%' : '88%';
        scoreTag.textContent = scoreVal;
        scoreTag.style.color = matches ? '#C59B27' : '#10B981';
        scoreTag.style.background = matches ? 'rgba(197, 155, 39, 0.18)' : 'rgba(16, 185, 129, 0.12)';
      });

      if (window.UICommon) {
        window.UICommon.showToast(`Đã chọn tư vấn cho: ${info.title}`, 'info');
      }
    },

    // CHỌN ĐỘ PHỒNG TÓC
    selectVolume(vol) {
      this.state.selectedVolume = vol;
      ['natural', 'standard', 'high'].forEach(v => {
        const btn = document.getElementById(`btnVol_${v}`);
        if (!btn) return;
        const isAct = v === vol;
        btn.style.background = isAct ? '#C59B27' : 'var(--surface-elevated)';
        btn.style.color = isAct ? '#141413' : 'var(--text-secondary)';
        btn.style.borderColor = isAct ? '#C59B27' : 'var(--border-color)';
        btn.style.fontWeight = isAct ? '800' : '600';
      });
    },

    // CHỌN CHẤT LIỆU SÁP
    selectFinish(finish) {
      this.state.selectedFinish = finish;
      ['matte', 'gloss'].forEach(f => {
        const btn = document.getElementById(`btnFin_${f}`);
        if (!btn) return;
        const isAct = f === finish;
        btn.style.background = isAct ? '#C59B27' : 'var(--surface-elevated)';
        btn.style.color = isAct ? '#141413' : 'var(--text-secondary)';
        btn.style.borderColor = isAct ? '#C59B27' : 'var(--border-color)';
        btn.style.fontWeight = isAct ? '800' : '600';
      });
    },

    // CHỌN PHOM TÓC & MÀU NHUỘM
    selectHairstyle(styleId) {
      this.state.selectedHairstyle = styleId;
      const found = this.hairstyles.find(h => h.id === styleId);
      if (found && window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`Đã chọn phom tóc: ${found.name}`, 'info');
      }
      this._updateHairstyleUI();
      this._updateSelectedStyleDetail();
    },

    selectColor(colorId) {
      this.state.selectedColor = colorId;
      const found = this.hairColors.find(c => c.id === colorId);
      if (found && window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast(`Đã chọn màu nhuộm: ${found.name}`, 'info');
      }
      this._updateColorUI();
    },

    // CHUYỂN CHẾ ĐỘ XEM: ẢNH 3:4 CHUẨN HOẶC ẢNH GỐC
    switchBaseMode(mode) {
      this.state.activeBaseMode = mode;
      let targetImg = this.state.croppedImage || this.state.originalRawImage;
      if (mode === 'raw') {
        targetImg = this.state.originalRawImage;
      }

      if (targetImg) {
        this.state.uploadedImage = targetImg;
        const srcImg = document.getElementById('aiSourcePortrait');
        if (srcImg) srcImg.src = targetImg;
      }

      const setBtnState = (btnId, isSelected) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.style.background = isSelected ? '#C59B27' : 'var(--surface-card)';
        btn.style.color = isSelected ? '#141413' : 'var(--text-secondary)';
        btn.style.borderColor = isSelected ? '#C59B27' : 'var(--border-color)';
        btn.style.fontWeight = isSelected ? '800' : '600';
      };

      setBtnState('btnBaseModeCropped', mode !== 'raw');
      setBtnState('btnBaseModeRaw', mode === 'raw');
    },

    selectDemoPortrait(url) {
      const proxiedUrl = (url && url.startsWith('http') && !url.includes('/api/ai/proxy-image'))
        ? ('/api/ai/proxy-image?url=' + encodeURIComponent(url))
        : url;
      this.state.originalRawImage = proxiedUrl;
      this.state.uploadedImage = proxiedUrl;
      this.state.croppedImage = null;
      this.state.hasResult = false;
      this.state.resultImage = null;

      const srcImg = document.getElementById('aiSourcePortrait');
      const resImg = document.getElementById('aiResultPortrait');
      const previewBox = document.getElementById('aiPortraitViewport');
      const emptyUI = document.getElementById('aiEmptyUploadUI');

      if (previewBox) previewBox.style.display = 'block';
      if (emptyUI) emptyUI.style.display = 'none';
      if (srcImg) {
        srcImg.crossOrigin = 'anonymous';
        srcImg.src = proxiedUrl;
      }
      if (resImg) {
        resImg.src = '';
        resImg.style.display = 'none';
      }

      this._toggleResultState(false);
      this.setCompareMode('before');
      if (window.UICommon && typeof window.UICommon.showToast === 'function') {
        window.UICommon.showToast('Đã nạp ảnh chân dung. Bấm "Xem trước kiểu tóc" để xem kết quả!', 'info');
      }
    },

    triggerFileInput() {
      const input = document.getElementById('aiStudioFileInput');
      if (input) input.click();
    },

    handleDrop(event) {
      event.preventDefault();
      const files = event.dataTransfer && event.dataTransfer.files;
      if (files && files.length > 0) {
        this.handleFileSelected({ target: { files } });
      }
    },

    handleFileSelected(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        if (window.UICommon) window.UICommon.showToast('Chỉ chấp nhận tệp ảnh JPG, PNG hoặc WEBP!', 'error');
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        if (window.UICommon) window.UICommon.showToast('Dung lượng ảnh không được vượt quá 8MB!', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.state.originalRawImage = e.target.result;
        this.state.uploadedImage = e.target.result;
        this.state.croppedImage = null;
        this.state.hasResult = false;
        this.state.resultImage = null;

        const previewBox = document.getElementById('aiPortraitViewport');
        const emptyUI = document.getElementById('aiEmptyUploadUI');
        const srcImg = document.getElementById('aiSourcePortrait');
        const resImg = document.getElementById('aiResultPortrait');

        if (previewBox) previewBox.style.display = 'block';
        if (emptyUI) emptyUI.style.display = 'none';
        if (srcImg) srcImg.src = this.state.uploadedImage;
        if (resImg) {
          resImg.src = '';
          resImg.style.display = 'none';
        }

        this._toggleResultState(false);
        if (window.UICommon) window.UICommon.showToast('Đã tải ảnh chân dung thành công! Bấm "Xem trước kiểu tóc" để thử.', 'success');
      };
      reader.readAsDataURL(file);
    },

    // THỰC HIỆN TẠO PHOM TÓC XEM TRƯỚC (NHẸ NHÀNG, MƯỢT MÀ, KHÔNG LASER/RADAR SCI-FI)
    async runAiRestyle() {
      if (this.state.isProcessing) return;

      const sourceImg = document.getElementById('aiSourcePortrait');
      const photoToSend = this.state.uploadedImage || (sourceImg ? sourceImg.src : '');
      if (!photoToSend) {
        if (window.UICommon) window.UICommon.showToast('Vui lòng tải ảnh chân dung lên trước!', 'warning');
        return;
      }

      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle) || this.hairstyles[0];
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor) || this.hairColors[0];

      this.state.isProcessing = true;
      this.state.hasResult = false;

      const hud = document.getElementById('aiScanHudModal');
      const hudProgress = document.getElementById('aiScanHudProgress');
      const hudSub = document.getElementById('aiScanHudSub');
      const btn = document.getElementById('btnRunAiRestyle');
      const spinner = document.getElementById('aiBtnSpinner');
      const text = document.getElementById('aiBtnText');
      const resultImgEl = document.getElementById('aiResultPortrait');

      if (hud) hud.style.display = 'flex';
      if (spinner) spinner.style.display = 'inline-block';
      if (text) text.textContent = 'Đang Uốn Phom Tóc 3D...';
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.75';
      }
      if (resultImgEl) resultImgEl.style.display = 'none';

      if (hudProgress) hudProgress.style.width = '30%';
      if (hudSub) hudSub.textContent = `Đang phân tích 478 điểm mốc 3D và định hình tóc: ${currentStyle.name}...`;

      try {
        if (hudProgress) hudProgress.style.width = '55%';
        if (hudSub) hudSub.textContent = 'Đang uốn phom sọ Delaunay & tách sợi tóc tơ viền mái...';

        const res = await fetch('/api/ai/restyle-hair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: photoToSend,
            hairstyleId: currentStyle.id,
            colorId: currentColor.id,
            colorHex: currentColor.hex || '#141413'
          })
        });

        if (hudProgress) hudProgress.style.width = '85%';
        if (hudSub) hudSub.textContent = `Đang hòa sắc màu nhuộm ${currentColor.name} & bảo toàn ngũ quan thật...`;

        const data = await res.json();

        if (data && data.success && data.resultImageUrl) {
          if (hudProgress) hudProgress.style.width = '100%';
          if (hudSub) hudSub.textContent = 'Hoàn tất phom tóc chuẩn salon!';

          const resultUrl = data.resultImageUrl;
          this.state.resultImage = resultUrl;
          this.state.hasResult = true;

          if (resultImgEl) {
            resultImgEl.src = resultUrl;
            resultImgEl.style.display = 'block';
          }

          this._toggleResultState(true);
          this.setCompareMode('split');

          if (data.faceAnalysis && data.faceAnalysis.faceShape) {
            this.state.faceShape = data.faceAnalysis.faceShape.name;
          }

          // Cập nhật lời khuyên thợ
          const adviceEl = document.getElementById('aiBarberAdviceText');
          const prodEl = document.getElementById('aiProductRec');
          if (adviceEl) {
            adviceEl.textContent = `Kiểu tóc [${currentStyle.name}] tôn trọn vẹn đường nét khuôn mặt của bạn, khuyên dùng máy sấy nâng phom chân tóc khi tóc còn ẩm và hoàn thiện với nếp ${currentStyle.finish}.`;
          }
          if (prodEl) {
            prodEl.textContent = currentStyle.finish.includes('Pomade') ? 'Reuzel Blue Pomade' : 'Apestomen Volcanic Clay';
          }

          if (window.UICommon) {
            window.UICommon.showToast(`Đã tạo phom tóc "${currentStyle.name}" bảo toàn gương mặt thật thành công!`, 'success');
          }
        } else {
          const errMsg = (data && data.message) ? data.message : 'Không thể nhận diện khuôn mặt rõ nét trong ảnh. Vui lòng chụp góc thẳng và sáng rõ.';
          if (window.UICommon) {
            window.UICommon.showToast(errMsg, 'warning');
          }
        }
      } catch (err) {
        if (window.UICommon) {
          window.UICommon.showToast('Lỗi kết nối máy chủ AI: ' + err.message, 'error');
        }
      } finally {
        this.state.isProcessing = false;
        if (hud) hud.style.display = 'none';
        if (spinner) spinner.style.display = 'none';
        if (text) text.textContent = 'Xem trước kiểu tóc trên ảnh chân dung →';
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
        }
      }
    },

    // ĐIỀU KHIỂN CHẾ ĐỘ XEM TRƯỚC / SAU & SLIDER
    setCompareMode(mode) {
      this.state.compareMode = mode;
      const viewport = document.getElementById('aiPortraitViewport');
      const clipper = document.getElementById('aiBeforeClipper');
      const divider = document.getElementById('aiCompareSliderDivider');
      const btnSplit = document.getElementById('btnModeSplit');
      const btnBefore = document.getElementById('btnModeBefore');
      const btnAfter = document.getElementById('btnModeAfter');

      const resetBtns = () => {
        [btnSplit, btnBefore, btnAfter].forEach(b => {
          if (b) {
            b.style.background = 'var(--surface-card)';
            b.style.color = 'var(--text-secondary)';
            b.style.borderColor = 'var(--border-color)';
          }
        });
      };
      resetBtns();

      if (mode === 'split') {
        if (viewport) viewport.style.cursor = 'ew-resize';
        if (clipper) clipper.style.clipPath = `inset(0 ${100 - this.state.sliderPosition}% 0 0)`;
        if (divider) {
          divider.style.display = 'flex';
          divider.style.left = this.state.sliderPosition + '%';
        }
        if (btnSplit) {
          btnSplit.style.background = '#C59B27';
          btnSplit.style.color = '#141413';
          btnSplit.style.borderColor = '#C59B27';
        }
      } else if (mode === 'before') {
        if (viewport) viewport.style.cursor = 'default';
        if (clipper) clipper.style.clipPath = 'inset(0 0 0 0)';
        if (divider) divider.style.display = 'none';
        if (btnBefore) {
          btnBefore.style.background = '#C59B27';
          btnBefore.style.color = '#141413';
          btnBefore.style.borderColor = '#C59B27';
        }
      } else if (mode === 'after') {
        if (viewport) viewport.style.cursor = 'default';
        if (clipper) clipper.style.clipPath = 'inset(0 100% 0 0)';
        if (divider) divider.style.display = 'none';
        if (btnAfter) {
          btnAfter.style.background = '#C59B27';
          btnAfter.style.color = '#141413';
          btnAfter.style.borderColor = '#C59B27';
        }
      }
    },

    updateSliderPosition(clientX) {
      const viewport = document.getElementById('aiPortraitViewport');
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      if (rect.width <= 0) return;
      let posX = clientX - rect.left;
      let pct = (posX / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      this.state.sliderPosition = pct;

      const clipper = document.getElementById('aiBeforeClipper');
      const divider = document.getElementById('aiCompareSliderDivider');
      if (clipper) clipper.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      if (divider) divider.style.left = pct + '%';
    },

    handleViewportMouseDown(e) {
      if (!this.state.hasResult) return;
      if (e.target && (e.target.closest('#aiScanHudModal') || e.target.closest('button'))) return;
      if (this.state.compareMode && this.state.compareMode !== 'split') {
        this.setCompareMode('split');
      }
      this.updateSliderPosition(e.clientX);
      this.startSliderDrag(e);
    },

    handleViewportTouchStart(e) {
      if (!this.state.hasResult) return;
      if (e.target && (e.target.closest('#aiScanHudModal') || e.target.closest('button'))) return;
      if (this.state.compareMode && this.state.compareMode !== 'split') {
        this.setCompareMode('split');
      }
      this.startSliderDragTouch(e);
    },

    startSliderDrag(e) {
      if (!this.state.hasResult) return;
      e.preventDefault();
      e.stopPropagation();

      const onMouseMove = (moveEvent) => {
        moveEvent.preventDefault();
        this.updateSliderPosition(moveEvent.clientX);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },

    startSliderDragTouch(e) {
      if (!this.state.hasResult) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      if (e.touches && e.touches[0]) {
        this.updateSliderPosition(e.touches[0].clientX);
      }

      const onTouchMove = (touchEvent) => {
        if (touchEvent.cancelable) touchEvent.preventDefault();
        if (touchEvent.touches && touchEvent.touches[0]) {
          this.updateSliderPosition(touchEvent.touches[0].clientX);
        }
      };

      const onTouchEnd = () => {
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', onTouchEnd);
      };

      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
    },

    // CHỤP ẢNH BẰNG CAMERA THIẾT BỊ
    openCameraModal() {
      const modalHtml = `
        <div id="aiCameraModalBackdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;">
          <div style="background: var(--surface-card, #1c1c1f); border: 1px solid var(--border-color, #333); border-radius: 8px; width: 100%; max-width: 500px; padding: 20px; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <strong style="color: var(--text-primary); font-size: 16px;">Chụp chân dung bằng camera</strong>
              <button type="button" onclick="AiStudioPage.closeCameraModal()" style="background: transparent; border: none; font-size: 20px; color: var(--text-secondary); cursor: pointer;">✕</button>
            </div>
            
            <div style="position: relative; width: 100%; height: 340px; background: #000; border-radius: 6px; overflow: hidden; margin-bottom: 14px; display: flex; align-items: center; justify-content: center;">
              <video id="aiCameraVideo" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
              <canvas id="aiCameraCanvas" style="display: none;"></canvas>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="button" onclick="AiStudioPage.captureCameraShot()" style="flex: 1; padding: 12px; background: #C59B27; color: #141413; font-weight: 800; border-radius: 6px; border: 1px solid #C59B27; cursor: pointer;">
                Chụp ảnh ngay
              </button>
              <button type="button" onclick="AiStudioPage.closeCameraModal()" style="padding: 12px 18px; background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                Hủy
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 } })
          .then(stream => {
            const video = document.getElementById('aiCameraVideo');
            if (video) {
              video.srcObject = stream;
              this._activeStream = stream;
            }
          })
          .catch(err => {
            console.error('Camera error:', err);
            if (window.UICommon) window.UICommon.showToast('Không thể mở camera: ' + err.message, 'error');
            this.closeCameraModal();
          });
      }
    },

    captureCameraShot() {
      const video = document.getElementById('aiCameraVideo');
      const canvas = document.getElementById('aiCameraCanvas');
      if (!video || !canvas) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const capturedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      this.closeCameraModal();

      this.state.uploadedImage = capturedBase64;
      this.state.hasResult = false;
      this.state.resultImage = null;

      const srcImg = document.getElementById('aiSourcePortrait');
      const resImg = document.getElementById('aiResultPortrait');
      const previewBox = document.getElementById('aiPortraitViewport');
      const emptyUI = document.getElementById('aiEmptyUploadUI');

      if (previewBox) previewBox.style.display = 'block';
      if (emptyUI) emptyUI.style.display = 'none';
      if (srcImg) srcImg.src = capturedBase64;
      if (resImg) {
        resImg.src = '';
        resImg.style.display = 'none';
      }

      this._toggleResultState(false);
      if (window.UICommon) window.UICommon.showToast('Đã chụp ảnh thành công! Bấm "Xem trước kiểu tóc" để xem kết quả.', 'success');
    },

    closeCameraModal() {
      if (this._activeStream) {
        this._activeStream.getTracks().forEach(track => track.stop());
        this._activeStream = null;
      }
      const modal = document.getElementById('aiCameraModalBackdrop');
      if (modal) modal.remove();
    },

    // TẢI ẢNH KẾT QUẢ VỀ MÁY
    downloadResultImage() {
      const resultImg = this.state.resultImage;
      if (!resultImg) {
        if (window.UICommon) window.UICommon.showToast('Chưa có ảnh kết quả để tải xuống!', 'warning');
        return;
      }
      const a = document.createElement('a');
      a.href = resultImg;
      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle);
      const styleSlug = currentStyle ? currentStyle.id : 'hair';
      a.download = `omnisalon-${styleSlug}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (window.UICommon) window.UICommon.showToast('Đang tải ảnh kiểu tóc về máy của bạn...', 'success');
    },

    // ĐẶT LỊCH HẸN VỚI KIỂU TÓC ĐÃ CHỌN
    bookThisHairstyle() {
      const currentStyle = this.hairstyles.find(h => h.id === this.state.selectedHairstyle) || this.hairstyles[0];
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor) || this.hairColors[0];
      const customPromptInput = document.getElementById('aiCustomPromptInput');
      const userNote = customPromptInput ? customPromptInput.value.trim() : '';

      const styleName = currentStyle.name;
      const colorName = currentColor.name;
      const volLabel = this.state.selectedVolume === 'high' ? 'Bồng bềnh' : (this.state.selectedVolume === 'natural' ? 'Tự nhiên' : 'Tiêu chuẩn');
      const finLabel = this.state.selectedFinish === 'gloss' ? 'Bóng Pomade' : 'Mờ tự nhiên';

      let noteText = `[KIỂU TÓC CHỌN TRƯỚC]: ${styleName} (Màu: ${colorName}, Độ phồng: ${volLabel}, Nếp sáp: ${finLabel})`;
      if (userNote) {
        noteText += ` | Yêu cầu riêng: ${userNote}`;
      }

      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate(`/booking?service=srv-haircut-men&notes=${encodeURIComponent(noteText)}`);
      } else if (window.CustomerWeb && typeof window.CustomerWeb.switchTab === 'function') {
        window.CustomerWeb.switchTab('booking');
      }
    },

    resetAiRestyle() {
      this.state.hasResult = false;
      this.state.resultImage = null;
      const resImg = document.getElementById('aiResultPortrait');
      if (resImg) {
        resImg.src = '';
        resImg.style.display = 'none';
      }
      this._toggleResultState(false);
      this.setCompareMode('before');
      if (window.UICommon) window.UICommon.showToast('Mời bạn chọn kiểu tóc khác trong bộ sưu tập!', 'info');
    },

    _toggleResultState(hasResult) {
      const actions = document.getElementById('aiResultActions');
      const compareControls = document.getElementById('aiCompareControls');
      const analysisCard = document.getElementById('aiAnalysisCard');
      const bBefore = document.getElementById('aiViewBadgeBefore');
      const bAfter = document.getElementById('aiViewBadgeAfter');

      if (actions) actions.style.display = hasResult ? 'flex' : 'none';
      if (compareControls) compareControls.style.display = hasResult ? 'flex' : 'none';
      if (analysisCard) analysisCard.style.display = hasResult ? 'block' : 'none';
      if (bBefore) bBefore.style.display = hasResult ? 'block' : 'none';
      if (bAfter) bAfter.style.display = hasResult ? 'block' : 'none';
    },

    filterCategory(cat) {
      this.state.activeCategory = cat;
      const tabs = document.querySelectorAll('.ai-category-tab-btn');
      tabs.forEach(t => {
        const isAct = t.getAttribute('data-cat') === cat;
        t.style.background = isAct ? '#C59B27' : 'var(--surface-elevated)';
        t.style.color = isAct ? '#141413' : 'var(--text-secondary)';
        t.style.borderColor = isAct ? '#C59B27' : 'var(--border-color)';
        t.style.fontWeight = isAct ? '800' : '600';
      });

      let visibleCount = 0;
      this.hairstyles.forEach(h => {
        const card = document.getElementById(`pillStyle_${h.id}`);
        if (!card) return;
        const matchCat = (cat === 'all') || (h.category === cat);
        card.style.display = matchCat ? 'flex' : 'none';
        if (matchCat) visibleCount++;
      });

      const countLabel = document.getElementById('aiStyleCountLabel');
      if (countLabel) {
        countLabel.textContent = `${visibleCount} kiểu tóc hiển thị`;
      }
    },

    _updateHairstyleUI() {
      this.hairstyles.forEach(h => {
        const card = document.getElementById(`pillStyle_${h.id}`);
        if (!card) return;
        const isSelected = this.state.selectedHairstyle === h.id;
        card.classList.toggle('selected', isSelected);
        card.style.borderColor = isSelected ? '#C59B27' : 'var(--border-color)';
        card.style.background = isSelected ? 'rgba(197, 155, 39, 0.12)' : 'var(--surface-elevated)';
        
        let check = card.querySelector('.ai-check-badge');
        if (isSelected && !check) {
          const badge = document.createElement('span');
          badge.className = 'ai-check-badge';
          badge.innerHTML = '✓';
          badge.style.cssText = 'position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; border-radius: 50%; background: #C59B27; color: #141413; font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.4);';
          card.appendChild(badge);
        } else if (!isSelected && check) {
          check.remove();
        }

        const title = card.querySelector('strong');
        if (title) title.style.color = isSelected ? '#C59B27' : 'var(--text-primary)';
      });
    },

    _updateColorUI() {
      const colorLabel = document.getElementById('aiSelectedColorLabel');
      const currentColor = this.hairColors.find(c => c.id === this.state.selectedColor);
      if (colorLabel && currentColor) {
        colorLabel.textContent = `${currentColor.name} (${currentColor.desc || ''})`;
      }

      this.hairColors.forEach(c => {
        const btn = document.getElementById(`pillColor_${c.id}`);
        if (!btn) return;
        const isSelected = this.state.selectedColor === c.id;
        btn.classList.toggle('selected', isSelected);
        btn.style.borderColor = isSelected ? '#C59B27' : 'var(--border-color)';
        btn.style.background = isSelected ? 'rgba(197, 155, 39, 0.15)' : 'var(--surface-elevated)';
        const nameSpan = btn.querySelector('span:last-child');
        if (nameSpan) nameSpan.style.color = isSelected ? '#C59B27' : 'var(--text-primary)';
      });
    }
  };

  // Gắn vào window toàn cục
  window.AiStudioPage = AiStudioPage;

})(window);
