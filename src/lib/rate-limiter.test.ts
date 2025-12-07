import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, resetRateLimit, clearAllRateLimits } from './rate-limiter'

describe('rate-limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllRateLimits()
  })

  afterEach(() => {
    vi.useRealTimers()
    clearAllRateLimits()
  })

  describe('checkRateLimit', () => {
    it('allows first request', () => {
      const result = checkRateLimit('test@example.com', {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000
      })

      expect(result.allowed).toBe(true)
    })

    it('allows requests under limit', () => {
      const config = { maxAttempts: 3, windowMs: 15 * 60 * 1000 }

      expect(checkRateLimit('test@example.com', config).allowed).toBe(true)
      expect(checkRateLimit('test@example.com', config).allowed).toBe(true)
      expect(checkRateLimit('test@example.com', config).allowed).toBe(true)
    })

    it('blocks requests over limit', () => {
      const config = { maxAttempts: 3, windowMs: 15 * 60 * 1000 }

      checkRateLimit('test@example.com', config)
      checkRateLimit('test@example.com', config)
      checkRateLimit('test@example.com', config)

      const result = checkRateLimit('test@example.com', config)

      expect(result.allowed).toBe(false)
      if (!result.allowed) {
        expect(result.retryAfter).toBeGreaterThan(0)
        expect(result.retryAfter).toBeLessThanOrEqual(900)
      }
    })

    it('returns correct retry-after time', () => {
      const config = { maxAttempts: 2, windowMs: 60000 }

      checkRateLimit('test@example.com', config)
      checkRateLimit('test@example.com', config)

      vi.advanceTimersByTime(10000)

      const result = checkRateLimit('test@example.com', config)

      expect(result.allowed).toBe(false)
      if (!result.allowed) {
        expect(result.retryAfter).toBe(50)
      }
    })

    it('resets after window expires', () => {
      const config = { maxAttempts: 2, windowMs: 60000 }

      checkRateLimit('test@example.com', config)
      checkRateLimit('test@example.com', config)

      const blockedResult = checkRateLimit('test@example.com', config)
      expect(blockedResult.allowed).toBe(false)

      vi.advanceTimersByTime(60001)

      const allowedResult = checkRateLimit('test@example.com', config)
      expect(allowedResult.allowed).toBe(true)
    })

    it('uses separate stores for different store names', () => {
      const config = { maxAttempts: 2, windowMs: 60000 }

      checkRateLimit('test@example.com', config, 'login')
      checkRateLimit('test@example.com', config, 'login')

      const loginResult = checkRateLimit('test@example.com', config, 'login')
      expect(loginResult.allowed).toBe(false)

      const signupResult = checkRateLimit('test@example.com', config, 'signup')
      expect(signupResult.allowed).toBe(true)
    })

    it('tracks different identifiers separately', () => {
      const config = { maxAttempts: 2, windowMs: 60000 }

      checkRateLimit('user1@example.com', config)
      checkRateLimit('user1@example.com', config)

      const user1Result = checkRateLimit('user1@example.com', config)
      expect(user1Result.allowed).toBe(false)

      const user2Result = checkRateLimit('user2@example.com', config)
      expect(user2Result.allowed).toBe(true)
    })
  })

  describe('resetRateLimit', () => {
    it('clears rate limit for identifier', () => {
      const config = { maxAttempts: 2, windowMs: 60000 }

      checkRateLimit('test@example.com', config)
      checkRateLimit('test@example.com', config)

      let result = checkRateLimit('test@example.com', config)
      expect(result.allowed).toBe(false)

      resetRateLimit('test@example.com')

      result = checkRateLimit('test@example.com', config)
      expect(result.allowed).toBe(true)
    })

    it('only resets specific identifier', () => {
      const config = { maxAttempts: 2, windowMs: 60000 }

      checkRateLimit('user1@example.com', config)
      checkRateLimit('user1@example.com', config)
      checkRateLimit('user2@example.com', config)
      checkRateLimit('user2@example.com', config)

      resetRateLimit('user1@example.com')

      const user1Result = checkRateLimit('user1@example.com', config)
      expect(user1Result.allowed).toBe(true)

      const user2Result = checkRateLimit('user2@example.com', config)
      expect(user2Result.allowed).toBe(false)
    })
  })

  describe('clearAllRateLimits', () => {
    it('clears all rate limits across all stores', () => {
      const config = { maxAttempts: 2, windowMs: 60000 }

      checkRateLimit('user1@example.com', config, 'login')
      checkRateLimit('user1@example.com', config, 'login')
      checkRateLimit('user2@example.com', config, 'signup')
      checkRateLimit('user2@example.com', config, 'signup')

      clearAllRateLimits()

      const loginResult = checkRateLimit('user1@example.com', config, 'login')
      expect(loginResult.allowed).toBe(true)

      const signupResult = checkRateLimit('user2@example.com', config, 'signup')
      expect(signupResult.allowed).toBe(true)
    })
  })
})
