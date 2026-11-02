-- A null activation code promoted anyone: extensions.crypt(null, stored) is null, so the "wrong code"
-- check was null (not true) and did not return. Any logged-in account could call claim_admin(null) or
-- claim_teacher(null) and be promoted. Reject a null code explicitly in both.

create or replace function public.claim_admin(code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare stored text;
begin
  if auth.uid() is null then return false; end if;
  select admin_code_hash into stored from private.app_config;
  if stored is null or code is null or extensions.crypt(code, stored) <> stored then return false; end if;
  update public.profiles set role = 'admin', class_name = null where id = auth.uid();
  delete from public.teacher_classes where teacher_id = auth.uid();
  return true;
end $$;

create or replace function public.claim_teacher(code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare stored text;
begin
  if auth.uid() is null then return false; end if;
  select teacher_code_hash into stored from private.app_config;
  if stored is null or code is null or extensions.crypt(code, stored) <> stored then return false; end if;
  update public.profiles set role = 'teacher', class_name = null where id = auth.uid() and role <> 'admin';
  return found;
end $$;
