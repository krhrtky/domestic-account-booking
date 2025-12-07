# E2E Demo Test Suite

This directory contains comprehensive end-to-end tests demonstrating all user journeys and features of the Household Settlement Application.

## Test Scenarios

### 1. Onboarding (01-onboarding.spec.ts)
- Complete signup flow from landing page
- Group creation with custom ratios
- Verification of database records

### 2. Partner Invitation (02-partner-invitation.spec.ts)
- Partner invitation via email
- Multi-user group setup
- Invitation token acceptance flow

### 3. Manual Transactions (03-manual-transactions.spec.ts)
- Direct database transaction insertion
- Transaction display verification
- Payer and expense type validation

### 4. CSV Upload (04-csv-upload.spec.ts)
- File upload with valid CSV
- Transaction import and display
- Source file tracking

### 5. Transaction Classification (05-transaction-classification.spec.ts)
- Toggle between Household and Personal expense types
- Real-time UI updates
- Database consistency validation

### 6. Filtering (06-filtering.spec.ts)
- Filter by month, payer type, and expense type
- Multiple filter combinations
- Empty state handling

### 7. Pagination (07-pagination.spec.ts)
- Load More functionality
- Cursor-based pagination
- Large dataset handling (75+ transactions)

### 8. Deletion (08-deletion.spec.ts)
- Transaction deletion with confirmation
- Permanent removal verification
- Refresh persistence check

### 9. Settlement - Equal Ratio (09-settlement-equal.spec.ts)
- 50/50 ratio calculation
- Personal expense exclusion
- Settlement direction verification

### 10. Settlement - Unequal Ratio (10-settlement-unequal.spec.ts)
- 60/40 ratio calculation
- Reverse payment direction
- Fair share calculation

### 11. Settlement - Common Account (11-settlement-common-account.spec.ts)
- Common payer transaction handling
- Settlement calculation exclusion
- Display verification

### 12. Ratio Update (12-ratio-update.spec.ts)
- Dynamic ratio changes
- Settlement recalculation
- Multi-user consistency

### 13. Logout & Session (13-logout-session.spec.ts)
- Session persistence across reloads
- Logout functionality
- Protected route enforcement

### 14. Error Handling (14-error-handling.spec.ts)
- Duplicate email validation
- Invalid CSV format handling
- Wrong password errors
- Input validation checks

### 15. Edge Cases (15-edge-cases.spec.ts)
- Zero transactions
- Exactly equal contributions
- Very large/small amounts
- Special characters
- Future dates

## Running Tests

### Run all demo tests
npm run test:e2e:demo

### Run demo tests in UI mode
npm run test:e2e:demo:ui

### Run specific scenario
npx playwright test e2e/demo/01-onboarding.spec.ts

### Run in debug mode
npx playwright test e2e/demo/01-onboarding.spec.ts --debug

### Run on specific browser
npx playwright test e2e/demo --project=chromium
npx playwright test e2e/demo --project=firefox
npx playwright test e2e/demo --project=webkit

### Run with headed browser
npx playwright test e2e/demo --headed

### Generate HTML report
npx playwright test e2e/demo
npx playwright show-report

## Prerequisites

1. Environment variables set in `.env.local`:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

2. Supabase project running and accessible

3. Development server running:
   npm run dev

4. Playwright browsers installed:
   npx playwright install

## Test Data Management

### Isolation
- Each test creates unique users with timestamped emails
- Tests clean up data in `afterAll` hooks
- No shared state between tests

### Fixtures
- CSV files in `tests/fixtures/demo-csvs/`
- Test data helpers in `e2e/fixtures/demo-data.ts`
- Reusable functions in `e2e/utils/demo-helpers.ts`

### Database Operations
- Direct Supabase Admin API calls for setup
- RLS policies enforced during test execution
- Automatic cleanup on test completion

## Expected Execution Time

- Individual test: 10-30 seconds
- Full demo suite: 8-12 minutes (sequential)
- Parallel execution disabled to avoid Supabase rate limits

## Pass Criteria

- All assertions must pass
- No console errors during execution
- Database state verified for critical operations
- Screenshots captured on failure

## Debugging

### View trace for failed test
npx playwright show-trace playwright-report/trace.zip

### Interactive debugging
npx playwright test e2e/demo/01-onboarding.spec.ts --debug

### Headed mode with slow motion
npx playwright test e2e/demo --headed --slow-mo=1000

### Screenshot directory
playwright-report/

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch

Configuration:
- Browser: Chromium, Firefox, WebKit
- Workers: 1 (sequential to avoid rate limits)
- Retries: 2 on failure
- Artifacts: HTML report, screenshots, traces

## Known Limitations

1. Manual entry UI not fully implemented - uses database inserts
2. Email delivery not tested (invitation URLs extracted from UI)
3. Real-time subscriptions not covered
4. Mobile touch gestures not tested
5. Some tests depend on data-testid attributes that may not exist

## Test Maintenance

### When adding new features
1. Create new spec file in `e2e/demo/`
2. Follow naming convention: `NN-feature-name.spec.ts`
3. Add test data to `e2e/fixtures/demo-data.ts`
4. Update this README with scenario description

### When updating existing features
1. Update relevant spec files
2. Verify all related assertions
3. Run full demo suite before commit

### Best Practices
- Use descriptive test names
- Add cleanup in afterAll hooks
- Verify database state for critical paths
- Use page.waitForTimeout sparingly (prefer Playwright auto-waiting)
- Add comments for complex assertions

## Troubleshooting

### Tests fail with "Session not found"
- Check Supabase credentials in .env.local
- Verify SUPABASE_SERVICE_ROLE_KEY is set

### Tests timeout
- Increase timeout in playwright.config.ts
- Check dev server is running
- Verify network connectivity to Supabase

### Random failures
- Check for race conditions
- Increase waitForTimeout values
- Review Supabase rate limits

### Database cleanup fails
- Manually delete test users from Supabase dashboard
- Check RLS policies allow deletion

## Support

For issues or questions:
1. Check existing test patterns in `e2e/auth/` and `e2e/settlement/`
2. Review E2E-DEMO-SPEC.md for acceptance criteria
3. Consult Playwright documentation: https://playwright.dev/
