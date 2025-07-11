import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Link, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';

function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // بيانات النموذج
  const [customerId, setCustomerId] = useState('');
  const [orderType, setOrderType] = useState('');
  const [date, setDate] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [customers, setCustomers] = useState([]);
  const [adding, setAdding] = useState(false);

  // بيانات البحث
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchOrderType, setSearchOrderType] = useState('');
  const [searchDate, setSearchDate] = useState('');

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3001/api/sales', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setSales(res.data);
    } catch (err) {
      setError('فشل في جلب المبيعات');
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/customers', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setCustomers(res.data);
    } catch (err) {}
  };

  // إضافة عملية بيع جديدة
  const handleAddSale = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!customerId || !orderType || !date || !amountPaid) {
      setAddError('يرجى إدخال جميع البيانات');
      return;
    }
    if (isNaN(amountPaid) || Number(amountPaid) <= 0) {
      setAddError('المبلغ يجب أن يكون رقمًا أكبر من صفر');
      return;
    }
    setAdding(true);
    try {
      await axios.post('http://localhost:3001/api/sales', {
        customer_id: customerId,
        order_type: orderType,
        date,
        amount_paid: amountPaid
      }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setAddSuccess('تمت إضافة البيع بنجاح');
      setCustomerId('');
      setOrderType('');
      setDate('');
      setAmountPaid('');
      fetchSales();
    } catch (err) {
      setAddError(err.response?.data?.message || 'فشل في إضافة البيع');
    }
    setAdding(false);
  };

  // تصفية المبيعات حسب البحث
  const filteredSales = sales.filter(sale => {
    const customerMatch = searchCustomer ? (sale.customer_name || '').includes(searchCustomer) : true;
    const orderTypeMatch = searchOrderType ? (sale.order_type || '').includes(searchOrderType) : true;
    const dateMatch = searchDate ? (sale.date === searchDate) : true;
    return customerMatch && orderTypeMatch && dateMatch;
  });

  const exportToExcel = () => {
    // تجهيز البيانات
    const data = filteredSales.map(sale => ({
      'اسم العميل': sale.customer_name || '-',
      'نوع الطلب': sale.order_type,
      'التاريخ': sale.date,
      'المبلغ المدفوع': sale.amount_paid
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المبيعات');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(file, 'sales.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Cairo', 'normal'); // إذا كان الخط متوفرًا
    doc.text('تقرير المبيعات', 105, 15, { align: 'center' });
    const tableColumn = ['اسم العميل', 'نوع الطلب', 'التاريخ', 'المبلغ المدفوع'];
    const tableRows = filteredSales.map(sale => [
      sale.customer_name || '-',
      sale.order_type,
      sale.date,
      sale.amount_paid
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { font: 'Cairo', fontStyle: 'normal', halign: 'right' },
      headStyles: { fillColor: [25, 118, 210] }
    });
    doc.save('sales.pdf');
  };

  // أنماط موحدة
  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #b6c6e3', fontSize: 16, background: '#fafdff', marginBottom: 2 };
  const labelStyle = { fontWeight: 'bold', color: '#1976d2', marginBottom: 4, display: 'block', fontSize: 15 };
  const exportBtnStyle = { background: '#388e3c', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 22px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 4px #e3eaf3' };
  const exportBtnStyleRed = { ...exportBtnStyle, background: '#d32f2f' };
  const editBtnStyle = { background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', marginLeft: 4, cursor: 'pointer', fontSize: 15 };
  const deleteBtnStyle = { background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 15 };
  const saveBtnStyle = { background: '#388e3c', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', marginLeft: 4, cursor: 'pointer', fontSize: 15 };
  const cancelBtnStyle = { background: '#888', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 15 };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, background: '#f7fafd', borderRadius: 18, boxShadow: '0 4px 24px #e3eaf3', direction: 'rtl', fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
      <NavBar />
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#1976d2', fontWeight: 'bold', fontSize: 32, letterSpacing: 1 }}>قائمة المبيعات</h2>
      {/* نموذج إضافة بيع جديد */}
      <form onSubmit={handleAddSale} style={{ marginBottom: 36, border: '1px solid #e3eaf3', padding: 28, borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px #e3eaf3' }}>
        <h4 style={{ marginBottom: 20, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>إضافة عملية بيع</h4>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>العميل *</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} required style={inputStyle}>
            <option value="">اختر العميل</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>نوع الطلب *</label>
          <input type="text" value={orderType} onChange={e => setOrderType(e.target.value)} required style={inputStyle} placeholder="نوع الطلب" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>التاريخ *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>المبلغ المدفوع *</label>
          <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} required style={inputStyle} placeholder="المبلغ المدفوع" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 10 }}>
          <button type="submit" disabled={adding} style={{ background: '#1976d2', color: '#fff', padding: '10px 40px', border: 'none', borderRadius: 8, fontSize: 18, fontWeight: 'bold', cursor: adding ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #e3eaf3' }}>
            {adding ? 'جاري الإضافة...' : 'إضافة'}
          </button>
          {addError && <span style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>{addError}</span>}
          {addSuccess && <span style={{ color: 'green', fontWeight: 'bold', fontSize: 16 }}>{addSuccess}</span>}
        </div>
      </form>
      {/* نموذج البحث والتصدير */}
      <div style={{ marginBottom: 24, background: '#f1f6fa', padding: 16, borderRadius: 10, display: 'flex', gap: 18, flexWrap: 'wrap', boxShadow: '0 1px 4px #e3eaf3' }}>
        <input
          type="text"
          placeholder="بحث باسم العميل"
          value={searchCustomer}
          onChange={e => setSearchCustomer(e.target.value)}
          style={{ flex: 1, minWidth: 150, padding: 6, borderRadius: 6 }}
        />
        <input
          type="text"
          placeholder="بحث بنوع الطلب"
          value={searchOrderType}
          onChange={e => setSearchOrderType(e.target.value)}
          style={{ flex: 1, minWidth: 150, padding: 6, borderRadius: 6 }}
        />
        <input
          type="date"
          placeholder="بحث بالتاريخ"
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          style={{ flex: 1, minWidth: 130, padding: 6, borderRadius: 6 }}
        />
        <button onClick={exportToExcel} style={exportBtnStyle}>تصدير النتائج إلى Excel</button>
        <button onClick={exportToPDF} style={exportBtnStyleRed}>تصدير النتائج إلى PDF</button>
        <div style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 15, flexBasis: '100%' }}>
          سيتم تصدير النتائج المعروضة فقط (بعد التصفية/البحث/الاختيار)
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <span className="loader" style={{ display: 'inline-block', width: 32, height: 32, border: '4px solid #ccc', borderTop: '4px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 20, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #eee' }}>
          <thead style={{ background: '#1976d2', color: '#fff' }}>
            <tr>
              <th>اسم العميل</th>
              <th>نوع الطلب</th>
              <th>التاريخ</th>
              <th>المبلغ المدفوع</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.customer_name || '-'}</td>
                <td>{sale.order_type}</td>
                <td>{sale.date}</td>
                <td>{sale.amount_paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SalesPage; 