import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title }) {
  const { user } = useAuth();
  return (
    <header style={{
      height: 'var(--navbar-h)', background: '#fff',
      borderBottom: '1px solid var(--neutral-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--neutral-9)' }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          background: 'var(--blue-10)', color: 'var(--blue-80)',
          padding: '3px 10px', borderRadius: 100,
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          {user?.role?.replace('_', ' ')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--neutral-6)' }}>{user?.name}</div>
      </div>
    </header>
  );
}
