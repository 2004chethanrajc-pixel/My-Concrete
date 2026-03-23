import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Quotations.css';

const Quotations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectsNeedingQuotations, setProjectsNeedingQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [quotationForm, setQuotationForm] = useState({
    materialCost: '',
    labourCost: '',
    transportCost: '',
    otherCost: '',
    totalCost: '',
    advanceAmount: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/projects`);
      
      const allProjects = response.data.data.projects || [];
      
      // Projects that already have quotations
      const projectsWithQuotations = allProjects.filter(p => 
        ['QUOTATION_GENERATED', 'CUSTOMER_APPROVED', 'ADVANCE_PENDING', 'ADVANCE_PAID', 
         'WORK_STARTED', 'COMPLETED', 'FINAL_PAID', 'CLOSED'].includes(p.status)
      );
      
      // Projects that need quotations (REPORT_SUBMITTED status)
      const projectsNeedingQuotations = allProjects.filter(p => 
        p.status === 'REPORT_SUBMITTED' && 
        (user?.role === 'finance' && p.finance_id === user.id)
      );
      
      setProjects(projectsWithQuotations);
      setProjectsNeedingQuotations(projectsNeedingQuotations);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuotation = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/quotations/project/${projectId}`);
      
      console.log('Quotation response:', response.data); // Debug log
      
      // Check if quotations array exists and has items
      if (response.data.success && response.data.data?.quotations?.length > 0) {
        const quotation = response.data.data.quotations[0];
        navigate(`/quotations/${quotation.id}`, { 
          state: { 
            quotation,
            projectId 
          } 
        });
      } else {
        alert('No quotation found for this project');
      }
    } catch (error) {
      console.error('Error fetching quotation:', error);
      alert(error.response?.data?.message || 'Failed to load quotation');
    }
  };

  const handleGenerateQuotation = (project) => {
    setSelectedProject(project);
    setQuotationForm({
      materialCost: '',
      labourCost: '',
      transportCost: '',
      otherCost: '',
      totalCost: '',
      advanceAmount: ''
    });
    setValidationErrors({});
    setShowCreateModal(true);
  };

  // Auto-calculate total cost
  React.useEffect(() => {
    const material = parseFloat(quotationForm.materialCost) || 0;
    const labour = parseFloat(quotationForm.labourCost) || 0;
    const transport = parseFloat(quotationForm.transportCost) || 0;
    const other = parseFloat(quotationForm.otherCost) || 0;
    
    const calculated = material + labour + transport + other;
    setQuotationForm(prev => ({
      ...prev,
      totalCost: calculated > 0 ? calculated.toFixed(2) : ''
    }));
  }, [quotationForm.materialCost, quotationForm.labourCost, quotationForm.transportCost, quotationForm.otherCost]);

  const validateForm = () => {
    const errors = {};

    // Validate material cost
    if (!quotationForm.materialCost) {
      errors.materialCost = 'Material cost is required';
    } else {
      const cost = parseFloat(quotationForm.materialCost);
      if (isNaN(cost) || cost < 0) {
        errors.materialCost = 'Material cost cannot be negative';
      }
    }

    // Validate labour cost
    if (!quotationForm.labourCost) {
      errors.labourCost = 'Labour cost is required';
    } else {
      const cost = parseFloat(quotationForm.labourCost);
      if (isNaN(cost) || cost < 0) {
        errors.labourCost = 'Labour cost cannot be negative';
      }
    }

    // Validate transport cost
    if (!quotationForm.transportCost) {
      errors.transportCost = 'Transport cost is required';
    } else {
      const cost = parseFloat(quotationForm.transportCost);
      if (isNaN(cost) || cost < 0) {
        errors.transportCost = 'Transport cost cannot be negative';
      }
    }

    // Validate other cost
    if (!quotationForm.otherCost) {
      errors.otherCost = 'Other cost is required (enter 0 if none)';
    } else {
      const cost = parseFloat(quotationForm.otherCost);
      if (isNaN(cost) || cost < 0) {
        errors.otherCost = 'Other cost cannot be negative';
      }
    }

    // Validate total cost
    if (!quotationForm.totalCost) {
      errors.totalCost = 'Total cost is required';
    } else {
      const total = parseFloat(quotationForm.totalCost);
      if (isNaN(total) || total < 0) {
        errors.totalCost = 'Total cost cannot be negative';
      }
    }

    // Validate advance amount (optional)
    if (quotationForm.advanceAmount) {
      const advance = parseFloat(quotationForm.advanceAmount);
      const total = parseFloat(quotationForm.totalCost);
      if (isNaN(advance) || advance < 0) {
        errors.advanceAmount = 'Advance amount cannot be negative';
      } else if (advance > total) {
        errors.advanceAmount = 'Advance amount cannot exceed total cost';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitQuotation = async () => {
    if (!validateForm()) {
      alert('Please fix the errors before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const quotationData = {
        projectId: selectedProject.id,
        materialCost: parseFloat(quotationForm.materialCost) || 0,
        labourCost: parseFloat(quotationForm.labourCost) || 0,
        transportCost: parseFloat(quotationForm.transportCost) || 0,
        otherCost: parseFloat(quotationForm.otherCost) || 0,
        totalCost: parseFloat(quotationForm.totalCost) || 0,
        advanceAmount: quotationForm.advanceAmount ? parseFloat(quotationForm.advanceAmount) : 0,
      };

      await api.post(`/quotations`, quotationData);

      alert('Quotation generated successfully!');
      setShowCreateModal(false);
      fetchProjects(); // Refresh the lists
    } catch (error) {
      console.error('Error generating quotation:', error);
      alert(error.response?.data?.message || 'Failed to generate quotation');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      QUOTATION_GENERATED: '#f59e0b',
      CUSTOMER_APPROVED: '#10b981',
      ADVANCE_PENDING: '#f97316',
      ADVANCE_PAID: '#22c55e',
      WORK_STARTED: '#3b82f6',
      COMPLETED: '#10b981',
      FINAL_PAID: '#06b6d4',
      CLOSED: '#64748b',
    };
    return statusColors[status] || '#757575';
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (project.name?.toLowerCase() || '').includes(query) ||
      (project.location?.toLowerCase() || '').includes(query) ||
      (project.status?.toLowerCase() || '').includes(query)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">View all project quotations</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <i className="fas fa-search search-icon"></i>
        <input
          type="text"
          className="search-input"
          placeholder="Search by project name, location, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects Needing Quotations - Finance Only */}
      {user?.role === 'finance' && projectsNeedingQuotations.length > 0 && (
        <div className="section">
          <h2 className="section-title">Projects Needing Quotations</h2>
          <div className="quotations-grid">
            {projectsNeedingQuotations.map((project) => (
              <div key={project.id} className="quotation-card pending-quotation">
                <div className="quotation-header">
                  <div className="quotation-icon">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div className="quotation-status pending">
                    NEEDS QUOTATION
                  </div>
                </div>
                
                <h3 className="quotation-title">{project.name}</h3>
                
                <div className="quotation-details">
                  <div className="quotation-detail">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{project.location}</span>
                  </div>
                  <div className="quotation-detail">
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <button 
                  className="btn-generate-quotation"
                  onClick={() => handleGenerateQuotation(project)}
                >
                  Generate Quotation
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Quotations */}
      <div className="section">
        <h2 className="section-title">Existing Quotations</h2>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading quotations...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-indian-rupee-sign"></i>
            <p>No quotations available</p>
          </div>
        ) : (
          <div className="quotations-grid">
            {filteredProjects.map((project) => (
              <div key={project.id} className="quotation-card">
                <div className="quotation-header">
                  <div className="quotation-icon">
                    <i className="fas fa-indian-rupee-sign"></i>
                  </div>
                  <div 
                    className="quotation-status" 
                    style={{ backgroundColor: getStatusColor(project.status) }}
                  >
                    {project.status.replace(/_/g, ' ')}
                  </div>
                </div>
                
                <h3 className="quotation-title">{project.name}</h3>
                
                <div className="quotation-details">
                  <div className="quotation-detail">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{project.location}</span>
                  </div>
                  <div className="quotation-detail">
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <button 
                  className="btn-view-quotation"
                  onClick={() => handleViewQuotation(project.id)}
                >
                  View Quotation
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Quotation Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Generate Quotation</h2>
              <button 
                className="modal-close" 
                onClick={() => !submitting && setShowCreateModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="project-info">
                <h3>{selectedProject?.name}</h3>
                <p>{selectedProject?.location}</p>
              </div>
              
              <div className="form-group">
                <label>Material Cost *</label>
                <input
                  type="number"
                  value={quotationForm.materialCost}
                  onChange={(e) => {
                    setQuotationForm({
                      ...quotationForm,
                      materialCost: e.target.value
                    });
                    if (validationErrors.materialCost) {
                      setValidationErrors({ ...validationErrors, materialCost: null });
                    }
                  }}
                  placeholder="Enter material cost"
                  min="0"
                  step="0.01"
                  className={validationErrors.materialCost ? 'error' : ''}
                />
                {validationErrors.materialCost && (
                  <span className="error-text">{validationErrors.materialCost}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>Labour Cost *</label>
                <input
                  type="number"
                  value={quotationForm.labourCost}
                  onChange={(e) => {
                    setQuotationForm({
                      ...quotationForm,
                      labourCost: e.target.value
                    });
                    if (validationErrors.labourCost) {
                      setValidationErrors({ ...validationErrors, labourCost: null });
                    }
                  }}
                  placeholder="Enter labour cost"
                  min="0"
                  step="0.01"
                  className={validationErrors.labourCost ? 'error' : ''}
                />
                {validationErrors.labourCost && (
                  <span className="error-text">{validationErrors.labourCost}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>Transport Cost *</label>
                <input
                  type="number"
                  value={quotationForm.transportCost}
                  onChange={(e) => {
                    setQuotationForm({
                      ...quotationForm,
                      transportCost: e.target.value
                    });
                    if (validationErrors.transportCost) {
                      setValidationErrors({ ...validationErrors, transportCost: null });
                    }
                  }}
                  placeholder="Enter transport cost"
                  min="0"
                  step="0.01"
                  className={validationErrors.transportCost ? 'error' : ''}
                />
                {validationErrors.transportCost && (
                  <span className="error-text">{validationErrors.transportCost}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>Other Cost *</label>
                <input
                  type="number"
                  value={quotationForm.otherCost}
                  onChange={(e) => {
                    setQuotationForm({
                      ...quotationForm,
                      otherCost: e.target.value
                    });
                    if (validationErrors.otherCost) {
                      setValidationErrors({ ...validationErrors, otherCost: null });
                    }
                  }}
                  placeholder="Enter other cost (or 0 if none)"
                  min="0"
                  step="0.01"
                  className={validationErrors.otherCost ? 'error' : ''}
                />
                {validationErrors.otherCost && (
                  <span className="error-text">{validationErrors.otherCost}</span>
                )}
                <small className="helper-text">Enter 0 if there are no other costs</small>
              </div>
              
              <div className="form-group">
                <label>Total Cost * (Auto-calculated)</label>
                <input
                  type="text"
                  value={quotationForm.totalCost}
                  readOnly
                  placeholder="Auto-calculated"
                  className={`total-cost-input ${validationErrors.totalCost ? 'error' : ''}`}
                />
                {validationErrors.totalCost && (
                  <span className="error-text">{validationErrors.totalCost}</span>
                )}
                <small className="helper-text auto-calc">This field is automatically calculated</small>
              </div>
              
              <div className="form-group">
                <label>Advance Amount (Optional)</label>
                <input
                  type="number"
                  value={quotationForm.advanceAmount}
                  onChange={(e) => {
                    setQuotationForm({
                      ...quotationForm,
                      advanceAmount: e.target.value
                    });
                    if (validationErrors.advanceAmount) {
                      setValidationErrors({ ...validationErrors, advanceAmount: null });
                    }
                  }}
                  placeholder="Enter advance amount to be paid"
                  min="0"
                  step="0.01"
                  className={validationErrors.advanceAmount ? 'error' : ''}
                />
                {validationErrors.advanceAmount && (
                  <span className="error-text">{validationErrors.advanceAmount}</span>
                )}
                <small className="helper-text">Amount customer should pay in advance (leave empty if no advance required)</small>
              </div>
              
              {quotationForm.totalCost && (
                <div className="cost-breakdown">
                  <h4>Cost Breakdown</h4>
                  <div className="breakdown-item">
                    <span>Material Cost:</span>
                    <span>₹{parseFloat(quotationForm.materialCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Labour Cost:</span>
                    <span>₹{parseFloat(quotationForm.labourCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Transport Cost:</span>
                    <span>₹{parseFloat(quotationForm.transportCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Other Cost:</span>
                    <span>₹{parseFloat(quotationForm.otherCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="breakdown-item total">
                    <span>Total Cost:</span>
                    <span>₹{parseFloat(quotationForm.totalCost || 0).toFixed(2)}</span>
                  </div>
                  {quotationForm.advanceAmount && (
                    <div className="breakdown-item advance">
                      <span>Advance Amount:</span>
                      <span>₹{parseFloat(quotationForm.advanceAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="btn-submit"
                onClick={handleSubmitQuotation}
                disabled={submitting || !quotationForm.materialCost || !quotationForm.labourCost || !quotationForm.transportCost || !quotationForm.otherCost}
              >
                {submitting ? 'Generating...' : 'Generate Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotations;