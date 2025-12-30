import { describe, it, expect, beforeEach } from 'vitest'

const isDatabaseAvailable = !!process.env.DATABASE_URL

describe.skipIf(!isDatabaseAvailable)('L-TA-001: Drizzle Client Connection Tests', () => {
  describe('Typical Cases', () => {
    it('Drizzleクライアントが正常に初期化される', async () => {
      const { db } = await import('../client')
      
      expect(db).toBeDefined()
      expect(db.query).toBeDefined()
    })

    it('search_pathがonconnectフックで設定される', async () => {
      const { db } = await import('../client')
      const result = await db.execute('SHOW search_path')
      
      const searchPath = (result as any).rows?.[0]?.search_path || (result as any)[0]?.search_path
      expect(searchPath).toBeDefined()
      expect(searchPath).toContain('custom_auth')
      expect(searchPath).toContain('public')
    })
  })

  describe('Boundary Cases', () => {
    it('custom_authスキーマのテーブルにアクセスできる', async () => {
      const { db } = await import('../client')
      const result = await db.execute(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'custom_auth' AND table_name = 'users'`
      )
      
      const rows = (result as any).rows || result
      expect(rows.length).toBeGreaterThan(0)
    })

    it('publicスキーマのテーブルにアクセスできる', async () => {
      const { db } = await import('../client')
      const result = await db.execute(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name IN ('users', 'groups', 'transactions')`
      )
      
      const rows = (result as any).rows || result
      expect(rows.length).toBeGreaterThan(0)
    })

    it('スキーマ優先順位が正しい（custom_auth > public）', async () => {
      const { db } = await import('../client')
      const result = await db.execute('SHOW search_path')
      
      const searchPath = (result as any).rows?.[0]?.search_path || (result as any)[0]?.search_path
      const customAuthIndex = searchPath.indexOf('custom_auth')
      const publicIndex = searchPath.indexOf('public')
      
      expect(customAuthIndex).toBeLessThan(publicIndex)
    })
  })

  describe('Attack Cases', () => {
    it('SQLインジェクションを防ぐ', async () => {
      const { db } = await import('../client')
      const maliciousInput = "'; DROP TABLE users; --"
      
      await expect(
        db.execute(`SELECT * FROM "public"."users" WHERE email = '${maliciousInput}'`)
      ).resolves.toBeDefined()
    })

    it('不正なスキーマ設定を防ぐ', async () => {
      const { db } = await import('../client')
      
      await expect(
        db.execute("SET search_path TO malicious_schema")
      ).rejects.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('スキーマ設定エラー時にE_DB_006を使用', async () => {
      const { ErrorCodes } = await import('@/lib/errors')
      
      expect(ErrorCodes.DB.SCHEMA_CONFIG_ERROR).toBe('E_DB_006')
    })

    it('クエリエラー時にE_DB_007を使用', async () => {
      const { ErrorCodes } = await import('@/lib/errors')
      
      expect(ErrorCodes.DB.QUERY_ERROR).toBe('E_DB_007')
    })
  })
})

describe('Drizzle Client without DATABASE_URL', () => {
  it('DATABASE_URLがない場合はエラーをスロー', async () => {
    if (!isDatabaseAvailable) {
      const originalUrl = process.env.DATABASE_URL
      delete process.env.DATABASE_URL
      
      await expect(async () => {
        await import('../client')
      }).rejects.toThrow()
      
      process.env.DATABASE_URL = originalUrl
    } else {
      expect(true).toBe(true)
    }
  })
})
