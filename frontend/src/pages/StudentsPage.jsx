import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api from '../api/axios';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [filter,   setFilter]   = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');

  const load = () => {
    const q = classFilter ? `?class_id=${classFilter}` : '';
    api.get(`/principal/students${q}`).then(r => setStudents(r.data)).catch(() => {});
    api.get('/principal/classes').then(r => setClasses(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [classFilter]);

  const createStudent = async e => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/principal/students', form);
      setMsg('✅ Student added!'); setShowModal(false); setForm({}); load();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    setSaving(false);
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(filter.toLowerCase()) ||
    s.roll_number?.includes(filter) ||
    s.admission_no?.includes(filter)
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Students" />
        <div className="page-body">

          <div className="page-header flex justify-between items-center">
            <div>
              <h2 className="page-title">Students</h2>
              <p className="page-subtitle">{students.length} enrolled this session</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setShowModal(true); }}>
              + Enroll Student
            </button>
          </div>

          {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

          {/* Filters */}
          <div className="card mb-6">
            <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input className="form-input" placeholder="🔍 Search by name, roll no..."
                style={{ maxWidth: 280 }} value={filter}
                onChange={e => setFilter(e.target.value)} />
              <select className="form-select" style={{ maxWidth: 200 }}
                value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
              </select>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--neutral-6)' }}>
                Showing {filtered.length} of {students.length}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th><th>Name</th><th>Admission No</th>
                    <th>Parent</th><th>Contact</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td><span className="badge badge-info">{s.roll_number || '—'}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'var(--blue-10)', color: 'var(--blue-80)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700,
                          }}>{s.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--neutral-6)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--neutral-6)', fontSize: 12 }}>{s.admission_no || '—'}</td>
                      <td style={{ fontSize: 12 }}>{s.parent_name || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--neutral-6)' }}>{s.parent_phone || '—'}</td>
                      <td><span className="badge badge-success">Active</span></td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-state-icon">🎒</div>
                          <p>No students found</p>
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

      {/* Enroll Student Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>🎒 Enroll New Student</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={createStudent}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" required placeholder="Student name"
                      onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" required placeholder="student@school.edu"
                      onChange={e => setForm(f => ({...f, email: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input className="form-input" placeholder="e.g. 101"
                      onChange={e => setForm(f => ({...f, roll_number: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admission No</label>
                    <input className="form-input" placeholder="e.g. ADM2024001"
                      onChange={e => setForm(f => ({...f, admission_no: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class</label>
                    <select className="form-select"
                      onChange={e => setForm(f => ({...f, class_id: e.target.value || null}))}>
                      <option value="">Select class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-select"
                      onChange={e => setForm(f => ({...f, gender: e.target.value}))}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent / Guardian Name</label>
                    <input className="form-input" placeholder="Father/Mother name"
                      onChange={e => setForm(f => ({...f, parent_name: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent Phone</label>
                    <input className="form-input" placeholder="+91-XXXXX-XXXXX"
                      onChange={e => setForm(f => ({...f, parent_phone: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent Email</label>
                    <input className="form-input" type="email" placeholder="parent@email.com"
                      onChange={e => setForm(f => ({...f, parent_email: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session</label>
                    <input className="form-input" defaultValue="2024-25"
                      onChange={e => setForm(f => ({...f, session: e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-neutral" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : '🎒 Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
