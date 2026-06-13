import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import api     from '../api/axios';
import toast   from 'react-hot-toast';

// ── Upload Box Component ──────────────────────────────────────────────────────
function UploadBox({ label, sublabel, currentUrl, onUpload, onDelete, uploading, accept = 'image/*' }) {
  const ref = useRef();
  return (
    <div style={{
      border: '1.5px dashed #cbd5e1', borderRadius: 12, padding: 20,
      background: '#f8fafc', textAlign: 'center', position: 'relative',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>{sublabel}</div>

      {currentUrl ? (
        <div style={{ marginBottom: 14 }}>
          <img
            src={currentUrl}
            alt={label}
            style={{
              maxHeight: 80, maxWidth: '100%', objectFit: 'contain',
              border: '1px solid #e2e8f0', borderRadius: 8,
              background: '#fff', padding: 6,
            }}
          />
        </div>
      ) : (
        <div style={{
          width: 64, height: 64, borderRadius: 10,
          background: '#e2e8f0', margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, color: '#94a3b8',
        }}>
          {label.includes('Logo') ? '🏫' : '✍️'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => ref.current.click()}
          disabled={uploading}
          style={{
            background: '#0176d3', color: '#fff', border: 'none',
            borderRadius: 7, padding: '7px 16px', fontSize: 12,
            fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? '⏳ Uploading...' : currentUrl ? '🔄 Change' : '📤 Upload'}
        </button>
        {currentUrl && (
          <button
            onClick={onDelete}
            disabled={uploading}
            style={{
              background: '#fee2e2', color: '#dc2626', border: 'none',
              borderRadius: 7, padding: '7px 14px', fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            🗑 Delete
          </button>
        )}
      </div>

      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SchoolSettings() {
  const [school,  setSchool]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState('info');

  // uploading state per field
  const [uploading, setUploading] = useState({
    logo: false, principal_sig: false, director_sig: false,
  });

  // form state
  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '',
    pincode: '', phone: '', email: '', current_session: '',
  });

  // ── Fetch ──
  // ── Fetch ──
  const load = () => {
    setLoading(true);
  
    api.get('/principal/school/settings')
      .then(r => {
        console.log("SETTINGS API:", r.data);
  
        setSchool(r.data);
  
        setForm({
          name: r.data.name || '',
          address: r.data.address || '',
          city: r.data.city || '',
          state: r.data.state || '',
          pincode: r.data.pincode || '',
          phone: r.data.phone || '',
          email: r.data.email || '',
          current_session: r.data.current_session || '',
        });
      })
      .catch(err => {
        console.log("SETTINGS ERROR:", err);
        toast.error('School data load nahi hua');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  useEffect(() => {
    load();
  }, []);

  // ── Save text info ──
  const saveInfo = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.patch('/principal/school/settings', form);
      setSchool(r.data);
      toast.success('✅ School info save ho gayi!');
    } catch {
      toast.error('Save nahi hua — dobara try karo');
    }
    setSaving(false);
  };

  // ── Generic image upload ──
  const handleUpload = async (file, endpoint, field) => {
    setUploading(u => ({ ...u, [field]: true }));
    const fd = new FormData();
    // field name matches what backend expects
    const fieldName = field === 'logo' ? 'logo' : 'signature';
    fd.append(fieldName, file);
    try {
      const r = await api.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSchool(s => ({ ...s, ...r.data }));
      toast.success('✅ Upload ho gaya!');
    } catch {
      toast.error('Upload fail hua — file size check karo (max 5MB)');
    }
    setUploading(u => ({ ...u, [field]: false }));
  };

  // ── Generic image delete ──
  const handleDelete = async (endpoint, key) => {
    if (!window.confirm('Delete karna chahte ho?')) return;
    try {
      await api.delete(endpoint);
      setSchool(s => ({ ...s, [key]: null }));
      toast.success('Deleted!');
    } catch {
      toast.error('Delete nahi hua');
    }
  };

  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="School Settings" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Loading...</div>
          </div>
        </div>
      </div>
    </div>
  );

  const TABS = [
    { key: 'info',       icon: '🏫', label: 'School Info' },
    { key: 'branding',   icon: '🎨', label: 'Logo & Signatures' },
  ];

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="School Settings" />
        <div className="page-body">

          {/* ── Header ── */}
          <div className="page-header">
            <div>
              <h2 className="page-title">⚙️ School Settings</h2>
              <p className="page-subtitle">
                School ki information, logo aur signatures manage karo
              </p>
            </div>
            {/* Quick preview badges */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {school?.logo_url && (
                <img src={school.logo_url} alt="logo"
                  style={{ height: 40, width: 40, objectFit: 'contain',
                    border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 4 }} />
              )}
              <div style={{
                background: '#f1f5f9', borderRadius: 8,
                padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#475569',
              }}>
                {school?.code || '—'}
              </div>
              <span style={{
                background: school?.is_active ? '#dcfce7' : '#fee2e2',
                color: school?.is_active ? '#16a34a' : '#dc2626',
                borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700,
              }}>
                {school?.is_active ? '🟢 Active' : '🔴 Inactive'}
              </span>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: 24 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 22px', fontSize: 13, fontWeight: 600,
                color: tab === t.key ? '#0176d3' : '#64748b',
                borderBottom: tab === t.key ? '2px solid #0176d3' : '2px solid transparent',
                marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* ══ TAB: School Info ══════════════════════════════════════════════ */}
          {tab === 'info' && (
            <div style={{ maxWidth: 720 }}>
              <div className="card" style={{ margin: 0 }}>
                <div className="card-header">
                  <h4 style={{ margin: 0 }}>🏫 School Information</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Yeh information ID cards, PDFs aur reports mein use hoti hai
                  </p>
                </div>
                <div className="card-body" style={{ padding: '24px' }}>
                  <form onSubmit={saveInfo}>

                    {/* School Name */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">School Name *</label>
                      <input
                        className="form-input"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                        placeholder="e.g. Delhi Public School"
                      />
                    </div>

                    {/* Address */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Full Address</label>
                      <input
                        className="form-input"
                        value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Street, Area, Landmark"
                      />
                    </div>

                    {/* City + State */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                          className="form-input"
                          value={form.city}
                          onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="e.g. Delhi"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input
                          className="form-input"
                          value={form.state}
                          onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                          placeholder="e.g. Delhi"
                        />
                      </div>
                    </div>

                    {/* Pincode + Phone */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Pincode</label>
                        <input
                          className="form-input"
                          value={form.pincode}
                          onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                          placeholder="110001"
                          maxLength={6}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          className="form-input"
                          value={form.phone}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    {/* Email + Session */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          className="form-input"
                          type="email"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="school@email.com"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Current Session</label>
                        <select
                          className="form-select"
                          value={form.current_session}
                          onChange={e => setForm(f => ({ ...f, current_session: e.target.value }))}
                        >
                          {['2023-24','2024-25','2025-26','2026-27'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Current values preview */}
                    <div style={{
                      background: '#f8fafc', borderRadius: 10, padding: '14px 18px',
                      marginBottom: 20, border: '1px solid #e2e8f0',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b',
                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                        Current Saved Info
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
                        {[
                          ['Name',    school?.name],
                          ['City',    school?.city],
                          ['State',   school?.state],
                          ['Phone',   school?.phone],
                          ['Email',   school?.email],
                          ['Session', school?.current_session],
                          ['Address', school?.address],
                          ['Pincode', school?.pincode],
                        ].map(([k, v]) => (
                          <div key={k} style={{ fontSize: 12, color: '#475569', display: 'flex', gap: 6 }}>
                            <span style={{ color: '#94a3b8', minWidth: 56 }}>{k}:</span>
                            <strong style={{ color: '#0f172a' }}>{v || '—'}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary"
                      style={{ minWidth: 140 }}
                    >
                      {saving ? '⏳ Saving...' : '💾 Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: Logo & Signatures ════════════════════════════════════════ */}
          {tab === 'branding' && (
            <div style={{ maxWidth: 760 }}>

              {/* Instructions */}
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 10, padding: '12px 18px', marginBottom: 24,
                fontSize: 12, color: '#1e40af', lineHeight: 1.7,
              }}>
                <strong>📌 Signature upload kaise karein:</strong><br />
                Principal/Director white paper pe signature karein → phone se photo lein →
                sirf signature area crop karein → upload karein.
                PDF mein white background automatically transparent ho jaata hai.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

                {/* Logo */}
                <UploadBox
                  label="School Logo"
                  sublabel="PNG/JPG — white/transparent bg best hai"
                  currentUrl={school?.logo_url}
                  uploading={uploading.logo}
                  onUpload={file => handleUpload(file, '/principal/school/logo', 'logo')}
                  onDelete={() => handleDelete('/principal/school/logo', 'logo_url')}
                />

                {/* Principal Signature */}
                <UploadBox
                  label="Principal Signature"
                  sublabel="White paper pe sign karo, crop karke upload karo"
                  currentUrl={school?.principal_signature_url}
                  uploading={uploading.principal_sig}
                  onUpload={file => handleUpload(file, '/principal/school/principal-signature', 'principal_sig')}
                  onDelete={() => handleDelete('/principal/school/principal-signature', 'principal_signature_url')}
                />

                {/* Director Signature */}
                <UploadBox
                  label="Director Signature"
                  sublabel="Chairman/Director ka signature"
                  currentUrl={school?.director_signature_url}
                  uploading={uploading.director_sig}
                  onUpload={file => handleUpload(file, '/principal/school/director-signature', 'director_sig')}
                  onDelete={() => handleDelete('/principal/school/director-signature', 'director_signature_url')}
                />
              </div>

              {/* Usage note */}
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 10, padding: '14px 18px', marginTop: 24,
                fontSize: 12, color: '#166534',
              }}>
                <strong>✅ Yeh images automatically use hoti hain:</strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.9 }}>
                  <li>Student ID Cards — school logo (front) + principal signature (back)</li>
                  <li>Employee ID Cards — school logo (front)</li>
                  <li>Admit Cards, Result Cards — logo + signature</li>
                </ul>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
