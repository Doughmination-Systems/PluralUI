import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });
pool.on('error', (err) => console.error('DB pool error:', err));
export default pool;
