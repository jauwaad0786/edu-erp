import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// ── Forgot Password Modal ──────────────────────────────────────────────────
function ForgotPasswordModal({ mode, onClose }) {
  const [step,     setStep]     = useState(1); // 1=enter contact, 2=enter otp, 3=new password
  const [contact,  setContact]  = useState('');
  const [otp,      setOtp]      = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [devOtp,   setDevOtp]   = useState(''); // for testing only

  const isStudent = mode === 'student';

  const sendOtp = async () => {
    if (!contact) return setError(isStudent ? 'Mobile number daalo' : 'Email daalo');
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/forgot-password', {
        [isStudent ? 'phone' : 'email']: contact,
        mode,
      });
      setDevOtp(res.data.otp_hint || ''); // dev only
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Account nahi mila');
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp) return setError('OTP daalo');
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-otp', {
        [isStudent ? 'phone' : 'email']: contact,
        otp,
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'OTP galat hai');
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!newPass || newPass.length < 6) return setError('Password kam se kam 6 characters ka hona chahiye');
    if (newPass !== confirm) return setError('Passwords match nahi kar rahe');
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', {
        [isStudent ? 'phone' : 'email']: contact,
        otp, new_password: newPass,
      });
      alert('✅ Password reset ho gaya! Ab login karein.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '32px 28px',
        width: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {step === 1 ? '🔑 Forgot Password' : step === 2 ? '📱 Enter OTP' : '🔒 New Password'}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 18,
            cursor: 'pointer', color: '#94a3b8',
          }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
          {step === 1
            ? isStudent
              ? 'Apna registered mobile number daalo'
              : 'Apna registered email daalo'
            : step === 2
            ? `OTP bheja gaya ${isStudent ? 'mobile' : 'email'} pe`
            : 'Naya password set karein'}
        </p>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '8px 12px',
            fontSize: 12, color: '#dc2626', marginBottom: 14,
          }}>⚠️ {error}</div>
        )}

        {step === 1 && (
          <>
            <input
              className="form-input"
              type={isStudent ? 'tel' : 'email'}
              placeholder={isStudent ? '10-digit mobile number' : 'you@school.edu'}
              value={contact}
              onChange={e => setContact(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <button onClick={sendOtp} disabled={loading} style={{
              width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              background: 'var(--blue-60)', color: '#fff',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {loading ? 'Sending...' : `Send OTP`}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {devOtp && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 8, padding: '8px 12px',
                fontSize: 12, color: '#166534', marginBottom: 12,
              }}>
                🧪 Dev OTP: <strong>{devOtp}</strong>
              </div>
            )}
            <input
              className="form-input"
              placeholder="6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              style={{ marginBottom: 16, letterSpacing: 4, textAlign: 'center', fontSize: 18 }}
              maxLength={6}
            />
            <button onClick={verifyOtp} disabled={loading} style={{
              width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              background: 'var(--blue-60)', color: '#fff',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button onClick={() => setStep(1)} style={{
              width: '100%', marginTop: 8, padding: '8px',
              background: 'none', border: 'none', color: 'var(--blue-60)',
              cursor: 'pointer', fontSize: 12,
            }}>← Wapas jao</button>
          </>
        )}

        {step === 3 && (
          <>
            <input
              className="form-input"
              type="password"
              placeholder="Naya Password (min 6 characters)"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <input
              className="form-input"
              type="password"
              placeholder="Password confirm karein"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <button onClick={resetPassword} disabled={loading} style={{
              width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              background: '#2e844a', color: '#fff',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {loading ? 'Saving...' : '✅ Reset Password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Login Page ────────────────────────────────────────────────────────
export default function Login() {
  const [mode,      setMode]      = useState(null); // null | 'staff' | 'student'
  const [showForgot, setShowForgot] = useState(false);

  // Staff fields
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // Student fields
  const [stuName,   setStuName]   = useState('');
  const [fatherName,setFatherName]= useState('');
  const [phone,     setPhone]     = useState('');
  const [stuPass,   setStuPass]   = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const { login, studentLogin } = useAuth();
  const navigate = useNavigate();

  const handleStaffLogin = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
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
      setError(err.response?.data?.error || 'Login failed. Check your details.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--neutral-1)' }}>

      {/* ── Left Panel ── */}
      <div style={{
        width: '42%',
        background: 'linear-gradient(160deg, #032d60 0%, #0176d3 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 48, color: '#fff',
      }}>
        <div style={{ maxWidth: 340 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, marginBottom: 28,
          }}>E</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 16, lineHeight: 1.2 }}>
            Welcome to<br />EduERP
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7, marginBottom: 40 }}>
            Enterprise School Management System — students, teachers, fees, results, sab ek jagah.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Role-based access control',
              'Auto-generate Admit & Result cards',
              'Real-time Fee management',
              'Attendance tracking & reports',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, flexShrink: 0,
                }}>✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 40,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* ── STEP 1: Role Select ── */}
          {!mode && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800,
                color: 'var(--neutral-9)', marginBottom: 4 }}>Sign In</h2>
              <p style={{ color: 'var(--neutral-6)', fontSize: 13, marginBottom: 28 }}>
                Pehle batao — aap kaun hain?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => { setMode('staff'); setError(''); }}
                  style={{
                    padding: '18px 20px', borderRadius: 12,
                    border: '2px solid var(--blue-20)',
                    background: 'var(--blue-10)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--blue-60)';
                    e.currentTarget.style.background = 'var(--blue-10)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--blue-20)';
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'var(--blue-60)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  }}>👤</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--neutral-9)' }}>
                      Staff / Admin
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--neutral-6)', marginTop: 2 }}>
                      Super Admin, Principal, Teacher, Parent
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--blue-60)', fontSize: 18 }}>→</span>
                </button>

                <button onClick={() => { setMode('student'); setError(''); }}
                  style={{
                    padding: '18px 20px', borderRadius: 12,
                    border: '2px solid #d1fae5',
                    background: '#f0fdf4', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2e844a'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#d1fae5'}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: '#2e844a',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 20, flexShrink: 0,
                  }}>🎒</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--neutral-9)' }}>
                      Student
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--neutral-6)', marginTop: 2 }}>
                      Apne naam, papa ka naam aur mobile se login karein
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: '#2e844a', fontSize: 18 }}>→</span>
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2A: Staff Login ── */}
          {mode === 'staff' && (
            <>
              <button onClick={() => { setMode(null); setError(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--blue-60)', fontSize: 13, fontWeight: 600,
                  padding: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 6,
                }}>← Wapas jao</button>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800,
                color: 'var(--neutral-9)', marginBottom: 4 }}>
                👤 Staff / Admin Login
              </h2>
              <p style={{ color: 'var(--neutral-6)', fontSize: 13, marginBottom: 24 }}>
                Email aur password se login karein
              </p>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>
              )}

              <form onSubmit={handleStaffLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="you@school.edu"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
                  <button type="button" onClick={() => setShowForgot(true)}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--blue-60)', fontSize: 12,
                      cursor: 'pointer', fontWeight: 600,
                    }}>
                    Forgot Password?
                  </button>
                </div>
                <button type="submit" className="btn btn-primary w-full btn-lg"
                  disabled={loading} style={{ justifyContent: 'center' }}>
                  {loading
                    ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in...</>
                    : 'Sign In'}
                </button>
              </form>

              {/* Demo credentials */}
              <div style={{
                marginTop: 24, padding: '12px 16px',
                background: 'var(--blue-10)', borderRadius: 8,
                border: '1px solid var(--blue-20)',
              }}>
                <p style={{ color: 'var(--blue-80)', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  Demo Credentials
                </p>
                <div style={{ fontSize: 11, color: 'var(--blue-80)' }}>
                  <span style={{ fontWeight: 700 }}>Super Admin:</span>
                  <span style={{ opacity: 0.8 }}> admin@eduErp.com / Admin@1234</span>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2B: Student Login ── */}
          {mode === 'student' && (
            <>
              <button onClick={() => { setMode(null); setError(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#2e844a', fontSize: 13, fontWeight: 600,
                  padding: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 6,
                }}>← Wapas jao</button>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800,
                color: 'var(--neutral-9)', marginBottom: 4 }}>
                🎒 Student Login
              </h2>
              <p style={{ color: 'var(--neutral-6)', fontSize: 13, marginBottom: 24 }}>
                Apni details se login karein
              </p>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>
              )}

              <form onSubmit={handleStudentLogin}>
                <div className="form-group">
                  <label className="form-label">Student ka Naam *</label>
                  <input className="form-input" placeholder="Apna poora naam likhein"
                    value={stuName} onChange={e => setStuName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Father ka Naam *</label>
                  <input className="form-input" placeholder="Papa ka naam"
                    value={fatherName} onChange={e => setFatherName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input className="form-input" type="tel" placeholder="Parent ka 10-digit mobile"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    required maxLength={10} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" placeholder="••••••••"
                    value={stuPass} onChange={e => setStuPass(e.target.value)} required />
                </div>
                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
                  <button type="button" onClick={() => setShowForgot(true)}
                    style={{
                      background: 'none', border: 'none',
                      color: '#2e844a', fontSize: 12,
                      cursor: 'pointer', fontWeight: 600,
                    }}>
                    Password bhul gaye?
                  </button>
                </div>
                <button type="submit" className="btn btn-lg w-full"
                  disabled={loading}
                  style={{
                    background: '#2e844a', color: '#fff', border: 'none',
                    justifyContent: 'center', cursor: 'pointer', borderRadius: 8,
                  }}>
                  {loading
                    ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Login ho raha hai...</>
                    : '🎒 Student Login'}
                </button>
              </form>
            </>
          )}

          <p style={{ marginTop: 24, fontSize: 11, color: 'var(--neutral-4)', textAlign: 'center' }}>
            © 2024 EduERP. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgot && (
        <ForgotPasswordModal
          mode={mode}
          onClose={() => setShowForgot(false)}
        />
      )}
    </div>
  );
}
