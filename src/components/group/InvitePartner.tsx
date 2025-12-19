'use client'

import { invitePartner } from '@/app/actions/group'
import { useState } from 'react'
import { toast } from '@/lib/hooks/useToast'
import LoadingButton from '@/components/ui/LoadingButton'

export function InvitePartner() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')

  async function handleInvite() {
    setLoading(true)
    const result = await invitePartner(email)
    if (result.error) {
      toast.error(result.error)
    } else if (result.invite_url) {
      setInviteUrl(result.invite_url)
      toast.success('招待リンクを作成しました')
    }
    setLoading(false)
  }

  return (
    <div className="card-glass overflow-hidden">
      <div className="p-6 border-b border-neutral-200/60 bg-gradient-to-r from-semantic-success/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-semantic-success to-semantic-success/80 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">パートナーを招待</h2>
            <p className="text-sm text-neutral-500 mt-0.5">メールアドレスを入力して招待リンクを送信</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {inviteUrl ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-semantic-success-light rounded-xl border border-semantic-success/20">
              <div className="w-10 h-10 rounded-lg bg-semantic-success/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-semantic-success">招待リンクを作成しました</p>
                <p className="text-xs text-neutral-600 mt-1">パートナーに以下のリンクを共有してください</p>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full px-4 py-3 pr-24 bg-neutral-50 border-2 border-neutral-200 rounded-xl text-sm text-neutral-700 font-mono"
                data-testid="invite-url"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl)
                  toast.success('リンクをコピーしました')
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-primary text-white text-xs font-medium rounded-lg hover:bg-brand-primary-dark transition-colors duration-150"
              >
                コピー
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="email"
                name="partnerEmail"
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-sm placeholder:text-neutral-400 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all duration-200"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <LoadingButton
              onClick={handleInvite}
              isLoading={loading}
              loadingText="招待リンクを作成中..."
              disabled={!email}
              className="w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              招待リンクを作成
            </LoadingButton>
          </div>
        )}
      </div>
    </div>
  )
}
