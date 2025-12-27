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

const UpdatePayerSchema = z.object({
  transactionId: z.string().uuid(),
  payerUserId: z.string().uuid().nullable(),
  payerType: z.enum(['UserA', 'UserB', 'Common'])
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

  describe('L-AS-002: UpdatePayerSchema validation', () => {
    describe('Typical Cases', () => {
      it('should validate valid payer update with UserA', () => {
        const valid = {
          transactionId: '123e4567-e89b-12d3-a456-426614174000',
          payerUserId: '987fcdeb-51a2-3c4d-5e6f-789012345678',
          payerType: 'UserA' as const
        }
        expect(UpdatePayerSchema.safeParse(valid).success).toBe(true)
      })

      it('should validate valid payer update with UserB', () => {
        const valid = {
          transactionId: '123e4567-e89b-12d3-a456-426614174000',
          payerUserId: '987fcdeb-51a2-3c4d-5e6f-789012345678',
          payerType: 'UserB' as const
        }
        expect(UpdatePayerSchema.safeParse(valid).success).toBe(true)
      })

      it('should validate Common payer type with null payerUserId', () => {
        const valid = {
          transactionId: '123e4567-e89b-12d3-a456-426614174000',
          payerUserId: null,
          payerType: 'Common' as const
        }
        expect(UpdatePayerSchema.safeParse(valid).success).toBe(true)
      })
    })

    describe('Boundary Cases', () => {
      it('should accept null payerUserId for any payerType', () => {
        const valid = {
          transactionId: '123e4567-e89b-12d3-a456-426614174000',
          payerUserId: null,
          payerType: 'UserA' as const
        }
        expect(UpdatePayerSchema.safeParse(valid).success).toBe(true)
      })

      it('should reject undefined payerUserId', () => {
        const invalid = {
          transactionId: '123e4567-e89b-12d3-a456-426614174000',
          payerType: 'UserA' as const
        }
        expect(UpdatePayerSchema.safeParse(invalid).success).toBe(false)
      })

      it('should reject missing payerType', () => {
        const invalid = {
          transactionId: '123e4567-e89b-12d3-a456-426614174000',
          payerUserId: null
        }
        expect(UpdatePayerSchema.safeParse(invalid).success).toBe(false)
      })
    })

    describe('Attack Cases - L-SC-002', () => {
      it('should reject invalid UUID for transactionId', () => {
        const invalid = {
          transactionId: 'not-a-uuid; DROP TABLE transactions;',
          payerUserId: null,
          payerType: 'UserA' as const
        }
        expect(UpdatePayerSchema.safeParse(invalid).success).toBe(false)
      })

      it('should reject invalid UUID for payerUserId', () => {
        const invalid = {
          transactionId: '123e4567-e89b-12d3-a456-426614174000',
          payerUserId: 'invalid-uuid',
          payerType: 'UserA' as const
        }
        expect(UpdatePayerSchema.safeParse(invalid).success).toBe(false)
      })

      it('should reject invalid payerType', () => {
        const invalid = {
          transactionId: '123e4567-e89b-12d3-a456-426614174000',
          payerUserId: null,
          payerType: 'Admin'
        }
        expect(UpdatePayerSchema.safeParse(invalid).success).toBe(false)
      })
    })
  })
})

