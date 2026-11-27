# KỊCH BẢN CHI TIẾT BẢO VỆ KHÓA LUẬN TỐT NGHIỆP CỬ NHÂN
## HỘI ĐỒNG BẢO VỆ KHÓA LUẬN CỬ NHÂN CNTT — HỌC KỲ 2, NĂM HỌC 2026 - 2027
**Trường Đại Học Công Thương TP.HCM (HUIT) — Khoa Công Nghệ Thông Tin**

---


# 🎙️ KỊCH BẢN CHI TIẾT TỪNG SLIDE (SLIDE-BY-SLIDE SCRIPT)

---

### SLIDE 1
> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Lời đầu tiên, em xin phép được gửi lời chào trân trọng nhất đến Quý Thầy, Quý Cô trong Hội đồng bảo vệ Khóa luận tốt nghiệp Cử nhân ngành Công nghệ Thông tin, Trường Đại học Công Thương TP.HCM (HUIT) ngày hôm nay.*
> 
> *Chúng em xin kính chúc Quý Thầy Cô luôn dồi dào sức khỏe và có một buổi làm việc thành công tốt đẹp.*
> 
> *Sau đây, nhóm chúng em xin phép được bắt đầu phần báo cáo khóa luận tốt nghiệp của mình."*

---

### SLIDE 2
> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Kính thưa Hội đồng, đề tài khóa luận của nhóm chúng em là: **'Xây dựng ứng dụng hỗ trợ đặt lịch và bán sản phẩm chăm sóc tóc tại salon tóc'**, được xây dựng dưới tên gọi thương mại là hệ sinh thái **OmniSalon**.*
> 
> *Đề tài được thực hiện dưới sự chỉ dẫn và định hướng chuyên môn tận tình từ Giảng viên hướng dẫn: **ThS. Đinh Thị Tâm**.*
> 
> *Nhóm sinh viên thực hiện gồm có 3 thành viên:*
> - *Em là **Lê Hoàng Hải**;*
> - *Bạn **Đỗ Đình Đô**;*
> - *Và bạn **Lê Hữu Luân**.*
> 
> *Trong bài báo cáo hôm nay, em xin phép đại diện nhóm bắt đầu phần trình bày mở đầu và khảo sát nghiệp vụ."*

---

### SLIDE 3
> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Bài báo cáo của nhóm em hôm nay được cô đọng trong 5 nội dung trọng tâm:*
> 1. *Phần 1: Mở đầu và kết quả khảo sát bài toán thực tế.*
> 2. *Phần 2: Phân tích hệ thống hướng đối tượng và mô hình hóa chức năng.*
> 3. *Phần 3: Thiết kế kiến trúc tổng thể, cơ sở dữ liệu và các giải thuật nghiệp vụ cốt lõi.*
> 4. *Phần 4: Đánh giá kiểm thử chức năng, hiệu năng và bảo mật hệ thống.*
> 5. *Phần 5: Đúc kết kết quả đạt được, định hướng phát triển và trình diễn Demo trực tiếp.*
> 
> *Sau đây, em xin phép đi vào chi tiết **Phần 1: Mở đầu & Khảo sát**."*

---

### SLIDE 4
> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Kính thưa Quý Thầy Cô, hiện nay ngành dịch vụ làm tóc nam và nữ tại Việt Nam đang có sự chuyển dịch rất mạnh mẽ. Các tiệm tóc truyền thống dần mở rộng thành các **chuỗi salon hiện đại**, kết hợp mô hình 'Dịch vụ tạo mẫu' và 'Bán lẻ mỹ phẩm chăm sóc tóc chuyên sâu'.*
> 
> *Tuy nhiên, qua quá trình khảo sát thực tế, nhóm nhận thấy phần lớn các salon quy mô vừa và nhỏ vẫn quản lý bằng các công cụ thủ công rời rạc như tin nhắn Zalo, sổ viết tay hay các bảng tính Excel rời rạc. Điều này dẫn đến **4 điểm nghẽn nghiêm trọng**:*
> - *Thứ nhất là **Trùng lịch làm việc (Overbooking)**: Khi vào giờ cao điểm, việc nhận lịch qua nhiều kênh dẫn đến tình trạng hai khách cùng đặt một thợ vào một khung giờ, khiến khách phải chờ đợi lâu, làm giảm sút trải nghiệm khách hàng.*
> - *Thứ hai là **Dễ quên ghi chú chất tóc cũ**: Làm tóc là dịch vụ đòi hỏi cá nhân hóa rất cao. Nếu không lưu lại tình trạng da đầu, mức độ hư tổn hay mã thuốc nhuộm của lần trước, thợ sẽ mất thời gian tư vấn lại từ đầu hoặc dùng sai hóa chất.*
> - *Thứ ba là **Tra cứu thông tin khách hàng quá chậm**: Nhân viên lễ tân mất từ 3 đến 5 phút để lục tìm sổ hoặc file tính khi khách ghé tiệm.*
> - *Và thứ tư là **Thất thoát tồn kho mỹ phẩm**: Mỹ phẩm, keo sáp, thuốc uốn nhuộm đều có hạn sử dụng. Việc quản lý bằng Excel không theo dõi được hạn dùng theo từng mã lô, dẫn đến tình trạng hàng cận hạn bị bỏ quên, đồng thời việc tính tỷ lệ hoa hồng cho thợ vào cuối tháng rất dễ xảy ra sai sót.*
> 
> *Chính vì những bất cập trên, việc xây dựng một hệ sinh thái chuyển đổi số toàn diện như **OmniSalon** là yêu cầu vô cùng cấp thiết."*

---

