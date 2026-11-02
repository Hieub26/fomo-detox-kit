import { checkedCount, completed, pct, streak } from '../program/progress';
import { compareHtml, lineChart } from '../progress/charts';
import { MAXSCORE } from '../quiz/content';
import { assessById, levelIdx, lvBadge, sortedAssess } from '../quiz/scoring';
import { supportBox } from '../quiz/view';
import { refresh } from '../shell/navigation';
import { $, card, esc, fmtDate, toast, today, uid } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { sb } from '../../lib/supabase';
import { S, save } from '../../state/store';

// Bảng ẩn danh chung: bài của mọi học sinh, không kèm tên người viết (xem community_posts()).
let feed: { id: string; date: string; text: string }[] = [];
// Tải bài của cả trường rồi vẽ lại danh sách. Bài của chính mình luôn hiện nhờ merge trong feedHtml,
// kể cả khi chưa kịp đồng bộ lên máy chủ.
async function loadFeed() {
  const { data, error } = await sb.rpc('community_posts');
  if (error || !data) return;
  feed = data.map(r => ({ id: r.id, date: r.posted_on, text: r.body }));
  const el = $('#confessionFeed');
  if (el) el.innerHTML = feedHtml();
}
function feedHtml() {
  const own = new Set(S.posts.map(p => p.id)), admin = S.profile.role === 'admin';
  const serverIds = new Set(feed.map(f => f.id));
  const extra = S.posts.filter(p => !serverIds.has(p.id)).map(p => ({ id: p.id, date: p.date, text: p.text }));
  const all = [...extra, ...feed]; // bài của mình chưa đồng bộ lên trước, rồi tới bài máy chủ (mới nhất trước)
  const posts = all.map(p => {
    const mine = own.has(p.id);
    const del = mine
      ? `<button data-click="delPost" data-arg="${esc(p.id)}" class="ml-2 text-rose-500" aria-label="Xóa"><i class="fa-solid fa-trash-can"></i></button>`
      : admin ? `<button data-click="adminDelPost" data-arg="${esc(p.id)}" class="ml-2 text-rose-500" aria-label="Xóa bài này" title="Xóa bài (quản trị)"><i class="fa-solid fa-trash-can"></i></button>` : '';
    return `<div class="p-4 rounded-xl border ${mine ? 'border-teal-100 bg-teal-50/40' : 'border-slate-100 bg-slate-50/50'}"><div class="flex justify-between items-center mb-2">
      <span class="text-xs font-bold ${mine ? 'text-teal-700' : 'text-slate-600'}"><i class="fa-solid fa-user-ninja mr-1"></i> Ẩn danh</span>
      <span class="text-[11px] text-slate-400">${fmtDate(p.date)} ${del}</span></div>
      <p class="text-sm text-slate-700" style="white-space:pre-wrap">${esc(p.text)}</p></div>`;
  }).join('');
  return posts + SAMPLE_POSTS.map(p => `<div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50"><div class="flex justify-between items-center mb-2">
      <span class="text-xs font-bold ${p.col}"><i class="fa-solid fa-user-ninja mr-1"></i> ${p.who}</span><span class="text-[11px] text-slate-400">${p.when}</span></div>
      <p class="text-sm text-slate-700">${p.text}</p></div>`).join('');
}

export const SAMPLE_POSTS = [
  { who: 'Học sinh Khối 8 • Ẩn danh', col: 'text-indigo-600', when: 'Bài mẫu', text: '"Mấy hôm nay tắt thông báo sau 21h30 và nghe tiếng mưa rơi ở Module 4 thấy ngủ ngon hẳn. Sáng ra đi học không còn bị đau đầu ngủ gật nữa!"' },
  { who: 'Học sinh Khối 9 • Ẩn danh', col: 'text-teal-600', when: 'Bài mẫu', text: '"Từng bị FOMO nặng vì sợ bỏ lỡ drama trong nhóm chat lớp. Nhưng thử làm theo lộ trình Detox 7 ngày mới thấy không có điện thoại buổi đêm cuộc sống bình yên hơn hẳn."' }
];
// Từ tục, chửi bới và viết tắt phổ biến. So khớp theo cả từ (không phải một phần của từ khác),
// nên các câu kể lại như "em bị bạn chửi" vẫn gửi được. Thêm từ vào hai danh sách dưới đây khi cần.
export const BAD_WORDS = [
  'địt', 'đụ', 'đéo', 'đếch', 'lồn', 'buồi', 'cặc', 'đĩ', 'điếm', 'chó chết', 'óc chó', 'thằng chó', 'mẹ mày',
  'bố mày', 'con mẹ mày', 'khốn nạn', 'đồ khốn', 'súc vật', 'bố láo', 'mất dạy', 'mất nết', 'đồ ngu', 'ngu như bò',
  'ngu như chó', 'thằng ngu', 'con ngu', 'đồ điên', 'cút đi'
];
// Câu có dấu hiệu tự làm hại mình không bao giờ bị chặn: bài vẫn được lưu và app hiện nơi tìm hỗ trợ.
export const SELF_HARM = ['muốn chết', 'chết đi', 'tự tử', 'tự sát', 'không muốn sống', 'tự làm đau', 'tự làm hại'];
export const BAD_ABBR = ['dm', 'đm', 'dmm', 'đmm', 'dcm', 'đcm', 'dkm', 'đkm', 'vcl', 'vkl', 'vl', 'vc', 'vcc', 'cc', 'cl', 'clm', 'clgt', 'cmm', 'cmnr', 'loz', 'dit', 'đjt', 'djt', 'fuck', 'shit', 'bitch', 'wtf', 'đờ mờ'];
const words = (t: string) => ' ' + t.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ';
export const hasBadWords = (text: string) => { const w = words(text); return [...BAD_WORDS, ...BAD_ABBR].some(b => w.includes(' ' + b + ' ')); };
export const hasSelfHarm = (text: string) => { const w = words(text); return SELF_HARM.some(b => w.includes(' ' + b + ' ')); };
let showSupport = false; // bài vừa gửi có dấu hiệu tự làm hại mình; bỏ khi gửi bài khác hoặc tải lại trang

