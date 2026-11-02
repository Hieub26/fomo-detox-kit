-- Admin role for FOMO DETOX KIT.
-- Admins read every profile, assessment and program in the school, assign classes to teachers,
-- promote or demote teachers, reset passwords and rotate the activation codes from the web.
-- Posts (Góc Ẩn Danh) stay private to their author: there is deliberately no admin policy on them.
-- An account only becomes admin through claim_admin() with the secret admin code, or by SQL.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));

alter table private.app_config add column if not exists admin_code_hash text;

-- Run in the SQL editor: select private.set_admin_code('<a long secret>');
create function private.set_admin_code(code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if char_length(code) < 12 then
    raise exception 'admin code must be at least 12 characters' using errcode = '22023';
  end if;
  update private.app_config set admin_code_hash = extensions.crypt(code, extensions.gen_salt('bf')) where id;
end $$;

/* ---------- Access helpers ---------- */
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create function public.claim_admin(code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare stored text;
begin
  if auth.uid() is null then return false; end if;
  select admin_code_hash into stored from private.app_config;
  if stored is null or extensions.crypt(code, stored) <> stored then return false; end if;
  update public.profiles set role = 'admin', class_name = null where id = auth.uid();
  delete from public.teacher_classes where teacher_id = auth.uid();
  return true;
end $$;

-- Admins reset passwords for students and teachers, never for another admin.
create function public.admin_reset_password(target uuid, new_password text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() or not exists (
    select 1 from public.profiles where id = target and role in ('student', 'teacher')
  ) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if char_length(new_password) not between 8 and 72 then
    raise exception 'password must be 8-72 characters' using errcode = '22023';
  end if;
  update auth.users
    set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')), updated_at = now()
    where id = target;
  delete from auth.sessions where user_id = target;
end $$;

-- Promote a student to teacher or demote a teacher to student. Admin accounts cannot be changed here.
create function public.admin_set_role(target uuid, new_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if new_role not in ('student', 'teacher') then
    raise exception 'role must be student or teacher' using errcode = '22023';
  end if;
  update public.profiles
    set role = new_role, class_name = case when new_role = 'teacher' then null else class_name end
    where id = target and role in ('student', 'teacher');
  if not found then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if new_role = 'student' then
    delete from public.teacher_classes where teacher_id = target;
  end if;
end $$;

-- New random codes, returned once. Only the hash is stored; the old code stops working.
create function public.admin_rotate_teacher_code() returns text
language plpgsql security definer set search_path = '' as $$
declare code text := encode(extensions.gen_random_bytes(12), 'hex');
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update private.app_config set teacher_code_hash = extensions.crypt(code, extensions.gen_salt('bf')) where id;
  return code;
end $$;

create function public.admin_rotate_admin_code() returns text
language plpgsql security definer set search_path = '' as $$
declare code text := encode(extensions.gen_random_bytes(12), 'hex');
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update private.app_config set admin_code_hash = extensions.crypt(code, extensions.gen_salt('bf')) where id;
  return code;
end $$;

revoke all on function private.set_admin_code(text) from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.claim_admin(text) from public, anon;
revoke all on function public.admin_reset_password(uuid, text) from public, anon;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
revoke all on function public.admin_rotate_teacher_code() from public, anon;
revoke all on function public.admin_rotate_admin_code() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.claim_admin(text) to authenticated;
grant execute on function public.admin_reset_password(uuid, text) to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_rotate_teacher_code() to authenticated;
grant execute on function public.admin_rotate_admin_code() to authenticated;

/* ---------- Row level security ---------- */
-- is_admin() is wrapped in a subquery so it runs once per query, not once per row.
drop policy if exists "read own or class profile" on public.profiles;
create policy "read own or class profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or id in (select public.viewable_students()) or (select public.is_admin()));

-- Admins assign classes to any teacher, but only to accounts that are teachers.
create policy "admin manages all classes" on public.teacher_classes for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()) and exists (
    select 1 from public.profiles p where p.id = teacher_id and p.role = 'teacher'
  ));

create policy "admin reads all assessments" on public.assessments for select to authenticated
  using ((select public.is_admin()));

create policy "admin reads all programs" on public.programs for select to authenticated
  using ((select public.is_admin()));