### SLIDE 5
> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Từ bài toán thực tế đó, nhóm chúng em đặt ra hai mục tiêu nghiên cứu song hành:*
> 
> *Về **mục tiêu lý thuyết**: Nhóm áp dụng bài bản quy trình phân tích và thiết kế phần mềm hướng đối tượng **OOAD**, mô hình hóa bằng ngôn ngữ **UML** thông qua các biểu đồ Use Case, Hoạt động, Tuần tự, Biểu đồ lớp; đồng thời chuẩn hóa Cơ sở dữ liệu quan hệ đạt chuẩn **Dạng chuẩn 3 (3NF)** để loại bỏ hoàn toàn các dị thường dữ liệu.*
> 
> *Về **mục tiêu thực tiễn**: Nhóm giải quyết dứt điểm các bài toán nghiệp vụ thông qua việc:*
> - *Xây dựng giải thuật khóa giữ chỗ thời gian thực, cam kết không bao giờ trùng lịch thợ.*
> - *Xây dựng hồ sơ khách hàng 360 độ tập trung theo Số điện thoại.*
> - *Và đặc biệt là đồng bộ dữ liệu thời gian thực giữa 3 nền tảng: **Khách hàng đặt trên Web hoặc App di động**, **Lễ tân thao tác trên quầy POS**, và **Ban quản lý kiểm soát trên cổng Admin**.*
> 
> *Phạm vi nghiên cứu của đề tài tập trung vào toàn bộ chuỗi khép kín: Đặt lịch trực tuyến, Tiếp nhận điều phối ghế cắt, Hồ sơ chất tóc, Bán lẻ mỹ phẩm quản lý theo lô và hạn sử dụng (FEFO), và Thanh toán tự động tại quầy."*

---

### SLIDE 6
> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Để hệ thống thực sự đi vào đời sống, nhóm đã khảo sát chuyên sâu nhu cầu của **4 nhóm đối tượng người dùng chính**:*
> - *Với **Khách hàng**: Họ cần sự chủ động. Khách muốn xem khung giờ trống của từng cơ sở, chọn đúng thợ quen tay, xem minh bạch giá dịch vụ, combo ưu đãi và dễ dàng mua mỹ phẩm chính hãng có tích điểm thành viên.*
> - *Với **Thợ tạo mẫu (Stylist)**: Thợ cần công cụ số trên điện thoại để xem nhanh ca trực trong ngày, xem trước tiền sử uốn nhuộm và chất tóc của khách sắp đến, đồng thời theo dõi minh bạch số lượt phục vụ và tiền hoa hồng thực nhận.*
> - *Với **Lễ tân & Thu ngân**: Tiêu chí hàng đầu là tốc độ. Hệ thống hỗ trợ Check-in tức thì bằng mã QR hoặc số điện thoại, điều phối ghế linh hoạt cho cả khách đặt trước và khách vãng lai (walk-in), thanh toán gộp cả tiền cắt tóc và mỹ phẩm trên một hóa đơn thông qua VietQR Napas 247.*
> - *Cuối cùng, với **Quản lý chuỗi**: Hệ thống cung cấp bức tranh tài chính đa chi nhánh theo thời gian thực, quản lý tồn kho mỹ phẩm chính xác theo từng mã lô và hạn dùng, hỗ trợ xếp ca làm việc và phân quyền bảo mật chặt chẽ."*

---

### SLIDE 7
> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Nhằm đảm bảo tính chính xác cho các thực thể dữ liệu trong CSDL, nhóm đã tiến hành khảo sát thực địa tại **4rau barber** và chuẩn hóa 3 biểu mẫu tài chính - kho vận cốt lõi theo quy định của Bộ Tài chính:*
> 1. *Thứ nhất là **Phiếu nhập kho (Mẫu 01-VT theo Thông tư 200)**: Thu thập đầy đủ các trường thông tin về Nhà cung cấp, Số hóa đơn, Mã lô sản xuất, Ngày sản xuất và Hạn sử dụng của từng thùng mỹ phẩm.*
> 2. *Thứ hai là **Phiếu xuất kho (Mẫu 02-VT theo Thông tư 133)**: Kiểm soát việc xuất thuốc uốn, nhuộm cho thợ làm dịch vụ hoặc xuất bán lẻ.*
> 3. *Và thứ ba là **Hóa đơn bán hàng & cung ứng dịch vụ**: Tích hợp mã số hóa đơn duy nhất, chi tiết từng dịch vụ, sản phẩm mua kèm, chiết khấu khuyến mãi và thuế.*
> 
> *Việc chuẩn hóa các biểu mẫu này là cơ sở vững chắc để nhóm thiết kế các bảng quan hệ và thuộc tính trong SQL Server.*
> 
> *Tiếp theo đây, em xin kính mời bạn **Đỗ Đình Đô** tiếp tục báo cáo **Phần 2: Phân tích hệ thống và Kiến trúc tổng quan**."*

---
### SLIDE 8

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Kính thưa Quý Thầy Cô trong Hội đồng, em là Đỗ Đình Đô. Em xin phép được đại diện nhóm tiếp tục phần trình bày về Phân tích hệ thống và Thiết kế kiến trúc của OmniSalon.*
> 
> *Dựa trên kết quả khảo sát, hệ thống OmniSalon vận hành xoay quanh **3 quy trình nghiệp vụ xương sống**:*
> 
> *Trọng tâm nhất là **Quy trình phục vụ khách làm tóc gồm 5 bước khép kín**:*
> - *Bước 1: Tiếp nhận khách tại sảnh lễ tân qua mã QR hoặc xếp ghế trực tiếp cho khách vãng lai.*
> - *Bước 2: Thợ mở hồ sơ số, xem lại ghi chú chất tóc cũ của khách để tư vấn kiểu tóc và công thức hóa chất tối ưu.*
> - *Bước 3: Tiến hành thực hiện dịch vụ, hệ thống cho phép thêm các dịch vụ phát sinh theo nhu cầu thực tế của khách.*
> - *Bước 4: Ngay khi hoàn thiện, thợ chụp ảnh kết quả và cập nhật ngay ghi chú kỹ thuật mới lên hệ thống.*
> - *Bước 5: Lễ tân chốt hóa đơn, khách quét mã VietQR thanh toán và để lại đánh giá sao.*
> 
> *Hai quy trình tiếp theo gồm **Quy trình bán lẻ mỹ phẩm** đa kênh đồng bộ trừ kho tự động, và **Quy trình quản trị nhân sự - kho vận FEFO** giúp ban giám đốc salon nắm trọn số liệu kinh doanh."*

