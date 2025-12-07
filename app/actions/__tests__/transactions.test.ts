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
  payerType: z.enum(['UserA', 'UserB', 'Common']).optional()
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
  })
})
