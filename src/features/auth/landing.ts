import { LEVELS } from '../quiz/content';
import { GROUPS } from '../quiz/content';
import { registerActions } from '../../lib/actions';

// Trang giới thiệu nghiên cứu cho người chưa đăng nhập. Chỉ mô tả những gì app thực sự làm;
// không đưa số liệu kết quả vào đây khi nghiên cứu chưa có kết quả chính thức.

const section = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';
const eyebrow = 'text-xs font-bold uppercase tracking-widest text-teal-600';
const h2 = 'text-2xl sm:text-3xl font-bold text-slate-900 mt-2';

const CONTEXT = [
  ['fa-ghost', 'FOMO', 'Nỗi sợ bỏ lỡ thông tin, xu hướng của bạn bè khiến nhiều học sinh liên tục kiểm tra điện thoại, kể cả vào ban đêm.'],
  ['fa-moon', 'Giấc ngủ', 'Dùng màn hình sát giờ ngủ có thể làm chậm giấc ngủ, khiến các em ngủ ít hơn và dậy mệt mỏi.'],
  ['fa-graduation-cap', 'Học tập', 'Thiếu ngủ ảnh hưởng đến khả năng tập trung và ghi nhớ trong giờ học.']
];

const STEPS = [
  ['Khảo sát đầu vào', `Bảng hỏi 10 câu, thang 4 mức, tổng điểm 10–40, chia ${GROUPS.length} nhóm: ${GROUPS.map(g => g.name.toLowerCase()).join(', ')}.`],
  ['Phân loại & gợi ý', `Mức Nhẹ (≤${LEVELS[0].max}), Trung bình (${LEVELS[0].max + 1}–${LEVELS[1].max}), Cao (≥${LEVELS[1].max + 1}); gợi ý lộ trình ${LEVELS.map(l => l.days).join(' / ')} ngày tương ứng.`],
  ['Can thiệp', 'Học sinh thực hiện nhiệm vụ detox mỗi ngày, kết hợp cẩm nang kiến thức, nhắc giờ rời màn hình 21h30 và âm thanh thư giãn.'],
  ['Khảo sát sau & so sánh', 'Làm lại bảng hỏi khi kết thúc lộ trình; hệ thống so sánh điểm trước và sau theo từng nhóm câu hỏi và từng câu.']
];

const MODULES = [
  ['fa-book-open', 'Cẩm Nang Số', 'Kiến thức về FOMO, giấc ngủ và các tình huống thường gặp.'],
  ['fa-clipboard-question', 'Trắc Nghiệm', 'Tự đánh giá mức độ, xem kết quả và lịch sử.'],
  ['fa-calendar-check', 'Lộ Trình Detox', 'Nhiệm vụ 7, 14 hoặc 21 ngày, đánh dấu tiến độ từng ngày.'],
  ['fa-headphones', 'Âm Thanh', 'Tiếng ồn nền và nhịp phách giúp thư giãn trước khi ngủ.'],
  ['fa-chart-line', 'Tiến Trình', 'Biểu đồ điểm, huy hiệu và góc chia sẻ riêng tư.'],
  ['fa-chalkboard-user', 'Giáo Viên', 'Theo dõi tiến độ của lớp để đồng hành cùng học sinh.']
];

const ETHICS = [
  ['fa-stethoscope', 'Công cụ sàng lọc để tự theo dõi, không phải chẩn đoán y khoa. Kết quả mức Cao kèm thông tin nơi tìm hỗ trợ.'],
  ['fa-user-lock', 'Điểm và tiến độ chỉ giáo viên của lớp và quản trị viên nhà trường xem được; quyền do máy chủ kiểm soát.'],
  ['fa-user-secret', 'Bài ở Góc Ẩn Danh chỉ người viết đọc được trong app, kể cả giáo viên và quản trị viên cũng không xem.'],
  ['fa-file-signature', 'Bảng hỏi do nhóm tự xây dựng, tham khảo thang FOMO-S và PSQI. Sử dụng khi có sự đồng ý của nhà trường và phụ huynh.']
];

