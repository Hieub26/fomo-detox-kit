-- Admins edit the quiz from the web: question text, answer labels and the points of each answer.
-- There are always 10 questions with 4 answers. Answers stay stored as the chosen option (1-4), and each
-- option is worth 1 to 4 points, so a total always stays within 10-40 and the level thresholds still apply.

create table public.quiz_questions (
  num smallint primary key check (num between 1 and 10),
  question text not null check (char_length(question) between 1 and 300),
  labels text[] not null check (array_length(labels, 1) = 4),
  points smallint[] not null check (array_length(points, 1) = 4 and points <@ array[1, 2, 3, 4]::smallint[])
);

alter table public.quiz_questions enable row level security;
create policy "read quiz" on public.quiz_questions for select to authenticated using (true);
revoke all on public.quiz_questions from anon, authenticated;
grant select on public.quiz_questions to authenticated;

-- Same content as DEFAULT_QUIZ in src/features/quiz/content.ts, which the app uses until it has loaded this table.
insert into public.quiz_questions (num, question, labels, points)
select n, q, case when n = 10 then array['Không muốn', 'Hơi muốn', 'Khá muốn', 'Rất muốn']
                  else array['Hoàn toàn không', 'Thỉnh thoảng', 'Thường xuyên', 'Rất thường xuyên'] end,
       case when n = 10 then array[4, 3, 2, 1]::smallint[] else array[1, 2, 3, 4]::smallint[] end
from unnest(array[
  'Bạn có cảm giác bồn chồn, lo lắng khi không thể kiểm tra thông báo mạng xã hội?',
  'Bạn có thói quen cầm điện thoại lướt mạng ngay trước khi đi ngủ?',
  'Bạn từng giật mình thức giấc nửa đêm và kiểm tra điện thoại ngay lập tức?',
  'Bạn cảm thấy sợ mình trở thành ''người đứng ngoài cuộc'' khi bạn bè bàn về xu hướng hót trên mạng?',
  'Việc lướt điện thoại ban đêm khiến bạn ngủ ít hơn 6 tiếng/ngày?',
  'Bạn thường thức dậy trong trạng thái uể oải, mệt mỏi và đau đầu vào sáng hôm sau?',
  'Bạn từng ngủ gật hoặc khó tập trung chú ý trong các giờ học trên lớp?',
  'Bạn cảm thấy khó đi vào giấc ngủ (mất hơn 30 phút trằn trọc)?',
  'Bạn có liên tục trì hoãn việc đi ngủ chỉ để xem thêm video ngắn (TikTok/Reels)?',
  'Bạn có muốn chủ động thay đổi thói quen dùng điện thoại để cải thiện điểm số học tập?'
]) with ordinality as t(q, n);

-- Replaces the fixed formula from 20261102030000_server_score.sql; the same answers give the same score.
create or replace function private.compute_score() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.score := (select sum(q.points[new.answers[q.num]]) from public.quiz_questions q);
  return new;
end $$;

-- Saves all 10 questions and rescores every saved result, so before/after comparisons use one set of points.
create function public.admin_save_quiz(items jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare item record;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) <> 10 then
    raise exception 'quiz must have 10 questions' using errcode = '22023';
  end if;
  for item in
    select i::smallint as num,
      btrim(e ->> 'question') as question,
      array(select btrim(l) from jsonb_array_elements_text(e -> 'labels') l) as labels,
      array(select p::smallint from jsonb_array_elements_text(e -> 'points') p) as points
    from jsonb_array_elements(items) with ordinality as t(e, i)
  loop
    if exists (select 1 from unnest(item.labels) l where l is null or char_length(l) not between 1 and 60) then
      raise exception 'answer labels must be 1-60 characters' using errcode = '22023';
    end if;
    update public.quiz_questions
      set question = item.question, labels = item.labels, points = item.points
      where num = item.num;
  end loop;
  update public.assessments set answers = answers where true; -- fires compute_score; PostgREST's safeupdate needs a where
end $$;

revoke all on function public.admin_save_quiz(jsonb) from public, anon;
grant execute on function public.admin_save_quiz(jsonb) to authenticated;
