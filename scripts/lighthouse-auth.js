const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const databaseUrl = process.env.DATABASE_URL
const nextAuthSecret = process.env.NEXTAUTH_SECRET

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is required')
  process.exit(1)
}

if (!nextAuthSecret) {
  console.error('Error: NEXTAUTH_SECRET environment variable is required')
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
})

async function createTestSession() {
  const client = await pool.connect()

  try {
    const testEmail = 'lighthouse-test@example.com'
    const testPassword = 'LighthouseTest123!'
    const testName = 'Lighthouse Test User'

    await client.query('BEGIN')

    await client.query('DELETE FROM users WHERE email = $1', [testEmail])
    await client.query('DELETE FROM auth.users WHERE email = $1', [testEmail])

    const passwordHash = await bcrypt.hash(testPassword, 12)

    const authResult = await client.query(
      'INSERT INTO auth.users (id, email, password_hash) VALUES (gen_random_uuid(), $1, $2) RETURNING id',
      [testEmail.toLowerCase(), passwordHash]
    )

    const userId = authResult.rows[0].id

    await client.query(
      'INSERT INTO users (id, name, email) VALUES ($1, $2, $3)',
      [userId, testName, testEmail.toLowerCase()]
    )

    await client.query('COMMIT')

    const token = jwt.sign(
      {
        id: userId,
        email: testEmail,
        name: testName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
      nextAuthSecret
    )

    console.log(`next-auth.session-token=${token}`)

    await pool.end()
    process.exit(0)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creating test session:', error)
    await pool.end()
    process.exit(1)
  } finally {
    client.release()
  }
}

createTestSession()
