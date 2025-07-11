import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';

// إعداد الرابط الأساسي للخادم الخلفي
axios.defaults.baseURL = 'http://localhost:3001';

// إضافة معالج أخطاء عام
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('خطأ في الطلب:', error);
    if (error.response?.status === 401) {
      // إذا انتهت صلاحية التوكن، احذفه وانتقل لصفحة تسجيل الدخول
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
