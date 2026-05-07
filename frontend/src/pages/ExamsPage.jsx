import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api from '../api/axios';

export default function ExamsPage() {
  const [exams,     setExams]     = useState([]);
  const [students,  setStudents]  = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState('');
  const [downloading, setDownloading] = useState('');

  const load = () => {
    api.get('/principal/exams').then(r => setExams(r.data)).catch(() => {});
    api.get('/principal/students').then(r => setStudents(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const createExam = async e => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/principal/exams', form);
      setMsg('✅ Exam created!'); setShowModal(false); setForm({}); load();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    setSaving(false);
  };

  const publishExam = async id => {
    await api.post(`/principal/exams/${id}/publish`);
    setMsg('✅ Exam published! Admit cards can now be generated.'); load();
  };

  const downloadAdmitCard = async (studentId, examId, studentName) => {
    setDownloading(`admit-${studentId}-${examId}`);
    try {
      const res = await api.get(`/principal/admit-card/${studentId}/${examId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `AdmitCard_${studentName}.pdf`;
      a.click();
    } catch { setMsg('❌ Error generating admit card'); }
    setDownloading('');
  };

  const downloadResultCard = async (studentId, examId, studentName) => {
    setDownloading(`result-${studentId}-${examId}`);
    try {
      const res = await api.get(`/principal/result-card/${studentId}/${examId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `ResultCard_${studentName}.pdf`;
      a.click();
    } catch { setMsg('❌ Error generating result card'); }
    setDownloading('');
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Exam Management" />
        <div className="page-body">

          <div className="page-header flex justify-between items-center">
            <div>
              <h2 className="page-title">Exams & Documents</h2>
              <p className="page-subtitle">Schedule exams, generate admit cards & result cards</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setShowModal(true); }}>
              📝 Schedule Exam
            </button>
          </div>

          {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

          {/* Exam Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 28 }}>
            {exams.map(exam => (
              <div className="card" key={exam.id}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ marginBottom: 4 }}>{exam.exam_name}</h4>
                      <span className={`badge ${exam.exam_type === 'FINAL' ? 'badge-error' : 'badge-info'}`}>
                        {exam.exam_type}
                      </span>
                    </div>
                    <span className={`badge ${exam.is_published ? 'badge-success' : 'badge-warning'}`}>
                      {exam.is_published ? '✅ Published' : '⏳ Draft'}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--neutral-6)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>📅 {exam.start_date} → {exam.end_date}</div>
                    <div>📚 Session: {exam.session}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {!exam.is_published && (
                      <button className="btn btn-sm" onClick={() => publishExam(exam.id)} style={{
                        background: '#eaf5ea', color: 'var(--success)',
                        border: 'none', cursor: 'pointer', borderRadius: 4,
                        padding: '5px 12px', fontSize: 11, fontWeight: 700,
                      }}>📢 Publish</button>
                    )}
                    {exam.is_published && (
                      <>
                        <button className="btn btn-neutral btn-sm" onClick={() => {
                          if (students.length) downloadAdmitCard(students[0].id, exam.id, students[0].name);
                          else setMsg('❌ No students found');
                        }} disabled={!!downloading}>
                          {downloading ? '⏳' : '🎟'} Admit Cards
                        </button>
                        <button className="btn btn-neutral btn-sm" onClick={() => {
                          if (students.length) downloadResultCard(students[0].id, exam.id, students[0].name);
                          else setMsg('❌ No students found');
                        }} disabled={!!downloading}>
                          {downloading ? '⏳' : '📊'} Result Cards
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!exams.length && (
              <div className="card" style={{ gridColumn: '1/-1' }}>
                <div className="card-body">
                  <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h4 style={{ color: 'var(--neutral-6)' }}>No exams scheduled yet</h4>
                    <p>Click "Schedule Exam" to create the first exam.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Admit Cards */}
          {exams.filter(e => e.is_published).length > 0 && students.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h4>📋 Generate Documents — All Students</h4>
                <span className="badge badge-info">{students.length} students</span>
              </div>
              <div className="card-body">
                <p style={{ marginBottom: 16 }}>
                  Select a published exam to generate admit cards or result cards for all students at once.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {exams.filter(e => e.is_published).map(exam => (
                    <div key={exam.id} style={{
                      border: '1px solid var(--neutral-2)', borderRadius: 8, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{exam.exam_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--neutral-6)' }}>{exam.session}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-neutral btn-sm"
                          onClick={() => students.forEach(s => downloadAdmitCard(s.id, exam.id, s.name))}>
                          🎟 All Admit Cards
                        </button>
                        <button className="btn btn-neutral btn-sm"
                          onClick={() => students.forEach(s => downloadResultCard(s.id, exam.id, s.name))}>
                          📊 All Result Cards
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Create Exam Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>📝 Schedule New Exam</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={createExam}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Exam Name *</label>
                  <input className="form-input" required placeholder="e.g. Half Yearly Examination 2024"
                    onChange={e => setForm(f => ({...f, exam_name: e.target.value}))} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Exam Type</label>
                    <select className="form-select" onChange={e => setForm(f => ({...f, exam_type: e.target.value}))}>
                      <option value="MID_TERM">Mid Term</option>
                      <option value="FINAL">Final / Annual</option>
                      <option value="UNIT_TEST">Unit Test</option>
                      <option value="PRE_BOARD">Pre Board</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session</label>
                    <input className="form-input" defaultValue="2024-25"
                      onChange={e => setForm(f => ({...f, session: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input className="form-input" type="date" required
                      onChange={e => setForm(f => ({...f, start_date: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input className="form-input" type="date" required
                      onChange={e => setForm(f => ({...f, end_date: e.target.value}))} />
                  </div>
                </div>
                <div className="alert alert-info" style={{ marginTop: 0 }}>
                  💡 After creating, publish the exam to enable admit card generation for all students.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-neutral" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : '📝 Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
