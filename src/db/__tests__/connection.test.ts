import { describe, it, expect } from 'vitest'
import { sql } from 'drizzle-orm'

const isDatabaseAvailable = !!process.env.DATABASE_URL

describe.skipIf(!isDatabaseAvailable)('L-SC-001: Database Connection & Schema Access', () => {
  describe('Typical', () => {
    it('should establish database connection', async () => {
      const { db } = await import('../client')
      const result = await db.execute(sql`SELECT 1 as value`)
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('should have default search_path configured', async () => {
      const { db } = await import('../client')
      const result = await db.execute(sql`SHOW search_path`)
      expect(result[0]?.search_path).toBeDefined()
      expect(result[0]?.search_path).toContain('public')
    })
  })

  describe('Boundary', () => {
    it('should access auth_users table', async () => {
      const { db } = await import('../client')
      const result = await db.execute(sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'auth_users'
      `)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]?.table_name).toBe('auth_users')
    })

    it('should access all public schema tables', async () => {
      const { db } = await import('../client')
      const result = await db.execute(sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('auth_users', 'users', 'groups', 'transactions', 'invitations')
      `)
      expect(result.length).toBe(5)
    })

    it('should use public schema as default', async () => {
      const { db } = await import('../client')
      const result = await db.execute(sql`
        SELECT current_schema()
      `)
      expect(result[0]?.current_schema).toBe('public')
    })
  })

  describe('Attack', () => {
    it('should reject schema injection attempts', async () => {
      const { db } = await import('../client')
      const maliciousSchema = "'; DROP SCHEMA public; --"

      await expect(async () => {
        await db.execute(sql.raw(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${maliciousSchema}'`))
      }).rejects.toThrow()
    })

    it('should prevent unauthorized schema access', async () => {
      const { db } = await import('../client')
      const result = await db.execute(sql`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'public')
      `)
      expect(result.length).toBe(0)
    })

    it('TYP-DB-003: should handle 20 concurrent connections', async () => {
      const { db } = await import('../client')
      const concurrentRequests = Array.from({ length: 20 }, (_, i) =>
        db.execute(sql`SELECT ${i} as value`)
      )

      const results = await Promise.all(concurrentRequests)

      expect(results).toHaveLength(20)
      results.forEach((result, index) => {
        expect(result[0]?.value).toBe(index)
      })
    })

    it('ATK-DB-003: should reject wildcard injection in schema name', async () => {
      const { db } = await import('../client')
      const wildcardSchema = "LIKE '%'"

      await expect(async () => {
        await db.execute(sql.raw(`SELECT table_name FROM information_schema.tables WHERE table_schema ${wildcardSchema}`))
      }).rejects.toThrow()
    })
  })
})

describe.skipIf(!isDatabaseAvailable)('ERR-DB-001: DATABASE_URL Error Handling', () => {
  it('should throw AppError when DATABASE_URL is missing', async () => {
    const originalUrl = process.env.DATABASE_URL
    delete process.env.DATABASE_URL

    await expect(async () => {
      delete require.cache[require.resolve('../client')]
      await import('../client')
    }).rejects.toThrow()

    process.env.DATABASE_URL = originalUrl
    delete require.cache[require.resolve('../client')]
  })
})

describe.skipIf(!isDatabaseAvailable)('L-CN-001: Database Credential Protection', () => {
  describe('Typical', () => {
    it('should not expose connection string in client instance', async () => {
      const { db } = await import('../client')
      const clientString = JSON.stringify(db)
      expect(clientString).not.toContain('postgresql://')
      expect(clientString).not.toContain('password')
    })

    it('should validate search_path without logging credentials', async () => {
      const { db } = await import('../client')
      const result = await db.execute(sql`SELECT current_setting('search_path') as path`)
      expect(result[0]?.path).toBeDefined()
      expect(result[0]?.path).toContain('public')
    })
  })
})