---

### SLIDE 9

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Trên màn hình là **Sơ đồ Use Case tổng quát** của toàn bộ hệ sinh thái OmniSalon.*
> 
> *Hệ thống được mô hình hóa với **4 nhóm tác nhân chính** tương tác trực tiếp với **20 Use Cases nghiệp vụ**:*
> - *Nhóm đã thiết lập quan hệ kế thừa (Generalization) rõ ràng: Tác nhân **Quản lý (QuanLy)** kế thừa toàn bộ quyền hạn nghiệp vụ của **Lễ tân (LeTan)** và **Nhân viên (NhanVien)**, giúp giảm thiểu sự trùng lặp trong sơ đồ.*
> - *Các quan hệ phụ thuộc được định nghĩa rất chặt chẽ: Ví dụ Use Case `ThanhToan` được `<<include>>` bắt buộc khi `MuaSanPham`, và Use Case `DatLichHen` được `<<extend>>` sang `ThanhToan` khi khách có nhu cầu đặt cọc trước.*
> - *Đặc biệt, toàn bộ 20 Use Cases đều được nhóm viết **tài liệu đặc tả chi tiết** gồm: Điều kiện tiên quyết (Pre-conditions), Luồng sự kiện chính (Basic Flow), Luồng sự kiện rẽ nhánh (Alternative Flows) và Luồng ngoại lệ (Exception Flows), đảm bảo tính chặt chẽ trước khi lập trình."*

---

### SLIDE 10

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Để phân công vai trò rõ ràng trong hệ thống, nhóm phân rã thành **4 phân hệ chức năng độc lập**:*
> 1. *Thứ nhất là **Phân hệ Khách hàng** phục vụ trên cả Web và Mobile App: Khách có thể Đăng nhập, Tra cứu dịch vụ, Đặt lịch hẹn trực tuyến, Mua mỹ phẩm và Đánh giá chất lượng sau khi cắt.*
> 2. *Thứ hai là **Phân hệ Thợ tạo mẫu (Stylist)**: Giao diện tối ưu thao tác nhanh, cho phép thợ xem lịch làm việc được điều phối, kiểm tra trạng thái sản phẩm và lập phiếu đề xuất vật tư.*
> 3. *Thứ ba là **Phân hệ Lễ tân / Quầy POS**: Là nơi xử lý check-in đón khách, điều phối lịch hẹn theo sơ đồ ghế cắt, quản lý đơn hàng tại quầy và thực hiện thanh toán thu ngân.*
> 4. *Thứ tư là **Phân hệ Quản trị viên (Admin Portal)**: Nơi nhà quản lý thực hiện toàn quyền kiểm soát tài khoản, danh mục dịch vụ, ca làm việc nhân viên, thiết lập giá theo chi nhánh, chương trình khuyến mãi và xuất báo cáo doanh thu tài chính."*

---

### SLIDE 11

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Kính thưa Thầy Cô, đây là **Sơ đồ lớp ở mức Phân tích** của hệ thống.*
> 
> *Ở mức phân tích, nhóm tập trung mô hình hóa các khái niệm thực tế thành các thực thể nghiệp vụ (Entity Classes). Mối quan hệ giữa các đối tượng thể hiện toàn diện chu trình salon:*
> - *Một `KhachHang` có thể tạo nhiều `LichHen` (quan hệ 1 - n).*
> - *Một `LichHen` chứa nhiều `ChiTietLichHen` liên kết với danh mục `DichVu`.*
> - *Mỗi khi dịch vụ hoàn tất, dữ liệu được chuyển tiếp thành `HoaDon`, trong đó chứa cả `ChiTietHoaDon_DichVu` và `ChiTietHoaDon_SanPham` nếu khách có mua thêm mỹ phẩm tại quầy.*
> - *Thực thể `TonKho` được liên kết trực tiếp với `SanPham` và các `QuyTacGiamGiaTheoHSD` để phục vụ giải thuật FEFO.*
> 
> *Đây là tiền đề vững chắc để nhóm tiến hành chi tiết hóa sang mức Thiết kế."*

---

### SLIDE 12

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Chuyển sang **Sơ đồ lớp ở mức Thiết kế**, toàn bộ các lớp đã được đặc tả chi tiết về mặt kỹ thuật lập trình:*
> - *Mỗi thuộc tính đều có kiểu dữ liệu cụ thể (`String`, `DateTime`, `Decimal`, `Boolean`) và phạm vi truy cập nghiêm ngặt.*
> - *Quan trọng nhất là hệ thống các **phương thức nghiệp vụ (Business Methods)** được đóng gói bên trong các lớp xử lý:*
>   + *Lớp `LichHen` sở hữu các phương thức cốt lõi như `taoLichHen()`, `kiemTraTrungLich()`, `xacNhanLichHen()`, `huyLichHen()`.*
>   + *Lớp `HoaDon` đóng gói logic `lapHoaDon()`, `tinhTongTienHoaDon()`, `xuatHoaDonPDF()` và `xacNhanThanhToan()`.*
>   + *Lớp `QuyTacGiamGiaTheoHSD` chịu trách nhiệm tính toán tỷ lệ chiết khấu dựa trên số ngày còn lại của hạn sử dụng.*
> 
> *Mô hình này giúp mã nguồn của OmniSalon tuân thủ chặt chẽ các nguyên lý thiết kế hướng đối tượng **SOLID**, giảm tối đa sự phụ thuộc chéo giữa các module."*

---

