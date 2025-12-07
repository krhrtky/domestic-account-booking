# E2E Demo Test Suite - Code Implementation Highlights

## Key Code Snippets

### 1. Demo Helpers - Login Function
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/utils/demo-helpers.ts`

```typescript
export const loginUser = async (page: Page, user: TestUser) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard', { timeout: 10000 })
}
```

### 2. Demo Helpers - Transaction Insertion
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/utils/demo-helpers.ts`

```typescript
export const insertTransactions = async (
  groupId: string,
  userId: string,
  transactions: DemoTransaction[]
): Promise<void> => {
  const records = transactions.map((t) => ({
    group_id: groupId,
    user_id: userId,
    date: t.date,
    amount: t.amount,
    description: t.description,
    payer_type: t.payer_type,
    expense_type: t.expense_type,
  }))

  const { error } = await supabaseAdmin.from('transactions').insert(records)
  if (error) throw error
}
```

### 3. Pagination Test Pattern
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/07-pagination.spec.ts`

```typescript
test('should paginate large transaction lists', async ({ page }) => {
  await insertTransactions(groupId, userA.id!, paginationTransactions(75))

  await page.goto('/dashboard/transactions')
  await page.waitForTimeout(2000)

  const transactionRows = page.locator('[data-testid="transaction-row"]')
  const initialCount = await transactionRows.count()
  expect(initialCount).toBeLessThanOrEqual(50)

  const loadMoreButton = page.locator('button:has-text("Load More")')
  await expect(loadMoreButton).toBeVisible()

  await loadMoreButton.click()
  await page.waitForTimeout(1000)

  const updatedCount = await transactionRows.count()
  expect(updatedCount).toBeGreaterThan(initialCount)
})
```

### 4. Settlement Equal Ratio Test
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/09-settlement-equal.spec.ts`

```typescript
test('should calculate settlement with 50/50 ratio correctly', async ({ page }) => {
  await insertTransactions(groupId, userA.id!, [
    { date: '2025-12-01', amount: 30000, description: 'Rent', 
      payer_type: 'UserA', expense_type: 'Household' },
    { date: '2025-12-05', amount: 30000, description: 'Utilities', 
      payer_type: 'UserA', expense_type: 'Household' },
    { date: '2025-12-10', amount: 20000, description: 'Groceries', 
      payer_type: 'UserB', expense_type: 'Household' },
    { date: '2025-12-15', amount: 10000, description: 'Hobby', 
      payer_type: 'UserA', expense_type: 'Personal' },
  ])

  await page.goto('/dashboard')
  const monthSelect = page.locator('select[name="month"]')
  await monthSelect.selectOption('2025-12')
  
  // Total household: 80,000 (30k + 30k + 20k, excluding 10k personal)
  await expect(page.getByText('80,000')).toBeVisible()
  
  // UserA paid 60,000, UserB paid 20,000
  await expect(page.getByText('60,000')).toBeVisible()
  await expect(page.getByText('20,000')).toBeVisible()
  
  // Settlement: UserB owes UserA 20,000
  await expect(page.getByText('UserB owes UserA')).toBeVisible()
})
```

### 5. Multi-User Invitation Test
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/02-partner-invitation.spec.ts`

```typescript
test('should allow partner invitation and group joining', async ({ page, context }) => {
  await loginUser(page, userA)
  await page.goto('/settings')

  // Create invitation
  const partnerEmailInput = page.locator('input[name="partnerEmail"]')
  await partnerEmailInput.fill(partnerEmail)
  await page.click('button:has-text("Invite Partner")')
  
  const inviteUrl = await page.locator('[data-testid="invite-url"]').textContent()

  // Create User B in separate context
  const invitePage = await context.newPage()
  userB = await createTestUser({
    email: partnerEmail,
    password: 'TestPassword123!',
    name: 'User B',
  })

  // Accept invitation
  await invitePage.goto(inviteUrl!)
  await invitePage.click('button:has-text("Accept")')
  await expect(invitePage).toHaveURL('/dashboard', { timeout: 10000 })

  // Verify both users in same group
  const { data: userBData } = await supabaseAdmin
    .from('users')
    .select('group_id')
    .eq('id', userB.id!)
    .single()

  expect(userBData?.group_id).toBe(groupId)
})
```

### 6. CSV Upload Test
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/04-csv-upload.spec.ts`

```typescript
test('should upload CSV and import transactions', async ({ page }) => {
  await page.goto('/dashboard/transactions/upload')

  const csvFilePath = path.join(
    __dirname,
    '../../tests/fixtures/demo-csvs/valid-transactions.csv'
  )

  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(csvFilePath)

  const payerSelect = page.locator('select[name="payerType"]')
  await payerSelect.selectOption('UserA')

  const uploadButton = page.locator('button:has-text("Upload")')
  await uploadButton.click()

  await expect(page).toHaveURL('/dashboard/transactions', { timeout: 10000 })

  // Verify all transactions imported
  await expect(page.getByText('Restaurant Dinner')).toBeVisible()
  await expect(page.getByText('Gas Station')).toBeVisible()
  await expect(page.getByText('Supermarket')).toBeVisible()

  // Database verification
  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('group_id', groupId)

  expect(transactions).toHaveLength(3)
  expect(transactions?.every(t => t.payer_type === 'UserA')).toBe(true)
})
```

