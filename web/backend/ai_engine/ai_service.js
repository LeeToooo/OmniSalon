// Xử lý các chức năng AI phân tích khuôn mặt và gợi ý kiểu tóc

const https = require('https');
const http = require('http');
const dns = require('dns').promises;
const net = require('net');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Bảng dữ liệu 12 kiểu tóc chuẩn Salon Barber chuyên nghiệp
const HAIRSTYLES = {
  'layer-korean': {
    id: 'layer-korean',
    name: 'Layer Texture Hàn Quốc',
    category: 'trends',
    tag: 'THỜI THƯỢNG',
    desc: 'Tỉa tầng bay bổng, uốn texture tạo độ phồng tự nhiên cho khuôn mặt Á Đông.',
    faceSuitability: {
      OVAL: { score: 98, note: 'Cân đối hài hòa! Mái bay tôn nét thanh thoát tự nhiên của khuôn mặt.' },
      SQUARE: { score: 92, note: 'Lớp layer rủ mềm mại giúp trung hòa các góc xương hàm vuông vức, tạo vẻ lịch lãm tự nhiên.' },
      ROUND: { score: 86, note: 'Nên sấy phồng chân tóc trên đỉnh để kéo dài khuôn mặt thon gọn hơn.' },
      OBLONG: { score: 96, note: 'Mái rủ tỉa tầng giúp che bớt vòm trán, rút ngắn chiều dài gương mặt cực kỳ hiệu quả.' },
      DIAMOND: { score: 94, note: 'Độ phồng 2 bên mai ôm sát xương gò má, mang lại vẻ hài hòa cân đối.' },
      HEART: { score: 95, note: 'Cân bằng tốt giữa trán rộng và cằm thon, mang lại phong thái lãng tử.' }
    },
    suggestedProduct: { id: 'SP01', name: 'Apestomen Volcanic Clay VIP', price: 345000, category: 'Sáp vuốt tóc giữ nếp', image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay/Apestomen_Volcanic_Clay_01.jpg' },
    suggestedService: { id: 'DV03', name: 'Uốn tóc xoăn Texture / Ziczac phồng Hàn Quốc', price: 650000 }
  },
  'pompadour-luxury': {
    id: 'pompadour-luxury',
    name: 'Pompadour & Mid Fade',
    category: 'classic',
    tag: 'LỊCH LÃM',
    desc: 'Độ phồng vuốt ngược pomade kết hợp đường fade sắc nét 2 bên mang lại phong thái đĩnh đạc.',
    faceSuitability: {
      OVAL: { score: 96, note: 'Rất tôn trán và ngũ quan sáng sủa của quý ông.' },
      SQUARE: { score: 99, note: 'Lựa chọn hàng đầu! Khối vuốt ngược làm nổi bật góc hàm vuông chữ điền đầy nam tính.' },
      ROUND: { score: 97, note: 'Độ phồng cao ở đỉnh tóc giúp khuôn mặt trông dài và thon gọn hơn.' },
      OBLONG: { score: 78, note: 'Nên hạ bớt độ cao mái để tránh làm mặt trông dài thêm.' },
      DIAMOND: { score: 90, note: 'Cần vuốt phồng vừa phải kết hợp taper fade 2 bên để tôn gò má.' },
      HEART: { score: 88, note: 'Tôn vầng trán thoáng, hợp vuốt pomade bóng nhẹ lịch lãm.' }
    },
    suggestedProduct: { id: 'SP30', name: 'Reuzel Green Medium Hold Grease', price: 692000, category: 'Pomade cổ điển', image: 'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Green_Medium_Hold_Grease/Reuzel_Green_Medium_Hold_Grease_01.jpg' },
    suggestedService: { id: 'DV01', name: 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade', price: 120000 }
  },
  'mullet-modern': {
    id: 'mullet-modern',
    name: 'Modern Mullet & Taper Fade',
    category: 'trends',
    tag: 'PHONG CÁCH',
    desc: 'Gáy tỉa so le mềm mại kết hợp đường cạo viền dứt khoát và nam tính.',
    faceSuitability: {
      OVAL: { score: 95, note: 'Tôn trọn góc nghiêng sắc nét và đường viền gáy gọn gàng.' },
      SQUARE: { score: 90, note: 'Phom tóc gáy dài tạo cảm giác phong trần, cân bằng góc cạnh sắc nhọn.' },
      ROUND: { score: 85, note: 'Phần mai cạo taper fade giúp bóp gọn 2 bên má tròn.' },
      OBLONG: { score: 92, note: 'Đuôi tóc sau gáy tạo cảm giác khuôn mặt đầy đặn hơn từ góc nhìn ngang.' },
      DIAMOND: { score: 96, note: 'Rất tôn xương gò má cao và phong cách thời trang trẻ trung.' },
      HEART: { score: 93, note: 'Đuôi tóc ôm gáy lấp đầy khoảng trống của phần cằm thon.' }
    },
    suggestedProduct: { id: 'SP51', name: 'Reuzel Grooming Tonic', price: 692000, category: 'Xịt dưỡng pre-styling', image: 'Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Reuzel_Grooming_Tonic/Reuzel_Grooming_Tonic/Reuzel_Grooming_Tonic_01.jpg' },
    suggestedService: { id: 'DV03', name: 'Uốn tóc xoăn Texture / Ziczac phồng Hàn Quốc', price: 650000 }
  },
  'sidepart-gentleman': {
    id: 'sidepart-gentleman',
    name: 'Side Part 7/3 Cổ Điển',
    category: 'classic',
    tag: 'QUÝ ÔNG',
    desc: 'Đường rẽ ngôi cân đối tôn phom mặt, dễ dàng chải sáp restyle suốt cả ngày.',
    faceSuitability: {
      OVAL: { score: 99, note: 'Phù hợp hoàn hảo cho phong thái doanh nhân chỉn chu và cân đối.' },
      SQUARE: { score: 96, note: 'Tôn góc cạnh quai hàm chữ điền, mang lại vẻ từng trải và đĩnh đạc.' },
      ROUND: { score: 94, note: 'Đường rẽ ngôi bất đối xứng giúp tạo hiệu ứng mặt thon gọn hơn.' },
      OBLONG: { score: 90, note: 'Mái 7/3 rủ nhẹ chéo trán giúp cân bằng chiều dài khuôn mặt.' },
      DIAMOND: { score: 93, note: 'Độ phồng chân tóc 2 bên hài hòa tự nhiên với xương gò má.' },
      HEART: { score: 95, note: 'Nếp chải tinh tế che bớt góc trán rộng, tôn cằm thon.' }
    },
    suggestedProduct: { id: 'SP01', name: 'Apestomen Volcanic Clay VIP', price: 345000, category: 'Sáp vuốt tóc giữ nếp', image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay/Apestomen_Volcanic_Clay_01.jpg' },
    suggestedService: { id: 'CB01', name: 'Combo Quý Tộc Barber (Cắt + Gội + Cạo râu)', price: 300000 }
  },
  'buzzcut-fade': {
    id: 'buzzcut-fade',
    name: 'Buzz Cut & High Fade',
    category: 'edgy',
    tag: 'DỨT KHOÁT',
    desc: 'Gọn gàng, tôn trọn vẹn xương hàm và đường nét góc cạnh của gương mặt.',
    faceSuitability: {
      OVAL: { score: 92, note: 'Khoe trọn vẹn đường nét ngũ quan thanh tú, tạo cảm giác năng động thể thao.' },
      SQUARE: { score: 97, note: 'Mạnh mẽ, dứt khoát! Đường fade sắc nét tôn vinh hàm vuông góc cạnh.' },
      ROUND: { score: 72, note: 'Dáng mặt tròn nên cân nhắc, vì tóc quá ngắn dễ để lộ má bầu bĩnh.' },
      OBLONG: { score: 75, note: 'Cần thợ fade chuẩn để không làm khuôn mặt bị kéo dài thêm.' },
      DIAMOND: { score: 86, note: 'Phong thái cá tính dứt khoát, cần chú ý đường chân tóc trán.' },
      HEART: { score: 84, note: 'Làm nổi bật xương quai hàm và ánh mắt quyết đoán.' }
    },
    suggestedProduct: { id: 'SP61', name: "L'Oréal Professionnel Infinium Pure Strong", price: 503000, category: 'Gôm xịt bảo vệ form', image: 'Men_Grooming_Products/04_Gom_Xit_Giu_Nep_Toc_Nam/LOreal_Infinium/LOreal_Professionnel_Infinium_Pure_Strong/LOreal_Professionnel_Infinium_Pure_Strong_01.jpg' },
    suggestedService: { id: 'DV01', name: 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade', price: 120000 }
  },
  'french-crop': {
    id: 'french-crop',
    name: 'French Crop Textured',
    category: 'edgy',
    tag: 'HIỆN ĐẠI',
    desc: 'Mái tỉa nhọn textured ngang trán, cạo fade cao 2 bên mai năng động và trẻ trung.',
    faceSuitability: {
      OVAL: { score: 95, note: 'Rất trẻ trung, tôn nét mặt hiện đại cá tính của các bạn trẻ.' },
      SQUARE: { score: 94, note: 'Mái bằng textured tương phản hài hòa với xương hàm vuông nam tính.' },
      ROUND: { score: 88, note: 'Fade cao 2 bên giúp thu gọn má bầu, tạo cảm giác gương mặt góc cạnh hơn.' },
      OBLONG: { score: 98, note: 'Phom tóc rất hợp cho mặt dài: mái ngang che trán giúp cân đối chiều dài mặt.' },
      DIAMOND: { score: 91, note: 'Độ phồng textured đỉnh đầu giúp cân bằng phần gò má nhô cao.' },
      HEART: { score: 94, note: 'Che bớt trán rộng, giúp khuôn mặt hài hòa cân đối.' }
    },
    suggestedProduct: { id: 'SP05', name: 'Hanz de Fuko Quicksand', price: 879000, category: 'Sáp tạo texture khô tự nhiên', image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Quicksand/Hanz_de_Fuko_Quicksand_01.jpg' },
    suggestedService: { id: 'DV02', name: 'Cắt & Ép Side tóc nam (Down Perm Combo)', price: 250000 }
  },
  'short-quiff': {
    id: 'short-quiff',
    name: 'Short Quiff & Mid Taper',
    category: 'trends',
    tag: 'NĂNG ĐỘNG',
    desc: 'Mái vuốt ngược ngắn tự nhiên, hai bên mai cắt taper gọn gàng, phù hợp cả công sở lẫn thể thao.',
    faceSuitability: {
      OVAL: { score: 97, note: 'Tôn trọn đường sống mũi và vầng trán sáng, phong thái vô cùng năng động.' },
      SQUARE: { score: 95, note: 'Độ nâng vừa phải ở ngọn tóc giúp làm mềm mại các đường nét góc cạnh của hàm.' },
      ROUND: { score: 96, note: 'Nên ưu tiên! Đỉnh tóc vuốt hướng lên giúp kéo dài gương mặt thon gọn.' },
      OBLONG: { score: 82, note: 'Nên vuốt chếch nhẹ sang bên để tránh làm khuôn mặt trông dài hơn.' },
      DIAMOND: { score: 92, note: 'Mai taper mềm mại giúp khuôn mặt có chiều sâu và hài hòa hơn.' },
      HEART: { score: 90, note: 'Tạo điểm nhấn nam tính, cân bằng tỉ lệ giữa trán và cằm.' }
    },
    suggestedProduct: { id: 'SP01', name: 'Apestomen Volcanic Clay VIP', price: 345000, category: 'Sáp vuốt tóc giữ nếp', image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay/Apestomen_Volcanic_Clay_01.jpg' },
    suggestedService: { id: 'DV01', name: 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade', price: 120000 }
  },
  'two-block': {
    id: 'two-block',
    name: 'Two-Block 6/4 Lãng Tử',
    category: 'trends',
    tag: 'K-STYLE IDOL',
    desc: 'Phần mai và gáy tỉa ngắn gọn, phần trên để dài rẽ ngôi 6/4 bồng bềnh chuẩn phong cách Hàn Quốc.',
    faceSuitability: {
      OVAL: { score: 99, note: 'Rất cân đối và hài hòa từ góc chính diện đến góc nghiêng.' },
      SQUARE: { score: 91, note: 'Mái rủ 2 bên trán giúp che bớt góc trán vuông, tạo nét lãng tử thu hút.' },
      ROUND: { score: 87, note: 'Cần sấy nâng phom đỉnh đầu để tạo cảm giác khuôn mặt thanh thoát hơn.' },
      OBLONG: { score: 97, note: 'Phù hợp rõ rệt! Tóc mái rủ che trán giúp cân đối chiều dài mặt.' },
      DIAMOND: { score: 95, note: 'Phom tóc ôm sát gò má giúp làm dịu độ nhô của xương gò má.' },
      HEART: { score: 94, note: 'Đường rẽ ngôi 6/4 tôn phần cằm thon gọn và đường nét sáng.' }
    },
    suggestedProduct: { id: 'SP51', name: 'Reuzel Grooming Tonic', price: 692000, category: 'Xịt tạo phồng tự nhiên', image: 'Men_Grooming_Products/03_Xit_Tao_Phong_Pre_Styling/Reuzel_Grooming_Tonic/Reuzel_Grooming_Tonic/Reuzel_Grooming_Tonic_01.jpg' },
    suggestedService: { id: 'DV02', name: 'Cắt & Ép Side tóc nam (Down Perm Combo)', price: 250000 }
  },
  'ivy-league': {
    id: 'ivy-league',
    name: 'Ivy League Hiện Đại',
    category: 'classic',
    tag: 'DOANH NHÂN',
    desc: 'Kiểu tóc cổ điển gọn gàng kết hợp fade hiện đại, mái vuốt lệch nhẹ 8/2 lịch thiệp.',
    faceSuitability: {
      OVAL: { score: 98, note: 'Gọn gàng, ngũ quan sáng rõ và phong thái lịch lãm.' },
      SQUARE: { score: 98, note: 'Tôn góc cạnh nam tính của xương quai hàm và đường nét mạnh mẽ.' },
      ROUND: { score: 90, note: 'Đường cạo mai sắc nét giúp định hình phom mặt gọn gàng.' },
      OBLONG: { score: 88, note: 'Chiều dài tóc ngắn vừa phải giữ sự cân đối tự nhiên.' },
      DIAMOND: { score: 92, note: 'Rất lịch lãm, hợp trang phục công sở và phong cách tối giản.' },
      HEART: { score: 91, note: 'Tôn vòm trán thông minh và đường viền cằm gọn gàng.' }
    },
    suggestedProduct: { id: 'SP30', name: 'Reuzel Green Medium Hold Grease', price: 692000, category: 'Pomade giữ nếp', image: 'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Green_Medium_Hold_Grease/Reuzel_Green_Medium_Hold_Grease_01.jpg' },
    suggestedService: { id: 'CB01', name: 'Combo Quý Tộc Barber (Cắt + Gội + Cạo râu)', price: 300000 }
  },
  'undercut-slick': {
    id: 'undercut-slick',
    name: 'Undercut Slicked Back',
    category: 'classic',
    tag: 'QUYỀN LỰC',
    desc: 'Cạo sát 2 bên mai (Skin Fade), tóc đỉnh đầu vuốt mượt bóng ra sau với pomade gốc nước.',
    faceSuitability: {
      OVAL: { score: 96, note: 'Khoe trọn ngũ quan sáng sủa, tạo vẻ sắc sảo và nam tính.' },
      SQUARE: { score: 99, note: 'Rất hợp khuôn mặt chữ điền! Đường cạo sát tôn rõ xương quai hàm nam tính.' },
      ROUND: { score: 95, note: 'Tóc ép mượt 2 bên giúp thu hẹp bề ngang khuôn mặt hiệu quả.' },
      OBLONG: { score: 76, note: 'Cần vuốt ép sát đầu để không tăng thêm chiều cao khuôn mặt.' },
      DIAMOND: { score: 89, note: 'Đường fade sắc nét mang lại diện mạo góc cạnh, gọn gàng.' },
      HEART: { score: 88, note: 'Rất tôn sống mũi cao và đường viền quai hàm sắc bén.' }
    },
    suggestedProduct: { id: 'SP34', name: 'Reuzel Blue Strong Hold Pomade', price: 692000, category: 'Pomade bóng cao cấp', image: 'Men_Grooming_Products/02_Pomade_Co_Dien_Va_Hien_Dai/Reuzel_Pomade/Reuzel_Blue_Strong_Hold_Pomade/Reuzel_Blue_Strong_Hold_Pomade_01.jpg' },
    suggestedService: { id: 'DV01', name: 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade', price: 120000 }
  },
  'ripple-perm': {
    id: 'ripple-perm',
    name: 'Uốn Con Sâu / Ripple Curls',
    category: 'wavy',
    tag: 'CÁ TÍNH',
    desc: 'Tóc uốn sóng lượn tạo kết cấu bồng bềnh và tăng độ dày tự nhiên cho mái tóc mỏng.',
    faceSuitability: {
      OVAL: { score: 96, note: 'Rất trẻ trung, thời trang và tạo điểm nhấn riêng biệt.' },
      SQUARE: { score: 93, note: 'Các lọn sóng xoăn uốn lượn làm mềm các góc hàm sắc cạnh.' },
      ROUND: { score: 89, note: 'Độ phồng đỉnh đầu giúp gương mặt trông thon dài và cá tính hơn.' },
      OBLONG: { score: 95, note: 'Độ phồng 2 bên mai giúp làm đầy đặn bề ngang khuôn mặt gầy.' },
      DIAMOND: { score: 96, note: 'Sóng tóc bao quanh giúp làm dịu phần gò má cao, nhìn hài hòa hơn.' },
      HEART: { score: 94, note: 'Hợp phong cách streetwear trẻ trung và năng động.' }
    },
    suggestedProduct: { id: 'SP05', name: 'Hanz de Fuko Quicksand', price: 879000, category: 'Sáp tạo phồng khô', image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Hanz_de_Fuko/Hanz_de_Fuko_Quicksand/Hanz_de_Fuko_Quicksand_01.jpg' },
    suggestedService: { id: 'DV05', name: 'Uốn tóc con sâu Dreadlocks / Uốn Ruffled phá cách', price: 800000 }
  },
  'mohican-fade': {
    id: 'mohican-fade',
    name: 'Mohican Ngắn & Sharp Fade',
    category: 'edgy',
    tag: 'BỤI BẶM',
    desc: 'Mái vuốt nhọn hướng về trước, hai bên cạo fade trắng dứt khoát, tạo vẻ gọn gàng và năng động.',
    faceSuitability: {
      OVAL: { score: 94, note: 'Khỏe khoắn, nam tính và giàu năng lượng thể thao.' },
      SQUARE: { score: 96, note: 'Tôn nét mạnh mẽ, dứt khoát và gọn gàng quanh viền đầu.' },
      ROUND: { score: 95, note: 'Đỉnh nhọn vuốt về trước giúp mặt trông thon gọn và dài hơn.' },
      OBLONG: { score: 79, note: 'Nên tỉa mái ngắn vừa để không làm mặt trông dài thêm.' },
      DIAMOND: { score: 90, note: 'Mang lại phong thái gọn gàng, khỏe khoắn chuẩn đường phố.' },
      HEART: { score: 88, note: 'Tạo cảm giác cân đối giữa phần trán và hàm dưới.' }
    },
    suggestedProduct: { id: 'SP01', name: 'Apestomen Volcanic Clay VIP', price: 345000, category: 'Sáp vuốt tóc giữ nếp', image: 'Men_Grooming_Products/01_Sap_Vuot_Toc_Clay_Wax/Apestomen/Apestomen_Volcanic_Clay/Apestomen_Volcanic_Clay_01.jpg' },
    suggestedService: { id: 'DV01', name: 'Cắt tóc nam Fade & Tạo kiểu sáp Pomade', price: 120000 }
  }
};

// Bảng màu nhuộm
const HAIR_COLORS = {
  'natural-black': {
    id: 'natural-black',
    name: 'Đen Tự Nhiên (Natural Black)',
    hex: '#141413',
    undertoneMatch: ['WARM', 'COOL', 'NEUTRAL'],
    desc: 'Tôn da khỏe khoắn, phù hợp phong thái đĩnh đạc và môi trường công sở.'
  },
  'cold-ash-brown': {
    id: 'cold-ash-brown',
    name: 'Nâu Lạnh Sâu (Cold Ash Brown)',
    hex: '#523A28',
    undertoneMatch: ['WARM', 'NEUTRAL'],
    desc: 'Màu nhuộm số 1 cho làn da nam giới Việt Nam: sáng da, không cần tẩy, cực kỳ sang trọng.'
  },
  'titan-grey': {
    id: 'titan-grey',
    name: 'Xám Khói Titan (Titan Grey)',
    hex: '#6B7280',
    undertoneMatch: ['COOL', 'NEUTRAL'],
    desc: 'Ánh khói titan kim loại thời thượng, cực kỳ tôn da sáng và tạo điểm nhấn nổi bật.'
  },
  'nordic-platinum': {
    id: 'nordic-platinum',
    name: 'Vàng Cát Trầm (Nordic Sand)',
    hex: '#C59B27',
    undertoneMatch: ['WARM', 'NEUTRAL'],
    desc: 'Tông vàng cát ấm áp, bắt sáng dưới ánh đèn sân khấu và tôn vinh phom tóc uốn.'
  },
  'chestnut-brown': {
    id: 'chestnut-brown',
    name: 'Nâu Hạt Dẻ (Chestnut)',
    hex: '#6F4E37',
    undertoneMatch: ['WARM', 'COOL', 'NEUTRAL'],
    desc: 'Tông màu ấm áp, nhẹ nhàng, mang lại cảm giác thân thiện và lịch lãm.'
  },
  'moss-ash': {
    id: 'moss-ash',
    name: 'Rêu Khói Ánh Xanh (Moss Ash)',
    hex: '#4A5568',
    undertoneMatch: ['COOL', 'NEUTRAL'],
    desc: 'Màu nhuộm phá cách thời thượng, thể hiện gu thẩm mỹ hiện đại và cuốn hút.'
  },
  'caramel-mocha': {
    id: 'caramel-mocha',
    name: 'Nâu Mocha Caramel (Caramel Mocha)',
    hex: '#8B5A2B',
    undertoneMatch: ['WARM', 'NEUTRAL'],
    desc: 'Tông nâu caramel trầm ấm, ngọt ngào và cực kỳ tôn vinh đường nét ngũ quan nam tính.'
  },
  'pure-platinum': {
    id: 'pure-platinum',
    name: 'Bạch Kim Khói (Pure Platinum)',
    hex: '#E5E7EB',
    undertoneMatch: ['COOL', 'NEUTRAL'],
    desc: 'Bạch kim ánh bạc thời thượng đẳng cấp quốc tế, phong cách idol nổi bật.'
  }
};

// Giải quyết đường dẫn Python Vision và chạy tiến trình phân tích/ghép tóc cục bộ
function runPythonVisionTask(args, stdinPayload, { timeoutMs = 35000, maxBufferMb = 15, label = 'Vision' } = {}) {
  try {
    const pythonPaths = [
      'C:\\Users\\pcx\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
      'python',
      'python3'
    ];
    let selectedPython = pythonPaths[0];
    for (const p of pythonPaths) {
      if (fs.existsSync(p)) { selectedPython = p; break; }
    }
    const scriptPath = path.join(__dirname, 'vision_analyzer.py');
    if (!fs.existsSync(scriptPath)) return null;

    const spawnOpts = {
      encoding: 'utf-8',
      timeout: timeoutMs,
      maxBuffer: maxBufferMb * 1024 * 1024
    };
    if (stdinPayload !== undefined && stdinPayload !== null) {
      spawnOpts.input = stdinPayload;
    }

    const proc = spawnSync(selectedPython, [scriptPath, ...args], spawnOpts);
    if (!proc || proc.error || !proc.stdout) {
      if (proc?.error) console.warn(`[Python ${label} Error]:`, proc.error.message);
      else if (proc?.status && proc.stderr) console.warn(`[Python ${label} Stderr]:`, proc.stderr.slice(-400));
      return null;
    }

    const lines = proc.stdout.trim().split('\n');
    const jsonLine = lines.find(l => l.trim().startsWith('{') && l.trim().endsWith('}')) || lines[lines.length - 1];
    const data = JSON.parse(jsonLine);
    if (data && typeof data === 'object') return data;
  } catch (e) {
    console.warn(`[Python ${label} Warning]:`, e.message);
  }
  return null;
}

// Gọi script Python phân tích ảnh
function runPythonVisionAnalyzer(imageInput, includeAssets = true) {
  if (includeAssets && typeof imageInput === 'string' && fs.existsSync(imageInput)) {
    const data = runPythonVisionTask([imageInput], null, { timeoutMs: 30000, maxBufferMb: 15, label: 'Analyzer' });
    return (data && data.success) ? data : null;
  }
  const stdinPayload = includeAssets
    ? (imageInput || '')
    : JSON.stringify({ image: imageInput || '', includeAssets: false });
  const data = runPythonVisionTask([], stdinPayload, { timeoutMs: 30000, maxBufferMb: 15, label: 'Analyzer' });
  return (data && data.success) ? data : null;
}

// Gọi script Python ghép kiểu tóc
function runPythonVisionRestyle(options) {
  const payload = JSON.stringify({
    image: options.imageBase64OrUrl,
    hairstyleId: options.hairstyleId || 'layer-korean',
    colorHex: options.colorHex || '#141413',
    volume: options.volume || 'standard',
    finish: options.finish || 'matte',
    preserveBackground: options.preserveBackground !== false,
    balanceLighting: options.balanceLighting !== false,
    smoothSkin: options.smoothSkin !== false
  });
  return runPythonVisionTask(['restyle'], payload, { timeoutMs: 45000, maxBufferMb: 25, label: 'Restyle' });
}

// Phân tích hình dáng khuôn mặt từ ảnh
async function analyzeFaceGeometry(imageBase64OrUrl, options = {}) {
  const includeAssets = options.includeAssets !== false;
  let resolvedImage = imageBase64OrUrl;
  try {
    resolvedImage = await fetchImageAsDataUri(imageBase64OrUrl);
  } catch (err) {
    console.warn('[AI Service] Image fetch fallback to raw input:', err.message);
  }

  // CHẠY PYTHON COMPUTER VISION
  const pyResult = runPythonVisionAnalyzer(resolvedImage, includeAssets);
  if (pyResult && pyResult.success) {
    const mappedScores = {};
    for (const [key, s] of Object.entries(HAIRSTYLES)) {
      const scoreVal = (pyResult.styleScores && pyResult.styleScores[key] != null)
        ? Number(pyResult.styleScores[key])
        : null;
      if (scoreVal === null || Number.isNaN(scoreVal)) continue;
      mappedScores[key] = {
        hairstyleId: key,
        name: s.name,
        tag: s.tag,
        score: scoreVal,
        note: `Độ tương thích nhân trắc học 3D: ${scoreVal}%`,
        isTopMatch: pyResult.topMatch && (pyResult.topMatch.name === s.name || s.name.includes(pyResult.topMatch.name))
      };
    }
    const bestStyleKey = Object.keys(mappedScores).find(k => mappedScores[k].isTopMatch) || 'sidepart-gentleman';
    const topStyle = HAIRSTYLES[bestStyleKey] || HAIRSTYLES['sidepart-gentleman'];

    return {
      success: true,
      provider: pyResult.provider || 'Python Vision Engine (MediaPipe 3D Face Mesh)',
      faceShape: pyResult.faceShape,
      skinUndertone: pyResult.skinUndertone,
      styleScores: mappedScores,
      topMatch: mappedScores[bestStyleKey],
      metrics: pyResult.metrics,
      geometry: pyResult.geometry,
      croppedGeometry: pyResult.croppedGeometry || null,
      barberAdvice: pyResult.barberAdvice,
      suggestedProduct: topStyle.suggestedProduct,
      suggestedService: topStyle.suggestedService,
      croppedImageUrl: pyResult.croppedImageUrl || null,
      cleanBaseImageUrl: pyResult.cleanBaseImageUrl || null,
      transparentPngUrl: pyResult.transparentPngUrl || null,
      autoCropApplied: pyResult.autoCropApplied || false,
      backgroundRemoved: pyResult.backgroundRemoved || false,
      oldHairRemoved: pyResult.oldHairRemoved || false,
      analyzedAt: new Date().toISOString()
    };
  }

  // Báo lỗi rõ ràng từ AI Engine nếu không phát hiện được khuôn mặt (không tạo dữ liệu giả lập / fake fallback)
  return {
    success: false,
    message: (pyResult && pyResult.error) ? pyResult.error : 'Không thể phát hiện khuôn mặt rõ nét trong ảnh chân dung. Vui lòng sử dụng ảnh góc chụp thẳng, sáng rõ.',
    faceShape: null,
    skinUndertone: null,
    styleScores: {}
  };
}

// Tạo ảnh kiểu tóc mẫu phù hợp với khuôn mặt

function isPrivateOrReservedIp(ip) {
  if (!ip) return true;
  const normalized = ip.toLowerCase().trim();
  if (normalized === '::1' || normalized === '::' || normalized === '0.0.0.0') return true;
  if (normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('ff')) return true;
  const v4 = normalized.startsWith('::ffff:') ? normalized.slice(7) : normalized;
  if (!net.isIPv4(v4)) return normalized.includes(':');
  const parts = v4.split('.').map(n => parseInt(n, 10));
  if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function isSafePublicImageUrl(rawUrl) {
  let parsed;
  try { parsed = new URL(rawUrl); } catch (_) { return false; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) return false;
  if (net.isIP(hostname)) return !isPrivateOrReservedIp(hostname);
  try {
    const recs = await dns.lookup(hostname, { all: true });
    return Array.isArray(recs) && recs.length > 0 && recs.every(r => !isPrivateOrReservedIp(r.address));
  } catch (_) {
    return false;
  }
}

async function downloadRemoteImageSafe(targetUrl, redirectsLeft = 2) {
  const safe = await isSafePublicImageUrl(targetUrl);
  if (!safe) return '';
  return new Promise((resolve) => {
    const client = targetUrl.startsWith('https://') ? https : http;
    client.get(targetUrl, { timeout: 10000 }, async (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) return resolve('');
        try {
          const nextUrl = new URL(res.headers.location, targetUrl).toString();
          resolve(await downloadRemoteImageSafe(nextUrl, redirectsLeft - 1));
        } catch (_) {
          resolve('');
        }
        return;
      }
      const chunks = [];
      let total = 0;
      res.on('data', c => {
        total += c.length;
        if (total <= 12 * 1024 * 1024) chunks.push(c);
        else res.destroy();
      });
      res.on('end', () => {
        if (total > 12 * 1024 * 1024 || chunks.length === 0) return resolve('');
        const buf = Buffer.concat(chunks);
        const mime = res.headers['content-type']?.split(';')[0] || 'image/jpeg';
        resolve(`data:${mime};base64,${buf.toString('base64')}`);
      });
    }).on('error', () => resolve(''));
  });
}

// Chuyển ảnh sang định dạng Base64
async function fetchImageAsDataUri(imageBase64OrUrl) {
  if (!imageBase64OrUrl) return '';
  if (imageBase64OrUrl.startsWith('data:image/')) return imageBase64OrUrl;

  let targetUrl = imageBase64OrUrl;
  if (typeof targetUrl === 'string' && targetUrl.includes('/api/ai/proxy-image?url=')) {
    try {
      targetUrl = decodeURIComponent(targetUrl.split('url=')[1]);
    } catch (_) {
      return '';
    }
  }

  // Nếu URL trỏ về localhost hoặc emulator nội bộ, chuyển thành đường dẫn tương đối để kiểm tra thư mục công khai
  let localCheckPath = targetUrl;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?\//i.test(targetUrl)) {
    try {
      localCheckPath = new URL(targetUrl).pathname;
    } catch (err) {
      console.warn('[AI Service] Invalid local URL:', err.message);
    }
  }

  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
    if (localCheckPath === targetUrl) {
      const downloaded = await downloadRemoteImageSafe(targetUrl, 2);
      if (downloaded) return downloaded;
      return '';
    }
  }

  // Chỉ cho phép đọc ảnh cục bộ nằm trong các thư mục công khai hợp lệ
  const cleanRel = String(localCheckPath || '').replace(/^[\/\\]+/, '').replace(/\.\./g, '');
  if (!cleanRel.includes('\0')) {
    const cleanDataPic = cleanRel.replace(/^DataPicture[\/\\]/i, '');
    const safeBase = path.basename(cleanRel);
    const allowedRoots = [
      { base: path.resolve(__dirname, 'hairstyles'), target: path.resolve(__dirname, 'hairstyles', safeBase) },
      { base: path.resolve(__dirname, '..', '..', 'frontend', 'assets', 'hairstyles'), target: path.resolve(__dirname, '..', '..', 'frontend', 'assets', 'hairstyles', safeBase) },
      { base: path.resolve(__dirname, '..', '..', 'frontend', 'DataPicture'), target: path.resolve(__dirname, '..', '..', 'frontend', 'DataPicture', cleanDataPic) },
      { base: path.resolve(__dirname, '..', '..', '..', 'DataPicture'), target: path.resolve(__dirname, '..', '..', '..', 'DataPicture', cleanDataPic) }
    ];
    for (const pair of allowedRoots) {
      const rel = path.relative(pair.base, pair.target);
      if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) continue;
      if (fs.existsSync(pair.target)) {
        try {
          const realBase = fs.realpathSync(pair.base);
          const realTarget = fs.realpathSync(pair.target);
          const realRel = path.relative(realBase, realTarget);
          if (!realRel || realRel.startsWith('..') || path.isAbsolute(realRel)) continue;
          const stat = fs.statSync(realTarget);
          if (stat.isFile()) {
            const buf = fs.readFileSync(realTarget);
            return `data:image/jpeg;base64,${buf.toString('base64')}`;
          }
        } catch (err) {
          console.warn('[AI Service] Local file read skipped:', err.message);
        }
      }
    }
  }

  // Nếu chuỗi là Base64 thuần chưa có tiền tố data:image/
  if (typeof targetUrl === 'string' && /^[A-Za-z0-9+/=]+$/.test(targetUrl.replace(/\s+/g, '')) && targetUrl.length > 200) {
    return `data:image/jpeg;base64,${targetUrl}`;
  }

  return '';
}

async function generateAiHairRestyle(options) {
  const {
    imageBase64OrUrl,
    hairstyleId = 'layer-korean',
    colorId = 'natural-black',
    customPrompt = '',
    volume = 'standard',
    finish = 'matte',
    preserveBackground = true,
    balanceLighting = true,
    smoothSkin = true
  } = options;

  const style = HAIRSTYLES[hairstyleId] || HAIRSTYLES['layer-korean'];
  const color = HAIR_COLORS[colorId] || HAIR_COLORS['natural-black'];
  const colorHex = options.colorHex || options.hairColorHex || color.hex || '#141413';

  // Suy luận nhẹ tùy chọn từ ghi chú của khách nếu khách gõ thêm mô tả
  const noteLower = String(customPrompt || '').toLowerCase();
  let effectiveVolume = ['natural', 'standard', 'high'].includes(volume) ? volume : 'standard';
  let effectiveFinish = ['matte', 'gloss'].includes(finish) ? finish : 'matte';
  if (effectiveVolume === 'standard') {
    if (/(bồng|phồng|cao|volume|high)/.test(noteLower)) effectiveVolume = 'high';
    else if (/(xẹp|ôm sát|natural|tự nhiên)/.test(noteLower)) effectiveVolume = 'natural';
  }
  if (effectiveFinish === 'matte' && /(bóng|pomade|gloss|ướt)/.test(noteLower)) {
    effectiveFinish = 'gloss';
  }

  // Giải mã URL / đường dẫn tĩnh nội bộ sang Base64 Data URI an toàn trước khi xử lý
  let resolvedImage = imageBase64OrUrl;
  if (imageBase64OrUrl) {
    try {
      const fetched = await fetchImageAsDataUri(imageBase64OrUrl);
      if (fetched) resolvedImage = fetched;
    } catch (err) {
      console.warn('[AI Service] Image resolve failed:', err.message);
    }
  }

  // Engine 3D Local Computer Vision (MediaPipe + OpenCV)
  let pyRestyle = null;
  if (resolvedImage) {
    pyRestyle = runPythonVisionRestyle({
      imageBase64OrUrl: resolvedImage,
      hairstyleId: style.id,
      colorHex: colorHex,
      volume: effectiveVolume,
      finish: effectiveFinish,
      preserveBackground: preserveBackground !== false,
      balanceLighting,
      smoothSkin
    });
  }

  if (pyRestyle && pyRestyle.success && pyRestyle.resultImageUrl) {
    let faceAnalysis = pyRestyle.faceAnalysis;
    if (!faceAnalysis) {
      try {
        faceAnalysis = await analyzeFaceGeometry(resolvedImage);
      } catch (err) {
        console.warn('[AI Service] Fallback geometry check failed:', err.message);
      }
    }
    return {
      success: true,
      hairstyle: {
        id: style.id,
        name: style.name,
        tag: style.tag,
        desc: style.desc
      },
      color: {
        id: color.id,
        name: color.name,
        hex: colorHex
      },
      faceAnalysis,
      resultImageUrl: pyRestyle.resultImageUrl,
      originalImageUrl: imageBase64OrUrl,
      isFacePreserved: true,
      backgroundPreserved: pyRestyle.backgroundPreserved !== false,
      volumeApplied: pyRestyle.volume || effectiveVolume,
      finishApplied: pyRestyle.finish || effectiveFinish,
      faceBalancingApplied: {
        lightingBalance: balanceLighting !== false,
        skinSmoothing: smoothSkin !== false,
        facialSymmetry: true
      },
      customPromptApplied: customPrompt,
      providerUsed: pyRestyle.provider || 'Omni Vision 3D Hair Engine',
      suggestedService: style.suggestedService,
      suggestedProduct: style.suggestedProduct,
      createdAt: new Date().toISOString()
    };
  }

  // Trả về thông báo lỗi rõ ràng nếu không tìm thấy khuôn mặt
  const errMsg = (pyRestyle && pyRestyle.error) ? pyRestyle.error : 'Không thể phát hiện khuôn mặt rõ nét trong ảnh chân dung của khách hàng. Vui lòng chụp góc thẳng sáng rõ.';
  let faceAnalysis = null;
  try {
    faceAnalysis = await analyzeFaceGeometry(resolvedImage || imageBase64OrUrl);
  } catch (err) {
    console.warn('[AI Service] Secondary face geometry check failed:', err.message);
  }

  return {
    success: false,
    message: errMsg,
    originalImageUrl: imageBase64OrUrl,
    faceAnalysis,
    hairstyle: {
      id: style.id,
      name: style.name,
      tag: style.tag
    },
    color: {
      id: color.id,
      name: color.name,
      hex: colorHex
    }
  };
}

module.exports = {
  HAIRSTYLES,
  HAIR_COLORS,
  fetchImageAsDataUri,
  analyzeFaceGeometry,
  generateAiHairRestyle,
  runPythonVisionRestyle,
  runPythonVisionAnalyzer
};
