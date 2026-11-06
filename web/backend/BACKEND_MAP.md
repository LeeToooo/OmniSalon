# BẢN ĐỒ KIẾN TRÚC & TRA CỨU API BACKEND (OMNI SALON)

## 1. NGUYÊN TẮC BẤT DI BẤT DỊCH
- **Luồng dữ liệu**: `Request -> Middleware -> Route -> Controller -> Service -> Database -> Response`.
- **Phân tách trách nhiệm**:
  - `routes/`: Chỉ khai báo pathname URL, HTTP methods (GET, POST, PUT, DELETE) và điều hướng request/middleware.
  - `controllers/`: Tiếp nhận request, validate đầu vào, gọi Service xử lý và trả về JSON chuẩn format `{ success, data, message, error }`.
  - `services/`: Thực thi 100% logic nghiệp vụ, tính toán tiền/chiết khấu/thuế, tạo mã ID tự tăng và thực hiện truy vấn SQL (`querySql`).
- Tuyệt đối không viết trực tiếp logic nghiệp vụ hoặc câu lệnh SQL dài vào file `routes/*.js`.
- Mọi API mới thêm phải được cập nhật vào bảng tra cứu bên dưới.

---

## 2. MA TRẬN TRA CỨU ENDPOINT & MÃ NGUỒN

| Phân hệ / Nghiệp vụ | Endpoint Prefix | Route File | Controller File | Service File |
| :--- | :--- | :--- | :--- | :--- |
| **Xác thực, OTP, Đăng nhập, Tài khoản** | `/api/auth`, `/api/accounts` | [`routes/auth/`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/routes/auth/) | [`controllers/auth.controller.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/controllers/auth.controller.js) | [`services/auth.service.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/services/auth.service.js)<br>[`services/otp_service.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/services/otp_service.js) |
| **Đặt lịch hẹn, Sơ đồ ghế, Hủy lịch** | `/api/bookings` | [`routes/bookings/`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/routes/bookings/) | [`controllers/booking.controller.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/controllers/booking.controller.js) | [`services/booking.service.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/services/booking.service.js) |
| **Cửa hàng, Sản phẩm, Đơn hàng, Kho, POS** | `/api/store`, `/api/orders`, `/api/pos`, `/api/inventory` | [`routes/store/`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/routes/store/) | [`controllers/store.controller.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/controllers/store.controller.js) | [`services/store.service.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/services/store.service.js) |
| **Quản lý Salon, Dịch vụ, Thợ, Chi nhánh** | `/api/salon`, `/api/branches`, `/api/staff`, `/api/services` | [`routes/salon/`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/routes/salon/) | [`controllers/salon.controller.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/controllers/salon.controller.js) | [`services/salon.service.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/services/salon.service.js) |
| **Marketing, Voucher, Review, Thông báo** | `/api/marketing`, `/api/promotions`, `/api/reviews`, `/api/notifications` | [`routes/marketing/`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/routes/marketing/) | [`controllers/marketing.controller.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/controllers/marketing.controller.js) | [`services/marketing.service.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/services/marketing.service.js) |
| **Báo cáo KPI, Doanh thu POS, Kiểm toán** | `/api/analytics`, `/api/audit` | [`routes/analytics/`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/routes/analytics/) | [`controllers/analytics.controller.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/controllers/analytics.controller.js) | [`services/analytics.service.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/services/analytics.service.js) |
| **AI Kiểu tóc (Restyle Engine, Vision)** | `/api/ai` | [`routes/ai/`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/routes/ai/) | [`controllers/ai.controller.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/controllers/ai.controller.js) | [`ai_engine/ai_service.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/ai_engine/ai_service.js) |

---

## 3. CÁC FILE HỆ THỐNG CỐT LÕI
- [`server.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/server.js): Điểm khởi chạy máy chủ Node.js HTTP/Express, thiết lập middleware CORS, nạp cấu hình và đăng ký bộ định tuyến trung tâm `routes/index.js`.
- [`database/db.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/database/db.js): Quản lý Pool kết nối cơ sở dữ liệu Microsoft SQL Server (mssql), cung cấp hàm helper `querySql(sql, params)`.
- [`database/QL_SALON.sql`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/database/QL_SALON.sql): Schema CSDL chuẩn hóa toàn bộ hệ thống salon (Khách hàng, Nhân viên, Lịch hẹn, Hóa đơn, Kho hàng, Dịch vụ).
- [`middlewares/auth_middleware.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/middlewares/auth_middleware.js): Giải mã JWT token, trích xuất danh tính người dùng (`extractAuthUser`) và kiểm tra phân quyền RBAC (`SUPER_ADMIN`, `BRANCH_MANAGER`, `STAFF`, `CUSTOMER`).
- [`services/helper_service.js`](file:///c:/Users/pcx/Desktop/OmniSalon/web/backend/services/helper_service.js): Bộ hàm phụ trợ dùng chung: sinh mã tự động (ID), định dạng thời gian/ngày tháng, tính giờ kết thúc dịch vụ, tra cứu khách hàng.

