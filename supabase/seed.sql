-- DỮ LIỆU MẪU (DEMO) — CHỈ DÙNG CHO SUPABASE LOCAL (`supabase db reset`), KHÔNG CHẠY TRÊN DATABASE THẬT.
-- Tạo 100 học sinh giả lớp "MAU" (tên bắt đầu "[MẪU]") với phân bố mức FOMO:
--   Lần đầu (trước): Rất thấp 44 · Thấp 29 · Trung bình 19 · Cao 8
--   Lần sau        : Rất thấp 62 · Thấp 19 · Trung bình 14 · Cao 5
-- Điểm do trigger compute_score tính từ 12 câu trả lời (TB = tổng/12):
--   tổng 12–21 Rất thấp, 22–31 Thấp, 32–40 Trung bình, 41–48 Cao.
-- Mức trước/sau ghép theo thứ tự nên không bạn nào tăng mức. Bạn có mức đầu > Rất thấp có lộ trình 7/14/21 ngày
-- (status done) và bài khảo sát kiểu 'sau'; bạn Rất thấp làm thêm một bài 'thường'.
-- Đăng nhập: mau_001 … mau_100, mật khẩu "matkhau123". Đổi DOMAIN cho khớp VITE_USERNAME_EMAIL_DOMAIN.

-- 12 đáp án (1–4) có tổng đúng bằng total, rải ngẫu nhiên điểm dư lên các câu.
create or replace function private.demo_answers(total int) returns smallint[]
language plpgsql as $$
declare a smallint[] := array_fill(1::smallint, array[12]); extra int := total - 12; k int;
begin
  while extra > 0 loop
    k := 1 + floor(random() * 12)::int;
    if a[k] < 4 then a[k] := a[k] + 1; extra := extra - 1; end if;
  end loop;
  return a;
end $$;

do $$
declare
  domain constant text := 'example.com';
  before_cnt constant int[] := array[44, 29, 19, 8];
  after_cnt  constant int[] := array[62, 19, 14, 5];
  lo constant int[] := array[12, 22, 32, 41];
  hi constant int[] := array[21, 31, 40, 48];
  days_of constant int[] := array[0, 7, 14, 21];
  i int; lb int; la int; uid uuid; uname text; start date; prog text;
begin
  perform setseed(0.42);
  for i in 1..100 loop
    -- mức thứ i (đã sắp tăng dần) trong mỗi phân bố
    lb := case when i <= before_cnt[1] then 1 when i <= before_cnt[1]+before_cnt[2] then 2
               when i <= before_cnt[1]+before_cnt[2]+before_cnt[3] then 3 else 4 end;
    la := case when i <= after_cnt[1] then 1 when i <= after_cnt[1]+after_cnt[2] then 2
               when i <= after_cnt[1]+after_cnt[2]+after_cnt[3] then 3 else 4 end;
    uid := gen_random_uuid();
    uname := 'mau_' || lpad(i::text, 3, '0');
    start := date '2026-09-07' + (i % 10);

    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
            uname || '@' || domain, extensions.crypt('matkhau123', extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('full_name', '[MẪU] Học sinh ' || lpad(i::text, 3, '0'), 'class_name', 'MAU'),
            now(), now());
    update public.profiles set approved = true where id = uid;

    insert into public.assessments (user_id, id, taken_at, answers, score, kind)
    values (uid, 'mau-pre-' || i, start::timestamptz + interval '8 hour',
            private.demo_answers(lo[lb] + floor(random() * (hi[lb] - lo[lb] + 1))::int), 1, 'thường');

    if lb > 1 then
      prog := 'mau-prog-' || i;
      insert into public.assessments (user_id, id, taken_at, answers, score, kind, program_id)
      values (uid, 'mau-post-' || i, (start + days_of[lb])::timestamptz + interval '8 hour',
              private.demo_answers(lo[la] + floor(random() * (hi[la] - lo[la] + 1))::int), 1, 'sau', prog);
      insert into public.programs (user_id, id, days, start_date, status, pre_id, post_id)
      values (uid, prog, days_of[lb], start, 'done', 'mau-pre-' || i, 'mau-post-' || i);
    else
      insert into public.assessments (user_id, id, taken_at, answers, score, kind)
      values (uid, 'mau-post-' || i, (start + 14)::timestamptz + interval '8 hour',
              private.demo_answers(lo[la] + floor(random() * (hi[la] - lo[la] + 1))::int), 1, 'thường');
    end if;
  end loop;
end $$;
drop function if exists private.demo_answers(int);
