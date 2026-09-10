# TÀI LIỆU KIẾN TRÚC KỸ THUẬT
## Ứng dụng hỗ trợ quản lý hoạt động & bán sản phẩm chăm sóc tóc chuỗi Salon

**Mã dự án:** CNTT-KLCN039
**Phiên bản:** 1.0
**Ngày lập:** 04/09/2026

---

## 1. MỤC TIÊU DỰ ÁN

Xây dựng ứng dụng cho salon tóc tích hợp:
- Đặt lịch và bán sản phẩm chăm sóc tóc
- Giúp khách hàng đặt dịch vụ thuận tiện
- Quản lý lịch hẹn, nhân viên, sản phẩm, kho và doanh thu

---

## 2. YÊU CẦU NGHIỆP VỤ

### 2.1. Nhóm ứng dụng hỗ trợ quản lý hoạt động salon (Web Admin)
Bao gồm: dịch vụ, bảng giá, nhân viên, ca làm việc và lịch hẹn; hỗ trợ quản lý khách hàng, sản phẩm chăm sóc tóc, số lượng tồn kho, đơn bán hàng, chương trình khuyến mãi và lập báo cáo về doanh thu, lịch hẹn, sản phẩm bán chạy.

### 2.2. Nhóm ứng dụng hỗ trợ khách hàng (Mobile/Web App)
Hỗ trợ khách hàng xem mẫu tóc, đặt giá và các mẫu tóc phù hợp; xem lịch chọn nhân viên, ca làm, lịch hẹn, sản phẩm, tồn kho; đặt lịch, thay đổi/hủy lịch hẹn, nhận thông báo nhắc lịch.

### 2.3. Yêu cầu triển khai
- **Nền tảng web:** quản trị viên xem các yêu cầu quản trị: quản lý dịch vụ, bảng giá dịch vụ riêng lẻ/combo, nhân viên, ca làm, lịch hẹn, khách hàng, sản phẩm, tồn kho, khuyến mãi và báo cáo.
- **Nền tảng mobile:** xem dịch vụ/mẫu tóc, giá cả, chọn nhân viên và khung giờ, đặt hoặc hủy lịch, nhắc lịch, mua sản phẩm, thanh toán, theo dõi và đánh giá, gọi ý sản phẩm/ưu đãi.
- **Backend/API:** kiểm tra lịch trống, đồng bộ lịch hẹn, xử lý đơn hàng, thanh toán và thông báo.

---

## 3. TÍNH NĂNG CẢI TIẾN ĐỀ XUẤT: TƯ VẤN KIỂU TÓC BẰNG AI + XEM THỬ 3D

Đây là điểm khác biệt cạnh tranh so với salon truyền thống: khách hàng tải/quét ảnh khuôn mặt, hệ thống phân tích và gợi ý kiểu tóc phù hợp, sau đó hiển thị **preview 3D/AR trên chính khuôn mặt khách hàng**.

### 3.1. Luồng trải nghiệm người dùng
1. Khách hàng mở mục "Tư vấn kiểu tóc" trên app.
2. Chụp ảnh/quét khuôn mặt (camera trực tiếp hoặc upload ảnh có sẵn).
3. Hệ thống phân tích: hình dáng khuôn mặt (oval, tròn, vuông, trái tim...), tỷ lệ trán/cằm, tông da.
4. Hệ thống trả về danh sách kiểu tóc phù hợp (kèm % độ phù hợp).
5. Khách hàng chọn 1 kiểu → hệ thống render **mô hình tóc 3D chồng lên khuôn mặt** theo thời gian thực (xoay được góc nhìn, đổi màu tóc thử).
6. Khách hàng có thể "Lưu lại" hoặc "Đặt lịch với kiểu tóc này" → tự động gắn kiểu tóc đã chọn vào đơn đặt lịch để stylist tham khảo.

### 3.2. Công nghệ đề xuất

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Face detection & landmark | **MediaPipe Face Mesh** (Google, chạy on-device) | Nhận diện 468 điểm mốc khuôn mặt real-time, làm nền để gắn mô hình tóc 3D đúng vị trí |
| Phân tích hình dáng khuôn mặt | Model phân loại (TensorFlow Lite/ONNX) huấn luyện riêng hoặc dùng API bên thứ 3 | Phân loại khuôn mặt → gợi ý kiểu tóc phù hợp |
| Render tóc 3D | **Three.js / React Three Fiber** (web) hoặc **ARKit (iOS) / ARCore (Android)** qua **Filament/SceneKit** (native mobile) | Chồng mô hình tóc 3D (.glb/.gltf) lên khuôn mặt theo landmark, xoay/đổi màu real-time |
| Thư viện mẫu tóc 3D | Tự thiết kế hoặc mua asset (Sketchfab, TurboSquid) dạng .glb, tối ưu low-poly cho mobile | Kho mẫu tóc để khách thử |
| Xử lý AI nặng (tuỳ chọn) | Backend riêng bằng **Python (FastAPI) + PyTorch** nếu cần AI phân tích sâu hơn on-device không đủ mạnh | Inference model AI phía server, trả kết quả qua API |

