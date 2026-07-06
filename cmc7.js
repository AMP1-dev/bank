import { BANCOS } from './constants.js';

/**
 * CMC-7 Brasileiro — formato típico:
 * [7 dígitos: nº cheque] [1 dígito ctrl] [3 dígitos: banco] [4 dígitos: agência]
 * [1 dígito ctrl] [10 dígitos: conta+dv] [1 dígito ctrl]
 * Total: 27 dígitos (sem espaços)
 *
 * Aceita strings com ou sem espaços/traços.
 */
export function parseCMC7(raw) {
  if (!raw) return null;

  // Remove tudo que não for dígito
  const digits = raw.replace(/\D/g, '');

  if (digits.length < 27) return null;

  const numeroCheque = digits.substring(0, 7);
  // dígito 8 = controle, ignorar
  const codigoBanco  = parseInt(digits.substring(8, 11), 10);
  const agencia      = digits.substring(11, 15).replace(/^0+/, '') || '0';
  // dígito 15 = controle, ignorar
  const conta        = digits.substring(16, 26).replace(/^0+/, '') || '0';
  // dígito 26 = controle, ignorar

  const nomeBanco = BANCOS[codigoBanco] || `Banco ${codigoBanco}`;

  return {
    numeroCheque,
    codigoBanco,
    nomeBanco,
    agencia,
    conta,
    cmc7Raw: digits,
  };
}

/** Formata CMC-7 para exibição: NNNNNNN 0 BBB AAAA 2 CCCCCCCCCC 6 */
export function formatCMC7(digits) {
  if (!digits || digits.length < 27) return digits || '';
  const d = digits.replace(/\D/g, '');
  return `${d.substring(0,7)} ${d[7]} ${d.substring(8,11)} ${d.substring(11,15)} ${d[15]} ${d.substring(16,26)} ${d[26]}`;
}
