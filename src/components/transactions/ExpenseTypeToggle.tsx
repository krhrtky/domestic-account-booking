'use client'

import { useState } from 'react'
import { updateTransactionExpenseType } from '@/app/actions/transactions'
import { ExpenseType } from '@/lib/types'

interface ExpenseTypeToggleProps {
  transactionId: string
  currentType: ExpenseType
  onUpdate?: () => void
}

export default function ExpenseTypeToggle({
  transactionId,
  currentType,
  onUpdate
}: ExpenseTypeToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async () => {
    setIsUpdating(true)
    setError(null)
    const newType: ExpenseType = currentType === 'Household' ? 'Personal' : 'Household'

    const result = await updateTransactionExpenseType(transactionId, newType)
    setIsUpdating(false)

    if (result.error) {
      setError('Failed to update')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (result.success && onUpdate) {
      onUpdate()
    }
  }

  const bgClass = currentType === 'Household' ? 'bg-semantic-info-light text-semantic-info' : 'bg-neutral-100 text-neutral-800'

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={'px-3 py-1 rounded-lg text-sm font-medium ' + bgClass + ' hover:opacity-80 disabled:opacity-60 transition-all duration-fast'}
        data-testid="expense-type-toggle"
        aria-label={`Toggle expense type, currently ${currentType}`}
        aria-pressed={currentType === 'Household' ? 'true' : 'false'}
      >
        {isUpdating ? '...' : currentType}
      </button>
      {error && <span className="text-xs text-semantic-error">{error}</span>}
    </div>
  )
}
