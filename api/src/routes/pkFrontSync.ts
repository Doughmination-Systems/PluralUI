import axios from 'axios';
import pool from '../db/pool';

const PK = 'https://api.pluralkit.me/v2';
const UA = 'PluralCloud/2.0';

/**
 * Pull current front from PluralKit and set it as the active local session.
 * Called after import so the user's front is immediately correct.
 */
export async function pullFrontFromPK(userId: string, token: string): Promise<void> {
  try {
    const r = await axios.get(`${PK}/systems/@me/fronters`, {
      headers: { Authorization: token, 'User-Agent': UA },
      validateStatus: s => s === 200 || s === 204,
    });

    // 204 = no fronters registered
    if (r.status === 204 || !r.data) return;

    const pkMemberIds: string[] = (r.data?.members ?? []).map((m: any) => m.id);
    if (pkMemberIds.length === 0) return;

    // Resolve PK member IDs to local member IDs
    const memberRes = await pool.query(
      `SELECT id FROM members WHERE user_id = $1 AND pk_member_id = ANY($2::text[])`,
      [userId, pkMemberIds]
    );
    const localIds: string[] = memberRes.rows.map((r: any) => r.id);
    if (localIds.length === 0) return;

    // End any existing open session and start a new one
    await pool.query(
      `UPDATE fronting_sessions SET ended_at = now() WHERE user_id = $1 AND ended_at IS NULL`,
      [userId]
    );
    await pool.query(
      `INSERT INTO fronting_sessions (user_id, member_ids) VALUES ($1, $2)`,
      [userId, localIds]
    );
  } catch (e: any) {
    // Non-fatal — log and continue
    console.warn('[pkFrontSync] pullFrontFromPK failed:', e?.response?.status ?? e?.message);
  }
}

/**
 * Push the current local front to PluralKit.
 * Fire-and-forget — call without await from front add/remove routes.
 * Pass memberIds explicitly when calling after a session has been ended (e.g. clear front).
 */
export async function pushFrontToPK(userId: string, memberIds?: string[]): Promise<void> {
  try {
    const userRes = await pool.query(
      `SELECT pluralkit_token, plural_app FROM users WHERE id = $1`,
      [userId]
    );
    const { pluralkit_token: token, plural_app } = userRes.rows[0] ?? {};
    if (!token || plural_app !== 'pluralkit') return;

    let pkIds: string[];

    if (memberIds !== undefined) {
      // Caller provided member IDs directly (e.g. after clearing front)
      if (memberIds.length === 0) {
        pkIds = [];
      } else {
        const memberRes = await pool.query(
          `SELECT pk_member_id FROM members WHERE id = ANY($1::uuid[]) AND pk_member_id IS NOT NULL`,
          [memberIds]
        );
        pkIds = memberRes.rows.map((r: any) => r.pk_member_id);
      }
    } else {
      // Query current active session
      const frontRes = await pool.query(
        `SELECT m.pk_member_id
         FROM fronting_sessions fs
         JOIN members m ON m.id = ANY(fs.member_ids)
         WHERE fs.user_id = $1 AND fs.ended_at IS NULL AND m.pk_member_id IS NOT NULL`,
        [userId]
      );
      pkIds = frontRes.rows.map((r: any) => r.pk_member_id);
    }

    await axios.post(
      `${PK}/systems/@me/switches`,
      { members: pkIds },
      {
        headers: { Authorization: token, 'User-Agent': UA },
        validateStatus: s => s === 204,
      }
    );
  } catch (e: any) {
    console.warn('[pkFrontSync] pushFrontToPK failed:', e?.response?.status ?? e?.message);
  }
}