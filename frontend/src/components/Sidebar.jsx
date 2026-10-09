import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const IconDashboard = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>;
const IconList = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
const IconPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const IconTool = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.653-4.655m0 0l3.105-3.105c.14-.47.38-.892.766-1.208" /></svg>;
const IconShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const IconAlert = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>;
const IconClipboardList = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>;
const IconHistory = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const IconCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg>;
const IconChart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>;
const IconFileText = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;

const navItems = [
  { label: 'Dashboard', to: '/', icon: <IconDashboard /> },
  { label: 'Equipment List', to: '/equipment', icon: <IconList /> },
  { label: 'Add Equipment', to: '/equipment/new', icon: <IconPlus /> },
  { label: 'Manage Equipment', to: '/equipment/warranty', icon: <IconTool /> },
  { label: 'AMC Customer List', to: '/amc-list', icon: <IconShield /> },
  { label: 'Monthly AMC Visit', to: '/amc-visits', icon: <IconCalendar /> },
  { label: 'Service Requests', to: '/requests', icon: <IconAlert /> },
  { label: 'Service Orders', to: '/orders', icon: <IconClipboardList /> },
  { label: 'Equipment History', to: '/reports/history', icon: <IconHistory /> },
  { label: 'PM Due Report', to: '/reports/pm-due', icon: <IconCalendar /> },
  { label: 'Call Categories', to: '/reports/call-categories', icon: <IconChart /> },
  { label: 'Invoices', to: '/invoices', icon: <IconFileText /> },
];

export default function Sidebar({ isMobileOpen = false, onCloseMobile = () => { } }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/45 transition-opacity duration-300 md:hidden ${isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        onClick={onCloseMobile}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 h-screen bg-gradient-to-b from-[#172748] via-[#1a2d54] to-[#1a2744] text-white transition-all duration-300 md:sticky md:z-auto ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } ${collapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-400/20 px-3 py-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300/35 bg-slate-100/5 hover:bg-slate-100/10"
                onClick={() => setCollapsed((value) => !value)}
                type="button"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                >
                  <path
                    d="M12.5 4.5L7 10l5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={onCloseMobile}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300/35 bg-slate-100/5 hover:bg-slate-100/10 md:hidden"
                aria-label="Close menu"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="rounded-md border border-blue-200/20 bg-white/5 px-3 py-2 flex items-center gap-3">
              <img
                src="/td_logo.png"
                alt="TransDiesel Logo"
                className={`object-contain ${collapsed ? 'h-9 w-9' : 'h-10 w-10'} rounded`}
              />
              {!collapsed && (
                <div className="min-w-0">
                  <h1 className="text-base font-bold tracking-wide leading-tight truncate">TransDiesel EMS</h1>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-300 leading-tight mt-0.5">Service Management Portal</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-accent/90 text-white shadow-md shadow-red-900/20'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-transparent text-slate-400 group-hover:text-white group-hover:bg-white/10'
                      }`}>
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {!collapsed && (
            <div className="m-3 rounded-md border border-slate-300/20 bg-white/5 p-3 text-xs text-slate-300">
              <p className="font-semibold text-slate-100">Quick Flow</p>
              <p className="mt-1">Request to Order to Approval to Completion</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
