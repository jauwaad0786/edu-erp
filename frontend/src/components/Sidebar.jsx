import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_MENUS = {
  SUPER_ADMIN: [
    { group: 'Overview', items: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/dashboard' },
    ]},
    { group: 'Management', items: [
      { icon: 'ti-building-school', label: 'Schools', path: '/schools' },
      { icon: 'ti-users', label: 'Users', path: '/users' },
    ]},
  ],
  PRINCIPAL: [
    { group: 'Overview', items: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/dashboard' },
    ]},
    { group: 'Academics', items: [
      { icon: 'ti-school', label: 'Classes', path: '/classes' },
      { icon: 'ti-books', label: 'Subjects', path: '/subjects' },
      { icon: 'ti-calendar-time', label: 'Timetable', path: '/timetable' },
    ]},
    { group: 'People', items: [
      { icon: 'ti-user-graduate', label: 'Students', path: '/students' },
      { icon: 'ti-user-plus', label: 'New Admission', path: '/admission', nested: true },
      { icon: 'ti-chalkboard', label: 'Teachers', path: '/teachers' },
    ]},
    { group: 'Operations', items: [
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-pencil', label: 'Exams', path: '/exams' },
      { icon: 'ti-chart-bar', label: 'Marks', path: '/marks' },
      { icon: 'ti-receipt', label: 'Fees', path: '/fees' },
    ]},
    { group: 'Documents', items: [
      { icon: 'ti-file-text', label: 'Documents', path: '/documents' },
      { icon: 'ti-notes', label: 'Notes', path: '/notes' },
      { icon: 'ti-id-badge', label: 'ID Cards', path: '/id-cards' },
    ]},
    { group: 'Settings', items: [
      { icon: 'ti-bolt', label: 'My Plan & Services', path: '/my-services' },
      { icon: 'ti-settings', label: 'School Settings', path: '/school-settings' },
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
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-pencil', label: 'Marks Entry', path: '/marks' },
      { icon: 'ti-upload', label: 'Upload Notes', path: '/notes' },
      { icon: 'ti-user-graduate', label: 'My Students', path: '/students' },
    ]},
  ],
  STUDENT: [
    { group: 'Overview', items: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/dashboard' },
    ]},
    { group: 'My School', items: [
      { icon: 'ti-calendar-time', label: 'Timetable', path: '/timetable' },
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-chart-bar', label: 'Results', path: '/results' },
      { icon: 'ti-receipt', label: 'Fees', path: '/fees' },
      { icon: 'ti-notes', label: 'Notes', path: '/notes' },
      { icon: 'ti-ticket', label: 'Admit Card', path: '/admit-card' },
    ]},
  ],
  PARENT: [
    { group: 'Overview', items: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/dashboard' },
    ]},
    { group: 'My Child', items: [
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-chart-bar', label: 'Progress', path: '/results' },
      { icon: 'ti-receipt', label: 'Fees', path: '/fees' },
    ]},
  ],
};

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin', PRINCIPAL: 'Principal', VICE_PRINCIPAL: 'Vice Principal',
  TEACHER: 'Teacher', ACCOUNTANT: 'Accountant', RECEPTIONIST: 'Receptionist',
  LIBRARIAN: 'Librarian', STUDENT: 'Student', PARENT: 'Parent',
};

function iconBtnStyle(border, color) {
  return {
    background: 'transparent', border: `1px solid ${border}`,
    borderRadius: 6, width: 26, height: 26, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color, flexShrink: 0,
  };
}

