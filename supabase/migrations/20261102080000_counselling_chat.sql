-- Private 1-1 counselling chat between a student and a teacher of that student's class.
-- A conversation is the (student_id, teacher_id) pair. Only the two participants read and write it;
-- admins are deliberately excluded (no admin policy here), matching the privacy chosen for this feature.
-- Messages are never edited or deleted by users, so there is no update/delete grant.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users on delete cascade,
  teacher_id uuid not null references auth.users on delete cascade,
  sender_id uuid not null references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint sender_is_participant check (sender_id in (student_id, teacher_id))
);
create index messages_convo on public.messages (student_id, teacher_id, created_at);

alter table public.messages enable row level security;

-- true if `teacher` teaches a class that `student` belongs to.
create function public.teaches(teacher uuid, student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.teacher_classes tc on tc.class_name = p.class_name
    where p.id = student and p.role = 'student' and tc.teacher_id = teacher
  );
$$;

create policy "read own conversations" on public.messages for select to authenticated
  using ((select auth.uid()) in (student_id, teacher_id) and public.teaches(teacher_id, student_id));
create policy "send to own conversations" on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and (select auth.uid()) in (student_id, teacher_id)
    and public.teaches(teacher_id, student_id));

revoke all on public.messages from public, anon, authenticated;
grant select, insert on public.messages to authenticated;

-- Teachers of the signed-in student's class, so a student can pick whom to message.
-- A student cannot read teacher profiles directly, so this security definer function returns just enough.
create function public.my_teachers() returns table (id uuid, full_name text, username text)
language sql stable security definer set search_path = '' as $$
  select distinct pr.id, pr.full_name, pr.username
  from public.profiles me
  join public.teacher_classes tc on tc.class_name = me.class_name
  join public.profiles pr on pr.id = tc.teacher_id
  where me.id = auth.uid() and me.role = 'student' and me.approved;
$$;

revoke all on function public.teaches(uuid, uuid) from public, anon;
revoke all on function public.my_teachers() from public, anon;
grant execute on function public.teaches(uuid, uuid) to authenticated;
grant execute on function public.my_teachers() to authenticated;

-- Realtime so each side sees new messages without reloading. RLS above still decides what is delivered.
alter publication supabase_realtime add table public.messages;
