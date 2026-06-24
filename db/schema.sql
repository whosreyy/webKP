-- Database: erablue_pos
CREATE DATABASE IF NOT EXISTS erablue_pos;
USE erablue_pos;

-- 1. Tabel Users (RBAC)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'cashier') DEFAULT 'cashier',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- 3. Tabel Products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category_id INT,
  stock INT DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL,
  image_path VARCHAR(255) DEFAULT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 4. Tabel Shifts (Rekonsiliasi Kas)
CREATE TABLE IF NOT EXISTS shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP DEFAULT NULL,
  initial_cash DECIMAL(10, 2) NOT NULL,
  expected_cash DECIMAL(10, 2) DEFAULT 0,
  actual_cash DECIMAL(10, 2) DEFAULT 0,
  difference_amount DECIMAL(10, 2) DEFAULT 0,
  status ENUM('active', 'closed') DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 5. Tabel Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'qris', 'transfer') DEFAULT 'cash',
  amount_paid DECIMAL(10, 2) NOT NULL,
  change_amount DECIMAL(10, 2) NOT NULL,
  shift_id INT,
  status ENUM('completed', 'pending') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

-- 6. Tabel Transaction Details
CREATE TABLE IF NOT EXISTS transaction_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT,
  product_id INT,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 7. Tabel Settings
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY,
  store_name VARCHAR(100) NOT NULL,
  store_address TEXT,
  store_phone VARCHAR(20),
  receipt_footer TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Data Awal (Opsional)
INSERT INTO users (username, password, name, role) VALUES 
('admin', '$2b$10$Xm5M6Zq.N7O8/Vw0R1mO/er8T7U5W6D39L/t1Jv9YmUv.hWvK1R2q', 'Administrator', 'admin'),
('depsi', '$2b$10$Xm5M6Zq.N7O8/Vw0R1mO/er8T7U5W6D39L/t1Jv9YmUv.hWvK1R2q', 'Depsi', 'cashier'),
('abidah', '$2b$10$Xm5M6Zq.N7O8/Vw0R1mO/er8T7U5W6D39L/t1Jv9YmUv.hWvK1R2q', 'Abidah', 'cashier'),
('ariansyah', '$2b$10$Xm5M6Zq.N7O8/Vw0R1mO/er8T7U5W6D39L/t1Jv9YmUv.hWvK1R2q', 'Ariansyah', 'cashier');

INSERT INTO categories (name) VALUES ('Elektronik'), ('Aksesoris'), ('Umum');

INSERT INTO settings (id, store_name, store_address, store_phone, receipt_footer) VALUES 
(1, 'ERABLUE POS', 'Jl. Raya No. 123, Indonesia', '08123456789', 'Terima Kasih Telah Berbelanja!');
