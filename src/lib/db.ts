import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

let pool: Pool | null = null

const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
}

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const pool = getPool()
  return pool.query<T>(text, params)
}

export const getClient = async (): Promise<PoolClient> => {
  const pool = getPool()
  return pool.connect()
}
