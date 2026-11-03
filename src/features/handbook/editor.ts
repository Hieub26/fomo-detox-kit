import { adminSaveHandbook } from '../admin/api';
import { refresh } from '../shell/navigation';
import { CARDS, SITUATIONS, setHandbook } from './config';
import type { HandbookCard, Situation } from './content';
import { $, bt, card, esc, smallBtn, toast } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { S } from '../../state/store';

// Khung sửa Cẩm Nang nằm ngay trong tab Cẩm Nang, chỉ quản trị viên thấy (server vẫn kiểm tra quyền khi lưu).
type Handbook = { cards: HandbookCard[]; situations: Situation[] };
const E = { draft: null as Handbook | null, open: false }; // giữ phần đang sửa khi tab vẽ lại

function readForm(): Handbook {
  const cards = [...document.querySelectorAll<HTMLElement>('[data-hb-card]')].map(b => ({
    title: b.querySelector<HTMLInputElement>('[data-hb-title]')!.value.trim(),
    body: b.querySelector<HTMLTextAreaElement>('[data-hb-body]')!.value.trim(),
    callout: b.querySelector<HTMLInputElement>('[data-hb-callout]')!.value.trim()
  }));
  const situations = [...document.querySelectorAll<HTMLElement>('[data-hb-sit]')].map(b => ({
    title: b.querySelector<HTMLInputElement>('[data-hb-stitle]')!.value.trim(),
    reaction: b.querySelector<HTMLTextAreaElement>('[data-hb-reaction]')!.value.trim(),
    solution: b.querySelector<HTMLTextAreaElement>('[data-hb-solution]')!.value.trim()
  }));
  return { cards, situations };
}
// Gọi trước khi vẽ lại: chỉ giữ bản nháp nếu thật sự khác nội dung đang dùng.
function keepDraft() {
  const form = document.querySelector<HTMLDetailsElement>('#hbEditor');
  if (!form) return;
  E.open = form.open;
  const draft = readForm();
  E.draft = JSON.stringify(draft) === JSON.stringify({ cards: CARDS, situations: SITUATIONS }) ? null : draft;
}

function editorHtml() {
  const hb = E.draft || { cards: CARDS, situations: SITUATIONS };
  const cls = 'border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-full';
  const cardsHtml = hb.cards.map((c, i) => `<div data-hb-card class="p-4 bg-slate-50 rounded-xl border border-slate-200">
    <div class="flex justify-between items-center mb-2"><span class="text-sm font-semibold text-slate-800">Thẻ ${i + 1}</span>
      <button data-click="hbDelCard" data-arg="${i}" aria-label="Xóa thẻ ${i + 1}" class="${smallBtn} text-rose-700"><i class="fa-solid fa-trash-can"></i></button></div>
    <input data-hb-title maxlength="120" value="${esc(c.title)}" placeholder="Tiêu đề" aria-label="Thẻ ${i + 1} tiêu đề" class="${cls} font-semibold mb-2">
    <textarea data-hb-body rows="3" maxlength="1000" placeholder="Nội dung" aria-label="Thẻ ${i + 1} nội dung" class="${cls} mb-2">${esc(c.body)}</textarea>
    <input data-hb-callout maxlength="300" value="${esc(c.callout)}" placeholder="Ghi chú nổi bật" aria-label="Thẻ ${i + 1} ghi chú" class="${cls}"></div>`).join('');
  const sitsHtml = hb.situations.map((s, i) => `<div data-hb-sit class="p-4 bg-slate-50 rounded-xl border border-slate-200">
    <div class="flex justify-between items-center mb-2"><span class="text-sm font-semibold text-slate-800">Tình huống ${i + 1}</span>
      <button data-click="hbDelSit" data-arg="${i}" aria-label="Xóa tình huống ${i + 1}" class="${smallBtn} text-rose-700"><i class="fa-solid fa-trash-can"></i></button></div>
    <input data-hb-stitle maxlength="160" value="${esc(s.title)}" placeholder="Tình huống" aria-label="Tình huống ${i + 1}" class="${cls} font-semibold mb-2">
    <textarea data-hb-reaction rows="2" maxlength="1000" placeholder="Phản ứng FOMO" aria-label="Tình huống ${i + 1} phản ứng" class="${cls} mb-2">${esc(s.reaction)}</textarea>
    <textarea data-hb-solution rows="2" maxlength="1000" placeholder="Giải pháp Detox" aria-label="Tình huống ${i + 1} giải pháp" class="${cls}">${esc(s.solution)}</textarea></div>`).join('');
  return `<div id="hbEditorBox" class="${card}"><details id="hbEditor" ${E.open ? 'open' : ''}>
    <summary class="font-bold text-lg text-slate-800 cursor-pointer"><i class="fa-solid fa-pen-to-square text-teal-600 mr-1"></i> Sửa Cẩm Nang Số</summary>
    <p class="text-xs text-slate-500 mt-1 mb-4">Thêm, sửa, xóa thẻ kiến thức và tình huống. Văn bản thuần, không dùng mã HTML. Tối đa 20 thẻ và 20 tình huống.</p>
    <h4 class="font-semibold text-sm text-slate-700 mb-2">Thẻ kiến thức</h4>
    <div class="space-y-3">${cardsHtml}</div>
    <button data-click="hbAddCard" class="${smallBtn} mt-2"><i class="fa-solid fa-plus mr-1"></i> Thêm thẻ</button>
    <h4 class="font-semibold text-sm text-slate-700 mt-5 mb-2">Tình huống thực tế</h4>
    <div class="space-y-3">${sitsHtml}</div>
    <button data-click="hbAddSit" class="${smallBtn} mt-2"><i class="fa-solid fa-plus mr-1"></i> Thêm tình huống</button>
    <div class="mt-4"><button data-click="adminSaveHandbook" class="${bt} bg-teal-600 hover:bg-teal-700"><i class="fa-solid fa-floppy-disk mr-1"></i> Lưu Cẩm Nang</button></div>
  </details></div>`;
}
export function handbookEditor() {
  if (S.profile.role !== 'admin') return '';
  keepDraft();
  return editorHtml();
}

