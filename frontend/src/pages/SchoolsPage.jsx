
// frontend/src/pages/SchoolsPage.jsx — NEW FILE

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api     from '../api/axios';

export default function SchoolsPage() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');

  // Edit modal
  const [showEdit,  setShowEdit]  = useState(false);
  const [editSchool,setEditSchool]= useState(null);
  const [form,      setForm]      = useState({});
  const [saving,    setSaving]    = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/schools')
      .then(r => setSchools(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleSchool = async id => {
    await api.put(`/admin/schools/${id}/toggle`);
    load();
  };

  const openEdit = s => {
    setEditSchool(s);
    setForm({ ...s });
    setShowEdit(true);
  };

  const saveEdit = async e => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.put(`/admin/schools/${editSchool.id}`, form);
      setMsg('✅ School updated!');
      setShowEdit(false); load();
    } catch {
      setMsg('❌ Error saving');
    }
    setSaving(false);
  };

  const fmt = n => Number(n || 0).toLocaleString('en-IN');

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Schools" />
        <div className="page-body">

          {/* Header */}
          <div className="page-header flex justify-between items-center">
            <div>
              <h2 className="page-title">All Schools</h2>
              <p className="page-subtitle">View and manage all registered schools</p>
            </div>
            <button className="btn btn-primary btn-sm"
              onClick={() => navigate('/dashboard')}>
              + Add School
            </button>
          </div>

          {msg && (
            <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}
              style={{ marginBottom: 16 }}>
              {msg}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid-4 mb-6">
            {[
              { icon: '🏫', label: 'Total Schools',   value: schools.length,                                color: '#0176d3' },
              { icon: '🟢', label: 'Active',           value: schools.filter(s => s.is_active).length,      color: '#059669' },
              { icon: '🔴', label: 'Inactive',         value: schools.filter(s => !s.is_active).length,     color: '#dc2626' },
              { icon: '✅', label: 'Service Paid',     value: schools.filter(s => s.paid_this_month).length, color: '#7c3aed' },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon" style={{ background: s.color + '14' }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                </div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card">
            <div className="card-header">
              <h4>Schools ({schools.length})</h4>
            </div>
            <div className="table-container">
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Loading...
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>City</th>
                      <th>Session</th>
                      <th>Students</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map(s => (
                      <tr key={s.id}>
                        <td>
                          <span className="badge badge-info">{s.code}</span>
                        </td>
                        <td>
                          <span
                            onClick={() => navigate(`/schools/${s.id}`)}
                            style={{
                              fontWeight: 600, color: 'var(--blue-60)',
                              cursor: 'pointer',
                              borderBottom: '1px dashed var(--blue-30)',
                            }}
                            onMouseEnter={e => e.target.style.color = 'var(--blue-80)'}
                            onMouseLeave={e => e.target.style.color = 'var(--blue-60)'}
                          >
                            {s.name}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-neutral">{s.type}</span>
                        </td>
                        <td style={{ color: 'var(--neutral-6)' }}>{s.city || '—'}</td>
                        <td>{s.current_session}</td>
                        <td>
                          <span style={{
                            background: '#dbeafe', color: '#1d4ed8',
                            padding: '3px 10px', borderRadius: 20,
                            fontSize: 12, fontWeight: 600,
                          }}>
                            {fmt(s.total_students)}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            padding: '3px 10px', borderRadius: 20,
                            background: s.paid_this_month ? '#dcfce7' : '#fee2e2',
                            color:      s.paid_this_month ? '#16a34a' : '#dc2626',
                          }}>
                            {s.paid_this_month ? '✅ Paid' : '⏳ Due'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${s.is_active ? 'badge-success' : 'badge-error'}`}>
                            {s.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-neutral btn-sm"
                              onClick={() => navigate(`/schools/${s.id}`)}>
                              View
                            </button>
                            <button
                              className="btn btn-neutral btn-sm"
                              onClick={() => openEdit(s)}>
                              Edit
                            </button>
                            <button
                              className="btn btn-sm"
                              onClick={() => toggleSchool(s.id)}
                              style={{
                                background: s.is_active ? '#fef1ee' : '#eaf5ea',
                                color:      s.is_active ? 'var(--error)' : 'var(--success)',
                                border: 'none', cursor: 'pointer', borderRadius: 4,
                                padding: '4px 10px', fontSize: 11, fontWeight: 700,
                              }}>
                              {s.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!schools.length && (
                      <tr>
                        <td colSpan={9} style={{
                          textAlign: 'center', color: 'var(--neutral-4)', padding: 40,
                        }}>
                          No schools yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Edit Modal ── */}
      {showEdit && editSchool && (
        <div className="modal-backdrop"
          onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>✏️ Edit — {editSchool.name}</h3>
              <button className="modal-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <form onSubmit={saveEdit}>
              <div className="modal-body">
                <div className="grid-2">
                  {[
                    ['name',            'School Name *', 'text',  true],
                    ['city',            'City',          'text',  false],
                    ['state',           'State',         'text',  false],
                    ['phone',           'Phone',         'text',  false],
                    ['email',           'Email',         'email', false],
                    ['current_session', 'Session',       'text',  false],
                  ].map(([field, label, type, req]) => (
                    <div className="form-group" key={field}>
                      <label className="form-label">{label}</label>
                      <input className="form-input" type={type} required={req}
                        value={form[field] || ''}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input"
                    value={form.address || ''}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-neutral"
                  onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
