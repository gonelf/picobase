'use client'

import React, { useEffect, useState } from 'react'
import { getRoutingComponent, canHandleRoute } from 'supertokens-auth-react/ui'
import { EmailPasswordPreBuiltUI } from 'supertokens-auth-react/recipe/emailpassword/prebuiltui'
import { redirectToAuth } from 'supertokens-auth-react'
import SuperTokensReact from 'supertokens-auth-react'

export default function Auth() {
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (canHandleRoute([EmailPasswordPreBuiltUI]) === false) {
                // Check if we are on a legacy path like /auth/signin or just a typo
                // Redirect to default auth route
                redirectToAuth({ redirectBack: false })
            } else {
                setLoaded(true)
            }
        }
    }, [])

    if (!loaded) {
        return null
    }

    const component = getRoutingComponent([EmailPasswordPreBuiltUI])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-zinc-900">
            {component}
        </div>
    )
}
