// Nội dung mặc định của Cẩm Nang Số, dùng khi chưa tải được bảng handbook_cards / handbook_situations.
// Quản trị viên sửa bản trong database (trang Quản Trị), không sửa ở đây. Văn bản thuần, hiển thị có escape.
export interface HandbookCard { title: string; body: string; callout: string }
export interface Situation { title: string; reaction: string; solution: string }

export const DEFAULT_CARDS: HandbookCard[] = [
  { title: 'FOMO Là Gì?', body: 'Fear Of Missing Out (FOMO) - Nỗi sợ bị bỏ lỡ thông tin, xu hướng hoặc các sự kiện thú vị mà bạn bè đang trải nghiệm. Nó khiến học sinh luôn thôi thúc phải kiểm tra điện thoại từng phút.', callout: 'Thuật toán MXH liên tục tạo cảm giác gấp gáp để giữ chân bạn lâu nhất có thể!' },
  { title: 'Sát Thủ Giấc Ngủ: Ánh Sáng Xanh', body: 'Dùng màn hình sát giờ ngủ, nhất là nội dung kích thích như video ngắn, có thể làm chậm tiết hormone Melatonin - hormone gây buồn ngủ tự nhiên - và khiến não khó "tắt" để ngủ.', callout: 'Trì hoãn giấc ngủ kỹ thuật số khiến bạn ngủ muộn, hay giật mình và mệt mỏi vào sáng hôm sau.' },
  { title: 'Hệ Lụy Đến Kết Quả Học Tập', body: 'Nhiều nghiên cứu cho thấy thiếu ngủ làm giảm khả năng ghi nhớ và tập trung trong giờ học, khiến tiếp thu bài chậm hơn và có thể ảnh hưởng đến kết quả học tập.', callout: 'Giấc ngủ ngon là chìa khóa vàng giúp não bộ ghi nhớ kiến thức bền vững.' }
];
export const DEFAULT_SITUATIONS: Situation[] = [
  { title: '📱 Tình huống 1: Tiếng thông báo Zalo/Messenger phát ra lúc 22h30', reaction: 'Bật dậy cầm điện thoại trả lời tin nhắn ngay vì sợ bạn bè nghĩ mình thờ ơ hoặc bỏ lỡ câu chuyện hot. Kết quả: Lướt thêm 1.5 tiếng.', solution: 'Bật chế độ "Do Not Disturb" (Không làm phiền) tự động từ 21h30.' },
  { title: '🎬 Tình huống 2: Thử thách "Chỉ xem 5 phút TikTok nữa thôi"', reaction: 'Các video ngắn liên tục vuốt không hồi kết làm não bộ tiết ra Dopamine liên tục. Bạn rơi vào trạng thái "trì hoãn giấc ngủ kỹ thuật số".', solution: 'Đặt giới hạn ứng dụng 20 phút/ngày hoặc sạc điện thoại ở góc phòng thay vì để gần giường.' }
];

// Màu và icon xoay vòng theo vị trí thẻ, nên thêm bao nhiêu thẻ cũng có màu. Tailwind cần tên lớp đầy đủ.
export const CARD_COLORS = ['amber', 'indigo', 'rose'];
export const CARD_ICONS = ['fa-ghost', 'fa-moon', 'fa-graduation-cap', 'fa-lightbulb', 'fa-brain', 'fa-bed'];
export const CARD_CLS: Record<string, string[]> = {
  amber: ['bg-amber-100 text-amber-600', 'bg-amber-50 text-amber-800 border-amber-200'],
  indigo: ['bg-indigo-100 text-indigo-600', 'bg-indigo-50 text-indigo-800 border-indigo-200'],
  rose: ['bg-rose-100 text-rose-600', 'bg-rose-50 text-rose-800 border-rose-200']
};
