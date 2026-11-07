-- Add a reusable per-entry display layout without coupling behavior to category names.
alter table public.portfolio_entries
  add column presentation text not null default 'standard';

alter table public.portfolio_entries
  add constraint portfolio_entries_presentation_check
  check (presentation in ('standard', 'logofolio'));
