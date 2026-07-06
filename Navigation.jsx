import React from 'react';
import { LayoutDashboard, List, Plus, History, Settings } from 'lucide-react';
import { C } from './UIComponents.jsx';

const ITEMS = [
  { id: 'dashboard', label: 'Início',    Icon: LayoutDashboard },
  { id: 'cheques',   label: 'Cheques',   Icon: List },
  { id: 'novo',      label: '',          Icon: Plus, fab: true },
  { id: 'historico', label: 'Histórico', Icon: History },
  { id: 'admin',     label: 'Config',    Icon: Settings },
];

export function BottomNav({ tela, onNavigate }) {
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '6px 0 env(safe-area-inset-bottom)', maxWidth: 480, margin: '0 auto' }}>
      {ITEMS.map(({ id, label, Icon, fab }) => {
        const active = tela === id;
        if (fab) return (
          <button key={id} onClick={() => onNavigate(id)}
            style={{ width: 50, height: 50, borderRadius: 25, background: C.teal, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(11,138,111,0.4)', marginBottom: 8 }}>
            <Icon size={22} color="#fff" />
          </button>
        );
        return (
          <button key={id} onClick={() => onNavigate(id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: active ? C.navy : C.light }}>
            <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
