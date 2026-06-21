import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  {
    id: 'school', label: 'School ERP',
    desc: 'K-12 management — attendance, results, fees, timetable',
    ready: true,
    tags: ['Attendance', 'Results', 'Fees', 'Timetable'],
    initial: 'SC',
  },
  {
    id: 'college', label: 'College ERP',
    desc: 'Higher education — courses, semesters, departments',
    ready: false,
    tags: ['Courses', 'Semesters', 'Departments'],
    initial: 'CL',
  },
  {
    id: 'hospital', label: 'Hospital ERP',
    desc: 'Patient management, OPD, billing, pharmacy',
    ready: false,
    tags: ['OPD', 'Billing', 'Pharmacy'],
    initial: 'HS',
  },
  {
    id: 'industry', label: 'Industry ERP',
    desc: 'HR, inventory, production, finance modules',
    ready: false,
    tags: ['HR', 'Inventory', 'Finance'],
    initial: 'IN',
  },
];

const FEATURES = [
  'Role-based access control',
  'Automated admit cards & result generation',
  'Real-time fee management',
  'Attendance tracking & analytics',
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .erp-landing {
    display: flex;
    min-height: 100vh;
    font-family: 'Plus Jakarta Sans', sans-serif;
    overflow: hidden;
  }

  /* ── LEFT PANEL ── */
  .left-panel {
    width: 46%;
    background: linear-gradient(160deg, #032d60 0%, #0b5cab 55%, #0176d3 100%);
    display: flex;
    flex-direction: column;
    padding: 48px 56px;
    position: relative;
    overflow: hidden;
    color: #fff;
  }

  .left-orb-1 {
    position: absolute;
    width: 480px; height: 480px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    top: -160px; right: -140px;
    pointer-events: none;
  }

  .left-orb-2 {
    position: absolute;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    bottom: -120px; left: -100px;
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
    margin-bottom: 56px;
  }

  .logo-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-box {
    width: 44px; height: 44px;
    border-radius: 11px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.28);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 19px; color: #fff;
  }

  .logo-name {
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.3px;
  }

  .hero-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 440px;
  }

  .eyebrow {
    font-size: 11.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.65);
    margin-bottom: 18px;
    font-weight: 700;
  }

  .hero-title {
    font-size: 2.4rem;
    font-weight: 800;
    line-height: 1.18;
    letter-spacing: -1px;
    margin-bottom: 18px;
  }

  .hero-title .accent {
    color: #aed6ff;
  }

  .hero-sub {
    font-size: 14.5px;
    color: rgba(255,255,255,0.78);
    line-height: 1.7;
    margin-bottom: 38px;
  }

  .features-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .feature-row {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    font-size: 13.5px;
    color: rgba(255,255,255,0.88);
  }

  .feature-tick {
    width: 21px; height: 21px;
    border-radius: 50%;
    flex-shrink: 0;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    margin-top: 1px;
  }

  .left-footer {
    position: relative;
    z-index: 2;
    font-size: 11.5px;
    color: rgba(255,255,255,0.5);
    margin-top: 32px;
  }

  /* ── RIGHT PANEL ── */
  .right-panel {
    flex: 1;
    background: #f6f8fa;
    display: flex;
    flex-direction: column;
    padding: 48px 56px;
    position: relative;
    overflow-y: auto;
  }

  .right-header {
    margin-bottom: 28px;
    max-width: 640px;
  }

  .right-header h2 {
    font-size: 1.6rem;
    font-weight: 800;
    color: #0d1117;
    letter-spacing: -0.5px;
    margin: 0 0 6px 0;
  }

  .right-header p {
    font-size: 13.5px;
    color: #656d76;
    margin: 0;
  }

  .module-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 24px;
    max-width: 720px;
  }

  .mod-card {
    background: #fff;
    border: 1.5px solid #e1e4e8;
    border-radius: 14px;
    padding: 20px 18px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    text-align: left;
    outline: none;
    font-family: inherit;
  }

  .mod-card:hover:not(.disabled) {
    border-color: #0176d3;
    box-shadow: 0 6px 22px rgba(1,118,211,0.14);
    transform: translateY(-2px);
  }

  .mod-card.active-mod {
    border-color: #0176d3;
    background: #f0f6ff;
    box-shadow: 0 0 0 1px rgba(1,118,211,0.18);
  }

  .mod-card.disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .status-pill {
    position: absolute;
    top: 14px; right: 14px;
    font-size: 9.5px;
    padding: 3px 9px;
    border-radius: 20px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    font-weight: 700;
  }

  .status-pill.live {
    background: #dafbe1;
    border: 1px solid #82cf99;
    color: #1a7f37;
  }

  .status-pill.soon {
    background: #f1f3f5;
    border: 1px solid #d0d7de;
    color: #6e7681;
  }

  .mod-icon-wrap {
    width: 42px; height: 42px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    font-weight: 800;
    margin-bottom: 14px;
    background: #032d60;
    color: #fff;
  }

  .mod-card.disabled .mod-icon-wrap {
    background: #97a1ab;
  }

  .mod-name {
    font-size: 14px;
    font-weight: 700;
    color: #0d1117;
    margin-bottom: 5px;
  }

  .mod-desc {
    font-size: 12px;
    color: #656d76;
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .mod-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .tag-pill {
    font-size: 9.5px;
    padding: 3px 8px;
    border-radius: 6px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  .tag-blue { background: #dbeafe; color: #0b5cab; }
  .tag-gray { background: #f1f3f5; color: #6e7681; }

  .launch-btn {
    max-width: 720px;
    padding: 14px;
    background: #0176d3;
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 14.5px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .launch-btn:hover { background: #014486; }

  @media (max-width: 900px) {
    .erp-landing { flex-direction: column; }
    .left-panel { width: 100%; padding: 32px 24px 26px; }
    .hero-section { max-width: 100%; }
    .features-list { display: none; }
    .left-footer { display: none; }
    .right-panel { width: 100%; padding: 28px 22px 36px; }
    .module-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
    .hero-title { font-size: 1.7rem; }
    .launch-btn, .module-grid { max-width: 100%; }
  }

  @media (max-width: 520px) {
    .module-grid { grid-template-columns: 1fr; }
    .mod-card { padding: 16px; }
  }
`;

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="erp-landing">

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <div className="left-orb-1" />
          <div className="left-orb-2" />

          <div className="left-content">
            <div className="nav-top">
              <div className="logo-wrap">
                <div className="logo-box">E</div>
                <span className="logo-name">EduERP</span>
              </div>
            </div>

            <div className="hero-section">
              <div className="eyebrow">Enterprise Platform</div>

              <h1 className="hero-title">
                Unified ERP for<br />
                <span className="accent">Education, Health</span><br />
                &amp; Industry
              </h1>

              <p className="hero-sub">
                One platform for schools, colleges, hospitals and industries —
                role-based access, real-time data, and automated reports
                built for the next generation of institutions.
              </p>

              <div className="features-list">
                {FEATURES.map((f, i) => (
                  <div className="feature-row" key={i}>
                    <span className="feature-tick">&#10003;</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="left-footer">Trusted by institutions to run their daily operations.</div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="right-header">
            <h2>Select Your Module</h2>
            <p>Choose a platform to get started with your institution</p>
          </div>

          <div className="module-grid">
            {MODULES.map(mod => (
              <button
                key={mod.id}
                className={`mod-card ${mod.ready ? 'active-mod' : 'disabled'}`}
                onClick={() => mod.ready && navigate('/login')}
                disabled={!mod.ready}
              >
                <span className={`status-pill ${mod.ready ? 'live' : 'soon'}`}>
                  {mod.ready ? 'Live' : 'Coming Soon'}
                </span>
                <div className="mod-icon-wrap">{mod.initial}</div>
                <div className="mod-name">{mod.label}</div>
                <div className="mod-desc">{mod.desc}</div>
                <div className="mod-tags">
                  {mod.tags.map(t => (
                    <span key={t} className={`tag-pill ${mod.ready ? 'tag-blue' : 'tag-gray'}`}>{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <button className="launch-btn" onClick={() => navigate('/login')}>
            Launch School ERP &rarr;
          </button>
        </div>

      </div>
    </>
  );
}
