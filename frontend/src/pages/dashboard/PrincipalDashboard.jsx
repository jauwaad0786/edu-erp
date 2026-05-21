import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';

function StatCard({ icon, label, value, sub, color = '#0176d3', bg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg || color + '14' }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function PrincipalDashboard() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [classes, setClasses] = useState([]);
  const [fees,    setFees]    = useState(null);
  const [tab,        setTab]        = useState('students');
  const [attClass,   setAttClass]   = useState([]);   // class-wise student att
  const [teacherAtt, setTeacherAtt] = useState(null); // teacher att summary
  const [attFilter,  setAttFilter]  = useState('');

 useEffect(() => {
    Promise.all([
      api.get('/principal/dashboard').catch(() => ({ data: null })),
      api.get('/principal/classes').catch(() => ({ data: [] })),
      api.get('/principal/fees/class-summary').catch(() => ({ data: [] })),
      api.get('/principal/attendance/class-summary').catch(() => ({ data: [] })),
      api.get('/principal/teachers/attendance/today').catch(() => ({ data: null })),
    ]).then(([s, c, f, att, tatt]) => {
      setStats(s.data);
      setClasses(c.data || []);
      setFees(f.data);
      setAttClass(att.data || []);
      setTeacherAtt(tatt.data);
    });
  }, []);

  const fmt = n => n?.toLocaleString('en-IN') ?? '0';

  const fmtK = n => {
    n = Number(n || 0);
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  const collectionPct = fees
    ? Math.round((fees.total_collected / (fees.total_due || 1)) * 100)
    : 0;

  const TABS = [
    { key: 'students', label: '🎒 Class-wise Students' },
    { key: 'fees',     label: '💰 Class-wise Fees' },
  ];

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="School Dashboard" />
        <div className="page-body">

          {/* ── Page Header ── */}
          <div className="page-header flex justify-between items-center">
            <div>
              <h2 className="page-title">School Overview</h2>
              <p className="page-subtitle">Session 2024–25 &nbsp;·&nbsp; Real-time data</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-neutral btn-sm">📥 Export Report</button>
              <button className="btn btn-primary btn-sm"
                onClick={() => navigate('/students')}>
                + Enroll Student
              </button>
            </div>
          </div>

          {/* ── Top Stat Cards ── */}
          <div className="grid-4 mb-6">
            <StatCard icon="🎒" label="Total Students"
              value={fmt(stats?.total_students)}
              sub={`${classes.length} classes active`}
              color="#0176d3" />
            <StatCard icon="👩‍🏫" label="Total Teachers"
              value={fmt(stats?.total_teachers)}
              sub="Active staff"
              color="#5867e8" />
            <StatCard icon="💰" label="Fee Collected"
              value={fmtK(stats?.fee_collected)}
              sub={`${collectionPct}% collection rate`}
              color="#2e844a" />
            <StatCard icon="⚠️" label="Fee Pending"
              value={fmtK(fees ? fees.total_due - fees.total_collected : 0)}
              sub={`${fmt(fees?.pending_count)} pending`}
              color="#dd7a01" />
          </div>
           
          {/* ── Today's Attendance + Teacher Sidebar ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>

            {/* ── Student Attendance Widget ── */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <h4 style={{ margin: 0 }}>🎒 Student Attendance — Today</h4>
                  <span style={{ fontSize: 11, color: 'var(--neutral-5)' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <select
                  className="form-select"
                  style={{ width: 160, fontSize: 12 }}
                  value={attFilter}
                  onChange={e => setAttFilter(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {attClass.map(c => (
                    <option key={c.class_id} value={c.class_id}>
                      {c.class_name} - {c.section}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary Pills */}
              {(() => {
                const rows = attFilter
                  ? attClass.filter(c => String(c.class_id) === String(attFilter))
                  : attClass;
                const totals = rows.reduce(
                  (acc, c) => ({
                    total:   acc.total   + c.total,
                    present: acc.present + c.present,
                    absent:  acc.absent  + c.absent,
                    late:    acc.late    + c.late,
                    unmarked:acc.unmarked+ c.not_marked,
                  }),
                  { total: 0, present: 0, absent: 0, late: 0, unmarked: 0 }
                );
                return (
                  <>
                    <div style={{ display: 'flex', gap: 12, padding: '12px 20px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Total',     value: totals.total,    bg: '#f1f5f9', color: '#0f172a' },
                        { label: 'Present',   value: totals.present,  bg: '#dcfce7', color: '#16a34a' },
                        { label: 'Absent',    value: totals.absent,   bg: '#fee2e2', color: '#dc2626' },
                        { label: 'Late',      value: totals.late,     bg: '#fef3c7', color: '#d97706' },
                        { label: 'Not Marked',value: totals.unmarked, bg: '#f3f4f6', color: '#6b7280' },
                      ].map(p => (
                        <div key={p.label} style={{
                          background: p.bg, borderRadius: 10,
                          padding: '8px 16px', textAlign: 'center', minWidth: 72,
                        }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: p.color }}>{p.value}</div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{p.label}</div>
                        </div>
                      ))}
                      {totals.total > 0 && (
                        <div style={{
                          background: '#eff6ff', borderRadius: 10,
                          padding: '8px 16px', textAlign: 'center', minWidth: 72,
                        }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
                            {Math.round(totals.present / totals.total * 100)}%
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Attendance</div>
                        </div>
                      )}
                    </div>

                    {/* Class-wise rows */}
                    <div style={{ borderTop: '1px solid var(--neutral-2)' }}>
                      {rows.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--neutral-4)', fontSize: 13 }}>
                          Aaj ki attendance mark nahi ki gayi
                        </div>
                      ) : rows.map(c => {
                        const pct = c.total > 0 ? Math.round(c.present / c.total * 100) : 0;
                        return (
                          <div key={c.class_id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 20px', borderBottom: '1px solid var(--neutral-1)',
                          }}>
                            <div style={{ minWidth: 90, fontWeight: 600, fontSize: 13 }}>
                              {c.class_name} <span style={{ color: 'var(--neutral-5)', fontWeight: 400 }}>
                                {c.section}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                              <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                                ✓ {c.present}
                              </span>
                              <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                                ✗ {c.absent}
                              </span>
                              {c.late > 0 && (
                                <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                                  ⏰ {c.late}
                                </span>
                              )}
                            </div>
                            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99 }}>
                              <div style={{
                                width: `${pct}%`, height: '100%', borderRadius: 99,
                                background: pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626',
                                transition: 'width 0.4s',
                              }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, minWidth: 32, color: 'var(--neutral-6)' }}>
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* ── Teacher Availability Sidebar ── */}
            <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <h4 style={{ margin: 0 }}>👩‍🏫 Staff Today</h4>
              </div>

              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 16px' }}>
                {[
                  { label: 'Total',   value: teacherAtt?.total    ?? stats?.total_teachers ?? 0, bg: '#f1f5f9', color: '#0f172a' },
                  { label: 'Present', value: teacherAtt?.present  ?? 0,  bg: '#dcfce7', color: '#16a34a' },
                  { label: 'Absent',  value: (teacherAtt?.absent ?? 0) + (teacherAtt?.on_leave ?? 0),
                    bg: '#fee2e2', color: '#dc2626' },
                ].map(p => (
                  <div key={p.label} style={{
                    background: p.bg, borderRadius: 8,
                    padding: '8px 6px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: p.color }}>{p.value}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{p.label}</div>
                  </div>
                ))}
              </div>

              {/* Absent teachers list */}
              <div style={{
                flex: 1, overflowY: 'auto', maxHeight: 280,
                borderTop: '1px solid var(--neutral-2)',
              }}>
                {!teacherAtt || teacherAtt.absent_list?.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                    {!teacherAtt ? (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        Attendance mark nahi ki gayi abhi
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                        ✅ Sab teachers present hain!
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '8px 16px 4px', fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                      ABSENT / ON LEAVE
                    </div>
                    {teacherAtt.absent_list.map((t, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 16px', borderBottom: '1px solid var(--neutral-1)',
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: t.on_leave ? '#fef3c7' : '#fee2e2',
                          color: t.on_leave ? '#d97706' : '#dc2626',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 12, fontWeight: 700,
                        }}>
                          {t.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{t.designation}</div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: t.on_leave ? '#fef3c7' : '#fee2e2',
                          color: t.on_leave ? '#d97706' : '#dc2626',
                          flexShrink: 0,
                        }}>
                          {t.on_leave ? 'Leave' : 'Absent'}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Not marked warning */}
              {teacherAtt?.not_marked > 0 && (
                <div style={{
                  padding: '8px 16px', borderTop: '1px solid var(--neutral-2)',
                  background: '#fffbeb', fontSize: 11, color: '#92400e',
                }}>
                  ⚠️ {teacherAtt.not_marked} teachers ki attendance mark nahi hui
                </div>
              )}
            </div>
          </div> 




          

          {/* ── Fee Progress Bar ── */}
          {fees && (
            <div className="card mb-6">
              <div className="card-body" style={{ padding: '16px 20px' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 10,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-7)' }}>
                    Overall Fee Collection
                  </span>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                    <span>
                      <span style={{ color: 'var(--neutral-5)' }}>Collected: </span>
                      <strong style={{ color: '#2e844a' }}>₹{fmt(fees.total_collected)}</strong>
                    </span>
                    <span>
                      <span style={{ color: 'var(--neutral-5)' }}>Pending: </span>
                      <strong style={{ color: '#dd7a01' }}>
                        ₹{fmt(fees.total_due - fees.total_collected)}
                      </strong>
                    </span>
                    <strong style={{
                      color: collectionPct >= 70 ? '#2e844a' : '#ba0517',
                      fontSize: 15,
                    }}>{collectionPct}%</strong>
                  </div>
                </div>
                <div className="progress-bar" style={{ height: 10, borderRadius: 99 }}>
                  <div className="progress-fill"
                    style={{
                      width: `${collectionPct}%`, borderRadius: 99,
                      background: collectionPct >= 70 ? '#2e844a'
                        : collectionPct >= 40 ? '#dd7a01' : '#ba0517',
                      transition: 'width 0.6s ease',
                    }} />
                </div>
              </div>
            </div>
          )}

          {/* ── Tabs ── */}
          <div style={{
            display: 'flex', borderBottom: '2px solid var(--neutral-2)',
            marginBottom: 20, gap: 0,
          }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 20px', fontSize: 13, fontWeight: 600,
                color: tab === t.key ? 'var(--blue-60)' : 'var(--neutral-6)',
                borderBottom: tab === t.key
                  ? '2px solid var(--blue-60)' : '2px solid transparent',
                marginBottom: -2, transition: 'color 0.15s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* ══ TAB: Class-wise Students ══ */}
          {tab === 'students' && (
            <div className="card">
              <div className="card-header" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <h4>🎒 Students by Class</h4>
                <span className="badge badge-info">
                  {classes.reduce((a, c) => a + (c.student_count ?? 0), 0)} total
                </span>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Session</th>
                      <th>Students</th>
                      <th>Strength</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((c, i) => {
                      const total = classes.reduce(
                        (a, x) => a + (x.student_count ?? 0), 0
                      ) || 1;
                      const pct = Math.round((c.student_count ?? 0) / total * 100);
                      return (
                        <tr key={c.id}>
                          <td style={{ color: 'var(--neutral-5)', fontSize: 12 }}>{i + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: 'var(--blue-10)',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 14,
                              }}>🏛</div>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-neutral">{c.section}</span>
                          </td>
                          <td style={{ color: 'var(--neutral-6)', fontSize: 12 }}>
                            {c.session}
                          </td>
                          <td>
                            <span style={{
                              background: 'var(--blue-10)', color: 'var(--blue-80)',
                              padding: '3px 12px', borderRadius: 100,
                              fontSize: 13, fontWeight: 700,
                            }}>{c.student_count ?? 0}</span>
                          </td>
                          <td style={{ minWidth: 140 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                flex: 1, height: 6,
                                background: 'var(--neutral-2)', borderRadius: 99,
                              }}>
                                <div style={{
                                  width: `${pct}%`, height: '100%',
                                  background: 'var(--blue-60)', borderRadius: 99,
                                  transition: 'width 0.4s',
                                }} />
                              </div>
                              <span style={{
                                fontSize: 11, color: 'var(--neutral-6)',
                                minWidth: 28, textAlign: 'right',
                              }}>{pct}%</span>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-neutral btn-sm"
                              onClick={() => navigate(`/students?class_id=${c.id}`)}>
                              View Students
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!classes.length && (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty-state">
                            <div className="empty-state-icon">🏛</div>
                            <p>No classes added yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {classes.length > 0 && (
                    <tfoot>
                      <tr style={{ background: 'var(--neutral-1)' }}>
                        <td colSpan={4}
                          style={{ fontWeight: 700, fontSize: 13, padding: '12px 16px' }}>
                          Total
                        </td>
                        <td>
                          <span style={{
                            background: '#032d60', color: '#fff',
                            padding: '3px 12px', borderRadius: 100,
                            fontSize: 13, fontWeight: 700,
                          }}>
                            {classes.reduce((a, c) => a + (c.student_count ?? 0), 0)}
                          </span>
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* ══ TAB: Class-wise Fees ══ */}
          {tab === 'fees' && (
            <div className="card">
              <div className="card-header" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <h4>💰 Fee Collection by Class</h4>
                {fees && (
                  <span className="badge badge-success">
                    {collectionPct}% overall collected
                  </span>
                )}
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Class</th>
                      <th>Students</th>
                      <th>Total Due</th>
                      <th>Collected</th>
                      <th>Pending</th>
                      <th>Collection %</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.length > 0 ? classes.map((c, i) => {
                      const totalStudents = classes.reduce(
                        (a, x) => a + (x.student_count ?? 0), 0
                      ) || 1;
                      const ratio   = (c.student_count ?? 0) / totalStudents;
                      const due     = Math.round((fees?.total_due ?? 0) * ratio);
                      const paid    = Math.round((fees?.total_collected ?? 0) * ratio);
                      const pending = due - paid;
                      const pct     = due > 0 ? Math.round(paid / due * 100) : 0;
                      return (
                        <tr key={c.id}>
                          <td style={{ color: 'var(--neutral-5)', fontSize: 12 }}>{i + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--neutral-5)' }}>
                              Section {c.section}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-info">{c.student_count ?? 0}</span>
                          </td>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>₹{fmt(due)}</td>
                          <td style={{ fontWeight: 600, color: '#2e844a', fontSize: 13 }}>
                            ₹{fmt(paid)}
                          </td>
                          <td style={{
                            fontWeight: 600, fontSize: 13,
                            color: pending > 0 ? '#ba0517' : '#2e844a',
                          }}>
                            {pending > 0 ? `₹${fmt(pending)}` : '✅ Clear'}
                          </td>
                          <td style={{ minWidth: 140 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                flex: 1, height: 8,
                                background: '#fee2e2', borderRadius: 99,
                              }}>
                                <div style={{
                                  width: `${pct}%`, height: '100%', borderRadius: 99,
                                  background: pct >= 80 ? '#2e844a'
                                    : pct >= 50 ? '#dd7a01' : '#ba0517',
                                  transition: 'width 0.4s',
                                }} />
                              </div>
                              <span style={{
                                fontSize: 11, fontWeight: 700,
                                color: pct >= 80 ? '#2e844a'
                                  : pct >= 50 ? '#dd7a01' : '#ba0517',
                                minWidth: 32,
                              }}>{pct}%</span>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm"
                              style={{
                                background: '#eaf5ea', color: '#2e844a',
                                border: 'none', cursor: 'pointer',
                                borderRadius: 4, padding: '4px 10px',
                                fontSize: 11, fontWeight: 700,
                              }}
                              onClick={() => navigate(`/fees?class_id=${c.id}`)}>
                              💸 Collect
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={8}>
                          <div className="empty-state">
                            <div className="empty-state-icon">💰</div>
                            <p>No class data available.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {classes.length > 0 && fees && (
                    <tfoot>
                      <tr style={{ background: 'var(--neutral-1)' }}>
                        <td colSpan={3}
                          style={{ fontWeight: 700, fontSize: 13, padding: '12px 16px' }}>
                          Grand Total
                        </td>
                        <td style={{ fontWeight: 700 }}>₹{fmt(fees.total_due)}</td>
                        <td style={{ fontWeight: 700, color: '#2e844a' }}>
                          ₹{fmt(fees.total_collected)}
                        </td>
                        <td style={{ fontWeight: 700, color: '#ba0517' }}>
                          ₹{fmt(fees.total_due - fees.total_collected)}
                        </td>
                        <td>
                          <strong style={{
                            color: collectionPct >= 70 ? '#2e844a' : '#ba0517',
                          }}>{collectionPct}%</strong>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
