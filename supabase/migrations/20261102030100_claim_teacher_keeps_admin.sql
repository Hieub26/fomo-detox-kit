-- An admin who entered the teacher code became a teacher. Admin roles only change by SQL.

create or replace function public.claim_teacher(code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare stored text;
begin
  if auth.uid() is null then return false; end if;
  select teacher_code_hash into stored from private.app_config;
  if stored is null or extensions.crypt(code, stored) <> stored then return false; end if;
  update public.profiles set role = 'teacher', class_name = null where id = auth.uid() and role <> 'admin';
  return found;
end $$;
