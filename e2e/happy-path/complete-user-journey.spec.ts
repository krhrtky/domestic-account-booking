import { test, expect } from '@playwright/test'
import {
  TestUser,
  getUserByEmail,
  getGroupById,
} from '../utils/test-helpers'
import { loginUser, DEMO_USERS } from '../utils/demo-helpers'

test.describe('L-TA-001: Happy Path - Complete User Journey', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const userData = await getUserByEmail(DEMO_USERS.userA.email)
    if (!userData) {
      throw new Error('Demo user A not found. Please run seed script first.')
    }
    userA = {
      email: DEMO_USERS.userA.email,
      password: DEMO_USERS.userA.password,
      name: DEMO_USERS.userA.name,
      id: userData.id,
    }
    groupId = userData.group_id!
  })

  test('should complete user journey with login, view transactions and settlement', async ({ page }) => {
    await test.step('AC-001: User A login', async () => {
      await page.goto('/login')

      await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()

      const emailInput = page.locator('input[name="email"]')
      const passwordInput = page.locator('input[name="password"]')
      await emailInput.waitFor({ state: 'visible' })

      await emailInput.fill(userA.email)
      await passwordInput.fill(userA.password)

      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      await page.waitForURL('/dashboard', { timeout: 15000 })
    })

    await test.step('AC-010: Verify group exists with ratio', async () => {
      await page.goto('/settings')

      const group = await getGroupById(groupId)
      expect(group?.ratio_a).toBe(60)
      expect(group?.ratio_b).toBe(40)
    })

    await test.step('AC-035: Verify transactions list', async () => {
      await page.goto('/dashboard/transactions')

      await expect(page.getByRole('heading', { name: '取引一覧' })).toBeVisible({ timeout: 5000 })
    })

    await test.step('AC-045: Settlement calculation display (L-BR-001)', async () => {
      await page.goto('/dashboard')

      await page.waitForSelector('[data-testid="settlement-summary"]', { timeout: 5000 })

      const settlementAmount = await page.locator('[data-testid="settlement-amount"]').textContent()
      expect(settlementAmount).toBeTruthy()
      expect(settlementAmount).toMatch(/¥[\d,]+/)

      const group = await getGroupById(groupId)
      expect(group?.ratio_a).toBe(60)
      expect(group?.ratio_b).toBe(40)
    })

    await test.step('AC-046: Verify settlement summary display', async () => {
      await page.goto('/dashboard')

      await expect(page.getByTestId('settlement-summary')).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('精算サマリー')).toBeVisible()
      await expect(page.getByText(/家計の支出合計/)).toBeVisible()
    })

    await test.step('AC-047: Month navigation', async () => {
      await page.goto('/dashboard')

      const monthSelector = page.getByTestId('month-selector')
      await expect(monthSelector).toBeVisible({ timeout: 5000 })

      const currentMonth = await monthSelector.inputValue()
      expect(currentMonth).toMatch(/\d{4}-\d{2}/)

      const options = await monthSelector.locator('option').allTextContents()
      expect(options.length).toBeGreaterThan(0)

      if (options.length > 1) {
        await monthSelector.selectOption({ index: 1 })
        await page.waitForTimeout(1000)

        const newMonth = await monthSelector.inputValue()
        expect(newMonth).not.toBe(currentMonth)

        await expect(page.getByTestId('settlement-summary')).toBeVisible()
      }
    })

    await test.step('AC-050: Logout', async () => {
      await page.goto('/dashboard')

      const logoutButton = page.locator('button:has-text("ログアウト")')
      await logoutButton.click()

      await page.waitForURL('/', { timeout: 10000 })
      await expect(page.getByRole('link', { name: 'ログイン' })).toBeVisible()

      await page.goto('/dashboard')
      await expect(page).toHaveURL(/login/, { timeout: 5000 })
    })
  })
})
