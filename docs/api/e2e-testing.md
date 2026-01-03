# E2E Testing Guide

## Overview

This document provides comprehensive guidance for running End-to-End (E2E) tests in the Domestic Account Booking application. E2E tests verify complete user workflows using Playwright.

## Quick Start

### Prerequisites

- **Docker**: Required for PostgreSQL test database
- **Node.js**: v18+ with npm
- **Port 5433**: Must be available (used by test database)
- **Playwright browsers**: Installed automatically by setup command

### CI Mode (Recommended)

Run all E2E tests in CI mode with automated setup:

```bash
make e2e-ci
```

This command:

1. Starts PostgreSQL container on port 5433
2. Applies all database migrations
3. Creates `.env.local.e2e` with test configuration
4. Installs Playwright browsers (if needed)
5. Runs all E2E test suites
6. Keeps database running for inspection

### Manual Cleanup

After tests complete, clean up resources:

```bash
make e2e-ci-clean
```

## Test Suites

The E2E tests are organized into five categories per L-TA-001 requirements:

### 1. Authentication Tests (`e2e/auth`)

- Login flow validation
- Session management
- Unauthenticated redirects

**Run command:**

```bash
CI=true node --env-file=.env.local.e2e node_modules/.bin/playwright test --project=chromium-unauth e2e/auth
```

### 2. Demo/Typical Tests (`e2e/demo`)

- Happy path user journeys
- Basic CRUD operations
- Standard workflows

**Run command:**

```bash
CI=true node --env-file=.env.local.e2e node_modules/.bin/playwright test --project=chromium e2e/demo
```

### 3. Settlement Tests (`e2e/settlement`)

- Settlement calculation validation (L-BR-001)
- Traceability requirements (L-BR-007)
- Month-by-month verification

**Run command:**

```bash
CI=true node --env-file=.env.local.e2e node_modules/.bin/playwright test --project=chromium e2e/settlement
```

### 4. Accessibility Tests (`e2e/accessibility`)

- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader compatibility

**Run command:**

```bash
CI=true node --env-file=.env.local.e2e node_modules/.bin/playwright test --project=chromium e2e/accessibility
```

### 5. Security Tests (`e2e/security`)

- XSS prevention (L-SC-002)
- CSRF protection (L-SC-005)
- Rate limiting (L-SC-004)
- Authorization checks (L-SC-001)

**Run command:**

```bash
CI=true node --env-file=.env.local.e2e node_modules/.bin/playwright test --project=chromium e2e/security
```

## Step-by-Step Setup

### 1. Start Test Database

```bash
make e2e-ci-db-start
```

**What it does:**

- Removes existing container (if any)
- Starts PostgreSQL 15 on port 5433
- Configures health checks
- Waits for database to be ready

**Verify:**

```bash
docker ps | grep domestic-account-booking-e2e-postgres
```

### 2. Apply Migrations

```bash
make e2e-ci-db-migrate
```

**Migration order (critical):**

1. `004_nextauth_schema.sql` - NextAuth tables
2. `001_initial_schema.sql` - Core schema
3. `002_rls_policies.sql` - Row Level Security
4. `003_transactions_table.sql` - Transactions

**Verify:**

```bash
docker exec domestic-account-booking-e2e-postgres psql -U postgres -d test_db -c "\dt"
```

### 3. Create Environment File

```bash
make e2e-ci-env
```

**Creates `.env.local.e2e` with:**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/test_db
NEXTAUTH_SECRET=test-secret-for-ci-e2e
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
E2E_TEST=true
```

### 4. Install Playwright Browsers

```bash
npx playwright install --with-deps chromium
```

**First run only.** Subsequent runs skip this step.

### 5. Run Tests

```bash
make e2e-ci-run
```

## Local Development Mode

For interactive test development with UI:

### Start Local Environment

```bash
make e2e-local
```

**Includes:**

- Database setup
- Next.js dev server on port 3000
- Playwright UI mode

### Run Specific Test Files

```bash
# With UI
make e2e-local-ui

