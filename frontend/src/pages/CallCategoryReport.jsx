import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { getCallCategoryDetails, getCallCategoryVisits } from '../services/api';
import { buildPdfHeader, PDF_TABLE_STYLES } from '../utils/pdfExport';

/* ─── SVG icons per category ────────────────────────────────── */
const IconWrench = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.653-4.655m0 0l3.105-3.105c.14-.47.38-.892.766-1.208" />
  </svg>
);
const IconCog = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconAdjustments = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
  </svg>
);
const IconChip = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
  </svg>
);
const IconAlert = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);
const IconClipboard = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);
const IconPin = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

/* ─── colour palette per category ───────────────────────────── */
const CATEGORY_STYLE = {
  'Preventive Maintainance-B': {
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    Icon: IconWrench,
    accentBg: 'bg-blue-500',
    iconColor: 'text-blue-500',
  },
  'Preventive Maintainance-C': {
    border: 'border-l-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    Icon: IconCog,
    accentBg: 'bg-indigo-500',
    iconColor: 'text-indigo-500',
  },
  'Preventive Maintainance-D': {
    border: 'border-l-violet-500',
    badge: 'bg-violet-100 text-violet-800 border-violet-300',
    Icon: IconAdjustments,
    accentBg: 'bg-violet-500',
    iconColor: 'text-violet-500',
  },
  'Preventive Maintainance-E': {
    border: 'border-l-purple-500',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    Icon: IconChip,
    accentBg: 'bg-purple-500',
    iconColor: 'text-purple-500',
  },
  Complaint: {
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-800 border-red-300',
    Icon: IconAlert,
    accentBg: 'bg-red-500',
    iconColor: 'text-red-500',
  },
  'AMC Visit': {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Icon: IconClipboard,
    accentBg: 'bg-emerald-500',
    iconColor: 'text-emerald-500',
  },
};

const DEFAULT_STYLE = {
  border: 'border-l-slate-400',
  badge: 'bg-slate-100 text-slate-700 border-slate-300',
  Icon: IconPin,
  accentBg: 'bg-slate-400',
  iconColor: 'text-slate-400',
};

const getStyle = (cat) => CATEGORY_STYLE[cat] || DEFAULT_STYLE;

/* ─── helpers ────────────────────────────────────────────────── */
const fmt = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/* ─── sub-components ─────────────────────────────────────────── */
function CategoryCard({ item, selected, onClick }) {
  const style = getStyle(item.call_category);
  const isActive = selected === item.call_category;
  const total = Number(item.visits);
  const approved = Number(item.approved_visits || 0);
  const pending = total - approved;

  return (
    <button
      type="button"
      onClick={() => onClick(item.call_category)}
      className={`
        group relative w-full cursor-pointer rounded-lg border-l-4 bg-white p-5 text-left shadow-sm
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
        ${style.border}
        ${isActive ? 'ring-2 ring-navy ring-offset-1 shadow-md -translate-y-0.5' : ''}
      `}
    >
      {/* active indicator dot */}
      {isActive && (
        <span className="absolute right-3 top-3 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-navy opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-navy" />
        </span>
      )}

      <div className={`flex items-start justify-between gap-2 ${style.iconColor}`}>
        <style.Icon />
      </div>

      <p className="mt-2 text-xs font-medium text-slate-500 leading-snug">
        {item.call_category || 'Unknown'}
      </p>
      <p className="mt-1 text-3xl font-extrabold text-navy">{total}</p>
      <p className="mt-1 text-[11px] text-slate-400 uppercase tracking-wide">
        {total === 1 ? 'visit' : 'visits'}
      </p>

      {/* Approved / Pending breakdown */}
      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
          {approved} approved
        </span>
        {pending > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 font-semibold text-yellow-700">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 inline-block" />
            {pending} pending
          </span>
        )}
      </div>

      <div
        className={`mt-3 h-1 w-full rounded-full opacity-30 transition-opacity group-hover:opacity-60 ${style.accentBg}`}
      />

      <p className="mt-2 text-[11px] font-medium text-slate-400 group-hover:text-navy transition-colors">
        {isActive ? '↻ Click to refresh' : '▼ Click to view details'}
      </p>
    </button>
  );
}

