import { checkedCount, completed, pct, streak } from '../program/progress';
import { compareHtml, lineChart } from '../progress/charts';
import { MAXSCORE } from '../quiz/content';
import { assessById, levelIdx, lvBadge, sortedAssess } from '../quiz/scoring';
import { refresh } from '../shell/navigation';
import { $, card, esc, fmtDate, toast, today, uid } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { S, save } from '../../state/store';

export const SAMPLE_POSTS = [
  { who: 'Học sinh Khối 8 • Ẩn danh', col: 'text-indigo-600', when: 'Bài mẫu', text: '"Mấy hôm nay tắt thông báo sau 21h30 và nghe tiếng mưa rơi ở Module 4 thấy ngủ ngon hẳn. Sáng ra đi học không còn bị đau đầu ngủ gật nữa!"' },
  { who: 'Học sinh Khối 9 • Ẩn danh', col: 'text-teal-600', when: 'Bài mẫu', text: '"Từng bị FOMO nặng vì sợ bỏ lỡ drama trong nhóm chat lớp. Nhưng thử làm theo lộ trình Detox 7 ngày mới thấy không có điện thoại buổi đêm cuộc sống bình yên hơn hẳn."' }
];
export const FORBIDDEN = ['chửi', 'xúc phạm', 'bậy'];