# Demo tests with UI
make e2e-local-demo-ui
```

### Interactive Debugging

```bash
# Run in headed mode
npx playwright test --headed --project=chromium e2e/settlement

# Debug mode (pause on breakpoints)
npx playwright test --debug e2e/settlement/traceability.spec.ts

# Show browser developer tools
npx playwright test --headed --browser=chromium --devtools e2e/security
```

## Troubleshooting

### Issue: Port 5433 Already in Use

**Symptom:**

```
Error: bind: address already in use
```

**Solution:**

```bash
# Find process using port 5433
lsof -i :5433

# Stop existing container
make e2e-ci-db-stop

# Or kill process
kill -9 <PID>
```

### Issue: Database Connection Fails

**Symptom:**

```
Error: connect ECONNREFUSED 127.0.0.1:5433
```

**Solution:**

```bash
# Check container status
docker ps -a | grep domestic-account-booking-e2e-postgres

# Check container logs
docker logs domestic-account-booking-e2e-postgres

# Restart database
make e2e-ci-db-stop
make e2e-ci-db-start
```

### Issue: Migrations Fail

**Symptom:**

```
ERROR: relation "users" already exists
```

**Solution:**

```bash
# Drop and recreate database
docker exec domestic-account-booking-e2e-postgres psql -U postgres -c "DROP DATABASE test_db;"
docker exec domestic-account-booking-e2e-postgres psql -U postgres -c "CREATE DATABASE test_db;"

# Re-apply migrations
make e2e-ci-db-migrate
```

### Issue: Playwright Browser Not Found

**Symptom:**

```
browserType.launch: Executable doesn't exist
```

**Solution:**

```bash
# Reinstall browsers
npx playwright install --with-deps chromium

# Or with force
npx playwright install --force --with-deps chromium
```

### Issue: Tests Timeout

**Symptom:**

```
Test timeout of 30000ms exceeded
```

**Solution:**

```bash
# Increase timeout in playwright.config.ts
# Or run with custom timeout
npx playwright test --timeout=60000
```

## Environment Variables

### Required Variables

| Variable              | Value                                                   | Purpose                     |
| --------------------- | ------------------------------------------------------- | --------------------------- |
| `DATABASE_URL`        | `postgresql://postgres:postgres@localhost:5433/test_db` | Test database connection    |
| `NEXTAUTH_SECRET`     | `test-secret-for-ci-e2e`                                | Session encryption key      |
| `NEXTAUTH_URL`        | `http://localhost:3000`                                 | NextAuth base URL           |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000`                                 | Public app URL              |
| `E2E_TEST`            | `true`                                                  | Enables test mode behaviors |

### Optional Variables

| Variable             | Default    | Purpose                      |
| -------------------- | ---------- | ---------------------------- |
| `CI`                 | `false`    | Disables interactive prompts |
| `PLAYWRIGHT_BROWSER` | `chromium` | Browser to use               |

## CI/CD Integration

### GitHub Actions Workflow

E2E tests run automatically in GitHub Actions on:

- Push to `master` branch
- Pull requests to `master`

**Workflow file:** `.github/workflows/test-e2e.yml`

**Key steps:**

1. Checkout code
2. Install Node.js dependencies
3. Start PostgreSQL service
4. Run `make e2e-ci`
5. Upload test artifacts (screenshots, videos)

### Local Simulation of CI

```bash
# Run exactly as CI does
CI=true make e2e-ci
```

## Test Data Management

### Seed Data

Test data is created in `e2e/demo/seed.ts`:

- Demo users (User A, User B)
- Sample transactions
- Group memberships

### Data Isolation

Each test suite uses:

- Unique user accounts
- Isolated group data
- Transaction filtering by date

### Cleanup

Tests clean up after themselves:

```typescript
test.afterEach(async ({ page }) => {
  // Logout and clear cookies
  await page.goto("/logout");
});
```

## Performance Optimization

### Parallel Execution

By default, Playwright runs tests in parallel:

```bash
# Control worker count
npx playwright test --workers=4
```

### Sharding (CI)

Split tests across multiple CI jobs:

```bash
# Job 1 of 3
npx playwright test --shard=1/3

