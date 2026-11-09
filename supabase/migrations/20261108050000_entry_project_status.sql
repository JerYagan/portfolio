begin;

alter table public.portfolio_entries
  add column project_status text;

alter table public.portfolio_entries
  add constraint portfolio_entries_project_status_check
  check (project_status is null or project_status in ('in_progress', 'completed'));

commit;
