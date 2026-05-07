import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--neutral-1)',
    }}>
      {/* Left Panel */}
      <div style={{
        width: '45%', background: 'linear-gradient(160deg, #032d60 0%, #0176d3 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 48, color: '#fff',
      }}>
        <div style={{ maxWidth: 360 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, marginBottom: 28,
          }}>E</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 16, lineHeight: 1.2 }}>
            Welcome to<br />EduERP
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7, marginBottom: 40 }}>
            Enterprise School Management System. Manage students, teachers, attendance, results, fees and more — all in one place.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Role-based access control', 'Auto-generate Admit & Result cards', 'Real-time Fee management', 'Attendance tracking & reports'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 40,
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neutral-9)', marginBottom: 4 }}>
            Sign In
          </h2>
          <p style={{ color: 'var(--neutral-6)', fontSize: 13, marginBottom: 28 }}>
            Enter your credentials to access EduERP
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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

            <button type="submit" className="btn btn-primary w-full btn-lg"
              disabled={loading} style={{ marginTop: 8, justifyContent: 'center' }}>
              {loading ? <><span className="spinner" style={{ width:16,height:16,borderWidth:2 }}></span> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: 28, padding: '14px 16px',
            background: 'var(--blue-10)', borderRadius: 8, border: '1px solid var(--blue-20)',
          }}>
            <p style={{ color: 'var(--blue-80)', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Demo Credentials
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Super Admin', 'admin@eduErp.com', 'Admin@1234'],
              ].map(([role, em, pw]) => (
                <div key={role} style={{ fontSize: 11, color: 'var(--blue-80)', display: 'flex', gap: 6 }}>
                  <span style={{ fontWeight: 700 }}>{role}:</span>
                  <span style={{ opacity: 0.8 }}>{em} / {pw}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ marginTop: 20, fontSize: 11, color: 'var(--neutral-4)', textAlign: 'center' }}>
            © 2024 EduERP. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
