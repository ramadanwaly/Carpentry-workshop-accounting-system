import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SalesPage from './pages/SalesPage';
import CustomersPage from './pages/CustomersPage';
import ExpensesPage from './pages/ExpensesPage';
import InventoryPage from './pages/InventoryPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import WithdrawalsReportsPage from './pages/WithdrawalsReportsPage';
import IncomesPage from './pages/IncomesPage';
import FinancialReportsPage from './pages/FinancialReportsPage';
// يمكنك إضافة صفحات أخرى لاحقًا

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/withdrawals" element={<WithdrawalsPage />} />
        <Route path="/withdrawals-reports" element={<WithdrawalsReportsPage />} />
        <Route path="/incomes" element={<IncomesPage />} />
        <Route path="/financial-reports" element={<FinancialReportsPage />} />
        {/* صفحات أخرى مثل العملاء يمكن إضافتها هنا */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;