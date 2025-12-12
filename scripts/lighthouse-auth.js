const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const TIMEOUT_MS = 30000

setTimeout(() => {
  console.error('Error: Script timeout after 30s')
  process.exit(1)
}, TIMEOUT_MS)

const databaseUrl = process.env.DATABASE_URL
const nextAuthSecret = process.env.NEXTAUTH_SECRET

console.error('[DEBUG] Environment check:')
console.error(`[DEBUG] DATABASE_URL: ${databaseUrl ? 'set (length: ' + databaseUrl.length + ')' : 'not set'}`)
console.error(`[DEBUG] NEXTAUTH_SECRET: ${nextAuthSecret ? 'set (length: ' + nextAuthSecret.length + ')' : 'not set'}`)

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is required')
  process.exit(1)
}

if (!nextAuthSecret) {
  console.error('Error: NEXTAUTH_SECRET environment variable is required')
  process.exit(1)
}

console.error('[DEBUG] Initializing connection pool...')
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 1000,
})

async function createTestSession() {
  console.error('[DEBUG] Acquiring database connection...')
  const client = await pool.connect()
  console.error('[DEBUG] Database connection acquired')

  try {
    const testEmail = 'lighthouse-test@example.com'
    const testPassword = 'LighthouseTest123!'
    const testName = 'Lighthouse Test User'

    console.error('[DEBUG] Starting transaction...')
    await client.query('BEGIN')

    console.error('[DEBUG] Cleaning up existing test user...')
    await client.query('DELETE FROM users WHERE email = $1', [testEmail])
    await client.query('DELETE FROM auth.users WHERE email = $1', [testEmail])

    console.error('[DEBUG] Hashing password...')
    const passwordHash = await bcrypt.hash(testPassword, 12)

    console.error('[DEBUG] Creating auth.users record...')
    const authResult = await client.query(
      'INSERT INTO auth.users (id, email, password_hash) VALUES (uuid_generate_v4(), $1, $2) RETURNING id',
      [testEmail.toLowerCase(), passwordHash]
    )

    const userId = authResult.rows[0].id
    console.error(`[DEBUG] Created auth user with ID: ${userId}`)

    console.error('[DEBUG] Creating users record...')
    await client.query(
      'INSERT INTO users (id, name, email) VALUES ($1, $2, $3)',
      [userId, testName, testEmail.toLowerCase()]
    )

    console.error('[DEBUG] Committing transaction...')
    await client.query('COMMIT')

    console.error('[DEBUG] Generating JWT token...')
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

    console.error('[DEBUG] Session created successfully')
    console.log(`next-auth.session-token=${token}`)
  } catch (error) {
    console.error('[DEBUG] Error occurred, rolling back transaction...')
    await client.query('ROLLBACK').catch((rollbackError) => {
      console.error('[DEBUG] Rollback error:', rollbackError)
    })
    console.error('[ERROR] Failed to create test session:', error.message)
    console.error('[ERROR] Error stack:', error.stack)
    process.exit(1)
  } finally {
    console.error('[DEBUG] Releasing database connection...')
    client.release()
    console.error('[DEBUG] Closing connection pool...')
    await pool.end()
    console.error('[DEBUG] Script completed')
  }
}

console.error('[DEBUG] Starting createTestSession...')
createTestSession()
  .then(() => {
    console.error('[DEBUG] Script exiting successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[FATAL] Unhandled error in createTestSession:', error)
    process.exit(1)
  })
