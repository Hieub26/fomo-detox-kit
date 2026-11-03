-- More of the Cẩm Nang Số: harms of FOMO and heavy phone use, how to fix them, and more real-life situations.
-- Same content as DEFAULT_CARDS and DEFAULT_SITUATIONS in src/features/handbook/content.ts.
-- Appends after whatever admins already saved and never overwrites it: an entry whose title already exists is
-- skipped, and the admin_save_handbook limit of 20 per table is respected.

with new_rows (ord, title, body, callout) as (
  select row_number() over (), * from (values
 ('Tác Hại: Lo Âu Và Tâm Trạng Thất Thường', 'Nghiên cứu cho thấy người có mức FOMO cao thường hay lo lắng, tâm trạng kém và ít hài lòng với cuộc sống hơn. Bạn có thể thấy bồn chồn khi không cầm điện thoại, hoặc buồn bực khi thấy bạn bè đi chơi mà không có mình.', 'Nhiều bạn cũng có cảm giác này. Nhận ra nó là bước đầu tiên để thay đổi.'),
 ('Tác Hại: Luôn So Sánh Bản Thân', 'Mạng xã hội chủ yếu hiển thị khoảnh khắc đẹp nhất của người khác: ảnh đã chọn lọc, điểm cao, chuyến đi chơi. So sánh cuộc sống thường ngày của mình với những hình ảnh đó dễ khiến bạn tự ti và thấy mình kém cỏi hơn thực tế.', 'Bạn đang so phần hậu trường của mình với phần trình diễn của người khác.'),
 ('Tác Hại: Khó Tập Trung Khi Học', 'Mỗi lần thông báo kêu, sự chú ý bị kéo khỏi bài học và cần thêm thời gian mới quay lại được. Để điện thoại trong tầm mắt cũng có thể khiến bạn cứ nghĩ đến nó. Kết quả là học lâu hơn nhưng nhớ được ít hơn.', 'Vừa học vừa lướt điện thoại thực chất là liên tục chuyển qua lại giữa hai việc.'),
 ('Tác Hại Lên Cơ Thể', 'Nhìn màn hình lâu dễ gây mỏi mắt, khô mắt. Cúi đầu xem điện thoại nhiều giờ có thể gây đau cổ, vai, gáy. Thời gian ngồi lướt cũng lấy mất thời gian vận động và chơi thể thao.', 'Nếu đau đầu hoặc mỏi mắt kéo dài, hãy báo với bố mẹ để đi khám.'),
 ('Tác Hại: Xa Cách Người Thân Và Bạn Bè', 'Mải nhìn điện thoại trong bữa cơm hay khi đi chơi khiến bạn ít trò chuyện thật sự với mọi người. Có nhiều bạn trên mạng nhưng vẫn có thể thấy cô đơn, vì những lần gặp gỡ và hỏi han trực tiếp ngày càng ít đi.', 'Một cuộc trò chuyện trực tiếp thường gắn kết hơn nhiều lượt thích.'),
 ('Tác Hại: Vòng Lặp Khó Dứt', 'Lo bị bỏ lỡ nên mở điện thoại, thấy nội dung mới thì thích thú và muốn xem tiếp. Thức khuya làm bạn mệt, mà mệt lại càng dễ tìm đến điện thoại. Cứ thế, việc lướt mạng thành thói quen khó bỏ.', 'Chỉ dùng ý chí thường chưa đủ. Thay đổi môi trường xung quanh sẽ dễ hơn, như các cách dưới đây.'),
 ('Khắc Phục: Tắt Bớt Thông Báo', 'Chỉ giữ thông báo thật cần thiết như cuộc gọi của gia đình và nhóm học tập, tắt thông báo của mạng xã hội và trò chơi. Hẹn 2-3 khung giờ trong ngày để xem tin nhắn một lượt thay vì kiểm tra liên tục.', 'Báo trước với bạn thân: "Tối mình tắt máy, mai mình trả lời nhé" để bớt lo bị hiểu lầm.'),
 ('Khắc Phục: Giờ Giới Nghiêm Màn Hình', 'Ngừng dùng màn hình khoảng 1 tiếng trước khi ngủ. Sạc điện thoại ngoài phòng ngủ hoặc ở góc phòng, dùng đồng hồ báo thức riêng. Đi ngủ và thức dậy đúng giờ, kể cả cuối tuần.', 'Tuổi 6-12 cần ngủ 9-12 tiếng mỗi ngày, tuổi 13-18 cần 8-10 tiếng (khuyến nghị của Viện Hàn lâm Y học Giấc ngủ Hoa Kỳ).'),
 ('Khắc Phục: Học Tập Không Điện Thoại', 'Để điện thoại ở phòng khác hoặc trong cặp khi học. Thử cách Pomodoro: học tập trung 25 phút, nghỉ 5 phút. Đặt giới hạn thời gian cho ứng dụng bằng Digital Wellbeing trên Android hoặc Screen Time trên iPhone.', 'Bắt đầu nhỏ: giảm 15-30 phút mỗi ngày dễ duy trì hơn là bỏ hẳn ngay.'),
 ('Khắc Phục: Chăm Sóc Mắt Và Cơ Thể', 'Quy tắc 20-20-20: cứ 20 phút nhìn màn hình, hãy nhìn xa khoảng 6 mét trong 20 giây. Giữ điện thoại ngang tầm mắt thay vì cúi đầu. Tổ chức Y tế Thế giới khuyến nghị trẻ 5-17 tuổi vận động trung bình ít nhất 60 phút mỗi ngày.', 'Vận động đều đặn cũng giúp buổi tối dễ ngủ hơn.'),
 ('Khắc Phục: Dọn Bảng Tin, Tập JOMO', 'Bỏ theo dõi những tài khoản khiến bạn tự ti hoặc khó chịu. JOMO (Joy Of Missing Out) là niềm vui khi chủ động chọn việc trước mắt thay vì chạy theo mọi thứ trên mạng. Mỗi tối, thử viết ra 3 điều khiến bạn vui trong ngày.', 'Bỏ lỡ một trào lưu trên mạng không làm bạn kém đi.'),
 ('Khắc Phục: Khi Nào Cần Nhờ Giúp Đỡ', 'Hãy nói với bố mẹ, thầy cô hoặc người tư vấn tâm lý ở trường nếu bạn đã cố giảm nhiều lần nhưng không được, ngủ kém kéo dài, học sa sút hoặc thường xuyên thấy buồn, lo âu.', 'Nhờ giúp đỡ là việc làm dũng cảm. Nếu thấy không an toàn, hãy nói ngay với người lớn.')
  ) as v
), missing as (
  select * from new_rows n where not exists (select 1 from public.handbook_cards c where c.title = n.title)
  order by ord
  limit greatest(0, 20 - (select count(*) from public.handbook_cards))
)
insert into public.handbook_cards (pos, title, body, callout)
select (select coalesce(max(pos), 0) from public.handbook_cards) + row_number() over (order by ord), title, body, callout
from missing;

