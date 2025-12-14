'use server'

import { z } from 'zod'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter'
import { getClientIP } from '@/lib/get-client-ip'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { query, getClient } from '@/lib/db'

const SignUpSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください')
})

const LogInSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください')
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
  // L-SC-004: Signup rate limit - 3 attempts per 15 minutes (per IP)
  const rateLimitResult = checkRateLimit(clientIP, {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000
  }, 'signup')

  if (!rateLimitResult.allowed) {
    return {
      error: `アカウント作成の試行回数が上限を超えました。${rateLimitResult.retryAfter}秒後に再試行してください。`
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
      return { error: 'このメールアドレスは既に登録されています' }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const authResult = await client.query<{ id: string }>(
      'INSERT INTO auth.users (id, email, password_hash) VALUES (gen_random_uuid(), $1, $2) RETURNING id',
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
    return { error: 'アカウントの作成に失敗しました' }
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

  // L-SC-004: Login rate limit - 5 attempts per 15 minutes (per email)
  const rateLimitResult = checkRateLimit(normalizedEmail, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000
  }, 'login')

  if (!rateLimitResult.allowed) {
    return {
      error: `ログイン試行回数が上限を超えました。${rateLimitResult.retryAfter}秒後に再試行してください。`
    }
  }

  const result = await query<{ id: string; password_hash: string }>(
    'SELECT id, password_hash FROM auth.users WHERE email = $1',
    [normalizedEmail]
  )

  if (result.rows.length === 0) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  const user = result.rows[0]
  const isValid = await bcrypt.compare(password, user.password_hash)

  if (!isValid) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  resetRateLimit(normalizedEmail, 'login')
  return { success: true, userId: user.id }
}

export async function logOut() {
  return { success: true }
}
