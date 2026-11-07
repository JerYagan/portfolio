-- Manual, development-only admin membership seed.
-- This file is intentionally not included by supabase/config.toml or seed.sql.
-- First create/invite the user in Supabase Auth, then replace the example email
-- below with that user's email before running this in the SQL Editor.
-- Never use this example address for a real account or run this template in production.

do $seed_admin$
declare
  admin_email text := 'admin@example.test';
  target_user_id uuid;
begin
  select id
    into target_user_id
    from auth.users
   where lower(email) = lower(admin_email);

  if target_user_id is null then
    raise exception 'No Auth user found for %. Create the Auth user before granting admin access.', admin_email;
  end if;

  insert into public.admin_users (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;
end;
$seed_admin$;
