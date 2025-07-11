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
    navigate('/');
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 32, background: '#f7fafd', borderRadius: 18, boxShadow: '0 4px 24px #e3eaf3', direction: 'rtl', fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        {username && <span style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 18 }}>مرحبًا {username}</span>}
        <button onClick={handleLogout} style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>تسجيل الخروج</button>
      </div>
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#1976d2', fontWeight: 'bold', fontSize: 32 }}>لوحة التحكم</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
        <Link to="/sales" style={linkStyle} className="dashboard-link">
          <div style={{ fontSize: 24, marginBottom: 8 }}>💰</div>
          <div>صفحة المبيعات</div>
        </Link>
        <Link to="/customers" style={linkStyle} className="dashboard-link">
          <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
          <div>صفحة العملاء</div>
        </Link>
        <Link to="/expenses" style={linkStyle} className="dashboard-link">
          <div style={{ fontSize: 24, marginBottom: 8 }}>💸</div>
          <div>صفحة المصروفات</div>
        </Link>
        <Link to="/inventory" style={linkStyle} className="dashboard-link">
          <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
          <div>صفحة المخزون</div>
        </Link>
        <Link to="/incomes" style={linkStyle} className="dashboard-link">
          <div style={{ fontSize: 24, marginBottom: 8 }}>📈</div>
          <div>صفحة الإيرادات</div>
        </Link>
        <Link to="/withdrawals" style={linkStyle} className="dashboard-link">
          <div style={{ fontSize: 24, marginBottom: 8 }}>📤</div>
          <div>سحب من المخزون</div>
        </Link>
        <Link to="/withdrawals-reports" style={linkStyle} className="dashboard-link">
          <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
          <div>تقارير السحوبات</div>
        </Link>
        <Link to="/financial-reports" style={linkStyle} className="dashboard-link">
          <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
          <div>التقارير المالية</div>
        </Link>
        <Link to="/settings" style={linkStyle} className="dashboard-link">
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚙️</div>
          <div>الإعدادات</div>
        </Link>
      </div>
      <style>
        {`
          .dashboard-link:hover {
            transform: translateY(-4px) !important;
            box-shadow: 0 4px 16px #1976d2 !important;
            border: 2px solid #1976d2 !important;
          }
        `}
      </style>
    </div>
  );
}

const linkStyle = {
  background: '#fff',
  color: '#1976d2',
  padding: '24px',
  borderRadius: 12,
  textDecoration: 'none',
  fontSize: 18,
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  textAlign: 'center',
  boxShadow: '0 2px 8px #e3eaf3',
  border: '2px solid transparent',
  display: 'block'
};

export default HomePage; 