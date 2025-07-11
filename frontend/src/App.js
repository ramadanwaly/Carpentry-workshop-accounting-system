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
import ProtectedRoute from './components/ProtectedRoute';
// يمكنك إضافة صفحات أخرى لاحقًا

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/sales" element={
          <ProtectedRoute>
            <SalesPage />
          </ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute>
            <CustomersPage />
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/withdrawals" element={
          <ProtectedRoute>
            <WithdrawalsPage />
          </ProtectedRoute>
        } />
        <Route path="/withdrawals-reports" element={
          <ProtectedRoute>
            <WithdrawalsReportsPage />
          </ProtectedRoute>
        } />
        <Route path="/incomes" element={
          <ProtectedRoute>
            <IncomesPage />
          </ProtectedRoute>
        } />
        <Route path="/financial-reports" element={
          <ProtectedRoute>
            <FinancialReportsPage />
          </ProtectedRoute>
        } />
        {/* صفحات أخرى مثل العملاء يمكن إضافتها هنا */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;