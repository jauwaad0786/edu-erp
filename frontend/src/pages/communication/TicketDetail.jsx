import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';
import { StatusBadge, PriorityBadge } from '../../components/communication/StatusBadge';

const STATUS_OPTIONS = ['OPEN', 'PENDING', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'REJECTED'];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TicketDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [darkMode] = useState(() => localStorage.getItem('ederp_theme') === 'dark');
  const isAdmin   = (localStorage.getItem('user_role') || '') === 'SUPER_ADMIN';

  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply,   setReply]   = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState(null);

  const fetchTicket = useCallback(() => {
    api.get(`/support/tickets/${id}`)
      .then(r => setTicket(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/support/tickets/${id}/reply`, { message: reply, is_internal: isInternal });
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        await api.post(`/support/tickets/${id}/attachment`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setFile(null);
      }
      setReply('');
      setIsInternal(false);
      fetchTicket();
    } catch {
      alert('Reply send nahi hua, dobara try karo');
    }
    setSending(false);
  };

  const updateStatus = async (newStatus) => {
    try {
      await api.patch(`/support/tickets/${id}/status`, { status: newStatus });
      fetchTicket();
    } catch {
      alert('Status update nahi hua');
    }
  };

  const cardBg = { background: darkMode ? '#141b2d' : undefined, borderColor: darkMode ? '#1e293b' : undefined };
  const border = darkMode ? '#1e293b' : '#e2e8f0';

  if (loading) {
    return (
      <div className={`app-shell${darkMode ? ' theme-dark' : ''}`}>
        <Sidebar darkMode={darkMode} />
        <div className="main-content">
          <Navbar title="Ticket Detail" darkMode={darkMode} onToggleDark={() => {}} />
          <div className="page-body" style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={`app-shell${darkMode ? ' theme-dark' : ''}`}>
        <Sidebar darkMode={darkMode} />
        <div className="main-content">
          <Navbar title="Ticket Detail" darkMode={darkMode} onToggleDark={() => {}} />
          <div className="page-body" style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Ticket nahi mila</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell${darkMode ? ' theme-dark' : ''}`}>
      <Sidebar darkMode={darkMode} />
      <div className="main-content">
        <Navbar title={ticket.ticket_no} darkMode={darkMode} onToggleDark={() => {}} />
        <div className="page-body">

          <button onClick={() => navigate('/support/tickets')} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
            color: darkMode ? '#94a3b8' : '#64748b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 13 }} aria-hidden="true" /> Back to Inbox
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 300px' : '1fr', gap: 20 }}>

            {/* Main thread */}
            <div>
              <div className="card" style={{ marginBottom: 16, ...cardBg }}>
                <div style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace' }}>{ticket.ticket_no}</span>
                      <h2 style={{ margin: '4px 0 0', fontSize: 18, color: darkMode ? '#f1f5f9' : '#0f172a' }}>{ticket.subject}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#64748b', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span><i className="ti ti-user" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true" />{ticket.raiser_name} ({ticket.raiser_role})</span>
                    <span><i className="ti ti-building" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true" />{ticket.school_name}</span>
                    <span><i className="ti ti-apps" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true" />{ticket.module_name || '—'}</span>
                    <span><i className="ti ti-clock" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true" />{timeAgo(ticket.created_at)}</span>
                  </div>
                  {ticket.description && (
                    <p style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.5, color: darkMode ? '#cbd5e1' : '#334155' }}>
                      {ticket.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Replies thread */}
              <div className="card" style={{ ...cardBg }}>
                <div className="card-header">
                  <h4 style={{ margin: 0, fontSize: 13.5 }}>
                    <i className="ti ti-messages" style={{ fontSize: 15, marginRight: 6, color: '#4f46e5' }} aria-hidden="true" />
                    Conversation ({ticket.replies?.length || 0})
                  </h4>
                </div>

                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(ticket.replies || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, fontSize: 12.5, color: darkMode ? '#64748b' : '#94a3b8' }}>
                      Koi reply nahi abhi tak
                    </div>
                  ) : ticket.replies.map(r => (
                    <div key={r.id} style={{
                      padding: '10px 14px', borderRadius: 10,
                      background: r.is_internal
                        ? (darkMode ? 'rgba(217,119,6,0.1)' : '#fffbeb')
                        : (darkMode ? '#0f172a' : '#f8fafc'),
                      border: r.is_internal ? '1px dashed #d97706' : `1px solid ${border}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                          {r.reply_name} <span style={{ fontWeight: 400, color: darkMode ? '#64748b' : '#94a3b8' }}>· {r.reply_role}</span>
                          {r.is_internal && <span style={{ marginLeft: 6, fontSize: 10, color: '#d97706', fontWeight: 700 }}>INTERNAL NOTE</span>}
                        </span>
                        <span style={{ fontSize: 11, color: darkMode ? '#64748b' : '#94a3b8' }}>{timeAgo(r.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: darkMode ? '#cbd5e1' : '#334155', whiteSpace: 'pre-wrap' }}>{r.message}</div>
                      {(r.attachments || []).map(a => (
                        <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6,
                          fontSize: 11.5, color: '#4f46e5',
                        }}>
                          <i className="ti ti-paperclip" style={{ fontSize: 12 }} aria-hidden="true" /> {a.file_name}
                        </a>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Reply box */}
                {!['CLOSED', 'REJECTED'].includes(ticket.status) && (
                  <div style={{ padding: '14px 18px', borderTop: `1px solid ${border}` }}>
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder="Apna reply likho..."
                      style={{
                        width: '100%', minHeight: 80, padding: 10, borderRadius: 8, resize: 'vertical',
                        fontFamily: 'inherit', fontSize: 13,
                        border: `1px solid ${border}`, background: darkMode ? '#0f172a' : '#fff',
                        color: darkMode ? '#e2e8f0' : '#0f172a',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <label style={{ fontSize: 11.5, color: darkMode ? '#94a3b8' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <i className="ti ti-paperclip" style={{ fontSize: 14 }} aria-hidden="true" />
                          {file ? file.name.slice(0, 18) : 'Attach file'}
                          <input type="file" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
                        </label>
                        {isAdmin && (
                          <label style={{ fontSize: 11.5, color: '#d97706', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                            Internal note
                          </label>
                        )}
                      </div>
                      <button className="btn btn-primary btn-sm" disabled={sending || !reply.trim()} onClick={sendReply}>
                        {sending ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin sidebar — status control */}
            {isAdmin && (
              <div className="card" style={{ ...cardBg, alignSelf: 'flex-start' }}>
                <div className="card-header"><h4 style={{ margin: 0, fontSize: 13 }}>Manage Ticket</h4></div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: 5 }}>Status</label>
                    <select className="form-select" style={{ width: '100%' }} value={ticket.status}
                      onChange={e => updateStatus(e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ fontSize: 11.5, color: darkMode ? '#64748b' : '#94a3b8' }}>
                    <div>Product: <strong>{ticket.product_type}</strong></div>
                    <div>Category: <strong>{ticket.category}</strong></div>
                    <div>Assigned: <strong>{ticket.assigned_to || 'Unassigned'}</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        .theme-dark { background: #0b1220; }
        .theme-dark .main-content { background: #0b1220; }
        .theme-dark .card { background: #141b2d !important; border-color: #1e293b !important; }
        .theme-dark .card-header { border-color: #1e293b !important; }
        .theme-dark h2, .theme-dark h4 { color: #f1f5f9 !important; }
      `}</style>
    </div>
  );
}
