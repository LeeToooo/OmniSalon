# 💈 TÀI LIỆU CHỨC NĂNG CÁC FILE & FOLDER BACKEND OMNISALON

Tài liệu giải thích cụ thể **chức năng** và **mục đích sử dụng thực tế (giải quyết vấn đề gì)** của từng thư mục và từng file trong backend.

---

## 🚀 1. FILE GỐC ĐIỀU PHỐI

### `server.js`
* **Chức năng:** Máy chủ HTTP gốc, cổng vào duy nhất (Entry point) của toàn bộ hệ thống backend.
* **Sử dụng cho vấn đề gì:**
  * Khởi tạo máy chủ lắng nghe tại cổng `3000`.
  * Kết nối CSDL SQL Server khi bắt đầu chạy.
  * Cấu hình bảo mật CORS cho phép frontend gọi API.
  * Đọc dữ liệu gửi lên (Request Body) và phân loại: nếu là đường dẫn `/api/...` thì chuyển tiếp vào thư mục `routes/`, nếu là ảnh/css/js thì trả về file tĩnh cho giao diện web.

---

## ⚙️ 2. THƯ MỤC CẤU HÌNH: `config/`

### `ai_config.json`
* **Chức năng:** Lưu thông số và chìa khóa kết nối với mô hình AI.
* **Sử dụng cho vấn đề gì:** Quản lý Google Gemini API Key, model đang chọn (`gemini-2.5-flash`) và nhiệt độ sinh ảnh mà không cần phải can thiệp trực tiếp vào code.

### `ai_config.example.json`
* **Chức năng:** File mẫu cấu hình AI dự phòng.
* **Sử dụng cho vấn đề gì:** Dùng làm mẫu tham khảo hoặc sao chép nhanh khi triển khai dự án sang máy tính hoặc server mới.

### `email_config.json`
* **Chức năng:** Lưu tài khoản SMTP Gmail gửi thư tự động.
* **Sử dụng cho vấn đề gì:** Cấu hình email và mật khẩu ứng dụng (App Password) của Google để gửi mã xác thực OTP về hòm thư khách hàng khi đăng ký tài khoản hoặc quên mật khẩu.

---

## 🛡️ 3. THƯ MỤC BẢO MẬT & PHÂN QUYỀN: `middlewares/`

### `auth_middleware.js`
* **Chức năng:** Kiểm soát phiên đăng nhập và phân quyền truy cập API.
* **Sử dụng cho vấn đề gì:**
  * Tạo chuỗi Token JWT (HS256) khi người dùng đăng nhập thành công.
  * Đọc và giải mã token từ Header `Authorization: Bearer <token>`.
  * Chặn người dùng chưa đăng nhập hoặc không đủ quyền hạn (ví dụ: Khách hàng cố tình gọi API của Quản lý/Admin) bằng mã lỗi `401 Unauthorized` hoặc `403 Forbidden`.
  * Quản lý danh sách tên miền được phép gọi API (CORS Whitelist).

---

## 🗄️ 4. THƯ MỤC CƠ SỞ DỮ LIỆU: `database/`

### `db.js`
* **Chức năng:** Cầu nối liên kết trực tiếp giữa ứng dụng Node.js và Microsoft SQL Server.
* **Sử dụng cho vấn đề gì:**
  * Tự động quét và tìm kiếm instance SQL Server đang chạy (`.\SQLEXPRESS`, `localhost\SQLEXPRESS`).
  * Cung cấp hàm truy vấn dùng chung `querySql(sql, params)` sử dụng Parameterized Query để phòng chống 100% tấn công SQL Injection.

### `setup_db.js`
* **Chức năng:** Kịch bản kiểm tra và khởi tạo CSDL tự động.
* **Sử dụng cho vấn đề gì:** Kiểm tra xem máy chủ đã có CSDL `QL_SALONTOC` với đủ 29 bảng hay chưa. Nếu là máy mới cài đặt, script sẽ tự động tạo database và nạp dữ liệu từ file `QL_SALON.sql`.

### `QL_SALON.sql`
* **Chức năng:** File kịch bản cơ sở dữ liệu SQL Server hoàn chỉnh.
* **Sử dụng cho vấn đề gì:** Định nghĩa cấu trúc 29 bảng, các ràng buộc toàn vẹn khóa chính/khóa ngoại, các Trigger cập nhật kho, các View báo cáo và nạp dữ liệu mẫu ban đầu (20 chi nhánh, 70+ thợ, 125 sản phẩm).

