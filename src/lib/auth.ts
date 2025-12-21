import type { NextAuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

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

        const authUser = await prisma.authUser.findUnique({
          where: { email: credentials.email.toLowerCase() }
        })

        if (!authUser) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, authUser.passwordHash)

        if (!isValid) {
          return null
        }

        const userProfile = await prisma.user.findUnique({
          where: { id: authUser.id },
          select: { name: true }
        })

        return {
          id: authUser.id,
          email: authUser.email,
          name: userProfile?.name || authUser.email
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
