import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginFormFallback() {
  return (
    <div className="space-y-5">
      <div className="h-14 bg-neutral-100/80 rounded-xl animate-shimmer" />
      <div className="h-14 bg-neutral-100/80 rounded-xl animate-shimmer" style={{ animationDelay: '0.1s' }} />
      <div className="h-14 bg-brand-primary/10 rounded-xl animate-shimmer mt-7" style={{ animationDelay: '0.2s' }} />
    </div>
  )
}

function WalletIcon() {
  return (
    <svg
      className="w-10 h-10"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="10"
        width="32"
        height="22"
        rx="4"
        className="fill-brand-primary"
      />
      <rect
        x="4"
        y="10"
        width="32"
        height="8"
        rx="4"
        className="fill-brand-primary-dark"
      />
      <circle cx="28" cy="22" r="4" className="fill-brand-accent" />
      <path
        d="M8 10V8C8 5.79086 9.79086 4 12 4H28C30.2091 4 32 5.79086 32 8V10"
        className="stroke-brand-primary-light"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pattern relative overflow-hidden p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 bg-brand-primary/[0.03] rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute top-1/4 -right-32 w-80 h-80 bg-brand-accent/[0.04] rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute -bottom-32 left-1/4 w-72 h-72 bg-brand-primary/[0.02] rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '4s' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-accent/[0.03] rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '6s' }}
        />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute top-0 left-0 w-full h-full opacity-[0.015]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="currentColor" className="text-brand-primary" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-md w-full animate-fade-in-up">
        <div className="card-glass p-8 md:p-10 space-y-8">
          <div className="text-center space-y-4">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 mb-2 opacity-0 animate-scale-in"
              style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
            >
              <WalletIcon />
            </div>

            <div
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}
            >
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                ログイン
              </h1>
            </div>

            <p
              className="text-sm text-neutral-500 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
            >
              家計精算アプリへようこそ
            </p>
          </div>

          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>

          <div
            className="divider-elegant opacity-0 animate-fade-in"
            style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
          />

          <p
            className="text-center text-sm text-neutral-600 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.45s', animationFillMode: 'forwards' }}
          >
            アカウントをお持ちでない方は{' '}
            <Link
              href="/signup"
              className="link-primary"
            >
              新規登録
            </Link>
          </p>
        </div>

        <p
          className="mt-6 text-center text-xs text-neutral-400 opacity-0 animate-fade-in"
          style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
        >
          ふたりの家計を、もっとシンプルに
        </p>
      </div>
    </div>
  )
}
