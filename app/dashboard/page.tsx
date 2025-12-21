import Link from 'next/link'
import SettlementDashboard from '@/components/settlement/SettlementDashboard'
import { getCurrentUser } from '@/lib/session'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'おはようございます'
  if (hour < 18) return 'こんにちは'
  return 'こんばんは'
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div className="bg-pattern relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-primary/[0.02] rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-brand-accent/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-brand-primary/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12 space-y-8">
        <header
          className="opacity-0 animate-fade-in"
          style={{ animationFillMode: 'forwards' }}
        >
          <div className="space-y-1">
            <p className="text-sm text-brand-primary font-medium">
              {getGreeting()}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              {user?.name || user?.email}
            </h1>
          </div>
        </header>

        <div
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          <SettlementDashboard />
        </div>

        <div
          className="card-glass p-6 md:p-8 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
        >
          <h2 className="text-lg font-bold text-neutral-900 mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            クイックアクセス
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/transactions"
              className="group relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-primary-light text-white rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-brand-primary/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">取引一覧</p>
                  <p className="text-sm text-white/70">明細の確認・管理</p>
                </div>
                <svg className="w-5 h-5 ml-auto transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/settings"
              className="group relative overflow-hidden bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl p-5 transition-all duration-200 hover:border-brand-primary/30 hover:shadow-lg hover:shadow-neutral-200/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 group-hover:bg-brand-primary/10 flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5 text-neutral-600 group-hover:text-brand-primary transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">グループ設定</p>
                  <p className="text-sm text-neutral-500">メンバー・負担割合</p>
                </div>
                <svg className="w-5 h-5 ml-auto text-neutral-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
