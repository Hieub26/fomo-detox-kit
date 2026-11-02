'use strict';
/* FOMO DETOX KIT – giao diện theo bản gốc, dữ liệu lưu trong localStorage của thiết bị. */

const KEY = 'fomo_detox_kit_v2';

/* ======================= NỘI DUNG ======================= */
const Q = [
  'Bạn có cảm giác bồn chồn, lo lắng khi không thể kiểm tra thông báo mạng xã hội?',
  'Bạn có thói quen cầm điện thoại lướt mạng ngay trước khi đi ngủ?',
  'Bạn từng giật mình thức giấc nửa đêm và kiểm tra điện thoại ngay lập tức?',
  "Bạn cảm thấy sợ mình trở thành 'người đứng ngoài cuộc' khi bạn bè bàn về xu hướng hót trên mạng?",
  'Việc lướt điện thoại ban đêm khiến bạn ngủ ít hơn 6 tiếng/ngày?',
  'Bạn thường thức dậy trong trạng thái uể oải, mệt mỏi và đau đầu vào sáng hôm sau?',
  'Bạn từng ngủ gật hoặc khó tập trung chú ý trong các giờ học trên lớp?',
  'Bạn cảm thấy khó đi vào giấc ngủ (mất hơn 30 phút trằn trọc)?',
  'Bạn có liên tục trì hoãn việc đi ngủ chỉ để xem thêm video ngắn (TikTok/Reels)?',
  'Bạn có muốn chủ động thay đổi thói quen dùng điện thoại để cải thiện điểm số học tập?'
];
const OPTS = ['Hoàn toàn không', 'Thỉnh thoảng', 'Thường xuyên', 'Rất thường xuyên']; // giá trị 1–4, tổng 10–40
const MAXSCORE = 40;
const GROUPS = [
  { name: 'Lo âu FOMO', items: [1, 4] },
  { name: 'Dùng điện thoại ban đêm', items: [2, 3, 9] },
  { name: 'Giấc ngủ & học tập', items: [5, 6, 7, 8] }
];
const COLOR = {
  emerald: { box: 'border-emerald-300 bg-emerald-50/50', icon: 'bg-emerald-500', title: 'text-emerald-900', badge: 'bg-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', soft: 'bg-emerald-100 text-emerald-800' },
  amber: { box: 'border-amber-300 bg-amber-50/50', icon: 'bg-amber-500', title: 'text-amber-900', badge: 'bg-amber-600', btn: 'bg-amber-600 hover:bg-amber-700', soft: 'bg-amber-100 text-amber-800' },
  rose: { box: 'border-rose-300 bg-rose-50/50', icon: 'bg-rose-500', title: 'text-rose-900', badge: 'bg-rose-600', btn: 'bg-rose-600 hover:bg-rose-700', soft: 'bg-rose-100 text-rose-800' }
};
// Ngưỡng ≤18 và ≤28 theo bản gốc. Gợi ý lộ trình: nhẹ 7 ngày, trung bình 14 ngày, cao 21 ngày.
const LEVELS = [
  { short: 'Nhẹ', max: 18, color: 'emerald', days: 7, icon: 'fa-shield-halved', title: 'Mức Độ Nhẹ: Kiểm Soát Tốt',
    desc: 'Chúc mừng! Bạn duy trì thói quen công nghệ rất lành mạnh. Cảm giác FOMO thấp và chất lượng giấc ngủ được bảo vệ tốt.' },
  { short: 'Trung bình', max: 28, color: 'amber', days: 14, icon: 'fa-triangle-exclamation', title: 'Mức Độ Trung Bình: Cảnh Báo Phụ Thuộc',
    desc: 'Cảnh báo! Bạn đang có dấu hiệu bị ảnh hưởng bởi hội chứng FOMO. Việc lướt điện thoại ban đêm bắt đầu làm giảm chất lượng giấc ngủ và sự tập trung học tập.' },
  { short: 'Cao', max: 40, color: 'rose', days: 21, icon: 'fa-bell-concierge', title: 'Mức Độ Cao: Báo Động Nghiêm Trọng',
    desc: 'BÁO ĐỘNG! Bạn đang gặp phải hội chứng FOMO nghiêm trọng và rối loạn giấc ngủ kỹ thuật số. Cần can thiệp ngay để tránh sa sút học tập và ảnh hưởng sức khỏe tâm thần.' }
];

const BASE_TASKS = [
  'Tắt toàn bộ thông báo ứng dụng mạng xã hội không quan trọng sau 21h00.',
  'Đặt sạc điện thoại cách xa giường ngủ ít nhất 2 mét trước khi đi ngủ.',
  'Thay thế thói quen lướt TikTok/Reels bằng nghe 15 phút âm thanh sóng não ở Module 4.',
  "Thiết lập vùng 'Không Thiết Bị Điện Tử' trong phòng ngủ.",
  'Thực hiện thử thách không kiểm tra tin nhắn trong 2 giờ liên tiếp khi học bài.',
  'Đọc một cuốn sách/truyện giấy 20 phút trước khi đi ngủ thay vì nhìn màn hình.',
  'Hoàn thành 1 ngày Detox - Tắt hoàn toàn thiết bị điện tử sau 21h30!',
  'Xóa tạm thời 1 ứng dụng tiêu tốn nhiều thời gian nhất của bạn.',
  'Tham gia một hoạt động thể thao/ngoại khóa ngoài trời sau giờ học.',
  'Chia sẻ cảm nhận Detox lên Góc Ẩn Danh (Module 5).',
  'Duy trì ngủ đúng giờ trước 22h00 liên tiếp 3 ngày.',
  'Đặt điện thoại ở chế độ màn hình Trắng Đen (Grayscale) để giảm kích thích thị giác.',
  'Tự thưởng cho bản thân một món quà nhỏ vì duy trì thói quen tốt.'
];
const PLANS = {
  7: { sub: 'Cơ bản', who: 'Dành cho mức độ nhẹ', badge: 'Chiến Binh Giấc Ngủ', tasks: BASE_TASKS.slice(0, 7) },
  14: {
    sub: 'Chuyên sâu', who: 'Dành cho mức độ FOMO trung bình', badge: 'Sứ Giả Detox',
    tasks: BASE_TASKS.concat(['Tốt nghiệp Lộ trình Detox 14 ngày & Nhận Huy Hiệu Sứ Giả Detox!'])
  },
  // Ngày 14–21 của lộ trình 21 ngày do nhóm phát triển soạn thêm; chỉnh tại đây.
  21: {
    sub: 'Toàn diện', who: 'Dành cho mức độ FOMO cao / rối loạn ngủ', badge: 'Bậc Thầy Detox',
    tasks: BASE_TASKS.concat([
      'Nhìn lại nửa chặng: mở Module 5, xem điểm của bạn thay đổi thế nào và ghi lại 1 điều bạn tự hào.',
      'Đặt giờ ngừng màn hình: ngừng mọi thiết bị có màn hình trước giờ đi ngủ 60 phút.',
      'Dọn màn hình chính: gỡ ứng dụng mạng xã hội khỏi trang đầu và tắt chấm số thông báo.',
      'Dành 30 phút trò chuyện trực tiếp với bạn bè hoặc gia đình, không cầm điện thoại.',
      "Viết ra 3 điều bạn nghĩ mình 'bỏ lỡ' khi không online, rồi đánh giá xem có thật sự quan trọng không (Góc Ẩn Danh).",
      'Có 3 giờ buổi tối liên tục không dùng mạng xã hội để tập trung học và nghỉ ngơi.',
      'Tốt nghiệp Lộ trình Detox 21 ngày & Nhận Huy Hiệu Bậc Thầy Detox! Viết kế hoạch duy trì thói quen.'
    ])
  }
};
const SOUNDS = {
  alpha: { name: 'Sóng Alpha (10Hz)', desc: 'Tần số giúp não bộ thư giãn sâu sau các giờ học căng thẳng', icon: 'fa-brain' },
  theta: { name: 'Sóng Theta (6Hz)', desc: 'Tần số hỗ trợ chợp mắt và đi vào giấc ngủ sâu', icon: 'fa-bed' },
  rain: { name: 'Tiếng Mưa Rơi (White Noise)', desc: 'Tạo môi trường âm thanh nền che lấp các tiếng ồn gây xao nhãng', icon: 'fa-cloud-showers-heavy' },
  ocean: { name: 'Sóng Biển Dịu Êm (Pink Noise)', desc: 'Tần số nhịp nhàng dịu êm, nhấp nhô như sóng vỗ', icon: 'fa-water' },
  lofi: { name: 'Giai Điệu Thiền Nhẹ Nhàng', desc: 'Nhịp điệu chậm rãi xoa dịu nhịp tim', icon: 'fa-music' }
};
const SAMPLE_POSTS = [
  { who: 'Học sinh Khối 8 • Ẩn danh', col: 'text-indigo-600', when: 'Bài mẫu', text: '"Mấy hôm nay tắt thông báo sau 21h30 và nghe tiếng mưa rơi ở Module 4 thấy ngủ ngon hẳn. Sáng ra đi học không còn bị đau đầu ngủ gật nữa!"' },
  { who: 'Học sinh Khối 9 • Ẩn danh', col: 'text-teal-600', when: 'Bài mẫu', text: '"Từng bị FOMO nặng vì sợ bỏ lỡ drama trong nhóm chat lớp. Nhưng thử làm theo lộ trình Detox 7 ngày mới thấy không có điện thoại buổi đêm cuộc sống bình yên hơn hẳn."' }
];
const FORBIDDEN = ['chửi', 'xúc phạm', 'bậy'];
const REMIND_H = 21, REMIND_M = 30;

