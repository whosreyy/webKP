import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import open from 'open';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads/products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Connection ---
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'maulana17',
  database: process.env.DB_NAME || 'db_pos',
};

let db;
async function connectDB() {
  try {
    db = await mysql.createPool(dbConfig);
    console.log('Connected to MySQL Database');
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}
connectDB();

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET || 'harvist_pos_secret_key_2026', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

// --- Multer Storage ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads/products');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.get('/api/reports/shifts', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT s.*, u.name as cashier_name, 
      (SELECT SUM(total_price) FROM transactions WHERE shift_id = s.id AND status = 'completed') as total_sales
      FROM shifts s 
      JOIN users u ON s.user_id = u.id 
      ORDER BY s.start_time DESC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/reports/shifts/:id', authenticateToken, async (req, res) => {
  try {
    const [transactions] = await db.query(
      'SELECT * FROM transactions WHERE shift_id = ? AND status = "completed" ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Auth Endpoints ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = ?',
      [username]
    );

    if (rows.length === 0) return res.status(401).json({ message: 'User not found' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'harvist_pos_secret_key_2026',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- User Management (Admin Only) ---
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT u.id, u.username, u.name, r.name as role FROM users u JOIN roles r ON u.role_id = r.id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Product Endpoints ---
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.name ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/products', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  const { code, name, category_id, stock, price, description } = req.body;
  const image_path = req.file ? `/uploads/products/${req.file.filename}` : null;
  try {
    const [result] = await db.query(
      'INSERT INTO products (code, name, category_id, stock, price, description, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code, name, category_id, stock, price, description, image_path]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/products/:id/stock', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { additional_stock } = req.body;
  try {
    await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [additional_stock, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/products/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { code, name, category_id, stock, price, description } = req.body;
  const image_path = req.file ? `/uploads/products/${req.file.filename}` : undefined;
  try {
    let query = 'UPDATE products SET code=?, name=?, category_id=?, stock=?, price=?, description=?';
    let params = [code, name, category_id, stock, price, description];
    if (image_path) {
      query += ', image_path=?';
      params.push(image_path);
    }
    query += ' WHERE id=?';
    params.push(id);
    await db.query(query, params);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.get('/api/shifts/active', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM shifts WHERE user_id = ? AND status = "active"', [req.user.id]);
    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/shifts/start', authenticateToken, async (req, res) => {
  const { initial_cash } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO shifts (user_id, initial_cash) VALUES (?, ?)',
      [req.user.id, initial_cash]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/shifts/summary/:id', authenticateToken, async (req, res) => {
  try {
    const [shift] = await db.query('SELECT initial_cash FROM shifts WHERE id = ?', [req.params.id]);
    const [sales] = await db.query(
      'SELECT SUM(total_price) as total_cash_sales FROM transactions WHERE shift_id = ? AND status = "completed" AND payment_method = "cash"',
      [req.params.id]
    );
    res.json({
      initial_cash: Number(shift[0].initial_cash),
      total_cash_sales: Number(sales[0].total_cash_sales || 0)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/shifts/end/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { actual_cash } = req.body;
  console.log('Ending Shift ID:', id, 'Actual Cash:', actual_cash);
  
  try {
    const [shiftInfo] = await db.query('SELECT initial_cash FROM shifts WHERE id = ?', [id]);
    if (!shiftInfo || shiftInfo.length === 0) {
      console.error('Shift not found for ID:', id);
      return res.status(404).json({ message: "Shift tidak ditemukan" });
    }
    const initialCash = Number(shiftInfo[0].initial_cash || 0);

    const [sales] = await db.query(
      'SELECT SUM(total_price) as total_cash FROM transactions WHERE shift_id = ? AND status = "completed" AND payment_method = "cash"',
      [id]
    );
    const totalCashSales = Number(sales[0].total_cash || 0);
    const expectedCash = initialCash + totalCashSales;
    const actualCashValue = Number(actual_cash || 0);
    const difference = actualCashValue - expectedCash;

    console.log('Summary - Initial:', initialCash, 'Sales:', totalCashSales, 'Expected:', expectedCash, 'Actual:', actualCashValue);

    await db.query(`
      UPDATE shifts 
      SET 
        end_time = CURRENT_TIMESTAMP, 
        expected_cash = ?, 
        actual_cash = ?, 
        difference_amount = ?, 
        status = "closed" 
      WHERE id = ?
    `, [expectedCash, actualCashValue, difference, id]);

    res.json({ success: true, difference });
  } catch (error) {
    console.error('SERVER ERROR (END SHIFT):', error);
    res.status(500).json({ message: error.message });
  }
});

// --- Transaction Endpoints ---
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { invoice_number, items, total_price, payment_method, amount_paid, change_amount, shift_id, status } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [tResult] = await connection.query(
      'INSERT INTO transactions (invoice_number, user_id, shift_id, total_price, payment_method, amount_paid, change_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [invoice_number, req.user.id, shift_id, total_price, payment_method, amount_paid, change_amount, status || 'completed']
    );
    const transactionId = tResult.insertId;

    for (const item of items) {
      await connection.query(
        'INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)',
        [transactionId, item.id, item.quantity, item.price]
      );
      if (status !== 'pending') {
        await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
      }
    }

    await connection.commit();
    res.json({ success: true, transactionId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

app.get('/api/transactions/pending', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, GROUP_CONCAT(p.name, ' (', ti.quantity, ')') as items_summary 
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      WHERE t.status = "pending" AND t.user_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/transactions/:id/details', authenticateToken, async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT p.id, p.name, p.price, ti.quantity 
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      WHERE ti.transaction_id = ?
    `, [req.params.id]);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Settings & Reports ---
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM settings LIMIT 1');
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/reports/shifts', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT s.*, u.name as cashier_name 
      FROM shifts s 
      JOIN users u ON s.user_id = u.id 
    `;
    if (req.user.role !== 'admin') {
      query += ` WHERE s.user_id = ${req.user.id}`;
    }
    query += ' ORDER BY s.start_time DESC';
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/reports/transactions', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT t.*, u.name as cashier_name 
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
    `;
    if (req.user.role !== 'admin') {
      query += ` WHERE t.user_id = ${req.user.id}`;
    }
    query += ' ORDER BY t.created_at DESC';
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/dashboard/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [salesToday] = await db.query('SELECT SUM(total_price) as total FROM transactions WHERE DATE(created_at) = CURDATE() AND status = "completed"');
    const [transToday] = await db.query('SELECT COUNT(*) as total FROM transactions WHERE DATE(created_at) = CURDATE() AND status = "completed"');
    const [lowStock] = await db.query('SELECT * FROM products WHERE stock <= 5');
    const [activeCashiers] = await db.query('SELECT u.name FROM shifts s JOIN users u ON s.user_id = u.id WHERE s.status = "active"');
    
    res.json({
      salesToday: salesToday[0].total || 0,
      transToday: transToday[0].total || 0,
      lowStock,
      activeCashiers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  const url = `http://localhost:${PORT}`;
  console.log(`API Server running at ${url}`);
  try {
    await open('http://localhost:5173');
  } catch (error) {
    console.log('Browser opening handled by frontend server dev tools');
  }
});
