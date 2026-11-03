import type { Assessment } from '../../types';
import { GROUPS, LEVELS, MAXSCORE, MINSCORE } from '../quiz/content';
import { fmtScore, groupScore, itemScore, lvBadge, sameQuiz } from '../quiz/scoring';
import { esc, fmtDate } from '../../lib/dom';

export function lineChart(list: { date: string; score: number }[]) {
  if (!list.length) return '<p class="text-sm text-slate-400">Chưa có dữ liệu.</p>';
  const W = 360, H = 190, L = 30, R = 12, T = 12, B = 26, lo = MINSCORE, hi = MAXSCORE;
  const x = (i: number) => list.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (list.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const band = (a: number, b: number, c: string) => `<rect x="${L}" y="${y(b)}" width="${W - L - R}" height="${y(a) - y(b)}" fill="${c}" opacity=".12"/>`;
  const cut = [lo, ...LEVELS.map(l => l.max)], fill = ['#10b981', '#84cc16', '#f59e0b', '#f43f5e'];
  let g = LEVELS.map((_, i) => band(cut[i], cut[i + 1], fill[i])).join('');
  cut.forEach(v => { g += `<text x="${L - 4}" y="${y(v) + 4}" font-size="10" text-anchor="end" fill="#64748b">${String(v).replace('.', ',')}</text>`; });
  const pts = list.map((a, i) => `${x(i)},${y(a.score)}`).join(' ');
  let dots = '';
  list.forEach((a, i) => {
    dots += `<circle cx="${x(i)}" cy="${y(a.score)}" r="4.5" fill="#0d9488"/><text x="${x(i)}" y="${y(a.score) - 8}" font-size="10" text-anchor="middle" fill="#334155">${fmtScore(a.score)}</text>`;
    if (list.length <= 8 || i % Math.ceil(list.length / 6) === 0) dots += `<text x="${x(i)}" y="${H - 8}" font-size="9" text-anchor="middle" fill="#64748b">${fmtDate(a.date).slice(0, 5)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" role="img" aria-label="Biểu đồ điểm FOMO theo thời gian">${g}<polyline points="${pts}" fill="none" stroke="#0d9488" stroke-width="2.5"/>${dots}</svg>`;
}
export function compareHtml(pre: Assessment, post: Assessment) {
  const d = Math.round((post.score - pre.score) * 100) / 100;
  const cls = d < 0 ? 'text-emerald-600' : d > 0 ? 'text-rose-600' : 'text-slate-600';
  const sd = (v: number) => (v > 0 ? '+' : '') + fmtScore(v);
  let verdict;
  if (d <= -0.6) verdict = 'Chuyển biến rất tốt: điểm nguy cơ giảm mạnh.';
  else if (d <= -0.3) verdict = 'Chuyển biến tốt: điểm nguy cơ giảm rõ rệt.';
  else if (d < 0) verdict = 'Có cải thiện nhẹ. Hãy tiếp tục duy trì thói quen.';
  else if (d === 0) verdict = 'Điểm chưa thay đổi. Hãy thử lộ trình dài hơn hoặc trao đổi với thầy cô.';
  else verdict = 'Điểm tăng lên. Hãy xem lại các câu tăng điểm và nhờ thầy cô, phụ huynh hỗ trợ.';
  let detail = '<p class="text-xs text-slate-500 mt-2">Bài trước làm theo bộ câu hỏi cũ nên chỉ so sánh được điểm trung bình.</p>';
  if (sameQuiz(pre.answers) && sameQuiz(post.answers)) {
    const rows = GROUPS.map(g => {
      const a = groupScore(pre.answers, g)!, b = groupScore(post.answers, g)!, dd = b - a;
      return `<tr class="border-t border-slate-100"><td class="py-1.5 pr-2">${esc(g.name)}</td><td>${a}/${g.items.length * 4}</td><td>${b}/${g.items.length * 4}</td><td class="font-semibold ${dd < 0 ? 'text-emerald-600' : dd > 0 ? 'text-rose-600' : ''}">${dd > 0 ? '+' + dd : dd}</td></tr>`;
    }).join('');
    const better = [], worse = [];
    for (let i = 0; i < post.answers.length; i++) { const dd = itemScore(post.answers, i) - itemScore(pre.answers, i); if (dd < 0) better.push(i + 1); else if (dd > 0) worse.push(i + 1); }
    detail = `<div class="overflow-x-auto mt-2"><table class="w-full text-xs text-left"><tr class="text-slate-500"><th class="py-1">Nhóm</th><th>Trước</th><th>Sau</th><th>Đổi</th></tr>${rows}</table></div>
    <p class="text-xs text-slate-500 mt-2">Câu cải thiện: ${better.length ? better.map(n => 'câu ' + n).join(', ') : 'không có'}. Câu tăng điểm: ${worse.length ? worse.map(n => 'câu ' + n).join(', ') : 'không có'}.</p>`;
  }
  return `<p class="text-sm"><b>${fmtScore(pre.score)}</b> → <b>${fmtScore(post.score)}</b>/${MAXSCORE} điểm TB (<span class="font-bold ${cls}">${sd(d)}</span>) · ${lvBadge(pre.score)} → ${lvBadge(post.score)}</p>
    <p class="text-sm text-slate-700 mt-1">${verdict}</p>${detail}`;
}
