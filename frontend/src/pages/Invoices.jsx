import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { getInvoices, updateInvoice } from '../services/api';
import { buildPdfHeader, PDF_TABLE_STYLES } from '../utils/pdfExport';

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-');
const formatDateTime = (date) => (date ? new Date(date).toLocaleString() : '-');
const formatFileDate = (date) => date.toISOString().slice(0, 10);

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editInvoiceData, setEditInvoiceData] = useState(null);
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editResolutionDate, setEditResolutionDate] = useState('');
  const [modalError, setModalError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getInvoices();
      setInvoices(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Auto-clear success message after 5 s
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [success]);

  const [sortOrder, setSortOrder] = useState('desc');

  const filteredInvoices = useMemo(() => {
    let list = [...invoices];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (row) =>
          row.invoice_number?.toLowerCase().includes(q) ||
          row.equipment_no?.toLowerCase().includes(q) ||
          row.customer_name?.toLowerCase().includes(q) ||
          row.site_name?.toLowerCase().includes(q) ||
          row.engine_model?.toLowerCase().includes(q) ||
          row.call_category?.toLowerCase().includes(q) ||
          String(row.invoice_id).includes(q) ||
          String(row.request_id).includes(q)
      );
    }
    return list.sort((a, b) => {
      const dateA = new Date(a.visit_date || 0).getTime();
      const dateB = new Date(b.visit_date || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [invoices, search, sortOrder]);

  const onExportPdf = async () => {
    if (filteredInvoices.length === 0) return;
    const now = new Date();
    const doc = new jsPDF({ orientation: 'landscape' });
    
    const startY = await buildPdfHeader(doc, 'Completed Service Invoices');

    autoTable(doc, {
      startY,
      head: [
        ['Inv ID', 'Inv Number', 'Resolution Date', 'Req ID', 'Eq No', 'Customer', 'Site', 'Engine Model', 'KVA/HP', 'Category', 'Visit Date', 'Created At'],
      ],
      body: filteredInvoices.map((row) => [
        `#${row.invoice_id}`,
        row.invoice_number || '-',
        formatDate(row.resolution_date),
        `#${row.request_id}`,
        row.equipment_no || '-',
        row.customer_name || '-',
        row.site_name || '-',
        row.engine_model || '-',
        row.kva_hp || '-',
        row.call_category || '-',
        formatDate(row.visit_date),
        formatDateTime(row.created_at),
      ]),
      ...PDF_TABLE_STYLES
    });

    doc.save(`invoices_${formatFileDate(now)}.pdf`);
  };

  const onExportExcel = () => {
    if (filteredInvoices.length === 0) return;
    const now = new Date();
    const rows = filteredInvoices.map((row) => ({
      'Invoice ID': row.invoice_id,
      'Invoice Number': row.invoice_number,
      'Resolution Date': formatDate(row.resolution_date),
      'Request ID': row.request_id,
      'Equipment No': row.equipment_no,
      'Customer Name': row.customer_name,
      'Site Name': row.site_name,
      'Engine Model': row.engine_model,
      'KVA/HP': row.kva_hp,
      'Call Category': row.call_category,
      'Visit Date': formatDate(row.visit_date),
      'Created At': formatDateTime(row.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, `invoices_${formatFileDate(now)}.xlsx`);
  };

  const openEditModal = (row) => {
    setEditInvoiceData(row);
    setEditInvoiceNumber(row.invoice_number || '');
    setEditResolutionDate(row.resolution_date ? new Date(row.resolution_date).toISOString().slice(0, 10) : '');
    setModalError('');
  };

  const closeEditModal = () => {
    setEditInvoiceData(null);
    setEditInvoiceNumber('');
    setEditResolutionDate('');
    setModalError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editInvoiceNumber.trim()) {
      setModalError('Invoice number is required.');
      return;
    }
    setSavingEdit(true);
    setModalError('');
    setError('');
    setSuccess('');
    
    try {
      await updateInvoice(editInvoiceData.invoice_id, {
        invoice_number: editInvoiceNumber.trim(),
        resolution_date: editResolutionDate || null,
      });
      setSuccess(`Invoice #${editInvoiceData.invoice_id} updated successfully.`);
      closeEditModal();
      await fetchInvoices();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to update invoice.');
    } finally {
      setSavingEdit(false);
    }
  };

  const columns = [
    { key: 'invoice_id', label: 'Invoice ID', render: (row) => `#${row.invoice_id}` },
    {
      key: 'invoice_number',
      label: 'Invoice Number',
      render: (row) => (
        <span className="font-bold text-navy bg-blue-50/80 border border-blue-200 px-2 py-0.5 rounded text-xs">
          {row.invoice_number}
        </span>
      ),
    },
    { key: 'request_id', label: 'Request ID', render: (row) => `#${row.request_id}` },
    { key: 'equipment_no', label: 'Equipment No' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'site_name', label: 'Site Name' },
    { key: 'engine_model', label: 'Engine Model' },
    { key: 'kva_hp', label: 'KVA/HP' },
    { key: 'call_category', label: 'Call Category' },
    { key: 'visit_date', label: 'Visit Date', render: (row) => formatDate(row.visit_date) },
    { key: 'resolution_date', label: 'Resolution Date', render: (row) => (
        <span className={row.resolution_date ? 'font-semibold text-emerald-700' : 'text-slate-400'}>
          {formatDate(row.resolution_date)}
        </span>
      ),
    },
    { key: 'created_at', label: 'Created At', render: (row) => formatDateTime(row.created_at) },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          type="button"
          onClick={() => openEditModal(row)}
          className="text-xs font-semibold text-navy hover:text-navy/80 transition"
        >
          Edit
        </button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner label="Loading completed invoices..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-panel">
        <div>
          <h2 className="text-xl font-bold text-navy">Service Invoices</h2>
          <p className="text-xs text-slate-500">Record of all completed service orders and their assigned invoice numbers.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            className="w-full sm:w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            placeholder="Search invoice, equipment, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            disabled={filteredInvoices.length === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            disabled={filteredInvoices.length === 0}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition shadow-sm"
          >
            Export Excel
          </button>
        </div>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      {success && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-green-700">{success}</p>}

      <DataTable columns={columns} data={filteredInvoices} emptyText="No completed invoices found." />

      {/* Edit Invoice Modal */}
      {editInvoiceData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={closeEditModal}
        >
          <form onSubmit={handleEditSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-navy">Edit Invoice #{editInvoiceData.invoice_id}</h3>
            
            {modalError && <p className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{modalError}</p>}

            <label className="block space-y-1">
              <span className="text-sm font-semibold text-slate-700">Invoice Number</span>
              <input
                type="text"
                autoFocus
                value={editInvoiceNumber}
                onChange={(e) => setEditInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-001"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-semibold text-slate-700">Resolution Date</span>
              <input
                type="date"
                value={editResolutionDate}
                onChange={(e) => setEditResolutionDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingEdit}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition shadow-sm"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
