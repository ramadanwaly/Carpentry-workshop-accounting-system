import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function getUsernameFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || null;
  } catch {
    return null;
  }
}

function HomePage() {
  const navigate = useNavigate();
  const username = getUsernameFromToken();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 32, background: '#f9f9f9', borderRadius: 16, boxShadow: '0 2px 12px #eee', textAlign: 'center', direction: 'rtl', fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        {username && <span style={{ color: '#1976d2', fontWeight: 'bold' }}>مرحبًا {username}</span>}
        <button onClick={handleLogout} style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontSize: 15, cursor: 'pointer' }}>تسجيل الخروج</button>
      </div>
      <h2 style={{ marginBottom: 32, color: '#1976d2' }}>الصفحة الرئيسية</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Link to="/sales" style={linkStyle}>صفحة المبيعات</Link>
        <Link to="/customers" style={linkStyle}>صفحة العملاء</Link>
        <Link to="/expenses" style={linkStyle}>صفحة المصروفات</Link>
        <Link to="/inventory" style={linkStyle}>صفحة المخزون</Link>
      </div>
    </div>
  );
}

const linkStyle = {
  background: '#1976d2',
  color: '#fff',
  padding: '14px 0',
  borderRadius: 8,
  textDecoration: 'none',
  fontSize: 20,
  fontWeight: 'bold',
  transition: 'background 0.2s',
  margin: '0 0 8px 0',
  boxShadow: '0 1px 4px #ddd',
  display: 'block'
};

export default HomePage; 