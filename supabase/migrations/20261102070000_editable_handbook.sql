-- Admins edit the Cẩm Nang Số (handbook) from the web: the knowledge cards and the real-life situations,
-- any number of each. The app shows the default set from src/features/handbook until it loads these tables.
-- Text is shown escaped (plain text), so a saved card cannot inject HTML into every student's page.

create table public.handbook_cards (
  pos smallint primary key,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 1000),
  callout text not null check (char_length(callout) between 1 and 300)
);
create table public.handbook_situations (
  pos smallint primary key,
  title text not null check (char_length(title) between 1 and 160),
  reaction text not null check (char_length(reaction) between 1 and 1000),
  solution text not null check (char_length(solution) between 1 and 1000)
);

alter table public.handbook_cards enable row level security;
alter table public.handbook_situations enable row level security;
create policy "read cards" on public.handbook_cards for select to authenticated using (true);
create policy "read situations" on public.handbook_situations for select to authenticated using (true);
revoke all on public.handbook_cards, public.handbook_situations from anon, authenticated;
grant select on public.handbook_cards, public.handbook_situations to authenticated;

insert into public.handbook_cards (pos, title, body, callout) values
 (1, 'FOMO Là Gì?', 'Fear Of Missing Out (FOMO) - Nỗi sợ bị bỏ lỡ thông tin, xu hướng hoặc các sự kiện thú vị mà bạn bè đang trải nghiệm. Nó khiến học sinh luôn thôi thúc phải kiểm tra điện thoại từng phút.', 'Thuật toán MXH liên tục tạo cảm giác gấp gáp để giữ chân bạn lâu nhất có thể!'),
 (2, 'Sát Thủ Giấc Ngủ: Ánh Sáng Xanh', 'Dùng màn hình sát giờ ngủ, nhất là nội dung kích thích như video ngắn, có thể làm chậm tiết hormone Melatonin - hormone gây buồn ngủ tự nhiên - và khiến não khó "tắt" để ngủ.', 'Trì hoãn giấc ngủ kỹ thuật số khiến bạn ngủ muộn, hay giật mình và mệt mỏi vào sáng hôm sau.'),
 (3, 'Hệ Lụy Đến Kết Quả Học Tập', 'Nhiều nghiên cứu cho thấy thiếu ngủ làm giảm khả năng ghi nhớ và tập trung trong giờ học, khiến tiếp thu bài chậm hơn và có thể ảnh hưởng đến kết quả học tập.', 'Giấc ngủ ngon là chìa khóa vàng giúp não bộ ghi nhớ kiến thức bền vững.');

insert into public.handbook_situations (pos, title, reaction, solution) values
 (1, '📱 Tình huống 1: Tiếng thông báo Zalo/Messenger phát ra lúc 22h30', 'Bật dậy cầm điện thoại trả lời tin nhắn ngay vì sợ bạn bè nghĩ mình thờ ơ hoặc bỏ lỡ câu chuyện hot. Kết quả: Lướt thêm 1.5 tiếng.', 'Bật chế độ "Do Not Disturb" (Không làm phiền) tự động từ 21h30.'),
 (2, '🎬 Tình huống 2: Thử thách "Chỉ xem 5 phút TikTok nữa thôi"', 'Các video ngắn liên tục vuốt không hồi kết làm não bộ tiết ra Dopamine liên tục. Bạn rơi vào trạng thái "trì hoãn giấc ngủ kỹ thuật số".', 'Đặt giới hạn ứng dụng 20 phút/ngày hoặc sạc điện thoại ở góc phòng thay vì để gần giường.');

-- Replaces both tables with the given content. Each array may hold 1 to 20 items.
create function public.admin_save_handbook(cards jsonb, situations jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(cards) is distinct from 'array' or jsonb_array_length(cards) not between 1 and 20
     or jsonb_typeof(situations) is distinct from 'array' or jsonb_array_length(situations) not between 1 and 20 then
    raise exception 'handbook needs 1 to 20 cards and situations' using errcode = '22023';
  end if;
  delete from public.handbook_cards where true; -- PostgREST safeupdate yêu cầu where kể cả trong hàm
  insert into public.handbook_cards (pos, title, body, callout)
    select i::smallint, btrim(e ->> 'title'), btrim(e ->> 'body'), btrim(e ->> 'callout')
    from jsonb_array_elements(cards) with ordinality as t(e, i);
  delete from public.handbook_situations where true;
  insert into public.handbook_situations (pos, title, reaction, solution)
    select i::smallint, btrim(e ->> 'title'), btrim(e ->> 'reaction'), btrim(e ->> 'solution')
    from jsonb_array_elements(situations) with ordinality as t(e, i);
end $$;

revoke all on function public.admin_save_handbook(jsonb, jsonb) from public, anon;
grant execute on function public.admin_save_handbook(jsonb, jsonb) to authenticated;
