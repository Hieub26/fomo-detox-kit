import { adminSaveQuiz } from '../admin/api';
import { refresh } from '../shell/navigation';
import { QUIZ, setQuiz } from './config';
import { MAXSCORE, type QuizItem } from './content';
import { bt, card, esc, toast } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { S } from '../../state/store';

// Khung sửa câu hỏi nằm ngay trong tab Trắc Nghiệm, chỉ quản trị viên thấy (server vẫn kiểm tra quyền khi lưu).
const E = { draft: null as QuizItem[] | null, open: false }; // giữ phần đang sửa khi tab vẽ lại

function readForm(): QuizItem[] {
  return [...document.querySelectorAll<HTMLElement>('[data-quiz-item]')].map(box => ({
    question: box.querySelector<HTMLTextAreaElement>('[data-q]')!.value.trim(),
    labels: [...box.querySelectorAll<HTMLInputElement>('[data-label]')].map(el => el.value.trim()),
    points: [...box.querySelectorAll<HTMLSelectElement>('[data-points]')].map(el => +el.value)
  }));
}
// Gọi trước khi vẽ lại: chỉ giữ bản nháp nếu thật sự khác câu hỏi đang dùng.
function keepDraft() {
  const form = document.querySelector<HTMLDetailsElement>('#quizEditor');
  if (!form) return;
  E.open = form.open;
  const draft = readForm();
  E.draft = JSON.stringify(draft) === JSON.stringify(QUIZ) ? null : draft;
}

export function quizEditor() {
  if (S.profile.role !== 'admin') return '';
  keepDraft();
  const items = E.draft || QUIZ;
  const cls = 'border border-slate-200 rounded-lg px-2 py-1.5 text-sm';
  return `<div class="${card}"><details id="quizEditor" ${E.open ? 'open' : ''}>
    <summary class="font-bold text-lg text-slate-800 cursor-pointer"><i class="fa-solid fa-pen-to-square text-teal-600 mr-1"></i> Sửa Câu Hỏi Trắc Nghiệm</summary>
    <p class="text-xs text-slate-500 mt-1 mb-4">Mỗi đáp án được 1–4 điểm, điểm càng cao nghĩa là nguy cơ càng cao. Tổng luôn trong 10–${MAXSCORE} nên các mức Rất nhẹ, Nhẹ, Vừa, Cao giữ nguyên ngưỡng.</p>
    <div class="space-y-4">${items.map((q, i) => `<div data-quiz-item class="p-4 bg-slate-50 rounded-xl border border-slate-200">
      <label class="block text-sm font-semibold text-slate-800 mb-2">Câu ${i + 1}
        <textarea data-q rows="3" maxlength="300" class="mt-1 w-full font-normal ${cls}">${esc(q.question)}</textarea></label>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${q.labels.map((l, k) => `<div class="flex gap-2">
        <input data-label maxlength="60" value="${esc(l)}" aria-label="Câu ${i + 1}, nội dung đáp án ${k + 1}" class="flex-1 min-w-0 ${cls}">
        <select data-points aria-label="Câu ${i + 1}, điểm đáp án ${k + 1}" class="${cls}">${[1, 2, 3, 4].map(p => `<option value="${p}" ${q.points[k] === p ? 'selected' : ''}>${p} điểm</option>`).join('')}</select></div>`).join('')}</div>
    </div>`).join('')}</div>
    <button data-click="adminSaveQuiz" class="${bt} bg-teal-600 hover:bg-teal-700 mt-4"><i class="fa-solid fa-floppy-disk mr-1"></i> Lưu câu hỏi</button>
  </details></div>`;
}

async function saveQuiz() {
  const items = readForm();
  const empty = items.findIndex(q => !q.question || q.labels.some(l => !l));
  if (empty >= 0) { toast(`Câu ${empty + 1} còn thiếu nội dung câu hỏi hoặc đáp án.`); return; }
  if (JSON.stringify(items) === JSON.stringify(QUIZ)) { toast('Chưa có thay đổi nào.'); return; }
  const rescored = items.some((q, i) => q.points.join() !== QUIZ[i].points.join());
  if (!confirm(rescored
    ? 'Điểm đáp án thay đổi nên điểm mọi bài đã làm sẽ được tính lại, và mức của học sinh có thể đổi. Tiếp tục?'
    : 'Lưu nội dung mới? Học sinh sẽ thấy ngay từ lần mở app tiếp theo. Các bài đã làm vẫn giữ đáp án đã chọn.')) return;
  try { await adminSaveQuiz(items); } catch (e) { console.error(e); toast('Không lưu được câu hỏi.'); return; }
  setQuiz(items);
  E.draft = null;
  E.open = false; // đóng khung để thấy ngay câu hỏi mới trong tab
  toast('Đã lưu câu hỏi.');
  document.querySelector('#quizEditor')?.remove(); // bỏ form cũ để lần vẽ lại không coi đó là bản nháp
  refresh();
}

registerActions({
  adminSaveQuiz: () => saveQuiz(),
});