/* ======================= DỮ LIỆU ======================= */
function blank() {
  return {
    profile: { code: 'HS-' + Math.random().toString(36).slice(2, 6).toUpperCase(), name: '', cls: '' },
    assessments: [], programs: [], posts: [], audio: [], reminder: false
  };
}
function load() {
  try { const r = localStorage.getItem(KEY); if (r) return Object.assign(blank(), JSON.parse(r)); } catch (e) { /* dùng dữ liệu rỗng */ }
  return blank();
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Không lưu được dữ liệu trên trình duyệt. Hãy tải bản sao lưu.'); }
}

/* ======================= TIỆN ÍCH ======================= */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pad = n => String(n).padStart(2, '0');
function today() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
const fmtDate = s => { const p = String(s).slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 3500);
}
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const csvCell = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
const toCsv = rows => '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
const card = 'bg-white rounded-2xl p-6 shadow-sm border border-slate-100';

/* ======================= CHẤM ĐIỂM & TIẾN ĐỘ ======================= */
const scoreOf = ans => ans.reduce((a, b) => a + b, 0);
const levelIdx = score => LEVELS.findIndex(l => score <= l.max);
const groupScore = (ans, g) => g.items.reduce((a, i) => a + ans[i - 1], 0);
const byDate = (a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
const sortedAssess = () => S.assessments.slice().sort(byDate);
const lastAssess = () => { const a = sortedAssess(); return a[a.length - 1]; };
const assessById = id => S.assessments.find(a => a.id === id);
function lvBadge(score) {
  const L = LEVELS[levelIdx(score)];
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${COLOR[L.color].badge}">${L.short}</span>`;
}
const activeProgram = () => S.programs.find(p => p.status === 'active');
const checkedCount = p => Object.keys(p.checks).filter(k => p.checks[k]).length;
const currentDay = p => Math.max(1, Math.min(p.days, daysBetween(p.start, today()) + 1));
const pct = p => Math.round(checkedCount(p) / p.days * 100);
const completed = d => S.programs.some(p => p.days === d && checkedCount(p) >= d);

function streak() {
  const set = new Set();
  S.programs.forEach(p => Object.values(p.checks).forEach(v => { if (v) set.add(v); }));
  let d = new Date(), n = 0;
  const key = x => x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
  if (!set.has(key(d))) d.setDate(d.getDate() - 1);
  while (set.has(key(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ======================= BIỂU ĐỒ & SO SÁNH ======================= */
function lineChart(list) {
  if (!list.length) return '<p class="text-sm text-slate-400">Chưa có dữ liệu.</p>';
  const W = 360, H = 190, L = 30, R = 12, T = 12, B = 26, lo = 10, hi = 40;
  const x = i => list.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (list.length - 1);
  const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const band = (a, b, c) => `<rect x="${L}" y="${y(b)}" width="${W - L - R}" height="${y(a) - y(b)}" fill="${c}" opacity=".12"/>`;
  let g = band(lo, 18, '#10b981') + band(18, 28, '#f59e0b') + band(28, hi, '#f43f5e');
  [10, 18, 28, 40].forEach(v => { g += `<text x="${L - 4}" y="${y(v) + 4}" font-size="10" text-anchor="end" fill="#64748b">${v}</text>`; });
  const pts = list.map((a, i) => `${x(i)},${y(a.score)}`).join(' ');
  let dots = '';
  list.forEach((a, i) => {
    dots += `<circle cx="${x(i)}" cy="${y(a.score)}" r="4.5" fill="#0d9488"/><text x="${x(i)}" y="${y(a.score) - 8}" font-size="10" text-anchor="middle" fill="#334155">${a.score}</text>`;
    if (list.length <= 8 || i % Math.ceil(list.length / 6) === 0) dots += `<text x="${x(i)}" y="${H - 8}" font-size="9" text-anchor="middle" fill="#64748b">${fmtDate(a.date).slice(0, 5)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" role="img" aria-label="Biểu đồ điểm FOMO theo thời gian">${g}<polyline points="${pts}" fill="none" stroke="#0d9488" stroke-width="2.5"/>${dots}</svg>`;
}
function compareHtml(pre, post) {
  const d = post.score - pre.score;
  const cls = d < 0 ? 'text-emerald-600' : d > 0 ? 'text-rose-600' : 'text-slate-600';
  let verdict;
  if (d <= -6) verdict = 'Chuyển biến rất tốt: điểm nguy cơ giảm mạnh.';
  else if (d <= -3) verdict = 'Chuyển biến tốt: điểm nguy cơ giảm rõ rệt.';
  else if (d < 0) verdict = 'Có cải thiện nhẹ. Hãy tiếp tục duy trì thói quen.';
  else if (d === 0) verdict = 'Điểm chưa thay đổi. Hãy thử lộ trình dài hơn hoặc trao đổi với thầy cô.';
  else verdict = 'Điểm tăng lên. Hãy xem lại các câu tăng điểm và nhờ thầy cô, phụ huynh hỗ trợ.';
  const rows = GROUPS.map(g => {
    const a = groupScore(pre.answers, g), b = groupScore(post.answers, g), dd = b - a;
    return `<tr class="border-t border-slate-100"><td class="py-1.5 pr-2">${esc(g.name)}</td><td>${a}/${g.items.length * 4}</td><td>${b}/${g.items.length * 4}</td><td class="font-semibold ${dd < 0 ? 'text-emerald-600' : dd > 0 ? 'text-rose-600' : ''}">${dd > 0 ? '+' + dd : dd}</td></tr>`;
  }).join('');
  const better = [], worse = [];
  for (let i = 0; i < 9; i++) { const dd = post.answers[i] - pre.answers[i]; if (dd < 0) better.push(i + 1); else if (dd > 0) worse.push(i + 1); }
  return `<p class="text-sm"><b>${pre.score}</b> → <b>${post.score}</b>/${MAXSCORE} điểm (<span class="font-bold ${cls}">${d > 0 ? '+' + d : d}</span>) · ${lvBadge(pre.score)} → ${lvBadge(post.score)}</p>
    <p class="text-sm text-slate-700 mt-1">${verdict}</p>
    <div class="overflow-x-auto mt-2"><table class="w-full text-xs text-left"><tr class="text-slate-500"><th class="py-1">Nhóm</th><th>Trước</th><th>Sau</th><th>Đổi</th></tr>${rows}</table></div>
    <p class="text-xs text-slate-500 mt-2">Câu cải thiện: ${better.length ? better.map(n => 'câu ' + n).join(', ') : 'không có'}. Câu tăng điểm: ${worse.length ? worse.map(n => 'câu ' + n).join(', ') : 'không có'}.</p>`;
}

/* ======================= ĐIỀU HƯỚNG ======================= */
const TABS = [
  [1, 'fa-book-open', '1. Cẩm Nang Số'], [2, 'fa-clipboard-question', '2. Trắc Nghiệm FOMO'], [3, 'fa-calendar-check', '3. Lộ Trình Detox'],
  [4, 'fa-headphones', '4. Âm Thanh Sóng Não'], [5, 'fa-chart-line', '5. Góc Chia Sẻ & Badge']
];
let tab = 1, postFor = null, planPick = null;
function switchTab(n) {
  if (location.hash === '#' + n) show(n); else location.hash = '#' + n;
}
function show(n) {
  tab = n;
  for (let i = 1; i <= 6; i++) $('#module-' + i).classList.toggle('hidden', i !== n);
  $('#navTabs').innerHTML = TABS.map(t => `<button onclick="switchTab(${t[0]})" class="flex items-center gap-2 px-3.5 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${t[0] === n ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}"><i class="fa-solid ${t[1]} text-base"></i> <span>${t[2]}</span></button>`).join('');
  RENDER[n]();
  window.scrollTo(0, 0);
}
function refresh() { const y = window.scrollY; RENDER[tab](); window.scrollTo(0, y); }

/* ======================= MODULE 1: CẨM NANG SỐ ======================= */
const CARDS = [
  ['amber', 'fa-ghost', 'FOMO Là Gì?', '<strong>Fear Of Missing Out (FOMO)</strong> - Nỗi sợ bị bỏ lỡ thông tin, xu hướng hoặc các sự kiện thú vị mà bạn bè đang trải nghiệm. Nó khiến học sinh luôn thôi thúc phải kiểm tra điện thoại từng phút.', 'fa-circle-info', 'Thuật toán MXH liên tục tạo cảm giác gấp gáp để giữ chân bạn lâu nhất có thể!'],
  ['indigo', 'fa-moon', 'Sát Thủ Giấc Ngủ: Ánh Sáng Xanh', 'Ánh sáng xanh từ màn hình làm gián đoạn nghiêm trọng quá trình sản sinh hormone <strong>Melatonin</strong> - hormone gây buồn ngủ tự nhiên.', 'fa-triangle-exclamation', 'Trì hoãn giấc ngủ kỹ thuật số khiến bạn ngủ muộn, hay giật mình và mệt mỏi vào sáng hôm sau.'],
  ['rose', 'fa-graduation-cap', 'Hệ Lụy Đến Kết Quả Học Tập', 'Thiếu ngủ làm giảm 40% khả năng ghi nhớ ngắn hạn, mất độ tập trung trong giờ học, tiếp thu bài chậm và dễ dẫn đến sa sút điểm số các môn.', 'fa-arrow-trend-down', 'Giấc ngủ ngon là chìa khóa vàng giúp não bộ ghi nhớ kiến thức bền vững.']
];
// Tailwind cần tên lớp đầy đủ, nên liệt kê từng bộ màu.
const CARD_CLS = {
  amber: ['bg-amber-100 text-amber-600', 'bg-amber-50 text-amber-800 border-amber-200'],
  indigo: ['bg-indigo-100 text-indigo-600', 'bg-indigo-50 text-indigo-800 border-indigo-200'],
  rose: ['bg-rose-100 text-rose-600', 'bg-rose-50 text-rose-800 border-rose-200']
};
const SITUATIONS = [
  ['📱 Tình huống 1: Tiếng thông báo Zalo/Messenger phát ra lúc 22h30', 'Bật dậy cầm điện thoại trả lời tin nhắn ngay vì sợ bạn bè nghĩ mình thờ ơ hoặc bỏ lỡ câu chuyện hot. Kết quả: Lướt thêm 1.5 tiếng.', 'Bật chế độ "Do Not Disturb" (Không làm phiền) tự động từ 21h30.'],
  ['🎬 Tình huống 2: Thử thách "Chỉ xem 5 phút TikTok nữa thôi"', 'Các video ngắn liên tục vuốt không hồi kết làm não bộ tiết ra Dopamine liên tục. Bạn rơi vào trạng thái "trì hoãn giấc ngủ kỹ thuật số".', 'Đặt giới hạn ứng dụng 20 phút/ngày hoặc sạc điện thoại ở góc phòng thay vì để gần giường.']
];
function render1() {
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
function toggleAccordion(i) {
  const c = $('#acc-content-' + i), ic = $('#acc-icon-' + i), hidden = c.classList.toggle('hidden');
  ic.className = hidden ? 'fa-solid fa-chevron-down text-slate-400' : 'fa-solid fa-chevron-up text-teal-600';
}

/* ======================= MODULE 2: TRẮC NGHIỆM ======================= */
function render2() {
  const post = postFor && S.programs.find(p => p.id === postFor);
  $('#module-2').innerHTML = `<div class="${card} sm:p-8"><div class="max-w-3xl mx-auto">
    <div class="text-center mb-8">
      <span class="bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full uppercase">Thang Đo Chuẩn Hóa FOMO-S &amp; PSQI</span>
      <h2 class="text-2xl font-bold text-slate-800 mt-2">Đánh Giá Mức Độ FOMO &amp; Giấc Ngủ Của Bạn</h2>
      <p class="text-slate-500 text-sm mt-1">Trả lời trung thực 10 câu hỏi ngắn dưới đây để hệ thống tính điểm tự động và đưa ra cảnh báo nguy cơ.</p>
      ${post ? `<p class="mt-3 text-sm bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl px-3 py-2"><i class="fa-solid fa-flag-checkered mr-1"></i> Đây là bài khảo sát <b>sau</b> Lộ trình ${post.days} ngày. Kết quả sẽ được so sánh với bài trước đó.</p>` : ''}
    </div>
    <form id="fomoForm" class="space-y-6" onsubmit="return false">
      ${Q.map((q, i) => `<div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <p class="font-semibold text-slate-800 text-sm mb-3">${i + 1}. ${esc(q)}</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">${OPTS.map((o, k) => `
          <label class="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-teal-50 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50">
            <input type="radio" name="q_${i}" value="${k + 1}" class="accent-teal-600"> ${o}</label>`).join('')}</div></div>`).join('')}
      <div class="pt-4 text-center"><button type="button" onclick="calculateScore()" class="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 mx-auto"><i class="fa-solid fa-calculator"></i> Xem Kết Quả &amp; Đánh Giá Nguy Cơ</button></div>
    </form>
    <div id="resultBox" class="hidden mt-8 p-6 rounded-2xl border"></div>
    <p class="text-xs text-slate-400 text-center mt-6">Công cụ sàng lọc để tự theo dõi, không phải chẩn đoán y khoa.</p>
  </div></div>`;
}
function calculateScore() {
  const answers = [];
  for (let i = 0; i < Q.length; i++) {
    const c = document.querySelector(`input[name="q_${i}"]:checked`);
    if (!c) { toast('Vui lòng trả lời đủ 10 câu. Bạn chưa trả lời câu ' + (i + 1) + '.'); document.querySelector(`input[name="q_${i}"]`).scrollIntoView({ block: 'center' }); return; }
    answers.push(+c.value);
  }
  const post = postFor && S.programs.find(p => p.id === postFor);
  const a = { id: uid(), date: new Date().toISOString(), answers, score: scoreOf(answers), kind: post ? 'sau' : 'thường', programId: post ? post.id : null };
  S.assessments.push(a);
  if (post) { post.postId = a.id; post.status = 'done'; postFor = null; }
  save();
  const li = levelIdx(a.score), L = LEVELS[li], C = COLOR[L.color];
  const pre = post && assessById(post.preId);
  let actions = '';
  if (li === 2) actions = `<button onclick="startPlan(21)" class="px-4 py-2 ${C.btn} text-white text-xs font-semibold rounded-lg">Bắt Đầu Lộ Trình Detox 21 Ngày</button>
    <button onclick="alert('Hãy liên hệ Phòng Tư Vấn Tâm Lý Học Đường THCS Nguyễn Tất Thành hoặc Giáo Viên Chủ Nhiệm để được đồng hành hỗ trợ!')" class="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900">Liên Hệ Tư Vấn Tâm Lý</button>`;
  else actions = `<button onclick="startPlan(${L.days})" class="px-4 py-2 ${C.btn} text-white text-xs font-semibold rounded-lg">${li === 0 ? 'Duy trì' : 'Kích Hoạt'} Lộ Trình Detox ${L.days} Ngày</button>`;
  actions += `<button onclick="switchTab(5)" class="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50">Xem tiến độ</button>`;
  const box = $('#resultBox');
  box.className = `mt-8 p-6 rounded-2xl border ${C.box} animate-fade-in`;
  box.innerHTML = `<div class="flex items-start gap-4">
    <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shrink-0 shadow-md ${C.icon}"><i class="fa-solid ${L.icon}"></i></div>
    <div class="flex-grow">
      <div class="flex items-center justify-between flex-wrap gap-2"><h3 class="text-xl font-bold ${C.title}">${L.title}</h3><span class="px-3 py-1 rounded-full text-xs font-bold text-white ${C.badge}">Điểm: ${a.score}/${MAXSCORE}</span></div>
      <p class="text-sm mt-2 leading-relaxed text-slate-700">${L.desc}</p>
      ${pre ? `<div class="mt-4 p-3 bg-white/70 rounded-xl border border-slate-200"><h4 class="font-bold text-sm mb-1">So sánh với trước lộ trình</h4>${compareHtml(pre, a)}</div>` : ''}
      <p class="text-xs text-slate-500 mt-3"><i class="fa-solid fa-floppy-disk mr-1"></i> Kết quả đã được lưu vào lịch sử trên thiết bị này.</p>
      <div class="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap gap-3">${actions}</div>
    </div></div>`;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ======================= MODULE 3: LỘ TRÌNH ======================= */
function startPlan(days) {
  const cur = activeProgram();
  if (cur && cur.days === days) { planPick = days; switchTab(3); return; }
  if (cur && !confirm(`Bạn đang thực hiện lộ trình ${cur.days} ngày. Bắt đầu lộ trình ${days} ngày sẽ dừng lộ trình đó. Tiếp tục?`)) return;
  if (cur) cur.status = cur.days <= checkedCount(cur) ? 'done' : 'stopped';
  const last = lastAssess();
  S.programs.push({ id: uid(), days, start: today(), checks: {}, status: 'active', preId: last ? last.id : null, postId: null });
  save(); planPick = days; switchTab(3);
  if (!last) toast('Bạn chưa làm trắc nghiệm nên chưa có điểm gốc để so sánh sau lộ trình.');
}
function pickPlan(d) { planPick = d; refresh(); }
function toggleDay(day, on) {
  const p = activeProgram(); if (!p) return;
  p.checks[day] = on ? today() : null; save(); refresh();
}
function stopPlan() {
  const p = activeProgram();
  if (!p || !confirm('Dừng lộ trình hiện tại? Lịch sử vẫn được giữ lại.')) return;
  p.status = checkedCount(p) >= p.days ? 'done' : 'stopped'; save(); refresh();
}
function startPost(id) { postFor = id; switchTab(2); }

function render3() {
  const act = activeProgram(), last = lastAssess();
  const sel = planPick || (act ? act.days : last ? LEVELS[levelIdx(last.score)].days : 7);
  const mine = act && act.days === sel ? act : null;
  const plan = PLANS[sel];
  const cur = mine ? currentDay(mine) : 0;
  const pcent = mine ? pct(mine) : 0;
  const unfinished = S.programs.filter(p => p.status !== 'active' && !p.postId && checkedCount(p) >= p.days)[0] || (mine && checkedCount(mine) >= mine.days ? mine : null);
  const list = plan.tasks.map((t, i) => {
    const day = i + 1, on = mine && mine.checks[day], lock = !mine || day > cur;
    return `<label class="flex items-start gap-3 p-3 rounded-xl border transition ${on ? 'bg-emerald-50 border-emerald-300' : day === cur ? 'bg-teal-50/60 border-teal-400' : 'bg-slate-50 border-slate-200/70'} ${lock ? 'opacity-60' : 'cursor-pointer hover:bg-slate-100'}">
      <input type="checkbox" ${on ? 'checked' : ''} ${lock ? 'disabled' : ''} onchange="toggleDay(${day}, this.checked)" class="mt-1 h-4 w-4 accent-teal-600">
      <span class="text-sm text-slate-700 leading-snug"><b>Ngày ${day}${day === cur ? ' · hôm nay' : ''}:</b> ${esc(t)}</span></label>`;
  }).join('');
  const startBox = mine ? '' : `<div class="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-900 flex items-center justify-between flex-wrap gap-2">
      <span>${act ? `Bạn đang ở lộ trình ${act.days} ngày.` : 'Đây là bản xem trước.'} Bắt đầu để lưu tiến độ từng ngày.</span>
      <button onclick="startPlan(${sel})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg">Bắt đầu lộ trình ${sel} ngày</button></div>`;
  const post = unfinished ? `<div class="mb-4 p-4 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 text-white flex items-center justify-between flex-wrap gap-2">
      <span class="text-sm"><b>🎉 Hoàn thành lộ trình ${unfinished.days} ngày!</b> Làm trắc nghiệm lần nữa để xem chuyển biến.</span>
      <button onclick="startPost('${unfinished.id}')" class="px-4 py-2 bg-white text-teal-700 text-xs font-semibold rounded-lg">Làm khảo sát sau lộ trình</button></div>` : '';
  const now = new Date();
  $('#module-3').innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-1 space-y-6">
      <div class="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg text-center relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 opacity-10"><i class="fa-solid fa-bed text-9xl text-indigo-300"></i></div>
        <span class="bg-indigo-800/80 text-indigo-200 text-xs px-3 py-1 rounded-full border border-indigo-700">Đồng Hồ Nhắc Nhở Đêm</span>
        <h3 class="font-bold text-lg mt-3">Mốc Thời Gian Rời Màn Hình</h3>
        <div class="my-6"><div id="countdownDisplay" class="text-4xl font-extrabold tracking-wider text-teal-300 font-mono">-- : -- : --</div>
          <p class="text-xs text-indigo-200/70 mt-1">Khuyên dùng: Tắt thiết bị trước 21h30 mỗi tối</p></div>
        <button onclick="toggleReminder()" class="w-full py-2.5 ${S.reminder ? 'bg-rose-500 hover:bg-rose-600' : 'bg-teal-500 hover:bg-teal-600'} text-white font-semibold rounded-xl text-sm transition">
          <i class="fa-solid ${S.reminder ? 'fa-bell-slash' : 'fa-bell'} mr-1"></i> ${S.reminder ? 'Đang Bật Nhắc Nhở (Tắt)' : 'Kích Hoạt Cảnh Báo Nhắc Nhở'}</button>
        <p class="text-[11px] text-indigo-200/60 mt-2">Nhắc nhở hoạt động khi ứng dụng đang mở.</p>
      </div>
      <div class="${card}"><h3 class="font-bold text-slate-800 text-lg mb-3">Chọn Lộ Trình Detox</h3><div class="space-y-3">${[7, 14, 21].map(d => `
        <label class="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition ${d === sel ? 'border-teal-500 bg-teal-50/30' : 'border-slate-200'}">
          <input type="radio" name="detoxPlan" ${d === sel ? 'checked' : ''} onclick="pickPlan(${d})" class="accent-teal-600">
          <div class="ml-3"><span class="font-semibold text-slate-800 text-sm block">Lộ trình ${d} Ngày (${PLANS[d].sub})${act && act.days === d ? ' • đang thực hiện' : ''}</span><span class="text-xs text-slate-500">${PLANS[d].who}</span></div></label>`).join('')}</div>
        ${last ? `<p class="text-xs text-slate-500 mt-3">Điểm gần nhất ${last.score}/${MAXSCORE} ${lvBadge(last.score)}: gợi ý ${LEVELS[levelIdx(last.score)].days} ngày.</p>` : `<p class="text-xs text-slate-500 mt-3">Chưa có điểm. <a href="#2" class="text-teal-600 font-semibold">Làm trắc nghiệm</a> để nhận gợi ý.</p>`}
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
      ${mine ? '<button onclick="stopPlan()" class="mt-4 px-3 py-1.5 border border-slate-300 text-slate-600 text-xs rounded-lg hover:bg-slate-50">Dừng lộ trình</button>' : ''}
    </div></div>`;
  tickCountdown();
}

/* Đồng hồ đếm ngược đến 21h30 */
let lastRem = 0;
function tickCountdown() {
  const now = new Date(), t = new Date(now);
  t.setHours(REMIND_H, REMIND_M, 0, 0);
  if (t <= now) t.setDate(t.getDate() + 1);
  const rem = t - now;
  if (S.reminder && lastRem && rem > lastRem + 5000) fireReminder();
  lastRem = rem;
  const el = $('#countdownDisplay');
  if (el) { const s = Math.floor(rem / 1000); el.textContent = `${pad(Math.floor(s / 3600))} : ${pad(Math.floor(s % 3600 / 60))} : ${pad(s % 60)}`; }
}
setInterval(tickCountdown, 1000);
function fireReminder() {
  toast('🌙 Đến giờ rời màn hình! Hãy tắt thiết bị để ngủ ngon.');
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification('FOMO DETOX KIT', { body: 'Đến giờ rời màn hình rồi. Chúc bạn ngủ ngon!' }); } catch (e) { /* bỏ qua */ }
}
function toggleReminder() {
  S.reminder = !S.reminder; save();
  if (S.reminder) {
    toast('Đã bật nhắc nhở vào 21h30 mỗi tối (khi ứng dụng đang mở).');
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }
  refresh();
}

/* ======================= MODULE 4: ÂM THANH ======================= */
const AU = { ctx: null, master: null, nodes: [], key: null, playing: false, vol: 0.5, timerMin: 0, timer: null, endAt: 0, startedAt: 0 };
function noiseBuffer(ctx, kind) {
  const n = ctx.sampleRate * 3, buf = ctx.createBuffer(1, n, ctx.sampleRate), o = buf.getChannelData(0);
  if (kind === 'white') { for (let i = 0; i < n; i++) o[i] = Math.random() * 2 - 1; }
  else { // pink noise (Paul Kellet)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
      b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
      o[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
    }
  }
  return buf;
}
function buildSound(ctx, out, key) {
  const add = n => { AU.nodes.push(n); return n; };
  const osc = (type, f, dest, pan) => {
    const o = add(ctx.createOscillator()); o.type = type; o.frequency.value = f;
    if (!dest) { /* dao động điều biến (LFO), nối thủ công */ }
    else if (pan != null) { const p = ctx.createStereoPanner(); p.pan.value = pan; o.connect(p); p.connect(dest); } else o.connect(dest);
    o.start(); return o;
  };
  const noise = (kind, dest) => { const s = add(ctx.createBufferSource()); s.buffer = noiseBuffer(ctx, kind); s.loop = true; s.connect(dest); s.start(); return s; };
  if (key === 'alpha') { osc('sine', 200, out, -1); osc('sine', 210, out, 1); }
  else if (key === 'theta') { osc('sine', 120, out, -1); osc('sine', 126, out, 1); }
  else if (key === 'rain') {
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000;
    hp.connect(lp); lp.connect(out); noise('white', hp);
  } else if (key === 'ocean') {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const swell = ctx.createGain(); swell.gain.value = .6;
    const lfo = osc('sine', .1, null);
    const depth = ctx.createGain(); depth.gain.value = .4; lfo.connect(depth); depth.connect(swell.gain);
    lp.connect(swell); swell.connect(out); noise('pink', lp);
  } else if (key === 'lofi') {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.connect(out);
    const pad = ctx.createGain(); pad.gain.value = .35; pad.connect(lp);
    [130.81, 164.81, 196, 246.94].forEach((f, i) => {
      const o = osc('triangle', f, pad), l = osc('sine', .07 + i * .03, null);
      const d = ctx.createGain(); d.gain.value = 8; l.connect(d); d.connect(o.detune);
    });
  }
}
function selectSound(key) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { toast('Trình duyệt không hỗ trợ phát âm thanh.'); return; }
  stopSound(true);
  if (!AU.ctx) AU.ctx = new AC();
  const ctx = AU.ctx; ctx.resume();
  AU.master = ctx.createGain(); AU.master.gain.value = 0; AU.master.connect(ctx.destination);
  buildSound(ctx, AU.master, key);
  AU.master.gain.linearRampToValueAtTime(AU.vol, ctx.currentTime + 2);
  Object.assign(AU, { key, playing: true, startedAt: Date.now() });
  setAudioTimer(true);
  renderPlayer();
}
function stopSound(silent) {
  if (!AU.key) return;
  const sec = Math.round((Date.now() - AU.startedAt) / 1000);
  if (sec >= 30) { S.audio.push({ date: new Date().toISOString(), sound: AU.key, seconds: sec }); save(); }
  const ctx = AU.ctx, nodes = AU.nodes, m = AU.master;
  try { m.gain.cancelScheduledValues(ctx.currentTime); m.gain.setValueAtTime(m.gain.value, ctx.currentTime); m.gain.linearRampToValueAtTime(0, ctx.currentTime + .4); } catch (e) { /* bỏ qua */ }
  setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch (e) { /* bỏ qua */ } }); try { m.disconnect(); } catch (e) { /* bỏ qua */ } }, 500);
  clearTimeout(AU.timer);
  Object.assign(AU, { nodes: [], key: null, playing: false, master: null, endAt: 0 });
  if (!silent) renderPlayer();
}
function toggleAudioPlay() {
  if (!AU.key) { selectSound('alpha'); return; }
  if (AU.playing) { AU.ctx.suspend(); AU.playing = false; } else { AU.ctx.resume(); AU.playing = true; }
  renderPlayer();
}
function changeVolume(v) {
  AU.vol = parseFloat(v);
  if (AU.master) AU.master.gain.value = AU.vol;
}
function setAudioTimer(keep) {
  const sel = $('#sleepTimerSelect');
  if (!keep && sel) AU.timerMin = parseInt(sel.value);
  clearTimeout(AU.timer);
  if (AU.timerMin > 0 && AU.key) {
    AU.endAt = Date.now() + AU.timerMin * 60000;
    AU.timer = setTimeout(() => { stopSound(); toast(`Đã hết ${AU.timerMin} phút hẹn giờ. Âm thanh tự động tắt để bạn ngủ ngon!`); }, AU.timerMin * 60000);
  } else AU.endAt = 0;
}
function renderPlayer() {
  const s = SOUNDS[AU.key];
  const w = $('#playerWrap'); if (!w) return;
  w.classList.toggle('paused', !AU.playing);
  $('#currentAudioIcon').className = `fa-solid ${s ? s.icon : 'fa-water'} text-3xl text-white`;
  $('#currentAudioTitle').textContent = s ? s.name : 'Chưa chọn âm thanh';
  $('#currentAudioDesc').textContent = s ? s.desc : 'Nhấn vào danh sách bên dưới để bắt đầu phát';
  $('#playPauseBtn').innerHTML = AU.playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play ml-1"></i>';
}
function render4() {
  const total = Math.round(S.audio.reduce((a, b) => a + b.seconds, 0) / 60);
  const lib = [['alpha', 'teal', 'Thư giãn não bộ sau giờ học'], ['theta', 'indigo', 'Dẫn dắt vào giấc ngủ sâu'], ['rain', 'sky', 'Xoa dịu tiếng ồn xung quanh'], ['ocean', 'emerald', 'Tần số nhịp nhàng dịu êm'], ['lofi', 'amber', 'Giai điệu chậm dưới 60BPM']];
  const LC = {
    teal: 'hover:border-teal-500 hover:bg-teal-50/50|bg-teal-100 text-teal-600', indigo: 'hover:border-indigo-500 hover:bg-indigo-50/50|bg-indigo-100 text-indigo-600',
    sky: 'hover:border-sky-500 hover:bg-sky-50/50|bg-sky-100 text-sky-600', emerald: 'hover:border-emerald-500 hover:bg-emerald-50/50|bg-emerald-100 text-emerald-600',
    amber: 'hover:border-amber-500 hover:bg-amber-50/50|bg-amber-100 text-amber-600'
  };
  $('#module-4').innerHTML = `<div class="${card} sm:p-8">
    <div class="max-w-3xl mx-auto text-center">
      <span class="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full uppercase">Liệu Pháp Âm Thanh Khoa Học</span>
      <h2 class="text-2xl font-bold text-slate-800 mt-2">Trình Phát Âm Thanh Làm Dịu Sóng Não</h2>
      <p class="text-slate-500 text-sm mt-1">Chuyển đổi trạng thái sóng não từ Beta (căng thẳng) về Alpha/Theta (thư giãn sâu, chuẩn bị giấc ngủ) bằng tần số âm thanh tổng hợp. Đeo tai nghe hai bên để nghe rõ sóng Alpha/Theta.</p>
    </div>
    <div id="playerWrap" class="max-w-2xl mx-auto mt-8 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"><div class="flex flex-col items-center text-center">
      <div class="w-24 h-24 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center pulse-animation mb-4 shadow-lg shadow-teal-500/20"><i id="currentAudioIcon" class="fa-solid fa-water text-3xl text-white"></i></div>
      <h3 id="currentAudioTitle" class="text-xl font-bold text-white"></h3><p id="currentAudioDesc" class="text-xs text-slate-400 mt-1"></p>
      <div class="flex items-center gap-6 my-6"><button onclick="toggleAudioPlay()" id="playPauseBtn" aria-label="Phát hoặc tạm dừng" class="w-16 h-16 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-full flex items-center justify-center text-2xl font-bold transition shadow-lg"></button>
        <button onclick="stopSound()" aria-label="Dừng" class="w-11 h-11 bg-slate-700 hover:bg-slate-600 rounded-full text-sm"><i class="fa-solid fa-stop"></i></button></div>
      <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
        <div class="flex items-center justify-center gap-2"><i class="fa-solid fa-clock text-teal-400"></i><span>Hẹn giờ tắt:</span>
          <select id="sleepTimerSelect" onchange="setAudioTimer()" class="bg-slate-800 text-white rounded border border-slate-700 px-2 py-1">${[[0, 'Tắt hẹn giờ'], [15, '15 phút'], [30, '30 phút'], [45, '45 phút']].map(o => `<option value="${o[0]}" ${AU.timerMin === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
        <div class="flex items-center justify-center gap-2"><i class="fa-solid fa-volume-high text-teal-400"></i><span>Âm lượng:</span>
          <input type="range" min="0" max="1" step="0.05" value="${AU.vol}" oninput="changeVolume(this.value)" class="w-24 accent-teal-500"></div>
      </div></div></div>
    <div class="max-w-3xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">${lib.map(l => {
      const c = LC[l[1]].split('|'), s = SOUNDS[l[0]];
      return `<button onclick="selectSound('${l[0]}')" class="p-4 rounded-xl border border-slate-200 ${c[0]} text-left transition flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg ${c[1]} flex items-center justify-center text-lg shrink-0"><i class="fa-solid ${s.icon}"></i></div>
        <div><h4 class="font-bold text-sm text-slate-800">${s.name}</h4><p class="text-xs text-slate-500">${l[2]}</p></div></button>`;
    }).join('')}</div>
    <p class="text-center text-xs text-slate-400 mt-6">Đã nghe ${S.audio.length} lần • ${total} phút. Âm thanh chỉ hỗ trợ thư giãn, không thay thế điều trị.</p>
  </div>`;
  renderPlayer();
}

/* ======================= MODULE 5: TIẾN ĐỘ, BADGE, GÓC CHIA SẺ ======================= */
function badges() {
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
const BCLS = {
  teal: 'bg-teal-50 border-teal-200 text-teal-800|text-teal-600', indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800|text-indigo-600',
  amber: 'bg-amber-50 border-amber-200 text-amber-800|text-amber-600', rose: 'bg-rose-50 border-rose-200 text-rose-800|text-rose-600'
};
function progressCard() {
  const list = sortedAssess();
  if (!list.length) return `<div class="${card}"><h3 class="font-bold text-xl text-slate-800 mb-1">Tiến Trình &amp; Phân Tích</h3><p class="text-sm text-slate-500">Chưa có dữ liệu. <button onclick="switchTab(2)" class="text-teal-600 font-semibold">Làm trắc nghiệm đầu tiên</button> để bắt đầu theo dõi.</p></div>`;
  const first = list[0], last = list[list.length - 1];
  const overall = list.length > 1 ? `<div class="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200"><h4 class="font-bold text-sm mb-1">Từ lần đầu đến nay</h4>${compareHtml(first, last)}</div>` : '';
  const progs = S.programs.slice().reverse().map(p => {
    const pre = assessById(p.preId), post = p.postId && assessById(p.postId);
    const st = p.status === 'active' ? 'đang thực hiện' : p.status === 'done' ? 'đã xong' : 'đã dừng';
    return `<div class="mt-3 p-4 border border-slate-200 rounded-xl"><h4 class="font-bold text-sm">Lộ trình ${p.days} ngày • ${fmtDate(p.start)}</h4>
      <p class="text-xs text-slate-500 mb-2">Hoàn thành ${checkedCount(p)}/${p.days} ngày (${pct(p)}%) • ${st}</p>
      ${pre && post ? compareHtml(pre, post) : `<p class="text-xs text-slate-500">${pre ? 'Chưa có khảo sát sau lộ trình.' : 'Không có điểm gốc trước lộ trình.'}</p>${pre && !post && (checkedCount(p) >= p.days || p.status !== 'active') ? `<button onclick="startPost('${p.id}')" class="mt-2 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg">Làm khảo sát sau</button>` : ''}`}</div>`;
  }).join('');
  const rows = list.slice().reverse().map(a => `<tr class="border-t border-slate-100"><td class="py-1.5">${fmtDate(a.date)}</td><td>${a.kind}</td><td class="font-semibold">${a.score}/${MAXSCORE}</td><td>${lvBadge(a.score)}</td></tr>`).join('');
  return `<div class="${card}"><h3 class="font-bold text-xl text-slate-800 mb-1">Tiến Trình &amp; Phân Tích</h3>
    <p class="text-xs text-slate-500 mb-3">Điểm càng thấp càng tốt. Vùng xanh: nhẹ (≤18), vàng: trung bình (19–28), đỏ: cao (≥29).</p>
    <div class="max-w-xl">${lineChart(list)}</div>${overall}${progs}
    <h4 class="font-bold text-sm mt-5 mb-1">Lịch sử trắc nghiệm</h4>
    <div class="overflow-x-auto"><table class="w-full text-sm text-left"><tr class="text-xs text-slate-500"><th class="py-1">Ngày</th><th>Loại</th><th>Điểm</th><th>Mức</th></tr>${rows}</table></div></div>`;
}
function render5() {
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
    <p class="text-xs text-slate-500 mb-6">Nơi học sinh THCS Nguyễn Tất Thành trải lòng về áp lực FOMO &amp; lan tỏa động lực Detox. Bài viết chỉ lưu trên thiết bị này và không nằm trong file nộp giáo viên.</p>
    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
      <textarea id="confessionInput" rows="3" maxlength="1500" class="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Viết chia sẻ hoặc trải nghiệm của bạn tại đây... (Hệ thống tự động ẩn danh)"></textarea>
      <div class="flex justify-between items-center mt-3"><span class="text-xs text-slate-400"><i class="fa-solid fa-user-secret mr-1"></i> Luôn bảo mật danh tính</span>
        <button onclick="postConfession()" class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"><i class="fa-solid fa-paper-plane mr-1"></i> Gửi Chia Sẻ</button></div></div>
    <div class="space-y-4">${S.posts.slice().reverse().map(p => `
      <div class="p-4 rounded-xl border border-teal-100 bg-teal-50/40"><div class="flex justify-between items-center mb-2">
        <span class="text-xs font-bold text-teal-700"><i class="fa-solid fa-user-ninja mr-1"></i> Bạn • Ẩn danh</span>
        <span class="text-[11px] text-slate-400">${fmtDate(p.date)} <button onclick="delPost('${p.id}')" class="ml-2 text-rose-500" aria-label="Xóa"><i class="fa-solid fa-trash-can"></i></button></span></div>
        <p class="text-sm text-slate-700" style="white-space:pre-wrap">${esc(p.text)}</p></div>`).join('')}
      ${SAMPLE_POSTS.map(p => `<div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50"><div class="flex justify-between items-center mb-2">
        <span class="text-xs font-bold ${p.col}"><i class="fa-solid fa-user-ninja mr-1"></i> ${p.who}</span><span class="text-[11px] text-slate-400">${p.when}</span></div>
        <p class="text-sm text-slate-700">${p.text}</p></div>`).join('')}</div>
  </div>`;
}
function postConfession() {
  const input = $('#confessionInput'), text = input.value.trim();
  if (!text) { toast('Vui lòng nhập nội dung trước khi gửi!'); return; }
  if (FORBIDDEN.some(w => text.toLowerCase().includes(w))) { toast('Nội dung chứa từ ngữ không phù hợp. Vui lòng giữ môi trường văn minh!'); return; }
  S.posts.push({ id: uid(), date: today(), text }); save(); refresh(); toast('Chia sẻ của bạn đã được lưu.');
}
function delPost(id) {
  if (!confirm('Xóa chia sẻ này?')) return;
  S.posts = S.posts.filter(p => p.id !== id); save(); refresh();
}

/* ======================= MODULE 6: HỒ SƠ & DỮ LIỆU ======================= */
function teacherPayload() {
  return { app: 'FOMO_DETOX_KIT', version: 2, exported: new Date().toISOString(), profile: S.profile, assessments: S.assessments, programs: S.programs };
}
function assessRows() {
  const rows = [['ma_hs', 'ten', 'lop', 'ngay', 'loai', 'tong_diem_10_40', 'muc', 'lo_trinh_ngay', ...Q.map((_, i) => 'c' + (i + 1))]];
  sortedAssess().forEach(a => {
    const pr = a.programId && S.programs.find(p => p.id === a.programId);
    rows.push([S.profile.code, S.profile.name, S.profile.cls, a.date.slice(0, 10), a.kind, a.score, LEVELS[levelIdx(a.score)].short, pr ? pr.days : '', ...a.answers]);
  });
  return rows;
}
const inp = 'w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
const bt = 'px-4 py-2 text-white text-sm font-semibold rounded-lg transition';
function render6() {
  $('#module-6').innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="${card}"><h3 class="font-bold text-lg mb-3"><i class="fa-solid fa-id-card text-teal-600 mr-1"></i> Hồ sơ</h3>
      <label class="block text-xs font-semibold text-slate-600 mb-1">Mã học sinh</label><input id="pcode" class="${inp} mb-3" value="${esc(S.profile.code)}">
      <label class="block text-xs font-semibold text-slate-600 mb-1">Họ tên (không bắt buộc)</label><input id="pname" class="${inp} mb-3" value="${esc(S.profile.name)}">
      <label class="block text-xs font-semibold text-slate-600 mb-1">Lớp</label><input id="pcls" class="${inp} mb-3" value="${esc(S.profile.cls)}">
      <button onclick="saveProfile()" class="${bt} bg-teal-600 hover:bg-teal-700">Lưu hồ sơ</button></div>
    <div class="${card}"><h3 class="font-bold text-lg mb-1"><i class="fa-solid fa-file-export text-indigo-600 mr-1"></i> Nộp kết quả cho giáo viên</h3>
      <p class="text-xs text-slate-500 mb-3">File gồm điểm trắc nghiệm và tiến độ lộ trình. Không gồm Góc Ẩn Danh.</p>
      <div class="flex gap-2 flex-wrap"><button onclick="exportCsv()" class="${bt} bg-indigo-600 hover:bg-indigo-700">Xuất CSV</button><button onclick="exportJson()" class="${bt} bg-indigo-600 hover:bg-indigo-700">Xuất JSON</button></div>
      <h3 class="font-bold text-lg mt-6 mb-1"><i class="fa-solid fa-database text-amber-600 mr-1"></i> Sao lưu &amp; khôi phục</h3>
      <p class="text-xs text-slate-500 mb-3">Dữ liệu nằm trên thiết bị này. Xóa dữ liệu trình duyệt hoặc đổi máy sẽ mất, nên hãy sao lưu định kỳ.</p>
      <div class="flex gap-2 flex-wrap items-center"><button onclick="backup()" class="${bt} bg-amber-600 hover:bg-amber-700">Tải bản sao lưu</button>
        <label class="${bt} bg-slate-700 hover:bg-slate-800 cursor-pointer">Khôi phục<input type="file" accept=".json" hidden onchange="restore(this.files[0])"></label>
        <button onclick="wipe()" class="${bt} bg-rose-600 hover:bg-rose-700">Xóa toàn bộ dữ liệu</button></div></div>
    <div class="${card} lg:col-span-2"><h3 class="font-bold text-lg mb-1"><i class="fa-solid fa-chalkboard-user text-teal-600 mr-1"></i> Dành cho giáo viên</h3>
      <p class="text-xs text-slate-500 mb-3">Chọn nhiều file JSON do học sinh nộp để xem tổng hợp lớp. Dữ liệu chỉ xử lý trên máy này, không gửi đi đâu.</p>
      <input type="file" accept=".json" multiple onchange="teacherImport(this.files)" class="text-sm"><div id="tout" class="mt-4"></div></div>
  </div>`;
}
function saveProfile() {
  S.profile.code = $('#pcode').value.trim() || S.profile.code; S.profile.name = $('#pname').value.trim(); S.profile.cls = $('#pcls').value.trim();
  save(); toast('Đã lưu hồ sơ.');
}
const exportCsv = () => download(`fomo-${S.profile.code}.csv`, toCsv(assessRows()), 'text/csv');
const exportJson = () => download(`fomo-${S.profile.code}.json`, JSON.stringify(teacherPayload(), null, 1));
const backup = () => download(`fomo-sao-luu-${today()}.json`, JSON.stringify(S, null, 1));
function wipe() {
  if (!confirm('Xóa toàn bộ dữ liệu trên thiết bị? Không thể hoàn tác.')) return;
  if (!confirm('Chắc chắn xóa? Hãy tải bản sao lưu trước nếu cần.')) return;
  S = blank(); save(); toast('Đã xóa dữ liệu.'); render6();
}
function restore(f) {
  if (!f) return;
  f.text().then(t => {
    const d = JSON.parse(t);
    if (!d || !Array.isArray(d.assessments) || !d.profile) throw new Error('bad');
    if (!confirm('Khôi phục sẽ thay thế dữ liệu hiện tại. Tiếp tục?')) return;
    S = Object.assign(blank(), d); save(); toast('Đã khôi phục.'); render6();
  }).catch(() => toast('File sao lưu không hợp lệ.'));
}
function teacherImport(files) {
  Promise.all([...files].map(f => f.text().then(t => { try { return JSON.parse(t); } catch (e) { return null; } }))).then(all => {
    const data = all.filter(d => d && d.app === 'FOMO_DETOX_KIT' && Array.isArray(d.assessments) && d.profile);
    const out = $('#tout');
    if (!data.length) { out.innerHTML = '<p class="text-sm text-rose-600">Không có file hợp lệ. Hãy chọn file JSON do học sinh xuất (Nộp kết quả cho giáo viên).</p>'; return; }
    const head = ['Mã HS', 'Tên', 'Lớp', 'Số lần KS', 'Điểm đầu', 'Điểm gần nhất', 'Thay đổi', 'Lộ trình', '% hoàn thành'];
    const rows = data.map(d => {
      const as = d.assessments.slice().sort(byDate), f = as[0], l = as[as.length - 1];
      const p = (d.programs || []).slice(-1)[0];
      return [d.profile.code, d.profile.name, d.profile.cls, as.length, f ? f.score : '', l ? l.score : '', f && as.length > 1 ? l.score - f.score : '',
        p ? p.days + ' ngày' : '', p ? Math.round(Object.keys(p.checks).filter(k => p.checks[k]).length / p.days * 100) : ''];
    });
    const v = rows.filter(r => r[6] !== '');
    const avg = v.length ? (v.reduce((a, r) => a + r[6], 0) / v.length).toFixed(1) : 'n/a';
    out.innerHTML = `<p class="text-sm mb-2">${rows.length} học sinh. Thay đổi điểm trung bình (HS có từ 2 lần trắc nghiệm): <b>${avg}</b></p>
      <div class="overflow-x-auto"><table class="w-full text-sm text-left"><tr class="text-xs text-slate-500">${head.map(h => `<th class="py-1 pr-3">${h}</th>`).join('')}</tr>
      ${rows.map(r => `<tr class="border-t border-slate-100">${r.map(c => `<td class="py-1.5 pr-3">${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>
      <button id="tall" class="${bt} bg-teal-600 hover:bg-teal-700 mt-3">Tải CSV tổng hợp</button>`;
    $('#tall').onclick = () => download('fomo-tong-hop-lop.csv', toCsv([head, ...rows]), 'text/csv');
  });
}

/* ======================= KHỞI ĐỘNG ======================= */
const RENDER = { 1: render1, 2: render2, 3: render3, 4: render4, 5: render5, 6: render6 };
window.addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1)); show(n >= 1 && n <= 6 ? n : 1); });
{
  const n = parseInt(location.hash.slice(1));
  show(n >= 1 && n <= 6 ? n : 1);
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
