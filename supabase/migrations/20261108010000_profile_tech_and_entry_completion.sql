begin;

alter table public.portfolio_entries
  add column completed_on date;

-- These three technologies were explicitly supplied as the owner's current stack.
-- Preserve any profile selections that already exist when this migration is applied.
update public.profile
set skills = '[{"id":"html5","status":"known"},{"id":"css3","status":"known"},{"id":"php","status":"known"}]'::jsonb
where id = 1
  and jsonb_typeof(skills) = 'array'
  and jsonb_array_length(skills) = 0;

commit;
