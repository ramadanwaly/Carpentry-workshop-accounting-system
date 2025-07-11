import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Link, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // بيانات النموذج
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [label, setLabel] = useState('');
  const [editLabel, setEditLabel] = useState('');

  // البحث
  const [searchType, setSearchType] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchAmountFrom, setSearchAmountFrom] = useState('');
  const [searchAmountTo, setSearchAmountTo] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [note, setNote] = useState('');
  const [editAttachment, setEditAttachment] = useState('');
  const [editNote, setEditNote] = useState('');
  const [showNote, setShowNote] = useState('');
  const [searchCustomerId, setSearchCustomerId] = useState('');

  // تعديل
  const [editId, setEditId] = useState(null);
  const [editType, setEditType] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [editCustomerId, setEditCustomerId] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchCustomers();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3001/api/expenses', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setExpenses(res.data);
    } catch (err) {
      setError('فشل في جلب المصروفات');
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/customers', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setCustomers(res.data);
    } catch (err) {
      // تجاهل الخطأ هنا
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!type || !date || !amount) {
      setAddError('يرجى إدخال جميع البيانات');
      return;
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      setAddError('المبلغ يجب أن يكون رقمًا أكبر من صفر');
      return;
    }
    setAdding(true);
    try {
      await axios.post('http://localhost:3001/api/expenses', {
        type,
        date,
        amount,
        label,
        attachment: attachmentUrl,
        note,
        customer_id: customerId ? parseInt(customerId) : null
      }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setAddSuccess('تمت إضافة المصروف بنجاح');
      setType('');
      setDate('');
      setAmount('');
      setCustomerId('');
      fetchExpenses();
    } catch (err) {
      setAddError(err.response?.data?.message || 'فشل في إضافة المصروف');
    }
    setAdding(false);
  };

  // بدء التعديل
  const startEdit = (exp) => {
    setEditId(exp.id);
    setEditType(exp.type);
    setEditDate(exp.date);
    setEditAmount(exp.amount);
    setEditLabel(exp.label || '');
    setEditCustomerId(exp.customer_id || '');
  };
  // حفظ التعديل
  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editType || !editDate || !editAmount) return;
    try {
      await axios.put(`http://localhost:3001/api/expenses/${editId}`, {
        type: editType,
        date: editDate,
        amount: editAmount,
        label: editLabel,
        attachment: editAttachment,
        note: editNote,
        customer_id: editCustomerId ? parseInt(editCustomerId) : null
      }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setEditId(null);
      setEditType('');
      setEditDate('');
      setEditAmount('');
      setEditCustomerId('');
      fetchExpenses();
    } catch (err) {
      alert('فشل في تعديل المصروف');
    }
  };
  // إلغاء التعديل
  const cancelEdit = () => {
    setEditId(null);
    setEditType('');
    setEditDate('');
    setEditAmount('');
    setEditLabel('');
  };
  // حذف مصروف
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذا المصروف؟')) return;
    try {
      await axios.delete(`http://localhost:3001/api/expenses/${id}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      fetchExpenses();
    } catch (err) {
      alert('فشل في حذف المصروف');
    }
  };

  // تصفية المصروفات
  const filteredExpenses = expenses.filter(exp =>
    (searchType ? exp.type.includes(searchType) : true) &&
    (searchDate ? exp.date === searchDate : true) &&
    (searchAmountFrom ? Number(exp.amount) >= Number(searchAmountFrom) : true) &&
    (searchAmountTo ? Number(exp.amount) <= Number(searchAmountTo) : true) &&
    (
      searchCustomerId === '' ? true :
      searchCustomerId === '__no_customer__' ? (!exp.customer_id) :
      (String(exp.customer_id) === String(searchCustomerId))
    )
  );

  // تصدير
  const dataToExport = selectedIds.length > 0
    ? filteredExpenses.filter(exp => selectedIds.includes(exp.id))
    : filteredExpenses;

  const exportToExcel = () => {
    const data = dataToExport.map(exp => ({
      'النوع': exp.type,
      'التاريخ': exp.date,
      'المبلغ': exp.amount,
      'التصنيف': exp.label || '-',
      'العميل': exp.customer_name || '-',
      'المرفق': exp.attachment ? 'موجود' : 'غير موجود',
      'ملاحظات': exp.note || '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المصروفات');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(file, 'expenses.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('تقرير المصروفات', 105, 15, { align: 'center' });
    const tableColumn = ['النوع', 'التاريخ', 'المبلغ', 'التصنيف', 'العميل', 'المرفق', 'ملاحظات'];
    const tableRows = dataToExport.map(exp => [
      exp.type,
      exp.date,
      exp.amount,
      exp.label || '-',
      exp.customer_name || '-',
      exp.attachment ? 'موجود' : 'غير موجود',
      exp.note || '-'
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { halign: 'right' },
      headStyles: { fillColor: [25, 118, 210] }
    });
    doc.save('expenses.pdf');
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف كل المصروفات المحددة؟')) return;
    for (const id of selectedIds) {
      await axios.delete(`http://localhost:3001/api/expenses/${id}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
    }
    setSelectedIds([]);
    fetchExpenses();
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const getRowColor = (type) => {
    switch (type) {
      case 'electricity': return '#fffde7';
      case 'wages': return '#e3f2fd';
      case 'wood': return '#f1f8e9';
      case 'paints': return '#fce4ec';
      case 'maintenance': return '#f3e5f5';
      default: return '#fff';
    }
  };

  // دالة رفع الملف
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('http://localhost:3001/api/expenses/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: 'Bearer ' + localStorage.getItem('token')
        }
      });
      setAttachmentUrl(res.data.url);
    } catch (err) {
      alert('فشل في رفع الملف');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, background: '#f7fafd', borderRadius: 18, boxShadow: '0 4px 24px #e3eaf3', direction: 'rtl', fontFamily: 'Cairo, Tajawal, Arial, sans-serif' }}>
      <NavBar />
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#1976d2', fontWeight: 'bold', fontSize: 32, letterSpacing: 1 }}>قائمة المصروفات</h2>
      {/* نموذج إضافة مصروف جديد */}
      <form onSubmit={handleAddExpense} style={{ marginBottom: 36, border: '1px solid #e3eaf3', padding: 28, borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px #e3eaf3' }}>
        <h4 style={{ marginBottom: 20, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>إضافة مصروف جديد</h4>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>النوع *</label>
          <select value={type} onChange={e => setType(e.target.value)} required style={inputStyle}>
            <option value="">اختر النوع</option>
            <option value="wood">خشب</option>
            <option value="paints">دهانات</option>
            <option value="electricity">كهرباء</option>
            <option value="wages">أجور</option>
            <option value="maintenance">صيانة</option>
            <option value="other">أخرى</option>
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>التاريخ *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>المبلغ *</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required style={inputStyle} placeholder="المبلغ" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>العميل</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={inputStyle}>
            <option value="">بدون عميل</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>المرفق</label>
          <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>التصنيف</label>
          <input type="text" value={label} onChange={e => setLabel(e.target.value)} style={inputStyle} placeholder="تصنيف (اختياري)" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>ملاحظات</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} style={{ ...inputStyle, minHeight: 38, resize: 'vertical' }} placeholder="ملاحظات (اختياري)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 10 }}>
          <button type="submit" disabled={adding} style={{ background: '#1976d2', color: '#fff', padding: '10px 40px', border: 'none', borderRadius: 8, fontSize: 18, fontWeight: 'bold', cursor: adding ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #e3eaf3' }}>
            {adding ? 'جاري الإضافة...' : 'إضافة'}
          </button>
          {addError && <span style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>{addError}</span>}
          {addSuccess && <span style={{ color: 'green', fontWeight: 'bold', fontSize: 16 }}>{addSuccess}</span>}
        </div>
      </form>
      {/* نموذج البحث والتصفية */}
      <div style={{ marginBottom: 24, background: '#f1f6fa', padding: 16, borderRadius: 10, display: 'flex', gap: 18, flexWrap: 'wrap', boxShadow: '0 1px 4px #e3eaf3' }}>
        <input type="text" placeholder="بحث بالنوع (مثلاً: wood, paints)" value={searchType} onChange={e => setSearchType(e.target.value)} style={inputStyle} />
        <input type="date" placeholder="بحث بالتاريخ" value={searchDate} onChange={e => setSearchDate(e.target.value)} style={inputStyle} />
        <input type="number" placeholder="من مبلغ" value={searchAmountFrom} onChange={e => setSearchAmountFrom(e.target.value)} style={inputStyle} />
        <input type="number" placeholder="إلى مبلغ" value={searchAmountTo} onChange={e => setSearchAmountTo(e.target.value)} style={inputStyle} />
        <select value={searchCustomerId} onChange={e => setSearchCustomerId(e.target.value)} style={inputStyle}>
          <option value="">بحث بالعميل</option>
          <option value="__no_customer__">بدون عميل</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button onClick={exportToExcel} style={exportBtnStyle}>تصدير النتائج إلى Excel</button>
        <button onClick={exportToPDF} style={exportBtnStyleRed}>تصدير النتائج إلى PDF</button>
        <div style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 15, flexBasis: '100%' }}>
          سيتم تصدير النتائج المعروضة فقط (بعد التصفية/البحث/الاختيار)
        </div>
      </div>
      {/* جدول المصروفات */}
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <span className="loader" style={{ display: 'inline-block', width: 32, height: 32, border: '4px solid #ccc', borderTop: '4px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center', fontSize: 18 }}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e3eaf3', padding: 8 }}>
          <table border="0" cellPadding="10" style={{ width: '100%', marginTop: 10, background: '#fff', borderRadius: 8, fontSize: 17, textAlign: 'center' }}>
            <thead style={{ background: '#1976d2', color: '#fff', fontSize: 18 }}>
              <tr>
                <th><input type="checkbox" checked={selectedIds.length === filteredExpenses.length && filteredExpenses.length > 0} onChange={e => setSelectedIds(e.target.checked ? filteredExpenses.map(exp => exp.id) : [])} /></th>
                <th>النوع</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>التصنيف</th>
                <th>العميل</th>
                <th>المرفق</th>
                <th>ملاحظات</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => (
                <tr key={exp.id} style={{ background: getRowColor(exp.type), borderBottom: '1px solid #e3eaf3', fontWeight: 500 }}>
                  <td><input type="checkbox" checked={selectedIds.includes(exp.id)} onChange={() => toggleSelect(exp.id)} /></td>
                  <td>{editId === exp.id ? (<select value={editType} onChange={e => setEditType(e.target.value)} style={inputStyle}>{/* ...options... */}</select>) : exp.type}</td>
                  <td>{editId === exp.id ? (<input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={inputStyle} />) : exp.date}</td>
                  <td>{editId === exp.id ? (<input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} style={inputStyle} />) : exp.amount}</td>
                  <td>{editId === exp.id ? (<input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} style={inputStyle} />) : exp.label || '-'}</td>
                  <td>{editId === exp.id ? (<select value={editCustomerId} onChange={e => setEditCustomerId(e.target.value)} style={inputStyle}><option value="">اختر العميل (اختياري)</option>{customers.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}</select>) : exp.customer_name || '-'}</td>
                  <td>{exp.attachment && (<a href={exp.attachment} target="_blank" rel="noopener noreferrer">عرض الملف</a>)}</td>
                  <td>{exp.note ? (<button onClick={() => setShowNote(exp.note)} style={noteBtnStyle}>عرض</button>) : '-'}</td>
                  <td>{editId === exp.id ? (<><button onClick={handleEditSave} style={saveBtnStyle}>حفظ</button><button onClick={cancelEdit} style={cancelBtnStyle}>إلغاء</button></>) : (<><button onClick={() => startEdit(exp)} style={editBtnStyle}>تعديل</button><button onClick={() => handleDelete(exp.id)} style={deleteBtnStyle}>حذف</button></>)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#e3f2fd', fontWeight: 'bold', fontSize: 18 }}>
                <td colSpan={5}>الإجمالي</td>
                <td>{filteredExpenses.filter(exp => selectedIds.length === 0 || selectedIds.includes(exp.id)).reduce((sum, exp) => sum + Number(exp.amount), 0)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {showNote && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 28, borderRadius: 12, minWidth: 320, maxWidth: 520, boxShadow: '0 2px 12px #1976d2' }}>
            <h4 style={{ color: '#1976d2', marginBottom: 12 }}>ملاحظات المصروف</h4>
            <div style={{ margin: '16px 0', fontSize: 17 }}>{showNote}</div>
            <button onClick={() => setShowNote('')} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 24px', fontSize: 16, cursor: 'pointer' }}>إغلاق</button>
          </div>
        </div>
      )}
      {selectedIds.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button onClick={handleDeleteSelected} style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 40px', fontSize: 18, fontWeight: 'bold', boxShadow: '0 2px 8px #e3eaf3', cursor: 'pointer' }}>
            حذف المحدد ({selectedIds.length})
          </button>
        </div>
      )}
    </div>
  );
}

export default ExpensesPage; 

// أنماط موحدة
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #b6c6e3', fontSize: 16, background: '#fafdff', marginBottom: 2, height: 44 };
const labelStyle = { fontWeight: 'bold', color: '#1976d2', marginBottom: 4, display: 'block', fontSize: 15 };
const exportBtnStyle = { background: '#388e3c', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 22px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 4px #e3eaf3' };
const exportBtnStyleRed = { ...exportBtnStyle, background: '#d32f2f' };
const noteBtnStyle = { background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 15 };
const editBtnStyle = { background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', marginLeft: 4, cursor: 'pointer', fontSize: 15 };
const deleteBtnStyle = { background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 15 };
const saveBtnStyle = { background: '#388e3c', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', marginLeft: 4, cursor: 'pointer', fontSize: 15 };
const cancelBtnStyle = { background: '#888', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 15 }; 