import { Router, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { invalidate, keys } from '../db/redis';

const router = Router();
const SP = 'https://api.apparyllis.com/v1';
const UA = 'PluralCloud/2.0';

// Link Simply Plural token
router.post('/link', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = z.object({ token: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });

  // Validate by fetching system info
  let systemId: string;
  try {
    const r = await axios.get(`${SP}/me`, {
      headers: { Authorization: parsed.data.token, 'User-Agent': UA },
    });
    systemId = r.data.id ?? r.data.uid;
  } catch {
    return res.status(401).json({ error: 'Invalid Simply Plural token' });
  }

  await pool.query(
    `UPDATE users SET sp_token = $1, sp_system_id = $2, updated_at = now() WHERE id = $3`,
    [parsed.data.token, systemId, req.userId]
  );
  await invalidate(keys.userMe(req.userId!));
  res.json({ ok: true, system_id: systemId });
});

// Unlink Simply Plural
router.delete('/link', requireAuth, async (req: AuthRequest, res: Response) => {
  await pool.query(
    `UPDATE users SET sp_token = NULL, sp_system_id = NULL,
                      sp_imported_at = NULL, updated_at = now()
     WHERE id = $1`,
    [req.userId]
  );
  await invalidate(keys.userMe(req.userId!));
  res.json({ ok: true });
});

// Import members (one-time lock)
router.post('/import', requireAuth, async (req: AuthRequest, res: Response) => {
  const row = await pool.query(
    'SELECT sp_token, sp_system_id, sp_imported_at FROM users WHERE id = $1',
    [req.userId]
  );
  const { sp_token: token, sp_system_id: systemId, sp_imported_at } = row.rows[0] ?? {};
  if (!token) return res.status(400).json({ error: 'No Simply Plural token linked' });
  if (sp_imported_at) return res.status(409).json({ error: 'Already imported. Use sync to update.' });

  const { imported, skipped } = await syncMembersFromSP(req.userId!, token, systemId);

  await pool.query(
    'UPDATE users SET sp_imported_at = now(), updated_at = now() WHERE id = $1',
    [req.userId]
  );
  await invalidateUserAndPlayers(req.userId!);
  res.json({ ok: true, imported, skipped });
});

// Bidirectional sync
router.post('/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  const row = await pool.query(
    'SELECT sp_token, sp_system_id, sp_imported_at FROM users WHERE id = $1',
    [req.userId]
  );
  const { sp_token: token, sp_system_id: systemId, sp_imported_at } = row.rows[0] ?? {};
  if (!token) return res.status(400).json({ error: 'No Simply Plural token linked' });
  if (!sp_imported_at) return res.status(400).json({ error: 'Import first before syncing' });

  // Pull members from SP
  const { imported, skipped } = await syncMembersFromSP(req.userId!, token, systemId);

  // Push current front to SP
  let pushedFront = 0;
  const frontRes = await pool.query(
    `SELECT m.sp_member_id
     FROM active_fronts af
     JOIN members m ON m.id = ANY(af.member_ids)
     WHERE af.user_id = $1 AND m.sp_member_id IS NOT NULL`,
    [req.userId]
  );
  const spIds: string[] = frontRes.rows.map((r: any) => r.sp_member_id);
  if (spIds.length > 0) {
    // SP fronters: POST /v1/fronters/{systemId} with array of member ids
    await axios.post(
      `${SP}/fronters/${systemId}`,
      spIds.map(id => ({ id, live: true, startTime: Date.now(), endTime: null, customStatus: '' })),
      { headers: { Authorization: token, 'User-Agent': UA } }
    );
    pushedFront = spIds.length;
  }

  await invalidateUserAndPlayers(req.userId!);
  res.json({ ok: true, members_updated: imported, members_skipped: skipped, front_pushed: pushedFront });
});

// ── helpers ───────────────────────────────────────────────────

async function syncMembersFromSP(userId: string, token: string, systemId: string) {
  const r = await axios.get(`${SP}/members/${systemId}`, {
    headers: { Authorization: token, 'User-Agent': UA },
  });
  // SP returns { id, content: { name, pronouns, color, avatarUrl, desc, ... } }
  const members: any[] = Array.isArray(r.data) ? r.data : r.data.members ?? [];

  let imported = 0, skipped = 0;
  for (const m of members) {
    const content = m.content ?? m;
    const name: string = content.name;
    const color = content.color ? content.color.replace('#', '') : null;
    const avatarUrl = content.avatarUrl ?? content.avatar_url ?? null;
    try {
      await pool.query(
        `INSERT INTO members
           (user_id, sp_member_id, name, display_name, pronouns, color, description, avatar_url, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'simplyplural')
         ON CONFLICT (user_id, name) DO UPDATE SET
           sp_member_id = EXCLUDED.sp_member_id,
           pronouns     = EXCLUDED.pronouns,
           color        = EXCLUDED.color,
           description  = EXCLUDED.description,
           avatar_url   = EXCLUDED.avatar_url,
           source       = 'simplyplural',
           updated_at   = now()`,
        [userId, m.id, name, null, content.pronouns ?? null,
          color, content.desc ?? content.description ?? null, avatarUrl]
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

export default router;