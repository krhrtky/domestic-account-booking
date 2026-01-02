import { afterAll, beforeAll } from 'vitest'

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for integration tests')
  }
})

afterAll(async () => {
})
