import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { AppError, ErrorCodes } from '@/lib/errors'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null
let _client: ReturnType<typeof postgres> | null = null

function getDb() {
  if (_db) {
    return _db
  }

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new AppError(
      ErrorCodes.CONFIG.MISSING_DATABASE_URL,
      'DATABASE_URL environment variable is not set',
      500
    )
  }

  _client = postgres(connectionString, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 2,
  })

  _db = drizzle(_client, { schema })
  return _db
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    const instance = getDb()
    const value = instance[prop as keyof typeof instance]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

export type Database = typeof db
