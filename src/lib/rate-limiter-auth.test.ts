import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, clearAllRateLimits } from './rate-limiter'
import { getClientIP } from './get-client-ip'

describe('auth rate limiting integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllRateLimits()
  })

  afterEach(() => {
    vi.useRealTimers()
    clearAllRateLimits()
  })

  describe('login rate limit', () => {
    it('allows 5 attempts per 15 minutes per email', () => {
      const email = 'test@example.com'
      const config = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(email, config, 'login')
        expect(result.allowed).toBe(true)
      }

      const blockedResult = checkRateLimit(email, config, 'login')
      expect(blockedResult.allowed).toBe(false)
      if (!blockedResult.allowed) {
        expect(blockedResult.retryAfter).toBeGreaterThan(0)
        expect(blockedResult.retryAfter).toBeLessThanOrEqual(900)
      }
    })

    it('isolates different emails', () => {
      const config = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }

      for (let i = 0; i < 5; i++) {
        checkRateLimit('user1@example.com', config, 'login')
      }

      const user1Blocked = checkRateLimit('user1@example.com', config, 'login')
      expect(user1Blocked.allowed).toBe(false)

      const user2Allowed = checkRateLimit('user2@example.com', config, 'login')
      expect(user2Allowed.allowed).toBe(true)
    })
  })

  describe('signup rate limit', () => {
    it('allows 3 attempts per 15 minutes per IP', () => {
      const ip = '203.0.113.1'
      const config = { maxAttempts: 3, windowMs: 15 * 60 * 1000 }

      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(ip, config, 'signup')
        expect(result.allowed).toBe(true)
      }

      const blockedResult = checkRateLimit(ip, config, 'signup')
      expect(blockedResult.allowed).toBe(false)
      if (!blockedResult.allowed) {
        expect(blockedResult.retryAfter).toBeGreaterThan(0)
        expect(blockedResult.retryAfter).toBeLessThanOrEqual(900)
      }
    })

    it('isolates different IPs', () => {
      const config = { maxAttempts: 3, windowMs: 15 * 60 * 1000 }

      for (let i = 0; i < 3; i++) {
        checkRateLimit('203.0.113.1', config, 'signup')
      }

      const ip1Blocked = checkRateLimit('203.0.113.1', config, 'signup')
      expect(ip1Blocked.allowed).toBe(false)

      const ip2Allowed = checkRateLimit('198.51.100.1', config, 'signup')
      expect(ip2Allowed.allowed).toBe(true)
    })
  })

  describe('login and signup isolation', () => {
    it('uses separate rate limit stores', () => {
      const identifier = 'test@example.com'

      for (let i = 0; i < 5; i++) {
        checkRateLimit(identifier, { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, 'login')
      }

      const loginBlocked = checkRateLimit(
        identifier,
        { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
        'login'
      )
      expect(loginBlocked.allowed).toBe(false)

      const signupAllowed = checkRateLimit(
        identifier,
        { maxAttempts: 3, windowMs: 15 * 60 * 1000 },
        'signup'
      )
      expect(signupAllowed.allowed).toBe(true)
    })
  })

  describe('retry-after message format', () => {
    it('includes seconds in error message', () => {
      const config = { maxAttempts: 2, windowMs: 60000 }

      checkRateLimit('test@example.com', config, 'login')
      checkRateLimit('test@example.com', config, 'login')

      const result = checkRateLimit('test@example.com', config, 'login')

      expect(result.allowed).toBe(false)
      if (!result.allowed) {
        const message = `Too many login attempts. Please try again in ${result.retryAfter} seconds.`
        expect(message).toMatch(/Too many login attempts\. Please try again in \d+ seconds\./)
      }
    })
  })

  describe('IP extraction', () => {
    it('handles x-forwarded-for header (uses rightmost valid IP for security)', () => {
      const headers = new Headers({ 'x-forwarded-for': '203.0.113.1, 198.51.100.1' })
      expect(getClientIP(headers)).toBe('198.51.100.1')
    })

    it('handles x-real-ip header', () => {
      const headers = new Headers({ 'x-real-ip': '203.0.113.1' })
      expect(getClientIP(headers)).toBe('203.0.113.1')
    })

    it('returns unknown when headers missing', () => {
      const headers = new Headers()
      expect(getClientIP(headers)).toBe('unknown')
    })
  })
})
