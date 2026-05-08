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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-9)', lineHeight: 1.3 }}>
        {user?.name}
      </div>
      <div style={{ fontSize: 10, color: 'var(--neutral-5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {user?.role?.replace('_', ' ')}
      </div>
    </div>
</div>
    </header>
  );
}
