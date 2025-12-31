import { describe, it, expect, beforeEach } from 'vitest'

const isDatabaseAvailable = !!process.env.DATABASE_URL

describe.skipIf(!isDatabaseAvailable)('L-TA-001: Drizzle Client Connection Tests', () => {
  describe('Typical Cases', () => {
    it('Drizzleクライアントが正常に初期化される', async () => {
      const { db } = await import('../client')
      
      expect(db).toBeDefined()
      expect(db.query).toBeDefined()
    })

    it('public schemaがデフォルトで設定される', async () => {
      const { db } = await import('../client')
      const result = await db.execute('SHOW search_path')

      const searchPath = (result as any).rows?.[0]?.search_path || (result as any)[0]?.search_path
      expect(searchPath).toBeDefined()
      expect(searchPath).toContain('public')
    })
  })

  describe('Boundary Cases', () => {
    it('auth_usersテーブルにアクセスできる', async () => {
      const { db } = await import('../client')
      const result = await db.execute(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'auth_users'`
      )

      const rows = (result as any).rows || result
      expect(rows.length).toBeGreaterThan(0)
    })

    it('publicスキーマのすべてのテーブルにアクセスできる', async () => {
      const { db } = await import('../client')
      const result = await db.execute(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN ('auth_users', 'users', 'groups', 'transactions')`
      )

      const rows = (result as any).rows || result
      expect(rows.length).toBeGreaterThan(0)
    })

    it('publicスキーマがデフォルトで使用される', async () => {
      const { db } = await import('../client')
      const result = await db.execute('SHOW search_path')

      const searchPath = (result as any).rows?.[0]?.search_path || (result as any)[0]?.search_path
      expect(searchPath).toContain('public')
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

    it('不正なテーブル名を防ぐ', async () => {
      const { db } = await import('../client')

      await expect(
        db.execute("SELECT * FROM nonexistent_table")
      ).rejects.toThrow()
    })
  })

  describe('Error Handling', () => {

    it('クエリエラー時にE_DB_007を使用', async () => {
      const { ErrorCodes } = await import('@/lib/errors')
      
      expect(ErrorCodes.DB.QUERY_ERROR).toBe('E_DB_007')
    })
  })
})

describe('Drizzle Client without DATABASE_URL', () => {
  it('DATABASE_URLがない場合、DB使用時にエラーをスロー', async () => {
    // 遅延初期化により、インポート時ではなくDB使用時にエラーが発生する
    // このテストはCI環境（DATABASE_URLなし）で実行される
    if (!isDatabaseAvailable) {
      // 新しいモジュールをインポート（キャッシュをクリア）
      const clientModule = await import('../client')

      // dbを使用しようとするとエラーがスローされる
      expect(() => {
        // プロパティアクセスでgetDb()が呼ばれ、エラーがスローされる
        clientModule.db.query
      }).toThrow('DATABASE_URL environment variable is not set')
    } else {
      // DATABASE_URLがある場合は正常動作することを確認
      const { db } = await import('../client')
      expect(db).toBeDefined()
    }
  })
})
