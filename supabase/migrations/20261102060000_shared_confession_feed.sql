-- Góc Ẩn Danh is now a shared board: every student reads everyone's confessions, with no author shown.
-- This replaces the earlier choice (noted in 20261102010000_admin.sql) that posts stay private to their author.
-- Safety tradeoff accepted: sensitive posts are now visible school-wide, so an admin can remove any post.
-- The posts table keeps its "own rows" policy, so a student still only inserts and deletes their own rows
-- directly; the shared read and the admin delete go through the two security definer functions below,
-- which never expose user_id.

-- The feed: body and day only, newest first. No user_id, so readers cannot tell who wrote a post.
create function public.community_posts() returns table (id text, posted_on date, body text)
language sql stable security definer set search_path = '' as $$
  select id, posted_on, body from public.posts order by posted_on desc, id desc;
$$;

create function public.admin_delete_post(post_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from public.posts where id = post_id;
end $$;

revoke all on function public.community_posts() from public, anon;
revoke all on function public.admin_delete_post(text) from public, anon;
grant execute on function public.community_posts() to authenticated;
grant execute on function public.admin_delete_post(text) to authenticated;
