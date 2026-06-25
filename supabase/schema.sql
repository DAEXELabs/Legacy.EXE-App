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

-- direct_threads table
create table if not exists direct_threads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists direct_thread_members (
  thread_id uuid references direct_threads(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (thread_id, user_id)
);

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references direct_threads(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

-- newsletters table
create table if not exists newsletters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_label text default 'Legacy.EXE Developer',
  created_at timestamptz default now(),
  published boolean default false
);

-- user_blocks table
create table if not exists user_blocks (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  reason text,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- user_reports table
create table if not exists user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade,
  reported_user_id uuid references profiles(id) on delete cascade,
  post_id uuid references chronicle_posts(id) on delete set null,
  message_id uuid references direct_messages(id) on delete set null,
  reason text not null,
  details text,
  status text default 'open',
  created_at timestamptz default now()
);

-- code_of_conduct_acceptances table
create table if not exists code_of_conduct_acceptances (
  user_id uuid references profiles(id) on delete cascade primary key,
  accepted_at timestamptz default now(),
  version text default 'v1'
);

-- post_comments and post_comment_likes (referenced but missing)
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references chronicle_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  parent_id uuid references post_comments(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists post_comment_likes (
  comment_id uuid references post_comments(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (comment_id, user_id)
);

-- Legacy Houses (Guilds)
create table if not exists guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text unique not null,
  description text,
  icon text default '🏠',
  owner_id uuid references profiles(id) on delete cascade,
  min_level integer default 1,
  max_members integer default 20,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists guild_members (
  guild_id uuid references guilds(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'officer', 'member')),
  joined_at timestamptz default now(),
  primary key (guild_id, user_id)
);

create table if not exists guild_invites (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid references guilds(id) on delete cascade,
  inviter_id uuid references profiles(id) on delete cascade,
  invitee_id uuid references profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired')),
  expires_at timestamptz default now() + interval '7 days',
  created_at timestamptz default now()
);

create table if not exists guild_chat_messages (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid references guilds(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text not null,
  flagged boolean default false,
  moderation_status text default 'approved' check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

create table if not exists guild_achievements (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid references guilds(id) on delete cascade,
  name text not null,
  description text,
  icon text default '🏆',
  requirement_value integer default 1,
  requirement_type text not null,
  xp_reward integer default 0,
  unlocked_at timestamptz,
  created_at timestamptz default now()
);

-- Co-op Boss contributions
create table if not exists boss_party_contributions (
  id uuid primary key default gen_random_uuid(),
  boss_week integer not null,
  boss_name text not null,
  user_id uuid references profiles(id) on delete cascade,
  damage_dealt integer not null,
  contribution_source text not null,
  created_at timestamptz default now()
);

-- Weekly Leaderboard
create table if not exists weekly_leaderboard (
  id uuid primary key default gen_random_uuid(),
  week integer not null,
  user_id uuid references profiles(id) on delete cascade,
  total_xp integer default 0,
  quests_completed integer default 0,
  boss_damage integer default 0,
  rank integer,
  archetype text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (week, user_id)
);

-- Row Level Security
alter table profiles enable row level security;
alter table chronicle_posts enable row level security;
alter table connections enable row level security;
alter table post_reactions enable row level security;
alter table direct_threads enable row level security;
alter table direct_thread_members enable row level security;
alter table direct_messages enable row level security;
alter table newsletters enable row level security;
alter table user_blocks enable row level security;
alter table user_reports enable row level security;
alter table code_of_conduct_acceptances enable row level security;
alter table post_comments enable row level security;
alter table post_comment_likes enable row level security;
alter table guilds enable row level security;
alter table guild_members enable row level security;
alter table guild_invites enable row level security;
alter table guild_chat_messages enable row level security;
alter table guild_achievements enable row level security;
alter table boss_party_contributions enable row level security;
alter table weekly_leaderboard enable row level security;

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

-- RLS policies for direct_threads: users can read threads they are members of
create policy direct_threads_read_members on direct_threads
  for select using (
    exists (select 1 from direct_thread_members where thread_id = id and user_id = auth.uid())
  );

-- RLS policies for direct_thread_members
create policy direct_thread_members_read_own on direct_thread_members
  for select using (user_id = auth.uid());

create policy direct_thread_members_insert_own on direct_thread_members
  for insert with check (user_id = auth.uid());

create policy direct_thread_members_delete_own on direct_thread_members
  for delete using (user_id = auth.uid());

-- RLS policies for direct_messages: users can read/insert only in threads they are members of
create policy direct_messages_read_members on direct_messages
  for select using (
    exists (
      select 1 from direct_thread_members
      where thread_id = direct_messages.thread_id and user_id = auth.uid()
    )
  );

create policy direct_messages_insert_members on direct_messages
  for insert with check (
    exists (
      select 1 from direct_thread_members
      where thread_id = direct_messages.thread_id and user_id = auth.uid()
    )
    and sender_id = auth.uid()
  );

create policy direct_messages_update_own on direct_messages
  for update using (sender_id = auth.uid());

-- RLS policies for newsletters: read published only
create policy newsletters_read_published on newsletters
  for select using (published = true);

-- RLS policies for user_blocks
create policy user_blocks_read_own on user_blocks
  for select using (blocker_id = auth.uid() or blocked_id = auth.uid());

create policy user_blocks_insert_own on user_blocks
  for insert with check (blocker_id = auth.uid());

create policy user_blocks_delete_own on user_blocks
  for delete using (blocker_id = auth.uid());

-- RLS policies for user_reports
create policy user_reports_create on user_reports
  for insert with check (reporter_id = auth.uid());

create policy user_reports_read_own on user_reports
  for select using (reporter_id = auth.uid() or reported_user_id = auth.uid());

-- RLS policies for code_of_conduct_acceptances
create policy coc_read_own on code_of_conduct_acceptances
  for select using (user_id = auth.uid());

create policy coc_insert_own on code_of_conduct_acceptances
  for insert with check (user_id = auth.uid());

create policy coc_update_own on code_of_conduct_acceptances
  for update using (user_id = auth.uid());

-- RLS policies for post_comments
create policy comments_read_all on post_comments
  for select using (true);

create policy comments_insert_own on post_comments
  for insert with check (auth.uid() = user_id);

create policy comments_update_own on post_comments
  for update using (auth.uid() = user_id);

create policy comments_delete_own on post_comments
  for delete using (auth.uid() = user_id);

-- RLS policies for post_comment_likes
create policy comment_likes_read_all on post_comment_likes
  for select using (true);

create policy comment_likes_insert_own on post_comment_likes
  for insert with check (auth.uid() = user_id);

create policy comment_likes_delete_own on post_comment_likes
  for delete using (auth.uid() = user_id);

-- RLS policies for guilds
create policy guilds_read_public on guilds
  for select using (true);

create policy guilds_insert_own on guilds
  for insert with check (auth.uid() = owner_id);

create policy guilds_update_own on guilds
  for update using (
    auth.uid() = owner_id
    or exists (
      select 1 from guild_members
      where guild_id = id and user_id = auth.uid() and role in ('owner', 'officer')
    )
  );

create policy guilds_delete_own on guilds
  for delete using (auth.uid() = owner_id);

-- RLS policies for guild_members
create policy guild_members_read_guild on guild_members
  for select using (
    exists (
      select 1 from guild_members gm2
      where gm2.guild_id = guild_id and gm2.user_id = auth.uid()
    )
  );

create policy guild_members_insert_guild on guild_members
  for insert with check (
    exists (
      select 1 from guild_invites
      where guild_id = guild_id and invitee_id = auth.uid() and status = 'accepted'
    )
    or exists (
      select 1 from guilds
      where id = guild_id and owner_id = auth.uid()
    )
  );

create policy guild_members_delete_own on guild_members
  for delete using (auth.uid() = user_id);

-- RLS policies for guild_invites
create policy guild_invites_read_guild on guild_invites
  for select using (
    auth.uid() = inviter_id
    or auth.uid() = invitee_id
    or exists (
      select 1 from guild_members
      where guild_id = guild_id and user_id = auth.uid() and role in ('owner', 'officer')
    )
  );

create policy guild_invites_insert_officer on guild_invites
  for insert with check (
    exists (
      select 1 from guild_members
      where guild_id = guild_id and user_id = auth.uid() and role in ('owner', 'officer')
    )
  );

create policy guild_invites_update_own on guild_invites
  for update using (auth.uid() = invitee_id);

create policy guild_invites_delete_own on guild_invites
  for delete using (auth.uid() = inviter_id or auth.uid() = invitee_id);

-- RLS policies for guild_chat_messages
create policy guild_chat_read_members on guild_chat_messages
  for select using (
    exists (
      select 1 from guild_members
      where guild_id = guild_id and user_id = auth.uid()
    )
    and moderation_status = 'approved'
  );

create policy guild_chat_insert_members on guild_chat_messages
  for insert with check (
    exists (
      select 1 from guild_members
      where guild_id = guild_id and user_id = auth.uid()
    )
    and sender_id = auth.uid()
  );

-- RLS policies for guild_achievements
create policy guild_achievements_read_members on guild_achievements
  for select using (
    exists (
      select 1 from guild_members
      where guild_id = guild_id and user_id = auth.uid()
    )
  );

create policy guild_achievements_update_guild on guild_achievements
  for update using (
    exists (
      select 1 from guild_members
      where guild_id = guild_id and user_id = auth.uid() and role in ('owner', 'officer')
    )
  );

-- RLS policies for boss_party_contributions
create policy party_contributions_read_all on boss_party_contributions
  for select using (true);

create policy party_contributions_insert_own on boss_party_contributions
  for insert with check (auth.uid() = user_id);

-- RLS policies for weekly_leaderboard
create policy leaderboard_read_all on weekly_leaderboard
  for select using (true);

create policy leaderboard_insert_own on weekly_leaderboard
  for insert with check (auth.uid() = user_id);

create policy leaderboard_update_own on weekly_leaderboard
  for update using (auth.uid() = user_id);