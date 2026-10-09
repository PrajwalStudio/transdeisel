import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { getEquipment, getMonthlyAmcVisits, getOrders, getPMDueReport, getRequests } from '../services/api';

const formatDate = (value) => {
  if (!value) return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [yyyy, mm, dd] = value.slice(0, 10).split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const IconEquipment = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>;
const IconOpenReq = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-amber-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" /></svg>;
const IconPendingOrders = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-purple-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const IconCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>;
const IconShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const IconExclamation = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-rose-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>;
const IconClock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-amber-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;

export default function Dashboard() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pmDue, setPmDue] = useState([]);
  const [monthlyAmcVisits, setMonthlyAmcVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const [equipmentRes, requestRes, orderRes, pmRes, amcVisitsRes] = await Promise.all([
          getEquipment(),
          getRequests(),
          getOrders(),
          getPMDueReport(),
          getMonthlyAmcVisits(currentMonth, currentYear),
        ]);

        setEquipment(equipmentRes.data || []);
        setRequests(requestRes.data || []);
        setOrders(orderRes.data || []);
        setPmDue(pmRes.data || []);
        setMonthlyAmcVisits(amcVisitsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openRequests = useMemo(
    () => orders.filter((order) => order.completion_status !== 'Completed').length,
    [orders]
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.approval_status === 'Pending').length,
    [orders]
  );

  // AMC Statistics
  const amcStats = useMemo(() => {
    const amcList = equipment.filter((eq) => eq.in_amc === true);
    const now = new Date();
    const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let expired = 0;
    let expiringSoon = 0;
    let active = 0;
    const urgentItems = [];

    // Map monthly visit status by equipment_no
    const visitsMap = {};
    monthlyAmcVisits.forEach((v) => {
      visitsMap[v.equipment_no] = v;
    });

    amcList.forEach((eq) => {
      let status = 'No Dates';
      let diffDays = null;

      if (eq.amc_end_date) {
        const end = new Date(eq.amc_end_date);
        const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        diffDays = Math.ceil((endZero - nowZero) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          status = 'Expired';
          expired += 1;
        } else if (diffDays <= 30) {
          status = 'Expiring Soon';
          expiringSoon += 1;
        } else {
          status = 'Active';
          active += 1;
        }
      }

      const visit = visitsMap[eq.equipment_no];
      const hasCompletedVisit = Boolean(visit && visit.visit_id);

      // Collect urgent items (expired, expiring soon, or pending visit)
      if (status === 'Expired' || status === 'Expiring Soon' || !hasCompletedVisit) {
        urgentItems.push({
          ...eq,
          amcStatus: status,
          diffDays,
          visitStatus: hasCompletedVisit ? 'Completed' : 'Pending',
          visitDate: visit?.visit_date || null,
        });
      }
    });

    const totalAmc = amcList.length;
    const completedVisits = monthlyAmcVisits.filter((v) => v.visit_id).length;
    const pendingVisits = totalAmc - completedVisits;

    return {
      totalAmc,
      expired,
      expiringSoon,
      active,
      pendingVisits,
      completedVisits,
      urgentItems,
    };
  }, [equipment, monthlyAmcVisits]);

  // PM Statistics
  const pmStats = useMemo(() => {
    const total = pmDue.length;
    const overdue = pmDue.filter((item) => item.pm_status === 'Overdue').length;
    const dueSoon = pmDue.filter((item) => item.pm_status === 'Due Soon').length;
    const ok = pmDue.filter((item) => item.pm_status === 'OK' || !item.pm_status).length;
    return { total, overdue, dueSoon, ok };
  }, [pmDue]);


  const requestColumns = [
    { key: 'request_id', label: 'Request ID' },
    { key: 'equipment_no', label: 'Equipment No' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'visit_date', label: 'Visit Date', render: (row) => formatDate(row.visit_date) },
    { key: 'symptom', label: 'Symptom' },
  ];


  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

      {/* Main KPI Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Total Equipment</p>
            <p className="mt-2 text-4xl font-extrabold text-navy">{equipment.length}</p>
          </div>
          <div className="rounded-full bg-blue-50 p-3">
            <IconEquipment />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Open Requests</p>
            <p className="mt-2 text-4xl font-extrabold text-navy">{openRequests}</p>
          </div>
          <div className="rounded-full bg-amber-50 p-3">
            <IconOpenReq />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pending Orders</p>
            <p className="mt-2 text-4xl font-extrabold text-navy">{pendingOrders}</p>
          </div>
          <div className="rounded-full bg-purple-50 p-3">
            <IconPendingOrders />
          </div>
        </div>
      </div>

      {/* AMC Summary & Alert Cards (Clickable) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-navy flex items-center gap-2">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            AMC Status & Visits Center
          </h3>
          <button
            type="button"
            onClick={() => navigate('/amc-list')}
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            View AMC Customer List &rarr;
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Active AMC Card */}
          <div
            onClick={() => navigate('/amc-list?status=active')}
            className="cursor-pointer flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-emerald-300 transition-all duration-300 group"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Active AMC</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-800">{amcStats.active}</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium group-hover:underline">Click to view list &rarr;</p>
            </div>
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-700 group-hover:scale-110 transition-transform">
              <IconShield />
            </div>
          </div>

          {/* Expiring Soon Card */}
          <div
            onClick={() => navigate('/amc-list?status=expiring')}
            className="cursor-pointer flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-amber-300 transition-all duration-300 group"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Expiring Soon (30d)</p>
              <p className="mt-2 text-3xl font-extrabold text-amber-800">{amcStats.expiringSoon}</p>
              <p className="text-xs text-amber-600 mt-1 font-medium group-hover:underline">Click to view list &rarr;</p>
            </div>
            <div className="rounded-full bg-amber-100 p-3 text-amber-700 group-hover:scale-110 transition-transform">
              <IconClock />
            </div>
          </div>

          {/* Expired AMC Card */}
          <div
            onClick={() => navigate('/amc-list?status=expired')}
            className="cursor-pointer flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-rose-300 transition-all duration-300 group"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-700">Expired AMC</p>
              <p className="mt-2 text-3xl font-extrabold text-rose-800">{amcStats.expired}</p>
              <p className="text-xs text-rose-600 mt-1 font-medium group-hover:underline">Click to view list &rarr;</p>
            </div>
            <div className="rounded-full bg-rose-100 p-3 text-rose-700 group-hover:scale-110 transition-transform">
              <IconExclamation />
            </div>
          </div>

          {/* AMC Pending Visits Card */}
          <div
            onClick={() => navigate('/amc-list?status=pending_visit')}
            className="cursor-pointer flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-purple-300 transition-all duration-300 group"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-purple-700">Pending Visits (This Month)</p>
              <p className="mt-2 text-3xl font-extrabold text-purple-800">{amcStats.pendingVisits}</p>
              <p className="text-xs text-purple-600 mt-1 font-medium group-hover:underline">Click to view list &rarr;</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 text-purple-700 group-hover:scale-110 transition-transform">
              <IconPendingOrders />
            </div>
          </div>
        </div>
      </section>

      {/* Urgent AMC Action List */}
      {amcStats.urgentItems.length > 0 && (
        <section className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-navy flex items-center gap-2">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
              AMC Attention Needed (Expired / Expiring Soon / Pending Visits)
            </h3>
            <button
              type="button"
              onClick={() => navigate('/amc-list')}
              className="text-xs font-semibold text-accent hover:underline"
            >
              View All ({amcStats.urgentItems.length}) &rarr;
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {amcStats.urgentItems.slice(0, 6).map((item) => (
              <div
                key={item.equipment_no}
                onClick={() => navigate(`/amc-list?status=${item.amcStatus === 'Expired' ? 'expired' : item.amcStatus === 'Expiring Soon' ? 'expiring' : 'pending_visit'}`)}
                className="cursor-pointer flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-4 shadow-sm hover:border-accent hover:bg-white transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-800 text-base">{item.equipment_no}</p>
                    {item.amcStatus === 'Expired' ? (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Expired</span>
                    ) : item.amcStatus === 'Expiring Soon' ? (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Expiring Soon</span>
                    ) : (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Active AMC</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-navy truncate">{item.customer_name || '—'}</p>
                  <p className="text-xs text-slate-500 truncate">{item.site_name ? `Site: ${item.site_name}` : '—'}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>AMC End Date:</span>
                    <span className="font-semibold text-slate-800">{formatDate(item.amc_end_date)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Monthly Visit:</span>
                    {item.visitStatus === 'Completed' ? (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Completed</span>
                    ) : (
                      <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Service Requests Section */}
      <section className="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-xl font-bold text-navy flex items-center gap-2">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          Recent Service Requests
        </h3>
        <DataTable columns={requestColumns} data={requests.slice(0, 5)} />
      </section>

      {/* PM Due Summary & Alert Section (Clickable) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-navy flex items-center gap-2">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
            PM Due Alerts Center
          </h3>
          <button
            type="button"
            onClick={() => navigate('/reports/pm-due')}
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            View Full PM Due Report &rarr;
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Overdue Card */}
          <div
            onClick={() => navigate('/reports/pm-due?status=overdue')}
            className="cursor-pointer flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-rose-300 transition-all duration-300 group"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-700">Overdue PM</p>
              <p className="mt-2 text-3xl font-extrabold text-rose-800">{pmStats.overdue}</p>
              <p className="text-xs text-rose-600 mt-1 font-medium group-hover:underline">Click to view overdue &rarr;</p>
            </div>
            <div className="rounded-full bg-rose-100 p-3 text-rose-700 group-hover:scale-110 transition-transform">
              <IconExclamation />
            </div>
          </div>

          {/* Due Soon Card */}
          <div
            onClick={() => navigate('/reports/pm-due?status=due_soon')}
            className="cursor-pointer flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-amber-300 transition-all duration-300 group"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Due Soon (30d)</p>
              <p className="mt-2 text-3xl font-extrabold text-amber-800">{pmStats.dueSoon}</p>
              <p className="text-xs text-amber-600 mt-1 font-medium group-hover:underline">Click to view due soon &rarr;</p>
            </div>
            <div className="rounded-full bg-amber-100 p-3 text-amber-700 group-hover:scale-110 transition-transform">
              <IconClock />
            </div>
          </div>

          {/* Service OK Card */}
          <div
            onClick={() => navigate('/reports/pm-due?status=ok')}
            className="cursor-pointer flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-emerald-300 transition-all duration-300 group"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Service OK</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-800">{pmStats.ok}</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium group-hover:underline">Click to view OK list &rarr;</p>
            </div>
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-700 group-hover:scale-110 transition-transform">
              <IconShield />
            </div>
          </div>
        </div>

        {/* PM Due Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          {pmDue.slice(0, 6).map((item) => (
            <div
              key={item.equipment_no}
              onClick={() => navigate(`/reports/pm-due?status=${item.pm_status === 'Overdue' ? 'overdue' : item.pm_status === 'Due Soon' ? 'due_soon' : 'ok'}`)}
              className="cursor-pointer flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm hover:border-accent hover:bg-white transition-all duration-200"
            >
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-slate-800 text-lg">{item.equipment_no}</p>
                  <StatusBadge status={item.pm_status} />
                </div>
                <p className="text-sm text-slate-500 font-medium truncate">{item.customer_name}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white rounded border border-slate-200 px-2 py-1.5 w-fit">
                <IconCalendar />
                Days Since Service: <span className="font-bold text-navy ml-1">{item.days_since_service ?? 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

