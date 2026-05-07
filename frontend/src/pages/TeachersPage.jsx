import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api from '../api/axios';

export default function TeachersPage() {
  const [teachers,  setTeachers]  = useState([]);
  const [filter,    setFilter]    = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  const load = () => api.get('/principal/teachers').then(r => setTeachers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const createTeacher = async e => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/principal/teachers', form);
      setMsg('✅ Teacher added!'); setShowModal(false); setForm({}); load();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    setSaving(false);
  };

  const filtered = teachers.filter(t =>
    t.name?.toLowerCase().includes(filter.toLowerCase()) ||
    t.employee_id?.includes(filter) ||
    t.department?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Teachers" />
        <div className="page-body">

          <div className="page-header flex justify-between items-center">
            <div>
              <h2 className="page-title">Teaching Staff</h2>
              <p className="page-subtitle">{teachers.length} staff members</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setShowModal(true); }}>
              + Add Teacher
            </button>
          </div>

          {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

          <div className="card mb-4">
            <div className="card-body">
              <input className="form-input" placeholder="🔍 Search by name, employee ID, department..."
                style={{ maxWidth: 360 }} value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
          </div>

          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Employee ID</th><th>Name</th><th>Department</th><th>Designation</th><th>Email</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id}>
                      <td><span className="badge badge-info">{t.employee_id || '—'}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: '#f3f0ff', color: '#5867e8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700,
                          }}>{t.name?.charAt(0).toUpperCase()}</div>
                          <span style={{ fontWeight: 600 }}>{t.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--neutral-6)' }}>{t.department || '—'}</td>
                      <td>
                        <span className="badge badge-neutral">{t.designation}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--neutral-6)' }}>{t.email}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-neutral btn-sm">Edit</button>
                          <button className="btn btn-sm" style={{
                            background: '#fef1ee', color: 'var(--error)',
                            border: 'none', cursor: 'pointer', borderRadius: 4,
                            padding: '4px 10px', fontSize: 11, fontWeight: 700,
                          }}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-state-icon">👩‍🏫</div>
                          <p>No teachers yet. Add your first teacher!</p>
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

      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>👩‍🏫 Add New Teacher</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={createTeacher}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" required placeholder="Teacher name"
                      onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" required placeholder="teacher@school.edu"
                      onChange={e => setForm(f => ({...f, email: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input className="form-input" placeholder="EMP001"
                      onChange={e => setForm(f => ({...f, employee_id: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" placeholder="+91-XXXXX-XXXXX"
                      onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" placeholder="e.g. Mathematics"
                      onChange={e => setForm(f => ({...f, department: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <select className="form-select"
                      onChange={e => setForm(f => ({...f, designation: e.target.value}))}>
                      <option value="Teacher">Teacher</option>
                      <option value="Senior Teacher">Senior Teacher</option>
                      <option value="HOD">HOD</option>
                      <option value="Vice Principal">Vice Principal</option>
                    </select>
                  </div>
                </div>
                <div className="alert alert-info" style={{ marginTop: 0 }}>
                  ℹ️ Default password: <strong>Teacher@123</strong>. Ask teacher to change after first login.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-neutral" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding...' : '👩‍🏫 Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
