import { $, card } from '../../lib/dom';
import { expose } from '../../lib/expose';

export const CARDS = [
  ['amber', 'fa-ghost', 'FOMO Là Gì?', '<strong>Fear Of Missing Out (FOMO)</strong> - Nỗi sợ bị bỏ lỡ thông tin, xu hướng hoặc các sự kiện thú vị mà bạn bè đang trải nghiệm. Nó khiến học sinh luôn thôi thúc phải kiểm tra điện thoại từng phút.', 'fa-circle-info', 'Thuật toán MXH liên tục tạo cảm giác gấp gáp để giữ chân bạn lâu nhất có thể!'],
  ['indigo', 'fa-moon', 'Sát Thủ Giấc Ngủ: Ánh Sáng Xanh', 'Ánh sáng xanh từ màn hình làm gián đoạn nghiêm trọng quá trình sản sinh hormone <strong>Melatonin</strong> - hormone gây buồn ngủ tự nhiên.', 'fa-triangle-exclamation', 'Trì hoãn giấc ngủ kỹ thuật số khiến bạn ngủ muộn, hay giật mình và mệt mỏi vào sáng hôm sau.'],
  ['rose', 'fa-graduation-cap', 'Hệ Lụy Đến Kết Quả Học Tập', 'Thiếu ngủ làm giảm 40% khả năng ghi nhớ ngắn hạn, mất độ tập trung trong giờ học, tiếp thu bài chậm và dễ dẫn đến sa sút điểm số các môn.', 'fa-arrow-trend-down', 'Giấc ngủ ngon là chìa khóa vàng giúp não bộ ghi nhớ kiến thức bền vững.']
];
// Tailwind cần tên lớp đầy đủ, nên liệt kê từng bộ màu.
export const CARD_CLS: Record<string, string[]> = {
  amber: ['bg-amber-100 text-amber-600', 'bg-amber-50 text-amber-800 border-amber-200'],
  indigo: ['bg-indigo-100 text-indigo-600', 'bg-indigo-50 text-indigo-800 border-indigo-200'],
  rose: ['bg-rose-100 text-rose-600', 'bg-rose-50 text-rose-800 border-rose-200']
};
export const SITUATIONS = [
  ['📱 Tình huống 1: Tiếng thông báo Zalo/Messenger phát ra lúc 22h30', 'Bật dậy cầm điện thoại trả lời tin nhắn ngay vì sợ bạn bè nghĩ mình thờ ơ hoặc bỏ lỡ câu chuyện hot. Kết quả: Lướt thêm 1.5 tiếng.', 'Bật chế độ "Do Not Disturb" (Không làm phiền) tự động từ 21h30.'],
  ['🎬 Tình huống 2: Thử thách "Chỉ xem 5 phút TikTok nữa thôi"', 'Các video ngắn liên tục vuốt không hồi kết làm não bộ tiết ra Dopamine liên tục. Bạn rơi vào trạng thái "trì hoãn giấc ngủ kỹ thuật số".', 'Đặt giới hạn ứng dụng 20 phút/ngày hoặc sạc điện thoại ở góc phòng thay vì để gần giường.']
];
export function render1() {
  $('#module-1').innerHTML = `
    <div class="bg-gradient-to-r from-teal-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
      <div class="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center justify-center p-8"><i class="fa-solid fa-mobile-screen-button text-[200px]"></i></div>
      <div class="max-w-2xl relative z-10">
        <span class="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">Kiến Thức Khoa Học</span>
        <h2 class="text-2xl sm:text-3xl font-bold mt-3 mb-2">Giải Mã Hội Chứng FOMO &amp; Giấc Ngủ Kỹ Thuật Số</h2>
        <p class="text-teal-100 text-sm sm:text-base leading-relaxed">Bạn có cảm giác bồn chồn khi rời xa điện thoại? Bạn trằn trọc lướt TikTok đến 1-2 giờ sáng? Hãy cùng khám phá cơ chế tác động của mạng xã hội tới não bộ và nhịp sinh học của bạn.</p>
        <button onclick="switchTab(2)" class="mt-4 px-5 py-2.5 bg-white text-teal-700 font-semibold text-sm rounded-xl shadow hover:bg-teal-50 transition"><i class="fa-solid fa-clipboard-question mr-1"></i> Làm trắc nghiệm ngay</button>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">${CARDS.map(c => `
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
        <div class="w-12 h-12 ${CARD_CLS[c[0]][0]} rounded-xl flex items-center justify-center text-xl mb-4"><i class="fa-solid ${c[1]}"></i></div>
        <h3 class="font-bold text-lg text-slate-800 mb-2">${c[2]}</h3>
        <p class="text-slate-600 text-sm leading-relaxed mb-4">${c[3]}</p>
        <div class="${CARD_CLS[c[0]][1]} p-3 rounded-xl text-xs border"><i class="fa-solid ${c[4]} mr-1"></i> ${c[5]}</div>
      </div>`).join('')}</div>
    <div class="${card}">
      <h3 class="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2"><i class="fa-solid fa-lightbulb text-teal-500"></i> Các Tình Huống Thực Tế Thường Gặp</h3>
      <div class="space-y-3">${SITUATIONS.map((s, i) => `
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button onclick="toggleAccordion(${i})" class="w-full text-left p-4 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 flex justify-between items-center gap-2"><span>${s[0]}</span><i id="acc-icon-${i}" class="fa-solid fa-chevron-down text-slate-400"></i></button>
          <div id="acc-content-${i}" class="hidden p-4 bg-white text-sm text-slate-600 border-t border-slate-100"><strong>Phản ứng FOMO:</strong> ${s[1]}<br><span class="text-teal-600 font-medium">💡 Giải pháp Detox:</span> ${s[2]}</div>
        </div>`).join('')}</div>
    </div>`;
}
export function toggleAccordion(i: number) {
  const c = $('#acc-content-' + i), ic = $('#acc-icon-' + i), hidden = c.classList.toggle('hidden');
  ic.className = hidden ? 'fa-solid fa-chevron-down text-slate-400' : 'fa-solid fa-chevron-up text-teal-600';
}

expose({ toggleAccordion });
