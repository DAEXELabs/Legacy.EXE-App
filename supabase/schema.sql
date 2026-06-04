-- Supabase Schema for Legacy.EXE Social
-- Run this in the Supabase SQL Editor after setting up your project.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar text,
  title text,
  level integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists chronicle_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  caption text not null,
  image_url text,
  visibility text default 'private' check (visibility in ('private', 'public')),
  encouragement_count integer default 0,
  xp integer default 25,
  created_at timestamptz default now()
);

create table if not exists connections (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists post_reactions (
  post_id uuid references chronicle_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  type text default 'encourage',
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- Row Level Security
alter table profiles enable row level security;
alter table chronicle_posts enable row level security;
alter table connections enable row level security;
alter table post_reactions enable row level security;

-- profiles: public read, user insert/update own
create policy profiles_public_read on profiles
  for select using (true);

create policy profiles_insert_own on profiles
  for insert with check (auth.uid() = id);

create policy profiles_update_own on profiles
  for update using (auth.uid() = id);

-- chronicle_posts: public read public, user full CRUD own
create policy chronicle_public_read on chronicle_posts
  for select using (visibility = 'public');

create policy chronicle_read_own on chronicle_posts
  for select using (auth.uid() = user_id);

create policy chronicle_insert_own on chronicle_posts
  for insert with check (auth.uid() = user_id);

create policy chronicle_update_own on chronicle_posts
  for update using (auth.uid() = user_id);

create policy chronicle_delete_own on chronicle_posts
  for delete using (auth.uid() = user_id);

-- connections: read own, insert/delete own
create policy connections_read_own on connections
  for select using (auth.uid() = follower_id or auth.uid() = following_id);

create policy connections_insert_own on connections
  for insert with check (auth.uid() = follower_id);

create policy connections_delete_own on connections
  for delete using (auth.uid() = follower_id);

-- post_reactions: read reactions, insert/delete own
create policy reactions_read on post_reactions
  for select using (true);

create policy reactions_insert_own on post_reactions
  for insert with check (auth.uid() = user_id);

create policy reactions_delete_own on post_reactions
  for delete using (auth.uid() = user_id);
