begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
grant usage on schema public to anon, authenticated;

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.profile (
  id smallint primary key default 1 check (id = 1),
  display_name text not null default 'Your Name'
    check (char_length(display_name) between 1 and 120),
  headline text not null default ''
    check (char_length(headline) <= 180),
  bio text not null default ''
    check (char_length(bio) <= 12000),
  location text,
  contact_url text
    check (contact_url is null or contact_url ~* '^(https://|mailto:)[^[:space:]]+$'),
  avatar_path text
    check (avatar_path is null or avatar_path like 'portfolio/%'),
  avatar_alt text,
  skills jsonb not null default '[]'::jsonb
    check (jsonb_typeof(skills) = 'array'),
  social_links jsonb not null default '[]'::jsonb
    check (jsonb_typeof(social_links) = 'array'),
  updated_at timestamptz not null default now(),
  constraint profile_avatar_alt_check check (
    (avatar_path is null and avatar_alt is null)
    or (avatar_path is not null and nullif(btrim(avatar_alt), '') is not null)
  )
);

create table public.portfolio_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  slug text not null unique
    check (char_length(slug) between 1 and 60 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 500),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.portfolio_categories (id) on delete restrict,
  title text not null check (char_length(title) between 1 and 120),
  slug text not null unique
    check (char_length(slug) between 1 and 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text not null check (char_length(summary) between 1 and 240),
  body_markdown text not null default '' check (char_length(body_markdown) <= 30000),
  thumbnail_path text check (thumbnail_path is null or thumbnail_path like 'portfolio/%'),
  thumbnail_alt text,
  project_url text
    check (project_url is null or project_url ~* '^https://[^[:space:]]+$'),
  repository_url text
    check (repository_url is null or repository_url ~* '^https://[^[:space:]]+$'),
  year smallint check (year is null or year between 1900 and 2100),
  client_label text check (client_label is null or char_length(client_label) <= 120),
  role text check (role is null or char_length(role) <= 120),
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  seo_title text check (seo_title is null or char_length(seo_title) <= 180),
  seo_description text check (seo_description is null or char_length(seo_description) <= 320),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_entries_thumbnail_alt_check check (
    (thumbnail_path is null and thumbnail_alt is null)
    or (thumbnail_path is not null and nullif(btrim(thumbnail_alt), '') is not null)
  ),
  constraint portfolio_entries_published_at_check check (
    status <> 'published' or published_at is not null
  )
);

create table public.portfolio_media (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.portfolio_entries (id) on delete cascade,
  object_path text not null unique
    check (object_path like 'portfolio/%' and char_length(object_path) <= 512),
  alt_text text not null check (char_length(btrim(alt_text)) between 1 and 300),
  caption text check (caption is null or char_length(caption) <= 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.portfolio_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  slug text not null unique
    check (char_length(slug) between 1 and 50 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.entry_tags (
  entry_id uuid not null references public.portfolio_entries (id) on delete cascade,
  tag_id uuid not null references public.portfolio_tags (id) on delete cascade,
  primary key (entry_id, tag_id)
);

create unique index portfolio_tags_name_lower_unique
  on public.portfolio_tags (lower(name));

create index portfolio_entries_public_order_idx
  on public.portfolio_entries (status, is_featured desc, sort_order, published_at desc);
create index portfolio_entries_category_order_idx
  on public.portfolio_entries (category_id, status, sort_order);
create index portfolio_entries_thumbnail_path_idx
  on public.portfolio_entries (thumbnail_path)
  where thumbnail_path is not null;
create index portfolio_media_entry_order_idx
  on public.portfolio_media (entry_id, sort_order);
create index entry_tags_tag_id_idx
  on public.entry_tags (tag_id);

create or replace function private.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.admin_users as admin
      where admin.user_id = (select auth.uid())
    );
$$;

revoke all on function private.is_portfolio_admin() from public;
grant execute on function private.is_portfolio_admin() to anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;
grant execute on function private.set_updated_at() to authenticated;

create or replace function private.set_entry_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := statement_timestamp();
  end if;
  return new;
end;
$$;

revoke all on function private.set_entry_published_at() from public;
grant execute on function private.set_entry_published_at() to authenticated;

create trigger profile_set_updated_at
  before update on public.profile
  for each row execute function private.set_updated_at();

create trigger portfolio_categories_set_updated_at
  before update on public.portfolio_categories
  for each row execute function private.set_updated_at();

create trigger portfolio_entries_set_updated_at
  before update on public.portfolio_entries
  for each row execute function private.set_updated_at();

create trigger portfolio_entries_set_published_at
  before insert or update of status, published_at on public.portfolio_entries
  for each row execute function private.set_entry_published_at();

alter table public.admin_users enable row level security;
alter table public.profile enable row level security;
alter table public.portfolio_categories enable row level security;
alter table public.portfolio_entries enable row level security;
alter table public.portfolio_media enable row level security;
alter table public.portfolio_tags enable row level security;
alter table public.entry_tags enable row level security;

revoke all on table public.admin_users, public.profile, public.portfolio_categories,
  public.portfolio_entries, public.portfolio_media, public.portfolio_tags, public.entry_tags
  from anon, authenticated;

grant select on table public.admin_users to authenticated;
grant select on table public.profile, public.portfolio_categories, public.portfolio_entries,
  public.portfolio_media, public.portfolio_tags, public.entry_tags to anon, authenticated;
grant update on table public.profile to authenticated;
grant insert, update, delete on table public.portfolio_categories, public.portfolio_entries,
  public.portfolio_media, public.portfolio_tags, public.entry_tags to authenticated;

create policy admin_users_read_self
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create policy profile_public_read
  on public.profile for select to anon, authenticated
  using (id = 1);

create policy profile_admin_update
  on public.profile for update to authenticated
  using ((select private.is_portfolio_admin()))
  with check ((select private.is_portfolio_admin()));

create policy portfolio_categories_public_read
  on public.portfolio_categories for select to anon, authenticated
  using (is_visible);

create policy portfolio_categories_admin_manage
  on public.portfolio_categories for all to authenticated
  using ((select private.is_portfolio_admin()))
  with check ((select private.is_portfolio_admin()));

create policy portfolio_entries_public_read
  on public.portfolio_entries for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.portfolio_categories as category
      where category.id = portfolio_entries.category_id
        and category.is_visible
    )
  );

