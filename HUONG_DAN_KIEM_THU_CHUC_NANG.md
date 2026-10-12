# HƯỚNG DẪN KIỂM THỬ TOÀN DIỆN HỆ THỐNG OMNISALON TRÊN WEB

> **Môi trường chạy thử nghiệm:**
> - **Địa chỉ Web:** `http://localhost:8080/`
> - **Cơ sở dữ liệu:** SQL Server Express (`QL_SALON`) đồng bộ REST API Backend.
> - **Hỗ trợ giao diện:** Giao diện Máy tính (Desktop Web) & Giao diện Điện thoại (Mobile Web / F12 Responsive).

---

## 🔑 DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP MẪU

| Vai Trò | Tên Đăng Nhập | Mật Khẩu | Quyền Hạn Kiểm Thử |
| :--- | :--- | :--- | :--- |
| **Quản Trị Tối Cao (Admin)** | `admin` | `admin123` | Toàn quyền kiểm thử tất cả các tính năng quản lý, báo cáo, phân ca, kho |
| **Quản Lý Chi Nhánh (CN01)** | `user_nv01` | `nv123` | Quản lý điều phối ca, kho hàng, tiếp nhận lịch hẹn chi nhánh Q1 |
| **Thu Ngân POS** | `user_nv61` | `tn123` | Thao tác bán hàng tại quầy POS, check-in và thanh toán hóa đơn |
| **Khách Hàng Thành Viên** | `user_kh01` | `kh123` | Đặt lịch hẹn, đổi/hủy lịch, mua mỹ phẩm trực tuyến, điểm tích lũy |

*Mẹo đăng nhập nhanh:* Bấm vào biểu tượng **👤 Đăng Nhập** ở góc trên bên phải header $\rightarrow$ Chọn tài khoản hoặc nhập username/password tương ứng.

---

## CHỨC NĂNG 1 (WEB): QUẢN LÝ DỊCH VỤ VÀ NHÂN VIÊN

### 1.1. Quản lý dịch vụ, bảng giá
- **Đường dẫn truy cập:** Đăng nhập tài khoản `admin` $\rightarrow$ Bấm nút **👑 QUẢN TRỊ** trên Header (hoặc truy cập `http://localhost:8080/admin`) $\rightarrow$ Chọn tab **`✂️ Dịch Vụ & Combo`**.
- **Các bước kiểm thử:**
  1. **Xem danh sách dịch vụ & bảng giá:** Kiểm tra danh sách dịch vụ hiện ra gồm các danh mục (Cắt tóc tạo kiểu, Uốn texture, Nhuộm màu, Cạo mặt khăn nóng, Combo VIP toàn diện) cùng giá niêm yết rõ ràng.
  2. **Lọc theo danh mục:** Bấm vào các nút danh mục (*Cắt tóc*, *Uốn tóc*, *Nhuộm*, *Combo*) để kiểm tra bộ lọc hoạt động tức thì.
  3. **Chỉnh sửa giá dịch vụ:** Bấm nút **✏️ Sửa** tại một dịch vụ bất kỳ $\rightarrow$ Thay đổi giá bán hoặc thời lượng ca $\rightarrow$ Bấm **Lưu thay đổi** $\rightarrow$ Kiểm tra thông báo Toast thành công và giá mới được cập nhật.
  4. **Khách hàng xem bảng giá:** Truy cập trang `http://localhost:8080/services` để xác nhận giá vừa cập nhật đã hiển thị đồng bộ cho khách hàng.

---

### 1.2. Quản lý nhân viên
- **Đường dẫn truy cập:** Giao diện Quản trị (`/admin`) $\rightarrow$ Chọn tab **`💈 Đội Ngũ Thợ & Phân Ca`**.
- **Các bước kiểm thử:**
  1. **Xem danh sách 80 nhân sự:** Kiểm tra danh sách nhân viên phân bổ theo các cấp bậc (Master Barber, Senior Barber, Thợ phụ, Quản lý, Thu ngân).
  2. **Lọc nhân sự theo chi nhánh:** Chọn dropdown chi nhánh (VD: *CN01 - Bến Thành Q1*, *CN02 - Thảo Điền*) $\rightarrow$ Kiểm tra danh sách thợ hiển thị đúng theo chi nhánh được chọn.
  3. **Lọc theo vị trí / vai trò:** Lọc xem riêng *Thợ chính* hoặc *Thu ngân*.
  4. **Thêm mới nhân viên:** Bấm nút **➕ Thêm Nhân Viên Mới** $\rightarrow$ Nhập họ tên, số điện thoại, chọn chi nhánh và chức vụ $\rightarrow$ Bấm lưu $\rightarrow$ Kiểm tra nhân viên mới xuất hiện trong danh sách.

