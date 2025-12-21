'use server'

import { detectHeaders } from '@/lib/csv-parser'
import { z } from 'zod'

const DetectCSVHeadersSchema = z.object({
  csvContent: z.string().min(1)
})

export async function detectCSVHeaders(csvContent: string) {
  const parsed = DetectCSVHeadersSchema.safeParse({ csvContent })

  if (!parsed.success) {
    return { error: 'CSVファイルが空です' }
  }

  const result = detectHeaders(csvContent)

  if ('error' in result) {
    return { error: result.error }
  }

  return {
    success: true as const,
    headers: result.headers,
    suggestedMapping: result.suggestedMapping,
    excludedHeaders: result.excludedHeaders
  }
}