# Job 2 of 3
npx playwright test --shard=2/3

# Job 3 of 3
npx playwright test --shard=3/3
```

### Selective Test Running

```bash
# Run only auth tests
npx playwright test e2e/auth

# Run specific file
npx playwright test e2e/settlement/traceability.spec.ts

# Run tests matching pattern
npx playwright test -g "settlement calculation"
```

## Test Reports

### HTML Report

```bash
# Generate and open HTML report
npx playwright show-report
```

### JSON Report

```bash
# Generate JSON report
npx playwright test --reporter=json

# Custom output location
npx playwright test --reporter=json --output=test-results/report.json
```

### JUnit Report (CI)

```bash
# For CI integration
npx playwright test --reporter=junit
```

## Accessibility Testing

### Automated axe-core Checks

All pages are automatically scanned for accessibility violations:

```typescript
import { injectAxe, checkA11y } from "axe-playwright";

test("dashboard is accessible", async ({ page }) => {
  await page.goto("/dashboard");
  await injectAxe(page);
  await checkA11y(page);
});
```

### Manual Testing Checklist

- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader announcements
- [ ] Focus indicators visible
- [ ] Color contrast ratios (WCAG AA)
- [ ] Form labels and error messages

## Security Testing

### XSS Prevention (L-SC-002)

Tests verify user input is sanitized:

```typescript
test("prevents XSS in transaction description", async ({ page }) => {
  await page.fill('[name="description"]', '<script>alert("xss")</script>');
  await page.click('button[type="submit"]');

  const content = await page.content();
  expect(content).not.toContain("<script>");
});
```

### CSRF Protection (L-SC-005)

Tests verify CSRF tokens:

```typescript
test("rejects POST without CSRF token", async ({ request }) => {
  const response = await request.post("/api/transactions", {
    data: { amount: 1000 },
  });
  expect(response.status()).toBe(403);
});
```

### Rate Limiting (L-SC-004)

Tests verify rate limits:

```typescript
test("blocks excessive login attempts", async ({ page }) => {
  for (let i = 0; i < 6; i++) {
    await page.goto("/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "wrong");
    await page.click('button[type="submit"]');
  }

  const error = await page.textContent(".error-message");
  expect(error).toContain("試行回数が上限を超えました");
});
```

## Best Practices

### 1. Use Page Object Model

```typescript
// e2e/pages/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  async getBalance() {
    return await this.page.textContent('[data-testid="balance"]');
  }
}
```

### 2. Use Test Fixtures

```typescript
import { test as base } from "@playwright/test";
import { DashboardPage } from "./pages/DashboardPage";

export const test = base.extend<{ dashboardPage: DashboardPage }>({
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});
```

### 3. Wait for Network Idle

```typescript
await page.goto("/dashboard", { waitUntil: "networkidle" });
```

### 4. Use Data Test IDs

```typescript
// Component
<button data-testid="submit-transaction">送信</button>

// Test
await page.click('[data-testid="submit-transaction"]');
```

### 5. Avoid Hardcoded Waits

```typescript
// Bad
await page.waitForTimeout(5000);

// Good
await page.waitForSelector('[data-testid="result"]');
```

## References

- [Playwright Documentation](https://playwright.dev/)
- [L-TA-001: Test Categories](../laws/07-test-audit.md#l-ta-001-evaluation-dataset-categories)
- [L-BR-007: Traceability Testing](../laws/08-business-rules.md#l-br-007-traceability-testing)
- [L-SC: Security Laws](../laws/04-security.md)

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section above
2. Review test logs in `test-results/`
3. Check CI workflow runs in GitHub Actions
4. Consult Playwright documentation
