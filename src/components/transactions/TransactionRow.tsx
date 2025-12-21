'use client'

import { Transaction } from '@/lib/types'
import { formatCurrency } from '@/lib/formatters'
import ExpenseTypeToggle from './ExpenseTypeToggle'
import PayerSelect from './PayerSelect'
import { deleteTransaction } from '@/app/actions/transactions'
import { useState } from 'react'

interface TransactionRowProps {
  transaction: Transaction
  groupUserAId: string
  groupUserBId?: string | null
  userAName: string
  userBName?: string | null
  onUpdate: () => void
}

const payerStyles: Record<string, { bg: string; text: string; border: string }> = {
  UserA: { bg: 'bg-brand-primary/10', text: 'text-brand-primary', border: 'border-brand-primary/20' },
  UserB: { bg: 'bg-brand-accent/10', text: 'text-brand-accent', border: 'border-brand-accent/20' },
  Common: { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200' },
}

export default function TransactionRow({ transaction, groupUserAId, groupUserBId, userAName, userBName, onUpdate }: TransactionRowProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('この取引を削除しますか？')) return

    setIsDeleting(true)
    const result = await deleteTransaction(transaction.id)
    setIsDeleting(false)

    if (result.success) {
      onUpdate()
    }
  }

  const payer = payerStyles[transaction.payer_type] || payerStyles.Common

  return (
    <tr
      className="group hover:bg-brand-primary/[0.02] transition-colors duration-150"
      data-testid={`transaction-row-${transaction.id}`}
    >
      <td className="px-4 py-4 text-sm text-neutral-600" data-testid="transaction-date">
        <span className="font-medium text-neutral-900">{transaction.date}</span>
      </td>
      <td className="px-4 py-4 text-sm text-neutral-700 max-w-xs truncate" data-testid="transaction-description">
        {transaction.description}
      </td>
      <td className="px-4 py-4 text-sm text-right" data-testid="transaction-amount">
        <span className="font-bold text-neutral-900">
          {formatCurrency(Math.round(transaction.amount))}
        </span>
      </td>
      <td className="px-4 py-4 text-sm" data-testid="transaction-payer">
        <div className="flex flex-col gap-1">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${payer.bg} ${payer.text} ${payer.border}`}>
            {transaction.payer_type}
          </span>
          <PayerSelect
            transactionId={transaction.id}
            currentPayerUserId={transaction.payer_user_id}
            groupUserAId={groupUserAId}
            groupUserBId={groupUserBId}
            userAName={userAName}
            userBName={userBName}
            onUpdate={onUpdate}
          />
        </div>
      </td>
      <td className="px-4 py-4 text-sm" data-testid="transaction-expense-type">
        <ExpenseTypeToggle
          transactionId={transaction.id}
          currentType={transaction.expense_type}
          onUpdate={onUpdate}
        />
      </td>
      <td className="px-4 py-4 text-sm">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-semantic-error hover:bg-semantic-error-light disabled:opacity-50 transition-all duration-150"
          data-testid="transaction-delete-btn"
          aria-label={`取引を削除: ${transaction.description} (${transaction.date})`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">削除</span>
        </button>
      </td>
    </tr>
  )
}
