import { describe, it, expect } from 'vitest'
import { calculateSettlement } from './settlement'
import type { Transaction, Group } from './types'

describe('calculateSettlement', () => {
  const mockGroup: Group = {
    id: 'group-1',
    name: 'Test Household',
    ratio_a: 50,
    ratio_b: 50,
    user_a_id: 'user-a',
    user_b_id: 'user-b',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  it('Test Case 1: A paid 60k, B paid 40k, ratio 50:50 → balance = 0', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        group_id: 'group-1',
        date: '2025-01-10',
        amount: 60000,
        description: 'A payment',
        payer_type: 'UserA',
        user_id: 'user-a',
        expense_type: 'Household',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      },
      {
        id: '2',
        group_id: 'group-1',
        date: '2025-01-15',
        amount: 40000,
        description: 'B payment',
        payer_type: 'UserB',
        user_id: 'user-b',
        expense_type: 'Household',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
    ]

    const result = calculateSettlement(transactions, mockGroup, '2025-01')

    expect(result.total_household).toBe(100000)
    expect(result.paid_by_a_household).toBe(60000)
    expect(result.paid_by_b_household).toBe(40000)
    expect(result.balance_a).toBe(10000)
    expect(result.ratio_a).toBe(50)
    expect(result.ratio_b).toBe(50)
  })

  it('Test Case 2: A paid 80k, B paid 20k, ratio 60:40 → balance = 20k (B owes A)', () => {
    const groupWith60_40: Group = { ...mockGroup, ratio_a: 60, ratio_b: 40 }
    const transactions: Transaction[] = [
      {
        id: '1',
        group_id: 'group-1',
        date: '2025-01-10',
        amount: 80000,
        description: 'A payment',
        payer_type: 'UserA',
        user_id: 'user-a',
        expense_type: 'Household',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      },
      {
        id: '2',
        group_id: 'group-1',
        date: '2025-01-15',
        amount: 20000,
        description: 'B payment',
        payer_type: 'UserB',
        user_id: 'user-b',
        expense_type: 'Household',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
    ]

    const result = calculateSettlement(transactions, groupWith60_40, '2025-01')

    expect(result.total_household).toBe(100000)
    expect(result.paid_by_a_household).toBe(80000)
    expect(result.paid_by_b_household).toBe(20000)
    expect(result.balance_a).toBe(20000)
  })

  it('Test Case 3: A paid 30k, B paid 70k, ratio 50:50 → balance = -20k (A owes B)', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        group_id: 'group-1',
        date: '2025-01-10',
        amount: 30000,
        description: 'A payment',
        payer_type: 'UserA',
        user_id: 'user-a',
        expense_type: 'Household',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      },
      {
        id: '2',
        group_id: 'group-1',
        date: '2025-01-15',
        amount: 70000,
        description: 'B payment',
        payer_type: 'UserB',
        user_id: 'user-b',
        expense_type: 'Household',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
    ]

    const result = calculateSettlement(transactions, mockGroup, '2025-01')

    expect(result.total_household).toBe(100000)
    expect(result.paid_by_a_household).toBe(30000)
    expect(result.paid_by_b_household).toBe(70000)
    expect(result.balance_a).toBe(-20000)
  })

  it('Test Case 4: Only Common payments → balance = 0', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        group_id: 'group-1',
        date: '2025-01-10',
        amount: 50000,
        description: 'Common payment',
        payer_type: 'Common',
        user_id: 'user-a',
        expense_type: 'Household',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      },
    ]

    const result = calculateSettlement(transactions, mockGroup, '2025-01')

    expect(result.total_household).toBe(0)
    expect(result.paid_by_a_household).toBe(0)
    expect(result.paid_by_b_household).toBe(0)
    expect(result.paid_by_common).toBe(50000)
    expect(result.balance_a).toBe(0)
  })

  it('Test Case 5: Mixed Personal/Household → Personal excluded', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        group_id: 'group-1',
        date: '2025-01-10',
        amount: 50000,
        description: 'Household expense',
        payer_type: 'UserA',
        user_id: 'user-a',
        expense_type: 'Household',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      },
      {
        id: '2',
        group_id: 'group-1',
        date: '2025-01-15',
        amount: 30000,
        description: 'Personal expense',
        payer_type: 'UserA',
        user_id: 'user-a',
        expense_type: 'Personal',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
      },
      {
        id: '3',
        group_id: 'group-1',
        date: '2025-01-20',
        amount: 50000,
        description: 'Household expense',
        payer_type: 'UserB',
        user_id: 'user-b',
        expense_type: 'Household',
        created_at: '2025-01-20T00:00:00Z',
        updated_at: '2025-01-20T00:00:00Z',
      },
    ]

    const result = calculateSettlement(transactions, mockGroup, '2025-01')

    expect(result.total_household).toBe(100000)
    expect(result.paid_by_a_household).toBe(50000)
    expect(result.paid_by_b_household).toBe(50000)
    expect(result.balance_a).toBe(0)
  })

  it('filters transactions by month correctly', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        group_id: 'group-1',
        date: '2025-01-10',
        amount: 50000,
        description: 'January expense',
        payer_type: 'UserA',
        user_id: 'user-a',
        expense_type: 'Household',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      },
      {
        id: '2',
        group_id: 'group-1',
        date: '2025-02-10',
        amount: 30000,
        description: 'February expense',
        payer_type: 'UserA',
        user_id: 'user-a',
        expense_type: 'Household',
        created_at: '2025-02-10T00:00:00Z',
        updated_at: '2025-02-10T00:00:00Z',
      },
    ]

    const result = calculateSettlement(transactions, mockGroup, '2025-01')

    expect(result.total_household).toBe(50000)
    expect(result.paid_by_a_household).toBe(50000)
  })

  it('handles empty transaction list', () => {
    const result = calculateSettlement([], mockGroup, '2025-01')

    expect(result.total_household).toBe(0)
    expect(result.paid_by_a_household).toBe(0)
    expect(result.paid_by_b_household).toBe(0)
    expect(result.balance_a).toBe(0)
  })

  describe('input validation', () => {
    it('throws error when ratio_a is negative', () => {
      const invalidGroup: Group = { ...mockGroup, ratio_a: -10, ratio_b: 110 }
      expect(() => calculateSettlement([], invalidGroup, '2025-01')).toThrow(
        '負担割合Aは0〜100の範囲で入力してください'
      )
    })

    it('throws error when ratio_a is greater than 100', () => {
      const invalidGroup: Group = { ...mockGroup, ratio_a: 110, ratio_b: -10 }
      expect(() => calculateSettlement([], invalidGroup, '2025-01')).toThrow(
        '負担割合Aは0〜100の範囲で入力してください'
      )
    })

    it('throws error when ratio_b is negative', () => {
      const invalidGroup: Group = { ...mockGroup, ratio_a: 110, ratio_b: -10 }
      expect(() => calculateSettlement([], invalidGroup, '2025-01')).toThrow()
    })

    it('throws error when ratios do not sum to 100', () => {
      const invalidGroup: Group = { ...mockGroup, ratio_a: 40, ratio_b: 40 }
      expect(() => calculateSettlement([], invalidGroup, '2025-01')).toThrow(
        '負担割合の合計は100%である必要があります'
      )
    })

    it('throws error for invalid month format', () => {
      expect(() => calculateSettlement([], mockGroup, '2025-1')).toThrow(
        '月の形式が正しくありません'
      )
      expect(() => calculateSettlement([], mockGroup, '202501')).toThrow(
        '月の形式が正しくありません'
      )
      expect(() => calculateSettlement([], mockGroup, '2025/01')).toThrow(
        '月の形式が正しくありません'
      )
    })

    it('accepts valid month format YYYY-MM', () => {
      expect(() => calculateSettlement([], mockGroup, '2025-01')).not.toThrow()
      expect(() => calculateSettlement([], mockGroup, '2025-12')).not.toThrow()
    })

    it('normalizes month format 2025-1 to 2025-01', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          group_id: 'group-1',
          date: '2025-01-15',
          amount: 10000,
          description: 'Test',
          payer_type: 'UserA',
        user_id: 'user-a',
          expense_type: 'Household',
          created_at: '2025-01-15T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z',
        },
      ]
      const result = calculateSettlement(transactions, mockGroup, '2025-01')
      expect(result.month).toBe('2025-01')
    })
  })

  describe('floating point precision', () => {
    it('rounds balance to nearest integer', () => {
      const groupWith33_67: Group = { ...mockGroup, ratio_a: 33, ratio_b: 67 }
      const transactions: Transaction[] = [
        {
          id: '1',
          group_id: 'group-1',
          date: '2025-01-10',
          amount: 10000,
          description: 'Test',
          payer_type: 'UserA',
        user_id: 'user-a',
          expense_type: 'Household',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z',
        },
      ]
      const result = calculateSettlement(transactions, groupWith33_67, '2025-01')
      expect(Number.isInteger(result.balance_a)).toBe(true)
      expect(result.balance_a).toBe(6700)
    })
  })

  describe('L-BR-002: payer_user_id priority logic', () => {
    it('payer_user_id takes priority over payer_type when set', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          group_id: 'group-1',
          date: '2025-01-10',
          amount: 10000,
          description: 'Test - payer_type=UserA but payer_user_id=user-b',
          payer_type: 'UserA',
          payer_user_id: 'user-b',
          user_id: 'user-a',
          expense_type: 'Household',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z',
        },
      ]
      const result = calculateSettlement(transactions, mockGroup, '2025-01')
      expect(result.paid_by_b_household).toBe(10000)
      expect(result.paid_by_a_household).toBe(0)
    })

    it('falls back to payer_type when payer_user_id is NULL', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          group_id: 'group-1',
          date: '2025-01-10',
          amount: 10000,
          description: 'Test - payer_user_id is null',
          payer_type: 'UserA',
          payer_user_id: null,
          user_id: 'user-a',
          expense_type: 'Household',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z',
        },
      ]
      const result = calculateSettlement(transactions, mockGroup, '2025-01')
      expect(result.paid_by_a_household).toBe(10000)
    })

    it('falls back to payer_type when payer_user_id is undefined', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          group_id: 'group-1',
          date: '2025-01-10',
          amount: 10000,
          description: 'Test - payer_user_id is undefined',
          payer_type: 'UserB',
          user_id: 'user-a',
          expense_type: 'Household',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z',
        },
      ]
      const result = calculateSettlement(transactions, mockGroup, '2025-01')
      expect(result.paid_by_b_household).toBe(10000)
      expect(result.paid_by_a_household).toBe(0)
    })

    it('Common payer_type is excluded when payer_user_id is set', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          group_id: 'group-1',
          date: '2025-01-10',
          amount: 10000,
          description: 'Test - payer_type=Common but payer_user_id=user-a',
          payer_type: 'Common',
          payer_user_id: 'user-a',
          user_id: 'user-a',
          expense_type: 'Household',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z',
        },
      ]
      const result = calculateSettlement(transactions, mockGroup, '2025-01')
      expect(result.paid_by_a_household).toBe(10000)
      expect(result.paid_by_common).toBe(0)
    })

    it('Common payer_type without payer_user_id is tracked as common', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          group_id: 'group-1',
          date: '2025-01-10',
          amount: 10000,
          description: 'Test - payer_type=Common, no payer_user_id',
          payer_type: 'Common',
          user_id: 'user-a',
          expense_type: 'Household',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z',
        },
      ]
      const result = calculateSettlement(transactions, mockGroup, '2025-01')
      expect(result.paid_by_common).toBe(10000)
      expect(result.total_household).toBe(0)
    })

    it('mixed transactions with and without payer_user_id are calculated correctly', () => {
      const transactions: Transaction[] = [
        {
          id: '1',
          group_id: 'group-1',
          date: '2025-01-10',
          amount: 10000,
          description: 'UserA via payer_user_id',
          payer_type: 'UserB',
          payer_user_id: 'user-a',
          user_id: 'user-a',
          expense_type: 'Household',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z',
        },
        {
          id: '2',
          group_id: 'group-1',
          date: '2025-01-11',
          amount: 20000,
          description: 'UserB via payer_type fallback',
          payer_type: 'UserB',
          user_id: 'user-b',
          expense_type: 'Household',
          created_at: '2025-01-11T00:00:00Z',
          updated_at: '2025-01-11T00:00:00Z',
        },
        {
          id: '3',
          group_id: 'group-1',
          date: '2025-01-12',
          amount: 5000,
          description: 'Common via payer_type',
          payer_type: 'Common',
          user_id: 'user-a',
          expense_type: 'Household',
          created_at: '2025-01-12T00:00:00Z',
          updated_at: '2025-01-12T00:00:00Z',
        },
      ]
      const result = calculateSettlement(transactions, mockGroup, '2025-01')
      expect(result.paid_by_a_household).toBe(10000)
      expect(result.paid_by_b_household).toBe(20000)
      expect(result.paid_by_common).toBe(5000)
      expect(result.total_household).toBe(30000)
      expect(result.balance_a).toBe(-5000)
    })
  })
})
