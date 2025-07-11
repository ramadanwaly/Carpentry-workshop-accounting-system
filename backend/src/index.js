// استيراد الحزم المطلوبة
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// إعداد مجلد رفع الملفات
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// إنشاء تطبيق Express
const app = express();
const PORT = 3001;

// تفعيل CORS وقراءة JSON
app.use(cors());
app.use(express.json());

// تقديم الملفات المرفوعة عبر static
app.use('/uploads', express.static(uploadDir));

// إنشاء أو فتح قاعدة البيانات
const dbPath = path.join(__dirname, '../database/workshop.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('خطأ في فتح قاعدة البيانات:', err.message);
  } else {
    console.log('تم فتح قاعدة البيانات بنجاح');
  }
});

// إنشاء الجداول إذا لم تكن موجودة
db.serialize(() => {
  // جدول المستخدمين
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT
    )
  `);

  // جدول العملاء
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      total_paid REAL DEFAULT 0,
      total_due REAL DEFAULT 0
    )
  `);

  // جدول المبيعات
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      order_type TEXT,
      date TEXT,
      amount_paid REAL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // جدول المصروفات
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      date TEXT,
      amount REAL,
      customer_id INTEGER
    )
  `);

  // جدول المخزون
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_name TEXT,
      quantity REAL,
      unit_price REAL,
      threshold REAL
    )
  `);

  // جدول الطلبات
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      order_type TEXT,
      date TEXT,
      total_amount REAL,
      amount_paid REAL,
      status TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // جدول مواد الطلب
  db.run(`
    CREATE TABLE IF NOT EXISTS order_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      material_id INTEGER,
      quantity_used REAL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (material_id) REFERENCES inventory(id)
    )
  `);

  // جدول سحب المخزون
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      material_id INTEGER,
      quantity REAL,
      date TEXT,
      note TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (material_id) REFERENCES inventory(id)
    )
  `);

  // جدول الإيرادات
  db.run(`
    CREATE TABLE IF NOT EXISTS incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      source_type TEXT NOT NULL, -- مالك، عميل، آخر
      customer_id INTEGER, -- اختياري إذا كان المصدر عميل
      date TEXT NOT NULL,
      payment_method TEXT, -- نقدي، تحويل بنكي، شيك، ...
      receipt_number TEXT, -- رقم الإيصال (اختياري)
      note TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  console.log('تم إنشاء الجداول (إذا لم تكن موجودة) بنجاح');
});

// إضافة عملية بيع جديدة
app.post('/api/sales', (req, res) => {
  const { customer_id, order_type, date, amount_paid } = req.body;
  if (!customer_id || !order_type || !date || !amount_paid) {
    return res.status(400).json({ message: 'يرجى إدخال جميع البيانات المطلوبة.' });
  }
  const sql = `INSERT INTO sales (customer_id, order_type, date, amount_paid) VALUES (?, ?, ?, ?)`;
  db.run(sql, [customer_id, order_type, date, amount_paid], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء إضافة البيع.' });
    }
    res.status(201).json({ id: this.lastID, message: 'تمت إضافة البيع بنجاح.' });
  });
});

// جلب كل عمليات البيع مرتبة حسب التاريخ (الأحدث أولاً)
app.get('/api/sales', (req, res) => {
  const sql = `
    SELECT sales.*, customers.name AS customer_name
    FROM sales
    LEFT JOIN customers ON sales.customer_id = customers.id
    ORDER BY date DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب المبيعات.' });
    }
    res.json(rows);
  });
});

// إضافة عميل جديد
app.post('/api/customers', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'يرجى إدخال اسم العميل ورقم الهاتف.' });
  }
  const sql = `INSERT INTO customers (name, phone) VALUES (?, ?)`;
  db.run(sql, [name, phone], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء إضافة العميل.' });
    }
    res.status(201).json({ id: this.lastID, message: 'تمت إضافة العميل بنجاح.' });
  });
});

// جلب جميع العملاء
app.get('/api/customers', authenticateToken, (req, res) => {
  const sql = `SELECT * FROM customers ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب العملاء.' });
    }
    res.json(rows);
  });
});

// حذف عميل
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء حذف العميل.' });
    }
    res.json({ message: 'تم حذف العميل بنجاح.' });
  });
});