---

### 1.3. Phân công ca làm việc cho nhân viên
- **Đường dẫn truy cập:** Giao diện Quản trị (`/admin`) $\rightarrow$ Tab **`💈 Đội Ngũ Thợ & Phân Ca`** $\rightarrow$ Khu vực **Bảng Phân Ca Làm Việc Trong Tuần**.
- **Các bước kiểm thử:**
  1. **Xem ca làm việc hiện tại:** Quan sát lịch làm việc hiển thị theo 3 ca chuẩn:
     - **Ca Sáng:** 08:30 – 14:30
     - **Ca Chiều:** 14:00 – 21:30
     - **Ca Full:** 08:30 – 21:30
  2. **Đổi ca làm việc:** Bấm vào dropdown ca trực của một thợ bất kỳ $\rightarrow$ Đổi từ *Ca Sáng* sang *Ca Chiều* hoặc *Nghỉ phép (OFF)*.
  3. **Kiểm tra trạng thái trực chiến:** Xác nhận huy hiệu trạng thái của thợ chuyển đổi tương ứng (Xanh: *Đang trực ca*, Vàng: *Nghỉ ca*).

---

### 1.4. Quản lý lịch trống, đồng bộ lịch hẹn và nhắc lịch
- **Đường dẫn truy cập:** Giao diện Quản trị (`/admin`) $\rightarrow$ Chọn tab **`📅 Điều Phối Lịch Hẹn`**.
- **Các bước kiểm thử:**
  1. **Xem lịch hẹn & khung giờ trống:** Quan sát bảng danh sách lịch hẹn đặt trước trong ngày, phân biệt rõ các ca hẹn: *Chờ phục vụ*, *Đang cắt*, *Đã hoàn thành*.
  2. **Tiếp nhận & Check-in ca hẹn:** Tại một lịch hẹn trạng thái *Chờ phục vụ*, bấm nút **Check-in Khách Đến** $\rightarrow$ Trạng thái chuyển sang *Đang phục vụ*, thợ tương ứng được ghi nhận bắt đầu ca.
  3. **Hoàn thành ca & Nhắc lịch:** Bấm nút **Hoàn thành** $\rightarrow$ Hệ thống tự động giải phóng ghế trống cho khung giờ tiếp theo.
  4. **Gửi nhắc lịch hẹn tự động:** Bấm nút **🔔 Nhắc Lịch (SMS/Zalo)** trên thẻ lịch hẹn $\rightarrow$ Xuất hiện thông báo Toast xác nhận hệ thống đã gửi tin nhắn nhắc nhở trước giờ hẹn 30 phút cho khách.

---

### 1.5. Quản lý khuyến mãi (Voucher & Flash Sale)
- **Đường dẫn truy cập:**
  - Giao diện Admin: Tab **`✂️ Dịch Vụ & Combo`** (Mục Khuyến Mãi) hoặc Tab **`💳 Thu Ngân POS`**.
  - Giao diện Cửa hàng: `http://localhost:8080/shop` (Bộ lọc *⚡ Ưu Đãi Flash Sale*).
- **Các bước kiểm thử:**
  1. **Kiểm tra danh sách mã ưu đãi:** Xác nhận các voucher hệ thống:
     - `OMNIWELCOME`: Giảm 50.000 đ cho khách hàng mới.
     - `OMNIVIP100`: Giảm 100.000 đ cho hóa đơn VIP.
     - `OMNIFLASH30`: Giảm 30% dịch vụ.
  2. **Áp dụng voucher khi thanh toán:** Mở Giỏ hàng hoặc Quầy POS $\rightarrow$ Nhập mã `OMNIWELCOME` $\rightarrow$ Bấm **Áp Dụng** $\rightarrow$ Kiểm tra tiền giảm giá hiển thị chính xác và trừ trực tiếp vào tổng bill.
  3. **Chính sách bảo mật cận date (Flash Sale):** Tại trang `/shop`, bấm nút danh mục **⚡ Ưu Đãi Flash Sale (Giảm 20% - 70%)** $\rightarrow$ Kiểm tra các sản phẩm cận hạn sử dụng được tự động gắn nhãn Flash Sale hấp dẫn, bảo mật tuyệt đối không làm lộ ngày cận date thô thiển.