export function badges(): [string, string, string, boolean, string][] {
  const list = sortedAssess();
  const control = S.programs.some(p => { const a = assessById(p.preId), b = p.postId && assessById(p.postId); return a && b && b.score <= a.score - 3; })
    || (list.length > 1 && levelIdx(list[list.length - 1].score) === 0 && levelIdx(list[0].score) > 0);
  return [
    ['Chiến Binh Giấc Ngủ', 'fa-award', 'teal', completed(7), 'Hoàn thành lộ trình 7 ngày'],
    ['Bậc Thầy Kiểm Soát', 'fa-shield-halved', 'indigo', control, 'Giảm từ 3 điểm trở lên sau lộ trình'],
    ['Sứ Giả Detox (14 Ngày)', 'fa-medal', 'amber', completed(14), 'Hoàn thành lộ trình 14 ngày'],
    ['Bậc Thầy Detox (21 Ngày)', 'fa-crown', 'rose', completed(21), 'Hoàn thành lộ trình 21 ngày']
  ];
}
export const BCLS: Record<string, string> = {
  teal: 'bg-teal-50 border-teal-200 text-teal-800|text-teal-600', indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800|text-indigo-600',
  amber: 'bg-amber-50 border-amber-200 text-amber-800|text-amber-600', rose: 'bg-rose-50 border-rose-200 text-rose-800|text-rose-600'
};
export function progressCard() {
  const list = sortedAssess();
  if (!list.length) return `<div class="${card}"><h3 class="font-bold text-xl text-slate-800 mb-1">Tiến Trình &amp; Phân Tích</h3><p class="text-sm text-slate-500">Chưa có dữ liệu. <button data-click="switchTab" data-arg="2" class="text-teal-600 font-semibold">Làm trắc nghiệm đầu tiên</button> để bắt đầu theo dõi.</p></div>`;
  const first = list[0], last = list[list.length - 1];
  const overall = list.length > 1 ? `<div class="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200"><h4 class="font-bold text-sm mb-1">Từ lần đầu đến nay</h4>${compareHtml(first, last)}</div>` : '';
  const progs = S.programs.slice().reverse().map(p => {
    const pre = assessById(p.preId), post = p.postId && assessById(p.postId);
    const st = p.status === 'active' ? 'đang thực hiện' : p.status === 'done' ? 'đã xong' : 'đã dừng';
    return `<div class="mt-3 p-4 border border-slate-200 rounded-xl"><h4 class="font-bold text-sm">Lộ trình ${p.days} ngày • ${fmtDate(p.start)}</h4>
      <p class="text-xs text-slate-500 mb-2">Hoàn thành ${checkedCount(p)}/${p.days} ngày (${pct(p)}%) • ${st}</p>
      ${pre && post ? compareHtml(pre, post) : `<p class="text-xs text-slate-500">${pre ? 'Chưa có khảo sát sau lộ trình.' : 'Không có điểm gốc trước lộ trình.'}</p>${pre && !post && (checkedCount(p) >= p.days || p.status !== 'active') ? `<button data-click="startPost" data-arg="${esc(p.id)}" class="mt-2 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg">Làm khảo sát sau</button>` : ''}`}</div>`;
  }).join('');
  const rows = list.slice().reverse().map(a => `<tr class="border-t border-slate-100"><td class="py-1.5">${fmtDate(a.date)}</td><td>${a.kind}</td><td class="font-semibold">${a.score}/${MAXSCORE}</td><td>${lvBadge(a.score)}</td></tr>`).join('');
  return `<div class="${card}"><h3 class="font-bold text-xl text-slate-800 mb-1">Tiến Trình &amp; Phân Tích</h3>
    <p class="text-xs text-slate-500 mb-3">Điểm càng thấp càng tốt. Vùng xanh: nhẹ (≤18), vàng: trung bình (19–28), đỏ: cao (≥29).</p>
    <div class="max-w-xl">${lineChart(list)}</div>${overall}${progs}
    <h4 class="font-bold text-sm mt-5 mb-1">Lịch sử trắc nghiệm</h4>
    <div class="overflow-x-auto"><table class="w-full text-sm text-left"><tr class="text-xs text-slate-500"><th class="py-1">Ngày</th><th>Loại</th><th>Điểm</th><th>Mức</th></tr>${rows}</table></div></div>`;
}
export function render5() {
  const n = streak();
  $('#module-5').innerHTML = `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-md flex items-center gap-4">
      <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl backdrop-blur-md">🔥</div>
      <div><span class="text-xs uppercase font-semibold text-amber-100">Chuỗi Ngày Detox</span><h3 class="text-2xl font-black">${n} Ngày Liên Tục</h3>
        <p class="text-xs text-amber-100/80 mt-0.5">${n ? 'Giữ vững phong độ nhé!' : 'Hoàn thành một nhiệm vụ hôm nay để bắt đầu chuỗi.'}</p></div></div>
    <div class="md:col-span-2 ${card} flex flex-col justify-center"><h3 class="font-bold text-slate-800 text-sm mb-3">Bộ Sưu Tập Huy Hiệu Ảo</h3>
      <div class="flex items-center gap-3 flex-wrap">${badges().map(b => b[3]
        ? `<div class="flex items-center gap-2 ${BCLS[b[2]].split('|')[0]} border px-3 py-1.5 rounded-xl text-xs font-semibold"><i class="fa-solid ${b[1]} ${BCLS[b[2]].split('|')[1]} text-base"></i> ${b[0]}</div>`
        : `<div title="${b[4]}" class="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-400 text-xs font-semibold opacity-60"><i class="fa-solid fa-lock text-base"></i> ${b[0]}</div>`).join('')}</div></div>
  </div>
  ${progressCard()}
  <div class="${card}">
    <h3 class="font-bold text-xl text-slate-800 mb-1">Góc Chia Sẻ Ẩn Danh (Confession)</h3>
    <p class="text-xs text-slate-500 mb-6">Nơi học sinh THCS Nguyễn Tất Thành trải lòng về áp lực FOMO &amp; lan tỏa động lực Detox. Chỉ bạn đọc được bài của mình: bài lưu trong tài khoản của bạn, giáo viên và quản trị viên không xem được trong app và bài không nằm trong file nộp.</p>
    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
      <textarea id="confessionInput" rows="3" maxlength="1500" class="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Viết chia sẻ hoặc trải nghiệm của bạn tại đây... (Hệ thống tự động ẩn danh)"></textarea>
      <div class="flex justify-between items-center mt-3"><span class="text-xs text-slate-400"><i class="fa-solid fa-user-secret mr-1"></i> Không hiển thị tên của bạn</span>
        <button data-click="postConfession" class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"><i class="fa-solid fa-paper-plane mr-1"></i> Gửi Chia Sẻ</button></div></div>
    <div class="space-y-4">${S.posts.slice().reverse().map(p => `
      <div class="p-4 rounded-xl border border-teal-100 bg-teal-50/40"><div class="flex justify-between items-center mb-2">
        <span class="text-xs font-bold text-teal-700"><i class="fa-solid fa-user-ninja mr-1"></i> Bạn • Ẩn danh</span>
        <span class="text-[11px] text-slate-400">${fmtDate(p.date)} <button data-click="delPost" data-arg="${esc(p.id)}" class="ml-2 text-rose-500" aria-label="Xóa"><i class="fa-solid fa-trash-can"></i></button></span></div>
        <p class="text-sm text-slate-700" style="white-space:pre-wrap">${esc(p.text)}</p></div>`).join('')}
      ${SAMPLE_POSTS.map(p => `<div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50"><div class="flex justify-between items-center mb-2">
        <span class="text-xs font-bold ${p.col}"><i class="fa-solid fa-user-ninja mr-1"></i> ${p.who}</span><span class="text-[11px] text-slate-400">${p.when}</span></div>
        <p class="text-sm text-slate-700">${p.text}</p></div>`).join('')}</div>
  </div>`;
}
export function postConfession() {
  const input = $('#confessionInput'), text = input.value.trim();
  if (!text) { toast('Vui lòng nhập nội dung trước khi gửi!'); return; }
  if (FORBIDDEN.some(w => text.toLowerCase().includes(w))) { toast('Nội dung chứa từ ngữ không phù hợp. Vui lòng giữ môi trường văn minh!'); return; }
  S.posts.push({ id: uid(), date: today(), text }); save(); refresh(); toast('Chia sẻ của bạn đã được lưu.');
}
export function delPost(id: string) {
  if (!confirm('Xóa chia sẻ này?')) return;
  S.posts = S.posts.filter(p => p.id !== id); save(); refresh();
}

registerActions({
  delPost: ({ arg }) => delPost(arg),
  postConfession: () => postConfession(),
});
