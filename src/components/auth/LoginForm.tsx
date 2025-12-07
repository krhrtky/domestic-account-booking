'use client'

import { useFormStatus } from 'react-dom'
import { logIn } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? 'Logging in...' : 'Log In'}
    </button>
  )
}

export function LoginForm() {
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    const result = await logIn(formData)
    if (result.error) {
      alert(result.error)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <SubmitButton />
    </form>
  )
}
