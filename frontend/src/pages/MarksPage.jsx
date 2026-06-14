import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api     from '../api/axios';
import toast   from 'react-hot-toast';

/* ── grade helper (mirrors backend _grade) ── */
function _grade(marks, max) {
  const pct = max ? (marks / max) * 100 : 0;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
}

const GRADE_COLOR = {
  'A+': '#2e844a', 'A': '#2e844a', 'B+': '#0176d3', 'B': '#0176d3',
  'C': '#dd7a01', 'D': '#dd7a01', 'F': '#ba0517', 'AB': '#747474', '—': '#c9c9c9',
};
const gradeColor = g => GRADE_COLOR[g] || '#747474';
const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

/* ════════════════════════════ TopperCard ════════════════════════════ */
function TopperCard({ icon, title, subtitle, toppers, loading, valueLabel = 'percentage', onStudentClick }) {
  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: 'var(--neutral-6)' }}>{subtitle}</div>}
        </div>
      </div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="marks-skel" style={{ height: 46, borderRadius: 8 }} />
            ))}
          </div>
        ) : toppers.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--neutral-6)', textAlign: 'center', padding: '20px 0' }}>
            No results yet for this selection
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {toppers.map(t => (
              <div
                key={t.student_id}
                onClick={() => onStudentClick(t.student_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  borderRadius: 8, border: '1px solid var(--neutral-2)', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutral-1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>
                  {RANK_MEDAL[t.rank] || `#${t.rank}`}
                </span>
                <div className="avatar avatar-sm" style={{ background: 'var(--blue-10)', color: 'var(--blue-80)' }}>
                  {(t.name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--neutral-6)' }}>
                    {t.class_name}
                    {t.roll_number ? ` · Roll ${t.roll_number}` : ''}
                    {t.subject_name ? ` · ${t.subject_name}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--blue-80)' }}>
                    {valueLabel === 'marks' ? `${t.marks_obtained}/${t.max_marks}` : `${t.percentage}%`}
                  </div>
                  <span className="badge" style={{ background: `${gradeColor(t.grade)}1A`, color: gradeColor(t.grade) }}>
                    {t.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════ MarksPage ════════════════════════════ */
export default function MarksPage() {
  const navigate = useNavigate();

  const [classes, setClasses]   = useState([]);
  const [exams, setExams]       = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [classId, setClassId]     = useState('');
  const [examId, setExamId]       = useState('');
  const [subjectId, setSubjectId] = useState('');

  const [roster, setRoster] = useState(null);
  const [rows, setRows]     = useState([]);
  const [search, setSearch] = useState('');

  const [schoolToppers, setSchoolToppers]   = useState([]);
  const [classToppers, setClassToppers]     = useState([]);
  const [subjectToppers, setSubjectToppers] = useState([]);

  const [loadingRoster, setLoadingRoster] = useState(false);
  const [loadingToppers, setLoadingToppers] = useState({ school: false, cls: false, subj: false });
  const [saving, setSaving] = useState(false);

  /* ── classes + exams ── */
  useEffect(() => {
    Promise.all([api.get('/principal/classes'), api.get('/principal/exams')])
      .then(([c, e]) => {
        setClasses(c.data || []);
        setExams(e.data || []);
      })
      .catch(() => toast.error('Classes/Exams load nahi hue'));
  }, []);

  /* ── subjects for selected class ── */
  useEffect(() => {
    if (!classId) { setSubjects([]); setSubjectId(''); return; }
    api.get(`/principal/classes/${classId}/subjects`)
      .then(res => setSubjects(res.data || []))
      .catch(() => toast.error('Subjects load nahi hue'));
    setSubjectId('');
  }, [classId]);

  /* ── topper fetchers ── */
  const fetchSchoolToppers = useCallback(() => {
    if (!examId) { setSchoolToppers([]); return; }
    setLoadingToppers(p => ({ ...p, school: true }));
    api.get(`/marks/toppers/school?exam_id=${examId}`)
      .then(res => setSchoolToppers(res.data || []))
      .catch(() => setSchoolToppers([]))
      .finally(() => setLoadingToppers(p => ({ ...p, school: false })));
  }, [examId]);

  const fetchClassToppers = useCallback(() => {
    if (!examId || !classId) { setClassToppers([]); return; }
    setLoadingToppers(p => ({ ...p, cls: true }));
    api.get(`/marks/toppers/class?exam_id=${examId}&class_id=${classId}`)
      .then(res => setClassToppers(res.data || []))
      .catch(() => setClassToppers([]))
      .finally(() => setLoadingToppers(p => ({ ...p, cls: false })));
  }, [examId, classId]);

  const fetchSubjectToppers = useCallback(() => {
    if (!examId || !subjectId) { setSubjectToppers([]); return; }
    setLoadingToppers(p => ({ ...p, subj: true }));
    api.get(`/marks/toppers/subject?exam_id=${examId}&subject_id=${subjectId}&class_id=${classId || ''}`)
      .then(res => setSubjectToppers(res.data || []))
      .catch(() => setSubjectToppers([]))
      .finally(() => setLoadingToppers(p => ({ ...p, subj: false })));
  }, [examId, subjectId, classId]);

  useEffect(() => { fetchSchoolToppers(); },  [fetchSchoolToppers]);
  useEffect(() => { fetchClassToppers(); },   [fetchClassToppers]);
  useEffect(() => { fetchSubjectToppers(); }, [fetchSubjectToppers]);

  /* ── roster ── */
  const loadRoster = useCallback(() => {
    if (!classId || !examId || !subjectId) { setRoster(null); setRows([]); return; }
    setLoadingRoster(true);
    api.get(`/marks/roster?class_id=${classId}&exam_id=${examId}&subject_id=${subjectId}`)
      .then(res => {
        setRoster(res.data);
        setRows(res.data.students.map(s => ({ ...s })));
      })
      .catch(() => toast.error('Roster load nahi hua'))
      .finally(() => setLoadingRoster(false));
  }, [classId, examId, subjectId]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  function updateRow(student_id, field, value) {
    setRows(prev => prev.map(r => (r.student_id === student_id ? { ...r, [field]: value } : r)));
  }

  async function handleSave() {
    if (!roster) return;
    const max = roster.max_marks;
    for (const r of rows) {
      if (!r.is_absent && r.marks_obtained !== '' && r.marks_obtained !== null &&
          (Number(r.marks_obtained) < 0 || Number(r.marks_obtained) > max)) {
        toast.error(`${r.name}: marks 0–${max} ke beech hone chahiye`);
        return;
      }
    }
    setSaving(true);
    try {
      await api.post('/marks/save', {
        class_id: classId, exam_id: examId, subject_id: subjectId,
        entries: rows.map(r => ({
          student_id: r.student_id,
          marks_obtained: r.is_absent ? 0 : Number(r.marks_obtained || 0),
          is_absent: !!r.is_absent,
          remarks: r.remarks || '',
        })),
      });
      toast.success('Marks saved successfully');
      loadRoster();
      fetchSchoolToppers();
      fetchClassToppers();
      fetchSubjectToppers();
    } catch {
      toast.error('Marks save nahi hue');
    }
    setSaving(false);
  }

  const filteredRows = rows.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.roll_number || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedClass   = classes.find(c => String(c.id) === String(classId));
  const selectedSubject = subjects.find(s => String(s.id) === String(subjectId));
  const selectedExam    = exams.find(e => String(e.id) === String(examId));

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Marks Management" />
        <div className="page-body">
          <style>{`
            @keyframes marksShimmer {
              0% { background-position: -200px 0; }
              100% { background-position: calc(200px + 100%) 0; }
            }
            .marks-skel {
              background: linear-gradient(90deg, var(--neutral-1) 25%, var(--neutral-2) 37%, var(--neutral-1) 63%);
              background-size: 400px 100%;
              animation: marksShimmer 1.4s ease-in-out infinite;
            }
            .marks-table thead th { position: sticky; top: 0; z-index: 2; }
          `}</style>

          <div className="page-header">
            <div>
              <h2 className="page-title">Marks Management</h2>
              <p className="page-subtitle">Class-wise, subject-wise marks entry &amp; topper analytics</p>
            </div>
          </div>

          {/* ── filters ── */}
          <div className="card mb-6">
            <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ minWidth: 180, marginBottom: 0 }}>
                <label className="form-label">Class</label>
                <select className="form-select" value={classId} onChange={e => setClassId(e.target.value)}>
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ minWidth: 220, marginBottom: 0 }}>
                <label className="form-label">Exam</label>
                <select className="form-select" value={examId} onChange={e => setExamId(e.target.value)}>
                  <option value="">Select exam</option>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_name} ({ex.session})</option>)}
                </select>
              </div>
              <div className="form-group" style={{ minWidth: 200, marginBottom: 0 }}>
                <label className="form-label">Subject</label>
                <select className="form-select" value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!classId}>
                  <option value="">{classId ? 'Select subject' : 'Select class first'}</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {roster && (
                <div style={{ fontSize: 12, color: 'var(--neutral-6)', paddingBottom: 8 }}>
                  Max Marks: <strong>{roster.max_marks}</strong> &nbsp;|&nbsp; Pass Marks: <strong>{roster.pass_marks}</strong>
                </div>
              )}
            </div>
          </div>

          {/* ── topper cards ── */}
          <div className="grid-3 mb-6">
            <TopperCard
              icon="🏆" title="Overall School Toppers"
              subtitle={selectedExam ? selectedExam.exam_name : 'Select an exam'}
              toppers={schoolToppers} loading={loadingToppers.school}
              onStudentClick={id => navigate(`/students/${id}`)}
            />
            <TopperCard
              icon="🎓" title="Class Toppers"
              subtitle={selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : 'Select a class'}
              toppers={classToppers} loading={loadingToppers.cls}
              onStudentClick={id => navigate(`/students/${id}`)}
            />
            <TopperCard
              icon="📘" title="Subject Toppers"
              subtitle={selectedSubject ? selectedSubject.name : 'Select a subject'}
              toppers={subjectToppers} loading={loadingToppers.subj} valueLabel="marks"
              onStudentClick={id => navigate(`/students/${id}`)}
            />
          </div>

          {/* ── entry table ── */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                Marks Entry
                {selectedClass && selectedExam && selectedSubject &&
                  ` — ${selectedClass.name} ${selectedClass.section} · ${selectedExam.exam_name} · ${selectedSubject.name}`}
              </div>
              {roster && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="form-input" style={{ width: 200 }}
                    placeholder="🔍 Search student / roll no"
                    value={search} onChange={e => setSearch(e.target.value)}
                  />
                  <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
                    {saving ? 'Saving…' : '💾 Save Marks'}
                  </button>
                </div>
              )}
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {(!classId || !examId || !subjectId) ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--neutral-6)', fontSize: 13 }}>
                  Select Class, Exam and Subject above to start entering marks.
                </div>
              ) : loadingRoster ? (
                <div style={{ padding: 16 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="marks-skel" style={{ height: 38, borderRadius: 6, marginBottom: 8 }} />
                  ))}
                </div>
              ) : filteredRows.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--neutral-6)', fontSize: 13 }}>
                  No students found.
                </div>
              ) : (
                <div className="table-container marks-table" style={{ maxHeight: 520, overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 50 }}>Roll No</th>
                        <th>Student Name</th>
                        <th style={{ width: 140 }}>Marks (out of {roster.max_marks})</th>
                        <th style={{ width: 90 }}>Absent</th>
                        <th style={{ width: 90 }}>Grade</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map(r => {
                        const grade = r.is_absent
                          ? 'AB'
                          : (r.marks_obtained === '' || r.marks_obtained === null
                              ? '—'
                              : _grade(Number(r.marks_obtained), roster.max_marks));
                        return (
                          <tr key={r.student_id}>
                            <td>{r.roll_number}</td>
                            <td style={{ fontWeight: 600 }}>{r.name}</td>
                            <td>
                              <input
                                type="number" className="form-input"
                                style={{ width: 90, padding: '6px 10px' }}
                                min={0} max={roster.max_marks}
                                disabled={r.is_absent}
                                value={r.marks_obtained ?? ''}
                                onChange={e => updateRow(r.student_id, 'marks_obtained', e.target.value)}
                                placeholder="—"
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox" checked={!!r.is_absent}
                                onChange={e => updateRow(r.student_id, 'is_absent', e.target.checked)}
                              />
                            </td>
                            <td>
                              <span className="badge" style={{ background: `${gradeColor(grade)}1A`, color: gradeColor(grade) }}>
                                {grade}
                              </span>
                            </td>
                            <td>
                              <input
                                type="text" className="form-input" style={{ padding: '6px 10px' }}
                                value={r.remarks || ''} placeholder="Optional remarks"
                                onChange={e => updateRow(r.student_id, 'remarks', e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
