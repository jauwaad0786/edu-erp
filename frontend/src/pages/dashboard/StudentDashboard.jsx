import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';

export default function StudentDashboard() {
  const [profile,    setProfile]    = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [fees,       setFees]       = useState(null);
  const [marks,      setMarks]      = useState([]);
  const [tab,        setTab]        = useState('overview');

  useEffect(() => {
    api.get('/student/profile').then(r => setProfile(r.data)).catch(() => {});
    api.get('/student/attendance').then(r => setAttendance(r.data)).catch(() => {});
    api.get('/student/fees').then(r => setFees(r.data)).catch(() => {});
    api.get('/student/marks').then(r => setMarks(r.data)).catch(() => {});
  }, []);

  const fmt = n => n?.toLocaleString('en-IN') ?? '—';

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Student Portal" />
        <div className="page-body">

          {/* Profile Banner */}
          {profile && (
            <div style={{
              background: 'linear-gradient(135deg, #032d60 0%, #0176d3 100%)',
              borderRadius: 12, padding: '24px 28px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 20, color: '#fff',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800,
              }}>
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ color: '#fff', margin: 0, fontSize: '1.25rem' }}>{profile.name}</h2>
                <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                  {[
                    ['🎟 Roll No', profile.roll_number || 'N/A'],
                    ['📋 Admission', profile.admission_no || 'N/A'],
                    ['📚 Session', profile.session],
                    ['👨‍👩‍👦 Parent', profile.parent_name || 'N/A'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                      <span style={{ opacity: 0.6 }}>{k}: </span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" style={{
                  background: 'rgba(255,255,255,0.15)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)',
                }}>🎟 Admit Card</button>
                <button className="btn btn-sm" style={{
                  background: 'rgba(255,255,255,0.15)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}>📊 Result Card</button>
              </div>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid-4 mb-6">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e8f4fd' }}>📋</div>
              <div className="stat-label">Attendance</div>
              <div className="stat-value" style={{ color: '#0176d3' }}>
                {attendance ? `${attendance.percentage}%` : '—'}
              </div>
              <div className="stat-sub">{attendance ? `${attendance.present}/${attendance.total_days} days` : ''}</div>
              {attendance && (
                <div className="progress-bar" style={{ marginTop: 10 }}>
                  <div className="progress-fill"
                    style={{ width: `${attendance.percentage}%`,
                      background: attendance.percentage >= 75 ? 'var(--success)' : 'var(--error)' }}></div>
                </div>
              )}
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#eaf5ea' }}>💰</div>
              <div className="stat-label">Fees Paid</div>
              <div className="stat-value" style={{ color: '#2e844a' }}>
                ₹{fmt(fees?.total_paid)}
              </div>
              <div className="stat-sub">Balance: ₹{fmt(fees?.balance)}</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f3f0ff' }}>📊</div>
              <div className="stat-label">Subjects</div>
              <div className="stat-value" style={{ color: '#5867e8' }}>
                {[...new Set(marks.map(m => m.subject_id))].length}
              </div>
              <div className="stat-sub">With marks entered</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef5e4' }}>⚠️</div>
              <div className="stat-label">Pending Fees</div>
              <div className="stat-value" style={{ color: '#dd7a01' }}>
                {fees?.records?.filter(r => r.status === 'PENDING').length ?? 0}
              </div>
              <div className="stat-sub">Payments due</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--neutral-2)', marginBottom: 20 }}>
            {[
              ['overview', '🏠 Overview'],
              ['attendance', '📋 Attendance'],
              ['marks', '📊 Results'],
              ['fees', '💰 Fees'],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 18px', fontSize: 13, fontWeight: 600,
                color: tab === key ? 'var(--blue-60)' : 'var(--neutral-6)',
                borderBottom: tab === key ? '2px solid var(--blue-60)' : '2px solid transparent',
                marginBottom: -2,
              }}>{label}</button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'overview' && (
            <div className="grid-2">
              {/* Recent Attendance */}
              <div className="card">
                <div className="card-header"><h4>📋 Recent Attendance</h4></div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {(attendance?.records || []).slice(0, 8).map(r => (
                        <tr key={r.id}>
                          <td>{r.date}</td>
                          <td>
                            <span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : r.status === 'LATE' ? 'badge-warning' : 'badge-error'}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!attendance?.records?.length && (
                        <tr><td colSpan={2} style={{ textAlign:'center', color:'var(--neutral-4)', padding:24 }}>No records yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Marks Summary */}
              <div className="card">
                <div className="card-header"><h4>📊 Latest Marks</h4></div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
                    <tbody>
                      {marks.slice(0, 8).map(m => (
                        <tr key={m.id}>
                          <td>Subject {m.subject_id}</td>
                          <td>{m.marks_obtained}/{m.max_marks}</td>
                          <td><span className={`badge ${m.marks_obtained >= m.max_marks * 0.33 ? 'badge-success' : 'badge-error'}`}>{m.grade}</span></td>
                        </tr>
                      ))}
                      {!marks.length && (
                        <tr><td colSpan={3} style={{ textAlign:'center', color:'var(--neutral-4)', padding:24 }}>No marks yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'attendance' && (
            <div className="card">
              <div className="card-header">
                <h4>📋 Attendance Record</h4>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span className="badge badge-success">Present: {attendance?.present}</span>
                  <span className="badge badge-error">Absent: {attendance?.absent}</span>
                  <span className="badge badge-info">{attendance?.percentage}%</span>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>#</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {(attendance?.records || []).map((r, i) => (
                      <tr key={r.id}>
                        <td style={{ color: 'var(--neutral-6)' }}>{i+1}</td>
                        <td>{r.date}</td>
                        <td><span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : r.status === 'LATE' ? 'badge-warning' : 'badge-error'}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'marks' && (
            <div className="card">
              <div className="card-header"><h4>📊 Academic Results</h4></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Subject</th><th>Exam</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Status</th></tr></thead>
                  <tbody>
                    {marks.map(m => {
                      const pct = Math.round(m.marks_obtained / m.max_marks * 100);
                      return (
                        <tr key={m.id}>
                          <td>Subject {m.subject_id}</td>
                          <td style={{ color: 'var(--neutral-6)' }}>{m.exam_type}</td>
                          <td style={{ fontWeight: 600 }}>{m.marks_obtained}/{m.max_marks}</td>
                          <td>{pct}%</td>
                          <td><span className="badge badge-info">{m.grade}</span></td>
                          <td><span className={`badge ${pct >= 33 ? 'badge-success' : 'badge-error'}`}>{pct >= 33 ? 'PASS' : 'FAIL'}</span></td>
                        </tr>
                      );
                    })}
                    {!marks.length && (
                      <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--neutral-4)', padding:24 }}>No marks entered yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'fees' && (
            <div className="card">
              <div className="card-header">
                <h4>💰 Fee Details</h4>
                <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>Paid: ₹{fmt(fees?.total_paid)}</span>
                  <span style={{ fontWeight: 600, color: 'var(--error)' }}>Due: ₹{fmt(fees?.balance)}</span>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Fee Type</th><th>Month</th><th>Due</th><th>Paid</th><th>Mode</th><th>Status</th></tr></thead>
                  <tbody>
                    {(fees?.records || []).map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{r.fee_type}</td>
                        <td>{r.month}</td>
                        <td>₹{r.amount_due?.toLocaleString('en-IN')}</td>
                        <td>₹{r.amount_paid?.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--neutral-6)' }}>{r.payment_mode || '—'}</td>
                        <td>
                          <span className={`badge ${r.status === 'PAID' ? 'badge-success' : r.status === 'PARTIAL' ? 'badge-warning' : 'badge-error'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!fees?.records?.length && (
                      <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--neutral-4)', padding:24 }}>No fee records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
