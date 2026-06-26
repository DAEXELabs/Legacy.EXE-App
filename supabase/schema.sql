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
  media_urls text[] default '{}',
  media_types text[] default '{}',
  archetype text,
  likes integer default 0,
  visibility text default 'public',
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

-- Guild Chat Messages (referenced by socialApi guild-chat functions)
create table if not exists guild_chat_messages (
  id uuid primary key default uuid_generate_v4(),
  guild_id uuid references guilds(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text not null,
  media_urls text[] default '{}',
  media_types text[] default '{}',
  created_at timestamptz default now()
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

-- ============================================================
-- Direct Messaging
-- ============================================================

create table if not exists direct_threads (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists direct_thread_members (
  thread_id uuid references direct_threads(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  read_at timestamptz,
  primary key (thread_id, user_id)
);

create table if not exists direct_messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid references direct_threads(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists direct_messages_thread_created_idx
  on direct_messages (thread_id, created_at);

create index if not exists direct_thread_members_user_idx
  on direct_thread_members (user_id);

-- ============================================================
-- RLS: Chronicle
-- ============================================================
alter table chronicle_posts enable row level security;

create policy "Chronicle: view all" on chronicle_posts
  for select using (true);

create policy "Chronicle: insert own" on chronicle_posts
  for insert with check (auth.uid() = user_id);

create policy "Chronicle: update own" on chronicle_posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Chronicle: delete own" on chronicle_posts
  for delete using (auth.uid() = user_id);

-- ============================================================
-- RLS: Guilds
-- ============================================================
alter table guilds enable row level security;
alter table guild_members enable row level security;
alter table guild_chat_messages enable row level security;

create policy "Guilds: view all" on guilds for select using (true);
create policy "Guilds: insert" on guilds for insert with check (auth.uid() = owner_id);
create policy "Guilds: update owner" on guilds for update using (auth.uid() = owner_id);
create policy "Guilds: delete owner" on guilds for delete using (auth.uid() = owner_id);

create policy "Guild members: view" on guild_members for select using (true);
create policy "Guild members: self add" on guild_members for insert with check (auth.uid() = user_id);
create policy "Guild members: self remove" on guild_members for delete using (auth.uid() = user_id);

create policy "Guild chat: view" on guild_chat_messages for select using (
  exists (select 1 from guild_members where guild_id = guild_chat_messages.guild_id and user_id = auth.uid())
);
create policy "Guild chat: insert" on guild_chat_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from guild_members where guild_id = guild_chat_messages.guild_id and user_id = auth.uid())
  );
create policy "Guild chat: delete own" on guild_chat_messages
  for delete using (sender_id = auth.uid());

-- ============================================================
-- RLS: Direct Messages
-- ============================================================
alter table direct_threads enable row level security;
alter table direct_thread_members enable row level security;
alter table direct_messages enable row level security;

-- Threads: visible to members
create policy "DM threads: view own" on direct_threads
  for select using (
    exists (select 1 from direct_thread_members where thread_id = direct_threads.id and user_id = auth.uid())
  );

-- Threads: no direct insert via RLS (created via find-or-create in app)
create policy "DM threads: insert" on direct_threads
  for insert with check (true);

-- Thread members: visible to members of the thread
create policy "DM members: view thread" on direct_thread_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from direct_thread_members dtm
      where dtm.thread_id = direct_thread_members.thread_id
      and dtm.user_id = auth.uid()
    )
  );

-- Thread members: self join or self leave
create policy "DM members: insert self" on direct_thread_members
  for insert with check (user_id = auth.uid());

create policy "DM members: delete self" on direct_thread_members
  for delete using (user_id = auth.uid());

-- Messages: visible to thread members
create policy "DM messages: view" on direct_messages
  for select using (
    exists (
      select 1 from direct_thread_members
      where thread_id = direct_messages.thread_id
      and user_id = auth.uid()
    )
  );

-- Messages: sender can insert
create policy "DM messages: insert own" on direct_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from direct_thread_members
      where thread_id = direct_messages.thread_id
      and user_id = auth.uid()
    )
  );

-- Messages: no update (immutable); sender can delete own
create policy "DM messages: delete own" on direct_messages
  for delete using (sender_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS (run in SQL editor or via migrations)
-- ============================================================
-- Note: storage.buckets requires the storage extension and is
-- usually created through Supabase dashboard / migration. Included
-- here for completeness.
-- insert into storage.buckets (id, name, public)
-- values ('media', 'media', true)
-- on conflict (id) do nothing;
