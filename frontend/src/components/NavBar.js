import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();
  const navs = [
    { to: '/', label: 'الرئيسية' },
    { to: '/sales', label: 'المبيعات' },
    { to: '/customers', label: 'العملاء' },
    { to: '/expenses', label: 'المصروفات' },
    { to: '/inventory', label: 'المخزون' },
    { to: '/withdrawals', label: 'سحب من المخزون' },
    { to: '/settings', label: 'الإعدادات' },
    { to: '/incomes', label: 'الإيرادات' },
    { to: '/financial-reports', label: 'التقارير المالية' },
  ];
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 24, justifyContent: 'center', direction: 'rtl' }}>
      {navs.map(nav => (
        <Link
          key={nav.to}
          to={nav.to}
          style={{
            background: location.pathname === nav.to ? '#1976d2' : '#eee',
            color: location.pathname === nav.to ? '#fff' : '#1976d2',
            padding: '8px 18px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: 16,
            border: 'none',
            boxShadow: '0 1px 4px #ddd',
            transition: 'background 0.2s',
          }}
        >
          {nav.label}
        </Link>
      ))}
    </div>
  );
} 