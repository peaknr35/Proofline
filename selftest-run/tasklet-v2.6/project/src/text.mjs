// Text rules (SPEC 6.2, 6.3, 5, 9). Pure: no file system.
import { makeError } from './errors.mjs';

const REFUSED = /[\p{Cc}\p{Cs}\u2028\u2029\u202A-\u202E\u2066-\u2069]/u;
const REFUSED_ALL = /[\p{Cc}\p{Cs}\u2028\u2029\u202A-\u202E\u2066-\u2069]/gu;
const WHOLE = /^[1-9][0-9]*$/;

export function normalizeTitle(args) {
  const s = args.join(' ').normalize('NFC').trim();
  if (REFUSED.test(s)) throw makeError('E_TITLE_CONTROL');
  if (s === '') throw makeError('E_TITLE_EMPTY');
  const n = [...s].length;
  if (n > 200) throw makeError('E_TITLE_TOO_LONG', { n });
  return s;
}

export function parseId(arg) {
  if (typeof arg !== 'string' || !WHOLE.test(arg) || Number(arg) > Number.MAX_SAFE_INTEGER) {
    throw makeError('E_ID_INVALID');
  }
  return Number(arg);
}

export function parsePort(arg) {
  if (typeof arg !== 'string' || !WHOLE.test(arg) || Number(arg) > 65535) {
    throw makeError('E_USAGE_BAD_PORT');
  }
  return Number(arg);
}

export function safeText(s) {
  return String(s).replace(REFUSED_ALL, '?');
}

const HTML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => HTML[c]);
}
