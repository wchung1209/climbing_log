-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (User display names)
create table public.profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. CLIMBS TABLE (The logs)
create table public.climbs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  grade text not null,
  attempts integer default 1,
  is_sent boolean default false,
  notes text,
  tags text[], -- Array of strings for "Crimpy", "Overhang", etc.
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Climbs
alter table public.climbs enable row level security;

-- Climbs Policies
create policy "Users can view own climbs"
  on climbs for select
  using ( auth.uid() = user_id );

create policy "Users can insert own climbs"
  on climbs for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own climbs"
  on climbs for update
  using ( auth.uid() = user_id );

create policy "Users can delete own climbs"
  on climbs for delete
  using ( auth.uid() = user_id );

-- 3. TRIGGER FOR NEW USERS (Optional, but good for auto-profile creation)
-- This function automatically creates a profile entry when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Climber'));
  return new;
end;
$$;

-- Trigger definition
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
