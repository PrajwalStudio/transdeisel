import { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import LoadingSpinner from '../components/LoadingSpinner';
import { getEquipment } from '../services/api';
import { buildPdfHeader, PDF_TABLE_STYLES } from '../utils/pdfExport';

const ALL_COLUMNS = [
  { key: 'equipment_no', label: 'Equipment No' },
  {
    key: 'customer_details',
    label: 'Customer Details',
    render: (row) => (
      <div className="space-y-1.5 text-sm min-w-[160px]">
        <div><span className="text-xs text-slate-500">Customer</span><p className="font-semibold text-slate-800">{row.customer_name || '—'}</p></div>
        <div><span className="text-xs text-slate-500">Site</span><p className="font-semibold text-slate-800">{row.site_name || '—'}</p></div>
        <div><span className="text-xs text-slate-500">Address</span><p className="font-semibold text-slate-800">{row.address || '—'}</p></div>
      </div>
    ),
    exportValue: (row) => `${row.customer_name || ''} | ${row.site_name || ''} | ${row.address || ''}`,
  },
  {
    key: 'engine_details',
    label: 'Engine Details',
    render: (row) => (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm min-w-[220px]">
        <div><span className="text-xs text-slate-500">DG No</span><p className="font-semibold text-slate-800">{row.engine_dgno || '—'}</p></div>
        <div><span className="text-xs text-slate-500">Engine Make</span><p className="font-semibold text-slate-800">{row.engine_make || '—'}</p></div>
        <div><span className="text-xs text-slate-500">Engine Model</span><p className="font-semibold text-slate-800">{row.engine_model || '—'}</p></div>
        <div><span className="text-xs text-slate-500">KVA/HP</span><p className="font-semibold text-slate-800">{row.kva_hp || '—'}</p></div>
      </div>
    ),
    exportValue: (row) => `DG: ${row.engine_dgno || ''} | Make: ${row.engine_make || ''} | Model: ${row.engine_model || ''} | ${row.kva_hp || ''}`,
  },
  {
    key: 'alternator_details',
    label: 'Alternator Details',
    render: (row) => (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm min-w-[200px]">
        <div><span className="text-xs text-slate-500">S/N</span><p className="font-semibold text-slate-800">{row.alternator_sno || '—'}</p></div>
        <div><span className="text-xs text-slate-500">Make</span><p className="font-semibold text-slate-800">{row.alternator_make || '—'}</p></div>
        <div className="col-span-2"><span className="text-xs text-slate-500">Model</span><p className="font-semibold text-slate-800">{row.alternator_model || '—'}</p></div>
      </div>
    ),
    exportValue: (row) => `S/N: ${row.alternator_sno || ''} | Make: ${row.alternator_make || ''} | Model: ${row.alternator_model || ''}`,
  },
  {
    key: 'contact_details',
    label: 'Contact Details',
    render: (row) => (
      <div className="space-y-1.5 text-sm min-w-[160px]">
        <div><span className="text-xs text-slate-500">Contact Person</span><p className="font-semibold text-slate-800">{row.contact_person || '—'}</p></div>
        <div><span className="text-xs text-slate-500">Phone</span><p className="font-semibold text-slate-800">{row.contact_number || '—'}</p></div>
        <div><span className="text-xs text-slate-500">Email</span><p className="font-semibold text-slate-800 max-w-[180px] truncate" title={row.email}>{row.email || '—'}</p></div>
      </div>
    ),
    exportValue: (row) => `${row.contact_person || ''} | ${row.contact_number || ''} | ${row.email || ''}`,
  },
  { key: 'in_amc',             label: 'IN_AMC' },
  { key: 'amc_location',       label: 'AMC Location' },
  { key: 'amc_start_date',     label: 'AMC Start Date' },
  { key: 'amc_end_date',       label: 'AMC End Date' },
  { key: 'amc_amount',         label: 'AMC Amount (₹)' },
  { key: 'manufacturing_date', label: 'Manufacturing Date' },
  { key: 'warranty_status',    label: 'Warranty Status' },
  { key: 'warranty_start_date',label: 'Warranty Start Date' },
  { key: 'warranty_end_date',  label: 'Warranty End Date' },
];

const DATE_COLUMNS = new Set(['manufacturing_date', 'warranty_start_date', 'warranty_end_date', 'amc_start_date', 'amc_end_date']);

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '—');
const emptyValue = '—';

