# GitHub Issues Specification: Phase 18+ Task Management

## Product Context
**Product**: Household Settlement Application - A Next.js-based web app for couples to manage shared expenses and calculate monthly settlements.

**Background**: Phase 17 (E2E Auth Stabilization) is complete, with CI/CD integrated. The project now requires structured task management for remaining quality improvements and feature enhancements.

---

## Issue Catalog

### Issue #1: Complete E2E Demo Tests Migration to Persistent Auth

**Title**: [Phase 17.3] Migrate Remaining Demo Tests to storageState Authentication

**Priority**: P1 (High)  
**Labels**: `enhancement`, `e2e`, `technical-debt`, `Phase-17`  
**Milestone**: v1.1 - Testing Stabilization

#### Summary
14 of 16 demo test files still use manual login flows (`createTestUser`, `loginUser`). Migrate them to use the shared persistent authentication (`storageState`) established in Phase 17, reducing test execution time and improving reliability.

#### Background
- Phase 17 introduced global auth setup (`e2e/global.setup.ts`) with browser-specific storage states
- Only `16-auth-state-verification.spec.ts` currently uses the new pattern
- Tests like `01-onboarding.spec.ts`, `02-partner-invitation.spec.ts`, etc. still create unique users per test

#### Acceptance Criteria
- [ ] All 14 demo tests (01-15, excluding 16) refactored to use shared `e2e-test-user@example.com`
- [ ] Remove manual `createTestUser` + `loginUser` calls where shared auth is sufficient
- [ ] Tests that require unique user scenarios (e.g., `01-onboarding`) kept as-is with custom users
- [ ] Test execution time reduced by at least 20% (measure before/after)
- [ ] All tests pass with `npx playwright test e2e/demo/ --project=chromium`
- [ ] `e2e/MIGRATION-GUIDE.md` updated with examples from actual migrations
- [ ] No regressions in test coverage (maintain 100% demo scenario coverage)

#### Technical Approach
Follow the pattern from `e2e/demo/16-auth-state-verification.spec.ts`:
```typescript
// Before: Manual login
const user = await createTestUser({...})
await loginUser(page, user)

// After: Auto-authenticated
test('my test', async ({ page }) => {
  await page.goto('/dashboard')
  // Already authenticated via storageState
})
```

**Exclusions**: 
- `01-onboarding.spec.ts` - Tests signup flow, requires fresh user
- `13-logout-session.spec.ts` - Tests logout, requires custom session

#### Estimated Effort
**Size**: M (Medium)  
**Time**: 4-6 hours  
**Complexity**: Low (well-documented pattern exists)

#### Dependencies
- Phase 17 global setup must remain stable
- `e2e/.auth/user-chromium.json` must be valid

#### Success Metrics
- Test suite runtime: < 180 seconds (down from ~240 seconds)
- Zero new test flakes introduced
- CI workflow `e2e.yml` completes faster

---

### Issue #2: Implement Internationalization (i18n) Support

**Title**: [Phase 18] Add Multi-Language Support with next-intl

**Priority**: P2 (Medium)  
**Labels**: `feature`, `i18n`, `enhancement`, `Phase-18`  
**Milestone**: v1.2 - Localization

#### Summary
Enable the Household Settlement app to support multiple languages (starting with English and Japanese) using `next-intl` for Next.js 15 App Router.

#### Background
- Target users include Japanese-speaking couples and international households
- Current app is English-only with hardcoded strings
- `next-intl` is the recommended i18n solution for Next.js App Router (2024+)

#### Scope

**In Scope:**
1. Install and configure `next-intl` for App Router
2. Extract all UI strings to locale files (`en.json`, `ja.json`)
3. Implement locale switcher in settings page
4. Translate core flows: auth, dashboard, transactions, settings
5. Handle date/number formatting (currency, dates)
6. Store user locale preference in database (`users.locale`)

**Out of Scope (Non-Goals):**
- Right-to-left (RTL) language support (Arabic, Hebrew)
- Locale-specific routing (`/en/dashboard`, `/ja/dashboard`)
- Translation of dynamically generated content (transaction descriptions)
- Machine translation integration (DeepL, Google Translate)

