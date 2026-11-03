// Phần II của "Phiếu khảo sát ban đầu": 12 câu biểu hiện tâm lý FOMO, mỗi câu 1–4 điểm.
const Q = [
  'Em thường xuyên kiểm tra điện thoại để cập nhật thông báo và tin tức mới trên mạng xã hội.',
  'Em cảm thấy lo lắng hoặc khó chịu khi không thể truy cập mạng xã hội hoặc không biết những gì đang diễn ra.',
  'Em cảm thấy buồn hoặc khó chịu khi bạn bè có những trải nghiệm thú vị mà mình không tham gia.',
  'Em thường so sánh bản thân với người khác qua những gì họ chia sẻ trên mạng xã hội.',
  'Em khó tập trung vào học tập hoặc thường sử dụng mạng xã hội lâu hơn dự định vì sợ bỏ lỡ thông tin.',
  'Em thường lướt mạng xã hội trước khi đi ngủ và khó dừng lại, dẫn đến trì hoãn giờ đi ngủ.',
  'Em thường xuyên thức khuya hoặc tỉnh giấc giữa đêm để kiểm tra thông báo trên điện thoại.',
  'Việc lướt điện thoại ban đêm khiến em ngủ ít hơn 6 tiếng/đêm.',
  'Em thường cảm thấy mệt mỏi, buồn ngủ hoặc thiếu tỉnh táo vào ngày hôm sau do sử dụng điện thoại và ngủ không đủ giấc.',
  'Em cảm thấy khó đi vào giấc ngủ (mất hơn 30 phút trằn trọc).',
  'Em ít dành thời gian trò chuyện, giao tiếp trực tiếp với gia đình và bạn bè do sử dụng mạng xã hội.',
  'Em cảm thấy mất tập trung, giảm hứng thú với các hoạt động học tập và vui chơi ngoài đời thực.'
];
const OPTS = ['Không bao giờ', 'Hiếm khi', 'Thỉnh thoảng', 'Thường xuyên'];
export interface QuizItem { question: string; labels: string[]; points: number[] }
// Bộ câu hỏi gốc, dùng khi chưa tải được bảng quiz_questions. Quản trị viên sửa bản trong database, không sửa ở đây.
export const DEFAULT_QUIZ: QuizItem[] = Q.map(question => ({ question, labels: OPTS, points: [1, 2, 3, 4] }));
// Điểm là trung bình 12 câu (1,00–4,00). Kết quả cũ 10 câu cũng được quy về trung bình nên vẫn so sánh được.
export const MINSCORE = 1, MAXSCORE = 4;
export const GROUPS = [
  { name: 'Lo âu & so sánh', items: [1, 2, 3, 4] },
  { name: 'Điện thoại ban đêm & giấc ngủ', items: [6, 7, 8, 10] },
  { name: 'Học tập & đời sống', items: [5, 9, 11, 12] }
];

