/**
 * Get the appropriate auth URL based on the configured provider
 */
export function getAuthUrl(path: 'signin' | 'signup' | 'signout' = 'signin'): string {
    const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'supertokens'

    if (provider === 'nextauth') {
        // NextAuth only has signin page, signup would need to be created separately
        return '/auth-nextauth/signin'
    }

    // SuperTokens paths
    return `/auth/${path}`
}
