import { Link, useLocation } from 'react-router-dom';

export default function Header({ title, onOpenSidebar = () => {} }) {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-3 px-4 py-3 md:px-8 md:py-5">
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-navy via-blue-600 to-accent" />
        <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 shadow-sm hover:bg-slate-100 hover:text-navy transition-colors md:hidden"
              aria-label="Open menu"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                <path d="M4 6H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M4 10H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M4 14H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <h2 className="text-xl font-extrabold text-navy tracking-tight md:text-3xl">{title}</h2>
          </div>

          <div className="w-full text-xs sm:w-auto sm:text-sm flex items-center bg-slate-50/80 rounded-md px-3 py-1.5 border border-slate-100">
            <Link to="/" className="font-semibold text-slate-500 hover:text-navy transition-colors flex items-center gap-1">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              Home
            </Link>
            {pathParts.map((part, index) => (
              <span key={`${part}-${index}`} className="flex items-center">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 mx-1.5 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                <span className="capitalize font-medium text-slate-700">{part.replace(/-/g, ' ')}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
