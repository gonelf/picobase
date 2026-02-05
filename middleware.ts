import { NextRequest, NextResponse } from 'next/server'
import { workos } from './lib/workos'

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('wos-session')
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  let isAuthenticated = false

  if (sessionCookie) {
    try {
      await workos.userManagement.authenticateWithSessionCookie({
        sessionCookie: sessionCookie.value,
      })
      isAuthenticated = true
    } catch (error) {
      // Session is invalid or expired
      isAuthenticated = false
    }
  }

  if (isDashboard && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  if (isAuthPage && isAuthenticated && !request.nextUrl.pathname.startsWith('/auth/signout')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/callback|auth/signout).*)'],
}
