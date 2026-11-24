/** Formatting helpers shared by Fiori and SAP GUI renderings. */
import type { DateFormat } from './store';

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

/** KR → 2026.12.08, SAP → 08.12.2026 */
export const fmtDate = (iso: string | null | undefined, f: DateFormat) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return f === 'KR' ? `${y}.${m}.${d}` : `${d}.${m}.${y}`;
};

/** 1,000.00 */
export const fmtNum = (n: number, decimals = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** 1,000.00 EUR */
export const fmtAmt = (n: number, cur: string) => `${fmtNum(n)} ${cur}`;

export const fmtQty = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 3 });

export const fiscalYear = () => new Date().getFullYear();

export const nowTime = () => new Date().toTimeString().slice(0, 8);
