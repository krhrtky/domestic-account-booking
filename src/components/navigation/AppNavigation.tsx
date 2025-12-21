'use client'

import NavItem from './NavItem'
import MobileMenu from './MobileMenu'
import LogoutButton from '@/components/auth/LogoutButton'

export default function AppNavigation() {
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand-primary">家計精算</h1>

          <nav className="hidden md:flex items-center gap-2">
            <NavItem href="/dashboard">ダッシュボード</NavItem>
            <NavItem href="/dashboard/transactions">取引一覧</NavItem>
            <NavItem href="/settings">グループ設定</NavItem>
            <div className="ml-4">
              <LogoutButton />
            </div>
          </nav>

          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
