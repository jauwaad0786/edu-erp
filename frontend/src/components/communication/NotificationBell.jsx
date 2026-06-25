import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import SupportPanel from './SupportPanel';

// ─── Single badge dot ─────────────────────────────────────────────────────────
function Badge({ count }) {
  if (!count || count === '0') return null;
  return (
    <span style={{
      position:       'absolute',
      top:            -4,
      right:          -4,
      minWidth:       16,
      height:         16,
      padding:        '0 4px',
      borderRadius:   20,
      background:     '#ef4444',
      color:          '#fff',
      fontSize:       9,
      fontWeight:     800,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      lineHeight:     1,
      border:         '2px solid var(--surface, #fff)',
      zIndex:         10,
      pointerEvents:  'none',
    }}>
      {count}
    </span>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function NotificationBell({ darkMode }) {
  const { totalBadge, messageBadge } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const [hover, setHover]         = useState(false);

  // Total unread = ticket alerts + chat messages combined for the badge
  const badgeCount = totalBadge;

  return (
    <>
      {/* Single headset button */}
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          title       = "Help & Support"
          onClick     = {() => setPanelOpen(o => !o)}
          onMouseEnter= {() => setHover(true)}
          onMouseLeave= {() => setHover(false)}
          style={{
            position:       'relative',
            width:          36,
            height:         36,
            borderRadius:   9,
            border:         panelOpen
              ? '1.5px solid #4f46e5'
              : `1px solid ${darkMode ? '#1e293b' : '#e8edf3'}`,
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            background:     panelOpen
              ? (darkMode ? 'rgba(79,70,229,0.18)' : '#eef2ff')
              : hover
                ? (darkMode ? '#1e293b' : '#f1f5f9')
                : (darkMode ? '#0f172a' : '#f8fafc'),
            transition:     'all 0.15s',
            outline:        'none',
          }}
        >
          <i
            className="ti ti-headset"
            style={{
              fontSize: 17,
              color:    panelOpen
                ? '#4f46e5'
                : (darkMode ? '#94a3b8' : '#475569'),
            }}
          />
          <Badge count={badgeCount} />
        </button>
      </div>

      {/* Slide-out panel — 3 tabs inside */}
      <SupportPanel
        isOpen         = {panelOpen}
        onClose        = {() => setPanelOpen(false)}
        darkMode       = {darkMode}
        unreadMessages = {messageBadge}
      />
    </>
  );
}
