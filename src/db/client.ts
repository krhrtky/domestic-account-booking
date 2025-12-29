import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { AppError, ErrorCodes } from '@/lib/errors'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new AppError(
    ErrorCodes.CONFIG.MISSING_DATABASE_URL,
    'DATABASE_URL environment variable is not set',
    500
  )
}

const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 2,
})

export const db = drizzle(client, { schema })

export type Database = typeof db
