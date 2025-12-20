import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'
import * as session from '@/lib/session'
import * as db from '@/lib/db'

vi.mock('@/lib/session')
vi.mock('@/lib/db')

describe('L-AS-001, L-AS-004, L-SC-001: GET /api/me', () => {
  const mockQuery = vi.mocked(db.query)
  const mockGetCurrentUser = vi.mocked(session.getCurrentUser)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Typical Cases', () => {
    it('TYP-001: 認証済みユーザーでグループ所属ありの場合、ユーザー情報とgroupIdを返す', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User'
      })

      mockQuery.mockResolvedValue({
        rows: [{ group_id: 'group-456' }],
        rowCount: 1
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: {
          userId: 'user-123',
          groupId: 'group-456',
          email: 'user@example.com',
          name: 'Test User'
        }
      })

      expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Cache-Control')).toBe('no-store')
    })

    it('TYP-002: 認証済みユーザーでグループ所属なしの場合、groupIdをnullで返す', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-789',
        email: 'newuser@example.com',
        name: 'New User'
      })

      mockQuery.mockResolvedValue({
        rows: [{ group_id: null }],
        rowCount: 1
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: {
          userId: 'user-789',
          groupId: null,
          email: 'newuser@example.com',
          name: 'New User'
        }
      })
    })

    it('TYP-003: レスポンスに必須ヘッダーが含まれる', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User'
      })

      mockQuery.mockResolvedValue({
        rows: [{ group_id: 'group-456' }],
        rowCount: 1
      } as any)

      const response = await GET()

      expect(response.headers.get('Content-Type')).toContain('application/json')
      expect(response.headers.get('X-Request-Id')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      expect(response.headers.get('X-Response-Time')).toMatch(/^\d+ms$/)
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Cache-Control')).toBe('no-store')
    })
  })

  describe('Boundary Cases', () => {
    it('BND-001: DBクエリ結果が空配列の場合、groupIdをnullで返す', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-999',
        email: 'orphan@example.com',
        name: 'Orphan User'
      })

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.groupId).toBeNull()
    })

    it('BND-002: 名前に特殊文字が含まれる場合も正常に返す', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-special',
        email: 'special@example.com',
        name: '田中 太郎'
      })

      mockQuery.mockResolvedValue({
        rows: [{ group_id: 'group-abc' }],
        rowCount: 1
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).toBe('田中 太郎')
    })

    it('BND-003: メールアドレスに+記号が含まれる場合も正常に返す', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-plus',
        email: 'user+test@example.com',
        name: 'Plus User'
      })

      mockQuery.mockResolvedValue({
        rows: [{ group_id: null }],
        rowCount: 1
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.email).toBe('user+test@example.com')
    })
  })

  describe('Attack Cases', () => {
    it('ATK-001: 未認証の場合、401エラーを返す', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: {
          code: 'E_AUTH_001',
          message: '認証が必要です'
        }
      })

      expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8')
      expect(response.headers.get('X-Request-Id')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      expect(response.headers.get('X-Response-Time')).toMatch(/^\d+ms$/)
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Cache-Control')).toBe('no-store')
    })

    it('ATK-002: エラーコードが規定の形式に準拠している', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(data.error.code).toMatch(/^E_[A-Z]+_\d{3}$/)
    })

    it('ATK-003: エラーメッセージが日本語である', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(data.error.message).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)
    })
  })

  describe('Incident Cases', () => {
    it('INC-001: DB接続エラーが発生した場合、エラーをスローする', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User'
      })

      mockQuery.mockRejectedValue(new Error('Database connection failed'))

      await expect(GET()).rejects.toThrow('Database connection failed')
    })
  })

  describe('Gray Cases', () => {
    it('GRAY-001: DBクエリ結果のgroup_idがundefinedの場合、nullとして扱う', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-undef',
        email: 'undef@example.com',
        name: 'Undefined Group User'
      })

      mockQuery.mockResolvedValue({
        rows: [{}],
        rowCount: 1
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.groupId).toBeNull()
    })
  })
})
