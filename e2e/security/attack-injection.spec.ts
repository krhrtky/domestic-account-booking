import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, insertTransaction, createTestGroup } from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'
import path from 'path'

test.describe('L-SC-002, L-TA-001: インジェクション攻撃シナリオ (Attack Cases)', () => {
  let testUser: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testUser = await createTestUser({
      email: `injection-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Injection Test User',
    })
    groupId = await createTestGroup(testUser.id!, { name: 'XSS Test Group', ratioA: 50, ratioB: 50 })
  })

  test.afterAll(async () => {
    if (testUser.id) await cleanupTestData(testUser.id)
  })

  test.describe.serial('ATK-003: XSS防御（取引摘要）', () => {
    test('手動入力の取引摘要にスクリプトタグを含めても実行されない', async ({ page }) => {
      await loginUser(page, testUser)

      const xssPayload = '<script>alert(document.cookie)</script>'
      await insertTransaction({
        userId: testUser.id!,
        groupId,
        date: '2025-01-15',
        description: xssPayload,
        amount: 1000,
        expenseType: 'Household',
        payerType: 'UserA'
      })

      await page.goto('/dashboard/transactions')
      await page.waitForLoadState('networkidle')

      const pageContent = await page.content()
      expect(pageContent).not.toContain('<script>alert(document.cookie)</script>')

      const hasExecutableScript = await page.locator('script:has-text("alert(document.cookie)")').count()
      expect(hasExecutableScript).toBe(0)
    })

    test('img onerrorタグを含む摘要も実行されない', async ({ page }) => {
      await loginUser(page, testUser)

      const imgPayload = '<img src=x onerror="alert(1)">'
      await insertTransaction({
        userId: testUser.id!,
        groupId,
        date: '2025-01-16',
        description: imgPayload,
        amount: 2000,
        expenseType: 'Household',
        payerType: 'UserA'
      })

      await page.goto('/dashboard/transactions')
      await page.waitForLoadState('networkidle')

      const hasExecutableImg = await page.locator('img[onerror]').count()
      expect(hasExecutableImg).toBe(0)

      const imgElements = await page.locator('img[src="x"]').count()
      expect(imgElements).toBe(0)
    })

    test('javascript: スキームを含むリンクも無害化される', async ({ page }) => {
      await loginUser(page, testUser)

      const jsPayload = 'Click <a href="javascript:alert(1)">here</a>'
      await insertTransaction({
        userId: testUser.id!,
        groupId,
        date: '2025-01-17',
        description: jsPayload,
        amount: 3000,
        expenseType: 'Household',
        payerType: 'UserA'
      })

      await page.goto('/dashboard/transactions')
      await page.waitForLoadState('networkidle')

      const hasJavascriptLink = await page.locator('a[href^="javascript:"]').count()
      expect(hasJavascriptLink).toBe(0)
    })
  })

  test.describe.skip('ATK-004: CSVインジェクション防御', () => {
    test('数式インジェクション（=CMD）を含むCSVをアップロードしてもエスケープされる', async ({ page }) => {
      await loginUser(page, testUser)

      if (!groupId) {
        await page.goto('/settings')
        await page.fill('input[name="groupName"]', 'CSV Injection Test Group')
        await page.fill('input[name="ratioA"]', '50')
        await page.click('button[type="submit"]')
        await page.waitForTimeout(1000)

        const userData = await getUserByEmail(testUser.email)
        groupId = userData!.group_id!
      }

      const csvContent = `date,amount,description
2025-01-15,1000,=CMD|calc|A0
2025-01-16,2000,正常な摘要`

      const csvPath = path.join(__dirname, '../../tests/fixtures/csv-injection-test.csv')
      const fs = require('fs')
      fs.writeFileSync(csvPath, csvContent, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      await expect(page.locator('h2:has-text("列マッピングの確認")')).toBeVisible({ timeout: 10000 })

      await page.getByRole('button', { name: 'プレビューを表示' }).click()

      await expect(page.locator('text=データプレビュー')).toBeVisible({ timeout: 10000 })

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()

      await page.waitForTimeout(3000)

      await page.goto('/dashboard/transactions')
      await page.waitForTimeout(1000)

      const transactions = await page.evaluate(() => {
        return fetch('/api/transactions', {
          credentials: 'include',
        }).then(r => r.json())
      })

      expect(transactions.data).toBeDefined()

      const injectionTransaction = transactions.data?.find((t: { description: string }) =>
        t.description.includes('CMD') || t.description.includes('calc')
      )

      expect(injectionTransaction).toBeDefined()

      const startsWithEquals = injectionTransaction.description.startsWith('=')
      expect(startsWithEquals).toBeFalsy()

      const hasSingleQuotePrefix = injectionTransaction.description.startsWith("'=")
      expect(hasSingleQuotePrefix || !startsWithEquals).toBeTruthy()

      fs.unlinkSync(csvPath)
    })

    test('ハイパーリンク数式（=HYPERLINK）を含むCSVもエスケープされる', async ({ page }) => {
      await loginUser(page, testUser)

      const csvContent = `date,amount,description
2025-01-18,5000,=HYPERLINK("http://evil.com","クリック")
2025-01-19,6000,正常な摘要`

      const csvPath = path.join(__dirname, '../../tests/fixtures/csv-hyperlink-test.csv')
      const fs = require('fs')
      fs.writeFileSync(csvPath, csvContent, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      await expect(page.locator('h2:has-text("列マッピングの確認")')).toBeVisible({ timeout: 10000 })

      await page.getByRole('button', { name: 'プレビューを表示' }).click()

      await expect(page.locator('text=データプレビュー')).toBeVisible({ timeout: 10000 })

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()

      await page.waitForTimeout(3000)

      await page.goto('/dashboard/transactions')
      await page.waitForTimeout(1000)

      const transactions = await page.evaluate(() => {
        return fetch('/api/transactions', {
          credentials: 'include',
        }).then(r => r.json())
      })

      expect(transactions.data).toBeDefined()

      const hyperlinkTransaction = transactions.data?.find((t: { description: string }) =>
        t.description.includes('HYPERLINK') || t.description.includes('evil.com')
      )

      expect(hyperlinkTransaction).toBeDefined()

      const startsWithEquals = hyperlinkTransaction.description.startsWith('=')
      expect(startsWithEquals).toBeFalsy()

      fs.unlinkSync(csvPath)
    })

    test('+, -, @ で始まる数式もエスケープされる', async ({ page }) => {
      await loginUser(page, testUser)

      const csvContent = `date,amount,description
2025-01-20,1000,+1+1
2025-01-21,2000,-1-1
2025-01-22,3000,@SUM(A1:A2)`

      const csvPath = path.join(__dirname, '../../tests/fixtures/csv-formula-test.csv')
      const fs = require('fs')
      fs.writeFileSync(csvPath, csvContent, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      await expect(page.locator('h2:has-text("列マッピングの確認")')).toBeVisible({ timeout: 10000 })

      await page.getByRole('button', { name: 'プレビューを表示' }).click()

      await expect(page.locator('text=データプレビュー')).toBeVisible({ timeout: 10000 })

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()

      await page.waitForTimeout(3000)

      await page.goto('/dashboard/transactions')
      await page.waitForTimeout(1000)

      const transactions = await page.evaluate(() => {
        return fetch('/api/transactions', {
          credentials: 'include',
        }).then(r => r.json())
      })

      expect(transactions.data).toBeDefined()

      const formulaTransactions = transactions.data?.filter((t: { description: string }) =>
        /^[\+\-@]/.test(t.description)
      )

      expect(formulaTransactions?.length || 0).toBe(0)

      fs.unlinkSync(csvPath)
    })
  })
})
