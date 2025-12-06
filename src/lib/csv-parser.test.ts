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
})