---

## CHỨC NĂNG 2 (WEB): QUẢN LÝ SẢN PHẨM VÀ BÁN HÀNG

### 2.1. Quản lý sản phẩm, tồn kho
- **Đường dẫn truy cập:** Giao diện Quản trị (`/admin`) $\rightarrow$ Chọn tab **`📦 Quản Lý Kho & Sản Phẩm`**.
- **Các bước kiểm thử:**
  1. **Xem danh mục sản phẩm & số lượng tồn:** Kiểm tra toàn bộ sản phẩm (Sáp vuốt tóc, Pomade Reuzel, Dầu gội Davines, Gôm xịt) kèm số lượng tồn kho từng chi nhánh.
  2. **Cảnh báo tồn kho an toàn:** Quan sát các sản phẩm có số lượng tồn `< 10` hộp được gắn nhãn cảnh báo đỏ **⚠️ Sắp Hết Hàng**.
  3. **Cảnh báo hạn sử dụng FEFO:** Kiểm tra cột hạn sử dụng có cảnh báo ưu tiên xuất kho theo nguyên tắc Hạn dùng trước - Xuất trước (FEFO).
  4. **Điều chỉnh nhập/xuất kho:** Bấm nút **Điều chỉnh kho** tại sản phẩm $\rightarrow$ Nhập số lượng nhập thêm $\rightarrow$ Xác nhận số lượng tồn kho tăng lên ngay lập tức.

---

### 2.2. Quản lý khách hàng
- **Đường dẫn truy cập:** Giao diện Quản trị (`/admin`) $\rightarrow$ Chọn tab **`📜 Quản Lý Khách Hàng & Nhật Ký`**.
- **Các bước kiểm thử:**
  1. **Danh sách hồ sơ khách hàng:** Xem danh sách khách hàng gồm: Mã KH (`KH01`, `KH02`), Họ tên, Số điện thoại, Email, Hạng thành viên (Standard, Silver, Gold, Diamond).
  2. **Tìm kiếm khách hàng:** Nhập số điện thoại (VD: `0988000001`) vào ô tìm kiếm $\rightarrow$ Bảng tự động lọc ra đúng khách hàng tương ứng.
  3. **Xem điểm thưởng & lịch sử chi tiêu:** Kiểm tra điểm tích lũy (*Reward Points*) và số lượt ghé salon của khách hàng hiển thị đầy đủ.

---

### 2.3. Quản lý đơn hàng & thanh toán (Quầy Thu Ngân POS)
- **Đường dẫn truy cập:** Giao diện Quản trị (`/admin`) $\rightarrow$ Chọn tab **`💳 Thu Ngân POS & Hóa Đơn`**.
- **Các bước kiểm thử:**
  1. **Tạo đơn hàng tại quầy:**
     - Chọn Chi nhánh phục vụ và Tên khách hàng (hoặc khách vãng lai).
     - Bấm chọn các Dịch vụ khách vừa làm (VD: *Cắt tóc Nam Fade*, *Gội xả thảo dược*).
     - Bấm chọn Sản phẩm khách mua thêm tại quầy (VD: *Sáp vuốt Volcanic Clay*).
  2. **Áp dụng giảm giá / Voucher:** Nhập mã voucher hoặc chọn chiết khấu thành viên.
  3. **Tính toán tự động:** Kiểm tra máy POS tự động tính Tổng tiền hàng, Giảm giá, Thuế VAT và hiển thị số tiền thanh toán cuối cùng.
  4. **Thực hiện thanh toán:** Chọn phương thức thanh toán (*Tiền mặt*, *Chuyển khoản QR Napas*, *Quẹt thẻ*) $\rightarrow$ Nhập số tiền khách đưa $\rightarrow$ Xem hệ thống tính tiền thối $\rightarrow$ Bấm **Hoàn Tất Thanh Toán & In Hóa Đơn**.
  5. **Kiểm tra hóa đơn:** Hóa đơn xuất ra với đầy đủ thông tin salon, mã đơn hàng, ngày giờ và trừ kho tự động.

---

## CHỨC NĂNG 3 (MOBILE): KHÁCH HÀNG ĐẶT LỊCH VÀ MUA HÀNG

