import React, { useState, useMemo } from 'react';
import { Search, Edit2, Check, Trash2, X, Save, RotateCcw } from 'lucide-react';
import { C, StatusBadge, EmptyState, Modal, Btn, Alert } from './UIComponents.jsx';
import { calcularStatus } from './constants.js';
import { formatBRL, formatDate, formatCPFCNPJ } from './formatters.js';

export function ChequesScreen({ cheques, onEditar, onSalvarInline, onAlterarStatus, onExcluir }) {
  const [buscaGlobal, setBuscaGlobal] = useState('');
  
  // Filtros por coluna
  const [filtros, setFiltros] = useState({
    data_entrada: '', emitente: '', banco: '', numero_cheque: '', valor: '', status: ''
  });

  const [editandoId, setEditandoId] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [confirmExcluir, setConfirmExcluir] = useState(null);

  const lista = useMemo(() => {
    let arr = cheques.map(c => ({ ...c, _status: calcularStatus(c) }));

    // Busca Global
    if (buscaGlobal.trim()) {
      const q = buscaGlobal.toLowerCase();
      const words = q.split(' ').filter(Boolean);
      arr = arr.filter(c => {
        const searchableText = [
          c.emitente, c.cliente, c.numero_cheque, c.cpf_cnpj?.replace(/\D/g,''),
          c.nome_banco, c.codigo_banco, c.destino, c.valor, c._status
        ].join(' ').toLowerCase();
        
        return words.every(w => searchableText.includes(w));
      });
    }

    // Filtros de Coluna
    if (filtros.data_entrada) arr = arr.filter(c => c.data_entrada?.includes(filtros.data_entrada));
    if (filtros.emitente) {
      const q = filtros.emitente.toLowerCase();
      arr = arr.filter(c => c.emitente?.toLowerCase().includes(q) || c.cpf_cnpj?.includes(q) || c.cliente?.toLowerCase().includes(q));
    }
    if (filtros.banco) {
      const q = filtros.banco.toLowerCase();
      arr = arr.filter(c => c.nome_banco?.toLowerCase().includes(q) || String(c.codigo_banco).includes(q));
    }
    if (filtros.numero_cheque) arr = arr.filter(c => c.numero_cheque?.includes(filtros.numero_cheque));
    if (filtros.valor) arr = arr.filter(c => String(c.valor).includes(filtros.valor));
    if (filtros.status) {
       const q = filtros.status.toLowerCase();
       arr = arr.filter(c => c._status.includes(q));
    }

    // Ordem: data entrada desc
    arr.sort((a, b) => new Date(b.data_entrada) - new Date(a.data_entrada));
    
    return arr;
  }, [cheques, buscaGlobal, filtros]);

  const totalFiltrado = lista.reduce((s, c) => s + Number(c.valor), 0);

  function iniciarEdicao(c) {
    setEditandoId(c.id);
    setFormEdit({
      data_entrada: c.data_entrada || '',
      emitente: c.emitente || '',
      codigo_banco: c.codigo_banco || '',
      nome_banco: c.nome_banco || '',
      agencia: c.agencia || '',
      conta: c.conta || '',
      numero_cheque: c.numero_cheque || '',
      valor: c.valor || '',
      vencimento: c.vencimento || '',
      status: c.status || 'a_vencer'
    });
  }

  function salvarEdicao() {
    const payload = { ...formEdit, id: editandoId };
    
    // Tratamento para evitar que string vazia quebre colunas numéricas/datas no banco
    if (payload.codigo_banco === '') payload.codigo_banco = null;
    if (payload.valor === '') payload.valor = 0;
    if (payload.vencimento === '') payload.vencimento = null;
    if (payload.data_entrada === '') payload.data_entrada = null;

    if (onSalvarInline) {
      onSalvarInline(payload);
    } else {
      onEditar(payload); // fallback
    }
    setEditandoId(null);
  }

  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 13, color: C.navy, fontWeight: 700, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
  const tdStyle = { padding: '10px 12px', fontSize: 13, borderBottom: `1px solid ${C.border}`, color: C.text, verticalAlign: 'middle', whiteSpace: 'nowrap' };
  const inputStyle = { width: '100%', padding: '6px 8px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, outline: 'none' };
  const filterInputStyle = { width: '100%', padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, outline: 'none', background: '#fff' };

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      {/* Header Fixo: Busca Global */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '12px 16px', zIndex: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative', maxWidth: 600 }}>
            <Search size={16} color={C.light} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={buscaGlobal} onChange={e => setBuscaGlobal(e.target.value)}
              placeholder="Busca global inteligente (Ex: Itau 1500 João)"
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: `2px solid ${C.tealLt}`, fontSize: 14, outline: 'none', background: '#fff' }}
            />
          </div>
          {lista.length > 0 && (
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>
              Exibindo <strong style={{ color: C.navy }}>{lista.length}</strong> {lista.length !== 1 ? 'cheques' : 'cheque'} · Total: <strong style={{ color: C.navy, fontSize: 15 }}>{formatBRL(totalFiltrado)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Container da Tabela (com rolagem) */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 100px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {lista.length === 0 ? (
             <div style={{ padding: 60 }}><EmptyState icon="🔍" text={buscaGlobal ? `Nenhum resultado para a busca.` : 'Nenhum cheque encontrado.'} /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                <thead style={{ background: '#F1F5F9' }}>
                  <tr>
                    <th style={thStyle}>Data</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Emitente / Cliente</th>
                    <th style={thStyle}>Banco</th>
                    <th style={thStyle}>Ag / Conta</th>
                    <th style={thStyle}>Nº Cheque</th>
                    <th style={thStyle}>Valor</th>
                    <th style={thStyle}>Vencimento</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                  {/* Linha de Filtros por Coluna */}
                  <tr>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}`, background: '#E2E8F0' }}>
                       <input style={filterInputStyle} placeholder="Filtrar..." value={filtros.data_entrada} onChange={e => setFiltros({...filtros, data_entrada: e.target.value})} />
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}`, background: '#E2E8F0' }}>
                       <select style={{...filterInputStyle, padding: '4px'}} value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})}>
                         <option value="">Todos</option>
                         <option value="a_vencer">A vencer</option>
                         <option value="vencido">Vencido</option>
                         <option value="compensado">Compensado</option>
                         <option value="devolvido">Devolvido</option>
                       </select>
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}`, background: '#E2E8F0' }}>
                       <input style={filterInputStyle} placeholder="Filtrar Nome/CPF..." value={filtros.emitente} onChange={e => setFiltros({...filtros, emitente: e.target.value})} />
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}`, background: '#E2E8F0' }}>
                       <input style={filterInputStyle} placeholder="Filtrar Banco..." value={filtros.banco} onChange={e => setFiltros({...filtros, banco: e.target.value})} />
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}`, background: '#E2E8F0' }}></td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}`, background: '#E2E8F0' }}>
                       <input style={filterInputStyle} placeholder="Filtrar Nº..." value={filtros.numero_cheque} onChange={e => setFiltros({...filtros, numero_cheque: e.target.value})} />
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}`, background: '#E2E8F0' }}>
                       <input style={filterInputStyle} placeholder="Filtrar Valor..." value={filtros.valor} onChange={e => setFiltros({...filtros, valor: e.target.value})} />
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}`, background: '#E2E8F0' }}></td>
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}`, background: '#E2E8F0' }}></td>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(c => {
                    const isEditing = editandoId === c.id;
                    return (
                      <tr key={c.id} style={{ transition: 'background 0.2s', background: isEditing ? '#F8FAFC' : 'transparent', ':hover': { background: isEditing ? '#F8FAFC' : '#F1F5F9' } }}>
                        {isEditing ? (
                          <>
                            <td style={tdStyle}><input type="date" style={{...inputStyle, width: 115, padding: '6px 4px'}} value={formEdit.data_entrada} onChange={e => setFormEdit({...formEdit, data_entrada: e.target.value})} /></td>
                            <td style={tdStyle}>
                              <select style={{...inputStyle, padding: '5px'}} value={formEdit.status} onChange={e => setFormEdit({...formEdit, status: e.target.value})}>
                                <option value="a_vencer">A vencer</option>
                                <option value="compensado">Compensado</option>
                                <option value="devolvido">Devolvido</option>
                              </select>
                            </td>
                            <td style={tdStyle}>
                              <input placeholder="Emitente" style={{...inputStyle, minWidth: 150}} value={formEdit.emitente} onChange={e => setFormEdit({...formEdit, emitente: e.target.value})} />
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <input placeholder="Cód" style={{...inputStyle, width: 45}} value={formEdit.codigo_banco} onChange={e => setFormEdit({...formEdit, codigo_banco: e.target.value})} />
                                <input placeholder="Nome" style={{...inputStyle, minWidth: 80}} value={formEdit.nome_banco} onChange={e => setFormEdit({...formEdit, nome_banco: e.target.value})} />
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <input placeholder="Ag" style={{...inputStyle, width: 50}} value={formEdit.agencia} onChange={e => setFormEdit({...formEdit, agencia: e.target.value})} />
                                <input placeholder="Cc" style={{...inputStyle, width: 70}} value={formEdit.conta} onChange={e => setFormEdit({...formEdit, conta: e.target.value})} />
                              </div>
                            </td>
                            <td style={tdStyle}><input placeholder="Nº" style={{...inputStyle, width: 80}} value={formEdit.numero_cheque} onChange={e => setFormEdit({...formEdit, numero_cheque: e.target.value})} /></td>
                            <td style={tdStyle}><input type="number" step="0.01" style={{...inputStyle, width: 90}} value={formEdit.valor} onChange={e => setFormEdit({...formEdit, valor: e.target.value})} /></td>
                            <td style={tdStyle}><input type="date" style={{...inputStyle, width: 115, padding: '6px 4px'}} value={formEdit.vencimento} onChange={e => setFormEdit({...formEdit, vencimento: e.target.value})} /></td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <Btn size="sm" onClick={salvarEdicao} style={{ padding: '6px', minWidth: 0 }} title="Salvar"><Save size={15}/></Btn>
                                <Btn size="sm" variant="outline" onClick={() => setEditandoId(null)} style={{ padding: '6px', minWidth: 0 }} title="Cancelar"><X size={15}/></Btn>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={tdStyle}>{formatDate(c.data_entrada)}</td>
                            <td style={tdStyle}><StatusBadge status={c._status} /></td>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 600, color: C.navy }}>{c.emitente}</div>
                              {c.cpf_cnpj && <div style={{ fontSize: 11, color: C.muted }}>{formatCPFCNPJ(c.cpf_cnpj)}</div>}
                              {c.cliente && <div style={{ fontSize: 11, color: C.teal }}>👤 {c.cliente}</div>}
                            </td>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 500 }}>{c.nome_banco || '—'}</div>
                              {c.codigo_banco && <div style={{ fontSize: 11, color: C.muted }}>Cód: {c.codigo_banco}</div>}
                            </td>
                            <td style={tdStyle}>
                              <div><span style={{color: C.muted, fontSize: 11}}>Ag:</span> {c.agencia || '—'}</div>
                              <div><span style={{color: C.muted, fontSize: 11}}>Cc:</span> {c.conta || '—'}</div>
                            </td>
                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 14 }}>{c.numero_cheque}</td>
                            <td style={{ ...tdStyle, fontWeight: 800, color: C.navy, fontSize: 14 }}>{formatBRL(c.valor)}</td>
                            <td style={tdStyle}>{formatDate(c.vencimento) || '—'}</td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {c.status !== 'compensado' && (
                                   <button onClick={() => onAlterarStatus(c.id, 'compensado')} title="Marcar como Compensado" style={{ background: C.greenLt, border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: C.green, display: 'flex' }}><Check size={14}/></button>
                                )}
                                {c.status === 'compensado' && (
                                   <button onClick={() => onAlterarStatus(c.id, 'a_vencer')} title="Reabrir (Desfazer)" style={{ background: '#F1F5F9', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: C.muted, display: 'flex' }}><RotateCcw size={14}/></button>
                                )}
                                <button onClick={() => iniciarEdicao(c)} title="Editar Linha" style={{ background: '#F1F5F9', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: C.navy, display: 'flex' }}><Edit2 size={14}/></button>
                                <button onClick={() => setConfirmExcluir(c.id)} title="Excluir" style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: C.red, display: 'flex' }}><Trash2 size={14}/></button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
