import React, { useState } from 'react';
import { supabase } from './supabase.js';
import { C, Btn, FieldLabel, inputStyle, Alert } from './UIComponents.jsx';

function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <div style={{ width: 64, height: 64, background: C.navy, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(15,45,72,0.25)' }}>
        <span style={{ fontSize: 28 }}>🏦</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, letterSpacing: '-0.5px' }}>CheqControl</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Gestão de Cheques</div>
    </div>
  );
}

export function LoginScreen({ onSuccess }) {
  const [email, setEmail]   = useState('');
  const [senha, setSenha]   = useState('');
  const [erro, setErro]     = useState('');
  const [loading, setLoading] = useState(false);
  const [modo, setModo]     = useState('login'); // 'login' | 'cadastro' | 'recuperar'

  async function handleLogin() {
    setErro(''); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro('E-mail ou senha incorretos.');
    setLoading(false);
  }

  async function handleRecuperar() {
    setErro(''); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setErro(error.message);
    else setErro('✅ Link enviado! Verifique seu e-mail.');
    setLoading(false);
  }

  if (modo === 'cadastro') return <CadastroScreen onVoltar={() => setModo('login')} onSuccess={onSuccess} />;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.navy} 0%, #1A4A6B 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <Logo />

        {modo === 'recuperar' ? (
          <>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 16, textAlign: 'center' }}>Informe seu e-mail para receber o link de recuperação.</div>
            <FieldLabel>E-mail</FieldLabel>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" style={inputStyle} />
            {erro && <div style={{ marginTop: 10, fontSize: 13, color: erro.startsWith('✅') ? C.green : C.red }}>{erro}</div>}
            <Btn onClick={handleRecuperar} disabled={loading} style={{ width: '100%', marginTop: 20 }}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </Btn>
            <Btn variant="ghost" onClick={() => setModo('login')} style={{ width: '100%', marginTop: 8 }}>← Voltar</Btn>
          </>
        ) : (
          <>
            <FieldLabel>E-mail</FieldLabel>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" style={inputStyle} />
            <FieldLabel>Senha</FieldLabel>
            <input value={senha} onChange={e => setSenha(e.target.value)} type="password" placeholder="••••••••" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            {erro && <div style={{ marginTop: 10, fontSize: 13, color: C.red }}>{erro}</div>}
            <Btn onClick={handleLogin} disabled={loading} style={{ width: '100%', marginTop: 20 }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Btn>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button onClick={() => setModo('recuperar')} style={{ background: 'none', border: 'none', fontSize: 12.5, color: C.muted, cursor: 'pointer' }}>Esqueci a senha</button>
              <button onClick={() => setModo('cadastro')} style={{ background: 'none', border: 'none', fontSize: 12.5, color: C.teal, fontWeight: 600, cursor: 'pointer' }}>Criar conta →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CadastroScreen({ onVoltar, onSuccess }) {
  const [step, setStep]       = useState(1); // 1=dados, 2=empresa
  const [nome, setNome]       = useState('');
  const [email, setEmail]     = useState('');
  const [senha, setSenha]     = useState('');
  const [empresa, setEmpresa] = useState('');
  const [cnpj, setCnpj]       = useState('');
  const [erro, setErro]       = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCadastro() {
    setErro(''); setLoading(true);
    try {
      // 1. Criar usuário
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email, password: senha, options: { data: { nome } }
      });
      if (authErr) throw authErr;

      // 2. Criar empresa
      const { data: emp, error: empErr } = await supabase.from('empresas')
        .insert({ nome: empresa, cnpj: cnpj || null }).select().single();
      if (empErr) throw empErr;

      // 3. Vincular profile à empresa
      await supabase.from('profiles').update({ empresa_id: emp.id, nome, tipo: 'admin' })
        .eq('id', authData.user.id);

    } catch (e) {
      setErro(e.message || 'Erro ao criar conta.');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.navy} 0%, #1A4A6B 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', width: '100%', maxWidth: 400 }}>
        <Logo />
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1,2].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? C.teal : C.border }} />)}
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Seus dados</div>
            <FieldLabel>Nome completo</FieldLabel>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Maria Silva" style={inputStyle} />
            <FieldLabel>E-mail</FieldLabel>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" style={inputStyle} />
            <FieldLabel>Senha (mín. 8 caracteres)</FieldLabel>
            <input value={senha} onChange={e => setSenha(e.target.value)} type="password" placeholder="••••••••" style={inputStyle} />
            {erro && <div style={{ marginTop: 10, fontSize: 13, color: C.red }}>{erro}</div>}
            <Btn onClick={() => { if (!nome || !email || senha.length < 8) { setErro('Preencha todos os campos.'); return; } setErro(''); setStep(2); }} style={{ width: '100%', marginTop: 20 }}>
              Próximo →
            </Btn>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Sua empresa</div>
            <FieldLabel>Nome da empresa</FieldLabel>
            <input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Empresa Ltda" style={inputStyle} />
            <FieldLabel>CNPJ (opcional)</FieldLabel>
            <input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" style={inputStyle} />
            {erro && <div style={{ marginTop: 10, fontSize: 13, color: C.red }}>{erro}</div>}
            <Btn onClick={handleCadastro} disabled={loading || !empresa} style={{ width: '100%', marginTop: 20 }}>
              {loading ? 'Criando...' : 'Criar conta'}
            </Btn>
            <Btn variant="ghost" onClick={() => setStep(1)} style={{ width: '100%', marginTop: 8 }}>← Voltar</Btn>
          </>
        )}

        <button onClick={onVoltar} style={{ background: 'none', border: 'none', fontSize: 12.5, color: C.muted, cursor: 'pointer', marginTop: 16, display: 'block', textAlign: 'center', width: '100%' }}>
          Já tenho conta
        </button>
      </div>
    </div>
  );
}
