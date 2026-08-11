import {
  Pool,
  type PoolClient,
  type QueryResultRow,
} from 'pg';

const DEFAULT_POOL_SIZE = 10;

declare global {
  // Reuse the pool during Next.js development hot reloads.
  var weddingGuestPlannerPool: Pool | undefined;
}

function databaseUrl(): string {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error('DATABASE_URL is not defined');
  }

  return value;
}

function poolSize(): number {
  const configured = Number(process.env.DATABASE_POOL_MAX ?? DEFAULT_POOL_SIZE);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_POOL_SIZE;
}

function createPool(): Pool {
  return new Pool({
    connectionString: databaseUrl(),
    max: poolSize(),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    ssl: process.env.DATABASE_SSL === 'false' ? false : undefined,
  });
}

export function getPool(): Pool {
  if (!globalThis.weddingGuestPlannerPool) {
    globalThis.weddingGuestPlannerPool = createPool();
  }

  return globalThis.weddingGuestPlannerPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, values);
  return result.rows;
}

export async function queryWithClient<T extends QueryResultRow = QueryResultRow>(
  client: PoolClient,
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const result = await client.query<T>(text, values);
  return result.rows;
}

export async function sql<T extends QueryResultRow = QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const text = strings.reduce(
    (statement, part, index) =>
      statement + part + (index < values.length ? `$${index + 1}` : ''),
    '',
  );

  return query<T>(text, values);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export type User = {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
};

export type Organization = {
  id: string;
  name: string;
  invite_code: string;
  admin_id: string;
  event_type: string;
  configuration: Record<string, unknown>; // JSONB
  created_at: Date;
  updated_at: Date;
};

export type Guest = {
  id: string;
  organization_id: string;
  name: string;
  categories: string[];
  age_group?: string;
  food_preference?: string;
  food_preferences?: string[];
  confirmation_stage: string;
  custom_fields: Record<string, unknown> | null; // JSONB
  family_color?: string; // Hex color for family/group identification
  display_order: number;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: Date;
};
