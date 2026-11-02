import type { Program } from '../../types';
import { daysBetween, pad, today } from '../../lib/dom';
import { S } from '../../state/store';

export const activeProgram = () => S.programs.find(p => p.status === 'active');
export const checkedCount = (p: Program) => Object.keys(p.checks).filter(k => p.checks[k]).length;
export const currentDay = (p: Program) => Math.max(1, Math.min(p.days, daysBetween(p.start, today()) + 1));
export const pct = (p: Program) => Math.round(checkedCount(p) / p.days * 100);
export const completed = (d: number) => S.programs.some(p => p.days === d && checkedCount(p) >= d);

export function streak() {
  const set = new Set();
  S.programs.forEach(p => Object.values(p.checks).forEach(v => { if (v) set.add(v); }));
  let d = new Date(), n = 0;
  const key = (x: Date) => x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
  if (!set.has(key(d))) d.setDate(d.getDate() - 1);
  while (set.has(key(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
