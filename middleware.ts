import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('sAccessToken')
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  if (isDashboard && !hasSession) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
