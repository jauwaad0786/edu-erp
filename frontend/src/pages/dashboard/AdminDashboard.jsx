import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';

const ROLES = ['PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'];

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [schools, setSchools] = useState([]);
  const [users,   setUsers]   = useState([]);
  const [tab,     setTab]     = useState('schools');
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showUserModal,   setShowUserModal]   = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving]   = useState(false);
  const [msg,    setMsg]      = useState('');

  const load = () => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/admin/schools').then(r => setSchools(r.data)).catch(() => {});
    api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const createSchool = async e => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/admin/schools', form);
      setMsg('✅ School created!'); setShowSchoolModal(false); setForm({}); load();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    setSaving(false);
  };

  const createUser = async e => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/admin/users', form);
      setMsg('✅ User created!'); setShowUserModal(false); setForm({}); load();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    setSaving(false);
  };

  const toggleUser = async id => {
    await api.put(`/admin/users/${id}/toggle`);
    load();
  };

  const fmt = n => n?.toLocaleString('en-IN') ?? '—';

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Super Admin — Control Center" />
        <div className="page-body">

          {/* Header */}
          <div className="page-header flex justify-between items-center">
            <div>
              <h2 className="page-title">Control Center</h2>
              <p className="page-subtitle">Manage all schools, access & users across EduERP</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-neutral btn-sm" onClick={() => { setForm({}); setShowUserModal(true); }}>
                + Create User
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setShowSchoolModal(true); }}>
                🏫 Add School
              </button>
            </div>
          </div>

          {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

          {/* Stats */}
          <div className="grid-4 mb-6">
            {[
              { icon: '🏫', label: 'Active Schools',  value: fmt(stats?.total_schools), color: '#0176d3' },
              { icon: '👥', label: 'Total Users',     value: fmt(stats?.total_users),   color: '#5867e8' },
              { icon: '🎒', label: 'Total Students',  value: fmt(stats?.total_students),color: '#2e844a' },
              { icon: '👩‍🏫', label: 'Total Teachers', value: fmt(stats?.total_teachers), color: '#dd7a01' },
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

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--neutral-2)', marginBottom: 20 }}>
            {[['schools', '🏫 Schools'], ['users', '👥 Users']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 20px', fontSize: 13, fontWeight: 600,
                color: tab === k ? 'var(--blue-60)' : 'var(--neutral-6)',
                borderBottom: tab === k ? '2px solid var(--blue-60)' : '2px solid transparent',
                marginBottom: -2,
              }}>{l}</button>
            ))}
          </div>

          {/* Schools Table */}
          {tab === 'schools' && (
            <div className="card">
              <div className="card-header">
                <h4>All Schools ({schools.length})</h4>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Code</th><th>Name</th><th>Type</th><th>City</th><th>Session</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {schools.map(s => (
                      <tr key={s.id}>
                        <td><span className="badge badge-info">{s.code}</span></td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td><span className="badge badge-neutral">{s.type}</span></td>
                        <td style={{ color: 'var(--neutral-6)' }}>{s.city || '—'}</td>
                        <td>{s.current_session}</td>
                        <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-error'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <button className="btn btn-neutral btn-sm">Edit</button>
                        </td>
                      </tr>
                    ))}
                    {!schools.length && (
                      <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--neutral-4)', padding:32 }}>No schools yet. Add one!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Table */}
          {tab === 'users' && (
            <div className="card">
              <div className="card-header">
                <h4>All Users ({users.length})</h4>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>School ID</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar avatar-sm" style={{
                              background: 'var(--blue-10)', color: 'var(--blue-80)',
                              width: 28, height: 28, fontSize: 11,
                            }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--neutral-6)', fontSize: 12 }}>{u.email}</td>
                        <td>
                          <span className={`badge ${
                            u.role === 'SUPER_ADMIN' ? 'badge-error' :
                            u.role === 'PRINCIPAL'   ? 'badge-warning' :
                            u.role === 'TEACHER'     ? 'badge-info' : 'badge-success'
                          }`}>{u.role}</span>
                        </td>
                        <td style={{ color: 'var(--neutral-6)' }}>{u.school_id ?? '—'}</td>
                        <td>
                          <span className={`badge ${u.is_active ? 'badge-success' : 'badge-neutral'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm" onClick={() => toggleUser(u.id)}
                            style={{ background: u.is_active ? '#fef1ee' : '#eaf5ea',
                                     color: u.is_active ? 'var(--error)' : 'var(--success)',
                                     border: 'none', cursor: 'pointer', borderRadius: 4,
                                     padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Add School Modal */}
      {showSchoolModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowSchoolModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>🏫 Add New School</h3>
              <button className="modal-close" onClick={() => setShowSchoolModal(false)}>✕</button>
            </div>
            <form onSubmit={createSchool}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">School Name *</label>
                    <input className="form-input" placeholder="Delhi Public School" required
                      onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">School Code *</label>
                    <input className="form-input" placeholder="DPS001" required
                      onChange={e => setForm(f => ({...f, code: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                      <option value="SCHOOL">School</option>
                      <option value="COLLEGE">College</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session</label>
                    <input className="form-input" placeholder="2024-25"
                      onChange={e => setForm(f => ({...f, current_session: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" placeholder="New Delhi"
                      onChange={e => setForm(f => ({...f, city: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" placeholder="Delhi"
                      onChange={e => setForm(f => ({...f, state: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" placeholder="+91-XXXXX-XXXXX"
                      onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="info@school.edu"
                      onChange={e => setForm(f => ({...f, email: e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="Full address..."
                    onChange={e => setForm(f => ({...f, address: e.target.value}))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-neutral" onClick={() => setShowSchoolModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : '🏫 Create School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showUserModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowUserModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>👤 Create New User</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <form onSubmit={createUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="John Doe" required
                    onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" placeholder="john@school.edu" required
                    onChange={e => setForm(f => ({...f, email: e.target.value}))} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select className="form-select" required
                      onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                      <option value="">Select role</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign School</label>
                    <select className="form-select"
                      onChange={e => setForm(f => ({...f, school_id: e.target.value || null}))}>
                      <option value="">None (Super Admin)</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Leave blank for default: EduErp@123"
                    onChange={e => setForm(f => ({...f, password: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="+91-XXXXX-XXXXX"
                    onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-neutral" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : '👤 Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
