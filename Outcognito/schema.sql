-- OUTCOGNITO — Supabase Schema
-- Run this in the Supabase SQL editor to set up the project.

-- 1. Create the searches table
create table if not exists searches (
  id          bigserial primary key,
  username    text not null,
  query       text not null,
  created_at  timestamptz not null default now()
);

-- 2. Index for fast recent-query lookups
create index if not exists searches_created_at_idx on searches (created_at desc);

-- 3. Enable Row Level Security
alter table searches enable row level security;

-- 4. Allow anyone to INSERT (this is the whole point — no auth)
create policy "Anyone can insert searches"
  on searches for insert
  with check (true);

-- 5. Allow anyone to SELECT (searches are public by design)
create policy "Anyone can read searches"
  on searches for select
  using (true);

-- 6. Enable Realtime for the searches table
-- Go to: Supabase Dashboard → Database → Replication
-- and toggle ON the 'searches' table,
-- OR run the following:
alter publication supabase_realtime add table searches;
