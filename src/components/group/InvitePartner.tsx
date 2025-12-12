'use client'

import { invitePartner } from '@/app/actions/group'
import { useState } from 'react'
import { toast } from '@/lib/hooks/useToast'

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
    }
    setLoading(false)
  }

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Invite Partner</h2>
      {inviteUrl ? (
        <div>
          <p className="text-sm text-green-600 mb-2">Invitation sent!</p>
          <p className="text-xs text-gray-600 break-all" data-testid="invite-url">{inviteUrl}</p>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            name="partnerEmail"
            placeholder="partner@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleInvite}
            disabled={loading || !email}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Invite'}
          </button>
        </div>
      )}
    </div>
  )
}
