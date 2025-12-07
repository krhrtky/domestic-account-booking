'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Transaction } from '@/lib/types'
import TransactionRow from './TransactionRow'

interface TransactionListProps {
  transactions: Transaction[]
  onUpdate: () => void
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

export default function TransactionList({
  transactions,
  onUpdate,
  hasMore,
  isLoadingMore,
  onLoadMore
}: TransactionListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedLoadMore = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      onLoadMore()
    }, 200)
  }, [onLoadMore])

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          debouncedLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [hasMore, isLoadingMore, debouncedLoadMore])

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No transactions found
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onUpdate={onUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div ref={loadMoreRef} className="mt-6 text-center">
          {isLoadingMore ? (
            <div className="inline-flex items-center text-gray-500">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading more...
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-6 rounded-lg transition-colors"
            >
              Load More
            </button>
          )}
        </div>
      )}

      {!hasMore && transactions.length > 0 && (
        <div className="mt-6 text-center text-gray-500 text-sm">
          No more transactions to load
        </div>
      )}
    </div>
  )
}
