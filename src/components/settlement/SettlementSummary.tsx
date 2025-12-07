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
        message: `${userBName || 'User B'} pays ${userAName} ${formatCurrency(settlement.balance_a)}`,
        className: 'text-green-700 bg-green-50 border-green-200'
      }
    } else if (settlement.balance_a < 0) {
      return {
        message: `${userAName} pays ${userBName || 'User B'} ${formatCurrency(Math.abs(settlement.balance_a))}`,
        className: 'text-blue-700 bg-blue-50 border-blue-200'
      }
    } else {
      return {
        message: 'No payment needed',
        className: 'text-gray-700 bg-gray-50 border-gray-200'
      }
    }
  }

  const paymentInfo = getPaymentInstruction()

  if (settlement.total_household === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500 text-center">No transactions for this month</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Settlement Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-1">Total Household Expenses</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(settlement.total_household)}
            </p>
          </div>
          <div className="border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-1">Paid by Common Account</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(settlement.paid_by_common)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-3">Individual Payments</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-1">{userAName} paid</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(settlement.paid_by_a_household)}
            </p>
          </div>
          <div className="border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-600 mb-1">{userBName || 'User B'} paid</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCurrency(settlement.paid_by_b_household)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-3">Load Sharing Ratio</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-md p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">{userAName}</p>
            <p className="text-xl font-semibold text-gray-900">{settlement.ratio_a}%</p>
          </div>
          <div className="border border-gray-200 rounded-md p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">{userBName || 'User B'}</p>
            <p className="text-xl font-semibold text-gray-900">{settlement.ratio_b}%</p>
          </div>
        </div>
      </div>

      <div className={`border rounded-md p-4 ${paymentInfo.className}`}>
        <p className="text-sm font-medium mb-1">Final Settlement</p>
        <p className="text-xl font-bold">{paymentInfo.message}</p>
      </div>
    </div>
  )
}
