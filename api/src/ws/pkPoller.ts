import axios from 'axios';
import pool from '../db/pool';
import { invalidate, keys } from '../db/redis';
import { broadcastFrontChange } from './wsServer';
import { pullFrontFromPK } from '../routes/pkFrontSync';

const PK = 'https://api.pluralkit.me/v2';
const UA = 'PluralCloud/2.0';
const POLL_INTERVAL = 60_000;

export function startPKPoller() {
  setInterval(async () => {
    try {
      // Get all users with PK as active app and a token
      const usersRes = await pool.query(
        `SELECT id, pluralkit_token FROM users
         WHERE plural_app = 'pluralkit' AND pluralkit_token IS NOT NULL`
      );

      for (const user of usersRes.rows) {
        await pollUserFront(user.id, user.pluralkit_token);
      }
    } catch (e: any) {
      console.warn('[PKPoller] poll cycle error:', e?.message);
    }
  }, POLL_INTERVAL);

  console.log('[PKPoller] Started — polling PK every 60s');
}

async function pollUserFront(userId: string, token: string) {
  try {
    const r = await axios.get(`${PK}/systems/@me/fronters`, {
      headers: { Authorization: token, 'User-Agent': UA },
      validateStatus: s => s === 200 || s === 204,
    });

    const pkMemberIds: string[] = r.status === 204
      ? []
      : (r.data?.members ?? []).map((m: any) => m.id);

    // Get current local front's PK IDs
    const localRes = await pool.query(
      `SELECT m.pk_member_id
       FROM fronting_sessions fs
       JOIN members m ON m.id = ANY(fs.member_ids)
       WHERE fs.user_id = $1 AND fs.ended_at IS NULL AND m.pk_member_id IS NOT NULL`,
      [userId]
    );
    const localPkIds: string[] = localRes.rows.map((r: any) => r.pk_member_id).sort();
    const remotePkIds = [...pkMemberIds].sort();

    // Compare — if different, pull and broadcast
    const changed = JSON.stringify(localPkIds) !== JSON.stringify(remotePkIds);
    if (!changed) return;

    await pullFrontFromPK(userId, token);

    // Invalidate all player caches for this user
    const mcRes = await pool.query(
      'SELECT minecraft_uuid FROM minecraft_accounts WHERE user_id = $1', [userId]
    );
    const playerKeys = mcRes.rows.map((r: any) => keys.player(r.minecraft_uuid));
    await invalidate(keys.userMe(userId), ...playerKeys);

    broadcastFrontChange(userId);
    console.log(`[PKPoller] Front change detected for user ${userId}`);
  } catch (e: any) {
    // Non-fatal — skip this user this cycle
    console.warn(`[PKPoller] pollUserFront failed for ${userId}:`, e?.response?.status ?? e?.message);
  }
}