import { PLANS } from './content';
import { activeProgram, checkedCount, currentDay, pct } from './progress';
import { tickCountdown } from './reminder';
import { LEVELS, MAXSCORE } from '../quiz/content';
import { fmtScore, lastAssess, levelIdx, lvBadge } from '../quiz/scoring';
import { refresh, switchTab } from '../shell/navigation';
import { $, card, esc, fmtDate, toast, today, uid } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { S, save } from '../../state/store';

export let planPick: number | null = null;
const VERY_LIGHT_MSG = 'Bạn đang ở mức Rất thấp (không có biểu hiện FOMO), hãy tiếp tục duy trì thói quen hiện tại và không cần tham gia lộ trình detox.';
// Kết quả gần nhất ở mức Rất thấp (điểm TB ≤ LEVELS[0].max) thì không cho bắt đầu lộ trình.
function isVeryLight() { const last = lastAssess(); return !!last && levelIdx(last.score) === 0; }
export function startPlan(days: number) {
  const cur = activeProgram();
  if (cur && cur.days === days) { planPick = days; switchTab(3); return; }
  if (isVeryLight()) { toast(VERY_LIGHT_MSG); return; }
  if (cur && !confirm(`Bạn đang thực hiện lộ trình ${cur.days} ngày. Bắt đầu lộ trình ${days} ngày sẽ dừng lộ trình đó. Tiếp tục?`)) return;
  if (cur) cur.status = cur.days <= checkedCount(cur) ? 'done' : 'stopped';
  const last = lastAssess();
  S.programs.push({ id: uid(), days, start: today(), checks: {}, status: 'active', preId: last ? last.id : null, postId: null });
  save(); planPick = days; switchTab(3);
  if (!last) toast('Bạn chưa làm trắc nghiệm nên chưa có điểm gốc để so sánh sau lộ trình.');
}
export function pickPlan(d: number) { planPick = d; refresh(); }
export function toggleDay(day: number, on: boolean) {
  const p = activeProgram(); if (!p) return;
  p.checks[day] = on ? today() : null; save(); refresh();
}
export function stopPlan() {
  const p = activeProgram();
  if (!p || !confirm('Dừng lộ trình hiện tại? Lịch sử vẫn được giữ lại.')) return;
  p.status = checkedCount(p) >= p.days ? 'done' : 'stopped'; save(); refresh();
}

