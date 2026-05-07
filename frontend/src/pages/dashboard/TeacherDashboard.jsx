import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';

export default function TeacherDashboard() {
  const [classes, setClasses]   = useState([]);
  const [tab, setTab]           = useState('attendance');
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [marksData, setMarksData]   = useState([]);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');

  useEffect(() => {
    api.get('/principal/classes').then(r => {
      setClasses(r.data);
      if (r.data.length) setSelectedClass(r.data[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    api.get(`/principal/students?class_id=${selectedClass}`).then(r => {
      setStudents(r.data);
      const init = {};
      r.data.forEach(s => { init[s.id] = 'PRESENT'; });
      setAttendance(init);
      setMarksData(r.data.map(s => ({ student_id: s.id, name: s.name, marks_obtained: '', max_marks: 100 })));
    }).catch(() => {});
  }, [selectedClass]);

  const saveAttendance = async () => {
    setSaving(true); setMsg('');
    try {
      const records = Object.entries(attendance).map(([sid, status]) => ({
        student_id: parseInt(sid), status
      }));
      await api.post('/teacher/attendance', {
        class_id: selectedClass,
        date: new Date().toISOString().split('T')[0],
        records
      });
      setMsg('✅ Attendance saved successfully!');
    } catch { setMsg('❌ Error saving attendance'); }
    setSaving(false);
  };

  const saveMarks = async () => {
    setSaving(true); setMsg('');
    try {
      const entries = marksData.filter(m => m.marks_obtained !== '').map(m => ({
        student_id: m.student_id, subject_id: 1, // TODO: subject selector
        marks_obtained: parseFloat(m.marks_obtained), max_marks: m.max_marks
      }));
      await api.post('/teacher/marks', { entries, exam_type: 'Mid Term' });
      setMsg('✅ Marks saved successfully!');
    } catch { setMsg('❌ Error saving marks'); }
    setSaving(false);
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Teacher Dashboard" />
        <div className="page-body">

          <div className="page-header">
            <h2 className="page-title">My Classroom</h2>
            <p className="page-subtitle">Manage attendance, marks and notes</p>
          </div>

          {/* Class Selector */}
          <div className="card mb-6">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Select Class:</label>
              <select className="form-select" style={{ maxWidth: 200 }}
                value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: 'var(--neutral-6)' }}>
                {students.length} students enrolled
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--neutral-2)', marginBottom: 20 }}>
            {['attendance', 'marks', 'notes'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 20px', fontSize: 13, fontWeight: 600,
                color: tab === t ? 'var(--blue-60)' : 'var(--neutral-6)',
                borderBottom: tab === t ? '2px solid var(--blue-60)' : '2px solid transparent',
                marginBottom: -2, transition: 'color 0.15s', textTransform: 'capitalize',
              }}>{t === 'notes' ? '📤 Upload Notes' : tab === t ? `✅ ${t.charAt(0).toUpperCase()+t.slice(1)}` : t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>

          {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

          {/* Attendance Tab */}
          {tab === 'attendance' && (
            <div className="card">
              <div className="card-header">
                <h4>📋 Mark Attendance — {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</h4>
                <div className="flex gap-2">
                  <button className="btn btn-neutral btn-sm" onClick={() => {
                    const all = {}; students.forEach(s => { all[s.id] = 'PRESENT'; }); setAttendance(all);
                  }}>All Present</button>
                  <button className="btn btn-primary btn-sm" onClick={saveAttendance} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save'}
                  </button>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Roll No</th><th>Student Name</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id}>
                        <td style={{ color: 'var(--neutral-6)', width: 40 }}>{i+1}</td>
                        <td><span className="badge badge-neutral">{s.roll_number || '—'}</span></td>
                        <td style={{ fontWeight: 500 }}>{s.name}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {['PRESENT', 'ABSENT', 'LATE'].map(status => (
                              <button key={status} onClick={() => setAttendance(a => ({...a, [s.id]: status}))}
                                style={{
                                  padding: '4px 10px', borderRadius: 100, border: 'none',
                                  fontSize: 10, fontWeight: 700, cursor: 'pointer',
                                  background: attendance[s.id] === status
                                    ? status === 'PRESENT' ? 'var(--success)' : status === 'ABSENT' ? 'var(--error)' : 'var(--warning)'
                                    : 'var(--neutral-2)',
                                  color: attendance[s.id] === status ? '#fff' : 'var(--neutral-6)',
                                  transition: 'all 0.15s',
                                }}>{status}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Marks Tab */}
          {tab === 'marks' && (
            <div className="card">
              <div className="card-header">
                <h4>✏️ Enter Marks</h4>
                <button className="btn btn-primary btn-sm" onClick={saveMarks} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Marks'}
                </button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Roll No</th><th>Student Name</th><th>Marks Obtained</th><th>Max Marks</th><th>Grade</th></tr>
                  </thead>
                  <tbody>
                    {marksData.map((m, i) => {
                      const pct = m.marks_obtained / m.max_marks * 100;
                      const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 33 ? 'D' : 'F';
                      return (
                        <tr key={m.student_id}>
                          <td><span className="badge badge-neutral">{students[i]?.roll_number || '—'}</span></td>
                          <td style={{ fontWeight: 500 }}>{m.name}</td>
                          <td>
                            <input className="form-input" type="number" min="0" max={m.max_marks}
                              value={m.marks_obtained} style={{ width: 80 }}
                              onChange={e => setMarksData(d => d.map((x,j) => j===i ? {...x, marks_obtained: e.target.value} : x))} />
                          </td>
                          <td style={{ color: 'var(--neutral-6)' }}>{m.max_marks}</td>
                          <td>
                            {m.marks_obtained !== '' && (
                              <span className={`badge ${pct >= 33 ? 'badge-success' : 'badge-error'}`}>{grade}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {tab === 'notes' && <NotesUpload />}
        </div>
      </div>
    </div>
  );
}

function NotesUpload() {
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return setMsg('❌ Please select a file');
    setUploading(true); setMsg('');
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('file', file);
    try {
      await api.post('/teacher/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('✅ Note uploaded successfully!');
      setForm({ title: '', description: '' }); setFile(null);
    } catch { setMsg('❌ Upload failed'); }
    setUploading(false);
  };

  return (
    <div className="card">
      <div className="card-header"><h4>📤 Upload Study Notes</h4></div>
      <div className="card-body" style={{ maxWidth: 560 }}>
        {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label className="form-label">Note Title *</label>
            <input className="form-input" placeholder="e.g. Chapter 5 — Algebraic Expressions"
              value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} placeholder="Brief description..."
              value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Upload File (PDF, DOC, PPT, Image)</label>
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg"
              onChange={e => setFile(e.target.files[0])}
              style={{ display: 'block', fontSize: 13, color: 'var(--neutral-9)' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? '⏳ Uploading...' : '📤 Upload Note'}
          </button>
        </form>
      </div>
    </div>
  );
}
