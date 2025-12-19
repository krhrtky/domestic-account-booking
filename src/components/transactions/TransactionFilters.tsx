'use client'

import { ExpenseType, PayerType } from '@/lib/types'

interface TransactionFiltersProps {
  month?: string
  expenseType?: ExpenseType
  payerType?: PayerType
  onFilterChange: (filters: {
    month?: string
    expenseType?: ExpenseType
    payerType?: PayerType
  }) => void
}

export default function TransactionFilters({
  month,
  expenseType,
  payerType,
  onFilterChange
}: TransactionFiltersProps) {
  return (
    <div className="flex gap-4 mb-6">
      <div>
        <label htmlFor="month-filter" className="block text-sm font-medium text-neutral-700 mb-1">
          Month
        </label>
        <input
          type="month"
          id="month-filter"
          value={month || ''}
          onChange={(e) => onFilterChange({ month: e.target.value || undefined, expenseType, payerType })}
          className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
        />
      </div>

      <div>
        <label htmlFor="expense-type-filter" className="block text-sm font-medium text-neutral-700 mb-1">
          Expense Type
        </label>
        <select
          id="expense-type-filter"
          name="expenseType"
          value={expenseType || ''}
          onChange={(e) => onFilterChange({ month, expenseType: e.target.value as ExpenseType || undefined, payerType })}
          className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
        >
          <option value="">All</option>
          <option value="Household">Household</option>
          <option value="Personal">Personal</option>
        </select>
      </div>

      <div>
        <label htmlFor="payer-type-filter" className="block text-sm font-medium text-neutral-700 mb-1">
          Payer
        </label>
        <select
          id="payer-type-filter"
          name="payerType"
          value={payerType || ''}
          onChange={(e) => onFilterChange({ month, expenseType, payerType: e.target.value as PayerType || undefined })}
          className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
        >
          <option value="">All</option>
          <option value="UserA">User A</option>
          <option value="UserB">User B</option>
          <option value="Common">Common</option>
        </select>
      </div>
    </div>
  )
}
