import { Router, Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { getJSON, setJSON, invalidate, keys, TTL } from '../db/redis';
import { broadcastFrontChange } from '../ws/wsServer';
import { pushFrontToPK } from './pkFrontSync';
const router = Router();

// ── Shared helpers ────────────────────────────────────────────

const PLAYER_QUERY = (accountTable: string, uuidColumn: string) => `
  SELECT
    u.id AS user_id,
    u.system_name,
    u.discord_tag,
    a.${uuidColumn},
    COALESCE(json_agg(m ORDER BY m.name) FILTER (WHERE m.id IS NOT NULL), '[]') AS members,
    (
      SELECT json_build_object(
        'member_names', (
          SELECT json_agg(m2.name ORDER BY m2.name)
          FROM members m2 WHERE m2.id = ANY(fs.member_ids)
        ),
        'colors', (
          SELECT json_agg(m2.color ORDER BY m2.name)
          FROM members m2 WHERE m2.id = ANY(fs.member_ids)
        )
      )
      FROM fronting_sessions fs
      WHERE fs.user_id = u.id AND fs.ended_at IS NULL
      LIMIT 1
    ) AS active_front
  FROM ${accountTable} a
  JOIN users u ON u.id = a.user_id
  LEFT JOIN members m ON m.user_id = u.id
  WHERE a.${uuidColumn} = $1 AND a.enabled = true
  GROUP BY u.id, a.${uuidColumn}
`;

async function getUserIdByAccount(accountTable: string, uuidColumn: string, uuid: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT u.id FROM users u JOIN ${accountTable} a ON a.user_id = u.id WHERE a.${uuidColumn} = $1`,
    [uuid]
  );
  return result.rows[0]?.id ?? null;
}

async function switchFront(userId: string, memberNames: string[], cacheKey: string, res: Response) {
  const memberRes = await pool.query(
    `SELECT id FROM members WHERE user_id = $1 AND lower(name) = ANY($2::text[])`,
    [userId, memberNames.map((n: string) => n.toLowerCase())]
  );
  if (!memberRes.rows.length) return res.status(404).json({ error: 'No matching members' });

  const memberIds = memberRes.rows.map((r: any) => r.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE fronting_sessions SET ended_at = now() WHERE user_id = $1 AND ended_at IS NULL`,
      [userId]
    );
    const session = await client.query(
      `INSERT INTO fronting_sessions (user_id, member_ids) VALUES ($1, $2) RETURNING *`,
      [userId, memberIds]
    );
    await client.query('COMMIT');
    await invalidate(cacheKey);
    pushFrontToPK(userId, memberIds);
    broadcastFrontChange(userId);
    res.json({ ok: true, session: session.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function clearFront(userId: string, cacheKey: string, res: Response) {
  await pool.query(
    `UPDATE fronting_sessions SET ended_at = now() WHERE user_id = $1 AND ended_at IS NULL`,
    [userId]
  );
  await invalidate(cacheKey);
  pushFrontToPK(userId, []);
  broadcastFrontChange(userId);
  res.json({ ok: true });
}

// ── Minecraft routes ──────────────────────────────────────────

router.get('/player/minecraft/:uuid', async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const cacheKey = keys.player(uuid);

  const cached = await getJSON(cacheKey);
  if (cached) return res.json(cached);

  const result = await pool.query(PLAYER_QUERY('minecraft_accounts', 'minecraft_uuid'), [uuid]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Player not registered' });

  await setJSON(cacheKey, result.rows[0], TTL.PLAYER);
  res.json(result.rows[0]);
});

router.post('/player/minecraft/:uuid/front', async (req: Request, res: Response) => {
  const parsed = z.object({ member_names: z.array(z.string()).min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });

  const userId = await getUserIdByAccount('minecraft_accounts', 'minecraft_uuid', req.params.uuid);
  if (!userId) return res.status(404).json({ error: 'Player not registered' });

  await switchFront(userId, parsed.data.member_names, keys.player(req.params.uuid), res);
});

router.delete('/player/minecraft/:uuid/front', async (req: Request, res: Response) => {
  const userId = await getUserIdByAccount('minecraft_accounts', 'minecraft_uuid', req.params.uuid);
  if (!userId) return res.status(404).json({ error: 'Player not registered' });

  await clearFront(userId, keys.player(req.params.uuid), res);
});

// ── Hytale routes ─────────────────────────────────────────────

router.get('/player/hytale/:uuid', async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const cacheKey = keys.player(uuid);

  const cached = await getJSON(cacheKey);
  if (cached) return res.json(cached);

  const result = await pool.query(PLAYER_QUERY('hytale_accounts', 'hytale_uuid'), [uuid]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Player not registered' });

  await setJSON(cacheKey, result.rows[0], TTL.PLAYER);
  res.json(result.rows[0]);
});

router.post('/player/hytale/:uuid/front', async (req: Request, res: Response) => {
  const parsed = z.object({ member_names: z.array(z.string()).min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });

  const userId = await getUserIdByAccount('hytale_accounts', 'hytale_uuid', req.params.uuid);
  if (!userId) return res.status(404).json({ error: 'Player not registered' });

  await switchFront(userId, parsed.data.member_names, keys.player(req.params.uuid), res);
});

router.delete('/player/hytale/:uuid/front', async (req: Request, res: Response) => {
  const userId = await getUserIdByAccount('hytale_accounts', 'hytale_uuid', req.params.uuid);
  if (!userId) return res.status(404).json({ error: 'Player not registered' });

  await clearFront(userId, keys.player(req.params.uuid), res);
});

export default router;