with new_rows (ord, title, reaction, solution) as (
  select row_number() over (), * from (values
 ('👀 Tình huống 3: Bạn bè đăng ảnh đi chơi mà không rủ mình', 'Xem đi xem lại story, đoán xem vì sao mình không được rủ, rồi buồn cả buổi tối và không học được bài.', 'Cất điện thoại và nhớ rằng bức ảnh chỉ kể một phần câu chuyện. Hôm sau hỏi bạn một cách nhẹ nhàng, hoặc chủ động rủ bạn đi chơi lần tới.'),
 ('📚 Tình huống 4: Đang làm bài tập thì nhóm chat lớp nhảy tin liên tục', 'Cứ vài phút lại mở ra đọc vì sợ lỡ việc quan trọng. Một bài tập 30 phút kéo dài thành 2 tiếng.', 'Tắt thông báo nhóm trong lúc học, để điện thoại ra xa, học 25 phút rồi nghỉ 5 phút mới xem tin. Nhờ một bạn nhắn riêng nếu có việc gấp.'),
 ('🔥 Tình huống 5: Cả lớp bàn về một trào lưu mà mình chưa biết', 'Sợ bị lạc lõng nên tối đó thức khuya xem lại mọi video để theo kịp, sáng hôm sau đến lớp với đôi mắt thâm quầng.', 'Cứ thoải mái hỏi: "Cái đó là gì thế?". Bạn không cần biết mọi thứ thì mới nói chuyện được với mọi người.')
  ) as v
), missing as (
  select * from new_rows n where not exists (select 1 from public.handbook_situations s where s.title = n.title)
  order by ord
  limit greatest(0, 20 - (select count(*) from public.handbook_situations))
)
insert into public.handbook_situations (pos, title, reaction, solution)
select (select coalesce(max(pos), 0) from public.handbook_situations) + row_number() over (order by ord), title, reaction, solution
from missing;
