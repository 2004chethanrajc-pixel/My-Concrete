import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Projects.css'; // Reuse the same styles

// Lightweight calendar date picker — no external deps
const CalendarPicker = ({ value, onChange, placeholder = 'Select date' }) => {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const select = (day) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const displayValue = () => {
    if (!value) return placeholder;
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isSelected = (day) => {
    if (!value || !day) return false;
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return value === `${viewYear}-${mm}-${dd}`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: '1px solid #ddd', borderRadius: '6px', padding: '10px 12px',
          cursor: 'pointer', backgroundColor: '#fff', fontSize: '14px',
          color: value ? '#333' : '#999', userSelect: 'none',
        }}
      >
        <span>{displayValue()}</span>
        <i className="fas fa-calendar-alt" style={{ color: '#666' }}></i>
      </div>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 9999, top: '110%', left: 0,
          backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '12px', width: '260px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px 8px' }}>‹</button>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px 8px' }}>›</button>
          </div>
          {/* Year quick-jump */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', gap: '6px' }}>
            <button onClick={() => setViewYear(y => y - 1)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '12px' }}>-</button>
            <span style={{ fontSize: '12px', lineHeight: '22px', color: '#555' }}>{viewYear}</span>
            <button onClick={() => setViewYear(y => y + 1)} style={{ background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '12px' }}>+</button>
          </div>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#888', padding: '4px 0' }}>{d}</div>)}
          </div>
          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, i) => (
              <div
                key={i}
                onClick={() => day && select(day)}
                style={{
                  textAlign: 'center', padding: '6px 2px', borderRadius: '6px', fontSize: '13px',
                  cursor: day ? 'pointer' : 'default',
                  backgroundColor: isSelected(day) ? '#4361EE' : 'transparent',
                  color: isSelected(day) ? '#fff' : day ? '#333' : 'transparent',
                  fontWeight: isSelected(day) ? '600' : 'normal',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (day && !isSelected(day)) e.currentTarget.style.backgroundColor = '#f0f4ff'; }}
                onMouseLeave={e => { if (!isSelected(day)) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {day || ''}
              </div>
            ))}
          </div>
          {/* Clear */}
          {value && (
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button onClick={() => { onChange(''); setOpen(false); }} style={{ background: 'none', border: 'none', color: '#E53935', cursor: 'pointer', fontSize: '12px' }}>
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Users = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(null);
  const [activating, setActivating] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    date_of_joining: '',
    date_of_birth: '',
    city: '',
    current_address: '',
    permanent_address: '',
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [updatingUser, setUpdatingUser] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [forcingLogout, setForcingLogout] = useState(false);

  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'site_incharge', label: 'Site Incharge' },
    { value: 'finance', label: 'Finance' },
    { value: 'customer', label: 'Customer' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/users`);
      setUsers(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const canDeactivateUser = (user) => {
    // Super admins cannot be deactivated
    if (user.role === 'super_admin') {
      return false;
    }
    
    // Only super_admin can deactivate admin users
    if (user.role === 'admin' && currentUser?.role !== 'super_admin') {
      return false;
    }
    
    // Cannot deactivate yourself
    if (user.id === currentUser?.id) {
      return false;
    }
    
    // User must be active to be deactivated
    if (!user.is_active) {
      return false;
    }
    
    return true;
  };

  const canActivateUser = (user) => {
    // Only super_admin can activate admin users
    if (user.role === 'admin' && currentUser?.role !== 'super_admin') {
      return false;
    }
    
    // User must be inactive to be activated
    if (user.is_active) {
      return false;
    }
    
    return true;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post(`/users`, formData);
      alert('User created successfully!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer',
        date_of_joining: '',
        date_of_birth: '',
        city: '',
        current_address: '',
        permanent_address: '',
      });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeactivateUser = async (user) => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.name}? This will disable their access to the system.`)) {
      return;
    }

    try {
      setDeactivating(user.id);
      const token = localStorage.getItem('token');
      await api.patch(`/users/${user.id}/deactivate`, 
        { reason: 'Deactivated by admin' }
      );
      alert('Success', 'User deactivated successfully');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setDeactivating(null);
    }
  };

  const handleActivateUser = async (user) => {
    if (!window.confirm(`Are you sure you want to activate ${user.name}? This will restore their access to the system.`)) {
      return;
    }

    try {
      setActivating(user.id);
      const token = localStorage.getItem('token');
      await api.patch(`/users/${user.id}/activate`, 
        {}
      );
      alert('Success', 'User activated successfully');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to activate user');
    } finally {
      setActivating(null);
    }
  };

  const getRoleColor = (role) => {
    const roleColors = {
      super_admin: '#E53935',
      admin: '#1E88E5',
      project_manager: '#8E24AA',
      site_incharge: '#00C853',
      finance: '#FF6F00',
      customer: '#757575',
    };
    return roleColors[role] || '#757575';
  };

  const formatRole = (role) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return 'Not provided';
    }
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setSessionStatus(null);
    setShowUserDetailsModal(true);
    // Fetch session status in background
    api.get(`/users/${user.id}/session-status`)
      .then(res => setSessionStatus(res.data.data))
      .catch(() => setSessionStatus(null));
  };

  const handleForceLogout = async () => {
    if (!window.confirm(`Force logout ${selectedUser.name} from all devices?`)) return;
    try {
      setForcingLogout(true);
      const res = await api.delete(`/users/${selectedUser.id}/sessions`);
      alert(res.data.message || 'User logged out from all devices');
      setSessionStatus({ hasActiveSession: false, session: null });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to force logout');
    } finally {
      setForcingLogout(false);
    }
  };

  const handleOpenEditModal = (user) => {
    setEditFormData({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      date_of_joining: user.date_of_joining ? user.date_of_joining.split('T')[0] : '',
      date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : '',
      city: user.city || '',
      current_address: user.current_address || '',
      permanent_address: user.permanent_address || '',
    });
    setShowUserDetailsModal(false);
    setShowEditModal(true);
  };

  const handleUpdateUserDetails = async (e) => {
    e.preventDefault();
    try {
      setUpdatingUser(true);
      const payload = {
        name: editFormData.name || undefined,
        phone: editFormData.phone || null,
        email: editFormData.email || undefined,
        date_of_joining: editFormData.date_of_joining || null,
        date_of_birth: editFormData.date_of_birth || null,
        city: editFormData.city || null,
        current_address: editFormData.current_address || null,
        permanent_address: editFormData.permanent_address || null,
      };
      const response = await api.patch(`/users/${selectedUser.id}/details`, payload);
      const updatedUser = response.data.data?.user || response.data.user;
      setSelectedUser({ ...selectedUser, ...updatedUser });
      setShowEditModal(false);
      setShowUserDetailsModal(true);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update user details');
    } finally {
      setUpdatingUser(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone && user.phone.toLowerCase().includes(query)) ||
      user.role.toLowerCase().includes(query)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage system users and roles</p>
        </div>
        <div className="header-actions">
          {currentUser?.role === 'super_admin' && (
            <button className="btn-warning" onClick={() => navigate('/create-admin')}>
              <i className="fas fa-user-plus"></i> Add Admin
            </button>
          )}
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus"></i> Create User
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <i className="fas fa-search search-icon"></i>
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, phone, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-users empty-icon"></i>
          <p>No users found</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredUsers.map((user) => (
            <div key={user.id} className="project-card" onClick={() => handleViewUserDetails(user)} style={{ cursor: 'pointer' }}>
              <div className="project-header">
                <h3 className="project-name">{user.name}</h3>
                <div className="project-header-actions">
                  {!user.is_active && (
                    <span className="inactive-badge" style={{ 
                      backgroundColor: '#E5393520',
                      color: '#E53935',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginRight: '8px'
                    }}>
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              <p className="project-location">
                <i className="fas fa-envelope"></i> {user.email}
              </p>
              {user.phone && (
                <p className="project-location">
                  <i className="fas fa-phone"></i> {user.phone}
                </p>
              )}
              <div className="project-status" style={{ backgroundColor: getRoleColor(user.role) }}>
                {formatRole(user.role)}
              </div>
              <div className="project-footer">
                <span className="project-date">
                  {user.is_active ? (
                    <><i className="fas fa-check-circle" style={{ color: '#00C853' }}></i> Active</>
                  ) : (
                    <><i className="fas fa-times-circle" style={{ color: '#E53935' }}></i> Inactive</>
                  )}
                </span>
              </div>
              
              {/* User Actions */}
              {(canDeactivateUser(user) || canActivateUser(user)) && (
                <div style={{ 
                  marginTop: '15px', 
                  paddingTop: '15px', 
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}>
                  {canDeactivateUser(user) && (
                    <button
                      className="btn-delete"
                      onClick={(e) => { e.stopPropagation(); handleDeactivateUser(user); }}
                      disabled={deactivating === user.id}
                      style={{ 
                        backgroundColor: '#E53935',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: deactivating === user.id ? 'not-allowed' : 'pointer',
                        opacity: deactivating === user.id ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {deactivating === user.id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-user-slash"></i>
                      )}
                      Deactivate
                    </button>
                  )}
                  {canActivateUser(user) && (
                    <button
                      className="btn-primary"
                      onClick={(e) => { e.stopPropagation(); handleActivateUser(user); }}
                      disabled={activating === user.id}
                      style={{ 
                        backgroundColor: '#00C853',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: activating === user.id ? 'not-allowed' : 'pointer',
                        opacity: activating === user.id ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {activating === user.id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-user-check"></i>
                      )}
                      Activate
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone"
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password (min 6 characters)"
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date of Joining</label>
                <CalendarPicker
                  value={formData.date_of_joining}
                  onChange={(val) => setFormData({ ...formData, date_of_joining: val })}
                  placeholder="Select date of joining"
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <CalendarPicker
                  value={formData.date_of_birth}
                  onChange={(val) => setFormData({ ...formData, date_of_birth: val })}
                  placeholder="Select date of birth"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div className="form-group">
                <label>Current Address</label>
                <textarea
                  value={formData.current_address}
                  onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                  placeholder="Enter current address"
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label>Permanent Address</label>
                <textarea
                  value={formData.permanent_address}
                  onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                  placeholder="Enter permanent address"
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="modal-close" onClick={() => setShowUserDetailsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-form">
              <div className="user-details-container">
                <div className="user-details-header">
                  <div className="user-avatar">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="user-header-info">
                    <h3 className="user-details-name">{selectedUser.name}</h3>
                    <div className="user-role-badge" style={{ backgroundColor: getRoleColor(selectedUser.role) }}>
                      {formatRole(selectedUser.role)}
                    </div>
                  </div>
                </div>

                <div className="user-details-grid">
                  <div className="detail-row">
                    <span className="detail-label"><i className="fas fa-envelope"></i> Email</span>
                    <span className="detail-value">{selectedUser.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><i className="fas fa-phone"></i> Phone</span>
                    <span className="detail-value">{selectedUser.phone || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><i className="fas fa-calendar-day"></i> Date of Joining</span>
                    <span className="detail-value">{formatDate(selectedUser.date_of_joining)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><i className="fas fa-birthday-cake"></i> Date of Birth</span>
                    <span className="detail-value">{formatDate(selectedUser.date_of_birth)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><i className="fas fa-map-marker-alt"></i> City</span>
                    <span className="detail-value">{selectedUser.city || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><i className="fas fa-home"></i> Current Address</span>
                    <span className="detail-value">{selectedUser.current_address || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><i className="fas fa-building"></i> Permanent Address</span>
                    <span className="detail-value">{selectedUser.permanent_address || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><i className="fas fa-calendar"></i> Account Created</span>
                    <span className="detail-value">{formatDate(selectedUser.created_at)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><i className="fas fa-check-circle"></i> Account Status</span>
                    <span className="detail-value" style={{ color: selectedUser.is_active ? '#10B981' : '#EF4444' }}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label"><i className="fas fa-mobile-alt"></i> Session</span>
                    <span className="detail-value">
                      {sessionStatus === null ? (
                        <span style={{ color: '#94A3B8', fontSize: '13px' }}>Checking...</span>
                      ) : sessionStatus.hasActiveSession ? (
                        <span style={{ color: '#F59E0B', fontWeight: '600' }}>
                          <i className="fas fa-circle" style={{ fontSize: '8px', marginRight: '5px' }}></i>
                          Active session
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>No active session</span>
                      )}
                    </span>
                  </div>
                  {selectedUser.active_projects > 0 && (
                    <div className="detail-row">
                      <span className="detail-label"><i className="fas fa-project-diagram"></i> Active Projects</span>
                      <span className="detail-value">{selectedUser.active_projects}</span>
                    </div>
                  )}
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  {((currentUser?.role === 'admin' && !['admin', 'super_admin'].includes(selectedUser.role)) ||
                    (currentUser?.role === 'super_admin' && selectedUser.role !== 'super_admin')) && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleOpenEditModal(selectedUser)}
                    >
                      <i className="fas fa-edit"></i> Edit Details
                    </button>
                  )}
                  {sessionStatus?.hasActiveSession && selectedUser.id !== currentUser?.id &&
                    ((currentUser?.role === 'admin' && !['admin', 'super_admin'].includes(selectedUser.role)) ||
                     currentUser?.role === 'super_admin') && (
                    <button
                      type="button"
                      onClick={handleForceLogout}
                      disabled={forcingLogout}
                      style={{
                        backgroundColor: '#F59E0B',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        cursor: forcingLogout ? 'not-allowed' : 'pointer',
                        opacity: forcingLogout ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      {forcingLogout
                        ? <><i className="fas fa-spinner fa-spin"></i> Logging out...</>
                        : <><i className="fas fa-sign-out-alt"></i> Logout All Devices</>
                      }
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setShowUserDetailsModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit User Details Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setShowUserDetailsModal(true); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Edit Details — {selectedUser.name}</h2>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setShowUserDetailsModal(true); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleUpdateUserDetails} className="modal-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div className="form-group">
                <label>Date of Joining</label>
                <CalendarPicker
                  value={editFormData.date_of_joining}
                  onChange={(val) => setEditFormData({ ...editFormData, date_of_joining: val })}
                  placeholder="Select date of joining"
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <CalendarPicker
                  value={editFormData.date_of_birth}
                  onChange={(val) => setEditFormData({ ...editFormData, date_of_birth: val })}
                  placeholder="Select date of birth"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div className="form-group">
                <label>Current Address</label>
                <textarea
                  value={editFormData.current_address}
                  onChange={(e) => setEditFormData({ ...editFormData, current_address: e.target.value })}
                  placeholder="Enter current address"
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label>Permanent Address</label>
                <textarea
                  value={editFormData.permanent_address}
                  onChange={(e) => setEditFormData({ ...editFormData, permanent_address: e.target.value })}
                  placeholder="Enter permanent address"
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setShowUserDetailsModal(true); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={updatingUser}>
                  {updatingUser ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;