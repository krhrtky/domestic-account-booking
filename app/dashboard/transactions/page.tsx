'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
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
  const [groupInfo, setGroupInfo] = useState<{
    user_a_id: string
    user_a_name: string
    user_b_id: string | null
    user_b_name: string | null
  } | null>(null)

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = [10, 25, 50].includes(parseInt(searchParams.get('size') || '25', 10))
    ? parseInt(searchParams.get('size') || '25', 10)
    : 25
  const month = searchParams.get('month') || undefined
  const expenseType = (searchParams.get('expenseType') as ExpenseType) || undefined
  const payerType = (searchParams.get('payerType') as PayerType) || undefined

  const [fetchTrigger, setFetchTrigger] = useState(0)
  const isMountedRef = useRef(true)

  const updateURL = useCallback((params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value)
    })

    router.push(`${pathname}?${newParams.toString()}`)
  }, [router, pathname])

  const triggerRefetch = useCallback(() => {
    setFetchTrigger(prev => prev + 1)
  }, [])

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
    isMountedRef.current = true

    async function fetchTransactions() {
      setIsLoading(true)
      setError(null)

      const result = await getTransactions({
        month,
        expenseType,
        payerType,
        page,
        pageSize
      })

      if (!isMountedRef.current) return

      if ('error' in result) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to load transactions')
      } else if ('transactions' in result && result.transactions && result.pagination && 'group' in result) {
        setTransactions(result.transactions)
        setPagination(result.pagination)
        setGroupInfo(result.group)

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
    }

    fetchTransactions()

    return () => {
      isMountedRef.current = false
    }
  }, [month, expenseType, payerType, page, pageSize, updateURL, fetchTrigger])

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
              retry={triggerRefetch}
            />
          )}

          {isLoading ? (
            <table className="w-full">
              <tbody>
                <LoadingSkeleton variant="table-row" count={10} />
              </tbody>
            </table>
          ) : groupInfo ? (
            <TransactionList
              transactions={transactions}
              groupUserAId={groupInfo.user_a_id}
              groupUserBId={groupInfo.user_b_id}
              userAName={groupInfo.user_a_name}
              userBName={groupInfo.user_b_name}
              onUpdate={triggerRefetch}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : (
            <ErrorAlert
              variant="card"
              message="グループ情報の読み込みに失敗しました"
              retry={triggerRefetch}
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
