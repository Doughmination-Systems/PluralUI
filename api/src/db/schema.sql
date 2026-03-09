CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ─────────────────────────────────────────────────────
-- Core identity — at least one of discord_id or github_id must be set
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Discord (optional if GitHub is linked)
  discord_id          VARCHAR(30) UNIQUE,
  discord_tag         VARCHAR(100),
  discord_avatar      TEXT,

  -- GitHub (optional if Discord is linked)
  github_id           VARCHAR(30) UNIQUE,
  github_login        VARCHAR(100),
  github_avatar       TEXT,

  -- System identity
  system_name         VARCHAR(100),

  CONSTRAINT users_requires_identity CHECK (discord_id IS NOT NULL OR github_id IS NOT NULL),

  -- PluralKit
  pluralkit_token     TEXT,
  pk_system_id        VARCHAR(10),
  pk_imported_at      TIMESTAMPTZ,

  -- /plu/ral
  plural_token        TEXT,
  plural_user_id      TEXT,
  plural_imported_at  TIMESTAMPTZ,

  -- Which plural app is active
  plural_app          VARCHAR(20) DEFAULT NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Minecraft accounts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS minecraft_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minecraft_uuid  VARCHAR(36) UNIQUE NOT NULL,
  minecraft_name  VARCHAR(32) NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  linked_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Hytale accounts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hytale_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hytale_uuid  VARCHAR(36) UNIQUE NOT NULL,
  hytale_name  VARCHAR(64) NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT true,
  linked_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Members ───────────────────────────────────────────────────
-- Sourced from whichever plural app the user has selected
CREATE TABLE IF NOT EXISTS members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source            VARCHAR(20) DEFAULT 'pluralkit',
  pk_member_id      VARCHAR(10),
  plural_member_id  TEXT,
  name              TEXT NOT NULL,
  display_name      TEXT,
  pronouns          TEXT,
  color             CHAR(6),
  description       TEXT,
  avatar_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- ── Fronting sessions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fronting_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_ids  UUID[] NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ
);

-- ── HyAuth session state (temporary, TTL-expired) ─────────────
CREATE TABLE IF NOT EXISTS hytale_auth_sessions (
  session_id  VARCHAR(64) PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL
);

-- ── Views ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW active_fronts AS
  SELECT DISTINCT ON (user_id)
    user_id, id AS session_id, member_ids, started_at
  FROM fronting_sessions
  WHERE ended_at IS NULL
  ORDER BY user_id, started_at DESC;

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_github_id       ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_mc_accounts_uuid      ON minecraft_accounts(minecraft_uuid);
CREATE INDEX IF NOT EXISTS idx_mc_accounts_user      ON minecraft_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_hytale_accounts_uuid  ON hytale_accounts(hytale_uuid);
CREATE INDEX IF NOT EXISTS idx_hytale_accounts_user  ON hytale_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_members_user          ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_front_open            ON fronting_sessions(user_id) WHERE ended_at IS NULL;