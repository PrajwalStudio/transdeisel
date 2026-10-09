export default function DataTable({ columns, data, emptyText = 'No records found.' }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-[720px] text-left text-xs sm:min-w-full sm:text-sm">
          <thead className="bg-navy text-white text-[11px] uppercase tracking-wider">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-3 py-3 font-semibold sm:px-4">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.invoice_id || row.id || row.request_id || row.order_id || `${index}-${row.equipment_no}`}
                  className="border-t odd:bg-slate-50/40 hover:bg-blue-50/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-3 align-top text-slate-700 sm:px-4">
                      {col.render ? col.render(row) : row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
