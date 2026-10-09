import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { getEquipment, getEquipmentById, updateEquipment, deleteEquipment } from '../services/api';

const formatDateForInput = (value) => {
  if (!value) return '';
  // If already a plain date string (YYYY-MM-DD or starts with one), return it directly
  // to avoid UTC→local timezone shift (e.g. "2026-03-31" parsed as UTC midnight
  // becomes "2026-03-30" in IST +05:30 when toISOString() is called).
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  // For Date objects or ISO strings with time component, use local date parts
  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function UpdateWarranty() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [equipmentList, setEquipmentList] = useState([]);
  const [equipmentNo, setEquipmentNo] = useState(searchParams.get('equipment_no') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [equipment, setEquipment] = useState(null);
  
  const [form, setForm] = useState({
    manufacturing_date: '',
    in_amc: false,
    amc_start_date: '',
    amc_end_date: '',
    amc_location: 'Udupi',
    amc_amount: '',
    po_type: 'none',
    po_number: '',
    po_date: '',
    warranty_status: 'Out of Warranty',
    warranty_start_date: '',
    warranty_end_date: '',
    engine_dgno: '',
    engine_make: '',
    engine_model: '',
    kva_hp: '',
    alternator_make: '',
    alternator_sno: '',
    alternator_model: '',
    customer_name: '',
    site_name: '',
    address: '',
    contact_person: '',
    contact_number: '',
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!success) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const t = setTimeout(() => setSuccess(''), 6000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const t = setTimeout(() => setError(''), 7000);
    return () => clearTimeout(t);
  }, [error]);

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

  // Fetch list of equipment for the search selector
  const fetchAllEquipmentList = async () => {
    try {
      const res = await getEquipment();
      setEquipmentList(res.data || []);
    } catch {
      // Ignore background dropdown error
    }
  };

  useEffect(() => {
    fetchAllEquipmentList();
  }, []);

  const fetchEquipment = async (targetNo = equipmentNo) => {
    if (!targetNo) {
      setError('Please select or enter an equipment number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await getEquipmentById(targetNo);
      const data = response.data;
      setEquipment(data);
      setEquipmentNo(data.equipment_no);
      setSearchTerm(data.customer_name ? `${data.equipment_no} (${data.customer_name})` : data.equipment_no);
      setForm({
        manufacturing_date: formatDateForInput(data.manufacturing_date),
        warranty_status: data.warranty_status || 'Out of Warranty',
        warranty_start_date: formatDateForInput(data.warranty_start_date),
        warranty_end_date: formatDateForInput(data.warranty_end_date),
        in_amc: Boolean(data.in_amc),
        amc_start_date: formatDateForInput(data.amc_start_date),
        amc_end_date: formatDateForInput(data.amc_end_date),
        amc_location: data.amc_location || 'Udupi',
        amc_amount: data.amc_amount !== null && data.amc_amount !== undefined ? String(data.amc_amount) : '',
        po_type: data.po_number ? 'po' : 'none',
        po_number: data.po_number || '',
        po_date: formatDateForInput(data.po_date),
        engine_dgno: data.engine_dgno || '',
        engine_make: data.engine_make || '',
        engine_model: data.engine_model || '',
        kva_hp: data.kva_hp || '',
        alternator_make: data.alternator_make || '',
        alternator_sno: data.alternator_sno || '',
        alternator_model: data.alternator_model || '',
        customer_name: data.customer_name || '',
        site_name: data.site_name || '',
        address: data.address || '',
        contact_person: data.contact_person || '',
        contact_number: data.contact_number || '',
        email: data.email || '',
      });
    } catch (err) {
      setEquipment(null);
      setError(err.response?.data?.error || 'Failed to fetch equipment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialNo = searchParams.get('equipment_no');
    if (initialNo && !equipmentNo) {
      setEquipmentNo(initialNo);
      fetchEquipment(initialNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectEquipment = (item) => {
    const displayLabel = item.customer_name ? `${item.equipment_no} (${item.customer_name})` : item.equipment_no;
    setSearchTerm(displayLabel);
    setEquipmentNo(item.equipment_no);
    setIsDropdownOpen(false);
    fetchEquipment(item.equipment_no);
  };

  const filteredEquipment = equipmentList.filter((eq) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      eq.equipment_no?.toLowerCase().includes(q) ||
      eq.customer_name?.toLowerCase().includes(q) ||
      eq.site_name?.toLowerCase().includes(q) ||
      eq.engine_make?.toLowerCase().includes(q) ||
      eq.engine_model?.toLowerCase().includes(q)
    );
  });

  const onSave = async (e) => {
    if (e) e.preventDefault();
    if (!equipment) {
      setError('Load equipment first.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const { po_type, ...restForm } = form;
    const payload = {
      ...restForm,
      po_number: po_type === 'po' ? form.po_number : null,
      po_date: po_type === 'po' ? form.po_date : null,
    };

    try {
      const response = await updateEquipment(equipment.equipment_no, payload);
      const updated = response.data;
      setEquipment(updated);
      setSuccess('Equipment details updated successfully.');
      fetchAllEquipmentList();
    } catch (err) {
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const detailsMsg = err.response.data.details
          .map((d) => (typeof d === 'string' ? d : `${d.field}: ${d.message}`))
          .join(', ');
        setError(`${err.response.data.error || 'Validation failed'}: ${detailsMsg}`);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update equipment details.');
      }
    } finally {
      setSaving(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!equipment) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteEquipment(equipment.equipment_no);
      setSuccess(`Equipment ${equipment.equipment_no} deleted successfully.`);
      setEquipment(null);
      setEquipmentNo('');
      setSearchTerm('');
      setShowDeleteModal(false);
      setSearchParams({});
      fetchAllEquipmentList();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete equipment.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative space-y-6 rounded-lg bg-white p-5 shadow-panel">
      {/* Top Floating Alert Bar for Completed / Added / Rejected Notifications */}
      {(success || error) && (
        <div className="fixed top-5 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 px-4 transition-all">
          {success && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-600 px-5 py-3.5 text-white shadow-2xl backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-700 font-extrabold text-base shadow">
                  ✓
                </span>
                <div>
                  <h4 className="font-extrabold text-xs tracking-wider uppercase text-emerald-100">COMPLETED / UPDATED</h4>
                  <p className="text-sm font-semibold text-white">{success}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccess('')}
                className="ml-4 rounded-lg bg-emerald-700/60 px-2.5 py-1 text-emerald-100 hover:bg-emerald-700 hover:text-white font-bold text-sm transition"
              >
                ✕ Close
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between rounded-xl border border-red-300 bg-red-600 px-5 py-3.5 text-white shadow-2xl backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-700 font-extrabold text-base shadow">
                  ✕
                </span>
                <div>
                  <h4 className="font-extrabold text-xs tracking-wider uppercase text-red-100">REJECTED / FAILED</h4>
                  <p className="text-sm font-semibold text-white">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="ml-4 rounded-lg bg-red-700/60 px-2.5 py-1 text-red-100 hover:bg-red-700 hover:text-white font-bold text-sm transition"
              >
                ✕ Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top Search & Select Bar */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="mb-3 text-xl font-bold text-navy">Manage Equipment</h2>
        <div className="relative w-full max-w-xl" ref={dropdownRef}>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Search Equipment Number or Customer Name
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
                  setEquipment(null);
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
                filteredEquipment.map((eq) => (
                  <div
                    key={eq.equipment_no}
                    onClick={() => handleSelectEquipment(eq)}
                    className={`flex cursor-pointer items-center justify-between border-b border-slate-100 p-3 transition hover:bg-slate-50 ${
                      equipment?.equipment_no === eq.equipment_no ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy text-sm">{eq.equipment_no}</span>
                        {eq.kva_hp && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            {eq.kva_hp}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {eq.customer_name ? `Customer: ${eq.customer_name}` : 'No Customer Specified'}
                        {eq.site_name ? ` | Site: ${eq.site_name}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={eq.warranty_status} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {loading && <LoadingSpinner label="Fetching equipment details..." />}
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      {success && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-green-700">{success}</p>}

      {/* Equipment Full Form & Actions */}
      {equipment && !loading && (
        <form onSubmit={onSave} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-4 border border-slate-200">
            <div>
              <p className="text-xl font-bold text-navy">Equipment: {equipment.equipment_no}</p>
              <p className="text-sm text-slate-600">Created date: {formatDateForInput(equipment.manufacturing_date) || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={form.warranty_status} />
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Delete Equipment
              </button>
            </div>
          </div>

          {/* Section 1: Warranty & AMC Details */}
          <div className="rounded-md border border-slate-200 p-4 space-y-4">
            <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">1. Warranty & AMC Details</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                <span className="mb-1">Warranty Status</span>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="warranty_status"
                      value="In Warranty"
                      checked={form.warranty_status === 'In Warranty'}
                      onChange={handleChange}
                      className="accent-blue-600"
                    />
                    <span className="text-sm font-normal text-slate-700">In Warranty</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="warranty_status"
                      value="Out of Warranty"
                      checked={form.warranty_status === 'Out of Warranty'}
                      onChange={(e) => {
                        handleChange(e);
                        setForm((prev) => ({ ...prev, warranty_start_date: '', warranty_end_date: '' }));
                      }}
                      className="accent-red-600"
                    />
                    <span className="text-sm font-normal text-slate-700">Out of Warranty</span>
                  </label>
                </div>
              </div>

              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Manufacturing Date
                <input
                  type="date"
                  name="manufacturing_date"
                  value={form.manufacturing_date}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>

              {form.warranty_status === 'In Warranty' && (
                <>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                    Warranty Start Date
                    <input
                      type="date"
                      name="warranty_start_date"
                      value={form.warranty_start_date}
                      onChange={handleChange}
                      className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                    Warranty End Date
                    <input
                      type="date"
                      name="warranty_end_date"
                      value={form.warranty_end_date}
                      onChange={handleChange}
                      className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                    />
                  </label>
                </>
              )}
            </div>

            {/* AMC Details */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    name="in_amc"
                    checked={form.in_amc}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        in_amc: checked,
                        amc_start_date: checked ? prev.amc_start_date : '',
                        amc_end_date: checked ? prev.amc_end_date : '',
                      }));
                    }}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  <span>IN_AMC</span>
                </label>
                {form.in_amc && (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 border border-green-300">
                    In AMC
                  </span>
                )}
              </div>

              {form.in_amc && (
                <div className="mt-3 grid gap-4 md:grid-cols-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-md">
                  <div className="flex flex-col gap-1 text-sm font-semibold text-slate-700 md:col-span-3 pb-2 border-b border-blue-100">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">AMC Location (Branch)</span>
                    <div className="flex items-center gap-6 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="radio"
                          name="amc_location"
                          value="Udupi"
                          checked={form.amc_location === 'Udupi' || !form.amc_location}
                          onChange={handleChange}
                          className="h-4 w-4 accent-blue-600 cursor-pointer"
                        />
                        <span>Udupi</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="radio"
                          name="amc_location"
                          value="Mangalore"
                          checked={form.amc_location === 'Mangalore'}
                          onChange={handleChange}
                          className="h-4 w-4 accent-blue-600 cursor-pointer"
                        />
                        <span>Mangalore</span>
                      </label>
                    </div>
                  </div>

                  <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                    AMC Start Date
                    <input
                      type="date"
                      name="amc_start_date"
                      value={form.amc_start_date}
                      onChange={handleChange}
                      className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy bg-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                    AMC End Date
                    <input
                      type="date"
                      name="amc_end_date"
                      value={form.amc_end_date}
                      onChange={handleChange}
                      className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy bg-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                    AMC Amount (₹)
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-semibold text-slate-500">₹</span>
                      <input
                        type="number"
                        name="amc_amount"
                        placeholder="e.g. 25000"
                        value={form.amc_amount}
                        onChange={handleChange}
                        className="w-full rounded-md border border-slate-300/80 bg-white py-2.5 pl-7 pr-3 font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                      />
                    </div>
                  </label>

                  {/* PO Section */}
                  <div className="md:col-span-3 pt-2 border-t border-blue-100">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-2">Purchase Order (PO)</span>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="radio"
                          name="po_type"
                          value="none"
                          checked={form.po_type === 'none'}
                          onChange={() => setForm((prev) => ({ ...prev, po_type: 'none', po_number: '', po_date: '' }))}
                          className="h-4 w-4 accent-slate-500 cursor-pointer"
                        />
                        <span>None</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="radio"
                          name="po_type"
                          value="po"
                          checked={form.po_type === 'po'}
                          onChange={() => setForm((prev) => ({ ...prev, po_type: 'po' }))}
                          className="h-4 w-4 accent-blue-600 cursor-pointer"
                        />
                        <span>PO</span>
                      </label>
                    </div>
                  </div>

                  {form.po_type === 'po' && (
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-white border border-blue-200 rounded-md">
                      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                        PO Number
                        <input
                          type="text"
                          name="po_number"
                          placeholder="e.g. PO-2024/001"
                          value={form.po_number}
                          onChange={handleChange}
                          className="rounded-md border border-slate-300/80 px-3 py-2.5 font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                        PO Date
                        <input
                          type="date"
                          name="po_date"
                          value={form.po_date}
                          onChange={handleChange}
                          className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy bg-white"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Engine Specs */}
          <div className="rounded-md border border-slate-200 p-4 space-y-4">
            <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">2. Engine Details</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Engine DG No
                <input
                  type="text"
                  name="engine_dgno"
                  value={form.engine_dgno}
                  onChange={handleChange}
                  className="rounded-md border border-slate-300/80 px-3 py-2.5 font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Engine Make
                <input
                  type="text"
                  name="engine_make"
                  value={form.engine_make}
                  onChange={handleChange}
                  className="rounded-md border border-slate-300/80 px-3 py-2.5 font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Engine Model
                <input
                  type="text"
                  name="engine_model"
                  value={form.engine_model}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                kVA / HP
                <input
                  type="text"
                  name="kva_hp"
                  value={form.kva_hp}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Alternator Specs */}
          <div className="rounded-md border border-slate-200 p-4 space-y-4">
            <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">3. Alternator Details</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Alternator Make
                <input
                  type="text"
                  name="alternator_make"
                  value={form.alternator_make}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Alternator S/No
                <input
                  type="text"
                  name="alternator_sno"
                  value={form.alternator_sno}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Alternator Model
                <input
                  type="text"
                  name="alternator_model"
                  value={form.alternator_model}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Customer / Site Details */}
          <div className="rounded-md border border-slate-200 p-4 space-y-4">
            <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2">4. Customer & Site Details</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Customer Name
                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Site Name
                <input
                  type="text"
                  name="site_name"
                  value={form.site_name}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Contact Person
                <input
                  type="text"
                  name="contact_person"
                  value={form.contact_person}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Contact Number
                <input
                  type="text"
                  name="contact_number"
                  value={form.contact_number}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700 md:col-span-2 lg:col-span-3">
                Address
                <textarea
                  rows={2}
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-accent px-6 py-2.5 font-bold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => fetchEquipment(equipment.equipment_no)}
              className="rounded-md border border-slate-300 px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && equipment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-red-600">Delete Equipment?</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete equipment <strong className="text-slate-800">{equipment.equipment_no}</strong>?
              This action cannot be undone and will delete all associated service requests and orders.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDeleteConfirm}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
