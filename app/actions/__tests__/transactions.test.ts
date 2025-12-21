import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const UploadCSVSchema = z.object({
  csvContent: z.string().min(1),
  fileName: z.string().min(1).max(255),
  payerType: z.enum(['UserA', 'UserB', 'Common'])
})

const UpdateExpenseTypeSchema = z.object({
  transactionId: z.string().uuid(),
  expenseType: z.enum(['Household', 'Personal'])
})

const GetTransactionsSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  expenseType: z.enum(['Household', 'Personal']).optional(),
  payerType: z.enum(['UserA', 'UserB', 'Common']).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional()
})

describe('L-BR-002: Payer name matching logic', () => {
  describe('Typical Cases', () => {
    it('matches exact name case-insensitively', () => {
      const usersByName = new Map([
        ['alice', 'user-a-id'],
        ['bob', 'user-b-id']
      ])

      const payerName = 'Alice'
      const foundUserId = usersByName.get(payerName.toLowerCase())

      expect(foundUserId).toBe('user-a-id')
    })

    it('returns undefined when name does not match', () => {
      const usersByName = new Map([
        ['alice', 'user-a-id'],
        ['bob', 'user-b-id']
      ])

      const payerName = 'Charlie'
      const foundUserId = usersByName.get(payerName.toLowerCase())

      expect(foundUserId).toBeUndefined()
    })
  })

  describe('Boundary Cases', () => {
    it('handles empty payer_name', () => {
      const usersByName = new Map([
        ['alice', 'user-a-id']
      ])

      const payerName = ''
      const foundUserId = usersByName.get(payerName.toLowerCase())

      expect(foundUserId).toBeUndefined()
    })

    it('handles whitespace-only payer_name', () => {
      const usersByName = new Map([
        ['alice', 'user-a-id']
      ])

      const payerName = '   '.trim()
      const foundUserId = payerName ? usersByName.get(payerName.toLowerCase()) : undefined

      expect(foundUserId).toBeUndefined()
    })
  })

  describe('Gray Cases', () => {
    it('handles Japanese names case-insensitively', () => {
      const usersByName = new Map([
        ['田中太郎', 'user-a-id']
      ])

      const payerName = '田中太郎'
      const foundUserId = usersByName.get(payerName.toLowerCase())

      expect(foundUserId).toBe('user-a-id')
    })

    it('does not match partial names', () => {
      const usersByName = new Map([
        ['alice smith', 'user-a-id']
      ])

      const payerName = 'alice'
      const foundUserId = usersByName.get(payerName.toLowerCase())

      expect(foundUserId).toBeUndefined()
    })
  })
})

describe('L-BR-006: CSV Upload with payer_user_id logic', () => {
  type PayerType = 'UserA' | 'UserB' | 'Common'

  function applyPayerLogic(
    payerType: PayerType,
    payerName: string | undefined,
    usersByName: Map<string, string>
  ): string | null {
    let payerUserId: string | null = null
    if (payerType !== 'Common' && payerName) {
      const foundUserId = usersByName.get(payerName.toLowerCase())
      if (foundUserId) {
        payerUserId = foundUserId
      }
    }
    return payerUserId
  }

  describe('Typical Cases', () => {
    it('sets payer_user_id when name matches and payer_type is not Common', () => {
      const usersByName = new Map([['alice', 'user-a-id']])
      const result = applyPayerLogic('UserA', 'Alice', usersByName)
      expect(result).toBe('user-a-id')
    })

    it('leaves payer_user_id as NULL when name does not match', () => {
      const usersByName = new Map([['alice', 'user-a-id']])
      const result = applyPayerLogic('UserA', 'Charlie', usersByName)
      expect(result).toBeNull()
    })
  })

  describe('Boundary Cases - L-BR-002: Common口座強制NULL', () => {
    it('forces payer_user_id to NULL when payer_type is Common', () => {
      const usersByName = new Map([['alice', 'user-a-id']])
      const result = applyPayerLogic('Common', 'Alice', usersByName)
      expect(result).toBeNull()
    })

    it('forces payer_user_id to NULL even when name matches', () => {
      const usersByName = new Map([
        ['alice', 'user-a-id'],
        ['bob', 'user-b-id']
      ])
      const result = applyPayerLogic('Common', 'Bob', usersByName)
      expect(result).toBeNull()
    })
  })

  describe('Gray Cases', () => {
    it('handles empty payer_name with UserA payer_type', () => {
      const usersByName = new Map([['alice', 'user-a-id']])
      const result = applyPayerLogic('UserA', '', usersByName)
      expect(result).toBeNull()
    })

    it('handles undefined payer_name', () => {
      const usersByName = new Map([['alice', 'user-a-id']])
      const result = applyPayerLogic('UserA', undefined, usersByName)
      expect(result).toBeNull()
    })
  })
})

