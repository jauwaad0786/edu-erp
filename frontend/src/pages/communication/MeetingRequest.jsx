import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';
import { MeetingStatusBadge } from '../../components/communication/StatusBadge';

const MODE_LABEL = {
  GOOGLE_MEET: 'Google Meet', ZOOM: 'Zoom', PHONE: 'Phone Call',
  REMOTE: 'Remote Support', ONSITE: 'On-site Visit',
};

export default function MeetingRequest() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [darkMode] = useState(() => localStorage.getItem('ederp_theme') === 'dark');
  const isAdmin   = (localStorage.getItem('user_role') || '') === 'SUPER_ADMIN';

  const [meetings, setMeetings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(location.pathname.endsWith('/new'));
  const [actionId, setActionId] = useState(null);

  const [form, setForm] = useState({
    topic: '', description: '', meeting_date: '', meeting_time: '',
    priority: 'MEDIUM', preferred_mode: 'GOOGLE_MEET',
  });

  const fetchMeetings = useCallback(() => {
    setLoading(true);
    api.get('/support/meetings', { params: { per_page: 30 } })
      .then(r => setMeetings(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const submitMeeting = async (e) => {
    e.preventDefault();
    if (!form.topic.trim() || !form.meeting_date || !form.meeting_time) {
      alert('Topic, date aur time zaroori hai');
      return;
    }
    try {
      await api.post('/support/meetings', form);
      setShowForm(false);
      setForm({ topic: '', description: '', meeting_date: '', meeting_time: '', priority: 'MEDIUM', preferred_mode: 'GOOGLE_MEET' });
      fetchMeetings();
    } catch (err) {
      alert(err.response?.data?.error || 'Meeting request nahi gaya');
    }
  };

  const doAction = async (id, action, payload = {}) => {
    setActionId(id);
    try {
      await api.post(`/support/meetings/${id}/${action}`, payload);
      fetchMeetings();
    } catch (err) {
      alert(err.response?.data?.error || 'Action fail ho gaya');
    }
    setActionId(null);
  };

  const cardBg = { background: darkMode ? '#141b2d' : undefined, borderColor: darkMode ? '#1e293b' : undefined };
  const border = darkMode ? '#1e293b' : '#e2e8f0';
  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    border: `1px solid ${border}`, background: darkMode ? '#0f172a' : '#fff',
    color: darkMode ? '#e2e8f0' : '#0f172a',
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: darkMode ? '#cbd5e1' : '#334155', marginBottom: 6, display: 'block' };

  return (
    <div className={`app-shell${darkMode ? ' theme-dark' : ''}`}>
      <Sidebar darkMode={darkMode} />
      <div className="main-content">
        <Navbar title="Meetings" darkMode={darkMode} onToggleDark={() => {}} />
        <div className="page-body">

          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="page-title">{isAdmin ? 'All Meeting Requests' : 'My Meetings'}</h2>
              <p className="page-subtitle">{meetings.length} meeting{meetings.length === 1 ? '' : 's'}</p>
            </div>
            {!isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-calendar-plus" style={{ fontSize: 14 }} aria-hidden="true" /> {showForm ? 'Cancel' : 'Book Meeting'}
              </button>
            )}
          </div>

          {showForm && !isAdmin && (
            <div className="card" style={{ marginBottom: 20, maxWidth: 640, ...cardBg }}>
              <form onSubmit={submitMeeting} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Topic *</label>
                  <input style={inputStyle} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                    placeholder="e.g. Fee module training session" />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, minHeight: 70, fontFamily: 'inherit', resize: 'vertical' }}
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Date *</label>
                    <input type="date" style={inputStyle} value={form.meeting_date}
                      onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} min={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Time *</label>
                    <input type="text" style={inputStyle} placeholder="10:30 AM" value={form.meeting_time}
                      onChange={e => setForm(f => ({ ...f, meeting_time: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <select className="form-select" style={inputStyle} value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Preferred Mode</label>
                    <select className="form-select" style={inputStyle} value={form.preferred_mode}
                      onChange={e => setForm(f => ({ ...f, preferred_mode: e.target.value }))}>
                      {Object.entries(MODE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </form>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : meetings.length === 0 ? (
            <div className="card" style={{ ...cardBg, padding: 40, textAlign: 'center' }}>
              <i className="ti ti-calendar-off" style={{ fontSize: 32, color: darkMode ? '#475569' : '#cbd5e1', display: 'block', marginBottom: 10 }} aria-hidden="true" />
              <div style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#64748b' }}>Koi meeting nahi mili</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meetings.map(m => (
                <div key={m.id} className="card" style={{ ...cardBg, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: darkMode ? '#f1f5f9' : '#0f172a' }}>{m.topic}</div>
                      <div style={{ fontSize: 11.5, color: darkMode ? '#94a3b8' : '#64748b', marginTop: 2 }}>
                        {isAdmin && `${m.school_name} · `}{m.requester_name} ({m.requester_role})
                      </div>
                    </div>
                    <MeetingStatusBadge status={m.status} />
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: darkMode ? '#cbd5e1' : '#475569', flexWrap: 'wrap', marginBottom: m.description ? 8 : 0 }}>
                    <span><i className="ti ti-calendar" style={{ fontSize: 13, marginRight: 4 }} aria-hidden="true" />{m.meeting_date} {m.meeting_time}</span>
                    <span><i className="ti ti-video" style={{ fontSize: 13, marginRight: 4 }} aria-hidden="true" />{MODE_LABEL[m.preferred_mode] || m.preferred_mode}</span>
                    {m.reschedule_date && <span style={{ color: '#2563eb' }}><i className="ti ti-clock-edit" style={{ fontSize: 13, marginRight: 4 }} aria-hidden="true" />Proposed: {m.reschedule_date} {m.reschedule_time}</span>}
                  </div>

                  {m.description && <p style={{ fontSize: 12.5, color: darkMode ? '#94a3b8' : '#64748b', marginBottom: 8 }}>{m.description}</p>}

                  {m.meeting_link && (
                    <a href={m.meeting_link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#4f46e5', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <i className="ti ti-link" style={{ fontSize: 13 }} aria-hidden="true" /> Join Meeting Link
                    </a>
                  )}

                  {m.response_note && (
                    <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#64748b', fontStyle: 'italic', marginBottom: 8 }}>
                      Note: {m.response_note}
                    </div>
                  )}

                  {/* Admin actions */}
                  {isAdmin && m.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button disabled={actionId === m.id} className="btn btn-primary btn-sm" onClick={() => {
                        const link = window.prompt('Meeting link (optional):', '');
                        doAction(m.id, 'accept', { meeting_link: link || '' });
                      }}>Accept</button>
                      <button disabled={actionId === m.id} className="btn btn-neutral btn-sm" onClick={() => {
                        const d = window.prompt('New date (YYYY-MM-DD):'); if (!d) return;
                        const t = window.prompt('New time (e.g. 11:00 AM):'); if (!t) return;
                        doAction(m.id, 'reschedule', { reschedule_date: d, reschedule_time: t });
                      }}>Reschedule</button>
                      <button disabled={actionId === m.id} className="btn btn-neutral btn-sm" style={{ color: '#dc2626' }} onClick={() => doAction(m.id, 'reject', { response_note: window.prompt('Reason:') || '' })}>Reject</button>
                    </div>
                  )}
                  {isAdmin && ['ACCEPTED', 'RESCHEDULED'].includes(m.status) && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button disabled={actionId === m.id} className="btn btn-primary btn-sm" onClick={() => doAction(m.id, 'complete', { response_note: window.prompt('Meeting summary:') || '' })}>Mark Completed</button>
                    </div>
                  )}
                  {!isAdmin && m.status === 'PENDING' && (
                    <button disabled={actionId === m.id} className="btn btn-neutral btn-sm" style={{ marginTop: 8, color: '#dc2626' }} onClick={() => doAction(m.id, 'cancel')}>Cancel Request</button>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      <style>{`
        .theme-dark { background: #0b1220; }
        .theme-dark .main-content { background: #0b1220; }
        .theme-dark .card { background: #141b2d !important; border-color: #1e293b !important; }
        .theme-dark .page-title { color: #f1f5f9 !important; }
        .theme-dark .page-subtitle { color: #94a3b8 !important; }
        .theme-dark .btn-neutral { background: #1e293b !important; color: #cbd5e1 !important; border-color: #334155 !important; }
      `}</style>
    </div>
  );
}
