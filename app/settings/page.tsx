import { getCurrentGroup } from '@/app/actions/group'
import { GroupSettings } from '@/components/group/GroupSettings'
import { InvitePartner } from '@/components/group/InvitePartner'
import { CreateGroupForm } from '@/components/group/CreateGroupForm'

export default async function SettingsPage() {
  const result = await getCurrentGroup()

  if (result.error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p className="text-gray-600 mb-4">You are not in a group yet.</p>
        <CreateGroupForm />
      </div>
    )
  }

  const group = result.group
  if (!group) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p className="text-gray-600 mb-4">You are not in a group yet.</p>
        <CreateGroupForm />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Group Settings</h1>
      <GroupSettings group={group} />
      {!group.user_b && <InvitePartner />}
    </div>
  )
}
