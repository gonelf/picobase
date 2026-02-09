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

  // Skip auth checks for API routes (they handle their own auth)
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Continue with existing authentication middleware for platform routes
  const provider = process.env.AUTH_PROVIDER || 'nextauth'

  // Check session based on provider
  let hasSession = false

  try {
    if (provider === 'nextauth') {
      // NextAuth uses multiple possible cookie names depending on environment
      hasSession = request.cookies.has('app-session-token') ||
        request.cookies.has('__Secure-app-session-token') ||
        request.cookies.has('next-auth.session-token') ||
        request.cookies.has('__Secure-next-auth.session-token')
    } else {
      // SuperTokens uses 'sAccessToken' cookie
      hasSession = request.cookies.has('sAccessToken')
    }
  } catch (error) {
    // Edge middleware can't use pino — structured JSON for log aggregation
    console.error(JSON.stringify({ level: 'error', module: 'Middleware', msg: 'Session check error', err: String(error) }))
    hasSession = false
  }

  // Check if user is on an auth page (different paths for different providers)
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isHomePage = request.nextUrl.pathname === '/'

  // Homepage is public (waitlist page) — no redirects
  if (isHomePage) {
    return NextResponse.next()
  }

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
  // Match everything except static files and images
  // We need to match /api and /favicon.ico to proxy them for subdomains
  matcher: ['/((?!_next/static|_next/image).*)'],
}
