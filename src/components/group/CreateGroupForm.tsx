'use client'

import { createGroup } from '@/app/actions/group'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from '@/lib/hooks/useToast'
import LoadingButton from '@/components/ui/LoadingButton'

export function CreateGroupForm() {
  const router = useRouter()
  const [name, setName] = useState('家計グループ')
  const [ratioA, setRatioA] = useState(50)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await createGroup({
      name,
      ratio_a: ratioA,
      ratio_b: 100 - ratioA
    })
    if (result.error) {
      const errorMessage = typeof result.error === 'string'
        ? result.error
        : JSON.stringify(result.error)
      toast.error(errorMessage)
    } else {
      toast.success('グループを作成しました')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div>
        <label htmlFor="groupName" className="block text-sm font-medium text-neutral-700 mb-2">
          グループ名
        </label>
        <input
          type="text"
          id="groupName"
          name="groupName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all duration-200"
          placeholder="例: 我が家の家計"
        />
      </div>

      <div>
        <label htmlFor="ratioA" className="block text-sm font-medium text-neutral-700 mb-4">
          負担割合の初期設定
        </label>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
            <p className="text-xs text-neutral-500 mb-1">あなた</p>
            <p className="text-2xl font-bold text-brand-primary">{ratioA}%</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-brand-accent/5 border border-brand-accent/10">
            <p className="text-xs text-neutral-500 mb-1">パートナー</p>
            <p className="text-2xl font-bold text-brand-accent">{100 - ratioA}%</p>
          </div>
        </div>

        <input
          type="range"
          id="ratioA"
          name="ratioA"
          min="1"
          max="99"
          value={ratioA}
          onChange={(e) => setRatioA(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-neutral-200"
          style={{
            background: `linear-gradient(to right, #5B4B8A ${ratioA}%, #C4A77D ${ratioA}%)`
          }}
        />
      </div>

      <LoadingButton
        type="submit"
        isLoading={loading}
        loadingText="作成中..."
        className="w-full"
      >
        グループを作成
      </LoadingButton>
    </form>
  )
}
