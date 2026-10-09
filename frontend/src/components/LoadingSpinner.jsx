export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-white p-4 text-slate-700 shadow-panel">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-navy" />
      <span>{label}</span>
    </div>
  );
}
