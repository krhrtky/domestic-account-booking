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

      if (result.error) {
        setError(result.error)
        setSettlement(null)
      } else if (result.success) {
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Settlement Summary</h2>
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
