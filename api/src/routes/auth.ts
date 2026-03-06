import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';

const router = Router();
const DISCORD_API = 'https://discord.com/api/v10';
const MS_AUTH_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0';
const XBOX_AUTH_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_AUTH_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';
const MC_AUTH_URL = 'https://api.minecraftservices.com/authentication/login_with_xbox';
const MC_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';

// ── Discord login ─────────────────────────────────────────────

router.get('/discord', (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    response_type: 'code',
    scope: 'identify',
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

router.get('/discord/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) return res.redirect(webUrl('/auth/error?reason=no_code'));

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      `${DISCORD_API}/oauth2/token`,
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Fetch Discord user
    const userRes = await axios.get(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    });
    const { id: discordId, username, discriminator, avatar } = userRes.data;
    const discordTag = discriminator === '0' ? username : `${username}#${discriminator}`;
    const avatarUrl = avatar
      ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`
      : null;

    // Upsert user
    const result = await pool.query(
      `INSERT INTO users (discord_id, discord_tag, discord_avatar)
       VALUES ($1, $2, $3)
       ON CONFLICT (discord_id) DO UPDATE
         SET discord_tag = EXCLUDED.discord_tag,
             discord_avatar = EXCLUDED.discord_avatar,
             updated_at = now()
       RETURNING id`,
      [discordId, discordTag, avatarUrl]
    );
    const userId = result.rows[0].id;

    const token = jwt.sign({ userId, discordId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    res.redirect(webUrl(`/auth/success?token=${token}&tag=${encodeURIComponent(discordTag)}`));
  } catch (err: any) {
    console.error('Discord auth error:', err?.response?.data ?? err.message);
    res.redirect(webUrl('/auth/error?reason=discord_failed'));
  }
});

// ── Minecraft (Microsoft) link ────────────────────────────────
// State param carries the JWT so we can associate the MC account with the right user

router.get('/minecraft', (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    scope: 'XboxLive.signin offline_access',
    response_mode: 'query',
    state: token as string,
    prompt: 'select_account',
  });
  res.redirect(`${MS_AUTH_URL}/authorize?${params}`);
});

router.get('/minecraft/callback', async (req: Request, res: Response) => {
  const { code, state: token } = req.query;
  if (!code || !token) return res.redirect(webUrl('/dashboard?error=mc_failed'));

  // Verify our JWT from state
  let userId: string;
  try {
    const payload = jwt.verify(token as string, process.env.JWT_SECRET!) as { userId: string };
    userId = payload.userId;
  } catch {
    return res.redirect(webUrl('/dashboard?error=invalid_token'));
  }

  try {
    // Full MS → Xbox → XSTS → MC chain
    const msToken = await axios.post(
      `${MS_AUTH_URL}/token`,
      new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
        grant_type: 'authorization_code',
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

    // Link to this user (or update name if already linked)
    await pool.query(
      `INSERT INTO minecraft_accounts (user_id, minecraft_uuid, minecraft_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (minecraft_uuid) DO UPDATE
         SET minecraft_name = EXCLUDED.minecraft_name`,
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

  // Verify JWT to get userId
  let userId: string;
  try {
    const payload = jwt.verify(token as string, process.env.JWT_SECRET!) as any;
    userId = payload.userId;
  } catch {
    return res.status(401).send('Invalid token');
  }

  // Create HyAuth session
  try {
    const r = await axios.post(
      'https://www.hyauth.com/api/auth/create',
      {
        scopes: { gameProfiles: true },
        redirectUrl: `${process.env.PUBLIC_URL}/auth/hytale/callback`,
      },
      { headers: { Authorization: `Bearer ${process.env.HYAUTH_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    // Store userId in session via a short-lived JWT in the redirect state
    const stateToken = jwt.sign({ userId, sessionId: r.data.sessionId }, process.env.JWT_SECRET!, { expiresIn: '10m' });
    // Store state in DB temporarily
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
  console.log('[hytale callback] session:', session, 'query:', req.query);
  if (!session) return res.redirect(webUrl('/dashboard?error=hytale_failed'));

  // Look up userId from session
  const stateRow = await pool.query(
    'SELECT user_id FROM hytale_auth_sessions WHERE session_id = $1 AND expires_at > now()',
    [session]
  );
  console.log('[hytale callback] stateRow:', stateRow.rows);
  if (!stateRow.rows[0]) return res.redirect(webUrl('/dashboard?error=hytale_expired'));
  const userId = stateRow.rows[0].user_id;

  // Poll HyAuth for result (up to 10s)
  let profile: any = null;
  for (let i = 0; i < 10; i++) {
    try {
      const r = await axios.get(`https://www.hyauth.com/api/auth/${session}`, {
        headers: { Authorization: `Bearer ${process.env.HYAUTH_API_KEY}` },
      });
      console.log(`[hytale callback] poll ${i}: status=${r.data.status}`);
      if (r.data.status === 'completed') { profile = r.data; break; }
      if (r.data.status === 'failed') break;
    } catch (e: any) {
      console.error(`[hytale callback] poll ${i} error:`, e?.response?.data ?? e.message);
    }
    await new Promise(res => setTimeout(res, 1000));
  }

  // Clean up session
  await pool.query('DELETE FROM hytale_auth_sessions WHERE session_id = $1', [session]);

  console.log('[hytale callback] profile:', profile);
  if (!profile?.gameProfiles?.length) {
    return res.redirect(webUrl('/dashboard?error=hytale_failed'));
  }

  for (const gp of profile.gameProfiles) {
    await pool.query(
      `INSERT INTO hytale_accounts (user_id, hytale_uuid, hytale_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (hytale_uuid) DO UPDATE SET
         hytale_name = EXCLUDED.hytale_name,
         user_id     = EXCLUDED.user_id`,
      [userId, gp.uuid, gp.username]
    );
  }

  res.redirect(webUrl('/dashboard?success=hytale_linked'));
});

function webUrl(path: string) {
  return `${process.env.PUBLIC_URL}${path}`;
}

export default router;