import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api     from '../api/axios';
import toast   from 'react-hot-toast';

const GENDERS  = ['Male', 'Female', 'Other'];
const SESSIONS = ['2024-25', '2025-26', '2026-27'];

export default function NewAdmissionPage() {
  const [classes, setClasses] = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({ text: '', type: '' });
  const [done,    setDone]    = useState(null); // admitted student data
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview,   setPhotoPreview]   = useState(null);
  const [schoolSlug,     setSchoolSlug]     = useState('school');
  const [pendingPhoto,   setPendingPhoto]   = useState(null);

  const [form, setForm] = useState({
    name:         '',
    class_id:     '',
    roll_number:  '',
    admission_no: '',
    gender:       '',
    dob:          '',
    session:      '2025-26',
    father_name:  '',
    mother_name:  '',
    parent_name:  '',
    parent_phone: '',
    parent_email: '',
    address:      '',
    password:     'Student@123',
  });

  useEffect(() => {
    api.get('/principal/classes')
      .then(r => setClasses(r.data || []))
      .catch(() => {});

    api.get('/principal/school/settings')
      .then(r => {
        const name = (r.data?.name || 'school').toLowerCase().replace(/[^a-z0-9]/g, '');
        setSchoolSlug(name || 'school');
      })
      .catch(() => {});
  }, []);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  function flash(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.parent_phone) {
      flash('❌ Student name aur parent phone zaroori hai', 'error');
      return;
    }
    setSaving(true);
    try {
      const firstName = (form.name || 'student').trim().split(/\s+/)[0].toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const autoEmail = `${firstName || 'student'}@${schoolSlug}.com`;

      const res = await api.post('/principal/students', {
        ...form,
        email: autoEmail,
      });

      // agar admission form pe photo pehle se select ki gayi thi, turant upload kardo
      if (pendingPhoto) {
        await uploadPhoto(res.data.id, pendingPhoto);
        setPendingPhoto(null);
      }

      setDone(res.data);
      toast.success('Student admit ho gaya!');
      flash('✅ Student admit ho gaya!');
      setForm({
        name: '', class_id: '', roll_number: '',
        admission_no: '', gender: '', dob: '',
        session: '2025-26', father_name: '', mother_name: '',
        parent_name: '', parent_phone: '', parent_email: '',
        address: '', password: 'Student@123',
      });
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Error aaya';
      toast.error(errMsg);
      flash('❌ ' + errMsg, 'error');
    }
    setSaving(false);
  }
