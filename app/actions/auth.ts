'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter'
import { getClientIP } from '@/lib/get-client-ip'
import { headers } from 'next/headers'

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

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user!.id,
      name,
      email
    })

  if (profileError) {
    return { error: 'Failed to create user profile' }
  }

  return { success: true }
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

  const rateLimitResult = checkRateLimit(email, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000
  }, 'login')

  if (!rateLimitResult.allowed) {
    return {
      error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  resetRateLimit(email, 'login')
  return { success: true }
}

export async function logOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}
