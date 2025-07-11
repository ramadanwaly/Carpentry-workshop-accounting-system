import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Link, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // بيانات النموذج
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [adding, setAdding] = useState(false);

  // البحث
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  // التعديل
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // عرض الطلبات
  const [showOrdersId, setShowOrdersId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3001/api/customers', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setCustomers(res.data);
    } catch (err) {
      setError('فشل في جلب العملاء');
    }
    setLoading(false);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!name || !phone) {
      setAddError('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }
    setAdding(true);
    try {
      await axios.post('http://localhost:3001/api/customers', { name, phone }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setAddSuccess('تمت إضافة العميل بنجاح');
      setName('');
      setPhone('');
      fetchCustomers();
    } catch (err) {
      setAddError(err.response?.data?.message || 'فشل في إضافة العميل');
    }
    setAdding(false);
  };

  // حذف عميل
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذا العميل؟')) return;
    try {
      await axios.delete(`http://localhost:3001/api/customers/${id}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      fetchCustomers();
    } catch (err) {
      alert('فشل في حذف العميل');
    }
  };

  // التعديل
  const startEdit = (c) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditPhone(c.phone);
  };
  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editName || !editPhone) return;
    try {
      await axios.put(`http://localhost:3001/api/customers/${editId}`, { name: editName, phone: editPhone }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setEditId(null);
      setEditName('');
      setEditPhone('');
      fetchCustomers();
    } catch (err) {
      alert('فشل في تعديل العميل');
    }
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditName('');
    setEditPhone('');
  };

  // جلب الطلبات لعميل معيّن
  const fetchOrders = async (customerId) => {
    setOrders([]);
    setOrdersLoading(true);
    setOrdersError('');
    setShowOrdersId(customerId);
    try {
      const res = await axios.get(`http://localhost:3001/api/customers/${customerId}/orders`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setOrders(res.data);
    } catch (err) {
      setOrdersError('فشل في جلب الطلبات');
    }
    setOrdersLoading(false);
  };

  // تصفية العملاء
  const filteredCustomers = customers.filter(c =>
    (searchName ? c.name.includes(searchName) : true) &&
    (searchPhone ? c.phone.includes(searchPhone) : true)
  );

  // تصدير
  const exportToExcel = () => {
    const data = filteredCustomers.map(c => ({
      'الاسم': c.name,
      'رقم الهاتف': c.phone,
      'إجمالي المدفوع': c.total_paid || 0,
      'المتبقي': c.total_due || 0
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'العملاء');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(file, 'customers.xlsx');
  };
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('تقرير العملاء', 105, 15, { align: 'center' });
    const tableColumn = ['الاسم', 'رقم الهاتف', 'إجمالي المدفوع', 'المتبقي'];
    const tableRows = filteredCustomers.map(c => [
      c.name,
      c.phone,
      c.total_paid || 0,
      c.total_due || 0
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { halign: 'right' },
      headStyles: { fillColor: [25, 118, 210] }
    });
    doc.save('customers.pdf');
  };

  // تصدير طلبات العميل إلى Excel
  const exportOrdersToExcel = () => {
    if (!orders || orders.length === 0) return;
    const data = orders.map(order => ({
      'نوع الطلب': order.order_type,
      'التاريخ': order.date,
      'المبلغ الإجمالي': order.total_amount,
      'المدفوع': order.amount_paid,
      'الحالة': order.status,
      'المواد المستخدمة': order.materials || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'طلبات العميل');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(file, 'customer_orders.xlsx');
  };

  // تصدير طلبات العميل إلى PDF
  const exportOrdersToPDF = () => {
    if (!orders || orders.length === 0) return;
    const doc = new jsPDF();
    doc.text('تقرير طلبات العميل', 105, 15, { align: 'center' });
    const tableColumn = ['نوع الطلب', 'التاريخ', 'المبلغ الإجمالي', 'المدفوع', 'الحالة', 'المواد المستخدمة'];
    const tableRows = orders.map(order => [
      order.order_type,
      order.date,
      order.total_amount,
      order.amount_paid,
      order.status,
      order.materials || '-'
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { halign: 'right' },
      headStyles: { fillColor: [25, 118, 210] }
    });
    doc.save('customer_orders.pdf');
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
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#1976d2', fontWeight: 'bold', fontSize: 32, letterSpacing: 1 }}>قائمة العملاء</h2>
      {/* نموذج إضافة عميل جديد */}
      <form onSubmit={handleAddCustomer} style={{ marginBottom: 36, border: '1px solid #e3eaf3', padding: 28, borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px #e3eaf3' }}>
        <h4 style={{ marginBottom: 20, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>إضافة عميل جديد</h4>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>الاسم *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="اسم العميل" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>رقم الهاتف *</label>
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} placeholder="رقم الهاتف" />
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
        <input type="text" placeholder="بحث بالاسم" value={searchName} onChange={e => setSearchName(e.target.value)} style={inputStyle} />
        <input type="text" placeholder="بحث برقم الهاتف" value={searchPhone} onChange={e => setSearchPhone(e.target.value)} style={inputStyle} />
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
              <th>الاسم</th>
              <th>رقم الهاتف</th>
              <th>إجمالي المدفوع</th>
              <th>المتبقي</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(c => (
              <tr key={c.id}>
                <td>
                  {editId === c.id ? (
                    <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%' }} />
                  ) : c.name}
                </td>
                <td>
                  {editId === c.id ? (
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)} style={{ width: '100%' }} />
                  ) : c.phone}
                </td>
                <td>{c.total_paid || 0}</td>
                <td>{c.total_due || 0}</td>
                <td>
                  {editId === c.id ? (
                    <>
                      <button onClick={handleEditSave} style={saveBtnStyle}>حفظ</button>
                      <button onClick={cancelEdit} style={cancelBtnStyle}>إلغاء</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(c)} style={editBtnStyle}>تعديل</button>
                      <button onClick={() => handleDelete(c.id)} style={deleteBtnStyle}>حذف</button>
                      <button onClick={() => fetchOrders(c.id)} style={{ background: '#ffa000', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', marginLeft: 4, cursor: 'pointer', fontSize: 15 }}>عرض الطلبات</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* تفاصيل الطلبات للعميل */}
      {showOrdersId && (
        <div style={{ marginTop: 30, background: '#f5f5f5', borderRadius: 8, padding: 20 }}>
          <h4 style={{ marginBottom: 16 }}>طلبات العميل</h4>
          <button onClick={() => setShowOrdersId(null)} style={{ float: 'left', background: '#888', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>إغلاق</button>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 10 }}>
            <button onClick={exportOrdersToExcel} style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontSize: 14, cursor: 'pointer' }}>
              تصدير الطلبات إلى Excel
            </button>
            <button onClick={exportOrdersToPDF} style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontSize: 14, cursor: 'pointer' }}>
              تصدير الطلبات إلى PDF
            </button>
          </div>
          {ordersLoading ? (
            <div style={{ textAlign: 'center', marginTop: 20 }}>جاري التحميل...</div>
          ) : ordersError ? (
            <div style={{ color: 'red', textAlign: 'center' }}>{ordersError}</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 20 }}>لا توجد طلبات لهذا العميل.</div>
          ) : (
            <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 20, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px #eee' }}>
              <thead style={{ background: '#1976d2', color: '#fff' }}>
                <tr>
                  <th>نوع الطلب</th>
                  <th>التاريخ</th>
                  <th>المبلغ الإجمالي</th>
                  <th>المدفوع</th>
                  <th>الحالة</th>
                  <th>المواد المستخدمة</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.order_type}</td>
                    <td>{order.date}</td>
                    <td>{order.total_amount}</td>
                    <td>{order.amount_paid}</td>
                    <td>{order.status}</td>
                    <td>{order.materials || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomersPage;