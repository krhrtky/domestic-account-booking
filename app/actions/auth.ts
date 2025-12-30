'use server'

import { z } from 'zod'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

const LogInSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください')
})

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
    'SELECT id, password_hash FROM auth_users WHERE email = $1',
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