### SLIDE 13

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Tiếp theo, em xin giới thiệu **Kiến trúc tổng quan hệ thống OmniSalon**.*
> 
> *Hệ thống được thiết kế theo mô hình **Kiến trúc 3 tầng (3-Tier Architecture)** phân tách trách nhiệm rất rõ rệt:*
> - *Ở **Tầng Giao diện (Presentation Layer)**: Web dành cho Khách hàng và Quầy POS Admin được xây dựng dưới dạng ứng dụng đơn trang **Vanilla JS ES6+ SPA**. Ứng dụng di động được phát triển Native bằng **Google Flutter 3**.*
> - *Ở **Tầng Nghiệp vụ (Application Layer)**: Máy chủ **Node.js REST API** đóng vai trò điều phối trung tâm, kiểm soát bảo mật xác thực Token **JWT**, phân quyền vai trò **RBAC**, đồng thời tích hợp các dịch vụ thông minh gồm: Trí tuệ nhân tạo **Gemini Vision AI** để mô phỏng kiểu tóc, dịch vụ gửi mã xác thực **OTP qua Gmail SMTP**, và cổng thanh toán tự động **VietQR Napas 247**.*
> - *Ở **Tầng Dữ liệu (Data Layer)**: CSDL quan hệ **Microsoft SQL Server** chứa toàn bộ 29 bảng chuẩn 3NF, được liên kết trực tiếp với Node.js qua thư viện kết nối cấp thấp `msnodesqlv8` và driver ODBC chính thống.*
> 
> *Kiến trúc này đảm bảo 3 tiêu chí: **Đồng bộ dữ liệu tức thì** giữa Web - App - POS; **Tách biệt hoàn toàn giao diện và xử lý**; và **Đảm bảo tính toàn vẹn dữ liệu**.*
> 
> *Sau đây, em xin kính mời bạn **Lê Hữu Luân** tiếp tục trình bày chi tiết về Công nghệ triển khai, Cơ sở dữ liệu, các Giải thuật nghiệp vụ cốt lõi và kết quả Kiểm thử hệ thống."*

---

### SLIDE 14

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Kính thưa Quý Thầy Cô trong Hội đồng, em là Lê Hữu Luân. Em xin phép được đại diện nhóm trình bày về Công nghệ triển khai, Cơ sở dữ liệu, các Giải thuật nghiệp vụ và công tác Kiểm thử của hệ thống.*
> 
> *Về ngăn xếp công nghệ (Tech Stack), nhóm đã cân nhắc kỹ lưỡng để đạt được hiệu năng tối ưu nhất:*
> - *Đối với nền tảng Web: Thay vì sử dụng các framework nặng nề có chi phí Virtual DOM lớn, nhóm quyết định lựa chọn **Vanilla JS ES6+ Modules kết hợp SPA Hash Router**. Nhờ vậy, dung lượng tải trang ban đầu cực kỳ nhẹ, thời gian chuyển đổi giữa các màn hình đạt dưới **250ms**, phản hồi gần như tức thì tại quầy POS.*
> - *Đối với ứng dụng di động: Lựa chọn **Google Flutter 3** giúp nhóm duy trì duy nhất một codebase nhưng biên dịch mã máy ra cả hai hệ điều hành **Android và iOS**, đảm bảo trải nghiệm vuốt chạm đạt tốc độ khung hình chuẩn **60 FPS** mượt mà.*
> - *Đối với Backend: Nền tảng **Node.js** với cơ chế xử lý bất đồng bộ Event Loop Non-blocking I/O đáp ứng hoàn hảo hàng trăm yêu cầu đặt chỗ và thanh toán đồng thời.*
> - *Và **Microsoft SQL Server** là hệ quản trị CSDL quan hệ chuẩn doanh nghiệp, cho phép viết các Stored Procedure và Trigger phức tạp để xử lý giao dịch an toàn tuyệt đối."*

---

### SLIDE 15

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Về cơ sở dữ liệu `QL_SALON`, nhóm đã thiết kế gồm **29 bảng quan hệ**, tất cả đều đạt **Dạng chuẩn 3 (3NF)**, không chứa thuộc tính đa trị hay phụ thuộc hàm bắc cầu.*
> 
> *CSDL được phân bổ khoa học thành **5 cụm phân hệ bảng** cốt lõi:*
> 1. *Cụm Tổ chức & Nhân sự: Quản lý chi nhánh, nhân sự, lịch phân ca và tài khoản đăng nhập.*
> 2. *Cụm Khách hàng & Xác thực: Quản lý hồ sơ khách, lịch sử tương tác, đánh giá và mã xác thực OTP.*
> 3. *Cụm Dịch vụ & Khuyến mãi: Định nghĩa bảng giá từng dịch vụ lẻ, các gói combo và voucher giảm giá.*
> 4. *Cụm Kho mỹ phẩm FEFO: Quản lý danh mục sản phẩm, phiếu nhập kho, theo dõi số lượng tồn kho theo từng mã lô và quy tắc tính giá theo HSD.*
> 5. *Cụm Giao dịch tài chính: Quản lý lịch hẹn, đơn bán hàng, hóa đơn dịch vụ và nhật ký thanh toán.*
> 
> *Dữ liệu khởi tạo của hệ thống đáp ứng quy mô hoạt động thực tế với 20 chi nhánh salon, hơn 130 mặt hàng mỹ phẩm và hơn 2.600 mã lô sản phẩm lưu kho."*

---

### SLIDE 16

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Trên màn hình là **Lược đồ quan hệ thực thể (ERD)** chi tiết của hệ thống.*
> 
> *Các bảng được ràng buộc chặt chẽ thông qua các cặp Khóa chính (Primary Key) - Khóa ngoại (Foreign Key) và quy tắc toàn vẹn tham chiếu `ON UPDATE CASCADE / ON DELETE NO ACTION`. Các ràng buộc `CHECK CONSTRAINT` được cài đặt trực tiếp trên SQL Server để kiểm tra dữ liệu đầu vào như: Giá trị tiền không âm, Giờ kết thúc phải lớn hơn Giờ bắt đầu ca hẹn, và Trạng thái đơn hàng chỉ nhận các giá trị hợp lệ."*

