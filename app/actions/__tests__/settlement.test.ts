import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const GetSettlementDataSchema = z.object({
  targetMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid month format. Expected YYYY-MM')
})

describe('GetSettlementDataSchema', () => {
  it('validates correct YYYY-MM format', () => {
    const result = GetSettlementDataSchema.safeParse({ targetMonth: '2025-01' })
    expect(result.success).toBe(true)
  })

  it('validates current month format', () => {
    const result = GetSettlementDataSchema.safeParse({ targetMonth: '2024-12' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid month format with leading zero missing', () => {
    const result = GetSettlementDataSchema.safeParse({ targetMonth: '2025-1' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid month format without hyphen', () => {
    const result = GetSettlementDataSchema.safeParse({ targetMonth: '202501' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid month number greater than 12', () => {
    const result = GetSettlementDataSchema.safeParse({ targetMonth: '2025-13' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid month number 00', () => {
    const result = GetSettlementDataSchema.safeParse({ targetMonth: '2025-00' })
    expect(result.success).toBe(false)
  })

  it('rejects date format YYYY-MM-DD', () => {
    const result = GetSettlementDataSchema.safeParse({ targetMonth: '2025-01-01' })
    expect(result.success).toBe(false)
  })

  it('rejects empty string', () => {
    const result = GetSettlementDataSchema.safeParse({ targetMonth: '' })
    expect(result.success).toBe(false)
  })
})
