import type { Transaction, Group, Settlement } from './types'

export const calculateSettlement = (
  transactions: Transaction[],
  group: Group,
  targetMonth: string
): Settlement => {
  const householdTransactions = transactions.filter(
    (t) => t.expense_type === 'Household' && t.date.startsWith(targetMonth)
  )

  const paidByA = householdTransactions
    .filter((t) => t.payer_type === 'UserA')
    .reduce((sum, t) => sum + t.amount, 0)

  const paidByB = householdTransactions
    .filter((t) => t.payer_type === 'UserB')
    .reduce((sum, t) => sum + t.amount, 0)

  const paidByCommon = householdTransactions
    .filter((t) => t.payer_type === 'Common')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalHousehold = paidByA + paidByB

  const ratioA = group.ratio_a / 100
  const balanceA = paidByA - totalHousehold * ratioA

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
