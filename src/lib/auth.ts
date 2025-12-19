import type { NextAuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

interface AuthUser extends User {
  id: string
  email: string
  name: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const result = await query<{ id: string; email: string; password_hash: string }>(
          'SELECT au.id, au.email, au.password_hash FROM custom_auth.users au WHERE au.email = $1',
          [credentials.email.toLowerCase()]
        )

        if (result.rows.length === 0) {
          return null
        }

        const user = result.rows[0]
        const isValid = await bcrypt.compare(credentials.password, user.password_hash)

        if (!isValid) {
          return null
        }

        const userProfile = await query<{ name: string }>(
          'SELECT name FROM users WHERE id = $1',
          [user.id]
        )

        return {
          id: user.id,
          email: user.email,
          name: userProfile.rows[0]?.name || user.email
        } as AuthUser
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
