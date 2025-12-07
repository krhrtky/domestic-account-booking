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

  const bgClass = currentType === 'Household' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={'px-3 py-1 rounded text-sm font-medium ' + bgClass + ' hover:opacity-80 disabled:opacity-50'}
        data-testid="expense-type-toggle"
      >
        {isUpdating ? '...' : currentType}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
