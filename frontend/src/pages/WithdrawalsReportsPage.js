import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';

const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #b6c6e3', fontSize: 16, background: '#fafdff', marginBottom: 2, height: 44 };
const labelStyle = { fontWeight: 'bold', color: '#1976d2', marginBottom: 4, display: 'block', fontSize: 15 };
const tabBtnStyle = isActive => ({ background: isActive ? '#1976d2' : '#fff', color: isActive ? '#fff' : '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '10px 24px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginLeft: 8, marginBottom: 18, boxShadow: isActive ? '0 1px 4px #e3eaf3' : 'none' });

export default function WithdrawalsReportsPage() {
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [materialBalance, setMaterialBalance] = useState([]);
  const [summaryCustomer, setSummaryCustomer] = useState([]);
  const [summaryMaterial, setSummaryMaterial] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', customer_id: '', material_id: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('filtered');

  useEffect(() => {
    fetchCustomers();
    fetchMaterials();
    fetchAllReports();
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setCustomers(res.data);
    } catch {}
  };
  const fetchMaterials = async () => {
    try {
      const res = await axios.get('/api/inventory', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setMaterials(res.data);
    } catch {}
  };
  const fetchAllReports = async () => {
    setLoading(true);
    try {
      if (activeTab === 'filtered') {
        const params = {};
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        if (filters.customer_id) params.customer_id = filters.customer_id;
        if (filters.material_id) params.material_id = filters.material_id;
        const res = await axios.get('/api/reports/withdrawals', { params, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
        setWithdrawals(res.data);
      } else if (activeTab === 'material-balance') {
        const res = await axios.get('/api/reports/withdrawals/material-balance', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
        setMaterialBalance(res.data);
      } else if (activeTab === 'summary-customer') {
        const res = await axios.get('/api/reports/withdrawals/summary?by=customer', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
        setSummaryCustomer(res.data);
      } else if (activeTab === 'summary-material') {
        const res = await axios.get('/api/reports/withdrawals/summary?by=material', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
        setSummaryMaterial(res.data);
      }
    } catch {}
    setLoading(false);
  };

  const handleFilterChange = e => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = e => {
    e.preventDefault();
    fetchAllReports();
  };

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: 24, background: '#f7fafd', borderRadius: 18, boxShadow: '0 4px 24px #e3eaf3', direction: 'rtl', fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
      <NavBar />
      <h2 style={{ textAlign: 'center', marginBottom: 18, color: '#1976d2', fontWeight: 'bold', fontSize: 32 }}>تقارير السحوبات من المخزون</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button style={tabBtnStyle(activeTab === 'filtered')} onClick={() => setActiveTab('filtered')}>سحوبات مفلترة</button>
        <button style={tabBtnStyle(activeTab === 'material-balance')} onClick={() => setActiveTab('material-balance')}>رصيد كل مادة بعد كل سحب</button>
        <button style={tabBtnStyle(activeTab === 'summary-customer')} onClick={() => setActiveTab('summary-customer')}>إجمالي السحوبات لكل عميل</button>
        <button style={tabBtnStyle(activeTab === 'summary-material')} onClick={() => setActiveTab('summary-material')}>إجمالي السحوبات لكل مادة</button>
      </div>
      {activeTab === 'filtered' && (
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: 18, marginBottom: 32, background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 1px 4px #e3eaf3', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>من تاريخ</label>
            <input type="date" name="from" value={filters.from} onChange={handleFilterChange} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>إلى تاريخ</label>
            <input type="date" name="to" value={filters.to} onChange={handleFilterChange} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>العميل</label>
            <select name="customer_id" value={filters.customer_id} onChange={handleFilterChange} style={inputStyle}>
              <option value="">الكل</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>المادة</label>
            <select name="material_id" value={filters.material_id} onChange={handleFilterChange} style={inputStyle}>
              <option value="">الكل</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.material_name}</option>
              ))}
            </select>
          </div>
          <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 32px', fontSize: 18, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 4px #e3eaf3' }}>
            بحث
          </button>
        </form>
      )}
      {activeTab === 'filtered' && (
        <>
          <h4 style={{ marginBottom: 18, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>نتائج السحوبات</h4>
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: 40 }}>جاري التحميل...</div>
          ) : (
            <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 10, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #eee' }}>
              <thead style={{ background: '#1976d2', color: '#fff' }}>
                <tr>
                  <th>العميل</th>
                  <th>المادة</th>
                  <th>الكمية</th>
                  <th>التاريخ</th>
                  <th>ملاحظة</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id}>
                    <td>{w.customer_name}</td>
                    <td>{w.material_name}</td>
                    <td>{w.quantity}</td>
                    <td>{w.date}</td>
                    <td>{w.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      {activeTab === 'material-balance' && (
        <>
          <h4 style={{ marginBottom: 18, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>رصيد كل مادة بعد كل سحب</h4>
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: 40 }}>جاري التحميل...</div>
          ) : (
            <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 10, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #eee' }}>
              <thead style={{ background: '#1976d2', color: '#fff' }}>
                <tr>
                  <th>المادة</th>
                  <th>التاريخ</th>
                  <th>الكمية المسحوبة</th>
                  <th>الرصيد بعد السحب</th>
                </tr>
              </thead>
              <tbody>
                {materialBalance.map(r => (
                  <tr key={r.id}>
                    <td>{r.material_name}</td>
                    <td>{r.date}</td>
                    <td>{r.quantity}</td>
                    <td>{r.balance_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      {activeTab === 'summary-customer' && (
        <>
          <h4 style={{ marginBottom: 18, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>إجمالي السحوبات لكل عميل</h4>
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: 40 }}>جاري التحميل...</div>
          ) : (
            <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 10, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #eee' }}>
              <thead style={{ background: '#1976d2', color: '#fff' }}>
                <tr>
                  <th>العميل</th>
                  <th>إجمالي الكمية المسحوبة</th>
                </tr>
              </thead>
              <tbody>
                {summaryCustomer.map(r => (
                  <tr key={r.customer_id}>
                    <td>{r.customer_name}</td>
                    <td>{r.total_withdrawn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      {activeTab === 'summary-material' && (
        <>
          <h4 style={{ marginBottom: 18, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>إجمالي السحوبات لكل مادة</h4>
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: 40 }}>جاري التحميل...</div>
          ) : (
            <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 10, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #eee' }}>
              <thead style={{ background: '#1976d2', color: '#fff' }}>
                <tr>
                  <th>المادة</th>
                  <th>إجمالي الكمية المسحوبة</th>
                </tr>
              </thead>
              <tbody>
                {summaryMaterial.map(r => (
                  <tr key={r.material_id}>
                    <td>{r.material_name}</td>
                    <td>{r.total_withdrawn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
} 