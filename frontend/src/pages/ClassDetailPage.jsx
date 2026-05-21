import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api     from '../api/axios';

export default function ClassDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [subjFilter, setSubjFilter] = useState('all');
  const [teachers,   setTeachers]   = useState([]);
  const [assigning,  setAssigning]  = useState(false);
  const [selTeacher, setSelTeacher] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/principal/classes/${id}/detail`),
      api.get('/principal/teachers'),
    ]).then(([d, t]) => {
      setData(d.data);
      setTeachers(t.data || []);
      setSelTeacher(d.data?.class_teacher?.teacher_id || '');
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const assignTeacher = async () => {
    if (!selTeacher) return;
    setAssigning(true);
    try {
      await api.post(`/principal/classes/${id}/assign-teacher`, { teacher_id: selTeacher });
      const r = await api.get(`/principal/classes/${id}/detail`);
      setData(r.data);
    } catch {}
    setAssigning(false);
  };

  const fmt  = n => Number(n || 0).toLocaleString('en-IN');
  const fmtK = n => {
    n = Number(n || 0);
    if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
    if (n >= 1000)   return `₹${(n/1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  if (loading) return (
    <div className="app-shell"><Sidebar />
      <div className="main-content"><Navbar title="Class Detail" />
        <div className="page-body" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
          <span style={{ color:'var(--neutral-5)', fontSize:14 }}>⏳ Loading...</span>
        </div>
      </div>
    </div>
  );

  if (!data) return (
    <div className="app-shell"><Sidebar />
      <div className="main-content"><Navbar title="Class Detail" />
        <div className="page-body"><div className="empty-state"><p>Class nahi mili.</p></div></div>
      </div>
    </div>
  );

  const { fees, marks, attendance_today, class_teacher } = data;
  const examTypes = ['all', ...(marks?.exam_types || [])];

  // Subject toppers filtered by exam type (all = combined)
  const subjectToppers = marks?.subject_toppers || {};

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Class Detail" />
        <div className="page-body">

          {/* ── Header ── */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
            <button onClick={() => navigate(-1)} style={{
              background:'none', border:'1px solid var(--neutral-3)',
              borderRadius:8, padding:'6px 14px', cursor:'pointer',
              fontSize:13, color:'var(--neutral-7)', fontWeight:600,
            }}>← Back</button>
            <div style={{
              width:52, height:52, borderRadius:14,
              background:'var(--blue-10)', color:'var(--blue-80)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:24, flexShrink:0,
            }}>🏛</div>
            <div style={{ flex:1 }}>
              <h2 style={{ margin:0, fontSize:22, fontWeight:800 }}>
                {data.class_name} — Section {data.section}
              </h2>
              <div style={{ fontSize:12, color:'var(--neutral-5)', marginTop:2 }}>
                Session: {data.session} &nbsp;·&nbsp; {data.total_students} Students
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/students?class_id=${id}`)}>
              👥 View All Students
            </button>
          </div>

          {/* ── Top Stats Row ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
            {[
              { icon:'👨‍🎓', label:'Total Students', value: data.total_students, color:'#0176d3', bg:'#eff6ff' },
              { icon:'✅', label:'Present Today',  value: attendance_today?.present ?? 0, color:'#16a34a', bg:'#f0fdf4' },
              { icon:'❌', label:'Absent Today',   value: attendance_today?.absent  ?? 0, color:'#dc2626', bg:'#fef2f2' },
              { icon:'📊', label:'Avg Marks',
                value: marks?.avg_percentage ? `${marks.avg_percentage}%` : '—',
                color:'#5867e8', bg:'#f5f3ff' },
            ].map(s => (
              <div key={s.label} style={{
                background:s.bg, borderRadius:12, padding:'16px 20px',
                border:`1px solid ${s.color}22`,
              }}>
                <div style={{ fontSize:22 }}>{s.icon}</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:6 }}>{s.label}</div>
                <div style={{ fontSize:24, fontWeight:800, color:s.color, marginTop:2 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ── Main Grid ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>

            {/* LEFT COLUMN */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Fee Bar Chart */}
              <div className="card" style={{ margin:0 }}>
                <div className="card-header">
                  <h4 style={{ margin:0 }}>💰 Fee Status</h4>
                </div>
                <div style={{ padding:'16px 20px' }}>

                  {/* 3 bars */}
                  {[
                    { label:'Total Students', value: data.total_students,    max: data.total_students, color:'#0176d3', bg:'#eff6ff' },
                    { label:'Fees Paid',       value: fees?.paid_count    ?? 0, max: data.total_students, color:'#16a34a', bg:'#f0fdf4' },
                    { label:'Fees Pending',    value: fees?.pending_count ?? 0, max: data.total_students, color:'#dc2626', bg:'#fef2f2' },
                  ].map(b => (
                    <div key={b.label} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                        <span style={{ fontWeight:600, color:'var(--neutral-7)' }}>{b.label}</span>
                        <span style={{ fontWeight:800, color:b.color }}>{b.value}</span>
                      </div>
                      <div style={{ height:10, background:'#f1f5f9', borderRadius:99 }}>
                        <div style={{
                          width: b.max > 0 ? `${Math.round(b.value/b.max*100)}%` : '0%',
                          height:'100%', borderRadius:99, background:b.color,
                          transition:'width 0.5s',
                        }} />
                      </div>
                    </div>
                  ))}

                  {/* Amount summary */}
                  <div style={{
                    display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                    gap:10, marginTop:16,
                  }}>
                    {[
                      { label:'Total Due',   value: fmtK(fees?.total_due),  color:'#0176d3' },
                      { label:'Collected',   value: fmtK(fees?.total_paid), color:'#16a34a' },
                      { label:'Pending Amt', value: fmtK(fees?.pending),    color:'#dc2626' },
                    ].map(f => (
                      <div key={f.label} style={{
                        background:'#f8fafc', borderRadius:8, padding:'10px 12px', textAlign:'center',
                      }}>
                        <div style={{ fontSize:14, fontWeight:800, color:f.color }}>{f.value}</div>
                        <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{f.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Collection % bar */}
                  {fees?.total_due > 0 && (
                    <div style={{ marginTop:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                        <span style={{ color:'var(--neutral-5)' }}>Collection Rate</span>
                        <span style={{ fontWeight:800, color: fees.collection_pct >= 75 ? '#16a34a' : '#d97706' }}>
                          {fees.collection_pct}%
                        </span>
                      </div>
                      <div style={{ height:8, background:'#f1f5f9', borderRadius:99 }}>
                        <div style={{
                          width:`${fees.collection_pct}%`, height:'100%', borderRadius:99,
                          background: fees.collection_pct >= 75 ? '#16a34a' : fees.collection_pct >= 50 ? '#d97706' : '#dc2626',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Topper + Subject toppers */}
              <div className="card" style={{ margin:0 }}>
                <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <h4 style={{ margin:0 }}>🏆 Toppers</h4>
                  <select
                    className="form-select"
                    style={{ width:160, fontSize:12 }}
                    value={subjFilter}
                    onChange={e => setSubjFilter(e.target.value)}>
                    {examTypes.map(et => (
                      <option key={et} value={et}>{et === 'all' ? 'All Exams' : et}</option>
                    ))}
                  </select>
                </div>

                {/* Overall topper */}
                {marks?.topper ? (
                  <div style={{
                    margin:'12px 20px', padding:'14px 16px',
                    background:'linear-gradient(135deg, #fefce8, #fef9c3)',
                    border:'1px solid #fde047', borderRadius:12,
                    display:'flex', alignItems:'center', gap:12,
                  }}>
                    <div style={{ fontSize:32 }}>🥇</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:15, color:'#713f12' }}>
                        {marks.topper.name}
                      </div>
                      <div style={{ fontSize:12, color:'#92400e', marginTop:2 }}>
                        Roll: {marks.topper.roll_number || '—'} &nbsp;·&nbsp;
                        {marks.topper.obtained}/{marks.topper.max} marks
                      </div>
                    </div>
                    <div style={{
                      background:'#eab308', color:'#fff',
                      padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:800,
                    }}>{marks.topper.percentage}%</div>
                    <button
                      onClick={() => navigate(`/students/${marks.topper.student_id}`)}
                      style={{
                        background:'#0176d3', color:'#fff', border:'none',
                        borderRadius:8, padding:'6px 12px', fontSize:11,
                        fontWeight:700, cursor:'pointer',
                      }}>View Profile</button>
                  </div>
                ) : (
                  <div style={{ padding:'20px', textAlign:'center', color:'var(--neutral-4)', fontSize:13 }}>
                    Koi marks data nahi
                  </div>
                )}

                {/* Subject-wise toppers */}
                {Object.keys(subjectToppers).length > 0 && (
                  <div style={{ borderTop:'1px solid var(--neutral-2)' }}>
                    <div style={{ padding:'8px 20px 4px', fontSize:11, color:'#64748b', fontWeight:600 }}>
                      SUBJECT-WISE TOPPER
                    </div>
                    {Object.entries(subjectToppers).map(([subj, t], i) => (
                      <div key={i} style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding:'10px 20px', borderBottom:'1px solid var(--neutral-1)',
                      }}>
                        <div style={{
                          width:32, height:32, borderRadius:8,
                          background:'#f0fdf4', color:'#16a34a',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:14, fontWeight:800,
                        }}>📚</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, color:'var(--neutral-5)' }}>{subj}</div>
                          <div style={{ fontWeight:700, fontSize:13 }}
                               onClick={() => navigate(`/students/${t.student_id}`)}
                               style={{ fontWeight:700, fontSize:13, color:'#0176d3', cursor:'pointer' }}>
                            {t.name}
                          </div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontWeight:800, fontSize:13 }}>{t.marks}/{t.max_marks}</div>
                          <div style={{ fontSize:11, color:'#16a34a', fontWeight:700 }}>{t.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Class Teacher Card */}
              <div className="card" style={{ margin:0 }}>
                <div className="card-header"><h4 style={{ margin:0 }}>👩‍🏫 Class Teacher</h4></div>

                {class_teacher ? (
                  <div style={{ padding:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                      <div style={{
                        width:48, height:48, borderRadius:'50%',
                        background:'#f3f0ff', color:'#5867e8',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:20, fontWeight:800, flexShrink:0,
                      }}>{class_teacher.name?.charAt(0).toUpperCase()}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:15 }}>{class_teacher.name}</div>
                        <div style={{ fontSize:12, color:'var(--neutral-5)' }}>
                          {class_teacher.designation}
                        </div>
                      </div>
                    </div>
                    {[
                      ['🪪 Emp ID',    class_teacher.employee_id || '—'],
                      ['🏢 Dept',      class_teacher.department  || '—'],
                      ['📧 Email',     class_teacher.email       || '—'],
                      ['💰 Salary',    `₹${fmt(class_teacher.salary)}/mo`],
                    ].map(([label, value]) => (
                      <div key={label} style={{
                        display:'flex', justifyContent:'space-between',
                        padding:'7px 0', borderBottom:'1px solid var(--neutral-1)',
                        fontSize:12,
                      }}>
                        <span style={{ color:'var(--neutral-5)' }}>{label}</span>
                        <span style={{ fontWeight:600 }}>{value}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => navigate(`/teachers/${class_teacher.teacher_id}`)}
                      style={{
                        width:'100%', marginTop:14, padding:'8px',
                        background:'#eff6ff', color:'#0176d3',
                        border:'none', borderRadius:8, cursor:'pointer',
                        fontSize:12, fontWeight:700,
                      }}>👤 View Full Profile</button>
                  </div>
                ) : (
                  <div style={{ padding:'16px', textAlign:'center', color:'var(--neutral-4)', fontSize:13 }}>
                    Koi class teacher assign nahi
                  </div>
                )}

                {/* Assign teacher dropdown */}
                <div style={{ padding:'0 16px 16px', borderTop:'1px solid var(--neutral-2)', paddingTop:12 }}>
                  <div style={{ fontSize:11, color:'#64748b', fontWeight:600, marginBottom:6 }}>
                    ASSIGN CLASS TEACHER
                  </div>
                  <select
                    className="form-select"
                    style={{ fontSize:12, marginBottom:8 }}
                    value={selTeacher}
                    onChange={e => setSelTeacher(e.target.value)}>
                    <option value="">Select teacher...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} — {t.department || 'N/A'}</option>
                    ))}
                  </select>
                  <button
                    onClick={assignTeacher}
                    disabled={assigning || !selTeacher}
                    style={{
                      width:'100%', padding:'7px',
                      background: assigning ? '#94a3b8' : '#0176d3',
                      color:'#fff', border:'none', borderRadius:8,
                      cursor: assigning ? 'default' : 'pointer',
                      fontSize:12, fontWeight:700,
                    }}>
                    {assigning ? 'Saving...' : '✅ Assign'}
                  </button>
                </div>
              </div>

              {/* Today's Attendance Mini */}
              <div className="card" style={{ margin:0 }}>
                <div className="card-header"><h4 style={{ margin:0 }}>📅 Today's Attendance</h4></div>
                <div style={{ padding:'14px 16px' }}>
                  {[
                    { label:'Present',    value: attendance_today?.present    ?? 0, color:'#16a34a', bg:'#f0fdf4' },
                    { label:'Absent',     value: attendance_today?.absent     ?? 0, color:'#dc2626', bg:'#fef2f2' },
                    { label:'Not Marked', value: attendance_today?.not_marked ?? 0, color:'#d97706', bg:'#fffbeb' },
                  ].map(p => (
                    <div key={p.label} style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'8px 10px', borderRadius:8, background:p.bg,
                      marginBottom:8,
                    }}>
                      <span style={{ fontSize:13, color:p.color, fontWeight:600 }}>{p.label}</span>
                      <span style={{ fontSize:18, fontWeight:800, color:p.color }}>{p.value}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => navigate(`/attendance?class_id=${id}`)}
                    style={{
                      width:'100%', marginTop:4, padding:'7px',
                      background:'#f1f5f9', color:'#0176d3',
                      border:'none', borderRadius:8, cursor:'pointer',
                      fontSize:12, fontWeight:700,
                    }}>📋 Mark Attendance</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
