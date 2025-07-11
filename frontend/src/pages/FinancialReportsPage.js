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
  const [error, setError] = useState('');
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
    console.log('useEffect triggered with from:', from, 'to:', to);
    console.log('Current token in localStorage:', localStorage.getItem('token'));
    
    if (!localStorage.getItem('token')) {
      setError('لم يتم العثور على رمز الدخول. يرجى تسجيل الدخول مرة أخرى.');
      return;
    }
    
    fetchTotals();
    fetchChartData();
    // eslint-disable-next-line
  }, [from, to]);

  const fetchTotals = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      console.log('Token length:', token ? token.length : 0);
      console.log('Fetching data for period:', { from, to });
      
      if (!token) {
        throw new Error('لم يتم العثور على رمز الدخول');
      }
      
      const [incomes, expenses, profit, sales, withdrawals] = await Promise.all([
        axios.get('/api/reports/incomes', { params: { from, to }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/expenses', { params: { from, to }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/profit', { params: { from, to }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/sales', { params: { from, to }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/withdrawals/summary', { params: { from, to }, headers: { Authorization: 'Bearer ' + token } }),
      ]);
      
      console.log('Incomes response:', incomes.data);
      console.log('Expenses response:', expenses.data);
      console.log('Profit response:', profit.data);
      console.log('Sales response:', sales.data);
      console.log('Withdrawals response:', withdrawals.data);
      
      setTotals({
        incomes: incomes.data.total_incomes,
        incomesBySource: incomes.data.by_source,
        expenses: expenses.data.total_expenses,
        profit: profit.data.net_profit,
        sales: sales.data.total_sales,
        withdrawals: withdrawals.data.total_withdrawals,
      });
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(`حدث خطأ في تحميل البيانات: ${error.response?.data?.message || error.message}`);
      // إعادة تعيين البيانات إلى القيم الافتراضية في حالة الخطأ
      setTotals({ incomes: 0, expenses: 0, sales: 0, withdrawals: 0, profit: 0, incomesBySource: [] });
    }
    setLoading(false);
  };

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const group_by = period === 'year' ? 'year' : period === 'month' ? 'month' : 'day';
      console.log('Fetching chart data with group_by:', group_by);
      
      if (!token) {
        throw new Error('لم يتم العثور على رمز الدخول');
      }
      
      const [incomes, expenses, sales, withdrawals] = await Promise.all([
        axios.get('/api/reports/incomes/grouped', { params: { from, to, group_by }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/expenses/grouped', { params: { from, to, group_by }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/sales/grouped', { params: { from, to, group_by }, headers: { Authorization: 'Bearer ' + token } }),
        axios.get('/api/reports/withdrawals/grouped', { params: { from, to, group_by }, headers: { Authorization: 'Bearer ' + token } }),
      ]);
      
      console.log('Chart data responses:', {
        incomes: incomes.data,
        expenses: expenses.data,
        sales: sales.data,
        withdrawals: withdrawals.data
      });
      
      // دمج البيانات حسب الفترة
      const periodsSet = new Set([
        ...incomes.data.map(d => d.period),
        ...expenses.data.map(d => d.period),
        ...sales.data.map(d => d.period),
        ...withdrawals.data.map(d => d.period),
      ]);
      const allPeriods = Array.from(periodsSet).sort();
      const data = allPeriods.map(period => {
        const periodIncomes = incomes.data.find(d => d.period === period)?.total || 0;
        const periodExpenses = expenses.data.find(d => d.period === period)?.total || 0;
        const periodSales = sales.data.find(d => d.period === period)?.total || 0;
        const periodWithdrawals = withdrawals.data.find(d => d.period === period)?.total || 0;
        
        // تنسيق الفترة للعرض
        let displayPeriod = period;
        if (group_by === 'month') {
          const [year, month] = period.split('-');
          const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
          displayPeriod = `${monthNames[parseInt(month) - 1]} ${year}`;
        } else if (group_by === 'year') {
          displayPeriod = `سنة ${period}`;
        }
        
        return {
          period: displayPeriod,
          originalPeriod: period,
          incomes: periodIncomes,
          expenses: periodExpenses,
          sales: periodSales,
          withdrawals: periodWithdrawals,
          profit: periodIncomes - periodExpenses,
        };
      });
      console.log('Processed chart data:', data);
      setChartData(data);
    } catch (error) {
      console.error('خطأ في جلب بيانات الرسم البياني:', error);
      console.error('Chart error response:', error.response?.data);
      console.error('Chart error status:', error.response?.status);
      setError(`حدث خطأ في تحميل بيانات الرسم البياني: ${error.response?.data?.message || error.message}`);
      setChartData([]);
    }
    setLoading(false);
  };

  const cardStyle = color => ({ 
    background: color, 
    color: '#fff', 
    borderRadius: 14, 
    padding: 24, 
    textAlign: 'center', 
    fontWeight: 'bold', 
    fontSize: 22, 
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
    transition: 'transform 0.2s ease-in-out',
    cursor: 'pointer',
    minHeight: 120,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  });

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '40px auto', 
      padding: 24, 
      background: 'linear-gradient(135deg, #f7fafd 0%, #e3f2fd 100%)', 
      borderRadius: 18, 
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)', 
      direction: 'rtl', 
      fontFamily: 'Cairo, Tajawal, Arial, sans-serif',
      minHeight: '100vh'
    }}>
      <NavBar />
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: 32, 
        color: '#1976d2', 
        fontWeight: 'bold', 
        fontSize: 32,
        textShadow: '0 2px 4px rgba(25, 118, 210, 0.1)',
        position: 'relative'
      }}>
        📊 التقارير المالية
      </h2>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 16, 
        fontSize: 12, 
        color: '#666',
        background: '#f5f5f5',
        padding: '8px',
        borderRadius: '4px',
        fontFamily: 'monospace'
      }}>
        Token: {localStorage.getItem('token') ? '✅ موجود' : '❌ غير موجود'} | 
        Length: {localStorage.getItem('token') ? localStorage.getItem('token').length : 0} | 
        Data: {totals.incomes > 0 ? '✅ محملة' : '❌ فارغة'} | 
        Period: {from} إلى {to} | 
        Loading: {loading ? '⏳ جاري' : '✅ مكتمل'} | 
        Chart: {chartData.length} نقطة | 
        Values: I:{(totals.incomes || 0).toLocaleString()} E:{(totals.expenses || 0).toLocaleString()} S:{(totals.sales || 0).toLocaleString()}
      </div>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 16 
      }}>
        <button 
          onClick={() => {
            console.log('=== DEBUG INFO ===');
            console.log('Token:', localStorage.getItem('token'));
            console.log('Token length:', localStorage.getItem('token') ? localStorage.getItem('token').length : 0);
            console.log('Current totals:', totals);
            console.log('Current chartData:', chartData);
            console.log('Current period:', { from, to });
            console.log('Current loading state:', loading);
            console.log('Current error state:', error);
            console.log('==================');
          }}
          style={{
            background: '#ff9800',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 'bold'
          }}
                  >
            🐛 Debug
          </button>
          <button 
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                console.log('Testing direct API call with token:', token);
                const response = await axios.get('/api/reports/incomes', { 
                  params: { from, to }, 
                  headers: { Authorization: 'Bearer ' + token } 
                });
                console.log('Direct API call successful:', response.data);
                alert(`نجح الطلب! الإيرادات: ${response.data.total_incomes}`);
              } catch (error) {
                console.error('Direct API call failed:', error);
                alert(`فشل الطلب: ${error.response?.data?.message || error.message}`);
              }
            }}
            style={{
              background: '#9c27b0',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              marginLeft: 4
            }}
                      >
              🧪 Test API
            </button>
            <button 
              onClick={() => {
                const token = localStorage.getItem('token');
                if (token) {
                  navigator.clipboard.writeText(token);
                  alert('تم نسخ التوكن إلى الحافظة!');
                } else {
                  alert('لا يوجد توكن!');
                }
              }}
              style={{
                background: '#607d8b',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 'bold',
                marginLeft: 4
              }}
            >
              📋 Copy Token
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                alert('تم حذف التوكن! يرجى تسجيل الدخول مرة أخرى.');
                window.location.reload();
              }}
              style={{
                background: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 'bold',
                marginLeft: 4
              }}
            >
              🗑️ Clear Token
            </button>
      </div>
            {error && (
        <div style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: '16px 20px', 
          borderRadius: 8, 
          marginBottom: 24, 
          textAlign: 'center',
          fontWeight: 'bold',
          border: '1px solid #ffcdd2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          flexWrap: 'wrap'
        }}>
          ⚠️ {error}
          <button 
            onClick={() => {
              setError('');
              fetchTotals();
              fetchChartData();
            }}
            style={{
              background: '#c62828',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              marginLeft: 12,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 2px 4px rgba(198, 40, 40, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#b71c1c';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#c62828';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🔄 إعادة المحاولة
          </button>
          <button 
            onClick={async () => {
              console.log('Current token:', localStorage.getItem('token'));
              console.log('Current totals:', totals);
              console.log('Current chartData:', chartData);
              
              // تجربة طلب مباشر
              try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/reports/incomes', { 
                  params: { from, to }, 
                  headers: { Authorization: 'Bearer ' + token } 
                });
                console.log('Direct API test response:', response.data);
                alert('الطلب نجح! راجع وحدة التحكم للحصول على التفاصيل.');
              } catch (error) {
                console.error('Direct API test error:', error);
                alert(`فشل الطلب: ${error.response?.data?.message || error.message}`);
              }
            }}
            style={{
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              marginLeft: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 2px 4px rgba(25, 118, 210, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#1565c0';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#1976d2';
              e.target.style.transform = 'translateY(0)';
            }}
                      >
              🔍 تشخيص
            </button>
            <button 
              onClick={async () => {
                try {
                  const response = await axios.post('/api/login', { 
                    username: 'admin', 
                    password: '123456' 
                  });
                  localStorage.setItem('token', response.data.token);
                  console.log('Re-login successful, new token:', response.data.token);
                  alert('تم تسجيل الدخول مرة أخرى بنجاح!');
                  // إعادة تحميل البيانات
                  fetchTotals();
                  fetchChartData();
                } catch (error) {
                  console.error('Re-login error:', error);
                  alert(`فشل تسجيل الدخول: ${error.response?.data?.message || error.message}`);
                }
              }}
              style={{
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                marginLeft: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#388e3c';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#4caf50';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🔑 إعادة تسجيل الدخول
            </button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        {periods.map(p => (
          <button 
            key={p.value} 
            onClick={() => setPeriod(p.value)} 
            style={{ 
              background: period === p.value ? '#1976d2' : '#fff', 
              color: period === p.value ? '#fff' : '#1976d2', 
              border: '2px solid #1976d2', 
              borderRadius: 8, 
              padding: '12px 24px', 
              fontSize: 16, 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              marginLeft: 8, 
              marginBottom: 8,
              transition: 'all 0.2s ease-in-out',
              boxShadow: period === p.value ? '0 4px 8px rgba(25, 118, 210, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (period !== p.value) {
                e.target.style.background = '#e3f2fd';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (period !== p.value) {
                e.target.style.background = '#fff';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div style={{ display: 'flex', gap: 18, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ color: '#1976d2', fontWeight: 'bold', display: 'block', marginBottom: 8 }}>من تاريخ</label>
            <input 
              type="date" 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
              style={{ 
                ...cardStyle('#fff'), 
                color: '#1976d2', 
                minWidth: 150, 
                fontSize: 16, 
                padding: 12,
                border: '2px solid #e3eaf3'
              }} 
            />
          </div>
          <div>
            <label style={{ color: '#1976d2', fontWeight: 'bold', display: 'block', marginBottom: 8 }}>إلى تاريخ</label>
            <input 
              type="date" 
              value={to} 
              onChange={e => setTo(e.target.value)} 
              style={{ 
                ...cardStyle('#fff'), 
                color: '#1976d2', 
                minWidth: 150, 
                fontSize: 16, 
                padding: 12,
                border: '2px solid #e3eaf3'
              }} 
            />
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32, maxWidth: '100%' }}>
        <div 
          style={cardStyle(cardColors.incomes)}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <div>إجمالي الإيرادات</div>
          <div style={{ fontSize: 28 }}>{(totals.incomes || 0).toLocaleString()} ج.م</div>
        </div>
        <div 
          style={cardStyle(cardColors.expenses)}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <div>إجمالي المصروفات</div>
          <div style={{ fontSize: 28 }}>{(totals.expenses || 0).toLocaleString()} ج.م</div>
        </div>
        <div 
          style={cardStyle(cardColors.sales)}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <div>إجمالي المبيعات</div>
          <div style={{ fontSize: 28 }}>{(totals.sales || 0).toLocaleString()} ج.م</div>
        </div>
        <div 
          style={cardStyle(cardColors.withdrawals)}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <div>إجمالي السحوبات</div>
          <div style={{ fontSize: 28 }}>{(totals.withdrawals || 0).toLocaleString()} وحدة</div>
        </div>
        <div 
          style={cardStyle(cardColors.profit)}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <div>صافي الربح</div>
          <div style={{ fontSize: 28 }}>{(totals.profit || 0).toLocaleString()} ج.م</div>
        </div>
      </div>
      {/* رسم بياني مع تبديل النوع */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: 32 }}>
        <h4 style={{ 
          color: '#1976d2', 
          fontWeight: 'bold', 
          marginBottom: 18,
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          📊 الرسم البياني
        </h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
          <button 
            onClick={() => setChartType('bar')} 
            style={{ 
              background: chartType === 'bar' ? '#1976d2' : '#fff', 
              color: chartType === 'bar' ? '#fff' : '#1976d2', 
              border: '2px solid #1976d2', 
              borderRadius: 8, 
              padding: '10px 24px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: chartType === 'bar' ? '0 4px 8px rgba(25, 118, 210, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (chartType !== 'bar') {
                e.target.style.background = '#e3f2fd';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (chartType !== 'bar') {
                e.target.style.background = '#fff';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            رسم عمودي
          </button>
          <button 
            onClick={() => setChartType('pie')} 
            style={{ 
              background: chartType === 'pie' ? '#1976d2' : '#fff', 
              color: chartType === 'pie' ? '#fff' : '#1976d2', 
              border: '2px solid #1976d2', 
              borderRadius: 8, 
              padding: '10px 24px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: chartType === 'pie' ? '0 4px 8px rgba(25, 118, 210, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (chartType !== 'pie') {
                e.target.style.background = '#e3f2fd';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (chartType !== 'pie') {
                e.target.style.background = '#fff';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            رسم دائري
          </button>
        </div>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            margin: 40, 
            fontSize: 18, 
            color: '#1976d2',
            padding: '20px',
            background: '#e3f2fd',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}>
            ⏳ جاري التحميل...
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            margin: 40, 
            fontSize: 16, 
            color: '#666',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: 8,
            border: '2px dashed #dee2e6'
          }}>
            📊 لا توجد بيانات متاحة للفترة المحددة
          </div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 16, right: 24, left: 24, bottom: 16 }}>
              <XAxis dataKey="period" fontSize={14} />
              <YAxis fontSize={14} />
              <Tooltip formatter={(value) => [value.toLocaleString(), 'القيمة']} />
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
              <Pie 
                data={[
                  { name: 'الإيرادات', value: totals.incomes || 0 },
                  { name: 'المصروفات', value: totals.expenses || 0 },
                  { name: 'المبيعات', value: totals.sales || 0 },
                  { name: 'السحوبات', value: totals.withdrawals || 0 }
                ].filter(item => item.value > 0)} 
                dataKey="value" 
                nameKey="name"
                cx="50%" 
                cy="50%" 
                outerRadius={100} 
                fill={cardColors.incomes} 
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {[
                  { name: 'الإيرادات', value: totals.incomes || 0 },
                  { name: 'المصروفات', value: totals.expenses || 0 },
                  { name: 'المبيعات', value: totals.sales || 0 },
                  { name: 'السحوبات', value: totals.withdrawals || 0 }
                ].filter(item => item.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value.toLocaleString(), 'القيمة']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
              {/* توزيع الإيرادات حسب المصدر */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: 32 }}>
                  <h4 style={{ 
            color: '#1976d2', 
            fontWeight: 'bold', 
            marginBottom: 18,
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            📈 توزيع الإيرادات حسب المصدر
          </h4>
        <table style={{ 
          width: '100%', 
          background: '#fff', 
          borderRadius: 8, 
          overflow: 'hidden', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderCollapse: 'collapse'
        }}>
          <thead style={{ background: '#388e3c', color: '#fff' }}>
            <tr>
              <th style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', fontSize: 16 }}>المصدر</th>
              <th style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', fontSize: 16 }}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {totals.incomesBySource && totals.incomesBySource.length > 0 ? (
              totals.incomesBySource.map((row, idx) => (
                <tr key={row.source_type} style={{ 
                  background: idx % 2 === 0 ? '#f8f9fa' : '#fff',
                  transition: 'background-color 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => e.target.parentElement.style.background = '#e3f2fd'}
                onMouseLeave={(e) => e.target.parentElement.style.background = idx % 2 === 0 ? '#f8f9fa' : '#fff'}
                >
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>{row.source_type}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#388e3c' }}>{(row.total || 0).toLocaleString()} ج.م</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{ 
                  textAlign: 'center', 
                  color: '#666', 
                  padding: '32px',
                  fontSize: 16,
                  fontStyle: 'italic',
                  background: '#f8f9fa',
                  border: '2px dashed #dee2e6',
                  borderRadius: '8px'
                }}>
                  📊 لا توجد بيانات متاحة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 