#### Acceptance Criteria
- [ ] `next-intl` v3.x installed and configured in `app/[locale]/layout.tsx`
- [ ] Locale files created: `/messages/en.json`, `/messages/ja.json`
- [ ] All hardcoded UI strings replaced with `useTranslations()` hook
- [ ] Locale switcher dropdown added to settings page
- [ ] User locale saved to `users.locale` column (migration added)
- [ ] Date formatting respects locale (e.g., `2025/12/09` for `ja`, `12/09/2025` for `en`)
- [ ] Currency formatting uses JPY symbol for `ja` locale
- [ ] E2E tests pass with both locales (add `ja` tests to CI)
- [ ] No performance regression (< 100ms overhead per request)
- [ ] Documentation: `docs/i18n-guide.md` with translation workflow

#### Technical Approach

**1. Configuration:**
```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({ children, params: { locale } }) {
  const messages = await getMessages({ locale });
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

**2. Message Files:**
```json
// messages/en.json
{
  "dashboard": {
    "welcome": "Welcome, {name}!",
    "balance": "Your balance: {amount}"
  }
}
```

**3. Usage:**
```typescript
const t = useTranslations('dashboard');
<h1>{t('welcome', { name: user.name })}</h1>
```

**4. Database Migration:**
```sql
ALTER TABLE users ADD COLUMN locale VARCHAR(5) DEFAULT 'en';
CREATE INDEX idx_users_locale ON users(locale);
```

#### Non-Functional Requirements

**Performance:**
- Locale message bundles < 50KB gzipped
- Initial load overhead < 100ms

**Maintainability:**
- Clear naming conventions for translation keys (namespace.component.key)
- TypeScript support for translation keys (via `next-intl` codegen)

**Operability:**
- Missing translation keys logged to console in development
- Fallback to English if Japanese translation missing

#### Estimated Effort
**Size**: L (Large)  
**Time**: 12-16 hours  
**Complexity**: Medium (structural changes across codebase)

#### Dependencies
- Next.js 15 App Router (already in use)
- Database migration for `users.locale`

#### Success Metrics
- 100% of UI strings translated to English and Japanese
- Locale switcher functional in production
- Zero hardcoded English strings remaining in components

#### Follow-up Tasks
- Phase 19: Add Korean language support
- Phase 20: Implement translation management workflow (Lokalise, Crowdin)

---

### Issue #3: Integrate Error Monitoring with Sentry

**Title**: [Phase 18] Add Sentry for Error Tracking and Performance Monitoring

**Priority**: P2 (Medium)  
**Labels**: `infrastructure`, `monitoring`, `observability`, `Phase-18`  
**Milestone**: v1.2 - Production Readiness

#### Summary
Integrate Sentry for real-time error tracking, performance monitoring, and user session replay to improve production observability and incident response.

#### Background
- Current error handling only logs to console (no persistence)
- No visibility into production errors or user impact
- Performance issues not quantified (Core Web Vitals tracking missing)
- Difficult to debug user-reported issues without context

#### Scope

**In Scope:**
1. Sentry SDK installation (client + server)
2. Error boundary integration (React Error Boundary)
3. API route error capture (`/api/*`)
4. Source map upload for stack traces
5. Performance monitoring (transactions, spans)
6. User context attachment (user ID, email)
7. Environment-based configuration (dev/staging/prod)
8. Session replay for debugging (opt-in)

**Out of Scope (Non-Goals):**
1. Log aggregation (continue using Vercel logs)
2. Alerts/paging (use Sentry's built-in alerts)
3. Custom metrics (defer to Phase 19)
4. Profiling (CPU/memory) - defer to Phase 20
5. Alternative monitoring (LogRocket, Datadog)

#### Acceptance Criteria
- [ ] `@sentry/nextjs` v8.x installed and configured
- [ ] `sentry.client.config.ts` and `sentry.server.config.ts` created
- [ ] Error boundary wraps root layout (`app/layout.tsx`)
- [ ] API routes report errors to Sentry automatically
- [ ] Source maps uploaded to Sentry (`.next/` via CI)
- [ ] User context attached (ID, email, group ID) for authenticated users
- [ ] Environment tags: `development`, `staging`, `production`
- [ ] Sample rate configured: 100% errors, 10% performance traces
- [ ] Test error logged to Sentry successfully (via `/api/sentry-test`)
- [ ] Documentation: `docs/sentry-setup.md` with dashboard screenshots
- [ ] No PII (passwords, tokens) leaked to Sentry
- [ ] Performance overhead < 50ms per request

#### Technical Approach

**1. Installation:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**2. Configuration:**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [new Sentry.Replay()],
});
```

**3. Error Boundary:**
```typescript
// app/error.tsx
'use client';
import * as Sentry from '@sentry/nextjs';

export default function ErrorBoundary({ error }) {
  Sentry.captureException(error);
  return <div>Something went wrong!</div>;
}
```

**4. User Context:**
```typescript
Sentry.setUser({
  id: session.user.id,
  email: session.user.email,
  group_id: user.groupId,
});
```

**5. Source Maps Upload (CI):**
```yaml
# .github/workflows/deploy.yml
- name: Upload Source Maps to Sentry
  run: npx @sentry/cli sourcemaps upload --org=household --project=settlement .next
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

#### Non-Functional Requirements

**Security (Critical):**
- **SEC-1**: No passwords, tokens, or secrets sent to Sentry
- **SEC-2**: PII redaction enabled for sensitive fields (credit card numbers)
- **SEC-3**: Sentry DSN stored in environment variables (not committed)

**Performance:**
- Sentry SDK overhead < 50ms per request
- Client bundle size increase < 100KB

**Operability:**
- Alerts configured for critical errors (500+ in 5 minutes)
- Slack integration for high-severity issues

#### Estimated Effort
**Size**: M (Medium)  
**Time**: 6-8 hours  
**Complexity**: Low (well-documented SDK)

#### Dependencies
- Sentry account (free tier sufficient for MVP)
- `NEXT_PUBLIC_SENTRY_DSN` environment variable

#### Success Metrics
- 100% of unhandled errors captured in Sentry
- Average error resolution time < 24 hours (with context)
- Zero PII leaks in 30-day audit

#### Follow-up Tasks
- Phase 19: Configure custom Sentry alerts (Slack, PagerDuty)
- Phase 20: Add custom performance metrics (settlement calculation time)

---

### Issue #4: Fix Accessibility Violations in Settings and Transactions Pages

**Title**: [Critical] Resolve 6 Failing A11y Tests (Settings + Transactions)

**Priority**: P0 (Critical)  
**Labels**: `bug`, `accessibility`, `a11y`, `WCAG`, `Phase-17`  
**Milestone**: v1.1 - Accessibility Compliance

#### Summary
6 of 15 accessibility E2E tests are failing (settings and transactions pages across all browsers). Violations must be fixed to meet WCAG 2.1 Level AA compliance before production launch.

#### Background
- E2E accessibility tests use `axe-core` via Playwright
- Current status: 9 PASS (auth, dashboard), 6 FAIL (settings, transactions)
- Failures detected in Phase 17 CI integration
- Violations likely include: missing labels, color contrast, keyboard navigation

#### Failing Tests
1. `[chromium] › settings.a11y.spec.ts:5:7` - Settings page violations
2. `[firefox] › settings.a11y.spec.ts:5:7` - Settings page violations
3. `[webkit] › settings.a11y.spec.ts:5:7` - Settings page violations
4. `[chromium] › transactions.a11y.spec.ts:5:7` - Transactions page violations
5. `[firefox] › transactions.a11y.spec.ts:5:7` - Transactions page violations
6. `[webkit] › transactions.a11y.spec.ts:5:7` - Transactions page violations

#### Acceptance Criteria
- [ ] All 6 failing tests pass with zero violations
- [ ] Violations logged to `test-results/*/error-context.md` reviewed
- [ ] Common issues fixed:
  - [ ] Form inputs have associated `<label>` elements
  - [ ] Color contrast ratio ≥ 4.5:1 (WCAG AA)
  - [ ] Interactive elements keyboard-accessible (Tab navigation)
  - [ ] ARIA roles/labels present where needed
- [ ] No new violations introduced in dashboard/auth pages
- [ ] Full a11y test suite passes: `npx playwright test --grep a11y`
- [ ] Manual keyboard navigation testing completed (Tab, Enter, Escape)
- [ ] Screen reader testing (VoiceOver/NVDA) on settings and transactions pages
- [ ] Documentation: Known limitations documented in `docs/accessibility.md`

#### Investigation Steps
1. Run failing tests with verbose output:
   ```bash
   npx playwright test e2e/accessibility/settings.a11y.spec.ts --project=chromium --debug
   ```
2. Review error context:
   ```bash
   cat test-results/accessibility-settings.a11-90096-no-accessibility-violations-chromium/error-context.md
   ```
3. Inspect violation details (likely issues):
   - Missing `for` attribute on labels
   - Low color contrast in buttons or links
   - Missing ARIA landmarks (`<main>`, `<nav>`)

#### Likely Fixes

**Settings Page (`/settings`):**
```typescript
// Before: Unlabeled input
<input name="groupName" />

