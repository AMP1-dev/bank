import React, { useState, useRef } from 'react';
import { Camera, Scan, ChevronLeft, Save } from 'lucide-react';
import { C, FieldLabel, inputStyle, selectStyle, Btn, Alert, Modal } from './UIComponents.jsx';
import { parseCMC7 } from './cmc7.js';
import { BANCOS_LISTA } from './constants.js';

export function ChequeFormScreen({ cheque, onSalvar, onVoltar, nomeUsuario }) {
  const editando = !!cheque;
  const [form, setForm] = useState({
    data_entrada:  cheque?.data_entrada  || new Date().toISOString().slice(0,10),
    cliente:       cheque?.cliente       || '',
    destino:       cheque?.destino       || '',
    codigo_banco:  cheque?.codigo_banco  || '',
    nome_banco:    cheque?.nome_banco    || '',
    agencia:       cheque?.agencia       || '',
    conta:         cheque?.conta         || '',
    numero_cheque: cheque?.numero_cheque || '',
    emitente:      cheque?.emitente      || '',
    cpf_cnpj:      cheque?.cpf_cnpj      || '',
    telefone:      cheque?.telefone      || '',
    email_obs:     cheque?.email_obs     || '',
    valor:         cheque?.valor         || '',
    vencimento:    cheque?.vencimento    || '',
    compensacao:   cheque?.compensacao   || '',
    status:        cheque?.status        || 'a_vencer',
    cmc7:          cheque?.cmc7          || '',
  });

  const [cmc7Input, setCmc7Input]   = useState('');
  const [cmc7Erro, setCmc7Erro]     = useState('');
  const [cmc7Sucesso, setCmc7Sucesso] = useState(false);
  const [showCamModal, setShowCamModal] = useState(false);
  const [salvando, setSalvando]     = useState(false);
  const [erro, setErro]             = useState('');
  const fileRef = useRef();

  function set(campo, valor) { setForm(prev => ({ ...prev, [campo]: valor })); }

  function aplicarCMC7(raw) {
    const parsed = parseCMC7(raw);
    if (!parsed) { setCmc7Erro('CMC-7 inválido ou incompleto. Verifique os dígitos.'); setCmc7Sucesso(false); return; }
    setForm(prev => ({
      ...prev,
      numero_cheque: parsed.numeroCheque,
      codigo_banco:  parsed.codigoBanco,
      nome_banco:    parsed.nomeBanco,
      agencia:       parsed.agencia,
      conta:         parsed.conta,
      cmc7:          parsed.cmc7Raw,
    }));
    setCmc7Erro('');
    setCmc7Sucesso(true);
  }

  // Leitura via câmera → Claude API
  async function handleImagemCMC7(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowCamModal(false);
    setCmc7Erro('');
    setCmc7Sucesso(false);

    const toBase64 = f => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

    try {
      const base64 = await toBase64(file);
      setCmc7Erro('🔍 Lendo CMC-7 da imagem...');

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
              { type: 'text',  text: 'Extraia a linha CMC-7 deste cheque brasileiro. A linha CMC-7 fica na parte inferior do cheque, formada por números magnéticos. Responda APENAS com os dígitos numéricos, sem espaços ou pontuação. Se não encontrar, responda NENHUM.' }
            ]
          }]
        })
      });
      const data = await resp.json();
      const texto = data?.content?.[0]?.text?.trim() || '';
      if (texto === 'NENHUM' || !texto) { setCmc7Erro('Não foi possível identificar o CMC-7 na imagem. Tente digitar manualmente.'); return; }
      setCmc7Input(texto);
      aplicarCMC7(texto);
    } catch {
      setCmc7Erro('Erro ao processar a imagem. Tente digitar o CMC-7 manualmente.');
    }
  }

  async function handleSalvar() {
    if (!form.emitente.trim())  { setErro('Informe o nome do emitente.'); return; }
    if (!form.numero_cheque.trim()) { setErro('Informe o número do cheque.'); return; }
    if (!form.valor || isNaN(Number(String(form.valor).replace(',','.')))) { setErro('Informe um valor válido.'); return; }
    setErro(''); setSalvando(true);
    await onSalvar({ ...form, valor: Number(String(form.valor).replace(',','.')) });
    setSalvando(false);
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: '16px 16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onVoltar} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#fff' }}>
          <ChevronLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{editando ? 'Editar Cheque' : 'Novo Cheque'}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Preencha os dados do cheque</div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* Leitor CMC-7 */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Scan size={16} /> Leitor CMC-7
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
            Digite ou fotografe a linha magnética do cheque para preencher banco, agência, conta e número automaticamente.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={cmc7Input}
              onChange={e => { setCmc7Input(e.target.value); setCmc7Sucesso(false); setCmc7Erro(''); }}
              placeholder="Cole ou digite os dígitos do CMC-7"
              style={{ ...inputStyle, marginTop: 0, flex: 1, fontFamily: 'monospace', fontSize: 13 }}
            />
            <Btn variant="teal" onClick={() => aplicarCMC7(cmc7Input)} size="sm" style={{ flexShrink: 0, marginTop: 0 }}>
              Aplicar
            </Btn>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Btn variant="outline" size="sm" onClick={() => setShowCamModal(true)} style={{ gap: 4 }}>
              <Camera size={14} /> Fotografar cheque
            </Btn>
          </div>
          {cmc7Sucesso && <div style={{ marginTop: 8, fontSize: 12.5, color: C.green, fontWeight: 600 }}>✅ CMC-7 lido! Campos preenchidos automaticamente.</div>}
          {cmc7Erro   && <div style={{ marginTop: 8, fontSize: 12.5, color: C.amber }}>{cmc7Erro}</div>}
        </div>

        {/* Dados do lançamento */}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Dados do lançamento</div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Data de entrada</FieldLabel>
            <input type="date" value={form.data_entrada} onChange={e => set('data_entrada', e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Status</FieldLabel>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
              <option value="a_vencer">A vencer</option>
              <option value="compensado">Compensado</option>
              <option value="devolvido">Devolvido</option>
            </select>
          </div>
        </div>

        <FieldLabel>Cliente (código/referência)</FieldLabel>
        <input value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Código ou nome do cliente" style={inputStyle} />

        <FieldLabel>Destino</FieldLabel>
        <input value={form.destino} onChange={e => set('destino', e.target.value)} placeholder="Ex: CREDERE, LEPTA FUNDOS..." style={inputStyle} />

        {/* Dados bancários */}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginTop: 20, marginBottom: 4 }}>Dados bancários</div>

        <FieldLabel>Banco</FieldLabel>
        <select value={form.codigo_banco} onChange={e => {
          const cod = Number(e.target.value);
          const banco = BANCOS_LISTA.find(b => b.codigo === cod);
          set('codigo_banco', cod); set('nome_banco', banco?.nome || '');
        }} style={selectStyle}>
          <option value="">Selecionar banco...</option>
          {BANCOS_LISTA.map(b => <option key={b.codigo} value={b.codigo}>{b.codigo} — {b.nome}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Agência</FieldLabel>
            <input value={form.agencia} onChange={e => set('agencia', e.target.value)} placeholder="0000" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Conta</FieldLabel>
            <input value={form.conta} onChange={e => set('conta', e.target.value)} placeholder="00000-0" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Nº Cheque</FieldLabel>
            <input value={form.numero_cheque} onChange={e => set('numero_cheque', e.target.value)} placeholder="000000" style={inputStyle} />
          </div>
        </div>

        {/* Emitente */}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginTop: 20, marginBottom: 4 }}>Emitente</div>

        <FieldLabel>Nome do emitente *</FieldLabel>
        <input value={form.emitente} onChange={e => set('emitente', e.target.value)} placeholder="Nome completo ou razão social" style={inputStyle} />

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>CPF/CNPJ</FieldLabel>
            <input value={form.cpf_cnpj} onChange={e => set('cpf_cnpj', e.target.value)} placeholder="000.000.000-00" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Telefone</FieldLabel>
            <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" style={inputStyle} />
          </div>
        </div>

        <FieldLabel>E-mail / Observação</FieldLabel>
        <input value={form.email_obs} onChange={e => set('email_obs', e.target.value)} placeholder="email@exemplo.com ou observação" style={inputStyle} />

        {/* Valores */}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginTop: 20, marginBottom: 4 }}>Valores e datas</div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Valor (R$) *</FieldLabel>
            <input value={form.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" inputMode="decimal" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Vencimento</FieldLabel>
            <input type="date" value={form.vencimento} onChange={e => set('vencimento', e.target.value)} style={inputStyle} />
          </div>
        </div>

        {form.status === 'compensado' && (
          <>
            <FieldLabel>Data de compensação</FieldLabel>
            <input type="date" value={form.compensacao} onChange={e => set('compensacao', e.target.value)} style={inputStyle} />
          </>
        )}

        {erro && <div style={{ marginTop: 12, padding: '10px 14px', background: C.redLt, borderRadius: 10, fontSize: 13, color: C.red }}>{erro}</div>}

        {/* Botões */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', gap: 8, maxWidth: 480, margin: '0 auto', zIndex: 50 }}>
          <Btn variant="outline" onClick={onVoltar} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn onClick={handleSalvar} disabled={salvando} style={{ flex: 2 }}>
            <Save size={16} /> {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Lançar cheque'}
          </Btn>
        </div>
      </div>

      {/* Modal câmera */}
      {showCamModal && (
        <Modal titulo="Fotografar CMC-7" onClose={() => setShowCamModal(false)}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
            Tire uma foto da <strong>parte inferior do cheque</strong> onde está a linha com os números magnéticos (CMC-7). Mantenha boa iluminação e foco.
          </div>
          <div style={{ background: '#F8FAFC', border: `2px dashed ${C.border}`, borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>Toque para abrir a câmera ou selecionar uma imagem</div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImagemCMC7} />
            <Btn onClick={() => fileRef.current?.click()} variant="teal">Abrir câmera</Btn>
          </div>
          <Btn variant="outline" onClick={() => setShowCamModal(false)} style={{ width: '100%' }}>Cancelar</Btn>
        </Modal>
      )}
    </div>
  );
}
