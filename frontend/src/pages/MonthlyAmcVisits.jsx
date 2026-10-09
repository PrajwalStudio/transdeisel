import { useEffect, useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getMonthlyAmcVisits } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import { buildPdfHeader, PDF_TABLE_STYLES, addPdfFooter } from '../utils/pdfExport';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

export default function MonthlyAmcVisits() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchVisits = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getMonthlyAmcVisits(month, year);
        setData(res.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch visits.');
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, [month, year]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (eq) =>
        eq.equipment_no?.toLowerCase().includes(q) ||
        eq.customer_name?.toLowerCase().includes(q) ||
        eq.site_name?.toLowerCase().includes(q) ||
        eq.amc_location?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const stats = useMemo(() => {
    const total = data.length;
    const completed = data.filter((eq) => eq.visit_id).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, completionRate };
  }, [data]);

  const generateYears = () => {
    const years = [];
    for (let i = currentYear - 3; i <= currentYear + 3; i++) {
      years.push(i);
    }
    return years;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatFileDate = (d) => d.toISOString().slice(0, 10);

  const getExportData = () => {
    return filtered.map((eq) => ({
      'Equipment No': eq.equipment_no || '—',
      'Engine DG No': eq.engine_dgno || '—',
      'Engine Make': eq.engine_make || '—',
      'Engine Model': eq.engine_model || '—',
      'KVA/HP': eq.kva_hp || '—',
      'Customer': eq.customer_name || '—',
      'Location': eq.amc_location || '—',
      'Site': eq.site_name || '—',
      'PO Number': eq.po_number || '—',
      'PO Date': eq.po_date ? formatDate(eq.po_date) : '—',
      'Status': eq.visit_id ? 'Completed' : 'Pending',
      'Visit Date': eq.visit_date ? formatDate(eq.visit_date) : '—',
      'Comments': eq.visit_comments || '—',
    }));
  };

  const onExportPdf = async () => {
    if (filtered.length === 0) return;
    const now = new Date();
    const doc = new jsPDF({ orientation: 'landscape' });

    const monthLabel = MONTHS.find((m) => m.value === month)?.label || '';
    const startY = await buildPdfHeader(
      doc,
      'Monthly AMC Visit Tracking Report',
      `Month: ${monthLabel} ${year} | Search Filter: ${search || 'All'} | Total Records: ${filtered.length}`
    );

    const pdfHeaders = [
      'Equipment No',
      'Customer & Site',
      'Engine Make',
      'Engine Model',
      'DG No / KVA',
      'Location',
      'PO Details',
      'Visit Status',
      'Visit Date',
      'Comments',
    ];

    const pdfBody = filtered.map((eq) => [
      eq.equipment_no || '—',
      `${eq.customer_name || '—'}\nSite: ${eq.site_name || '—'}`,
      eq.engine_make || '—',
      eq.engine_model || '—',
      `DG: ${eq.engine_dgno || '—'}\n${eq.kva_hp || '—'}`,
      eq.amc_location || '—',
      eq.po_number ? `PO# ${eq.po_number}\n${eq.po_date ? formatDate(eq.po_date) : ''}` : '—',
      eq.visit_id ? 'Completed' : 'Pending Visit',
      eq.visit_date ? formatDate(eq.visit_date) : '—',
      eq.visit_comments || '—',
    ]);

    autoTable(doc, {
      startY,
      head: [pdfHeaders],
      body: pdfBody,
      ...PDF_TABLE_STYLES,
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 40 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26 },
        4: { cellWidth: 26 },
        5: { cellWidth: 22 },
        6: { cellWidth: 26 },
        7: { cellWidth: 24 },
        8: { cellWidth: 22 },
        9: { cellWidth: 40 },
      },
    });

    addPdfFooter(doc);

    doc.save(`monthly_amc_visits_${monthLabel}_${year}_${formatFileDate(now)}.pdf`);
  };


  const onExportExcel = () => {
    const exportRows = getExportData();
    if (exportRows.length === 0) return;
    const now = new Date();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    const monthLabel = MONTHS.find(m => m.value === month)?.label || '';
    XLSX.utils.book_append_sheet(wb, ws, 'Visits');
    XLSX.writeFile(wb, `monthly_amc_visits_${monthLabel}_${year}_${formatFileDate(now)}.xlsx`);
  };

  const columns = [
    { key: 'equipment_no', label: 'Equipment No', render: (row) => <span className="font-bold text-navy">{row.equipment_no}</span> },
    { key: 'engine_make', label: 'Engine Make', render: (row) => <span className="font-medium text-slate-800">{row.engine_make || '—'}</span> },
    { key: 'engine_model', label: 'Engine Model', render: (row) => <span className="font-medium text-slate-800">{row.engine_model || '—'}</span> },
    { key: 'engine_dgno_kva', label: 'DG No / KVA', render: (row) => (
      <div className="text-xs space-y-0.5">
        <p><span className="text-slate-500">DG No:</span> <span className="font-medium text-slate-800">{row.engine_dgno || '—'}</span></p>
        <p><span className="text-slate-500">KVA/HP:</span> <span className="font-medium text-slate-800">{row.kva_hp || '—'}</span></p>
      </div>
    )},
    { key: 'customer_name', label: 'Customer', render: (row) => <span className="font-semibold text-slate-800">{row.customer_name || '—'}</span> },
    { key: 'location_site', label: 'Location / Site', render: (row) => (
        <div>
          <p className="text-slate-800">{row.amc_location || '—'}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">{row.site_name || '—'}</p>
        </div>
      )
    },
    { key: 'po_details', label: 'PO', render: (row) => (
      row.po_number ? (
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-slate-800">#{row.po_number}</p>
          <p className="text-slate-500">{row.po_date ? formatDate(row.po_date) : '—'}</p>
        </div>
      ) : <span className="text-slate-400 text-xs">—</span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
        row.visit_id ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 whitespace-nowrap">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            Completed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 whitespace-nowrap">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Pending
          </span>
        )
      )
    },
    { key: 'visit_date', label: 'Visit Date', render: (row) => <span className="font-medium text-slate-600">{row.visit_date ? formatDate(row.visit_date) : '—'}</span> },
    { key: 'comments', label: 'Comments', render: (row) => (
        <span className="block max-w-[150px] truncate text-slate-500" title={row.visit_comments}>
          {row.visit_comments || '—'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between rounded-lg bg-white p-4 shadow-panel">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full md:w-40 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium focus:border-navy focus:ring-1 focus:ring-navy outline-none"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full md:w-28 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium focus:border-navy focus:ring-1 focus:ring-navy outline-none"
          >
            {generateYears().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search equipment, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 rounded-md border border-slate-300 px-4 py-2 text-sm outline-none focus:border-navy transition-colors"
          />
          <button
            type="button"
            onClick={onExportPdf}
            disabled={filtered.length === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            title="Export to PDF"
          >
            PDF
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            disabled={filtered.length === 0}
            className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            title="Export to Excel"
          >
            Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total AMC Equipments</p>
            <p className="text-3xl font-extrabold text-navy">{stats.total}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-24 h-24 text-navy" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 3.83L17.17 19H6.83L12 5.83z" /></svg>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-panel flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Visits Completed</p>
            <p className="text-3xl font-extrabold text-emerald-700">{stats.completed}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-24 h-24 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-panel flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">Visits Pending</p>
            <p className="text-3xl font-extrabold text-amber-700">{stats.pending}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-24 h-24 text-amber-600" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-.22-13h-.06c-.4 0-.72.32-.72.72v4.72c0 .35.18.68.49.86l4.15 2.49c.34.2.78.1.98-.24a.71.71 0 0 0-.25-.99l-3.87-2.3V7.72c0-.4-.32-.72-.72-.72z" /></svg>
          </div>
        </div>

        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5 shadow-panel flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-1">Completion Rate</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-extrabold text-violet-700">{stats.completionRate}%</p>
            </div>
          </div>
          <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full border-4 border-violet-200 flex items-center justify-center">
            <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">{error}</div>}

      {/* Main List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-navy px-1">Visit Status Tracker</h3>
        
        {loading ? (
          <div className="p-10 bg-white rounded-xl shadow-panel"><LoadingSpinner label="Loading visit tracking data..." /></div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filtered} 
            emptyText="No equipment found matching criteria." 
          />
        )}
      </div>
    </div>
  );
}
