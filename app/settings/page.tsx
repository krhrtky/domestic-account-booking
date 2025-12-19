import { getCurrentGroup } from '@/app/actions/group'
import { GroupSettings } from '@/components/group/GroupSettings'
import { InvitePartner } from '@/components/group/InvitePartner'
import { CreateGroupForm } from '@/components/group/CreateGroupForm'
import Link from 'next/link'

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-brand-primary transition-colors duration-200 group"
    >
      <svg
        className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      ダッシュボードに戻る
    </Link>
  )
}

function EmptyGroupState() {
  return (
    <div className="card-glass p-8 text-center animate-fade-in-up">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 flex items-center justify-center">
        <svg className="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-neutral-900 mb-2">グループを作成しましょう</h2>
      <p className="text-neutral-500 mb-8">パートナーと一緒に家計を管理するためのグループを作成してください</p>
      <CreateGroupForm />
    </div>
  )
}

export default async function SettingsPage() {
  const result = await getCurrentGroup()

  if (result.error || !result.group) {
    return (
      <div className="min-h-screen bg-pattern relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 right-1/4 w-96 h-96 bg-brand-primary/[0.02] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-brand-accent/[0.03] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 py-8 md:px-6 md:py-12">
          <div className="mb-8">
            <BackLink />
          </div>
          <h1
            className="text-2xl md:text-3xl font-bold text-neutral-900 mb-8 opacity-0 animate-fade-in"
            style={{ animationFillMode: 'forwards' }}
          >
            設定
          </h1>
          <EmptyGroupState />
        </div>
      </div>
    )
  }

  const group = result.group

  return (
    <div className="min-h-screen bg-pattern relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-brand-primary/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-brand-accent/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8 md:px-6 md:py-12 space-y-8">
        <div>
          <BackLink />
        </div>

        <h1
          className="text-2xl md:text-3xl font-bold text-neutral-900 opacity-0 animate-fade-in"
          style={{ animationFillMode: 'forwards' }}
        >
          グループ設定
        </h1>

        <div
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          <GroupSettings group={group} />
        </div>

        {!group.user_b && (
          <div
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
          >
            <InvitePartner />
          </div>
        )}
      </div>
    </div>
  )
}