// تعديل بيانات عميل
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  db.run('UPDATE customers SET name = ?, phone = ? WHERE id = ?', [name, phone, id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء تعديل العميل.' });
    }
    res.json({ message: 'تم تعديل العميل بنجاح.' });
  });
});

// تعديل جدول المصروفات لإضافة أعمدة attachment وnote إذا لم تكن موجودة
const alterExpensesTable = () => {
  db.get("PRAGMA table_info(expenses)", (err, columns) => {
    if (err) return;
    const colArr = Array.isArray(columns) ? columns : [];
    if (!colArr.some(col => col.name === 'label')) {
      db.run('ALTER TABLE expenses ADD COLUMN label TEXT', () => {});
    }
    if (!colArr.some(col => col.name === 'attachment')) {
      db.run('ALTER TABLE expenses ADD COLUMN attachment TEXT', () => {});
    }
    if (!colArr.some(col => col.name === 'note')) {
      db.run('ALTER TABLE expenses ADD COLUMN note TEXT', () => {});
    }
  });
};
alterExpensesTable();

// رفع ملف مرفق
app.post('/api/expenses/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'لم يتم رفع أي ملف.' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// إضافة مصروف جديد مع دعم customer_id
app.post('/api/expenses', (req, res) => {
  console.log('بيانات المصروف المستلمة:', req.body);
  const { type, date, amount, label, attachment, note, customer_id } = req.body;
  if (!type || !date || !amount) {
    return res.status(400).json({ message: 'يرجى إدخال نوع المصروف، التاريخ، والمبلغ.' });
  }
  const sql = `INSERT INTO expenses (type, date, amount, label, attachment, note, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [type, date, amount, label || null, attachment || null, note || null, customer_id || null], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء إضافة المصروف.' });
    }
    res.status(201).json({ id: this.lastID, message: 'تمت إضافة المصروف بنجاح.' });
  });
});

// جلب جميع المصروفات مع اسم العميل
app.get('/api/expenses', (req, res) => {
  const sql = `
    SELECT expenses.*, customers.name AS customer_name
    FROM expenses
    LEFT JOIN customers ON expenses.customer_id = customers.id
    ORDER BY date DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب المصروفات.' });
    }
    res.json(rows);
  });
});

// حذف مصروف
app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM expenses WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء حذف المصروف.' });
    }
    res.json({ message: 'تم حذف المصروف بنجاح.' });
  });
});

// تعديل بيانات مصروف مع دعم customer_id
app.put('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const { type, date, amount, label, attachment, note, customer_id } = req.body;
  db.run('UPDATE expenses SET type = ?, date = ?, amount = ?, label = ?, attachment = ?, note = ?, customer_id = ? WHERE id = ?', [type, date, amount, label || null, attachment || null, note || null, customer_id || null, id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء تعديل المصروف.' });
    }
    res.json({ message: 'تم تعديل المصروف بنجاح.' });
  });
});

// إضافة مادة خام جديدة إلى المخزون
app.post('/api/inventory', (req, res) => {
  const { material_name, quantity, unit_price, threshold } = req.body;
  if (!material_name || quantity == null || unit_price == null || threshold == null) {
    return res.status(400).json({ message: 'يرجى إدخال اسم المادة، الكمية، سعر الوحدة، وحد التنبيه.' });
  }
  const sql = `INSERT INTO inventory (material_name, quantity, unit_price, threshold) VALUES (?, ?, ?, ?)`;
  db.run(sql, [material_name, quantity, unit_price, threshold], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء إضافة المادة.' });
    }
    res.status(201).json({ id: this.lastID, message: 'تمت إضافة المادة بنجاح.' });
  });
});

