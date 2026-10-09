# OmniSalon — Hệ Thống Quản Lý & Đặt Lịch Salon Tóc Đa Nền Tảng

<p align="center">
  <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80" alt="OmniSalon Banner" width="100%" style="border-radius: 16px; max-height: 400px; object-fit: cover;" />
</p>

<p align="center">
  <strong>Giải pháp chuyển đổi số toàn diện cho chuỗi Salon & Barber hiện đại</strong><br>
  Đồng bộ thời gian thực 100% giữa <b>Web Portal (PC & Mobile)</b> • <b>Mobile App (Flutter)</b> • <b>REST API Engine</b> • <b>CSDL T-SQL RDBMS (QL_SALON.sql)</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-gold?style=for-the-badge" alt="Version 2.0" />
  <img src="https://img.shields.io/badge/Frontend-Vanilla_JS_ES6+_|_SPA-blue?style=for-the-badge" alt="Frontend" />
  <img src="https://img.shields.io/badge/Mobile-Flutter_3.0+_|_Dart-02569B?style=for-the-badge&logo=flutter" alt="Flutter" />
  <img src="https://img.shields.io/badge/Backend-Node.js_|_PowerShell_Engine-43853D?style=for-the-badge" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-Microsoft_SQL_Server-CC292B?style=for-the-badge&logo=microsoftsqlserver" alt="Database" />
  <img src="https://img.shields.io/badge/Theme-Nordic_Luxury_|_WCAG_AAA-0f172a?style=for-the-badge" alt="WCAG AAA" />
</p>

---

