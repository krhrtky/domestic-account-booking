import Link from 'next/link'
import SettlementDashboard from '@/components/settlement/SettlementDashboard'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <SettlementDashboard />

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4">
            Welcome, {user.name || user.email}!
          </p>
          <div className="space-y-4">
            <Link
              href="/dashboard/transactions"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-center"
            >
              Transactions
            </Link>
            <Link
              href="/settings"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-center"
            >
              Group Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
