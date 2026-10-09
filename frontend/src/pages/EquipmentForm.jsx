import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import { createEquipment } from '../services/api';

const initialForm = {
  equipment_no: '',
  manufacturing_date: '',
  warranty_start_date: '',
  warranty_end_date: '',
  in_amc: false,
  amc_start_date: '',
  amc_end_date: '',
  amc_location: 'Udupi',
  amc_amount: '',
  po_type: 'none',
  po_number: '',
  po_date: '',
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
};

function Field({ label, name, value, onChange, type = 'text', required = false }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        value={value}
        required={required}
        onChange={onChange}
        className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </label>
  );
}

export default function EquipmentForm() {
  const [form, setForm] = useState(initialForm);
  const [warrantyStatus, setWarrantyStatus] = useState('Out of Warranty');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [success]);

  const validateForm = (payload, status) => {
    const errors = {};

    if (!payload.equipment_no.trim()) {
      errors.equipment_no = 'Equipment No is required';
    } else if (!/^[A-Za-z0-9-]{1,50}$/.test(payload.equipment_no.trim())) {
      errors.equipment_no = 'Use only letters, numbers, and hyphen (max 50)';
    }

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      errors.email = 'Enter a valid email address';
    }

    if (payload.contact_number && !/^\d{10,15}$/.test(payload.contact_number)) {
      errors.contact_number = 'Contact number must be 10 to 15 digits';
    }

    if (
      status === 'In Warranty' &&
      payload.warranty_start_date &&
      payload.warranty_end_date &&
      new Date(payload.warranty_end_date) < new Date(payload.warranty_start_date)
    ) {
      errors.warranty_end_date = 'Warranty end must be after start date';
    }

    if (status === 'In Warranty' && !payload.warranty_start_date) {
      errors.warranty_start_date = 'Warranty start date is required for In Warranty';
    }

    if (status === 'In Warranty' && !payload.warranty_end_date) {
      errors.warranty_end_date = 'Warranty end date is required for In Warranty';
    }

    return errors;
  };

  const onChange = (event) => {
    const next = { ...form, [event.target.name]: event.target.value };
    setForm(next);
    setFieldErrors(validateForm(next, warrantyStatus));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm(form, warrantyStatus);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix validation errors before submitting.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const { po_type, ...restForm } = form;
    const payload = {
      ...restForm,
      engine_dgno: form.equipment_no,
      warranty_status: warrantyStatus,
      po_number: po_type === 'po' ? form.po_number : null,
      po_date: po_type === 'po' ? form.po_date : null,
    };

    try {
      await createEquipment(payload);
      setSuccess('Equipment created successfully.');
      setForm(initialForm);
      setWarrantyStatus('Out of Warranty');
      setTimeout(() => navigate('/equipment'), 700);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create equipment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      {success && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-green-700">{success}</p>}

      <SectionCard title="Equipment Details">
        <Field label="Equipment No" name="equipment_no" value={form.equipment_no} onChange={onChange} required />
        {fieldErrors.equipment_no && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.equipment_no}</p>}
        <Field
          label="Manufacturing Date"
          name="manufacturing_date"
          type="date"
          value={form.manufacturing_date}
          onChange={onChange}
        />

        <div className="flex items-center gap-6 mt-2 md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={warrantyStatus === 'In Warranty'}
              onChange={() => setWarrantyStatus('In Warranty')}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">In Warranty</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={warrantyStatus === 'Out of Warranty'}
              onChange={() => {
                setWarrantyStatus('Out of Warranty');
                const next = { ...form, warranty_start_date: '', warranty_end_date: '' };
                setForm(next);
                setFieldErrors(validateForm(next, 'Out of Warranty'));
              }}
              className="w-4 h-4 accent-red-600"
            />
            <span className="text-sm font-medium text-gray-700">Out of Warranty</span>
          </label>
        </div>

        {warrantyStatus === 'In Warranty' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md md:col-span-2">
            <Field
              label="Warranty Start Date"
              name="warranty_start_date"
              type="date"
              value={form.warranty_start_date}
              onChange={onChange}
            />
            <Field
              label="Warranty End Date"
              name="warranty_end_date"
              type="date"
              value={form.warranty_end_date}
              onChange={onChange}
            />
          </div>
        )}
        {fieldErrors.warranty_start_date && <p className="mt-1 text-xs font-medium text-red-500 md:col-span-2">{fieldErrors.warranty_start_date}</p>}
        {fieldErrors.warranty_end_date && <p className="mt-1 text-xs font-medium text-red-500 md:col-span-2">{fieldErrors.warranty_end_date}</p>}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
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
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span className="text-sm font-semibold text-gray-700">IN_AMC</span>
          </label>
        </div>

        {form.in_amc && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1 p-3.5 bg-blue-50 border border-blue-200 rounded-md md:col-span-2">
            <div className="flex flex-col gap-1 text-sm font-semibold text-slate-700 md:col-span-3 pb-2 border-b border-blue-200/60">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">AMC Location (Branch)</span>
              <div className="flex items-center gap-6 mt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="amc_location"
                    value="Udupi"
                    checked={form.amc_location === 'Udupi' || !form.amc_location}
                    onChange={onChange}
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
                    onChange={onChange}
                    className="h-4 w-4 accent-blue-600 cursor-pointer"
                  />
                  <span>Mangalore</span>
                </label>
              </div>
            </div>

            <Field
              label="AMC Start Date"
              name="amc_start_date"
              type="date"
              value={form.amc_start_date}
              onChange={onChange}
            />
            <Field
              label="AMC End Date"
              name="amc_end_date"
              type="date"
              value={form.amc_end_date}
              onChange={onChange}
            />
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              AMC Amount (₹)
              <div className="relative flex items-center">
                <span className="absolute left-3 font-semibold text-slate-500">₹</span>
                <input
                  type="number"
                  name="amc_amount"
                  placeholder="e.g. 25000"
                  value={form.amc_amount}
                  onChange={onChange}
                  className="w-full rounded-md border border-slate-300/80 bg-white py-2.5 pl-7 pr-3 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                />
              </div>
            </label>

            {/* PO Section */}
            <div className="md:col-span-3 pt-2 border-t border-blue-200/60">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-2">Purchase Order (PO)</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="po_type"
                    value="none"
                    checked={form.po_type === 'none'}
                    onChange={(e) => setForm((prev) => ({ ...prev, po_type: 'none', po_number: '', po_date: '' }))}
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
                    onChange={(e) => setForm((prev) => ({ ...prev, po_type: 'po' }))}
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
                    onChange={onChange}
                    className="w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
                  />
                </label>
                <Field
                  label="PO Date"
                  name="po_date"
                  type="date"
                  value={form.po_date}
                  onChange={onChange}
                />
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Engine & Alternator">
        <Field label="Engine Make" name="engine_make" value={form.engine_make} onChange={onChange} />
        <Field label="Engine Model" name="engine_model" value={form.engine_model} onChange={onChange} />
        <Field label="KVA/HP" name="kva_hp" value={form.kva_hp} onChange={onChange} />
        <Field label="Alternator Make" name="alternator_make" value={form.alternator_make} onChange={onChange} />
        <Field label="Alternator S/N" name="alternator_sno" value={form.alternator_sno} onChange={onChange} />
        <Field label="Alternator Model" name="alternator_model" value={form.alternator_model} onChange={onChange} />
      </SectionCard>

      <SectionCard title="Customer / Site">
        <Field label="Customer Name" name="customer_name" value={form.customer_name} onChange={onChange} />
        <Field label="Site Name" name="site_name" value={form.site_name} onChange={onChange} />
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
          Address
          <textarea
            name="address"
            value={form.address}
            onChange={onChange}
            className="min-h-20 w-full rounded-md border border-slate-300/80 px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
          />
        </label>
        <Field label="Contact Person" name="contact_person" value={form.contact_person} onChange={onChange} />
        <Field label="Contact Number" name="contact_number" value={form.contact_number} onChange={onChange} />
        {fieldErrors.contact_number && <p className="mt-1 text-xs font-medium text-red-500 md:col-span-2">{fieldErrors.contact_number}</p>}
        <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} />
        {fieldErrors.email && <p className="mt-1 text-xs font-medium text-red-500 md:col-span-2">{fieldErrors.email}</p>}
      </SectionCard>

      <button
        type="submit"
        disabled={saving || Object.keys(fieldErrors).length > 0}
        className="rounded-md bg-accent px-6 py-2.5 font-bold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
      >
        {saving ? 'Saving...' : 'Submit Equipment'}
      </button>
    </form>
  );
}
