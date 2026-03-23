import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Layers, Settings, Zap, Server, Sun, Moon, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import Templates from './pages/Templates.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Panels from './pages/Panels.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', Icon: ShoppingBag },
  { to: '/templates', label: 'Templates', Icon: Layers },
  { to: '/panels', label: 'SMM Panels', Icon: Server },
];

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="sidebar-logo" style={{ marginBottom: 0 }}>
            <div className="sidebar-logo-icon">⚡</div>
            <div>
              <div className="sidebar-logo-text">DripFeed</div>
              <div className="sidebar-logo-sub">SMM Panel</div>
            </div>
          </div>
          
          {/* Mobile Toggles */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn btn-sm btn-secondary" onClick={toggleTheme} style={{ padding: 8 }} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button 
              className="btn btn-sm btn-secondary" 
              style={{ padding: 8, display: window.innerWidth <= 768 ? 'flex' : 'none' }} 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        <div className={`sidebar-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <span className="nav-section-label">Navigation</span>
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/panels" element={<Panels />} />
        </Routes>
      </main>
    </div>
  );
}