> **Lưu ý kỹ thuật:** Nên ưu tiên xử lý **on-device** (MediaPipe + Three.js/ARKit/ARCore) để: (1) tốc độ phản hồi tức thời, (2) không tốn chi phí server GPU, (3) **ảnh khuôn mặt khách hàng không cần gửi lên server** → giảm rủi ro bảo mật/quyền riêng tư đáng kể. Chỉ gửi lên backend khi cần lưu lịch sử tư vấn hoặc phân tích AI chuyên sâu.

### 3.3. Cân nhắc bảo mật & quyền riêng tư đặc thù cho tính năng này
- Xin quyền camera/ảnh rõ ràng, giải thích mục đích sử dụng (theo chuẩn GDPR-like dù làm tại VN vẫn nên áp dụng).
- Cho phép khách hàng **xoá ảnh/dữ liệu khuôn mặt** đã lưu bất cứ lúc nào.
- Nếu lưu ảnh trên server: mã hoá khi lưu trữ (encryption at rest), giới hạn thời gian lưu, không dùng cho mục đích khác ngoài tư vấn.
- Không lưu ảnh gốc nếu không cần thiết — ưu tiên chỉ lưu landmark/vector đặc trưng (không phải ảnh thật).

---

## 4. KIẾN TRÚC TỔNG THỂ HỆ THỐNG

```
┌─────────────────────┐        ┌─────────────────────┐
│   Mobile App         │        │   Web Admin          │
│   (React Native)     │        │   (Next.js)          │
│   + AI Try-on 3D      │        │                       │
└──────────┬───────────┘        └──────────┬───────────┘
           │                                │
           └───────────────┬────────────────┘
                            │
                  ┌─────────▼──────────┐
                  │   Backend API        │
                  │   (NestJS/Django)    │
                  │   REST/GraphQL       │
                  └─────────┬──────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐   ┌────────▼───────┐   ┌───────▼──────┐
│ PostgreSQL     │   │ Redis            │   │ AI Service     │
│ (Database)     │   │ (Cache/Queue)    │   │ (FastAPI, tuỳ  │
│                │   │                  │   │ chọn, nặng)    │
└────────────────┘   └──────────────────┘   └────────────────┘

Bên ngoài tích hợp: Cổng thanh toán (VNPay/Momo) | Push Notification (FCM) | Email (SendGrid) | Storage (S3/Cloudinary)
```

---

## 5. CHI TIẾT CÔNG NGHỆ TỪNG THÀNH PHẦN

### 5.1. Backend / API
| Hạng mục | Lựa chọn | Ghi chú |
|---|---|---|
| Framework | NestJS (Node.js/TypeScript) | Cấu trúc module rõ, mạnh về validate, guard, dễ audit |
| Database chính | PostgreSQL | Đảm bảo transaction chặt cho việc chống trùng lịch (double-booking) |
| Cache/Hàng đợi | Redis | Khoá slot khi đặt lịch đồng thời, queue gửi thông báo |
| Auth | JWT + Refresh Token, OAuth2 (Google/Facebook login) | Chuẩn, dễ tích hợp đa nền tảng |
| Thanh toán | VNPay / Momo / ZaloPay | Không lưu thông tin thẻ trực tiếp |
| Thông báo | Firebase Cloud Messaging + SendGrid | Push mobile + email xác nhận/nhắc lịch |
| Realtime (tuỳ chọn) | WebSocket (Socket.io) hoặc Supabase Realtime | Cập nhật trạng thái lịch hẹn tức thời cho admin |

### 5.2. Web Admin (quản trị salon)
- **React (Next.js) + TypeScript + TailwindCSS**
- UI component: shadcn/ui hoặc Ant Design cho dashboard, bảng biểu, biểu đồ báo cáo (Recharts/Chart.js)
- Chức năng chính: quản lý dịch vụ & bảng giá, nhân viên & ca làm, lịch hẹn (dạng lịch/calendar view), khách hàng, sản phẩm & tồn kho, khuyến mãi, báo cáo doanh thu/lịch hẹn/sản phẩm bán chạy

