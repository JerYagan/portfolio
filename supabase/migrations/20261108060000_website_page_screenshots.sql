begin;

alter table public.portfolio_media
  add column page_name text,
  add column device_label text;

alter table public.portfolio_media
  drop constraint portfolio_media_role_check,
  add constraint portfolio_media_role_check
    check (media_role in ('presentation_board', 'logo_variation', 'supporting_image', 'page_screenshot')),
  add constraint portfolio_media_website_page_fields_check
    check (
      (media_role = 'page_screenshot'
        and page_name is not null
        and length(btrim(page_name)) between 1 and 80
        and device_label in ('desktop', 'tablet', 'mobile'))
      or (media_role <> 'page_screenshot' and page_name is null and device_label is null)
    );

commit;
