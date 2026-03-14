import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, Warehouse, ArrowDownToLine,
  ArrowUpFromLine, Shuffle, Sliders, Activity, Settings, LogOut, User
} from 'lucide-react';

const navItems = [
  {
    section: 'Overview',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    section: 'Inventory',
    links: [
      { to: '/products', label: 'Products', icon: Package },
      { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
    ]
  },
  {
    section: 'Operations',
    links: [
      { to: '/operations/receipts', label: 'Receipts', icon: ArrowDownToLine },
      { to: '/operations/deliveries', label: 'Deliveries', icon: ArrowUpFromLine },
      { to: '/operations/transfers', label: 'Transfers', icon: Shuffle },
      { to: '/operations/adjustments', label: 'Adjustments', icon: Sliders },
    ]
  },
  {
    section: 'Reports',
    links: [
      { to: '/stock-movements', label: 'Stock Movements', icon: Activity },
    ]
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg viewBox="0 0 20 20" fill="none">
            <rect x="3" y="5" width="14" height="2.5" rx="1" fill="#090909"/>
            <rect x="3" y="9" width="10" height="2.5" rx="1" fill="#090909"/>
            <rect x="3" y="13" width="6" height="2.5" rx="1" fill="#090909"/>
          </svg>
        </div>
        <span className="brand-text">CoreInventory</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(section => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-label">{section.section}</div>
            {section.links.map(link => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <Icon />
                  {link.label}
                </NavLink>
              );
            })}
          </div>
        ))}

        <div className="nav-section">
          <div className="nav-section-label">System</div>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Settings size={15} />
            Settings
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className={({ isActive }) => `sidebar-user${isActive ? ' sidebar-user--active' : ''}`} style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={10} /> My Profile
            </div>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); logout(); }}
            title="Sign out"
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}
          >
            <LogOut size={14} />
          </button>
        </NavLink>
      </div>
    </div>
  );
}
