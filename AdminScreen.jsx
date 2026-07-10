import React, { useState } from 'react';
import { LogOut, Building2, User, Shield, Users, Copy } from 'lucide-react';
import { supabase } from './supabase.js';
import { C, Card, Btn, FieldLabel, inputStyle, Alert } from './UIComponents.jsx';

export function AdminScreen({ sessao, empresa, onLogout }) {
  const isAdmin = sessao?.tipo === 'admin' || sessao?.tipo === 'admin_sistema';
  const [abaAtiva, setAbaAtiva] = useState(isAdmin ? 'empresa' : 'conta');
  const [nomeEmpresa, setNomeEmpresa] = useState(empresa?.nome || '');
  const [cnpj, setCnpj] = useState(empresa?.cnpj || '');
  const [salvando, setSalvando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [msg, setMsg] = useState('');
  
  // Estados para a aba Global (admin_sistema)
  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteForm, setClienteForm] = useState({});

  // Estados para a aba Equipe
  const [equipe, setEquipe] = useState([]);
  const [carregandoEquipe, setCarregandoEquipe] = useState(false);

  async function salvarEmpresa() {
    if (!empresa?.id) {
      setMsg('❌ Você não tem uma empresa vinculada ao seu perfil.');
      return;
    }
    setSalvando(true); setMsg('');
    const { error } = await supabase.from('empresas')
      .update({ nome: nomeEmpresa, cnpj: cnpj || null })
      .eq('id', empresa.id);
    setMsg(error ? '❌ Erro ao salvar.' : '✅ Dados atualizados!');
    setSalvando(false);
  }

  async function handleImportarPlanilha(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportando(true); setMsg('Lendo arquivo Excel...');
    try {
      const xlsx = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      let headerRowIdx = -1;
      let headers = [];
      for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
        if (rawRows[i] && rawRows[i].some(c => c && String(c).includes('Data Entrada'))) {
          headerRowIdx = i;
          headers = rawRows[i];
          break;
        }
      }
      
      if (headerRowIdx === -1) throw new Error('Não encontrei a coluna "Data Entrada" nas primeiras 20 linhas.');
      
      const chequesToInsert = [];
      for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;
        
        const getCol = (possibles) => {
          for (const p of possibles) {
            const idx = headers.findIndex(h => h && String(h).trim().toLowerCase() === p.toLowerCase());
            if (idx !== -1) return row[idx];
          }
          for (const p of possibles) {
            const idx = headers.findIndex(h => h && String(h).toLowerCase().includes(p.toLowerCase()));
            if (idx !== -1) return row[idx];
          }
          return null;
        };

        const dtEntrada = getCol(['Data Entrada']);
        if (!dtEntrada) continue;

        const codBanco = String(getCol(['Banco2', 'Cod']) || '').trim();

        const parseDate = (val) => {
          if (!val) return null;
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            return date.toISOString().split('T')[0];
          }
          const str = String(val);
          if (str.includes('/')) {
            const parts = str.split(' ')[0].split('/');
            if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return null;
        };

        const obs = String(getCol(['Observa', 'Observação']) || '').toUpperCase();
        let status = 'a_vencer';
        if (obs === 'COMPENSADO' || getCol(['Compensa'])) status = 'compensado';
        else if (obs === 'ZEBRA' || obs.includes('DEVOLVIDO')) status = 'devolvido';

        chequesToInsert.push({
          empresa_id: empresa.id,
          data_entrada: parseDate(dtEntrada),
          cliente: String(getCol(['Cliente']) || ''),
          codigo_banco: codBanco ? parseInt(codBanco, 10) || null : null,
          nome_banco: String(getCol(['Banco Emissor', 'Banco']) || ''),
          agencia: String(getCol(['Ag', 'Agência']) || ''),
          conta: String(getCol(['Conta']) || ''),
          numero_cheque: String(getCol(['Cheque', 'Nº Cheque']) || ''),
          emitente: String(getCol(['Emitente']) || ''),
          cpf_cnpj: String(getCol(['CNPJ', 'CPF']) || ''),
          valor: Number(getCol(['Valor'])) || 0,
          vencimento: parseDate(getCol(['Vencimento'])),
          compensacao: parseDate(getCol(['Compensa'])),
          status: status
        });
      }

      if (chequesToInsert.length === 0) throw new Error('Nenhum cheque válido encontrado na planilha.');

      setMsg(`Enviando ${chequesToInsert.length} cheques para o banco de dados...`);
      let inseridos = 0;
      for (let i = 0; i < chequesToInsert.length; i += 100) {
        const lote = chequesToInsert.slice(i, i + 100);
        const { error } = await supabase.from('cheques').insert(lote);
        if (error) throw new Error('Erro ao inserir lote: ' + error.message);
        inseridos += lote.length;
      }
      setMsg(`✅ Importação concluída! ${inseridos} cheques importados com sucesso.`);
    } catch (err) {
      setMsg('❌ Erro na importação: ' + err.message);
    }
    setImportando(false);
    e.target.value = '';
  }

  async function alterarSenha() {
    const { error } = await supabase.auth.resetPasswordForEmail(sessao.email);
    setMsg(error ? '❌ Erro ao enviar e-mail.' : '✅ Link de redefinição enviado para ' + sessao.email);
  }

  async function carregarClientesGlobais() {
    setCarregandoClientes(true);
    const { data: empresasDB, error } = await supabase.from('empresas').select('*').order('created_at', { ascending: false });
    if (!error && empresasDB) setClientes(empresasDB);
    setCarregandoClientes(false);
  }

  async function salvarClienteGlobal() {
    setSalvando(true);
    const { error } = await supabase.from('empresas')
      .update({
        ativo: clienteForm.ativo,
        plano_valor: clienteForm.plano_valor,
        plano_vencimento: clienteForm.plano_vencimento || null
      })
      .eq('id', clienteEditando.id);
    
    if (!error) {
      await carregarClientesGlobais();
      setClienteEditando(null);
    } else {
      alert('Erro ao salvar cliente: ' + error.message);
    }
    setSalvando(false);
  }

  React.useEffect(() => {
    if (abaAtiva === 'clientes' && sessao?.tipo === 'admin_sistema') {
      carregarClientesGlobais();
    }
    if (abaAtiva === 'equipe' && empresa?.id) {
      carregarEquipe();
    }
  }, [abaAtiva, sessao, empresa]);

  async function carregarEquipe() {
    setCarregandoEquipe(true);
    const { data } = await supabase.from('profiles').select('*').eq('empresa_id', empresa.id).order('created_at', { ascending: true });
    if (data) setEquipe(data);
    setCarregandoEquipe(false);
  }

  function copiarLinkConvite() {
    const link = `${window.location.origin}/?invite=${empresa.id}`;
    navigator.clipboard.writeText(link);
    setMsg('✅ Link de convite copiado para a área de transferência!');
    setTimeout(() => setMsg(''), 3000);
  }

  const abas = [];
  if (isAdmin) {
    abas.push({ id: 'empresa', label: 'Empresa',  Icon: Building2 });
    abas.push({ id: 'equipe',  label: 'Equipe',   Icon: Users });
  }
  abas.push({ id: 'conta',   label: 'Conta',    Icon: User });

  if (sessao?.tipo === 'admin_sistema') {
    abas.push({ id: 'clientes', label: 'Clientes Globais', Icon: Shield });
  }

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>Configurações</div>
        <div style={{ fontSize: 13, color: C.muted }}>Gerencie sua empresa e conta</div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 20 }}>
        {abas.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => { setAbaAtiva(id); setMsg(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', background: abaAtiva === id ? '#fff' : 'transparent', color: abaAtiva === id ? C.navy : C.muted, fontWeight: abaAtiva === id ? 700 : 400, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: abaAtiva === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: msg.startsWith('✅') ? C.greenLt : C.redLt, borderRadius: 10, fontSize: 13, color: msg.startsWith('✅') ? C.green : C.red }}>
          {msg}
        </div>
      )}

      {abaAtiva === 'empresa' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, background: C.navy, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{empresa?.nome || 'Minha Empresa'}</div>
              <div style={{ fontSize: 12, color: C.muted }}>ID: {empresa?.id?.slice(0, 8)}...</div>
            </div>
          </div>

          <FieldLabel>Nome da empresa</FieldLabel>
          <input value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} style={inputStyle} placeholder="Nome da empresa" />

          <FieldLabel>CNPJ</FieldLabel>
          <input value={cnpj} onChange={e => setCnpj(e.target.value)} style={inputStyle} placeholder="00.000.000/0001-00" />

          <Btn onClick={salvarEmpresa} disabled={salvando} style={{ width: '100%', marginTop: 16 }}>
            {salvando ? 'Salvando...' : 'Salvar dados da empresa'}
          </Btn>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Importar Dados</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
              Selecione uma planilha do Excel (.xlsx) contendo seus cheques antigos para importá-los automaticamente.
            </div>
            <label style={{ display: 'block' }}>
              <div style={{ padding: '12px 16px', background: C.tealLt, color: C.teal, fontWeight: 700, borderRadius: 12, textAlign: 'center', cursor: importando ? 'not-allowed' : 'pointer' }}>
                {importando ? 'Processando arquivo...' : 'Selecionar Arquivo .xlsx'}
              </div>
              <input type="file" accept=".xlsx, .xls" onChange={handleImportarPlanilha} disabled={importando} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {abaAtiva === 'equipe' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Convide novos membros</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
              Envie o link de convite para que novos funcionários se cadastrem automaticamente na sua empresa como operadores.
            </div>
            <Btn onClick={copiarLinkConvite} style={{ width: '100%', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Copy size={16} /> Copiar Link de Convite
            </Btn>
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginTop: 8, marginBottom: 4 }}>Membros Atuais</div>
          {carregandoEquipe ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.muted }}>Carregando equipe...</div>
          ) : (
            equipe.map(membro => (
              <div key={membro.id} style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: membro.tipo === 'admin' ? C.navy : C.tealLt, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} color={membro.tipo === 'admin' ? '#fff' : C.teal} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{membro.nome || 'Sem nome'}</div>
                  <div style={{ fontSize: 12, color: C.muted, textTransform: 'capitalize' }}>{membro.tipo}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {abaAtiva === 'conta' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, background: C.tealLt, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color={C.teal} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{sessao?.nome || 'Usuário'}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{sessao?.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', borderRadius: 8, padding: '8px 12px' }}>
              <Shield size={14} color={C.teal} />
              <span style={{ fontSize: 12.5, color: C.muted, textTransform: 'capitalize' }}>{sessao?.tipo || 'operador'}</span>
            </div>

            <Btn variant="outline" onClick={alterarSenha} style={{ width: '100%', marginTop: 12 }}>
              Redefinir senha por e-mail
            </Btn>
          </div>

          <Btn variant="danger" onClick={onLogout} style={{ width: '100%' }}>
            <LogOut size={16} /> Sair da conta
          </Btn>
        </div>
      )}

      {abaAtiva === 'clientes' && sessao?.tipo === 'admin_sistema' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {clienteEditando ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{clienteEditando.nome}</div>
                <button onClick={() => setClienteEditando(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 24, lineHeight: 1 }}>&times;</button>
              </div>

              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="ativo" checked={clienteForm.ativo} onChange={e => setClienteForm({...clienteForm, ativo: e.target.checked})} />
                <label htmlFor="ativo" style={{ fontSize: 14, color: clienteForm.ativo ? C.green : C.red, fontWeight: 600 }}>
                  {clienteForm.ativo ? 'Empresa Ativa (Acesso Liberado)' : 'Empresa Bloqueada (Inadimplente)'}
                </label>
              </div>

              <FieldLabel>Valor da Assinatura (R$)</FieldLabel>
              <input type="number" step="0.01" value={clienteForm.plano_valor} onChange={e => setClienteForm({...clienteForm, plano_valor: e.target.value})} style={inputStyle} placeholder="149.90" />

              <FieldLabel>Vencimento do Plano</FieldLabel>
              <input type="date" value={clienteForm.plano_vencimento || ''} onChange={e => setClienteForm({...clienteForm, plano_vencimento: e.target.value})} style={inputStyle} />

              <Btn onClick={salvarClienteGlobal} disabled={salvando} style={{ width: '100%', marginTop: 20 }}>
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </Btn>
            </div>
          ) : carregandoClientes ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.muted }}>Carregando empresas...</div>
          ) : clientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.muted }}>Nenhuma empresa cadastrada.</div>
          ) : (
            clientes.map(cli => (
              <div key={cli.id} 
                   onClick={() => { setClienteEditando(cli); setClienteForm({ ativo: cli.ativo ?? true, plano_valor: cli.plano_valor || '', plano_vencimento: cli.plano_vencimento || '' }); }}
                   style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', border: cli.ativo === false ? '1px solid #fee2e2' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, background: cli.ativo === false ? C.red : C.navy, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={20} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: cli.ativo === false ? C.red : C.navy }}>
                      {cli.nome} {cli.ativo === false && '(Bloqueado)'}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>CNPJ: {cli.cnpj || 'Não informado'}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: C.muted, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cadastrado: {new Date(cli.created_at).toLocaleDateString('pt-BR')}</span>
                  <span>Assinatura: R$ {Number(cli.plano_valor || 0).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
