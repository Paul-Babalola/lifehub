-- LifeHub sync table
-- user_id is a client-generated random UUID (no Supabase Auth required)
create table if not exists lifehub_data (
  user_id   text         not null,
  key       text         not null,
  value     jsonb        not null,
  synced_at timestamptz  not null default now(),
  primary key (user_id, key)
);

alter table lifehub_data enable row level security;

-- Anon role gets full access.
-- Security relies on the random user_id UUID being private to each device.
create policy "anon full access"
  on lifehub_data
  for all
  to anon
  using (true)
  with check (true);
