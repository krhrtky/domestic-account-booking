'use client'

import { useState } from 'react'
import { uploadCSV } from '@/app/actions/transactions'
import { PayerType } from '@/lib/types'
import { useRouter } from 'next/navigation'

export default function CSVUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [payerType, setPayerType] = useState<PayerType>('UserA')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const MAX_FILE_SIZE = 5 * 1024 * 1024

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('ファイルを選択してください')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('ファイルサイズが5MBを超えています')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const csvContent = await file.text()
      const result = await uploadCSV(csvContent, file.name, payerType)

      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'アップロードに失敗しました')
      } else if (result.count !== undefined) {
        setSuccess(`${result.count}件の取引をインポートしました`)
        setTimeout(() => router.push('/dashboard/transactions'), 1500)
      }
    } catch (err) {
      setError('ファイルの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          CSVファイル
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-neutral-900 border border-neutral-300 rounded-lg cursor-pointer bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          支払元
        </label>
        <select
          name="payerType"
          value={payerType}
          onChange={(e) => setPayerType(e.target.value as PayerType)}
          className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
          disabled={isLoading}
        >
          <option value="UserA">ユーザーA</option>
          <option value="UserB">ユーザーB</option>
          <option value="Common">共通</option>
        </select>
      </div>

      {error && (
        <div className="bg-semantic-error-light border border-semantic-error/20 text-semantic-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-semantic-success-light border border-semantic-success/20 text-semantic-success px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !file}
        className="w-full bg-brand-primary text-white py-2 px-4 rounded-lg hover:bg-brand-primary-dark focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:scale-[0.98] transition-all duration-fast disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? 'アップロード中...' : 'CSVをアップロード'}
      </button>
    </form>
  )
}
