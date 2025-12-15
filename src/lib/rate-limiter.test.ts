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

  describe('L-SC-004: Rate Limiting Compliance', () => {
    describe('signUp rate limit (1 hour window)', () => {
      describe('Typical', () => {
        it('allows 3 attempts within 1 hour', () => {
          const ip = '192.168.1.1'
          const config = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }

          for (let i = 0; i < 3; i++) {
            const result = checkRateLimit(ip, config, 'signup')
            expect(result.allowed).toBe(true)
          }
        })

        it('resets after 1 hour window expires', () => {
          const ip = '192.168.1.2'
          const config = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }

          for (let i = 0; i < 3; i++) {
            checkRateLimit(ip, config, 'signup')
          }

          const blockedResult = checkRateLimit(ip, config, 'signup')
          expect(blockedResult.allowed).toBe(false)

          vi.advanceTimersByTime(60 * 60 * 1000 + 1)

          const allowedResult = checkRateLimit(ip, config, 'signup')
          expect(allowedResult.allowed).toBe(true)
        })

        it('tracks different IPs independently', () => {
          const config = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }

          for (let i = 0; i < 3; i++) {
            checkRateLimit('192.168.1.3', config, 'signup')
          }

          const ip1Result = checkRateLimit('192.168.1.3', config, 'signup')
          expect(ip1Result.allowed).toBe(false)

          const ip2Result = checkRateLimit('192.168.1.4', config, 'signup')
          expect(ip2Result.allowed).toBe(true)
        })
      })

      describe('Boundary', () => {
        it('blocks 4th signup attempt within 1 hour', () => {
          const ip = '192.168.2.1'
          const config = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }

          for (let i = 0; i < 3; i++) {
            checkRateLimit(ip, config, 'signup')
          }

          const result = checkRateLimit(ip, config, 'signup')
          expect(result.allowed).toBe(false)
          if (!result.allowed) {
            expect(result.retryAfter).toBeGreaterThan(0)
            expect(result.retryAfter).toBeLessThanOrEqual(3600)
          }
        })

        it('provides accurate retry-after seconds', () => {
          const ip = '192.168.2.2'
          const config = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }

          for (let i = 0; i < 3; i++) {
            checkRateLimit(ip, config, 'signup')
          }

          vi.advanceTimersByTime(30 * 60 * 1000)

          const result = checkRateLimit(ip, config, 'signup')
          expect(result.allowed).toBe(false)
          if (!result.allowed) {
            expect(result.retryAfter).toBe(1800)
          }
        })

        it('allows exactly at window boundary', () => {
          const ip = '192.168.2.3'
          const config = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }

          for (let i = 0; i < 3; i++) {
            checkRateLimit(ip, config, 'signup')
          }

          vi.advanceTimersByTime(60 * 60 * 1000)

          const result = checkRateLimit(ip, config, 'signup')
          expect(result.allowed).toBe(true)
        })
      })

      describe('Attack', () => {
        it('prevents rapid signup attempts from same IP', () => {
          const ip = 'attacker-ip-1'
          const config = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }

          for (let i = 0; i < 10; i++) {
            checkRateLimit(ip, config, 'signup')
          }

          const result = checkRateLimit(ip, config, 'signup')
          expect(result.allowed).toBe(false)
        })

        it('blocks brute force signup with multiple failed attempts', () => {
          const ip = 'attacker-ip-2'
          const config = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }

          for (let i = 0; i < 3; i++) {
            checkRateLimit(ip, config, 'signup')
          }

          for (let i = 0; i < 5; i++) {
            const result = checkRateLimit(ip, config, 'signup')
            expect(result.allowed).toBe(false)
          }
        })

        it('maintains block until window expires despite continuous attempts', () => {
          const ip = 'attacker-ip-3'
          const config = { maxAttempts: 3, windowMs: 60 * 60 * 1000 }

          for (let i = 0; i < 3; i++) {
            checkRateLimit(ip, config, 'signup')
          }

          vi.advanceTimersByTime(30 * 60 * 1000)

          for (let i = 0; i < 5; i++) {
            const result = checkRateLimit(ip, config, 'signup')
            expect(result.allowed).toBe(false)
          }

          vi.advanceTimersByTime(30 * 60 * 1000 + 1)

          const result = checkRateLimit(ip, config, 'signup')
          expect(result.allowed).toBe(true)
        })
      })
    })

    describe('uploadCSV rate limit (1 minute window)', () => {
      describe('Typical', () => {
        it('allows 10 attempts within 1 minute', () => {
          const userId = 'test-user-id-1'
          const config = { maxAttempts: 10, windowMs: 60 * 1000 }

          for (let i = 0; i < 10; i++) {
            const result = checkRateLimit(userId, config, 'csv-upload')
            expect(result.allowed).toBe(true)
          }
        })

        it('resets after 1 minute window expires', () => {
          const userId = 'test-user-id-2'
          const config = { maxAttempts: 10, windowMs: 60 * 1000 }

          for (let i = 0; i < 10; i++) {
            checkRateLimit(userId, config, 'csv-upload')
          }

          const blockedResult = checkRateLimit(userId, config, 'csv-upload')
          expect(blockedResult.allowed).toBe(false)

          vi.advanceTimersByTime(60 * 1000 + 1)

          const allowedResult = checkRateLimit(userId, config, 'csv-upload')
          expect(allowedResult.allowed).toBe(true)
        })

        it('tracks different users independently', () => {
          const config = { maxAttempts: 10, windowMs: 60 * 1000 }

          for (let i = 0; i < 10; i++) {
            checkRateLimit('user-a', config, 'csv-upload')
          }

          const userAResult = checkRateLimit('user-a', config, 'csv-upload')
          expect(userAResult.allowed).toBe(false)

          const userBResult = checkRateLimit('user-b', config, 'csv-upload')
          expect(userBResult.allowed).toBe(true)
        })
      })

      describe('Boundary', () => {
        it('blocks 11th CSV upload within 1 minute', () => {
          const userId = 'test-user-id-3'
          const config = { maxAttempts: 10, windowMs: 60 * 1000 }

          for (let i = 0; i < 10; i++) {
            checkRateLimit(userId, config, 'csv-upload')
          }

          const result = checkRateLimit(userId, config, 'csv-upload')
          expect(result.allowed).toBe(false)
          if (!result.allowed) {
            expect(result.retryAfter).toBeGreaterThan(0)
            expect(result.retryAfter).toBeLessThanOrEqual(60)
          }
        })

        it('provides accurate retry-after seconds', () => {
          const userId = 'test-user-id-4'
          const config = { maxAttempts: 10, windowMs: 60 * 1000 }

          for (let i = 0; i < 10; i++) {
            checkRateLimit(userId, config, 'csv-upload')
          }

          vi.advanceTimersByTime(30 * 1000)

          const result = checkRateLimit(userId, config, 'csv-upload')
          expect(result.allowed).toBe(false)
          if (!result.allowed) {
            expect(result.retryAfter).toBe(30)
          }
        })

        it('allows exactly at window boundary', () => {
          const userId = 'test-user-id-5'
          const config = { maxAttempts: 10, windowMs: 60 * 1000 }

          for (let i = 0; i < 10; i++) {
            checkRateLimit(userId, config, 'csv-upload')
          }

          vi.advanceTimersByTime(60 * 1000)

          const result = checkRateLimit(userId, config, 'csv-upload')
          expect(result.allowed).toBe(true)
        })
      })

      describe('Attack', () => {
        it('prevents rapid CSV upload attempts from same user', () => {
          const userId = 'attacker-user-1'
          const config = { maxAttempts: 10, windowMs: 60 * 1000 }

          for (let i = 0; i < 20; i++) {
            checkRateLimit(userId, config, 'csv-upload')
          }

          const result = checkRateLimit(userId, config, 'csv-upload')
          expect(result.allowed).toBe(false)
        })

        it('blocks flood attack with continuous uploads', () => {
          const userId = 'attacker-user-2'
          const config = { maxAttempts: 10, windowMs: 60 * 1000 }

          for (let i = 0; i < 10; i++) {
            checkRateLimit(userId, config, 'csv-upload')
          }

          for (let i = 0; i < 5; i++) {
            const result = checkRateLimit(userId, config, 'csv-upload')
            expect(result.allowed).toBe(false)
          }
        })

        it('maintains block until window expires despite continuous attempts', () => {
          const userId = 'attacker-user-3'
          const config = { maxAttempts: 10, windowMs: 60 * 1000 }

          for (let i = 0; i < 10; i++) {
            checkRateLimit(userId, config, 'csv-upload')
          }

          vi.advanceTimersByTime(30 * 1000)

          for (let i = 0; i < 5; i++) {
            const result = checkRateLimit(userId, config, 'csv-upload')
            expect(result.allowed).toBe(false)
          }

          vi.advanceTimersByTime(30 * 1000 + 1)

          const result = checkRateLimit(userId, config, 'csv-upload')
          expect(result.allowed).toBe(true)
        })
      })
    })
  })
})
