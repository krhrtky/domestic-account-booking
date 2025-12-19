'use client'

import { useState, useEffect } from 'react'
import { getSettlementData } from '@/app/actions/transactions'
import MonthSelector from './MonthSelector'
import SettlementSummary from './SettlementSummary'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import ErrorAlert from '@/components/ui/ErrorAlert'
import type { Settlement } from '@/lib/types'

const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const generateMonths = (count: number = 12) => {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
  }
  return months
}

export default function SettlementDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [userAName, setUserAName] = useState<string>('User A')
  const [userBName, setUserBName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const months = generateMonths()

  useEffect(() => {
    const fetchSettlement = async () => {
      setIsLoading(true)
      setError(null)
      const result = await getSettlementData(selectedMonth)

      if ('error' in result) {
        setError(result.error)
        setSettlement(null)
      } else if ('success' in result && result.success) {
        setSettlement(result.settlement)
        setUserAName(result.userAName)
        setUserBName(result.userBName)
      }

      setIsLoading(false)
    }

    fetchSettlement()
  }, [selectedMonth])

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900">精算サマリー</h2>
        </div>
        <MonthSelector
          months={months}
          selectedMonth={selectedMonth}
          onChange={setSelectedMonth}
        />
      </div>

      {isLoading && <LoadingSkeleton variant="card" />}

      {error && (
        <ErrorAlert
          variant="card"
          message={error}
          retry={handleRetry}
        />
      )}

      {!isLoading && !error && settlement && (
        <SettlementSummary
          settlement={settlement}
          userAName={userAName}
          userBName={userBName}
        />
      )}
    </div>
  )
}
