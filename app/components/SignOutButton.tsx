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
            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
        >
            Sign Out
        </button>
    )
}
