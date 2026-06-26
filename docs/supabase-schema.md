# Legacy.EXE — Supabase Schema Reference

Consolidated schema for: **Social (Profiles)**, **Chronicle Posts**, **Friends**, **Guilds**, **Boss Contributions**, and **Leaderboards**.

This file is the canonical source-of-truth reference. The executable DDL lives in `supabase/schema.sql`.

---

## Tables

### `profiles`
| column | type | notes |
|---|---|---|
| id | uuid | PK, references `auth.users(id)` ON DELETE CASCADE |
| username | text | unique |
| display_name | text | |
| avatar | text | |
| title | text | |
| archetype | text | `warrior` \| `builder` \| `scholar` |
| level | int | default 1 |
| xp | int | default 0 |
| created_at | timestamptz | default now() |

### `chronicle_posts`
| column | type | notes |
|---|---|---|
| id | uuid | PK, auto-generated |
| user_id | uuid | FK → profiles |
| caption | text | |
| image_url | text | |
| archetype | text | |
| likes | int | default 0 |
| created_at | timestamptz | default now() |

### `connections` (Friends)
| column | type | notes |
|---|---|---|
| follower_id | uuid | FK → profiles |
| following_id | uuid | FK → profiles |
| created_at | timestamptz | default now() |
| **PK** | `(follower_id, following_id)` | composite |

### `post_comments`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| post_id | uuid | FK → chronicle_posts |
| user_id | uuid | FK → profiles |
| content | text | not null |
| parent_id | uuid | FK → post_comments (self-ref, threading) |
| created_at | timestamptz | |

### `guilds`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| name | text | not null |
| description | text | |
| owner_id | uuid | FK → profiles |
| created_at | timestamptz | |

### `guild_members`
| column | type | notes |
|---|---|---|
| guild_id | uuid | FK → guilds |
| user_id | uuid | FK → profiles |
| role | text | default `'member'` |
| **PK** | `(guild_id, user_id)` | composite |

### `boss_contributions`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| week | int | not null |
| user_id | uuid | FK → profiles |
| damage | int | not null |
| created_at | timestamptz | |

### `weekly_leaderboard`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| week | int | not null |
| user_id | uuid | FK → profiles |
| total_xp | int | default 0 |
| rank | int | |
| archetype | text | |
| **unique** | `(week, user_id)` | one entry per user per week |

---

## Row-Level Security Policies

> RLS is enabled on `chronicle_posts` in the bootstrap DLS. Apply the policies below via the Supabase SQL Editor or by extending `schema.sql`.

### chronicle_posts

```sql
-- Enable RLS
ALTER TABLE chronicle_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY "chronicle_posts_select" ON chronicle_posts
  FOR SELECT USING (true);

-- Only authenticated users can insert their own posts
CREATE POLICY "chronicle_posts_insert" ON chronicle_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only the owner can update or delete
CREATE POLICY "chronicle_posts_update" ON chronicle_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "chronicle_posts_delete" ON chronicle_posts
  FOR DELETE USING (auth.uid() = user_id);
```

### profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### connections

```sql
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections_select" ON connections FOR SELECT USING (true);

-- Only the follower can create/delete the connection
CREATE POLICY "connections_insert" ON connections
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "connections_delete" ON connections
  FOR DELETE USING (auth.uid() = follower_id);
```

### guild_members

```sql
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guild_members_select" ON guild_members FOR SELECT USING (true);

-- Owner manages members (requires joining guilds in app logic)
CREATE POLICY "guild_members_insert" ON guild_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM guilds
      WHERE guilds.id = guild_id AND guilds.owner_id = auth.uid()
    )
  );

CREATE POLICY "guild_members_delete" ON guild_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM guilds
      WHERE guilds.id = guild_id AND guilds.owner_id = auth.uid()
    )
  );
```

### post_comments, boss_contributions, weekly_leaderboard

Enable RLS and follow the same pattern: **public read, owner-only write/delete** where applicable.

```sql
ALTER TABLE post_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_leaderboard ENABLE ROW LEVEL SECURITY;
```

---

## How to Apply

1. **Initial setup** — run `supabase/schema.sql` in the Supabase SQL Editor (already provisioned).
2. **RLS policies** — run the `CREATE POLICY` blocks above in the same editor. Drop existing policies first if updating.
3. **RLS toggle** — if you need to bypass RLS temporarily (e.g., admin scripts), use the service-role key or `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`.
4. **Migration workflow** — for future schema changes, add migrations under `supabase/migrations/` (or your preferred migration tool) rather than re-running `schema.sql`.

---

## Quick Reference — Relationships

```
auth.users (1) ──< (1) profiles (1) ──< (∞) chronicle_posts
                                 │
                                 ├──< (∞) connections (self-join via profiles)
                                 ├──< (∞) post_comments
                                 ├──< (∞) guild_members ──> (1) guilds
                                 ├──< (∞) boss_contributions
                                 └──< (∞) weekly_leaderboard
```
