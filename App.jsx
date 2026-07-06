import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';
import { calcularStatus } from './constants.js';
import { LoginScreen }       from './AuthScreens.jsx';
import { DashboardScreen }   from './DashboardScreen.jsx';
import { ChequesScreen }     from './ChequesScreen.jsx';
import { ChequeFormScreen }  from './ChequeFormScreen.jsx';
import { HistoricoScreen }   from './HistoricoScreen.jsx';
import { AdminScreen }       from './AdminScreen.jsx';
import { BottomNav }         from './Navigation.jsx';
import { Spinner }           from './UIComponents.jsx';

export default function App() {
  const [sessao,  setSessao]  = useState(null);  // { id, email, nome, tipo, empresaId }
  const [empresa, setEmpresa] = useState(null);
  const [cheques, setCheques] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [tela,   setTela]   = useState('dashboard');
  const [chequeEditando, setChequeEditando] = useState(null);

  // ── Auth listener ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) carregarUsuario(session.user.id);
      else setCarregando(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (session) carregarUsuario(session.user.id);
      else { setSessao(null); setEmpresa(null); setCheques([]); setCarregando(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function carregarUsuario(userId) {
    setCarregando(true);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile) { setCarregando(false); return; }

    const { data: emp } = profile.empresa_id
      ? await supabase.from('empresas').select('*').eq('id', profile.empresa_id).single()
      : { data: null };

    const { data: { user } } = await supabase.auth.getUser();

    setSessao({ id: userId, email: user.email, nome: profile.nome, tipo: profile.tipo, empresaId: profile.empresa_id });
    setEmpresa(emp);
    if (profile.empresa_id) await carregarCheques(profile.empresa_id);
    setCarregando(false);
  }

  async function carregarCheques(empresaId) {
    const { data } = await supabase.from('cheques').select('*')
      .eq('empresa_id', empresaId).order('data_entrada', { ascending: false });
    setCheques(data || []);
  }

  // ── Auditoria ─────────────────────────────────────────────
  async function registrarHistorico(chequeId, acao, descricao, dadosAnt = null, dadosNov = null) {
    await supabase.from('historico_cheques').insert({
      cheque_id:        chequeId,
      empresa_id:       sessao.empresaId,
      usuario_id:       sessao.id,
      usuario_nome:     sessao.nome || sessao.email,
      acao,
      descricao,
      dados_anteriores: dadosAnt,
      dados_novos:      dadosNov,
    });
  }

  // ── CRUD cheques ─────────────────────────────────────────
  async function salvarCheque(dados) {
    if (chequeEditando) {
      // Edição
      const anterior = cheques.find(c => c.id === chequeEditando.id);
      const { error } = await supabase.from('cheques').update(dados).eq('id', chequeEditando.id);
      if (!error) {
        await registrarHistorico(chequeEditando.id, 'editado', `Cheque editado por ${sessao.nome || sessao.email}`, anterior, dados);
        await carregarCheques(sessao.empresaId);
      }
    } else {
      // Criação
      const { data, error } = await supabase.from('cheques')
        .insert({ ...dados, empresa_id: sessao.empresaId }).select().single();
      if (!error && data) {
        await registrarHistorico(data.id, 'criado', `Cheque nº ${dados.numero_cheque} lançado — ${dados.emitente}`, null, dados);
        await carregarCheques(sessao.empresaId);
      }
    }
    setChequeEditando(null);
    setTela('cheques');
  }

  async function alterarStatus(chequeId, novoStatus) {
    const cheque = cheques.find(c => c.id === chequeId);
    const update = { status: novoStatus };
    if (novoStatus === 'compensado') update.compensacao = new Date().toISOString().slice(0,10);

    const { error } = await supabase.from('cheques').update(update).eq('id', chequeId);
    if (!error) {
      await registrarHistorico(chequeId, 'status_alterado',
        `Status alterado de "${calcularStatus(cheque)}" para "${novoStatus}"`,
        { status: cheque.status }, { status: novoStatus }
      );
      await carregarCheques(sessao.empresaId);
    }
  }

  async function excluirCheque(chequeId) {
    const cheque = cheques.find(c => c.id === chequeId);
    await registrarHistorico(chequeId, 'excluido',
      `Cheque nº ${cheque?.numero_cheque} (${cheque?.emitente}) excluído`,
      cheque, null
    );
    await supabase.from('cheques').delete().eq('id', chequeId);
    await carregarCheques(sessao.empresaId);
  }

  function handleEditar(cheque) {
    setChequeEditando(cheque);
    setTela('novo');
  }

  function handleNavegar(destino) {
    if (destino !== 'novo') setChequeEditando(null);
    setTela(destino);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // ── Render ────────────────────────────────────────────────
  if (carregando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4F8' }}>
      <Spinner />
    </div>
  );

  if (!sessao) return <LoginScreen />;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#F0F4F8', position: 'relative' }}>

      {tela === 'dashboard' && (
        <DashboardScreen cheques={cheques} onNavigate={handleNavegar} />
      )}

      {tela === 'cheques' && (
        <ChequesScreen
          cheques={cheques}
          onEditar={handleEditar}
          onAlterarStatus={alterarStatus}
          onExcluir={excluirCheque}
        />
      )}

      {tela === 'novo' && (
        <ChequeFormScreen
          cheque={chequeEditando}
          onSalvar={salvarCheque}
          onVoltar={() => setTela(chequeEditando ? 'cheques' : 'dashboard')}
          nomeUsuario={sessao.nome}
        />
      )}

      {tela === 'historico' && (
        <HistoricoScreen empresaId={sessao.empresaId} />
      )}

      {tela === 'admin' && (
        <AdminScreen sessao={sessao} empresa={empresa} onLogout={handleLogout} />
      )}

      {tela !== 'novo' && (
        <BottomNav tela={tela} onNavigate={handleNavegar} />
      )}
    </div>
  );
}
