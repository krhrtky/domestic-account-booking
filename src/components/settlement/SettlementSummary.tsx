'use client'

import type { Settlement } from '@/lib/types'

interface SettlementSummaryProps {
  settlement: Settlement
  userAName: string
  userBName: string | null
}

export default function SettlementSummary({ settlement, userAName, userBName }: SettlementSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const getPaymentInstruction = () => {
    if (settlement.balance_a > 0) {
      return {
        message: `${userBName || 'ユーザーB'}が${userAName}に${formatCurrency(settlement.balance_a)}を支払う`,
        className: 'text-green-700 bg-green-50 border-green-200'
      }
    } else if (settlement.balance_a < 0) {
      return {
        message: `${userAName}が${userBName || 'ユーザーB'}に${formatCurrency(Math.abs(settlement.balance_a))}を支払う`,
        className: 'text-blue-700 bg-blue-50 border-blue-200'
      }
    } else {
      return {
        message: '精算不要',
        className: 'text-gray-700 bg-gray-50 border-gray-200'
      }
    }
  }

  const paymentInfo = getPaymentInstruction()

  if (settlement.total_household === 0) {
    return (
      <div data-testid="settlement-summary" className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500 text-center">今月の取引はありません</p>
      </div>
    )
  }

  return (
    <div data-testid="settlement-summary" className="bg-white p-6 rounded-lg shadow space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">精算サマリー</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-1">家計の支出合計</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(settlement.total_household)}
            </p>
          </div>
          <div className="border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-1">共通口座からの支払い</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(settlement.paid_by_common)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-3">個人の支払い</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-1">{userAName}の支払い</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(settlement.paid_by_a_household)}
            </p>
          </div>
          <div className="border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-1">{userBName || 'ユーザーB'}の支払い</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(settlement.paid_by_b_household)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-3">負担割合</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-md p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">{userAName}</p>
            <p className="text-xl font-semibold text-gray-900">{settlement.ratio_a}%</p>
          </div>
          <div className="border border-gray-200 rounded-md p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">{userBName || 'ユーザーB'}</p>
            <p className="text-xl font-semibold text-gray-900">{settlement.ratio_b}%</p>
          </div>
        </div>
      </div>

      <div className={`border rounded-md p-4 ${paymentInfo.className}`}>
        <p className="text-sm font-medium mb-1">最終精算</p>
        <p className="text-xl font-bold">{paymentInfo.message}</p>
      </div>
    </div>
  )
}
