begin;

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']::text[]
where id = 'portfolio-media';

alter table public.portfolio_media
  add constraint portfolio_media_pdf_presentation_board_check
    check (lower(object_path) not like '%.pdf' or media_role = 'presentation_board');

commit;