---

### SLIDE 17

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Bây giờ, em xin trình bày về **Giải thuật then chốt thứ nhất: Giải thuật chống trùng lịch hẹn (Anti-Overbooking Algorithm)**.*
> 
> *Quy trình đặt lịch của khách gồm 4 bước trực quan: Chọn chi nhánh, Chọn dịch vụ, Chọn thợ và Chọn khung giờ. Để đảm bảo **tuyệt đối không bao giờ xảy ra tình trạng trùng ca**, nhóm áp dụng phối hợp **3 giải pháp kỹ thuật** liên hoàn:*
> 
> - *Thứ nhất là **Cơ chế tính toán tổng thời lượng dịch vụ động**: Hệ thống chia ngày làm việc thành các khung giờ chuẩn 60 phút từ 08:30 đến 20:30. Khi khách chọn nhiều dịch vụ (ví dụ vừa Cắt tóc 30 phút, vừa Uốn tóc 60 phút - tổng cộng 90 phút), thuật toán trên Backend sẽ tự động tính toán và **khóa liên tiếp 2 khung giờ kế tiếp** trên lịch của thợ đó.*
> - *Thứ hai là **Cơ chế tự động cân bằng tải thợ rảnh**: Nếu khách chọn chế độ 'Salon tự chọn thợ', thuật toán sẽ quét toàn bộ danh sách thợ có ca trực tại chi nhánh đó trong ngày và gán cho thợ đang có ít lượt khách nhất trong khung giờ đó.*
> - *Và giải pháp kỹ thuật quan trọng nhất là **Kiểm soát đồng thời (Concurrency Control)**: Để xử lý triệt để bài toán **Race Condition** — khi hai khách hàng cùng lúc bấm đặt một thợ vào cùng một giây — hệ thống sử dụng **Transaction mức Serializable kết hợp khóa dòng (Row-level Lock)** trên SQL Server. Khách hàng gửi yêu cầu trước sẽ giữ khóa và tạo lịch thành công, giao dịch thứ hai ngay lập tức nhận thông báo khung giờ vừa được đặt và tự động cập nhật lại danh sách giờ trống, loại bỏ 100% rủi ro trùng lịch."*

---

### SLIDE 18

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Tiếp theo là **Giải thuật nghiệp vụ số 02 và 03**: Quản lý kho FEFO và Hóa đơn POS thông minh:*
> 
> *Về **Thuật toán kho FEFO (First Expired, First Out - Hết hạn trước, Xuất trước)**: Khác với các phần mềm bán hàng thông thường chỉ trừ kho theo số lượng tổng, OmniSalon quản lý tồn kho chi tiết đến từng mã lô nhập.*
> - *Khi xuất bán hoặc xuất dùng, thuật toán tự động sắp xếp theo thứ tự `NgayHetHan ASC` để ưu tiên xuất lô cận hạn nhất.*
> - *Đặc biệt, hệ thống tích hợp **Cơ chế định giá tự động theo hạn sử dụng** gồm 4 nấc thang:*
>   + *Lô còn hạn trên 90 ngày: Bán nguyên giá gốc.*
>   + *Lô còn từ 31 đến 90 ngày: Tự động giảm giá 15% để kích cầu.*
>   + *Lô cận hạn từ 1 đến 30 ngày: Hệ thống đưa vào danh mục Flash Sale giảm sâu 70% nhằm thu hồi vốn nhanh chóng.*
>   + *Và ngay khi lô chạm mốc 0 ngày hoặc quá hạn: Hệ thống lập tức kích hoạt cờ khóa, cấm tuyệt đối việc xuất bán để bảo vệ an toàn cho khách hàng.*
> 
> *Về **Nghiệp vụ Hóa đơn POS gộp và Tính hoa hồng thợ**:*
> - *Quầy POS cho phép tính chung tiền dịch vụ làm tóc và mỹ phẩm khách mua mang về trên cùng 1 hóa đơn.*
> - *Hệ thống tự động sinh mã VietQR chuẩn EMVCo động chứa chính xác số tiền cần thu.*
> - *Và ngay khoảnh khắc hóa đơn được xác nhận thanh toán thành công, hệ thống tự động bóc tách doanh số dịch vụ và **tính ngay 15% hoa hồng** vào tài khoản của thợ phụ trách, loại bỏ hoàn toàn việc tính toán thủ công bằng sổ sách cuối tháng."*

---

### SLIDE 19

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Chuyển sang **Phần 4: Kiểm thử hệ thống**, nhóm đã xây dựng bộ kịch bản kiểm thử toàn diện bao phủ toàn bộ **20 Use Cases**:*
> - *Nhóm tiến hành **Kiểm thử đơn vị (Unit Test)** trên các hàm tính toán trọng yếu như: Hàm tính thời lượng ca làm việc, Hàm tính chiết khấu khuyến mãi, Thuật toán phân bổ lô hàng FEFO và Logic kiểm tra khung giờ trống.*
> - *Tiến hành **Kiểm thử tích hợp (Integration Test)** xuyên suốt luồng: Giao diện người dùng ➔ REST API Node.js ➔ Cơ sở dữ liệu SQL Server.*
> - *Đặc biệt, nhóm đã tập trung kiểm thử các **trường hợp biên (Boundary Cases) và ngoại lệ (Exceptions)** như: Hai khách đặt cùng 1 giây, Hủy lịch hẹn sát giờ, Khách vãng lai không có số điện thoại, và Nhập số lượng mua vượt quá tồn kho khả dụng.*
> 
> *Kết quả kiểm thử cho thấy 100% các ca kiểm thử đều đạt yêu cầu, dữ liệu được rollback an toàn khi phát sinh lỗi ngoại lệ."*