async function uploadPhoto(studentId, file) {
  setPhotoUploading(true);
  try {
    const fd = new FormData();
    fd.append('photo', file);
    const res = await api.post(`/principal/students/${studentId}/photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setPhotoPreview(res.data.photo_url);
   toast.success('Photo upload ho gayi!');
    flash('✅ Photo upload ho gayi!');
  } catch {
    toast.error('Photo upload nahi hui');
    flash('❌ Photo upload nahi hui', 'error');
  }
  setPhotoUploading(false);
}
 // ✅ REPLACE WITH THIS
async function downloadPDF(studentId, studentName) {
  try {
    const res = await api.get(
      `/principal/admission-card/${studentId}`,
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `AdmissionCard_${studentName || studentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch {
    flash('❌ PDF generate nahi hua', 'error');
  }
}

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="New Admission" />
        <div className="page-body">

          {/* header */}
          <div className="page-header">
            <div>
              <h2 className="page-title">🎓 New Admission</h2>
              <p className="page-subtitle">
                Naya student register karo — admission card PDF generate hoga
              </p>
            </div>
          </div>

          {/* alert */}
          {msg.text && (
            <div style={{
              padding: '10px 16px', borderRadius: 8,
              marginBottom: 16, fontSize: 13,
              background: msg.type === 'error' ? '#fef1ee' : '#eaf5ea',
              color:      msg.type === 'error' ? '#ba0517' : '#2e844a',
              border: `1px solid ${msg.type === 'error' ? '#f9c9c0' : '#a3d9a5'}`,
            }}>{msg.text}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: done ? '1fr 1fr' : '1fr', gap: 24 }}>

            {/* ── FORM ── */}
            <div className="card">
              <div className="card-header">
                <h4>📋 Student Information</h4>
              </div>
              <form onSubmit={submit}>
                <div className="card-body" style={{ padding: '20px 24px' }}>

                  {/* section: student */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--neutral-5)',
                    letterSpacing: 1, marginBottom: 12, marginTop: 4,
                  }}>STUDENT DETAILS</div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px 20px',
                    marginBottom: 20,
                  }}>
                    {/* name */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Full Name *</label>
                      <input className="form-input" required
                        placeholder="Student ka poora naam"
                        value={form.name}
                        onChange={e => set('name', e.target.value)} />
                    </div>

                    {/* class */}
                    <div className="form-group">
                      <label className="form-label">Class *</label>
                      <select className="form-select" required
                        value={form.class_id}
                        onChange={e => set('class_id', e.target.value)}>
                        <option value="">— Class chunein —</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.section}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* session */}
                    <div className="form-group">
                      <label className="form-label">Session</label>
                      <select className="form-select"
                        value={form.session}
                        onChange={e => set('session', e.target.value)}>
                        {SESSIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* roll */}
                    <div className="form-group">
                      <label className="form-label">Roll Number</label>
                      <input className="form-input"
                        placeholder="e.g. 101"
                        value={form.roll_number}
                        onChange={e => set('roll_number', e.target.value)} />
                    </div>

                    {/* admission no */}
                    <div className="form-group">
                      <label className="form-label">Admission No</label>
                      <input className="form-input"
                        placeholder="e.g. ADM2025001"
                        value={form.admission_no}
                        onChange={e => set('admission_no', e.target.value)} />
                    </div>

                    {/* gender */}
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {GENDERS.map(g => (
                          <button key={g} type="button"
                            onClick={() => set('gender', g)}
                            style={{
                              flex: 1, padding: '8px 4px',
                              borderRadius: 6, border: '2px solid',
                              borderColor: form.gender === g ? '#0176d3' : '#e2e8f0',
                              background:  form.gender === g ? '#e8f4fd' : '#fff',
                              color:       form.gender === g ? '#0176d3' : '#64748b',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}>
                            {g === 'Male' ? '👦' : g === 'Female' ? '👧' : '🧒'} {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* dob */}
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input className="form-input" type="date"
                        value={form.dob}
                        onChange={e => set('dob', e.target.value)} />
                    </div>
                  </div>

                  {/* section: parent */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--neutral-5)',
                    letterSpacing: 1, marginBottom: 12,
                    paddingTop: 12, borderTop: '1px solid var(--neutral-2)',
                  }}>PARENT / GUARDIAN DETAILS</div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px 20px',
                    marginBottom: 20,
                  }}>
                    <div className="form-group">
                      <label className="form-label">Father Name *</label>
                      <input className="form-input" required
                        placeholder="Father ka naam"
                        value={form.father_name}
                        onChange={e => set('father_name', e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mother Name</label>
                      <input className="form-input"
                        placeholder="Mother ka naam"
                        value={form.mother_name}
                        onChange={e => set('mother_name', e.target.value)} />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Guardian / Parent Name</label>
                      <input className="form-input"
                        placeholder="Guardian ka naam (optional)"
                        value={form.parent_name}
                        onChange={e => set('parent_name', e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile Number *</label>
                      <input className="form-input" required
                        placeholder="+91-XXXXX-XXXXX"
                        value={form.parent_phone}
                        onChange={e => set('parent_phone', e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Parent Email</label>
                      <input className="form-input" type="email"
                        placeholder="parent@email.com"
                        value={form.parent_email}
                        onChange={e => set('parent_email', e.target.value)} />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Address</label>
                      <input className="form-input"
                        placeholder="Ghar ka pata"
                        value={form.address}
                        onChange={e => set('address', e.target.value)} />
                    </div>
                  </div>

                  {/* section: photo (optional) */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--neutral-5)',
                    letterSpacing: 1, marginBottom: 12,
                    paddingTop: 12, borderTop: '1px solid var(--neutral-2)',
                  }}>STUDENT PHOTO (OPTIONAL)</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    {pendingPhoto
                      ? <img src={URL.createObjectURL(pendingPhoto)} alt="Preview" style={{
                            width: 64, height: 70, objectFit: 'cover',
                            borderRadius: 8, border: '2px solid #0176d3' }} />
                      : <div style={{
                            width: 64, height: 70, background: '#f1f5f9',
                            borderRadius: 8, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#94a3b8', fontSize: 11 }}>No Photo</div>
                    }
                    <label style={{
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                        gap: 6, background: '#f1f5f9', padding: '8px 14px',
                        borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                      📷 {pendingPhoto ? 'Change Photo' : 'Upload Photo (optional)'}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => e.target.files[0] && setPendingPhoto(e.target.files[0])} />
                    </label>
                    {pendingPhoto && (
                      <button type="button" onClick={() => setPendingPhoto(null)} style={{
                          background: 'none', border: 'none',
                          color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>
                        🗑 Remove
                      </button>
                    )}
                  </div>

                  {/* section: login */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--neutral-5)',
                    letterSpacing: 1, marginBottom: 12,
                    paddingTop: 12, borderTop: '1px solid var(--neutral-2)',
                  }}>LOGIN CREDENTIALS</div>

                  <div className="form-group">
                    <label className="form-label">Default Password</label>
                    <input className="form-input"
                      placeholder="Default: Student@123"
                      value={form.password}
                      onChange={e => set('password', e.target.value)} />
                  </div>

                </div>

                <div className="modal-footer" style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--neutral-2)',
                }}>
                  <button type="submit" className="btn btn-primary"
                    disabled={saving} style={{ width: '100%', padding: 12 }}>
                    {saving
                      ? '⏳ Processing...'
                      : '🎓 Admit Karo & PDF Generate Karo'}
                  </button>
                </div>
              </form>
            </div>

            {/* ── SUCCESS CARD ── */}
            {done && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* success banner */}
                <div style={{
                  background: '#eaf5ea', border: '1px solid #a3d9a5',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 28 }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#2e844a', fontSize: 15 }}>
                      Admission Successful!
                    </div>
                    <div style={{ fontSize: 12, color: '#166534' }}>
                      {done.name} ko admit kar liya gaya hai
                    </div>
                  </div>
                </div>

                {/* student detail card */}
                <div className="card">
                  <div className="card-header">
                    <h4>📋 Admitted Student Details</h4>
                  </div>
                  <div className="card-body" style={{ padding: '16px 20px' }}>
                    {[
                      ['👤 Name',        done.name],
                      ['🔢 Roll No.',     done.roll_number  || '—'],
                      ['📋 Admission No', done.admission_no || '—'],
                      ['🏛 Class',        classes.find(c => c.id === done.class_id)?.name || '—'],
                      ['👨 Father',       done.parent_name  || '—'],
                      ['📱 Mobile',       done.parent_phone || '—'],
                      ['📅 Session',      done.session      || '—'],
                    ].map(([label, value]) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '8px 0', fontSize: 13,
                        borderBottom: '1px solid var(--neutral-2)',
                      }}>
                        <span style={{ color: 'var(--neutral-6)' }}>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Photo Upload */}
                <div className="card">
                  <div className="card-header"><h4>📸 Student Photo</h4></div>
                  <div className="card-body" style={{ padding: '16px 20px' }}>
                    {photoPreview
                      ? <img src={photoPreview} alt="Student" style={{
                            width: 100, height: 110, objectFit: 'cover',
                            borderRadius: 8, border: '2px solid #0176d3',
                            display: 'block', marginBottom: 10 }} />
                      : <div style={{
                            width: 100, height: 110, background: '#f1f5f9',
                            borderRadius: 8, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#94a3b8',
                            fontSize: 12, marginBottom: 10 }}>No Photo</div>
                    }
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={{
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                          gap: 6, background: '#f1f5f9', padding: '8px 14px',
                          borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        📷 {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => e.target.files[0] && uploadPhoto(done.id, e.target.files[0])} />
                      </label>
                      {photoUploading && <span style={{ fontSize: 11, color: '#94a3b8' }}>Uploading...</span>}
                      {photoPreview &&
                        <button onClick={async () => {
                          try {
                            await api.delete(`/principal/students/${done.id}/photo`);
                            setPhotoPreview(null);
                            toast.success('Photo delete ho gayi');
                            flash('Photo delete ho gayi');
                          } catch {
                            toast.error('Photo delete nahi hui');
                          }
                        }} style={{
                            background: 'none', border: 'none',
                            color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>
                          🗑 Delete
                        </button>
                      }
                    </div>
                  </div>
                </div>
                {/* PDF download */}
                <button
                  onClick={() => downloadPDF(done.id, done.name)}
                  style={{
                    background: '#0176d3', color: '#fff',
                    border: 'none', borderRadius: 10,
                    padding: '14px 20px', fontSize: 14,
                    fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 12px rgba(1,118,211,0.3)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  📥 Admission Card PDF Download Karo
                </button>

                <button
                  onClick={() => setDone(null)}
                  style={{
                    background: '#f1f5f9', color: '#475569',
                    border: 'none', borderRadius: 10,
                    padding: '12px 20px', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer',
                  }}>
                  + Ek Aur Admission Karo
                </button>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
