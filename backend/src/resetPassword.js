// سكريبت لإعادة تعيين كلمة المرور للمستخدم الموجود
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/workshop.db');
const db = new sqlite3.Database(dbPath);

const username = 'ramadan';
const newPassword = '123456';
const password_hash = bcrypt.hashSync(newPassword, 10);

db.run(
  'UPDATE users SET password_hash = ? WHERE username = ?',
  [password_hash, username],
  function (err) {
    if (err) {
      console.error('خطأ أثناء تحديث كلمة المرور:', err.message);
    } else {
      if (this.changes > 0) {
        console.log(`تم تحديث كلمة المرور للمستخدم ${username} بنجاح.`);
        console.log(`كلمة المرور الجديدة: ${newPassword}`);
      } else {
        console.log(`لم يتم العثور على المستخدم ${username}.`);
      }
    }
    db.close();
  }
); 