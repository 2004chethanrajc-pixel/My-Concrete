import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      // Close sidebar when switching to desktop
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: 'home' },
    { path: '/projects', label: 'Projects', icon: 'project-diagram', roles: ['admin', 'project_manager', 'site_incharge', 'finance', 'customer'] },
    { path: '/users', label: 'Users', icon: 'users', roles: ['admin'] },
    { path: '/create-admin', label: 'Add Admin', icon: 'user-plus', roles: ['super_admin'] },
    { path: '/create-super-admin', label: 'Add Super Admin', icon: 'user-shield', roles: ['super_admin'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: 'clipboard-list', roles: ['super_admin', 'admin'] },
    { path: '/payments', label: 'Payments', icon: 'money-bill-wave', roles: ['finance'] },
    { path: '/orders', label: 'Orders', icon: 'box', roles: ['admin', 'super_admin', 'finance'] },
    { path: '/quotations', label: 'Quotations', icon: 'fas fa-indian-rupee-sign', roles: ['admin','super_admin','finance'] },
    { path: '/reports', label: 'Reports', icon: 'file-alt', roles: ['admin', 'project_manager', 'site_incharge', 'finance', 'customer'] },
    { path: '/profile', label: 'Profile', icon: 'fas fa-user', roles: ['admin', 'project_manager', 'site_incharge', 'finance', 'customer'] },
];

  const filteredMenuItems = menuItems.filter(item => {
    // Check if user role is required
    if (item.roles) {
      return item.roles.includes(user?.role);
    }
    return true;
  });

  return (
    <div className="layout-wrapper">
      {/* Hamburger Button - Only visible on mobile */}
      {isMobile && (
        <button className="hamburger-button" onClick={toggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
      )}

      {/* Overlay - Only on mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isMobile ? 'sidebar-mobile' : 'sidebar-desktop'} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Close button - Only on mobile */}
        {isMobile && (
          <button className="sidebar-close" onClick={closeSidebar}>
            <i className="fas fa-times"></i>
          </button>
        )}

        {/* Logo Section */}
        <div className="sidebar-logo-section">
          <img src="/logo.png" alt="MyConcrete" className="sidebar-logo logo-glow" />
        </div>

        {/* Simple Profile Section */}
        <div className="sidebar-profile-simple">
          <i className="fas fa-user profile-simple-icon"></i>
          <div className="profile-simple-info">
            <div className="profile-simple-name">{user?.name}</div>
            <div className="profile-simple-details">
              {user?.email} • {user?.role?.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="sidebar-menu">
          {filteredMenuItems.map((item, index) => (
            <button
              key={index}
              className={`menu-item ${isActive(item.path) ? 'menu-item-active' : ''}`}
              onClick={() => handleNavigation(item.path)}
            >
              <i className={`fas fa-${item.icon} menu-icon`}></i>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}

          <div className="menu-divider"></div>

          <button className="menu-item menu-item-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt menu-icon"></i>
            <span className="menu-label">Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <p>Designed by Tackle-D</p>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content-wrapper ${isMobile ? 'main-content-mobile' : 'main-content-desktop'}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;