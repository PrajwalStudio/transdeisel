import { useEffect, useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { getOrders, updateOrder, updateRequest, deleteRequest } from '../services/api';
import { buildPdfHeader, PDF_TABLE_STYLES } from '../utils/pdfExport';

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-');

export default function ServiceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (startDate) {
      const s = new Date(startDate).getTime();
      list = list.filter((o) => o.visit_date && new Date(o.visit_date).getTime() >= s);
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      list = list.filter((o) => o.visit_date && new Date(o.visit_date).getTime() <= e.getTime());
    }
    return list;
  }, [orders, startDate, endDate]);

  const exportRows = useMemo(
    () =>
      filteredOrders.map((o) => ({
        'Order ID': `#${o.order_id}`,
        'Equipment No': o.equipment_no || '—',
        'Site Name': o.site_name || '—',
        'Engine Model': o.engine_model || '—',
        'KVA/HP': o.kva_hp || '—',
        'Call Category': o.call_category || '—',
        'Visit Date': formatDate(o.visit_date),
        'Symptom': o.symptom || '—',
        'Cause': o.cause || '—',
        'Activity': o.activity || '—',
        'Approval Status': o.approval_status || 'Pending',
      })),
    [filteredOrders]
  );

  const onExportPdf = async () => {
    const now = new Date();
    const doc = new jsPDF({ orientation: 'landscape' });
    
    const startY = await buildPdfHeader(doc, 'Service Orders');

    const headers = Object.keys(exportRows[0] || {});
    autoTable(doc, {
      startY,
      head: [headers],
      body: exportRows.map(Object.values),
      ...PDF_TABLE_STYLES
    });

    doc.save(`service_orders_${now.toISOString().slice(0, 10)}.pdf`);
  };

  const onExportExcel = () => {
    const now = new Date();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `service_orders_${now.toISOString().slice(0, 10)}.xlsx`);
  };

  // Auto-clear success message after 5 s
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [success]);

  // Modal state for invoice completion
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [resolutionDate, setResolutionDate] = useState('');
  const [modalError, setModalError] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Modal state for editing request
  const [editOrder, setEditOrder] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  const openEditModal = (order) => {
    setEditOrder(order);
    setEditForm({
      call_category: order.call_category || '',
      visit_date: order.visit_date ? new Date(order.visit_date).toISOString().slice(0, 10) : '',
      symptom: order.symptom || '',
      running_hours: order.running_hours || '',
      comments: order.comments || '',
    });
    setEditModalError('');
  };

  const closeEditModal = () => {
    setEditOrder(null);
    setEditForm({});
    setEditModalError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    setEditModalError('');
    setError('');
    setSuccess('');

    try {
      await updateRequest(editOrder.request_id, editForm);
      setSuccess(`Request #${editOrder.request_id} updated successfully.`);
      closeEditModal();
      await fetchOrders();
    } catch (err) {
      setEditModalError(err.response?.data?.error || 'Failed to update request.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete order #${row.order_id} (Request #${row.request_id})? This action cannot be undone.`)) return;
    
    setError('');
    setSuccess('');
    try {
      await deleteRequest(row.request_id);
      setSuccess(`Order #${row.order_id} deleted successfully.`);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete order.');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getOrders();
      setOrders(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openInvoiceModal = (order) => {
    setSelectedOrder(order);
    setInvoiceNumber('');
    setResolutionDate('');
    setModalError('');
  };

  const closeInvoiceModal = () => {
    setSelectedOrder(null);
    setInvoiceNumber('');
    setResolutionDate('');
    setModalError('');
  };

  const handleCompleteOrder = async (e) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setModalError('Invoice number is required.');
      return;
    }
    if (!resolutionDate) {
      setModalError('Resolution date is required.');
      return;
    }

    if (!selectedOrder) return;

    setSubmittingInvoice(true);
    setModalError('');
    setError('');
    setSuccess('');

    try {
      await updateOrder(selectedOrder.order_id, {
        invoice_number: invoiceNumber.trim(),
        resolution_date: resolutionDate,
      });
      setSuccess(`Order #${selectedOrder.order_id} marked as complete and moved to invoices.`);
      closeInvoiceModal();
      await fetchOrders();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to complete order.');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleToggleApproval = async (orderId, currentStatus) => {
    const nextStatus = currentStatus === 'Approved' ? 'Pending' : 'Approved';
    setBusyOrderId(orderId);
    setError('');
    setSuccess('');

    try {
      await updateOrder(orderId, { approval_status: nextStatus });
      // Patch only the changed row in local state — no full reload, table stays still
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, approval_status: nextStatus } : o))
      );
      setSuccess(`Order #${orderId} approval status updated to ${nextStatus}.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update order status.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const columns = [
    { key: 'order_id', label: 'Order ID', render: (row) => `#${row.order_id}` },
    { key: 'equipment_no', label: 'Equipment No' },
    { key: 'site_name', label: 'Site Name' },
    { key: 'engine_model', label: 'Engine Model' },
    { key: 'kva_hp', label: 'KVA/HP' },
    { key: 'call_category', label: 'Call Category' },
    { key: 'visit_date', label: 'Visit Date', render: (row) => formatDate(row.visit_date) },
    { key: 'symptom', label: 'Symptom', render: (row) => <span className="max-w-[120px] block truncate" title={row.symptom || ''}>{row.symptom || '-'}</span> },
    { key: 'cause', label: 'Cause', render: (row) => <span className="max-w-[120px] block truncate" title={row.cause || ''}>{row.cause || '-'}</span> },
    { key: 'activity', label: 'Activity', render: (row) => <span className="max-w-[120px] block truncate" title={row.activity || ''}>{row.activity || '-'}</span> },
    {
      key: 'approval_status',
      label: 'Approval Status',
      render: (row) => (
        <button
          type="button"
          disabled={busyOrderId === row.order_id}
          onClick={() => handleToggleApproval(row.order_id, row.approval_status)}
          title="Click to toggle approval status"
          className="group flex items-center gap-1.5 cursor-pointer"
        >
          <StatusBadge status={row.approval_status || 'Pending'} />
          <span className="text-[10px] text-slate-400 group-hover:text-navy">✏️</span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busyOrderId === row.order_id}
            onClick={() => openEditModal(row)}
            className="text-xs font-semibold text-navy hover:text-navy/80 disabled:opacity-50 transition"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={busyOrderId === row.order_id}
            onClick={() => handleDelete(row)}
            className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50 transition"
          >
            Delete
          </button>
          {row.approval_status === 'Approved' && (
            <button
              type="button"
              disabled={busyOrderId === row.order_id}
              onClick={() => openInvoiceModal(row)}
              className="rounded-md px-3 py-1.5 text-xs font-bold text-white bg-accent shadow-sm transition-all hover:bg-accent/90 hover:shadow disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 ml-2"
            >
              Mark Complete
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner label="Loading orders..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-panel">
        <div>
          <h2 className="text-xl font-bold text-navy">Service Orders</h2>
          <p className="text-xs text-slate-500">Manage active service orders, update approval status, or mark completed with invoice number.</p>
        </div>
      </div>

      {/* Date Filter & Export Bar */}
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
            disabled={filteredOrders.length === 0}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            disabled={filteredOrders.length === 0}
            className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* ── Toast notification (fixed top-right, does not shift layout) ── */}
      {(error || success) && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium transition-all duration-300
            ${
              error
                ? 'bg-red-600 text-white border border-red-700'
                : 'bg-emerald-600 text-white border border-emerald-700'
            }`}
          style={{ maxWidth: '26rem', minWidth: '18rem' }}
        >
          <span className="mt-0.5 shrink-0 text-base">{error ? '✕' : '✓'}</span>
          <span className="flex-1 leading-snug">{error || success}</span>
          <button
            type="button"
            onClick={() => { setError(''); setSuccess(''); }}
            className="ml-1 shrink-0 opacity-80 hover:opacity-100 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredOrders}
        emptyText="No active service orders. All orders have been invoiced or none have been created yet."
      />

      {/* Modal for Invoice Number input */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={closeInvoiceModal}
        >
          <form onSubmit={handleCompleteOrder} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-navy">Complete Order #{selectedOrder.order_id}</h3>
            <p className="text-sm text-slate-600">
              Enter the invoice number for equipment <strong className="text-slate-800">{selectedOrder.equipment_no}</strong> ({selectedOrder.customer_name}) to mark order as completed and move to invoices.
            </p>

            {modalError && <p className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{modalError}</p>}

            <label className="block space-y-1">
              <span className="text-sm font-semibold text-slate-700">Invoice Number</span>
              <input
                type="text"
                autoFocus
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-001"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-semibold text-slate-700">Resolution Date</span>
              <input
                type="date"
                value={resolutionDate}
                onChange={(e) => setResolutionDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeInvoiceModal}
                disabled={submittingInvoice}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingInvoice}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition shadow-sm"
              >
                {submittingInvoice ? 'Submitting...' : 'Complete & Generate Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for Editing Service Request */}
      {editOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={closeEditModal}
        >
          <form onSubmit={handleEditSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-navy">Edit Request #{editOrder.request_id}</h3>
            
            {editModalError && <p className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{editModalError}</p>}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Call Category
                <select
                  value={editForm.call_category}
                  onChange={(e) => setEditForm({...editForm, call_category: e.target.value})}
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
              </label>
              
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Visit Date
                <input
                  type="date"
                  value={editForm.visit_date}
                  onChange={(e) => setEditForm({...editForm, visit_date: e.target.value})}
                  className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Running Hours
                <input
                  type="number"
                  value={editForm.running_hours}
                  onChange={(e) => setEditForm({...editForm, running_hours: e.target.value})}
                  className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Symptom
                <input
                  type="text"
                  value={editForm.symptom}
                  onChange={(e) => setEditForm({...editForm, symptom: e.target.value})}
                  className="rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
                Comments
                <textarea
                  value={editForm.comments}
                  onChange={(e) => setEditForm({...editForm, comments: e.target.value})}
                  className="min-h-20 rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-navy"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={submittingEdit}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingEdit}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition shadow-sm"
              >
                {submittingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