const formatCellText = (value, key) => {
  if (key === 'in_amc') {
    return value ? 'In AMC' : 'Out of AMC';
  }

  if (key === 'amc_amount' && value !== null && value !== undefined && value !== '') {
    return `₹${Number(value).toLocaleString('en-IN')}`;
  }

  if (value === null || value === undefined || value === '') {
    return emptyValue;
  }

  if (DATE_COLUMNS.has(key)) {
    return formatDate(value);
  }

  return String(value);
};

const formatFileDate = (date) => date.toISOString().slice(0, 10);

function WarrantyBadge({ status }) {
  const normalized = status || 'Out of Warranty';
  const classes =
    normalized === 'In Warranty'
      ? 'bg-green-100 text-green-800 border border-green-300'
      : 'bg-red-100 text-red-800 border border-red-300';

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>{normalized}</span>;
}

function AmcBadge({ isAmc }) {
  const classes = isAmc
    ? 'bg-green-100 text-green-800 border border-green-300'
    : 'bg-slate-100 text-slate-700 border border-slate-300';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>{isAmc ? 'In AMC' : 'Out of AMC'}</span>;
}

export default function EquipmentList() {
  const [equipment, setEquipment] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => ALL_COLUMNS.map((column) => column.key));
  const columnMenuRef = useRef(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getEquipment();
        setEquipment(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch equipment.');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!columnMenuRef.current) {
        return;
      }

      if (!columnMenuRef.current.contains(event.target)) {
        setIsColumnMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const visibleColumnDefs = useMemo(
    () => ALL_COLUMNS.filter((column) => visibleColumns.includes(column.key)),
    [visibleColumns]
  );

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    if (!lower) {
      return equipment;
    }

    return equipment.filter((row) =>
      visibleColumnDefs.some((column) => {
        const text = column.exportValue
          ? column.exportValue(row)
          : formatCellText(row[column.key], column.key);
        return text.toLowerCase().includes(lower);
      })
    );
  }, [equipment, search, visibleColumnDefs]);

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey) ? prev.filter((key) => key !== columnKey) : [...prev, columnKey]
    );
  };

  const onSelectAllColumns = () => setVisibleColumns(ALL_COLUMNS.map((column) => column.key));
  const onClearAllColumns = () => setVisibleColumns([]);

  // Maps each grouped column key to its individual export fields
  const GROUPED_EXPORT_FIELDS = {
    customer_details: [
      { label: 'Customer Name', value: (row) => row.customer_name || '—' },
      { label: 'Site Name',     value: (row) => row.site_name || '—' },
      { label: 'Address',       value: (row) => row.address || '—' },
    ],
    engine_details: [
      { label: 'DG No',         value: (row) => row.engine_dgno || '—' },
      { label: 'Engine Make',   value: (row) => row.engine_make || '—' },
      { label: 'Engine Model',  value: (row) => row.engine_model || '—' },
      { label: 'KVA/HP',        value: (row) => row.kva_hp || '—' },
    ],
    alternator_details: [
      { label: 'Alternator S/N',    value: (row) => row.alternator_sno || '—' },
      { label: 'Alternator Make',   value: (row) => row.alternator_make || '—' },
      { label: 'Alternator Model',  value: (row) => row.alternator_model || '—' },
    ],
    contact_details: [
      { label: 'Contact Person', value: (row) => row.contact_person || '—' },
      { label: 'Phone',          value: (row) => row.contact_number || '—' },
      { label: 'Email',          value: (row) => row.email || '—' },
    ],
  };

  // Build flat export headers and row builder, expanding grouped columns
  const exportColumnDefs = useMemo(() => {
    const cols = [];
    for (const column of visibleColumnDefs) {
      if (GROUPED_EXPORT_FIELDS[column.key]) {
        GROUPED_EXPORT_FIELDS[column.key].forEach((f) => cols.push({ label: f.label, getValue: f.value }));
      } else {
        cols.push({ label: column.label, getValue: (row) => formatCellText(row[column.key], column.key) });
      }
    }
    return cols;
  }, [visibleColumnDefs]);

  const exportRows = useMemo(
    () =>
      filtered.map((row) =>
        Object.fromEntries(exportColumnDefs.map((col) => [col.label, col.getValue(row)]))
      ),
    [filtered, exportColumnDefs]
  );

  const onExportPdf = async () => {
    if (exportColumnDefs.length === 0) {
      return;
    }

    const now = new Date();
    const doc = new jsPDF({ orientation: 'landscape' });

    const startY = await buildPdfHeader(doc, 'Equipment List');

    autoTable(doc, {
      startY,
      head: [exportColumnDefs.map((col) => col.label)],
      body: exportRows.map(Object.values),
      ...PDF_TABLE_STYLES,
      styles: {
        ...PDF_TABLE_STYLES.styles,
        fontSize: exportColumnDefs.length > 12 ? 5 : 7,
        cellPadding: exportColumnDefs.length > 12 ? 1 : 2.2,
      },
      headStyles: {
        ...PDF_TABLE_STYLES.headStyles,
        fontSize: exportColumnDefs.length > 12 ? 5 : 7,
      },
    });

    doc.save(`equipment_list_${formatFileDate(now)}.pdf`);
  };

  const onExportExcel = () => {
    if (visibleColumnDefs.length === 0) {
      return;
    }

    const now = new Date();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment List');
    XLSX.writeFile(workbook, `equipment_list_${formatFileDate(now)}.xlsx`);
  };

  if (loading) {
    return <LoadingSpinner label="Loading equipment..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-panel">
        <input
          className="w-full max-w-sm rounded-md border border-slate-300/80 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-navy focus:ring-2 focus:ring-navy/10"
          placeholder="Search visible columns"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="flex items-center gap-2" ref={columnMenuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColumnMenuOpen((prev) => !prev)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              Columns
            </button>

            {isColumnMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-md border border-slate-200 bg-white p-3 shadow-lg">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <button type="button" onClick={onSelectAllColumns} className="hover:text-navy">
                    Select All
                  </button>
                  <button type="button" onClick={onClearAllColumns} className="hover:text-navy">
                    Clear All
                  </button>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto border-t border-slate-100 pt-2">
                  {ALL_COLUMNS.map((column) => (
                    <label key={column.key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(column.key)}
                        onChange={() => toggleColumn(column.key)}
                        className="h-4 w-4"
                      />
                      <span>{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onExportPdf}
            disabled={visibleColumnDefs.length === 0}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            disabled={visibleColumnDefs.length === 0}
            className="rounded-md bg-accent px-4 py-2 font-bold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
          >
            Export Excel
          </button>
        </div>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
        <div className="overflow-x-auto">
          <table className="min-w-max text-left text-xs sm:text-sm">
            <thead className="bg-navy text-white text-[11px] uppercase tracking-wider">
              <tr>
                {visibleColumnDefs.map((column, index) => (
                  <th
                    key={column.key}
                    className={`whitespace-nowrap px-3 py-3 font-semibold sm:px-4 ${index === 0 && column.key === 'equipment_no' ? 'sticky left-0 z-10 bg-navy' : ''
                      }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleColumnDefs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500">Select at least one column to display data.</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={visibleColumnDefs.length}>
                    No records found.
                  </td>
                </tr>
              ) : (
                filtered.map((row, rowIndex) => (
                  <tr
                    key={`${row.equipment_no || 'equipment'}-${rowIndex}`}
                    className="border-t odd:bg-slate-50/40 hover:bg-blue-50/30 transition-colors"
                  >
                    {visibleColumnDefs.map((column, index) => {
                      const isStickyEquipment = index === 0 && column.key === 'equipment_no';
                      const isGrouped = !!column.render;
                      return (
                        <td
                          key={column.key}
                          className={`px-3 py-3 align-top text-slate-700 sm:px-4 ${isGrouped ? '' : 'whitespace-nowrap'} ${isStickyEquipment ? 'sticky left-0 z-[1] bg-inherit odd:bg-slate-50/40 font-semibold' : ''}`}
                        >
                          {column.render ? (
                            column.render(row)
                          ) : column.key === 'warranty_status' ? (
                            <WarrantyBadge status={row.warranty_status} />
                          ) : column.key === 'in_amc' ? (
                            <AmcBadge isAmc={row.in_amc} />
                          ) : (
                            formatCellText(row[column.key], column.key)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
