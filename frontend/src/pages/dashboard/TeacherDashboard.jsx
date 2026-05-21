import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';

export default function TeacherDashboard() {
  const [classes,       setClasses]       = useState([]);
  const [tab,           setTab]           = useState('attendance');
  const [selectedClass, setSelectedClass] = useState('');
  const [students,      setStudents]      = useState([]);
  const [attendance,    setAttendance]    = useState({});
  const [marksData,     setMarksData]     = useState([]);
  const [subjects,      setSubjects]      = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType,      setExamType]      = useState('Mid Term');
  const [saving,        setSaving]        = useState(false);
  const [msg,           setMsg]           = useState('');
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [selfAtt,        setSelfAtt]        = useState({ status:'PRESENT', check_in:'', check_out:'', remarks:'' });
  const [selfAttSaved,   setSelfAttSaved]   = useState(null);  // existing request for today
  const [selfAttSaving,  setSelfAttSaving]  = useState(false);
  const [holidays,       setHolidays]       = useState([]);

  const today = new Date().toISOString().split('T')[0];

  /* ── Load classes + subjects on mount ─────────────────────── */
  useEffect(() => {
    api.get('/principal/classes')
      .then(r => {
        setClasses(r.data);
        if (r.data.length) setSelectedClass(String(r.data[0].id));
      })
      .catch(() => {});

    api.get('/principal/subjects')
      .then(r => {
        setSubjects(r.data);
        if (r.data.length) setSelectedSubject(String(r.data[0].id));
      })
      .catch(() => {});

    // Load today's self-attendance request if exists
    api.get(`/teacher/self-attendance?date=${today}`)
      .then(r => { if (r.data) setSelfAttSaved(r.data); })
      .catch(() => {});

    // Load upcoming holidays
    api.get('/principal/holidays?applies_to=TEACHER')
      .then(r => setHolidays(r.data || []))
      .catch(() => {});
  }, []);

  /* ── Load students + today's attendance when class changes ── */
  useEffect(() => {
    if (!selectedClass) return;
    setStudents([]);
    setAttendance({});
    setAlreadyMarked(false);

    api.get(`/principal/students?class_id=${selectedClass}`)
      .then(r => {
        setStudents(r.data);

        // default everyone PRESENT
        const init = {};
        r.data.forEach(s => { init[String(s.id)] = 'PRESENT'; });

        // try to load already-saved attendance for today → overwrite defaults
        api.get(`/teacher/attendance/${selectedClass}?date=${today}`)
          .then(att => {
            if (att.data.length > 0) {
              att.data.forEach(a => { init[String(a.student_id)] = a.status; });
              setAlreadyMarked(true);
            }
            setAttendance(init);
          })
          .catch(() => setAttendance(init));

        // init marks rows
        setMarksData(
          r.data.map(s => ({
            student_id:     s.id,
            name:           s.name,
            roll_number:    s.roll_number,
            marks_obtained: '',
            max_marks:      100,
          }))
        );
      })
      .catch(() => {});
  }, [selectedClass]);

  /* ── Toggle one student's attendance ─────────────────────── */
  const toggle = (studentId, status) =>
    setAttendance(prev => ({ ...prev, [String(studentId)]: status }));

  /* ── Save Attendance ──────────────────────────────────────── */
  const saveAttendance = async () => {
    setSaving(true); setMsg('');
    try {
      const records = Object.entries(attendance).map(([sid, status]) => ({
        student_id: parseInt(sid), status,
      }));
      await api.post('/teacher/attendance', {
        class_id: selectedClass,
        date:     today,
        records,
      });
      setMsg('✅ Attendance saved!');
      setAlreadyMarked(true);
    } catch {
      setMsg('❌ Error saving attendance');
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3500);
  };

  /* ── Save Marks ────────────────────────────────────────────── */
  const saveMarks = async () => {
    setSaving(true); setMsg('');
    try {
      const entries = marksData
        .filter(m => m.marks_obtained !== '')
        .map(m => ({
          student_id:     m.student_id,
          subject_id:     selectedSubject ? parseInt(selectedSubject) : 1,
          marks_obtained: parseFloat(m.marks_obtained),
          max_marks:      m.max_marks,
        }));
      if (!entries.length) { setMsg('❌ Kisi ka marks enter nahi kiya'); setSaving(false); return; }
      await api.post('/teacher/marks', { entries, exam_type: examType });
      setMsg(`✅ ${entries.length} students ke marks saved!`);
    } catch {
      setMsg('❌ Error saving marks');
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3500);
  };

  /* ── Summary counts ───────────────────────────────────────── */
  const saveSelfAttendance = async () => {
    setSelfAttSaving(true);
    try {
      const r = await api.post('/teacher/self-attendance', {
        date:      today,
        status:    selfAtt.status,
        check_in:  selfAtt.check_in,
        check_out: selfAtt.check_out,
        remarks:   selfAtt.remarks,
      });
      setSelfAttSaved(r.data);
      setMsg('✅ Attendance request submitted — Principal se approval pending hai');
    } catch {
      setMsg('❌ Error submitting attendance');
    }
    setSelfAttSaving(false);
    setTimeout(() => setMsg(''), 4000);
  };

  /* ── Tabs config ─────────────────────────────────────────── */
   const TABS = [
    { key: 'attendance',  icon: '✅', label: 'Attendance'      },
    { key: 'marks',       icon: '✏️', label: 'Marks Entry'     },
    { key: 'notes',       icon: '📤', label: 'Upload Notes'    },
    { key: 'my-att',      icon: '🙋', label: 'My Attendance'   },
    { key: 'holidays',    icon: '🎉', label: 'Holidays'        },
  ];

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Teacher Dashboard" />
        <div className="page-body">

          {/* ── Header ── */}
          <div className="page-header">
            <h2 className="page-title">My Classroom</h2>
            <p className="page-subtitle">Manage attendance, marks and notes</p>
          </div>

          {/* ── Class Selector ── */}
          <div className="card mb-6">
            <div className="card-body" style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <label className="form-label" style={{ marginBottom:0, whiteSpace:'nowrap' }}>
                Select Class:
              </label>
              <select
                className="form-select"
                style={{ maxWidth:200 }}
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                {classes.map(c => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>

              {/* Student count pill */}
              <span style={{
                fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20,
                background: students.length ? '#dbeafe' : '#fee2e2',
                color:      students.length ? '#1d4ed8' : '#dc2626',
              }}>
                {students.length === 0
                  ? '⚠️ 0 students enrolled'
                  : `👥 ${students.length} students enrolled`}
              </span>

              {students.length === 0 && (
                <span style={{ fontSize:12, color:'#92400e', background:'#fffbeb',
                  padding:'4px 12px', borderRadius:20, border:'1px solid #fde68a' }}>
                  Students page se is class mein students enroll karein pehle
                </span>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{ display:'flex', borderBottom:'2px solid var(--neutral-2)', marginBottom:20 }}>
            {TABS.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setMsg(''); }}
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  padding:'10px 22px', fontSize:13, fontWeight:600,
                  color: tab === key ? 'var(--blue-60)' : 'var(--neutral-6)',
                  borderBottom: tab === key ? '2px solid var(--blue-60)' : '2px solid transparent',
                  marginBottom: -2, transition:'color 0.15s',
                  display:'flex', alignItems:'center', gap:6,
                }}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>

          {/* ── Alert ── */}
          {msg && (
            <div
              className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}
              style={{ marginBottom:16 }}
            >
              {msg}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              TAB: ATTENDANCE
          ═══════════════════════════════════════════════ */}
          {tab === 'attendance' && (
            <div className="card">
              <div className="card-header" style={{
                display:'flex', justifyContent:'space-between',
                alignItems:'center', flexWrap:'wrap', gap:12,
              }}>
                <div>
                  <h4 style={{ margin:0 }}>
                    📋 Mark Attendance —{' '}
                    {new Date().toLocaleDateString('en-IN', {
                      weekday:'long', day:'numeric', month:'long', year:'numeric',
                    })}
                  </h4>
                  {alreadyMarked && (
                    <span style={{ fontSize:11, color:'#059669', fontWeight:600 }}>
                      ✔ Aaj ki attendance already saved hai — edit kar sakte ho
                    </span>
                  )}
                </div>

                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  {/* Summary badges */}
                  <span style={{ background:'#dbeafe', color:'#1d4ed8',
                    padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                    🔵 {presentCount} Present
                  </span>
                  <span style={{ background:'#fee2e2', color:'#dc2626',
                    padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                    🔴 {absentCount} Absent
                  </span>
                  {lateCount > 0 && (
                    <span style={{ background:'#fef3c7', color:'#d97706',
                      padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                      🟡 {lateCount} Late
                    </span>
                  )}

                  <button
                    className="btn btn-neutral btn-sm"
                    onClick={() => {
                      const all = {};
                      students.forEach(s => { all[String(s.id)] = 'PRESENT'; });
                      setAttendance(all);
                    }}
                  >
                    All Present
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={saveAttendance}
                    disabled={saving || !students.length}
                  >
                    {saving ? 'Saving...' : '💾 Save'}
                  </button>
                </div>
              </div>

              {/* Empty state */}
              {students.length === 0 ? (
                <div className="empty-state" style={{ padding:48 }}>
                  <div className="empty-state-icon">🎒</div>
                  <p>Is class mein koi student enrolled nahi hai</p>
                  <p style={{ fontSize:12, color:'var(--neutral-5)' }}>
                    Principal ya Admin se Students page par jaake students enroll karwayein
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width:44, textAlign:'center' }}>#</th>
                        <th style={{ width:90 }}>Roll No</th>
                        <th>Student Name</th>
                        <th style={{ width:260 }}>Mark Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => {
                        const status = attendance[String(s.id)] || 'PRESENT';
                        const rowBg =
                          status === 'PRESENT' ? '#f0fdf4' :
                          status === 'ABSENT'  ? '#fff5f5' : '#fffbeb';

                        return (
                          <tr key={s.id} style={{ background: rowBg, transition:'background 0.2s' }}>
                            <td style={{ textAlign:'center', color:'var(--neutral-5)', fontSize:12 }}>
                              {i + 1}
                            </td>
                            <td>
                              <span className="badge badge-neutral">{s.roll_number || '—'}</span>
                            </td>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                                {/* Avatar with status color */}
                                <div style={{
                                  width:34, height:34, borderRadius:'50%', flexShrink:0,
                                  background:
                                    status === 'PRESENT' ? '#bbf7d0' :
                                    status === 'ABSENT'  ? '#fecaca' : '#fde68a',
                                  color:
                                    status === 'PRESENT' ? '#166534' :
                                    status === 'ABSENT'  ? '#991b1b' : '#92400e',
                                  display:'flex', alignItems:'center',
                                  justifyContent:'center', fontSize:13, fontWeight:700,
                                }}>
                                  {s.name?.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight:500 }}>{s.name}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display:'flex', gap:10, alignItems:'center' }}>

                                {/* ── 🔵 PRESENT Button ── */}
                                <button
                                  title="Mark Present"
                                  onClick={() => toggle(s.id, 'PRESENT')}
                                  style={{
                                    width:42, height:42, borderRadius:'50%',
                                    border: status === 'PRESENT' ? '3px solid #1d4ed8' : '2px solid #bfdbfe',
                                    background: status === 'PRESENT' ? '#2563eb' : '#eff6ff',
                                    color:   status === 'PRESENT' ? '#fff' : '#93c5fd',
                                    cursor:'pointer', fontSize:15, fontWeight:900,
                                    transition:'all 0.18s',
                                    boxShadow: status === 'PRESENT'
                                      ? '0 3px 10px rgba(37,99,235,0.45)' : 'none',
                                    transform: status === 'PRESENT' ? 'scale(1.13)' : 'scale(1)',
                                    lineHeight:1,
                                  }}
                                >
                                  P
                                </button>

                                {/* ── 🔴 ABSENT Button ── */}
                                <button
                                  title="Mark Absent"
                                  onClick={() => toggle(s.id, 'ABSENT')}
                                  style={{
                                    width:42, height:42, borderRadius:'50%',
                                    border: status === 'ABSENT' ? '3px solid #b91c1c' : '2px solid #fecaca',
                                    background: status === 'ABSENT' ? '#dc2626' : '#fff5f5',
                                    color:   status === 'ABSENT' ? '#fff' : '#fca5a5',
                                    cursor:'pointer', fontSize:15, fontWeight:900,
                                    transition:'all 0.18s',
                                    boxShadow: status === 'ABSENT'
                                      ? '0 3px 10px rgba(220,38,38,0.45)' : 'none',
                                    transform: status === 'ABSENT' ? 'scale(1.13)' : 'scale(1)',
                                    lineHeight:1,
                                  }}
                                >
                                  A
                                </button>

                                {/* ── 🟡 LATE Button ── */}
                                <button
                                  title="Mark Late"
                                  onClick={() => toggle(s.id, 'LATE')}
                                  style={{
                                    width:42, height:42, borderRadius:'50%',
                                    border: status === 'LATE' ? '3px solid #b45309' : '2px solid #fde68a',
                                    background: status === 'LATE' ? '#d97706' : '#fffbeb',
                                    color:   status === 'LATE' ? '#fff' : '#fcd34d',
                                    cursor:'pointer', fontSize:15, fontWeight:900,
                                    transition:'all 0.18s',
                                    boxShadow: status === 'LATE'
                                      ? '0 3px 10px rgba(217,119,6,0.45)' : 'none',
                                    transform: status === 'LATE' ? 'scale(1.13)' : 'scale(1)',
                                    lineHeight:1,
                                  }}
                                >
                                  L
                                </button>

                                {/* Status label */}
                                <span style={{
                                  fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
                                  background:
                                    status === 'PRESENT' ? '#dbeafe' :
                                    status === 'ABSENT'  ? '#fee2e2' : '#fef3c7',
                                  color:
                                    status === 'PRESENT' ? '#1d4ed8' :
                                    status === 'ABSENT'  ? '#dc2626' : '#d97706',
                                  minWidth:68, textAlign:'center',
                                }}>
                                  {status === 'PRESENT' ? '✓ Present'
                                    : status === 'ABSENT' ? '✗ Absent'
                                    : '⏰ Late'}
                                </span>

                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              TAB: MARKS ENTRY
          ═══════════════════════════════════════════════ */}
          {tab === 'marks' && (
            <div className="card">
              <div className="card-header" style={{
                display:'flex', justifyContent:'space-between',
                alignItems:'center', flexWrap:'wrap', gap:12,
              }}>
                <h4 style={{ margin:0 }}>✏️ Enter Marks</h4>

                <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                  {/* Subject selector */}
                  {subjects.length > 0 && (
                    <select
                      className="form-select"
                      style={{ width:160 }}
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={String(s.id)}>{s.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Exam type selector */}
                  <select
                    className="form-select"
                    style={{ width:150 }}
                    value={examType}
                    onChange={e => setExamType(e.target.value)}
                  >
                    <option>Unit Test 1</option>
                    <option>Mid Term</option>
                    <option>Unit Test 2</option>
                    <option>Final Exam</option>
                    <option>Pre-Board</option>
                  </select>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={saveMarks}
                    disabled={saving || !students.length}
                  >
                    {saving ? 'Saving...' : '💾 Save Marks'}
                  </button>
                </div>
              </div>

              {students.length === 0 ? (
                <div className="empty-state" style={{ padding:48 }}>
                  <div className="empty-state-icon">📝</div>
                  <p>Is class mein koi student enrolled nahi hai</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width:90 }}>Roll No</th>
                        <th>Student Name</th>
                        <th style={{ width:150 }}>Marks Obtained</th>
                        <th style={{ width:110 }}>Max Marks</th>
                        <th style={{ width:80, textAlign:'center' }}>%</th>
                        <th style={{ width:70, textAlign:'center' }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marksData.map((m, i) => {
                        const raw = parseFloat(m.marks_obtained);
                        const pct = (!isNaN(raw) && m.max_marks > 0)
                          ? (raw / m.max_marks) * 100 : null;
                        const grade = pct !== null
                          ? pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+'
                            : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 33 ? 'D' : 'F'
                          : '';
                        const gradeBadge = pct !== null
                          ? pct >= 60 ? 'badge-success' : pct >= 33 ? 'badge-warning' : 'badge-error'
                          : '';

                        return (
                          <tr key={m.student_id}>
                            <td>
                              <span className="badge badge-neutral">
                                {m.roll_number || students[i]?.roll_number || '—'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{
                                  width:30, height:30, borderRadius:'50%',
                                  background:'#f3f0ff', color:'#5867e8',
                                  display:'flex', alignItems:'center',
                                  justifyContent:'center', fontSize:12, fontWeight:700,
                                }}>
                                  {m.name?.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight:500 }}>{m.name}</span>
                              </div>
                            </td>
                            <td>
                              <input
                                className="form-input"
                                type="number"
                                min="0"
                                max={m.max_marks}
                                value={m.marks_obtained}
                                placeholder="0"
                                style={{
                                  width:110, textAlign:'center',
                                  fontWeight:700, fontSize:15,
                                  cursor:'text',
                                  background: m.marks_obtained !== '' ? '#f0fdf4' : '',
                                  borderColor: m.marks_obtained !== ''
                                    ? (pct >= 33 ? '#86efac' : '#fca5a5')
                                    : undefined,
                                }}
                                onChange={e =>
                                  setMarksData(d =>
                                    d.map((x, j) => j === i
                                      ? { ...x, marks_obtained: e.target.value }
                                      : x
                                    )
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="form-input"
                                type="number"
                                min="1"
                                value={m.max_marks}
                                style={{ width:70, textAlign:'center', cursor:'text' }}
                                onChange={e =>
                                  setMarksData(d =>
                                    d.map((x, j) => j === i
                                      ? { ...x, max_marks: parseInt(e.target.value) || 100 }
                                      : x
                                    )
                                  )
                                }
                              />
                            </td>
                            <td style={{
                              textAlign:'center', fontWeight:700,
                              color: pct === null ? 'var(--neutral-4)'
                                : pct >= 33 ? '#059669' : '#dc2626',
                            }}>
                              {pct !== null ? `${pct.toFixed(1)}%` : '—'}
                            </td>
                            <td style={{ textAlign:'center' }}>
                              {grade && (
                                <span className={`badge ${gradeBadge}`}>{grade}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

         {/* ═══════════════════════════════════════════════
              TAB: NOTES
          ═══════════════════════════════════════════════ */}
          {tab === 'notes' && <NotesUpload selectedClass={selectedClass} />}

          {/* ═══════════════════════════════════════════════
              TAB: MY ATTENDANCE
          ═══════════════════════════════════════════════ */}
          {tab === 'my-att' && (
            <div style={{ maxWidth: 520 }}>
              <div className="card">
                <div className="card-header">
                  <h4 style={{ margin:0 }}>🙋 Mark My Attendance</h4>
                  <span style={{ fontSize:11, color:'var(--neutral-5)' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
                  </span>
                </div>
                <div style={{ padding:'20px' }}>

                  {/* Already submitted banner */}
                  {selfAttSaved && (
                    <div style={{
                      background: selfAttSaved.approval === 'APPROVED' ? '#f0fdf4'
                        : selfAttSaved.approval === 'DENIED' ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${selfAttSaved.approval === 'APPROVED' ? '#bbf7d0'
                        : selfAttSaved.approval === 'DENIED' ? '#fecaca' : '#fde68a'}`,
                      borderRadius:10, padding:'12px 16px', marginBottom:16,
                      display:'flex', alignItems:'center', gap:10,
                    }}>
                      <span style={{ fontSize:20 }}>
                        {selfAttSaved.approval === 'APPROVED' ? '✅'
                          : selfAttSaved.approval === 'DENIED' ? '❌' : '⏳'}
                      </span>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13 }}>
                          {selfAttSaved.approval === 'APPROVED' ? 'Attendance Approved!'
                            : selfAttSaved.approval === 'DENIED' ? 'Attendance Denied'
                            : 'Approval Pending — Principal review karega'}
                        </div>
                        <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>
                          Status: <strong>{selfAttSaved.status}</strong>
                          {selfAttSaved.check_in && ` · In: ${selfAttSaved.check_in}`}
                          {selfAttSaved.check_out && ` · Out: ${selfAttSaved.check_out}`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status buttons */}
                  <div style={{ marginBottom:16 }}>
                    <label style={{ fontSize:12, fontWeight:600, color:'var(--neutral-6)', display:'block', marginBottom:8 }}>
                      Attendance Status
                    </label>
                    <div style={{ display:'flex', gap:8 }}>
                      {[
                        { val:'PRESENT',  label:'Present',  bg:'#dcfce7', color:'#16a34a', active:'#16a34a' },
                        { val:'ABSENT',   label:'Absent',   bg:'#fee2e2', color:'#dc2626', active:'#dc2626' },
                        { val:'HALF_DAY', label:'Half Day', bg:'#fef3c7', color:'#d97706', active:'#d97706' },
                        { val:'ON_LEAVE', label:'On Leave', bg:'#f5f3ff', color:'#7c3aed', active:'#7c3aed' },
                      ].map(s => (
                        <button
                          key={s.val}
                          type="button"
                          onClick={() => setSelfAtt(a => ({ ...a, status: s.val }))}
                          style={{
                            flex:1, padding:'8px 4px', borderRadius:8, fontSize:11,
                            fontWeight:700, cursor:'pointer', border:'2px solid',
                            borderColor: selfAtt.status === s.val ? s.active : 'transparent',
                            background: selfAtt.status === s.val ? s.bg : '#f8fafc',
                            color: selfAtt.status === s.val ? s.color : '#94a3b8',
                            transition:'all 0.15s',
                          }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time inputs */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:'var(--neutral-6)', display:'block', marginBottom:4 }}>
                        Check In Time
                      </label>
                      <input
                        type="time"
                        className="form-input"
                        value={selfAtt.check_in}
                        onChange={e => setSelfAtt(a => ({ ...a, check_in: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:'var(--neutral-6)', display:'block', marginBottom:4 }}>
                        Check Out Time
                      </label>
                      <input
                        type="time"
                        className="form-input"
                        value={selfAtt.check_out}
                        onChange={e => setSelfAtt(a => ({ ...a, check_out: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div style={{ marginBottom:16 }}>
                    <label style={{ fontSize:12, fontWeight:600, color:'var(--neutral-6)', display:'block', marginBottom:4 }}>
                      Remarks (optional)
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="e.g. Late due to traffic, half day for medical..."
                      value={selfAtt.remarks}
                      onChange={e => setSelfAtt(a => ({ ...a, remarks: e.target.value }))}
                    />
                  </div>

                  <button
                    onClick={saveSelfAttendance}
                    disabled={selfAttSaving}
                    style={{
                      width:'100%', padding:'10px', borderRadius:8, border:'none',
                      background: selfAttSaving ? '#94a3b8' : '#0176d3',
                      color:'#fff', cursor: selfAttSaving ? 'default' : 'pointer',
                      fontSize:13, fontWeight:700,
                    }}>
                    {selfAttSaving ? '⏳ Submitting...'
                      : selfAttSaved ? '🔄 Re-submit Request'
                      : '🙋 Submit for Approval'}
                  </button>

                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:10, textAlign:'center' }}>
                    ⚠️ Request submit hone ke baad Principal approve ya deny karega
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              TAB: HOLIDAYS
          ═══════════════════════════════════════════════ */}
          {tab === 'holidays' && (
            <div style={{ maxWidth: 640 }}>
              <div className="card">
                <div className="card-header">
                  <h4 style={{ margin:0 }}>🎉 Upcoming Holidays</h4>
                </div>
                {holidays.length === 0 ? (
                  <div className="empty-state" style={{ padding:40 }}>
                    <div className="empty-state-icon">🎉</div>
                    <p>Koi holiday scheduled nahi hai abhi</p>
                  </div>
                ) : (
                  <div>
                    {holidays.map((h, i) => {
                      const d        = new Date(h.date);
                      const isToday  = h.date === today;
                      const isPast   = new Date(h.date) < new Date(today);
                      const typeColors = {
                        HOLIDAY:  { bg:'#fee2e2', color:'#dc2626', icon:'🏖️' },
                        FESTIVAL: { bg:'#fef3c7', color:'#d97706', icon:'🎊' },
                        EXAM:     { bg:'#eff6ff', color:'#0176d3', icon:'📝' },
                        EVENT:    { bg:'#f5f3ff', color:'#7c3aed', icon:'📅' },
                        OTHER:    { bg:'#f1f5f9', color:'#64748b', icon:'📌' },
                      };
                      const tc = typeColors[h.holiday_type] || typeColors.OTHER;
                      return (
                        <div key={i} style={{
                          display:'flex', alignItems:'center', gap:14,
                          padding:'14px 20px',
                          borderBottom:'1px solid var(--neutral-1)',
                          opacity: isPast ? 0.5 : 1,
                          background: isToday ? '#fffbeb' : 'transparent',
                        }}>
                          {/* Date box */}
                          <div style={{
                            minWidth:48, height:48, borderRadius:10,
                            background: tc.bg, color: tc.color,
                            display:'flex', flexDirection:'column',
                            alignItems:'center', justifyContent:'center',
                            fontWeight:800, flexShrink:0,
                          }}>
                            <span style={{ fontSize:16 }}>{d.getDate()}</span>
                            <span style={{ fontSize:9 }}>
                              {d.toLocaleDateString('en-IN', { month:'short' }).toUpperCase()}
                            </span>
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>
                              {tc.icon} {h.title}
                              {isToday && (
                                <span style={{
                                  marginLeft:8, fontSize:10, fontWeight:700,
                                  background:'#fde68a', color:'#92400e',
                                  padding:'2px 8px', borderRadius:20,
                                }}>TODAY</span>
                              )}
                            </div>
                            {h.description && (
                              <div style={{ fontSize:12, color:'var(--neutral-5)', marginTop:2 }}>
                                {h.description}
                              </div>
                            )}
                            {h.end_date && h.end_date !== h.date && (
                              <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                                Till {new Date(h.end_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <span style={{
                              fontSize:10, fontWeight:700, padding:'3px 10px',
                              borderRadius:20, background: tc.bg, color: tc.color,
                            }}>{h.holiday_type}</span>
                            <div style={{ fontSize:10, color:'#94a3b8', marginTop:4 }}>
                              {d.toLocaleDateString('en-IN', { weekday:'short' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Notes Upload sub-component
───────────────────────────────────────────────────────────── */
function NotesUpload({ selectedClass }) {
  const [form,      setForm]      = useState({ title:'', description:'' });
  const [file,      setFile]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg,       setMsg]       = useState('');

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return setMsg('❌ Please select a file');
    setUploading(true); setMsg('');
    const fd = new FormData();
    fd.append('title',       form.title);
    fd.append('description', form.description);
    fd.append('class_id',    selectedClass);
    fd.append('file',        file);
    try {
      await api.post('/teacher/notes', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg('✅ Note uploaded successfully!');
      setForm({ title:'', description:'' });
      setFile(null);
    } catch {
      setMsg('❌ Upload failed');
    }
    setUploading(false);
  };

  return (
    <div className="card">
      <div className="card-header"><h4>📤 Upload Study Notes</h4></div>
      <div className="card-body" style={{ maxWidth:560 }}>
        {msg && (
          <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
            {msg}
          </div>
        )}
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label className="form-label">Note Title *</label>
            <input
              className="form-input"
              placeholder="e.g. Chapter 5 — Algebraic Expressions"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Brief description..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Upload File (PDF, DOC, PPT, Image)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg"
              onChange={e => setFile(e.target.files[0])}
              style={{ display:'block', fontSize:13, color:'var(--neutral-9)' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? '⏳ Uploading...' : '📤 Upload Note'}
          </button>
        </form>
      </div>
    </div>
  );
}
