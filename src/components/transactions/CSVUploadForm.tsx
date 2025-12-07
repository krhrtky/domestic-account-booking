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
      setError('Please select a file')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 5MB limit')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const csvContent = await file.text()
      const result = await uploadCSV(csvContent, file.name, payerType)

      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Upload failed')
      } else if (result.count !== undefined) {
        setSuccess(`${result.count} transactions imported successfully`)
        setTimeout(() => router.push('/dashboard/transactions'), 1500)
      }
    } catch (err) {
      setError('Failed to read file')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CSV File
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payer Type
        </label>
        <select
          name="payerType"
          value={payerType}
          onChange={(e) => setPayerType(e.target.value as PayerType)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="UserA">User A</option>
          <option value="UserB">User B</option>
          <option value="Common">Common</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !file}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Uploading...' : 'Upload CSV'}
      </button>
    </form>
  )
}
