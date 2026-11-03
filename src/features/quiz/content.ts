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
const OPTS = ['Hoàn toàn không', 'Thỉnh thoảng', 'Thường xuyên', 'Rất thường xuyên'];
// Câu 10 hỏi mong muốn nên dùng nhãn riêng. Giá trị lưu vẫn là 1–4 như các câu khác.
const OPTS_WANT = ['Không muốn', 'Hơi muốn', 'Khá muốn', 'Rất muốn']; // giá trị 1–4, tổng 10–40
export interface QuizItem { question: string; labels: string[]; points: number[] }
// Bộ câu hỏi gốc, dùng khi chưa tải được bảng quiz_questions. Quản trị viên sửa bản trong database, không sửa ở đây.
// Mỗi đáp án 1–4 điểm nên tổng luôn trong 10–40. Câu 10 tính ngược: càng muốn thay đổi, điểm nguy cơ càng thấp.
export const DEFAULT_QUIZ: QuizItem[] = Q.map((question, i) => ({ question, labels: i === 9 ? OPTS_WANT : OPTS, points: i === 9 ? [4, 3, 2, 1] : [1, 2, 3, 4] }));
export const MAXSCORE = 40;
export const GROUPS = [
  { name: 'Lo âu FOMO', items: [1, 4] },
  { name: 'Dùng điện thoại ban đêm', items: [2, 3, 9] },
  { name: 'Giấc ngủ & học tập', items: [5, 6, 7, 8] }
];
export const COLOR: Record<string, Record<string, string>> = {
  emerald: { box: 'border-emerald-300 bg-emerald-50/50', icon: 'bg-emerald-500', title: 'text-emerald-900', badge: 'bg-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', soft: 'bg-emerald-100 text-emerald-800' },
  lime: { box: 'border-lime-300 bg-lime-50/50', icon: 'bg-lime-600', title: 'text-lime-900', badge: 'bg-lime-700', btn: 'bg-lime-700 hover:bg-lime-800', soft: 'bg-lime-100 text-lime-800' },
  amber: { box: 'border-amber-300 bg-amber-50/50', icon: 'bg-amber-500', title: 'text-amber-900', badge: 'bg-amber-600', btn: 'bg-amber-600 hover:bg-amber-700', soft: 'bg-amber-100 text-amber-800' },
  rose: { box: 'border-rose-300 bg-rose-50/50', icon: 'bg-rose-500', title: 'text-rose-900', badge: 'bg-rose-600', btn: 'bg-rose-600 hover:bg-rose-700', soft: 'bg-rose-100 text-rose-800' }
};
// Bốn mức, nguy cơ tăng dần. Ngưỡng ≤18 và ≤28 theo bản gốc, mức nhẹ cũ được tách thêm ở 14.
// Gợi ý lộ trình: rất nhẹ và nhẹ 7 ngày, vừa 14 ngày, cao 21 ngày.
export const LEVELS = [
  { short: 'Rất nhẹ', max: 14, color: 'emerald', days: 7, icon: 'fa-shield-halved', title: 'Mức Độ Rất Nhẹ: Kiểm Soát Rất Tốt',
    desc: 'Chúc mừng! Bạn duy trì thói quen công nghệ rất lành mạnh. Cảm giác FOMO thấp và chất lượng giấc ngủ được bảo vệ tốt.' },
  { short: 'Nhẹ', max: 18, color: 'lime', days: 7, icon: 'fa-circle-check', title: 'Mức Độ Nhẹ: Kiểm Soát Tốt',
    desc: 'Bạn đang kiểm soát khá tốt, dù đôi lúc vẫn có cảm giác sợ bỏ lỡ hoặc dùng điện thoại muộn. Giữ vài thói quen nhỏ trước giờ ngủ sẽ giúp bạn duy trì trạng thái này.' },
  { short: 'Vừa', max: 28, color: 'amber', days: 14, icon: 'fa-triangle-exclamation', title: 'Mức Độ Vừa: Cần Điều Chỉnh',
    desc: 'Bạn đang có một số dấu hiệu bị ảnh hưởng bởi FOMO. Việc dùng điện thoại buổi tối có thể đang làm giảm chất lượng giấc ngủ và sự tập trung khi học. Điều chỉnh từ bây giờ sẽ giúp bạn khá lên nhanh.' },
  { short: 'Cao', max: 40, color: 'rose', days: 21, icon: 'fa-hand-holding-heart', title: 'Mức Độ Cao: Bạn Nên Được Hỗ Trợ',
    desc: 'Điện thoại và mạng xã hội đang ảnh hưởng nhiều đến giấc ngủ và việc học của bạn. Đây không phải là chẩn đoán bệnh, nhưng là dấu hiệu bạn không nên tự xoay xở một mình: hãy bắt đầu lộ trình và trò chuyện với người lớn bạn tin tưởng.' }
];

// Thông tin hỗ trợ hiện khi kết quả ở mức Cao. NHÀ TRƯỜNG CẦN ĐIỀN thông tin thật của phòng tư vấn (phòng, giờ, người phụ trách).
export const SUPPORT = {
  school: 'Phòng Tư vấn tâm lý học đường, Trường THCS Nguyễn Tất Thành. Bạn cũng có thể nói với giáo viên chủ nhiệm.',
  hotline: '111', // Tổng đài quốc gia bảo vệ trẻ em: miễn phí, 24/7
  hotlineName: 'Tổng đài quốc gia bảo vệ trẻ em (miễn phí, 24/7)'
};
// Nhãn bảng hỏi: 10 câu do nhóm tự xây dựng, không phải thang FOMO-S hay PSQI nguyên bản.
export const SCALE_LABEL = 'Bảng hỏi tự xây dựng • tham khảo FOMO-S &amp; PSQI';
