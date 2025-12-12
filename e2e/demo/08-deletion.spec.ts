import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, getUserByEmail } from '../utils/test-helpers'
import { loginUser, insertTransaction } from '../utils/demo-helpers'

test.describe('Scenario 8: Transaction Deletion', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `delete-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Delete User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should delete transaction with confirmation', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Delete Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)

    groupId = userData!.group_id!

    await insertTransaction(groupId, userA.id!, {
      date: '2025-12-01',
      amount: 5000,
      description: 'Test Delete Transaction',
      payer_type: 'UserA',
      expense_type: 'Household',
    })

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    await expect(page.getByText('Test Delete Transaction')).toBeVisible()

    const deleteButton = page.locator('[data-testid="transaction-delete-btn"]').first()

    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm')
      await dialog.dismiss()
    })
    await deleteButton.click()
    await page.waitForTimeout(500)

    await expect(page.getByText('Test Delete Transaction')).toBeVisible()

    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm')
      await dialog.accept()
    })
    await deleteButton.click()
    await page.waitForTimeout(1000)

    await expect(page.getByText('Test Delete Transaction')).not.toBeVisible()

    await page.reload()
    await page.waitForTimeout(1000)
    await expect(page.getByText('Test Delete Transaction')).not.toBeVisible()
  })
})
