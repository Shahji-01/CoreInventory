import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/warehouses': 'Warehouses',
  '/operations/receipts': 'Receipts',
  '/operations/deliveries': 'Deliveries',
  '/operations/transfers': 'Transfers',
  '/operations/adjustments': 'Adjustments',
  '/stock-movements': 'Stock Movements',
  '/settings': 'Settings',
};

export default function AppLayout({ children }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'CoreInventory';

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
