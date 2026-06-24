
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const BREADCRUMB_MAP = {
  '/dashboard': 'Dashboard', '/students': 'Students', '/admission': 'New Admission',
  '/teachers': 'Teachers', '/classes': 'Classes', '/subjects': 'Subjects',
  '/attendance': 'Attendance', '/exams': 'Exams', '/fees': 'Fees',
  '/documents': 'Documents', '/notes': 'Notes', '/timetable': 'Timetable',
  '/holidays': 'Holidays', '/marks': 'Marks', '/results': 'Results',
  '/schools': 'Schools', '/users': 'Users', '/id-cards': 'ID Cards',
  '/school-settings': 'School Settings', '/my-services': 'My Plan & Services',
};

export default function Navbar({ title, darkMode, onToggleDark }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [pendingCount, setPendingCount] = useState(0);
  const [pendingReqs,  setPendingReqs]  = useState([]);
  const [showNotif,    setShowNotif]    = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [showReset,    setShowReset]    = useState(false);
  const [passwords,    setPasswords]    = useState({ current: '', newP: '', confirm: '' });
  const [resetError,   setResetError]   = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [pwVisible,    setPwVisible]    = useState({ current: false, newP: false, confirm: false });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pageLabel = title || BREADCRUMB_MAP[location.pathname] || 'EduERP';

  useEffect(() => {
    if (user?.role !== 'PRINCIPAL') return;
    api.get('/principal/teachers/attendance/requests?approval=PENDING')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        setPendingCount(data.length);
        setPendingReqs(data.slice(0, 6));
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  function handleResetClose() {
    setShowReset(false);
    setPasswords({ current: '', newP: '', confirm: '' });
    setResetError('');
    setResetSuccess(false);
    setPwVisible({ current: false, newP: false, confirm: false });
  }

  async function handleResetSubmit() {
    setResetError('');
    if (!passwords.current || !passwords.newP || !passwords.confirm) { setResetError('Please fill all fields.'); return; }
    if (passwords.newP.length < 8) { setResetError('New password must be at least 8 characters.'); return; }
    if (passwords.newP !== passwords.confirm) { setResetError('New passwords do not match.'); return; }
    try {
      await api.put('/auth/change-password', { old_password: passwords.current, new_password: passwords.newP });
      setResetSuccess(true);
      setTimeout(() => handleResetClose(), 1800);
    } catch (err) {
      setResetError(err.response?.data?.error || 'Could not update password.');
    }
  }

  // ── Colors ───────────────────────────────────────────────────────────────────
  const bg          = darkMode ? '#0f172a' : '#ffffff';
  const border      = darkMode ? '#1e293b' : '#e8edf3';
  const textPrimary = darkMode ? '#f1f5f9' : '#0f172a';
  const textMuted   = darkMode ? '#64748b' : '#94a3b8';
  const textSub     = darkMode ? '#94a3b8' : '#64748b';
  const surfaceBg   = darkMode ? '#1e293b' : '#f8fafc';
  const dropBg      = darkMode ? '#1e293b' : '#ffffff';
  const dropBorder  = darkMode ? '#334155' : '#e2e8f0';
  const hoverBg     = darkMode ? '#273349' : '#f1f5f9';

  // ── Icon button style — FIXED: font-size explicit so Tabler icons show ───────
  const iconBtn = (active = false) => ({
    background:   active ? (darkMode ? '#273349' : '#f0f4ff') : surfaceBg,
    border:       `1px solid ${border}`,
    borderRadius: 8,
    width:  34, height: 34,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color:    textSub,
    flexShrink: 0,
    padding: 0,
    transition: 'background 0.15s',
  });

  const inputStyle = {
    width: '100%', padding: '9px 38px 9px 12px', fontSize: 13,
    background: darkMode ? '#0f172a' : '#fff',
    border: `1px solid ${dropBorder}`,
    color: textPrimary, borderRadius: 8, marginBottom: 10,
    boxSizing: 'border-box', outline: 'none',
  };

  return (
    <>
      <header style={{
        height: 54,
        background: bg,
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>

        {/* Left: breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {location.pathname !== '/dashboard' && (
            <button
              onClick={() => navigate(-1)}
              title="Go back"
              style={iconBtn()}
              onMouseEnter={e => e.currentTarget.style.background = hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = surfaceBg}
            >
              <i className="ti ti-arrow-left" style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true" />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: textMuted }}>EduERP</span>
            <i className="ti ti-chevron-right" style={{ fontSize: 11, color: textMuted }} aria-hidden="true" />
            <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{pageLabel}</span>
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          {/* Date */}
          <span style={{ fontSize: 12, color: textMuted, padding: '4px 10px' }}>{today}</span>

          {/* Session badge */}
          <span style={{
            background: darkMode ? 'rgba(99,102,241,0.15)' : '#eef2ff',
            color: darkMode ? '#a5b4fc' : '#4f46e5',
            fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
          }}>2024-25</span>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            style={iconBtn()}
            onMouseEnter={e => e.currentTarget.style.background = hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = surfaceBg}
          >
            <i
              className={`ti ${isFullscreen ? 'ti-minimize' : 'ti-maximize'}`}
              style={{ fontSize: 16, lineHeight: 1, display: 'block' }}
              aria-hidden="true"
            />
          </button>

          {/* Dark / Light toggle */}
          <button
            onClick={onToggleDark}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={iconBtn()}
            onMouseEnter={e => e.currentTarget.style.background = hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = surfaceBg}
          >
            <i
              className={`ti ${darkMode ? 'ti-sun' : 'ti-moon'}`}
              style={{ fontSize: 16, lineHeight: 1, display: 'block' }}
              aria-hidden="true"
            />
          </button>

          {/* Notification bell (PRINCIPAL only) */}
          {user?.role === 'PRINCIPAL' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotif(n => !n)}
                title="Notifications"
                style={{ ...iconBtn(showNotif), position: 'relative' }}
                onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = showNotif ? (darkMode ? '#273349' : '#f0f4ff') : surfaceBg}
              >
                <i className="ti ti-bell" style={{ fontSize: 16, lineHeight: 1, display: 'block' }} aria-hidden="true" />
                {pendingCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 5, right: 5,
                    background: '#ef4444', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                    minWidth: 14, height: 14, borderRadius: 99,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                    border: `2px solid ${bg}`,
                    lineHeight: 1,
                  }}>{pendingCount > 9 ? '9+' : pendingCount}</span>
                )}
              </button>

              {showNotif && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowNotif(false)} />
                  <div style={{
                    position: 'absolute', top: 42, right: 0, width: 320,
                    background: dropBg, borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: `1px solid ${dropBorder}`, zIndex: 99, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${dropBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>Notifications</span>
                      {pendingCount > 0 && (
                        <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                          {pendingCount} pending
                        </span>
                      )}
                    </div>
                    {pendingReqs.length === 0 ? (
                      <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: textMuted }}>
                        <i className="ti ti-bell-off" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} aria-hidden="true" />
                        No pending requests
                      </div>
                    ) : (
                      <>
                        {pendingReqs.map((r, i) => (
                          <div key={i} style={{ padding: '10px 16px', borderBottom: `1px solid ${darkMode ? '#1e293b' : '#f8fafc'}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                              {r.teacher_name?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>{r.teacher_name}</div>
                              <div style={{ fontSize: 11, color: textMuted }}>Attendance request · {r.date}</div>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                              background: r.status === 'PRESENT' ? '#dcfce7' : '#fee2e2',
                              color: r.status === 'PRESENT' ? '#16a34a' : '#dc2626',
                            }}>{r.status}</span>
                          </div>
                        ))}
                        <div
                          onClick={() => { navigate('/dashboard'); setShowNotif(false); }}
                          style={{ padding: '10px 16px', textAlign: 'center', fontSize: 12, color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          View all requests <i className="ti ti-arrow-right" style={{ fontSize: 12, marginLeft: 4 }} aria-hidden="true" />
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 10px 4px 4px', borderRadius: 99,
                border: `1px solid ${border}`,
                background: menuOpen ? (darkMode ? '#273349' : '#f0f4ff') : surfaceBg,
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, flexShrink: 0,
              }}>{initials}</div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>{user?.name?.split(' ')[0]}</div>
                <div style={{ fontSize: 10, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {user?.role?.replace(/_/g, ' ')}
                </div>
              </div>
              <i
                className="ti ti-chevron-down"
                style={{ fontSize: 12, color: textMuted, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                aria-hidden="true"
              />
            </div>

            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setMenuOpen(false)} />
                <div style={{
                  position: 'absolute', top: 46, right: 0, width: 220,
                  background: dropBg, borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: `1px solid ${dropBorder}`, zIndex: 99, overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${dropBorder}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                  </div>
                  {[
                    { icon: 'ti-lock',   label: 'Change password', onClick: () => { setShowReset(true); setMenuOpen(false); }, danger: false },
                    { icon: 'ti-logout', label: 'Sign out',        onClick: () => { logout(); navigate('/login'); },           danger: true  },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.onClick}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', background: 'none', border: 'none',
                        borderBottom: i === 0 ? `1px solid ${dropBorder}` : 'none',
                        color: item.danger ? '#ef4444' : textSub,
                        cursor: 'pointer', fontSize: 13, textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = item.danger ? (darkMode ? '#2d1b1b' : '#fef2f2') : hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Change password modal */}
      {showReset && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) handleResetClose(); }}
        >
          <div style={{ background: darkMode ? '#1e293b' : '#fff', border: `1px solid ${dropBorder}`, borderRadius: 16, padding: '28px', width: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-lock" style={{ fontSize: 16 }} aria-hidden="true" /> Change password
              </div>
              <button onClick={handleResetClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: textMuted }}>
                <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
              </button>
            </div>
            <p style={{ fontSize: 12, color: textMuted, marginBottom: 20, marginTop: 4 }}>Update your account password below.</p>

            {[
              { key: 'current', placeholder: 'Current password' },
              { key: 'newP',    placeholder: 'New password (min. 8 characters)' },
              { key: 'confirm', placeholder: 'Confirm new password' },
            ].map(f => (
              <div key={f.key} style={{ position: 'relative', marginBottom: 10 }}>
                <input
                  type={pwVisible[f.key] ? 'text' : 'password'}
                  placeholder={f.placeholder}
                  value={passwords[f.key]}
                  onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = dropBorder}
                />
                <button
                  type="button"
                  onClick={() => setPwVisible(v => ({ ...v, [f.key]: !v[f.key] }))}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 0 }}
                >
                  <i className={`ti ${pwVisible[f.key] ? 'ti-eye-off' : 'ti-eye'}`} style={{ fontSize: 15 }} aria-hidden="true" />
                </button>
              </div>
            ))}

            {resetError && (
              <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, background: '#fef2f2', padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca' }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 13, marginRight: 6 }} aria-hidden="true" />{resetError}
              </div>
            )}
            {resetSuccess && (
              <div style={{ fontSize: 12, color: '#059669', marginBottom: 12, background: '#f0fdf4', padding: '8px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <i className="ti ti-circle-check" style={{ fontSize: 13, marginRight: 6 }} aria-hidden="true" />Password updated successfully
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={handleResetClose} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${dropBorder}`, background: 'transparent', cursor: 'pointer', fontSize: 13, color: textSub }}>Cancel</button>
              <button onClick={handleResetSubmit} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Update password</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
