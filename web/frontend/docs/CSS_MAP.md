# OMNISALON CSS ARCHITECTURE MAP (`CSS_MAP.md`)

> **QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ):**
> - **TUYỆT ĐỐI KHÔNG TÁI TẠO HOẶC GHI CODE VÀO FILE `styles.css`**. File này đã bị khai tử vĩnh viễn.
> - Mọi bổ sung, tinh chỉnh hoặc sửa lỗi giao diện bắt buộc phải sửa trực tiếp trong đúng file module theo bảng phân cấp trách nhiệm bên dưới.
> - Luôn ưu tiên dùng CSS Variables từ `variables.css` và `theme.css`.

---

## 1. Thứ Tự Nạp CSS Phân Tầng Trong `index.html`

Thứ tự nạp được thiết kế theo nguyên lý ghi đè tầng (Cascade):
1. **Base Layer** (Khởi tạo hệ thống, token, theme, typography)
2. **Common Layer** (Linh kiện dùng chung, modal, chuyển động, tiện ích)
3. **Customer Layer** (Bố cục & toàn bộ màn hình phía người dùng/khách hàng)
4. **Admin Layer** (Bố cục & toàn bộ màn hình phía quản trị viên salon)
5. **Responsive Layer** (Toàn bộ `@media` breakpoints ghi đè thích ứng cho Mobile/Tablet/Desktop nạp ở cuối cùng)

```html
<!-- BASE -->
<link rel="stylesheet" href="css/base/reset.css">
<link rel="stylesheet" href="css/base/variables.css">
<link rel="stylesheet" href="css/base/typography.css">
<link rel="stylesheet" href="css/base/theme.css">

<!-- COMMON -->
<link rel="stylesheet" href="css/common/common-components.css">
<link rel="stylesheet" href="css/common/modals.css">
<link rel="stylesheet" href="css/common/animations.css">
<link rel="stylesheet" href="css/common/promotions.css">
<link rel="stylesheet" href="css/common/utilities.css">

<!-- CUSTOMER -->
<link rel="stylesheet" href="css/customer/customer-layout.css">
<link rel="stylesheet" href="css/customer/customer-components.css">
<link rel="stylesheet" href="css/customer/pages/home.css">
<link rel="stylesheet" href="css/customer/pages/booking.css">
<link rel="stylesheet" href="css/customer/pages/account.css">
<link rel="stylesheet" href="css/customer/pages/lookbook.css">
<link rel="stylesheet" href="css/customer/pages/reviews.css">
<link rel="stylesheet" href="css/customer/pages/shop.css">
<link rel="stylesheet" href="css/customer/pages/product-detail.css">
<link rel="stylesheet" href="css/customer/pages/cart.css">

<!-- ADMIN -->
<link rel="stylesheet" href="css/admin/admin-layout.css">
<link rel="stylesheet" href="css/admin/admin-components.css">
<link rel="stylesheet" href="css/admin/pages/catalog.css">
<link rel="stylesheet" href="css/admin/pages/inventory.css">
<link rel="stylesheet" href="css/admin/pages/appointments.css">
<link rel="stylesheet" href="css/admin/pages/staff.css">
<link rel="stylesheet" href="css/admin/pages/reports.css">
<link rel="stylesheet" href="css/admin/pages/pos.css">
<link rel="stylesheet" href="css/admin/pages/customers.css">
<link rel="stylesheet" href="css/admin/pages/settings.css">

<!-- RESPONSIVE BREAKPOINTS (Nạp cuối cùng) -->
<link rel="stylesheet" href="css/common/responsive.css">
```

---

## 2. Bảng Phân Định Trách Nhiệm Từng Module