export function badges(): [string, string, string, boolean, string][] {
  const list = sortedAssess();
  const control = S.programs.some(p => { const a = assessById(p.preId), b = p.postId && assessById(p.postId); return a && b && b.score <= a.score - 3; })
    || (list.length > 1 && levelIdx(list[list.length - 1].score) === 0 && levelIdx(list[0].score) > 0);
  const admin = S.profile.role === 'admin'; // quản trị viên thấy mọi huy hiệu đã mở để xem trước giao diện
  const list4: [string, string, string, boolean, string][] = [
    ['Chiến Binh Giấc Ngủ', 'fa-award', 'teal', completed(7), 'Hoàn thành lộ trình 7 ngày'],
    ['Bậc Thầy Kiểm Soát', 'fa-shield-halved', 'indigo', control, 'Giảm từ 3 điểm trở lên sau lộ trình'],
    ['Sứ Giả Detox (14 Ngày)', 'fa-medal', 'amber', completed(14), 'Hoàn thành lộ trình 14 ngày'],
    ['Bậc Thầy Detox (21 Ngày)', 'fa-crown', 'rose', completed(21), 'Hoàn thành lộ trình 21 ngày']
  ];
  return admin ? list4.map(b => [b[0], b[1], b[2], true, b[4]]) : list4;
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
    <p class="text-xs text-slate-500 mb-6">Nơi học sinh THCS Nguyễn Tất Thành trải lòng về áp lực FOMO &amp; lan tỏa động lực Detox. Mọi người đọc được bài của nhau nhưng không ai thấy tên người viết. Bài vi phạm sẽ bị quản trị viên gỡ.</p>
    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
      <textarea id="confessionInput" rows="3" maxlength="1500" class="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Viết chia sẻ hoặc trải nghiệm của bạn tại đây... (Hệ thống tự động ẩn danh)"></textarea>
      <div class="flex justify-between items-center mt-3"><span class="text-xs text-slate-400"><i class="fa-solid fa-user-secret mr-1"></i> Không hiển thị tên của bạn</span>
        <button data-click="postConfession" class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"><i class="fa-solid fa-paper-plane mr-1"></i> Gửi Chia Sẻ</button></div></div>
    ${showSupport ? `<div class="mb-6"><p class="text-sm text-slate-700">Cảm ơn bạn đã chia sẻ. Bạn không phải một mình đối mặt với chuyện này.</p>${supportBox()}</div>` : ''}
    <div id="confessionFeed" class="space-y-4">${feedHtml()}</div>
  </div>`;
  loadFeed();
}
export function postConfession() {
  const input = $('#confessionInput'), text = input.value.trim();
  if (!text) { toast('Vui lòng nhập nội dung trước khi gửi!'); return; }
  showSupport = hasSelfHarm(text);
  if (!showSupport && hasBadWords(text)) { toast('Nội dung chứa từ ngữ không phù hợp. Vui lòng giữ môi trường văn minh!'); return; }
  S.posts.push({ id: uid(), date: today(), text }); save(); refresh(); toast('Chia sẻ của bạn đã được lưu.');
}
export function delPost(id: string) {
  if (!confirm('Xóa chia sẻ này?')) return;
  S.posts = S.posts.filter(p => p.id !== id);
  feed = feed.filter(p => p.id !== id);
  save(); refresh();
}
// Quản trị viên gỡ bài của bất kỳ ai. Hàm admin_delete_post kiểm tra quyền phía máy chủ.
export async function adminDelPost(id: string) {
  if (!confirm('Gỡ bài này khỏi Góc Chia Sẻ? Không khôi phục được.')) return;
  const { error } = await sb.rpc('admin_delete_post', { post_id: id });
  if (error) { toast('Không gỡ được bài. Hãy thử lại.'); return; }
  feed = feed.filter(p => p.id !== id);
  S.posts = S.posts.filter(p => p.id !== id); // phòng khi quản trị viên gỡ chính bài của mình
  save(); refresh(); toast('Đã gỡ bài.');
}

registerActions({
  delPost: ({ arg }) => delPost(arg),
  adminDelPost: ({ arg }) => adminDelPost(arg),
  postConfession: () => postConfession(),
});