create policy portfolio_entries_admin_manage
  on public.portfolio_entries for all to authenticated
  using ((select private.is_portfolio_admin()))
  with check ((select private.is_portfolio_admin()));

create policy portfolio_media_public_read
  on public.portfolio_media for select to anon, authenticated
  using (
    exists (
      select 1
      from public.portfolio_entries as entry
      join public.portfolio_categories as category on category.id = entry.category_id
      where entry.id = portfolio_media.entry_id
        and entry.status = 'published'
        and category.is_visible
    )
  );

create policy portfolio_media_admin_manage
  on public.portfolio_media for all to authenticated
  using ((select private.is_portfolio_admin()))
  with check ((select private.is_portfolio_admin()));

create policy portfolio_tags_public_read
  on public.portfolio_tags for select to anon, authenticated
  using (
    exists (
      select 1
      from public.entry_tags as link
      join public.portfolio_entries as entry on entry.id = link.entry_id
      join public.portfolio_categories as category on category.id = entry.category_id
      where link.tag_id = portfolio_tags.id
        and entry.status = 'published'
        and category.is_visible
    )
  );

create policy portfolio_tags_admin_manage
  on public.portfolio_tags for all to authenticated
  using ((select private.is_portfolio_admin()))
  with check ((select private.is_portfolio_admin()));

create policy entry_tags_public_read
  on public.entry_tags for select to anon, authenticated
  using (
    exists (
      select 1
      from public.portfolio_entries as entry
      join public.portfolio_categories as category on category.id = entry.category_id
      where entry.id = entry_tags.entry_id
        and entry.status = 'published'
        and category.is_visible
    )
  );

create policy entry_tags_admin_manage
  on public.entry_tags for all to authenticated
  using ((select private.is_portfolio_admin()))
  with check ((select private.is_portfolio_admin()));

insert into public.profile (id, display_name)
values (1, 'Your Name')
on conflict (id) do nothing;

insert into public.portfolio_categories (name, slug, description, sort_order)
values
  ('Websites', 'websites', '', 10),
  ('Graphic Design', 'graphic-design', '', 20),
  ('Drawings', 'drawings', '', 30),
  ('QA Automation', 'qa-automation', '', 40),
  ('Funnels', 'funnels', '', 50)
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy portfolio_media_public_and_admin_read
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'portfolio-media'
    and name like 'portfolio/%'
    and (
      (select private.is_portfolio_admin())
      or exists (
        select 1
        from public.profile as profile
        where profile.id = 1 and profile.avatar_path = storage.objects.name
      )
      or exists (
        select 1
        from public.portfolio_entries as entry
        join public.portfolio_categories as category on category.id = entry.category_id
        where entry.thumbnail_path = storage.objects.name
          and entry.status = 'published'
          and category.is_visible
      )
      or exists (
        select 1
        from public.portfolio_media as media
        join public.portfolio_entries as entry on entry.id = media.entry_id
        join public.portfolio_categories as category on category.id = entry.category_id
        where media.object_path = storage.objects.name
          and entry.status = 'published'
          and category.is_visible
      )
    )
  );

create policy portfolio_media_admin_upload
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio-media'
    and name like 'portfolio/%'
    and (select private.is_portfolio_admin())
  );

create policy portfolio_media_admin_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'portfolio-media'
    and name like 'portfolio/%'
    and (select private.is_portfolio_admin())
  )
  with check (
    bucket_id = 'portfolio-media'
    and name like 'portfolio/%'
    and (select private.is_portfolio_admin())
  );

create policy portfolio_media_admin_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'portfolio-media'
    and name like 'portfolio/%'
    and (select private.is_portfolio_admin())
  );

commit;
