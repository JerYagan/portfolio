-- Raise the private portfolio media bucket limit from 8 MiB to 15 MiB.
update storage.buckets
set file_size_limit = 15728640
where id = 'portfolio-media';

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'portfolio-media') then
    raise exception 'The portfolio-media bucket must exist before applying the upload size migration.';
  end if;
end;
$$;
