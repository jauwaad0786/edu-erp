import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ROLE_MENUS = {
  SUPER_ADMIN: [
    {
      group: 'OVERVIEW',
      items: [
        { icon: '▣', label: 'Dashboard',   path: '/dashboard' },
      ]
    },
    {
      group: 'MANAGEMENT',
      items: [
        { icon: '🏫', label: 'Schools',    path: '/schools' },
        { icon: '👥', label: 'Users',      path: '/users' },
      ]
    },
  ],

  PRINCIPAL: [
    {
      group: 'OVERVIEW',
      items: [
        { icon: '▣', label: 'Dashboard',     path: '/dashboard' },
      ]
    },
    {
      group: 'ACADEMICS',
      items: [
        { icon: '🏛', label: 'Classes',       path: '/classes' },
        { icon: '📚', label: 'Subjects',      path: '/subjects' },
        { icon: '📅', label: 'Timetable',     path: '/timetable' },
      ]
    },
    {
      group: 'PEOPLE',
      items: [
        { icon: '🎒', label: 'Students',      path: '/students' },
        { icon: '✚',  label: 'New Admission', path: '/admission' },
        { icon: '👩‍🏫', label: 'Teachers',    path: '/teachers' },
      ]
    },
    {
      group: 'OPERATIONS',
      items: [
        { icon: '📋', label: 'Attendance',    path: '/attendance' },
        { icon: '📝', label: 'Exams',         path: '/exams' },
        { icon: '💰', label: 'Fees',          path: '/fees' },
        { icon: '🗓', label: 'Holidays',      path: '/holidays' },
      ]
    },
    {
      group: 'DOCUMENTS',
      items: [
        { icon: '📄', label: 'Documents',     path: '/documents' },
        { icon: '📤', label: 'Notes',         path: '/notes' },
        { icon: '🪪', label: 'ID Cards', path: '/id-cards' },
      ]
    },
    {
      group: 'SETTINGS',
      items: [
        { icon: '⚙️', label: 'School Settings', path: '/school-settings' },
      ]
    },
  
  ],

  TEACHER: [
    {
      group: 'OVERVIEW',
      items: [
        { icon: '▣', label: 'Dashboard',      path: '/dashboard' },
      ]
    },
    {
      group: 'ACADEMICS',
      items: [
        { icon: '📅', label: 'Timetable',     path: '/timetable' },
      ]
    },
    {
      group: 'MY WORK',
      items: [
        { icon: '📋', label: 'Attendance',    path: '/attendance' },
        { icon: '✏️', label: 'Marks Entry',   path: '/marks' },
        { icon: '📤', label: 'Upload Notes',  path: '/notes' },
        { icon: '🎒', label: 'My Students',   path: '/students' },
      ]
    },
  ],

 STUDENT: [
    {
      group: 'OVERVIEW',
      items: [
        { icon: '▣', label: 'Dashboard',      path: '/dashboard' },
      ]
    },
    {
      group: 'MY SCHOOL',
      items: [
        { icon: '📅', label: 'Timetable',     path: '/timetable' },
        { icon: '📋', label: 'Attendance',    path: '/attendance' },
        { icon: '📊', label: 'Results',       path: '/results' },
        { icon: '💰', label: 'Fees',          path: '/fees' },
        { icon: '📄', label: 'Notes',         path: '/notes' },
        { icon: '🎟', label: 'Admit Card',    path: '/admit-card' },
      ]
    },
  ],

  PARENT: [
    {
      group: 'OVERVIEW',
      items: [
        { icon: '▣', label: 'Dashboard',      path: '/dashboard' },
      ]
    },
    {
      group: "MY CHILD",
      items: [
        { icon: '📋', label: 'Attendance',    path: '/attendance' },
        { icon: '📊', label: 'Progress',      path: '/results' },
        { icon: '💰', label: 'Fees',          path: '/fees' },
      ]
    },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const groups = ROLE_MENUS[user?.role] || [];
  const [collapsed,   setCollapsed]   = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [showReset,   setShowReset]   = useState(false);
  const [passwords,   setPasswords]   = useState({ current: '', newP: '', confirm: '' });
  const [resetError,  setResetError]  = useState('');
  const [resetSuccess,setResetSuccess]= useState(false);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const W = collapsed ? 64 : 220;

  function handleResetClose() {
    setShowReset(false);
    setPasswords({ current: '', newP: '', confirm: '' });
    setResetError('');
    setResetSuccess(false);
  }

  async function handleResetSubmit() {
    setResetError('');
    if (!passwords.current || !passwords.newP || !passwords.confirm) {
      setResetError('Sab fields fill karo.'); return;
    }
    if (passwords.newP.length < 8) {
      setResetError('Password kam se kam 8 characters ka hona chahiye.'); return;
    }
    if (passwords.newP !== passwords.confirm) {
      setResetError('Naye passwords match nahi kar rahe.'); return;
    }
    try {
      await api.put('/auth/change-password', {
        old_password: passwords.current,
        new_password: passwords.newP,
      });
      setResetSuccess(true);
      setTimeout(() => handleResetClose(), 1500);
    } catch (err) {
      setResetError(err.response?.data?.error || 'Password update nahi hua.');
    }
  }

  return (
    <>
      <aside style={{
        width: W, minWidth: W, position: 'fixed', top: 0, left: 0,
        height: '100vh', background: '#0a1f3c',
        display: 'flex', flexDirection: 'column',
        zIndex: 100, transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* ── Logo + Collapse ── */}
        <div style={{
          padding: collapsed ? '16px 0' : '16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 60,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg,#0176d3,#032d60)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 15, fontWeight: 800, flexShrink: 0,
              }}>E</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>EduERP</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500, letterSpacing: '0.04em' }}>
                  {user?.role?.replace('_', ' ')}
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#0176d3,#032d60)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 15, fontWeight: 800,
            }}>E</div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'rgba(255,255,255,0.07)', border: 'none',
              borderRadius: 6, width: 26, height: 26, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)', fontSize: 13, flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 8px' }}>
          {groups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 6 }}>

              {/* Group label */}
              {!collapsed && (
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.3)', padding: '8px 8px 4px',
                  textTransform: 'uppercase',
                }}>
                  {group.group}
                </div>
              )}
              {collapsed && gi > 0 && (
                <div style={{
                  height: 1, background: 'rgba(255,255,255,0.08)',
                  margin: '8px 6px',
                }} />
              )}

              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : 10,
                    padding: collapsed ? '9px 0' : '8px 10px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 7,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.58)',
                    background: isActive
                      ? 'linear-gradient(90deg,rgba(1,118,211,0.55),rgba(1,118,211,0.2))'
                      : 'transparent',
                    borderLeft: isActive ? '3px solid #0176d3' : '3px solid transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13, marginBottom: 1,
                    transition: 'all 0.14s',
                    whiteSpace: 'nowrap',
                  })}
                  onMouseEnter={e => {
                    if (!e.currentTarget.style.background.includes('118'))
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.style.background.includes('118'))
                      e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 15, flexShrink: 0, width: collapsed ? 'auto' : 20, textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── User Footer ── */}
        <div style={{ position: 'relative' }}>
          {menuOpen && (
            <div style={{
              position: 'absolute', bottom: collapsed ? 56 : 62,
              left: 0, right: 0,
              background: '#0d2440',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              zIndex: 200,
              boxShadow: '0 -6px 20px rgba(0,0,0,0.3)',
            }}>
              <button
                onClick={() => { setShowReset(true); setMenuOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 10, padding: '11px 18px', background: 'none', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: 12,
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                🔑 Reset Password
              </button>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 10, padding: '11px 18px', background: 'none', border: 'none',
                  color: '#ff7b7b', cursor: 'pointer', fontSize: 12, textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,80,80,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                ↩ Logout
              </button>
            </div>
          )}

          <div
            onClick={() => setMenuOpen(o => !o)}
            style={{
              padding: collapsed ? '12px 0' : '10px 14px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10, cursor: 'pointer',
              background: menuOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              if (!menuOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={e => {
              if (!menuOpen) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#0176d3,#5867e8)',
              color: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, fontSize: 12,
            }}>{initials}</div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    color: '#fff', fontSize: 12, fontWeight: 600,
                    lineHeight: 1.3, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{user?.name}</div>
                  <div style={{
                    color: 'rgba(255,255,255,0.4)', fontSize: 10,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{user?.email}</div>
                </div>
                <span style={{
                  color: 'rgba(255,255,255,0.35)', fontSize: 9,
                  transform: menuOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.2s', display: 'inline-block',
                }}>▲</span>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── CSS variable update — sidebar width ── */}
      <style>{`
        :root { --sidebar-w: ${W}px; }
      `}</style>

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
              Account ka password update karo.
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
              }}>✅ Password update ho gaya!</div>
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