// After: Properly labeled
<label htmlFor="groupName">Group Name</label>
<input id="groupName" name="groupName" />
```

**Transactions Page (`/dashboard`):**
```typescript
// Before: Poor contrast button
<button className="bg-gray-300 text-gray-400">...</button>

// After: WCAG AA compliant
<button className="bg-blue-600 text-white">...</button>
```

**Common Fixes:**
- Add `aria-label` to icon-only buttons
- Ensure focus visible on interactive elements (`:focus-visible` styles)
- Use semantic HTML (`<button>` not `<div onClick>`)

#### Non-Functional Requirements

**Compliance:**
- WCAG 2.1 Level AA compliance (required for enterprise customers)
- No critical violations (severity: critical, serious)

**Testing:**
- Automated: `axe-core` via Playwright
- Manual: Keyboard and screen reader validation

#### Estimated Effort
**Size**: S (Small)  
**Time**: 3-4 hours  
**Complexity**: Low (CSS and markup fixes)

#### Dependencies
- E2E test suite infrastructure (already in place)
- `axe-core` and `@axe-core/playwright` installed

#### Success Metrics
- 100% accessibility tests passing (15/15)
- Zero critical/serious violations in axe reports
- Keyboard navigation functional on all pages

#### Follow-up Tasks
- Phase 18.5: Add automated a11y checks to PR reviews (GitHub Actions)
- Phase 19: Audit color palette for WCAG AAA compliance (7:1 contrast)

---

### Issue #5: (Duplicate of #1 - No Action Needed)

**Note**: "Phase 18 候補3: Demo tests migration" is identical to Issue #1 (Phase 17.3). No separate issue required.

---

## Summary Table

| Issue | Title | Priority | Size | Est. Hours | Status |
|-------|-------|----------|------|------------|--------|
| #1 | Demo Tests Migration to storageState | P1 | M | 4-6h | Ready |
| #2 | Add i18n Support (next-intl) | P2 | L | 12-16h | Blocked by #1 |
| #3 | Integrate Sentry Monitoring | P2 | M | 6-8h | Ready |
| #4 | Fix A11y Violations (Settings/Transactions) | P0 | S | 3-4h | **Urgent** |

## Recommended Implementation Order

1. **Issue #4** (P0 - A11y Fixes) - Unblock production launch
2. **Issue #1** (P1 - Demo Tests) - Improve CI reliability before i18n work
3. **Issue #3** (P2 - Sentry) - Parallel with #1, no dependencies
4. **Issue #2** (P2 - i18n) - Requires stable test suite from #1

---

## GitHub Labels to Create

- `Phase-17` (orange) - Continuation of Phase 17 work
- `Phase-18` (green) - New Phase 18 initiatives
- `accessibility` (red) - WCAG compliance issues
- `i18n` (blue) - Internationalization
- `monitoring` (purple) - Observability and error tracking
- `technical-debt` (gray) - Code quality improvements

## GitHub Milestones

- **v1.1 - Testing Stabilization** (Target: 2025-12-15)
  - Issues: #1, #4
- **v1.2 - Production Readiness** (Target: 2025-12-31)
  - Issues: #2, #3

---

**Spec Version**: 1.0  
**Author**: Product Agent  
**Date**: 2025-12-09  
**Status**: Ready for Issue Creation
