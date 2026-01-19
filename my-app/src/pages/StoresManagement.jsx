import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,

} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import './StoresManagement.css';

const StoresManagement = () => {
  const [stores, setStores] = useState([]);
  const [locations, setLocations] = useState([
    'بيرزيت',
    'سردا',
    'ابو قش',
    'الطيرة',
    'رام الله البلد',
    'البالوع',
    'المصايف',
    'عين منجد',
    'ايقون مول'
  ]);
  
  const statuses = [
    'تم التعاقد',
    'في انتظار الرد',
    'مرفوض',
    'اتصال مع المسؤول',
    'تم التعاقد باقي تكملة الحساب',
    'اجتماع'
  ];

  const statusColors = {
    'تم التعاقد': 'FF4CAF50',
    'في انتظار الرد': 'FFFFA500',
    'مرفوض': 'FFFF0000',
    'اتصال مع المسؤول': 'FF2196F3',
    'تم التعاقد باقي تكملة الحساب': 'FF9C27B0',
    'اجتماع': 'FF00BCD4'
  };

  // ألوان Excel للاستيراد (RGB format)
  const excelColorToStatus = {
    'FFFFFF00': 'في انتظار الرد', // أصفر
    'FFFFA500': 'في انتظار الرد', // برتقالي
    'FF00FF00': 'تم التعاقد', // أخضر
    'FF4CAF50': 'تم التعاقد', // أخضر
    'FF0000FF': 'اتصال مع المسؤول', // أزرق
    'FF2196F3': 'اتصال مع المسؤول', // أزرق
    'FFFF0000': 'مرفوض', // أحمر
    'FFF44336': 'مرفوض', // أحمر
    'FFFF69B4': 'اجتماع', // وردي
    'FF00BCD4': 'اجتماع', // سماوي
    'FF9C27B0': 'تم التعاقد باقي تكملة الحساب', // بنفسجي
    'FF800080': 'تم التعاقد باقي تكملة الحساب' // بنفسجي
  };

  const [formData, setFormData] = useState({
    storeName: '',
    employeeName: '',
    managerName: '',
    storePhone: '',
    managerPhone: '',
    location: '',
    address: '',
    status: '',
    statusNote: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [newLocation, setNewLocation] = useState('');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchStores();
    fetchLocations();
  }, []);

  const fetchStores = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'stores'));
      const storesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStores(storesData);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      alert('حدث خطأ في جلب البيانات');
    }
  };

  const fetchLocations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'locations'));
      const locationsData = querySnapshot.docs.map(doc => doc.data().name);
      if (locationsData.length > 0) {
        setLocations([...new Set([...locations, ...locationsData])]);
      }
    } catch (error) {
      console.error('خطأ في جلب المواقع:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.storeName || !formData.location || !formData.status) {
      alert('الرجاء تعبئة الحقول المطلوبة (اسم المحل، الموقع، الحالة)');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'stores', editingId), formData);
        alert('تم تحديث البيانات بنجاح');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'stores'), formData);
        alert('تم إضافة المحل بنجاح');
      }
      
      setFormData({
        storeName: '',
        employeeName: '',
        managerName: '',
        storePhone: '',
        managerPhone: '',
        location: '',
        address: '',
        status: '',
        statusNote: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      fetchStores();
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      alert('حدث خطأ في حفظ البيانات');
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.trim()) {
      alert('الرجاء إدخال اسم الموقع');
      return;
    }

    try {
      await addDoc(collection(db, 'locations'), { name: newLocation });
      setLocations([...locations, newLocation]);
      setNewLocation('');
      setShowAddLocation(false);
      alert('تم إضافة الموقع بنجاح');
    } catch (error) {
      console.error('خطأ في إضافة الموقع:', error);
      alert('حدث خطأ في إضافة الموقع');
    }
  };

  // تصدير إلى Excel مع الألوان
  const handleExportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('المحلات');

      // إضافة العناوين
      worksheet.columns = [
        { header: 'اسم المحل', key: 'storeName', width: 20 },
        { header: 'الموظف', key: 'employeeName', width: 20 },
        { header: 'المدير', key: 'managerName', width: 20 },
        { header: 'رقم المحل', key: 'storePhone', width: 15 },
        { header: 'رقم المدير', key: 'managerPhone', width: 15 },
        { header: 'الموقع', key: 'location', width: 20 },
        { header: 'العنوان', key: 'address', width: 30 },
        { header: 'الحالة', key: 'status', width: 25 },
        { header: 'شرح الحالة', key: 'statusNote', width: 40 },
        { header: 'التاريخ', key: 'date', width: 12 }
      ];

      // تنسيق الهيدر
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // إضافة البيانات مع الألوان
      filteredStores.forEach((store) => {
        const row = worksheet.addRow({
          storeName: store.storeName || '',
          employeeName: store.employeeName || '',
          managerName: store.managerName || '',
          storePhone: store.storePhone || '',
          managerPhone: store.managerPhone || '',
          location: store.location || '',
          address: store.address || '',
          status: store.status || '',
          statusNote: store.statusNote || '',
          date: store.date || ''
        });

        // تطبيق اللون على الصف بناءً على الحالة
        const color = statusColors[store.status] || 'FFFFFFFF';
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        });
      });

      // تطبيق حدود على الهيدر
      worksheet.getRow(1).eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // حفظ الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `المحلات_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      alert('تم تصدير البيانات بنجاح!');
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      alert('حدث خطأ في تصدير البيانات');
    }
  };

  // استيراد من Excel
  const handleImportFromExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(event.target.result);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
          alert('لا يوجد ورقة عمل في الملف');
          return;
        }

        const importedStores = [];
        let skippedRows = 0;

        worksheet.eachRow((row, rowNumber) => {
          // تخطي صف العناوين
          if (rowNumber === 1) return;

          // الحصول على اللون من الخلية الأولى
          const firstCell = row.getCell(1);
          let status = '';
          
          if (firstCell.fill && firstCell.fill.fgColor) {
            const color = firstCell.fill.fgColor.argb;
            status = excelColorToStatus[color] || '';
          }

          // إذا لم يتم العثور على حالة من اللون، استخدم القيمة من عمود الحالة
          if (!status) {
            status = row.getCell(8).value || '';
          }

          const storeData = {
            storeName: row.getCell(1).value || '',
            employeeName: row.getCell(2).value || '',
            managerName: row.getCell(3).value || '',
            storePhone: row.getCell(4).value ? String(row.getCell(4).value) : '',
            managerPhone: row.getCell(5).value ? String(row.getCell(5).value) : '',
            location: row.getCell(6).value || '',
            address: row.getCell(7).value || '',
            status: status,
            statusNote: row.getCell(9).value || '',
            date: row.getCell(10).value || new Date().toISOString().split('T')[0]
          };

          // التحقق من أن اسم المحل موجود على الأقل
          if (storeData.storeName) {
            importedStores.push(storeData);
          } else {
            skippedRows++;
          }
        });

        // حفظ البيانات في Firebase
        if (importedStores.length > 0) {
          const savePromises = importedStores.map(store => 
            addDoc(collection(db, 'stores'), store)
          );
          
          await Promise.all(savePromises);
          
          alert(`تم استيراد ${importedStores.length} محل بنجاح!${skippedRows > 0 ? `\nتم تخطي ${skippedRows} صف فارغ` : ''}`);
          fetchStores();
        } else {
          alert('لم يتم العثور على بيانات صالحة في الملف');
        }

        // إعادة تعيين input
        e.target.value = '';
      } catch (error) {
        console.error('خطأ في الاستيراد:', error);
        alert('حدث خطأ في استيراد البيانات. تأكد من تنسيق الملف.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleEdit = (store) => {
    setFormData(store);
    setEditingId(store.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المحل؟')) {
      try {
        await deleteDoc(doc(db, 'stores', id));
        alert('تم الحذف بنجاح');
        fetchStores();
      } catch (error) {
        console.error('خطأ في الحذف:', error);
        alert('حدث خطأ في الحذف');
      }
    }
  };

  const filteredStores = stores.filter(store => {
    const locationMatch = !filterLocation || store.location === filterLocation;
    const statusMatch = !filterStatus || store.status === filterStatus;
    return locationMatch && statusMatch;
  });

  return (
    <div className="stores-management">
      <h1>إدارة المحلات</h1>

      {/* Import/Export Section */}
      <div className="import-export-section">
        <button className="btn-export" onClick={handleExportToExcel}>
          📥 تصدير إلى Excel
        </button>
        <label className="btn-import">
          📤 استيراد من Excel
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleImportFromExcel}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Form Section */}
      <div className="form-container">
        <h2>{editingId ? 'تعديل بيانات المحل' : 'إضافة محل جديد'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>اسم المحل *</label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>اسم الموظف</label>
              <input
                type="text"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>اسم المدير</label>
              <input
                type="text"
                name="managerName"
                value={formData.managerName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>رقم تواصل المحل</label>
              <input
                type="tel"
                name="storePhone"
                value={formData.storePhone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>رقم تواصل المدير</label>
              <input
                type="tel"
                name="managerPhone"
                value={formData.managerPhone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>الموقع *</label>
              <div className="location-input">
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">اختر الموقع</option>
                  {locations.map((loc, index) => (
                    <option key={index} value={loc}>{loc}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => setShowAddLocation(!showAddLocation)}
                  className="btn-add-location"
                >
                  +
                </button>
              </div>
              {showAddLocation && (
                <div className="add-location">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="اسم الموقع الجديد"
                  />
                  <button type="button" onClick={handleAddLocation}>إضافة</button>
                </div>
              )}
            </div>

            <div className="form-group full-width">
              <label>العنوان التفصيلي</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="مثال: بجانب البنك العربي، الطابق الأول"
              />
            </div>

            <div className="form-group">
              <label>الحالة *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="">اختر الحالة</option>
                {statuses.map((status, index) => (
                  <option key={index} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>التاريخ</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group full-width">
              <label>شرح الحالة</label>
              <textarea
                name="statusNote"
                value={formData.statusNote}
                onChange={handleInputChange}
                rows="3"
                placeholder="ملاحظات إضافية عن الحالة..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              {editingId ? 'تحديث' : 'إضافة'}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    storeName: '',
                    employeeName: '',
                    managerName: '',
                    storePhone: '',
                    managerPhone: '',
                    location: '',
                    address: '',
                    status: '',
                    statusNote: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filters Section */}
      <div className="filters-container">
        <h2>الفلاتر</h2>
        <div className="filters">
          <div className="filter-group">
            <label>فلتر حسب المنطقة:</label>
            <select 
              value={filterLocation} 
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="">جميع المناطق</option>
              {locations.map((loc, index) => (
                <option key={index} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>فلتر حسب الحالة:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">جميع الحالات</option>
              {statuses.map((status, index) => (
                <option key={index} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <button 
            className="btn-reset-filters"
            onClick={() => {
              setFilterLocation('');
              setFilterStatus('');
            }}
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        <h2>المحلات ({filteredStores.length})</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>اسم المحل</th>
                <th>الموظف</th>
                <th>المدير</th>
                <th>رقم المحل</th>
                <th>رقم المدير</th>
                <th>الموقع</th>
                <th>العنوان</th>
                <th>الحالة</th>
                <th>شرح الحالة</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{textAlign: 'center'}}>
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.storeName}</td>
                    <td>{store.employeeName || '-'}</td>
                    <td>{store.managerName || '-'}</td>
                    <td>{store.storePhone || '-'}</td>
                    <td>{store.managerPhone || '-'}</td>
                    <td>{store.location}</td>
                    <td>{store.address || '-'}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{
                          backgroundColor: '#' + statusColors[store.status]?.substring(2) || '#cccccc',
                          color: 'white',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          display: 'inline-block'
                        }}
                      >
                        {store.status}
                      </span>
                    </td>
                    <td>{store.statusNote || '-'}</td>
                    <td>{store.date}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEdit(store)}
                        >
                          تعديل
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDelete(store.id)}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoresManagement;
