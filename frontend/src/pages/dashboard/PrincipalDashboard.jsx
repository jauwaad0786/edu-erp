import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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
  const [attClass,   setAttClass]   = useState([]);   // class-wise student att
  const [teacherAtt, setTeacherAtt] = useState(null); // teacher att summary
  const [attFilter,  setAttFilter]  = useState('');
  const [weeklyData,    setWeeklyData]    = useState(null);
  const [chartTab,      setChartTab]      = useState('student');
  const [pendingReqs, setPendingReqs] = useState([]);
  const [approving,   setApproving]   = useState(null);

 useEffect(() => {
    Promise.all([
      api.get('/principal/dashboard').catch(() => ({ data: null })),
      api.get('/principal/classes').catch(() => ({ data: [] })),
      api.get('/principal/fees/class-summary').catch(() => ({ data: [] })),
      api.get('/principal/attendance/class-summary').catch(() => ({ data: [] })),
      api.get('/principal/teachers/attendance/today').catch(() => ({ data: null })),
      api.get('/principal/teachers/attendance/requests?approval=PENDING').catch(() => ({ data: [] })),
      api.get('/principal/attendance/weekly').catch(() => ({ data: null })),
    ]).then(([s, c, f, att, tatt, reqs, weekly]) => {
      setPendingReqs(reqs.data || []);
      setStats(s.data);
      setClasses(c.data || []);
      setFees(f.data);
      setAttClass(att.data || []);
      setTeacherAtt(tatt.data);
      setWeeklyData(weekly.data);
    });
    
      
  }, []);

  const fmt = n => n?.toLocaleString('en-IN') ?? '0';

  const fmtK = n => {
    n = Number(n || 0);
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  const feeTotals = Array.isArray(fees) ? {
    total_due:       fees.reduce((a, c) => a + (c.total_due       || 0), 0),
    total_collected: fees.reduce((a, c) => a + (c.total_collected || 0), 0),
    pending_count:   fees.filter(c => c.pending > 0).length,
  } : (fees || { total_due: 0, total_collected: 0, pending_count: 0 });

  const collectionPct = feeTotals.total_due > 0
    ? Math.round(feeTotals.total_collected / feeTotals.total_due * 100)
    : 0;

  

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
              <button className="btn btn-neutral btn-sm" onClick={() => {
                const rows = [
                  ['Metric', 'Value'],
                  ['Total Students', stats?.total_students ?? 0],
                  ['Total Teachers', stats?.total_teachers ?? 0],
                  ['Fee Collected', feeTotals.total_collected],
                  ['Fee Pending', feeTotals.total_due - feeTotals.total_collected],
                  ['Collection Rate', collectionPct + '%'],
                  ['Students Present Today', stats?.students_present ?? 0],
                  ['Teachers Present Today', stats?.teachers_present ?? 0],
                ];
                const csv = rows.map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `EduERP_Report_${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}>📥 Export Report</button>
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
              value={fmtK(feeTotals.total_collected)}
              sub={`${collectionPct}% collection rate`}
              color="#2e844a" />
            <StatCard icon="⚠️" label="Fee Pending"
              value={fmtK(feeTotals.total_due - feeTotals.total_collected)}
              sub={`${fmt(feeTotals.pending_count)} pending`}
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
          
          {/* ── Teacher Attendance Approval ── */}
          {pendingReqs.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h4 style={{ margin:0 }}>🙋 Teacher Attendance — Approval Pending</h4>
                <span style={{
                  background:'#fee2e2', color:'#dc2626',
                  padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700,
                }}>{pendingReqs.length} pending</span>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Teacher</th><th>Date</th><th>Status</th>
                      <th>Check In</th><th>Check Out</th><th>Remarks</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReqs.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:13 }}>{r.teacher_name}</div>
                          <div style={{ fontSize:11, color:'var(--neutral-5)' }}>{r.designation}</div>
                        </td>
                        <td style={{ fontSize:12 }}>{r.date}</td>
                        <td>
                          <span style={{
                            padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                            background: r.status==='PRESENT'?'#dcfce7':r.status==='ABSENT'?'#fee2e2':'#fef3c7',
                            color:      r.status==='PRESENT'?'#16a34a':r.status==='ABSENT'?'#dc2626':'#d97706',
                          }}>{r.status}</span>
                        </td>
                        <td style={{ fontSize:12 }}>{r.check_in || '—'}</td>
                        <td style={{ fontSize:12 }}>{r.check_out || '—'}</td>
                        <td style={{ fontSize:12, color:'var(--neutral-6)' }}>{r.remarks || '—'}</td>
                        <td>
                          <div style={{ display:'flex', gap:6 }}>
                            <button
                              disabled={approving === r.id}
                              onClick={async () => {
                                setApproving(r.id);
                                try {
                                  await api.post(`/principal/teachers/attendance/requests/${r.id}/approve`);
                                  setPendingReqs(prev => prev.filter(x => x.id !== r.id));
                                } catch {
                                  alert('Approve nahi hua, dobara try karo');
                                }
                                setApproving(null);
                              }}
                              style={{
                                background:'#f0fdf4', color:'#16a34a', border:'none',
                                borderRadius:6, padding:'5px 12px', fontSize:11,
                                fontWeight:700, cursor:'pointer',
                              }}>✅ Approve</button>
                            <button
                              disabled={approving === r.id}
                              onClick={async () => {
                                setApproving(r.id);
                                try {
                                  await api.post(`/principal/teachers/attendance/requests/${r.id}/deny`);
                                  setPendingReqs(prev => prev.filter(x => x.id !== r.id));
                                } catch {
                                  alert('Deny nahi hua, dobara try karo');
                                }
                                setApproving(null);
                              }}
                              style={{
                                background:'#fef2f2', color:'#dc2626', border:'none',
                                borderRadius:6, padding:'5px 12px', fontSize:11,
                                fontWeight:700, cursor:'pointer',
                              }}>❌ Deny</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          

         {feeTotals.total_due >= 0 && (
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
                      <strong style={{ color: '#2e844a' }}>₹{fmt(feeTotals.total_collected)}</strong>
                    </span>
                    <span>
                      <span style={{ color: 'var(--neutral-5)' }}>Pending: </span>
                      <strong style={{ color: '#dd7a01' }}>
                        ₹{fmt(feeTotals.total_due - feeTotals.total_collected)}
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
          
          {/* ══ TAB: Class-wise Students ══ */}
          {/* ── Attendance Charts ── */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:0 }}>
                {[
                  { key:'student', label:'🎒 Student Attendance' },
                  { key:'teacher', label:'👩‍🏫 Teacher Attendance' },
                ].map(t => (
                  <button key={t.key} onClick={() => setChartTab(t.key)} style={{
                    background:'none', border:'none', cursor:'pointer',
                    padding:'8px 18px', fontSize:13, fontWeight:700,
                    color: chartTab===t.key ? '#0176d3' : 'var(--neutral-5)',
                    borderBottom: chartTab===t.key ? '2px solid #0176d3' : '2px solid transparent',
                  }}>{t.label}</button>
                ))}
              </div>
              {chartTab === 'student' && (
                <select className="form-select" style={{ width:160, fontSize:12 }}
                  value={attFilter} onChange={e => setAttFilter(e.target.value)}>
                  <option value="">All Classes</option>
                  {(weeklyData?.class_today || []).map(c => (
                    <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>

              {/* LEFT: Today class-wise OR filtered */}
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--neutral-7)', marginBottom:12 }}>
                  {chartTab==='student' ? '📊 Today — Class-wise' : '📊 Today — Teacher Status'}
                </div>

                {chartTab === 'student' ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={attFilter
                        ? (weeklyData?.class_today||[]).filter(c=>String(c.class_id)===String(attFilter))
                        : (weeklyData?.class_today||[])
                      }
                      margin={{ top:5, right:10, left:-10, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="class_name" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
                      <Legend wrapperStyle={{ fontSize:12 }} />
                      <Bar dataKey="total"   name="Total"   fill="#93c5fd" radius={[4,4,0,0]} />
                      <Bar dataKey="present" name="Present" fill="#4ade80" radius={[4,4,0,0]} />
                      <Bar dataKey="absent"  name="Absent"  fill="#f87171" radius={[4,4,0,0]} />
                      <Bar dataKey="late"    name="Late"    fill="#fbbf24" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={[{
                        name: 'Today',
                        Total:   teacherAtt?.total   ?? 0,
                        Present: teacherAtt?.present ?? 0,
                        Absent:  (teacherAtt?.absent??0)+(teacherAtt?.on_leave??0),
                        'Half Day': teacherAtt?.half_day ?? 0,
                      }]}
                      margin={{ top:5, right:10, left:-10, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
                      <Legend wrapperStyle={{ fontSize:12 }} />
                      <Bar dataKey="Total"    fill="#93c5fd" radius={[4,4,0,0]} />
                      <Bar dataKey="Present"  fill="#4ade80" radius={[4,4,0,0]} />
                      <Bar dataKey="Absent"   fill="#f87171" radius={[4,4,0,0]} />
                      <Bar dataKey="Half Day" fill="#fbbf24" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* RIGHT: Weekly comparison */}
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--neutral-7)', marginBottom:12 }}>
                  📅 Last 7 Days — Daily Comparison
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={chartTab==='student'
                      ? (weeklyData?.student_weekly||[])
                      : (weeklyData?.teacher_weekly||[])
                    }
                    margin={{ top:5, right:10, left:-10, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} />
                    <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }} />
                    <Legend wrapperStyle={{ fontSize:12 }} />
                    <Bar dataKey="total"   name="Total"   fill="#93c5fd" radius={[4,4,0,0]} />
                    <Bar dataKey="present" name="Present" fill="#4ade80" radius={[4,4,0,0]} />
                    <Bar dataKey="absent"  name="Absent"  fill="#f87171" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary pills below charts */}
            {chartTab === 'student' && (
              <div style={{ display:'flex', gap:12, padding:'0 20px 16px', flexWrap:'wrap' }}>
                {(() => {
                  const rows = attFilter
                    ? (weeklyData?.class_today||[]).filter(c=>String(c.class_id)===String(attFilter))
                    : (weeklyData?.class_today||[]);
                  const t = rows.reduce((a,c)=>({
                    total:   a.total+c.total,
                    present: a.present+c.present,
                    absent:  a.absent+c.absent,
                    late:    a.late+c.late,
                  }), {total:0,present:0,absent:0,late:0});
                  return [
                    { label:'Total',   value:t.total,   bg:'#f1f5f9', color:'#0f172a' },
                    { label:'Present', value:t.present, bg:'#dcfce7', color:'#16a34a' },
                    { label:'Absent',  value:t.absent,  bg:'#fee2e2', color:'#dc2626' },
                    { label:'Late',    value:t.late,    bg:'#fef3c7', color:'#d97706' },
                    { label:'Attendance',
                      value: t.total>0 ? `${Math.round(t.present/t.total*100)}%` : '0%',
                      bg:'#eff6ff', color:'#2563eb' },
                  ].map(p => (
                    <div key={p.label} style={{
                      background:p.bg, borderRadius:10,
                      padding:'8px 18px', textAlign:'center',
                    }}>
                      <div style={{ fontSize:20, fontWeight:800, color:p.color }}>{p.value}</div>
                      <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{p.label}</div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* ── Teacher Attendance History ── */}
          <div className="card" style={{ marginBottom:24 }}>
            <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h4 style={{ margin:0 }}>👩‍🏫 Teacher Attendance — Today Detail</h4>
              <button className="btn btn-neutral btn-sm"
                onClick={() => navigate('/teachers')}>View All Teachers</button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Teacher</th><th>Designation</th>
                    <th>Status</th><th>Check In</th><th>Check Out</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherAtt?.absent_list?.length === 0 && !teacherAtt?.not_marked ? (
                    <tr><td colSpan={5} style={{ textAlign:'center', padding:24, color:'var(--neutral-4)' }}>
                      ✅ Sab teachers present hain aaj
                    </td></tr>
                  ) : (
                    <>
                      {(teacherAtt?.absent_list || []).map((t,i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{
                                width:32, height:32, borderRadius:'50%',
                                background: t.on_leave?'#fef3c7':'#fee2e2',
                                color: t.on_leave?'#d97706':'#dc2626',
                                display:'flex', alignItems:'center',
                                justifyContent:'center', fontWeight:800,
                              }}>{t.name?.charAt(0).toUpperCase()}</div>
                              <span style={{ fontWeight:600 }}>{t.name}</span>
                            </div>
                          </td>
                          <td style={{ fontSize:12, color:'var(--neutral-6)' }}>{t.designation}</td>
                          <td>
                            <span style={{
                              padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                              background: t.on_leave?'#fef3c7':'#fee2e2',
                              color: t.on_leave?'#d97706':'#dc2626',
                            }}>{t.on_leave ? 'On Leave' : 'Absent'}</span>
                          </td>
                          <td style={{ fontSize:12 }}>—</td>
                          <td style={{ fontSize:12 }}>—</td>
                        </tr>
                      ))}
                      {teacherAtt?.not_marked > 0 && (
                        <tr>
                          <td colSpan={5} style={{
                            textAlign:'center', padding:'10px',
                            background:'#fffbeb', fontSize:12, color:'#92400e',
                          }}>
                            ⚠️ {teacherAtt.not_marked} teachers ki attendance abhi mark nahi hui
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
