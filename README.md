# OmniSalon — Hệ Thống Quản Lý & Đặt Lịch Chuỗi Salon Tóc Hiện Đại

Hệ thống ứng dụng Web hoàn chỉnh phục vụ vận hành chuỗi salon tóc nam chuyên nghiệp: tích hợp phân hệ Khách Hàng (Customer Portal), Trung tâm Quản Trị Chuỗi (Admin Hub), Quầy Thu Ngân (POS), Quản lý kho FEFO, AI Hair Studio thử kiểu tóc và Hệ thống Kiểm toán (Audit Log) phân quyền RBAC 6 vai trò.

---

## 📑 Mục Lục
1. [Tổng Quan Ứng Dụng](#1-tổng-quan-ứng-dụng)
2. [Kiến Trúc Kỹ Thuật & Công Nghệ](#2-kiến-trúc-kỹ-thuật--công-nghệ)
3. [Phân Hệ Khách Hàng (Customer Portal)](#3-phân-hệ-khách-hàng-customer-portal)
4. [Phân Hệ Quản Trị Chuỗi (Admin Hub)](#4-phân-hệ-quản-trị-chuỗi-admin-hub)
5. [Hệ Thống Phân Quyền RBAC 6 Vai Trò & Kiểm Toán](#5-hệ-thống-phân-quyền-rbac-6-vai-trò--kiểm-toán)
6. [Tài Khoản Thử Nghiệm Hệ Thống](#6-tài-khoản-thử-nghiệm-hệ-thống)
7. [Hướng Dẫn Cài Đặt & Khởi Chạy](#7-hướng-dẫn-cài-đặt--khởi-chạy)
8. [Cấu Trúc Thư Mục Dự Án](#8-cấu-trúc-thư-mục-dự-án)

---

## 1. Tổng Quan Ứng Dụng

OmniSalon cung cấp giải pháp vận hành đồng bộ thời gian thực cho chuỗi salon tóc:
- **Khách hàng**: Đặt lịch theo khung giờ trống, chọn thợ cắt, mua mỹ phẩm chính hãng, thử 28 kiểu tóc với AI Camera trước khi tới salon.
- **Nhân sự & Vận hành**: Thu ngân POS in hóa đơn nhiệt, thợ cập nhật ca làm và trạng thái ghế, thủ kho quản lý hạn sử dụng sản phẩm theo thuật toán FEFO.
- **Chủ chuỗi & Quản lý**: Báo cáo doanh thu đa chi nhánh thời gian thực, quản lý giá dịch vụ, kiểm soát tồn kho và theo dõi lịch sử thao tác qua Audit Log.

---

## 2. Kiến Trúc Kỹ Thuật & Công Nghệ

```
[ Trình Duyệt Client ]
  ├── SPA Hash Router (#/, #/booking, #/shop, #/ai-studio, #/admin)
  ├── Frontend Core (store.js, api.js, auth.js, pricing.js, theme.js)
  └── Canvas AR Hair Engine (Xử lý trực tiếp trên trình duyệt)
         │
         │  HTTP / REST API (JSON, Bearer JWT)
         ▼
[ Backend Node.js Engine (Port 3000) ]
  ├── server.js (Routing native, CORS, Static file serving)
  ├── middlewares/ (Xác thực JWT, RBAC Guard, Error handling)
  ├── routes/ (Auth, Salon, Bookings, Store, Marketing, Analytics, AI, Payment)
  ├── services/ (Helper, Audit, Auto-cancel, OTP, PayOS, VNPay)
  └── ai_engine/ (Google Gemini 2.5 Flash + Python MediaPipe Restyle)
         │
         │  ODBC Driver 17 / msnodesqlv8
         ▼
[ Cơ Sở Dữ Liệu SQL Server (QL_SALON) ]
  └── 15 bảng quan hệ, Triggers kiểm tra trùng slot, Views tổng hợp doanh thu
```

- **Frontend**: Single Page Application (SPA) viết bằng JavaScript thuần (Vanilla JS ES6+), không phụ thuộc framework nặng, chia module rõ ràng theo chức năng.
- **Backend**: Node.js REST API Server gọn nhẹ, không dùng thư viện cồng kềnh, phân tách tầng rõ ràng giữa `routes` và `services`.
- **Cơ sở dữ liệu**: Microsoft SQL Server (`QL_SALON.sql`), hỗ trợ kết nối qua ODBC Driver 17/18, tích hợp bộ đệm In-Memory Snapshot fail-safe khi mất kết nối CSDL.
- **Trí tuệ nhân tạo (AI)**:
  - Client-side: Canvas AR uốn phom tóc nhiều lớp theo khuôn mặt người dùng.
  - Server-side: Tích hợp Google Gemini 2.5 Flash và Python MediaPipe phân tích cấu trúc xương mặt, tách nền và ghép kiểu tóc chuẩn góc nhìn chân dung.
- **Thanh toán**: Tự động sinh mã VietQR theo chuẩn Napas 24/7 và cổng thanh toán PayOS.

---

## 3. Phân Hệ Khách Hàng (Customer Portal)

1. **Trang Chủ (`#/`)**:
   - Khung Hero bento grid, đặt lịch hẹn nhanh 3 bước.
   - Bảng hiển thị 20 chi nhánh salon với trạng thái mở/đóng cửa tính theo giờ hiện tại.
   - Bảng giá dịch vụ niêm yết, đội ngũ thợ chính/thợ phụ và đánh giá từ khách hàng.
2. **Quy Trình Đặt Lịch Hẹn (`#/booking`)**:
   - Chọn chi nhánh salon, dịch vụ cắt/uốn/nhuộm/combo.
   - Chọn Stylist yêu thích hoặc để hệ thống tự phân bổ thợ trống.
   - Chọn ngày hẹn và khung giờ (tự động khóa các giờ trong quá khứ và các khung giờ thợ đã có khách).
   - Nhận mã lịch hẹn, mã QR vé phục vụ và xem lại chi tiết lịch hẹn.
3. **Cửa Hàng Mỹ Phẩm FEFO (`#/shop`, `#/cart`)**:
   - Danh mục sản phẩm tạo kiểu nam: Sáp wax, Pomade, Gôm xịt, Dầu dưỡng râu, Dụng cụ tạo kiểu.
   - Tự động áp dụng chiết khấu cận hạn theo nguyên tắc FEFO (First-Expired, First-Out).
   - Tự động ẩn toàn bộ sản phẩm có trạng thái "Ngừng kinh doanh" khỏi giao diện khách hàng.
   - Giỏ hàng trượt Drawer, kiểm tra tồn kho theo chi nhánh và thanh toán VietQR / COD.
4. **AI Hair Studio (`#/ai-studio`)**:
   - Chụp ảnh chân dung trực tiếp qua Camera hoặc tải ảnh từ máy tính.
   - Trải nghiệm 28 kiểu tóc thịnh hành (Buzz Cut, Layer Hàn Quốc, Pompadour, Mullet, Short Quiff, Two Block...).
   - Bảng màu nhuộm tôn da nam giới (Đen tự nhiên, Nâu lạnh, Xám khói titan, Vàng cát trầm...).
   - Thanh trượt so sánh Before/After trực quan.
5. **Tra Cứu & Quản Lý Cá Nhân (`#/profile`)**:
   - Tra cứu lịch sử đặt lịch và đơn hàng qua số điện thoại.
   - Hủy lịch hẹn trước giờ phục vụ, đánh giá chất lượng thợ và sản phẩm.

---

## 4. Phân Hệ Quản Trị Chuỗi (Admin Hub)

Truy cập tại route: **`http://localhost:3000/#/admin`**

1. **Tổng Quan Điều Hành (Overview Dashboard)**:
   - Thẻ KPI doanh thu chuỗi: Doanh thu dịch vụ, doanh số bán lẻ mỹ phẩm, tỷ lệ hoàn tất lịch hẹn, giá trị trung bình đơn (AOV).
   - Biểu đồ doanh thu theo 3 mốc thời gian: Hôm nay (theo khung giờ), 7 ngày qua, Tháng này (theo 4 tuần).
   - Bảng xếp hạng doanh thu và số lượt cắt của từng thợ trong kỳ.
2. **Quầy Thu Ngân Bán Lẻ (POS)**:
   - Tạo hóa đơn tại quầy nhanh chóng cho khách vào làm dịch vụ hoặc mua lẻ mỹ phẩm.
   - Tìm kiếm dịch vụ/sản phẩm không phân biệt dấu tiếng Việt.
   - Hộp danh sách dịch vụ & sản phẩm trong bill rộng rãi, hiển thị đầy đủ thời lượng và tên mục.
   - Áp dụng mã giảm giá voucher, tính toán tiền thối, quét mã VietQR nhận tiền ngay tại quầy.
3. **Quản Lý Kho Hàng & Lô Hàng FEFO (Inventory)**:
   - Theo dõi tồn kho theo từng chi nhánh cụ thể hoặc xem tổng tồn kho toàn bộ chi nhánh.
   - Cột "Trạng thái kinh doanh" đặt cạnh giá gốc, cho phép chuyển sang "Ngừng kinh doanh" để đồng bộ ẩn khỏi phía khách hàng.
   - Quản lý hạn sử dụng từng lô hàng (`LoHang`), cảnh báo cận hạn theo các mốc 30 - 90 - 180 ngày.
   - Lập và phê duyệt phiếu nhập kho nhiều bước (Chờ duyệt -> Đã nhập kho / Từ chối có lý do).
4. **Điều Phối Lịch Hẹn (Bookings)**:
   - Sơ đồ ghế làm việc tại salon, phân bổ thợ cho khách vãng lai và khách đặt trước.
   - Cập nhật tiến trình phục vụ: `Chờ vào ghế` ➔ `Đang phục vụ` ➔ `Hoàn tất`.
   - Giữ nút "Thu Tiền" ở bước cuối Hoàn tất đối với các đơn chưa thanh toán.
5. **Quản Lý Chi Nhánh & Dịch Vụ**:
   - Cập nhật giờ mở cửa / đóng cửa chi nhánh, đồng bộ tức thì sang phía khách hàng mà không bị ghi đè bởi cache cũ.
   - Quản lý bảng giá dịch vụ cắt tóc, combo uốn nhuộm và thông tin nhân sự.

---

## 5. Hệ Thống Phân Quyền RBAC 6 Vai Trò & Kiểm Toán

Hệ thống phân định quyền hạn chặt chẽ giữa 6 vai trò:

| Vai trò | Mã quyền | Quyền hạn trên hệ thống | Màu Badge hiển thị |
| :--- | :--- | :--- | :--- |
| **Chủ tịch / Quản trị cấp cao** | `SUPER_ADMIN` | Toàn quyền cấu hình hệ thống, xem toàn bộ chi nhánh, xem toàn bộ Audit Log. | 🔴 Đỏ Ruby (`#ef4444`) |
| **Quản lý chi nhánh** | `BRANCH_MANAGER` | Quản lý kho, thợ, dịch vụ, POS, duyệt phiếu nhập và chỉ xem Audit Log thuộc chi nhánh mình. | 🔵 Xanh Sapphire (`#2563eb`) |
| **Thu ngân** | `CASHIER` | Quầy POS, thu tiền hóa đơn, tiếp nhận lịch hẹn, lập phiếu nhập kho. Không có quyền xem Audit Log (HTTP 403). | 🟢 Xanh Ngọc (`#10b981`) |
| **Thợ cắt tóc** | `STYLIST` | Cập nhật ca làm việc, chuyển trạng thái lịch hẹn được phân công. Không có quyền xem Audit Log (HTTP 403). | 🟡 Cam Hổ Phách (`#f59e0b`) |
| **Khách hàng** | `CUSTOMER` | Đặt lịch hẹn, mua mỹ phẩm, xem hồ sơ cá nhân. Không có quyền xem Audit Log (HTTP 403). | 🟣 Tím Thạch Anh (`#8b5cf6`) |
| **Hệ thống tự động** | `SYSTEM` | Tác vụ chạy ngầm định kỳ: tự động hủy lịch hẹn/đơn hàng quá hạn sau 12h đêm. | ⚪ Xám Titan (`#64748b`) |

### Cơ chế Nhật Ký Kiểm Toán (Audit Log):
- **Phía Ghi log**: Dùng chung hàm `logAudit()` ghi nhận đầy đủ người thao tác, vai trò trích xuất từ JWT/session, mã hành động, đối tượng, chi nhánh và dữ liệu trước/sau (Before/After). Nếu kết nối CSDL gặp lỗi, hệ thống tự động ghi log dự phòng, không làm gián đoạn luồng nghiệp vụ chính.
- **Phía Đọc log**: `SUPER_ADMIN` xem được tất cả; `BRANCH_MANAGER` bị lọc theo `branchId` ngay tại Backend; các vai trò khác truy cập nhận mã lỗi `HTTP 403 Forbidden`. Chặn mọi hành vi sửa/xóa log bằng mã lỗi `HTTP 405 Method Not Allowed`.

---

## 6. Tài Khoản Thử Nghiệm Hệ Thống

Tất cả tài khoản mẫu đã được nạp sẵn trong hệ thống:

| Vai trò | Tên tài khoản | Tên đăng nhập | Mật khẩu | Chi nhánh |
| :--- | :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | Lê Minh Hoàng (Chủ Tịch) | `admin` hoặc `user_nv00` | `admin123` | Toàn hệ thống |
| **BRANCH_MANAGER** | Lê Hoàng Hải (Quản lý CN01) | `user_nv01` | `nv123` | CN01 (Quận 1) |
| **BRANCH_MANAGER** | Phạm Thu Thảo (Quản lý CN02) | `user_nv04` | `nv123` | CN02 (Tân Bình) |
| **CASHIER** | Nguyễn Thảo My (Thu ngân CN01) | `user_nv61` | `tn123` | CN01 (Quận 1) |
| **STYLIST** | Đỗ Đình Độ (Master Barber) | `user_nv02` | `nv123` | CN01 (Quận 1) |
| **CUSTOMER** | Ngô Văn Tuấn | `user_kh01` hoặc `0988000001` | `kh123` | Khách hàng |

---

## 7. Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 16 trở lên.
- **Cơ sở dữ liệu**: Microsoft SQL Server (hoặc SQL Server Express `.\SQLEXPRESS`).

### Khởi Chạy Nhanh (1-Click)
Nhấp đúp vào tệp:
```cmd
start.bat
```
*(Hỗ trợ menu chọn: [1] Web App, [2] Mobile App Flutter, [3] Cả hai)*
Hoặc mở terminal chạy lệnh:
```bash
node web/backend/server.js
```
Máy chủ sẽ khởi động tại địa chỉ:
👉 **`http://localhost:3000`**

### Khởi Tạo Cơ Sở Dữ Liệu (Tùy chọn)
Nếu muốn nạp lại cơ sở dữ liệu mẫu từ tệp SQL:
```bash
node web/backend/database/setup_db.js
```

---

## 8. Cấu Trúc Thư Mục Dự Án

```
OmniSalon/
├── web/
│   ├── backend/                     # Tầng máy chủ Backend Node.js
│   │   ├── server.js                # Điểm khởi chạy chính cổng 3000
│   │   ├── routes/                  # Định tuyến các phân hệ API
│   │   │   ├── auth/                # Xác thực đăng nhập & snapshot cache
│   │   │   ├── salon/               # Chi nhánh, thợ cắt, dịch vụ
│   │   │   ├── bookings/            # Đặt lịch hẹn & hủy lịch quá hạn
│   │   │   ├── store/               # Sản phẩm, đơn hàng, kho FEFO, quầy POS
│   │   │   ├── analytics/           # Doanh thu & nhật ký kiểm toán (Audit Log)
│   │   │   ├── marketing/           # Khuyến mãi, đánh giá, thông báo
│   │   │   ├── payment/             # Tích hợp PayOS & VietQR
│   │   │   └── ai/                  # Phân tích khuôn mặt & đổi kiểu tóc
│   │   ├── services/                # Nghiệp vụ: audit, helper, auto-cancel, OTP...
│   │   ├── middlewares/             # Xác thực token JWT & kiểm tra phân quyền RBAC
│   │   ├── database/                # Kết nối CSDL SQL Server (db.js, setup_db.js)
│   │   └── ai_engine/               # Module Computer Vision & Gemini Restyle
│   │
│   └── frontend/                    # Tầng giao diện Single Page Application
│       ├── index.html               # File HTML trung tâm liên kết toàn bộ tài nguyên
│       ├── css/                     # Bảng định kiểu phân tầng (base, common, customer, admin)
│       ├── js/                      # Mã nguồn JavaScript module hóa
│       │   ├── core/                # store, api, auth, router, theme, pricing, utils
│       │   ├── components/          # ProductCard, BranchCard, ui-common
│       │   ├── modules/customer/    # Các module chuyên trách giao diện khách hàng
│       │   └── modules/admin/       # Các module chuyên trách giao diện quản trị & POS
│       └── pages/                   # Bộ điều khiển view SPA (home, shop, booking, admin...)
│
├── QL_SALON.sql                     # Kịch bản tạo bảng & dữ liệu mẫu SQL Server
├── start.bat                        # Kịch bản khởi chạy thống nhất (Web & Mobile)
└── README.md                        # Tài liệu hướng dẫn sử dụng trung tâm (tệp này)
```

---

*Hệ thống được phát triển theo tiêu chuẩn mã nguồn tinh gọn, không sử dụng script tạm và tối ưu hóa hiệu năng tối đa.*
