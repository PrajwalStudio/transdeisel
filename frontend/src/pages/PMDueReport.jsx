import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { getPMDueReport } from '../services/api';
import { buildPdfHeader, PDF_TABLE_STYLES, addPdfFooter } from '../utils/pdfExport';

const formatDate = (value) => {
  if (!value) return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [yyyy, mm, dd] = value.slice(0, 10).split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const formatFileDate = (d) => d.toISOString().slice(0, 10);

export default function PMDueReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const statusFilter = searchParams.get('status') || 'all';

  const setStatusFilter = (newStatus) => {
    if (newStatus === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status: newStatus });
    }
  };

  useEffect(() => {
    const fetchPM = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getPMDueReport();
        setRows(response.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load PM due report.');
      } finally {
        setLoading(false);
      }
    };
    fetchPM();
  }, []);

  const counts = useMemo(() => {
    const total = rows.length;
    const overdue = rows.filter((r) => r.pm_status === 'Overdue').length;
    const dueSoon = rows.filter((r) => r.pm_status === 'Due Soon').length;
    const ok = rows.filter((r) => r.pm_status === 'OK' || !r.pm_status).length;
    return { total, overdue, dueSoon, ok };
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;

    // Filter by PM status
    if (statusFilter === 'overdue') {
      list = list.filter((r) => r.pm_status === 'Overdue');
    } else if (statusFilter === 'due_soon') {
      list = list.filter((r) => r.pm_status === 'Due Soon');
    } else if (statusFilter === 'ok') {
      list = list.filter((r) => r.pm_status === 'OK' || !r.pm_status);
    }

    // Date range filter
    if (startDate) {
      const s = new Date(startDate).getTime();
      list = list.filter((r) => r.last_service_date && new Date(r.last_service_date).getTime() >= s);
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      list = list.filter((r) => r.last_service_date && new Date(r.last_service_date).getTime() <= e.getTime());
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.equipment_no?.toLowerCase().includes(q) ||
          r.customer_name?.toLowerCase().includes(q) ||
          r.site_name?.toLowerCase().includes(q) ||
          r.engine_model?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [rows, statusFilter, startDate, endDate, search]);

  const exportRows = useMemo(
    () =>
      filteredRows.map((r) => ({
        'Equipment No': r.equipment_no || '—',
        'Customer': r.customer_name || '—',
        'Site': r.site_name || '—',
        'Engine Model': r.engine_model || '—',
        'KVA/HP': r.kva_hp || '—',
        'Last Service': formatDate(r.last_service_date),
        'Next Service': formatDate(r.next_service_date),
        'Last Run Hrs': r.last_running_hours || '—',
        'Last Comment': r.last_comment || '—',
        'Status': r.pm_status || '—',
      })),
    [filteredRows]
  );

  const onExportPdf = async () => {
    if (filteredRows.length === 0) return;
    const now = new Date();
    const doc = new jsPDF({ orientation: 'landscape' });

    const filterText = `Filter Status: ${statusFilter.toUpperCase()} | Range: ${startDate || 'Any'} to ${endDate || 'Any'} | Records: ${filteredRows.length}`;
    const startY = await buildPdfHeader(doc, 'Preventive Maintenance (PM) Due Report', filterText);

    const pdfHeaders = [
      'Equipment No',
      'Customer & Site',
      'Engine Model',
      'KVA/HP',
      'Last Service',
      'Next Service Due',
      'Status',
      'Last Comment',
    ];

    const pdfBody = filteredRows.map((r) => [
      r.equipment_no || '—',
      `${r.customer_name || '—'}\nSite: ${r.site_name || '—'}`,
      r.engine_model || '—',
      r.kva_hp || '—',
      `${formatDate(r.last_service_date)}\n(${r.last_running_hours ? `${r.last_running_hours} hrs` : 'N/A'})`,
      `${formatDate(r.next_service_date)}\nPeriod: ${r.pm_service_period || '—'}`,
      r.pm_status || 'OK',
      r.last_comment || '—',
    ]);

    autoTable(doc, {
      startY,
      head: [pdfHeaders],
      body: pdfBody,
      ...PDF_TABLE_STYLES,
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 22 },
        4: { cellWidth: 35 },
        5: { cellWidth: 35 },
        6: { cellWidth: 25 },
        7: { cellWidth: 35 },
      },
    });

    addPdfFooter(doc);

    doc.save(`pm_due_report_${statusFilter}_${formatFileDate(now)}.pdf`);
  };

  const onExportExcel = () => {
    if (filteredRows.length === 0) return;
    const now = new Date();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PM Due');
    XLSX.writeFile(wb, `pm_due_report_${statusFilter}_${formatFileDate(now)}.xlsx`);
  };

  if (loading) {
    return <LoadingSpinner label="Loading PM due report..." />;
  }

  const columns = [
    { key: 'equipment_no', label: 'Equipment No', render: (r) => <span className="font-bold text-navy">{r.equipment_no}</span> },
    { key: 'customer_name', label: 'Customer', render: (r) => <span className="font-semibold text-slate-800">{r.customer_name || '—'}</span> },
    { key: 'site_name', label: 'Site', render: (r) => r.site_name || '—' },
    { key: 'engine_model', label: 'Engine Model', render: (r) => r.engine_model || '—' },
    { key: 'kva_hp', label: 'KVA/HP', render: (r) => r.kva_hp || '—' },
    { key: 'last_service_date', label: 'Last Service', render: (row) => formatDate(row.last_service_date) },
    { key: 'next_service_date', label: 'Next Service', render: (row) => formatDate(row.next_service_date) },
    { key: 'last_running_hours', label: 'Last Run Hrs', render: (row) => row.last_running_hours || '—' },
    { key: 'last_comment', label: 'Last Comment', render: (row) => <span className="block max-w-[150px] truncate" title={row.last_comment}>{row.last_comment || '—'}</span> },
    { key: 'pm_status', label: 'Status', render: (row) => <StatusBadge status={row.pm_status} /> },
  ];


  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-panel">
        <div>
          <h2 className="text-xl font-extrabold text-navy">PM Due Report</h2>
          <p className="text-xs text-slate-500">Track and manage preventive maintenance schedules for equipment.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer rounded-xl border p-4 shadow-panel transition-all hover:scale-[1.02] ${
            statusFilter === 'all'
              ? 'border-navy bg-navy text-white shadow-md'
              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-slate-200' : 'text-slate-500'}`}>
            Total Equipments
          </p>
          <p className="mt-1 text-2xl font-extrabold">{counts.total}</p>
        </div>

        <div
          onClick={() => setStatusFilter('overdue')}
          className={`cursor-pointer rounded-xl border p-4 shadow-panel transition-all hover:scale-[1.02] ${
            statusFilter === 'overdue'
              ? 'border-rose-600 bg-rose-600 text-white shadow-md'
              : 'border-rose-200 bg-rose-50/60 text-rose-900 hover:border-rose-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'overdue' ? 'text-rose-100' : 'text-rose-700'}`}>
            Overdue PM
          </p>
          <p className="mt-1 text-2xl font-extrabold">{counts.overdue}</p>
        </div>

        <div
          onClick={() => setStatusFilter('due_soon')}
          className={`cursor-pointer rounded-xl border p-4 shadow-panel transition-all hover:scale-[1.02] ${
            statusFilter === 'due_soon'
              ? 'border-amber-600 bg-amber-600 text-white shadow-md'
              : 'border-amber-200 bg-amber-50/60 text-amber-900 hover:border-amber-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'due_soon' ? 'text-amber-100' : 'text-amber-700'}`}>
            Due Soon (30d)
          </p>
          <p className="mt-1 text-2xl font-extrabold">{counts.dueSoon}</p>
        </div>

        <div
          onClick={() => setStatusFilter('ok')}
          className={`cursor-pointer rounded-xl border p-4 shadow-panel transition-all hover:scale-[1.02] ${
            statusFilter === 'ok'
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
              : 'border-emerald-200 bg-emerald-50/60 text-emerald-900 hover:border-emerald-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'ok' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Service OK
          </p>
          <p className="mt-1 text-2xl font-extrabold">{counts.ok}</p>
        </div>
      </div>

      {/* Filters and Exports */}
      <div className="flex flex-col space-y-3 rounded-xl bg-white p-4 shadow-panel border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status filter buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: 'All Records', count: counts.total, color: 'bg-navy text-white' },
              { key: 'overdue', label: 'Overdue', count: counts.overdue, color: 'bg-rose-600 text-white' },
              { key: 'due_soon', label: 'Due Soon', count: counts.dueSoon, color: 'bg-amber-600 text-white' },
              { key: 'ok', label: 'Service OK', count: counts.ok, color: 'bg-emerald-600 text-white' },
            ].map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    isActive ? tab.color + ' shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportPdf}
              disabled={filteredRows.length === 0}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={onExportExcel}
              disabled={filteredRows.length === 0}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Date Filters & Search Input */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="startDate" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                From:
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-navy"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="endDate" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                To:
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-navy"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-navy underline"
              >
                Clear Dates
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Search equipment, customer, site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-md border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-navy"
          />
        </div>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

      {filteredRows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-panel space-y-2">
          <p className="text-base font-semibold text-slate-700">No PM due records found</p>
          <p className="text-xs text-slate-400">No equipment matches the selected filters.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredRows} keyField="equipment_no" />
      )}
    </div>
  );
}

