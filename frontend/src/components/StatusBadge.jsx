const colors = {
  Approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Completed: 'bg-blue-100 text-blue-800 border border-blue-200',
  Pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  Overdue: 'bg-red-100 text-red-800 border border-red-200',
  'Due Soon': 'bg-orange-100 text-orange-800 border border-orange-200',
  'In Warranty': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'Out of Warranty': 'bg-slate-100 text-slate-700 border border-slate-200',
  OK: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

export default function StatusBadge({ status }) {
  if (!status) return null;

  return (
    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${colors[status] || colors.OK}`}>
      {status}
    </span>
  );
}
