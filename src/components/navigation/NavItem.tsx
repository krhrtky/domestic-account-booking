'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItemProps {
  href: string
  children: React.ReactNode
  icon?: React.ReactNode
}

export default function NavItem({ href, children, icon }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      data-active={isActive}
      className={isActive
        ? 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-brand-primary text-white font-semibold'
        : 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-neutral-700 hover:bg-neutral-100'
      }
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </Link>
  )
}
