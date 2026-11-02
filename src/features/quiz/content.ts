export const Q = [
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
export const OPTS = ['Hoàn toàn không', 'Thỉnh thoảng', 'Thường xuyên', 'Rất thường xuyên']; // giá trị 1–4, tổng 10–40
export const MAXSCORE = 40;
export const GROUPS = [
  { name: 'Lo âu FOMO', items: [1, 4] },
  { name: 'Dùng điện thoại ban đêm', items: [2, 3, 9] },
  { name: 'Giấc ngủ & học tập', items: [5, 6, 7, 8] }
];
export const COLOR: Record<string, Record<string, string>> = {
  emerald: { box: 'border-emerald-300 bg-emerald-50/50', icon: 'bg-emerald-500', title: 'text-emerald-900', badge: 'bg-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', soft: 'bg-emerald-100 text-emerald-800' },
  amber: { box: 'border-amber-300 bg-amber-50/50', icon: 'bg-amber-500', title: 'text-amber-900', badge: 'bg-amber-600', btn: 'bg-amber-600 hover:bg-amber-700', soft: 'bg-amber-100 text-amber-800' },
  rose: { box: 'border-rose-300 bg-rose-50/50', icon: 'bg-rose-500', title: 'text-rose-900', badge: 'bg-rose-600', btn: 'bg-rose-600 hover:bg-rose-700', soft: 'bg-rose-100 text-rose-800' }
};
// Ngưỡng ≤18 và ≤28 theo bản gốc. Gợi ý lộ trình: nhẹ 7 ngày, trung bình 14 ngày, cao 21 ngày.
export const LEVELS = [
  { short: 'Nhẹ', max: 18, color: 'emerald', days: 7, icon: 'fa-shield-halved', title: 'Mức Độ Nhẹ: Kiểm Soát Tốt',
    desc: 'Chúc mừng! Bạn duy trì thói quen công nghệ rất lành mạnh. Cảm giác FOMO thấp và chất lượng giấc ngủ được bảo vệ tốt.' },
  { short: 'Trung bình', max: 28, color: 'amber', days: 14, icon: 'fa-triangle-exclamation', title: 'Mức Độ Trung Bình: Cảnh Báo Phụ Thuộc',
    desc: 'Cảnh báo! Bạn đang có dấu hiệu bị ảnh hưởng bởi hội chứng FOMO. Việc lướt điện thoại ban đêm bắt đầu làm giảm chất lượng giấc ngủ và sự tập trung học tập.' },
  { short: 'Cao', max: 40, color: 'rose', days: 21, icon: 'fa-bell-concierge', title: 'Mức Độ Cao: Báo Động Nghiêm Trọng',
    desc: 'BÁO ĐỘNG! Bạn đang gặp phải hội chứng FOMO nghiêm trọng và rối loạn giấc ngủ kỹ thuật số. Cần can thiệp ngay để tránh sa sút học tập và ảnh hưởng sức khỏe tâm thần.' }
];