---

## 🤖 5. THƯ MỤC AI & THỊ GIÁC MÁY TÍNH: `ai_engine/`

### `ai_service.js`
* **Chức năng:** Bộ não điều khiển các tính năng AI của salon.
* **Sử dụng cho vấn đề gì:**
  * Gọi Google Gemini Vision để ghép và tạo ảnh thử kiểu tóc mới photorealistic theo yêu cầu của khách.
  * Điều phối chạy script Python trích xuất hình học khuôn mặt.
  * Đóng vai trò trợ lý ảo Barber Master AI tư vấn kiểu tóc nam theo dáng mặt, chất tóc và phong cách.

### `vision_analyzer.py`
* **Chức năng:** Kịch bản Python xử lý ảnh chân dung khách hàng bằng MediaPipe.
* **Sử dụng cho vấn đề gì:** Đo đạc 468 điểm mốc không gian 3 chiều (Face Mesh) trên khuôn mặt, tính toán tỉ lệ giữa trán, xương hàm, gò má và cằm để kết luận chính xác khuôn mặt thuộc dạng: Tròn, Dài, Vuông, Trái xoan, Kim cương hay Trái tim.

### `face_landmarker.task`
* **Chức năng:** Mô hình học sâu MediaPipe Face Landmarker dạng nhị phân.
* **Sử dụng cho vấn đề gì:** Cung cấp trọng số mạng nơ-ron nhận diện nhanh các điểm ngũ quan trên mặt mà không cần kết nối Internet.

### `selfie_multiclass.tflite`
* **Chức năng:** Mô hình học sâu TensorFlow Lite phân đoạn ảnh chân dung.
* **Sử dụng cho vấn đề gì:** Tách vùng tóc và da đầu ra khỏi khuôn mặt và phông nền phía sau để phục vụ cho việc ghép tóc mới chính xác.

### `hairstyles/`
* **Chức năng:** Thư mục lưu 6 ảnh phom tóc nam mẫu chuẩn salon (Buzzcut, French Crop, Korean Layer, Mullet, Pompadour, Sidepart).
* **Sử dụng cho vấn đề gì:** Cung cấp ảnh mẫu gốc để AI đối chiếu và ghép phom tóc vào ảnh khách hàng.

---

## 📦 6. THƯ MỤC DỊCH VỤ DÙNG CHUNG: `services/`

### `otp_service.js`
* **Chức năng:** Dịch vụ phát hành và kiểm tra mã xác thực OTP.
* **Sử dụng cho vấn đề gì:**
  * Sinh mã ngẫu nhiên 6 chữ số gửi qua Gmail hoặc SMS.
  * Ngăn chặn gửi thư rác: Giới hạn tối thiểu 30 giây giữa 2 lần gửi liên tiếp (Rate Limiting).
  * Kiểm tra tính hợp lệ của mã OTP và hủy mã sau 5 phút tồn tại.

### `helper_service.js`
* **Chức năng:** Tập hợp các hàm tiện ích nghiệp vụ dùng chung cho các router.
* **Sử dụng cho vấn đề gì:**
  * Định dạng thời gian, ngày tháng (`HH:mm`, `YYYY-MM-DD`).
  * Tính giờ kết thúc dịch vụ từ giờ bắt đầu và thời lượng làm tóc.
  * Tự động tìm kiếm hoặc khởi tạo khách hàng mới nếu khách vãng lai chưa có trong hệ thống.
  * Sinh mã định danh tự tăng cho các giao dịch mới (`LH...`, `DH...`, `HD...`).

---

## 🔀 7. THƯ MỤC ROUTER ĐIỀU PHỐI API: `routes/`

### `index.js`
* **Chức năng:** Bộ định tuyến trung tâm (Central Router).
* **Sử dụng cho vấn đề gì:** Nhận mọi request API từ `server.js` và lần lượt chuyển giao cho đúng 7 phân hệ chuyên biệt bên dưới xử lý.

---

### 7.1. Phân hệ Xác thực & Tài khoản: `routes/auth/`

* **`auth.routes.js`**:
  * **Chức năng:** Xử lý chu trình đăng nhập và bảo mật tài khoản.
  * **Sử dụng cho vấn đề gì:** Đăng nhập (`/api/auth/login`), Đăng ký tài khoản (`/api/auth/register`), Gửi và xác thực OTP, Đặt lại mật khẩu khi quên, Lấy thông tin tài khoản đang đăng nhập (`/api/auth/me`), Kiểm tra tình trạng server (`/api/health`).
