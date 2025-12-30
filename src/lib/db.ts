import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'
import { AppError, ErrorCodes } from './errors'

let pool: Pool | null = null

const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    pool.on('connect', async (client) => {
      try {
        await client.query("SET search_path TO custom_auth, public")
      } catch (error) {
        console.error('[DB Schema Config Error]', error)
        throw new AppError(
          ErrorCodes.DB.SCHEMA_CONFIG_ERROR,
          'データベーススキーマの設定に失敗しました',
          500,
          { cause: error }
        )
      }
    })

    pool.on('error', (error) => {
      console.error('[DB Pool Error]', {
        message: error.message,
        ...(error && typeof error === 'object' && 'code' in error && { code: error.code }),
      })
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
