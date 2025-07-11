const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/workshop.db');
const db = new sqlite3.Database(dbPath);

// إضافة بيانات تجريبية
const addTestData = () => {
  console.log('إضافة بيانات تجريبية...');
  
  // إضافة عملاء
  const customers = [
    { name: 'أحمد محمد', phone: '01012345678' },
    { name: 'فاطمة علي', phone: '01087654321' },
    { name: 'محمد حسن', phone: '01011111111' }
  ];
  
  customers.forEach(customer => {
    db.run('INSERT INTO customers (name, phone) VALUES (?, ?)', [customer.name, customer.phone]);
  });
  
  // إضافة إيرادات
  const incomes = [
    { amount: 5000, source_type: 'مالك', date: '2024-01-15', payment_method: 'نقدي' },
    { amount: 3000, source_type: 'عميل', date: '2024-01-20', payment_method: 'تحويل بنكي' },
    { amount: 2000, source_type: 'آخر', date: '2024-02-01', payment_method: 'شيك' },
    { amount: 4000, source_type: 'مالك', date: '2024-02-10', payment_method: 'نقدي' },
    { amount: 1500, source_type: 'عميل', date: '2024-02-15', payment_method: 'تحويل بنكي' }
  ];
  
  incomes.forEach(income => {
    db.run('INSERT INTO incomes (amount, source_type, date, payment_method) VALUES (?, ?, ?, ?)', 
           [income.amount, income.source_type, income.date, income.payment_method]);
  });
  
  // إضافة مصروفات
  const expenses = [
    { type: 'مواد خام', amount: 1000, date: '2024-01-10' },
    { type: 'كهرباء', amount: 500, date: '2024-01-25' },
    { type: 'إيجار', amount: 2000, date: '2024-02-01' },
    { type: 'صيانة', amount: 800, date: '2024-02-05' },
    { type: 'رواتب', amount: 3000, date: '2024-02-10' }
  ];
  
  expenses.forEach(expense => {
    db.run('INSERT INTO expenses (type, amount, date) VALUES (?, ?, ?)', 
           [expense.type, expense.amount, expense.date]);
  });
  
  // إضافة مبيعات
  const sales = [
    { customer_id: 1, order_type: 'طاولة', amount_paid: 2500, date: '2024-01-18' },
    { customer_id: 2, order_type: 'كرسي', amount_paid: 800, date: '2024-01-25' },
    { customer_id: 1, order_type: 'خزانة', amount_paid: 3500, date: '2024-02-05' },
    { customer_id: 3, order_type: 'سرير', amount_paid: 4000, date: '2024-02-12' }
  ];
  
  sales.forEach(sale => {
    db.run('INSERT INTO sales (customer_id, order_type, amount_paid, date) VALUES (?, ?, ?, ?)', 
           [sale.customer_id, sale.order_type, sale.amount_paid, sale.date]);
  });
  
  // إضافة مواد للمخزون
  const inventory = [
    { material_name: 'خشب', quantity: 100, unit_price: 50, threshold: 20 },
    { material_name: 'مسامير', quantity: 500, unit_price: 2, threshold: 100 },
    { material_name: 'غراء', quantity: 20, unit_price: 30, threshold: 5 }
  ];
  
  inventory.forEach(item => {
    db.run('INSERT INTO inventory (material_name, quantity, unit_price, threshold) VALUES (?, ?, ?, ?)', 
           [item.material_name, item.quantity, item.unit_price, item.threshold]);
  });
  
  // إضافة سحوبات من المخزون
  const withdrawals = [
    { customer_id: 1, material_id: 1, quantity: 10, date: '2024-01-20' },
    { customer_id: 2, material_id: 2, quantity: 50, date: '2024-01-25' },
    { customer_id: 1, material_id: 3, quantity: 2, date: '2024-02-01' },
    { customer_id: 3, material_id: 1, quantity: 15, date: '2024-02-10' }
  ];
  
  withdrawals.forEach(withdrawal => {
    db.run('INSERT INTO inventory_withdrawals (customer_id, material_id, quantity, date) VALUES (?, ?, ?, ?)', 
           [withdrawal.customer_id, withdrawal.material_id, withdrawal.quantity, withdrawal.date]);
  });
  
  console.log('تم إضافة البيانات التجريبية بنجاح!');
  db.close();
};

addTestData(); 