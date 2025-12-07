import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, supabaseAdmin } from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'

test.describe('Scenario 2: Partner Invitation & Group Joining', () => {
  let userA: TestUser
  let userB: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `invite-a-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'User A',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
    if (userB?.id) await cleanupTestData(userB.id)
  })

  test('should allow partner invitation and group joining', async ({ page, context }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Shared Household')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('group_id')
      .eq('id', userA.id!)
      .single()

    groupId = userData!.group_id

    await page.goto('/settings')

    const partnerEmailInput = page.locator('input[name="partnerEmail"]')
    const timestamp = Date.now()
    const partnerEmail = `invite-b-${timestamp}@example.com`
    
    await partnerEmailInput.fill(partnerEmail)
    await page.click('button:has-text("Invite Partner")')
    await page.waitForTimeout(1000)

    const inviteUrl = await page.locator('[data-testid="invite-url"]').textContent()
    expect(inviteUrl).toBeTruthy()
    
    const invitePage = await context.newPage()
    await invitePage.goto('/signup')
    
    userB = await createTestUser({
      email: partnerEmail,
      password: 'TestPassword123!',
      name: 'User B',
    })

    await invitePage.goto(inviteUrl!)
    await expect(invitePage.getByText('Accept Invitation')).toBeVisible()
    
    await invitePage.click('button:has-text("Accept")')
    await expect(invitePage).toHaveURL('/dashboard', { timeout: 10000 })

    const { data: userBData } = await supabaseAdmin
      .from('users')
      .select('group_id')
      .eq('id', userB.id!)
      .single()

    expect(userBData?.group_id).toBe(groupId)

    const { data: groupData } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    expect(groupData?.user_a_id).toBe(userA.id)
    expect(groupData?.user_b_id).toBe(userB.id)

    await page.reload()
    await expect(page.getByText('User B')).toBeVisible()

    await invitePage.close()
  })
})
