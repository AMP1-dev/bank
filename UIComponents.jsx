import React from 'react';

// ── Cores do sistema ──────────────────────────────────────────
export const C = {
  navy:    '#0F2D48',
  navyMid: '#1A4A6B',
  teal:    '#0B8A6F',
  tealLt:  '#D1F0EA',
  amber:   '#D97706',
  amberLt: '#FEF3C7',
  red:     '#DC2626',
  redLt:   '#FEE2E2',
  green:   '#15803D',
  greenLt: '#DCFCE7',
  purple:  '#7C3AED',
  purpleLt:'#EDE9FE',
  blue:    '#1D4ED8',
  blueLt:  '#DBEFFE',
  bg:      '#F0F4F8',
  card:    '#FFFFFF',
  border:  '#E2E8F0',
  text:    '#1A2B3C',
  muted:   '#64748B',
  light:   '#94A3B8',
};

// ── Input style ───────────────────────────────────────────────
export const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: `1px solid ${C.border}`, background: '#fff',
  fontSize: 14, color: C.text, outline: 'none',
  marginTop: 4,
};

export const selectStyle = { ...inputStyle, cursor: 'pointer' };

// ── Components ────────────────────────────────────────────────

export function Card({ children, style }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', ...style }}>
      {children}
    </div>
  );
}

export function FieldLabel({ children }) {
  return <div style={{ fontSize: 11.5, fontWeight: 600, color: C.muted, marginBottom: 2, marginTop: 14 }}>{children}</div>;
}

export function StatusBadge({ status }) {
  const map = {
    a_vencer:   { label: 'A vencer',      color: C.blue,   bg: C.blueLt },
    alerta:     { label: 'Vence em breve', color: C.amber,  bg: C.amberLt },
    vencido:    { label: 'Vencido',        color: C.red,    bg: C.redLt },
    compensado: { label: 'Compensado',     color: C.green,  bg: C.greenLt },
    devolvido:  { label: 'Devolvido',      color: C.purple, bg: C.purpleLt },
  };
  const s = map[status] || map.a_vencer;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

export function Btn({ children, onClick, variant = 'primary', disabled, style, size = 'md' }) {
  const base = {
    borderRadius: 10, border: 'none', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontSize: size === 'sm' ? 12.5 : 14, padding: size === 'sm' ? '7px 12px' : '11px 18px',
    opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
  };
  const variants = {
    primary:  { background: C.navy,  color: '#fff' },
    teal:     { background: C.teal,  color: '#fff' },
    outline:  { background: '#fff',  color: C.navy,  border: `1px solid ${C.border}` },
    danger:   { background: C.red,   color: '#fff' },
    ghost:    { background: 'transparent', color: C.muted },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTopColor: C.navy, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({ icon = '📋', text }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, color: C.muted }}>{text}</div>
    </div>
  );
}

export function Modal({ titulo, onClose, children, maxWidth = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,45,72,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, padding: '0' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth, maxHeight: '92vh', overflowY: 'auto', padding: '20px 16px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>{titulo}</div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: C.muted, fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  const map = {
    info:    { bg: C.blueLt,   color: C.blue,  border: '#BFDBFE' },
    warning: { bg: C.amberLt,  color: C.amber, border: '#FDE68A' },
    danger:  { bg: C.redLt,    color: C.red,   border: '#FCA5A5' },
    success: { bg: C.greenLt,  color: C.green, border: '#86EFAC' },
  };
  const s = map[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: s.color, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}