### 7. Error Handling Test
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/14-error-handling.spec.ts`

```typescript
test('should show error for duplicate email signup', async ({ page }) => {
  const existingUser = await createTestUser({
    email: `existing-${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: 'Existing User',
  })

  await page.goto('/signup')
  await page.fill('input[name="name"]', 'New User')
  await page.fill('input[name="email"]', existingUser.email)
  await page.fill('input[name="password"]', 'TestPassword123!')

  const dialogPromise = page.waitForEvent('dialog')
  await page.click('button[type="submit"]')

  const dialog = await dialogPromise
  expect(dialog.message()).toContain('already')
  await dialog.accept()

  if (existingUser.id) await cleanupTestData(existingUser.id)
})
```

### 8. Edge Case - Zero Transactions
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/15-edge-cases.spec.ts`

```typescript
test('should handle zero transactions gracefully', async ({ page }) => {
  await loginUser(page, userA)
  await page.goto('/settings')

  await page.fill('input[name="groupName"]', 'Empty Group')
  await page.fill('input[name="ratioA"]', '50')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1000)

  await page.goto('/dashboard')
  await page.waitForTimeout(1000)

  await expect(page.getByText(/0|no transactions/i)).toBeVisible()
})
```

### 9. Filtering Test
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/06-filtering.spec.ts`

```typescript
test('should filter transactions by month, payer, and type', async ({ page }) => {
  await insertTransactions(groupId, userA.id!, [
    { date: '2025-12-01', amount: 5000, description: 'Dec UserA Household', 
      payer_type: 'UserA', expense_type: 'Household' },
    { date: '2025-12-05', amount: 3000, description: 'Dec UserB Household', 
      payer_type: 'UserB', expense_type: 'Household' },
    { date: '2025-12-10', amount: 2000, description: 'Dec UserA Personal', 
      payer_type: 'UserA', expense_type: 'Personal' },
    { date: '2025-11-15', amount: 4000, description: 'Nov UserA Household', 
      payer_type: 'UserA', expense_type: 'Household' },
  ])

  await page.goto('/dashboard/transactions')

  // Filter by month
  const monthSelect = page.locator('select[name="month"]')
  await monthSelect.selectOption('2025-12')
  await expect(page.getByText('Dec UserA Household')).toBeVisible()
  await expect(page.getByText('Nov UserA Household')).not.toBeVisible()

  // Filter by expense type
  const expenseTypeFilter = page.locator('select[name="expenseType"]')
  await expenseTypeFilter.selectOption('Household')
  await expect(page.getByText('Dec UserA Personal')).not.toBeVisible()

  // Filter by payer
  const payerFilter = page.locator('select[name="payerType"]')
  await payerFilter.selectOption('UserA')
  await expect(page.getByText('Dec UserB Household')).not.toBeVisible()
})
```

### 10. Test Data Generator
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/fixtures/demo-data.ts`

```typescript
export const paginationTransactions = (count: number): DemoTransaction[] => {
  const transactions: DemoTransaction[] = []
  for (let i = 0; i < count; i++) {
    transactions.push({
      date: '2025-12-01',
      amount: 1000 + i * 100,
      description: 'Transaction ' + (i + 1).toString().padStart(3, '0'),
      payer_type: i % 2 === 0 ? 'UserA' : 'UserB',
      expense_type: 'Household',
    })
  }
  return transactions
}
```

## Test Structure Pattern

All tests follow this consistent pattern:

```typescript
import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, supabaseAdmin } from '../utils/test-helpers'
import { loginUser, insertTransactions } from '../utils/demo-helpers'

test.describe('Scenario N: Feature Name', () => {
  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `feature-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Feature User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should demonstrate expected behavior', async ({ page }) => {
    await loginUser(page, userA)
    // Test implementation
    // Assertions
  })
})
```

## CSV Test Data Examples

### Valid Transactions
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/tests/fixtures/demo-csvs/valid-transactions.csv`

```csv
date,description,amount
2025-12-01,Restaurant Dinner,8500
2025-12-02,Gas Station,4200
2025-12-03,Supermarket,12000
```

### Invalid - Missing Columns
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/tests/fixtures/demo-csvs/invalid-missing-columns.csv`

```csv
date,amount
2025-12-01,5000
```

### Special Characters
**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/tests/fixtures/demo-csvs/special-characters.csv`

```csv
date,description,amount
2025-12-01,"Café & Restaurant (50% off!)",3500
2025-12-02,"Test <script>alert('XSS')</script>",1000
```

## Reusable Patterns

### Database Verification Pattern
```typescript
const { data, error } = await supabaseAdmin
  .from('table_name')
  .select('*')
  .eq('column', value)
  .single()

expect(error).toBeNull()
expect(data?.field).toBe(expectedValue)
```

### Dialog Handling Pattern
```typescript
const dialogPromise = page.waitForEvent('dialog')
await page.click('button[type="submit"]')

const dialog = await dialogPromise
expect(dialog.message()).toContain('expected text')
await dialog.accept()
```

### Multi-Page Context Pattern
```typescript
const secondPage = await context.newPage()
await secondPage.goto('/some-url')
await secondPage.click('button')
await secondPage.close()
```

### Cleanup Pattern
```typescript
test.afterAll(async () => {
  if (userId) {
    await cleanupTestData(userId)
  }
})
```
