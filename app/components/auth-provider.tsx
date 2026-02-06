'use client'

import { SuperTokensProvider as STProvider } from './supertokens-provider'
import { NextAuthProvider as NAProvider } from './nextauth-provider'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Use the build-time injected value
    const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'supertokens'

    if (provider === 'nextauth') {
        return <NAProvider>{children}</NAProvider>
    }

    return <STProvider>{children}</STProvider>
}
