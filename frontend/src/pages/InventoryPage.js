import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Link, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // بيانات النموذج
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [threshold, setThreshold] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [adding, setAdding] = useState(false);

  // البحث
  const [searchName, setSearchName] = useState('');
  const [searchLowStock, setSearchLowStock] = useState(false);

  // أضف حالات التعديل
  const [editId, setEditId] = useState(null);
  const [editMaterialName, setEditMaterialName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const [editThreshold, setEditThreshold] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3001/api/inventory', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setItems(res.data);
    } catch (err) {
      setError('فشل في جلب المخزون');
    }
    setLoading(false);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!materialName || !quantity || !unitPrice || !threshold) {
      setAddError('يرجى إدخال جميع البيانات');
      return;
    }
    if (isNaN(quantity) || Number(quantity) < 0 || isNaN(unitPrice) || Number(unitPrice) < 0 || isNaN(threshold) || Number(threshold) < 0) {
      setAddError('الكمية والسعر والحد يجب أن تكون أرقامًا موجبة');
      return;
    }
    setAdding(true);
    try {
      await axios.post('http://localhost:3001/api/inventory', {
        material_name: materialName,
        quantity,
        unit_price: unitPrice,
        threshold
      }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setAddSuccess('تمت إضافة المادة بنجاح');
      setMaterialName('');
      setQuantity('');
      setUnitPrice('');
      setThreshold('');
      fetchItems();
    } catch (err) {
      setAddError(err.response?.data?.message || 'فشل في إضافة المادة');
    }
    setAdding(false);
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setEditMaterialName(item.material_name);
    setEditQuantity(item.quantity);
    setEditUnitPrice(item.unit_price);
    setEditThreshold(item.threshold);
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditMaterialName('');
    setEditQuantity('');
    setEditUnitPrice('');
    setEditThreshold('');
  };
  const handleEditSave = async (id) => {
    try {
      await axios.put(`http://localhost:3001/api/inventory/${id}`, {
        material_name: editMaterialName,
        quantity: editQuantity,
        unit_price: editUnitPrice,
        threshold: editThreshold
      }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      cancelEdit();
      fetchItems();
    } catch (err) {
      alert('فشل في تعديل المادة');
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذه المادة؟')) return;
    try {
      await axios.delete(`http://localhost:3001/api/inventory/${id}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      fetchItems();
    } catch (err) {
      alert('فشل في حذف المادة');
    }
  };

  // تصفية المخزون
  const filteredItems = items.filter(item =>
    (searchName ? item.material_name.includes(searchName) : true) &&
    (searchLowStock ? Number(item.quantity) <= Number(item.threshold) : true)
  );

  // تصدير
  const exportToExcel = () => {
    const data = filteredItems.map(item => ({
      'اسم المادة': item.material_name,
      'الكمية': item.quantity,
      'سعر الوحدة': item.unit_price,
      'حد التنبيه': item.threshold
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المخزون');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(file, 'inventory.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('تقرير المخزون', 105, 15, { align: 'center' });
    const tableColumn = ['اسم المادة', 'الكمية', 'سعر الوحدة', 'حد التنبيه'];
    const tableRows = filteredItems.map(item => [
      item.material_name,
      item.quantity,
      item.unit_price,
      item.threshold
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { halign: 'right' },
      headStyles: { fillColor: [25, 118, 210] }
    });
    doc.save('inventory.pdf');
  };

  // تلوين الصفوف التي تحت حد التنبيه
  const getRowColor = (item) => {
    if (Number(item.quantity) <= Number(item.threshold)) return '#ffebee';
    return '#fff';
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
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#1976d2', fontWeight: 'bold', fontSize: 32, letterSpacing: 1 }}>المخزون</h2>
      {/* نموذج إضافة مادة جديدة */}
      <form onSubmit={handleAddItem} style={{ marginBottom: 36, border: '1px solid #e3eaf3', padding: 28, borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px #e3eaf3' }}>
        <h4 style={{ marginBottom: 20, color: '#1976d2', fontWeight: 'bold', fontSize: 22 }}>إضافة مادة جديدة</h4>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>اسم المادة *</label>
          <input type="text" value={materialName} onChange={e => setMaterialName(e.target.value)} required style={inputStyle} placeholder="اسم المادة" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>الكمية *</label>
          <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required style={inputStyle} placeholder="الكمية" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>سعر الوحدة *</label>
          <input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required style={inputStyle} placeholder="سعر الوحدة" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>حد التنبيه *</label>
          <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} required style={inputStyle} placeholder="حد التنبيه" />
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
        <input type="text" placeholder="بحث باسم المادة" value={searchName} onChange={e => setSearchName(e.target.value)} style={inputStyle} />
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
              <th>اسم المادة</th>
              <th>الكمية</th>
              <th>سعر الوحدة</th>
              <th>حد التنبيه</th>
              <th>تنبيه</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id} style={{ background: getRowColor(item) }}>
                {editId === item.id ? (
                  <>
                    <td><input value={editMaterialName} onChange={e => setEditMaterialName(e.target.value)} style={inputStyle} /></td>
                    <td><input type="number" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} style={inputStyle} /></td>
                    <td><input type="number" value={editUnitPrice} onChange={e => setEditUnitPrice(e.target.value)} style={inputStyle} /></td>
                    <td><input type="number" value={editThreshold} onChange={e => setEditThreshold(e.target.value)} style={inputStyle} /></td>
                    <td>{Number(editQuantity) <= Number(editThreshold) ? (<span style={{ color: '#d32f2f', fontWeight: 'bold' }}>ناقص</span>) : (<span style={{ color: '#388e3c' }}>جيد</span>)}</td>
                    <td>
                      <button onClick={() => handleEditSave(item.id)} style={saveBtnStyle}>حفظ</button>
                      <button onClick={cancelEdit} style={cancelBtnStyle}>إلغاء</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{item.material_name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit_price}</td>
                    <td>{item.threshold}</td>
                    <td>{Number(item.quantity) <= Number(item.threshold) ? (<span style={{ color: '#d32f2f', fontWeight: 'bold' }}>ناقص</span>) : (<span style={{ color: '#388e3c' }}>جيد</span>)}</td>
                    <td>
                      <button onClick={() => startEdit(item)} style={editBtnStyle}>تعديل</button>
                      <button onClick={() => handleDelete(item.id)} style={deleteBtnStyle}>حذف</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InventoryPage;