// جلب كل المواد في المخزون
app.get('/api/inventory', (req, res) => {
  const sql = `SELECT * FROM inventory ORDER BY material_name ASC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب المخزون.' });
    }
    res.json(rows);
  });
});

// تعديل كمية مادة في المخزون (زيادة أو نقصان)
app.put('/api/inventory/:id/quantity', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  if (quantity == null) {
    return res.status(400).json({ message: 'يرجى إدخال الكمية الجديدة.' });
  }
  const sql = `UPDATE inventory SET quantity = ? WHERE id = ?`;
  db.run(sql, [quantity, id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء تحديث الكمية.' });
    }
    res.json({ message: 'تم تحديث الكمية بنجاح.' });
  });
});

// جلب المواد التي تحت حد التنبيه
app.get('/api/inventory/alerts/low-stock', (req, res) => {
  const sql = `SELECT * FROM inventory WHERE quantity <= threshold`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب تنبيهات المخزون.' });
    }
    res.json(rows);
  });
});

// إضافة طلب جديد وربطه بالعميل وخصم المواد من المخزون
app.post('/api/orders', (req, res) => {
  const { customer_id, order_type, date, total_amount, amount_paid, status, materials } = req.body;
  // materials: مصفوفة من { material_id, quantity_used }
  if (!customer_id || !order_type || !date || !total_amount || amount_paid == null || !status || !Array.isArray(materials) || materials.length === 0) {
    return res.status(400).json({ message: 'يرجى إدخال جميع بيانات الطلب والمواد المستخدمة.' });
  }

  db.serialize(() => {
    // 1. إضافة الطلب في جدول orders
    const orderSql = `INSERT INTO orders (customer_id, order_type, date, total_amount, amount_paid, status) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(orderSql, [customer_id, order_type, date, total_amount, amount_paid, status], function(err) {
      if (err) {
        return res.status(500).json({ message: 'حدث خطأ أثناء إضافة الطلب.' });
      }
      const order_id = this.lastID;

      // 2. إضافة المواد المستخدمة في order_materials وخصمها من المخزون
      let errorOccurred = false;
      materials.forEach((mat, idx) => {
        const { material_id, quantity_used } = mat;
        if (!material_id || quantity_used == null) {
          errorOccurred = true;
          return;
        }
        // إضافة في order_materials
        const matSql = `INSERT INTO order_materials (order_id, material_id, quantity_used) VALUES (?, ?, ?)`;
        db.run(matSql, [order_id, material_id, quantity_used], function(err2) {
          if (err2) {
            errorOccurred = true;
            return;
          }
          // خصم الكمية من المخزون
          const updateInvSql = `UPDATE inventory SET quantity = quantity - ? WHERE id = ?`;
          db.run(updateInvSql, [quantity_used, material_id], function(err3) {
            if (err3) {
              errorOccurred = true;
              return;
            }
            // إذا كانت آخر مادة ولم يحدث خطأ، أرسل الرد
            if (idx === materials.length - 1 && !errorOccurred) {
              res.status(201).json({ order_id, message: 'تمت إضافة الطلب وخصم المواد بنجاح.' });
            } else if (errorOccurred && idx === materials.length - 1) {
              res.status(500).json({ message: 'حدث خطأ أثناء معالجة المواد.' });
            }
          });
        });
      });
    });
  });
});

// جلب جميع الطلبات مع بيانات العميل
app.get('/api/orders', (req, res) => {
  const sql = `
    SELECT orders.*, customers.name AS customer_name
    FROM orders
    LEFT JOIN customers ON orders.customer_id = customers.id
    ORDER BY date DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب الطلبات.' });
    }
    res.json(rows);
  });
});

// جلب المواد المستخدمة في طلب معيّن
app.get('/api/orders/:order_id/materials', (req, res) => {
  const { order_id } = req.params;
  const sql = `
    SELECT order_materials.*, inventory.material_name
    FROM order_materials
    LEFT JOIN inventory ON order_materials.material_id = inventory.id
    WHERE order_materials.order_id = ?
  `;
  db.all(sql, [order_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب مواد الطلب.' });
    }
    res.json(rows);
  });
});

// جلب جميع الطلبات لعميل معيّن
app.get('/api/customers/:id/orders', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT orders.*, 
           (SELECT GROUP_CONCAT(inventory.material_name || ' (كمية: ' || order_materials.quantity_used || ')', ', ')
            FROM order_materials 
            LEFT JOIN inventory ON order_materials.material_id = inventory.id
            WHERE order_materials.order_id = orders.id
           ) AS materials
    FROM orders
    WHERE customer_id = ?
    ORDER BY date DESC
  `;
  db.all(sql, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب الطلبات.' });
    }
    res.json(rows);
  });
});

