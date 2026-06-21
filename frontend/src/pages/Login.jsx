import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Forgot Password Modal ──────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  return (
    <div className="fp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fp-card">
        <div className="fp-header">
          <h3>Reset Password</h3>
          <button className="fp-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <p className="fp-text">
          For security reasons, password resets are handled by your institution's administrator.
        </p>
        <p className="fp-text">
          Please contact your school or college admin office with your registered details, and
          they will reset your password and share new credentials with you.
        </p>
        <button className="fp-ok" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

// ── Main Login Page ────────────────────────────────────────────────────────
export default function Login() {
  const [mode, setMode] = useState(null); // null | 'staff' | 'student'
  const [showForgot, setShowForgot] = useState(false);

  // Staff fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Student fields
  const [stuName, setStuName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phone, setPhone] = useState('');
  const [stuPass, setStuPass] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, studentLogin } = useAuth();
  const navigate = useNavigate();

  const handleStaffLogin = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleStudentLogin = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await studentLogin(stuName, fatherName, phone, stuPass);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your details.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          background: #f3f4f6;
        }

        /* ── Left brand / hero panel ── */
        .auth-hero {
          width: 44%;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 56px 64px;
          color: #fff;
          background: linear-gradient(135deg, #032d60 0%, #0b5cab 55%, #0176d3 100%);
          overflow: hidden;
        }
        .auth-hero::before {
          content: '';
          position: absolute;
          width: 520px; height: 520px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          top: -160px; right: -160px;
        }
        .auth-hero::after {
          content: '';
          position: absolute;
          width: 360px; height: 360px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          bottom: -120px; left: -100px;
        }
        .auth-hero-inner { position: relative; z-index: 1; max-width: 420px; }
        .auth-logo {
          width: 48px; height: 48px; border-radius: 12px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.28);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 800; margin-bottom: 32px;
        }
        .auth-hero h1 {
          font-size: 2.25rem; font-weight: 800; line-height: 1.2;
          margin: 0 0 16px 0; letter-spacing: -0.5px;
        }
        .auth-hero p.lede {
          color: rgba(255,255,255,0.78); font-size: 15px;
          line-height: 1.7; margin: 0 0 40px 0; max-width: 360px;
        }
        .auth-feature-list { display: flex; flex-direction: column; gap: 16px; }
        .auth-feature {
          display: flex; align-items: flex-start; gap: 12px;
          font-size: 13.5px; color: rgba(255,255,255,0.88);
        }
        .auth-feature .tick {
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; margin-top: 1px;
        }
        .auth-footer-note {
          position: relative; z-index: 1; margin-top: 56px;
          font-size: 11.5px; color: rgba(255,255,255,0.55);
        }

        /* ── Right form panel ── */
        .auth-form-panel {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
        }
        .auth-form-wrap { width: 100%; max-width: 400px; }
        .auth-title { font-size: 1.6rem; font-weight: 800; color: #181818; margin: 0 0 6px 0; }
        .auth-subtitle { color: #6b7280; font-size: 13.5px; margin: 0 0 28px 0; }

        .role-card {
          width: 100%; text-align: left; cursor: pointer;
          display: flex; align-items: center; gap: 14px;
          padding: 18px 20px; border-radius: 12px;
          border: 1.5px solid #e2e8f0; background: #fff;
          transition: border-color .15s, box-shadow .15s;
        }
        .role-card:hover { border-color: #0176d3; box-shadow: 0 4px 14px rgba(1,118,211,0.12); }
        .role-card + .role-card { margin-top: 12px; }
        .role-icon {
          width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
          background: #032d60; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 15px;
        }
        .role-icon.student { background: #2e844a; }
        .role-name { font-weight: 700; font-size: 14px; color: #181818; }
        .role-desc { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .role-arrow { margin-left: auto; color: #0176d3; font-size: 18px; }

        .back-link {
          background: none; border: none; cursor: pointer; padding: 0 0 18px 0;
          color: #0176d3; font-size: 13px; font-weight: 600;
          display: flex; align-items: center; gap: 6px;
        }

        .auth-alert {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          border-radius: 8px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 16px;
        }

        .auth-field { margin-bottom: 16px; }
        .auth-field label {
          display: block; font-size: 12.5px; font-weight: 600;
          color: #374151; margin-bottom: 6px;
        }
        .auth-field input {
          width: 100%; box-sizing: border-box; padding: 12px 14px;
          border-radius: 8px; border: 1.5px solid #d1d5db; font-size: 14px;
          outline: none; transition: border-color .15s, box-shadow .15s;
        }
        .auth-field input:focus {
          border-color: #0176d3; box-shadow: 0 0 0 3px rgba(1,118,211,0.12);
        }

        .auth-row-between {
          display: flex; justify-content: flex-end; margin: -6px 0 16px 0;
        }
        .link-btn {
          background: none; border: none; cursor: pointer;
          font-size: 12.5px; font-weight: 600;
        }

        .auth-submit {
          width: 100%; padding: 13px; border-radius: 8px; border: none;
          font-size: 14.5px; font-weight: 700; color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity .15s;
        }
        .auth-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        .auth-submit.staff { background: #0176d3; }
        .auth-submit.staff:hover:not(:disabled) { background: #014486; }
        .auth-submit.student { background: #2e844a; }
        .auth-submit.student:hover:not(:disabled) { background: #1d5e34; }

        .spin {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-copyright { margin-top: 28px; font-size: 11px; color: #9ca3af; text-align: center; }

        /* ── Forgot Password Modal ── */
        .fp-overlay {
          position: fixed; inset: 0; background: rgba(15,23,42,0.55);
          z-index: 1000; display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .fp-card {
          background: #fff; border-radius: 16px; padding: 28px 26px;
          width: 100%; max-width: 380px; box-shadow: 0 24px 64px rgba(0,0,0,0.25);
        }
        .fp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .fp-header h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; }
        .fp-close { background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; line-height: 1; }
        .fp-text { font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 12px 0; }
        .fp-ok {
          width: 100%; margin-top: 8px; padding: 11px; border-radius: 8px; border: none;
          background: #0176d3; color: #fff; font-weight: 700; font-size: 13.5px; cursor: pointer;
        }

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
          .auth-page { flex-direction: column; }
          .auth-hero {
            width: 100%; padding: 32px 24px 28px; min-height: auto;
          }
          .auth-hero-inner { max-width: 100%; }
          .auth-hero h1 { font-size: 1.5rem; }
          .auth-hero p.lede { font-size: 13px; margin-bottom: 24px; }
          .auth-feature-list { display: none; }
          .auth-footer-note { display: none; }
          .auth-form-panel { padding: 28px 18px 40px; }
          .auth-field input { padding: 13px 14px; font-size: 15px; }
          .auth-submit { padding: 14px; font-size: 15px; }
        }
        @media (max-width: 480px) {
          .auth-hero { padding: 26px 20px 22px; }
          .auth-logo { margin-bottom: 18px; width: 40px; height: 40px; }
          .role-card { padding: 16px; }
        }
      `}</style>

      {/* ── Left hero panel ── */}
      <div className="auth-hero">
        <div className="auth-hero-inner">
          <div className="auth-logo">E</div>
          <h1>Welcome to<br />EduERP</h1>
          <p className="lede">
            A complete enterprise school management platform — academics, fees,
            attendance and communication, unified in one secure workspace.
          </p>
          <div className="auth-feature-list">
            {[
              'Role-based access control',
              'Automated admit cards & result generation',
              'Real-time fee management',
              'Attendance tracking & analytics',
            ].map(f => (
              <div key={f} className="auth-feature">
                <span className="tick">&#10003;</span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="auth-footer-note">Trusted by schools to run their daily operations.</div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap">

          {/* STEP 1: Role select */}
          {!mode && (
            <>
              <h2 className="auth-title">Sign in</h2>
              <p className="auth-subtitle">Choose how you'd like to continue</p>

              <button className="role-card" onClick={() => { setMode('staff'); setError(''); }}>
                <div className="role-icon">A</div>
                <div>
                  <div className="role-name">Staff / Administrator</div>
                  <div className="role-desc">Super Admin, Principal, Teacher, Parent</div>
                </div>
                <span className="role-arrow">&rarr;</span>
              </button>

              <button className="role-card" onClick={() => { setMode('student'); setError(''); }}>
                <div className="role-icon student">S</div>
                <div>
                  <div className="role-name">Student</div>
                  <div className="role-desc">Sign in with your name, father's name and mobile number</div>
                </div>
                <span className="role-arrow" style={{ color: '#2e844a' }}>&rarr;</span>
              </button>
            </>
          )}

          {/* STEP 2A: Staff login */}
          {mode === 'staff' && (
            <>
              <button className="back-link" onClick={() => { setMode(null); setError(''); }}>&larr; Back</button>
              <h2 className="auth-title">Staff / Administrator</h2>
              <p className="auth-subtitle">Sign in with your email and password</p>

              {error && <div className="auth-alert">{error}</div>}

              <form onSubmit={handleStaffLogin}>
                <div className="auth-field">
                  <label>Email or Username</label>
                  <input type="text" placeholder="email@school.edu or username"
                    value={identifier} onChange={e => setIdentifier(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label>Password</label>
                  <input type="password" placeholder="********"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="auth-row-between">
                  <button type="button" className="link-btn" style={{ color: '#0176d3' }}
                    onClick={() => setShowForgot(true)}>
                    Forgot password?
                  </button>
                </div>
                <button type="submit" className="auth-submit staff" disabled={loading}>
                  {loading ? <><span className="spin" /> Signing in...</> : 'Sign In'}
                </button>
              </form>
            </>
          )}

          {/* STEP 2B: Student login */}
          {mode === 'student' && (
            <>
              <button className="back-link" style={{ color: '#2e844a' }}
                onClick={() => { setMode(null); setError(''); }}>&larr; Back</button>
              <h2 className="auth-title">Student Sign In</h2>
              <p className="auth-subtitle">Enter your details to continue</p>

              {error && <div className="auth-alert">{error}</div>}

              <form onSubmit={handleStudentLogin}>
                <div className="auth-field">
                  <label>Student's Full Name *</label>
                  <input placeholder="Enter your full name"
                    value={stuName} onChange={e => setStuName(e.target.value)} required />
                </div>
                <div className="auth-field">
                  <label>Father's Name <span style={{ color: '#9ca3af', fontWeight: 400 }}>(only if asked)</span></label>
                  <input placeholder="Needed only if name matches multiple students"
                    value={fatherName} onChange={e => setFatherName(e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>Mobile Number *</label>
                  <input type="tel" placeholder="10-digit parent mobile number"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    required maxLength={10} />
                </div>
                <div className="auth-field">
                  <label>Password *</label>
                  <input type="password" placeholder="********"
                    value={stuPass} onChange={e => setStuPass(e.target.value)} required />
                </div>
                <div className="auth-row-between">
                  <button type="button" className="link-btn" style={{ color: '#2e844a' }}
                    onClick={() => setShowForgot(true)}>
                    Forgot password?
                  </button>
                </div>
                <button type="submit" className="auth-submit student" disabled={loading}>
                  {loading ? <><span className="spin" /> Signing in...</> : 'Student Sign In'}
                </button>
              </form>
            </>
          )}

          <p className="auth-copyright">&copy; 2026 EduERP. All rights reserved.</p>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}
