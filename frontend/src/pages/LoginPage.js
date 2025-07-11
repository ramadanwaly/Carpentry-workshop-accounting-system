import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/login', { username, password });
      // حفظ التوكن في localStorage
      localStorage.setItem('token', res.data.token);
      // التوجيه إلى الصفحة الرئيسية بدلاً من المبيعات
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في تسجيل الدخول');
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: 'auto', 
      marginTop: 100, 
      direction: 'rtl',
      padding: '32px',
      background: '#f7fafd',
      borderRadius: 18,
      boxShadow: '0 4px 24px #e3eaf3',
      fontFamily: 'Cairo, Tajawal, Arial, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#1976d2', fontWeight: 'bold', fontSize: 28 }}>تسجيل الدخول</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 4, display: 'block', fontSize: 15 }}>اسم المستخدم</label>
          <input
            type="text"
            placeholder="اسم المستخدم"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: 8, 
              border: '1px solid #b6c6e3', 
              fontSize: 16, 
              background: '#fafdff',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 4, display: 'block', fontSize: 15 }}>كلمة المرور</label>
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: 8, 
              border: '1px solid #b6c6e3', 
              fontSize: 16, 
              background: '#fafdff',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '14px', 
            background: '#1976d2', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            fontSize: 18, 
            fontWeight: 'bold', 
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 16, textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
      </form>
    </div>
  );
}

export default LoginPage; 