import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';
// سنستخدم Recharts للرسم البياني
// إذا لم تكن مثبتة، يجب تثبيتها: npm install recharts
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const cardColors = {
  incomes: '#388e3c',
  expenses: '#d32f2f',
  sales: '#1976d2',
  withdrawals: '#f9a825',
  profit: '#6d4c41',
};

const chartColors = ['#388e3c', '#d32f2f', '#1976d2', '#f9a825', '#6d4c41'];

const periods = [
  { label: 'أسبوعي', value: 'week' },
  { label: 'شهري', value: 'month' },
  { label: 'سنوي', value: 'year' },
  { label: 'مخصص', value: 'custom' },
];

function getPeriodDates(period) {
  const today = new Date();
  let from, to;
  to = today.toISOString().slice(0, 10);
  if (period === 'week') {
    const first = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    from = first.toISOString().slice(0, 10);
  } else if (period === 'month') {
    from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  } else if (period === 'year') {
    from = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
  } else {
    from = '';
    to = '';
  }
  return { from, to };
}

export default function FinancialReportsPage() {
  const [period, setPeriod] = useState('month');
  const [from, setFrom] = useState(getPeriodDates('month').from);
  const [to, setTo] = useState(getPeriodDates('month').to);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({ incomes: 0, expenses: 0, sales: 0, withdrawals: 0, profit: 0, incomesBySource: [] });
  const [chartType, setChartType] = useState('bar');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const { from: f, to: t } = getPeriodDates(period);
    if (period !== 'custom') {
      setFrom(f);
      setTo(t);
    }
  }, [period]);

  useEffect(() => {
    fetchTotals();
    fetchChartData();
    // eslint-disable-next-line
  }, [from, to]);

  const fetchTotals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [incomes, expenses, profit, sales, withdrawals] = await Promise.all([
        axios.get('/api/reports/incomes', { params: { from, to }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/expenses', { params: { from, to }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/profit', { params: { from, to }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/sales', { params: { from, to }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/withdrawals/summary', { params: { from, to }, headers: { Authorization: 'Bearer ' + token } }),
      ]);
      setTotals({
        incomes: incomes.data.total_incomes,
        incomesBySource: incomes.data.by_source,
        expenses: expenses.data.total_expenses,
        profit: profit.data.net_profit,
        sales: sales.data.total_sales,
        withdrawals: withdrawals.data.total_withdrawals,
      });
    } catch {}
    setLoading(false);
  };

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const group_by = period === 'year' ? 'year' : period === 'month' ? 'month' : 'day';
      const [incomes, expenses, sales, withdrawals] = await Promise.all([
        axios.get('/api/reports/incomes/grouped', { params: { from, to, group_by }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/expenses/grouped', { params: { from, to, group_by }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/sales/grouped', { params: { from, to, group_by }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/withdrawals/grouped', { params: { from, to, group_by }, headers: { Authorization: 'Bearer ' + token } }),
      ]);
      // دمج البيانات حسب الفترة
      const periodsSet = new Set([
        ...incomes.data.map(d => d.period),
        ...expenses.data.map(d => d.period),
        ...sales.data.map(d => d.period),
        ...withdrawals.data.map(d => d.period),
      ]);
      const allPeriods = Array.from(periodsSet).sort();
      const data = allPeriods.map(period => ({
        period,
        incomes: incomes.data.find(d => d.period === period)?.total || 0,
        expenses: expenses.data.find(d => d.period === period)?.total || 0,
        sales: sales.data.find(d => d.period === period)?.total || 0,
        withdrawals: withdrawals.data.find(d => d.period === period)?.total || 0,
        profit:
          (incomes.data.find(d => d.period === period)?.total || 0) -
          (expenses.data.find(d => d.period === period)?.total || 0),
      }));
      setChartData(data);
    } catch {}
    setLoading(false);
  };

  const cardStyle = color => ({ background: color, color: '#fff', borderRadius: 14, padding: 24, minWidth: 180, textAlign: 'center', fontWeight: 'bold', fontSize: 22, boxShadow: '0 2px 8px #e3eaf3', margin: 8 });

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 24, background: '#f7fafd', borderRadius: 18, boxShadow: '0 4px 24px #e3eaf3', direction: 'rtl', fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
      <NavBar />
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#1976d2', fontWeight: 'bold', fontSize: 32 }}>التقارير المالية</h2>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        {periods.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)} style={{ background: period === p.value ? '#1976d2' : '#fff', color: period === p.value ? '#fff' : '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '10px 24px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginLeft: 8, marginBottom: 8 }}>
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div style={{ display: 'flex', gap: 18, marginBottom: 24, justifyContent: 'center' }}>
          <div>
            <label style={{ color: '#1976d2', fontWeight: 'bold' }}>من تاريخ</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ ...cardStyle('#fff'), color: '#1976d2', minWidth: 120, fontSize: 16, padding: 8 }} />
          </div>
          <div>
            <label style={{ color: '#1976d2', fontWeight: 'bold' }}>إلى تاريخ</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ ...cardStyle('#fff'), color: '#1976d2', minWidth: 120, fontSize: 16, padding: 8 }} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={cardStyle(cardColors.incomes)}>
          <div>إجمالي الإيرادات</div>
          <div style={{ fontSize: 28 }}>{totals.incomes} ج.م</div>
        </div>
        <div style={cardStyle(cardColors.expenses)}>
          <div>إجمالي المصروفات</div>
          <div style={{ fontSize: 28 }}>{totals.expenses} ج.م</div>
        </div>
        <div style={cardStyle(cardColors.sales)}>
          <div>إجمالي المبيعات</div>
          <div style={{ fontSize: 28 }}>{totals.sales} ج.م</div>
        </div>
        <div style={cardStyle(cardColors.withdrawals)}>
          <div>إجمالي السحوبات</div>
          <div style={{ fontSize: 28 }}>{totals.withdrawals} وحدة</div>
        </div>
        <div style={cardStyle(cardColors.profit)}>
          <div>صافي الربح</div>
          <div style={{ fontSize: 28 }}>{totals.profit} ج.م</div>
        </div>
      </div>
      {/* رسم بياني مع تبديل النوع */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #e3eaf3', marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
          <button onClick={() => setChartType('bar')} style={{ background: chartType === 'bar' ? '#1976d2' : '#fff', color: chartType === 'bar' ? '#fff' : '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '8px 24px', fontWeight: 'bold', cursor: 'pointer' }}>رسم عمودي</button>
          <button onClick={() => setChartType('pie')} style={{ background: chartType === 'pie' ? '#1976d2' : '#fff', color: chartType === 'pie' ? '#fff' : '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '8px 24px', fontWeight: 'bold', cursor: 'pointer' }}>رسم دائري</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', margin: 40 }}>جاري التحميل...</div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 16, right: 24, left: 24, bottom: 16 }}>
              <XAxis dataKey="period" fontSize={14} />
              <YAxis fontSize={14} />
              <Tooltip />
              <Legend />
              <Bar dataKey="incomes" fill={cardColors.incomes} name="الإيرادات" />
              <Bar dataKey="expenses" fill={cardColors.expenses} name="المصروفات" />
              <Bar dataKey="sales" fill={cardColors.sales} name="المبيعات" />
              <Bar dataKey="withdrawals" fill={cardColors.withdrawals} name="السحوبات" />
              <Bar dataKey="profit" fill={cardColors.profit} name="صافي الربح" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={chartData} dataKey="incomes" name="الإيرادات" cx="50%" cy="50%" outerRadius={80} fill={cardColors.incomes} label />
              <Pie data={chartData} dataKey="expenses" name="المصروفات" cx="50%" cy="50%" innerRadius={90} outerRadius={120} fill={cardColors.expenses} label />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      {/* توزيع الإيرادات حسب المصدر */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px #e3eaf3', marginBottom: 32 }}>
        <h4 style={{ color: '#1976d2', fontWeight: 'bold', marginBottom: 18 }}>توزيع الإيرادات حسب المصدر</h4>
        <table border="1" cellPadding="8" style={{ width: '100%', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #eee' }}>
          <thead style={{ background: '#388e3c', color: '#fff' }}>
            <tr>
              <th>المصدر</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {totals.incomesBySource && totals.incomesBySource.length > 0 ? (
              totals.incomesBySource.map((row, idx) => (
                <tr key={row.source_type}>
                  <td>{row.source_type}</td>
                  <td>{row.total}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={2}>لا توجد بيانات</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 