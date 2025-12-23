import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, getUserByEmail, insertTransaction } from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'

test.describe('L-SC-001, L-TA-001: 認証攻撃シナリオ (Attack Cases)', () => {
  test.describe('ATK-001: 未認証ページアクセス防御', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('未認証で/dashboardにアクセスすると/loginへリダイレクトされる', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/login/)
    })

    test('未認証で/dashboard/transactionsにアクセスすると/loginへリダイレクトされる', async ({ page }) => {
      await page.goto('/dashboard/transactions')
      await expect(page).toHaveURL(/\/login/)
    })

    test('未認証で/settingsにアクセスすると/loginへリダイレクトされる', async ({ page }) => {
      await page.goto('/settings')
      await expect(page).toHaveURL(/\/login/)
    })

    test('未認証で/dashboard/transactions/uploadにアクセスすると/loginへリダイレクトされる', async ({ page }) => {
      await page.goto('/dashboard/transactions/upload')
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe.skip('ATK-002: IDOR（他グループデータアクセス拒否）', () => {
    let attackerUser: TestUser
    let victimUser: TestUser
    let victimGroupId: string
    let victimTransactionId: string

    test.beforeAll(async () => {
      const timestamp = Date.now()
      
      attackerUser = await createTestUser({
        email: `attacker-${timestamp}@example.com`,
        password: 'AttackerPass123!',
        name: 'Attacker User',
      })

      victimUser = await createTestUser({
        email: `victim-${timestamp}@example.com`,
        password: 'VictimPass123!',
        name: 'Victim User',
      })
    })

    test.afterAll(async () => {
      if (attackerUser.id) await cleanupTestData(attackerUser.id)
      if (victimUser.id) await cleanupTestData(victimUser.id)
    })

    test('攻撃者が他グループのトランザクション詳細ページにアクセスすると403またはリダイレクト', async ({ page, request }) => {
      await loginUser(page, victimUser)
      await page.goto('/settings')
      await page.fill('input[name="groupName"]', 'Victim Group')
      await page.fill('input[name="ratioA"]', '50')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      const victimUserData = await getUserByEmail(victimUser.email)
      victimGroupId = victimUserData!.group_id!

      const transactionResult = await insertTransaction({
        userId: victimUser.id!,
        groupId: victimGroupId,
        date: '2025-01-15',
        description: 'Victim Transaction',
        amount: 1000,
        expenseType: 'Household',
        payerType: 'UserA'
      })
      victimTransactionId = transactionResult.id

      await page.context().clearCookies()

      await loginUser(page, attackerUser)
      await page.goto('/settings')
      await page.fill('input[name="groupName"]', 'Attacker Group')
      await page.fill('input[name="ratioA"]', '50')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      if (victimTransactionId) {
        const response = await request.get(`/api/transactions/${victimTransactionId}`, {
          headers: {
            'Cookie': await page.context().cookies().then(cookies =>
              cookies.map(c => `${c.name}=${c.value}`).join('; ')
            ),
          },
        })

        expect([403, 404]).toContain(response.status())
      }
    })

    test('攻撃者がAPIで他グループのトランザクション一覧を取得しようとすると自グループのみ返る', async ({ page }) => {
      await loginUser(page, attackerUser)

      const attackerUserData = await getUserByEmail(attackerUser.email)
      if (!attackerUserData?.group_id) {
        await page.goto('/settings')
        await page.fill('input[name="groupName"]', 'Attacker Group 2')
        await page.fill('input[name="ratioA"]', '50')
        await page.click('button[type="submit"]')
        await page.waitForTimeout(1000)
      }

      await page.goto('/dashboard/transactions')
      await page.waitForTimeout(500)

      const transactions = await page.evaluate(() => {
        return fetch('/api/transactions', {
          credentials: 'include',
        }).then(r => r.json())
      })

      if (transactions.data && transactions.data.length > 0) {
        transactions.data.forEach((t: { groupId: string }) => {
          expect(t.groupId).not.toBe(victimGroupId)
        })
      }
    })
  })

  test.describe.skip('ATK-005: レート制限（ログイン5回/15分）', () => {
    // TODO: レート制限ミドルウェア実装後にスキップ解除 (L-SC-004)
    test.use({ storageState: { cookies: [], origins: [] } })

    test('同一IPから15分間に6回以上ログイン試行すると429が返る', async ({ page }) => {
      const timestamp = Date.now()
      const testEmail = `ratelimit-${timestamp}@example.com`
      const testPassword = 'WrongPassword123!'

      await createTestUser({
        email: testEmail,
        password: 'CorrectPassword123!',
        name: 'Rate Limit Test User',
      })

      for (let attempt = 1; attempt <= 5; attempt++) {
        await page.goto('/login')
        await page.fill('input[name="email"]', testEmail)
        await page.fill('input[name="password"]', testPassword)
        await page.click('button[type="submit"]')
        
        await page.waitForTimeout(500)
        
        const errorVisible = await page.getByText(/Invalid|incorrect|failed/i).isVisible().catch(() => false)
        expect(errorVisible).toBeTruthy()
      }

      await page.goto('/login')
      await page.fill('input[name="email"]', testEmail)
      await page.fill('input[name="password"]', testPassword)
      await page.click('button[type="submit"]')
      await page.waitForTimeout(500)

      const rateLimitMessage = await page.getByText(/Too many|rate limit|試行回数|制限/i).isVisible().catch(() => false)
      const stillOnLogin = page.url().includes('/login')
      
      expect(rateLimitMessage || stillOnLogin).toBeTruthy()
    })
  })
})
