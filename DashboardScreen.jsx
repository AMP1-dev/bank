import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { C, Card, StatusBadge } from './UIComponents.jsx';
import { calcularStatus } from './constants.js';
import { formatBRL, formatDate, diasParaVencer } from './formatters.js';

function MetricCard({ label, valor, quantidade, color, bg, Icon }) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: '14px 16px', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(valor)}</div>
      <div style={{ fontSize: 11.5, color, opacity: 0.7, marginTop: 2 }}>{quantidade} cheque{quantidade !== 1 ? 's' : ''}</div>
    </div>
  );
}

export function DashboardScreen({ cheques, onNavigate }) {
  const stats = useMemo(() => {
    const grupos = { a_vencer: [], alerta: [], vencido: [], compensado: [], devolvido: [] };
    cheques.forEach(c => {
      const s = calcularStatus(c);
      if (grupos[s]) grupos[s].push(c);
    });
    const soma = (arr) => arr.reduce((s, c) => s + Number(c.valor), 0);
    return {
      aVencer:    { qtd: grupos.a_vencer.length,   valor: soma(grupos.a_vencer) },
      alerta:     { qtd: grupos.alerta.length,      valor: soma(grupos.alerta), itens: grupos.alerta },
      vencido:    { qtd: grupos.vencido.length,     valor: soma(grupos.vencido) },
      compensado: { qtd: grupos.compensado.length,  valor: soma(grupos.compensado) },
      devolvido:  { qtd: grupos.devolvido.length,   valor: soma(grupos.devolvido) },
      total:      { qtd: cheques.length,             valor: soma(cheques) },
    };
  }, [cheques]);

  const recentes = useMemo(() =>
    [...cheques].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
  [cheques]);

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>BANK</div>
        <div style={{ fontSize: 13, color: C.muted }}>Visão geral dos cheques</div>
      </div>

      {/* Alerta vencendo */}
      {stats.alerta.qtd > 0 && (
        <div style={{ background: C.amberLt, border: `1px solid #FDE68A`, borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertTriangle size={18} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>
              {stats.alerta.qtd} cheque{stats.alerta.qtd > 1 ? 's' : ''} vence{stats.alerta.qtd > 1 ? 'm' : ''} em breve!
            </div>
            {stats.alerta.itens.slice(0, 3).map(c => (
              <div key={c.id} style={{ fontSize: 12, color: '#92400E', marginTop: 3 }}>
                • {c.emitente} — {formatBRL(c.valor)} — vence {formatDate(c.vencimento)} ({diasParaVencer(c.vencimento)} dias)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <MetricCard label="A vencer" valor={stats.aVencer.valor} quantidade={stats.aVencer.qtd} color={C.blue} bg={C.blueLt} Icon={Clock} />
        <MetricCard label="Vencidos" valor={stats.vencido.valor} quantidade={stats.vencido.qtd} color={C.red} bg={C.redLt} Icon={AlertTriangle} />
        <MetricCard label="Compensados" valor={stats.compensado.valor} quantidade={stats.compensado.qtd} color={C.green} bg={C.greenLt} Icon={CheckCircle} />
        <MetricCard label="Devolvidos" valor={stats.devolvido.valor} quantidade={stats.devolvido.qtd} color={C.purple} bg={C.purpleLt} Icon={XCircle} />
      </div>

      {/* Total geral */}
      <div style={{ background: C.navy, borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase' }}>Total em carteira</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 4 }}>{formatBRL(stats.total.valor)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Total de cheques</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 2 }}>{stats.total.qtd}</div>
        </div>
      </div>

      {/* Recentes */}
      {recentes.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Últimos lançamentos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentes.map(c => {
              const st = calcularStatus(c);
              return (
                <button key={c.id} onClick={() => onNavigate('cheques')}
                  style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: `1px solid ${C.border}`, textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.emitente}</div>
                      <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                        {c.nome_banco || `Banco ${c.codigo_banco || '—'}`} · Cheque {c.numero_cheque}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{formatBRL(c.valor)}</div>
                      <div style={{ marginTop: 4 }}><StatusBadge status={st} /></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {cheques.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏦</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 6 }}>Nenhum cheque cadastrado</div>
          <div style={{ fontSize: 13, color: C.muted }}>Toque no botão + para lançar o primeiro cheque.</div>
        </div>
      )}
    </div>
  );
}
