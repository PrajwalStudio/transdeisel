import { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingSpinner from '../components/LoadingSpinner';
import { getEquipment, getEquipmentById, getEquipmentHistory } from '../services/api';
import { buildPdfHeader } from '../utils/pdfExport';

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/* ─── sub-components ────────────────────────────────────────────── */
function InfoField({ label, value, wide = false }) {
  return (
    <div className={wide ? 'col-span-2 sm:col-span-3' : ''}>
      <span className="font-bold text-slate-800">{label} </span>
      <span className="text-slate-600">{value || '-'}</span>
    </div>
  );
}

const TH = ({ children, className = '' }) => (
  <th
    className={`whitespace-nowrap border border-[#2a4a8a]/40 bg-[#1a3a6c] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white ${className}`}
  >
    {children}
  </th>
);

const TD = ({ children, red = false, className = '' }) => (
  <td
    className={`whitespace-nowrap border border-slate-200 px-3 py-2.5 text-sm align-top ${
      red ? 'font-semibold text-red-500' : 'text-slate-700'
    } ${className}`}
  >
    {children || '-'}
  </td>
);

/* ─── main page ─────────────────────────────────────────────────── */
export default function EquipmentHistory() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  /* fetch equipment list for selector */
  useEffect(() => {
    getEquipment()
      .then((res) => setEquipmentList(res.data || []))
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* filtered list for dropdown */
  const filteredList = equipmentList.filter((item) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      item.equipment_no?.toLowerCase().includes(q) ||
      item.customer_name?.toLowerCase().includes(q) ||
      item.site_name?.toLowerCase().includes(q)
    );
  });

  /* select an equipment and fetch its data */
  const handleSelect = async (item) => {
    setSearchTerm(
      item.customer_name
        ? `${item.equipment_no} (${item.customer_name})`
        : item.equipment_no
    );
    setIsDropdownOpen(false);
    setSelectedEquipment(null);
    setHistory([]);
    setLoading(true);
    setError('');

    try {
      const [equipRes, histRes] = await Promise.all([
        getEquipmentById(item.equipment_no),
        getEquipmentHistory(item.equipment_no),
      ]);
      setSelectedEquipment(equipRes.data);
      setHistory(histRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load equipment details.');
    } finally {
      setLoading(false);
    }
  };

  /* reset to selector view */
  const handleBack = () => {
    setSelectedEquipment(null);
    setHistory([]);
    setSearchTerm('');
    setError('');
  };

  /* PDF export */
  const handleDownloadPDF = async () => {
    if (!selectedEquipment) return;
    const eq = selectedEquipment;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;

    let y = await buildPdfHeader(doc, 'Equipment History Report', `Equipment: ${eq.equipment_no}`);

    /* ── Equipment Info table ── */
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Field', 'Value', 'Field', 'Value']],
      body: [
        ['Equipment No',       eq.equipment_no || '-',                    'Customer Name',  eq.customer_name || '-'],
        ['Site Name',          eq.site_name || '-',                       'Address',        eq.address || '-'],
        ['Engine Model',       eq.engine_model || '-',                    'KVA / HP',       eq.kva_hp || '-'],
        ['Engine Make',        eq.engine_make || '-',                     'Alternator Make',eq.alternator_make || '-'],
        ['Alternator S/N',     eq.alternator_sno || '-',                  'Alternator Model',eq.alternator_model || '-'],
        ['Contact Person',     eq.contact_person || '-',                  'Contact Number', eq.contact_number || '-'],
        ['Date of Commission', fmt(eq.manufacturing_date),                'Warranty Status',eq.warranty_status || '-'],
        ['Warranty Start',     fmt(eq.warranty_start_date),               'Warranty End',   fmt(eq.warranty_end_date)],
        ['In AMC',             eq.in_amc ? 'Yes' : 'No',                  'AMC Location',   eq.amc_location || '-'],
        ['AMC Start Date',     fmt(eq.amc_start_date),                    'AMC End Date',   fmt(eq.amc_end_date)],
      ],
      headStyles: { fillColor: [26, 58, 108], fontSize: 7, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2.2 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [30, 50, 100], cellWidth: 38 },
        1: { cellWidth: 60 },
        2: { fontStyle: 'bold', textColor: [30, 50, 100], cellWidth: 38 },
        3: { cellWidth: 60 },
      },
      alternateRowStyles: { fillColor: [245, 247, 252] },
    });

    y = doc.lastAutoTable.finalY + 6;

    /* ── Warranty section label ── */
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 58, 108);
    doc.text('Warranty Information', margin, y);
    doc.setTextColor(0, 0, 0);
    y += 3;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Type', 'Warranty Begin Date', 'Warranty End Date', 'Warranty Text', 'Status', 'Description']],
      body: [[
        'Date Of Sale',
        fmt(eq.warranty_start_date),
        fmt(eq.warranty_end_date),
        'Customer Warranty',
        eq.warranty_status === 'In Warranty' ? 'Active' : 'Expired',
        eq.warranty_status === 'In Warranty' ? 'Warranty valid' : 'Out of Warranty',
      ]],
      headStyles: { fillColor: [26, 58, 108], fontSize: 7, textColor: 255 },
      styles: { fontSize: 7.5, cellPadding: 2.2 },
      alternateRowStyles: { fillColor: [245, 247, 252] },
    });

    y = doc.lastAutoTable.finalY + 6;

    /* ── History section label ── */
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 58, 108);
    doc.text('Service History', margin, y);
    doc.setTextColor(0, 0, 0);
    y += 3;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[
        'Req #',
        'Invoice No',
        'Visit Date',
        'Running Hours',
        'Call Category',
        'PM Period',
        'Symptom',
        'Cause',
        'Activity',
        'Resolution Date',
      ]],
      body: history.length > 0
        ? history.map((h) => [
            `#${h.request_id}`,
            h.invoice_number || '-',
            fmt(h.visit_date),
            h.running_hours ?? '-',
            h.call_category || '-',
            h.pm_service_period || '-',
            h.symptom || '-',
            h.cause || '-',
            h.activity || '-',
            fmt(h.resolution_date),
          ])
        : [['No service history found', '', '', '', '', '', '', '', '', '']],
      headStyles: { fillColor: [26, 58, 108], fontSize: 7, textColor: 255 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
      },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      didParseCell(data) {
        // Colour the approval status cell
        if (data.section === 'body' && data.column.index === 8) {
          const val = data.cell.raw;
          if (val === 'Approved') data.cell.styles.textColor = [22, 101, 52];
          else if (val === 'Completed') data.cell.styles.textColor = [30, 64, 175];
          else data.cell.styles.textColor = [161, 98, 7];
        }
      },
    });

    /* ── Footer on every page ── */
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}  |  TransDiesel EMS  |  Equipment: ${eq.equipment_no}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }

    doc.save(`equipment_history_${eq.equipment_no}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };


  /* warranty row derived from equipment */
  const warrantyRow = selectedEquipment
    ? {
        type: 'Date Of Sale',
        remainWarranty: selectedEquipment.warranty_end_date,
        warrantyBeginDate: selectedEquipment.warranty_start_date,
        warrantyText: 'Customer Warranty',
        status: selectedEquipment.warranty_status === 'In Warranty' ? 'S' : '-',
        description:
          selectedEquipment.warranty_status === 'In Warranty'
            ? 'Warranty valid'
            : 'Out of Warranty',
      }
    : null;

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* ── page header + breadcrumb ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Equipment History</h2>
        {selectedEquipment && (
          <nav className="flex items-center gap-1 text-sm">
            <button
              type="button"
              onClick={handleBack}
              className="font-medium text-red-500 hover:underline"
            >
              Home
            </button>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500">Equipment Details</span>
          </nav>
        )}
      </div>

      {/* ── equipment selector (shown when nothing selected) ── */}
      {!selectedEquipment && !loading && (
        <div className="rounded-lg bg-white p-5 shadow-panel">
          <p className="mb-3 text-sm font-semibold text-slate-600">
            Select an equipment to view its full history
          </p>

          <div className="relative max-w-lg" ref={dropdownRef}>
            <div className="relative flex items-center">
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
              <input
                type="text"
                placeholder="Search by Equipment No, Customer Name or Site..."
                value={searchTerm}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full rounded-md border border-slate-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy/30"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setIsDropdownOpen(true);
                  }}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
                {listLoading ? (
                  <p className="p-3 text-center text-sm text-slate-500">Loading…</p>
                ) : filteredList.length === 0 ? (
                  <p className="p-3 text-center text-sm text-slate-500">No equipment found.</p>
                ) : (
                  filteredList.map((item) => (
                    <div
                      key={item.equipment_no}
                      onClick={() => handleSelect(item)}
                      className="flex cursor-pointer items-center justify-between border-b border-slate-100 p-3 transition hover:bg-slate-50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy text-sm">
                            {item.equipment_no}
                          </span>
                          {item.kva_hp && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                              {item.kva_hp}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.customer_name ? `Customer: ${item.customer_name}` : 'No Customer'}
                          {item.site_name ? ` | Site: ${item.site_name}` : ''}
                        </p>
                      </div>
                      <span
                        className={`ml-3 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          item.warranty_status === 'In Warranty'
                            ? 'border-green-300 bg-green-50 text-green-700'
                            : 'border-red-300 bg-red-50 text-red-700'
                        }`}
                      >
                        {item.warranty_status || 'Out of Warranty'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── loading spinner ── */}
      {loading && <LoadingSpinner label="Loading equipment history…" />}

      {/* ── error ── */}
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>
      )}

      {/* ══════════════ DETAIL VIEW ══════════════ */}
      {selectedEquipment && !loading && (
        <div className="space-y-4">

          {/* ── Equipment Info Panel (4 sections) ── */}
          <div className="space-y-3">

            {/* Engine Details + Alternator Details */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

              {/* Engine Details */}
              <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-[#1a3a6c] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
                  Engine Details
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 text-sm">
                  {[
                    ['Equipment No', selectedEquipment.equipment_no],
                    ['Date of Commissioning', fmt(selectedEquipment.manufacturing_date)],
                    ['Engine DG No', selectedEquipment.engine_dgno],
                    ['Engine Make', selectedEquipment.engine_make],
                    ['Engine Model', selectedEquipment.engine_model],
                    ['KVA / HP', selectedEquipment.kva_hp],
                  ].filter(([, val]) => val && val !== '-').map(([label, val]) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="font-medium text-slate-800">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternator Details */}
              <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-[#1a3a6c] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
                  Alternator Details
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 text-sm">
                  {[
                    ['Alternator Make', selectedEquipment.alternator_make],
                    ['Alternator S/N', selectedEquipment.alternator_sno],
                    ['Alternator Model', selectedEquipment.alternator_model],
                  ].filter(([, val]) => val && val !== '-').map(([label, val]) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="font-medium text-slate-800">{val}</p>
                    </div>
                  ))}
                  {!selectedEquipment.alternator_make && !selectedEquipment.alternator_sno && !selectedEquipment.alternator_model && (
                    <p className="col-span-2 text-slate-400 text-xs py-1">No alternator details available.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer & Site Details + Warranty & AMC Details */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

              {/* Customer & Site Details */}
              <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-[#1a3a6c] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
                  Customer &amp; Site Details
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 text-sm">
                  {[
                    ['Customer Name', selectedEquipment.customer_name, false],
                    ['Site Name', selectedEquipment.site_name, false],
                    ['Contact Person', selectedEquipment.contact_person, false],
                    ['Contact Number', selectedEquipment.contact_number, false],
                    ['Email', selectedEquipment.email, true],
                    ['Address', selectedEquipment.address, true],
                  ].filter(([, val]) => val && val !== '-').map(([label, val, wide]) => (
                    <div key={label} className={wide ? 'col-span-2' : ''}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="font-medium text-slate-800 break-all">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warranty & AMC Details */}
              <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-[#1a3a6c] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
                  Warranty &amp; AMC Details
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 text-sm">
                  {[
                    ['Warranty Status', selectedEquipment.warranty_status, false,
                      selectedEquipment.warranty_status === 'In Warranty' ? 'text-emerald-700' : 'text-red-600'],
                    ['Warranty Start', fmt(selectedEquipment.warranty_start_date), false, 'text-slate-800'],
                    ['Warranty End', fmt(selectedEquipment.warranty_end_date), false, 'text-slate-800'],
                    ['In AMC', selectedEquipment.in_amc != null ? (selectedEquipment.in_amc ? 'Yes' : 'No') : null, false,
                      selectedEquipment.in_amc ? 'text-emerald-700' : 'text-slate-500'],
                    ['AMC Location', selectedEquipment.in_amc ? selectedEquipment.amc_location : null, false, 'text-slate-800'],
                    ['AMC Start Date', selectedEquipment.in_amc ? fmt(selectedEquipment.amc_start_date) : null, false, 'text-slate-800'],
                    ['AMC End Date', selectedEquipment.in_amc ? fmt(selectedEquipment.amc_end_date) : null, false, 'text-slate-800'],
                    ['AMC Amount', selectedEquipment.in_amc && selectedEquipment.amc_amount != null
                      ? `\u20b9${Number(selectedEquipment.amc_amount).toLocaleString('en-IN')}`
                      : null, false, 'text-slate-800'],
                  ].filter(([, val]) => val && val !== '-').map(([label, val, wide, colorClass]) => (
                    <div key={label} className={wide ? 'col-span-2' : ''}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className={`font-medium ${colorClass}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Warranty Table ── */}
          <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <TH>Type</TH>
                    <TH>Remain Warranty</TH>
                    <TH>Warranty Begin Date</TH>
                    <TH>Warranty Text</TH>
                    <TH>Status</TH>
                    <TH>Description</TH>
                  </tr>
                </thead>
                <tbody>
                  {warrantyRow ? (
                    <tr>
                      <TD>{warrantyRow.type}</TD>
                      <TD>{fmt(warrantyRow.remainWarranty)}</TD>
                      <TD>{fmt(warrantyRow.warrantyBeginDate)}</TD>
                      <TD>{warrantyRow.warrantyText}</TD>
                      <TD>{warrantyRow.status}</TD>
                      <TD>{warrantyRow.description}</TD>
                    </tr>
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="border border-slate-200 px-4 py-4 text-center text-slate-500 text-sm"
                      >
                        No warranty information available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Equipment History Table ── */}
          <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
            {/* Dark full-width title row */}
            <div className="bg-[#1a3a6c] py-3 text-center text-sm font-semibold tracking-widest text-white uppercase">
              Equipment History
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <TH>Request No</TH>
                    <TH>Invoice No</TH>
                    <TH>Dealer</TH>
                    <TH>Failure Date</TH>
                    <TH>Failure Hours</TH>
                    <TH>Resolution Date</TH>
                    <TH>Defect Type</TH>
                    <TH>Symptom</TH>
                    <TH>Cause</TH>
                    <TH>Activity</TH>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="border border-slate-200 px-4 py-8 text-center text-slate-500"
                      >
                        No service history found for this equipment.
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr
                        key={h.request_id}
                        className="transition-colors even:bg-slate-50/50 hover:bg-blue-50/30"
                      >
                        <TD red>{h.request_id}</TD>
                        <TD>{h.invoice_number || '-'}</TD>
                        <TD>{selectedEquipment.site_name}</TD>
                        <TD>{fmt(h.visit_date)}</TD>
                        <TD>{h.running_hours ?? 0}</TD>
                        <TD>{fmt(h.resolution_date)}</TD>
                        <TD>{h.call_category}</TD>
                        <TD className="max-w-[160px] whitespace-normal">{h.symptom}</TD>
                        <TD className="max-w-[160px] whitespace-normal">{h.cause}</TD>
                        <TD className="max-w-[160px] whitespace-normal">{h.activity}</TD>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex items-center justify-center gap-4 pb-2 pt-1">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 rounded bg-red-600 px-7 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700 active:scale-95 transition-all"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 rounded bg-red-600 px-7 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700 active:scale-95 transition-all"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download to PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
