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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Month
        </label>
        <input
          type="month"
          value={month || ''}
          onChange={(e) => onFilterChange({ month: e.target.value || undefined, expenseType, payerType })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expense Type
        </label>
        <select
          name="expenseType"
          value={expenseType || ''}
          onChange={(e) => onFilterChange({ month, expenseType: e.target.value as ExpenseType || undefined, payerType })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="Household">Household</option>
          <option value="Personal">Personal</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payer
        </label>
        <select
          name="payerType"
          value={payerType || ''}
          onChange={(e) => onFilterChange({ month, expenseType, payerType: e.target.value as PayerType || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
