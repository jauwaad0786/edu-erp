import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_ICON = {
  TICKET:       { icon: 'ti-ticket',        color: '#4f46e5' },
  CHAT:         { icon: 'ti-message',        color: '#0891b2' },
  MEETING:      { icon: 'ti-calendar-event', color: '#7c3aed' },
  ANNOUNCEMENT: { icon: 'ti-speakerphone',   color: '#16a34a' },
  SYSTEM:       { icon: 'ti-info-circle',    color: '#d97706' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SupportPanel({ isOpen, onClose, darkMode }) {
  const navigate           = useNavigate();
  const { refresh }        = useNotifications();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return ()  => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  // Fetch notifications when panel opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get('/support/notifications?per_page=15')
      .then(r => setNotifs(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const markAllRead = async () => {
    await api.patch('/support/notifications/mark-all-read').catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    refresh();
  };

  const markRead = async (notif) => {
    if (!notif.is_read) {
      await api.patch(`/support/notifications/${notif.id}/read`).catch(() => {});
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      refresh();
    }
    // Navigate to ticket if applicable
    if (notif.ticket_id && notif.notif_type === 'TICKET') {
      navigate(`/support/tickets/${notif.ticket_id}`);
      onClose();
    } else if (notif.notif_type === 'MEETING') {
      navigate('/support/meetings');
      onClose();
    } else if (notif.notif_type === 'ANNOUNCEMENT') {
      navigate('/support/announcements');
      onClose();
    }
  };

  const bg      = darkMode ? '#141b2d' : '#ffffff';
  const border  = darkMode ? '#1e293b' : '#e2e8f0';
  const textPri = darkMode ? '#f1f5f9' : '#0f172a';
  const textSec = darkMode ? '#94a3b8' : '#64748b';
  const hoverBg = darkMode ? '#1e293b' : '#f8fafc';
  const unread  = notifs.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'transparent',
      }} />

      {/* Panel */}
      <div ref={panelRef} style={{
        position:    'fixed',
        top:         56,
        right:       16,
        width:       380,
        maxHeight:   520,
        background:  bg,
        border:      `1px solid ${border}`,
        borderRadius: 14,
        boxShadow:   '0 12px 40px rgba(0,0,0,0.15)',
        zIndex:      1000,
        display:     'flex',
        flexDirection: 'column',
        overflow:    'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding:        '14px 16px',
          borderBottom:   `1px solid ${border}`,
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-bell" style={{ fontSize: 16, color: '#4f46e5' }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: textPri }}>
              Notifications
            </span>
            {unread > 0 && (
              <span style={{
                background: '#4f46e5', color: '#fff',
                fontSize: 10, fontWeight: 700,
                padding: '1px 7px', borderRadius: 20,
              }}>{unread}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {unread > 0 && (
              <button onClick={markAllRead} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: '#4f46e5', fontWeight: 600,
              }}>
                Mark all read
              </button>
            )}
            <button onClick={() => { navigate('/support/notifications'); onClose(); }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: textSec,
            }}>
              View all
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: textSec, fontSize: 13 }}>
              <i className="ti ti-loader-2" style={{ fontSize: 18, marginRight: 6 }} />
              Loading...
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <i className="ti ti-bell-off" style={{ fontSize: 32, color: textSec, display: 'block', marginBottom: 8 }} />
              <div style={{ color: textSec, fontSize: 13 }}>Koi notification nahi</div>
            </div>
          ) : (
            notifs.map(n => {
              const cfg = TYPE_ICON[n.notif_type] || TYPE_ICON.SYSTEM;
              return (
                <div key={n.id} onClick={() => markRead(n)} style={{
                  display:    'flex',
                  gap:        12,
                  padding:    '12px 16px',
                  cursor:     'pointer',
                  background: n.is_read ? 'transparent' : (darkMode ? 'rgba(79,70,229,0.08)' : '#f5f3ff'),
                  borderBottom: `1px solid ${border}`,
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : (darkMode ? 'rgba(79,70,229,0.08)' : '#f5f3ff')}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: cfg.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`ti ${cfg.icon}`} style={{ fontSize: 16, color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: n.is_read ? 500 : 700,
                      color: textPri, marginBottom: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {n.title}
                    </div>
                    <div style={{
                      fontSize: 11, color: textSec,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 10, color: textSec, marginTop: 3 }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#4f46e5', flexShrink: 0, marginTop: 4,
                    }} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:     '10px 16px',
          borderTop:   `1px solid ${border}`,
          display:     'flex',
          gap:         8,
        }}>
          <button onClick={() => { navigate('/support/tickets/new'); onClose(); }} style={{
            flex: 1, padding: '7px 0', borderRadius: 8,
            background: '#4f46e5', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} /> New Ticket
          </button>
          <button onClick={() => { navigate('/support/meetings/new'); onClose(); }} style={{
            flex: 1, padding: '7px 0', borderRadius: 8,
            background: darkMode ? '#1e293b' : '#f1f5f9',
            color: darkMode ? '#cbd5e1' : '#475569',
            border: `1px solid ${border}`, cursor: 'pointer',
            fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <i className="ti ti-calendar-plus" style={{ fontSize: 13 }} /> Book Meeting
          </button>
        </div>
      </div>
    </>
  );
}
