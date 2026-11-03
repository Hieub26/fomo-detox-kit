import type { Assessment, SurveyInfo } from '../../types';
import { compareHtml } from '../progress/charts';
import { QUIZ } from './config';
import { COLOR, INFO_Q, LEVELS, MAXSCORE, NOTE_LABEL, NOTE_MAX, PART1, PART3, SCALE_LABEL, SUPPORT } from './content';
import { quizEditor } from './editor';
import { assessById, fmtScore, isHigh, lastAssess, levelIdx, scoreOf } from './scoring';
import { switchTab } from '../shell/navigation';
import { $, card, esc, fmtDate, toast, uid } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { S, save } from '../../state/store';

export let postFor: string | null = null, retake = false;
// Hiện ngay trong kết quả mức Cao, không giấu sau một nút bấm.
export function supportBox() {
  return `<div class="mt-4 p-4 rounded-xl bg-white border border-rose-200 text-sm text-slate-700">
    <h4 class="font-bold text-rose-800 mb-1"><i class="fa-solid fa-hand-holding-heart mr-1"></i> Bạn có thể tìm hỗ trợ ở đâu?</h4>
    <ul class="list-disc pl-5 space-y-1">
      <li>${esc(SUPPORT.school)}</li>
      <li>Bố mẹ, người thân hoặc một người lớn bạn tin tưởng.</li>
      <li>Nếu bạn thấy quá căng thẳng, buồn bã kéo dài hoặc không an toàn, hãy nói ngay với người lớn hoặc gọi <a href="tel:${esc(SUPPORT.hotline)}" class="font-bold text-rose-700 underline">${esc(SUPPORT.hotline)}</a>: ${esc(SUPPORT.hotlineName)}.</li>
    </ul></div>`;
}
export function startRetake() {
  if (!confirm('Làm lại trắc nghiệm sẽ thêm một kết quả mới vào lịch sử (kết quả cũ vẫn được giữ). Tiếp tục?')) return;
  retake = true; render2(); window.scrollTo(0, 0);
}
export function render2() {
  const post = postFor && S.programs.find(p => p.id === postFor);
  const last = lastAssess();
  const editor = quizEditor(); // đọc bản nháp từ khung sửa cũ nên phải gọi trước khi thay nội dung tab
  if (last && !post && !retake) {
    $('#module-2').innerHTML = `${editor}<div class="${card} sm:p-8"><div class="max-w-3xl mx-auto">
      <div class="text-center mb-6"><span class="bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full">${SCALE_LABEL}</span>
        <h2 class="text-2xl font-bold text-slate-800 mt-2">Kết Quả Trắc Nghiệm Gần Nhất</h2>
        <p class="text-slate-500 text-sm mt-1">Bạn đã hoàn thành trắc nghiệm. Bạn chỉ nên làm lại sau khi thực hiện lộ trình hoặc sau vài ngày để thấy chuyển biến.</p></div>
      <div id="resultBox" class="p-6 rounded-2xl border"></div>
      <div class="text-center mt-6"><button data-click="startRetake" class="px-6 py-2.5 border-2 border-teal-600 text-teal-700 font-semibold text-sm rounded-xl hover:bg-teal-50"><i class="fa-solid fa-rotate-right mr-1"></i> Làm lại trắc nghiệm</button></div>
    </div></div>`;
    const box = $('#resultBox'); box.className = `p-6 rounded-2xl border ${COLOR[LEVELS[levelIdx(last.score)].color].box}`;
    showResult(box, last);
    return;
  }
  $('#module-2').innerHTML = `${editor}<div class="${card} sm:p-8"><div class="max-w-3xl mx-auto">
    <div class="text-center mb-8">
      <span class="bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full">${SCALE_LABEL}</span>
      <h2 class="text-2xl font-bold text-slate-800 mt-2">Đánh Giá Mức Độ FOMO &amp; Giấc Ngủ Của Bạn</h2>
      <p class="text-slate-500 text-sm mt-1">Trả lời trung thực các câu hỏi dưới đây. Điểm được tính từ ${QUIZ.length} câu ở Phần II để gợi ý lộ trình phù hợp.</p>
      ${post ? `<p class="mt-3 text-sm bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl px-3 py-2"><i class="fa-solid fa-flag-checkered mr-1"></i> Đây là bài khảo sát <b>sau</b> Lộ trình ${post.days} ngày. Kết quả sẽ được so sánh với bài trước đó.</p>` : ''}
    </div>
    <form id="fomoForm" class="space-y-6" data-submit="noop">
      <h3 class="font-bold text-lg text-slate-800">Phần I. Thông tin chung</h3>
      ${PART1.map(infoBlock).join('')}
      <h3 class="font-bold text-lg text-slate-800 pt-2">Phần II. Biểu hiện tâm lý FOMO</h3>
      ${QUIZ.map((q, i) => `<div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <p class="font-semibold text-slate-800 text-sm mb-3">${i + 1}. ${esc(q.question)}</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">${q.labels.map((o, k) => `
          <label class="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-teal-50 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50">
            <input type="radio" name="q_${i}" value="${k + 1}" class="accent-teal-600"> ${esc(o)}</label>`).join('')}</div></div>`).join('')}
      <h3 class="font-bold text-lg text-slate-800 pt-2">Phần III. Nhu cầu hỗ trợ</h3>
      ${PART3.map(infoBlock).join('')}
      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80"><label class="block font-semibold text-slate-800 text-sm mb-2" for="info_note">${esc(NOTE_LABEL)} <span class="font-normal text-slate-400">(không bắt buộc)</span></label>
        <textarea id="info_note" rows="3" maxlength="${NOTE_MAX}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"></textarea></div>
      <div class="pt-4 text-center"><button type="button" data-click="calculateScore" class="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 mx-auto"><i class="fa-solid fa-calculator"></i> Xem Kết Quả</button></div>
    </form>
    <div id="resultBox" class="hidden mt-8 p-6 rounded-2xl border"></div>
    <p class="text-xs text-slate-400 text-center mt-6">Công cụ sàng lọc để tự theo dõi, không phải chẩn đoán y khoa.</p>
  </div></div>`;
}
// Một câu ở Phần I/III: chọn một (radio) hoặc chọn nhiều (checkbox).
function infoBlock(key: keyof typeof INFO_Q) {
  const q = INFO_Q[key], multi = 'multi' in q && q.multi;
  return `<div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
    <p class="font-semibold text-slate-800 text-sm mb-3">${esc(q.label)}</p>
    <div class="flex flex-wrap gap-2 text-xs">${q.opts.map(o => `
      <label class="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-teal-50 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50">
        <input type="${multi ? 'checkbox' : 'radio'}" name="info_${key}" value="${esc(o)}" class="accent-teal-600"> ${esc(o)}</label>`).join('')}</div></div>`;
}
function readInfo(): SurveyInfo | string {
  const one = (k: string) => document.querySelector<HTMLInputElement>(`input[name="info_${k}"]:checked`)?.value;
  const many = (k: string) => [...document.querySelectorAll<HTMLInputElement>(`input[name="info_${k}"]:checked`)].map(el => el.value);
  const info: SurveyInfo = {
    gender: one('gender'), snsTime: one('snsTime'), snsWhen: many('snsWhen'),
    wantReduce: one('wantReduce'), readyDetox: one('readyDetox'), support: many('support'),
    note: (document.querySelector<HTMLTextAreaElement>('#info_note')?.value || '').trim().slice(0, NOTE_MAX) || undefined
  };
  for (const k of [...PART1, ...PART3]) {
    const v = info[k];
    if (!v || (Array.isArray(v) && !v.length)) return k;
  }
  return info;
}
export function calculateScore() {
  const info = readInfo();
  if (typeof info === 'string') {
    toast('Vui lòng trả lời câu: ' + INFO_Q[info as keyof typeof INFO_Q].label);
    document.querySelector(`input[name="info_${info}"]`)!.scrollIntoView({ block: 'center' }); return;
  }
  const answers = [];
  for (let i = 0; i < QUIZ.length; i++) {
    const c = document.querySelector<HTMLInputElement>(`input[name="q_${i}"]:checked`);
    if (!c) { toast(`Vui lòng trả lời đủ ${QUIZ.length} câu ở Phần II. Bạn chưa trả lời câu ${i + 1}.`); document.querySelector(`input[name="q_${i}"]`)!.scrollIntoView({ block: 'center' }); return; }
    answers.push(+c.value);
  }
  const post = postFor && S.programs.find(p => p.id === postFor);
  const a = { id: uid(), date: new Date().toISOString(), answers, score: scoreOf(answers), kind: post ? 'sau' : 'thường', programId: post ? post.id : null, info };
  S.assessments.push(a);
  if (post) { post.postId = a.id; post.status = 'done'; postFor = null; }
  save();
  retake = false;
  render2(); // thay biểu mẫu bằng trang kết quả: không chọn lại đáp án hay nộp trùng được nữa
  $('#resultBox').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
export function showResult(box: HTMLElement, a: Assessment) {
  const li = levelIdx(a.score), L = LEVELS[li], C = COLOR[L.color];
  const prog = a.programId && S.programs.find(p => p.id === a.programId);
  const pre = prog && assessById(prog.preId);
  let actions = '';
  if (isHigh(a.score)) actions = `<button data-click="startPlan" data-arg="21" class="px-4 py-2 ${C.btn} text-white text-xs font-semibold rounded-lg">Bắt Đầu Lộ Trình Detox 21 Ngày</button>`;
  else if (L.days) actions = `<button data-click="startPlan" data-arg="${L.days}" class="px-4 py-2 ${C.btn} text-white text-xs font-semibold rounded-lg">${li <= 1 ? 'Duy trì' : 'Kích Hoạt'} Lộ Trình Detox ${L.days} Ngày</button>`;
  actions += `<button data-click="switchTab" data-arg="5" class="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50">Xem tiến độ</button>`;
  box.className = `mt-8 p-6 rounded-2xl border ${C.box} animate-fade-in`;
  box.innerHTML = `<div class="flex items-start gap-4">
    <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shrink-0 shadow-md ${C.icon}"><i class="fa-solid ${L.icon}"></i></div>
    <div class="flex-grow">
      <div class="flex items-center justify-between flex-wrap gap-2"><h3 class="text-xl font-bold ${C.title}">${L.title}</h3><span class="px-3 py-1 rounded-full text-xs font-bold text-white ${C.badge}">Điểm TB: ${fmtScore(a.score)}/${MAXSCORE}</span></div>
      <p class="text-sm mt-2 leading-relaxed text-slate-700">${L.desc}</p>
      ${isHigh(a.score) ? supportBox() : ''}
      ${pre ? `<div class="mt-4 p-3 bg-white/70 rounded-xl border border-slate-200"><h4 class="font-bold text-sm mb-1">So sánh với trước lộ trình</h4>${compareHtml(pre, a)}</div>` : ''}
      <p class="text-xs text-slate-500 mt-3"><i class="fa-solid fa-floppy-disk mr-1"></i> Kết quả ngày ${fmtDate(a.date)} đã được lưu trong tài khoản của bạn.</p>
      <div class="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap gap-3">${actions}</div>
    </div></div>`;
}


export function startPost(id: string) { postFor = id; switchTab(2); }

registerActions({
  calculateScore: () => calculateScore(),
  startPost: ({ arg }) => startPost(arg),
  startRetake: () => startRetake(),
});
