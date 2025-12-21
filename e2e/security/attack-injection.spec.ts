import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser } from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'
import path from 'path'

test.describe('L-SC-002, L-TA-001: インジェクション攻撃シナリオ (Attack Cases)', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testUser = await createTestUser({
      email: `injection-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Injection Test User',
    })
  })

  test.afterAll(async () => {
    if (testUser.id) await cleanupTestData(testUser.id)
  })

  test.describe('ATK-003: XSS防御（取引摘要）', () => {
    test('手動入力の取引摘要にスクリプトタグを含めても実行されない', async ({ page }) => {
      await loginUser(page, testUser)

      await page.goto('/settings')
      await page.fill('input[name="groupName"]', 'XSS Test Group')
      await page.fill('input[name="ratioA"]', '50')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      await page.goto('/transactions')
      await page.click('button:has-text("Add Transaction")')

      const xssPayload = '<script>alert(document.cookie)</script>'
      await page.fill('input[name="date"]', '2025-01-15')
      await page.fill('input[name="description"]', xssPayload)
      await page.fill('input[name="amount"]', '1000')
      await page.selectOption('select[name="expenseType"]', 'Household')
      await page.click('button[type="submit"]:has-text("Add")')

      await page.waitForTimeout(1000)
      await page.reload()

      const pageContent = await page.content()
      expect(pageContent).not.toContain('<script>alert(document.cookie)</script>')
      
      const escapedContent = pageContent.includes('&lt;script&gt;') || 
                            pageContent.includes('alert(document.cookie)') === false
      expect(escapedContent).toBeTruthy()

      const descriptionText = await page.locator('text=' + xssPayload).first().textContent().catch(() => null)
      if (descriptionText) {
        expect(descriptionText).toContain('<script>')
      }
    })

    test('img onerrorタグを含む摘要も実行されない', async ({ page }) => {
      await loginUser(page, testUser)
      await page.goto('/transactions')
      await page.click('button:has-text("Add Transaction")')

      const imgPayload = '<img src=x onerror="alert(1)">'
      await page.fill('input[name="date"]', '2025-01-16')
      await page.fill('input[name="description"]', imgPayload)
      await page.fill('input[name="amount"]', '2000')
      await page.selectOption('select[name="expenseType"]', 'Household')
      await page.click('button[type="submit"]:has-text("Add")')

      await page.waitForTimeout(1000)
      await page.reload()

      const pageContent = await page.content()
      expect(pageContent).not.toContain('onerror=')
      
      const hasExecutableImg = await page.locator('img[onerror]').count()
      expect(hasExecutableImg).toBe(0)
    })

    test('javascript: スキームを含むリンクも無害化される', async ({ page }) => {
      await loginUser(page, testUser)
      await page.goto('/transactions')
      await page.click('button:has-text("Add Transaction")')

      const jsPayload = 'Click <a href="javascript:alert(1)">here</a>'
      await page.fill('input[name="date"]', '2025-01-17')
      await page.fill('input[name="description"]', jsPayload)
      await page.fill('input[name="amount"]', '3000')
      await page.selectOption('select[name="expenseType"]', 'Household')
      await page.click('button[type="submit"]:has-text("Add")')

      await page.waitForTimeout(1000)
      await page.reload()

      const pageContent = await page.content()
      const hasJavascriptHref = pageContent.includes('href="javascript:')
      expect(hasJavascriptHref).toBeFalsy()
    })
  })

  test.describe('ATK-004: CSVインジェクション防御', () => {
    test('数式インジェクション（=CMD）を含むCSVをアップロードしてもエスケープされる', async ({ page }) => {
      await loginUser(page, testUser)

      const csvContent = `日付,金額,摘要
2025-01-15,1000,=CMD|calc|A0
2025-01-16,2000,正常な摘要`

      const csvPath = path.join(__dirname, '../../tests/fixtures/csv-injection-test.csv')
      const fs = require('fs')
      fs.writeFileSync(csvPath, csvContent, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()
      await page.waitForTimeout(2000)

      await page.goto('/transactions')
      await page.waitForTimeout(1000)

      const transactions = await page.evaluate(() => {
        return fetch('/api/transactions', {
          credentials: 'include',
        }).then(r => r.json())
      })

      const injectionTransaction = transactions.data?.find((t: { description: string }) => 
        t.description.includes('CMD') || t.description.includes('calc')
      )

      if (injectionTransaction) {
        const startsWithEquals = injectionTransaction.description.startsWith('=')
        expect(startsWithEquals).toBeFalsy()
        
        const hasSingleQuotePrefix = injectionTransaction.description.startsWith("'=")
        expect(hasSingleQuotePrefix || !startsWithEquals).toBeTruthy()
      }

      fs.unlinkSync(csvPath)
    })

    test('ハイパーリンク数式（=HYPERLINK）を含むCSVもエスケープされる', async ({ page }) => {
      await loginUser(page, testUser)

      const csvContent = `日付,金額,摘要
2025-01-18,5000,=HYPERLINK("http://evil.com","クリック")
2025-01-19,6000,正常な摘要`

      const csvPath = path.join(__dirname, '../../tests/fixtures/csv-hyperlink-test.csv')
      const fs = require('fs')
      fs.writeFileSync(csvPath, csvContent, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()
      await page.waitForTimeout(2000)

      await page.goto('/transactions')
      await page.waitForTimeout(1000)

      const transactions = await page.evaluate(() => {
        return fetch('/api/transactions', {
          credentials: 'include',
        }).then(r => r.json())
      })

      const hyperlinkTransaction = transactions.data?.find((t: { description: string }) => 
        t.description.includes('HYPERLINK') || t.description.includes('evil.com')
      )

      if (hyperlinkTransaction) {
        const startsWithEquals = hyperlinkTransaction.description.startsWith('=')
        expect(startsWithEquals).toBeFalsy()
      }

      fs.unlinkSync(csvPath)
    })

    test('+, -, @ で始まる数式もエスケープされる', async ({ page }) => {
      await loginUser(page, testUser)

      const csvContent = `日付,金額,摘要
2025-01-20,1000,+1+1
2025-01-21,2000,-1-1
2025-01-22,3000,@SUM(A1:A2)`

      const csvPath = path.join(__dirname, '../../tests/fixtures/csv-formula-test.csv')
      const fs = require('fs')
      fs.writeFileSync(csvPath, csvContent, 'utf-8')

      await page.goto('/dashboard/transactions/upload')

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvPath)

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()
      await page.waitForTimeout(2000)

      await page.goto('/transactions')
      await page.waitForTimeout(1000)

      const transactions = await page.evaluate(() => {
        return fetch('/api/transactions', {
          credentials: 'include',
        }).then(r => r.json())
      })

      const formulaTransactions = transactions.data?.filter((t: { description: string }) => 
        /^[\+\-@]/.test(t.description)
      )

      expect(formulaTransactions?.length || 0).toBe(0)

      fs.unlinkSync(csvPath)
    })
  })
})
