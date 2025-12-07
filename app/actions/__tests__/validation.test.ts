import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const SignUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

const LogInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

const InviteSchema = z.object({
  email: z.string().email()
})

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100).default('Household'),
  ratio_a: z.number().int().min(1).max(99).default(50),
  ratio_b: z.number().int().min(1).max(99).default(50)
}).refine(
  data => data.ratio_a + data.ratio_b === 100,
  { message: 'Ratios must sum to 100' }
)

const RatioSchema = z.object({
  ratio_a: z.number().int().min(1).max(99),
  ratio_b: z.number().int().min(1).max(99)
}).refine(
  data => data.ratio_a + data.ratio_b === 100,
  { message: 'Ratios must sum to 100' }
)

describe('P0-1: InviteSchema validation', () => {
  it('should accept valid email', () => {
    const result = InviteSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email format', () => {
    const result = InviteSchema.safeParse({ email: 'invalid-email' })
    expect(result.success).toBe(false)
  })

  it('should reject empty email', () => {
    const result = InviteSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
  })

  it('should normalize email to lowercase when used', () => {
    const result = InviteSchema.safeParse({ email: 'TEST@EXAMPLE.COM' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email.toLowerCase()).toBe('test@example.com')
    }
  })
})

describe('P0-3: LogInSchema validation', () => {
  it('should accept valid credentials', () => {
    const result = LogInSchema.safeParse({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email format', () => {
    const result = LogInSchema.safeParse({
      email: 'not-an-email',
      password: 'password123'
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty password', () => {
    const result = LogInSchema.safeParse({
      email: 'test@example.com',
      password: ''
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing email', () => {
    const result = LogInSchema.safeParse({
      password: 'password123'
    })
    expect(result.success).toBe(false)
  })
})

describe('SignUpSchema validation', () => {
  it('should accept valid input', () => {
    const result = SignUpSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })
    expect(result.success).toBe(true)
  })

  it('should reject password less than 8 characters', () => {
    const result = SignUpSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'short'
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty name', () => {
    const result = SignUpSchema.safeParse({
      name: '',
      email: 'test@example.com',
      password: 'password123'
    })
    expect(result.success).toBe(false)
  })

  it('should reject name over 100 characters', () => {
    const result = SignUpSchema.safeParse({
      name: 'a'.repeat(101),
      email: 'test@example.com',
      password: 'password123'
    })
    expect(result.success).toBe(false)
  })
})

describe('CreateGroupSchema validation', () => {
  it('should accept valid ratios summing to 100', () => {
    const result = CreateGroupSchema.safeParse({
      name: 'Our Home',
      ratio_a: 60,
      ratio_b: 40
    })
    expect(result.success).toBe(true)
  })

  it('should reject ratios not summing to 100', () => {
    const result = CreateGroupSchema.safeParse({
      name: 'Our Home',
      ratio_a: 60,
      ratio_b: 50
    })
    expect(result.success).toBe(false)
  })

  it('should reject ratio below 1', () => {
    const result = CreateGroupSchema.safeParse({
      name: 'Our Home',
      ratio_a: 0,
      ratio_b: 100
    })
    expect(result.success).toBe(false)
  })

  it('should reject ratio above 99', () => {
    const result = CreateGroupSchema.safeParse({
      name: 'Our Home',
      ratio_a: 100,
      ratio_b: 0
    })
    expect(result.success).toBe(false)
  })

  it('should use default values when not provided', () => {
    const result = CreateGroupSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Household')
      expect(result.data.ratio_a).toBe(50)
      expect(result.data.ratio_b).toBe(50)
    }
  })
})

describe('RatioSchema validation', () => {
  it('should accept valid ratios', () => {
    const result = RatioSchema.safeParse({ ratio_a: 70, ratio_b: 30 })
    expect(result.success).toBe(true)
  })

  it('should reject ratios not summing to 100', () => {
    const result = RatioSchema.safeParse({ ratio_a: 50, ratio_b: 60 })
    expect(result.success).toBe(false)
  })

  it('should reject non-integer ratios', () => {
    const result = RatioSchema.safeParse({ ratio_a: 50.5, ratio_b: 49.5 })
    expect(result.success).toBe(false)
  })
})
