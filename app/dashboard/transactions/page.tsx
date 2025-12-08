'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { getTransactions } from '@/app/actions/transactions'
import { Transaction, ExpenseType, PayerType } from '@/lib/types'
import TransactionList from '@/components/transactions/TransactionList'
import TransactionFilters from '@/components/transactions/TransactionFilters'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import ErrorAlert from '@/components/ui/ErrorAlert'
import Link from 'next/link'

interface Pagination {
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

function TransactionsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = [10, 25, 50].includes(parseInt(searchParams.get('size') || '25', 10))
    ? parseInt(searchParams.get('size') || '25', 10)
    : 25
  const month = searchParams.get('month') || undefined
  const expenseType = (searchParams.get('expenseType') as ExpenseType) || undefined
  const payerType = (searchParams.get('payerType') as PayerType) || undefined

  const updateURL = useCallback((params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value)
    })

    router.push(`${pathname}?${newParams.toString()}`)
  }, [router, pathname])

  const loadTransactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const result = await getTransactions({
      month,
      expenseType,
      payerType,
      page,
      pageSize
    })

    if (result.error) {
      setError(typeof result.error === 'string' ? result.error : 'Failed to load transactions')
    } else if (result.transactions && result.pagination) {
      setTransactions(result.transactions)
      setPagination(result.pagination)

      if (result.pagination.currentPage !== page) {
        updateURL({
          month,
          expenseType,
          payerType,
          page: result.pagination.currentPage.toString(),
          size: pageSize.toString()
        })
      }
    }

    setIsLoading(false)
  }, [month, expenseType, payerType, page, pageSize, updateURL])

  const handleFilterChange = (newFilters: {
    month?: string
    expenseType?: ExpenseType
    payerType?: PayerType
  }) => {
    updateURL({
      month: newFilters.month,
      expenseType: newFilters.expenseType,
      payerType: newFilters.payerType,
      page: '1',
      size: pageSize.toString()
    })
  }

  const handlePageChange = (newPage: number) => {
    updateURL({
      month,
      expenseType,
      payerType,
      page: newPage.toString(),
      size: pageSize.toString()
    })
  }

  const handlePageSizeChange = (newPageSize: number) => {
    updateURL({
      month,
      expenseType,
      payerType,
      page: '1',
      size: newPageSize.toString()
    })
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
            month={month}
            expenseType={expenseType}
            payerType={payerType}
            onFilterChange={handleFilterChange}
          />

          {error && (
            <ErrorAlert
              variant="card"
              message={error}
              retry={loadTransactions}
            />
          )}

          {isLoading ? (
            <table className="w-full">
              <tbody>
                <LoadingSkeleton variant="table-row" count={10} />
              </tbody>
            </table>
          ) : (
            <TransactionList
              transactions={transactions}
              onUpdate={loadTransactions}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Transactions</h1>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <table className="w-full">
              <tbody>
                <LoadingSkeleton variant="table-row" count={10} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  )
}