// Thêm/xóa chỉ vẽ lại khung sửa, phần Cẩm Nang đang hiển thị và các mục đang mở giữ nguyên.
function changeDraft(change: (hb: Handbook) => void) {
  keepDraft();
  if (!E.draft) E.draft = { cards: CARDS.map(c => ({ ...c })), situations: SITUATIONS.map(s => ({ ...s })) };
  change(E.draft);
  E.open = true;
  $('#hbEditorBox').outerHTML = editorHtml();
}

async function saveHandbook() {
  const hb = readForm();
  if (!hb.cards.length || !hb.situations.length) { toast('Cần ít nhất một thẻ kiến thức và một tình huống.'); return; }
  const emptyCard = hb.cards.findIndex(c => !c.title || !c.body || !c.callout);
  if (emptyCard >= 0) { toast(`Thẻ ${emptyCard + 1} còn thiếu nội dung.`); return; }
  const emptySit = hb.situations.findIndex(s => !s.title || !s.reaction || !s.solution);
  if (emptySit >= 0) { toast(`Tình huống ${emptySit + 1} còn thiếu nội dung.`); return; }
  if (JSON.stringify(hb) === JSON.stringify({ cards: CARDS, situations: SITUATIONS })) { toast('Chưa có thay đổi nào.'); return; }
  if (!confirm('Lưu Cẩm Nang mới? Học sinh sẽ thấy ngay từ lần mở app tiếp theo.')) return;
  try { await adminSaveHandbook(hb.cards, hb.situations); } catch (e) { console.error(e); toast('Không lưu được Cẩm Nang.'); return; }
  setHandbook(hb.cards, hb.situations);
  E.draft = null;
  E.open = false; // đóng khung để thấy ngay nội dung mới trong tab
  toast('Đã lưu Cẩm Nang.');
  document.querySelector('#hbEditor')?.remove(); // bỏ form cũ để lần vẽ lại không coi đó là bản nháp
  refresh();
}

registerActions({
  adminSaveHandbook: () => saveHandbook(),
  hbAddCard: () => changeDraft(hb => { hb.cards.push({ title: '', body: '', callout: '' }); }),
  hbDelCard: ({ arg }) => changeDraft(hb => { hb.cards.splice(+arg, 1); }),
  hbAddSit: () => changeDraft(hb => { hb.situations.push({ title: '', reaction: '', solution: '' }); }),
  hbDelSit: ({ arg }) => changeDraft(hb => { hb.situations.splice(+arg, 1); }),
});