// تصدير التطبيق وقاعدة البيانات للاستخدام لاحقًا
module.exports = { app, db };

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`السيرفر يعمل على http://localhost:${PORT}`);
});

// تقرير الإيرادات (المبيعات) حسب الفترة
app.get('/api/reports/sales', (req, res) => {
  const { from, to } = req.query; // تواريخ بصيغة YYYY-MM-DD
  let sql = `
    SELECT SUM(amount_paid) AS total_sales
    FROM sales
    WHERE 1=1
  `;
  const params = [];
  if (from) {
    sql += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND date <= ?';
    params.push(to);
  }
  db.get(sql, params, (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب تقرير المبيعات.' });
    }
    res.json({ total_sales: row.total_sales || 0 });
  });
});

// تقرير المصروفات حسب الفترة
app.get('/api/reports/expenses', (req, res) => {
  const { from, to } = req.query;
  let sql = `
    SELECT SUM(amount) AS total_expenses
    FROM expenses
    WHERE 1=1
  `;
  const params = [];
  if (from) {
    sql += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND date <= ?';
    params.push(to);
  }
  db.get(sql, params, (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب تقرير المصروفات.' });
    }
    res.json({ total_expenses: row.total_expenses || 0 });
  });
});

// تقرير صافي الربح حسب الفترة
app.get('/api/reports/profit', (req, res) => {
  const { from, to } = req.query;
  let salesSql = `SELECT SUM(amount_paid) AS total_sales FROM sales WHERE 1=1`;
  let expensesSql = `SELECT SUM(amount) AS total_expenses FROM expenses WHERE 1=1`;
  const params = [];
  if (from) {
    salesSql += ' AND date >= ?';
    expensesSql += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    salesSql += ' AND date <= ?';
    expensesSql += ' AND date <= ?';
    params.push(to);
  }
  db.get(salesSql, params, (err, salesRow) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب المبيعات.' });
    }
    db.get(expensesSql, params, (err2, expensesRow) => {
      if (err2) {
        return res.status(500).json({ message: 'حدث خطأ أثناء جلب المصروفات.' });
      }
      const total_sales = salesRow.total_sales || 0;
      const total_expenses = expensesRow.total_expenses || 0;
      const net_profit = total_sales - total_expenses;
      res.json({ total_sales, total_expenses, net_profit });
    });
  });
});

