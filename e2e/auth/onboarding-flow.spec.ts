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

  test('should complete full onboarding flow from signup to group creation', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)

    await page.click('a[href="/signup"]')
    await expect(page).toHaveURL(/\/signup/)

    await page.fill('input[name="name"]', 'Demo User A')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')

    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

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