### 5.3. Mobile App (khách hàng)
- **React Native (Expo)** — 1 codebase cho iOS & Android
- Tích hợp module AI tư vấn kiểu tóc + render 3D (mục 3)
- Chức năng: xem dịch vụ/mẫu tóc, đặt/hủy lịch, chọn nhân viên & khung giờ, mua sản phẩm, thanh toán, đánh giá, nhận thông báo nhắc lịch, gợi ý ưu đãi cá nhân hoá

---

## 6. THIẾT KẾ DATABASE (SƠ BỘ CÁC BẢNG CHÍNH)

- `users` (khách hàng, đăng nhập, thông tin cá nhân)
- `employees` (nhân viên/stylist, chi nhánh, chuyên môn)
- `branches` (chi nhánh salon)
- `services` (dịch vụ, giá, thời lượng)
- `combos` (gói combo dịch vụ)
- `bookings` (lịch hẹn: khách, nhân viên, dịch vụ, thời gian, trạng thái)
- `products` (sản phẩm chăm sóc tóc)
- `inventory` (tồn kho theo chi nhánh)
- `orders` / `order_items` (đơn mua sản phẩm)
- `promotions` (khuyến mãi)
- `reviews` (đánh giá dịch vụ/nhân viên)
- `hairstyles` (thư viện kiểu tóc, model 3D, metadata hình dáng khuôn mặt phù hợp)
- `hair_consultations` (lịch sử tư vấn AI: kiểu tóc gợi ý, kiểu đã chọn — không lưu ảnh gốc)
- `notifications` (log thông báo)

---

## 7. BẢO MẬT HỆ THỐNG (BẮT BUỘC)

- HTTPS toàn hệ thống (Let's Encrypt hoặc qua Cloudflare)
- Role-based access control (RBAC): Admin / Quản lý chi nhánh / Nhân viên / Khách hàng
- Rate limiting + WAF (Cloudflare) chống spam đặt lịch ảo, brute-force đăng nhập
- Mã hoá dữ liệu nhạy cảm (mật khẩu bcrypt/argon2, không lưu thẻ tín dụng thô)
- Validate chặt phía server, không tin dữ liệu từ client — đặc biệt logic check trùng lịch, tồn kho, giá tiền
- Audit log: ghi lại thao tác sửa lịch/giá/kho, ai thực hiện, khi nào
- Backup database tự động hàng ngày
- Riêng tính năng AI tư vấn tóc: xử lý on-device khi có thể, xin quyền rõ ràng, cho phép xoá dữ liệu khuôn mặt, mã hoá nếu lưu trữ

---

## 8. ĐỀ XUẤT HẠ TẦNG TRIỂN KHAI

| Thành phần | Nền tảng đề xuất |
|---|---|
| Backend + Database | Railway / Render (nhỏ-vừa) hoặc AWS/DigitalOcean (khi cần scale) |
| Database managed (tuỳ chọn thay PostgreSQL tự host) | Supabase (Postgres + Auth + Storage + Realtime tích hợp sẵn) |
| Web Admin | Vercel |
| Lưu trữ ảnh/model 3D | Cloudinary hoặc AWS S3 |
| CDN & bảo mật tầng ngoài | Cloudflare |

---

## 9. LỘ TRÌNH TRIỂN KHAI ĐỀ XUẤT (ROADMAP)

1. **Giai đoạn 1 — Nền tảng cốt lõi:** Database schema, Backend API (auth, dịch vụ, lịch hẹn), Web Admin cơ bản
2. **Giai đoạn 2 — Mobile App:** Đặt lịch, thanh toán, thông báo, đánh giá
3. **Giai đoạn 3 — Tính năng AI tư vấn kiểu tóc:** Face landmark detection, thư viện model tóc 3D, render AR, gợi ý kiểu tóc theo khuôn mặt
4. **Giai đoạn 4 — Tối ưu & mở rộng:** Báo cáo nâng cao, chương trình khách hàng thân thiết, đa chi nhánh, đa ngôn ngữ

---

## 10. GHI CHÚ

Tài liệu này tổng hợp và mở rộng từ yêu cầu đề tài **CNTT-KLCN039**, bổ sung tính năng tư vấn kiểu tóc bằng AI kết hợp xem thử 3D nhằm nâng cao trải nghiệm khách hàng và tạo điểm khác biệt cạnh tranh cho sản phẩm.