/* ─── detail table ───────────────────────────────────────────── */
function DetailPanel({ category, details, loading, onClose }) {
  const style = getStyle(category);

  const exportRows = details.map((r) => ({
    'Request ID': `#${r.request_id}`,
    'Equipment No': r.equipment_no || '—',
    'Customer': r.customer_name || '—',
    'Site Name': r.site_name || '—',
    'Visit Date': fmt(r.visit_date),
    'Running Hours': r.running_hours ?? '—',
    'PM Period': r.pm_service_period || '—',
    'Symptom': r.symptom || '—',
    'Cause': r.cause || '—',
    'Activity': r.activity || '—',
    'Approval Status': r.approval_status || 'Pending',
  }));

  const onExportPdf = async () => {
    if (exportRows.length === 0) return;
    const now = new Date();
    const doc = new jsPDF({ orientation: 'landscape' });
    
    const startY = await buildPdfHeader(doc, `${category} Report`);

    const headers = Object.keys(exportRows[0] || {});
    autoTable(doc, {
      startY,
      head: [headers],
      body: exportRows.map(Object.values),
      ...PDF_TABLE_STYLES
    });

    doc.save(`${category.replace(/\s+/g, '_').toLowerCase()}_report_${now.toISOString().slice(0, 10)}.pdf`);
  };

  const onExportExcel = () => {
    if (exportRows.length === 0) return;
    const now = new Date();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, category.substring(0, 31));
    XLSX.writeFile(wb, `${category.replace(/\s+/g, '_').toLowerCase()}_report_${now.toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-panel overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between bg-navy px-5 py-3">
        <div className="flex items-center gap-2 text-white">
          <style.Icon />
          <div>
            <h3 className="font-bold text-white text-sm">{category}</h3>
            <p className="text-xs text-slate-300">
              {loading ? 'Loading…' : `${details.length} record${details.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {details.length > 0 && !loading && (
            <>
              <button
                type="button"
                onClick={onExportPdf}
                className="rounded-md border border-slate-400 bg-transparent px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-white/10 active:scale-95"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={onExportExcel}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-accent/90 active:scale-95 mr-2"
              >
                Excel
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close details"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-10">
          <LoadingSpinner label={`Loading ${category} details…`} />
        </div>
      ) : details.length === 0 ? (
        <div className="py-10 text-center text-slate-500 text-sm">
          No records found for this category.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  'Request ID',
                  'Equipment No',
                  'Customer',
                  'Site',
                  'Visit Date',
                  'Running Hours',
                  'PM Period',
                  'Symptom',
                  'Cause',
                  'Activity',
                  'Approval',
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {details.map((row, i) => (
                <tr
                  key={row.request_id}
                  className={`border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${
                    i % 2 === 1 ? 'bg-slate-50/30' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-navy">
                    #{row.request_id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-700">
                    {row.equipment_no}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                    {row.customer_name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                    {row.site_name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                    {fmt(row.visit_date)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-center text-slate-600">
                    {row.running_hours ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                    {row.pm_service_period || '-'}
                  </td>
                  <td className="max-w-[160px] px-3 py-2.5 text-slate-600 break-words">
                    {row.symptom || '-'}
                  </td>
                  <td className="max-w-[160px] px-3 py-2.5 text-slate-600 break-words">
                    {row.cause || '-'}
                  </td>
                  <td className="max-w-[160px] px-3 py-2.5 text-slate-600 break-words">
                    {row.activity || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <StatusBadge status={row.approval_status || 'Pending'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                     */
/* ══════════════════════════════════════════════════════════════ */
export default function CallCategoryReport() {
  /* summary cards */
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* date filter */
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  /* clicked category detail */
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  /* ── fetch summary ── */
  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await getCallCategoryVisits(params);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load call category data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── handle card click → fetch details ── */
  const handleCardClick = async (category) => {
    /* Always re-fetch fresh data, even if same category clicked */
    setSelectedCategory(category);
    setDetails([]);
    setDetailLoading(true);
    setDetailError('');

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await getCallCategoryDetails(category, params);
      setDetails(res.data);
    } catch (err) {
      setDetailError(err.response?.data?.error || 'Failed to load details.');
    } finally {
      setDetailLoading(false);
    }
  };

  /* ── refresh: re-fetch summary + re-fetch open detail panel ── */
  const handleRefresh = async () => {
    await fetchSummary();
    if (selectedCategory) {
      setDetails([]);
      setDetailLoading(true);
      setDetailError('');
      try {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const res = await getCallCategoryDetails(selectedCategory, params);
        setDetails(res.data);
      } catch (err) {
        setDetailError(err.response?.data?.error || 'Failed to load details.');
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setSelectedCategory(null);
    setDetails([]);
    fetchSummary();
  };

  const handleCloseDetail = () => {
    setSelectedCategory(null);
    setDetails([]);
    setDetailError('');
  };

  /* ── total across all categories ── */
  const totalVisits = data.reduce((sum, d) => sum + Number(d.visits), 0);

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy">Call Category Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Click any category card to drill down into its service records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh to get latest approval statuses"
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
          {!loading && totalVisits > 0 && (
            <div className="rounded-lg bg-navy px-5 py-2.5 text-center shadow">
              <p className="text-xs uppercase tracking-wide text-slate-300">Total Visits</p>
              <p className="text-2xl font-extrabold text-white">{totalVisits}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Date filter ── */}
      <form
        onSubmit={handleFilter}
        className="flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow-panel border border-slate-200"
      >
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
        <button
          type="submit"
          className="rounded-md bg-navy px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-navy/90 hover:shadow active:scale-95"
        >
          Apply Filter
        </button>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSelectedCategory(null);
              setDetails([]);
            }}
            className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            Clear
          </button>
        )}
      </form>

      {/* ── Error ── */}
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {/* ── Summary cards ── */}
      {loading ? (
        <LoadingSpinner label="Loading categories…" />
      ) : data.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center text-slate-500 shadow-panel">
          No visit data found{startDate || endDate ? ' for the selected date range' : ''}.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((item) => (
            <CategoryCard
              key={item.call_category}
              item={item}
              selected={selectedCategory}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* ── Detail panel (shows below cards when a category is selected) ── */}
      {selectedCategory && (
        <>
          {/* smooth scroll anchor */}
          <div id="detail-panel" />
          {detailError && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {detailError}
            </p>
          )}
          <DetailPanel
            category={selectedCategory}
            details={details}
            loading={detailLoading}
            onClose={handleCloseDetail}
          />
        </>
      )}
    </div>
  );
}
