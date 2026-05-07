import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api from '../api/axios';

export default function ClassesPage() {
  const [classes,   setClasses]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form,   setForm]   = useState({ section: 'A', session: '2024-25' });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  const load = () => api.get('/principal/classes').then(r => setClasses(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const createClass = async e => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/principal/classes', form);
      setMsg('✅ Class created!'); setShowModal(false); setForm({ section: 'A', session: '2024-25' }); load();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    setSaving(false);
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Classes" />
        <div className="page-body">

          <div className="page-header flex justify-between items-center">
            <div>
              <h2 className="page-title">Classes & Sections</h2>
              <p className="page-subtitle">{classes.length} classes configured</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowModal(true); }}>
              + Add Class
            </button>
          </div>

          {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {classes.map(c => (
              <div className="stat-card" key={c.id} style={{ cursor: 'pointer' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: 'var(--blue-10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 12,
                }}>🏛</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--blue-90)', marginBottom: 4 }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--neutral-6)' }}>Section — {c.section}</div>
                <div style={{ fontSize: 12, color: 'var(--neutral-4)', marginTop: 4 }}>
                  {c.student_count ?? 0} students · {c.session}
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
                  <button className="btn btn-neutral btn-sm">View</button>
                  <button className="btn btn-neutral btn-sm">Edit</button>
                </div>
              </div>
            ))}
            {!classes.length && (
              <div style={{ gridColumn: '1/-1' }}>
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <div className="empty-state-icon">🏛</div>
                      <p>No classes configured. Add your first class!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>🏛 Add New Class</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={createClass}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Class Name *</label>
                    <input className="form-input" required placeholder="e.g. Class 10"
                      onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section</label>
                    <select className="form-select" value={form.section}
                      onChange={e => setForm(f => ({...f, section: e.target.value}))}>
                      {['A','B','C','D','E'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session</label>
                    <input className="form-input" value={form.session}
                      onChange={e => setForm(f => ({...f, session: e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-neutral" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : '🏛 Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