export function render3() {
  const act = activeProgram(), last = lastAssess();
  const sel = planPick || (act ? act.days : last ? LEVELS[levelIdx(last.score)].days || 7 : 7); // mức không cần lộ trình: xem trước bản 7 ngày
  const mine = act && act.days === sel ? act : null;
  const plan = PLANS[sel];
  const cur = mine ? currentDay(mine) : 0;
  const pcent = mine ? pct(mine) : 0;
  const unfinished = S.programs.filter(p => p.status !== 'active' && !p.postId && checkedCount(p) >= p.days)[0] || (mine && checkedCount(mine) >= mine.days ? mine : null);
  const list = plan.tasks.map((t, i) => {
    const day = i + 1, on = mine && mine.checks[day], lock = !mine || day > cur;
    return `<label class="flex items-start gap-3 p-3 rounded-xl border transition ${on ? 'bg-emerald-50 border-emerald-300' : day === cur ? 'bg-teal-50/60 border-teal-400' : 'bg-slate-50 border-slate-200/70'} ${lock ? 'opacity-60' : 'cursor-pointer hover:bg-slate-100'}">
      <input type="checkbox" ${on ? 'checked' : ''} ${lock ? 'disabled' : ''} data-change="toggleDay" data-arg="${day}" class="mt-1 h-4 w-4 accent-teal-600">
      <span class="text-sm text-slate-700 leading-snug"><b>Ngày ${day}${day === cur ? ' · hôm nay' : ''}:</b> ${esc(t)}</span></label>`;
  }).join('');
  const startBox = mine ? '' : isVeryLight() ? `<div class="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
      <i class="fa-solid fa-shield-halved mr-1"></i> ${VERY_LIGHT_MSG}</div>` : `<div class="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-900 flex items-center justify-between flex-wrap gap-2">
      <span>${act ? `Bạn đang ở lộ trình ${act.days} ngày.` : 'Đây là bản xem trước.'} Bắt đầu để lưu tiến độ từng ngày.</span>
      <button data-click="startPlan" data-arg="${sel}" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg">Bắt đầu lộ trình ${sel} ngày</button></div>`;
  const post = unfinished ? `<div class="mb-4 p-4 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 text-white flex items-center justify-between flex-wrap gap-2">
      <span class="text-sm"><b>🎉 Hoàn thành lộ trình ${unfinished.days} ngày!</b> Làm trắc nghiệm lần nữa để xem chuyển biến.</span>
      <button data-click="startPost" data-arg="${esc(unfinished.id)}" class="px-4 py-2 bg-white text-teal-700 text-xs font-semibold rounded-lg">Làm khảo sát sau lộ trình</button></div>` : '';
  $('#module-3').innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-1 space-y-6">
      <div class="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg text-center relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 opacity-10"><i class="fa-solid fa-bed text-9xl text-indigo-300"></i></div>
        <span class="bg-indigo-800/80 text-indigo-200 text-xs px-3 py-1 rounded-full border border-indigo-700">Đồng Hồ Nhắc Nhở Đêm</span>
        <h3 class="font-bold text-lg mt-3">Mốc Thời Gian Rời Màn Hình</h3>
        <div class="my-6"><div id="countdownDisplay" class="text-3xl sm:text-4xl font-extrabold tracking-wider text-teal-300 font-mono whitespace-nowrap">-- : -- : --</div>
          <p class="text-xs text-indigo-200/70 mt-1">Khuyên dùng: Tắt thiết bị trước 21h30 mỗi tối</p></div>
        <button data-click="toggleReminder" class="w-full py-2.5 ${S.reminder ? 'bg-rose-500 hover:bg-rose-600' : 'bg-teal-500 hover:bg-teal-600'} text-white font-semibold rounded-xl text-sm transition">
          <i class="fa-solid ${S.reminder ? 'fa-bell-slash' : 'fa-bell'} mr-1"></i> ${S.reminder ? 'Đang Bật Nhắc Nhở (Tắt)' : 'Kích Hoạt Cảnh Báo Nhắc Nhở'}</button>
        <p class="text-[11px] text-indigo-200/60 mt-2">Nhắc nhở hoạt động khi ứng dụng đang mở.</p>
      </div>
      <div class="${card}"><h3 class="font-bold text-slate-800 text-lg mb-3">Chọn Lộ Trình Detox</h3><div class="space-y-3">${[7, 14, 21].map(d => `
        <label class="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition ${d === sel ? 'border-teal-500 bg-teal-50/30' : 'border-slate-200'}">
          <input type="radio" name="detoxPlan" ${d === sel ? 'checked' : ''} data-click="pickPlan" data-arg="${d}" class="accent-teal-600">
          <div class="ml-3"><span class="font-semibold text-slate-800 text-sm block">Lộ trình ${d} Ngày (${PLANS[d].sub})${act && act.days === d ? ' • đang thực hiện' : ''}</span><span class="text-xs text-slate-500">${PLANS[d].who}</span></div></label>`).join('')}</div>
        ${last ? `<p class="text-xs text-slate-500 mt-3">Điểm TB gần nhất ${fmtScore(last.score)}/${MAXSCORE} ${lvBadge(last.score)}: ${LEVELS[levelIdx(last.score)].days ? `gợi ý ${LEVELS[levelIdx(last.score)].days} ngày` : 'không cần lộ trình'}.</p>` : `<p class="text-xs text-slate-500 mt-3">Chưa có điểm. <a href="#2" class="text-teal-600 font-semibold">Làm trắc nghiệm</a> để nhận gợi ý.</p>`}
      </div>
    </div>
    <div class="lg:col-span-2 ${card}">
      ${post}
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div><h3 class="font-bold text-xl text-slate-800">Nhiệm Vụ Detox ${sel} Ngày</h3>
          <p class="text-xs text-slate-500">Đánh dấu tích vào các thói quen bạn đã hoàn thành hôm nay${mine ? ` • Ngày ${cur}/${sel} • bắt đầu ${fmtDate(mine.start)}` : ''}</p></div>
        <div class="text-right"><span class="text-xl font-bold text-teal-600">${pcent}%</span><div class="w-32 bg-slate-200 rounded-full h-2 mt-1"><div class="bg-teal-500 h-2 rounded-full transition-all duration-300" style="width:${pcent}%"></div></div></div>
      </div>
      ${startBox}
      <div class="space-y-3 mt-4">${list}</div>
      ${mine ? '<button data-click="stopPlan" class="mt-4 px-3 py-1.5 border border-slate-300 text-slate-600 text-xs rounded-lg hover:bg-slate-50">Dừng lộ trình</button>' : ''}
    </div></div>`;
  tickCountdown();
}

registerActions({
  pickPlan: ({ arg }) => pickPlan(Number(arg)),
  startPlan: ({ arg }) => startPlan(Number(arg)),
  stopPlan: () => stopPlan(),
  toggleDay: ({ arg, el }) => toggleDay(Number(arg), el.checked),
});
