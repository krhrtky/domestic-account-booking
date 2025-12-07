'use server'

import { z } from 'zod'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter'
import { getClientIP } from '@/lib/get-client-ip'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { query, getClient } from '@/lib/db'

const SignUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

const LogInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export async function signUp(formData: FormData) {
  const parsed = SignUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password')
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password } = parsed.data
  const normalizedEmail = email.toLowerCase()

  const headersList = await headers()
  const clientIP = getClientIP(headersList)
  const rateLimitResult = checkRateLimit(clientIP, {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000
  }, 'signup')

  if (!rateLimitResult.allowed) {
    return {
      error: `Too many signup attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`
    }
  }

  const client = await getClient()

  try {
    await client.query('BEGIN')

    const existingUser = await client.query(
      'SELECT id FROM auth.users WHERE email = $1',
      [normalizedEmail]
    )

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK')
      return { error: 'Email already registered' }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const authResult = await client.query<{ id: string }>(
      'INSERT INTO auth.users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [normalizedEmail, passwordHash]
    )

    const userId = authResult.rows[0].id

    await client.query(
      'INSERT INTO users (id, name, email) VALUES ($1, $2, $3)',
      [userId, name, normalizedEmail]
    )

    await client.query('COMMIT')

    return { success: true }
  } catch (error) {
    await client.query('ROLLBACK')
    return { error: 'Failed to create user account' }
  } finally {
    client.release()
  }
}

export async function logIn(formData: FormData) {
  const parsed = LogInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase()

  const rateLimitResult = checkRateLimit(normalizedEmail, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000
  }, 'login')

  if (!rateLimitResult.allowed) {
    return {
      error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`
    }
  }

  const result = await query<{ id: string; password_hash: string }>(
    'SELECT id, password_hash FROM auth.users WHERE email = $1',
    [normalizedEmail]
  )

  if (result.rows.length === 0) {
    return { error: 'Invalid email or password' }
  }

  const user = result.rows[0]
  const isValid = await bcrypt.compare(password, user.password_hash)

  if (!isValid) {
    return { error: 'Invalid email or password' }
  }

  resetRateLimit(normalizedEmail, 'login')
  return { success: true, userId: user.id }
}

export async function logOut() {
  return { success: true }
}
