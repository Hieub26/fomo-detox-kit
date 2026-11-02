-- Fixes from a review of the whole system.

/* ---------- 1. Question 10 is reverse-scored ----------
   "Do you want to change your phone habits?" used to add to the risk score, so students who
   wanted to change looked worse. It now scores 5 - answer, keeping the 10-40 range and thresholds.
   The app computes the same in scoreOf(); this recomputes rows saved by the old app. */
update public.assessments set score = score - answers[10] + (5 - answers[10]);

/* ---------- 2. Teachers confirm students into their class ----------
   Anyone can sign up and type any class name, so a student only counts in class lists and
   statistics after a teacher of that class (or an admin) confirms them. Changing class resets it. */
alter table public.profiles add column approved boolean not null default false;
update public.profiles set approved = true where role = 'student' and class_name is not null; -- existing students keep their place

create function private.reset_approval() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.class_name is distinct from old.class_name then new.approved := false; end if;
  return new;
end $$;

-- Runs after normalize_class (triggers fire in name order), so "8a2" -> "8A2" is not a change.
create trigger reset_approval before update of class_name on public.profiles
  for each row execute function private.reset_approval();

-- ok = true confirms the student; ok = false removes them from the class (class_name = null).
create function public.set_student_approval(target uuid, ok boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.is_admin() or public.can_view_student(target)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if ok then
    update public.profiles set approved = true where id = target and role = 'student' and class_name is not null;
  else
    update public.profiles set class_name = null, approved = false where id = target and role = 'student';
  end if;
end $$;

/* ---------- 3. Admins delete accounts ----------
   Deletes the auth user; every table references auth.users on delete cascade, so the profile,
   results, programs, audio sessions and posts go with it. Admin accounts are only removed by SQL. */
create function public.admin_delete_user(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() or not exists (
    select 1 from public.profiles where id = target and role in ('student', 'teacher')
  ) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from auth.users where id = target;
end $$;

revoke all on function public.set_student_approval(uuid, boolean) from public, anon;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.set_student_approval(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