// تقرير العملاء الذين لديهم رصيد متبقي
app.get('/api/reports/customers-due', (req, res) => {
  const sql = `
    SELECT id, name, phone, total_paid, total_due
    FROM customers
    WHERE total_due > 0
    ORDER BY total_due DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب العملاء المتبقي لهم رصيد.' });
    }
    res.json(rows);
  });
});

// توليد تقرير PDF للإيرادات والمصروفات وصافي الربح
app.get('/api/reports/summary/pdf', (req, res) => {
  const { from, to } = req.query;
  // سنجلب البيانات أولاً من قاعدة البيانات
  let salesSql = `SELECT SUM(amount_paid) AS total_sales FROM sales WHERE 1=1`;
  let expensesSql = `SELECT SUM(amount) AS total_expenses FROM expenses WHERE 1=1`;
  const params = [];
  if (from) {
    salesSql += ' AND date >= ?';
    expensesSql += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    salesSql += ' AND date <= ?';
    expensesSql += ' AND date <= ?';
    params.push(to);
  }

  db.get(salesSql, params, (err, salesRow) => {
    if (err) {
      return res.status(500).json({ message: 'خطأ في جلب المبيعات.' });
    }
    db.get(expensesSql, params, (err2, expensesRow) => {
      if (err2) {
        return res.status(500).json({ message: 'خطأ في جلب المصروفات.' });
      }
      const total_sales = salesRow.total_sales || 0;
      const total_expenses = expensesRow.total_expenses || 0;
      const net_profit = total_sales - total_expenses;

      // إنشاء ملف PDF
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
      doc.pipe(res);

      // عنوان التقرير
      doc.fontSize(20).text('تقرير ملخص الورشة', { align: 'center' });
      doc.moveDown();

      // فترة التقرير
      doc.fontSize(12).text(`الفترة: من ${from || '---'} إلى ${to || '---'}`, { align: 'right' });
      doc.moveDown();

      // البيانات
      doc.fontSize(14).text(`إجمالي الإيرادات: ${total_sales} جنيه`, { align: 'right' });
      doc.text(`إجمالي المصروفات: ${total_expenses} جنيه`, { align: 'right' });
      doc.text(`صافي الربح: ${net_profit} جنيه`, { align: 'right' });

      doc.end();
    });
  });
});

// تسجيل الدخول
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'يرجى إدخال اسم المستخدم وكلمة المرور.' });
  }
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }
    // توليد رمز JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      'your_jwt_secret_key', // غيّرها إلى قيمة سرية قوية
      { expiresIn: '8h' }
    );
    res.json({ message: 'تم تسجيل الدخول بنجاح.', token });
  });
});

// تحديث اسم المستخدم أو كلمة المرور
app.put('/api/user/update', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { newUsername, oldPassword, newPassword } = req.body;
  if (!oldPassword) {
    return res.status(400).json({ message: 'يرجى إدخال كلمة المرور الحالية.' });
  }
  // جلب بيانات المستخدم الحالي
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'المستخدم غير موجود.' });
    }
    // تحقق من كلمة المرور القديمة
    const isMatch = bcrypt.compareSync(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة.' });
    }
    // بناء جملة التحديث
    let sql = 'UPDATE users SET ';
    const params = [];
    if (newUsername) {
      sql += 'username = ?';
      params.push(newUsername);
    }
    if (newPassword) {
      if (params.length > 0) sql += ', ';
      sql += 'password_hash = ?';
      params.push(bcrypt.hashSync(newPassword, 10));
    }
    if (params.length === 0) {
      return res.status(400).json({ message: 'يرجى إدخال اسم مستخدم أو كلمة مرور جديدة.' });
    }
    sql += ' WHERE id = ?';
    params.push(userId);
    db.run(sql, params, function(err2) {
      if (err2) {
        if (err2.message.includes('UNIQUE')) {
          return res.status(400).json({ message: 'اسم المستخدم الجديد مستخدم بالفعل.' });
        }
        return res.status(500).json({ message: 'حدث خطأ أثناء التحديث.' });
      }
      res.json({ message: 'تم تحديث البيانات بنجاح.' });
    });
  });
});

// ميدل وير للتحقق من التوكن
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  if (!token) {
    return res.status(401).json({ message: 'يجب تسجيل الدخول أولاً.' });
  }
  jwt.verify(token, 'your_jwt_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'رمز الدخول غير صالح أو منتهي.' });
    }
    req.user = user;
    next();
  });
}

// نسخ احتياطي تلقائي لقاعدة البيانات عند تشغيل السيرفر
function backupDatabase() {
  const src = path.join(__dirname, '../database/workshop.db');
  const dest = path.join(__dirname, `../database/backups/workshop-backup-${Date.now()}.db`);
  fs.copyFile(src, dest, (err) => {
    if (err) {
      console.error('خطأ في النسخ الاحتياطي:', err.message);
    } else {
      console.log('تم إنشاء نسخة احتياطية من قاعدة البيانات:', dest);
    }
  });
}

// يمكنك استدعاء الدالة عند تشغيل السيرفر
backupDatabase();

// تعديل بيانات مادة في المخزون
app.put('/api/inventory/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { material_name, quantity, unit_price, threshold } = req.body;
  if (!material_name || quantity == null || unit_price == null || threshold == null) {
    return res.status(400).json({ message: 'يرجى إدخال جميع البيانات.' });
  }
  const sql = `UPDATE inventory SET material_name = ?, quantity = ?, unit_price = ?, threshold = ? WHERE id = ?`;
  db.run(sql, [material_name, quantity, unit_price, threshold, id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء تعديل المادة.' });
    }
    res.json({ message: 'تم تعديل المادة بنجاح.' });
  });
});
// حذف مادة من المخزون
app.delete('/api/inventory/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM inventory WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء حذف المادة.' });
    }
    res.json({ message: 'تم حذف المادة بنجاح.' });
  });
});

// إضافة عملية سحب من المخزون
app.post('/api/inventory/withdraw', authenticateToken, (req, res) => {
  const { customer_id, material_id, quantity, date, note } = req.body;
  if (!customer_id || !material_id || !quantity || !date) {
    return res.status(400).json({ message: 'يرجى إدخال جميع البيانات المطلوبة.' });
  }
  // تحقق من توفر الكمية في المخزون
  db.get('SELECT quantity FROM inventory WHERE id = ?', [material_id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ message: 'المادة غير موجودة في المخزون.' });
    }
    if (Number(row.quantity) < Number(quantity)) {
      return res.status(400).json({ message: 'الكمية المطلوبة غير متوفرة في المخزون.' });
    }
    // خصم الكمية
    db.run('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', [quantity, material_id], function(err2) {
      if (err2) {
        return res.status(500).json({ message: 'حدث خطأ أثناء تحديث المخزون.' });
      }
      // تسجيل السحب
      db.run('INSERT INTO inventory_withdrawals (customer_id, material_id, quantity, date, note) VALUES (?, ?, ?, ?, ?)', [customer_id, material_id, quantity, date, note || null], function(err3) {
        if (err3) {
          return res.status(500).json({ message: 'حدث خطأ أثناء تسجيل السحب.' });
        }
        res.status(201).json({ message: 'تم تسجيل السحب بنجاح.' });
      });
    });
  });
});

// جلب جميع عمليات السحب من المخزون مع اسم العميل واسم المادة
app.get('/api/inventory/withdrawals', authenticateToken, (req, res) => {
  const sql = `
    SELECT w.*, c.name AS customer_name, i.material_name
    FROM inventory_withdrawals w
    LEFT JOIN customers c ON w.customer_id = c.id
    LEFT JOIN inventory i ON w.material_id = i.id
    ORDER BY w.date DESC, w.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب السحوبات.' });
    }
    res.json(rows);
  });
});