| Phân Vùng | Tên File Module | Trách Nhiệm Chi Tiết |
| :--- | :--- | :--- |
| **Base** | [`css/base/reset.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/base/reset.css) | Reset CSS chuẩn Box-sizing, font-smoothing, khử viền thô và ẩn scrollbar toàn cục. |
| | [`css/base/variables.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/base/variables.css) | Token kích thước, spacing, radius, transitions, z-index hệ thống. |
| | [`css/base/typography.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/base/typography.css) | Chuẩn hóa font chữ, heading `h1`–`h6`, nhãn thẻ, scale font theo viewport. |
| | [`css/base/theme.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/base/theme.css) | Biến màu `:root`, `[data-theme="light"]`, `[data-theme="dark"]`, nút gạt chuyển theme, icon sun/moon & khóa màu tương phản cao (High-Contrast Locks). |
| **Common** | [`css/common/common-components.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/common/common-components.css) | Nút bấm cơ sở (`.btn-*`), ô nhập liệu form, badge, toggle switches dùng chung. |
| | [`css/common/modals.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/common/modals.css) | Khung overlay, hộp thoại modal dialog, auth modal, backdrop mờ, nút đóng modal. |
| | [`css/common/animations.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/common/animations.css) | Toàn bộ `@keyframes` (pulse, laser, spin, shimmer), skeleton loader, taste-motion layer. |
| | [`css/common/promotions.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/common/promotions.css) | Voucher giảm giá, mã coupon, banner marketing khuyến mãi, badge ưu đãi. |
| | [`css/common/utilities.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/common/utilities.css) | Helper khoảng cách (`.gap-*`, `.m-*`, `.p-*`), Flexbox (`.d-flex`, `.justify-*`), căn chữ, trợ năng (`.sr-only`, `.is-hidden`). |
| | [`css/common/responsive.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/common/responsive.css) | **Tập trung 100% `@media` queries** điều chỉnh layout cho Mobile (<=768px, <=640px, <=480px), Tablet (<=1024px) và Màn hình rộng (>=1200px, >=1400px). |
| **Customer** | [`css/customer/customer-layout.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/customer/customer-layout.css) | Header web, mega menu, thanh chân trang (footer), thanh điều hướng đáy di động (`.mobile-bottom-nav`). |
| | [`css/customer/customer-components.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/customer/customer-components.css) | Thẻ salon, card thợ cắt tóc, danh thiếp dịch vụ phía giao diện khách hàng. |
| | [`css/customer/pages/home.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/customer/pages/home.css) | Trang chủ khách hàng: hero banner, carousel giới thiệu tiệm, cam kết dịch vụ. |
| | [`css/customer/pages/booking.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/customer/pages/booking.css) | Quy trình đặt lịch: chọn stylist, chọn dịch vụ, lịch datepicker, time-slots, xác nhận hẹn. |
| | [`css/customer/pages/account.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/customer/pages/account.css) | Trang cá nhân: hồ sơ khách hàng, lịch sử cắt tóc, tra cứu điểm thành viên. |
| | [`css/customer/pages/lookbook.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/customer/pages/lookbook.css) | Thử kiểu tóc thông minh AI restyle studio, thanh trượt so sánh trước/sau, bộ sưu tập mẫu tóc. |
| | [`css/customer/pages/reviews.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/customer/pages/reviews.css) | Đánh giá dịch vụ, feedback kèm ảnh của khách hàng, bảng điểm rating sao. |
| | [`css/customer/pages/shop.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/customer/pages/shop.css) | Trang cửa hàng bán lẻ (PLP), lưới sản phẩm co giãn, thanh lọc giá và danh mục. |
| | [`css/customer/pages/product-detail.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/customer/pages/product-detail.css) | Chi tiết sản phẩm (PDP): gallery ảnh zoom, chọn phân loại variant, chính sách & cam kết. |
| | [`css/customer/pages/cart.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/customer/pages/cart.css) | Ngăn kéo giỏ hàng Drawer trượt, menu mini-cart header dropdown, toàn bộ trang checkout. |
| **Admin** | [`css/admin/admin-layout.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/admin/admin-layout.css) | Bố cục trang quản trị: sidebar dọc, thanh điều hướng phụ subnav, topbar admin. |
| | [`css/admin/admin-components.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/admin/admin-components.css) | Thẻ KPI dashboard, bảng dữ liệu admin enterprise table, bộ lọc filter bar, thanh phân trang pagination. |
| | [`css/admin/pages/catalog.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/admin/pages/catalog.css) | Quản lý danh mục dịch vụ, danh sách sản phẩm quản trị, modal thêm/sửa sản phẩm. |
| | [`css/admin/pages/inventory.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/admin/pages/inventory.css) | Quản lý kho hàng, lập phiếu nhập/xuất kho, live preview phiếu kho, thẻ tình trạng tồn. |
| | [`css/admin/pages/appointments.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/admin/pages/appointments.css) | Bảng điều phối lịch hẹn admin, sơ đồ ghế/giường cắt tóc, kanban/timeline lịch đặt. |
| | [`css/admin/pages/staff.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/admin/pages/staff.css) | Quản lý nhân sự stylist, phân ca trực làm việc, hoa hồng và hiệu suất thợ. |
| | [`css/admin/pages/reports.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/admin/pages/reports.css) | Báo cáo doanh thu & tăng trưởng, biểu đồ trực quan, KPI tổng hợp. |
| | [`css/admin/pages/pos.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/admin/pages/pos.css) | Màn hình thu ngân POS tại quầy, giỏ hàng POS, hóa đơn in nhiệt, thanh toán QR/tiền mặt. |
| | [`css/admin/pages/customers.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/admin/pages/customers.css) | Quản trị CRM: danh sách khách hàng, thẻ hồ sơ cá nhân, ghi chú kỹ thuật (nhuộm/uốn/da đầu). |
| | [`css/admin/pages/settings.css`](file:///c:/Users/pcx/Desktop/OmniSalon/web/frontend/css/admin/pages/settings.css) | Cài đặt hệ thống salon, quản lý chi nhánh (danh sách chi nhánh, giờ mở cửa, bubble chọn chi nhánh). |

