import type { Program } from '../../types';
import { daysBetween, pad, today } from '../../lib/dom';
import { S } from '../../state/store';

export const activeProgram = () => S.programs.find(p => p.status === 'active');
export const checkedCount = (p: Program) => Object.keys(p.checks).filter(k => p.checks[k]).length;
export const currentDay = (p: Program) => Math.max(1, Math.min(p.days, daysBetween(p.start, today()) + 1));
export const pct = (p: Program) => Math.round(checkedCount(p) / p.days * 100);
export const completed = (d: number) => S.programs.some(p => p.days === d && checkedCount(p) >= d);

// Thanh tiến độ lộ trình: số ngày đã đánh dấu trên tổng số ngày. Xanh lá khi đã xong, teal khi đang làm.
export function progressBar(p: Program) {
  const percent = pct(p), color = p.status === 'done' ? 'bg-emerald-500' : p.status === 'active' ? 'bg-teal-500' : 'bg-slate-400';
  return `<div class="mt-2"><div class="flex justify-between text-[11px] text-slate-500 mb-1"><span>${checkedCount(p)}/${p.days} ngày</span><span>${percent}%</span></div>
    <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ${color} rounded-full transition-all" style="width:${percent}%"></div></div></div>`;
}

export function streak() {
  const set = new Set();
  S.programs.forEach(p => Object.values(p.checks).forEach(v => { if (v) set.add(v); }));
  let d = new Date(), n = 0;
  const key = (x: Date) => x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
  if (!set.has(key(d))) d.setDate(d.getDate() - 1);
  while (set.has(key(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