export default function Sidebar({ darkMode }) {
  const { user } = useAuth();
  const groups = ROLE_MENUS[user?.role] || [];
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const W = collapsed ? 64 : 232;

  const bg         = darkMode ? '#0f172a' : '#ffffff';
  const border     = darkMode ? '#1e293b' : '#e8edf3';
  const textMuted  = darkMode ? '#64748b' : '#94a3b8';
  const textBase   = darkMode ? '#94a3b8' : '#475569';
  const activeText = darkMode ? '#f1f5f9' : '#0f172a';
  const activeBg   = darkMode ? 'rgba(99,102,241,0.16)' : '#eef2ff';
  const activeAccent = '#4f46e5';
  const hoverBg    = darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc';
  const divider    = darkMode ? '#1e293b' : '#f1f5f9';
  const inputBg    = darkMode ? '#1e293b' : '#f8fafc';
  const logoGrad   = 'linear-gradient(135deg,#4f46e5,#7c3aed)';

  // Backend se school ka naam/code aane ka safe fallback
  const schoolName = user?.school?.name || user?.school_name || 'EduERP';
  const schoolCode = user?.school?.code || user?.school_code || null;
  const initial = schoolName.charAt(0).toUpperCase();

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
        width: W, minWidth: W, position: 'fixed', top: 0, left: 0,
        height: '100vh', background: bg,
        display: 'flex', flexDirection: 'column',
        zIndex: 100, transition: 'width 0.2s ease',
        overflow: 'hidden', borderRight: `1px solid ${border}`,
      }}>

        {/* Brand */}
        <div style={{
          padding: collapsed ? '16px 0' : '16px 16px 14px',
          borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: collapsed ? 'center' : 'flex-start',
          justifyContent: collapsed ? 'center' : 'space-between', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: logoGrad,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{initial}</span>
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{
                  color: darkMode ? '#f1f5f9' : '#0f172a', fontWeight: 700, fontSize: 13,
                  lineHeight: 1.2, letterSpacing: '-0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{schoolName}</div>
                <div style={{ color: textMuted, fontSize: 10, fontWeight: 500, letterSpacing: '0.03em', marginTop: 2 }}>
                  {schoolCode ? `Code: ${schoolCode} · ` : ''}{ROLE_LABELS[user?.role] || user?.role}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} title="Collapse sidebar" style={iconBtnStyle(border, textMuted)}>
              <i className="ti ti-layout-sidebar-left-collapse" style={{ fontSize: 14 }} aria-hidden="true" />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={() => setCollapsed(false)} title="Expand sidebar"
            style={{ ...iconBtnStyle(border, textMuted), margin: '8px auto 0' }}>
            <i className="ti ti-layout-sidebar-right-collapse" style={{ fontSize: 14 }} aria-hidden="true" />
          </button>
        )}

        {/* Search */}
        {!collapsed && (
          <div style={{ padding: '10px 12px 4px' }}>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-search" style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: textMuted,
              }} aria-hidden="true" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search modules…"
                style={{
                  width: '100%', padding: '7px 10px 7px 30px', fontSize: 12,
                  background: inputBg, border: `1px solid ${border}`,
                  borderRadius: 8, color: activeText, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 8px' }}>
          {filteredGroups.length === 0 && (
            <div style={{ padding: '20px 8px', fontSize: 12, color: textMuted, textAlign: 'center' }}>
              Koi module nahi mila
            </div>
          )}
          {filteredGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 2 }}>
              {!collapsed && (
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                  color: textMuted, padding: '10px 8px 4px', textTransform: 'uppercase',
                }}>{group.group}</div>
              )}
              {collapsed && gi > 0 && <div style={{ height: 1, background: divider, margin: '8px 4px' }} />}

              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 9,
                    padding: collapsed ? '9px 0' : '7px 8px',
                    paddingLeft: collapsed ? undefined : (item.nested ? 26 : 8),
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 8,
                    color: isActive ? activeText : textBase,
                    background: isActive ? activeBg : 'transparent',
                    borderLeft: isActive ? `2.5px solid ${activeAccent}` : '2.5px solid transparent',
                    textDecoration: 'none', fontWeight: isActive ? 600 : 400,
                    fontSize: item.nested ? 12 : 13, marginBottom: 1,
                    transition: 'background 0.12s, color 0.12s', whiteSpace: 'nowrap',
                  })}
                  onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
                >
                  <i
                    className={`ti ${item.icon}`}
                    aria-hidden="true"
                    style={{ fontSize: item.nested ? 14 : 16, flexShrink: 0, width: collapsed ? 'auto' : 18, textAlign: 'center' }}
                  />
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer - user mini card */}
        {!collapsed && (
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>
              {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: darkMode ? '#e2e8f0' : '#0f172a',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {ROLE_LABELS[user?.role] || user?.role}
              </div>
            </div>
          </div>
        )}
      </aside>

      <style>{`:root { --sidebar-w: ${W}px; }`}</style>
    </>
  );
}