* **`accounts.routes.js`**:
  * **Chức năng:** Quản trị danh sách người dùng và dữ liệu tài khoản.
  * **Sử dụng cho vấn đề gì:** Cung cấp danh sách người dùng cho trang Admin (đã ẩn mật khẩu để an toàn), xem danh sách khách hàng kèm tổng lượt đặt lịch và tổng tiền chi tiêu, tải snapshot sao lưu CSDL.
* **`index.js`**: Gộp 2 file trên thành 1 cổng vào chung cho phân hệ Auth.

---

### 7.2. Phân hệ Vận hành Salon: `routes/salon/`

* **`branches.routes.js`**:
  * **Chức năng:** Quản lý chuỗi chi nhánh salon trên toàn quốc.
  * **Sử dụng cho vấn đề gì:** Xem danh sách 20 chi nhánh kèm giờ mở/đóng cửa, thêm chi nhánh mới (tự động khởi tạo tồn kho 125 sản phẩm cho chi nhánh đó), cập nhật địa chỉ, đóng cửa chi nhánh (chuyển sang `Ngừng hoạt động` để không gãy khóa ngoại).
* **`staff.routes.js`**:
  * **Chức năng:** Quản lý nhân sự và lịch làm việc của stylist.
  * **Sử dụng cho vấn đề gì:** Lấy danh sách thợ cắt tóc kèm điểm đánh giá sao, tuyển dụng nhân viên mới, xếp ca làm việc hàng ngày (`CaLamViec`), cho nhân viên nghỉ việc (tự động chuyển các lịch hẹn chưa hoàn thành sang thợ khác cùng chi nhánh).
* **`services.routes.js`**:
  * **Chức năng:** Quản lý bảng giá dịch vụ làm tóc và các gói combo.
  * **Sử dụng cho vấn đề gì:** Lấy danh mục dịch vụ cắt/uốn/nhuộm (tự động tính giá đã trừ khuyến mãi nếu có), thêm/sửa dịch vụ, xóa dịch vụ (soft-delete nếu đã từng xuất hóa đơn), quản lý danh sách combo trọn gói.
* **`index.js`**: Gộp 3 file trên thành 1 cổng vào chung cho phân hệ Salon.

---

### 7.3. Phân hệ Đặt lịch hẹn: `routes/bookings/`

* **`bookings.routes.js`**:
  * **Chức năng:** Quản trị toàn bộ quy trình đặt lịch và phục vụ khách tại ghế.
  * **Sử dụng cho vấn đề gì:**
    * Tìm kiếm các khung giờ còn trống trong ngày của từng thợ cắt tóc (`/api/bookings/available-slots`).
    * Khách đặt lịch hẹn mới: Tự động kiểm tra tránh trùng giờ, chặn đặt lùi vào quá khứ, tự tính giờ kết thúc dựa trên thời lượng dịch vụ và lưu chi tiết vào bảng `ChiTietLichHen`.
    * Tra cứu lịch hẹn theo mã, số điện thoại hoặc tên khách hàng.
    * Lễ tân thực hiện Check-in khách vào ghế (chuyển trạng thái sang `Đang phục vụ`).
    * Khách hàng hoặc quản lý hủy lịch hẹn kèm lý do hủy.
* **`index.js`**: Cổng vào cho phân hệ Bookings.

---

### 7.4. Phân hệ Bán lẻ, POS & Kho: `routes/store/`

* **`products.routes.js`**:
  * **Chức năng:** Quản lý danh mục mỹ phẩm nam và nhóm sản phẩm.
  * **Sử dụng cho vấn đề gì:** Hiển thị sản phẩm ra website bán hàng, tự động tính giá giảm xả hàng theo hạn sử dụng (FEFO Clearance), thêm/sửa sản phẩm, quản lý danh mục (Sáp vuốt tóc, Gội xả, Dưỡng râu).
* **`orders.routes.js`**:
  * **Chức năng:** Xử lý đơn mua mỹ phẩm online.
  * **Sử dụng cho vấn đề gì:**
    * Khách tạo đơn mua online: Hệ thống tự động tìm và trừ tồn kho vào lô hàng cận date nhất tại chi nhánh gần nhất.
    * Hủy đơn hàng: Tự động hoàn trả số lượng vào đúng lô hàng đã xuất và đồng bộ lại tổng tồn kho chi nhánh (chặn hủy lặp nhiều lần).
    * Cập nhật trạng thái giao hàng, tự sinh hóa đơn và thanh toán khi đơn hoàn tất.
