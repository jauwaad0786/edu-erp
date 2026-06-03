import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  {
    id: 'school', icon: '🏫', label: 'School ERP',
    desc: 'K-12 management — attendance, results, fees, timetable',
    ready: true,
    tags: ['Attendance', 'Results', 'Fees', 'Timetable'],
    accent: '#1a73e8',
  },
  {
    id: 'college', icon: '🎓', label: 'College ERP',
    desc: 'Higher education — courses, semesters, departments',
    ready: false,
    tags: ['Courses', 'Semesters', 'Departments'],
    accent: '#5867e8',
  },
  {
    id: 'hospital', icon: '🏥', label: 'Hospital ERP',
    desc: 'Patient management, OPD, billing, pharmacy',
    ready: false,
    tags: ['OPD', 'Billing', 'Pharmacy'],
    accent: '#2e844a',
  },
  {
    id: 'industry', icon: '🏭', label: 'Industry ERP',
    desc: 'HR, inventory, production, finance modules',
    ready: false,
    tags: ['HR', 'Inventory', 'Finance'],
    accent: '#dd7a01',
  },
];

const FEATURES = [
  { icon: '🔐', text: 'Role-based access control' },
  { icon: '📋', text: 'Auto-generate Admit & Result cards' },
  { icon: '💰', text: 'Real-time Fee management' },
  { icon: '📊', text: 'Attendance tracking & reports' },
  { icon: '🏆', text: 'Multi-tenant architecture' },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .erp-landing {
    display: flex;
    min-height: 100vh;
    font-family: 'Plus Jakarta Sans', sans-serif;
    overflow: hidden;
  }

  /* ── LEFT PANEL ── */
  .left-panel {
    width: 52%;
    background: #0a1628;
    display: flex;
    flex-direction: column;
    padding: 36px 48px 32px;
    position: relative;
    overflow: hidden;
  }

  .left-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(56,139,253,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56,139,253,0.05) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  .left-orb-1 {
    position: absolute;
    width: 480px; height: 480px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(26,115,232,0.18) 0%, transparent 70%);
    top: -120px; left: -100px;
    pointer-events: none;
  }

  .left-orb-2 {
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
    bottom: 40px; right: -60px;
    pointer-events: none;
  }

  .left-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .nav-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 48px;
  }

  .logo-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-box {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #1a73e8, #4da3ff);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 18px; color: #fff;
    box-shadow: 0 0 24px rgba(26,115,232,0.45);
  }

  .logo-name {
    font-size: 20px;
    font-weight: 800;
    color: #e6edf3;
    letter-spacing: -0.5px;
  }

  .version-chip {
    font-size: 11px;
    padding: 4px 12px;
    background: rgba(26,115,232,0.12);
    border: 1px solid rgba(26,115,232,0.28);
    border-radius: 20px;
    color: #79c0ff;
    letter-spacing: 0.3px;
  }

  .hero-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #79c0ff;
    margin-bottom: 18px;
    font-weight: 600;
  }

  .live-dot {
    width: 7px; height: 7px;
    background: #3fb950;
    border-radius: 50%;
    box-shadow: 0 0 8px #3fb950;
    animation: blink 2s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  .hero-title {
    font-size: 36px;
    font-weight: 800;
    color: #e6edf3;
    line-height: 1.12;
    letter-spacing: -1.2px;
    margin-bottom: 16px;
  }

  .hero-title .accent {
    background: linear-gradient(120deg, #4da3ff, #79c0ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    font-size: 14px;
    color: #8b949e;
    line-height: 1.65;
    max-width: 400px;
    margin-bottom: 36px;
    font-weight: 400;
  }

  .features-list {
    display: flex;
    flex-direction: column;
    gap: 11px;
    margin-bottom: 40px;
  }

  .feature-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #c9d1d9;
    font-weight: 500;
  }

  .feature-icon-wrap {
    width: 28px; height: 28px;
    border-radius: 7px;
    background: rgba(26,115,232,0.1);
    border: 1px solid rgba(26,115,232,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
  }

  .stats-strip {
    display: flex;
    gap: 28px;
    padding-top: 24px;
    border-top: 1px solid rgba(56,139,253,0.12);
  }

  .stat-item .num {
    font-size: 20px;
    font-weight: 800;
    color: #e6edf3;
  }

  .stat-item .lbl {
    font-size: 10px;
    color: #6e7681;
    letter-spacing: 0.5px;
    margin-top: 2px;
    text-transform: uppercase;
  }

  /* ── RIGHT PANEL ── */
  .right-panel {
    width: 48%;
    background: #f6f8fa;
    display: flex;
    flex-direction: column;
    padding: 36px 44px 32px;
    position: relative;
    overflow-y: auto;
  }

  .right-header {
    margin-bottom: 28px;
  }

  .right-header h2 {
    font-size: 22px;
    font-weight: 800;
    color: #0d1117;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .right-header p {
    font-size: 13px;
    color: #656d76;
  }

  .module-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .mod-card {
    background: #fff;
    border: 1.5px solid #e1e4e8;
    border-radius: 12px;
    padding: 18px 16px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    text-align: left;
    outline: none;
  }

  .mod-card:hover:not(.disabled) {
    border-color: #1a73e8;
    box-shadow: 0 4px 20px rgba(26,115,232,0.12);
    transform: translateY(-2px);
  }

  .mod-card.active-mod {
    border-color: #1a73e8;
    background: #f0f6ff;
    box-shadow: 0 0 0 1px rgba(26,115,232,0.25), 0 4px 16px rgba(26,115,232,0.1);
  }

  .mod-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cs-pill {
    position: absolute;
    top: 10px; right: 10px;
    font-size: 9px;
    padding: 3px 8px;
    background: #f1f3f5;
    border: 1px solid #d0d7de;
    border-radius: 20px;
    color: #6e7681;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-weight: 700;
  }

  .live-pill {
    position: absolute;
    top: 10px; right: 10px;
    font-size: 9px;
    padding: 3px 8px;
    background: #dafbe1;
    border: 1px solid #82cf99;
    border-radius: 20px;
    color: #1a7f37;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-weight: 700;
  }

  .mod-icon-wrap {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    margin-bottom: 12px;
  }

  .mod-name {
    font-size: 13px;
    font-weight: 700;
    color: #0d1117;
    margin-bottom: 4px;
  }

  .mod-desc {
    font-size: 11px;
    color: #656d76;
    line-height: 1.5;
    margin-bottom: 10px;
  }

  .mod-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag-pill {
    font-size: 9px;
    padding: 2px 7px;
    border-radius: 5px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  .tag-blue { background: #dbeafe; color: #1d4ed8; }
  .tag-gray { background: #f1f3f5; color: #6e7681; }

  .launch-btn {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, #1a73e8, #4da3ff);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    letter-spacing: 0.2px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 16px rgba(26,115,232,0.3);
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .launch-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(26,115,232,0.4);
  }

  .launch-btn:active {
    transform: scale(0.99);
  }

  .bottom-note {
    text-align: center;
    font-size: 11px;
    color: #afb8c1;
    margin-top: 16px;
    letter-spacing: 0.2px;
  }

  .stack-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #6e7681;
    background: #fff;
    border: 1px solid #e1e4e8;
    border-radius: 8px;
    padding: 5px 10px;
    margin-top: 6px;
  }

  .stack-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #3fb950;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .fade-in { animation: fadeInUp 0.5s ease both; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.3s; }
  .delay-4 { animation-delay: 0.4s; }
  .delay-5 { animation-delay: 0.5s; }

  @media (max-width: 900px) {
    .erp-landing { flex-direction: column; }
    .left-panel, .right-panel { width: 100%; padding: 28px 24px; }
    .module-grid { grid-template-columns: 1fr 1fr; }
    .hero-title { font-size: 26px; }
  }
`;

export default function Landing() {
  const navigate = useNavigate();
  const [hoveredMod, setHoveredMod] = useState(null);

  return (
    <>
      <style>{styles}</style>
      <div className="erp-landing">

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <div className="left-grid" />
          <div className="left-orb-1" />
          <div className="left-orb-2" />

          <div className="left-content">
            {/* Nav */}
            <div className="nav-top fade-in">
              <div className="logo-wrap">
                <div className="logo-box">E</div>
                <span className="logo-name">EduERP</span>
              </div>
              <span className="version-chip">v1.0 — School Active</span>
            </div>

            {/* Hero */}
            <div className="hero-section">
              <div className="eyebrow fade-in delay-1">
                <span className="live-dot" />
                Enterprise Platform
              </div>

              <h1 className="hero-title fade-in delay-1">
                Unified ERP for<br />
                <span className="accent">Education, Health</span><br />
                & Industry
              </h1>

              <p className="hero-sub fade-in delay-2">
                One platform for schools, colleges, hospitals and industries. Role-based access, real-time data, and automated reports — built for the next generation of institutions.
              </p>

              <div className="features-list fade-in delay-3">
                {FEATURES.map((f, i) => (
                  <div className="feature-row" key={i}>
                    <div className="feature-icon-wrap">{f.icon}</div>
                    {f.text}
                  </div>
                ))}
              </div>

              <div className="stats-strip fade-in delay-4">
                <div className="stat-item">
                  <div className="num">4</div>
                  <div className="lbl">Modules</div>
                </div>
                <div className="stat-item">
                  <div className="num">Multi-tenant</div>
                  <div className="lbl">Architecture</div>
                </div>
                <div className="stat-item">
                  <div className="num">JWT</div>
                  <div className="lbl">Auth System</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="right-header fade-in">
            <h2>Select Your Module</h2>
            <p>Choose a platform to get started with your institution</p>
          </div>

          <div className="module-grid">
            {MODULES.map((mod, i) => (
              <button
                key={mod.id}
                className={`mod-card fade-in delay-${i + 1} ${mod.ready ? 'active-mod' : 'disabled'}`}
                onClick={() => mod.ready && navigate('/login')}
                onMouseEnter={() => setHoveredMod(mod.id)}
                onMouseLeave={() => setHoveredMod(null)}
                disabled={!mod.ready}
              >
                {mod.ready
                  ? <span className="live-pill">● Live</span>
                  : <span className="cs-pill">Soon</span>
                }
                <div
                  className="mod-icon-wrap"
                  style={{ background: `${mod.accent}14` }}
                >
                  {mod.icon}
                </div>
                <div className="mod-name">{mod.label}</div>
                <div className="mod-desc">{mod.desc}</div>
                <div className="mod-tags">
                  {mod.tags.map(t => (
                    <span
                      key={t}
                      className={`tag-pill ${mod.ready ? 'tag-blue' : 'tag-gray'}`}
                    >{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <button
            className="launch-btn fade-in delay-5"
            onClick={() => navigate('/login')}
          >
            Launch School ERP →
          </button>

          <div className="bottom-note fade-in delay-5">
            <div className="stack-badge">
              <span className="stack-dot" />
              Flask + React &nbsp;·&nbsp; Multi-tenant SaaS &nbsp;·&nbsp; JWT Auth
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
