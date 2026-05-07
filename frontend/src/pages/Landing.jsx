import React from 'react';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  {
    id: 'school', icon: '🏫', label: 'School ERP',
    desc: 'K-12 management — attendance, results, fees, timetable',
    ready: true, color: '#0176d3',
  },
  {
    id: 'college', icon: '🎓', label: 'College ERP',
    desc: 'Higher education — courses, semesters, departments',
    ready: false, color: '#5867e8',
  },
  {
    id: 'hospital', icon: '🏥', label: 'Hospital ERP',
    desc: 'Patient management, OPD, billing, pharmacy',
    ready: false, color: '#2e844a',
  },
  {
    id: 'industry', icon: '🏭', label: 'Industry ERP',
    desc: 'HR, inventory, production, finance modules',
    ready: false, color: '#dd7a01',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #032d60 0%, #0176d3 60%, #1589ee 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 56, color: '#fff' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28, fontWeight: 900,
            border: '1px solid rgba(255,255,255,0.3)',
          }}>E</div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            EduERP
          </h1>
        </div>
        <p style={{
          fontSize: '1.125rem', color: 'rgba(255,255,255,0.8)',
          maxWidth: 520, margin: '0 auto', lineHeight: 1.6,
        }}>
          Enterprise Resource Planning for Education, Healthcare & Industry.
          Select your module to get started.
        </p>
      </div>

      {/* Module Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16, maxWidth: 680, width: '100%',
      }}>
        {MODULES.map(mod => (
          <button key={mod.id}
            onClick={() => mod.ready && navigate('/login')}
            style={{
              background: mod.ready ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.15)',
              border: mod.ready ? 'none' : '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)',
              borderRadius: 16, padding: '24px 22px',
              textAlign: 'left', cursor: mod.ready ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (mod.ready) e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            {!mod.ready && (
              <span style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                fontSize: 9, fontWeight: 700, padding: '2px 8px',
                borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>Coming Soon</span>
            )}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: mod.ready ? `${mod.color}14` : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, marginBottom: 14,
            }}>{mod.icon}</div>
            <h3 style={{
              fontWeight: 800, fontSize: 15, marginBottom: 6,
              color: mod.ready ? '#032d60' : 'rgba(255,255,255,0.9)',
            }}>{mod.label}</h3>
            <p style={{
              fontSize: 12, lineHeight: 1.5,
              color: mod.ready ? '#747474' : 'rgba(255,255,255,0.6)',
            }}>{mod.desc}</p>
          </button>
        ))}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 40, textAlign: 'center' }}>
        EduERP v1.0 • School Module Active • Powered by Flask + React
      </p>
    </div>
  );
}
