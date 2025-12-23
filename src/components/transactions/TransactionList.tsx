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
  groupUserAId: string
  groupUserBId?: string | null
  userAName: string
  userBName?: string | null
  onUpdate: () => void
  pagination: Pagination | null
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export default function TransactionList({
  transactions,
  groupUserAId,
  groupUserBId,
  userAName,
  userBName,
  onUpdate,
  pagination,
  onPageChange,
  onPageSizeChange
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-neutral-500 font-medium">取引データがありません</p>
        <p className="text-sm text-neutral-600 mt-1">CSVファイルをアップロードして取引を追加してください</p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <caption className="sr-only">取引一覧</caption>
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200">
                <th className="px-4 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  日付
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  内容
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  支払者
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  種別
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {transactions.map((transaction, index) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  groupUserAId={groupUserAId}
                  groupUserBId={groupUserBId}
                  userAName={userAName}
                  userBName={userBName}
                  onUpdate={onUpdate}
                />
              ))}
            </tbody>
          </table>
        </div>
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
