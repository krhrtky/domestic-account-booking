'use client'

import { useState } from 'react'
import { uploadCSV } from '@/app/actions/transactions'
import { detectCSVHeaders } from '@/app/actions/csv-mappings'
import { PayerType, ColumnMapping } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { parseCSV, ParsedTransaction } from '@/lib/csv-parser'
import ColumnMappingForm from './ColumnMappingForm'
import TransactionPreview from './TransactionPreview'

type Step = 'upload' | 'mapping' | 'preview' | 'payer'

export default function CSVUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [csvContent, setCsvContent] = useState<string>('')
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [suggestedMapping, setSuggestedMapping] = useState<ColumnMapping | null>(null)
  const [excludedHeaders, setExcludedHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null)
  const [previewTransactions, setPreviewTransactions] = useState<ParsedTransaction[]>([])
  const [payerType, setPayerType] = useState<PayerType>('UserA')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const MAX_FILE_SIZE = 5 * 1024 * 1024

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null)
      setStep('upload')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('ファイルサイズが5MBを超えています')
      return
    }

    setFile(selectedFile)
    setError(null)
    setIsLoading(true)

    try {
      const content = await selectedFile.text()
      setCsvContent(content)

      const result = await detectCSVHeaders(content)

      if ('error' in result) {
        setError(result.error ?? 'エラーが発生しました')
        setStep('upload')
      } else {
        setHeaders(result.headers)
        setSuggestedMapping(result.suggestedMapping)
        setExcludedHeaders(result.excludedHeaders)
        setColumnMapping(result.suggestedMapping)

        const allRequiredFieldsMapped =
          result.suggestedMapping.dateColumn &&
          result.suggestedMapping.amountColumn &&
          result.suggestedMapping.descriptionColumn

        if (allRequiredFieldsMapped) {
          setStep('preview')
          await handlePreview(result.suggestedMapping, content, selectedFile.name)
        } else {
          setStep('mapping')
        }
      }
    } catch (err) {
      setError('ファイルの読み込みに失敗しました')
      setStep('upload')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = async (mapping: ColumnMapping, content: string, fileName: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await parseCSV(content, fileName, { columnMapping: mapping })

      if (result.success) {
        setPreviewTransactions(result.data)
        setStep('preview')
      } else {
        setError(result.errors.join(', '))
      }
    } catch (err) {
      setError('プレビューの生成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMappingConfirm = async () => {
    if (!columnMapping || !file) return

    const isValid =
      columnMapping.dateColumn && columnMapping.amountColumn && columnMapping.descriptionColumn

    if (!isValid) {
      setError('必須列（日付、金額、摘要）を選択してください。')
      return
    }

    await handlePreview(columnMapping, csvContent, file.name)
  }

  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await uploadCSV(csvContent, file.name, payerType)

      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'アップロードに失敗しました')
      } else if (result.count !== undefined) {
        setSuccess(`${result.count}件の取引をインポートしました`)
        setTimeout(() => router.push('/dashboard/transactions'), 1500)
      }
    } catch (err) {
      setError('インポートに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {step === 'upload' && (
        <>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              CSVファイル
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="block w-full text-sm text-neutral-900 border border-neutral-300 rounded-lg cursor-pointer bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
              disabled={isLoading}
            />
          </div>
        </>
      )}

      {step === 'mapping' && columnMapping && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">列マッピングの確認</h2>
            <ColumnMappingForm
              headers={headers}
              suggestedMapping={suggestedMapping || columnMapping}
              excludedHeaders={excludedHeaders}
              onMappingChange={setColumnMapping}
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                setStep('upload')
                setFile(null)
              }}
              className="flex-1 bg-neutral-200 text-neutral-700 py-2 px-4 rounded-lg hover:bg-neutral-300 transition-all duration-fast"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleMappingConfirm}
              disabled={
                isLoading ||
                !columnMapping.dateColumn ||
                !columnMapping.amountColumn ||
                !columnMapping.descriptionColumn
              }
              className="flex-1 bg-brand-primary text-white py-2 px-4 rounded-lg hover:bg-brand-primary-dark focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:scale-[0.98] transition-all duration-fast disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              プレビューを表示
            </button>
          </div>
        </>
      )}

      {step === 'preview' && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">データプレビュー</h2>
            <TransactionPreview transactions={previewTransactions} />
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

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                setStep('upload')
                setFile(null)
              }}
              className="flex-1 bg-neutral-200 text-neutral-700 py-2 px-4 rounded-lg hover:bg-neutral-300 transition-all duration-fast"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isLoading}
              className="flex-1 bg-brand-primary text-white py-2 px-4 rounded-lg hover:bg-brand-primary-dark focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:scale-[0.98] transition-all duration-fast disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'インポート中...' : 'インポート実行'}
            </button>
          </div>
        </>
      )}

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
    </div>
  )
}