---

### SLIDE 20

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Bên cạnh tính đúng đắn của chức năng, nhóm đặc biệt chú trọng đến **Hiệu năng và Trải nghiệm người dùng (UI/UX)**:*
> - *Về **Tốc độ phản hồi Web**: Nhờ loại bỏ các thư viện cồng kềnh và áp dụng kiến trúc Single Page Application thuần túy, thời gian phản hồi giữa các tác vụ chỉ dưới **250 mili-giây**, giúp thao tác thu ngân tại quầy diễn ra trơn tru mà không có độ trễ.*
> - *Về **Độ mượt mà trên Mobile**: Ứng dụng Flutter chạy ổn định ở tần số quét chuẩn **60 khung hình/giây (60 FPS)**. Các thao tác cuộn danh sách dịch vụ, lướt xem hàng trăm sản phẩm mỹ phẩm đều rất mượt mà, không xảy ra hiện tượng giật khung hình.*
> - *Về **Khả năng tiếp cận thị giác**: Toàn bộ bảng màu giao diện của OmniSalon được thiết kế đạt chuẩn quốc tế **WCAG AAA**, với tỷ lệ tương phản chữ lên tới **14.5 trên 1** (vượt xa chuẩn thông thường 7:1), hỗ trợ chuyển đổi mượt mà giữa chế độ Sáng và Tối (Dark/Light Mode), giúp nhân viên thu ngân không bị mỏi mắt khi làm việc liên tục cả ngày."*

---

### SLIDE 21

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Đối với một hệ thống quản lý có thanh toán và dữ liệu khách hàng, **Bảo mật là yếu tố sống còn**. OmniSalon được trang bị **4 lớp phòng vệ vững chắc**:*
> 1. *Thứ nhất là **Ngăn chặn triệt để SQL Injection**: Toàn bộ các câu truy vấn từ Node.js xuống SQL Server đều sử dụng cơ chế Parameterized Query có tham số hóa chặt chẽ, triệt tiêu hoàn toàn nguy cơ chèn mã độc qua ô tìm kiếm hay form đăng nhập.*
> 2. *Thứ hai là **Cơ chế xác thực JWT và Phân quyền theo vai trò (RBAC)**: Mỗi yêu cầu API đều được kiểm tra chữ ký số Bearer Token. Hệ thống phân tách rõ 6 vai trò: Khách hàng, Thợ cắt tóc, Thợ phụ, Lễ tân, Quản lý chi nhánh và Quản trị viên tối cao. Mọi hành vi truy cập vượt quyền đều bị chặn đứng với mã lỗi `403 Forbidden`.*
> 3. *Thứ ba là **Cơ chế Rate Limiting chống spam OTP**: Nhóm thiết lập hàng rào ngăn chặn gửi mã OTP liên tục qua Email với khoảng cách tối thiểu 30 giây giữa hai lần yêu cầu, tự động trả về lỗi `429 Too Many Requests` nếu phát hiện hành vi tấn công từ chối dịch vụ.*
> 4. *Và thứ tư là **Hệ thống Kiểm toán Audit Log tự động**: Mọi hành vi nhạy cảm trong hệ thống như đăng nhập, thay đổi bảng giá, cập nhật trạng thái đơn, thu tiền POS hay điều chỉnh tồn kho đều được ghi nhận chi tiết vào bảng nhật ký kiểm toán kèm định danh người thực hiện, địa chỉ IP và dấu thời gian, phục vụ đắc lực cho công tác hậu kiểm."*

---

### SLIDE 22

> **🗣️ LỜI THOẠI BÁO CÁO:**
> 
> *"Kính thưa Quý Thầy Cô trong Hội đồng, sau quá trình nghiên cứu và phát triển nghiêm túc, nhóm chúng em xin được đúc kết lại các nội dung chính của đề tài:*
> 
> *Về **Kết quả đạt được**:*
> - *Nhóm đã hoàn thành trọn vẹn hệ sinh thái **OmniSalon** hoạt động đồng bộ thời gian thực trên cả Web, Ứng dụng di động Flutter và Quầy POS thu ngân.*
> - *Xây dựng Cơ sở dữ liệu SQL Server với 29 bảng chuẩn 3NF, loại bỏ triệt để các bất cập trong quản lý truyền thống.*
> - *Triển khai thành công 3 giải thuật cốt lõi: Chống trùng lịch hẹn, Quản trị kho mỹ phẩm FEFO cận hạn và Tính tiền POS gộp kèm hoa hồng tự động.*
> 
> *Bên cạnh đó, nhóm cũng thẳng thắn nhìn nhận **Một số hạn chế còn tồn tại**:*
> - *Tính năng thử kiểu tóc bằng AI còn phụ thuộc vào đường truyền mạng và dịch vụ bên thứ ba.*
> - *Phương thức thanh toán trực tuyến hiện tại tập trung vào chuyển khoản quét mã VietQR nội địa, chưa mở rộng cho các loại thẻ quốc tế.*
> 
> *Từ những hạn chế đó, **Hướng phát triển tiếp theo của đề tài** sẽ là:*
> - *Nâng cấp mô hình AI phân tích khuôn mặt để tự động đề xuất kiểu tóc và sản phẩm chăm sóc tóc phù hợp nhất với tiền sử tóc của từng khách hàng.*
> - *Xây dựng module phân tích dữ liệu lớn (Big Data) dự báo các khung giờ cao điểm để gợi ý lịch phân ca tối ưu cho chủ salon.*
> - *Tích hợp kênh chăm sóc khách hàng tự động qua Zalo Official Account (ZNS).*
> - *Và kết nối trực tiếp API với các đơn vị vận chuyển như Giao Hàng Nhanh, Giao Hàng Tiết Kiệm để theo dõi lộ trình đơn hàng mỹ phẩm theo thời gian thực.*
> 
> *Sau đây, nhóm chúng em xin phép được chuyển sang phần **Trình diễn Demo trực tiếp hệ thống**."*

