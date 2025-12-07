# E2E Tests Quick Start

## Prerequisites
- Node.js 20+
- Supabase project with Auth enabled
- Environment variables configured

## 1. Install Playwright Browsers
```bash
npx playwright install chromium
```

## 2. Set Environment Variables
Create `.env.local` with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Run Tests
```bash
npm run test:e2e
```

## Common Commands
| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all tests |
| `npm run test:e2e:ui` | Interactive UI mode |
| `npm run test:e2e:debug` | Debug mode |
| `npx playwright test --headed` | Run with visible browser |
| `npx playwright test e2e/auth/login.spec.ts` | Run specific file |

## Troubleshooting

### Tests fail with "SUPABASE_SERVICE_ROLE_KEY is required"
- Ensure `.env.local` contains `SUPABASE_SERVICE_ROLE_KEY`
- This key is needed to create/delete test users

### Dev server not starting
- Make sure port 3000 is available
- Kill any existing Next.js processes: `lsof -ti:3000 | xargs kill`

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if Supabase is accessible

## CI/CD
Tests run automatically on GitHub Actions for:
- Pushes to main/master
- Pull requests to main/master

Required GitHub Secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
