import { cookies } from 'next/headers'
import { workos } from './workos'

const SESSION_COOKIE_NAME = 'wos-session'

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie) {
    return null
  }

  try {
    const { user, sessionId, organizationId } = await workos.userManagement.authenticateWithSessionCookie({
      sessionCookie: sessionCookie.value,
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
      sessionId,
      organizationId,
    }
  } catch (error) {
    console.error('Failed to authenticate session:', error)
    return null
  }
}

export async function setSessionCookie(code: string) {
  try {
    const { sessionId } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: process.env.WORKOS_CLIENT_ID!,
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return sessionId
  } catch (error) {
    console.error('Failed to authenticate with code:', error)
    throw error
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
