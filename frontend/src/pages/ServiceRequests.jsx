import { useEffect, useState, useRef, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { createRequest, deleteRequest, getEquipment, getEquipmentById, getRequests } from '../services/api';
import { buildPdfHeader, PDF_TABLE_STYLES } from '../utils/pdfExport';

const initialForm = {
  call_category: '',
  pm_service_period: '6 Months',
  visit_date: '',
  running_hours: '',
  symptom: '',
  cause: '',
  activity: '',
  comments: '',
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-');
const formatDateForInput = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');

function ReadOnlyField({ label, value, className = '' }) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-semibold text-slate-700 ${className}`}>
      {label}
      <input
        readOnly
        value={value ?? ''}
        className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 font-normal text-slate-600"
      />
    </label>
  );
}

export default function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [equipmentNo, setEquipmentNo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [equipmentData, setEquipmentData] = useState(null);
  const [activeTab, setActiveTab] = useState('serial');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingEquipment, setFetchingEquipment] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null); // request to confirm-delete
  const [deleting, setDeleting] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateRequestForm = (payload) => {
    const errors = {};

    if (!payload.call_category) {
      errors.call_category = 'Call Category is required';
    }

    if (!payload.visit_date) {
      errors.visit_date = 'Visit Date is required';
    }

    const hours = Number(payload.running_hours);
    if (payload.running_hours === '' || Number.isNaN(hours) || !Number.isInteger(hours)) {
      errors.running_hours = 'Running Hours must be an integer';
    } else if (hours < 0 || hours > 1000000) {
      errors.running_hours = 'Running Hours must be between 0 and 1000000';
    }

    if (!payload.symptom.trim()) {
      errors.symptom = 'Symptom is required';
    } else if (payload.symptom.trim().length > 1000) {
      errors.symptom = 'Symptom must be at most 1000 characters';
    }

    ['cause', 'activity', 'comments'].forEach((key) => {
      if (payload[key] && payload[key].trim().length > 1000) {
        errors[key] = `${key} must be at most 1000 characters`;
      }
    });

    return errors;
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [requestRes, equipmentRes] = await Promise.all([getRequests(), getEquipment()]);
      setRequests(requestRes.data);
      setEquipment(equipmentRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load request data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onChange = (event) => {
    const next = { ...form, [event.target.name]: event.target.value };
    setForm(next);
    setFieldErrors(validateRequestForm(next));
  };

  const handleSelectEquipment = async (item) => {
    const displayLabel = item.customer_name ? `${item.equipment_no} (${item.customer_name})` : item.equipment_no;
    setSearchTerm(displayLabel);
    setEquipmentNo(item.equipment_no);
    setIsDropdownOpen(false);

    setFetchingEquipment(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await getEquipmentById(item.equipment_no);
      setEquipmentData(data);
      setActiveTab('serial');
    } catch (err) {
      setEquipmentData(null);
      setError(err.response?.data?.error || 'Equipment not found.');
    } finally {
      setFetchingEquipment(false);
    }
  };

  const filteredEquipment = equipment.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.equipment_no?.toLowerCase().includes(q) ||
      item.customer_name?.toLowerCase().includes(q) ||
      item.site_name?.toLowerCase().includes(q) ||
      item.engine_make?.toLowerCase().includes(q) ||
      item.engine_model?.toLowerCase().includes(q)
    );
  });

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (startDate) {
      const s = new Date(startDate).getTime();
      list = list.filter((r) => r.visit_date && new Date(r.visit_date).getTime() >= s);
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      list = list.filter((r) => r.visit_date && new Date(r.visit_date).getTime() <= e.getTime());
    }
    return list;
  }, [requests, startDate, endDate]);

  const exportRows = useMemo(
    () =>
      filteredRequests.map((r) => ({
        'Request ID': `#${r.request_id}`,
        'Equipment No': r.equipment_no || '—',
        'Site Name': r.site_name || '—',
        'Engine Model': r.engine_model || '—',
        'KVA/HP': r.kva_hp || '—',
        'Call Category': r.call_category || '—',
        'Visit Date': formatDate(r.visit_date),
        'Symptom': r.symptom || '—',
        'Cause': r.cause || '—',
        'Activity': r.activity || '—',
      })),
    [filteredRequests]
  );

  const onExportPdf = async () => {
    if (filteredRequests.length === 0) return;
    const now = new Date();
    const doc = new jsPDF({ orientation: 'landscape' });
    
    const startY = await buildPdfHeader(doc, 'Service Requests');

    const headers = Object.keys(exportRows[0] || {});
    autoTable(doc, {
      startY,
      head: [headers],
      body: exportRows.map(Object.values),
      ...PDF_TABLE_STYLES
    });

    doc.save(`service_requests_${now.toISOString().slice(0, 10)}.pdf`);
  };

  const onExportExcel = () => {
    if (filteredRequests.length === 0) return;
    const now = new Date();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Requests');
    XLSX.writeFile(wb, `service_requests_${now.toISOString().slice(0, 10)}.xlsx`);
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateRequestForm(form);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix validation errors before submitting request.');
      return;
    }

    if (!equipmentData?.equipment_no) {
      setError('Fetch valid equipment details before submitting request.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const isPM = form.call_category?.startsWith('Preventive Maintainance');
    const payload = {
      equipment_no: equipmentData.equipment_no,
      ...form,
      pm_service_period: isPM ? (form.pm_service_period || '6 Months') : null,
      running_hours: Number(form.running_hours) || 0,
    };

    try {
      await createRequest(payload);
      setSuccess('Service request created. Service order auto-created successfully.');
      setForm(initialForm);
      setFieldErrors({});
      setEquipmentData(null);
      setEquipmentNo('');
      setSearchTerm('');
      setActiveTab('serial');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create service request.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (request) => {
    setDeleting(true);
    setError('');
    try {
      await deleteRequest(request.request_id);
      setSuccess(`Service request #${request.request_id} deleted successfully. Associated service order and invoice have also been removed.`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete service request.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'request_id', label: 'ID' },
    { key: 'equipment_no', label: 'Equipment No' },
    { key: 'site_name', label: 'Site Name', render: (row) => row.site_name || '-' },
    { key: 'engine_model', label: 'Engine Model', render: (row) => row.engine_model || '-' },
    { key: 'kva_hp', label: 'KVA/HP', render: (row) => row.kva_hp || '-' },
    { key: 'call_category', label: 'Call Category' },
    { key: 'visit_date', label: 'Visit Date', render: (row) => formatDate(row.visit_date) },
    { key: 'symptom', label: 'Symptom', render: (row) => row.symptom || '-' },
    { key: 'cause', label: 'Cause', render: (row) => row.cause || '-' },
    { key: 'activity', label: 'Activity', render: (row) => row.activity || '-' },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <button
          type="button"
          onClick={() => setDeleteTarget(row)}
          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-300 active:scale-95"
          title={`Delete request #${row.request_id}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg bg-white p-5 shadow-panel">
        <h3 className="text-2xl font-bold text-navy">Create Service Request</h3>

        {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
        {success && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-green-700">{success}</p>}

        {/* Top Search & Select Equipment Bar */}
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="relative w-full max-w-xl" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Search Equipment No or Customer Name
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search by Equipment No or Customer Name (e.g. EQ-1001, Acme)..."
                value={searchTerm}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full rounded-md border border-slate-300 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              />
              <svg
                className="absolute left-3 top-3 h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setEquipmentNo('');
                    setEquipmentData(null);
                    setIsDropdownOpen(true);
                  }}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Interactive Search Results Dropdown */}
            {isDropdownOpen && (
              <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
                {filteredEquipment.length === 0 ? (
                  <div className="p-3 text-center text-sm text-slate-500">
                    No equipment found matching "{searchTerm}"
                  </div>
                ) : (
                  filteredEquipment.map((item) => (
                    <div
                      key={item.equipment_no}
                      onClick={() => handleSelectEquipment(item)}
                      className={`flex cursor-pointer items-center justify-between border-b border-slate-100 p-3 transition hover:bg-slate-50 ${
                        equipmentData?.equipment_no === item.equipment_no ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy text-sm">{item.equipment_no}</span>
                          {item.kva_hp && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                              {item.kva_hp}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.customer_name ? `Customer: ${item.customer_name}` : 'No Customer Specified'}
                          {item.site_name ? ` | Site: ${item.site_name}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={item.warranty_status} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {fetchingEquipment && <LoadingSpinner label="Fetching equipment details..." />}

        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('serial')}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              activeTab === 'serial' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            SERIAL NO. DTLS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              activeTab === 'request' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            REQUEST DTLS
          </button>
        </div>

        {activeTab === 'serial' && (
          <div className="grid gap-4 md:grid-cols-2">
            <ReadOnlyField label="Equipment No" value={equipmentData?.equipment_no} />
            <ReadOnlyField label="Engine DG No" value={equipmentData?.engine_dgno} />
            <ReadOnlyField label="Engine Make" value={equipmentData?.engine_make} />
            <ReadOnlyField label="Engine Model" value={equipmentData?.engine_model} />
            <ReadOnlyField label="KVA/HP" value={equipmentData?.kva_hp} />
            <ReadOnlyField label="Alternator Make" value={equipmentData?.alternator_make} />
            <ReadOnlyField label="Alternator SL No" value={equipmentData?.alternator_sno} />
            <ReadOnlyField label="Alternator Model" value={equipmentData?.alternator_model} />
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Warranty Status</label>
              <div className="mt-1">
                <StatusBadge status={equipmentData?.warranty_status} />
              </div>
            </div>
            {equipmentData?.warranty_status === 'In Warranty' && (
              <>
                <ReadOnlyField
                  label="Warranty Start"
                  value={formatDateForInput(equipmentData?.warranty_start_date) || '-'}
                />
                <ReadOnlyField
                  label="Warranty End"
                  value={formatDateForInput(equipmentData?.warranty_end_date) || '-'}
                />
              </>
            )}
            <ReadOnlyField label="Customer Name" value={equipmentData?.customer_name} />
            <ReadOnlyField label="Site Name" value={equipmentData?.site_name} />
            <ReadOnlyField label="Email" value={equipmentData?.email} />
            <ReadOnlyField label="Contact Person" value={equipmentData?.contact_person} />
            <ReadOnlyField label="Contact Number" value={equipmentData?.contact_number} />
            <ReadOnlyField label="Address" value={equipmentData?.address} className="md:col-span-2" />
          </div>
        )}

        {activeTab === 'request' && (
          <div className="grid gap-4 md:grid-cols-2">
            {!equipmentData && (
              <div className="md:col-span-2 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
                <strong>Note:</strong> Please search and select an equipment in the bar above before filling out this form.
              </div>
            )}
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Call Category
              <select
                name="call_category"
                value={form.call_category}
                onChange={onChange}
                required
                className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
              >
                <option value="">Select Category</option>
                <option value="Preventive Maintainance-B">Preventive Maintainance-B</option>
                <option value="Preventive Maintainance-C">Preventive Maintainance-C</option>
                <option value="Preventive Maintainance-D">Preventive Maintainance-D</option>
                <option value="Preventive Maintainance-E">Preventive Maintainance-E</option>
                <option value="Complaint">Complaint</option>
                <option value="AMC Visit">AMC Visit</option>
              </select>
              {fieldErrors.call_category && <span className="text-xs text-red-600">{fieldErrors.call_category}</span>}
            </label>

            {form.call_category?.startsWith('Preventive Maintainance') && (
              <div className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                <span className="mb-1">PM Service Period</span>
                <div className="flex items-center gap-6 mt-1 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pm_service_period"
                      value="6 Months"
                      checked={form.pm_service_period === '6 Months' || !form.pm_service_period}
                      onChange={onChange}
                      className="h-4 w-4 accent-navy"
                    />
                    <span className="text-sm font-medium text-slate-700">6 Months</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pm_service_period"
                      value="1 Year"
                      checked={form.pm_service_period === '1 Year'}
                      onChange={onChange}
                      className="h-4 w-4 accent-navy"
                    />
                    <span className="text-sm font-medium text-slate-700">1 Year</span>
                  </label>
                </div>
              </div>
            )}

            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Visit Date
              <input
                type="date"
                name="visit_date"
                value={form.visit_date}
                onChange={onChange}
                required
                className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
              />
              {fieldErrors.visit_date && <span className="text-xs text-red-600">{fieldErrors.visit_date}</span>}
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Running Hours
              <input
                type="number"
                name="running_hours"
                value={form.running_hours}
                onChange={onChange}
                required
                className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
              />
              {fieldErrors.running_hours && <span className="text-xs text-red-600">{fieldErrors.running_hours}</span>}
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Symptom
              <input
                name="symptom"
                value={form.symptom}
                onChange={onChange}
                required
                className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
              />
              {fieldErrors.symptom && <span className="text-xs text-red-600">{fieldErrors.symptom}</span>}
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Cause
              <input
                name="cause"
                value={form.cause}
                onChange={onChange}
                className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
              />
              {fieldErrors.cause && <span className="text-xs text-red-600">{fieldErrors.cause}</span>}
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Activity
              <input
                name="activity"
                value={form.activity}
                onChange={onChange}
                className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
              />
              {fieldErrors.activity && <span className="text-xs text-red-600">{fieldErrors.activity}</span>}
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
              Comments
              <textarea
                name="comments"
                value={form.comments}
                onChange={onChange}
                className="min-h-20 rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
              />
              {fieldErrors.comments && <span className="text-xs text-red-600">{fieldErrors.comments}</span>}
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !equipmentData || Object.keys(fieldErrors).length > 0}
          className="rounded-md bg-accent px-5 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Submitting...' : 'Create Request'}
        </button>
      </form>

      <section className="space-y-3">
        <h3 className="text-2xl font-bold text-navy">All Service Requests</h3>
        
        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg bg-white p-4 shadow-panel border border-slate-200">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="startDate" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-slate-300/80 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="endDate" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-slate-300/80 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportPdf}
              disabled={filteredRequests.length === 0}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={onExportExcel}
              disabled={filteredRequests.length === 0}
              className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
            >
              Export Excel
            </button>
          </div>
        </div>

        {loading ? <LoadingSpinner label="Loading requests..." /> : <DataTable columns={columns} data={filteredRequests} />}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-red-600">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Delete Service Request</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-slate-700">
              <p>You are about to permanently delete:</p>
              <ul className="mt-1.5 space-y-0.5 pl-4 list-disc text-slate-600">
                <li>Service Request <strong>#{deleteTarget.request_id}</strong> — {deleteTarget.call_category}</li>
                <li>Equipment: <strong>{deleteTarget.equipment_no}</strong> ({deleteTarget.customer_name || 'N/A'})</li>
                <li>Visit Date: <strong>{formatDate(deleteTarget.visit_date)}</strong></li>
              </ul>
              <p className="mt-2 font-semibold text-red-600">⚠ The linked Service Order and Invoice will also be deleted.</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 active:scale-95"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
