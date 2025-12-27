'use client'

import { updateTransactionPayer } from '@/app/actions/transactions'
import { useState, useRef } from 'react'
import { toast } from '@/lib/hooks/useToast'
import { PayerType } from '@/lib/types'

interface PayerSelectProps {
  transactionId: string
  currentPayerUserId?: string | null
  currentPayerType: PayerType
  groupUserAId: string
  groupUserBId?: string | null
  userAName: string
  userBName?: string | null
  onUpdate: () => void
}

const COMMON_VALUE = 'common'

export default function PayerSelect({
  transactionId,
  currentPayerUserId,
  currentPayerType,
  groupUserAId,
  groupUserBId,
  userAName,
  userBName,
  onUpdate,
}: PayerSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  const getCurrentValue = (): string => {
    if (currentPayerType === 'Common') {
      return COMMON_VALUE
    }
    if (currentPayerUserId) {
      return currentPayerUserId
    }
    if (currentPayerType === 'UserA') {
      return groupUserAId
    }
    if (currentPayerType === 'UserB' && groupUserBId) {
      return groupUserBId
    }
    return groupUserAId
  }

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const previousValue = getCurrentValue()

    let payerUserId: string | null
    let payerType: PayerType

    if (value === COMMON_VALUE) {
      payerUserId = null
      payerType = 'Common'
    } else if (value === groupUserAId) {
      payerUserId = groupUserAId
      payerType = 'UserA'
    } else if (value === groupUserBId) {
      payerUserId = groupUserBId
      payerType = 'UserB'
    } else {
      payerUserId = value
      payerType = 'UserA'
    }

    setIsUpdating(true)
    const result = await updateTransactionPayer(transactionId, payerUserId, payerType)
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
      value={getCurrentValue()}
      onChange={handleChange}
      disabled={isUpdating}
      className="text-xs px-2 py-1 rounded-lg border border-neutral-200 bg-white hover:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 transition-all duration-150"
      data-testid="payer-select"
    >
      <option value={groupUserAId}>{userAName}</option>
      {groupUserBId && userBName && (
        <option value={groupUserBId}>{userBName}</option>
      )}
      <option value={COMMON_VALUE}>共通口座</option>
    </select>
  )
}
