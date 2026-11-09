-- Optional local/development demo content. This creates a private draft and is safe to rerun.
-- Apply 20261108050000_entry_project_status.sql first. Replace or delete this example before publishing.
do $$
declare
  website_category_id uuid;
begin
  select id into website_category_id
  from public.portfolio_categories
  where slug = 'websites'
  limit 1;

  if website_category_id is null then
    raise exception 'Create or restore the Websites category (slug: websites) before running this demo seed.';
  end if;

  insert into public.portfolio_entries (
    category_id,
    title,
    slug,
    summary,
    body_markdown,
    project_status,
    status,
    is_featured
  ) values (
    website_category_id,
    'Demo Website — Studio Landing Page',
    'demo-studio-website',
    'A fictional studio website entry for previewing the portfolio CMS and project detail page.',
    E'This is demo content. Replace the copy, project facts, links, and images with your own before publishing.\n\nUse the CMS to add a thumbnail, gallery images, tools, and case study details.',
    'in_progress',
    'draft',
    false
  )
  on conflict (slug) do nothing;
end;
$$;
