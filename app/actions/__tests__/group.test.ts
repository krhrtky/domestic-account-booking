import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGroup, updateRatio, getCurrentGroup } from '../group'
import * as session from '@/lib/session'
import * as dbCache from '@/lib/db-cache'

vi.mock('@/lib/session')
vi.mock('@/lib/db-cache')
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))
vi.mock('@/db/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  }
}))

describe('L-BR-001: Group actions with Drizzle', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(session.requireAuth).mockResolvedValue(mockUser)
  })

  describe('createGroup', () => {
    it('validates ratio sum equals 100', async () => {
      const result = await createGroup({
        name: 'Test Group',
        ratio_a: 60,
        ratio_b: 30,
      })

      expect(result.error).toBeDefined()
    })

    it('accepts valid ratios that sum to 100', async () => {
      const validData = {
        name: 'Test Group',
        ratio_a: 60,
        ratio_b: 40,
      }

      const { db } = await import('@/db/client')
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ groupId: null }])
          })
        })
      } as any)

      vi.mocked(db.transaction).mockResolvedValue('group-123')

      const result = await createGroup(validData)

      expect(result.error).toBeUndefined()
    })

    it('rejects if user already in a group', async () => {
      const { db } = await import('@/db/client')
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ groupId: 'existing-group' }])
          })
        })
      } as any)

      const result = await createGroup({
        ratio_a: 50,
        ratio_b: 50,
      })

      expect(result.error).toBe('User already belongs to a group')
    })
  })

  describe('updateRatio', () => {
    beforeEach(() => {
      vi.mocked(dbCache.getUserGroupId).mockResolvedValue('group-123')
    })

    it('validates ratio sum equals 100', async () => {
      const result = await updateRatio(70, 20)
      expect(result.error).toBeDefined()
    })

    it('accepts valid ratios', async () => {
      const { db } = await import('@/db/client')
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      } as any)

      const result = await updateRatio(60, 40)
      expect(result.error).toBeUndefined()
    })

    it('rejects if user not in a group', async () => {
      vi.mocked(dbCache.getUserGroupId).mockResolvedValue(null)

      const result = await updateRatio(50, 50)
      expect(result.error).toBe('User is not in a group')
    })
  })

  describe('getCurrentGroup', () => {
    it('returns group data for authenticated user', async () => {
      const { db } = await import('@/db/client')
      
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                groupId: 'group-123',
                groupName: 'Test Group',
                ratioA: 60,
                ratioB: 40,
                userAId: 'user-123',
                userAName: 'User A',
                userAEmail: 'a@example.com',
              }])
            })
          })
        })
      } as any)

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        })
      } as any)

      const result = await getCurrentGroup()

      expect(result.success).toBe(true)
      if ('group' in result && result.group) {
        expect(result.group.ratio_a).toBe(60)
        expect(result.group.ratio_b).toBe(40)
      }
    })

    it('returns error if no group found', async () => {
      const { db } = await import('@/db/client')
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        })
      } as any)

      const result = await getCurrentGroup()
      expect(result.error).toBe('No group found')
    })
  })
})
