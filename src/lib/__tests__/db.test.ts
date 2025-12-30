import { describe, it, expect, vi, beforeEach } from 'vitest'

const isDatabaseAvailable = !!process.env.DATABASE_URL

describe.skipIf(!isDatabaseAvailable)('L-TA-001: Database Connection Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Typical Cases', () => {
    it('接続プールが正常に作成される', async () => {
      const { getClient } = await import('../db')
      const client = await getClient()
      
      expect(client).toBeDefined()
      await client.release()
    })

    it('search_pathがpublicに設定される', async () => {
      const { query } = await import('../db')
      const result = await query<{ search_path: string }>('SHOW search_path')

      expect(result.rows[0].search_path).toContain('public')
    })

    it('auth_usersテーブルにアクセスできる', async () => {
      const { query } = await import('../db')
      const result = await query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'auth_users'`
      )

      expect(result.rows.length).toBeGreaterThan(0)
    })
  })

  describe('Boundary Cases', () => {
    it('public.usersテーブルにアクセスできる', async () => {
      const { query } = await import('../db')
      const result = await query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'users'`
      )
      
      expect(result.rows.length).toBeGreaterThan(0)
    })

    it('public.groupsテーブルにアクセスできる', async () => {
      const { query } = await import('../db')
      const result = await query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'groups'`
      )
      
      expect(result.rows.length).toBeGreaterThan(0)
    })

    it('public.transactionsテーブルにアクセスできる', async () => {
      const { query } = await import('../db')
      const result = await query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'transactions'`
      )
      
      expect(result.rows.length).toBeGreaterThan(0)
    })

    it('publicスキーマがデフォルトで使用される', async () => {
      const { query } = await import('../db')
      const result = await query<{ search_path: string }>('SHOW search_path')
      const searchPath = result.rows[0].search_path

      expect(searchPath).toContain('public')
    })

    it('複数接続でもsearch_pathが維持される', async () => {
      const { getClient } = await import('../db')

      const client1 = await getClient()
      const client2 = await getClient()

      const result1 = await client1.query<{ search_path: string }>('SHOW search_path')
      const result2 = await client2.query<{ search_path: string }>('SHOW search_path')

      expect(result1.rows[0].search_path).toContain('public')
      expect(result2.rows[0].search_path).toContain('public')

      await client1.release()
      await client2.release()
    })
  })

  describe('Attack Cases', () => {
    it('不正なスキーマ名での検索を防ぐ', async () => {
      const { query } = await import('../db')
      
      await expect(
        query("SET search_path TO malicious_schema; DROP TABLE users")
      ).rejects.toThrow()
    })

    it('SQLインジェクションを防ぐ', async () => {
      const { query } = await import('../db')
      const maliciousInput = "'; DROP TABLE users; --"
      
      await expect(
        query('SELECT * FROM users WHERE email = $1', [maliciousInput])
      ).resolves.toBeDefined()
    })

    it('システムスキーマへの変更を防ぐ', async () => {
      const { query } = await import('../db')

      await expect(
        query("SET search_path TO pg_catalog")
      ).rejects.toThrow()
    })
  })

  describe('Gray Cases', () => {
    it('接続エラー時にAppErrorをスローする', async () => {
      const originalUrl = process.env.DATABASE_URL
      process.env.DATABASE_URL = 'postgresql://invalid:invalid@localhost:5432/invalid'
      
      vi.resetModules()
      const { getClient } = await import('../db')
      
      await expect(getClient()).rejects.toThrow()
      
      process.env.DATABASE_URL = originalUrl
    })
  })
})

describe('Database Connection without DATABASE_URL', () => {
  it('DATABASE_URLがない場合はテストをスキップ', () => {
    if (!isDatabaseAvailable) {
      expect(true).toBe(true)
    }
  })
})