// تقارير السحوبات المتقدمة
// 1. تقرير شامل بفلاتر (تاريخ، عميل، مادة)
app.get('/api/reports/withdrawals', authenticateToken, (req, res) => {
  const { from, to, customer_id, material_id } = req.query;
  let sql = `
    SELECT w.*, c.name AS customer_name, i.material_name
    FROM inventory_withdrawals w
    LEFT JOIN customers c ON w.customer_id = c.id
    LEFT JOIN inventory i ON w.material_id = i.id
    WHERE 1=1
  `;
  const params = [];
  if (from) {
    sql += ' AND w.date >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND w.date <= ?';
    params.push(to);
  }
  if (customer_id) {
    sql += ' AND w.customer_id = ?';
    params.push(customer_id);
  }
  if (material_id) {
    sql += ' AND w.material_id = ?';
    params.push(material_id);
  }
  sql += ' ORDER BY w.date DESC, w.id DESC';
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب تقرير السحوبات.' });
    }
    res.json(rows);
  });
});

// 2. تقرير رصيد كل مادة بعد كل عملية سحب (تسلسل)
app.get('/api/reports/withdrawals/material-balance', authenticateToken, (req, res) => {
  // سنعيد لكل عملية سحب: اسم المادة، التاريخ، الكمية المسحوبة، الرصيد بعد السحب
  const sql = `
    SELECT w.id, w.date, i.material_name, w.quantity,
      (
        SELECT SUM(w2.quantity)
        FROM inventory_withdrawals w2
        WHERE w2.material_id = w.material_id AND w2.date <= w.date AND w2.id <= w.id
      ) AS total_withdrawn,
      i.quantity + (
        SELECT IFNULL(SUM(w2.quantity),0)
        FROM inventory_withdrawals w2
        WHERE w2.material_id = w.material_id AND (w2.date > w.date OR (w2.date = w.date AND w2.id > w.id))
      ) - w.quantity AS balance_after
    FROM inventory_withdrawals w
    LEFT JOIN inventory i ON w.material_id = i.id
    ORDER BY w.material_id, w.date, w.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب رصيد المواد.' });
    }
    res.json(rows);
  });
});

// 3. تقرير إجمالي السحوبات لكل عميل أو مادة
app.get('/api/reports/withdrawals/summary', authenticateToken, (req, res) => {
  const { by } = req.query; // by = 'customer' أو 'material'
  let sql = '';
  if (by === 'customer') {
    sql = `
      SELECT c.id AS customer_id, c.name AS customer_name, SUM(w.quantity) AS total_withdrawn
      FROM inventory_withdrawals w
      LEFT JOIN customers c ON w.customer_id = c.id
      GROUP BY w.customer_id
      ORDER BY total_withdrawn DESC
    `;
  } else if (by === 'material') {
    sql = `
      SELECT i.id AS material_id, i.material_name, SUM(w.quantity) AS total_withdrawn
      FROM inventory_withdrawals w
      LEFT JOIN inventory i ON w.material_id = i.id
      GROUP BY w.material_id
      ORDER BY total_withdrawn DESC
    `;
  } else {
    return res.status(400).json({ message: 'يرجى تحديد نوع التجميع (by=customer أو by=material).' });
  }
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب ملخص السحوبات.' });
    }
    res.json(rows);
  });
});

// إضافة إيراد جديد
app.post('/api/incomes', authenticateToken, (req, res) => {
  const { amount, source_type, customer_id, date, payment_method, receipt_number, note } = req.body;
  if (!amount || !source_type || !date) {
    return res.status(400).json({ message: 'يرجى إدخال جميع البيانات الأساسية.' });
  }
  const sql = `INSERT INTO incomes (amount, source_type, customer_id, date, payment_method, receipt_number, note) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [amount, source_type, customer_id || null, date, payment_method || null, receipt_number || null, note || null], function(err) {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء إضافة الإيراد.' });
    }
    res.status(201).json({ id: this.lastID, message: 'تمت إضافة الإيراد بنجاح.' });
  });
});

