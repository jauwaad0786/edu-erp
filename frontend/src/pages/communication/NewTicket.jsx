import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';
import PremiumUpgradeCard from '../../components/communication/PremiumUpgradeCard';
import { CATEGORY_LABEL, PRODUCT_LABEL } from '../../components/communication/TicketCard';

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const SEND_TO_OPTIONS = {
  PRINCIPAL:    'Principal',
  TEACHER:      'Teacher',
  SCHOOL_ADMIN: 'School Admin',
  ERP_SUPPORT:  'ERP Support',
  DEVELOPER:    'Developer',
  SUPER_ADMIN:  'Super Admin',
};

export default function NewTicket() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const prefill   = location.state?.prefill || {};

  const [darkMode] = useState(() => localStorage.getItem('ederp_theme') === 'dark');
  const toggleDark = () => {}; // dark mode toggled from dashboard; kept read-only here for consistency

  const [form, setForm] = useState({
    subject:      prefill.subject      || '',
    description:  prefill.description  || '',
    category:     prefill.category     || 'GENERAL',
    priority:     prefill.priority     || 'MEDIUM',
    product_type: 'EduERP',
    module_name:  '',
    send_to:      'ERP_SUPPORT',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [limitHit,   setLimitHit]   = useState(null);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      setError('Subject likhna zaroori hai');
      return;
    }
    setSubmitting(true);
    setError(null);
    setLimitHit(null);
    try {
      const { data } = await api.post('/support/tickets', form);
      navigate(`/support/tickets/${data.id}`);
    } catch (err) {
      if (err.response?.status === 429 && err.response?.data?.upgrade_cta) {
        setLimitHit(err.response.data.message);
      } else {
        setError(err.response?.data?.error || 'Ticket create nahi hua, dobara try karo');
      }
    }
    setSubmitting(false);
  };

  const cardBg = { background: darkMode ? '#141b2d' : undefined, borderColor: darkMode ? '#1e293b' : undefined };
  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    background: darkMode ? '#0f172a' : '#fff',
    color: darkMode ? '#e2e8f0' : '#0f172a',
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: darkMode ? '#cbd5e1' : '#334155', marginBottom: 6, display: 'block' };

  return (
    <div className={`app-shell${darkMode ? ' theme-dark' : ''}`}>
      <Sidebar darkMode={darkMode} />
      <div className="main-content">
        <Navbar title="New Support Ticket" darkMode={darkMode} onToggleDark={toggleDark} />
        <div className="page-body">

          <div className="page-header">
            <button onClick={() => navigate('/support/tickets')} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
              color: darkMode ? '#94a3b8' : '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 13 }} aria-hidden="true" /> Back to Inbox
            </button>
            <h2 className="page-title">Raise a Support Ticket</h2>
            <p className="page-subtitle">Bug, complaint, feature request — kuch bhi ho, yahan likho</p>
          </div>

          {limitHit && (
            <PremiumUpgradeCard darkMode={darkMode} variant="banner" reason={limitHit} />
          )}

          <div className="card" style={{ maxWidth: 720, ...cardBg }}>
            <form onSubmit={submit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, fontSize: 12.5,
                  background: darkMode ? 'rgba(220,38,38,0.1)' : '#fef2f2', color: '#dc2626',
                }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: 14, marginRight: 6 }} aria-hidden="true" />
                  {error}
                </div>
              )}

              <div>
                <label style={labelStyle}>Subject *</label>
                <input style={inputStyle} value={form.subject}
                  onChange={e => set('subject', e.target.value)}
                  placeholder="e.g. Fee collection page crash ho raha hai" />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Detail mein batao kya issue hai, kab se aa raha hai, kya steps follow kiye..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select className="form-select" style={inputStyle} value={form.category}
                    onChange={e => set('category', e.target.value)}>
                    {Object.entries(CATEGORY_LABEL).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select className="form-select" style={inputStyle} value={form.priority}
                    onChange={e => set('priority', e.target.value)}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Product</label>
                  <select className="form-select" style={inputStyle} value={form.product_type}
                    onChange={e => set('product_type', e.target.value)}>
                    {Object.entries(PRODUCT_LABEL).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Send To</label>
                  <select className="form-select" style={inputStyle} value={form.send_to}
                    onChange={e => set('send_to', e.target.value)}>
                    {Object.entries(SEND_TO_OPTIONS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Module (optional)</label>
                <input style={inputStyle} value={form.module_name}
                  onChange={e => set('module_name', e.target.value)}
                  placeholder="e.g. Fees Management, Attendance, Marks" />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {submitting ? 'Submitting...' : 'Raise Ticket'}
                </button>
                <button type="button" className="btn btn-neutral" onClick={() => navigate('/support/tickets')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      <style>{`
        .theme-dark { background: #0b1220; }
        .theme-dark .main-content { background: #0b1220; }
        .theme-dark .card { background: #141b2d !important; border-color: #1e293b !important; }
        .theme-dark .page-title { color: #f1f5f9 !important; }
        .theme-dark .page-subtitle { color: #94a3b8 !important; }
      `}</style>
    </div>
  );
}
