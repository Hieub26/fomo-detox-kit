import { CARDS, SITUATIONS } from './config';
import { CARD_CLS, CARD_COLORS, CARD_ICONS } from './content';
import { handbookEditor } from './editor';
import { $, card, esc } from '../../lib/dom';
import { registerActions } from '../../lib/actions';

export function render1() {
  const editor = handbookEditor(); // đọc bản nháp từ khung sửa cũ nên phải gọi trước khi thay nội dung tab
  $('#module-1').innerHTML = `
    ${editor}
    <div class="bg-gradient-to-r from-teal-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
      <div class="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center justify-center p-8"><i class="fa-solid fa-mobile-screen-button text-[200px]"></i></div>
      <div class="max-w-2xl relative z-10">
        <span class="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">Kiến Thức Khoa Học</span>
        <h2 class="text-2xl sm:text-3xl font-bold mt-3 mb-2">Giải Mã Hội Chứng FOMO &amp; Giấc Ngủ Kỹ Thuật Số</h2>
        <p class="text-teal-100 text-sm sm:text-base leading-relaxed">Bạn có cảm giác bồn chồn khi rời xa điện thoại? Bạn trằn trọc lướt TikTok đến 1-2 giờ sáng? Hãy cùng khám phá cơ chế tác động của mạng xã hội tới não bộ và nhịp sinh học của bạn.</p>
        <button data-click="switchTab" data-arg="2" class="mt-4 px-5 py-2.5 bg-white text-teal-700 font-semibold text-sm rounded-xl shadow hover:bg-teal-50 transition"><i class="fa-solid fa-clipboard-question mr-1"></i> Làm trắc nghiệm ngay</button>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">${CARDS.map((c, i) => {
      const col = CARD_COLORS[i % CARD_COLORS.length];
      return `<div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
        <div class="w-12 h-12 ${CARD_CLS[col][0]} rounded-xl flex items-center justify-center text-xl mb-4"><i class="fa-solid ${CARD_ICONS[i % CARD_ICONS.length]}"></i></div>
        <h3 class="font-bold text-lg text-slate-800 mb-2">${esc(c.title)}</h3>
        <p class="text-slate-600 text-sm leading-relaxed mb-4" style="white-space:pre-wrap">${esc(c.body)}</p>
        <div class="${CARD_CLS[col][1]} p-3 rounded-xl text-xs border"><i class="fa-solid fa-circle-info mr-1"></i> ${esc(c.callout)}</div>
      </div>`;
    }).join('')}</div>
    <div class="${card}">
      <h3 class="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2"><i class="fa-solid fa-lightbulb text-teal-500"></i> Các Tình Huống Thực Tế Thường Gặp</h3>
      <div class="space-y-3">${SITUATIONS.map((s, i) => `
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button data-click="toggleAccordion" data-arg="${i}" class="w-full text-left p-4 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 flex justify-between items-center gap-2"><span>${esc(s.title)}</span><i id="acc-icon-${i}" class="fa-solid fa-chevron-down text-slate-400"></i></button>
          <div id="acc-content-${i}" class="hidden p-4 bg-white text-sm text-slate-600 border-t border-slate-100" style="white-space:pre-wrap"><strong>Phản ứng FOMO:</strong> ${esc(s.reaction)}<br><span class="text-teal-600 font-medium">💡 Giải pháp Detox:</span> ${esc(s.solution)}</div>
        </div>`).join('')}</div>
    </div>`;
}
export function toggleAccordion(i: number) {
  const c = $('#acc-content-' + i), ic = $('#acc-icon-' + i), hidden = c.classList.toggle('hidden');
  ic.className = hidden ? 'fa-solid fa-chevron-down text-slate-400' : 'fa-solid fa-chevron-up text-teal-600';
}

registerActions({
  toggleAccordion: ({ arg }) => toggleAccordion(Number(arg)),
});
