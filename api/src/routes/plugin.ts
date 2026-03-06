import { Router, Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';
import { getJSON, setJSON, invalidate, keys, TTL } from '../db/redis';

const router = Router();

// On player join: fetch system by MC UUID — cache-first
router.get('/player/:uuid', async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const cacheKey = keys.player(uuid);

  // Cache hit
  const cached = await getJSON(cacheKey);
  if (cached) return res.json(cached);

  // Cache miss — query Postgres
  const result = await pool.query(
    `SELECT
       u.id AS user_id,
       u.discord_tag,
       ma.minecraft_uuid,
       ma.minecraft_name,
       COALESCE(json_agg(m ORDER BY m.name) FILTER (WHERE m.id IS NOT NULL), '[]') AS members,
       (
         SELECT json_build_object(
           'member_names', (
             SELECT json_agg(m2.name ORDER BY m2.name)
             FROM members m2 WHERE m2.id = ANY(af.member_ids)
           ),
           'colors', (
             SELECT json_agg(m2.color ORDER BY m2.name)
             FROM members m2 WHERE m2.id = ANY(af.member_ids)
           )
         )
         FROM active_fronts af WHERE af.user_id = u.id
       ) AS active_front
     FROM minecraft_accounts ma
     JOIN users u ON u.id = ma.user_id
     LEFT JOIN members m ON m.user_id = u.id
     WHERE ma.minecraft_uuid = $1 AND ma.enabled = true
     GROUP BY u.id, ma.minecraft_uuid, ma.minecraft_name`,
    [uuid]
  );

  if (!result.rows[0]) return res.status(404).json({ error: 'Player not registered' });

  await setJSON(cacheKey, result.rows[0], TTL.PLAYER);
  res.json(result.rows[0]);
});

// Front switch — write to DB, then invalidate player cache so next join gets fresh data
router.post('/player/:uuid/front', async (req: Request, res: Response) => {
  const parsed = z.object({
    member_names: z.array(z.string()).min(1),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });

  const userRes = await pool.query(
    `SELECT u.id FROM users u
     JOIN minecraft_accounts ma ON ma.user_id = u.id
     WHERE ma.minecraft_uuid = $1`,
    [req.params.uuid]
  );
  if (!userRes.rows[0]) return res.status(404).json({ error: 'Player not registered' });
  const userId = userRes.rows[0].id;

  const memberRes = await pool.query(
    `SELECT id FROM members
     WHERE user_id = $1 AND lower(name) = ANY($2::text[])`,
    [userId, parsed.data.member_names.map((n: string) => n.toLowerCase())]
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

    // Invalidate player cache — active_front has changed
    await invalidate(keys.player(req.params.uuid));

    res.json({ ok: true, session: session.rows[0] });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// Clear front — invalidate cache
router.delete('/player/:uuid/front', async (req: Request, res: Response) => {
  const userRes = await pool.query(
    `SELECT u.id FROM users u
     JOIN minecraft_accounts ma ON ma.user_id = u.id
     WHERE ma.minecraft_uuid = $1`,
    [req.params.uuid]
  );
  if (!userRes.rows[0]) return res.status(404).json({ error: 'Player not registered' });

  await pool.query(
    `UPDATE fronting_sessions SET ended_at = now() WHERE user_id = $1 AND ended_at IS NULL`,
    [userRes.rows[0].id]
  );

  await invalidate(keys.player(req.params.uuid));
  res.json({ ok: true });
});

export default router;