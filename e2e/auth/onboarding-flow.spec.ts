import { test, expect } from '@playwright/test'
import {
  generateTestEmail,
  cleanupTestData,
  getAuthUserByEmail,
  getUserByEmail,
  getGroupById,
} from '../utils/test-helpers'

test.describe('User Onboarding Flow - Signup to Group Creation', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let testEmail: string
  let userId: string

  test.beforeEach(() => {
    testEmail = generateTestEmail()
  })

  test.afterEach(async () => {
    if (userId) {
      await cleanupTestData(userId)
    }
  })

  test.skip('should complete full onboarding flow from signup to group creation', async ({ page, browserName }) => {
    await page.goto('/login')

    await page.click('a[href="/signup"]')
    await expect(page).toHaveURL(/\/signup/)

    const nameInput = page.locator('input[name="name"]')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    const submitButton = page.locator('button[type="submit"]')
    await nameInput.waitFor({ state: 'visible' })

    if (browserName === 'webkit') {
      await nameInput.click()
      await nameInput.pressSequentially('Demo User A', { delay: 10 })
      await emailInput.click()
      await emailInput.pressSequentially(testEmail, { delay: 10 })
      await passwordInput.click()
      await passwordInput.pressSequentially('TestPassword123!', { delay: 10 })
    } else {
      await nameInput.click()
      await nameInput.fill('Demo User A')
      await emailInput.click()
      await emailInput.fill(testEmail)
      await passwordInput.click()
      await passwordInput.fill('TestPassword123!')
    }

    await submitButton.waitFor({ state: 'visible' })
    await Promise.all([
      page.waitForURL('/dashboard', { timeout: 15000 }),
      submitButton.click(),
    ])

    await expect(page.getByText('Welcome')).toBeVisible()

    const authUser = await getAuthUserByEmail(testEmail)
    expect(authUser).toBeDefined()
    userId = authUser!.id

    await page.goto('/settings')

    const groupNameInput = page.locator('input[name="groupName"]')
    await expect(groupNameInput).toBeVisible()

    await groupNameInput.fill('Test Household')

    const ratioInput = page.locator('input[name="ratioA"]')
    await ratioInput.fill('60')

    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(testEmail)
    expect(userData?.group_id).toBeTruthy()

    const groupData = await getGroupById(userData!.group_id!)
    expect(groupData?.user_a_id).toBe(userId)
    expect(groupData?.user_b_id).toBeNull()
    expect(groupData?.ratio_a).toBe(60)
    expect(groupData?.ratio_b).toBe(40)
    expect(groupData!.ratio_a + groupData!.ratio_b).toBe(100)
  })
})
