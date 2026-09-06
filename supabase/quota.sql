-- Hive 0.0.1.5 — run this once in the Supabase SQL editor.
-- Lets the owner account (email contains samkomedved) see every profile
-- and reset / grant Hive Free token quota from the in-app Admin panel.

alter table public.profiles add column if not exists is_admin boolean not null default false;

update public.profiles
  set is_admin = true
  where email ilike '%samkomedved%';

create or replace function public.is_hive_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select p.is_admin or p.email ilike '%samkomedved%'
    from public.profiles p
    where p.id = auth.uid()
  ), false)
  or exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and coalesce(u.email, '') ilike '%samkomedved%'
  );
$$;

grant execute on function public.is_hive_admin() to anon, authenticated;

drop policy if exists "admin read profiles" on public.profiles;
create policy "admin read profiles"
  on public.profiles for select
  using (public.is_hive_admin());

drop policy if exists "admin update profiles" on public.profiles;
create policy "admin update profiles"
  on public.profiles for update
  using (public.is_hive_admin())
  with check (public.is_hive_admin());

create table if not exists public.usage_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  used bigint not null default 0,
  token_limit bigint not null default 1000000,
  bonus bigint not null default 0,
  started_at timestamptz,
  reset_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.usage_quotas enable row level security;

drop policy if exists "own quota read" on public.usage_quotas;
create policy "own quota read"
  on public.usage_quotas for select
  using (auth.uid() = user_id or public.is_hive_admin());

drop policy if exists "own quota write" on public.usage_quotas;
create policy "own quota write"
  on public.usage_quotas for insert
  with check (auth.uid() = user_id or public.is_hive_admin());

drop policy if exists "own quota update" on public.usage_quotas;
create policy "own quota update"
  on public.usage_quotas for update
  using (auth.uid() = user_id or public.is_hive_admin())
  with check (auth.uid() = user_id or public.is_hive_admin());
