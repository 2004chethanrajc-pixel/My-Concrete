import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Orders.css';

const STATUS_COLORS = {
  pending_approval: { bg: '#FFF7ED', text: '#EA580C' },
  placed:           { bg: '#EFF6FF', text: '#2563EB' },
  assigned:         { bg: '#F0F9FF', text: '#0369A1' },
  dispatched:       { bg: '#F0FDF4', text: '#16A34A' },
  delivered:        { bg: '#F0FDF4', text: '#15803D' },
  invoiced:         { bg: '#F5F3FF', text: '#7C3AED' },
  cancelled:        { bg: '#FEF2F2', text: '#DC2626' },
};

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadRef = useRef(null);
  const btnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders`);
      setOrders(res.data.data?.orders || []);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (downloadRef.current && !downloadRef.current.contains(e.target)) setShowDownloadMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleDownloadMenu = () => {
    if (!showDownloadMenu && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + window.scrollY + 6, right: window.innerWidth - rect.right });
    }
    setShowDownloadMenu(v => !v);
  };

  const downloadCSV = () => {
    const headers = ['Order #', 'Customer', 'Product', 'Quantity', 'Unit', 'Unit Price', 'Total Amount', 'Advance Amount', 'Advance Paid', 'Balance Paid', 'Status', 'Finance', 'PM', 'Date'];
    const rows = orders.map(o => [
      o.order_number, o.customer_name || '', o.product_type,
      o.quantity || '', o.unit || '',
      o.unit_price || '', o.total_amount || '', o.advance_amount || '',
      o.advance_paid ? 'Yes' : 'No', o.balance_paid ? 'Yes' : 'No',
      o.status, o.assigned_finance_name || '', o.assigned_pm_name || '',
      new Date(o.created_at).toLocaleDateString('en-IN'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const downloadExcel = () => {
    const headers = ['Order #', 'Customer', 'Product', 'Quantity', 'Unit', 'Unit Price', 'Total Amount', 'Advance Amount', 'Advance Paid', 'Balance Paid', 'Status', 'Finance', 'PM', 'Date'];
    const rows = orders.map(o => [
      o.order_number, o.customer_name || '', o.product_type,
      o.quantity || '', o.unit || '',
      o.unit_price || '', o.total_amount || '', o.advance_amount || '',
      o.advance_paid ? 'Yes' : 'No', o.balance_paid ? 'Yes' : 'No',
      o.status, o.assigned_finance_name || '', o.assigned_pm_name || '',
      new Date(o.created_at).toLocaleDateString('en-IN'),
    ]);
    // Build simple XML-based Excel (xls)
    const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Orders"><Table>
      <Row>${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
      ${rows.map(r => `<Row>${r.map(v => `<Cell><Data ss:Type="String">${String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Data></Cell>`).join('')}</Row>`).join('')}
    </Table></Worksheet></Workbook>`;
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders.xls'; a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const downloadPDF = () => {
    const rows = orders.map(o => `<tr>
      <td>${o.order_number}</td><td>${o.customer_name || '-'}</td><td>${o.product_type}</td>
      <td>${o.quantity || '-'} ${o.unit || ''}</td>
      <td>${o.total_amount ? '₹' + Number(o.total_amount).toLocaleString() : 'Pending'}</td>
      <td>${o.advance_paid ? '✓' : '✗'}</td><td>${o.balance_paid ? '✓' : '✗'}</td>
      <td>${o.status}</td><td>${new Date(o.created_at).toLocaleDateString('en-IN')}</td>
    </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Orders</title>
      <style>body{font-family:sans-serif;padding:20px}h2{color:#1F2937}table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#2563EB;color:#fff}tr:nth-child(even){background:#f9fafb}</style>
      </head><body><h2>Orders — ${new Date().toLocaleDateString('en-IN')}</h2>
      <p style="color:#6B7280;font-size:12px">Total: ${orders.length} orders</p>
      <table><thead><tr><th>Order #</th><th>Customer</th><th>Product</th><th>Qty</th><th>Amount</th><th>Adv</th><th>Bal</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
    setShowDownloadMenu(false);
  };

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.product_type?.toLowerCase().includes(q) ||
      o.status?.toLowerCase().includes(q)
    );
  });

  const canCreate = ['admin', 'super_admin'].includes(user?.role);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage all orders</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="stat-badge" style={{ background: '#2563EB' }}>
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div ref={downloadRef} style={{ position: 'relative', zIndex: 200 }}>
            <button ref={btnRef} className="btn-secondary" onClick={toggleDownloadMenu} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fas fa-download"></i> Download
              <i className={`fas fa-chevron-${showDownloadMenu ? 'up' : 'down'}`} style={{ fontSize: 11 }}></i>
            </button>
            {showDownloadMenu && (
              <div style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 99999, minWidth: 150 }}>
                <button onClick={downloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#DC2626' }}>
                  <i className="fas fa-file-pdf"></i> PDF
                </button>
                <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#16A34A' }}>
                  <i className="fas fa-file-csv"></i> CSV
                </button>
                <button onClick={downloadExcel} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#0369A1' }}>
                  <i className="fas fa-file-excel"></i> Excel
                </button>
              </div>
            )}
          </div>
          {canCreate && (
            <button className="btn-primary" onClick={() => navigate('/orders/create')}>
              <i className="fas fa-plus"></i> New Order
            </button>
          )}
        </div>
      </div>

      <div className="search-container">
        <i className="fas fa-search search-icon"></i>
        <input
          className="search-input"
          placeholder="Search by order #, customer, product, status..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-box-open empty-icon"></i>
          <p>No orders found</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filtered.map(order => {
            const sc = STATUS_COLORS[order.status] || { bg: '#F3F4F6', text: '#6B7280' };
            return (
              <div
                key={order.id}
                className="order-card"
                onClick={() => navigate(`/orders/${order.id}`)}
                style={{ borderLeftColor: sc.text }}
              >
                <div className="order-card-header">
                  <p className="order-number">{order.order_number}</p>
                  <span
                    className="order-status-badge"
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="order-product">
                  {order.product_type === 'concrete' ? '🏗️ Concrete' : '🧱 Bricks'}
                  {order.quantity ? `  •  ${order.quantity} ${order.unit || 'units'}` : ''}
                </p>
                {order.customer_name && (
                  <p className="order-meta">
                    <i className="fas fa-user" style={{ marginRight: 6 }}></i>
                    {order.customer_name}
                  </p>
                )}
                {order.total_amount ? (
                  <p className="order-amount">₹{Number(order.total_amount).toLocaleString()}</p>
                ) : (
                  <p className="order-amount-pending">Amount: Pending</p>
                )}
                <p className="order-date">
                  <i className="fas fa-calendar" style={{ marginRight: 6 }}></i>
                  {new Date(order.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