export function landingHtml(authCard: string) {
  return `<div class="bg-slate-50 text-slate-800">
  <section class="bg-gradient-to-br from-teal-700 via-teal-600 to-indigo-700 text-white">
    <div class="${section} py-10 sm:py-16 grid lg:grid-cols-[1fr_minmax(0,420px)] gap-10 items-center">
      <div>
        <div class="flex items-center gap-3 mb-6">
          <div class="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><i class="fa-solid fa-brain text-xl text-teal-100"></i></div>
          <span class="font-bold tracking-tight text-lg">FOMO DETOX KIT</span>
        </div>
        <span class="inline-block bg-white/15 border border-white/20 text-teal-50 text-xs font-semibold px-3 py-1 rounded-full">Dự án Khoa học Kỹ thuật • Khoa học Xã hội &amp; Hành vi</span>
        <h1 class="text-3xl sm:text-5xl font-extrabold leading-tight mt-4">Giảm FOMO, ngủ ngon hơn, học tốt hơn</h1>
        <p class="text-teal-50/90 text-base sm:text-lg mt-4 max-w-xl leading-relaxed">Giải pháp số can thiệp hội chứng sợ bỏ lỡ (FOMO) và cải thiện chất lượng giấc ngủ cho học sinh THCS, đo lường bằng khảo sát trước và sau lộ trình detox kỹ thuật số.</p>
        <p class="text-sm text-teal-100/80 mt-3"><i class="fa-solid fa-school mr-1"></i> Trường THCS Nguyễn Tất Thành, Thái Nguyên</p>
        <div class="flex flex-wrap gap-3 mt-7">
          <button data-click="landingGo" data-arg="method" class="px-5 py-2.5 bg-white text-teal-700 font-semibold text-sm rounded-xl shadow hover:bg-teal-50 transition">Xem phương pháp</button>
        </div>
      </div>
      <div id="authCard" class="bg-white text-slate-800 rounded-2xl shadow-2xl p-6 scroll-mt-4">${authCard}</div>
    </div>
  </section>

  <section class="${section} py-14">
    <p class="${eyebrow}">Bối cảnh</p>
    <h2 class="${h2}">Vấn đề nghiên cứu</h2>
    <div class="reveal-stage grid md:grid-cols-3 gap-5 mt-8">${CONTEXT.map((c, i) => `
      <div style="--i:${i}" class="reveal3d bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg mb-4"><i class="fa-solid ${c[0]}"></i></div>
        <h3 class="font-bold text-slate-900">${c[1]}</h3><p class="text-sm text-slate-600 mt-1 leading-relaxed">${c[2]}</p>
      </div>`).join('')}</div>
    <div class="reveal-stage"><div class="reveal3d mt-8 rounded-2xl bg-indigo-50 border border-indigo-100 p-6">
      <p class="text-xs font-bold uppercase tracking-widest text-indigo-600">Câu hỏi nghiên cứu</p>
      <p class="text-lg sm:text-xl font-semibold text-indigo-950 mt-2 leading-snug">Một lộ trình detox kỹ thuật số có hướng dẫn trong 7–21 ngày có giúp học sinh THCS giảm mức độ FOMO và cải thiện giấc ngủ tự đánh giá hay không?</p>
    </div></div>
  </section>

  <section id="method" class="bg-white border-y border-slate-100 scroll-mt-4">
    <div class="${section} py-14">
      <p class="${eyebrow}">Phương pháp</p>
      <h2 class="${h2}">Thiết kế trước – sau can thiệp</h2>
      <ol class="reveal-stage grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">${STEPS.map((s, i) => `
        <li style="--i:${i}" class="reveal3d relative rounded-2xl border border-slate-200 p-6">
          <span class="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-indigo-600 text-white font-bold flex items-center justify-center">${i + 1}</span>
          <h3 class="font-bold text-slate-900 mt-4">${s[0]}</h3><p class="text-sm text-slate-600 mt-1 leading-relaxed">${s[1]}</p>
        </li>`).join('')}</ol>
    </div>
  </section>

  <section class="${section} py-14">
    <p class="${eyebrow}">Sản phẩm</p>
    <h2 class="${h2}">Các thành phần của ứng dụng</h2>
    <div class="reveal-stage grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">${MODULES.map((m, i) => `
      <div style="--i:${i % 3}" class="reveal3d flex gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div class="w-10 h-10 shrink-0 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><i class="fa-solid ${m[0]}"></i></div>
        <div><h3 class="font-semibold text-slate-900">${m[1]}</h3><p class="text-sm text-slate-600 mt-0.5">${m[2]}</p></div>
      </div>`).join('')}</div>
  </section>

  <section class="bg-slate-900 text-white">
    <div class="${section} py-14">
      <p class="text-xs font-bold uppercase tracking-widest text-teal-300">Đạo đức nghiên cứu</p>
      <h2 class="text-2xl sm:text-3xl font-bold mt-2">An toàn &amp; quyền riêng tư của học sinh</h2>
      <ul class="reveal-stage grid md:grid-cols-2 gap-4 mt-8">${ETHICS.map((e, i) => `
        <li style="--i:${i % 2}" class="reveal3d flex gap-3 rounded-xl bg-white/5 border border-white/10 p-5"><i class="fa-solid ${e[0]} text-teal-300 mt-1"></i><span class="text-sm text-slate-200 leading-relaxed">${e[1]}</span></li>`).join('')}</ul>
    </div>
  </section>

  <footer class="text-center text-xs text-slate-500 py-6">
    <p>© 2026 Dự án Nghiên cứu Khoa học Kỹ thuật • Trường THCS Nguyễn Tất Thành, Thái Nguyên</p>
  </footer>
</div>`;
}

// Gọi sau khi landingHtml đã vào trang: hiện từng khối khi cuộn tới (mỗi khối chỉ chạy hiệu ứng một lần).
export function startReveal(root: HTMLElement) {
  const els = root.querySelectorAll<HTMLElement>('.reveal3d');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-visible')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
}

registerActions({
  landingGo: ({ arg }) => document.getElementById(arg)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
});
