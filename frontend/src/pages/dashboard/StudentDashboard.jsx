import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';

export default function StudentDashboard() {
  const [profile,      setProfile]      = useState(null);
  const [attendance,   setAttendance]   = useState(null);
  const [fees,         setFees]         = useState(null);
  const [marks,        setMarks]        = useState([]);
  const [tab,          setTab]          = useState('overview');
  const [exams,        setExams]        = useState([]);
  const [examModal,    setExamModal]    = useState(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [holidays,     setHolidays]     = useState([]);
  const [notes,        setNotes]        = useState([]);

  useEffect(() => {
    api.get('/student/profile').then(r => setProfile(r.data)).catch(() => {});
    api.get('/student/attendance').then(r => setAttendance(r.data)).catch(() => {});
    api.get('/student/fees').then(r => setFees(r.data)).catch(() => {});
    api.get('/student/marks').then(r => setMarks(r.data)).catch(() => {});
    api.get('/principal/exams?status=PUBLISHED').then(r => setExams(r.data || [])).catch(() => {});
    api.get('/principal/holidays').then(r => setHolidays(r.data || [])).catch(() => {});
    api.get('/teacher/notes').then(r => setNotes(r.data || [])).catch(() => {});
  }, []);

  const fmt = n => n?.toLocaleString('en-IN') ?? '—';
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Student Portal" />
        <div className="page-body">

          {/* ── Profile Banner ── */}
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
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt="photo"
                    style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                ) : profile.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ color: '#fff', margin: 0, fontSize: '1.25rem' }}>{profile.name}</h2>
                <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                  {[
                    ['🎟 Roll No',    profile.roll_number  || 'N/A'],
                    ['📋 Admission',  profile.admission_no || 'N/A'],
                    ['📚 Session',    profile.session],
                    ['👨‍👩‍👦 Parent', profile.parent_name  || 'N/A'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                      <span style={{ opacity: 0.6 }}>{k}: </span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
                  onClick={() => { setExamModal('admit'); setSelectedExam(''); }}
                >🎟 Admit Card</button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
                  onClick={() => { setExamModal('result'); setSelectedExam(''); }}
                >📊 Result Card</button>
              </div>
            </div>
          )}

          {/* ── Stat Cards ── */}
          <div className="grid-4 mb-6">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e8f4fd' }}>📋</div>
              <div className="stat-label">Attendance</div>
              <div className="stat-value" style={{ color: '#0176d3' }}>
                {attendance ? `${attendance.percentage}%` : '—'}
              </div>
              <div className="stat-sub">
                {attendance ? `${attendance.present}/${attendance.total_days} days` : ''}
              </div>
              {attendance && (
                <div className="progress-bar" style={{ marginTop: 10 }}>
                  <div className="progress-fill" style={{
                    width: `${attendance.percentage}%`,
                    background: attendance.percentage >= 75 ? 'var(--success)' : 'var(--error)',
                  }} />
                </div>
              )}
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#eaf5ea' }}>💰</div>
              <div className="stat-label">Fees Paid</div>
              <div className="stat-value" style={{ color: '#2e844a' }}>₹{fmt(fees?.total_paid)}</div>
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

          {/* ── Tabs ── */}
          <div style={{
            display: 'flex', gap: 0,
            borderBottom: '2px solid var(--neutral-2)', marginBottom: 20,
            overflowX: 'auto',
          }}>
            {[
              ['overview',   '🏠 Overview'],
              ['attendance', '📋 Attendance'],
              ['marks',      '📊 Results'],
              ['fees',       '💰 Fees'],
              ['notes',      '📚 Notes'],
              ['holidays',   '🗓 Holidays'],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 18px', fontSize: 13, fontWeight: 600,
                color: tab === key ? 'var(--blue-60)' : 'var(--neutral-6)',
                borderBottom: tab === key ? '2px solid var(--blue-60)' : '2px solid transparent',
                marginBottom: -2, whiteSpace: 'nowrap',
              }}>{label}</button>
            ))}
          </div>

          {/* ══ TAB: OVERVIEW ══ */}
          {tab === 'overview' && (
            <>
              <div className="grid-2">
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
                              <span className={`badge ${
                                r.status === 'PRESENT' ? 'badge-success' :
                                r.status === 'LATE'    ? 'badge-warning' : 'badge-error'
                              }`}>{r.status}</span>
                            </td>
                          </tr>
                        ))}
                        {!attendance?.records?.length && (
                          <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--neutral-4)', padding: 24 }}>No records yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h4>📊 Latest Marks</h4></div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
                      <tbody>
                        {marks.slice(0, 8).map(m => (
                          <tr key={m.id}>
                            <td>{m.subject_name || `Subject ${m.subject_id}`}</td>
                            <td>{m.marks_obtained}/{m.max_marks}</td>
                            <td>
                              <span className={`badge ${
                                m.marks_obtained >= m.max_marks * 0.33 ? 'badge-success' : 'badge-error'
                              }`}>{m.grade}</span>
                            </td>
                          </tr>
                        ))}
                        {!marks.length && (
                          <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--neutral-4)', padding: 24 }}>No marks yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ── Upcoming Holidays Widget ── */}
              {(() => {
                const upcoming = holidays
                  .filter(h => h.date >= today)
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .slice(0, 5);
                const todayHoliday = holidays.find(h => h.date === today);
                return (
                  <div className="card mt-6">
                    <div className="card-header">
                      <h4>🗓 Upcoming Holidays</h4>
                      {todayHoliday && (
                        <span style={{
                          background: '#fef5e4', color: '#dd7a01',
                          fontSize: 11, fontWeight: 700,
                          padding: '3px 10px', borderRadius: 20,
                        }}>🎉 Aaj {todayHoliday.title} hai!</span>
                      )}
                    </div>
                    {upcoming.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--neutral-6)', fontSize: 13 }}>
                        Koi upcoming holiday nahi hai
                      </div>
                    ) : (
                      <div>
                        {upcoming.map((h, i) => {
                          const isToday = h.date === today;
                          return (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 14,
                              padding: '12px 20px',
                              borderBottom: '1px solid var(--neutral-1)',
                              background: isToday ? '#fffbeb' : 'transparent',
                            }}>
                              <div style={{
                                minWidth: 44, textAlign: 'center',
                                background: '#f3f0ff', borderRadius: 8, padding: '6px 4px',
                              }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#5867e8', lineHeight: 1 }}>
                                  {h.date?.split('-')[2]}
                                </div>
                                <div style={{ fontSize: 9, fontWeight: 600, color: '#5867e8', textTransform: 'uppercase' }}>
                                  {new Date(h.date).toLocaleString('en-IN', { month: 'short' })}
                                </div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>
                                  {h.title}
                                  {isToday && (
                                    <span style={{
                                      marginLeft: 8, fontSize: 9, fontWeight: 700,
                                      background: '#fde68a', color: '#92400e',
                                      padding: '1px 6px', borderRadius: 20,
                                    }}>TODAY</span>
                                  )}
                                </div>
                                {h.description && (
                                  <div style={{ fontSize: 11, color: 'var(--neutral-6)', marginTop: 2 }}>
                                    {h.description}
                                  </div>
                                )}
                              </div>
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                borderRadius: 20, background: '#f1f5f9', color: '#64748b', flexShrink: 0,
                              }}>{h.holiday_type}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}

          {/* ══ TAB: ATTENDANCE ══ */}
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
                        <td style={{ color: 'var(--neutral-6)' }}>{i + 1}</td>
                        <td>{r.date}</td>
                        <td>
                          <span className={`badge ${
                            r.status === 'PRESENT' ? 'badge-success' :
                            r.status === 'LATE'    ? 'badge-warning' : 'badge-error'
                          }`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                    {!attendance?.records?.length && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--neutral-4)', padding: 24 }}>No attendance records yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ TAB: MARKS ══ */}
          {tab === 'marks' && (
            <div className="card">
              <div className="card-header"><h4>📊 Academic Results</h4></div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th><th>Exam</th><th>Marks</th>
                      <th>Percentage</th><th>Grade</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map(m => {
                      const pct = Math.round(m.marks_obtained / m.max_marks * 100);
                      return (
                        <tr key={m.id}>
                          <td>{m.subject_name || `Subject ${m.subject_id}`}</td>
                          <td style={{ color: 'var(--neutral-6)' }}>{m.exam_type}</td>
                          <td style={{ fontWeight: 600 }}>{m.marks_obtained}/{m.max_marks}</td>
                          <td>{pct}%</td>
                          <td><span className="badge badge-info">{m.grade}</span></td>
                          <td>
                            <span className={`badge ${pct >= 33 ? 'badge-success' : 'badge-error'}`}>
                              {pct >= 33 ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {!marks.length && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--neutral-4)', padding: 24 }}>No marks entered yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ TAB: FEES ══ */}
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
                  <thead>
                    <tr>
                      <th>Fee Type</th><th>Month</th><th>Due</th>
                      <th>Paid</th><th>Mode</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(fees?.records || []).map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{r.fee_type}</td>
                        <td>{r.month}</td>
                        <td>₹{r.amount_due?.toLocaleString('en-IN')}</td>
                        <td>₹{r.amount_paid?.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--neutral-6)' }}>{r.payment_mode || '—'}</td>
                        <td>
                          <span className={`badge ${
                            r.status === 'PAID'    ? 'badge-success' :
                            r.status === 'PARTIAL' ? 'badge-warning' : 'badge-error'
                          }`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                    {!fees?.records?.length && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--neutral-4)', padding: 24 }}>No fee records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ TAB: NOTES ══ */}
          {tab === 'notes' && (
            <div>
              {notes.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <p>Abhi tak koi note upload nahi hua</p>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}>
                  {notes.map(n => {
                    const ext = n.file_name?.split('.').pop()?.toLowerCase() || '';
                    const iconMap = {
                      pdf:  { icon: '📄', color: '#ba0517', bg: '#fef1ee' },
                      doc:  { icon: '📝', color: '#0176d3', bg: '#e8f4fd' },
                      docx: { icon: '📝', color: '#0176d3', bg: '#e8f4fd' },
                      ppt:  { icon: '📊', color: '#dd7a01', bg: '#fef5e4' },
                      pptx: { icon: '📊', color: '#dd7a01', bg: '#fef5e4' },
                      png:  { icon: '🖼️', color: '#2e844a', bg: '#eaf5ea' },
                      jpg:  { icon: '🖼️', color: '#2e844a', bg: '#eaf5ea' },
                    };
                    const info = iconMap[ext] || { icon: '📁', color: '#747474', bg: '#f1f1f1' };
                    return (
                      <div key={n.id} className="card">
                        <div className="card-body" style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: 8,
                              background: info.bg, color: info.color,
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 20, flexShrink: 0,
                            }}>{info.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 14, fontWeight: 700, marginBottom: 4,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>{n.title}</div>
                              {n.description && (
                                <div style={{ fontSize: 12, color: 'var(--neutral-6)', marginBottom: 6 }}>
                                  {n.description}
                                </div>
                              )}
                              <div style={{ fontSize: 11, color: 'var(--neutral-6)' }}>
                                🕒 {new Date(n.uploaded_at).toLocaleDateString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="card-footer" style={{
                          display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '10px 16px',
                        }}>
                          {n.file_url && (
                            <a href={n.file_url} target="_blank" rel="noreferrer"
                              className="btn btn-primary btn-sm">👁️ View</a>
                          )}
                          {n.file_url && (
                            <a href={n.file_url} download={n.file_name}
                              className="btn btn-neutral btn-sm">⬇️ Download</a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: HOLIDAYS ══ */}
          {tab === 'holidays' && (
            <div className="card" style={{ maxWidth: 680 }}>
              <div className="card-header">
                <h4>🗓 Holiday Calendar</h4>
                <span style={{
                  background: 'var(--blue-10)', color: 'var(--blue-80)',
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                }}>{holidays.length} holidays</span>
              </div>
              {holidays.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <p>Koi holiday scheduled nahi hai</p>
                </div>
              ) : (
                <div>
                  {holidays
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((h, i) => {
                      const isToday = h.date === today;
                      const isPast  = h.date < today;
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 20px',
                          borderBottom: '1px solid var(--neutral-1)',
                          background: isToday ? '#fffbeb' : 'transparent',
                          opacity: isPast ? 0.6 : 1,
                        }}>
                          <div style={{
                            minWidth: 48, textAlign: 'center',
                            background: isPast ? '#f1f1f1' : '#f3f0ff',
                            borderRadius: 8, padding: '8px 4px',
                          }}>
                            <div style={{
                              fontSize: 18, fontWeight: 800, lineHeight: 1,
                              color: isPast ? '#999' : '#5867e8',
                            }}>{h.date?.split('-')[2]}</div>
                            <div style={{
                              fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                              color: isPast ? '#999' : '#5867e8',
                            }}>
                              {new Date(h.date).toLocaleString('en-IN', { month: 'short' })}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {h.title}
                              {isToday && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700,
                                  background: '#fde68a', color: '#92400e',
                                  padding: '1px 6px', borderRadius: 20,
                                }}>TODAY</span>
                              )}
                              {isPast && (
                                <span style={{
                                  fontSize: 9, background: '#f1f1f1', color: '#999',
                                  padding: '1px 6px', borderRadius: 20,
                                }}>Past</span>
                              )}
                            </div>
                            {h.description && (
                              <div style={{ fontSize: 11, color: 'var(--neutral-6)', marginTop: 2 }}>
                                {h.description}
                              </div>
                            )}
                            <div style={{ fontSize: 10, color: 'var(--neutral-6)', marginTop: 3 }}>
                              👥 {h.applies_to} &nbsp;·&nbsp; {h.holiday_type}
                            </div>
                          </div>
                          {h.end_date && h.end_date !== h.date && (
                            <div style={{ fontSize: 11, color: 'var(--neutral-6)', flexShrink: 0 }}>
                              Till {h.end_date}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ══ EXAM MODAL ══ */}
          {examModal && (
            <div
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
              }}
              onClick={e => e.target === e.currentTarget && setExamModal(null)}
            >
              <div style={{
                background: '#fff', borderRadius: 12, padding: 28,
                width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#0f172a' }}>
                  {examModal === 'admit' ? '🎟 Download Admit Card' : '📊 Download Result Card'}
                </h3>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
                    Select Exam
                  </label>
                  <select
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                    value={selectedExam}
                    onChange={e => setSelectedExam(e.target.value)}
                  >
                    <option value="">-- Select Exam --</option>
                    {exams.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.exam_name}</option>
                    ))}
                  </select>
                </div>
                {exams.length === 0 && (
                  <p style={{ fontSize: 12, color: '#f59e0b', marginBottom: 12 }}>
                    ⚠️ No published exam available right now
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setExamModal(null)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 13 }}
                  >Cancel</button>
                  <button
                    disabled={!selectedExam}
                    onClick={() => {
                      if (!selectedExam || !profile) return;
                      const url = examModal === 'admit'
                        ? `/api/principal/admit-card/${profile.id}/${selectedExam}`
                        : `/api/principal/result-card/${profile.id}/${selectedExam}`;
                      window.open(`${process.env.REACT_APP_API_URL}${url}`, '_blank');
                      setExamModal(null);
                    }}
                    style={{
                      padding: '8px 20px', borderRadius: 8, border: 'none',
                      background: selectedExam ? '#0176d3' : '#94a3b8',
                      color: '#fff', cursor: selectedExam ? 'pointer' : 'default',
                      fontSize: 13, fontWeight: 600,
                    }}
                  >📥 Download PDF</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
