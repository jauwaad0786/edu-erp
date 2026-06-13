import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const BREADCRUMB_MAP = {
  '/dashboard':  'Dashboard',
  '/students':   'Students',
  '/admission':  'New Admission',
  '/teachers':   'Teachers',
  '/classes':    'Classes',
  '/subjects':   'Subjects',
  '/attendance': 'Attendance',
  '/exams':      'Exams',
  '/fees':       'Fees',
  '/documents':  'Documents',
  '/notes':      'Notes',
  '/timetable':  'Timetable',
  '/holidays':   'Holidays',
  '/marks':      'Marks Entry',
  '/results':    'Results',
  '/schools':    'Schools',
  '/users':      'Users',
  '/id-cards/students':  'Student ID Cards',   // ← ADD
  '/id-cards/employees': 'Employee ID Cards',  // ← ADD
};

export default function Navbar({ title }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotif,    setShowNotif]    = useState(false);
  const [pendingReqs,  setPendingReqs]  = useState([]);

  const pageLabel = title || BREADCRUMB_MAP[location.pathname] || 'EduERP';

  // Fetch pending teacher attendance requests count (only for PRINCIPAL)
  useEffect(() => {
    if (user?.role !== 'PRINCIPAL') return;
    api.get('/principal/teachers/attendance/requests?approval=PENDING')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        setPendingCount(data.length);
        setPendingReqs(data.slice(0, 5));
      })
      .catch(() => {});
  }, [user]);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Today's date
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <>
      <header style={{
        height: 54,
        background: '#fff',
        borderBottom: '1px solid #e8edf2',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>

        {/* Left: Page title + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>EduERP</span>
          <span style={{ fontSize: 11, color: '#cbd5e1' }}>›</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            {pageLabel}
          </span>
        </div>

        {/* Right: date + notifications + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Date */}
          <span style={{
            fontSize: 11, color: '#94a3b8', fontWeight: 500,
            display: 'none',  // hide on small; show md+
          }}
            className="hide-mobile"
          >{today}</span>

          {/* Session badge */}
          <span style={{
            background: '#eff6ff', color: '#1d4ed8',
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 20, letterSpacing: '0.02em',
          }}>
            2024-25
          </span>

          {/* Notification Bell — only PRINCIPAL */}
          {user?.role === 'PRINCIPAL' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotif(n => !n)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  width: 36, height: 36, borderRadius: 8, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748b', transition: 'background 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                🔔
                {pendingCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: '#dc2626', color: '#fff',
                    fontSize: 9, fontWeight: 800, minWidth: 16, height: 16,
                    borderRadius: 99, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '0 3px',
                    border: '2px solid #fff',
                  }}>{pendingCount > 9 ? '9+' : pendingCount}</span>
                )}
              </button>

              {/* Dropdown */}
              {showNotif && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                    onClick={() => setShowNotif(false)}
                  />
                  <div style={{
                    position: 'absolute', top: 42, right: 0,
                    width: 320, background: '#fff', borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                    border: '1px solid #e2e8f0', zIndex: 99, overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        Notifications
                      </span>
                      {pendingCount > 0 && (
                        <span style={{
                          background: '#fee2e2', color: '#dc2626',
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        }}>{pendingCount} pending</span>
                      )}
                    </div>
                    {pendingReqs.length === 0 ? (
                      <div style={{
                        padding: '24px 16px', textAlign: 'center',
                        fontSize: 13, color: '#94a3b8',
                      }}>Koi pending request nahi</div>
                    ) : (
                      <>
                        {pendingReqs.map((r, i) => (
                          <div key={i} style={{
                            padding: '10px 16px', borderBottom: '1px solid #f8fafc',
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                          }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                              background: '#fef3c7', color: '#d97706',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontWeight: 700, fontSize: 12,
                            }}>
                              {r.teacher_name?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                                {r.teacher_name}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                Attendance request · {r.date}
                              </div>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px',
                              borderRadius: 20, flexShrink: 0,
                              background: r.status === 'PRESENT' ? '#dcfce7' : '#fee2e2',
                              color:      r.status === 'PRESENT' ? '#16a34a' : '#dc2626',
                            }}>{r.status}</span>
                          </div>
                        ))}
                        <div
                          onClick={() => { navigate('/dashboard'); setShowNotif(false); }}
                          style={{
                            padding: '10px 16px', textAlign: 'center',
                            fontSize: 12, color: '#0176d3', fontWeight: 600,
                            cursor: 'pointer', borderTop: '1px solid #f1f5f9',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          Sab dekho →
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* User chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 12px 4px 4px', borderRadius: 99,
            border: '1px solid #e2e8f0', background: '#f8fafc',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg,#0176d3,#5867e8)',
              color: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, fontWeight: 700,
            }}>{initials}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
                {user?.name?.split(' ')[0]}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>

        </div>
      </header>
    </>
  );
}
