import type { Transaction, Group, Settlement } from './types'

const MONTH_FORMAT_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

const validateRatio = (ratioA: number, ratioB: number): void => {
  if (ratioA < 0 || ratioA > 100) {
    throw new Error('ratio_a must be between 0 and 100')
  }
  if (ratioB < 0 || ratioB > 100) {
    throw new Error('ratio_b must be between 0 and 100')
  }
  if (ratioA + ratioB !== 100) {
    throw new Error('ratio_a + ratio_b must equal 100')
  }
}

const validateMonthFormat = (month: string): void => {
  if (!MONTH_FORMAT_REGEX.test(month)) {
    throw new Error('Invalid month format. Expected YYYY-MM (e.g., 2025-01)')
  }
}

export const calculateSettlement = (
  transactions: Transaction[],
  group: Group,
  targetMonth: string
): Settlement => {
  validateRatio(group.ratio_a, group.ratio_b)
  validateMonthFormat(targetMonth)

  const householdTransactions = transactions.filter((t) => {
    const dateStr =
      typeof t.date === 'string'
        ? t.date
        : (t.date as unknown as Date).toISOString().slice(0, 10)
    return t.expense_type === 'Household' && dateStr.startsWith(targetMonth)
  })

  const toNumber = (val: number | string): number =>
    typeof val === 'string' ? parseFloat(val) : val

  const paidByA = householdTransactions
    .filter((t) => t.payer_type === 'UserA')
    .reduce((sum, t) => sum + toNumber(t.amount), 0)

  const paidByB = householdTransactions
    .filter((t) => t.payer_type === 'UserB')
    .reduce((sum, t) => sum + toNumber(t.amount), 0)

  const paidByCommon = householdTransactions
    .filter((t) => t.payer_type === 'Common')
    .reduce((sum, t) => sum + toNumber(t.amount), 0)

  const totalHousehold = paidByA + paidByB

  const ratioA = group.ratio_a / 100
  const balanceA = Math.round(paidByA - totalHousehold * ratioA)

  return {
    month: targetMonth,
    total_household: totalHousehold,
    paid_by_a_household: paidByA,
    paid_by_b_household: paidByB,
    paid_by_common: paidByCommon,
    balance_a: balanceA,
    ratio_a: group.ratio_a,
    ratio_b: group.ratio_b,
  }
}
