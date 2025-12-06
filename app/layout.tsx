import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
