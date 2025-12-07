'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTransactions } from '@/app/actions/transactions'
import { Transaction, ExpenseType, PayerType } from '@/lib/types'
import TransactionList from '@/components/transactions/TransactionList'
import TransactionFilters from '@/components/transactions/TransactionFilters'
import Link from 'next/link'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [filters, setFilters] = useState<{
    month?: string
    expenseType?: ExpenseType
    payerType?: PayerType
  }>({})

  const loadTransactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setTransactions([])
    setNextCursor(null)
    setHasMore(false)

    const result = await getTransactions(filters)

    if (result.error) {
      setError(typeof result.error === 'string' ? result.error : 'Failed to load transactions')
    } else if (result.transactions) {
      setTransactions(result.transactions)
      setNextCursor(result.nextCursor || null)
      setHasMore(result.hasMore || false)
    }

    setIsLoading(false)
  }, [filters])

  const loadMore = async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return

    setIsLoadingMore(true)
    setError(null)

    const result = await getTransactions({
      ...filters,
      cursor: nextCursor
    })

    if (result.error) {
      setError(typeof result.error === 'string' ? result.error : 'Failed to load more transactions')
    } else if (result.transactions) {
      setTransactions(prev => [...prev, ...result.transactions])
      setNextCursor(result.nextCursor || null)
      setHasMore(result.hasMore || false)
    }

    setIsLoadingMore(false)
  }

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Transactions</h1>
          <Link
            href="/dashboard/transactions/upload"
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Upload CSV
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <TransactionFilters
            month={filters.month}
            expenseType={filters.expenseType}
            payerType={filters.payerType}
            onFilterChange={setFilters}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              Loading...
            </div>
          ) : (
            <TransactionList
              transactions={transactions}
              onUpdate={loadTransactions}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMore}
            />
          )}
        </div>
      </div>
    </div>
  )
}
