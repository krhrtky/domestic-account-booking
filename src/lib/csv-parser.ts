import Papa from 'papaparse'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  source_file_name: string
}

export type ParseResult =
  | { success: true; data: ParsedTransaction[] }
  | { success: false; errors: string[] }

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

const normalizeDate = (dateStr: string): string => {
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{4})\/(\d{2})\/(\d{2})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  ]

  for (const format of formats) {
    const match = dateStr.match(format)
    if (match) {
      if (format === formats[2]) {
        const [, mm, dd, yyyy] = match
        return `${yyyy}-${mm}-${dd}`
      }
      return `${match[1]}-${match[2]}-${match[3]}`
    }
  }

  return dateStr
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

        const headers = results.meta.fields || []
        const dateIdx = detectDateColumn(headers)
        const descIdx = detectDescriptionColumn(headers)
        const amountIdx = detectAmountColumn(headers)

        if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
          const headerList = headers.length > 0 ? headers.join(', ') : 'none'
          resolve({
            success: false,
            errors: [
              'Could not detect required columns. Found headers: ' + headerList,
            ],
          })
          return
        }

        const transactions: ParsedTransaction[] = []
        const errors: string[] = []

        results.data.forEach((row: any, idx: number) => {
          try {
            const dateStr = row[headers[dateIdx]]
            const description = row[headers[descIdx]]
            const amountStr = row[headers[amountIdx]]

            if (!dateStr || !description || !amountStr) {
              return
            }

            const date = normalizeDate(dateStr)
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
          })
          return
        }

        resolve({ success: true, data: transactions })
      },
    })
  })
}
