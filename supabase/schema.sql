-- Apex Suite: Math Lab
-- Google ログイン後の進捗をデバイス間で同期するためのテーブル。
-- Supabase SQL Editor で実行してください。

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  total_xp integer not null default 0,
  streak_days integer not null default 0,
  last_active_date_iso text,
  energy integer not null default 100,
  max_energy integer not null default 100,
  last_energy_refill_date_iso text,
  cleared_pattern_ids jsonb not null default '[]'::jsonb,
  discovered_patterns jsonb not null default '[]'::jsonb,
  unlocked_weapon_ids jsonb not null default '[]'::jsonb,
  current_difficulty integer not null default 5,
  consecutive_correct integer not null default 0,
  consecutive_incorrect integer not null default 0,
  solution_notes jsonb not null default '{}'::jsonb,
  strategy_overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

create policy "user_progress_select_own"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

create policy "user_progress_insert_own"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

create policy "user_progress_update_own"
  on public.user_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_user_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_progress_updated_at on public.user_progress;
create trigger user_progress_updated_at
  before update on public.user_progress
  for each row
  execute procedure public.touch_user_progress_updated_at();
