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
      { icon: 'ti-building-school', label: 'Schools', path: '/schools' },
      { icon: 'ti-users', label: 'Users', path: '/users' },
      { icon: 'ti-building-school', label: 'Schools',   path: '/schools' },
      { icon: 'ti-users',           label: 'Users',     path: '/users' },
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
      { icon: 'ti-school',          label: 'Classes',   path: '/classes' },
      { icon: 'ti-books',           label: 'Subjects',  path: '/subjects' },
      { icon: 'ti-calendar-time',   label: 'Timetable', path: '/timetable' },
    ]},
    { group: 'People', items: [
      { icon: 'ti-user-graduate', label: 'Students', path: '/students' },
      { icon: 'ti-user-plus', label: 'New Admission', path: '/admission', nested: true },
      { icon: 'ti-chalkboard', label: 'Teachers', path: '/teachers' },
      { icon: 'ti-user-graduate', label: 'Students',      path: '/students' },
      { icon: 'ti-user-plus',     label: 'New Admission', path: '/admission', nested: true },
      { icon: 'ti-chalkboard',    label: 'Teachers',      path: '/teachers' },
    ]},
    { group: 'Operations', items: [
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-pencil', label: 'Exams', path: '/exams' },
      { icon: 'ti-chart-bar', label: 'Marks', path: '/marks' },
      { icon: 'ti-receipt', label: 'Fees', path: '/fees' },
      { icon: 'ti-pencil',          label: 'Exams',      path: '/exams' },
      { icon: 'ti-chart-bar',       label: 'Marks',      path: '/marks' },
      { icon: 'ti-receipt',         label: 'Fees',        path: '/fees' },
    ]},
    { group: 'Documents', items: [
      { icon: 'ti-file-text', label: 'Documents', path: '/documents' },
      { icon: 'ti-notes', label: 'Notes', path: '/notes' },
      { icon: 'ti-id-badge', label: 'ID Cards', path: '/id-cards' },
      { icon: 'ti-notes',     label: 'Notes',     path: '/notes' },
      { icon: 'ti-id-badge',  label: 'ID Cards',  path: '/id-cards' },
    ]},
    { group: 'Settings', items: [
      { icon: 'ti-bolt', label: 'My Plan & Services', path: '/my-services' },
      { icon: 'ti-settings', label: 'School Settings', path: '/school-settings' },
      { icon: 'ti-bolt',     label: 'My Plan & Services', path: '/my-services' },
      { icon: 'ti-settings', label: 'School Settings',    path: '/school-settings' },
    ]},
  ],
  TEACHER: [
@@ -50,23 +71,23 @@ const ROLE_MENUS = {
      { icon: 'ti-calendar-time', label: 'Timetable', path: '/timetable' },
    ]},
    { group: 'My Work', items: [
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-pencil', label: 'Marks Entry', path: '/marks' },
      { icon: 'ti-upload', label: 'Upload Notes', path: '/notes' },
      { icon: 'ti-user-graduate', label: 'My Students', path: '/students' },
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
      { icon: 'ti-calendar-time', label: 'Timetable', path: '/timetable' },
      { icon: 'ti-calendar-time',   label: 'Timetable',  path: '/timetable' },
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-chart-bar', label: 'Results', path: '/results' },
      { icon: 'ti-receipt', label: 'Fees', path: '/fees' },
      { icon: 'ti-notes', label: 'Notes', path: '/notes' },
      { icon: 'ti-ticket', label: 'Admit Card', path: '/admit-card' },
      { icon: 'ti-chart-bar',       label: 'Results',    path: '/results' },
      { icon: 'ti-receipt',         label: 'Fees',        path: '/fees' },
      { icon: 'ti-notes',           label: 'Notes',      path: '/notes' },
      { icon: 'ti-ticket',          label: 'Admit Card', path: '/admit-card' },
    ]},
  ],
  PARENT: [
@@ -75,8 +96,8 @@ const ROLE_MENUS = {
    ]},
    { group: 'My Child', items: [
      { icon: 'ti-clipboard-check', label: 'Attendance', path: '/attendance' },
      { icon: 'ti-chart-bar', label: 'Progress', path: '/results' },
      { icon: 'ti-receipt', label: 'Fees', path: '/fees' },
      { icon: 'ti-chart-bar',       label: 'Progress',   path: '/results' },
      { icon: 'ti-receipt',         label: 'Fees',        path: '/fees' },
    ]},
  ],
};
@@ -87,39 +108,20 @@ const ROLE_LABELS = {
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function Sidebar({ darkMode }) {
  const { user } = useAuth();
  const groups = ROLE_MENUS[user?.role] || [];
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const groups   = ROLE_MENUS[user?.role] || [];

  const W = collapsed ? 64 : 232;
  const [collapsed, setCollapsed] = useState(false);
  const [search,    setSearch]    = useState('');

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
  const W = collapsed ? 60 : 230;

  // Backend se school ka naam/code aane ka safe fallback
  const schoolName = user?.school?.name || user?.school_name || 'EduERP';
  const schoolCode = user?.school?.code || user?.school_code || null;
  const initial = schoolName.charAt(0).toUpperCase();
  const initial    = schoolName.charAt(0).toUpperCase();
  const userInitials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
@@ -132,150 +134,313 @@ export default function Sidebar({ darkMode }) {
  return (
    <>
      <aside style={{
        width: W, minWidth: W, position: 'fixed', top: 0, left: 0,
        height: '100vh', background: bg,
        width: W, minWidth: W, maxWidth: W,
        position: 'fixed', top: 0, left: 0,
        height: '100vh',
        background: NAV.bg,
        display: 'flex', flexDirection: 'column',
        zIndex: 100, transition: 'width 0.2s ease',
        overflow: 'hidden', borderRight: `1px solid ${border}`,
        zIndex: 100,
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        borderRight: `1px solid ${NAV.border}`,
        boxShadow: '2px 0 12px rgba(0,0,0,0.35)',
      }}>

        {/* Brand */}
        {/* ── Brand Header ───────────────────────────────────────────── */}
        <div style={{
          padding: collapsed ? '16px 0' : '16px 16px 14px',
          borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: collapsed ? 'center' : 'flex-start',
          justifyContent: collapsed ? 'center' : 'space-between', gap: 10,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
            {/* Logo circle */}
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: logoGrad,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              width: 32, height: 32, borderRadius: 8,
              background: NAV.logoGrad,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
            }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{initial}</span>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: '-0.5px' }}>{initial}</span>
            </div>

            {!collapsed && (
              <div style={{ minWidth: 0 }}>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  color: darkMode ? '#f1f5f9' : '#0f172a', fontWeight: 700, fontSize: 13,
                  lineHeight: 1.2, letterSpacing: '-0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{schoolName}</div>
                <div style={{ color: textMuted, fontSize: 10, fontWeight: 500, letterSpacing: '0.03em', marginTop: 2 }}>
                  {schoolCode ? `Code: ${schoolCode} · ` : ''}{ROLE_LABELS[user?.role] || user?.role}
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
            <button onClick={() => setCollapsed(true)} title="Collapse sidebar" style={iconBtnStyle(border, textMuted)}>
              <i className="ti ti-layout-sidebar-left-collapse" style={{ fontSize: 14 }} aria-hidden="true" />
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
          <button onClick={() => setCollapsed(false)} title="Expand sidebar"
            style={{ ...iconBtnStyle(border, textMuted), margin: '8px auto 0' }}>
            <i className="ti ti-layout-sidebar-right-collapse" style={{ fontSize: 14 }} aria-hidden="true" />
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

        {/* Search */}
        {/* ── Search ─────────────────────────────────────────────────── */}
        {!collapsed && (
          <div style={{ padding: '10px 12px 4px' }}>
          <div style={{ padding: '10px 12px 4px', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-search" style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: textMuted,
              }} aria-hidden="true" />
                position: 'absolute', left: 9, top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12, color: NAV.textMuted, pointerEvents: 'none',
              }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search modules…"
                style={{
                  width: '100%', padding: '7px 10px 7px 30px', fontSize: 12,
                  background: inputBg, border: `1px solid ${border}`,
                  borderRadius: 8, color: activeText, outline: 'none', boxSizing: 'border-box',
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

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 8px' }}>
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
            <div style={{ padding: '20px 8px', fontSize: 12, color: textMuted, textAlign: 'center' }}>
            <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: 12, color: NAV.textMuted }}>
              Koi module nahi mila
            </div>
          )}

          {filteredGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 2 }}>
              {!collapsed && (
            <div key={gi} style={{ marginBottom: 4 }}>

              {/* Group label */}
              {!collapsed ? (
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                  color: textMuted, padding: '10px 8px 4px', textTransform: 'uppercase',
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
              {collapsed && gi > 0 && <div style={{ height: 1, background: divider, margin: '8px 4px' }} />}

              {/* Menu items */}
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 9,
                    padding: collapsed ? '9px 0' : '7px 8px',
                    paddingLeft: collapsed ? undefined : (item.nested ? 26 : 8),
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? 0 : 9,
                    padding: collapsed ? '9px 0' : item.nested ? '6px 8px 6px 26px' : '7px 8px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 8,
                    color: isActive ? activeText : textBase,
                    background: isActive ? activeBg : 'transparent',
                    borderLeft: isActive ? `2.5px solid ${activeAccent}` : '2.5px solid transparent',
                    textDecoration: 'none', fontWeight: isActive ? 600 : 400,
                    fontSize: item.nested ? 12 : 13, marginBottom: 1,
                    transition: 'background 0.12s, color 0.12s', whiteSpace: 'nowrap',
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
                  onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent'; }}
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
                    aria-hidden="true"
                    style={{ fontSize: item.nested ? 14 : 16, flexShrink: 0, width: collapsed ? 'auto' : 18, textAlign: 'center' }}
                    style={{
                      fontSize: item.nested ? 14 : 16,
                      flexShrink: 0,
                      width: collapsed ? 'auto' : 18,
                      textAlign: 'center',
                      opacity: 0.9,
                    }}
                  />
                  {!collapsed && item.label}
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
                fontSize: 12, fontWeight: 600, color: darkMode ? '#e2e8f0' : '#0f172a',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontSize: 12,
                fontWeight: 600,
                color: '#e8f4ff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {ROLE_LABELS[user?.role] || user?.role}
              </div>
              <div style={{
                fontSize: 10,
                color: NAV.groupLabel,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 1,
              }}>{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>
        )}
          )}
        </div>
      </aside>

      <style>{`:root { --sidebar-w: ${W}px; }`}</style>
      {/* Sidebar width CSS variable for main content offset */}
      <style>{`
        :root { --sidebar-w: ${W}px; }
        .main-content { margin-left: var(--sidebar-w) !important; transition: margin-left 0.22s cubic-bezier(0.4,0,0.2,1); }
      `}</style>
    </>
  );
}
