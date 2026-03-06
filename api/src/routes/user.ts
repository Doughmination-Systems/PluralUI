import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getJSON, setJSON, invalidate, keys, TTL } from '../db/redis';

const router = Router();

// Full profile — cache-first
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const cacheKey = keys.userMe(req.userId!);
  const cached = await getJSON(cacheKey);
  if (cached) return res.json(cached);

  const result = await pool.query(
    `SELECT
       u.id, u.discord_id, u.discord_tag, u.discord_avatar,
       u.pk_system_id,
       u.pk_imported_at IS NOT NULL AS pk_imported,
       u.pluralkit_token IS NOT NULL  AS pk_linked,
       COALESCE(
         json_agg(ma ORDER BY ma.linked_at)
         FILTER (WHERE ma.id IS NOT NULL), '[]'
       ) AS minecraft_accounts
     FROM users u
     LEFT JOIN minecraft_accounts ma ON ma.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [req.userId]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });

  await setJSON(cacheKey, result.rows[0], TTL.USER_ME);
  res.json(result.rows[0]);
});

// Unlink a Minecraft account — invalidate both user and all player caches for that MC UUID
router.delete('/me/minecraft/:uuid', requireAuth, async (req: AuthRequest, res: Response) => {
  await pool.query(
    'DELETE FROM minecraft_accounts WHERE minecraft_uuid = $1 AND user_id = $2',
    [req.params.uuid, req.userId]
  );
  await invalidate(
    keys.userMe(req.userId!),
    keys.player(req.params.uuid)
  );
  res.json({ ok: true });
});

export default router;

// Current front for the dashboard
router.get('/me/front', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT
       af.started_at,
       COALESCE(json_agg(
         json_build_object(
           'id', m.id,
           'name', m.name,
           'display_name', m.display_name,
           'color', m.color,
           'avatar_url', m.avatar_url,
           'pronouns', m.pronouns
         ) ORDER BY m.name
       ) FILTER (WHERE m.id IS NOT NULL), '[]') AS members
     FROM active_fronts af
     JOIN members m ON m.id = ANY(af.member_ids)
     WHERE af.user_id = $1
     GROUP BY af.started_at`,
    [req.userId]
  );
  res.json(result.rows[0] ?? { members: [], started_at: null });
});