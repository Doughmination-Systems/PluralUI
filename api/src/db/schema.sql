CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core user: identified by Discord
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id      VARCHAR(30) UNIQUE NOT NULL,
  discord_tag     VARCHAR(100) NOT NULL,   -- username#discrim or new username
  discord_avatar  TEXT,
  pluralkit_token TEXT,                    -- PK system token (never returned to client)
  pk_system_id    VARCHAR(10),             -- PK system short ID, cached
  pk_imported_at  TIMESTAMPTZ,             -- set on first import; locks import button
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Linked Minecraft accounts (many per user, all share same system)
CREATE TABLE IF NOT EXISTS minecraft_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minecraft_uuid  VARCHAR(36) UNIQUE NOT NULL,
  minecraft_name  VARCHAR(32) NOT NULL,
  linked_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Members (owned by user, sourced from PK or future apps)
CREATE TABLE IF NOT EXISTS members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pk_member_id    VARCHAR(10),
  name            TEXT NOT NULL,
  display_name    TEXT,
  pronouns        TEXT,
  color           CHAR(6),
  description     TEXT,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- Fronting sessions (supports co-fronting)
CREATE TABLE IF NOT EXISTS fronting_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_ids      UUID[] NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ
);

-- Active front view
CREATE OR REPLACE VIEW active_fronts AS
  SELECT DISTINCT ON (user_id)
    user_id, id AS session_id, member_ids, started_at
  FROM fronting_sessions
  WHERE ended_at IS NULL
  ORDER BY user_id, started_at DESC;

CREATE INDEX IF NOT EXISTS idx_mc_accounts_uuid   ON minecraft_accounts(minecraft_uuid);
CREATE INDEX IF NOT EXISTS idx_mc_accounts_user   ON minecraft_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_members_user       ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_front_open         ON fronting_sessions(user_id) WHERE ended_at IS NULL;
