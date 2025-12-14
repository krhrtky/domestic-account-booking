import { describe, it, expect } from 'vitest'
import { parseCSV } from './csv-parser'
import fs from 'fs'
import path from 'path'

describe('parseCSV', () => {
  it('parses generic bank statement format', async () => {
    const csvContent = fs.readFileSync(
      path.join(__dirname, '../../tests/fixtures/sample-generic.csv'),
      'utf-8'
    )

    const result = await parseCSV(csvContent, 'sample-generic.csv')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(3)
      expect(result.data[0]).toMatchObject({
        date: '2025-01-15',
        description: 'Supermarket XYZ',
        amount: 5400,
      })
      expect(result.data[1]).toMatchObject({
        date: '2025-01-16',
        description: 'Coffee Shop',
        amount: 450,
      })
    }
  })

  it('parses Japanese credit card format', async () => {
    const csvContent = fs.readFileSync(
      path.join(__dirname, '../../tests/fixtures/sample-japanese.csv'),
      'utf-8'
    )

    const result = await parseCSV(csvContent, 'sample-japanese.csv')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
      expect(result.data[0]).toMatchObject({
        date: '2025-01-15',
        description: 'スーパーXYZ',
        amount: 5400,
      })
    }
  })

  it('parses amounts with yen symbol and comma formatting', async () => {
    const csvContent = `Date,Description,Amount
2025-01-15,Test purchase,"¥1,000"
2025-01-16,Another purchase,"¥10,500"`

    const result = await parseCSV(csvContent, 'test.csv')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
      expect(result.data[0].amount).toBe(1000)
      expect(result.data[1].amount).toBe(10500)
    }
  })

  it('handles negative amounts correctly', async () => {
    const csvContent = `Date,Description,Amount
2025-01-15,Payment,-5000
2025-01-16,Refund,1000`

    const result = await parseCSV(csvContent, 'test.csv')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data[0].amount).toBe(5000)
      expect(result.data[1].amount).toBe(1000)
    }
  })

  it('skips empty rows', async () => {
    const csvContent = `Date,Description,Amount
2025-01-15,Payment,5000

2025-01-16,Refund,1000`

    const result = await parseCSV(csvContent, 'test.csv')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('returns error for invalid CSV', async () => {
    const csvContent = 'Invalid CSV content'

    const result = await parseCSV(csvContent, 'invalid.csv')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('returns error for empty CSV', async () => {
    const csvContent = ''

    const result = await parseCSV(csvContent, 'empty.csv')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0]).toContain('empty')
    }
  })

  it('returns error when file exceeds 5MB limit', async () => {
    const largeContent = 'Date,Description,Amount\n' + '2025-01-15,Test,1000\n'.repeat(300000)

    const result = await parseCSV(largeContent, 'large.csv')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0]).toContain('5MB')
    }
  })

  it('accepts file within 5MB limit', async () => {
    const validContent = 'Date,Description,Amount\n2025-01-15,Test,1000'

    const result = await parseCSV(validContent, 'valid.csv')

    expect(result.success).toBe(true)
  })

  it('rejects files over 10,000 rows', async () => {
    const rows = 'Date,Description,Amount\n' + '2025-01-15,Test,1000\n'.repeat(10001)

    const result = await parseCSV(rows, 'large-rows.csv')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0]).toContain('行数が上限')
      expect(result.errors[0]).toContain('10,000')
    }
  })

  it('accepts files with exactly 10,000 rows', async () => {
    const rows = 'Date,Description,Amount\n' + '2025-01-15,Test,1000\n'.repeat(10000)

    const result = await parseCSV(rows, 'exactly-10k.csv')

    expect(result.success).toBe(true)
  })

  describe('date validation', () => {
    it('validates date format YYYY-MM-DD', async () => {
      const csvContent = `Date,Description,Amount
2025-01-15,Valid date,1000
invalid-date,Invalid date,1000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].date).toBe('2025-01-15')
      }
    })

    it('parses MM/DD/YYYY format correctly', async () => {
      const csvContent = `Date,Description,Amount
01/15/2025,US date format,1000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].date).toBe('2025-01-15')
      }
    })
  })

  describe('XSS prevention', () => {
    it('handles descriptions with HTML/script tags', async () => {
      const csvContent = `Date,Description,Amount
2025-01-15,<script>alert('xss')</script>,1000
2025-01-16,Normal description,2000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.data[0].description).toBe("<script>alert('xss')</script>")
      }
    })
  })

  describe('Incident regression tests', () => {
    it('handles UTF-8 BOM correctly', async () => {
      const csvWithBOM = '\uFEFFDate,Description,Amount\n2025-01-15,BOM test,1000'

      const result = await parseCSV(csvWithBOM, 'bom.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].amount).toBe(1000)
      }
    })

    it('detects columns case-insensitively', async () => {
      const csvContent = `DATE,DESCRIPTION,AMOUNT
2025-01-15,Uppercase headers,1000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].date).toBe('2025-01-15')
        expect(result.data[0].description).toBe('Uppercase headers')
        expect(result.data[0].amount).toBe(1000)
      }
    })
  })

  describe('L-LC-001: Sensitive column filtering', () => {
    it('excludes カード番号 column with warning', async () => {
      const csvContent = `Date,Description,Amount,カード番号
2025-01-15,Test transaction,1000,1234-5678-9012-3456`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.warnings).toBeDefined()
        expect(result.warnings?.[0]).toContain('機密情報を含む可能性のある列を除外しました')
        expect(result.warnings?.[0]).toContain('カード番号')
      }
    })

    it('excludes Card Number column with warning', async () => {
      const csvContent = `Date,Description,Amount,Card Number
2025-01-15,Test transaction,1000,1234-5678-9012-3456`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.warnings).toBeDefined()
        expect(result.warnings?.[0]).toContain('Card Number')
      }
    })

    it('excludes 口座番号 column with warning', async () => {
      const csvContent = `Date,Description,Amount,口座番号
2025-01-15,Test transaction,1000,1234567`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.warnings).toBeDefined()
        expect(result.warnings?.[0]).toContain('口座番号')
      }
    })

    it('excludes PIN, CVV, CVC columns with warning', async () => {
      const csvContent = `Date,Description,Amount,PIN,CVV,CVC
2025-01-15,Test transaction,1000,1234,123,456`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.warnings).toBeDefined()
        expect(result.warnings?.[0]).toContain('PIN')
        expect(result.warnings?.[0]).toContain('CVV')
        expect(result.warnings?.[0]).toContain('CVC')
      }
    })

    it('does not show warnings for normal CSV', async () => {
      const csvContent = `Date,Description,Amount
2025-01-15,Test transaction,1000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.warnings).toBeUndefined()
      }
    })
  })

  describe('L-SC-002: CSV injection prevention', () => {
    it('escapes formula starting with =', async () => {
      const csvContent = `Date,Description,Amount
2025-01-15,=CMD|calc|A0,1000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].description).toBe("'=CMD|calc|A0")
      }
    })

    it('escapes formula starting with +', async () => {
      const csvContent = `Date,Description,Amount
2025-01-15,+1234567890,1000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].description).toBe("'+1234567890")
      }
    })

    it('escapes formula starting with -', async () => {
      const csvContent = `Date,Description,Amount
2025-01-15,-1000,1000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].description).toBe("'-1000")
      }
    })

    it('escapes formula starting with @', async () => {
      const csvContent = `Date,Description,Amount
2025-01-15,@SUM(A1:A10),1000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].description).toBe("'@SUM(A1:A10)")
      }
    })

    it('removes newlines from description', async () => {
      const csvContent = `Date,Description,Amount
2025-01-15,"テスト
悪意",1000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].description).toBe('テスト悪意')
        expect(result.data[0].description).not.toContain('\n')
        expect(result.data[0].description).not.toContain('\r')
      }
    })

    it('does not alter normal text', async () => {
      const csvContent = `Date,Description,Amount
2025-01-15,Normal transaction,1000`

      const result = await parseCSV(csvContent, 'test.csv')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].description).toBe('Normal transaction')
      }
    })
  })
})
