-- ============================================================================
-- CƠ SỞ DỮ LIỆU CHUỖI HỆ THỐNG SALON / BARBERSHOP (OMNISALON / 4RAU SUITE)
-- Tương thích: MySQL 8.0+, MariaDB 10.4+, PostgreSQL 14+, SQLite, Supabase
-- ============================================================================

CREATE DATABASE IF NOT EXISTS omnisalon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE omnisalon_db;

-- ----------------------------------------------------------------------------
-- 1. BẢNG CHI NHÁNH (BRANCHES - CHUỖI HỆ THỐNG TOÀN QUỐC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    branch_group VARCHAR(100) NOT NULL DEFAULT '4RAU BARBER CUTCLUB', -- CutClub hoặc Tiệm Tóc Chủ Tịch
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    hours VARCHAR(100) NOT NULL DEFAULT '08:30 - 21:00',
    total_chairs INT DEFAULT 12,
    image_url TEXT,
    manager_name VARCHAR(150),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 2. BẢNG THỢ CẮT TÓC (STYLISTS & BARBERS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stylists (
    id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    title VARCHAR(100) DEFAULT 'Senior Barber',
    avatar_url TEXT,
    rating DECIMAL(2,1) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    experience_years INT DEFAULT 3,
    bio TEXT,
    is_available TINYINT(1) DEFAULT 1,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3. BẢNG DANH MỤC DỊCH VỤ (SERVICES)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Haircut',
    price DECIMAL(12,2) NOT NULL,
    duration_minutes INT DEFAULT 45,
    description TEXT,
    image_url TEXT,
    is_popular TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 4. BẢNG LỊCH HẸN ĐẶT TRƯỚC (BOOKINGS - CHỐNG TRÙNG GIỜ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL,
    stylist_id VARCHAR(50),
    service_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_email VARCHAR(150),
    booking_date DATE NOT NULL,
    booking_time VARCHAR(20) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Confirmed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 5. BẢNG SẢN PHẨM & KHO HÀNG (PRODUCTS & INVENTORY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Pomade',
    brand VARCHAR(100) DEFAULT 'BROSH POMADE JAPAN',
    price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    stock_quantity INT DEFAULT 50,
    image_url TEXT,
    description TEXT,
    badge VARCHAR(50) DEFAULT 'NEW',
    is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 6. BẢNG ĐƠN HÀNG (ORDERS & POS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    shipping_address TEXT,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'COD',
    payment_status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    order_status ENUM('Pending', 'Processing', 'Shipping', 'Completed', 'Cancelled') DEFAULT 'Processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 7. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER_ITEMS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 8. BẢNG TÀI KHOẢN NGƯỜI DÙNG & QUẢN TRỊ (USERS & ROLES)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    role ENUM('SuperAdmin', 'BranchManager', 'Stylist', 'Customer') DEFAULT 'Customer',
    assigned_branch_id VARCHAR(50),
    reward_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_branch_id) REFERENCES branches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 9. BẢNG LỊCH SỬ BIẾN ĐỔI ẢNH TÓC BẰNG AI (AI_TRANSFORMATIONS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_transformations (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    original_image_url TEXT NOT NULL,
    result_image_url TEXT NOT NULL,
    selected_hairstyle VARCHAR(150) NOT NULL,
    selected_color VARCHAR(100),
    prompt_used TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- DỮ LIỆU MẪU (SEED DATA SẴN SÀNG SỬ DỤNG)
-- ============================================================================

INSERT INTO branches (id, branch_group, name, address, phone, hours, total_chairs, manager_name) VALUES
('br-nb', '4RAU BARBER CUTCLUB', '4RAU CUTCLUB NHÀ BÈ — CẮT TÓC NAM SUNRISE RIVERSIDE', 'Tháp G Sunrise Riverside, Nguyễn Hữu Thọ, Phước Kiển, Nhà Bè, TP.HCM', '1900 4407 (Phím 1)', '08:30 - 21:00', 14, 'Trần Văn Hoàng'),
('br-q5', '4RAU BARBER CUTCLUB', '4RAU CUTCLUB QUẬN 5 — CẮT TÓC NAM CHỢ LỚN', '286 An Dương Vương, Phường 4, Quận 5, TP.HCM', '1900 4407 (Phím 2)', '08:30 - 21:00', 16, 'Nguyễn Thành Nam'),
('br-btan', '4RAU BARBER CUTCLUB', '4RAU CUTCLUB BÌNH TÂN — CẮT TÓC NAM PRIVIA KHANG ĐIỀN', '158 An Dương Vương, An Lạc, Bình Tân, TP.HCM', '1900 4407 (Phím 3)', '08:30 - 21:00', 12, 'Lê Quốc Đạt'),
('br-dbp', 'TIỆM TÓC CỦA CHỦ TỊCH', '4RAU DELUXE ĐIỆN BIÊN PHỦ — FLAGSHIP HEADQUARTERS', '77 Điện Biên Phủ, Phường Đa Kao, Quận 1, TP.HCM', '1900 4407 (Phím 0)', '08:00 - 22:00', 20, 'Master Barber Hà Hiền')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO services (id, name, category, price, duration_minutes, description, is_popular) VALUES
('srv-1', 'Cắt Tóc VIP 10 Bước Chuẩn Barbershop', 'Haircut', 120000, 45, 'Tư vấn dáng mặt, xả tóc, cắt form, cạo viền sắc nét, cạo mặt khăn nóng, sấy tạo kiểu', 1),
('srv-2', 'Uốn Tóc Hot Trend Con Sâu / Texture', 'Perm', 350000, 90, 'Uốn sóng bồng bềnh, uốn con sâu cá tính, giữ nếp lâu không hại tóc', 1),
('srv-3', 'Ép Side Tóc 2 Bên (Down Perm)', 'Perm', 200000, 45, 'Ép ôm sát chân tóc hai bên mai và gáy, khắc phục tóc chỉa ngang', 1),
('srv-4', 'Nhuộm Tóc Khói / Tẩy Màu Thời Thượng', 'Color', 450000, 120, 'Nhuộm tông khói xám bạc, nâu tây lạnh, phủ bóng phục hồi Keratin', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);
