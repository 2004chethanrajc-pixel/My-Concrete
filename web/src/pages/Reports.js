import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import jsPDF from "jspdf";
import { useAuth } from "../contexts/AuthContext";
import { getLogoBase64, getPdfTimestamp, addPdfLogo, addPdfFooter } from "../utils/pdfUtils";
import "./Reports.css";

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get(`/reports`);
      setReports(response.data.data.reports || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    navigate(`/reports/${report.id}`, { state: { report } });
  };

  const handleDownloadReport = async (report) => {
    try {
      setDownloading(true);

      const [logoBase64] = await Promise.all([getLogoBase64()]);
      const timestamp = getPdfTimestamp();
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      
      // Helper function to add section
      const addSection = (title, y, color = '#3B82F6') => {
        pdf.setFillColor(color);
        pdf.rect(margin, y - 5, pageWidth - (2 * margin), 0.5, 'F');
        pdf.setFontSize(16);
        pdf.setTextColor(color);
        pdf.setFont(undefined, 'bold');
        pdf.text(title, margin, y);
        return y + 8;
      };

      // Helper function to add row
      const addRow = (label, value, y) => {
        pdf.setFontSize(11);
        pdf.setTextColor('#64748B');
        pdf.setFont(undefined, 'normal');
        pdf.text(label, margin, y);
        pdf.setTextColor('#1E293B');
        pdf.setFont(undefined, 'bold');
        
        // Handle long values
        const maxWidth = pageWidth - (2 * margin) - 80;
        const splitValue = pdf.splitTextToSize(String(value || 'N/A'), maxWidth);
        pdf.text(splitValue, pageWidth - margin - maxWidth, y);
        
        return y + 8;
      };

      let yPos = 30;

      // Header with gradient effect (simulated with colors)
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setFillColor(30, 58, 138);
      pdf.rect(0, 35, pageWidth, 5, 'F');
      
      // Logo top-left in header
      addPdfLogo(pdf, logoBase64, margin, 6);

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('SITE REPORT', pageWidth / 2, 20, { align: 'center' });

      // Reset position
      yPos = 60;

      // Project Info Header
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin - 5, yPos - 20, pageWidth - (2 * margin) + 10, 45, 'F');
      
      pdf.setTextColor('#1E293B');
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text(report.project_name || 'Project Report', margin, yPos);
      yPos += 8;

      pdf.setFontSize(12);
      pdf.setTextColor('#64748B');
      pdf.text(report.project_location || '', margin, yPos);
      yPos += 15;

      // Status Badge
      const statusColor = getStatusColor(report.approval_status);
      pdf.setFillColor(statusColor);
      pdf.roundedRect(pageWidth - margin - 100, yPos - 20, 100, 20, 3, 3, 'F');
      pdf.setTextColor('#FFFFFF');
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      const statusText = (report.approval_status || 'pending').toUpperCase();
      pdf.text(statusText, pageWidth - margin - 50, yPos - 8, { align: 'center' });

      yPos += 10;

      // Report Details Section
      yPos = addSection('Report Details', yPos);
      
      const details = [
        { label: 'Report ID', value: report.id },
        { label: 'Project Name', value: report.project_name },
        { label: 'Location', value: report.project_location },
        { label: 'Customer', value: report.customer_name || 'N/A' },
        { label: 'Submitted By', value: report.site_incharge_name || 'N/A' },
        { label: 'Created', value: new Date(report.created_at).toLocaleString('en-IN', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      ];

      details.forEach(item => {
        yPos = addRow(item.label, item.value, yPos);
      });

      yPos += 5;

      // Site Specifications Section
      yPos = addSection('Site Specifications', yPos);
      
      const specs = [
        { label: 'Total Floors', value: report.total_floors },
        { label: 'Dimensions', value: report.dimensions }
      ];

      specs.forEach(item => {
        yPos = addRow(item.label, item.value, yPos);
      });

      // Remarks
      if (report.remarks) {
        yPos += 5;
        yPos = addSection('Remarks', yPos, '#10b981');
        
        pdf.setFontSize(11);
        pdf.setTextColor('#1E293B');
        pdf.setFont(undefined, 'normal');
        const splitRemarks = pdf.splitTextToSize(report.remarks, pageWidth - (2 * margin));
        pdf.text(splitRemarks, margin, yPos);
        yPos += (splitRemarks.length * 6) + 10;
      }

      // Images info
      if (report.images && report.images.length > 0) {
        // Check if we need a new page
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = 30;
        }

        yPos = addSection(`Site Images (${report.images.length})`, yPos, '#8b5cf6');
        
        pdf.setFontSize(11);
        pdf.setTextColor('#64748B');
        pdf.setFont(undefined, 'italic');
        pdf.text(`This report contains ${report.images.length} image(s).`, margin, yPos);
        yPos += 6;
        pdf.text('Site images can be viewed in the web application.', margin, yPos);
        yPos += 10;

        // Add image placeholders
        const imagesPerRow = 2;
        const imageWidth = (pageWidth - (2 * margin) - 20) / imagesPerRow;
        const imageHeight = imageWidth * 0.75;
        
        let imageYPos = yPos;
        
        for (let i = 0; i < Math.min(report.images.length, 4); i++) {
          const col = i % imagesPerRow;
          const row = Math.floor(i / imagesPerRow);
          
          const xPos = margin + (col * (imageWidth + 10));
          const currentYPos = imageYPos + (row * (imageHeight + 15));

          // Check if we need a new page
          if (currentYPos + imageHeight > pageHeight - 20) {
            pdf.addPage();
            imageYPos = 30;
            continue;
          }

          // Draw image placeholder
          pdf.setFillColor(241, 245, 249);
          pdf.roundedRect(xPos, currentYPos, imageWidth, imageHeight, 3, 3, 'F');
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(xPos, currentYPos, imageWidth, imageHeight, 3, 3, 'S');
          
          // Add image icon
          pdf.setTextColor('#94A3B8');
          pdf.setFontSize(24);
          pdf.text('📷', xPos + (imageWidth / 2) - 5, currentYPos + (imageHeight / 2));
          
          // Add image number
          pdf.setFontSize(9);
          pdf.setTextColor('#64748B');
          pdf.text(`Image ${i + 1}`, xPos + (imageWidth / 2) - 10, currentYPos + imageHeight - 10);
        }
        
        yPos = imageYPos + (Math.ceil(Math.min(report.images.length, 4) / imagesPerRow) * (imageHeight + 15)) + 10;
      }

      // Footer
      addPdfFooter(pdf, pageWidth, pageHeight, margin, timestamp, `Report ID: ${report.id.slice(0, 8)}`);
      
      // Save the PDF
      pdf.save(`site-report-${report.project_name?.replace(/\s+/g, '-') || 'report'}-${Date.now()}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      default:
        return "#f59e0b";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return "✓";
      case "rejected": return "✗";
      default: return "⏳";
    }
  };

  const filteredReports = reports.filter((report) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    return (
      report.project_name?.toLowerCase().includes(query) ||
      report.project_location?.toLowerCase().includes(query) ||
      report.approval_status?.toLowerCase().includes(query) ||
      report.customer_name?.toLowerCase().includes(query) ||
      report.site_incharge_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="reports-page">

      {/* Header */}
      <div className="reports-header">
        <div className="header-content">
          <h1>Site Reports</h1>
          <p>Inspection reports from construction sites</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <span className="stat-label">Total</span>
            <span className="stat-value">{reports.length}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-label">Pending</span>
            <span className="stat-value warning">
              {reports.filter(r => r.approval_status === 'pending').length}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="reports-search">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by project, location, status, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="search-clear"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="reports-loading">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="reports-empty">
          <div className="empty-icon">📋</div>
          <h3>No reports available</h3>
          <p>{searchQuery ? 'Try adjusting your search' : 'Reports will appear here once created'}</p>
          {searchQuery && (
            <button 
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="reports-grid">
          {filteredReports.map((report) => (
            <div key={report.id} className="report-card">

              <div className="report-top">
                <div className="report-icon">
                  {getStatusIcon(report.approval_status)}
                </div>

                <div className="report-project">
                  <h3>{report.project_name}</h3>
                  <p>
                    <span className="location-icon">📍</span>
                    {report.project_location}
                  </p>
                </div>

                <div
                  className="report-status"
                  style={{
                    backgroundColor: getStatusColor(report.approval_status)
                  }}
                >
                  {(report.approval_status || "pending").toUpperCase()}
                </div>

              </div>

              <div className="report-metrics">
                <div className="metric">
                  <span className="metric-label">Floors</span>
                  <strong className="metric-value">{report.total_floors}</strong>
                </div>

                <div className="metric">
                  <span className="metric-label">Dimensions</span>
                  <strong className="metric-value">{report.dimensions}</strong>
                </div>

                <div className="metric">
                  <span className="metric-label">Date</span>
                  <strong className="metric-value">
                    {new Date(report.created_at).toLocaleDateString("en-IN", {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </strong>
                </div>

              </div>

             

              {report.remarks && (
                <div className="report-remarks">
                  <span className="remarks-icon">📝</span>
                  <p>{report.remarks}</p>
                </div>
              )}

              {report.images && report.images.length > 0 && (
                <div className="report-images-badge">
                  <span className="images-icon">📷</span>
                  <span>{report.images.length} image{report.images.length > 1 ? 's' : ''}</span>
                </div>
              )}

              <div className="report-actions">
                <button
                  className="btn-view"
                  onClick={() => handleViewReport(report)}
                >
                  <span className="btn-icon">👁️</span>
                  View Details
                </button>

                <button
                  className="btn-download"
                  onClick={() => handleDownloadReport(report)}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <span className="spinner-small"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">📥</span>
                      Download PDF
                    </>
                  )}
                </button>
              </div>

              <div className="report-footer">
                <span className="report-id">ID: {report.id.slice(0, 8)}...</span>
                <span className="report-time">
                  {new Date(report.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;