# CSRF Protection & Security Headers

**Version:** 1.0  
**Date:** 2025-12-08  
**Status:** Implemented  

---

## 1. Overview

This document describes the CSRF (Cross-Site Request Forgery) protection mechanisms and security headers implemented in the Household Settlement application.

---

## 2. Built-in Next.js 15 CSRF Protection

### 2.1 Server Actions Protection

Next.js 15 Server Actions include built-in CSRF protection through the following mechanisms:

1. **Origin Header Validation**
   - Next.js automatically validates the `Origin` and `Referer` headers
   - Requests must originate from the same domain
   - Prevents cross-origin form submissions

2. **Action ID Validation**
   - Each Server Action has a cryptographically secure action ID
   - Action IDs are generated at build time and embedded in the client bundle
   - Prevents external sites from invoking Server Actions

3. **Session-based Authentication**
   - All authenticated Server Actions verify session via NextAuth
   - Session cookies are httpOnly and sameSite=lax by default
   - Prevents cookie access from JavaScript and cross-site requests

### 2.2 Automatic Protection Scope

All Server Actions in this application are automatically protected:

- `/src/app/actions/auth.ts` (signUp, logIn, logOut)
- `/src/app/actions/group.ts` (createGroup, invitePartner, acceptInvitation, updateRatio)
- `/src/app/actions/transaction.ts` (uploadCSV, updateExpenseType, deleteTransaction)

**No additional CSRF tokens required** - Next.js handles this automatically.

---

## 3. Security Headers

### 3.1 Implemented Headers

The following security headers are configured in `next.config.js`:

#### X-Frame-Options: DENY

```
X-Frame-Options: DENY
```

**Purpose:** Prevents clickjacking attacks by disallowing the page from being embedded in `<iframe>`, `<frame>`, or `<object>` elements.

**Rationale:** The household settlement app has no legitimate use case for iframe embedding. Blocking all framing prevents UI redressing attacks.

---

#### Content-Security-Policy: frame-ancestors

```
Content-Security-Policy: frame-ancestors 'none'
```

**Purpose:** Modern alternative to X-Frame-Options, defined in CSP Level 2 specification.

**Rationale:** Provides equivalent protection with better browser support and more granular control. Setting to `'none'` blocks all framing.

---

#### X-Content-Type-Options: nosniff

```
X-Content-Type-Options: nosniff
```

**Purpose:** Prevents MIME type sniffing attacks by forcing browsers to respect declared Content-Type headers.

**Rationale:** Blocks attackers from uploading malicious files (e.g., HTML disguised as CSV) that could be executed if the browser incorrectly interprets the MIME type.

---

#### Referrer-Policy: strict-origin-when-cross-origin

```
Referrer-Policy: strict-origin-when-cross-origin
```

**Purpose:** Controls how much referrer information is sent with requests.

**Behavior:**
- Same-origin requests: Full URL sent in Referer header
- Cross-origin HTTPS→HTTPS: Only origin (e.g., `https://app.example.com`)
- HTTPS→HTTP: No referrer sent (prevents information leakage)

**Rationale:** Balances privacy with functionality. Prevents sensitive URL parameters (e.g., invitation tokens) from leaking to external sites.

---

### 3.2 Configuration Location

**File:** `/next.config.js`

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      }
    ]
  }
}
```

**Applied to:** All routes (`/(.*)`), including static assets and API routes.

---

## 4. Pre-Authentication Protection

### 4.1 Rate Limiting (Future Enhancement)

**Current Status:** Not implemented in MVP  
**Planned:** Phase 2

**Proposed Implementation:**
- Use Vercel Edge Middleware or Upstash Rate Limit
- Limit login attempts: 5 requests per 15 minutes per IP
- Limit signup attempts: 3 requests per hour per IP
- Limit password reset: 3 requests per hour per email

**Rationale:** Prevents brute-force attacks and credential stuffing before authentication layer.

---

### 4.2 Public Endpoint Hardening

**Affected Endpoints:**
- `/api/auth/signup` (NextAuth credential provider)
- `/api/auth/signin` (NextAuth credential provider)
- `/invite/[token]` (invitation acceptance)

**Current Protections:**
1. **Input Validation:** Zod schemas enforce email format, password length
2. **Database Constraints:** Unique email constraint prevents duplicate registrations
3. **Invitation Token Security:** UUIDs are cryptographically random (128-bit entropy)
4. **Expiry Checks:** Invitations expire after 7 days

**Recommended Additions (Phase 2):**
- CAPTCHA on signup form (Cloudflare Turnstile or hCaptcha)
- Email verification before group creation
- IP-based request logging for audit trail

---

## 5. Verification & Testing

### 5.1 Header Verification

Test security headers using browser DevTools or curl:

```bash
curl -I https://your-domain.com

