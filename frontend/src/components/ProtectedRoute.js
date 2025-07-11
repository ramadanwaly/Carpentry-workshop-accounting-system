import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // إذا لم يكن هناك توكن، توجيه إلى صفحة تسجيل الدخول
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default ProtectedRoute; 