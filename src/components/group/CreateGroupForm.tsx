'use client'

import { createGroup } from '@/app/actions/group'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CreateGroupForm() {
  const router = useRouter()
  const [name, setName] = useState('Household')
  const [ratioA, setRatioA] = useState(50)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    const result = await createGroup({
      name,
      ratio_a: ratioA,
      ratio_b: 100 - ratioA
    })
    if (result.error) {
      alert(JSON.stringify(result.error))
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Create Household Group</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Group Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Your Income Ratio</label>
          <input
            type="range"
            min="1"
            max="99"
            value={ratioA}
            onChange={(e) => setRatioA(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-center font-bold">{ratioA}% : {100 - ratioA}%</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </div>
  )
}
