'use client'

import { Transaction } from '@/lib/types'
import ExpenseTypeToggle from './ExpenseTypeToggle'
import { deleteTransaction } from '@/app/actions/transactions'
import { useState } from 'react'

interface TransactionRowProps {
  transaction: Transaction
  onUpdate: () => void
}

export default function TransactionRow({ transaction, onUpdate }: TransactionRowProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this transaction?')) return

    setIsDeleting(true)
    const result = await deleteTransaction(transaction.id)
    setIsDeleting(false)

    if (result.success) {
      onUpdate()
    }
  }

  return (
    <tr className="border-b hover:bg-gray-50" data-testid={`transaction-row-${transaction.id}`}>
      <td className="px-4 py-3 text-sm text-gray-900" data-testid="transaction-date">
        {transaction.date}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900" data-testid="transaction-description">
        {transaction.description}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right" data-testid="transaction-amount">
        {transaction.amount.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-sm" data-testid="transaction-payer">
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
          {transaction.payer_type}
        </span>
      </td>
      <td className="px-4 py-3 text-sm" data-testid="transaction-expense-type">
        <ExpenseTypeToggle
          transactionId={transaction.id}
          currentType={transaction.expense_type}
          onUpdate={onUpdate}
        />
      </td>
      <td className="px-4 py-3 text-sm">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-800 disabled:opacity-50"
          data-testid="transaction-delete-btn"
        >
          Delete
        </button>
      </td>
    </tr>
  )
}
