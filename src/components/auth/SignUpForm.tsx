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
      newErrors.name = '名前を入力してください'
    }

    if (!email) {
      newErrors.email = 'メールアドレスを入力してください'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'メールアドレスの形式が正しくありません'
    }

    if (!password) {
      newErrors.password = 'パスワードを入力してください'
    } else if (password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください'
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
      toast.error('アカウントは作成されましたが、ログインに失敗しました。再度ログインしてください。')
      router.push('/login')
    } else {
      toast.success('アカウントを作成しました')
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
      >
        <FormField
          label="名前"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
      </div>

      <div
        className="opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
      >
        <FormField
          label="メールアドレス"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
      </div>

      <div
        className="opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
      >
        <FormField
          label="パスワード"
          name="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
      </div>

      <div
        className="pt-2 opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
      >
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="アカウント作成中..."
          className="w-full group"
        >
          <span>アカウント作成</span>
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </LoadingButton>
      </div>
    </form>
  )
}
