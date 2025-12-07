import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, supabaseAdmin } from '../utils/test-helpers'
import { loginUser, insertTransaction } from '../utils/demo-helpers'

test.describe('Scenario 5: Transaction Classification', () => {
  let userA: TestUser
  let groupId: string
  let transactionId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `classify-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Classify User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should toggle transaction expense type', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Classify Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('group_id')
      .eq('id', userA.id!)
      .single()

    groupId = userData!.group_id

    const { data: insertedData } = await supabaseAdmin
      .from('transactions')
      .insert({
        group_id: groupId,
        user_id: userA.id!,
        date: '2025-12-07',
        amount: 12000,
        description: 'Clothing Store',
        payer_type: 'UserA',
        expense_type: 'Household',
      })
      .select()
      .single()

    transactionId = insertedData!.id

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    const clothingRow = page.locator('tr', { hasText: 'Clothing Store' })
    const toggleButton = clothingRow.locator('[data-testid="expense-type-toggle"]')
    await expect(toggleButton).toContainText('Household')

    await toggleButton.click()
    await page.waitForTimeout(500)

    await expect(toggleButton).toContainText('Personal')

    const { data: updatedTransaction } = await supabaseAdmin
      .from('transactions')
      .select('expense_type')
      .eq('id', transactionId)
      .single()

    expect(updatedTransaction?.expense_type).toBe('Personal')

    await toggleButton.click()
    await page.waitForTimeout(500)
    await expect(toggleButton).toContainText('Household')
  })
})