// جلب جميع الإيرادات مع اسم العميل إذا وجد
app.get('/api/incomes', authenticateToken, (req, res) => {
  const sql = `
    SELECT incomes.*, customers.name AS customer_name
    FROM incomes
    LEFT JOIN customers ON incomes.customer_id = customers.id
    ORDER BY date DESC, id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب الإيرادات.' });
    }
    res.json(rows);
  });
});

// تقارير مالية مفصلة
// 1. تقرير الإيرادات مع تجميع حسب المصدر
app.get('/api/reports/incomes', authenticateToken, (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT SUM(amount) AS total_incomes FROM incomes WHERE 1=1`;
  let sqlBySource = `SELECT source_type, SUM(amount) AS total FROM incomes WHERE 1=1`;
  const params = [];
  const params2 = [];
  if (from) { sql += ' AND date >= ?'; sqlBySource += ' AND date >= ?'; params.push(from); params2.push(from); }
  if (to)   { sql += ' AND date <= ?'; sqlBySource += ' AND date <= ?'; params.push(to); params2.push(to); }
  db.get(sql, params, (err, row) => {
    if (err) return res.status(500).json({ message: 'خطأ في جلب الإيرادات.' });
    db.all(sqlBySource + ' GROUP BY source_type', params2, (err2, rows2) => {
      if (err2) return res.status(500).json({ message: 'خطأ في جلب الإيرادات حسب المصدر.' });
      res.json({ total_incomes: row.total_incomes || 0, by_source: rows2 });
    });
  });
});
// 2. تقرير المصروفات
app.get('/api/reports/expenses', authenticateToken, (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT SUM(amount) AS total_expenses FROM expenses WHERE 1=1`;
  const params = [];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to)   { sql += ' AND date <= ?'; params.push(to); }
  db.get(sql, params, (err, row) => {
    if (err) return res.status(500).json({ message: 'خطأ في جلب المصروفات.' });
    res.json({ total_expenses: row.total_expenses || 0 });
  });
});
// 3. تقرير صافي الربح (إيرادات - مصروفات)
app.get('/api/reports/profit', authenticateToken, (req, res) => {
  const { from, to } = req.query;
  let incomesSql = `SELECT SUM(amount) AS total_incomes FROM incomes WHERE 1=1`;
  let expensesSql = `SELECT SUM(amount) AS total_expenses FROM expenses WHERE 1=1`;
  const params = [];
  if (from) { incomesSql += ' AND date >= ?'; expensesSql += ' AND date >= ?'; params.push(from); }
  if (to)   { incomesSql += ' AND date <= ?'; expensesSql += ' AND date <= ?'; params.push(to); }
  db.get(incomesSql, params, (err, incomesRow) => {
    if (err) return res.status(500).json({ message: 'خطأ في جلب الإيرادات.' });
    db.get(expensesSql, params, (err2, expensesRow) => {
      if (err2) return res.status(500).json({ message: 'خطأ في جلب المصروفات.' });
      const total_incomes = incomesRow.total_incomes || 0;
      const total_expenses = expensesRow.total_expenses || 0;
      const net_profit = total_incomes - total_expenses;
      res.json({ total_incomes, total_expenses, net_profit });
    });
  });
});
// 4. تقرير المبيعات
app.get('/api/reports/sales', authenticateToken, (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT SUM(amount_paid) AS total_sales FROM sales WHERE 1=1`;
  const params = [];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to)   { sql += ' AND date <= ?'; params.push(to); }
  db.get(sql, params, (err, row) => {
    if (err) return res.status(500).json({ message: 'خطأ في جلب المبيعات.' });
    res.json({ total_sales: row.total_sales || 0 });
  });
});
// 5. تقرير سحوبات المخزون
app.get('/api/reports/withdrawals/summary', authenticateToken, (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT SUM(quantity) AS total_withdrawals FROM inventory_withdrawals WHERE 1=1`;
  const params = [];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to)   { sql += ' AND date <= ?'; params.push(to); }
  db.get(sql, params, (err, row) => {
    if (err) return res.status(500).json({ message: 'خطأ في جلب سحوبات المخزون.' });
    res.json({ total_withdrawals: row.total_withdrawals || 0 });
  });
});

// Endpoints بيانات مجمعة زمنيًا (للرسوم البيانية)
// 1. إيرادات مجمعة
app.get('/api/reports/incomes/grouped', authenticateToken, (req, res) => {
  const { from, to, group_by } = req.query;
  let group = 'strftime("%Y-%m-%d", date)';
  if (group_by === 'month') group = 'strftime("%Y-%m", date)';
  if (group_by === 'year') group = 'strftime("%Y", date)';
  let sql = `SELECT ${group} as period, SUM(amount) as total FROM incomes WHERE 1=1`;
  const params = [];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to)   { sql += ' AND date <= ?'; params.push(to); }
  sql += ' GROUP BY period ORDER BY period';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'خطأ في جلب البيانات.' });
    res.json(rows);
  });
});
// 2. مصروفات مجمعة
app.get('/api/reports/expenses/grouped', authenticateToken, (req, res) => {
  const { from, to, group_by } = req.query;
  let group = 'strftime("%Y-%m-%d", date)';
  if (group_by === 'month') group = 'strftime("%Y-%m", date)';
  if (group_by === 'year') group = 'strftime("%Y", date)';
  let sql = `SELECT ${group} as period, SUM(amount) as total FROM expenses WHERE 1=1`;
  const params = [];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to)   { sql += ' AND date <= ?'; params.push(to); }
  sql += ' GROUP BY period ORDER BY period';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'خطأ في جلب البيانات.' });
    res.json(rows);
  });
});
// 3. مبيعات مجمعة
app.get('/api/reports/sales/grouped', authenticateToken, (req, res) => {
  const { from, to, group_by } = req.query;
  let group = 'strftime("%Y-%m-%d", date)';
  if (group_by === 'month') group = 'strftime("%Y-%m", date)';
  if (group_by === 'year') group = 'strftime("%Y", date)';
  let sql = `SELECT ${group} as period, SUM(amount_paid) as total FROM sales WHERE 1=1`;
  const params = [];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to)   { sql += ' AND date <= ?'; params.push(to); }
  sql += ' GROUP BY period ORDER BY period';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'خطأ في جلب البيانات.' });
    res.json(rows);
  });
});
// 4. سحوبات مجمعة
app.get('/api/reports/withdrawals/grouped', authenticateToken, (req, res) => {
  const { from, to, group_by } = req.query;
  let group = 'strftime("%Y-%m-%d", date)';
  if (group_by === 'month') group = 'strftime("%Y-%m", date)';
  if (group_by === 'year') group = 'strftime("%Y", date)';
  let sql = `SELECT ${group} as period, SUM(quantity) as total FROM inventory_withdrawals WHERE 1=1`;
  const params = [];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to)   { sql += ' AND date <= ?'; params.push(to); }
  sql += ' GROUP BY period ORDER BY period';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'خطأ في جلب البيانات.' });
    res.json(rows);
  });
});