import React, { useState, useEffect } from 'react';
import { supabase } from './supabase.js';
import { C, Spinner, EmptyState } from './UIComponents.jsx';
import { formatDate } from './formatters.js';

const ACAO_MAP = {
  criado:          { label: 'Lançado',          color: C.green,  bg: C.greenLt,  icon: '➕' },
  editado:         { label: 'Editado',           color: C.blue,   bg: C.blueLt,   icon: '✏️' },
  status_alterado: { label: 'Status alterado',   color: C.amber,  bg: C.amberLt,  icon: '🔄' },
  excluido:        { label: 'Excluído',          color: C.red,    bg: C.redLt,    icon: '🗑️' },
};

export function HistoricoScreen({ empresaId }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [pagina, setPagina]       = useState(0);
  const POR_PAGINA = 20;

  useEffect(() => {
    if (!empresaId) return;
    setLoading(true);
    supabase
      .from('historico_cheques')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .range(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA - 1)
      .then(({ data }) => { setHistorico(data || []); setLoading(false); });
  }, [empresaId, pagina]);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>Histórico</div>
        <div style={{ fontSize: 13, color: C.muted }}>Auditoria completa de todas as alterações</div>
      </div>

      {historico.length === 0 && <EmptyState icon="📋" text="Nenhuma movimentação registrada ainda." />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {historico.map(h => {
          const acao = ACAO_MAP[h.acao] || { label: h.acao, color: C.muted, bg: '#F1F5F9', icon: '•' };
          return (
            <div key={h.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: acao.color, background: acao.bg, padding: '3px 8px', borderRadius: 6 }}>
                  {acao.icon} {acao.label}
                </span>
                <span style={{ fontSize: 11, color: C.light }}>
                  {new Date(h.created_at).toLocaleString('pt-BR')}
                </span>
              </div>

              {h.descricao && (
                <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>{h.descricao}</div>
              )}

              {h.dados_anteriores && h.dados_novos && (
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                  {Object.keys(h.dados_novos).map(campo => {
                    const ant = h.dados_anteriores[campo];
                    const nov = h.dados_novos[campo];
                    if (ant === nov) return null;
                    return (
                      <div key={campo} style={{ fontSize: 11.5, color: C.muted, marginBottom: 2 }}>
                        <strong style={{ color: C.text }}>{campo}:</strong>{' '}
                        <span style={{ textDecoration: 'line-through', color: C.red }}>{String(ant ?? '—')}</span>
                        {' → '}
                        <span style={{ color: C.green, fontWeight: 600 }}>{String(nov ?? '—')}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: 11, color: C.light }}>
                👤 {h.usuario_nome || 'Sistema'}
              </div>
            </div>
          );
        })}
      </div>

      {historico.length === POR_PAGINA && (
        <button onClick={() => setPagina(p => p + 1)}
          style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, color: C.navy, cursor: 'pointer', fontWeight: 600 }}>
          Carregar mais
        </button>
      )}
    </div>
  );
}
