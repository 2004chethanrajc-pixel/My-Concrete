import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch fresh profile data on mount to get new fields
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/auth/me`);
        if (response.data.success && response.data.data?.user) {
          updateUser(response.data.data.user);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return;
    }

    try {
      setLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      alert('Failed to logout. Please try again.');
      setLoggingOut(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      project_manager: 'Project Manager',
      finance: 'Finance Manager',
      site_incharge: 'Site Incharge',
      customer: 'Customer',
    };
    return roleNames[role] || role;
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      super_admin: 'fa-crown',
      admin: 'fa-shield-alt',
      project_manager: 'fa-user-tie',
      finance: 'fa-chart-line',
      site_incharge: 'fa-hard-hat',
      customer: 'fa-user',
    };
    return roleIcons[role] || 'fa-user';
  };

  const getRoleColor = (role) => {
    const roleColors = {
      super_admin: '#8B5CF6',
      admin: '#3B82F6',
      project_manager: '#F59E0B',
      finance: '#10B981',
      site_incharge: '#EF4444',
      customer: '#4B5563',
    };
    return roleColors[role] || '#3B82F6';
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

  const personalInfoItems = [
    {
      icon: 'fa-envelope',
      label: 'Email Address',
      value: user?.email,
      color: '#3B82F6',
    },
    {
      icon: 'fa-phone',
      label: 'Phone Number',
      value: user?.phone || 'Not provided',
      color: '#10B981',
    },
    {
      icon: 'fa-calendar-day',
      label: 'Date of Joining',
      value: formatDate(user?.date_of_joining),
      color: '#8B5CF6',
    },
    {
      icon: 'fa-birthday-cake',
      label: 'Date of Birth',
      value: formatDate(user?.date_of_birth),
      color: '#EC4899',
    },
    {
      icon: 'fa-map-marker-alt',
      label: 'City',
      value: user?.city || 'Not provided',
      color: '#F59E0B',
    },
    {
      icon: 'fa-home',
      label: 'Current Address',
      value: user?.current_address || 'Not provided',
      color: '#3B82F6',
    },
    {
      icon: 'fa-building',
      label: 'Permanent Address',
      value: user?.permanent_address || 'Not provided',
      color: '#10B981',
    },
    {
      icon: 'fa-check-circle',
      label: 'Account Status',
      value: user?.is_active ? 'Active' : 'Inactive',
      color: user?.is_active ? '#10B981' : '#EF4444',
    },
  ];

  const roleColor = getRoleColor(user?.role);
  const roleIcon = getRoleIcon(user?.role);

  return (
    <div className="profile-page">
        {/* Profile Header with Gradient */}
        <div 
          className="profile-header"
          style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}CC)` }}
        >
          <div className="header-content">
            <div className="avatar-wrapper">
              <div className="avatar-container">
                <i className="fas fa-user-circle"></i>
              </div>
              <div className="role-badge" style={{ backgroundColor: roleColor }}>
                <i className={`fas ${roleIcon}`}></i>
                <span className="role-badge-text">{getRoleDisplayName(user?.role)}</span>
              </div>
            </div>
            
            <h1 className="user-name">{user?.name}</h1>
            <p className="user-email">{user?.email}</p>
          </div>
        </div>

        <div className="profile-content">
          {loadingProfile ? (
            <div className="profile-loading">
              <div className="spinner"></div>
              <p>Loading profile...</p>
            </div>
          ) : (
          <div className="info-card">
            <h2 className="info-card-title">Personal Information</h2>
            {personalInfoItems.map((item, index) => (
              <div key={index} className="info-row">
                <div className="info-row-left">
                  <div 
                    className="info-icon"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <i className={`fas ${item.icon}`} style={{ color: item.color }}></i>
                  </div>
                  <span className="info-label">{item.label}</span>
                </div>
                <span className="info-value">{item.value}</span>
              </div>
            ))}
          </div>
          )}

          {/* Logout Button */}
          <div className="logout-container">
            <button 
              className="logout-button"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>

          {/* App Version */}
          <div className="version-container">
            <p className="version-text">Version 1.0.0</p>
            <p className="copyright-text">© 2024 Construction Management</p>
          </div>
        </div>
      </div>
  );
};

export default Profile;