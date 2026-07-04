-- Drop the open anon policy from migration 001
drop policy if exists "anon full access" on lifehub_data;

-- Only authenticated users can read/write their own rows
create policy "users manage own data"
  on lifehub_data
  for all
  to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
