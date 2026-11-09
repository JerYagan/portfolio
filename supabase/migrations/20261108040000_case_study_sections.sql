-- Keep each entry's ordered narrative sections with the entry record.
alter table public.portfolio_entries
  add column case_study_sections jsonb not null default '[]'::jsonb;

alter table public.portfolio_entries
  add constraint portfolio_entries_case_study_sections_check
  check (
    jsonb_typeof(case_study_sections) = 'array'
    and jsonb_array_length(case_study_sections) <= 12
  );
