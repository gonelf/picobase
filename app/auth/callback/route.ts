import { NextRequest, NextResponse } from 'next/server'
import { setSessionCookie } from '@/lib/auth-session'
import { getBaseUrl } from '@/lib/workos'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/auth/signin?error=missing_code', getBaseUrl()))
  }

  try {
    await setSessionCookie(code)
    return NextResponse.redirect(new URL('/dashboard', getBaseUrl()))
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', getBaseUrl()))
  }
}
