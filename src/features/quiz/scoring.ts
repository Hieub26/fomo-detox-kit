import { QUIZ } from './config';
import { COLOR, LEVELS } from './content';
import { S } from '../../state/store';

// Điểm của đáp án đã chọn theo bảng điểm hiện tại. Database tính bằng cùng công thức (private.compute_score).
export const itemScore = (ans: number[], i: number) => QUIZ[i].points[ans[i] - 1];
// Điểm trung bình 1,00–4,00 (làm tròn 2 chữ số), như private.compute_score trong database.
export const scoreOf = (ans: number[]) => Math.round(ans.reduce((a, _, i) => a + itemScore(ans, i), 0) / ans.length * 100) / 100;
// Hiển thị kiểu Việt Nam: 2,35
export const fmtScore = (s: number) => s.toFixed(2).replace('.', ',');
// Kết quả cũ 10 câu không so được từng câu/nhóm với bộ câu hỏi hiện tại.
export const sameQuiz = (ans: number[]) => ans.length === QUIZ.length;
export const levelIdx = (score: number) => LEVELS.findIndex(l => score <= l.max);
export const isHigh = (score: number) => levelIdx(score) === LEVELS.length - 1;
export const groupScore = (ans: number[], g: { items: number[] }) => sameQuiz(ans) ? g.items.reduce((a, i) => a + itemScore(ans, i - 1), 0) : null;
export const byDate = (a: { date: string }, b: { date: string }) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
export const sortedAssess = () => S.assessments.slice().sort(byDate);
export const lastAssess = () => { const a = sortedAssess(); return a[a.length - 1]; };
export const assessById = (id: string | null | undefined) => S.assessments.find(a => a.id === id);
export function lvBadge(score: number) {
  const L = LEVELS[levelIdx(score)];
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${COLOR[L.color].badge}">${L.short}</span>`;
}
