import React from 'react';

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
  PENDING:     { label: 'Pending',     bg: '#fefce8', color: '#ca8a04', dot: '#eab308' },
  IN_PROGRESS: { label: 'In Progress', bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  WAITING:     { label: 'Waiting',     bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
  RESOLVED:    { label: 'Resolved',    bg: '#f0fdf4', color: '#15803d', dot: '#16a34a' },
  CLOSED:      { label: 'Closed',      bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  REJECTED:    { label: 'Rejected',    bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
};

const PRIORITY_CONFIG = {
  LOW:      { label: 'Low',      bg: '#f1f5f9', color: '#64748b' },
  MEDIUM:   { label: 'Medium',   bg: '#fefce8', color: '#ca8a04' },
  HIGH:     { label: 'High',     bg: '#fff7ed', color: '#ea580c' },
  CRITICAL: { label: 'Critical', bg: '#fef2f2', color: '#dc2626' },
};

const MEETING_STATUS_CONFIG = {
  PENDING:     { label: 'Pending',     bg: '#fefce8', color: '#ca8a04' },
  ACCEPTED:    { label: 'Confirmed',   bg: '#f0fdf4', color: '#16a34a' },
  REJECTED:    { label: 'Rejected',    bg: '#fef2f2', color: '#dc2626' },
  RESCHEDULED: { label: 'Rescheduled', bg: '#eff6ff', color: '#2563eb' },
  COMPLETED:   { label: 'Completed',   bg: '#f1f5f9', color: '#475569' },
};

export function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  const fontSize = size === 'xs' ? 10 : size === 'sm' ? 11 : 13;

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          4,
      background:   cfg.bg,
      color:        cfg.color,
      fontSize:     fontSize,
      fontWeight:   700,
      padding:      size === 'xs' ? '1px 6px' : '3px 10px',
      borderRadius: 20,
      whiteSpace:   'nowrap',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.dot, flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority, size = 'sm' }) {
  const cfg = PRIORITY_CONFIG[priority] || { label: priority, bg: '#f1f5f9', color: '#64748b' };
  const fontSize = size === 'xs' ? 10 : size === 'sm' ? 11 : 13;

  return (
    <span style={{
      display:      'inline-block',
      background:   cfg.bg,
      color:        cfg.color,
      fontSize:     fontSize,
      fontWeight:   700,
      padding:      size === 'xs' ? '1px 6px' : '3px 10px',
      borderRadius: 20,
      whiteSpace:   'nowrap',
    }}>
      {priority === 'CRITICAL' && '🔴 '}{cfg.label}
    </span>
  );
}

export function MeetingStatusBadge({ status, size = 'sm' }) {
  const cfg = MEETING_STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569' };
  const fontSize = size === 'xs' ? 10 : size === 'sm' ? 11 : 13;

  return (
    <span style={{
      display:      'inline-block',
      background:   cfg.bg,
      color:        cfg.color,
      fontSize:     fontSize,
      fontWeight:   700,
      padding:      size === 'xs' ? '1px 6px' : '3px 10px',
      borderRadius: 20,
      whiteSpace:   'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

export default StatusBadge;
