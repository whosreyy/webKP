import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Users, 
  Settings, 
  LogOut,
  Clock
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'cashier'] },
    { name: 'Kasir (POS)', path: '/pos', icon: ShoppingCart, roles: ['admin', 'cashier'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['admin'] },
    { name: 'Laporan', path: '/reports', icon: History, roles: ['admin', 'cashier'] },
    { name: 'Pengaturan', path: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '2px solid var(--border)', boxShadow: '4px 0 10px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'var(--primary-light)' }}>
          <h2 style={{ color: 'var(--primary-dark)', fontWeight: '900', letterSpacing: '-0.5px' }}>ERABLUE POS</h2>
        </div>
        
        <div style={{ flexGrow: 1, padding: '16px' }}>
          {filteredMenu.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                textDecoration: 'none', 
                color: location.pathname === item.path ? 'white' : 'var(--text-main)',
                backgroundColor: location.pathname === item.path ? 'var(--primary)' : 'transparent',
                borderRadius: '8px',
                marginBottom: '4px',
                transition: '0.2s'
              }}
            >
              <item.icon size={20} />
              <span style={{ fontWeight: '600' }}>{item.name}</span>
            </Link>
          ))}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '16px', padding: '0 8px' }}>
            <div style={{ fontWeight: '700' }}>{user?.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: '#fee2e2', 
              color: '#b91c1c', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
