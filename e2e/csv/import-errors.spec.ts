import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser } from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'
import path from 'path'
import fs from 'fs'

test.describe('L-BR-006, L-TA-001: CSV取り込みエラーケース (Incident & Boundary Cases)', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testUser = await createTestUser({
      email: `csv-errors-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'CSV Errors Test User',
    })
  })

  test.afterAll(async () => {
    if (testUser.id) await cleanupTestData(testUser.id)
  })

  test.beforeEach(async ({ page }) => {
    await loginUser(page, testUser)
    
    const hasGroup = await page.evaluate(() => {
      return fetch('/api/me', { credentials: 'include' })
        .then(r => r.json())
        .then(data => !!data.groupId)
    })

    if (!hasGroup) {
      await page.goto('/settings')
      await page.fill('input[name="groupName"]', 'CSV Test Group')
      await page.fill('input[name="ratioA"]', '50')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)
    }
  })

  test.describe('INC-001: 文字化けCSV（非UTF-8）', () => {
    test.skip('Shift-JISエンコードのCSVをアップロードするとエラーメッセージが表示される', async ({ page }) => {
      const shiftJisContent = Buffer.from('日付,金額,摘要\n2025-01-15,1000,テスト', 'shift_jis' as BufferEncoding)
      const csvPath = path.join(__dirname, '../../tests/fixtures/shift-jis-test.csv')
      fs.writeFileSync(csvPath, shiftJisContent)

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()
      await page.waitForTimeout(2000)

      const errorMessage = await page.getByText(/UTF-8|文字コード|エンコード|無効/i).isVisible().catch(() => false)
      expect(errorMessage).toBeTruthy()

      fs.unlinkSync(csvPath)
    })

    test('BOMなしUTF-8は正常に処理される', async ({ page }) => {
      const utf8Content = '日付,金額,摘要\n2025-01-15,1000,正常なテスト'
      const csvPath = path.join(__dirname, '../../tests/fixtures/utf8-no-bom-test.csv')
      fs.writeFileSync(csvPath, utf8Content, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      await expect(page.getByRole('heading', { name: '列マッピングの確認' })).toBeVisible({ timeout: 5000 })

      await page.getByRole('button', { name: 'プレビューを表示' }).click()

      await expect(page.getByRole('heading', { name: 'データプレビュー' })).toBeVisible({ timeout: 5000 })

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()

      await Promise.race([
        page.getByText(/件の取引をインポートしました/).waitFor({ timeout: 5000 }),
        page.waitForURL('**/dashboard/transactions', { timeout: 10000 })
      ])

      const currentUrl = page.url()
      expect(currentUrl).toContain('/dashboard/transactions')

      fs.unlinkSync(csvPath)
    })
  })

  test.describe.skip('BND-002: CSV行数上限（10,000行）', () => {
    test('10,000行のCSVは正常に処理される', async ({ page }) => {
      const rows = ['日付,金額,摘要']
      for (let i = 1; i <= 10000; i++) {
        rows.push(`2025-01-15,${i},取引${i}`)
      }
      const csvContent = rows.join('\n')
      const csvPath = path.join(__dirname, '../../tests/fixtures/10000-rows-test.csv')
      fs.writeFileSync(csvPath, csvContent, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      await expect(page.getByRole('heading', { name: '列マッピングの確認' })).toBeVisible({ timeout: 5000 })

      await page.getByRole('button', { name: 'プレビューを表示' }).click()

      await expect(page.getByRole('heading', { name: 'データプレビュー' })).toBeVisible({ timeout: 5000 })

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()

      await Promise.race([
        page.getByText(/件の取引をインポートしました/).waitFor({ timeout: 10000 }),
        page.waitForURL('**/dashboard/transactions', { timeout: 20000 })
      ])

      const currentUrl = page.url()
      expect(currentUrl).toContain('/dashboard/transactions')

      fs.unlinkSync(csvPath)
    })

    test('10,001行のCSVはエラーになる', async ({ page }) => {
      const rows = ['日付,金額,摘要']
      for (let i = 1; i <= 10001; i++) {
        rows.push(`2025-01-15,${i},取引${i}`)
      }
      const csvContent = rows.join('\n')
      const csvPath = path.join(__dirname, '../../tests/fixtures/10001-rows-test.csv')
      fs.writeFileSync(csvPath, csvContent, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      await expect(page.getByRole('heading', { name: '列マッピングの確認' })).toBeVisible({ timeout: 10000 })

      await page.getByRole('button', { name: 'プレビューを表示' }).click()

      await page.waitForTimeout(3000)

      const errorMessage = await page.getByText(/上限|10,?000|行数|limit|超え/i).isVisible().catch(() => false)
      expect(errorMessage).toBeTruthy()

      fs.unlinkSync(csvPath)
    })
  })

  test.describe.skip('BND-003: CSVファイルサイズ上限（5MB）', () => {
    test('5MB以下のCSVは正常に処理される', async ({ page }) => {
      const rows = ['日付,金額,摘要']
      const targetSize = 4.5 * 1024 * 1024
      let currentSize = rows[0].length
      let i = 1

      while (currentSize < targetSize) {
        const longText = 'a'.repeat(100)
        const row = `2025-01-15,${i},${longText}`
        rows.push(row)
        currentSize += row.length + 1
        i++
      }

      const csvContent = rows.join('\n')
      const csvPath = path.join(__dirname, '../../tests/fixtures/4.5mb-test.csv')
      fs.writeFileSync(csvPath, csvContent, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      await expect(page.getByRole('heading', { name: '列マッピングの確認' })).toBeVisible({ timeout: 5000 })

      await page.getByRole('button', { name: 'プレビューを表示' }).click()

      await expect(page.getByRole('heading', { name: 'データプレビュー' })).toBeVisible({ timeout: 5000 })

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()

      await Promise.race([
        page.getByText(/件の取引をインポートしました/).waitFor({ timeout: 10000 }),
        page.waitForURL('**/dashboard/transactions', { timeout: 20000 })
      ])

      const currentUrl = page.url()
      expect(currentUrl).toContain('/dashboard/transactions')

      fs.unlinkSync(csvPath)
    })

    test('5MBを超えるCSVはエラーになる', async ({ page }) => {
      const rows = ['日付,金額,摘要']
      const targetSize = 5.1 * 1024 * 1024
      let currentSize = rows[0].length
      let i = 1

      while (currentSize < targetSize) {
        const longText = 'a'.repeat(100)
        const row = `2025-01-15,${i},${longText}`
        rows.push(row)
        currentSize += row.length + 1
        i++
      }

      const csvContent = rows.join('\n')
      const csvPath = path.join(__dirname, '../../tests/fixtures/5.1mb-test.csv')
      fs.writeFileSync(csvPath, csvContent, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      await page.waitForTimeout(2000)

      const errorMessage = await page.getByText(/サイズ|5MB|ファイル|大きすぎ|size|limit|超え/i).isVisible().catch(() => false)
      expect(errorMessage).toBeTruthy()

      fs.unlinkSync(csvPath)
    })
  })
})
