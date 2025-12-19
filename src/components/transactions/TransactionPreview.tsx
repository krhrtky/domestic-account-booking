'use client'

import { ParsedTransaction } from '@/lib/csv-parser'
import { formatCurrency } from '@/lib/formatters'

interface TransactionPreviewProps {
  transactions: ParsedTransaction[]
}

export default function TransactionPreview({ transactions }: TransactionPreviewProps) {
  const previewLimit = 10
  const displayTransactions = transactions.slice(0, previewLimit)
  const hasMore = transactions.length > previewLimit

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h2 className="text-xl font-bold text-neutral-900 mb-4">
        Preview ({transactions.length} transactions)
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
                Description
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {displayTransactions.map((t, idx) => (
              <tr key={idx} className="border-b border-neutral-200">
                <td className="px-4 py-2 text-sm text-neutral-700">{t.date}</td>
                <td className="px-4 py-2 text-sm text-neutral-700">{t.description}</td>
                <td className="px-4 py-2 text-sm text-right text-neutral-700">
                  {formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <p className="mt-4 text-sm text-neutral-500">
          ... and {transactions.length - previewLimit} more
        </p>
      )}
    </div>
  )
}
