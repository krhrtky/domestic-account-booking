'use client'

import { ColumnMapping } from '@/lib/types'
import { useState, useEffect } from 'react'

interface ColumnMappingFormProps {
  headers: string[]
  suggestedMapping: ColumnMapping
  excludedHeaders: string[]
  onMappingChange: (mapping: ColumnMapping) => void
}

export default function ColumnMappingForm({
  headers,
  suggestedMapping,
  excludedHeaders,
  onMappingChange
}: ColumnMappingFormProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(suggestedMapping)

  useEffect(() => {
    onMappingChange(mapping)
  }, [mapping, onMappingChange])

  const handleChange = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value || null
    }))
  }

  const isValid = mapping.dateColumn && mapping.amountColumn && mapping.descriptionColumn

  return (
    <div className="space-y-4">
      {excludedHeaders.length > 0 && (
        <div className="bg-semantic-warning-light border border-semantic-warning/20 text-neutral-900 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">機密情報を含む可能性のある列を除外しました</p>
          <p className="text-sm mt-1">{excludedHeaders.join(', ')}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          日付列 <span className="text-semantic-error">*</span>
        </label>
        <select
          value={mapping.dateColumn || ''}
          onChange={(e) => handleChange('dateColumn', e.target.value)}
          className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
        >
          <option value="">選択してください</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          金額列 <span className="text-semantic-error">*</span>
        </label>
        <select
          value={mapping.amountColumn || ''}
          onChange={(e) => handleChange('amountColumn', e.target.value)}
          className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
        >
          <option value="">選択してください</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          摘要列 <span className="text-semantic-error">*</span>
        </label>
        <select
          value={mapping.descriptionColumn || ''}
          onChange={(e) => handleChange('descriptionColumn', e.target.value)}
          className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
        >
          <option value="">選択してください</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          支払者列 (任意)
        </label>
        <select
          value={mapping.payerColumn || ''}
          onChange={(e) => handleChange('payerColumn', e.target.value)}
          className="block w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-fast"
        >
          <option value="">なし</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </div>

      {!isValid && (
        <div className="bg-semantic-error-light border border-semantic-error/20 text-semantic-error px-4 py-3 rounded-lg">
          <p className="text-sm">必須列（日付、金額、摘要）を選択してください。</p>
        </div>
      )}
    </div>
  )
}
