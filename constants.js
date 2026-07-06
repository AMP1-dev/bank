export const BANCOS = {
  1:   'Banco do Brasil',
  33:  'Santander',
  41:  'Banrisul',
  70:  'BRB',
  77:  'Banco Inter',
  104: 'Caixa Econômica Federal',
  208: 'BTG Pactual',
  212: 'Banco Original',
  237: 'Bradesco',
  260: 'Nubank',
  290: 'PagBank',
  336: 'C6 Bank',
  341: 'Itaú',
  389: 'Mercado Pago',
  422: 'Safra',
  633: 'Rendimento',
  707: 'Daycoval',
  735: 'Neon',
  748: 'Sicredi',
  756: 'Sicoob',
};

export const BANCOS_LISTA = Object.entries(BANCOS)
  .map(([codigo, nome]) => ({ codigo: Number(codigo), nome }))
  .sort((a, b) => a.nome.localeCompare(b.nome));

export const STATUS = {
  a_vencer:   { label: 'A vencer',   color: '#1A6B9A', bg: '#DBEEFF', icon: '🔵' },
  alerta:     { label: 'Vence em breve', color: '#B45309', bg: '#FEF3C7', icon: '⚠️' },
  vencido:    { label: 'Vencido',    color: '#C0392B', bg: '#FEE2E2', icon: '🔴' },
  compensado: { label: 'Compensado', color: '#15803D', bg: '#DCFCE7', icon: '✅' },
  devolvido:  { label: 'Devolvido',  color: '#7C3AED', bg: '#EDE9FE', icon: '❌' },
};

export const DIAS_ALERTA = 7; // dias antes do vencimento para alertar

export function calcularStatus(cheque) {
  if (cheque.status === 'compensado') return 'compensado';
  if (cheque.status === 'devolvido')  return 'devolvido';
  if (!cheque.vencimento) return 'a_vencer';
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const venc = new Date(cheque.vencimento + 'T00:00:00');
  const diff = Math.floor((venc - hoje) / 86400000);
  if (diff < 0)              return 'vencido';
  if (diff <= DIAS_ALERTA)   return 'alerta';
  return 'a_vencer';
}
