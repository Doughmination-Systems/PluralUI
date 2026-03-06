import { Router, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { invalidate, keys } from '../db/redis';

const router = Router();
const PK = 'https://api.pluralkit.me/v2';
const UA = 'PluralCloud/2.0 (plural.example.com)';

// Link PluralKit token
router.post('/link', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = z.object({ token: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });

  let systemId: string;
  try {
    const r = await axios.get(`${PK}/systems/@me`, {
      headers: { Authorization: parsed.data.token, 'User-Agent': UA },
    });
    systemId = r.data.id;
  } catch {
    return res.status(401).json({ error: 'Invalid PluralKit token' });
  }

  await pool.query(
    `UPDATE users SET pluralkit_token = $1, pk_system_id = $2, updated_at = now() WHERE id = $3`,
    [parsed.data.token, systemId, req.userId]
  );
  await invalidate(keys.userMe(req.userId!));
  res.json({ ok: true, system_id: systemId });
});

// Unlink PluralKit
router.delete('/link', requireAuth, async (req: AuthRequest, res: Response) => {
  await pool.query(
    `UPDATE users SET pluralkit_token = NULL, pk_system_id = NULL,
                      pk_imported_at = NULL, updated_at = now()
     WHERE id = $1`,
    [req.userId]
  );
  await invalidate(keys.userMe(req.userId!));
  res.json({ ok: true });
});

// Import members (one-time)
router.post('/import', requireAuth, async (req: AuthRequest, res: Response) => {
  const row = await pool.query(
    'SELECT pluralkit_token, pk_imported_at FROM users WHERE id = $1',
    [req.userId]
  );
  const { pluralkit_token: token, pk_imported_at } = row.rows[0] ?? {};
  if (!token) return res.status(400).json({ error: 'No PluralKit token linked' });
  if (pk_imported_at) return res.status(409).json({ error: 'Already imported. Use sync to update.' });

  const { imported, skipped } = await syncMembersFromPK(req.userId!, token);

  await pool.query(
    'UPDATE users SET pk_imported_at = now(), updated_at = now() WHERE id = $1',
    [req.userId]
  );

  // Invalidate user cache + all linked MC account player caches
  await invalidateUserAndPlayers(req.userId!);
  res.json({ ok: true, imported, skipped });
});

// Bidirectional sync
router.post('/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  const row = await pool.query(
    'SELECT pluralkit_token, pk_imported_at FROM users WHERE id = $1',
    [req.userId]
  );
  const { pluralkit_token: token, pk_imported_at } = row.rows[0] ?? {};
  if (!token) return res.status(400).json({ error: 'No PluralKit token linked' });
  if (!pk_imported_at) return res.status(400).json({ error: 'Import first before syncing' });

  // Pull from PK
  const { imported, skipped } = await syncMembersFromPK(req.userId!, token);

  // Push current front to PK
  let pushedFront = 0;
  const frontRes = await pool.query(
    `SELECT m.pk_member_id
     FROM active_fronts af
     JOIN members m ON m.id = ANY(af.member_ids)
     WHERE af.user_id = $1 AND m.pk_member_id IS NOT NULL`,
    [req.userId]
  );
  const pkIds: string[] = frontRes.rows.map((r: any) => r.pk_member_id);
  if (pkIds.length > 0) {
    await axios.post(
      `${PK}/systems/@me/switches`,
      { members: pkIds },
      { headers: { Authorization: token, 'User-Agent': UA } }
    );
    pushedFront = pkIds.length;
  }

  // Invalidate caches — member data may have changed
  await invalidateUserAndPlayers(req.userId!);
  res.json({ ok: true, members_updated: imported, members_skipped: skipped, front_pushed: pushedFront });
});

// ── helpers ───────────────────────────────────────────────────

async function syncMembersFromPK(userId: string, token: string) {
  const r = await axios.get(`${PK}/systems/@me/members`, {
    headers: { Authorization: token, 'User-Agent': UA },
  });
  const pkMembers: any[] = r.data;
  let imported = 0, skipped = 0;
  for (const m of pkMembers) {
    const color = (m.color as string | null)?.replace('#', '') ?? null;
    try {
      await pool.query(
        `INSERT INTO members (user_id, pk_member_id, name, display_name, pronouns, color, description, avatar_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (user_id, name) DO UPDATE SET
           pk_member_id = EXCLUDED.pk_member_id,
           display_name = EXCLUDED.display_name,
           pronouns     = EXCLUDED.pronouns,
           color        = EXCLUDED.color,
           description  = EXCLUDED.description,
           avatar_url   = EXCLUDED.avatar_url,
           updated_at   = now()`,
        [userId, m.id, m.name, m.display_name ?? null, m.pronouns ?? null,
          color, m.description ?? null, m.avatar_url ?? null]
      );
      imported++;
    } catch { skipped++; }
  }
  return { imported, skipped };
}

// Invalidate user cache AND all player caches for every linked MC account
async function invalidateUserAndPlayers(userId: string) {
  const mcRes = await pool.query(
    'SELECT minecraft_uuid FROM minecraft_accounts WHERE user_id = $1',
    [userId]
  );
  const playerKeys = mcRes.rows.map((r: any) => keys.player(r.minecraft_uuid));
  await invalidate(keys.userMe(userId), ...playerKeys);
}

export default router;
