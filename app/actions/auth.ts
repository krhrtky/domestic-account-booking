'use server'

import { z } from 'zod'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter'
import { getClientIP } from '@/lib/get-client-ip'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

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
  // L-SC-004: Signup rate limit - 3 attempts per 1 hour (per IP)
  const rateLimitResult = checkRateLimit(clientIP, {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000
  }, 'signup')

  if (!rateLimitResult.allowed) {
    return {
      error: `アカウント作成の試行回数が上限を超えました。${rateLimitResult.retryAfter}秒後に再試行してください。`
    }
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.authUser.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      return { error: 'このメールアドレスは既に登録されています' }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Create auth user and application user in a transaction
    await prisma.$transaction(async (tx) => {
      const authUser = await tx.authUser.create({
        data: {
          email: normalizedEmail,
          passwordHash
        }
      })

      await tx.user.create({
        data: {
          id: authUser.id,
          name,
          email: normalizedEmail
        }
      })
    })

    return { success: true }
  } catch (error) {
    return { error: 'アカウントの作成に失敗しました' }
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

  const authUser = await prisma.authUser.findUnique({
    where: { email: normalizedEmail }
  })

  if (!authUser) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  const isValid = await bcrypt.compare(password, authUser.passwordHash)

  if (!isValid) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  resetRateLimit(normalizedEmail, 'login')
  return { success: true, userId: authUser.id }
}

export async function logOut() {
  return { success: true }
}
