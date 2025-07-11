import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';

const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #b6c6e3', fontSize: 16, background: '#fafdff', marginBottom: 2, height: 44 };
const labelStyle = { fontWeight: 'bold', color: '#1976d2', marginBottom: 4, display: 'block', fontSize: 15 };
const saveBtnStyle = { background: '#388e3c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 40px', fontSize: 18, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 4px #e3eaf3', marginTop: 18 };

export default function SettingsPage() {
  const [newUsername, setNewUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (newPassword && newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          newUsername: newUsername.trim() || undefined,
          oldPassword,
          newPassword: newPassword.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('تم تحديث البيانات بنجاح.');
        setNewUsername('');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.message || 'حدث خطأ أثناء التحديث.');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, background: '#f7fafd', borderRadius: 18, boxShadow: '0 4px 24px #e3eaf3', direction: 'rtl', fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
      <NavBar />
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#1976d2', fontWeight: 'bold', fontSize: 28 }}>إعدادات الحساب</h2>
      <form onSubmit={handleSubmit} style={{ border: '1px solid #e3eaf3', padding: 28, borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px #e3eaf3' }}>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>اسم المستخدم الجديد</label>
          <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} style={inputStyle} placeholder="اسم المستخدم الجديد (اختياري)" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>كلمة المرور الحالية *</label>
          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={inputStyle} required placeholder="كلمة المرور الحالية" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>كلمة المرور الجديدة</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="كلمة المرور الجديدة (اختياري)" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>تأكيد كلمة المرور الجديدة</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="تأكيد كلمة المرور الجديدة" />
        </div>
        <button type="submit" style={saveBtnStyle} disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}</button>
        {success && <div style={{ color: 'green', fontWeight: 'bold', marginTop: 18 }}>{success}</div>}
        {error && <div style={{ color: 'red', fontWeight: 'bold', marginTop: 18 }}>{error}</div>}
      </form>
    </div>
  );
} 