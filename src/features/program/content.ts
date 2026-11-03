export const BASE_TASKS = [
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
export const PLANS: Record<number, { sub: string; who: string; badge: string; tasks: string[] }> = {
  7: { sub: 'Cơ bản', who: 'Dành cho mức độ rất nhẹ và nhẹ', badge: 'Chiến Binh Giấc Ngủ', tasks: BASE_TASKS.slice(0, 7) },
  14: {
    sub: 'Chuyên sâu', who: 'Dành cho mức độ FOMO vừa', badge: 'Sứ Giả Detox',
    tasks: BASE_TASKS.concat(['Tốt nghiệp Lộ trình Detox 14 ngày & Nhận Huy Hiệu Sứ Giả Detox!'])
  },
  // Ngày 14–21 của lộ trình 21 ngày do nhóm phát triển soạn thêm; chỉnh tại đây.
  21: {
    sub: 'Toàn diện', who: 'Dành cho mức độ FOMO cao, ngủ kém', badge: 'Bậc Thầy Detox',
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
