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
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-white dark:text-gray-300 dark:hover:text-white bg-gray-100 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 dark:bg-gray-800 dark:hover:bg-gradient-to-r rounded-lg transition-all duration-300"
        >
            Sign Out
        </button>
    )
}
