-- Give each gallery item a deliberate role for logofolio and standard project layouts.
alter table public.portfolio_media
  add column media_role text not null default 'supporting_image';

alter table public.portfolio_media
  add constraint portfolio_media_role_check
  check (media_role in ('presentation_board', 'logo_variation', 'supporting_image'));

create unique index portfolio_media_one_board_per_entry_idx
  on public.portfolio_media (entry_id)
  where media_role = 'presentation_board';

-- Preserve the existing logofolio convention: its first ordered image was the board.
with ranked_media as (
  select media.id, entry.presentation,
    row_number() over (
      partition by media.entry_id
      order by media.sort_order asc, media.created_at asc, media.id asc
    ) as position
  from public.portfolio_media as media
  join public.portfolio_entries as entry on entry.id = media.entry_id
)
update public.portfolio_media as media
set media_role = case
  when ranked_media.presentation = 'logofolio' and ranked_media.position = 1 then 'presentation_board'
  when ranked_media.presentation = 'logofolio' then 'logo_variation'
  else 'supporting_image'
end
from ranked_media
where ranked_media.id = media.id;
