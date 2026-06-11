import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ── ID Card Live Preview Component ───────────────────────────────────────────
function IDCardPreview({ student, school }) {
  if (!student) return null;

  const sname  = school  || {};
  const s      = student || {};

  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>

      {/* FRONT */}
      <div style={{ width: 200 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#64748b',
          textAlign: 'center', marginBottom: 6, letterSpacing: 1,
        }}>FRONT SIDE</div>
        <div style={{
          width: 200, borderRadius: 10,
          boxShadow: '0 8px 24px rgba(1,118,211,0.18), 0 2px 6px rgba(0,0,0,0.08)',
          overflow: 'hidden', border: '1.5px solid #bae6fd',
          fontFamily: 'Arial, sans-serif',
          background: '#fff',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #032d60 0%, #0176d3 100%)',
            padding: '10px 10px 0',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {sname.logo_url
              ? <img src={sname.logo_url} alt="logo"
                  style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'contain', background: '#fff', padding: 2 }} />
              : <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#1e40af', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>EDU</div>
            }
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: 8.5, fontWeight: 800, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                letterSpacing: 0.3, textTransform: 'uppercase',
              }}>{sname.name || 'School Name'}</div>
              <div style={{ fontSize: 6.5, color: '#93c5fd', marginTop: 1 }}>
                {sname.city || sname.address || ''}
              </div>
            </div>
            <div style={{
              fontSize: 5.5, fontWeight: 800, color: '#fbbf24',
              textAlign: 'right', lineHeight: 1.2,
            }}>STUDENT<br/>ID CARD</div>
          </div>
          {/* Gold stripe */}
          <div style={{ height: 3, background: 'linear-gradient(90deg,#f0a500,#fbbf24)' }} />

          {/* Photo + Name */}
          <div style={{ padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: '#e8f4fd', border: '2.5px solid #0176d3',
              overflow: 'hidden', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: 6,
            }}>
              {s.photo_url
                ? <img src={s.photo_url} alt="photo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 20, color: '#0176d3' }}>👤</span>
              }
            </div>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#032d60',
              textTransform: 'uppercase', letterSpacing: 0.3,
              textAlign: 'center', lineHeight: 1.2,
            }}>{s.name || 'Student Name'}</div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#e0e9ff', margin: '0 10px' }} />

          {/* Info Grid */}
          <div style={{ padding: '7px 10px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 4px' }}>
            {[
              ['Roll No.',  s.roll_number  || '—'],
              ['Blood Gr.', s.blood_group  || '—'],
              ['Adm. No.',  s.admission_no || '—'],
              ['Father',    (s.father_name || '—').slice(0,12)],
              ['Class',     s.class_name   || '—'],
              ['Mobile',    s.parent_phone || '—'],
              ['Session',   s.session      || '—'],
              ['DOB',       (s.dob || '—').slice(0,10)],
            ].map(function([label, val]) {
              return (
                <div key={label}>
                  <div style={{ fontSize: 5.5, color: '#94a3b8', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 6.5, color: '#0f172a', fontWeight: 700, lineHeight: 1.2 }}>{val}</div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            background: '#032d60', padding: '4px 8px',
            fontSize: 5.5, color: '#93c5fd', textAlign: 'center',
          }}>
            If found, return to school &nbsp;|&nbsp; {sname.phone || ''}
          </div>
        </div>
      </div>

      {/* BACK */}
      <div style={{ width: 200 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#64748b',
          textAlign: 'center', marginBottom: 6, letterSpacing: 1,
        }}>BACK SIDE</div>
        <div style={{
          width: 200, borderRadius: 10,
          boxShadow: '0 8px 24px rgba(1,118,211,0.18), 0 2px 6px rgba(0,0,0,0.08)',
          overflow: 'hidden', border: '1.5px solid #bae6fd',
          fontFamily: 'Arial, sans-serif', background: '#fff',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #032d60, #0176d3)', padding: '8px 10px' }}>
            <div style={{ fontSize: 8, fontWeight: 800, color: '#fff', textAlign: 'center', letterSpacing: 0.5 }}>
              STUDENT IDENTITY CARD
            </div>
            <div style={{ fontSize: 6, color: '#93c5fd', textAlign: 'center', marginTop: 1 }}>
              {sname.name || ''}
            </div>
          </div>
          <div style={{ height: 2, background: 'linear-gradient(90deg,#f0a500,#fbbf24)' }} />

          {/* QR placeholder */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
            <div style={{
              width: 55, height: 55, background: '#f1f5f9',
              border: '1.5px solid #bae6fd', borderRadius: 4,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 2,
            }}>
              <div style={{ fontSize: 18 }}>⬛</div>
              <div style={{ fontSize: 5.5, color: '#64748b', fontWeight: 600 }}>QR CODE</div>
            </div>
          </div>
          <div style={{ fontSize: 6, fontWeight: 700, color: '#0176d3', textAlign: 'center', marginBottom: 6 }}>
            SCAN TO VERIFY
          </div>

          {/* School info */}
          <div style={{
            margin: '0 8px 6px', background: '#f1f5f9',
            borderRadius: 4, padding: '5px 7px',
            fontSize: 5.5, color: '#475569',
          }}>
            <div style={{ fontWeight: 700, color: '#032d60', fontSize: 6 }}>{sname.name || ''}</div>
            <div>{sname.address || sname.city || ''}</div>
            <div>Ph: {sname.phone || ''} &nbsp; {sname.email || ''}</div>
          </div>

          {/* Terms */}
          <div style={{ margin: '0 8px 6px' }}>
            <div style={{ fontSize: 5.5, fontWeight: 800, color: '#0176d3', marginBottom: 3 }}>
              TERMS &amp; CONDITIONS
            </div>
            {[
              'Card must be carried at all times.',
              'Lost card must be reported immediately.',
              'This card is property of the school.',
            ].map(function(t, i) {
              return <div key={i} style={{ fontSize: 5, color: '#475569', marginBottom: 1.5 }}>• {t}</div>;
            })}
          </div>

          {/* Signature */}
          <div style={{ margin: '0 8px', borderTop: '0.5px solid #cbd5e1', paddingTop: 4, paddingBottom: 4 }}>
            <div style={{ width: 50, borderBottom: '0.5px solid #94a3b8', marginBottom: 2 }} />
            <div style={{ fontSize: 5.5, fontWeight: 700, color: '#032d60' }}>Principal Signature</div>
          </div>

          {/* Footer */}
          <div style={{ background: '#032d60', padding: '4px 8px', fontSize: 5.5, color: '#fbbf24', textAlign: 'center', fontWeight: 700 }}>
            Valid For Session: {s.session || '2024-25'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IDCardPage() {
  const [classes,    setClasses]    = useState([]);
  const [students,   setStudents]   = useState([]);
  const [selClass,   setSelClass]   = useState('');
  const [selStudent, setSelStudent] = useState('');
  const [preview,    setPreview]    = useState(null);  // { student, school }
  const [loading,    setLoading]    = useState(false);
  const [bulkLoading,setBulkLoading]= useState(false);
  const [search,     setSearch]     = useState('');

  // Load classes on mount
  useEffect(function() {
    api.get('/principal/classes').then(function(r) {
      var raw = r.data;
      setClasses(Array.isArray(raw) ? raw : (raw.data || []));
    }).catch(function() {});
  }, []);

  // Load students when class changes
  useEffect(function() {
    if (!selClass) { setStudents([]); setSelStudent(''); setPreview(null); return; }
    setLoading(true);
    api.get('/principal/students?class_id=' + selClass + '&per_page=100')
      .then(function(r) {
        var raw = r.data;
        var list = Array.isArray(raw) ? raw : (Array.isArray(raw.data) ? raw.data : []);
        setStudents(list);
        setSelStudent('');
        setPreview(null);
      })
      .catch(function() { toast.error('Students load nahi hue'); })
      .finally(function() { setLoading(false); });
  }, [selClass]);

  // Load preview when student selected
  var loadPreview = useCallback(function(sid) {
    if (!sid) { setPreview(null); return; }
    api.get('/principal/id-cards/preview/' + sid)
      .then(function(r) { setPreview(r.data); })
      .catch(function() { toast.error('Preview load nahi hua'); });
  }, []);

  // Single download
  function downloadSingle(studentId, studentName) {
    var name = studentName || 'student';
    toast.loading('PDF ban raha hai...', { id: 'dl' });
    api.get('/principal/students/' + studentId + '/id-card', { responseType: 'blob' })
      .then(function(r) {
        var url  = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
        var link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'IDCard_' + name.replace(/ /g, '_') + '.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('ID Card download ho gayi!', { id: 'dl' });
      })
      .catch(function() { toast.error('Download failed', { id: 'dl' }); });
  }

  // Bulk download
  function downloadBulk() {
    if (!selClass) { toast.error('Pehle class select karo'); return; }
    setBulkLoading(true);
    toast.loading('ZIP ban raha hai...', { id: 'bulk' });
    api.get('/principal/id-cards/bulk?class_id=' + selClass, { responseType: 'blob' })
      .then(function(r) {
        var url  = window.URL.createObjectURL(new Blob([r.data], { type: 'application/zip' }));
        var link = document.createElement('a');
        link.href = url;
        var cls  = classes.find(function(c) { return String(c.id) === String(selClass); });
        link.setAttribute('download', 'IDCards_' + (cls ? cls.name + '_' + cls.section : 'Class') + '.zip');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('ZIP download ho gaya!', { id: 'bulk' });
      })
      .catch(function() { toast.error('Bulk download failed', { id: 'bulk' }); })
      .finally(function() { setBulkLoading(false); });
  }

  var filtered = students.filter(function(s) {
    if (!search) return true;
    var q = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(q)
      || (s.roll_number || '').toLowerCase().includes(q)
      || (s.admission_no || '').toLowerCase().includes(q);
  });

  var selCls = classes.find(function(c) { return String(c.id) === String(selClass); });

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="ID Card Management" />
        <div className="page-body">

          {/* Page Header */}
          <div className="page-header">
            <div>
              <h2 className="page-title">🪪 Student ID Card Management</h2>
              <p className="page-subtitle">
                Class-wise ID cards generate, preview aur download karo — single ya bulk ZIP
              </p>
            </div>
          </div>

          {/* ── Top Controls ── */}
          <div className="card mb-6">
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>

                {/* Class Select */}
                <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
                  <label className="form-label">📚 Class Select Karo</label>
                  <select
                    className="form-select"
                    value={selClass}
                    onChange={function(e) { setSelClass(e.target.value); }}
                  >
                    <option value="">— Class Choose Karo —</option>
                    {classes.map(function(c) {
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.section}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Search */}
                <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                  <label className="form-label">🔍 Student Search</label>
                  <input
                    className="form-input"
                    placeholder="Name / Roll No. / Adm. No..."
                    value={search}
                    onChange={function(e) { setSearch(e.target.value); }}
                  />
                </div>

                {/* Bulk Download */}
                {selClass && students.length > 0 && (
                  <button
                    className="btn btn-primary"
                    onClick={downloadBulk}
                    disabled={bulkLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-end' }}
                  >
                    {bulkLoading ? '⏳ Generating...' : '📦 Download All as ZIP'}
                  </button>
                )}
              </div>

              {/* Class info bar */}
              {selCls && (
                <div style={{
                  marginTop: 12, padding: '8px 12px',
                  background: '#e8f4fd', borderRadius: 6,
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 12, color: '#0176d3', fontWeight: 600,
                }}>
                  <span>📋 {selCls.name} — Section {selCls.section}</span>
                  <span style={{ color: '#94a3b8' }}>|</span>
                  <span>{students.length} students</span>
                  {students.length > 0 && (
                    <>
                      <span style={{ color: '#94a3b8' }}>|</span>
                      <span>Session: {selCls.session}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Main Layout: Table + Preview ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: 16, alignItems: 'start' }}>

            {/* Student Table */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>Students ({filtered.length})</h4>
                {selStudent && (
                  <span style={{
                    fontSize: 11, background: '#e8f4fd', color: '#0176d3',
                    padding: '3px 10px', borderRadius: 100, fontWeight: 700,
                  }}>
                    1 student selected
                  </span>
                )}
              </div>
              <div className="table-container">
                {loading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading students...</div>
                ) : !selClass ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <p>Pehle upar se class select karo</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🎒</div>
                    <p>Koi student nahi mila</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th>Roll No.</th>
                        <th>Adm. No.</th>
                        <th>Father</th>
                        <th>Blood Gr.</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(function(s, i) {
                        var isSelected = String(selStudent) === String(s.id);
                        return (
                          <tr
                            key={s.id}
                            style={{
                              background: isSelected ? '#eff6ff' : 'transparent',
                              cursor: 'pointer',
                              transition: 'background 0.1s',
                            }}
                            onClick={function() {
                              setSelStudent(s.id);
                              loadPreview(s.id);
                            }}
                          >
                            <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 30, height: 30, borderRadius: '50%',
                                  background: '#e8f4fd', overflow: 'hidden',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  {s.photo_url
                                    ? <img src={s.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <span style={{ fontSize: 14 }}>👤</span>
                                  }
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.gender || ''}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                background: '#eff6ff', color: '#0176d3',
                                padding: '2px 8px', borderRadius: 4,
                                fontSize: 11, fontWeight: 700,
                              }}>{s.roll_number || '—'}</span>
                            </td>
                            <td style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                              {s.admission_no || '—'}
                            </td>
                            <td style={{ fontSize: 12 }}>{s.father_name || s.parent_name || '—'}</td>
                            <td>
                              {s.blood_group
                                ? <span style={{
                                    background: '#fef1ee', color: '#ba0517',
                                    padding: '2px 8px', borderRadius: 4,
                                    fontSize: 11, fontWeight: 700,
                                  }}>{s.blood_group}</span>
                                : <span style={{ color: '#cbd5e1' }}>—</span>
                              }
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }} onClick={function(e) { e.stopPropagation(); }}>
                                {/* Preview */}
                                <button
                                  onClick={function() {
                                    setSelStudent(s.id);
                                    loadPreview(s.id);
                                  }}
                                  style={{
                                    background: '#f1f5f9', color: '#475569',
                                    border: 'none', borderRadius: 4,
                                    padding: '4px 9px', fontSize: 11,
                                    fontWeight: 600, cursor: 'pointer',
                                  }}
                                >
                                  👁 Preview
                                </button>
                                {/* Download */}
                                <button
                                  onClick={function() { downloadSingle(s.id, s.name); }}
                                  style={{
                                    background: '#e8f4fd', color: '#0176d3',
                                    border: 'none', borderRadius: 4,
                                    padding: '4px 9px', fontSize: 11,
                                    fontWeight: 700, cursor: 'pointer',
                                  }}
                                >
                                  📄 Download
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Live Preview Panel */}
            <div style={{ position: 'sticky', top: 80 }}>
              <div className="card">
                <div className="card-header">
                  <h4>🪪 Live Preview</h4>
                </div>
                <div className="card-body" style={{ padding: '20px 16px' }}>
                  {!preview ? (
                    <div style={{
                      padding: '32px 16px', textAlign: 'center',
                      color: '#94a3b8',
                    }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>🪪</div>
                      <div style={{ fontWeight: 600, color: '#475569', fontSize: 13 }}>
                        Student select karo
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        Table mein kisi bhi student pe click karo preview dekhne ke liye
                      </div>
                    </div>
                  ) : (
                    <>
                      <IDCardPreview
                        student={preview.student}
                        school={preview.school}
                      />
                      {/* Download button below preview */}
                      <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          className="btn btn-primary"
                          onClick={function() {
                            downloadSingle(preview.student.id, preview.student.name);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          📥 Download PDF
                        </button>
                      </div>

                      {/* Student quick info */}
                      <div style={{
                        marginTop: 14, padding: '10px 12px',
                        background: '#f8faff', borderRadius: 8,
                        border: '1px solid #e0e9ff', fontSize: 11,
                      }}>
                        <div style={{ fontWeight: 700, color: '#032d60', marginBottom: 6, fontSize: 12 }}>
                          📋 Student Details
                        </div>
                        {[
                          ['Name',    preview.student.name],
                          ['Class',   preview.student.class_name],
                          ['Roll No.',preview.student.roll_number],
                          ['Adm. No.',preview.student.admission_no],
                          ['Session', preview.student.session],
                          ['DOB',     preview.student.dob],
                        ].map(function(row) {
                          return (
                            <div key={row[0]} style={{
                              display: 'flex', justifyContent: 'space-between',
                              marginBottom: 3, color: '#475569',
                            }}>
                              <span style={{ color: '#94a3b8' }}>{row[0]}</span>
                              <strong style={{ color: '#0f172a' }}>{row[1] || '—'}</strong>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bulk info card */}
              {selClass && students.length > 0 && (
                <div className="card" style={{ marginTop: 12 }}>
                  <div className="card-body" style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#032d60', marginBottom: 8 }}>
                      📦 Bulk Download Info
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, lineHeight: 1.6 }}>
                      <strong>{students.length}</strong> students ke liye ZIP download hogi.<br/>
                      Folder structure:<br/>
                      <code style={{ fontSize: 10, background: '#f1f5f9', padding: '2px 6px', borderRadius: 3 }}>
                        ClassName/Roll-1/Name_IDCard.pdf
                      </code>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={downloadBulk}
                      disabled={bulkLoading}
                      style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: 6, alignItems: 'center' }}
                    >
                      {bulkLoading
                        ? '⏳ Generating ZIP...'
                        : '📦 Download Class ZIP (' + students.length + ' cards)'
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