describe('L-BR-002: PayerSelect value determination logic', () => {
  type PayerType = 'UserA' | 'UserB' | 'Common'

  const COMMON_VALUE = 'common'
  const groupUserAId = 'user-a-id-123'
  const groupUserBId = 'user-b-id-456'

  function getCurrentValue(
    currentPayerType: PayerType,
    currentPayerUserId: string | null | undefined,
    groupUserAId: string,
    groupUserBId: string | null
  ): string {
    if (currentPayerType === 'Common') {
      return COMMON_VALUE
    }
    if (currentPayerUserId) {
      return currentPayerUserId
    }
    if (currentPayerType === 'UserA') {
      return groupUserAId
    }
    if (currentPayerType === 'UserB' && groupUserBId) {
      return groupUserBId
    }
    return groupUserAId
  }

  describe('Typical Cases', () => {
    it('returns groupUserAId when payerType is UserA and no payerUserId', () => {
      const result = getCurrentValue('UserA', null, groupUserAId, groupUserBId)
      expect(result).toBe(groupUserAId)
    })

    it('returns groupUserBId when payerType is UserB and no payerUserId', () => {
      const result = getCurrentValue('UserB', null, groupUserAId, groupUserBId)
      expect(result).toBe(groupUserBId)
    })

    it('returns COMMON_VALUE when payerType is Common', () => {
      const result = getCurrentValue('Common', null, groupUserAId, groupUserBId)
      expect(result).toBe(COMMON_VALUE)
    })

    it('returns payerUserId when it is set', () => {
      const customUserId = 'custom-user-id'
      const result = getCurrentValue('UserA', customUserId, groupUserAId, groupUserBId)
      expect(result).toBe(customUserId)
    })
  })

  describe('Boundary Cases', () => {
    it('returns COMMON_VALUE even when payerUserId is set (Common takes priority)', () => {
      const result = getCurrentValue('Common', 'some-user-id', groupUserAId, groupUserBId)
      expect(result).toBe(COMMON_VALUE)
    })

    it('returns groupUserAId when UserB but groupUserBId is null', () => {
      const result = getCurrentValue('UserB', null, groupUserAId, null)
      expect(result).toBe(groupUserAId)
    })

    it('handles undefined payerUserId same as null', () => {
      const result = getCurrentValue('UserA', undefined, groupUserAId, groupUserBId)
      expect(result).toBe(groupUserAId)
    })
  })

  describe('Gray Cases - ISSUE-2: payer_type mismatch handling', () => {
    it('returns payerUserId when set, regardless of payer_type (showing the override)', () => {
      const result = getCurrentValue('UserA', groupUserBId, groupUserAId, groupUserBId)
      expect(result).toBe(groupUserBId)
    })
  })
})

describe('L-BR-002: PayerSelect change handler logic', () => {
  type PayerType = 'UserA' | 'UserB' | 'Common'

  const COMMON_VALUE = 'common'
  const groupUserAId = 'user-a-id-123'
  const groupUserBId = 'user-b-id-456'

  function determinePayerFromValue(
    value: string,
    groupUserAId: string,
    groupUserBId: string | null
  ): { payerUserId: string | null; payerType: PayerType } {
    if (value === COMMON_VALUE) {
      return { payerUserId: null, payerType: 'Common' }
    }
    if (value === groupUserAId) {
      return { payerUserId: groupUserAId, payerType: 'UserA' }
    }
    if (value === groupUserBId) {
      return { payerUserId: groupUserBId, payerType: 'UserB' }
    }
    return { payerUserId: value, payerType: 'UserA' }
  }

  describe('Typical Cases', () => {
    it('selects UserA correctly', () => {
      const result = determinePayerFromValue(groupUserAId, groupUserAId, groupUserBId)
      expect(result).toEqual({ payerUserId: groupUserAId, payerType: 'UserA' })
    })

    it('selects UserB correctly', () => {
      const result = determinePayerFromValue(groupUserBId, groupUserAId, groupUserBId)
      expect(result).toEqual({ payerUserId: groupUserBId, payerType: 'UserB' })
    })

    it('selects Common correctly', () => {
      const result = determinePayerFromValue(COMMON_VALUE, groupUserAId, groupUserBId)
      expect(result).toEqual({ payerUserId: null, payerType: 'Common' })
    })
  })

  describe('Boundary Cases', () => {
    it('handles unknown value as UserA fallback', () => {
      const unknownValue = 'unknown-user-id'
      const result = determinePayerFromValue(unknownValue, groupUserAId, groupUserBId)
      expect(result).toEqual({ payerUserId: unknownValue, payerType: 'UserA' })
    })

    it('handles null groupUserBId correctly', () => {
      const result = determinePayerFromValue(COMMON_VALUE, groupUserAId, null)
      expect(result).toEqual({ payerUserId: null, payerType: 'Common' })
    })
  })

  describe('ISSUE-3: payer_type updates with selection', () => {
    it('sets payer_type to Common when selecting Common option', () => {
      const result = determinePayerFromValue(COMMON_VALUE, groupUserAId, groupUserBId)
      expect(result.payerType).toBe('Common')
      expect(result.payerUserId).toBeNull()
    })

    it('sets payer_type to UserB when selecting UserB option', () => {
      const result = determinePayerFromValue(groupUserBId, groupUserAId, groupUserBId)
      expect(result.payerType).toBe('UserB')
      expect(result.payerUserId).toBe(groupUserBId)
    })
  })
})
