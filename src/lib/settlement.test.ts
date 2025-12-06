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
})
