-- Survey v2 ("Phiếu khảo sát ban đầu"): 12 scored questions answered Không bao giờ / Hiếm khi / Thỉnh thoảng /
-- Thường xuyên (1-4 points), plus Part I (general info) and Part III (support needs) stored in assessments.info.
-- The score becomes the average 1.00-4.00 so old 10-question results stay comparable with new 12-question ones:
--   ≤1.80 Rất thấp, ≤2.60 Thấp, ≤3.40 Trung bình, above Cao (same thresholds in src/features/quiz/content.ts).

alter table public.assessments drop constraint if exists assessments_answers_check;
alter table public.assessments drop constraint if exists assessments_score_check;
alter table public.assessments alter column score type numeric(3, 2) using round(score / 10.0, 2);
alter table public.assessments add column if not exists info jsonb
  check (info is null or (jsonb_typeof(info) = 'object' and pg_column_size(info) < 4000));

-- 12 answers: scored with the current quiz points. 10 answers: a result saved before v2, scored with the
-- old formula (questions 1-9 as answered, question 10 reversed), divided by 10.
create or replace function private.compute_score() returns trigger
language plpgsql set search_path = '' as $$
begin
  if array_length(new.answers, 1) = 12 then
    new.score := round((select sum(q.points[new.answers[q.num]]) from public.quiz_questions q) / 12.0, 2);
  else
    new.score := round(((select sum(a) from unnest(new.answers[1:9]) a) + (5 - new.answers[10])) / 10.0, 2);
  end if;
  return new;
end $$;

alter table public.quiz_questions drop constraint if exists quiz_questions_num_check;
alter table public.quiz_questions add constraint quiz_questions_num_check check (num between 1 and 12);
delete from public.quiz_questions where true;
-- Same content as DEFAULT_QUIZ in src/features/quiz/content.ts.
insert into public.quiz_questions (num, question, labels, points)
select n, q, array['Không bao giờ', 'Hiếm khi', 'Thỉnh thoảng', 'Thường xuyên'], array[1, 2, 3, 4]::smallint[]
from unnest(array[
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
]) with ordinality as t(q, n);

update public.assessments set answers = answers where true; -- rescore every row with compute_score

alter table public.assessments add constraint assessments_answers_check
  check (array_length(answers, 1) in (10, 12) and answers <@ array[1, 2, 3, 4]::smallint[]);
alter table public.assessments add constraint assessments_score_check check (score between 1 and 4);

-- The quiz editor now saves 12 questions.
create or replace function public.admin_save_quiz(items jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare item record;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) <> 12 then
    raise exception 'quiz must have 12 questions' using errcode = '22023';
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
  update public.assessments set answers = answers where true;
end $$;
