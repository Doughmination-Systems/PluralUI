import { Router, Response } from 'express';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Current user ──────────────────────────────────────────────

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.discord_id, u.discord_tag, u.discord_avatar,
         u.pk_system_id,  (u.pluralkit_token IS NOT NULL)  AS pk_linked,  (u.pk_imported_at  IS NOT NULL) AS pk_imported,
         u.sp_system_id,  (u.sp_token IS NOT NULL)         AS sp_linked,  (u.sp_imported_at  IS NOT NULL) AS sp_imported,
         u.plural_user_id,(u.plural_token IS NOT NULL)     AS plural_linked, u.plural_app,   (u.plural_imported_at IS NOT NULL) AS plural_imported,
         COALESCE((
           SELECT json_agg(jsonb_build_object('id', m.id, 'minecraft_uuid', m.minecraft_uuid, 'minecraft_name', m.minecraft_name, 'linked_at', m.linked_at) ORDER BY m.minecraft_name)
           FROM minecraft_accounts m WHERE m.user_id = u.id
         ), '[]') AS minecraft_accounts,
         COALESCE((
           SELECT json_agg(jsonb_build_object('id', h.id, 'hytale_uuid', h.hytale_uuid, 'hytale_name', h.hytale_name, 'linked_at', h.linked_at, 'enabled', h.enabled) ORDER BY h.hytale_name)
           FROM hytale_accounts h WHERE h.user_id = u.id
         ), '[]') AS hytale_accounts
       FROM users u
       WHERE u.id = $1`,
      [req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Current front ─────────────────────────────────────────────

router.get('/me/front', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT af.session_id, af.started_at,
         COALESCE(json_agg(jsonb_build_object(
           'id', m.id, 'name', m.name, 'display_name', m.display_name,
           'avatar_url', m.avatar_url, 'color', m.color, 'pronouns', m.pronouns
         )) FILTER (WHERE m.id IS NOT NULL), '[]') AS members
       FROM active_fronts af
       LEFT JOIN members m ON m.id = ANY(af.member_ids) AND m.user_id = $1
       WHERE af.user_id = $1
       GROUP BY af.session_id, af.started_at`,
      [req.userId]
    );
    res.json(result.rows[0] ?? null);
  } catch (err) {
    console.error('GET /me/front error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update plural app ─────────────────────────────────────────

router.post('/me/plural-app', requireAuth, async (req: AuthRequest, res: Response) => {
  const { app } = req.body;
  if (!['pluralkit', 'simplyplural', 'plural'].includes(app)) {
    return res.status(400).json({ error: 'Invalid app' });
  }
  try {
    await pool.query('DELETE FROM members WHERE user_id = $1', [req.userId]);
    await pool.query(
      'UPDATE users SET plural_app = $1, updated_at = now() WHERE id = $2',
      [app, req.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /me/plural-app error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Toggle Minecraft account ──────────────────────────────────

router.patch('/me/minecraft/:uuid/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE minecraft_accounts SET enabled = NOT enabled
       WHERE minecraft_uuid = $1 AND user_id = $2
       RETURNING enabled`,
      [req.params.uuid, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Account not found' });
    res.json({ enabled: result.rows[0].enabled });
  } catch (err) {
    console.error('PATCH /me/minecraft toggle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Toggle Hytale account ─────────────────────────────────────

router.patch('/me/hytale/:uuid/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE hytale_accounts SET enabled = NOT enabled
       WHERE hytale_uuid = $1 AND user_id = $2
       RETURNING enabled`,
      [req.params.uuid, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Account not found' });
    res.json({ enabled: result.rows[0].enabled });
  } catch (err) {
    console.error('PATCH /me/hytale toggle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Unlink Minecraft account ──────────────────────────────────

router.delete('/me/minecraft/:uuid', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM minecraft_accounts WHERE minecraft_uuid = $1 AND user_id = $2 RETURNING id',
      [req.params.uuid, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Account not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /me/minecraft error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Unlink Hytale account ─────────────────────────────────────

router.delete('/me/hytale/:uuid', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM hytale_accounts WHERE hytale_uuid = $1 AND user_id = $2 RETURNING id',
      [req.params.uuid, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Account not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /me/hytale error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;