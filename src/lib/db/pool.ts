import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

/**
 * A single connection pool per process. Next.js hot reloading can re-evaluate
 * modules, so the pool is cached on `globalThis` to avoid leaking connections.
 */
const globalForPool = globalThis as typeof globalThis & {
  __byakuyaPool?: Pool;
};

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and point it at your PostgreSQL instance.',
    );
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on('error', (error) => {
    console.error('Unexpected error on idle PostgreSQL client', error);
  });

  return pool;
}

export function getPool(): Pool {
  if (!globalForPool.__byakuyaPool) {
    globalForPool.__byakuyaPool = createPool();
  }

  return globalForPool.__byakuyaPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

/**
 * Runs `fn` inside a transaction, committing on success and rolling back when
 * `fn` throws. The client is always released back to the pool.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to roll back PostgreSQL transaction', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
