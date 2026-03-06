import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on('error', (err) => console.error('[Redis] error:', err.message));
redis.on('connect', () => console.log('[Redis] connected'));

// ── TTLs ──────────────────────────────────────────────────────
export const TTL = {
  PLAYER:  60 * 10,   // 10 min  — plugin join payload
  USER_ME: 60 * 5,    // 5 min   — /api/me dashboard payload
} as const;

// ── Key helpers ───────────────────────────────────────────────
export const keys = {
  player: (mcUuid: string)  => `player:${mcUuid}`,
  userMe: (userId: string)  => `user:${userId}:me`,
};

// ── Typed helpers ─────────────────────────────────────────────

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function setJSON(key: string, value: unknown, ttlSeconds: number) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function invalidate(...keyList: string[]) {
  if (keyList.length) await redis.del(...keyList);
}

export default redis;