> **Cách chuyển sang giao diện Mobile để kiểm thử:**
> - Nhấn phím **F12** trên trình duyệt (Developer Tools).
> - Nhấn tổ hợp phím **Ctrl + Shift + M** (Toggle Device Emulation) $\rightarrow$ Chọn thiết bị **iPhone 14 / Samsung Galaxy** (kích thước ~390px - 414px).
> - Hoặc co nhỏ cửa sổ trình duyệt về dạng màn hình di động: Thanh điều hướng phía dưới (**Mobile Bottom Nav**) sẽ xuất hiện với 6 nút: *Trang Chủ, Dịch Vụ, Thợ Mẫu, Đặt Lịch, Cửa Hàng, Chi Nhánh*.

---

### 3.1. Đặt lịch chăm sóc tóc (Booking Wizard 4 Bước)
- **Đường dẫn truy cập:** Bấm vào biểu tượng **📅 Đặt Lịch** trên thanh Bottom Nav hoặc nút **📅 Đặt Lịch Hẹn Ngay** trên Hero Banner.
- **Các bước kiểm thử:**
  1. **Bước 1 - Chọn Chi Nhánh:** Chọn 1 trong 20 chi nhánh gần nhất (VD: *Omni Salon Barber Q1 Bến Thành*).
  2. **Bước 2 - Chọn Dịch Vụ:** Đánh dấu chọn dịch vụ mong muốn (VD: *Cắt Tóc Nam Chuẩn Form Fade - 120.000 đ* hoặc Combo VIP).
  3. **Bước 3 - Chọn Thợ Tạo Mẫu (Stylist):** Bấm chọn thợ yêu thích (VD: *Đỗ Đình Độ - Master Barber*) hoặc chọn *Stylist Bất Kỳ (Nhanh Nhất)*.
  4. **Bước 4 - Chọn Ngày & Giờ:** Chọn ngày đặt lịch $\rightarrow$ Bấm chọn khung giờ còn trống (VD: `10:30`, `14:00`, `16:30`) $\rightarrow$ Điền Họ tên + SĐT $\rightarrow$ Bấm **Xác Nhận Đặt Lịch**.
  5. **Kết quả:** Modal thành công hiện ra với Mã lịch hẹn mới (Dạng `LH...`), dữ liệu ghi thẳng vào cơ sở dữ liệu.

---

### 3.2. Hủy lịch, đổi lịch
- **Đường dẫn truy cập:** Bấm vào menu Avatar ở góc trên $\rightarrow$ Chọn **🔍 Tra Cứu Lịch Hẹn** (hoặc mở *Trang Cá Nhân & Điểm Thưởng* $\rightarrow$ Tab *Lịch Hẹn Của Tôi*).
- **Các bước kiểm thử:**
  1. **Tra cứu lịch:** Nhập Số điện thoại (VD: `0988000001`) hoặc Mã lịch hẹn $\rightarrow$ Bấm **Tra Cứu** $\rightarrow$ Danh sách lịch hẹn của khách xuất hiện.
  2. **Đổi giờ / đổi ngày hẹn:** Tại lịch hẹn đang chờ, bấm **Đổi Lịch Hẹn** $\rightarrow$ Chọn ngày mới hoặc slot giờ mới $\rightarrow$ Bấm **Lưu Thay Đổi** $\rightarrow$ Xác nhận thời gian đã được cập nhật.
  3. **Hủy lịch hẹn:** Bấm nút **Hủy Lịch** $\rightarrow$ Xác nhận đồng ý $\rightarrow$ Trạng thái lịch chuyển sang *Đã Hủy*, slot giờ được trả lại trạng thái trống cho người khác đặt.

---

### 3.3. Tìm kiếm sản phẩm
- **Đường dẫn truy cập:** Bấm vào biểu tượng **🛍️ Cửa Hàng** trên thanh Bottom Nav Mobile (hoặc truy cập `/shop`).
- **Các bước kiểm thử:**
  1. **Tìm kiếm theo từ khóa:** Gõ vào ô tìm kiếm: `"pomade"`, `"volcanic"`, `"dầu gội"` $\rightarrow$ Danh sách sản phẩm tự động lọc theo thời gian thực.
  2. **Lọc theo danh mục:** Bấm các pill danh mục (*Sáp Vuốt Tóc*, *Dầu Gội & Xả*, *Gôm Xịt Giữ Nếp*, *Chăm Sóc Râu*).
  3. **Lọc theo thương hiệu & mức giá:** Chọn thương hiệu *Apestomen*, *Reuzel*, *Hanz de Fuko* và chọn tầm giá (*Dưới 300k*, *300k - 500k*, *Trên 500k*).

