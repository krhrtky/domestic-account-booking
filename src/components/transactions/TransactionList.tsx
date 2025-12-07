'use client'

import { Transaction } from '@/lib/types'
import TransactionRow from './TransactionRow'
import PaginationControls from './PaginationControls'

interface Pagination {
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

interface TransactionListProps {
  transactions: Transaction[]
  onUpdate: () => void
  pagination: Pagination | null
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export default function TransactionList({
  transactions,
  onUpdate,
  pagination,
  onPageChange,
  onPageSizeChange
}: TransactionListProps) {
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

      {pagination && pagination.totalCount > 0 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  )
}
