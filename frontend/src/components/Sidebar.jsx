import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Color Tokens ─────────────────────────────────────────────────────────────
const NAV = {
  bg:           '#0f2744',   // Dark Navy — SAP/Salesforce
  bgDeep:       '#0a1e36',   // Deeper for brand bar
  bgHover:      '#162f52',   // Hover state
  bgActive:     '#1a3a66',   // Active item bg
  accent:       '#4a9eff',   // Bright blue accent — active text & indicator
  accentGlow:   '#3b82f6',   // Indicator bar color
  border:       '#1c3452',   // Subtle divider
  groupLabel:   '#6b8cae',   // Section headers
  textBase:     '#a8c4e0',   // Normal menu text
  textActive:   '#ffffff',   // Active item text
  textMuted:    '#5a7fa0',   // Very muted
  searchBg:     '#0d2240',   // Search input bg
  searchBorder: '#1c3452',
  footerBg:     '#0a1e36',
  avatarGrad:   'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  logoGrad:     'linear-gradient(135deg, #3b82f6, #60a5fa)',
};

// ─── Menu definitions ─────────────────────────────────────────────────────────
const ROLE_MENUS = {
  SUPER_ADMIN: [
    { group: 'Overview', items: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/dashboard' },
    ]},
    { group: 'Management', items: [
      { icon: 'ti-building-school', label: 'Schools',   path: '/schools' },
      { icon: 'ti-users',           label: 'Users',     path: '/users' },
    ]},
  ],
  PRINCIPAL: [
    { group: 'Overview', items: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/dashboard' },
    ]},
    { group: 'Academics', items: [
      { icon: 'ti-school',          label: 'Classes',   path: '/classes' },
      { icon: 'ti-books',           label: 'Subjects',  path: '/subjects' },
      { icon: 'ti-calendar-time',   label: 'Timetable', path: '/timetable' },
    ]},
    { group: 'People', items: [
      { icon: 'ti-user-graduate', label: 'Students',      path: '/students' },
      { icon: 'ti-user-plus',     label: 'New Admission', path: '/admission', nested: true },
      { icon: 'ti-chalkboard',    label: 'Teachers',      path: '/teachers' },
    ]},
    { group: 'Operations', items: [
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-pencil',          label: 'Exams',      path: '/exams' },
      { icon: 'ti-chart-bar',       label: 'Marks',      path: '/marks' },
      { icon: 'ti-receipt',         label: 'Fees',        path: '/fees' },
    ]},
    { group: 'Documents', items: [
      { icon: 'ti-file-text', label: 'Documents', path: '/documents' },
      { icon: 'ti-notes',     label: 'Notes',     path: '/notes' },
      { icon: 'ti-id-badge',  label: 'ID Cards',  path: '/id-cards' },
    ]},
    { group: 'Settings', items: [
      { icon: 'ti-bolt',     label: 'My Plan & Services', path: '/my-services' },
      { icon: 'ti-settings', label: 'School Settings',    path: '/school-settings' },
    ]},
  ],
  TEACHER: [
    { group: 'Overview', items: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/dashboard' },
    ]},
    { group: 'Academics', items: [
      { icon: 'ti-calendar-time', label: 'Timetable', path: '/timetable' },
    ]},
    { group: 'My Work', items: [
      { icon: 'ti-clipboard-check', label: 'Attendance',   path: '/attendance' },
      { icon: 'ti-pencil',          label: 'Marks Entry',  path: '/marks' },
      { icon: 'ti-upload',          label: 'Upload Notes', path: '/notes' },
      { icon: 'ti-user-graduate',   label: 'My Students',  path: '/students' },
    ]},
  ],
  STUDENT: [
    { group: 'Overview', items: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/dashboard' },
    ]},
    { group: 'My School', items: [
      { icon: 'ti-calendar-time',   label: 'Timetable',  path: '/timetable' },
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-chart-bar',       label: 'Results',    path: '/results' },
      { icon: 'ti-receipt',         label: 'Fees',        path: '/fees' },
      { icon: 'ti-notes',           label: 'Notes',      path: '/notes' },
      { icon: 'ti-ticket',          label: 'Admit Card', path: '/admit-card' },
    ]},
  ],
  PARENT: [
    { group: 'Overview', items: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/dashboard' },
    ]},
    { group: 'My Child', items: [
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-chart-bar',       label: 'Progress',   path: '/results' },
      { icon: 'ti-receipt',         label: 'Fees',        path: '/fees' },
    ]},
  ],
};

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin', PRINCIPAL: 'Principal', VICE_PRINCIPAL: 'Vice Principal',
  TEACHER: 'Teacher', ACCOUNTANT: 'Accountant', RECEPTIONIST: 'Receptionist',
  LIBRARIAN: 'Librarian', STUDENT: 'Student', PARENT: 'Parent',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Sidebar({ darkMode }) {
  const { user } = useAuth();
  const groups   = ROLE_MENUS[user?.role] || [];

  const [collapsed, setCollapsed] = useState(false);
  const [search,    setSearch]    = useState('');

  const W = collapsed ? 60 : 230;

  const schoolName = user?.school?.name || user?.school_name || 'EduERP';
  const schoolCode = user?.school?.code || user?.school_code || null;
  const initial    = schoolName.charAt(0).toUpperCase();
  const userInitials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map(g => ({ ...g, items: g.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [groups, search]);

  return (
    <>
      <aside style={{
        width: W, minWidth: W, maxWidth: W,
        position: 'fixed', top: 0, left: 0,
        height: '100vh',
        background: NAV.bg,
        display: 'flex', flexDirection: 'column',
        zIndex: 100,
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        borderRight: `1px solid ${NAV.border}`,
        boxShadow: '2px 0 12px rgba(0,0,0,0.35)',
      }}>

        {/* ── Brand Header ───────────────────────────────────────────── */}
        <div style={{
          background: NAV.bgDeep,
          borderBottom: `1px solid ${NAV.border}`,
          padding: collapsed ? '14px 0' : '14px 14px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10,
          flexShrink: 0,
          minHeight: 56,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
            {/* Logo circle */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: NAV.logoGrad,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
            }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: '-0.5px' }}>{initial}</span>
            </div>

            {!collapsed && (
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{schoolName}</div>
                <div style={{
                  color: NAV.groupLabel,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {schoolCode ? `${schoolCode} · ` : ''}{ROLE_LABELS[user?.role] || user?.role}
                </div>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              style={{
                background: 'transparent',
                border: `1px solid ${NAV.border}`,
                borderRadius: 6,
                width: 26, height: 26,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: NAV.textMuted,
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = NAV.bgHover; e.currentTarget.style.color = NAV.textBase; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = NAV.textMuted; }}
            >
              <i className="ti ti-layout-sidebar-left-collapse" style={{ fontSize: 13 }} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            style={{
              background: 'transparent',
              border: `1px solid ${NAV.border}`,
              borderRadius: 6,
              width: 30, height: 30,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: NAV.textMuted,
              margin: '10px auto 4px',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = NAV.bgHover; e.currentTarget.style.color = NAV.textBase; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = NAV.textMuted; }}
          >
            <i className="ti ti-layout-sidebar-right-collapse" style={{ fontSize: 13 }} />
          </button>
        )}

        {/* ── Search ─────────────────────────────────────────────────── */}
        {!collapsed && (
          <div style={{ padding: '10px 12px 4px', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-search" style={{
                position: 'absolute', left: 9, top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12, color: NAV.textMuted, pointerEvents: 'none',
              }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search modules…"
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 28px',
                  fontSize: 12,
                  background: NAV.searchBg,
                  border: `1px solid ${NAV.searchBorder}`,
                  borderRadius: 7,
                  color: '#c8dff5',
                  outline: 'none',
                  boxSizing: 'border-box',
                  caretColor: NAV.accent,
                }}
                onFocus={e => { e.target.style.borderColor = NAV.accentGlow; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = NAV.searchBorder; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '6px 6px' : '6px 8px',
          /* Custom scrollbar */
        }}>
          <style>{`
            aside nav::-webkit-scrollbar { width: 3px; }
            aside nav::-webkit-scrollbar-track { background: transparent; }
            aside nav::-webkit-scrollbar-thumb { background: #1c3452; border-radius: 99px; }
          `}</style>

          {filteredGroups.length === 0 && (
            <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: 12, color: NAV.textMuted }}>
              Koi module nahi mila
            </div>
          )}

          {filteredGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 4 }}>

              {/* Group label */}
              {!collapsed ? (
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  color: NAV.groupLabel,
                  padding: gi === 0 ? '6px 8px 4px' : '12px 8px 4px',
                  textTransform: 'uppercase',
                  userSelect: 'none',
                }}>{group.group}</div>
              ) : (
                gi > 0 && (
                  <div style={{
                    height: 1,
                    background: NAV.border,
                    margin: '8px 6px',
                    opacity: 0.7,
                  }} />
                )
              )}

              {/* Menu items */}
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? 0 : 9,
                    padding: collapsed ? '9px 0' : item.nested ? '6px 8px 6px 26px' : '7px 8px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 7,
                    color:      isActive ? NAV.textActive  : NAV.textBase,
                    background: isActive ? NAV.bgActive    : 'transparent',
                    borderLeft: isActive
                      ? `3px solid ${NAV.accentGlow}`
                      : '3px solid transparent',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: item.nested ? 12 : 13,
                    marginBottom: 1,
                    transition: 'background 0.12s, color 0.12s, border-color 0.12s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  })}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    if (!el.getAttribute('aria-current')) {
                      el.style.background = NAV.bgHover;
                      el.style.color = '#d8ecff';
                    }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    if (!el.getAttribute('aria-current')) {
                      el.style.background = 'transparent';
                      el.style.color = NAV.textBase;
                    }
                  }}
                >
                  <i
                    className={`ti ${item.icon}`}
                    style={{
                      fontSize: item.nested ? 14 : 16,
                      flexShrink: 0,
                      width: collapsed ? 'auto' : 18,
                      textAlign: 'center',
                      opacity: 0.9,
                    }}
                  />
                  {!collapsed && (
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Footer — User Card ─────────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${NAV.border}`,
          background: NAV.footerBg,
          padding: collapsed ? '12px 0' : '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10,
          flexShrink: 0,
        }}>
          {/* Avatar */}
          <div style={{
            width: 30, height: 30,
            borderRadius: '50%',
            background: NAV.avatarGrad,
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(59,130,246,0.4)',
          }}>
            {userInitials}
          </div>

          {!collapsed && (
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#e8f4ff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}>{user?.name}</div>
              <div style={{
                fontSize: 10,
                color: NAV.groupLabel,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 1,
              }}>{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar width CSS variable for main content offset */}
      <style>{`
        :root { --sidebar-w: ${W}px; }
        .main-content { margin-left: var(--sidebar-w) !important; transition: margin-left 0.22s cubic-bezier(0.4,0,0.2,1); }
      `}</style>
    </>
  );
}
