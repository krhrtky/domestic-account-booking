import { SignUpForm } from '@/components/auth/SignUpForm'
import Link from 'next/link'

function UserPlusIcon() {
  return (
    <svg
      className="w-10 h-10"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="14" r="8" className="fill-brand-primary" />
      <path
        d="M4 32C4 25.373 9.373 20 16 20C17.326 20 18.598 20.211 19.789 20.601"
        className="stroke-brand-primary"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="28" cy="26" r="10" className="fill-brand-accent/20" />
      <path
        d="M28 22V30M24 26H32"
        className="stroke-brand-accent"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pattern relative overflow-hidden p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 right-1/4 w-96 h-96 bg-brand-accent/[0.04] rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute top-1/3 -left-32 w-80 h-80 bg-brand-primary/[0.03] rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute -bottom-24 right-1/3 w-72 h-72 bg-brand-primary/[0.02] rounded-full blur-3xl animate-blob"
          style={{ animationDelay: '4s' }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-brand-accent/[0.03] rounded-full blur-3xl animate-blob"
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
              id="grid-signup"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="currentColor" className="text-brand-primary" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-signup)" />
        </svg>
      </div>

      <div className="relative max-w-md w-full animate-fade-in-up">
        <div className="card-glass p-8 md:p-10 space-y-8">
          <div className="text-center space-y-4">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 mb-2 opacity-0 animate-scale-in"
              style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
            >
              <UserPlusIcon />
            </div>

            <div
              className="opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}
            >
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
                新規登録
              </h1>
            </div>

            <p
              className="text-sm text-neutral-500 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
            >
              アカウントを作成して始めましょう
            </p>
          </div>

          <SignUpForm />

          <div
            className="divider-elegant opacity-0 animate-fade-in"
            style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
          />

          <p
            className="text-center text-sm text-neutral-600 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.55s', animationFillMode: 'forwards' }}
          >
            すでにアカウントをお持ちの方は{' '}
            <Link
              href="/login"
              className="link-primary"
            >
              ログイン
            </Link>
          </p>
        </div>

        <p
          className="mt-6 text-center text-xs text-neutral-400 opacity-0 animate-fade-in"
          style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
        >
          ふたりの家計を、もっとシンプルに
        </p>
      </div>
    </div>
  )
}
