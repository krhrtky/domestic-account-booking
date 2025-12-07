import { DemoTransaction } from '../utils/demo-helpers'

export const decemberHouseholdTransactions: DemoTransaction[] = [
  {
    date: '2025-12-01',
    amount: 150000,
    description: 'Rent Payment',
    payer_type: 'UserA',
    expense_type: 'Household',
  },
  {
    date: '2025-12-05',
    amount: 8500,
    description: 'Grocery Shopping',
    payer_type: 'UserA',
    expense_type: 'Household',
  },
  {
    date: '2025-12-10',
    amount: 3200,
    description: 'Utility Bill',
    payer_type: 'UserA',
    expense_type: 'Household',
  },
  {
    date: '2025-12-03',
    amount: 12000,
    description: 'Internet/Phone',
    payer_type: 'UserB',
    expense_type: 'Household',
  },
  {
    date: '2025-12-15',
    amount: 25000,
    description: 'Furniture Purchase',
    payer_type: 'UserB',
    expense_type: 'Household',
  },
]

export const paginationTransactions = (count: number): DemoTransaction[] => {
  const transactions: DemoTransaction[] = []
  for (let i = 0; i < count; i++) {
    transactions.push({
      date: '2025-12-01',
      amount: 1000 + i * 100,
      description: 'Transaction ' + (i + 1).toString().padStart(3, '0'),
      payer_type: i % 2 === 0 ? 'UserA' : 'UserB',
      expense_type: 'Household',
    })
  }
  return transactions
}
