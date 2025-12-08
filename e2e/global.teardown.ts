import { cleanupTestData, getAuthUserByEmail } from './utils/test-helpers'
import { TEST_USER } from './global.setup'

async function globalTeardown() {
  console.log('\nStarting global E2E test teardown...')

  try {
    const authUser = await getAuthUserByEmail(TEST_USER.email)

    if (authUser?.id) {
      await cleanupTestData(authUser.id)
      console.log(`✓ Test user cleaned up: ${TEST_USER.email} (ID: ${authUser.id})`)
    } else {
      console.log('ℹ No test user found to clean up')
    }

    console.log('✓ Global teardown complete')
  } catch (error) {
    console.error('✗ Global teardown failed:', error)
  }
}

export default globalTeardown
