export function formatBRL(v) {
  if (v === null || v === undefined) return '—';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('pt-BR');
}

export function formatCPFCNPJ(v) {
  if (!v) return '—';
  const d = v.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return v;
}

export function diasParaVencer(vencimento) {
  if (!vencimento) return null;
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const venc = new Date(vencimento + 'T00:00:00');
  return Math.floor((venc - hoje) / 86400000);
}
