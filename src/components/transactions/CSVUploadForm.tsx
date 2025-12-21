'use client'

import { useState, useEffect } from 'react'
import { uploadCSV } from '@/app/actions/transactions'
import { detectCSVHeaders } from '@/app/actions/csv-mappings'
import { getCurrentGroup } from '@/app/actions/group'
import { PayerType, ColumnMapping } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { parseCSV, ParsedTransaction } from '@/lib/csv-parser'
import ColumnMappingForm from './ColumnMappingForm'
import TransactionPreview from './TransactionPreview'

type Step = 'upload' | 'mapping' | 'preview' | 'payer'

interface GroupInfo {
  userAName: string
  userBName: string | null
}

export default function CSVUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [csvContent, setCsvContent] = useState<string>('')
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [suggestedMapping, setSuggestedMapping] = useState<ColumnMapping | null>(null)
  const [excludedHeaders, setExcludedHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null)
  const [previewTransactions, setPreviewTransactions] = useState<ParsedTransaction[]>([])
  const [payerTypes, setPayerTypes] = useState<PayerType[]>([])
  const [defaultPayerType, setDefaultPayerType] = useState<PayerType>('UserA')
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sensitiveWarning, setSensitiveWarning] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchGroupInfo() {
      const result = await getCurrentGroup()
      if (result.success && result.group) {
        setGroupInfo({
          userAName: result.group.user_a.name,
          userBName: result.group.user_b?.name ?? null
        })
      }
    }
    fetchGroupInfo()
  }, [])

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
    setSensitiveWarning(null)
    setIsProcessing(true)
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

        if (result.excludedHeaders.length > 0) {
          setSensitiveWarning(
            `機密情報を含む可能性のある列を除外しました: ${result.excludedHeaders.join(', ')}`
          )
        }

        const hasDateColumn = result.suggestedMapping.dateColumn !== null
        const hasAmountColumn = result.suggestedMapping.amountColumn !== null

        if (!hasDateColumn || !hasAmountColumn) {
          const missingColumns = []
          if (!hasDateColumn) missingColumns.push('日付')
          if (!hasAmountColumn) missingColumns.push('金額')
          setError(`必須列（${missingColumns.join('、')}）が見つかりません`)
          setStep('upload')
        } else {
          setStep('mapping')
        }
      }
    } catch (err) {
      setError('ファイルの読み込みに失敗しました')
      setStep('upload')
    } finally {
      setIsLoading(false)
      setIsProcessing(false)
    }
  }

  const handlePreview = async (mapping: ColumnMapping, content: string, fileName: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await parseCSV(content, fileName, { columnMapping: mapping })

      if (result.success) {
        setPreviewTransactions(result.data)
        setPayerTypes(new Array(result.data.length).fill(defaultPayerType))
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

  const handlePayerChange = (index: number, payerType: PayerType) => {
    setPayerTypes(prev => {
      const newPayerTypes = [...prev]
      newPayerTypes[index] = payerType
      return newPayerTypes
    })
  }

  const handleDefaultPayerChange = (payerType: PayerType) => {
    setDefaultPayerType(payerType)
    setPayerTypes(new Array(previewTransactions.length).fill(payerType))
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
      const result = await uploadCSV(csvContent, file.name, defaultPayerType, payerTypes)

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
          {isProcessing && (
            <div className="flex items-center space-x-2 text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
              <span className="text-sm">処理中...</span>
            </div>
          )}
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
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              一括設定
            </label>
            <select
              name="defaultPayerType"
              value={defaultPayerType}
              onChange={(e) => handleDefaultPayerChange(e.target.value as PayerType)}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
              disabled={isLoading}
            >
              <option value="UserA">{groupInfo?.userAName ?? 'ユーザーA'}</option>
              <option value="UserB">{groupInfo?.userBName ?? 'ユーザーB'}</option>
              <option value="Common">共通</option>
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              全ての明細に同じ支払元を設定します。個別に変更も可能です。
            </p>
          </div>

          <TransactionPreview
            transactions={previewTransactions}
            payerTypes={payerTypes}
            onPayerChange={handlePayerChange}
            userAName={groupInfo?.userAName}
            userBName={groupInfo?.userBName ?? undefined}
          />

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

      {sensitiveWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          {sensitiveWarning}
        </div>
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