---

### SLIDE 23

> **🗣️ LỜI THOẠI CHUYỂN TIẾP SANG DEMO:**
> 
> *"Để minh chứng cho khả năng vận hành thực tế của hệ thống, nhóm chúng em xin phép được trình diễn **Kịch bản Demo trực tiếp** gồm 4 tình huống nghiệp vụ liền mạch ngay sau đây:*
> 
> 1. ***Tình huống 1: Trải nghiệm của Khách hàng***
>    - *Khách truy cập Web/App, sử dụng tính năng AI Hair Studio thử kiểu tóc.*
>    - *Khách chọn cơ sở Quận 1, chọn Combo cắt tóc 60 phút và chọn Stylist Đỗ Đình Đô.*
>    - *Khách chọn khung giờ trống 18:30 và xác nhận đặt lịch.*
> 
> 2. ***Tình huống 2: Tiếp nhận và Điều phối tại Quầy Lễ tân (POS)***
>    - *Ngay lập tức, màn hình POS của Lễ tân nhảy thông báo ca hẹn mới.*
>    - *Lễ tân bấm Check-in tiếp nhận khách, điều phối khách vào Ghế cắt #2.*
>    - *Thợ cắt tóc mở hồ sơ khách trên điện thoại, đọc ghi chú chất tóc cũ và cập nhật tình trạng phục vụ.*
> 
> 3. ***Tình huống 3: Tính tiền POS & Trừ kho FEFO tự động***
>    - *Khách làm xong, mua thêm 1 lọ Sáp vuốt tóc Clay Wax.*
>    - *Lễ tân thêm sản phẩm vào hóa đơn gộp. Hệ thống tự động kích hoạt mã VietQR động.*
>    - *Khách quét mã thanh toán thành công ➔ Hệ thống in hóa đơn, tự động trừ 1 sản phẩm thuộc lô hàng sắp hết hạn nhất (FEFO) và cộng 15% hoa hồng dịch vụ cho thợ.*
> 
> 4. ***Tình huống 4: Báo cáo Quản trị & Nhật ký Kiểm toán (Audit Log)***
>    - *Chuyển sang tài khoản Quản trị viên: Doanh thu vừa phát sinh được cộng dồn theo thời gian thực vào biểu đồ.*
>    - *Mở tab Sự kiện kiểm toán (Audit Log): Hệ thống hiển thị rõ ràng toàn bộ vết giao dịch vừa diễn ra kèm người thao tác và mốc thời gian.*
> 
> *Kính mời Quý Thầy Cô cùng theo dõi màn hình thao tác trực tiếp của nhóm em!"*

---

### SLIDE 24
> **🗣️ LỜI THOẠI KẾT THÚC:**
> 
> *"Kính thưa Quý Thầy Cô trong Hội đồng, phần báo cáo khóa luận tốt nghiệp của nhóm chúng em đến đây là kết thúc.*
> 
> *Chúng em xin gửi lời cảm ơn chân thành và sâu sắc nhất đến Quý Thầy, Quý Cô trong Hội đồng đã dành thời gian quý báu lắng nghe và theo dõi bài thuyết trình của nhóm.*
> 
> *Chúng em rất mong nhận được những lời nhận xét, góp ý quý báu từ Quý Thầy Cô để hệ sinh thái OmniSalon ngày càng hoàn thiện hơn nữa về mặt kỹ thuật cũng như tính thực tiễn.*
> 
> *Sau đây, nhóm chúng em xin sẵn sàng lắng nghe các câu hỏi chất vấn từ Quý Thầy Cô. Chúng em xin trân trọng cảm ơn!"*

---

# 🎯 BỘ CÂU HỎI PHẢN BIỆN DỰ PHÒNG CỦA HỘI ĐỒNG (Q&A DEFENSE PREP)
*(Các câu hỏi Thầy/Cô thường hỏi nhất đối với đề tài này và gợi ý câu trả lời chuẩn xác nhất)*

### Câu hỏi 1: Hệ thống của em xử lý bài toán Trùng lịch (Concurrency / Race Condition) như thế nào nếu 2 khách cùng bấm đặt lịch 1 thợ vào cùng 1 thời điểm?
- **Gợi ý trả lời**:
  > *"Dạ thưa Thầy Cô, nhóm xử lý bài toán này ở cả 2 tầng:*
  > *Ở tầng CSDL SQL Server, nhóm sử dụng **Transaction kết hợp mức cô lập (Isolation Level) và gợi ý khóa dòng `UPDLOCK, HOLDLOCK`** khi kiểm tra lịch trống. Khi yêu cầu thứ nhất đến, dòng dữ liệu ca hẹn của thợ trong khung giờ đó sẽ bị khóa tạm thời. Yêu cầu thứ nhất tạo lịch thành công và commit dữ liệu.*
  > *Khi yêu cầu thứ hai giải phóng chờ, câu truy vấn kiểm tra trùng lịch sẽ thấy khung giờ đó đã có `MaLichHen` tồn tại với trạng thái khác `DA_HUY`, và sẽ trả về lỗi `SLOT_ALREADY_BOOKED` ngay lập tức. Trên giao diện Web và Mobile, hệ thống sẽ bắt lỗi này, hiển thị thông báo khung giờ vừa được khách khác đặt và tự động tải lại danh sách giờ trống để khách chọn giờ khác."*

