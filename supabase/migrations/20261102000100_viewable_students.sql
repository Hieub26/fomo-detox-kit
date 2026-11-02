-- Teacher policies called can_view_student() once per row, so every teacher query
-- slowed down with the size of the whole table, not with the teacher's own classes.
-- This function returns the same students as one set, computed once per query.
-- can_view_student() stays: teacher_reset_password() checks a single student with it.

create function public.viewable_students() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select p.id from public.profiles p
  join public.teacher_classes c on c.class_name = p.class_name
  where p.role = 'student' and c.teacher_id = auth.uid() and public.is_teacher();
$$;

revoke all on function public.viewable_students() from public, anon;
grant execute on function public.viewable_students() to authenticated;

drop policy "read own or class profile" on public.profiles;
create policy "read own or class profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or id in (select public.viewable_students()));

drop policy "teacher reads class" on public.assessments;
create policy "teacher reads class" on public.assessments for select to authenticated
  using (user_id in (select public.viewable_students()));

drop policy "teacher reads class" on public.programs;
create policy "teacher reads class" on public.programs for select to authenticated
  using (user_id in (select public.viewable_students()));
