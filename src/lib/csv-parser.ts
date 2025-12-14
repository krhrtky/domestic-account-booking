import Papa from 'papaparse'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  source_file_name: string
}

export type ParseResult =
  | { success: true; data: ParsedTransaction[]; warnings?: string[] }
  | { success: false; errors: string[]; warnings?: string[] }

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_ROW_COUNT = 10000

const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

const SENSITIVE_COLUMN_PATTERNS: RegExp[] = [
  /カード番号/i,
  /card.?number/i,
  /口座番号/i,
  /account.?number/i,
  /暗証番号/i,
  /pin/i,
  /cvv/i,
  /cvc/i,
]

const FORMULA_PREFIXES = ['=', '+', '-', '@']

interface ColumnFilterResult {
  filteredHeaders: string[]
  excludedColumns: string[]
}

const filterSensitiveColumns = (headers: string[]): ColumnFilterResult => {
  const excludedColumns: string[] = []
  const filteredHeaders = headers.filter((header) => {
    const isSensitive = SENSITIVE_COLUMN_PATTERNS.some((pattern) =>
      pattern.test(header)
    )
    if (isSensitive) {
      excludedColumns.push(header)
      return false
    }
    return true
  })

  return { filteredHeaders, excludedColumns }
}

const sanitizeCSVField = (value: string): string => {
  let sanitized = value.replace(/[\r\n]/g, '')

  if (
    sanitized.length > 0 &&
    FORMULA_PREFIXES.includes(sanitized[0])
  ) {
    sanitized = "'" + sanitized
  }

  return sanitized
}

const detectDateColumn = (headers: string[]): number => {
  const datePatterns = ['date', '日付', '利用日', 'Date']
  return headers.findIndex((h) =>
    datePatterns.some((p) => h.toLowerCase().includes(p.toLowerCase()))
  )
}

const detectDescriptionColumn = (headers: string[]): number => {
  const descPatterns = ['description', '摘要', '内容', '店名', '商品名', 'Description']
  return headers.findIndex((h) =>
    descPatterns.some((p) => h.toLowerCase().includes(p.toLowerCase()))
  )
}

const detectAmountColumn = (headers: string[]): number => {
  const amountPatterns = ['amount', '金額', 'Amount']
  return headers.findIndex((h) =>
    amountPatterns.some((p) => h.toLowerCase().includes(p.toLowerCase()))
  )
}

const normalizeDate = (dateStr: string): string | null => {
  const formats = [
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: ['y', 'm', 'd'] },
    { regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, order: ['y', 'm', 'd'] },
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: ['m', 'd', 'y'] },
  ]

  for (const { regex, order } of formats) {
    const match = dateStr.match(regex)
    if (match) {
      const parts: Record<string, string> = {}
      order.forEach((key, idx) => {
        parts[key] = match[idx + 1]
      })

      const year = parts['y']
      const month = parts['m'].padStart(2, '0')
      const day = parts['d'].padStart(2, '0')
      const normalized = `${year}-${month}-${day}`

      if (DATE_REGEX.test(normalized)) {
        return normalized
      }
    }
  }

  return null
}

const parseAmount = (amountStr: string): number => {
  const cleaned = amountStr.replace(/[,¥]/g, '').trim()
  const num = parseFloat(cleaned)
  return Math.abs(num)
}

export const parseCSV = async (
  csvContent: string,
  fileName: string
): Promise<ParseResult> => {
  if (!csvContent || csvContent.trim().length === 0) {
    return { success: false, errors: ['CSV file is empty'] }
  }

  const byteSize = new TextEncoder().encode(csvContent).length
  if (byteSize > MAX_FILE_SIZE_BYTES) {
    return { success: false, errors: ['File size exceeds 5MB limit'] }
  }

  return new Promise((resolve) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            success: false,
            errors: results.errors.map((e) => e.message),
          })
          return
        }

        if (results.data.length === 0) {
          resolve({ success: false, errors: ['No data rows found in CSV'] })
          return
        }

        if (results.data.length > MAX_ROW_COUNT) {
          resolve({
            success: false,
            errors: [`行数が上限(${MAX_ROW_COUNT.toLocaleString()}行)を超えています`],
          })
          return
        }

        const headers = results.meta.fields || []
        const { filteredHeaders, excludedColumns } = filterSensitiveColumns(headers)
        const warnings: string[] = []

        if (excludedColumns.length > 0) {
          warnings.push(`機密情報を含む可能性のある列を除外しました: ${excludedColumns.join(', ')}`)
        }

        const dateIdx = detectDateColumn(filteredHeaders)
        const descIdx = detectDescriptionColumn(filteredHeaders)
        const amountIdx = detectAmountColumn(filteredHeaders)

        if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
          const headerList = filteredHeaders.length > 0 ? filteredHeaders.join(', ') : 'none'
          resolve({
            success: false,
            errors: [
              'Could not detect required columns. Found headers: ' + headerList,
            ],
            warnings: warnings.length > 0 ? warnings : undefined,
          })
          return
        }

        const transactions: ParsedTransaction[] = []
        const errors: string[] = []

        results.data.forEach((row: any, idx: number) => {
          try {
            const dateStr = row[filteredHeaders[dateIdx]]
            const description = sanitizeCSVField(row[filteredHeaders[descIdx]])
            const amountStr = row[filteredHeaders[amountIdx]]

            if (!dateStr || !description || !amountStr) {
              return
            }

            const date = normalizeDate(dateStr)
            if (!date) {
              return
            }

            const amount = parseAmount(amountStr)

            transactions.push({
              date,
              description,
              amount,
              source_file_name: fileName,
            })
          } catch (error) {
            errors.push('Row ' + (idx + 1) + ': ' + error)
          }
        })

        if (transactions.length === 0) {
          resolve({
            success: false,
            errors: ['No valid transactions found', ...errors],
            warnings: warnings.length > 0 ? warnings : undefined,
          })
          return
        }

        resolve({
          success: true,
          data: transactions,
          warnings: warnings.length > 0 ? warnings : undefined,
        })
      },
    })
  })
}
