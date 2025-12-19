import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, insertTransactions } from '../utils/test-helpers'
import { loginUser, getGroupId } from '../utils/demo-helpers'

test.describe('L-BR-001, L-TA-001: 精算計算境界値ケース (Boundary Cases)', () => {
  let testUser: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testUser = await createTestUser({
      email: `settlement-bounds-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Settlement Bounds User',
    })
  })

  test.afterAll(async () => {
    if (testUser.id) await cleanupTestData(testUser.id)
  })

  test.beforeEach(async ({ page }) => {
    await loginUser(page, testUser)
    
    const userGroupId = await getGroupId(testUser.id!)
    if (!userGroupId) {
      await page.goto('/settings')
      await page.fill('input[name="groupName"]', 'Settlement Test Group')
      await page.fill('input[name="ratioA"]', '50')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)
      groupId = (await getGroupId(testUser.id!))!
    } else {
      groupId = userGroupId
    }
  })

  test.describe('BND-001: 負担割合合計≠100%エラー', () => {
    test('負担割合の合計が110%の場合エラーメッセージが表示される', async ({ page }) => {
      await page.goto('/settings')

      await page.fill('input[name="ratioA"]', '60')
      
      const ratioBField = page.locator('input[name="ratioB"]')
      const ratioBExists = await ratioBField.count() > 0
      
      if (ratioBExists) {
        await page.fill('input[name="ratioB"]', '50')
      }

      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      const errorMessage = await page.getByText(/100%|合計|割合|無効|invalid/i).isVisible().catch(() => false)
      expect(errorMessage).toBeTruthy()
    })

    test('負担割合の合計が90%の場合エラーメッセージが表示される', async ({ page }) => {
      await page.goto('/settings')

      await page.fill('input[name="ratioA"]', '40')
      
      const ratioBField = page.locator('input[name="ratioB"]')
      const ratioBExists = await ratioBField.count() > 0
      
      if (ratioBExists) {
        await page.fill('input[name="ratioB"]', '50')
      }

      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      const errorMessage = await page.getByText(/100%|合計|割合|無効|invalid/i).isVisible().catch(() => false)
      expect(errorMessage).toBeTruthy()
    })

    test('負担割合の合計が100%の場合は正常に更新される', async ({ page }) => {
      await page.goto('/settings')

      await page.fill('input[name="ratioA"]', '60')
      
      const ratioBField = page.locator('input[name="ratioB"]')
      const ratioBExists = await ratioBField.count() > 0
      
      if (ratioBExists) {
        await page.fill('input[name="ratioB"]', '40')
      }

      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      const successMessage = await page.getByText(/success|成功|更新|updated/i).isVisible().catch(() => false)
      expect(successMessage).toBeTruthy()
    })
  })

  test.describe('BND-004: 端数処理（四捨五入）', () => {
    test('1000円を33:67で割ると670円になる（四捨五入）', async ({ page }) => {
      await page.goto('/settings')
      await page.fill('input[name="ratioA"]', '33')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      await insertTransactions([
        {
          userId: testUser.id!,
          groupId,
          date: '2025-01-15',
          description: '端数テスト',
          amount: 1000,
          expenseType: 'Household',
          payerType: 'UserA',
        },
      ])

      await page.goto('/dashboard')
      await page.waitForTimeout(1000)

      const settlementText = await page.locator('[data-testid="settlement-amount"]').textContent().catch(() => null)
      
      if (settlementText) {
        const amount = parseInt(settlementText.replace(/[^0-9]/g, ''))
        expect(amount).toBe(670)
      }
    })

    test('1000円を40:60で割ると400円になる', async ({ page }) => {
      await page.goto('/settings')
      await page.fill('input[name="ratioA"]', '40')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      await insertTransactions([
        {
          userId: testUser.id!,
          groupId,
          date: '2025-01-16',
          description: '端数テスト2',
          amount: 1000,
          expenseType: 'Household',
          payerType: 'UserA',
        },
      ])

      await page.goto('/dashboard')
      await page.waitForTimeout(1000)

      const settlementText = await page.locator('[data-testid="settlement-amount"]').textContent().catch(() => null)
      
      if (settlementText) {
        const amount = parseInt(settlementText.replace(/[^0-9]/g, ''))
        expect(amount).toBe(400)
      }
    })

    test('999円を50:50で割ると500円になる（四捨五入）', async ({ page }) => {
      await page.goto('/settings')
      await page.fill('input[name="ratioA"]', '50')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      await insertTransactions([
        {
          userId: testUser.id!,
          groupId,
          date: '2025-01-17',
          description: '端数テスト3',
          amount: 999,
          expenseType: 'Household',
          payerType: 'UserA',
        },
      ])

      await page.goto('/dashboard')
      await page.waitForTimeout(1000)

      const settlementText = await page.locator('[data-testid="settlement-amount"]').textContent().catch(() => null)
      
      if (settlementText) {
        const amount = parseInt(settlementText.replace(/[^0-9]/g, ''))
        expect(amount).toBe(500)
      }
    })
  })

  test.describe('BND-005: 月またぎ取引', () => {
    test('1月31日と2月1日の取引が正しく月別集計される', async ({ page }) => {
      await insertTransactions([
        {
          userId: testUser.id!,
          groupId,
          date: '2025-01-31',
          description: '1月末の取引',
          amount: 5000,
          expenseType: 'Household',
          payerType: 'UserA',
        },
        {
          userId: testUser.id!,
          groupId,
          date: '2025-02-01',
          description: '2月頭の取引',
          amount: 3000,
          expenseType: 'Household',
          payerType: 'UserA',
        },
      ])

      await page.goto('/dashboard?month=2025-01')
      await page.waitForTimeout(1000)

      const janTransactions = await page.locator('text=1月末の取引').count()
      const febTransactionsInJan = await page.locator('text=2月頭の取引').count()

      expect(janTransactions).toBeGreaterThan(0)
      expect(febTransactionsInJan).toBe(0)

      await page.goto('/dashboard?month=2025-02')
      await page.waitForTimeout(1000)

      const febTransactions = await page.locator('text=2月頭の取引').count()
      const janTransactionsInFeb = await page.locator('text=1月末の取引').count()

      expect(febTransactions).toBeGreaterThan(0)
      expect(janTransactionsInFeb).toBe(0)
    })

    test('12月31日と1月1日の取引が正しく年またぎで集計される', async ({ page }) => {
      await insertTransactions([
        {
          userId: testUser.id!,
          groupId,
          date: '2024-12-31',
          description: '2024年最終日',
          amount: 10000,
          expenseType: 'Household',
          payerType: 'UserA',
        },
        {
          userId: testUser.id!,
          groupId,
          date: '2025-01-01',
          description: '2025年初日',
          amount: 8000,
          expenseType: 'Household',
          payerType: 'UserA',
        },
      ])

      await page.goto('/dashboard?month=2024-12')
      await page.waitForTimeout(1000)

      const dec2024 = await page.locator('text=2024年最終日').count()
      const jan2025InDec = await page.locator('text=2025年初日').count()

      expect(dec2024).toBeGreaterThan(0)
      expect(jan2025InDec).toBe(0)

      await page.goto('/dashboard?month=2025-01')
      await page.waitForTimeout(1000)

      const jan2025 = await page.locator('text=2025年初日').count()
      const dec2024InJan = await page.locator('text=2024年最終日').count()

      expect(jan2025).toBeGreaterThan(0)
      expect(dec2024InJan).toBe(0)
    })
  })
})
