import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                       req.nextUrl.pathname.startsWith('/signup')
    const isInvitePage = req.nextUrl.pathname.startsWith('/invite/')

    if (req.nextauth.token && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                          req.nextUrl.pathname.startsWith('/signup')
        const isInvitePage = req.nextUrl.pathname.startsWith('/invite/')
        const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')

        if (isAuthPage || isInvitePage || isApiAuth) {
          return true
        }

        return !!token
      }
    },
    pages: {
      signIn: '/login',
    }
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