* **`pos.routes.js`**:
  * **Chức năng:** Máy tính tiền bán hàng tại quầy thu ngân salon (POS).
  * **Sử dụng cho vấn đề gì:** Thanh toán tức thời tại quầy cho khách vừa cắt tóc xong kết hợp mua thêm mỹ phẩm mang về, trừ tồn kho bán lẻ, sinh mã thanh toán và lưu lịch sử hóa đơn.
* **`inventory.routes.js`**:
  * **Chức năng:** Quản lý kho hàng và hạn sử dụng FEFO.
  * **Sử dụng cho vấn đề gì:** Báo cáo tồn kho thực tế từng chi nhánh, lập phiếu nhập kho lô hàng mới từ nhà cung cấp (`PhieuNhapKho`), theo dõi ngày hết hạn của từng lô hàng, hiển thị danh sách mặt hàng sắp hết để quản lý kịp nhập thêm.
* **`index.js`**: Gộp 4 file trên thành 1 cổng vào chung cho phân hệ Store.

---

### 7.5. Phân hệ Marketing & CSKH: `routes/marketing/`

* **`promotions.routes.js`**:
  * **Chức năng:** Quản lý các chương trình ưu đãi và voucher giảm giá.
  * **Sử dụng cho vấn đề gì:** Lấy danh sách voucher áp dụng cho khách hàng, tạo chương trình khuyến mãi mới (giảm theo % hoặc trừ tiền trực tiếp), gán mã giảm giá cho sản phẩm hoặc dịch vụ cụ thể.
* **`reviews.routes.js`**:
  * **Chức năng:** Quản lý đánh giá và phản hồi của khách hàng.
  * **Sử dụng cho vấn đề gì:** Cho phép khách hàng gửi đánh giá số sao (1 đến 5 sao) và nhận xét sau khi cắt tóc xong hoặc sau khi nhận đơn hàng, hiển thị danh sách đánh giá ra trang chủ.
* **`notifications.routes.js`**:
  * **Chức năng:** Hệ thống chuông thông báo cho người dùng.
  * **Sử dụng cho vấn đề gì:** Tự động tạo thông báo khi khách đặt lịch thành công, khi đơn hàng đang giao, hoặc khi hóa đơn đã thanh toán; hỗ trợ đánh dấu đã đọc.
* **`index.js`**: Gộp 3 file trên thành 1 cổng vào chung cho phân hệ Marketing.

---

### 7.6. Phân hệ Báo cáo Doanh thu: `routes/analytics/`

* **`analytics.routes.js`**:
  * **Chức năng:** Thống kê tài chính và tính lương thưởng cho thợ.
  * **Sử dụng cho vấn đề gì:**
    * Báo cáo tổng doanh thu thực tế và tổng số hóa đơn toàn hệ thống hoặc theo từng chi nhánh.
    * Tự động tính tiền hoa hồng 20% cho từng stylist dựa trên tổng giá trị các lịch hẹn thợ đó đã hoàn thành trong tháng.
* **`index.js`**: Cổng vào cho phân hệ Analytics.

---

### 7.7. Phân hệ AI Studio: `routes/ai/`

* **`ai.routes.js`**:
  * **Chức năng:** Định tuyến toàn bộ các tính năng AI Studio trên giao diện.
  * **Sử dụng cho vấn đề gì:**
    * Lấy danh mục kiểu tóc mẫu và màu nhuộm tóc (`/api/ai/hairstyles`).
    * Nhận ảnh chân dung gửi sang script Python để phân tích dáng khuôn mặt (`/api/ai/analyze-face`).
    * Gọi Google Gemini sinh ảnh thử kiểu tóc mới (`/api/ai/restyle-hair`).
    * Chat tư vấn tạo mẫu tóc với Trợ lý AI (`/api/ai/consultation`).
    * Đổi API Key Gemini (có kiểm tra bảo mật quyền Admin).
    * Proxy trung chuyển ảnh tránh lỗi CORS Canvas (đã có bộ lọc chống tấn công SSRF).
* **`index.js`**: Cổng vào cho phân hệ AI.

---

## ⚡ 8. LỆNH CHẠY HỆ THỐNG CƠ BẢN

```bash
# Khởi động Backend (Port 3000)
npm start

# Kiểm tra & Tự động nạp CSDL SQL Server
npm run setup-db
```
