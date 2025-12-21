import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Decimal } from '@prisma/client/runtime/library'

// Local type definitions matching database constraints
type PayerType = 'UserA' | 'UserB' | 'Common'
type ExpenseType = 'Household' | 'Personal'

const prisma = new PrismaClient()

const TEST_USERS = {
  userA: {
    email: 'demo-a@example.com',
    password: 'Password123!',
    name: 'デモユーザーA',
  },
  userB: {
    email: 'demo-b@example.com',
    password: 'Password123!',
    name: 'デモユーザーB',
  },
}

const DEMO_GROUP = {
  name: 'デモ家計グループ',
  ratioA: 60,
  ratioB: 40,
}

const DEMO_TRANSACTIONS = [
  { date: '2025-12-01', amount: 150000, description: '家賃', payer_type: 'UserA' as PayerType, expense_type: 'Household' as ExpenseType },
  { date: '2025-12-02', amount: 8500, description: 'スーパー買い物', payer_type: 'UserA' as PayerType, expense_type: 'Household' as ExpenseType },
  { date: '2025-12-03', amount: 12000, description: 'インターネット', payer_type: 'UserB' as PayerType, expense_type: 'Household' as ExpenseType },
  { date: '2025-12-05', amount: 3200, description: '電気代', payer_type: 'UserA' as PayerType, expense_type: 'Household' as ExpenseType },
  { date: '2025-12-07', amount: 4500, description: 'ガス代', payer_type: 'UserB' as PayerType, expense_type: 'Household' as ExpenseType },
  { date: '2025-12-10', amount: 6800, description: '外食（ディナー）', payer_type: 'UserA' as PayerType, expense_type: 'Household' as ExpenseType },
  { date: '2025-12-12', amount: 2500, description: 'コンビニ', payer_type: 'UserB' as PayerType, expense_type: 'Household' as ExpenseType },
  { date: '2025-12-15', amount: 25000, description: '家具購入', payer_type: 'UserB' as PayerType, expense_type: 'Household' as ExpenseType },
  { date: '2025-12-18', amount: 5000, description: '本（個人）', payer_type: 'UserA' as PayerType, expense_type: 'Personal' as ExpenseType },
  { date: '2025-12-20', amount: 3500, description: '趣味（個人）', payer_type: 'UserB' as PayerType, expense_type: 'Personal' as ExpenseType },
]

async function cleanup() {
  console.log('Cleaning up existing demo data...')

  // Find existing auth users by email
  const existingAuthUsers = await prisma.authUser.findMany({
    where: {
      email: {
        in: [TEST_USERS.userA.email, TEST_USERS.userB.email]
      }
    }
  })

  for (const authUser of existingAuthUsers) {
    // Delete transactions first
    await prisma.transaction.deleteMany({
      where: { userId: authUser.id }
    })

    // Delete invitations
    await prisma.invitation.deleteMany({
      where: { inviterId: authUser.id }
    })

    // Delete groups where user is user_a or user_b
    await prisma.group.deleteMany({
      where: {
        OR: [
          { userAId: authUser.id },
          { userBId: authUser.id }
        ]
      }
    })

    // Delete application user
    await prisma.user.deleteMany({
      where: { id: authUser.id }
    })

    // Delete auth user
    await prisma.authUser.delete({
      where: { id: authUser.id }
    })
  }

  console.log('✓ Cleanup complete')
}

async function seed() {
  console.log('Creating demo users...')
  const passwordHashA = await bcrypt.hash(TEST_USERS.userA.password, 12)
  const passwordHashB = await bcrypt.hash(TEST_USERS.userB.password, 12)

  // Create auth users and application users in transaction
  const result = await prisma.$transaction(async (tx: typeof prisma) => {
    // Create auth users
    const authUserA = await tx.authUser.create({
      data: {
        email: TEST_USERS.userA.email,
        passwordHash: passwordHashA
      }
    })

    const authUserB = await tx.authUser.create({
      data: {
        email: TEST_USERS.userB.email,
        passwordHash: passwordHashB
      }
    })

    // Create application users
    await tx.user.create({
      data: {
        id: authUserA.id,
        name: TEST_USERS.userA.name,
        email: TEST_USERS.userA.email
      }
    })

    await tx.user.create({
      data: {
        id: authUserB.id,
        name: TEST_USERS.userB.name,
        email: TEST_USERS.userB.email
      }
    })

    console.log(`✓ User A created: ${TEST_USERS.userA.email}`)
    console.log(`✓ User B created: ${TEST_USERS.userB.email}`)

    // Create group
    console.log('Creating demo group...')
    const group = await tx.group.create({
      data: {
        name: DEMO_GROUP.name,
        ratioA: DEMO_GROUP.ratioA,
        ratioB: DEMO_GROUP.ratioB,
        userAId: authUserA.id,
        userBId: authUserB.id
      }
    })

    // Update users with group_id
    await tx.user.update({
      where: { id: authUserA.id },
      data: { groupId: group.id }
    })

    await tx.user.update({
      where: { id: authUserB.id },
      data: { groupId: group.id }
    })

    console.log(`✓ Group created: ${DEMO_GROUP.name} (${DEMO_GROUP.ratioA}:${DEMO_GROUP.ratioB})`)

    // Create transactions
    console.log('Creating demo transactions...')
    for (const txData of DEMO_TRANSACTIONS) {
      const userId = txData.payer_type === 'UserA' ? authUserA.id : authUserB.id
      await tx.transaction.create({
        data: {
          userId,
          groupId: group.id,
          date: new Date(txData.date),
          amount: new Decimal(txData.amount),
          description: txData.description,
          payerType: txData.payer_type,
          expenseType: txData.expense_type
        }
      })
    }

    console.log(`✓ ${DEMO_TRANSACTIONS.length} transactions created`)

    return { userAId: authUserA.id, userBId: authUserB.id, groupId: group.id }
  })

  console.log('\n========================================')
  console.log('Demo data seeded successfully!')
  console.log('========================================')
  console.log('\nLogin credentials:')
  console.log(`  User A: ${TEST_USERS.userA.email} / ${TEST_USERS.userA.password}`)
  console.log(`  User B: ${TEST_USERS.userB.email} / ${TEST_USERS.userB.password}`)
  console.log('\nSettlement Summary (December 2025):')
  const householdA = DEMO_TRANSACTIONS.filter(t => t.expense_type === 'Household' && t.payer_type === 'UserA').reduce((s, t) => s + t.amount, 0)
  const householdB = DEMO_TRANSACTIONS.filter(t => t.expense_type === 'Household' && t.payer_type === 'UserB').reduce((s, t) => s + t.amount, 0)
  const total = householdA + householdB
  const balanceA = Math.round(householdA - total * (DEMO_GROUP.ratioA / 100))
  console.log(`  User A paid (Household): ¥${householdA.toLocaleString()}`)
  console.log(`  User B paid (Household): ¥${householdB.toLocaleString()}`)
  console.log(`  Total Household: ¥${total.toLocaleString()}`)
  console.log(`  Balance: ${balanceA > 0 ? 'User B → User A' : 'User A → User B'} ¥${Math.abs(balanceA).toLocaleString()}`)
}

async function main() {
  try {
    await cleanup()
    await seed()
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
