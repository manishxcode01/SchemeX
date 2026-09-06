create table if not exists public.schemes (
  id text primary key,
  payload jsonb not null,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'user')) default 'user',
  created_at timestamptz not null default now()
);

create unique index if not exists one_admin_role on public.user_roles (role)
where role = 'admin';

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

alter table public.schemes enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "Published schemes are public" on public.schemes;
drop policy if exists "Users can read their profile" on public.profiles;
drop policy if exists "Users can update their profile" on public.profiles;
drop policy if exists "Users can read their role" on public.user_roles;
drop policy if exists "Admins can manage schemes" on public.schemes;
drop policy if exists "Admins can manage profiles" on public.profiles;
drop policy if exists "Admins can manage roles" on public.user_roles;

create policy "Published schemes are public" on public.schemes
  for select using (published = true);

create policy "Users can read their profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read their role" on public.user_roles
  for select using (auth.uid() = user_id);

create policy "Admins can manage schemes" on public.schemes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage roles" on public.user_roles
  for all using (public.is_admin()) with check (public.is_admin());

-- Run this after creating and confirming the administrator account.
do $$
declare admin_email text := 'manishxcode121@gmail.com';
begin
  insert into public.user_roles (user_id, role)
  select id, 'admin' from auth.users where email = admin_email
  on conflict (user_id) do update set role = 'admin';
end $$;

-- Run once from the Supabase SQL Editor after creating the admin account.
-- Example: select public.keep_only_admin('admin@example.com');
create or replace function public.keep_only_admin(admin_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare admin_id uuid;
begin
  select id into admin_id from auth.users where email = admin_email;
  if admin_id is null then
    raise exception 'No auth user exists for %', admin_email;
  end if;

  delete from auth.users where id <> admin_id;
  delete from public.user_roles;
  insert into public.user_roles (user_id, role) values (admin_id, 'admin');
end;
$$;

revoke all on function public.keep_only_admin(text) from public;

