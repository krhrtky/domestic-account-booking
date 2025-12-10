'use client'

import { updateRatio } from '@/app/actions/group'
import { useState } from 'react'
import { toast } from '@/lib/hooks/useToast'

export function GroupSettings({ group }: { group: any }) {
  const [ratioA, setRatioA] = useState(group.ratio_a)
  const [ratioB, setRatioB] = useState(group.ratio_b)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const result = await updateRatio(ratioA, ratioB)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Ratio updated successfully')
    }
    setSaving(false)
  }

  function handleRatioAChange(value: number) {
    setRatioA(value)
    setRatioB(100 - value)
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <h2 className="text-lg font-semibold mb-2">{group.name}</h2>
        <p className="text-sm text-gray-600">
          Members: {group.user_a.name} {group.user_b ? `& ${group.user_b.name}` : '(pending partner)'}
        </p>
      </div>

      <div>
        <p className="block text-sm font-medium mb-2">Income Ratio</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="ratioA" className="text-sm">{group.user_a.name}</label>
            <input
              type="range"
              id="ratioA"
              name="ratioA"
              min="1"
              max="99"
              value={ratioA}
              onChange={(e) => handleRatioAChange(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-center font-bold">{ratioA}%</p>
          </div>
          <div className="flex-1">
            <label htmlFor="ratioB" className="text-sm">{group.user_b?.name || 'Partner'}</label>
            <input
              type="range"
              id="ratioB"
              min="1"
              max="99"
              value={ratioB}
              disabled
              className="w-full opacity-50"
            />
            <p className="text-center font-bold">{ratioB}%</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
