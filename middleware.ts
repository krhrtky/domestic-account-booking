import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const isAuthPage = req.nextUrl.pathname.startsWith('/login')
    const isHomePage = req.nextUrl.pathname === '/'

    if (req.nextauth.token && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (req.nextauth.token && isHomePage) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/login')
        const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')
        const isHomePage = req.nextUrl.pathname === '/'

        if (isAuthPage || isApiAuth || isHomePage) {
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
