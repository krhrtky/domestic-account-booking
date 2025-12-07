import { acceptInvitation } from '@/app/actions/group'
import { redirect } from 'next/navigation'

export default async function InvitePage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await acceptInvitation(token)

  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-8 rounded-lg">
          <h1 className="text-xl font-bold text-red-800">Invalid Invitation</h1>
          <p className="text-red-600 mt-2">{result.error}</p>
        </div>
      </div>
    )
  }

  redirect('/dashboard')
}
