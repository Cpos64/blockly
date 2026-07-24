-- Blockly database schema.
-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

-- Recurring routines (e.g. "Gym", every Mon/Wed/Fri at 7:00am for 60 min).
-- Each active routine gets materialized into `items` for a given date the
-- first time that date is opened in the planner (see src/lib/routines.ts).
create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  notes text,
  duration_minutes int not null default 30,
  start_time time, -- null = routine lands in the backlog, unscheduled
  days_of_week smallint[] not null default '{0,1,2,3,4,5,6}', -- 0=Sun .. 6=Sat
  color text not null default '#6366f1',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- A single day's tasks and time blocks. `start_time = null` means the item
-- lives in the unscheduled backlog rather than on the calendar grid.
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid references routines (id) on delete set null,
  date date not null,
  title text not null,
  notes text,
  start_time time,
  duration_minutes int not null default 30,
  completed boolean not null default false,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

create index if not exists items_user_date_idx on items (user_id, date);
create index if not exists routines_user_idx on routines (user_id);

-- Prevent a routine from being materialized twice for the same day.
create unique index if not exists items_routine_date_unique
  on items (user_id, routine_id, date)
  where routine_id is not null;

alter table routines enable row level security;
alter table items enable row level security;

create policy "routines: owner select" on routines
  for select using (auth.uid() = user_id);
create policy "routines: owner insert" on routines
  for insert with check (auth.uid() = user_id);
create policy "routines: owner update" on routines
  for update using (auth.uid() = user_id);
create policy "routines: owner delete" on routines
  for delete using (auth.uid() = user_id);

create policy "items: owner select" on items
  for select using (auth.uid() = user_id);
create policy "items: owner insert" on items
  for insert with check (auth.uid() = user_id);
create policy "items: owner update" on items
  for update using (auth.uid() = user_id);
create policy "items: owner delete" on items
  for delete using (auth.uid() = user_id);
