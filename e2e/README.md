# E2E Tests

End-to-end tests using Playwright for the Domestic Account Booking application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

3. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Set required Supabase credentials
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set for test user management

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests with UI mode
```bash
npm run test:e2e:ui
```

### Debug tests
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test e2e/auth/login.spec.ts
```

## Test Structure

```
e2e/
├── auth/
│   ├── login.spec.ts       # Login flow tests
│   └── signup.spec.ts      # Signup flow tests
├── settlement/
│   └── dashboard.spec.ts   # Settlement dashboard tests
├── utils/
│   └── test-helpers.ts     # Shared test utilities
└── README.md
```

## Test Helpers

- `createTestUser()` - Creates a test user in Supabase
- `deleteTestUser()` - Deletes a test user
- `cleanupTestData()` - Removes all test data for a user
- `generateTestEmail()` - Generates a unique test email address

## CI/CD

E2E tests run automatically on:
- Push to main/master branch
- Pull requests to main/master branch

GitHub Actions workflow: `.github/workflows/e2e.yml`

## Notes

- Tests use Supabase service role key for admin operations
- Test users are automatically cleaned up after each test suite
- Tests run against a local development server (started automatically)
- Only Chromium browser is used to optimize CI performance
