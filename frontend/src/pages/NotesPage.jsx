import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api     from '../api/axios';
import toast   from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const FILE_ICONS = {
  pdf:  { icon: '📄', color: '#ba0517', bg: '#fef1ee' },
  doc:  { icon: '📝', color: '#0176d3', bg: '#e8f4fd' },
  docx: { icon: '📝', color: '#0176d3', bg: '#e8f4fd' },
  ppt:  { icon: '📊', color: '#dd7a01', bg: '#fef5e4' },
  pptx: { icon: '📊', color: '#dd7a01', bg: '#fef5e4' },
  txt:  { icon: '📃', color: '#747474', bg: '#f1f1f1' },
  png:  { icon: '🖼️', color: '#2e844a', bg: '#eaf5ea' },
  jpg:  { icon: '🖼️', color: '#2e844a', bg: '#eaf5ea' },
};

function FileIcon({ filename }) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  const info = FILE_ICONS[ext] || { icon: '📁', color: '#747474', bg: '#f1f1f1' };
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 8,
      background: info.bg, color: info.color,
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 20, flexShrink: 0,
    }}>
      {info.icon}
    </div>
  );
}

export default function NotesPage() {
  const { user } = useAuth();
  const [notes,      setNotes]      = useState([]);
  const [classes,    setClasses]    = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [filterClass,setFilterClass]= useState('');
  const [search,     setSearch]     = useState('');
  const [msg,        setMsg]        = useState({ text: '', type: '' });
  const fileRef = useRef();

  const [form, setForm] = useState({
    title: '', description: '', class_id: '', subject_id: '',
  });
  const [file, setFile] = useState(null);

  const isTeacher   = user?.role === 'TEACHER';
  const isPrincipal = user?.role === 'PRINCIPAL';
  const canUpload   = isTeacher || isPrincipal;

  function flash(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
    if (type === 'success') toast.success(text.replace(/^✅\s*/, ''));
    else toast.error(text.replace(/^❌\s*/, ''));
  }

  async function load() {
    setLoading(true);
    try {
      const q = filterClass ? `?class_id=${filterClass}` : '';
      const [notesRes, classRes] = await Promise.all([
        api.get(`/teacher/notes${q}`),
        api.get('/principal/classes'),
      ]);
      setNotes(notesRes.data || []);
      setClasses(classRes.data || []);
    } catch {
      flash('❌ Notes load nahi hue', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterClass]);

  async function loadSubjects(class_id) {
    if (!class_id) { setSubjects([]); return; }
    try {
      const res = await api.get(`/principal/classes/${class_id}/subjects`);
      setSubjects(res.data || []);
    } catch {
      setSubjects([]);
    }
  }

  async function uploadNote(e) {
    e.preventDefault();
    if (!form.title) { flash('❌ Title zaroori hai', 'error'); return; }
    if (!file)       { flash('❌ File select karo', 'error'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title',       form.title);
      fd.append('description', form.description);
      fd.append('class_id',    form.class_id);
      fd.append('subject_id',  form.subject_id);
      fd.append('file',        file);

      await api.post('/teacher/notes', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      flash('✅ Note upload ho gaya');
      setShowModal(false);
      setForm({ title: '', description: '', class_id: '', subject_id: '' });
      setFile(null);
      load();
    } catch (err) {
      flash(err.response?.data?.error || '❌ Upload nahi hua', 'error');
    }
    setUploading(false);
  }

  const filtered = notes.filter(n => {
    const q = search.toLowerCase();
    return !q
      || n.title?.toLowerCase().includes(q)
      || n.description?.toLowerCase().includes(q)
      || n.file_name?.toLowerCase().includes(q);
  });

  // Group by class
  const classMap = classes.reduce((a, c) => {
    a[c.id] = `${c.name} — ${c.section}`; return a;
  }, {});

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Notes & Materials" />
        <div className="page-body">

          {/* Header */}
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="page-title">Notes & Study Materials</h2>
              <p className="page-subtitle">Teachers ke uploaded notes aur study materials</p>
            </div>
            {canUpload && (
              <button className="btn btn-primary" onClick={() => {
                setForm({ title: '', description: '', class_id: '', subject_id: '' });
                setFile(null);
                setShowModal(true);
              }}>
                📤 Upload Note
              </button>
            )}
          </div>

          {/* Alert */}
          {msg.text && (
            <div style={{
              padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13,
              background: msg.type === 'error' ? '#fef1ee' : '#eaf5ea',
              color:      msg.type === 'error' ? '#ba0517' : '#2e844a',
              border: `1px solid ${msg.type === 'error' ? '#f9c9c0' : '#a3d9a5'}`,
            }}>{msg.text}</div>
          )}

          {/* Stat cards */}
          <div className="grid-4 mb-6">
            {[
              { icon: '📚', label: 'Total Notes',  value: notes.length,   color: '#0176d3', bg: '#e8f4fd' },
              { icon: '📄', label: 'PDFs',         value: notes.filter(n => n.file_name?.endsWith('.pdf')).length,  color: '#ba0517', bg: '#fef1ee' },
              { icon: '📝', label: 'Documents',    value: notes.filter(n => ['doc','docx'].some(e => n.file_name?.endsWith(e))).length, color: '#5867e8', bg: '#f3f0ff' },
              { icon: '🖼️', label: 'Images',       value: notes.filter(n => ['png','jpg','jpeg'].some(e => n.file_name?.endsWith(e))).length, color: '#2e844a', bg: '#eaf5ea' },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon" style={{ background: s.bg }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                </div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '14px 20px' }}>
              <input
                className="form-input"
                placeholder="🔍 Title ya file name search..."
                style={{ maxWidth: 260 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select className="form-select" style={{ width: 200 }}
                value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
                ))}
              </select>
              {(search || filterClass) && (
                <button className="btn btn-neutral btn-sm"
                  onClick={() => { setSearch(''); setFilterClass(''); }}>
                  ✕ Clear
                </button>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--neutral-6)', alignSelf: 'center' }}>
                {filtered.length} notes
              </span>
            </div>
          </div>

          {/* Notes Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--neutral-6)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <p>Koi note nahi mila</p>
                {canUpload && (
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }}
                    onClick={() => setShowModal(true)}>
                    📤 Pehla Note Upload Karo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}>
              {filtered.map(n => (
                <div key={n.id} className="card" style={{
                  transition: 'box-shadow 0.15s, transform 0.15s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  <div className="card-body" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <FileIcon filename={n.file_name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: 'var(--neutral-9)', marginBottom: 4,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{n.title}</div>
                        {n.description && (
                          <div style={{
                            fontSize: 12, color: 'var(--neutral-6)',
                            marginBottom: 6, overflow: 'hidden',
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>{n.description}</div>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {n.subject_id && (
                            <span style={{
                              background: '#f3f0ff', color: '#5867e8',
                              fontSize: 10, fontWeight: 700,
                              padding: '2px 8px', borderRadius: 20,
                            }}>📚 Subject</span>
                          )}
                          {n.file_name && (
                            <span style={{
                              background: 'var(--neutral-1)', color: 'var(--neutral-6)',
                              fontSize: 10, padding: '2px 8px', borderRadius: 20,
                              overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140,
                              whiteSpace: 'nowrap',
                            }}>{n.file_name}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--neutral-6)' }}>
                          🕒 {formatDate(n.uploaded_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer" style={{
                    display: 'flex', justifyContent: 'flex-end', gap: 8,
                    padding: '10px 16px',
                  }}>
                    {n.file_url && (
                      <a href={n.file_url} target="_blank" rel="noreferrer"
                        className="btn btn-primary btn-sm">
                        👁️ View
                      </a>
                    )}
                    {n.file_url && (
                      <a href={n.file_url} download={n.file_name}
                        className="btn btn-neutral btn-sm">
                        ⬇️ Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Upload Modal ── */}
      {showModal && (
        <div className="modal-backdrop"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>📤 Note Upload Karo</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={uploadNote}>
              <div className="modal-body">

                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" required
                    placeholder="e.g. Chapter 5 - Algebra Notes"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea className="form-textarea" rows={2}
                    placeholder="Koi detail..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    style={{ width: '100%' }} />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Class</label>
                    <select className="form-select"
                      value={form.class_id}
                      onChange={e => {
                        setForm(f => ({ ...f, class_id: e.target.value, subject_id: '' }));
                        loadSubjects(e.target.value);
                      }}>
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — {c.section}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <select className="form-select"
                      value={form.subject_id}
                      onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                      disabled={!subjects.length}>
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* File Upload */}
                <div className="form-group">
                  <label className="form-label">File *</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: '2px dashed var(--neutral-2)',
                      borderRadius: 8, padding: '20px',
                      textAlign: 'center', cursor: 'pointer',
                      background: file ? '#f0fdf4' : '#fafafa',
                      borderColor: file ? '#2e844a' : 'var(--neutral-2)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => !file && (e.currentTarget.style.borderColor = '#0176d3')}
                    onMouseLeave={e => !file && (e.currentTarget.style.borderColor = 'var(--neutral-2)')}
                  >
                    {file ? (
                      <div>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>✅</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2e844a' }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--neutral-6)' }}>
                          {(file.size / 1024).toFixed(1)} KB — Click to change
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-9)' }}>
                          File drag karo ya click karo
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--neutral-6)', marginTop: 4 }}>
                          PDF, DOC, DOCX, PPT, PPTX, TXT, PNG, JPG (max 16MB)
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files[0] || null)}
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-neutral"
                  onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? '⏳ Uploading...' : '📤 Upload Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
