-- One row per conversation the signed-in user takes part in: the peer's name and the last message.
-- Security definer so a student may read the teacher's name (and vice versa) without a broad profile grant.
-- Returns nothing for admins, who are not part of any conversation.
create function public.my_conversations() returns table (
  student_id uuid, teacher_id uuid, peer_id uuid, peer_name text,
  last_body text, last_at timestamptz, last_sender uuid
)
language sql stable security definer set search_path = '' as $$
  with mine as (
    select distinct m.student_id, m.teacher_id from public.messages m
    where auth.uid() in (m.student_id, m.teacher_id)
  ),
  ranked as (
    select m.student_id, m.teacher_id, m.body, m.created_at, m.sender_id,
      row_number() over (partition by m.student_id, m.teacher_id order by m.created_at desc) rn
    from public.messages m
    join mine using (student_id, teacher_id)
  )
  select r.student_id, r.teacher_id,
    case when auth.uid() = r.student_id then r.teacher_id else r.student_id end,
    coalesce(p.full_name, p.username),
    r.body, r.created_at, r.sender_id
  from ranked r
  join public.profiles p on p.id = (case when auth.uid() = r.student_id then r.teacher_id else r.student_id end)
  where r.rn = 1
  order by r.created_at desc;
$$;

revoke all on function public.my_conversations() from public, anon;
grant execute on function public.my_conversations() to authenticated;
