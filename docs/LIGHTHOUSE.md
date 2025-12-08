# Lighthouse CI Integration

This project includes Lighthouse CI integration for automated performance testing.

## Configuration

The Lighthouse CI is configured to test three key pages:
- `/login` - Login page (unauthenticated)
- `/dashboard` - Dashboard (authenticated)
- `/dashboard/transactions` - Transactions page (authenticated)

## Performance Budgets

The following performance budgets are enforced:
- Overall Performance Score: >= 80
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Total Blocking Time (TBT): < 300ms

## Running Locally

To run Lighthouse CI locally:

```bash
npm run lighthouse
```

This will:
1. Build the production bundle
2. Create a test user and session
3. Start the production server
4. Run Lighthouse tests (3 runs, median taken)
5. Assert performance budgets
6. Generate reports in `.lighthouseci/` directory

## CI/CD Integration

Lighthouse CI runs automatically on:
- Pull requests to `main` or `master`
- Pushes to `main` or `master`

The workflow:
1. Builds the production bundle
2. Creates a test session for authenticated pages
3. Starts the production server
4. Runs Lighthouse tests
5. Uploads reports as artifacts (30 day retention)

## Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret for JWT signing
- `NEXTAUTH_URL` - Application URL (default: http://localhost:3000)
- `NEXT_PUBLIC_APP_URL` - Public application URL

## Test User

The Lighthouse tests use a dedicated test user:
- Email: `lighthouse-test@example.com`
- This user is created/recreated on each run

## Viewing Reports

### Local Reports
Reports are generated in `.lighthouseci/` directory after running locally.

### CI Reports
1. Go to the GitHub Actions run
2. Scroll to the bottom "Artifacts" section
3. Download `lighthouse-reports` artifact
4. Extract and open HTML files in browser

## Troubleshooting

### Lighthouse fails with timeout
- Increase `startServerReadyTimeout` in `.lighthouserc.json`
- Check server logs for startup issues

### Performance budgets failing
- Check generated reports for specific metrics
- Consider optimizing assets, reducing JavaScript bundle size
- Review Next.js build output for optimization opportunities

### Authentication errors on dashboard pages
- Verify `NEXTAUTH_SECRET` is set correctly
- Check `scripts/lighthouse-auth.js` creates valid JWT tokens
- Ensure database schema matches expectations

## Files

- `.lighthouserc.json` - Lighthouse CI configuration
- `scripts/lighthouse-auth.js` - Session generator for authenticated tests
- `scripts/run-lighthouse.sh` - Local test runner script
- `.github/workflows/lighthouse.yml` - CI workflow
