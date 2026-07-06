import React, { useState } from 'react';
import { LogOut, Building2, User, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { C, Card, Btn, FieldLabel, inputStyle, Alert } from '../components/UIComponents.jsx';

export function AdminScreen({ sessao, empresa, onLogout }) {
  const [abaAtiva, setAbaAtiva] = useState('empresa');
  const [nomeEmpresa, setNomeEmpresa] = useState(empresa?.nome || '');
  const [cnpj, setCnpj] = useState(empresa?.cnpj || '');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  async function salvarEmpresa() {
    setSalvando(true); setMsg('');
    const { error } = await supabase.from('empresas')
      .update({ nome: nomeEmpresa, cnpj: cnpj || null })
      .eq('id', empresa.id);
    setMsg(error ? '❌ Erro ao salvar.' : '✅ Dados atualizados!');
    setSalvando(false);
  }

  async function alterarSenha() {
    const { error } = await supabase.auth.resetPasswordForEmail(sessao.email);
    setMsg(error ? '❌ Erro ao enviar e-mail.' : '✅ Link de redefinição enviado para ' + sessao.email);
  }

  const abas = [
    { id: 'empresa', label: 'Empresa',  Icon: Building2 },
    { id: 'conta',   label: 'Conta',    Icon: User },
  ];

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
    </div>
  );
}
