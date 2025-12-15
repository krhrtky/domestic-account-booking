'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/lib/hooks/useToast'
import { logIn } from '@/app/actions/auth'
import FormField from '@/components/ui/FormField'
import LoadingButton from '@/components/ui/LoadingButton'

interface FieldErrors {
  email?: string
  password?: string
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  function validateFields(): boolean {
    const newErrors: FieldErrors = {}

    if (!email) {
      newErrors.email = 'メールアドレスを入力してください'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'メールアドレスの形式が正しくありません'
    }

    if (!password) {
      newErrors.password = 'パスワードを入力してください'
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
    const result = await logIn(formData)

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
      toast.error('ログインに失敗しました')
      setIsLoading(false)
    } else {
      toast.success('ログインしました')
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="メールアドレス"
        name="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <FormField
        label="パスワード"
        name="password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <LoadingButton
        type="submit"
        isLoading={isLoading}
        loadingText="ログイン中..."
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        ログイン
      </LoadingButton>
    </form>
  )
}
