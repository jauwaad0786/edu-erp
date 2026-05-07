import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';

function StatCard({ icon, label, value, sub, color = '#0176d3' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '14' }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function PrincipalDashboard() {
  const [stats, setStats]   = useState(null);
  const [tab, setTab]       = useState('overview');

  useEffect(() => {
    api.get('/principal/dashboard').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const fmt = n => n?.toLocaleString('en-IN') ?? '—';

  const TABS = ['overview', 'students', 'teachers', 'fees', 'exams'];

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Principal Dashboard" />
        <div className="page-body">

          {/* Page Header */}
          <div className="page-header flex justify-between items-center">
            <div>
              <h2 className="page-title">School Dashboard</h2>
              <p className="page-subtitle">Session 2024–25 · Real-time overview</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-neutral btn-sm">📥 Export Report</button>
              <button className="btn btn-primary btn-sm">+ Add Student</button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid-4 mb-6">
            <StatCard icon="🎒" label="Total Students"  value={fmt(stats?.total_students)} sub="Enrolled this session" color="#0176d3" />
            <StatCard icon="👩‍🏫" label="Total Teachers"  value={fmt(stats?.total_teachers)} sub="Active staff"          color="#5867e8" />
            <StatCard icon="🏛" label="Classes"         value={fmt(stats?.total_classes)}  sub="Sections active"       color="#2e844a" />
            <StatCard icon="💰" label="Fee Collected"   value={`₹${fmt(stats?.fee_collected)}`} sub="This session"    color="#dd7a01" />
          </div>

          {/* Fee Summary */}
          <div className="grid-2 mb-6">
            <div className="card">
              <div className="card-header">
                <h4>💰 Fee Collection Overview</h4>
                <span className="badge badge-info">Live</span>
              </div>
              <div className="card-body">
                {stats && (
                  <>
                    <div className="flex justify-between mb-4" style={{ fontSize: 13 }}>
                      <span className="text-muted">Total Collected</span>
                      <span className="font-bold text-success">₹{fmt(stats.fee_collected)}</span>
                    </div>
                    <div className="flex justify-between mb-4" style={{ fontSize: 13 }}>
                      <span className="text-muted">Pending</span>
                      <span className="font-bold text-error">₹{fmt(stats.fee_pending)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill success"
                        style={{
                          width: `${Math.round(stats.fee_collected / (stats.fee_collected + stats.fee_pending + 1) * 100)}%`
                        }}></div>
                    </div>
                    <p style={{ marginTop: 8, fontSize: 11, color: 'var(--neutral-6)' }}>
                      {Math.round(stats.fee_collected / (stats.fee_collected + stats.fee_pending + 1) * 100)}% collected
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h4>⚡ Quick Actions</h4>
              </div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['📋', 'Mark Attendance', '#e8f4fd', '#0176d3'],
                  ['📝', 'Create Exam',     '#eaf5ea', '#2e844a'],
                  ['🎟', 'Admit Cards',     '#fef5e4', '#dd7a01'],
                  ['📊', 'Result Cards',    '#f3f0ff', '#5867e8'],
                  ['💸', 'Collect Fee',     '#fef1ee', '#ba0517'],
                  ['📤', 'Upload Notice',   '#e8f4fd', '#0176d3'],
                ].map(([icon, label, bg, color]) => (
                  <button key={label} style={{
                    background: bg, border: 'none', borderRadius: 8,
                    padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, fontWeight: 600, color,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <span style={{ fontSize: 16 }}>{icon}</span> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity placeholder */}
          <div className="card">
            <div className="card-header">
              <h4>📋 Recent Activity</h4>
              <button className="btn btn-neutral btn-sm">View All</button>
            </div>
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h4 style={{ color: 'var(--neutral-6)', marginBottom: 4 }}>No recent activity</h4>
                <p>Activity will appear here as you manage students, teachers, and fees.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
