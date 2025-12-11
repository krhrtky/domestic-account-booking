import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, getUserByEmail, getGroupById } from '../utils/test-helpers'
import { loginUser, insertTransactions } from '../utils/demo-helpers'

test.describe('Scenario 12: Ratio Update Impact', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `ratio-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Ratio User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should recalculate settlement when ratio changes', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Ratio Update Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await insertTransactions(groupId, userA.id!, [
      { date: '2025-12-01', amount: 60000, description: 'Rent', payer_type: 'UserA', expense_type: 'Household' },
      { date: '2025-12-05', amount: 40000, description: 'Utilities', payer_type: 'UserB', expense_type: 'Household' },
    ])

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    const monthSelect = page.locator('select[name="settlement-month"]')
    await monthSelect.selectOption('2025-12')
    await page.waitForTimeout(1000)

    const initialSettlement = await page.locator('.bg-white.rounded-lg.shadow').first().textContent()

    await page.goto('/settings')

    const ratioInput = page.locator('input[name="ratioA"]')
    await ratioInput.fill('70')

    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const updatedGroup = await getGroupById(groupId)
    expect(updatedGroup?.ratio_a).toBe(70)
    expect(updatedGroup?.ratio_b).toBe(30)

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    await page.locator('select[name="settlement-month"]').selectOption('2025-12')
    await page.waitForTimeout(1000)

    const updatedSettlement = await page.locator('.bg-white.rounded-lg.shadow').first().textContent()
    expect(updatedSettlement).not.toBe(initialSettlement)
  })
})
