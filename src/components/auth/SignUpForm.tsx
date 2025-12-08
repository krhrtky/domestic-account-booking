'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { signUp } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/hooks/useToast'
import FormField from '@/components/ui/FormField'
import LoadingButton from '@/components/ui/LoadingButton'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
}

export function SignUpForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  function validateFields(): boolean {
    const newErrors: FieldErrors = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateFields()) {
      return
    }

    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signUp(formData)

    if (result.error) {
      toast.error(result.error)
      setIsLoading(false)
      return
    }

    const signInResult = await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    if (signInResult?.error) {
      toast.error('Account created, but login failed. Please try logging in.')
      router.push('/login')
    } else {
      toast.success('Account created successfully')
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Name"
        name="name"
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <LoadingButton
        type="submit"
        isLoading={isLoading}
        loadingText="Creating account..."
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Sign Up
      </LoadingButton>
    </form>
  )
}
