'use client'

import { updateTransactionPayer } from '@/app/actions/transactions'
import { useState, useRef } from 'react'
import { toast } from '@/lib/hooks/useToast'

interface PayerSelectProps {
  transactionId: string
  currentPayerUserId?: string | null
  groupUserAId: string
  groupUserBId?: string | null
  userAName: string
  userBName?: string | null
  onUpdate: () => void
}

export default function PayerSelect({
  transactionId,
  currentPayerUserId,
  groupUserAId,
  groupUserBId,
  userAName,
  userBName,
  onUpdate,
}: PayerSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const previousValue = currentPayerUserId ?? ''
    const payerUserId = value === '' ? null : value

    setIsUpdating(true)
    const result = await updateTransactionPayer(transactionId, payerUserId)
    setIsUpdating(false)

    if ('success' in result && result.success) {
      onUpdate()
    } else if ('error' in result) {
      const errorMessage = typeof result.error === 'string'
        ? result.error
        : '更新に失敗しました'
      toast.error(errorMessage)
      if (selectRef.current) {
        selectRef.current.value = previousValue
      }
    }
  }

  return (
    <select
      ref={selectRef}
      value={currentPayerUserId ?? ''}
      onChange={handleChange}
      disabled={isUpdating}
      className="text-xs px-2 py-1 rounded-lg border border-neutral-200 bg-white hover:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 transition-all duration-150"
      data-testid="payer-select"
    >
      <option value="">デフォルト</option>
      <option value={groupUserAId}>{userAName}</option>
      {groupUserBId && userBName && (
        <option value={groupUserBId}>{userBName}</option>
      )}
    </select>
  )
}
