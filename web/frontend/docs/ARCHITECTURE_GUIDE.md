# BẢN ĐỒ ĐỊNH VỊ CODE & HƯỚNG DẪN DÀNH CHO AI AGENT (OMNI SALON)

> **QUY TẮC BẮT BUỘC KHI CODE:**
> 1. Tuyệt đối KHÔNG viết thêm code vào `styles.css` (file đã xóa/0 bytes).
> 2. Không nhồi nhét logic nghiệp vụ vào `admin-web.js`, `customer-web.js` hoặc `ui-web.js` (đây là các shell điều phối và bridge tương thích ngược).
> 3. Muốn thêm/sửa bất kỳ tính năng nào, tra cứu bảng bên dưới và CHỈ mở đúng file tương ứng.

---

## 1. BẢNG TRA CỨU NHANH TÍNH NĂNG (FEATURE MATRIX)

| Tính năng / Nghiệp vụ | File CSS giao diện | File JS xử lý logic |
| :--- | :--- | :--- |
| **Đổi màu theme (Sáng/Tối), Token màu, Font chữ** | `css/base/theme.css`<br>`css/base/typography.css` | `js/core/store.js`<br>`js/components/ui-common.js` |
| **Reset trình duyệt, Thanh cuộn mượt (Scrollbars)** | `css/base/reset.css` | - |
| **Nút bấm, Input, Modal, Toast thông báo chung** | `css/common/common-components.css`<br>`css/common/modals.css` | `js/components/ui-common.js` |
| **Hiệu ứng chuyển động, Shimmer loading, Spinner** | `css/common/animations.css` | `js/core/utils.js` |
| **Voucher, Mã giảm giá, Popup ưu đãi** | `css/common/promotions.css` | `js/core/pricing.js`<br>`js/modules/customer/order/order-payment.js` |
| **Responsive, Breakpoints Mobile/Tablet** | `css/common/responsive.css` | `js/modules/customer/layout/customer-navigation.js` |
| **Trang chủ khách hàng (Hero, Bento, Ticker, Banner)** | `css/customer/pages/home.css` | `pages/customer/home-page.js`<br>`js/modules/customer/layout/customer-main-content.js` |
| **Header khách hàng, Menu mega, Tìm kiếm live** | `css/customer/customer-layout.css` | `js/modules/customer/layout/customer-header.js`<br>`js/modules/customer/layout/customer-live-search.js` |
| **Quy trình đặt lịch hẹn (Booking flow, Giờ, Thợ)** | `css/customer/pages/booking.css` | `js/modules/customer/booking/customer-booking-search.js`<br>`js/modules/customer/booking/booking-payment.js`<br>`pages/customer/booking-page.js` |
| **Hủy lịch hẹn, Đánh giá lịch hẹn, QR code vé** | `css/customer/pages/booking.css`<br>`css/customer/pages/reviews.css` | `js/modules/customer/booking/booking-cancel.js`<br>`js/modules/customer/booking/booking-review.js`<br>`js/modules/customer/booking/customer-ticket-qr.js` |
| **Cửa hàng (Shop), Lưới sản phẩm, Bộ lọc giá/loại** | `css/customer/pages/shop.css` | `pages/customer/shop-page.js`<br>`js/components/ProductCard.js` |
| **Chi tiết sản phẩm (PDP), Gallery ảnh, Biến thể** | `css/customer/pages/product-detail.css` | `pages/customer/shop-page.js`<br>`js/modules/customer/layout/customer-cart-popup.js` |
| **Giỏ hàng (Drawer & Mini-cart), Checkout thanh toán** | `css/customer/pages/cart.css` | `pages/customer/cart-page.js`<br>`js/modules/customer/order/order-payment.js`<br>`js/modules/customer/layout/customer-cart-popup.js` |
| **Tra cứu đơn hàng, Hủy đơn, Đánh giá sản phẩm** | `css/customer/pages/account.css`<br>`css/customer/pages/reviews.css` | `js/modules/customer/order/customer-order-lookup.js`<br>`js/modules/customer/order/order-cancel.js`<br>`js/modules/customer/order/order-review.js` |
| **Hồ sơ thành viên, Điểm tích lũy VIP, Lịch sử cắt** | `css/customer/pages/account.css` | `js/modules/customer/portal/customer-portal.js`<br>`pages/customer/profile-page.js` |
| **Thử kiểu tóc AI (AI Restyle), So sánh Before/After** | `css/customer/pages/lookbook.css` | `js/core/ai-hair-engine.js`<br>`js/modules/customer/ai/customer-ai-studio.js`<br>`pages/customer/ai-studio-page.js` |
| **Sidebar Admin, Khung giao diện quản trị** | `css/admin/admin-layout.css` | `js/modules/admin/layout/admin-shell.js`<br>`pages/admin/admin-portal.js` |
| **Dashboard Admin, KPI doanh thu, Biểu đồ thống kê** | `css/admin/pages/reports.css` | `js/modules/admin/overview/admin-overview.js` |
| **Quản lý danh mục mặt hàng & Dịch vụ (Catalog)** | `css/admin/pages/catalog.css` | `js/modules/admin/catalog/admin-catalog.js` |
| **Quản lý kho hàng, Phiếu nhập/xuất kho (Inventory)** | `css/admin/pages/inventory.css` | `js/modules/admin/inventory/admin-inventory.js` |
| **Điều phối lịch hẹn Admin, Sơ đồ ghế thợ** | `css/admin/pages/appointments.css` | `js/modules/admin/booking/admin-bookings.js` |
| **Quản lý thợ tạo mẫu, Chia ca, Phân quyền Admin** | `css/admin/pages/staff.css` | `js/modules/admin/staff/admin-stylists.js` |
| **Thu ngân POS, In bill hóa đơn, Thanh toán tại quầy** | `css/admin/pages/pos.css` | `js/modules/admin/pos/admin-pos.js` |
| **Quản lý khách hàng (CRM), Nhật ký kiểm toán** | `css/admin/pages/customers.css` | `js/modules/admin/audit/admin-audit.js` |
| **Cấu hình salon, Quản lý chi nhánh** | `css/admin/pages/settings.css` | `js/modules/admin/branches/admin-branches.js`<br>`js/components/BranchCard.js` |

---

## 2. NGUYÊN TẮC GỌI HÀM VÀ PHẠM VI (SCOPE ARCHITECTURE)
- **Customer:** Tất cả hàm dùng chung được gắn qua `window.CustomerWeb` hoặc sub-module chuyên trách (ví dụ: `CustomerBookingSearch`, `CustomerOrderLookup`).
- **Admin:** Tất cả hàm dùng chung được gắn qua `window.AdminWeb` hoặc sub-module chuyên trách (ví dụ: `AdminCatalog`, `AdminInventory`, `AdminPOS`).
- **Tương thích HTML:** File `js/modules/ui-web.js` đóng vai trò proxy tương thích ngược, tự động map các hàm `UIWeb.*` trong HTML cũ sang module mới.

