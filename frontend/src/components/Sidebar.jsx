import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        { icon: '✚',  label: 'New Admission', path: '/admission', nested: true },
        { icon: '👩‍🏫', label: 'Teachers',    path: '/teachers' },
      ]
    },
    {
      group: 'OPERATIONS',
      items: [
        { icon: '📋', label: 'Attendance',    path: '/attendance' },
        { icon: '📝', label: 'Exams',         path: '/exams' },
        { icon: '📊', label: 'Marks',         path: '/marks' },
        { icon: '💰', label: 'Fees',          path: '/fees' },
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
        { icon: '⚡', label: 'My Plan & Services', path: '/my-services' },
        { icon: '⚙️', label: 'School Settings',    path: '/school-settings' },
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
  const { user } = useAuth();
  const groups = ROLE_MENUS[user?.role] || [];
  const [collapsed, setCollapsed] = useState(false);

  const W = collapsed ? 64 : 220;

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
                    paddingLeft: collapsed ? undefined : (item.nested ? 26 : 10),
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 7,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.58)',
                    background: isActive
                      ? 'linear-gradient(90deg,rgba(1,118,211,0.55),rgba(1,118,211,0.2))'
                      : 'transparent',
                    borderLeft: isActive ? '3px solid #0176d3' : '3px solid transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: item.nested ? 12 : 13,
                    marginBottom: 1,
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
                  <span style={{ fontSize: item.nested ? 12 : 15, flexShrink: 0, width: collapsed ? 'auto' : 18, textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── CSS variable update — sidebar width ── */}
      <style>{`
        :root { --sidebar-w: ${W}px; }
      `}</style>
    </>
  );
}
