'use client'

import { signOut } from 'supertokens-auth-react/recipe/session'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
    const router = useRouter()

    const onLogout = async () => {
        await signOut()
        router.push('/auth')
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
