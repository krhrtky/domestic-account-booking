import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/Toaster'

export const metadata: Metadata = {
  title: 'Household Settlement',
  description: 'Family expense tracking and settlement app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
