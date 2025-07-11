// سكريبت لإضافة مستخدم admin افتراضي
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/workshop.db');
const db = new sqlite3.Database(dbPath);

const username = 'admin';
const password = '123456';
const password_hash = bcrypt.hashSync(password, 10);

db.run(
  'INSERT INTO users (username, password_hash) VALUES (?, ?)',
  [username, password_hash],
  function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        console.log('المستخدم admin موجود بالفعل.');
      } else {
        console.error('خطأ أثناء إضافة المستخدم:', err.message);
      }
    } else {
      console.log('تمت إضافة المستخدم admin بنجاح.');
    }
    db.close();
  }
); 