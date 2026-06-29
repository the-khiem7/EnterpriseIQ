import { Pool, type PoolConfig, type PoolClient, type QueryResultRow } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import { readFileSync } from "node:fs";

/**
 * Single shared pg Pool for EnterpriseIQ.
 *
 * Two auth modes (see .env.example):
 *  - Mode A: DATABASE_URL set  -> plain connection string (local / quick dev).
 *  - Mode B: USE_IAM_AUTH=true -> Aurora + passwordless IAM auth. We mint a
 *    short-lived token with @aws-sdk/rds-signer on each new connection, so the
 *    pool refreshes credentials as connections are created (tokens last ~15min).
 *
 * The graph layer is plain SQL (pgvector + pgrouting + recursive CTEs), so no
 * per-connection extension loading is required — unlike Apache AGE.
 */

const useIam = process.env.USE_IAM_AUTH === "true";

let pool: Pool | undefined;

// The Vercel Aurora/Marketplace integration may inject the connection string
// under various names — accept the common ones.
function connString(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    undefined
  );
}

function isLocal(cs: string): boolean {
  return /@(localhost|127\.0\.0\.1)[:/]/.test(cs);
}

// Aurora requires TLS. Use the RDS CA bundle if provided (verified), else fall
// back to encrypted-but-unverified for remote hosts; no SSL for local dev.
function sslFor(remote: boolean): PoolConfig["ssl"] {
  if (!remote) return undefined;
  if (process.env.RDS_CA_PATH) {
    return { ca: readFileSync(process.env.RDS_CA_PATH, "utf8") };
  }
  return { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === "true" };
}

function baseConfig(): PoolConfig {
  if (connString() && !useIam) {
    const cs = connString()!;
    return { connectionString: cs, max: 5, ssl: sslFor(!isLocal(cs)) };
  }

  // Mode B: IAM auth against Aurora.
  const host = required("PGHOST");
  const port = Number(process.env.PGPORT ?? 5432);
  const user = required("PGUSER");

  return {
    host,
    port,
    user,
    database: process.env.PGDATABASE ?? "enterpriseiq",
    ssl: sslFor(true),
    max: 5,
    // pg calls this for every new physical connection — perfect place to mint
    // a fresh IAM token so we never cache an expired one.
    password: async () => {
      const signer = new Signer({
        hostname: host,
        port,
        username: user,
        region: process.env.AWS_REGION ?? "us-east-1",
      });
      return signer.getAuthToken();
    },
  };
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(baseConfig());
    pool.on("error", (err) => {
      console.error("[db] idle client error", err);
    });
  }
  return pool;
}

/** Run a parameterized query. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params as never);
}

/** Run a function inside a transaction, with automatic COMMIT/ROLLBACK. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing env ${name}. Set DATABASE_URL (Mode A) or the PG* + IAM vars (Mode B). See .env.example.`,
    );
  }
  return value;
}