---

### 3.4. Mua hàng và thanh toán trực tuyến
- **Đường dẫn truy cập:** Tại trang Cửa Hàng (`/shop`).
- **Các bước kiểm thử:**
  1. **Thêm vào giỏ hàng:** Bấm nút **🛒 Thêm Vào Giỏ Hàng** trên sản phẩm $\rightarrow$ Huy hiệu giỏ hàng trên header nhảy số lượng tức thì.
  2. **Mở giỏ hàng:** Bấm vào biểu tượng Giỏ hàng $\rightarrow$ Drawer trượt ra từ bên phải hiển thị chi tiết các món hàng.
  3. **Tăng/giảm số lượng:** Bấm dấu `+`, `-` hoặc nút xóa sản phẩm.
  4. **Chọn hình thức nhận hàng:**
     - *🏢 Lấy Tại Chi Nhánh:* Chọn chi nhánh salon để giữ hàng miễn phí 48h.
     - *🚚 Giao Tận Nơi (COD):* Nhập địa chỉ nhận hàng, họ tên, số điện thoại.
  5. **Áp mã giảm giá:** Nhập mã `OMNIWELCOME` $\rightarrow$ Bấm **Áp Dụng** $\rightarrow$ Tiền giảm giá được trừ trực tiếp.
  6. **Đặt hàng:** Bấm **Tiến Hành Đặt Hàng & Thanh Toán** $\rightarrow$ Xuất hiện thông báo đặt hàng thành công kèm mã đơn hàng.

---

## CHỨC NĂNG 4 (WEB): THỐNG KÊ VÀ BÁO CÁO

### 4.1. Báo cáo doanh thu
- **Đường dẫn truy cập:** Đăng nhập tài khoản `admin` $\rightarrow$ Truy cập `/admin` $\rightarrow$ Chọn tab **`📊 Báo Cáo Doanh Thu & Kho`** (subTab `overview`).
- **Các bước kiểm thử:**
  1. **Xem các chỉ số tài chính cốt lõi (KPI Cards):**
     - **Tổng Doanh Thu Hệ Thống:** Doanh thu gộp toàn chuỗi.
     - **Doanh Thu Dịch Vụ Cắt/Uốn:** Tỷ trọng đóng góp từ dịch vụ tóc.
     - **Doanh Thu Bán Lẻ Mỹ Phẩm:** Doanh số bán sáp, pomade, dầu gội.
     - **Tổng Lượt Khách Phục Vụ:** Số lượng lượt khách đã check-in hoàn tất.
  2. **Biểu đồ trực quan:** Quan sát biểu đồ phân tích cơ cấu doanh thu theo thời gian và loại hình kinh doanh.
  3. **Lọc doanh thu theo chi nhánh:** Chọn dropdown chi nhánh $\rightarrow$ Báo cáo lập tức tính toán lại số liệu riêng cho chi nhánh đó (VD: Doanh thu riêng của *Chi nhánh Q1 Bến Thành*).
  4. **Lọc loại hình doanh thu:** Bấm chọn chuyển đổi xem *Tất Cả*, *Chỉ Dịch Vụ*, hoặc *Chỉ Mỹ Phẩm*.

---

### 4.2. Báo cáo tồn kho
- **Đường dẫn truy cập:** Giao diện Quản trị (`/admin`) $\rightarrow$ Tab **`📊 Báo Cáo Doanh Thu & Kho`** (Khu vực Báo Cáo Kho) kết hợp Tab **`📦 Quản Lý Kho & Sản Phẩm`**.
- **Các bước kiểm thử:**
  1. **Tổng giá trị vốn hàng tồn kho:** Kiểm tra tổng giá trị vốn lưu động của hàng hóa trên toàn hệ thống 20 chi nhánh.
  2. **Báo cáo sản phẩm dưới định mức an toàn:** Xem danh sách các mặt hàng có tồn kho thấp dưới ngưỡng tối thiểu (`< 10` sản phẩm) cần nhập thêm.
  3. **Báo cáo luân chuyển hàng hóa:** Xem tỷ lệ xuất nhập giữa kho tổng và kho các chi nhánh.
  4. **Báo cáo hàng hóa cận date (FEFO):** Đánh giá danh sách sản phẩm cận hạn sử dụng để kịp thời chạy chương trình Flash Sale xả hàng bảo toàn vốn.

