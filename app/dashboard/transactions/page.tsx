'use client'

import { useState, useEffect } from 'react'
import { getTransactions } from '@/app/actions/transactions'
import { Transaction, ExpenseType, PayerType } from '@/lib/types'
import TransactionList from '@/components/transactions/TransactionList'
import TransactionFilters from '@/components/transactions/TransactionFilters'
import Link from 'next/link'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    month?: string
    expenseType?: ExpenseType
    payerType?: PayerType
  }>({})

  const loadTransactions = async () => {
    setIsLoading(true)
    setError(null)

    const result = await getTransactions(filters)

    if (result.error) {
      setError(typeof result.error === 'string' ? result.error : 'Failed to load transactions')
    } else if (result.transactions) {
      setTransactions(result.transactions)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadTransactions()
  }, [filters])

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
            />
          )}
        </div>
      </div>
    </div>
  )
}
