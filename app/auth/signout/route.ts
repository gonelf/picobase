import { NextResponse } from 'next/server'
import { clearSession, getSession } from '@/lib/auth-session'
import { workos } from '@/lib/workos'
import { getBaseUrl } from '@/lib/workos'

export async function GET() {
  const session = await getSession()

  if (session?.sessionId) {
    try {
      await workos.userManagement.revokeSession({
        sessionId: session.sessionId,
      })
    } catch (error) {
      console.error('Failed to revoke session:', error)
    }
  }

  await clearSession()
  return NextResponse.redirect(new URL('/auth/signin', getBaseUrl()))
}
