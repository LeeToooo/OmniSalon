# 🏛️ OmniShop / OmniSalon — Cấu Trúc Khung Sườn Kiến Trúc (Architecture & Developer Guide)

Tài liệu này hướng dẫn toàn bộ khung sườn cấu trúc mã nguồn, luồng dữ liệu (Data Flow), hệ thống giao diện chuẩn **Design Tokens JSON**, và cách để bạn dễ dàng tiếp tục code mở rộng tính năng mới.

---

## 📁 1. Cấu Trúc Thư Mục Dự Án (Directory Layout)

```text
d:\OmniSalon\
├── index.html            # Khung sườn HTML5 chính (Single Page Application Layout)
├── styles.css            # Toàn bộ CSS Design Tokens (màu sắc, bo góc 28px/9999px, typography, grid)
├── DESIGN.md             # Tài liệu đặc tả Design Tokens gốc từ shop.app
├── ARCHITECTURE.md       # Tài liệu kiến trúc và hướng dẫn phát triển code (File này)
├── js/
│   ├── data.js           # Dữ liệu hạt giống mẫu (Services, Combos, Products, Stylists, Shifts, Promos)
│   ├── store.js          # Reactive State Engine (Auth, Giỏ hàng, Đặt lịch, CRUD, Thống kê doanh thu)
│   ├── ui-customer.js    # Component giao diện khách hàng (Hero orbit, 2x2 Mosaics, Wizard đặt lịch, My Bookings)
│   ├── ui-admin.js       # Component giao diện Quản trị viên (Dashboard KPI, Phân ca, Kho hàng, CRUD)
│   └── main.js           # Router điều hướng, Khởi tạo ứng dụng, Quản lý Modal & Toasts
```

---

## 🔄 2. Luồng Dữ Liệu Phản Ứng (Reactive State Flow)

```mermaid
graph TD
    A[UI Components: UICustomer / UIAdmin] -->|Gọi Action: addBooking, addToCart, login| B[SalonStore: js/store.js]
    B -->|Cập nhật State| C[LocalStorage: OMNI_SALON_STATE_V2]
    B -->|Kích hoạt this.notify()| D[MainApp Listener: js/main.js]
    D -->|Tự động render lại view hiện tại| A
```

- **Lưu trữ**: Toàn bộ dữ liệu được đồng bộ qua `localStorage` (key: `OMNI_SALON_STATE_V2`). Khi reset trang, dữ liệu vẫn được bảo toàn.
- **Tính phản ứng (Reactivity)**: Mọi thao tác thêm/sửa/xóa qua `window.store.*` sẽ tự động gọi `this.notify()`, khiến giao diện tự động cập nhật lại mà không cần reload trang.

---

## 🛠️ 3. Hướng Dẫn Thêm Tính Năng & Trang Mới (How to Extend)

### 👉 Bước 1: Khai báo dữ liệu và phương thức trong `js/store.js`
Ví dụ muốn thêm tính năng "Tích điểm đổi quà" (Loyalty Rewards):
```javascript
// js/store.js
getRewards() {
  return this.state.rewards || [];
}

claimReward(rewardId) {
  // Logic trừ điểm, thêm voucher...
  this.saveState();
}
```

### 👉 Bước 2: Thêm Container Panel trong `index.html`
```html
<!-- index.html -->
<div class="content-canvas view-panel" id="rewardsView" style="display: none;">
  <!-- Nội dung sẽ được render động -->
</div>
```

### 👉 Bước 3: Viết Component Render trong `js/ui-customer.js`
```javascript
// js/ui-customer.js
renderRewards(containerEl) {
  const rewards = window.store.getRewards();
  containerEl.innerHTML = `<h2>Danh sách quà tặng</h2>...`;
}
```

### 👉 Bước 4: Đăng ký View trong Router `js/main.js`
```javascript
// js/main.js -> renderCurrentView()
case 'rewards':
  UICustomer.renderRewards(container);
  break;
```

---

## 🔌 4. Hướng Dẫn Kết Nối Backend API Thật (Node.js / Express / Firebase)

Khi bạn muốn chuyển từ `localStorage` sang Database thật (MySQL, MongoDB, PostgreSQL, Firebase):
1. Trong `js/store.js`, thay thế các hàm `saveState()` và `initStore()` bằng các lệnh `fetch('/api/...')` hoặc `axios.get/post`.
2. Giữ nguyên toàn bộ giao diện và các component `UICustomer`, `UIAdmin`, `mainApp` vì chúng đã được tách biệt độc lập hoàn toàn với tầng lưu trữ dữ liệu.

---

## 🚀 5. Cách Khởi Chạy Server
Mở Terminal tại thư mục `d:\OmniSalon` và chạy:
```powershell
python -m http.server 5500
```
Truy cập: **`http://localhost:5500`**.