describe('Transaction validation schemas', () => {
  describe('UploadCSVSchema', () => {
    it('should validate valid CSV upload data', () => {
      const valid = {
        csvContent: 'date,description,amount\n2024-01-01,Test,100',
        fileName: 'test.csv',
        payerType: 'UserA' as const
      }
      expect(UploadCSVSchema.safeParse(valid).success).toBe(true)
    })

    it('should reject empty CSV content', () => {
      const invalid = {
        csvContent: '',
        fileName: 'test.csv',
        payerType: 'UserA' as const
      }
      expect(UploadCSVSchema.safeParse(invalid).success).toBe(false)
    })

    it('should reject empty file name', () => {
      const invalid = {
        csvContent: 'data',
        fileName: '',
        payerType: 'UserA' as const
      }
      expect(UploadCSVSchema.safeParse(invalid).success).toBe(false)
    })

    it('should reject file name over 255 characters', () => {
      const invalid = {
        csvContent: 'data',
        fileName: 'a'.repeat(256),
        payerType: 'UserA' as const
      }
      expect(UploadCSVSchema.safeParse(invalid).success).toBe(false)
    })

    it('should reject invalid payer type', () => {
      const invalid = {
        csvContent: 'data',
        fileName: 'test.csv',
        payerType: 'Invalid'
      }
      expect(UploadCSVSchema.safeParse(invalid).success).toBe(false)
    })
  })

  describe('UpdateExpenseTypeSchema', () => {
    it('should validate valid expense type update', () => {
      const valid = {
        transactionId: '123e4567-e89b-12d3-a456-426614174000',
        expenseType: 'Household' as const
      }
      expect(UpdateExpenseTypeSchema.safeParse(valid).success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalid = {
        transactionId: 'not-a-uuid',
        expenseType: 'Household' as const
      }
      expect(UpdateExpenseTypeSchema.safeParse(invalid).success).toBe(false)
    })

    it('should reject invalid expense type', () => {
      const invalid = {
        transactionId: '123e4567-e89b-12d3-a456-426614174000',
        expenseType: 'Invalid'
      }
      expect(UpdateExpenseTypeSchema.safeParse(invalid).success).toBe(false)
    })
  })

  describe('GetTransactionsSchema', () => {
    it('should validate filters with all options', () => {
      const valid = {
        month: '2024-01',
        expenseType: 'Household' as const,
        payerType: 'UserA' as const
      }
      expect(GetTransactionsSchema.safeParse(valid).success).toBe(true)
    })

    it('should validate empty filters', () => {
      const valid = {}
      expect(GetTransactionsSchema.safeParse(valid).success).toBe(true)
    })

    it('should reject invalid month format', () => {
      const invalid = {
        month: '2024-1'
      }
      expect(GetTransactionsSchema.safeParse(invalid).success).toBe(false)
    })

    it('should reject invalid month format with day', () => {
      const invalid = {
        month: '2024-01-01'
      }
      expect(GetTransactionsSchema.safeParse(invalid).success).toBe(false)
    })

    it('should accept valid month format', () => {
      const valid = {
        month: '2024-12'
      }
      expect(GetTransactionsSchema.safeParse(valid).success).toBe(true)
    })

    it('should validate cursor parameter', () => {
      const valid = {
        cursor: '2024-01-15|uuid-here'
      }
      expect(GetTransactionsSchema.safeParse(valid).success).toBe(true)
    })

    it('should validate limit within range', () => {
      const valid = {
        limit: 50
      }
      expect(GetTransactionsSchema.safeParse(valid).success).toBe(true)
    })

    it('should reject limit below minimum', () => {
      const invalid = {
        limit: 0
      }
      expect(GetTransactionsSchema.safeParse(invalid).success).toBe(false)
    })

    it('should reject limit above maximum', () => {
      const invalid = {
        limit: 101
      }
      expect(GetTransactionsSchema.safeParse(invalid).success).toBe(false)
    })

    it('should reject non-integer limit', () => {
      const invalid = {
        limit: 50.5
      }
      expect(GetTransactionsSchema.safeParse(invalid).success).toBe(false)
    })

    it('should validate all pagination parameters together', () => {
      const valid = {
        month: '2024-01',
        expenseType: 'Household' as const,
        payerType: 'UserA' as const,
        cursor: '2024-01-15|123e4567-e89b-12d3-a456-426614174000',
        limit: 50
      }
      expect(GetTransactionsSchema.safeParse(valid).success).toBe(true)
    })
  })
})
