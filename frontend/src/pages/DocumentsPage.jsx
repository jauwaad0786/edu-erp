import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api     from '../api/axios';
import toast   from 'react-hot-toast';

export default function DocumentsPage() {
  const [notes,    setNotes]    = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [filter,   setFilter]   = useState('');
  const [selClass, setSelClass] = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/teacher/notes').catch(function() { return { data: [] }; }),
      api.get('/principal/classes').catch(function() { return { data: [] }; }),
    ]).then(function(results) {
      var n = results[0];
      var c = results[1];
      setNotes(n.data || []);
      setClasses(c.data || []);
    }).catch(function() {
      toast.error('Documents load nahi hue');
    }).finally(function() { setLoading(false); });
  }, []);

  var filtered = notes.filter(function(n) {
    var q = filter.toLowerCase();
    var matchSearch = !q || (n.title && n.title.toLowerCase().includes(q)) ||
      (n.description && n.description.toLowerCase().includes(q));
    var matchClass = !selClass || String(n.class_id) === String(selClass);
    return matchSearch && matchClass;
  });

  var EXT_ICON = {
    pdf: '📄', doc: '📝', docx: '📝',
    ppt: '📊', pptx: '📊', txt: '📃',
    png: '🖼', jpg: '🖼',
  };

  function getIcon(filename) {
    var ext = filename && filename.split('.').pop() && filename.split('.').pop().toLowerCase();
    return EXT_ICON[ext] || '📎';
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Documents" />
        <div className="page-body">

          <div className="page-header">
            <h2 className="page-title">📄 Documents & Notes</h2>
            <p className="page-subtitle">Teachers dwara upload kiye gaye study materials</p>
          </div>

          <div className="card mb-6">
            <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                className="form-input"
                placeholder="🔍 Search by title..."
                style={{ maxWidth: 280 }}
                value={filter}
                onChange={function(e) { setFilter(e.target.value); }}
              />
              <select
                className="form-select"
                style={{ maxWidth: 200 }}
                value={selClass}
                onChange={function(e) { setSelClass(e.target.value); }}
              >
                <option value="">All Classes</option>
                {classes.map(function(c) {
                  return (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  );
                })}
              </select>
              <div style={{
                marginLeft: 'auto', fontSize: 13,
                color: 'var(--neutral-6)', display: 'flex', alignItems: 'center',
              }}>
                {filtered.length} documents
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--neutral-5)' }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <p>Koi document nahi mila</p>
                  <p style={{ fontSize: 12, color: 'var(--neutral-5)', marginTop: 6 }}>
                    Teachers dashboard se notes upload kar sakte hain
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {filtered.map(function(note) {
                return (
                  <div key={note.id} className="card" style={{ cursor: 'pointer' }}>
                    <div className="card-body" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: 'var(--blue-10)',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 22, flexShrink: 0,
                        }}>
                          {getIcon(note.file_name)}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{
                            fontWeight: 700, fontSize: 13,
                            color: 'var(--neutral-9)',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>{note.title}</div>
                          {note.description && (
                            <div style={{
                              fontSize: 11, color: 'var(--neutral-6)',
                              marginTop: 2, lineHeight: 1.4,
                            }}>
                              {note.description.slice(0, 60)}
                              {note.description.length > 60 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        {note.class_id && (
                          <span style={{
                            background: 'var(--blue-10)', color: 'var(--blue-80)',
                            padding: '2px 8px', borderRadius: 4,
                            fontSize: 11, fontWeight: 600,
                          }}>
                            {(classes.find(function(c) { return String(c.id) === String(note.class_id); }) || {}).name || 'Class'}
                          </span>
                        )}
                        <span style={{
                          background: 'var(--neutral-1)', color: 'var(--neutral-6)',
                          padding: '2px 8px', borderRadius: 4, fontSize: 11,
                        }}>
                          {note.file_name && note.file_name.split('.').pop() ? note.file_name.split('.').pop().toUpperCase() : 'FILE'}
                        </span>
                        <span style={{
                          background: 'var(--neutral-1)', color: 'var(--neutral-6)',
                          padding: '2px 8px', borderRadius: 4, fontSize: 11,
                        }}>
                          {note.uploaded_at
                            ? new Date(note.uploaded_at).toLocaleDateString('en-IN')
                            : '-'}
                        </span>
                      </div>

                      {note.file_url && (
                        <a
                          href={note.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--blue-60)', color: '#fff',
                            padding: '7px 14px', borderRadius: 6,
                            fontSize: 12, fontWeight: 600,
                            textDecoration: 'none',
                            width: 'fit-content',
                          }}
                        >
                          📥 Download
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
