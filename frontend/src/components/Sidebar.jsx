import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_MENUS = {
  SUPER_ADMIN: [
    { icon: '⊞', label: 'Dashboard',    path: '/dashboard' },
    { icon: '🏫', label: 'Schools',      path: '/schools' },
    { icon: '👥', label: 'Users',        path: '/users' },
    { icon: '📊', label: 'Reports',      path: '/reports' },
  ],
  PRINCIPAL: [
    { icon: '⊞', label: 'Dashboard',    path: '/dashboard' },
    { icon: '🎒', label: 'Students',     path: '/students' },
    { icon: '👩‍🏫', label: 'Teachers',    path: '/teachers' },
    { icon: '🏛',  label: 'Classes',     path: '/classes' },
    { icon: '📋', label: 'Attendance',   path: '/attendance' },
    { icon: '📝', label: 'Exams',        path: '/exams' },
    { icon: '💰', label: 'Fees',         path: '/fees' },
    { icon: '📄', label: 'Documents',    path: '/documents' },
  ],
  TEACHER: [
    { icon: '⊞', label: 'Dashboard',    path: '/dashboard' },
    { icon: '📋', label: 'Attendance',   path: '/attendance' },
    { icon: '✏️', label: 'Marks Entry',  path: '/marks' },
    { icon: '📤', label: 'Upload Notes', path: '/notes' },
    { icon: '🎒', label: 'My Students',  path: '/students' },
  ],
  STUDENT: [
    { icon: '⊞', label: 'Dashboard',    path: '/dashboard' },
    { icon: '📋', label: 'Attendance',   path: '/attendance' },
    { icon: '📊', label: 'Results',      path: '/results' },
    { icon: '💰', label: 'Fees',         path: '/fees' },
    { icon: '📄', label: 'Notes',        path: '/notes' },
    { icon: '🎟',  label: 'Admit Card',  path: '/admit-card' },
  ],
  PARENT: [
    { icon: '⊞', label: 'Dashboard',    path: '/dashboard' },
    { icon: '📋', label: 'Attendance',   path: '/attendance' },
    { icon: '📊', label: 'Progress',     path: '/results' },
    { icon: '💰', label: 'Fees',         path: '/fees' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = ROLE_MENUS[user?.role] || [];
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newP: '', confirm: '' });
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  function handleResetClose() {
    setShowReset(false);
    setPasswords({ current: '', newP: '', confirm: '' });
    setResetError('');
    setResetSuccess(false);
  }

  async function handleResetSubmit() {
    setResetError('');
    if (!passwords.current || !passwords.newP || !passwords.confirm) {
      setResetError('All fields are required.'); return;
    }
    if (passwords.newP.length < 6) {
      setResetError('New password must be at least 6 characters.'); return;
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
      setResetError(
        err.response?.data?.error || 'Failed to update password.'
      );
    }
  }

  return (
    <>
      <aside style={{
        width: 'var(--sidebar-w)', position: 'fixed', top: 0, left: 0,
        height: '100vh', background: 'var(--blue-90)', display: 'flex',
        flexDirection: 'column', zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--blue-60)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16, fontWeight: 800,
          }}>E</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>EduERP</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 500 }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {menu.map(item => (
            <NavLink key={item.path} to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 6,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                textDecoration: 'none', fontWeight: isActive ? 600 : 400,
                fontSize: 13, marginBottom: 2, transition: 'all 0.15s',
              })}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Footer with Dropdown */}
        <div style={{ position: 'relative' }}>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div style={{
              position: 'absolute', bottom: 62, left: 0, right: 0,
              background: '#152d4a',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              zIndex: 200,
              boxShadow: '0 -6px 20px rgba(0,0,0,0.3)',
            }}>
              <button
                onClick={() => { setShowReset(true); setMenuOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 20px', background: 'none', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: 13,
                  transition: 'background 0.15s', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: 15 }}>🔑</span>
                Reset Password
              </button>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 20px', background: 'none', border: 'none',
                  color: '#ff7b7b', cursor: 'pointer', fontSize: 13,
                  transition: 'background 0.15s', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,80,80,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: 15 }}>↩</span>
                Logout
              </button>
            </div>
          )}

          {/* Profile Row — clickable */}
          <div
            onClick={() => setMenuOpen(o => !o)}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer',
              background: menuOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => {
              if (!menuOpen) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div className="avatar avatar-md" style={{
              background: 'var(--blue-60)', color: '#fff', flexShrink: 0,
              width: 32, height: 32, fontSize: 12,
              borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            }}>{initials}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}
                   className="truncate">{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}
                   className="truncate">{user?.email}</div>
            </div>
            <span style={{
              color: 'rgba(255,255,255,0.4)', fontSize: 9,
              transform: menuOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.2s', display: 'inline-block',
              marginLeft: 2,
            }}>▲</span>
          </div>
        </div>
      </aside>

      {/* ── Reset Password Modal ── */}
      {showReset && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
          onClick={e => { if (e.target === e.currentTarget) handleResetClose(); }}
        >
          <div style={{
            background: '#fff', borderRadius: 16, padding: '32px 28px',
            width: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>🔑 Reset Password</div>
              <button onClick={handleResetClose}
                style={{ background: 'none', border: 'none', fontSize: 18,
                  cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 22 }}>
              Update your account password below.
            </div>

            {/* Fields */}
            {[
              { key: 'current',  placeholder: 'Current Password' },
              { key: 'newP',     placeholder: 'New Password' },
              { key: 'confirm',  placeholder: 'Confirm New Password' },
            ].map(f => (
              <input
                key={f.key}
                type="password"
                placeholder={f.placeholder}
                value={passwords[f.key]}
                onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 13,
                  border: '1px solid #e2e8f0', borderRadius: 8,
                  marginBottom: 10, boxSizing: 'border-box',
                  outline: 'none', transition: 'border 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--blue-60)'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            ))}

            {/* Error / Success */}
            {resetError && (
              <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10,
                background: '#fef2f2', padding: '8px 12px', borderRadius: 6 }}>
                ⚠️ {resetError}
              </div>
            )}
            {resetSuccess && (
              <div style={{ fontSize: 12, color: '#059669', marginBottom: 10,
                background: '#f0fdf4', padding: '8px 12px', borderRadius: 6 }}>
                ✅ Password updated successfully!
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={handleResetClose}
                style={{
                  padding: '9px 18px', borderRadius: 8,
                  border: '1px solid #e2e8f0', background: '#fff',
                  cursor: 'pointer', fontSize: 13, color: '#475569',
                }}>
                Cancel
              </button>
              <button onClick={handleResetSubmit}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: 'var(--blue-60)', color: '#fff',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
