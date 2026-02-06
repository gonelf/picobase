import { NextRequest, NextResponse } from 'next/server'

const INSTANCES_DOMAIN = process.env.INSTANCES_DOMAIN || 'localhost:3001'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Check if this is a subdomain request for an instance
  // Extract subdomain: {subdomain}.picobase.com -> subdomain
  const subdomain = hostname.replace(`.${INSTANCES_DOMAIN}`, '')

  // If this is a subdomain request (not the main domain)
  if (subdomain && subdomain !== INSTANCES_DOMAIN && subdomain !== hostname && !hostname.startsWith('www.')) {
    // Rewrite to proxy route with subdomain in header
    const url = request.nextUrl.clone()
    url.pathname = `/api/proxy${url.pathname}`

    const response = NextResponse.rewrite(url)
    response.headers.set('x-instance-subdomain', subdomain)

    return response
  }

  // Continue with existing authentication middleware for platform routes
  const provider = process.env.AUTH_PROVIDER || 'supertokens'

  // Check session based on provider
  let hasSession = false

  if (provider === 'nextauth') {
    // NextAuth uses 'app-session-token' cookie
    hasSession = request.cookies.has('app-session-token') ||
      request.cookies.has('__Secure-app-session-token')
  } else {
    // SuperTokens uses 'sAccessToken' cookie
    hasSession = request.cookies.has('sAccessToken')
  }

  // Check if user is on an auth page (different paths for different providers)
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  // Redirect to auth if trying to access dashboard without session
  if (isDashboard && !hasSession) {
    const redirectUrl = provider === 'nextauth' ? '/login' : '/auth'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Redirect to dashboard if already authenticated and on auth page
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
