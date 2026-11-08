begin;

alter table public.portfolio_entries
  add column completed_on date;
commit;