HTTP/2 200
x-frame-options: DENY
content-security-policy: frame-ancestors 'none'
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
```

**Automated Check:**
```bash
npm run dev
curl -I http://localhost:3000 | grep -E 'x-frame-options|content-security-policy|x-content-type-options|referrer-policy'
```

---

### 5.2 CSRF Protection Testing

#### Test 1: Cross-Origin Server Action Call

1. Create malicious HTML file on different domain:
```html
<form action="https://your-app.com" method="POST">
  <input type="hidden" name="action" value="deleteAccount">
  <input type="submit" value="Click me">
</form>
```

2. Expected Result: Next.js rejects request due to Origin header mismatch

#### Test 2: Session Cookie Attributes

1. Log in to application
2. Inspect cookies in DevTools
3. Verify NextAuth session cookie has:
   - `HttpOnly: true`
   - `SameSite: Lax`
   - `Secure: true` (in production)

#### Test 3: Clickjacking Protection

1. Create external page attempting to iframe the app:
```html
<iframe src="https://your-app.com/settings"></iframe>
```

2. Expected Result: Browser console shows `Refused to display 'https://your-app.com/settings' in a frame because it set 'X-Frame-Options' to 'DENY'.`

---

### 5.3 Security Audit Checklist

From Epic 1 spec (QGA-1):

- [x] **CSRF Protection:** Next.js Server Actions default protection verified
- [x] **Security Headers:** X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy implemented
- [ ] **Rate Limiting:** Deferred to Phase 2
- [ ] **CAPTCHA:** Deferred to Phase 2
- [ ] **Penetration Testing:** Schedule external audit before production launch

---

## 6. Compliance & Standards

### 6.1 OWASP Top 10 Coverage

| OWASP Risk | Mitigation |
|------------|------------|
| A01 Broken Access Control | RLS policies + session validation |
| A02 Cryptographic Failures | bcrypt password hashing, HTTPS enforcement |
| A03 Injection | Parameterized queries (Postgres), Zod validation |
| A05 Security Misconfiguration | Security headers implemented |
| A07 Identification/Auth Failures | NextAuth session management |
| A08 Software/Data Integrity | Subresource Integrity (Next.js default) |
| A10 Server-Side Request Forgery | No external URL fetching in user flows |

---

### 6.2 Security Headers Score

**Tested with:** [https://securityheaders.com](https://securityheaders.com)

**Expected Grade:** A- (missing Strict-Transport-Security, needs HTTPS in production)

**Improvements for Grade A:**
```javascript
// Add in production environment
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains; preload'
}
```

---

## 7. Production Deployment Checklist

Before deploying to production:

- [ ] Verify HTTPS is enforced (Vercel does this automatically)
- [ ] Add HSTS header (Strict-Transport-Security)
- [ ] Enable rate limiting (Vercel Edge Config or Upstash)
- [ ] Configure Content Security Policy for scripts and styles
- [ ] Set up logging for failed authentication attempts
- [ ] Enable Vercel Web Application Firewall (WAF) if available
- [ ] Schedule quarterly security audits

---

## 8. Incident Response

### 8.1 Suspected CSRF Attack

**Symptoms:**
- Unexpected Server Action calls in logs
- User reports unauthorized actions
- Spike in 403 Forbidden responses

**Response:**
1. Check Vercel logs for Origin header mismatches
2. Review session cookie configuration
3. Verify Next.js version is up-to-date (security patches)
4. Temporarily disable affected Server Actions if necessary

---

### 8.2 Clickjacking Attempt

**Symptoms:**
- Reports of app appearing in iframes on external sites
- Browser console errors about X-Frame-Options

**Response:**
1. Verify headers are deployed (`curl -I` production URL)
2. Check CDN/proxy configuration (CloudFlare, etc.)
3. Report offending domain to hosting provider

---

## 9. References

- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN HTTP Headers Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [Next.js Server Actions Security](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security)

---

**Document Owner:** Security Team  
**Last Review:** 2025-12-08  
**Next Review:** 2026-03-08 (Quarterly)
