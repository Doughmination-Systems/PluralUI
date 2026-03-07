import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const DISCORD_API = 'https://discord.com/api/v10';
const GITHUB_API  = 'https://api.github.com';
const MS_AUTH_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0';
const XBOX_AUTH_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_AUTH_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';
const MC_AUTH_URL = 'https://api.minecraftservices.com/authentication/login_with_xbox';
const MC_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';

// ── Discord login / link ──────────────────────────────────────
// ?link=<jwt>  → link Discord to existing account
// (no param)   → fresh login

router.get('/discord', (req: Request, res: Response) => {
  const { link } = req.query;
  const state = link ? `link:${link}` : 'login';
  const params = new URLSearchParams({
    client_id:     process.env.DISCORD_CLIENT_ID!,
    redirect_uri:  process.env.DISCORD_REDIRECT_URI!,
    response_type: 'code',
    scope:         'identify',
    state,
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

router.get('/discord/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;
  if (!code) return res.redirect(webUrl('/auth/error?reason=no_code'));

  try {
    const tokenRes = await axios.post(
      `${DISCORD_API}/oauth2/token`,
      new URLSearchParams({
        client_id:     process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type:    'authorization_code',
        code:          code as string,
        redirect_uri:  process.env.DISCORD_REDIRECT_URI!,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const userRes = await axios.get(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    });
    const { id: discordId, username, discriminator, avatar } = userRes.data;
    const discordTag = discriminator === '0' ? username : `${username}#${discriminator}`;
    const avatarUrl  = avatar
      ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`
      : null;

    // ── Link mode: attach Discord to an existing logged-in account ──
    if (typeof state === 'string' && state.startsWith('link:')) {
      const existingToken = state.slice(5);
      let linkUserId: string;
      try {
        const payload = jwt.verify(existingToken, process.env.JWT_SECRET!) as { userId: string };
        linkUserId = payload.userId;
      } catch {
        return res.redirect(webUrl('/auth/error?reason=invalid_link_token'));
      }

      // Make sure this Discord account isn't already linked to a different user
      const conflict = await pool.query(
        'SELECT id FROM users WHERE discord_id = $1 AND id != $2',
        [discordId, linkUserId]
      );
      if (conflict.rows[0]) {
        return res.redirect(webUrl('/settings/general?error=discord_already_linked'));
      }

      await pool.query(
        `UPDATE users SET discord_id = $1, discord_tag = $2, discord_avatar = $3, updated_at = now()
         WHERE id = $4`,
        [discordId, discordTag, avatarUrl, linkUserId]
      );
      return res.redirect(webUrl('/settings/general?success=discord_linked'));
    }

    // ── Login mode: find or create user by Discord ID ──
    const result = await pool.query(
      `INSERT INTO users (discord_id, discord_tag, discord_avatar)
       VALUES ($1, $2, $3)
       ON CONFLICT (discord_id) DO UPDATE
         SET discord_tag    = EXCLUDED.discord_tag,
             discord_avatar = EXCLUDED.discord_avatar,
             updated_at     = now()
       RETURNING id`,
      [discordId, discordTag, avatarUrl]
    );
    const userId = result.rows[0].id;
    const token  = jwt.sign({ userId, discordId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.redirect(webUrl(`/auth/success?token=${token}&tag=${encodeURIComponent(discordTag)}`));
  } catch (err: any) {
    console.error('Discord auth error:', err?.response?.data ?? err.message);
    res.redirect(webUrl('/auth/error?reason=discord_failed'));
  }
});

// ── GitHub login / link ───────────────────────────────────────
// ?link=<jwt>  → link GitHub to existing account
// (no param)   → fresh login

router.get('/github', (req: Request, res: Response) => {
  const { link } = req.query;
  const state = link ? `link:${link}` : 'login';
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    scope: 'read:user',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;
  if (!code) return res.redirect(webUrl('/auth/error?reason=no_code'));

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id:     process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri:  process.env.GITHUB_REDIRECT_URI!,
      },
      { headers: { Accept: 'application/json' } }
    );

    if (tokenRes.data.error) {
      console.error('GitHub token error:', tokenRes.data);
      return res.redirect(webUrl('/auth/error?reason=github_failed'));
    }

    const userRes = await axios.get(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${tokenRes.data.access_token}`,
        'User-Agent':  'PluralCloud',
      },
    });
    const { id: githubIdRaw, login: githubLogin, avatar_url: githubAvatar } = userRes.data;
    const githubId = String(githubIdRaw);

    // ── Link mode: attach GitHub to an existing logged-in account ──
    if (typeof state === 'string' && state.startsWith('link:')) {
      const existingToken = state.slice(5);
      let linkUserId: string;
      try {
        const payload = jwt.verify(existingToken, process.env.JWT_SECRET!) as { userId: string };
        linkUserId = payload.userId;
      } catch {
        return res.redirect(webUrl('/auth/error?reason=invalid_link_token'));
      }

      const conflict = await pool.query(
        'SELECT id FROM users WHERE github_id = $1 AND id != $2',
        [githubId, linkUserId]
      );
      if (conflict.rows[0]) {
        return res.redirect(webUrl('/settings/general?error=github_already_linked'));
      }

      await pool.query(
        `UPDATE users SET github_id = $1, github_login = $2, github_avatar = $3, updated_at = now()
         WHERE id = $4`,
        [githubId, githubLogin, githubAvatar, linkUserId]
      );
      return res.redirect(webUrl('/settings/general?success=github_linked'));
    }

    // ── Login mode: find or create user by GitHub ID ──
    const result = await pool.query(
      `INSERT INTO users (github_id, github_login, github_avatar)
       VALUES ($1, $2, $3)
       ON CONFLICT (github_id) DO UPDATE
         SET github_login  = EXCLUDED.github_login,
             github_avatar = EXCLUDED.github_avatar,
             updated_at    = now()
       RETURNING id`,
      [githubId, githubLogin, githubAvatar]
    );
    const userId = result.rows[0].id;
    const token  = jwt.sign({ userId, githubId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.redirect(webUrl(`/auth/success?token=${token}&tag=${encodeURIComponent(githubLogin)}`));
  } catch (err: any) {
    console.error('GitHub auth error:', err?.response?.data ?? err.message);
    res.redirect(webUrl('/auth/error?reason=github_failed'));
  }
});

// ── Disconnect an auth provider (only if the other is present) ─

router.delete('/discord', requireAuth, async (req: AuthRequest, res: Response) => {
  const row = await pool.query('SELECT github_id FROM users WHERE id = $1', [req.userId]);
  if (!row.rows[0]?.github_id) {
    return res.status(400).json({ error: 'Cannot remove Discord — no other login method linked.' });
  }
  await pool.query(
    'UPDATE users SET discord_id = NULL, discord_tag = NULL, discord_avatar = NULL WHERE id = $1',
    [req.userId]
  );
  res.json({ ok: true });
});

router.delete('/github', requireAuth, async (req: AuthRequest, res: Response) => {
  const row = await pool.query('SELECT discord_id FROM users WHERE id = $1', [req.userId]);
  if (!row.rows[0]?.discord_id) {
    return res.status(400).json({ error: 'Cannot remove GitHub — no other login method linked.' });
  }
  await pool.query(
    'UPDATE users SET github_id = NULL, github_login = NULL, github_avatar = NULL WHERE id = $1',
    [req.userId]
  );
  res.json({ ok: true });
});

// ── Minecraft (Microsoft) link ────────────────────────────────

router.get('/minecraft', (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');
  const params = new URLSearchParams({
    client_id:     process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri:  process.env.MICROSOFT_REDIRECT_URI!,
    scope:         'XboxLive.signin offline_access',
    response_mode: 'query',
    state:         token as string,
    prompt:        'select_account',
  });
  res.redirect(`${MS_AUTH_URL}/authorize?${params}`);
});

router.get('/minecraft/callback', async (req: Request, res: Response) => {
  const { code, state: token } = req.query;
  if (!code || !token) return res.redirect(webUrl('/dashboard?error=mc_failed'));

  let userId: string;
  try {
    const payload = jwt.verify(token as string, process.env.JWT_SECRET!) as { userId: string };
    userId = payload.userId;
  } catch {
    return res.redirect(webUrl('/dashboard?error=invalid_token'));
  }

  try {
    const msToken = await axios.post(
      `${MS_AUTH_URL}/token`,
      new URLSearchParams({
        client_id:     process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code:          code as string,
        redirect_uri:  process.env.MICROSOFT_REDIRECT_URI!,
        grant_type:    'authorization_code',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const xbl = await axios.post(XBOX_AUTH_URL, {
      Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${msToken.data.access_token}` },
      RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT',
    }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });

    const xsts = await axios.post(XSTS_AUTH_URL, {
      Properties: { SandboxId: 'RETAIL', UserTokens: [xbl.data.Token] },
      RelyingParty: 'rp://api.minecraftservices.com/', TokenType: 'JWT',
    }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });

    const mc = await axios.post(MC_AUTH_URL,
      { identityToken: `XBL3.0 x=${xbl.data.DisplayClaims.xui[0].uhs};${xsts.data.Token}` },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const profile = await axios.get(MC_PROFILE_URL, {
      headers: { Authorization: `Bearer ${mc.data.access_token}` },
    });
    const { id: mcUuid, name: mcName } = profile.data;

    // One-to-one: reject if this UUID is already registered to a different user
    const mcExisting = await pool.query(
      'SELECT user_id FROM minecraft_accounts WHERE minecraft_uuid = $1',
      [mcUuid]
    );
    if (mcExisting.rows[0] && mcExisting.rows[0].user_id !== userId) {
      return res.redirect(webUrl('/dashboard?error=mc_already_registered'));
    }

    await pool.query(
      `INSERT INTO minecraft_accounts (user_id, minecraft_uuid, minecraft_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (minecraft_uuid) DO UPDATE SET minecraft_name = EXCLUDED.minecraft_name`,
      [userId, mcUuid, mcName]
    );

    res.redirect(webUrl('/dashboard?success=mc_linked'));
  } catch (err: any) {
    console.error('MC auth error:', err?.response?.data ?? err.message);
    res.redirect(webUrl('/dashboard?error=mc_failed'));
  }
});

// ── Hytale (HyAuth) ───────────────────────────────────────────

router.get('/hytale', async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');

  let userId: string;
  try {
    const payload = jwt.verify(token as string, process.env.JWT_SECRET!) as any;
    userId = payload.userId;
  } catch {
    return res.status(401).send('Invalid token');
  }

  try {
    const r = await axios.post(
      'https://www.hyauth.com/api/auth/create',
      {
        scopes: { gameProfiles: true },
        redirectUrl: `${process.env.PUBLIC_URL}/auth/hytale/callback`,
      },
      { headers: { Authorization: `Bearer ${process.env.HYAUTH_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    await pool.query(
      `INSERT INTO hytale_auth_sessions (session_id, user_id, expires_at)
       VALUES ($1, $2, now() + interval '10 minutes')
       ON CONFLICT (session_id) DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at`,
      [r.data.sessionId, userId]
    );
    res.redirect(r.data.loginUrl);
  } catch (err: any) {
    console.error('HyAuth create error:', err?.response?.data ?? err.message);
    res.redirect(webUrl('/dashboard?error=hytale_failed'));
  }
});

router.get('/hytale/callback', async (req: Request, res: Response) => {
  const session = req.query.session ?? req.query.sessionId;
  if (!session) return res.redirect(webUrl('/dashboard?error=hytale_failed'));

  const stateRow = await pool.query(
    'SELECT user_id FROM hytale_auth_sessions WHERE session_id = $1 AND expires_at > now()',
    [session]
  );
  if (!stateRow.rows[0]) return res.redirect(webUrl('/dashboard?error=hytale_expired'));
  const userId = stateRow.rows[0].user_id;

  let profile: any = null;
  for (let i = 0; i < 10; i++) {
    try {
      const r = await axios.get(`https://www.hyauth.com/api/auth/${session}`, {
        headers: { Authorization: `Bearer ${process.env.HYAUTH_API_KEY}` },
      });
      if (r.data.status === 'completed') { profile = r.data; break; }
      if (r.data.status === 'failed') break;
    } catch (e: any) {
      console.error(`[hytale poll ${i}]`, e?.response?.data ?? e.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  await pool.query('DELETE FROM hytale_auth_sessions WHERE session_id = $1', [session]);

  if (!profile?.gameProfiles?.length) {
    return res.redirect(webUrl('/dashboard?error=hytale_failed'));
  }

  for (const gp of profile.gameProfiles) {
    // One-to-one: reject if this UUID is already registered to a different user
    const hyExisting = await pool.query(
      'SELECT user_id FROM hytale_accounts WHERE hytale_uuid = $1',
      [gp.uuid]
    );
    if (hyExisting.rows[0] && hyExisting.rows[0].user_id !== userId) {
      return res.redirect(webUrl('/dashboard?error=hytale_already_registered'));
    }

    await pool.query(
      `INSERT INTO hytale_accounts (user_id, hytale_uuid, hytale_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (hytale_uuid) DO UPDATE SET hytale_name = EXCLUDED.hytale_name`,
      [userId, gp.uuid, gp.username]
    );
  }

  res.redirect(webUrl('/dashboard?success=hytale_linked'));
});

function webUrl(path: string) {
  return `${process.env.PUBLIC_URL}${path}`;
}

export default router;