---

## 📋 BẢNG TỔNG HỢP KIỂM THỬ NHANH (TEST CHECKLIST)

| STT | Chức Năng Cần Kiểm Thử | Vị Trí / URL Web | Tài Khoản Test | Kết Quả Mong Đợi | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1.1** | Quản lý dịch vụ, bảng giá | `/admin` $\rightarrow$ Tab `Dịch Vụ & Combo` | `admin` | Lọc danh mục, sửa giá dịch vụ thành công, đồng bộ ra trang chủ | 🟢 Đạt |
| **1.2** | Quản lý nhân viên | `/admin` $\rightarrow$ Tab `Đội Ngũ Thợ` | `admin` | Xem đủ 80 thợ, lọc theo chi nhánh/cấp bậc, thêm thợ mới | 🟢 Đạt |
| **1.3** | Phân công ca làm việc | `/admin` $\rightarrow$ Tab `Đội Ngũ Thợ` | `admin` | Đổi ca Sáng/Chiều/Full/Nghỉ phép mượt mà, đổi màu trạng thái | 🟢 Đạt |
| **1.4** | Quản lý lịch trống & nhắc lịch | `/admin` $\rightarrow$ Tab `Điều Phối Lịch Hẹn` | `admin` | Check-in ca hẹn, hoàn thành ca, giải phóng slot, gửi nhắc lịch | 🟢 Đạt |
| **1.5** | Quản lý khuyến mãi | `/admin` $\rightarrow$ Tab `POS` / `/shop` | `admin` / Khách | Áp mã voucher `OMNIWELCOME` giảm giá chuẩn, hàng cận date gắn Flash Sale | 🟢 Đạt |
| **2.1** | Quản lý sản phẩm, tồn kho | `/admin` $\rightarrow$ Tab `Quản Lý Kho` | `admin` | Xem số lượng tồn từng CN, cảnh báo hết hàng, điều chỉnh kho | 🟢 Đạt |
| **2.2** | Quản lý khách hàng | `/admin` $\rightarrow$ Tab `Khách Hàng` | `admin` | Tìm kiếm khách theo SĐT, xem điểm thưởng, hạng thành viên | 🟢 Đạt |
| **2.3** | Quản lý đơn hàng, POS | `/admin` $\rightarrow$ Tab `Thu Ngân POS` | `admin` / `user_nv61` | Chọn món, tính tổng tiền + VAT, thanh toán và in hóa đơn POS | 🟢 Đạt |
| **3.1** | Khách đặt lịch (Mobile) | `/booking` hoặc Bottom Nav | Bất kỳ | Wizard 4 bước chọn CN, dịch vụ, thợ, giờ hẹn $\rightarrow$ Tạo lịch mới | 🟢 Đạt |
| **3.2** | Hủy lịch, đổi lịch (Mobile) | Avatar $\rightarrow$ `Tra Cứu Lịch Hẹn` | Khách | Nhập SĐT/Mã lịch hẹn $\rightarrow$ Đổi ngày giờ hoặc Hủy lịch hẹn an toàn | 🟢 Đạt |
| **3.3** | Tìm kiếm sản phẩm (Mobile) | `/shop` hoặc Bottom Nav | Bất kỳ | Tìm kiếm từ khóa, lọc danh mục/thương hiệu/mức giá chuẩn xác | 🟢 Đạt |
| **3.4** | Mua hàng & thanh toán (Mobile)| `/shop` $\rightarrow$ Giỏ hàng | Khách | Thêm giỏ, chọn nhận tại quầy/COD, nhập voucher, đặt hàng thành công | 🟢 Đạt |
| **4.1** | Báo cáo doanh thu | `/admin` $\rightarrow$ Tab `Báo Cáo` | `admin` | Hiển thị KPI Cards doanh thu tổng/dịch vụ/mỹ phẩm, lọc chi nhánh | 🟢 Đạt |
| **4.2** | Báo cáo tồn kho | `/admin` $\rightarrow$ Tab `Báo Cáo` & `Kho` | `admin` | Tổng giá trị tồn kho, tỷ lệ hàng cận date FEFO, cảnh báo tồn kho thấp | 🟢 Đạt |

---
*Tài liệu được khởi tạo tự động và đồng bộ trực tiếp với mã nguồn OmniSalon Enterprise.*
