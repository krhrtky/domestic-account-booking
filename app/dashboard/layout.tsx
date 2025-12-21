import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import AppNavigation from '@/components/navigation/AppNavigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppNavigation />
      {children}
    </div>
  )
}
