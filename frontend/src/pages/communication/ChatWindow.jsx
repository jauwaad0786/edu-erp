import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function ChatWindow() {
  const [darkMode] = useState(() => localStorage.getItem('ederp_theme') === 'dark');

  const [inbox,    setInbox]    = useState([]);
  const [active,   setActive]   = useState(null); // { user_id, name, role }
  const [messages, setMessages] = useState([]);
  const [draft,    setDraft]    = useState('');
  const [search,   setSearch]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [file, setFile] = useState(null);
  const bottomRef = useRef(null);

  const fetchInbox = useCallback(() => {
    api.get('/support/chat/inbox').then(r => setInbox(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  const openConversation = useCallback((user) => {
    setActive(user);
    api.get(`/support/chat/conversation/${user.user_id}`, { params: { per_page: 100 } })
      .then(r => setMessages(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      api.get(`/support/chat/conversation/${active.user_id}`, { params: { per_page: 100 } })
        .then(r => setMessages(r.data.data || []))
        .catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const searchUsers = (q) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    api.get('/support/chat/users', { params: { search: q } })
      .then(r => setSearchResults(r.data || []))
      .catch(() => {});
  };

  const send = async () => {
    if (!active) return;
    if (!draft.trim() && !file) return;
    try {
      if (file) {
        const fd = new FormData();
        fd.append('receiver_id', active.user_id);
        fd.append('file', file);
        fd.append('caption', draft);
        await api.post('/support/chat/send-file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setFile(null);
      } else {
        await api.post('/support/chat', { receiver_id: active.user_id, message: draft });
      }
      setDraft('');
      openConversation(active);
      fetchInbox();
    } catch {
      alert('Message send nahi hua');
    }
  };

  const border  = darkMode ? '#1e293b' : '#e2e8f0';
  const bg      = darkMode ? '#141b2d' : '#fff';
  const textPri = darkMode ? '#f1f5f9' : '#0f172a';
  const textSec = darkMode ? '#94a3b8' : '#64748b';

  return (
    <div className={`app-shell${darkMode ? ' theme-dark' : ''}`}>
      <Sidebar darkMode={darkMode} />
      <div className="main-content">
        <Navbar title="Messages" darkMode={darkMode} onToggleDark={() => {}} />
        <div className="page-body" style={{ height: 'calc(100vh - 110px)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '300px 1fr', height: '100%',
            border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden', background: bg,
          }}>

            {/* Inbox list */}
            <div style={{ borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 12, borderBottom: `1px solid ${border}` }}>
                <input
                  value={search}
                  onChange={e => searchUsers(e.target.value)}
                  placeholder="Search people..."
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12.5,
                    border: `1px solid ${border}`, background: darkMode ? '#0f172a' : '#f8fafc', color: textPri,
                  }}
                />
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {search.trim() && searchResults.length > 0 && (
                  <>
                    <div style={{ padding: '8px 14px 4px', fontSize: 10.5, color: textSec, fontWeight: 700 }}>NEW CHAT</div>
                    {searchResults.map(u => (
                      <div key={u.id} onClick={() => { openConversation({ user_id: u.id, name: u.name, role: u.role }); setSearch(''); setSearchResults([]); }}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${border}` }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: textPri }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: textSec }}>{u.role}</div>
                      </div>
                    ))}
                  </>
                )}

                {inbox.length === 0 && !search.trim() ? (
                  <div style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: textSec }}>Koi conversation nahi</div>
                ) : !search.trim() && inbox.map(c => (
                  <div key={c.user_id} onClick={() => openConversation(c)} style={{
                    padding: '12px 14px', cursor: 'pointer', borderBottom: `1px solid ${border}`,
                    background: active?.user_id === c.user_id ? (darkMode ? '#1e293b' : '#eef2ff') : 'transparent',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: c.unread_count > 0 ? 700 : 600, color: textPri }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.last_message}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 10, color: textSec }}>{timeAgo(c.last_time)}</span>
                      {c.unread_count > 0 && (
                        <span style={{ background: '#4f46e5', color: '#fff', fontSize: 9, fontWeight: 800, borderRadius: 20, padding: '1px 6px' }}>
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {!active ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textSec, fontSize: 13 }}>
                  Chat shuru karne ke liye left se ek person chuno
                </div>
              ) : (
                <>
                  <div style={{ padding: '12px 18px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#4f46e518',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4f46e5', fontSize: 13,
                    }}>{active.name?.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: textPri }}>{active.name}</div>
                      <div style={{ fontSize: 11, color: textSec }}>{active.role}</div>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {messages.map(m => {
                      const mine = m.sender_id === active.user_id ? false : true;
                      return (
                        <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '65%', padding: '8px 12px', borderRadius: 12, fontSize: 13,
                            background: mine ? '#4f46e5' : (darkMode ? '#1e293b' : '#f1f5f9'),
                            color: mine ? '#fff' : textPri,
                          }}>
                            {m.file_url ? (
                              <a href={m.file_url} target="_blank" rel="noreferrer" style={{ color: mine ? '#e0e7ff' : '#4f46e5', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <i className="ti ti-paperclip" style={{ fontSize: 13 }} aria-hidden="true" /> {m.file_name || 'File'}
                              </a>
                            ) : m.message}
                            <div style={{ fontSize: 9.5, opacity: 0.7, marginTop: 3, textAlign: 'right' }}>{timeAgo(m.created_at)}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>

                  <div style={{ padding: 12, borderTop: `1px solid ${border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ cursor: 'pointer', color: textSec }}>
                      <i className="ti ti-paperclip" style={{ fontSize: 18 }} aria-hidden="true" />
                      <input type="file" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
                    </label>
                    <input
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') send(); }}
                      placeholder={file ? `Attached: ${file.name}` : 'Message likho...'}
                      style={{
                        flex: 1, padding: '9px 14px', borderRadius: 20, fontSize: 13,
                        border: `1px solid ${border}`, background: darkMode ? '#0f172a' : '#f8fafc', color: textPri,
                      }}
                    />
                    <button onClick={send} style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#4f46e5',
                      color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="ti ti-send" style={{ fontSize: 15 }} aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .theme-dark { background: #0b1220; }
        .theme-dark .main-content { background: #0b1220; }
      `}</style>
    </div>
  );
}
