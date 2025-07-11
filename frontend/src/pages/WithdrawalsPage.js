import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';
import { useNavigate } from 'react-router-dom';

const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #b6c6e3', fontSize: 16, background: '#fafdff', marginBottom: 2, height: 44 };
const labelStyle = { fontWeight: 'bold', color: '#1976d2', marginBottom: 4, display: 'block', fontSize: 15 };
const saveBtnStyle = { background: '#388e3c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 40px', fontSize: 18, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 4px #e3eaf3', marginTop: 18 };

export default function WithdrawalsPage() {
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
    fetchMaterials();
    fetchWithdrawals();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setCustomers(res.data);
    } catch {}
  };
  const fetchMaterials = async () => {
    try {
      const res = await axios.get('/api/inventory', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setMaterials(res.data);
    } catch {}
  };
  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/inventory/withdrawals', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setWithdrawals(res.data);
    } catch {}
    setLoading(false);
  };

  const handleAddWithdrawal = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!customerId || !materialId || !quantity || !date) {
      setAddError('يرجى إدخال جميع البيانات');
      return;
    }
    if (isNaN(quantity) || Number(quantity) <= 0) {
      setAddError('الكمية يجب أن تكون رقمًا أكبر من صفر');
      return;
    }
    try {
      await axios.post('/api/inventory/withdraw', {
        customer_id: customerId,
        material_id: materialId,
        quantity,
        date,
        note
      }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setAddSuccess('تم تسجيل السحب بنجاح');
      setCustomerId('');
      setMaterialId('');
      setQuantity('');
      setDate('');
      setNote('');
      fetchWithdrawals();
    } catch (err) {
      setAddError(err.response?.data?.message || 'فشل في تسجيل السحب');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, background: '#f7fafd', borderRadius: 18, boxShadow: '0 4px 24px #e3eaf3', direction: 'rtl', fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
      <NavBar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ marginBottom: 0, color: '#1976d2', fontWeight: 'bold', fontSize: 32 }}>سحب من المخزون</h2>
        <button onClick={() => navigate('/withdrawals-reports')} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 4px #e3eaf3' }}>
          تقارير السحوبات
        </button>
      </div>
      <form onSubmit={handleAddWithdrawal} style={{ marginBottom: 36, border: '1px solid #e3eaf3', padding: 28, borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px #e3eaf3' }}>
        <h4 style={{ marginBottom: 20, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>إضافة سحب جديد</h4>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>العميل *</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} required style={inputStyle}>
            <option value="">اختر العميل</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>المادة *</label>
          <select value={materialId} onChange={e => setMaterialId(e.target.value)} required style={inputStyle}>
            <option value="">اختر المادة</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.material_name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>الكمية *</label>
          <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required style={inputStyle} placeholder="الكمية" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>التاريخ *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>ملاحظة</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} style={inputStyle} placeholder="ملاحظة (اختياري)" />
        </div>
        <button type="submit" style={saveBtnStyle}>تسجيل السحب</button>
        {addError && <div style={{ color: 'red', fontWeight: 'bold', marginTop: 18 }}>{addError}</div>}
        {addSuccess && <div style={{ color: 'green', fontWeight: 'bold', marginTop: 18 }}>{addSuccess}</div>}
      </form>
      <h4 style={{ marginBottom: 18, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>سجل السحوبات</h4>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>جاري التحميل...</div>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 10, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #eee' }}>
          <thead style={{ background: '#1976d2', color: '#fff' }}>
            <tr>
              <th>العميل</th>
              <th>المادة</th>
              <th>الكمية</th>
              <th>التاريخ</th>
              <th>ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map(w => (
              <tr key={w.id}>
                <td>{w.customer_name}</td>
                <td>{w.material_name}</td>
                <td>{w.quantity}</td>
                <td>{w.date}</td>
                <td>{w.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 