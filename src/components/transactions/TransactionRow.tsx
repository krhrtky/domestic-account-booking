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
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        {transaction.date}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {transaction.description}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 text-right">
        {transaction.amount.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
          {transaction.payer_type}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
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
        >
          Delete
        </button>
      </td>
    </tr>
  )
}
