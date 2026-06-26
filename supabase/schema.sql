-- Legacy.EXE Social Schema (Consolidated)
create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar text,
  title text,
  archetype text check (archetype in ('warrior','builder','scholar')),
  level integer default 1,
  xp integer default 0,
  created_at timestamptz default now()
);

-- Chronicle Posts (Social Feed)
create table if not exists chronicle_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  caption text,
  image_url text,
  archetype text,
  likes integer default 0,
  created_at timestamptz default now()
);

-- Friends / Connections
create table if not exists connections (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- Post Comments (Threading)
create table if not exists post_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references chronicle_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  parent_id uuid references post_comments(id) on delete cascade,
  created_at timestamptz default now()
);

-- Guilds / Legacy Houses
create table if not exists guilds (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  owner_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists guild_members (
  guild_id uuid references guilds(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  primary key (guild_id, user_id)
);

-- Boss Contributions
create table if not exists boss_contributions (
  id uuid primary key default uuid_generate_v4(),
  week integer not null,
  user_id uuid references profiles(id) on delete cascade,
  damage integer not null,
  created_at timestamptz default now()
);

-- Leaderboard (Weekly)
create table if not exists weekly_leaderboard (
  id uuid primary key default uuid_generate_v4(),
  week integer not null,
  user_id uuid references profiles(id) on delete cascade,
  total_xp integer default 0,
  rank integer,
  archetype text,
  unique (week, user_id)
);

-- RLS (Basic Secure Policies)
alter table chronicle_posts enable row level security;
-- Add policies for read/insert own, etc. (expand as needed)
create table if not exists direct_threads (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now()
);

create table if not exists direct_thread_members (
  thread_id uuid references direct_threads(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (thread_id, user_id)
);

create table if not exists direct_messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid references direct_threads(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- RLS for messages
alter table direct_threads enable row level security;
alter table direct_thread_members enable row level security;
alter table direct_messages enable row level security;

-- Basic RLS policies (expand as needed)
create policy "Users can view their threads" on direct_threads
  for select using (
    exists (select 1 from direct_thread_members where thread_id = id and user_id = auth.uid())
  );

create policy "Users can view their thread members" on direct_thread_members
  for select using (user_id = auth.uid());

create policy "Users can insert their messages" on direct_messages
  for insert with check (sender_id = auth.uid());