// Phần I (thông tin chung) và Phần III (nhu cầu hỗ trợ), lưu kèm kết quả trong cột info.
export const INFO_Q = {
  gender: { label: 'Giới tính', opts: ['Nam', 'Nữ'] },
  snsTime: { label: 'Thời gian sử dụng mạng xã hội trung bình mỗi ngày', opts: ['Dưới 1 giờ', 'Từ 1–2 giờ', 'Từ 2–4 giờ', 'Trên 4 giờ'] },
  snsWhen: { label: 'Em thường sử dụng mạng xã hội vào thời điểm nào? (chọn nhiều)', opts: ['Buổi sáng', 'Trong giờ nghỉ học', 'Buổi chiều', 'Buổi tối', 'Trước khi đi ngủ'], multi: true },
  wantReduce: { label: 'Em có mong muốn giảm thời gian sử dụng mạng xã hội không?', opts: ['Rất mong muốn', 'Có mong muốn', 'Chưa xác định', 'Không có nhu cầu'] },
  readyDetox: { label: 'Em có sẵn sàng tham gia lộ trình Detox 7 ngày, 14 ngày hoặc 21 ngày không?', opts: ['Có', 'Cân nhắc', 'Không'] },
  support: { label: 'Em mong muốn nhận được hình thức hỗ trợ nào? (chọn nhiều)', opts: ['Tư vấn tâm lý cá nhân', 'Sinh hoạt nhóm, chia sẻ cùng bạn bè', 'Sử dụng cẩm nang hướng dẫn', 'Tham gia chương trình FOMO Detox Kit', 'Hỗ trợ từ giáo viên và phụ huynh'], multi: true }
} as const;
export const PART1: (keyof typeof INFO_Q)[] = ['gender', 'snsTime', 'snsWhen'];
export const PART3: (keyof typeof INFO_Q)[] = ['wantReduce', 'readyDetox', 'support'];
export const NOTE_LABEL = 'Em có muốn chia sẻ thêm điều gì về việc sử dụng mạng xã hội và cảm xúc của bản thân không?';
export const NOTE_MAX = 1000;
export const COLOR: Record<string, Record<string, string>> = {
  emerald: { box: 'border-emerald-300 bg-emerald-50/50', icon: 'bg-emerald-500', title: 'text-emerald-900', badge: 'bg-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', soft: 'bg-emerald-100 text-emerald-800' },
  lime: { box: 'border-lime-300 bg-lime-50/50', icon: 'bg-lime-600', title: 'text-lime-900', badge: 'bg-lime-700', btn: 'bg-lime-700 hover:bg-lime-800', soft: 'bg-lime-100 text-lime-800' },
  amber: { box: 'border-amber-300 bg-amber-50/50', icon: 'bg-amber-500', title: 'text-amber-900', badge: 'bg-amber-600', btn: 'bg-amber-600 hover:bg-amber-700', soft: 'bg-amber-100 text-amber-800' },
  rose: { box: 'border-rose-300 bg-rose-50/50', icon: 'bg-rose-500', title: 'text-rose-900', badge: 'bg-rose-600', btn: 'bg-rose-600 hover:bg-rose-700', soft: 'bg-rose-100 text-rose-800' }
};
// Bốn mức theo điểm trung bình của phiếu khảo sát: ≤1,80 Rất thấp, ≤2,60 Thấp, ≤3,40 Trung bình, còn lại Cao.
// Gợi ý lộ trình: rất thấp không cần (days = 0), thấp 7 ngày, trung bình 14 ngày, cao 21 ngày.
export const LEVELS = [
  { short: 'Rất thấp', max: 1.8, color: 'emerald', days: 0, icon: 'fa-shield-halved', title: 'Mức Độ Rất Thấp: Không Có Biểu Hiện FOMO',
    desc: 'Hầu như không xuất hiện biểu hiện FOMO. Bạn cần duy trì tốt mức sử dụng mạng xã hội hiện tại, không cần tham gia lộ trình detox.' },
  { short: 'Thấp', max: 2.6, color: 'lime', days: 7, icon: 'fa-circle-check', title: 'Mức Độ Thấp: Có Biểu Hiện FOMO Nhẹ',
    desc: 'Biểu hiện FOMO ít xuất hiện. Đôi lúc bạn vẫn có cảm giác sợ bỏ lỡ hoặc dùng điện thoại muộn. Giữ vài thói quen nhỏ trước giờ ngủ sẽ giúp bạn duy trì trạng thái tốt.' },
  { short: 'Trung bình', max: 3.4, color: 'amber', days: 14, icon: 'fa-triangle-exclamation', title: 'Mức Độ Trung Bình: FOMO Mức Trung Bình',
    desc: 'Biểu hiện FOMO xuất hiện ở mức trung bình. Việc dùng điện thoại và mạng xã hội có thể đang làm giảm chất lượng giấc ngủ và sự tập trung khi học. Điều chỉnh từ bây giờ sẽ giúp bạn khá lên nhanh.' },
  { short: 'Cao', max: 4, color: 'rose', days: 21, icon: 'fa-hand-holding-heart', title: 'Mức Độ Cao: FOMO Mức Độ Nặng',
    desc: 'Biểu hiện FOMO xuất hiện thường xuyên và đang ảnh hưởng nhiều đến giấc ngủ và việc học của bạn. Đây không phải là chẩn đoán bệnh, nhưng là dấu hiệu bạn không nên tự xoay xở một mình: hãy bắt đầu lộ trình và trò chuyện với người lớn bạn tin tưởng.' }
];

// Thông tin hỗ trợ hiện khi kết quả ở mức Cao. NHÀ TRƯỜNG CẦN ĐIỀN thông tin thật của phòng tư vấn (phòng, giờ, người phụ trách).
export const SUPPORT = {
  school: 'Phòng Tư vấn tâm lý học đường, Trường THCS Nguyễn Tất Thành. Bạn cũng có thể nói với giáo viên chủ nhiệm.',
  hotline: '111', // Tổng đài quốc gia bảo vệ trẻ em: miễn phí, 24/7
  hotlineName: 'Tổng đài quốc gia bảo vệ trẻ em (miễn phí, 24/7)'
};
// Nhãn bảng hỏi: phiếu khảo sát do nhóm tự xây dựng, không phải thang FOMO-S hay PSQI nguyên bản.
export const SCALE_LABEL = 'Phiếu khảo sát tự xây dựng • 12 câu, thang 4 mức';
