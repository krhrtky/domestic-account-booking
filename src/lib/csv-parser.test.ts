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
})
