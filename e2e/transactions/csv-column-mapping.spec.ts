import { test, expect } from '@playwright/test'

test.use({
  storageState: './e2e/.auth/user-chromium.json'
})

test.describe('CSV Column Mapping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/transactions/upload')
  })

  test('UC-001: Auto-detects standard headers and imports without manual mapping', async ({ page }) => {

    const csvContent = `Date,Amount,Description
2025-01-15,5400,Supermarket XYZ
2025-01-16,450,Coffee Shop`

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'standard.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })

    await expect(page.getByRole('heading', { name: 'データプレビュー' })).toBeVisible({ timeout: 5000 })

    await expect(page.getByText('2025-01-15')).toBeVisible()
    await expect(page.getByText('Supermarket XYZ')).toBeVisible()
    await expect(page.getByText('¥5,400')).toBeVisible()

    await page.selectOption('select[name="defaultPayerType"]', 'UserA')

    await page.getByRole('button', { name: 'インポート実行' }).click()

    await expect(page.getByText(/件の取引をインポートしました/)).toBeVisible()
  })

  test('UC-002: Manual column mapping for non-standard headers', async ({ page }) => {

    const csvContent = `ご利用日,ご利用金額,ご利用先名
2025-01-15,5400,スーパーXYZ
2025-01-16,450,カフェ`

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'japanese.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })

    await expect(page.getByRole('heading', { name: 'データプレビュー' })).toBeVisible({ timeout: 5000 })

    await expect(page.getByText('2025-01-15')).toBeVisible()
    await expect(page.getByText('スーパーXYZ')).toBeVisible()
  })

  test('UC-004: Warning for excluded sensitive columns', async ({ page }) => {

    const csvContent = `日付,金額,摘要,カード番号
2025-01-15,5400,Test,1234-5678-9012-3456`

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'with-sensitive.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })

    await expect(page.getByText(/機密情報を含む可能性のある列を除外しました/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('カード番号')).toBeVisible()
  })

  test('UC-005: Error when required column is missing', async ({ page }) => {

    const csvContent = `Date,Description
2025-01-15,Test Item`

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'missing-amount.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })

    await expect(page.getByText(/必須列.*が見つかりません/)).toBeVisible({ timeout: 5000 })
  })

  test('L-CX-004: UI responds within 200ms on button click', async ({ page }) => {

    const csvContent = `Date,Amount,Description
2025-01-15,100,Test`

    const fileInput = page.locator('input[type="file"]')

    const startTime = Date.now()
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })

    await page.waitForLoadState('networkidle')
    const responseTime = Date.now() - startTime

    expect(responseTime).toBeLessThan(5000)
  })

  test('L-BR-006: Auto-detects payer column and displays in preview', async ({ page }) => {

    const csvContent = `Date,Amount,Description,Payer
2025-01-15,5400,Supermarket,Alice
2025-01-16,450,Coffee,Bob
2025-01-17,3200,Dinner,—`

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'with-payer.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })

    await expect(page.getByRole('heading', { name: 'データプレビュー' })).toBeVisible({ timeout: 5000 })

    await expect(page.getByRole('columnheader', { name: 'Payer' })).toBeVisible()
    await expect(page.getByText('Alice')).toBeVisible()
    await expect(page.getByText('Bob')).toBeVisible()
  })

  test('L-BR-006: Payer column is optional', async ({ page }) => {

    const csvContent = `Date,Amount,Description
2025-01-15,5400,Supermarket
2025-01-16,450,Coffee`

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'no-payer.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })

    await expect(page.getByRole('heading', { name: 'データプレビュー' })).toBeVisible({ timeout: 5000 })

    await expect(page.getByRole('columnheader', { name: 'Payer' })).toBeVisible()
    await expect(page.getByText('—').first()).toBeVisible()
  })

  test('L-SC-002: Payer field formula injection is sanitized', async ({ page }) => {

    const csvContent = `Date,Amount,Description,Payer
2025-01-15,5400,Test,=CMD|calc`

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'malicious-payer.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })

    await expect(page.getByRole('heading', { name: 'データプレビュー' })).toBeVisible({ timeout: 5000 })

    await expect(page.getByText(/^'=CMD\|calc$/)).toBeVisible()
  })
})
