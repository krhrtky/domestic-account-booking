'use client'

import { updateRatio } from '@/app/actions/group'
import { useState } from 'react'
import { toast } from '@/lib/hooks/useToast'
import LoadingButton from '@/components/ui/LoadingButton'

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
      toast.success('負担割合を更新しました')
    }
    setSaving(false)
  }

  function handleRatioAChange(value: number) {
    setRatioA(value)
    setRatioB(100 - value)
  }

  return (
    <div className="card-glass overflow-hidden">
      <div className="p-6 border-b border-neutral-200/60 bg-gradient-to-r from-brand-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">{group.name}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {group.user_a.name} {group.user_b ? `・ ${group.user_b.name}` : '（パートナー招待中）'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1 h-1 rounded-full bg-brand-accent" />
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">負担割合</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-600 mb-3">{group.user_a.name}</p>
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 flex items-center justify-center border-4 border-brand-primary/20">
                  <span className="text-3xl font-bold text-brand-primary">{ratioA}</span>
                  <span className="text-lg font-semibold text-brand-primary">%</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-neutral-600 mb-3">{group.user_b?.name || 'パートナー'}</p>
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-accent/10 to-brand-accent/5 flex items-center justify-center border-4 border-brand-accent/20">
                  <span className="text-3xl font-bold text-brand-accent">{ratioB}</span>
                  <span className="text-lg font-semibold text-brand-accent">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <label htmlFor="ratioA" className="sr-only">負担割合を調整</label>
            <input
              type="range"
              id="ratioA"
              name="ratioA"
              min="1"
              max="99"
              value={ratioA}
              onChange={(e) => handleRatioAChange(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer bg-neutral-200"
              style={{
                background: `linear-gradient(to right, #5B4B8A ${ratioA}%, #C4A77D ${ratioA}%)`
              }}
            />
            <div className="flex justify-between mt-2 text-xs text-neutral-400">
              <span>1%</span>
              <span>50%</span>
              <span>99%</span>
            </div>
          </div>
        </div>

        <div className="divider-gradient" />

        <LoadingButton
          onClick={handleSave}
          isLoading={saving}
          loadingText="保存中..."
          className="w-full"
        >
          変更を保存
        </LoadingButton>
      </div>
    </div>
  )
}