## 📑 Mục Lục
1. [Giới Thiệu Tổng Quan](#-giới-thiệu-tổng-quan)
2. [Kiến Trúc Hệ Thống & Công Nghệ](#-kiến-trúc-hệ-thống--công-nghệ)
3. [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
4. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
5. [Hướng Dẫn Cài Đặt & Khởi Chạy Chi Tiết](#-hướng-dẫn-cài-đặt--khởi-chạy-chi-tiết)
   - [Cách 1: Khởi chạy 1-Click nhanh nhất (`start_server.bat`)](#cách-1-khởi-chạy-1-click-nhanh-nhất-start_serverbat---khuyến-nghị)
   - [Cách 2: Khởi chạy thủ công qua Node.js (`server.js`)](#cách-2-khởi-chạy-thủ-công-qua-nodejs-serverjs)
   - [Cách 3: Khởi chạy Mobile App Flutter (`mobile/`)](#cách-3-khởi-chạy-ứng-dụng-mobile-flutter-mobile)
6. [Tài Liệu REST API](#-tài-liệu-rest-api)
7. [Tài Khoản Thử Nghiệm & Dữ Liệu Demo](#-tài-khoản-thử-nghiệm--dữ-liệu-demo)
8. [Bộ Kiểm Thử Tự Động & Bảo Mật](#-bộ-kiểm-thử-tự-động--bảo-mật-qa--pentest)
9. [Nguyên Tắc Thiết Kế & Quy Chuẩn Mã Nguồn](#-nguyên-tắc-thiết-kế--quy-chuẩn-mã-nguồn)

---

## 🌟 Giới Thiệu Tổng Quan

**OmniSalon** là hệ sinh thái phần mềm quản trị và vận hành chuỗi salon chăm sóc sắc đẹp, cắt tạo kiểu tóc và kinh doanh mỹ phẩm chuyên nghiệp theo mô hình **Omni-Channel (Đa kênh tích hợp)**.

Hệ thống giải quyết triệt để bài toán đồng bộ dữ liệu giữa trải nghiệm của khách hàng (Web, Mobile App) và nhân sự vận hành tại salon (Lễ tân, Thợ tạo mẫu, Quản lý kho, Chủ chuỗi salon). Mọi thao tác đặt lịch, cập nhật trạng thái thợ, dời giờ hẹn hay đặt mua mỹ phẩm đều được cập nhật thời gian thực vào nguồn dữ liệu quan hệ trung tâm `QL_SALON.sql`.

---

## 🏗️ Kiến Trúc Hệ Thống & Công Nghệ

```
                               ┌──────────────────────────────────────────────┐
                               │               KHÁCH HÀNG & QUẢN TRỊ          │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       │                                                             │
                       ▼                                                             ▼
         ┌───────────────────────────┐                                 ┌───────────────────────────┐
         │   WEB PORTAL (PC & MOBILE)│                                 │    MOBILE APP (FLUTTER)   │
         │ - SPA + Clean HTML5/ES6+  │                                 │ - Material Design 3       │
         │ - Nordic Luxury Theme     │                                 │ - Offline/Online sync     │
         │ - Booking Wizard Accordion│                                 │ - Android & iOS Native    │
         │ - AI Hairstyle Restyle    │                                 │ - Secret Flash Sale badge │
         └─────────────┬─────────────┘                                 └─────────────┬─────────────┘
                       │                                                             │
                       │             HTTP / JSON REST API (Port 8080)                │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │            REST API BACKEND ENGINE           │
                               │                                              │
                               │              [Node.js Engine]                │
                               │                (server.js)                   │
                               │                                              │
                               │ - CORS Enabled, Body JSON Parser             │
                               │ - Static File Server (HTML, CSS, JS, Media)  │
                               │ - Realtime SQL Query & Append Engine         │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │         CƠ SỞ DỮ LIỆU TRUNG TÂM              │
                               │               QL_SALON.sql                   │
                               │  - ChiNhanh, NhanVien, KhachHang, DichVu... │
                               │  - Ràng buộc FK, Check, Triggers, Views      │
                               │  - Lưu trữ đơn hàng & lịch hẹn trực tiếp     │
                               └──────────────────────────────────────────────┘
```

### 1. Web Portal (`/web`)
- **Ngôn ngữ & Thư viện**: Vanilla JavaScript (ES6+), HTML5 Semantic, CSS3 Hiện đại. Không phụ thuộc thư viện cồng kềnh (zero runtime bloat), tối ưu tốc độ tải trang dưới 250ms.
- **Hệ thống Giao diện (Design System)**: Ngôn ngữ thiết kế *Nordic Minimalist Luxury* với 2 chế độ Sáng (Light) & Tối (Dark) tuân thủ tiêu chuẩn tương phản cao **WCAG AAA**.
- **Kiến trúc SPA (Single Page Application)**: Router định tuyến phía client kết hợp các trang tĩnh độc lập (`/admin`, `/booking`, `/services`, `/shop`, `/stylists`) hỗ trợ SEO tối ưu.

### 2. Mobile Application (`/mobile`)
- **Công nghệ**: Google Flutter (Dart SDK `>=3.0.0 <4.0.0`), kiến trúc Component-driven.
- **UI/UX**: Material Design 3, màu sắc thương hiệu Gold Champagne (`#B48312`) và Than tuyền Obsidian (`#0F172A`).
- **Khả năng tương thích**: Đóng gói mượt mà trên cả Android Emulator, Android thật và iOS. Hỗ trợ cơ chế dữ liệu ngoại tuyến (Offline Seed Data) khi mất kết nối mạng.

### 3. Backend REST API & SQL Engine
- **Node.js Server (`server.js`)**: Máy chủ backend trung tâm kết nối trực tiếp với CSDL `QL_SALON.sql`.
- **Tính năng Server**: Tích hợp đồng thời Static File Serving, REST API Endpoint, CORS Header và cơ chế đọc/ghi trực tiếp các thao tác DDL/DML theo thời gian thực vào file CSDL `QL_SALON.sql`.

### 4. Cơ sở dữ liệu RDBMS (`QL_SALON.sql`)
- CSDL T-SQL chuẩn hóa theo mô hình quan hệ 3NF (Bảng chi nhánh, nhân viên, dịch vụ, thợ tạo mẫu, danh mục, sản phẩm, lô hàng, lịch hẹn, đơn hàng, hóa đơn...).
- Tích hợp Trigger kiểm tra lịch trùng (chống double-booking), trigger tự động tính điểm tích lũy khách hàng, Views báo cáo doanh thu và Stored Procedures.

---

## 💎 Tính Năng Nổi Bật

| Phân hệ | Tính năng chi tiết | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| 💈 **Đặt Lịch (Booking)** | **Accordion Wizard 4 bước** | Khách chọn: Chi nhánh ➔ Dịch vụ ➔ Thợ tạo mẫu (Stylist) ➔ Khung giờ. Thiết kế dạng accordion đóng/mở trực quan, loại bỏ hoàn toàn lỗi pop-up modal chồng chéo. |
| 🛡️ **Bảo Mật Lịch Hẹn** | **Chống Double-Booking** | Khóa cứng khung giờ của thợ nếu đã có lịch hẹn trùng thời điểm tại cùng chi nhánh. |
| 🧴 **Mỹ Phẩm & Dược Liệu** | **Shop 9 Danh Mục (130 sản phẩm)** | Phân phối chính hãng: Sáp Clay/Wax, Pomade, Xịt Pre-styling, Gôm xịt, Dầu gội xả, Bột phồng, Uốn ép side, Chăm sóc râu, Dụng cụ chuyên nghiệp. |
| ⚡ **Chính Sách Cận Date** | **Thuật toán Flash Sale mật** | Sản phẩm cận date theo lô hàng (<180 ngày: giảm 20%, <90 ngày: giảm 40%, <30 ngày: giảm 70%) tự động chuyển thành nhãn **Flash Sale** mà không để lộ ngày hết hạn cho khách. Sản phẩm hết hạn tự động ẩn. |
| 💇 **AI Hairstyle Studio** | **Thử kiểu tóc thông minh** | Tải ảnh chân dung, nhận diện phom khuôn mặt (Tròn, Vuông, Dài, Oval) và gợi ý kiểu tóc chuẩn tỷ lệ (Side Part, Undercut, Mullet, Layer...). Nút đặt lịch 1-click ngay sau khi thử kiểu. |
| 📊 **Admin Portal** | **Quản trị toàn diện** | Dashboard báo cáo doanh thu, điều phối thợ, quản lý danh sách lịch hẹn (xác nhận, dời ngày, hoàn thành), POS bán hàng tại quầy và kiểm soát tồn kho. |
| 🌓 **Giao Diện Đỉnh Cao** | **Theme Light/Dark WCAG AAA** | Chế độ sáng sang trọng (nền sáng dịu mắt `#F1F3F6`, không dùng đen tuyền), chế độ tối huyền bí (`#0B0D13`). Khử hoàn toàn chớp trắng khi tải trang (Zero FOUC). |
| 🇻🇳 **Ngôn Ngữ Thuần Việt** | **100% Chuẩn hóa Tiếng Việt** | Chuẩn hóa toàn bộ danh xưng (*Nghệ Nhân Tạo Mẫu, Thợ Tạo Mẫu Cao Cấp, Giỏ Hàng, Đơn Hàng...*), không sử dụng từ ngữ lai tạp. |

---

## 📁 Cấu Trúc Thư Mục Dự Án

```plaintext
OmniSalon/
├── .agents/                 # Cấu hình kỹ năng AI Agents (Caveman, Ponytail...)
├── .antigravity/            # Quy chuẩn kiến trúc & quy tắc kiểm thử
├── docs/                    # Tài liệu kỹ thuật, báo cáo bảo mật & phân tích kiến trúc
│   ├── analysis.md          # Phân rã nghiệp vụ và thiết kế hệ thống
│   ├── audit_report.md      # Báo cáo kiểm định chất lượng và benchmark UI
│   ├── file_plan.json       # Bản đồ liên kết tệp tin và dependency graph
│   ├── security_audit.md    # Báo cáo kiểm thử an toàn thông tin OWASP
│   └── test_failures.json   # Nhật ký kiểm thử tự động (Zero-Bug verified)
├── mobile/                  # Ứng dụng di động Flutter (Android & iOS)
│   ├── lib/
│   │   ├── main.dart        # Entrypoint ứng dụng Flutter
│   │   ├── models/          # Data Models (Branch, Stylist, Product, Booking...)
│   │   ├── screens/         # Màn hình (Home, Booking, Shop, Cart, My Bookings)
│   │   └── services/        # Tầng kết nối REST API (api_service.dart)
│   └── pubspec.yaml         # Khai báo thư viện & cấu hình Flutter
├── tests/                   # Bộ kiểm thử tự động (QA suites, Pentest, Theme runner)
│   ├── run_qa_tests.ps1     # Runner kiểm thử tự động qua Headless Edge/Chromium
│   ├── run_theme_tests.ps1  # Runner kiểm thử độ tương phản Theme Sáng/Tối
│   ├── run_pentest.ps1      # Runner kiểm thử bảo mật & an toàn thông tin
│   └── *.html / *.ps1       # Các kịch bản kiểm thử độc lập cho từng module
├── web/                     # Bộ mã nguồn Web (Front End & Back End)
│   ├── backend/             # Toàn bộ Back End (REST API & SQL Server)
│   │   ├── server.js        # REST API Server Node.js (14 endpoint, kết nối SSMS 20)
│   │   ├── setup_db.js      # Script tự động tạo & nạp CSDL QL_SALONTOC
│   │   ├── QL_SALON.sql     # File CSDL SQL Server (Schema, Triggers, Dữ liệu mẫu)
│   │   └── email_config.json# Cấu hình dịch vụ gửi email xác nhận
│   └── frontend/            # Toàn bộ Front End (Web Desktop & Web Mobile Responsive)
│       ├── index.html       # File giao diện trung tâm hợp nhất duy nhất (SPA Router)
│       ├── styles.css       # Bảng mã CSS hợp nhất duy nhất toàn hệ thống (All-In-One Master)
│       ├── js/              # Mã nguồn JavaScript mô-đun hóa
│       │   ├── core/        # api.js, auth.js, pricing.js, router.js, store.js, theme.js, utils.js
│       │   ├── components/  # ui-common.js (render cards, modals, toast...)
│       │   ├── modules/     # Phân hệ khách hàng & quản trị (customer-web.js, admin-web.js)
│       │   ├── web/         # ui-web.js
│       │   └── widgets/     # widgets-bundle.js (bundle hợp nhất tất cả widget)
│       ├── pages/           # Bộ điều khiển view SPA (home, services, booking, shop, admin...)
│       ├── app.html         # Tệp chuyển hướng nhanh về index.html
│       └── manifest.json    # Cấu hình PWA (Progressive Web App)
├── mobile/                  # Native Mobile App (Dự án Flutter phát triển riêng)
├── Men_Grooming_Products/   # Kho tài nguyên ảnh sản phẩm & dịch vụ tóc
├── AGENTS.md                # Quy định vai trò các Agent trong hệ thống
├── start_server.bat         # File thực thi 1-Click khởi chạy tự động toàn hệ thống
└── README.md                # Tài liệu hướng dẫn sử dụng chi tiết (tệp này)
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Chi Tiết

### Yêu Cầu Môi Trường Tối Thiểu
- **Hệ điều hành**: Windows 10/11 (khuyến nghị), macOS hoặc Linux.
- **Node.js**: Phiên bản 16 trở lên (tải tại [nodejs.org](https://nodejs.org) hoặc cài nhanh bằng `winget install OpenJS.NodeJS.LTS`).
- **Trình duyệt**: Google Chrome, Microsoft Edge, Brave hoặc Firefox phiên bản mới nhất.

---

### Cách 1: Khởi chạy 1-Click nhanh nhất (`start_server.bat`) — *Khuyến nghị*
1. Nhấp đúp chuột trái vào tệp: **`start_server.bat`**.
2. Kịch bản sẽ tự động chạy **`node server.js`** kết nối trực tiếp với `QL_SALON.sql`.
3. Mở trình duyệt web và truy cập địa chỉ:
   👉 **`http://localhost:8080`**

---

### Cách 2: Khởi chạy thủ công qua Node.js (`server.js`)
1. Mở Terminal / PowerShell tại thư mục `OmniSalon`.
2. Chạy lệnh:
   ```bash
   node server.js
   ```
3. *Tùy chọn*: Thay đổi cổng lắng nghe thông qua biến môi trường (mặc định là `8080`):
   ```bash
   # Trên Command Prompt
   set PORT=3000 && node server.js

   # Trên PowerShell
   $env:PORT=3000; node server.js
   ```
4. Truy cập web tại: **`http://localhost:8080`** (hoặc cổng bạn vừa chỉ định).

---

### Cách 3: Khởi chạy Ứng dụng Mobile Flutter (`/mobile`)

Ứng dụng di động được kết nối sẵn với Backend Server. Trước khi khởi chạy ứng dụng di động, hãy đảm bảo bạn **đã khởi động `node server.js`** (cổng `8080`).

1. Mở Terminal và điều hướng vào thư mục mobile:
   ```bash
   cd mobile
   ```
2. Tải các gói thư viện phụ thuộc:
   ```bash
   flutter pub get
   ```
3. Kiểm tra thiết bị kết nối (Android Emulator, máy thật hoặc Chrome/Windows):
   ```bash
   flutter devices
   ```
4. Khởi chạy ứng dụng:
   ```bash
   flutter run
   ```

> 💡 **Lưu ý cấu hình IP cho thiết bị thử nghiệm (trong `mobile/lib/services/api_service.dart`)**:
> - **Khi chạy trên Android Emulator**: Sử dụng địa chỉ `http://10.0.2.2:8080/api` (Android Emulator coi `10.0.2.2` là localhost của máy tính host).
> - **Khi chạy trên điện thoại thật kết nối cùng WiFi**: Đổi sang địa chỉ IP mạng nội bộ của máy tính bạn (ví dụ: `http://192.168.1.50:8080/api`).
> - **Khi chạy trên Windows Desktop / Web Chrome**: Giữ nguyên `http://127.0.0.1:8080/api`.

---

### Cách 5: Thiết lập CSDL trên Microsoft SQL Server (SSMS) — *Tùy chọn*
Hệ thống OmniSalon đã có sẵn bộ parser SQL trực tiếp nên **không bắt buộc** phải cài SQL Server để ứng dụng chạy. Tuy nhiên, nếu bạn muốn import vào hệ quản trị Microsoft SQL Server chuyên nghiệp để quản lý và chạy query:

1. Mở **SQL Server Management Studio (SSMS)** và kết nối tới SQL Server Instance của bạn (`localhost` hoặc `.\SQLEXPRESS`).
2. Mở tệp `QL_SALON.sql` (bằng menu `File > Open > File...` hoặc kéo thả vào SSMS).
3. Bấm **Execute (F5)** để tạo Database `QL_SALONTOC`.
4. Kịch bản sẽ tự động:
   - Xóa database cũ nếu đã tồn tại và khởi tạo mới `QL_SALONTOC`.
   - Tạo toàn bộ 15 bảng quan hệ với đầy đủ khóa chính (PK), khóa ngoại (FK), kiểm tra ràng buộc (CHECK).
   - Thiết lập các Triggers: Chống đặt lịch hẹn trùng giờ, cập nhật điểm tích lũy thành viên.
   - Tạo các Views: Tổng hợp doanh thu chi nhánh, báo cáo công nợ thợ.
   - Nạp dữ liệu mẫu hoàn chỉnh: Chi nhánh, nhân viên, dịch vụ, danh mục, 130 sản phẩm, lô hàng và các đơn hàng mẫu.

---

## 📡 Tài Liệu REST API

Tất cả các API đều phản hồi định dạng `application/json; charset=utf-8` và hỗ trợ đầy đủ CORS cho cả Web và Mobile:

### 1. Chi Nhánh & Dịch Vụ
- **`GET /api/branches`**: Lấy danh sách toàn bộ chi nhánh salon.
- **`GET /api/services`**: Lấy danh sách dịch vụ salon (Cắt, gội, uốn sóng, nhuộm...).
- **`GET /api/stylists`**: Lấy danh sách đội ngũ thợ tạo mẫu tóc và đánh giá sao.

### 2. Danh Mục & Sản Phẩm (Kèm Thuật Toán Flash Sale)
- **`GET /api/categories`**: Lấy 9 danh mục sản phẩm tạo kiểu nam.
- **`GET /api/products`**: Lấy danh sách 130 sản phẩm mỹ phẩm chính hãng.
  - Tự động quét hạn sử dụng trong bảng `LoHang`.
  - Sản phẩm cận hạn được gán tự động `isFlashSale: true`, tính toán mức giảm giá và cập nhật giá bán thực tế `finalPrice`.

### 3. Đặt Lịch Hẹn (Bookings)
- **`GET /api/bookings`**: Lấy danh sách toàn bộ lịch hẹn trong hệ thống.
- **`POST /api/bookings`**: Tạo lịch hẹn mới. Dữ liệu sẽ được ghi trực tiếp vào `QL_SALON.sql`.
  - **Body mẫu**:
    ```json
    {
      "bookingCode": "LH9999",
      "customerName": "Nguyễn Văn An",
      "customerPhone": "0912345678",
      "branchId": "CN01",
      "branchName": "Omni Salon Chi Nhánh 1 - Quận 1",
      "serviceId": "DV01",
      "serviceName": "Cắt tóc nam thời trang",
      "stylistId": "NV02",
      "stylistName": "Lê Thị Hương",
      "date": "2026-10-15",
      "timeSlot": "14:30",
      "notes": "Tư vấn phom tóc Side Part"
    }
    ```
- **`PUT /api/bookings/:id`**: Cập nhật trạng thái lịch hẹn (`Đã xác nhận`, `Hoàn thành`, `Đã hủy`) hoặc dời ngày giờ hẹn.

### 4. Đơn Hàng Mỹ Phẩm (Orders)
- **`GET /api/orders`**: Xem danh sách đơn hàng đã đặt.
- **`POST /api/orders`**: Đặt đơn hàng mới từ giỏ hàng. Dữ liệu sẽ được ghi vào bảng `DonHang` trong `QL_SALON.sql`.
  - **Body mẫu**:
    ```json
    {
      "id": "DH2026100801",
      "customerId": "KH03",
      "branchId": "CN01",
      "totalAmount": 820000,
      "shippingAddress": "72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM",
      "receiveMethod": "Giao hàng tận nơi",
      "notes": "Giao trong giờ hành chính"
    }
    ```

---

## 🔑 Tài Khoản Thử Nghiệm & Dữ Liệu Demo

Hệ thống được nạp sẵn dữ liệu kiểm thử thực tế giúp bạn trải nghiệm ngay mà không cần khởi tạo từ đầu:

### 1. Tài Khoản Quản Trị Viên (Salon Manager)
Truy cập vào route `/admin` (hoặc mở menu Admin trên góc phải Web Portal):
- **Tài khoản**: `admin` hoặc `0988000001`
- **Mật khẩu**: `admin123` (hoặc đăng nhập trực tiếp qua nút Demo Admin trên giao diện)
- **Quyền hạn**: Xem toàn bộ lịch hẹn chuỗi chi nhánh, đổi trạng thái phục vụ, xem doanh thu và thống kê.

### 2. Dữ Liệu Mẫu Sẵn Có
- **Chi nhánh**:
  - `CN01`: Omni Salon Chi Nhánh 1 - Quận 1 (120 Lê Lợi, Bến Thành, Q.1, TP.HCM)
  - `CN02`: Omni Salon Chi Nhánh 2 - Tân Bình (45 Cộng Hòa, P.4, Tân Bình, TP.HCM)
  - `CN03`: Omni Salon Chi Nhánh 3 - Bình Thạnh (88 Phan Xích Long, Bình Thạnh, TP.HCM)
- **Đội ngũ Thợ Tạo Mẫu (Master Stylists)**:
  - `NV02`: Lê Thị Hương (*Nghệ Nhân Tạo Mẫu* — CN01)
  - `NV04`: Phạm Thu Thảo (*Thợ Tạo Mẫu Chính* — CN02)
  - `NV05`: Võ Quốc Bảo (*Thợ Tạo Mẫu Cao Cấp* — CN03)

---

## 🧪 Bộ Kiểm Thử Tự Động & Bảo Mật (QA & Pentest)

Thư mục `tests/` chứa toàn bộ kịch bản kiểm thử tự động đạt chuẩn **Zero-Bug** bằng trình duyệt Headless Chromium / Edge:

### 1. Chạy Kiểm Thử Chức Năng & Benchmark (QA Test Suite)
Kiểm tra độ trễ hiển thị, tính đối xứng layout, khả năng phản hồi của các nút bấm và quy trình đặt lịch:
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\tests\run_qa_tests.ps1
```

### 2. Chạy Kiểm Thử Theme & Độ Tương Phản (WCAG AAA)
Xác thực hệ thống màu Sáng/Tối không bị chớp giật (FOUC), tỷ lệ tương phản chữ và nền đạt chuẩn quốc tế:
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\tests\run_theme_tests.ps1
```

### 3. Chạy Kiểm Thử Vòng Lặp Đệ Quy Tự Động (Autonomous Recursive QA)
Chạy toàn bộ 26 kiểm tra tự động chuyên sâu và xuất báo cáo vào `docs/test_failures.json`:
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\tests\run_autonomous_recursive_qa.ps1
```

### 4. Chạy Kiểm Thử Bảo Mật & Pentest (OWASP Top 10)
Kiểm tra các lỗ hổng: Tránh leo thang đặc quyền (Privilege Escalation), ngăn chặn truy cập trái phép Admin (IDOR), chặn tải lên tệp độc hại trong AI Studio và kiểm soát định dạng dữ liệu đầu vào:
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\tests\run_pentest.ps1
```

---

## 📐 Nguyên Tắc Thiết Kế & Quy Chuẩn Mã Nguồn

Dự án được xây dựng và tối ưu nghiêm ngặt theo các triết lý công nghệ hiện đại:

1. **Nguyên tắc YAGNI & Tối Giản (Lazy Senior Developer - Ponytail Mode)**:
   - Ưu tiên sử dụng chuẩn Web Native và thư viện chuẩn (Standard Library) thay vì cài đặt hàng chục package bên ngoài không cần thiết.
   - Mã nguồn được cấu trúc mạch lạc, dễ bảo trì, dễ mở rộng và không có code thừa (dead code).
2. **Trải Nghiệm Thị Giác Đỉnh Cao (Rich Aesthetics)**:
   - Áp dụng các tông màu sang trọng: Than Obsidian, Vàng Champagne, Kính mờ Glassmorphism.
   - Hiệu ứng chuyển động vi mô (Micro-animations) mượt mà, tạo cảm giác cao cấp và tin cậy cho thương hiệu Salon 5 sao.
3. **An Toàn Dữ Liệu Thời Gian Thực**:
   - Dữ liệu không lưu tạm bợ (No mock data); mọi lệnh đặt lịch và mua sắm đều được ghi nhận trực tiếp vào cơ sở dữ liệu `QL_SALON.sql`.
4. **Tối Ưu Trải Nghiệm Khách Hàng (Zero Pop-up Chaos)**:
   - Thay thế các cửa sổ pop-up modal phiền toái bằng cấu trúc Accordion và Drawer trượt tự nhiên, giúp người dùng tập trung hoàn thành thao tác đặt lịch nhanh nhất.

---

<p align="center">
  <strong>© 2026 OmniSalon Team. Phát triển với đam mê và tiêu chuẩn kỹ thuật cao nhất.</strong><br>
  <i>Chăm sóc vẻ đẹp của bạn — Đẳng cấp, Tiện lợi và Công nghệ.</i>
</p>
