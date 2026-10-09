import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import LoadingSpinner from '../components/LoadingSpinner';
import { getEquipment, getMonthlyAmcVisits } from '../services/api';
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

const formatAmount = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

const formatFileDate = (d) => d.toISOString().slice(0, 10);

const getAmcStatusInfo = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return { key: 'no_dates', label: 'No Dates', cls: 'bg-slate-100 text-slate-600 border-slate-300' };
  }
  const now = new Date();
  const end = new Date(endDate);
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.ceil((endZero - nowZero) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { key: 'expired', label: `Expired (${Math.abs(diffDays)}d ago)`, diffDays, cls: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold' };
  }
  if (diffDays <= 30) {
    return { key: 'expiring', label: `Expiring Soon (${diffDays}d left)`, diffDays, cls: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold' };
  }
  return { key: 'active', label: `Active (${diffDays}d left)`, diffDays, cls: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold' };
};

function LocationBadge({ location }) {
  if (!location) return <span className="text-slate-400 text-xs">—</span>;
  const cls =
    location === 'Udupi'
      ? 'bg-violet-100 text-violet-800 border border-violet-300'
      : 'bg-amber-100 text-amber-800 border border-amber-300';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {location}
    </span>
  );
}

function AmcStatusBadge({ startDate, endDate }) {
  const info = getAmcStatusInfo(startDate, endDate);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] border ${info.cls}`}>
      {info.label}
    </span>
  );
}

function VisitStatusBadge({ isCompleted, visitDate }) {
  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <svg className="w-3 h-3 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
        Visit Done {visitDate ? `(${formatDate(visitDate)})` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
      <svg className="w-3 h-3 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      Visit Pending
    </span>
  );
}

export default function AmcList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allEquipment, setAllEquipment] = useState([]);
  const [monthlyVisits, setMonthlyVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');

  // Sync status filter from URL query param (e.g. ?status=expired)
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
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const [eqRes, visitsRes] = await Promise.all([
          getEquipment(),
          getMonthlyAmcVisits(currentMonth, currentYear),
        ]);

        setAllEquipment(eqRes.data || []);
        setMonthlyVisits(visitsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch AMC customer data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Map monthly visits by equipment_no
  const visitsMap = useMemo(() => {
    const map = {};
    monthlyVisits.forEach((v) => {
      map[v.equipment_no] = v;
    });
    return map;
  }, [monthlyVisits]);

  // Combine equipment data with AMC status info and visit info
  const amcEquipment = useMemo(() => {
    return allEquipment
      .filter((eq) => eq.in_amc === true)
      .map((eq) => {
        const amcStatusInfo = getAmcStatusInfo(eq.amc_start_date, eq.amc_end_date);
        const visit = visitsMap[eq.equipment_no];
        const isVisitCompleted = Boolean(visit && visit.visit_id);

        return {
          ...eq,
          amcStatusKey: amcStatusInfo.key,
          amcStatusLabel: amcStatusInfo.label,
          amcDiffDays: amcStatusInfo.diffDays,
          isVisitCompleted,
          visitDate: visit?.visit_date || null,
          visitComments: visit?.visit_comments || null,
        };
      });
  }, [allEquipment, visitsMap]);

  // Summary counts
  const counts = useMemo(() => {
    const total = amcEquipment.length;
    const active = amcEquipment.filter((eq) => eq.amcStatusKey === 'active').length;
    const expiring = amcEquipment.filter((eq) => eq.amcStatusKey === 'expiring').length;
    const expired = amcEquipment.filter((eq) => eq.amcStatusKey === 'expired').length;
    const pendingVisits = amcEquipment.filter((eq) => !eq.isVisitCompleted).length;
    const completedVisits = amcEquipment.filter((eq) => eq.isVisitCompleted).length;

    const udupi = amcEquipment.filter((eq) => eq.amc_location === 'Udupi').length;
    const mangalore = amcEquipment.filter((eq) => eq.amc_location === 'Mangalore').length;

    return { total, active, expiring, expired, pendingVisits, completedVisits, udupi, mangalore };
  }, [amcEquipment]);

  // Filtered equipment list based on statusFilter, locationFilter, and search query
  const filtered = useMemo(() => {
    let list = amcEquipment;

    // Filter by Status
    if (statusFilter === 'active') {
      list = list.filter((eq) => eq.amcStatusKey === 'active');
    } else if (statusFilter === 'expiring') {
      list = list.filter((eq) => eq.amcStatusKey === 'expiring');
    } else if (statusFilter === 'expired') {
      list = list.filter((eq) => eq.amcStatusKey === 'expired');
    } else if (statusFilter === 'pending_visit') {
      list = list.filter((eq) => !eq.isVisitCompleted);
    } else if (statusFilter === 'completed_visit') {
      list = list.filter((eq) => eq.isVisitCompleted);
    }

    // Filter by Location
    if (locationFilter !== 'All') {
      list = list.filter((eq) => eq.amc_location === locationFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (eq) =>
          eq.equipment_no?.toLowerCase().includes(q) ||
          eq.customer_name?.toLowerCase().includes(q) ||
          eq.site_name?.toLowerCase().includes(q) ||
          eq.engine_make?.toLowerCase().includes(q) ||
          eq.engine_model?.toLowerCase().includes(q) ||
          eq.amc_location?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [amcEquipment, statusFilter, locationFilter, search]);

  const exportRows = useMemo(
    () =>
      filtered.map((eq) => ({
        'Equipment No': eq.equipment_no || '—',
        'AMC Status': eq.amcStatusKey?.toUpperCase() || '—',
        'AMC Location': eq.amc_location || '—',
        'AMC Start Date': formatDate(eq.amc_start_date),
        'AMC End Date': formatDate(eq.amc_end_date),
        'AMC Amount': eq.amc_amount !== null && eq.amc_amount !== undefined ? `Rs. ${eq.amc_amount}` : '—',
        'PO Number': eq.po_number || '—',
        'PO Date': formatDate(eq.po_date),
        'Monthly Visit': eq.isVisitCompleted ? `Completed (${formatDate(eq.visitDate)})` : 'Pending',
        'Customer Name': eq.customer_name || '—',
        'Site Name': eq.site_name || '—',
        'Engine Make': eq.engine_make || '—',
        'Engine Model': eq.engine_model || '—',
        'KVA/HP': eq.kva_hp || '—',
        'Contact Person': eq.contact_person || '—',
        'Contact Number': eq.contact_number || '—',
        'Email': eq.email || '—',
      })),
    [filtered]
  );

  const onExportPdf = async () => {
    if (filtered.length === 0) return;
    const now = new Date();
    const doc = new jsPDF({ orientation: 'landscape' });

    const filterText = `Filter Status: ${statusFilter.toUpperCase()} | Location: ${locationFilter} | Total Records: ${filtered.length}`;
    const startY = await buildPdfHeader(doc, 'AMC Customer List Report', filterText);

    const pdfHeaders = [
      'Equipment & Location',
      'Customer & Site',
      'Engine Details',
      'AMC Validity',
      'Amount',
      'PO Details',
      'AMC Contract Status',
      'Monthly Visit Status',
    ];

    const pdfBody = filtered.map((eq) => [
      `${eq.equipment_no || '—'}\nLocation: ${eq.amc_location || 'N/A'}`,
      `${eq.customer_name || '—'}\nSite: ${eq.site_name || '—'}`,
      `Make: ${eq.engine_make || '—'}\nModel: ${eq.engine_model || '—'}\nKVA/HP: ${eq.kva_hp || '—'}`,
      `${formatDate(eq.amc_start_date)} to\n${formatDate(eq.amc_end_date)}`,
      formatAmount(eq.amc_amount),
      eq.po_number ? `PO# ${eq.po_number}\nDate: ${formatDate(eq.po_date)}` : '—',
      eq.amcStatusLabel || '—',
      eq.isVisitCompleted
        ? `Done (${formatDate(eq.visitDate)})`
        : 'Pending Visit',
    ]);

    autoTable(doc, {
      startY,
      head: [pdfHeaders],
      body: pdfBody,
      ...PDF_TABLE_STYLES,
      columnStyles: {
        0: { cellWidth: 33 },
        1: { cellWidth: 42 },
        2: { cellWidth: 38 },
        3: { cellWidth: 32 },
        4: { cellWidth: 22 },
        5: { cellWidth: 30 },
        6: { cellWidth: 34 },
        7: { cellWidth: 27 },
      },
    });

    addPdfFooter(doc);

    doc.save(`amc_customer_list_${statusFilter}_${locationFilter.toLowerCase()}_${formatFileDate(now)}.pdf`);
  };


  const onExportExcel = () => {
    const now = new Date();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AMC Customers');
    XLSX.writeFile(wb, `amc_customer_list_${statusFilter}_${locationFilter.toLowerCase()}_${formatFileDate(now)}.xlsx`);
  };

  if (loading) {
    return <LoadingSpinner label="Loading AMC customer list..." />;
  }

  const statusTabButtons = [
    { key: 'all', label: 'All Contracts', count: counts.total, color: 'bg-navy text-white' },
    { key: 'active', label: 'Active AMC', count: counts.active, color: 'bg-emerald-600 text-white' },
    { key: 'expiring', label: 'Expiring Soon', count: counts.expiring, color: 'bg-amber-600 text-white' },
    { key: 'expired', label: 'Expired AMC', count: counts.expired, color: 'bg-rose-600 text-white' },
    { key: 'pending_visit', label: 'Pending Visits', count: counts.pendingVisits, color: 'bg-purple-600 text-white' },
    { key: 'completed_visit', label: 'Completed Visits', count: counts.completedVisits, color: 'bg-teal-600 text-white' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Interactive Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total AMC */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer rounded-xl border p-4 shadow-panel transition-all hover:scale-[1.02] ${
            statusFilter === 'all'
              ? 'border-navy bg-navy text-white shadow-md'
              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-slate-200' : 'text-slate-500'}`}>
            Total AMC
          </p>
          <p className="mt-1 text-2xl font-extrabold">{counts.total}</p>
        </div>

        {/* Active AMC */}
        <div
          onClick={() => setStatusFilter('active')}
          className={`cursor-pointer rounded-xl border p-4 shadow-panel transition-all hover:scale-[1.02] ${
            statusFilter === 'active'
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
              : 'border-emerald-200 bg-emerald-50/60 text-emerald-900 hover:border-emerald-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'active' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Active AMC
          </p>
          <p className="mt-1 text-2xl font-extrabold">{counts.active}</p>
        </div>

        {/* Expiring Soon */}
        <div
          onClick={() => setStatusFilter('expiring')}
          className={`cursor-pointer rounded-xl border p-4 shadow-panel transition-all hover:scale-[1.02] ${
            statusFilter === 'expiring'
              ? 'border-amber-600 bg-amber-600 text-white shadow-md'
              : 'border-amber-200 bg-amber-50/60 text-amber-900 hover:border-amber-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'expiring' ? 'text-amber-100' : 'text-amber-700'}`}>
            Expiring Soon
          </p>
          <p className="mt-1 text-2xl font-extrabold">{counts.expiring}</p>
        </div>

        {/* Expired AMC */}
        <div
          onClick={() => setStatusFilter('expired')}
          className={`cursor-pointer rounded-xl border p-4 shadow-panel transition-all hover:scale-[1.02] ${
            statusFilter === 'expired'
              ? 'border-rose-600 bg-rose-600 text-white shadow-md'
              : 'border-rose-200 bg-rose-50/60 text-rose-900 hover:border-rose-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'expired' ? 'text-rose-100' : 'text-rose-700'}`}>
            Expired AMC
          </p>
          <p className="mt-1 text-2xl font-extrabold">{counts.expired}</p>
        </div>

        {/* Pending Visits */}
        <div
          onClick={() => setStatusFilter('pending_visit')}
          className={`cursor-pointer rounded-xl border p-4 shadow-panel transition-all hover:scale-[1.02] ${
            statusFilter === 'pending_visit'
              ? 'border-purple-600 bg-purple-600 text-white shadow-md'
              : 'border-purple-200 bg-purple-50/60 text-purple-900 hover:border-purple-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'pending_visit' ? 'text-purple-100' : 'text-purple-700'}`}>
            Pending Visits
          </p>
          <p className="mt-1 text-2xl font-extrabold">{counts.pendingVisits}</p>
        </div>

        {/* Completed Visits */}
        <div
          onClick={() => setStatusFilter('completed_visit')}
          className={`cursor-pointer rounded-xl border p-4 shadow-panel transition-all hover:scale-[1.02] ${
            statusFilter === 'completed_visit'
              ? 'border-teal-600 bg-teal-600 text-white shadow-md'
              : 'border-teal-200 bg-teal-50/60 text-teal-900 hover:border-teal-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'completed_visit' ? 'text-teal-100' : 'text-teal-700'}`}>
            Visits Done
          </p>
          <p className="mt-1 text-2xl font-extrabold">{counts.completedVisits}</p>
        </div>
      </div>

      {/* Control Bar & Filters */}
      <div className="flex flex-col space-y-3 rounded-xl bg-white p-4 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* AMC Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {statusTabButtons.map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? tab.color + ' shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportPdf}
              disabled={filtered.length === 0}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={onExportExcel}
              disabled={filtered.length === 0}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Location Filters & Search Input */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location:</span>
            {['All', 'Udupi', 'Mangalore'].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocationFilter(loc)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  locationFilter === loc
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {loc} {loc === 'Udupi' ? `(${counts.udupi})` : loc === 'Mangalore' ? `(${counts.mangalore})` : ''}
              </button>
            ))}
          </div>

          <input
            className="w-full sm:w-72 rounded-md border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-navy"
            placeholder="Search equipment, customer, site, make..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

      {/* Equipment List Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center text-slate-500 shadow-panel space-y-2">
          <p className="text-base font-semibold text-slate-700">No AMC customer records found</p>
          <p className="text-xs text-slate-400">
            {amcEquipment.length === 0
              ? 'No equipment is currently marked under AMC.'
              : `No matching records found for status filter "${statusFilter}" and location "${locationFilter}".`}
          </p>
          {(statusFilter !== 'all' || locationFilter !== 'All' || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setLocationFilter('All');
                setSearch('');
              }}
              className="mt-3 rounded-md bg-navy px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy/90"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((eq) => (
            <div
              key={eq.equipment_no}
              className="rounded-xl border border-slate-200 bg-white shadow-panel overflow-hidden transition hover:shadow-md"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-slate-50 to-slate-100/60 px-5 py-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-extrabold text-navy">{eq.equipment_no}</span>
                  <LocationBadge location={eq.amc_location} />
                  <AmcStatusBadge startDate={eq.amc_start_date} endDate={eq.amc_end_date} />
                  <VisitStatusBadge isCompleted={eq.isVisitCompleted} visitDate={eq.visitDate} />
                </div>
                {eq.amc_amount !== null && eq.amc_amount !== undefined && (
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                    {formatAmount(eq.amc_amount)}
                  </span>
                )}
              </div>

              {/* Card Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* AMC Contract & Visit Info */}
                <div className="p-4 space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AMC & Monthly Visit Details</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">AMC Start</span>
                      <p className="font-semibold text-slate-800">{formatDate(eq.amc_start_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">AMC End</span>
                      <p className="font-semibold text-slate-800">{formatDate(eq.amc_end_date)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Location</span>
                      <p className="font-semibold text-slate-800">{eq.amc_location || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Contract Amount</span>
                      <p className="font-semibold text-slate-800">{formatAmount(eq.amc_amount)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">PO Number</span>
                      <p className="font-semibold text-slate-800">{eq.po_number || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">PO Date</span>
                      <p className="font-semibold text-slate-800">{eq.po_date ? formatDate(eq.po_date) : '—'}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-xs space-y-1">
                    <p className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Current Month Visit</span>
                      {eq.isVisitCompleted ? (
                        <span className="text-emerald-700 font-bold">Done</span>
                      ) : (
                        <span className="text-amber-700 font-bold">Pending</span>
                      )}
                    </p>
                    {eq.isVisitCompleted ? (
                      <p className="text-slate-600">
                        Date: <span className="font-semibold">{formatDate(eq.visitDate)}</span>
                        {eq.visitComments ? ` · ${eq.visitComments}` : ''}
                      </p>
                    ) : (
                      <p className="text-slate-500 italic">No visit logged for this month yet.</p>
                    )}
                  </div>
                </div>

                {/* Engine Details */}
                <div className="p-4 space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Engine Details</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">DG No</span>
                      <p className="font-semibold text-slate-800">{eq.engine_dgno || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Engine Make</span>
                      <p className="font-semibold text-slate-800">{eq.engine_make || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Engine Model</span>
                      <p className="font-semibold text-slate-800">{eq.engine_model || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">KVA/HP</span>
                      <p className="font-semibold text-slate-800">{eq.kva_hp || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Customer & Site Details */}
                <div className="p-4 space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Customer & Site</h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500">Customer</span>
                      <p className="font-semibold text-slate-800">{eq.customer_name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Site</span>
                      <p className="font-semibold text-slate-800">{eq.site_name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Address</span>
                      <p className="font-semibold text-slate-800 truncate">{eq.address || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Contact</span>
                      <p className="font-semibold text-slate-800">
                        {eq.contact_person || '—'}
                        {eq.contact_number ? ` · ${eq.contact_number}` : ''}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Email</span>
                      <p className="font-semibold text-slate-800">{eq.email || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

