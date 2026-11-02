import { COLOR, LEVELS } from './content';
import { S } from '../../state/store';

export const scoreOf = (ans: number[]) => ans.reduce((a, b) => a + b, 0);
export const levelIdx = (score: number) => LEVELS.findIndex(l => score <= l.max);
export const groupScore = (ans: number[], g: { items: number[] }) => g.items.reduce((a, i) => a + ans[i - 1], 0);
export const byDate = (a: { date: string }, b: { date: string }) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
export const sortedAssess = () => S.assessments.slice().sort(byDate);
export const lastAssess = () => { const a = sortedAssess(); return a[a.length - 1]; };
export const assessById = (id: string | null | undefined) => S.assessments.find(a => a.id === id);
export function lvBadge(score: number) {
  const L = LEVELS[levelIdx(score)];
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${COLOR[L.color].badge}">${L.short}</span>`;
}
