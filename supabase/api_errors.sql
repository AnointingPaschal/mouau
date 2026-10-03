-- API error log table
-- Run this in Supabase → SQL Editor

create table if not exists api_errors (
  id            uuid        primary key default gen_random_uuid(),
  route         text        not null,
  method        text        not null default 'POST',
  error_message text,
  error_stack   text,
  student_id    text,
  payload       jsonb,
  created_at    timestamptz not null default now()
);

-- Admin can read all, service role can insert
alter table api_errors enable row level security;

create policy "service role full access"
  on api_errors for all
  using (true)
  with check (true);

-- Auto-prune: keep last 1000 errors (optional trigger)
create or replace function prune_api_errors()
returns trigger language plpgsql as $$
begin
  delete from api_errors
  where id in (
    select id from api_errors
    order by created_at asc
    limit greatest(0, (select count(*) from api_errors) - 1000)
  );
  return new;
end;
$$;

create or replace trigger trg_prune_api_errors
  after insert on api_errors
  execute function prune_api_errors();
