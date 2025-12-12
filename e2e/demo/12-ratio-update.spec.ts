import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, getUserByEmail, getGroupById } from '../utils/test-helpers'
import { loginUser, insertTransactions, revalidateCache } from '../utils/demo-helpers'

const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const getDateInCurrentMonth = (day: number) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  return `${year}-${month}-${dayStr}`
}

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

    const currentMonth = getCurrentMonth()

    await insertTransactions(groupId, userA.id!, [
      { date: getDateInCurrentMonth(1), amount: 60000, description: 'Rent', payer_type: 'UserA', expense_type: 'Household' },
      { date: getDateInCurrentMonth(5), amount: 40000, description: 'Utilities', payer_type: 'UserB', expense_type: 'Household' },
    ])

    await revalidateCache(groupId, currentMonth)

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const monthSelector = page.locator('select')
    if (await monthSelector.isVisible()) {
      await monthSelector.selectOption(currentMonth)
      await page.waitForTimeout(1000)
    }

    await page.waitForTimeout(2000)

    await expect(page.locator('[data-testid="settlement-summary"]')).toBeVisible({ timeout: 15000 })

    const initialSettlement = await page.locator('[data-testid="settlement-summary"]').textContent()

    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const slider = page.locator('input#ratioA')
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = '70'
      el.dispatchEvent(new Event('change', { bubbles: true }))
    })

    await page.getByRole('button', { name: /Save Changes/i }).click()
    await page.waitForTimeout(1000)

    const updatedGroup = await getGroupById(groupId)
    expect(updatedGroup?.ratio_a).toBe(70)
    expect(updatedGroup?.ratio_b).toBe(30)

    await revalidateCache(groupId, currentMonth)

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const monthSelector2 = page.locator('select')
    if (await monthSelector2.isVisible()) {
      await monthSelector2.selectOption(currentMonth)
      await page.waitForTimeout(1000)
    }

    await page.waitForTimeout(2000)

    await expect(page.locator('[data-testid="settlement-summary"]')).toBeVisible({ timeout: 15000 })

    const updatedSettlement = await page.locator('[data-testid="settlement-summary"]').textContent()
    expect(updatedSettlement).not.toBe(initialSettlement)
  })
})