### Câu hỏi 2: Thuật toán xuất kho FEFO và cơ chế giảm giá cận hạn được cài đặt ở tầng nào?
- **Gợi ý trả lời**:
  > *"Dạ thưa Thầy Cô, nghiệp vụ FEFO được nhóm hiện thực trực tiếp tại **Tầng CSDL bằng Stored Procedure và Trigger** nhằm đảm bảo tính toàn vẹn dữ liệu:*
  > *Mỗi sản phẩm trong bảng `TonKho` đều gắn liền với `MaChiTietPhieuNhap` chứa `NgayHetHan` và `SoLuongTon`. Khi quầy POS chốt đơn, Stored Procedure xuất kho sẽ thực hiện câu lệnh `SELECT ... ORDER BY NgayHetHan ASC` để lấy ra danh sách các lô còn hạn sử dụng gần nhất và trừ dần số lượng.*
  > *Về bảng giá cận hạn: Nhóm xây dựng bảng `QuyTacGiamGiaTheoHSD` với các mốc ngày (DATEDIFF(day, GETDATE(), NgayHetHan)). View tổng hợp giá sản phẩm sẽ tự động tính toán giá bán cuối cùng (GiaBan * (1 - PhanTramGiam/100)) dựa trên số ngày còn lại của từng lô hàng, hoàn toàn tự động mà không cần nhân viên phải chỉnh giá thủ công."*

### Câu hỏi 3: Tại sao nhóm lại chọn Vanilla JS thuần cho phía Web mà không dùng các framework phổ biến như React hay Vue?
- **Gợi ý trả lời**:
  > *"Dạ thưa Thầy Cô, nhóm lựa chọn Vanilla JS ES6+ Modules xuất phát từ đặc thù nghiệp vụ của Salon:*
  > *Tại quầy POS thu ngân, các máy tính ở tiệm thường có cấu hình trung bình và cần phản hồi cực kỳ nhanh khi khách đứng chờ thanh toán. Việc dùng Vanilla JS giúp loại bỏ hoàn toàn gánh nặng bundle size nặng nề và chi phí ảo hóa DOM của Virtual DOM trong React.*
  > *Nhóm tự xây dựng một mô hình kiến trúc State Management tập trung (`store.js`) và cơ chế Client-side Routing tương tự các framework hiện đại nhưng đạt tốc độ tải trang dưới 250ms và kiểm soát toàn bộ vòng đời ứng dụng một cách tối ưu nhất."*

### Câu hỏi 4: Cơ chế thanh toán VietQR trong hệ thống là tự động kiểm tra hay lễ tân phải nhìn điện thoại xác nhận?
- **Gợi ý trả lời**:
  > *"Dạ thưa Thầy Cô, hệ thống hỗ trợ cả 2 chế độ:*
  > *1. Cơ chế bán tự động: Mã VietQR được sinh động chuẩn EMVCo chứa đúng số tiền và nội dung chuyển khoản là mã hóa đơn duy nhất (ví dụ `THANHTOAN DH22` hoặc `THANHTOAN LH15`). Khi khách quét và chuyển khoản, lễ tân đối soát nhanh trên thông báo biến động số dư và ấn nút 'Xác nhận thanh toán' tại quầy POS.*
  > *2. Cơ chế Webhook tự động: Backend đã xây dựng sẵn endpoint `/api/payment/payos-webhook` và `/webhook/bank-transfer`. Khi tài khoản ngân hàng nhận tiền có nội dung khớp với mã hóa đơn, ngân hàng bắn webhook về máy chủ Node.js, hệ thống sẽ tự động chuyển trạng thái đơn hàng sang 'ĐÃ THANH TOÁN' trong SQL Server mà không cần can thiệp thủ công."*

### Câu hỏi 5: CSDL 29 bảng của nhóm đạt chuẩn 3NF như thế nào? Có trường hợp nào chấp nhận phi chuẩn hóa (Denormalization) không?
- **Gợi ý trả lời**:
  > *"Dạ thưa Thầy Cô, 29 bảng của nhóm đều đạt chuẩn 3NF: Đạt 1NF vì các thuộc tính đều là đơn trị, có khóa chính xác định; Đạt 2NF vì toàn bộ thuộc tính không khóa đều phụ thuộc hoàn toàn vào khóa chính; và Đạt 3NF vì không có thuộc tính nào phụ thuộc bắc cầu vào khóa chính.*
  > *Nhóm có áp dụng một điểm 'phi chuẩn hóa có kiểm soát' ở trường `TongTien` trong bảng `HoaDon` và `DonHang` để tăng tốc độ truy vấn báo cáo tài chính thay vì mỗi lần đọc phải SUM lại từ bảng chi tiết. Tính nhất quán của trường này được bảo vệ tuyệt đối bằng Trigger và Transaction khi thêm/sửa chi tiết hóa đơn."*

---

### 💡 LỜI KHUYÊN DÀNH CHO CẢ NHÓM KHI ĐỨNG TRƯỚC HỘI ĐỒNG:
1. **Phong thái**: Luôn đứng thẳng, hai tay thả lỏng tự nhiên hoặc đan nhẹ phía trước, không khoanh tay, không đút tay túi quần.
2. **Giao tiếp ánh mắt (Eye Contact)**: Luôn nhìn về phía các Thầy Cô trong Hội đồng (đặc biệt là Chủ tịch hội đồng và Giảng viên phản biện), không chỉ chăm chú nhìn vào màn hình máy tính hay màn chiếu.
3. **Giọng nói**: To, rõ ràng, dứt khoát, ngắt nghỉ đúng chỗ, nhấn mạnh các con số kỹ thuật (29 bảng 3NF, 60 khung hình/giây, 250ms, 15% hoa hồng, 4 nấc thang FEFO).
4. **Phối hợp nhóm**: Khi một bạn đang nói, hai bạn còn lại đứng nghiêm túc lắng nghe, sẵn sàng hỗ trợ chuyển slide hoặc ghi chép câu hỏi của Hội đồng ra sổ tay.
5. **Trả lời câu hỏi**: Luôn mở đầu bằng: *"Dạ, em xin cảm ơn câu hỏi rất hay của Thầy/Cô ạ..."*, nếu chưa rõ câu hỏi thì lịch sự xin phép Thầy/Cô làm rõ câu hỏi, tuyệt đối không tranh cãi gay gắt với Hội đồng mà tiếp thu trên tinh thần khoa học cầu tiến.
