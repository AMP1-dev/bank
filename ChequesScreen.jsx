import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronRight, Check, RotateCcw, Trash2 } from 'lucide-react';
import { C, StatusBadge, EmptyState, Modal, Btn, FieldLabel, selectStyle, Alert } from '../components/UIComponents.jsx';
import { calcularStatus } from '../utils/constants.js';
import { formatBRL, formatDate, formatCPFCNPJ } from '../utils/formatters.js';

export function ChequesScreen({ cheques, onEditar, onAlterarStatus, onExcluir }) {
  const [busca, setBusca]             = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroOrdem, setFiltroOrdem] = useState('data_desc');
  const [showFiltros, setShowFiltros] = useState(false);
  const [chequeDetalhe, setChequeDetalhe] = useState(null);
  const [confirmExcluir, setConfirmExcluir] = useState(null);

  const lista = useMemo(() => {
    let arr = cheques.map(c => ({ ...c, _status: calcularStatus(c) }));

    // Busca
    if (busca.trim()) {
      const q = busca.toLowerCase();
      arr = arr.filter(c =>
        c.emitente?.toLowerCase().includes(q) ||
        c.cliente?.toLowerCase().includes(q) ||
        c.numero_cheque?.includes(q) ||
        c.cpf_cnpj?.replace(/\D/g,'').includes(q.replace(/\D/g,'')) ||
        c.nome_banco?.toLowerCase().includes(q) ||
        c.destino?.toLowerCase().includes(q)
      );
    }

    // Filtro status
    if (filtroStatus !== 'todos') arr = arr.filter(c => c._status === filtroStatus);

    // Ordem
    arr.sort((a, b) => {
      if (filtroOrdem === 'data_desc')   return new Date(b.data_entrada) - new Date(a.data_entrada);
      if (filtroOrdem === 'data_asc')    return new Date(a.data_entrada) - new Date(b.data_entrada);
      if (filtroOrdem === 'valor_desc')  return Number(b.valor) - Number(a.valor);
      if (filtroOrdem === 'valor_asc')   return Number(a.valor) - Number(b.valor);
      if (filtroOrdem === 'venc_asc')    return new Date(a.vencimento||'9999') - new Date(b.vencimento||'9999');
      return 0;
    });
    return arr;
  }, [cheques, busca, filtroStatus, filtroOrdem]);

  const totalFiltrado = lista.reduce((s, c) => s + Number(c.valor), 0);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header fixo */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} color={C.light} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar emitente, cheque, CPF..."
              style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, outline: 'none' }}
            />
          </div>
          <button onClick={() => setShowFiltros(true)} style={{ background: showFiltros || filtroStatus !== 'todos' ? C.navy : '#F1F5F9', border: 'none', borderRadius: 10, padding: '0 12px', cursor: 'pointer', color: filtroStatus !== 'todos' ? '#fff' : C.muted }}>
            <Filter size={16} />
          </button>
        </div>
        {lista.length > 0 && (
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 8 }}>
            {lista.length} cheque{lista.length !== 1 ? 's' : ''} · Total: <strong style={{ color: C.navy }}>{formatBRL(totalFiltrado)}</strong>
          </div>
        )}
      </div>

      {/* Lista */}
      <div style={{ padding: '12px 16px 0' }}>
        {lista.length === 0 && (
          <EmptyState icon="🔍" text={busca ? `Nenhum resultado para "${busca}"` : 'Nenhum cheque encontrado.'} />
        )}

        {lista.map(c => (
          <button key={c.id} onClick={() => setChequeDetalhe(c)}
            style={{ width: '100%', background: '#fff', borderRadius: 14, padding: '14px', border: `1px solid ${C.border}`, marginBottom: 8, textAlign: 'left', cursor: 'pointer', display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.emitente}</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                  {c.nome_banco || `Banco ${c.codigo_banco || '—'}`} · Ag {c.agencia || '—'} · Cc {c.conta || '—'} · Nº {c.numero_cheque}
                </div>
              </div>
              <ChevronRight size={14} color={C.light} style={{ flexShrink: 0, marginLeft: 6, marginTop: 2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge status={c._status} />
                {c.vencimento && <span style={{ fontSize: 11, color: C.muted }}>Venc. {formatDate(c.vencimento)}</span>}
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{formatBRL(c.valor)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Modal filtros */}
      {showFiltros && (
        <Modal titulo="Filtros" onClose={() => setShowFiltros(false)}>
          <FieldLabel>Status</FieldLabel>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={selectStyle}>
            <option value="todos">Todos</option>
            <option value="a_vencer">A vencer</option>
            <option value="alerta">Vencendo em breve</option>
            <option value="vencido">Vencidos</option>
            <option value="compensado">Compensados</option>
            <option value="devolvido">Devolvidos</option>
          </select>
          <FieldLabel>Ordenar por</FieldLabel>
          <select value={filtroOrdem} onChange={e => setFiltroOrdem(e.target.value)} style={selectStyle}>
            <option value="data_desc">Data entrada (recente primeiro)</option>
            <option value="data_asc">Data entrada (antiga primeiro)</option>
            <option value="valor_desc">Maior valor</option>
            <option value="valor_asc">Menor valor</option>
            <option value="venc_asc">Vencimento próximo</option>
          </select>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <Btn variant="outline" onClick={() => { setFiltroStatus('todos'); setFiltroOrdem('data_desc'); }} style={{ flex: 1 }}>Limpar</Btn>
            <Btn onClick={() => setShowFiltros(false)} style={{ flex: 1 }}>Aplicar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal detalhe */}
      {chequeDetalhe && (
        <Modal titulo="Detalhe do Cheque" onClose={() => setChequeDetalhe(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <StatusBadge status={calcularStatus(chequeDetalhe)} />
            <span style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{formatBRL(chequeDetalhe.valor)}</span>
          </div>

          {[
            ['Emitente', chequeDetalhe.emitente],
            ['CPF/CNPJ', formatCPFCNPJ(chequeDetalhe.cpf_cnpj)],
            ['Telefone', chequeDetalhe.telefone],
            ['Observação', chequeDetalhe.email_obs],
            ['Banco', chequeDetalhe.nome_banco || `Banco ${chequeDetalhe.codigo_banco}`],
            ['Agência', chequeDetalhe.agencia],
            ['Conta', chequeDetalhe.conta],
            ['Nº Cheque', chequeDetalhe.numero_cheque],
            ['Cliente', chequeDetalhe.cliente],
            ['Destino', chequeDetalhe.destino],
            ['Data entrada', formatDate(chequeDetalhe.data_entrada)],
            ['Vencimento', formatDate(chequeDetalhe.vencimento)],
            ['Compensação', formatDate(chequeDetalhe.compensacao)],
          ].filter(([, v]) => v && v !== '—').map(([label, valor]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12.5, color: C.muted }}>{label}</span>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text, maxWidth: '60%', textAlign: 'right' }}>{valor}</span>
            </div>
          ))}

          {/* Ações rápidas de status */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>AÇÕES RÁPIDAS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {chequeDetalhe.status !== 'compensado' && (
                <Btn size="sm" variant="teal" onClick={() => { onAlterarStatus(chequeDetalhe.id, 'compensado'); setChequeDetalhe(null); }}>
                  <Check size={13} /> Compensado
                </Btn>
              )}
              {chequeDetalhe.status !== 'devolvido' && (
                <Btn size="sm" variant="outline" style={{ color: C.purple, borderColor: C.purple }} onClick={() => { onAlterarStatus(chequeDetalhe.id, 'devolvido'); setChequeDetalhe(null); }}>
                  Devolvido
                </Btn>
              )}
              {(chequeDetalhe.status === 'compensado' || chequeDetalhe.status === 'devolvido') && (
                <Btn size="sm" variant="outline" onClick={() => { onAlterarStatus(chequeDetalhe.id, 'a_vencer'); setChequeDetalhe(null); }}>
                  <RotateCcw size={13} /> Reabrir
                </Btn>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Btn variant="outline" onClick={() => { onEditar(chequeDetalhe); setChequeDetalhe(null); }} style={{ flex: 1 }}>Editar</Btn>
            <Btn variant="danger" size="sm" onClick={() => { setConfirmExcluir(chequeDetalhe.id); setChequeDetalhe(null); }} style={{ flexShrink: 0 }}>
              <Trash2 size={14} />
            </Btn>
          </div>
        </Modal>
      )}

      {/* Modal confirmação exclusão */}
      {confirmExcluir && (
        <Modal titulo="Excluir cheque?" onClose={() => setConfirmExcluir(null)}>
          <Alert type="danger">Esta ação registrará a exclusão no histórico de auditoria. O cheque será removido permanentemente.</Alert>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Btn variant="outline" onClick={() => setConfirmExcluir(null)} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn variant="danger" onClick={() => { onExcluir(confirmExcluir); setConfirmExcluir(null); }} style={{ flex: 1 }}>Excluir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
