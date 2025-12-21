'use client'

import { useState } from 'react'
import NavItem from './NavItem'
import LogoutButton from '@/components/auth/LogoutButton'

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg"
        aria-label="メニュー"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-neutral-200 md:hidden">
          <nav className="flex flex-col gap-2 p-4">
            <NavItem href="/dashboard">ダッシュボード</NavItem>
            <NavItem href="/dashboard/transactions">取引一覧</NavItem>
            <NavItem href="/settings">グループ設定</NavItem>
            <div className="pt-2 border-t border-neutral-200">
              <LogoutButton />
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
