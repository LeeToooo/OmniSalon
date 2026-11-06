# ROADMAP MODULE HÓA JAVASCRIPT - OMNI SALON

## NGUYÊN TẮC BẤT DI BẤT DỊCH CHO AI AGENT
1. CHẾ ĐỘ MỘT MODULE: Mỗi phiên làm việc chỉ được thao tác trên ĐÚNG 1 tính năng/thư mục con.
2. CẤM TẠO SCRIPT TẠM: Thao tác đọc/cắt code trực tiếp bằng file tool, tuyệt đối không tạo các file script Node.js tạm (check_*.js, search_*.js).
3. ĐẢM BẢO PHẠM VI BIẾN (SCOPE): Khi tách hàm ra module, gắn vào namespace tương ứng (ví dụ: `window.AdminCatalog = { ... }` hoặc ES Modules) để không làm gãy các lời gọi onclick từ HTML.
4. QUY TRÌNH 3 BƯỚC MỖI LƯỢT:
   - Bước 1: Tạo/Cập nhật file trong thư mục module con.
   - Bước 2: Tự động xóa sạch hàm tương ứng trong file monolithic gốc.
   - Bước 3: Khai báo thẻ <script> vào index.html và DỪNG HẲN báo cáo.

---

## GIAI ĐOẠN 1: BÓC TÁCH `admin-web.js` (Phân hệ Quản trị)
- [x] Lượt 1.1: `admin/catalog/` (Quản lý mặt hàng, danh mục, dịch vụ)
- [x] Lượt 1.2: `admin/inventory/` (Quản lý kho, nhập/xuất phiếu kho)
- [x] Lượt 1.3: `admin/booking/` (Điều phối lịch hẹn, sơ đồ ghế)
- [x] Lượt 1.4: `admin/staff/` (Quản lý thợ, chia ca, phân quyền)
- [x] Lượt 1.5: `admin/pos/` (Quầy thu ngân, in hóa đơn, thanh toán)
- [x] Lượt 1.6: `admin/branches/` & `admin/audit/` (Chi nhánh & nhật ký kiểm toán)
- [x] Lượt 1.7: `admin/overview/` & `admin/layout/` (Dashboard KPI, sidebar toggle)
- [x] Lượt 1.8: Dọn sạch và giải phóng file `admin-web.js`.

---

## GIAI ĐOẠN 2: BÓC TÁCH `customer-web.js` (Phân hệ Khách hàng)
- [x] Lượt 2.1: `customer/booking/` (Flow đặt lịch, chọn ngày/giờ, chọn stylist)
- [x] Lượt 2.2: `customer/order/` (Giỏ hàng, checkout, tra cứu đơn hàng)
- [x] Lượt 2.3: `customer/ai/` (AI Restyle studio, so sánh ảnh kiểu tóc)
- [x] Lượt 2.4: `customer/portal/` (Tài khoản cá nhân, hạng thành viên, lịch sử)
- [x] Lượt 2.5: `customer/staff/` & `customer/layout/` (Danh sách thợ, header/bottom nav)
- [x] Lượt 2.6: Dọn sạch và giải phóng file `customer-web.js`.

---

## GIAI ĐOẠN 3: BÓC TÁCH `ui-web.js` (Giao diện & Tiện ích chung)
- [x] Lượt 3.1: `components/` (Modal popup, Toast thông báo, Dropdown, Drawer)
- [x] Lượt 3.2: `core/` (Theme switcher sáng/tối, API client, State/Storage helpers)
- [x] Lượt 3.3: Dọn sạch và giải phóng file `ui-web.js`.

