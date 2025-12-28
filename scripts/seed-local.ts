import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('Missing DATABASE_URL environment variable')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl })

const TEST_USERS = {
  userA: {
    email: process.env.SEED_USER_A_EMAIL || 'demo-a@example.com',
    password: process.env.SEED_USER_A_PASSWORD || 'Password123!',
    name: process.env.SEED_USER_A_NAME || 'デモユーザーA',
  },
  userB: {
    email: process.env.SEED_USER_B_EMAIL || 'demo-b@example.com',
    password: process.env.SEED_USER_B_PASSWORD || 'Password123!',
    name: process.env.SEED_USER_B_NAME || 'デモユーザーB',
  },
}

const DEMO_GROUP = {
  name: 'デモ家計グループ',
  ratioA: 60,
  ratioB: 40,
}

const DEMO_TRANSACTIONS = [
  { date: '2025-12-01', amount: 150000, description: '家賃', payer_type: 'UserA', expense_type: 'Household' },
  { date: '2025-12-02', amount: 8500, description: 'スーパー買い物', payer_type: 'UserA', expense_type: 'Household' },
  { date: '2025-12-03', amount: 12000, description: 'インターネット', payer_type: 'UserB', expense_type: 'Household' },
  { date: '2025-12-05', amount: 3200, description: '電気代', payer_type: 'UserA', expense_type: 'Household' },
  { date: '2025-12-07', amount: 4500, description: 'ガス代', payer_type: 'UserB', expense_type: 'Household' },
  { date: '2025-12-10', amount: 6800, description: '外食（ディナー）', payer_type: 'UserA', expense_type: 'Household' },
  { date: '2025-12-12', amount: 2500, description: 'コンビニ', payer_type: 'UserB', expense_type: 'Household' },
  { date: '2025-12-15', amount: 25000, description: '家具購入', payer_type: 'UserB', expense_type: 'Household' },
  { date: '2025-12-18', amount: 5000, description: '本（個人）', payer_type: 'UserA', expense_type: 'Personal' },
  { date: '2025-12-20', amount: 3500, description: '趣味（個人）', payer_type: 'UserB', expense_type: 'Personal' },
]

async function checkExistingUsers(): Promise<{ userAId?: string; userBId?: string; groupId?: string }> {
  const client = await pool.connect()
  try {
    const userAResult = await client.query<{ id: string; group_id: string | null }>(
      `SELECT u.id, u.group_id FROM custom_auth.users au
       JOIN users u ON au.id = u.id
       WHERE au.email = $1`,
      [TEST_USERS.userA.email]
    )

    const userBResult = await client.query<{ id: string; group_id: string | null }>(
      `SELECT u.id, u.group_id FROM custom_auth.users au
       JOIN users u ON au.id = u.id
       WHERE au.email = $1`,
      [TEST_USERS.userB.email]
    )

    return {
      userAId: userAResult.rows[0]?.id,
      userBId: userBResult.rows[0]?.id,
      groupId: userAResult.rows[0]?.group_id || userBResult.rows[0]?.group_id || undefined,
    }
  } finally {
    client.release()
  }
}

async function seed() {
  const existing = await checkExistingUsers()

  if (existing.userAId && existing.userBId && existing.groupId) {
    console.log('========================================')
    console.log('Demo data already exists - skipping seed')
    console.log('========================================')
    console.log('\nExisting users found:')
    console.log(`  User A: ${TEST_USERS.userA.email}`)
    console.log(`  User B: ${TEST_USERS.userB.email}`)
    console.log(`  Group ID: ${existing.groupId}`)
    console.log('\nLogin credentials:')
    console.log(`  User A: ${TEST_USERS.userA.email} / ${TEST_USERS.userA.password}`)
    console.log(`  User B: ${TEST_USERS.userB.email} / ${TEST_USERS.userB.password}`)
    return
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    let userAId = existing.userAId
    let userBId = existing.userBId
    let groupId = existing.groupId

    if (!userAId) {
      console.log('Creating User A...')
      const passwordHashA = await bcrypt.hash(TEST_USERS.userA.password, 12)

      const authResultA = await client.query<{ id: string }>(
        'INSERT INTO custom_auth.users (id, email, password_hash) VALUES (gen_random_uuid(), $1, $2) RETURNING id',
        [TEST_USERS.userA.email, passwordHashA]
      )
      userAId = authResultA.rows[0].id

      await client.query(
        'INSERT INTO users (id, name, email) VALUES ($1, $2, $3)',
        [userAId, TEST_USERS.userA.name, TEST_USERS.userA.email]
      )
      console.log(`  User A created: ${TEST_USERS.userA.email}`)
    } else {
      console.log(`  User A already exists: ${TEST_USERS.userA.email}`)
    }

    if (!userBId) {
      console.log('Creating User B...')
      const passwordHashB = await bcrypt.hash(TEST_USERS.userB.password, 12)

      const authResultB = await client.query<{ id: string }>(
        'INSERT INTO custom_auth.users (id, email, password_hash) VALUES (gen_random_uuid(), $1, $2) RETURNING id',
        [TEST_USERS.userB.email, passwordHashB]
      )
      userBId = authResultB.rows[0].id

      await client.query(
        'INSERT INTO users (id, name, email) VALUES ($1, $2, $3)',
        [userBId, TEST_USERS.userB.name, TEST_USERS.userB.email]
      )
      console.log(`  User B created: ${TEST_USERS.userB.email}`)
    } else {
      console.log(`  User B already exists: ${TEST_USERS.userB.email}`)
    }

    if (!groupId) {
      console.log('Creating demo group...')
      const groupResult = await client.query<{ id: string }>(
        `INSERT INTO groups (id, name, ratio_a, ratio_b, user_a_id, user_b_id)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING id`,
        [DEMO_GROUP.name, DEMO_GROUP.ratioA, DEMO_GROUP.ratioB, userAId, userBId]
      )
      groupId = groupResult.rows[0].id

      await client.query('UPDATE users SET group_id = $1 WHERE id IN ($2, $3)', [groupId, userAId, userBId])
      console.log(`  Group created: ${DEMO_GROUP.name} (${DEMO_GROUP.ratioA}:${DEMO_GROUP.ratioB})`)

      console.log('Creating demo transactions...')
      for (const tx of DEMO_TRANSACTIONS) {
        const userId = tx.payer_type === 'UserA' ? userAId : userBId
        await client.query(
          `INSERT INTO transactions (id, user_id, group_id, date, amount, description, payer_type, expense_type)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)`,
          [userId, groupId, tx.date, tx.amount, tx.description, tx.payer_type, tx.expense_type]
        )
      }
      console.log(`  ${DEMO_TRANSACTIONS.length} transactions created`)
    } else {
      console.log(`  Group already exists: ${groupId}`)
    }

    await client.query('COMMIT')

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
    console.log(`  Balance: ${balanceA > 0 ? 'User B -> User A' : 'User A -> User B'} ¥${Math.abs(balanceA).toLocaleString()}`)

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function main() {
  try {
    await seed()
  } catch (error) {
    console.error('シード処理に失敗しました:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
