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

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
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
              fontSize: 13, marginBottom: 2,
              transition: 'all 0.15s',
            })}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div className="avatar avatar-md" style={{
          background: 'var(--blue-60)', color: '#fff', flexShrink: 0,
          width: 32, height: 32, fontSize: 12,
        }}>{initials}</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}
               className="truncate">{user?.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}
               className="truncate">{user?.email}</div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)', fontSize: 16, padding: 4, borderRadius: 4,
            transition: 'color 0.15s',
          }}
          title="Logout">↩</button>
      </div>
    </aside>
  );
}
