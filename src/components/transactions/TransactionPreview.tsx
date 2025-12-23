'use client'

import { ParsedTransaction } from '@/lib/csv-parser'
import { PayerType } from '@/lib/types'
import { formatCurrency } from '@/lib/formatters'

interface TransactionPreviewProps {
  transactions: ParsedTransaction[]
  payerTypes: PayerType[]
  onPayerChange: (index: number, payerType: PayerType) => void
  userAName?: string
  userBName?: string
}

export default function TransactionPreview({
  transactions,
  payerTypes,
  onPayerChange,
  userAName = 'ユーザーA',
  userBName = 'ユーザーB'
}: TransactionPreviewProps) {
  const previewLimit = 10
  const displayTransactions = transactions.slice(0, previewLimit)
  const hasMore = transactions.length > previewLimit

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h2 className="text-xl font-bold text-neutral-900 mb-4">
        データプレビュー ({transactions.length} 件)
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
                日付
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
                摘要
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
                支払者(CSV)
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
                支払元
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500">
                金額
              </th>
            </tr>
          </thead>
          <tbody>
            {displayTransactions.map((t, idx) => (
              <tr key={idx} className="border-b border-neutral-200">
                <td className="px-4 py-2 text-sm text-neutral-700">{t.date}</td>
                <td className="px-4 py-2 text-sm text-neutral-700">{t.description}</td>
                <td className="px-4 py-2 text-sm text-neutral-700">
                  {t.payer_name || '—'}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={payerTypes[idx] || 'UserA'}
                    onChange={(e) => onPayerChange(idx, e.target.value as PayerType)}
                    className="text-sm px-2 py-1 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="UserA">{userAName}</option>
                    <option value="UserB">{userBName}</option>
                    <option value="Common">共通</option>
                  </select>
                </td>
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
          他 {transactions.length - previewLimit} 件（インポート時に全件処理されます）
        </p>
      )}
    </div>
  )
}
