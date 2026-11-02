-- Accounts, per-student data and teacher access for FOMO DETOX KIT.
-- Students sign in with a username, stored in auth.users as <username>@<domain> (see config.js).
-- Roles can never be set by the client: everyone starts as a student, and
-- only claim_teacher() with the secret teacher code can promote an account.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.app_config (
  id boolean primary key default true check (id),
  teacher_code_hash text
);
insert into private.app_config default values;

-- Run in the SQL editor to create or rotate the teacher code. Only a hash is stored,
-- so the code is shown once. The private schema is not reachable through the API.
create function private.rotate_teacher_code() returns text
language plpgsql set search_path = '' as $$
declare code text := encode(extensions.gen_random_bytes(12), 'hex');
begin
  update private.app_config set teacher_code_hash = extensions.crypt(code, extensions.gen_salt('bf'));
  return code;
end $$;

/* ---------- Tables ---------- */
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_.]{3,30}$'),
  full_name text not null default '' check (char_length(full_name) <= 100),
  class_name text check (char_length(class_name) between 1 and 20),
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

create table public.teacher_classes (
  teacher_id uuid not null references auth.users on delete cascade default auth.uid(),
  class_name text not null check (char_length(class_name) between 1 and 20),
  primary key (teacher_id, class_name)
);

create table public.assessments (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  id text not null check (char_length(id) <= 40),
  taken_at timestamptz not null,
  answers smallint[] not null check (array_length(answers, 1) = 10 and answers <@ array[1, 2, 3, 4]::smallint[]),
  score smallint not null check (score between 10 and 40),
  kind text not null check (kind in ('thường', 'sau')),
  program_id text,
  primary key (user_id, id)
);

create table public.programs (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  id text not null check (char_length(id) <= 40),
  days smallint not null check (days in (7, 14, 21)),
  start_date date not null,
  checks jsonb not null default '{}',
  status text not null check (status in ('active', 'done', 'stopped')),
  pre_id text,
  post_id text,
  primary key (user_id, id)
);

create table public.audio_sessions (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  id text not null check (char_length(id) <= 40),
  played_at timestamptz not null,
  sound text not null check (char_length(sound) <= 20),
  seconds integer not null check (seconds between 0 and 86400),
  primary key (user_id, id)
);

-- Private to the author: there is deliberately no teacher policy on this table.
create table public.posts (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  id text not null check (char_length(id) <= 40),
  posted_on date not null,
  body text not null check (char_length(body) between 1 and 1500),
  primary key (user_id, id)
);

/* ---------- Class names: "8a 2" and "8A2" must be the same class ---------- */
create function private.normalize_class() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.class_name := nullif(upper(regexp_replace(coalesce(new.class_name, ''), '\s', '', 'g')), '');
  return new;
end $$;

create trigger normalize_class before insert or update of class_name on public.profiles
  for each row execute function private.normalize_class();
create trigger normalize_class before insert or update of class_name on public.teacher_classes
  for each row execute function private.normalize_class();

/* ---------- Create a profile for every new account ---------- */
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, full_name, class_name)
  values (
    new.id,
    lower(split_part(new.email, '@', 1)),
    left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100),
    left(new.raw_user_meta_data ->> 'class_name', 20)
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

/* ---------- Access helpers. Security definer so policies do not recurse. ---------- */
create function public.is_teacher() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

create function public.can_view_student(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_teacher() and exists (
    select 1 from public.profiles p
    join public.teacher_classes c on c.class_name = p.class_name
    where p.id = target and p.role = 'student' and c.teacher_id = auth.uid()
  );
$$;

create function public.claim_teacher(code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare stored text;
begin
  if auth.uid() is null then return false; end if;
  select teacher_code_hash into stored from private.app_config;
  if stored is null or extensions.crypt(code, stored) <> stored then return false; end if;
  update public.profiles set role = 'teacher', class_name = null where id = auth.uid();
  return true;
end $$;

-- Teachers reset passwords for students in their own classes, never for other teachers.
create function public.teacher_reset_password(target uuid, new_password text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_view_student(target) then
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

revoke all on function public.is_teacher() from public, anon;
revoke all on function public.can_view_student(uuid) from public, anon;
revoke all on function public.claim_teacher(text) from public, anon;
revoke all on function public.teacher_reset_password(uuid, text) from public, anon;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.can_view_student(uuid) to authenticated;
grant execute on function public.claim_teacher(text) to authenticated;
grant execute on function public.teacher_reset_password(uuid, text) to authenticated;

/* ---------- Privileges ---------- */
revoke all on public.profiles, public.teacher_classes, public.assessments, public.programs,
  public.audio_sessions, public.posts from public, anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, class_name) on public.profiles to authenticated; -- role is not updatable
grant select, insert, update, delete on public.teacher_classes, public.assessments, public.programs,
  public.audio_sessions, public.posts to authenticated;

/* ---------- Row level security ---------- */
alter table public.profiles enable row level security;
alter table public.teacher_classes enable row level security;
alter table public.assessments enable row level security;
alter table public.programs enable row level security;
alter table public.audio_sessions enable row level security;
alter table public.posts enable row level security;

create policy "read own or class profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.can_view_student(id));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "teacher manages own classes" on public.teacher_classes for all to authenticated
  using (teacher_id = (select auth.uid()) and public.is_teacher())
  with check (teacher_id = (select auth.uid()) and public.is_teacher());

create policy "own rows" on public.assessments for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "teacher reads class" on public.assessments for select to authenticated
  using (public.can_view_student(user_id));

create policy "own rows" on public.programs for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "teacher reads class" on public.programs for select to authenticated
  using (public.can_view_student(user_id));

create policy "own rows" on public.audio_sessions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own rows" on public.posts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
