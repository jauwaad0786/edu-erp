import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const BREADCRUMB_MAP = {
  '/dashboard':  'Dashboard',
  '/students':   'Students',
  '/admission':  'New Admission',
  '/teachers':   'Teachers',
  '/classes':    'Classes',
  '/subjects':   'Subjects',
  '/attendance': 'Attendance',
  '/exams':      'Exams',
  '/fees':       'Fees',
  '/documents':  'Documents',
  '/notes':      'Notes',
  '/timetable':  'Timetable',
  '/holidays':   'Holidays',
  '/marks':      'Marks Entry',
  '/results':    'Results',
  '/schools':    'Schools',
  '/users':      'Users',
  '/id-cards/students':  'Student ID Cards',
  '/id-cards/employees': 'Employee ID Cards',
  '/school-settings': 'School Settings',
  '/my-services': 'My Plan & Services',
};

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotif,    setShowNotif]    = useState(false);
  const [pendingReqs,  setPendingReqs]  = useState([]);

  // ── User chip dropdown + reset password modal ──
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [showReset,    setShowReset]    = useState(false);
  const [passwords,    setPasswords]    = useState({ current: '', newP: '', confirm: '' });
  const [resetError,   setResetError]   = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const pageLabel = title || BREADCRUMB_MAP[location.pathname] || 'EduERP';

  // Fetch pending teacher attendance requests count (only for PRINCIPAL)
  useEffect(() => {
    if (user?.role !== 'PRINCIPAL') return;
    api.get('/principal/teachers/attendance/requests?approval=PENDING')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        setPendingCount(data.length);
        setPendingReqs(data.slice(0, 5));
      })
      .catch(() => {});
  }, [user]);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Today's date
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  function handleResetClose() {
    setShowReset(false);
    setPasswords({ current: '', newP: '', confirm: '' });
    setResetError('');
    setResetSuccess(false);
  }

  async function handleResetSubmit() {
    setResetError('');
    if (!passwords.current || !passwords.newP || !passwords.confirm) {
      setResetError('Please fill all fields.'); return;
    }
    if (passwords.newP.length < 8) {
      setResetError('Password must be at least 8 characters.'); return;
    }
    if (passwords.newP !== passwords.confirm) {
      setResetError('New passwords do not match.'); return;
    }
    try {
      await api.put('/auth/change-password', {
        old_password: passwords.current,
        new_password: passwords.newP,
      });
      setResetSuccess(true);
      setTimeout(() => handleResetClose(), 1500);
    } catch (err) {
      setResetError(err.response?.data?.error || 'Could not update password.');
    }
  }

  return (
    <>
      <header style={{
        height: 54,
        background: '#fff',
        borderBottom: '1px solid #e8edf2',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>

        {/* Left: Page title + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>EduERP</span>
          <span style={{ fontSize: 11, color: '#cbd5e1' }}>›</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            {pageLabel}
          </span>
        </div>

        {/* Right: date + notifications + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Date */}
          <span style={{
            fontSize: 11, color: '#94a3b8', fontWeight: 500,
            display: 'none',
          }}
            className="hide-mobile"
          >{today}</span>

          {/* Session badge */}
          <span style={{
            background: '#eff6ff', color: '#1d4ed8',
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 20, letterSpacing: '0.02em',
          }}>
            2024-25
          </span>

          {/* Notification Bell — only PRINCIPAL */}
          {user?.role === 'PRINCIPAL' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotif(n => !n)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  width: 36, height: 36, borderRadius: 8, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748b', transition: 'background 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                🔔
                {pendingCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: '#dc2626', color: '#fff',
                    fontSize: 9, fontWeight: 800, minWidth: 16, height: 16,
                    borderRadius: 99, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '0 3px',
                    border: '2px solid #fff',
                  }}>{pendingCount > 9 ? '9+' : pendingCount}</span>
                )}
              </button>

              {/* Dropdown */}
              {showNotif && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                    onClick={() => setShowNotif(false)}
                  />
                  <div style={{
                    position: 'absolute', top: 42, right: 0,
                    width: 320, background: '#fff', borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                    border: '1px solid #e2e8f0', zIndex: 99, overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        Notifications
                      </span>
                      {pendingCount > 0 && (
                        <span style={{
                          background: '#fee2e2', color: '#dc2626',
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        }}>{pendingCount} pending</span>
                      )}
                    </div>
                    {pendingReqs.length === 0 ? (
                      <div style={{
                        padding: '24px 16px', textAlign: 'center',
                        fontSize: 13, color: '#94a3b8',
                      }}>No pending requests</div>
                    ) : (
                      <>
                        {pendingReqs.map((r, i) => (
                          <div key={i} style={{
                            padding: '10px 16px', borderBottom: '1px solid #f8fafc',
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                          }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                              background: '#fef3c7', color: '#d97706',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontWeight: 700, fontSize: 12,
                            }}>
                              {r.teacher_name?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                                {r.teacher_name}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                Attendance request · {r.date}
                              </div>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px',
                              borderRadius: 20, flexShrink: 0,
                              background: r.status === 'PRESENT' ? '#dcfce7' : '#fee2e2',
                              color:      r.status === 'PRESENT' ? '#16a34a' : '#dc2626',
                            }}>{r.status}</span>
                          </div>
                        ))}
                        <div
                          onClick={() => { navigate('/dashboard'); setShowNotif(false); }}
                          style={{
                            padding: '10px 16px', textAlign: 'center',
                            fontSize: 12, color: '#0176d3', fontWeight: 600,
                            cursor: 'pointer', borderTop: '1px solid #f1f5f9',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          View all →
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* User chip — clickable */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 12px 4px 4px', borderRadius: 99,
                border: '1px solid #e2e8f0', background: menuOpen ? '#eff6ff' : '#f8fafc',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!menuOpen) e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = '#f8fafc'; }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg,#0176d3,#5867e8)',
                color: '#fff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700,
              }}>{initials}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
                  {user?.name?.split(' ')[0]}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {user?.role?.replace('_', ' ')}
                </div>
              </div>
              <span style={{
                color: '#94a3b8', fontSize: 9, marginLeft: 2,
                transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s', display: 'inline-block',
              }}>▼</span>
            </div>

            {/* Dropdown */}
            {menuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div style={{
                  position: 'absolute', top: 46, right: 0,
                  width: 220, background: '#fff', borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                  border: '1px solid #e2e8f0', zIndex: 99, overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowReset(true); setMenuOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 10, padding: '11px 16px', background: 'none', border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      color: '#334155', cursor: 'pointer', fontSize: 12.5,
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    🔑 Reset Password
                  </button>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 10, padding: '11px 16px', background: 'none', border: 'none',
                      color: '#dc2626', cursor: 'pointer', fontSize: 12.5, textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    ↩ Logout
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </header>

      {/* ── Reset Password Modal ── */}
      {showReset && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={e => { if (e.target === e.currentTarget) handleResetClose(); }}
        >
          <div style={{
            background: '#fff', borderRadius: 16, padding: '32px 28px',
            width: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>🔑 Reset Password</div>
              <button onClick={handleResetClose} style={{
                background: 'none', border: 'none', fontSize: 18,
                cursor: 'pointer', color: '#94a3b8',
              }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 22 }}>
              Update your account password.
            </div>
            {[
              { key: 'current', placeholder: 'Current Password' },
              { key: 'newP',    placeholder: 'New Password (min 8 chars)' },
              { key: 'confirm', placeholder: 'Confirm New Password' },
            ].map(f => (
              <input key={f.key} type="password" placeholder={f.placeholder}
                value={passwords[f.key]}
                onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 13,
                  border: '1px solid #e2e8f0', borderRadius: 8,
                  marginBottom: 10, boxSizing: 'border-box', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#0176d3'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            ))}
            {resetError && (
              <div style={{
                fontSize: 12, color: '#dc2626', marginBottom: 10,
                background: '#fef2f2', padding: '8px 12px', borderRadius: 6,
              }}>⚠️ {resetError}</div>
            )}
            {resetSuccess && (
              <div style={{
                fontSize: 12, color: '#059669', marginBottom: 10,
                background: '#f0fdf4', padding: '8px 12px', borderRadius: 6,
              }}>✅ Password updated successfully!</div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={handleResetClose} style={{
                padding: '9px 18px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: '#fff',
                cursor: 'pointer', fontSize: 13, color: '#475569',
              }}>Cancel</button>
              <button onClick={handleResetSubmit} style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: '#0176d3', color: '#fff',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Update Password</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
