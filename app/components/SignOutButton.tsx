'use client'

import { signOut as supertokensSignOut } from 'supertokens-auth-react/recipe/session'
import { signOut as nextAuthSignOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getAuthUrl } from '@/lib/auth-utils'

export default function SignOutButton() {
    const router = useRouter()
    const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'supertokens'

    const onLogout = async () => {
        if (provider === 'nextauth') {
            await nextAuthSignOut({ redirect: false })
        } else {
            await supertokensSignOut()
        }
        router.push(getAuthUrl('signin'))
    }

    return (
        <button
            onClick={onLogout}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
            Sign out
        </button>
    )
}
