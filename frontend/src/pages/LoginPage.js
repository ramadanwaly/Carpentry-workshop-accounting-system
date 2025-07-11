import React, { useState } from 'react';
import axios from 'axios';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:3001/api/login', { username, password });
      // حفظ التوكن في localStorage
      localStorage.setItem('token', res.data.token);
      window.location.href = '/sales'; // الانتقال لصفحة المبيعات بعد الدخول
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', marginTop: 100, direction: 'rtl' }}>
      <h2>تسجيل الدخول</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="اسم المستخدم"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 10 }}
        />
        <button type="submit" style={{ width: '100%' }}>دخول</button>
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
}

export default LoginPage; 