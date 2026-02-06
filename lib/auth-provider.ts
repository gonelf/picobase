import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth/next'
import { getSession as getSupertokensSession } from './session'
import { authOptions } from './nextauth'

export type AuthSession = {
    user: {
        id: string
        email: string
        firstName?: string
        lastName?: string
        name?: string | null
    }
} | null

/**
 * Unified session getter that works with both SuperTokens and NextAuth
 * based on the AUTH_PROVIDER environment variable
 */
export async function getAuthSession(): Promise<AuthSession> {
    const provider = process.env.AUTH_PROVIDER || 'supertokens'

    if (provider === 'nextauth') {
        return getNextAuthSession()
    }

    // Default to SuperTokens
    return getSupertokensSession()
}

/**
 * Get session from NextAuth
 */
async function getNextAuthSession(): Promise<AuthSession> {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return null
        }

        return {
            user: {
                id: session.user.id as string,
                email: session.user.email as string,
                name: session.user.name,
                firstName: '',
                lastName: '',
            }
        }
    } catch (error) {
        console.error('Error getting NextAuth session:', error)
        return null
    }
}
