'use client'

import type { Settlement } from '@/lib/types'
import { formatCurrency } from '@/lib/formatters'

interface SettlementSummaryProps {
  settlement: Settlement
  userAName: string
  userBName: string | null
}

export default function SettlementSummary({ settlement, userAName, userBName }: SettlementSummaryProps) {

  const getPaymentInstruction = () => {
    if (settlement.balance_a > 0) {
      return {
        message: `${userBName || 'ユーザーB'}が${userAName}に支払う`,
        amount: formatCurrency(settlement.balance_a),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        ),
        bgClass: 'bg-semantic-success-light',
        borderClass: 'border-semantic-success/30',
        textClass: 'text-semantic-success',
        accentClass: 'bg-semantic-success'
      }
    } else if (settlement.balance_a < 0) {
      return {
        message: `${userAName}が${userBName || 'ユーザーB'}に支払う`,
        amount: formatCurrency(Math.abs(settlement.balance_a)),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
        ),
        bgClass: 'bg-semantic-info-light',
        borderClass: 'border-semantic-info/30',
        textClass: 'text-semantic-info',
        accentClass: 'bg-semantic-info'
      }
    } else {
      return {
        message: '精算不要',
        amount: '¥0',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        bgClass: 'bg-neutral-100',
        borderClass: 'border-neutral-200',
        textClass: 'text-neutral-600',
        accentClass: 'bg-neutral-400'
      }
    }
  }

  const paymentInfo = getPaymentInstruction()

  if (settlement.total_household === 0) {
    return (
      <div data-testid="settlement-summary" className="card-glass p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-neutral-500">今月の取引はありません</p>
      </div>
    )
  }

  return (
    <div data-testid="settlement-summary" className="card-glass overflow-hidden">
      <div className={`${paymentInfo.bgClass} border-b ${paymentInfo.borderClass} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${paymentInfo.accentClass} text-white flex items-center justify-center`}>
              {paymentInfo.icon}
            </div>
            <div>
              <p className={`text-sm font-medium ${paymentInfo.textClass} opacity-80`}>最終精算</p>
              <p className={`text-lg font-bold ${paymentInfo.textClass}`}>{paymentInfo.message}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${paymentInfo.textClass}`}>{paymentInfo.amount}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-brand-accent" />
            支出概要
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group bg-gradient-to-br from-brand-primary/5 to-brand-accent/5 rounded-xl p-5 border border-brand-primary/10 hover:border-brand-primary/20 transition-colors duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-neutral-600">家計の支出合計</p>
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(settlement.total_household)}
              </p>
            </div>
            <div className="group bg-neutral-50 rounded-xl p-5 border border-neutral-200 hover:border-neutral-300 transition-colors duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-neutral-600">共通口座からの支払い</p>
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(settlement.paid_by_common)}
              </p>
            </div>
          </div>
        </div>

        <div className="divider-gradient" />

        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-brand-accent" />
            個人の支払い
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 border-2 border-neutral-200 hover:border-brand-primary/30 transition-colors duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-neutral-600">{userAName}</p>
                <div className="px-2 py-1 rounded-md bg-brand-primary/10 text-brand-primary text-xs font-semibold">
                  {settlement.ratio_a}%
                </div>
              </div>
              <p className="text-xl font-bold text-neutral-900">
                {formatCurrency(settlement.paid_by_a_household)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border-2 border-neutral-200 hover:border-brand-accent/30 transition-colors duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-neutral-600">{userBName || 'ユーザーB'}</p>
                <div className="px-2 py-1 rounded-md bg-brand-accent/10 text-brand-accent text-xs font-semibold">
                  {settlement.ratio_b}%
                </div>
              </div>
              <p className="text-xl font-bold text-neutral-900">
                {formatCurrency(settlement.paid_by_b_household)}
              </p>
            </div>
          </div>
        </div>

        <div className="divider-gradient" />

        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-brand-accent" />
            負担割合
          </h3>
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">{userAName}</span>
                  <span className="text-sm font-bold text-brand-primary">{settlement.ratio_a}%</span>
                </div>
                <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-full transition-all duration-500"
                    style={{ width: `${settlement.ratio_a}%` }}
                  />
                </div>
              </div>
              <div className="w-px h-12 bg-neutral-200" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">{userBName || 'ユーザーB'}</span>
                  <span className="text-sm font-bold text-brand-accent">{settlement.ratio_b}%</span>
                </div>
                <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-accent to-brand-accent-light rounded-full transition-all duration-500"
                    style={{ width: `${settlement.ratio_b}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
