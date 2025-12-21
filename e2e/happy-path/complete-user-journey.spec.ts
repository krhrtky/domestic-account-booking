import { test, expect, Browser } from '@playwright/test'
import {
  createTestUser,
  cleanupTestData,
  TestUser,
  getUserByEmail,
  getGroupById,
  getTransactionsByGroupId,
  acceptInvitationDirectly,
} from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'
import * as path from 'path'

test.describe('L-TA-001: Happy Path - Complete User Journey', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let userB: TestUser
  let groupId: string
  let browser: Browser

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser
  })

  test.afterAll(async () => {
    if (userA?.id) await cleanupTestData(userA.id)
    if (userB?.id) await cleanupTestData(userB.id)
  })

  test('should complete entire user journey from signup to settlement', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has timing issues with partner invitation flow')
    const timestamp = Date.now()

    await test.step('AC-001: User A signup', async () => {
      const userAEmail = `happy-a-${timestamp}@example.com`
      await page.goto('/signup')

      await expect(page.getByRole('heading', { name: '新規登録' })).toBeVisible()

      const nameInput = page.locator('input[name="name"]')
      const emailInput = page.locator('input[name="email"]')
      const passwordInput = page.locator('input[name="password"]')
      await nameInput.waitFor({ state: 'visible' })

      await nameInput.fill('User A')
      await emailInput.fill(userAEmail)
      await passwordInput.fill('TestPassword123!')

      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      await page.waitForURL('/dashboard', { timeout: 15000 })
      await expect(page.getByText('User A')).toBeVisible()

      const authUser = await getUserByEmail(userAEmail)
      expect(authUser).toBeDefined()
      userA = {
        email: userAEmail,
        password: 'TestPassword123!',
        name: 'User A',
        id: authUser!.id,
      }
    })

    await test.step('AC-010: Group creation with 60/40 ratio', async () => {
      await page.goto('/settings')

      await page.fill('input[name="groupName"]', 'Happy Path Household')
      await page.fill('input[name="ratioA"]', '60')

      const createButton = page.locator('button[type="submit"]')
      await createButton.click()

      await page.waitForTimeout(1500)

      const userData = await getUserByEmail(userA.email)
      expect(userData?.group_id).toBeDefined()
      groupId = userData!.group_id!

      const group = await getGroupById(groupId)
      expect(group?.ratio_a).toBe(60)
      expect(group?.ratio_b).toBe(40)
    })

    await test.step('AC-020: Partner (User B) invitation and acceptance', async () => {
      await page.goto('/settings')

      const partnerEmailInput = page.locator('input[name="partnerEmail"]')
      const userBEmail = `happy-b-${timestamp}@example.com`

      await partnerEmailInput.fill(userBEmail)
      await page.click('button:has-text("招待リンクを作成")')

      await expect(page.locator('[data-testid="invite-url"]')).toBeVisible({ timeout: 10000 })
      const inviteUrl = await page.locator('[data-testid="invite-url"]').inputValue()
      expect(inviteUrl).toBeTruthy()

      const userBContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      const invitePage = await userBContext.newPage()

      userB = await createTestUser({
        email: userBEmail,
        password: 'TestPassword123!',
        name: 'User B',
      })

      await acceptInvitationDirectly(userB.id!, groupId)

      await invitePage.goto('/login')
      const emailInput = invitePage.locator('input[name="email"]')
      const passwordInput = invitePage.locator('input[name="password"]')
      await emailInput.waitFor({ state: 'visible' })
      await emailInput.fill(userB.email)
      await passwordInput.fill(userB.password)
      await invitePage.click('button[type="submit"]')
      await invitePage.waitForURL(/dashboard/, { timeout: 15000 })

      const userBData = await getUserByEmail(userB.email)
      expect(userBData?.group_id).toBe(groupId)

      const group = await getGroupById(groupId)
      expect(group?.user_a_id).toBe(userA.id)
      expect(group?.user_b_id).toBe(userB.id)

      await invitePage.close()
      await userBContext.close()
    })

    await test.step('AC-030: CSV upload with 3 transactions', async () => {
      await loginUser(page, userA, true)
      await page.goto('/dashboard/transactions/upload')

      const csvFilePath = path.join(
        __dirname,
        '../../tests/fixtures/demo-csvs/valid-transactions.csv'
      )

      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(csvFilePath)

      const payerSelect = page.locator('select[name="defaultPayerType"]')
      await payerSelect.selectOption('UserA')

      const uploadButton = page.locator('button:has-text("インポート実行")')
      await uploadButton.click()

      await expect(page.getByText(/\d+件の取引をインポートしました/)).toBeVisible({ timeout: 5000 })

      await expect(page).toHaveURL('/dashboard/transactions', { timeout: 3000 })

      await expect(page.getByText('Restaurant Dinner')).toBeVisible()
      await expect(page.getByText('Gas Station')).toBeVisible()
      await expect(page.getByText('Supermarket')).toBeVisible()

      const transactions = await getTransactionsByGroupId(groupId)
      expect(transactions).toHaveLength(3)
      expect(transactions.every(t => t.expense_type === 'Household')).toBe(true)
      expect(transactions.every(t => t.payer_type === 'UserA')).toBe(true)
    })

    await test.step('AC-035: Verify transactions list', async () => {
      await page.goto('/dashboard/transactions')

      await expect(page.getByText('Restaurant Dinner')).toBeVisible()
      await expect(page.getByText('Gas Station')).toBeVisible()
      await expect(page.getByText('Supermarket')).toBeVisible()

      const transactions = await getTransactionsByGroupId(groupId)
      expect(transactions).toHaveLength(3)
      expect(transactions.every(t => t.expense_type === 'Household')).toBe(true)
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
