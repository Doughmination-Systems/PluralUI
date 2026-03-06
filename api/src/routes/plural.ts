import { Router, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { invalidate, keys } from '../db/redis';

const router = Router();
const PLURAL = 'https://api.plural.gg';
const UA = 'PluralCloud/2.0';

// ── helpers ───────────────────────────────────────────────────

// plural.gg color is an integer (e.g. 16777065) — convert to hex
function intToHex(n: number | null): string | null {
  if (n == null) return null;
  return n.toString(16).padStart(6, '0');
}

// Avatar URL from hash
function avatarUrl(memberId: string, hash: string | null): string | null {
  if (!hash) return null;
  return `https://cdn.plural.gg/images/${memberId}/${hash}.webp`;
}

async function getUserId(token: string): Promise<string | null> {
  try {
    const r = await axios.get(`${PLURAL}/application`, {
      headers: { Authorization: token, 'User-Agent': UA },
    });
    // Application endpoint tells us the developer/authorized user
    // We need to get the current user differently — fetch members with @me
    return r.data.developer ?? null;
  } catch { return null; }
}

async function syncMembersFromPlural(userId: string, token: string, pluralUserId: string) {
  // Paginate through all members
  let skip = 0;
  const limit = 100;
  let allMembers: any[] = [];

  while (true) {
    const r = await axios.get(`${PLURAL}/members/${pluralUserId}/members`, {
      params: { limit, skip },
      headers: { Authorization: token, 'User-Agent': UA },
    });
    const batch: any[] = Array.isArray(r.data) ? r.data : [];
    allMembers = allMembers.concat(batch);
    if (batch.length < limit) break;
    skip += limit;
  }

  let imported = 0, skipped = 0;
  for (const m of allMembers) {
    const name: string = m.name;
    const color = intToHex(m.color ?? null);
    const avatar = avatarUrl(m.id, m.avatar ?? null);
    try {
      await pool.query(
        `INSERT INTO members
           (user_id, plural_member_id, name, pronouns, color, description, avatar_url, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'plural')
         ON CONFLICT (user_id, name) DO UPDATE SET
           plural_member_id = EXCLUDED.plural_member_id,
           pronouns         = EXCLUDED.pronouns,
           color            = EXCLUDED.color,
           description      = EXCLUDED.description,
           avatar_url       = EXCLUDED.avatar_url,
           source           = 'plural',
           updated_at       = now()`,
        [userId, m.id, name, m.pronouns ?? null, color,
          m.bio ?? null, avatar]
      );
      imported++;
    } catch { skipped++; }
  }
  return { imported, skipped };
}

async function invalidateUserAndPlayers(userId: string) {
  const mcRes = await pool.query(
    'SELECT minecraft_uuid FROM minecraft_accounts WHERE user_id = $1', [userId]
  );
  const playerKeys = mcRes.rows.map((r: any) => keys.player(r.minecraft_uuid));
  await invalidate(keys.userMe(userId), ...playerKeys);
}

// ── routes ────────────────────────────────────────────────────

// Link plural.gg token
// Flow: paste token -> we save it + send authorization request to their Discord DM -> they approve -> sync works
router.post('/link', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = z.object({ token: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });

  // Validate token
  let pluralUserId: string;
  try {
    const r = await axios.get(`${PLURAL}/application`, {
      headers: { Authorization: parsed.data.token, 'User-Agent': UA },
    });
    pluralUserId = r.data.developer;
    if (!pluralUserId) throw new Error('No user id');
  } catch (e: any) {
    const detail = e?.response?.data?.detail ?? e?.message ?? 'unknown';
    const status = e?.response?.status ?? 0;
    console.error('[plural.gg link] HTTP', status, detail);
    return res.status(401).json({ error: `plural.gg auth failed (${status}: ${detail})` });
  }

  // Save token first
  await pool.query(
    `UPDATE users SET plural_token = $1, plural_user_id = $2, updated_at = now() WHERE id = $3`,
    [parsed.data.token, pluralUserId, req.userId]
  );

  // Send authorization request to user via plural.gg DM
  // We use their Discord ID (pluralUserId is the Discord snowflake)
  let authNote = '';
  try {
    await axios.post(`${PLURAL}/users/${pluralUserId}/authorize`, null, {
      headers: { Authorization: parsed.data.token, 'User-Agent': UA },
    });
    authNote = ' Check your Discord DMs from the /plu/ral bot to approve access.';
  } catch (e: any) {
    const status = e?.response?.status;
    // 204 = already authorized, 202 = DM sent
    if (status !== 202 && status !== 204) {
      console.error('[plural.gg authorize] HTTP', status, e?.response?.data);
      authNote = ' (Could not send authorization DM — you may need to run /authorize in the bot manually)';
    }
  }

  await invalidate(keys.userMe(req.userId!));
  res.json({ ok: true, user_id: pluralUserId, note: authNote.trim() });
});

// Unlink plural.gg
router.delete('/link', requireAuth, async (req: AuthRequest, res: Response) => {
  await pool.query(
    `UPDATE users SET plural_token = NULL, plural_user_id = NULL,
                      plural_imported_at = NULL, updated_at = now()
     WHERE id = $1`,
    [req.userId]
  );
  await invalidate(keys.userMe(req.userId!));
  res.json({ ok: true });
});

// Import members (one-time lock)
router.post('/import', requireAuth, async (req: AuthRequest, res: Response) => {
  const row = await pool.query(
    'SELECT plural_token, plural_user_id, plural_imported_at FROM users WHERE id = $1',
    [req.userId]
  );
  const { plural_token: token, plural_user_id: pluralUserId, plural_imported_at } = row.rows[0] ?? {};
  if (!token) return res.status(400).json({ error: 'No plural.gg token linked' });
  if (plural_imported_at) return res.status(409).json({ error: 'Already imported. Use sync to update.' });

  const { imported, skipped } = await syncMembersFromPlural(req.userId!, token, pluralUserId);

  await pool.query(
    'UPDATE users SET plural_imported_at = now(), updated_at = now() WHERE id = $1',
    [req.userId]
  );
  await invalidateUserAndPlayers(req.userId!);
  res.json({ ok: true, imported, skipped });
});

// Sync (pull only — plural.gg has no front push endpoint)
router.post('/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  const row = await pool.query(
    'SELECT plural_token, plural_user_id, plural_imported_at FROM users WHERE id = $1',
    [req.userId]
  );
  const { plural_token: token, plural_user_id: pluralUserId, plural_imported_at } = row.rows[0] ?? {};
  if (!token) return res.status(400).json({ error: 'No plural.gg token linked' });
  if (!plural_imported_at) return res.status(400).json({ error: 'Import first before syncing' });

  const { imported, skipped } = await syncMembersFromPlural(req.userId!, token, pluralUserId);
  await invalidateUserAndPlayers(req.userId!);
  res.json({ ok: true, members_updated: imported, members_skipped: skipped, note: 'plural.gg does not support front push' });
});

export default router;