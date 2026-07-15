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
    <nav className="nav-container">
      {ITEMS.map(({ id, label, Icon, fab }) => {
        const active = tela === id;
        if (fab) return (
          <button key={id} onClick={() => onNavigate(id)} className="nav-fab">
            <Icon size={22} color="#fff" />
          </button>
        );
        return (
          <button key={id} onClick={() => onNavigate(id)} className="nav-item" style={{ color: active ? C.navy : C.light }}>
            <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
