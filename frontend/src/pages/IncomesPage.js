import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';

const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #b6c6e3', fontSize: 16, background: '#fafdff', marginBottom: 2, height: 44 };
const labelStyle = { fontWeight: 'bold', color: '#1976d2', marginBottom: 4, display: 'block', fontSize: 15 };
const saveBtnStyle = { background: '#388e3c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 40px', fontSize: 18, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 4px #e3eaf3', marginTop: 18 };

export default function IncomesPage() {
  const [customers, setCustomers] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [amount, setAmount] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [note, setNote] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchIncomes();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setCustomers(res.data);
    } catch {}
  };
  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/incomes', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setIncomes(res.data);
    } catch {}
    setLoading(false);
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!amount || !sourceType || !date) {
      setAddError('يرجى إدخال جميع البيانات الأساسية');
      return;
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      setAddError('المبلغ يجب أن يكون رقمًا أكبر من صفر');
      return;
    }
    try {
      await axios.post('/api/incomes', {
        amount,
        source_type: sourceType,
        customer_id: sourceType === 'عميل' ? customerId : null,
        date,
        payment_method: paymentMethod,
        receipt_number: receiptNumber,
        note
      }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setAddSuccess('تم تسجيل الإيراد بنجاح');
      setAmount('');
      setSourceType('');
      setCustomerId('');
      setDate('');
      setPaymentMethod('');
      setReceiptNumber('');
      setNote('');
      fetchIncomes();
    } catch (err) {
      setAddError(err.response?.data?.message || 'فشل في تسجيل الإيراد');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, background: '#f7fafd', borderRadius: 18, boxShadow: '0 4px 24px #e3eaf3', direction: 'rtl', fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
      <NavBar />
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#1976d2', fontWeight: 'bold', fontSize: 32 }}>الإيرادات</h2>
      <form onSubmit={handleAddIncome} style={{ marginBottom: 36, border: '1px solid #e3eaf3', padding: 28, borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px #e3eaf3' }}>
        <h4 style={{ marginBottom: 20, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>إضافة إيراد جديد</h4>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>المبلغ *</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required style={inputStyle} placeholder="المبلغ" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>نوع المصدر *</label>
          <select value={sourceType} onChange={e => setSourceType(e.target.value)} required style={inputStyle}>
            <option value="">اختر المصدر</option>
            <option value="مالك">مالك الورشة</option>
            <option value="عميل">عميل</option>
            <option value="آخر">آخر</option>
          </select>
        </div>
        {sourceType === 'عميل' && (
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>اسم العميل *</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} required style={inputStyle}>
              <option value="">اختر العميل</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>تاريخ الإيراد *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>طريقة الدفع</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={inputStyle}>
            <option value="">اختر الطريقة</option>
            <option value="نقدي">نقدي</option>
            <option value="تحويل بنكي">تحويل بنكي</option>
            <option value="شيك">شيك</option>
            <option value="بطاقة">بطاقة</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>رقم الإيصال</label>
          <input type="text" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} style={inputStyle} placeholder="رقم الإيصال (اختياري)" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>ملاحظة</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} style={inputStyle} placeholder="ملاحظة (اختياري)" />
        </div>
        <button type="submit" style={saveBtnStyle}>تسجيل الإيراد</button>
        {addError && <div style={{ color: 'red', fontWeight: 'bold', marginTop: 18 }}>{addError}</div>}
        {addSuccess && <div style={{ color: 'green', fontWeight: 'bold', marginTop: 18 }}>{addSuccess}</div>}
      </form>
      <h4 style={{ marginBottom: 18, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>سجل الإيرادات</h4>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>جاري التحميل...</div>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 10, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #eee' }}>
          <thead style={{ background: '#1976d2', color: '#fff' }}>
            <tr>
              <th>المبلغ</th>
              <th>المصدر</th>
              <th>اسم العميل</th>
              <th>التاريخ</th>
              <th>طريقة الدفع</th>
              <th>رقم الإيصال</th>
              <th>ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {incomes.map(i => (
              <tr key={i.id}>
                <td>{i.amount}</td>
                <td>{i.source_type}</td>
                <td>{i.customer_name || '-'}</td>
                <td>{i.date}</td>
                <td>{i.payment_method || '-'}</td>
                <td>{i.receipt_number || '-'}</td>
                <td>{i.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 