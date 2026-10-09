import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import EquipmentForm from './pages/EquipmentForm';
import UpdateWarranty from './pages/UpdateWarranty';
import ServiceRequests from './pages/ServiceRequests';
import ServiceOrders from './pages/ServiceOrders';
import Invoices from './pages/Invoices';
import EquipmentHistory from './pages/EquipmentHistory';
import PMDueReport from './pages/PMDueReport';
import CallCategoryReport from './pages/CallCategoryReport';
import AmcList from './pages/AmcList';
import MonthlyAmcVisits from './pages/MonthlyAmcVisits';

const routeTitles = {
  '/': 'Dashboard',
  '/equipment': 'Equipment List',
  '/equipment/new': 'Add Equipment',
  '/equipment/warranty': 'Manage Equipment',
  '/amc-list': 'AMC List',
  '/amc-visits': 'Monthly AMC Visits',
  '/requests': 'Service Requests',
  '/orders': 'Service Orders',
  '/invoices': 'Service Invoices',
  '/reports/history': 'Equipment History',
  '/reports/pm-due': 'PM Due Report',
  '/reports/call-categories': 'Call Category Visits',
};

export default function App() {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pageTitle = routeTitles[location.pathname] || 'Service Management Portal';

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-surface text-slate-800">
      <div className="flex min-h-screen">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <div className="flex-1">
          <Header title={pageTitle} onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
          <main className="p-4 md:p-6">
            <div className="mx-auto max-w-7xl fade-up">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/equipment" element={<EquipmentList />} />
                <Route path="/equipment/new" element={<EquipmentForm />} />
                <Route path="/equipment/warranty" element={<UpdateWarranty />} />
                <Route path="/amc-list" element={<AmcList />} />
                <Route path="/amc-visits" element={<MonthlyAmcVisits />} />
                <Route path="/requests" element={<ServiceRequests />} />
                <Route path="/orders" element={<ServiceOrders />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/reports/history" element={<EquipmentHistory />} />
                <Route path="/reports/pm-due" element={<PMDueReport />} />
                <Route path="/reports/call-categories" element={<CallCategoryReport />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
