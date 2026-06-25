import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import SupportPanel from './SupportPanel';

function Badge({ count, color = '#ef4444' }) {
  if (!count || count === '0') return null;
  return (
    <span style={{
      position:   'absolute',
      top:        -4,
      right:      -4,
      minWidth:   16,
      height:     16,
      padding:    '0 4px',
      borderRadius: 20,
      background: color,
      color:      '#fff',
      fontSize:   9,
      fontWeight: 800,
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1,
      border:     '2px solid var(--surface, #fff)',
      zIndex:     10,
    }}>
      {count}
    </span>
  );
}

function IconBtn({ icon, badge, badgeColor, onClick, title, active, darkMode }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position:   'relative',
        width:      36,
        height:     36,
        borderRadius: 8,
        border:     'none',
        cursor:     'pointer',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active
          ? (darkMode ? 'rgba(79,70,229,0.2)' : '#eef2ff')
          : hover
            ? (darkMode ? '#1e293b' : '#f1f5f9')
            : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <i className={`ti ${icon}`} style={{
        fontSize: 18,
        color:    active ? '#4f46e5' : (darkMode ? '#94a3b8' : '#475569'),
      }} />
      <Badge count={badge} color={badgeColor} />
    </button>
  );
}

export default function NotificationBell({ darkMode }) {
  const navigate = useNavigate();
  const { ticketBadge, messageBadge } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

      {/* Bell — notifications + tickets */}
      <IconBtn
        icon       = "ti-bell"
        badge      = {ticketBadge}
        badgeColor = "#4f46e5"
        title      = "Notifications"
        active     = {panelOpen}
        darkMode   = {darkMode}
        onClick    = {() => setPanelOpen(o => !o)}
      />

      {/* Chat icon */}
      <IconBtn
        icon       = "ti-message-circle"
        badge      = {messageBadge}
        badgeColor = "#0891b2"
        title      = "Messages"
        darkMode   = {darkMode}
        onClick    = {() => navigate('/support/chat')}
      />

      {/* Support icon — quick new ticket */}
      <IconBtn
        icon     = "ti-headset"
        title    = "Customer Support"
        darkMode = {darkMode}
        onClick  = {() => navigate('/support')}
      />

      {/* Slide-out notification panel */}
      <SupportPanel
        isOpen  = {panelOpen}
        onClose = {() => setPanelOpen(false)}
        darkMode= {darkMode}
      />
    </div>
  );
}
