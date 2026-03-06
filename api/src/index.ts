import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redis from './db/redis';

import authRouter from './routes/auth';
import userRouter from './routes/user';
import pkRouter from './routes/pluralkit';
import pluginRouter from './routes/plugin';
import spRouter from './routes/simplyplural';
import pluralRouter from './routes/plural';

const app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...require('helmet').contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'https://crafatar.com', 'https://mc-heads.net', 'https://cdn.discordapp.com'],
    },
  },
}));
app.use(cors({ origin: process.env.PUBLIC_URL, credentials: true }));
app.use(express.json());

// Distributed rate limiter backed by Redis
app.use(rateLimit({
  windowMs: 60_000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as any,
  }),
}));

app.use('/auth', authRouter);
app.use('/api', userRouter);
app.use('/api/pluralkit', pkRouter);
app.use('/api/simplyplural', spRouter);
app.use('/api/plural', pluralRouter);
app.use('/plugin', pluginRouter);
app.get('/health', async (_req, res) => {
  const redisPing = await redis.ping().catch(() => 'error');
  res.json({ ok: true, redis: redisPing === 'PONG' ? 'ok' : 'error' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`[Plural API] :${PORT}`));