# API Route Rules

This rule applies to all API route files (`**/api/**`, `**/actions/**`).

## Applicable Laws

Reference: [docs/laws/06-api-specification.md](../../docs/laws/06-api-specification.md)

### L-AS: API Specification

#### L-AS-001: Response Format
```typescript
// Success
{ success: true, data: T, meta?: { page, limit, total, hasNext } }

// Error
{ success: false, error: { code: "E_XXX_NNN", message: "日本語", field? } }
```

#### L-AS-002: Input Validation
- Use Zod schemas for all inputs
- Error messages must be in Japanese

#### L-AS-004: Headers
Required:
- `Content-Type: application/json; charset=utf-8`
- `X-Request-Id: UUID`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Cache-Control: no-store`

Forbidden:
- `Server`
- `X-Powered-By`

### L-SC: Security

#### L-SC-001: Auth/Authz
- All protected endpoints require authentication
- Verify group membership for resource access

#### L-SC-004: Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/auth/login | 5 | 15min |
| /api/auth/signup | 3 | 1hour |
| /api/transactions POST | 10 | 1min |
| /api/* GET | 100 | 1min |

#### L-SC-005: CSRF
- Require CSRF token for state-changing requests
- Session cookies: `httpOnly`, `secure`, `sameSite: 'lax'`

### L-OC-003: Error Handling
```typescript
// Use AppError with error codes
throw new AppError('E_VALIDATION_001', '金額は0以上で入力してください', 400);
```

## HTTP Status Mapping

| Status | Use Case | Code Prefix |
|--------|----------|-------------|
| 200 | Success (GET/PUT/DELETE) | - |
| 201 | Created (POST) | - |
| 400 | Validation error | E_VALIDATION_* |
| 401 | Auth error | E_AUTH_* |
| 403 | Permission error | E_PERM_* |
| 404 | Not found | E_NOT_FOUND_* |
| 429 | Rate limited | E_RATE_LIMIT_* |
| 500 | Server error | E_INTERNAL_* |
