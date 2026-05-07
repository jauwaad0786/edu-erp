import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api from '../api/axios';

export default function FeesPage() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [filter,  setFilter]  = useState('');
  const [status,  setStatus]  = useState('');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedRecord,   setSelectedRecord]   = useState(null);
  const [payAmount,  setPayAmount]  = useState('');
  const [payMode,    setPayMode]    = useState('CASH');
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState('');

  const load = () => {
    api.get('/principal/fees/summary').then(r => setSummary(r.data)).catch(() => {});
    const q = status ? `?status=${status}` : '';
    api.get(`/principal/fees/records${q}`).then(r => setRecords(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [status]);

  const collectFee = async () => {
    setSaving(true); setMsg('');
    try {
      await api.post('/principal/fees/collect', {
        record_id: selectedRecord.id,
        amount_paid: parseFloat(payAmount),
        payment_mode: payMode,
      });
      setMsg('✅ Fee collected!'); setShowCollectModal(false); load();
    } catch { setMsg('❌ Error collecting fee'); }
    setSaving(false);
  };

  const fmt = n => n?.toLocaleString('en-IN') ?? '0';
  const filtered = records.filter(r =>
    r.fee_type?.toLowerCase().includes(filter.toLowerCase()) ||
    r.month?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Fee Management" />
        <div className="page-body">

          <div className="page-header">
            <h2 className="page-title">Fee Management</h2>
            <p className="page-subtitle">Collect, track and report school fees</p>
          </div>

          {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

          {/* Revenue Cards */}
          <div className="grid-4 mb-6">
            {[
              { icon: '💰', label: 'Total Revenue',    value: `₹${fmt(summary?.total_collected)}`, color: '#2e844a', bg: '#eaf5ea' },
              { icon: '📋', label: 'Total Billed',     value: `₹${fmt(summary?.total_due)}`,       color: '#0176d3', bg: '#e8f4fd' },
              { icon: '⏳', label: 'Pending Count',    value: fmt(summary?.pending_count),          color: '#dd7a01', bg: '#fef5e4' },
              { icon: '⚠️', label: 'Overdue',          value: fmt(summary?.overdue_count),          color: '#ba0517', bg: '#fef1ee' },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon" style={{ background: s.bg }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                </div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Collection Rate */}
          {summary && (
            <div className="card mb-6">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h4>Collection Rate</h4>
                  <span style={{ fontSize: 18, fontWeight: 800, color: summary.collection_rate >= 70 ? 'var(--success)' : 'var(--error)' }}>
                    {summary.collection_rate}%
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="progress-fill"
                    style={{
                      width: `${summary.collection_rate}%`,
                      background: summary.collection_rate >= 70 ? 'var(--success)' : summary.collection_rate >= 40 ? 'var(--warning)' : 'var(--error)',
                    }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--neutral-6)' }}>
                  <span>₹{fmt(summary.total_collected)} collected</span>
                  <span>₹{fmt(summary.total_due - summary.total_collected)} remaining</span>
                </div>
              </div>
            </div>
          )}

          {/* Filters + Table */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h4>Fee Records ({filtered.length})</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" placeholder="Search..."
                  style={{ width: 200 }} value={filter} onChange={e => setFilter(e.target.value)} />
                <select className="form-select" style={{ width: 140 }}
                  value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Receipt No</th><th>Fee Type</th><th>Month</th>
                    <th>Due</th><th>Paid</th><th>Balance</th>
                    <th>Due Date</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontSize: 11, color: 'var(--neutral-6)' }}>{r.receipt_no || '—'}</td>
                      <td style={{ fontWeight: 500 }}>{r.fee_type}</td>
                      <td>{r.month}</td>
                      <td style={{ fontWeight: 600 }}>₹{r.amount_due?.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{r.amount_paid?.toLocaleString('en-IN')}</td>
                      <td style={{ color: r.amount_due > r.amount_paid ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
                        ₹{(r.amount_due - r.amount_paid)?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--neutral-6)' }}>{r.due_date || '—'}</td>
                      <td>
                        <span className={`badge ${
                          r.status === 'PAID'    ? 'badge-success' :
                          r.status === 'PARTIAL' ? 'badge-warning' :
                          r.status === 'OVERDUE' ? 'badge-error'   : 'badge-neutral'
                        }`}>{r.status}</span>
                      </td>
                      <td>
                        {r.status !== 'PAID' && (
                          <button className="btn btn-sm" onClick={() => { setSelectedRecord(r); setPayAmount(r.amount_due - r.amount_paid); setShowCollectModal(true); }}
                            style={{
                              background: '#eaf5ea', color: 'var(--success)',
                              border: 'none', cursor: 'pointer', borderRadius: 4,
                              padding: '4px 10px', fontSize: 11, fontWeight: 700,
                            }}>💸 Collect</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <div className="empty-state-icon">💰</div>
                          <p>No fee records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Collect Fee Modal */}
      {showCollectModal && selectedRecord && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowCollectModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>💸 Collect Fee</h3>
              <button className="modal-close" onClick={() => setShowCollectModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{
                background: 'var(--blue-10)', borderRadius: 8, padding: '12px 16px', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--neutral-6)' }}>Fee Type</span>
                  <span style={{ fontWeight: 700 }}>{selectedRecord.fee_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                  <span style={{ color: 'var(--neutral-6)' }}>Total Due</span>
                  <span style={{ fontWeight: 700 }}>₹{selectedRecord.amount_due?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                  <span style={{ color: 'var(--neutral-6)' }}>Balance</span>
                  <span style={{ fontWeight: 700, color: 'var(--error)' }}>
                    ₹{(selectedRecord.amount_due - selectedRecord.amount_paid)?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Amount to Collect (₹)</label>
                <input className="form-input" type="number" value={payAmount}
                  onChange={e => setPayAmount(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-select" value={payMode} onChange={e => setPayMode(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neutral" onClick={() => setShowCollectModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={collectFee} disabled={saving}>
                {saving ? 'Processing...' : '✅ Confirm Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
